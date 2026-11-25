/* Module 14: Hộp thư, thông báo, giftcode, ping, hộp báo khoá tài khoản (dùng API máy chủ của quản trị).
   Phụ thuộc: window.LTD_CF (10-online-cf.js: on, base, token, api, logout), store/grant/save/C/HE/esc/toast/SFX (03, 07). */
(function(){
"use strict";
var CF=window.LTD_CF;
var LSX=null;try{LSX=window.localStorage;}catch(e){}
function $g(id){return document.getElementById(id);}
function on(){return !!(CF&&CF.on&&CF.token&&typeof CF.api==="function");}
function calm(){return document.body.classList.contains("rm")||window.FXLV===0;}
function sfx(n,v){try{if(window.SFX)SFX.play(n,v);}catch(e){}}
function say(m,ms){try{toast(m,ms);}catch(e){}}
function mk(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}

/* ---------- nhớ thư/mã đã nhận (chống cộng trùng) ----------
   03-data-store.js chỉ nạp lại các khoá store đã biết, nên mailGot/codeGot còn được nhân bản ở localStorage "ltd.hth.got" và gộp lại khi mở game. */
var GOT_KEY="ltd.hth.got";
function gotMerge(a,b,max){var o=[];(a||[]).concat(b||[]).forEach(function(x){x=String(x);if(o.indexOf(x)<0)o.push(x);});return o.slice(-max);}
(function(){var g={};try{g=JSON.parse(LSX.getItem(GOT_KEY)||"{}")||{};}catch(e){}
  store.mailGot=gotMerge(Array.isArray(store.mailGot)?store.mailGot:[],g.mail,500);
  store.codeGot=gotMerge(Array.isArray(store.codeGot)?store.codeGot:[],g.code,200);})();
function gotSave(){try{LSX.setItem(GOT_KEY,JSON.stringify({mail:store.mailGot,code:store.codeGot}));}catch(e){}}

/* ---------- phần thưởng ---------- */
function nInt(x){x=Math.floor(+x);return x>0&&x<1e9?x:0;}
function normRw(r){r=r&&typeof r==="object"?r:{};
  return {vang:nInt(r.vang),ngoc:nInt(r.ngoc),token:nInt(r.token),diem:nInt(r.diem),the:(Array.isArray(r.the)?r.the:[]).filter(function(k){return typeof k==="string"&&C[k]&&(typeof E==="undefined"||!E.COLLECT||E.COLLECT.includes(k));})};}
function hasRw(r){r=normRw(r);return !!(r.vang||r.ngoc||r.token||r.diem||r.the.length);}
function tierOf(k){var h=C[k]&&C[k].h;return /^S\d$/.test(h||"")&&HE[h]?" · Thẻ "+HE[h]:"";}
function chips(r,withTier){r=normRw(r);var o=[];
  if(r.vang)o.push("+"+r.vang+" vàng");if(r.ngoc)o.push("+"+r.ngoc+" ngọc");if(r.token)o.push("+"+r.token+" token");if(r.diem)o.push("+"+r.diem+" điểm nâng cấp");
  r.the.forEach(function(k){o.push(C[k].n+(withTier?tierOf(k):""));});return o;}
function addRw(a,b){a=normRw(a);b=normRw(b);return {vang:a.vang+b.vang,ngoc:a.ngoc+b.ngoc,token:a.token+b.token,diem:a.diem+b.diem,the:a.the.concat(b.the)};}
/* cộng thật vào store; trả về các thẻ đã có sẵn (không cộng lần nữa) */
function applyRw(r){r=normRw(r);var dup=[];
  store.gold+=r.vang;store.gems+=r.ngoc;store.tok+=r.token;store.up+=r.diem;
  r.the.forEach(function(k){if(!grant(k))dup.push(k);});
  try{save();}catch(e){}try{renderLobby();}catch(e){}
  return dup;}
function remember(arr,v,max){if(arr.indexOf(v)<0){arr.push(v);if(arr.length>max)arr.splice(0,arr.length-max);}gotSave();}

/* ---------- ngày giờ (giờ Việt Nam) ---------- */
function toDate(v){if(v==null||v==="")return null;var d;
  if(typeof v==="number")d=new Date(v<1e12?v*1000:v);else if(/^\d+$/.test(String(v)))d=new Date(+v<1e12?+v*1000:+v);else d=new Date(String(v).replace(" ","T")+(/[zZ]|[+-]\d\d:?\d\d$/.test(String(v))?"":"Z"));
  return isNaN(d)?null:d;}
function fmtDay(v){var d=toDate(v);return d?d.toLocaleDateString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",day:"2-digit",month:"2-digit",year:"numeric"}):"";}
function fmtDT(v){var d=toDate(v);return d?d.toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit",year:"numeric"}):"";}

/* ---------- khung lớp phủ dùng chung ---------- */
function ovMake(id,title,cls){var o=$g(id);if(o)return o;
  o=mk("div","ov");o.id=id;var p=mk("div","panel hth-p "+(cls||""));var h=mk("h2",null,title);h.style.textAlign="center";
  var b=mk("div","body");var f=mk("div","foot");p.appendChild(h);p.appendChild(b);p.appendChild(f);o.appendChild(p);document.body.appendChild(o);
  o.addEventListener("click",function(ev){if(ev.target===o||ev.target.closest("[data-close]")){sfx("tap");o.classList.remove("on");}});
  return o;}

/* ---------- 1. PING ---------- */
var P={t:0,last:0};
function platform(){try{var C0=window.Capacitor;if(C0&&(typeof C0.isNativePlatform==="function"?C0.isNativePlatform():!!C0.isNative))return "apk";}catch(e){}
  if(location.protocol==="capacitor:"||location.origin==="https://localhost")return "apk";
  try{if(window.self!==window.top)return "tester";}catch(e){return "tester";}return "web";}
function ping(){if(!on())return;P.last=Date.now();
  CF.api("POST","/api/ping",{v:String(window.LTD_VER||"?"),platform:platform()},{keep:true}).catch(function(){});}
function pingStart(){clearInterval(P.t);P.t=0;if(document.visibilityState!=="visible"||!on())return;
  if(Date.now()-P.last>=290000)ping();
  P.t=setInterval(function(){if(document.visibilityState==="visible")ping();},300000);}
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")pingStart();else{clearInterval(P.t);P.t=0;}});

/* ---------- 2. THÔNG BÁO ---------- */
var A={items:[],i:0,t:0,rot:0,at:0};
function hidGet(){try{return JSON.parse(LSX.getItem("ltd.annHid")||"[]").map(String);}catch(e){return [];}}
function hidAdd(id){var h=hidGet();id=String(id);if(h.indexOf(id)<0){h.push(id);try{LSX.setItem("ltd.annHid",JSON.stringify(h.slice(-300)));}catch(e){}}}
function annVis(){var h=hidGet();return A.items.filter(function(x){return h.indexOf(String(x.id))<0;});}
function lvOf(x){return x.level==="warn"||x.level==="event"?x.level:"info";}
function annPaint(){var el=$g("hthAnn");if(!el)return;var v=annVis();
  if(!v.length){el.hidden=true;return;}
  if(A.i>=v.length)A.i=0;var x=v[A.i];el.hidden=false;el.className="hth-ann lv-"+lvOf(x);
  $g("hthTx").textContent=String(x.text||"");
  $g("hthAt").setAttribute("aria-label","Thông báo "+(A.i+1)+" trên "+v.length+": "+String(x.text||"")+". Chạm để xem đầy đủ");}
function annRot(){clearInterval(A.rot);A.rot=0;if(annVis().length>1&&!calm())A.rot=setInterval(function(){A.i++;annPaint();},6000);}
function annLoad(force){if(!CF||!CF.on||!CF.base)return;if(!force&&Date.now()-A.at<60000)return;A.at=Date.now();
  fetch(CF.base+"/api/announce").then(function(r){return r.ok?r.json():null;}).then(function(j){
    if(!j||!Array.isArray(j.items))return;
    A.items=j.items.filter(function(x){return x&&x.id!=null&&x.text;}).map(function(x){return {id:x.id,text:String(x.text),level:x.level};});
    A.i=0;annPaint();annRot();}).catch(function(){});}
function annOpen(){var v=annVis();if(!v.length)return;sfx("tap");
  var o=ovMake("hthAnnOv","Thông báo");var b=o.querySelector(".body"),f=o.querySelector(".foot");b.textContent="";f.textContent="";
  v.forEach(function(x){var row=mk("div","hth-ai2 lv-"+lvOf(x));row.appendChild(mk("p","hth-at2",String(x.text)));
    var bt=mk("button","btn ghost hth-sm","Đã đọc, ẩn");bt.type="button";
    bt.addEventListener("click",function(){hidAdd(x.id);sfx("tap");row.remove();annPaint();annRot();if(!annVis().length)o.classList.remove("on");});
    row.appendChild(bt);b.appendChild(row);});
  var c=mk("button","btn ghost","Đóng");c.type="button";c.setAttribute("data-close","");f.appendChild(c);o.classList.add("on");}

/* ---------- 3. HỘP THƯ ---------- */
var M={items:[],at:0,open:null,busy:{}};
function mailExpired(m){var d=toDate(m.expires_at);return !!(d&&d.getTime()<Date.now());}
function mailDone(m){return !!m.claimed||store.mailGot.indexOf(String(m.id))>=0;}
function mailClaimable(m){return !mailDone(m)&&!mailExpired(m)&&hasRw(m.rewards);}
function mailCount(){return on()?M.items.filter(mailClaimable).length:0;}
function mailBadge(){var b=$g("lbMail");if(!b)return;b.hidden=!on();var n=mailCount(),i=$g("lbMailN");
  if(i)i.textContent=n?String(n>99?"99+":n):"";
  b.setAttribute("aria-label",n?"Hộp thư, "+n+" thư chưa nhận":"Hộp thư");}
function mailLoad(force){if(!on())return Promise.resolve();if(!force&&Date.now()-M.at<30000)return Promise.resolve();M.at=Date.now();
  return CF.api("GET","/api/mail",undefined,{keep:true}).then(function(j){
    if(!j||!Array.isArray(j.items))return;M.items=j.items.filter(function(m){return m&&m.id!=null;});
    M.items.sort(function(a,b){return (toDate(b.created_at)||0)-(toDate(a.created_at)||0);});
    mailBadge();if($g("hthMail")&&$g("hthMail").classList.contains("on"))mailRender();}).catch(function(){});}
/* nhận 1 thư: CHỈ cộng sau khi máy chủ trả 200; id thư lưu ngay cùng lúc cộng nên phản hồi 200 lặp lại cũng không cộng thêm */
function claimOne(m){var id=String(m.id);
  if(M.busy[id])return Promise.resolve({st:"busy"});
  if(mailDone(m)){m.claimed=true;return Promise.resolve({st:"had"});}
  M.busy[id]=1;
  return CF.api("POST","/api/mail/claim",{id:m.id},{keep:true}).then(function(j){
    var rw=normRw(j&&j.rewards&&hasRw(j.rewards)?j.rewards:m.rewards),dup=[];
    if(store.mailGot.indexOf(id)<0){remember(store.mailGot,id,500);dup=applyRw(rw);}else rw=normRw({});
    m.claimed=true;return {st:"ok",rw:rw,dup:dup};
  }).catch(function(e){
    if(e&&e.status===409){m.claimed=true;remember(store.mailGot,id,500);try{save();}catch(x){}return {st:"had"};}
    if(e&&e.status===410){m.expires_at=new Date(Date.now()-1000).toISOString();return {st:"expired"};}
    if(e&&e.status===403&&e.code==="banned")return {st:"banned"};
    return {st:"err"};
  }).then(function(r){delete M.busy[id];return r;});}
function gainShow(title,rw,dup){
  var o=ovMake("hthGain","Nhận quà","hth-gp");var b=o.querySelector(".body"),f=o.querySelector(".foot");b.textContent="";f.textContent="";
  o.querySelector("h2").textContent=title;
  var wrap=mk("div","hth-gw"+(calm()?" calm":""));var L=chips(rw,true);
  L.forEach(function(t,i){var c=mk("span","hth-chip big",t);c.style.animationDelay=(i*90)+"ms";wrap.appendChild(c);});
  if(!L.length)wrap.appendChild(mk("span","hth-chip big","Không có quà mới"));
  b.appendChild(wrap);
  if(dup&&dup.length){b.appendChild(mk("p","hth-note","Bạn đã có sẵn: "+dup.map(function(k){return C[k].n;}).join(", ")+" (không cộng thêm)."));}
  var c=mk("button","btn end","Tuyệt!");c.type="button";c.setAttribute("data-close","");f.appendChild(c);
  o.classList.add("on");sfx("ui_reward");}
function claimMsg(r){return r.st==="had"?"Thư này đã nhận rồi":r.st==="expired"?"Thư đã hết hạn":r.st==="err"?"Chưa nhận được quà, hãy thử lại sau":"";}
function claimClick(m){claimOne(m).then(function(r){
  if(r.st==="ok")gainShow("Nhận quà",r.rw,r.dup);else{var t=claimMsg(r);if(t)say(t,2400);}
  mailBadge();if($g("hthMail"))mailRender();});}
function claimAll(){var L=M.items.filter(mailClaimable);if(!L.length)return;var sum=normRw({}),dups=[],n=0,bad="";
  (function next(i){if(i>=L.length){mailBadge();mailRender();
      if(n)gainShow("Nhận tất cả ("+n+" thư)",sum,dups);else if(bad)say(bad,2400);return;}
    claimOne(L[i]).then(function(r){
      if(r.st==="ok"){n++;sum=addRw(sum,r.rw);dups=dups.concat(r.dup);}
      else if(r.st==="banned"||r.st==="err"){bad=claimMsg(r)||"";if(r.st==="banned"){i=L.length;}}
      next(i+1);});})(0);}
function mailRender(){var o=ovMake("hthMail","Hộp thư","hth-mp");var b=o.querySelector(".body"),f=o.querySelector(".foot");b.textContent="";f.textContent="";
  var n=mailCount();
  if(!M.items.length)b.appendChild(mk("p","hth-empty","Hộp thư trống."));
  M.items.forEach(function(m){var id=String(m.id),done=mailDone(m),exp=!done&&mailExpired(m),open=M.open===id;
    var it=mk("div","hth-it"+(done?" done":"")+(exp?" exp":"")+(open?" open":""));
    var hd=mk("button","hth-hd");hd.type="button";hd.setAttribute("aria-expanded",open?"true":"false");
    var t=mk("b","hth-ti",String(m.title||"Thư"));hd.appendChild(t);
    var meta=[];var dd=fmtDay(m.created_at);if(dd)meta.push(dd);
    if(done)meta.push("Đã nhận");else if(exp)meta.push("Đã hết hạn");else if(m.expires_at){var ex=fmtDay(m.expires_at);if(ex)meta.push("Hạn: "+ex);}
    hd.appendChild(mk("small","hth-mt",meta.join(" · ")));
    var cs=chips(m.rewards,false);if(cs.length){var rw=mk("span","hth-rw");cs.forEach(function(x){rw.appendChild(mk("span","hth-chip",x));});hd.appendChild(rw);}
    if(!done&&!exp&&mailClaimable(m))hd.appendChild(mk("i","hth-dot"));
    hd.addEventListener("click",function(){sfx("tap");M.open=open?null:id;mailRender();});
    it.appendChild(hd);
    if(open){var bd=mk("div","hth-bd");bd.appendChild(mk("p","hth-tx2",String(m.body||"")));
      if(mailClaimable(m)){var bt=mk("button","btn end hth-claim","Nhận quà");bt.type="button";bt.addEventListener("click",function(){claimClick(m);});bd.appendChild(bt);}
      it.appendChild(bd);}
    b.appendChild(it);});
  var c=mk("button","btn ghost","Đóng");c.type="button";c.setAttribute("data-close","");f.appendChild(c);
  var a=mk("button","btn end","Nhận tất cả"+(n?" ("+n+")":""));a.type="button";a.disabled=!n;a.addEventListener("click",claimAll);f.appendChild(a);}
function mailOpen(){if(!on())return;sfx("tap");M.open=null;mailRender();$g("hthMail").classList.add("on");mailLoad(true);}

/* ---------- 4. GIFTCODE (trong Cài đặt) ---------- */
function gcBuild(){var adv=$g("setAdv");if(!adv||$g("hthGc"))return;
  var s=mk("section","sx-sec");s.id="hthGc";s.hidden=true;s.appendChild(mk("h3",null,"Giftcode"));
  var row=mk("div","sx-row sx-col hth-gcr");var w=mk("div","hth-gcw");
  var inp=mk("input","hth-gci");inp.id="hthGcIn";inp.type="text";inp.maxLength=40;inp.placeholder="Nhập giftcode";inp.autocomplete="off";inp.setAttribute("autocapitalize","characters");inp.spellcheck=false;inp.setAttribute("aria-label","Nhập giftcode");
  var bt=mk("button","btn end hth-gcb","Đổi");bt.type="button";bt.id="hthGcBtn";w.appendChild(inp);w.appendChild(bt);
  var msg=mk("div","hth-gcm");msg.id="hthGcMsg";msg.setAttribute("role","status");row.appendChild(w);row.appendChild(msg);s.appendChild(row);
  adv.parentNode.insertBefore(s,adv);
  bt.addEventListener("click",gcRedeem);inp.addEventListener("keydown",function(ev){if(ev.key==="Enter"){ev.preventDefault();gcRedeem();}});}
function gcMsg(t,ok){var m=$g("hthGcMsg");if(!m)return;m.textContent=t||"";m.className="hth-gcm"+(t?(ok?" ok":" bad"):"");}
function gcErr(e){var s=e&&e.status,c=e&&e.code;
  if(c==="not_started")return "Mã chưa đến thời gian sử dụng.";
  if(s===404||c==="not_found")return "Mã không tồn tại. Hãy kiểm tra lại.";
  if(s===410||c==="expired")return "Mã đã hết hạn.";
  if(s===409&&c==="used_up")return "Mã đã hết lượt sử dụng.";
  if(s===409||c==="already")return "Bạn đã đổi mã này rồi.";
  if(s===429)return "Bạn nhập sai quá nhiều lần. Hãy chờ một lúc rồi thử lại.";
  if(s===403&&c==="banned")return "Tài khoản đã bị khoá.";
  if(s===401)return "Hãy đăng nhập tài khoản online để đổi mã.";
  return "Không kết nối được máy chủ. Hãy thử lại sau.";}
var gcBusy=false;
function gcRedeem(){var inp=$g("hthGcIn");if(!inp||gcBusy)return;var code=inp.value.trim();
  if(!code){gcMsg("Hãy nhập giftcode.",false);return;}
  if(!on()){gcMsg("Hãy đăng nhập tài khoản online để đổi mã.",false);return;}
  var key=code.toUpperCase();
  if(store.codeGot.indexOf(key)>=0){gcMsg("Bạn đã đổi mã này rồi.",false);return;}
  gcBusy=true;$g("hthGcBtn").disabled=true;gcMsg("Đang kiểm tra mã...",true);
  CF.api("POST","/api/giftcode",{code:code},{keep:true}).then(function(j){
    var rw=normRw(j&&j.rewards),dup=[];
    if(store.codeGot.indexOf(key)<0){remember(store.codeGot,key,200);dup=applyRw(rw);}else rw=normRw({});
    inp.value="";gcMsg("Đổi mã thành công: "+(chips(rw,false).join(", ")||"không có quà")+".",true);
    gainShow("Đổi mã thành công",rw,dup);
  }).catch(function(e){
    if(e&&e.status===409&&e.code!=="used_up"){remember(store.codeGot,key,200);try{save();}catch(x){}}
    gcMsg(gcErr(e),false);
  }).then(function(){gcBusy=false;var b=$g("hthGcBtn");if(b)b.disabled=false;});}
function gcSync(){gcBuild();var s=$g("hthGc");if(s)s.hidden=!(CF&&CF.on);}

/* ---------- 5. BỊ KHOÁ ---------- */
var banShown=0;
window.LTD_ONBAN=function(j){j=j||{};if(Date.now()-banShown<2000)return;banShown=Date.now();
  clearInterval(P.t);P.t=0;
  try{if(CF&&typeof CF.logout==="function")CF.logout(false);}catch(e){}   /* chỉ bỏ phiên online; KHÔNG đụng store/tiến trình */
  M.items=[];mailBadge();gcSync();
  var o=ovMake("hthBan","Tài khoản đã bị khoá","hth-bp");var b=o.querySelector(".body"),f=o.querySelector(".foot");b.textContent="";f.textContent="";
  b.appendChild(mk("p","hth-bm","Tài khoản online của bạn đã bị khoá."));
  b.appendChild(mk("p","hth-bm","Lý do: "+(String(j.reason||"").trim()||"Không nêu lý do")));
  var u=fmtDT(j.until);b.appendChild(mk("p","hth-bm","Thời hạn: "+(u?"đến "+u+" (giờ Việt Nam)":"không giới hạn")));
  b.appendChild(mk("p","hth-note","Tiến trình trên máy vẫn được giữ nguyên. Bạn vẫn chơi ngoại tuyến bình thường."));
  var c=mk("button","btn end","Đã hiểu");c.type="button";c.setAttribute("data-close","");f.appendChild(c);
  try{closeAll();}catch(e){}o.classList.add("on");sfx("ui_error",.6);};

/* ---------- nối vào sảnh ---------- */
var lastTok=null,lastOn=null;
function sync(){var now=on();
  var b=$g("lbMail");if(b)b.hidden=!now;
  if(CF&&CF.token!==lastTok){lastTok=CF.token;M.items=[];M.at=0;M.open=null;if(now){ping();pingStart();mailLoad(true);}else{clearInterval(P.t);P.t=0;}}
  if(now!==lastOn){lastOn=now;mailBadge();}
  gcSync();}
function lobbyEnter(){sync();annLoad(false);mailLoad(false);}
var _rl=window.renderLobby;
if(typeof _rl==="function"&&!_rl.__hth){var w=function(){var r=_rl.apply(this,arguments);try{lobbyEnter();}catch(e){}return r;};w.__hth=1;window.renderLobby=w;try{renderLobby=w;}catch(e){}}
document.addEventListener("click",function(ev){
  if(ev.target.closest("#lbMail")){mailOpen();}
  else if(ev.target.closest("#hthAx")){var v=annVis();if(v.length){hidAdd(v[A.i%v.length].id);sfx("tap");A.i=0;annPaint();annRot();}}
  else if(ev.target.closest("#hthAt")){annOpen();}
  else if(ev.target.closest("#lbMute")){gcSync();}
});
setInterval(function(){if(document.visibilityState==="visible"&&CF&&CF.on)annLoad(true);},600000);
setInterval(sync,1500);
sync();annLoad(true);
window.LTD_HOPTHU={mailCount:mailCount,reload:function(){annLoad(true);return mailLoad(true);}};
})();
