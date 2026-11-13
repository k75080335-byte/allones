/* 결락 v08 · FILM — 스크롤이 카메라. 6장면이 끊김 없이 넘어가고, 디스크 하나가 장면을 잇는다. */
(() => {
  'use strict';
  const film = document.getElementById('film'); if (!film) return;
  const pin = film.querySelector('.film-pin');
  const scenes = [...film.querySelectorAll('.fs')];
  const N = scenes.length;
  const disc = document.getElementById('fdisc'), dIn = disc.querySelector('.in');
  const ticks = [...film.querySelectorAll('.frail i')], cnt = film.querySelector('.frail .cnt');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  /* disc path: [s, x%, y%, width(vmin), rotZ, rotY, opacity] — s runs 0..N */
  const K = [
    [0.00, 70, 64, 10, -10, 0, 0],
    [1.55, 40, 60, 26, -6, 0, 0],
    [1.80, 44, 52, 30, -4, 0, 1],
    [2.55, 30, 50, 22, 8, 0, 1],
    [3.10, 22, 52, 15, -10, 0, 1],
    [3.55, 50, 46, 15, 170, 0, 1],
    [3.95, 78, 52, 15, 350, 0, 1],
    [4.35, 46, 66, 16, 360, 0, 1],
    [4.85, 46, 66, 16, 360, 0, 1],
    [5.25, 62, 46, 36, 360, 0, 1],
    [5.55, 62, 46, 38, 360, 0, 1],
    [5.95, 62, 46, 38, 360, 180, 1],
    [6.00, 62, 46, 38, 360, 180, 1],
  ];
  const KM = K.map(k => { const m = k.slice(); m[3] = k[3] * 1.35; if (k[0] >= 5) { m[1] = 50; m[2] = 58; } if (k[0] >= 2.4 && k[0] < 3) { m[1] = 34; m[2] = 60; } return m; });
  function path(s, mob) {
    const P = mob ? KM : K; let i = 0; while (i < P.length - 2 && s > P[i + 1][0]) i++;
    const a = P[i], b = P[i + 1], t = ease(clamp((s - a[0]) / (b[0] - a[0] || 1), 0, 1));
    return a.map((v, j) => j === 0 ? s : v + (b[j] - v) * t);
  }

  let last = -1;
  function render() {
    const r = film.getBoundingClientRect(), span = film.offsetHeight - innerHeight;
    const p = clamp(-r.top / span, 0, 1), s = p * N;
    if (Math.abs(s - last) < 0.0005) return; last = s;
    scenes.forEach((el, i) => {
      const u = s - i; // 0..1 inside the scene
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
    });
    const mob = innerWidth <= 720;
    const [, x, y, w, rz, ry, op] = path(s, mob);
    const W = pin.clientWidth, H = pin.clientHeight, vmin = Math.min(W, H) / 100, dw = w * vmin;
    disc.style.width = dw + 'px';
    disc.style.opacity = op.toFixed(3);
    disc.style.transform = `translate(${(x / 100 * W - dw / 2).toFixed(1)}px,${(y / 100 * H - dw * 0.87).toFixed(1)}px) rotate(${RM ? 0 : rz.toFixed(1)}deg)`;
    dIn.style.transform = `rotateY(${ry.toFixed(1)}deg)`;
    const idx = clamp(Math.floor(s), 0, N - 1);
    ticks.forEach((t, i) => t.classList.toggle('on', i === idx));
    cnt.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
    const inView = r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5;
    document.querySelectorAll('.nav a').forEach(a => { if (inView) a.classList.toggle('on', a.dataset.s === 'film'); });
  }
  let raf = 0;
  const req = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { last = -1; req(); });
  render();
})();
