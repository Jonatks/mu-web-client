import { authUrl, makeNonce } from '../lib/google.js';

// Sends the browser to Google; it comes back to /google with the id_token in the fragment.
export default function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const key = process.env.MU_ADMIN_KEY;
  if (!clientId || !key) return res.status(503).json({ error: 'Google sign-in is not set up.' });
  const redirectUri = `https://${req.headers.host}/google`;
  res.setHeader('location', authUrl({ clientId, redirectUri, nonce: makeNonce(key) }));
  return res.status(302).end();
}
