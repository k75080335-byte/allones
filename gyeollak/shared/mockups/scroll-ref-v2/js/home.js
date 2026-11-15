/* 결락 · scroll reference v2 — 결 물방울 + 1px 실 + 장면 마스크 + 액체 숫자
   모든 움직임은 스크롤 위치로만 정해진다 (시간 애니메이션 없음) → 되감기·스크린샷이 항상 같은 그림. */
(() => {
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]rm=1/.test(location.search);
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3);
const win = (p, a, b, c, d) => clamp((p - a) / (b - a)) * (1 - clamp((p - c) / (d - c)));
const T = (el, v) => { if (el) el.style.transform = v; };
const V15 = GY_V15, M = GY_M, mem = id => M.find(m => m.id === id);
const secs = $$('#track section'), chs = $$('.ch'), N = secs.length;
const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const FL = [['jinwoo', 1], ['yuseong', 1], ['ryuhyeon', 1], ['taejun', 1]].map(([id]) => mem(id));
// home08 v2 배치 (compose.py 와 같은 발 위치) — 키 비율 195/190/189/188 반영
const H8 = {
  '16x9': { iw: 1280, ih: 720, land: [.425, .94],
    m: { ryuhyeon: [.305, .86, .44 * 188 / 195], yuseong: [.415, .655, .38 * 190 / 195], jinwoo: [.545, .835, .44 * 189 / 195], taejun: [.655, .625, .38 * 195 / 195] } },
  '9x16': { iw: 720, ih: 1280, land: [.44, .865],
    m: { ryuhyeon: [.30, .78, .32 * 188 / 195], yuseong: [.41, .62, .28 * 190 / 195], jinwoo: [.56, .76, .32 * 189 / 195], taejun: [.66, .595, .28 * 195 / 195] } } };
const MEMS = ['ryuhyeon', 'yuseong', 'jinwoo', 'taejun'].map(mem);
// 큰 숫자 색 (장면 바탕 위)
const NUM = { 1: { fill: '#174BFF', c1: '#9FD8F5', c2: '#0B0D12', lens: 1 }, 2: { fill: '#F5F8FC', c1: '#9FD8F5', c2: '#0B1F7A', lens: 1 },
  3: { fill: '#DCEFFB', c1: '#174BFF', c2: '#9FD8F5', lens: 1 }, 4: { fill: '#E6EDF6', lens: 0 }, 6: { fill: '#F5F8FC', c1: '#174BFF', c2: '#DCEFFB', lens: 1 } };

/* ---------- DOM ---------- */
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
$('#speed').innerHTML = Array.from({ length: 22 }, () => `<i style="left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 170).toFixed(1)}vh;opacity:${(.12 + rnd() * .3).toFixed(2)}"></i>`).join('');
const bubs = Array.from({ length: 18 }, () => ({ x: rnd() * 100, y: 50 + rnd() * 80, s: 5 + rnd() * 30, v: .4 + rnd() * 1.2 }));
$('#bub').innerHTML = bubs.map(b => `<i style="left:${b.x}%;top:${b.y}vh;width:${b.s}px;height:${b.s}px"></i>`).join('');
const bubEls = $$('#bub i');
$('#flowers').innerHTML = FL.map((m, j) => `<figure class="fl" data-j="${j}">
  <div class="hj" aria-hidden="true">${m.fk}</div>
  <div class="arch"><img src="assets/photos/${m.id}_1.webp" alt="${m.kr}"></div>
  <div class="oval">${m.id === 'taejun' ? `<img class="seq" src="assets/lily/000.webp" alt="백합">` : `<span class="tag">꽃 소스 준비 중</span>`}</div>
  <figcaption class="cap"><span class="k">06 — 꽃 · 0${j + 1} / 04</span><b>${m.flower} <small style="font:400 .5em var(--sans);opacity:.6">${m.fk}</small></b><span>${m.kr}의 꽃${m.id === 'taejun' ? ' · <span class="tag test">백합 개화 · 그록 테스트</span>' : ''}</span></figcaption></figure>`).join('');
$('#steps').innerHTML = FL.map((m, j) => `<a href="#s6" data-step="${j}">0${j + 1}<br>${m.flower}</a>`).join('');
const flEls = $$('.fl'), stepEls = $$('#steps a');
const lilyFrames = Array.from({ length: 37 }, (_, i) => { const im = new Image(); im.src = `assets/lily/${String(i).padStart(3, '0')}.webp`; return im; });
const fishFrames = Array.from({ length: 31 }, (_, i) => { const im = new Image(); im.src = `${V15}img/home/test/drop/${String(i).padStart(3, '0')}.webp`; return im; });
const rail = $('#rail');
secs.forEach((s, k) => rail.insertAdjacentHTML('beforeend', `<a href="#${s.id}" data-go="${k}" aria-label="${ROM[k]} ${chs[k].dataset.t}" style="top:${k / (N - 1) * 100}%">${ROM[k]}</a>`));
const ticks = $$('#rail a'), convI = $$('#conv i'), rings = $$('#rings i');

/* ---------- 레이아웃 ---------- */
let vw, vh, mob, Yv, Xtip, starts = [], lens = [], KP = [], LX = [], FX = [], NG = {}, asp, G, plate = {}, landPt, S7, fl = {};
const pathD = $('#pD'), drop = $('#drop');
function numGeo() {
  NG = {};
  const F = mob ? Math.min(vw * .66, vh * .34) : Math.min(vh * .64, vw * .42);
  [1, 2, 3, 6].forEach(k => NG[k] = { cx: LX[k], by: Yv + .36 * F, F });
  NG[4] = mob ? { cx: vw * .25, by: Yv - vw * .4, F: vw * .3 } : { cx: vw * .25, by: Yv + .36 * F * .62, F: F * .62 };
}
function buildNum(svg, k) {
  const c = NUM[k], g = NG[k], id = 'n' + k;
  svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
  const tx = `<text x="${g.cx}" y="${g.by}" text-anchor="middle" font-size="${g.F}">${svg.dataset.n}</text>`;
  const big = `x="${-vw}" y="${-vh}" width="${vw * 3}" height="${vh * 3}"`;
  svg.innerHTML = !c.lens ? `<g class="ng" fill="${c.fill}">${tx}</g>` : `<defs>
    <filter id="w${id}" x="-40%" y="-40%" width="180%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="${(2.2 / g.F).toFixed(4)}" numOctaves="2" seed="${k * 3}"/><feDisplacementMap in="SourceGraphic" scale="${(g.F * .14).toFixed(1)}" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="r${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${(g.F * .016).toFixed(1)}" result="b"/>
      <feFlood flood-color="${c.c1}"/><feComposite in2="b" operator="in"/><feOffset dx="${(-g.F * .022).toFixed(1)}" dy="${(g.F * .01).toFixed(1)}" result="x1"/>
      <feFlood flood-color="${c.c2}" flood-opacity=".75"/><feComposite in2="b" operator="in"/><feOffset dx="${(g.F * .024).toFixed(1)}" dy="${(-g.F * .008).toFixed(1)}" result="x2"/>
      <feMerge><feMergeNode in="x1"/><feMergeNode in="x2"/><feMergeNode in="b"/></feMerge></filter>
    <mask id="o${id}" maskUnits="userSpaceOnUse" ${big}><rect ${big} fill="#fff"/><circle class="bm" r="0" fill="#000" filter="url(#w${id})"/></mask>
    <mask id="i${id}" maskUnits="userSpaceOnUse" ${big}><circle class="bm" r="0" fill="#fff" filter="url(#w${id})"/></mask>
    <radialGradient id="h${id}" cx="34%" cy="30%" r="62%"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <g class="ng">
      <g mask="url(#o${id})" fill="${c.fill}">${tx}</g>
      <g mask="url(#i${id})"><g class="mag"><g fill="${c.fill}" filter="url(#r${id})">${tx}</g></g><circle class="bh" r="0" fill="url(#h${id})"/></g>
      <circle class="bm bo" r="0" fill="none" stroke="${c.c1}" stroke-width="1" filter="url(#w${id})"/>
    </g>`;
}
function layout() {
  vw = innerWidth; vh = innerHeight; mob = vw < 720; Yv = vh * (mob ? .4 : .42);
  document.documentElement.style.setProperty('--Yv', Yv + 'px');
  secs.forEach(s => s.style.height = (parseFloat(s.dataset.len) * vh) + 'px');
  starts = secs.map(s => s.offsetTop); lens = secs.map(s => s.offsetHeight); lens[N - 1] -= vh; S7 = starts[7];
  // 결 로고: ㅣ 끝(0.809, 0.605)이 물방울 자리
  const mw = Math.min(vw * (mob ? .52 : .26), vh * .32, 320), mh = mw * 1.2222, mk = $('#mark');
  mk.style.setProperty('--mw', mw + 'px'); mk.style.top = (Yv - .605 * mh) + 'px';
  Xtip = vw / 2 - mw / 2 + .809 * mw;
  // 꽃 장면: 아치 위치 (데스크톱은 좌우 번갈아)
  const aw = mob ? vw * .62 : Math.min(vw * .25, 380, vh * .4), ah = mob ? Math.min(vh * .5, aw * 1.6) : Math.min(vh * .64, aw * 1.62);
  FX = FL.map((_, j) => mob ? vw * (j % 2 ? .44 : .56) : vw * (j % 2 ? .3 : .68));
  fl = { aw, ah };
  LX = mob ? [Xtip, .5, .5, .5, .5, 0, .5, .5].map(f => f * vw) : [Xtip, .6 * vw, .42 * vw, .6 * vw, .66 * vw, 0, .5 * vw, .5 * vw];
  LX[5] = FX[0];
  numGeo();
  $$('.num').forEach(svg => { const k = chs.indexOf(svg.closest('.ch')); buildNum(svg, k); });
  // V 구
  const sw = mob ? vw * .8 : Math.min(vw * .36, vh * .62), sph = $('#sph');
  sph.style.setProperty('--sw', sw + 'px'); sph.style.left = (LX[4] - sw / 2) + 'px'; sph.style.top = (Yv - sw * .62) + 'px';
  // VI 꽃 배치
  flEls.forEach((f, j) => {
    const cx = FX[j], top = mob ? vh * .2 : vh * .17, right = !mob && !(j % 2);
    Object.assign(f.querySelector('.arch').style, { left: (cx - aw / 2) + 'px', top: top + 'px', width: aw + 'px', height: ah + 'px' });
    const ow = aw * (mob ? .42 : .5), oh = ow * 1.3, ov = f.querySelector('.oval');
    Object.assign(ov.style, { width: ow + 'px', height: oh + 'px', top: (top + ah - oh * .62) + 'px', left: (mob ? cx + aw * .5 - ow * .75 : right ? cx - aw / 2 - ow * .55 : cx + aw / 2 - ow * .45) + 'px' });
    const hj = f.querySelector('.hj'), hs = mob ? vw * .38 : Math.min(vw * .2, vh * .34);
    hj.style.setProperty('--hs', hs + 'px');
    if (mob) Object.assign(hj.style, { left: '50%', top: (vh * .1) + 'px', transform: 'translateX(-50%)', opacity: .95 });
    else Object.assign(hj.style, right ? { left: 'var(--pad)', right: 'auto', top: (vh * .22) + 'px' } : { right: 'calc(var(--pad) + 44px)', left: 'auto', top: (vh * .22) + 'px' });
    const cap = f.querySelector('.cap');
    if (mob) Object.assign(cap.style, { left: 'var(--pad)', right: 'auto', bottom: (vh * .07) + 'px', top: 'auto', textAlign: 'left' });
    else Object.assign(cap.style, right ? { left: 'var(--pad)', right: 'auto', top: (vh * .22 + hs * 1.02) + 'px', textAlign: 'left' } : { right: 'calc(var(--pad) + 44px)', left: 'auto', top: (vh * .22 + hs * 1.02) + 'px', textAlign: 'right' });
  });
  $('#steps').style.display = mob ? 'none' : 'flex';
  // home08 판 (cover)
  asp = vw / vh < 1 ? '9x16' : '16x9'; G = H8[asp];
  const sc = Math.max(vw / G.iw, vh / G.ih); plate = { w: G.iw * sc, h: G.ih * sc }; plate.x = (vw - plate.w) / 2; plate.y = (vh - plate.h) / 2;
  Object.assign($('#plate').style, { left: plate.x + 'px', top: plate.y + 'px', width: plate.w + 'px', height: plate.h + 'px' });
  if (!$('#plBg').src.includes(asp)) { $('#plBg').src = `assets/home08/bg_${asp}.webp`; $('#plMem').src = `assets/home08/members_${asp}.webp`; }
  landPt = { x: plate.x + G.land[0] * plate.w, y: plate.y + G.land[1] * plate.h };
  const gs = Math.min(plate.w * .17, vw * (mob ? .158 : .17));
  $('#giant').style.setProperty('--gs', gs + 'px'); $('#giant').style.top = ((mob ? .27 : .25) * plate.h) + 'px';
  buildPlate();
  // 실의 기준점 (문서 y, x)
  const sway = mob ? [0, .16, -.15, .14, 0, 0, -.1, 0] : [0, .07, -.06, .06, 0, 0, -.05, 0];
  KP = [[Yv, Xtip], [starts[0] + lens[0] * .55 + Yv, lerp(Xtip, vw * .5, .5)]];
  for (let k = 1; k < N; k++) {
    KP.push([starts[k] + Yv, LX[k]]);
    if (k === 5) for (let q = 0; q < 4; q++) KP.push([starts[5] + (q + .5) / 4 * lens[5] + Yv, FX[q]]);
    else if (k < 7) KP.push([starts[k] + lens[k] * .55 + Yv, LX[k] + sway[k] * vw]);
  }
  ticks.forEach((t, k) => t.style.top = (k / (N - 1) * 100) + '%');
  $('#hz').style.top = (NG[2].by + 2) + 'px'; $('#hz').style.setProperty('--ox', LX[2] + 'px');
  update(true);
}
function xAt(y) {
  if (y <= KP[0][0]) return KP[0][1];
  for (let i = 1; i < KP.length; i++) if (y <= KP[i][0]) { const a = KP[i - 1], b = KP[i], t = (y - a[0]) / (b[0] - a[0] || 1); return lerp(a[1], b[1], (1 - Math.cos(Math.PI * t)) / 2); }
  return KP[KP.length - 1][1];
}
// VIII: 화면에 고정된 판 위로 내려앉는 곡선 (직선 아님)
function p8pos(e) { const x0 = xAt(S7 + Yv); return { x: lerp(x0, landPt.x, ease(e)), y: lerp(Yv, landPt.y, (e + eo(e)) / 2) }; }

/* ---------- home08 판 ---------- */
function buildPlate() {
  const Hh = 100 * G.ih / G.iw, u = 100 / plate.w, sv = $('#branches');
  sv.setAttribute('viewBox', `0 0 100 ${Hh}`);
  const L = { x: G.land[0] * 100, y: G.land[1] * Hh };
  sv.innerHTML = MEMS.map(m => { const [fx, fy] = G.m[m.id], X = fx * 100, Y = (fy - .004) * Hh;
    const cx = lerp(L.x, X, .5) + (X < L.x ? -3 : 3), cy = lerp(L.y, Y, .15) + 1.5, d = `M${L.x} ${L.y}Q${cx} ${cy} ${X} ${Y}`;
    return `<a href="profile.html?m=${m.id}" aria-label="${m.kr} 프로필"><path class="b" pathLength="1" d="${d}"/><path class="hit" d="${d}"/><circle class="dot" cx="${X}" cy="${Y}" r="${u * 3.5}"/></a>`; }).join('')
    + `<circle class="dot" cx="${L.x}" cy="${L.y}" r="${u * 2.5}"/>`;
  $('#tags').innerHTML = MEMS.map(m => { const [fx, fy, h] = G.m[m.id], w = h * G.ih / G.iw * .36;
    return `<a class="mhot" href="profile.html?m=${m.id}" aria-label="${m.kr} 프로필" style="left:${(fx - w / 2) * 100}%;top:${(fy - h) * 100}%;width:${w * 100}%;height:${h * 100}%"></a>
    <a class="mtag" href="profile.html?m=${m.id}" style="left:${fx * 100}%;top:${fy * 100}%">${m.en.split(' ')[1]}<b>${m.kr} · ${m.cm}</b></a>`; }).join('');
}

/* ---------- 매 프레임 ---------- */
let lastDy = null, ticking = false, lastTone = '';
function update(force) {
  ticking = false;
  const sy = scrollY;
  let cur = 0; for (let k = 0; k < N; k++) if (sy >= starts[k] - 1) cur = k;
  // 장면 마스크 진행도
  const R = Math.hypot(vw, vh) * 1.05, rs = [];
  for (let k = 0; k < N; k++) rs[k] = k ? clamp((sy - starts[k] + .02 * vh) / (.62 * vh)) : 1;
  const shown = rs.reduce((a, r, k) => r > .5 ? k : a, 0);
  // 물방울 위치
  let dx, dy, dd, p8 = clamp((sy - S7) / lens[7]), e8 = 0;
  if (sy < S7) { dd = sy + Yv; dx = xAt(dd); dy = Yv; }
  else { e8 = RM ? 1 : clamp((p8 - .04) / .3); const q = p8pos(e8); dx = q.x; dy = q.y; dd = S7 + Yv + (dy - Yv); }
  const p1 = clamp(sy / lens[0]);
  const s = RM ? 1 : .3 + .7 * eo(clamp(p1 / .1));
  const v = lastDy == null ? 0 : Math.abs(sy - lastDy); lastDy = sy;
  const st = RM ? 0 : Math.min(.4, v / 110);
  let dop = sy > S7 + lens[7] + vh * .2 ? 0 : 1;
  if (cur === 4) dop *= 1 - win(clamp((sy - starts[4]) / lens[4]), .16, .28, .72, .84) * .85; // 금붕어 방울 속으로 들어갔다 나옴
  drop.style.transform = `translate(${dx}px,${dy}px) scale(${s * (1 - st * .3)},${s * (1 + st)})`; drop.style.opacity = dop;
  // 실: 화면 위쪽부터 물방울까지 (문서에 그려진 선이 같이 올라감)
  const pts = [];
  const yEnd = Math.min(sy, S7) + Yv;
  for (let y = Math.max(Yv, Math.min(sy, S7) - 40); y <= yEnd; y += 8) pts.push([xAt(y), y - Math.min(sy, S7)]);
  pts.push([xAt(yEnd), Yv]);
  if (sy >= S7) for (let i = 1; i <= 30; i++) { const q = p8pos(e8 * i / 30); pts.push([q.x, q.y]); }
  pathD.setAttribute('d', pts.length > 1 ? 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') : '');
  pathD.style.opacity = sy >= S7 ? 1 - clamp((p8 - .42) / .16) * .72 : 1;
  // 톤 (헤더·실 색)
  const tone = chs[shown].dataset.tone;
  if (tone !== lastTone) { document.body.dataset.tone = tone; document.documentElement.style.setProperty('--thr', tone === 'dark' ? '#9FD8F5' : '#174BFF'); lastTone = tone; }
  $('#cntN').textContent = '0' + (shown + 1); $('#cntT').textContent = chs[shown].dataset.t;
  // 레일
  const pc = clamp((sy - starts[cur]) / (cur === N - 1 ? lens[cur] * .5 : starts[cur + 1] - starts[cur]));
  $('#railFill').style.height = (clamp((cur + pc) / (N - 1)) * 100) + '%';
  ticks.forEach((t, k) => { t.classList.toggle('on', k === shown); });
  $$('.hd nav a[data-go]').forEach(a => { const g = +a.dataset.go, nx = { 0: 2, 2: 5, 5: 7, 7: 99 }[g]; a.classList.toggle('on', shown >= g && shown < nx); });
  // 물결 고리
  let rk = -1; for (let k = 1; k < N - 1; k++) if (rs[k] > 0 && rs[k] < 1) rk = k;
  rings.forEach((g, i) => {
    let o = 0, sc = 0, x = 0, y = Yv;
    if (rk > 0 && !RM) { const q = clamp((rs[rk] - i * .12) / .7); x = LX[rk]; sc = .1 + eo(q) * (i ? 3.2 : 1.8); o = rs[rk] > i * .12 ? (1 - q) * (i ? .5 : .85) : 0; }
    else if (sy >= S7 && !RM) { const q = clamp((p8 - .34 - i * .05) / .3); x = landPt.x; y = landPt.y; sc = .1 + eo(q) * (i ? 3 : 1.8); o = q > 0 ? (1 - q) * .8 : 0; }
    g.style.transform = `translate(${x}px,${y}px) scale(${sc},${sc})`; g.style.opacity = o;
  });
  // 장면
  chs.forEach((ch, k) => {
    const r = rs[k], covered = k < N - 1 && rs[k + 1] >= 1, vis = r > 0 && !covered;
    ch.classList.toggle('vis', vis); if (!vis && !force) return;
    if (k) { if (RM) { ch.style.opacity = clamp(r * 2.5); ch.style.clipPath = 'none'; } else ch.style.clipPath = r >= 1 ? 'none' : `circle(${ease(r) * R}px at ${k === 7 ? dx : LX[k]}px ${Yv}px)`; }
    const p = k ? clamp((sy - starts[k]) / lens[k]) : p1;
    SC[k] && SC[k](p, r, ch, dx, dy);
  });
}
// 큰 숫자 + 방울 렌즈
function lensNum(ch, k, p, r, dx, dy) {
  const svg = ch.querySelector('.num'); if (!svg || !NG[k]) return;
  const g = NG[k], ty = RM ? 0 : -p * vh * .12, ng = svg.querySelector('.ng');
  ng.setAttribute('transform', `translate(0 ${ty})`);
  if (!NUM[k].lens) return;
  const lx = RM ? g.cx : dx, ly = RM ? g.by - .36 * g.F : dy - ty, rr = g.F * .25 * (RM ? 1 : eo(clamp(r / .5)));
  svg.querySelectorAll('.bm,.bh').forEach(c => { c.setAttribute('cx', lx); c.setAttribute('cy', ly); c.setAttribute('r', rr); });
  svg.querySelector('.mag').setAttribute('transform', `translate(${lx} ${ly}) scale(1.14) translate(${-lx} ${-ly})`);
}
const hl = (ch, p, a = .1, b = .26, c = .8, d = .94) => ch.querySelectorAll('.hl').forEach(l => { l.style.opacity = win(p, a, b, c, d); if (!RM) l.style.transform = `translateY(${(1 - clamp((p - a) / (b - a))) * 16}px)`; });
const SC = [
  (p, r, ch) => { // I 하늘
    T($('#mark'), `translate(-50%,${-scrollY * .35}px)`);
    $('#cue').style.opacity = 1 - clamp(p * 5);
    ch.querySelector('.hl').style.opacity = 1 - clamp((p - .3) / .3);
  },
  (p, r, ch, dx, dy) => { // II 낙하
    if (!RM) T($('#speed'), `translateY(${-p * 90}vh)`);
    lensNum(ch, 1, p, r, dx, dy); hl(ch, p);
  },
  (p, r, ch, dx, dy) => { // III 바다
    $$('#hz i').forEach((l, i) => { l.style.transform = `scaleX(${RM ? 1 : eo(clamp((r - i * .1) / .8))})`; });
    $('#hz').style.opacity = 1 - clamp((p - .7) / .3);
    lensNum(ch, 2, p, r, dx, dy); hl(ch, p);
  },
  (p, r, ch, dx, dy) => { // IV 수면 아래
    if (!RM) bubEls.forEach((b, i) => T(b, `translateY(${-p * 110 * bubs[i].v}vh)`));
    lensNum(ch, 3, p, r, dx, dy); hl(ch, p);
  },
  (p, r, ch) => { // V 금붕어
    const f = fishFrames[Math.round(clamp(p * 1.1) * 30)], im = $('#fishImg'); if (im.src !== f.src) im.src = f.src;
    T($('#sph'), RM ? '' : `translateY(${(.5 - p) * 8}vh) rotate(${lerp(-4, 3, p)}deg)`);
    lensNum(ch, 4, p, r); hl(ch, p, .12, .3, .82, .95);
  },
  (p, r, ch) => { // VI 꽃
    const q = p * 4, act = clamp(Math.floor(q), 0, 3);
    flEls.forEach((f, j) => {
      const tj = q - j, op = clamp((tj + .38) / .3) * (j < 3 ? 1 - clamp((tj - .86) / .26) : 1);
      f.style.opacity = op; f.style.visibility = op > 0 ? '' : 'hidden';
      if (!RM) { T(f.querySelector('.arch'), `translateY(${(.5 - clamp(tj, -.5, 1.5)) * 6}vh)`); T(f.querySelector('.oval'), `translateY(${(.5 - clamp(tj, -.5, 1.5)) * 14}vh)`);
        f.querySelector('.hj').style.translate = `0 ${(.5 - clamp(tj, -.5, 1.5)) * -5}vh`; }
      const seq = f.querySelector('.seq'); if (seq) { const fr = lilyFrames[Math.round(clamp(tj + .3) * 36)]; if (seq.src !== fr.src) seq.src = fr.src; }
    });
    stepEls.forEach((s, j) => s.classList.toggle('on', j === act));
  },
  (p, r, ch, dx, dy) => { // VII 빛
    const cx = vw * .5, cy = Yv, t = RM ? 1 : ease(clamp(p / .55));
    const O = mob ? [[-.4, -.25], [.42, -.2], [-.38, .4], [.4, .45]] : [[-.36, -.3], [.38, -.26], [-.3, .42], [.34, .38]];
    convI.forEach((c, i) => { const [ox, oy] = O[i]; T(c, `translate(${cx + ox * vw * (1 - t)}px,${cy + oy * vh * (1 - t)}px)`); c.style.opacity = 1 - clamp((t - .9) / .1); });
    const cs = RM ? 1 : clamp((p - .3) / .4); T($('#core'), `translate(${cx}px,${cy}px) scale(${.1 + cs * 2.4})`); $('#core').style.opacity = cs;
    $('#whiten').style.opacity = clamp((p - .55) / .45) * .75;
    lensNum(ch, 6, p, r, dx, dy); hl(ch, p, .08, .22, .6, .78);
  },
  (p, r, ch) => { // VIII 사람
    const z = RM ? 1 : 1.08 - .08 * ease(clamp(p / .32)); T($('#plate'), `scale(${z})`);
    const gi = $('#giant'); gi.style.opacity = RM ? 1 : clamp((p - .1) / .2); if (!RM) gi.style.translate = `0 ${(1 - eo(clamp((p - .1) / .3))) * 6}vh`;
    $('#fin').style.opacity = RM ? 1 : clamp((p - .16) / .14); $('#k8').style.opacity = clamp((p - .06) / .14);
    $$('#branches a').forEach((a, j) => { const t = RM ? 1 : clamp((p - .38 - j * .035) / .2), b = a.querySelector('.b');
      b.style.strokeDasharray = '1 1'; b.style.strokeDashoffset = 1 - t; a.querySelector('.dot').style.opacity = clamp((t - .9) / .1); a.style.pointerEvents = t > .9 ? 'auto' : 'none'; });
    $$('#branches > .dot').forEach(d => d.style.opacity = RM ? 1 : clamp((p - .33) / .05));
    $$('.mtag').forEach((m, j) => { const o = RM ? 1 : clamp((p - .56 - j * .03) / .1); m.style.opacity = o; m.style.pointerEvents = o > .5 ? 'auto' : 'none'; });
    $$('.mhot').forEach(m => m.style.pointerEvents = p > .5 ? 'auto' : 'none');
    const e = $('#endcta'), eo2 = RM ? 1 : clamp((p - .7) / .1); e.style.opacity = eo2; e.style.pointerEvents = eo2 > .5 ? 'auto' : 'none';
  }];

/* ---------- 이동 ---------- */
document.addEventListener('click', e => { const a = e.target.closest('[data-go],[data-step]'); if (!a) return; e.preventDefault();
  let y; if (a.dataset.step != null) y = starts[5] + (+a.dataset.step + .5) / 4 * lens[5];
  else { const k = +a.dataset.go; y = k === 0 ? 0 : k === 7 ? starts[7] + lens[7] * .8 : starts[k] + vh * .7; }
  scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }); });
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => update()); } }, { passive: true });
addEventListener('resize', () => { lastDy = null; layout(); });
window.GY_REF = { starts: () => starts, lens: () => lens, vh: () => vh };
if (document.fonts) document.fonts.ready.then(layout);
layout();
})();
