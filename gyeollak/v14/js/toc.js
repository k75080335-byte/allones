/* 결락 v14 · 공통 헤더 + 5챕터 목차 + Colophon 링크 + 전체 플레이어 불러오기. <script src="js/toc.js" data-page="objects" data-next="1"></script> */
(() => {
  const me = document.currentScript, page = me.dataset.page;
  const CH = [['I', '결락', 'Gyeollak'], ['II', '사람', 'People'], ['III', '음악', 'Music'], ['IV', '물건', 'Objects'], ['V', '놀이', 'Play']];
  const P = [
    ['surface', 'I', 'Surface', '첫 화면 · 은빛 수면', 'index.html', 'img/logo/mark-droplet.png', '은빛 수면 위의 결. 가운데 빛을 문지르고, TOUCH 하면 떨어진다.'],
    ['film', 'I', 'Film', '한 획이 떨어진다', 'film.html', 'img/v12/sky.webp', '떨어지고, 가라앉고, 다시 떠오르기까지.'],
    ['descent', 'I', 'Descent', '심연 · X-RAY / GLASS', 'descent.html', 'img/v12/ryuhyeon_suit_xr.webp', '수면이 깨진 자리에서 핀 꽃. 네모 안은 언제나 반대쪽.'],
    ['members', 'II', 'People', '라인업 → 네 장면', 'members.html', 'img/v12/ryuhyeon_suit_cy.webp', '누르면 스펙, 옆으로 밀면 옷이 바뀐다.'],
    ['music', 'III', 'Music', '장마의 잔향 · 듣기', 'music.html', 'img/goods/02-chrome-thorn.webp', '케이스는 그대로, CD만 돈다. 아래 플레이어는 어디서나.'],
    ['objects', 'IV', 'Objects', '진열장 · 스펙', 'objects.html', 'img/goods/kr7-panther.webp', '아크릴 진열장에서 하나를 집어 돌려 본다.'],
    ['play', 'V', 'Play', '90년대 모니터 · 포켓 룸', 'play.html', 'img/goods/kr1-front.webp', '아이스블루 브라운관을 켜고 START.'],
  ];
  const cur = P.findIndex(p => p[0] === page);
  document.querySelectorAll('header.hd').forEach(h => { h.style.display = 'none'; h.setAttribute('aria-hidden', 'true'); });
  const gh = document.createElement('header'); gh.className = 'gh';
  gh.innerHTML = `<a class="brand" href="index.html"><b>결락</b>GYEOLLAK</a><span class="here">${cur >= 0 ? P[cur][1] + ' · ' + CH.find(c => c[0] === P[cur][1])[1] + ' — ' + P[cur][2].toUpperCase() : ''}</span><button class="idx-btn" type="button" aria-haspopup="dialog" aria-expanded="false">INDEX <i><b></b><b></b></i></button>`;
  const toc = document.createElement('div'); toc.className = 'toc'; toc.setAttribute('role', 'dialog'); toc.setAttribute('aria-modal', 'true'); toc.setAttribute('aria-label', '결락 목차');
  toc.innerHTML = `<div class="head"><span>GYEOLLAK · CONTENTS</span><button type="button">CLOSE ✕</button></div>
  <div><ol class="list">${CH.map(c => `<li class="ch"><i>${c[0]}</i><b>${c[1]}</b><span>${c[2]}</span></li>` + P.map((p, i) => p[1] !== c[0] ? '' : `<li><a href="${p[4]}" data-i="${i}" class="${i === cur ? 'cur' : ''}"><i></i><b>${p[2]}</b><span>${p[3]}</span></a></li>`).join('')).join('')}</ol>
  <p class="foot" style="padding:0 clamp(16px,4vw,56px)"><a href="colophon.html" style="color:inherit">COLOPHON — 로고 · 색 · 글꼴 · 크레딧 →</a><br>SITE DRAFT v14 · 5 CHAPTERS · allones</p></div>
  <div class="pv">${P.map((p, i) => `<img src="${p[5]}" alt="" data-i="${i}" loading="lazy">`).join('')}<p></p></div>`;
  document.body.prepend(toc); document.body.prepend(gh);
  const btn = gh.querySelector('.idx-btn'), imgs = [...toc.querySelectorAll('.pv img')], cap = toc.querySelector('.pv p');
  const show = i => { imgs.forEach((im, k) => im.classList.toggle('on', k === i)); cap.textContent = P[i][6]; };
  show(Math.max(0, cur));
  toc.querySelectorAll('.list a').forEach(a => a.addEventListener('pointerenter', () => show(+a.dataset.i)));
  const open = o => { toc.classList.toggle('on', o); btn.setAttribute('aria-expanded', o); document.documentElement.style.overflow = o ? 'hidden' : ''; if (o) toc.querySelector('.list a').focus(); };
  btn.onclick = () => open(true); toc.querySelector('.head button').onclick = () => open(false);
  addEventListener('keydown', e => { if (e.key === 'Escape') open(false); });
  if (me.dataset.next && cur >= 0) { // 페이지 끝 이전/다음
    const pv = P[(cur + P.length - 1) % P.length], nx = P[(cur + 1) % P.length];
    const f = document.createElement('nav'); f.className = 'gh-next'; f.setAttribute('aria-label', '이전 · 다음');
    f.innerHTML = `<a href="${pv[4]}">← ${pv[1]} PREV<b>${pv[2]}</b></a><a href="${nx[4]}">NEXT ${nx[1]} →<b>${nx[2]}</b></a>`;
    f.insertAdjacentHTML('beforeend', `<a class="colo" href="colophon.html">COLOPHON<b>로고 · 크레딧</b></a>`);
    document.body.appendChild(f);
  }
  if (!me.dataset.noplayer && !window.GYP && window.GYP !== null) { const sc = document.createElement('script'); sc.src = 'js/player.js'; document.body.appendChild(sc); }
})();
