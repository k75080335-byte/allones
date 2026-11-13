/* 결락 v12 · SCENE — 結(맺히다) → 缺(떨어지다) → 결(물결·숨결)
   스크롤 = 하강. 구름 → ㅣ가 빠져 비 → 금붕어 → 바다 TV → 시아노 낙화 → 심연 → 손 → 눈을 뜨고 떠오름 → 네 사람 */
(() => {
  'use strict';
  const sec = document.getElementById('scene'), pin = sec.querySelector('.pin');
  const $ = s => pin.querySelector(s), $$ = s => [...pin.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const win = (p, a, b, f = .025) => sm(a - f, a + f, p) * (1 - sm(b - f, b + f, p));
  const lerp = (a, b, t) => a + (b - a) * t;

  function petal(g, L, W, curl) {
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(-W * .9, -L * .18, -W * 1.05, -L * .62, -W * .12 + curl, -L);
    g.bezierCurveTo(W * .78 + curl * .5, -L * .66, W * .95, -L * .2, 0, 0); g.closePath();
  }
  function makeFlower(mode) { // 0 = X-RAY, 1 = GLASS
    const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
    const t = document.createElement('canvas'); t.width = t.height = S; const g = t.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.translate(S / 2, S / 2); g.globalCompositeOperation = 'lighter';
    const P = [];
    for (let i = 0; i < 6; i++) P.push({ a: i * Math.PI / 3 + (i % 2 ? Math.PI / 6 * .0 : 0) + .26, L: i % 2 ? 380 : 430, W: i % 2 ? 150 : 128, c: (i % 2 ? -1 : 1) * 26 });
    P.sort((a, b) => a.L - b.L).reverse();
    P.forEach(p => {
      g.save(); g.rotate(p.a);
      petal(g, p.L, p.W, p.c);
      const gr = g.createLinearGradient(0, 0, 0, -p.L);
      if (mode === 0) { gr.addColorStop(0, 'rgba(255,255,255,.32)'); gr.addColorStop(.3, 'rgba(215,230,255,.17)'); gr.addColorStop(1, 'rgba(190,210,255,.10)'); }
      else { gr.addColorStop(0, 'rgba(23,75,255,.95)'); gr.addColorStop(.45, 'rgba(110,130,255,.55)'); gr.addColorStop(.85, 'rgba(210,190,255,.42)'); gr.addColorStop(1, 'rgba(255,235,250,.5)'); }
      g.fillStyle = gr; g.fill();
      // 잎맥
      for (let k = -8; k <= 8; k++) {
        const u = k / 8; g.beginPath(); g.moveTo(u * 6, -12);
        g.quadraticCurveTo(u * p.W * .95, -p.L * .45, u * p.W * .22 + p.c * .9, -p.L * .93);
        g.strokeStyle = mode === 0 ? `rgba(255,255,255,${k === 0 ? .55 : .15})` : `rgba(255,255,255,${k === 0 ? .4 : .12})`;
        g.lineWidth = k === 0 ? 3 : 1.1; g.stroke();
      }
      // 가는 가로 잎맥 (X-RAY 질감)
      if (mode === 0) for (let j = 1; j < 14; j++) {
        const y = -p.L * j / 14, w = p.W * Math.sin(Math.PI * j / 14) * .9;
        g.beginPath(); g.moveTo(-w, y + 8); g.quadraticCurveTo(0, y - 10, w, y + 8); g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; g.stroke();
      }
      petal(g, p.L, p.W, p.c); g.strokeStyle = mode === 0 ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.9)'; g.lineWidth = mode === 0 ? 2 : 3; g.stroke();
      g.restore();
    });
    // 수술 6 + 암술 1
    for (let i = 0; i < 7; i++) {
      const a = i * Math.PI * 2 / 6 + .55, len = i === 6 ? 330 : 270 + (i % 3) * 18, aa = i === 6 ? -.4 : a;
      const ex = Math.cos(aa) * len, ey = Math.sin(aa) * len;
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(aa + .35) * len * .55, Math.sin(aa + .35) * len * .55, ex, ey);
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = i === 6 ? 4 : 2.2; g.stroke();
      g.save(); g.translate(ex, ey); g.rotate(aa + Math.PI / 2);
      g.beginPath(); if (i === 6) { for (let k = 0; k < 3; k++) { g.moveTo(0, 0); g.arc(Math.cos(k * 2.1) * 9, Math.sin(k * 2.1) * 9, 9, 0, 7); } } else g.ellipse(0, 0, 22, 8, 0, 0, 7);
      g.fillStyle = mode === 0 ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.85)'; g.fill(); g.restore();
    }
    const core = g.createRadialGradient(0, 0, 0, 0, 0, 120); core.addColorStop(0, mode === 0 ? 'rgba(255,255,255,.22)' : 'rgba(180,200,255,.5)'); core.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = core; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill();
    // 합성: 원본 + 번짐(glow)
    const o = c.getContext('2d'); o.fillStyle = '#000'; o.fillRect(0, 0, S, S); o.drawImage(t, 0, 0);
    o.globalCompositeOperation = 'lighter'; o.filter = 'blur(16px)'; o.globalAlpha = mode === 0 ? .55 : .45; o.drawImage(t, 0, 0);
    o.filter = 'none'; o.globalAlpha = 1;
    if (mode === 0) { // X-ray 필름 입자
      const id = o.getImageData(0, 0, S, S), d = id.data;
      for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 26 * (d[i] / 255); d[i] += n; d[i + 1] += n; d[i + 2] += n; }
      o.putImageData(id, 0, 0);
    }
    return c;
  }


  const L = { sky: $('.sky'), fog: $('.fog'), cy: $('.cyano'), ab: $('.abyss'), end: $('.ending') };
  const logo = $('.logo'), li = $('.logo .li'), istroke = $('.istroke');
  const tv = $('.tv'), oc = $('#ocean'), og = oc.getContext('2d'), tc = $('#tc');
  const xf = $('#xflower'), sink = $('.fig.sink'), rise = $('.fig.rise'), slot = $('.slot');
  const cast = $('.cast'), castImgs = $$('.cast img'), endcard = $('.endcard');
  const caps = $$('.cap').map(c => ({ el: c, w: c.dataset.w.split(',').map(Number) }));
  const rail = $$('.rail li'), hSt = $('#hSt'), hAlt = $('#hAlt'), hint = $('.hint');
  const fx = $('#fx'), g = fx.getContext('2d');
  try { xf.src = makeFlower(0).toDataURL('image/png'); } catch (e) {}

  let W = 0, H = 0, DPR = 1;
  function resize() { DPR = Math.min(devicePixelRatio || 1, 1.5); W = pin.clientWidth; H = pin.clientHeight; fx.width = W * DPR; fx.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0); }

  /* ── 금붕어 (옅은 코발트 먹) ── */
  const R = (a, b) => a + Math.random() * (b - a);
  const fish = Array.from({ length: 7 }, (_, i) => ({ x: R(.12, .88), off: R(-.25, .25), s: R(.6, 1.15), ph: R(0, 6.28), sp: R(.8, 1.3), hue: i % 3 }));
  function drawFish(x, y, s, ang, t, a) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s); g.globalAlpha = a;
    const w = Math.sin(t * 5) * .35;
    // 꼬리 — 두 갈래로 길게 흐르는 지느러미
    for (const side of [-1, 1]) {
      g.beginPath(); g.moveTo(-28, 0);
      g.bezierCurveTo(-60, side * 10 + w * 20, -95, side * 34 + w * 40, -120, side * 26 + w * 55);
      g.bezierCurveTo(-96, side * 12 + w * 30, -70, side * 6, -40, side * 2);
      g.closePath();
      const tg = g.createLinearGradient(-28, 0, -120, 0); tg.addColorStop(0, 'rgba(23,75,255,.30)'); tg.addColorStop(1, 'rgba(23,75,255,.04)');
      g.fillStyle = tg; g.fill();
      g.strokeStyle = 'rgba(14,44,110,.18)'; g.lineWidth = .8; g.stroke();
    }
    // 몸
    g.beginPath(); g.moveTo(36, 0); g.bezierCurveTo(30, -18, -10, -22, -32, -4); g.bezierCurveTo(-36, 0, -36, 0, -32, 4); g.bezierCurveTo(-10, 22, 30, 18, 36, 0);
    const bg = g.createRadialGradient(10, -6, 2, 0, 0, 40); bg.addColorStop(0, 'rgba(120,150,255,.55)'); bg.addColorStop(1, 'rgba(23,75,255,.28)');
    g.fillStyle = bg; g.fill(); g.strokeStyle = 'rgba(14,30,80,.35)'; g.lineWidth = 1; g.stroke();
    // 가슴·등지느러미
    g.beginPath(); g.moveTo(8, 10); g.quadraticCurveTo(-2, 30 + w * 10, -14, 26); g.quadraticCurveTo(-4, 18, 2, 12); g.fillStyle = 'rgba(23,75,255,.16)'; g.fill();
    g.beginPath(); g.moveTo(10, -14); g.quadraticCurveTo(-6, -34, -22, -14); g.fillStyle = 'rgba(23,75,255,.14)'; g.fill();
    g.beginPath(); g.arc(24, -4, 2.4, 0, 7); g.fillStyle = 'rgba(10,20,50,.8)'; g.fill();
    g.restore(); g.globalAlpha = 1;
  }
  /* ── 꽃잎 (시아노타입: 빛으로 찍힌 흰 실루엣) ── */
  const petals = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), s: R(.5, 1.3), r: R(0, 6.28), vr: R(-1, 1), sw: R(0, 6.28), sp: R(.6, 1.4) }));
  function drawPetal(x, y, s, r, a) {
    g.save(); g.translate(x, y); g.rotate(r); g.scale(s, s); g.globalAlpha = a;
    g.shadowColor = 'rgba(255,255,255,.9)'; g.shadowBlur = 10;
    g.beginPath(); g.moveTo(0, -22); g.bezierCurveTo(16, -14, 14, 12, 0, 22); g.bezierCurveTo(-14, 12, -16, -14, 0, -22);
    g.fillStyle = 'rgba(240,246,255,.85)'; g.fill();
    g.shadowBlur = 0; g.beginPath(); g.moveTo(0, -16); g.lineTo(0, 16); g.strokeStyle = 'rgba(14,44,110,.18)'; g.lineWidth = 1; g.stroke();
    g.restore(); g.globalAlpha = 1;
  }

  /* ── TV 바다 (VHS) — 스크롤이 재생 헤드 ── */
  function ocean(time) {
    const w = 320, h = 240, hz = 104;
    const sky = og.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#9FB4D6'); sky.addColorStop(1, '#DCE6F2');
    og.fillStyle = sky; og.fillRect(0, 0, w, hz);
    og.fillStyle = 'rgba(255,255,255,.6)'; og.beginPath(); og.ellipse(220, 54, 26, 10, 0, 0, 7); og.fill();
    for (let y = hz; y < h; y++) {
      const k = (y - hz) / (h - hz); const c = [lerp(84, 22, k), lerp(118, 52, k), lerp(170, 110, k)];
      og.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; og.fillRect(0, y, w, 1);
    }
    for (let i = 0; i < 26; i++) { // 파도 띠 + 흰 포말
      const k = i / 26, y = hz + 3 + k * k * (h - hz - 6), amp = 1 + k * 5, sp = .6 + k * 1.6;
      og.beginPath();
      for (let x = 0; x <= w; x += 4) og.lineTo(x, y + Math.sin(x * (.06 - k * .03) + time * sp + i) * amp);
      og.strokeStyle = `rgba(235,242,255,${.12 + k * .4})`; og.lineWidth = .6 + k * 1.6; og.stroke();
    }
    const fy = hz + 70 + Math.sin(time * .8) * 14; // 밀려오는 흰 파도
    og.beginPath(); for (let x = 0; x <= w; x += 3) og.lineTo(x, fy + Math.sin(x * .05 + time * 2) * 4 + Math.sin(x * .13) * 2);
    og.lineTo(w, fy + 8); og.lineTo(0, fy + 8); og.fillStyle = 'rgba(245,248,255,.75)'; og.fill();
    for (let i = 0; i < 12; i++) { const bx = (i * 37 + time * 14) % w, by = 30 + (i * 23) % 50; og.fillStyle = 'rgba(255,255,255,.7)'; og.fillRect(bx, by, 2, 1); og.fillRect(bx + 2, by - 1, 1, 1); } // 갈매기
    // VHS: 주사선 · 색 번짐 · 트래킹 노이즈
    const id = og.getImageData(0, 0, w, h), d = id.data, band = (time * 40) % h;
    for (let y = 0; y < h; y++) {
      const shift = Math.abs(y - band) < 6 ? 3 : 0, dark = y % 2 ? .86 : 1;
      for (let x = w - 1; x >= 0; x--) {
        const o = (y * w + x) * 4, src = (y * w + Math.max(0, x - 2 - shift)) * 4;
        d[o] = d[src] * dark; d[o + 1] *= dark; d[o + 2] *= dark;
        if (Math.random() < .02) { const n = Math.random() * 60; d[o] += n; d[o + 1] += n; d[o + 2] += n; }
      }
    }
    og.putImageData(id, 0, 0);
  }

  /* ── 루프 ── */
  let P = 0, live = false, raf = 0, t0 = performance.now(), last = 0, ripT = -1;
  const STG = [[0, 'HIGH CLOUD'], [.12, 'FALL'], [.28, 'SEA · 2018'], [.44, 'BLOOM'], [.60, 'ABYSS'], [.77, 'RISE'], [.88, 'CAST']];
  function progress() { const r = sec.getBoundingClientRect(); return clamp(-r.top / (sec.offsetHeight - innerHeight), 0, 1); }
  function frame(now) {
    raf = 0; if (!live) return;
    const t = (now - t0) / 1000, dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    P += (progress() - P) * Math.min(1, dt * 8);
    const p = P;
    // 배경 층
    const skyO = 1 - sm(.24, .32, p);
    L.sky.style.opacity = skyO; L.sky.style.transform = `translateY(${-p * 70}vh)`;
    L.fog.style.opacity = sm(.22, .3, p) * (1 - sm(.42, .47, p));
    L.cy.style.opacity = sm(.42, .47, p) * (1 - sm(.58, .63, p)) + sm(.76, .8, p) * (1 - sm(.86, .9, p));
    L.ab.style.opacity = sm(.57, .62, p) * (1 - sm(.76, .8, p));
    L.end.style.opacity = sm(.86, .91, p); L.end.style.transform = `scale(${1.08 - sm(.86, 1, p) * .08})`;
    const dark = p > .44 && p < .87; pin.classList.toggle('dark', dark); pin.classList.toggle('end', p > .88);
    // 로고: ㅣ가 빠져 떨어짐
    const lo = 1 - sm(.2, .27, p); logo.style.opacity = lo;
    logo.style.transform = `translate(-50%,calc(-50% - ${sm(.12, .27, p) * 18}vh))`;
    const fall = sm(.06, .2, p), lr = logo.getBoundingClientRect();
    li.style.transform = `translateY(${fall * 26}%) scaleY(${1 + fall * .4})`; li.style.opacity = 1 - sm(.13, .19, p);
    const ix = lr.left + lr.width * (728 / 900), iy = lr.top + lr.height * (.62 + fall * .3);
    const sl = sm(.12, .2, p) * (1 - sm(.24, .3, p));
    istroke.style.opacity = sl; istroke.style.height = (sm(.12, .26, p) * 55) + 'vh';
    istroke.style.transform = `translate(${ix}px,${iy}px)`;
    // TV
    const tvO = win(p, .3, .43, .02); tv.style.opacity = tvO;
    tv.style.transform = `translate(-50%,-50%) scale(${.72 + sm(.28, .35, p) * .28 + sm(.4, .45, p) * .9})`;
    if (tvO > .01) { const vt = clamp((p - .28) / .16, 0, 1) * 18 + t * .25; ocean(vt); const s = Math.floor(vt * 10); tc.textContent = `SP 00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
    // 심연 · 류현
    xf.style.opacity = win(p, .6, .78, .03) * .55; xf.style.transform = `translate(-50%,-50%) rotate(${t * 3 + p * 90}deg) scale(${.8 + p * .3})`;
    const sk = sm(.6, .74, p);
    sink.style.opacity = win(p, .61, .77, .02);
    sink.style.transform = `translate(-50%,calc(-50% + ${sk * 18}vh)) rotate(${-8 + sk * 16}deg) scale(${1 - sk * .12})`;
    sink.style.filter = `blur(${(1 - sk) * 0 + sk * 1.6}px)`;
    const up = sm(.77, .88, p);
    rise.style.opacity = win(p, .78, .88, .02);
    rise.style.transform = `translate(-50%,calc(-50% + ${(1 - up) * 22 - up * 8}vh)) rotate(${(1 - up) * 8}deg)`;
    rise.style.filter = `blur(${(1 - up) * 3}px)`;
    slot.style.opacity = win(p, .69, .8, .02);
    if (p > .7 && p < .78 && ripT < 0) ripT = t; if (p < .69 || p > .8) ripT = -1;
    // 엔딩
    const k = sm(.89, .97, p); cast.style.opacity = sm(.88, .93, p); castImgs.forEach(im => im.style.setProperty('--k', k));
    endcard.style.opacity = sm(.92, .97, p); endcard.classList.toggle('on', p > .93);
    // 캡션 · HUD
    caps.forEach(c => { const o = win(p, c.w[0] + .01, c.w[1] - .01, .015); c.el.style.opacity = o; c.el.style.transform = `translateY(${(1 - o) * 16}px)`; });
    let si = 0; STG.forEach((s, i) => { if (p >= s[0]) si = i; });
    rail.forEach((r, i) => r.classList.toggle('on', i === si));
    hSt.textContent = `${String(si + 1).padStart(2, '0')} / ${STG[si][1]}`;
    hAlt.textContent = p < .44 ? `ALT ${Math.round(4850 * (1 - p / .44))}M` : p < .77 ? `DEPTH -${Math.round((p - .44) / .33 * 1000)}M` : p < .88 ? `DEPTH -${Math.round((1 - (p - .77) / .11) * 1000)}M` : 'SURFACE 0M';
    hint.style.opacity = 1 - sm(.01, .04, p);

    /* fx 캔버스 */
    g.clearRect(0, 0, W, H);
    const rain = win(p, 0, .3, .03);
    if (rain > .01 && !RM) { g.strokeStyle = `rgba(40,60,120,${.18 * rain})`; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i < 70; i++) { const x = (i * 97.3 % W), y = ((i * 211 + t * (380 + i % 7 * 40)) % (H + 120)) - 60; g.moveTo(x, y); g.lineTo(x - 2, y + 26 + i % 5 * 6); } g.stroke(); }
    const fA = win(p, .17, .34, .03);
    if (fA > .01) fish.forEach((f, i) => {
      const prog = (p - .15) / .2 * 1.4 + f.off;
      const y = lerp(-.2, 1.2, prog) * H, x = (f.x + Math.sin(t * .6 * f.sp + f.ph) * .05) * W;
      drawFish(x, y, f.s * 1.7 * Math.min(1, W / 900 + .35), Math.PI / 2 + Math.sin(t * 1.2 * f.sp + f.ph) * .35, t * f.sp + f.ph, fA * .95);
    });
    const pd = win(p, .44, .62, .03), pu = win(p, .77, .9, .03);
    if (pd > .01 || pu > .01) petals.forEach(q => {
      const dir = pu > pd ? -1 : 1, a = Math.max(pd, pu);
      const yy = ((q.y + dir * (t * .05 * q.sp + p * 3 * q.sp)) % 1 + 1) % 1;
      const x = (q.x + Math.sin(t * .7 + q.sw) * .03) * W;
      drawPetal(x, yy * (H + 80) - 40, q.s * (W < 700 ? .8 : 1.1), q.r + t * q.vr * .6, a);
    });
    if (ripT >= 0) { const e = t - ripT; for (let i = 0; i < 4; i++) { const rr = (e * 120 + i * 60) % 420; const a = Math.max(0, 1 - rr / 420) * .7;
      g.beginPath(); g.ellipse(W * .5, H * .38, rr, rr * .55, 0, 0, 7); g.strokeStyle = `rgba(200,220,255,${a})`; g.lineWidth = 1.2; g.stroke(); }
      const gl = g.createRadialGradient(W * .5, H * .38, 0, W * .5, H * .38, 90); gl.addColorStop(0, 'rgba(230,240,255,.55)'); gl.addColorStop(1, 'rgba(230,240,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); }
    const flash = Math.exp(-Math.pow((p - .775) / .006, 2)); if (flash > .02) { g.fillStyle = `rgba(240,246,255,${flash * .9})`; g.fillRect(0, 0, W, H); }
    raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver(es => { live = es[0].isIntersecting; if (live && !raf) { last = 0; raf = requestAnimationFrame(frame); } }).observe(sec);
  addEventListener('resize', resize); resize();
})();
