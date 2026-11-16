(()=>{
const{InkCanvas,rng,hash,clamp,lerp}=GyBrush;
const NS='http://www.w3.org/2000/svg',$=s=>document.querySelector(s);
const el=(t,a={},p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e};
const seg=(p,a,b)=>clamp((p-a)/(b-a));
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const brushEase=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const eo=t=>1-Math.pow(1-t,3);
const DPR=()=>Math.min(2,devicePixelRatio||1);

/* ---------- 한지 paper tile ---------- */
(function(){const S=640,cv=document.createElement('canvas');cv.width=cv.height=S;const x=cv.getContext('2d'),r=rng(5);
 x.fillStyle='#F4F1EA';x.fillRect(0,0,S,S);const id=x.getImageData(0,0,S,S),d=id.data;for(let i=0;i<d.length;i+=4){const n=(r()-.5)*9;d[i]+=n;d[i+1]+=n;d[i+2]+=n*1.15}x.putImageData(id,0,0);
 for(let k=0;k<70;k++){const px=r()*S,py=r()*S,R=40+r()*170,g=x.createRadialGradient(px,py,0,px,py,R),dk=r()<.5;g.addColorStop(0,dk?'rgba(214,204,182,.22)':'rgba(255,253,248,.3)');g.addColorStop(1,dk?'rgba(214,204,182,0)':'rgba(255,253,248,0)');x.fillStyle=g;for(const[ox,oy]of[[0,0],[S,0],[-S,0],[0,S],[0,-S],[S,S],[-S,-S],[S,-S],[-S,S]]){x.save();x.translate(ox,oy);x.fillRect(px-R,py-R,2*R,2*R);x.restore()}}
 x.lineCap='round';for(let k=0;k<800;k++){const px=r()*S,py=r()*S,a=r()*6.28,l=5+Math.pow(r(),2.2)*90,cu=(r()-.5)*1.3,tn=r();
  x.strokeStyle=tn<.45?`rgba(255,254,250,${.2+r()*.35})`:tn<.9?`rgba(196,184,160,${.08+r()*.14})`:`rgba(140,128,108,${.07+r()*.1})`;x.lineWidth=.3+r()*.9;
  for(const[ox,oy]of[[0,0],[S,0],[-S,0],[0,S],[0,-S]]){x.beginPath();x.moveTo(px+ox,py+oy);x.quadraticCurveTo(px+ox+Math.cos(a+cu)*l*.5,py+oy+Math.sin(a+cu)*l*.5,px+ox+Math.cos(a)*l,py+oy+Math.sin(a)*l);x.stroke()}}
 document.documentElement.style.setProperty('--paper',`url(${cv.toDataURL('image/jpeg',.9)})`)})();

/* ---------- 01 획 ---------- */
const LINE=[[-60,560],[160,500],[360,540],[560,470],[780,520],[980,450],[1160,488],[1330,430],[1450,392],[1530,330],[1552,268],[1520,226],[1484,240]];
const lineIC=new InkCanvas($('#lineCv'),1600,900,[{pts:LINE,w:44,tail:'taper',dry:.9,B:52,seed:8,entry:true}],{bleed:.2});
const gyIC=new InkCanvas($('#gyCv'),1000,1000,GLYPH_GYEOL);
const ghostG=$('#ghosts');const lc=lineIC.strokes[0].c;const lpath='M'+lc.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' L');
const ghosts=[];for(let k=1;k<=5;k++)ghosts.push(el('path',{d:lpath,stroke:k%2?'#9A9DA3':'#3A3C40','stroke-width':k==1?1.2:.7,opacity:.5/k,transform:`translate(${-k*26} ${k*14})`},ghostG));
const gLen=ghosts[0].getTotalLength();ghosts.forEach(g=>g.style.strokeDasharray=gLen);
const lab=$('#labels');GLYPH_GYEOL.forEach((s,i)=>{const t=el('text',{x:s.pts[0][0]-40,y:s.pts[0][1]-52,opacity:0},lab);t.textContent=String(i+1).padStart(2,'0')+' '+s.j;s.lt=t;s.tk=el('circle',{cx:s.pts[0][0]-8,cy:s.pts[0][1]-8,r:3.5,fill:'#5FB8B0',opacity:0},lab)});
const ST0=.24,STD=.08;
function scene1(p,t){
 lineIC.render([brushEase(seg(p,.02,.21))],t);
 ghosts.forEach((g,k)=>g.style.strokeDashoffset=gLen*(1-ease(seg(p,.03+(k+1)*.012,.24+(k+1)*.01))));
 const out=seg(p,.22,.34),lw=$('#s1 .lw');lw.style.opacity=1-out;lw.style.filter=`blur(${out*4}px)`;lw.style.transform=`translateY(calc(-50% - ${out*6}vh))`;
 $('#grid').setAttribute('opacity',(seg(p,.2,.3)*.5-seg(p,.86,.96)*.38).toFixed(3));
 let n=0;const qs=GLYPH_GYEOL.map((s,i)=>{const a=ST0+i*STD,q=brushEase(seg(p,a,a+STD*.9));if(q>0)n=i+1;const on=seg(p,a-.01,a+.02)*(1-seg(p,.84,.9));s.lt.setAttribute('opacity',on);s.tk.setAttribute('opacity',on);return q});
 gyIC.render(qs,t);
 const sd=seg(p,.2,.3);$('#s1 .side').style.opacity=sd;$('#s1 .count').style.opacity=sd;$('#cnt').textContent=String(n).padStart(2,'0');
 const jam=n==0?-1:n==1?0:n<=4?1:2;['#o1','#o2','#o3'].forEach((o,k)=>$(o).classList.toggle('on',k<=jam));
 const sq=eo(seg(p,.86,.93));$('#seal').setAttribute('opacity',sq);$('#seal').setAttribute('transform',`translate(0 ${18*(1-sq)})`);
 $('#cap1').textContent=p<.23?'One ink line — 하나의 먹선, 금붕어의 잔상':p<.86?'Stroke order — ㄱ → ㅕ → ㄹ · 붓 누름 · 비백 · 번짐':'結 — 선이 결이 되었다';
}

/* ---------- 02 표제 ---------- */
const S2={letters:[]};
const KO_DEFS=[...GLYPH_GYEOL.map(d=>({...d,pts:d.pts.map(([x,y])=>[x*.9+60,y*.9+50]),w:d.w*1.08,seed:d.seed+100})),...GLYPH_RAK.map(d=>({...d,pts:d.pts.map(([x,y])=>[x*.9+1000,y*.9+50]),w:d.w*1.08}))];
const koIC=new InkCanvas($('#koCv'),2000,1000,KO_DEFS);
const nac=$('#nacCv'),nmask=document.createElement('canvas');
function sizeNac(){nac.width=koIC.cv.width;nac.height=koIC.cv.height;nmask.width=nac.width;nmask.height=nac.height}sizeNac();
function buildS2(){const lettersG=$('#enLetters'),clip=$('#enClip'),word='GYEOLLAK',fs=280,base=262;
 const probe=el('text',{'font-family':'Bodoni Moda','font-size':fs},$('#en'));const ws=[...word].map(ch=>{probe.textContent=ch;return probe.getComputedTextLength()});probe.remove();
 const track=14,total=ws.reduce((a,b)=>a+b,0)+track*(word.length-1);let x=(1600-total)/2;
 [...word].forEach((ch,i)=>{const t=el('text',{x:x.toFixed(1),y:base,'font-family':'Bodoni Moda','font-size':fs},lettersG);t.textContent=ch;const c=el('text',{x:x.toFixed(1),y:base,'font-family':'Bodoni Moda','font-size':fs},clip);c.textContent=ch;S2.letters.push({t,c});x+=ws[i]+track})}
let hover=0,mx=-1,my=-1,tmx=-1,tmy=-1;const koEl=$('#ko');
koEl.addEventListener('pointermove',e=>{const r=koEl.getBoundingClientRect();tmx=(e.clientX-r.left)/r.width;tmy=(e.clientY-r.top)/r.height;if(mx<0){mx=tmx;my=tmy}hover=1});koEl.addEventListener('pointerleave',()=>hover=0);
let hv=0;
function scene2(p,t){
 S2.letters.forEach((L,i)=>{const q=eo(seg(p,.02+i*.022,.16+i*.022)),tr=`translate(0 ${((1-q)*300).toFixed(1)})`;L.t.setAttribute('transform',tr);L.c.setAttribute('transform',tr)});
 const f=ease(seg(p,.16,.42)),lvl=lerp(340,-30,f);let d=`M-40 ${lvl}`;for(let x=-40;x<=1640;x+=40)d+=` L${x} ${(lvl+Math.sin(x*.012+t*1.6)*10*(1-f*.6)+Math.sin(x*.031-t*2.3)*5).toFixed(1)}`;$('#enInk').setAttribute('d',d+' L1640 400 L-40 400Z');
 const qs=KO_DEFS.map((_,i)=>{const a=.3+i*.042;return brushEase(seg(p,a,a+.04))});koIC.render(qs,t);
 // 자개 nacre overlay: mouse lens + periodic sweep once written
 mx+=(tmx-mx)*.18;my+=(tmy-my)*.18;hv+=((hover?1:0)-hv)*.12;const sweepOn=seg(p,.86,.92);
 const n=nac.getContext('2d'),W=nac.width,H=nac.height;n.globalCompositeOperation='source-over';n.globalAlpha=1;n.clearRect(0,0,W,H);
 if(hv<.01&&sweepOn<=0)return;
 const m=nmask.getContext('2d');m.clearRect(0,0,W,H);
 if(hv>.01){const g=m.createRadialGradient(mx*W,my*H,0,mx*W,my*H,H*.42);g.addColorStop(0,`rgba(255,255,255,${hv})`);g.addColorStop(.6,`rgba(255,255,255,${hv*.6})`);g.addColorStop(1,'rgba(255,255,255,0)');m.fillStyle=g;m.fillRect(0,0,W,H)}
 if(sweepOn>0){const sx=((t*.16)%1.6-.3)*W;const g=m.createLinearGradient(sx-H*.5,0,sx+H*.5,H*.5);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,255,255,${.9*sweepOn})`);g.addColorStop(1,'rgba(255,255,255,0)');m.fillStyle=g;m.fillRect(0,0,W,H)}
 n.drawImage(koIC.cv,0,0);n.globalCompositeOperation='source-in';
 const a=t*.25,cx=W/2,cy=H/2,R=W*.6,g1=n.createLinearGradient(cx-Math.cos(a)*R,cy-Math.sin(a)*R,cx+Math.cos(a)*R,cy+Math.sin(a)*R);
 ['#5FB8B0','#A6DDD5','#E8ECF0','#D9CFE8','#BFCBEA','#5FB8B0','#E8ECF0','#D9CFE8','#5FB8B0'].forEach((c,i,A)=>g1.addColorStop(i/(A.length-1),c));n.fillStyle=g1;n.fillRect(0,0,W,H);
 n.globalCompositeOperation='source-atop';n.globalAlpha=.45;const g2=n.createLinearGradient(0,H*(.5+.5*Math.sin(t*.4)),W,H*(.5-.5*Math.sin(t*.4)));['#D9CFE8','#5FB8B0','#E8ECF0','#D9CFE8'].forEach((c,i,A)=>g2.addColorStop(i/(A.length-1),c));n.fillStyle=g2;n.fillRect(0,0,W,H);
 n.globalAlpha=1;n.globalCompositeOperation='destination-in';n.drawImage(nmask,0,0);n.globalCompositeOperation='source-over';
}

/* ---------- 03 닿음 (from v1) ---------- */
const S3={chars:[],rchars:[]};
(function(){const lines=['우리는 닿는 순간부터','번지고 있었다'];const sl=$('#slogan'),rf=$('#refl');
 lines.forEach((ln,li)=>{const b=document.createElement('span');b.className='br';const rb=b.cloneNode();
  [...ln].forEach(ch=>{const c=document.createElement('span');c.className='c';c.textContent=ch===' '?'\u00a0':ch;b.appendChild(c);const rc=c.cloneNode(true);rb.appendChild(rc);S3.chars.push(c);S3.rchars.push(rc)});
  if(li==0){const m=document.createElement('span');m.className='c';m.textContent='「';b.prepend(m);S3.chars.unshift(m);const rm=m.cloneNode(true);rb.prepend(rm);S3.rchars.unshift(rm)}
  if(li==1){const m=document.createElement('span');m.className='c';m.textContent='」';b.appendChild(m);S3.chars.push(m);const rm=m.cloneNode(true);rb.appendChild(rm);S3.rchars.push(rm)}
  sl.appendChild(b);rf.appendChild(rb)})})();
S3.rings=[...Array(7)].map((_,i)=>el('ellipse',{cx:800,cy:600,rx:0,ry:0,stroke:i==2?'#5FB8B0':i%2?'#9A9DA3':'#1F2A3A'},$('#rings')));
const spl=[...Array(9)].map((_,i)=>({e:el('circle',{r:2+(i%3)*1.6},$('#splash')),vx:(i-4)*38+((i*37)%11)-5,vy:-(120+((i*53)%90))}));const SY=600;
function scene3(p,t){
 const fall=seg(p,0,.18),y=lerp(-80,SY,fall*fall),dr=$('#drop'),st=1+fall*.35;dr.setAttribute('transform',`translate(800 ${y-32*st}) scale(${1/Math.sqrt(st)} ${st})`);dr.setAttribute('opacity',fall<1?1:0);
 const imp=Math.max(0,p-.18);
 S3.rings.forEach((r,i)=>{const q=clamp((imp-i*.045)/.55),e=eo(q);r.setAttribute('rx',(e*900).toFixed(1));r.setAttribute('ry',(e*95).toFixed(1));r.setAttribute('stroke-width',lerp(2.4,.3,e).toFixed(2));r.setAttribute('opacity',q>0?((1-q)*(i==2?.9:.7)).toFixed(3):0)});
 const sq=seg(p,.18,.32);spl.forEach(s=>{const tt=sq*1.1;s.e.setAttribute('cx',(800+s.vx*tt).toFixed(1));s.e.setAttribute('cy',(SY+s.vy*tt+260*tt*tt).toFixed(1));s.e.setAttribute('opacity',sq>0&&sq<1?1-sq:0)});
 let d='M-20 '+SY;const amp=imp>0?28*Math.exp(-imp*4):0;for(let x=-20;x<=1620;x+=16){const r=Math.abs(x-800);d+=` L${x} ${(SY+amp*Math.sin(r*.035-imp*60)*Math.exp(-r/420)+Math.sin(x*.01+t)*1.2).toFixed(1)}`}$('#surface').setAttribute('d',d);
 const N=S3.chars.length;S3.chars.forEach((c,i)=>{const a=.22+i/N*.5,e=eo(seg(p,a,a+.12));c.style.opacity=e;c.style.filter=`blur(${((1-e)*14).toFixed(2)}px)`;c.style.transform=`translateY(${((1-e)*-.35).toFixed(3)}em) scale(${(1+(1-e)*.25).toFixed(3)})`;
  c.style.textShadow=`0 0 ${(4+(1-e)*30).toFixed(1)}px rgba(31,42,58,${(.5*(1-e)+.08).toFixed(2)})`;const r=S3.rchars[i];r.style.opacity=e*.14;r.style.filter=`blur(${(3+(1-e)*10).toFixed(1)}px)`});
 const rf=$('#refl'),rr=$('#slogan').getBoundingClientRect(),vh=innerHeight,sc=Math.max(innerWidth/1600,vh/900),sy=vh/2+(SY-450)*sc;rf.style.top=(2*sy-rr.bottom)+'px';rf.style.transform=`scaleY(-1) skewX(${Math.sin(t*.8)*1.5}deg)`;
}

/* ---------- 전환: 먹이 모서리에서 번져 화면을 덮는다 ---------- */
const TR={cv:$('#trCv'),field:null,map:document.createElement('canvas')};
function noise2(x,y,seed){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return lerp(lerp(hash(xi,yi,seed),hash(xi+1,yi,seed),ux),lerp(hash(xi,yi+1,seed),hash(xi+1,yi+1,seed),ux),uy)}
function fbm(x,y){return noise2(x,y,17)*.5+noise2(x*2,y*2,19)*.25+noise2(x*4,y*4,23)*.125+noise2(x*8,y*8,29)*.0625+noise2(x*16,y*16,31)*.03125}
function sceneTR(p,t){const cv=TR.cv,dpr=DPR(),W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr),mw=640,mh=Math.round(mw*H/W);
 if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;TR.map.width=mw;TR.map.height=mh;TR.im=TR.map.getContext('2d').createImageData(mw,mh);TR.field=new Float32Array(mw*mh);TR.density=new Float32Array(mw*mh);const D=Math.hypot(mw,mh);
  for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const u=(mw-x)/D,v=y/D,n=fbm(u*5,v*5),n2=fbm(u*13+40,v*13+40);const w1=u+(n-.5)*.25,w2=v+(fbm(u*5+20,v*5+20)-.5)*.25;TR.field[y*mw+x]=Math.hypot(w1,w2)+(n2-.5)*.095;TR.density[y*mw+x]=n2}}
 const c=cv.getContext('2d'),R=ease(seg(p,.04,.91))*1.2,data=TR.im.data;for(let i=0;i<TR.field.length;i++){const dx=R-TR.field[i],q=clamp(dx/.045),a=q*q*(3-2*q),fog=clamp(1-dx/.12),sh=(11+fog*(12+TR.density[i]*25));data[i*4]=sh;data[i*4+1]=sh;data[i*4+2]=sh+fog*2;data[i*4+3]=a*255}
 TR.map.getContext('2d').putImageData(TR.im,0,0);c.clearRect(0,0,W,H);c.filter=`blur(${.65*dpr}px)`;c.drawImage(TR.map,0,0,W,H);c.filter='none';
 const cover=seg(p,.88,.97);if(cover>0){c.globalAlpha=cover;c.fillStyle='#0B0B0C';c.fillRect(0,0,W,H);c.globalAlpha=1}
 const mn=$('#menu');mn.style.opacity=seg(p,.8,.9);[...mn.children].forEach((d,i)=>{const q=eo(seg(p,.8+i*.03,.9+i*.03));d.style.transform=`translateY(${(1-q)*24}px)`;d.style.opacity=q})}

/* ---------- 04 심연: 흰 붓 결 + 수면 반사 + 자개 가장자리 ---------- */
const AB={cv:$("#abCv"),gx:550,gy:104,gs:500};AB.wl=AB.gy+AB.gs*.95;
const abOff=document.createElement('canvas');
const abIC=new InkCanvas(abOff,1000,1000,GLYPH_GYEOL.map(d=>({...d,seed:d.seed+300,fiber:1})),{ink:[232,236,240],bleed:.34,blur:10,tipHi:'rgba(217,207,232,.6)'});
const tintT=document.createElement('canvas'),tintP=document.createElement('canvas');let tintVer=-1;
function layoutAB(){const dpr=DPR(),k4=Math.max(innerWidth*dpr/1600,innerHeight*dpr/900);abIC.layout(Math.round(AB.gs*k4));tintVer=-1}
const S4={ribbons:[],fl:[...document.querySelectorAll('.fl')]};
function buildRibbons(){const r=rng(77),G=$('#ribbons');const strokes=abIC.strokes;
 for(let i=0;i<60;i++){const st=strokes[Math.floor(r()*strokes.length)],q=st.c[Math.floor(r()*st.N)],s=[AB.gx+q[0]/1000*AB.gs,AB.gy+q[1]/1000*AB.gs];
  const full=i%9==0;const lines=[0,1,2,3].map(j=>{const col=full?'url(#nacreLine)':j==0?'#D9CFE8':j==3?'#5FB8B0':'#E8ECF0';return el('path',{stroke:col,'stroke-width':j==0||j==3?.7:.5,opacity:full?.9:j==0||j==3?.55:.42},G)});
  S4.ribbons.push({s,lines,ph:r()*6.28,sp:.7+r()*.6,len:40+r()*55})}}
function field(x,y,t){return Math.sin(x*.0024+t*.15)*1.7+Math.cos(y*.0042-t*.11)*1.3+Math.sin((x-y)*.0015+1.3)*.9}
function scene4(p,t){
 const cv=AB.cv,dpr=DPR(),W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
 const k4=Math.min(W/1250,H/900),ox=(W-1600*k4)/2,oy=(H-900*k4)/2,c=cv.getContext('2d');c.clearRect(0,0,W,H);
 const qs=GLYPH_GYEOL.map((_,i)=>{const a=.02+i*.046;return brushEase(seg(p,a,a+.044))});abIC.render(qs,t);
 const G=abIC.cv;if(tintVer!==abIC.ver){[[tintT,'#5FB8B0'],[tintP,'#D9CFE8']].forEach(([tc,col])=>{tc.width=G.width;tc.height=G.height;const x=tc.getContext('2d');x.drawImage(G,0,0);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,G.width,G.height)});tintVer=abIC.ver}
 const dis=seg(p,.45,.68),A=1-dis,lift=dis*40*k4;
 const px=ox+AB.gx*k4,py=oy+AB.gy*k4-lift,ps=AB.gs*k4,wy=oy+AB.wl*k4;
 if(A>0){
  c.globalAlpha=A*.1;c.filter=`blur(${14*dpr}px)`;c.drawImage(G,px,py,ps,ps);c.filter=dis>0?`blur(${dis*8*dpr}px)`:'none';
  const sh=Math.sin(t*.9)*.5*dpr;c.globalCompositeOperation='lighter';c.globalAlpha=A*.65;c.drawImage(tintT,px-(1.4*dpr+sh),py-.8*dpr,ps,ps);c.drawImage(tintP,px+1.4*dpr+sh,py+.8*dpr,ps,ps);
  c.globalCompositeOperation='source-over';c.globalAlpha=A;c.drawImage(G,px,py,ps,ps);c.filter='none';
  // 수면 반사
  const rh=H-wy,step=2*dpr;for(let y=0;y<rh;y+=step){const sY=wy-y-py;if(sY<0||sY>=ps)continue;const srcY=sY/ps*G.height,off=Math.sin(y*.05/dpr+t*2.1)*(1.2+y*.03/dpr)*dpr;
   c.globalAlpha=A*.36*Math.pow(1-y/rh,1.3);c.drawImage(G,0,srcY,G.width,Math.max(1,step/ps*G.height),px+off,wy+y,ps,step);
   if(y%(8*dpr)<step){c.globalAlpha=A*.12*(1-y/rh);c.drawImage(tintT,0,srcY,G.width,Math.max(1,step/ps*G.height),px+off-4*dpr,wy+y,ps,step)}}
 }
 c.globalAlpha=1;const lg=c.createLinearGradient(0,0,W,0);lg.addColorStop(0,'rgba(232,236,240,0)');lg.addColorStop(.3,'rgba(95,184,176,.35)');lg.addColorStop(.5,'rgba(232,236,240,.6)');lg.addColorStop(.7,'rgba(217,207,232,.35)');lg.addColorStop(1,'rgba(232,236,240,0)');
 c.fillStyle=lg;c.fillRect(0,wy,W,Math.max(1,dpr*.8));
 $('#studio').style.opacity=seg(p,.22,.32)*(1-seg(p,.44,.5));
 const grow=ease(seg(p,.44,.74)),rise=ease(seg(p,.72,.97)),fade=1-seg(p,.9,1)*.6,Rg=$('#ribbons');Rg.setAttribute('opacity',(seg(p,.44,.52)*fade).toFixed(3));Rg.setAttribute('transform',`translate(0 ${(-rise*170).toFixed(1)})`);
 if(grow>0)S4.ribbons.forEach(R=>{const n=Math.max(2,Math.floor(R.len*grow*R.sp+2));let x=R.s[0],y=R.s[1];const P=[[x,y]];
  for(let k=0;k<n;k++){const a=field(x,y,t)+R.ph*.3;x+=Math.cos(a)*9;y+=Math.sin(a)*9+lerp(.6,-3,rise);P.push([x,y])}
  R.lines.forEach((ln,j)=>{let d='';for(let k=0;k<P.length;k++){const a=P[Math.max(0,k-1)],b=P[Math.min(P.length-1,k+1)],an=Math.atan2(b[1]-a[1],b[0]-a[0]),off=(j-1.5)*4.4*Math.cos(k*.11+R.ph+t*.7)*(.3+.7*Math.sin(Math.PI*k/(P.length-1||1)));
   d+=(k?'L':'M')+(P[k][0]-Math.sin(an)*off).toFixed(1)+' '+(P[k][1]+Math.cos(an)*off).toFixed(1)}ln.setAttribute('d',d)})});
 S4.fl.forEach((f,i)=>{const q=eo(seg(p,.74+i*.05,.86+i*.05));f.style.opacity=q;f.style.transform=`translateY(${(1-q)*60}px)`;f.style.filter=`blur(${(1-q)*8}px)`});
}

/* ---------- loop / HUD ---------- */
const secs=['#s1','#s2','#s3','#tr','#s4'].map(s=>$(s)),chipOf=[0,1,2,3,3];
const names=['01 · 획 STROKE','02 · 표제 DISPLAY','03 · 닿음 DROP','— · 번짐 BLOOM','04 · 심연 ABYSS'];
const notes=['Scroll — 금붕어의 잔상이 선이 되고, 선이 결이 된다.','결은 붓글씨가 되고, 먹이 글자를 채운다. 결락 위에 커서를.','떨어지고, 닿고, 번진다.','먹이 모서리에서 번져 화면을 덮는다.','흰 먹의 결이 수면에 비치고, 리본이 되어 꽃으로 떠오른다.'];
const prog=i=>{const s=secs[i],r=s.getBoundingClientRect();return clamp(-r.top/(s.offsetHeight-innerHeight))};
const fns=[scene1,scene2,scene3,sceneTR,scene4];let ready=false,tour=null;
window.GY={starts:()=>secs.map(s=>s.offsetTop),lens:()=>secs.map(s=>s.offsetHeight-innerHeight),ready:()=>ready,T:null,hover:(x,y)=>{tmx=mx=x;tmy=my=y;hover=1;hv=1}};
function frame(now){const t=GY.T??now/1000;let cur=0;
 secs.forEach((s,i)=>{const r=s.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)fns[i](prog(i),t);if(r.top<=innerHeight*.5)cur=i});
 document.body.classList.toggle('dark',cur==4||(cur==3&&prog(3)>.7));$('#hudScene').textContent=names[cur];$('#hudNote').textContent=notes[cur];
 document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',+c.dataset.s===cur||(c.dataset.s==='4'&&cur==3)));
 const tot=document.documentElement.scrollHeight-innerHeight,pc=clamp(scrollY/tot);$('#bar').style.width=pc*100+'%';$('#hudPct').textContent=String(Math.round(pc*100)).padStart(3,'0')+'%';
 if(tour){const q=clamp((now-tour.t0)/1000/44);scrollTo(0,q*tot);if(q>=1)stopTour()}requestAnimationFrame(frame)}
const btn=$('#replay');function stopTour(){tour=null;btn.firstChild.textContent='↻ Replay'}
btn.addEventListener('click',()=>{if(tour){stopTour();return}scrollTo(0,0);tour={t0:performance.now()+600};btn.firstChild.textContent='■ Stop'});
addEventListener('wheel',()=>tour&&stopTour(),{passive:true});addEventListener('touchstart',()=>tour&&stopTour(),{passive:true});
document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{stopTour();const i=+c.dataset.s;scrollTo({top:secs[i].offsetTop+(i==0?0:(secs[i].offsetHeight-innerHeight)*.6),behavior:'smooth'})}));
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{lineIC.layout();gyIC.layout();koIC.layout();sizeNac();layoutAB()},200)});
document.fonts.ready.then(()=>Promise.all([document.fonts.load('400 280px "Bodoni Moda"'),document.fonts.load('300 40px "Noto Serif KR"','우리는닿는순간부터번지고있었다')])).catch(()=>{}).then(()=>{buildS2();layoutAB();buildRibbons();ready=true;requestAnimationFrame(frame)});
})();
