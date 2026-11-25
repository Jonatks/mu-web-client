// Fase S10: los sets de las generaciones Mastery 2 a 10 (Darkangel a Lightning), como los 7 de Bloodangel (fase 3).
//   bun ops/faseS/gen_mastery_sets.ts sql <carpeta de generaciones>          > ops/faseS/s10_sets.sql
//   bun ops/faseS/gen_mastery_sets.ts client <carpeta de generaciones> <Data/Local>   (en la VM, como client_sets.sh)
// Los sets del cliente siguen a los de Bloodangel (62 a 68): 69 en adelante, en el orden de las generaciones. En el
// servidor cada set lleva los ids 0000ba5e-000k-<hi>-..., hi desde 0x50.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { itemCode, itemSetNumbers, setItemSetNumber, setSetOption } from '../../tools/clientData/setFiles';
import { FIRST_CLIENT_SET, SETS as BLOOD, serverAttrs, type SetS19 } from '../bloodangel/gen_sets';
import { record } from '../bloodangel/client_sets';

const ORDER = ['darkangel', 'holyangel', 'soul', 'blue', 'silver', 'manticore', 'brilliant', 'apocalypse', 'lightning'];
// 0x50 on: the Bloodangel undo deletes 0x40 to 0x4f (`0000ba5e-0001-004_`).
const FIRST_HI = 0x50;
const FIRST_NUMBER = FIRST_CLIENT_SET + BLOOD.length;

/**
 * The Mastery codes of the S19 (itemsetoptiontext.bmd 120 to 134, and 31) as the codes Season 6 and the fase 3 already
 * know. 31 (triple damage) becomes double damage, the closest OpenMU has; 132 (damage reduction) and 133 (elemental
 * defense) have nothing in Season 6 and are left out.
 */
const MASTERY_CODE: Record<number, number | null> = {
  31: 20, 120: 26, 121: 27, 122: 25, 123: 18, 124: 16, 125: 11, 126: 19, 127: 0, 128: 1, 129: 2, 130: 24, 131: 33,
  132: null, 133: null, 134: 19,
};
const known = (opts: [number, number][]): [number, number][] =>
  opts.flatMap(([c, v]) => { const m = c in MASTERY_CODE ? MASTERY_CODE[c] : c; return m === null ? [] : [[m, v] as [number, number]]; });

export function masterySets(dir: string): SetS19[] {
  return ORDER.filter(g => existsSync(join(dir, g, 'sets_s19.json')))
    .flatMap(g => JSON.parse(readFileSync(join(dir, g, 'sets_s19.json'), 'utf8')) as SetS19[])
    .map(s => ({ ...s, tiers: s.tiers.map(known).filter(t => t.length), full: known(s.full) }));
}

const hex = (n: number, w = 4) => n.toString(16).padStart(w, '0');
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;
const STAT_ATTR = { str: 'Total Strength', agi: 'Total Agility', ene: 'Total Energy', vit: 'Total Vitality' };

function sql(sets: SetS19[]): string {
  const bloodSql = readFileSync(join(import.meta.dir, '../bloodangel/sets.sql'), 'utf8');
  const fn = bloodSql.slice(bloodSql.indexOf('CREATE FUNCTION'), bloodSql.indexOf('DO $$'));
  const his = sets.map((_, i) => `'${hex(FIRST_HI + i)}'`).join(',');
  const body = sets.map((s, i) => {
    const opts = [...s.tiers.flat(), ...s.full].flatMap(([c, v]) => serverAttrs(c, v));
    return `  -- ${s.name} (S19 ${s.s19}, cliente ${FIRST_NUMBER + i})\n`
      + `  PERFORM pg_temp.add_set(${FIRST_HI + i}, ${lit(s.name + "'s")}::text, ${lit(STAT_ATTR[s.stat])}::text,\n`
      + `    ARRAY[${s.pieces.map(([g, n]) => `'00000080-${hex(g)}-${hex(n)}-0000-000000000000'`).join(', ')}]::uuid[],\n`
      + `    ARRAY[${opts.map(o => lit(o.attr)).join(', ')}]::text[],\n`
      + `    ARRAY[${opts.map(o => o.value).join(', ')}]::numeric[],\n`
      + `    ARRAY[${opts.map(o => o.aggregate).join(', ')}]::int[]);\n`;
  }).join('');
  const mine = (k: string) => `substr("Id"::text, 1, 19) IN (${his.split(',').map(h => `'0000ba5e-${k}-${h.slice(1, -1)}'`).join(',')})`;
  return `-- Fase S10: ${sets.length} sets Mastery (Darkangel a Lightning). Generado por gen_mastery_sets.ts: no se edita a mano.
-- Aplica con \`psql -v ON_ERROR_STOP=1 -f s10_sets.sql\` despues de s10_mastery.sql; revierte con \`-v undo=1\`.
\\set ON_ERROR_STOP on
BEGIN;
\\if :{?undo}
DELETE FROM config."ItemDefinitionItemSetGroup" WHERE substr("ItemSetGroupId"::text, 1, 19) IN (${his.split(',').map(h => `'0000ba5e-0001-${h.slice(1, -1)}'`).join(',')});
DELETE FROM config."ItemOfItemSet" WHERE ${mine('0006')};
DELETE FROM config."ItemSetGroup" WHERE ${mine('0001')};
DELETE FROM config."IncreasableItemOption" WHERE ${mine('0005')};
DELETE FROM config."ItemOptionDefinition" WHERE ${mine('0002')};
DELETE FROM config."PowerUpDefinition" WHERE ${mine('0003')};
DELETE FROM config."PowerUpDefinitionValue" WHERE ${mine('0004')};
\\else
${fn}DO $$
BEGIN
${body}END $$;
SELECT count(*) || ' sets Mastery' FROM config."ItemSetGroup" WHERE ${mine('0001')};
\\endif
COMMIT;
`;
}

function client(sets: SetS19[], root: string): void {
  const walk = (d: string, out: string[] = []): string[] => {
    for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); }
    return out;
  };
  const free = (n: number) => n === 0 || n === 0xff;
  for (const p of walk(root)) {
    const name = (p.split('/').pop() ?? '').toLowerCase();
    if (name.endsWith('.gz')) continue;
    let bytes: Uint8Array = new Uint8Array(readFileSync(p));
    if (name === 'itemsettype.bmd') {
      sets.forEach((s, i) => {
        for (const [g, n] of s.pieces) {
          const code = itemCode(g, n), have = itemSetNumbers(bytes, code), number = FIRST_NUMBER + i;
          const slot = have[0] === number ? 0 : have[1] === number ? 1 : free(have[0]) ? 0 : free(have[1]) ? 1 : null;
          if (slot === null) throw new Error(`${g}:${n} ya esta en los sets ${have[0]} y ${have[1]}`);
          bytes = setItemSetNumber(bytes, code, slot, number);
        }
      });
    } else if (/^itemsetoption(_[a-z]+)?\.bmd$/.test(name)) sets.forEach((s, i) => (bytes = setSetOption(bytes, FIRST_NUMBER + i, record(s))));
    else continue;
    if (!existsSync(p + '.bak10')) writeFileSync(p + '.bak10', new Uint8Array(readFileSync(p)));
    writeFileSync(p, bytes);
    if (existsSync(p + '.gz')) writeFileSync(p + '.gz', new Uint8Array(gzipSync(bytes, { level: 9 })));
    process.stdout.write(`ok ${p}\n`);
  }
}

if (import.meta.main) {
  const [mode, dir, root] = process.argv.slice(2);
  const sets = masterySets(dir ?? '');
  if (mode === 'sql') process.stdout.write(sql(sets));
  else if (mode === 'client' && root) client(sets, root);
  else throw new Error('uso: gen_mastery_sets.ts sql <generaciones> | client <generaciones> <Data/Local>');
}
