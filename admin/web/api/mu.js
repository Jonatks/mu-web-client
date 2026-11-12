// The only door to the VM service. The browser never sees the key or the VM address.
import { sameOrigin, userOf } from '../lib/auth.js';

const ROUTES = [
  /^\/status$/, /^\/players\/disconnect$/, /^\/audit$/, /^\/undo(\/[a-z0-9-]+)?$/,
  /^\/accounts(\/[A-Za-z0-9]{1,10}(\/(password|state|vault|classes|cashshop))?)?$/, /^\/accounts\/[A-Za-z0-9]{1,10}\/cashshop\/[0-9a-f-]{36}$/, /^\/accounts\/[A-Za-z0-9]{1,10}\/vault\/items(\/[0-9a-f-]{36})?$/,
  /^\/characters(\/[A-Za-z0-9_]{1,10}(\/(items|skills|quests|letters|gens)(\/([0-9a-f-]{36}|available|[0-9]{1,5}))?)?)?$/,
  /^\/(classes|maps)$/, /^\/skills\/definitions$/, /^\/items\/[0-9a-f-]{36}(\/move)?$/,
  /^\/items\/definitions(\/[0-9a-f-]{36})?$/,
];

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const key = process.env.MU_ADMIN_KEY;
  const base = process.env.MU_ADMIN_URL;
  const user = userOf(req, key);
  if (!user) return res.status(401).json({ error: 'not signed in' });
  if (req.method !== 'GET' && !sameOrigin(req)) return res.status(403).json({ error: 'forbidden' });
  if (!key || !base) return res.status(500).json({ error: 'The server is not configured (MU_ADMIN_URL, MU_ADMIN_KEY).' });
  const target = new URL(String(req.query.p ?? ''), 'http://x');
  const path = decodeURIComponent(target.pathname);
  if (!String(req.query.p ?? '').startsWith('/') || path.includes('..') || !ROUTES.some(r => r.test(path))) return res.status(400).json({ error: 'bad path' });
  try {
    const r = await fetch(base.replace(/\/$/, '') + target.pathname + target.search, {
      method: req.method,
      headers: { 'x-admin-key': key, 'x-admin-user': user, 'content-type': 'application/json' },
      body: req.method === 'GET' || req.method === 'DELETE' ? undefined : JSON.stringify(req.body ?? {}),
      signal: AbortSignal.timeout(25_000),
    });
    const text = await r.text();
    res.status(r.status).setHeader('content-type', 'application/json').send(text);
  } catch {
    res.status(502).json({ error: 'The game server did not answer.' });
  }
}
