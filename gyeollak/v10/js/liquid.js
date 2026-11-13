/* 결락 v09 · LIQUID — 메타볼 물방울 엔진.
   입자 하나 = 작은 물방울. 가까이 붙으면 표면장력처럼 하나로 합쳐진다.
   렌더: 저해상도 필드에 방울 스프라이트를 더하기 합성 → 임계값으로 액체 윤곽 → 기울기로 유리 림·하이라이트 셰이딩. */
(() => {
  'use strict';
  const SPR = (() => { // 방울 스프라이트 (필드 기여도)
    const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
    const g = c.getContext('2d'), rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    rg.addColorStop(0, 'rgba(255,255,255,.34)'); rg.addColorStop(.3, 'rgba(255,255,255,.25)');
    rg.addColorStop(.55, 'rgba(255,255,255,.07)'); rg.addColorStop(.72, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, s, s); return c;
  })();

  /* ㄱㄹ 마크 → 목표점 샘플 (0..1 좌표, 마크 박스 기준) */
  let MARK = null;
  const markReady = new Promise(res => {
    const im = new Image(); im.src = (window.GY_BASE || '') + 'img/logo/mark-ink.png';
    im.onload = () => {
      const w = 110, h = Math.round(w * im.height / im.width), c = document.createElement('canvas');
      c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(im, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data, pts = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 140) pts.push([x / w, y / h]);
      MARK = { pts, aspect: h / w }; res(MARK);
    };
    im.onerror = () => res(null);
  });
  /* 마크를 spacing(마크 폭 대비) 격자로 나눠 셀마다 내부 점들의 평균 → 목표점 [x,y] (y는 폭 기준) */
  function gridTargets(spacing) {
    if (!MARK) return [];
    const cells = new Map();
    MARK.pts.forEach(([x, y]) => {
      const yy = y * MARK.aspect, k = Math.floor(x / spacing) + ',' + Math.floor(yy / spacing);
      const c = cells.get(k) || [0, 0, 0]; c[0] += x; c[1] += yy; c[2]++; cells.set(k, c);
    });
    const min = (spacing * 110) ** 2 * .3, out = [];
    cells.forEach(c => { if (c[2] >= min) out.push([c[0] / c[2], c[1] / c[2]]); });
    return out;
  }

  function blur(src, w, h, r) { // 가로·세로 박스 블러
    const tmp = new Float32Array(src.length), out = new Float32Array(src.length), k = 1 / (2 * r + 1);
    for (let y = 0; y < h; y++) { let acc = 0; const row = y * w;
      for (let x = -r; x <= r; x++) acc += src[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) { tmp[row + x] = acc * k; acc += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)]; } }
    for (let x = 0; x < w; x++) { let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) { out[y * w + x] = acc * k; acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
    return out;
  }

  class Liquid {
    constructor(canvas, o = {}) {
      this.c = canvas; this.g = canvas.getContext('2d', { willReadFrequently: true });
      this.scale = o.scale || .5; this.T = o.T || 62; this.rim = o.rim || 34;
      this.tint = o.tint || [214, 228, 255]; this.dark = o.dark || [12, 22, 48];
      this.ps = []; this.t = 0; this.W = 1; this.H = 1;
      this.k = o.k || 38; this.damp = o.damp || 7.5; this.wob = o.wob ?? 1;
      this.bev = o.bev || 4; this.edgeA = o.edgeA || 170; this.bump = o.bump || 9;
    }
    resize(w, h) {
      this.W = w; this.H = h;
      this.c.width = Math.max(2, Math.round(w * this.scale)); this.c.height = Math.max(2, Math.round(h * this.scale));
      this.c.style.width = w + 'px'; this.c.style.height = h + 'px';
    }
    add(n, f) { for (let i = 0; i < n; i++) { const p = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, r: 0, tr: 10, delay: 0, ph: Math.random() * 6.28 }, f ? f(i) : {}); this.ps.push(p); } }
    step(dt) {
      this.t += dt; const k = this.k, d = this.damp, t = this.t;
      for (const p of this.ps) {
        if (p.delay > 0) { p.delay -= dt; p.r += (p.tr - p.r) * Math.min(1, dt * 3); continue; }
        const wx = Math.sin(t * 1.7 + p.ph) * this.wob, wy = Math.cos(t * 1.3 + p.ph * 1.3) * this.wob;
        const kk = k * (p.kf || 1), ax = (p.tx + wx - p.x) * kk - p.vx * d, ay = (p.ty + wy - p.y) * kk - p.vy * d;
        p.vx += ax * dt; p.vy += ay * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.r += (p.tr - p.r) * Math.min(1, dt * 6);
      }
    }
    render() {
      const g = this.g, s = this.scale, cw = this.c.width, ch = this.c.height;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cw, ch);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      g.globalCompositeOperation = 'lighter';
      for (const p of this.ps) {
        if (p.r < .5) continue;
        const R = p.r * 2.1 * s, x = p.x * s, y = p.y * s;
        g.drawImage(SPR, x - R, y - R, R * 2, R * 2);
        if (x - R < x0) x0 = x - R; if (y - R < y0) y0 = y - R; if (x + R > x1) x1 = x + R; if (y + R > y1) y1 = y + R;
      }
      g.globalCompositeOperation = 'source-over';
      x0 = Math.max(1, Math.floor(x0)); y0 = Math.max(1, Math.floor(y0)); x1 = Math.min(cw - 1, Math.ceil(x1)); y1 = Math.min(ch - 1, Math.ceil(y1));
      const bw = x1 - x0, bh = y1 - y0; if (bw < 3 || bh < 3) return;
      const img = g.getImageData(x0, y0, bw, bh), d = img.data, T = this.T, n = bw * bh;
      // 1) 액체 마스크 (안티앨리어스)
      const m = new Float32Array(n);
      for (let i = 0, j = 3; i < n; i++, j += 4) { const v = (d[j] - T + 5) / 10; m[i] = v <= 0 ? 0 : v >= 1 ? 1 : v; }
      // 2) 마스크를 두 번 흐려서 높이맵 → 부풀린 유리 표면 (ETHER 레퍼런스)
      const h = blur(blur(m, bw, bh, this.bev), bw, bh, this.bev);
      const [tr, tg, tb] = this.tint, [dr, dg, db] = this.dark, st = this.bump;
      for (let y = 1; y < bh - 1; y++) {
        for (let x = 1; x < bw - 1; x++) {
          const i = y * bw + x, o = i * 4, mm = m[i];
          if (mm <= 0) { d[o + 3] = 0; continue; }
          let nx = (h[i - 1] - h[i + 1]) * st, ny = (h[i - bw] - h[i + bw]) * st, nz = 1;
          const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
          const fr = 1 - nz;                                           // 프레넬: 가장자리일수록 1
          const s1 = Math.pow(Math.max(0, nx * -.42 + ny * -.56 + nz * .71), 60);   // 위-왼쪽 주광
          const s2 = Math.pow(Math.max(0, nx * .5 + ny * .62 + nz * .6), 24) * .55; // 아래-오른쪽 반사광
          const dk = Math.min(1, fr * fr * 2.2);                       // 굴절로 어두워지는 테두리
          let r = tr + (dr - tr) * dk, gg = tg + (dg - tg) * dk, b = tb + (db - tb) * dk;
          let a = 22 + this.edgeA * Math.pow(fr, 1.4);
          const sp = Math.min(1, s1 * 1.2 + s2);
          r += (255 - r) * sp; gg += (255 - gg) * sp; b += (255 - b) * sp; a += 255 * sp;
          d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = Math.min(255, a) * mm;
        }
      }
      g.clearRect(0, 0, cw, ch); g.putImageData(img, x0, y0);
    }
  }
  window.GYLiquid = { Liquid, markReady, gridTargets, get MARK() { return MARK; } };
})();
