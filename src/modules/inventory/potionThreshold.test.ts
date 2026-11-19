import { describe, expect, it } from 'vitest';
import { underThreshold } from './potionThreshold';

describe('automatic potions', () => {
  it('drinks under the threshold, 40 % by default', () => {
    expect(underThreshold(399, 1000, 4)).toBe(true);
    expect(underThreshold(400, 1000, 4)).toBe(false);
    expect(underThreshold(50, 1000, 1)).toBe(true);
    expect(underThreshold(0, 0, 4)).toBe(false);
  });
});
