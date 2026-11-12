import { expect, test } from 'bun:test';
import { checkPassword, makeHash, parseUsers, sameOrigin, sign, verify } from './auth.js';

test('a password checks against its own hash only', async () => {
  const h = await makeHash('s3cret!');
  expect(h.startsWith('scrypt$16384$')).toBe(true);
  expect(await checkPassword('s3cret!', h)).toBe(true);
  expect(await checkPassword('s3cret?', h)).toBe(false);
  expect(await checkPassword('x', 'garbage')).toBe(false);
  expect(await checkPassword('x', undefined)).toBe(false);
});

test('users are read from the env text', () => {
  const u = parseUsers('ana=scrypt$1$aa$bb; luis=scrypt$1$cc$dd;;bad');
  expect([...u.keys()]).toEqual(['ana', 'luis']);
  expect(u.get('luis')).toBe('scrypt$1$cc$dd');
});

test('a session verifies, expires and rejects tampering or another key', () => {
  const t = sign('ana', 'k'.repeat(40), 1_000);
  expect(verify(t, 'k'.repeat(40), 2_000)).toBe('ana');
  expect(verify(t, 'k'.repeat(40), 1_000 + 9 * 3600 * 1000)).toBeNull();
  expect(verify(t, 'j'.repeat(40), 2_000)).toBeNull();
  expect(verify(t.replace('.', 'x.'), 'k'.repeat(40), 2_000)).toBeNull();
  expect(verify('', 'k', 1)).toBeNull();
});

test('only same-origin requests pass', () => {
  expect(sameOrigin({ headers: { origin: 'https://a.vercel.app', host: 'a.vercel.app' } })).toBe(true);
  expect(sameOrigin({ headers: { origin: 'https://evil.test', host: 'a.vercel.app' } })).toBe(false);
  expect(sameOrigin({ headers: { host: 'a.vercel.app' } })).toBe(false);
});
