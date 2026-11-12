import { userOf } from '../lib/auth.js';

export default function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const user = userOf(req, process.env.MU_ADMIN_KEY);
  return user ? res.status(200).json({ user }) : res.status(401).json({ error: 'not signed in' });
}
