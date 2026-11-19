import { expect, test } from 'bun:test';
import { INVENTORY, vaultLayout } from './grid';
import { planSet } from './sets';

const ring = { name: 'Ring', w: 1, h: 1, slots: [10, 11] };
const staff = { name: 'Staff', w: 1, h: 4, slots: [0] };
const pants = { name: 'Pants', w: 2, h: 2, slots: [4] };

test('wears each piece in its free body slot, two rings in 10 and 11', () => {
  expect(planSet([staff, pants, ring, ring], [], INVENTORY, true)).toEqual([0, 4, 10, 11]);
});

test('refuses a set whose body slot is taken, naming the piece', () => {
  expect(() => planSet([staff, pants], [{ slot: 4, w: 2, h: 2 }], INVENTORY, true)).toThrow('Pants');
});

test('without wearing, stacks the pieces into the free places of the bag', () => {
  expect(planSet([pants, pants], [{ slot: 12, w: 2, h: 2 }], INVENTORY, false)).toEqual([14, 16]);
  expect(planSet([staff], [], vaultLayout(false), false)).toEqual([0]);
});

test('refuses a set that does not fit', () => {
  const full = Array.from({ length: 64 }, (_, i) => ({ slot: 12 + i, w: 1, h: 1 }));
  expect(() => planSet([ring], full, INVENTORY, false)).toThrow('Ring');
});
