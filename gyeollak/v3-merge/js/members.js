/* 결락 v3 — MEMBERS: 움직이는 카드 → 개인 프로필 → 360 밴드룸 / 옷장 / 걷기 실험실.
   영상은 한 번에 하나(GYK.claim). 360과 걷기는 같은 WebGL 캔버스 하나를 옮겨 가며 쓴다. */
(function(){
'use strict';
const G = window.GYK, M = window.GYK_MEMBERS, reduce = G.reduce;
const $ = id => document.getElementById(id), qa = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hoverable = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── 카드: PC는 올리면 움직이고 누르면 프로필. 폰은 첫 탭에 움직이고 두 번째 탭에 프로필 ── */
let liveCard = null;
function goLive(c){
  if (reduce || c === liveCard) return;
  if (liveCard){ liveCard.classList.remove('live'); const ov = liveCard.querySelector('video'); ov.pause(); G.release(ov); }
  liveCard = c; if (!c) return;
  const v = c.querySelector('video'); if (!v.src) v.src = v.dataset.src;
  v.__onStop = () => { c.classList.remove('live'); if (liveCard === c) liveCard = null; };
  G.claim(v); v.play().then(() => c.classList.add('live')).catch(() => {});
}
qa('.card').forEach(c => {
  c.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') goLive(c); });
  c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && liveCard === c) goLive(null); });
  c.addEventListener('focus', () => { if (hoverable) goLive(c); });
  c.addEventListener('blur', () => { if (liveCard === c) goLive(null); });
  c.addEventListener('click', e => { if (!hoverable && !reduce && liveCard !== c){ e.preventDefault(); goLive(c); } });
});
/* 카드가 화면에서 사라지면 멈춤 */
new IntersectionObserver(es => { if (!es[0].isIntersecting && liveCard) goLive(null); }).observe($('cards'));

/* ── 옷장: 멤버 탭 + 룩 썸네일. 같은 바닥선, 키 비율대로 ── */
let fitM = 0, fitL = 0;
const fitImg = $('fitImg'), fitStage = $('fitStage');
$('fitTabs').innerHTML = M.map((m, i) => `<button role="tab" data-m="${i}" aria-selected="${i === 0}">${m.kr}<small class="vh"> 옷장</small></button>`).join('');
function setFit(mi, li, anim){
  fitM = mi; fitL = li; const m = M[mi], l = m.looks[li];
  qa('#fitTabs button').forEach((b, k) => b.setAttribute('aria-selected', k === mi));
  $('fitName').textContent = m.kr.slice(1) + '의 옷장';
  $('ward').innerHTML = m.looks.map((x, k) => `<button role="tab" data-l="${k}" aria-selected="${k === li}" aria-label="Look 0${k + 1} ${x[1]}"><img src="img/outfits/${m.id}_${x[0]}.webp" alt="" loading="lazy" decoding="async"><small class="mono">0${k + 1}</small></button>`).join('');
  $('lookCount').innerHTML = `0${li + 1}<small> / 0${m.looks.length}</small>`;
  $('lookTitle').textContent = l[1]; $('lookDesc').textContent = l[2];
  $('lookItems').innerHTML = l[3] ? l[3].map((t, k) => `<li><b>0${k + 1}</b>${t}</li>`).join('') : '';
  fitImg.src = `img/outfits/${m.id}_${l[0]}.webp`; fitImg.alt = `${m.kr} — ${l[1]}`;
  fitImg.style.height = (m.h / 195 * 100) + '%';
  if (anim && !reduce){ fitImg.classList.remove('swap'); fitStage.classList.remove('swapping'); void fitImg.offsetWidth; fitImg.classList.add('swap'); fitStage.classList.add('swapping'); }
}
$('fitTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setFit(+b.dataset.m, 0, true); });
$('ward').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setFit(fitM, +b.dataset.l, true); });
qa('[data-fit]').forEach(a => a.addEventListener('click', () => setFit(M.findIndex(m => m.id === a.dataset.fit), 0, false)));
setFit(0, 0, false);

/* ── 쌓인 영상(위=색, 아래=알파)을 합치는 WebGL. 캔버스는 하나만 만들고 옮겨 쓴다 ── */
const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
function stackGL(c){ const g = c.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }); if (!g) return null;
  const sh = (t, src) => { const o = g.createShader(t); g.shaderSource(o, src); g.compileShader(o); return o; }, pr = g.createProgram();
  g.attachShader(pr, sh(g.VERTEX_SHADER, 'attribute vec2 p;varying vec2 u;void main(){u=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'));
  g.attachShader(pr, sh(g.FRAGMENT_SHADER, 'precision mediump float;uniform sampler2D t;varying vec2 u;void main(){float a=texture2D(t,vec2(u.x,.5+u.y*.5)).r;vec3 c=min(texture2D(t,vec2(u.x,u.y*.5)).rgb,vec3(a));gl_FragColor=vec4(c,a);}'));
  g.linkProgram(pr); g.useProgram(pr); const bf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, bf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), g.STATIC_DRAW);
  const lp = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(lp); g.vertexAttribPointer(lp, 2, g.FLOAT, false, 0, 0);
  const tx = g.createTexture(); g.bindTexture(g.TEXTURE_2D, tx); [g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T].forEach(k => g.texParameteri(g.TEXTURE_2D, k, g.CLAMP_TO_EDGE));
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
  return v => { if (v.readyState < 2) return; g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, v); g.viewport(0, 0, c.width, c.height); g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT); g.drawArrays(g.TRIANGLE_STRIP, 0, 4); }; }
const draw = stackGL(cv);
function sizeCanvas(host, srcW, srcH){ const r = host.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
  const cssH = r.height, cssW = Math.min(r.width, cssH * srcW / srcH), w = Math.min(srcW, Math.round(cssW * d)), h = Math.round(w * srcH / srcW);
  if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; } cv.style.height = Math.round(cssW * srcH / srcW) + 'px'; cv.style.width = Math.round(cssW) + 'px'; }
async function fetchBlob(url, onp){ const r = await fetch(url); if (!r.ok) throw 0; const tot = +r.headers.get('content-length') || 0;
  if (!r.body || !tot || !onp) return r.blob(); const rd = r.body.getReader(), parts = []; let got = 0;
  for (;;){ const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onp(got / tot); }
  return new Blob(parts, { type: 'video/mp4' }); }
const blobs = {};
function blobSrc(v, url, onp){ v.dataset.want = url; (blobs[url] || (blobs[url] = fetchBlob(url, onp).then(b => URL.createObjectURL(b))))
  .then(u => { if (v.dataset.want === url){ v.src = u; v.load(); } }).catch(() => { delete blobs[url]; if (v.dataset.want === url){ v.src = url; v.load(); } }); }

/* ── 360 밴드룸 ── */
const room = $('room'), stage = $('roomStage'), poster = $('roomPoster'), range = $('roomRange'), status = $('roomStatus');
const rv = document.createElement('video'); rv.muted = true; rv.playsInline = true; rv.preload = 'auto'; rv.setAttribute('muted', ''); rv.setAttribute('playsinline', '');
let ri = -1, ang = 0, vel = 0, drag = null, roomOn = false, ok = false, lastT = -1, auto = 0, lastFocus = null, raf = 0;
$('roomSwitch').innerHTML = M.map((m, i) => `<button data-i="${i}">${m.kr}</button>`).join('');
$('roomSwitch').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setRoom(+b.dataset.i); });
function setRoom(i){
  if (i === ri) return; ri = i; const m = M[i];
  $('roomName').innerHTML = `${m.kr}<span>${m.en}</span>`; $('roomBig').textContent = m.first;
  $('roomInfo').innerHTML = `<dt>Flower</dt><dd>${m.fl}</dd><dt>Height</dt><dd>${m.h}cm</dd><dt>Voice</dt><dd>${m.voice}</dd>`;
  qa('#roomSwitch button').forEach((b, k) => b.classList.toggle('on', k === i));
  poster.src = `img/cards/${m.id}.webp`; poster.style.opacity = .0; poster.alt = '';
  ok = false; cv.style.opacity = 0; ang = 0; vel = 0; lastT = -1; auto = 0; range.value = 0; status.textContent = 'Loading…';
  G.claim(rv); blobSrc(rv, `v/${m.id}_a.mp4`, p => { status.textContent = 'Loading ' + Math.round(p * 100) + '%'; });
}
rv.addEventListener('loadeddata', () => { ok = true; rv.pause(); rv.currentTime = 0; if (draw){ sizeCanvas(stage, 720, 1280); draw(rv); } cv.style.opacity = 1; status.textContent = '← Drag to turn →';
  if (!reduce && roomOn) auto = 1; });   /* 열리면 한 바퀴 천천히 돌아 보이고, 그 뒤엔 손으로만 */
rv.addEventListener('seeked', () => { if (draw) draw(rv); });
rv.addEventListener('error', () => { ok = false; status.textContent = '영상을 불러오지 못했어요'; });
function openRoom(id){ lastFocus = document.activeElement; if (liveCard) goLive(null);
  stage.appendChild(cv); cv.style.transition = 'opacity .4s'; room.hidden = false; document.body.classList.add('room-open'); roomOn = true;
  ri = -1; setRoom(Math.max(0, M.findIndex(m => m.id === id))); $('roomX').focus({ preventScroll: true }); loop(); }
function closeRoom(){ if (!roomOn) return; roomOn = false; room.hidden = true; document.body.classList.remove('room-open'); rv.pause(); G.release(rv); cancelAnimationFrame(raf); if (lastFocus) lastFocus.focus({ preventScroll: true }); }
$('roomX').onclick = closeRoom;
qa('[data-room]').forEach(b => b.addEventListener('click', () => openRoom(b.dataset.room)));
room.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeRoom();
  if (e.target === stage && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')){ e.preventDefault(); auto = 0; ang += e.key === 'ArrowRight' ? 15 : -15; }
  if (e.key === 'Tab'){ const f = qa('button,input,[tabindex="0"]', room).filter(x => !x.disabled && x.offsetParent); const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); } }
});
stage.addEventListener('pointerdown', e => { if (!ok) return; auto = 0; drag = { x: e.clientX, a: ang, px: e.clientX, t: performance.now() }; vel = 0; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', e => { if (!drag) return; const k = innerWidth <= 760 ? .9 : .5; ang = drag.a + (e.clientX - drag.x) * k;
  const now = performance.now(), dt = Math.max(8, now - drag.t); vel = vel * .5 + ((e.clientX - drag.px) * k / dt * 16) * .5; drag.px = e.clientX; drag.t = now; });
const endDrag = () => { if (!drag) return; drag = null; vel = clamp(vel, -14, 14); };
stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
range.addEventListener('input', () => { auto = 0; vel = 0; ang = +range.value; });
$('roomPlay').onclick = () => { if (!ok) return; auto = 1; vel = 0; };
$('roomReset').onclick = () => { auto = 0; vel = 0; ang = 0; };
function loop(){ if (!roomOn) return; raf = requestAnimationFrame(loop); if (!ok || !rv.duration) return;
  if (auto){ ang += 1.2; auto += 1.2; if (auto > 361){ auto = 0; } }
  else if (!drag && Math.abs(vel) > .04){ ang += vel; vel *= .93; } else if (!drag) vel = 0;
  const a = ((ang % 360) + 360) % 360, tt = a / 360 * (rv.duration - .05);
  if (!rv.seeking && Math.abs(tt - lastT) > 1 / 48){ rv.currentTime = tt; lastT = tt; }
  if (document.activeElement !== range) range.value = Math.round(a); }
addEventListener('resize', () => { if (roomOn && ok) sizeCanvas(stage, 720, 1280); });

/* ── 걷기 실험실: 사용자가 열 때만 10MB 영상을 받는다 (홈에서는 뺐다) ── */
const wv = document.createElement('video'); wv.muted = true; wv.playsInline = true; wv.preload = 'auto'; wv.setAttribute('muted', ''); wv.setAttribute('playsinline', '');
const wStage = $('walkStage'), wRange = $('walkRange'), SEG = [0, .263, .526, .789], ORDER = ['문태준', '채유성', '하진우', '채류현']; let wOk = false;
$('openWalk').addEventListener('click', () => { $('walkLab').hidden = false; $('openWalk').hidden = true; if (roomOn) closeRoom(); wStage.appendChild(cv); cv.style.opacity = 1;
  G.claim(wv); blobSrc(wv, 'v/walk_band_a.mp4', p => { $('walkHint').textContent = 'Loading ' + Math.round(p * 100) + '%'; }); });
wv.addEventListener('loadeddata', () => { wOk = true; wv.pause(); $('walkHint').textContent = '슬라이더를 움직여 보기 · 임시 영상'; if (draw){ wStage.appendChild(cv); sizeCanvas(wStage, 648, 1152); draw(wv); } });
let wWant = -1;
wv.addEventListener('seeked', () => { if (draw && cv.parentNode === wStage) draw(wv); if (wWant >= 0 && Math.abs(wv.currentTime - wWant) > 1 / 48){ wv.currentTime = wWant; } wWant = -1; });
wRange.addEventListener('input', () => { if (!wOk || !wv.duration) return; const t = wRange.value / 1000; let s = 0; SEG.forEach((v, k) => { if (t >= v) s = k; }); $('walkName').textContent = ORDER[s];
  const tt = t * (wv.duration - .05); if (!wv.seeking) wv.currentTime = tt; else wWant = tt; });
})();
