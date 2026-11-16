import sys, json, os
from playwright.sync_api import sync_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8817/index.html'
OUT=sys.argv[2] if len(sys.argv)>2 else '/workspace/gyeollak-site/menu-scroll-v1/shots/'
VW,VH=(int(sys.argv[3]),int(sys.argv[4])) if len(sys.argv)>4 else (1440,900)
os.makedirs(OUT,exist_ok=True)
# (name, kind, a, b): kind z=zone index & local progress of ref line, s=scene sticky progress, p=paper offset (vh fraction of paper top above viewport bottom)
POS=[('02_open_blob','y',0,0),('03_open_frame','s',0,.3),('04_open_dock','s',0,.78),('05_hole','z',1,.42),('06_hole_late','z',1,.7),
 ('07_members_title','s',2,.12),('08_members_huge','s',2,.32),('09_members_sub_box','s',2,.78),('10_members_tear','p',0,.55),('11_members_panels','p',0,1.45),
 ('12_melt_line','z',3,.32),('13_melt_to_music','z',3,.68),('14_music_huge','s',4,.3),('15_music_box','s',4,.8),('16_music_paper','p',1,1.3),
 ('17_hole2','z',5,.5),('18_world_huge','s',6,.3),('19_world_box','s',6,.8),('20_world_paper','p',2,1.2),('21_melt2','z',7,.3),
 ('22_archive_huge','s',8,.3),('23_archive_box','s',8,.8),('24_archive_paper','p',3,1.1),('25_footer','end',0,0)]
errs=[]
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path='/opt/google/chrome/chrome',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
    ctx=b.new_context(viewport={'width':VW,'height':VH},device_scale_factor=1)
    pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(BASE,wait_until='networkidle'); pg.wait_for_timeout(900)
    pg.screenshot(path=f'{OUT}01_open_particles.jpg',type='jpeg',quality=84)
    pg.wait_for_timeout(3600)
    for name,k,a,f in POS:
        Z=pg.evaluate('GY.zones()'); P=pg.evaluate('GY.papers()')
        if k=='y': y=0
        elif k=='z': z=Z[a]; y=z['top']+z['h']*f-VH/2
        elif k=='s': z=Z[a]; y=z['top']+(z['h']-VH)*f
        elif k=='p': y=P[a]['top']-VH+VH*f
        else: y=pg.evaluate('document.documentElement.scrollHeight')
        pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(700)
        pg.screenshot(path=f'{OUT}{name}.jpg',type='jpeg',quality=84)
    ctx.close(); b.close()
print(json.dumps(errs[:20],ensure_ascii=False))
