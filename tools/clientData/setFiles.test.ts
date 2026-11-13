import { describe, expect, it } from 'vitest';
import { convertBux } from '../../src/controllers/terrain/mapFileEncryption';
import { parseItemSetOptions, parseItemSetTypes } from '../../src/controllers/assets/mu/itemSetFile';
import { existsSync, readFileSync } from 'fs';
import { decodeSetRecord, encodeSetRecord, itemCode, setItemSetNumber, setSetOption } from './setFiles';

/** A type table shaped like the live one: 8192 keyed records of zeros plus a 4 byte tail. */
function emptyTypes(): Uint8Array {
  const bytes = new Uint8Array(8192 * 4 + 4);
  for (let i = 0; i < 8192; i++) convertBux(bytes.subarray(i * 4, i * 4 + 4), 4);
  bytes.set([1, 2, 3, 4], 8192 * 4);
  return bytes;
}

describe('setFiles', () => {
  it('writes a set number into an item slot and leaves the other items and the tail alone', () => {
    const before = emptyTypes();
    const code = itemCode(7, 61);
    const after = setItemSetNumber(before, code, 0, 50);
    const parsed = parseItemSetTypes(after);
    expect(parsed[code * 2]).toBe(50);
    expect(parsed[code * 2 + 1]).toBe(0);
    const changed = after.reduce((n, b, i) => n + (b !== before[i] ? 1 : 0), 0);
    expect(changed).toBe(1);
    expect(Array.from(after.subarray(8192 * 4))).toEqual([1, 2, 3, 4]);
  });

  it('writing the same value is the identity', () => {
    const before = emptyTypes();
    expect(setItemSetNumber(before, itemCode(0, 33), 1, 0)).toEqual(before);
  });

  it('writes a set record that the client parser reads back, growing the file past its end', () => {
    const base = new Uint8Array(64 * 110 + 4).fill(0x5a);
    const out = setSetOption(base, 50, {
      name: 'Bes Eclipse',
      standard: [[{ option: 3, value: 10 }]],
      full: [{ option: 7, value: 5 }],
      itemCount: 2,
    });
    expect(out.length).toBe(base.length);
    const setOf = new Uint8Array(8192 * 2);
    setOf[0] = 50;
    setOf[2] = 50;
    const sets = parseItemSetOptions(out, setOf);
    expect(sets[50]?.name).toBe('Bes Eclipse');
    expect(sets[50]?.standard[0][0]).toEqual({ option: 3, value: 10 });
    expect(sets[50]?.full[0]).toEqual({ option: 7, value: 5 });
    expect(sets[50]?.itemCount).toBe(2);
    expect(Array.from(out.subarray(64 * 110))).toEqual(Array.from(base.subarray(64 * 110)));

    const grown = setSetOption(base, 70, { name: 'Test' });
    expect(grown.length).toBe(71 * 110 + 4);
    expect(parseItemSetOptions(grown, setOf)[70]?.name).toBe('Test');
  });

  // Set MU_BMD_DIR to a folder with the live itemsettype.bmd and itemsetoption_eng.bmd.
  const dir = process.env.MU_BMD_DIR;
  it.skipIf(!dir || !existsSync(`${dir}/itemsetoption_eng.bmd`))('rewrites every live set record byte for byte', () => {
    const bytes = new Uint8Array(readFileSync(`${dir}/itemsetoption_eng.bmd`));
    for (let i = 1; i * 110 + 110 <= bytes.length; i++) {
      const raw = bytes.slice(i * 110, i * 110 + 110);
      convertBux(raw, 110);
      if (raw[0] === 0) continue;
      expect(encodeSetRecord(decodeSetRecord(raw)), `set ${i}`).toEqual(raw);
    }
  });
});
