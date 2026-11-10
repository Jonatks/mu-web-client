// Sirve dist/ local y pide al VM lo que falte (game-assets, items)
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = process.argv[2], port = +process.argv[3] || 8089;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]); if (u === '/') u = '/index.html';
  const f = path.join(DIST, u);
  if (f.startsWith(DIST) && fs.existsSync(f) && fs.statSync(f).isFile()) {
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res);
  }
  const p = http.request({ host: '155.181.133.84', port: 80, path: req.url, method: req.method, headers: { ...req.headers, host: '155.181.133.84' } }, r => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
  p.on('error', e => { res.writeHead(502); res.end(String(e)); }); req.pipe(p);
}).listen(port, () => console.log('devserve', port));
