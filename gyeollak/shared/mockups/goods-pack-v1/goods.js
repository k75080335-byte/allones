/* 결락 GOODS mockup v1 — 트레이 · 행거 · 아크릴 진열장. 자개 draw-on 은 ../../xray-najeon-1119/najeon.js */
(() => {
  'use strict';
  const NB = '../../xray-najeon-1119/', MEM = '../../../v15/img/members/';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const live = []; // {el, nj, mode}
  const mount = (el, name, mode = 'view') => { const nj = GYNajeon.mount(el, { name, base: NB }); live.push({ el, nj, mode }); return nj; };

  // hero: 첫 화면은 스크롤이 없으니 시간으로 한 번 그린다
  const hero = mount(document.getElementById('heroNj'), 'goldfish', 'time');
  if (!RM) { const t0 = performance.now(); const run = t => { const p = cl((t - t0 - 400) / 5200, 0, 1); hero.set(p); if (p < 1) requestAnimationFrame(run); }; requestAnimationFrame(run); }

  // 01 TRAY
  const T = [
    { k: 'taejun', kr: '문태준', img: 'taejun_suit2', fl: 'lily', flk: '백합', acc: '#E8ECF0', h: 195, ing: '결 12% · 먹 30% · 수면 41% · 백합 14% · 자개 3%', price: '28,000' },
    { k: 'yuseong', kr: '채유성', img: 'yuseong_casual', fl: 'camellia', flk: '동백', acc: '#C8323C', h: 190, ing: '결 12% · 먹 27% · 비 38% · 동백 20% · 자개 3%', price: '28,000' },
    { k: 'jinwoo', kr: '하진우', img: 'jinwoo_casual2', fl: 'hydrangea', flk: '수국', acc: '#4F78D8', h: 189, ing: '결 12% · 먹 22% · 물속 44% · 수국 19% · 자개 3%', price: '28,000' },
    { k: 'ryuhyeon', kr: '채류현', img: 'ryuhyeon_suit', fl: 'campsis', flk: '능소화', acc: '#E6863A', h: 188, ing: '결 12% · 먹 33% · 여름 35% · 능소화 17% · 자개 3%', price: '28,000' }
  ];
  const trays = document.getElementById('trays');
  T.forEach((m, i) => {
    const d = document.createElement('article'); d.className = 'tray'; d.style.setProperty('--acc', m.acc);
    d.innerHTML = `<span class="tag">PACK 0${i + 1} · ${m.fl.toUpperCase()}</span><div class="well"><img class="mem" src="${MEM}${m.img}.webp" alt="${m.kr}" loading="lazy"><div class="flw"><div></div></div></div><div class="wrap"></div>
      <div class="label"><b>결락 · ${m.kr} 팩</b><span class="ing">원재료 ${m.ing}</span><br>중량 ${m.h}cm / 1 DROP · 포장 26.11.19<br>보관 수면 아래 · 빛을 피해 주세요<div class="row"><span class="bar"></span><span class="price">₩${m.price}</span></div></div>`;
    trays.appendChild(d); mount(d.querySelector('.flw>div'), m.fl);
  });

  // 02 LINE
  const CLIP = `<svg class="clip" viewBox="0 0 46 78" aria-hidden="true"><defs><linearGradient id="cg" x1="0" x2="1"><stop offset="0" stop-color="#5A6A84"/><stop offset=".3" stop-color="#F4F7FB"/><stop offset=".55" stop-color="#C9D6EA"/><stop offset="1" stop-color="#3E4E6B"/></linearGradient></defs>
    <path d="M23 0v10" stroke="#C9D6EA" stroke-width="3"/><path d="M14 2a9 9 0 0 1 18 0" fill="none" stroke="url(#cg)" stroke-width="3"/><rect x="9" y="10" width="28" height="36" rx="4" fill="url(#cg)"/><circle cx="23" cy="28" r="7" fill="none" stroke="#3E4E6B" stroke-width="2"/><path d="M11 46l-3 30h30l-3-30z" fill="url(#cg)"/><path d="M8 74h30" stroke="#2A364A" stroke-width="2"/></svg>`;
  const H = [
    { t: 'card', img: NB + 'xr_camellia_a_window.webp', s: 'X-RAY CARD · 동백 · 무광지 1도' },
    { t: 'mem', img: MEM + 'jinwoo_casual2.webp', s: '하진우 · 흰 옷 · 189' },
    { t: 'card', img: NB + 'xr_goldfish_b_window_grad.webp', s: 'X-RAY CARD · 금붕어 한 쌍' },
    { t: 'bag', img: NB + 'xr_hydrangea_d_paper.webp', s: 'SATIN POUCH · 수국 · 청묵 1도' },
    { t: 'card', img: NB + 'xr_lily_c_mosaic.webp', s: 'X-RAY CARD · 백합 · 모자이크' }
  ];
  const hang = document.getElementById('hang');
  H.forEach(h => {
    const li = document.createElement('li');
    const body = h.t === 'mem' ? `<img class="mem" src="${h.img}" alt="" loading="lazy">` : h.t === 'bag' ? `<div class="bag item"><img src="${h.img}" alt="" loading="lazy"></div>` : `<div class="card item"><img src="${h.img}" alt="" loading="lazy"></div>`;
    li.innerHTML = CLIP + body + `<small>${h.s}</small>`; hang.appendChild(li);
  });
  const lis = [...hang.children]; let lastY = scrollY;

  // 03 CASE
  const V = ['lily', 'camellia', 'hydrangea', 'campsis', 'goldfish', 'camellia', 'goldfish', 'lily', 'campsis', 'hydrangea'];
  const slots = document.getElementById('slots'), disp = document.getElementById('disp'), chute = document.getElementById('chute');
  V.forEach((n, i) => {
    const code = (i < 5 ? 'A' : 'B') + ((i % 5) + 1);
    const li = document.createElement('li'); const b = document.createElement('button'); b.className = 'slot'; b.type = 'button'; b.setAttribute('aria-label', `${code} 키링 꺼내기`);
    b.innerHTML = `<span class="ring"></span><span class="charm"><span class="nj-h"></span></span><span class="code">${code}</span>`;
    li.appendChild(b); slots.appendChild(li); mount(b.querySelector('.nj-h'), n);
    b.addEventListener('click', () => {
      if (b.classList.contains('gone')) return; disp.textContent = code; b.classList.add('gone');
      setTimeout(() => { const g = document.createElement('img'); g.className = 'got'; g.alt = code; g.src = `${NB}xr_${n}_a_window.webp`; g.style.borderRadius = '14px'; g.style.boxShadow = 'inset 0 0 0 1px #E8ECF0'; chute.appendChild(g); if (chute.querySelectorAll('.got').length > 5) chute.querySelector('.got').remove(); }, RM ? 0 : 520);
    });
  });

  // 스크롤 → 각 draw-on 진행도 (화면 아래에서 들어와 가운데쯤 완성) + 행거 흔들림
  function frame() {
    const vh = innerHeight;
    for (const o of live) if (o.mode === 'view') { const r = o.el.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) continue; o.nj.set(cl((vh - r.top) / (vh * .75), 0, 1)); }
    const v = scrollY - lastY; lastY = scrollY;
    if (!RM) lis.forEach((l, i) => l.style.setProperty('--sw', cl(v * (.12 + (i % 3) * .05), -6, 6) + 'deg'));
  }
  let raf = 0; addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; frame(); }); }, { passive: true });
  addEventListener('resize', frame); frame();
  if (!RM) setInterval(() => { if (Math.abs(scrollY - lastY) < 1) lis.forEach(l => l.style.setProperty('--sw', '0deg')); }, 400);
})();
