/* 결락 v09 · INTRO — 결로(結露). 화면에 맺힌 물방울들이 흘러 모여 ㄱㄹ 이 되고, 굳어서 아크릴 마크가 된다. */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const surf = document.getElementById('surface'), img = document.querySelector('#surface .logo-mark');
  if (!surf || !img || RM || !window.GYLiquid) { document.documentElement.classList.remove('intro'); return; }
  const { Liquid, markReady, gridTargets } = window.GYLiquid;
  document.documentElement.classList.add('intro');
  const cv = document.createElement('canvas'); cv.id = 'liquidHero'; cv.setAttribute('aria-hidden', 'true');
  surf.insertBefore(cv, surf.querySelector('.hero-ui'));
  const mob = innerWidth <= 720;
  const L = new Liquid(cv, { scale: mob ? .7 : .55, k: 16, damp: 6, wob: .6, T: 60, bev: mob ? 4 : 5, bump: 10, dark: [24, 40, 84] });
  let done = false, raf = 0, last = 0, T0 = 0, formAt = 9;

  function finish(fast) {
    if (done) return; done = true;
    document.documentElement.classList.add('intro-out');
    try { const r = img.getBoundingClientRect(), s = surf.getBoundingClientRect(); typeof Hero !== 'undefined' && Hero.drop((r.left - s.left + r.width / 2) * devicePixelRatio, (r.top - s.top + r.height / 2) * devicePixelRatio, Math.max(innerWidth, innerHeight) * .5 * devicePixelRatio); } catch (e) {}
    setTimeout(() => { document.documentElement.classList.remove('intro'); }, fast ? 50 : 200);
    setTimeout(() => { cancelAnimationFrame(raf); cv.remove(); document.documentElement.classList.remove('intro-out'); }, 1400);
  }

  markReady.then(M => {
    if (!M) return finish(true);
    const S = surf.getBoundingClientRect(); L.resize(S.width, S.height);
    const R = img.getBoundingClientRect();
    // 아크릴 PNG 안에서 마크가 차지하는 영역
    const mx = R.left - S.left + R.width * .1421, my = R.top - S.top + R.height * .1821, mw = R.width * .7153;
    const sp = mob ? .05 : .04, cell = sp * mw;
    const tg = gridTargets(sp);
    // 물방울 맺힘 지점: 화면 전체에 흩어진 크고 작은 방울
    const nDrops = mob ? 26 : 40, drops = Array.from({ length: nDrops }, () => {
      const x = Math.random() * S.width, y = Math.random() * S.height;
      return { x, y, d: .25 + Math.random() * .9 + Math.hypot(x - S.width / 2, y - S.height / 2) / Math.max(S.width, S.height) * .5 };
    });
    tg.forEach(([u, v], i) => {
      const dr = drops[i % nDrops], a = Math.random() * 6.28, rr = Math.random() * cell * 1.2;
      L.add(1, () => ({
        x: dr.x + Math.cos(a) * rr, y: dr.y + Math.sin(a) * rr, r: 0, tr: cell * 1.25,
        tx: mx + u * mw, ty: my + v * mw, delay: dr.d, fr: cell * .86
      }));
    });
    L.ps.forEach(p => { p.vx = 0; p.vy = 0; p.hx = p.x; p.hy = p.y; });
    formAt = Math.max(...drops.map(d => d.d)) + 2.2;
    T0 = performance.now(); last = T0;
    const loop = now => {
      const dt = Math.min(.033, (now - last) / 1000); last = now;
      const t = (now - T0) / 1000;
      L.ps.forEach(p => {
        if (p.delay > 0) { p.x = p.hx; p.y = p.hy += dt * 6; } // 맺힌 채로 아주 조금 흘러내림
        else if (p.tr !== p.fr && t > .2) p.tr += (p.fr - p.tr) * Math.min(1, dt * 1.6);
      });
      // 다 모이면 흔들림 줄이기
      L.wob = t > formAt - .4 ? .25 : .6;
      L.step(dt); L.render();
      if (!done && t > formAt + 1.4 && location.hash !== '#hold') finish(false);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // 누르면 건너뛰기
    surf.addEventListener('pointerdown', () => { if (!done) { L.ps.forEach(p => { p.delay = 0; p.x = p.tx; p.y = p.ty; p.tr = p.fr; }); finish(true); } }, { once: true, capture: true });
    addEventListener('resize', () => finish(true), { once: true });
  });
})();
