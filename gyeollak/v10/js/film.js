/* 결락 v09 · FILM — 스크롤이 카메라. 6장면을 잇는 건 굿즈가 아니라 물방울 하나.
   유리창을 타고 흘러내리고 → CD 위에 렌즈처럼 맺히고 → 네 사람 손을 건너고 → 네 방울로 갈라졌다가 → 다시 모여 ㄱㄹ 이 된다. */
(() => {
  'use strict';
  const film = document.getElementById('film'); if (!film) return;
  const pin = film.querySelector('.film-pin');
  const scenes = [...film.querySelectorAll('.fs')];
  const heads = scenes.map(s => s.querySelector('.ft h3'));
  const N = scenes.length;
  const ticks = [...film.querySelectorAll('.frail i')], cnt = film.querySelector('.frail .cnt');
  const disp = document.querySelector('#wd feDisplacementMap'), turb = document.querySelector('#wd feTurbulence');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const isMob = () => innerWidth <= 720;

  /* 물방울 경로: [s, x%, y%, 반지름(vmin)] */
  const K = [
    [0.00, 74, 6, 2.6], [0.80, 66, 60, 4.2], [1.15, 44, 64, 5.5], [1.75, 36, 61, 8.5],
    [2.20, 46, 52, 5], [2.75, 55, 60, 5.2], [3.05, 44, 44, 4.4], [3.35, 52, 36, 4.2],
    [3.65, 66, 44, 4.4], [3.90, 74, 34, 4.2], [4.15, 70, 56, 4.6], [6.0, 70, 56, 4.6]];
  const KM = [
    [0.00, 70, 30, 3.4], [0.80, 62, 74, 5.2], [1.15, 50, 74, 6.5], [1.75, 40, 72, 11],
    [2.20, 48, 64, 6.5], [2.75, 30, 70, 6.5], [3.05, 30, 66, 5.5], [3.35, 50, 58, 5.5],
    [3.65, 66, 66, 5.5], [3.90, 80, 60, 5.5], [4.15, 60, 74, 6], [6.0, 60, 74, 6]];
  const SPLIT = [[35, 47], [62, 45], [74.5, 50.5], [86, 54]];      // 인형 머리 위 (scene 5)
  const SPLITM = [[18, 70], [52, 66], [70, 72], [88, 76]];
  function path(s, mob) {
    const P = mob ? KM : K; let i = 0; while (i < P.length - 2 && s > P[i + 1][0]) i++;
    const a = P[i], b = P[i + 1], t = ease(clamp((s - a[0]) / (b[0] - a[0] || 1), 0, 1));
    return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
  }

  /* ── liquid ── */
  let L = null, tg = [], unit = [], ready = false, lastS = 0, live = false, raf = 0, prev = 0;
  const cv = document.getElementById('filmLiquid');
  if (cv && window.GYLiquid && !RM) {
    const { Liquid, markReady, gridTargets } = window.GYLiquid;
    L = new Liquid(cv, { scale: isMob() ? .6 : .5, k: 30, damp: 8, wob: .8, T: 60, rim: 34, tint: [226, 236, 255], dark: [8, 14, 32] });
    markReady.then(M => {
      if (!M) return;
      tg = gridTargets(.04);
      const n = tg.length, ga = Math.PI * (3 - Math.sqrt(5));
      unit = tg.map((_, i) => { const r = Math.sqrt((i + .5) / n), a = i * ga; return [Math.cos(a) * r, Math.sin(a) * r, r]; });
      L.add(n, i => ({ kf: 1 - unit[i][2] * .55, ph: i * .7 }));
      resize(); place(true); ready = true;
    });
  }
  function resize() { if (L) L.resize(pin.clientWidth, pin.clientHeight); }
  function place(snap) {
    if (!L || !L.ps.length) return;
    const s = lastS, mob = isMob(), W = pin.clientWidth, H = pin.clientHeight, vmin = Math.min(W, H) / 100;
    const [px, py, pr] = path(s, mob), R = pr * vmin * 1.4;
    const b = sm(4.15, 4.55, s), c = sm(4.95, 5.45, s);
    // 배경 밝기에 따라 유리 테두리 색: 어두운 장면=밝은 굴절선, 밝은 장면=어두운 굴절선
    const RIM = [[205, 222, 255], [205, 222, 255], [20, 34, 70], [20, 34, 70], [205, 222, 255], [6, 22, 110]];
    const si = clamp(s - .5, 0, 5), i0 = Math.floor(si), i1 = Math.min(5, i0 + 1), f = sm(0, 1, si - i0);
    L.dark = RIM[i0].map((v, j) => v + (RIM[i1][j] - v) * f);
    L.edgeA = (i0 === 0 || i0 === 1 || i0 === 4) && f < .5 ? 210 : 170;
    const sp = mob ? SPLITM : SPLIT;
    const lw = (mob ? 76 : 40) * vmin * (mob ? 1.1 : 1), lx = (mob ? 50 : 62) / 100 * W - lw / 2, ly = (mob ? 60 : 47) / 100 * H - lw * .45;
    const fall = s < .8 ? 1 + (1 - s / .8) * .6 : 1;   // 흘러내릴 땐 세로로 길쭉
    L.ps.forEach((p, i) => {
      const [ux, uy] = unit[i];
      let x = px / 100 * W + ux * R * .62, y = py / 100 * H + uy * R * .62 * fall;
      let r = R * .34;
      if (b > 0) { const q = sp[i % 4], rr = R * .55; x += (q[0] / 100 * W + ux * rr * .6 - x) * b; y += (q[1] / 100 * H + uy * rr * .6 - y) * b; r += (rr * .34 - r) * b; }
      if (c > 0) { x += (lx + tg[i][0] * lw - x) * c; y += (ly + tg[i][1] * lw - y) * c; r += (lw * .04 * .88 - r) * c; }
      p.tx = x; p.ty = y; p.tr = r;
      if (snap) { p.x = x; p.y = y; p.r = r; }
    });
  }
  function tick(now) {
    raf = 0; if (!live || !ready) return;
    const dt = Math.min(.033, (now - (prev || now)) / 1000); prev = now;
    place(false); L.step(dt); L.render();
    raf = requestAnimationFrame(tick);
  }
  if (cv) new IntersectionObserver(es => { live = es[0].isIntersecting; if (live && !raf) { prev = 0; raf = requestAnimationFrame(tick); } }, { rootMargin: '10% 0px' }).observe(film);

  let last = -1;
  function render() {
    const r = film.getBoundingClientRect(), span = film.offsetHeight - innerHeight;
    const p = clamp(-r.top / span, 0, 1), s = p * N; lastS = s;
    if (Math.abs(s - last) < 0.0005) return; last = s;
    let wave = 0;
    scenes.forEach((el, i) => {
      const u = s - i;
      let o = 0, sc = 1;
      if (u > -0.22 && u <= 0.02) { o = (u + 0.22) / 0.24; sc = 1.06 - 0.06 * o; }
      else if (u > 0.02 && u < 0.86) o = 1;
      else if (u >= 0.86 && u < 1.08) { const k = (u - 0.86) / 0.22; o = 1 - k; sc = 1 + 0.14 * k; }
      if (i === 0 && u <= 0.02) o = 1;
      if (i === N - 1 && u >= 0.86) { o = 1; sc = 1; }
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      el.style.transform = RM ? 'none' : `scale(${sc.toFixed(4)})`;
      el.style.setProperty('--u', clamp(u, 0, 1).toFixed(4));
      // 장면이 바뀌는 순간 제목이 물에 비친 것처럼 일렁임 (Riverbed / DISTORT 레퍼런스)
      const w = o > .01 && o < .99 ? Math.sin(o * Math.PI) : 0;
      if (heads[i]) heads[i].style.filter = (!RM && w > .04) ? 'url(#wd)' : 'none';
      wave = Math.max(wave, w);
    });
    if (disp) disp.setAttribute('scale', (wave * 46).toFixed(1));
    if (turb) turb.setAttribute('baseFrequency', `${(.006 + wave * .006).toFixed(4)} ${(.03 + wave * .02).toFixed(4)}`);
    const idx = clamp(Math.floor(s), 0, N - 1);
    ticks.forEach((t, i) => t.classList.toggle('on', i === idx));
    cnt.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
    const inView = r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5;
    document.querySelectorAll('.nav a').forEach(a => { if (inView) a.classList.toggle('on', a.dataset.s === 'film'); });
  }
  let rq = 0;
  const req = () => { if (!rq) rq = requestAnimationFrame(() => { rq = 0; render(); }); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { last = -1; resize(); req(); });
  render();
})();
