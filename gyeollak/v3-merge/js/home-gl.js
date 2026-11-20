/* 결락 v3 — 홈 첫 장면. Claude 시안(결락 Liquid Opening)에서 세 가지만 가져왔다:
   ① 로딩과 붓글씨 '결' (atlas 안의 원본 raster, 획 순서대로 드러남)  ② 금붕어 (스프라이트 + 먹 필름)  ③ 손을 따라 번지는 먹 (유체 시뮬, 세기는 원본 그대로).
   수심으로 내려가는 장(심연·개화·멤버 카드·부조 벽)은 뺐다. 캔버스는 이 히어로에만 있고, 히어로가 화면 밖이면 멈춘다.
   품질 단계: high(데스크톱) → low(폰: 시뮬 해상도↓, 먹 필름 대신 스프라이트, 30fps) → static(정지 이미지). 프레임이 떨어지면 자동으로 내려간다. */
(function(){
'use strict';
const G = window.GYK || {};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
let tier = reduced ? 'static' : (MOBILE ? 'low' : 'high');
/* 먹 세기(FORCE·CURL·소산·0.88 농도)는 원본 값 그대로. 폰에서는 격자 해상도와 반복 횟수만 줄였다 */
const CFG = { SIM: MOBILE ? 48 : 128, DYE: MOBILE ? 256 : 720, PIT: MOBILE ? 8 : 18, CURL: 20,
  VDISS: .3, DDISS: .5, PRESSURE: .8, RADIUS: MOBILE ? .0045 : .0028, FORCE: 5200 };
let renderScale = Math.min(devicePixelRatio || 1, MOBILE ? 1 : 1.5);
const P_MAX = 1.9;

const $ = id => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const canvas = $('gl'), hero = $('hero'), loader = $('loader'), ld = $('ld');

let loaderDone = false;
function finishLoader(){ if (loaderDone) return; loaderDone = true; ld.textContent = '100'; loader.classList.add('reveal'); setTimeout(() => { loader.classList.add('done'); document.body.classList.add('loaded'); }, reduced ? 0 : 900); }
loader.addEventListener('click', finishLoader);
setTimeout(finishLoader, 7000);   /* 무슨 일이 있어도 7초 뒤엔 걷힌다 */
let fake = 0; const ldTimer = setInterval(() => { if (loaderDone) return clearInterval(ldTimer); fake = Math.min(94, fake + 6 + Math.random() * 8); ld.textContent = String(Math.round(fake)).padStart(3, '0'); }, 90);

function goStatic(why){
  tier = 'static'; document.documentElement.classList.add('gl-static'); if (why) console.info('[gyk] static hero:', why);
  const im = new Image(); im.onload = im.onerror = finishLoader; im.src = 'img/fx/band.webp';
}

let gl, ext, ok = tier !== 'static';
if (ok){ try { ({ gl, ext } = getContext(canvas)); } catch (e) { ok = false; } if (!gl) ok = false; }
function getContext(c){
  const params = { alpha:false, depth:false, stencil:false, antialias:false, preserveDrawingBuffer:false, powerPreference:'high-performance' };
  let g = c.getContext('webgl2', params); const isGL2 = !!g;
  if (!g) g = c.getContext('webgl', params) || c.getContext('experimental-webgl', params);
  if (!g) return {};
  let halfFloat, linear;
  if (isGL2){ g.getExtension('EXT_color_buffer_float'); linear = g.getExtension('OES_texture_float_linear'); }
  else { halfFloat = g.getExtension('OES_texture_half_float'); linear = g.getExtension('OES_texture_half_float_linear'); }
  const hfType = isGL2 ? g.HALF_FLOAT : (halfFloat && halfFloat.HALF_FLOAT_OES);
  let rgba = null;
  if (hfType){
    rgba = isGL2 ? fmt(g, g.RGBA16F, g.RGBA, hfType) : fmt(g, g.RGBA, g.RGBA, hfType);
  }
  return { gl:g, ext:{ isGL2, hfType, rgba, linear: !!linear || isGL2 } };
}
function fmt(g, internal, format, type){
  const t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
  g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
  g.texImage2D(g.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
  const f = g.createFramebuffer(); g.bindFramebuffer(g.FRAMEBUFFER, f);
  g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, t, 0);
  const good = g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE;
  g.bindFramebuffer(g.FRAMEBUFFER, null); g.deleteFramebuffer(f); g.deleteTexture(t);
  return good ? { internal, format } : null;
}

const VS = `precision highp float;
attribute vec2 aPosition;
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform vec2 texelSize;
void main(){ vUv=aPosition*.5+.5; vL=vUv-vec2(texelSize.x,0.); vR=vUv+vec2(texelSize.x,0.);
 vT=vUv+vec2(0.,texelSize.y); vB=vUv-vec2(0.,texelSize.y); gl_Position=vec4(aPosition,0.,1.); }`;
const HEAD = `precision mediump float; precision mediump sampler2D;
varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;\n`;
const FS = {
  clear: `uniform sampler2D uTexture; uniform float value; void main(){ gl_FragColor=value*texture2D(uTexture,vUv); }`,
  splat: `uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
    void main(){ vec2 p=vUv-point; p.x*=aspectRatio; vec3 s=exp(-dot(p,p)/radius)*color; gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+s,1.); }`,
  advect: `uniform sampler2D uVelocity; uniform sampler2D uSource; uniform highp vec2 texelSize; uniform vec2 dyeTexelSize; uniform float dt; uniform float dissipation;
    vec4 bilerp(sampler2D sam, vec2 uv, vec2 ts){ vec2 st=uv/ts-.5; vec2 iuv=floor(st); vec2 fuv=fract(st);
      vec4 a=texture2D(sam,(iuv+vec2(.5,.5))*ts); vec4 b=texture2D(sam,(iuv+vec2(1.5,.5))*ts);
      vec4 c=texture2D(sam,(iuv+vec2(.5,1.5))*ts); vec4 d=texture2D(sam,(iuv+vec2(1.5,1.5))*ts);
      return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y); }
    void main(){
    #ifdef MANUAL_FILTERING
      vec2 coord=vUv-dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize; vec4 r=bilerp(uSource,coord,dyeTexelSize);
    #else
      vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize; vec4 r=texture2D(uSource,coord);
    #endif
      gl_FragColor=r/(1.+dissipation*dt); }`,
  divergence: `uniform sampler2D uVelocity; void main(){
    float L=texture2D(uVelocity,vL).x; float R=texture2D(uVelocity,vR).x; float T=texture2D(uVelocity,vT).y; float B=texture2D(uVelocity,vB).y;
    vec2 C=texture2D(uVelocity,vUv).xy; if(vL.x<0.)L=-C.x; if(vR.x>1.)R=-C.x; if(vT.y>1.)T=-C.y; if(vB.y<0.)B=-C.y;
    gl_FragColor=vec4(.5*(R-L+T-B),0.,0.,1.); }`,
  curl: `uniform sampler2D uVelocity; void main(){
    float L=texture2D(uVelocity,vL).y; float R=texture2D(uVelocity,vR).y; float T=texture2D(uVelocity,vT).x; float B=texture2D(uVelocity,vB).x;
    gl_FragColor=vec4(.5*(R-L-T+B),0.,0.,1.); }`,
  vorticity: `uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt; void main(){
    float L=texture2D(uCurl,vL).x; float R=texture2D(uCurl,vR).x; float T=texture2D(uCurl,vT).x; float B=texture2D(uCurl,vB).x; float C=texture2D(uCurl,vUv).x;
    vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L)); f/=length(f)+.0001; f*=curl*C; f.y*=-1.;
    vec2 v=texture2D(uVelocity,vUv).xy+f*dt; v=min(max(v,-1000.),1000.); gl_FragColor=vec4(v,0.,1.); }`,
  pressure: `uniform sampler2D uPressure; uniform sampler2D uDivergence; void main(){
    float L=texture2D(uPressure,vL).x; float R=texture2D(uPressure,vR).x; float T=texture2D(uPressure,vT).x; float B=texture2D(uPressure,vB).x;
    gl_FragColor=vec4((L+R+B+T-texture2D(uDivergence,vUv).x)*.25,0.,0.,1.); }`,
  gradient: `uniform sampler2D uPressure; uniform sampler2D uVelocity; void main(){
    float L=texture2D(uPressure,vL).x; float R=texture2D(uPressure,vR).x; float T=texture2D(uPressure,vT).x; float B=texture2D(uPressure,vB).x;
    vec2 v=texture2D(uVelocity,vUv).xy-vec2(R-L,T-B); gl_FragColor=vec4(v,0.,1.); }`
};

/* 장면: 수면 위 네 사람 사진(바람) + 붓글씨 '결' + 금붕어 + 구름 + 먹 필름 + 손 먹. 한 번에 그린다 */
const R = { band:'0.,0.,1.,.42432', gyeol:'.75098,.42578,.23438,.23438', fish:'.24121,.75977,.25,.16797', cloud:'.49316,.75977,.25,.13965' };
const SCENE = `precision highp float;
varying vec2 vUv;
uniform sampler2D uAtlas; uniform sampler2D uDye; uniform sampler2D uVel;
uniform float uTime; uniform float uP; uniform float uAspect; uniform float uIntro; uniform vec2 uRes;
uniform vec4 uFish; uniform vec2 uFishS;
uniform sampler2D uLeap; uniform float uLeapOn; uniform float uLeapAsp;
const vec4 R_BAND=vec4(${R.band}); const vec4 R_GYEOL=vec4(${R.gyeol}); const vec4 R_FISH=vec4(${R.fish}); const vec4 R_CLOUD=vec4(${R.cloud});
const vec3 INK=vec3(.065,.075,.095); const vec3 SKY=vec3(.996,.969,.906); const vec3 GRASS=vec3(.055,.172,.18);
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y); }
float fbm(vec2 p){ float v=0.; float a=.5; for(int i=0;i<OCT;i++){ v+=a*noise(p); p=p*2.03+vec2(17.1,9.2); a*=.5; } return v; }
vec4 atl(vec4 r, vec2 uv){ float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
  return texture2D(uAtlas, r.xy+clamp(uv,vec2(.003),vec2(.997))*r.zw)*inside; }
vec2 place(vec2 p, vec2 c, vec2 sz){ vec2 q=(p-c)/sz; return vec2(q.x+.5,.5-q.y); }
mat2 rot(float a){ float c=cos(a); float s=sin(a); return mat2(c,s,-s,c); }
void main(){
  vec2 p=(vUv-.5)*vec2(uAspect,1.);
  float t=uTime; float P=uP; float sx=min(uAspect,1.);
  float portrait=step(uAspect,1.);
  vec2 vel=texture2D(uVel,vUv).xy;
  vec3 dye=texture2D(uDye,vUv).rgb;
  float dk=clamp(max(dye.r,max(dye.g,dye.b)),0.,1.);
  vec2 pw=p-vel*WARP;
  /* 수면: 네 사람 사진, 풀에만 바람 */
  float bw=mix(uAspect,uAspect*1.5,portrait); float bh=bw/2.357; float bcy=mix(-.5+bh*.5,-.06,portrait);
  vec2 buv=place(pw,vec2(0.,bcy),vec2(bw,bh));
  float gm=smoothstep(.52,.86,buv.y);
  buv.x+=(fbm(vec2(buv.x*9.-t*.55,buv.y*5.+t*.2))-.5)*.006*gm;
  buv.y+=(noise(vec2(buv.x*14.-t*.9,t*.3))-.5)*.004*gm;
  vec3 light=mix(SKY,vec3(.94,.915,.86),smoothstep(.5,-.4,p.y)*.35);
  vec4 bs=atl(R_BAND,buv);
  if(buv.y>1.) light=GRASS*(.85+.3*fbm(p*7.+vec2(t*.05,0.)));
  bs.a*=smoothstep(0.,.14,buv.y); light=mix(light,bs.rgb,bs.a);
  /* 붓글씨 결: 획 순서대로 젖으며 드러난다 */
  float gs=mix(.36,min(.31,uAspect*.64),portrait);
  vec2 guv=place(pw,vec2(0.,mix(.27,.29,portrait)),vec2(gs));
  vec4 g=atl(R_GYEOL,guv);
  float o=.02;
  float halo=(atl(R_GYEOL,guv+vec2(o,0.)).a+atl(R_GYEOL,guv-vec2(o,0.)).a+atl(R_GYEOL,guv+vec2(0.,o)).a+atl(R_GYEOL,guv-vec2(0.,o)).a)*.25;
  float ord=(guv.x*.55+guv.y*.45)*.78+fbm(guv*5.)*.32;
  float rev=smoothstep(ord-.035,ord+.035,uIntro*1.2);
  float wet=halo*smoothstep(ord-.3,ord,uIntro*1.2)*(.16+.14*fbm(guv*14.))*(1.-g.a);
  light=mix(light,INK,wet);
  light=mix(light,g.rgb*.9,g.a*rev);
  /* 금붕어 */
  if(uFish.w>.001){
    vec2 lp=rot(-uFish.z)*(pw-uFish.xy);
    vec2 fuv=vec2(lp.x/uFishS.x+.5,.5-lp.y/uFishS.y);
    fuv.x+=sin(fuv.y*9.-t*7.)*.016*fuv.y;
    vec4 fs=atl(R_FISH,fuv);
    light=mix(light,fs.rgb*.85,fs.a*uFish.w);
  }
  float cP=smoothstep(1.02,1.42,P);
  vec2 cuv=place(pw+vec2(t*.004,0.),vec2(.16*sx,.36),vec2(1.,.56)*max(sx,.75));
  vec4 cs=atl(R_CLOUD,cuv);
  float cn=fbm(cuv*4.+3.);
  light=mix(light,cs.rgb,cs.a*smoothstep(cn-.08,cn+.08,cP*1.15)*(1.-uLeapOn));
  /* 힉스필드 먹 필름: 흰 종이는 빠지고 먹만 장면에 앉는다 (스크롤로 넘김) */
  if(uLeapOn>.001){
    vec2 lq=vUv-.5-vel*.00018;
    if(uAspect>uLeapAsp) lq.y*=uLeapAsp/uAspect; else lq.x*=uAspect/uLeapAsp;
    vec3 lv=texture2D(uLeap,vec2(lq.x+.5,.5-lq.y)).rgb;
    float ink=smoothstep(.14,.9,1.-dot(lv,vec3(.299,.587,.114)));
    float la=uLeapOn*smoothstep(.4,.55,P)*(1.-smoothstep(1.75,1.9,P));
    light=mix(light,INK*(1.+.35*(1.-ink)),ink*la);
  }
  light=mix(light,INK,dk*.88);                 /* 손 먹 (원본 세기) */
  vec3 col=light;
  col+=(hash(vUv*uRes+fract(t))-.5)*.028;
  col*=1.-.14*pow(length(vUv-.5)*1.25,2.5);
  gl_FragColor=vec4(col,1.);
}`;

if (ok){ try { boot(); } catch (e) { console.warn('[gyk] WebGL boot failed', e); ok = false; } }
if (!ok) goStatic(reduced ? 'reduced-motion' : 'no WebGL');

function boot(){
  const OCT = MOBILE ? 3 : 4;
  const FLUID = !!ext.rgba;
  const filt = ext.linear ? gl.LINEAR : gl.NEAREST;
  const defs = ext.linear ? '' : '#define MANUAL_FILTERING\n';
  function sh(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  const vsh = sh(gl.VERTEX_SHADER, VS);
  function prog(src){
    const p = gl.createProgram(); gl.attachShader(p, vsh); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, src));
    gl.bindAttribLocation(p, 0, 'aPosition'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++){ const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u, use(){ gl.useProgram(p); return u; } };
  }
  const scene = prog('#define OCT ' + OCT + '\n#define WARP ' + (MOBILE ? '.00016' : '.00026') + '\n' + SCENE);
  const pr = {};
  if (FLUID){ for (const k in FS) pr[k] = prog(HEAD + (k === 'advect' ? defs : '') + FS[k]); }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,-1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);
  const blit = target => {
    if (target){ gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };
  function fbo(w, h, param){
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, ext.rgba.internal, w, h, 0, ext.rgba.format, ext.hfType, null);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo: f, w, h, tx: 1 / w, ty: 1 / h, attach(id){ gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; } };
  }
  function dfbo(w, h, param){ let a = fbo(w, h, param), b = fbo(w, h, param);
    return { w, h, tx: 1 / w, ty: 1 / h, get read(){ return a; }, get write(){ return b; }, swap(){ const t = a; a = b; b = t; } }; }
  function blank(c){ const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(c || [0,0,0,255])); return t; }
  const BLANK = blank();
  function res(r){ let a = gl.drawingBufferWidth / gl.drawingBufferHeight; if (a < 1) a = 1 / a;
    const mn = Math.round(r), mx = Math.round(r * a);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { w: mx, h: mn } : { w: mn, h: mx }; }
  let dye, vel, div, curl, pres;
  function initFluid(){ if (!FLUID) return; const s = res(CFG.SIM), d = res(CFG.DYE);
    dye = dfbo(d.w, d.h, filt); vel = dfbo(s.w, s.h, filt); div = fbo(s.w, s.h, gl.NEAREST); curl = fbo(s.w, s.h, gl.NEAREST); pres = dfbo(s.w, s.h, gl.NEAREST); }

  /* atlas */
  const atlasTex = gl.createTexture(); let atlasReady = false;
  const img = new Image(); img.decoding = 'async';
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, atlasTex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    atlasReady = true; finishLoader();
  };
  img.onerror = () => { goStatic('atlas failed'); };
  img.src = 'img/fx/atlas.webp';

  /* 크기 */
  let W = 0, H = 0;
  function resize(force){ const w = Math.round(innerWidth * renderScale), h = Math.round(innerHeight * renderScale);
    if (force || w !== canvas.width || h !== canvas.height){ canvas.width = w; canvas.height = h; initFluid(); } W = innerWidth; H = innerHeight; }
  addEventListener('resize', () => resize()); resize(true);

  function splat(x, y, dx, dy, color, rad){ if (!FLUID) return; const asp = canvas.width / canvas.height; const u = pr.splat.use();
    gl.uniform1i(u.uTarget, vel.read.attach(0)); gl.uniform1f(u.aspectRatio, asp); gl.uniform2f(u.point, x, y); gl.uniform3f(u.color, dx, dy, 0);
    let r = (rad || CFG.RADIUS); if (asp > 1) r *= asp; gl.uniform1f(u.radius, r); blit(vel.write); vel.swap();
    gl.uniform1i(u.uTarget, dye.read.attach(0)); gl.uniform3f(u.color, color[0], color[1], color[2]); blit(dye.write); dye.swap(); }
  function step(dt){ if (!FLUID) return; gl.disable(gl.BLEND);
    let u = pr.curl.use(); gl.uniform2f(u.texelSize, vel.tx, vel.ty); gl.uniform1i(u.uVelocity, vel.read.attach(0)); blit(curl);
    u = pr.vorticity.use(); gl.uniform2f(u.texelSize, vel.tx, vel.ty); gl.uniform1i(u.uVelocity, vel.read.attach(0)); gl.uniform1i(u.uCurl, curl.attach(1));
    gl.uniform1f(u.curl, CFG.CURL); gl.uniform1f(u.dt, dt); blit(vel.write); vel.swap();
    u = pr.divergence.use(); gl.uniform2f(u.texelSize, vel.tx, vel.ty); gl.uniform1i(u.uVelocity, vel.read.attach(0)); blit(div);
    u = pr.clear.use(); gl.uniform1i(u.uTexture, pres.read.attach(0)); gl.uniform1f(u.value, CFG.PRESSURE); blit(pres.write); pres.swap();
    u = pr.pressure.use(); gl.uniform2f(u.texelSize, vel.tx, vel.ty); gl.uniform1i(u.uDivergence, div.attach(0));
    for (let i = 0; i < CFG.PIT; i++){ gl.uniform1i(u.uPressure, pres.read.attach(1)); blit(pres.write); pres.swap(); }
    u = pr.gradient.use(); gl.uniform2f(u.texelSize, vel.tx, vel.ty); gl.uniform1i(u.uPressure, pres.read.attach(0)); gl.uniform1i(u.uVelocity, vel.read.attach(1)); blit(vel.write); vel.swap();
    u = pr.advect.use(); gl.uniform2f(u.texelSize, vel.tx, vel.ty); if (!ext.linear) gl.uniform2f(u.dyeTexelSize, vel.tx, vel.ty);
    const vid = vel.read.attach(0); gl.uniform1i(u.uVelocity, vid); gl.uniform1i(u.uSource, vid);
    gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, CFG.VDISS); blit(vel.write); vel.swap();
    if (!ext.linear) gl.uniform2f(u.dyeTexelSize, dye.tx, dye.ty);
    gl.uniform1i(u.uVelocity, vel.read.attach(0)); gl.uniform1i(u.uSource, dye.read.attach(1)); gl.uniform1f(u.dissipation, CFG.DDISS); blit(dye.write); dye.swap(); }

  /* 스크롤 → P. 히어로 트랙 안에서만 0 → 1.9 */
  let P = 0, Pt = 0, heroOn = true;
  const readScroll = () => { const r = hero.getBoundingClientRect(); const span = Math.max(1, r.height - innerHeight); Pt = clamp(-r.top / span) * P_MAX; };
  addEventListener('scroll', readScroll, { passive: true }); readScroll(); P = Pt;
  new IntersectionObserver(es => { heroOn = es[0].isIntersecting; canvas.style.visibility = heroOn ? 'visible' : 'hidden'; if (heroOn && !running) start(); }, { threshold: 0 }).observe(hero);

  /* 손 먹 */
  let last = null, lastInput = 0;
  function onMove(x, y){ const ux = x / W, uy = 1 - y / H; lastInput = performance.now();
    if (last){ let dx = ux - last[0], dy = uy - last[1]; const asp = W / H; if (asp < 1) dx *= asp; if (asp > 1) dy /= asp;
      if (Math.abs(dx) + Math.abs(dy) > 0.0004) splat(ux, uy, dx * CFG.FORCE, dy * CFG.FORCE, [.2, .2, .2]); }
    last = [ux, uy]; }
  addEventListener('pointermove', e => { if (heroOn) onMove(e.clientX, e.clientY); }, { passive: true });
  addEventListener('touchmove', e => { const t = e.touches[0]; if (t && heroOn) onMove(t.clientX, t.clientY); }, { passive: true });
  addEventListener('touchend', () => { last = null; }, { passive: true });
  document.addEventListener('pointerleave', () => { last = null; });

  /* 캡션: data-a ~ data-b 구간에서만 보인다 */
  const caps = Array.from(document.querySelectorAll('.hcap'));
  function ui(){ for (const c of caps){ const a = +c.dataset.a, b = +c.dataset.b; const o = sstep(a - .15, a, P) * (1 - sstep(b, b + .15, P));
      c.style.opacity = o.toFixed(3); c.style.transform = 'translate3d(0,' + ((1 - o) * 14 * (P < a ? 1 : -1)).toFixed(1) + 'px,0)'; c.style.visibility = o < .01 ? 'hidden' : 'visible'; }
    $('cue').style.opacity = P < .12 ? 1 : 0; }

  /* 먹 필름 (high 단계만). 모든 프레임이 키프레임이라 스크럽이 가볍다 */
  const LEAP_A = .45, LEAP_B = 1.85, leapWide = innerWidth / innerHeight > 1;
  const leapTex = blank([255,255,255,255]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const leap = document.createElement('video'); leap.muted = true; leap.playsInline = true; leap.preload = 'auto'; leap.setAttribute('muted', ''); leap.setAttribute('playsinline', '');
  let leapReady = false, leapFresh = false, leapStarted = false;
  leap.addEventListener('seeked', () => { leapFresh = true; }); leap.addEventListener('loadeddata', () => { leapFresh = true; });
  function startLeap(){ if (leapStarted || tier !== 'high') return; leapStarted = true; leap.src = leapWide ? 'v/leap_w.mp4' : 'v/leap_t.mp4'; leap.load(); }
  function leapFrame(){
    if (tier !== 'high' || !leapStarted || leap.readyState < 2) return 0;
    if (P < .2 || P > 1.95) return leapReady ? 1 : 0;
    if (!leap.paused) leap.pause();
    const d = (leap.duration || 8) - .05, want = clamp((P - LEAP_A) / (LEAP_B - LEAP_A)) * d;
    if (!leap.seeking && Math.abs(leap.currentTime - want) > 1 / 48){ try { leap.currentTime = want; } catch (e) {} }
    if (leapFresh){ leapFresh = false; gl.bindTexture(gl.TEXTURE_2D, leapTex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, leap); leapReady = true; } catch (e) {} }
    return leapReady ? 1 : 0;
  }

  /* 금붕어 길: 셰이더가 그리는 물고기와 같은 길로 먹 꼬리가 따라온다 */
  function fish(P, a){ const sx = Math.min(a, 1), k = clamp((P - .45) / .8), e = 1 - Math.pow(1 - k, 2.2);
    const p0 = [-.20 * sx, -.78], p1 = [-.06 * sx, .25], p2 = [.16 * sx, .36], u = 1 - e;
    const x = u * u * p0[0] + 2 * u * e * p1[0] + e * e * p2[0], y = u * u * p0[1] + 2 * u * e * p1[1] + e * e * p2[1];
    const tx = 2 * u * (p1[0] - p0[0]) + 2 * e * (p2[0] - p1[0]), ty = 2 * u * (p1[1] - p0[1]) + 2 * e * (p2[1] - p1[1]);
    const rot = Math.atan2(ty, tx) - .88, h = .40 * Math.min(1, a * 1.7), w = h * 1.488;
    const al = sstep(.45, .56, P) * (1 - sstep(1.12, 1.38, P));
    const lx = -.25 * w, ly = -.45 * h, c = Math.cos(rot), s = Math.sin(rot);
    return { x, y, rot, al, w, h, tail: [x + c * lx - s * ly, y + s * lx + c * ly], dir: [tx, ty] }; }

  /* 루프 + 품질 자동 조절 */
  let lastT = performance.now(), introStart = 0, frames = 0, acc = 0, fps = 60, lowStreak = 0, lastP = 0, running = false, skip = false;
  const t0 = performance.now();
  function start(){ if (running || tier === 'static') return; running = true; lastT = performance.now(); requestAnimationFrame(frame); }
  function frame(now){
    if (tier === 'static'){ running = false; return; }
    if (!heroOn || document.hidden){ running = false; return; }     /* 화면 밖이면 루프 자체를 멈춘다 */
    requestAnimationFrame(frame);
    if (tier === 'low'){ skip = !skip; if (skip) return; }          /* 폰은 30fps */
    const dt = Math.min((now - lastT) / 1000, 1 / 24); lastT = now;
    P += (Pt - P) * (1 - Math.exp(-dt * 5.5)); if (Math.abs(Pt - P) < .0005) P = Pt;
    const a = canvas.width / canvas.height;
    if (atlasReady) startLeap();
    const leapOn = leapFrame(); const F = fish(P, a); if (leapOn) F.al = 0;
    if (F.al > .2 && Math.abs(P - lastP) > .0004){ const len = Math.hypot(F.dir[0], F.dir[1]) || 1, sp = Math.sign(P - lastP), fz = MOBILE ? 120 : 220;
      splat(F.tail[0] / a + .5, F.tail[1] + .5, -F.dir[0] / len * fz * sp, -F.dir[1] / len * fz * sp, [.14, .14, .14], CFG.RADIUS * 1.6); }
    lastP = P;
    step(dt);
    const u = scene.use();
    gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, leapTex); gl.uniform1i(u.uLeap, 4);
    gl.uniform1f(u.uLeapOn, leapOn); gl.uniform1f(u.uLeapAsp, leapWide ? 16 / 9 : 9 / 16);
    if (!introStart && atlasReady && loaderDone) introStart = now;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlasTex); gl.uniform1i(u.uAtlas, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, FLUID ? dye.read.tex : BLANK); gl.uniform1i(u.uDye, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, FLUID ? vel.read.tex : BLANK); gl.uniform1i(u.uVel, 2);
    gl.uniform1f(u.uTime, (now - t0) / 1000); gl.uniform1f(u.uP, P); gl.uniform1f(u.uAspect, a); gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform1f(u.uIntro, introStart ? sstep(0, 2600, now - introStart) : 0);
    gl.uniform4f(u.uFish, F.x, F.y, F.rot, F.al); gl.uniform2f(u.uFishS, F.w, F.h);
    if (atlasReady) blit(null);
    ui();
    frames++; acc += dt;
    if (acc >= .75){ fps = Math.round(frames / acc) * (tier === 'low' ? 1 : 1); frames = 0; acc = 0;
      const target = tier === 'low' ? 26 : 42, floor = tier === 'low' ? .5 : .6;
      if (fps < target){ if (++lowStreak >= 2){ if (renderScale > floor){ renderScale = Math.max(floor, renderScale - .2); resize(true); }
          else if (tier === 'high'){ tier = 'low'; CFG.PIT = 8; }                 /* high → low */
          else if (fps < 18){ goStatic('fps ' + fps); }                            /* low → static */
          lowStreak = 0; } }
      else lowStreak = 0;
      document.documentElement.dataset.glTier = tier + ' ' + fps + 'fps x' + renderScale.toFixed(2); }
  }
  start();
  window.__gyk = { tier: () => tier, go(v){ Pt = P = v; }, fps: () => fps };
}
})();
