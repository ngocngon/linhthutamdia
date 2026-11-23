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
  return fetch(CF.base+path,{method:method,headers:h,body:body!==undefined?JSON.stringify(body):undefined}).then(function(r){
    return r.json().catch(function(){return {};}).then(function(j){
      if(r.status===401&&CF.token&&!(opt&&opt.keep))cfLogout(true);
      if(!r.ok){var e=new Error(j.message||j.error||("HTTP "+r.status));e.status=r.status;e.code=j.error;throw e;}
      return j;});});
}
function say(m,ms){try{if(typeof toast==="function")toast(m,ms);}catch(e){}}

/* ---------- đăng nhập / đăng xuất ---------- */
function setSession(token,user){CF.token=token||"";CF.user=token?user:null;lsSet("ltd.cf.token",CF.token||null);lsSet("ltd.cf.user",CF.user?JSON.stringify(CF.user):null);}
function cfLogout(expired){
  var was=!!CF.token;setSession("",null);CF.rating=null;CF.lbc={};
  try{if(CF.lobby){CF.lobby.leave();CF.lobby=null;}}catch(e){}
  try{if(typeof ACC==="object"){ACC.db=null;ACC.uid=null;ACC.cloud=null;ACC.ready=true;}}catch(e){}
  if(was&&expired)say("Phiên đăng nhập đã hết hạn, hãy đăng nhập lại",3200);
  try{renderAcc();}catch(e){}
}
function cfLogin(u,p){
  return api("POST","/api/login",{username:u,password:p},{keep:true}).then(function(j){
    setSession(j.token,j.user);CF.lbc={};
    return refreshMe().then(function(){try{if(typeof accBoot==="function")accBoot();}catch(e){}return j.user;});
  });
}
function refreshMe(){
  if(!CF.token)return Promise.resolve();
  return api("GET","/api/me").then(function(j){CF.user=j.user;lsSet("ltd.cf.user",JSON.stringify(j.user));CF.rating=j.ratings&&j.ratings.online||null;}).catch(function(){});
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

/* ---------- db / user (cho đồng bộ tiến trình, giống claude.use("db")) ---------- */
function cfDb(){return {doc:function(path){
  var slot=/\/avatar$/.test(path)?"avatar":"save";
  return {
    get:function(){return api("GET","/api/save?slot="+slot).then(function(j){if(!j.blob)return {exists:false,data:function(){return null;}};var d=JSON.parse(j.blob);return {exists:true,data:function(){return d;}};});},
    set:function(obj){return api("PUT","/api/save?slot="+slot,{blob:JSON.stringify(obj)}).catch(function(e){if(e.status===401)throw {code:"not_granted"};if(e.status===413)throw {code:"too_big"};throw e;});}
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

/* ---------- giao diện đăng nhập trong khu Tài khoản ---------- */
var st=document.createElement("style");
st.textContent="#ovAcc{z-index:25}.cfb{display:flex;flex-direction:column;gap:10px}.cfi{width:100%;height:42px;border-radius:10px;border:1px solid rgba(140,160,255,.45);background:rgba(7,6,26,.75);color:#fff;font:inherit;font-size:16px;padding:0 12px;box-sizing:border-box;-webkit-user-select:text;user-select:text}.cfi::placeholder{color:#8f8ac0}.cfi:focus{outline:2px solid #3fa8ff;outline-offset:1px}.cfe{min-height:16px;font-size:12.5px;line-height:1.35;color:#ff9a9a}.cfl{display:flex;flex-direction:column;gap:4px;text-align:left;font-size:12px;color:#aab4e0}.cfb .acb .btn{min-width:0}";
document.head.appendChild(st);
function eh(s){return String(s).replace(/[&<>"']/g,function(c){return "&#"+c.charCodeAt(0)+";";});}
function cfBlock(){
  if(CF.token&&CF.user){
    var r=CF.rating&&CF.rating.games?" · hạng online "+CF.rating.rating+" ("+CF.rating.games+" ván)":"";
    return '<div class="cfb"><div class="acr"><span class="acdot on"></span><div class="act"><b>Online: '+eh(CF.user.display||CF.user.username)+'</b><small>@'+eh(CF.user.username)+r+'</small></div></div>'
      +'<label class="cfl">Mã ghép riêng (không bắt buộc, chỉ ghép với người nhập cùng mã)<input class="cfi" id="cfCode" maxlength="24" autocomplete="off" autocapitalize="none" spellcheck="false" value="'+eh(CF.code)+'" placeholder="để trống = ghép với mọi người"></label>'
      +'<div class="acb"><button type="button" class="btn ghost" data-cf="logout">Đăng xuất</button></div></div>';
  }
  return '<div class="cfb"><div class="acr"><span class="acdot"></span><div class="act"><b>Tài khoản online</b><small>Chưa đăng nhập. Tài khoản do quản trị cấp, dùng để chơi online, lên bảng xếp hạng và đồng bộ tiến trình.</small></div></div>'
    +'<div class="acb"><button type="button" class="btn end" data-cf="login">Đăng nhập</button></div></div>';
}
var _ra=typeof renderAcc==="function"?renderAcc:null;
if(_ra)renderAcc=function(){
  _ra.apply(this,arguments);
  var el=$q("accBox");if(!el)return;
  el.querySelectorAll(".acn").forEach(function(n){if(/đăng nhập Claude/.test(n.textContent))n.textContent=CF.token?"Đang kiểm tra tài khoản...":"Đăng nhập tài khoản online ở trên để liên kết và đồng bộ tiến trình.";});
  el.insertAdjacentHTML("afterbegin",cfBlock());
};
function openLogin(msg){
  var b=$q("accBody"),ov=$q("ovAcc");if(!b||!ov)return;
  b.innerHTML='<div class="pyh">Đăng nhập</div><div class="acs">Tài khoản do quản trị cấp, không có đăng ký.</div><div class="cfb">'
    +'<input class="cfi" id="cfU" placeholder="Tên đăng nhập" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="24" aria-label="Tên đăng nhập">'
    +'<input class="cfi" id="cfP" type="password" placeholder="Mật khẩu" autocomplete="current-password" maxlength="128" aria-label="Mật khẩu">'
    +'<div class="cfe" id="cfE" role="alert">'+(msg?eh(msg):"")+'</div>'
    +'<button type="button" class="btn end" data-cf="go">Đăng nhập</button><button type="button" class="btn ghost acl" data-cf="x">Đóng</button></div>';
  ov.classList.add("on");setTimeout(function(){var u=$q("cfU");if(u)u.focus();},50);
}
function doLogin(){
  var u=$q("cfU"),p=$q("cfP"),e=$q("cfE");if(!u||!p)return;
  var un=u.value.trim(),pw=p.value;if(!un||!pw){e.textContent="Nhập tên đăng nhập và mật khẩu";return;}
  e.textContent="Đang đăng nhập...";var go=document.querySelector('#accBody [data-cf="go"]');if(go)go.disabled=true;
  cfLogin(un,pw).then(function(){var ov=$q("ovAcc");if(ov)ov.classList.remove("on");say("Đã đăng nhập",2200);try{renderAcc();}catch(x){}},function(er){
    var e2=$q("cfE");if(e2)e2.textContent=er&&er.message?er.message:"Không kết nối được máy chủ";var g=document.querySelector('#accBody [data-cf="go"]');if(g)g.disabled=false;});
}
document.addEventListener("click",function(ev){
  var b=ev.target.closest&&ev.target.closest("[data-cf]");if(!b)return;
  try{if(window.SFX)SFX.play("tap");}catch(e){}
  var a=b.dataset.cf;
  if(a==="login")openLogin();
  else if(a==="go")doLogin();
  else if(a==="x"){var ov=$q("ovAcc");if(ov)ov.classList.remove("on");}
  else if(a==="logout"){
    if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent="Chắc chắn?";setTimeout(function(){b.dataset.arm="";b.textContent="Đăng xuất";},2500);return;}
    cfLogout(false);say("Đã đăng xuất",2200);}
});
document.addEventListener("keydown",function(ev){if(ev.key==="Enter"&&ev.target&&(ev.target.id==="cfU"||ev.target.id==="cfP")){ev.preventDefault();doLogin();}});
document.addEventListener("change",function(ev){if(ev.target&&ev.target.id==="cfCode"){CF.code=ev.target.value.replace(/[^a-zA-Z0-9_-]/g,"").slice(0,24);ev.target.value=CF.code;lsSet("ltd.pcode",CF.code||null);}});

/* ---------- khởi động: kiểm tra phiên cũ, dựng lại tài khoản ---------- */
function boot(){
  var p=CF.token?refreshMe():Promise.resolve();
  p.then(function(){try{if(typeof accBoot==="function")accBoot();}catch(e){}try{renderAcc();}catch(e){}});
}
boot();
})();
