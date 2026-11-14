/* 결락 v14 — 사이트 전체에 하나만 있는 플레이어.
   곡 목록은 여기 한 곳에만 둔다. 페이지를 넘겨도 곡·위치를 이어 간다(sessionStorage).
   재생은 항상 사용자의 동작으로 시작. 게임 BGM이 켜지면 'gy:bgm' 이벤트로 멈춘다. */
(() => {
  'use strict';
  /* 《장마의 잔향》 확정 순서 (슈 · 11-14). f 가 없으면 '준비 중' — 목록에는 보이지만 재생 안 됨.
     음원은 사이트에서 내려받기 없이 듣기만. 정식 유통은 Ditto 예정. */
  const T = window.GY_TRACKS = [
    { f: '00_intro', t: '비가 맺지 못한 것들', s: 'INTRO', c: '01-clear-archive', cn: 'CLEAR ARCHIVE', p: '앨범의 문. 빗소리 위로 첫 화음이 맺히다 만다.' },
    { f: null, t: 'Crescent Scar', en: 1, s: '2026 RE-RECORDING', prep: '음원 준비 중', c: '01-clear-archive', cn: '케이스 미정', p: '같은 무대와 노래로 돌아왔지만, 그때의 마음에는 빈자리가 있다.' },
    { f: null, t: '능소화', s: 'TRACK 03', prep: '수정 중', c: '01-clear-archive', cn: '케이스 미정', p: '' },
    { f: '03_amnesia', t: 'Amnesia', en: 1, s: 'TRACK 04', c: '04-x-ray', cn: 'X-RAY', p: '잊은 것과 남은 것 사이. 사고 이후에 쓰인 노래.' },
    { f: '05_sangsahwa', t: '상사화', s: 'TRACK 05', c: '05-soft-sleeve', cn: 'SOFT SLEEVE', p: '잎과 꽃이 끝내 같은 계절에 만나지 못하는 꽃.' },
    { f: '04_rewind', t: 'Rewind', en: 1, s: 'TITLE', title: 1, c: '06-sprue-kit', cn: 'SPRUE KIT', p: '되감고 싶은 시간. 과거로 돌아가고 싶은 마음을 정면으로.' },
    { f: '02_gyeolro', t: '결로', k: '結露', s: 'TRACK 07', c: '02-chrome-thorn', cn: 'CHROME THORN', p: '부재가 유리창에 맺혀 물방울이 되는 순간. 다시 맺히는 기억의 흔적.' },
    { f: null, t: '잔불', s: 'TRACK 08', prep: '수정 중', c: '01-clear-archive', cn: '케이스 미정', p: '' },
    { f: null, t: '연소', s: 'TRACK 09', prep: '수정 중', c: '01-clear-archive', cn: '케이스 미정', p: '' },
    { f: '07_chija', t: '치자', s: 'HIDDEN', c: '08-vending-capsule', cn: 'VENDING CAPSULE', p: '흰 꽃, 짙은 향. 숨겨 둔 트랙.' },
    { f: '06_sodapop', t: 'Soda Pop', en: 1, s: 'BONUS 1', bonus: 1, c: '03-liquid-drip', cn: 'LIQUID DRIP (임시)', p: '사라질까 겁나는 마음도, 오늘만큼은 숨기지 않는 고백.' },
    { f: '08_firstsnow', t: '첫눈이 오면', s: 'BONUS 2', bonus: 1, c: '07-receipt-sleeve', cn: 'RECEIPT SLEEVE (임시)', p: '테이프에 담아 두었던 마음을, 겨울에는 직접 건네는 약속.' },
  ];
  const me = document.currentScript;
  if (me && me.dataset.hide) { window.GYP = null; return; }
  const n2 = i => window.GY_TRACKS[i] && T[i].bonus ? 'B' + (i - T.findIndex(t => t.bonus) + 1) : String(i + 1).padStart(2, '0');
  const fmt = s => isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';
  const KEY = 'gy14-player';
  let st = {}; try { st = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (e) {}
  const ok = i => !!(T[i] && T[i].f);
  const nextOk = (i, d) => { for (let k = 1; k <= T.length; k++) { const j = (i + d * k + T.length * 4) % T.length; if (ok(j)) return j; } return i; };
  let cur = Number.isInteger(st.i) && ok(st.i) ? st.i : 0;
  const au = new Audio(); au.preload = 'metadata';
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'css/player.css'; document.head.appendChild(css);

  const bar = document.createElement('div'); bar.className = 'gyp'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', '결락 플레이어');
  bar.innerHTML = `<button type="button" class="gyp-art" aria-label="플레이어 펼치기"><i></i></button>
    <div class="gyp-meta"><b></b><span></span></div>
    <div class="gyp-btns"><button type="button" class="gyp-prev" aria-label="이전 곡">⏮</button><button type="button" class="gyp-pp" aria-label="재생">▶</button><button type="button" class="gyp-next" aria-label="다음 곡">⏭</button><button type="button" class="gyp-open" aria-label="플레이어 펼치기" aria-expanded="false">⌃</button></div>
    <div class="gyp-prog" aria-hidden="true"><i></i></div>`;
  const sh = document.createElement('div'); sh.className = 'gyp-sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-label', '결락 플레이어 — 장마의 잔향'); sh.hidden = true;
  sh.innerHTML = `<button type="button" class="gyp-close">CLOSE ⌄</button>
    <div class="gyp-case" aria-hidden="true"><span class="gyp-disc"></span><img alt=""></div>
    <div class="gyp-side"><span class="gyp-k">GYEOLLAK · 장마의 잔향 · NOW PLAYING</span><h3></h3><div class="gyp-s"></div>
      <ol class="gyp-list"></ol><a class="gyp-more" href="music.html">III 음악 — 곡 소개 보기 →</a></div>`;
  document.body.append(bar, sh);
  const q = (s, r = bar) => r.querySelector(s);
  const list = q('.gyp-list', sh);
  T.forEach((x, i) => { const li = document.createElement('li'); li.innerHTML = `<button type="button"><i>${n2(i)}</i><b>${x.t}</b><span>${x.s}</span></button>`; if (!ok(i)) { li.firstChild.disabled = true; li.firstChild.querySelector('span').textContent = x.prep || '준비 중'; li.classList.add('prep'); } else li.firstChild.onclick = () => GYP.play(i); list.appendChild(li); });

  function load(i) { cur = (i + T.length) % T.length; au.src = `audio/${T[cur].f}.mp3`; }
  load(cur);
  if (st.t) au.addEventListener('loadedmetadata', () => { try { au.currentTime = Math.min(st.t, (au.duration || st.t) - 1); } catch (e) {} sync(); }, { once: true });

  const GYP = window.GYP = {
    tracks: T, audio: au,
    get cur() { return cur; }, get playing() { return !au.paused; },
    play(i) { if (i !== undefined && !ok(i)) return Promise.resolve(); if (i !== undefined && i !== cur) load(i); window.dispatchEvent(new CustomEvent('gy:music')); return au.play().catch(() => {}); },
    toggle(i) { if (i !== undefined && i !== cur) return GYP.play(i); au.paused ? GYP.play() : au.pause(); },
    pause() { au.pause(); },
    seek(r) { if (au.duration) au.currentTime = r * au.duration; },
    open(o = true) { sh.hidden = !o; requestAnimationFrame(() => sh.classList.toggle('on', o)); q('.gyp-open').setAttribute('aria-expanded', o); if (o) q('.gyp-close', sh).focus(); },
  };
  q('.gyp-pp').onclick = () => GYP.toggle();
  q('.gyp-prev').onclick = () => GYP.play(nextOk(cur, -1));
  q('.gyp-next').onclick = () => GYP.play(nextOk(cur, 1));
  q('.gyp-open').onclick = q('.gyp-art').onclick = () => GYP.open(sh.hidden);
  q('.gyp-close', sh).onclick = () => { GYP.open(false); setTimeout(() => sh.hidden = true, 420); };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !sh.hidden) q('.gyp-close', sh).click(); });
  q('.gyp-prog').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); GYP.seek((e.clientX - r.left) / r.width); };
  au.addEventListener('ended', () => { const n = nextOk(cur, 1); if (n > cur && !T[n].bonus) GYP.play(n); }); // 본편은 치자에서 멈춤, 보너스는 따로
  addEventListener('gy:bgm', () => au.pause());

  function sync() {
    const x = T[cur], on = !au.paused;
    bar.classList.toggle('on', on); sh.classList.toggle('playing', on); document.documentElement.classList.toggle('gy-playing', on);
    const pp = q('.gyp-pp'); pp.textContent = on ? '❚❚' : '▶'; pp.setAttribute('aria-label', on ? '일시정지' : '재생');
    q('.gyp-meta b').textContent = x.t;
    q('.gyp-meta span').textContent = `${n2(cur)}/${T.filter(t => !t.bonus).length} · ${fmt(au.currentTime)}${au.duration ? ' / ' + fmt(au.duration) : ''}`;
    q('.gyp-art i').style.backgroundImage = `url(img/goods/${x.c}.webp)`;
    q('.gyp-prog i').style.width = (au.duration ? au.currentTime / au.duration * 100 : 0) + '%';
    q('h3', sh).textContent = x.t; q('.gyp-s', sh).textContent = `TRACK ${n2(cur)} · ${x.s} · CASE ${x.cn}`;
    const im = q('.gyp-case img', sh); const src = `img/goods/${x.c}.webp`; if (!im.src.endsWith(src)) { im.src = src; im.alt = `${x.t} CD 케이스`; }
    [...list.querySelectorAll('button')].forEach((b, k) => { b.classList.toggle('cur', k === cur); b.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
    window.dispatchEvent(new CustomEvent('gy:player', { detail: { i: cur, on, t: au.currentTime, d: au.duration || 0 } }));
  }
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended', 'emptied'].forEach(e => au.addEventListener(e, sync));
  sync();
  addEventListener('pagehide', () => { try { sessionStorage.setItem(KEY, JSON.stringify({ i: cur, t: au.currentTime || 0, on: !au.paused })); } catch (e) {} });
  if (st.on) { au.play().catch(() => { bar.classList.add('resume'); q('.gyp-meta span').textContent = '이어 듣기 ▶ 를 눌러 주세요'; }); }
})();
