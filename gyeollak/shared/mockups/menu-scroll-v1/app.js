/* 결락 menu-scroll v1 — one Canvas2D stage drives every scene + transition. */
(()=>{
const Q=new URLSearchParams(location.search);
const SHOT=Q.has('shot');            // deterministic captures
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const seg=(p,a,b)=>clamp((p-a)/(b-a));
const eio=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const eo=t=>1-Math.pow(1-t,3);
const lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- images ---------- */
const SRC={hero:'sc_hero',members:'sc_members',music:'sc_music',world:'sc_world',archive:'sc_archive',
  ln_hero:'ln_hero',ln_members:'ln_members',ln_music:'ln_music',ln_world:'ln_world',ln_archive:'ln_archive',
  mbg:'members_bg',mfg:'members_fg'};
const small=innerWidth<900;
const IMG={};let loaded=0;const total=Object.keys(SRC).length;
for(const [k,f] of Object.entries(SRC)){const im=new Image();im.decoding='async';
  im.src='assets/'+f+((small&&/^sc_/.test(f))?'_sm':'')+'.webp';
  if(f.startsWith('sc_')&&small&&f==='sc_members')im.src='assets/sc_members.webp';
  im.onload=()=>{loaded++;if(k==='hero')sampleHero();};im.onerror=()=>{loaded++};IMG[k]=im;}

/* ---------- canvas ---------- */
const cv=document.getElementById('stage'),ctx=cv.getContext('2d');
const off=document.createElement('canvas'),octx=off.getContext('2d');
const GW=200,GH=112;const mk=document.createElement('canvas');mk.width=GW;mk.height=GH;const mctx=mk.getContext('2d');
const mdata=mctx.createImageData(GW,GH);
const rk=document.createElement('canvas');rk.width=GW;rk.height=GH;const rctx=rk.getContext('2d');const rdata=rctx.createImageData(GW,GH);
let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;
  for(const c of [cv,off]){c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);}
  ctx.setTransform(DPR,0,0,DPR,0,0);octx.setTransform(DPR,0,0,DPR,0,0);layout();}

/* value noise fbm on the mask grid */
function hash(x,y){let h=x*374761393+y*668265263;h=(h^(h>>13))*1274126177;return ((h^(h>>16))>>>0)/4294967295;}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const s=t=>t*t*(3-2*t);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return lerp(lerp(a,b,s(xf)),lerp(c,d,s(xf)),s(yf));}
function fbm(x,y){let v=0,a=.5,f=1;for(let i=0;i<5;i++){v+=a*vnoise(x*f,y*f);a*=.5;f*=2.03;}return v/0.97;}
const NZ=new Float32Array(GW*GH);
for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)NZ[y*GW+x]=fbm(x/22,y/22);
{let mn=1,mx=0;for(const v of NZ){mn=Math.min(mn,v);mx=Math.max(mx,v);}for(let i=0;i<NZ.length;i++)NZ[i]=(NZ[i]-mn)/(mx-mn);}
const nAt=(u,v)=>{const x=clamp(Math.floor(u*GW),0,GW-1),y=clamp(Math.floor(v*GH),0,GH-1);return NZ[y*GW+x];};

/* mask field: value per (u,v) for a mode; A is kept where keep(field,t)>0 */
function field(mode,u,v,n){
  const ar=W/H;const dx=(u-.5)*ar,dy=(v-.5);const d=Math.sqrt(dx*dx+dy*dy)/Math.sqrt(ar*ar*.25+.25);
  if(mode==='blob'||mode==='hole')return d*.7+(n-.5)*.62;
  return n*.82+v*.18; // melt: noise, slight top→bottom drift like ink sinking
}
function keepA(mode,f,t,soft){ // alpha of A
  if(mode==='blob')return clamp((t-f)/soft);          // A inside
  if(mode==='hole')return clamp((f-t)/soft);          // A outside the hole
  return clamp((f-t)/soft);                           // melt
}
function buildMask(mode,t,soft){const D=mdata.data,R=rdata.data;const band=mode==='melt'?.035:.05;
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const i=y*GW+x;const f=field(mode,x/GW,y/GH,NZ[i]);
    D[i*4]=D[i*4+1]=D[i*4+2]=255;D[i*4+3]=keepA(mode,f,t,soft)*255;
    const k=Math.max(0,1-Math.abs(f-t)/band);const k2=k*k;const tint=NZ[(i*7)%NZ.length];
    R[i*4]=tint>.7?95:tint>.55?217:255;R[i*4+1]=tint>.7?184:tint>.55?207:255;R[i*4+2]=tint>.7?176:tint>.55?232:255;R[i*4+3]=k2*k*190;}
  mctx.putImageData(mdata,0,0);rctx.putImageData(rdata,0,0);}
/* range mapping so t=0 → all A, t=1 → all B */
const RANGE={blob:[-.32,1.02],hole:[-.32,1.02],melt:[-.02,1.02]};

/* glint particles */
const GL=[];for(let i=0;i<4200;i++){const u=Math.random(),v=Math.random();GL.push({u,v,n:nAt(u,v),s:Math.random(),c:Math.random(),ph:Math.random()*6.28});}
function glints(mode,t,band,time,alpha=1){
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const g of GL){const f=field(mode,g.u,g.v,g.n);const k=1-Math.abs(f-t)/band;if(k<=0)continue;
    const tw=.55+.45*Math.sin(time*3+g.ph);const a=k*tw*alpha;const r=(.6+g.s*2.4)*(.6+k*.9);
    const x=g.u*W+(Math.sin(g.ph+time)*3),y=g.v*H+(Math.cos(g.ph*1.3+time)*3);
    ctx.fillStyle=g.c<.8?`rgba(255,255,255,${a})`:g.c<.92?`rgba(95,184,176,${a})`:`rgba(217,207,232,${a})`;
    ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();
    if(g.s>.9&&k>.6){ctx.fillStyle=`rgba(255,255,255,${a*.35})`;ctx.fillRect(x-r*5,y-.4,r*10,.8);ctx.fillRect(x-.4,y-r*5,.8,r*10);}
  }ctx.restore();}

/* ---------- scene drawing ---------- */
let mx=0,my=0,smx=0,smy=0;
function cover(c,im,s=1,ox=0,oy=0){if(!im||!im.complete||!im.naturalWidth)return false;
  const r=Math.max(W/im.naturalWidth,H/im.naturalHeight)*s;const w=im.naturalWidth*r,h=im.naturalHeight*r;
  c.drawImage(im,(W-w)/2+ox,(H-h)/2+oy,w,h);return true;}
function drawScene(c,key,lp){ // lp = local progress for Ken Burns
  if(key==='void'){c.fillStyle='#0B0B0C';c.fillRect(0,0,W,H);return;}
  const s=1.1-.06*lp,ox=smx*-14,oy=smy*-10+(.5-lp)*24;
  if(key==='members'){ // two layers: field + four people (real parallax)
    cover(c,IMG.mbg,s+.02,ox*.6,oy*.6);cover(c,IMG.mfg,s+.02,ox*1.6,oy*1.4-lp*16);return;}
  if(!cover(c,IMG[key],s,ox,oy)){c.fillStyle=key.startsWith('ln_')?'#0B0B0C':'#3A3C40';c.fillRect(0,0,W,H);}
}
function composite(a,b,mode,t,lpA,lpB,time,bgFill){
  // B underneath
  if(b){drawScene(ctx,b,lpB);}else{ctx.fillStyle=bgFill||'#0B0B0C';ctx.fillRect(0,0,W,H);}
  const [r0,r1]=RANGE[mode];const tt=lerp(r0,r1,t);const soft=mode==='melt'?.05:.035;
  if(t<1){buildMask(mode,tt,soft);
    octx.globalCompositeOperation='source-over';octx.clearRect(0,0,W,H);drawScene(octx,a,lpA);
    octx.globalCompositeOperation='destination-in';octx.imageSmoothingEnabled=true;octx.drawImage(mk,0,0,W,H);
    octx.globalCompositeOperation='source-over';ctx.drawImage(off,0,0,W,H);}
  if(t>0&&t<1){const a=Math.min(1,Math.min(t,1-t)*8);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*(mode==='melt'?.4:.6);ctx.filter='blur(5px)';ctx.drawImage(rk,0,0,W,H);ctx.filter='none';ctx.globalAlpha=a*.28;ctx.drawImage(rk,0,0,W,H);ctx.restore();
    glints(mode,tt,mode==='melt'?.05:.045,time,a);}
}

/* opening particles: hero pixels converge into place */
let PT=null;
function sampleHero(){const im=IMG.hero;const sw=150,sh=Math.round(150*im.naturalHeight/im.naturalWidth);
  const c=document.createElement('canvas');c.width=sw;c.height=sh;const x=c.getContext('2d');x.drawImage(im,0,0,sw,sh);
  const d=x.getImageData(0,0,sw,sh).data;PT=[];
  for(let j=0;j<sh;j++)for(let i=0;i<sw;i++){const k=(j*sw+i)*4;const u=(i+.5)/sw,v=(j+.5)/sh;
    const dd=Math.hypot(u-.5,(v-.5)*.8);if(dd>.42||Math.random()<.35)continue;
    const ang=Math.random()*6.283,dist=.25+Math.random()*.7;
    PT.push({u,v,c:`rgb(${d[k]},${d[k+1]},${d[k+2]})`,a:ang,dist,del:dd*1.6+Math.random()*.5});}}
function drawParticles(time){if(!PT)return;const T=time/1.0;const r=Math.max(W/1920,H/1080);
  const sw=1920*r,sh=1080*r,x0=(W-sw)/2,y0=(H-sh)/2;const sz=Math.max(2,sw/150*.8);
  for(const p of PT){const k=eio(clamp((T-p.del)/1.5));if(k>=1)continue;const fade=k<.85?1:(1-k)/.15;
    const tx=x0+p.u*sw,ty=y0+p.v*sh;const sp=(1-k);
    const x=tx+Math.cos(p.a+sp*2.2)*p.dist*W*sp,y=ty+Math.sin(p.a+sp*2.2)*p.dist*H*sp;
    ctx.globalAlpha=Math.min(1,k*3)*fade;ctx.fillStyle=p.c;ctx.fillRect(x,y,sz*(1+sp),sz*(1+sp));}
  ctx.globalAlpha=1;}

/* ---------- layout: zones in DOM order ---------- */
let Z=[];const docH=()=>document.documentElement.scrollHeight;
function layout(){Z=[...document.querySelectorAll('[data-stage],[data-trans]')].map(el=>{
  const r=el.getBoundingClientRect();return{el,top:r.top+scrollY,h:r.height,stage:el.dataset.stage,trans:el.dataset.trans,a:el.dataset.a,b:el.dataset.b};});}

/* split huge words into chars */
document.querySelectorAll('[data-split]').forEach(el=>{const t=el.textContent;el.innerHTML=[...t].map(ch=>`<span class="ch-w"><span class="ch">${ch}</span></span>`).join('');});

/* torn paper edges */
function tearPath(w,h,seed,dir){let s=seed;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  const n=260;const pts=[];let y=h*.5;
  for(let i=0;i<=n;i++){const x=w*i/n;y+=(rnd()-.5)*h*.16;y=lerp(y,h*.5+Math.sin(i*.045+seed)*h*.2+Math.sin(i*.17+seed*2)*h*.06,.1);
    const jag=(rnd()<.18?(rnd()-.5)*h*.22:0);pts.push([x,clamp(y+jag,h*.06,h*.94)]);}
  const Y=(yy,o)=>dir==='top'?yy+o:h-yy-o;
  const close=dir==='top'?`L${w} ${h} L0 ${h} Z`:`L${w} 0 L0 0 Z`;
  let edge=`M0 ${Y(pts[0][1],-7).toFixed(1)} `;for(const [x,yy] of pts)edge+=`L${x.toFixed(1)} ${Y(yy,-5-rnd()*6).toFixed(1)} `;edge+=close;
  let body=`M0 ${Y(pts[0][1],4).toFixed(1)} `;for(const [x,yy] of pts)body+=`L${x.toFixed(1)} ${Y(yy,3+rnd()*2).toFixed(1)} `;body+=close;
  let hair='';for(let i=0;i<220;i++){const k=Math.floor(rnd()*n);const [x,yy]=pts[k];const L=3+rnd()*12;const a=(rnd()-.5)*1.6;const sy=Y(yy,-6);
    const ex=x+Math.sin(a)*L,ey=sy+(dir==='top'?-1:1)*Math.cos(a)*L;hair+=`M${x.toFixed(1)} ${sy.toFixed(1)} Q${((x+ex)/2+(rnd()-.5)*4).toFixed(1)} ${((sy+ey)/2).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} `;}
  return {edge,body,hair};}
document.querySelectorAll('.tear').forEach((svg,i)=>{const w=1440,h=120;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const dir=svg.classList.contains('top')?'top':'bottom';const p=tearPath(w,h,1234+i*977,dir);
  svg.innerHTML=`<defs><filter id="tsh${i}" x="-2%" y="-60%" width="104%" height="220%"><feGaussianBlur stdDeviation="7"/></filter></defs><path class="shd" filter="url(#tsh${i})" transform="translate(0,${dir==='top'?-4:4})" d="${p.edge}"/><path class="hair" d="${p.hair}"/><path class="edge" d="${p.edge}"/><path class="body" d="${p.body}"/>`;});

/* ink waveform */
const wave=document.querySelector('.wave path');

/* ---------- DOM refs ---------- */
const idx=document.getElementById('idx'),frame=document.getElementById('frame'),capEl=document.getElementById('cap');
const lis=[...idx.querySelectorAll('li')];const menuA=[...document.querySelectorAll('.menu a')];
const scenes=[...document.querySelectorAll('.scene,#open')].map(el=>({el,st:el.querySelector('.sticky'),huge:el.querySelector('.huge'),chs:[...el.querySelectorAll('.ch')],
  sub:el.querySelector('.sub'),box:el.querySelector('.box'),objs:[...el.querySelectorAll('.obj')],slogan:el.querySelector('.slogan')}));
const toneEls=[...document.querySelectorAll('[data-tone]')];
const capEls=[...document.querySelectorAll('[data-cap]')];
let idxNat=null;
function measureIdx(){idx.style.transform='none';const r=idx.getBoundingClientRect();idxNat=r;}

/* nav */
document.querySelectorAll('[data-go]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const k=a.dataset.go;
  const el=k==='open'?document.body:document.querySelector('#'+k+' .scene');const y=k==='open'?0:el.getBoundingClientRect().top+scrollY+innerHeight*.55;
  window.scrollTo({top:y,behavior:SHOT?'auto':'smooth'});}));
document.querySelector('.sound').addEventListener('click',e=>{const b=e.currentTarget;const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);b.querySelector('i').textContent=on?'(on)':'(off)';});
addEventListener('pointermove',e=>{mx=e.clientX/W-.5;my=e.clientY/H-.5;trail.push({x:e.clientX,y:e.clientY,t:performance.now()});});

/* ink cursor trail */
const cc=document.getElementById('cursor'),cx=cc.getContext('2d');const trail=[];
function cursorDraw(now){cc.width!==W*DPR&&(cc.width=W*DPR,cc.height=H*DPR);cx.setTransform(DPR,0,0,DPR,0,0);cx.clearRect(0,0,W,H);
  while(trail.length&&now-trail[0].t>650)trail.shift();if(trail.length<2)return;
  const dark=document.body.dataset.ui==='dark';cx.lineCap='round';
  for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i];const k=1-(now-b.t)/650;
    cx.strokeStyle=dark?`rgba(232,236,240,${k*.7})`:`rgba(11,11,12,${k*.75})`;cx.lineWidth=.6+k*2.4;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke();}}

/* ---------- main loop ---------- */
const T0=performance.now();let curKey='open';
function frameLoop(now){
  const time=SHOT?6:(now-T0)/1000;const y=scrollY;const vh=H;
  smx+=(mx-smx)*.06;smy+=(my-smy)*.06;
  if(!idxNat)measureIdx();

  /* --- stage --- */
  const ref=y+vh*.5;let z=Z.find(z=>ref>=z.top&&ref<z.top+z.h)||(ref<(Z[0]?.top||0)?Z[0]:Z[Z.length-1]);
  if(z){const lp=clamp((ref-z.top)/z.h);
    if(z.trans){
      if(z.trans==='melt'){ // A → line-art(A) → B
        if(lp<.45)composite(z.a,'ln_'+z.a,'melt',seg(lp,.04,.45),1,0,time);else if(lp<.55){drawScene(ctx,'ln_'+z.a,0);glints('melt',(lp-.45)*10,.2,time,.35);}else composite('ln_'+z.a,z.b,'melt',seg(lp,.55,.96),0,0,time);
      }else composite(z.a,z.b,'hole',seg(lp,.06,.94),1,0,time);
    }else if(z.stage==='hero'){
      const pO=clamp(y/(z.h-vh));const load=SHOT?1:eo(clamp((time-.5)/2.6));
      const t=clamp(.42*load+eo(seg(pO,0,.36))*.6);
      if(t>=1)drawScene(ctx,'hero',pO);else composite('void','hero','hole',t,0,pO,time); // hero appears through an opening in the dark
      if(!SHOT&&time<4.6)drawParticles(time);
    }else drawScene(ctx,z.stage,lp);
  }

  /* --- opening frame + index docking --- */
  const oz=Z[0];const pO=oz?clamp(y/(oz.h-vh)):0;const load=SHOT?1:eo(clamp((time-1.1)/1.4));
  const frIn=load,frOut=1-seg(pO,.5,.72);frame.style.opacity=(frIn*frOut).toFixed(3);
  frame.style.transform=`translate(-50%,-50%) scale(${(1+seg(pO,.5,.72)*.06).toFixed(4)})`;
  const dock=eio(seg(pO,.52,.86));
  if(idxNat){const fr=frame.getBoundingClientRect();const tx=(W/2-idxNat.width/2)-idxNat.left;const ty=(H/2+430/2-24-idxNat.height-(W<820?40:0))-idxNat.top;
    idx.style.transform=`translate3d(${(tx*(1-dock)).toFixed(1)}px,${(ty*(1-dock)).toFixed(1)}px,0)`;idx.style.opacity=(dock>0?1:load).toFixed(3);}
  const sl=scenes[0].slogan;if(sl){const a=seg(pO,.62,.8)*(1-seg(pO,.94,1));sl.style.opacity=a.toFixed(3);sl.style.transform=`translateY(${((1-a)*30).toFixed(1)}px)`;}

  /* --- per-scene choreography --- */
  for(const s of scenes){const r=s.el.getBoundingClientRect();if(r.bottom<-vh||r.top>vh*2)continue;
    const p=clamp(-r.top/(r.height-vh));const ent=clamp((vh-r.top)/vh);
    for(const o of s.objs){const d=+getComputedStyle(o).getPropertyValue('--d')||.5;const yy=(.5-p)*d*vh*.9+(1-ent)*d*vh*.4;
      o.style.transform=`translate3d(${(smx*-30*d).toFixed(1)}px,${yy.toFixed(1)}px,0) rotate(calc(var(--r) + ${(p*d*14).toFixed(2)}deg))`;}
    if(!s.huge)continue;
    const rise=eo(seg(p,0,.2)),out=eio(seg(p,.4,.56));
    s.huge.style.transform=`translate3d(${(-out*0).toFixed(1)}px,${((1-rise)*38-out*28).toFixed(2)}vh,0) scale(${(1-out*.35).toFixed(4)})`;
    s.huge.style.opacity=(1-out).toFixed(3);
    s.chs.forEach((c,i)=>{const k=eo(seg(p,.02+i*.03,.18+i*.03));c.style.transform=`translateY(${((1-k)*105).toFixed(1)}%) rotate(${((1-k)*6).toFixed(2)}deg)`;c.style.filter=`blur(${((1-k)*10).toFixed(1)}px)`;c.style.opacity=k.toFixed(3);});
    const si=eo(seg(p,.5,.66));s.sub.style.opacity=si.toFixed(3);s.sub.style.transform=`translate3d(0,${((1-si)*40).toFixed(1)}px,0)`;s.sub.style.filter=`blur(${((1-si)*8).toFixed(1)}px)`;
    const bi=eio(seg(p,.56,.78));s.box.style.opacity=Math.min(1,bi*1.6).toFixed(3);
    s.box.style.transform=`translate(-50%,-50%) translate3d(${(bi*4).toFixed(2)}vw,${((1-bi)*22).toFixed(2)}vh,0) scale(${(.62+bi*.38).toFixed(4)})`;
    s.box.style.clipPath=`inset(${((1-bi)*50).toFixed(2)}% ${((1-bi)*8).toFixed(2)}% 0 ${((1-bi)*8).toFixed(2)}%)`;
  }

  /* --- active category, tones, caption --- */
  let key='open';for(const z of Z){if(ref>=z.top){key=z.trans?(clamp((ref-z.top)/z.h)>.5?z.b:z.a):(z.el.closest('[data-key]')?.dataset.key||'open');}}
  key={hero:'open',members:'members',music:'music',world:'world',archive:'archive'}[key]||key;
  document.querySelectorAll('.paper,.end').forEach(p=>{const r=p.getBoundingClientRect();if(r.top<vh*.5&&r.bottom>vh*.5)key=p.closest('[data-key]')?.dataset.key||p.dataset.key||key;});
  if(key!==curKey){curKey=key;}
  lis.forEach(li=>li.classList.toggle('on',li.dataset.k===curKey));menuA.forEach(a=>a.classList.toggle('on',a.dataset.go===curKey));
  const toneAt=py=>{let t='dark';for(const el of toneEls){const r=el.getBoundingClientRect();if(py>=r.top&&py<r.bottom)t=el.dataset.tone;}return t;};
  const bt=pO<.5&&y<vh*2?'light':toneAt(vh-60);document.body.dataset.ui=bt==='light'?'light':'dark';
  document.body.dataset.top=(y<(oz?oz.h-vh*.6:0))?'light':(toneAt(30)==='light'?'light':'dark');
  frame.style.borderColor='rgba(11,11,12,.55)';
  let cap=null;for(const el of capEls){const r=el.getBoundingClientRect();if(r.top<=vh*.5&&r.bottom>vh*.5)cap=el.dataset.cap;}
  if(cap&&capEl.dataset.v!==cap){capEl.dataset.v=cap;const [n,t]=cap.split('|');capEl.querySelector('.cap-n').textContent=n;capEl.querySelector('.cap-t').textContent=t;}

  /* waveform */
  if(wave){let d='M0 12';for(let i=0;i<=80;i++){const x=i*2;const a=Math.sin(i*.35+time*4)*Math.sin(i*.09+time*1.3)*9*Math.exp(-Math.pow((i-40)/34,2));d+=` L${x} ${(12+a).toFixed(2)}`;}wave.setAttribute('d',d);}
  cursorDraw(now);
  if(!SHOT||window.__keepAnim)requestAnimationFrame(frameLoop);
}
window.GY={render:()=>frameLoop(performance.now()),zones:()=>Z.map(z=>({top:z.top,h:z.h,stage:z.stage,trans:z.trans,a:z.a,b:z.b})),loaded:()=>loaded>=total,
  papers:()=>[...document.querySelectorAll('.paper,.end')].map(p=>{const r=p.getBoundingClientRect();return{top:r.top+scrollY,h:r.height};})};
addEventListener('resize',()=>{resize();idxNat=null;});
addEventListener('load',()=>{layout();idxNat=null;});
document.fonts&&document.fonts.ready.then(()=>{layout();idxNat=null;});
resize();requestAnimationFrame(frameLoop);
})();
