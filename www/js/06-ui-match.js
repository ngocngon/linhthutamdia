/* Module 06: Giao diện bàn đấu, vòng lặp lượt chơi, kéo thả thẻ & bộ đếm giờ */
/* gpu29: trong lúc diễn một bước, bàn được vẽ theo "khung trước bước" GV (05: pvShow) cho tới khi nhịp kỹ năng bắt đầu */
function render(){if(typeof GV!=="undefined"&&GV&&GV!==G){const g=G,v=locVeiled(g);G=GV;try{veil43(GV,()=>{render0();paintZoom();},v);}finally{G=g;}return;}veil43(G,()=>{render0();paintZoom();});}
/* gpu43: trước lượt 1 (LVEIL, 03) vẽ bàn như thể cả 3 chiến địa chưa lộ diện — đặt tạm rvl=false rồi trả lại ngay trong finally (không đổi luật, không lọt vào mã băm online) */
function veil43(g,f,force){if(!(force||locVeiled(g)))return f();const sv=g.locs.map(L=>L.rvl);try{g.locs.forEach((L,i)=>{if(!(LVOPEN.g===LVEIL&&LVOPEN.g&&LVOPEN.s.has(i)))L.rvl=false;});return f();}finally{g.locs.forEach((L,i)=>{L.rvl=sv[i];});}}
/* vá bàn đấu: so từng ô với lần vẽ trước, chỉ thay ô nào đổi */
let BC=null;
function laneKey(ln){const c=ln.children;return {l:c[1].outerHTML,o:[...c[0].children].map(x=>x.className+"|"+x.innerHTML),m:[...c[2].children].map(x=>x.className+"|"+x.innerHTML)};}
function patchBoard0(html){const b=$("board"),t=document.createElement("template");t.innerHTML=html;const nl=[...t.content.children];let keys;
  try{keys=nl.map(laneKey);}catch(e){b.innerHTML=html;BC=null;return;}
  if(!BC||BC.length!==nl.length||b.children.length!==nl.length||[...b.children].some(x=>x.children.length!==3)){b.replaceChildren(...nl);BC=keys;return;}
  for(let i=0;i<nl.length;i++){const live=b.children[i],nw=nl[i],k=keys[i],c=BC[i],lc=live.children,nc=[...nw.children];
    if(live.className!==nw.className)live.className=nw.className;
    for(const [ix,key] of [[0,"o"],[2,"m"]]){const ls=lc[ix],ns=[...nc[ix].children];
      if(ls.children.length!==ns.length||c[key].length!==k[key].length){ls.replaceWith(nc[ix]);continue;}
      for(let j=0;j<ns.length;j++)if(c[key][j]!==k[key][j])ls.children[j].replaceWith(ns[j]);}
    if(c.l!==k.l)live.children[1].replaceWith(nc[1]);}
  BC=keys;}
/* patchBoard: thẻ đang lật bị dựng lại thì giữ tiếp hoạt ảnh lật, không chạy lại từ đầu */
/* gpu49: hoạt ảnh lật được đọc (flipSnap) ở ĐẦU render0, trước mọi thay đổi DOM của lần vẽ — lúc đó style còn sạch nên rẻ; trước đây đọc giữa chừng
   buộc trình duyệt tính lại style cả trang rồi lại tính lần nữa sau khi vá bàn. Chỉ hỏi khi bàn có thẻ đang lật; hỏi MỘT lần cho cả tài liệu. */
let FLS=null;
function flipSnap(){const fl=new Map();try{const ms=document.querySelectorAll("#board .mc.flip");if(!ms.length||!document.getAnimations)return fl;const st=new Set(ms);for(const a of document.getAnimations()){const el=a.effect&&a.effect.target;if(el&&st.has(el)&&!a.effect.pseudoElement&&a.playState==="running"&&/^(flip|flip3|gpuCardFlip)$/.test(a.animationName)&&!fl.has(el.dataset.mc))fl.set(el.dataset.mc,{el,t:a.currentTime||0});}}catch(e){}return fl;}
function patchBoard(html){const fl=FLS||flipSnap();FLS=null;
  patchBoard0(html);if(!fl.size)return;for(const [u,o] of fl){const n=document.querySelector(`#board [data-mc="${u}"]`);if(n&&n!==o.el&&!n.classList.contains("flip")){n.style.animationDelay=(-o.t)+"ms";n.classList.add("flip");n.addEventListener("animationend",()=>{n.style.animationDelay="";},{once:true});}}};
function render0(){
  FLS=flipSnap();
  const play=playing();
  $("meName").textContent=(store.name||"Bạn").toUpperCase();
  $("meSub").innerHTML=`${icn("gems")}${store.gems} · Bài ${G.deck.p.length}`;
  $("oppSub").textContent=`Tay ${G.hand.a.length} · Bài ${G.deck.a.length}`;
  const over=G.phase==="over";
  const shownStake=over?G.stake:Math.min(8,G.stake*Math.pow(2,G.pendingDouble||0));
  const stakeEl=$("stakeV");
  if(stakeEl.textContent!==String(shownStake)){
    const prevS=+stakeEl.textContent||1;
    stakeEl.textContent=String(shownStake);
    if(shownStake>prevS)pulse("#btnSnap",[{transform:"scale(1)"},{transform:"scale(1.42)",filter:"brightness(1.85)",offset:.38},{transform:"scale(1)"}],480);
  }
  const cube=$("btnSnap");cube.classList.toggle("hot",!!(G.snap.p||G.snap.a||G.pendingDouble));cube.disabled=!play||G.snap.p;
  {const ch=cube.querySelector(".ch");if(ch){const tx=over?"kết thúc":G.snap.p?(G.snap.a?"cược ×4":"đã cược"):"cược ×2";if(ch.textContent!==tx)ch.textContent=tx;}}
  $("finalV").innerHTML="";
  const selInst=sel?G.hand.p.find(c=>c.uid===sel):null;
  const mvF=moveSel?E.find(G,moveSel):null;
  let html="";const vl43=locVeiled(G),ua43=!vl43&&G.uatu&&G.uatu.p;
  G.locs.forEach((L,li)=>{
    let ok=false,okx=false;
    if(play&&selInst&&E.canPlay(G,"p",selInst,li)){if(selInst.id==="boxit")okx=true;else ok=true;}
    if(play&&mvF&&E.moveTargets(G,"p",moveSel).includes(li))ok=true;
    const pa=E.locPower(G,li,"a"),pp=E.locPower(G,li,"p"),ld=E.lead(G,li);
    const dg=v=>{const L=String(v).length;return L>=4?" d4":L===3?" d3":"";}; /* gpu35: số 3–4 chữ số -> nhãn ×/+ lùi ra ngoài lục giác */
    const mxb=(sd,tot)=>{let sum=0;for(const c of L.cards[sd])if(c.rev)sum+=E.power(G,c,li);if(tot===sum)return "";const r=sum>0?tot/sum:0;return `<i class="mx ${sd} ${tot>sum?"up":"down"}${dg(tot)}">${r>1&&Number.isInteger(r)?"×"+r:(tot>sum?"+":"−")+Math.abs(tot-sum)}</i>`;};
    /* gpu71 (L1): dời thẻ kiểu Marvel Snap — thẻ có lệnh dời (đang xếp G.q hoặc chờ giải G.pmv) hiện NGAY ở ô đích (sau thẻ đặt lượt này, đúng thứ tự engine đẩy vào), ô cũ trống */
    const pmv=pmvList(),mvOut=new Set(pmv.map(m=>m.uid));
    const mine=L.cards.p.filter(c=>!mvOut.has(c.uid)).map(c=>mcHTML(c,li,false)).concat(G.q.p.filter(a=>a.t==="play"&&a.li===li&&a.row==="p").map(stgHTML))
      .concat(pmv.filter(m=>m.to===li).map(m=>{const f=E.find(G,m.uid);return f&&f.inst.side==="p"?mcHTML(f.inst,li,false).replace('class="mc','class="mc qmvin'):"";}).filter(Boolean));
    const theirs=L.cards.a.map(c=>mcHTML(c,li,false)).concat(G.q.p.filter(a=>a.t==="play"&&a.li===li&&a.row==="a").map(stgHTML));
    const order=[2,3,0,1],top=["","","",""];theirs.forEach((h,i)=>{if(i<4)top[order[i]]=h;});
    const cp=E.cap(G,li),def=LOC[L.id];
    let lc="locw";if(!L.rvl)lc+=" hid";
    if(L.rvl&&!seenLoc.has(li)){seenLoc.add(li);lc+=" new";}
    if(look&&look.kind==="loc"&&look.li===li)lc+=" look";
    const lk=play&&L.lock.p===G.turn?`<div class="lk">Bạn bị khoá lượt này</div>`:play&&L.grant.p===G.turn?`<div class="lk" style="color:#9ff2ff">Được dời 1 thẻ ở đây</div>`:"";
    const offTop=i=>cp<4&&(i===0||i===1)&&!top[i]?" off":"";
    const offBot=i=>cp<4&&i>=2&&!mine[i]?" off":"";
    const hue=L.rvl?LHUE[L.id]:"#3a376e";
    const lchP=ld==="p"&&prevLd[li]!=null&&prevLd[li]!=="p",lchA=ld==="a"&&prevLd[li]!=null&&prevLd[li]!=="a";prevLd[li]=ld||"";
    html+=`<section class="lane${ok?" ok":""}${okx?" okx":""}${mvDrag&&mvDrag.T.includes(li)?" mvok":""}${ld==="p"?" lp":ld==="a"?" la":""}" data-lane="${li}">
      <div class="side opp">${top.map((h,i)=>`<div class="slot${offTop(i)}">${h}</div>`).join("")}</div>
      <div class="${lc}" style="--lc:${hue};--lg:${hue}99">
        <span class="pw a${ld==="a"?" lead":""}${lchA?" lchg":""}${dg(pa)}">${pa}</span>${mxb("a",pa)}
        <div class="loc"><div class="in"${L.rvl&&IMGL.has(L.id)?` style="--li:url(${IMGS.l[L.id]})"`:""}><div class="ln">${L.gone?"Đã bị huỷ":L.rvl?def.n:ua43?def.n:"?"}</div><div class="lt">${L.gone?"Không còn tính điểm.":L.rvl?def.s:(ua43?def.s+" · ":"")+"Lộ diện ở lượt "+(li+1)}</div>${lk}</div></div>
        <span class="pw p${ld==="p"?" lead":""}${lchP?" lchg":""}${dg(pp)}">${pp}</span>${mxb("p",pp)}
      </div>
      <div class="side me">${[0,1,2,3].map(i=>`<div class="slot${offBot(i)}">${mine[i]||""}</div>`).join("")}${mvGainHTML(li)}</div>
    </section>`;
  });
  patchBoard(html);tickPw();try{syncAmb();if(typeof syncBoardFieldVfx==="function")syncBoardFieldVfx();landDust();}catch(e){}
  let info=vl43?`<b>Chuẩn bị trận…</b> Chiến địa đang đóng, sẽ mở khi lượt 1 bắt đầu.`:(G.phase==="play"&&G.hideT===G.turn&&!G.msg?"<b>Lượt này mọi thẻ đặt xuống sẽ úp đến cuối ván</b> ("+C.sieusaokhonglo.n+").":G.msg),acts="";
  if(moveSel&&mvF){info=`<b>Dời ${C[mvF.inst.id].n}.</b> Chạm chiến địa muốn dời tới.`;acts=`<button type="button" class="ib alt" data-do="cancelmove">Thôi</button>`;}
  else if(selInst){
    let extra="";
    if(play){const any=[0,1,2].some(li=>E.canPlay(G,"p",selInst,li));
      if(!any)extra=E.cost(G,selInst)>G.energy.p?` <span class="warn">Không đủ năng lượng.</span>`:` <span class="warn">Chưa có chiến địa nào đặt được.</span>`;
      else if(selInst.id==="boxit")extra=` <span class="warn">Chạm chiến địa để đặt vào phe Máy.</span>`;}
    if(play&&selInst){acts+=`<button type="button" class="ib alt" data-do="zoomsel">🔍 Chi tiết thẻ</button>`;}
    info=cardInfo(selInst,-1,"hand")+markList(selInst,"hand").map(([i,col,t])=>`<br><span style="color:${col}">${i}</span> <i>${t}</i>`).join("")+extra;
  }else if(look){
    if(look.kind==="loc"){const L=G.locs[look.li];/* gpu68 (vis): chiến địa đang trong màn lộ diện (body[data-l51]) -> chạm xem được ngay thông tin thật */const l51=(document.body.dataset.l51||"").split(" ").includes(String(look.li))&&LOC[L.id];info=L.rvl||l51?`<b>${LOC[L.id].n}</b><br>${LOC[L.id].x}`:`<b>Chiến địa chưa lộ diện</b><br>Sẽ lộ diện ở lượt ${look.li+1}. Bạn vẫn đặt bài vào đây được.`;}
    else{
      const f=findAny(look.uid);
      if(f){
        info=cardInfo(f.inst,f.li,f.where)+markList(f.inst,f.where).map(([i,col,t])=>`<br><span style="color:${col}">${i}</span> <i>${t}</i>`).join("");
        if(f.inst.ab&&f.inst.ab!==f.inst.id&&!f.inst.sil)info+=`<br><i>Kỹ năng gốc đang mượn: ${C[f.inst.ab].x}</i>`;
        if(f.where==="board"&&f.inst.side==="p"&&f.inst.rev&&!f.inst.sil&&E.is(G,f.inst,"vitthamtu")){const dk=G.deck.p;if(EYEL!==look){EYEL=look;const u=f.inst.uid;setTimeout(()=>{try{eye7(srcPt(u),ctr($("meSub")),"XEM ĐỈNH BÀI");}catch(e){}},80);}info+=`<br><i>Thẻ trên cùng bộ bài: <b>${dk.length?C[dk[dk.length-1].id].n:"hết bài"}</b></i>`;}
        if(play&&f.where==="board"&&f.inst.side==="p"){
          if(E.queued(G,"p",f.inst.uid,"act"))acts+=`<button type="button" class="ib alt" data-do="unact">Huỷ kích hoạt</button>`;
          else if(E.canActivate(G,"p",f.inst))acts+=`<button type="button" class="ib" data-do="act">Kích Hoạt</button>`;
          if(E.queued(G,"p",f.inst.uid,"move"))acts+=`<button type="button" class="ib alt" data-do="unmove">Huỷ dời</button>`;
          else if(E.moveTargets(G,"p",f.inst.uid).length){acts+=`<button type="button" class="ib mv" data-do="move">Dời thẻ</button>`;info+=`<br><small>Kéo thẻ này thả vào chiến địa muốn dời tới (sáng viền xanh).</small>`;}
        }
      }
    }
  }
  $("infoText").innerHTML=info;$("infoAct").innerHTML=acts;
  if(!(drag&&drag.on)){$("hand").dataset.n=G.hand.p.length;$("hand").style.setProperty("--n",Math.max(1,G.hand.p.length));const hh=G.hand.p.length?G.hand.p.map((c,ix,ar)=>{const kk=ix-(ar.length-1)/2;
    const d=C[c.id],cs=E.cost(G,c),pw=handPow(c);
    const no=play&&![0,1,2].some(li=>E.canPlay(G,"p",c,li));
    const cu=cs<d.c,cd=cs>d.c,pu=pw>d.p,pd=pw<d.p; /* (6) dấu hiệu tăng/giảm trên tay: màu + mũi tên + viền sáng nhẹ */
    return `<button type="button" class="hc${c.uid===sel?" sel":""}${no?" no":""}${c.sil?" sil":""}${cu||pu?" hbf":""}${cd||pd?" hnf":""}${qCls(c.id)}" style="--i:${ix};--k:${kk};--a:${Math.abs(kk)};--hc:${HC[d.h]}${qSt(c.id)}" data-hc="${c.uid}" aria-label="${d.n}, năng lượng ${cs}${cs!==d.c?` (gốc ${d.c})`:""}, sức mạnh ${pw}${pw!==d.p?` (gốc ${d.p})`:""}">${nbL(c.id)}${art(c.id)}<span class="cst ${cu?"up":cd?"down":""}">${cs}</span><span class="pwh ${pu?"up":pd?"down":""}">${pw}</span>${cu||cd?`<i class="hda c ${cu?"up":"down"}" aria-hidden="true">${cu?"▼":"▲"}</i>`:""}${pu||pd?`<i class="hda p ${pu?"up":"down"}" aria-hidden="true">${pu?"▲":"▼"}</i>`:""}<span class="n">${nmFit(d.id)}</span>${spk(d.id)}${markBadges(c,"hand")}<i class="fl"></i></button>`;
  }).join(""):`<div class="empty">Hết bài trên tay</div>`;const he=$("hand");if(he._h!==hh||he.children.length===0){he._h=hh;he.innerHTML=hh;}}
  $("orb").textContent=String(G.energy.p);$("btnEnd").classList.toggle("nudge",!!(play&&G.phase==="play"&&!G.hand.p.some(c=>[0,1,2].some(li=>E.canPlay(G,"p",c,li)))));
  const end=$("btnEnd");
  if(over){$("endMain").textContent="VÁN MỚI";$("endSub").textContent="Chơi tiếp";end.disabled=false;}
  else if(TURN_BUSY){$("endMain").textContent="ĐANG DIỄN…";$("endSub").textContent=`${G.turn}/${E.turns(G)}`;end.disabled=true;}
  else if(G.phase==="reveal"){$("endMain").textContent="ĐANG CHỜ..";$("endSub").textContent=`${G.turn}/${E.turns(G)}`;end.disabled=true;}
  else{$("endMain").textContent="KẾT THÚC LƯỢT";end.disabled=false;}
  end.classList.toggle("wait",!!(G.online&&OL.sub));end.classList.toggle("can",!!(G.online&&OL.sub&&!OL.locked));
  if(G.online&&OL.sub&&G.phase==="play"){$("endMain").textContent=OL.locked?"ĐANG LẬT BÀI":"ĐANG CHỜ ĐỐI THỦ";end.disabled=!!OL.locked;}
  paintTimer();paintUndo();
  const rt=$("btnRetreat");rt.disabled=!play;
  const armed=play&&armRetreat>Date.now();
  rt.classList.toggle("arm",armed);const rtH=armed?`<span class="rt-arm">MẤT ${G.stake}${icn("gems")}?</span>`:"RÚT LUI";if(rt._h!==rtH){rt._h=rtH;rt.innerHTML=rtH;}
  $("btnMute").classList.toggle("off",store.mute);$("btnFx").classList.toggle("off",reduced);
}

let ddPlan=false;
/* ==================== gpu71 (L1): NÚT "BỎ QUA" — CHỈ HIỆN KHI HOẠT ẢNH CỦA MỘT LƯỢT ĐÃ CHẠY QUÁ 60 GIÂY ====================
   Người chơi chốt: KHÔNG còn chạm-màn-hình-để-tua và KHÔNG tự tua nhanh — dưới 60 s mọi hiệu ứng và câu thoại diễn đủ.
   Đếm từ lúc bấm Kết thúc lượt (lật bài, kỹ năng, cuối lượt, đầu lượt mới). Quá 60 s thì hiện nút "Bỏ qua"; bấm nút -> tua phần đang diễn
   (các mô-đun đăng ký bằng FFTURN.reg: 05 màn ra mắt/lá hiện, 15 chuỗi PA6, 16 HX vòng 3, 17 màn riêng, 18 hoạt cảnh) và phần còn lại
   của lượt chạy tốc độ tua (FFTURN.on -> các mô-đun đi đường ngắn); số liệu luôn lấy từ engine nên trạng thái cuối không đổi.
   Hết lượt: trả về tốc độ người chơi đã chọn, ẩn nút. FFTURN.skipNow(): tua phần đang diễn (móc cho test / Bảng Test VFX). */
(function () {
  "use strict";
  const FF_SPD = 0.3;
  const FF = { iv: 0, sk: 0, t0: 0, on: false, busy: false, after: 60000 };
  const REG = [];
  let btn = null;
  function showBtn(on) {
    if (on) {
      if (!btn) {
        btn = document.createElement("button"); btn.type = "button"; btn.id = "skipBtn"; btn.className = "skipbtn";
        btn.innerHTML = '<span aria-hidden="true">⏭</span> Bỏ qua'; btn.setAttribute("aria-label", "Bỏ qua hoạt ảnh còn lại của lượt này");
        btn.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); skipTurn(); });
      }
      if (!btn.isConnected) document.body.appendChild(btn);
      btn.classList.add("on"); btn.hidden = false;
    } else if (btn) { btn.classList.remove("on"); btn.hidden = true; }
  }
  /* tua phần đang diễn — đúng thứ tự cũ của các trình nghe chạm: lá hiện (05) -> chuỗi PA6 -> HX vòng 3 -> màn riêng -> hoạt cảnh -> vứt bỏ */
  function skipNow() {
    try { if (typeof topSkipAll === "function") topSkipAll(); } catch (e) { console.error(e); }
    for (const f of REG) { try { f(); } catch (e) { console.error(e); } }
    try { if (typeof DCB !== "undefined" && DCB) DCB.skip(true); } catch (e) {}
    /* gpu71 int: tuyệt kỹ diện rộng S5 (19-mass) + màn vứt bỏ/tiêu huỷ (19-mo) cũng tua bằng nút */
    try { if (window.MASS && MASS.skip) MASS.skip(); } catch (e) { console.error(e); }
    try { if (window.MO && MO.skip) MO.skip(); } catch (e) { console.error(e); }
    /* màn ra mắt đang mở (UC) KHÔNG cắt ngang: chuỗi PA6 tự thu [A] khi tới lượt; sau khi bấm nút, màn ra mắt kế tiếp đi đường ngắn (FFTURN.on) */
    /* chuỗi kết thúc trận (showEnd): bước hiện tại có s.skip -> nút "Bỏ qua" cũng tua (chuỗi nên bọc bằng FFTURN.start/stop để có mốc 60 s) */
    try { if (typeof ES !== "undefined" && ES && ES.skip && ES.g0 === G) ES.skip(); } catch (e) {}
  }
  function engage() {
    if (FF.on) return;
    const old = SPD;
    FF.on = true;
    if (old <= FF_SPD) return;
    SPD = FF_SPD;
    /* hoạt ảnh đang chạy dở cũng tăng tốc theo (chỉ hoạt ảnh có hồi kết, không đụng hào quang lặp vô hạn) */
    try {
      for (const a of document.getAnimations()) {
        const t = a.effect && a.effect.getTiming && a.effect.getTiming();
        if (t && isFinite(t.iterations) && a.playState === "running") a.playbackRate = a.playbackRate * (old / FF_SPD);
      }
    } catch (e) {}
  }
  function skipTurn() {
    if (!FF.busy) return false;
    showBtn(false);
    engage();
    skipNow();
    try { SFX.play("tap"); } catch (e) {}
    /* các màn bắt đầu sau khi bấm (bước sau của lượt) cũng tua luôn */
    clearInterval(FF.sk); FF.sk = setInterval(skipNow, 250);
    return true;
  }
  /* start(true): chuỗi kết thúc trận giữ đồng hồ 60 s (stop() thường của endTurnUI không tắt; chỉ stop(true) khi chuỗi xong / ván mới) */
  function start(hold) {
    if (FF.on) { try { SPD = SPDV[store.spd] || 1; } catch (e) { SPD = 1; } }
    FF.hold = !!hold;
    FF.t0 = performance.now(); FF.on = false; FF.busy = true; clearInterval(FF.iv); clearInterval(FF.sk); FF.sk = 0; showBtn(false);
    let hid = 0, h0 = 0;
    FF.iv = setInterval(() => {
      /* thời gian ẩn tab không tính */
      if (document.hidden) { if (!h0) h0 = performance.now(); return; }
      if (h0) { hid += performance.now() - h0; h0 = 0; }
      if (!FF.on && performance.now() - FF.t0 - hid > FF.after && !(btn && btn.classList.contains("on"))) showBtn(true);
    }, 200);
  }
  function stop(force) {
    if (FF.hold && !force) return;
    FF.hold = false;
    clearInterval(FF.iv); FF.iv = 0; clearInterval(FF.sk); FF.sk = 0; FF.busy = false;
    if (FF.on) { FF.on = false; try { SPD = SPDV[store.spd] || 1; } catch (e) { SPD = 1; } }
    showBtn(false);
  }
  /* endTurnUI (06) và onlineResolve (05) bọc phần diễn của lượt bằng start/stop */
  window.FFTURN = {
    start, stop, skipNow, skip: skipTurn,
    reg(f) { if (typeof f === "function") REG.push(f); },
    get on() { return FF.on; }, get busy() { return FF.busy; },
    get btnOn() { return !!(btn && btn.classList.contains("on")); },
    get after() { return FF.after; }, set after(v) { FF.after = Math.max(0, +v || 0); } /* chỉ cho test */
  };
})();

/* fix55: một lượt chỉ được diễn một lần — bấm lại khi đang diễn (TURN_BUSY) thì bỏ qua; nút hiện "ĐANG DIỄN…", tay bài khoá, đồng hồ đứng tới hết băng "LƯỢT n" */
async function endTurnUI(auto){if(TURN_BUSY||!G||G.phase!=="play")return;TURN_BUSY=true;FFTURN.start();try{return await endTurnRun(auto);}finally{FFTURN.stop();TURN_BUSY=false;if(G&&G.phase==="play"){tLast=0;render();}}}
async function endTurnRun(auto){
  if(!G||G.phase!=="play")return;
  if(LVEIL===G){LVEIL=null;render();} /* gpu43: kết thúc lượt khi màn mở đầu chưa xong -> mở che ngay */
  if(G.online){onlineEnd();return;}
  sel=look=moveSel=null;
  if(!auto){G.cnt.missed=0;missNote="";}
  /* (0) Nếu vừa đặt/rút thẻ tức thì, chờ hoạt ảnh đặt thẻ (165ms) đáp xuống hoàn tất trước khi úp bài */
  if(!reduced&&window._placeLockUntil){
    const rem=window._placeLockUntil-performance.now();
    if(rem>8){const g0=G;await new Promise(r=>setTimeout(r,rem));if(G!==g0||G.phase!=="play")return;} /* ván đã đổi/kết thúc trong lúc chờ -> bỏ lệnh cũ */
    window._placeLockUntil=0;
  }
  if(E.aiWantsRetreat(G,"a")){E.finish(G,"retreatA");showEnd();return;}
  if(!ddPlan)aiMove("a");ddPlan=false;
  const myStaged=G.q.p.filter(a=>a.t==="play").map(a=>a.uid);
  const foeHad=new Set();for(let i=0;i<3;i++)for(const c of G.locs[i].cards.a)foeHad.add(c.uid);
  const steps=E.beginReveal(G);
  /* (1) PHA ÚP BÀI & KHÓA LƯỢT TUẦN TỰ: Úp thẻ mình (140ms + 40ms/thẻ) -> Hạ thẻ đối thủ (160ms + 50ms/thẻ) */
  G.msg="Hai bên đã đặt bài. Đang lật…";render();
  const myDur=(!reduced&&typeof window.gpuFlipDownMine==="function")?window.gpuFlipDownMine(myStaged):0;
  const foeDur=(!reduced&&typeof window.gpuDropFoeStaged==="function")?window.gpuDropFoeStaged(foeHad,myDur):0;
  SFX.play("place");
  await sleep(reduced?45:Math.max(180,myDur+foeDur+35));
  /* (2) PHA LẬT BÀI & TUNG CHIÊU TUẦN TỰ TỪNG THẺ MỘT: Thẻ trước xong 100% (FX_UNTIL) mới sang thẻ sau */
  for(const st of steps){
    const R0=rects0(),P0=powers(),G0=pvSnap();
    const did=E.doStep(G,st);
    if(!did&&!G.msgs.length)continue;
    const evs=G.evs.slice();await artReady12(evs);
    if(G.msgs.length)G.msg=fmt(G.msgs);
    stepFx(G0,evs,R0,P0); /* gpu29: thẻ lật + màn ra mắt trên "khung trước bước"; kết quả kỹ năng chỉ hiện khi đòn trúng */
    const hasFlip=evs.some(e=>e.k==="flip"),hasMore=evs.some(e=>e.k!=="flip");
    await sleep(reduced?65:hasFlip?(hasMore?720:440):480);
  }
  /* (3) PHA CUỐI LƯỢT TUẦN TỰ TỪNG THẺ / CHIẾN ĐỊA / NHIỆM VỤ MỘT */
  for(const st of E.beginEndTurn(G)){
    const R0=rects0(),P0=powers(),G0=pvSnap();
    const did=E.stepEndTurn(G,st);
    if(!did&&!G.msgs.length&&!G.evs.length)continue;
    const evs=G.evs.slice();await artReady12(evs);
    if(G.msgs.length)G.msg=`<b>Cuối lượt:</b> `+G.msgs.slice(0,4).join(" · ");
    stepFx(G0,evs,R0,P0);
    await sleep(reduced?65:(window.HXG&&HXG.eotFast&&HXG.eotFast(evs))?300:480); /* gpu62 (HX-20): thẻ Hồn Xuất loé hồn Cuối Lượt -> nhịp ngắn hơn */
  }
  pvApply();E.finishEndTurn(G);
  if(G.turn>=E.turns(G)){await endReveal(G);E.finish(G,"end");showEnd();return;}
  /* (4) PHA ĐẦU LƯỢT MỚI TÁCH 4 NHỊP RÕ RÀNG: (4a) Lộ diện Chiến Địa -> (4b) Rút bài & Đầu lượt -> (4c) Cược Snap / Vô Uý -> (4d) Băng hiệu Lượt */
  {
    const R0=rects0(),P0=powers(),H0=new Map(HAND0);E.startTurn(G);
    const evs=G.evs.slice(),locEvs=evs.filter(e=>e.k==="loc"),drawEvs=evs.filter(e=>e.k!=="loc");
    const aiSnap=E.aiWantsSnap(G,"a");
    if(aiSnap){G.snap.a=true;G.pendingDouble++;}
    let vouySee=false;
    G.msg=missNote+turnMsg(G.msgs.slice(0,4));missNote="";resetTimer(true);
    if(aiSnap)G.msg=`<b>Máy đã cược!</b> Mức cược tăng lên ${Math.min(8,G.stake*Math.pow(2,G.pendingDouble))} ngọc. Rút lui ngay thì chỉ mất ${G.stake} ${icn("gems")}.<br>`+G.msg;
    if(G.turn===5&&E.boardCards(G,"p").some(([c])=>!c.sil&&E.is(G,c,"vouy"))){aiMove("a");ddPlan=true;vouySee=true;const ps=G.q.a.filter(a=>a.t==="play").map(a=>`${C[a.inst.id].n} vào ${G.locs[a.li].rvl?LOC[G.locs[a.li].id].n:"chiến địa "+(a.li+1)}`);G.msg+=`<br><b>Vô Uý thấy trước:</b> máy sẽ đặt ${ps.length?ps.join(", "):"không thẻ nào"}.`;}
    if(window.BGM)BGM.syncGame(G);
    render();const nh40=hideNewHand40(H0); /* gpu40: lá vừa rút chưa hiện trên tay cho tới nhịp rút bài (bay từ bộ bài vào, mặt trước) */
    /* (4a) Mở Chiến Địa mới (LOC_OPEN: một lần lật + giữ tên để đọc) */
    if(locEvs.length){playFx(locEvs,R0,P0);await sleep(reduced?80:locWait51(locEvs.length));}
    /* (4b) Rút bài đầu lượt & kỹ năng Đầu Lượt (520ms+) */
    if(drawEvs.length){HAND0=H0;playFx(drawEvs,R0,P0);await sleep(reduced?60:520);}else if(nh40){drawNew40(H0);await sleep(reduced?40:320);}
    /* (4c) Máy cược Snap (980ms) hoặc Vô Uý nhìn thấu (820ms) */
    if(aiSnap){const q=ctr($("btnSnap"));FX.ring(q.x,q.y,"#ff4d7d",90,6);SFX.play("snap");snapFx("#ff4d7d","×"+Math.min(8,G.stake*Math.pow(2,G.pendingDouble)),"a");await sleep(reduced?70:Math.round(1000/SPD));}
    if(vouySee){try{const v=E.boardCards(G,"p").find(([c])=>!c.sil&&E.is(G,c,"vouy"));if(v)eye7(srcPt(v[0].uid),ctr($("avFoe")),"THẤY TRƯỚC");}catch(e){}await sleep(reduced?60:820);}
    /* (4d) Băng hiệu Lượt mới + xung nhịp Quả cầu năng lượng (780ms) */
    const isFinalTurn=G.turn===E.turns(G);
    banner(isFinalTurn?"LƯỢT CUỐI!":`LƯỢT ${G.turn}/${E.turns(G)}`,"");
    pulse("#orb",[{transform:"scale(1.42)",filter:"brightness(2.2)"},{transform:"scale(1)",filter:"brightness(1)"}],440);
    await sleep(reduced?50:780);
    if(G.agatha&&G.agatha.p&&G.turn%2===0&&G.phase==="play"){E.aiPlan(G,"p",200);G.msg="<b>Lão Phù Thuỷ điều khiển lượt này.</b><br>"+G.msg;render();setTimeout(()=>endTurnUI(true),reduced?240:520);}
  }
}
/* ===== gpu47: KẾT THÚC VÁN gọn, thanh lịch =====
   (1) Chốt lần lượt từng chiến địa (~0,6 s/địa): nửa bên thắng sáng dịu (vàng nếu ta, đỏ hồng nếu địch), số tổng sức mạnh bên thắng phóng nhẹ, bên thua tối đi.
   (2) Biểu ngữ CHIẾN THẮNG / THẤT BẠI / HOÀ: scale+fade mượt, một vệt sáng quét, giữ ~1,5 s; thắng có vài hạt vàng rơi chậm, thua tông lạnh không hạt.
   (3) Bảng tổng kết chỉ còn thông tin chính: kết quả, tỉ số chiến địa, 3 dòng chiến địa, ngọc ±N, thưởng, dòng riêng của chế độ, 3 nút.
   Chạm (hoặc Enter/Space/Esc) để tua sang bước kế. Thời lượng theo SPD (mức mặc định 2.0 = thời lượng gốc), FXLV 0: không hạt, body.rm: hiện thẳng bảng tổng kết.
   Hoạt ảnh chỉ đổi transform/scale/opacity (WAAPI). Mọi hẹn giờ kiểm tra g0=G: ván đã đổi thì bỏ, và endSeqKill() được gọi khi vào ván mới. */
let ES=null;
function endSeqKill(){const s=ES;ES=null;if(s){try{FFTURN.stop(true);}catch(e){}s.tm.forEach(clearTimeout);s.tm.length=0;s.an.forEach(a=>{try{a.cancel();}catch(e){}});s.an.length=0;if(s.lay)s.lay.remove();}
  const o=document.getElementById("ovEnd");if(o){o.classList.remove("re-anim");const f=o.querySelector(".foot");if(f)f.style.pointerEvents="";}}
function showEnd(){
  endSeqKill();
  const r=G.result;
  if(G.online)onlineOver(r);
  const md=G.mode?modeEnd(r):"";lbAdd(G.mode?G.mode.k:"rank",r);
  let ps0=null;try{ps0=PS().xp;}catch(e){}
  psAdd(r.winner==="p"?50:25);
  let psGot=0;try{if(ps0!=null)psGot=Math.max(0,PS().xp-ps0);}catch(e){}
  /* fix55: kho ngọc không bao giờ âm (luật cược giữ nguyên; thua khi còn ít ngọc hơn mức cược thì chỉ về 0) */
  if(!G.mode){if(r.winner==="p")store.gems+=r.stake;else if(r.winner==="a")store.gems=Math.max(0,(store.gems||0)-r.stake);}
  if(!(store.gems>=0))store.gems=0;
  const misGot=misTick(r),rw=r.winner==="p"?[60,40,25]:r.winner==="a"?[25,15,10]:[35,20,15];store.gold+=rw[0];store.up+=rw[1];store.tok+=rw[2];
  save();
  const W=r.winner==="p"?"p":r.winner==="a"?"a":"d",cls=W==="p"?"win":W==="a"?"lose":"draw",word=W==="p"?"CHIẾN THẮNG":W==="a"?"THẤT BẠI":"HOÀ";
  const foe=(($("foeName").textContent||"").trim())||(G.online?"Đối thủ":"Máy"); /* fix55: cùng tên với thanh trên (Hắc Phong…) */
  const t=$("resTitle");t.className="res "+cls;t.textContent=word;
  const lanes=G.locs.map((L,i)=>({i,L,pp:E.locPower(G,i,"p"),pa:E.locPower(G,i,"a"),ld:E.lead(G,i)}));
  let wp=0,wa=0;for(const x of lanes){if(x.ld==="p")wp++;else if(x.ld==="a")wa++;}
  const why=G.online&&OL.note?OL.note:r.kind==="timeoutP"?"Bạn bỏ 3 lượt liên tiếp nên bị xử thua.":r.kind==="retreatA"?foe+" thấy cửa thua nên đã rút lui.":r.kind==="retreatP"?"Bạn đã rút lui để giữ ngọc.":(G.online&&OL.note)||"";
  /* fix55: hoà số chiến địa -> phân thắng thua theo tổng sức mạnh (E.outcome) — nói rõ trên màn kết quả */
  let tie="";if(r.kind==="end"&&wp===wa&&r.winner!=="draw"){let tp=0,ta=0;for(const x of lanes){tp+=x.pp;ta+=x.pa;}tie=`Hoà chiến địa ${wp}–${wa} — ${r.winner==="p"?"thắng":"thua"} theo tổng sức mạnh ${tp}–${ta}`;}
  {const e=$("resSub"),t2=[why,tie].filter(Boolean).join(" · ");e.textContent=t2;e.hidden=!t2;}
  const lname=x=>x.L.gone?"Đã bị huỷ":x.L.rvl?LOC[x.L.id].n:"Chưa lộ diện";
  const lk=x=>x.L.gone?"d":x.ld==="p"?"w":x.ld==="a"?"l":"d";
  $("resScore").className="re47-score "+cls;
  $("resScore").innerHTML=`<div class="sd me"><b>${wp}</b><small>Bạn</small></div><i>–</i><div class="sd op"><b>${wa}</b><small>${esc(foe)}</small></div>`;
  $("resRows").innerHTML=lanes.map(x=>`<div class="re47-rr ${lk(x)}" data-re><span class="nm">${esc(lname(x))}</span><b class="sc"><em class="me">${x.pp}</em><i>–</i><em class="op">${x.pa}</em></b></div>`).join("");
  const delta=r.winner==="p"?r.stake:r.winner==="a"?-r.stake:0;
  $("btnAgain").textContent=G.mode?({draft:"Về Tuyển chọn",conq:"Về Chinh phục",jr:G.mode.slot==="jd"?"Về Thử thách ngày":"Về Hành Trình",wk:"Về Chiến Địa Biến Động",online:"Tìm trận"}[G.mode.k]||"Về chế độ"):"Ván mới";
  {const gem=!G.mode||G.mode.k==="online";
    const line=G.mode?String(md||"").split("<br>").map(p=>p.trim()).filter(p=>p&&!/Kho ngọc|đấu online/.test(p)).join(" · "):"";
    $("resGem").innerHTML=(gem?`<div class="re47-gem ${delta>0?"up":delta<0?"dn":""}" data-re><b>${delta>0?"+":delta<0?"−":""}${Math.abs(delta)}</b>${icn("gems")}</div>`:"")+
      `<div class="re47-rw" data-re><span>${icn("gold")}+${rw[0]+(misGot||0)}</span><span>${icn("tok")}+${rw[2]}</span>${psGot?`<span>+${psGot} XP</span>`:""}</div>`+
      (line?`<div class="re47-mode" data-re>${line}</div>`:"");}
  G.msg=`Ván đã kết thúc. Bấm <b>Ván mới</b> để chơi tiếp.`;
  render();
  const g0=G,snd=()=>{if(SFX.endCue&&SFX.endCue(W))return;if(W==="p")SFX.play("win");else if(W==="a")SFX.play("lose");else SFX.play("draw_game",.85);};
  const lb=$("lobby"),hid=document.hidden||(lb&&lb.classList.contains("on"));
  if(reduced){snd();$("ovEnd").classList.add("on");return;}
  const spd=SPDV[store.spd]||1,K=Math.min(1.5,Math.max(.6,spd/2)),lo=window.FXLV===0,ms=v=>Math.max(1,Math.round(v*K));
  const s=ES={g0,tm:[],an:[],lay:null,ph:0,skip:null,log:[],K};
  /* gpu71 int: chuỗi kết thúc bọc FFTURN (giữ đồng hồ 60 s) -> nút "Bỏ qua" gọi ES.skip qua FFTURN.skipNow; không chạm-để-tua */
  try{FFTURN.start(true);}catch(e){}const LG=b=>s.log.push({b,t:performance.now()});
  const T=(f,d)=>{s.tm.push(setTimeout(()=>{if(G!==g0||ES!==s){if(ES===s)endSeqKill();return;}f();},d));}; /* ván đã đổi (vào ván mới/online) -> gỡ lớp cũ, không đè ván mới */
  const A=(el,kf,o)=>{if(!el||!el.animate)return null;const a=el.animate(kf,Object.assign({fill:"both",easing:"cubic-bezier(.2,.9,.3,1)"},o));s.an.push(a);return a;};
  const go=ph=>{s.tm.forEach(clearTimeout);s.tm.length=0;s.ph=ph;PH[ph]();};
  const lay=s.lay=document.createElement("div");lay.id="endSeq";lay.className="es "+cls+(lo?" lo":"");lay.setAttribute("aria-hidden","true");
  lay.innerHTML=`<div class="es-veil"></div>`;
  document.body.appendChild(lay);document.querySelectorAll(".tbn").forEach(e=>e.remove());
  const veil=lay.querySelector(".es-veil");
  A(lay.querySelector(".es-tap"),[{opacity:0},{opacity:.7}],{duration:400,delay:ms(900)});
  /* (1) chốt một chiến địa: nửa bên thắng sáng dịu, bên thua tối đi, số tổng của bên thắng phóng nhẹ */
  const lockLane=(x,quick)=>{
    const ln=document.querySelector(`#board [data-lane="${x.i}"]`);if(!ln)return;
    const lw=ln.querySelector(".locw");if(!lw)return;
    const box=(el,c)=>{if(!el)return null;const b=el.getBoundingClientRect(),d=document.createElement("div");d.className="es-side "+c;d.style.cssText=`left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px`;lay.insertBefore(d,veil);return d;};
    const w=x.L.gone?null:x.ld,sm=ln.querySelector(".side.me"),so=ln.querySelector(".side.opp");
    if(w){A(box(w==="p"?sm:so,w==="p"?"win-me":"win-op"),[{opacity:0},{opacity:1}],{duration:quick?1:ms(380),easing:"ease-out"});
      A(box(w==="p"?so:sm,"dim"),[{opacity:0},{opacity:1}],{duration:quick?1:ms(420),easing:"ease-out"});
      A(ln.querySelector(`.pw.${w}`),quick?[{scale:"1.14"}]:[{scale:"1"},{scale:"1.3",offset:.45},{scale:"1.14"}],{duration:quick?1:ms(560),easing:"ease-out"});}
    else A(box(lw,"tie"),[{opacity:0},{opacity:1}],{duration:quick?1:ms(380),easing:"ease-out"});
    if(!quick)SFX.play("gavel",.6);
  };
  const PH=[];
  /* Bước 1 (gpu71): từng chiến địa MỘT, mỗi lượt ~3 s ở "Rất chậm": chiến địa sáng lên, tổng hai bên đếm tăng dần từ 0 tới số cuối (~1,1 s),
     rồi bên thắng nổi bật + nhãn THẮNG/THUA/HOÀ, giữ lại để đọc. Không tự tua. */
  const tally=(x,quick)=>{
    const ln=document.querySelector(`#board [data-lane="${x.i}"]`),lw=ln&&ln.querySelector(".locw");if(!lw)return;
    const b=lw.getBoundingClientRect(),w=x.L.gone?null:x.ld;
    const c=document.createElement("div");c.className="es-tally"+(w?" w-"+w:" w-d");c.style.cssText=`left:${(b.left+b.width/2).toFixed(0)}px;top:${(b.top+b.height/2).toFixed(0)}px`;
    const lab=x.L.gone?"HUỶ":w==="p"?"BẠN THẮNG":w==="a"?"ĐỊCH THẮNG":"HOÀ";
    c.innerHTML=`<small>${esc(lname(x))}</small><b><em class="me">0</em><i>–</i><em class="op">0</em></b><u>${lab}</u>`;lay.insertBefore(c,veil);
    const me=c.querySelector(".me"),op=c.querySelector(".op"),lb=c.querySelector("u");
    const fin=()=>{c._d=1;me.textContent=x.pp;op.textContent=x.pa;c.classList.add("done");lb.style.opacity=1;};
    if(quick){fin();return;}
    A(c,[{opacity:0,transform:"translate(-50%,-50%) scale(.8)"},{opacity:1,transform:"translate(-50%,-50%) scale(1)"}],{duration:ms(300),easing:"ease-out"});
    const D=ms(1100),t0=performance.now()+ms(250);
    const st=t=>{if(ES!==s||G!==g0||c._d)return;const q=Math.max(0,Math.min(1,(t-t0)/D)),e=1-Math.pow(1-q,2);me.textContent=Math.round(x.pp*e);op.textContent=Math.round(x.pa*e);if(q<1)requestAnimationFrame(st);};requestAnimationFrame(st);
    T(()=>{fin();lockLane(x,false);A(lb,[{opacity:0,transform:"scale(1.4)"},{opacity:1,transform:"scale(1)"}],{duration:ms(320),easing:"cubic-bezier(.2,.9,.3,1)"});
      A(c.querySelector(w==="p"?".me":".op"),[{scale:"1"},{scale:"1.45",offset:.4},{scale:"1.25"}],{duration:ms(520),easing:"ease-out"});},ms(250)+D+ms(60));
  };
  const LANE_MS=3000;
  PH[0]=()=>{
    if(r.kind!=="end"||hid){go(1);return;}
    s.lk=0;const t0=ms(500),step=ms(LANE_MS);
    lanes.forEach((x,k)=>T(()=>{s.lk=k+1;LG("lane"+k);tally(x,false);},t0+k*step));
    T(()=>go(1),t0+3*step+ms(300));
    s.skip=()=>{const ex=[...lay.querySelectorAll(".es-tally")];for(let k=0;k<3;k++){if(ex[k]){const e=ex[k];e._d=1;e.classList.add("done");e.querySelector(".me").textContent=lanes[k].pp;e.querySelector(".op").textContent=lanes[k].pa;e.querySelector("u").style.opacity=1;}else tally(lanes[k],true);lockLane(lanes[k],true);}SFX.play("gavel",.6);s.lk=3;go(1);};
  };
  /* Bước 2: biểu ngữ kết quả (~0,55 s vào + giữ ~1,5 s) */
  PH[1]=()=>{
    if(hid){go(2);return;}
    const sub=r.kind==="end"?"":G.online&&/kết nối/.test(OL.note||"")?(r.kind==="retreatA"?`${foe} mất kết nối`:"Bạn mất kết nối"):G.online&&/không ra bài quá/.test(OL.note||"")?(r.kind==="retreatA"?`${foe} không ra bài`:"Bạn không ra bài quá 3 phút"):r.kind==="retreatA"?`${foe} đã rút lui`:r.kind==="retreatP"?"Bạn đã rút lui":"Bỏ 3 lượt liên tiếp";
    const bn=document.createElement("div");bn.className="es-ban";
    bn.innerHTML=`<div class="es-bar"><i class="sh"></i><b>${word}</b></div>${sub?`<small>${esc(sub)}</small>`:""}`;lay.appendChild(bn);s.bn=bn;
    A(veil,[{opacity:0},{opacity:1}],{duration:ms(450),easing:"ease-out"});
    A(bn,W==="p"?[{opacity:0,transform:"scale(1.22)"},{opacity:1,transform:"scale(1)"}]:W==="a"?[{opacity:0,transform:"translateY(-16px) scale(1.04)"},{opacity:1,transform:"none"}]:[{opacity:0,transform:"scale(.9)"},{opacity:1,transform:"scale(1)"}],{duration:ms(560),easing:"cubic-bezier(.2,.8,.25,1)"});
    A(bn.querySelector(".sh"),[{transform:"translateX(-130%) skewX(-18deg)"},{transform:"translateX(430%) skewX(-18deg)"}],{duration:ms(900),delay:ms(380),easing:"ease-in-out"});
    snd();LG("result");
    if(W==="p"&&!lo){const n=Math.min(14,Math.max(8,Math.round(innerWidth/60)));
      for(let i=0;i<n;i++){const d=document.createElement("i");d.className="es-gold";lay.insertBefore(d,bn);const x=Math.random()*innerWidth,dx=(Math.random()-.5)*60,sz=.8+Math.random()*.9;
        A(d,[{transform:`translate(${x.toFixed(0)}px,${(-10).toFixed(0)}px) scale(${sz.toFixed(2)})`,opacity:0},{opacity:.85,offset:.18},{opacity:.7,offset:.75},{transform:`translate(${(x+dx).toFixed(0)}px,${(innerHeight*.75).toFixed(0)}px) scale(${sz.toFixed(2)})`,opacity:0}],
          {duration:ms(2300+Math.random()*1300),delay:ms(Math.random()*1000),easing:"linear"});}}
    T(()=>go(2),ms(560)+ms(3600)); /* gpu71: giữ biểu ngữ + giọng + nhạc hiệu (~4 s) để nghe/đọc xong */
    s.skip=()=>go(2);
  };
  /* Bước 3: biểu ngữ lui đi, bảng tổng kết hiện dần */
  PH[2]=()=>{
    if(s.bn)A(s.bn,[{opacity:1,transform:"none"},{opacity:0,transform:"translateY(-20px) scale(.96)"}],{duration:ms(300),easing:"ease-in"});
    T(()=>go(3),s.bn?ms(180):0);
    s.skip=()=>go(3);
  };
  PH[3]=()=>{
    const o=$("ovEnd"),pn=o.querySelector(".panel"),foot=o.querySelector(".foot");
    lay.style.pointerEvents="none";A(lay,[{opacity:1},{opacity:0}],{duration:ms(320),easing:"ease-out"});T(()=>{lay.remove();},ms(340));
    o.classList.add("re-anim","on");foot.style.pointerEvents="none";
    const an=[];const B=(el,kf,op)=>{const a=A(el,kf,op);if(a)an.push(a);return a;};
    B(o,[{opacity:0},{opacity:1}],{duration:ms(280),easing:"ease-out"});
    B(pn,[{opacity:0,transform:"translateY(18px) scale(.97)"},{opacity:1,transform:"none"}],{duration:ms(400)});
    B($("resTitle"),[{opacity:0,transform:"scale(1.12)"},{opacity:1,transform:"none"}],{duration:ms(420),delay:ms(140)});
    const its=[...o.querySelectorAll("[data-re]")].filter(e=>e.id!=="resTitle"&&!e.hidden);let d=ms(500),rwAt=0;LG("panel");
    for(const e of its){const isRw=e.classList.contains("re47-rw")||e.classList.contains("re47-gem");if(isRw&&!rwAt)d+=ms(500);
      B(e,[{opacity:0,transform:"translateY(8px)"},{opacity:1,transform:"none"}],{duration:ms(400),delay:d});
      if(isRw&&!rwAt){rwAt=d;T(()=>LG("reward"),d);}d+=ms(e.classList.contains("re47-rr")?550:e.classList.contains("re47-score")?700:800);} /* gpu71: từng dòng cách nhau đủ đọc */
    if(rwAt)T(()=>SFX.play("ui_reward",.5),rwAt);
    const done=()=>{if(ES!==s)return;s.ph=4;s.skip=null;try{FFTURN.stop(true);}catch(e){}o.classList.remove("re-anim");foot.style.pointerEvents="";for(const a of an){try{a.finish();a.cancel();}catch(e){}}s.guard=performance.now()+350;};
    T(()=>{LG("done");done();},d+ms(400));
    s.skip=()=>{s.tm.forEach(clearTimeout);s.tm.length=0;lay.remove();done();};
  };
  go(0);
}
/* gpu71 (L1): bỏ chạm-màn-hình-để-tua chuỗi kết thúc (người chơi chốt: không chạm để bỏ qua hoạt ảnh); chỉ còn phím Enter/Space/Esc */
document.addEventListener("pointerdown",()=>{const s=ES;if(s&&s.skip&&G!==s.g0)endSeqKill();},true);
document.addEventListener("keydown",ev=>{const s=ES;if(!s||!s.skip||G!==s.g0||s.ph>=3)return;if(ev.key==="Enter"||ev.key===" "||ev.key==="Escape"){ev.preventDefault();s.skip();}},true);
/* chạm nhanh để tua không vô tình đóng màn tổng kết (chạm nền ngoài bảng = Xem bàn) */
$("ovEnd").addEventListener("click",ev=>{const s=ES;if(s&&ev.target===ev.currentTarget&&(s.ph===3||(s.guard&&performance.now()<s.guard)))ev.stopPropagation();});
function newGame(){
  endSeqKill();try{$("ovEnd").classList.remove("on");}catch(e){}
  BC=null;TN0=0;LOCID=[];seenRev.clear();prevPow.clear();seenLoc.clear();seenStg.clear();prevLd=[];PWV={};sel=look=moveSel=null;armRetreat=0;
  const hs=Object.keys(E.PARTNER);
  const foeDeck=E.themedDeck(hs[Math.floor(Math.random()*hs.length)]);
  foeAv=foeDeck[foeDeck.length-1];$("avFoe").innerHTML=artFace(foeAv);$("avMe").innerHTML=meAv();
  {const bs=Object.keys(BACKS),ok=bs.filter(b=>uCssReady(BACKS[b][1]));const pl=ok.length?ok:bs;foeBack=pl[Math.floor(Math.random()*pl.length)];} /* gpu49: chỉ chọn mặt lưng đã tải xong (ảnh u tải lười) */
  G=E.newGame(store.deck,foeDeck);LVEIL=G;gameDeck=store.deck.join();$("foeName").textContent="MÁY";
  missNote="";resetTimer(true);
  if(window.BGM&&!$("lobby").classList.contains("on"))BGM.syncGame(G);
  G.msg=turnMsg(G.msgs.slice(0,4));
  closeAll();render();
}
function closeAll(){document.querySelectorAll(".ov.on").forEach(o=>o.classList.remove("on"));}

function chipRow(el,items,cur,attr){
  $(el).innerHTML=items.map(([k,label,col])=>`<button type="button" class="chip${cur===k?" on":""}" style="--hc:${col||"#a5a1d6"}" ${attr}="${k}">${label}</button>`).join("");
}
function deckMatches(k){
  const d=C[k];
  if(F.dang==="MINE"){if(!draft.has(k))return false;}
  else if(F.dang==="FAV"){if(!store.fav.includes(k))return false;}
  else if(F.dang==="OWN"){if(!OWN.has(k))return false;}
  else if(F.dang==="NOT"){if(OWN.has(k))return false;}
  else if(F.dang==="UPG"){if(!canUp(k))return false;}
  else if(F.dang!=="ALL"&&d.t!==F.dang)return false;
  if(F.he!=="ALL"&&d.h!==F.he)return false;
  if(F.cost&&Math.min(6,d.c)!==F.cost)return false;
  if(F.text&&!norm(d.n).includes(norm(F.text)))return false;
  return true;
}
/* gpu49: lưới thẻ vẽ theo lô (DK_B thẻ), thêm lô kế khi cuộn gần cuối — thay vì dựng cả ~510 thẻ (~11.400 phần tử) mỗi lần mở/lọc/sắp xếp.
   Danh sách đầy đủ (đã lọc + sắp xếp) nằm ở DK.ids: mũi tên trước/sau trong màn thông tin thẻ đi theo DK.ids chứ không theo phần tử DOM đã vẽ. */
const DK_B=48,DK={ids:[],n:0,full:false,fvs:new Set()};
function dkCard(k){const d=C[k],on=draft.has(k),full=DK.full,fvs=DK.fvs;
    return `<button type="button" class="gc${on?" on":""}${fvs.has(k)?" fav":""}${F.foc===k?" foc":""}${full&&!on?" dim":""}${OWN.has(k)?qCls(k):" lock"}" style="--hc:${HC[d.h]}${qSt(k)}" data-pick="${k}" aria-label="${d.n}, năng lượng ${d.c}, sức mạnh ${d.p}">${nbL(k)}${art(k)}<span class="cst">${d.c}</span><span class="pwh">${d.p}</span><span class="n">${logo(d.id)}</span>${spk(d.id)}<span class="fv">★</span><span class="ck">✓</span>${OWN.has(k)&&canUp(k)?`<span class="gup" aria-label="Có thể nâng cấp">▲</span>`:""}<span class="gi" style="--qc:${(QN[lvl(k)]||QN[0])[1]}">${OWN.has(k)?`<span class="pips">${[1,2,3,4,5,6].map(i=>`<i class="${i<=lvl(k)?"f":""}"></i>`).join("")}</span>`:"<em>Chưa có</em>"}</span></button>`;}
/* vẽ thêm thẻ cho tới khi đủ n thẻ (hoặc hết danh sách) */
function dkFill(n){const L=$("deckList"),ids=DK.ids;n=Math.min(ids.length,n);if(n<=DK.n)return;let h="";for(let i=DK.n;i<n;i++)h+=dkCard(ids[i]);DK.n=n;L.insertAdjacentHTML("beforeend",h);}
/* vẽ thêm lô cho tới khi nội dung dài tới y + 1,5 màn hình, rồi đặt vị trí cuộn */
function dkScrollSet(y){const body=$("deckList").parentElement;if(y>0){let g=0;while(DK.n<DK.ids.length&&body.scrollHeight<y+body.clientHeight*1.5&&g++<40)dkFill(DK.n+DK_B);}body.scrollTop=y;dkNear();}
/* vẽ tới thẻ k (để cuộn tới / lấy phần tử của nó) */
function dkEnsure(k){const i=DK.ids.indexOf(k);if(i>=DK.n)dkFill(Math.ceil((i+1)/DK_B)*DK_B);}
/* còn cách đáy dưới 1,5 màn hình thì vẽ thêm một lô; lặp lại ở khung kế nếu vẫn chưa đủ dài */
function dkNear(){if(DK.n>=DK.ids.length)return;const bd=$("deckList").parentElement;if(bd.scrollHeight-bd.scrollTop-bd.clientHeight<bd.clientHeight*1.5){dkFill(DK.n+DK_B);requestAnimationFrame(dkNear);}}
document.getElementById("deckList").parentElement.addEventListener("scroll",dkNear,{passive:true});
function renderDeck(keepScroll){
  $("ovDeck").classList.toggle("colmode",F.col);
  if(F.col){const lv=colLv(),nx=(Math.floor(lv/5)+1)*5,cl=clPending();$("clBar").innerHTML=`<span class="lv">Cấp ${lv}</span><span class="tr"><i style="width:${(lv%5)*20}%"></i></span><span>Mốc ${nx}</span>${cl?`<button type="button" class="ib" id="btnClaim">Nhận ${cl} thưởng</button>`:""}`;}
  if(F.col)$("deckRow").innerHTML=store.decks.map((x,i)=>tileHTML(x,i,false)).join("")+(store.decks.length<12?`<button type="button" class="dkt add" data-dk="new"><span class="dki">＋</span><b>Bộ mới</b></button>`:"");
  $("btnDelDeck").style.display=!F.col&&store.decks.length>1&&editIdx<store.decks.length?"":"none";
  $("deckCount").innerHTML=F.col?`<b>${OWN.size}/${E.COLLECT.length}</b> thẻ · ★ <b>${store.fav.length}</b>`:`<b>${draft.size}/12</b>`;
  {const nF=(F.dang!=="ALL")+(F.he!=="ALL");$("btnFilt").querySelector("span").textContent="Lọc";$("filtN").textContent=nF||"";$("btnFilt").classList.toggle("on",!!nF);
    const tags=[];if(F.cost)tags.push(["cost",(F.cost===6?"6+":F.cost)+" năng lượng"]);if(F.dang!=="ALL")tags.push(["dang",({MINE:F.col?"Trong bộ bài":"Đã chọn",OWN:"Đã có",NOT:"Chưa có",FAV:"★ Yêu thích",UPG:"▲ Nâng cấp được"})[F.dang]||DANG[F.dang]||F.dang]);if(F.he!=="ALL")tags.push(["he",HE[F.he]]);
    $("fSum").innerHTML=tags.length?tags.map(([k,t])=>`<button type="button" data-clr="${k}">${esc(t)} <b>✕</b></button>`).join("")+`<button type="button" class="all" data-clr="all">Xoá hết</button>`:"";}
  if(false)$("colStat").innerHTML=Object.keys(HE).filter(h=>h!=="PH").map(h=>`<span style="--hc:${HC[h]}">${HE[h]} <b>${E.COLLECT.filter(k=>C[k].h===h).length}</b></span>`).join("")+`<span>Thẻ phụ <b>${Object.keys(C).length-E.COLLECT.length}</b></span>`;
  $("deckTray").innerHTML=miniTray([...draft],"data-tray");
  $("deckCosts").innerHTML=[0,1,2,3,4,5,6].map(n=>`<button type="button" class="${F.cost===n?"on":""}" data-cost="${n}" aria-label="${n?"Năng lượng "+n:"Mọi năng lượng"}">${n===0?"∗":n===6?"6+":n}</button>`).join("");
  {const so=SORTS.find(x=>x[0]===store.sort)||SORTS[1],rb=(k,ic,l,on)=>`<button type="button" class="rbtn${on?" on":""}" data-rd="${k}" aria-label="${l}" aria-pressed="${!!on}"><b>${ic}</b><small>${l}</small></button>`;
   if(!$("railR").contains($("btnFilt"))){$("railR").append($("btnFilt"),$("btnSort"));}
   $("btnSort").innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/></svg><small>${so[2]}</small>`;$("btnSort").setAttribute("aria-label","Sắp xếp: "+so[2]);$("btnFilt").classList.add("rbtn");$("btnSort").classList.add("rbtn");
}
  chipRow("chipsDang",[["ALL","Mọi dạng"],["MINE",F.col?"Trong bộ bài":"Đã chọn","#3dffb4"],["OWN","Đã có","#7dff8a"],["NOT","Chưa có","#8f8ac0"],["FAV","★ Yêu thích","#ffd65a"],["UPG","▲ Nâng cấp được","#3dff8a"],["rev","Lật"],["on","Duy Trì"],["act","Kích Hoạt"],["end","Cuối Lượt"],["react","Phản Ứng"],["pas","Bị Động"],["start","Đầu Ván"],["none","Không kỹ năng"]],F.dang,"data-d");
  chipRow("chipsHe",[["ALL","Mọi hệ"]].concat(Object.keys(HE).filter(h=>h!=="PH").map(h=>[h,`${HE[h]} <small>${E.COLLECT.filter(k=>C[k].h===h).length}</small>`,HC[h]])),F.he,"data-f");
  const body=$("deckList").parentElement,y=keepScroll?body.scrollTop:0;
  const ids=sortIds(E.COLLECT.filter(deckMatches));$("filtCnt").textContent=ids.length;
  DK.ids=ids;DK.full=!F.col&&draft.size>=12;DK.fvs=new Set(store.fav);DK.n=0;
  $("deckList").innerHTML=ids.length?"":`<div class="none" style="grid-column:1/-1">Không có thẻ nào khớp bộ lọc.</div>`;
  dkFill(DK_B);dkScrollSet(y);
  const f=F.foc&&C[F.foc];
  $("deckDetail").innerHTML="";$("deckDetail").style.display="none";
  $("btnSaveDeck").disabled=draft.size!==12;
  try{syncDeckToolsUI();}catch(e){} /* thanh công cụ bộ bài (07) */
}
function toggleDraft(k){if(draft.has(k))draft.delete(k);else if(draft.size<12&&OWN.has(k))draft.add(k);}
function lhash(t){let h=2166136261;for(let i=0;i<t.length;i++)h=Math.imul(h^t.charCodeAt(i),16777619)>>>0;return h;}
const LGC={};
function logo(id){if(LGC[id])return LGC[id];const n=C[id].n,L=n.length,sz=L<=7?"s":L<=11?"m":L<=15?"l":"x";
  return LGC[id]=`<i class="lg lgz ${sz}" data-t="${n}"><b>${n}</b></i>`;}
/* gpu35 TÊN THẺ TRÊN BÀN & TAY: tối đa 2 dòng, ngắt ở dấu cách (không cắt giữa từ/dấu tiếng Việt), co ngang khi dài.
   Cỡ chữ theo cqw của chính thẻ (CSS: min(29cqw, trần px); cqw = bề ngang trong viền) nên bố cục tính bằng em không phụ thuộc kích thước thẻ:
   đo độ rộng từ bằng canvas (không đụng DOM, không reflow), một lần cho mỗi id rồi cache. Bề ngang dùng được = 100cqw ≈ 3.45em, trừ hao nét viền chữ. */
const NMF={},NMA=3.38;let NMX=null,NMR=0;
function nmW(t){if(!NMX){NMX=document.createElement("canvas").getContext("2d");NMX.font="italic 800 100px LTName,'Barlow Condensed',sans-serif";}return NMX.measureText(t).width/100+t.length*.015+.14;}
function nmFit(id){const hit=NMF[id];if(hit)return hit;const d=C[id];if(!d)return "";
  if(!NMR){try{NMR=document.fonts&&document.fonts.check("italic 800 10px LTName","ẾỨ")&&document.fonts.status==="loaded"?1:0;}catch(e){NMR=1;}if(NMR)NMX=null;} /* phông vừa sẵn: dựng lại canvas để đo đúng phông */
  const n=String(d.n).trim(),ws=n.split(/\s+/),U=s=>s.toLocaleUpperCase("vi");
  let lines=[n],need=nmW(U(n));
  if(need>NMA&&ws.length>1){let best=1e9,k=1;for(let i=1;i<ws.length;i++){const m=Math.max(nmW(U(ws.slice(0,i).join(" "))),nmW(U(ws.slice(i).join(" "))));if(m<best-.001){best=m;k=i;}}
    if(NMA/need<.9||best<=NMA){lines=[ws.slice(0,k).join(" "),ws.slice(k).join(" ")];need=best;}}
  let sx=Math.min(1,NMA/need),f=1;
  if(sx<.68){f=Math.max(.95,sx/.68);sx=Math.min(1,NMA/(need*f));}
  sx=Math.max(.56,sx);
  const t=lines.join("\n"),st=(sx<.995?`--nsx:${sx.toFixed(3)};`:"")+(f<.995?`--nf:${f.toFixed(3)};`:"");
  const h=`<i class="lg lgz nf${lines.length>1?" n2":""}"${st?` style="${st}"`:""} data-t="${esc(t)}"><b>${esc(t)}</b></i>`;
  if(NMR)NMF[id]=h;return h;}
function spk(id){return lvl(id)>=4?`<span class="spk"><i></i><i></i><i></i><i></i></span>`:"";}
/* aura v8 thay bằng v9 */
function srcN(by){if(!by||by==="?")return "hiệu ứng không rõ nguồn";if(by==="old")return "các thay đổi trước đó";if(by.slice(0,2)==="M:"){const n=modNm(by);return "luật chế độ chơi"+(n?" "+n:"");}if(by.slice(0,2)==="L:"){const L=LOC[by.slice(2)];return "chiến địa "+(L?L.n:"");}return C[by]?C[by].n:"hiệu ứng không rõ nguồn";}
/* i44: tên nguồn + phe (đối thủ) cho 1 dòng nhật ký nguồn gốc */
function srcSide(h){return h&&h.s==="a"&&h.by&&C[h.by]?" (đối thủ)":"";}
/* ===== THÔNG TIN THẺ (gpu29): kỹ năng học/chép/cướp + phân tích nguồn cộng/trừ sức mạnh & năng lượng =====
   Chỉ đọc trạng thái + siêu dữ liệu engine (abBy, lostTo, tf, abUse, hist[{k,d,by,f,w}]); phần động (Duy Trì, chiến địa)
   tách bằng cách tạm tắt từng nguồn rồi đo lại; phần không tách chính xác được ghi là "Khác". */
const cnm=id=>id&&C[id]?C[id].n:"";
const BOOK=`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" fill="currentColor" fill-opacity=".25"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" fill="currentColor" fill-opacity=".25"/></svg>`;
/* tách nguồn động: tắt LẦN LƯỢT (cộng dồn) từng nguồn đang có hiệu lực và đo phần chênh -> tổng các dòng luôn khớp đúng số đang hiện.
   Thứ tự: nguồn nhân bội (Tứ Diện Thánh/Thác Bạc...) -> thẻ đang mang kỹ năng mượn/động -> các thẻ khác -> chiến địa -> cờ toàn ván -> chính thẻ này.
   Mọi thay đổi tạm (sil, id chiến địa, cờ) được khôi phục ngay trong finally; không đụng luật. */
const MULT_IDS=["tamtuquai","thietgiap","bocapngaymoi"];
function ablate(fn,self,flags){const out=[];let base;try{base=fn();}catch(e){return out;}
  const src=[];
  for(let i=0;i<3;i++)for(const sd of E.SIDES)for(const k of G.locs[i].cards[sd]){if(!k.rev||k.sil)continue;
    let pr=2;if(k===self)pr=9;else if(MULT_IDS.some(x=>E.is(G,k,x)))pr=0;else if((k.ab&&k.ab!==k.id)||k.xab||["nguyetthach","sieudihinh"].includes(E.ab(k)))pr=1;
    src.push({pr,t:k===self?"self":"card",k,sd,off:()=>{const o=k.sil;k.sil=true;return()=>{k.sil=o;};}});}
  if(self&&!self.sil&&!src.some(x=>x.k===self)){const k=self;src.push({pr:9,t:"self",k,sd:k.side,off:()=>{const o=k.sil;k.sil=true;return()=>{k.sil=o;};}});} /* thẻ trên tay: kỹ năng của chính nó */
  for(let i=0;i<3;i++){const L=G.locs[i];if(!L.rvl||L.gone||L.id==="meadow")continue;const id=L.id;src.push({pr:id==="falls"?0:3,t:"loc",k:id,off:()=>{L.id="meadow";return()=>{L.id=id;};}});}
  for(const [lb,off] of flags||[])src.push({pr:4,t:"flag",k:lb,off});
  src.sort((a,b)=>a.pr-b.pr);
  const undo=[];let prev=base;
  try{for(const x of src){let u=null;try{u=x.off();}catch(e){}if(!u)continue;undo.push(u);let v=prev;try{v=fn();}catch(e){}if(v!==prev)out.push([x.t,x.k,prev-v,x.sd]);prev=v;}}
  finally{for(let j=undo.length-1;j>=0;j--)undo[j]();}
  return out;}
function ablLabel(a){const [t,x,,sd]=a;if(t==="loc")return ["Chiến địa "+(LOC[x]?LOC[x].n:x)+locCbNow(x),"hiệu ứng chiến địa"];if(t==="flag")return [x,"đang có hiệu lực"];
  const k=x,ab=E.ab(k),own=sd==="p"?"":" (đối thủ)",ty=C[ab].t==="on"?"Duy Trì":"đang có hiệu lực";
  if(t==="self")return ["Kỹ năng của chính thẻ này",ty];
  const mul=MULT_IDS.find(m=>E.is(G,k,m));
  let ex=[];if(k.xab||["nguyetthach","sieudihinh"].includes(ab)){try{ex=E.abs(G,k).filter(z=>z!==ab&&C[z]);}catch(e){}}
  return [C[k.id].n+(ab!==k.id&&C[ab]?" (kỹ năng "+C[ab].n+")":ex.length?" (có kỹ năng "+ex.map(cnm).join(", ")+")":"")+own,mul==="tamtuquai"?"Duy Trì áp dụng thêm 1 lần":ty];}
/* nhãn một dòng lịch sử cộng/trừ cố định */
/* gộp gpu69 (duyệt từ làn I): nguồn riêng cho luật chế độ chơi + "(do <thẻ> đổi chiến địa)" khi chiến địa do một thẻ đổi ra gây thay đổi */
function modNm(f){const k=String(f||"").replace(/^M:/,"");try{for(const r of Object.values(RELIC))if(r&&r.m&&r.m[k])return r.n;}catch(e){}return "";}
const cbTxt=h=>h&&h.cb&&C[h.cb]?" (do "+C[h.cb].n+" đổi chiến địa)":"";
function locCbNow(id){try{for(const L of G.locs)if(L.id===id&&L.cb&&C[L.cb])return " (do "+C[L.cb].n+" đổi chiến địa)";}catch(e){}return "";}
function histLabel(h,me){const f=h.f,by=h.by,sx=by&&C[by]&&by!==f&&by!==me?" ("+C[by].n+")":"";
  if(h.w==="mode"){const n=modNm(f);return "Luật chế độ chơi"+(n?": "+n:"");}
  if(h.w==="dia")return "Chiến địa "+(f&&f.slice(0,2)==="L:"&&LOC[f.slice(2)]?LOC[f.slice(2)].n:"")+cbTxt(h);
  if(h.w==="nuot"){const x=(C[by]&&C[by].x)||"",v=/hợp thể/i.test(x)?"Hợp thể":/tiêu huỷ/i.test(x)?"Thôn tính":/vứt bỏ/i.test(x)?"Nuốt":"Hấp thụ";return v+" "+(cnm(f)||"một thẻ")+sx;}
  if(h.w==="nhap")return (cnm(f)||"Một thẻ")+" hợp thể vào thẻ này";
  if(h.w==="lay")return "Lấy sức mạnh của "+(cnm(f)||"một thẻ")+sx;
  if(h.w==="x2")return "Nhân đôi sức mạnh"+(by&&C[by]&&by!==me?" ("+C[by].n+")":" (kỹ năng của thẻ này)");
  if(h.w==="thuong"){/* gộp E+I: "thuong" = cộng từ kỹ năng bị động/thưởng của thẻ f; chỉ gọi "hợp thể" khi kỹ năng f nói hợp thể */if(f&&C[f]&&/hợp thể/i.test(C[f].x||""))return "Thưởng khi hợp thể ("+(cnm(f)||"")+")";const s=srcN(f)+(f===me?" (kỹ năng của thẻ này)":h.s==="a"&&C[f]?" (đối thủ)":"");return s.charAt(0).toUpperCase()+s.slice(1);}
  const s=srcN(by)+(by===me?" (kỹ năng của thẻ này)":srcSide(h))+cbTxt(h);return s.charAt(0).toUpperCase()+s.slice(1);}
/* gộp các dòng giống nhau (cùng nguồn, cùng loại) để bảng gọn */
function histRows(inst,k){const out=[],ix={};let sum=0;
  for(const h of inst.hist||[]){if(h.k!==k||!h.d)continue;sum+=h.d;const key=(h.by||"")+"|"+(h.f||"")+"|"+(h.w||"")+"|"+(h.cb||"")+"|"+(h.d>0?"+":"-");
    const hts=h.ts||[h.t];if(ix[key]!=null){const r=out[ix[key]];r.d+=h.d;for(const t of hts)if(!r.ts.includes(t))r.ts.push(t);r.n+=h.n||1;}else{ix[key]=out.length;out.push({d:h.d,lb:histLabel(h,inst.id),ts:hts.slice(),n:h.n||1,w:h.w});}}
  return {rows:out.filter(r=>r.d),sum};}
const sgn=n=>(n>0?"+":"−")+Math.abs(n);
function bkRow(dv,t,sub,cls){return `<li${cls?` class="${cls}"`:""}><b class="${dv>0?"up":dv<0?"down":""}">${typeof dv==="number"?sgn(dv):dv}</b><span>${esc(t)}${sub?` <small>${esc(sub)}</small>`:""}</span></li>`;}
/* ---- kỹ năng: học được / chép / cướp / mất / biến thành ---- */
const ABH={chep:(f,a)=>`Đã chép kỹ năng của <b>${esc(cnm(f)||cnm(a))}</b>`,cuop:(f,a)=>`Đã cướp kỹ năng của <b>${esc(cnm(f)||cnm(a))}</b>`,
  thay:(f,a,g)=>`<b>${esc(cnm(g)||"Một hiệu ứng")}</b> thay kỹ năng bằng kỹ năng của <b>${esc(cnm(a))}</b>`,nhiem:(f,a,g)=>`Bị <b>${esc(cnm(f)||cnm(a))}</b> lây nhiễm: kỹ năng bị thay`,
  duocchep:(f,a,g)=>`<b>${esc(cnm(g)||"Một hiệu ứng")}</b> chép cho thẻ này kỹ năng của <b>${esc(cnm(f)||cnm(a))}</b>`,ngaunhien:(f,a,g)=>`Đầu Ván: nhận kỹ năng ngẫu nhiên của <b>${esc(cnm(a))}</b>`,
  tienhoa:(f,a,g)=>`<b>${esc(cnm(g)||"Tiến Hoá Sư")}</b> mở khoá tiềm năng: <b>${esc(cnm(a))}</b>`};
function abState(inst){
  const o={cur:null,head:"",extra:[],lost:"",tf:"",use:null,kind:""};if(!inst)return o;
  const a=inst.ab&&inst.ab!==inst.id&&C[inst.ab]?inst.ab:null;
  if(a){const by=inst.abBy&&inst.abBy.a===a?inst.abBy:null;o.cur=a;o.kind=by?by.k:"";o.head=by&&ABH[by.k]?ABH[by.k](by.f,a,by.g):`Đang mang kỹ năng của <b>${esc(cnm(a))}</b>`;
    if(by&&by.f&&by.f!==a&&(by.k==="chep"||by.k==="cuop"))o.head+=` <small>(kỹ năng gốc của ${esc(cnm(a))})</small>`;}
  if(!inst.sil){const a0=E.ab(inst);let L=[];try{L=E.abs(G,inst).filter(x=>x!==a0&&C[x]);}catch(e){}
    if(inst.xab)o.extra=inst.xab.filter(x=>C[x]).map(x=>[x,"ngẫu nhiên đầu ván"]);
    else if(a0==="nguyetthach"||a0==="sieudihinh"){const f=E.find(G,inst.uid);o.extra=f?L.map(x=>[x,a0==="sieudihinh"?"từ thẻ đối thủ":"từ thẻ ≤3 năng lượng tại đây"]):[];o.dyn=a0;}}
  if(inst.sil){if(inst.lostTo)o.lost=`Kỹ năng đã bị <b>${esc(cnm(inst.lostTo))}</b> cướp. Thẻ trở thành thẻ không kỹ năng, giữ nguyên sức mạnh hiện có.`;
    else o.lost=`Kỹ năng đã bị <b>${esc(srcN(inst.silBy))}</b> xoá. Thẻ giữ nguyên sức mạnh hiện có.`;}
  const tf=inst.tf;if(tf&&tf.o&&tf.o!==inst.id&&C[tf.o]){const by=tf.by&&tf.by!==tf.o&&tf.by!==inst.id?` (do ${esc(srcN(tf.by))})`:"";
    o.tf=tf.f?`Ban đầu là <b>${esc(cnm(tf.o))}</b>, đã trở thành bản sao của <b>${esc(cnm(tf.f))}</b>${by}.`:`Ban đầu là <b>${esc(cnm(tf.o))}</b>, đã bị biến thành thẻ này${by}.`;}
  if(inst.abUse&&C[inst.abUse.a])o.use=inst.abUse;
  /* i44: nhật ký nguồn gốc */
  const H=inst.hist||[];o.uses=H.filter(h=>h.k==="use"&&C[h.a]);
  const none=H.filter(h=>h.k==="ab").pop();o.none=none&&none.w==="none"&&!a?none:null;
  if(inst.cr||inst.cpOf){const by=inst.by,bn=by?srcN(by):"";o.born=(inst.cpOf&&C[inst.cpOf]?`Bản sao của <b>${esc(cnm(inst.cpOf))}</b>`+(by&&by!==inst.cpOf?`, tạo bởi <b>${esc(bn)}</b>`:""):`Được tạo ra bởi <b>${esc(by?bn:"hiệu ứng không rõ nguồn")}</b>`)+(inst.cr?"":"")+".";}
  return o;}
/* i44: các thẻ liên quan của 1 thẻ trong trận: thẻ phụ/token (LINKS) + thẻ trong nhật ký nguồn gốc (chép/dùng/biến/bản sao/tạo ra) */
function relIds(inst){const id=inst.id,out=[];const add=x=>{if(x&&C[x]&&x!==id&&!out.includes(x))out.push(x);};
  for(const x of (typeof LINKS!=="undefined"&&LINKS[id])||[])add(x);
  if(inst.ab&&inst.ab!==id)add(inst.ab);if(inst.abBy)add(inst.abBy.f);if(inst.cpOf)add(inst.cpOf);if(inst.tf){add(inst.tf.o);add(inst.tf.f);}
  if(inst.cr&&inst.by&&C[inst.by])add(inst.by);
  for(const h of inst.hist||[]){if(h.k==="use")add(h.a);else if(h.k==="ab"){add(h.a);add(h.f);}}
  if(inst.abUse)add(inst.abUse.a);
  return out;}
function relHTML(inst,cur){const L=relIds(inst);if(!L.length)return "";const all=[inst.id,...L];
  return `<div class="zrel"><small>${L.length} thẻ liên quan · thẻ phụ</small><div class="zrl">${all.map((x,i)=>{const d=C[x];return `<button type="button" class="zri${(cur||inst.id)===x?" on":""}" data-zalt="${i?x:""}" aria-label="Xem ${esc(d.n)}" aria-pressed="${(cur||inst.id)===x}"><span class="gc mini" style="--hc:${HC[d.h]}">${nbL(x)}${art(x)}<span class="cst">${d.c}</span><span class="pwh">${d.p}</span></span><em>${i?esc(d.n):"Thẻ này"}</em></button>`;}).join("")}</div></div>`;}
/* khối HTML kỹ năng cho màn chi tiết: thay cho chữ kỹ năng gốc khi kỹ năng đã đổi */
function abHTML(inst,skTxt,where){const s=abState(inst),kw=kwfx;let h="";
  if(s.tf)h+=`<div class="zab tf"><i>⇄</i><div>${s.tf}</div></div>`;
  if(s.lost)h+=`<div class="zsk lost">${kw(skTxt)}</div><div class="zab lost"><i>${s.lost.includes("cướp")?"✂":"⊘"}</i><div>${s.lost}</div></div>`;
  else if(s.cur)h+=`<div class="zab cp"><i>${BOOK}</i><div><div class="zh">${s.head}</div><div class="zx">${kw(skillText(C[s.cur]))}</div></div></div>`;
  else h+=`<div class="zsk">${kw(skTxt)}</div>`;
  if(s.extra.length)h+=`<div class="zab cp"><i>${BOOK}</i><div><div class="zh">${s.dyn?"Đang có":"Có thêm"}:</div>${s.extra.map(([x])=>`<div class="zx"><b>${esc(cnm(x))}:</b> ${kw(skillText(C[x]).replace(/^Duy Trì:\s*/,""))}</div>`).join("")}</div></div>`;
  else if(s.dyn&&where==="board"&&inst.rev)h+=`<div class="zab cp dim"><i>${BOOK}</i><div class="zh">${s.dyn==="sieudihinh"?"Hiện chưa có kỹ năng Duy Trì nào từ thẻ đối thủ.":"Hiện chưa có thẻ Duy Trì ≤3 năng lượng nào của bạn tại đây."}</div></div>`;
  if(s.none){const f=s.none.f,why={row:"thẻ này không ở hàng sau",front:"thẻ này không ở hàng sau",empty:"phía trước không có thẻ",sil:(cnm(f)||"thẻ phía trước")+" đã mất kỹ năng",hid:(cnm(f)||"thẻ phía trước")+" chưa lật",hidden:(cnm(f)||"thẻ phía trước")+" chưa lật",none:(cnm(f)||"thẻ phía trước")+" không có kỹ năng"}[s.none.why]||"";
    h+=`<div class="zab cp dim"><i>${BOOK}</i><div><div class="zh">Kỹ năng học được: <b>không có</b> <small>lượt ${s.none.t}</small></div>${why?`<div class="zx">${esc(why.charAt(0).toUpperCase()+why.slice(1))}.</div>`:""}</div></div>`;}
  if(s.uses&&s.uses.length)h+=`<div class="zab cp"><i>${BOOK}</i><div><div class="zh">Đã dùng kỹ năng của ${s.uses.length} thẻ</div>${s.uses.map(u=>{const d=C[u.a];return `<div class="zx zuse"><b>${esc(d.n)}</b> <span class="zst"><i class="c">${d.c}</i><i class="p">${d.p}</i></span> <small>lượt ${u.t}${u.by&&u.by!==inst.id&&C[u.by]?" · do "+esc(cnm(u.by)):""}</small><br>${kw(skillText(d))}</div>`;}).join("")}</div></div>`;
  else if(s.use)h+=`<div class="zab cp"><i>${BOOK}</i><div><div class="zh">Đã dùng kỹ năng Lật của <b>${esc(cnm(s.use.f))}</b> <small>lượt ${s.use.t}</small></div><div class="zx">${kw(skillText(C[s.use.a]))}</div></div></div>`;
  if(s.born)h+=`<div class="zab born"><i>✦</i><div><div class="zh">${s.born}</div></div></div>`;
  return h;}
/* ---- bảng phân tích: sức mạnh gốc + từng nguồn cộng/trừ = số đang hiện ---- */
function costFlags(inst){const s=inst.side||"p",f=[];
  if(G.costUp===G.turn)f.push([`${cnm("catnhan")||"Ma Cát"}: mọi thẻ +1 năng lượng`,()=>{const v=G.costUp;G.costUp=0;return()=>{G.costUp=v;};}]);
  if(G.costCap>=G.turn)f.push([`${cnm("songnu")||"Ba Đào Tiên"}: năng lượng tối đa 4`,()=>{const v=G.costCap;G.costCap=0;return()=>{G.costCap=v;};}]);
  if(G.swan&&G.swan[s]>=G.turn)f.push([`${cnm("thienngaden")||"Thiên Nga Đen"}: thẻ 1 năng lượng thành 0`,()=>{const v=G.swan[s];G.swan[s]=0;return()=>{G.swan[s]=v;};}]);
  if(inst.tcm&&inst.tcm.t===G.turn)f.push(["Hiệu ứng tạm thời trong lượt này",()=>{const v=inst.tcm;inst.tcm=null;return()=>{inst.tcm=v;};}]);
  if(G.mods&&G.mods.g&&G.mods.g.costm1)f.push(["Luật chế độ chơi: −1 năng lượng",()=>{const v=G.mods.g.costm1;G.mods.g.costm1=0;return()=>{G.mods.g.costm1=v;};}]);
  return f;}
function brk(inst,li,where){const d=C[inst.id],bp=E.basePow(inst);
  /* sức mạnh */
  const hp=histRows(inst,"p"),bpH=(inst.hist||[]).filter(h=>h.k==="bp").pop();
  let P="",cur=bp+inst.bonus;
  if(inst.bp!=null&&inst.bp!==d.p)P+=bkRow("="+inst.bp,"Đặt gốc thành "+inst.bp,bpH?srcN(bpH.by)+srcSide(bpH)+" · lượt "+bpH.t:"","set");
  for(const r of hp.rows)P+=bkRow(r.d,r.lb,"lượt "+r.ts.join(", ")+(r.n>1?" · ×"+r.n:""));
  if(hp.sum!==inst.bonus)P+=bkRow(inst.bonus-hp.sum,"Khác","cộng/trừ không ghi được nguồn");
  const live=(where==="board"&&inst.rev)||where==="hand";
  if(live){const fp=where==="hand"?()=>handPow(inst):()=>E.power(G,inst,li);
    try{cur=fp();}catch(e){}
    let rest=cur-(bp+inst.bonus);
    let mp=0;if(where==="board"&&E.modPow){try{mp=E.modPow(G,inst,li);}catch(e){}if(mp){P+=bkRow(mp,"Luật chế độ chơi / nâng cấp","luôn có hiệu lực");rest-=mp;}}
    for(const a of ablate(fp,inst,[])){const [lb,sub]=ablLabel(a);P+=bkRow(a[2],lb,sub,"dyn");rest-=a[2];}
    if(rest)P+=bkRow(rest,"Khác",where==="hand"?"tuỳ chiến địa / hiệu ứng cộng dồn":"hiệu ứng cộng dồn, nhân đôi","oth");}
  const pChanged=cur!==d.p||hp.rows.length||(inst.bp!=null&&inst.bp!==d.p);
  /* năng lượng */
  const hc=histRows(inst,"c");let Cc="",cc=d.c+inst.cm;
  if(where==="hand"){const fc=()=>E.cost(G,inst);try{cc=fc();}catch(e){}
    for(const r of hc.rows)Cc+=bkRow(r.d,r.lb,"lượt "+r.ts.join(", ")+(r.n>1?" · ×"+r.n:""));
    if(hc.sum!==inst.cm)Cc+=bkRow(inst.cm-hc.sum,"Khác","không ghi được nguồn");
    let rest=cc-(d.c+inst.cm);for(const a of ablate(fc,inst,costFlags(inst))){const [lb,sub]=ablLabel(a);Cc+=bkRow(a[2],lb,sub,"dyn");rest-=a[2];}
    if(rest)Cc+=bkRow(rest,"Khác","giới hạn tối thiểu/tối đa hoặc hiệu ứng cộng dồn","oth");}
  else if(hc.rows.length){for(const r of hc.rows)Cc+=bkRow(r.d,r.lb,"lượt "+r.ts.join(", "));}
  const cChanged=where==="hand"?(cc!==d.c||hc.rows.length):hc.rows.length;
  const notes=[];
  if(!pChanged&&!cChanged)return "";
  const tot=(v,base,good)=>`<b class="${v===base?"":good(v,base)?"up":"down"}">${v}</b>`;
  /* gpu38: gọn — số đang hiện đã có trên thẻ nên không lặp lại; chỉ ghi gốc + từng nguồn cộng/trừ */
  const secP=pChanged&&P?`<div class="bkp"><h5>Sức mạnh ${tot(cur,d.p,(a,b)=>a>b)} <small>gốc ${d.p}${where==="hand"?" · tính theo chiến địa giữa":""}</small></h5><ul>${P}</ul></div>`:"";
  const secC=cChanged&&Cc?`<div class="bkc"><h5>Năng lượng ${tot(cc,d.c,(a,b)=>a<b)} <small>gốc ${d.c}</small></h5><ul>${Cc}</ul></div>`:"";
  return `<div class="brk v2">${where==="hand"?secC+secP:secP+secC}${notes.length?`<p>${notes.join("<br>")}</p>`:""}</div>`;}
const NICO_SPELLS=[
  ["😈","#ff5a7a","Phép lượt này: Biến thẻ tiếp theo bạn đặt thành Tiểu Quỷ (6 sức mạnh)."],
  ["💀","#ff8a3c","Phép lượt này: Tiêu huỷ thẻ tiếp theo bạn đặt để rút 2 thẻ."],
  ["➜","#5ce6ff","Phép lượt này: Dời thẻ tiếp theo bạn đặt sang phải 1 chiến địa."],
  ["+2","#7dff96","Phép lượt này: Cộng +2 sức mạnh cho thẻ tiếp theo bạn đặt."],
  ["🌀","#c48cff","Phép lượt này: Thay đổi chiến địa nơi bạn đặt thẻ tiếp theo."],
  ["❐","#7fe8ff","Phép lượt này: Thêm bản sao của thẻ tiếp theo bạn đặt vào tay."],
  ["×2","#ffd65a","Phép lượt này: Nhân đôi sức mạnh của Tiểu Phù Sư."]
];
const HERBIE_MODES=[
  ["×2","#ff7ae6","Kích Hoạt lượt này: Nhân đôi sức mạnh thẻ này."],
  ["⚡2","#5ce6ff","Kích Hoạt lượt này: Lượt sau +2 năng lượng."],
  ["+1✦","#7dff96","Kích Hoạt lượt này: +1 sức mạnh cho 2 thẻ ở mỗi chiến địa khác."],
  ["🪨4","#ffd65a","Kích Hoạt lượt này: Triệu hồi Hòn Đá 4 sức mạnh tại đây."]
];
function questProg(c){
  if(!G||!c||c.sil)return null;
  const s=c.side||c.own||"p",abId=E.ab(c),done=!!c.done;
  if(abId==="kysituduc"){const v=Math.min(4,c.prog||0);return [v,4,done,`${v}/4`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/4 thẻ bị tiêu huỷ"}.`];}
  if(abId==="kysidichkhuyen"){const v=Math.min(3,E.boardCards(G,s).filter(([k])=>C[k.id].c>=4).length);return [v,3,done,`${v}/3`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/3 thẻ 4⚡+ trên bàn"}.`];}
  if(abId==="kysibaitu"){const v=Math.min(6,Math.max(0,(G.cnt&&G.cnt.crCost?G.cnt.crCost[s]:0)-(c.base||0)));return [v,6,done,`${v}/6`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/6 năng lượng thẻ tạo ra"}.`];}
  if(abId==="kysichienxa"){const v=Math.min(6,new Set(E.boardCards(G,s).filter(([k])=>k!==c).map(([k,kl])=>E.power(G,k,kl))).size);return [v,6,done,`${v}/6`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/6 mức sức mạnh khác nhau"}.`];}
  if(abId==="kysitudich"){let n=0;for(const sd of E.SIDES)for(const [k] of E.boardCards(G,sd))if(k.bonus<0)n-=k.bonus;const v=Math.min(5,n);return [v,5,done,`${v}/5`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/5 điểm sức mạnh bị trừ"}.`];}
  if(abId==="kysinguyetyeu"){const v=Math.min(3,E.boardCards(G,s).filter(([k])=>C[E.ab(k)].t==="none").length);return [v,3,done,`${v}/3`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/3 thẻ không kỹ năng"}.`];}
  if(abId==="kysidoibao"){const v=Math.min(2,G.usStreak?(G.usStreak[s]||0):0);return [v,2,done,`${v}/2`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/2 lượt dư năng lượng liên tiếp"}.`];}
  if(abId==="kysivuottu"){let p=E.basePow(c)+c.bonus;try{const f=E.find(G,c.uid);if(f&&c.rev)p=E.power(G,c,f.li);}catch(e){}const v=Math.min(6,Math.max(0,p));return [v,6,done,`${v}/6`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/6 sức mạnh hiện có"}.`];}
  if(abId==="khoinguyenvuong"){const v=[0,1,2].filter(x=>G.locs[x].cards[s].filter(k=>k.rev).length>=2).length;return [v,3,done,`${v}/3`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/3 chiến địa đủ ≥2 thẻ"}.`];}
  if(abId==="huyettruonglao"){const v=Math.min(3,E.boardCards(G,s).filter(([k])=>k.stl).length);return [v,3,done,`${v}/3`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/3 thẻ đã hút sức mạnh"}.`];}
  if(abId==="loantuong"){const v=Math.min(3,c.q||0);return [v,3,done,`${v}/3`,`Tiến độ Nhiệm Vụ: ${done?"Đã hoàn thành":v+"/3 thẻ Lật đã đặt"}.`];}
  if(abId==="trungphatcogiap"&&c.mkn){return [done?1:0,1,done,`⌖${c.mkn}`,done?`Nhiệm Vụ tại chiến địa ${c.mkn}: Đã hoàn thành (+1 năng lượng tối đa).`:`Đang đánh dấu chiến địa ${c.mkn}: thắng ở đó cuối lượt để +1 năng lượng tối đa.`];}
  return null;
}
const MARKS=[["surge","⚡","#7fe0ff",c=>`Được ${C.diennu?C.diennu.n:"Lôi Quang Tiên"} truyền điện: khi đặt thẻ này, thẻ trên cùng bộ bài cũng nhận −1 năng lượng, +1 sức mạnh.`],
  ["sil","⊘","#b8c0dc",c=>`Bị ${srcN(c.silBy)} vô hiệu hoá: mất kỹ năng, giữ nguyên sức mạnh hiện có.`],
  ["cr","✦","#ffd65a",c=>(c.cpOf&&C[c.cpOf]?`Bản sao của ${cnm(c.cpOf)}, tạo bởi ${srcN(c.by)}`:`Thẻ được tạo ra bởi ${srcN(c.by)}`)+" (không có sẵn trong bộ bài ban đầu)."],
  ["ab",BOOK,"#d58cff",c=>{const s=abState(c);return s.cur?s.head.replace(/<[^>]+>/g,"")+": "+skillText(C[s.cur]):"";}],
  ["lostTo","✂","#ff8fb0",c=>c.sil?`Kỹ năng đã bị ${cnm(c.lostTo)} cướp.`:""],
  ["zg","♾","#ff7ac0",()=>"Sẽ biến thành bản sao của "+C.bayxacnuotsao.n+" khi thẻ đó lật."],
  ["evil","☠","#ff4d5e",()=>"Thẻ ÁC của Lục Ác: đặt đủ 6 thẻ ÁC để hợp thể."]];
function markList(c,where,zoom){
  const r=[];
  if(!c)return r;
  if(G&&!c.sil){
    const s=c.side||c.own||"p";
    if(E.is(G,c,"chutruongnu")){
      const onBoardWait=where==="board"&&c.rev&&(G.nico&&G.nico[s]===c.uid);
      const inHandOrStaged=where!=="board"||!c.rev;
      if(inHandOrStaged||onBoardWait){
        const sp=NICO_SPELLS[(G.turn||1)%7];
        if(sp)r.push([sp[0],sp[1],onBoardWait?`Đang chờ thẻ tiếp theo bạn đặt · ${sp[2]}`:sp[2]]);
      }
    }
    if(where==="board"&&c.rev&&!c.act&&E.is(G,c,"trolymay")){
      const md=HERBIE_MODES[(((G.turn-c.turn)%4)+4)%4];
      if(md)r.push([md[0],md[1],md[2]]);
    }
    if(E.is(G,c,"bavuongmienvien")&&!c.rev){
      const n=G.shots&&G.shots[s]?G.shots[s].length:0;
      r.push(["🎯"+n,n>0?"#ffd65a":"#9fb4d8",n>0?`Đã nạp ${n} Phát Bắn sẵn sàng khai hoả khi lật.`:"Chưa nạp Phát Bắn nào (đặt thẻ vừa rút trong lượt để nạp)."]);
    }
    if(E.is(G,c,"hauduethoikhong")&&!c.act){
      const lv=c.lv||1;
      r.push(["★"+lv,"#7fe8ff",`Cấp triệu hồi hiện tại: tạo thẻ ${lv} năng lượng.`]);
    }
    if(where==="hand"&&c.dr===G.turn&&(/Rút Nhanh/i.test(C[E.ab(c)].x||"")||(G.tff&&G.tff[s]))){
      r.push(["⚡","#ffe066","Rút Nhanh đang kích hoạt trong lượt này!"]);
    }
    const qp=questProg(c);
    if(qp&&(where==="board"||qp[0]>0||E.ab(c)==="trungphatcogiap")){
      r.push([qp[2]?"✓":qp[3],qp[2]?"#7dff96":"#ffd65a",qp[4]]);
    }
  }
  const top=[];
  for(const [k,i,col,fn] of MARKS)if(c[k]){
    if(where==="board"&&(k==="cr"||k==="sil"))continue;
    if(zoom&&(k==="cr"||k==="sil"||k==="ab"||k==="lostTo"))continue; /* màn chi tiết đã có khối riêng */
    if(k==="sil"&&c.lostTo)continue;
    const t=fn(c);if(t)(k==="ab"||k==="lostTo"?top:r).push([i,col,t]);
  }
  /* thẻ có thêm kỹ năng Duy Trì động (Nguyệt Thạch, Siêu Dị Hình, Tâm Từ Đỏ) */
  if(!zoom&&G&&!c.sil&&!(c.ab&&c.ab!==c.id)){const s=abState(c);if(s.extra.length)top.push([BOOK,"#d58cff",`Đang có thêm ${s.extra.length} kỹ năng Duy Trì: ${s.extra.map(([x])=>cnm(x)).join(", ")}.`]);}
  return top.concat(r);
}
/* gpu68-audit2: HÀO QUANG THẺ MANG DẤU CHỜ KÍCH HOẠT — nhận biết ngay trên tay / trên bàn, kể cả các lượt sau:
   surge (Lôi Quang Tiên truyền điện: đặt thẻ này -> lặp lại kỹ năng), zg (Bầy Xác Nuốt Sao: sẽ hoá bản sao), evil (Lục Ác: thẻ ÁC chờ hợp thể),
   her (Kẻ Nuốt Sao Sơ Khai: thẻ được đánh dấu thừa hưởng). Chỉ CSS (opacity/transform), không JS mỗi khung. */
const AURA=[["surge","surge"],["zg","zg"],["evil","evil"]];
function auraHtml(c,where){if(window.TT&&TT.aura)return TT.aura(c,where); /* m44: hệ dấu hiệu trạng thái chung (12-dau-hieu.js) */
  if(!c||c.sil&&!c.surge)return "";for(const [k,cl] of AURA)if(c[k]&&!(k==="evil"&&c.evp))return `<i class="aur aur-${cl}" aria-hidden="true"><i></i></i>`;return "";}
function markBadges(c,where){
  return auraHtml(c,where)+markBadges0(c,where);
}
function markBadges0(c,where){
  const m=markList(c,where);
  if(c&&c.ug)m.push(["⬆"+c.ug,"#7dff8a"]); /* gpu35: huy hiệu nâng cấp vào chung cột (trước nằm dưới số sức mạnh nên bị che) */
  if(!m.length)return "";
  /* gpu35: in sẵn tối đa 4 huy hiệu + các nhãn "+N"; CSS @container theo bề ngang thẻ chọn số hiện (thẻ nhỏ 1, vừa 2, lớn 4) và nhãn +N tương ứng */
  const n=m.length,mo=k=>n>k?`<b class="mo m${k}" style="--mc:#dfe6ff">+${n-k}</b>`:"";
  return `<span class="hmk${where&&where!=="hand"?" bmk":""}${n>1?" many":""}">${m.slice(0,4).map(([i,col])=>`<i class="${i.charAt(0)==="<"?"sv":i.length>1?"w":""}" style="--mc:${col}">${i}</i>`).join("")}${mo(1)}${mo(2)}${mo(4)}</span>`;
}
function handPow(c){const b=E.basePow(c)+c.bonus,v=[];for(let li=0;li<3;li++){if(G.locs[li].gone)continue;try{v.push(E.power(G,c,li));}catch(e){v.push(b);}}if(!v.length)return b;v.sort((x,y)=>x-y);return v[Math.floor(v.length/2)];}
function meAv(){return store.avImg?`<img class="art pic" src="${store.avImg}" alt="" draggable="false">`:artFace(store.avatar);}
/* ===== tài khoản: khách + liên kết ===== */
function toast(m){let t=$("toastX");if(!t){t=document.createElement("div");t.id="toastX";t.setAttribute("role","status");document.body.appendChild(t);}t.textContent=m;t.classList.remove("on");void t.offsetWidth;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),arguments[1]||2600);}
const ACC={db:null,uid:null,ready:false,busy:false,last:"",lastAv:null,timer:0,cloud:null,ro:false,err:""};
function accA(){if(!store.acc||typeof store.acc!=="object")store.acc={gid:"",linked:false,uid:"",t:0};const a=store.acc;if(!a.gid){a.gid="K"+Math.random().toString(36).slice(2,8).toUpperCase();try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}}return a;}
function accRef(n){return ACC.db.doc("data/users/"+ACC.uid+"/"+(n||"save"));}
function accPack(){const o=JSON.parse(JSON.stringify(store));delete o.avImg;delete o.acc;return JSON.stringify(o);}
function accSum(o){if(!o)return "";const own=Array.isArray(o.own)?o.own.length:0,st=o.st||{g:0,w:0};return `<span class="gf">${icn("col")}${own} thẻ</span><span class="gf">${icn("gold")}${(o.gold|0).toLocaleString("vi-VN")}</span><span class="gf">${st.g|0} ván</span>`;}
function accTime(t){if(!t)return "chưa có";const d=new Date(t);return d.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})+" "+d.toLocaleDateString("vi-VN");}
function accCloudStore(){try{return ACC.cloud&&typeof ACC.cloud.s==="string"?JSON.parse(ACC.cloud.s):null;}catch(e){return null;}}
function accLinked(){const a=accA();return a.linked&&ACC.uid&&a.uid===ACC.uid;}
async function accBoot(){accA();
  let db=null,user=null;
  if(window.claude&&typeof claude.use==="function"){try{[db,user]=await Promise.all([claude.use("db"),claude.use("user")]);}catch(e){db=null;}}
  ACC.db=db;try{ACC.uid=db&&user?await user.id():null;}catch(e){ACC.uid=null;}
  if(ACC.db&&ACC.uid){try{const sn=await Promise.race([accRef().get(),new Promise((_,r)=>setTimeout(()=>r(new Error("timeout")),10000))]);ACC.cloud=sn.exists?sn.data():null;}catch(e){ACC.cloud=null;ACC.err="Chưa kết nối được máy chủ lưu trữ.";}}
  ACC.ready=true;renderAcc();
  const a=store.acc,cs=accCloudStore();
  if(cs&&a.uid===ACC.uid&&a.linked&&(ACC.cloud.t||0)>(a.t||0)+1000)accAsk("newer");
  else if(cs&&!a.linked&&ACC.cloud.gid!==a.gid)accAsk("found");
  else if(accLinked())accQueue();}
function accQueue(){if(!ACC.ready||ACC.ro||!accLinked())return;clearTimeout(ACC.timer);ACC.timer=setTimeout(accPush,2500);}
async function accPush(force){if(!accLinked()||ACC.ro)return;if(ACC.busy){accQueue();return;}
  const body=accPack();const av=store.avImg||"";
  if(body===ACC.last&&av===ACC.lastAv&&!force)return;
  ACC.busy=true;const t=Date.now();
  try{if(body!==ACC.last||force){if(body.length>240000)throw {code:"too_big"};await accRef().set({v:1,t,gid:store.acc.gid,s:body});ACC.last=body;ACC.cloud={v:1,t,gid:store.acc.gid,s:body};store.acc.t=t;try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}}
    if(av!==ACC.lastAv){await accRef("avatar").set({img:av.length<200000?av:""});ACC.lastAv=av;}
    ACC.err="";}
  catch(e){const c=e&&e.code;if(c==="invalid_argument"||c==="not_granted"||c==="revoked"){ACC.ro=true;ACC.err="Tài khoản này chưa có quyền lưu dữ liệu lên máy chủ. Tiến trình vẫn được lưu trên máy này.";}else if(c==="too_big"){ACC.err="Dữ liệu quá lớn để lưu.";}else{ACC.err="Chưa lưu được, sẽ thử lại.";setTimeout(accQueue,8000);}}
  ACC.busy=false;renderAcc();}
async function accLink(){if(!ACC.db||!ACC.uid){renderAcc();return;}
  if(accCloudStore()&&ACC.cloud.gid!==store.acc.gid){accAsk("found");return;}
  const a=store.acc;a.linked=true;a.uid=ACC.uid;ACC.ro=false;ACC.last="";await accPush(true);if(!ACC.ro)toast("Đã liên kết tài khoản");renderAcc();}
async function accLoadCloud(){const cs=accCloudStore();if(!cs)return;
  let av="";try{const sn=await accRef("avatar").get();if(sn.exists){const d=sn.data();if(typeof d.img==="string"&&d.img.startsWith("data:image/"))av=d.img;}}catch(e){}
  cs.avImg=av;cs.acc={gid:ACC.cloud.gid||store.acc.gid,linked:true,uid:ACC.uid,t:ACC.cloud.t||Date.now()};
  try{localStorage.setItem(KEY,JSON.stringify(cs));}catch(e){}location.reload();}
async function accUseLocal(){const a=store.acc;a.linked=true;a.uid=ACC.uid;ACC.ro=false;ACC.last="";$("ovAcc").classList.remove("on");await accPush(true);if(!ACC.ro)toast("Đã lưu dữ liệu máy này lên tài khoản");renderAcc();}
function accAsk(kind){const cs=accCloudStore();if(!cs)return;
  const head=kind==="newer"?"Có tiến trình mới hơn":"Tài khoản đã có dữ liệu";
  const sub=kind==="newer"?"Tài khoản của bạn vừa được lưu từ một máy khác. Tải bản mới đó về máy này?":"Tài khoản này đã liên kết với một bản chơi khác. Chọn bản bạn muốn giữ:";
  $("accBody").innerHTML=`<div class="pyh">${head}</div><div class="acs">${sub}</div>
  <div class="acx"><div class="acc2 cloud"><b>Trên tài khoản</b><small>Lưu lúc ${accTime(ACC.cloud.t)}</small><div class="gfs">${accSum(cs)}</div><button type="button" class="btn end" data-ac="cloud">Dùng bản này</button></div>
  <div class="acc2"><b>Trên máy này</b><small>Mã khách ${esc(store.acc.gid)}</small><div class="gfs">${accSum(store)}</div><button type="button" class="btn ghost" data-ac="local">${kind==="newer"?"Giữ bản máy này":"Dùng bản này"}</button></div></div>
  <div class="pyt">Bản không chọn sẽ bị thay thế.</div><button type="button" class="btn ghost acl" data-ac="x">Để sau</button>`;
  $("ovAcc").classList.add("on");}
$("accBody").addEventListener("click",ev=>{const b=ev.target.closest("[data-ac]");if(!b)return;const a=b.dataset.ac;SFX.play("tap");
  if(a==="cloud")accLoadCloud();else if(a==="local")accUseLocal();else $("ovAcc").classList.remove("on");});
function renderAcc(){const el=$("accBox");if(!el)return;const a=accA();let h;
  if(accLinked()){h=`<div class="acr"><span class="acdot on"></span><div class="act"><b>Đã liên kết tài khoản</b><small>${ACC.err?esc(ACC.err):ACC.busy?"Đang lưu...":"Tự lưu lên máy chủ · lần cuối "+accTime(a.t)}</small></div></div>
    <div class="acb"><button type="button" class="btn ghost" data-acc="save">Lưu ngay</button><button type="button" class="btn ghost" data-acc="unlink">Huỷ liên kết</button></div>`;}
  else{const can=ACC.db&&ACC.uid;
    h=`<div class="acr"><span class="acdot"></span><div class="act"><b>Tài khoản khách · ${esc(a.gid)}</b><small>Tiến trình đang lưu trên trình duyệt này. Liên kết để giữ tiến trình khi đổi máy hoặc xoá dữ liệu trình duyệt.</small></div></div>
    ${can?`<div class="acb"><button type="button" class="btn end" data-acc="link">Liên kết tài khoản</button></div>`:`<div class="acn">${!ACC.ready?"Đang kiểm tra tài khoản...":"Để liên kết, hãy mở game khi đã đăng nhập Claude. Bạn vẫn chơi thử bình thường, tiến trình được giữ trên máy này."}</div>`}`;
    if(ACC.err)h+=`<div class="acn">${esc(ACC.err)}</div>`;}
  el.innerHTML=h;}
$("accBox").addEventListener("click",ev=>{const b=ev.target.closest("[data-acc]");if(!b)return;const a=b.dataset.acc;SFX.play("tap");
  if(a==="link")accLink();else if(a==="save"){ACC.last="";accPush(true);}else if(a==="unlink"){if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent="Chắc chắn?";setTimeout(()=>{b.dataset.arm="";b.textContent="Huỷ liên kết";},2500);return;}store.acc.linked=false;store.acc.uid="";save();renderAcc();toast("Đã huỷ liên kết trên máy này");}});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"&&accLinked()){clearTimeout(ACC.timer);accPush();}});
setTimeout(accBoot,0);
function renderProfile(){renderAcc();
  $("avGrid").innerHTML=store.avs.map(k=>`<button type="button" class="avb${store.avatar===k?" on":""}" style="--hc:${HC[C[k].h]}" data-av="${k}" aria-label="${C[k].n}">${artFace(k)}</button>`).join("");
}
/* ---- đồng hồ lượt 90s & dây cháy Marvel Snap (chỉ cập nhật chữ mỗi giây để nhẹ DOM) ---- */
let _tPrevKey="",_tBW=0;addEventListener("resize",()=>{_tBW=0;},{passive:true});
function resetTimer(armed){tLeft=TURN_SEC;tArmed=armed;tLast=0;tBeep=0;_tPrevKey="";paintTimer();}
function paintTimer(){
  if(!G)return;
  const play=playing(),bar=$("tbar"),prog=play?Math.max(0,Math.min(1,tLeft/TURN_SEC)):0,pStr=prog.toFixed(4);
  const fill=$("tfill"),fs=`scaleX(${pStr})`;if(fill.style.transform!==fs)fill.style.transform=fs;
  /* gpu20: đốm lửa dây cháy đi bằng transform (không tính lại bố cục mỗi 0,1 giây) */
  let sp=bar._sp;if(!sp||!sp.isConnected){sp=bar._sp=document.createElement("i");sp.id="tspark";sp.setAttribute("aria-hidden","true");sp.appendChild(document.createElement("b"));bar.appendChild(sp);_tBW=0;}
  if(!_tBW)_tBW=bar.clientWidth;const tx=`translateX(${(prog*_tBW).toFixed(1)}px)`;if(sp.style.transform!==tx)sp.style.transform=tx;
  const sec=Math.max(0,Math.ceil(tLeft)),low=play&&tArmed&&sec<=15,idle=!play||!tArmed;
  const key=`${play?1:0}|${idle?1:0}|${low?1:0}|${G.turn}|${sec}`;
  if(key===_tPrevKey)return;
  _tPrevKey=key;
  bar.classList.toggle("low",low);bar.classList.toggle("idle",idle);
  $("btnEnd").classList.toggle("urgent",low);
  if(play){
    const turnLbl=G.turn===E.turns(G)?"LƯỢT CUỐI":`${G.turn}/${E.turns(G)}`;
    $("endSub").textContent=tArmed?(low?`🔥 ${sec}s · ${turnLbl}`:`${sec}s · ${turnLbl}`):turnLbl;
  }
}
function tickTimer(){
  if(G&&G.online&&OL.sub){tLast=0;if(!OL.locked)$("endSub").textContent="Chạm để hoàn tác";return;}
  if(!G||!playing()||!tArmed||document.querySelector(".ov.on,#lobby.on")){tLast=0;return;}
  const now=performance.now();if(tLast)tLeft-=(now-tLast)/1000;tLast=now;
  if(tLeft<=0){
    G.cnt.missed=(G.cnt.missed||0)+1;SFX.play("timeout");
    if(G.cnt.missed>=3){E.finish(G,"timeoutP");showEnd();return;}
    missNote=`<span class="warn"><b>Hết giờ.</b> Lượt vừa rồi bị tính là bỏ lượt (${G.cnt.missed}/3). Bỏ 3 lượt liên tiếp sẽ bị xử thua.</span><br>`;
    endTurnUI(true);return;
  }
  const sec=Math.ceil(tLeft);if(sec<=10&&sec!==tBeep){tBeep=sec;SFX.play("tick");}
  paintTimer();
}
setInterval(tickTimer,100);
let pilesSide="p";
function renderPiles(){
  const nm={p:"Bạn",a:"Đối thủ"},cnt=x=>G.disc[x].length+G.dead[x].length;
  $("pilesTabs").innerHTML=["p","a"].map(x=>`<button type="button" class="mb-tab${pilesSide===x?" on":""}" data-ps="${x}" aria-pressed="${pilesSide===x}">${nm[x]}<b>${cnt(x)}</b></button>`).join("");
  const grp=(cls,ic,title,arr)=>`<section class="mb-grp ${cls}"><h3><i>${ic}</i>${title}<b>${arr.length}</b></h3>`+(arr.length?`<div class="mb-grid">${arr.map((c,i)=>({c,n:i+1})).reverse().map(({c,n})=>`<button type="button" class="mb-c" data-zk="${c.id}" data-zu="${c.uid}" aria-label="${esc(C[c.id].n)}, thứ ${n}">${miniCard(c.id,false).replace(/^<button[^>]*>|<\/button>$/g,"")}${pileMark(c)}<em>${n}</em></button>`).join("")}</div>`:`<div class="mb-none">Chưa có thẻ nào</div>`)+`</section>`;
  $("pilesBody").innerHTML=grp("disc","↯","Vứt bỏ",G.disc[pilesSide])+grp("dead","✕","Tiêu huỷ",G.dead[pilesSide]);
}
$("pilesTabs").addEventListener("click",ev=>{const b=ev.target.closest("[data-ps]");if(!b)return;pilesSide=b.dataset.ps;SFX.play("ui_tab");renderPiles();$("pilesBody").scrollTop=0;});
$("pilesBody").addEventListener("click",ev=>{const b=ev.target.closest("[data-zk]");if(b){SFX.play("tap");const u=+b.dataset.zu,inst=u&&G?E.SIDES.map(x=>G.disc[x].concat(G.dead[x])).flat().find(c=>c.uid===u):null;openPZ(b.dataset.zk,0,inst||null);}});
/* thẻ trong Mộ: dấu hiệu nhỏ nếu thẻ đã mang kỹ năng khác / bị cướp kỹ năng / có cộng trừ */
function pileMark(c){const s=abState(c);const ic=s.cur?BOOK:s.lost&&c.lostTo?"✂":"";return ic?`<i class="mb-mk${ic==="✂"?" lost":""}" aria-hidden="true">${ic}</i>`:"";}
/* khối thông tin của một thẻ cụ thể (Mộ) cho màn phóng to ovPZ */
function pileInfoHTML(inst){if(!inst)return "";let h="";try{h=abHTML(inst,skillText(C[inst.id]),"pile");const b=brk(inst,-1,"pile");if(b)h+=b;}catch(e){h="";}return h;}

/* ---- đặt bài & rút lại siêu nhạy kiểu Marvel Snap ---- */
function recordHandOrigin(uid){
  const hc=document.querySelector(`#hand [data-hc="${uid}"]`);
  if(!hc)return;
  const r=hc.getBoundingClientRect();
  window._lastPlayOrigin={uid,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,ts:performance.now(),fromDrag:false};
}
function recordBoardOrigin(mc,uid){
  if(!mc)mc=document.querySelector(`#board [data-mc="${uid}"]`);
  if(!mc)return;
  const r=mc.getBoundingClientRect();
  window._lastUnplayOrigin={uid,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,html:mc.outerHTML,ts:performance.now()};
}

/* ---- sự kiện ---- */
document.addEventListener("pointerdown",()=>{SFX.wake();if(window.BGM){if(G&&!$("lobby").classList.contains("on"))BGM.syncGame(G);else BGM.play("lobby");}if(G&&playing()&&!tArmed&&!document.querySelector(".ov.on,#lobby.on")){tArmed=true;tLast=0;}},{passive:true});
$("board").addEventListener("click",ev=>{
  const mc=ev.target.closest("[data-mc]"),lane=ev.target.closest("[data-lane]");
  if(!lane)return;const li=+lane.dataset.lane;
  if(moveSel&&playing()){
    const f=E.find(G,moveSel);
    if(f&&f.li!==li&&E.queueMove(G,"p",moveSel,li)){look={kind:"card",uid:moveSel};moveSel=null;SFX.play("place");render();return;}
    moveSel=null;render();return;
  }
  const placeable=lane.classList.contains("ok")||lane.classList.contains("okx");
  if(mc){
    const uid=+mc.dataset.mc;
    if(playing()&&pendingPlay(uid)){if(tryUnqueue(uid,"play",mc)){look=null;sel=null;render();}return;}
    if(!(sel&&placeable)){look=look&&look.kind==="card"&&look.uid===uid?null:{kind:"card",uid};sel=null;SFX.play("tap");render();if(look&&look.uid===uid){const ci=anyC(uid);if(ci&&ci.rev&&!ci.sil&&C[E.ab(ci)]&&C[E.ab(ci)].t==="on")threads9(uid,40);}return;}
  }
  if(sel&&playing()){
    recordHandOrigin(sel);
    if(placeable&&E.queuePlay(G,"p",sel,li)){if(tLeft>0&&tLeft<7)tLeft=Math.min(TURN_SEC,tLeft+2.5);sel=null;look=null;SFX.play("place");render();return;}
    window._lastPlayOrigin=null;
    sel=null;
  }
  look=look&&look.kind==="loc"&&look.li===li?null:{kind:"loc",li};render();
});
let drag=null,noClick=0,mvDrag=null;
/* gpu71 (L1): lệnh dời của mình đang chờ (xếp trong lượt hoặc đã nộp, chưa tới bước dời) — chỉ phe mình (lệnh của đối thủ là thông tin ẩn) */
function pmvList(){if(!G)return [];const o=G.q.p.filter(a=>a.t==="move").map(a=>({uid:a.uid,to:a.to}));if(G.pmv&&G.pmv.p)for(const m of G.pmv.p)if(!o.some(x=>x.uid===m.uid))o.push(m);
  return o.filter(m=>{const f=E.find(G,m.uid);return f&&f.li!==m.to&&f.inst.side==="p";});}
/* gpu70 (mục 5): khi kéo dời thẻ, mỗi chiến địa đích hợp lệ hiện số sức mạnh thẻ sẽ được/mất ở đó ("+4"), tính bằng cách MÔ PHỎNG dời trên BẢN SAO
   trạng thái (E.clone, không đụng ván thật, không sự kiện). Màu theo ngôn ngữ P6.stat (xanh có lợi / đỏ bất lợi). Thẻ có kỹ năng "khi di chuyển" luôn hiện (kể cả +0). */
function mvGains(uid,T){const o={};try{const f0=E.find(G,uid);if(!f0)return o;const hasMv=!f0.inst.sil&&!!(E.MOVED&&E.MOVED[E.ab(f0.inst)]);
  for(const to of T){const S=E.clone(G);S.evs=null;S.msgs=null;S.q={p:[],a:[]};const f=E.find(S,uid);if(!f)continue;const p0=E.power(S,f.inst,f.li);
    if(!E.moveCard(S,f.inst,f.li,to))continue;const nl=E.locOf(S,f.inst);const d=(nl>=0?E.power(S,f.inst,nl):p0)-p0;if(d||hasMv)o[to]=d;}}catch(e){console.error(e);}return o;}
let mvSelG=null;/* bộ đệm số sẽ nhận cho cách "chạm thẻ -> Dời thẻ -> chạm chiến địa" */
function mvGainOf(li){if(mvDrag&&mvDrag.g)return mvDrag.T.includes(li)?mvDrag.g[li]:null;if(moveSel&&playing()){const T=E.moveTargets(G,"p",moveSel);if(!mvSelG||mvSelG.u!==moveSel||mvSelG.k!==G.q.p.length+":"+G.turn)mvSelG={u:moveSel,k:G.q.p.length+":"+G.turn,g:mvGains(moveSel,T)};return T.includes(li)?mvSelG.g[li]:null;}return null;}
function mvGainHTML(li){const d=mvGainOf(li);if(d==null)return "";
  return `<i class="mvgain ${d<0?"dn":"up"}" data-mvg="${li}">${d<0?"−"+Math.abs(d):"+"+d}</i>`;}
/* ===== i44 (mục 24): KÉO-THẢ DỜI THẺ TRÊN BÀN — thẻ đã lật của bạn có quyền dời (Dạ Hành, Huyền Cơ, Bà Tơ cho thẻ khác, Áo Choàng Tối, Cú Đu Tơ...)
   kéo tới đúng chiến địa muốn dời. Đích hợp lệ lấy từ E.moveTargets (khớp queueMove + chỗ trống); thẻ dời ngẫu nhiên/bị động vẫn ngẫu nhiên. ===== */
$("board").addEventListener("pointerdown",ev=>{if(drag)return;const mc=ev.target.closest(".mc[data-mc]:not(.staged):not(.back)");if(!mc||!G||!playing()||(G.online&&OL.sub))return;
  const uid=+mc.dataset.mc,f=E.find(G,uid);if(!f||f.inst.side!=="p"||!f.inst.rev)return;
  /* gpu71: thẻ đã có lệnh dời (lệnh mới nhất) kéo lại được: sang chiến địa khác = đổi lệnh, về chiến địa gốc = huỷ dời */
  let T,re=null;const qm=E.queued(G,"p",uid,"move");
  if(qm){if(!E.canUnqueue(G,"p",uid,"move"))return;E.unqueue(G,"p",uid,"move");T=E.moveTargets(G,"p",uid);E.queueMove(G,"p",uid,qm.to);re={to:qm.to,from:f.li};T=T.filter(l=>l!==qm.to).concat([f.li]);}
  else T=E.moveTargets(G,"p",uid);
  if(!T.length)return;
  const r=mc.getBoundingClientRect();drag={mv:true,uid,T,re,x:ev.clientX,y:ev.clientY,on:false,html:mc.outerHTML,w:r.width,h:r.height,el:mc,pid:ev.pointerId};
  /* gpu70: cảm ứng — giữ con trỏ trên thẻ (setPointerCapture) để pointermove/up tới đủ khi ngón tay rời thẻ; thẻ có .mvable (touch-action:none) nên trang không cuộn/phóng */
  try{mc.setPointerCapture(ev.pointerId);}catch(e){}});
function mvMove(ev){const d=drag,dx=ev.clientX-d.x,dy=ev.clientY-d.y;
  if(!d.on){if(dx*dx+dy*dy<64)return;d.on=true;moveSel=null;sel=null;look=null;mvDrag={uid:d.uid,T:d.T,g:mvGains(d.uid,d.T)};SFX.play("pick");render();
    const el=document.querySelector(`#board [data-mc="${d.uid}"]`)||d.el;el.classList.add("mvsrc");const g=document.createElement("div");g.id="ghost";g.innerHTML=d.html;g.style.width=d.w+"px";g.style.height=d.h+"px";document.body.appendChild(g);d.g=g;document.body.classList.add("dragging");}
  d.g.style.transform=`translate3d(${(ev.clientX-d.w/2).toFixed(1)}px,${(ev.clientY-d.h*.6).toFixed(1)}px,0) scale(1.15)`;
  const el=document.elementFromPoint(ev.clientX,ev.clientY),ln=el&&el.closest("[data-lane]");
  document.querySelectorAll("#board .lane.dhov").forEach(e=>{if(e!==ln)e.classList.remove("dhov");});if(ln&&ln.classList.contains("mvok"))ln.classList.add("dhov");}
function mvEnd(ev,cancel){const d=drag;drag=null;const on=d.on;killGhost();mvDrag=null;if(!on)return;noClick=Date.now()+240;
  const el=cancel||!ev?null:document.elementFromPoint(ev.clientX,ev.clientY),ln=el&&el.closest("[data-lane]"),li=ln?+ln.dataset.lane:-1;
  if(li>=0&&d.T.includes(li)&&playing()){
    if(d.re){/* kéo lại thẻ đang chờ dời */if(E.canUnqueue(G,"p",d.uid,"move")){E.unqueue(G,"p",d.uid,"move");if(li===d.re.from)SFX.play("unplay");else if(E.queueMove(G,"p",d.uid,li))SFX.play("place");else E.queueMove(G,"p",d.uid,d.re.to);}}
    else if(E.queueMove(G,"p",d.uid,li))SFX.play("place");}
  sel=null;look=null;render();}
function killGhost(){document.querySelectorAll("#board .mc.mvsrc").forEach(e=>e.classList.remove("mvsrc"));document.querySelectorAll("#ghost").forEach(e=>e.remove());document.body.classList.remove("dragging");document.querySelectorAll(".lane.dhov").forEach(e=>e.classList.remove("dhov"));document.querySelectorAll(".hc.dsrc").forEach(e=>e.classList.remove("dsrc"));}
/* ===== (b) HOÀN TÁC THEO NGĂN XẾP: chỉ hành động mới nhất (đặt / dời / kích hoạt) rút lại được; thẻ đặt trước bị khoá ===== */
function stgHTML(a){const h=mcHTML(a.inst,a.li,true);return E.canUnqueue(G,"p",a.uid,"play")?h.replace('class="mc','class="mc qtop'):h.replace('class="mc','class="mc qlock');}
function undoName(a){const c=a.t==="play"?a.inst:(E.find(G,a.uid)||{}).inst;return c?C[c.id].n:"";}
function undoNudge(uid){const a=E.lastQueued(G,"p");if(!a)return;
  const el=document.querySelector(`#board [data-mc="${uid}"]`);if(el){el.classList.remove("qnudge");void el.offsetWidth;el.classList.add("qnudge");setTimeout(()=>el.classList.remove("qnudge"),520);}
  const top=a.t==="play"?document.querySelector(`#board [data-mc="${a.uid}"]`):null;if(top){top.classList.remove("qhint");void top.offsetWidth;top.classList.add("qhint");setTimeout(()=>top.classList.remove("qhint"),1300);}
  toast(a.t==="play"?`Rút lại thẻ đặt sau trước (${undoName(a)})`:a.t==="move"?`Huỷ lần dời thẻ sau trước (${undoName(a)})`:`Huỷ kích hoạt sau trước (${undoName(a)})`);
  SFX.play("tap");if(navigator.vibrate&&!reduced)try{navigator.vibrate(30);}catch(e){}}
/* rút lại 1 hành động nếu nó là hành động cuối; ngược lại rung + nhắc. Không cho sửa sau khi đã nộp lượt online. */
function tryUnqueue(uid,t,mc){if(!playing()||(G.online&&OL.sub))return false;
  if(!E.canUnqueue(G,"p",uid,t)){undoNudge(uid);return false;}
  if(t==="play")recordBoardOrigin(mc||null,uid);E.unqueue(G,"p",uid,t);SFX.play(t==="play"?"unplay":"tap");return true;}
function undoLastUI(){if(!G||!playing()||(G.online&&OL.sub))return;const a=E.lastQueued(G,"p");if(!a)return;if(tryUnqueue(a.uid,a.t)){sel=look=moveSel=null;render();}}
function paintUndo(){const b=$("btnUndo");if(!b)return;const n=G&&playing()&&!(G.online&&OL.sub)?G.q.p.length:0;b.hidden=!n;b.disabled=!n;}
/* thẻ đang kéo từ bàn: bóng kéo dùng đúng mẫu thẻ trên tay */
function hcLikeHTML(uid,el){const c=G.q.p.find(a=>a.uid===uid);if(!c)return el?el.outerHTML:"";const d=C[c.inst.id];return `<button type="button" class="hc${qCls(d.id)}" style="--hc:${HC[d.h]}${qSt(d.id)}">${nbL(d.id)}${art(d.id)}<span class="cst">${c.c}</span><span class="pwh">${handPow(c.inst)}</span><span class="n">${nmFit(d.id)}</span></button>`;}
/* kéo thẻ đã đặt (chưa lật) trong lượt: chỉ thẻ đặt SAU CÙNG kéo được (đổi chiến địa / thả ra ngoài = rút về tay) */
$("board").addEventListener("pointerdown",ev=>{const mc=ev.target.closest(".mc.staged[data-mc]");if(!mc||!playing()||(G.online&&OL.sub))return;const uid=+mc.dataset.mc;if(!pendingPlay(uid))return;
  killGhost();drag={uid,x:ev.clientX,y:ev.clientY,on:false,el:mc,pid:ev.pointerId,fromQ:true};});
$("btnUndo")&&$("btnUndo").addEventListener("click",ev=>{ev.stopPropagation();undoLastUI();});
$("hand").addEventListener("pointerdown",ev=>{killGhost();drag=null;const hc=ev.target.closest("[data-hc]");if(!hc||!playing()||hc.classList.contains("no"))return;const r=hc.getBoundingClientRect();drag={uid:+hc.dataset.hc,x:ev.clientX,y:ev.clientY,on:false,html:hc.outerHTML,w:r.width,h:r.height,el:hc,pid:ev.pointerId};});
document.addEventListener("pointermove",ev=>{if(!drag||(drag.pid!=null&&ev.pointerId!==drag.pid))return;if(drag.mv)return mvMove(ev);const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;
  if(!drag.on){if(dx*dx+dy*dy<16)return;
    if(drag.fromQ){const u=drag.uid,el=drag.el;drag=null;if(!playing()||!pendingPlay(u))return;if(!E.canUnqueue(G,"p",u,"play")){undoNudge(u);noClick=Date.now()+240;return;}
      drag={uid:u,x:ev.clientX-dx,y:ev.clientY-dy,on:false,html:hcLikeHTML(u,el),w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,el,pid:ev.pointerId};
      recordBoardOrigin(el,u);E.unqueue(G,"p",u,"play");SFX.play("unplay");}
    drag.on=true;clearTimeout(lpT);lpT=0;sel=drag.uid;look=null;moveSel=null;SFX.play("pick");render();const curHc=document.querySelector(`#hand [data-hc="${drag.uid}"]`)||drag.el;drag.el=curHc;curHc.classList.add("dsrc");const g=document.createElement("div");g.id="ghost";g.innerHTML=drag.html;g.style.width=drag.w+"px";g.style.height=drag.h+"px";document.body.appendChild(g);drag.g=g;document.body.classList.add("dragging");}
  const vx=ev.clientX-(drag.lx??ev.clientX),vy=ev.clientY-(drag.ly??ev.clientY);drag.lx=ev.clientX;drag.ly=ev.clientY;drag.ry=((drag.ry||0)*.62+Math.max(-24,Math.min(24,vx*2.0))*.38);drag.rx=((drag.rx||0)*.62+Math.max(-24,Math.min(24,-vy*2.0))*.38);
  drag.g.style.transform=`translate3d(${(ev.clientX-drag.w/2).toFixed(1)}px,${(ev.clientY-drag.h*.68).toFixed(1)}px,0) perspective(600px) scale(1.24) rotateX(${drag.rx.toFixed(1)}deg) rotateY(${drag.ry.toFixed(1)}deg) rotate(${Math.max(-7,Math.min(7,dx*.045)).toFixed(1)}deg)`;
  const el=document.elementFromPoint(ev.clientX,ev.clientY),ln=el&&el.closest("[data-lane]");
  document.querySelectorAll(".lane.dhov").forEach(e=>{if(e!==ln)e.classList.remove("dhov");});
  if(ln&&(ln.classList.contains("ok")||ln.classList.contains("okx")))ln.classList.add("dhov");});
function endDrag(ev,cancel){if(!drag)return;if(drag.mv)return mvEnd(ev,cancel);const d=drag;drag=null;
  let ghostRect=null;if(d.on&&d.g&&d.g.isConnected)ghostRect=d.g.getBoundingClientRect();
  killGhost();if(!d.on)return;noClick=Date.now()+240;
  const el=cancel||!ev?null:document.elementFromPoint(ev.clientX,ev.clientY),ln=el&&el.closest("[data-lane]");
  if(ln&&(ln.classList.contains("ok")||ln.classList.contains("okx"))&&playing()){
    if(ghostRect)window._lastPlayOrigin={uid:d.uid,x:ghostRect.left+ghostRect.width/2,y:ghostRect.top+ghostRect.height/2,w:ghostRect.width,h:ghostRect.height,ts:performance.now(),fromDrag:true};
    if(E.queuePlay(G,"p",d.uid,+ln.dataset.lane)){if(tLeft>0&&tLeft<7)tLeft=Math.min(TURN_SEC,tLeft+2.5);SFX.play("place");}
    else window._lastPlayOrigin=null;
  }
  sel=null;look=null;render();}
function tapFx(el,ev){const r=el.getBoundingClientRect(),f=document.createElement("i");f.className="tapfx";f.style.left=(ev.clientX-r.left)+"px";f.style.top=(ev.clientY-r.top)+"px";el.appendChild(f);setTimeout(()=>f.remove(),480);}
$("hand").addEventListener("pointerdown",ev=>{const hc=ev.target.closest("[data-hc]");if(!hc)return;tapFx(hc,ev);if(hc.classList.contains("no"))return;hc.classList.add("press");const up=()=>{hc.classList.remove("press");document.removeEventListener("pointerup",up);document.removeEventListener("pointercancel",up);};document.addEventListener("pointerup",up);document.removeEventListener("pointercancel",up);});
$("board").addEventListener("pointerdown",ev=>{const m=ev.target.closest(".mc:not(.back)")||ev.target.closest(".loc");if(m)tapFx(m,ev);});
let lpT=0,lpX=0,lpY=0;
$("hand").addEventListener("pointerdown",ev=>{const hc=ev.target.closest("[data-hc]");clearTimeout(lpT);if(!hc)return;lpX=ev.clientX;lpY=ev.clientY;const uid=+hc.dataset.hc;
  lpT=setTimeout(()=>{if(drag&&drag.on)return;drag=null;hc.classList.remove("press");look={kind:"card",uid};sel=null;noClick=Date.now()+520;SFX.play("tap");render();},380);});
document.addEventListener("pointerup",()=>clearTimeout(lpT));document.addEventListener("pointercancel",()=>clearTimeout(lpT));
document.addEventListener("pointermove",ev=>{if(lpT&&(ev.clientX-lpX)**2+(ev.clientY-lpY)**2>25){clearTimeout(lpT);lpT=0;}});
$("zoom").addEventListener("click",ev=>{const za=ev.target.closest("[data-zalt]");if(za&&look){ev.stopPropagation();look.alt=za.dataset.zalt||null;SFX.play("tap");render();return;}const zb=ev.target.closest("[data-zdo]");if(zb&&look){const u=look.uid;look=null;if(zb.dataset.zdo==="pick"){sel=u;SFX.play("pick");}else if(zb.dataset.zdo==="unplay"&&playing()){tryUnqueue(u,"play");}render();return;}const b=ev.target.closest("[data-do]");if(!b){if(ev.target.closest(".zt,.zname,.zmeta,.zhint,.znot,.zq"))return;look=null;render();return;}const t=$("infoAct").querySelector(`[data-do="${b.dataset.do}"]`);if(t)t.click();});
document.querySelector(".who.foe").addEventListener("click",ev=>{ev.stopPropagation();foeInfo();});
document.addEventListener("click",ev=>{const p=$("foeInfo");if(p&&p.classList.contains("on")&&!ev.target.closest("#foeInfo"))p.classList.remove("on");});
$("hand").addEventListener("pointermove",ev=>{const hc=ev.target.closest(".hc.press");if(!hc)return;const r=hc.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;hc.style.setProperty("--ry",(x*26).toFixed(1)+"deg");hc.style.setProperty("--rx",(-y*26).toFixed(1)+"deg");});
addEventListener("deviceorientation",ev=>{if(reduced||store.gyro===false||ev.gamma==null)return;const h=$("hand");if(!h)return;h.style.setProperty("--gy",Math.max(-10,Math.min(10,ev.gamma*.35)).toFixed(1)+"deg");h.style.setProperty("--gx",Math.max(-8,Math.min(8,((ev.beta||45)-45)*-.25)).toFixed(1)+"deg");});
document.addEventListener("pointerup",ev=>endDrag(ev,false));document.addEventListener("pointercancel",ev=>endDrag(ev,true));
document.addEventListener("touchend",ev=>{if(drag&&drag.on&&ev.changedTouches&&ev.changedTouches[0])endDrag(ev.changedTouches[0],false);},{passive:true});
document.addEventListener("touchcancel",()=>endDrag(null,true),{passive:true});
document.addEventListener("visibilitychange",()=>{if(drag){drag=null;killGhost();sel=null;if(G)render();}});
document.addEventListener("click",ev=>{if(Date.now()<noClick){ev.stopPropagation();ev.preventDefault();}},true);
document.querySelector(".info").addEventListener("click",ev=>{if(!ev.target.closest("button"))ev.currentTarget.classList.toggle("open");});
function paintZoom(){const z=$("zoom");let id=null;
  if(look&&look.kind==="card"&&G){const f=E.find(G,look.uid);if(f&&(f.inst.rev||f.inst.own==="p"))id=f.inst.id;if(!id){const h=G.hand.p.find(c=>c.uid===look.uid);if(h)id=h.id;}}
  let zb=$("zoomBg");if(!zb){zb=document.createElement("div");zb.id="zoomBg";document.body.appendChild(zb);zb.addEventListener("click",()=>{look=null;render();});}
  if(!id||drag||$("lobby").classList.contains("on")){z.classList.remove("on");z.innerHTML="";zb.classList.remove("on");return;}
  zb.classList.add("on");
  /* i44 (mục 18): đang xem 1 thẻ liên quan / thẻ phụ của thẻ này -> hiện mặt thẻ đó (chỉ số gốc + kỹ năng), dải thẻ liên quan giữ nguyên để quay lại */
  {const bi0=G.hand.p.find(c=>c.uid===look.uid)||((G.q.p.find(a=>a.t==="play"&&a.uid===look.uid)||{}).inst)||((E.find(G,look.uid)||{}).inst);
   if(look.alt&&C[look.alt]&&bi0){const x=look.alt,dx=C[x],kw=kwfx;z.dataset.alt=x;
    z.innerHTML=`<span class="gc${qCls(x)}" style="--hc:${HC[dx.h]}${qSt(x)};display:block">${nbL(x)}${art(x,1)}<span class="cst">${dx.c}</span><span class="pwh">${dx.p}</span><span class="n">${logo(x)}</span></span>
  <div class="zt"><div class="zrelh">Thẻ liên quan của <b>${esc(C[bi0.id].n)}</b> · ${esc(HE[dx.h]||"")}${DANG[dx.t]?" · "+esc(DANG[dx.t]):""}</div><div class="zsk">${kw(skillText(dx))}</div>${relHTML(bi0,x)}</div><div class="zact"></div><button type="button" class="zcl" aria-label="Đóng">✕</button>`;z.classList.add("on");return;}
   z.dataset.alt="0";}
  const d=C[id],f=E.find(G,look.uid);let pw=d.p,br="";
  if(f&&f.inst.rev){pw=E.power(G,f.inst,f.li);const b0=E.basePow(f.inst),bn=f.inst.bonus,og=pw-b0-bn;br=`<div class="zb">Gốc <b>${b0}</b>${bn?` · cộng trừ <b class="${bn>0?"up":"down"}">${bn>0?"+":"−"}${Math.abs(bn)}</b>`:""}${og?` · Duy Trì và chiến địa <b class="${og>0?"up":"down"}">${og>0?"+":"−"}${Math.abs(og)}</b>`:""} = <b>${pw}</b></div>`;}
  const hc=G.hand.p.find(c=>c.uid===look.uid),qd=G.q.p.find(a=>a.t==="play"&&a.uid===look.uid);let cs=d.c;
  if(hc){cs=E.cost(G,hc);pw=handPow(hc);}else if(f){cs=d.c+(f.inst.cm||0);} /* trên bàn: giá gốc + thay đổi vĩnh viễn (có giải thích trong bảng) */
  const zWhere=hc?"hand":qd?"staged":"board",bi=hc||(qd&&qd.inst)||(f&&f.inst);
  try{if(bi)br=brk(bi,f?f.li:-1,hc?"hand":qd?"staged":"board");}catch(e){}
  const mkNotes=bi?markList(bi,zWhere,true).map(([i,col,t])=>`<div class="zmk"><b style="color:${col}">${i}</b> <span>${esc(t)}</span></div>`).join(""):"";
  const lv=f&&f.inst.own!=="p"?0:lvl(id),qn=QN[lv]||QN[0],kw=kwfx;
  let act=$("infoAct").innerHTML;
  if(hc&&playing()&&!OL.sub){const can=[0,1,2].some(li=>E.canPlay(G,"p",hc,li));act=can?`<button type="button" class="ib" data-zdo="pick">Chọn để đặt</button>`:`<span class="znot">Chưa đặt được: ${cs>G.energy.p?"thiếu năng lượng":"không còn chỗ phù hợp"}</span>`;}
  if(qd&&playing()&&!OL.sub)act=`<button type="button" class="ib alt" data-zdo="unplay">Rút lại thẻ này</button>`;
  let skTxt=skillText(d);
  if(bi){const qp=questProg(bi);if(qp)skTxt=skTxt.replace(/\(\d+\/\d+\)/,qp[2]?"(Hoàn thành ✓)":`(${qp[0]}/${qp[1]})`);}
  z.innerHTML=`<span class="gc${qCls(id)}" style="--hc:${HC[d.h]}${qSt(id)};display:block">${nbL(id)}${art(id,1)}<span class="cst${cs<d.c?" up":cs>d.c?" down":""}">${cs}</span><span class="pwh ${pw>d.p?"up":pw<d.p?"down":""}">${pw}</span>${pw!==d.p?`<span class="zdl p ${pw>d.p?"up":"down"}">${pw>d.p?"+":"−"}${Math.abs(pw-d.p)}</span>`:""}${cs!==d.c?`<span class="zdl c ${cs<d.c?"up":"down"}">${cs>d.c?"+":"−"}${Math.abs(cs-d.c)}</span>`:""}<span class="n">${logo(id)}</span>${bi?markBadges(bi,zWhere):""}</span>
  <div class="zt">${bi?abHTML(bi,skTxt,zWhere):kw(skTxt)}${mkNotes}${br}${bi?relHTML(bi,null):""}</div>${hc?`<div class="zhint">Kéo thẻ hoặc chạm chiến địa để đặt ngay.</div>`:""}<div class="zact">${act}</div><button type="button" class="zcl" aria-label="Đóng">✕</button>`;z.classList.add("on");}
$("hand").addEventListener("click",ev=>{
  const hc=ev.target.closest("[data-hc]");if(!hc)return;
  const uid=+hc.dataset.hc;
  if(!playing()||hc.classList.contains("no")){look={kind:"card",uid};sel=null;moveSel=null;SFX.play("tap");render();return;}
  if(sel===uid){look={kind:"card",uid};sel=null;moveSel=null;SFX.play("tap");render();return;}
  sel=uid;look=null;moveSel=null;SFX.play("pick");render();
});
$("infoAct").addEventListener("click",ev=>{
  const b=ev.target.closest("[data-do]");if(!b||!playing())return;
  const act=b.dataset.do;
  if(act==="zoomsel"&&sel){look={kind:"card",uid:sel};sel=null;SFX.play("tap");render();return;}
  const uid=look&&look.kind==="card"?look.uid:null;
  if(act==="cancelmove")moveSel=null;
  else if(uid==null)return;
  else if(act==="act")E.queueAct(G,"p",uid);
  else if(act==="unact"){if(!tryUnqueue(uid,"act"))return;}
  else if(act==="unmove"){if(!tryUnqueue(uid,"move"))return;}
  else if(act==="move"){moveSel=uid;sel=null;look=null;}/* gpu70: đóng bảng thông tin (#zoom phủ cả bàn) để chạm được chiến địa đích */
  SFX.play("tap");render();
});
/* fix55: quả cầu năng lượng nhấp nháy (pulse "#orb" ở 05/06/08) phóng tối đa 1.16 — trước 1.42–1.5 tràn khỏi đáy màn và chồng nút RÚT LUI */
(function(){const p0=window.pulse;if(typeof p0!=="function")return;window.pulse=function(sel,kf,ms){if(sel==="#orb"&&Array.isArray(kf))kf=kf.map(k=>k&&typeof k.transform==="string"?Object.assign({},k,{transform:k.transform.replace(/scale\(([\d.]+)\)/g,(m,v)=>`scale(${Math.min(+v,1.16)})`)}):k);return p0.call(this,sel,kf,ms);};})();
/* fix55: --bar-b = khoảng từ mép trên thanh nút dưới tới đáy màn (dùng cho dòng "Chạm để…" nằm ngay trên thanh nút) — chỉ đo khi đổi cỡ */
(function(){const bar=document.querySelector("#app > .bar,footer.bar");if(!bar)return;const set=()=>{const r=bar.getBoundingClientRect();if(r.height>0)document.documentElement.style.setProperty("--bar-b",Math.round(innerHeight-r.top)+"px");};
  if(window.ResizeObserver)new ResizeObserver(set).observe(bar);addEventListener("resize",set,{passive:true});set();})();
$("btnEnd").addEventListener("click",()=>{if(G.phase==="over"){if(G.mode)openModeHub(G.mode.k);else{newGame();runMatchIntro("LƯỢT 1/6","",true);}}else endTurnUI();});
$("btnSnap").addEventListener("click",()=>{
  if(!playing()||G.snap.p||OL.sub)return;
  G.snap.p=true;G.pendingDouble++;sel=look=moveSel=null;
  G.msg=`<b>Bạn đã cược!</b> Mức cược nhân đôi từ lượt sau.`;render();G.msg=turnMsg();
  const q=ctr($("btnSnap"));FX.ring(q.x,q.y,"#ffd65a",100,7);FX.burst(q.x,q.y,"#ffd65a",26,220);SFX.play("snap");snapFx("#b07bff","×"+Math.min(8,G.stake*Math.pow(2,G.pendingDouble)));
  if(window.BGM)BGM.syncGame(G);
});
$("btnRetreat").addEventListener("click",()=>{
  if(!playing())return;
  if(armRetreat>Date.now()){armRetreat=0;E.finish(G,"retreatP");showEnd();return;}
  armRetreat=Date.now()+3000;render();setTimeout(()=>{if(playing())render();},3100);
});
$("btnHelp").addEventListener("click",()=>$("ovHelp").classList.add("on"));
$("btnFx").addEventListener("click",()=>{store.fx=store.fx==="off"?"on":"off";reduced=store.fx==="off";document.body.classList.toggle("rm",reduced);save();render();SFX.play("tap");});
$("btnMute").addEventListener("click",()=>{SFX.play("tap");openSet();});
$("btnMute").textContent="Cài đặt";
$("setVol").addEventListener("input",e=>{store.vol=+e.target.value;$("setVolV").textContent=store.vol+"%";save();});
$("setVol").addEventListener("change",()=>SFX.play("buff"));
if($("setBgmVol"))$("setBgmVol").addEventListener("input",e=>{if(window.BGM)BGM.setVol(+e.target.value);else{store.bgmVol=+e.target.value;save();}if($("setBgmVolV"))$("setBgmVolV").textContent=(store.bgmVol??55)+"%";});
if($("setBgm"))$("setBgm").addEventListener("change",e=>{if(window.BGM)BGM.toggle(e.target.checked);else{store.battleBgm=!!e.target.checked;save();}});
$("setMute").addEventListener("change",e=>{store.mute=e.target.checked;save();if(window.BGM)BGM.syncVol();if(G)render();renderLobby();});
$("setGpu").addEventListener("change",e=>{store.gpu=!!e.target.checked;GPUON=store.gpu;document.body.classList.toggle("gpu",GPUON);BC=null;save();if(G)render();});
$("setSpd").addEventListener("change",e=>{setSpd10(e.target.value);syncSetUi();});
function renderSetSpd(){const sel=$("setSpd"),seg=$("setSpdSeg");if(!sel||!seg)return;const L=(Array.isArray(window.SPD_LEVELS)&&window.SPD_LEVELS.length)?window.SPD_LEVELS:[{k:"cham",n:"Chậm"},{k:"vua",n:"Vừa"},{k:"nhanh",n:"Nhanh"}];sel.innerHTML=L.map(o=>`<option value="${o.k}">${o.n}</option>`).join("");sel.value=SPDV[store.spd]?store.spd:"vua";seg.innerHTML=L.map(o=>`<button type="button" role="radio" class="sx-pill" data-k="${o.k}">${o.n}</button>`).join("");seg.style.setProperty("--n",L.length);syncSetUi();}
function syncSetUi(){const seg=$("setSpdSeg");if(seg)seg.querySelectorAll(".sx-pill").forEach(b=>{const on=b.dataset.k===store.spd;b.classList.toggle("on",on);b.setAttribute("aria-checked",on);});const m=!!store.mute,o=$("ovSet");if(o)o.classList.toggle("sx-muted",m);const bg=$("setBgm");if(bg&&$("setBgmVol"))$("setBgmVol").closest(".sx-row").classList.toggle("sx-off",!bg.checked);}
if($("setSpdSeg"))$("setSpdSeg").addEventListener("click",e=>{const b=e.target.closest(".sx-pill");if(!b)return;$("setSpd").value=b.dataset.k;$("setSpd").dispatchEvent(new Event("change"));SFX.play("tap");});
['setMute','setBgm'].forEach(i=>{if($(i))$(i).addEventListener("change",()=>setTimeout(syncSetUi,0));});
$("setFx").addEventListener("change",e=>{store.fx=e.target.checked?"on":"off";reduced=store.fx==="off";document.body.classList.toggle("rm",reduced);save();if(G)render();});
if($("setVoice"))$("setVoice").addEventListener("change",e=>{SFX.voiceSet(e.target.checked);});
$("setVib").addEventListener("change",e=>{store.vib=e.target.checked;save();});
$("setGyro").addEventListener("change",e=>{store.gyro=e.target.checked;save();if(!store.gyro){$("hand").style.removeProperty("--gx");$("hand").style.removeProperty("--gy");}});
$("orb").addEventListener("click",ev=>{ev.stopPropagation();SFX.play("tap");openEnergy();});
$("enUndo").addEventListener("click",ev=>{ev.stopPropagation();undoAll();});
document.addEventListener("click",ev=>{if(!ev.target.closest("#enPop,#orb"))$("enPop").classList.remove("on");if(!ev.target.closest("#emoMenu,#btnProfile"))$("emoMenu").classList.remove("on");});
$("emoMenu").innerHTML=EMO.map((t,i)=>`<button type="button" role="menuitem" data-emo="${i}">${t}</button>`).join("");
$("emoMenu").addEventListener("click",ev=>{const b=ev.target.closest("[data-emo]");if(b)sendEmote(+b.dataset.emo);});
$("btnProfile").addEventListener("click",ev=>{if(!G||$("lobby").classList.contains("on"))return;ev.stopImmediatePropagation();ev.preventDefault();SFX.play("tap");$("emoMenu").classList.toggle("on");},true);
$("modeOnline").addEventListener("click",()=>{SFX.play("tap");closeAll();onlineFind();});
$("mmCancel").addEventListener("click",()=>{SFX.play("tap");clearTimeout(mmBotT);onlineReset();mmHide();});
$("btnPiles").addEventListener("click",()=>{pilesSide="p";renderPiles();$("ovPiles").classList.add("on");});
