const puppeteer = require('/tmp/pt/node_modules/puppeteer-core');
const url = process.argv[2], dir = process.argv[3];
const W = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'], headless: 'new' });
  const run = async (name, vp, reduce) => {
    const p = await b.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
    p.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
    p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    await p.setViewport(vp);
    if (reduce) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await p.goto(url, { waitUntil: 'load', timeout: 60000 }); await W(2500);
    await p.evaluate(() => { const d = document.querySelector('.lp-deck'); d.scrollIntoView({block: 'center'}); }); await W(1500);
    const shot = n => p.screenshot({ path: `${dir}/${name}_${n}.png` });
    const st = () => p.evaluate(() => { const v = document.querySelector('.lp-vinyl'), s = document.querySelector('.lp-disc-shift'), a = document.querySelector('#pv');
      const sr = document.querySelector('.lp-sleeve').getBoundingClientRect(), dr = s.getBoundingClientRect();
      return { shiftPx: Math.round(dr.left - sr.left), sleeveW: Math.round(sr.width), rot: v.style.transform, paused: a.paused, muted: a.muted, t: +a.currentTime.toFixed(2), src: a.src.split('/').pop(), state: document.querySelector('.lp-state').textContent, pressed: document.querySelector('.lp-sleeve').getAttribute('aria-pressed'), spinning: document.querySelector('.lp-deck').classList.contains('is-spinning'), canvases: document.querySelectorAll('canvas').length }; });
    await shot('1_cover'); const s1 = await st();
    const cdp = await p.target().createCDPSession(); await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.12 });
    await p.focus('.lp-sleeve'); await p.keyboard.press('Enter'); await W(reduce ? 300 : 2600); const s2 = await st(); await shot('2_midslide');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await W(2600); await shot('3_spinning'); const s3 = await st();
    await W(450); const s3b = await st();
    // measure revolution speed
    const rps = await p.evaluate(() => new Promise(res => { const v = document.querySelector('.lp-vinyl'); const g = () => parseFloat((v.style.transform.match(/rotate\(([-\d.]+)deg/)||[0,0])[1]); const a = g(), t0 = performance.now(); setTimeout(() => { let d = g() - a; if (d < 0) d += 360; res((d / ((performance.now() - t0) / 1000)).toFixed(1) + ' deg/s'); }, 500); }));
    await p.keyboard.press('Space'); await W(700); await shot('4_slowing'); const s4 = await st();
    await W(3500); const s5 = await st();
    // track list click → switch track + label
    const tb = await p.$$('.tracks li:not(.prep) button'); await tb[3].click(); await W(1500); const s6 = await st(); await shot('5_track_switch');
    const label = await p.evaluate(() => document.querySelector('.lp-label').src.split('/').pop());
    console.log(name, JSON.stringify({ s1, s2, s3, s3b, rps, s4, s5, s6, label }), '\nERRORS:', errs.length ? errs : 'none');
    await p.close();
  };
  await run('390x844', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await run('1280x800', { width: 1280, height: 800 });
  await run('390x844_reduced', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, true);
  await b.close();
})();
