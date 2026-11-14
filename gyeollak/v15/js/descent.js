/* 결락 v10 · DESCENT — 缺落 = 떨어져 나가다.
   스크롤 = 하강. 높은 구름(먹구름) → 빗방울 하나가 떨어짐 → 검은 수면에 부딪혀 파문 → 파문 속에서 꽃이 핌(X-RAY/GLASS)
   → 수면 아래로 → 심연 → 꽃이 방울로 흩어졌다가 ㄱㄹ 로 모임.
   WebGL 셰이더 1장 + 2D 캔버스로 그린 절차적 백합 텍스처 2종 + 타이포 텍스처. 외부 라이브러리 없음. */
(() => {
  'use strict';
  const sec = document.getElementById('descent'); if (!sec) return;
  const pin = sec.querySelector('.dsc-pin'), cv = document.getElementById('dsc');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ── 1. 절차적 백합 (위에서 내려다본 6장 꽃잎) ── */
  function petal(g, L, W, curl) {
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(-W * .9, -L * .18, -W * 1.05, -L * .62, -W * .12 + curl, -L);
    g.bezierCurveTo(W * .78 + curl * .5, -L * .66, W * .95, -L * .2, 0, 0); g.closePath();
  }
  function makeFlower(mode) { // 0 = X-RAY, 1 = GLASS
    const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
    const t = document.createElement('canvas'); t.width = t.height = S; const g = t.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.translate(S / 2, S / 2); g.globalCompositeOperation = 'lighter';
    const P = [];
    for (let i = 0; i < 6; i++) P.push({ a: i * Math.PI / 3 + (i % 2 ? Math.PI / 6 * .0 : 0) + .26, L: i % 2 ? 380 : 430, W: i % 2 ? 150 : 128, c: (i % 2 ? -1 : 1) * 26 });
    P.sort((a, b) => a.L - b.L).reverse();
    P.forEach(p => {
      g.save(); g.rotate(p.a);
      petal(g, p.L, p.W, p.c);
      const gr = g.createLinearGradient(0, 0, 0, -p.L);
      if (mode === 0) { gr.addColorStop(0, 'rgba(255,255,255,.32)'); gr.addColorStop(.3, 'rgba(215,230,255,.17)'); gr.addColorStop(1, 'rgba(190,210,255,.10)'); }
      else { gr.addColorStop(0, 'rgba(23,75,255,.95)'); gr.addColorStop(.45, 'rgba(110,130,255,.55)'); gr.addColorStop(.85, 'rgba(210,190,255,.42)'); gr.addColorStop(1, 'rgba(255,235,250,.5)'); }
      g.fillStyle = gr; g.fill();
      // 잎맥
      for (let k = -8; k <= 8; k++) {
        const u = k / 8; g.beginPath(); g.moveTo(u * 6, -12);
        g.quadraticCurveTo(u * p.W * .95, -p.L * .45, u * p.W * .22 + p.c * .9, -p.L * .93);
        g.strokeStyle = mode === 0 ? `rgba(255,255,255,${k === 0 ? .55 : .15})` : `rgba(255,255,255,${k === 0 ? .4 : .12})`;
        g.lineWidth = k === 0 ? 3 : 1.1; g.stroke();
      }
      // 가는 가로 잎맥 (X-RAY 질감)
      if (mode === 0) for (let j = 1; j < 14; j++) {
        const y = -p.L * j / 14, w = p.W * Math.sin(Math.PI * j / 14) * .9;
        g.beginPath(); g.moveTo(-w, y + 8); g.quadraticCurveTo(0, y - 10, w, y + 8); g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; g.stroke();
      }
      petal(g, p.L, p.W, p.c); g.strokeStyle = mode === 0 ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.9)'; g.lineWidth = mode === 0 ? 2 : 3; g.stroke();
      g.restore();
    });
    // 수술 6 + 암술 1
    for (let i = 0; i < 7; i++) {
      const a = i * Math.PI * 2 / 6 + .55, len = i === 6 ? 330 : 270 + (i % 3) * 18, aa = i === 6 ? -.4 : a;
      const ex = Math.cos(aa) * len, ey = Math.sin(aa) * len;
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(aa + .35) * len * .55, Math.sin(aa + .35) * len * .55, ex, ey);
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = i === 6 ? 4 : 2.2; g.stroke();
      g.save(); g.translate(ex, ey); g.rotate(aa + Math.PI / 2);
      g.beginPath(); if (i === 6) { for (let k = 0; k < 3; k++) { g.moveTo(0, 0); g.arc(Math.cos(k * 2.1) * 9, Math.sin(k * 2.1) * 9, 9, 0, 7); } } else g.ellipse(0, 0, 22, 8, 0, 0, 7);
      g.fillStyle = mode === 0 ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.85)'; g.fill(); g.restore();
    }
    const core = g.createRadialGradient(0, 0, 0, 0, 0, 120); core.addColorStop(0, mode === 0 ? 'rgba(255,255,255,.22)' : 'rgba(180,200,255,.5)'); core.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = core; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill();
    // 합성: 원본 + 번짐(glow)
    const o = c.getContext('2d'); o.fillStyle = '#000'; o.fillRect(0, 0, S, S); o.drawImage(t, 0, 0);
    o.globalCompositeOperation = 'lighter'; o.filter = 'blur(16px)'; o.globalAlpha = mode === 0 ? .55 : .45; o.drawImage(t, 0, 0);
    o.filter = 'none'; o.globalAlpha = 1;
    if (mode === 0) { // X-ray 필름 입자
      const id = o.getImageData(0, 0, S, S), d = id.data;
      for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 26 * (d[i] / 255); d[i] += n; d[i + 1] += n; d[i + 2] += n; }
      o.putImageData(id, 0, 0);
    }
    return c;
  }
  function makeType() {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 2048, 1024); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'italic 400 330px "Instrument Serif", serif'; g.fillText('Gyeollak', 1024, 470);
    g.font = '500 54px "Pretendard", sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)';
    g.fillText('缺 落   ·   결 락   ·   to fall away', 1024, 760);
    return c;
  }

  /* ── 2. WebGL ── */
  const VS = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;
varying vec2 vUv;uniform vec2 uR;uniform float uT,uP,uG,uM;uniform vec4 uBox;uniform sampler2D uF0,uF1,uTx;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
float ss(float a,float b,float x){return smoothstep(a,b,x);}
vec3 sky(vec2 s,float p){vec2 q=vec2(s.x,s.y+p*1.8);
 vec2 w=vec2(fbm(q*1.2+vec2(0.,uT*.02)),fbm(q*1.2+vec2(5.2,1.3)-vec2(uT*.015,0.)));
 float f=fbm(q*1.5+w*1.9+vec2(uT*.01,0.));
 float ink=ss(.40-.14*p,.62-.1*p,f);ink=pow(ink,.8);
 float fil=pow(1.-abs(sin((f+w.x)*26.)),16.)*ss(.38,.62,f)*.55;
 vec3 paper=vec3(.925,.935,.952)-.035*fbm(s*7.);
 float bands=.5+.5*sin((s.y+w.y*.7)*18.);paper-=vec3(.035)*ss(.8,1.,bands)*(1.-ink);
 vec3 inkc=vec3(.03,.035,.045);
 vec3 col=mix(paper,inkc,ink*(.82+.18*f));col=mix(col,paper*.82,ss(.25,.4,f)*(1.-ink)*.6);col=mix(col,inkc,fil*(1.-ink));
 return col;}
float rain(vec2 s,float amt){vec2 q=vec2(s.x*110.,s.y);float id=floor(q.x);float hh=h21(vec2(id,1.));if(hh>amt)return 0.;
 float y=fract(s.y*1.3+uT*(1.6+hh)+hh*7.);float w=1.-abs(fract(q.x)-.5)*2.;return ss(.82,1.,y)*ss(.5,1.,w)*.4;}
vec4 flw(vec2 f,float m){if(f.x<0.||f.y<0.||f.x>1.||f.y>1.)return vec4(0.);vec3 c=mix(texture2D(uF0,f).rgb,texture2D(uF1,f).rgb,m);return vec4(c,max(c.r,max(c.g,c.b)));}
float caustic(vec2 q){vec2 p=mod(q*6.28318,6.28318)-250.;vec2 i=p;float c=1.,inten=.005;for(int n=0;n<4;n++){float t=uT*.35*(1.-(3.5/float(n+1)));
 i=p+vec2(cos(t-i.x)+sin(t+i.y),sin(t-i.y)+cos(t+i.x));c+=1./length(vec2(p.x/(sin(i.x+t)/inten),p.y/(cos(i.y+t)/inten)));}
 c/=4.;c=1.17-pow(c,1.4);return clamp(pow(abs(c),8.),0.,1.);}
void main(){
 vec2 uv=vec2(vUv.x,1.-vUv.y);float asp=uR.x/uR.y;float g=uG;float p=uP;
 vec2 cell=floor(uv*vec2(14.,26.));if(h21(cell+floor(uT*11.))<g*.45){uv.x+=(h21(cell+3.1)-.5)*.25*g;uv.y+=(h21(cell+5.7)-.5)*.05*g;}
 float row=floor(uv.y*70.);if(h21(vec2(row,floor(uT*14.)))<g*.3)uv.x+=(h21(vec2(row,2.))-.5)*.12*g;
 vec2 s=(uv-.5)*vec2(asp,1.);
 float wTop=ss(.31,.39,p),under=ss(.58,.70,p),abyss=ss(.76,.96,p);
 /* A: 하늘·낙하 (옆에서 본 시점) */
 vec3 colA=vec3(0.);
 if(wTop<1.){colA=sky(s,p);
  colA-=rain(s,ss(.03,.3,p)*.45+.05)*.55;
  float fy=mix(.75,.21,ss(.2,.31,p))-1.1*ss(.315,.36,p)+(fbm(vec2(s.x*1.6,uT*.08))-.5)*.35;
  float fe=ss(-.04,.04,s.y-fy);colA=mix(colA,vec3(.012,.014,.02)+.02*fbm(s*5.),fe);
  float dp=ss(.10,.31,p);vec2 dpos=vec2(0.,mix(-.65,.2,dp));float on=step(.001,dp)*(1.-ss(.30,.33,p));
  vec2 dd=(s-dpos)*vec2(1.,.62);float r=length(dd);float dm=1.-ss(.008,.014,r);
  colA=mix(colA,vec3(.02,.025,.035),dm*on);colA+=vec3(.9)*(1.-ss(.0,.004,length(s-dpos-vec2(-.003,-.006))))*on;
  float tl=dpos.y-s.y;colA=mix(colA,vec3(.05),(1.-ss(0.,.0025,abs(s.x)))*ss(0.,.03,tl)*(1.-ss(0.,.25,tl))*.6*on);}
 /* B: 수면 위에서 내려다본 꽃 */
 vec3 colB=vec3(0.);float fa=0.;
 if(wTop>0.){float age=max(0.,p-.33);float rr=length(s);float ph=rr*46.-uT*2.4-age*90.;
  float env=exp(-rr*2.2)*(.35+.65*exp(-age*6.));vec2 dir=rr>0.?s/rr:vec2(0.);
  vec2 sd=s+dir*sin(ph)*.010*env+vec2(n2(s*3.+uT*.2)-.5,n2(s*3.-uT*.2+9.)-.5)*.012;
  colB=vec3(.005,.007,.012)+vec3(.025,.035,.06)*fbm(sd*2.+uT*.03);
  colB+=vec3(.5,.6,.95)*pow(max(0.,sin(ph)),14.)*env*.22;
  float bloom=ss(.36,.56,p);float FSz=mix(.02,.98,bloom)*min(1.,asp*1.05);
  float an=uT*.04+p*2.;mat2 R=mat2(cos(an),-sin(an),sin(an),cos(an));vec2 fs=R*(sd/FSz)+.5;
  float inBox=step(uBox.x,uv.x)*step(uv.x,uBox.z)*step(uBox.y,uv.y)*step(uv.y,uBox.w);float md=abs(uM-inBox);
  float ca=(.004+g*.03+.006*env)/FSz;vec4 fg=flw(fs,md);vec3 fc=vec3(flw(fs+dir*ca,md).r,fg.g,flw(fs-dir*ca,md).b);fa=fg.a*bloom;
  float TW=min(asp*.94,1.7);vec2 tu=sd/vec2(TW,TW*.5)+.5+(fa-.2)*vec2(.02,.012);
  float tin=step(0.,tu.x)*step(tu.x,1.)*step(0.,tu.y)*step(tu.y,1.);
  colB+=texture2D(uTx,tu).rgb*tin*.8*ss(.42,.54,p)*(1.-fa*.65);
  colB+=fc*(.2+.8*bloom)*step(.0001,bloom);
  float fl=exp(-age*16.)*step(.33,p);
  colB+=vec3(.82,.88,1.)*fl*(.012/(abs(s.x)+.002)*exp(-abs(s.y)*35.)+.012/(abs(s.y)+.002)*exp(-abs(s.x)*35.)+exp(-rr*16.)*1.6)*.35;}
 vec3 col=mix(colA,colB,wTop);
 /* C: 수면 아래 → 심연 */
 if(under>0.){float sl=mix(.62,-.62,under)+(n2(vec2(s.x*4.,uT*.5))-.5)*.05;float depth=ss(.62,1.,p);
  vec3 cu=mix(vec3(.01,.035,.09),vec3(.0,.004,.012),depth);
  cu+=vec3(.35,.5,1.)*caustic(s*.6+vec2(0.,p*.5))*.38*(1.-depth*.85);
  float FS2=mix(.92,.34,abyss)*min(1.,asp*1.05);vec2 fu=(s-vec2(0.,mix(-.04,.10,abyss)))/FS2;fu.y=-fu.y;
  float a2=uT*.03;fu=mat2(cos(a2),-sin(a2),sin(a2),cos(a2))*fu+.5;
  float bl=.006+.012*depth;vec3 fsum=vec3(0.);for(int k=0;k<5;k++){float a=float(k)*1.2566;fsum+=flw(fu+vec2(cos(a),sin(a))*bl,uM).rgb;}
  cu+=fsum/5.*mix(vec3(.55,.72,1.),vec3(.3,.4,1.),depth)*(1.-abyss*.6);
  vec2 bq=vec2(s.x*14.,s.y*14.+uT*(1.1-abyss*.9));vec2 bi=floor(bq),bf=fract(bq)-.5;float bh=h21(bi);
  if(bh>.85){vec2 o=vec2(h21(bi+1.)-.5,h21(bi+2.)-.5)*.6;cu+=vec3(.6,.72,1.)*(1.-ss(.025,.05,length(bf-o)))*.45;}
  float lg=exp(-abs(s.y-sl)*90.)*.6;col=s.y>sl?cu+vec3(.6,.75,1.)*lg:col+vec3(.6,.75,1.)*lg;}
 col*=1.-abyss*.3;
 col*=1.-.5*dot(s,s)/(asp*asp*.25+.25);
 col+=(h21(gl_FragCoord.xy+fract(uT*7.)*100.)-.5)*.05;
 gl_FragColor=vec4(col,1.);}`;

  const gl = cv && cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl || RM) { sec.classList.add('dsc-static'); }
  let prog, U = {}, texOK = false;
  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; } return s; }
  function tex(unit, canvas) {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  if (gl && !RM) {
    const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
    prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog); gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uR', 'uT', 'uP', 'uG', 'uM', 'uBox', 'uF0', 'uF1', 'uTx'].forEach(k => U[k] = gl.getUniformLocation(prog, k));
    tex(0, makeFlower(0)); tex(1, makeFlower(1));
    gl.uniform1i(U.uF0, 0); gl.uniform1i(U.uF1, 1); gl.uniform1i(U.uTx, 2);
    (document.fonts ? Promise.all([document.fonts.load('italic 330px "Instrument Serif"'), document.fonts.load('500 54px "Pretendard"')]).catch(() => {}) : Promise.resolve())
      .then(() => { tex(2, makeType()); texOK = true; });
  }

  /* ── 3. HUD · 캡션 · 스캔 박스 ── */
  const $ = s => sec.querySelector(s);
  const caps = [...sec.querySelectorAll('.dcap')], hud = { alt: $('#hAlt'), tmp: $('#hTmp'), st: $('#hSt'), hum: $('#hHum'), scn: $('#hScn') };
  const logoA = $('.dsc-logo'), mark = $('.dsc-scale i'), box = $('#scanBox'), boxL = box && box.querySelector('b'), cross = $('.dsc-cross'), modeBtn = $('#modeBtn');
  let mode = 0, modeT = 0;
  if (modeBtn) modeBtn.addEventListener('click', () => { mode = 1 - mode; modeBtn.classList.toggle('glass', !!mode); modeBtn.setAttribute('aria-pressed', mode ? 'true' : 'false'); });
  const STAGES = ['HIGH CLOUD', 'RAIN · FALL', 'SURFACE · BLOOM', 'UNDER', 'ABYSS'];

  /* ── 4. ㄱㄹ — 심연에서 꽃이 방울로 흩어졌다 모인다 ── */
  let L = null, tg = [], scat = [];
  const lc = document.getElementById('dscLiquid');
  if (lc && window.GYLiquid && !RM) {
    const { Liquid, markReady, gridTargets } = window.GYLiquid;
    L = new Liquid(lc, { scale: innerWidth <= 720 ? .6 : .5, k: 26, damp: 7, wob: 1, bev: 4, bump: 10, tint: [210, 225, 255], dark: [190, 210, 255], edgeA: 150 });
    markReady.then(M => {
      if (!M) return; tg = gridTargets(.036);
      scat = tg.map(() => { const a = Math.random() * 6.283, r = Math.pow(Math.random(), .6); return [Math.cos(a) * r, Math.sin(a) * r]; });
      L.add(tg.length, i => ({ kf: .6 + Math.random() * .6 }));
      resizeL();
    });
  }
  function resizeL() { if (L) L.resize(pin.clientWidth, pin.clientHeight); }

  /* ── 5. 루프 ── */
  let W = 0, H = 0, P = window.GY_DESCENT_P0 || 0, lastY = scrollY, vel = 0, t0 = performance.now(), live = false, raf = 0, micro = 0, prevT = 0;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, innerWidth <= 720 ? 1.25 : 1);
    W = pin.clientWidth; H = pin.clientHeight;
    if (gl) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); gl.viewport(0, 0, cv.width, cv.height); }
    resizeL();
  }
  const P0 = window.GY_DESCENT_P0 || 0; // v14: 첫 화면(구름·로고)은 Surface 하나만 → 획이 떨어지는 지점부터
  function progress() { const r = sec.getBoundingClientRect(), span = sec.offsetHeight - innerHeight; return P0 + clamp(-r.top / span, 0, 1) * (1 - P0); }
  function frame(now) {
    raf = 0; if (!live) return;
    const t = (now - t0) / 1000, dt = Math.min(.033, (now - (prevT || now)) / 1000); prevT = now;
    const tp = progress(); P += (tp - P) * Math.min(1, dt * 7);
    const dy = Math.abs(scrollY - lastY); lastY = scrollY; vel += (Math.min(1, dy / 90) - vel) * .2;
    if (Math.random() < .004 && P > .4 && P < .6) micro = .35;
    micro *= .9;
    const G = clamp(Math.exp(-Math.pow((P - .335) / .012, 2)) * .9 + Math.exp(-Math.pow((P - .615) / .02, 2)) * .55 + vel * .35 + micro, 0, 1);
    modeT += (mode - modeT) * Math.min(1, dt * 5);
    // 스캔 박스 (박스 안만 반대 렌더링 — RAFXYM 레퍼런스)
    const bOn = sm(.47, .52, P) * (1 - sm(.6, .64, P));
    const bw = Math.min(.24 * H / W, .42), bh = .24;
    const bx = .5 + .2 * Math.sin(t * .33) - bw / 2, by = .46 + .12 * Math.cos(t * .27) - bh / 2;
    const BX = bOn > .5 ? [bx, by, bx + bw, by + bh] : [2, 2, 2, 2];
    if (box) { box.style.opacity = bOn; box.style.transform = `translate(${bx * W}px,${by * H}px)`; box.style.width = bw * W + 'px'; box.style.height = bh * H + 'px'; if (boxL) boxL.textContent = mode ? 'X-RAY' : 'GLASS'; }
    if (gl && texOK) {
      gl.uniform2f(U.uR, cv.width, cv.height); gl.uniform1f(U.uT, t); gl.uniform1f(U.uP, P); gl.uniform1f(U.uG, G); gl.uniform1f(U.uM, modeT);
      gl.uniform4f(U.uBox, BX[0], BX[1], BX[2], BX[3]); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    // HUD
    const above = P < .335;
    const alt = above ? Math.round(4850 * (1 - P / .335)) : -Math.round(Math.pow((P - .335) / .665, 1.4) * 1000);
    if (hud.alt) hud.alt.textContent = (above ? 'ALT: ' : 'DEPTH: ') + alt + 'M';
    if (hud.tmp) hud.tmp.textContent = 'TEMP: ' + (above ? (-14 + P * 40).toFixed(0) : (4 - (P - .335) * 4).toFixed(1)) + '°C';
    const si = P < .14 ? 0 : P < .335 ? 1 : P < .6 ? 2 : P < .76 ? 3 : 4;
    if (hud.st) hud.st.textContent = 'STATE: ' + STAGES[si];
    if (hud.hum) hud.hum.textContent = (98 + Math.min(2, P * 6)).toFixed(1) + '%';
    if (hud.scn) hud.scn.textContent = Math.round(P * 100) + '%';
    pin.classList.toggle('paper', P < .27);
    if (logoA) { const lo = 1 - sm(.04, .12, P); logoA.style.opacity = lo; logoA.style.visibility = lo > .01 ? 'visible' : 'hidden'; logoA.style.transform = `translate(-50%,calc(-50% - ${P * 300}px)) scale(${1 + P * .6})`; }
    if (mark) mark.style.top = (P * 100).toFixed(2) + '%';
    if (cross) cross.style.opacity = sm(.44, .5, P) * (1 - sm(.58, .62, P));
    const win = [[0, .15], [.14, .33], [.38, .6], [.6, .77], [.78, 1.01]];
    caps.forEach((c, i) => { const [a, b] = win[i]; const o = sm(a, a + .03, P) * (1 - sm(b - .03, b, P)); c.style.opacity = o; c.style.visibility = o > .01 ? 'visible' : 'hidden'; c.style.transform = `translateY(${(1 - o) * 18}px)`; });
    // 심연의 ㄱㄹ
    if (L && L.ps.length) {
      const k = sm(.80, .93, P), vis = sm(.74, .8, P);
      const cx = W / 2, cy = H * (.5 + .1 * (1 - k)), R = Math.min(W, H) * .32;
      const asp = (window.GYLiquid.MARK || {}).aspect || .9, lw = Math.min(W * .6, H * .44 / asp, 360), lx = W / 2 - lw / 2, ly = H * .5 - lw * asp / 2;
      L.ps.forEach((q, i) => {
        q.tx = cx + scat[i][0] * R + (lx + tg[i][0] * lw - cx - scat[i][0] * R) * k;
        q.ty = cy + scat[i][1] * R * .8 + (ly + tg[i][1] * lw - cy - scat[i][1] * R * .8) * k;
        q.tr = vis * (k > .5 ? lw * .036 * 1.05 : lw * .036 * .6 + (lw * .036 * .3) * k);
      });
      L.wob = 1.4 - k; L.step(dt); L.render();
    }
    raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver(es => { live = es[0].isIntersecting; if (live && !raf) { prevT = 0; raf = requestAnimationFrame(frame); } }).observe(sec);
  addEventListener('resize', resize); resize();
  addEventListener('scroll', () => {
    const r = sec.getBoundingClientRect(), inV = r.top < innerHeight * .5 && r.bottom > innerHeight * .5;
    if (inV) document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.dataset.s === 'descent'));
  }, { passive: true });
})();
