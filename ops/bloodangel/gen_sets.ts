// Fase 3: escribe sets.sql (servidor) desde sets_s19.json, los 7 sets Bloodangel del ItemSetOption del S19.
//   bun ops/bloodangel/gen_sets.ts > ops/bloodangel/sets.sql
// OpenMU da las N-1 primeras opciones con N piezas y todas con el set completo, asi que el orden es: las del tramo de
// 2 piezas, las de 3, las de 4 y las del set completo. Los codigos del S19 sin numero en Season 6 (24 a 27 y 33) se
// reparten en varios atributos. Ver sets.ts para el cliente.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { KINDS, type Kind } from '../sets/classic_ancient';

export type SetS19 = { s19: number; name: string; stat: 'str' | 'agi' | 'ene' | 'vit'; pieces: [number, number][]; tiers: [number, number][][]; full: [number, number][] };
export const SETS: SetS19[] = JSON.parse(readFileSync(join(import.meta.dir, 'sets_s19.json'), 'utf8'));
/** Numero del primer set Bloodangel en el cliente (la fase 1 llego hasta 61). */
export const FIRST_CLIENT_SET = 62;

const S6: Record<number, Kind> = { 0: 'str', 1: 'agi', 2: 'ene', 3: 'vit', 5: 'minDmg', 6: 'maxDmg', 10: 'def', 11: 'life', 15: 'critRate', 16: 'critDmg', 17: 'excRate', 18: 'excDmg', 19: 'skill', 20: 'double', 21: 'ignore', 22: 'shield', 23: 'twoH' };
type Attr = { attr: string; value: number; aggregate: number };
const flat = (attrs: string[], v: number): Attr[] => attrs.map(attr => ({ attr, value: v, aggregate: 0 }));
const LATER: Record<number, (v: number) => Attr[]> = {
  24: v => flat(['Total Strength', 'Total Agility', 'Total Energy', 'Total Vitality'], v),
  25: v => flat(['Base Defense'], v),
  26: v => flat(['Minimum Physical Base Damage', 'Maximum Physical Base Damage'], v),
  27: v => flat(['Minimum Wizardry Base Damage', 'Maximum Wizardry Base Damage'], v),
  33: v => flat(['Minimum Wizardry Base Damage', 'Maximum Wizardry Base Damage', 'Minimum Curse Base Damage', 'Maximum Curse Base Damage'], v),
};
export function serverAttrs(code: number, value: number): Attr[] {
  const kind = S6[code];
  if (kind) { const k = KINDS[kind]; return [{ attr: k.attr, value: +(value * k.scale + (k.add ?? 0)).toFixed(6), aggregate: k.aggregate }]; }
  const later = LATER[code];
  if (!later) throw new Error(`codigo de set ${code} sin equivalencia`);
  return later(value);
}

const hex = (n: number, w = 4) => n.toString(16).padStart(w, '0');
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;
const STAT_ATTR = { str: 'Total Strength', agi: 'Total Agility', ene: 'Total Energy', vit: 'Total Vitality' };

if (import.meta.main) {
  let body = '';
  SETS.forEach((s, i) => {
    const opts = [...s.tiers.flat(), ...s.full].flatMap(([c, v]) => serverAttrs(c, v));
    body += `  -- ${s.name} (S19 ${s.s19}, cliente ${FIRST_CLIENT_SET + i})\n`;
    body += `  PERFORM pg_temp.add_set(${0x40 + i}, ${lit(s.name + "'s")}::text, ${lit(STAT_ATTR[s.stat])}::text,\n`;
    body += `    ARRAY[${s.pieces.map(([g, n]) => `'00000080-${hex(g)}-${hex(n)}-0000-000000000000'`).join(', ')}]::uuid[],\n`;
    body += `    ARRAY[${opts.map(o => lit(o.attr)).join(', ')}]::text[],\n`;
    body += `    ARRAY[${opts.map(o => o.value).join(', ')}]::numeric[],\n`;
    body += `    ARRAY[${opts.map(o => o.aggregate).join(', ')}]::int[]);\n`;
  });
  const like = (k: string) => `"Id"::text LIKE '0000ba5e-${k}-004_-%'`;
  process.stdout.write(`-- Fase 3: los 7 sets Bloodangel. Generado por gen_sets.ts desde sets_s19.json: no se edita a mano.
-- Aplica con \`psql -v ON_ERROR_STOP=1 -f sets.sql\`; revierte con \`-v undo=1\`. Probar siempre primero en openmu_probe.
\\set ON_ERROR_STOP on
BEGIN;
\\if :{?undo}
DELETE FROM config."ItemDefinitionItemSetGroup" WHERE "ItemSetGroupId"::text LIKE '0000ba5e-0001-004_-%';
DELETE FROM config."ItemSetGroup" WHERE ${like('0001')};
DELETE FROM config."IncreasableItemOption" WHERE ${like('0005')};
DELETE FROM config."ItemOptionDefinition" WHERE ${like('0002')};
DELETE FROM config."PowerUpDefinition" WHERE ${like('0003')};
DELETE FROM config."PowerUpDefinitionValue" WHERE ${like('0004')};
\\else
CREATE FUNCTION pg_temp.add_set(hi int, set_name text, piece_attr text, pieces uuid[], attrs text[], vals numeric[], aggs int[]) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE
  cfg uuid := '00000001-0001-0000-0000-000000000000';
  opt_type uuid := '436d820f-6d50-429d-af63-bb0f59567dd1';
  fmt text := '0000ba5e-%s-%s-0000-%s';
  grp uuid; optdef uuid; piece_bonus uuid; attr uuid; p uuid; n int; disc int; pwr uuid; val uuid;
BEGIN
  SELECT i."BonusOptionId" INTO piece_bonus FROM config."ItemOfItemSet" i
    JOIN config."IncreasableItemOption" o ON o."Id" = i."BonusOptionId"
    JOIN config."PowerUpDefinition" pu ON pu."Id" = o."PowerUpDefinitionId"
    JOIN config."AttributeDefinition" a ON a."Id" = pu."TargetAttributeId"
   WHERE a."Designation" = piece_attr LIMIT 1;
  IF piece_bonus IS NULL THEN RAISE EXCEPTION 'no hay opcion de pieza con %', piece_attr; END IF;
  FOREACH p IN ARRAY pieces LOOP
    IF NOT EXISTS (SELECT 1 FROM config."ItemDefinition" WHERE "Id" = p) THEN RAISE EXCEPTION 'falta el item % de %', p, set_name; END IF;
  END LOOP;
  grp := format(fmt, '0001', lpad(to_hex(hi), 4, '0'), lpad('1', 12, '0'))::uuid;
  optdef := format(fmt, '0002', lpad(to_hex(hi), 4, '0'), lpad('1', 12, '0'))::uuid;
  INSERT INTO config."ItemOptionDefinition" ("Id", "GameConfigurationId", "Name", "AddsRandomly", "AddChance", "MaximumOptionsPerItem")
    VALUES (optdef, cfg, set_name || ' (Ancient Set)', false, 0, 1);
  FOR n IN 1..array_length(attrs, 1) LOOP
    SELECT "Id" INTO attr FROM config."AttributeDefinition" WHERE "Designation" = attrs[n];
    IF attr IS NULL THEN RAISE EXCEPTION 'no existe el atributo %', attrs[n]; END IF;
    val := format(fmt, '0004', lpad(to_hex(hi), 4, '0'), lpad(n::text, 12, '0'))::uuid;
    pwr := format(fmt, '0003', lpad(to_hex(hi), 4, '0'), lpad(n::text, 12, '0'))::uuid;
    INSERT INTO config."PowerUpDefinitionValue" ("Id", "Value", "AggregateType") VALUES (val, vals[n], aggs[n]);
    INSERT INTO config."PowerUpDefinition" ("Id", "TargetAttributeId", "BoostId") VALUES (pwr, attr, val);
    INSERT INTO config."IncreasableItemOption" ("Id", "OptionTypeId", "PowerUpDefinitionId", "ItemOptionDefinitionId", "Number", "SubOptionType", "LevelType", "Weight")
      VALUES (format(fmt, '0005', lpad(to_hex(hi), 4, '0'), lpad(n::text, 12, '0'))::uuid, opt_type, pwr, optdef, n, 0, 0, 0);
  END LOOP;
  INSERT INTO config."ItemSetGroup" ("Id", "GameConfigurationId", "Name", "AlwaysApplies", "CountDistinct", "MinimumItemCount", "SetLevel", "OptionsId")
    VALUES (grp, cfg, set_name, false, true, 2, 0, optdef);
  n := 0;
  FOREACH p IN ARRAY pieces LOOP
    n := n + 1;
    SELECT coalesce(max("AncientSetDiscriminator"), 0) + 1 INTO disc FROM config."ItemOfItemSet" WHERE "ItemDefinitionId" = p;
    INSERT INTO config."ItemOfItemSet" ("Id", "ItemSetGroupId", "ItemDefinitionId", "BonusOptionId", "AncientSetDiscriminator")
      VALUES (format(fmt, '0006', lpad(to_hex(hi), 4, '0'), lpad(n::text, 12, '0'))::uuid, grp, p, piece_bonus, disc);
    INSERT INTO config."ItemDefinitionItemSetGroup" ("ItemSetGroupId", "ItemDefinitionId") VALUES (grp, p);
  END LOOP;
END $f$;
DO $$
BEGIN
${body}END $$;
SELECT count(*) || ' sets Bloodangel' FROM config."ItemSetGroup" WHERE ${like('0001')};
\\endif
COMMIT;
`);
}
