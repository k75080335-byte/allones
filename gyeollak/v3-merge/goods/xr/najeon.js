/* 결락 · X-RAY × 자개 draw-on — 선(은·금) → 자개 채움 → 색 네모 창.
   GYNajeon.mount(el,{name,base}) → {set(p)}; p 0..1 (scroll). prefers-reduced-motion → 완성 상태 고정. */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = (a, b, v) => { const t = cl((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const BOX = { camellia: [[330, 300, 700, 620]], hydrangea: [[260, 150, 560, 430], [560, 430, 780, 600]],
    campsis: [[400, 180, 760, 470]], lily: [[360, 230, 660, 560]], goldfish: [[300, 250, 560, 420], [520, 600, 800, 780]] };
  const NS = 'http://www.w3.org/2000/svg';
  let defs = false;
  function ensureDefs() {
    if (defs) return; defs = true;
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('width', 0); s.setAttribute('height', 0); s.style.position = 'absolute';
    s.innerHTML = '<defs><linearGradient id="njLine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1024" y2="1024">' +
      '<stop offset="0" stop-color="#E8ECF0"/><stop offset=".42" stop-color="#CDB27A"/><stop offset=".58" stop-color="#F4F1EA"/><stop offset="1" stop-color="#B8C4D4"/></linearGradient></defs>';
    document.body.appendChild(s);
  }
  function mount(el, o) {
    ensureDefs();
    const name = o.name, B = new URL(o.base || './', location.href).href, boxes = BOX[name] || [];
    el.classList.add('nj'); if (o.paper) el.classList.add('paper');
    el.style.setProperty('--mask', `url(${B}${name}_mask.webp)`); el.style.setProperty('--tex', `url(${B}nacre_tex.webp)`);
    el.innerHTML = `<img class="nj-mono" alt="" src="${B}xr_${name}_mono.webp"><div class="nj-nacre"></div>` +
      boxes.map(b => `<img class="nj-win" alt="" src="${B}xr_${name}_${o.win || 'b_window_grad'}.webp" style="clip-path:inset(${b[1] / 10.24}% ${100 - b[2] / 10.24}% ${100 - b[3] / 10.24}% ${b[0] / 10.24}%)">`).join('') +
      `<svg class="nj-lines" viewBox="0 0 1024 1024" aria-hidden="true"></svg><svg class="nj-frame" viewBox="0 0 1024 1024" aria-hidden="true"></svg>`;
    const mono = el.querySelector('.nj-mono'), nac = el.querySelector('.nj-nacre'), wins = [...el.querySelectorAll('.nj-win')];
    const lines = el.querySelector('.nj-lines'), frame = el.querySelector('.nj-frame');
    // 네모 창 프레임 + 레지스트레이션 마크
    const fr = [];
    boxes.forEach(b => {
      const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', b[0] + .5); r.setAttribute('y', b[1] + .5); r.setAttribute('width', b[2] - b[0]); r.setAttribute('height', b[3] - b[1]); r.setAttribute('pathLength', 1);
      frame.appendChild(r); fr.push(r);
      let d = ''; [[b[0], b[1], -1, -1], [b[2], b[1], 1, -1], [b[0], b[3], -1, 1], [b[2], b[3], 1, 1]].forEach(([x, y, sx, sy]) => { const cx = x + sx * 16, cy = y + sy * 16; d += `M${cx - 7} ${cy}H${cx + 7}M${cx} ${cy - 7}V${cy + 7}`; });
      const m = document.createElementNS(NS, 'path'); m.setAttribute('d', d); frame.appendChild(m); fr.push(m);
    });
    let P = [], ready = false, last = -1, sx = 0;
    fetch(`${B}${name}_paths.json`).then(r => r.json()).then(js => {
      const n = js.length;
      js.forEach((q, i) => {
        const p = document.createElementNS(NS, 'path'); p.setAttribute('d', q.d); p.setAttribute('pathLength', 1);
        p.style.strokeDasharray = '1 1'; lines.appendChild(p);
        // 큰 윤곽 먼저, 안쪽 결은 뒤에: 시작 시점을 순서대로 펼침
        P.push({ el: p, s: .52 * Math.pow(i / n, .85), d: .1 + Math.min(.16, q.l / 4000) });
      });
      ready = true; set(RM ? 1 : (last < 0 ? 0 : last), true);
    });
    function set(p, force) {
      if (RM) p = 1;
      if (!force && Math.abs(p - last) < .0005) return; last = p;
      if (ready) for (const q of P) { const t = cl((p - q.s) / q.d, 0, 1); q.el.style.strokeDashoffset = (1 - t).toFixed(4); }
      lines.style.opacity = 1 - .45 * sm(.82, .98, p);
      mono.style.opacity = .6 * sm(.42, .72, p);
      nac.style.opacity = sm(.5, .78, p) * (1 - .35 * sm(.9, 1, p));
      sx = 160 - p * 220; nac.style.setProperty('--sx', sx + '%');
      wins.forEach(w => w.style.opacity = sm(.8, .93, p));
      const fp = sm(.74, .9, p); fr.forEach(f => { f.style.opacity = fp > 0 ? 1 : 0; if (f.tagName === 'rect') { f.style.strokeDasharray = '1 1'; f.style.strokeDashoffset = 1 - fp; } else f.style.opacity = sm(.86, .94, p); });
    }
    // 자개 반짝임: 스크롤이 멈춰 있어도 아주 느리게 결이 흐름 (reduced-motion 제외)
    if (!RM) { let t0 = performance.now(); const tick = now => { if (last > .5 && el.isConnected) nac.style.setProperty('--sx', (sx + Math.sin((now - t0) / 2400) * 18) + '%'); requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
    set(RM ? 1 : 0, true);
    return { set };
  }
  window.GYNajeon = { mount, BOX };
})();
