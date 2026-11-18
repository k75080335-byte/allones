// 장면별 스크롤 스냅샷: node scenes.js W H DPR
const puppeteer = require('/tmp/pt/node_modules/puppeteer-core');
const [W = 1440, H = 900, DPR = 1] = process.argv.slice(2).map(Number);
const tag = W < 900 ? 'm' : 'd';
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: W, height: H, deviceScaleFactor: DPR, isMobile: W < 900, hasTouch: W < 900 });
  await p.goto('http://localhost:8765/index.html?tier=high', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 9000));
  const pos = await p.evaluate(() => { const h = innerHeight, d = document.querySelector('.depth'), r = document.querySelector('.rise'), c = document.querySelector('.chapters');
    return { z30: h * 1.5 * .3, z60: h * 1.5 * .6, z85: h * 1.5 * .85, depth: d.offsetTop + h * .55, rise: r.offsetTop + h * .1, bloom: r.offsetTop + r.offsetHeight - h * 1.05, chap: c.offsetTop + h * .4 }; });
  for (const [k, y] of Object.entries(pos)) {
    await p.evaluate(y => scrollTo(0, y), y); await new Promise(r => setTimeout(r, 1600));
    await p.screenshot({ path: `shots/scene-${tag}-${k}.png` });
  }
  // menu ink bleed mid-frame
  await p.evaluate(() => scrollTo(0, 0)); await new Promise(r => setTimeout(r, 800));
  await p.click('.menu a[href="#world"]'); await new Promise(r => setTimeout(r, 420));
  await p.screenshot({ path: `shots/scene-${tag}-menubleed.png` });
  await new Promise(r => setTimeout(r, 1500)); await p.screenshot({ path: `shots/scene-${tag}-menuarrive.png` });
  console.log(tag, 'tier', await p.evaluate(() => document.documentElement.dataset.tier), 'hash', await p.evaluate(() => location.hash), 'errors', errs.length ? errs : 'none');
  await b.close();
})();
