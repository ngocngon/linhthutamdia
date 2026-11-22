/* Module 06: Giao diện bàn đấu, vòng lặp lượt chơi, kéo thả thẻ & bộ đếm giờ */
function render(){render0();paintZoom();}
/* vá bàn đấu: so từng ô với lần vẽ trước, chỉ thay ô nào đổi */
let BC=null;
function laneKey(ln){const c=ln.children;return {l:c[1].outerHTML,o:[...c[0].children].map(x=>x.className+"|"+x.innerHTML),m:[...c[2].children].map(x=>x.className+"|"+x.innerHTML)};}
function patchBoard(html){const b=$("board"),t=document.createElement("template");t.innerHTML=html;const nl=[...t.content.children];let keys;
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
const _pb12=patchBoard;
patchBoard=function(html){const fl=new Map();try{for(const m of document.querySelectorAll("#board .mc.flip")){const a=m.getAnimations?m.getAnimations().find(x=>/^(flip|flip3|gpuCardFlip)$/.test(x.animationName)&&x.playState==="running"):null;if(a)fl.set(m.dataset.mc,{el:m,t:a.currentTime||0});}}catch(e){}
  _pb12(html);if(!fl.size)return;for(const [u,o] of fl){const n=document.querySelector(`#board [data-mc="${u}"]`);if(n&&n!==o.el&&!n.classList.contains("flip")){n.style.animationDelay=(-o.t)+"ms";n.classList.add("flip");n.addEventListener("animationend",()=>{n.style.animationDelay="";},{once:true});}}};
function render0(){
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
  let html="";
  G.locs.forEach((L,li)=>{
    let ok=false,okx=false;
    if(play&&selInst&&E.canPlay(G,"p",selInst,li)){if(selInst.id==="boxit")okx=true;else ok=true;}
    if(play&&mvF&&mvF.li!==li&&E.space(G,li,"p"))ok=true;
    const pa=E.locPower(G,li,"a"),pp=E.locPower(G,li,"p"),ld=E.lead(G,li);
    const mxb=(sd,tot)=>{let sum=0;for(const c of L.cards[sd])if(c.rev)sum+=E.power(G,c,li);if(tot===sum)return "";const r=sum>0?tot/sum:0;return `<i class="mx ${sd} ${tot>sum?"up":"down"}">${r>1&&Number.isInteger(r)?"×"+r:(tot>sum?"+":"−")+Math.abs(tot-sum)}</i>`;};
    const mine=L.cards.p.map(c=>mcHTML(c,li,false)).concat(G.q.p.filter(a=>a.t==="play"&&a.li===li&&a.row==="p").map(a=>mcHTML(a.inst,li,true)));
    const theirs=L.cards.a.map(c=>mcHTML(c,li,false)).concat(G.q.p.filter(a=>a.t==="play"&&a.li===li&&a.row==="a").map(a=>mcHTML(a.inst,li,true)));
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
    html+=`<section class="lane${ok?" ok":""}${okx?" okx":""}${ld==="p"?" lp":ld==="a"?" la":""}" data-lane="${li}">
      <div class="side opp">${top.map((h,i)=>`<div class="slot${offTop(i)}">${h}</div>`).join("")}</div>
      <div class="${lc}" style="--lc:${hue};--lg:${hue}99">
        <span class="pw a${ld==="a"?" lead":""}${lchA?" lchg":""}">${pa}</span>${mxb("a",pa)}
        <div class="loc"><div class="in"${L.rvl&&IMGL.has(L.id)?` style="--li:url(${IMGS.l[L.id]})"`:""}><div class="ln">${L.gone?"Đã bị huỷ":L.rvl?def.n:G.uatu&&G.uatu.p?def.n:"?"}</div><div class="lt">${L.gone?"Không còn tính điểm.":L.rvl?def.s:(G.uatu&&G.uatu.p?def.s+" · ":"")+"Lộ diện ở lượt "+(li+1)}</div>${lk}</div></div>
        <span class="pw p${ld==="p"?" lead":""}${lchP?" lchg":""}">${pp}</span>${mxb("p",pp)}
      </div>
      <div class="side me">${[0,1,2,3].map(i=>`<div class="slot${offBot(i)}">${mine[i]||""}</div>`).join("")}</div>
    </section>`;
  });
  patchBoard(html);tickPw();try{syncAmb();if(typeof syncBoardFieldVfx==="function")syncBoardFieldVfx();landDust();}catch(e){}
  let info=(G.phase==="play"&&G.hideT===G.turn&&!G.msg?"<b>Lượt này mọi thẻ đặt xuống sẽ úp đến cuối ván</b> ("+C.sieusaokhonglo.n+").":G.msg),acts="";
  if(moveSel&&mvF){info=`<b>Dời ${C[mvF.inst.id].n}.</b> Chạm chiến địa muốn dời tới.`;acts=`<button type="button" class="ib alt" data-do="cancelmove">Thôi</button>`;}
  else if(selInst){
    let extra="";
    if(play){const any=[0,1,2].some(li=>E.canPlay(G,"p",selInst,li));
      if(!any)extra=E.cost(G,selInst)>G.energy.p?` <span class="warn">Không đủ năng lượng.</span>`:` <span class="warn">Chưa có chiến địa nào đặt được.</span>`;
      else if(selInst.id==="boxit")extra=` <span class="warn">Chạm chiến địa để đặt vào phe Máy.</span>`;}
    if(play&&selInst){acts+=`<button type="button" class="ib alt" data-do="zoomsel">🔍 Chi tiết thẻ</button>`;}
    info=cardInfo(selInst,-1,"hand")+markList(selInst,"hand").map(([i,col,t])=>`<br><span style="color:${col}">${i}</span> <i>${t}</i>`).join("")+extra;
  }else if(look){
    if(look.kind==="loc"){const L=G.locs[look.li];info=L.rvl?`<b>${LOC[L.id].n}</b><br>${LOC[L.id].x}`:`<b>Chiến địa chưa lộ diện</b><br>Sẽ lộ diện ở lượt ${look.li+1}. Bạn vẫn đặt bài vào đây được.`;}
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
          else if(E.moveRight(G,"p",f.inst,f.li))acts+=`<button type="button" class="ib mv" data-do="move">Dời thẻ</button>`;
        }
      }
    }
  }
  $("infoText").innerHTML=info;$("infoAct").innerHTML=acts;
  if(!(drag&&drag.on)){$("hand").dataset.n=G.hand.p.length;$("hand").style.setProperty("--n",Math.max(1,G.hand.p.length));const hh=G.hand.p.length?G.hand.p.map((c,ix,ar)=>{const kk=ix-(ar.length-1)/2;
    const d=C[c.id],cs=E.cost(G,c),pw=handPow(c);
    const no=play&&![0,1,2].some(li=>E.canPlay(G,"p",c,li));
    return `<button type="button" class="hc${c.uid===sel?" sel":""}${no?" no":""}${c.sil?" sil":""}${qCls(c.id)}" style="--i:${ix};--k:${kk};--a:${Math.abs(kk)};--hc:${HC[d.h]}${qSt(c.id)}" data-hc="${c.uid}" aria-label="${d.n}, năng lượng ${cs}, sức mạnh ${pw}">${art(c.id)}<span class="cst ${cs<d.c?"up":cs>d.c?"down":""}">${cs}</span><span class="pwh ${pw>d.p?"up":pw<d.p?"down":""}">${pw}</span><span class="n">${logo(d.id)}</span>${spk(d.id)}${markBadges(c,"hand")}<i class="fl"></i>${c.ug?`<span class="ugb">⬆${c.ug}</span>`:""}</button>`;
  }).join(""):`<div class="empty">Hết bài trên tay</div>`;const he=$("hand");if(he._h!==hh||he.children.length===0){he._h=hh;he.innerHTML=hh;}}
  $("orb").textContent=String(G.energy.p);$("btnEnd").classList.toggle("nudge",!!(play&&G.phase==="play"&&!G.hand.p.some(c=>[0,1,2].some(li=>E.canPlay(G,"p",c,li)))));
  const end=$("btnEnd");
  if(over){$("endMain").textContent="VÁN MỚI";$("endSub").textContent="Chơi tiếp";end.disabled=false;}
  else if(G.phase==="reveal"){$("endMain").textContent="ĐANG CHỜ..";$("endSub").textContent=`${G.turn}/${E.turns(G)}`;end.disabled=true;}
  else{$("endMain").textContent="KẾT THÚC LƯỢT";end.disabled=false;}
  end.classList.toggle("wait",!!(G.online&&OL.sub));end.classList.toggle("can",!!(G.online&&OL.sub&&!OL.locked));
  if(G.online&&OL.sub&&G.phase==="play"){$("endMain").textContent=OL.locked?"ĐANG LẬT BÀI":"ĐANG CHỜ ĐỐI THỦ";end.disabled=!!OL.locked;}
  paintTimer();
  const rt=$("btnRetreat");rt.disabled=!play;
  const armed=play&&armRetreat>Date.now();
  rt.classList.toggle("arm",armed);rt.innerHTML=armed?`MẤT ${G.stake} ${icn("gems")}?`:"RÚT LUI";
  $("btnMute").classList.toggle("off",store.mute);$("btnFx").classList.toggle("off",reduced);
}

let ddPlan=false;
async function endTurnUI(auto){
  if(!playing())return;
  if(G.online){onlineEnd();return;}
  sel=look=moveSel=null;
  if(!auto){G.cnt.missed=0;missNote="";}
  /* (0) Nếu vừa đặt/rút thẻ tức thì, chờ hoạt ảnh đặt thẻ (165ms) đáp xuống hoàn tất trước khi úp bài */
  if(!reduced&&window._placeLockUntil){
    const rem=window._placeLockUntil-performance.now();
    if(rem>8)await new Promise(r=>setTimeout(r,rem));
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
    const R0=rects0(),P0=powers();
    const did=E.doStep(G,st);
    if(!did&&!G.msgs.length)continue;
    const evs=G.evs.slice();await artReady12(evs);
    if(G.msgs.length)G.msg=fmt(G.msgs);
    render();playFx(evs,R0,P0);
    const hasFlip=evs.some(e=>e.k==="flip"),hasMore=evs.some(e=>e.k!=="flip");
    await sleep(reduced?65:hasFlip?(hasMore?720:440):480);
  }
  /* (3) PHA CUỐI LƯỢT TUẦN TỰ TỪNG THẺ / CHIẾN ĐỊA / NHIỆM VỤ MỘT */
  for(const st of E.beginEndTurn(G)){
    const R0=rects0(),P0=powers();
    const did=E.stepEndTurn(G,st);
    if(!did&&!G.msgs.length&&!G.evs.length)continue;
    const evs=G.evs.slice();await artReady12(evs);
    if(G.msgs.length)G.msg=`<b>Cuối lượt:</b> `+G.msgs.slice(0,4).join(" · ");
    render();playFx(evs,R0,P0);
    await sleep(reduced?65:480);
  }
  E.finishEndTurn(G);
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
    render();
    /* (4a) Mở Chiến Địa mới (940ms) */
    if(locEvs.length){playFx(locEvs,R0,P0);await sleep(reduced?80:940);}
    /* (4b) Rút bài đầu lượt & kỹ năng Đầu Lượt (520ms+) */
    if(drawEvs.length){HAND0=H0;playFx(drawEvs,R0,P0);await sleep(reduced?60:520);}
    /* (4c) Máy cược Snap (980ms) hoặc Vô Uý nhìn thấu (820ms) */
    if(aiSnap){const q=ctr($("btnSnap"));FX.ring(q.x,q.y,"#ff4d7d",90,6);SFX.play("snap");snapFx("#ff4d7d","×2");await sleep(reduced?70:980);}
    if(vouySee){try{const v=E.boardCards(G,"p").find(([c])=>!c.sil&&E.is(G,c,"vouy"));if(v)eye7(srcPt(v[0].uid),ctr($("avFoe")),"THẤY TRƯỚC");}catch(e){}await sleep(reduced?60:820);}
    /* (4d) Băng hiệu Lượt mới + xung nhịp Quả cầu năng lượng (780ms) */
    const isFinalTurn=G.turn===E.turns(G);
    banner(isFinalTurn?"LƯỢT CUỐI!":`LƯỢT ${G.turn}/${E.turns(G)}`,"");
    pulse("#orb",[{transform:"scale(1.42)",filter:"brightness(2.2)"},{transform:"scale(1)",filter:"brightness(1)"}],440);
    await sleep(reduced?50:780);
    if(G.agatha&&G.agatha.p&&G.turn%2===0&&G.phase==="play"){E.aiPlan(G,"p",200);G.msg="<b>Lão Phù Thuỷ điều khiển lượt này.</b><br>"+G.msg;render();setTimeout(()=>endTurnUI(true),reduced?240:520);}
  }
}
function showEnd(){
  const r=G.result;
  if(G.online)onlineOver(r);
  const md=G.mode?modeEnd(r):"";lbAdd(G.mode?G.mode.k:"rank",r);psAdd(r.winner==="p"?50:25);
  if(!G.mode){if(r.winner==="p")store.gems+=r.stake;else if(r.winner==="a")store.gems-=r.stake;}
  const misGot=misTick(r),rw=r.winner==="p"?[60,40,25]:r.winner==="a"?[25,15,10]:[35,20,15];store.gold+=rw[0];store.up+=rw[1];store.tok+=rw[2];
  save();
  const t=$("resTitle");
  t.className="res "+(r.winner==="p"?"win":r.winner==="a"?"lose":"draw");
  t.textContent=r.winner==="p"?"THẮNG!":r.winner==="a"?"THUA":"HOÀ";
  let wp=0,wa=0;for(let i=0;i<3;i++){const l=E.lead(G,i);if(l==="p")wp++;else if(l==="a")wa++;}
  $("resSub").textContent=G.online&&OL.note?OL.note:r.kind==="timeoutP"?"Bạn bỏ 3 lượt liên tiếp nên bị xử thua.":r.kind==="retreatA"?"Máy thấy cửa thua nên đã rút lui.":r.kind==="retreatP"?"Bạn đã rút lui để giữ ngọc.":
    wp!==wa?`Bạn giữ ${wp}/3 chiến địa, Máy giữ ${wa}/3 chiến địa.`:"Số chiến địa bằng nhau. Tổng sức mạnh quyết định.";
  $("resRows").innerHTML=G.locs.map((L,i)=>{
    const pp=E.locPower(G,i,"p"),pa=E.locPower(G,i,"a");
    return `<div class="${E.lead(G,i)==="p"?"w":""}">${L.rvl?LOC[L.id].n:"Chưa lộ diện"}<b>${pp} : ${pa}</b></div>`;
  }).join("");
  const delta=r.winner==="p"?`+${r.stake}`:r.winner==="a"?`−${r.stake}`:"0";
  if(G.online&&!OL.note)$("resSub").textContent=$("resSub").textContent.replace(/Máy/g,$("foeName").textContent);
  $("btnAgain").textContent=G.mode?({draft:"Về Tuyển chọn",conq:"Về Chinh phục",jr:G.mode.slot==="jd"?"Về Thử thách ngày":"Về Hành Trình",wk:"Về Chiến Địa Biến Động",online:"Tìm trận"}[G.mode.k]||"Về chế độ"):"Ván mới";
  $("resGem").innerHTML=(G.mode?md:`<b>${delta} ${icn("gems")}</b><br>Kho ngọc của bạn: ${store.gems} ${icn("gems")}`)+`<br>Thưởng trận: ${icn("gold")}+${rw[0]} · ${icn("up")}+${rw[1]} · ${icn("tok")}+${rw[2]}`+(misGot?`<br>Xong nhiệm vụ: ${icn("gold")}+${misGot}`:"");
  G.msg=`Ván đã kết thúc. Bấm <b>Ván mới</b> để chơi tiếp.`;
  render();
  const fw=r.kind==="end"?endFinale():0;
  const eb=reduced?0:1300;if(eb)setTimeout(()=>{try{endBanner(r);}catch(e){}},fw);
  setTimeout(()=>{if(r.winner==="p"){FX.rain("#ffd65a");SFX.play("win");}else if(r.winner==="a")SFX.play("lose");$("ovEnd").classList.add("on");},fw+eb);
}
function newGame(){
  BC=null;TN0=0;LOCID=[];seenRev.clear();prevPow.clear();seenLoc.clear();seenStg.clear();prevLd=[];PWV={};sel=look=moveSel=null;armRetreat=0;
  const hs=Object.keys(E.PARTNER);
  const foeDeck=E.themedDeck(hs[Math.floor(Math.random()*hs.length)]);
  foeAv=foeDeck[foeDeck.length-1];$("avFoe").innerHTML=artFace(foeAv);$("avMe").innerHTML=meAv();
  foeBack=Object.keys(BACKS)[Math.floor(Math.random()*Object.keys(BACKS).length)];
  G=E.newGame(store.deck,foeDeck);gameDeck=store.deck.join();$("foeName").textContent="MÁY";
  missNote="";resetTimer(true);
  if(window.BGM&&!$("lobby").classList.contains("on"))BGM.syncGame(G);
  G.msg=turnMsg(G.msgs.slice(0,4));
  closeAll();render();
}
function closeAll(){document.querySelectorAll(".ov.on").forEach(o=>o.classList.remove("on"));}

function rowHTML(k){
  const d=C[k];
  return `<div class="row plain" style="--hc:${HC[d.h]}"><span class="em">${art(k)}</span><span><span class="t1">${d.n}</span><br><span class="tm">${HE[d.h]} · năng lượng ${d.c} · sức mạnh ${d.p}</span><br><span class="t2">${kwfx(skillText(d))}</span></span></div>`;
}
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
  const full=!F.col&&draft.size>=12,fvs=new Set(store.fav);
  $("deckList").innerHTML=ids.map(k=>{const d=C[k],on=draft.has(k);
    return `<button type="button" class="gc${on?" on":""}${fvs.has(k)?" fav":""}${F.foc===k?" foc":""}${full&&!on?" dim":""}${OWN.has(k)?qCls(k):" lock"}" style="--hc:${HC[d.h]}${qSt(k)}" data-pick="${k}" aria-label="${d.n}, năng lượng ${d.c}, sức mạnh ${d.p}">${art(k)}<span class="cst">${d.c}</span><span class="pwh">${d.p}</span><span class="n">${logo(d.id)}</span>${spk(d.id)}<span class="fv">★</span><span class="ck">✓</span>${OWN.has(k)&&canUp(k)?`<span class="gup" aria-label="Có thể nâng cấp">▲</span>`:""}<span class="gi" style="--qc:${(QN[lvl(k)]||QN[0])[1]}">${OWN.has(k)?`<span class="pips">${[1,2,3,4,5,6].map(i=>`<i class="${i<=lvl(k)?"f":""}"></i>`).join("")}</span>`:"<em>Chưa có</em>"}</span></button>`;}).join("")
    ||`<div class="none" style="grid-column:1/-1">Không có thẻ nào khớp bộ lọc.</div>`;
  body.scrollTop=y;
  const f=F.foc&&C[F.foc];
  $("deckDetail").innerHTML="";$("deckDetail").style.display="none";
  $("btnSaveDeck").disabled=draft.size!==12;
}
function toggleDraft(k){if(draft.has(k))draft.delete(k);else if(draft.size<12&&OWN.has(k))draft.add(k);}
function lhash(t){let h=2166136261;for(let i=0;i<t.length;i++)h=Math.imul(h^t.charCodeAt(i),16777619)>>>0;return h;}
const LGC={};
function logo(id){if(LGC[id])return LGC[id];const n=C[id].n,L=n.length,sz=L<=7?"s":L<=11?"m":L<=15?"l":"x";
  return LGC[id]=`<i class="lg lgz ${sz}" data-t="${n}"><b>${n}</b></i>`;}
function spk(id){return lvl(id)>=4?`<span class="spk"><i></i><i></i><i></i><i></i></span>`:"";}
const AUC={};
/* aura v8 thay bằng v9 */
function srcN(by){if(!by||by==="?")return "một hiệu ứng trong trận";if(by.slice(0,2)==="L:"){const L=LOC[by.slice(2)];return "chiến địa "+(L?L.n:"");}return C[by]?C[by].n:"một hiệu ứng trong trận";}
/* tách nguyên nhân: tạm tắt từng thẻ/chiến địa đang có hiệu lực rồi xem con số đổi bao nhiêu */
function ablate(fn){const out=[];let base;try{base=fn();}catch(e){return out;}
  for(let i=0;i<3;i++)for(const sd of E.SIDES)for(const k of G.locs[i].cards[sd]){if(!k.rev||k.sil)continue;k.sil=true;let v=base;try{v=fn();}catch(e){}k.sil=null;if(v!==base)out.push([C[k.id].n,base-v]);}
  for(let i=0;i<3;i++){const L=G.locs[i];if(!L.rvl||L.gone||L.id==="meadow")continue;const id=L.id;L.id="meadow";let v=base;try{v=fn();}catch(e){}L.id=id;if(v!==base)out.push(["chiến địa "+LOC[id].n,base-v]);}
  return out;}
function brk(inst,li,where){const d=C[inst.id],sg=n=>(n>0?"+":"−")+Math.abs(n),row=(dv,t,sub)=>`<li><b class="${dv>0?"up":"down"}">${sg(dv)}</b> ${esc(t)}${sub?` <small>${sub}</small>`:""}</li>`;
  const hs=k=>(inst.hist||[]).filter(h=>h.k===k).map(h=>row(k==="c"?h.d:h.d,srcN(h.by),"lượt "+h.t)).join("");
  const onB=where==="board"&&inst.rev;let P=hs("p"),cur=E.basePow(inst)+inst.bonus;
  if(inst.bp!=null&&inst.bp!==d.p)P=`<li>Sức mạnh gốc bị đặt thành <b>${inst.bp}</b></li>`+P;
  if(onB){const fp=()=>E.power(G,inst,li);cur=fp();let rest=cur-(E.basePow(inst)+inst.bonus);for(const [n,dv] of ablate(fp)){P+=row(dv,n,"đang có hiệu lực");rest-=dv;}if(rest)P+=row(rest,"hiệu ứng kết hợp","");}
  let Cc=hs("c"),cc=d.c+inst.cm;
  if(where==="hand"){const fc=()=>E.cost(G,inst);cc=fc();let rest=cc-(d.c+inst.cm);for(const [n,dv] of ablate(fc)){Cc+=row(dv,n,"đang có hiệu lực");rest-=dv;}if(rest)Cc+=row(rest,"hiệu ứng khác","");}
  const notes=[];if(inst.cr)notes.push(`✦ Được tạo ra bởi <b>${esc(srcN(inst.by))}</b>.`);if(inst.sil)notes.push(`⊘ Bị <b>${esc(srcN(inst.silBy))}</b> vô hiệu hoá: mất kỹ năng, giữ nguyên sức mạnh hiện có.`);
  if(inst.ab&&inst.ab!==inst.id&&C[inst.ab])notes.push(`⟳ Đang mang kỹ năng của <b>${esc(C[inst.ab].n)}</b>.`);
  if(!P&&!Cc&&!notes.length)return "";
  return `<div class="brk"><div class="bkc"><h5>Năng lượng <b>${cc}</b></h5><ul><li>Gốc <b>${d.c}</b></li>${Cc}</ul></div><div class="bkp"><h5>Sức mạnh <b>${cur}</b></h5><ul><li>Gốc <b>${d.p}</b></li>${P}</ul></div>${notes.length?`<p>${notes.join("<br>")}</p>`:""}</div>`;}
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
  ["cr","✦","#ffd65a",c=>`Thẻ được tạo ra bởi ${srcN(c.by)} (không có sẵn trong bộ bài ban đầu).`],
  ["ab","⟳","#c45cff",c=>c.ab&&c.ab!==c.id&&C[c.ab]?`Đang mang kỹ năng của ${C[c.ab].n}.`:""],
  ["zg","♾","#ff7ac0",()=>"Sẽ biến thành bản sao của "+C.bayxacnuotsao.n+" khi thẻ đó lật."],
  ["evil","☠","#ff4d5e",()=>"Thẻ ÁC của Lục Ác: đặt đủ 6 thẻ ÁC để hợp thể."]];
function markList(c,where){
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
  for(const [k,i,col,fn] of MARKS)if(c[k]){
    if(where==="board"&&(k==="cr"||k==="sil"))continue;
    const t=fn(c);if(t)r.push([i,col,t]);
  }
  return r;
}
function markBadges(c,where){
  const m=markList(c,where);
  if(!m.length)return "";
  const lim=where&&where!=="hand"?m.slice(0,2):m.slice(0,3);
  return `<span class="hmk${where&&where!=="hand"?" bmk":""}">${lim.map(([i,col])=>`<i class="${i.length>1?"w":""}" style="--mc:${col}">${i}</i>`).join("")}</span>`;
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
function renderPiles(){
  const sec=(title,arr)=>`<h3>${title} (${arr.length})</h3>`+(arr.length?arr.map(c=>rowHTML(c.id)).join(""):`<div class="none">Trống.</div>`);
  $("pilesBody").innerHTML=sec("Bạn đã vứt bỏ",G.disc.p)+sec("Bạn bị tiêu huỷ",G.dead.p)+sec("Máy đã vứt bỏ",G.disc.a)+sec("Máy bị tiêu huỷ",G.dead.a);
}

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
    if(playing()&&pendingPlay(uid)){recordBoardOrigin(mc,uid);E.unqueue(G,"p",uid,"play");look=null;sel=null;SFX.play("unplay");render();return;}
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
let drag=null,noClick=0;
function killGhost(){document.querySelectorAll("#ghost").forEach(e=>e.remove());document.body.classList.remove("dragging");document.querySelectorAll(".lane.dhov").forEach(e=>e.classList.remove("dhov"));document.querySelectorAll(".hc.dsrc").forEach(e=>e.classList.remove("dsrc"));}
$("hand").addEventListener("pointerdown",ev=>{killGhost();drag=null;const hc=ev.target.closest("[data-hc]");if(!hc||!playing()||hc.classList.contains("no"))return;const r=hc.getBoundingClientRect();drag={uid:+hc.dataset.hc,x:ev.clientX,y:ev.clientY,on:false,html:hc.outerHTML,w:r.width,h:r.height,el:hc,pid:ev.pointerId};});
document.addEventListener("pointermove",ev=>{if(!drag||(drag.pid!=null&&ev.pointerId!==drag.pid))return;const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;
  if(!drag.on){if(dx*dx+dy*dy<16)return;drag.on=true;clearTimeout(lpT);lpT=0;sel=drag.uid;look=null;moveSel=null;SFX.play("pick");render();const curHc=document.querySelector(`#hand [data-hc="${drag.uid}"]`)||drag.el;drag.el=curHc;curHc.classList.add("dsrc");const g=document.createElement("div");g.id="ghost";g.innerHTML=drag.html;g.style.width=drag.w+"px";g.style.height=drag.h+"px";document.body.appendChild(g);drag.g=g;document.body.classList.add("dragging");}
  const vx=ev.clientX-(drag.lx??ev.clientX),vy=ev.clientY-(drag.ly??ev.clientY);drag.lx=ev.clientX;drag.ly=ev.clientY;drag.ry=((drag.ry||0)*.62+Math.max(-24,Math.min(24,vx*2.0))*.38);drag.rx=((drag.rx||0)*.62+Math.max(-24,Math.min(24,-vy*2.0))*.38);
  drag.g.style.transform=`translate3d(${(ev.clientX-drag.w/2).toFixed(1)}px,${(ev.clientY-drag.h*.68).toFixed(1)}px,0) perspective(600px) scale(1.24) rotateX(${drag.rx.toFixed(1)}deg) rotateY(${drag.ry.toFixed(1)}deg) rotate(${Math.max(-7,Math.min(7,dx*.045)).toFixed(1)}deg)`;
  const el=document.elementFromPoint(ev.clientX,ev.clientY),ln=el&&el.closest("[data-lane]");
  document.querySelectorAll(".lane.dhov").forEach(e=>{if(e!==ln)e.classList.remove("dhov");});
  if(ln&&(ln.classList.contains("ok")||ln.classList.contains("okx")))ln.classList.add("dhov");});
function endDrag(ev,cancel){if(!drag)return;const d=drag;drag=null;
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
$("zoom").addEventListener("click",ev=>{const zb=ev.target.closest("[data-zdo]");if(zb&&look){const u=look.uid;look=null;if(zb.dataset.zdo==="pick"){sel=u;SFX.play("pick");}else if(zb.dataset.zdo==="unplay"&&playing()){recordBoardOrigin(null,u);E.unqueue(G,"p",u,"play");SFX.play("unplay");}render();return;}const b=ev.target.closest("[data-do]");if(!b){if(ev.target.closest(".zt,.zname,.zmeta,.zhint,.znot,.zq"))return;look=null;render();return;}const t=$("infoAct").querySelector(`[data-do="${b.dataset.do}"]`);if(t)t.click();});
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
  const d=C[id],f=E.find(G,look.uid);let pw=d.p,br="";
  if(f&&f.inst.rev){pw=E.power(G,f.inst,f.li);const b0=E.basePow(f.inst),bn=f.inst.bonus,og=pw-b0-bn;br=`<div class="zb">Gốc <b>${b0}</b>${bn?` · cộng trừ <b class="${bn>0?"up":"down"}">${bn>0?"+":"−"}${Math.abs(bn)}</b>`:""}${og?` · Duy Trì và chiến địa <b class="${og>0?"up":"down"}">${og>0?"+":"−"}${Math.abs(og)}</b>`:""} = <b>${pw}</b></div>`;}
  const hc=G.hand.p.find(c=>c.uid===look.uid),qd=G.q.p.find(a=>a.t==="play"&&a.uid===look.uid);let cs=d.c;
  if(hc){cs=E.cost(G,hc);pw=handPow(hc);}else if(f){try{cs=E.cost(G,f.inst);}catch(e){}}
  const zWhere=hc?"hand":qd?"staged":"board",bi=hc||(qd&&qd.inst)||(f&&f.inst);
  try{if(bi)br=brk(bi,f?f.li:-1,hc?"hand":"board")||br;}catch(e){}
  const mkNotes=bi?markList(bi,zWhere).map(([i,col,t])=>`<div class="zmk"><b style="color:${col}">${i}</b> <span>${esc(t)}</span></div>`).join(""):"";
  const lv=f&&f.inst.own!=="p"?0:lvl(id),qn=QN[lv]||QN[0],kw=kwfx;
  let act=$("infoAct").innerHTML;
  if(hc&&playing()&&!OL.sub){const can=[0,1,2].some(li=>E.canPlay(G,"p",hc,li));act=can?`<button type="button" class="ib" data-zdo="pick">Chọn để đặt</button>`:`<span class="znot">Chưa đặt được: ${cs>G.energy.p?"thiếu năng lượng":"không còn chỗ phù hợp"}</span>`;}
  if(qd&&playing()&&!OL.sub)act=`<button type="button" class="ib alt" data-zdo="unplay">Rút lại thẻ này</button>`;
  let skTxt=skillText(d);
  if(bi){const qp=questProg(bi);if(qp)skTxt=skTxt.replace(/\(\d+\/\d+\)/,qp[2]?"(Hoàn thành ✓)":`(${qp[0]}/${qp[1]})`);}
  z.innerHTML=`${lv?`<div class="zq" style="--qc:${qn[1]}">${esc(qn[0])} · Cấp ${lv}</div>`:""}<span class="gc${qCls(id)}" style="--hc:${HC[d.h]}${qSt(id)};display:block">${art(id)}<span class="cst${cs<d.c?" up":cs>d.c?" down":""}">${cs}</span><span class="pwh ${pw>d.p?"up":pw<d.p?"down":""}">${pw}</span><span class="n">${logo(id)}</span>${bi?markBadges(bi,zWhere):""}</span>
  <div class="zt">${kw(skTxt)}${mkNotes}${br}</div>${hc?`<div class="zhint">Kéo thẻ hoặc chạm chiến địa để đặt ngay.</div>`:""}<div class="zact">${act}</div><button type="button" class="zcl" aria-label="Đóng">✕</button>`;z.classList.add("on");}
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
  else if(act==="unact")E.unqueue(G,"p",uid,"act");
  else if(act==="unmove")E.unqueue(G,"p",uid,"move");
  else if(act==="move"){moveSel=uid;sel=null;}
  SFX.play("tap");render();
});
$("btnEnd").addEventListener("click",()=>{if(G.phase==="over"){if(G.mode)openModeHub(G.mode.k);else{newGame();runMatchIntro("LƯỢT 1/6","",true);}}else endTurnUI();});
$("btnSnap").addEventListener("click",()=>{
  if(!playing()||G.snap.p||OL.sub)return;
  G.snap.p=true;G.pendingDouble++;sel=look=moveSel=null;
  G.msg=`<b>Bạn đã cược!</b> Mức cược nhân đôi từ lượt sau.`;render();G.msg=turnMsg();
  const q=ctr($("btnSnap"));FX.ring(q.x,q.y,"#ffd65a",100,7);FX.burst(q.x,q.y,"#ffd65a",26,220);SFX.play("snap");snapFx("#b07bff","×2");
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
$("setSpd").addEventListener("change",e=>{setSpd10(e.target.value);});
$("setFx").addEventListener("change",e=>{store.fx=e.target.checked?"on":"off";reduced=store.fx==="off";document.body.classList.toggle("rm",reduced);save();if(G)render();});
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
$("btnPiles").addEventListener("click",()=>{renderPiles();$("ovPiles").classList.add("on");});
