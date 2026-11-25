import sys,io
from PIL import Image
from rembg import remove,new_session
src,out=sys.argv[1],sys.argv[2]
ses=new_session('isnet-general-use')
im=Image.open(src).convert('RGB');W,H=im.size;n=4;C=192
atl=Image.new('RGBA',(C*n,C*n),(0,0,0,0))
for j in range(n):
  for i in range(n):
    cell=im.crop((round(i*W/n),round(j*H/n),round((i+1)*W/n),round((j+1)*H/n)))
    rg=remove(cell,session=ses).convert('RGBA')
    bb=rg.getchannel('A').point(lambda v:255 if v>25 else 0).getbbox()
    if bb: rg=rg.crop(bb)
    w,h=rg.size;s=max(w,h)*1.08;sc=C/s
    rg=rg.resize((max(1,round(w*sc)),max(1,round(h*sc))),Image.LANCZOS)
    atl.paste(rg,(i*C+(C-rg.size[0])//2,j*C+(C-rg.size[1])//2),rg)
atl.save(out,'WEBP',quality=82,method=6)
bg=Image.new('RGBA',atl.size,(30,40,70,255));bg.alpha_composite(atl);bg.convert('RGB').save('/home/claude/fxwork/xem_trang.png')
