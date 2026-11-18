// 사용: npm i puppeteer-core && node shoot.js "$(pwd)"  (Chrome 경로는 executablePath에서 수정)
// 출력: 1-mobile → 2-desktop → 3-reduced-motion → 4-no-js (+ -full, -fastscroll) 와 콘솔 점검 결과
const puppeteer = require('/tmp/pt/node_modules/puppeteer-core');
const dir = process.argv[2] + '/shots'; const url = process.argv[3];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'], headless: 'new' });
  const run = async (name, vp, opts = {}) => {
    const p = await b.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
    await p.setViewport(vp);
    if (opts.noJs) await p.setJavaScriptEnabled(false);
    if (opts.reduce) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await p.goto(url, { waitUntil: 'load', timeout: 60000 }); await new Promise(r => setTimeout(r, opts.noJs || opts.reduce ? 1200 : 7000));
    await p.screenshot({ path: `${dir}/${name}.png` });
    if (opts.full) {
      // 빠른 스크롤: 끝까지 내렸다가 중간에서 멈춘 뒤 즉시 캡처
      if (!opts.noJs) { await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.62));
        await new Promise(r => setTimeout(r, 650)); await p.screenshot({ path: `${dir}/${name}-fastscroll.png` });
        // 전체 페이지용: 모든 reveal 보이게 될 때까지 스크롤
        const H = await p.evaluate(() => document.body.scrollHeight);
        for (let y = 0; y < H; y += vp.height / 2) { await p.evaluate(y => scrollTo(0, y), y); await new Promise(r => setTimeout(r, 120)); }
        await p.evaluate(() => scrollTo(0, 0)); await new Promise(r => setTimeout(r, 300)); }
      await p.screenshot({ path: `${dir}/${name}-full.png`, fullPage: true });
    }
    const info = opts.noJs ? {} : await p.evaluate(() => ({ tier: document.documentElement.dataset.tier, cls: document.documentElement.className,
      hiddenReveals: [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity < 0.99).length,
      overflowX: document.documentElement.scrollWidth > innerWidth, debugVisible: !document.querySelector('.debug').hidden, slow: performance.getEntriesByType('navigation')[0].loadEventEnd|0 }));
    console.log(name, JSON.stringify(info), 'errors:', errs.length ? errs : 'none'); await p.close();
  };
  await run('1-mobile', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, { full: true });
  await run('2-desktop', { width: 1440, height: 900 }, { full: true });
  await run('3-reduced-motion', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, { reduce: true, full: true });
  await run('4-no-js', { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true }, { noJs: true, full: true });
  // 키보드: 첫 Tab이 skip link인지
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 }); await p.goto(url);
  await p.keyboard.press('Tab'); console.log('first tab:', await p.evaluate(() => document.activeElement.textContent.trim()));
  await b.close();
})();
