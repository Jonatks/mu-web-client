import { expect, test } from 'bun:test';
import { boxPlan, boxSummary, type BoxGroup } from './server';

const g = (id: string, key: string, chance: number, money = 0, description = 'Box of Kundun+3'): BoxGroup => ({ id, key, name: 'Box of Luck', description, chance, money });

test('a box with an item group and a zen group shows the item chance and can be changed', () => {
  const [row] = boxSummary([g('a', 'k1', 0.2), g('b', 'k1', 1, 150000)]);
  expect(row).toMatchObject({ key: 'k1', itemChance: 0.2, zen: 150000, adjustable: true, kundun: true });
});

test('a box with only items has nothing to change', () => {
  const [row] = boxSummary([g('a', 'k2', 1, 0, 'Star')]);
  expect(row!.adjustable).toBe(false);
  expect(row!.kundun).toBe(false);
});

test('the plan sets the item chance and keeps the proportions of several item groups', () => {
  const plan = boxPlan([g('a', 'k', 0.1), g('b', 'k', 0.3), g('z', 'k', 1, 5000)], 0.8);
  expect(plan.map(p => [p.id, Number(p.to.toFixed(3))])).toEqual([['a', 0.2], ['b', 0.6]]);
});

test('the plan never reaches 1, which would tie with the zen group', () => {
  expect(boxPlan([g('a', 'k', 0.2), g('z', 'k', 1, 5000)], 0.99)[0]!.to).toBe(0.99);
});

test('the plan refuses a box it cannot split between items and zen', () => {
  expect(() => boxPlan([g('a', 'k', 1)], 0.5)).toThrow();
  expect(() => boxPlan([g('a', 'k', 0), g('z', 'k', 1, 100)], 0.5)).toThrow();
});
