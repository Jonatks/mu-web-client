// Autorizado por el usuario (24-11-2026): abrir los GFx del cliente S19 para usar su arte en la interfaz.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { modulusDecrypt } from '../../../src/core/modulusCryptor';
const [src, out, ext] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const heads: Record<string, number> = {};
for (const f of readdirSync(src)) {
  try { const d = modulusDecrypt(new Uint8Array(readFileSync(`${src}/${f}`)));
    const h = String.fromCharCode(...d.subarray(0, 4)); heads[h] = (heads[h] ?? 0) + 1;
    writeFileSync(`${out}/${f.replace(/\.[^.]+$/, ext)}`, d.subarray(h === 'DDS ' ? 0 : 0)); } catch { heads.err = (heads.err ?? 0) + 1; }
}
console.info(heads);
