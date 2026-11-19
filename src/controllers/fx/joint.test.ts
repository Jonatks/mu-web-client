import { describe, expect, it } from 'vitest';
import { cardDrawn } from './joint';

describe('joint cards', () => {
  it('draws a card on every tail only where the history has reached', () => {
    expect([0, 1, 2, 3].map(slot => cardDrawn(slot, 2, 20))).toEqual([true, true, false, false]);
    expect(cardDrawn(10, 1, 1)).toBe(true);
  });
});
