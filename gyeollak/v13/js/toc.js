/* 결락 v13 · 공통 헤더 + 목차. <script src="js/toc.js" data-page="objects" data-next="1"></script> */
(() => {
  const me = document.currentScript, page = me.dataset.page;
  const P = [
    ['film', '00', 'Film', '결락 — 떨어지는 장면', 'index.html', 'img/v12/sky.webp', '구름에서 맺혀, 떨어지고, 심연에서 다시 떠오르기까지.'],
    ['members', '01', 'Members', '네 사람, 네 장면', 'members.html', 'img/v12/ryuhyeon_suit_cy.webp', '문태준 · 채류현 · 채유성 · 하진우. 한 사람에 한 장면.'],
    ['lineup', '02', 'Line-up', '라인업 · 의상 돌려보기', 'lineup.html', 'img/members/yuseong_suit.webp', '사선으로 선 네 사람. 의상을 바꾸고 돌려 본다.'],
    ['album', '03', 'Album', '장마의 잔향 · 곡별 소개', 'album.html', 'img/goods/02-chrome-thorn.webp', '정규 《장마의 잔향》. 곡마다 한 장면.'],
    ['listen', '04', 'Listen', 'CD 플레이어', 'listen.html', 'img/goods/04-x-ray.webp', '케이스를 열고 디스크를 넣는다. 듣는 화면.'],
    ['objects', '05', 'Objects', '굿즈 진열장', 'objects.html', 'img/goods/kr7-panther.webp', '아크릴 진열장 속 CD · 키링 · 인형. 하나씩 꺼내 본다.'],
    ['story', '06', 'Story Film', '물방울 하나가 잇는 필름', 'story.html', 'img/film/case.webp', '한 방울이 여섯 장면을 끝까지 따라간다.'],
    ['play', '07', 'Play', '포켓 미니룸', 'play.html', 'img/goods/kr1-front.webp', '투명 케이스 속 작은 방을 꾸민다.'],
    ['logo', '08', 'Logo', '결 · 로고 시안', 'logo.html', 'img/logo2/A_gyeol_ink_paper.png', '한 획이 빠진 결. 먹 · 크롬 · 마블링 · 인장.'],
  ];
  const cur = P.findIndex(p => p[0] === page);
  document.querySelectorAll('header.hd').forEach(h => { h.style.display = 'none'; h.setAttribute('aria-hidden', 'true'); });
  const gh = document.createElement('header'); gh.className = 'gh';
  gh.innerHTML = `<a class="brand" href="index.html"><b>결락</b>GYEOLLAK</a><span class="here">${cur >= 0 ? P[cur][1] + ' — ' + P[cur][2].toUpperCase() : ''}</span><button class="idx-btn" type="button" aria-haspopup="dialog" aria-expanded="false">INDEX <i><b></b><b></b></i></button>`;
  const toc = document.createElement('div'); toc.className = 'toc'; toc.setAttribute('role', 'dialog'); toc.setAttribute('aria-modal', 'true'); toc.setAttribute('aria-label', '결락 목차');
  toc.innerHTML = `<div class="head"><span>GYEOLLAK · CONTENTS</span><button type="button">CLOSE ✕</button></div>
  <div><ol class="list">${P.map((p, i) => `<li><a href="${p[4]}" data-i="${i}" class="${i === cur ? 'cur' : ''}"><i>${p[1]}</i><b>${p[2]}</b><span>${p[3]}</span></a></li>`).join('')}</ol>
  <p class="foot" style="padding:0 clamp(16px,4vw,56px)">결락: 비가 맺지 못한 것들 · SITE DRAFT v13 · allones</p></div>
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
    document.body.appendChild(f);
  }
})();
