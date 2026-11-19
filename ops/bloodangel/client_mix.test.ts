import { describe, expect, it } from 'vitest';
import { MIX_TYPES, parseMixRecipes } from '../../src/controllers/assets/mu/mixFile';
import { convertBux } from '../../src/controllers/terrain/mapFileEncryption';
import { GROUPS, MIX_ID, recipe, withRecipes } from './client_mix';

function file(type0: number, type1: number): Uint8Array {
  const head = new Uint8Array(MIX_TYPES * 4);
  const v = new DataView(head.buffer);
  v.setInt32(0, type0, true);
  v.setInt32(4, type1, true);
  convertBux(head, head.length);
  const recs = Array.from({ length: type0 + type1 }, (_, i) => recipe(i, 0, 0).map((b, j) => (j === 4 ? b ^ 1 : b)));
  const out = new Uint8Array(head.length + recs.length * 656);
  out.set(head);
  recs.forEach((r, i) => out.set(r, head.length + i * 656));
  return out;
}

describe('client_mix', () => {
  it('appends one recipe per group to the goblin type and keeps the rest', () => {
    const out = withRecipes(file(2, 1), 1234);
    const parsed = parseMixRecipes(out);
    expect(parsed[0].length).toBe(2 + GROUPS.length);
    expect(parsed[1].length).toBe(1);
    const ours = parsed[0].slice(2);
    expect(ours.map(r => r.mixId)).toEqual(GROUPS.map(() => MIX_ID));
    expect(ours[0].sources.map(s => [s.typeMin, s.typeMax])).toEqual([[7 * 512 + 98, 7 * 512 + 104], [13 * 512 + 407, 13 * 512 + 407]]);
    expect(ours[0].names[0]).toBe(1234);
    expect(parseMixRecipes(withRecipes(out, 1234))[0].length).toBe(2 + GROUPS.length);
  });
});
