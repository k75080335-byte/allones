/* 결락 hero v2 — intro timeline (GSAP) · ripple height-field (WebGL2) · pinned zoom-through (ScrollTrigger) */
(() => {
const R = document.documentElement, Q = new URLSearchParams(location.search);
const CAP = Q.has('capture'), DEBUG = Q.has('debug');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const hasG = !!(window.gsap && window.ScrollTrigger);
let tier = Q.get('tier') || (reduce ? 'static' : 'high');
if (!hasG) tier = 'static';
R.classList.remove('no-js', 'js-pre'); R.classList.add('js');
const dbg = $('.debug'); if (DEBUG) dbg.hidden = false;
const log = (...a) => { if (DEBUG) dbg.textContent = a.join(' '); };

/* ── text reveals: time-based, 0.5s (빠른 스크롤에도 다 그려진 상태) ── */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach(el => io.observe(el));

/* ── nav: aria-current + ink bleed from the top-right corner ── */
const navMap = { members: '#members', 'ch-members': '#members', music: '#music', world: '#world', archive: '#archive' };
const secIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const id = e.target.id;
  $$('.menu a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === navMap[id] ? 'true' : 'false'));
  $$('.ch-index a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id || (id === 'members' && a.getAttribute('href') === '#ch-members') ? 'true' : 'false'));
}), { rootMargin: '-45% 0px -50% 0px' });
['members', 'ch-members', 'music', 'world', 'archive'].forEach(id => secIO.observe(document.getElementById(id)));
const paperIO = new IntersectionObserver(es => es.forEach(e => R.classList.toggle('on-paper', e.isIntersecting)), { rootMargin: '0px 0px -92% 0px' });
$$('.rise-paper,.chapters').forEach(el => paperIO.observe(el));

const jump = hash => { const t = document.querySelector(hash); if (!t) return; t.scrollIntoView({ behavior: 'instant', block: 'start' }); history.pushState(null, '', hash); t.focus({ preventScroll: true }); };
const bleed = $('.bleed');
function bleedTo(hash) {
  if (tier === 'static' || !hasG) { jump(hash); return; }
  gsap.timeline()
    .set(bleed, { display: 'block', '--r': '0%' })
    .to(bleed, { '--r': '160%', duration: .6, ease: 'power2.in' })
    .add(() => jump(hash))
    .to(bleed, { '--r': '0%', duration: .55, ease: 'power2.out', delay: .08 })
    .set(bleed, { display: 'none' });
}
$$('.menu a,.ch-index a,.cue,.brand').forEach(a => a.addEventListener('click', e => { e.preventDefault(); bleedTo(a.getAttribute('href')); }));

/* ── depth gauge 0m → 12m → 0m ── */
const depthOut = $('#depthOut');
function updateGauge() {
  const depth = $('.depth'), rise = $('.rise');
  const peak = depth.offsetTop + depth.offsetHeight * .35 - innerHeight * .3;
  const end = rise.offsetTop + rise.offsetHeight * .55 - innerHeight * .5;
  const y = scrollY;
  let d = y <= peak ? 12 * y / peak : 12 * (1 - (y - peak) / Math.max(1, end - peak));
  d = Math.max(0, Math.min(12, d));
  R.style.setProperty('--depth', d.toFixed(2)); depthOut.value = (d < 9.95 ? d.toFixed(1) : Math.round(d)) + 'm';
  const dn = $('.dn'); if (dn) dn.textContent = Math.round(d);
  R.classList.toggle('past-hero', y > depth.offsetTop - 100);
}
addEventListener('scroll', updateGauge, { passive: true }); addEventListener('resize', updateGauge); updateGauge();

/* ── slogan: per-char spans (vertical, manual so 세로쓰기 stays intact) ── */
const sloganChars = [];
$$('.slogan .br').forEach(line => { const t = line.textContent; line.textContent = ''; [...t].forEach(ch => { const s = document.createElement('span'); s.className = 'c'; s.textContent = ch === ' ' ? '\u00a0' : ch; line.appendChild(s); sloganChars.push(s); }); });
$('.slogan').setAttribute('aria-label', '우리는 닿는 순간부터 번지고 있었다');

const video = $('#lily');
if (tier === 'static') { video.removeAttribute('src'); video.load(); finishStatic(); return; }

/* ═════════ WebGL2: height-field ripple (Evan Wallace / soju22 "Liquid Effect" 방식을 직접 구현) ═════════ */
const glc = $('#gl');
let G = null;
function initGL() {
  const g = glc.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' });
  if (!g || !g.getExtension('EXT_color_buffer_float')) return null;
  const VS = '#version 300 es\nin vec2 p;out vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const H = '#version 300 es\nprecision highp float;in vec2 v;out vec4 o;';
  const prog = fs => { const P = g.createProgram(); [[g.VERTEX_SHADER, VS], [g.FRAGMENT_SHADER, H + fs]].forEach(([t, s]) => { const sh = g.createShader(t); g.shaderSource(sh, s); g.compileShader(sh); if (!g.getShaderParameter(sh, g.COMPILE_STATUS)) throw g.getShaderInfoLog(sh); g.attachShader(P, sh); }); g.bindAttribLocation(P, 0, 'p'); g.linkProgram(P); const U = {}; const n = g.getProgramParameter(P, g.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const a = g.getActiveUniform(P, i); U[a.name] = g.getUniformLocation(P, a.name); } return { P, U }; };
  let PD, PU, PN, PR;
  try {
    PD = prog('uniform sampler2D t;uniform vec2 c;uniform float r,s,asp;void main(){vec4 x=texture(t,v);vec2 d=c-v;d.x*=asp;float k=max(0.,1.-length(d)/r);k=.5-cos(k*3.14159265)*.5;x.r+=k*s;o=x;}');
    PU = prog('uniform sampler2D t;uniform vec2 tx;uniform float att;void main(){vec4 x=texture(t,v);vec2 dx=vec2(tx.x,0.),dy=vec2(0.,tx.y);float a=(texture(t,v-dx).r+texture(t,v-dy).r+texture(t,v+dx).r+texture(t,v+dy).r)*.25;x.g+=(a-x.r)*2.;x.g*=att;x.r+=x.g;x.r*=.9995;o=x;}');
    PN = prog('uniform sampler2D t;uniform vec2 tx;void main(){vec4 x=texture(t,v);vec3 dx=vec3(tx.x,0.,texture(t,vec2(v.x+tx.x,v.y)).r-x.r);vec3 dy=vec3(0.,tx.y,texture(t,vec2(v.x,v.y+tx.y)).r-x.r);x.ba=normalize(cross(dx,dy)).xy;o=x;}');
    PR = prog(`uniform sampler2D sim,pap;uniform vec2 res,cp,ps;uniform float flood,nacre,tm,spec,disp;
const vec3 HJ=vec3(.957,.945,.918),NM=vec3(.043,.043,.047),CM=vec3(.122,.165,.227),EB=vec3(.910,.925,.941),TL=vec3(.373,.722,.690),PL=vec3(.851,.812,.910);
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
void main(){
 vec4 S=texture(sim,v);vec2 n=S.ba;float asp=res.x/res.y;
 vec2 uv=v+n*disp;
 vec4 pt=texture(pap,uv*ps);
 float mott=fbm(uv*vec2(asp,1.)*3.)-.5;
 vec3 paper=HJ*(1.-.16*pt.a)+mott*.025;
 vec2 q=(uv-cp)*vec2(asp,1.);float d=length(q);
 float R=flood*1.9;
 float e=(fbm(q*2.4+3.1)-.5)*.42+(fbm(q*11.)-.5)*.10+pt.a*.18;
 float dd=d+e*min(1.,R*1.6);
 float ink=smoothstep(R+.015,R-.05,dd)*step(.001,flood);
 float rim=smoothstep(0.,.05,R-dd)*smoothstep(.22,.05,R-dd);
 float cl=fbm(q*1.4+vec2(0.,-tm*.03));
 vec3 deep=mix(NM,CM,clamp((1.-v.y)*.75*cl+.08,0.,1.));
 deep*=1.-rim*.5;
 vec3 col=mix(paper,deep,ink);
 vec3 N=normalize(vec3(-n*.7,1.));vec3 L=normalize(vec3(-.35,.55,.75));vec3 Hh=normalize(L+vec3(0.,0.,1.));
 float sp=pow(max(dot(N,Hh),0.),120.);
 float sl=clamp(length(n)*1.6,0.,1.);
 vec3 nac=mix(TL,PL,.5+.5*sin(sl*8.+q.x*5.+tm*.7));
 float safe=(1.-smoothstep(.80,.88,v.y))*smoothstep(.02,.08,v.y);
 col=mix(col,mix(col*.85,nac,.7),clamp(sl*nacre*.55,0.,1.)*(1.-ink)*(.35+.65*safe));
 col+=nac*sl*nacre*.5*ink*safe;
 col+=EB*sp*spec*(.25+.75*ink)*safe;
 o=vec4(col,1.);}`);
  } catch (err) { console.warn('GL compile', err); return null; }
  const vb = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, vb); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW); g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
  const mkT = (w, h, data) => { const t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA16F, w, h, 0, g.RGBA, g.HALF_FLOAT, data || null); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE); const f = g.createFramebuffer(); g.bindFramebuffer(g.FRAMEBUFFER, f); g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, t, 0); return { t, f }; };
  // paper texture
  const pap = g.createTexture(); g.bindTexture(g.TEXTURE_2D, pap); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  const img = new Image(); img.onload = () => { g.bindTexture(g.TEXTURE_2D, pap); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img); g.generateMipmap(g.TEXTURE_2D); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.REPEAT); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.REPEAT); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR); }; img.src = 'assets/hanji_fiber.webp';
  const st = { g, A: null, B: null, sw: 0, sh: 0, drops: [], W: 0, H: 0, dpr: 1 };
  st.resize = () => {
    const mob = innerWidth < 900; st.dpr = Math.min(devicePixelRatio || 1, mob ? 1.5 : 1.25);
    st.W = glc.width = Math.round(innerWidth * st.dpr); st.H = glc.height = Math.round(innerHeight * st.dpr);
    const M = mob ? 256 : 384, a = innerWidth / innerHeight;
    const sw = a >= 1 ? M : Math.round(M * a), sh = a >= 1 ? Math.round(M / a) : M;
    if (sw !== st.sw || sh !== st.sh) { st.sw = sw; st.sh = sh; st.A = mkT(sw, sh); st.B = mkT(sw, sh); }
  };
  const pass = (P, set, target) => { g.useProgram(P.P); set(P.U); g.bindFramebuffer(g.FRAMEBUFFER, target ? target.f : null); g.viewport(0, 0, target ? st.sw : st.W, target ? st.sh : st.H); g.drawArrays(g.TRIANGLES, 0, 3); };
  const swap = () => { const t = st.A; st.A = st.B; st.B = t; };
  const src = U => { g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, st.A.t); g.uniform1i(U.t, 0); };
  st.drop = (x, y, r, s) => st.drops.push([x, y, r, s]);
  st.step = () => {
    const asp = st.sw / st.sh;
    st.drops.splice(0).forEach(([x, y, r, s]) => { pass(PD, U => { src(U); g.uniform2f(U.c, x, y); g.uniform1f(U.r, r); g.uniform1f(U.s, s); g.uniform1f(U.asp, asp); }, st.B); swap(); });
    pass(PU, U => { src(U); g.uniform2f(U.tx, 1 / st.sw, 1 / st.sh); g.uniform1f(U.att, .985); }, st.B); swap();
    pass(PN, U => { src(U); g.uniform2f(U.tx, 1 / st.sw, 1 / st.sh); }, st.B); swap();
  };
  st.render = (u) => {
    pass(PR, U => {
      g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, st.A.t); g.uniform1i(U.sim, 0);
      g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, pap); g.uniform1i(U.pap, 1);
      g.uniform2f(U.res, st.W, st.H); g.uniform2f(U.cp, u.cx, u.cy); g.uniform2f(U.ps, st.W / (600 * st.dpr), st.H / (600 * st.dpr));
      g.uniform1f(U.flood, u.flood); g.uniform1f(U.nacre, u.nacre); g.uniform1f(U.tm, u.t); g.uniform1f(U.spec, u.spec); g.uniform1f(U.disp, u.disp);
    }, null);
  };
  st.resize();
  return st;
}
if (tier === 'high') { G = initGL(); if (!G) tier = 'low'; }
R.dataset.tier = tier; R.classList.add('js-anim'); R.classList.remove('is-ink');
log('tier', tier);

/* ═════════ geometry: contact point = glyph centre ═════════ */
const glyph = $('.glyph'), fallSvg = $('.fall'), fp = $('#fallPath'), fh = $('#fallHair'), fd = $('#fallDrop');
const U = { flood: 0, nacre: 0, t: 0, spec: .55, disp: .016, cx: .5, cy: .5 };
function layout() {
  const r = glyph.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  U.cx = cx / W; U.cy = 1 - cy / H;
  R.style.setProperty('--cx', (cx / W * 100) + '%'); R.style.setProperty('--cy', (cy / H * 100) + '%');
  fallSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const sw = Math.max(8, Math.min(18, W * .014)), x0 = cx + W * .05;
  fp.setAttribute('d', `M${x0} ${-20} C ${x0 - W * .03} ${H * .15}, ${cx + W * .025} ${cy - H * .22}, ${cx} ${cy}`);
  fh.setAttribute('d', `M${x0 + sw * .7} ${-10} C ${x0 - W * .03 + sw} ${H * .16}, ${cx + W * .025 + sw * .6} ${cy - H * .2}, ${cx + sw * .4} ${cy - sw * 2}`);
  fp.setAttribute('stroke-width', sw); fh.setAttribute('stroke-width', sw * .28);
  fd.setAttribute('cx', cx); fd.setAttribute('cy', cy);
  [fp, fh].forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = `${L} ${L}`; p.dataset.L = L; });
  if (G) G.resize();
}
layout();

/* ── brush writing canvas (typo-v2 bristle engine) ── */
const wcv = $('.glyph-write');
const ink = new GyBrush.InkCanvas(wcv, 1000, 1000, GLYPH_GYEOL, { ink: [244, 241, 234], tipHi: 'rgba(95,184,176,.35)' });
ink.layout(Math.min(1000, Math.round(glyph.getBoundingClientRect().width * Math.min(2, devicePixelRatio || 1))));
const W8 = { p: 0 };
const brushEase = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 2.2);
function drawWrite(t) { const n = GLYPH_GYEOL.length; ink.render(GLYPH_GYEOL.map((_, i) => { const a = i / n * .86; return brushEase((W8.p - a) / .16); }), t); }

/* ═════════ intro timeline (~4.9s) ═════════ */
const VOFF = 1.8;
const T = { fall: .15, contact: .95, flood: 1.0, ink: 2.45, write: 1.85, split: 3.05, media: 3.5, slogan: 3.9, ui: 4.35 };
const slices = $$('.slice'), sNacre = $$('.slice .nacre'), mNacre = $('.glyph-media .nacre');
const split = SplitText.create('.title .en', { type: 'chars', mask: 'chars' });
let tl;
function buildIntro() {
  const L = +fp.dataset.L, Lh = +fh.dataset.L;
  tl = gsap.timeline({ paused: true, onUpdate: () => { R.classList.toggle('is-ink', tl.time() >= T.ink); R.style.setProperty('--flood', U.flood); } });
  tl.set([fp], { strokeDashoffset: L }, 0).set(fh, { strokeDashoffset: Lh }, 0).set(fd, { attr: { r: 0 } }, 0)
    .set(['.kicker', '.title .ko', '.cue-wrap', '.hero-ctl', '.gauge'], { autoAlpha: 0 }, 0).set(split.chars, { yPercent: 110 }, 0)
    .set(sloganChars, { autoAlpha: 0, yPercent: -40 }, 0).set('.glyph-media', { autoAlpha: 0 }, 0).set(wcv, { autoAlpha: 1 }, 0)
    .set(slices, { autoAlpha: 0, xPercent: 0, skewX: 0 }, 0).set([...sNacre, mNacre], { opacity: 0, backgroundPosition: '120% 0' }, 0)
    .set(U, { flood: 0, nacre: 0 }, 0).set(W8, { p: 0 }, 0)
    .set('.rings i', { scale: .2, opacity: 0 }, 0);
  slices.forEach((s, i) => gsap.set(s, { clipPath: `inset(${i * 25}% 0 ${100 - (i + 1) * 25}% 0)` }));
  // 0: brand reads immediately
  tl.to('.kicker', { autoAlpha: 1, duration: .45, ease: 'power2.out' }, .05);
  R.classList.add('blend');
  // 1: one ink stroke falls (SVG stroke-dashoffset + brush filter)
  tl.to(fp, { strokeDashoffset: 0, duration: T.contact - T.fall, ease: 'power3.in' }, T.fall)
    .to(fh, { strokeDashoffset: 0, duration: T.contact - T.fall - .05, ease: 'power3.in' }, T.fall + .04)
    .to([fp], { strokeDashoffset: -L, duration: .45, ease: 'power2.in' }, T.contact)
    .to(fh, { strokeDashoffset: -Lh, duration: .4, ease: 'power2.in' }, T.contact)
    .to(fd, { attr: { r: 9 }, duration: .08 }, T.contact - .04).to(fd, { attr: { r: 0 }, duration: .35, ease: 'power2.in' }, T.contact + .06);
  // 2: water contact — ripple + nacre (color moment 1)
  tl.call(() => { if (G) { G.drop(U.cx, U.cy, .028, .22); } }, null, T.contact)
    .call(() => { if (G) G.drop(U.cx + .004, U.cy - .003, .016, -.12); }, null, T.contact + .22)
    .call(() => { if (G) G.drop(U.cx, U.cy, .02, .1); }, null, T.contact + .5)
    .to(U, { nacre: 1, duration: .18, ease: 'power2.out' }, T.contact).to(U, { nacre: .12, duration: 1.4, ease: 'power2.inOut' }, T.contact + .3)
    .to('.rings i', { scale: 7, opacity: 0, duration: 1.3, ease: 'power2.out', stagger: .18, keyframes: { opacity: [0, .9, 0] } }, T.contact)
  // 3: ink sinks + floods (ink veil)
    .to(U, { flood: 1, duration: 1.35, ease: 'power2.inOut' }, T.flood);
  // 4: '결' condenses — brush writes in stroke order
  tl.to(W8, { p: 1, duration: 1.15, ease: 'none' }, T.write)
    .to('.title .ko', { autoAlpha: 1, duration: .4 }, T.ink + .05)
  // 5: split & reassemble + nacre sheen (color moment 2)
    .set(slices, { autoAlpha: 1 }, T.split).set(wcv, { autoAlpha: 0 }, T.split + .02)
    .to(sNacre, { opacity: 1, duration: .12 }, T.split)
    .to(slices, { xPercent: i => [-13, 10, -7, 15][i], skewX: i => [-8, 6, -4, 9][i], duration: .26, ease: 'power3.out' }, T.split)
    .to(slices, { xPercent: 0, skewX: 0, duration: .5, ease: 'expo.out', stagger: .03 }, T.split + .26)
    .to(sNacre, { backgroundPosition: '-20% 0', duration: .7, ease: 'power2.inOut' }, T.split)
    .to(sNacre, { opacity: 0, duration: .35 }, T.split + .6)
    .to(split.chars, { yPercent: 0, duration: .55, ease: 'expo.out', stagger: .035 }, T.split + .05)
  // 6: lily blooms inside the glyph (video masked through the giant type)
    .call(() => { if (!CAP) { video.currentTime = VOFF; video.play().catch(() => {}); } }, null, T.media)
    .to('.glyph-media', { autoAlpha: 1, duration: .55, ease: 'power2.out' }, T.media)
    .to(slices, { autoAlpha: 0, duration: .4 }, T.media + .3)
    .to(mNacre, { keyframes: { opacity: [0, .8, 0] }, backgroundPosition: '-20% 0', duration: 1.1, ease: 'power1.inOut' }, T.media + .1)
  // 7: slogan, 세로쓰기 — time-based, 0.6s
    .to(sloganChars, { autoAlpha: 1, yPercent: 0, duration: .32, ease: 'power3.out', stagger: .6 / sloganChars.length }, T.slogan)
    .to(['.cue-wrap', '.hero-ctl', '.gauge'], { autoAlpha: 1, duration: .45 }, T.ui);
  tl.eventCallback('onUpdate', () => { R.classList.toggle('is-ink', tl.time() >= T.ink); R.classList.toggle('blend', tl.time() < T.ink); R.style.setProperty('--flood', U.flood); drawWrite(tl.time()); });
  return tl;
}
buildIntro(); tl.time(.0001);

/* ═════════ pinned zoom-through the '결' (ScrollTrigger scrub) ═════════ */
gsap.registerPlugin(ScrollTrigger);
glyph.style.transformOrigin = '62% 26.7%';
const zoom = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=150%', pin: true, scrub: .6, onLeave: () => { glc.style.opacity = 0; }, onEnterBack: () => { glc.style.opacity = 1; }, onUpdate: s => { glc.style.opacity = s.progress > .8 ? String(Math.max(0, 1 - (s.progress - .8) * 5)) : '1'; } } });
zoom.to(['.kicker', '.title', '.slogan', '.cue-wrap', '.hero-ctl'], { autoAlpha: 0, y: -30, duration: .14, ease: 'power1.in' }, 0)
  .to('.letterbox', { scaleY: 1, duration: .2, ease: 'power2.out' }, .05)
  .fromTo(glyph, { scale: 1, yPercent: 0 }, { scale: 38, yPercent: 18, duration: .85, ease: 'power3.in' }, .08)
  .to('.veil', { opacity: 1, duration: .25, ease: 'none' }, .72)
  .to('.letterbox', { scaleY: 0, duration: .12 }, .86);

/* ── render loop + quality tiers + runtime downgrade ── */
let last = performance.now(), acc = 0, frames = 0, slow = 0, running = true, heroVisible = true, simAcc = 0;
new IntersectionObserver(es => es.forEach(e => heroVisible = e.isIntersecting)).observe($('.hero'));
function downgrade(to) {
  if (tier === to) return; console.info('[tier] downgrade', tier, '→', to); tier = to; R.dataset.tier = to;
  if (to === 'low') { G = null; }
  if (to === 'static') { tl.progress(1); }
}
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (!CAP && running) {
    U.t += dt; acc += dt; frames++;
    if (acc > 1) { const fps = frames / acc; log('tier', tier, 'fps', fps.toFixed(0)); if (fps < (tier === 'high' ? 28 : 18)) slow++; else slow = 0; if (slow >= 2 && !Q.get('tier')) downgrade(tier === 'high' ? 'low' : 'static'); acc = 0; frames = 0; }
    if (G && heroVisible && tl.progress() === 1 && (U.t % 3.2) < dt) G.drop(.15 + Math.random() * .7, .15 + Math.random() * .7, .01, .03);
    if (G && heroVisible) { simAcc += dt; let n = 0; while (simAcc > 1 / 60 && n < 3) { G.step(); simAcc -= 1 / 60; n++; } G.render(U); }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* pointer stirs the surface (high tier, hero only) */
addEventListener('pointermove', e => { if (!G || !heroVisible || scrollY > innerHeight * .5 || !running) return; G.drop(e.clientX / innerWidth, 1 - e.clientY / innerHeight, .012, .025); }, { passive: true });

/* skip/accelerate the intro on first intent; pause/replay */
const speedUp = () => { if (tl.isActive() && tl.time() < T.ui) tl.timeScale(4); };
['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, speedUp, { passive: true, once: true }));
const pauseBtn = $('#pauseBtn');
pauseBtn.addEventListener('click', () => { running = !running; pauseBtn.textContent = running ? '일시정지' : '재생'; pauseBtn.setAttribute('aria-pressed', String(!running)); if (running) { tl.resume(); if (tl.time() > T.media && video.currentTime < video.duration) video.play().catch(() => {}); } else { tl.pause(); video.pause(); } });
$('#replayBtn').addEventListener('click', () => { scrollTo(0, 0); running = true; pauseBtn.textContent = '일시정지'; video.pause(); video.currentTime = VOFF; if (G) G.resize(); tl.timeScale(1).restart(); });

addEventListener('resize', () => { layout(); ink.layout(Math.min(1000, Math.round(glyph.getBoundingClientRect().width * Math.min(2, devicePixelRatio || 1)))); drawWrite(tl.time()); ScrollTrigger.refresh(); });

const fontsIn = () => Promise.race([Promise.all([document.fonts.load('40px "Song Myung"', '「우리는 닿는 순간부터 번지고 있었다」결락結落'), document.fonts.load('300 40px "Pretendard Variable"', 'GYEOLLAK')]), new Promise(r => setTimeout(r, 1800))]).catch(() => {});
/* ═════════ deterministic capture API (?capture) for contact sheet / mp4 ═════════ */
if (CAP) {
  let simT = 0;
  window.__cap = {
    duration: 6.2,
    seek: async t => {
      tl.time(Math.min(t, tl.duration()));
      U.t = t;
      if (G) { while (simT < t) { G.step(); simT += 1 / 60; } G.render(U); }
      const vt = Math.max(0, t - T.media) + VOFF;
      if (Math.abs(video.currentTime - vt) > .01) await new Promise(r => { const on = () => { video.removeEventListener('seeked', on); r(); }; video.addEventListener('seeked', on); video.currentTime = Math.min(vt, (video.duration || 6) - .05); setTimeout(r, 800); });
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return tier;
    }
  };
  video.preload = 'auto';
  window.__cap.ready = fontsIn().then(() => { layout(); buildIntroRefresh(); return true; });
} else {
  fontsIn().then(() => { layout(); buildIntroRefresh(); tl.play(0); });
}
function buildIntroRefresh() { const was = tl; was.kill(); buildIntro(); tl.time(.0001); }

function finishStatic() { R.dataset.tier = 'static'; R.classList.add('is-ink'); log('tier static'); }
})();
