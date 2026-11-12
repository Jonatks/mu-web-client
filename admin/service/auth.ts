// The service trusts one thing: a long key in the x-admin-key header, sent by the Vercel functions, never by a browser.
import { createHash, timingSafeEqual } from 'node:crypto';

const digest = (s: string) => Uint8Array.from(createHash('sha256').update(s).digest());

export function keyMatches(given: string | null, expected: string): boolean {
  if (!given || expected.length < 32) return false;
  return timingSafeEqual(digest(given), digest(expected));
}

/** Browsers always send Origin on cross-site requests; the Vercel functions never do. */
export function isBrowserRequest(h: Headers): boolean {
  return h.has('origin') || h.has('sec-fetch-site');
}
