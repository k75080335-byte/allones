/* 결락 v15 · 홈 롱스크롤 엔진
   - 장면(section.hs)마다 길이(data-len, 화면 수)와 모바일 길이(data-mlen)
   - 장면 안 레이어는 data-a 로 스크롤 진행도(0~1)에 따라 움직인다
       예) data-a="y:20vh>-10vh@0-1; o:0>1@0-.2"   (x y s r o b · 단위 vh vw px %)
   - data-slot 은 js/home-assets.js 의 소스 이름. 소스를 바꾸면 화면이 바뀐다
   - 반복 움직임(물결·기포)은 CSS, 진행형 전환(낙하·확대·개화)은 스크롤 */
(() => {
  'use strict';
  const SRC_PH = /[?&]src=ph/.test(location.search);
  const A0 = window.GY_HOME || {}, A = {};
  Object.keys(A0).forEach(k => { A[k] = SRC_PH && A0[k].ph ? A0[k].ph : A0[k]; });
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]still/.test(location.search);
  const PUBLIC = /[?&]public/.test(location.search);
  const mob = () => innerWidth <= 760;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t * t * (3 - 2 * t);
  document.body.classList.toggle('rm', RM);
  document.body.classList.toggle('review', !PUBLIC);

  /* ── 소스 채우기 ── */
  const used = new Map();
  document.querySelectorAll('[data-slot]').forEach(el => {
    const k = el.dataset.slot, s = A[k]; if (!s) return;
    const sec = el.closest('.hs'); if (sec) { if (!used.has(sec)) used.set(sec, new Set()); used.get(sec).add(k); }
    if (s.blend && !el.closest('.fl,.fishwrap')) el.style.mixBlendMode = s.blend;
    if (el.classList.contains('seq')) {
      const fr = s.frames || [s.src];
      if (fr.length > 4) { // 긴 연속 프레임 → 캔버스 (장면이 가까워지면 불러옴)
        const c = document.createElement('canvas'); el.appendChild(c); el._cv = c; el._srcs = fr; el._imgs = null; el._k = 0;
        const poster = new Image(); poster.src = fr[0]; poster.onload = () => drawSeq(el); el._poster = poster;
      } else {
        el._fr = fr.map(src => { const im = new Image(); im.decoding = 'async'; im.src = src; im.alt = ''; el.appendChild(im); return im; });
        el._fr.forEach((im, i) => im.style.opacity = i ? 0 : 1);
      }
    } else if (s.video && !RM) {
      const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; v.poster = s.src || ''; v.src = s.video; v.setAttribute('aria-hidden', 'true');
      v.className = el.className; el.replaceWith(v); v.dataset.a = el.dataset.a || ''; v.dataset.vid = '1';
    } else if (el.tagName === 'IMG') { el.src = s.src; el.alt = el.alt || ''; }
    else el.style.backgroundImage = `url(${s.src})`;
  });
  // 대체 소스 표시 (공개 모드 ?public 에서는 숨김)
  used.forEach((set, sec) => {
    const list = [...set].map(k => A[k]).filter(s => s.status !== 'approved');
    if (!list.length) return;
    const t = document.createElement('div'); t.className = 'ph-tag';
    t.innerHTML = list.map(s => `<span class="${s.status}">${({ placeholder: '대체', interim: '임시', test: '테스트' })[s.status] || s.status} · ${s.note}</span>`).join('');
    (sec.querySelector('.st') || sec).appendChild(t);
  });

  /* ── 애니메이션 해석 ── */
  const parse = str => {
    const P = {};
    (str || '').split(';').map(x => x.trim()).filter(Boolean).forEach(seg => {
      const m = seg.match(/^(\w+):([^>]+)>([^@]+)(?:@([\d.]+)-([\d.]+))?$/); if (!m) return;
      const u = v => { const n = parseFloat(v); const unit = v.replace(/^[-\d.]+/, ''); return [n, unit]; };
      (P[m[1]] = P[m[1]] || []).push({ f: u(m[2]), t: u(m[3]), a: m[4] ? +m[4] : 0, b: m[5] ? +m[5] : 1 });
    });
    Object.values(P).forEach(l => l.sort((x, y) => x.a - y.a));
    return P;
  };
  const val = (list, p) => {
    let s = list[0];
    if (p <= list[0].a) return list[0].f;
    for (const q of list) { if (p >= q.a) s = q; }
    const k = s.b > s.a ? ease(clamp((p - s.a) / (s.b - s.a), 0, 1)) : 1;
    return [s.f[0] + (s.t[0] - s.f[0]) * k, s.t[1] || s.f[1]];
  };
  const px = ([n, u]) => u === 'vh' ? n * innerHeight / 100 : u === 'vw' ? n * innerWidth / 100 : u === '%' ? n + '%' : n;
  const secs = [...document.querySelectorAll('.hs')].map(el => ({
    el, st: el.querySelector('.st'),
    layers: [...el.querySelectorAll('[data-a]')].map(l => ({ l, P: parse(l.dataset.a), seq: l.classList.contains('seq') ? l : null, sr: (l.dataset.seq || '0-1').split('-').map(Number) })),
    seqs: [...el.querySelectorAll('.seq:not([data-a])')].map(l => ({ l, sr: (l.dataset.seq || '0-1').split('-').map(Number) })),
    vids: [...el.querySelectorAll('video[data-vid]')],
  }));

  function size() {
    secs.forEach(S => {
      const L = parseFloat(mob() ? (S.el.dataset.mlen || S.el.dataset.len) : S.el.dataset.len) || 1;
      S.el.style.height = RM ? 'auto' : (L * 100) + 'svh';
      if (!CSS.supports('height', '1svh')) S.el.style.height = RM ? 'auto' : (L * innerHeight) + 'px';
    });
  }
  function loadSeq(l) { if (l._imgs || !l._srcs) return; l._imgs = l._srcs.map((src, i) => { const im = new Image(); im.decoding = 'async'; im.src = src; im.onload = () => { if (Math.abs(i - l._k) < 1.5) drawSeq(l); }; return im; }); }
  function drawSeq(l) {
    const c = l._cv, W = l.clientWidth, H = l.clientHeight; if (!W || !H) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height);
    const n = l._srcs.length, k = clamp(l._k, 0, n - 1), i0 = Math.floor(k), f = k - i0;
    const get = i => (l._imgs && l._imgs[i] && l._imgs[i].complete && l._imgs[i].naturalWidth) ? l._imgs[i] : (i === 0 && l._poster.complete ? l._poster : null);
    let a = get(i0); if (!a) { for (let j = i0; j >= 0 && !a; j--) a = get(j); } if (!a) return;
    const b = f > .02 ? get(Math.min(n - 1, i0 + 1)) : null;
    const sc = Math.min(c.width / a.naturalWidth, c.height / a.naturalHeight), w = a.naturalWidth * sc, h = a.naturalHeight * sc, ox = (c.width - w) / 2, oy = (c.height - h) / 2;
    x.globalAlpha = 1; x.drawImage(a, ox, oy, w, h);
    if (b) { x.globalAlpha = f; x.drawImage(b, ox, oy, w, h); x.globalAlpha = 1; }
  }
  function setSeq(l, sr, p) {
    if (l._cv) { const k = clamp((p - sr[0]) / ((sr[1] - sr[0]) || 1), 0, 1) * (l._srcs.length - 1); if (Math.abs(k - l._k) > .01 || !l._drawn) { l._k = k; drawSeq(l); l._drawn = 1; } return; }
    if (!l._fr) return;
    const k = clamp((p - sr[0]) / ((sr[1] - sr[0]) || 1), 0, 1) * (l._fr.length - 1);
    l._fr.forEach((im, i) => im.style.opacity = clamp(1 - Math.abs(k - i), 0, 1));
  }
  function apply(S, p) {
    S.el.style.setProperty('--p', p.toFixed(4));
    S.layers.forEach(({ l, P, seq, sr }) => {
      const g = k => P[k] ? val(P[k], p) : null;
      const x = g('x'), y = g('y'), s = g('s'), r = g('r'), o = g('o'), b = g('b');
      const tr = [];
      if (x || y) tr.push(`translate3d(${x ? (typeof px(x) === 'string' ? px(x) : px(x) + 'px') : 0},${y ? (typeof px(y) === 'string' ? px(y) : px(y) + 'px') : 0},0)`);
      if (s) tr.push(`scale(${s[0]})`);
      if (r) tr.push(`rotate(${r[0]}deg)`);
      if (tr.length) l.style.transform = tr.join(' ');
      if (o) { l.style.opacity = o[0]; l.style.visibility = o[0] < .005 ? 'hidden' : 'visible'; }
      if (b) l.style.filter = `blur(${b[0]}px)`;
      if (seq) setSeq(l, sr, p);
    });
    S.seqs.forEach(({ l, sr }) => setSeq(l, sr, p));
  }
  function prog(S) {
    if (RM) return parseFloat(S.el.dataset.rm || .5);
    const r = S.el.getBoundingClientRect(), span = S.el.offsetHeight - innerHeight;
    return span > 1 ? clamp(-r.top / span, 0, 1) : clamp((innerHeight - r.top) / (innerHeight + S.el.offsetHeight), 0, 1);
  }
  let raf = 0;
  function frame() {
    raf = 0;
    const FADE = .55; // 다음 장면이 화면 아래에서 0.55화면 올라오는 동안 겹쳐서 녹아든다
    secs.forEach((S, i) => {
      const r = S.el.getBoundingClientRect();
      const near = r.bottom > -innerHeight * .5 && r.top < innerHeight * 1.5;
      if (!RM && S.st && !S.el.classList.contains('end')) {
        const a = r.top / innerHeight, b = r.bottom / innerHeight;
        const op = i === 0 ? (b > 0 ? 1 : 0) : clamp((1 - a) / FADE, 0, 1) * (b > 0 ? 1 : 0);
        const on = op > 0 && b > 1 - FADE - .05 || (op > 0 && i === secs.length - 2);
        S.st.style.opacity = op; S.st.classList.toggle('on', op > 0 && b > -0.05);
        S.st.style.setProperty('--z', i + 1);
      }
      S.el.classList.toggle('near', near);
      if (near || RM) { S.el.querySelectorAll('.seq').forEach(l => l._cv && loadSeq(l)); apply(S, prog(S)); }
      S.vids.forEach(v => { if (near && v.paused) v.play().catch(() => {}); else if (!near && !v.paused) v.pause(); });
    });
    const cur = secs.findIndex(S => { const r = S.el.getBoundingClientRect(); return r.top <= innerHeight * .5 && r.bottom > innerHeight * .5; });
    document.body.dataset.scene = cur;
    skip && skip.classList.toggle('hide', cur < 0 || cur >= secs.length - 1);
  }
  const req = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { size(); document.querySelectorAll('.seq').forEach(l => { if (l._cv) { l._drawn = 0; } }); req(); });

  /* ── 건너뛰기 · 타이틀 듣기 ── */
  const skip = document.getElementById('skip');
  if (skip) skip.onclick = () => document.getElementById('h8').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  document.querySelectorAll('[data-title-play]').forEach(b => b.onclick = () => {
    if (!window.GYP) return; const i = GYP.tracks.findIndex(t => t.title); if (i >= 0) GYP.play(i);
  });

  /* ── 01 결: 커서·터치 근처가 눌리듯 일그러졌다 돌아옴 + 은빛 반사광 ── */
  const h1 = document.getElementById('h1'), warp = document.getElementById('warpMap'), glow = h1 && h1.querySelector('.glint');
  let wv = 0, lx = 0, ly = 0;
  if (h1 && !RM) {
    h1.addEventListener('pointermove', e => {
      const m = h1.querySelector('.markwrap').getBoundingClientRect();
      const cx = m.left + m.width / 2, cy = m.top + m.height / 2, d = Math.hypot(e.clientX - cx, e.clientY - cy) / Math.max(m.width, 1);
      const sp = Math.hypot(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY;
      if (d < .9) wv = Math.min(38, wv + sp * .5 * (1 - d));
      if (glow) { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; glow.style.opacity = d < 1.2 ? .9 : .35; }
    }, { passive: true });
    (function decay() { wv *= .9; if (warp) warp.setAttribute('scale', wv.toFixed(1)); requestAnimationFrame(decay); })();
  }

  size(); frame();
})();
