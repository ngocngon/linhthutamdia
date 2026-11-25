import sys,json
from PIL import Image
import numpy as np
src,out,bg=sys.argv[1],sys.argv[2],sys.argv[3]  # bg: den|trang
im=Image.open(src).convert('RGB');W,H=im.size
a=np.asarray(im).astype(np.float32)
if bg=='den':
    mx=a.max(-1);al=np.clip((mx-14)/150,0,1)
    col=np.clip(a/np.maximum(al[...,None],1e-3),0,255)
    col=np.where(al[...,None]>0.02,col,0)
else:
    mn=a.min(-1);al=np.clip((250-mn)/40,0,1)
    col=a
rgba=np.dstack([col,al*255]).astype(np.uint8)
img=Image.fromarray(rgba,'RGBA')
n=4;cw,ch=W/n,H/n;C=192
atl=Image.new('RGBA',(C*n,C*n),(0,0,0,0))
for j in range(n):
  for i in range(n):
    cell=img.crop((round(i*cw),round(j*ch),round((i+1)*cw),round((j+1)*ch)))
    bb=cell.getchannel('A').point(lambda v:255 if v>25 else 0).getbbox()
    if bb:
      cell=cell.crop(bb)
    w,h=cell.size;s=max(w,h)*1.08
    sc=C/s;cell=cell.resize((max(1,round(w*sc)),max(1,round(h*sc))),Image.LANCZOS)
    atl.paste(cell,(i*C+(C-cell.size[0])//2,j*C+(C-cell.size[1])//2),cell)
atl.save(out,'WEBP',quality=82,method=6)
bgv=Image.new('RGBA',atl.size,(30,40,70,255));bgv.alpha_composite(atl);bgv.convert('RGB').save(out.replace('.webp','_xem.png'))
