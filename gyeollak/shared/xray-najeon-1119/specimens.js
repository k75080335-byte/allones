/* 결락 · 표본실 — 스크롤 한 구간에 표본 하나. 구간 안에서 선 → 자개 → 색 네모 순으로 그려짐 */
(() => {
  'use strict';
  const sec = document.getElementById('najeon'); if (!sec || !window.GYNajeon) return;
  const BASE = (document.currentScript && document.currentScript.dataset.base) || '../shared/xray-najeon-1119/';
  const S = [
    { k: 'camellia', ko: '동백', en: 'Camellia', who: '채유성 · 붉은 결' },
    { k: 'hydrangea', ko: '수국', en: 'Hydrangea', who: '하진우 · 푸른 결' },
    { k: 'campsis', ko: '능소화', en: 'Trumpet creeper', who: '채류현 · 주황 결' },
    { k: 'lily', ko: '백합', en: 'Lily', who: '문태준 · 흰 결' },
    { k: 'goldfish', ko: '금붕어', en: 'Goldfish, a pair', who: '결락 · 잔상' }
  ];
  const stage = sec.querySelector('.sp-stage'), idx = [...sec.querySelectorAll('.sp-idx li')];
  const $ = id => document.getElementById(id);
  const M = S.map(s => { const d = document.createElement('div'); stage.appendChild(d); return GYNajeon.mount(d, { name: s.k, base: BASE }); });
  const els = [...stage.children]; let cur = -1;
  function frame() {
    const r = sec.getBoundingClientRect(), H = sec.offsetHeight - innerHeight;
    const P = Math.max(0, Math.min(.9999, -r.top / H)), n = S.length, k = Math.floor(P * n), p = P * n - k;
    if (k !== cur) { cur = k; els.forEach((e, i) => e.classList.toggle('on', i === k)); idx.forEach((e, i) => e.classList.toggle('on', i === k));
      $('spNo').textContent = `0${k + 1} / 0${n}`; $('spName').innerHTML = `${S[k].ko}<em>${S[k].en}</em>`; $('spWho').textContent = S[k].who; }
    M[k].set(Math.min(1, p / .85));
    $('spScan').textContent = 'TRACE ' + Math.round(Math.min(1, p / .55) * 100) + '%';
    $('spBar').style.top = (P * 100) + '%';
  }
  addEventListener('scroll', () => requestAnimationFrame(frame), { passive: true }); addEventListener('resize', frame); frame();
})();
