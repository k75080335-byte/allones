/* 결락 GYEOLLAK · site design draft v07 — interactions (vanilla JS, no deps) */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = s => { s = Math.max(0, s | 0); return String(s / 60 | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const isMobile = () => innerWidth <= 720;
const DEMO = (window.DEMO = {});

/* ── tiny UI sound (synth click, works on file://) ── */
let actx = null;
function ctx() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } return actx; }
function click(freq = 1800, dur = 0.03, gain = 0.05) {
  const c = ctx(); if (!c || c.state !== 'running') return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'square'; o.frequency.value = freq; g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
}
addEventListener('pointerdown', () => { const c = ctx(); if (c && c.state === 'suspended') c.resume(); }, { once: true });

/* ── inertia rotator (inspector 360°) ── */
function Rotator(onTick) {
  const st = { ry: 0, rx: 0, vy: 0, vx: 0, s: 1, idle: 0, dragging: false };
  let lx = 0, ly = 0, last = 0;
  function down(e) { st.dragging = true; st.idle = 0; lx = e.clientX; ly = e.clientY; last = performance.now(); st.vy = 0; st.vx = 0; }
  function move(e) {
    if (!st.dragging) return;
    const now = performance.now(), dt = Math.max(8, now - last);
    const dx = e.clientX - lx, dy = e.clientY - ly;
    st.ry += dx * 0.5; st.rx = clamp(st.rx - dy * 0.3, -32, 32);
    st.vy = dx * (16 / dt); st.vx = dy * (16 / dt);
    lx = e.clientX; ly = e.clientY; last = now;
  }
  function up() { st.dragging = false; }
  function tick() {
    if (!st.dragging) {
      st.idle++;
      st.vy *= 0.965;
      st.vx *= 0.9;
      if (!RM && st.idle > 50 && Math.abs(st.vy) < 0.06) st.vy = 0.32;
      st.ry += st.vy;
      st.rx = clamp(st.rx - st.vx * 0.2, -32, 32);
    }
    onTick(st);
  }
  return Object.assign(st, { down, move, up, tick });
}


/* ══════════ 01 SURFACE — logo + fluid gate ══════════ */
const Hero = (() => {
  const c = $('#water'), ctx = c.getContext('2d');
  const f = $('#fluid'), fctx = f.getContext('2d');
  const drops = [], ripples = [];
  let W = 0, H = 0, mx = .5, my = .62, t0 = 0, entered = false;
  const blobs = Array.from({ length: 7 }, (_, i) => ({
    a: i * 0.9, r: 0.11 + (i % 3) * 0.035, ox: 0.5, oy: 0.46,
    px: Math.sin(i * 1.7) * 0.08, py: Math.cos(i * 1.3) * 0.05,
    s: 0.18 + i * 0.03, k: 0.35 + (i % 4) * 0.08
  }));
  function resize() {
    const r = c.parentElement.getBoundingClientRect();
    W = c.width = f.width = Math.floor(r.width * devicePixelRatio);
    H = c.height = f.height = Math.floor(r.height * devicePixelRatio);
    [c, f].forEach(el => { el.style.width = r.width + 'px'; el.style.height = r.height + 'px'; });
  }
  function drop(x, y, r) { ripples.push({ x, y, r: 0, max: r, a: 1, w: 1.6 + Math.random() }); }
  function autoDrop() {
    if (document.hidden || RM) return;
    const x = (0.18 + Math.random() * 0.64) * W, y = (0.22 + Math.random() * 0.62) * H;
    drop(x, y, 28 + Math.random() * 50);
    drops.push({ x, y, vy: 0, life: 0 });
  }
  function enter(cx, cy) {
    if (entered) return;
    entered = true;
    const r = c.getBoundingClientRect();
    const x = (cx ?? r.width / 2) * devicePixelRatio, y = (cy ?? r.height * 0.46) * devicePixelRatio;
    drop(x, y, Math.max(W, H) * 0.55);
    drop(x + 40, y + 20, Math.max(W, H) * 0.28);
    document.body.classList.remove('gate'); document.documentElement.classList.remove('gate');
    document.body.classList.add('entered');
    const cue = $('#touchCue'); if (cue) cue.setAttribute('aria-hidden', 'true');
  }
  function loop() {
    t0 += 0.016; ctx.clearRect(0, 0, W, H); fctx.clearRect(0, 0, W, H);
    blobs.forEach((b, i) => {
      const x = W * (b.ox + Math.sin(t0 * b.s + b.a) * b.px + (mx - 0.5) * 0.04);
      const y = H * (b.oy + Math.cos(t0 * b.s * 0.85 + b.a) * b.py + (my - 0.5) * 0.03);
      const rad = Math.min(W, H) * b.r * (1.05 + 0.08 * Math.sin(t0 * b.k + i));
      const rg = fctx.createRadialGradient(x - rad * 0.2, y - rad * 0.25, rad * 0.05, x, y, rad);
      if (i % 3 === 0) {
        rg.addColorStop(0, 'rgba(255,255,255,0.55)');
        rg.addColorStop(0.35, 'rgba(196,216,240,0.28)');
        rg.addColorStop(0.7, 'rgba(159,181,211,0.10)');
        rg.addColorStop(1, 'rgba(159,181,211,0)');
      } else if (i % 3 === 1) {
        rg.addColorStop(0, 'rgba(232,240,250,0.50)');
        rg.addColorStop(0.4, 'rgba(23,75,255,0.07)');
        rg.addColorStop(0.8, 'rgba(195,211,230,0.08)');
        rg.addColorStop(1, 'rgba(195,211,230,0)');
      } else {
        rg.addColorStop(0, 'rgba(255,255,255,0.42)');
        rg.addColorStop(0.45, 'rgba(220,230,242,0.22)');
        rg.addColorStop(1, 'rgba(220,230,242,0)');
      }
      fctx.globalCompositeOperation = i ? 'lighter' : 'source-over';
      fctx.fillStyle = rg; fctx.beginPath(); fctx.arc(x, y, rad, 0, Math.PI * 2); fctx.fill();
    });
    fctx.globalCompositeOperation = 'source-over';
    fctx.globalAlpha = 0.35;
    blobs.slice(0, 3).forEach((b) => {
      const x = W * (b.ox + Math.sin(t0 * b.s + b.a) * b.px);
      const y = H * (b.oy + Math.cos(t0 * b.s * 0.85 + b.a) * b.py);
      const rad = Math.min(W, H) * b.r * 0.92;
      fctx.strokeStyle = 'rgba(255,255,255,0.45)'; fctx.lineWidth = 1.2 * devicePixelRatio;
      fctx.beginPath(); fctx.arc(x, y, rad, -0.8, 0.6); fctx.stroke();
    });
    fctx.globalAlpha = 1;

    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(246,248,251,0)'); grd.addColorStop(0.45, 'rgba(220,230,242,.18)'); grd.addColorStop(1, 'rgba(159,181,211,.38)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    const sheenY = H * (0.58 + Math.sin(t0 * 0.4) * 0.01);
    const sg = ctx.createLinearGradient(0, sheenY - 8, 0, sheenY + 40);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.4, 'rgba(255,255,255,.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, sheenY - 8, W, 50);

    for (let i = ripples.length - 1; i >= 0; i--) {
      const p = ripples[i]; p.r += p.w * devicePixelRatio; p.a -= 0.008;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(23,75,255,${Math.max(0, p.a * 0.45)})`; ctx.lineWidth = 1.4 * devicePixelRatio; ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.72, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, p.a * 0.55)})`; ctx.lineWidth = 1 * devicePixelRatio; ctx.stroke();
      if (p.a <= 0 || p.r > p.max * devicePixelRatio) ripples.splice(i, 1);
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.life++; d.vy += 0.55 * devicePixelRatio; d.y += d.vy;
      ctx.beginPath(); ctx.ellipse(d.x, d.y, 1.6 * devicePixelRatio, 3.4 * devicePixelRatio, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(23,75,255,.55)'; ctx.fill();
      if (d.life > 40 || d.y > H * 0.92) { drop(d.x, d.y, 36); drops.splice(i, 1); }
    }
    requestAnimationFrame(loop);
  }
  function ring(x, y) { const el = document.createElement('i'); el.className = 'ring'; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = el.style.height = '160px'; $('#surface').appendChild(el); setTimeout(() => el.remove(), 1100); }
  function onPtr(e) {
    const r = c.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height;
    if (e.type === 'pointerdown') {
      drop((e.clientX - r.left) * devicePixelRatio, (e.clientY - r.top) * devicePixelRatio, entered ? 90 : 140);
      ring(e.clientX - r.left, e.clientY - r.top);
      if (!entered) enter(e.clientX - r.left, e.clientY - r.top);
    }
  }
  $('#enterBtn').addEventListener('click', ev => {
    const r = c.getBoundingClientRect();
    enter(ev.clientX - r.left, ev.clientY - r.top);
  });
  $('#surface').addEventListener('pointermove', onPtr);
  $('#surface').addEventListener('pointerdown', onPtr);
  /* v10: 첫 화면은 DESCENT. 흰 수면 게이트는 숨김 → 루프 돌리지 않음 */
  entered = true; document.body.classList.add('entered');
  addEventListener('resize', resize); resize();
  DEMO.enter = () => enter();
  return { drop, enter };
})();

/* ══════════ 02 OBJECTS ══════════ */
const STAR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23fff'/%3E%3Cstop offset='.5' stop-color='%23AEB7C4'/%3E%3Cstop offset='1' stop-color='%23ffffff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M21 9l2.6 9.4L33 21l-9.4 2.6L21 33l-2.6-9.4L9 21l9.4-2.6z' fill='url(%23g)' stroke='%23174BFF' stroke-opacity='.35' stroke-width='.6'/%3E%3C/svg%3E\")";
const HEXB = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='14' fill='none' stroke='%23AEB7C4' stroke-width='1'%3E%3Cpath d='M2 7l4-4h8l4 4-4 4H6z'/%3E%3Cpath d='M18 7h8'/%3E%3C/svg%3E\")";
const OVAL = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none' stroke='%23ffffff' stroke-width='1.1'%3E%3Crect x='12' y='6' width='16' height='28' rx='8'/%3E%3Cpath d='M12 16h16' stroke='%23174BFF' stroke-opacity='.4'/%3E%3C/svg%3E\")";
function thornSVG() {
  let d = ''; const n = 22;
  for (let i = 0; i <= n; i++) { const a0 = -Math.PI * 0.95 + (i / n) * Math.PI * 1.35; const r1 = 40, r2 = 40 + (i % 2 ? 7 : 15);
    const x1 = 50 + Math.cos(a0) * r1, y1 = 50 + Math.sin(a0) * r1, x2 = 50 + Math.cos(a0 + 0.06) * r2, y2 = 50 + Math.sin(a0 + 0.06) * r2;
    d += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${(50 + Math.cos(a0 + 0.13) * r1).toFixed(1)} ${(50 + Math.sin(a0 + 0.13) * r1).toFixed(1)}`; }
  return `<svg class="ring-thorn" viewBox="0 0 100 100"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#9aa6b8"/><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#4b5361"/></linearGradient></defs><path d="M50 10a40 40 0 1 1-37 25" fill="none" stroke="url(#tg)" stroke-width="6" stroke-linecap="round"/><path d="${d}" fill="url(#tg)" stroke="#6c7687" stroke-width=".4"/></svg>`;
}
const JV = {
  star: { pat: STAR, patsz: '42px', tint: 'rgba(238,243,250,.62)', tray: '#E9EEF6', spine: 'CRESCENT SCAR · CHROME THORN', thorn: true, label: 'C-02' },
  blue: { pat: OVAL, patsz: '40px', tint: 'rgba(150,196,240,.42)', tray: '#CFE2F7', spine: 'AMNESIA · X-RAY BLUE', label: 'C-04' },
  hex: { pat: HEXB, patsz: '26px 14px', tint: 'rgba(255,255,255,.14)', tray: '#F3F6FA', spine: 'INTRO · CLEAR ARCHIVE', label: 'C-01' },
};
function jewel(v, mini) {
  const c = JV[v]; const el = document.createElement('div'); el.className = 'jc' + (mini ? ' sm' : '');
  el.style.setProperty('--pat', c.pat); el.style.setProperty('--patsz', c.patsz); el.style.setProperty('--tint', c.tint); el.style.setProperty('--tray', c.tray);
  el.innerHTML = `<div class="f back"></div><div class="f tray"></div><div class="disc"></div><div class="f side r"></div><div class="f side l"><span>${c.spine}</span></div><div class="f side t"></div><div class="f side b"></div><div class="f front"><span class="label">GYEOLLAK ${c.label}</span>${c.thorn ? thornSVG() : ''}</div>`;
  return el;
}
function bag(mini) { const el = document.createElement('div'); el.className = 'bag' + (mini ? ' sm' : '');
  el.innerHTML = `<div class="f bk"></div><img class="inner" src="img/goods/kr7-puppy.webp" alt=""><div class="f sd l"></div><div class="f sd r"></div><div class="f bt"></div><div class="f tp"></div><div class="f fr"></div><div class="handle"></div>`; return el; }

const ITEMS = [
  { id: 'kr1', name: 'CLOUD & DISC', kr: '구름 클립 + 플립 디스크 키링', kind: 'frames', set: 'kr1-cloud-disc', pos: { l: 7, t: 8.5, w: 8 }, hang: true, meta: ['공통', 'K1 CLOUD', '크롬 · 홀로 아크릴'] },
  { id: 'kr2', name: 'FLIP DISC A/B', kr: '플립 디스크 SIDE A/B 키링', kind: 'frames', set: 'kr2-flip-disc', pos: { l: 18, t: 8.5, w: 8.6 }, hang: true, meta: ['공통 · TWO SIDES', 'K8 S-BINER', '홀로 · 니켈'] },
  { id: 'panther', name: 'MINI PLUSH · PANTHER', kr: '미니 인형 키링 · 흑표범', kind: 'standee', img: 'img/goods/kr7-panther.webp', pos: { l: 29, t: 8.8, w: 10 }, hang: true, meta: ['채류현', 'K4 PEAR', '플러시 · 구름 고리'] },
  { id: 'fox', name: 'MINI PLUSH · FOX', kr: '미니 인형 키링 · 은여우', kind: 'standee', img: 'img/goods/kr7-fox.webp', pos: { l: 40, t: 8.8, w: 10 }, hang: true, meta: ['채유성', 'K6 HEART', '플러시 · 구름 고리'] },
  { id: 'bag', name: 'ACRYLIC BAG CASE', kr: '투명 아크릴 가방 케이스', kind: 'bag', pos: { l: 56, b: 62, w: 18 }, meta: ['공통 · 굿즈 패키지', '크롬 손잡이', '투명 아크릴 3mm'] },
  { id: 'globe', name: 'GARDENIA CAPSULE', kr: '치자 캡슐 · 스노우볼 키링', kind: 'standee', img: 'img/goods/08-vending-capsule.webp', pos: { l: 79, b: 62, w: 15 }, meta: ['치자 (Hidden)', 'K1 CLOUD', '투명 돔 · 크림 베이스'] },
  { id: 'star', name: 'CHROME THORN', kr: '별무늬 프로스트 CD 케이스', kind: 'jewel', v: 'star', pos: { l: 8, b: 34, w: 15 }, meta: ['Crescent Scar · 대표', 'K5 STAR-CUT', '프로스트 PC · 크롬 가시 링'] },
  { id: 'blue', name: 'X-RAY BLUE', kr: '페일 블루 투명 CD 케이스', kind: 'jewel', v: 'blue', pos: { l: 30, b: 34, w: 15 }, meta: ['Amnesia · 하진우', 'K3 OVAL', '블루 틴트 PC'] },
  { id: 'hex', name: 'CLEAR ARCHIVE', kr: '헥사 링크 클리어 케이스', kind: 'jewel', v: 'hex', pos: { l: 52, b: 34, w: 15 }, meta: ['Intro · 공통', 'K7 HEX LINK', '클리어 PC'] },
  { id: 'bear', name: 'MINI PLUSH · BEAR', kr: '미니 인형 · 곰', kind: 'standee', img: 'img/goods/kr7-bear.webp', pos: { l: 77, b: 34, w: 12 }, meta: ['문태준', 'K2 D-RING', '플러시'] },
  { id: 'drip', name: 'LIQUID DRIP', kr: '크롬 드립 능소화 슬리브', kind: 'standee', img: 'img/goods/03-liquid-drip.webp', pos: { l: 5, b: 7, w: 16 }, meta: ['능소화 · 채류현', 'K4 PEAR', '크롬 드립 PET'] },
  { id: 'sleeve', name: 'SOFT SLEEVE', kr: '핑크 동백 PVC 슬리브', kind: 'standee', img: 'img/goods/05-soft-sleeve.webp', pos: { l: 23, b: 7, w: 17 }, meta: ['상사화 · 채유성', 'K6 HEART', '프로스트 핑크 PVC'] },
  { id: 'sprue', name: 'SPRUE KIT', kr: '프라모델 런너 CD 세트', kind: 'standee', img: 'img/goods/06-sprue-kit.webp', pos: { l: 42, b: 7, w: 21 }, meta: ['Rewind · 문태준', 'K2 D-RING', '아이보리 ABS 런너'] },
  { id: 'xray', name: 'X-RAY STACK', kr: '엑스레이 레이어 케이스', kind: 'standee', img: 'img/goods/04-x-ray.webp', pos: { l: 65, b: 7, w: 15 }, meta: ['Amnesia · 하진우', 'K3 OVAL', '블루 레이어 PC'] },
  { id: 'receipt', name: 'RECEIPT SLEEVE', kr: '감열지 영수증 슬리브', kind: 'standee', img: 'img/goods/07-receipt-sleeve.webp', pos: { l: 82, b: 7, w: 14 }, meta: ['Burn Out · 공통', 'K8 S-BINER', '감열지 · 그을린 끝'] },
];
const RAIL = [
  ['01-clear-archive', 'CLEAR ARCHIVE', 'Intro · 공통'], ['02-chrome-thorn', 'CHROME THORN', 'Crescent Scar · 대표'], ['03-liquid-drip', 'LIQUID DRIP', '능소화 · 채류현'], ['04-x-ray', 'X-RAY', 'Amnesia · 하진우'],
  ['05-soft-sleeve', 'SOFT SLEEVE', '상사화 · 채유성'], ['06-sprue-kit', 'SPRUE KIT', 'Rewind · 문태준'], ['07-receipt-sleeve', 'RECEIPT SLEEVE', 'Burn Out · 공통'], ['08-vending-capsule', 'VENDING CAPSULE', '치자 · Hidden'],
];
const Objects = (() => {
  const host = $('#shelfItems'), shell = $('#caseShell'), list = $('#itemList');
  ITEMS.forEach((it, i) => {
    const el = document.createElement('button'); el.className = 'item' + (it.hang ? ' hang' : ''); el.dataset.id = it.id;
    el.style.left = it.pos.l + '%'; el.style.width = it.pos.w + '%';
    if (it.hang) { el.style.top = it.pos.t + '%'; el.style.animationDelay = (-i * 0.7) + 's'; } else el.style.bottom = it.pos.b + '%';
    el.setAttribute('aria-label', it.kr + ' 꺼내 보기');
    if (it.kind === 'jewel') { const wr = document.createElement('div'); wr.className = 'jc-wrap'; wr.appendChild(jewel(it.v, true)); el.appendChild(wr); el.style.height = '0'; el.style.width = '118px'; el.style.height = '104px'; }
    else if (it.kind === 'bag') { const wr = document.createElement('div'); wr.className = 'jc-wrap'; wr.style.transform = 'rotateY(-28deg) rotateX(-6deg)'; wr.appendChild(bag(true)); el.appendChild(wr); el.style.width = '120px'; el.style.height = '84px'; }
    else { const im = document.createElement('img'); im.src = it.kind === 'frames' ? `img/goods/${it.set}_v0.webp` : it.img; im.alt = ''; im.loading = 'lazy'; el.appendChild(im); }
    const tg = document.createElement('span'); tg.className = 'tag'; tg.textContent = it.name; el.appendChild(tg);
    el.addEventListener('click', () => open(it.id, el));
    host.appendChild(el);
    const li = document.createElement('li'); li.innerHTML = `${it.kr}<span>${String(i + 1).padStart(2, '0')}</span>`; li.onclick = () => open(it.id, el); list.appendChild(li);
  });
  // cabinet tilt + glare
  const cab = $('#cabinet');
  const fitCab = () => { const avail = cab.parentElement.clientWidth - (isMobile() ? 0 : 0); cab.style.zoom = Math.min(1, avail / 880); };
  fitCab(); addEventListener('resize', fitCab);
  cab.addEventListener('pointermove', e => { const r = cab.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    shell.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 3}deg)`; $('#caseGlare').style.transform = `translateX(${x * 60}px)`; });
  cab.addEventListener('pointerleave', () => { shell.style.transform = ''; });
  shell.style.transition = 'transform .6s var(--ease-out)';
  // blister rail
  const rail = $('#rail');
  RAIL.forEach(([f, n, s], i) => { const b = document.createElement('button'); b.className = 'blister';
    b.innerHTML = `<span class="hole"></span><span class="no">No.${String(i + 1).padStart(2, '0')}</span><span class="dome"><img src="img/goods/${f}.webp" alt="" loading="lazy"></span><span class="perf"></span><span class="lab"><b>${n}</b><span>${s}</span></span>`;
    b.addEventListener('click', ev => { if (railMoved) return; open({ id: 'rail' + i, name: n, kr: n + ' 케이스 시안', kind: 'standee', img: `img/goods/${f}.webp`, meta: [s, 'v06 §16 시안', '그록 시안 누끼'] }, b.querySelector('img')); });
    rail.appendChild(b); });
  let rd = false, rx = 0, rv = 0, railMoved = false;
  rail.addEventListener('pointerdown', e => { rd = true; rx = e.clientX; rv = 0; railMoved = false; });
  addEventListener('pointermove', e => { if (!rd) return; const dx = e.clientX - rx; if (Math.abs(dx) > 3) railMoved = true; rail.scrollLeft -= dx; rv = dx; rx = e.clientX; });
  addEventListener('pointerup', () => { if (!rd) return; rd = false; (function glide() { rv *= 0.94; rail.scrollLeft -= rv; if (Math.abs(rv) > 0.3) requestAnimationFrame(glide); })(); });

  // inspector
  const insp = $('#insp'), stage = $('#inspStage'), o3 = $('#obj3d'), info = $('#inspInfo'); let cur = null, srcEl = null, raf = 0, frames = null, view = null, jc = null;
  const rot = Rotator(st => {
    const ry = st.ry;
    if (frames) { // frame-swap turnaround
      const a = ((ry % 360) + 360) % 360; const table = [[0, 0, 1], [45, 1, 1], [90, 2, 1], [180, 3, 1], [270, 2, -1], [315, 1, -1], [360, 0, 1]];
      let best = table[0]; for (const t of table) if (Math.abs(a - t[0]) < Math.abs(a - best[0])) best = t;
      const res = (a - best[0]) * 0.35; if (view.dataset.f != best[1]) { view.src = frames[best[1]]; view.dataset.f = best[1]; }
      view.style.transform = `scaleX(${best[2]}) rotateY(${res}deg)`;
      o3.style.transform = `rotateX(${st.rx * 0.4}deg) scale(${st.s})`;
    } else o3.style.transform = `rotateX(${st.rx}deg) rotateY(${ry}deg) scale(${st.s})`;
    $('#turntable').style.transform = `translate(-50%,-50%) rotateX(78deg) rotateZ(${-ry}deg)`;
    $('#angleRead').textContent = `${Math.round(((ry % 360) + 360) % 360)}° · tilt ${Math.round(st.rx)}°`;
  });
  function loop() { rot.tick(); raf = requestAnimationFrame(loop); }
  function build(it) {
    o3.innerHTML = ''; frames = null; view = null; jc = null; const big = isMobile() ? 0.72 : 1;
    if (it.kind === 'jewel') { jc = jewel(it.v, false); jc.style.setProperty('--w', 250 * big + 'px'); jc.style.setProperty('--h', 220 * big + 'px'); o3.appendChild(jc); }
    else if (it.kind === 'bag') { const b = bag(false); b.style.transform = `scale(${big * 1.25})`; o3.appendChild(b); }
    else if (it.kind === 'frames') { frames = [0, 1, 2, 3].map(i => `img/goods/${it.set}_v${i}.webp`); frames.forEach(f => { const p = new Image(); p.src = f; });
      view = new Image(); view.src = frames[0]; view.dataset.f = 0; view.style.height = (isMobile() ? 300 : 420) + 'px'; view.style.width = 'auto'; o3.appendChild(view); }
    else { const s = document.createElement('div'); s.className = 'standee'; const sz = (isMobile() ? 280 : 400); s.style.width = sz + 'px'; s.style.height = sz + 'px';
      let layers = ''; for (let i = 1; i <= 5; i++) layers += `<img src="${it.img}" alt="" style="transform:translateZ(${-i * 1.6}px);filter:brightness(${1.12 + i * 0.02}) saturate(.5) opacity(.55)">`;
      s.innerHTML = `${layers}<img src="${it.img}" alt="" style="transform:translateZ(1px)"><img class="back" src="${it.img}" alt="" style="transform:translateZ(-9px) rotateY(180deg)"><span class="base"></span>`; o3.appendChild(s); }
    info.innerHTML = `<span class="k">OBJECT · ${it.id.toUpperCase()}</span><h3>${it.name}</h3><p>${it.kr}</p>
      <dl><dt>연결</dt><dd>${it.meta[0]}</dd><dt>카라비너</dt><dd>${it.meta[1]}</dd><dt>재질</dt><dd>${it.meta[2]}</dd><dt>회전</dt><dd>${it.kind === 'frames' ? '턴어라운드 4컷 프레임 교체' : it.kind === 'standee' ? '아크릴 스탠드 (두께 6겹)' : 'CSS 3D 박스'}</dd></dl>
      <div class="ctrl"><button class="chip" data-a="l">↺ 90°</button><button class="chip" data-a="r">90° ↻</button>${it.kind === 'jewel' ? '<button class="chip" data-a="open">OPEN · 디스크 꺼내기</button>' : ''}<button class="chip" data-a="spin">FLICK</button></div>`;
    info.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = b.dataset.a; click(1400);
      if (a === 'l') rot.vy -= 6.2; if (a === 'r') rot.vy += 6.2; if (a === 'spin') rot.vy += 28; if (a === 'open' && jc) jc.classList.toggle('open'); rot.idle = 0; });
  }
  function open(idOrItem, el) {
    const it = typeof idOrItem === 'string' ? ITEMS.find(x => x.id === idOrItem) : idOrItem; if (!it) return;
    cur = it; srcEl = el; build(it); rot.ry = -30; rot.rx = 8; rot.vy = 4; rot.idle = 0; rot.s = 1;
    insp.classList.add('on'); click(1200, 0.04);
    if (el && !RM) { const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect(); const cx = sr.left + sr.width / 2, cy = sr.top + sr.height / 2;
      const sc = clamp(r.width / Math.max(200, o3.getBoundingClientRect().width || 300), 0.15, 0.8);
      o3.parentElement.animate([{ transform: `translate(${r.left + r.width / 2 - cx}px,${r.top + r.height / 2 - cy}px) scale(${sc})`, opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 760, easing: 'cubic-bezier(.2,1.25,.35,1)' });
      el.classList.add('picked'); }
    cancelAnimationFrame(raf); loop();
  }
  function close() { insp.classList.remove('on'); cancelAnimationFrame(raf); if (srcEl) { srcEl.classList.remove('picked'); srcEl.animate([{ transform: 'translateY(-30px) scale(1.1)' }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.2,1.4,.4,1)' }); } srcEl = null; }
  $('#inspClose').onclick = close;
  addEventListener('keydown', e => { if (!insp.classList.contains('on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') rot.vy -= 6; if (e.key === 'ArrowRight') rot.vy += 6; });
  stage.addEventListener('pointerdown', e => { stage.setPointerCapture(e.pointerId); rot.down(e); });
  stage.addEventListener('pointermove', rot.move); stage.addEventListener('pointerup', rot.up); stage.addEventListener('pointercancel', rot.up);
  DEMO.openItem = id => open(id, $(`.item[data-id="${id}"]`)); DEMO.closeItem = close; DEMO.spin = v => { rot.vy += v; rot.idle = 0; };
  DEMO.openCase = () => jc && jc.classList.toggle('open'); DEMO.openRail = i => $$('#rail .blister')[i].click();
})();

/* ══════════ 03 MEMBERS — diagonal line-up carousel ══════════ */
const MEMBERS = [
  { id: 'ryuhyeon', kr: '채류현', en: 'CHAE RYUHYEON', flower: '능소화', animal: '흑표범', clip: 'PEAR', glow: '#FF7A1A', ink: '#B5400A', track: '능소화',
    poses: { suit: ['ryuhyeon_suit', 'ryuhyeon_suit2'], casual: ['ryuhyeon_casual'], y2k: ['turn:ryuhyeon_y2k'] } },
  { id: 'yuseong', kr: '채유성', en: 'CHAE YUSEONG', flower: '동백', animal: '은여우', clip: 'HEART', glow: '#E5294B', ink: '#BE1E4A', track: '상사화',
    poses: { suit: ['yuseong_suit', 'yuseong_suit2', 'turn:yuseong_m2'], casual: ['yuseong_casual', 'yuseong_casual2'], y2k: ['yuseong_y2k', 'yuseong_y2k2'] } },
  { id: 'taejun', kr: '문태준', en: 'MOON TAEJUN', flower: '백합', animal: '곰', clip: 'D-RING', glow: '#1B2A4A', ink: '#1B2A4A', track: 'Rewind', role: '리더 · 드럼',
    poses: { suit: ['taejun_suit', 'taejun_suit2'], casual: ['taejun_casual', 'taejun_casual2'], y2k: ['taejun_y2k'] } },
  { id: 'jinwoo', kr: '하진우', en: 'HA JINWOO', flower: '수국', animal: '강아지', clip: 'OVAL', glow: '#8EC9F2', ink: '#6A4FD0', track: 'Amnesia',
    poses: { suit: ['jinwoo_suit', 'jinwoo_suit2'], casual: ['jinwoo_casual', 'jinwoo_casual2'], y2k: ['jinwoo_y2k', 'jinwoo_y2k2'] } },
];
const TURN = { ryuhyeon_y2k: { n: 5, ang: [0, 45, 90, 180, 315] }, yuseong_m2: { n: 6, ang: [0, 45, 90, 180, 270, 315] } };
const Members = (() => {
  const stage = $('#stage'), layer = $('#memLayer'), cab = $('#cables'), lead = $('#leaders'), labs = $('#labels'); const N = MEMBERS.length;
  let outfit = 'suit', pos = 0, vel = 0, target = 0, drag = null, rotY = 0, rotV = 0, px = 0, py = 0, W = 0, H = 0;
  const poseIdx = MEMBERS.map(() => 0);
  const src = (key) => key.startsWith('turn:') ? `img/turn/${key.slice(5)}_0.webp` : `img/members/${key}.webp`;
  // preload all
  MEMBERS.forEach(m => Object.values(m.poses).flat().forEach(k => { const i = new Image(); i.src = src(k); if (k.startsWith('turn:')) for (let f = 1; f < TURN[k.slice(5)].n; f++) { const j = new Image(); j.src = `img/turn/${k.slice(5)}_${f}.webp`; } }));
  const els = MEMBERS.map((m, i) => {
    const el = document.createElement('div'); el.className = 'mem'; el.dataset.i = i;
    el.innerHTML = `<div class="fig"><img class="pic" alt="${m.kr}" draggable="false"><img class="pic back" alt="" draggable="false" style="position:absolute;inset:0;transform:rotateY(180deg) scaleX(1);backface-visibility:hidden;filter:brightness(.2) contrast(1.2) opacity(.85)"><span class="shadow"></span></div>`;
    el.querySelector('img.pic').style.backfaceVisibility = 'hidden';
    layer.appendChild(el);
    const lb = document.createElement('div'); lb.className = 'mem-label'; lb.innerHTML = `<span>${String(i + 1).padStart(2, '0')} · ${m.clip}</span><b><i style="background:${m.glow};box-shadow:0 0 0 1px ${m.ink}"></i>${m.kr} ${m.en}</b><span>${m.flower} · ${m.animal}${m.role ? ' · ' + m.role : ''}</span>`; labs.appendChild(lb);
    return { el, fig: el.querySelector('.fig'), img: el.querySelector('img.pic'), back: el.querySelector('img.back'), lb };
  });
  function curKey(i) { const p = MEMBERS[i].poses[outfit]; return p ? p[poseIdx[i] % p.length] : null; }
  function setImg(i, anim) {
    const k = curKey(i); const e = els[i];
    const apply = () => { if (!k) { e.img.removeAttribute('src'); e.back.removeAttribute('src'); if (!e.ph) { e.ph = document.createElement('div'); e.ph.className = 'ph'; e.fig.appendChild(e.ph); } e.ph.textContent = `${MEMBERS[i].kr} · ${outfit.toUpperCase()} 컷 없음 (자리표시)`; return; }
      if (e.ph) { e.ph.remove(); e.ph = null; } e.img.src = src(k); e.back.src = src(k); };
    if (!anim || RM) return apply();
    e.img.animate([{ clipPath: 'inset(0 0 0 0)', filter: 'blur(0)' }, { clipPath: 'inset(0 0 100% 0)', filter: 'blur(4px)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
      apply(); e.img.animate([{ clipPath: 'inset(100% 0 0 0)', filter: 'blur(4px)' }, { clipPath: 'inset(0 0 0 0)', filter: 'blur(0)' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }); };
  }
  els.forEach((_, i) => setImg(i));
  function focusIdx() { return ((Math.round(pos) % N) + N) % N; }
  function card() { const i = focusIdx(), m = MEMBERS[i]; $('#memCount').textContent = `${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
    const k = curKey(i) || '—';
    const pl = MEMBERS[i].poses[outfit] || []; const turnTxt = k.startsWith('turn:') ? ' · 360° 턴 컷' : '';
    $('#focusCard').innerHTML = `<span class="n">${String(i + 1).padStart(2, '0')} — ${outfit.toUpperCase()} · POSE ${(poseIdx[i] % Math.max(1, pl.length)) + 1}/${Math.max(1, pl.length)}${turnTxt}</span><h3 style="color:${m.ink}">${m.kr}<small>${m.en}</small></h3><p>${m.flower} · ${m.animal} · 카라비너 ${m.clip} · 테마곡 ${m.track}${m.role ? ' · ' + m.role : ''}</p>`; }
  let lastFocus = -1;
  function layout(t) {
    W = stage.clientWidth; H = stage.clientHeight; const mob = isMobile();
    const fh = H * (mob ? 0.52 : 0.80), fw = fh * 0.5625;
    const ax = W * (mob ? 0.30 : 0.30), ay = H * (mob ? 0.70 : 0.93), sx = W * (mob ? 0.2 : 0.14), sy = H * (mob ? 0.06 : 0.105);
    const feet = []; const fi = focusIdx();
    for (let i = 0; i < N; i++) {
      let d = ((i - pos) % N + N) % N; if (d > N - 0.55) d -= N; // the one pushed out to the front-left
      let x, y, s, op = 1, blur = 0;
      if (d >= 0) { s = Math.pow(0.8, d); x = ax + d * sx * (1 + d * 0.08); y = ay - d * sy; blur = Math.max(0, d - 1.4) * 1.6; }
      else { s = 1 + -d * 0.25; x = ax + d * W * 0.42; y = ay + -d * H * 0.04; op = clamp(1 + d * 1.25, 0, 1); blur = -d * 6; }
      const par = (1.2 - Math.min(d, 3) * 0.3);
      x += px * 26 * par; y += py * 10 * par;
      const e = els[i]; const w = fw * s, h = fh * s;
      e.el.style.width = fw + 'px';
      const isF = i === fi && Math.abs(d) < 0.5;
      const ry = isF ? rotY : (d * -8);
      e.el.style.transform = `translate(${x - fw / 2}px,${y - fh}px) scale(${s})`;
      e.el.style.zIndex = String(100 - Math.round(d * 10));
      e.el.style.opacity = op; e.el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none';
      // rotation: turnaround frames or acrylic-standee flip
      const k = curKey(i);
      if (k && k.startsWith('turn:')) { const set = k.slice(5), T = TURN[set]; const a = ((ry % 360) + 360) % 360;
        let best = 0, bm = 1; T.ang.forEach((ang, j) => { if (Math.abs(a - ang) < Math.abs(a - T.ang[best])) best = j; });
        if (Math.abs(a - 360) < Math.abs(a - T.ang[best])) best = 0;
        if (set === 'ryuhyeon_y2k' && a > 225 && a < 292) { best = 2; bm = -1; }
        const f = `img/turn/${set}_${best}.webp`; if (!e.img.src.endsWith(f)) e.img.src = f;
        e.fig.style.transform = `rotateY(${((a - T.ang[best] + 540) % 360 - 180) * 0.25}deg) scaleX(${bm})`; e.back.style.display = 'none'; }
      else { e.back.style.display = ''; e.fig.style.transform = `perspective(1400px) rotateY(${ry}deg)`; }
      feet.push({ x: x, y: y - 4, s, d, op, h: h, i });
      // label + leader
      const lb = e.lb; const lx = Math.max(6, Math.min(x + w * 0.06, W - (lb.offsetWidth || 150) - 10)), ly = y - h * 0.97 - 46;
      lb.style.transform = `translate(${lx}px,${ly}px)`; lb.style.opacity = d < -0.3 ? 0 : clamp(1.15 - d * 0.28, 0, 1) * op; lb.style.zIndex = 120 - Math.round(d * 10);
      e.lead = [x, y - h * 0.955, lx - 6, ly + 14];
    }
    // leaders
    lead.innerHTML = els.map((e, i) => { const [a, b, c, d2] = e.lead; const o = e.lb.style.opacity; return `<path d="M${a} ${b}V${d2}H${c}" stroke="#0B0D12" stroke-opacity="${o * 0.5}" fill="none" stroke-width="1"/><circle cx="${a}" cy="${b}" r="2.2" fill="#fff" stroke="${MEMBERS[i].ink}" stroke-opacity="${o}"/>`; }).join('');
    // mic cables snaking across the floor to a stage box (bottom-right)
    const bx = W + 20, by = H * 0.99; const tt = t / 1000; let p = '', pulse = '';
    feet.filter(f => f.op > 0.05).forEach((f, j) => { const wig = Math.sin(tt * 1.1 + j * 1.7) * 18;
      const d = `M${f.x - 6 * f.s} ${f.y}C${f.x - 80 * f.s} ${f.y + 30 + wig} ${f.x + 120} ${f.y + 70 - wig} ${(f.x + bx) / 2} ${by - 30 + wig * 0.6}S${bx - 140} ${by + 10} ${bx} ${by - 6 * j}`;
      p += `<path d="${d}" fill="none" stroke="#0B0D12" stroke-opacity="${0.55 * f.op}" stroke-width="${1.6 * Math.max(.6, f.s)}" stroke-linecap="round"/>`;
      pulse += `<path d="${d}" fill="none" stroke="${MEMBERS[f.i].d === undefined ? '#174BFF' : '#174BFF'}" stroke-width="2" stroke-linecap="round" stroke-dasharray="14 900" stroke-dashoffset="${-(tt * 160 + j * 120) % 914}" opacity="${f.op * 0.9}"/>`; });
    cab.innerHTML = p + pulse;
    if (fi !== lastFocus) { lastFocus = fi; card(); }
  }
  function frame(t) {
    if (!drag || drag.mode !== 'push') { const a = (target - pos) * 0.085; vel = vel * 0.8 + a; pos += vel; }
    if (!drag || drag.mode !== 'rotate') { if (Math.abs(rotV) > 2.2) { rotY += rotV; rotV *= 0.95; } else { const goal = Math.round(rotY / 360) * 360; rotV = rotV * 0.82 + (goal - rotY) * 0.06; rotY += rotV; } }
    layout(t); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5;
    if (!drag) return; const dx = e.clientX - drag.x; const now = performance.now(); drag.moved = drag.moved || Math.abs(e.clientX - drag.sx) > 6 || Math.abs(e.clientY - drag.sy) > 6;
    if (drag.mode === 'push') { const step = W * (isMobile() ? 0.42 : 0.24); pos -= dx / step; drag.v = lerp(drag.v, -dx / step, 0.5); }
    else { rotY += dx * 0.7; rotV = lerp(rotV, dx * 0.7, 0.5); }
    drag.x = e.clientX; drag.t = now; });
  stage.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; stage.setPointerCapture(e.pointerId);
    const memEl = e.target.closest('.mem'); const fi = focusIdx(); const onFocus = memEl && +memEl.dataset.i === fi;
    drag = { mode: onFocus ? 'rotate' : 'push', x: e.clientX, sx: e.clientX, sy: e.clientY, v: 0, mem: memEl ? +memEl.dataset.i : -1, moved: false }; vel = 0; });
  const end = () => { if (!drag) return; const d = drag; drag = null;
    if (!d.moved) { if (d.mode === 'rotate') nextPose(); else if (d.mem >= 0) goTo(d.mem); return; }
    if (d.mode === 'push') { target = Math.round(pos + d.v * 6); vel = d.v * 0.4; click(700, 0.04, 0.03); } };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  function goTo(i) { // shortest cyclic way
    let diff = ((i - target) % N + N) % N; if (diff > N / 2) diff -= N; target += diff; click(900, 0.04, 0.03); }
  function nextPose() { const i = focusIdx(); const p = MEMBERS[i].poses[outfit]; if (!p) return;
    if (p.length > 1) { poseIdx[i]++; setImg(i, true); lastFocus = -1; } else els[i].el.animate([{ translate: '0 0' }, { translate: '0 -18px' }, { translate: '0 0' }], { duration: 520, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    rotV += 3; click(1500, 0.03); }
  function setOutfit(o) { if (o === outfit) return; outfit = o; MEMBERS.forEach((_, i) => { poseIdx[i] = 0; setTimeout(() => setImg(i, true), i * 90); });
    $$('#outfitSeg button').forEach(b => b.classList.toggle('on', b.dataset.o === o)); knob(); lastFocus = -1; click(1100, 0.04); }
  function knob() { const b = $('#outfitSeg button.on'), k = $('#outfitSeg .knob'), seg = $('#outfitSeg'); if (!b || !k || !seg) return; const sr = seg.getBoundingClientRect(), br = b.getBoundingClientRect(); k.style.left = (br.left - sr.left) + 'px'; k.style.width = br.width + 'px'; }
  $$('#outfitSeg button').forEach(b => b.onclick = () => setOutfit(b.dataset.o));
  $('#memPrev').onclick = () => { target -= 1; click(800); }; $('#memNext').onclick = () => { target += 1; click(800); };
  addEventListener('resize', knob); (document.fonts ? document.fonts.ready : Promise.resolve()).then(knob); setTimeout(knob, 300);
  DEMO.memNext = () => { target += 1; }; DEMO.memPrev = () => { target -= 1; }; DEMO.memGo = goTo; DEMO.outfit = setOutfit; DEMO.memSpin = v => { rotV += v; }; DEMO.pose = nextPose;
})();

/* ══════════ 04 LISTEN — clear CD player ══════════ */
const TRACKS = [
  { f: '00_intro', t: '비가 맺지 못한 것들', s: 'Intro', c: '01-clear-archive', cn: 'CLEAR ARCHIVE', col: '#AEB7C4' },
  { f: '02_gyeolro', t: '결로', s: '結露', c: '02-chrome-thorn', cn: 'CHROME THORN', col: '#174BFF' },
  { f: '03_amnesia', t: 'Amnesia', s: '하진우 · 수국', c: '04-x-ray', cn: 'X-RAY', col: '#8EC9F2' },
  { f: '04_rewind', t: 'Rewind', s: '문태준 · 백합', c: '06-sprue-kit', cn: 'SPRUE KIT', col: '#1B2A4A' },
  { f: '05_sangsahwa', t: '상사화', s: '채유성 · 동백', c: '05-soft-sleeve', cn: 'SOFT SLEEVE', col: '#E5294B' },
  { f: '06_sodapop', t: 'Soda Pop', s: 'Bonus', c: '03-liquid-drip', cn: 'LIQUID DRIP (임시)', col: '#FF7A1A' },
  { f: '07_chija', t: '치자', s: 'Gardenia · Hidden', c: '08-vending-capsule', cn: 'VENDING CAPSULE', col: '#F2E6C2' },
  { f: '08_firstsnow', t: '첫눈이 오면', s: 'Bonus', c: '07-receipt-sleeve', cn: 'RECEIPT SLEEVE (임시)', col: '#C3D3E6' },
];
const Player = (() => {
  const au = $('#audio'), F = window.AUDIO_FEATURES || {}; let idx = 0, ang = 0, angV = 0, busy = false, an = null, abuf = null, rpt = 'ALL', vol = 0.85;
  au.volume = vol;
  const cd = $('#cd'), lid = $('#lid'), art = $('#cdArt'), sled = $('#sled'), arc = $('#progArc'), needle = $('#needle');
  const list = $('#tracks');
  TRACKS.forEach((tr, i) => { const li = document.createElement('li'); const d = F[tr.f] ? fmt(F[tr.f].dur) : '--:--';
    li.innerHTML = `<span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${tr.t}<small>${tr.s}</small></span><span class="c"><i style="background:${tr.col};box-shadow:0 0 0 1px rgba(11,13,18,.25)"></i>${tr.cn}</span><span class="d">${d}</span>`;
    li.onclick = () => load(i, true); list.appendChild(li); });
  function ui() { $$('#tracks li').forEach((li, i) => { li.classList.toggle('on', i === idx); const eq = li.querySelector('.eqm'); if (i === idx && !au.paused) { if (!eq) li.querySelector('.t').insertAdjacentHTML('beforeend', '<span class="eqm"><i></i><i></i><i></i></span>'); } else if (eq) eq.remove(); });
    const tr = TRACKS[idx]; $('#lcdTrk').textContent = `TRK ${String(idx + 1).padStart(2, '0')}/${String(TRACKS.length).padStart(2, '0')}`; $('#lcdCase').textContent = 'CASE · ' + tr.cn;
    $('#lcdTtl').innerHTML = `<span>${tr.t} — ${tr.s}</span><span>${tr.t} — ${tr.s}</span>`; $('#lcdState').textContent = au.paused ? (au.currentTime > 0 ? '❚❚ PAUSE' : '■ STOP') : '▶ PLAY';
    $('#playIco').innerHTML = au.paused ? '<path d="M4 1l8 4-8 4z" fill="#fff"/>' : '<rect x="3" y="1" width="3" height="8" fill="#fff"/><rect x="8" y="1" width="3" height="8" fill="#fff"/>';
    $('#ledPlay').classList.toggle('on', !au.paused); $('#mini').classList.toggle('on', !au.paused && !inListen);
    $('#miniT').innerHTML = `${tr.t}<span>${fmt(au.currentTime)} · TRK ${idx + 1}</span>`; $('#miniPlay').textContent = au.paused ? '▶' : '❚❚';
    if ('mediaSession' in navigator) { try { navigator.mediaSession.metadata = new MediaMetadata({ title: tr.t, artist: 'GYEOLLAK 결락', album: '장마의 잔향 (draft)' }); } catch (e) {} } }
  function setArt() { const tr = TRACKS[idx]; art.style.backgroundImage = `url(img/goods/${tr.c}.webp)`; art.style.backgroundColor = tr.col; $('#miniDisc').style.background = `radial-gradient(circle,#F3F6FA 0 18%,transparent 19%),url(img/goods/${tr.c}.webp) center/cover`; drawWave(); }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function load(i, autoplay) {
    if (busy) return; busy = true; const wasPlaying = !au.paused; i = (i + TRACKS.length) % TRACKS.length;
    if (i === idx && au.src) { busy = false; if (autoplay && au.paused) play(); return; }
    au.pause(); ui(); lid.classList.add('open'); click(600, 0.06, 0.05); await wait(RM ? 0 : 650);
    cd.animate([{ transform: `rotate(${ang}deg) translateY(0) scale(1)` }, { transform: `rotate(${ang}deg) translateY(-26px) scale(1.06)`, opacity: 0.4 }, { transform: `rotate(${ang}deg) translateY(0) scale(1)` }], { duration: RM ? 1 : 700, easing: 'cubic-bezier(.3,1.3,.5,1)' });
    await wait(RM ? 0 : 300); idx = i; au.src = `audio/${TRACKS[i].f}.mp3`; setArt(); ui(); await wait(RM ? 0 : 420);
    lid.classList.remove('open'); click(400, 0.05, 0.06); await wait(RM ? 0 : 420); busy = false;
    if (autoplay || wasPlaying) play();
  }
  function setupGraph() { if (an || !location.protocol.startsWith('http')) return; const c = ctx(); if (!c) return;
    try { const srcN = c.createMediaElementSource(au); an = c.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = 0.75; srcN.connect(an); an.connect(c.destination); abuf = new Uint8Array(an.frequencyBinCount); } catch (e) { an = null; } }
  function play() { if (!au.src) au.src = `audio/${TRACKS[idx].f}.mp3`; setupGraph(); const c = ctx(); if (c && c.state === 'suspended') c.resume();
    const p = au.play(); if (p && p.catch) p.catch(() => {}); }
  function toggle() { if (au.paused) play(); else au.pause(); }
  au.addEventListener('play', ui); au.addEventListener('pause', ui);
  au.addEventListener('ended', () => { if (rpt === 'ONE') { au.currentTime = 0; play(); } else load(idx + 1, true); });
  $$('.kbtn').forEach(b => { b.addEventListener('pointerdown', () => { b.classList.add('down'); click(b.dataset.k === 'play' ? 1000 : 1600, 0.03, 0.06); });
    b.addEventListener('pointerup', () => b.classList.remove('down')); b.addEventListener('pointerleave', () => b.classList.remove('down'));
    b.addEventListener('click', () => { const k = b.dataset.k; if (k === 'play') toggle(); if (k === 'next') load(idx + 1, true); if (k === 'prev') { if (au.currentTime > 3) au.currentTime = 0; else load(idx - 1, true); } if (k === 'stop') { au.pause(); au.currentTime = 0; ui(); } }); });
  $('#openSw').onclick = $('#shuf').onclick = () => { lid.classList.toggle('open'); click(600, 0.05); if (lid.classList.contains('open')) au.pause(); };
  $('#rpt').onclick = () => { rpt = rpt === 'ALL' ? 'ONE' : 'ALL'; $('#rpt').textContent = 'REPEAT · ' + rpt; click(1300); };
  $('#miniPlay').onclick = toggle; $('#sndBtn').onclick = toggle;
  // scrub ring
  const ring = $('#scrubRing'); let sdrag = false;
  function ringSeek(e) { const r = ring.getBoundingClientRect(); const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); let p = (a + Math.PI / 2) / (Math.PI * 2); if (p < 0) p += 1; seek(p); }
  ring.addEventListener('pointerdown', e => { const r = ring.getBoundingClientRect(); const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) / (r.width / 2); if (d < 0.86) return; sdrag = true; ring.setPointerCapture(e.pointerId); ringSeek(e); });
  ring.addEventListener('pointermove', e => sdrag && ringSeek(e)); ring.addEventListener('pointerup', () => { sdrag = false; });
  ring.style.pointerEvents = 'none'; $('#walkman').addEventListener('pointerdown', e => { const r = ring.getBoundingClientRect(); const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) / (r.width / 2); if (d > 0.9 && d < 1.12 && !e.target.closest('button,.open-sw')) { sdrag = true; $('#walkman').setPointerCapture(e.pointerId); ringSeek(e); } });
  $('#walkman').addEventListener('pointermove', e => sdrag && ringSeek(e)); $('#walkman').addEventListener('pointerup', () => { sdrag = false; });
  function seek(p) { const d = au.duration || (F[TRACKS[idx].f] || {}).dur || 0; if (!d) return; if (!au.src) { au.src = `audio/${TRACKS[idx].f}.mp3`; } try { au.currentTime = clamp(p, 0, 0.999) * d; } catch (e) {} }
  // waveform
  const wave = $('#wave'), wc = $('#waveC'), wg = wc.getContext('2d');
  function drawWave() { const r = wave.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); wc.width = r.width * dpr; wc.height = r.height * dpr; wg.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pk = (F[TRACKS[idx].f] || {}).peaks || ''; const n = Math.floor(r.width / 3); const d = au.duration || (F[TRACKS[idx].f] || {}).dur || 1; const prog = au.currentTime / d;
    wg.clearRect(0, 0, r.width, r.height);
    for (let i = 0; i < n; i++) { const v = pk ? (pk.charCodeAt(Math.floor(i / n * pk.length)) - 48) / 74 : 0.1; const hh = Math.max(1, v * (r.height - 8));
      wg.fillStyle = i / n < prog ? '#174BFF' : 'rgba(11,13,18,.26)'; wg.fillRect(i * 3, (r.height - hh) / 2, 1.6, hh); }
    wg.fillStyle = '#0B0D12'; wg.fillRect(prog * r.width, 0, 1, r.height); }
  let wdrag = false; const wseek = e => { const r = wave.getBoundingClientRect(); seek((e.clientX - r.left) / r.width); };
  wave.addEventListener('pointerdown', e => { wdrag = true; wave.setPointerCapture(e.pointerId); wseek(e); click(1700, 0.02); });
  wave.addEventListener('pointermove', e => { const r = wave.getBoundingClientRect(); const p = clamp((e.clientX - r.left) / r.width, 0, 1); const tip = $('#waveTip'); tip.style.left = p * 100 + '%'; tip.textContent = fmt(p * (au.duration || (F[TRACKS[idx].f] || {}).dur || 0)); if (wdrag) wseek(e); });
  wave.addEventListener('pointerup', () => { wdrag = false; });
  // volume knob
  const vk = $('#vol'); let vd = null; const setVol = v => { vol = clamp(v, 0, 1); au.volume = vol; vk.style.transform = `rotate(${-135 + vol * 270}deg)`; }; setVol(vol);
  vk.addEventListener('pointerdown', e => { vd = { y: e.clientY, v: vol }; vk.setPointerCapture(e.pointerId); });
  vk.addEventListener('pointermove', e => { if (vd) setVol(vd.v + (vd.y - e.clientY) / 160); }); vk.addEventListener('pointerup', () => { vd = null; click(2000, 0.015); });
  // LCD spectrum
  const sp = $('#spec'), sg = sp.getContext('2d'); const NB = 24; const bars = new Float32Array(NB), caps = new Float32Array(NB);
  function spectrum() {
    let src = null; const tr = F[TRACKS[idx].f];
    if (an && !au.paused) { an.getByteFrequencyData(abuf); let sum = 0; for (let i = 0; i < abuf.length; i++) sum += abuf[i]; if (sum > 0) { src = []; for (let b = 0; b < NB; b++) { const a = Math.floor(Math.pow(b / NB, 1.6) * 90) + 1, z = Math.floor(Math.pow((b + 1) / NB, 1.6) * 90) + 2; let m = 0; for (let k = a; k < z; k++) m = Math.max(m, abuf[k]); src.push(m / 255); } } }
    if (!src && tr && !au.paused) { const fi = Math.floor(au.currentTime * tr.fps); const off = fi * tr.nb; src = []; for (let b = 0; b < NB; b++) { const bb = b / NB * tr.nb; const i0 = Math.floor(bb), i1 = Math.min(tr.nb - 1, i0 + 1);
        const v0 = (tr.bands.charCodeAt(off + i0) - 48) / 40, v1 = (tr.bands.charCodeAt(off + i1) - 48) / 40; src.push(clamp(lerp(v0, v1, bb - i0) || 0, 0, 1)); } }
    sg.clearRect(0, 0, sp.width, sp.height); const bw = sp.width / NB;
    for (let b = 0; b < NB; b++) { const v = src ? src[b] : 0; bars[b] = Math.max(v, bars[b] * 0.86); caps[b] = Math.max(bars[b], caps[b] - 0.012);
      const segs = Math.round(bars[b] * 12); for (let s = 0; s < 12; s++) { sg.fillStyle = s < segs ? '#1A2C55' : 'rgba(26,44,85,.08)'; sg.fillRect(b * bw + 3, sp.height - (s + 1) * 7.4, bw - 6, 5.2); }
      sg.fillStyle = '#174BFF'; sg.fillRect(b * bw + 3, sp.height - Math.max(1, Math.round(caps[b] * 12)) * 7.4 - 3, bw - 6, 2); }
    return src ? src.reduce((a, b) => a + b, 0) / NB : 0;
  }
  // cord (earphone cable)
  const cord = $('#cord');
  function drawCord(t, energy) { const deck = $('#deck').getBoundingClientRect(), jack = $('#jack').getBoundingClientRect(); const x0 = jack.left - deck.left + 10, y0 = jack.top - deck.top + 10; const W = deck.width, H = deck.height;
    const sw = Math.sin(t / 900) * 14 + energy * 20; const x1 = isMobile() ? W * 0.12 : -20, y1 = H + 10;
    const d = `M${x0} ${y0}C${x0} ${y0 + 80 + sw} ${x0 - 160} ${y0 + 40 - sw} ${(x0 + x1) / 2} ${H * 0.95 + sw * 0.5}S${x1 + 40} ${y1 - 30} ${x1} ${y1}`;
    cord.innerHTML = `<path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="${d}" fill="none" stroke="rgba(11,13,18,.45)" stroke-width="1.2" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#174BFF" stroke-width="2" stroke-dasharray="10 800" stroke-dashoffset="${-(t / 6) % 810}" opacity="${au.paused ? 0 : .8}"/>`; }
  let lastT = performance.now(), inListen = false, waveTick = 0;
  function frame(t) { const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    const targetV = au.paused || lid.classList.contains('open') ? 0 : 420; angV += (targetV - angV) * (targetV > angV ? 2.2 : 1.4) * dt; ang = (ang + angV * dt) % 360;
    cd.style.transform = `rotate(${ang}deg)`; cd.style.filter = angV > 200 ? `blur(${((angV - 200) / 400).toFixed(2)}px)` : 'none';
    const d = au.duration || (F[TRACKS[idx].f] || {}).dur || 1; const p = clamp(au.currentTime / d, 0, 1);
    sled.style.left = (6 + p * 66) + '%'; const C = 2 * Math.PI * 96; arc.setAttribute('stroke-dasharray', `${p * C} ${C}`);
    const a = p * Math.PI * 2 - Math.PI / 2; needle.setAttribute('transform', `translate(${100 + Math.cos(a) * 96} ${100 + Math.sin(a) * 96})`);
    $('#lcdTime').textContent = fmt(au.currentTime); $('#lcdRem').textContent = '-' + fmt(d - au.currentTime);
    const e = spectrum(); if (++waveTick % 6 === 0) drawWave(); drawCord(t, e);
    $$('#sndBtn .bars i').forEach((b, i) => b.style.height = (au.paused ? 30 : 30 + bars[i * 6] * 70) + '%');
    if (waveTick % 15 === 0) { $('#miniT').innerHTML = `${TRACKS[idx].t}<span>${fmt(au.currentTime)} · TRK ${idx + 1}</span>`; }
    requestAnimationFrame(frame); }
  new IntersectionObserver(es => { inListen = es[0].isIntersecting; $('#mini').classList.toggle('on', !au.paused && !inListen); }, { threshold: 0.2 }).observe($('#listen'));
  au.src = `audio/${TRACKS[0].f}.mp3`; setArt(); ui(); requestAnimationFrame(frame); addEventListener('resize', drawWave);
  if ('mediaSession' in navigator) { try { navigator.mediaSession.setActionHandler('nexttrack', () => load(idx + 1, true)); navigator.mediaSession.setActionHandler('previoustrack', () => load(idx - 1, true)); } catch (e) {} }
  DEMO.play = i => i === undefined ? play() : load(i, true); DEMO.pause = () => au.pause(); DEMO.seek = seek; DEMO.lid = () => lid.classList.toggle('open');
  DEMO.state = () => ({ idx, t: au.currentTime, paused: au.paused, an: !!an });
})();

/* nav state */
const navs = $$('.nav a');
new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navs.forEach(a => a.classList.toggle('on', a.dataset.s === e.target.id)); }), { threshold: 0.45 })
  .observe; $$('main section, body > section').forEach(s => new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navs.forEach(a => a.classList.toggle('on', a.dataset.s === s.id)); }), { threshold: 0.4 }).observe(s));
})();
