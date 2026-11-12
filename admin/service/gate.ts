// "Is anybody connected to a game server?" OpenMU keeps a player's data in memory while he is online, so no
// character is written then. It has no online list, so the connections to the game ports are counted instead.
import { readFileSync } from 'node:fs';

export const GAME_PORTS = [45901, 45902, 45903, 45904, 45905, 45906];

/** Connections to a game port in the text of /proc/net/nf_conntrack or /proc/net/tcp. Null when it is neither. */
export function countConnected(text: string, ports: number[] = GAME_PORTS): number | null {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return 0;
  let n = 0;
  if (/^\s*sl\s+local_address/.test(lines[0] ?? '')) {
    for (const l of lines.slice(1)) {
      const f = l.trim().split(/\s+/);
      const port = (a?: string) => parseInt((a ?? '').split(':')[1] ?? '', 16);
      if (f[3] === '01' && (ports.includes(port(f[2])) || ports.includes(port(f[1])))) n++;
    }
    return n;
  }
  if (!/^(ipv4|ipv6)\s/.test(lines[0] ?? '')) return null;
  for (const l of lines) {
    if (!/\stcp\s/.test(l) || !l.includes(' ESTABLISHED ')) continue;
    const d = /\sdport=(\d+)/.exec(l);
    if (d && ports.includes(Number(d[1]))) n++;
  }
  return n;
}

export class GateError extends Error {}

/** Throws unless the sources can be read and show nobody connected (fails closed). */
export function assertNobodyConnected(paths: string[], read: (p: string) => string = p => readFileSync(p, 'utf8')): void {
  let checked = 0;
  for (const p of paths) {
    let text: string;
    try { text = read(p); } catch { continue; }
    const n = countConnected(text);
    if (n === null) continue;
    checked++;
    if (n > 0) throw new GateError(`${n} connection(s) to the game servers: no player may be connected while editing`);
  }
  if (checked === 0) throw new GateError('cannot check who is connected, so nothing is written');
}
