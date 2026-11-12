// Comprobación desde FUERA de la VM (p. ej. Cloud Shell), sin cuentas ni contraseñas:
// que el proxy abre el servidor de conexión y el de juego con la IP publica, y rechaza el resto.
//   node check-remote.js [ws://IP:8090] [IP]       (Node 22 o superior: WebSocket integrado)
const base = process.argv[2] || 'ws://155.181.133.84:8090';
const ip = process.argv[3] || '155.181.133.84';

const probe = (host, port) =>
  new Promise(resolve => {
    let state = 'refused', first = '';
    const ws = new WebSocket(`${base}/?host=${host}&port=${port}`);
    ws.binaryType = 'arraybuffer';
    const done = () => { clearTimeout(timer); try { ws.close(); } catch {} resolve({ state, first }); };
    const timer = setTimeout(() => { if (state === 'open') state = 'open (sin datos)'; done(); }, 3500);
    ws.onopen = () => { state = 'open'; };
    ws.onmessage = e => { first = Buffer.from(e.data).subarray(0, 8).toString('hex'); state = 'open+datos'; done(); };
    ws.onerror = () => { if (state === 'refused') done(); };
    ws.onclose = () => done();
  });

const cases = [
  [ip, 44405, 'abre', 'servidor de conexión (con IP publica)'],
  [ip, 45901, 'abre', 'servidor de juego 1 (saluda con C1 .. F1 00)'],
  [ip, 22, 'rechaza', 'SSH por la IP publica'],
  [ip, 5432, 'rechaza', 'Postgres por la IP publica'],
  ['127.0.0.1', 22, 'rechaza', 'SSH por loopback'],
  ['127.0.0.1', 55980, 'rechaza', 'panel de OpenMU por loopback'],
  ['169.254.169.254', 80, 'rechaza', 'metadatos de la nube'],
  ['8.8.8.8', 53, 'rechaza', 'destino externo'],
];

let bad = 0;
for (const [h, p, want, what] of cases) {
  const r = await probe(h, p);
  const opened = r.state.startsWith('open');
  const ok = want === 'abre' ? opened : !opened;
  if (!ok) bad++;
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${h}:${p} ${what} -> ${r.state}${r.first ? ' ' + r.first : ''}`);
}
console.log(bad ? `RESULTADO: ${bad} falla(s)` : 'RESULTADO: todo OK');
process.exit(bad ? 1 : 0);
