// Talks to the admin bridge plugin inside OpenMU through two files in a shared folder:
// players.json (who is online, rewritten every 2 s by the plugin) and disconnect (logins to disconnect, one per line).
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bad } from './errors';
import { auditNote } from './undo';

export type OnlinePlayer = { login: string; character: string | null; map: string | null; x: number; y: number };
const FRESH_MS = 10_000;
const SAVE_MARGIN_MS = 4000;

/** The online list, or null when the plugin is not running (no file, or an old one). */
export function readOnline(dir: string): { at: number; players: OnlinePlayer[] } | null {
  try {
    const f = JSON.parse(readFileSync(join(dir, 'players.json'), 'utf8').replace(/^\uFEFF/, '')) as { at: string; players: Record<string, unknown>[] };
    const at = Date.parse(f.at);
    if (!(Date.now() - at < FRESH_MS)) return null;
    return { at, players: f.players.map(p => ({ login: String(p.login ?? p.Login), character: (p.character ?? p.Character ?? null) as string | null, map: (p.map ?? p.Map ?? null) as string | null, x: Number(p.x ?? p.X ?? 0), y: Number(p.y ?? p.Y ?? 0) })) };
  } catch { return null; }
}

export const isOnline = (dir: string, login: string) => readOnline(dir)?.players.some(p => p.login.toLowerCase() === login.toLowerCase()) ?? false;

/** Disconnects one account; OpenMU saves the character as when a player leaves. */
export async function disconnectAccount(dir: string, login: string, admin: string, waitMs = 12_000) {
  if (!/^[A-Za-z0-9_]{1,10}$/.test(login)) throw bad('Not a valid account name.');
  const seen = readOnline(dir);
  if (!seen) throw bad('El plugin de desconexión no está activo. Usa «Desconectar a todos».');
  if (!seen.players.some(p => p.login.toLowerCase() === login.toLowerCase())) return { connected: false, done: true };
  const asked = Date.now();
  const tmp = join(dir, 'disconnect.tmp');
  writeFileSync(tmp, login + '\n', { mode: 0o666 });
  renameSync(tmp, join(dir, 'disconnect'));
  let done = false;
  while (Date.now() - asked < waitMs) {
    await Bun.sleep(500);
    const now = readOnline(dir);
    if (now && now.at > asked && !now.players.some(p => p.login.toLowerCase() === login.toLowerCase())) { done = true; break; }
  }
  if (done) await Bun.sleep(SAVE_MARGIN_MS);
  auditNote({ admin, action: 'players.disconnect', target: login, detail: { done } });
  return { connected: true, done, requestLeft: existsSync(join(dir, 'disconnect')) };
}
