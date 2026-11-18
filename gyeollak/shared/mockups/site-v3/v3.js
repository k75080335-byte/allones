/* 결락 site v3 — 수면 위 들판 → 먹 번짐(스크롤 스크럽 영상) · 12m 런웨이(영상 1개만) · 트랙 목록 + 잉어 잔상 */
(() => {
const R = document.documentElement, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const anim = R.classList.contains('js-anim') && R.dataset.tier !== 'static' && !reduce;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
const media = new Set(); // 한 번에 하나만 재생
const solo = el => media.forEach(m => { if (m !== el && !m.paused) m.pause(); });

/* hero 영상은 hero를 벗어나면 멈춤 */
const lily = $('#lily');
if (lily) { media.add(lily); new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting && !lily.paused) lily.pause(); })).observe($('.hero')); }

/* ── TRACKS ── */
const TR = [['비가 맺지 못한 것들', '', '00_intro', 'INTRO'], ['Crescent Scar', '', '', '2026 RE-RECORDING'], ['능소화', '', '', 'TRACK 03'], ['Amnesia', '', '03_amnesia', 'TRACK 04'], ['상사화', '', '05_sangsahwa', 'TRACK 05'], ['Rewind', '', '04_rewind', 'TITLE'], ['결로', '結露', '02_gyeolro', 'TRACK 07'], ['잔불', '', '', 'TRACK 08'], ['연소', '', '', 'TRACK 09'], ['치자', '', '07_chija', 'HIDDEN'], ['Soda Pop', '', '06_sodapop', 'BONUS 1'], ['첫눈이 오면', '', '08_firstsnow', 'BONUS 2']];
const ol = $('.tracks'), pv = $('#pv'); media.add(pv);
let cur = -1, stopT = 0;
TR.forEach(([t, k, f, s], i) => {
  const li = document.createElement('li'); if (!f) li.className = 'prep';
  li.innerHTML = `<button type="button" ${f ? '' : 'aria-disabled="true"'} aria-label="${t} ${f ? '20초 미리 듣기' : '준비 중'}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${t}${k ? `<small lang="zh-Hant">${k}</small>` : ''}</span><span class="s">${f ? s : '준비 중'}</span></button>`;
  if (f) li.firstChild.addEventListener('click', () => {
    if (cur === i && !pv.paused) { pv.pause(); return; }
    cur = i; pv.src = `../../../v15/audio/${f}.mp3`; pv.currentTime = 0; solo(pv); pv.play().catch(() => {});
    clearTimeout(stopT); stopT = setTimeout(() => pv.pause(), 20000);
  });
  ol.appendChild(li);
});
const mark = () => $$('.tracks li').forEach((li, k) => li.classList.toggle('on', k === cur && !pv.paused));
pv.addEventListener('play', mark); pv.addEventListener('pause', mark); pv.addEventListener('ended', mark);
/* 잉어는 잔상으로만(9%) — 포인터를 늦게 따라온다 */
const koi = $('.koi'), tw = $('.tracks-wrap');
if (!reduce && koi) {
  let kx = 0, ky = 0, tx = 0, ty = 0, on = false;
  tw.addEventListener('pointermove', e => { const r = tw.getBoundingClientRect(); tx = e.clientX - r.left - koi.offsetWidth * .5; ty = e.clientY - r.top - koi.offsetHeight * .5; if (!on) { on = true; loop(); } });
  tw.addEventListener('pointerleave', () => { on = false; });
  const loop = () => { kx += (tx - kx) * .06; ky += (ty - ky) * .06; koi.style.transform = `translate(${kx}px,${ky}px) rotate(${(tx - kx) * .02}deg)`; if (on || Math.abs(tx - kx) > 1) requestAnimationFrame(loop); };
  tw.addEventListener('focusin', () => tw.classList.add('ko')); tw.addEventListener('focusout', () => tw.classList.remove('ko'));
}

if (!anim) return; // static / reduced-motion: 모든 장면이 정지 이미지로 쌓여 보인다

/* ── SURFACE → DIVE ── */
const sf = $('.surface'), dive = $('.sf-dive'), ca = $('.sf-copy.a'), cb = $('.sf-copy.b');
let diveReady = false, seeking = false, seekAt = 0, target = 0;
const wide = matchMedia('(min-width:900px)').matches;
dive.poster = `assets/v3/dive_${wide ? 'wide' : 'tall'}_start.jpg`;
new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting && !diveReady) { diveReady = true; dive.src = wide ? dive.dataset.wide : dive.dataset.tall; dive.preload = 'auto'; dive.load(); }
}), { rootMargin: '100% 0px' }).observe(sf);
dive.addEventListener('seeked', () => { seeking = false; if (Math.abs(dive.currentTime - target) > .04) requestAnimationFrame(surface); });
function surface() {
  const p = prog(sf), top = sf.getBoundingClientRect().top;
  sf.style.setProperty('--pe', clamp(1 - top / innerHeight).toFixed(3));
  sf.style.setProperty('--sp', clamp(p / .3).toFixed(3));
  sf.style.setProperty('--dv', clamp((p - .26) / .16).toFixed(3));
  sf.style.setProperty('--se', clamp((p - .88) / .12).toFixed(3));
  ca.classList.toggle('on', p < .26); cb.classList.toggle('on', p > .52 && p < .9);
  R.classList.toggle('on-dive', p > .32 && p < .5 && top <= 0);
  if (dive.readyState >= 1 && dive.duration) {
    target = clamp((p - .3) / .58) * (dive.duration - .05);
    if (seeking && performance.now() - seekAt > 400) seeking = false;
    if (!seeking && Math.abs(dive.currentTime - target) > .04) { seeking = true; seekAt = performance.now(); dive.currentTime = target; }
  }
}

/* ── RUNWAY: 한 명씩, 모서리 먹 번짐으로 교체, 영상은 하나 ── */
const rw = $('.runway'); rw.classList.add('stage');
const looks = $$('.look'), ticks = $$('.rw-ticks button'), qs = $$('.rw-queue img');
const vid = document.createElement('video'); vid.muted = true; vid.loop = true; vid.playsInline = true; vid.setAttribute('playsinline', ''); vid.preload = 'none'; vid.setAttribute('aria-hidden', 'true');
vid.style.opacity = 0; vid.style.transition = 'opacity .5s'; media.add(vid);
vid.addEventListener('playing', () => { vid.style.opacity = 1; });
let idx = -1, rwIn = false;
new IntersectionObserver(es => es.forEach(e => { rwIn = e.isIntersecting; if (!rwIn) vid.pause(); else if (idx >= 0) { solo(vid); vid.play().catch(() => {}); } })).observe(rw);
function show(i) {
  if (i === idx) return;
  looks.forEach((l, k) => { l.classList.toggle('prev', k === idx); l.classList.remove('on'); l.setAttribute('aria-hidden', 'true'); });
  void looks[i].offsetWidth; looks[i].classList.add('on'); looks[i].removeAttribute('aria-hidden');
  idx = i;
  vid.style.opacity = 0; looks[i].querySelector('.media').appendChild(vid);
  vid.src = looks[i].dataset.v; vid.poster = looks[i].querySelector('.media img').src;
  if (rwIn) { solo(vid); vid.play().catch(() => {}); }
  ticks.forEach((t, k) => t.setAttribute('aria-current', String(k === i)));
  let n = 0; qs.forEach((q, k) => { q.classList.toggle('q', k !== i); if (k !== i) { q.style.right = `calc(6vw + 45svh + 3vw + ${n * 7.5}vw)`; q.style.transform = `scale(${1 - n * .12})`; q.style.transformOrigin = '50% 100%'; n++; } });
}
ticks.forEach((t, k) => t.addEventListener('click', () => { const top = rw.getBoundingClientRect().top + scrollY; scrollTo({ top: top + (rw.offsetHeight - innerHeight) * (k + .5) / 4, behavior: 'smooth' }); }));
function runway() {
  const q = prog(rw); show(Math.min(3, Math.floor(q * 4)));
  ticks.forEach((t, k) => t.style.setProperty('--f', clamp(q * 4 - k).toFixed(3)));
}
show(0);

let raf = 0;
const tick = () => { raf = 0; surface(); runway(); };
addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
addEventListener('resize', tick); tick();
})();
