#!/usr/bin/env python3
"""Phân tích ảnh thẻ để biết thẻ nào dùng được "Nền thẻ".
Phát hiện: các sprite sheet (www/img/s) đã là PNG/WebP có kênh alpha (nhân vật tách nền sẵn),
nên không cần cắt lại. Script đo mỗi ô: tỉ lệ điểm ảnh giữ lại, số "đảo" rời, độ phủ viền,
rồi ghi www/img/cut/_kem.json = {id: lý do} cho thẻ KHÔNG hợp (nền gốc đã vẽ liền, quá ít/nhiều điểm ảnh…).
Thẻ trong _kem.json sẽ hiện tranh gốc ("Thẻ này chưa hỗ trợ nền").
Tuỳ chọn --rembg (thử nghiệm): tách bằng rembg (isnet-general-use) các thẻ lỗi -> www/img/cut/<id>.webp (400px, alpha, làm mịn viền)
để xem/so sánh; web hiện KHÔNG dùng các file này (thẻ lỗi hiện tranh gốc). Đã xem tay 6 thẻ lỗi: rembg chỉ sạch được 3/6.
Chạy lại được, bỏ qua file đã có. Dùng: python3 tools/tach_nen_nhan_vat.py [--rembg] [--sheet contact.png]"""
import json,re,sys,os
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','www')
src=open(os.path.join(ROOT,'js/03-data-store.js'),encoding='utf8').read()
imgs=json.loads(re.search(r'IMGS=\{"c":(\{[^}]*\})',src).group(1))
OUT=os.path.join(ROOT,'img/cut');os.makedirs(OUT,exist_ok=True)
sheets={};stats={};kem={}
MANUAL_KEM={'datamtri':'quang-trang','phiung':'quang-trang','matoc':'quang-trang','lucthan':'quang-trang','maydotam':'quang-trang','mieunuot':'quang-trang'}  # đã xem tay: rembg cũng không sạch

def cell(id):
    f,i=imgs[id].split('#');f=f.split('?')[0];i=int(i)
    if f not in sheets:sheets[f]=Image.open(os.path.join(ROOT,f)).convert('RGBA')
    return sheets[f].crop(((i%2)*512,(i>>1)*512,(i%2)*512+512,(i>>1)*512+512))
for id in sorted(imgs):
    if imgs[id].find('#')<0:continue
    a=np.array(cell(id))[:,:,3]
    kept=float((a>128).mean())
    m=a>128
    lab,n=ndimage.label(m)
    big=0
    if n:
        sz=ndimage.sum(m,lab,range(1,n+1));big=int((sz>m.sum()*0.01).sum())
    edge=float(np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]).__gt__(128).mean())
    c=np.array(cell(id)).astype(float);semi=(a>12)&(a<235);halo=float((semi&(c[:,:,:3].mean(2)>215)).mean())
    stats[id]=dict(halo=round(halo,3),kept=round(kept,3),islands=big,edge=round(edge,3))
    why=[]
    if kept>0.92 or edge>0.6:why.append('nen-lien')
    elif kept>0.80:why.append('qua-nhieu')
    if halo>0.04:why.append('quang-trang')
    if kept<0.04:why.append('qua-it')
    if big>25:why.append('nhieu-dao')
    if why:kem[id]='+'.join(why)
if '--rembg' in sys.argv:
    for k in MANUAL_KEM:kem[k]=MANUAL_KEM[k]
    from rembg import new_session,remove
    s=new_session('isnet-general-use')
    for id in [k for k in kem]:
        p=os.path.join(OUT,id+'.webp')
        if os.path.exists(p):continue
        o=remove(cell(id).convert('RGB'),session=s,alpha_matting=False)
        a=np.array(o)[:,:,3];k=(a>128).mean()
        if 0.08<k<0.8:  # chỉ ghi, KHÔNG gỡ khỏi _kem.json
            al=ndimage.gaussian_filter(a.astype(float),0.8).clip(0,255).astype('uint8');o=np.array(o);o[:,:,3]=al
            Image.fromarray(o).resize((400,400),Image.LANCZOS).save(p,'WEBP',quality=80)
for k,v in MANUAL_KEM.items():
    if k in kem:kem[k]=v
json.dump(kem,open(os.path.join(OUT,'_kem.json'),'w'),ensure_ascii=False,indent=0,sort_keys=True)
print('tong',len(stats),'kem',len(kem))
for k,v in sorted(kem.items()):print(k,v,stats[k])
if '--sheet' in sys.argv:
    pth=sys.argv[sys.argv.index('--sheet')+1];ids=sorted(stats);T=96;cols=40;rows=(len(ids)+cols-1)//cols
    for name,bg in (('chk',None),('dark',(30,34,80,255))):
        im=Image.new('RGBA',(cols*T,rows*T),(0,0,0,255))
        for n,id in enumerate(ids):
            t=Image.new('RGBA',(T,T),bg or (255,255,255,255))
            if not bg:
                for y in range(0,T,12):
                    for x in range(0,T,12):
                        if (x//12+y//12)%2:t.paste((190,190,190,255),(x,y,x+12,y+12))
            t.alpha_composite(cell(id).resize((T,T),Image.LANCZOS))
            if id in kem:
                from PIL import ImageDraw;ImageDraw.Draw(t).rectangle((0,0,T-1,T-1),outline=(255,0,0,255),width=3)
            im.paste(t,((n%cols)*T,(n//cols)*T))
        im.convert('RGB').save(pth.replace('.png','_%s.png'%name))
