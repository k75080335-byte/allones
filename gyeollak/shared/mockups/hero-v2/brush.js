/* 結落 brush engine v2 — bristle simulation on Canvas2D (no WebGL) */
(function(G){
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const gs=(x,c,s)=>Math.exp(-Math.pow((x-c)/s,2));
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function hash(a,b,c){let h=(a*374761393+b*668265263+c*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296}
function noise1(r){const N=256,v=new Float32Array(N);for(let i=0;i<N;i++)v[i]=r();return x=>{const i=Math.floor(x),f=x-i,a=v[((i%N)+N)%N],b=v[(((i+1)%N)+N)%N],s=f*f*(3-2*f);return a+(b-a)*s}}
function catmull(pts,n=16){const P=[pts[0],...pts,pts[pts.length-1]],o=[];
 for(let i=1;i<P.length-2;i++){const a=P[i-1],b=P[i],c=P[i+1],d=P[i+2];
  for(let j=0;j<n;j++){const t=j/n,t2=t*t,t3=t2*t;o.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)))}}
 o.push(pts[pts.length-1]);return o}
function plen(p){let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return L}
function resample(pts,N){const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
 const T=L[L.length-1],o=[];let j=0;for(let i=0;i<N;i++){const d=T*i/(N-1);while(j<L.length-2&&L[j+1]<d)j++;const u=(d-L[j])/((L[j+1]-L[j])||1);
 o.push([lerp(pts[j][0],pts[j+1][0],u),lerp(pts[j][1],pts[j+1][1],u)])}return o}

class Stroke{
 constructor(raw,o){
  o=this.o=Object.assign({w:60,seed:1,tail:'press',dry:.7,B:60,entry:true,ink:[11,11,12],splat:1,fiber:1},o);
  const w=o.w,r=rng(o.seed*7919+13);
  let pts=raw.slice();if(o.entry){const d0=[raw[1][0]-raw[0][0],raw[1][1]-raw[0][1]],dl0=Math.hypot(...d0)||1,ux=d0[0]/dl0,uy=d0[1]/dl0;pts=[[raw[0][0]-ux*w*.3+uy*w*.2,raw[0][1]-uy*w*.3-ux*w*.2],...raw]}
  let c=catmull(pts,16);const L=plen(c);const N=Math.max(30,Math.round(L/1.6));c=resample(c,N);
  const step=L/(N-1),ext=o.tail==='taper'?Math.round(w*.85/step):0;
  const A=c[N-1],Bp=c[N-6],dx=A[0]-Bp[0],dy=A[1]-Bp[1],dl=Math.hypot(dx,dy)||1;
  for(let i=1;i<=ext;i++)c.push([A[0]+dx/dl*step*i,A[1]+dy/dl*step*i]);
  const M=c.length;this.c=c;this.N=N;this.M=M;this.L=L;
  const ang=new Float32Array(M),s=new Float32Array(M);
  for(let i=0;i<M;i++){const p=c[Math.max(0,i-3)],q=c[Math.min(M-1,i+3)];ang[i]=Math.atan2(q[1]-p[1],q[0]-p[0]);if(i)s[i]=s[i-1]+Math.hypot(c[i][0]-c[i-1][0],c[i][1]-c[i-1][1])}
  const win=Math.max(3,Math.round(w*.3/step)),turn=new Float32Array(M);
  for(let i=0;i<M;i++){let d=ang[Math.min(M-1,i+win)]-ang[Math.max(0,i-win)];d=Math.atan2(Math.sin(d),Math.cos(d));turn[i]=clamp(Math.abs(d)/1.0)}
  const W=new Float32Array(M),wob=noise1(r);const Ltot=s[M-1];
  for(let i=0;i<M;i++){const sE=s[i],sR=L-sE;let pr=.9+.32*gs(sE,w*.38,w*.32)+.24*turn[i];
   if(o.tail==='press'){pr+=.22*gs(sR,w*.42,w*.3);if(sR<w*.2)pr*=.5+.5*Math.max(0,sR)/(w*.2)}
   else{const u=clamp((sE-L*.42)/(Ltot-L*.42));pr*=1-Math.pow(u,1.25)*.985}
   if(sE<w*.16)pr*=.3+.7*sE/(w*.16);
   pr*=1+(wob(sE*.014)-.5)*.18;W[i]=Math.max(.4,w*pr)}
  this.ang=ang;this.s=s;this.turn=turn;this.W=W;
  this.br=[];for(let k=0;k<o.B;k++){let u=(r()+r()-1)*1.05;u=clamp(u,-1,1);
   const dryB=r()<.28;this.br.push({u,load:dryB?.62+.25*r():.95+.35*r(),a:.5+.45*r(),lw:.7+.8*r(),nz:noise1(r),f:(1+2.2*Math.abs(u)*Math.abs(u))/(8+30*r()),ph:r()*300,split:r()<.2?(u>=0?1:-1)*(.5+r()):0,jit:r()*6.28})}
  this.iE=0;while(this.iE<N-1&&s[this.iE]<w*.5)this.iE++;
  this.iP=N-1;while(this.iP>0&&L-s[this.iP]<w*.45)this.iP--;
  this.pools=[];for(let i=win;i<N-win;i++)if(turn[i]>.45&&turn[i]>=turn[i-1]&&turn[i]>turn[i+1])this.pools.push(i);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const mw=Math.max(...W)*.9+w*1.3;c.forEach(p=>{x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])});
  this.bx=x0-mw;this.by=y0-mw;this.bw=x1-x0+2*mw;this.bh=y1-y0+2*mw;this.drawn=0;this.q=0;
 }
 alloc(k){this.k=k;this.cv=document.createElement('canvas');this.cv.width=Math.ceil(this.bw*k);this.cv.height=Math.ceil(this.bh*k);this.ctx=this.cv.getContext('2d');this.clear()}
 clear(){const x=this.ctx;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,this.cv.width,this.cv.height);x.setTransform(this.k,0,0,this.k,-this.bx*this.k,-this.by*this.k);x.lineCap='round';x.lineJoin='round';this.drawn=0}
 lv(b,i){const o=this.o,t=this.s[i]/this.L,s=this.s[i],ss=(a,b2,x)=>{const u=clamp((x-a)/(b2-a));return u*u*(3-2*u)};let v=b.load*(1-o.dry*ss(.4,1.08,t))-.38*Math.abs(b.u)*ss(.25,1,t)-.32*Math.pow(Math.abs(b.u),3)+.4*this.turn[i]+(s<o.w*1.5?.6*(1-s/(o.w*1.5)):0);
  if(o.tail==='press'&&this.L-s<o.w*.6)v+=.3;return v}
 pos(b,i){const o=this.o,W=this.W[i];let off=b.u*W*(.5-.06*b.u*b.u);
  if(b.split){const tt=o.tail==='taper'?clamp((this.s[i]-this.L*.66)/(this.s[this.M-1]-this.L*.66)):clamp((this.s[i]-(this.L-o.w*.7))/(o.w*.7))*.35;off+=b.split*o.w*.15*tt*tt}
  const eu=Math.abs(b.u);off+=Math.sin(this.s[i]*(.035+eu*.05)+b.jit)*W*(.014+.02*eu*eu)*(1+b.nz(this.s[i]*.08+b.ph)-.5);const a=this.ang[i];return[this.c[i][0]-Math.sin(a)*off,this.c[i][1]+Math.cos(a)*off]}
 blob(x,y,R,rot,alpha,seed,ring){const c=this.ctx,[r0,g0,b0]=this.o.ink;c.beginPath();const n=28;
  for(let k=0;k<=n;k++){const a=k/n*6.2832,rr=R*(1+.13*(hash(seed,k%n,3)-.5)+.08*Math.sin(a*3+seed))*(1+.18*Math.cos(2*(a-rot)));const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;k?c.lineTo(px,py):c.moveTo(px,py)}
  c.fillStyle=`rgba(${r0},${g0},${b0},${alpha})`;c.fill();if(ring){c.lineWidth=R*.06;c.strokeStyle=`rgba(${r0},${g0},${b0},${ring})`;c.stroke()}}
 dots(i,n,spread,fwd,seed){const c=this.ctx,[r0,g0,b0]=this.o.ink,a=this.ang[i],w=this.o.w;for(let k=0;k<n;k++){const h1=hash(seed,i,k*4),h2=hash(seed,i,k*4+1),h3=hash(seed,i,k*4+2),h4=hash(seed,i,k*4+3);
  const f=(fwd+(h1-.3)*1.2)*w,sd=(h2-.5)*spread*w,x=this.c[i][0]+Math.cos(a)*f-Math.sin(a)*sd,y=this.c[i][1]+Math.sin(a)*f+Math.cos(a)*sd,R=(.5+Math.pow(h3,2.2)*3.2)*w/60;
  c.beginPath();c.ellipse(x,y,R,R*(.7+.3*h4),h4*3,0,6.2832);c.fillStyle=`rgba(${r0},${g0},${b0},${.55+.4*h4})`;c.fill()}}
 drawRange(i0,i1){const c=this.ctx,o=this.o,B=o.B,[r0,g0,b0]=o.ink;c.strokeStyle=`rgb(${r0},${g0},${b0})`;
  // pre-effects: entry press blob, pools, end press
  if(i0<=this.iE&&i1>=this.iE){const p=this.c[this.iE];this.blob(p[0],p[1],this.W[this.iE]*.27,this.ang[this.iE]+.8,.4,o.seed,0);o.splat&&this.dots(this.iE,3,1.6,-.6,o.seed+5)}
  for(const pi of this.pools)if(i0<=pi&&i1>=pi){const p=this.c[pi];this.blob(p[0],p[1],this.W[pi]*.32,this.ang[pi],.3,o.seed+pi,0);o.splat&&this.dots(pi,4,1.8,.4,o.seed+pi)}
  if(o.tail==='press'&&i0<=this.iP&&i1>=this.iP){const p=this.c[this.iP];this.blob(p[0],p[1],this.W[this.iP]*.3,this.ang[this.iP]+.6,.34,o.seed+99,0)}
  c.strokeStyle=`rgb(${r0},${g0},${b0})`;c.lineCap='butt';for(const b of this.br){let open=false,cnt=0,lws=0,lvl=1,CH=28+((b.ph*7)|0)%20;c.beginPath();
   for(let i=Math.max(1,i0);i<=i1;i++){const l=this.lv(b,i);lvl=l;const vis=b.nz(this.s[i]*b.f+b.ph)<l&&!(i>=this.N&&!b.split&&hash(o.seed,i,b.ph|0)>.25);
    if(vis){if(!open){const p=this.pos(b,i-1);c.moveTo(p[0],p[1]);open=true}const p=this.pos(b,i);c.lineTo(p[0],p[1]);cnt++;lws+=this.W[i]}else open=false;
    if(cnt>=CH||i==i1){if(cnt){c.lineWidth=Math.max(.3,lws/cnt*2.3/B*b.lw);c.globalAlpha=b.a*(1-.55*b.u*b.u)*(.55+.45*clamp(lvl))*(.82+.18*b.nz(this.s[i]*.006+50));c.stroke()}c.beginPath();if(open){const p=this.pos(b,i);c.moveTo(p[0],p[1])}cnt=0;lws=0}}}
  c.globalAlpha=1;c.lineCap='round';
  // fibers: ink wicking into hanji fibers along both edges
  if(o.fiber){c.lineWidth=.45;for(let i=Math.max(1,i0);i<=Math.min(i1,this.N-1);i++)for(const sd of[-1,1]){const h=hash(o.seed,i,sd+7);if(h>.07)continue;
   const a=this.ang[i],W=this.W[i],e=W*.5*(.8+.25*hash(o.seed,i,sd+11)),bx=this.c[i][0]-Math.sin(a)*e*sd,by=this.c[i][1]+Math.cos(a)*e*sd;
   const da=a+sd*(1.57+(hash(o.seed,i,sd+13)-.5)*1.7),ln=(1.5+Math.pow(hash(o.seed,i,sd+17),2)*9)*Math.min(1.3,W/55);
   c.beginPath();c.moveTo(bx,by);c.quadraticCurveTo(bx+Math.cos(da)*ln*.5+(hash(o.seed,i,21)-.5)*3,by+Math.sin(da)*ln*.5,bx+Math.cos(da)*ln,by+Math.sin(da)*ln);
   c.strokeStyle=`rgba(${r0},${g0},${b0},${.12+.2*hash(o.seed,i,sd+19)})`;c.stroke()}}
  if(o.splat&&i0<this.M-1&&i1>=this.M-1)this.dots(this.M-1,o.tail==='taper'?6:4,1.4,o.tail==='taper'?.9:.5,o.seed+77);
 }
}

let FIBER=null;
function fiberTile(){if(FIBER)return FIBER;const cv=document.createElement('canvas');cv.width=cv.height=320;const x=cv.getContext('2d'),r=rng(41);
 const id=x.createImageData(320,320);for(let i=0;i<id.data.length;i+=4){id.data[i]=id.data[i+1]=id.data[i+2]=0;id.data[i+3]=80+r()*120}x.putImageData(id,0,0);
 x.lineCap='round';for(let k=0;k<420;k++){const px=r()*320,py=r()*320,a=r()*6.28,l=10+r()*70;x.strokeStyle=`rgba(0,0,0,${r()<.6?1:.05})`;x.lineWidth=.6+r()*1.6;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+Math.cos(a+.5)*l*.5,py+Math.sin(a+.5)*l*.5,px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke()}
 FIBER=cv;return cv}

class InkCanvas{
 constructor(cv,LW,LH,defs,o){this.cv=cv;this.LW=LW;this.LH=LH;this.defs=defs;this.o=Object.assign({ink:[11,11,12],bleed:.24,blur:9,tipHi:'rgba(255,255,255,.22)'},o);this.layout()}
 layout(pxW){const dpr=Math.min(2,G.devicePixelRatio||1);const w=pxW||Math.max(2,Math.round(this.cv.getBoundingClientRect().width*dpr));
  this.cv.width=w;this.cv.height=Math.round(w*this.LH/this.LW);this.k=w/this.LW;this.ctx=this.cv.getContext('2d');
  this.strokes=this.defs.map(d=>new Stroke(d.pts,Object.assign({ink:this.o.ink},d)));this.strokes.forEach(s=>s.alloc(this.k));
  this.bl=document.createElement('canvas');this.bl.width=Math.ceil(w/2);this.bl.height=Math.ceil(this.cv.height/2);this.blx=this.bl.getContext('2d');this.pat=this.blx.createPattern(fiberTile(),'repeat');this.dirty=true;this.ver=0}
 render(qs,t=0){let ch=this.dirty,tip=false;this.dirty=false;
  this.strokes.forEach((s,i)=>{const q=clamp(qs[i]||0),tg=q<=0?0:Math.round(q*(s.M-1));if(tg<s.drawn){s.clear();ch=true}if(tg>s.drawn){s.drawRange(s.drawn,tg);s.drawn=tg;ch=true}s.q=q;if(q>0&&q<1)tip=true});
  if(!ch&&!tip)return false;this.ver++;
  const c=this.ctx,k=this.k,W=this.cv.width,H=this.cv.height,b=this.blx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);
  b.setTransform(1,0,0,1,0,0);b.globalCompositeOperation='source-over';b.clearRect(0,0,this.bl.width,this.bl.height);b.filter=`blur(${this.o.blur*k*.5}px)`;
  this.strokes.forEach(s=>s.drawn&&b.drawImage(s.cv,s.bx*k*.5,s.by*k*.5,s.cv.width*.5,s.cv.height*.5));b.filter='none';
  b.globalCompositeOperation='destination-in';b.fillStyle=this.pat;b.fillRect(0,0,this.bl.width,this.bl.height);b.globalCompositeOperation='source-over';
  c.globalAlpha=this.o.bleed;c.drawImage(this.bl,0,0,W,H);c.globalAlpha=1;
  this.strokes.forEach(s=>s.drawn&&c.drawImage(s.cv,s.bx*k,s.by*k));
  const[r0,g0,b0]=this.o.ink;c.setTransform(k,0,0,k,0,0);
  this.strokes.forEach(s=>{if(!(s.q>0&&s.q<1))return;const i=s.drawn,p=s.c[i],R=s.W[i]*.56*(1+.05*Math.sin(t*9));
   const gr=c.createRadialGradient(p[0],p[1],0,p[0],p[1],R);gr.addColorStop(0,`rgba(${r0},${g0},${b0},.96)`);gr.addColorStop(.62,`rgba(${r0},${g0},${b0},.7)`);gr.addColorStop(1,`rgba(${r0},${g0},${b0},0)`);
   c.fillStyle=gr;c.beginPath();c.arc(p[0],p[1],R,0,6.2832);c.fill();
   c.fillStyle=this.o.tipHi;c.beginPath();c.ellipse(p[0]-R*.22,p[1]-R*.25,R*.16,R*.08,-.6,0,6.2832);c.fill()});
  c.setTransform(1,0,0,1,0,0);return true}
}
G.GyBrush={Stroke,InkCanvas,rng,hash,noise1,clamp,lerp,catmull,resample};
})(window);
