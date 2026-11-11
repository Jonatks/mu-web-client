import { describe, expect, it } from 'vitest';
import { PINCH_STEP_PX, PinchTracker } from './pinchZoom';

describe('PinchTracker', () => {
  it('does nothing with one finger', () => {
    const p = new PinchTracker();
    p.down(1, 0, 0);
    expect(p.move(1, 50, 0)).toBe(0);
  });

  it('zooms in one step each time the fingers spread by a step', () => {
    const p = new PinchTracker();
    p.down(1, 0, 0);
    p.down(2, 100, 0);
    expect(p.move(2, 100 + PINCH_STEP_PX - 1, 0)).toBe(0);
    expect(p.move(2, 100 + PINCH_STEP_PX, 0)).toBe(-1); // wider = closer = a lower camera level
    expect(p.move(2, 100 + PINCH_STEP_PX * 2, 0)).toBe(-1);
  });

  it('zooms out when the fingers come together', () => {
    const p = new PinchTracker();
    p.down(1, 0, 0);
    p.down(2, 200, 0);
    expect(p.move(2, 200 - PINCH_STEP_PX, 0)).toBe(1);
  });

  it('stops tracking when a finger lifts, and starts fresh with the next pair', () => {
    const p = new PinchTracker();
    p.down(1, 0, 0);
    p.down(2, 100, 0);
    p.up(2);
    expect(p.pinching).toBe(false);
    expect(p.move(1, 300, 0)).toBe(0);
    p.down(3, 100, 0);
    expect(p.move(3, 100 + PINCH_STEP_PX, 0)).toBe(-1);
  });

  it('ignores a third finger', () => {
    const p = new PinchTracker();
    p.down(1, 0, 0);
    p.down(2, 100, 0);
    p.down(3, 500, 500);
    expect(p.move(3, 900, 900)).toBe(0);
  });
});
