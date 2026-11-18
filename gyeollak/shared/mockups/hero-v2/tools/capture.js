// 사용: node capture.js [width] [height] [fps] [outdir] [dpr]
const puppeteer = require('/tmp/pt/node_modules/puppeteer-core');
const [W = 1440, H = 900, FPS = 30, OUT = 'frames', DPR = 1] = process.argv.slice(2);
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => (m.type() === 'error' || m.type() === 'warn' || m.type()==='info') && errs.push(m.type()+': '+m.text()));
  await p.setViewport({ width: +W, height: +H, deviceScaleFactor: +DPR, isMobile: +W < 900, hasTouch: +W < 900 });
  await p.goto(`http://localhost:8765/index.html?capture&tier=high`, { waitUntil: 'networkidle0' });
  await p.evaluate(() => window.__cap.ready);
  const tier = await p.evaluate(() => document.documentElement.dataset.tier);
  console.log('tier', tier);
  const dur = 6.2, n = Math.round(dur * FPS);
  for (let i = 0; i <= n; i++) {
    const t = i / FPS; await p.evaluate(t => window.__cap.seek(t), t);
    await p.screenshot({ path: `${OUT}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 88 });
    if (i % 30 === 0) process.stdout.write(`${t.toFixed(1)}s `);
  }
  console.log('\nerrors:', errs.length ? errs : 'none'); await b.close();
})();
