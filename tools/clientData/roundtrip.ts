// Fase 0, punto 4: leer y reescribir sin cambios da archivos identicos. Recorre un Data/Local del cliente:
// ItemSetType (cada item reescrito con sus dos sets), ItemSetOption_* (cada set decodificado y vuelto a escribir) y
// Mix.bmd (las recetas propias quitadas y puestas otra vez). Uso: bun tools/clientData/roundtrip.ts <Data/Local>
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { convertBux } from '../../src/controllers/terrain/mapFileEncryption';
import { withRecipes } from '../../ops/bloodangel/client_mix';
import { decodeSetRecord, setItemSetNumber, setSetOption } from './setFiles';

const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Set numbers whose record does not come back byte for byte. */
export function optionMismatches(bytes: Uint8Array): number[] {
  const bad: number[] = [];
  for (let n = 1; (n + 1) * 110 <= bytes.length && n <= 254; n++) {
    const record = bytes.slice(n * 110, n * 110 + 110);
    convertBux(record, 110);
    if (!same(setSetOption(bytes, n, decodeSetRecord(record)), bytes)) bad.push(n);
  }
  return bad;
}

/** Item codes whose 4 bytes do not come back. */
export function typeMismatches(bytes: Uint8Array): number[] {
  const bad: number[] = [];
  for (let code = 0; code < Math.min(8192, Math.floor(bytes.length / 4)); code++) {
    const r = bytes.slice(code * 4, code * 4 + 4);
    convertBux(r, 4);
    if (r[0] > 254) continue;
    if (!same(setItemSetNumber(bytes, code, 0, r[0]), bytes)) bad.push(code);
  }
  return bad;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); }
  return out;
}

if (import.meta.main) {
  const root = process.argv[2];
  if (!root) throw new Error('falta la carpeta Data/Local');
  let fails = 0;
  for (const p of walk(root)) {
    const name = (p.split('/').pop() ?? '').toLowerCase();
    const bytes = new Uint8Array(readFileSync(p));
    let bad: number[] | null = null;
    if (name === 'itemsettype.bmd') bad = typeMismatches(bytes);
    else if (/^itemsetoption(_[a-z]+)?\.bmd$/.test(name)) bad = optionMismatches(bytes);
    else if (name === 'mix.bmd') bad = same(withRecipes(bytes, 618), bytes) ? [] : [-1];
    if (!bad) continue;
    fails += bad.length;
    process.stdout.write(`${bad.length ? 'DISTINTO' : 'identico'} ${p}${bad.length ? ` (${bad.slice(0, 12).join(', ')})` : ''}\n`);
  }
  process.stdout.write(fails ? `${fails} registros distintos\n` : 'todo identico\n');
}
