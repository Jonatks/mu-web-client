const { chromium, devices } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8088/';
const OUT = process.env.OUT || require('path').join(process.cwd(), 'e2e-shots');
const USER = process.env.MU_USER || 'test0';
const NEWCHAR = process.env.NEWCHAR || '';
fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const ts = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p7 = devices['Pixel 7 landscape'] || devices['Pixel 7'];
  const ctx = await browser.newContext({ ...p7, viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true });
  if (process.env.LOCAL_MU) await ctx.addInitScript(() => { const k='_mu_key'; const c=JSON.parse(localStorage.getItem(k)||'{}'); Object.assign(c,{csIp:'127.0.0.1',wsHost:'ws://localhost',wsPort:8090}); localStorage.setItem(k, JSON.stringify(c)); });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => logs.push(`[${ts()}][${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[${ts()}][pageerror] ${e.message}`));
  page.on('requestfailed', r => logs.push(`[${ts()}][reqfail] ${r.url()} ${r.failure()?.errorText}`));
  let bytes = 0, reqs = 0;
  page.on('response', async r => { reqs++; const l = +(r.headers()['content-length'] || 0); bytes += l; });
  const shot = async n => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log(ts(), 'shot', n); };
  const dump = () => fs.writeFileSync(`${OUT}/console.log`, logs.join('\n'));
  try {
    await page.goto(BASE + '?mock=1', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500); await shot('01-launcher');
    await page.waitForSelector('.play-btn:not([disabled])', { timeout: 180000 });
    console.log(ts(), 'preload listo', reqs, 'reqs', (bytes / 1e6).toFixed(1), 'MB');
    await shot('02-launcher-listo');
    await page.click('.play-btn');
    await page.waitForTimeout(1500); await shot('03-servidores');
    const srv = await page.waitForSelector('.mu-server, .mu-login', { timeout: 30000 });
    if (await srv.evaluate(e => e.classList.contains('mu-server'))) { await page.click('.mu-server >> nth=0'); }
    await page.waitForSelector('.mu-login input[type=text]', { timeout: 30000 });
    await shot('04-login');
    await page.fill('.mu-login input[type=text]', USER);
    await page.fill('.mu-login input[type=password]', USER);
    await page.click('.mu-login button[type=submit]');
    await page.waitForSelector('.mu-chars', { timeout: 30000 });
    await page.waitForTimeout(800); await shot('05-cargando-personajes');
    await page.waitForSelector('.mu-chars-body', { timeout: 30000 });
    await page.waitForTimeout(1000); await shot('06-personajes');
    if (NEWCHAR) {
      await page.click('.mu-slot.empty');
      await page.waitForTimeout(500); await shot('07-crear');
      await page.fill('.mu-create input', NEWCHAR);
      await page.click('.mu-create .mu-row .mu-btn:not(.ghost)');
      await page.waitForTimeout(4000); await shot('08-tras-crear');
    }
    const names = await page.$$eval('.mu-slot .meta b', els => els.map(e => e.textContent));
    console.log(ts(), 'personajes:', names);
    const target = process.env.CHAR || NEWCHAR || names[0];
    if (target) {
      await page.click(`.mu-slot:has-text("${target}")`);
      await page.waitForTimeout(800);
      const ws0 = Date.now();
      await page.click('.mu-stage .mu-btn.big');
      await page.waitForTimeout(3000); await shot('09-cargando-mundo');
      for (let i = 0; i < 24; i++) {
        await page.waitForTimeout(5000);
        const st = await page.evaluate(() => window.__Store?.uiState);
        const ov = await page.$('.loading-overlay, .mu-loading');
        if (i % 4 === 3) await shot(`10-mundo-${i}`);
        if (st === 5 && !ov) { console.log(ts(), 'en el mundo tras', ((Date.now() - ws0) / 1000).toFixed(1), 's'); break; }
      }
      await page.waitForTimeout(4000); await shot('11-mundo');
      console.log(ts(), 'uiState', await page.evaluate(() => window.__Store?.uiState), 'total', reqs, 'reqs', (bytes / 1e6).toFixed(1), 'MB');
    }
  } catch (e) { console.log(ts(), 'ERROR', e.message); await shot('99-error'); }
  dump(); await browser.close();
})();
