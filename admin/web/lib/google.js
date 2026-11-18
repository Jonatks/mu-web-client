// "Entrar con Google": the OpenID Connect implicit flow (an id_token in the URL fragment), so no client secret is
// needed. The nonce is stateless (time + random + HMAC) and the token is checked against Google's published keys.
import { createHmac, createPublicKey, createVerify, randomBytes, timingSafeEqual } from 'node:crypto';

const NONCE_SECONDS = 600;
const ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);
export const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

const mac = (text, key) => createHmac('sha256', `google-nonce:${key}`).update(text).digest('base64url');

export function makeNonce(key, now = Date.now()) {
  const body = `${Math.floor(now / 1000)}.${randomBytes(12).toString('base64url')}`;
  return `${body}.${mac(body, key)}`;
}

export function nonceValid(nonce, key, now = Date.now()) {
  const [ts, rand, sig] = String(nonce ?? '').split('.');
  if (!ts || !rand || !sig || !key) return false;
  const want = Buffer.from(mac(`${ts}.${rand}`, key));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return false;
  const age = now / 1000 - Number(ts);
  return age >= -60 && age <= NONCE_SECONDS;
}

export function authUrl({ clientId, redirectUri, nonce }) {
  const q = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'id_token', scope: 'openid email', nonce, prompt: 'select_account' });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

/** ADMIN_GOOGLE_EMAILS = "a@gmail.com, b@gmail.com" */
export const allowedEmails = text => new Set(String(text ?? '').split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean));

const part = s => JSON.parse(Buffer.from(s, 'base64url').toString());

/** The verified email inside a Google id_token, or throws. `keys` is Google's JWK set ({ keys: [...] }). */
export function verifyIdToken(token, { clientId, keys, nonceKey, now = Date.now() }) {
  const [h, p, s] = String(token ?? '').split('.');
  if (!h || !p || !s) throw new Error('bad token');
  const header = part(h);
  const jwk = keys?.keys?.find(k => k.kid === header.kid);
  if (header.alg !== 'RS256' || !jwk) throw new Error('unknown key');
  const ok = createVerify('RSA-SHA256').update(`${h}.${p}`).verify(createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(s, 'base64url'));
  if (!ok) throw new Error('bad signature');
  const c = part(p);
  if (!ISSUERS.has(c.iss) || c.aud !== clientId) throw new Error('wrong audience');
  if (!(c.exp * 1000 > now)) throw new Error('expired');
  if (!nonceValid(c.nonce, nonceKey, now)) throw new Error('bad nonce');
  if (!c.email || c.email_verified !== true) throw new Error('email not verified');
  return String(c.email).toLowerCase();
}
