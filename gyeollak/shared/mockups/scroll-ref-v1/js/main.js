/* 결락 · scroll reference v1 — 물방울 + 1px 실 + 장면 마스크
   모든 움직임은 스크롤 위치로만 정해진다 (시간 애니메이션 없음) → 되감기·스크린샷이 항상 같은 그림. */
(() => {
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]rm=1/.test(location.search);
const $ = s => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo = t => 1 - Math.pow(1 - t, 3);
const win = (p, a, b, c, d) => clamp((p - a) / (b - a)) * (1 - clamp((p - c) / (d - c)));
const V15 = '../../../v15/';
const secs = [...document.querySelectorAll('#track section')];
const scenes = [...document.querySelectorAll('.scene')];
const N = secs.length, ROM = ['I','II','III','IV','V','VI','VII','VIII'];
const FL = [
  { k: 'hydrangea', f: '수국', fk: '水菊', who: '하진우', id: 'jinwoo', ph: '대체' },
  { k: 'camellia', f: '동백', fk: '冬柏', who: '채유성', id: 'yuseong', ph: '대체' },
  { k: 'trumpet', f: '능소화', fk: '凌霄', who: '채류현', id: 'ryuhyeon', ph: '대체' },
  { k: 'lily', f: '백합', fk: '百合', who: '문태준', id: 'taejun', ph: '그록 테스트', seq: 37 }];
// home08 layout (compose.py 와 같은 발 위치)
const H8 = {
  '16x9': { iw: 1280, ih: 720, land: [.425, .94], fs: .074, ty: .36,
    m: { ryuhyeon: [.305, .86, .44 * 188 / 195], yuseong: [.415, .655, .38 * 190 / 195], jinwoo: [.545, .835, .44 * 189 / 195], taejun: [.655, .625, .38 * 195 / 195] } },
  '9x16': { iw: 720, ih: 1280, land: [.44, .865], fs: .13, ty: .47,
    m: { ryuhyeon: [.30, .78, .32 * 188 / 195], yuseong: [.41, .62, .28 * 190 / 195], jinwoo: [.56, .76, .32 * 189 / 195], taejun: [.66, .595, .28 * 195 / 195] } } };
const MEMS = [['ryuhyeon', '채류현', 188, 'VOCAL'], ['yuseong', '채유성', 190, 'GUITAR · VOCAL'], ['jinwoo', '하진우', 189, 'POSITION TBD'], ['taejun', '문태준', 195, 'LEADER · DRUM']];

/* ---------- build DOM bits ---------- */
// rings + chapter labels in every scene but I
scenes.forEach((sc, k) => { if (!k) return;
  sc.insertAdjacentHTML('beforeend', `<i class="ring r1"></i><i class="ring r2"></i><span class="chl">${sc.dataset.ch}</span>`); });
$('#c8').insertAdjacentHTML('beforeend', '<i class="ring r3"></i>');
// speed lines + bubbles (fixed pseudo-random so screenshots match)
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
$('#speed').innerHTML = Array.from({ length: 18 }, () => `<i style="left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 150).toFixed(1)}vh;opacity:${(.3 + rnd() * .7).toFixed(2)}"></i>`).join('');
const bubs = Array.from({ length: 16 }, () => ({ x: rnd() * 100, y: 40 + rnd() * 80, s: 6 + rnd() * 26, v: .4 + rnd() * 1.2 }));
$('#bub').innerHTML = bubs.map(b => `<i style="left:${b.x}%;top:${b.y}vh;width:${b.s}px;height:${b.s}px"></i>`).join('');
const bubEls = [...document.querySelectorAll('#bub i')];
// flowers
$('#flowers').innerHTML = FL.map((f, j) => `<figure class="fl" data-j="${j}"><span class="num">0${j + 1}</span><div class="pic">${f.seq
  ? `<img class="seq" src="assets/lily/000.webp" alt="${f.f}">`
  : `<img class="bud" src="assets/flowers/${f.k}_bud.webp" alt=""><img class="open" src="assets/flowers/${f.k}_open.webp" alt="${f.f}">`}</div>
  <figcaption><b>${f.f} <small style="font:400 12px var(--kr);color:var(--sub)">${f.fk}</small></b><span>0${j + 1} · ${f.who.toUpperCase ? f.who : ''} <em class="ph${f.seq ? ' test' : ''}" style="font-style:normal">${f.ph}</em></span></figcaption></figure>`).join('');
const flEls = [...document.querySelectorAll('.fl')];
const lilyFrames = Array.from({ length: 37 }, (_, i) => { const im = new Image(); im.src = `assets/lily/${String(i).padStart(3, '0')}.webp`; return im; });
const fishFrames = Array.from({ length: 31 }, (_, i) => { const im = new Image(); im.src = `${V15}img/home/test/drop/${String(i).padStart(3, '0')}.webp`; return im; });
// rail ticks
const rail = $('#rail');
secs.forEach((s, k) => rail.insertAdjacentHTML('beforeend', `<a href="#${s.id}" data-go="${k}"><span>${scenes[k].dataset.ch}</span>${ROM[k]}</a>`));
const ticks = [...rail.querySelectorAll('a')];

/* ---------- layout ---------- */
let vw, vh, Yv, Xtip, starts = [], lens = [], KP = [], P = [], CUM = [], TOT = 0, STEP = 10, endDoc, railEnd;
let FX = [], LX = [], asp, G, plate = {}, landPt, mob;
const pathA = $('#pA'), pathD = $('#pD'), thread = $('#thread'), drop = $('#drop');
function layout() {
  vw = innerWidth; vh = innerHeight; mob = vw < 720; Yv = vh * (mob ? .4 : .42);
  secs.forEach(s => s.style.height = (parseFloat(s.dataset.len) * vh) + 'px');
  starts = secs.map(s => s.offsetTop); lens = secs.map(s => s.offsetHeight); lens[N - 1] -= vh; // 마지막 장면은 화면 한 장만큼 머문 뒤 끝난다
  // mark: ㅣ 끝(0.809, 0.605)이 물방울 자리
  const mw = Math.min(vw * (mob ? .56 : .3), vh * .34, 340), mh = mw * 1.2222, mk = $('#mark');
  mk.style.setProperty('--mw', mw + 'px'); mk.style.top = (Yv - .605 * mh) + 'px';
  Xtip = vw / 2 - mw / 2 + .809 * mw;
  FX = (mob ? [.38, .62, .4, .6] : [.33, .63, .37, .6]).map(f => f * vw);
  LX = [Xtip, .52 * vw, .44 * vw, .58 * vw, .4 * vw, FX[0], .56 * vw, .5 * vw];
  // home08 plate (cover)
  asp = vw / vh < 1 ? '9x16' : '16x9'; G = H8[asp];
  const sc = Math.max(vw / G.iw, vh / G.ih); plate = { w: G.iw * sc, h: G.ih * sc }; plate.x = (vw - plate.w) / 2; plate.y = (vh - plate.h) / 2;
  const pl = $('#plate'); Object.assign(pl.style, { left: plate.x + 'px', top: plate.y + 'px', width: plate.w + 'px', height: plate.h + 'px' });
  if (!$('#plBg').src.includes(asp)) { $('#plBg').src = `assets/home08/bg_${asp}.webp`; $('#plMem').src = `assets/home08/members_${asp}.webp`; }
  landPt = { x: plate.x + G.land[0] * plate.w, y: plate.y + G.land[1] * plate.h };
  buildPlate();
  // key points (docY, x)
  KP = [[Yv, Xtip, 0], [starts[0] + lens[0] * .55 + Yv, lerp(Xtip, vw * .5, .6), 0]];
  const sway = [0, .07, -.06, .06, -.05, 0, -.06, 0];
  for (let k = 1; k < N; k++) {
    KP.push([starts[k] + Yv, LX[k], 0]);
    if (k === 5) { for (let q = 0; q < 4; q++) KP.push([starts[5] + (q + .5) / 4 * lens[5] + Yv, FX[q], 0]); }
    else if (k < 7) KP.push([starts[k] + lens[k] * .55 + Yv, LX[k] + sway[k] * vw, 0]);
  }
  for (let i = 1; i <= 60; i++) { const p = i / 60; KP.push([starts[7] + p * lens[7] + yv8(p), x8(p), 1]); }
  endDoc = KP[KP.length - 1][0];
  // sampled polyline
  P = []; CUM = []; TOT = 0; let px, py;
  for (let y = Yv; y <= endDoc + .1; y += STEP) { const x = xAt(y); if (P.length) TOT += Math.hypot(x - px, y - py); P.push(x.toFixed(1) + ' ' + y.toFixed(1)); CUM.push(TOT); px = x; py = y; }
  const d = 'M' + P.join('L');
  const docH = document.documentElement.scrollHeight;
  thread.setAttribute('height', docH); thread.style.height = docH + 'px'; thread.setAttribute('viewBox', `0 0 ${vw} ${docH}`);
  pathA.setAttribute('d', d); pathD.setAttribute('d', d); pathD.style.strokeDasharray = TOT + ' ' + (TOT + 10);
  railEnd = starts[7] + lens[7] * .45;
  ticks.forEach((t, k) => t.style.top = (clamp(starts[k] / railEnd) * 100) + '%');
  // ring / label anchors
  scenes.forEach((sc, k) => { if (!k) return;
    sc.querySelectorAll('.r1,.r2').forEach(r => { r.style.left = LX[k] + 'px'; r.style.top = Yv + 'px'; });
    const l = sc.querySelector('.chl'); l.style.left = (LX[k] + 16) + 'px'; l.style.top = (Yv - 5) + 'px'; });
  const r3 = $('#c8 .r3'); r3.style.left = landPt.x + 'px'; r3.style.top = landPt.y + 'px';
  const fsz = Math.min(vh * .46, 460, vw * (mob ? .62 : .46));
  flEls.forEach((f, j) => { f.style.left = FX[j] + 'px'; f.style.top = (Yv + fsz * .3) + 'px'; });
  $('#hz').style.top = Yv + 'px';
  update(true);
}
function yv8(p) { return lerp(Yv, landPt.y, ease(clamp((p - .06) / .3))); }
function x8(p) { return lerp(LX[7], landPt.x, ease(clamp((p - .06) / .3))); }
function xAt(y) {
  if (y <= KP[0][0]) return KP[0][1];
  for (let i = 1; i < KP.length; i++) if (y <= KP[i][0]) {
    const a = KP[i - 1], b = KP[i], t = (y - a[0]) / (b[0] - a[0] || 1);
    return b[2] ? lerp(a[1], b[1], t) : lerp(a[1], b[1], (1 - Math.cos(Math.PI * t)) / 2);
  }
  return KP[KP.length - 1][1];
}
function dropDoc(sy) { return sy >= starts[7] ? starts[7] + Math.min(sy - starts[7], lens[7]) + yv8(clamp((sy - starts[7]) / lens[7])) : sy + Yv; }
function cumAt(y) { const f = (y - Yv) / STEP, i = Math.floor(f); if (i < 0) return 0; if (i >= CUM.length - 1) return TOT; return lerp(CUM[i], CUM[i + 1], f - i); }

/* ---------- home08 plate ---------- */
function buildPlate() {
  const Hh = 100 * G.ih / G.iw, u = 100 / plate.w, sv = $('#branches');
  sv.setAttribute('viewBox', `0 0 100 ${Hh}`);
  const L = { x: G.land[0] * 100, y: G.land[1] * Hh };
  sv.innerHTML = MEMS.map(([id, kr], j) => { const [fx, fy] = G.m[id], X = fx * 100, Y = (fy - .004) * Hh;
    const cx = lerp(L.x, X, .5) + (X < L.x ? -3 : 3), cy = lerp(L.y, Y, .15) + 1.5;
    const d = `M${L.x} ${L.y}Q${cx} ${cy} ${X} ${Y}`;
    return `<a href="profile.html?m=${id}" aria-label="${kr} 프로필"><path class="b" pathLength="1" d="${d}" style="stroke-width:${u}"/><path class="hit" d="${d}" style="stroke-width:${u * 26}"/><circle class="dot" cx="${X}" cy="${Y}" r="${u * 3.5}" style="stroke-width:${u}"/></a>`; }).join('')
    + `<circle class="dot" cx="${L.x}" cy="${L.y}" r="${u * 2.5}" style="stroke-width:${u}"/>`;
  $('#tags').innerHTML = MEMS.map(([id, kr, cm, role]) => { const [fx, fy, h] = G.m[id], w = h * G.ih / G.iw * .36;
    return `<a class="mhot" href="profile.html?m=${id}" aria-label="${kr} 프로필" style="left:${(fx - w / 2) * 100}%;top:${(fy - h) * 100}%;width:${w * 100}%;height:${h * 100}%"></a>
    <a class="mtag" href="profile.html?m=${id}" style="left:${fx * 100}%;top:${fy * 100}%">${role}<b>${kr} · ${cm}</b></a>`; }).join('');
  const fs = plate.w * G.fs * (mob ? .9 : 1);
  document.querySelectorAll('.final').forEach(f => { f.style.setProperty('--fs', fs + 'px'); f.style.top = (G.ty * 100) + '%'; });
  $('#fin2').style.top = (G.ty * 100 + (mob ? 9 : 12)) + '%';
}

/* ---------- per-frame ---------- */
let lastDy = null, ticking = false;
function update(force) {
  ticking = false;
  const sy = scrollY;
  // chapter
  let cur = 0; for (let k = 0; k < N; k++) if (sy >= starts[k] - 1) cur = k;
  // droplet + thread
  const dd = dropDoc(sy), dx = xAt(dd), dy = dd - sy;
  const p1 = clamp(sy / lens[0]);
  let s = RM ? 1 : .3 + .7 * eo(clamp(p1 / .1));
  const v = lastDy == null ? 0 : Math.abs(dd - lastDy); lastDy = dd;
  const st = RM ? 0 : Math.min(.45, v / 90);
  drop.style.transform = `translate(${dx}px,${dy}px) scale(${s * (1 - st * .3)},${s * (1 + st)})`;
  drop.style.opacity = sy > starts[7] + lens[7] + vh * .2 ? 0 : 1;
  pathD.style.strokeDashoffset = TOT - cumAt(dd);
  // rail
  $('#railFill').style.height = (clamp(sy / railEnd) * 100) + '%';
  ticks.forEach((t, k) => { t.classList.toggle('on', k === cur); t.classList.toggle('done', k < cur); });
  document.querySelectorAll('.hd nav a[data-go]').forEach(a => { const g = +a.dataset.go, nx = { 0: 2, 2: 5, 5: 7, 7: 99 }[g]; a.classList.toggle('on', cur >= g && cur < nx); });
  // scenes
  const R = Math.hypot(vw, vh) * 1.05, rs = [];
  for (let k = 0; k < N; k++) rs[k] = k ? clamp((sy - starts[k] + .02 * vh) / (.62 * vh)) : 1;
  scenes.forEach((sc, k) => {
    const r = rs[k], covered = k < N - 1 && rs[k + 1] >= 1, vis = r > 0 && !covered;
    sc.classList.toggle('vis', vis); if (!vis && !force) return;
    if (k) {
      if (RM) { sc.style.opacity = clamp(r * 2.5); sc.style.clipPath = 'none'; }
      else sc.style.clipPath = r >= 1 ? 'none' : `circle(${ease(r) * R}px at ${LX[k]}px ${Yv}px)`;
      const p = clamp((sy - starts[k]) / lens[k]);
      const r1 = sc.querySelector('.r1'), r2 = sc.querySelector('.r2');
      if (RM) { r1.style.opacity = r2.style.opacity = 0; }
      else {
        r1.style.transform = `scale(${.05 + eo(clamp(r / .7)) * 1.6})`; r1.style.opacity = r > 0 ? (1 - clamp(r / .7)) * .9 : 0;
        const q = clamp((r - .12) / .7); r2.style.transform = `scale(${.05 + eo(q) * 3})`; r2.style.opacity = r > .12 ? (1 - q) * .55 : 0;
      }
      const lim = k === 5 ? .1 : k === 7 ? .16 : .45;
      sc.querySelector('.chl').style.opacity = clamp((r - .06) / .2) * (1 - clamp((p - lim) / .1));
      SC[k] && SC[k](p, r, sc);
    } else SC[0](p1, 1, sc);
  });
  if (force) { /* keep */ }
}
const T = (el, v) => { if (el) el.style.transform = v; };
const lines = (sc, p, a = .12, b = .3, c = .78, d = .92) => sc.querySelectorAll('.line').forEach(l => { l.style.opacity = win(p, a, b, c, d); if (!RM) l.style.transform = `translateY(${(1 - clamp((p - a) / (b - a))) * 14}px)`; });
const SC = [
  (p, r, sc) => { // I
    T(sc.querySelector('.bg'), RM ? '' : `translateY(${-p * 5}vh) scale(${1.1 - .1 * p})`);
    T($('#mark'), `translate(-50%,${-scrollY}px)`);
    $('#cue').style.opacity = 1 - clamp(p * 5);
    sc.querySelector('.k').style.opacity = 1 - clamp(p * 3);
  },
  (p, r, sc) => { // II
    if (!RM) { T(sc.querySelector('.bg'), `translateY(${-p * 12}vh) scale(1.25)`); T($('#speed'), `translateY(${-p * 90}vh)`); T(sc.querySelector('.glyph'), `translateY(${-p * 26}vh)`); }
    lines(sc, p);
  },
  (p, r, sc) => { // III
    if (!RM) T(sc.querySelector('.bg'), `scale(${1.12 - .1 * p})`);
    T($('#hz'), `scaleX(${RM ? 1 : eo(clamp(r / .8))})`); $('#hz').style.opacity = 1 - clamp((p - .5) / .3);
    lines(sc, p);
  },
  (p, r, sc) => { // IV
    if (!RM) { T(sc.querySelector('.bg'), `translateY(${(.5 - p) * 10}vh) scale(1.1)`); bubEls.forEach((b, i) => T(b, `translateY(${-p * 110 * bubs[i].v}vh)`)); }
    lines(sc, p);
  },
  (p, r, sc) => { // V
    const f = fishFrames[Math.round(clamp(p * 1.15) * 30)], im = $('#fishImg'); if (im.src !== f.src) im.src = f.src;
    const fw = $('#fish').offsetWidth;
    const x = RM ? .6 * vw : lerp(.66, .5, p) * vw, y = RM ? .5 * vh : lerp(.62, .34, p) * vh;
    T($('#fish'), `translate(${x - fw / 2}px,${y - fw * .6}px) rotate(${RM ? 0 : lerp(-6, 4, p)}deg)`);
    lines(sc, p);
  },
  (p, r, sc) => { // VI flowers
    const q = p * 4, act = clamp(Math.floor(q), 0, 3);
    flEls.forEach((f, j) => {
      const tj = q - j;
      const op = clamp((tj + .38) / .3) * (j < 3 ? 1 - clamp((tj - .86) / .26) : 1);
      f.style.opacity = op;
      const ty = RM ? 0 : (.5 - clamp(tj, -.5, 1.5)) * 12;
      f.style.transform = `translateY(${ty}vh) scale(${RM ? 1 : .9 + .1 * eo(clamp(tj + .3))})`;
      T(f.querySelector('.num'), `translate(-50%,-50%) translate(${RM ? 0 : (j % 2 ? -1 : 1) * (.5 - tj) * 6}vw,${RM ? 0 : (.5 - tj) * 30}vh)`);
      const bloom = RM ? 1 : clamp(tj * 1.4 + .15);
      const seq = f.querySelector('.seq');
      if (seq) { const fr = lilyFrames[Math.round(bloom * 36)]; if (seq.src !== fr.src) seq.src = fr.src; }
      else { f.querySelector('.bud').style.opacity = 1 - bloom; f.querySelector('.open').style.opacity = bloom; }
      f.querySelector('figcaption').style.opacity = clamp((tj - .05) / .2);
    });
    sc.querySelectorAll('.dots4 i').forEach((d, j) => d.classList.toggle('on', j === act));
    $('#dotsTxt').textContent = `0${act + 1} / 04 · ${FL[act].who}`;
  },
  (p, r, sc) => { // VII
    const P3 = [[-30, 10, 30, -40, .6, 2.6, -20, 40], [30, -20, 40, -30, .4, 2.2, 30, -50], [0, 6, 50, -50, .3, 1.6, 0, 30]];
    ['#pt1', '#pt2', '#pt3'].forEach((s, i) => { const a = P3[i], t = RM ? .5 : p;
      T($(s), `translate(calc(50vw - 50% + ${lerp(a[0], a[1], t)}vw), calc(50vh - 50% + ${lerp(a[2], a[3], t)}vh)) scale(${lerp(a[4], a[5], t)}) rotate(${lerp(a[6], a[7], t)}deg)`);
      $(s).style.opacity = win(t, 0, .15, .6, .9) * .85; });
    $('#whiten').style.opacity = clamp((p - .45) / .55) * .8;
    lines(sc, p, .1, .25, .55, .75);
  },
  (p, r, sc) => { // VIII
    const z = RM ? 1 : 1.08 - .08 * ease(clamp(p / .32));
    T($('#plate'), `scale(${z})`);
    const f1 = $('#fin1'), f2 = $('#fin2'), w1 = f1.offsetWidth;
    if (RM) { f1.style.transform = `translateX(${-plate.x + vw * .05}px)`; f1.style.fontSize = Math.min(vw * .9 / 17, 90) + 'px'; f2.style.display = 'none'; }
    else {
      const t = clamp((p - .1) / .9);
      T(f1, `translateX(${lerp(-plate.x + vw * .7, -plate.x + vw * .25 - w1 * .75, t)}px)`);
      T(f2, `translateX(${lerp(-plate.x - w1 * .55, -plate.x + vw * .1, t)}px)`); f2.style.opacity = .6 * win(p, .15, .3, .9, 1.01);
    }
    f1.style.opacity = clamp((p - .08) / .12);
    const r3 = sc.querySelector('.r3'), q = clamp((p - .34) / .3);
    r3.style.transform = `scale(${.05 + eo(q) * 1.4}, ${(.05 + eo(q) * 1.4) * .32})`; r3.style.opacity = RM ? 0 : (q > 0 ? (1 - q) * .9 : 0);
    document.querySelectorAll('#branches a').forEach((a, j) => { const t = RM ? (p > .36 ? 1 : 0) : clamp((p - .38 - j * .035) / .2);
      a.querySelector('.b').style.strokeDasharray = '1 1'; a.querySelector('.b').style.strokeDashoffset = 1 - t;
      a.querySelector('.dot').style.opacity = clamp((t - .9) / .1); a.style.pointerEvents = t > .9 ? 'auto' : 'none'; });
    document.querySelectorAll('.mtag').forEach((m, j) => { const o = clamp((p - .56 - j * .03) / .1); m.style.opacity = o; m.style.pointerEvents = o > .5 ? 'auto' : 'none'; });
    document.querySelectorAll('.mhot').forEach(m => m.style.pointerEvents = p > .5 ? 'auto' : 'none');
    const e = $('#endcta'); e.style.opacity = clamp((p - .7) / .1); e.style.pointerEvents = p > .7 ? 'auto' : 'none';
  }];

/* ---------- nav ---------- */
document.addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (!a) return; e.preventDefault();
  const k = +a.dataset.go, y = k === 0 ? 0 : k === 7 ? starts[7] + lens[7] * .62 : starts[k] + vh * .7;
  scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }); });
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => update()); } }, { passive: true });
addEventListener('resize', () => { lastDy = null; layout(); });
window.GY_REF = { starts: () => starts, lens: () => lens, vh: () => vh };
if (document.fonts) document.fonts.ready.then(layout);
layout();
})();
