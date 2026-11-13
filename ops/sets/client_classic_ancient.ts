// Pone los 11 sets clasicos (51 a 61) en los archivos de sets del cliente, en todas las copias de un directorio Data/Local.
// Uso (en la VM, con bun): bun client_classic_ancient.ts <Data/Local>   Escribe .bak junto a cada archivo y rehace los .gz.
// Una pieza que ya esta en otro set usa la segunda ranura (discriminador 2 en el servidor); con las dos ocupadas falla.
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { itemCode, itemSetNumbers, setItemSetNumber, setSetOption, type SetRecord } from '../../tools/clientData/setFiles';
import { KINDS, SETS, type SetDef } from './classic_ancient';

const EMPTY = 0xff;
const free = (n: number) => n === 0 || n === EMPTY;

const record = (s: SetDef): SetRecord => ({
  name: `${s.name}'s`,
  itemCount: s.pieces.length,
  standard: s.standard.map(([k, v]) => [{ option: KINDS[k].client, value: v }]),
  full: s.full.map(([k, v]) => ({ option: KINDS[k].client, value: v })),
  classes: [0, 0, 0, 0, 0, 0, 0],
});

function putPieces(types: Uint8Array, log: string[]): Uint8Array {
  let out = types;
  for (const s of SETS) {
    for (const [g, n] of s.pieces) {
      const code = itemCode(g, n);
      const have = itemSetNumbers(out, code);
      const slot = have[0] === s.number ? 0 : have[1] === s.number ? 1 : free(have[0]) ? 0 : free(have[1]) ? 1 : null;
      if (slot === null) throw new Error(`${g}:${n} ya esta en los sets ${have[0]} y ${have[1]}`);
      out = setItemSetNumber(out, code, slot, s.number);
      log.push(`${s.name} ${g}:${n} ranura ${slot}`);
    }
  }
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); }
  return out;
}

const root = process.argv[2];
if (!root) throw new Error('falta la carpeta Data/Local');
let files = 0;
for (const p of walk(root)) {
  const name = (p.split('/').pop() ?? '').toLowerCase();
  if (name.endsWith('.gz')) continue;
  let bytes: Uint8Array = new Uint8Array(readFileSync(p));
  if (name === 'itemsettype.bmd') {
    const log: string[] = [];
    bytes = putPieces(bytes, log);
    process.stdout.write(`${log.join('\n')}\n`);
  } else if (/^itemsetoption(_[a-z]+)?\.bmd$/.test(name)) for (const s of SETS) bytes = setSetOption(bytes, s.number, record(s));
  else continue;
  if (!existsSync(p + '.bak')) writeFileSync(p + '.bak', new Uint8Array(readFileSync(p)));
  writeFileSync(p, bytes);
  if (existsSync(p + '.gz')) writeFileSync(p + '.gz', new Uint8Array(gzipSync(bytes, { level: 9 })));
  process.stdout.write(`ok ${p} ${bytes.length}\n`);
  files++;
}
process.stdout.write(`${files} archivos\n`);
