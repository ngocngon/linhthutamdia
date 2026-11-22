/* Module 07: Cửa hàng, Gacha, Thẻ tháng, Hành trình Tam Địa, Chinh phục & Khởi động */
/* ---- chất lượng, tài nguyên, cửa hàng, gacha, xếp hạng ---- */
const QN=[["Thường","#b9bcc8"],["Đặc Biệt","#35d07f"],["Hiếm","#3aa0ff"],["Hùng Tráng","#c45cff"],["Huyền Thoại","#ff9a1f"],["Siêu Cấp","#ff4d6d"],["Vô Cực","#ffffff"]],UPC=[25,50,100,200,300,400],CLG=[0,1,3,7,13,21,31];
const SWATCH=["#ffffff","#ffd65a","#ff4d6d","#ff5ae0","#c45cff","#3aa0ff","#3fe0ff","#7dff8a"];
const RES={gold:[icn("gold"),"#ffb02e","Vàng"],up:[icn("up"),"#7fd0ff","Điểm nâng cấp"],tok:[icn("tok"),"#c9a4ff","Token"],evp:[icn("evp"),"#ff8af0","Điểm sự kiện"],gems:[icn("gems"),"#3dffb4","Ngọc xếp hạng"]};
function mkImgBack(name,uKey,cropBot){
  const u=UI(uKey)||("img/u/"+uKey+".webp");
  return [name,cropBot?`url('${u}') 50% 0% / 104% 108% no-repeat #0b0a24`:`url('${u}') 50% 50% / 103% 103% no-repeat #0b0a24`];
}
const BACKS={
 b0:mkImgBack("Trống Đồng Lạc Việt","bk_thuong_1"),
 b1:mkImgBack("Hoàng Long Nhả Ngọc","bk_hungtrang_1"),
 b2:mkImgBack("Chim Lạc Ngọc Lục","bk_dacbiet_1"),
 b3:mkImgBack("Tứ Linh Hội Tụ","bk_huyenthoai_1"),
 b4:mkImgBack("Long Phụng Tinh Hà","bk_vocuc_1",1),
 b5:mkImgBack("Gốm Lam Vân Mây","bk_thuong_3"),
 b6:mkImgBack("Cửu Long Triều Nhật","bk_sieucap_1"),
 b7:mkImgBack("Hồi Văn Sơn Son","bk_thuong_2"),
 b8:mkImgBack("Kim Quy Đạp Sóng","bk_hiem_1"),
 b9:mkImgBack("Bảo Châu Tứ Thánh","bk_vocuc_4"),
 bk_thuong_4:mkImgBack("Khắc Gỗ Cổ Phong","bk_thuong_4"),
 bk_dacbiet_2:mkImgBack("Thanh Trúc Linh Điểu","bk_dacbiet_2"),
 bk_dacbiet_3:mkImgBack("Lục Bảo Hoa Văn","bk_dacbiet_3"),
 bk_dacbiet_4:mkImgBack("Ngọc Ấn Sơn Lâm","bk_dacbiet_4"),
 bk_hiem_2:mkImgBack("Thuỷ Triều Đông Hải","bk_hiem_2"),
 bk_hiem_3:mkImgBack("Lam Ngọc Liên Hoa","bk_hiem_3"),
 bk_hiem_4:mkImgBack("Huyền Vũ Trấn Hải","bk_hiem_4"),
 bk_hungtrang_2:mkImgBack("Tử Kim Pháp Trận","bk_hungtrang_2"),
 bk_hungtrang_3:mkImgBack("Uy Linh Thần Hổ","bk_hungtrang_3"),
 bk_hungtrang_4:mkImgBack("Phượng Vũ Cửu Thiên","bk_hungtrang_4"),
 bk_huyenthoai_2:mkImgBack("Kim Long Vờn Mây","bk_huyenthoai_2"),
 bk_huyenthoai_3:mkImgBack("Thánh Hoả Lạc Hồng","bk_huyenthoai_3"),
 bk_huyenthoai_4:mkImgBack("Thiên Ấn Hoàng Triều","bk_huyenthoai_4"),
 bk_sieucap_2:mkImgBack("Huyết Long Xung Thiên","bk_sieucap_2"),
 bk_sieucap_3:mkImgBack("Xích Diệm Thần Chu","bk_sieucap_3"),
 bk_sieucap_4:mkImgBack("Bá Vương Hồng Nhật","bk_sieucap_4"),
 bk_vocuc_2:mkImgBack("Ngân Hà Tứ Thánh","bk_vocuc_2",1),
 bk_vocuc_3:mkImgBack("Cổ Loa Tinh Đồ","bk_vocuc_3")
};
if(typeof TEST_MAX!=="undefined"&&TEST_MAX){for(const bk of Object.keys(BACKS))if(!store.backs.includes(bk))store.backs.push(bk);}
function mkScene(body){return `url('data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 860' preserveAspectRatio='xMidYMid slice'>"+body+"</svg>").replace(/'/g,"%27")}')`;}
const SCENES={
 ancient:()=>{let c="";for(const x of [20,70,330,380]){c+=`<rect x='${x-14}' y='90' width='28' height='560' fill='url(#col)'/><rect x='${x-20}' y='78' width='40' height='14' fill='#e9cf96'/><rect x='${x-20}' y='648' width='40' height='16' fill='#b8935a'/>`;for(let k=-10;k<=10;k+=5)c+=`<rect x='${x+k-.5}' y='94' width='1' height='552' fill='#6b4a1e' opacity='.45'/>`;}
   let gl="";for(let i=0;i<9;i++)gl+=`<path d='M${60+i*34} ${700+((i*37)%60)}l8-10 8 10-8 10z' fill='none' stroke='#f0d28a' stroke-opacity='.25'/>`;
   return mkScene(`<defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffcf70'/><stop offset='.28' stop-color='#d98a3a'/><stop offset='.6' stop-color='#6a3f1c'/><stop offset='1' stop-color='#22140a'/></linearGradient><linearGradient id='col' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#8a6a3a'/><stop offset='.4' stop-color='#f0d9a4'/><stop offset='1' stop-color='#7a5a2c'/></linearGradient><radialGradient id='sun'><stop offset='0' stop-color='#fff6d0'/><stop offset='.5' stop-color='#ffd070'/><stop offset='1' stop-color='#ffd070' stop-opacity='0'/></radialGradient></defs><rect width='400' height='860' fill='url(#sky)'/><circle cx='200' cy='120' r='120' fill='url(#sun)'/><path d='M0 190L80 110l40 44 80-96 80 96 40-44 80 80v60H0z' fill='#7a4f24'/><path d='M110 190l90-110 90 110z' fill='#c9955a'/><path d='M200 80l90 110h-40z' fill='#8a5f2e'/><path d='M0 190h400v670H0z' fill='#2b1a0c' opacity='.72'/><path d='M0 186h400' stroke='#f0d28a' stroke-width='3'/><path d='M0 192h400' stroke='#6b4a1e' stroke-width='6'/>${c}${gl}<path d='M0 800q200-60 400 0v60H0z' fill='#1a0f06'/>`);},
 pixel:()=>{let b="",h=7;const rnd=()=>{h=(h*16807)%2147483647;return h/2147483647;};
   for(let i=0;i<70;i++)b+=`<rect x='${Math.floor(rnd()*50)*8}' y='${Math.floor(rnd()*40)*8}' width='${rnd()<.2?8:4}' height='${rnd()<.2?8:4}' fill='${["#fff","#7fe0ff","#ffd65a","#ff8af0"][i%4]}' opacity='${.4+rnd()*.6}'/>`;
   let m="";for(let x=0;x<400;x+=16){const t=Math.round((60+40*Math.sin(x/50)+30*Math.sin(x/23))/8)*8;m+=`<rect x='${x}' y='${330-t}' width='16' height='${t+40}' fill='#2a2f6e'/><rect x='${x}' y='${330-t}' width='16' height='8' fill='#4de3a0'/>`;}
   let g="";for(let y=370;y<860;y+=32)for(let x=(y/32)%2*32;x<400;x+=64)g+=`<rect x='${x}' y='${y}' width='32' height='32' fill='#141a3c'/>`;
   return mkScene(`<rect width='400' height='860' fill='#0b0d24'/><rect width='400' height='330' fill='#141046'/>${b}<rect x='296' y='48' width='48' height='48' fill='#ffe27a'/><rect x='304' y='40' width='32' height='8' fill='#ffe27a'/><rect x='304' y='96' width='32' height='8' fill='#ffe27a'/><rect x='312' y='60' width='8' height='8' fill='#d49a1a'/><rect x='328' y='76' width='8' height='8' fill='#d49a1a'/>${m}<rect y='362' width='400' height='8' fill='#4de3a0'/><rect y='370' width='400' height='490' fill='#0d1126'/>${g}`);},
 cartoon:()=>{let f="";for(let i=0;i<14;i++){const x=20+i*29,y=560+((i*53)%240),c=["#ff6b8a","#ffd65a","#fff","#c58cff"][i%4];f+=`<circle cx='${x}' cy='${y}' r='6' fill='${c}' stroke='#2a2140' stroke-width='2'/><circle cx='${x}' cy='${y}' r='2' fill='#2a2140'/>`;}
   return mkScene(`<defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#38b6ff'/><stop offset='1' stop-color='#c8f0ff'/></linearGradient></defs><rect width='400' height='860' fill='url(#sky)'/><g stroke='#2a2140' stroke-width='4' stroke-linejoin='round'><circle cx='320' cy='90' r='44' fill='#ffd65a'/><path d='M320 26v-18M320 172v-18M256 90h-18M402 90h-18M274 44l-12-12M378 148l-12-12M366 44l12-12M262 148l12-12' fill='none' stroke-linecap='round'/><path d='M-20 330q80-150 190-20q60-90 150-10q50-40 100 30v80H-20z' fill='#7ad85a'/><path d='M-20 380q120-90 230-10q90-60 210 10v500H-20z' fill='#4fb84a'/><path d='M60 250v-70l-22 22M60 180l22 22' fill='none' stroke-linecap='round'/><circle cx='60' cy='168' r='30' fill='#2f9a4a'/><circle cx='120' cy='300' r='22' fill='#2f9a4a'/></g><path d='M0 380h400v480H0z' fill='#3a9a3c' opacity='.35'/>${f}`);},
 logo:()=>{let r="";for(let i=0;i<24;i++){const a=i*15*Math.PI/180;r+=`<path d='M${200+Math.cos(a)*150} ${400+Math.sin(a)*150}L${200+Math.cos(a)*(i%2?176:196)} ${400+Math.sin(a)*(i%2?176:196)}' stroke='#7fa8ff' stroke-opacity='.4' stroke-width='2'/>`;}
   return mkScene(`<defs><radialGradient id='bg' cx='.5' cy='.46' r='.7'><stop offset='0' stop-color='#24388e'/><stop offset='.5' stop-color='#0c1238'/><stop offset='1' stop-color='#04051a'/></radialGradient><linearGradient id='em' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9fd0ff' stop-opacity='.5'/><stop offset='1' stop-color='#8a5cff' stop-opacity='.2'/></linearGradient></defs><rect width='400' height='860' fill='url(#bg)'/><g fill='none' stroke='#7fa8ff' stroke-opacity='.3'><circle cx='200' cy='400' r='140' stroke-width='3'/><circle cx='200' cy='400' r='110' stroke-dasharray='4 8'/><circle cx='200' cy='400' r='230' stroke-opacity='.15'/></g>${r}<path d='M200 290l95 55v110l-95 55-95-55V345z' fill='url(#em)' stroke='#9fd0ff' stroke-opacity='.6' stroke-width='3'/><path d='M200 330l-46 70h34l-10 62 68-84h-36z' fill='#cfe6ff' fill-opacity='.4'/><path d='M0 60h130l20 20h100l20-20h130M0 800h130l20-20h100l20 20h130' fill='none' stroke='#3f8cff' stroke-opacity='.5' stroke-width='2'/>`);}};
let sceneFor="";
function arImg(a,small){const x=IMGS.a[a]||{};return (small?x.t:x.b)||"";}
function applyArena(){const a=store.arena,A=ARENAS[a];document.body.className="ar ar-"+a;const st=document.documentElement.style;st.setProperty("--ac",A[1]);st.setProperty("--ac2",A[2]);
  if(sceneFor===a)return;sceneFor=a;const sc=$("scene");sc.classList.add("pic");sc.style.backgroundImage=`url("${arImg(a)}")`;$("lobby").style.setProperty("--lbbg",`url("${arImg(a)}")`);
  const kind=A[3],n={dust:16,twinkle:22,ember:18,lantern:10,bubble:16,firefly:16,leaf:12,petal:16}[kind]||0;let h="";
  for(let i=0;i<n;i++){const x=(i*61+17)%100,y=(i*37+11)%100,d=(i%5),dl=-(i*1.37%9).toFixed(2);
    h+=`<i class="p-${kind}" style="left:${x}%;top:${kind==="twinkle"?y*.45:kind==="leaf"||kind==="petal"?-8:100+y*.2}%;--dur:${({dust:16,twinkle:2,ember:7,lantern:22,bubble:9,firefly:6,leaf:12,petal:10})[kind]+d*1.3}s;--dl:${dl}s;--sz:${2+d*1.2}px;--dx:${(i%2?1:-1)*(20+d*14)}px"></i>`;}
  $("amb").innerHTML=reduced?"":h;}
const ARENAS={"thanglong":["Hoàng Thành Thăng Long","#ffb347","#e0402e","dust",0],"halong":["Vịnh Hạ Long","#46e3d3","#ff8ad8","twinkle",0],"dongson":["Đàn Tế Đông Sơn","#e8b45c","#5a86ff","ember",500],"hoian":["Phố Hội Đèn Lồng","#ff6a4a","#ffd65a","lantern",500],"thuycung":["Thuỷ Cung Long Vương","#3fa8ff","#7dffd8","bubble",500],"thiendinh":["Thiên Đình Mây Vàng","#ffe27a","#fff6d0","twinkle",800],"rungtruc":["Rừng Trúc Trăng Đêm","#8dff7a","#d8ffb0","firefly",800],"amphu":["Âm Phủ Huyết Hà","#ff4d3a","#b04dff","ember",800],"mucangchai":["Ruộng Bậc Thang Mùa Vàng","#ffd23a","#7ad36a","leaf",1000],"tet":["Phố Hoa Đào Ngày Tết","#ff7aa8","#ffd65a","petal",1000]};
const ARF={};
let foeBack="b1",cardId=null,cardPrev=0;
if(!BACKS[store.back])store.back="b0";if(!store.arenas.some(k=>ARENAS[k]))store.arenas=[];for(const k of ["thanglong","halong"])if(!store.arenas.includes(k))store.arenas.push(k);store.arenas=store.arenas.filter(k=>ARENAS[k]);if(!ARENAS[store.arena])store.arena="thanglong";
const lvl=k=>(store.cards[k]&&store.cards[k].l)||0;
const canUp=k=>(OWN.has(k)&&lvl(k)<6&&store.up>=UPC[lvl(k)])?1:0;
function qCls(k){const c=store.cards[k];if(!c||!c.l)return "";return ` qf q${c.l}${c.l===6&&c.bc?" qcc":""}${c.l===6&&c.au?" qau":""}${c.l===6&&c.an?" qan":""}`;}
function qSt(k){const c=store.cards[k];return c&&c.l===6&&c.bc?`;--qc:${c.bc}`:"";}
function colLv(){let n=OWN.size;for(const k of Object.keys(store.cards))n+=CLG[store.cards[k].l]||0;return n;}
if(store.clc<0)store.clc=Math.floor(colLv()/5);
function clPending(){return Math.max(0,Math.floor(colLv()/5)-store.clc);}
function resHTML(ks){return ks.map(k=>`<span class="res1" title="${RES[k][2]}">${icn(k)}${store[k]}</span>`).join("");}
function grant(k){if(OWN.has(k))return false;OWN.add(k);store.own=[...OWN];return true;}
function ownDeck(h){const target=[2,3,3,2,1,1],out=[],sh=a=>a.slice().sort(()=>Math.random()-.5),own=[...OWN];
  for(let b=1;b<=6;b++){const fit=own.filter(k=>Math.min(6,C[k].c)===b),r=sh(fit.filter(k=>C[k].h===h)).concat(sh(fit.filter(k=>C[k].h!==h)));for(let i=0;i<target[b-1]&&i<r.length;i++)out.push(r[i]);}
  for(const k of sh(own)){if(out.length>=12)break;if(!out.includes(k))out.push(k);}return out;}
function randNew(){const un=E.COLLECT.filter(k=>!OWN.has(k));if(!un.length)return null;const W={KD:60,C1:60,TB:60,S1:50,S2:25,S3:15,S4:7,S5:3,MP:2};let tot=0;for(const k of un)tot+=W[C[k].h]||1;let r=Math.random()*tot;for(const k of un){r-=W[C[k].h]||1;if(r<=0)return k;}return un[0];}
const PRICE={KD:60,C1:60,TB:60,S1:100,S2:200,S3:400,S4:800,S5:1200,MP:1500};
function cardGC(k,extra){const d=C[k];return `<span class="gc${extra||""}" style="--hc:${HC[d.h]};display:block">${art(k)}<span class="cst">${d.c}</span><span class="pwh">${d.p}</span><span class="n">${logo(d.id)}</span>${spk(d.id)}</span>`;}
function showGain(title,html,c){$("gachaBody").innerHTML=`<h3>${title}</h3>${html}`;$("gachaBody").style.setProperty("--c",c||"#7fd0ff");$("ovGacha").classList.add("on");SFX.play("win");}
function gainCard(k,title){grant(k);save();showGain(title||"Thẻ mới!",`<div style="width:130px">${cardGC(k)}</div><div>${kwfx(skillText(C[k]))}</div>`,HC[C[k].h]);}
function gainRes(k,n,title){store[k]+=n;save();showGain(title||"Phần thưởng",`<div class="big" style="--c:${RES[k][1]}">${RES[k][0]}+${n}</div><div>${RES[k][2]}</div>`,RES[k][1]);}
function gacha(kind){
  if(kind==="card"){if(store.gold<200)return;store.gold-=200;const k=Math.random()<.7?randNew():null;if(k)gainCard(k,"Rương thẻ");else if(Math.random()<.5)gainRes("up",60+Math.floor(Math.random()*61),"Rương thẻ");else gainRes("tok",40+Math.floor(Math.random()*41),"Rương thẻ");}
  else{if(store.tok<150)return;store.tok-=150;const r=Math.random(),nb=Object.keys(BACKS).filter(b=>!store.backs.includes(b)),na=Object.keys(ARENAS).filter(a=>!store.arenas.includes(a));
    if(r<.35&&nb.length){const b=nb[Math.floor(Math.random()*nb.length)];store.backs.push(b);save();showGain("Mặt sau mới",`<span class="bkp" style="--bk:${BACKS[b][1]};width:110px"></span><div>${BACKS[b][0]}</div>`);}
    else if(r<.5&&na.length){const a=na[Math.floor(Math.random()*na.length)];store.arenas.push(a);save();showGain("Sàn đấu mới",`<span class="arp" style="--ap:url(${arImg(a,1)}) center 22%/cover;height:180px;width:120px"></span><div>${ARENAS[a][0]}</div>`);}
    else if(r<.75)gainRes("gold",80+Math.floor(Math.random()*121),"Rương vật phẩm");else if(r<.9)gainRes("up",60,"Rương vật phẩm");else gainRes("evp",20,"Rương vật phẩm");}
  renderShop();renderLobby();}
function shopCards(){if(store.shopD!==today()||!store.shopC.length){const un=E.COLLECT.filter(k=>!OWN.has(k)).sort(()=>Math.random()-.5);store.shopC=un.slice(0,6);store.shopD=today();save();}return store.shopC;}

const VND=n=>n.toLocaleString("vi-VN")+"đ";
const PAY_GOLD=[["g1",20000,200,0],["g2",50000,550,10],["g3",100000,1150,15],["g4",200000,2400,20],["g5",500000,6250,25],["g6",1000000,13000,30]];
const PAY_PACK=[
 {id:"start",n:"Gói khởi đầu",pr:25000,once:1,tag:"Mua 1 lần",c:"#3dffb4",g:{gold:500,tok:300,up:200},bk:1,d:"Quà nhập môn giá tốt nhất: vàng, token, điểm nâng cấp và 1 mặt lưng ngẫu nhiên."},
 {id:"mc",n:"Nguyệt phiếu 30 ngày",pr:99000,tag:"Lời nhất",c:"#ffd65a",g:{gold:300},daily:100,d:"Nhận ngay 300 vàng, sau đó mỗi ngày vào cửa hàng nhận thêm 100 vàng, 30 ngày liền (tổng 3.300 vàng)."},
 {id:"upk",n:"Gói nâng cấp",pr:49000,tag:"Tuần",wk:1,c:"#7fd0ff",g:{up:600,gold:200},d:"Dành cho người muốn nâng thẻ nhanh. Mua tối đa 1 lần mỗi tuần."},
 {id:"tokp",n:"Gói sưu tầm",pr:79000,tag:"Tuần",wk:1,c:"#c9a4ff",g:{tok:900,gold:200},d:"Nhiều token để mua thẻ hôm nay và mặt lưng. Mua tối đa 1 lần mỗi tuần."},
 {id:"evpk",n:"Gói sự kiện",pr:39000,tag:"Tuần",wk:1,c:"#ff8af0",g:{evp:300,gold:100},d:"Điểm sự kiện để đổi quà khi có sự kiện. Mua tối đa 1 lần mỗi tuần."}];
function pile(i,kk){kk=kk||"gold";if(i>=3&&UI(kk+"_big"))return `<span class="gpi"><span class="gpb" style="background-image:url(${UI(kk+"_big")})"></span></span>`;const P=[[[50,50]],[[38,58],[62,50]],[[30,60],[54,62],[44,38]],[[26,64],[50,66],[74,62],[50,40]],[[22,66],[44,68],[66,68],[34,44],[58,44]],[[18,68],[40,70],[62,70],[84,66],[30,46],[54,46],[44,24]]][i];return `<span class="gpi">${P.map(([x,y])=>`<i class="ico i-${kk}" style="left:${x}%;top:${y}%"></i>`).join("")}</span>`;}
function payP(){if(!store.pay)store.pay={first:{},bought:{},mc:null,total:0};return store.pay;}
function weekKey(){const d=new Date(),j=new Date(d.getFullYear(),0,1);return d.getFullYear()+"w"+Math.ceil(((d-j)/864e5+j.getDay()+1)/7);}
function mcLeft(){const m=payP().mc;if(!m)return 0;const n=Math.ceil((new Date(m.end+"T23:59:59")-new Date())/864e5);return Math.max(0,n);}
function packAvail(x){const P=payP();if(x.pass)return PS().prem<x.pass;if(x.id==="sig")return P.bought.sig!==today();if(x.once)return !P.bought[x.id];if(x.wk)return P.bought[x.id]!==weekKey();if(x.id==="mc")return mcLeft()<=0;return true;}
function giftHTML(g){return Object.keys(g).map(k=>`<span class="gf">${icn(k)}${g[k].toLocaleString("vi-VN")}</span>`).join("");}
function packBtn(x){const ok=packAvail(x);return `<button type="button" class="si pk2" style="--pc:${x.c}" data-pay="${x.id}" ${ok?"":"disabled"}><span class="ptag">${x.tag}</span><span class="tx"><span class="nm">${x.n}</span><span class="gfs">${giftHTML(x.g)}${x.bk?`<span class="gf">+1 mặt lưng</span>`:""}${x.daily?`<span class="gf">+${icn("gold")}100/ngày</span>`:""}</span><span class="ds">${x.d}</span></span><span class="pv">${ok?VND(x.pr):x.id==="mc"?"Đang dùng":x.once?"Đã mua":"Tuần sau"}</span></button>`;}
function payRender(){const P=payP();let h="";
  const left=mcLeft(),canClaim=left>0&&P.mc.last!==today();
  if(left>0)h+=`<div class="mcbar"><span class="bigi i-gold"></span><span class="tx"><b>Nguyệt phiếu</b><small>Còn ${left} ngày · mỗi ngày ${icn("gold")}100</small></span>${canClaim?`<button type="button" class="btn end" data-mcc="1">Nhận hôm nay</button>`:`<span class="pz own">Đã nhận hôm nay</span>`}</div>`;
  h+=`<div class="shs">Gói nạp</div><div class="shg" style="--n:1">${PAY_PACK.filter(x=>x.id!=="start").map(packBtn).join("")}</div>`;
  h+=`<div class="shs">Nạp vàng <small>· lần đầu mỗi mốc nhân đôi</small></div><div class="shg gpk">${PAY_GOLD.map(([id,pr,n,b],i)=>{const f=!P.first[id];return `<button type="button" class="si gp" data-pay="${id}">${f?`<span class="x2">x2 lần đầu</span>`:b?`<span class="bnx">+${b}%</span>`:""}${pile(i)}<span class="amt">${icn("gold")}${(f?n*2:n).toLocaleString("vi-VN")}</span>${f?`<span class="old">${n.toLocaleString("vi-VN")}</span>`:""}<span class="pv">${VND(pr)}</span></button>`;}).join("")}</div>
  <div class="shn">Bản thử nghiệm: chưa kết nối cổng thanh toán, xác nhận sẽ nhận quà miễn phí để kiểm tra.</div>`;
  return h;}
function payFind(id){if(id==="sig")return sigPack();if(id==="ps1"||id==="ps2")return {id,n:id==="ps1"?"Thẻ tháng Cao cấp":"Thẻ tháng Siêu cao cấp",pr:id==="ps1"?129000:249000,g:{},pass:id==="ps1"?1:2};const g=PAY_GOLD.find(x=>x[0]===id);if(g){const f=!payP().first[g[0]];return {id,n:"Nạp "+g[2].toLocaleString("vi-VN")+" vàng",pr:g[1],g:{gold:f?g[2]*2:g[2]},gold:1};}return PAY_PACK.find(x=>x.id===id);}
function payAsk(id){const x=payFind(id);if(!x)return;payId=id;
  $("payBody").innerHTML=`<div class="pyh">Xác nhận mua</div><div class="pyn">${x.n}</div><div class="gfs big">${giftHTML(x.g)}${x.bk?`<span class="gf">+1 mặt lưng</span>`:""}${x.daily?`<span class="gf">+${icn("gold")}100/ngày × 30</span>`:""}${x.card?`<span class="gf">+ thẻ ${esc(C[x.card].n)}</span>`:""}</div><div class="pyp">${VND(x.pr)}</div><div class="pyt">Bản thử nghiệm: chưa trừ tiền thật.</div><div class="pka"><button type="button" class="btn end" data-py="ok">Xác nhận</button><button type="button" class="btn ghost" data-py="x">Huỷ</button></div>`;
  $("ovPay").classList.add("on");}
let payId="";
function payDo(){const x=payFind(payId);if(!x)return;const P=payP();
  if(!x.gold&&!packAvail(x))return;
  for(const k of Object.keys(x.g))store[k]+=x.g[k];
  if(x.gold)P.first[x.id]=1;else if(x.id==="sig")P.bought.sig=today();else if(x.once)P.bought[x.id]=1;else if(x.wk)P.bought[x.id]=weekKey();
  if(x.id==="mc"){const e=new Date();e.setDate(e.getDate()+29);P.mc={end:e.getFullYear()+"-"+String(e.getMonth()+1).padStart(2,"0")+"-"+String(e.getDate()).padStart(2,"0"),last:today()};}
  let extra="";if(x.bk){const nb=Object.keys(BACKS).filter(b=>!store.backs.includes(b));if(nb.length){const b=nb[Math.floor(Math.random()*nb.length)];store.backs.push(b);extra=`<div style="margin-top:8px"><span class="bkp" style="--bk:${BACKS[b][1]};width:64px;display:inline-block"></span><div>${BACKS[b][0]}</div></div>`;}else{store.tok+=300;extra=`<div>Đã có đủ mặt lưng: ${icn("tok")}+300</div>`;}}
  if(x.pass){const S=PS();if(x.pass===2&&S.prem<2){S.xp=Math.min(PS_LV*PS_XP-1,S.xp+10*PS_XP);const k2=psCard(2);if(grant(k2))extra+=`<div style="width:120px;margin:8px auto 0">${cardGC(k2)}</div><div>Thẻ ${esc(C[k2].n)}</div>`;else{store.tok+=300;extra+=`<div>Đã có thẻ ${esc(C[k2].n)}: ${icn("tok")}+300</div>`;}}S.prem=Math.max(S.prem,x.pass);extra+=`<div>Đã mở khoá thẻ tháng ${x.pass===2?"Siêu cao cấp":"Cao cấp"}</div>`;}
  if(x.card){if(grant(x.card)){extra+=`<div style="width:120px;margin:8px auto 0">${cardGC(x.card)}</div><div>${esc(C[x.card].n)}</div>`;}else{store.tok+=300;extra+=`<div>Đã có thẻ ${esc(C[x.card].n)}: ${icn("tok")}+300</div>`;}}
  P.total+=x.pr;save();$("ovPay").classList.remove("on");
  showGain("Nạp thành công",`<div class="gfs big">${giftHTML(x.g)}</div>${extra}`,"#ffd65a");renderShop();renderLobby();}
$("payBody").addEventListener("click",ev=>{const b=ev.target.closest("[data-py]");if(!b)return;if(b.dataset.py==="ok"){payDo();}else{$("ovPay").classList.remove("on");}});
$("ovPay").addEventListener("click",ev=>{if(ev.target.id==="ovPay")$("ovPay").classList.remove("on");});
function srng(seed){let h=2166136261>>>0;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619);}return ()=>{h=(h+0x6D2B79F5)|0;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function spick(a,n,r){const c=a.slice(),o=[];while(c.length&&o.length<n)o.push(c.splice(Math.floor(r()*c.length),1)[0]);return o;}
function endDay(){const d=new Date();d.setHours(24,0,0,0);return d.getTime();}
function endWeek(){const d=new Date(),wd=(d.getDay()+6)%7;d.setHours(0,0,0,0);d.setDate(d.getDate()+7-wd);return d.getTime();}
const SLOT8=8*3600e3;function slot8(){return Math.floor(Date.now()/SLOT8);}function endSlot8(){return (slot8()+1)*SLOT8;}
function cdText(ms){ms=Math.max(0,ms);const m=Math.floor(ms/6e4),h=Math.floor(m/60),d=Math.floor(h/24);return d?`${d} ngày ${h%24} giờ`:h?`${h} giờ ${m%60} phút`:`${Math.max(1,m)} phút`;}
function cdHTML(end){return `<span class="cd"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 9v4.5l3 2M9 2.5h6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><span data-cd="${end}">${cdText(end-Date.now())}</span></span>`;}
function SH(){if(!store.sh||typeof store.sh!=="object")store.sh={};const S=store.sh;if(S.day!==today()){S.day=today();S.db={};}if(!S.db||typeof S.db!=="object")S.db={};if(!Number.isFinite(S.dp))S.dp=0;return S;}
const SVI={star:'<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>',
 sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.6"/><path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M4.8 19.2l2.1-2.1M17.1 6.9l2.1-2.1" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
 brush:'<svg viewBox="0 0 24 24"><path d="M20.5 3.5c-3 1-8 5.5-10 8.5l2 2c3-2 7.5-7 8.5-10z"/><path d="M9.3 13.2c-2.3-.2-4 1.4-4.3 3.6-.2 1.4-1 2.2-2.5 2.6 3.2 1.9 7.6 1 8.4-2.6z"/></svg>',
 card:'<svg viewBox="0 0 24 24"><rect x="5" y="2.5" width="14" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1L12 14.6l-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z"/></svg>',
 pack:'<svg viewBox="0 0 24 24"><path d="M6 2.5h12l1 3-1 1v13l1 2H5l1-2v-13l-1-1z"/><path d="M8.5 11h7M8.5 14.5h7" stroke="#0a1040" stroke-width="2" stroke-linecap="round"/></svg>',
 pin:'<svg viewBox="0 0 24 24"><path d="M14.5 2.5l7 7-2.2.6-4 4 .5 4.4-1.7 1.7-4-4-4.6 4.6-1.4-1.4 4.6-4.6-4-4 1.7-1.7 4.4.5 4-4z"/></svg>'};
function svi(k){return k.startsWith("i:")?icn(k.slice(2)):`<i class="svi" aria-hidden="true">${SVI[k]}</i>`;}
const SSEC={deal:[["hot","Nổi bật","star"],["day","Hằng ngày","sun"],["deco","Trang trí","brush"],["up","Nâng cấp","i:up"],["gold","Vàng","i:gold"]],card:[["daily","Thẻ ngày","card"],["series","Gói Bậc","pack"],["tok","Token","i:tok"]]};
const SHELP={hot:"Gói nhân vật đổi mỗi ngày. Bộ bài dựng sẵn đổi mỗi tuần và tự giảm giá theo số thẻ bạn đã có.",day:"3 ưu đãi đổi mới mỗi ngày, mỗi món mua được 1 lần. Mua đủ 10 lần ưu đãi hằng ngày để nhận thêm 600 token.",deco:"3 món trang trí bạn chưa có, giảm 25%, đổi mới mỗi 8 giờ. Bên dưới là toàn bộ mặt lưng và sàn đấu.",up:"Nhận miễn phí 25 điểm nâng cấp mỗi 8 giờ, hoặc đổi vàng lấy điểm nâng cấp.",upk:"Nâng ngay 1 bậc chất lượng cho thẻ bạn đang có, rẻ hơn khoảng 30% so với nâng thường. Đổi mới mỗi ngày.",gold:"Nạp vàng và các gói ưu đãi. Lần đầu mua mỗi mốc vàng được nhân đôi.",daily:"6 thẻ xoay tua mỗi ngày. Ghim 1 thẻ để giữ nó lại sang các ngày sau cho đến khi mua.",series:"Mỗi gói cho 1 thẻ ngẫu nhiên của nhóm đó mà bạn chưa có, không bao giờ trùng. Bấm Xem thẻ để xem các thẻ có thể nhận.",tok:"Nhận miễn phí 20 token mỗi ngày. Đổi vàng lấy token, gói càng lớn càng được thêm."};
function secHead(id,t,end,sub){return `<div class="shh"><span class="sht"><b>${t}</b>${sub?`<small>${sub}</small>`:""}</span>${end?cdHTML(end):""}<button type="button" class="hq" data-help="${id}" aria-label="Giải thích">?</button></div>`;}
function sigCard(){const r=srng("sig"+today()),pool=E.COLLECT.filter(k=>["S4","S5","MP"].includes(C[k].h)),un=pool.filter(k=>!OWN.has(k));return spick(un.length?un:pool,1,r)[0];}
function sigPack(){const k=sigCard();return {id:"sig",n:"Gói nhân vật "+C[k].n,pr:149000,c:HC[C[k].h],g:{gold:1000,up:300,tok:200},card:k};}
function deckBundles(){const r=srng("dk"+weekKey()),types=spick(["rev","on","act","end","start","react","pas"],2,r);
  return types.map(t=>{const pool=E.COLLECT.filter(k=>C[k].t===t),want=[2,3,3,2,1,1],ids=[];
    for(let c=1;c<=6;c++){const fit=pool.filter(k=>Math.max(1,Math.min(6,C[k].c))===c&&!ids.includes(k));ids.push(...spick(fit,want[c-1],r));}
    if(ids.length<12)ids.push(...spick(pool.filter(k=>!ids.includes(k)),12-ids.length,r));
    if(ids.length<12)ids.push(...spick(E.COLLECT.filter(k=>!ids.includes(k)),12-ids.length,r));
    return {id:"dk"+t,n:"Bộ bài "+DANG[t],ids:ids.slice(0,12).sort((a,b)=>C[a].c-C[b].c||C[a].p-C[b].p)};});}
const DK_PER=150;
const DOFF=[{id:"o1",n:"Thẻ bí ẩn",d:"1 thẻ bạn chưa có",cost:800,mys:1},{id:"o2",n:"Điểm sự kiện",g:{evp:120},cost:250},{id:"o3",n:"Điểm nâng cấp",g:{up:200},cost:300}];
const SER=[["S5",1000],["S4",650],["S3",320],["S2",160],["S1",80],["CB",40]];
function serName(x){return x==="CB"?"Gói Cơ Bản":"Gói "+HE[x];}
function serPool(x){return E.COLLECT.filter(k=>x==="CB"?["KD","C1","TB"].includes(C[k].h):C[k].h===x);}
function spak(x,cls){const c=x==="MYS"?"#ffd65a":HC[x]||"#c9b98a";const big=x==="MYS"?"?":x==="CB"?"CB":x.slice(1);const sm=x==="MYS"?"BÍ ẨN":x==="CB"?"CƠ BẢN":"BẬC";const im=UI("pack_"+x);return im?`<span class="spak pimg${cls?" "+cls:""}" style="--c:${c};--pi:url(${im})"><span class="spf"></span><b>${big}</b></span>`:`<span class="spak${cls?" "+cls:""}" style="--c:${c}"><span class="spf"></span><b>${big}</b><small>${sm}</small></span>`;}
function dailyCards(){const S=SH();if(S.dlD!==today()||!Array.isArray(S.dl)){const r=srng("dc6"+today()),un=E.COLLECT.filter(k=>!OWN.has(k)&&k!==S.pin);S.dl=spick(un.length>=6?un:E.COLLECT.filter(k=>k!==S.pin),6,r);S.dlD=today();}
  let ks=S.dl.filter(k=>C[k]&&k!==S.pin);if(S.pin&&C[S.pin]&&!OWN.has(S.pin))ks=[S.pin,...ks.slice(0,5)];else{if(S.pin&&OWN.has(S.pin))S.pin="";ks=ks.slice(0,6);}return ks;}
function upCards(){const r=srng("uk"+today()),own=[...OWN].filter(k=>lvl(k)<6);return spick(own,3,r);}
function decoDeals(){const r=srng("dc8"+slot8()),it=[...Object.keys(BACKS).filter(b=>!store.backs.includes(b)).map(b=>["bk",b]),...Object.keys(ARENAS).filter(a=>!store.arenas.includes(a)).map(a=>["ar",a])];return spick(it,3,r);}
function decoPrice(t,v){return t==="bk"?["tok",225]:["gold",Math.round(ARENAS[v][4]*.75/10)*10];}
const TOKP=[[200,500],[500,1200],[1200,2700],[3000,6500]],UPP=[[500,400],[1500,1100]];
function miniCard(k,ok){return `<button type="button" class="dkc${ok?" ok":""}" data-zk="${k}" aria-label="${esc(C[k].n)}"><span class="gc mini${qCls(k)}" style="--hc:${HC[C[k].h]}${qSt(k)}">${art(k)}<span class="cst">${C[k].c}</span><span class="pwh">${C[k].p}</span></span>${ok?`<i class="tick">✓</i>`:""}</button>`;}
let shopTab="deal",shopSub="bk";
function pz(k,n,owned,used){if(used)return `<span class="pz use">Đang dùng</span>`;if(owned)return `<span class="pz own">Dùng</span>`;return `<span class="pz${store[k]<n?" no":""}">${icn(k)}${n}</span>`;}
function shopDeal(){const S=SH();let h="";
  // Nổi bật
  h+=`<section class="ssec" id="ss-hot">`+secHead("hot","Nổi bật");
  const st=PAY_PACK.find(x=>x.id==="start");if(st&&packAvail(st))h+=`<div class="shg" style="--n:1">${packBtn(st)}</div>`;
  const sg=sigPack(),sOk=packAvail(sg),sk=sg.card,sown=OWN.has(sk);
  h+=`<div class="shg" style="--n:1"><button type="button" class="si sig" style="--pc:${sg.c}" data-pay="sig" ${sOk?"":"disabled"}><span class="ptag">Gói nhân vật</span><span class="sgc">${cardGC(sk)}</span><span class="tx"><span class="nm">${esc(C[sk].n)}</span><span class="ds">${esc(HE[C[sk].h])}${sown?" · bạn đã có thẻ này, nhận 300 token thay thế":""}</span><span class="gfs">${giftHTML(sg.g)}</span>${cdHTML(endDay())}</span><span class="pv">${sOk?VND(sg.pr):"Đã mua"}</span></button></div>`;
  h+=`<div class="shs">Bộ bài dựng sẵn ${cdHTML(endWeek())}</div><div class="shg" style="--n:1">${deckBundles().map(b=>{const miss=b.ids.filter(k=>!OWN.has(k)).length,pr=miss*DK_PER,saved=store.decks.some(d=>d.n===b.n&&d.ids.join()===b.ids.join());
    return `<div class="si dkb"><div class="dkh"><span class="nm">${b.n}</span><small>${miss?`Giảm giá cho ${12-miss}/12 thẻ đã sở hữu`:"Bạn đã có đủ 12 thẻ"}</small></div><div class="dkg">${b.ids.map(k=>miniCard(k,OWN.has(k))).join("")}</div><div class="dkf">${miss?`<span class="old">${icn("gold")}${12*DK_PER}</span><button type="button" class="pz${store.gold<pr?" no":""}" data-dkb="${b.id}">${icn("gold")}${pr}</button>`:saved||store.decks.length>=12?`<span class="pz own">${saved?"Đã lưu bộ":"Đã đủ 12 bộ"}</span>`:`<button type="button" class="pz use" data-dkb="${b.id}">Lưu bộ miễn phí</button>`}</div></div>`;}).join("")}</div>`;
  const left=E.COLLECT.some(k=>!OWN.has(k));
  h+=`<div class="shs">Rương</div><div class="shg" style="--n:1">
    <button type="button" class="si big2" data-gacha="card" ${store.gold<200?"disabled":""}><span class="ca ch-card"${UI("chest_card")?` style="background-image:url(${UI("chest_card")})"`:""}></span><span class="tx"><span class="nm">Rương thẻ</span><span class="ds">${left?"70% thẻ chưa có · 15% điểm nâng cấp · 15% token":"Đã đủ thẻ: 50% điểm nâng cấp · 50% token"}</span>${pz("gold",200)}</span></button>
    <button type="button" class="si big2" data-gacha="item" ${store.tok<150?"disabled":""}><span class="ca ch-item"${UI("chest_item")?` style="background-image:url(${UI("chest_item")})"`:""}></span><span class="tx"><span class="nm">Rương vật phẩm</span><span class="ds">35% mặt lưng · 15% sàn đấu · 25% vàng · 15% điểm nâng cấp · 10% điểm sự kiện</span>${pz("tok",150)}</span></button></div></section>`;
  // Hằng ngày
  const prog=Math.min(10,S.dp);
  h+=`<section class="ssec" id="ss-day">`+secHead("day","Ưu đãi hằng ngày",endDay())+`<div class="dpg"><div class="dpt">Mua ${prog}/10 ưu đãi hằng ngày để nhận ${icn("tok")}600</div><div class="dpr"><span class="bar"><i style="width:${prog*10}%"></i></span>${S.dp>=10?`<button type="button" class="btn end" data-dpc="1">Nhận</button>`:`<span class="dpi">${icn("tok")}</span>`}</div></div>
  <div class="shg">${DOFF.map(o=>{const got=S.db[o.id],none=o.mys&&!E.COLLECT.some(k=>!OWN.has(k));return `<button type="button" class="si dof" data-do="${o.id}" ${got||none?"disabled":""}>${o.mys?`<span class="badge">Hiếm</span>`+spak("MYS","sm"):pile(2,Object.keys(o.g)[0])}<span class="nm">${o.n}</span><span class="ds">${o.mys?o.d:"+"+Object.values(o.g)[0]+" "+RES[Object.keys(o.g)[0]][2].toLowerCase()}</span>${got?`<span class="pz own">Đã mua</span>`:none?`<span class="pz own">Đã đủ thẻ</span>`:pz("gold",o.cost)}</button>`;}).join("")}</div></section>`;
  // Trang trí
  const dd=decoDeals();
  h+=`<section class="ssec" id="ss-deco">`+secHead("deco","Trang trí giảm giá",endSlot8(),"đổi mới mỗi 8 giờ")+(dd.length?`<div class="shg">${dd.map(([t,v])=>{const [ck,pr]=decoPrice(t,v);return `<button type="button" class="si" data-dd="${t}:${v}" ${store[ck]<pr?"disabled":""}><span class="badge">-25%</span>${t==="bk"?`<span class="bkp" style="--bk:${BACKS[v][1]}"></span>`:`<span class="arp" style="--ap:url(${arImg(v,1)}) center 22%/cover;height:62px"></span>`}<span class="nm">${t==="bk"?BACKS[v][0]:ARENAS[v][0]}</span>${pz(ck,pr)}</button>`;}).join("")}</div>`:`<div class="shn">Bạn đã có mọi món trang trí.</div>`);
  if(shopSub!=="ar")shopSub="bk";
  h+=`<div class="shsub">${[["bk","Mặt lưng",Object.keys(BACKS).length],["ar","Sàn đấu",Object.keys(ARENAS).length]].map(([k,n,c])=>`<button type="button" class="${shopSub===k?"on":""}" data-ss="${k}">${n} <small>${c}</small></button>`).join("")}</div>`;
  if(shopSub==="bk")h+=`<div class="shg sbk">${Object.keys(BACKS).map(b=>{const o=store.backs.includes(b),e=store.back===b;return `<button type="button" class="si${e?" eq":""}" data-back="${b}" ${!o&&store.tok<300?"disabled":""}><span class="bkp" style="--bk:${BACKS[b][1]}"></span><span class="nm">${BACKS[b][0]}</span>${pz("tok",300,o,e)}</button>`;}).join("")}</div><div class="shn">Mặt lưng "Đang dùng" là mặc định cho bộ bài mới. Mỗi bộ bài chọn mặt lưng riêng trong phần sửa bộ.</div>`;
  else h+=`<div class="shg sar">${Object.keys(ARENAS).map(a=>{const o=store.arenas.includes(a),e=store.arena===a;return `<button type="button" class="si${e?" eq":""}" data-arena="${a}" ${!o&&store.gold<ARENAS[a][4]?"disabled":""}><span class="arp" style="--ap:url(${arImg(a,1)}) center 22%/cover"></span><span class="nm">${ARENAS[a][0]}</span>${pz("gold",ARENAS[a][4],o,e)}</button>`;}).join("")}</div>`;
  h+=`</section>`;
  // Nâng cấp
  const fr=Date.now()-(S.fu||0)>=SLOT8;
  h+=`<section class="ssec" id="ss-up">`+secHead("up","Điểm nâng cấp")+`<div class="shg"><button type="button" class="si gp" data-fu="1" ${fr?"":"disabled"}>${fr?`<span class="x2 free">Miễn phí</span>`:""}${pile(0,"up")}<span class="amt">${icn("up")}25</span>${fr?`<span class="pv">Nhận</span>`:`<span class="pz own">${cdHTML((S.fu||0)+SLOT8)}</span>`}</button>${UPP.map(([n,g],i)=>`<button type="button" class="si gp" data-ub="${i}" ${store.gold<g?"disabled":""}>${pile(i?4:2,"up")}<span class="amt">${icn("up")}${n.toLocaleString("vi-VN")}</span>${pz("gold",g)}</button>`).join("")}</div>`;
  const uc=upCards();
  h+=secHead("upk","Gói cường hoá",endDay())+(uc.length?`<div class="shg">${uc.map(k=>{const l=lvl(k),pr=Math.round(UPC[l]*.7),got=S.db["u"+k];return `<div class="si upk"><button type="button" class="upc" data-zk="${k}">${cardGC(k)}</button><span class="qq"><span style="color:${QN[l][1]}">${QN[l][0]}</span> → <b style="color:${QN[l+1][1]}">${QN[l+1][0]}</b></span>${got?`<span class="pz own">Đã mua</span>`:`<button type="button" class="pz${store.up<pr?" no":""}" data-uc="${k}">${icn("up")}${pr}</button>`}</div>`;}).join("")}</div>`:`<div class="shn">Mọi thẻ của bạn đã đạt bậc cao nhất.</div>`)+`</section>`;
  // Vàng
  h+=`<section class="ssec" id="ss-gold">`+secHead("gold","Vàng và gói nạp")+payRender()+`</section>`;
  return h;}
function shopCard(){const S=SH();let h="";
  const dc=dailyCards();
  h+=`<section class="ssec" id="ss-daily">`+secHead("daily","Thẻ bài hằng ngày",endDay())+`<div class="shg">${dc.map(k=>{const o=OWN.has(k),pr=PRICE[C[k].h]||500,pin=S.pin===k;return `<div class="si dcard${pin?" pinned":""}"><button type="button" class="upc" data-zk="${k}">${cardGC(k)}</button><span class="nm">${esc(C[k].n)}</span><span class="dcr">${o?`<span class="pz done">Hoàn thành ✓</span>`:`<button type="button" class="pz${store.tok<pr?" no":""}" data-dcb="${k}">${icn("tok")}${pr}</button><button type="button" class="pinb${pin?" on":""}" data-pin="${k}" aria-label="${pin?"Bỏ ghim":"Ghim thẻ"}" aria-pressed="${pin}">${SVI.pin}</button>`}</span>${pin?`<span class="badge pin">Đã ghim</span>`:""}</div>`;}).join("")}</div></section>`;
  h+=`<section class="ssec" id="ss-series">`+secHead("series","Gói Bậc")+`<div class="shg ser">${SER.map(([x,pr])=>{const pool=serPool(x),un=pool.filter(k=>!OWN.has(k)).length;return `<div class="si spr"><button type="button" class="spb" data-ser="${x}" aria-label="${serName(x)}">${spak(x)}</button><span class="nm">${serName(x)}</span><span class="ds">${un?`Còn ${un}/${pool.length} thẻ chưa có`:`Đã có đủ ${pool.length} thẻ`}</span>${un?`<button type="button" class="pz${store.tok<pr?" no":""}" data-ser="${x}">${icn("tok")}${pr}</button>`:`<span class="pz done">Hoàn thành!</span>`}<button type="button" class="lnk" data-pool="${x}">Xem thẻ</button></div>`;}).join("")}</div></section>`;
  const ft=!S.db.ft;
  h+=`<section class="ssec" id="ss-tok">`+secHead("tok","Đổi token")+`<div class="shg"><button type="button" class="si gp" data-tf="1" ${ft?"":"disabled"}>${ft?`<span class="x2 free">Miễn phí</span>`:""}${pile(0,"tok")}<span class="amt">${icn("tok")}20</span>${ft?`<span class="pv">Nhận</span>`:`<span class="pz own">Đã nhận</span>`}</button>${TOKP.map(([n,g],i)=>`<button type="button" class="si gp" data-tb="${i}" ${store.gold<g?"disabled":""}>${i?`<span class="bnx">+${Math.round((n/g*2.5-1)*100)}%</span>`:""}${pile(Math.min(5,i+2),"tok")}<span class="amt">${icn("tok")}${n.toLocaleString("vi-VN")}</span>${pz("gold",g)}</button>`).join("")}</div></section>`;
  return h;}
function renderShop(){
  if(shopTab!=="deal"&&shopTab!=="card")shopTab="deal";
  $("shopRes").innerHTML=resHTML(["gold","up","tok","evp","gems"]);
  for(const b of $("shopTabs").children){const on=b.dataset.st===shopTab;b.classList.toggle("on",on);b.setAttribute("aria-selected",on);}
  $("shopSub").innerHTML=SSEC[shopTab].map(([id,n,ic],i)=>`<button type="button" data-go="${id}" class="${i?"":"on"}">${svi(ic)}<span>${n}</span></button>`).join("");
  const bd=$("shopBody"),y=bd.scrollTop;bd.innerHTML=shopTab==="deal"?shopDeal():shopCard();bd.scrollTop=y;shopSpy();
}
function secTop(id){const bd=$("shopBody"),el=$("ss-"+id);if(!el)return 0;return el.getBoundingClientRect().top-bd.getBoundingClientRect().top+bd.scrollTop;}
function shopSpy(){const bd=$("shopBody"),secs=SSEC[shopTab];let cur=secs[0][0];for(const [id] of secs)if(secTop(id)<=bd.scrollTop+60)cur=id;if(bd.scrollTop+bd.clientHeight>=bd.scrollHeight-4)cur=secs[secs.length-1][0];for(const b of $("shopSub").children)b.classList.toggle("on",b.dataset.go===cur);}
$("shopBody").addEventListener("scroll",()=>{cancelAnimationFrame(shopSpy._r);shopSpy._r=requestAnimationFrame(shopSpy);},{passive:true});
$("shopSub").addEventListener("click",ev=>{const b=ev.target.closest("[data-go]");if(!b)return;SFX.play("tap");const bd=$("shopBody");bd.scrollTo({top:Math.max(0,secTop(b.dataset.go)-4),behavior:document.body.classList.contains("rm")?"auto":"smooth"});});
$("shopTabs").addEventListener("click",ev=>{const b=ev.target.closest("[data-st]");if(!b||b.dataset.st===shopTab)return;shopTab=b.dataset.st;SFX.play("tap");$("shopBody").scrollTop=0;renderShop();});
function openShop(){renderShop();$("ovShop").classList.add("on");}
setInterval(()=>{if(!$("ovShop").classList.contains("on"))return;let re=false;for(const e of document.querySelectorAll("#ovShop [data-cd]")){const ms=+e.dataset.cd-Date.now();if(ms<=0)re=true;e.textContent=cdText(ms);}if(re)renderShop();},20000);

/* ===== Thẻ tháng (season pass) + nhiệm vụ tuần + băng rôn sảnh ===== */
const PS_LV=50,PS_XP=500;
const PS_TH=["Hùng Vương Dựng Nước","Thánh Gióng Phá Giặc","Sơn Tinh Thuỷ Tinh","Lạc Long Quân","Chử Đồng Tử","Thạch Sanh Diệt Chằn","Từ Thức Gặp Tiên","Mỵ Châu Trọng Thuỷ","Tấm Cám","Sự Tích Trầu Cau","Bánh Chưng Bánh Giầy","Sự Tích Hồ Gươm"];
function monKey(){return todayStr().slice(0,7);}
function PS(){const m=monKey();if(!store.ps||typeof store.ps!=="object"||store.ps.m!==m)store.ps={m,xp:0,prem:0,cf:[],cp:[],login:""};const S=store.ps;if(!Array.isArray(S.cf))S.cf=[];if(!Array.isArray(S.cp))S.cp=[];return S;}
function psLv(){return Math.min(PS_LV,1+Math.floor(PS().xp/PS_XP));}
const PASSCFG={"2026-11":{"ten":"Bánh Chưng Bánh Giầy","c1":"chienthan","c2":"culongco"}};
function psCfg(){return PASSCFG[monKey()]||{};}
function cardRef(v){if(!v)return null;if(C[v]&&E.COLLECT.includes(v))return v;const n=String(v).trim().toLowerCase();return E.COLLECT.find(k=>C[k].n.toLowerCase()===n)||null;}
function psName(){return psCfg().ten||PS_TH[new Date().getMonth()];}
function psCard(t){const cf=psCfg(),want=cardRef(t===2?cf.c2:cf.c1);if(want)return want;const r=srng((t===2?"ps2":"ps")+monKey()),pool=E.COLLECT.filter(k=>C[k].h==="S5"&&(t!==2||k!==psCard(1)));return spick(pool,1,r)[0];}
function psEnd(){const d=new Date();return new Date(d.getFullYear(),d.getMonth()+1,1).getTime();}
function psRw(lv,prem){
  if(!prem){if(lv%5===0)return {g:{gold:150,tok:40}};return {g:[{gold:60},{up:40},{tok:25},{gold:60}][lv%4]};}
  if(lv===1)return {card:psCard()};
  if(lv%10===0){const ks=Object.keys(BACKS),b=ks[(lv/10+new Date().getMonth())%ks.length];return store.backs.includes(b)?{g:{tok:300}}:{back:b};}
  return {g:[{gold:120},{up:80},{tok:60},{evp:40}][lv%4]};}
function psAdd(xp){const S=PS(),before=psLv();S.xp=Math.min(PS_LV*PS_XP-1,S.xp+xp);const after=psLv();if(after>before)setTimeout(()=>toast(`Thẻ tháng lên cấp ${after}!`),400);}
function psClaimable(){const S=PS(),lv=psLv();let n=0;for(let i=1;i<=lv;i++){if(!S.cf.includes(i))n++;if(S.prem&&!S.cp.includes(i))n++;}return n;}
function psGrant(rw){if(rw.g)for(const k in rw.g)store[k]+=rw.g[k];if(rw.card){if(!grant(rw.card))store.tok+=300;}if(rw.back&&!store.backs.includes(rw.back))store.backs.push(rw.back);}
function psCell(rw){if(rw.card)return `<span class="psi card">${cardGC(rw.card)}</span><span class="psn">Thẻ ${esc(C[rw.card].n)}</span>`;if(rw.back)return `<span class="psi"><span class="bkp" style="--bk:${BACKS[rw.back][1]}"></span></span><span class="psn">Mặt lưng ${BACKS[rw.back][0]}</span>`;const ks=Object.keys(rw.g);return `<span class="psi">${icn(ks[0])}</span><span class="psn">${ks.map(x=>`<span>${icn(x)}${rw.g[x]}</span>`).join("")}</span>`;}
let psTier=1;
function renderPass(){const S=PS(),lv=psLv(),xpIn=S.xp%PS_XP,max=lv>=PS_LV;
  $("psMon").textContent=`THẺ THÁNG ${new Date().getMonth()+1}/${new Date().getFullYear()}`;$("psName").textContent=psName();
  $("psLvB").textContent=lv;$("psFill").style.width=(max?100:xpIn/PS_XP*100)+"%";$("psXpT").textContent=max?"Tối đa":`${xpIn}/${PS_XP} XP`;$("psCd").innerHTML=cdHTML(psEnd());
  const k=psCard(psTier),cl=psClaimable();
  $("psLeft").innerHTML=`<div class="pss">Phần thưởng nổi bật</div><div class="seg pst2"><button type="button" class="${psTier===1?"on":""}" data-pt="1">Cao cấp</button><button type="button" class="${psTier===2?"on":""}" data-pt="2">Siêu cao cấp</button></div>
   <button type="button" class="psfc" data-zk="${k}" aria-label="Xem thẻ ${esc(C[k].n)}">${cardGC(k)}</button><div class="psd">${psTier===1?"Mở khoá hàng Cao cấp: thẻ <b>"+esc(C[k].n)+"</b> ở cấp 1, mặt lưng và gấp đôi tài nguyên.":"Nhận ngay thẻ <b>"+esc(C[k].n)+"</b>, thêm 10 cấp và mở khoá toàn bộ hàng Cao cấp (gồm thẻ "+esc(C[psCard(1)].n)+")."}</div><div class="pshint">Chạm vào thẻ để xem chi tiết</div>
   ${S.prem>=psTier?`<span class="pz use">Đã mở khoá</span>`:`<button type="button" class="pv psbuy" data-pay="ps${psTier}">${VND(psTier===1?129000:249000)}</button>`}
   ${cl?`<button type="button" class="btn end psall" data-pall="1">Nhận tất cả (${cl})</button>`:""}
   <div class="psw"><b>Cách tích XP</b><span>Đăng nhập mỗi ngày +100</span><span>Mỗi nhiệm vụ ngày +150</span><span>Thắng 1 trận +50, thua hoặc hoà +25</span><span>Mốc thử thách tuần +300</span></div>`;
  let h=`<div class="psrh"><span></span><span>Miễn phí</span><span>Cao cấp</span></div>`;
  for(let i=1;i<=PS_LV;i++){const got=i<=lv,f=S.cf.includes(i),pp=S.cp.includes(i),fr=psRw(i,0),pr=psRw(i,1);
    h+=`<div class="psrow${got?" got":""}${i===lv?" cur":""}" id="psr${i}"><span class="pslh">${i}</span>
    <button type="button" class="psc${f?" done":got?" ready":" lock"}" data-pc="f|${i}" ${got&&!f?"":"disabled"}>${psCell(fr)}${f?`<i class="pck">✓</i>`:!got?`<i class="plk">🔒</i>`:""}</button>
    <button type="button" class="psc prem${pp?" done":got&&S.prem?" ready":" lock"}" data-pc="p|${i}" ${got&&S.prem&&!pp||pr.card?"":"disabled"}>${psCell(pr)}${pp?`<i class="pck">✓</i>`:(!got||!S.prem)?`<i class="plk">🔒</i>`:""}</button></div>`;}
  $("psList").innerHTML=h;}
function openPass(){renderPass();$("ovPass").classList.add("on");requestAnimationFrame(()=>{const L=$("psList"),r=$("psr"+Math.max(1,psLv()-1));if(r)L.scrollTop=Math.max(0,r.getBoundingClientRect().top-L.getBoundingClientRect().top+L.scrollTop-34);});}
$("psLeft").addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;SFX.play("tap");
  if(b.dataset.zk){openPZ(b.dataset.zk);return;}
  if(b.dataset.pt){psTier=+b.dataset.pt;renderPass();return;}
  if(b.dataset.pay){payAsk(b.dataset.pay);return;}
  if(b.dataset.pall){const S=PS(),lv=psLv(),got={};let n=0;for(let i=1;i<=lv;i++){if(!S.cf.includes(i)){S.cf.push(i);psGrant(psRw(i,0));n++;}if(S.prem&&!S.cp.includes(i)){S.cp.push(i);psGrant(psRw(i,1));n++;}}save();toast(`Đã nhận ${n} phần thưởng`);renderPass();renderLobby();}});
$("psList").addEventListener("click",ev=>{const b=ev.target.closest("[data-pc]");if(!b||b.disabled)return;const [t,l]=b.dataset.pc.split("|"),i=+l,S=PS();
  {const rw=psRw(i,t==="p"?1:0);if(rw.card&&(i>psLv()||(t==="p"&&(!S.prem||S.cp.includes(i))))){SFX.play("tap");openPZ(rw.card);return;}}
  if(i>psLv())return;
  if(t==="f"){if(S.cf.includes(i))return;S.cf.push(i);const rw=psRw(i,0);psGrant(rw);}else{if(!S.prem||S.cp.includes(i))return;S.cp.push(i);const rw=psRw(i,1);psGrant(rw);if(rw.card){save();renderPass();renderLobby();revealFx(rw.card,"S5","Thẻ tháng");return;}}
  SFX.play("win");save();renderPass();renderLobby();});
/* nhiệm vụ tuần + đăng nhập */
const WM=[[5,{gold:100}],[10,{gold:200,tok:50}],[15,{gold:400,tok:100}]];
function wmS(){const w=weekId();if(!store.wm||store.wm.w!==w)store.wm={w,n:0,cl:[]};return store.wm;}
function renderMis(){const S=PS(),lg=S.login===today(),W=wmS();
  $("misTop").innerHTML=`<div class="mlg${lg?"":" ready"}"><span class="tx"><b>Đăng nhập hôm nay</b><small>+100 XP thẻ tháng</small></span>${lg?`<span class="pz own">Đã nhận</span>`:`<button type="button" class="btn end" data-lg="1">Nhận</button>`}</div>`;
  $("misWk").innerHTML=`<div class="shh"><span class="sht"><b>Thử thách tuần</b><small>hoàn thành nhiệm vụ ngày trong tuần</small></span>${cdHTML(endWeek())}</div><div class="wmb"><span class="bar"><i style="width:${Math.min(100,W.n/15*100)}%"></i></span><b>${Math.min(15,W.n)}/15</b></div><div class="shg">${WM.map(([n,g],i)=>{const ok=W.n>=n,got=W.cl.includes(i);return `<button type="button" class="si wmi" data-wm2="${i}" ${ok&&!got?"":"disabled"}><span class="amt">${n} nhiệm vụ</span><span class="gfs">${rwHTML(g)}</span><span class="gf">+300 XP</span>${got?`<span class="pz own">Đã nhận</span>`:ok?`<span class="pv">Nhận</span>`:`<span class="pz own">${Math.min(W.n,n)}/${n}</span>`}</button>`;}).join("")}</div>`;}
$("misTop").addEventListener("click",ev=>{if(!ev.target.closest("[data-lg]"))return;const S=PS();if(S.login===today())return;S.login=today();psAdd(100);save();SFX.play("win");toast("+100 XP thẻ tháng");renderMis();renderLobby();});
$("misWk").addEventListener("click",ev=>{const b=ev.target.closest("[data-wm2]");if(!b||b.disabled)return;const W=wmS(),i=+b.dataset.wm2,[n,g]=WM[i];if(W.n<n||W.cl.includes(i))return;W.cl.push(i);for(const k in g)store[k]+=g[k];psAdd(300);save();SFX.play("win");showGain("Thử thách tuần",`<div class="gfs big">${rwHTML(g)}</div><div>+300 XP thẻ tháng</div>`,"#ffd65a");renderMis();renderLobby();});
/* băng rôn thông báo ở sảnh */
let bnrI=0,bnrT=0,bnrList=[];
function bnrSlides(){const out=[],S=PS(),pk=psCard(1);
  out.push({id:"pass",c:"#b06bff",art0:1,tag:`THẺ THÁNG ${new Date().getMonth()+1}`,t:psName(),d:S.prem?"Bạn đã mở khoá Cao cấp. Làm nhiệm vụ để lên cấp!":"Làm nhiệm vụ, đăng nhập mỗi ngày để lên cấp. Mở khoá Cao cấp để nhận thẻ "+C[pk].n+".",btn:S.prem?"Xem thẻ tháng":"Mua gói Cao cấp",art:cardGC(pk),go:"pass"});
  if(clPending())out.push({id:"col",c:"#3dffb4",tag:"QUÀ SƯU TẬP",t:`Nhận ${clPending()} phần thưởng`,d:"Cấp sưu tập của bạn đã đạt mốc mới.",btn:"Nhận ngay",art:`<span class="bico">${icn("col")}</span>`,go:"col"});
  try{const sg=sigPack();if(packAvail(sg))out.push({id:"sig",c:HC[C[sg.card].h],tag:"GÓI MỚI HÔM NAY",t:C[sg.card].n,d:"Gói nhân vật kèm 1.000 vàng, 300 điểm nâng cấp, 200 token.",btn:VND(sg.pr),art:cardGC(sg.card),go:"shop:hot"});}catch(e){}
  try{const mu=wkMut(wkS().id);out.push({id:"wk",c:"#3fd0ff",tag:"SỰ KIỆN TUẦN",t:"Chiến Địa Biến Động",d:"Luật tuần này: "+mu.map(m=>m.n).join(", ")+".",btn:"Tham gia",art:`<span class="bico">${spak("S2").replace("<b>2</b>","<b>⚡</b>").replace("BẬC","SỰ KIỆN")}</span>`,go:"wk"});}catch(e){}
  {const P=payP(),f=PAY_GOLD.some(g=>!P.first[g[0]]);out.push({id:"gold",c:"#ffb02e",tag:f?"NẠP LẦN ĐẦU X2":"GÓI NẠP",t:f?"Nạp vàng nhân đôi":"Nguyệt phiếu 30 ngày",d:f?"Lần đầu nạp mỗi mốc được gấp đôi vàng.":"Nhận 100 vàng mỗi ngày, 30 ngày liền.",btn:"Xem gói nạp",art:`<span class="bico">${pile(5)}</span>`,go:"shop:gold"});}
  try{const dk=dailyCards()[0];out.push({id:"daily",c:HC[C[dk].h],tag:"THẺ HẰNG NGÀY",t:"6 thẻ mới hôm nay",d:"Thẻ xoay tua mỗi ngày, ghim 1 thẻ để giữ lại.",btn:"Đến cửa hàng",art:cardGC(dk),go:"shop:card"});}catch(e){}
  return out;}
function renderBnr(){const el=$("lbBnr");if(!el)return;bnrList=bnrSlides();if(bnrI>=bnrList.length)bnrI=0;
  const BNI={pass:"bnr_pass",wk:"mode_wk",gold:"bnr_shop",sig:"bnr_shop",daily:"bnr_shop",col:"mode_jr"};el.innerHTML=bnrList.map((b,i)=>`<button type="button" class="bsl${i===bnrI?" on":""}${UI(BNI[b.id])?" bimg":""}" style="--bc:${b.c};${UI(BNI[b.id])?`--bi:url(${UI(BNI[b.id])})`:""}" data-bgo="${b.go}" aria-label="${esc(b.t)}" ${i===bnrI?"":"tabindex=\"-1\""}><span class="bart">${b.art}</span><span class="btx"><span class="btag">${esc(b.tag)}</span><b class="bt">${esc(b.t)}</b><small>${esc(b.d)}</small><span class="bbtn">${esc(b.btn)}</span></span></button>`).join("");
  $("lbDots").innerHTML=bnrList.map((b,i)=>`<button type="button" class="${i===bnrI?"on":""}" data-bi="${i}" aria-label="Thông báo ${i+1}"></button>`).join("");
  {const c=psClaimable(),lv=psLv(),S=PS();$("lbPassLv").textContent=lv;$("lbPassBar").style.width=(lv>=PS_LV?100:(S.xp%PS_XP)/PS_XP*100)+"%";$("lbPassN").textContent=c?String(c):"";}
  {const done=MIS.filter((m,i)=>store.ms.v[i]>=m[1]).length+(PS().login===today()?1:0),tot=MIS.length+1;$("lbMisN").textContent=done<tot?`${done}/${tot}`:"";}
  clearInterval(bnrT);bnrT=setInterval(()=>{if(!$("lobby").classList.contains("on")||document.querySelector(".ov.on")||document.hidden||bnrList.length<2)return;bnrGo(bnrI+1);},5500);}
function bnrGo(i){const n=bnrList.length;if(!n)return;bnrI=(i+n)%n;const sl=$("lbBnr").children,ds=$("lbDots").children;for(let k=0;k<sl.length;k++){sl[k].classList.toggle("on",k===bnrI);sl[k].tabIndex=k===bnrI?0:-1;}for(let k=0;k<ds.length;k++)ds[k].classList.toggle("on",k===bnrI);}
function bnrOpen(go){SFX.play("tap");if(go==="pass")openPass();else if(go==="col")claimCL();else if(go==="wk")openWk();else if(go.startsWith("shop:")){const t=go.slice(5);shopTab=t==="card"?"card":"deal";$("shopBody").scrollTop=0;openShop();if(t!=="card")requestAnimationFrame(()=>{const bd=$("shopBody");bd.scrollTop=Math.max(0,secTop(t)-4);});}}
{let sx=0,sy=0,moved=false;const el=$("lbBnr");
 el.addEventListener("pointerdown",e=>{sx=e.clientX;sy=e.clientY;moved=false;},{passive:true});
 el.addEventListener("pointerup",e=>{const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){moved=true;bnrGo(bnrI+(dx<0?1:-1));}},{passive:true});
 el.addEventListener("click",e=>{if(moved){moved=false;return;}const b=e.target.closest("[data-bgo]");if(b)bnrOpen(b.dataset.bgo);});}
$("lbDots").addEventListener("click",e=>{const b=e.target.closest("[data-bi]");if(b)bnrGo(+b.dataset.bi);});
$("lbPass").addEventListener("click",()=>{SFX.play("tap");openPass();});
if(UI("pass_emblem")){const e=document.createElement("span");e.className="lbpem";e.style.backgroundImage=`url(${UI("pass_emblem")})`;$("lbPass").prepend(e);}
$("setArena").addEventListener("click",()=>{$("ovSet").classList.remove("on");$("lbArena").click();});

/* ===== ảnh giao diện (rương, gói, chủ đề chế độ) ===== */
const MODE_ART={modePlay:"mode_rank",modeJr:"mode_jr",modeWk:"mode_wk",modeDraft:"mode_draft",modeConq:"mode_conq",modeOnline:"mode_online"};
function applyUiArt(){for(const id in MODE_ART){const el=$(id),u=UI(MODE_ART[id]);if(el&&u){el.classList.add("hasimg");el.style.setProperty("--mimg",`url(${u})`);}}}
function hubArt(key){const p=document.querySelector("#ovRun .mhub");if(!p)return;let b=$("runArt");if(!b){b=document.createElement("div");b.id="runArt";b.className="runart";p.insertBefore(b,p.children[1]);}const u=UI(key);b.hidden=!u;if(u)b.style.backgroundImage=`url(${u})`;}
applyUiArt();
/* ---- mở gói ---- */
let openCfg=null;
function openPreview(x){const pool=serPool(x),un=pool.filter(k=>!OWN.has(k)),pr=(SER.find(z=>z[0]===x)||[0,0])[1];openCfg={x,pr};
  $("openBody").innerHTML=`<div class="opv"><div class="opk big">${spak(x)}</div><div class="onm">${serName(x)}</div><div class="osub">${un.length?`Nhận 1 thẻ ${x==="CB"?"Cơ Bản":HE[x]} ngẫu nhiên mà bạn chưa có. Còn ${un.length}/${pool.length} thẻ.`:`Bạn đã có đủ ${pool.length} thẻ của gói này.`}</div><div class="oacts"><button type="button" class="btn ghost" data-op="pool">Xem thẻ bài</button>${un.length?`<button type="button" class="btn end" data-op="buy" ${store.tok<pr?"disabled":""}>${icn("tok")}${pr}</button>`:""}</div><button type="button" class="opx" data-op="x" aria-label="Đóng">✕</button></div>`;
  $("ovOpen").classList.add("on");}
function revealFx(k,packX,title){const d=C[k],c=HC[d.h]||"#7fd0ff",rm=document.body.classList.contains("rm");
  $("openBody").innerHTML=`<div class="opn" style="--c:${c}"><div class="orays"></div><div class="opk">${spak(packX)}</div><div class="oflash"></div><div class="ocd"><div class="ocb"><div class="ofr">${cardGC(k)}</div><div class="obk" style="background:${BACKS[dBack(store.decks[store.cur])][1]}"></div></div></div><div class="oinf"><div class="ott">${esc(title||"Thẻ mới!")}</div><div class="onm">${esc(d.n)}</div><div class="osub">${esc(HE[d.h]||"")} · nhận ở chất lượng Thường</div><div class="osk">${kwfx(skillText(d))}</div><button type="button" class="btn end" data-op="x">Nhận</button></div></div>`;
  $("ovOpen").classList.add("on");const el=$("openBody").firstElementChild;
  if(rm){el.classList.add("s3");SFX.play("win");return;}
  SFX.play("tap");requestAnimationFrame(()=>el.classList.add("s1"));
  setTimeout(()=>{el.classList.add("s2");SFX.play("place");},850);
  setTimeout(()=>{el.classList.add("s3");SFX.play("win");},1450);}
function buySeries(x){const pr=(SER.find(z=>z[0]===x)||[0,0])[1],un=serPool(x).filter(k=>!OWN.has(k));if(!un.length||store.tok<pr)return;store.tok-=pr;const k=un[Math.floor(Math.random()*un.length)];grant(k);save();revealFx(k,x,serName(x));renderShop();renderLobby();}
$("openBody").addEventListener("click",ev=>{const b=ev.target.closest("[data-op]");if(!b||b.disabled)return;const a=b.dataset.op;SFX.play("tap");
  if(a==="x")$("ovOpen").classList.remove("on");else if(a==="buy"&&openCfg)buySeries(openCfg.x);else if(a==="pool"&&openCfg)openPool(openCfg.x);});
$("ovOpen").addEventListener("click",ev=>{if(ev.target.id==="ovOpen"){const el=$("openBody").firstElementChild;if(!el||!el.classList.contains("opn")||el.classList.contains("s3"))$("ovOpen").classList.remove("on");}});
/* ---- xem thẻ có thể nhận ---- */
let poolX="",poolSort="c";
function openPool(x){poolX=x;renderPool();$("ovPool").classList.add("on");}
function renderPool(){const x=poolX,all=serPool(x),un=all.filter(k=>!OWN.has(k)),list=(un.length?un:all).slice();
  const f={c:(a,b)=>C[a].c-C[b].c||C[a].p-C[b].p,p:(a,b)=>C[b].p-C[a].p||C[a].c-C[b].c,n:(a,b)=>C[a].n.localeCompare(C[b].n,"vi")}[poolSort];list.sort(f);
  $("poolTitle").textContent=un.length?`${x==="CB"?"Thẻ Cơ Bản":"Thẻ "+HE[x]} bạn chưa có`:`${x==="CB"?"Thẻ Cơ Bản":"Thẻ "+HE[x]}`;
  $("poolCnt").innerHTML=un.length?`<b>${un.length}</b> thẻ có thể nhận`:`Đã có đủ <b>${all.length}</b> thẻ`;
  $("poolSort").innerHTML=[["c","Năng lượng"],["p","Sức mạnh"],["n","Tên"]].map(([k,n])=>`<button type="button" class="${poolSort===k?"on":""}" data-ps="${k}">${n}</button>`).join("");
  $("poolGrid").innerHTML=list.map(k=>`<button type="button" class="poolc${OWN.has(k)?" own":""}" data-zk="${k}">${cardGC(k)}<span class="nm">${esc(C[k].n)}</span></button>`).join("");}
$("poolSort").addEventListener("click",ev=>{const b=ev.target.closest("[data-ps]");if(!b)return;poolSort=b.dataset.ps;SFX.play("tap");renderPool();});
$("poolGrid").addEventListener("click",ev=>{const b=ev.target.closest("[data-zk]");if(b){SFX.play("tap");openPZ(b.dataset.zk);}});
/* ---- phóng to thẻ ---- */
let pzK=null,pzAlt=0;
function openPZ(k,alt){pzK=k;pzAlt=alt||0;const LK=[k,...(LINKS[k]||[])],ai=pzAlt%LK.length,sid=LK[ai],d=C[sid],kw=kwfx;
  $("pzBody").innerHTML=`<div class="fanw">${fanSides(LK,ai)}<span class="gc${qCls(sid)}" style="--hc:${HC[d.h]};--bk:${backBg()}${qSt(sid)};display:block">${art(sid)}<span class="cst">${d.c}</span><span class="pwh">${d.p}</span><span class="n">${logo(sid)}</span>${bacTag(d)}${lkBtn(ai,LK.length)}${flipBtn()}</span></div><div class="pkt">${sid!==k?"Thẻ liên quan của "+esc(C[k].n):esc(HE[d.h]||"")+" · "+esc(DANG[d.t]||"")+(OWN.has(k)?" · đã có":"")}</div><div class="zt">${kw(skillText(d))}</div><button type="button" class="zcl" data-pzx="1" aria-label="Đóng">✕</button>`;
  $("ovPZ").classList.add("on");}
$("pzBody").addEventListener("click",ev=>{if(ev.target.closest("[data-lk]")){SFX.play("tap");openPZ(pzK,pzAlt+1);return;}const fz=ev.target.closest("[data-fan]");if(fz){SFX.play("tap");const n=1+(LINKS[pzK]||[]).length;openPZ(pzK,(pzAlt+ +fz.dataset.fan+n)%n);return;}if(ev.target.closest("[data-pzx]"))$("ovPZ").classList.remove("on");});
$("ovPZ").addEventListener("click",ev=>{if(ev.target.id==="ovPZ")$("ovPZ").classList.remove("on");});
$("shopBody").addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b||b.disabled)return;const ds=b.dataset,S=SH();SFX.play("tap");
  if(ds.help){toast(SHELP[ds.help]||"",5200);return;}
  if(ds.zk){openPZ(ds.zk);return;}
  if(ds.ss){shopSub=ds.ss;renderShop();return;}
  if(ds.pay){payAsk(ds.pay);return;}
  if(ds.pool){openPool(ds.pool);return;}
  if(ds.ser){openPreview(ds.ser);return;}
  if(ds.mcc){const P=payP();if(mcLeft()>0&&P.mc.last!==today()){P.mc.last=today();store.gold+=100;save();showGain("Nguyệt phiếu",`<div class="big">${icn("gold")}+100</div><div>Còn ${mcLeft()} ngày</div>`,"#ffd65a");renderShop();renderLobby();}return;}
  if(ds.gacha){gacha(ds.gacha);return;}
  if(ds.dkb){const bb=deckBundles().find(x=>x.id===ds.dkb);if(!bb)return;const miss=bb.ids.filter(k=>!OWN.has(k)),pr=miss.length*DK_PER;if(store.gold<pr)return;store.gold-=pr;for(const k of miss)grant(k);let note="";if(store.decks.length<12&&!store.decks.some(d=>d.n===bb.n&&d.ids.join()===bb.ids.join())){store.decks.push({n:bb.n.slice(0,16),ids:bb.ids.slice(),b:""});note="<div>Đã thêm vào danh sách bộ bài của bạn.</div>";}save();showGain(miss.length?"Đã mua bộ bài":"Đã lưu bộ bài",`<div class="dkg sm">${bb.ids.map(k=>miniCard(k,true)).join("")}</div><div>${esc(bb.n)}${miss.length?` · nhận ${miss.length} thẻ mới`:""}</div>${note}`,"#7fd0ff");renderShop();renderLobby();return;}
  if(ds.dpc){if(S.dp>=10){S.dp-=10;store.tok+=600;save();showGain("Thưởng ưu đãi hằng ngày",`<div class="big">${icn("tok")}+600</div>`,"#c9a4ff");renderShop();renderLobby();}return;}
  if(ds.do){const o=DOFF.find(x=>x.id===ds.do);if(!o||S.db[o.id]||store.gold<o.cost)return;
    if(o.mys){const un=E.COLLECT.filter(k=>!OWN.has(k));if(!un.length)return;store.gold-=o.cost;S.db[o.id]=1;S.dp++;const k=un[Math.floor(Math.random()*un.length)];grant(k);save();revealFx(k,"MYS","Thẻ bí ẩn");renderShop();renderLobby();return;}
    store.gold-=o.cost;S.db[o.id]=1;S.dp++;const gk=Object.keys(o.g)[0];store[gk]+=o.g[gk];save();showGain(o.n,`<div class="big">${icn(gk)}+${o.g[gk]}</div>`,RES[gk][1]);renderShop();renderLobby();return;}
  if(ds.dd){const [t,v]=ds.dd.split(":"),[ck,pr]=decoPrice(t,v);if(store[ck]<pr)return;if(t==="bk"){if(store.backs.includes(v))return;store.backs.push(v);}else{if(store.arenas.includes(v))return;store.arenas.push(v);}store[ck]-=pr;save();toast(`Đã mua ${t==="bk"?BACKS[v][0]:ARENAS[v][0]}`);renderShop();renderLobby();return;}
  if(ds.fu){if(Date.now()-(S.fu||0)<SLOT8)return;S.fu=Date.now();store.up+=25;save();toast("+25 điểm nâng cấp");renderShop();renderLobby();return;}
  if(ds.ub){const [n,g]=UPP[+ds.ub]||[];if(!n||store.gold<g)return;store.gold-=g;store.up+=n;save();showGain("Điểm nâng cấp",`<div class="big">${icn("up")}+${n}</div>`,"#7fd0ff");renderShop();renderLobby();return;}
  if(ds.uc){const k=ds.uc,l=lvl(k),pr=Math.round(UPC[l]*.7);if(!OWN.has(k)||l>=6||S.db["u"+k]||store.up<pr)return;store.up-=pr;store.cards[k]=Object.assign({l:0,bc:"",au:false,an:false},store.cards[k]);store.cards[k].l=l+1;S.db["u"+k]=1;save();showGain("Cường hoá thành công",`<div style="width:120px;margin:0 auto">${cardGC(k)}</div><div>${esc(C[k].n)}: <b style="color:${QN[l+1][1]}">${QN[l+1][0]}</b></div>`,QN[l+1][1]);renderShop();renderLobby();return;}
  if(ds.dcb){const k=ds.dcb,pr=PRICE[C[k].h]||500;if(OWN.has(k)||store.tok<pr)return;store.tok-=pr;grant(k);if(S.pin===k)S.pin="";save();revealFx(k,C[k].h,"Thẻ bài hằng ngày");renderShop();renderLobby();return;}
  if(ds.pin){S.pin=S.pin===ds.pin?"":ds.pin;save();toast(S.pin?"Đã ghim thẻ, thẻ sẽ ở lại đến khi bạn mua":"Đã bỏ ghim");renderShop();return;}
  if(ds.tf){if(S.db.ft)return;S.db.ft=1;store.tok+=20;save();toast("+20 token");renderShop();renderLobby();return;}
  if(ds.tb){const [n,g]=TOKP[+ds.tb]||[];if(!n||store.gold<g)return;store.gold-=g;store.tok+=n;save();showGain("Đổi token",`<div class="big">${icn("tok")}+${n}</div>`,"#c9a4ff");renderShop();renderLobby();return;}
  if(ds.back){if(!store.backs.includes(ds.back)){if(store.tok<300)return;store.tok-=300;store.backs.push(ds.back);}store.back=ds.back;}
  else if(ds.arena){if(!store.arenas.includes(ds.arena)){const pr=ARENAS[ds.arena][4];if(store.gold<pr)return;store.gold-=pr;store.arenas.push(ds.arena);}store.arena=ds.arena;}
  else return;
  save();renderShop();renderLobby();});
/* thẻ lớn */
let cardRen=false,cardAlt=0;
function cardList(){return [...document.querySelectorAll('#ovDeck [data-pick]')].map(e=>e.dataset.pick).filter(k=>C[k]);}
function renderCard(){const k=cardId,d=C[k],o=OWN.has(k),l=lvl(k),pv=cardPrev,c=store.cards[k]||{},cu=pv===6&&l===6;
  $("cardRes").innerHTML=resHTML(["up","tok","gold"]);
  const LK=[k,...(LINKS[k]||[])],ai=cardAlt%LK.length,sid=LK[ai],sd=C[sid];
  $("cardHead").textContent=sid!==k?`Thẻ liên quan · ${d.n}`:`Thẻ nhân vật${DANG[d.t]?" · "+DANG[d.t]:""}${o?"":" · chưa sở hữu"}`;
  const qc=cu&&c.bc?c.bc:QN[pv][1],cls=pv?` qf q${pv}${cu&&c.bc?" qcc":""}${cu&&c.au?" qau":""}${cu&&c.an?" qan":""}`:"";
  $("cardBody").innerHTML=`<div class="fanw">${fanSides(LK,ai)}<div class="bigc${cls}" style="--hc:${HC[d.h]};--bk:${backBg()};${cu&&c.bc?"--qc:"+c.bc:""}">${art(sid)}<span class="cst">${sd.c}</span><span class="pwh">${sd.p}</span><span class="n">${logo(sid)}</span>${sid===k?spk(k):""}${bacTag(sd)}${lkBtn(ai,LK.length)}${flipBtn()}</div></div>
  <div class="cinfo cvtx">${kwfx(skillText(sd))}</div>
  ${cardRen?`<div class="frow cvren"><input id="cardName" type="text" maxlength="16" value="${esc(d.n)}" autocomplete="off" aria-label="Tên thẻ"><button type="button" class="sortb" data-rn="1">Lưu</button>${store.names[k]?`<button type="button" class="sortb" data-rn="0">Tên gốc</button>`:""}</div>`:""}
  ${o&&l===6?`<div class="cust"><div class="sw">${SWATCH.map(x=>`<button type="button" data-bc="${x}" class="${c.bc===x?"on":""}" style="--c:${x}" aria-label="Màu viền ${x}"></button>`).join("")}<button type="button" data-bc="" class="${!c.bc?"on":""}" style="--c:conic-gradient(#ff4d6d,#ffd65a,#7dff8a,#3fe0ff,#c45cff,#ff4d6d)" aria-label="Viền cầu vồng"></button></div><div class="tg2"><button type="button" class="tgb${c.au?" on":""}" data-tg="au">Hào quang</button><button type="button" class="tgb${c.an?" on":""}" data-tg="an">Thẻ động</button></div></div>`:""}`;
  $("cardQ").style.setProperty("--qc",qc);
  $("cardQ").innerHTML=`<button type="button" data-qv="-1" aria-label="Cấp độ thấp hơn">◀</button><div><small>${o&&pv===l?"Thẻ đang ở cấp độ":"Xem thẻ ở cấp độ"}</small><b>${QN[pv][0]}</b></div><button type="button" data-qv="1" aria-label="Cấp độ cao hơn">▶</button>`;
  const L=cardList(),i=L.indexOf(k);document.querySelectorAll("#ovCard [data-cn]").forEach(x=>x.disabled=i<0||L.length<2);
  $("cardFav").classList.toggle("on",store.fav.includes(k));$("cardRen").classList.toggle("on",cardRen);
  const b=$("btnUp");
  if(!o){const pr=PRICE[d.h]||500;b.innerHTML=`Mua ${icn("tok")}${pr}`;b.disabled=store.tok<pr;b.dataset.m="buy";}
  else if(l>=6){b.textContent="Đã tối đa";b.disabled=true;b.dataset.m="";}
  else{b.innerHTML=`Lên ${QN[l+1][0]} · ${icn("up")}${UPC[l]}`;b.disabled=store.up<UPC[l];b.dataset.m="up";}
}
function openCard(k){cardId=k;cardPrev=lvl(k);cardRen=false;cardAlt=0;renderCard();$("ovCard").classList.add("on");}
$("cardBody").addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;const k=cardId;SFX.play("tap");
  if(b.dataset.lk){cardAlt++;renderCard();return;}
  if(b.dataset.fan){const n=1+(LINKS[k]||[]).length;cardAlt=(cardAlt+ +b.dataset.fan+n)%n;renderCard();return;}
  if(b.dataset.rn){const v=b.dataset.rn==="1"?cleanName($("cardName").value):"";if(b.dataset.rn==="1"&&(!v||v===C[k].n))return;
    if(v){applyNames({[k]:v});store.names[k]=v;}else{applyNames({[k]:BASEN[k]});delete store.names[k];}
    for(const x in LGC)delete LGC[x];cardRen=false;save();renderCard();renderDeck(true);if(G)render();return;}
  if(b.dataset.tg==="fav"){toggleFav(k);}
  else if(lvl(k)===6){const c=store.cards[k];if(b.dataset.bc!==undefined)c.bc=b.dataset.bc;else if(b.dataset.tg)c[b.dataset.tg]=!c[b.dataset.tg];cardPrev=6;save();}
  renderCard();renderDeck(true);});
$("cardQ").addEventListener("click",ev=>{const b=ev.target.closest("[data-qv]");if(!b)return;SFX.play("tap");cardPrev=(cardPrev+ +b.dataset.qv+7)%7;renderCard();});
$("ovCard").addEventListener("click",ev=>{const n=ev.target.closest("[data-cn]");if(n){const L=cardList(),i=L.indexOf(cardId);if(i<0||L.length<2)return;SFX.play("tap");openCard(L[(i+ +n.dataset.cn+L.length)%L.length]);return;}
  if(ev.target.closest("#cardFav")){SFX.play("tap");toggleFav(cardId);renderCard();renderDeck(true);return;}
  if(ev.target.closest("#cardRen")){SFX.play("tap");cardRen=!cardRen;renderCard();if(cardRen)setTimeout(()=>{const x=$("cardName");if(x){x.focus();x.select();}},30);}});
$("btnUp").addEventListener("click",()=>{const k=cardId,b=$("btnUp");
  if(b.dataset.m==="buy"){const pr=PRICE[C[k].h]||500;if(store.tok<pr)return;store.tok-=pr;grant(k);save();SFX.play("win");}
  else if(b.dataset.m==="up"){const l=lvl(k);if(l>=6||store.up<UPC[l])return;store.up-=UPC[l];store.cards[k]=Object.assign({l:0,bc:"",au:false,an:false},store.cards[k]);store.cards[k].l=l+1;cardPrev=l+1;save();SFX.play("win");try{const r=document.querySelector(".bigc").getBoundingClientRect();FX.ring(r.left+r.width/2,r.top+r.height/2,QN[l+1][1],120,6);FX.burst(r.left+r.width/2,r.top+r.height/2,QN[l+1][1],26,220);}catch(e){}}
  renderCard();renderDeck(true);renderLobby();});
function claimCL(){if(!clPending())return;const i=store.clc++;const m=i%4;
  if(m===0){const k=randNew();if(k)gainCard(k,"Mốc sưu tập "+(i+1)*5);else gainRes("gold",200,"Mốc sưu tập "+(i+1)*5);}
  else if(m===1)gainRes("gold",150,"Mốc sưu tập "+(i+1)*5);else if(m===2)gainRes("tok",100,"Mốc sưu tập "+(i+1)*5);else gainRes("up",100,"Mốc sưu tập "+(i+1)*5);
  save();if($("ovDeck").classList.contains("on"))renderDeck(true);renderLobby();}
$("clBar").addEventListener("click",ev=>{if(ev.target.closest("#btnClaim"))claimCL();});
$("lbCol").addEventListener("click",()=>{SFX.play("tap");if(clPending())claimCL();else openCol();});
/* ===== chế độ Tuyển chọn & Chinh phục, độ khó máy ===== */
const DIFF={de:{n:"Dễ",tries:8,bl:.35,upg:0,c:"#3fd07a",d:"Máy chơi lóng ngóng, hay đặt bài vụng"},
  thuong:{n:"Thường",tries:300,bl:0,upg:0,c:"#4fa3ff",d:"Máy chơi như chế độ đấu thường"},
  kho:{n:"Khó",tries:650,bl:0,upg:4,c:"#ff9a3c",d:"Máy tính kỹ hơn, bộ bài có 4 lần nâng cấp"},
  acmong:{n:"Ác mộng",tries:1100,bl:0,upg:9,c:"#ff4d6d",d:"Máy tính rất kỹ, bộ bài có 9 lần nâng cấp"}};
const DORD=["de","thuong","kho","acmong"];
function gDiff(){return G&&G.mode?DIFF[G.mode.diff]||DIFF.thuong:DIFF.thuong;}
function aiMove(side){const d=gDiff();E.aiPlan(G,side,(d.bl&&Math.random()<d.bl)?2:d.tries);}
const UPK={p:"+2 sức mạnh",c:"−1 năng lượng",g:"Lớn dần: +1 sức mạnh mỗi cuối lượt khi ở trên bàn",
  ch:"Cổ vũ: khi lật, +1 sức mạnh cho các thẻ khác của bạn tại đây",iv:"Bất hoại: không thể bị tiêu huỷ",mv:"Dời được: có thể di chuyển 1 lần",
  rr:"Lật kép: kỹ năng Lật kích hoạt thêm 1 lần",ds:"Tiêu huỷ: khi lật, tiêu huỷ 1 thẻ địch có từ 2 sức mạnh trở xuống tại đây",
  wk:"Làm yếu: khi lật, −2 sức mạnh một thẻ địch ngẫu nhiên tại đây",dr:"Rút bài: khi lật, rút 1 thẻ",en:"Tích năng: khi lật, lượt sau +1 năng lượng",
  de:"Di sản: khi bị tiêu huỷ, +2 sức mạnh cho một thẻ khác của bạn",sh:"Kiên cường: sức mạnh của thẻ này không thể bị giảm"};
const UPSTAT=["p","c","g"],UPMAX=4;
function upOk(id,u,k){const n=u[k]||0;if(k==="p")return n<8;if(k==="c")return n<2&&C[id].c-n>0;if(k==="g"||k==="ch")return n<2;if(k==="rr")return !n&&C[id].t==="rev";return !n;}
function rollKind(id,u){u=u||{};const ok=Object.keys(UPK).filter(k=>upOk(id,u,k)),st=ok.filter(k=>UPSTAT.includes(k)),sk=ok.filter(k=>!UPSTAT.includes(k));
  const pool=(Math.random()<.4&&st.length)||!sk.length?st:sk;return pool[Math.floor(Math.random()*pool.length)];}
function addUpg(id,u,k){u=u||{n:0};u[k]=(u[k]||0)+(k==="p"?2:1);u.n=(u.n||0)+1;u.h=(u.h||[]).concat(k);return u;}
function rollUpg(id,u){const k=rollKind(id,u);return [addUpg(id,u,k),k];}
function upgList(u){if(!u||!u.h)return "";const c={};for(const k of u.h)c[k]=(c[k]||0)+1;return Object.entries(c).map(([k,n])=>(n>1&&k!=="p"&&k!=="c"?n+"× ":"")+(k==="p"?"+"+2*n+" sức mạnh":k==="c"?"−"+n+" năng lượng":UPK[k].split(":")[0])).join(" · ");}
function foeUpg(deck,n){const u={};for(let i=0;i<n;i++){const id=deck[Math.floor(Math.random()*deck.length)];if(u[id]&&u[id].n>=UPMAX)continue;u[id]=rollUpg(id,u[id])[0];}return u;}
function pickFoeDeck(){const hs=Object.keys(E.PARTNER);return E.themedDeck(hs[Math.floor(Math.random()*hs.length)]);}
const POOL=E.COLLECT.slice();
function rnd3(ex){const o=[];while(o.length<3){const k=POOL[Math.floor(Math.random()*POOL.length)];if(!ex.includes(k)&&!o.includes(k))o.push(k);}return o;}
function cardTile(k,attr,u){const d=C[k],ug=u&&u.n?`<span class="ugb">⬆${u.n}</span>`:"";
  const cs=d.c-((u&&u.c)||0),pw=d.p+((u&&u.p)||0);
  return `<button type="button" class="gc mdc" style="--hc:${HC[d.h]}" ${attr} aria-label="${esc(d.n)}">${art(k)}<span class="cst${cs<d.c?" up":""}">${cs}</span><span class="pwh${pw>d.p?" up":""}">${pw}</span>${ug}</button>`;}
/* ---- trận theo chế độ ---- */
function startModeGame(mode,pDeck,foeDeck,upP,upA,xo){mmBot(nm=>{startModeGame0(mode,pDeck,foeDeck,upP,upA,xo);$("foeName").textContent=nm;runMatchIntro("LƯỢT 1",mode.lbl||"",true);});}
function startModeGame0(mode,pDeck,foeDeck,upP,upA,xo){
  BC=null;TN0=0;LOCID=[];seenRev.clear();prevPow.clear();seenLoc.clear();seenStg.clear();prevLd=[];PWV={};sel=look=moveSel=null;armRetreat=0;
  foeAv=foeDeck[foeDeck.length-1];$("avFoe").innerHTML=artFace(foeAv);$("avMe").innerHTML=meAv();
  foeBack=Object.keys(BACKS)[Math.floor(Math.random()*Object.keys(BACKS).length)];
  G=E.newGame(pDeck,foeDeck,Object.assign({upg:{p:upP||{},a:upA||{}}},xo||{}));G.mode=mode;gameDeck=store.deck.join();
  missNote="";resetTimer(false);
  G.msg=`<b>${mode.lbl||(mode.k==="draft"?"Tuyển chọn":"Chinh phục")} · máy ${DIFF[mode.diff].n}.</b> `+turnMsg(G.msgs.slice(0,4));
  closeAll();$("lobby").classList.remove("on");if(window.BGM)BGM.syncGame(G);render();$("foeName").textContent="MÁY";}
/* ---- Tuyển chọn ---- */
const DR_GAMES=21,DR_SIZE=12;
function drDiff(g){return g<6?"thuong":g<14?"kho":"acmong";}
const DR_HP=3,HP_BUY=2,HP_COST=500;
function drNew(){store.run={k:"draft",ph:"pick",deck:[],offer:rnd3([]),g:0,w:0,l:0,upg:{},hist:[],hp:DR_HP,buy:0,off:null};save();}
function drOffer(R){const el=R.deck.filter(k=>!R.upg[k]||R.upg[k].n<UPMAX).sort(()=>Math.random()-.5).slice(0,2);return el.map(k=>[k,rollKind(k,R.upg[k])]);}
function hpHTML(R){let h="";for(let i=0;i<Math.max(R.hp,0);i++)h+="♥";return `<span class="hpn">${h||"—"}</span>`;}
function openDraft(){if(!store.run)drNew();closeAll();renderDraft();hubArt("mode_draft");$("ovRun").classList.add("on");}
function renderDraft(){const R=store.run,b=$("runBody");$("runTitle").textContent="Tuyển chọn";
  if(R.hp==null){R.hp=DR_HP;R.buy=0;}
  const stat=`<div class="rstat"><span>Máu <b class="hpv">${hpHTML(R)}</b></span><span>Trận <b>${Math.min(R.g+(R.ph==="play"?1:0),DR_GAMES)}/${DR_GAMES}</b></span><span>Thắng <b>${R.w}</b></span><span>Thua <b>${R.l}</b></span><span>Nâng cấp <b>${Object.values(R.upg).reduce((a,u)=>a+u.n,0)}</b></span></div>`;
  const buy=(R.ph==="play"||R.ph==="up")&&R.buy<HP_BUY?`<button class="btn ghost" type="button" id="drBuy"${store.gold<HP_COST?" disabled":""}>Mua 1 máu · ${icn("gold")}${HP_COST} (còn ${HP_BUY-R.buy} lần)</button>`:"";
  let h="",f="";
  if(R.ph==="pick"){
    h=`<p class="rhint">Chọn thẻ thứ <b>${R.deck.length+1}/${DR_SIZE}</b> cho bộ bài. Mỗi lượt hiện 3 thẻ ngẫu nhiên, chọn 1.</p><div class="rpick">${R.offer.map(k=>`<div class="rpc">${cardTile(k,`data-drp="${k}"`)}<b>${esc(C[k].n)}</b><small>${kwfx(esc(skillText(C[k])))}</small></div>`).join("")}</div>`+(R.deck.length?`<div class="sec">Đã chọn</div><div class="rdeck">${R.deck.map(k=>cardTile(k,"tabindex=\"-1\"")).join("")}</div>`:"");
    f=`<button class="btn ghost" type="button" data-close>Đóng</button><button class="btn ghost" type="button" id="drQuit">Bỏ lượt tuyển</button>`;
  }else if(R.ph==="up"){
    if(!R.off)R.off=drOffer(R);
    h=`<p class="rhint"><b>Qua màn!</b> Hệ thống chỉ định ngẫu nhiên 2 thẻ, mỗi thẻ kèm một nâng cấp. Chọn <b>1</b> để nhận. Mỗi thẻ tối đa ${UPMAX} lần nâng cấp.</p><div class="ropt">${R.off.map(([k,kk],i)=>{const u=R.upg[k];return `<div class="ropc" role="button" tabindex="0" data-dru="${i}"><span class="rcw">${cardTile(k,"tabindex=\"-1\"",u)}</span><span class="rtx"><b>${esc(C[k].n)}</b><i class="${UPSTAT.includes(kk)?"st":"sk"}">${UPSTAT.includes(kk)?"Chỉ số":"Kỹ năng"}</i><span>${esc(UPK[kk])}</span><small>${u?"Đã có: "+esc(upgList(u))+" ("+u.n+"/"+UPMAX+")":"Chưa nâng cấp"}</small></span></div>`;}).join("")||`<p class="rhint">Bộ bài đã nâng cấp tối đa.</p>`}</div><div class="sec">Bộ bài</div><div class="rdeck">${R.deck.map(k=>cardTile(k,"tabindex=\"-1\"",R.upg[k])).join("")}</div>`;
    f=buy+(R.off.length?"":`<button class="btn end" type="button" id="drSkip">Tiếp tục</button>`);
  }else if(R.ph==="done"){
    const rw=drReward(R);
    h=`<div class="rdone"><div class="big">${R.w} thắng · ${R.l} thua</div><p>${R.hp<=0?"Hết máu, lượt tuyển kết thúc.":"Hoàn thành "+DR_GAMES+" trận!"} Phần thưởng: ${icn("gold")}${rw.gold} vàng · ${icn("up")}${rw.up} điểm nâng · ${icn("tok")}${rw.tok} token · ${icn("evp")}${rw.evp} điểm sự kiện</p></div><div class="rdeck big">${R.deck.map(k=>`<div class="rpc">${cardTile(k,"tabindex=\"-1\"",R.upg[k])}<small>${R.upg[k]?esc(upgList(R.upg[k])):""}</small></div>`).join("")}</div>`;
    f=`<button class="btn end" type="button" id="drClaim">Nhận thưởng · lượt mới</button>`;
  }else{
    const nd=drDiff(R.g),last=R.hist[R.hist.length-1];
    h=(last?`<p class="rhint">${esc(last)}</p>`:"")+`<p class="rhint">Thua mất 1 máu, thắng không mất máu. Mỗi 5 trận được cộng 1 máu. Hết máu là kết thúc lượt tuyển.</p>`+`<p class="rhint">Trận tiếp theo: máy <b style="color:${DIFF[nd].c}">${DIFF[nd].n}</b>, bộ bài máy có ${Math.floor(R.g*.8)+DIFF[nd].upg} lần nâng cấp.</p><div class="rdeck big">${R.deck.map(k=>`<div class="rpc">${cardTile(k,"tabindex=\"-1\"",R.upg[k])}<small>${R.upg[k]?esc(upgList(R.upg[k])):""}</small></div>`).join("")}</div>`;
    const live=G&&G.mode&&G.mode.k==="draft"&&G.phase==="play";
    f=`<button class="btn ghost" type="button" data-close>Đóng</button><button class="btn ghost" type="button" id="drQuit">Bỏ lượt tuyển</button><button class="btn end" type="button" id="drPlay">${live?"Tiếp tục trận":"Vào trận"}</button>`;
    if(buy)h+=`<div class="rbuy">${buy}</div>`;
  }
  b.innerHTML=stat+h;$("runFoot").innerHTML=f;}
function drReward(R){return {gold:150+R.w*120,up:20+R.w*25,tok:30+R.w*30,evp:R.w*15};}
function drPlay(){const R=store.run;if(G&&G.mode&&G.mode.k==="draft"&&G.phase==="play"){closeAll();$("lobby").classList.remove("on");if(window.BGM)BGM.syncGame(G);render();return;}
  const diff=drDiff(R.g),fd=pickFoeDeck();startModeGame({k:"draft",diff},R.deck.slice(),fd,R.upg,foeUpg(fd,Math.floor(R.g*.8)+DIFF[diff].upg));}
/* ---- Chinh phục ---- */
const CQ=[{diff:"de",hp:8,rw:{gold:300,up:40,tok:40,evp:20}},{diff:"thuong",hp:10,rw:{gold:700,up:90,tok:90,evp:50}},{diff:"kho",hp:12,rw:{gold:1500,up:180,tok:180,evp:120}},{diff:"acmong",hp:15,rw:{gold:3000,up:400,tok:400,evp:300}}];
const MYHP=10;
function openConq(){if(!store.conq)store.conq={open:0,cur:null,won:[0,0,0,0]};closeAll();renderConq();hubArt("mode_conq");$("ovRun").classList.add("on");}
function renderConq(){const Q=store.conq,b=$("runBody");$("runTitle").textContent="Chinh phục";let h="",f="";
  if(Q.cur){const t=CQ[Q.cur.t],dd=DIFF[t.diff],bar=(v,m,c)=>`<div class="hpb"><i style="width:${Math.max(0,v)/m*100}%;background:${c}"></i><b>${Math.max(0,v)}/${m}</b></div>`;
    h=`<div class="cqhd" style="--dc:${dd.c}"><b>Tầng ${Q.cur.t+1}: ${dd.n}</b><small>${dd.d}</small></div><div class="cqhp"><span>Máu của bạn</span>${bar(Q.cur.me,MYHP,"#4fd07a")}<span>Máu đối thủ</span>${bar(Q.cur.foe,t.hp,dd.c)}</div><p class="rhint">Mỗi trận thua mất máu đúng bằng mức cược (1, 2, 4 hoặc 8). Cược càng cao, thắng càng mau. Rút lui sớm để giữ máu. Hết máu đối thủ trước là chinh phục xong tầng.</p>`+(Q.cur.log.length?`<div class="sec">Các trận</div><div class="cqlog">${Q.cur.log.slice(-8).map(x=>`<div>${esc(x)}</div>`).join("")}</div>`:"");
    const live=G&&G.mode&&G.mode.k==="conq"&&G.phase==="play";
    f=`<button class="btn ghost" type="button" data-close>Đóng</button><button class="btn ghost" type="button" id="cqQuit">Bỏ tầng</button><button class="btn end" type="button" id="cqPlay">${live?"Tiếp tục trận":"Vào trận"}</button>`;
  }else{
    h=`<p class="rhint">Chọn tầng. Mỗi tầng là một chuỗi trận với máu kéo dài qua nhiều ván, dùng bộ bài đang trang bị. Thắng tầng để mở tầng kế tiếp.</p>`+CQ.map((t,i)=>{const dd=DIFF[t.diff],lock=i>Q.open;return `<button type="button" class="mode cq${lock?" lock":""}" ${lock?"disabled":`data-cq="${i}"`} style="--mc:${dd.c}"><div class="mh">${dd.n}</div><div class="mb">${dd.d}. Máu đối thủ ${t.hp}, máu bạn ${MYHP}. Thưởng: ${icn("gold")}${t.rw.gold} · ${icn("up")}${t.rw.up} · ${icn("tok")}${t.rw.tok} · ${icn("evp")}${t.rw.evp}${Q.won[i]?` · đã thắng ${Q.won[i]} lần`:""}${lock?" · Thắng tầng trước để mở":""}</div></button>`;}).join("");
    f=`<button class="btn ghost" type="button" data-close>Đóng</button>`;}
  b.innerHTML=h;$("runFoot").innerHTML=f;}
function cqPlay(){const Q=store.conq;if(G&&G.mode&&G.mode.k==="conq"&&G.phase==="play"){closeAll();$("lobby").classList.remove("on");render();return;}
  const t=CQ[Q.cur.t],fd=pickFoeDeck();startModeGame({k:"conq",diff:t.diff},store.deck.slice(),fd,{},foeUpg(fd,DIFF[t.diff].upg));}
/* ---- kết thúc trận theo chế độ: trả về chuỗi hiển thị ---- */
function modeEnd(r){const m=G.mode;
  if(m.k==="online"){const d=r.winner==="p"?r.stake:r.winner==="a"?-r.stake:0;store.gems+=d;return `<b>${d>0?"+":d<0?"−":""}${Math.abs(d)} ${icn("gems")}</b> (đấu online)<br>Kho ngọc của bạn: ${store.gems} ${icn("gems")}`;}
  if(m.k==="jr")return jrModeEnd(r);if(m.k==="wk")return wkModeEnd(r);
  if(m.k==="draft"){const R=store.run;if(!R||R.k!=="draft")return "";if(R.hp==null){R.hp=DR_HP;R.buy=0;}R.g++;let note="";
    if(r.winner==="p")R.w++;else if(r.winner==="a"){R.l++;R.hp--;note="Mất 1 máu. ";}
    if(R.g%5===0&&R.hp>0&&R.g<DR_GAMES){R.hp++;note+="Qua "+R.g+" trận: +1 máu. ";}
    const over=R.hp<=0||R.g>=DR_GAMES;R.off=null;
    R.ph=r.winner==="p"&&R.g<DR_GAMES&&R.hp>0?"up":over?"done":"play";
    R.hist.push(`Trận ${R.g}: ${r.winner==="p"?"thắng":r.winner==="a"?"thua":"hoà"} (máy ${DIFF[m.diff].n}). ${note}`);save();
    return (r.winner==="p"&&R.ph==="up"?"<b>Qua màn!</b> Được chọn 1 trong 2 thẻ để nâng cấp.<br>":"")+(note?esc(note)+"<br>":"")+`Lượt tuyển: ${R.w} thắng · ${R.l} thua · trận ${R.g}/${DR_GAMES} · máu ${Math.max(R.hp,0)}`+(R.ph==="done"?"<br><b>Lượt tuyển kết thúc.</b>":"");}
  if(m.k==="conq"){const Q=store.conq;if(!Q||!Q.cur)return "";const t=CQ[Q.cur.t],st=r.stake||1;let s="";
    if(r.winner==="p"){Q.cur.foe-=st;s=`Đối thủ mất ${st} máu.`;}else if(r.winner==="a"){Q.cur.me-=st;s=`Bạn mất ${st} máu.`;}else s="Hoà, không ai mất máu.";
    Q.cur.log.push(`Trận ${Q.cur.log.length+1}: ${r.winner==="p"?"thắng":r.winner==="a"?"thua":"hoà"}, cược ${st}. ${s}`);
    let tail="";
    if(Q.cur.foe<=0){const rw=t.rw;store.gold+=rw.gold;store.up+=rw.up;store.tok+=rw.tok;store.evp+=rw.evp;Q.won[Q.cur.t]=(Q.won[Q.cur.t]||0)+1;if(Q.open<=Q.cur.t&&Q.cur.t<CQ.length-1)Q.open=Q.cur.t+1;tail=`<br><b>Chinh phục tầng ${DIFF[t.diff].n}!</b> ${icn("gold")}+${rw.gold} · ${icn("up")}+${rw.up} · ${icn("tok")}+${rw.tok} · ${icn("evp")}+${rw.evp}`;Q.cur=null;}
    else if(Q.cur.me<=0){tail=`<br><b>Hết máu.</b> Tầng ${DIFF[t.diff].n} thất bại, thử lại từ đầu.`;Q.cur=null;}
    else tail=`<br>Máu: bạn ${Q.cur.me}/${MYHP} · đối thủ ${Q.cur.foe}/${t.hp}`;
    save();return s+tail;}
  return "";}
function openModeHub(k){if(k==="online"){onlineFind();return;}if(k==="draft")openDraft();else if(k==="jr")openJr(G&&G.mode&&G.mode.slot||"jr");else if(k==="wk")openWk();else openConq();}
/* ---- sự kiện ---- */
$("runBody").addEventListener("click",ev=>{const b=ev.target.closest("[data-drp],[data-dru],[data-cq]");if(!b)return;
  if(b.dataset.drp){const R=store.run;R.deck.push(b.dataset.drp);SFX.play("tap");if(R.deck.length>=DR_SIZE){R.ph="play";}else R.offer=rnd3(R.deck);save();renderDraft();}
  else if(b.dataset.dru!=null){const R=store.run;if(!R.off)return;const [k,kk]=R.off[+b.dataset.dru];const u=addUpg(k,R.upg[k],kk);R.upg[k]=u;R.off=null;R.ph="play";R.hist.push(`Nâng cấp ${C[k].n}: ${UPK[kk]}.`);save();SFX.play("win");showGain("Nâng cấp thẻ",`${cardTile(k,"tabindex=\"-1\"",u)}<div class="big">${esc(C[k].n)}</div><div>${esc(UPK[kk])}</div>`,"#7dff8a");renderDraft();}
  else if(b.dataset.cq!=null){const i=+b.dataset.cq;store.conq.cur={t:i,me:MYHP,foe:CQ[i].hp,log:[]};save();renderConq();}});
function drBuy(){const R=store.run;if(!R||R.buy>=HP_BUY||store.gold<HP_COST)return;store.gold-=HP_COST;R.buy++;R.hp++;R.hist.push(`Mua 1 máu (${HP_COST} vàng).`);save();SFX.play("win");renderDraft();renderLobby();}
$("runBody").addEventListener("click",ev=>{if(ev.target.closest("#drBuy"))drBuy();});
$("runBody").addEventListener("keydown",ev=>{if((ev.key==="Enter"||ev.key===" ")&&ev.target.matches(".ropc")){ev.preventDefault();ev.target.click();}});
$("runFoot").addEventListener("click",ev=>{const id=ev.target.closest("button")&&ev.target.closest("button").id;if(id==="drBuy"){drBuy();return;}if(id==="drSkip"){store.run.ph="play";store.run.off=null;save();renderDraft();return;}
  if(id==="drPlay")drPlay();else if(id==="cqPlay")cqPlay();
  else if(id==="drQuit"){if(armQuit!=="dr"){armQuit="dr";ev.target.textContent="Bấm lần nữa để bỏ";return;}armQuit="";store.run=null;if(G&&G.mode&&G.mode.k==="draft")G=null;save();drNew();renderDraft();}
  else if(id==="cqQuit"){if(armQuit!=="cq"){armQuit="cq";ev.target.textContent="Bấm lần nữa để bỏ";return;}armQuit="";store.conq.cur=null;if(G&&G.mode&&G.mode.k==="conq")G=null;save();renderConq();}
  else if(id==="drClaim"){const rw=drReward(store.run);store.gold+=rw.gold;store.up+=rw.up;store.tok+=rw.tok;store.evp+=rw.evp;drNew();SFX.play("win");renderDraft();renderLobby();}});
let armQuit="";
$("modeDraft").addEventListener("click",()=>{SFX.play("tap");openDraft();});
$("modeConq").addEventListener("click",()=>{SFX.play("tap");openConq();});
/* ===== Hành Trình Tam Địa (bản đồ rẽ nhánh, bảo vật, trùm, Thiên Kiếp, thử thách ngày) & Chiến Địa Biến Động ===== */
function jrStep(R){let a=R.rs=(R.rs+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
function withR(R,f){const o=Math.random;Math.random=()=>jrStep(R);try{return f();}finally{Math.random=o;}}
function hashS(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h|0;}
function rI(n){return Math.floor(Math.random()*n);}
function shuf(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=rI(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function todayStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function addM(dst,src){for(const k in src||{})dst[k]=(dst[k]||0)+src[k];return dst;}
/* bảo vật: m = hiệu ứng cho cả trận (G.mods.p), ui = hiệu ứng ngoài trận; u = số trùm đã hạ (tổng) để mở khoá */
const RELIC={
  ngoctrai:{n:"Ngọc Trai Biển",d:"Thẻ 0–1 năng lượng của bạn +1 sức mạnh.",m:{c1:1},u:0},
  trongdong:{n:"Trống Đồng",d:"Thẻ 2 năng lượng của bạn +1 sức mạnh.",m:{c2:1},u:0},
  cungthan:{n:"Cung Tên Thần",d:"Thẻ 3 năng lượng của bạn +1 sức mạnh.",m:{c3:1},u:0},
  giapvang:{n:"Giáp Vàng",d:"Thẻ 4–5 năng lượng của bạn +1 sức mạnh.",m:{c45:1},u:0},
  riusam:{n:"Rìu Sấm",d:"Thẻ từ 6 năng lượng trở lên của bạn +2 sức mạnh.",m:{c6:2},u:0},
  guonglat:{n:"Gương Đồng",d:"Thẻ có kỹ năng Lật của bạn +1 sức mạnh.",m:{t_rev:1},u:0},
  denduytri:{n:"Đèn Dầu Lạc",d:"Thẻ có kỹ năng Duy Trì của bạn +1 sức mạnh.",m:{t_on:1},u:0},
  chuonggio:{n:"Chuông Gió",d:"Thẻ không có kỹ năng của bạn +2 sức mạnh.",m:{t_none:2},u:0},
  nothan:{n:"Nỏ Thần",d:"Thẻ của bạn ở chiến địa trái +1 sức mạnh.",m:{l0:1},u:0},
  trudong:{n:"Trụ Đồng",d:"Thẻ của bạn ở chiến địa giữa +1 sức mạnh.",m:{l1:1},u:0},
  ankiem:{n:"Ấn Kiếm",d:"Thẻ của bạn ở chiến địa phải +1 sức mạnh.",m:{l2:1},u:0},
  khienmay:{n:"Khiên Mây",d:"Chặn lần giảm sức mạnh đầu tiên lên thẻ của bạn mỗi trận.",m:{shield1:1},u:0},
  banhchung:{n:"Bánh Chưng",d:"Mỗi lượt, thẻ đầu tiên bạn lật được +1 sức mạnh.",m:{firstrev:1},u:0},
  mogo:{n:"Mõ Gỗ",d:"Khi thẻ của bạn bị tiêu huỷ, rút 1 thẻ (1 lần mỗi lượt).",m:{mogo:1},u:0},
  noidong:{n:"Nồi Đồng",d:"Lượt 1: +1 năng lượng.",m:{e1:1},u:0},
  tuigao:{n:"Túi Gạo",d:"Lượt 4: +1 năng lượng.",m:{e4:1},u:0},
  binhruou:{n:"Bình Rượu Cần",d:"Lượt 6: +1 năng lượng.",m:{e6:1},u:0},
  batphuong:{n:"Bát Hương",d:"Bắt đầu trận với thêm 1 thẻ trên tay.",m:{h1:1},u:0},
  quyenthu:{n:"Quyển Thư Cổ",d:"Lượt 4: rút thêm 1 thẻ.",m:{d4:1},u:0},
  haigio:{n:"Hài Gió",d:"Mỗi khi thẻ của bạn di chuyển, nó +1 sức mạnh.",m:{mvpow:1},u:0},
  giotre:{n:"Giỏ Tre",d:"Thẻ của bạn ở chiến địa đã đủ 4 thẻ +1 sức mạnh.",m:{full:1},u:2},
  hatgiong:{n:"Hạt Giống Sớm",d:"Thẻ Lật bạn đặt ở lượt 1–3 +1 sức mạnh.",m:{rearly:1},u:2},
  labuadat:{n:"Bùa Đất",d:"Thẻ có sức mạnh gốc từ 2 trở xuống của bạn không thể bị giảm sức mạnh.",m:{lowsh:1},u:2},
  biada:{n:"Bia Đá",d:"Thẻ của bạn ở chiến địa giữa không thể bị tiêu huỷ.",m:{midiv:1},u:2},
  holo:{n:"Hồ Lô",d:"Khi bạn vứt bỏ 1 thẻ, một thẻ ngẫu nhiên của bạn trên bàn +2 sức mạnh.",m:{dpow:2},u:2},
  thatlung:{n:"Thắt Lưng Bạc",d:"Cuối lượt, nếu bạn tiêu hết năng lượng, thẻ vừa đặt sau cùng +2 sức mạnh.",m:{spent:2},u:2},
  coxlau:{n:"Cờ Lau",d:"Cuối lượt 5, nếu bạn dẫn ít nhất 2 chiến địa, lượt sau +1 năng lượng.",m:{colau:1},u:2},
  damai:{n:"Đá Mài",d:"Các thẻ trên tay đầu trận −1 năng lượng.",m:{tc:1},u:5},
  nuocthan:{n:"Nước Thần",d:"Cuối lượt 3, mọi thẻ của bạn trên bàn +1 sức mạnh.",m:{t3all:1},u:5},
  longan:{n:"Long Ấn",d:"Mọi thẻ của bạn +1 sức mạnh.",m:{all:1},u:7},
  buahomenh:{n:"Bùa Hộ Mệnh",d:"Lần đầu máu về 0, giữ lại 1 máu.",ui:"bua",u:0},
  reda:{n:"Rễ Đa",d:"Nhận ngay 1 máu.",ui:"reda",u:0},
  kinhchieu:{n:"Kính Chiếu Yêu",d:"Sau mỗi trận thắng, được chọn trong 3 thẻ nâng cấp thay vì 2.",ui:"kinh",u:2},
  lolua:{n:"Lò Lửa Thiêng",d:"Lò rèn cho chọn 4 kiểu nâng cấp thay vì 3.",ui:"lo",u:2}};
const JR_ACTS=3,JR_ROWS=6,JR_W=4,JR_DIFF=["thuong","kho","acmong"];
const BOSS=[{n:"Thuỷ Tinh",id:"matthevuong",d:"Nước dâng: từ lượt 2, cuối mỗi lượt, mọi thẻ của bạn ở chiến địa yếu nhất (có thẻ) −1 sức mạnh.",g:{flood:1},a:{},up:5},
  {n:"Hồ Tinh",id:"huyetdich",d:"Mê hoặc: từ lượt 2, đầu mỗi lượt, 1 thẻ ngẫu nhiên trên tay bạn bị trả về đáy bộ bài. Mọi thẻ của Hồ Tinh +1 sức mạnh.",g:{steal:1},a:{all:1},up:9},
  {n:"Chằn Tinh",id:"quaituong",d:"Hung tợn: cuối mỗi lượt, thẻ mạnh nhất của Chằn Tinh ở mỗi chiến địa +1 sức mạnh.",g:{chan:1},a:{},up:13}];
const NT={fight:{n:"Trận thường",i:"⚔",c:"#8fb4ff"},elite:{n:"Tinh anh",i:"✸",c:"#ff7a59"},shrine:{n:"Miếu thờ",i:"⛩",c:"#c38bff"},forge:{n:"Lò rèn",i:"⚒",c:"#ffc14d"},boss:{n:"Trùm",i:"♛",c:"#ff3d6e"}};
const ASC=["Không có kiếp nạn.","Đối thủ có thêm 2 lần nâng cấp mỗi trận.","Trận thường: máy chơi giỏi hơn một bậc.","Trùm: mọi thẻ +1 sức mạnh.","Không còn +1 máu sau mỗi 5 trận.","Đối thủ +1 năng lượng ở lượt 1.","Chỉ được mua 1 máu.","Tinh anh có Khiên Mây và Bánh Chưng.","Bắt đầu với 2 máu.","Đối thủ có thêm 3 lần nâng cấp nữa.","Chằn Tinh mang thêm nước dâng của Thuỷ Tinh, thẻ 6+ năng lượng của nó +2 sức mạnh."];
const WKM=[{k:"costm1",v:1,n:"Giá Rẻ",d:"Mọi thẻ −1 năng lượng."},{k:"turns7",v:1,n:"Trường Kỳ",d:"Trận đấu kéo dài 7 lượt."},{k:"drawX",v:1,n:"Thác Bài",d:"Từ lượt 2, mỗi bên rút thêm 1 thẻ mỗi lượt."},
  {k:"big56",v:2,n:"Thời Khổng Lồ",d:"Thẻ từ 5 năng lượng trở lên +2 sức mạnh."},{k:"small12",v:1,n:"Bầy Đàn",d:"Thẻ từ 2 năng lượng trở xuống +1 sức mạnh."},
  {k:"revAll",v:1,n:"Thiên Nhãn",d:"Cả 3 chiến địa lộ diện ngay từ đầu."},{k:"eAll",v:1,n:"Dồi Dào",d:"Mỗi lượt, mỗi bên +1 năng lượng."}];
function jm(){if(!store.jm)store.jm={asc:0,kills:0,runs:0,clears:0,best:0,daily:{}};return store.jm;}
function ascOf(R){return R.daily?0:R.asc||0;}
function hpRegen(R){return ascOf(R)<4;}
function hpBuyMax(R){return ascOf(R)>=6?1:HP_BUY;}
/* ---- bản đồ ---- */
function genMap(R){return withR(R,()=>{
  const has=new Set(),ed=new Set(),K=(r,c)=>r*JR_W+c;
  const starts=shuf([0,1,2,3]).slice(0,3);starts.push(rI(JR_W));
  for(const s of starts){let c=s;for(let r=0;r<JR_ROWS;r++){has.add(K(r,c));if(r<JR_ROWS-1){let nc=Math.max(0,Math.min(JR_W-1,c+rI(3)-1));
    if(nc===c+1&&ed.has(K(r,c+1)+">"+K(r+1,c)))nc=c;if(nc===c-1&&ed.has(K(r,c-1)+">"+K(r+1,c)))nc=c;ed.add(K(r,c)+">"+K(r+1,nc));c=nc;}}}
  const keys=[...has].sort((a,b)=>a-b),ix={},nodes=keys.map((k,i)=>{ix[k]=i;return {r:Math.floor(k/JR_W),c:k%JR_W,t:"fight",nx:[],done:0};});
  for(const e of ed){const [a,b]=e.split(">").map(Number);if(!nodes[ix[a]].nx.includes(ix[b]))nodes[ix[a]].nx.push(ix[b]);}
  const boss=nodes.length;nodes.push({r:JR_ROWS,c:1.5,t:"boss",nx:[],done:0});
  for(const n of nodes)if(n.r===JR_ROWS-1)n.nx.push(boss);
  for(const n of nodes){if(n.r===0||n.t==="boss")continue;
    if(n.r===JR_ROWS-1){n.t=Math.random()<.5?"forge":"shrine";continue;}
    const x=Math.random();n.t=n.r>=2&&x<.2?"elite":x<.37?"shrine":x<.48?"forge":"fight";}
  const mid=nodes.filter(n=>n.r>=2&&n.r<=4);
  if(!mid.some(n=>n.t==="elite")){shuf(mid)[0].t="elite";}
  if(!nodes.some(n=>n.t==="forge")){const m=shuf(nodes.filter(n=>n.r>=1&&n.r<=4&&n.t==="fight"));if(m[0])m[0].t="forge";}
  return {nodes,boss};});}
function avail(R){const M=R.map;if(R.pos<0)return M.nodes.map((n,i)=>n.r===0?i:-1).filter(i=>i>=0);return M.nodes[R.pos].nx.slice();}
/* ---- khởi tạo lượt ---- */
function jrNew(slot,asc){const daily=slot==="jd",dt=todayStr();
  const R={k:"jr",slot,daily:daily?dt:null,asc:daily?0:asc||0,rs:daily?hashS("LTD-"+dt):(Math.random()*4294967296)|0,
    ph:"pick",deck:[],upg:{},relics:[],used:{},hp:DR_HP,buy:0,g:0,w:0,l:0,sc:0,act:0,pos:-1,map:null,cur:-1,hist:[],off:null,dg:{}};
  if(ascOf(R)>=8)R.hp=2;
  if(daily){const M=jm();if(M.daily[dt])R.prac=1;else M.daily[dt]={s:0,win:false,done:0};}
  if(daily)R.dg=withR(R,()=>{const m=WKM[rI(WKM.length)];return {[m.k]:m.v,_n:m.n,_d:m.d};});
  R.offer=withR(R,()=>rnd3([]));store[slot]=R;save();return R;}
function relicPool(R){const k=jm().kills;return Object.keys(RELIC).filter(id=>!R.relics.includes(id)&&RELIC[id].u<=k);}
function relicOffer(R,n){return withR(R,()=>shuf(relicPool(R)).slice(0,n));}
function gainRelic(R,id){R.relics.push(id);const r=RELIC[id];if(r.ui==="reda")R.hp++;R.hist.push("Nhận bảo vật "+r.n+".");}
function hasUI(R,u){return R.relics.some(id=>RELIC[id].ui===u);}
function pMods(R){const m={};for(const id of R.relics)addM(m,RELIC[id].m);return m;}
function gMods(R,boss){const g={};for(const k in R.dg||{})if(k[0]!=="_")g[k]=R.dg[k];if(boss)addM(g,boss.g);if(boss&&R.act===2&&ascOf(R)>=10)g.flood=1;return g;}
function upOffer(R){const n=hasUI(R,"kinh")?3:2;return withR(R,()=>shuf(R.deck.filter(k=>!R.upg[k]||R.upg[k].n<UPMAX)).slice(0,n).map(k=>[k,rollKind(k,R.upg[k])]).filter(x=>x[1]));}
function forgeKinds(R,k){const n=hasUI(R,"lo")?4:3,o=[];withR(R,()=>{for(let i=0;i<30&&o.length<n;i++){const x=rollKind(k,R.upg[k]);if(x&&!o.includes(x))o.push(x);}});return o;}
function enterAct(R){R.map=genMap(R);R.pos=-1;R.cur=-1;R.ph="map";}
function lose1(R){R.hp--;if(R.hp<=0&&hasUI(R,"bua")&&!R.used.bua){R.used.bua=1;R.hp=1;return "Bùa Hộ Mệnh giữ lại 1 máu. ";}return "";}
/* ---- sự kiện miếu thờ ---- */
const SHRINE=[
  {n:"Miếu Thần Đá",d:"Tượng đá đòi một giọt máu để ban phúc.",o:[{t:"Dâng 1 máu: chọn 1 trong 3 bảo vật",need:R=>R.hp>1&&relicPool(R).length,f:R=>{R.hp--;R.off=relicOffer(R,3);R.ph="relic";R.rsn="shrine";return "Dâng 1 máu.";}},{t:"Lặng lẽ rời đi",f:()=>"Rời miếu."}]},
  {n:"Giếng Ước",d:"Ném đồng xu xuống giếng cổ, may rủi khó lường.",o:[{t:"Ném xu: 50% nhận bảo vật ngẫu nhiên, 50% mất 1 máu",need:R=>R.hp>1&&relicPool(R).length,f:R=>{if(jrStep(R)<.5){const id=relicOffer(R,1)[0];gainRelic(R,id);return "Giếng ban "+RELIC[id].n+"!";}R.hp--;return "Giếng im lặng. Mất 1 máu.";}},{t:"Rời đi",f:()=>"Rời giếng."}]},
  {n:"Ông Đồ Già",d:"Ông đồ viết bùa chú lên thẻ bài của bạn.",o:[{t:"2 thẻ ngẫu nhiên, mỗi thẻ nhận 1 nâng cấp ngẫu nhiên",f:R=>jrRandUp(R,2)},{t:"Rời đi",f:()=>"Cảm ơn ông đồ."}]},
  {n:"Suối Tiên",d:"Nước suối trong vắt, toả hơi ấm.",o:[{t:"Uống nước: +1 máu",f:R=>{R.hp++;return "+1 máu.";}},{t:"Tắm thẻ: 1 thẻ ngẫu nhiên nhận 1 nâng cấp",f:R=>jrRandUp(R,1)}]},
  {n:"Cây Đa Cổ Thụ",d:"Thần cây đổi một thẻ bài lấy một bảo vật.",o:[{t:"Mất 1 thẻ ngẫu nhiên, nhận 1 bảo vật ngẫu nhiên",need:R=>R.deck.length>10&&relicPool(R).length,f:R=>{const i=Math.floor(jrStep(R)*R.deck.length),k=R.deck.splice(i,1)[0];delete R.upg[k];const id=relicOffer(R,1)[0];gainRelic(R,id);return "Mất "+C[k].n+", nhận "+RELIC[id].n+".";}},{t:"Rời đi",f:()=>"Rời gốc đa."}]},
  {n:"Chợ Phiên Âm Dương",d:"Người lạ đề nghị đổi bài, không lấy tiền.",o:[{t:"Bỏ 1 thẻ do bạn chọn, rồi chọn 1 trong 3 thẻ mới",f:R=>{R.ph="swap1";return "";}},{t:"Rời đi",f:()=>"Rời chợ."}]},
  {n:"Đền Thánh Gióng",d:"Gậy sắt của Thánh Gióng còn lưu sức mạnh.",o:[{t:"1 thẻ ngẫu nhiên nhận 2 lần +2 sức mạnh",f:R=>{const el=R.deck.filter(k=>!R.upg[k]||R.upg[k].n<=UPMAX-2&&(R.upg[k].p||0)<=4);if(!el.length)return "Không còn thẻ phù hợp.";const k=el[Math.floor(jrStep(R)*el.length)];R.upg[k]=addUpg(k,addUpg(k,R.upg[k],"p"),"p");return C[k].n+" +4 sức mạnh.";}},{t:"Rời đi",f:()=>"Rời đền."}]}];
function jrRandUp(R,n){const out=[];withR(R,()=>{for(const k of shuf(R.deck.filter(k=>!R.upg[k]||R.upg[k].n<UPMAX)).slice(0,n)){const kk=rollKind(k,R.upg[k]);if(!kk)continue;R.upg[k]=addUpg(k,R.upg[k],kk);out.push(C[k].n+": "+UPK[kk].split(":")[0]);}});return out.length?out.join(" · "):"Không còn thẻ nâng cấp được.";}
/* ---- giao diện ---- */
let jrSlot="jr";
function JR(){return store[jrSlot];}
function relicHTML(R){return R.relics.length?`<div class="jrel">${R.relics.map(id=>`<span class="jrc" title="${esc(RELIC[id].d)}"><b>${esc(RELIC[id].n)}</b><small>${esc(RELIC[id].d)}</small></span>`).join("")}</div>`:"";}
function deckHTML(R,attr){return `<div class="rdeck">${R.deck.map(k=>cardTile(k,attr?attr(k):"tabindex=\"-1\"",R.upg[k])).join("")}</div>`;}
function mapHTML(R){const M=R.map,av=avail(R),H=JR_ROWS+1,X=c=>(c+.5)/JR_W*100,Y=r=>(H-r-.5)/H*100;
  let ln="";M.nodes.forEach((n,i)=>{for(const j of n.nx){const m=M.nodes[j],hot=i===R.pos&&av.includes(j);ln+=`<line x1="${X(n.c)}" y1="${Y(n.r)}" x2="${X(m.c)}" y2="${Y(m.r)}" class="${hot?"hot":n.done&&m.done?"dn":""}"/>`;}});
  const bt=M.nodes.map((n,i)=>{const t=NT[n.t],ok=av.includes(i)&&R.ph==="map",cl=["jn",n.t,ok?"av":"",n.done?"dn":"",i===R.pos?"cur":""].join(" ");
    return `<button type="button" class="${cl}" style="left:${X(n.c)}%;top:${Y(n.r)}%;--nc:${t.c}" ${ok?`data-jn="${i}"`:"disabled"} aria-label="${t.n}${n.t==="boss"?" "+BOSS[R.act].n:""}"><span>${t.i}</span></button>`;}).join("");
  return `<div class="jmap"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${ln}</svg>${bt}</div><div class="jleg">${Object.values(NT).map(t=>`<span style="--nc:${t.c}"><i>${t.i}</i>${t.n}</span>`).join("")}</div>`;}
function jrStat(R){return `<div class="rstat"><span>Máu <b class="hpv">${hpHTML(R)}</b></span><span>Màn <b>${Math.min(R.act+1,JR_ACTS)}/${JR_ACTS}</b></span><span>Thắng/Thua <b>${R.w}/${R.l}</b></span><span>Điểm <b>${R.sc}</b></span></div>`;}
function jrScore(R,win){return Math.round((R.sc+Math.max(R.hp,0)*20+(win?150:0))*(1+.15*ascOf(R)));}
function jrReward(s){return {gold:150+Math.floor(s*1.2),up:20+Math.floor(s/4),tok:30+Math.floor(s/3),evp:Math.floor(s/6)};}
function openJrHub(){closeAll();jrHub();$("ovRun").classList.add("on");}
function jrHub(){const M=jm(),b=$("runBody");$("runTitle").textContent="Hành Trình Tam Địa";const dt=todayStr(),D=M.daily[dt];
  const cur=store.jr,cd=store.jd&&store.jd.daily===dt?store.jd:null;
  const asc=Math.min(M.asc,10);let ao="";for(let i=0;i<=asc;i++)ao+=`<option value="${i}"${i===asc?" selected":""}>Thiên Kiếp ${i}</option>`;
  b.innerHTML=`<p class="rhint">Tuyển 12 thẻ, chọn 1 bảo vật khởi đầu, rồi đi qua 3 màn bản đồ rẽ nhánh. Mỗi màn kết thúc bằng một trùm. Máu: ${DR_HP}, thua mất 1, mỗi 5 trận +1, mua tối đa ${HP_BUY} máu bằng vàng.</p>
  <div class="mode jhub" style="--mc:#ffb02e"><div class="mh">Hành trình${cur?` · đang ở màn ${cur.act+1}`:""}</div><div class="mb">${cur?`Máu ${Math.max(cur.hp,0)} · ${cur.relics.length} bảo vật · Thiên Kiếp ${cur.asc}`:`Thiên Kiếp đã mở: 0–${asc}. Phá đảo ở mức cao nhất để mở mức tiếp theo.`}</div>
   <div class="jrow">${cur?`<button class="btn end" type="button" id="jrGo">Tiếp tục</button><button class="btn ghost" type="button" id="jrAb">Bỏ hành trình</button>`:`<select id="jrAsc" class="jsel">${ao}</select><button class="btn end" type="button" id="jrStart">Bắt đầu</button>`}</div>
   <small class="jasc" id="jrAscD">${cur?"":esc(ASC.slice(1,asc+1).map((t,i)=>(i+1)+". "+t).join(" ")||ASC[0])}</small></div>
  <div class="mode jhub" style="--mc:#3fd0ff"><div class="mh">Thử thách ngày</div><div class="mb">Ngày ${dt.split("-").reverse().join("/")}. Mọi người cùng bản đồ, cùng thẻ tuyển, cùng đối thủ. Luật hôm nay: <b>${esc(withR({rs:hashS("LTD-"+dt)},()=>WKM[rI(WKM.length)].n))}</b>. Lần đầu hoàn thành trong ngày được tính điểm bảng ngày và thêm ✦ 100.</div>
   <div class="jrow">${cd?`<button class="btn end" type="button" id="jdGo">Tiếp tục</button><button class="btn ghost" type="button" id="jdAb">Bỏ</button>`:`<button class="btn end" type="button" id="jdStart">${D?"Chơi lại (không tính điểm)":"Bắt đầu"}</button>`}</div></div>
  <div class="sec">Thành tích</div><div class="rstat"><span>Lượt chơi <b>${M.runs}</b></span><span>Phá đảo <b>${M.clears}</b></span><span>Trùm đã hạ <b>${M.kills}</b></span><span>Điểm cao <b>${M.best}</b></span></div>
  <div class="sec">Bảng điểm ngày (máy này)</div><div class="cqlog">${Object.entries(M.daily).sort((a,b)=>b[0]<a[0]?-1:1).slice(0,7).map(([d,v])=>`<div>${d.split("-").reverse().join("/")}: <b>${v.s}</b> điểm${v.win?" · phá đảo":""}</div>`).join("")||"<div>Chưa có lượt nào.</div>"}</div>
  <p class="rhint">Bảo vật mới mở khi hạ đủ trùm: 2 trùm mở thêm 8 bảo vật, 5 trùm mở thêm 2, 7 trùm mở Long Ấn.</p>`;
  $("runFoot").innerHTML=`<button class="btn ghost" type="button" data-close>Đóng</button>`;}
function openJr(slot){jrSlot=slot;closeAll();renderJr();hubArt("mode_jr");$("ovRun").classList.add("on");}
function renderJr(){const R=JR(),b=$("runBody");if(!R){jrHub();return;}
  $("runTitle").textContent=R.daily?"Thử thách ngày":"Hành Trình Tam Địa"+(R.asc?" · Thiên Kiếp "+R.asc:"");
  let h="",f=`<button class="btn ghost" type="button" id="jrHubB">Về sảnh</button>`;
  const buy=R.ph==="map"&&R.buy<hpBuyMax(R)?`<button class="btn ghost" type="button" id="jrBuy"${store.gold<HP_COST?" disabled":""}>Mua 1 máu · ${icn("gold")}${HP_COST} (còn ${hpBuyMax(R)-R.buy})</button>`:"";
  const dg=R.dg&&R.dg._n?`<p class="rhint">Luật ngày: <b>${esc(R.dg._n)}</b> · ${esc(R.dg._d)}</p>`:"";
  if(R.ph==="pick"){h=`<p class="rhint">Chọn thẻ thứ <b>${R.deck.length+1}/${DR_SIZE}</b>.</p><div class="rpick">${R.offer.map(k=>`<div class="rpc">${cardTile(k,`data-jp="${k}"`)}<b>${esc(C[k].n)}</b><small>${kwfx(esc(skillText(C[k])))}</small></div>`).join("")}</div>`+(R.deck.length?`<div class="sec">Đã chọn</div>`+deckHTML(R):"");}
  else if(R.ph==="relic"){h=`<p class="rhint">${R.rsn==="start"?"Chọn 1 bảo vật khởi đầu.":R.rsn==="boss"?"<b>Hạ trùm!</b> +1 máu. Chọn 1 bảo vật.":R.rsn==="shrine"?"Chọn 1 bảo vật.":"<b>Hạ tinh anh!</b> Chọn 1 bảo vật."} Bảo vật có hiệu lực mọi trận còn lại.</p><div class="ropt">${R.off.map(id=>`<div class="ropc jrop" role="button" tabindex="0" data-jr="${id}"><span class="rtx"><b>${esc(RELIC[id].n)}</b><span>${esc(RELIC[id].d)}</span></span></div>`).join("")}</div>`;
    if(!R.off.length){h+=`<p class="rhint">Đã có đủ mọi bảo vật đang mở. Nhận ${icn("gold")}300 thay thế.</p>`;f+=`<button class="btn end" type="button" id="jrRelSkip">Tiếp tục</button>`;}}
  else if(R.ph==="up"){h=`<p class="rhint"><b>Thắng!</b> Chọn 1 trong ${R.off.length} thẻ để nhận nâng cấp đi kèm.</p><div class="ropt">${R.off.map(([k,kk],i)=>{const u=R.upg[k];return `<div class="ropc" role="button" tabindex="0" data-ju="${i}"><span class="rcw">${cardTile(k,"tabindex=\"-1\"",u)}</span><span class="rtx"><b>${esc(C[k].n)}</b><i class="${UPSTAT.includes(kk)?"st":"sk"}">${UPSTAT.includes(kk)?"Chỉ số":"Kỹ năng"}</i><span>${esc(UPK[kk])}</span><small>${u?"Đã có: "+esc(upgList(u))+" ("+u.n+"/"+UPMAX+")":"Chưa nâng cấp"}</small></span></div>`;}).join("")}</div>`;
    if(!R.off.length){h+=`<p class="rhint">Bộ bài đã nâng cấp tối đa.</p>`;f+=`<button class="btn end" type="button" id="jrUpSkip">Tiếp tục</button>`;}}
  else if(R.ph==="shrine"){const S=SHRINE[R.ev];h=`<div class="cqhd" style="--dc:#c38bff"><b>⛩ ${esc(S.n)}</b><small>${esc(S.d)}</small></div><div class="ropt">${S.o.map((o,i)=>{const ok=!o.need||o.need(R);return `<div class="ropc${ok?"":" off"}" role="button" tabindex="0" ${ok?`data-js="${i}"`:"aria-disabled=\"true\""}><span class="rtx"><b>${esc(o.t)}</b>${ok?"":"<small>Không đủ điều kiện</small>"}</span></div>`;}).join("")}</div>`;}
  else if(R.ph==="swap1"){h=`<p class="rhint">Chọn 1 thẻ để bỏ khỏi bộ bài (mất luôn nâng cấp của thẻ đó).</p>`+deckHTML(R,k=>`data-jx="${k}"`);}
  else if(R.ph==="swap2"){h=`<p class="rhint">Chọn 1 thẻ mới.</p><div class="rpick">${R.offer.map(k=>`<div class="rpc">${cardTile(k,`data-jy="${k}"`)}<b>${esc(C[k].n)}</b><small>${kwfx(esc(skillText(C[k])))}</small></div>`).join("")}</div>`;}
  else if(R.ph==="forge"){if(R.fk==null){h=`<div class="cqhd" style="--dc:#ffc14d"><b>⚒ Lò rèn</b><small>Chọn 1 thẻ, rồi chọn kiểu nâng cấp cho thẻ đó.</small></div>`+deckHTML(R,k=>R.upg[k]&&R.upg[k].n>=UPMAX?"tabindex=\"-1\" disabled":`data-jf="${k}"`);}
    else{const k=R.fk;h=`<div class="cqhd" style="--dc:#ffc14d"><b>⚒ Rèn ${esc(C[k].n)}</b><small>${R.upg[k]?"Đã có: "+esc(upgList(R.upg[k])):"Chưa nâng cấp"}</small></div><div class="ropt">${R.fo.map(kk=>`<div class="ropc" role="button" tabindex="0" data-jk="${kk}"><span class="rcw">${cardTile(k,"tabindex=\"-1\"",R.upg[k])}</span><span class="rtx"><i class="${UPSTAT.includes(kk)?"st":"sk"}">${UPSTAT.includes(kk)?"Chỉ số":"Kỹ năng"}</i><span>${esc(UPK[kk])}</span></span></div>`).join("")}</div>`;f+=`<button class="btn ghost" type="button" id="jrFBack">Chọn thẻ khác</button>`;}}
  else if(R.ph==="done"){const win=R.win,s=jrScore(R,win),rw=jrReward(s);h=`<div class="rdone"><div class="big">${win?"Phá đảo Tam Địa!":"Hành trình kết thúc"}</div><p>Màn ${R.act+1} · ${R.w} thắng · ${R.l} thua · ${R.relics.length} bảo vật · Thiên Kiếp ${ascOf(R)}</p><p>Điểm: <b>${s}</b>${R.daily?" (bảng ngày)":""}</p><p>Phần thưởng: ${icn("gold")}${rw.gold} · ${icn("up")}${rw.up} · ${icn("tok")}${rw.tok} · ${icn("evp")}${rw.evp}${R.daily&&!R.prac?" · "+icn("evp")+"+100 thử thách ngày":R.prac?" · lượt luyện tập, không tính bảng ngày":""}</p>${win&&!R.daily&&R.asc>=jm().asc&&R.asc<10?`<p><b>Mở khoá Thiên Kiếp ${R.asc+1}!</b></p>`:""}</div>`+relicHTML(R)+deckHTML(R);f=`<button class="btn end" type="button" id="jrClaim">Nhận thưởng</button>`;}
  else{/* map / play */
    const live=G&&G.mode&&G.mode.k==="jr"&&G.mode.slot===jrSlot&&G.phase==="play";
    if(R.cur>=0&&(R.ph==="play"||live)){const n=R.map.nodes[R.cur],B=n.t==="boss"?BOSS[R.act]:null;
      h=`<div class="cqhd" style="--dc:${NT[n.t].c}"><b>${NT[n.t].i} ${B?"Trùm: "+B.n:NT[n.t].n}</b><small>${B?esc(B.d):n.t==="elite"?"Đối thủ mạnh hơn. Thắng được chọn 1 trong 3 bảo vật.":"Thắng được nâng cấp 1 thẻ."} Máy ${DIFF[jrFoe(R,n).diff].n}.</small></div>`;
      f+=`<button class="btn end" type="button" id="jrPlay">${live?"Tiếp tục trận":"Vào trận"}</button>`;}
    else h=`<p class="rhint">Màn ${R.act+1}: chọn nút sáng để đi tiếp. Trùm màn này: <b>${BOSS[R.act].n}</b>.</p>`;
    h=(R.hist.length?`<p class="rhint">${esc(R.hist[R.hist.length-1])}</p>`:"")+h+mapHTML(R)+(buy?`<div class="rbuy">${buy}</div>`:"");
    h+=`<div class="sec">Bảo vật</div>`+(relicHTML(R)||`<p class="rhint">Chưa có.</p>`)+`<div class="sec">Bộ bài</div>`+deckHTML(R);}
  b.innerHTML=jrStat(R)+dg+h;$("runFoot").innerHTML=f;}
/* ---- đối thủ cho từng nút ---- */
function jrFoe(R,n){const a=ascOf(R),bump=d=>DORD[Math.min(3,DORD.indexOf(d)+1)];let diff=JR_DIFF[R.act];
  if(n.t==="fight"&&a>=2)diff=bump(diff);if(n.t==="elite"||n.t==="boss")diff=bump(diff);
  let up=R.act*3+Math.floor(n.r/2)+(a>=1?2:0)+(a>=9?3:0);if(n.t==="elite")up+=3;if(n.t==="boss")up+=BOSS[R.act].up;
  const am={};if(a>=5)am.e1=1;if(n.t==="elite"&&a>=7){am.shield1=1;am.firstrev=1;}
  if(n.t==="boss"){addM(am,BOSS[R.act].a);if(a>=3)am.all=(am.all||0)+1;if(R.act===2&&a>=10)am.c6=2;}
  return {diff,up,am};}
function jrPlay(){const R=JR();if(G&&G.mode&&G.mode.k==="jr"&&G.mode.slot===jrSlot&&G.phase==="play"){closeAll();$("lobby").classList.remove("on");render();return;}
  const n=R.map.nodes[R.cur],F=jrFoe(R,n),B=n.t==="boss"?BOSS[R.act]:null;
  const o=withR(R,()=>{let fd=pickFoeDeck();if(B&&!fd.includes(B.id)){fd=fd.slice(0,-1).concat(B.id);}else if(B){fd=fd.filter(k=>k!==B.id).concat(B.id);}
    return {fd,fu:foeUpg(fd,F.up),seed:Math.floor(Math.random()*4294967296)};});
  R.ph="play";save();
  startModeGame({k:"jr",slot:jrSlot,diff:F.diff,lbl:(R.daily?"Thử thách ngày":"Hành Trình")+" · "+(B?"Trùm "+B.n:NT[n.t].n)},R.deck.slice(),o.fd,R.upg,o.fu,{mods:{p:pMods(R),a:F.am,g:gMods(R,B)},seed:R.daily?o.seed:undefined});}
function jrGoNode(i){const R=JR(),n=R.map.nodes[i];R.pos=i;R.cur=i;
  if(n.t==="shrine"){n.done=1;R.ev=Math.floor(jrStep(R)*SHRINE.length);R.ph="shrine";}
  else if(n.t==="forge"){n.done=1;R.ph="forge";R.fk=null;R.fo=null;}
  else R.ph="play";
  save();renderJr();}
function jrAfterNode(R){R.cur=-1;R.off=null;R.ph="map";}
function jrEnd(R,win){R.ph="done";R.win=!!win;const M=jm();M.runs++;if(win)M.clears++;const s=jrScore(R,win);if(s>M.best)M.best=s;
  if(win&&!R.daily&&R.asc>=M.asc&&R.asc<10)M.asc=R.asc+1;
  if(R.daily&&!R.prac)M.daily[R.daily]={s,win:!!win,done:1};
  const ks=Object.keys(M.daily).sort();while(ks.length>30)delete M.daily[ks.shift()];}
/* ---- kết thúc trận Hành Trình ---- */
function jrModeEnd(r){const m=G.mode,R=store[m.slot];if(!R||R.ph!=="play"||R.cur<0)return "";const n=R.map.nodes[R.cur],B=n.t==="boss"?BOSS[R.act]:null;
  R.g++;let note="",head="";
  if(r.winner==="p"){R.w++;n.done=1;
    if(B){R.sc+=80*(R.act+1);jm().kills++;R.hp++;head=`<b>Hạ ${B.n}!</b> +1 máu.`;R.off=relicOffer(R,3);R.rsn="boss";R.ph="relic";}
    else if(n.t==="elite"){R.sc+=25*(R.act+1);head="<b>Hạ tinh anh!</b> Chọn 1 bảo vật.";R.off=relicOffer(R,3);R.rsn="elite";R.ph="relic";}
    else{R.sc+=10*(R.act+1);head="<b>Thắng!</b> Chọn 1 thẻ để nâng cấp.";R.off=upOffer(R);R.ph="up";}}
  else{if(r.winner==="a"){R.l++;note="Mất 1 máu. "+lose1(R);}else note="Hoà, không mất máu. ";
    if(B){R.ph="play";note+=R.hp>0?"Trùm vẫn chờ, đấu lại. ":"";}else{n.done=1;jrAfterNode(R);}}
  if(hpRegen(R)&&R.g%5===0&&R.hp>0){R.hp++;note+="Qua "+R.g+" trận: +1 máu. ";}
  R.hist.push(`Trận ${R.g} (${B?"Trùm "+B.n:NT[n.t].n}): ${r.winner==="p"?"thắng":r.winner==="a"?"thua":"hoà"}. ${note}`);
  if(R.hp<=0)jrEnd(R,false);
  save();
  return (head?head+"<br>":"")+(note?esc(note)+"<br>":"")+`Máu ${Math.max(R.hp,0)} · điểm ${R.sc}`+(R.ph==="done"?"<br><b>Hành trình kết thúc.</b>":"");}
/* ---- Chiến Địa Biến Động (xoay vòng hằng tuần) ---- */
const WK_MS=[{w:3,rw:{gold:400},t:icn("gold")+"400"},{w:6,rw:{tok:150,up:80},t:icn("tok")+"150 · "+icn("up")+"80"},{w:10,rw:{gold:800,evp:200},t:icn("gold")+"800 · "+icn("evp")+"200"}];
function weekId(){return Math.floor((Date.now()/864e5+3)/7);}
function wkMut(id){const R={rs:hashS("WK-"+id)};return withR(R,()=>shuf(WKM).slice(0,2));}
function wkS(){const id=weekId();if(!store.wk||store.wk.id!==id)store.wk={id,w:0,l:0,cl:[]};return store.wk;}
function wkEnds(){const ms=(weekId()+1)*7*864e5-3*864e5-Date.now(),d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5);return d+" ngày "+h+" giờ";}
function openWk(){closeAll();renderWk();hubArt("mode_wk");$("ovRun").classList.add("on");}
function renderWk(){const W=wkS(),mu=wkMut(W.id);$("runTitle").textContent="Chiến Địa Biến Động";
  const live=G&&G.mode&&G.mode.k==="wk"&&G.phase==="play";
  $("runBody").innerHTML=`<p class="rhint">Luật đặc biệt đổi mỗi tuần. Dùng bộ bài đang trang bị, đấu máy Thường. Còn ${wkEnds()} đến tuần mới.</p>`+mu.map(m=>`<div class="cqhd" style="--dc:#3fd0ff"><b>${esc(m.n)}</b><small>${esc(m.d)}</small></div>`).join("")+
   `<div class="rstat"><span>Thắng tuần này <b>${W.w}</b></span><span>Thua <b>${W.l}</b></span></div><div class="sec">Mốc thưởng tuần</div><div class="ropt">${WK_MS.map((m,i)=>{const got=W.cl.includes(i),ok=W.w>=m.w&&!got;return `<div class="ropc${ok?"":" off"}" role="button" tabindex="0" ${ok?`data-wm="${i}"`:"aria-disabled=\"true\""}><span class="rtx"><b>${m.w} trận thắng: ${m.t}</b><small>${got?"Đã nhận":ok?"Bấm để nhận":"Còn "+(m.w-W.w)+" trận thắng"}</small></span></div>`;}).join("")}</div>`;
  $("runFoot").innerHTML=`<button class="btn ghost" type="button" data-close>Đóng</button><button class="btn end" type="button" id="wkPlay">${live?"Tiếp tục trận":"Vào trận"}</button>`;}
function wkPlay(){if(G&&G.mode&&G.mode.k==="wk"&&G.phase==="play"){closeAll();$("lobby").classList.remove("on");render();return;}
  const g={};for(const m of wkMut(wkS().id))g[m.k]=m.v;
  startModeGame({k:"wk",diff:"thuong",lbl:"Chiến Địa Biến Động"},store.deck.slice(),pickFoeDeck(),{},{},{mods:{p:{},a:{},g}});}
function wkModeEnd(r){const W=wkS();if(r.winner==="p")W.w++;else if(r.winner==="a")W.l++;save();
  const nx=WK_MS.find((m,i)=>!W.cl.includes(i)&&W.w<m.w);return `Tuần này: ${W.w} thắng · ${W.l} thua`+(WK_MS.some((m,i)=>W.w>=m.w&&!W.cl.includes(i))?"<br><b>Có mốc thưởng tuần để nhận!</b>":nx?`<br>Còn ${nx.w-W.w} trận thắng đến mốc ${nx.t}`:"");}
/* ---- sự kiện ---- */
$("runBody").addEventListener("click",ev=>{const b=ev.target.closest("[data-jp],[data-jr],[data-ju],[data-jn],[data-js],[data-jx],[data-jy],[data-jf],[data-jk],[data-wm]");if(!b)return;
  const d=b.dataset;if(d.wm!=null){const W=wkS(),i=+d.wm,m=WK_MS[i];if(W.w<m.w||W.cl.includes(i))return;W.cl.push(i);for(const k in m.rw)store[k]+=m.rw[k];save();SFX.play("win");renderWk();renderLobby();return;}
  const R=JR();if(!R)return;
  if(d.jp&&R.ph==="pick"){R.deck.push(d.jp);SFX.play("tap");if(R.deck.length>=DR_SIZE){R.off=relicOffer(R,3);R.rsn="start";R.ph="relic";}else R.offer=withR(R,()=>rnd3(R.deck));}
  else if(d.jr&&R.ph==="relic"&&R.off.includes(d.jr)){gainRelic(R,d.jr);SFX.play("win");const why=R.rsn;R.off=null;
    if(why==="start")enterAct(R);else if(why==="boss"){if(R.act>=JR_ACTS-1)jrEnd(R,true);else{R.act++;enterAct(R);}}else jrAfterNode(R);}
  else if(d.ju!=null&&R.ph==="up"){const [k,kk]=R.off[+d.ju];R.upg[k]=addUpg(k,R.upg[k],kk);R.hist.push(`Nâng cấp ${C[k].n}: ${UPK[kk].split(":")[0]}.`);SFX.play("win");jrAfterNode(R);}
  else if(d.jn!=null&&R.ph==="map"&&avail(R).includes(+d.jn)){SFX.play("tap");jrGoNode(+d.jn);return;}
  else if(d.js!=null&&R.ph==="shrine"){const o=SHRINE[R.ev].o[+d.js];if(o.need&&!o.need(R))return;const t=o.f(R);if(t)R.hist.push(SHRINE[R.ev].n+": "+t);if(R.ph==="shrine")jrAfterNode(R);SFX.play("tap");}
  else if(d.jx&&R.ph==="swap1"){const i=R.deck.indexOf(d.jx);if(i<0)return;R.deck.splice(i,1);if(!R.deck.includes(d.jx))delete R.upg[d.jx];R.offer=withR(R,()=>rnd3(R.deck));R.ph="swap2";R.hist.push("Bỏ "+C[d.jx].n+".");}
  else if(d.jy&&R.ph==="swap2"){R.deck.push(d.jy);R.hist.push("Nhận "+C[d.jy].n+".");jrAfterNode(R);SFX.play("win");}
  else if(d.jf&&R.ph==="forge"){if(R.upg[d.jf]&&R.upg[d.jf].n>=UPMAX)return;R.fk=d.jf;R.fo=forgeKinds(R,d.jf);if(!R.fo.length){R.fk=null;return;}}
  else if(d.jk&&R.ph==="forge"&&R.fk&&R.fo.includes(d.jk)){const k=R.fk;R.upg[k]=addUpg(k,R.upg[k],d.jk);R.hist.push(`Lò rèn: ${C[k].n} nhận ${UPK[d.jk].split(":")[0]}.`);R.fk=null;R.fo=null;SFX.play("win");jrAfterNode(R);}
  else return;
  save();renderJr();});
$("runBody").addEventListener("change",ev=>{if(ev.target.id==="jrAsc"){const a=+ev.target.value;$("jrAscD").textContent=ASC.slice(1,a+1).map((t,i)=>(i+1)+". "+t).join(" ")||ASC[0];}});
let armJr="";
function jrClick(id,el){
  if(id==="jrStart"){const a=Math.min(+($("jrAsc")||{value:0}).value||0,jm().asc);jrNew("jr",a);openJr("jr");}
  else if(id==="jrGo")openJr("jr");else if(id==="jdGo")openJr("jd");
  else if(id==="jdStart"){jrNew("jd");openJr("jd");}
  else if(id==="jrAb"||id==="jdAb"){if(armJr!==id){armJr=id;el.textContent="Bấm lần nữa để bỏ";return;}armJr="";const s=id==="jrAb"?"jr":"jd";store[s]=null;if(G&&G.mode&&G.mode.k==="jr"&&G.mode.slot===s)G=null;save();jrHub();}
  else if(id==="jrHubB")jrHub();
  else if(id==="jrPlay")jrPlay();
  else if(id==="jrBuy"){const R=JR();if(!R||R.ph!=="map"||R.buy>=hpBuyMax(R)||store.gold<HP_COST)return;store.gold-=HP_COST;R.buy++;R.hp++;R.hist.push(`Mua 1 máu (${HP_COST} vàng).`);save();SFX.play("win");renderJr();renderLobby();}
  else if(id==="jrRelSkip"){const R=JR();store.gold+=300;const why=R.rsn;R.off=null;if(why==="start")enterAct(R);else if(why==="boss"){if(R.act>=JR_ACTS-1)jrEnd(R,true);else{R.act++;enterAct(R);}}else jrAfterNode(R);save();renderJr();}
  else if(id==="jrUpSkip"){jrAfterNode(JR());save();renderJr();}
  else if(id==="jrFBack"){const R=JR();R.fk=null;R.fo=null;save();renderJr();}
  else if(id==="jrClaim"){const R=JR();if(!R||R.ph!=="done")return;const s=jrScore(R,R.win),rw=jrReward(s);for(const k in rw)store[k]+=rw[k];
    if(R.daily&&!R.prac){const D=jm().daily[R.daily];if(D&&!D.claimed){D.claimed=1;store.evp+=100;}}
    store[jrSlot]=null;save();SFX.play("win");jrHub();renderLobby();}
  else if(id==="wkPlay")wkPlay();
  else return false;return true;}
$("runBody").addEventListener("click",ev=>{const b=ev.target.closest("button[id]");if(b&&/^(jr|jd|wk)/.test(b.id))jrClick(b.id,b);});
$("runFoot").addEventListener("click",ev=>{const b=ev.target.closest("button[id]");if(b&&/^(jr|jd|wk)/.test(b.id))jrClick(b.id,b);});
$("modeJr").addEventListener("click",()=>{SFX.play("tap");openJrHub();});
$("modeWk").addEventListener("click",()=>{SFX.play("tap");openWk();});

/* xếp hạng */
const BOTS=["Hắc Phong","Tinh Vũ","Lam Nguyệt","Thiết Quyền","Bạch Hổ","Kim Ưng","Dạ Xoa","Hoả Long","Băng Tâm","Lôi Thần","Phong Vân","Tử Điện","Ngân Hà","Huyết Nguyệt","Thanh Xà","Cuồng Phong","Vô Ảnh","Thiên Mã","Địa Long","Xích Diệm","Hàn Băng","Kim Cương","Ảo Mộng","Chiến Thần","Hải Vương","Sơn Quân","Lưu Tinh","Nguyệt Ảnh","Thần Phong","Quang Minh"];
function botScore(n,i){let h=0;for(const ch of n)h=(h*31+ch.charCodeAt(0))%9973;const day=Math.floor(Date.now()/864e5);return Math.round((30-i)*2.2+h%14+((day*(h%5+1))%9));}
const LBM=[["rank","Đấu thường"],["online","Online"],["jr","Hành Trình"],["wk","Biến Động"],["conq","Chinh phục"],["draft","Tuyển chọn"]];
const LBR={d:[[1,1,{gold:300,tok:100}],[2,3,{gold:200,tok:60}],[4,10,{gold:120,tok:30}],[11,30,{gold:60}],[31,9999,{gold:20}]],
  m:[[1,1,{gold:3000,tok:1000,up:500}],[2,3,{gold:2000,tok:600,up:300}],[4,10,{gold:1200,tok:300}],[11,30,{gold:600,tok:150}],[31,9999,{gold:200}]],
  w:[[1,1,{gold:1200,tok:400}],[2,3,{gold:800,tok:250}],[4,10,{gold:500,tok:120}],[11,30,{gold:250,tok:60}],[31,9999,{gold:80}]]};
let rkMode="rank",rkPer="d";
function lbKeys(mode,ago){const d=new Date();if(ago)d.setDate(d.getDate()-1);const ds=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const m=new Date();if(ago)m.setMonth(m.getMonth()-1);const ms=m.getFullYear()+"-"+String(m.getMonth()+1).padStart(2,"0");
  return {d:"d"+ds,s:mode==="wk"?"w"+(weekId()-(ago?1:0)):"m"+ms};}
function lbS(){if(!store.lb||typeof store.lb!=="object")store.lb={sc:{},cl:{}};if(!store.lb.sc)store.lb.sc={};if(!store.lb.cl)store.lb.cl={};return store.lb;}
function lbPts(mode,key){const L=lbS();return (L.sc[mode]&&L.sc[mode][key])|0;}
function lbAdd(mode,r){if(!LBM.some(x=>x[0]===mode))return;const st=Math.max(1,r.stake|0),pts=r.winner==="p"?((mode==="rank"||mode==="online")?2+st:3):r.winner==="a"?0:1;if(!pts)return;
  const L=lbS(),k=lbKeys(mode);L.sc[mode]=L.sc[mode]||{};for(const kk of [k.d,k.s])L.sc[mode][kk]=(L.sc[mode][kk]|0)+pts;
  const ks=Object.keys(L.sc[mode]);if(ks.length>8)for(const kk of ks.sort().slice(0,ks.length-8))delete L.sc[mode][kk];}
function lbEnd(mode,key){if(key[0]==="d")return endDay();if(key[0]==="w")return ((+key.slice(1))+1)*7*864e5-3*864e5;const y=+key.slice(1,5),mo=+key.slice(6,8);return new Date(y,mo,1).getTime();}
function lbStart(mode,key){if(key[0]==="d"){const d=new Date();d.setHours(0,0,0,0);return d.getTime();}if(key[0]==="w")return (+key.slice(1))*7*864e5-3*864e5;const y=+key.slice(1,5),mo=+key.slice(6,8);return new Date(y,mo-1,1).getTime();}
function lbBoard(mode,key,cur){const r=srng("lb"+mode+key),max=key[0]==="d"?36:key[0]==="w"?110:420;
  let f=1;if(cur){const a=lbStart(mode,key),b=lbEnd(mode,key);f=Math.min(1,Math.max(.04,(Date.now()-a)/(b-a)));}
  const rows=BOTS.map((n,i)=>{const q=Math.pow(1-i/BOTS.length,1.4)*(.65+.7*r());return {n,v:Math.max(0,Math.round(max*q*(cur?Math.min(1,f*1.1+.05):1)))};});
  rows.push({n:store.name||"Bạn",v:lbPts(mode,key),me:true});rows.sort((a,b)=>b.v-a.v||(a.me?-1:1));return rows;}
function lbTier(kind,rank){return (LBR[kind]||LBR.d).find(t=>rank>=t[0]&&rank<=t[1]);}
function lbPending(){const out=[];for(const [mode] of LBM){const k=lbKeys(mode,true);for(const [kk,kind] of [[k.d,"d"],[k.s,mode==="wk"?"w":"m"]]){const pts=lbPts(mode,kk);if(pts<=0||lbS().cl[mode+"|"+kk])continue;const rows=lbBoard(mode,kk,false),rank=rows.findIndex(x=>x.me)+1,t=lbTier(kind,rank);if(t)out.push({mode,kk,kind,rank,pts,rw:t[2]});}}return out;}
function rwHTML(g){return Object.keys(g).map(k=>`<span class="gf">${icn(k)}${g[k].toLocaleString("vi-VN")}</span>`).join("");}
function renderRank(){const pend=lbPending(),pm=new Set(pend.map(x=>x.mode));
  $("rankModes").innerHTML=LBM.map(([k,n])=>`<button type="button" class="${rkMode===k?"on":""}" data-rm="${k}" role="tab" aria-selected="${rkMode===k}">${n}${pm.has(k)?`<i class="dotr"></i>`:""}</button>`).join("");
  const K=lbKeys(rkMode),key=rkPer==="d"?K.d:K.s,kind=rkPer==="d"?"d":rkMode==="wk"?"w":"m",per2=rkMode==="wk"?"Tuần này":"Mùa tháng "+(new Date().getMonth()+1);
  $("rankPer").innerHTML=`<div class="seg"><button type="button" class="${rkPer==="d"?"on":""}" data-rp="d">Hôm nay</button><button type="button" class="${rkPer!=="d"?"on":""}" data-rp="s">${per2}</button></div>${cdHTML(lbEnd(rkMode,key))}`;
  const rows=lbBoard(rkMode,key,true),me=rows.findIndex(x=>x.me),mt=lbTier(kind,me+1),mypts=rows[me].v;
  let h="";
  for(const x of pend.filter(x=>x.mode===rkMode))h+=`<div class="rkcl"><div class="tx"><b>Thưởng ${x.kind==="d"?"hôm qua":x.kind==="w"?"tuần trước":"mùa trước"}</b><small>Hạng ${x.rank} · ${x.pts} điểm</small><div class="gfs">${rwHTML(x.rw)}</div></div><button type="button" class="btn end" data-rc="${x.mode}|${x.kk}|${x.kind}">Nhận</button></div>`;
  h+=`<div class="rkme"><span class="rkn">${mypts>0?me+1:"–"}</span><span class="tx"><b>${esc(store.name||"Bạn")}</b><small>${mypts>0?`${mypts} điểm · thưởng hiện tại`:"Chơi 1 trận chế độ này để vào bảng"}</small>${mypts>0&&mt?`<span class="gfs">${rwHTML(mt[2])}</span>`:""}</span></div>`;
  h+=`<details class="rkrw"><summary>Phần thưởng ${rkPer==="d"?"cuối ngày":rkMode==="wk"?"cuối tuần":"cuối mùa"}</summary>${(LBR[kind]).map(t=>`<div class="rkt"><b>${t[0]===t[1]?"Hạng "+t[0]:t[1]>999?"Từ hạng "+t[0]:"Hạng "+t[0]+"–"+t[1]}</b><span class="gfs">${rwHTML(t[2])}</span></div>`).join("")}<div class="shn">Điểm: thắng +3, hoà +1${rkMode==="rank"||rkMode==="online"?", thắng ở mức cược cao được thêm điểm":""}. Thưởng nhận ở bảng này sau khi ${rkPer==="d"?"ngày":rkMode==="wk"?"tuần":"mùa"} kết thúc.</div></details>`;
  h+=`<div class="rkl">${rows.slice(0,30).map((r,i)=>`<div class="rk${r.me?" me":""}${i<3?" t"+(i+1):""}"><b>${i+1}</b><span>${esc(r.n)}</span><span>${r.v} điểm</span></div>`).join("")}${me>=30?`<div class="rk me"><b>${me+1}</b><span>${esc(store.name||"Bạn")}</span><span>${mypts} điểm</span></div>`:""}</div><div class="shn">Đối thủ trong bảng hiện là máy mô phỏng cho đến khi có máy chủ xếp hạng.</div>`;
  $("rankBody").innerHTML=h;}
function openRank(){renderRank();$("ovRank").classList.add("on");}
$("rankModes").addEventListener("click",ev=>{const b=ev.target.closest("[data-rm]");if(!b)return;rkMode=b.dataset.rm;SFX.play("tap");renderRank();$("rankBody").scrollTop=0;});
$("rankPer").addEventListener("click",ev=>{const b=ev.target.closest("[data-rp]");if(!b)return;rkPer=b.dataset.rp;SFX.play("tap");renderRank();});
$("rankBody").addEventListener("click",ev=>{const b=ev.target.closest("[data-rc]");if(!b)return;const [mode,kk,kind]=b.dataset.rc.split("|"),L=lbS(),id=mode+"|"+kk;if(L.cl[id])return;const x=lbPending().find(y=>y.mode===mode&&y.kk===kk);if(!x)return;L.cl[id]=1;for(const k in x.rw)store[k]+=x.rw[k];save();showGain("Thưởng xếp hạng",`<div class="gfs big">${rwHTML(x.rw)}</div><div>Hạng ${x.rank} · ${LBM.find(m=>m[0]===mode)[1]}</div>`,"#ffd65a");renderRank();renderLobby();});
/* ảnh đại diện tải lên */
$("avFile").addEventListener("change",ev=>{const f=ev.target.files&&ev.target.files[0];ev.target.value="";if(!f||!/^image\//.test(f.type))return;const rd=new FileReader();
  rd.onload=()=>{const im=new Image();im.onload=()=>{const cv=document.createElement("canvas");cv.width=cv.height=160;const m=Math.min(im.width,im.height),cx=cv.getContext("2d");cx.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,160,160);
    try{store.avImg=cv.toDataURL("image/jpeg",.82);save();$("avMe").innerHTML=meAv();renderLobby();}catch(e){}};im.src=rd.result;};rd.readAsDataURL(f);});
$("btnGift").addEventListener("click",()=>{for(const k of ["gold","up","tok","evp"])store[k]+=99999;save();SFX.play("win");renderLobby();showGain("Tài khoản thử nghiệm",`<div class="big">+99.999</div><div>Vàng, điểm nâng cấp, token và điểm sự kiện</div>`,"#ffd65a");});
$("avClear").addEventListener("click",()=>{store.avImg="";save();$("avMe").innerHTML=meAv();renderLobby();});
let arenaSel=null;
function renderArenaPick(){const ks=Object.keys(ARENAS);if(!arenaSel)arenaSel=store.arena;
  $("arenaBody").innerHTML=`<div class="arbig" style="--ac:${ARENAS[arenaSel][1]};--ac2:${ARENAS[arenaSel][2]}"><img src="${arImg(arenaSel)}" alt=""><span>${ARENAS[arenaSel][0]}</span></div><div class="argrid">${ks.map(k=>{const o=store.arenas.includes(k);return `<button type="button" class="arit${k===arenaSel?" on":""}${o?"":" lock"}${k===store.arena?" eq":""}" data-ar="${k}" style="--ac:${ARENAS[k][1]}"><img src="${arImg(k,1)}" alt="" loading="lazy"><b>${ARENAS[k][0]}</b><small>${k===store.arena?"Đang dùng":o?"Đã có":icn("gold")+ARENAS[k][4]}</small></button>`;}).join("")}</div>`;
  const o=store.arenas.includes(arenaSel),pr=ARENAS[arenaSel][4],b=$("btnArenaUse");
  b.innerHTML=arenaSel===store.arena?"Đang dùng":o?"Dùng sàn này":`Mua ${icn("gold")}${pr}`;b.disabled=arenaSel===store.arena||(!o&&store.gold<pr);}
$("lbMisBtn").addEventListener("click",()=>{SFX.play("tap");renderMis();$("ovMis").classList.add("on");});
$("lbShow").addEventListener("click",()=>{const k=$("lbShow").dataset.k;if(k&&C[k]){SFX.play("tap");openCard(k);}});
$("lbArena").addEventListener("click",()=>{arenaSel=store.arena;renderArenaPick();$("ovArena").classList.add("on");SFX.play("tap");});
$("arenaBody").addEventListener("click",ev=>{const b=ev.target.closest("[data-ar]");if(!b)return;arenaSel=b.dataset.ar;SFX.play("tap");renderArenaPick();});
$("btnArenaUse").addEventListener("click",()=>{const k=arenaSel;if(!store.arenas.includes(k)){const pr=ARENAS[k][4];if(store.gold<pr)return;store.gold-=pr;store.arenas.push(k);SFX.play("win");}store.arena=k;save();renderArenaPick();renderLobby();});
$("btnLobby").addEventListener("click",showLobby);$("btnEndLobby").addEventListener("click",showLobby);
$("lbPlay").addEventListener("click",()=>{SFX.play("tap");playNow();});$("modePlay").addEventListener("click",playNow);
$("lbDeck").addEventListener("click",openDecks);$("lbProfile").addEventListener("click",()=>$("btnProfile").click());
$("lbHelp").addEventListener("click",()=>$("ovHelp").classList.add("on"));
$("lbMute").addEventListener("click",()=>{SFX.play("tap");openSet();});
document.querySelector(".lb-nav").addEventListener("click",ev=>{const b=ev.target.closest("[data-nav]");if(!b)return;SFX.play("tap");if(b.dataset.nav==="col")openCol();else if(b.dataset.nav==="modes")$("ovModes").classList.add("on");else if(b.dataset.nav==="shop")openShop();else if(b.dataset.nav==="rank")openRank();});
function dkClick(ev,fn){const b=ev.target.closest("[data-dk]");if(!b)return;SFX.play("tap");if(b.dataset.dk==="new")newDeck();else fn(+b.dataset.dk);}
$("deckRow").addEventListener("click",ev=>dkClick(ev,openEdit));
$("dkGrid").addEventListener("click",ev=>dkClick(ev,i=>{pendIdx=i;renderDecks();}));
$("btnEditSel").addEventListener("click",()=>openEdit(pendIdx));
$("btnBack").addEventListener("click",()=>{const r=$("bkRow");r.hidden=!r.hidden;$("btnBack").setAttribute("aria-expanded",String(!r.hidden));SFX.play("tap");});
$("bkRow").addEventListener("click",ev=>{const b=ev.target.closest("[data-bk]");if(!b)return;draftB=b.dataset.bk;SFX.play("place");paintBack();});
$("btnEquip").addEventListener("click",()=>{store.cur=pendIdx;store.deck=store.decks[store.cur].ids;save();$("ovDecks").classList.remove("on");renderLobby();});
$("btnDelDeck").addEventListener("click",()=>{if(store.decks.length<2||editIdx>=store.decks.length)return;const b=$("btnDelDeck");if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent="Xoá thật?";setTimeout(()=>{b.dataset.arm="";b.textContent="Xoá";},2500);return;}
  b.dataset.arm="";b.textContent="Xoá";store.decks.splice(editIdx,1);if(store.cur===editIdx)store.cur=0;else if(store.cur>editIdx)store.cur--;store.deck=store.decks[store.cur].ids;save();$("ovDeck").classList.remove("on");renderLobby();});
$("btnSort").addEventListener("click",()=>{renderSort();$("ovSort").classList.add("on");});
$("btnFilt").addEventListener("click",()=>{SFX.play("tap");renderDeck(true);$("ovFilt").classList.add("on");});
$("btnFiltOk").addEventListener("click",()=>{$("ovFilt").classList.remove("on");});
$("btnFiltClr").addEventListener("click",()=>{F.dang="ALL";F.he="ALL";F.cost=0;renderDeck();});
$("railR").addEventListener("click",ev=>{const b=ev.target.closest("[data-rd]");if(!b)return;const k=b.dataset.rd;F.dang=F.dang===k?"ALL":k;SFX.play("tap");renderDeck();});
$("fSum").addEventListener("click",ev=>{const b=ev.target.closest("[data-clr]");if(!b)return;const k=b.dataset.clr;if(k==="cost"||k==="all")F.cost=0;if(k==="dang"||k==="all")F.dang="ALL";if(k==="he"||k==="all")F.he="ALL";SFX.play("tap");renderDeck();});
$("sortDir").addEventListener("click",()=>{store.dir=store.dir===-1?1:-1;save();renderSort();renderDeck();});
$("sortList").addEventListener("click",ev=>{const b=ev.target.closest("[data-sk]");if(!b)return;store.sort=b.dataset.sk;save();SFX.play("tap");renderSort();renderDeck(true);setTimeout(()=>$("ovSort").classList.remove("on"),180);});
$("chipsDang").addEventListener("click",ev=>{const c=ev.target.closest("[data-d]");if(!c)return;F.dang=c.dataset.d;renderDeck();});
$("chipsHe").addEventListener("click",ev=>{const c=ev.target.closest("[data-f]");if(!c)return;F.he=c.dataset.f;renderDeck();});
$("deckCosts").addEventListener("click",ev=>{const c=ev.target.closest("[data-cost]");if(!c)return;const n=+c.dataset.cost;F.cost=F.cost===n?0:n;renderDeck();});
$("deckSearch").addEventListener("input",ev=>{F.text=ev.target.value.trim();renderDeck();});
$("deckList").addEventListener("click",ev=>{
  const r=ev.target.closest("[data-pick]");if(!r)return;const k=r.dataset.pick;
  if(F.col){openCard(k);return;}
  const now=Date.now();
  if(tapK===k&&now-tapT<330){clearTimeout(tapTm);tapK="";
    if(!draft.has(k)&&draft.size<12&&OWN.has(k)){draft.add(k);SFX.play("place");renderDeck(true);const el=document.querySelector('#deckList [data-pick="'+k+'"]');if(el){el.classList.remove("dadd");void el.offsetWidth;el.classList.add("dadd");}}
    else openPick(k);return;}
  tapK=k;tapT=now;clearTimeout(tapTm);SFX.play("tap");tapTm=setTimeout(()=>{tapK="";openPick(k);},300);
});
let tapK="",tapT=0,tapTm=0;
let pickAlt=0;
function openPick(k,alt){if(alt===undefined)pickAlt=0;else pickAlt=alt;F.foc=k;const d0=C[k],LK=[k,...(LINKS[k]||[])],ai=pickAlt%LK.length,sid=LK[ai],d=C[sid],on=draft.has(k),own=OWN.has(k),full=draft.size>=12;
  const btn=on?`<button type="button" class="btn pkrm" data-pk="rm">Bỏ khỏi bộ bài</button>`:!own?`<button type="button" class="btn" disabled>Chưa sở hữu thẻ này</button>`:full?`<button type="button" class="btn" disabled>Bộ bài đã đủ 12 thẻ</button>`:`<button type="button" class="btn end" data-pk="add">Thêm vào bộ bài</button>`;
  const lv=lvl(k),qn=QN[lv]||QN[0],kw=kwfx;
  $("pkBody").innerHTML=`${lv?`<div class="zq" style="--qc:${qn[1]}">${esc(qn[0])} · Cấp ${lv}</div>`:""}<div class="fanw">${fanSides(LK,ai)}<span class="gc${qCls(sid)}" style="--hc:${HC[d.h]};--bk:${backBg()}${qSt(sid)};display:block">${art(sid)}<span class="cst">${d.c}</span><span class="pwh">${d.p}</span><span class="n">${logo(sid)}</span>${bacTag(d)}${lkBtn(ai,LK.length)}${flipBtn()}</span></div>
  <div class="pkt">${sid!==k?"Thẻ liên quan của "+esc(d0.n):esc(HE[d.h]||"")+" · "+esc(DANG[d.t]||"")}</div><div class="zt">${kw(skillText(d))}</div>
  <div class="pkn">Bộ bài: <b>${draft.size}/12</b>${on?" · <span class=\"ok\">đã có trong bộ</span>":""}</div>
  <div class="pka">${btn}<button type="button" class="btn pkfv${store.fav.includes(k)?" on":""}" data-pk="fav" aria-label="Yêu thích" aria-pressed="${store.fav.includes(k)}">★</button></div><button type="button" class="zcl" data-pk="x" aria-label="Đóng">✕</button>`;
  $("ovPick").classList.add("on");}
$("ovPick").addEventListener("click",ev=>{if(ev.target.id==="ovPick"){ev.stopPropagation();$("ovPick").classList.remove("on");}});
$("pkBody").addEventListener("click",ev=>{const lk=ev.target.closest("[data-lk],[data-fan]");if(lk&&F.foc){SFX.play("tap");const n=1+(LINKS[F.foc]||[]).length;openPick(F.foc,(pickAlt+(lk.dataset.lk?1:+lk.dataset.fan)+n)%n);return;}const b=ev.target.closest("[data-pk]");if(!b)return;const k=F.foc,a=b.dataset.pk;
  if(a==="fav"&&k){toggleFav(k);SFX.play("tap");renderDeck(true);openPick(k);return;}
  if(a==="add"&&k&&!draft.has(k)&&draft.size<12&&OWN.has(k)){draft.add(k);SFX.play("place");}
  else if(a==="rm"&&k){draft.delete(k);SFX.play("tap");}
  $("ovPick").classList.remove("on");renderDeck(true);});
$("deckTray").addEventListener("click",ev=>{const r=ev.target.closest("[data-tray]");if(!r)return;SFX.play("tap");openPick(r.dataset.tray);});
$("deckDetail").addEventListener("click",ev=>{const fb=ev.target.closest("[data-fav]");if(fb){toggleFav(fb.dataset.fav);SFX.play("tap");renderDeck(true);return;}const r=ev.target.closest("[data-toggle]");if(!r)return;toggleDraft(r.dataset.toggle);SFX.play("tap");renderDeck(true);});
$("btnRandom").textContent="✨ Đề xuất bộ";
$("btnRandom").addEventListener("click",()=>{
  SFX.play("tap");openRecModal("arch");
});

/* ==================== HỆ THỐNG ĐỀ XUẤT THẺ / BỘ BÀI TỪ DATA & MÃ BỘ BÀI (COPY / PASTE) ==================== */
const B64U="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._";
const ARCHETYPES=[
  {id:"destroy",n:"Tiêu Huỷ Huyết Chiến",c:"#ff5468",re:/tiêu huỷ|bị tiêu huỷ|mộ|hồi sinh/,desc:"Phá huỷ thẻ phe ta để kích hoạt nội tại hồi sinh và nhân sức mạnh từ mộ bài."},
  {id:"move",n:"Dịch Chuyển & Kéo Đẩy",c:"#5ef2d6",re:/di chuyển|dời|kéo|đẩy|thổi|sang chiến địa/,desc:"Linh hoạt đổi làn, kéo thẻ đối phương lệch vị trí và cộng điểm mỗi lần di chuyển."},
  {id:"swarm",n:"Nhân Bản & Triệu Hồi",c:"#7fe8ff",re:/bản sao|sao chép|triệu hồi|nhân bản|thêm .* vào tay|sóc|ảo ảnh/,desc:"Phủ kín 3 chiến địa bằng bóng phân thân, linh thú triệu hồi và hiệu ứng cộng toàn bàn."},
  {id:"discard",n:"Vứt Bỏ Phản Kích",c:"#ff9a3c",re:/vứt bỏ|bị vứt bỏ/,desc:"Chủ động vứt bài trên tay để gọi viện binh miễn phí và cường hoá chủ lực."},
  {id:"ongoing",n:"Duy Trì Hộ Vệ",c:"#ffd65a",re:/duy trì|không thể bị tiêu huỷ|bảo vệ/,t:"on",desc:"Xếp chồng hào quang Duy Trì bền bỉ, che chắn chiến địa và tăng điểm liên tục."},
  {id:"buff",n:"Cường Hoá Sức Mạnh",c:"#7dff96",re:/cường hoá|nhân đôi sức mạnh|\+\d+\s*sức mạnh|tăng .* sức mạnh/,desc:"Dồn chỉ số vượt trội cho thẻ trên tay, trên bàn và bùng nổ sức mạnh cuối trận."},
  {id:"control",n:"Kiểm Soát Khắc Chế",c:"#c984ff",re:/mất kỹ năng|tắt kỹ năng|cướp|khoá|tốn nhiều hơn|−\d+\s*sức mạnh|-\d+\s*sức mạnh|đổi phe/,desc:"Phong ấn kỹ năng, trừ sức mạnh và khoá chiến địa khiến đối thủ không kịp trở tay."}
];
const CARD_TAGS_CACHE={};
function tagsOfCard(id){
  if(CARD_TAGS_CACHE[id])return CARD_TAGS_CACHE[id];
  const d=C[id];if(!d)return CARD_TAGS_CACHE[id]=[];
  const tx=((d.n||"")+" "+(d.x||"")).toLowerCase(),out=[];
  for(const a of ARCHETYPES){if((a.t&&d.t===a.t)||a.re.test(tx))out.push(a.id);}
  return CARD_TAGS_CACHE[id]=out;
}
function encodeDeckCode(ids,name,back){
  const list=(ids||[]).filter(k=>C[k]&&E.COLLECT.includes(k)).slice(0,12);
  if(!list.length)return "";
  let body="";
  for(const k of list){const idx=E.COLLECT.indexOf(k);body+=B64U[(idx>>6)&63]+B64U[idx&63];}
  const bk=BACKS[back]?back:"b0";
  const nm=String(name||"").trim().slice(0,16);
  const nmPart=nm?"-"+btoa(unescape(encodeURIComponent(nm))).replace(/\+/g,".").replace(/\//g,"_").replace(/=+$/,""):"";
  return `LTTD1-${bk}-${body}${nmPart}`;
}
function decodeDeckCode(raw){
  const s=String(raw||"").trim();
  if(!s)return {ok:false,err:"Chưa có mã bộ bài."};
  const m=s.match(/LTTD1-([A-Za-z0-9_]+)-([A-Za-z0-9._]{2,24})(?:-([A-Za-z0-9._\-]+))?/);
  if(m){
    const bk=BACKS[m[1]]?m[1]:"b0",code=m[2];
    if(code.length%2!==0)return {ok:false,err:"Mã bộ bài bị thiếu ký tự."};
    const ids=[];
    for(let i=0;i<code.length&&ids.length<12;i+=2){
      const hi=B64U.indexOf(code[i]),lo=B64U.indexOf(code[i+1]);
      if(hi<0||lo<0)return {ok:false,err:"Mã chứa ký tự không hợp lệ."};
      const k=E.COLLECT[(hi<<6)|lo];
      if(k&&C[k]&&!ids.includes(k))ids.push(k);
    }
    let name="";
    if(m[3]){try{const b64=m[3].replace(/[.]/g,"+").replace(/-/g,"+").replace(/_/g,"/");name=decodeURIComponent(escape(atob(b64))).slice(0,16);}catch(e){}}
    if(!ids.length)return {ok:false,err:"Không tìm thấy thẻ hợp lệ trong mã."};
    return {ok:true,ids,name:name||"Bộ bài nhập mã",back:bk};
  }
  /* Hỗ trợ dán danh sách ID hoặc tên thẻ cách nhau bởi dấu phẩy / xuống dòng */
  const parts=s.split(/[,;\n|]+/).map(x=>x.trim()).filter(Boolean);
  const ids=[];
  for(const p of parts){
    if(C[p]&&E.COLLECT.includes(p)&&!ids.includes(p)){ids.push(p);continue;}
    const pn=norm(p);
    const hit=E.COLLECT.find(k=>!ids.includes(k)&&(k===pn||norm(C[k].n)===pn));
    if(hit)ids.push(hit);
    if(ids.length>=12)break;
  }
  if(ids.length>=1)return {ok:true,ids,name:"Bộ bài nhập mã",back:"b0"};
  return {ok:false,err:"Mã không đúng định dạng LTTD1-... hoặc tên thẻ."};
}

function recommendCardsForSet(curIds,limit){
  const cur=new Set(curIds||[]),own=[...OWN].filter(k=>C[k]&&!cur.has(k));
  const tagCnt={},heCnt={},tCnt={},costCnt=[0,0,0,0,0,0,0];
  for(const k of cur){
    const d=C[k];if(!d)continue;
    heCnt[d.h]=(heCnt[d.h]||0)+1;tCnt[d.t]=(tCnt[d.t]||0)+1;
    costCnt[Math.max(1,Math.min(6,d.c||1))]++;
    for(const tg of tagsOfCard(k))tagCnt[tg]=(tagCnt[tg]||0)+1;
  }
  const want=[0,2,3,3,2,1,1];
  const topTag=Object.entries(tagCnt).sort((a,b)=>b[1]-a[1])[0];
  const scored=own.map(k=>{
    const d=C[k],bc=Math.max(1,Math.min(6,d.c||1)),tgs=tagsOfCard(k);
    let sc=(d.p||0)*0.35+(lvl(k)||0)*0.4;
    let reason="";
    for(const tg of tgs){
      if(tagCnt[tg]){sc+=tagCnt[tg]*3.4;if(!reason){const a=ARCHETYPES.find(x=>x.id===tg);if(a)reason="Hợp "+a.n.split(" ")[0]+" "+a.n.split(" ")[1];}}
    }
    if(costCnt[bc]<want[bc]){sc+=(want[bc]-costCnt[bc])*2.5;if(!reason)reason=`Bù mốc ${d.c}⚡`;}
    else if(costCnt[bc]>want[bc]+1)sc-=2.2;
    if(heCnt[d.h]){sc+=Math.min(3,heCnt[d.h])*0.9;if(!reason)reason="Cùng "+(HE[d.h]||d.h);}
    if(tCnt[d.t]>=2){sc+=1.1;if(!reason)reason="Cùng hệ "+(DANG[d.t]||"");}
    if(!cur.size){
      sc+=tgs.length*1.6+(d.c>=1&&d.c<=4?1.8:0.8);
      reason=tgs.length?(ARCHETYPES.find(x=>x.id===tgs[0])||{}).n||"Đa dụng":"Chỉ số tốt";
    }
    return {id:k,sc,reason:reason||"Cân bằng năng lượng",topTag:topTag?topTag[0]:""};
  });
  scored.sort((a,b)=>b.sc-a.sc||C[a.id].c-C[b.id].c);
  return scored.slice(0,limit||12);
}

function fillDeckSmart(seedIds){
  const res=(seedIds||[]).filter(k=>C[k]&&OWN.has(k)).slice(0,12);
  while(res.length<12){
    const next=recommendCardsForSet(res,1)[0];
    if(!next)break;
    res.push(next.id);
  }
  return res.sort((a,b)=>C[a].c-C[b].c||C[a].p-C[b].p);
}

function buildArchetypeDeck(archId){
  const a=ARCHETYPES.find(x=>x.id===archId)||ARCHETYPES[0];
  const own=[...OWN].filter(k=>C[k]);
  const core=own.filter(k=>tagsOfCard(k).includes(a.id)).sort((x,y)=>(C[y].p-C[x].p)||(C[x].c-C[y].c));
  const want=[0,2,3,3,2,1,1],picked=[],cc=[0,0,0,0,0,0,0];
  for(const k of core){
    if(picked.length>=9)break;
    const bc=Math.max(1,Math.min(6,C[k].c||1));
    if(cc[bc]<want[bc]+1){picked.push(k);cc[bc]++;}
  }
  for(const k of core){if(picked.length>=10)break;if(!picked.includes(k))picked.push(k);}
  return fillDeckSmart(picked);
}

function buildHeOrTypeDeck(kind,val){
  const own=[...OWN].filter(k=>C[k]);
  const pool=own.filter(k=>kind==="he"?C[k].h===val:C[k].t===val);
  const want=[0,2,3,3,2,1,1],picked=[];
  for(let b=1;b<=6;b++){
    const fit=pool.filter(k=>Math.max(1,Math.min(6,C[k].c||1))===b&&!picked.includes(k)).sort((x,y)=>C[y].p-C[x].p);
    for(let i=0;i<want[b]&&i<fit.length;i++)picked.push(fit[i]);
  }
  for(const k of pool){if(picked.length>=12)break;if(!picked.includes(k))picked.push(k);}
  return fillDeckSmart(picked);
}

function syncDeckToolsUI(){
  const tools=$("deckTools"),strip=$("recInline");
  if(!tools||!strip)return;
  if(F.col){tools.hidden=true;strip.hidden=true;return;}
  tools.hidden=false;
  const fillBtn=$("btnAutoFill");
  if(fillBtn)fillBtn.disabled=draft.size>=12;
  if(draft.size>=12){strip.hidden=true;strip.innerHTML="";return;}
  const recs=recommendCardsForSet([...draft],6);
  if(!recs.length){strip.hidden=true;return;}
  if(typeof spLoad==="function")for(const r of recs)spLoad(r.id);
  strip.hidden=false;
  strip.innerHTML=`<div class="rs-hd"><span>✨ Đề xuất cho bộ đang xếp (${draft.size}/12):</span><small>Chạm thẻ để thêm nhanh</small></div><div class="rs-row">${recs.map(r=>{const d=C[r.id];return `<button type="button" class="rs-it" data-radd="${r.id}" style="--hc:${HC[d.h]}"><span class="rs-c">${d.c}</span><span class="rs-p">${d.p}</span>${art(r.id)}<b>${esc(d.n)}</b><i>${esc(r.reason)}</i></button>`;}).join("")}</div>`;
  if(typeof spWatch==="function")spWatch(strip);
}
{const _rdOrig=renderDeck;renderDeck=function(){_rdOrig.apply(this,arguments);try{syncDeckToolsUI();}catch(e){}};}

let recTab="card";
const REC_PRESETS_CACHE={};
function openRecModal(defaultTab){
  recTab=defaultTab||(!F.col&&$("ovDeck").classList.contains("on")&&draft.size>0&&draft.size<12?"card":"arch");
  renderRecModal();
  $("ovRec").classList.add("on");
}
function applyRecommendedDeck(ids,name){
  const valid=ids.filter(k=>C[k]&&OWN.has(k)).slice(0,12);
  if(valid.length<12)return;
  if($("ovDeck").classList.contains("on")&&!F.col){
    draft=new Set(valid);
    if(name)$("deckName").value=name.slice(0,16);
    $("ovRec").classList.remove("on");
    SFX.play("win");
    renderDeck(true);
    toast("Đã nạp bộ bài đề xuất vào khay sửa!");
    return;
  }
  if(store.decks.length<12){
    store.decks.push({n:(name||"Bộ đề xuất").slice(0,16),ids:valid,b:store.back||"b0"});
    pendIdx=store.decks.length-1;
  }else{
    store.decks[pendIdx]={n:(name||"Bộ đề xuất").slice(0,16),ids:valid,b:dBack(store.decks[pendIdx])};
  }
  store.cur=pendIdx;store.deck=store.decks[store.cur].ids;save();
  $("ovRec").classList.remove("on");
  if($("ovDecks").classList.contains("on"))renderDecks();
  renderLobby();SFX.play("win");
  toast("Đã tạo & trang bị: "+(name||"Bộ đề xuất"));
}
function renderRecModal(){
  $("recTabs").querySelectorAll("[data-rt]").forEach(b=>b.classList.toggle("on",b.dataset.rt===recTab));
  const body=$("recBody");
  if(recTab==="card"){
    const baseIds=($("ovDeck").classList.contains("on")&&!F.col)?[...draft]:(store.decks[pendIdx]?store.decks[pendIdx].ids:store.deck);
    const editing=$("ovDeck").classList.contains("on")&&!F.col;
    const seed=editing?baseIds:baseIds.slice(0,6);
    const recs=recommendCardsForSet(editing?baseIds:[],12);
    if(typeof spLoad==="function")for(const r of recs)spLoad(r.id);
    const curve=[1,2,3,4,5,6].map(c=>{const n=(editing?baseIds:[]).filter(k=>Math.max(1,Math.min(6,C[k].c))===c).length;return `<span class="rc-cv"><b>${c===6?"6+":c}⚡</b><i>${n}</i></span>`;}).join("");
    let h=`<div class="rc-box"><div class="rc-top"><div><b>${editing?`Đang xếp: ${baseIds.length}/12 thẻ`:"Gợi ý thẻ mạnh trong kho bài"}</b><small>${editing?(baseIds.length<12?`Còn thiếu ${12-baseIds.length} thẻ — hệ thống phân tích kỹ năng & đường cong năng lượng để đề xuất:`:"Bộ bài đã đủ 12/12 thẻ. Bấm bớt thẻ trên khay nếu muốn thay thẻ mới."):"Mở Sửa bộ bài để thêm từng thẻ trực tiếp, hoặc bấm Đổi sang tab Chiến thuật để lấy trọn bộ 12 thẻ."}</small></div>${editing&&baseIds.length<12?`<button type="button" class="btn end rc-fill" data-rfill="1">⚡ Bù đủ 12 thẻ</button>`:""}</div>${editing?`<div class="rc-curve">${curve}</div>`:""}</div>`;
    h+=`<div class="rc-cgrid">${recs.map(r=>{const d=C[r.id],canAdd=editing&&baseIds.length<12&&!draft.has(r.id);return `<div class="rc-card" style="--hc:${HC[d.h]}"><div class="rc-cw" data-rview="${r.id}">${cardGC(r.id," mini")}</div><div class="rc-info"><b>${esc(d.n)}</b><span class="rc-tag">${esc(r.reason)}</span><p>${kwfx(esc(skillText(d)))}</p>${canAdd?`<button type="button" class="ib hi" data-rmadd="${r.id}">＋ Thêm vào bộ</button>`:editing&&draft.has(r.id)?`<span class="rc-in">Đã có</span>`:""}</div></div>`;}).join("")}</div>`;
    body.innerHTML=h;if(typeof spWatch==="function")spWatch(body);return;
  }
  if(recTab==="arch"){
    let h=`<div class="rc-lead">Phân tích trực tiếp từ dữ liệu kỹ năng của <b>${OWN.size}</b> thẻ bạn đang sở hữu để dựng bộ 12 thẻ chuẩn đường cong năng lượng:</div>`;
    for(const a of ARCHETYPES){
      const ids=buildArchetypeDeck(a.id);
      if(typeof spLoad==="function")for(const k of ids)spLoad(k);
      REC_PRESETS_CACHE["a_"+a.id]={ids,n:a.n.slice(0,16)};
      const avg=(ids.reduce((s,k)=>s+(C[k].c||0),0)/Math.max(1,ids.length)).toFixed(1);
      h+=`<div class="rc-dk" style="--rc:${a.c}"><div class="rc-dkh"><div><b>${esc(a.n)}</b><small>TB ${avg}⚡ · 12 thẻ phối hợp</small></div><div class="rc-dka"><button type="button" class="ib alt" data-rcopy="a_${a.id}">📋 Mã</button><button type="button" class="ib hi" data-ruse="a_${a.id}">Dùng bộ này</button></div></div><p class="rc-dkd">${esc(a.desc)}</p><div class="tray rc-tray">${miniTray(ids)}</div></div>`;
    }
    body.innerHTML=h;if(typeof spWatch==="function")spWatch(body);return;
  }
  /* Tab Theo Hệ / Bậc & Dạng Kỹ Năng */
  let h=`<div class="rc-lead">Bộ bài đề xuất theo từng <b>Hệ / Bậc thẻ (HE)</b> và <b>Dạng kỹ năng</b> từ kho thẻ hiện có:</div>`;
  const groups=[
    ...["KD","C1","TB","S1","S2","S3","S4","S5"].filter(hk=>HE[hk]&&[...OWN].some(k=>C[k]&&C[k].h===hk)).map(hk=>({key:"h_"+hk,kind:"he",val:hk,title:"Hệ "+(HE[hk]||hk),col:HC[hk]||"#7fe8ff",desc:`Ưu tiên các thẻ chủ lực thuộc ${HE[hk]||hk}, kết hợp thẻ bổ trợ cân bằng năng lượng 1–6.`})),
    ...["rev","on","act"].map(tk=>({key:"t_"+tk,kind:"t",val:tk,title:"Chuyên "+DANG[tk],col:"#ffd65a",desc:`Tập trung tối đa vào cơ chế ${DANG[tk]} để tối ưu chiến địa và chuỗi combo.`}))
  ];
  for(const g of groups){
    const ids=buildHeOrTypeDeck(g.kind,g.val);
    if(typeof spLoad==="function")for(const k of ids)spLoad(k);
    REC_PRESETS_CACHE[g.key]={ids,n:g.title.slice(0,16)};
    const cntMatch=ids.filter(k=>g.kind==="he"?C[k].h===g.val:C[k].t===g.val).length;
    h+=`<div class="rc-dk" style="--rc:${g.col}"><div class="rc-dkh"><div><b>${esc(g.title)}</b><small>${cntMatch}/12 thẻ đúng hệ</small></div><div class="rc-dka"><button type="button" class="ib alt" data-rcopy="g_${g.key}">📋 Mã</button><button type="button" class="ib hi" data-ruse="${g.key}">Dùng bộ này</button></div></div><p class="rc-dkd">${esc(g.desc)}</p><div class="tray rc-tray">${miniTray(ids)}</div></div>`;
  }
  body.innerHTML=h;if(typeof spWatch==="function")spWatch(body);
}

/* ---- Hộp thoại Sao chép / Dán mã bộ bài (#ovCode) ---- */
let parsedCodeDeck=null;
function copyTextSafe(str){
  if(!str)return;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(str).then(()=>toast("Đã sao chép mã bộ bài!")).catch(()=>fallbackCopyInput(str));
  }else fallbackCopyInput(str);
}
function fallbackCopyInput(str){
  const inp=$("outDeckCode");
  if(inp){inp.value=str;inp.focus();inp.select();try{document.execCommand("copy");toast("Đã sao chép mã bộ bài!");}catch(e){}}
}
function openCodeModal(srcIds,srcName,srcBack,focusPaste){
  const ids=(srcIds&&srcIds.length)?srcIds:(store.decks[pendIdx]?store.decks[pendIdx].ids:store.deck);
  const nm=srcName||(store.decks[pendIdx]?store.decks[pendIdx].n:"Bộ bài");
  const bk=srcBack||(store.decks[pendIdx]?dBack(store.decks[pendIdx]):"b0");
  const code=encodeDeckCode(ids,nm,bk);
  $("outDeckCode").value=code;
  $("codeOutWrap").hidden=!code;
  $("inDeckCode").value="";
  parsedCodeDeck=null;
  renderCodePreview();
  $("ovCode").classList.add("on");
  if(focusPaste)setTimeout(()=>$("inDeckCode").focus(),60);
  else if(code)copyTextSafe(code);
}
function renderCodePreview(){
  const raw=$("inDeckCode").value.trim(),pv=$("codePreview"),bAp=$("btnCodeApply"),bNw=$("btnCodeNewDeck");
  if(!raw){parsedCodeDeck=null;pv.innerHTML=`<div class="cp-empty">Dán mã <b>LTTD1-...</b> vào ô trên để xem trước 12 thẻ bài và nạp vào kho bộ bài.</div>`;bAp.disabled=true;bNw.disabled=true;return;}
  const res=decodeDeckCode(raw);
  if(!res.ok){parsedCodeDeck=null;pv.innerHTML=`<div class="cp-err">⚠ ${esc(res.err)}</div>`;bAp.disabled=true;bNw.disabled=true;return;}
  const ownIds=res.ids.filter(k=>OWN.has(k)),missIds=res.ids.filter(k=>!OWN.has(k));
  const finalIds=ownIds.length===12?ownIds:fillDeckSmart(ownIds);
  if(typeof spLoad==="function")for(const k of finalIds)spLoad(k);
  parsedCodeDeck={ids:finalIds,rawIds:res.ids,ownCnt:ownIds.length,missIds,name:res.name,back:res.back};
  bAp.disabled=finalIds.length!==12;
  bNw.disabled=finalIds.length!==12||store.decks.length>=12;
  pv.innerHTML=`<div class="cp-ok"><b>${esc(res.name)}</b> · Đọc được <b>${res.ids.length}</b> thẻ (${ownIds.length}/${res.ids.length} thẻ đã sở hữu)${missIds.length?`<small class="cp-warn">Thiếu ${missIds.length} thẻ chưa mở (${missIds.map(k=>esc(C[k].n)).join(", ")}) → tự động bù thẻ phối hợp tương đương để đủ 12/12!</small>`:res.ids.length<12?`<small class="cp-warn">Mã có ${res.ids.length} thẻ → tự động bù đủ 12/12 thẻ phối hợp!</small>`:""}</div><div class="tray">${miniTray(finalIds)}</div>`;
  if(typeof spWatch==="function")spWatch(pv);
}

if($("btnRecOpen"))$("btnRecOpen").addEventListener("click",()=>{SFX.play("tap");openRecModal("card");});
if($("btnRecDecks"))$("btnRecDecks").addEventListener("click",()=>{SFX.play("tap");openRecModal("arch");});
if($("btnAutoFill"))$("btnAutoFill").addEventListener("click",()=>{
  if(F.col||draft.size>=12)return;
  draft=new Set(fillDeckSmart([...draft]));SFX.play("win");renderDeck(true);toast("Đã tự động bù đủ 12/12 thẻ phối hợp!");
});
if($("recInline"))$("recInline").addEventListener("click",ev=>{
  const b=ev.target.closest("[data-radd]");if(!b)return;
  const k=b.dataset.radd;if(!F.col&&draft.size<12&&OWN.has(k)&&!draft.has(k)){draft.add(k);SFX.play("place");renderDeck(true);}
});
if($("recTabs"))$("recTabs").addEventListener("click",ev=>{
  const b=ev.target.closest("[data-rt]");if(!b)return;recTab=b.dataset.rt;SFX.play("tap");renderRecModal();$("recBody").scrollTop=0;
});
if($("recBody"))$("recBody").addEventListener("click",ev=>{
  const bf=ev.target.closest("[data-rfill]");
  if(bf){draft=new Set(fillDeckSmart([...draft]));SFX.play("win");renderDeck(true);renderRecModal();toast("Đã bù đủ 12/12 thẻ!");return;}
  const ba=ev.target.closest("[data-rmadd]");
  if(ba){const k=ba.dataset.rmadd;if(draft.size<12&&OWN.has(k)&&!draft.has(k)){draft.add(k);SFX.play("place");renderDeck(true);renderRecModal();}return;}
  const bv=ev.target.closest("[data-rview]");
  if(bv){SFX.play("tap");openPick(bv.dataset.rview);return;}
  const bc=ev.target.closest("[data-rcopy]");
  if(bc){const key=bc.dataset.rcopy.replace(/^g_/,""),pr=REC_PRESETS_CACHE[key];if(pr){SFX.play("tap");copyTextSafe(encodeDeckCode(pr.ids,pr.n,"b0"));}return;}
  const bu=ev.target.closest("[data-ruse]");
  if(bu){const pr=REC_PRESETS_CACHE[bu.dataset.ruse];if(pr)applyRecommendedDeck(pr.ids,pr.n);}
});

if($("btnCopyDraft"))$("btnCopyDraft").addEventListener("click",()=>{
  SFX.play("tap");openCodeModal([...draft],$("deckName").value.trim()||"Bộ đang sửa",draftB,false);
});
if($("btnPasteDraft"))$("btnPasteDraft").addEventListener("click",()=>{
  SFX.play("tap");openCodeModal([...draft],$("deckName").value.trim()||"Bộ đang sửa",draftB,true);
});
if($("btnCopySel"))$("btnCopySel").addEventListener("click",()=>{
  const d=store.decks[pendIdx];if(!d)return;SFX.play("tap");openCodeModal(d.ids,d.n,dBack(d),false);
});
if($("btnPasteOpen"))$("btnPasteOpen").addEventListener("click",()=>{
  const d=store.decks[pendIdx];SFX.play("tap");openCodeModal(d?d.ids:store.deck,d?d.n:"Bộ bài",d?dBack(d):"b0",true);
});
if($("btnDoCopyCode"))$("btnDoCopyCode").addEventListener("click",()=>{SFX.play("tap");copyTextSafe($("outDeckCode").value);});
if($("inDeckCode"))$("inDeckCode").addEventListener("input",renderCodePreview);
if($("btnClearCode"))$("btnClearCode").addEventListener("click",()=>{$("inDeckCode").value="";renderCodePreview();});
if($("btnReadClip"))$("btnReadClip").addEventListener("click",async()=>{
  SFX.play("tap");
  if(navigator.clipboard&&navigator.clipboard.readText){
    try{const tx=await navigator.clipboard.readText();if(tx){$("inDeckCode").value=tx.trim();renderCodePreview();return;}}catch(e){}
  }
  $("inDeckCode").focus();toast("Hãy nhấn giữ / Ctrl+V vào ô để dán mã");
});
if($("btnCodeApply"))$("btnCodeApply").addEventListener("click",()=>{
  if(!parsedCodeDeck||parsedCodeDeck.ids.length!==12)return;
  if($("ovDeck").classList.contains("on")&&!F.col){
    draft=new Set(parsedCodeDeck.ids);
    if(parsedCodeDeck.name)$("deckName").value=parsedCodeDeck.name.slice(0,16);
    if(BACKS[parsedCodeDeck.back]&&(store.backs.includes(parsedCodeDeck.back)||parsedCodeDeck.back==="b0")){draftB=parsedCodeDeck.back;paintBack();}
    $("ovCode").classList.remove("on");SFX.play("win");renderDeck(true);toast("Đã dán mã bộ bài vào khay sửa!");
    return;
  }
  const idx=$("ovDecks").classList.contains("on")?pendIdx:store.cur;
  store.decks[idx]={n:(parsedCodeDeck.name||"Bộ nhập mã").slice(0,16),ids:parsedCodeDeck.ids.slice(0,12),b:dBack(store.decks[idx])};
  store.cur=idx;store.deck=store.decks[store.cur].ids;save();
  $("ovCode").classList.remove("on");if($("ovDecks").classList.contains("on"))renderDecks();renderLobby();SFX.play("win");toast("Đã nạp & trang bị bộ bài từ mã!");
});
if($("btnCodeNewDeck"))$("btnCodeNewDeck").addEventListener("click",()=>{
  if(!parsedCodeDeck||parsedCodeDeck.ids.length!==12||store.decks.length>=12)return;
  store.decks.push({n:(parsedCodeDeck.name||"Bộ mới "+(store.decks.length+1)).slice(0,16),ids:parsedCodeDeck.ids.slice(0,12),b:store.back||"b0"});
  pendIdx=store.decks.length-1;store.cur=pendIdx;store.deck=store.decks[store.cur].ids;save();
  $("ovCode").classList.remove("on");if($("ovDeck").classList.contains("on"))$("ovDeck").classList.remove("on");
  if($("ovDecks").classList.contains("on"))renderDecks();renderLobby();SFX.play("win");toast("Đã tạo & trang bị bộ bài mới từ mã!");
});
$("btnSaveDeck").addEventListener("click",()=>{if(draft.size!==12)return;store.decks[editIdx]={n:($("deckName").value.trim()||"Bộ bài "+(editIdx+1)).slice(0,16),ids:[...draft],b:draftB};store.deck=store.decks[store.cur].ids;save();$("ovDeck").classList.remove("on");renderLobby();});
$("btnProfile").addEventListener("click",()=>{$("inName").value=store.name;renderProfile();$("ovProfile").classList.add("on");});
$("inName").addEventListener("input",ev=>{store.name=ev.target.value.trim().slice(0,12);save();render();renderLobby();});
$("avGrid").addEventListener("click",ev=>{const b=ev.target.closest("[data-av]");if(!b)return;store.avatar=b.dataset.av;store.avImg="";save();$("avMe").innerHTML=meAv();SFX.play("tap");renderProfile();renderLobby();});
$("btnAgain").addEventListener("click",()=>{if(G&&G.mode)openModeHub(G.mode.k);else{newGame();runMatchIntro("LƯỢT 1/6","",true);}});
document.addEventListener("click",ev=>{const o=ev.target.closest(".ov");if(o&&(ev.target===o||ev.target.closest("[data-close]")))o.classList.remove("on");});

$("avMe").innerHTML=meAv();
function start(data){
  if(data&&data.G&&data.G.phase==="play"&&Array.isArray(data.G.locs)&&data.G.cnt&&data.G.evs){G=data.G;$("avFoe").innerHTML=artFace(foeAv);G.msg=turnMsg();resetTimer(false);render();}
  else newGame();
  renderLobby();
}
try{window.claude&&window.claude.hot&&window.claude.hot.snapshot&&window.claude.hot.snapshot(()=>({G:G&&G.phase==="play"?G:null}));}catch(e){}
if(window.claude&&window.claude.hot&&window.claude.hot.ready)window.claude.hot.ready(start);
else start((window.claude&&window.claude.hot&&window.claude.hot.data)||{});
window.UI={get G(){return G;},render,newGame,get t(){return tLeft;},set t(v){tLeft=v;},get armed(){return tArmed;}};
