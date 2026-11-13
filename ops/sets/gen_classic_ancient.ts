// Escribe classic_ancient.sql desde classic_ancient.ts: `bun ops/sets/gen_classic_ancient.ts > ops/sets/classic_ancient.sql`
import { KINDS, SETS } from './classic_ancient';

const hex = (n: number, w = 4) => n.toString(16).padStart(w, '0');
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;

let body = '';
SETS.forEach((s, i) => {
  const opts = [...s.standard, ...s.full];
  const piece = (g: number, n: number) => `'00000080-${hex(g)}-${hex(n)}-0000-000000000000'`;
  body += `  -- ${s.name} (set ${s.number})\n`;
  body += `  PERFORM pg_temp.add_set(${i}, ${lit(s.name)}::text, ${lit('Total ' + { str: 'Strength', agi: 'Agility', ene: 'Energy', vit: 'Vitality' }[s.stat])}::text,\n`;
  body += `    ARRAY[${s.pieces.map(([g, n]) => piece(g, n)).join(', ')}]::uuid[],\n`;
  body += `    ARRAY[${opts.map(([k]) => lit(KINDS[k].attr)).join(', ')}]::text[],\n`;
  body += `    ARRAY[${opts.map(([k, v]) => +(v * KINDS[k].scale + (KINDS[k].add ?? 0)).toFixed(6)).join(', ')}]::numeric[],\n`;
  body += `    ARRAY[${opts.map(([k]) => KINDS[k].aggregate).join(', ')}]::int[]);\n`;
});

const sql = `-- Fase 1: los 11 sets ancient clasicos (Mahes, Bragi, Alvis, Serket, Apis, Tyr, Khone, Surt, Harpy, Horus, Magni).
-- Generado por gen_classic_ancient.ts desde classic_ancient.ts: no se edita a mano.
-- Aplica con \`psql -v ON_ERROR_STOP=1 -f classic_ancient.sql\`; revierte con \`-v undo=1\`. Probar siempre primero en openmu_probe.
-- Una pieza que ya esta en otro set (los pendants y el Ring of Wind) entra con el discriminador siguiente (2).
\\set ON_ERROR_STOP on
BEGIN;
\\if :{?undo}
DELETE FROM config."ItemDefinitionItemSetGroup" WHERE "ItemSetGroupId"::text LIKE '0000ba5e-0001-001_-%' OR "ItemSetGroupId"::text LIKE '0000ba5e-0001-002_-%';
DELETE FROM config."ItemSetGroup" WHERE "Id"::text LIKE '0000ba5e-0001-001_-%' OR "Id"::text LIKE '0000ba5e-0001-002_-%'; -- borra en cascada ItemOfItemSet
DELETE FROM config."IncreasableItemOption" WHERE "Id"::text LIKE '0000ba5e-0005-001_-%' OR "Id"::text LIKE '0000ba5e-0005-002_-%';
DELETE FROM config."ItemOptionDefinition" WHERE "Id"::text LIKE '0000ba5e-0002-001_-%' OR "Id"::text LIKE '0000ba5e-0002-002_-%';
DELETE FROM config."PowerUpDefinition" WHERE "Id"::text LIKE '0000ba5e-0003-001_-%' OR "Id"::text LIKE '0000ba5e-0003-002_-%';
DELETE FROM config."PowerUpDefinitionValue" WHERE "Id"::text LIKE '0000ba5e-0004-001_-%' OR "Id"::text LIKE '0000ba5e-0004-002_-%';
\\else
CREATE FUNCTION pg_temp.add_set(idx int, set_name text, piece_attr text, pieces uuid[], attrs text[], vals numeric[], aggs int[]) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE
  cfg uuid := '00000001-0001-0000-0000-000000000000';
  opt_type uuid := '436d820f-6d50-429d-af63-bb0f59567dd1'; -- mismo tipo que usan los demas sets
  hi int := 16 + idx;
  fmt text := '0000ba5e-%s-%s-0000-%s';
  grp uuid; optdef uuid; piece_bonus uuid; attr uuid; p uuid; n int; disc int;
  pwr uuid; val uuid;
BEGIN
  SELECT i."BonusOptionId" INTO piece_bonus
    FROM config."ItemOfItemSet" i
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
\\endif
COMMIT;
`;
process.stdout.write(sql);
