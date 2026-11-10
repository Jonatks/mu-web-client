import { describe, expect, it } from 'vitest';
import { clearStick, setStick, stickDirection, stickHeld, TouchStick } from './touchStick';

// Screen axes: dx grows to the right, dy grows downwards, so "up" is a negative dy.
const R = 60;

describe('stickDirection', () => {
  it('walks in the four straight directions', () => {
    expect(stickDirection(0, -R, R)).toEqual({ forward: 1, strafe: 0 });
    expect(stickDirection(0, R, R)).toEqual({ forward: -1, strafe: 0 });
    expect(stickDirection(R, 0, R)).toEqual({ forward: 0, strafe: 1 });
    expect(stickDirection(-R, 0, R)).toEqual({ forward: 0, strafe: -1 });
  });

  it('walks the four diagonals', () => {
    expect(stickDirection(R, -R, R)).toEqual({ forward: 1, strafe: 1 });
    expect(stickDirection(-R, -R, R)).toEqual({ forward: 1, strafe: -1 });
    expect(stickDirection(R, R, R)).toEqual({ forward: -1, strafe: 1 });
    expect(stickDirection(-R, R, R)).toEqual({ forward: -1, strafe: -1 });
  });

  it('stands still inside the dead zone and with no radius', () => {
    expect(stickDirection(5, -5, R)).toEqual({ forward: 0, strafe: 0 });
    expect(stickDirection(0, 0, R)).toEqual({ forward: 0, strafe: 0 });
    expect(stickDirection(R, R, 0)).toEqual({ forward: 0, strafe: 0 });
  });

  it('snaps an in-between angle to the nearest of the eight directions', () => {
    // About 10 degrees above straight right: still right.
    expect(stickDirection(R, -R * 0.18, R)).toEqual({ forward: 0, strafe: 1 });
    // About 35 degrees above straight right: the diagonal.
    expect(stickDirection(R, -R * 0.7, R)).toEqual({ forward: 1, strafe: 1 });
  });

  it('never returns negative zero', () => {
    const d = stickDirection(R, 0, R);
    expect(Object.is(d.forward, -0)).toBe(false);
  });
});

describe('TouchStick', () => {
  it('holds the direction the player controller reads, until it is cleared', () => {
    clearStick();
    expect(stickHeld()).toBe(false);

    setStick({ forward: 1, strafe: -1 });
    expect(TouchStick).toMatchObject({ forward: 1, strafe: -1 });
    expect(stickHeld()).toBe(true);

    clearStick();
    expect(TouchStick).toMatchObject({ forward: 0, strafe: 0 });
    expect(stickHeld()).toBe(false);
  });
});
