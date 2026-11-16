# 결락 Typography v2 — Brush

Open index.html in Chrome; all rendering code is inline (SVG, Canvas2D, CSS). Google Fonts is the only network dependency. No WebGL or GSAP.

V1 untouched. Source modules retained as brush.js, glyphs.js, main.js for editing; their contents are also inlined into index.html. To edit, change modules and rebuild inline sections, not both copies independently.

Brush engine: seeded individual bristles follow hand-built centerlines with a pressure profile; entry load, corner pools, directional dry gaps, split-tail hairs, ink density, tiny splashes, fine feathering and blurred fiber bleed. Scene 2's 결락 uses the same paths, not a font mask.

Scenes: 01 one brush line / 결 stroke order; 02 serif GYEOLLAK + hand-brushed 결락 + nacre lens; 03 droplet, slogan and ripples; transition corner ink bloom; 04 white brush 결, thin pearl edge accents, scanline-distorted water reflection, dissolving ribbons and four flowers in order.

Controls: scroll manually; top chips jump to scenes; Replay tours all scenes in 44 seconds, Stop/wheel/touch cancel.

Verification: headless Chrome at 1440×900 (11 shots) and 390×844 at 2× DPR (3 shots). No JS errors or console errors in final runs. Screenshots manually inspected; paper texture, brush edge behavior, scene transition and headline positioning iterated. Real-device performance not measured.

- contact.jpg: desktop sheet
- contact_mobile.jpg: mobile sheet
- shots/: individual PNGs
- shoot.py, mshot.py, contact.py: reproduction scripts (local server URL / output path inside scripts)
