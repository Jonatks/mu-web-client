// Prints the ADMIN_USERS entry for one admin: node mkhash.mjs NAME   (asks for the password without showing it)
import { makeHash } from './lib/auth.js';

const name = process.argv[2];
if (!/^[A-Za-z0-9_.-]{1,32}$/.test(name ?? '')) { console.error('usage: node mkhash.mjs NAME'); process.exit(1); }
process.stderr.write('Password (hidden, 10+ characters): ');
const stdin = process.stdin;
stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
let pw = '';
stdin.on('data', async c => {
  for (const ch of c) {
    if (ch === '\r' || ch === '\n') {
      stdin.setRawMode(false); stdin.pause(); process.stderr.write('\n');
      if (pw.length < 10) { console.error('Too short.'); process.exit(1); }
      console.log(`${name}=${await makeHash(pw)}`);
      return;
    }
    if (ch === '\u0003') process.exit(1);
    if (ch === '\u007f') pw = pw.slice(0, -1); else pw += ch;
  }
});
