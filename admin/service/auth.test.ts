import { expect, test } from 'bun:test';
import { isBrowserRequest, keyMatches } from './auth';

const key = 'k'.repeat(48);

test('only the exact key passes', () => {
  expect(keyMatches(key, key)).toBe(true);
  expect(keyMatches(key + 'x', key)).toBe(false);
  expect(keyMatches('', key)).toBe(false);
  expect(keyMatches(null, key)).toBe(false);
});

test('a short or empty configured key never matches', () => {
  expect(keyMatches('short', 'short')).toBe(false);
  expect(keyMatches('', '')).toBe(false);
});

test('browser requests are recognised', () => {
  expect(isBrowserRequest(new Headers({ origin: 'https://x.test' }))).toBe(true);
  expect(isBrowserRequest(new Headers({ 'x-admin-key': 'a' }))).toBe(false);
});
