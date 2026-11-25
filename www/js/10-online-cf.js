/* Module 10: Bộ nối với máy chủ online (Cloudflare Workers + Durable Objects + D1).
   Chỉ hoạt động khi có địa chỉ máy chủ (window.LTD_SERVER, ?server=..., hoặc localStorage "ltd.server", hoặc DEFAULT_SERVER).
   Không có địa chỉ máy chủ -> không đổi gì, game dùng cách cũ (claude.use nếu có, nếu không thì kênh giả lập 2 tab).
   Nó cung cấp lại đúng giao diện mà code online cũ đang dùng: room (presence/onPeers/join/leave/connected/onConnection),
   db (doc().get()/set()) và user (id()), nên các hàm OL trong 05-vfx-core.js giữ nguyên. */
(function(){
"use strict";
var DEFAULT_SERVER="https://linhthu-server.likiop00.workers.dev"; /* máy chủ Cloudflare đã triển khai (gpu23) */
var LS=null;try{LS=window.localStorage;}catch(e){}
function lsGet(k){try{return LS&&LS.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{if(LS){if(v==null)LS.removeItem(k);else LS.setItem(k,v);}}catch(e){}}
var $q=function(id){return document.getElementById(id);};
function serverBase(){
  var s=window.LTD_SERVER;
  try{var p=new URL(location.href).searchParams.get("server");if(p){if(p==="off")lsSet("ltd.server",null);else lsSet("ltd.server",p);}}catch(e){}
  /* trong trang Claude (link tester) mọi kết nối ra ngoài bị chặn -> giữ phòng chơi của Claude, không dùng máy chủ mặc định */
  var inClaude=!!(window.claude&&typeof window.claude.use==="function");
  if(!s)s=lsGet("ltd.server")||(inClaude?"":DEFAULT_SERVER);
  return s?String(s).replace(/\/+$/,""):"";
}
var CF={base:serverBase(),token:lsGet("ltd.cf.token")||"",user:null,rating:null,lbc:{},lbf:{},lobby:null,code:"",conns:[]};
try{CF.user=JSON.parse(lsGet("ltd.cf.user")||"null");}catch(e){}
try{var pc=new URL(location.href).searchParams.get("code");if(pc)lsSet("ltd.pcode",pc);}catch(e){}
CF.code=(lsGet("ltd.pcode")||"").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,24);
CF.on=!!CF.base;
window.LTD_CF=CF;
if(!CF.on)return;
if(!CF.token)CF.user=null;

/* ---------- gọi REST ---------- */
function api(method,path,body,opt){
  var h={};if(CF.token)h.authorization="Bearer "+CF.token;if(body!==undefined)h["content-type"]="application/json";
  var tk=CF.token,init={method:method,headers:h,body:body!==undefined?JSON.stringify(body):undefined};
  if(opt&&opt.keepalive)init.keepalive=true;
  return fetch(CF.base+path,init).then(function(r){
    return r.json().catch(function(){return {};}).then(function(j){
      if(r.status===401&&tk&&tk===CF.token&&!(opt&&opt.keep))cfLogout(true);
      if(r.status===403&&j&&j.error==="banned"&&typeof window.LTD_ONBAN==="function"){try{window.LTD_ONBAN(j);}catch(x){}}
      if(!r.ok){var e=new Error(j.message||j.error||("HTTP "+r.status));e.status=r.status;e.code=j.error;e.reason=j.reason;e.data=j;throw e;}
      return j;});});
}
function say(m,ms){try{if(typeof toast==="function")toast(m,ms);}catch(e){}}
CF.api=api;/* móc cho 14-hopthu.js: gọi REST có phiên + bắt 403 banned qua window.LTD_ONBAN */

/* ---------- đăng nhập / đăng xuất ---------- */
CF.me=null;CF.cfg=null;CF.saveVer=null;CF.lastPush=0;CF.conflict=false;
function setSession(token,user){CF.token=token||"";CF.user=token?user:null;lsSet("ltd.cf.token",CF.token||null);lsSet("ltd.cf.user",CF.user?JSON.stringify(CF.user):null);}
/* Đăng xuất: chỉ bỏ phiên trên máy này. TIẾN TRÌNH TRÊN MÁY GIỮ NGUYÊN (không đụng store). */
function cfLogout(expired){
  var was=!!CF.token;setSession("",null);CF.rating=null;CF.lbc={};CF.me=null;CF.saveVer=null;CF.conflict=false;
  try{if(CF.lobby){CF.lobby.leave();CF.lobby=null;}}catch(e){}
  try{if(typeof ACC==="object"){clearTimeout(ACC.timer);ACC.timer=0;ACC.db=null;ACC.uid=null;ACC.cloud=null;ACC.err="";ACC.ready=true;}}catch(e){}
  if(was&&expired)say("Phiên đăng nhập đã hết hạn, hãy đăng nhập lại",3200);
  try{renderAcc();}catch(e){}
}
/* sau khi đăng nhập / đăng ký / Google: lưu phiên rồi đồng bộ tiến trình (accBoot quyết định tải lên hay hỏi) */
function cfStart(j){
  setSession(j.token,j.user);CF.lbc={};CF.saveVer=null;CF.conflict=false;
  return refreshMe().then(function(){try{if(typeof accBoot==="function")accBoot();}catch(e){}return j.user;});
}
function cfLogin(u,p){return api("POST","/api/login",{username:u,password:p},{keep:true}).then(cfStart);}
function refreshMe(){
  if(!CF.token)return Promise.resolve();
  return api("GET","/api/me").then(function(j){CF.user=j.user;lsSet("ltd.cf.user",JSON.stringify(j.user));CF.rating=j.ratings&&j.ratings.online||null;
    CF.me={google:j.google||{linked:false,email:""},hasPassword:j.hasPassword!==false};}).catch(function(){});
}

/* ---------- kết nối WebSocket (tự nối lại trong 3 phút) ---------- */
function wsUrl(q){return CF.base.replace(/^http/,"ws")+"/api/play"+q;}
function Conn(q,h){this.q=q;this.h=h;this.ws=null;this.up=false;this.stop=false;this.tries=0;this.lastRx=0;this.rt=0;this.deadAt=0;this.opening=false;this.p=null;CF.conns.push(this);}
Conn.prototype.start=function(){
  var self=this;if(this.up)return Promise.resolve();if(this.p)return this.p;this.stop=false;
  this.p=this._open(true).then(function(m){self.p=null;return m;},function(e){self.p=null;throw e;});return this.p;};
Conn.prototype._open=function(first){
  var self=this;this.opening=true;
  return new Promise(function(res,rej){
    var ws;try{ws=new WebSocket(wsUrl(self.q),["ltd1","tk."+CF.token]);}catch(e){self.opening=false;rej(e);if(!first)self._retry();return;}
    var got=false,to=setTimeout(function(){if(!got){try{ws.close();}catch(e){}}},10000);self.ws=ws;
    ws.onmessage=function(ev){
      self.lastRx=Date.now();var m;try{m=JSON.parse(ev.data);}catch(e){return;}
      if(m.type==="pong")return;
      if(m.type==="hello"&&!got){got=true;clearTimeout(to);self.up=true;self.opening=false;self.tries=0;self.deadAt=0;if(self.h.onState)self.h.onState(true,first);self.h.onMsg(m);res(m);return;}
      self.h.onMsg(m);};
    ws.onerror=function(){};
    ws.onclose=function(ev){
      clearTimeout(to);var was=self.up;if(self.ws===ws){self.up=false;self.ws=null;}self.opening=false;
      if(!got){if(first){rej(new Error("ws "+ev.code));api("GET","/api/me").catch(function(){});}else self._retry();return;}
      if(was&&self.h.onState)self.h.onState(false,false);
      if(ev.code===4000){self.stop=true;if(self.h.onReplaced)self.h.onReplaced();return;}
      if(!self.stop)self._retry();};
  });
};
Conn.prototype._retry=function(){
  var self=this;if(this.stop)return;if(!this.deadAt)this.deadAt=Date.now();
  if(Date.now()-this.deadAt>190000){this.stop=true;if(this.h.onDead)this.h.onDead();return;}
  var d=Math.min(5000,800*Math.pow(2,this.tries++));clearTimeout(this.rt);
  this.rt=setTimeout(function(){if(!self.stop&&!self.up&&!self.opening)self._open(false).catch(function(){});},d);};
Conn.prototype.send=function(o){if(this.up&&this.ws&&this.ws.readyState===1){try{this.ws.send(JSON.stringify(o));return true;}catch(e){}}return false;};
Conn.prototype.close=function(){this.stop=true;this.up=false;clearTimeout(this.rt);var w=this.ws;this.ws=null;try{if(w)w.close(1000);}catch(e){}var i=CF.conns.indexOf(this);if(i>=0)CF.conns.splice(i,1);};
setInterval(function(){var now=Date.now();CF.conns.slice().forEach(function(c){if(!c.up||!c.ws)return;if(now-c.lastRx>60000){try{c.ws.close();}catch(e){}return;}c.send({type:"ping"});});},20000);
function wake(){CF.conns.slice().forEach(function(c){if(!c.stop&&!c.up&&!c.opening&&c.deadAt){clearTimeout(c.rt);c._open(false).catch(function(){});}});}
window.addEventListener("online",wake);document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")wake();});

/* ---------- room (giống giao diện room của trang) ---------- */
function makeRoom(kind,mid){
  var R={mock:false,name:kind==="lobby"?"lobby":mid},pres={},me="",peers=[],fns=new Set(),efns=new Set(),cfns=new Set(),seeking=false,pendingResult=null;
  var conn;
  function fire(){var ps=peers.slice();fns.forEach(function(f){try{f({peers:ps,joined:[],left:[],updated:[]});}catch(e){}});}
  function selfPeer(id,p){return {peer:id,by:null,isMe:true,sameTab:true,kind:"viewer",guest:false,presence:p,updatedAt:Date.now()};}
  function sendSeek(){
    var keys={};try{if(typeof lbKeys==="function"){var k=lbKeys("online");keys={d:k.d,s:k.s};}}catch(e){}
    conn.send({type:"seek",mode:"online",code:CF.code,keys:keys,pres:{nm:pres.nm,av:pres.av,rk:pres.rk,dk:pres.dk}});}
  conn=new Conn(kind==="lobby"?"":"?room="+encodeURIComponent(mid),{
    onMsg:function(m){
      if(m.type==="hello"){me=m.me;if(kind==="lobby"){peers=[selfPeer(me,pres)];fire();}}
      else if(m.type==="peers"&&kind==="match"){
        peers=m.peers.map(function(p){return {peer:p.peer,by:null,isMe:p.peer===me,sameTab:p.peer===me,kind:"viewer",guest:false,presence:p.presence||{},updatedAt:p.updatedAt||Date.now()};});fire();}
      else if(m.type==="found"&&kind==="lobby"){
        seeking=false;
        var mine=Object.assign({},pres,{t0:m.me.t0,mm:"seek"}),opp=Object.assign({},m.opp.pres,{mm:"seek",t0:m.opp.t0});
        peers=[selfPeer(m.me.peer,mine),{peer:m.opp.peer,by:null,isMe:false,sameTab:false,kind:"viewer",guest:false,presence:opp,updatedAt:Date.now()}];fire();}
      else if(m.type==="ended"&&kind==="match")cfEnded(m.result);
      else if(m.type==="error"&&kind==="lobby")say("Máy chủ ghép trận báo lỗi, thử lại",2600);
    },
    onState:function(up,first){
      cfns.forEach(function(f){try{f(up);}catch(e){}});
      if(up&&!first){
        if(kind==="match"){conn.send({type:"pres",patch:Object.assign({},pres)});if(pendingResult)conn.send(pendingResult);}
        else if(seeking)sendSeek();}
    },
    onDead:function(){efns.forEach(function(f){try{f(new Error("mất kết nối"));}catch(e){}});},
    onReplaced:function(){if(kind==="match")say("Tài khoản đang đăng nhập ở nơi khác",3200);efns.forEach(function(f){try{f(new Error("replaced"));}catch(e){}});}
  });
  R._start=function(){return conn.start();};
  R.presence=function(patch){
    for(var k in patch){if(patch[k]===null)delete pres[k];else pres[k]=patch[k];}
    if(kind==="lobby"){
      var want=pres.mm==="seek";
      if(want&&!seeking){seeking=true;return conn.start().then(function(){sendSeek();});}
      if(!want&&seeking){seeking=false;conn.send({type:"cancel"});}
      if(pres.mm==null&&!want)conn.close();
      return Promise.resolve();}
    conn.send({type:"pres",patch:patch});return Promise.resolve();};
  R.peers=function(){return peers.slice();};
  R.onPeers=function(fn,efn){fns.add(fn);if(efn)efns.add(efn);setTimeout(function(){try{fn({peers:peers.slice(),joined:[],left:[],updated:[]});}catch(e){}},0);return function(){fns.delete(fn);if(efn)efns.delete(efn);};};
  R.connected=function(){return conn.up;};
  R.onConnection=function(fn){cfns.add(fn);setTimeout(function(){try{fn(conn.up);}catch(e){}},0);return function(){cfns.delete(fn);};};
  R.emit=function(){return Promise.resolve();};R.on=function(){return function(){};};
  R.leave=function(){conn.close();fns.clear();efns.clear();cfns.clear();return Promise.resolve();};
  if(kind==="lobby")R.join=function(name){var r=makeRoom("match",name);return r._start().then(function(){return r;},function(e){r.leave();throw e;});};
  R.sendResult=function(res){
    var w=res&&(res.winner==="p"||res.winner==="a")?res.winner:null;
    pendingResult={type:"result",w:w,kind:String(res&&res.kind||"").slice(0,20)};conn.send(pendingResult);};
  R._cf=true;
  return R;
}
function lobby(){if(!CF.lobby)CF.lobby=makeRoom("lobby");return CF.lobby;}

/* máy chủ báo kết thúc trận (xử thua do mất kết nối / không ra bài, hoặc cập nhật hạng) */
function cfEnded(r){
  try{
    if(!r||!CF.user)return;
    var d=r.deltas&&r.deltas[CF.user.id];
    if(typeof G!=="undefined"&&G&&G.online&&G.phase!=="over"&&typeof OL!=="undefined"&&OL.mid===r.mid&&(r.reason==="disconnect"||r.reason==="turn_timeout")){
      if(r.winner===CF.user.id){OL.note=r.reason==="disconnect"?"Đối thủ mất kết nối quá 3 phút.":"Đối thủ không ra bài quá 3 phút.";E.finish(G,"retreatA");showEnd();}
      else{OL.note=r.reason==="disconnect"?"Bạn mất kết nối quá 3 phút nên bị xử thua.":"Bạn không ra bài quá 3 phút nên bị xử thua.";E.finish(G,"timeoutP");showEnd();}
    }
    if(typeof d==="number"&&r.outcome!=="void"){
      say("Xếp hạng online "+(d>=0?"+":"")+d+" → "+r.ratings[CF.user.id],3800);
      CF.lbc={};if(CF.rating)CF.rating.rating=r.ratings[CF.user.id];
      try{renderAcc();}catch(e){}
    }else if(r.outcome==="void")say("Trận không được tính điểm xếp hạng",3000);
  }catch(e){}
}

/* ---------- db / user (cho đồng bộ tiến trình, giống claude.use("db")) ----------
   Bản lưu "save" luôn gửi kèm base = phiên bản máy này biết gần nhất; máy chủ trả 409 nếu máy khác đã lưu -> hỏi người chơi. */
function svKey(){return CF.user?"ltd.cf.sv."+CF.user.id:"";}
function cfDb(){return {doc:function(path){
  var slot=/\/avatar$/.test(path)?"avatar":"save";
  return {
    get:function(){return api("GET","/api/save?slot="+slot).then(function(j){
      if(slot==="save"){CF.srvVer=j.version|0;CF.srvAt=j.updatedAt||0;}
      var d=null;if(j.blob){try{d=JSON.parse(j.blob);}catch(e){d=null;}}
      if(slot==="save")CF.srvHas=!!j.blob;
      return {exists:!!d,data:function(){return d;}};});},
    set:function(obj){
      var b={blob:JSON.stringify(obj)};
      if(slot==="save"){if(CF.saveVer==null)return Promise.reject({code:"need_sync"});b.base=CF.saveVer;}
      return api("PUT","/api/save?slot="+slot,b,{keepalive:!!CF.hiding&&b.blob.length<60000}).then(function(j){
        if(slot==="save"){CF.saveVer=CF.srvVer=j.version;CF.srvAt=j.updatedAt;lsSet(svKey(),String(j.version));}return j;
      },function(e){if(e.status===409)throw {code:"conflict"};if(e.status===401)throw {code:"not_granted"};if(e.status===413)throw {code:"too_big"};throw e;});}
  };}};}
var shim={use:function(name){
  if(name==="room")return Promise.resolve(CF.token?lobby():null);
  if(name==="db")return Promise.resolve(cfDb());
  if(name==="user")return Promise.resolve({id:function(){return Promise.resolve(CF.user&&CF.token?"cf"+CF.user.id:null);}});
  return Promise.reject(new Error("không hỗ trợ "+name));}};
if(!window.claude)window.claude=shim;
else{var ou=window.claude.use&&window.claude.use.bind(window.claude);window.claude.use=function(n){return (n==="room"||n==="db"||n==="user")?shim.use(n):(ou?ou(n):Promise.reject(new Error("no")));};}

/* ---------- gắn vào code online hiện có ---------- */
if(typeof getRoom==="function")getRoom=function(){return CF.token?Promise.resolve(lobby()):Promise.resolve(null);};
if(typeof ROOMP!=="undefined")ROOMP=null;
var _of=typeof onlineFind==="function"?onlineFind:null;
if(_of)onlineFind=function(){
  if(!CF.token){say("Hãy đăng nhập tài khoản online để chơi",2600);openLogin();return;}
  return _of.apply(this,arguments);};
var _oo=typeof onlineOver==="function"?onlineOver:null;
if(_oo)onlineOver=function(r){
  var room=typeof OL!=="undefined"&&OL.mr;_oo.apply(this,arguments);
  try{if(room&&room._cf)room.sendResult(r);}catch(e){}};

/* điểm các chế độ khác: báo lên máy chủ; chế độ online do máy chủ tự chấm */
var _lbAdd=typeof lbAdd==="function"?lbAdd:null;
if(_lbAdd)lbAdd=function(mode,r){
  _lbAdd.apply(this,arguments);
  try{
    if(CF.token&&mode!=="online"&&r){
      var st=Math.max(1,r.stake|0),pts=r.winner==="p"?(mode==="rank"?2+st:3):r.winner==="a"?0:1;pts=Math.min(12,pts);
      if(pts>0){var k=lbKeys(mode);api("POST","/api/score",{mode:mode,pts:pts,d:k.d,s:k.s}).then(function(){CF.lbc={};}).catch(function(){});}
    }
  }catch(e){}};
function lbFetch(mode,key){
  var ck=mode+"|"+key;if(CF.lbf[ck])return;CF.lbf[ck]=1;
  api("GET","/api/leaderboard?mode="+encodeURIComponent(mode)+"&key="+encodeURIComponent(key)).then(function(j){
    CF.lbc[ck]={t:Date.now(),rows:j.rows||[]};
    var ov=$q("ovRank");if(ov&&ov.classList.contains("on")&&typeof renderRank==="function")renderRank();
  }).catch(function(){CF.lbc[ck]={t:Date.now(),rows:[]};}).then(function(){delete CF.lbf[ck];});
}
var _lbBoard=typeof lbBoard==="function"?lbBoard:null;
if(_lbBoard)lbBoard=function(mode,key,cur){
  if(!CF.token)return _lbBoard(mode,key,cur);
  var ck=mode+"|"+key,c=CF.lbc[ck];
  if(!c||Date.now()-c.t>30000)lbFetch(mode,key);
  var nm=(typeof store!=="undefined"&&store.name)||"Bạn",mine=lbPts(mode,key);
  if(!c)return cur?[{n:nm,v:mine,me:true}]:_lbBoard(mode,key,cur);
  var rows=c.rows.map(function(r){return {n:r.name,v:r.v,me:!!r.me};});
  if(!rows.some(function(r){return r.me;}))rows.push({n:nm,v:mine,me:true});
  return rows;};
var _rr=typeof renderRank==="function"?renderRank:null;
if(_rr)renderRank=function(){
  _rr.apply(this,arguments);
  if(!CF.token)return;
  document.querySelectorAll("#rankBody .shn").forEach(function(e){if(/máy mô phỏng/.test(e.textContent))e.textContent="Bảng xếp hạng thật: người chơi có tài khoản online. Chế độ Online do máy chủ tính điểm.";});};

/* ---------- đồng bộ tiến trình với tài khoản ----------
   Thay accBoot/accQueue/accPush/accAsk/accLink của 06-ui-match.js khi có máy chủ (giữ nguyên store, accPack, accLoadCloud...).
   - Đăng nhập lần đầu trên máy: máy chủ chưa có bản lưu -> tải bản máy này lên; đã có -> hỏi người chơi chọn.
   - Tự lưu: gộp, tối đa 1 lần/20 s và khi ẩn trang. Luôn gửi base = phiên bản đã biết; 409 -> hỏi, không bao giờ ghi đè âm thầm. */
var SYNC_GAP=20000,HAS_ACC=typeof accBoot==="function"&&typeof ACC==="object"&&typeof accPack==="function";
function myVer(){var v=lsGet(svKey());return v==null||v===""?null:(+v|0);}
function lsBackup(k,v){try{LS&&LS.setItem(k,v);return true;}catch(e){return false;}}
function cfAccBoot(){
  accA();clearTimeout(CF.bootRetry);
  if(!CF.token||!CF.user){ACC.db=null;ACC.uid=null;ACC.cloud=null;ACC.ready=true;try{renderAcc();}catch(e){}return Promise.resolve();}
  var uid="cf"+CF.user.id;ACC.db=cfDb();ACC.uid=uid;ACC.ro=false;
  return accRef().get().then(function(sn){
    if(!CF.token||ACC.uid!==uid)return;
    ACC.cloud=sn.exists?sn.data():null;ACC.ready=true;ACC.err="";
    var a=store.acc,cs=accCloudStore(),mine=myVer(),linked=!!(a.linked&&a.uid===uid);
    if(!CF.srvHas){
      /* máy chủ chưa có bản lưu: tải tiến trình máy này lên */
      CF.saveVer=CF.srvVer|0;CF.conflict=false;a.linked=true;a.uid=uid;ACC.last="";
      try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}
      try{renderAcc();}catch(e){}
      return accPush(true).then(function(){if(accLinked()&&!CF.conflict&&!ACC.err)say("Đã lưu tiến trình máy này lên tài khoản",2600);});
    }
    var same=!!(cs&&ACC.cloud.s===accPack());
    if((linked||same)&&(same||mine===CF.srvVer||(mine==null&&cs&&(ACC.cloud.t||0)<=(a.t||0)+1000))){
      if(!linked){a.linked=true;a.uid=uid;try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}}
      /* máy này đã đồng bộ với đúng bản trên máy chủ: tiếp tục tự lưu */
      CF.saveVer=CF.srvVer;CF.conflict=false;lsSet(svKey(),String(CF.srvVer));
      if(same)ACC.last=ACC.cloud.s;
      try{renderAcc();}catch(e){}accQueue();return;
    }
    try{renderAcc();}catch(e){}
    cfAsk(linked?"newer":"found");
  },function(){
    ACC.cloud=null;ACC.ready=true;ACC.err="Chưa kết nối được máy chủ lưu trữ, sẽ thử lại.";try{renderAcc();}catch(e){}
    CF.bootRetry=setTimeout(function(){if(CF.token)accBoot();},30000);
  });
}
function cfQueue(){
  if(!CF.token||!ACC.ready||ACC.ro||CF.conflict||CF.saveVer==null||!accLinked())return;
  if(ACC.timer)return;
  var w=Math.max(2500,SYNC_GAP-(Date.now()-CF.lastPush));
  ACC.timer=setTimeout(function(){ACC.timer=0;accPush();},w);
}
function cfPush(force){
  clearTimeout(ACC.timer);ACC.timer=0;
  if(!CF.token||!accLinked()||ACC.ro||CF.conflict||CF.saveVer==null)return Promise.resolve();
  if(ACC.busy){CF.again=true;return Promise.resolve();}
  var body=accPack(),av=store.avImg||"";
  if(body===ACC.last&&av===ACC.lastAv&&!force)return Promise.resolve();
  ACC.busy=true;var t=Date.now();CF.lastPush=t;CF.hiding=document.visibilityState==="hidden";
  var doc={v:1,t:t,gid:store.acc.gid,s:body};
  var p=(body!==ACC.last||force)?(body.length>240000?Promise.reject({code:"too_big"}):accRef().set(doc).then(function(){
    ACC.last=body;ACC.cloud=doc;store.acc.t=t;try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}})):Promise.resolve();
  return p.then(function(){if(av!==ACC.lastAv)return accRef("avatar").set({img:av.length<200000?av:""}).then(function(){ACC.lastAv=av;});})
    .then(function(){ACC.err="";},function(e){
      var c=e&&e.code;
      if(c==="conflict"){ACC.busy=false;cfConflict();return;}
      if(c==="not_granted"||!CF.token)ACC.err="Chưa lưu được vì phiên đăng nhập đã hết. Tiến trình vẫn ở trên máy này.";
      else if(c==="too_big")ACC.err="Dữ liệu quá lớn để lưu lên tài khoản.";
      else{ACC.err="Chưa lưu được lên tài khoản, sẽ thử lại.";setTimeout(function(){accQueue();},SYNC_GAP);}
    }).then(function(){ACC.busy=false;CF.hiding=false;if(CF.again){CF.again=false;accQueue();}try{renderAcc();}catch(e){}});
}
/* 409: máy khác đã lưu -> tạm dừng tự lưu, tải bản mới nhất về để so, hỏi người chơi */
function cfConflict(){
  CF.conflict=true;ACC.err="Máy khác vừa lưu tiến trình. Đã tạm dừng tự lưu cho tới khi bạn chọn bản muốn giữ.";
  try{renderAcc();}catch(e){}
  return accRef().get().then(function(sn){ACC.cloud=sn.exists?sn.data():null;cfAsk("conflict");},function(){try{renderAcc();}catch(e){}});
}
function cfSum(o){
  if(!o)return '<span class="gf">Không đọc được</span>';
  var own=Array.isArray(o.own)?o.own.length:0,stt=o.st||{g:0},I=typeof icn==="function"?icn:function(){return "";};
  return '<span class="gf">'+I("col")+own+' thẻ</span><span class="gf">'+I("gold")+(o.gold|0).toLocaleString("vi-VN")+'</span><span class="gf">'+I("gems")+(o.gems|0)+' ngọc</span><span class="gf">'+(stt.g|0)+' ván</span>';
}
function cfAsk(kind){
  if(!CF.token||!ACC.uid)return;
  if(kind!=="found")CF.conflict=true;
  CF.askKind=kind;
  var cs=accCloudStore(),at=ACC.cloud&&ACC.cloud.t||CF.srvAt;
  var head={found:"Tài khoản đã có tiến trình",newer:"Có tiến trình mới hơn trên tài khoản",conflict:"Máy khác vừa lưu tiến trình"}[kind];
  var sub={found:"Tài khoản này đã lưu tiến trình từ trước. Chọn tiến trình dùng trên máy này:",newer:"Tài khoản đã được lưu từ một máy khác sau lần đồng bộ cuối của máy này. Chọn bản muốn giữ:",conflict:"Trong lúc bạn chơi, tài khoản đã được lưu từ một máy khác. Chọn bản muốn giữ:"}[kind];
  ovShow('<div class="pyh">'+head+'</div><div class="acs">'+sub+'</div><div class="cfx">'
    +'<div class="acc2 cloud"><b>Trên tài khoản</b><small>Lưu lúc '+eh(accTime(at))+'</small><div class="gfs">'+cfSum(cs)+'</div><button type="button" class="btn end cfw" data-cf="usecloud"'+(cs?'':' disabled')+'>Dùng tiến trình trên tài khoản</button></div>'
    +'<div class="acc2"><b>Trên máy này</b><small>'+(store.acc.t?'Đồng bộ lần cuối '+eh(accTime(store.acc.t)):'Chưa từng lưu lên tài khoản')+'</small><div class="gfs">'+cfSum(store)+'</div><button type="button" class="btn ghost cfw" data-cf="keeplocal">Giữ tiến trình máy này</button></div>'
    +'</div><div class="pyt">Bản không được chọn sẽ bị thay thế.</div><button type="button" class="btn ghost acl" data-cf="later">Để sau</button>');
}
function cfUseCloud(){
  if(!accCloudStore()||!CF.token)return;
  /* sao lưu tiến trình máy này trong trình duyệt trước khi thay (phòng khi cần khôi phục) */
  var raw=null;try{raw=localStorage.getItem(KEY);}catch(e){}
  if(raw&&!lsBackup("ltd.cf.bak.local",raw)){try{var o=JSON.parse(raw);delete o.avImg;lsBackup("ltd.cf.bak.local",JSON.stringify(o));}catch(e){}}
  lsSet(svKey(),String(CF.srvVer|0));CF.conflict=false;
  var b=document.querySelector('#accBody [data-cf="usecloud"]');if(b){b.disabled=true;b.textContent="Đang tải...";}
  accLoadCloud();
}
function cfKeepLocal(){
  if(!CF.token||!ACC.uid)return;
  try{if(ACC.cloud)lsBackup("ltd.cf.bak.cloud",JSON.stringify(ACC.cloud));}catch(e){}
  var a=store.acc;a.linked=true;a.uid=ACC.uid;CF.conflict=false;ACC.ro=false;ACC.last="";ACC.err="";CF.saveVer=CF.srvVer|0;
  ovHide();
  accPush(true).then(function(){if(accLinked()&&!CF.conflict&&!ACC.err)say("Đã lưu tiến trình máy này lên tài khoản",2600);});
}
function cfLater(){
  ovHide();
  if(CF.askKind!=="found"){CF.conflict=true;ACC.err="Đang tạm dừng tự lưu: hãy chọn tiến trình muốn giữ.";}
  try{renderAcc();}catch(e){}
}
function cfResolve(){if(CF.conflict)cfConflict();else accBoot();}
if(HAS_ACC){
  var _bootP=null;
  accBoot=function(){if(_bootP)return _bootP;_bootP=cfAccBoot().catch(function(){}).then(function(){_bootP=null;});return _bootP;};
  accQueue=cfQueue;accPush=cfPush;
  accAsk=function(kind){cfAsk(kind==="newer"?"newer":"found");};
  accLink=function(){return accBoot();};
}

/* ---------- cấu hình công khai + Google Identity Services ---------- */
function loadCfg(force){
  if(CF.cfgP)return CF.cfgP;
  if(CF.cfg&&!force&&Date.now()-CF.cfg.at<60000)return Promise.resolve(CF.cfg);
  CF.cfgP=api("GET","/api/config",undefined,{keep:true}).then(function(j){CF.cfg={googleClientId:String(j.googleClientId||""),registerOpen:j.registerOpen!==false,at:Date.now()};return CF.cfg;},
    function(){return CF.cfg;}).then(function(c){CF.cfgP=null;return c;});
  return CF.cfgP;
}
/* nơi dùng được Google: chỉ trang web thật (không phải APK Capacitor, không phải trang nhúng trong khung) */
function gWhere(){
  try{if(window.self!==window.top)return "frame";}catch(e){return "frame";}
  var C=window.Capacitor;
  if(location.protocol==="capacitor:"||location.protocol==="file:"||location.origin==="https://localhost")return "app";
  try{if(C&&(typeof C.isNativePlatform==="function"?C.isNativePlatform():!!C.isNative))return "app";}catch(e){}
  return "web";
}
var GIS={p:null,cid:""};
function loadGis(){
  if(window.google&&google.accounts&&google.accounts.id)return Promise.resolve();
  if(GIS.p)return GIS.p;
  GIS.p=new Promise(function(res,rej){
    var s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";s.async=true;
    s.onload=function(){res();};s.onerror=function(){GIS.p=null;s.remove();rej(new Error("gis"));};document.head.appendChild(s);});
  return GIS.p;
}
function gZoneHtml(mode){
  var c=CF.cfg;if(!c||!c.googleClientId)return "";
  if(gWhere()!=="web")return '<div class="cfgn">Đăng nhập Google chỉ có trên trang web</div>';
  return (mode==="link"?'':'<div class="cfor">hoặc</div>')+'<div class="cfgb" id="cfGb" data-gm="'+mode+'"></div>';
}
/* điền vùng Google (#cfGz) sau khi biết cấu hình; chỉ nạp script Google khi cần hiện nút */
function gFill(mode){
  var z=$q("cfGz");if(!z)return;
  z.innerHTML=gZoneHtml(mode);
  var el=$q("cfGb");if(!el)return;
  CF.gmode=mode;
  loadGis().then(function(){
    var el2=$q("cfGb");if(!el2||!CF.cfg||!CF.cfg.googleClientId)return;
    if(GIS.cid!==CF.cfg.googleClientId){google.accounts.id.initialize({client_id:CF.cfg.googleClientId,callback:onGCred,ux_mode:"popup",auto_select:false,cancel_on_tap_outside:true,itp_support:true});GIS.cid=CF.cfg.googleClientId;}
    var w=Math.round(Math.max(200,Math.min(380,el2.clientWidth||260)));
    google.accounts.id.renderButton(el2,{type:"standard",theme:"filled_blue",size:"large",shape:"pill",text:mode==="link"?"continue_with":"signin_with",logo_alignment:"left",width:w,locale:"vi"});
  }).catch(function(){var e2=$q("cfGb");if(e2)e2.innerHTML='<div class="cfgn">Không tải được nút Google, thử lại sau</div>';});
}
function onGCred(r){
  var cred=r&&r.credential;if(!cred)return;
  showErr("Đang xác minh tài khoản Google...",true);
  if(CF.gmode==="link"&&CF.token){
    api("POST","/api/link/google",{credential:cred}).then(function(j){CF.me=CF.me||{hasPassword:true};CF.me.google=j.google;say("Đã liên kết Google",2400);openManage();try{renderAcc();}catch(e){}},showErr);
    return;
  }
  api("POST","/api/login/google",{credential:cred},{keep:true}).then(function(j){
    ovHide();say(j.created?"Đã tạo tài khoản mới bằng Google":"Đã đăng nhập bằng Google",2400);
    return cfStart(j).then(function(){try{renderAcc();}catch(e){}});
  },showErr);
}

/* ---------- thông báo lỗi tiếng Việt theo mã lỗi máy chủ ---------- */
var ERR={
  exists:"Tên đăng nhập này đã có người dùng, hãy chọn tên khác.",
  register_closed:"Đăng ký tài khoản mới đang tạm đóng.",
  too_many_accounts:"Mạng này đã tạo quá nhiều tài khoản, hãy thử lại sau một giờ.",
  too_many:"Thử quá nhiều lần, hãy đợi vài phút rồi thử lại.",
  google_off:"Đăng nhập Google chưa được bật trên máy chủ.",
  bad_google:"Không xác minh được tài khoản Google, hãy thử lại.",
  google_taken:"Tài khoản Google này đã gắn với một tài khoản game khác.",
  has_google:"Tài khoản đã liên kết một Google khác, hãy huỷ liên kết trước.",
  need_password:"Hãy đặt mật khẩu trước khi huỷ liên kết Google, nếu không sẽ không đăng nhập lại được.",
  bad_old:"Mật khẩu cũ không đúng.",
  unauthorized:"Phiên đăng nhập đã hết, hãy đăng nhập lại.",
  too_big:"Dữ liệu quá lớn."
};
function errText(e){
  if(!e)return "Có lỗi, hãy thử lại.";
  if(typeof e==="string")return e;
  if(!e.status)return "Không kết nối được máy chủ, kiểm tra mạng rồi thử lại.";
  if(e.code==="bad_google"&&e.reason==="expired")return "Phiên Google đã hết hạn, hãy bấm lại nút Google.";
  if(e.code==="bad_google"&&e.reason==="email_unverified")return "Email Google chưa được xác minh.";
  if(ERR[e.code])return ERR[e.code];
  if(e.code==="bad_creds"||e.code==="bad_login")return e.message;
  if(e.status>=500)return "Máy chủ đang bận, hãy thử lại sau.";
  return e.message&&/[à-ỹ]/i.test(e.message)?e.message:"Có lỗi ("+(e.code||e.status)+"), hãy thử lại.";
}
function showErr(e,info){
  var el=$q("cfE");if(el){el.textContent=info?e:errText(e);el.classList.toggle("ok",!!info);}
  document.querySelectorAll("#accBody [data-busy]").forEach(function(b){b.disabled=false;b.removeAttribute("data-busy");});
}
function busy(sel){var b=document.querySelector('#accBody [data-cf="'+sel+'"]');if(b){b.disabled=true;b.setAttribute("data-busy","1");}}
function val(id){var e=$q(id);return e?e.value:"";}

/* ---------- giao diện tài khoản ---------- */
var st=document.createElement("style");
st.textContent="#ovAcc{z-index:25}#ovAcc.on{overflow-y:auto;-webkit-overflow-scrolling:touch;align-items:flex-start}#ovAcc .accm{margin:auto}"
  +".cfb{display:flex;flex-direction:column;gap:10px}.cfi{width:100%;height:42px;border-radius:10px;border:1px solid rgba(140,160,255,.45);background:rgba(7,6,26,.75);color:#fff;font:inherit;font-size:16px;padding:0 12px;box-sizing:border-box;-webkit-user-select:text;user-select:text}.cfi::placeholder{color:#8f8ac0}.cfi:focus{outline:2px solid #3fa8ff;outline-offset:1px}"
  +".cfe{min-height:16px;font-size:12.5px;line-height:1.35;color:#ff9a9a;text-align:left}.cfe.ok{color:#9fe8c4}.cfl{display:flex;flex-direction:column;gap:4px;text-align:left;font-size:12px;color:#aab4e0}.cfb .acb .btn{min-width:0}"
  +".cft{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:12px;background:rgba(0,0,0,.35);border:1px solid rgba(140,160,255,.25)}"
  +".cftb{height:36px;min-width:0;border:0;border-radius:9px;background:transparent;color:#aab4e0;font:inherit;font-weight:800;font-size:14px;cursor:pointer}.cftb.on{background:linear-gradient(#3a63c9,#2a46a0);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.4)}.cftb:focus-visible{outline:2px solid #3fa8ff}"
  +".cfor{display:flex;align-items:center;gap:8px;font-size:12px;color:#8f99c8}.cfor::before,.cfor::after{content:'';flex:1;height:1px;background:rgba(140,160,255,.3)}"
  +".cfgz{display:flex;flex-direction:column;gap:8px}.cfgz:empty{display:none}.cfgb{display:flex;justify-content:center;min-height:44px;overflow:hidden}.cfgn{font-size:11.5px;line-height:1.35;color:#8f99c8;text-align:center}"
  +".cfh{font-size:11.5px;line-height:1.35;color:#8f99c8;text-align:left;margin-top:-6px}.cfm{font-size:12.5px;line-height:1.4;color:#cfd8f5;text-align:left;overflow-wrap:anywhere}.cfm b{color:#fff}"
  +".cfx{display:grid;grid-template-columns:1fr 1fr;gap:8px}.accm .acb .btn{flex:1 1 0}.accm .acc2 .btn.cfw{height:auto!important;min-height:40px!important;white-space:normal;line-height:1.2!important;padding:6px 6px;overflow-wrap:anywhere}";
document.head.appendChild(st);
function eh(s){return String(s).replace(/[&<>"']/g,function(c){return "&#"+c.charCodeAt(0)+";";});}
function ovShow(html){var b=$q("accBody"),ov=$q("ovAcc");if(!b||!ov)return false;b.innerHTML=html;ov.classList.add("on");b.scrollTop=0;ov.scrollTop=0;return true;}
function ovHide(){var ov=$q("ovAcc");if(ov)ov.classList.remove("on");}
function cfBlock(){
  if(CF.token&&CF.user){
    var r=CF.rating&&CF.rating.games?" · hạng online "+CF.rating.rating+" ("+CF.rating.games+" ván)":"";
    var g=CF.me&&CF.me.google&&CF.me.google.linked?'<small>Google: '+eh(CF.me.google.email||"đã liên kết")+'</small>':"";
    return '<div class="cfb"><div class="acr"><span class="acdot on"></span><div class="act"><b>Online: '+eh(CF.user.display||CF.user.username)+'</b><small>@'+eh(CF.user.username)+r+'</small>'+g+'</div></div>'
      +(CF.conflict?'<div class="acb"><button type="button" class="btn end" data-cf="resolve">Chọn tiến trình muốn giữ</button></div>':'')
      +'<label class="cfl">Mã ghép riêng (không bắt buộc, chỉ ghép với người nhập cùng mã)<input class="cfi" id="cfCode" maxlength="24" autocomplete="off" autocapitalize="none" spellcheck="false" value="'+eh(CF.code)+'" placeholder="để trống = ghép với mọi người"></label>'
      +'<div class="acb"><button type="button" class="btn ghost" data-cf="manage">Quản lý tài khoản</button><button type="button" class="btn ghost" data-cf="logout">Đăng xuất</button></div></div>';
  }
  return '<div class="cfb"><div class="acr"><span class="acdot"></span><div class="act"><b>Tài khoản online</b><small>Chưa đăng nhập. Tạo tài khoản hoặc đăng nhập để chơi online, lên bảng xếp hạng và lưu tiến trình lên máy chủ.</small></div></div>'
    +'<div class="acb"><button type="button" class="btn end" data-cf="login">Đăng nhập</button><button type="button" class="btn ghost" data-cf="register">Đăng ký</button></div></div>';
}
var _ra=typeof renderAcc==="function"?renderAcc:null;
if(_ra)renderAcc=function(){
  _ra.apply(this,arguments);
  var el=$q("accBox");if(!el)return;
  el.querySelectorAll(".acn").forEach(function(n){if(/đăng nhập Claude/.test(n.textContent))n.textContent=CF.token?"Đang kiểm tra tài khoản...":"Đăng nhập tài khoản online ở trên để lưu tiến trình lên máy chủ và đồng bộ giữa các máy.";});
  el.insertAdjacentHTML("afterbegin",cfBlock());
};
function tabsHtml(cur){
  return '<div class="cft" role="tablist" aria-label="Tài khoản"><button type="button" role="tab" class="cftb'+(cur==="login"?" on":"")+'" aria-selected="'+(cur==="login")+'" data-cf="login">Đăng nhập</button>'
    +'<button type="button" role="tab" class="cftb'+(cur==="register"?" on":"")+'" aria-selected="'+(cur==="register")+'" data-cf="register">Đăng ký</button></div>';
}
function afterCfg(view,fill){loadCfg().then(function(){if(CF.view!==view||!$q("ovAcc").classList.contains("on"))return;fill();});}
function openLogin(msg){
  CF.view="login";
  ovShow(tabsHtml("login")+'<div class="cfb">'
    +'<input class="cfi" id="cfU" placeholder="Tên đăng nhập" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="24" aria-label="Tên đăng nhập">'
    +'<input class="cfi" id="cfP" type="password" placeholder="Mật khẩu" autocomplete="current-password" maxlength="128" aria-label="Mật khẩu">'
    +'<div class="cfe" id="cfE" role="alert">'+(msg?eh(msg):"")+'</div>'
    +'<button type="button" class="btn end" data-cf="go">Đăng nhập</button>'
    +'<div class="cfgz" id="cfGz"></div>'
    +'<button type="button" class="btn ghost acl" data-cf="x">Đóng</button></div>');
  gFill("login");afterCfg("login",function(){gFill("login");});
  setTimeout(function(){var u=$q("cfU");if(u&&!matchMedia("(pointer:coarse)").matches)u.focus();},50);
}
function openRegister(){
  CF.view="register";
  var nm=(typeof store!=="undefined"&&store.name)||"";
  ovShow(tabsHtml("register")+'<div class="cfb">'
    +'<div class="cfe" id="cfRc" hidden></div>'
    +'<input class="cfi" id="cfRU" placeholder="Tên đăng nhập" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="24" aria-label="Tên đăng nhập">'
    +'<div class="cfh">3–24 ký tự: chữ không dấu, số và _ . -</div>'
    +'<input class="cfi" id="cfRD" placeholder="Tên hiển thị (không bắt buộc)" autocomplete="nickname" maxlength="24" aria-label="Tên hiển thị" value="'+eh(nm)+'">'
    +'<input class="cfi" id="cfRP" type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" autocomplete="new-password" maxlength="128" aria-label="Mật khẩu">'
    +'<input class="cfi" id="cfRP2" type="password" placeholder="Nhập lại mật khẩu" autocomplete="new-password" maxlength="128" aria-label="Nhập lại mật khẩu">'
    +'<div class="cfe" id="cfE" role="alert"></div>'
    +'<button type="button" class="btn end" data-cf="reg">Tạo tài khoản</button>'
    +'<div class="cfgz" id="cfGz"></div>'
    +'<button type="button" class="btn ghost acl" data-cf="x">Đóng</button></div>');
  var fill=function(){
    gFill("login");
    var closed=CF.cfg&&!CF.cfg.registerOpen,rc=$q("cfRc"),go=document.querySelector('#accBody [data-cf="reg"]');
    if(rc){rc.hidden=!closed;rc.textContent=closed?"Đăng ký tài khoản mới đang tạm đóng. Bạn vẫn có thể đăng nhập nếu đã có tài khoản.":"";}
    if(go&&closed)go.disabled=true;
  };
  fill();afterCfg("register",fill);
}
function openManage(){
  if(!CF.token||!CF.user){openLogin();return;}
  CF.view="manage";
  var me=CF.me||{google:{linked:false,email:""},hasPassword:true},g=me.google||{};
  var gl=g.linked?'<div class="cfm">Google: <b>'+eh(g.email||"đã liên kết")+'</b></div>'
      +(me.hasPassword?'<button type="button" class="btn ghost" data-cf="unlinkg">Huỷ liên kết Google</button>':'<div class="cfh" style="margin:0">Đặt mật khẩu trước khi huỷ liên kết Google.</div>')
    :'<div class="cfm">Google: chưa liên kết. Liên kết để đăng nhập nhanh bằng Google trên trang web.</div><div class="cfgz" id="cfGz"></div>';
  ovShow('<div class="pyh">Tài khoản</div><div class="cfb">'
    +'<div class="acr"><span class="acdot on"></span><div class="act" style="text-align:left"><b>'+eh(CF.user.display||CF.user.username)+'</b><small>Tên đăng nhập: '+eh(CF.user.username)+'</small></div></div>'
    +gl
    +'<div class="cfm">Mật khẩu: '+(me.hasPassword?'đã đặt':'chưa đặt (hiện chỉ đăng nhập được bằng Google)')+'</div>'
    +'<button type="button" class="btn ghost" data-cf="pw">'+(me.hasPassword?'Đổi mật khẩu':'Đặt mật khẩu')+'</button>'
    +'<div class="cfe" id="cfE" role="alert"></div>'
    +'<div class="acb"><button type="button" class="btn ghost" data-cf="logout">Đăng xuất</button><button type="button" class="btn ghost" data-cf="x">Đóng</button></div></div>');
  if(!g.linked){gFill("link");afterCfg("manage",function(){if(!$q("cfGb"))gFill("link");});}
}
function openPw(){
  if(!CF.token)return openLogin();
  CF.view="pw";var has=!CF.me||CF.me.hasPassword;
  ovShow('<div class="pyh">'+(has?'Đổi mật khẩu':'Đặt mật khẩu')+'</div><div class="acs">'+(has?'Đổi mật khẩu sẽ đăng xuất tài khoản ở các máy khác.':'Đặt mật khẩu để đăng nhập bằng tên đăng nhập '+eh(CF.user.username)+' (dùng được cả trên bản cài đặt Android).')+'</div><div class="cfb">'
    +(has?'<input class="cfi" id="cfOP" type="password" placeholder="Mật khẩu hiện tại" autocomplete="current-password" maxlength="128" aria-label="Mật khẩu hiện tại">':'')
    +'<input class="cfi" id="cfNP" type="password" placeholder="Mật khẩu mới (ít nhất 6 ký tự)" autocomplete="new-password" maxlength="128" aria-label="Mật khẩu mới">'
    +'<input class="cfi" id="cfNP2" type="password" placeholder="Nhập lại mật khẩu mới" autocomplete="new-password" maxlength="128" aria-label="Nhập lại mật khẩu mới">'
    +'<div class="cfe" id="cfE" role="alert"></div>'
    +'<button type="button" class="btn end" data-cf="pwgo">Lưu mật khẩu</button><button type="button" class="btn ghost acl" data-cf="manage">Quay lại</button></div>');
}
function doLogin(){
  var un=val("cfU").trim(),pw=val("cfP");if(!$q("cfU"))return;
  if(!un||!pw){showErr("Nhập tên đăng nhập và mật khẩu");return;}
  showErr("Đang đăng nhập...",true);busy("go");
  cfLogin(un,pw).then(function(){ovHide();say("Đã đăng nhập",2200);try{renderAcc();}catch(x){}},showErr);
}
function doRegister(){
  if(!$q("cfRU"))return;
  var u=val("cfRU").trim().toLowerCase(),d=val("cfRD").trim(),p=val("cfRP"),p2=val("cfRP2");
  if(!/^[a-z0-9_.-]{3,24}$/.test(u)){showErr("Tên đăng nhập cần 3–24 ký tự, chỉ gồm chữ không dấu, số và _ . -");return;}
  if(p.length<6){showErr("Mật khẩu cần ít nhất 6 ký tự.");return;}
  if(p!==p2){showErr("Hai lần nhập mật khẩu chưa khớp.");return;}
  showErr("Đang tạo tài khoản...",true);busy("reg");
  api("POST","/api/register",{username:u,password:p,display:d||undefined},{keep:true}).then(function(j){
    ovHide();say("Đã tạo tài khoản "+j.user.username,2600);
    return cfStart(j).then(function(){try{renderAcc();}catch(x){}});
  },function(e){if(e&&e.code==="register_closed"&&CF.cfg)CF.cfg.registerOpen=false;showErr(e);});
}
function doPw(){
  var has=!!$q("cfOP"),o=val("cfOP"),p=val("cfNP"),p2=val("cfNP2");
  if(has&&!o){showErr("Nhập mật khẩu hiện tại.");return;}
  if(p.length<6){showErr("Mật khẩu mới cần ít nhất 6 ký tự.");return;}
  if(p!==p2){showErr("Hai lần nhập mật khẩu chưa khớp.");return;}
  showErr("Đang lưu...",true);busy("pwgo");
  api("POST","/api/password",has?{password:p,old:o}:{password:p}).then(function(j){
    if(j.token)setSession(j.token,CF.user);CF.me=CF.me||{google:{linked:false,email:""}};CF.me.hasPassword=true;
    say(has?"Đã đổi mật khẩu":"Đã đặt mật khẩu",2400);openManage();
  },showErr);
}
function doUnlinkG(b){
  if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent="Bấm lần nữa để huỷ liên kết";setTimeout(function(){if(b.isConnected){b.dataset.arm="";b.textContent="Huỷ liên kết Google";}},3000);return;}
  busy("unlinkg");
  api("POST","/api/unlink/google",{}).then(function(j){CF.me=CF.me||{hasPassword:true};CF.me.google=j.google;say("Đã huỷ liên kết Google",2400);openManage();try{renderAcc();}catch(e){}},showErr);
}
/* Đăng xuất: lưu nốt lên tài khoản (nếu đang tự lưu) rồi bỏ phiên. Tiến trình trên máy giữ nguyên. */
function cfSignOut(){
  var p=HAS_ACC&&CF.token&&accLinked()&&!CF.conflict?Promise.race([accPush(),new Promise(function(r){setTimeout(r,4000);})]):Promise.resolve();
  return p.catch(function(){}).then(function(){cfLogout(false);ovHide();say("Đã đăng xuất. Tiến trình vẫn được giữ trên máy này.",2800);});
}
document.addEventListener("click",function(ev){
  var b=ev.target.closest&&ev.target.closest("[data-cf]");if(!b||b.disabled)return;
  try{if(window.SFX)SFX.play("tap");}catch(e){}
  var a=b.dataset.cf;
  if(a==="login")openLogin();
  else if(a==="register")openRegister();
  else if(a==="go")doLogin();
  else if(a==="reg")doRegister();
  else if(a==="x")ovHide();
  else if(a==="manage")openManage();
  else if(a==="pw")openPw();
  else if(a==="pwgo")doPw();
  else if(a==="unlinkg")doUnlinkG(b);
  else if(a==="usecloud")cfUseCloud();
  else if(a==="keeplocal")cfKeepLocal();
  else if(a==="later")cfLater();
  else if(a==="resolve")cfResolve();
  else if(a==="logout"){
    if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent="Chắc chắn?";setTimeout(function(){if(b.isConnected){b.dataset.arm="";b.textContent="Đăng xuất";}},2500);return;}
    b.disabled=true;cfSignOut();}
});
document.addEventListener("keydown",function(ev){
  if(ev.key!=="Enter"||!ev.target)return;var id=ev.target.id;
  if(id==="cfU"||id==="cfP"){ev.preventDefault();doLogin();}
  else if(/^cfR(U|D|P|P2)$/.test(id)){ev.preventDefault();doRegister();}
  else if(/^cf(OP|NP|NP2)$/.test(id)){ev.preventDefault();doPw();}
});
document.addEventListener("change",function(ev){if(ev.target&&ev.target.id==="cfCode"){CF.code=ev.target.value.replace(/[^a-zA-Z0-9_-]/g,"").slice(0,24);ev.target.value=CF.code;lsSet("ltd.pcode",CF.code||null);}});
CF.logout=cfLogout;
window.LTD_CF_UI={openLogin:openLogin,openRegister:openRegister,openManage:openManage,ask:cfAsk,where:gWhere,loadCfg:loadCfg};
/* ---------- khởi động: kiểm tra phiên cũ, dựng lại tài khoản ---------- */
function boot(){
  var p=CF.token?refreshMe():Promise.resolve();
  p.then(function(){try{if(typeof accBoot==="function")accBoot();}catch(e){}try{renderAcc();}catch(e){}});
}
boot();
})();
