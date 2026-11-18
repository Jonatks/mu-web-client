// Pone los 7 sets Bloodangel (62 a 68) en los archivos de sets del cliente de un directorio Data/Local.
// Uso (en la VM, con bun): bun client_sets.ts <Data/Local>   Escribe .bak junto a cada archivo y rehace los .gz.
// Filas como las da OpenMU: 2 piezas la primera opcion, 3 piezas la segunda, 4 piezas (set completo) el resto.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { itemCode, itemSetNumbers, setItemSetNumber, setSetOption, type SetOptionValue, type SetRecord } from '../../tools/clientData/setFiles';
import { FIRST_CLIENT_SET, SETS, type SetS19 } from './gen_sets';

/** Codigos del S19 sin numero en Season 6: el cliente los guarda en 40+ (`LATER_SET_OPTION`). */
const CLIENT_CODE: Record<number, number> = { 24: 40, 25: 41, 26: 42, 27: 43, 33: 44 };
const opt = ([c, v]: [number, number]): SetOptionValue => ({ option: CLIENT_CODE[c] ?? c, value: v });

export function record(s: SetS19): SetRecord {
  const [two = [], three = [], four = []] = s.tiers;
  return {
    name: `${s.name}'s`,
    itemCount: s.pieces.length,
    standard: [two.slice(0, 1).map(opt), two.slice(1, 2).map(opt), three.map(opt)],
    ext: four.map(opt),
    full: s.full.map(opt),
    classes: [0, 0, 0, 0, 0, 0, 0],
  };
}

const free = (n: number) => n === 0 || n === 0xff;
function putPieces(types: Uint8Array, log: string[]): Uint8Array {
  let out = types;
  SETS.forEach((s, i) => {
    const number = FIRST_CLIENT_SET + i;
    for (const [g, n] of s.pieces) {
      const code = itemCode(g, n);
      const have = itemSetNumbers(out, code);
      const slot = have[0] === number ? 0 : have[1] === number ? 1 : free(have[0]) ? 0 : free(have[1]) ? 1 : null;
      if (slot === null) throw new Error(`${g}:${n} ya esta en los sets ${have[0]} y ${have[1]}`);
      out = setItemSetNumber(out, code, slot, number);
      log.push(`${s.name} ${g}:${n} ranura ${slot}`);
    }
  });
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); }
  return out;
}

if (import.meta.main) {
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
    } else if (/^itemsetoption(_[a-z]+)?\.bmd$/.test(name)) SETS.forEach((s, i) => (bytes = setSetOption(bytes, FIRST_CLIENT_SET + i, record(s))));
    else continue;
    if (!existsSync(p + '.bak3')) writeFileSync(p + '.bak3', new Uint8Array(readFileSync(p)));
    writeFileSync(p, bytes);
    if (existsSync(p + '.gz')) writeFileSync(p + '.gz', new Uint8Array(gzipSync(bytes, { level: 9 })));
    process.stdout.write(`ok ${p} ${bytes.length}\n`);
    files++;
  }
  process.stdout.write(`${files} archivos\n`);
}
