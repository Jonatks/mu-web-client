import { expect, test } from 'bun:test';
import { ancientPlan, wantedLinks } from './items';

const opts = [
  { optionId: 'l', type: 'Luck', number: 0, label: null },
  { optionId: 'o', type: 'Option', number: 0, label: 'Damage' },
  { optionId: 'e1', type: 'Excellent Option', number: 1, label: 'HP' },
  { optionId: 'e2', type: 'Excellent Option', number: 2, label: 'Mana' },
];

test('builds the links a spec asks for', () => {
  const links = wantedLinks(opts, { luck: true, option: 3, excellent: [2, 2, 1] });
  expect(links.map(l => [l.optionId, l.level, l.kind])).toEqual([['l', 0, 'luck'], ['o', 3, 'option'], ['e2', 0, 'excellent'], ['e1', 0, 'excellent']]);
});

test('an empty spec asks for nothing', () => {
  expect(wantedLinks(opts, {})).toEqual([]);
  expect(wantedLinks(opts, { luck: false, option: 0, excellent: [] })).toEqual([]);
});

test('refuses what the item cannot carry', () => {
  expect(() => wantedLinks([], { luck: true })).toThrow();
  expect(() => wantedLinks(opts, { option: 5 })).toThrow();
  expect(() => wantedLinks(opts, { excellent: [9] })).toThrow();
});

const sets = [
  { itemOfSetId: 's1', set: 'Enis', bonusOptionId: 'b1', bonus: 'Energy' },
  { itemOfSetId: 's2', set: 'Ring set', bonusOptionId: null, bonus: null },
];

test('ancient: a set with a bonus takes level 1 (+5) or 2 (+10), +5 by default', () => {
  expect(ancientPlan(sets, { itemOfSetId: 's1' })).toEqual({ itemOfSetId: 's1', bonusOptionId: 'b1', level: 1 });
  expect(ancientPlan(sets, { itemOfSetId: 's1', bonusLevel: 2 }).level).toBe(2);
  expect(() => ancientPlan(sets, { itemOfSetId: 's1', bonusLevel: 3 })).toThrow();
});

test('ancient: a set without a bonus gets no bonus link', () => {
  expect(ancientPlan(sets, { itemOfSetId: 's2', bonusLevel: 2 })).toEqual({ itemOfSetId: 's2', bonusOptionId: null, level: 0 });
});

test('ancient: refuses a set the item is not in', () => {
  expect(() => ancientPlan(sets, { itemOfSetId: 'zzz' })).toThrow();
  expect(() => ancientPlan([], { itemOfSetId: 's1' })).toThrow();
});
