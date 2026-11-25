// Fase S12: lo que el cliente lee de Data para un mapa nuevo del S19, desde el s12_mapa<N>_cliente.json que escribe
// gen_mapa_nuevo.py: la fila de la ventana Move (Local/**/MoveReq*.bmd, `CMoveCommandData::Create`; su indice es el
// `WarpInfo.Index` del servidor) y las puertas del mapa en gate.bmd (`GATE_ATTRIBUTE`, 512 registros de 14 bytes).
//   bun ops/faseS/cliente_mapa.ts <Data> <s12_mapa<N>_cliente.json>
// Respaldo <archivo>.bak12 la primera vez; no repite una fila de Move; reescribe el .gz si lo hay.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { convertBux } from '../../src/controllers/terrain/mapFileEncryption';

export type Move = { index: number; name: string; level: number; zen: number; gate: number };
export type GateRow = { n: number; flag: number; map: number; x1: number; y1: number; x2: number; y2: number; target: number; angle: number; level: number };

const MOVE = 84;
const GATE = 14;

/** The file with one more Move row, or null when its index is already there. */
export function addMoveRow(file: Uint8Array, m: Move): Uint8Array | null {
  const count = new DataView(file.buffer, file.byteOffset, file.byteLength).getInt32(0, true);
  for (let i = 0; i < count; i++) {
    const r = file.slice(4 + i * MOVE, 4 + (i + 1) * MOVE);
    convertBux(r, MOVE);
    if (new DataView(r.buffer).getInt32(0, true) === m.index) return null;
  }
  const rec = new Uint8Array(MOVE);
  const d = new DataView(rec.buffer);
  const text = new TextEncoder().encode(m.name).slice(0, 31);
  d.setInt32(0, m.index, true);
  rec.set(text, 4);
  rec.set(text, 36);
  d.setInt32(68, m.level, true);
  d.setInt32(72, 400, true);
  d.setInt32(76, m.zen, true);
  d.setInt32(80, m.gate, true);
  convertBux(rec, MOVE); // the XOR is its own inverse
  const at = 4 + count * MOVE;
  const out = new Uint8Array(file.length + MOVE);
  out.set(file.subarray(0, at));
  out.set(rec, at);
  out.set(file.subarray(at), at + MOVE);
  new DataView(out.buffer).setInt32(0, count + 1, true);
  return out;
}

/** gate.bmd with these records written in (the Season 6 layout, `SEASON6_GATES`). */
export function setGates(file: Uint8Array, gates: readonly GateRow[]): Uint8Array {
  const out = file.slice();
  for (const g of gates) {
    const rec = new Uint8Array(GATE);
    const d = new DataView(rec.buffer);
    rec.set([g.flag, g.map, g.x1, g.y1, g.x2, g.y2]);
    d.setUint16(6, g.target, true);
    rec[8] = g.angle;
    d.setUint16(10, g.level, true);
    d.setUint16(12, 0, true);
    convertBux(rec, GATE);
    out.set(rec, g.n * GATE);
  }
  return out;
}

function save(p: string, bytes: Uint8Array): void {
  if (!existsSync(p + '.bak12')) writeFileSync(p + '.bak12', new Uint8Array(readFileSync(p)));
  writeFileSync(p, bytes);
  if (existsSync(p + '.gz')) writeFileSync(p + '.gz', new Uint8Array(gzipSync(bytes, { level: 9 })));
  process.stdout.write(`ok ${p}\n`);
}

if (import.meta.main) {
  const [data, json] = process.argv.slice(2);
  const { move, gates } = JSON.parse(readFileSync(json, 'utf8')) as { move?: Move; gates: GateRow[] };
  const walk = (d: string, out: string[] = []): string[] => {
    for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); }
    return out;
  };
  if (move) {
    for (const p of walk(join(data, 'Local')).filter(p => /^movereq(_[a-z]+)?\.bmd$/i.test(p.split('/').pop() ?? ''))) {
      const bytes = addMoveRow(new Uint8Array(readFileSync(p)), move);
      if (bytes) save(p, bytes);
      else process.stdout.write(`ya esta ${p}\n`);
    }
  }
  const gate = readdirSync(data).find(f => f.toLowerCase() === 'gate.bmd');
  if (gate) save(join(data, gate), setGates(new Uint8Array(readFileSync(join(data, gate))), gates));
}
