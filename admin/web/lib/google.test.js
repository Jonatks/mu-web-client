import { expect, test } from 'bun:test';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { allowedEmails, authUrl, makeNonce, nonceValid, verifyIdToken } from './google.js';

const KEY = 'k'.repeat(40);
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const keys = { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'a', alg: 'RS256' }] };
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (claims, kid = 'a') => {
  const body = `${b64({ alg: 'RS256', kid })}.${b64(claims)}`;
  return `${body}.${createSign('RSA-SHA256').update(body).sign(privateKey).toString('base64url')}`;
};
const good = () => ({ iss: 'https://accounts.google.com', aud: 'cid', exp: Date.now() / 1000 + 300, nonce: makeNonce(KEY), email: 'Ana@Gmail.com', email_verified: true });

test('a fresh nonce checks, an old or forged one does not', () => {
  const n = makeNonce(KEY);
  expect(nonceValid(n, KEY)).toBe(true);
  expect(nonceValid(n, 'x'.repeat(40))).toBe(false);
  expect(nonceValid(n, KEY, Date.now() + 11 * 60 * 1000)).toBe(false);
  expect(nonceValid('1.2.3', KEY)).toBe(false);
});

test('a signed token gives its verified email', () => {
  expect(verifyIdToken(token(good()), { clientId: 'cid', keys, nonceKey: KEY })).toBe('ana@gmail.com');
});

test('a token for another client, expired, unverified, unsigned or with a bad nonce is refused', () => {
  const bad = [{ aud: 'other' }, { exp: 1 }, { email_verified: false }, { nonce: 'x.y.z' }, { iss: 'https://evil' }];
  for (const b of bad) expect(() => verifyIdToken(token({ ...good(), ...b }), { clientId: 'cid', keys, nonceKey: KEY })).toThrow();
  expect(() => verifyIdToken(token(good(), 'zz'), { clientId: 'cid', keys, nonceKey: KEY })).toThrow();
  const t = token(good()).split('.');
  expect(() => verifyIdToken(`${t[0]}.${b64({ ...good(), email: 'x@y.z' })}.${t[2]}`, { clientId: 'cid', keys, nonceKey: KEY })).toThrow();
});

test('the allow list and the Google URL', () => {
  expect([...allowedEmails('A@x.com, b@y.com;')]).toEqual(['a@x.com', 'b@y.com']);
  const u = new URL(authUrl({ clientId: 'cid', redirectUri: 'https://h/google', nonce: 'n' }));
  expect(u.searchParams.get('response_type')).toBe('id_token');
  expect(u.searchParams.get('redirect_uri')).toBe('https://h/google');
});
