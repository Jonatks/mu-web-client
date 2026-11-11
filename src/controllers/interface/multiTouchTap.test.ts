import { describe, expect, it } from 'vitest';
import { MultiTouchTap } from './multiTouchTap';

describe('MultiTouchTap', () => {
  it('asks for a click when a tap lands while a finger holds the stick', () => {
    const t = new MultiTouchTap();
    t.down(1, 100, 300, true);
    t.down(2, 700, 40, false);
    expect(t.up(2, 702, 41)).toBe(true);
  });

  it('leaves single-finger taps to the browser (it makes the click itself)', () => {
    const t = new MultiTouchTap();
    t.down(2, 700, 40, false);
    expect(t.up(2, 700, 40)).toBe(false);
  });

  it('never clicks for the stick finger itself, or for a drag', () => {
    const t = new MultiTouchTap();
    t.down(1, 100, 300, true);
    t.down(2, 700, 40, false);
    expect(t.up(2, 760, 40)).toBe(false); // moved: a drag, not a tap
    expect(t.up(1, 100, 300)).toBe(false);
  });

  it('does not click once the stick finger has lifted', () => {
    const t = new MultiTouchTap();
    t.down(1, 100, 300, true);
    t.down(2, 700, 40, false);
    t.up(1, 100, 300);
    expect(t.up(2, 700, 40)).toBe(false);
  });

  it('ignores a finger it never saw go down', () => {
    expect(new MultiTouchTap().up(9, 0, 0)).toBe(false);
  });
});
