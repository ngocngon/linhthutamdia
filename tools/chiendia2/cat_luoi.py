import cv2,sys,json,os
g={str(x['luoi']):x['o'] for x in json.load(open('/home/claude/chiendia_nhom.json'))}
sr=cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel('/home/claude/sr/FSRCNN_x2.pb'); sr.setModel('fsrcnn',2)
out='/home/claude/cd2/l'; os.makedirs(out,exist_ok=True)
for n in sys.argv[1:]:
    im=cv2.imread(f'/home/claude/cd2/goc/{int(n):02d}.png'); H,W=im.shape[:2]; h,w=H//2,W//2; m=4
    for i,k in enumerate(g[str(int(n))]):
        r,c=divmod(i,2); cell=im[r*h+m:(r+1)*h-m, c*w+m:(c+1)*w-m]
        up=cv2.resize(sr.upsample(cell),(1024,1024),interpolation=cv2.INTER_AREA)
        cv2.imwrite(f'{out}/{k}.webp',up,[cv2.IMWRITE_WEBP_QUALITY,82])
    print(n,'ok')
