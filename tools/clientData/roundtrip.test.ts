import { describe, expect, it } from 'vitest';
import { convertBux } from '../../src/controllers/terrain/mapFileEncryption';
import { optionMismatches, typeMismatches } from './roundtrip';
import { encodeSetRecord } from './setFiles';

describe('roundtrip', () => {
  it('finds no change in a set file the writer made, and finds the bytes it cannot keep', () => {
    const file = new Uint8Array(3 * 110 + 4);
    const rec = encodeSetRecord({ name: 'Bes Eclipse', itemCount: 2 });
    convertBux(rec, 110);
    file.set(rec, 110);
    file.set(rec, 220);
    expect(optionMismatches(file)).toEqual([]);
    const junk = encodeSetRecord({ name: 'Old' });
    junk[40] = 7; // a byte after the name's end
    convertBux(junk, 110);
    file.set(junk, 220);
    expect(optionMismatches(file)).toEqual([2]);
  });
  it('rewrites every item of the type table as it was', () => {
    const types = new Uint8Array(8192 * 4).map((_, i) => (i * 37) & 0xff);
    expect(typeMismatches(types).length).toBe(0);
  });
});
