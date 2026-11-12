import { sameOrigin, sessionCookie } from '../lib/auth.js';

export default function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST' || !sameOrigin(req)) return res.status(405).json({ error: 'method' });
  res.setHeader('set-cookie', sessionCookie('', 0));
  return res.status(200).json({ ok: true });
}
