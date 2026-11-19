import { afterEach, describe, expect, it } from 'vitest';
import type { AbstractEngine } from './babylon/exports';
import { applyPixelDensity, pixelDensityFor, resetPixelDensity } from './pixelDensity';

const engine = (level: number) => {
  let l = level;
  return { getHardwareScalingLevel: () => l, setHardwareScalingLevel: (v: number) => (l = v) } as unknown as AbstractEngine;
};

describe('pixelDensity', () => {
  afterEach(resetPixelDensity);
  it('keeps the start cap at step 0 and never passes the screen ratio', () => {
    expect(pixelDensityFor(0, 3, 1.5)).toBe(1.5);
    expect(pixelDensityFor(1, 3, 1.5)).toBe(2);
    expect(pixelDensityFor(2, 3, 1.5)).toBe(3);
    expect(pixelDensityFor(2, 2.6, 1.5)).toBe(2.6);
    expect(pixelDensityFor(1, 1, 1)).toBe(1);
  });
  it('changes the scaling level by ratio, so the render scale on top is kept', () => {
    const e = engine(1 / 1.5 / 0.75);
    applyPixelDensity(e, 3, 1.5);
    expect(e.getHardwareScalingLevel()).toBeCloseTo(1 / 3 / 0.75);
    applyPixelDensity(e, 1.5, 1.5);
    expect(e.getHardwareScalingLevel()).toBeCloseTo(1 / 1.5 / 0.75);
  });
});
