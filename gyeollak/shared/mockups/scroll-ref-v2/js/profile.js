(() => {
const M = GY_M, V = GY_V15, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.getElementById(s);
const id = new URLSearchParams(location.search).get('m') || 'jinwoo';
const mi = Math.max(0, M.findIndex(x => x.id === id)), m = M[mi];
const PAD = src => /_white\./.test(src) ? [0, 1] : /_suit\b/.test(src) && !/turn/.test(src) ? [.001, .999] : [.028, .971];
document.title = `결락 — ${m.kr} 프로필 (레퍼런스 시안 v2)`;
document.body.style.setProperty('--field', m.field); document.body.dataset.tone = m.tone;
$('pdrop').innerHTML = GY_DROP('h');

/* ---------- 히어로 (VIDENCE 형식: 단색 바탕 + 세리프 문장 + 큰 인물) ---------- */
$('kk').textContent = `${m.no} / 04 — PROFILE`;
$('bn1').textContent = $('bn2').textContent = m.first;
$('copy').textContent = m.copy;
$('kr').textContent = m.kr; $('role').textContent = `${m.role} · ${m.cm}cm`;
$('qt').textContent = m.quote ? `“${m.quote}”` : '';
$('tbl').innerHTML = m.table.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
$('flc').innerHTML = m.id === 'taejun' ? `<img src="assets/lily/036.webp" alt="백합">` : `<span class="wt">준비 중</span>`;
$('flp').innerHTML = `FLOWER<b>${m.flower} ${m.fk}</b>${m.id === 'taejun' ? '<span class="tag test">그록 테스트</span>' : '<span class="tag">꽃 소스 준비 중</span>'}`;
$('krimg').src = `${V}img/goods/${m.plush}.webp`; $('krimg').alt = m.animal + ' 키링';
$('mtabs').innerHTML = M.map(x => `<a href="profile.html?m=${x.id}" class="${x.id === m.id ? 'on' : ''}"><i>${x.no}</i>${x.kr}</a>`).join('');
const fig = $('fig'), fb = $('figbox');
fig.src = `assets/cut/${m.id}_white.webp`; fig.alt = `${m.kr} 흰 정장 (home08 v2 컷)`;
function hero() {
  if (!fig.naturalWidth) return;
  const vw = innerWidth, vh = innerHeight, mob = vw < 760;
  ['bn1', 'bn2'].forEach(k => { const e = $(k); e.style.fontSize = ''; const avail = vw * (mob ? .96 : .94), w = e.scrollWidth; if (w > avail) e.style.fontSize = (parseFloat(getComputedStyle(e).fontSize) * avail / w) + 'px'; });
  const H = (mob ? .56 : .82) * vh * m.cm / 195, [t, b] = PAD(fig.src);
  const iH = H / (b - t); fig.style.height = iH + 'px'; fig.style.bottom = (-(1 - b) * iH) + 'px';
  const W = H * fig.naturalWidth / fig.naturalHeight, cx = (mob ? .5 : .64) * vw, bottom = mob ? vh * .34 : 0;
  Object.assign(fb.style, { left: (cx - W / 2) + 'px', width: W + 'px', height: H + 'px', bottom: bottom + 'px' });
  const hy = vh - bottom - H - 8;
  const p = $('thp'); p.setAttribute('d', `M${cx + vw * .1} 0 C ${cx + vw * .08} ${hy * .45}, ${cx - 30} ${hy * .6}, ${cx} ${hy}`);
  const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = RM ? 0 : L;
  requestAnimationFrame(() => requestAnimationFrame(() => { p.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)'; p.style.strokeDashoffset = 0; }));
  Object.assign($('pdrop').style, { left: cx + 'px', top: hy + 'px' });
  // 스펙 선 (오른쪽으로 1px 리더선)
  const P = [[.5, .07, 'HEIGHT', m.cm + ' cm'], [.52, .22, 'POSITION', m.role], [.5, .42, 'FLOWER', `${m.flower} ${m.fk}`], [.48, .64, 'COMPANION', m.animal]];
  const rx = mob ? W * 1.08 : W * 1.5;
  $('spec').setAttribute('viewBox', `0 0 ${W} ${H}`);
  $('spec').innerHTML = `<path pathLength="1" d="M${-W * .06} 0V${H}"/><path pathLength="1" d="M${-W * .12} 0H${W * .02}M${-W * .12} ${H}H${W * .02}"/>` +
    P.map(([x, y]) => `<path pathLength="1" d="M${x * W} ${y * H}L${x * W + 24} ${y * H - 16}H${rx}"/><circle cx="${x * W}" cy="${y * H}" r="3"/>`).join('');
  $('labs').innerHTML = P.map(([x, y, k, v]) => `<div class="lab" style="left:${rx + 6}px;top:${y * H - 34}px">${k}<b>${v}</b></div>`).join('') +
    `<div class="lab r" style="right:${W * 1.12 + 6}px;top:${H / 2 - 18}px">HEIGHT<b>${m.cm}</b></div>`;
}
const spec = on => { fb.classList.toggle('spec-on', on); $('plus').classList.toggle('on', on); $('plus').setAttribute('aria-pressed', on); };
$('plus').onclick = () => spec(!fb.classList.contains('spec-on'));
fb.addEventListener('click', () => spec(!fb.classList.contains('spec-on')));
fb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spec(!fb.classList.contains('spec-on')); } });
fig.onload = hero;

/* ---------- 상세 (MOON 형식: 남색 + 빛나는 구 + 아치·타원 사진 틀) ---------- */
$('dk').textContent = `${m.no} — DETAILS`; $('dkr').textContent = m.kr;
const MENU = [['01', '프로필'], ['02', '취향과 습관'], ['03', '지나온 시간'], ['04', '멤버들의 말']];
const wait = n => n === '04' ? '준비 중 — 실제로 한 말만 싣는다 (지어낸 발언 없음)' : `준비 중 — ${m.kr} 프로필은 공동 작성 예정 (빈칸은 지어내지 않음)`;
const base = [['키', m.cm + ' cm'], ['꽃', m.flower + ' ' + m.fk], ['동물', m.animal]];
$('menu').innerHTML = MENU.map(([n, t]) => { const v = m.menu[n];
  const body = v == null ? `<p class="wait">${wait(n)}</p>` : Array.isArray(v) ? `<dl>${[...base, ...v].map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>` : `<p>${v}</p>`;
  return `<div class="row${n === '01' ? ' open' : ''}"><button type="button" aria-expanded="${n === '01'}"><i>${n}</i><span>${t}</span><em>+</em></button><div class="body"><div><div class="in">${body}</div></div></div></div>`; }).join('');
if (m.menu['01'] == null) $('menu').querySelector('.row .in').innerHTML = `<dl>${[['키', m.cm + ' cm'], ['포지션', m.role], ...base.slice(1)].map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl><p class="wait" style="margin-top:12px">나머지 항목은 공동 작성 후</p>`;
$('menu').querySelectorAll('.row button').forEach(b => b.onclick = () => { const r = b.parentElement, o = !r.classList.contains('open'); r.classList.toggle('open', o); b.setAttribute('aria-expanded', o); });
const fr = [...document.querySelectorAll('#cluster .fr')];
fr.forEach((f, i) => { const im = f.querySelector('img'); im.src = `assets/photos/${m.id}_${i + 1}.webp`; im.alt = `${m.kr} 사진 ${i + 1}`; });
$('ccap').textContent = `${m.kr} · 프로필 사진 4 · d-refs 프로필 원본`;
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.rv').forEach(x => io.observe(x));
function par() {
  if (RM) return; const sy = scrollY, vh = innerHeight;
  $('bn1').style.transform = `translateX(${-sy * .12}px)`; $('bn2').style.transform = `translateX(${-sy * .12}px)`;
  const cr = $('cluster').getBoundingClientRect(), k = (cr.top + cr.height / 2 - vh / 2);
  fr.forEach(f => { f.style.transform = `translateY(${k * f.dataset.s}px)`; const im = f.querySelector('img'); im.style.transform = `translateY(${-6 + k * im.dataset.s * .3}%)`; });
}
// 헤더 색: 헤더 밑에 있는 구역의 바탕에 맞춤
const TONE = [['top', m.tone], ['details', 'dark'], ['style', 'light']];
function tone() { let t = m.tone; TONE.forEach(([k, v]) => { if ($(k).getBoundingClientRect().top <= 28) t = v; }); if (document.querySelector('.pft').getBoundingClientRect().top <= 28) t = 'dark'; if (document.body.dataset.tone !== t) document.body.dataset.tone = t; }
addEventListener('scroll', () => requestAnimationFrame(() => { par(); tone(); }), { passive: true });

/* ---------- 스타일: 옷 + 360 (실제 턴어라운드 컷만) ---------- */
const OF = GY_OUTFIT(m.id), OK = Object.keys(OF), stage = $('stage'), sf = $('sfig');
let mode = 'o', oi = 0, si = 0, ang = 0;
$('outfits').innerHTML = '<span class="lbl">OUTFIT · 옆으로 밀기</span>' + OK.map((k, i) => `<button type="button" data-o="${i}">${k}</button>`).join('');
$('turns').innerHTML = '<span class="lbl">360° · 끌어서 돌리기</span>' + (m.turn ? m.turn.map((t, i) => `<button type="button" class="t" data-t="${i}">360° ${t.label}</button>`).join('')
  : '<button type="button" disabled>360° 준비 중</button>');
$('snote').textContent = m.turn ? `실제 턴어라운드 컷만 사용 · ${m.turnNote}` : '실제로 만든 턴어라운드 컷이 아직 없어서 돌리기를 열지 않음 (가짜 회전 없음). 옷 3벌은 v15 멤버 컷.';
const near = (a, list) => { let bi = 0, bd = 999; list.forEach((x, i) => { const d = Math.abs(((a - x) % 360 + 540) % 360 - 180); if (d < bd) { bd = d; bi = i; } }); return bi; };
const AN = { 0: '정면', 45: '¾', 90: '옆', 180: '뒤', 270: '옆', 315: '¾' };
function src() { if (mode === 't') { const T = m.turn[si]; return `assets/turn/${T.key}_${near(ang, T.ang)}.webp`; } return `${V}img/members/${OF[OK[oi]]}.webp`; }
function sizeS() { const H = stage.clientHeight * .9 * m.cm / 195, [t, b] = mode === 't' ? [.028, .971] : PAD(sf.src); const iH = H / (b - t); sf.style.height = iH + 'px'; sf.style.bottom = (stage.clientHeight * .05 - (1 - b) * iH) + 'px'; }
function mark() {
  $('outfits').querySelectorAll('button').forEach(b => b.classList.toggle('on', mode === 'o' && +b.dataset.o === oi));
  $('turns').querySelectorAll('button[data-t]').forEach(b => b.classList.toggle('on', mode === 't' && +b.dataset.t === si));
  stage.classList.toggle('turning', mode === 't'); $('ring').style.display = mode === 't' ? 'block' : 'none';
  if (mode === 't') { const T = m.turn[si], a = T.ang[near(ang, T.ang)], rad = (a + 90) * Math.PI / 180;
    $('ringDot').style.left = (50 + 50 * Math.cos(rad)) + '%'; $('ringDot').style.top = (50 + 50 * Math.sin(rad)) + '%';
    $('angle').textContent = `${String(Math.round(((ang % 360) + 360) % 360)).padStart(3, '0')}° → 컷 ${String(a).padStart(3, '0')}° ${AN[a]} · ${T.ang.length}컷`; }
  else $('angle').textContent = `${OK[oi]} · ${oi + 1} / ${OK.length}`;
}
function set(dir) {
  const s = src(); if (sf.src === new URL(s, location.href).href && !dir) { mark(); return; }
  if (!dir || RM || mode === 't') { sf.src = s; sf.onload = sizeS; mark(); return; }
  sf.classList.add(dir < 0 ? 'out-l' : 'out-r');
  setTimeout(() => { sf.src = s; sf.onload = () => { sizeS(); sf.classList.remove('out-l', 'out-r'); }; mark(); }, 200);
}
$('outfits').addEventListener('click', e => { const b = e.target.closest('[data-o]'); if (!b) return; const n = +b.dataset.o, d = n > oi ? 1 : -1; mode = 'o'; oi = n; set(d); });
$('turns').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; mode = 't'; si = +b.dataset.t; ang = 0; set(); });
let d0 = null;
stage.addEventListener('pointerdown', e => { d0 = { x: e.clientX, a: ang }; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', e => { if (!d0 || mode !== 't') return; ang = d0.a - (e.clientX - d0.x) * .55; const s = src(); if (sf.src !== new URL(s, location.href).href) sf.src = s; mark(); });
stage.addEventListener('pointerup', e => { if (!d0) return; const dx = e.clientX - d0.x; d0 = null; if (mode === 'o' && Math.abs(dx) > 50) { oi = (oi + (dx < 0 ? 1 : -1) + OK.length) % OK.length; set(dx < 0 ? 1 : -1); } });
stage.addEventListener('pointercancel', () => d0 = null);
stage.addEventListener('keydown', e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); const s = e.key === 'ArrowRight' ? 1 : -1;
  if (mode === 't') { ang += s * 45; sf.src = src(); mark(); } else { oi = (oi + s + OK.length) % OK.length; set(s); } });
(m.turn || []).forEach(T => T.ang.forEach((_, i) => { new Image().src = `assets/turn/${T.key}_${i}.webp`; }));
sf.onload = sizeS; sf.src = src(); sf.alt = `${m.kr} 스타일`; mark();

/* ---------- 푸터 (MOON GET IN TOUCH 형식 → 다음 사람) ---------- */
const nx = M[(mi + 1) % 4];
$('nextBig').href = `profile.html?m=${nx.id}`; $('nextBig').innerHTML = `${nx.kr} <em>→</em><small>${nx.no} / 04 · ${nx.en}</small>`;
$('mlinks').innerHTML = M.map(x => `<a href="profile.html?m=${x.id}">${x.no} ${x.kr}</a>`).join('<br>');
addEventListener('resize', () => { hero(); sizeS(); par(); });
if (fig.complete) hero(); par();
if (document.fonts) document.fonts.ready.then(() => hero());
if (location.hash === '#style' && m.turn) { mode = 't'; set(); }
})();
