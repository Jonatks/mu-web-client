import { expect, test } from 'bun:test';
import { wantedLinks } from './items';

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
