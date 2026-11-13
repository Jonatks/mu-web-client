// Pone Bes Eclipse como set 50 en los archivos de sets del cliente, en todas las copias de un directorio Data/Local.
// Uso (en la VM, con bun): bun client_bes_eclipse.ts <Data/Local>   Escribe .bak junto a cada archivo y rehace los .gz.
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { itemCode, setItemSetNumber, setSetOption } from '../../tools/clientData/setFiles';

const SET = 50;
const PANTS = itemCode(9, 35), STAFF = itemCode(5, 8);
const record = { name: "Bes's", itemCount: 2, full: [{ option: 2, value: 200 }, { option: 19, value: 80 }], classes: [0, 0, 0, 0, 0, 0, 0] };

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); }
  return out;
}

const root = process.argv[2];
if (!root) throw new Error('falta la carpeta Data/Local');
let n = 0;
for (const p of walk(root)) {
  const name = (p.split('/').pop() ?? '').toLowerCase();
  if (name.endsWith('.gz')) continue;
  let bytes: Uint8Array = new Uint8Array(readFileSync(p));
  if (name === 'itemsettype.bmd') bytes = setItemSetNumber(setItemSetNumber(bytes, PANTS, 0, SET), STAFF, 0, SET);
  else if (/^itemsetoption(_[a-z]+)?\.bmd$/.test(name)) bytes = setSetOption(bytes, SET, record);
  else continue;
  if (!existsSync(p + '.bak')) writeFileSync(p + '.bak', new Uint8Array(readFileSync(p)));
  writeFileSync(p, bytes);
  if (existsSync(p + '.gz')) writeFileSync(p + '.gz', new Uint8Array(gzipSync(bytes, { level: 9 })));
  process.stdout.write(`ok ${p} ${bytes.length}\n`);
  n++;
}
process.stdout.write(`${n} archivos\n`);
