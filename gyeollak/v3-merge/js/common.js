/* 결락 v3 — 페이지 공용: 머리 색, 먹 번짐 페이지 전환, 미디어 하나만 재생, 30초 미리듣기, 인트로 영상 슬롯 */
(function(){
'use strict';
const G = window.GYK = window.GYK || {};
const reduce = G.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);

/* 미디어는 한 번에 하나만: 새로 재생하는 것이 다른 것을 멈춘다 */
let active = null;
G.claim = el => { if (active && active !== el) { try { active.pause(); } catch (e) {} if (active.__onStop) active.__onStop(); } active = el; };
G.release = el => { if (active === el) active = null; };
document.addEventListener('visibilitychange', () => { if (document.hidden && active) { try { active.pause(); } catch (e) {} } });

/* 머리 글자색: 어두운 구역 위에서는 한지색 */
const darks = Array.from(document.querySelectorAll('[data-tone=dark]'));
function tone(){ const y = 40; let d = false; for (const s of darks){ const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y){ d = true; break; } } document.body.classList.toggle('on-dark', d); }
addEventListener('scroll', tone, { passive: true }); addEventListener('resize', tone); tone();

/* 페이지 전환: 오른쪽 위 모서리에서 먹이 덮고, 새 페이지에서 걷힌다 */
const door = document.createElement('div'); door.className = 'inkdoor'; door.setAttribute('aria-hidden', 'true'); document.body.appendChild(door);
if (!reduce && sessionStorage.getItem('gykDoor') === '1'){
  sessionStorage.removeItem('gykDoor'); door.classList.add('instant', 'cover');
  requestAnimationFrame(() => requestAnimationFrame(() => { door.classList.remove('instant'); door.classList.remove('cover'); }));
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]'); if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
  const href = a.getAttribute('href'); if (!href || href.startsWith('#') || /^(https?:|mailto:)/.test(href)) return;
  const url = new URL(href, location.href); if (url.pathname === location.pathname) return;
  e.preventDefault(); sessionStorage.setItem('gykDoor', '1'); door.classList.add('cover');
  setTimeout(() => { location.href = url.href; }, 640);
});
addEventListener('pageshow', e => { if (e.persisted) door.classList.remove('cover'); });

(function(){const hero=document.querySelector('.hero');const f=()=>{const lim=hero?hero.offsetTop+hero.offsetHeight-80:innerHeight*.6;document.body.classList.toggle('scrolled',scrollY>lim)};addEventListener('scroll',f,{passive:true});f()})();

/* 큰 글자 맞추기: 화면 폭에 꽉 차되 잘리지 않게 */
function fitBig(){ document.querySelectorAll('.fbig').forEach(f => { f.style.fontSize = '100px'; const w = f.scrollWidth || 1; f.style.fontSize = Math.floor(100 * f.clientWidth * .98 / w) + 'px'; }); }
fitBig(); addEventListener('resize', fitBig); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBig);

/* 토스트 */
let tT; G.toast = s => { let t = $('toast'); if (!t){ t = document.createElement('div'); t.id = 'toast'; t.className = 'toast mono'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = s; t.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 2200); };

/* 트랙: 10곡. 음원 파일이 있는 곡만 30초 미리듣기(파일 자체를 30초로 잘라 둠) */
G.TRACKS = [['Intro','다시 무대에 들어서는 문','intro'],['Crescent Scar','같은 노래에 남은, 기억하지 못하는 마음',''],['능소화','잊기 전의 밝은 여름','','수정 중'],
  ['Amnesia','기억은 없어도 남아 있는 반응','amnesia'],['상사화','같은 뿌리에서 엇갈린 두 사람','sangsahwa'],['Rewind','그 계절을 되돌리고 싶은 마음','rewind'],
  ['결로','지워도 다시 맺히는 흔적','gyeolro'],['잔불','덮어 두었지만 꺼지지 않은 불씨',''],['연소','남은 불씨를 모두 태우는 결심',''],['치자 · Hidden','큰 소리가 끝난 뒤 남는 사적인 고백','chija']];
G.tracklist = function(listEl, discEl, nowEl, limit){
  const T = G.TRACKS.slice(0, limit || G.TRACKS.length);
  listEl.innerHTML = T.map((t, i) => `<li><button class="tr" data-i="${i}" ${t[2] ? '' : 'disabled'}><span class="n mono">${String(i + 1).padStart(2, '0')}</span>
    <span class="t" ${/[가-힣]/.test(t[0]) ? 'lang="ko"' : ''}>${t[0]}<small>${t[1]}</small></span><span class="s mono">${t[2] ? '30s' : (t[3] || '준비 중')}</span><span class="bar30" aria-hidden="true"><i></i></span></button></li>`).join('');
  const audio = new Audio(); audio.preload = 'none'; let cur = -1;
  const setNow = i => { if (discEl) discEl.classList.toggle('on', i >= 0); if (nowEl) nowEl.innerHTML = i >= 0 ? `Now playing<b>${G.TRACKS[i][0]}</b>` : 'Not playing<b>—</b>'; };
  const stop = () => { audio.pause(); cur = -1; setNow(-1); listEl.querySelectorAll('.tr.play').forEach(r => { r.classList.remove('play'); r.querySelector('.s').textContent = '30s'; r.style.removeProperty('--p'); }); G.release(audio); };
  audio.__onStop = stop;
  listEl.addEventListener('click', e => { const b = e.target.closest('.tr'); if (!b || b.disabled) return; const i = +b.dataset.i; if (cur === i){ stop(); return; } stop(); cur = i;
    G.claim(audio); audio.src = 'audio/' + G.TRACKS[i][2] + '.mp3'; audio.play().catch(() => { G.toast('재생을 시작하지 못했어요'); stop(); });
    b.classList.add('play'); b.querySelector('.s').textContent = 'Playing'; setNow(i); });
  audio.addEventListener('timeupdate', () => { const b = listEl.querySelector('.tr.play i'); if (b) b.style.width = Math.min(100, audio.currentTime / 30 * 100) + '%'; if (audio.currentTime >= 30) stop(); });
  audio.addEventListener('ended', stop);
  setNow(-1);
};

/* 인트로 영상 슬롯: 누를 때만 받고 재생, 화면 밖이면 멈춤 */
G.film = function(root){
  const v = root.querySelector('video'), btn = root.querySelector('.play');
  if (!v){ btn && btn.addEventListener('click', () => G.toast('15초 인트로는 준비 중이에요')); return; }
  const wide = innerWidth / innerHeight > 1;
  const pick = () => v.dataset[wide ? 'wide' : 'tall'] || v.dataset.wide;
  const stop = () => { v.pause(); root.classList.remove('playing'); btn.setAttribute('aria-label', '인트로 영상 재생'); G.release(v); };
  v.__onStop = stop;
  btn.addEventListener('click', () => { if (!v.src) v.src = pick(); G.claim(v); v.play().then(() => root.classList.add('playing')).catch(() => G.toast('영상을 재생하지 못했어요')); });
  v.addEventListener('click', () => { if (!v.paused) stop(); });
  v.addEventListener('ended', stop);
  new IntersectionObserver(es => { if (!es[0].isIntersecting && !v.paused) stop(); }, { threshold: 0 }).observe(root);
};
})();
