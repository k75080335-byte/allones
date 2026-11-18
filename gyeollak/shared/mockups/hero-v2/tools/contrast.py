import json,sys,re
from PIL import Image
import numpy as np
def lum(c):
    c=np.asarray(c,dtype=float)/255; c=np.where(c<=.03928,c/12.92,((c+.055)/1.055)**2.4); return .2126*c[...,0]+.7152*c[...,1]+.0722*c[...,2]
worst={}
for tag in sys.argv[1:]:
    for fr in json.load(open(f'_work/cx/{tag}.json')):
        im=np.array(Image.open(fr['f']).convert('RGB'))
        for it in fr['items']:
            if it['op']<.6: continue
            if it['s']=='.title .en' and fr['t']<3.7: continue
            if it['s']=='.slogan .br' and fr['t']<4.6: continue
            x0,y0=max(0,int(it['x'])),max(0,int(it['y'])); x1,y1=min(im.shape[1],int(it['x']+it['w'])+1),min(im.shape[0],int(it['y']+it['h'])+1)
            if x1<=x0 or y1<=y0: continue
            reg=lum(im[y0:y1,x0:x1].reshape(-1,3))
            m=re.findall(r'[\d.]+',it['color']); rgb=[float(v) for v in m[:3]]; a=float(m[3]) if len(m)>3 else 1
            bgmean=im[y0:y1,x0:x1].reshape(-1,3).mean(0)
            col=np.array(rgb)*a+bgmean*(1-a)
            if it.get('blend'):
                px=im[y0:y1,x0:x1].reshape(-1,3).astype(float); eff=np.abs(np.array(rgb)-px); Lb_=lum(px); Le=lum(eff)
                crs=(np.maximum(Le,Lb_)+.05)/(np.minimum(Le,Lb_)+.05); cr=float(np.percentile(crs,2))
            else:
                Lt=float(lum(col))
                Lb=np.percentile(reg,98) if Lt>reg.mean() else np.percentile(reg,2)
                cr=(max(Lt,Lb)+.05)/(min(Lt,Lb)+.05)
            large=it['fs']>=24 or (it['fs']>=18.66 and int(it['fw'])>=700)
            need=3 if large else 4.5
            k=(tag,it['s'])
            if k not in worst or cr<worst[k][0]: worst[k]=(round(cr,2),fr['t'],need)
for k,v in sorted(worst.items()):
    print(f"{k[0]:3} {k[1]:14} min {v[0]:5}:1 at t={v[1]}s  need {v[2]}  {'PASS' if v[0]>=v[2] else 'FAIL'}")
