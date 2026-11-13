import { describe, expect, it } from 'vitest';
import { packedColumn } from '.';

describe('packedColumn', () => {
  it('puts a lone window at the right edge and keeps the order of several', () => {
    expect(packedColumn(2, [])).toBe(0);
    expect(packedColumn(2, [0])).toBe(1);
    expect(packedColumn(1, [0, 2])).toBe(1);
    expect(packedColumn(0, [1, 2])).toBe(0);
    expect(packedColumn(3, [0, 1, 2])).toBe(3);
  });
});
