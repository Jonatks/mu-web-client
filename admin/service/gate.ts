// "Is anybody connected to a game server?" OpenMU keeps a player's data in memory while he is online, so no
// character is written then. OpenMU has no online list, so the sockets of its own container are counted: a sidecar
// that shares the OpenMU network namespace (gate-sidecar.ts) writes the count to a file every two seconds.
import { readFileSync } from 'node:fs';

export const GAME_PORTS = [45901, 45902, 45903, 45904, 45905, 45906];
export const MAX_AGE_MS = 15_000;

export type Sockets = { listening: number; established: number };

/** Sockets on the game ports in the text of /proc/net/tcp (or tcp6): state 0A listens, 01 is a connected player. */
export function countSockets(text: string, ports: number[] = GAME_PORTS): Sockets {
  const out: Sockets = { listening: 0, established: 0 };
  for (const l of text.split('\n').slice(1)) {
    const f = l.trim().split(/\s+/);
    const port = parseInt((f[1] ?? '').split(':')[1] ?? '', 16);
    if (!ports.includes(port)) continue;
    if (f[3] === '0A') out.listening++;
    else if (f[3] === '01') out.established++;
  }
  return out;
}

export class GateError extends Error {}

export type GateFile = { at: number; listening: number; established: number };

/** Throws unless the sidecar's file is fresh, shows the game ports listening and nobody connected (fails closed). */
export function assertNobodyConnected(file: string, now = Date.now(), read: (p: string) => string = p => readFileSync(p, 'utf8')): void {
  let g: GateFile;
  try { g = JSON.parse(read(file)) as GateFile; } catch { throw new GateError('cannot check who is connected (no gate file), so nothing is written'); }
  if (typeof g.at !== 'number' || now - g.at > MAX_AGE_MS) throw new GateError('the connection check is stale, so nothing is written');
  if (g.listening < 1) throw new GateError('the game servers are not listening: cannot tell who is connected, so nothing is written');
  if (g.established > 0) throw new GateError(`${g.established} connection(s) to the game servers: no player may be connected while editing`);
}
