#!/usr/bin/env python3
"""Sinh www/css/07-nen-the.css (nền thẻ dạng CSS/SVG). Chạy: python3 tools/dung_css_nen_the.py"""
import math,random,os
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','www','css','07-nen-the.css') if '__file__' in globals() else 'x.css'
def U(svg):
    s=svg.replace('"',"'").replace('%','%25').replace('#','%23').replace('<','%3C').replace('>','%3E').replace('\n','')
    return 'url("data:image/svg+xml,'+s+'")'
def S(w,h,body,defs='',extra=''):
    return U(f"<svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}' viewBox='0 0 {w} {h}'{extra}>{('<defs>'+defs+'</defs>') if defs else ''}{body}</svg>")
def f(x):return ('%.2f'%x).rstrip('0').rstrip('.')
css=[]
def R(sel,body):css.append(sel+'{'+body+'}')

# ---------------- cơ sở ----------------
css.append('''/* NỀN THẺ (07-nen-the.css) — sinh bởi tools/dung_css_nen_the.py; sửa từng nền: thêm img/nen/<id>.webp và đưa id vào NEN.IMG trong js/11-nen-the.js */
nb-l{display:block}
.nth{position:absolute;left:0;top:0;right:0;bottom:0;z-index:0;border-radius:inherit;overflow:hidden;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;contain:paint}
.nth::before,.nth::after{content:"";position:absolute;pointer-events:none;will-change:auto}
.nth .nbm{display:none}
.nth.nbi{background-image:var(--nbimg)!important;background-size:cover!important;background-position:center!important}
.nth.nbi::before,.nth.nbi::after{display:none}
/* hoạt ảnh chỉ chạy ở thẻ lớn (xem thẻ, cửa hàng, xem thử); thẻ trong trận, tay bài, lưới sưu tập đứng yên ở khung hình đầu */
.nth[data-nth]::before,.nth[data-nth]::after{animation-play-state:paused}
.bigc>.nth[data-nth]::before,.bigc>.nth[data-nth]::after,#ovPZ .gc>.nth[data-nth]::before,#ovPZ .gc>.nth[data-nth]::after,#zoom .gc>.nth[data-nth]::before,#zoom .gc>.nth[data-nth]::after,.nbpv>.nth[data-nth]::before,.nbpv>.nth[data-nth]::after{animation-play-state:running}
body.rm .nth::before,body.rm .nth::after,body.nblow .nth::before,body.nblow .nth::after{animation:none!important}
@media (prefers-reduced-motion:reduce){.nth::before,.nth::after{animation:none!important}}
.nth-vig{--v:radial-gradient(ellipse at 50% 46%,rgba(6,8,28,.0) 28%,rgba(6,8,28,.62) 100%)}
''')

def vig(a=.55,b=.12):
    return f"radial-gradient(ellipse at 50% 48%,rgba(6,8,28,{b}) 25%,rgba(6,8,28,{a}) 100%)"
FOIL_POS='var(--mx,50%) var(--my,50%)'

# ---------------- Ngũ hành ----------------
def eng(w,h,body,op=.14):
    # chạm khắc: nét sáng + nét tối lệch 1px
    return S(w,h,f"<g fill='none' stroke='#000' stroke-opacity='{op}' stroke-width='1.3' transform='translate(.9 .9)'>{body}</g><g fill='none' stroke='#fff' stroke-opacity='{op+.04}' stroke-width='.9'>{body}</g>")
kim=eng(32,32,"<circle cx='16' cy='16' r='10.5'/><rect x='12.5' y='12.5' width='7' height='7'/><path d='M0 0l5 5M32 0l-5 5M0 32l5-5M32 32l-5-5'/>")
moc=eng(36,44,"<path d='M18 3c9 7 9 19 0 30c-9-11-9-23 0-30zM18 9v28M18 17l-5-4M18 22l5-4M18 27l-4-3'/>")
thuy=eng(40,20,"<circle cx='10' cy='20' r='10'/><circle cx='10' cy='20' r='6.3'/><circle cx='10' cy='20' r='2.6'/><circle cx='30' cy='20' r='10'/><circle cx='30' cy='20' r='6.3'/><circle cx='30' cy='20' r='2.6'/><circle cx='20' cy='10' r='10'/><circle cx='20' cy='10' r='6.3'/><circle cx='20' cy='10' r='2.6'/><circle cx='0' cy='10' r='10'/><circle cx='0' cy='10' r='6.3'/><circle cx='40' cy='10' r='10'/><circle cx='40' cy='10' r='6.3'/>")
hoa=eng(30,40,"<path d='M15 37c-8-4-10-13-3-21c1 5 4 6 5 2c4 5 9 11-2 19z'/><path d='M15 33c-3-2-4-6-1-10'/>")
tho=eng(26,26,"<path d='M3 3h20v20H7V9h12v8h-6v-3'/>")
def el(id,grad,pat,sz,extra=''):
    R(f'.nth-{id}',f"background-image:{vig(.5,.0)},{pat},{grad};background-size:cover,{sz},cover;background-repeat:no-repeat,repeat,no-repeat{extra}")
el('kim',"linear-gradient(155deg,#3c404c 0%,#7c8190 30%,#c3c8d4 48%,#6b7080 66%,#363a46 100%)",kim,'32px 32px')
el('moc',"linear-gradient(160deg,#0c2417 0%,#1d5a31 45%,#3f9150 70%,#123a22 100%)",moc,'36px 44px')
el('thuy',"linear-gradient(170deg,#06214a 0%,#0e4a8c 40%,#1c86b8 70%,#0a3566 100%)",thuy,'40px 20px')
el('hoa',"linear-gradient(190deg,#3a0806 0%,#a3200d 38%,#ee6a18 72%,#7a1409 100%)",hoa,'30px 40px')
el('tho',"linear-gradient(160deg,#3b2410 0%,#7d5424 42%,#b98a45 65%,#5a3a17 100%)",tho,'26px 26px')

# ---------------- Hoạ tiết Việt ----------------
# Trống đồng Đông Sơn
cx,cy=50,70;g='#e8c76a'
b=f"<g fill='none' stroke='{g}' stroke-linecap='round' stroke-linejoin='round'>"
b+=f"<circle cx='{cx}' cy='{cy}' r='66' stroke-opacity='.3' stroke-width='.7'/><circle cx='{cx}' cy='{cy}' r='62' stroke-opacity='.6' stroke-width='3.2' stroke-dasharray='.7 2.1'/>"
b+=f"<circle cx='{cx}' cy='{cy}' r='56' stroke-opacity='.55' stroke-width='1.2'/><circle cx='{cx}' cy='{cy}' r='38.5' stroke-opacity='.55' stroke-width='1.2'/><circle cx='{cx}' cy='{cy}' r='36.5' stroke-opacity='.35' stroke-width='.6'/>"
# chim lạc 14 con
for i in range(14):
    a=i*360/14;b+=f"<g transform='rotate({f(a)} {cx} {cy}) translate({cx} {cy-47.5})' stroke-opacity='.85' stroke-width='.8'><path d='M-5.2 .5q2.8-3.6 5.2-3.6t5.2 3.6M0 -3.1l2.8-2.7M5.2 .5q.9 1.5 3.2 1.3M-5.2 .5q-.9 1.5-3.2 1.3M-1.2 1.6h2.4'/></g>"
# vòng răng cưa
pts=[]
for i in range(48):
    r=29 if i%2==0 else 24.5;a=i*math.pi*2/48;pts.append(f"{f(cx+r*math.cos(a))},{f(cy+r*math.sin(a))}")
b+=f"<polygon points='{' '.join(pts)}' stroke-opacity='.6' stroke-width='.8'/><circle cx='{cx}' cy='{cy}' r='20' stroke-opacity='.5' stroke-width='.7' stroke-dasharray='.5 1.6'/>"
# sao 14 cánh
pts=[]
for i in range(28):
    r=19 if i%2==0 else 9;a=i*math.pi*2/28-math.pi/2;pts.append(f"{f(cx+r*math.cos(a))},{f(cy+r*math.sin(a))}")
b+=f"<polygon points='{' '.join(pts)}' stroke-opacity='.9' stroke-width='1' fill='{g}' fill-opacity='.2'/><circle cx='{cx}' cy='{cy}' r='5' fill='{g}' fill-opacity='.85' stroke='none'/><circle cx='{cx}' cy='{cy}' r='7.4' stroke-opacity='.8' stroke-width='.8'/></g>"
dongson=S(100,140,b)
R('.nth-trongdong',f"background-image:{vig(.6,.18)},{dongson},radial-gradient(circle at 50% 50%,#3f7a64 0,#2a5547 42%,#142b2c 100%);background-size:cover,cover,cover")

# Tranh Đông Hồ
b="<rect width='100' height='140' fill='none'/>"
def dia(x,y,s,fill):return f"<polygon points='{x},{y-s} {x+s*.7},{y} {x},{y+s} {x-s*.7},{y}' fill='{fill}' stroke='#241a14' stroke-width='.5'/>"
b+="<rect x='3' y='3' width='94' height='134' fill='none' stroke='#241a14' stroke-width='1.1'/><rect x='6' y='6' width='88' height='128' fill='none' stroke='#c8352b' stroke-width='.7'/>"
for i in range(11):
    b+=dia(10+i*8,10.5,3,'#c8352b' if i%2 else '#e8b43a')+dia(10+i*8,129.5,3,'#c8352b' if i%2 else '#e8b43a')
# mặt trời
b+="<g transform='translate(50 33)'>"+''.join(f"<polygon points='-2.6,-15 2.6,-15 0,-23' transform='rotate({i*30})' fill='#e8b43a' stroke='#241a14' stroke-width='.5'/>" for i in range(12))
b+="<circle r='13' fill='#d63a2c' stroke='#241a14' stroke-width='1'/><circle r='7.5' fill='none' stroke='#f6dc9a' stroke-width='.9'/><circle r='3' fill='#f6dc9a'/></g>"
# mây cuộn
for (x,y,m) in ((22,60,1),(78,64,-1)):
    b+=f"<g transform='translate({x} {y}) scale({m} 1)' fill='#8cc7d4' stroke='#241a14' stroke-width='.9'><path d='M-14 4q0-8 7-8q3-5 9-2q8-1 8 7q4 1 4 5h-28q-2 0 0-2z'/><path d='M-4 -1q3-3 6 0t-3 4' fill='none'/></g>"
# tre hai bên
for x in (12,88):
    b+=f"<g stroke='#241a14' stroke-width='.7'><rect x='{x-2}' y='72' width='4' height='56' fill='#4ea05a'/>"+''.join(f"<rect x='{x-2.4}' y='{y}' width='4.8' height='1.6' fill='#2f7a3c'/>" for y in range(78,128,9))+"</g>"
# sóng dưới
for k,(y,c) in enumerate(((104,'#2c6e8f'),(111,'#3b8b4a'),(118,'#c8352b'))):
    b+=f"<path d='M6 {y}"+''.join(f"q4 -6 8 0" for _ in range(11))+f"V{y+9}H6z' fill='{c}' stroke='#241a14' stroke-width='.6'/>" if False else ''
for y,c in ((98,'#2c6e8f'),(106,'#3b8b4a'),(114,'#e8b43a'),(122,'#c8352b')):
    b+=f"<path d='M6 {y}"+''.join("q3.67 -6.5 7.33 0" for _ in range(12))+f"V138H6z' fill='{c}' stroke='#241a14' stroke-width='.6'/>"
donghoo=S(100,140,b)
dots=S(9,9,"<circle cx='2' cy='2' r='.7' fill='#fff' fill-opacity='.9'/><circle cx='6.4' cy='6' r='.5' fill='#ffe9a8' fill-opacity='.9'/>")
R('.nth-donghoo',f"background-image:{vig(.5,.08)},{dots},{donghoo},linear-gradient(160deg,#f0e1b9,#e3cc94);background-size:cover,9px 9px,cover,cover;background-repeat:no-repeat,repeat,no-repeat,no-repeat")

# Gốm lam
bl='#1d4aa0'
b=f"<g fill='none' stroke='{bl}' stroke-linecap='round' stroke-linejoin='round'>"
b+=f"<path d='M0 9"+"q5 -9 10 0 t10 0"*1+"t10 0"*9+f"' stroke-width='1.2' stroke-opacity='.8'/>"
b+=f"<path d='M0 13"+"q5 -9 10 0 t10 0"*1+"t10 0"*9+f"' stroke-width='.6' stroke-opacity='.6'/>"
b+=f"<path d='M0 131"+"q5 9 10 0 t10 0"*1+"t10 0"*9+f"' stroke-width='1.2' stroke-opacity='.8'/><path d='M0 127"+"q5 9 10 0 t10 0"*1+"t10 0"*9+f"' stroke-width='.6' stroke-opacity='.6'/>"
# sen
for i,(R_,sc) in enumerate(((34,1),(26,.8),(18,.6))):
    pass
for ang in range(-80,81,20):
    b+=f"<g transform='translate(50 140) rotate({ang})'><path d='M0 -22c-9 -9 -9 -22 0 -34c9 12 9 25 0 34z' fill='{bl}' fill-opacity='.14' stroke-opacity='.85' stroke-width='.9'/><path d='M0 -26v-22' stroke-opacity='.5' stroke-width='.6'/></g>"
for sx in (1,-1):
    b+=f"<g transform='translate({50+sx*40} 70) scale({sx} 1)'><path d='M0 40c-10 -16 -10 -34 0 -44' stroke-width='1' stroke-opacity='.7'/>"+''.join(f"<path d='M{-1} {y}c8 -2 11 -8 10 -12c-6 0 -11 4 -10 12z' fill='{bl}' fill-opacity='.18' stroke-opacity='.8' stroke-width='.8'/>" for y in (30,16,2))+"<circle cx='-6' cy='-6' r='3' fill='"+bl+"' fill-opacity='.2' stroke-width='.8'/></g>"
b+="</g>"
gomlam=S(100,140,b)
R('.nth-gomlam',f"background-image:radial-gradient(ellipse at 50% 46%,rgba(18,40,110,.0) 38%,rgba(18,40,110,.38) 100%),{gomlam},radial-gradient(circle at 50% 38%,#fcfdff,#e6edf8 66%,#ccd8ee);background-size:cover")

# Sơn mài (vàng bạc trên nền son)
rnd=random.Random(7)
b=""
for i in range(46):
    x,y=rnd.uniform(2,98),rnd.uniform(2,138);s=rnd.uniform(1.1,3.8);n=rnd.randint(4,6)
    pts=' '.join(f"{f(x+s*rnd.uniform(.5,1.25)*math.cos(k*6.283/n+rnd.uniform(-.4,.4)))},{f(y+s*rnd.uniform(.5,1.25)*math.sin(k*6.283/n+rnd.uniform(-.4,.4)))}" for k in range(n))
    b+=f"<polygon points='{pts}' fill='url(#g{i%3})' fill-opacity='{f(rnd.uniform(.5,.95))}'/>"
sw="<g fill='none' stroke='#e9c25a' stroke-opacity='.45' stroke-width='.7' stroke-linecap='round'><path d='M-4 28c18 -16 30 14 52 -2s34 -10 56 8'/><path d='M-4 112c20 14 32 -10 54 4s32 8 56 -6'/><path d='M10 70c8 -10 18 -10 22 0s-6 14 -14 8'/><path d='M70 60c8 -10 18 -10 22 0s-6 14 -14 8'/></g>"
defs="<linearGradient id='g0' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fff1b0'/><stop offset='1' stop-color='#c8921f'/></linearGradient><linearGradient id='g1' x1='1' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f4d060'/><stop offset='1' stop-color='#9b6a12'/></linearGradient><linearGradient id='g2' x1='0' y1='1' x2='1' y2='0'><stop offset='0' stop-color='#e6e6e0'/><stop offset='1' stop-color='#b99a4a'/></linearGradient>"
sonmai=S(100,140,sw+b,defs)
R('.nth-sonmai',f"background-image:linear-gradient(112deg,transparent 38%,rgba(255,255,255,.13) 50%,transparent 62%),{vig(.55,.1)},{sonmai},linear-gradient(160deg,#4d070a,#a3171a 42%,#7d0f12 68%,#35050a);background-size:cover")

# Khảm xà cừ
hexs=[]
defs="<linearGradient id='p' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#8ff0e0'/><stop offset='.5' stop-color='#d9b6ff'/><stop offset='1' stop-color='#ffe8c4'/></linearGradient><linearGradient id='q' x1='1' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff3da'/><stop offset='.5' stop-color='#9fd8ff'/><stop offset='1' stop-color='#f3a9d6'/></linearGradient>"
tile=""
def hexa(cx,cy,r,fill):
    return "<polygon points='"+' '.join(f"{f(cx+r*math.cos(k*math.pi/3+math.pi/6))},{f(cy+r*math.sin(k*math.pi/3+math.pi/6))}" for k in range(6))+f"' fill='url(#{fill})' fill-opacity='.62' stroke='#e9c25a' stroke-opacity='.65' stroke-width='.7'/>"
w=20;h=17.32
tile=hexa(10,8.66,8.6,'p')+hexa(0,17.32,8.6,'q')+hexa(20,17.32,8.6,'q')+hexa(0,0,8.6,'q')+hexa(20,0,8.6,'q')
xa=S(20,17.32*2/2,tile,defs)
xa2=S(40,34.64,hexa(10,8.66,8.6,'p')+hexa(30,8.66,8.6,'q')+hexa(0,25.98,8.6,'q')+hexa(20,25.98,8.6,'p')+hexa(40,25.98,8.6,'q')+hexa(0,-8.66,8.6,'q')+hexa(20,-8.66,8.6,'q')+hexa(40,-8.66,8.6,'q')+hexa(10,43,8.6,'q')+hexa(30,43,8.6,'p'),defs)
R('.nth-khamxacu',f"background-image:linear-gradient(112deg,transparent 30%,rgba(255,255,255,.16) 50%,transparent 70%),{vig(.55,.05)},{xa2},linear-gradient(160deg,#0c0d18,#1b1630 55%,#08090f);background-size:240% 240%,cover,40px 34.64px,cover;background-position:{FOIL_POS},center,center,center;background-repeat:no-repeat,no-repeat,repeat,no-repeat")

# ---------------- Phong cảnh ----------------
LAND={'halong':'halong','bacthang':'terrace','hoian':'hoian','sapa':'sapa','phongnha':'phongnha','hoguom':'hoguom','hue':'kinhthanhhue','muine':'muine','bangioc':'bangioc','thapcham':'thapcham','ngocson':'ngocson','vanmieu':'vanmieu'}
for k,fn in LAND.items():
    R(f'.nth-{k}',f"background-image:radial-gradient(ellipse at 50% 52%,rgba(6,8,28,.06) 30%,rgba(6,8,28,.6) 100%),linear-gradient(180deg,rgba(6,8,28,.28),rgba(6,8,28,0) 30%),url(../img/l/{fn}.webp);background-size:cover,cover,cover")

# ---------------- Ánh kim ----------------
tex=S(6,6,"<circle cx='1.5' cy='1.5' r='.9' fill='#fff' fill-opacity='.22'/><circle cx='4.5' cy='4.5' r='.9' fill='#000' fill-opacity='.18'/>")
def foil(id,grad,extra_after):
    R(f'.nth-{id}',f"background-image:{vig(.42,.0)},{tex},{grad};background-size:cover,6px 6px,260% 260%;background-position:center,center,{FOIL_POS};background-repeat:no-repeat,repeat,no-repeat")
    R(f'.nth-{id}::after',"left:-60%;top:-10%;width:60%;height:120%;transform:translateX(40%) skewX(-18deg);"+extra_after)
band="background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);opacity:.5;animation:nbSheen 4.2s ease-in-out infinite"
foil('vangdat',"linear-gradient(135deg,#5e3f08 0%,#c99a2e 16%,#fbe58f 30%,#b98a1f 46%,#f5d66a 60%,#8e6516 78%,#4a3206 100%)",band)
foil('bac',"linear-gradient(135deg,#2a2f3a 0%,#8d95a6 16%,#f3f6fb 30%,#8b93a3 46%,#e6ebf3 60%,#6a7282 78%,#262b35 100%)",band)
R('.nth-cauvong',f"background-image:{vig(.4,.0)},{S(14,14,'<circle cx=\"3\" cy=\"3\" r=\".8\" fill=\"#fff\" fill-opacity=\".7\"/><circle cx=\"10\" cy=\"9\" r=\".6\" fill=\"#fff\" fill-opacity=\".6\"/>')},repeating-linear-gradient(115deg,rgba(255,255,255,.0) 0 7px,rgba(255,255,255,.10) 7px 8px),linear-gradient(115deg,#ff5d9e,#ffb35a,#fff07a,#6dff9b,#4fd8ff,#8a7bff,#ff5dd6,#ff5d9e);background-size:cover,14px 14px,cover,300% 300%;background-position:center,center,center,{FOIL_POS};background-repeat:no-repeat,repeat,no-repeat,no-repeat")
R('.nth-cauvong::after',"left:-60%;top:-10%;width:60%;height:120%;transform:translateX(40%) skewX(-18deg);"+band.replace('.5','.42',1))

# ---------------- Nền động ----------------
cl="<g fill='#fff' fill-opacity='.92'><ellipse cx='25' cy='40' rx='20' ry='7'/><circle cx='15' cy='34' r='7'/><circle cx='27' cy='30' r='9'/><circle cx='38' cy='35' r='6.5'/></g><g fill='#cfe3fb' fill-opacity='.6'><ellipse cx='25' cy='44' rx='18' ry='3'/></g><g fill='#fff' fill-opacity='.8'><ellipse cx='76' cy='20' rx='16' ry='5.5'/><circle cx='68' cy='16' r='5.5'/><circle cx='78' cy='14' r='7'/><circle cx='86' cy='18' r='5'/></g><g fill='#fff' fill-opacity='.7'><ellipse cx='70' cy='52' rx='14' ry='4.5'/><circle cx='64' cy='48' r='5'/><circle cx='73' cy='46' r='6'/></g>"
cloud=S(100,60,cl)
R('.nth-maytroi',f"background-image:{vig(.35,.0)},linear-gradient(180deg,#3f95e0 0%,#8ecbf2 52%,#ffe0bf 100%);background-size:cover")
R('.nth-maytroi::before',f"left:0;top:12%;width:200%;height:46%;background:{cloud} repeat-x;background-size:50% 100%;animation:nbSlide 70s linear infinite;opacity:.95")
R('.nth-maytroi::after',f"left:0;top:56%;width:200%;height:36%;background:{cloud} repeat-x;background-size:50% 100%;animation:nbSlide 42s linear infinite;opacity:.6;filter:none")
# đèn trời
def lant(x,y,s,c1='#ffb347',c2='#ff7a1f'):
    return f"<g transform='translate({x} {y}) scale({s})'><circle r='11' fill='url(#gl)'/><path d='M-4.6 -6.5h9.2l2.4 12h-14z' fill='url(#bd)' stroke='#ffe6a8' stroke-opacity='.6' stroke-width='.4'/><rect x='-3.6' y='-7.6' width='7.2' height='1.6' rx='.6' fill='#7a3a12'/><path d='M-5.5 6.4h11' stroke='#7a3a12' stroke-width='1.3'/></g>"
defs="<radialGradient id='gl'><stop offset='0' stop-color='#ffc65a' stop-opacity='.65'/><stop offset='1' stop-color='#ff8a2a' stop-opacity='0'/></radialGradient><linearGradient id='bd' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffe08a'/><stop offset='1' stop-color='#ff7a2a'/></linearGradient>"
L1=''.join(lant(x,y,s) for x,y,s in ((18,14,.9),(66,30,1.15),(38,52,.7),(84,70,.85),(24,82,1.2),(58,94,.75)))
L2=''.join(lant(x,y,s) for x,y,s in ((78,10,.7),(30,34,.9),(52,66,1.0),(12,56,.6),(88,92,.9),(40,100,.65)))
R('.nth-dentroi',f"background-image:{vig(.5,.05)},radial-gradient(circle at 50% 100%,rgba(255,150,60,.5),transparent 55%),linear-gradient(180deg,#0b0f3a 0%,#1d1b5e 45%,#4a2a6a 80%,#7a3a55 100%);background-size:cover")
R('.nth-dentroi::before',f"left:0;top:0;width:100%;height:200%;background:{S(100,100,L1,defs)} repeat-y;background-size:100% 50%;animation:nbRise 26s linear infinite")
R('.nth-dentroi::after',f"left:0;top:0;width:100%;height:200%;background:{S(100,100,L2,defs)} repeat-y;background-size:100% 50%;animation:nbRise 17s linear infinite;opacity:.85")
# sóng nước
w1=S(100,40,"<path d='M0 18q12.5 -14 25 0t25 0t25 0t25 0V40H0z' fill='#7fe0ff' fill-opacity='.35'/><path d='M0 22q12.5 -14 25 0t25 0t25 0t25 0' fill='none' stroke='#d8f6ff' stroke-opacity='.7' stroke-width='1.1'/>")
w2=S(99,40,"<path d='M0 16q16.5 -12 33 0t33 0t33 0V40H0z' fill='#0a5a9a' fill-opacity='.55'/><path d='M0 16q16.5 -12 33 0t33 0t33 0' fill='none' stroke='#bfeeff' stroke-opacity='.55' stroke-width='1'/>")
R('.nth-songnuoc',f"background-image:{vig(.45,.0)},radial-gradient(circle at 72% 14%,rgba(255,255,255,.35),transparent 26%),linear-gradient(180deg,#0a2e5e 0%,#0f6a9e 48%,#12a0b8 100%);background-size:cover")
R('.nth-songnuoc::before',f"left:0;top:34%;width:200%;height:30%;background:{w1} repeat-x;background-size:50% 100%;animation:nbSlide 9s linear infinite")
R('.nth-songnuoc::after',f"left:0;top:58%;width:200%;height:42%;background:{w2} repeat-x;background-size:50% 100%;animation:nbSlideR 13s linear infinite")
# lửa
def fl(x,y,s,c):
    return f"<path d='M{x-9*s} {y}C{x-10*s} {y-14*s} {x-1*s} {y-18*s} {x} {y-36*s}C{x+2*s} {y-20*s} {x+12*s} {y-14*s} {x+9*s} {y}Z' fill='{c}'/>"
defs="<linearGradient id='fa' x1='0' y1='1' x2='0' y2='0'><stop offset='0' stop-color='#ffe27a'/><stop offset='.5' stop-color='#ff8a1f'/><stop offset='1' stop-color='#d8200e' stop-opacity='.9'/></linearGradient><linearGradient id='fb' x1='0' y1='1' x2='0' y2='0'><stop offset='0' stop-color='#fff1a8'/><stop offset='1' stop-color='#ff9a2a' stop-opacity='.8'/></linearGradient>"
F1=''.join(fl(x,y,s,'url(#fa)') for x,y,s in ((14,60,1.2),(40,92,1.5),(66,58,1.1),(88,90,1.3),(26,98,.9),(76,100,.8)))+''.join(fl(x,y,s,'url(#fb)') for x,y,s in ((40,92,.8),(88,90,.7),(14,60,.6)))
emb="".join(f"<circle cx='{x}' cy='{y}' r='{r}' fill='#ffd27a'/>" for x,y,r in ((12,18,1.1),(33,6,.8),(55,34,1.2),(70,12,.9),(88,40,1.1),(20,60,.9),(46,80,1.2),(78,70,.8),(92,90,1)))
R('.nth-lua',f"background-image:{vig(.5,.0)},radial-gradient(ellipse at 50% 108%,#ffb02e 0,#e8481a 28%,rgba(120,10,6,.0) 60%),linear-gradient(180deg,#14040a 0%,#4a0c0c 55%,#8a1a08 100%);background-size:cover")
R('.nth-lua::before',f"left:0;top:0;width:100%;height:200%;background:{S(100,100,F1,defs)} repeat-y;background-size:100% 50%;animation:nbRiseS 5.5s linear infinite;opacity:.8")
R('.nth-lua::after',f"left:0;top:0;width:100%;height:200%;background:{S(100,100,emb)} repeat-y;background-size:100% 50%;animation:nbRiseS 3.4s linear infinite;opacity:.8")

# ---------------- Sự kiện mùa ----------------
def mai(x0,y0,pts,col,cen,seed):
    r=random.Random(seed);b=f"<path d='M{x0} {y0}"
    for (px,py,qx,qy) in pts:b+=f" Q{px} {py} {qx} {qy}"
    b+="' fill='none' stroke='#4a2a12' stroke-width='1.6' stroke-linecap='round'/>"
    for (px,py,qx,qy) in pts:
        for (x,y) in ((qx,qy),((px+qx)/2+r.uniform(-4,4),(py+qy)/2+r.uniform(-4,4))):
            b+=f"<g transform='translate({f(x)} {f(y)}) rotate({r.randint(0,70)})'>"+''.join(f"<circle cx='{f(3*math.cos(k*1.2566))}' cy='{f(3*math.sin(k*1.2566))}' r='2.5' fill='{col}'/>" for k in range(5))+f"<circle r='1.3' fill='{cen}'/></g>"
    return b
tetb=mai(100,-2,[(88,12,78,20),(70,28,58,30),(50,34,44,44)],'#ffd23f','#e8761a',3)+mai(-2,-2,[(10,14,20,18),(30,26,36,36)],'#ff9fbd','#c8264f',5)
fw=''
for (x,y,s,c) in ((30,66,1.0,'#ffe27a'),(76,56,.8,'#ff9fbd'),(60,108,.7,'#7fe0ff')):
    fw+=f"<g transform='translate({x} {y}) scale({s})' stroke='{c}' stroke-width='1.1' stroke-linecap='round' fill='{c}'>"+''.join(f"<path d='M0 0' />" for _ in range(0))+''.join(f"<g transform='rotate({k*22.5})'><path d='M5 0H15' fill='none'/><circle cx='18' cy='0' r='1.3' stroke='none'/></g>" for k in range(16))+"</g>"
ban="<g fill='none' stroke='#f2cf63' stroke-opacity='.6' stroke-width='.8'><path d='M4 132h92M4 136h92'/>"+''.join(f"<circle cx='{10+i*10}' cy='134' r='2.6'/>" for i in range(9))+"</g>"
R('.nth-tet',f"background-image:{vig(.5,.05)},{S(100,140,fw+tetb+ban)},radial-gradient(circle at 50% 36%,#e8321f 0,#bb1a14 55%,#7a0a0c 100%);background-size:cover")
pet=S(100,100,''.join(f"<ellipse cx='{x}' cy='{y}' rx='2.4' ry='1.4' fill='#ffd0e0' fill-opacity='.9' transform='rotate({a} {x} {y})'/>" for x,y,a in ((12,8,30),(40,22,-20),(70,10,50),(88,36,10),(24,50,-40),(58,60,25),(80,80,-30),(8,86,15),(46,92,40))))
R('.nth-tet::before',f"left:0;top:0;width:100%;height:200%;background:{pet} repeat-y;background-size:100% 50%;animation:nbFall 14s linear infinite;opacity:.9")
def star(cx,cy,R_,r,rot=0,fill='#e0261c',stroke='#ffd23f'):
    p=' '.join(f"{f(cx+(R_ if i%2==0 else r)*math.cos(i*math.pi/5-math.pi/2+rot))},{f(cy+(R_ if i%2==0 else r)*math.sin(i*math.pi/5-math.pi/2+rot))}" for i in range(10))
    return p
def lan(cx,cy,s):
    return (f"<path d='M{cx} -2V{cy-s*1.15}' stroke='#e8c76a' stroke-width='.5'/><polygon points='{star(cx,cy,s,s*.5)}' fill='#e0261c' stroke='#ffd23f' stroke-width='.6'/><polygon points='{star(cx,cy,s*.62,s*.31)}' fill='#ffd23f' fill-opacity='.85'/><circle cx='{cx}' cy='{cy}' r='{f(s*.14)}' fill='#fff6c8'/><circle cx='{cx}' cy='{cy}' r='{f(s*1.5)}' fill='url(#lg)' />"
            f"<path d='M{cx} {cy+s*1.0}v{s*.6}M{cx-1.5} {cy+s*.95}v{s*.4}M{cx+1.5} {cy+s*.95}v{s*.4}' stroke='#ffd23f' stroke-width='.6'/>")
defs="<radialGradient id='mn' cx='.4' cy='.4'><stop offset='0' stop-color='#fffbe6'/><stop offset='1' stop-color='#f3d98a'/></radialGradient><radialGradient id='lg'><stop offset='0' stop-color='#ffcf5a' stop-opacity='.35'/><stop offset='1' stop-color='#ffcf5a' stop-opacity='0'/></radialGradient><radialGradient id='mg'><stop offset='.6' stop-color='#fff3b0' stop-opacity='.35'/><stop offset='1' stop-color='#fff3b0' stop-opacity='0'/></radialGradient>"
moon="<circle cx='64' cy='36' r='30' fill='url(#mg)'/><circle cx='64' cy='36' r='17' fill='url(#mn)'/><g fill='#c9aa55' fill-opacity='.35'><circle cx='58' cy='31' r='3.2'/><circle cx='69' cy='42' r='2.4'/><circle cx='70' cy='30' r='1.6'/><circle cx='58' cy='43' r='1.4'/></g>"
sts=''.join(f"<circle cx='{x}' cy='{y}' r='{r}' fill='#fff' fill-opacity='.85'/>" for x,y,r in ((10,12,.7),(28,30,.5),(40,10,.8),(90,10,.6),(18,60,.5),(86,70,.5),(50,76,.6),(8,96,.6),(92,104,.5)))
cld="<g fill='#7f8fe0' fill-opacity='.3'><ellipse cx='24' cy='112' rx='26' ry='5'/><ellipse cx='78' cy='122' rx='28' ry='5'/></g>"
trung=S(100,140,sts+moon+cld+lan(22,34,9)+lan(34,84,6.2)+lan(80,100,7.4),defs)
R('.nth-trungthu',f"background-image:{vig(.5,.05)},{trung},linear-gradient(180deg,#0a1040 0%,#1a2a78 50%,#3a3a98 100%);background-size:cover")
R('.nth-trungthu::before',f"left:0;top:0;width:100%;height:100%;background:radial-gradient(circle at 64% 25.7%,rgba(255,243,176,.55),transparent 36%);animation:nbPulse 4.6s ease-in-out infinite")

# ---------------- keyframes ----------------
css.append('''@keyframes nbSlide{to{transform:translate3d(-50%,0,0)}}
@keyframes nbSlideR{from{transform:translate3d(-50%,0,0)}to{transform:translate3d(0,0,0)}}
@keyframes nbRise{to{transform:translate3d(0,-50%,0)}}
@keyframes nbRiseS{to{transform:translate3d(0,-50%,0)}}
@keyframes nbFall{from{transform:translate3d(0,-50%,0)}to{transform:translate3d(0,0,0)}}
@keyframes nbSheen{0%,100%{transform:translateX(-30%) skewX(-18deg)}50%{transform:translateX(260%) skewX(-18deg)}}
@keyframes nbPulse{0%,100%{opacity:.55}50%{opacity:1}}
''')
css.append(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'nen_ui.css'),encoding='utf8').read() if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)),'nen_ui.css')) else '')
open(OUT,'w',encoding='utf8').write('\n'.join(css)+'\n')
print(OUT,sum(len(c) for c in css))
