import { sameOrigin, sessionCookie, sign } from '../lib/auth.js';
import { allowedEmails, CERTS_URL, verifyIdToken } from '../lib/google.js';

let certs = null;
let certsAt = 0;
async function googleKeys() {
  if (!certs || Date.now() - certsAt > 3600 * 1000) {
    const r = await fetch(CERTS_URL);
    if (!r.ok) throw new Error('certs');
    certs = await r.json();
    certsAt = Date.now();
  }
  return certs;
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST' || !sameOrigin(req)) return res.status(405).json({ error: 'method' });
  const key = process.env.MU_ADMIN_KEY;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!key || !clientId) return res.status(503).json({ error: 'Google sign-in is not set up.' });
  let email;
  try {
    email = verifyIdToken(req.body?.id_token, { clientId, keys: await googleKeys(), nonceKey: key });
  } catch {
    return res.status(401).json({ error: 'Google no confirmó la cuenta. Vuelve a intentarlo.' });
  }
  if (!allowedEmails(process.env.ADMIN_GOOGLE_EMAILS).has(email)) return res.status(403).json({ error: `${email} no tiene acceso al editor.` });
  res.setHeader('set-cookie', sessionCookie(sign(email, key)));
  return res.status(200).json({ user: email });
}
