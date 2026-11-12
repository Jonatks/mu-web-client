// Runs in a container that shares OpenMU's network namespace, so /proc/net/tcp is OpenMU's own socket table.
// It writes the count of connected players every 2 s; it exits (and is restarted into the current namespace) when no game port listens.
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { countSockets, type GateFile } from './gate';

const OUT = process.env.GATE_FILE ?? '/var/lib/mu-admin/online.json';
let blind = 0;

setInterval(() => {
  let listening = 0;
  let established = 0;
  for (const f of ['/proc/net/tcp', '/proc/net/tcp6']) {
    try {
      const c = countSockets(readFileSync(f, 'utf8'));
      listening += c.listening;
      established += c.established;
    } catch { /* tcp6 may not exist */ }
  }
  blind = listening === 0 ? blind + 1 : 0;
  if (blind > 5) process.exit(1);
  const g: GateFile = { at: Date.now(), listening, established };
  writeFileSync(`${OUT}.tmp`, JSON.stringify(g));
  renameSync(`${OUT}.tmp`, OUT);
}, 2000);
