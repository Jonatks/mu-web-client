import { expect, test } from 'bun:test';
import { freeSlot } from './grid';

test('an empty bag gives the first slot', () => {
  expect(freeSlot([], 2, 3)).toBe(12);
});

test('it skips cells an item covers', () => {
  expect(freeSlot([{ slot: 12, w: 2, h: 3 }], 1, 1)).toBe(14);
  expect(freeSlot([{ slot: 12, w: 2, h: 3 }], 2, 2)).toBe(14);
});

test('a tall item moves to the next row when it does not fit under another', () => {
  const full = Array.from({ length: 8 }, (_, c) => ({ slot: 12 + c, w: 1, h: 1 }));
  expect(freeSlot(full, 1, 1)).toBe(20);
});

test('a full bag returns null', () => {
  expect(freeSlot([{ slot: 12, w: 8, h: 8 }], 1, 1)).toBeNull();
});

test('equipment and extension slots are ignored', () => {
  expect(freeSlot([{ slot: 3, w: 2, h: 3 }, { slot: 100, w: 1, h: 1 }], 1, 1)).toBe(12);
});

import { fits, vaultLayout } from './grid';

test('the vault starts at slot 0 and is 8x15', () => {
  const v = vaultLayout(false);
  expect(freeSlot([], 1, 1, v)).toBe(0);
  expect(freeSlot([{ slot: 0, w: 8, h: 15 }], 1, 1, v)).toBeNull();
  expect(freeSlot([{ slot: 0, w: 8, h: 15 }], 1, 1, vaultLayout(true))).toBe(120);
});

test('fits checks the corner, the edges and the neighbours', () => {
  const bag = [{ slot: 12, w: 2, h: 2 }];
  expect(fits(bag, 14, 2, 2)).toBe(true);
  expect(fits(bag, 13, 1, 1)).toBe(false);
  expect(fits(bag, 19, 2, 1)).toBe(false); // would cross the right edge
  expect(fits(bag, 11, 1, 1)).toBe(false); // equipment slot
  expect(fits(bag, 76, 1, 1)).toBe(false); // past the bag
});
