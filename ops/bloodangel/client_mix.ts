// Fase 3: la mezcla del Goblin "pieza Bloodangel + Bloodangel Soul = pieza ancient" en el Mix.bmd del cliente.
// Uso (en la VM, con bun): bun client_mix.ts <Data/Local> [textoNombre]   Escribe mix.bmd.bak3 y rehace el .gz.
// Una receta por grupo (7 a 11, numeros 98 a 104) con el mismo mixId que el ItemCrafting de craft.sql.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { convertBux } from '../../src/controllers/terrain/mapFileEncryption';

export const MIX_ID = 200;
export const ZEN = 1_000_000;
export const RATE = 100;
const SIZE = 656;
/** `MAX_MIX_TYPES` (assets/mu/mixFile.ts). */
const MIX_TYPES = 14;
const SOUL = 13 * 512 + 407;
export const GROUPS = [7, 8, 9, 10, 11];

/** Un `MIX_RECIPE` sin cifrar: tipo de Goblin 0, tasa fija, fuente 1 la pieza, fuente 2 el Soul. */
export function recipe(index: number, group: number, name: number): Uint8Array {
  const b = new Uint8Array(SIZE);
  const v = new DataView(b.buffer);
  const int = (at: number, n: number) => v.setInt32(at, n, true);
  int(0, index);
  int(4, MIX_ID);
  int(8, name);
  int(44, -1);
  int(48, -1);
  b[56] = 'A'.charCodeAt(0);
  v.setUint32(60, ZEN, true);
  int(64, 1);
  int(68, 0);
  v.setFloat32(72, RATE, true);
  int(324, RATE);
  b[328] = b[329] = b[330] = 'A'.charCodeAt(0);
  const source = (i: number, min: number, max: number, lmax: number, omax: number) => {
    const at = 332 + i * 40;
    v.setInt16(at, min, true);
    v.setInt16(at + 2, max, true);
    int(at + 8, lmax);
    int(at + 16, omax);
    int(at + 24, 255);
    int(at + 28, 1);
    int(at + 32, 1);
  };
  source(0, group * 512 + 98, group * 512 + 104, 15, 255);
  source(1, SOUL, SOUL, 0, 0);
  int(652, 2);
  convertBux(b, SIZE);
  return b;
}

/** El archivo con nuestras recetas al final del tipo 0 (las de un pase anterior se quitan antes). */
export function withRecipes(bytes: Uint8Array, name: number): Uint8Array {
  const head = bytes.slice(0, MIX_TYPES * 4);
  convertBux(head, head.length);
  const counts = new DataView(head.buffer);
  const total = counts.getInt32(0, true);
  const mixId = (i: number) => {
    const r = bytes.slice(MIX_TYPES * 4 + i * SIZE, MIX_TYPES * 4 + (i + 1) * SIZE);
    convertBux(r, SIZE);
    return new DataView(r.buffer).getInt32(4, true);
  };
  let before = total;
  while (before > 0 && mixId(before - 1) === MIX_ID) before--;
  const start = MIX_TYPES * 4 + before * SIZE;
  const rest = bytes.slice(MIX_TYPES * 4 + total * SIZE);
  const added = GROUPS.map((g, i) => recipe(before + i, g, name));
  counts.setInt32(0, before + added.length, true);
  convertBux(head, head.length);
  const out = new Uint8Array(start + added.length * SIZE + rest.length);
  out.set(head, 0);
  out.set(bytes.slice(MIX_TYPES * 4, start), MIX_TYPES * 4);
  added.forEach((r, i) => out.set(r, start + i * SIZE));
  out.set(rest, start + added.length * SIZE);
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); }
  return out;
}

if (import.meta.main) {
  const root = process.argv[2];
  if (!root) throw new Error('falta la carpeta Data/Local');
  const name = Number(process.argv[3] ?? 0);
  for (const p of walk(root).filter(f => /(^|\/)mix\.bmd$/i.test(f))) {
    const bytes = new Uint8Array(readFileSync(p));
    if (!existsSync(p + '.bak3')) writeFileSync(p + '.bak3', bytes);
    const out = withRecipes(bytes, name);
    writeFileSync(p, out);
    if (existsSync(p + '.gz')) writeFileSync(p + '.gz', new Uint8Array(gzipSync(out, { level: 9 })));
    process.stdout.write(`ok ${p} ${bytes.length} -> ${out.length}\n`);
  }
}
