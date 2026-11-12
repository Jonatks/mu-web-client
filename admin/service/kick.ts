// Disconnects every player so the panel can edit. A small container that shares OpenMU's network (mu-kick) closes the
// sockets on the game ports when it sees the `kick` file; OpenMU then saves each character as if the player had left.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { GateFile } from './gate';
import { auditNote } from './undo';

const SAVE_MARGIN_MS = 4000;
const readGate = (file: string): GateFile | null => { try { return JSON.parse(readFileSync(file, 'utf8')) as GateFile; } catch { return null; } };

export async function kickAll(gateFile: string, admin: string, waitMs = 14_000) {
  const before = readGate(gateFile)?.established ?? 0;
  const asked = Date.now();
  writeFileSync(join(dirname(gateFile), 'kick'), String(asked), { mode: 0o600 });
  let done = false;
  while (Date.now() - asked < waitMs) {
    await Bun.sleep(500);
    const g = readGate(gateFile);
    if (g && g.at > asked && g.established === 0) { done = true; break; }
  }
  if (done) await Bun.sleep(SAVE_MARGIN_MS);
  auditNote({ admin, action: 'players.disconnect', target: 'all', detail: { connected: before, done } });
  return { connected: before, done, kickFileLeft: existsSync(join(dirname(gateFile), 'kick')) };
}
