// Admin sign-in for the Vercel functions: scrypt password hashes, signed session cookie, same-origin check. No dependencies.
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const N = 16384;
const COOKIE = 'mu_admin';
export const SESSION_SECONDS = 8 * 3600;

const kdf = (password, salt, n) => new Promise((resolve, reject) => scrypt(password, salt, 32, { N: n, r: 8, p: 1 }, (e, k) => (e ? reject(e) : resolve(k))));

/** "scrypt$16384$<salt hex>$<hash hex>" for a password. */
export async function makeHash(password) {
  const salt = randomBytes(16);
  return `scrypt$${N}$${salt.toString('hex')}$${(await kdf(password, salt, N)).toString('hex')}`;
}

export async function checkPassword(password, record) {
  const [alg, n, salt, hash] = String(record ?? '').split('$');
  if (alg !== 'scrypt' || !n || !salt || !hash) return false;
  const want = Buffer.from(hash, 'hex');
  const got = await kdf(password, Buffer.from(salt, 'hex'), Number(n));
  return want.length === got.length && timingSafeEqual(want, got);
}

/** ADMIN_USERS = "name=scrypt$...;name2=scrypt$..." */
export function parseUsers(text) {
  const users = new Map();
  for (const part of String(text ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) users.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return users;
}

const secret = key => createHmac('sha256', String(key)).update('mu-admin-session').digest();

export function sign(user, key, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ u: user, exp: now + SESSION_SECONDS * 1000 })).toString('base64url');
  return `${body}.${createHmac('sha256', secret(key)).update(body).digest('base64url')}`;
}

/** The user name inside a valid, unexpired token, or null. */
export function verify(token, key, now = Date.now()) {
  const [body, mac] = String(token ?? '').split('.');
  if (!body || !mac || !key) return null;
  const want = createHmac('sha256', secret(key)).update(body).digest();
  const got = Buffer.from(mac, 'base64url');
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString());
    return typeof s.u === 'string' && s.exp > now ? s.u : null;
  } catch {
    return null;
  }
}

export const sessionCookie = (token, seconds = SESSION_SECONDS) => `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${seconds}`;

export function userOf(req, key) {
  const m = new RegExp(`(?:^|; )${COOKIE}=([^;]+)`).exec(req.headers.cookie ?? '');
  return m ? verify(m[1], key) : null;
}

/** Writes must come from this site's own page. */
export function sameOrigin(req) {
  const o = req.headers.origin;
  return !!o && new URL(o).host === req.headers.host;
}
