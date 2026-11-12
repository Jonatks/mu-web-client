import { checkPassword, parseUsers, sameOrigin, sessionCookie, sign } from '../lib/auth.js';

// The same work runs for a wrong user as for a wrong password, so timing does not tell them apart.
const DUMMY = 'scrypt$16384$00000000000000000000000000000000$' + '00'.repeat(32);
const tries = new Map();

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST' || !sameOrigin(req)) return res.status(405).json({ error: 'method' });
  const key = process.env.MU_ADMIN_KEY;
  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'x';
  const now = Date.now();
  const recent = (tries.get(ip) ?? []).filter(t => now - t < 10 * 60 * 1000);
  if (recent.length >= 8) return res.status(429).json({ error: 'Too many attempts, wait a few minutes.' });
  const { user, password } = req.body ?? {};
  const record = parseUsers(process.env.ADMIN_USERS).get(String(user ?? ''));
  const ok = await checkPassword(String(password ?? ''), record ?? DUMMY);
  if (!key || !record || !ok) {
    tries.set(ip, [...recent, now]);
    await new Promise(r => setTimeout(r, 700));
    return res.status(401).json({ error: 'Wrong user or password.' });
  }
  res.setHeader('set-cookie', sessionCookie(sign(user, key)));
  return res.status(200).json({ user });
}
