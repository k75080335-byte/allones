# 결락 로고 시안 A~E 생성 (먹/액체/인장)
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as nd
OUT = '/home/claude/allones/gyeollak/v11/img/logo2/'
rng = np.random.default_rng(7)
INK = np.array([11, 13, 18], float)

def glyph(font, ch, size=1000, pad=80):
    ft = ImageFont.truetype(f'/tmp/ttf/{font}.ttf', size)
    im = Image.new('L', (int(size * 1.5), int(size * 1.5)), 0); ImageDraw.Draw(im).text((size * .15, 0), ch, font=ft, fill=255)
    bb = im.getbbox(); im = im.crop((bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad))
    return np.asarray(im, float) / 255

def noise(shape, scale, aspect=(1, 1)):
    h, w = shape; sh = (max(2, int(h / scale / aspect[0])), max(2, int(w / scale / aspect[1])))
    n = rng.random(sh); n = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), float) / 255
    return n

def fbm(shape, scale, oct=4, aspect=(1, 1)):
    v = np.zeros(shape); a = .5; s = scale
    for _ in range(oct): v += a * noise(shape, s, aspect); a *= .5; s /= 2
    return v / (1 - .5 ** oct)

def ink(m, rough=.28, bleed=.22, dry=.4):
    """마스크 → 먹 번짐 알파 (붓 가장자리 떨림 + 종이 번짐 + 마른 붓결 + 튄 먹)"""
    h, w = m.shape
    b = nd.gaussian_filter(m, 3.5)
    n = fbm(m.shape, 22, 4) * .65 + fbm(m.shape, 7, 2) * .35
    core = np.clip((b + (n - .5) * rough * 1.9 - .5) * 5 + .5, 0, 1)
    fib = fbm(m.shape, 5, 2)
    halo = nd.gaussian_filter(m, 7) * np.clip((fib - .35) * 2.2, 0, 1)
    halo = np.clip(halo * bleed * 2.2, 0, bleed * 1.4)
    edge = np.clip(1 - nd.gaussian_filter(m, 10) * 1.1, 0, 1) * m
    streak = fbm(m.shape, 120, 4, aspect=(.08, 1))
    gaps = np.clip((streak - .58) * 4, 0, 1) * edge * dry
    near = (nd.gaussian_filter(m, 18) > .03) & (m < .1)
    spk = (rng.random(m.shape) > .99975) & near
    spk = nd.gaussian_filter(nd.binary_dilation(spk, iterations=2).astype(float), 1.2)
    a = np.clip(core * (1 - gaps) + halo * (1 - core) + spk * .9, 0, 1)
    tone = .84 + .16 * fbm(m.shape, 160, 3)
    return a, tone

def save_ink(a, tone, path, color=INK, bg=None):
    h, w = a.shape
    rgb = np.ones((h, w, 3)) * color[None, None, :]
    rgb = rgb * (2 - tone[..., None]) if color.mean() < 128 else rgb * tone[..., None]
    if bg is None:
        im = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8); Image.fromarray(im, 'RGBA').save(path)
    else:
        out = bg * (1 - a[..., None]) + rgb * a[..., None]; Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(path)

def paper(h, w):
    base = np.array([238, 240, 244], float)
    n = fbm((h, w), 50, 4)
    p = base[None, None, :] * (.97 + .03 * n[..., None])
    grain = rng.normal(0, 4, (h, w))[..., None]
    return np.clip(p + grain, 0, 255)

def poly_mask(shape, pts):
    im = Image.new('L', (shape[1], shape[0]), 0); ImageDraw.Draw(im).polygon(pts, fill=255)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(1)), float) / 255

def drop_mask(shape, cx, cy, r, tail=1.7, ang=0):
    """눈물 모양 물방울 (꼬리 위쪽)"""
    h, w = shape; y, x = np.mgrid[0:h, 0:w].astype(float)
    dx, dy = x - cx, y - cy
    ca, sa = np.cos(ang), np.sin(ang); u = dx * ca + dy * sa; v = -dx * sa + dy * ca
    # 아래는 원, 위로 갈수록 뾰족
    k = np.where(v < 0, 1 + (-v / r) ** 1.0 * (tail - 1) * 1.2, 1)
    d = np.sqrt((u * k) ** 2 + v ** 2 * np.where(v < 0, 1 / tail ** 2, 1))
    return np.clip((r - d) / 2 + .5, 0, 1)

# ───────── A. 한 획이 빠진 '결' ─────────
g = glyph('song_kr', '결')
H, W = g.shape
# ㅕ 아래쪽 짧은 가로획 (그리드 기준 x450~640, y365~445, 크롭 오프셋 동일)
cut = poly_mask(g.shape, [(440, 352), (637, 352), (637, 450), (440, 450)])
stroke = g * cut
gA = g * (1 - cut)
dropA = np.clip(drop_mask(g.shape, 548, 528, 34, tail=2.2) + drop_mask(g.shape, 580, 600, 11, tail=1.8), 0, 1)
mA = np.clip(gA + dropA, 0, 1)
a, t = ink(mA)
ghost = nd.gaussian_filter(stroke, 3) * (fbm(g.shape, 30, 3) * .6 + .4) * .13  # 빠진 자리에 남은 옅은 먹 자국
aA = np.clip(a + ghost * (1 - a), 0, 1)
save_ink(aA, t, OUT + 'A_gyeol_ink.png')
save_ink(aA, t, OUT + 'A_gyeol_ink_paper.png', bg=paper(H, W))
save_ink(aA, t, OUT + 'A_gyeol_white.png', color=np.array([240, 243, 248.]))
Image.fromarray((mA * 255).astype(np.uint8)).save(OUT + 'A_mask.png')  # 물방울 엔진용 실루엣

# ───────── B. 缺 — 마지막 삐침이 떨어져 나감 ─────────
g = glyph('msz', '缺')
cutB = poly_mask(g.shape, [(690, 720), (870, 548), (1040, 548), (1040, 960), (690, 960)])
piece = g * cutB; rest = g * (1 - cutB)
pim = Image.fromarray((piece * 255).astype(np.uint8)).rotate(-9, center=(760, 640), translate=(46, 96), resample=Image.BICUBIC)
H, W = g.shape
canvas = np.zeros((H + 160, W + 80)); canvas[:H, :W] = rest
pp = np.asarray(pim, float) / 255; canvas[:H, :W] = np.clip(canvas[:H, :W] + pp, 0, 1)
for (cx, cy, r) in [(800, 700, 12), (835, 742, 8), (742, 668, 6)]:
    canvas = np.clip(canvas + drop_mask(canvas.shape, cx, cy, r, tail=1.8, ang=-.7), 0, 1)
a, t = ink(canvas, rough=.24, dry=.5)
save_ink(a, t, OUT + 'B_kyeol_ink.png'); save_ink(a, t, OUT + 'B_kyeol_ink_paper.png', bg=paper(*canvas.shape))
save_ink(a, t, OUT + 'B_kyeol_white.png', color=np.array([240, 243, 248.]))

# ───────── C. 명조 결락 + 은빛 마블링 (台中 레퍼런스) ─────────
ft = ImageFont.truetype('/tmp/ttf/noto_kr9.ttf', 620); ft2 = ImageFont.truetype('/tmp/ttf/noto_74_9.ttf', 150); ft3 = ImageFont.truetype('/tmp/ttf/noto_72_9.ttf', 150)
cw, chh = 1700, 900
im = Image.new('L', (cw, chh), 0); d = ImageDraw.Draw(im)
d.text((60, 40), '결락', font=ft, fill=255)
mC = np.asarray(im, float) / 255
y, x = np.mgrid[0:chh, 0:cw].astype(float)
warp = fbm((chh, cw), 260, 4) * 140 + fbm((chh, cw), 90, 3) * 30
bands = .5 + .5 * np.sin((y + warp) / 38)
lines = np.clip(1 - np.abs(np.sin((y + warp * 1.4) / 9)) * 9, 0, 1)        # 마블링 가는 먹선
silver = 70 + 150 * bands ** 1.6
silver = silver * (1 - .55 * lines)
grain = rng.normal(0, 10, (chh, cw))
tone = np.clip(silver + grain, 0, 255)
a, _ = ink(mC, rough=.12, bleed=.0, dry=.15)
rgb = np.dstack([tone * .96, tone * .98, tone * 1.04]); rgb = np.clip(rgb, 0, 255)
side = Image.new('RGBA', (cw, chh), (0, 0, 0, 0)); sd = ImageDraw.Draw(side)
sd.text((1430, 120), '缺', font=ft2, fill=(11, 13, 18, 255)); sd.text((1430, 300), '落', font=ft3, fill=(11, 13, 18, 255))
sd.line([(1470, 470), (1470, 640)], fill=(11, 13, 18, 255), width=2)
outC = Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8), 'RGBA'); outC.alpha_composite(side)
outC.save(OUT + 'C_wordmark_marble.png')
pc = Image.fromarray(paper(chh, cw).astype(np.uint8)).convert('RGBA'); pc.alpha_composite(outC); pc.convert('RGB').save(OUT + 'C_wordmark_marble_paper.png')

# ───────── D. 액체 크롬 '결' (A 실루엣) ─────────
m = mA; Hh = nd.gaussian_filter(m, 16) + nd.gaussian_filter(m, 5) * .5
gy, gx = np.gradient(Hh); nz = np.ones_like(Hh); s = 9
nx, ny = -gx * s * 10, -gy * s * 10; L = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2); nx, ny, nz = nx / L, ny / L, nz / L
ry = ny  # 반사 방향 근사 → 하늘/수평선/바닥 환경 그라데이션
env_t = np.clip(ry * .5 + .5, 0, 1)
sky = np.array([225, 233, 250.]); hor = np.array([30, 40, 70.]); flo = np.array([170, 190, 230.])
et = env_t[..., None]
hz = np.exp(-((et - .52) / .05) ** 2)
envc = np.where(et < .52, sky + (np.array([150, 170, 215.]) - sky) * np.clip(et / .52, 0, 1) ** 3, flo) * (1 - hz * .8) + hor * hz * .8
spec = np.clip(nx * -.4 + ny * -.6 + nz * .7, 0, 1) ** 40
col = envc * (.55 + .45 * nz[..., None]) + 255 * spec[..., None] * .9
fres = (1 - nz) ** 2
col = col * (1 - fres[..., None] * .3)
alpha = np.clip((nd.gaussian_filter(m, 1.2) - .5) * 4 + .5, 0, 1)
bg = np.array([23, 75, 255.]); bgimg = np.ones(m.shape + (3,)) * bg
shadow = nd.shift(nd.gaussian_filter(m, 20), (30, 14)) * .35
bgimg = bgimg * (1 - shadow[..., None])
outD = bgimg * (1 - alpha[..., None]) + np.clip(col, 0, 255) * alpha[..., None]
Image.fromarray(outD.astype(np.uint8)).save(OUT + 'D_gyeol_chrome_cobalt.png')
Image.fromarray(np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8), 'RGBA').save(OUT + 'D_gyeol_chrome.png')

# ───────── E. 인장 缺落 (코발트) ─────────
S = 900; seal = Image.new('L', (S, S), 0); d = ImageDraw.Draw(seal)
d.rounded_rectangle((40, 40, S - 40, S - 40), radius=40, fill=255)
ftE = ImageFont.truetype('/tmp/ttf/msz.ttf', 400)
txt = Image.new('L', (S, S), 0); dt = ImageDraw.Draw(txt)
dt.text((250, 30), '缺', font=ftE, fill=255); dt.text((250, 420), '落', font=ftE, fill=255)
sm = np.asarray(seal, float) / 255; tm = np.asarray(txt, float) / 255
inner = np.zeros((S, S)); inner[80:S - 80, 80:S - 80] = 1
border = sm * (1 - nd.uniform_filter(inner, 3)) + tm      # 테두리 + 글자만 남는 주문(朱文)식
mE = np.clip(sm - tm, 0, 1)                               # 백문(白文)식: 글자를 파냄
a, t = ink(mE, rough=.5, bleed=.08, dry=.7)
wear = np.clip((fbm((S, S), 30, 3) - .8) * 6, 0, 1)      # 찍힌 자국의 빈틈
a = a * (1 - wear * .8)
save_ink(a, t, OUT + 'E_seal_cobalt.png', color=np.array([23, 75, 255.]))
save_ink(a, t, OUT + 'E_seal_cobalt_paper.png', color=np.array([23, 75, 255.]), bg=paper(S, S))
print('done')
