// 움직이는 배경 위 글자 대비: 인트로 프레임마다 글자를 숨긴 배경을 찍고 박스 좌표·글자색을 저장 → contrast.py가 계산
const puppeteer = require('/tmp/pt/node_modules/puppeteer-core'); const fs = require('fs');
const [W, H, tag] = [+process.argv[2], +process.argv[3], process.argv[4]];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H, deviceScaleFactor: 1, isMobile: W < 900 });
  await p.goto('http://localhost:8765/index.html?capture&tier=high', { waitUntil: 'networkidle0' }); await p.evaluate(() => window.__cap.ready);
  await p.addStyleTag({ content: '.hidetext .hd *, .hidetext .kicker, .hidetext .kicker *, .hidetext .title *, .hidetext .slogan *, .hidetext .cue, .hidetext .btn, .hidetext .gauge *{color:transparent!important;border-color:transparent!important;background-color:transparent!important} .hidetext .cue i,.hidetext .gauge .dot,.hidetext .gauge .trk{visibility:hidden}' });
  const out = [];
  for (let t = 0; t <= 6.2001; t += .2) {
    await p.evaluate(t => window.__cap.seek(t), t);
    const items = await p.evaluate(() => {
      const sel = ['.brand-ko', '.brand-en', '.menu a', '.kicker', '.title .en', '.title .ko', '.slogan .br', '.cue', '.btn', '.gauge output'];
      const vis = el => { let e = el, o = 1; while (e && e !== document.documentElement) { const s = getComputedStyle(e); o *= +s.opacity; if (s.visibility === 'hidden' || s.display === 'none') return 0; e = e.parentElement; } return o; };
      return sel.flatMap(s => [...document.querySelectorAll(s)].map(el => { const r = el.getBoundingClientRect(); const c = getComputedStyle(el).color; return { s, x: r.left, y: r.top, w: r.width, h: r.height, color: c, op: vis(el), fs: parseFloat(getComputedStyle(el).fontSize), fw: getComputedStyle(el).fontWeight, blend: !!el.closest('.hd,.kicker,.gauge') && document.documentElement.classList.contains('blend') }; })).filter(i => i.w > 0);
    });
    await p.evaluate(() => document.documentElement.classList.add('hidetext'));
    const f = `_work/cx/${tag}_${t.toFixed(1)}.png`; await p.screenshot({ path: f });
    await p.evaluate(() => document.documentElement.classList.remove('hidetext'));
    out.push({ t: +t.toFixed(1), f, items });
  }
  fs.writeFileSync(`_work/cx/${tag}.json`, JSON.stringify(out)); await b.close();
})();
