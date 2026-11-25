import { describe, expect, it } from 'vitest';
import { parseGates } from '../../src/controllers/assets/mu/gates';
import { convertBux } from '../../src/controllers/terrain/mapFileEncryption';
import { addMoveRow, setGates } from './cliente_mapa';

const moveRow = (file: Uint8Array, i: number) => {
  const r = file.slice(4 + i * 84, 4 + (i + 1) * 84);
  convertBux(r, 84);
  const d = new DataView(r.buffer);
  return { index: d.getInt32(0, true), name: new TextDecoder().decode(r.slice(4, 11)), zen: d.getInt32(76, true), gate: d.getInt32(80, true) };
};

describe('cliente_mapa', () => {
  it('adds one Move row after the counted ones, once', () => {
    const file = new Uint8Array(4 + 84 + 10); // one empty row and 10 trailing bytes the count does not reach
    new DataView(file.buffer).setInt32(0, 1, true);
    const out = addMoveRow(file, { index: 91, name: 'Acheron', level: 300, zen: 50000, gate: 417 })!;
    expect(new DataView(out.buffer).getInt32(0, true)).toBe(2);
    expect(out.length).toBe(file.length + 84);
    expect(moveRow(out, 1)).toEqual({ index: 91, name: 'Acheron', zen: 50000, gate: 417 });
    expect(addMoveRow(out, { index: 91, name: 'Acheron', level: 300, zen: 50000, gate: 417 })).toBeNull();
  });

  it('writes gates the client reads back', () => {
    const empty = new Uint8Array(512 * 14);
    for (let i = 0; i < 512; i++) {
      const r = empty.subarray(i * 14, (i + 1) * 14);
      convertBux(r, 14); // an empty record, as the file stores it
    }
    const out = setGates(empty, [{ n: 418, flag: 1, map: 91, x1: 26, y1: 168, x2: 28, y2: 172, target: 419, angle: 0, level: 300 }]);
    const g = parseGates(out)[418];
    expect([g.flag, g.map, g.x1, g.y1, g.x2, g.y2, g.target, g.level]).toEqual([1, 91, 26, 168, 28, 172, 419, 300]);
    expect(parseGates(out)[417].flag).toBe(0);
  });
});
