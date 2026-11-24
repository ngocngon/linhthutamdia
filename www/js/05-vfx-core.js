/* Module 05: Hệ thống điều phối hiệu ứng kỹ năng, nguyên tố, biểu trưng & đồng bộ đấu online */
/* ================= HIỆU ỨNG HẠT ================= */
/* mức chất lượng hiệu ứng: máy yếu tự giảm số hạt */
const FXQ=(()=>{try{const c=navigator.hardwareConcurrency||4,m=navigator.deviceMemory||4,mob=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);if(c<=4||m<=3)return .45;if(mob)return .7;return 1;}catch(e){return .7;}})(),FXMAX=FXQ<1?260:420;
const SPR={};function spr(c,dark){const k=c+(dark?"d":"");if(SPR[k])return SPR[k];const v=document.createElement("canvas");v.width=v.height=64;const x=v.getContext("2d"),g=x.createRadialGradient(32,32,0,32,32,32);
  if(dark){g.addColorStop(0,c);g.addColorStop(1,"rgba(0,0,0,0)");}else{g.addColorStop(0,"#ffffff");g.addColorStop(.18,c);g.addColorStop(.45,c+"88");g.addColorStop(1,c+"00");}
  x.fillStyle=g;x.fillRect(0,0,64,64);return SPR[k]=v;}
const sprOk=c=>/^#[0-9a-f]{6}$/i.test(c);
function sigSpr(c,n){const k="g"+c+n;if(SPR[k])return SPR[k];const v=document.createElement("canvas");v.width=v.height=160;const x=v.getContext("2d"),r=70;x.translate(80,80);x.strokeStyle=c;x.fillStyle=c;
  const draw=()=>{x.beginPath();x.arc(0,0,r,0,6.283);x.stroke();x.beginPath();x.arc(0,0,r*.84,0,6.283);x.stroke();x.beginPath();x.arc(0,0,r*.36,0,6.283);x.stroke();
    const p=[];for(let i=0;i<n;i++){const a=i*6.283/n;p.push([Math.cos(a)*r*.82,Math.sin(a)*r*.82]);}x.beginPath();for(let i=0;i<n;i++){x.moveTo(p[i][0],p[i][1]);x.lineTo(p[(i+2)%n][0],p[(i+2)%n][1]);}x.stroke();
    x.beginPath();for(let i=0;i<24;i++){const a=i*6.283/24,l=i%3?.06:.12;x.moveTo(Math.cos(a)*r*.86,Math.sin(a)*r*.86);x.lineTo(Math.cos(a)*r*(.86+l),Math.sin(a)*r*(.86+l));}x.stroke();};
  x.globalAlpha=.28;x.lineWidth=7;draw();x.globalAlpha=1;x.lineWidth=2.2;draw();for(let i=0;i<4;i++){const a=i*1.5708;x.beginPath();x.arc(Math.cos(a)*r,Math.sin(a)*r,4,0,6.283);x.fill();}
  return SPR[k]=v;}
function pilSpr(c){const k="p"+c;if(SPR[k])return SPR[k];const v=document.createElement("canvas");v.width=32;v.height=128;const x=v.getContext("2d");
  let g=x.createLinearGradient(0,128,0,0);g.addColorStop(0,c);g.addColorStop(.7,c);g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(0,0,32,128);
  g=x.createLinearGradient(0,128,0,0);g.addColorStop(0,"#fff");g.addColorStop(1,"rgba(255,255,255,0)");x.fillStyle=g;x.fillRect(12,0,8,128);return SPR[k]=v;}
const FX=(()=>{
  const cv=$("fx"),cx=cv.getContext("2d");let ps=[],raf=0,dpr=1,last=0;
  function size(){dpr=FXQ<1?1:Math.min(1.25,window.devicePixelRatio||1);cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);}
  size();addEventListener("resize",size);
  function add(o){if(reduced)return;if((o.k==="dot"||o.k==="spark"||o.k==="shard"||o.k==="orb"||o.k==="smoke"||o.k==="sq")&&Math.random()>FXQ*(window.FXLV===0?.6:1))return;if(ps.length>=FXMAX)ps.shift();ps.push(o);if(!raf){last=performance.now();cv.style.visibility="";raf=requestAnimationFrame(tick);}}
  function tick(t){
    const dt=Math.min(.05,(t-last)/1000)/SPD;last=t;
    cx.setTransform(dpr,0,0,dpr,0,0);cx.globalCompositeOperation="source-over";cx.clearRect(0,0,innerWidth,innerHeight);cx.globalCompositeOperation="lighter";
    ps=ps.filter(p=>(p.life-=dt/p.dur)>0);
    for(const p of ps){try{
      if(p.delay>0){p.delay-=dt;p.life+=dt/p.dur;continue;}
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;
      cx.globalAlpha=Math.min(1,p.life*1.6);cx.globalCompositeOperation=p.norm?"source-over":"lighter";
      if(p.k==="ring"){const r=p.r0+(p.r1-p.r0)*(1-p.life);cx.strokeStyle=p.c;cx.lineWidth=p.w*p.life+.5;cx.beginPath();cx.arc(p.x,p.y,Math.max(.1,r),0,6.283);cx.stroke();}
      else if(p.k==="bolt"){cx.strokeStyle=p.c;cx.lineWidth=p.w*(.4+.6*p.life);cx.lineJoin="round";cx.beginPath();cx.moveTo(p.pts[0][0],p.pts[0][1]);for(let q=1;q<p.pts.length;q++)cx.lineTo(p.pts[q][0],p.pts[q][1]);cx.stroke();}
      else if(p.k==="glow"){const r=Math.max(1,p.r0+(p.r1-p.r0)*(1-p.life));cx.globalAlpha=p.life*(p.al||.85);cx.drawImage(spr(p.c,!sprOk(p.c)),p.x-r,p.y-r,r*2,r*2);}
      else if(p.k==="rays"){p.a+=p.va*dt;cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.globalAlpha=p.life*.55;cx.fillStyle=p.c;const L=p.r1*(.5+.5*(1-p.life));for(let q=0;q<p.n;q++){cx.rotate(6.283/p.n);cx.beginPath();cx.moveTo(0,-3);cx.lineTo(L,0);cx.lineTo(0,3);cx.fill();}cx.restore();}
      else if(p.k==="spark"){cx.strokeStyle=p.c;cx.lineWidth=p.s*(.3+.7*p.life);cx.lineCap="round";cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x-p.vx*.045,p.y-p.vy*.045);cx.stroke();}
      else if(p.k==="slash"){const t=1-p.life,e=Math.min(1,t*3);cx.strokeStyle=p.c;cx.lineWidth=p.w*p.life+1;cx.lineCap="round";cx.beginPath();cx.moveTo(p.x-p.dx,p.y-p.dy);cx.lineTo(p.x-p.dx+2*p.dx*e,p.y-p.dy+2*p.dy*e);cx.stroke();}
      else if(p.k==="orb"){p.a+=p.va*dt;p.rad*=1-dt*1.6;const ox=p.x+Math.cos(p.a)*p.rad,oy=p.y+Math.sin(p.a)*p.rad*.6;const r=Math.max(.5,p.s)*2.6;cx.drawImage(spr(p.c,!sprOk(p.c)),ox-r,oy-r,r*2,r*2);}
      else if(p.k==="sq"){p.a+=p.va*dt;const z=p.s*(.5+1.3*(1-p.life));cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.globalAlpha=p.life*.2;cx.fillStyle=p.c;cx.fillRect(-z,-z,z*2,z*2);cx.globalAlpha=p.life*.95;cx.strokeStyle=p.c;cx.lineWidth=1.4;cx.strokeRect(-z,-z,z*2,z*2);cx.restore();}
      else if(p.k==="shard"){p.a+=p.va*dt;cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.fillStyle=p.c;cx.fillRect(-p.s,-p.s*.6,p.s*2,p.s*1.2);cx.restore();}
      else if(p.k==="sigil"){const t=1-p.life,e=Math.min(1,t*4),r=p.r*(.55+.45*e)*1.143;p.a+=p.va*dt;cx.save();cx.translate(p.x,p.y);cx.scale(1,p.fy);cx.rotate(p.a);cx.globalAlpha=Math.min(1,p.life*2.2)*e;cx.drawImage(sigSpr(p.c,p.n),-r,-r,r*2,r*2);cx.restore();}
      else if(p.k==="pillar"){const t=1-p.life,e=Math.min(1,t*6),w=p.w*e*(.35+.65*p.life);cx.globalAlpha=Math.min(1,p.life*1.5)*.5;cx.drawImage(pilSpr(p.c),p.x-w/2,p.y-p.h,w,p.h);}
      else if(p.k==="smoke"){p.s+=p.gs*dt;const r=Math.max(1,p.s);cx.globalAlpha=p.life*p.o;cx.drawImage(spr(p.c,1),p.x-r,p.y-r,r*2,r*2);}
      else if(p.k==="blade"){/* đường kiếm cong */const t=1-p.life,e=Math.min(1,t*5),a0=p.a-p.sw/2,a1=a0+p.sw*e;cx.save();cx.lineCap="round";
        cx.globalAlpha=Math.min(1,p.life*1.8);cx.strokeStyle=p.c;cx.lineWidth=p.w*(.4+.6*p.life);cx.beginPath();cx.arc(p.cx,p.cy,p.R,a0,a1);cx.stroke();
        cx.strokeStyle="#fff";cx.lineWidth=p.w*.32*(.4+.6*p.life);cx.beginPath();cx.arc(p.cx,p.cy,p.R,Math.max(a0,a1-p.sw*.55),a1);cx.stroke();cx.restore();}
      else{const r=Math.max(.5,p.s*(.4+.6*p.life))*2.6;cx.drawImage(spr(p.c,!sprOk(p.c)),p.x-r,p.y-r,r*2,r*2);}
    }catch(e){p.life=0;cx.restore&&0;}}
    cx.globalAlpha=1;cx.globalCompositeOperation="source-over";
    raf=ps.length?requestAnimationFrame(tick):0;if(!raf)cv.style.visibility="hidden";
  }
  const R=(a,b)=>a+Math.random()*(b-a);
  return {
    burst(x,y,c,n,sp){if(!FXBIG)sp=Math.min(sp||120,120);for(let i=0;i<n;i++){const a=R(0,6.283),v=R(.3,1)*(sp||120);add({k:"dot",x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:60,c,s:R(1.5,3.2),dur:R(.35,.7),life:1,delay:0});}},
    ring(x,y,c,r1,w){if(!FXBIG)r1=Math.min(r1||40,44);add({k:"ring",x,y,vx:0,vy:0,g:0,c,r0:4,r1:r1||40,w:w||4,dur:.5,life:1,delay:0});},
    shards(x,y,c){for(let i=0;i<14;i++)add({k:"shard",x:x+R(-14,14),y:y+R(-18,18),vx:R(-90,90),vy:R(-160,-20),g:520,c:i%3?c:"#cfcbe8",s:R(2,4.5),a:R(0,6),va:R(-9,9),dur:R(.5,.85),life:1,delay:0});},
    rise(x,y,c,n){for(let i=0;i<(n||12);i++)add({k:"dot",x:x+R(-18,18),y:y+R(-4,22),vx:R(-14,14),vy:R(-90,-40),g:-30,c,s:R(1.4,3),dur:R(.5,.95),life:1,delay:R(0,.18)});},
    trail(x1,y1,x2,y2,c){for(let i=0;i<16;i++){const t=i/15;add({k:"dot",x:x1+(x2-x1)*t,y:y1+(y2-y1)*t-Math.sin(t*3.14)*26,vx:R(-12,12),vy:R(-12,12),g:0,c,s:R(1.5,3),dur:.5,life:1,delay:t*.18});}},
    rain(c){for(let i=0;i<70;i++)add({k:"shard",x:R(0,innerWidth),y:R(-40,-5),vx:R(-30,30),vy:R(80,220),g:160,c:i%2?c:"#fff",s:R(2,4),a:R(0,6),va:R(-8,8),dur:R(1.2,2.2),life:1,delay:R(0,.7)});},
    bolts(x,y,c,n,len){for(let i=0;i<(n||6);i++){const a=R(0,6.283),L=(len||46)*R(.7,1.15),pts=[[x,y]];for(let k=1;k<=5;k++){const t=k/5,j=(k<5?R(-9,9):0);pts.push([x+Math.cos(a)*L*t-Math.sin(a)*j,y+Math.sin(a)*L*t+Math.cos(a)*j]);}add({k:"bolt",pts,x:0,y:0,vx:0,vy:0,g:0,c:i%3?c:"#ffffff",w:2.4,dur:R(.22,.4),life:1,delay:R(0,.1)});}},
    beam(x,y1,y2,c){for(let i=0;i<14;i++)add({k:"dot",x:x+R(-34,34),y:y1+(y2-y1)*R(0,1),vx:0,vy:R(-60,-20),g:0,c,s:R(1.4,3),dur:R(.4,.8),life:1,delay:R(0,.2)});},
    glow(x,y,c,r,dur){if(!FXBIG)r=Math.min(r||70,38);add({k:"glow",x,y,vx:0,vy:0,g:0,c,r0:6,r1:r||70,dur:dur||.45,life:1,delay:0,al:FXBIG?.85:.5});},
    rays(x,y,c,r,n){if(!FXBIG)r=Math.min(r||60,36);add({k:"rays",x,y,vx:0,vy:0,g:0,c,r1:r||60,n:n||10,a:R(0,6),va:1.6,dur:.6,life:1,delay:0});},
    sparks(x,y,c,n,sp){if(!FXBIG)sp=Math.min(sp||260,150);for(let i=0;i<(n||14);i++){const a=R(0,6.283),v=R(.4,1)*(sp||260);add({k:"spark",x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,g:420,c:i%4?c:"#fff",s:R(1.6,3),dur:R(.3,.6),life:1,delay:0});}},
    wave(x,y,c,r){if(!FXBIG)r=Math.min(r||60,44);add({k:"ring",x,y,vx:0,vy:0,g:0,c,r0:6,r1:r||60,w:7,dur:.45,life:1,delay:0});add({k:"ring",x,y,vx:0,vy:0,g:0,c:"#fff",r0:2,r1:(r||60)*.7,w:3,dur:.38,life:1,delay:.06});},
    slash(x,y,c){for(const sg of [1,-1])add({k:"slash",x,y,vx:0,vy:0,g:0,c:sg>0?c:"#fff",dx:30,dy:sg*34,w:sg>0?6:3,dur:.34,life:1,delay:sg>0?0:.07});},
    vortex(x,y,c,n){for(let i=0;i<(n||16);i++)add({k:"orb",x,y,vx:0,vy:0,g:0,c:i%3?c:"#fff",a:R(0,6.283),va:R(7,11),rad:R(34,54),s:R(1.6,3),dur:R(.5,.8),life:1,delay:R(0,.1)});},
    dust(x,y,c){for(let i=0;i<10;i++){const d=i%2?1:-1;add({k:"dot",x:x+d*R(4,22),y:y+R(-2,4),vx:d*R(40,130),vy:R(-40,-5),g:90,c,s:R(1.6,3.4),dur:R(.3,.55),life:1,delay:0});}},
    comet(x1,y1,x2,y2,c){for(let i=0;i<26;i++){const t=i/25;add({k:"dot",x:x1+(x2-x1)*t,y:y1+(y2-y1)*t-Math.sin(t*3.14)*30,vx:R(-10,10),vy:R(-10,10),g:0,c:i%3?c:"#fff",s:1.4+3.4*t,dur:.42,life:1,delay:t*.2});}},
    sigil(x,y,c,r,n,flat,dur){if(!FXBIG)r=Math.min(r||48,flat?36:30);add({k:"sigil",x,y,vx:0,vy:0,g:0,c,r:r||48,n:n||6,fy:flat?.42:1,a:R(0,6),va:flat?1.4:2.2,dur:dur||1,life:1,delay:0});},
    pillar(x,y,c,w,h){if(!FXBIG){w=Math.min(w||46,28);h=Math.min(h||220,70);}add({k:"pillar",x,y,vx:0,vy:0,g:0,c,w:w||46,h:h||220,dur:.8,life:1,delay:0});for(let i=0;i<14;i++)add({k:"dot",x:x+R(-w/2||-20,w/2||20),y:y-R(0,40),vx:R(-8,8),vy:R(-260,-120),g:0,c:i%3?c:"#fff",s:R(1.4,2.8),dur:R(.5,.9),life:1,delay:R(0,.25)});},
    miasma(x,y,n){for(let i=0;i<(n||9);i++)add({k:"smoke",norm:1,x:x+R(-22,22),y:y+R(-26,26),vx:R(-14,14),vy:R(-30,-6),g:0,c:i%3?"rgba(30,0,48,.95)":"rgba(70,8,60,.9)",s:R(10,18),gs:R(18,34),o:R(.55,.8),dur:R(.8,1.25),life:1,delay:R(0,.15)});
      for(let i=0;i<8;i++)add({k:"dot",x:x+R(-20,20),y:y+R(-20,20),vx:R(-20,20),vy:R(-50,-10),g:0,c:"#c04dff",s:R(1.2,2.4),dur:R(.5,.9),life:1,delay:R(.05,.3)});},
    blade(x,y,c,R0,ang,w){const Rr=R0||70,a=ang==null?R(-.6,.6)-1.5708:ang;add({k:"blade",x:0,y:0,vx:0,vy:0,g:0,c,cx:x-Math.cos(a)*Rr,cy:y-Math.sin(a)*Rr,R:Rr,a,sw:1.9,w:w||9,dur:.42,life:1,delay:0});},
    ash(x,y,n){for(let i=0;i<(n||16);i++)add({k:"dot",norm:i%3===0?1:0,x:x+R(-22,22),y:y+R(-26,26),vx:R(-20,20),vy:R(-70,-20),g:-10,c:i%3===0?"rgba(60,56,70,.9)":(i%2?"#ff7a3a":"#ffd08a"),s:R(1.2,2.6),dur:R(.8,1.4),life:1,delay:R(0,.25)});},
    snow(x,y,n){for(let i=0;i<(n||12);i++)add({k:"dot",x:x+R(-30,30),y:y+R(-36,10),vx:R(-20,20),vy:R(20,60),g:20,c:i%2?"#ffffff":"#bff4ff",s:R(1.2,2.4),dur:R(.7,1.1),life:1,delay:R(0,.2)});},
    puff(x,y,c,n){for(let i=0;i<(n||6);i++)add({k:"smoke",norm:1,x:x+R(-20,20),y:y+R(-22,22),vx:R(-14,14),vy:R(-30,-6),g:0,c,s:R(10,16),gs:R(16,30),o:R(.5,.75),dur:R(.7,1.1),life:1,delay:R(0,.15)});},
    drip(x,y,c,n){for(let i=0;i<(n||10);i++){const a=R(-2.6,-.5),v=R(80,200);add({k:"dot",x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:520,c:i%3?c:"#ffffff",s:R(1.6,3),dur:R(.5,.8),life:1,delay:0});}},
    leaves(x,y,c,n){for(let i=0;i<(n||10);i++)add({k:"shard",x:x+R(-20,20),y:y+R(-24,10),vx:R(-80,80),vy:R(-120,-30),g:120,c:i%3?c:"#ffffff",s:R(2,3.6),a:R(0,6),va:R(-6,6),dur:R(.7,1.1),life:1,delay:R(0,.15)});},
    glyph(x,y,ch,c){if(reduced)return;const d=document.createElement("div");d.className="fxgl";d.textContent=ch;d.style.cssText=`left:${x}px;top:${y}px;--c:${c}`;document.body.appendChild(d);fxT(()=>d.remove(),1150);},
    impact(x,y,k){if(reduced)return 0;if(FXBIG){this.flash("#ffffff",.16+.1*k);this.shake(5+4*k);}this.ring(x,y,"#ffffff",34,3);this.glow(x,y,"#ffffff",34,.3);
      return 160+80*k;},
    holo(x,y,c,n){if(!FXBIG)n=Math.min(n||70,20);for(let i=0;i<(n||70);i++){const a=R(0,6.283),v=FXBIG?R(120,640):R(40,160);add({k:"sq",x:x+R(-10,10),y:y+R(-10,10),vx:Math.cos(a)*v,vy:Math.sin(a)*v+60,g:0,c:i%4?c:"#ffffff",s:R(3,8),a:R(0,1.5),va:R(-1.5,1.5),dur:R(.6,1.25),life:1,delay:R(0,.12)});}},
    shake(n){if(reduced||!FXBIG)return;const el=$("board");if(el&&el.animate)el.animate([{transform:"translate(0,0)"},{transform:`translate(${n}px,${-n}px)`},{transform:`translate(${-n}px,${n*.6}px)`},{transform:`translate(${n*.6}px,${n*.4}px)`},{transform:"translate(0,0)"}],{duration:240,easing:"ease-out"});},
    flash(c,o){if(reduced||!FXBIG)return;const el=$("flash");if(el&&el.animate){el.style.background=c;el.animate([{opacity:o||.35},{opacity:0}],{duration:320,easing:"ease-out"});}},
    float(x,y,txt,c){if(reduced)return;const d=document.createElement("div");d.className="float";d.textContent=txt;x=Math.max(14+txt.length*6,Math.min(innerWidth-14-txt.length*6,x));d.style.left=x+"px";d.style.top=y+"px";d.style.color=c;document.body.appendChild(d);fxT(()=>d.remove(),1500);}
  };
})();
function cleanCloneHTML(el){if(!el)return "";const k=el.cloneNode(true);k.removeAttribute("id");k.classList.remove("land","flip","bump","gpu-slam","gpu-hov","press","sel","look","hero-hid");k.style.opacity="";k.style.transform="";k.style.visibility="";return k.outerHTML;}
function rects(){const m=new Map();document.querySelectorAll("#board [data-mc]").forEach(el=>{const r=el.getBoundingClientRect();m.set(+el.dataset.mc,{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,html:cleanCloneHTML(el)});});return m;}
let EN0={p:0,a:0};function rects0(){pvApply();try{SD0=new Map();if(G)for(let i=0;i<3;i++)for(const s of E.SIDES)for(const c of G.locs[i].cards[s])SD0.set(c.uid,s);}catch(e){}try{LW0=[0,1,2].map(i=>{const lw=document.querySelector(`#board [data-lane="${i}"] .locw`);if(!lw)return null;const k=lw.cloneNode(true);k.classList.remove("new","look");return {html:k.outerHTML};});}catch(e){}HAND0=snapHand();try{snapX();}catch(e){}if(G){ME0={p:G.maxE.p,a:G.maxE.a};EN0={p:G.energy.p,a:G.energy.a};}return rects();}
function powers(){const m=new Map();for(let i=0;i<3;i++)for(const s of E.SIDES)for(const c of G.locs[i].cards[s])if(c.rev)m.set(c.uid,E.power(G,c,i));return m;}
function ctr(el){const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};}
const seenSil=new Set();
function pulse(sel,kf,ms){if(reduced)return;const el=document.querySelector(sel);if(el&&el.animate)el.animate(noF(kf),{duration:ms||380,easing:"ease-out"});}
const SKC={rev:"#3fe0ff",end:"#b06bff",react:"#ff8a2b"};
/* ===== Hoạt ảnh tờ 16 khung hình 4x4 (toàn bộ 137 tờ v16 đồng bộ qua 1 vòng rAF + khử trùng lặp thông minh) ===== */
const V16_PRE={},V16_JOBS=new Set(),V16_RECENT=[];let v16Raf=0;
function v16Pre(key){const u=key&&IMGS.v16&&IMGS.v16[key];if(!u)return "";if(!V16_PRE[u]){const im=new Image();im.decoding="async";im.src=u;V16_PRE[u]=im;}return u;}
function tickV16(now){
  v16Raf=0;
  if(document.hidden){
    for(const j of V16_JOBS){if(j.rm&&j.el.isConnected)j.el.remove();}
    V16_JOBS.clear();return;
  }
  for(const j of V16_JOBS){
    if(!j.el.isConnected){V16_JOBS.delete(j);continue;}
    const p=(now-j.t0)/j.tot;
    if(p>=1){if(j.rm)j.el.remove();V16_JOBS.delete(j);continue;}
    if(p<0)continue;
    const span=j.f1-j.f0+1,f=Math.min(j.f1,Math.max(j.f0,j.f0+((p*span)|0)));
    if(f!==j.prev){j.prev=f;const col=f&3,row=f>>2;j.el.style.backgroundPosition=`${(col*100/3).toFixed(4)}% ${(row*100/3).toFixed(4)}%`;}
    if(j.fade)j.el.style.opacity=p<0.07?(p/0.07).toFixed(2):p>0.88?((1-p)/0.12).toFixed(2):"1";
  }
  if(V16_JOBS.size)v16Raf=requestAnimationFrame(tickV16);
}
function v16Bind(el,durMs,f0,f1,rm,fade){
  if(V16_JOBS.size>=18){const first=V16_JOBS.values().next().value;if(first){if(first.rm&&first.el.isConnected)first.el.remove();V16_JOBS.delete(first);}}
  const tot=Math.max(180,(+durMs||460))*SPD;
  V16_JOBS.add({el,t0:performance.now(),tot,f0:f0??0,f1:f1??15,prev:-1,rm:!!rm,fade:!!fade});
  if(!v16Raf)v16Raf=requestAnimationFrame(tickV16);
  if(rm)setTimeout(()=>{if(el.isConnected)el.remove();},tot+90);
}
function v16Html(key,durMs,f0,f1,cls){
  if(reduced)return "";const u=v16Pre(key);if(!u)return "";
  const c0=(f0??0)&3,r0=(f0??0)>>2;
  return `<span class="v16-sp${cls?" "+cls:""}" data-v16="${key}" data-dur="${+durMs||480}" data-f0="${f0??0}" data-f1="${f1??15}" style="background-image:url('${u}');background-position:${(c0*100/3).toFixed(4)}% ${(r0*100/3).toFixed(4)}%"></span>`;
}
function v16Activate(root){
  if(reduced||!root)return;
  const list=root.classList&&root.classList.contains("v16-sp")?[root]:root.querySelectorAll?root.querySelectorAll(".v16-sp"):[];
  list.forEach(el=>{if(el._v16)return;el._v16=1;v16Bind(el,+el.dataset.dur||480,+el.dataset.f0||0,el.dataset.f1!=null?+el.dataset.f1:15,false,false);});
}
function playV16(key,x,y,size,durMs,delayMs,rotDeg,noCap){
  if(reduced||x==null||y==null||document.hidden)return 0;const url=v16Pre(key);if(!url)return 0;
  const dur=Math.max(220,+durMs||460),dl=Math.max(0,+delayMs||0);let sz=Math.max(68,+size||112);if(!noCap)sz=Math.min(sz,Math.max(68,cw10()*1.6));
  const fireAt=performance.now()+dl*SPD;
  while(V16_RECENT.length&&fireAt-V16_RECENT[0].t>260)V16_RECENT.shift();
  for(const r of V16_RECENT)if(r.k===key&&Math.abs(r.t-fireAt)<135&&Math.hypot(r.x-x,r.y-y)<38)return dl+dur;
  V16_RECENT.push({k:key,x,y,t:fireAt});
  holdFx(dl+dur+20);
  const start=()=>{
    const live=document.querySelectorAll(".fx-v16");
    if(live.length>=8)live[0].remove();
    const el=document.createElement("div");
    el.className="fx-v16 fx-v16-"+key;
    el.style.cssText=`left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${sz.toFixed(0)}px;height:${sz.toFixed(0)}px;background-image:url('${url}');background-position:0% 0%${rotDeg?`;--v16r:${(+rotDeg).toFixed(1)}deg`:""}`;
    document.body.appendChild(el);
    v16Bind(el,dur,0,15,true,true);
  };
  if(dl>0)fxT(start,dl);else start();
  return dl+dur;
}
window.playV16=playV16;window.v16Html=v16Html;window.v16Activate=v16Activate;window.v16Pre=v16Pre;
/* ===== gpu26: TUYỆT KỸ BẬC 5 / BẬC 4 kiểu MARVEL SNAP =====
   (a) Màn ra mắt: chính LÁ THẺ đầy đủ (nền thẻ, khung bậc, năng lượng/sức mạnh, tên) bay từ ô trên bàn ra giữa màn hình,
       phóng to, quầng sáng màu hệ, dòng "Tuyệt kỹ" bên dưới rồi thu về đúng ô. S5: tia sáng xoay + rung nhẹ; S4 gọn hơn.
       Diễn SAU nhịp lật trên bàn và TRƯỚC nhịp kỹ năng. Chạm màn hình để bỏ qua.
   (b) Thẻ "ra tay": khi bước kỹ năng có nguồn là thẻ S5/S4 trên bàn, bản sao cố định của chính lá thẻ nhấc lên ~1,6–1,75× tại chỗ,
       nghiêng/lao nhẹ về phía mục tiêu, viền sáng màu hệ; điểm phát đòn (tâm nguồn) dời theo lá thẻ đã nhấc; xong thì hạ về.
   Chỉ dùng transform/opacity trong hoạt ảnh. Thời lượng tính theo ms thật (đã nhân SPD) và có trần. */
const isUlt=d=>!!d&&d.h==="S5";
const isUltS4=d=>!!d&&d.h==="S4";
const isHero5=d=>isUlt(d)||isUltS4(d);
/* flip của thẻ lật thường (không phải thẻ được kéo/đưa vào bằng hiệu ứng: flip.eff=1) */
const flip1=e=>e.k==="flip"&&!e.eff;
function ultsOf(evs){const out=[],seen=new Set();for(const ev of evs.filter(flip1).concat(evs.filter(e=>e.k==="flip"&&e.eff))){if(seen.has(ev.uid))continue;seen.add(ev.uid);
  const f=E.find(G,ev.uid),inst=(f&&f.inst)||anyC(ev.uid)||(ev.id?{uid:ev.uid,id:ev.id,own:ev.own||"p"}:null);if(inst&&C[inst.id]&&isHero5(C[inst.id]))out.push(inst);}return out;}
/* màu: quầng theo hệ nguyên tố của nhân vật, viền theo màu bậc */
function ucCol(id){const d=C[id],e=elOf(id);return [(e&&ELD[e]?ELD[e][0]:null)||HC[d.h]||"#ffd65a",HC[d.h]||"#ffd65a"];}
/* thẻ thứ 2 trở đi trong cùng một lượt ngắn hơn */
const UCN={g:null,t:-1,n:0};
function ucNth(){const t=G?G.turn:-1;if(UCN.g!==G||UCN.t!==t){UCN.g=G;UCN.t=t;UCN.n=0;}return UCN.n++;}
/* tổng thời lượng một màn (ms thật): ≈1,0 s (S5) / 0,88 s (S4) × SPD, trần 1,7 s / 1,45 s; tua nhanh 0,38 s */
function ucDur(s5,nth){if(window.FFTURN&&FFTURN.on)return 380;let t=Math.min((s5?1000:880)*SPD,s5?1700:1450);if(nth>0)t=Math.max(600,t*.66);return Math.round(t);}
function ucCard(inst){const id=inst.id,d=C[id],mine=inst.own==="p";let cs=d.c,pw=d.p;try{const g=GV||G,f=E.find(g,inst.uid);if(f){pw=E.power(g,f.inst,f.li);cs=E.cost(g,f.inst);}}catch(e){}
  const q=mine&&typeof qCls==="function"?qCls(id):"",qs=mine&&typeof qSt==="function"?qSt(id):"";
  return `<span class="gc${q}" style="--hc:${HC[d.h]}${qs};display:block">${mine?nbL(id):""}${art(id,1)}<span class="cst${cs<d.c?" up":cs>d.c?" down":""}">${cs}</span><span class="pwh ${pw>d.p?"up":pw<d.p?"down":""}">${pw}</span><span class="n">${logo(id)}</span>${typeof spk==="function"?spk(id):""}</span>`;}
let UC=null;
function ultShow(inst,done,nth){
  const fin1=()=>{if(done){const f=done;done=null;try{f();}catch(e){console.error(e);}}};
  if(reduced||!inst||!C[inst.id]){fin1();return;}
  try{
  if(UC)UC.end(true);
  const id=inst.id,d=C[id],lo5=window.FXLV===0,s5=isUlt(d),mine=inst.own!=="a",[c,c2]=ucCol(id);
  if(typeof spLoad==="function"){spLoad(id);spLoad(id+"@f");}
  const T=ucDur(s5,nth|0),TIN=Math.round(T*.27),TOUT=Math.round(T*.23),HOLD=T-TIN-TOUT,oi=TIN/T,oh=(TIN+HOLD)/T;
  const VW=innerWidth,VH=innerHeight,W=Math.round(Math.min(VW*.6,250,(VH-170)/1.28)),H=Math.round(W*1.28);
  const cx=VW/2,cy=Math.round(Math.max(H/2+(mine?56:86),Math.min(VH*(mine?.47:.4),VH-H/2-100)));
  const slot=document.querySelector(`#board [data-mc="${inst.uid}"]`),sr=slot?slot.getBoundingClientRect():null,has=!!(sr&&sr.width);
  const fr=has?{x:sr.left+sr.width/2,y:sr.top+sr.height/2,s:Math.max(.12,sr.width/W)}:{x:cx,y:mine?VH+H*.3:-H*.3,s:.4};
  const dx=(fr.x-cx).toFixed(1),dy=(fr.y-cy).toFixed(1),rz=mine?-3:3;
  const sk=String(d.x||"").replace(/^[^:]{2,16}:\s*/,""),dg=DANG[d.t]||"";
  const z=document.createElement("div");z.className="uc5 "+(s5?"s5":"s4")+(mine?"":" foe");z.setAttribute("aria-label",`Tuyệt kỹ ${d.n}. Chạm để bỏ qua`);
  z.style.setProperty("--c",c);z.style.setProperty("--c2",c2);
  z.innerHTML=`<i class="uc-dim"></i>${s5&&!lo5?`<i class="uc-rays" style="left:${cx}px;top:${cy}px;--hs:${Math.round(W*2.9)}px"></i>`:""}<i class="uc-halo" style="left:${cx}px;top:${cy}px;--hs:${Math.round(W*(s5?2.4:1.95))}px"></i>`
    +(mine?"":`<div class="uc-who" style="top:${Math.round(cy-H/2-34)}px"><b>Đối thủ</b></div>`)
    +`<div class="uc-card" style="left:${Math.round(cx-W/2)}px;top:${Math.round(cy-H/2)}px;width:${W}px;height:${H}px">${ucCard(inst)}<i class="uc-shw"><i class="uc-sh"></i></i></div>`
    +`<div class="uc-lb" style="top:${Math.round(cy+H/2+12)}px"><small>Tuyệt kỹ${dg?" · "+esc(dg):""}</small>${sk?`<em>${esc(sk)}</em>`:""}</div><div class="uc-tap">Chạm để bỏ qua</div>`;
  document.body.appendChild(z);if(typeof spWatch==="function")spWatch(z);
  if(slot){slot.classList.add("hero-hid");hide9(slot,1);}
  const A=[],R=ms=>ms/SPD;
  const an=(e,kf,o)=>{if(!e||!e.animate)return null;const a=e.animate(kf,Object.assign({fill:"both",easing:"linear"},o,{duration:R(o.duration),delay:R(o.delay||0)}));A.push(a);return a;};
  const st0=`translate(${dx}px,${dy}px) scale(${fr.s.toFixed(3)})`;
  an(z.querySelector(".uc-card"),[{transform:st0,opacity:has?1:0,easing:"cubic-bezier(.2,.85,.25,1)"},{transform:`translate(0,-6px) scale(1.07) rotate(${rz}deg)`,opacity:1,offset:oi*.78,easing:"ease-out"},
    {transform:"none",opacity:1,offset:oi},{transform:"translate(0,-5px) scale(1.025)",opacity:1,offset:oh,easing:"cubic-bezier(.55,0,.7,.25)"},{transform:st0,opacity:has?1:0}],{duration:T});
  an(z.querySelector(".uc-dim"),[{opacity:0},{opacity:1,offset:oi*.6},{opacity:1,offset:oh},{opacity:0}],{duration:T});
  an(z.querySelector(".uc-halo"),[{opacity:0,transform:"scale(.3)"},{opacity:1,transform:"scale(1.08)",offset:oi,easing:"ease-out"},{opacity:.85,transform:"scale(1)",offset:oh},{opacity:0,transform:"scale(.45)"}],{duration:T});
  an(z.querySelector(".uc-rays"),[{opacity:0,transform:"rotate(0deg) scale(.5)"},{opacity:.95,transform:"rotate(28deg) scale(1)",offset:oi},{opacity:.8,transform:"rotate(82deg) scale(1.04)",offset:oh},{opacity:0,transform:"rotate(100deg) scale(.6)"}],{duration:T});
  an(z.querySelector(".uc-sh"),[{transform:"translateX(-120%) skewX(-14deg)"},{transform:"translateX(330%) skewX(-14deg)"}],{duration:Math.max(260,HOLD*.7),delay:TIN*.85,easing:"ease-in-out"});
  const tx=[{opacity:0,transform:"translateY(10px)"},{opacity:0,transform:"translateY(10px)",offset:oi*.6},{opacity:1,transform:"none",offset:oi},{opacity:1,transform:"none",offset:oh},{opacity:0,transform:"translateY(8px)",offset:Math.min(1,oh+.08)},{opacity:0,transform:"translateY(8px)"}];
  an(z.querySelector(".uc-lb"),tx,{duration:T});an(z.querySelector(".uc-who"),tx,{duration:T});
  an(z.querySelector(".uc-tap"),[{opacity:0},{opacity:0,offset:oi},{opacity:.7,offset:Math.min(oh,oi+.1)},{opacity:.7,offset:oh},{opacity:0,offset:Math.min(1,oh+.05)},{opacity:0}],{duration:T});
  holdFx(R(T+90));
  try{SFX.fam("ult",s5?{el:elOf(id)}:{el:elOf(id),vol:.55,rate:1.14,noacc:1});}catch(e){}
  const t0=performance.now();let ended=false,sk1=false,tm=0;
  const tA=setTimeout(()=>{if(ended||lo5)return;FXBIG=true;try{FX.burst(cx,cy,c,s5?26:14,s5?260:180);FX.ring(cx,cy,c2,W*.62,s5?5:3);if(s5){FX.sparks(cx,cy,"#ffffff",14,260);FX.shake(4);}}finally{FXBIG=false;}},TIN*.8);
  const end=abort=>{if(ended)return;ended=true;clearTimeout(tm);clearTimeout(tA);A.forEach(a=>{try{a.cancel();}catch(e){}});z.remove();if(UC===ctl)UC=null;
    const s2=document.querySelector(`#board [data-mc="${inst.uid}"]`);for(const e of [slot,s2])if(e){e.classList.remove("hero-hid");hide9(e,0);}
    if(!abort&&has){FX.ring(fr.x,fr.y,c2,Math.max(30,sr.width*.75),3);FX.glow(fr.x,fr.y,c,Math.max(40,sr.width*.95),.35);pulse(`#board [data-mc="${inst.uid}"]`,[{transform:"scale(1.12)"},{transform:"scale(1)"}],260);}
    fin1();};
  const skip=()=>{if(ended||sk1)return;sk1=true;const el=performance.now()-t0;if(el>=TIN+HOLD)return;const q=Math.max(150,Math.min(TOUT,240));
    A.forEach(a=>{try{a.currentTime=TIN+HOLD;a.playbackRate=TOUT/q;}catch(e){}});clearTimeout(tm);tm=setTimeout(()=>end(false),q);
    try{FX_UNTIL=Math.min(FX_UNTIL,performance.now()+q+60);}catch(e){}try{noClick=Date.now()+450;}catch(e){}};
  const ctl={end,skip};UC=ctl;
  z.addEventListener("pointerdown",ev=>{ev.preventDefault();ev.stopPropagation();skip();});
  z.addEventListener("click",ev=>{ev.preventDefault();ev.stopPropagation();});
  tm=setTimeout(()=>end(false),T);
  }catch(e){console.error(e);fin1();}
}
/* bảng thử VFX (dev) gọi ult({id,own}) */
function ult(inst){ultShow(inst,null,0);}
/* FXLV 0 (máy yếu): chỉ loé nhẹ tại ô */
function ucFlash(inst){const el=document.querySelector(`#board [data-mc="${inst.uid}"]`);if(!el||!C[inst.id])return;const q=ctr(el),w=el.getBoundingClientRect().width,[c,c2]=ucCol(inst.id);
  FX.glow(q.x,q.y,c,Math.max(44,w*1.1),.4);FX.ring(q.x,q.y,c2,Math.max(30,w*.8),3);pulse(`#board [data-mc="${inst.uid}"]`,[{transform:"scale(1)"},{transform:"scale(1.25)",offset:.4},{transform:"scale(1)"}],420);
  try{SFX.fam("ult",{el:elOf(inst.id),vol:.5,noacc:1});}catch(e){}holdFx(300);}
/* ---- (b) thẻ nhân vật S5/S4 ra tay ---- */
let HERO={uid:0};
function heroDrop(){if(HERO.uid)heroDown(true);}
function heroUp(evA,R0,R1,P0,P1){
  if(reduced||!G)return;heroDrop();
  const sev=evA.find(e=>e.k==="skill"||e.k==="act"),SRC=sev?sev.uid:((evA.find(e=>e.src>0&&e.k!=="loc")||{}).src||0);
  if(!SRC||!R1.has(SRC))return;const f=E.find(G,SRC);if(!f||!f.inst.rev)return;const d=C[f.inst.id];if(!isHero5(d))return;
  if(!sev&&!evA.some(e=>e.src===SRC))return;
  const el=document.querySelector(`#board [data-mc="${SRC}"]`),r=R1.get(SRC);if(!el||!r||!r.w)return;
  /* mục tiêu: thẻ/chiến địa bị tác động trong bước này */
  const pts=[],seen=new Set([SRC]),addU=u=>{if(!u||seen.has(u)||pts.length>=8)return;seen.add(u);const p=where7(u,R0,R1);if(p&&isFinite(p.x))pts.push(p);};
  for(const e of evA){if(e.k==="skill"||e.k==="act"||e.k==="flip"||e.k==="surge")continue;
    if(e.k==="abcopy"){addU(e.uid===SRC?e.from:e.uid);continue;}
    if(e.k==="loc"||e.k==="locfx"){if(e.src===SRC&&e.li!=null&&pts.length<8){const pl=plate8(e.li);if(pl)pts.push(pl);}continue;}
    if(e.uid!=null)addU(e.uid);}
  for(const [u,v] of P1)if(P0.has(u)&&P0.get(u)!==v&&!ONG29.has(u))addU(u);
  /* gpu35: cỡ nhấc tối đa ~34% bề ngang màn; giữ trong bề ngang làn của mình (không che biển chiến địa bên cạnh) và né số điểm chiến địa */
  const s5=isUlt(d),S=Math.max(1.15,Math.min(s5?1.75:1.6,innerWidth*.34/r.w)),[c,c2]=ucCol(d.id),has=pts.length>0;
  let tx=0,ty=0;for(const p of pts){tx+=p.x/pts.length;ty+=p.y/pts.length;}
  const vx=has?tx-r.x:0,vy=has?ty-r.y:0,L=Math.hypot(vx,vy)||1,lean=has?Math.min(14,L*.12):0;
  const hw=r.w*S/2,hh=r.h*S/2;let nx=Math.min(innerWidth-hw-4,Math.max(hw+4,r.x+vx/L*lean)),ny=Math.min(innerHeight-hh-4,Math.max(hh+4,r.y+vy/L*lean-Math.max(8,r.h*.14)));
  try{const ln=el.closest("[data-lane]"),lr=ln&&ln.getBoundingClientRect();if(lr&&lr.width>=hw*2+2)nx=Math.min(lr.right-hw-1,Math.max(lr.left+hw+1,nx));
    const top=f.inst.side!=="p",ob=ln?[...ln.querySelectorAll(".pw,.mx")].map(e=>e.getBoundingClientRect()).filter(q=>q.width):[];
    for(const q of ob)if(nx+hw>q.left&&nx-hw<q.right&&ny+hh>q.top&&ny-hh<q.bottom)ny=top?Math.min(ny,q.top-hh-2):Math.max(ny,q.bottom+hh+2);
    ny=Math.min(innerHeight-hh-4,Math.max(hh+4,ny));}catch(e){}
  const ox=nx-r.x,oy=ny-r.y,rot=has&&Math.abs(vx)>8?(vx>0?5:-5):0;
  const g=document.createElement("div");g.className="fxg hero5 "+(s5?"s5":"s4");
  g.style.cssText=`left:${(r.x-r.w/2).toFixed(1)}px;top:${(r.y-r.h/2).toFixed(1)}px;width:${r.w.toFixed(1)}px;height:${r.h.toFixed(1)}px;--c:${c};--c2:${c2}`;
  g.innerHTML=`<i class="h5-glow"></i>${cleanCloneHTML(el)}<i class="h5-rim"></i>`;document.body.appendChild(g);if(typeof spWatch==="function")spWatch(g);
  /* gpu29: số sức mạnh của chính thẻ đang nhấc giữ giá trị cũ tới khi kỹ năng của nó xong (bước self29) */
  try{if(P0.has(SRC)&&P1.has(SRC)&&P0.get(SRC)!==P1.get(SRC)&&!ONG29.has(SRC)){const pw=g.querySelector(".pwh");if(pw){pw.textContent=P0.get(SRC);pw.className="pwh";}const dl=g.querySelector(".dl");if(dl)dl.style.visibility="hidden";}}catch(e){}
  el.classList.add("hero-hid");
  const UP=(window.FFTURN&&FFTURN.on)?90:200,tf=`translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px) rotate(${rot}deg) scale(${S})`;
  g.animate([{transform:"none"},{transform:`translate(${(-ox*.15).toFixed(1)}px,4px) scale(.94)`,offset:.22},{transform:`translate(${(ox*1.06).toFixed(1)}px,${(oy*1.06).toFixed(1)}px) rotate(${rot*1.2}deg) scale(${(S*1.04).toFixed(3)})`,offset:.78},{transform:tf}],{duration:UP,easing:"cubic-bezier(.3,.7,.3,1)",fill:"forwards"});
  const gl=g.querySelector(".h5-glow"),rim=g.querySelector(".h5-rim");
  if(gl){gl.animate([{opacity:0,transform:"scale(.6)"},{opacity:.95,transform:"scale(1)"}],{duration:UP,fill:"forwards"});if(!has)gl.animate([{opacity:.95,transform:"scale(1)"},{opacity:1,transform:"scale(1.22)",offset:.4},{opacity:.85,transform:"scale(1)"}],{duration:520,delay:UP,fill:"forwards"});}
  if(rim)rim.animate([{opacity:0},{opacity:1}],{duration:UP,fill:"forwards"});
  HERO={uid:SRC,g,el,s:S,tf,t0:performance.now(),up:UP,self:!has,c,r};
  /* tâm phát đòn = tâm lá thẻ đã nhấc */
  R1.set(SRC,Object.assign({},r,{x:nx,y:ny}));
  FX.glow(nx,ny+hh*.85,c,Math.min(60,r.w*1.1),.5);
  if(!has)fxT(()=>{FX.ring(nx,ny,c2,Math.min(56,r.w*1.2),3);FX.rise(nx,ny+hh*.5,c,10);},UP);
  holdFx(UP+380);}
/* hạ thẻ khi mọi đòn của bước đã xong (có trần) */
/* gpu35: trần giữ thẻ nhấc 1,0 s gốc (≈2,2 s thật ở SPD 2,0 kể cả lúc hạ) — đòn còn lại vẫn bay từ ô thẻ trên bàn */
function heroSched(){const H=HERO;if(!H.uid||H.tm)return;const now=performance.now(),minEnd=H.t0+(H.up+(H.self?560:420))*SPD,cap=H.t0+1000*SPD;
  /* có lịch đòn (plan8) -> hạ ngay sau đòn cuối trúng; không có -> theo thời gian giữ hiệu ứng, tối đa 1,4 s gốc */
  const fx=Math.max(FX_UNTIL,now+Math.min(4800,FXHOLD)*SPD),plan=H.t8>0?H.t0+(H.t8+120)*SPD:Math.min(fx,H.t0+1400*SPD);
  const end=Math.min(cap,fx,Math.max(minEnd,plan)),DOWN=(window.FFTURN&&FFTURN.on)?100:220,at=Math.max(now,end-DOWN*SPD*.5);
  H.tm=setTimeout(()=>{if(HERO===H)heroDown(false);},at-now);holdFx((at-now)/SPD+DOWN+30);}
function heroDown(fast){const H=HERO;if(!H.uid)return;HERO={uid:0};clearTimeout(H.tm);clearInterval(H.iv);const g=H.g,uid=H.uid;
  const show=()=>{for(const e of [H.el,document.querySelector(`#board [data-mc="${uid}"]`)])if(e)e.classList.remove("hero-hid");};
  if(fast||reduced||!g||!g.isConnected){if(g)g.remove();show();return;}
  g.style.opacity="";const DOWN=(window.FFTURN&&FFTURN.on)?100:220;
  const cur=document.querySelector(`#board [data-mc="${uid}"]`);let ex=0,ey=0;if(cur){const b=cur.getBoundingClientRect();if(b.width){ex=b.left+b.width/2-H.r.x;ey=b.top+b.height/2-H.r.y;}}
  const a=g.animate([{transform:H.tf},{transform:`translate(${ex.toFixed(1)}px,${(ey+3).toFixed(1)}px) scale(.97)`,offset:.8},{transform:`translate(${ex.toFixed(1)}px,${ey.toFixed(1)}px)`}],{duration:DOWN,easing:"cubic-bezier(.5,0,.4,1)",fill:"forwards"});
  for(const k of g.querySelectorAll(".h5-glow,.h5-rim"))k.animate([{opacity:getComputedStyle(k).opacity},{opacity:0}],{duration:DOWN*.8,fill:"forwards"});
  let dn=0;const fin=()=>{if(dn)return;dn=1;g.remove();show();};a.onfinish=fin;setTimeout(fin,DOWN*SPD+200);}
/* đòn lao bằng chính thân thẻ (ghostOf9) của thẻ đang nhấc: bản sao cùng cỡ đã nhấc, tạm ẩn thẻ nhấc */
function heroWatch(H){if(H.iv)return;H.iv=setInterval(()=>{if(HERO!==H){clearInterval(H.iv);return;}if(!document.querySelector(".g9h")){H.g.style.opacity="";clearInterval(H.iv);H.iv=0;}},60);}
function playFx(evs,R0,P0){
  try{evs._hand0=new Map(HAND0);evs._snx=SNX;}catch(e){}
  try{if(!reduced&&pre7(evs))holdFx(260);}catch(e){}
  heroDrop();
  let us=reduced?[]:ultsOf(evs);
  /* gpu29: thẻ S4/S5 được KÉO vào chiến địa trong chính bước này (triệu hồi / đặt từ bộ bài): màn ra mắt diễn trong nhịp kỹ năng,
     ngay sau khi thẻ bay tới ô (bước "ult29" của plan8), không diễn trước khi thẻ xuất hiện */
  try{const arr=new Set(evs.filter(e=>e.k==="summon"||(e.k==="top"&&e.a==="place")).map(e=>e.uid)),ef=new Set(evs.filter(e=>e.k==="flip"&&e.eff).map(e=>e.uid));
    const d=us.filter(i=>ef.has(i.uid)&&arr.has(i.uid)&&!evs.some(e=>flip1(e)&&e.uid===i.uid));if(d.length){evs._ultD=d;us=us.filter(i=>!d.includes(i));}}catch(e){}
  if(!us.length)return playFxSeq(evs,R0,P0);
  /* gpu34: máy yếu (FXLV 0) vẫn hiện màn ra mắt (bản nhẹ: không tia xoay, không hạt, không rung) */
  const mid=go=>{let i=0;const nx=()=>{if(i>=us.length){go();return;}ultShow(us[i++],nx,ucNth());};nx();};
  if(!evs.some(flip1)){holdFx(200);mid(()=>{try{playFxSeq(evs,R0,P0);}catch(e){console.error(e);}});return 0;}
  return playFxSeq(evs,R0,P0,mid);
}
/* Tách chuẩn 2 nhịp không chồng chéo: Nhịp 1 lật thẻ + v16 lat_the (420ms) hoàn tất rồi mới sang Nhịp 2 tung kỹ năng.
   gpu26: thẻ S5/S4 -> chen màn ra mắt (mid) giữa Nhịp 1 và Nhịp 2.
   Luật kéo thẻ: thẻ được ĐƯA vào chiến địa bằng hiệu ứng có flip mang eff:1 -> diễn ở Nhịp 2, đúng thứ tự sau khi nó bay xuống (summon/revive) */
function playFxSeq(evs,R0,P0,mid){
  const run=part=>{const hPrev=HAND0,sPrev=SNX;if(evs._hand0)HAND0=evs._hand0;if(evs._snx)SNX=evs._snx;try{return playFxCore(evs,R0,P0,part);}finally{HAND0=hPrev;SNX=sPrev;}};
  if(reduced||!evs.some(flip1)||!evs.some(e=>!flip1(e))){if(!mid)return run();
    run();holdFx(440);fxT(()=>{try{mid(()=>{});}catch(e){console.error(e);}},420);return 0;}
  playFxCore(evs,R0,P0,1);holdFx(440);
  fxT(()=>{const go=()=>{try{run(2);}catch(e){console.error(e);}};if(mid){try{mid(go);}catch(e){console.error(e);go();}}else go();},420);return 0;}
/* ===== gpu29: KẾT QUẢ CHỈ HIỆN KHI ĐÒN TRÚNG =====
   Thứ tự mọi bước: (a) thẻ lật trên bàn -> (b) màn ra mắt S4/S5 -> (c) đòn/hiệu ứng bay tới -> (d) đòn trúng mới đổi bàn.
   Trước E.doStep chụp trạng thái (pvSnap = E.clone). Sau bước, bàn được vẽ theo "khung trước bước" GV: thẻ vừa lật ngửa ra
   nhưng kỹ năng tạm tắt (ab="da"), mọi kết quả (huỷ/dời/triệu hồi/sức mạnh/năng lượng/tay bài) chưa áp. Vẽ kết quả thật
   (pvApply) đúng lúc nhịp kỹ năng bắt đầu (playFxCore phần 2, sau màn ra mắt), khi đó plan8/pre8 che từng kết quả
   (bóng ma thẻ bị huỷ/dời, ẩn thẻ triệu hồi, giữ số sức mạnh/năng lượng/tổng điểm cũ) cho tới lúc đòn trúng (hit8).
   Bước không có thẻ lật/màn ra mắt: không vẽ gì cho tới nhịp kỹ năng (bắt đầu ngay). Giảm hiệu ứng: vẽ thẳng kết quả. */
let GV=null,PVQ=0,PWH=0,PWHT=0,ONG29=new Set();
/* gpu29(c): sức mạnh đổi do Duy Trì / hào quang chiến địa / điều kiện = đổi mà bonus & bp của thẻ KHÔNG đổi (sức mạnh tính động).
   Kỹ năng Lật/Kích Hoạt/Cuối Lượt cộng/trừ thật thì luôn ghi vào bonus/bp -> vẫn có đòn bay từ thẻ nguồn. */
function ong29(P0,P1){const S=SNX,o=new Set();if(!S||!S.bn||S.G!==G)return o;for(const [u,v] of P1){if(!P0.has(u)||P0.get(u)===v||!S.bn.has(u))continue;const c=anyC(u);if(!c)continue;if(S.bn.get(u)===c.bonus&&S.bp.get(u)===c.bp)o.add(u);}return o;}
/* gpu35: chụp xong là GIỮ LUÔN khung trước bước (GV) — kể cả bước không lật (Kích Hoạt / Cuối Lượt): mọi lần vẽ lại xen giữa
   (chờ tải ảnh, chạm màn hình…) vẫn ra trạng thái cũ cho tới nhịp kỹ năng; có chốt an toàn tự nhả sau 6 s */
let PVWD=0;
function pvSnap(){if(reduced||!G)return null;try{hold29Rel();const c=E.clone(G);GV=c;PVQ=1;clearTimeout(PVWD);PVWD=setTimeout(()=>{if(GV===c)pvApply();},6000);return c;}catch(e){return null;}}
function pvApply(){clearTimeout(PVWD);if(!PVQ)return;PVQ=0;GV=null;try{render();}catch(e){console.error(e);}}
/* vẽ khung trước bước; trả P0 tính trên khung đó (để số trên bàn và mốc so sánh khớp nhau) */
function pvShow(G0,evs,R0,P0){clearTimeout(PVWD);PVQ=0;GV=null;
  if(!G0||reduced||!G0.locs){render();return P0;}
  const fl=evs.filter(flip1);let hero=false;try{hero=ultsOf(evs).length>0;}catch(e){}
  /* bước không lật: bàn đang hiện đúng khung trước bước (GV giữ từ pvSnap) -> giữ nguyên tới nhịp kỹ năng, không vẽ lại */
  if(!fl.length&&!hero){GV=G0;PVQ=1;return P0;}
  for(const e of fl){const f=E.find(G0,e.uid);if(!f)continue;const c=f.inst;c.rev=true;c.ab="da";c.xab=null;}
  GV=G0;PVQ=1;let P=P0;
  try{render();const g=G;G=GV;try{P=powers();}finally{G=g;}}catch(e){console.error(e);pvApply();return P0;}
  /* ảnh R0 của thẻ vừa lật = mặt thẻ (bóng ma huỷ/dời/trả về tay dùng đúng mặt, không phải mặt sau) */
  for(const e of fl){const el=document.querySelector(`#board [data-mc="${e.uid}"]`),r=R0&&R0.get(e.uid);if(el&&r)r.html=cleanCloneHTML(el);}
  return P;}
function stepFx(G0,evs,R0,P0){const P=pvShow(G0,evs,R0,P0);return playFx(evs,R0,P);}
/* tổng sức mạnh mỗi bên của chiến địa: giữ số cũ tới khi đòn đổi sức mạnh cuối cùng trúng (tickPw đọc PWH) */
function pwHold(ms){clearTimeout(PWHT);if(!(ms>0)||reduced){PWH=0;tickPw();return;}PWH=performance.now()+ms*SPD;PWHT=setTimeout(()=>{PWH=0;tickPw();},ms*SPD+20);}
let TN0=0,LOCID=[];
function turnFlare(n,o){if(reduced)return;const b=$("btnEnd").getBoundingClientRect(),x=Math.min(innerWidth-40,b.left+b.width*.78),d=document.createElement("div");d.className="tflare";d.textContent=n;d.style.left=x+"px";d.style.top=(b.top-4)+"px";document.body.appendChild(d);fxT(()=>d.remove(),1900);
  FX.pillar(x,b.top+b.height,"#ff7a1f",56,170);FX.sparks(x,b.top,"#ffb04d",18,300);FX.ash(x,b.top,12);SFX.play("boom");fxT(()=>banner(n>o?"THÊM LƯỢT!":"BỚT LƯỢT!","Ván này có "+n+" lượt"),500);}
function endBanner(r){FXBIG=true;try{endBanner0(r);}finally{FXBIG=false;}}function endBanner0(r){const q=ctr($("btnSnap")),w=r.winner,c=w==="p"?"#ffd65a":w==="a"?"#ff6b8a":"#cfd6ff";FX.holo(q.x,q.y,"#7fd0ff",34);FX.wave(q.x,q.y,"#ffffff",90);pulse("#btnSnap",[{transform:"scale(1.5)"},{transform:"scale(1)"}],520);
  if(w==="p")playV16("thang",innerWidth/2,innerHeight*.38,Math.min(innerWidth*.72,290),920,0);else if(w==="a")playV16("thua",innerWidth/2,innerHeight*.38,Math.min(innerWidth*.68,270),860,0);
  FX.rays(innerWidth/2,innerHeight*.42,c,Math.min(innerWidth,420)*.7,18);FX.glow(innerWidth/2,innerHeight*.42,c,200,.6);banner(w==="p"?"CHIẾN THẮNG!":w==="a"?"THẤT BẠI":"HOÀ",w==="p"?"+"+r.stake+" ngọc":w==="a"?"−"+r.stake+" ngọc":"");SFX.play(w==="p"?"chime":"dark");}
/* bản sao nhỏ của chính thẻ nguồn bay tới mục tiêu, tới nơi mới nổ hiệu ứng */
let CHIPN=0;
/* bản sao nhẹ: chỉ ảnh thẻ + viền màu, rẻ hơn nhiều so với nhân bản cả lá bài */
function lite(uid){let c=null;try{c=cardOf(uid);}catch(e){}if(!c)return null;const d=C[c.id];let pw=d.p,cs=d.c;try{const f=E.find(G,uid);pw=f?E.power(G,f.inst,f.li):E.basePow(c)+c.bonus;cs=E.cost(G,c);}catch(e){}
  return `<span class="lc" style="--hc:${HC[d.h]}">${nbL(c.id)}${art(c.id)}<b class="lcc">${cs}</b><b class="lcp">${pw}</b><i class="lcn">${esc(d.n)}</i></span>`;}
function chip(fr,to,html,cb,delay){if(reduced||!fr||!to||!html||CHIPN>=5){if(cb)cb();return;}CHIPN++;
  const g=ghost(fr,html,"fxchip"),dx=to.x-fr.x,dy=to.y-fr.y,lift=-Math.min(60,Math.hypot(dx,dy)*.35);
  const a=g.animate([{transform:"translate(0,0) scale(1)",opacity:1},{transform:`translate(${dx*.5}px,${dy*.5+lift}px) scale(.62) rotate(${dx>0?8:-8}deg)`,opacity:1,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(.34)`,opacity:.9}],{duration:420,delay:delay||0,easing:"cubic-bezier(.45,.05,.55,1)",fill:"both"});
  let done=false;const fin=()=>{if(done)return;done=true;CHIPN--;g.remove();if(cb)cb();};a.onfinish=fin;fxT(fin,(delay||0)+700);}
function playFxCore(evs,R0,P0,part){
  if(part!==1){PWH=performance.now()+5000;try{hold29Start();}catch(e){console.error(e);}pvApply();}
  const evA=evs;if(part===1)evs=evs.filter(flip1);else if(part===2)evs=evs.filter(e=>!flip1(e));
  const R1=rects(),P1=powers();const snd=new Set();
  if(part!==1){try{ONG29=ong29(P0,P1);}catch(e){ONG29=new Set();}try{heroUp(evA,R0,R1,P0,P1);}catch(e){console.error(e);}}
  if(part!==1){let t8=0;PWL=0;HIT29=0;PEND35=new Set();HOLD35={p:0,i:0};try{t8=plan8(evA,R0,R1,P0,P1);if(HERO.uid)HERO.t8=+t8||0;}catch(e){console.error(e);S8=new Set();}try{pwHold(PWL+(HOLD35.p?700:0));}catch(e){}try{hold29Info(HIT29+(HOLD35.i?700:0));}catch(e){}try{post9(evA);}catch(e){}}
  const at=uid=>R1.get(uid)||R0.get(uid);
  let imp=0,ix=0,iy=0,nDes=0;const hit=(k,x,y)=>{if(k>imp){imp=k;ix=x;iy=y;}};
  /* thẻ nguồn của bước này (thẻ vừa dùng kỹ năng) */
  const sev=evs.find(e=>e.k==="skill"||e.k==="act"),SRC=sev?sev.uid:(evs.find(e=>e.src)||{}).src,sR=SRC!=null?at(SRC):null,sH=sR&&(lite(SRC)||sR.html);
  const fromSrc=(uid,cb,i)=>{const t=at(uid);if(sH&&uid!==SRC&&t)chip(sR,t,sH,cb,(i||0)*90);else cb();};
  const destroyed=new Set(),gone=new Set();let ci=0;
  const cues=new Map(),cue=(k,weak)=>{if(k&&(!cues.has(k)||!weak))cues.set(k,!!weak);};let upMax=0,dnMax=0;
  if(part!==1){try{SFX.src(SRC!=null?elU(SRC):null);}catch(e){}}
  const revN={};for(const e of evs)if(e.k==="skill"&&e.t==="rev")revN[e.uid]=(revN[e.uid]||0)+1;
  for(const ev of evs){
    const p=ev.uid!=null?at(ev.uid):null;
    switch(ev.k){
      case "flip": if(TP29.has(ev.uid))break;revealZoom(ev.uid);if(p)try{elFlip(ev.uid,p);}catch(e){}try{const f0=E.find(G,ev.uid),d0=f0?C[f0.inst.id]:null;SFX.reveal({h:d0?d0.h:"S1",el:elU(ev.uid)});}catch(e){}if(p){const f=E.find(G,ev.uid),d=f?C[f.inst.id]:null,c=d?HC[d.h]:"#fff",big=d&&d.c>=5,mine=f&&f.inst.own==="p",q=mine?lvl(f.inst.id):0;
        playV16("lat_the",p.x,p.y,Math.max(92,p.w*(big?1.95:1.72)),400,0);
        FX.sigil(p.x,p.y+p.h*.42,c,p.w*(big?.95:.75),big?8:6,true,big?1.1:.8);FX.glow(p.x,p.y,c,big?90:60);
        if(big){FX.pillar(p.x,p.y+p.h*.45,c,p.w*.9,p.h*2.2);hit(d.c>=6?1:0,p.x,p.y);if(d.c<6)FX.shake(4);}
        if(q===6)FX.sparks(p.x,p.y,"#ffffff",10,240);holdFx(410);} break;
      case "act": if(p){FX.sigil(p.x,p.y+p.h*.42,"#ffd65a",p.w,6,true,1);FX.glow(p.x,p.y,"#ffd65a",90);FX.wave(p.x,p.y,"#ffd65a",60);pulse(`[data-mc="${ev.uid}"]`,[{transform:"scale(1.28)"},{transform:"scale(1)"}],420);} cue("act"); break;
      case "skill": if(p&&HERO.uid&&HERO.uid===ev.uid){/* gpu26: thẻ S5/S4 đang nhấc -> vòng phép nằm dưới chân, không che mặt nhân vật */const c=HERO.c||SKC[ev.t]||"#fff",hh=p.h*HERO.s/2;
          FX.sigil(p.x,p.y+hh*.92,c,p.w*HERO.s*.62,6,true,.9);FX.glow(p.x,p.y+hh*.7,c,Math.min(60,p.w*1.1),.4);}
        else if(p){const c=SKC[ev.t]||"#fff";
        if(ev.t==="rev"){FX.sigil(p.x,p.y,c,p.w*.75,6,false,.75);FX.glow(p.x,p.y,c,56,.32);}
        else if(ev.t==="end"){FX.sigil(p.x,p.y+p.h*.42,c,p.w*.85,5,true,.9);FX.rise(p.x,p.y+10,c,10);}
        else{FX.sigil(p.x,p.y,c,p.w*.65,7,false,.7);FX.glow(p.x,p.y,c,54,.32);}
        pulse(`[data-mc="${ev.uid}"]`,[{transform:"scale(1.18)"},{transform:"scale(1)"}],340);} cue(ev.t==="end"?"endt":ev.t==="react"?"copy":ev.t==="rev"?"":"act"); break;
      case "blocked": if(p&&!S8.has("k"+ev.uid))shield7(ev,p,R0,R1);  break;
      case "locfx": {try{locfx8(ev,R0,R1,evA);}catch(e){console.error(e);}cue("locx",1);break;}
      case "destroy": if(p&&S8.has("d"+ev.uid)){nDes++;destroyed.add(ev.uid);}else if(p){nDes++;destroyed.add(ev.uid);const pp=p;fromSrc(ev.uid,()=>{FX.blade(pp.x,pp.y,"#ff4d5e",pp.w*.9,-2.3,10);fxT(()=>FX.blade(pp.x,pp.y,"#ffd0d6",pp.w*.9,-.85,7),90);FX.glow(pp.x,pp.y,"#ff4d5e",70);FX.ash(pp.x,pp.y,14);FX.shake(5);},ci++);hit(nDes>=3?2:nDes>=2?1:0,p.x,p.y);} if(!S8.has("d"+ev.uid))cue("destroy"); break;
      case "discard": {gone.add(ev.uid);cue("discard");break;}
      case "summon": if(p&&!S8.has("u"+ev.uid)){const pp=p;fromSrc(ev.uid,()=>{FX.sigil(pp.x,pp.y+pp.h*.42,"#8fdc4a",pp.w*.9,6,true,.9);FX.vortex(pp.x,pp.y,"#8fdc4a",12);},ci++);} if(!S8.has("u"+ev.uid))cue("summon"); break;
      case "revive": if(p){if(typeof window.playV16==="function")window.playV16("hoi_sinh",p.x,p.y,Math.max(108,p.w*2.0),560,0);FX.pillar(p.x,p.y+p.h*.45,"#4dffa6",p.w*.9,p.h*2.4);FX.sigil(p.x,p.y+p.h*.42,"#4dffa6",p.w*.9,6,true,1);FX.glow(p.x,p.y,"#4dffa6",70);} cue("revive"); break;
      case "move": {gone.add(ev.uid);if(S8.has("m"+ev.uid)){break;}const a=R0.get(ev.uid),b=R1.get(ev.uid);if(a&&b){if(typeof window.playV16==="function")window.playV16("di_chuyen",b.x,b.y,Math.max(96,(b.w||52)*1.85),480,120);FX.comet(a.x,a.y,b.x,b.y,"#6fc8ff");
          if(!reduced&&b.html)for(const t of [.35,.7]){const g=ghost({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,w:b.w,h:b.h},b.html,"fxai");anim(g,[{opacity:.12+.3*t},{opacity:0}],{duration:380,delay:t*110,easing:"ease-out"});fxT(()=>g.remove(),650);}}
        cue("move");break;}
      case "tohand": gone.add(ev.uid);break;
      case "sil": {if(S8.has("s"+ev.uid))break;const sr=ev.src?at(ev.src):null,stole=!!ev.src&&evA.some(x=>x.k==="morph"&&x.uid===ev.src);let tp=p;
        if(!tp){const c=cardOf(ev.uid),el=c&&c.side==="p"?document.querySelector(`#hand [data-hc="${ev.uid}"]`)||$("meSub"):$("avFoe");if(el){const q=ctr(el);tp={x:q.x,y:q.y,w:50,h:70};}}
        if(tp){seenSil.add(ev.uid);const T=tp,go=()=>{FX.shards(T.x,T.y,"#9aa3c7");FX.miasma(T.x,T.y,5);FX.ring(T.x,T.y,"#cfd6ff",T.w*.7,4);FX.float(T.x,T.y+14,stole?"BỊ CƯỚP KỸ NĂNG":"MẤT KỸ NĂNG","#cfd6ff");
            if(stole&&sr){const l=lite(ev.uid);if(l)chip(T,sr,l,()=>{FX.sigil(sr.x,sr.y,"#c45cff",sr.w*.8,6,false,1.1);FX.glow(sr.x,sr.y,"#c45cff",64);FX.float(sr.x,sr.y-sr.h*.55,"CƯỚP KỸ NĂNG","#d9a6ff");},420);}};
          if(sr){FX.comet(sr.x,sr.y,T.x,T.y,"#b8c0dc");fxT(()=>FX.comet(sr.x,sr.y,T.x,T.y,"#ffffff"),180);fxT(go,520);}else go();cue(stole?"steal":"silence");FXHOLD=Math.max(FXHOLD,stole?1700:1200);pulse(`[data-mc="${ev.uid}"]`,[{transform:"scale(1.18) rotate(-3deg)"},{transform:"scale(1.18) rotate(3deg)"},{transform:"scale(1)"}],700);}
        break;}
      case "morph": if(p&&!S8.has("w"+ev.uid)){const pp=p;fromSrc(ev.uid,()=>{FX.sigil(pp.x,pp.y,"#ff7ac0",pp.w*.75,5,false,.8);FX.vortex(pp.x,pp.y,"#ff7ac0",14);},ci++);} cue(evA.some(x=>x.k==="abcopy"&&x.uid===ev.uid)?"copy":"morph"); break;
      case "surge": {const tg=$(ev.side==="p"?"meSub":"oppSub"),sr=at(ev.src);if(tg){const q=ctr(tg),to={x:q.x,y:q.y,w:40,h:56};
          const go=()=>{FX.bolts(q.x,q.y,"#7fe0ff",7,34);FX.glow(q.x,q.y,"#7fe0ff",46);if(ev.side==="p")FX.float(q.x+20,q.y+18,"−1⚡ +1","#7fe0ff");pulse("#"+tg.id,[{transform:"scale(1.25)"},{transform:"scale(1)"}],360);};
          if(sr){FX.comet(sr.x,sr.y,q.x,q.y,"#7fe0ff");chip(sr,to,lite(ev.src)||sr.html,go,120);}else go();}cue("energy");break;}
      case "loc": {if(S8.has("l"+ev.li)){cue("locrev");break;}locReveal(ev.li);const el=document.querySelector(`[data-lane="${ev.li}"] .locw`);if(el){const q=ctr(el),r=el.closest("[data-lane]").getBoundingClientRect(),c=LHUE[G.locs[ev.li].id]||"#ffd65a";if(LOCID[ev.li]){portal(el,c);FX.vortex(q.x,q.y,c,18);FX.wave(q.x,q.y,"#ffffff",r.width*.6);}FX.sigil(q.x,q.y,c,r.width*.55,8,true,1.3);FX.burst(q.x,q.y,c,14,160);pulse(`[data-lane="${ev.li}"] .locw`,[{transform:"scale(1.08)"},{transform:"scale(1)"}],520);}cue("locrev");break;}
    }
  }
  if(part===1){if(imp>0){FXHOLD=Math.max(FXHOLD,FX.impact(ix,iy,imp));snd.add("boom");}if(snd.has("boom"))SFX.play("boom");return 0;}
  /* nhân đôi lật: thẻ chạy kỹ năng Lật từ 2 lần trong một bước */
  for(const u in revN)if(revN[u]>=2){const p=at(+u);if(p&&p.html&&!reduced){const g=ghost(p,p.html,"fxecho");g.animate([{transform:"scale(1)",opacity:.7},{transform:"scale(1.55)",opacity:0}],{duration:560,iterations:Math.min(3,revN[u]-1),easing:"ease-out"}).onfinish=()=>g.remove();fxT(()=>g.remove(),1800);FX.float(p.x,p.y-p.h*.55,"LẬT ×"+revN[u],"#3fe0ff");}}
  /* hợp thể: thẻ biến khỏi bàn mà không bị tiêu huỷ/vứt/dời/trả về tay, đồng thời có thẻ tăng sức mạnh -> bay vào thẻ đó */
  let gainU=null,gainD=0;for(const [uid,v] of P1){if(!P0.has(uid))continue;const d=v-P0.get(uid);if(d>gainD){gainD=d;gainU=uid;}}
  const morphU=(evs.find(e=>e.k==="morph")||{}).uid,intoU=morphU!=null&&R1.has(morphU)?morphU:gainU;
  if(intoU!=null)for(const [uid,r] of R0)if(!R1.has(uid)&&!destroyed.has(uid)&&!gone.has(uid)&&uid!==intoU){const t=R1.get(intoU);if(t){chip(r,t,lite(uid)||r.html,()=>{FX.vortex(t.x,t.y,"#ff9a2b",14);FX.glow(t.x,t.y,"#ffb04d",70);FX.float(t.x,t.y-t.h*.5,"HỢP THỂ","#ffb04d");},ci++*90);cue("merge");}}
  let up=false,down=false;
  for(const [uid,v] of P1){if(!P0.has(uid))continue;if(evA.x7&&evA.x7.bpU.has(uid))continue;const v0=P0.get(uid),d=v-v0;if(!d)continue;if(S8.has("p"+uid))continue;const p=R1.get(uid);if(!p)continue;
    if(d>0){up=true;const dbl=v0>0&&v===v0*2,pp=p;if(dbl)cue("dbl");upMax=Math.max(upMax,d);
      fromSrc(uid,()=>{if(dbl&&typeof window.playV16==="function")window.playV16("nhan_doi",pp.x,pp.y,Math.max(106,pp.w*1.95),540,0);FX.float(pp.x,pp.y-6,dbl?"×2":"+"+d,dbl?"#ffd65a":"#7dffb0");FX.glow(pp.x,pp.y,"#7dffb0",d>=4?60:40,.32);
        if(d>=3)FX.pillar(pp.x,pp.y+pp.h*.45,d>=6?"#ffd65a":"#7dffb0",pp.w*(d>=6?1:.7),pp.h*(d>=6?2.4:1.6));
        if(dbl&&pp.html&&!reduced){const g=ghost({x:pp.x+pp.w*.7,y:pp.y,w:pp.w,h:pp.h},pp.html,"fxdup");g.animate([{transform:"translateX(0)",opacity:.75},{transform:`translateX(${-pp.w*.7}px)`,opacity:0}],{duration:460,easing:"cubic-bezier(.5,0,.3,1)"}).onfinish=()=>g.remove();fxT(()=>g.remove(),900);}},ci++);
      hit(d>=10?2:d>=6?1:0,p.x,p.y);}
    else{down=true;dnMax=Math.max(dnMax,-d);const pp=p;fromSrc(uid,()=>{FX.float(pp.x,pp.y-6,"−"+(-d),"#ff7a9a");FX.miasma(pp.x,pp.y,-d>=3?8:5);if(-d>=5)FX.shake(3);},ci++);hit(-d>=8?2:-d>=5?1:0,p.x,p.y);}}
  /* tăng năng lượng do kỹ năng thẻ */
  if(G&&G.energy.p>EN0.p&&sH){const o=ctr($("orb")),n=G.energy.p-EN0.p,ob=$("orb");if(ob&&!reduced)ob.textContent=String(EN0.p);/* gpu29: số năng lượng đổi khi viên năng lượng bay tới */chip(sR,{x:o.x,y:o.y,w:40,h:56},sH,()=>{if(ob&&G)ob.textContent=String(G.energy.p);if(typeof window.playV16==="function")window.playV16("nang_luong",o.x,o.y,118,520,0);FX.glow(o.x,o.y,"#3fe0ff",60);FX.float(o.x,o.y-34,"+"+n+" năng lượng","#7fe0ff");pulse("#orb",[{transform:"scale(1.35)"},{transform:"scale(1)"}],420);},ci++*90);cue("egain");}
  for(let i=0;i<3;i++)for(const sd of E.SIDES)for(const c of G.locs[i].cards[sd])if(c.sil&&!seenSil.has(c.uid)){seenSil.add(c.uid);const p=R1.get(c.uid);if(p){FX.shards(p.x,p.y,"#9aa3c7");FX.float(p.x,p.y+12,"MẤT KỸ NĂNG","#cfd6ff");down=true;}}
  if(up&&!cues.has("dbl"))cue(upMax>=6?"up3":upMax>=3?"up2":"up1");if(down)cue(dnMax>=6?"dn3":dnMax>=3?"dn2":"dn1");
  /* gpu29: có thẻ được kéo vào trong bước (đặt từ bộ bài / triệu hồi S4-S5 có màn ra mắt): phần diễn tay bài/thẻ tạo ra
     chờ tới khi thẻ đó đáp xuống ô và màn ra mắt xong (PULLD29, tính trong plan8), lá mới trên tay ẩn tới lúc đó */
  if(part!==1&&PULLD29>0&&!reduced){const D=PULLD29,hid=[];document.querySelectorAll("#hand [data-hc]").forEach(el=>{if(!HAND0.has(+el.dataset.hc)){el.style.opacity="0";hid.push(el);}});
    const h0=HAND0,ev0=evA;fxT(()=>{const hp=HAND0;HAND0=h0;try{hid.forEach(el=>el.style.opacity="");try{fx7(ev0,R0,P0);}catch(e){console.error(e);}try{cardFx(ev0,R0,P0);}catch(e){}}finally{HAND0=hp;}},D);holdFx(D+200);}
  else{try{fx7(evA,R0,P0);}catch(e){console.error(e);}
  try{cardFx(evA,R0,P0);}catch(e){}}
  try{const tn=E.turns(G);if(TN0&&tn!==TN0)turnFlare(tn,TN0);TN0=tn;for(let i=0;i<3;i++)LOCID[i]=G.locs[i].rvl?G.locs[i].id:null;}catch(e){}
  let hold=0;if(imp>0){hold=FX.impact(ix,iy,imp);snd.add("boom");FXHOLD=Math.max(FXHOLD,hold);}
  if(ci>1)FXHOLD=Math.max(FXHOLD,Math.min(600,ci*90));
  /* âm thanh theo họ kỹ năng: mỗi hiệu ứng thật sự xảy ra -> đúng một tiếng của họ đó (nhuộm theo hệ thẻ nguồn), tối đa 3 tiếng, so le nhẹ */
  if(snd.has("boom")&&part!==1)SFX.play("boom");
  if(![...cues.values()].every(w=>w)){for(const [k,w] of [...cues])if(w)cues.delete(k);}
  if(!cues.size&&sev&&sev.k==="skill"&&sev.t==="rev"){const c0=anyC(sev.uid);if(c0&&!c0.sil){const fk=SFX.famOf(E.ab?E.ab(c0):c0.id);if(fk&&fk!=="none")cue(fk);}}
  {const PRI=["destroy","exile","locx","act","revive","steal","silence","copy","merge","morph","summon","create","discard","move","swap","block","dbl","up3","up2","up1","dn3","dn2","dn1","egain","energy","costup","costdn","aura","endt","locrev"];
   const ks=[...cues.keys()].sort((a,b)=>(PRI.indexOf(a)<0?99:PRI.indexOf(a))-(PRI.indexOf(b)<0?99:PRI.indexOf(b))).slice(0,3);
   ks.forEach((k,i)=>SFX.fam(k,{delay:i*.09,vol:i?.8:1}));}
  try{heroSched();}catch(e){}
  return hold;
}

/* ===== hiệu ứng thẻ cấp 2: tiêu huỷ, trả về tay, rút bài, vứt bỏ, triệu hồi, hồi sinh, biến hình, di chuyển, tăng/giảm sức mạnh, đổi chủ chiến địa, bắt đầu lượt ===== */
let HAND0=new Map();
function snapHand(){const m=new Map();document.querySelectorAll("#hand [data-hc]").forEach(el=>{const r=el.getBoundingClientRect();m.set(+el.dataset.hc,{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,html:cleanCloneHTML(el)});});return m;}
/* Đồ hoạ GPU: giữ nguyên lá bài chi tiết đầy đủ với lớp ghép phần cứng 3D */
let GPUON=true;try{GPUON=JSON.parse(localStorage.getItem(KEY)||"{}").gpu!==false;}catch(e){}store.gpu=GPUON;document.body.classList.toggle("gpu",GPUON);
function ghost(r,html,cls){const g=document.createElement("div");g.className="fxg"+(cls?" "+cls:"");if(!html||/^<i data-(?:mc|hc)=/.test(html)){const m=/data-(?:mc|hc)="(\d+)"/.exec(html||""),uid=m?+m[1]:0,el=uid?(document.querySelector(`#board [data-mc="${uid}"]`)||document.querySelector(`#hand [data-hc="${uid}"]`)):null;html=el?cleanCloneHTML(el):(uid&&lite(uid))||html||"";}if(html&&html.indexOf('class="lc')>=0)g.className+=" gl";g.style.left=(r.x-r.w/2)+"px";g.style.top=(r.y-r.h/2)+"px";g.style.width=r.w+"px";g.style.height=r.h+"px";g.innerHTML=html;document.body.appendChild(g);if(typeof spWatch==="function")spWatch(g);return g;}
const noF=kf=>Array.isArray(kf)?kf.map(k=>{if(k&&k.filter!==undefined){const o=Object.assign({},k);delete o.filter;return o;}return k;}):kf;
function anim(el,kf,o){if(reduced||!el||!el.animate)return null;return el.animate(noF(kf),Object.assign({duration:500,easing:"cubic-bezier(.2,.9,.3,1)",fill:"both"},o||{}));}
function rmAfter(a,el,ms){if(a)a.onfinish=()=>el.remove();fxT(()=>el.remove(),ms||1400);}
function portal(el,c){if(reduced||!el)return;const b=el.getBoundingClientRect(),p=document.createElement("div");p.className="fxportal";const s=Math.max(b.width,b.height)*1.15;p.style.cssText=`left:${b.left+b.width/2}px;top:${b.top+b.height/2}px;width:${s}px;height:${s}px;--c:${c}`;document.body.appendChild(p);fxT(()=>p.remove(),950);}
function banner(t,s){if(reduced)return;document.querySelectorAll(".tbn").forEach(e=>e.remove());const b=document.createElement("div");b.className="tbn";b.innerHTML=`<b>${t}</b>${s?`<small>${s}</small>`:""}`;document.body.appendChild(b);SFX.play("turn");holdFx(760);fxT(()=>b.remove(),780);}
const CFX={
  destroy(r){if(reduced||!r||!r.html)return;holdFx(860);const g0=ghost(r,r.html);
    anim(g0,[{transform:"none",filter:"none"},{transform:"translateX(-5px) rotate(-4deg)",filter:"brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)",offset:.3},{transform:"translateX(5px) rotate(4deg)",offset:.6},{transform:"scale(1.06)",filter:"brightness(3) saturate(0)"}],{duration:260});
    fxT(()=>{g0.remove();for(const [cp,d] of [["inset(0 50% 0 0)",-1],["inset(0 0 0 50%)",1]]){const g=ghost(r,r.html);g.style.clipPath=cp;
      rmAfter(anim(g,[{transform:"none",opacity:1,filter:"brightness(2) grayscale(.5)"},{transform:`translate(${d*42}px,80px) rotate(${d*30}deg)`,opacity:0,filter:"brightness(.5) grayscale(1)"}],{duration:560,easing:"cubic-bezier(.45,0,.85,.6)"}),g);}
      FX.shards(r.x,r.y,"#ff4d5e");},260);},
  vanish(r){if(reduced||!r||!r.html)return;holdFx(520);const g=ghost(r,r.html);rmAfter(anim(g,[{opacity:1,filter:"none"},{opacity:0,transform:"translateY(-24px) scale(.85)",filter:"blur(4px) brightness(2)"}],{duration:500}),g);FX.rise(r.x,r.y,"#cfd6ff",12);},
  toFoe(r){const av=$("avFoe");if(reduced||!r||!r.html||!av)return;holdFx(680);const q=av.getBoundingClientRect(),g=ghost(r,r.html),dx=q.left+q.width/2-r.x,dy=q.top+q.height/2-r.y;
    rmAfter(anim(g,[{transform:"none",opacity:1},{transform:"translateY(-20px) scale(1.15)",filter:"brightness(1.8)",offset:.25},{transform:`translate(${dx}px,${dy}px) scale(.25) rotate(-24deg)`,opacity:.15}],{duration:660,easing:"cubic-bezier(.5,0,.3,1)"}),g);
    FX.comet(r.x,r.y,r.x+dx,r.y+dy,"#ffb3e0");FX.glow(r.x,r.y,"#ffb3e0",60);},
  fromBoard(el,r){if(!el||!r)return;holdFx(680);const b=el.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2,dx=r.x-cx,dy=r.y-cy,s=r.w/b.width;
    anim(el,[{transform:`translate(${dx}px,${dy}px) scale(${s})`,filter:"brightness(2)"},{transform:`translate(${dx*.4}px,${dy*.4-44}px) scale(${(s+1.25)/2}) rotate(-8deg)`,offset:.5},{transform:"none",filter:"none"}],{duration:660,fill:"none"});
    FX.comet(r.x,r.y,cx,cy,"#9ff2ff");fxT(()=>FX.wave(cx,cy,"#9ff2ff",50),540);},
  drawIn(el,cr,k){if(!el)return;const dl=(k||0)*115;holdFx(460+dl);const b=el.getBoundingClientRect(),c=cr?"#ffd65a":"#9ff2ff";
    anim(el,[{transform:"translate(150px,40px) rotate(28deg) scale(.45)",opacity:0},{transform:"translateY(-28px) scale(1.12)",opacity:1,filter:"brightness(1.7)",offset:.65},{transform:"none",filter:"none"}],{duration:450,delay:dl,fill:"backwards"});
    fxT(()=>{FX.glow(b.left+b.width/2,b.top+b.height/2,c,64);FX.sparks(b.left+b.width/2,b.top+b.height/2,c,cr?18:9,210);},340+dl);},
  burn(r){if(reduced||!r||!r.html)return;holdFx(660);playV16("thieu_dot",r.x,r.y-16,Math.max(104,(r.w||50)*1.95),560,0);const g=ghost(r,r.html);
    rmAfter(anim(g,[{transform:"none",opacity:1,filter:"none"},{transform:"translateY(-30px) scale(1.08)",filter:"brightness(1.7) sepia(1) saturate(6) hue-rotate(-25deg)",opacity:1,offset:.4},{transform:"translateY(-80px) scale(.85)",filter:"brightness(.3) sepia(1) blur(4px)",opacity:0}],{duration:640}),g);
    FX.rise(r.x,r.y,"#ff8a2b",26);FX.rise(r.x,r.y-20,"#ffd27a",14);},
  summon(el,c){if(!el)return;holdFx(620);speedBurst(el,c||"#c8ff9a");anim(el,[{transform:"scale(0) rotate(-30deg)",filter:"brightness(3)",opacity:0},{transform:"scale(1.28) rotate(5deg)",filter:"brightness(1.8)",opacity:1,offset:.6},{transform:"none",filter:"none"}],{duration:600,fill:"none"});portal(el,c||"#8fdc4a");},
  revive(el){if(!el)return;holdFx(700);anim(el,[{transform:"translateY(44px) scale(.7)",opacity:0,filter:"brightness(3)"},{transform:"translateY(-8px) scale(1.12)",opacity:1,filter:"brightness(1.8)",offset:.6},{transform:"none",filter:"none"}],{duration:680,fill:"none"});portal(el,"#4dffa6");},
  morph(el){if(!el)return;holdFx(620);anim(el,[{transform:"perspective(500px) rotateY(0)"},{transform:"perspective(500px) rotateY(90deg) scale(1.15)",filter:"brightness(3)",offset:.45},{transform:"perspective(500px) rotateY(0)",filter:"none"}],{duration:600,fill:"none"});},
  move(el,r){if(!el||!r)return;const b=el.getBoundingClientRect(),dx=r.x-(b.left+b.width/2),dy=r.y-(b.top+b.height/2);if(Math.abs(dx)+Math.abs(dy)<4)return;holdFx(540);
    anim(el,[{transform:`translate(${dx}px,${dy}px)`},{transform:`translate(${dx/2}px,${dy/2-36}px) scale(1.2) rotate(${dx>0?-8:8}deg)`,offset:.5},{transform:"none"}],{duration:520,fill:"none"});},
  buff(el,d){if(!el)return;const r=el.getBoundingClientRect();playV16("tang_suc",r.left+r.width/2,r.top+r.height/2,Math.max(96,r.width*1.85),500,0);holdFx(520);
    anim(el,[{transform:"none",filter:"none"},{transform:"scale(1.2) translateY(-6px)",filter:"brightness(1.6) drop-shadow(0 0 10px #3dffb4)",offset:.35},{transform:"none",filter:"none"}],{duration:500,fill:"none"});
    anim(el.querySelector(".pwh"),[{transform:"scale(1)"},{transform:"scale(2.1) rotate(-10deg)",offset:.35},{transform:"scale(1)"}],{duration:500,fill:"none"});},
  debuff(el){if(!el)return;const r=el.getBoundingClientRect();playV16("giam_suc",r.left+r.width/2,r.top+r.height/2,Math.max(96,r.width*1.85),500,0);holdFx(520);
    anim(el,[{transform:"none"},{transform:"translateX(-6px) rotate(-3deg)",filter:"brightness(.7) sepia(1) hue-rotate(220deg) saturate(3)",offset:.2},{transform:"translateX(6px) rotate(3deg)",offset:.4},{transform:"translateX(-3px)",offset:.6},{transform:"none",filter:"none"}],{duration:500,fill:"none"});}
};
function cardFx(evs,R0,P0){
  const R1=rects(),mcEl=u=>document.querySelector(`#board [data-mc="${u}"]`),destroyed=new Set(),disc={p:0,a:0};
  const FD=0,hf=new Map(),hm=G.maxE.p>ME0.p;for(const e of evs)if(e.k==="tohand"&&e.side==="p"&&!R0.has(e.uid)&&e.src){const sp=srcPt(e.src,R0);if(sp)hf.set(e.uid,sp);}
  try{srcFx(evs,R0);if(hm){hammerFx();holdFx(1120);}}catch(e){}
  for(const ev of evs){
    if(ev.k==="destroy"){destroyed.add(ev.uid);if(!S8.has("d"+ev.uid))CFX.destroy(R0.get(ev.uid));}
    else if(ev.k==="summon"){if(!S8.has("u"+ev.uid)&&!window.CardChoreo)CFX.summon(mcEl(ev.uid));}
    else if(ev.k==="revive")CFX.revive(mcEl(ev.uid));
    else if(ev.k==="morph"){if(!S8.has("w"+ev.uid))CFX.morph(mcEl(ev.uid));}
    else if(ev.k==="move"){if(!S8.has("m"+ev.uid))CFX.move(mcEl(ev.uid),R0.get(ev.uid));}
    else if(ev.k==="discard")disc[ev.side]++;
  }
  const inHand=s=>new Set(G.hand[s].map(c=>c.uid)),hp=inHand("p"),ha=inHand("a");
  for(const [uid,r] of R0){if(R1.has(uid)||destroyed.has(uid)||hp.has(uid)||S8.has("h"+uid))continue;if(ha.has(uid))CFX.toFoe(r);else CFX.vanish(r);}
  const isPureLoc=evs.length>0&&evs.every(e=>e.k==="loc");
  let k=0;if(!isPureLoc)document.querySelectorAll("#hand [data-hc]").forEach(el=>{const u=+el.dataset.hc;if(HAND0.has(u))return;
    if(R0.has(u)){if(!S8.has("h"+u))CFX.fromBoard(el,R0.get(u));}else if(hf.has(u))CFX.drawFrom(el,hf.get(u),k++ +FD/90);else{const c=G.hand.p.find(x=>x.uid===u);CFX.drawIn(el,c&&c.cr,k++);}});
  for(const [uid,v] of P1now()){if(!P0.has(uid))continue;const d=v-P0.get(uid);if(S8.has("p"+uid))continue;if(d>0)CFX.buff(mcEl(uid),d);else if(d<0)CFX.debuff(mcEl(uid));}
}
function P1now(){return powers();}

let PWV={};
function tickPw(){const nv={},hold=PWH>performance.now();document.querySelectorAll("#board [data-lane]").forEach(ln=>{const li=ln.dataset.lane;ln.querySelectorAll(".pw").forEach(el=>{
  /* gpu35: đích thật lưu ở data-v -> lần gọi sau (khi ô không bị vẽ lại) không đọc nhầm số đang chạy dở làm đích (lỗi tổng điểm kẹt số sai/âm) */
  const k=li+(el.classList.contains("a")?"a":"p"),to=el.dataset.to!=null?+el.dataset.to:el.dataset.v!=null?+el.dataset.v:parseInt(el.textContent,10);const fr=PWV[k];
  if(!isNaN(to))el.dataset.v=to;
  if(hold&&fr!=null&&!isNaN(to)&&fr!==to&&!reduced){el._tk=0;el.dataset.to=to;el.textContent=fr;nv[k]=fr;return;}delete el.dataset.to;nv[k]=to;
  if(fr==null||fr===to||isNaN(to)||reduced){if(!isNaN(to)&&!el._tk&&el.textContent!==String(to))el.textContent=to;return;}el.classList.add("tick");const t0=performance.now(),D=Math.min(700,250+Math.abs(to-fr)*40),tk=el._tk=(el._tk|0)+1;el.textContent=fr;
  const st=t=>{if(el._tk!==tk)return;const q=Math.max(0,Math.min(1,(t-t0)/D)),v=Math.round(fr+(to-fr)*(1-Math.pow(1-q,3)));if(el.isConnected)el.textContent=v;if(q<1&&el.isConnected)requestAnimationFrame(st);else el._tk=0;};requestAnimationFrame(st);});});PWV=nv;
  /* gpu35: màu/viền bên dẫn + nhãn ×/± và số Bài/Tay giữ như cũ cùng lúc với tổng điểm */
  try{if(hold&&!reduced)hold29Lanes();else hold29LanesRel();hold29Subs();}catch(e){console.error(e);}}
function snapFx(c,txt){if(reduced)return;FXBIG=true;try{snapFx0(c,txt);}finally{FXBIG=false;}}function snapFx0(c,txt){{const sw=document.createElement("div");sw.className="sweep";document.body.appendChild(sw);fxT(()=>sw.remove(),950);const q=ctr($("btnSnap"));playV16("cuoc_x2",q.x,q.y,138,680,0);playV16("cuoc_x2",innerWidth/2,innerHeight*.42,220,780,40);FX.holo(q.x,q.y,c);FX.wave(q.x,q.y,c,110);FX.flash(c,.22);}const d=document.createElement("div");d.className="snapfx";d.style.setProperty("--c",c);d.innerHTML=`<b>${txt}</b>`;document.body.appendChild(d);fxT(()=>d.remove(),1150);FX.shake(6);}
function endFinale(){if(reduced)return 0;let any=false;for(let i=0;i<3;i++){const ln=document.querySelector(`[data-lane="${i}"]`);if(!ln)continue;const w=E.lead(G,i);if(!w)continue;any=true;ln.classList.add(w==="p"?"won":"lost");
  const lw=ln.querySelector(".locw"),q=ctr(lw),av=$(w==="p"?"avMe":"avFoe"),t=ctr(av),c=w==="p"?"#ffd65a":"#ff6b8a";
  fxT(()=>{FXBIG=true;try{FX.glow(q.x,q.y,c,110);FX.rays(q.x,q.y,c,90,12);FX.comet(q.x,q.y,t.x,t.y,c);}finally{FXBIG=false;}fxT(()=>FX.wave(t.x,t.y,c,60),420);},250+i*260);}
  return any?1500:0;}
/* ===== v5: nhóm chiến địa, nền sân sống, lộ diện theo nhóm ===== */
const LTH={};for(const [t,ids] of Object.entries({nuoc:"village spring falls ferry mirror",lua:"forge volcano arena",rung:"meadow forest bamboo terrace anthill den",suong:"mist snow crystal gate windhill watch",thieng:"temple shrine treasure market",toi:"abyss graveyard cave limbo blackmarket swamp reverse"}))for(const id of ids.split(" "))LTH[id]=t;for(const k in LT.LOC)if(!LTH[k]&&LT.LOC[k].th)LTH[k]=LT.LOC[k].th;
const LTC={nuoc:"#40d8ff",lua:"#ff7a1f",rung:"#7dde5a",suong:"#d6e8ff",thieng:"#ffd65a",toi:"#b06bff"};
const LAMB=[null,null,null];
let ambQ=0,ambPos=[];function syncAmb(){if(window.GLFX&&GLFX.ok){clearAmb();return;}const pos=ambPos=[];let host=$("lamb");if(!host){host=document.createElement("div");host.id="lamb";host.setAttribute("aria-hidden","true");$("app").insertBefore(host,$("app").firstChild);}
  for(let li=0;li<3;li++){const L=G&&G.locs[li],t=L&&L.rvl&&!L.gone?LTH[L.id]:null,ln=document.querySelector(`#board [data-lane="${li}"]`);let el=LAMB[li];
    if(el&&el.dataset.t!==(t||"")){const old=el;old.classList.remove("on");fxT(()=>old.remove(),1300);el=LAMB[li]=null;}
    if(t&&!el){el=document.createElement("div");el.className="lamb "+t;el.dataset.t=t;let h="";const n=t==="suong"?18:t==="toi"?10:16;
      for(let k=0;k<n;k++)h+=`<i style="--x:${(5+Math.random()*85).toFixed(1)}%;--s:${(4+Math.random()*6).toFixed(1)}px;--t:${(4+Math.random()*5).toFixed(1)}s;--d:${(-Math.random()*8).toFixed(1)}s"></i>`;
      el.innerHTML=h;host.appendChild(el);LAMB[li]=el;requestAnimationFrame(()=>el.classList.add("on"));}
    if(el&&ln)pos.push([el,ln]);}
  /* đọc kích thước một lần, ghi sau – tránh bắt trình duyệt dàn trang lại nhiều lần mỗi lượt vẽ */
  if(pos.length&&!ambQ){ambQ=requestAnimationFrame(()=>{ambQ=0;const pos=ambPos.filter(([e,l])=>l.isConnected),b=$("board").getBoundingClientRect(),rs=pos.map(([e,l])=>l.getBoundingClientRect());pos.forEach(([e],i)=>{const r=rs[i];e.style.left=(r.left-4)+"px";e.style.width=(r.width+8)+"px";e.style.top=(b.top-6)+"px";e.style.height=(b.height+12)+"px";});});}}
function clearAmb(){for(let li=0;li<3;li++){if(LAMB[li])LAMB[li].remove();LAMB[li]=null;}}
function locReveal(li){if(reduced)return;const ln=document.querySelector(`#board [data-lane="${li}"]`),lw=ln&&ln.querySelector(".locw");if(!lw)return;const L=G.locs[li],t=LTH[L.id]||"thieng",c=LTC[t],q=ctr(lw),r=ln.getBoundingClientRect();
  playV16("hien_dia",q.x,q.y,Math.max(148,r.width*1.48),760,0);
  const d=document.createElement("div");d.className="lrev "+t;let w=r.width*2.1,h=w;if(t==="lua"){w=r.width*.9;h=r.height*.9;}if(t==="thieng"){w=r.width*.7;h=r.height*1.1;}if(t==="suong"){w=r.width*2.4;h=r.width*1.4;}
  d.style.cssText=`left:${q.x}px;top:${t==="thieng"?q.y:q.y}px;width:${w}px;height:${h}px`;document.body.appendChild(d);fxT(()=>d.remove(),1700);
  if(t==="nuoc"){FX.burst(q.x,q.y,"#bff4ff",30,260);FX.burst(q.x,q.y,c,20,180);}
  else if(t==="lua"){FX.rise(q.x,q.y+30,"#ffd27a",30);FX.rise(q.x,q.y+30,"#ff6a1f",24);FX.shake(4);}
  else if(t==="rung"){FX.shards(q.x,q.y,"#7dde5a");FX.shards(q.x,q.y,"#ffd65a");FX.glow(q.x,q.y,c,90);}
  else if(t==="suong"){FX.burst(q.x,q.y,"#ffffff",26,140);FX.glow(q.x,q.y,"#e6f0ff",110);}
  else if(t==="thieng"){FX.rays(q.x,q.y,c,110,14);FX.rise(q.x,q.y+20,"#fff6c8",22);FX.glow(q.x,q.y,c,110);}
  else{FX.vortex(q.x,q.y,c,26);FX.glow(q.x,q.y,"#3a0a5a",100);FX.shake(3);}}
function speedBurst(el,c){if(reduced||!el)return;const b=el.getBoundingClientRect(),d=document.createElement("div"),s=Math.max(b.width,b.height)*1.3;d.className="fxburst";d.style.cssText=`left:${b.left+b.width/2}px;top:${b.top+b.height/2}px;width:${s}px;height:${s}px;--c:${c||"#fff"}`;document.body.appendChild(d);fxT(()=>d.remove(),600);}
function landDust(){if(reduced)return;document.querySelectorAll("#board .mc.land").forEach(el=>{const q=ctr(el);FX.dust(q.x,q.y+el.offsetHeight*.45,"#e8ecff");FX.ring(q.x,q.y,"#bfe6ff",34,3);});}
function foeInfo(){let p=$("foeInfo");if(!p){p=document.createElement("div");p.id="foeInfo";p.setAttribute("role","dialog");p.setAttribute("aria-label","Số liệu đối thủ");document.body.appendChild(p);}
  if(p.classList.contains("on")||!G){p.classList.remove("on");return;}
  let onB=0;for(let i=0;i<3;i++)onB+=G.locs[i].cards.a.filter(c=>c.rev).length;
  const row=(k,v)=>`<div class="fr"><span>${k}</span><b>${v}</b></div>`;
  p.innerHTML=`<h4>Đối thủ</h4>${row("Thẻ trên tay",G.hand.a.length)}${row("Thẻ trong bộ bài",G.deck.a.length)}${row("Thẻ đã lật trên sân",onB)}${row("Thẻ đã bị tiêu huỷ",(G.cnt.destOwn&&G.cnt.destOwn.a)||0)}${row("Thẻ đã vứt bỏ",(G.cnt.disc&&G.cnt.disc.a)||0)}${row("Đã cược",G.snap&&G.snap.a?"Có":"Chưa")}`;
  p.classList.add("on");}

/* ===== ĐẤU ONLINE (kênh room của trang) + ghép trận, cảm xúc, cài đặt, năng lượng ===== */
function hsx(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
/* kênh giả lập bằng BroadcastChannel khi chạy ngoài trang chính thức (thử nghiệm 2 tab) */
function mockRoom(){const me="t"+Math.random().toString(36).slice(2,10);
  function mk(name){let bc;try{bc=new BroadcastChannel("ltd-room-"+name);}catch(e){return null;}let pres={};const peers=new Map(),fns=new Set();
    const snap=()=>{const now=Date.now(),arr=[{peer:me,by:null,isMe:true,sameTab:true,kind:"viewer",guest:false,presence:pres,updatedAt:now}];for(const [p,v] of peers)if(now-v.seen<5000)arr.push({peer:p,by:null,isMe:false,sameTab:false,kind:"viewer",guest:false,presence:v.pres,updatedAt:v.up});return arr;};
    const fire=()=>{const ps=snap();for(const f of fns)try{f({peers:ps,joined:[],left:[],updated:[]});}catch(e){}};
    const send=t=>{try{bc.postMessage({t:t||"p",peer:me,pres});}catch(e){}};
    bc.onmessage=e=>{const m=e.data;if(!m||m.peer===me)return;if(m.t==="bye"){peers.delete(m.peer);fire();return;}const old=peers.get(m.peer),ch=!old||JSON.stringify(old.pres)!==JSON.stringify(m.pres);peers.set(m.peer,{pres:m.pres,seen:Date.now(),up:ch?Date.now():old.up});if(ch)fire();if(m.t==="hello")send();};
    const iv=setInterval(()=>{send();const now=Date.now();let gone=false;for(const [p,v] of peers)if(now-v.seen>5000){peers.delete(p);gone=true;}if(gone)fire();},900);
    send("hello");
    return {name,presence(patch){const n={...pres};for(const k in patch){if(patch[k]===null)delete n[k];else n[k]=patch[k];}pres=n;send();setTimeout(fire,0);return Promise.resolve();},
      peers:snap,onPeers(fn){fns.add(fn);setTimeout(()=>{try{fn({peers:snap(),joined:[],left:[],updated:[]});}catch(e){}},0);return()=>fns.delete(fn);},
      connected:()=>true,onConnection(fn){setTimeout(()=>fn(true),0);return()=>{};},emit(){return Promise.resolve();},on(){return()=>{};},
      leave(){clearInterval(iv);try{bc.postMessage({t:"bye",peer:me});bc.close();}catch(e){}fns.clear();return Promise.resolve();}};}
  const lobby=mk("lobby");if(!lobby)return null;lobby.join=n=>Promise.resolve(mk(n));lobby.mock=true;return lobby;}
let ROOMP=null;
function getRoom(){if(!ROOMP)ROOMP=(async()=>{if(window.claude&&typeof claude.use==="function"){try{return await claude.use("room");}catch(e){return null;}}return mockRoom();})();return ROOMP;}
/* lật góc nhìn: trạng thái gốc (chủ phòng là "p") -> góc nhìn của khách */
function mirrorG(o){if(Array.isArray(o))return o.map(mirrorG);if(o&&typeof o==="object"){const r={},pa=("p" in o)&&("a" in o);for(const k in o){const nk=pa&&k==="p"?"a":pa&&k==="a"?"p":k;r[nk]=mirrorG(o[k]);}return r;}return o==="p"?"a":o==="a"?"p":o;}
function hashSt(g){let s=g.turn+"|"+g.energy.p+","+g.energy.a;for(let i=0;i<3;i++){s+="|"+g.locs[i].id;for(const sd of ["p","a"])for(const c of g.locs[i].cards[sd])s+=","+c.uid+":"+c.id+":"+(c.rev?E.power(g,c,i):0);}s+="|"+g.hand.p.map(c=>c.uid).join(".")+"|"+g.hand.a.map(c=>c.uid).join(".");return hsx(s);}
const OL={st:"idle"};
const okDeck=dk=>Array.isArray(dk)&&dk.length===12&&dk.every(id=>typeof id==="string"&&C[id]&&E.COLLECT.includes(id));
const olName=s=>String(s||"").replace(/[\u0000-\u001f<>]/g,"").slice(0,24)||"Đối thủ";
function myPres(){return {v:2,pid:accA().gid,nm:olName(store.name||"Người chơi"),av:C[store.avatar]?store.avatar:store.deck[0],rk:store.gems|0,dk:store.deck.slice(0,12)};}
/* ---- màn ghép trận ---- */
function mmShow(online){if(window.BGM)BGM.stop();const m=$("mm");m.classList.add("on");m.classList.remove("found");$("mmAvMe").innerHTML=meAv();$("mmNmMe").textContent=olName(store.name||"Bạn");$("mmRkMe").innerHTML=icn("gems")+(store.gems|0);
  $("mmFoe").classList.remove("on");$("mmBig").textContent="Đang tìm đối thủ…";$("mmSt").textContent=online?"Đang ghép trận với người chơi khác…":"Đang ghép trận…";$("mmCancel").style.display="";OL.t0show=Date.now();mmClock();}
function mmClock(){clearInterval(OL.clk);OL.clk=setInterval(()=>{if(!$("mm").classList.contains("on")){clearInterval(OL.clk);return;}if(OL.st==="seek"){const s=Math.floor((Date.now()-OL.t0show)/1000);$("mmSt").textContent=`Đang ghép trận với người chơi khác… ${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;}},1000);}
function mmFound(p,bot){const m=$("mm");m.classList.add("found");$("mmFoe").classList.add("on");$("mmAvFoe").innerHTML=artFace(C[p.av]?p.av:(p.dk&&p.dk[11])||E.COLLECT[0]);$("mmNmFoe").textContent=olName(p.nm);$("mmRkFoe").innerHTML=bot?"Máy":icn("gems")+((p.rk|0));
  $("mmBig").textContent="Đã tìm thấy trận đấu!";$("mmSt").textContent=bot?"Đang vào trận…":"Liên kết trò chơi…";SFX.play("snap");$("mmCancel").style.display=bot?"none":"";}
function mmHide(){$("mm").classList.remove("on","found");clearInterval(OL.clk);}
let mmBotT=0;
function mmBot(go){mmShow(false);const nm=BOTS[Math.floor(Math.random()*BOTS.length)];clearTimeout(mmBotT);
  mmBotT=setTimeout(()=>{mmFound({nm,av:null,dk:null},true);mmBotT=setTimeout(()=>{mmHide();go(nm);},reduced?80:360);},reduced?80:380);}
/* ---- tìm đối thủ thật ---- */
async function onlineFind(){if(OL.st!=="idle")onlineReset();mmShow(true);OL.st="conn";const room=await getRoom();
  if(OL.st!=="conn")return;
  if(!room){$("mmBig").textContent="Không kết nối được phòng chơi";$("mmSt").textContent="Cần mở game trên trang chính thức và đăng nhập.";OL.st="idle";return;}
  OL.room=room;OL.st="seek";OL.t0=Date.now();OL.t0show=OL.t0;
  try{await room.presence(Object.assign(myPres(),{mm:"seek",t0:OL.t0}));}catch(e){$("mmBig").textContent="Không gửi được trạng thái ghép trận";OL.st="idle";return;}
  OL.unL=room.onPeers(ch=>mmPair(ch.peers),()=>{if(OL.st==="seek"){$("mmBig").textContent="Mất kết nối phòng chơi";OL.st="idle";}});}
function mmPair(peers){if(OL.st!=="seek")return;
  const sk=peers.filter(p=>p.kind==="viewer"&&p.presence&&p.presence.mm==="seek"&&p.presence.v===2&&okDeck(p.presence.dk)&&typeof p.presence.t0==="number").map(p=>({peer:p.peer,me:p.isMe&&p.sameTab,pr:p.presence})).sort((a,b)=>(a.pr.t0-b.pr.t0)||(a.peer<b.peer?-1:1));
  const i=sk.findIndex(x=>x.me);if(i<0)return;const j=i%2===0?i+1:i-1,o=sk[j];if(!o)return;
  const host=i<j?sk[i]:o,guest=i<j?o:sk[i];OL.role=host.me?"host":"guest";OL.oppPeer=o.peer;OL.oppPr=o.pr;OL.oppPid=typeof o.pr.pid==="string"?o.pr.pid:"";OL.st="found";
  OL.mid="m-"+hsx(host.peer+"|"+guest.peer+"|"+host.pr.t0);mmFound(o.pr,false);startLink();}
async function startLink(){let r;try{r=await OL.room.join(OL.mid);}catch(e){mmRetry("Không vào được phòng trận");return;}
  if(OL.st!=="found"){try{r.leave();}catch(e){}return;}
  OL.mr=r;try{OL.room.presence({mm:"busy"});}catch(e){}
  OL.seed=OL.role==="host"?(Math.random()*4294967296)>>>0:0;
  const p=Object.assign(myPres(),{mid:OL.mid,role:OL.role,seed:OL.seed,t:0,sub:0,acts:[],lock:0,snap:0,rt:0,emo:null});
  try{await r.presence(p);}catch(e){mmRetry("Không liên kết được");return;}
  OL.unM=r.onPeers(ch=>onMatchPeers(ch.peers),olRoomErr);olConn(r);
  clearTimeout(OL.linkT);OL.linkT=setTimeout(()=>{if(OL.st==="found")mmRetry("Đối thủ không phản hồi");},15000);}
function mmRetry(msg){$("mmSt").textContent=msg+", tìm lại…";const keep=$("mm").classList.contains("on");onlineReset();if(keep)setTimeout(()=>{if($("mm").classList.contains("on"))onlineFind();},800);}
function onlineReset(){OL.st="idle";clearTimeout(OL.linkT);clearTimeout(OL.goneT);clearTimeout(OL.waitT);try{OL.unL&&OL.unL();}catch(e){}try{OL.unM&&OL.unM();}catch(e){}
  try{OL.mr&&OL.mr.leave();}catch(e){}try{OL.room&&OL.room.presence({mm:null});}catch(e){}OL.mr=null;OL.unL=OL.unM=null;OL.sub=OL.locked=OL.resolving=false;document.body.classList.remove("olwait");}
function oppOf(peers){const me=accA().gid;const o=peers.find(p=>!(p.isMe&&p.sameTab)&&p.presence&&p.presence.mid===OL.mid&&(p.peer===OL.oppPeer||(OL.oppPid&&OL.oppPid!==me&&p.presence.pid===OL.oppPid)));if(o&&o.peer!==OL.oppPeer){OL.oppPeer=o.peer;olSave();}return o;}
function onMatchPeers(peers){const o=oppOf(peers);
  if(OL.st==="found"){if(!o||!okDeck(o.presence.dk))return;OL.oppPr=o.presence;const hostSeed=OL.role==="host"?OL.seed:(o.presence.seed>>>0);if(OL.role==="guest"&&!hostSeed)return;
    OL.st="starting";clearTimeout(OL.linkT);let n=3;$("mmBig").textContent="Trận đấu bắt đầu sau "+n;const iv=setInterval(()=>{n--;if(OL.st!=="starting"){clearInterval(iv);return;}if(n>0){$("mmBig").textContent="Trận đấu bắt đầu sau "+n;SFX.play("tick");}else{clearInterval(iv);startOnlineGame(hostSeed);}},reduced?150:800);return;}
  if(OL.st!=="play"||!G||!G.online)return;
  if(!o){if(!OL.goneAt&&G.phase!=="over"){OL.goneAt=Date.now();olNet();}return;}
  if(OL.goneAt){OL.goneAt=0;olNet();toast("Đối thủ đã kết nối lại");}const op=o.presence;OL.oppPr=op;
  if(op.rt&&G.phase!=="over"){OL.note="Đối thủ đã rút lui.";E.finish(G,"retreatA");showEnd();return;}
  if(op.emo&&op.emo.ts&&op.emo.ts!==OL.lastEmo){OL.lastEmo=op.emo.ts;showEmote("a",op.emo.k);}
  if(!OL.resolving&&op.h&&OL.myH&&op.h.t===OL.myH.t&&op.h.v!==OL.myH.v&&G.phase!=="over"){OL.note="Lỗi đồng bộ giữa hai máy, trận được tính hoà.";E.finish(G,"end");G.result.winner=null;showEnd();return;}
  checkResolve();}
function startOnlineGame(seed){const op=OL.oppPr,hostDk=OL.role==="host"?store.deck.slice(0,12):op.dk,guestDk=OL.role==="host"?op.dk:store.deck.slice(0,12);
  BC=null;TN0=0;LOCID=[];seenRev.clear();prevPow.clear();seenLoc.clear();seenStg.clear();prevLd=[];PWV={};sel=look=moveSel=null;armRetreat=0;
  const CG=E.newGame(hostDk,guestDk,{seed});CG.mode={k:"online",diff:"thuong",lbl:"Đấu online"};CG.online=1;OL.dk={h:hostDk,g:guestDk};OL.log=[];OL.la=null;OL.goneAt=0;OL.offAt=0;OL.seedUsed=seed;
  OL.CG=CG;G=OL.role==="host"?CG:mirrorG(CG);OL.st="play";OL.sub=OL.locked=OL.resolving=false;OL.myH=null;OL.note="";
  foeAv=C[op.av]?op.av:op.dk[11];$("avFoe").innerHTML=artFace(foeAv);$("avMe").innerHTML=meAv();$("foeName").textContent=olName(op.nm);foeBack=Object.keys(BACKS)[Math.floor(Math.random()*Object.keys(BACKS).length)];
  gameDeck=store.deck.join();missNote="";resetTimer(false);tArmed=true;tLast=0;
  G.msg="<b>Đấu online.</b>";mmHide();closeAll();$("lobby").classList.remove("on");if(window.BGM)BGM.syncGame(G);render();runMatchIntro("LƯỢT 1","Đấu online",true);
  try{OL.mr.presence({t:G.turn,sub:0,acts:[],lock:0,snap:0});}catch(e){}olSave();}
function myActs(){return G.q.p.map(a=>a.t==="play"?{t:"p",u:a.uid,l:a.li}:a.t==="move"?{t:"m",u:a.uid,l:a.to}:{t:"a",u:a.uid});}
function applyActs(g,side,acts){let ok=true;for(const a of (Array.isArray(acts)?acts:[])){if(!a||typeof a.u!=="number")continue;
  const r=a.t==="p"?E.queuePlay(g,side,a.u,a.l|0):a.t==="m"?E.queueMove(g,side,a.u,a.l|0):a.t==="a"?E.queueAct(g,side,a.u):false;if(!r)ok=false;}return ok;}
function onlineEnd(){if(!G||G.phase!=="play")return;
  if(OL.sub){if(!OL.locked){OL.sub=false;document.body.classList.remove("olwait");try{OL.mr.presence({sub:0,acts:[]});}catch(e){}SFX.play("tap");render();}return;}
  /* gpu22: chưa diễn xong pha đầu lượt mới (chưa chốt mã trạng thái lượt này) thì chưa cho nộp lượt — tránh bị ghi đè sub:0 gây lệch đồng bộ */
  if(OL.myH&&OL.myH.t!==G.turn*2){SFX.play("tap");return;}
  sel=look=moveSel=null;OL.sub=true;OL.acts=myActs();OL.sn=G.snap.p?1:0;OL.waitAt=Date.now();document.body.classList.add("olwait");
  try{OL.mr.presence({t:G.turn,sub:1,acts:OL.acts,snap:G.snap.p?1:0,lock:0});}catch(e){}
  SFX.play("place");render();clearTimeout(OL.waitT);OL.waitT=setTimeout(()=>{if(OL.sub&&!OL.resolving&&G&&G.online&&G.phase==="play"&&!OL.goneAt){OL.note="Đối thủ không ra bài quá 3 phút.";E.finish(G,"retreatA");showEnd();}},180000);
  checkResolve();}
function checkResolve(){if(!OL.mr||!OL.sub||OL.resolving||!G||G.phase!=="play")return;const o=oppOf(OL.mr.peers());if(!o)return;const op=o.presence;
  if(!OL.locked&&op.t===G.turn&&op.sub){OL.locked=true;try{OL.mr.presence({lock:G.turn});}catch(e){}render();}
  if(OL.locked&&op.lock===G.turn&&op.sub)onlineResolve(op);
  /* gpu35: đối thủ đã chốt + diễn xong lượt này (đã sang lượt sau) trong lúc mình mất kết nối -> lấy lại hành động lượt trước họ để lại (la) mà diễn theo, tránh kẹt 2 bên chờ nhau */
  else if(OL.locked&&op.t===G.turn+1&&op.la&&op.la.t===G.turn)onlineResolve({acts:op.la.acts,snap:op.la.sn});}
async function onlineResolve(op){FFTURN.start();try{return await onlineResolveRun(op);}finally{FFTURN.stop();}}
async function onlineResolveRun(op){OL.resolving=true;clearTimeout(OL.waitT);const host=OL.role==="host";
  {const mine=OL.acts||[],theirs=Array.isArray(op.acts)?op.acts:[];OL.log=OL.log||[];OL.log.push({ha:host?mine:theirs,ga:host?theirs:mine,hs:host?!!G.snap.p:!!op.snap,gs:host?!!op.snap:!!OL.sn});olSave();
   OL.la={t:G.turn,acts:mine,sn:(host?G.snap.p:OL.sn)?1:0};try{OL.mr.presence({la:OL.la});}catch(e){}}
  let CG;if(host){CG=G;if(!applyActs(CG,"a",op.acts))OL.bad=1;}else{CG=OL.CG;if(!applyActs(CG,"p",op.acts))OL.bad=1;if(!applyActs(CG,"a",OL.acts))OL.bad=1;}
  const hs=host?G.snap.p:!!op.snap,gs=host?!!op.snap:!!(OL.sn);
  if(hs&&!CG.snap.p){CG.snap.p=true;CG.pendingDouble++;}if(gs&&!CG.snap.a){CG.snap.a=true;CG.pendingDouble++;}
  const disp=()=>{if(!host)G=mirrorG(CG);};
  const steps=E.beginReveal(CG);disp();G.msg="Hai bên đã đặt bài. Đang lật…";render();SFX.play("place");await sleep(reduced?45:220);
  for(const st of steps){const R0=rects0(),P0=powers(),G0=pvSnap();const did=E.doStep(CG,st);if(!did&&!CG.msgs.length)continue;disp();const evs=G.evs.slice();await artReady12(evs);stepFx(G0,evs,R0,P0);const hf=evs.some(e=>e.k==="flip");await sleep(reduced?65:hf?440:480);}
  for(const st of E.beginEndTurn(CG)){const R0=rects0(),P0=powers(),G0=pvSnap();const did=E.stepEndTurn(CG,st);if(!did&&!CG.msgs.length&&!CG.evs.length)continue;disp();const evs=G.evs.slice();await artReady12(evs);if(G.msgs&&G.msgs.length)G.msg=`<b>Cuối lượt:</b> `+G.msgs.slice(0,4).join(" · ");stepFx(G0,evs,R0,P0);await sleep(reduced?65:460);}
  pvApply();E.finishEndTurn(CG);disp();
  OL.sub=false;OL.locked=false;OL.resolving=false;document.body.classList.remove("olwait");
  if(CG.turn>=E.turns(CG)){await endReveal(CG,disp);E.finish(CG,"end");disp();OL.myH={t:CG.turn*2+1,v:hashSt(CG)};try{OL.mr.presence({h:OL.myH,sub:0,acts:[],lock:0});}catch(e){}showEnd();return;}
  let hNew="";{const R0=rects0(),P0=powers();E.startTurn(CG);hNew=hashSt(CG);/* gpu22: chốt mã trạng thái ngay khi sang lượt, trước khi người chơi kịp đặt thẻ trong lúc diễn đầu lượt */disp();const evs=G.evs.slice(),locEvs=evs.filter(e=>e.k==="loc"),drawEvs=evs.filter(e=>e.k!=="loc");resetTimer(true);tArmed=true;tLast=0;G.msg="";render();
   if(locEvs.length){playFx(locEvs,R0,P0);await sleep(reduced?80:940);}
   if(drawEvs.length){playFx(drawEvs,R0,P0);await sleep(reduced?60:520);}
   banner("LƯỢT "+G.turn,G.turn===E.turns(G)?"Lượt cuối":"");pulse("#orb",[{transform:"scale(1.45)",filter:"brightness(2.2)"},{transform:"scale(1)",filter:"brightness(1)"}],460);await sleep(reduced?50:780);}
  OL.myH={t:CG.turn*2,v:hNew||hashSt(CG)};try{OL.mr.presence({t:CG.turn,sub:0,acts:[],lock:0,h:OL.myH});}catch(e){}
  OL.bad=0;checkHash();}
function checkHash(){if(!OL.mr||!OL.myH||!G||G.phase==="over"||OL.resolving)return;const o=oppOf(OL.mr.peers());if(o&&o.presence.h&&o.presence.h.t===OL.myH.t&&o.presence.h.v!==OL.myH.v){OL.note="Lỗi đồng bộ giữa hai máy, trận được tính hoà.";E.finish(G,"end");G.result.winner=null;showEnd();}}
function onlineOver(r){if(!G||!G.online)return;olClear();OL.goneAt=0;OL.offAt=0;olNet();try{if(OL.mr&&(r.kind==="retreatP"||r.kind==="timeoutP"))OL.mr.presence({rt:1});}catch(e){}setTimeout(()=>{if(OL.st==="play"||OL.st==="starting")onlineReset();},4000);}
/* ---- mất kết nối & kết nối lại (tối đa 3 phút) ---- */
const OLK="linhthu.olm",OL_WAIT=180000;
function olSave(){if(OL.st!=="play"||!OL.mid)return;try{localStorage.setItem(OLK,JSON.stringify({mid:OL.mid,role:OL.role,seed:OL.seedUsed,dk:OL.dk,oppPeer:OL.oppPeer,oppPid:OL.oppPid||"",op:{nm:OL.oppPr&&OL.oppPr.nm,av:OL.oppPr&&OL.oppPr.av,rk:OL.oppPr&&OL.oppPr.rk,dk:OL.oppPr&&OL.oppPr.dk},log:OL.log||[],ts:Date.now(),fb:foeBack}));}catch(e){}}
function olClear(){try{localStorage.removeItem(OLK);}catch(e){}}
function olFmt(ms){const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function olNet(){const el=$("olNet");if(!el)return;const now=Date.now();
  if(G&&G.online&&G.phase!=="over"&&(OL.goneAt||OL.offAt)){
    if(OL.offAt&&now-OL.offAt>=OL_WAIT){OL.offAt=0;OL.note="Bạn mất kết nối quá 3 phút nên bị xử thua.";E.finish(G,"timeoutP");showEnd();el.hidden=true;return;}
    if(OL.goneAt&&now-OL.goneAt>=OL_WAIT){OL.goneAt=0;OL.note="Đối thủ mất kết nối quá 3 phút.";E.finish(G,"retreatA");showEnd();el.hidden=true;return;}
    el.hidden=false;el.className="olnet"+(OL.offAt?" me":"");
    el.innerHTML=OL.offAt?`<i class="dot"></i><span><b>Mất kết nối</b> · đang kết nối lại</span><b class="t">${olFmt(OL_WAIT-(now-OL.offAt))}</b>`:`<i class="dot"></i><span><b>Đối thủ mất kết nối</b> · chờ kết nối lại</span><b class="t">${olFmt(OL_WAIT-(now-OL.goneAt))}</b>`;
    if(!OL.netIv)OL.netIv=setInterval(olNet,1000);
  }else{el.hidden=true;clearInterval(OL.netIv);OL.netIv=0;}}
function olFullPres(){const host=OL.role==="host",CG=host?G:OL.CG;return Object.assign(myPres(),{mid:OL.mid,role:OL.role,seed:host?OL.seedUsed:0,t:CG?CG.turn:1,sub:OL.sub?1:0,acts:OL.sub?(OL.acts||[]):[],lock:OL.locked&&G?G.turn:0,snap:OL.sub&&OL.sn?1:0,rt:0,emo:null,h:OL.myH||null,la:OL.la||null});}
function olConn(r){try{OL.unC&&OL.unC();}catch(e){}OL.unC=null;if(!r||typeof r.onConnection!=="function")return;
  OL.unC=r.onConnection(c=>{if(!G||!G.online||G.phase==="over")return;
    if(!c){if(!OL.offT)OL.offT=setTimeout(()=>{OL.offT=0;if(OL.mr&&typeof OL.mr.connected==="function"&&!OL.mr.connected()&&!OL.offAt){OL.offAt=Date.now()-2000;olNet();}},2000);}
    else{clearTimeout(OL.offT);OL.offT=0;if(OL.offAt){OL.offAt=0;olNet();toast("Đã kết nối lại");}}});}
function olRoomErr(){if(!G||!G.online||G.phase==="over"||OL.st!=="play")return;if(!OL.offAt)OL.offAt=Date.now();olNet();setTimeout(olRejoin,1500);}
async function olRejoin(){if(!OL.offAt||!G||!G.online||G.phase==="over"||!OL.room)return;
  try{const r=await OL.room.join(OL.mid);OL.mr=r;await r.presence(olFullPres());OL.unM=r.onPeers(ch=>onMatchPeers(ch.peers),olRoomErr);olConn(r);OL.offAt=0;olNet();toast("Đã kết nối lại");}
  catch(e){setTimeout(olRejoin,5000);}}
setInterval(()=>{if(OL.st==="play"&&G&&G.online&&G.phase!=="over")olSave();},15000);
async function olResume(){let sv=null;try{sv=JSON.parse(localStorage.getItem(OLK)||"null");}catch(e){}
  if(!sv||!sv.mid||!sv.dk||Date.now()-(sv.ts||0)>OL_WAIT){olClear();return;}
  if(G&&G.online&&G.phase==="play")return;
  mmShow(true);$("mmBig").textContent="Đang kết nối lại trận đấu…";$("mmSt").textContent="Bạn có một trận online chưa kết thúc";
  const room=await getRoom();if(!room){mmHide();olClear();toast("Không kết nối lại được trận online");return;}
  let r;try{r=await room.join(sv.mid);}catch(e){mmHide();olClear();toast("Không vào lại được trận online");return;}
  const CG=E.newGame(sv.dk.h,sv.dk.g,{seed:sv.seed});CG.mode={k:"online",diff:"thuong",lbl:"Đấu online"};CG.online=1;
  try{for(const e of (sv.log||[])){applyActs(CG,"p",e.ha);applyActs(CG,"a",e.ga);if(e.hs&&!CG.snap.p){CG.snap.p=true;CG.pendingDouble++;}if(e.gs&&!CG.snap.a){CG.snap.a=true;CG.pendingDouble++;}for(const st of E.beginReveal(CG))E.doStep(CG,st);E.endTurn(CG);if(CG.turn>=E.turns(CG)){E.finish(CG,"end");break;}E.startTurn(CG);}}catch(e){CG.phase="over";}
  if(CG.phase==="over"){try{r.leave();}catch(e){}mmHide();olClear();toast("Trận online trước đã kết thúc");return;}
  OL.room=room;OL.mr=r;OL.mid=sv.mid;OL.role=sv.role;OL.seedUsed=sv.seed;OL.seed=sv.role==="host"?sv.seed:0;OL.oppPeer=sv.oppPeer;OL.oppPid=sv.oppPid||"";OL.oppPr=sv.op||{};OL.dk=sv.dk;OL.log=sv.log||[];{const L=OL.log[OL.log.length-1],h=sv.role==="host";OL.la=L?{t:CG.turn-1,acts:h?L.ha:L.ga,sn:(h?L.hs:L.gs)?1:0}:null;}
  BC=null;TN0=0;LOCID=[];seenRev.clear();prevPow.clear();seenLoc.clear();seenStg.clear();prevLd=[];PWV={};sel=look=moveSel=null;armRetreat=0;
  OL.CG=CG;G=OL.role==="host"?CG:mirrorG(CG);OL.st="play";OL.sub=OL.locked=OL.resolving=false;OL.acts=[];OL.sn=0;OL.note="";OL.goneAt=0;OL.offAt=0;OL.myH={t:CG.turn*2,v:hashSt(CG)};
  const op=OL.oppPr;foeAv=C[op.av]?op.av:(Array.isArray(op.dk)&&C[op.dk[11]]?op.dk[11]:E.COLLECT[0]);$("avFoe").innerHTML=artFace(foeAv);$("avMe").innerHTML=meAv();$("foeName").textContent=olName(op.nm);foeBack=sv.fb&&BACKS[sv.fb]?sv.fb:"b0";
  gameDeck=store.deck.join();missNote="";resetTimer(true);tArmed=true;tLast=0;G.msg="<b>Đã kết nối lại trận online.</b>";
  try{await r.presence(olFullPres());}catch(e){}
  OL.unM=r.onPeers(ch=>onMatchPeers(ch.peers),olRoomErr);olConn(r);
  mmHide();closeAll();$("lobby").classList.remove("on");render();banner("ĐÃ KẾT NỐI LẠI","Lượt "+G.turn);olSave();}
setTimeout(olResume,1600);
/* ---- cảm xúc ---- */
const EMO=["Chào bạn!","Hay đấy!","Vậy sao?","Ối trời!","Cảm ơn!","Chơi đẹp!"];
function showEmote(side,k){const t=EMO[k|0];if(!t)return;const av=$(side==="p"?"avMe":"avFoe");if(!av)return;const r=av.getBoundingClientRect(),b=document.createElement("div");b.className="emob "+side;b.textContent=t;
  b.style.left=Math.max(70,Math.min(innerWidth-70,side==="p"?r.left+r.width*.8:r.right-r.width*.8))+"px";b.style.top=(r.bottom+6)+"px";document.body.appendChild(b);setTimeout(()=>b.remove(),2600);}
function sendEmote(k){showEmote("p",k);SFX.play("tap");$("emoMenu").classList.remove("on");
  if(G&&G.online&&OL.mr){try{OL.mr.presence({emo:{k,ts:Date.now()}});}catch(e){}}
  else if(G&&!G.online&&Math.random()<.45)setTimeout(()=>showEmote("a",[0,1,2,3,4,5][Math.floor(Math.random()*6)]),900+Math.random()*900);}
/* ---- bảng năng lượng: giải thích + hoàn tác tất cả ---- */
function openEnergy(){const p=$("enPop");if(p.classList.contains("on")){p.classList.remove("on");return;}
  $("enN").textContent=G?G.energy.p:0;$("enUndo").disabled=!(G&&playing()&&G.q.p.length&&!OL.sub);p.classList.add("on");}
function undoAll(){if(!G||!playing()||OL.sub)return;for(let i=G.q.p.length-1;i>=0;i--){const a=G.q.p[i];E.unqueue(G,"p",a.uid,a.t);}sel=look=moveSel=null;$("enPop").classList.remove("on");SFX.play("tap");render();}
/* ---- chia bài đầu trận ---- */
/* ===== Đầu Ván: diễn lại các thẻ được thêm vào bộ bài / tay ===== */
function miniC(id){const d=C[id];return `<span class="gc" style="--hc:${HC[d.h]};display:block">${nbL(id)}${art(id)}<span class="cst">${d.c}</span><span class="pwh">${d.p}</span><span class="n">${logo(id)}</span></span>`;}
async function startShow(){try{if(reduced||!G||!G.startFx||G.online)return;const L=G.startFx.filter(x=>x.s==="p");if(!L.length)return;await sleep(80);for(const x of L)await startOne(x);}catch(err){}}
function startOne(e){return new Promise(res=>{const d=C[e.id];if(!d){res();return;}const W=innerWidth,H=innerHeight,col=HC[d.h]||"#ffd65a";
  const wrap=document.createElement("div");wrap.className="stfx";document.body.appendChild(wrap);wrap.animate([{opacity:0},{opacity:1}],{duration:220,fill:"both"});
  const cw=Math.min(W*.34,150),ch=cw*1.4,cx=W/2,cy=H*.33;
  const main=document.createElement("div");main.className="stc";main.style.cssText=`left:${cx-cw/2}px;top:${cy-ch/2}px;width:${cw}px;height:${ch}px;--c:${col}`;main.innerHTML=miniC(e.id)+`<b class="sttag">Đầu Ván</b>`;wrap.appendChild(main);
  const tx=document.createElement("div");tx.className="sttx";tx.style.top=(cy+ch/2+14)+"px";tx.textContent=String(d.x||"").replace(/^Đầu Ván:\s*/i,"");wrap.appendChild(tx);
  main.animate([{transform:"scale(.2) rotate(-12deg)",opacity:0},{transform:"scale(1.08)",opacity:1,offset:.6},{transform:"scale(1)",opacity:1}],{duration:440,easing:"cubic-bezier(.2,.9,.3,1)",fill:"both"});
  FX.sigil(cx,cy,col,cw*.95,8,false,1.5);FX.glow(cx,cy,col,cw);FX.sparks(cx,cy,col,14,220);SFX.play("chime");
  const add=e.add||[],n=add.length,tgt=$(e.to==="hand"?"hand":"meSub"),tr=tgt?tgt.getBoundingClientRect():{left:W/2,top:H,width:0,height:0},tX=tr.left+tr.width/2,tY=tr.top+tr.height/2;
  const mw=Math.min(W*.15,60),mh=mw*1.4,span=Math.min(W*.92,n*mw*.8+mw*.4),txh=tx.getBoundingClientRect().height||40,y0=cy+ch/2+txh+30+mh/2,t0=560,DU=1500,st=n>8?45:70;
  add.forEach((id,i)=>{if(!C[id])return;const el=document.createElement("div");el.className="stm";el.style.cssText=`left:${cx-mw/2}px;top:${cy-mh/2}px;width:${mw}px;height:${mh}px`;el.innerHTML=miniC(id);wrap.appendChild(el);
    const fx=n>1?(-span/2+mw/2+i*(span-mw)/(n-1)):0,rot=n>1?(-12+24*i/(n-1)):0,fy=y0-cy+Math.abs(fx)*.14,dx=tX-cx,dy=tY-cy;
    el.animate([{transform:"translate(0,0) scale(.3)",opacity:0},{transform:`translate(${fx}px,${fy}px) rotate(${rot}deg) scale(1)`,opacity:1,offset:.3},{transform:`translate(${fx}px,${fy}px) rotate(${rot}deg) scale(1)`,opacity:1,offset:.62},{transform:`translate(${dx}px,${dy}px) rotate(${rot*2}deg) scale(.22)`,opacity:.15}],{duration:DU,delay:t0+i*st,easing:"cubic-bezier(.3,.7,.3,1)",fill:"both"});});
  const end=n?t0+DU+(n-1)*st:1700;
  if(n){setTimeout(()=>SFX.play("whoosh"),t0+DU*.62);setTimeout(()=>{FX.sparks(tX,tY,col,18,220);FX.glow(tX,tY,"#ffffff",50);SFX.play("summon");if(tgt&&tgt.animate)tgt.animate([{transform:"scale(1.3)"},{transform:"scale(1)"}],{duration:380});},end);}
  setTimeout(()=>{main.animate([{opacity:1},{opacity:0,transform:"scale(.85)"}],{duration:260,fill:"both"});tx.animate([{opacity:1},{opacity:0}],{duration:260,fill:"both"});},Math.max(900,end-300));
  setTimeout(()=>{const a=wrap.animate([{opacity:1},{opacity:0}],{duration:220,fill:"both"});a.onfinish=()=>wrap.remove();setTimeout(()=>{wrap.remove();res();},240);},end+120);});}
function dealIn(){warmMatch12();try{for(const sd of ["p","a"])for(const k of (G.start&&G.start[sd])||[]){spLoad(k);for(const t of LINKS[k]||[])spLoad(t);}}catch(e){}if(reduced)return;let k=0;document.querySelectorAll("#hand [data-hc]").forEach(el=>CFX.drawIn(el,false,k++));}
/* ---- cài đặt ---- */
function openSet(){$("setVol").value=store.vol??100;$("setVolV").textContent=(store.vol??100)+"%";if($("setBgmVol")){$("setBgmVol").value=store.bgmVol??55;$("setBgmVolV").textContent=(store.bgmVol??55)+"%";}if($("setBgm"))$("setBgm").checked=store.bgm!==false;$("setMute").checked=!!store.mute;$("setFx").checked=store.fx!=="off";$("setGpu").checked=!!store.gpu;$("setSpd").value=SPDV[store.spd]?store.spd:"vua";$("setVib").checked=store.vib!==false;$("setGyro").checked=store.gyro!==false;$("ovSet").classList.add("on");
  renderSetSpd();syncSetUi();if($("setBgm"))$("setBgm").checked=!!store.battleBgm;const b=$("setReimg");if(b)b.textContent="Tải lại hình"+(IMGRT.bad.size?` (${IMGRT.bad.size} ảnh lỗi)`:"");
  if(window.FPSMODE)FPSMODE.syncUi();}

/* ===== v6: hiệu ứng nguồn → đích ===== */
let ME0={p:0,a:0};
const DECKPT=()=>({x:innerWidth-26,y:innerHeight-50});
const PILEPT=()=>{const b=$("btnPiles");return b?ctr(b):{x:40,y:80};};
function cardOf(uid){if(!uid||!G)return null;const f=E.find(G,uid);if(f)return f.inst;for(const s of E.SIDES){const h=G.hand[s].find(c=>c.uid===uid);if(h)return h;for(const k of ["disc","dead"]){const c=(G[k][s]||[]).find(c=>c.uid===uid);if(c)return c;}}return null;}
function srcPt(uid,R0){if(!uid)return null;const el=document.querySelector(`#board [data-mc="${uid}"]`);if(el)return ctr(el);const r=R0&&R0.get(uid);return r?{x:r.x,y:r.y}:null;}
function beam(a,b,c,kind,delay){if(reduced||!a||!b)return;const d=document.createElement("div");d.className="fxbeam "+(kind||"");const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);if(L<6)return;
  d.style.cssText=`left:${a.x}px;top:${a.y}px;width:${L}px;--c:${c};transform:rotate(${Math.atan2(dy,dx)}rad);animation-delay:${delay||0}ms`;document.body.appendChild(d);fxT(()=>d.remove(),1100+(delay||0));}
function proj(a,b,c,cls,ms,spin){if(reduced||!a||!b)return;const d=document.createElement("div");d.className="fxproj "+(cls||"");d.style.cssText=`left:${a.x}px;top:${a.y}px;--c:${c}`;document.body.appendChild(d);
  const dx=b.x-a.x,dy=b.y-a.y;const an=d.animate([{transform:"translate(0,0) scale(.6) rotate(0)"},{transform:`translate(${dx*.5}px,${dy*.5-40}px) scale(1.2) rotate(${spin?360:0}deg)`,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(.8) rotate(${spin?720:0}deg)`}],{duration:ms||420,easing:"cubic-bezier(.4,0,.6,1)",fill:"forwards"});
  an.onfinish=()=>d.remove();fxT(()=>d.remove(),(ms||420)+200);}
function revealZoom(uid){if(reduced)return;const el=document.querySelector(`#board [data-mc="${uid}"]`),c=cardOf(uid);if(!el||!c)return;
  const d=C[c.id],col=(d&&HC[d.h])||"#7fe8ff",b=el.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;
  FX.ring(cx,cy,col,Math.max(32,b.width*.68),3.5);}
function hammerFx(){if(reduced)return;const o=ctr($("orb")),h=document.createElement("div");h.className="fxhammer";h.style.left=(o.x+46)+"px";h.style.top=(o.y-70)+"px";
  h.innerHTML=`<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="29" y="26" width="6" height="34" rx="2" fill="#8a5a2a"/><rect x="10" y="8" width="44" height="22" rx="6" fill="#d8262e"/><rect x="10" y="8" width="44" height="7" rx="3" fill="#ff6a6a"/><path d="M32 12l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" fill="#ffd65a"/></svg>`;document.body.appendChild(h);
  const a=h.animate([{transform:"rotate(-70deg) scale(.6)",opacity:0},{transform:"rotate(-80deg) scale(1.1)",opacity:1,offset:.35},{transform:"rotate(15deg) scale(1)",opacity:1,offset:.55},{transform:"rotate(5deg) scale(1)",opacity:1,offset:.8},{transform:"rotate(5deg) scale(.9)",opacity:0}],{duration:1100,fill:"forwards"});a.onfinish=()=>h.remove();fxT(()=>h.remove(),1300);
  fxT(()=>{FX.sparks(o.x+10,o.y-10,"#ff4d4d",22,280);FX.bolts(o.x,o.y,"#ff6a6a",6,50);FX.ring(o.x,o.y,"#ffd65a",60,5);FX.float(o.x,o.y-50,"+1 NĂNG LƯỢNG TỐI ĐA","#ffd65a");SFX.play("snap");pulse("#orb",[{transform:"scale(1.5)",filter:"brightness(2.4)"},{transform:"scale(1)",filter:"brightness(1)"}],600);},560);}
function feathers(el){if(reduced||!el)return;const b=el.getBoundingClientRect();for(let i=0;i<9;i++){const f=document.createElement("div");f.className="fxfeather";f.style.left=(b.left+b.width/2+(Math.random()-.5)*b.width)+"px";f.style.top=(b.top-10)+"px";document.body.appendChild(f);
  const dx=(Math.random()-.5)*140,dr=(Math.random()-.5)*540;const a=f.animate([{transform:"translate(0,-20px) rotate(0)",opacity:0},{opacity:1,offset:.15},{transform:`translate(${dx*.5}px,60px) rotate(${dr*.5}deg)`,offset:.5},{transform:`translate(${dx}px,140px) rotate(${dr}deg)`,opacity:0}],{duration:1100+Math.random()*500,delay:i*40,easing:"ease-in",fill:"forwards"});a.onfinish=()=>f.remove();fxT(()=>f.remove(),2000);}}
function thornFx(el){if(reduced||!el)return;const b=el.getBoundingClientRect(),t=document.createElement("div"),s=Math.max(b.width,b.height)*2.2;t.className="fxthorn";t.style.cssText=`left:${b.left+b.width/2}px;top:${b.top+b.height/2}px;width:${s}px;height:${s}px`;document.body.appendChild(t);fxT(()=>t.remove(),1200);}
function fireworks(p){if(reduced||!p)return;["#ff5ad0","#ffd65a","#5ad0ff","#7dff8a"].forEach((c,i)=>fxT(()=>{const x=p.x+(Math.random()-.5)*90,y=p.y-30-Math.random()*60;FX.burst(x,y,c,26,200);FX.ring(x,y,c,40,3);},i*140));}
/* hiệu ứng riêng theo thẻ nguồn */
const SIG={quadao:{c:"#ff9a2b",bk:"",rev:el=>{feathers(el);FX.glow(ctr(el).x,ctr(el).y,"#ff7a1f",90);}},
  daothosan:{c:"#ff3d4d",bk:"slash"},kiemnupho:{c:"#ff3d4d",bk:"slash"},kiemsu:{c:"#ff3d4d",bk:"slash"},nuchienthan:{c:"#ff6a3a",bk:""},
  baithu:{c:"#ff5ad0",dart:1,rev:el=>{const q=ctr(el);FX.burst(q.x,q.y,"#ff5ad0",20,180);}},
  matoc:{c:"#ffb347",bk:"chain",rev:el=>{const q=ctr(el);FX.vortex(q.x,q.y,"#ff8a2b",22);FX.glow(q.x,q.y,"#ffd27a",110);}},hoasu:{c:"#ffb347",bk:"chain",rev:el=>{const q=ctr(el);FX.vortex(q.x,q.y,"#ff8a2b",18);}},
  minhhau:{c:"#5aff8a",bk:"zap",rev:el=>thornFx(el)},linhduoc:{c:"#5aff8a",bk:"zap"},tuthanmienvien:{c:"#5aff8a",bk:"zap",rev:el=>thornFx(el)},
  phaohoanu:{c:"#ffd65a",bk:"",rev:el=>fireworks(ctr(el))},
  chuotchuivuong:{c:"#c8a06a",bk:"",rev:el=>{const q=ctr(el);FX.shards(q.x,q.y,"#8a6a4a");FX.shards(q.x,q.y,"#c8a06a");FX.shake(4);}}};
function sigOf(uid){const c=cardOf(uid);return c?SIG[c.id]||null:null;}
function srcFx(evs,R0){
  const handFrom=new Map();
  for(const ev of evs){const sg=sigOf(ev.src),sp=srcPt(ev.src,R0);
    if(ev.k==="flip"){const c=cardOf(ev.uid),S=c&&SIG[c.id];const el=document.querySelector(`#board [data-mc="${ev.uid}"]`);if(S&&S.rev&&el)S.rev(el);}
    else if(ev.k==="discard"){}
    else if(ev.k==="revive"){const el=document.querySelector(`#board [data-mc="${ev.uid}"]`);if(!el)continue;const to=ctr(el),from=sg&&sg.bk==="zap"&&sp?sp:PILEPT(),col=(sg&&sg.c)||"#4dffa6";beam(from,to,col,(sg&&sg.bk)||"zap",0);if(sg&&sg.bk==="chain")fxT(()=>{FX.sparks(to.x,to.y,"#ffb347",20,240);FX.glow(to.x,to.y,"#ff8a2b",80);},380);}
    else if(ev.k==="summon"&&!S8.has("u"+ev.uid)){const el=document.querySelector(`#board [data-mc="${ev.uid}"]`);if(!el)continue;const to=ctr(el);
      if(ev.deck&&!evs.some(x=>x.k==="clone"&&x.uid===ev.uid)){const from=DECKPT();proj(from,to,"#9fd8ff","",480,true);if(sp)beam(sp,to,(sg&&sg.c)||"#9fd8ff","",0);if(sg&&sg.c==="#ffd65a")fxT(()=>fireworks(to),480);}
      else if(sp)beam(sp,to,(sg&&sg.c)||"#c8ff9a","",0);}
    else if(ev.k==="tohand"&&ev.side==="p"&&!R0.has(ev.uid))handFrom.set(ev.uid,sp||null);
    else if(ev.k==="destroy"&&sp&&!S8.has("d"+ev.uid)){const tc=R0.get(ev.uid);if(tc&&(Math.abs(tc.x-sp.x)+Math.abs(tc.y-sp.y))>8){const c0=cardOf(ev.src);if(c0&&c0.side!==ev.side||sg&&sg.dart)proj(sp,tc,(sg&&sg.c)||"#ff4d5e",sg&&sg.dart?"":"orb",380,!!(sg&&sg.dart));}}
    else if(ev.k==="egain"&&ev.side==="p"){const lw=document.querySelector(`[data-lane="${ev.li}"] .locw`);if(lw){const a=ctr(lw),o=ctr($("orb"));proj(a,o,"#ffd65a","coin",620,true);fxT(()=>{SFX.fam("egain",{el:null,vol:.9});FX.float(o.x,o.y-30,"+1","#ffd65a");pulse("#orb",[{transform:"scale(1.4)",filter:"brightness(2)"},{transform:"scale(1)"}],480);},620);}}}
  return handFrom;}

CFX.shatter=function(r,c,slash){if(reduced||!r||!r.html)return;const g=ghost(r,r.html);if(slash)FX.slash(r.x,r.y,c);
  rmAfter(anim(g,[{transform:"none",filter:"none",opacity:1},{transform:"translateY(-14px) scale(1.08)",filter:"brightness(1.8) sepia(1) saturate(6) hue-rotate(-30deg)",opacity:1,offset:.35},{transform:"translateY(40px) scale(.9) rotate(6deg)",filter:"brightness(.4) blur(3px)",opacity:0}],{duration:700}),g);
  fxT(()=>{FX.sparks(r.x,r.y,c,26,240);FX.sparks(r.x,r.y,"#ffd27a",14,180);},220);};
CFX.drawFrom=function(el,p,k){if(!el)return;const b=el.getBoundingClientRect(),dx=p.x-(b.left+b.width/2),dy=p.y-(b.top+b.height/2);
  anim(el,[{transform:`translate(${dx}px,${dy}px) scale(.4) rotate(-12deg)`,opacity:.3,filter:"brightness(2.2)"},{transform:"translateY(-26px) scale(1.15)",opacity:1,offset:.65},{transform:"none",filter:"none"}],{duration:620,delay:k*90,fill:"backwards"});
  beam(p,{x:b.left+b.width/2,y:b.top+b.height/2},"#7dffb0","",k*90);fxT(()=>{FX.rise(b.left+b.width/2,b.top+b.height/2,"#7dffb0",12);},520+k*90);};

/* ===== v7: hoạt ảnh hiệu ứng rõ 3 bước — (1) thẻ gây ra sáng lên → (2) vật/ảnh thẻ bay tới → (3) mục tiêu phản ứng + chữ nổi ===== */
const MOTA={"chanthu":"Lôi Công: thần sấm mặt chim, cánh đen, hai tay cầm búa và đục sấm, tia chớp xanh quấn quanh","cuongnhan":"Thần Trụ Trời: người khổng lồ cơ bắp cuồn cuộn da màu đất, tóc rối, vác cột đá khổng lồ trên vai","docnhan":"Nghê Đá: linh thú nghê bờm xoắn đang vồ, thân đá ngọc lục, mắt vàng","ketrungphat":"Hắc Đao Khách: hiệp khách áo đen khăn đen che mặt, đeo đai đạn tên, cầm đại đao, ánh mắt lạnh","linhgacmay":"Lính Đất Nung: binh lính đất nung đỏ nâu, giáp vảy đất, cầm giáo, vết nứt phát sáng cam","ngantoc":"Lính Trạm: sứ giả trạm ngựa áo xanh chạy cực nhanh, khăn bay, vệt gió bạc phía sau, cầm ống thư","quaituong":"Mộc Tinh: quỷ cây cổ thụ khổng lồ, thân gỗ sần sùi, mắt đỏ rực, rêu và dây leo, khoác mảnh vải đỏ hoa văn","taymaynu":"Nữ Binh Tre: nữ binh áo nâu, cánh tay phải bọc giáp tre đan cơ khí, nón lá sau lưng","thachquai":"Thần Đá Núi: người đá vạm vỡ thân là tảng đá xám phủ rêu, hoa văn khắc cổ phát sáng","thantien":"Cung Thủ Mường: cung thủ trẻ áo thổ cẩm Mường, giương cung gỗ, ống tên lông chim","thietgiap":"Thần Trống Đồng: thần giáp đồng xanh cổ, ngực là mặt trống đồng phát sáng vàng, mắt sáng","tinhchua":"Trương Chi: chàng lái đò thổi sáo trúc, áo nâu sờn, nốt nhạc vàng bay quanh","tocnuhoang":"Âu Cơ: mẹ tiên áo lông chim trắng vàng, tóc dài bay, bọc trứng tiên phát sáng trong tay","bachho":"Ông Ba Mươi: hổ vằn lớn đứng hai chân, khoác giáp tướng, nanh vàng, gầm","chuarung":"Sơn Tinh: thần núi giáp xanh rêu, tay giơ cao gọi núi đồi, cây cối mọc quanh chân","dahanh":"Ma Trơi: hồn ma xanh lam lơ lửng, thân là ngọn lửa ma trơi, mắt trống, đèn lồng giấy","deonhan":"Nhện Tinh: yêu nhện nửa người, tám chân dài, tơ vàng giăng rộng, mặt nạ tuồng","phuthan":"Ngọc Hoàng: Ngọc Hoàng uy nghi áo long bào vàng, mũ miện ngọc, cầm hốt ngọc, mây vàng quanh chân","quangpho":"Thần Cầu Vồng: nữ thần áo lụa bảy màu, dải lụa cầu vồng uốn quanh người","soinu":"Ma Sói Rừng: người sói lông xám, áo chàm rách, móng vuốt dài, trăng tròn ánh mắt","thamtunu":"Hòn Vọng Phu: người vợ bồng con đứng chờ, nửa thân đã hoá đá, khăn mỏ quạ bay","kiengiap":"Kiến Lửa: người lính tí hon mặc giáp kiến lửa đỏ cam, đôi râu kiến, cầm giáo tre và khiên mây đan","lamkynhan":"Lạc Long Quân: thần rồng dạng người, giáp vảy rồng xanh ngọc, râu dài, mũ miện, rồng nước nhỏ quấn quanh","lucsatnu":"Nữ Kiếm Khách: nữ kiếm khách áo xanh lục, búi tóc, kiếm cong dài, tư thế chém","thepnhan":"Thánh Gióng: tráng sĩ vạm vỡ giáp sắt, nón sắt, cầm bụi tre ngà, lửa bốc quanh chân","thiettam":"Thầy Lang: thầy lang già râu dài, gùi thuốc sau lưng, tay toả ánh sáng chữa lành xanh","amtrao":"Hà Bá: thần sông bụng to, da xanh, râu tôm, cầm chĩa, sóng nước dưới chân","bachhau":"Mị Châu: công chúa áo đỏ, áo lông ngỗng trắng, tay rắc lông ngỗng phát sáng","bienhinh":"Quỷ Nhập Tràng: quỷ hoá hình đang biến đổi, nửa người nửa bóng đen, mặt nạ nứt","chonphao":"Chồn Hương: con chồn đứng hai chân, khoác áo lính nhỏ, vác ống pháo tre","daothosan":"Thợ Săn Hổ: thợ săn áo chàm, khăn quấn đầu, cầm mã tấu dài, vai khoác tấm da hổ","diphapsu":"Thầy Pháp: pháp sư áo đạo bào đen viền đỏ, tay cầm bùa giấy vàng, vòng bùa phát sáng","giaosutam":"Ông Bụt: ông Bụt râu tóc bạc phơ, áo trắng, chống gậy trúc, hào quang hiền từ","giapchongcuong":"Giáp Đồng Đen: bộ giáp đồng đen khổng lồ rỗng ruột, khe mắt phát sáng đỏ","giaphon":"Thần Kim Quy: thần rùa vàng già râu trắng, mai vàng khắc hoa văn, áo đỏ, cầm nỏ thần","hapnangthu":"Thạch Sanh: chàng trai vạm vỡ đóng khố nâu hoa văn, cầm rìu, đeo cung vàng sau lưng","hongphuthuy":"Bà Đồng: bà đồng áo đỏ khăn đỏ, cầm quạt và nén nhang, khói hương xoáy","huyetdich":"Hồ Tinh: yêu hồ chín đuôi trắng dạng nữ nhân, tai cáo, mắt đỏ, móng dài, áo trắng viền đỏ, khói tím","kequansat":"Thổ Địa: ông Thổ Địa thấp lùn bụng tròn, cười hiền, cầm gậy, đứng trên đất nứt","khuyenduhanh":"Chó Đá: linh thú chó đá canh cổng làng ngồi trên bệ, thân đá xám khắc hoa văn, vòng cổ đồng có chuông, mắt vàng","kiemsu":"Kiếm Khách Tây Sơn: võ sĩ áo vải đỏ, khăn đỏ, song kiếm, tư thế võ","linhtuonglai":"Chú Cuội: chàng trai láu lỉnh áo nâu, khăn đầu rìu, cười tinh quái, tay xoè quạt lá bài, chân có rễ cây đa nhỏ","longdo":"Xích Long: rồng đỏ thời Lý thân dài uốn lượn chữ S, bờm lửa, ngậm viên ngọc phát sáng","lucsi":"Đô Vật Làng: đô vật cởi trần đóng khố đỏ, cơ bắp, khăn đỏ quấn đầu, thế vật","matthevuong":"Thuỷ Tinh: thần nước tóc dài hoá sóng, giáp vảy xanh thẫm, sóng nước xoáy quanh chân","maymannu":"Thần Tài: Thần Tài béo tốt áo vàng, cười tươi, ôm thỏi vàng, đồng xu bay quanh","mehoacnu":"Ca Nương Ma: hồn ma ca nương áo dài trắng, cầm phách, tóc rũ, sương mờ","mocnhan":"Cây Đa Thần: cây đa cổ thụ có mặt người hiền, rễ như chân, tán lá rộng","nguyetdong":"Chị Hằng: nữ thần mặt trăng áo trắng bạc, ôm thỏ ngọc, vầng trăng sau lưng","nhennu":"Nữ Thần Sương Độc: nữ thần áo tím, sương độc tím xanh toả từ tay, mắt sáng","nuchienthan":"Nữ Binh Mường: nữ chiến binh Mường áo thổ cẩm, khiên tròn, giáo dài","phanthan":"Bóng Ma Song Sinh: hai bóng ma giống hệt đang tách khỏi nhau, áo lam, sương mờ","socnu":"Cô Sóc Rừng: cô bé đuôi sóc nâu, áo nâu, ôm hạt dẻ, vài con sóc nhỏ quanh","songchuynu":"Sát Thủ Nón Lá: nữ sát thủ áo đen, nón lá che mặt, hai dao găm ngắn","tamtuquai":"Thần Tứ Phương: thần bốn mặt bốn tay, giáp đồng, mỗi tay cầm một pháp khí","tantinh":"Đom Đóm Thần: cậu bé thân phát sáng như đom đóm, cánh trong suốt, ánh vàng xanh","tasu":"Thầy Bùa: thầy bùa áo đen, cầm hình nhân bằng rơm, bùa giấy bay","thachnhan":"Thần Đá Lở: quái đá nhỏ lăn tròn, thân đá vụn, mắt đỏ","thanhkiemnu":"Nữ Tướng Voi: nữ tướng giáp vàng cầm song kiếm, hồn voi trắng mờ ảo quấn sau lưng","thanlannhan":"Thằn Lằn Tinh: người thằn lằn da xanh vảy, đuôi dài, áo vải rách, móng vuốt","thienduc":"Chim Lạc: chiến binh mình người đầu chim Lạc, đôi cánh lớn dang rộng, giáp hoa văn trống đồng","thietquyen":"Võ Sư Bình Định: võ sư áo võ đen thắt đai đỏ, nắm đấm phát sáng vàng, thế võ","thoren":"Thợ Đúc Đồng: thợ đúc cởi trần, tạp dề da, cầm búa, lò đúc lửa đỏ nhỏ bên cạnh","thosan":"Thợ Săn Nai: thợ săn áo da nai, mũ lông, cầm nỏ gỗ, sừng nai đeo hông","thuantuong":"Tướng Cổ Loa: tướng giữ thành toàn thân giáp đồng, mũ đồng lông đỏ, khiên lớn hình mặt trống đồng, cầm giáo","thukieu":"Phong Thần: thần gió râu dài, ôm túi gió lớn, áo bay phần phật, gió xoáy quanh","thuyvuong":"Thuồng Luồng: thuồng luồng dạng người mình rắn nước xanh thẫm, vảy bóng, râu dài, sóng cuộn","tieuvuong":"Kẻ Trộm Gà: gã trộm gầy áo vá, khăn đen, ôm con gà trống dưới nách, cười ranh mãnh","tinhquyennu":"Nàng Tấm: thiếu nữ áo tứ thân yếm đào, khăn mỏ quạ, tay nâng quả thị phát sáng vàng","vuotsoi":"Phượng Lửa: chim phượng hoàng lửa dang cánh, lông đỏ cam rực, đuôi dài hoa văn","xacmay":"Ngư Tinh: quái cá khổng lồ dạng bán nhân, răng nhọn, vây gai, thân xanh đen, cầm đinh ba xương cá","xucgiacnu":"Yêu Nữ Gương: nữ yêu áo bạc, cầm gương đồng lớn phản chiếu hình bóng khác","aochoangtoi":"Thầy Ẩn Thân: pháp sư áo choàng tối, nửa người tan vào khói đen, mắt sáng","bangnhan":"Thần Sương Muối: thần nhỏ thân băng tuyết trắng xanh, hơi lạnh toả, tay cầm bông tuyết","baonu":"Thần Mưa: nữ thần áo mây xám, tóc như mây mưa, cầm bình nước đổ mưa, sấm nhỏ","bayong":"Đàn Ong Vàng: cô gái tí hon cánh ong, áo vàng sọc đen, đàn ong bay quanh","bocap":"Rết Tinh: yêu rết dạng người, giáp đốt đỏ đen, nhiều chân càng, móng độc","catnhan":"Ma Cát: người cát vàng đang tan chảy, mắt đỏ, cát cuộn xoáy quanh","chienlo":"Dũng Sĩ Đơn Độc: dũng sĩ áo vải sờn, khăn đỏ, một mình cầm giáo đứng vững","dianang":"Đỉa Tinh: yêu đỉa nhầy nhụa màu nâu đen, miệng hút tròn, ánh năng lượng tím","hacthiet":"Ma Lưỡi Dài: quỷ áo đen gầy gò, lưỡi dài thè ra, mắt trắng dã","huyenco":"Thần ngựa trắng nhìn nghiêng phi nước đại trên mây, bờm như lửa trắng, đeo yên cương đồng chạm trống đồng. ","huyetbacsi":"Ma Lai: ma lai đầu bay lìa thân kéo theo ruột phát sáng đỏ, mặt nhăn nheo (không máu me)","kenken":"Đại Bàng Núi: đại bàng nâu dạng người, cánh lớn, móng vuốt sắc, mắt vàng","matthamnu":"Nữ Do Thám: nữ do thám áo nâu, khăn che nửa mặt, cầm ống nhòm tre và cuộn bản đồ","nanhkiem":"Mèo Chín Mạng: mèo đen lớn đứng hai chân, chín bóng mèo mờ phía sau, mắt xanh","nhasuutam":"Lão Buôn Đồ Cổ: ông lão buôn đồ cổ, kính tròn, gánh hàng đầy bình gốm và tiền xu","nucanve":"Nữ Vệ Binh: nữ vệ binh hoàng thành giáp đỏ vàng, cầm thương, khiên rồng","phaohoanu":"Nàng Hoa Đăng: thiếu nữ áo dài trắng nâng đèn hoa đăng, ánh pháo hoa nhỏ quanh","quyensu":"Thiền Sư Võ: nhà sư áo nâu cà sa, chân trần, tung quyền phát sáng vàng","satvuong":"Diêm Vương: Diêm Vương uy nghi mặt đỏ, râu đen, mũ quan, cầm sổ sinh tử","taythep":"Lính Tay Sắt: người lính một tay bằng sắt rèn, áo lính xanh, khăn đỏ","tegiap":"Tê Giác Đá: tê giác dạng người da đá xám, sừng lớn, vác tảng đá","vetmattroi":"Thần Mặt Trời: cậu bé thần áo vàng, đầu là vầng mặt trời toả tia nắng","vohannhan":"Ông Khổng Lồ: người khổng lồ hiền lành tóc rối, vai mang núi nhỏ, chân như cột đá","yeutinhcam":"Quỷ Phản Trắc: quỷ hai mặt, nửa mặt cười nửa mặt khóc, áo cam đen, dao găm","aiquoc":"Lão Lý Trưởng: ông lý trưởng béo, áo the khăn xếp, ô đen, cười tự mãn","amban":"Bóng Âm Bản: bóng người màu sắc đảo ngược, viền sáng trắng, khói đen","annu":"Ẩn Nữ Sương Mù: nữ ẩn sĩ áo trắng mờ nửa tan vào sương, cầm đèn lồng nhỏ","aomongnu":"Tiên Mộng: nàng tiên giấc mơ áo tím hồng, bong bóng mơ bay quanh","aothuatgia":"Nghệ Nhân Rối Nước: nghệ nhân rối nước áo nâu, điều khiển chú Tễu bằng que tre","baithu":"Con Bạc: gã con bạc áo lụa xanh, quạt lá bài, xúc xắc bay quanh","baochuasat":"Bạo vương ngồi trên ngai đá đen giữa xưởng đúc, đội mũ miện bằng gang hình núi, mặt để trần râu quai nón dữ tợn, mặc long bào tím than thêu sóng bạc, một tay giơ cao ra lệnh, phía ","batkhacan":"Voi Chiến: voi chiến dạng người khổng lồ, ngà dài, giáp đồng, vòi giơ cao","batty":"Bạch Tuộc Tinh: yêu bạch tuộc tím nửa người, tám xúc tu, ôm đồ trộm được","bongma":"Ma Giếng Cổ: hồn ma nữ tóc dài ướt, áo trắng, bò lên từ miệng giếng đá","camvuong":"Vua Câm: vị vua áo đen, miệng bịt khăn vàng, ánh mắt lạnh, ngón tay ra hiệu im","caonu":"Mèo Đen Hoang: nữ mèo đen dáng người, tai mèo, móng vuốt, áo đen viền tím","channu":"Thần Động Đất: nữ thần áo nâu đất, dậm chân làm đất nứt, đá bay lên","cohoang":"Vua Thả Diều: ông vua áo vàng điều khiển nhiều diều sáo tre bay quanh","congchuacongnghe":"Công chúa Tiên Dung áo lụa vàng nhạt, tóc vấn cài trâm ngọc, quay lưng 3/4 rồi ngoái lại qua vai, đứng trên bãi cát ven sông, tay vén tấm màn lụa đào, phía sau là chiếc thuyền rồng","cuongvuong":"Vua Cuồng Trí: vị vua điên tóc bù xù, mũ miện lệch, cười lớn, áo hoàng bào rách","cuthubien":"Cá Ông: cá voi thần dạng người khổng lồ, da xám xanh, khoác lưới cá, hiền từ","dacvutruong":"Quan Thượng Thư: vị quan áo đỏ thêu bổ tử, mũ cánh chuồn, cầm hốt và cuộn chiếu chỉ","dainao":"Trạng Quỳnh: Trạng Quỳnh áo the xanh khăn xếp, cười tinh quái, quạt giấy","dathep":"Đô vật làng vạm vỡ đóng khố đỏ, thắt lưng điều, toàn thân da đồng hun bóng như tượng đúc với hoa văn trống đồng chìm trên ngực và vai, đứng tấn rộng, hai cánh tay giang ngang che c","daudanthieunu":"Thiếu nữ tóc tết đuôi sam, áo giáp da ngắn, lao vút về phía người xem như viên đạn, nắm đấm bọc đồng đi trước, vệt khói phía sau. Biểu cảm quyết liệt. ","dauto":"Ông lão đầu to quá khổ, trán hói cao, mắt kính tròn dày, mạch não phát sáng lờ mờ dưới da đầu, tay vò rách những lá bài giấy. Biểu cảm cười điên dại. ","dichnu":"Người phụ nữ gầy rộc trong áo tơi lá rách, da xanh tái, quanh chân là vũng nhớt độc sủi bọt làm héo hoa cỏ, tay giơ chiếc chuông đồng lắc. Biểu cảm cười lạnh. ","diennhan":"Thanh niên cao gầy mặc áo lính cũ, hai tay nắm hai cột thu lôi bằng đồng, sét xanh chạy dọc người, tóc dựng đứng. Biểu cảm gồng sức. ","docnhanchihuy":"Vị tướng già độc nhãn, bịt mắt bằng miếng đồng chạm trống đồng, áo giáp Đại Việt sờn, chống thanh đao dài, nhìn nghiêng ra xa chỉ huy trận. ","docnu":"Cô gái nhỏ ngồi xổm trên tảng đá rêu, ôm con rắn lục quấn tay, ngước nhìn lên người xem với nụ cười ranh mãnh, răng nanh nhỏ. ","docxanu":"Nữ xạ thủ quay lưng, ngoái đầu qua vai, kéo căng cung tre, mũi tên tẩm độc nhỏ giọt xanh, khăn mỏ quạ đen. Biểu cảm lạnh lùng. ","giapcuuho":"Bộ giáp đồng to lớn có người phụ nữ điều khiển bên trong buồng lái hở, cánh tay giáp giơ cao tấm khiên hình trống đồng che chở, hơi nước phụt từ vai. ","giaphuydiet":"Cỗ giáp đồng đen khổng lồ rỗng ruột, mắt đỏ rực, hai nắm đấm đập xuống đất làm đất nứt, khói đen bốc lên. ","hacbaovuong":"Tướng quân người Thượng vạm vỡ khoác tấm da báo hoa mai vàng đốm đen làm áo choàng, tóc cài lông công, cưỡi con báo hoa mai khổng lồ đang vồ về phía ống kính, tay giương ngọn lao t","hacdich":"Gương mặt hán tử bị lớp nhựa sơn ta đen đặc phủ từ cổ lên nửa mặt, nhựa đen chảy ngược bám lấy da như rễ cây, nửa mặt còn lại nhắm mắt bình thản, môi mím chặt, quanh cổ những mảnh ","hacmieu":"Con mèo mun mắt vàng ngồi trên mái ngói rêu, đuôi chẻ đôi, nhe răng cười, ngước nhìn người xem; chiếc lục lạc đồng ở cổ. ","hacthan":"Vị thần đen khổng lồ ngồi trên núi xương sọ, áo choàng đen như khói, bàn tay ngửa hút những đốm linh hồn sáng bay về. ","haplucnu":"Nữ pháp sư tóc ngắn, áo giao lĩnh xám tro, nghiêng người, một tay chụm lại hút sợi ánh sáng xanh ngọc từ xa về lòng bàn tay. ","hapthunhan":"Nam đô vật bụng phệ, da vằn những ấn chú phát sáng, ngửa cổ há miệng nuốt luồng khí vàng cam xoáy, tay ôm bụng. Biểu cảm tham lam. ","heonhen":"Chú heo ỉn đen bụng phệ kiểu tranh Đông Hồ, trên mình có những xoáy âm dương trắng, đứng hai chân giữa sân đình, há mõm ủn ỉn thổi ra chuỗi bong bóng tròn bay thẳng về phía ống kín","huyetbatuoc":"Quý ông gầy cao trong áo the đen viền đỏ, khăn xếp đỏ thẫm, quay lưng cầm chén rượu đỏ, ngoái qua vai cười nhếch mép, răng nanh. ","khuonmauchu":"Ông thợ đúc bụng phệ ngồi giữa các khuôn đúc đồng đang nguội, ngước nhìn lên, tay cầm búa nhỏ, xung quanh là những con lính đồng tí hon vừa ra khuôn. ","kiemlongnhan":"Chiến binh nửa người nửa rồng, vảy xanh ngọc trên vai, vung thanh kiếm cong chém ngang, lưỡi kiếm lao về phía ống kính, đuôi rồng quét phía sau. ","kiemnupho":"Nữ kiếm khách phố thị, tóc cắt ngắn ngang vai, sẹo trên má, cắn dây buộc tóc, thanh đoản kiếm đặt ngang vai sát mặt. Biểu cảm ngang tàng. ","kimthuatsi":"Nhà giả kim lùn béo, kính mắt đồng, đeo đầy túi da, đang rót dung dịch vàng lỏng từ bình gốm vào lò, lửa bùng, đồng xu bắn tung. ","kimve":"Lính canh cao lớn mặc giáp vảy vàng đồng, cầm khiên tròn khổng lồ hình mặt trời trống đồng, đứng chắn cổng; phía sau là một hố đen nhỏ cuộn xoáy. ","kinhnhan":"Người khổng lồ biển nửa người nửa cá voi, đầu cá voi xanh xám, thân người cơ bắp, đứng một mình giữa sóng, nhìn nghiêng ra khơi. ","lamconu":"Cô bé tóc hai búi, áo yếm xanh lam, ngồi một mình trên chiếc lá sen lớn giữa hồ, ôm đầu gối ngước nhìn, đom đóm xanh quanh. ","laophuthuy":"Bà phù thuỷ già răng đen, móng tay dài cong, mắt trắng đục, tay nắm những sợi chỉ điều khiển con rối giấy, khuôn mặt nhăn nheo cười. ","linhbattu":"Người lính trẻ áo nâu rách, băng bó khắp người, vẫn xông tới giương ngọn giáo thẳng vào ống kính, vết thương phát sáng vàng đang tự lành. ","loithan":"Thần sấm mặt chim cánh đen, hai tay giơ cao búa và đục sấm bằng đồng, sét bạc toả xuống người xem từ trên cao. ","lucnu":"Nữ đô vật cơ bắp, búi tóc cao, đai vải đỏ, quay lưng vác tảng đá lớn trên vai, ngoái lại với nụ cười thách thức. ","lucthan":"Thần sức mạnh trung niên, râu quai nón, cởi trần, hai tay xoay một bánh xe gió khổng lồ bằng tre, các vật thể bị hất văng ra hai bên. ","matoc":"Ma tốc độ là hồn ma chàng trai áo trắng mờ, chạy nước rút nhoè thành vệt, phía sau kéo theo bóng những thẻ bài cũ bay lên. ","maydotam":"Cỗ máy đầu người bằng đồng thau, mặt nạ có ba mắt kính xoay, ăng-ten hình sừng, các ống dẫn nối vào óc lộ ra phát sáng. ","mieunuot":"Con mèo béo tròn khổng lồ màu cam vằn nằm ườn chắn lối, miệng há to như hang, bên trong lấp lánh sao, ngước nhìn người xem. ","mieuthan":"Thần mèo xiêm thon dài đứng bằng hai chân, mặc áo choàng ngắn màu trắng ngà, đội mũ miện nhỏ, nhìn nghiêng ngạo nghễ, đuôi cong. ","minhhau":"Nữ hoàng cõi âm cao lớn, vương miện bằng xương, áo đen thêu chỉ bạc, giơ trượng đèn lồng, dưới chân những bàn tay ma trồi lên khỏi đất. ","namtuocamthuat":"Nam tước gầy guộc, mũ cánh chuồn đen, vung quạt giấy, từ quạt phóng ra những lá bùa vàng bay thẳng vào ống kính. ","naomay":"Bộ não khổng lồ trong lồng kính đồng, có tám chân máy nhện bám đất, các tia sét xanh nối giữa não và hai bản sao nhỏ hơn. ","ngankiemsi":"Kiếm sĩ đội nón lá, áo bạc, đứng nghiêng tĩnh lặng, tra kiếm vào vỏ sau nhát chém, phía sau là những lá bài bị chém đôi rơi. ","nganluot":"Chàng trai cưỡi tấm ván gỗ trôi trên sóng bạc, cúi người lao về phía người xem, tóc bay, bọt nước bắn. ","nguuma":"Ma đầu trâu khổng lồ, sừng cong, giáp đồng hoen gỉ, cầm chiếc chùy đá, phì hơi khói từ mũi. ","nguyetkysi":"Kỵ sĩ áo trắng ngà cưỡi ngựa bạch, quay lưng 3/4 về phía trăng tròn, ngoái lại, cây giáo dài cắm lá cờ vải. ","nguyetyeu":"Tiểu yêu tinh mặt trăng nhỏ xíu, da xanh lơ, tai nhọn, ngồi vắt vẻo trên lưỡi liềm trăng, ngước lên cười láu cá, tay cầm kéo cắt bóng. ","nhenhauthe":"Cỗ chiến xa bằng sắt rèn đen bóng thấp sát đất, tám chân sắt khớp đồng chạm hoa văn trống đồng, một nữ thợ rèn tóc búi khăn chàm ngồi điều khiển trên lưng, chân sắt bước qua mỏm đá","nhenma":"Gương mặt cô gái tái nhợt nửa che khăn tơ nhện, đôi mắt tám con ngươi đỏ, một con nhện trắng bò trên má. ","nhennhan":"Chàng trai làng chài áo cánh nâu, khăn rằn buộc trán, chân trần, đu mình vượt qua khúc sông trên một sợi dây tơ trời óng vàng buộc vào cành cây gạo, tay kia quăng vòng thòng lọng b","nhentre":"Chú bé đồng tử tóc để chỏm, yếm đỏ, ngồi xếp bằng trên tàu lá chuối, ôm một cuộn tơ tằm vàng óng to bằng quả bưởi, sợi tơ vàng vắt ra lượn quanh người như dải sóng, ngước nhìn ngườ","nuchuarung":"Nữ chúa rừng cao lớn, tóc là rễ cây, khoác áo vỏ cây, hai tay dang ra, dưới chân mầm cây và thú nhỏ trồi lên. ","nucuongnhan":"Nữ chiến binh cơ bắp cuồng nộ, tóc đỏ rối, gào thét, vung rìu đôi, vết sơn chiến trên mặt, đất đá văng. ","nuloithan":"Nữ thần sét tóc trắng dài bay ngược, mắt phát sáng bạc, chiếc chuỳ đồng nhỏ áp sát má, tia sét bò trên da. Biểu cảm phấn khích. ","nuthanchienma":"Nữ tướng cưỡi chiến mã đen tung vó, giáp đỏ son, kéo cương, ngựa chồm hai chân trước. ","ongnu":"Cô bé ong tí hon có cánh trong suốt, áo vàng sọc đen, ngồi trên bông hoa bí, ngước nhìn với đôi mắt to. ","phanquanbua":"Phán quan âm phủ râu đen, mũ cánh chuồn, giơ cao chiếc búa phán xử bằng đồng, sổ sinh tử mở bên tay kia. ","phatuong":"Tướng phá trận cơ bắp, đầu quấn khăn đỏ, húc vai xuyên qua bức tường gạch về phía người xem, gạch vỡ văng. ","phethachnu":"Thiếu nữ có nửa khuôn mặt hoá đá rạn nứt, mắt đá phát sáng cam, tóc rối dính bụi, môi mím. ","phiconamcanh":"Con diều sáo ngũ sắc khổng lồ hình chim phượng, khung tre, giấy dó năm màu đỏ vàng xanh trắng đen, ống sáo tre gắn trên lưng, chao nghiêng trên cánh đồng lúa, dây diều căng xuống m","phochihuy":"Phó chỉ huy trẻ đeo kiếm, áo lính xanh chàm, quay lưng thổi tù và sừng trâu, ngoái lại ra hiệu. ","phongnu":"Nữ thần gió ôm túi gió da khổng lồ, tóc và váy bị gió giật ngược, xoáy gió cuốn lá và đá. ","phuongtamnu":"Thiếu nữ ôm chim phượng đỏ trước ngực, lửa phượng toả quanh hai người như vòng tròn, áo tứ thân đỏ cam. ","quangca":"Ca sĩ dân gian tròn trịa ngồi trên bậc đình, ôm đàn nguyệt, ngước lên hát, nốt nhạc ánh sáng bay quanh. ","quangchuy":"Sát thủ nhỏ nhắn nhìn nghiêng, cầm đoản chuỷ phát sáng trắng, khăn đen che mặt, tư thế sẵn sàng lao. ","quanthoigian":"Lão quan thời gian cao gầy, áo bào chàm, cầm chiếc đồng hồ cát khổng lồ bằng đồng, cát vàng chảy ngược lên trời. ","socheo":"Đầu lâu chiến binh đội nón chóp, mắt lửa xanh, hai thanh kiếm bắt chéo phía sau đầu, hàm cười. ","sodo":"Hài cốt một vị tướng cổ đứng dậy từ mộ, xương sườn và vai bọc giáp sơn son đỏ, đầu đội mũ trụ đồng gỉ che kín nửa trên chỉ lộ hai đốm lửa lam, quay lưng 3/4 rồi ngoái lại qua vai, ","sokhong":"Gương mặt thiếu niên trắng bệch không biểu cảm, mắt là hai vòng tròn rỗng trắng, trên trán vẽ một vòng tròn mực, quanh mặt các chữ cái bị xoá mờ trôi đi. ","songnu":"Nữ thần sóng lướt trên ngọn sóng dựng đứng, tay vung về phía ống kính, sóng nước cuộn ập theo, tóc ướt dính mặt. ","suphunhai":"Ông sư phụ già lùn râu dài nhại dáng võ của một cái bóng to đứng sau lưng, hai bên làm cùng một thế võ lệch nhau, miệng méo cười. ","tamkiemnu":"Nữ kiếm sĩ tĩnh tâm, nhìn nghiêng, mắt nhắm, thanh kiếm sáng đặt ngang trước ngực, tóc búi gọn, áo vải xanh lá trúc. ","thiendien":"Kẻ nghìn mặt nhỏ thó ngồi bệt giữa vòng mặt nạ tuồng đủ màu, đang đeo dở một chiếc, ngước nhìn lên người xem, nửa mặt thật nửa mặt nạ. ","thienlenhnu":"Nữ sứ giả trời cao lớn, áo trắng viền xanh chàm, giơ cao cuộn chiếu chỉ vàng phát sáng, các đồng xu đồng rơi lả tả quanh. ","thuthu":"Ông thủ thư gầy, kính tròn, đội khăn xếp, ôm chồng sách lá buông cao quá đầu, một quyển đang mở phát sáng, các trang giấy lặp lại thành nhiều lớp mờ. ","thuyba":"Bá chủ sông nước bụng phệ, râu cá trê, mặc giáp vảy cá, ngồi trên lưng con cá sấu lớn đang há miệng nuốt một con cá nhỏ. ","tinhquangnu":"Thiếu nữ nhìn nghiêng, ngửa mặt về phía bầu trời, tay chỉ lên một ngôi sao sáng, tóc đen dài thả, áo lụa trắng mỏng sát người. ","tonu":"Cô gái dệt tơ quay lưng, ngoái lại, đứng trên khung cửi tre, tay kéo những sợi tơ vàng mảnh nối ra các hướng, tóc búi cài trâm gỗ. ","trum":"Gã trùm xóm lùn béo ngồi dạng chân trên chiếc ghế mây, phì phèo điếu cày, bụng phệ, ngước nhìn lên khinh khỉnh, hai tên lâu la nhỏ đứng sau. ","trumtruyenhinh":"Ông bầu gánh hát bội bụng phệ, áo gấm tím thêu rồng, khăn đóng, ôm chiếc trống chầu và dùi, đứng giữa sân khấu tre chật kín đào kép mặc phục trang tuồng chen vai hai bên; khung ngh","trungmau":"Trùng mẫu khổng lồ thân mềm phân đốt màu xanh ngọc, có gương mặt bà mẹ hiền, ôm hai con trùng non trong vòng tay. ","tunguyennu":"Nữ pháp sư bốn nguyên tố, bốn quả cầu đất, nước, lửa, gió xoay quanh hai bàn tay, ánh mắt tập trung, áo nâu đất gọn gàng. ","tunu":"Nữ từ trường vươn tay về phía ống kính, kéo những mảnh sắt, đinh, kiếm gãy bay về phía mình, tóc bị từ trường hút dựng lên. ","tutraonu":"Gương mặt nữ sát thủ lạnh lẽo, móng tay đen dài như vuốt giơ lên ngang mặt, mắt xám bạc, môi tím đen, hoa văn cổ quanh mắt. ","tuvuong":"Vị vua già ngồi trên ngai đẽo từ đá nam châm đen bóng, đội vương miện bằng quặng đá thô, áo bào nâu đất thêu la bàn cổ, giơ một bàn tay ngửa, những chiếc nón quai thao, lá cờ và ng","tuyetve":"Cậu bé lính tuyết đội mũ lông, má đỏ, ngồi trên lưng con gấu trắng nhỏ, một con chim ưng băng đậu trên vai, ngước nhìn lên. ","vonganh":"Người phụ nữ bóng ma quay lưng, ngoái qua vai, thân dưới tan vào sương, tay cầm tấm gương đồng phản chiếu một gương mặt khác. ","vouy":"Gương mặt chàng hiệp sĩ mù trẻ, đôi mắt che bằng dải lụa trắng ngà thêu vân mây xanh, đầu hơi nghiêng lắng nghe, môi mỉm cười tự tin, cây gậy trúc dựng sát má, giữa dải lụa thêu hì","vuabong":"Vua bóng tối ngồi lệch trên ngai đá, cái bóng phía sau to gấp ba và có cử động riêng, vương miện đen nhọn. ","xanang":"Thiếu niên xạ thủ ngắm nỏ thẳng về ống kính, mũi tên đang tích năng lượng vàng rực, chân trụ thấp, mồ hôi trên trán. ","yeutinhluc":"Yêu tinh lùn da xanh lục, tai dài, cười nhe răng, ngồi xổm trên tảng đá, hai tay ôm một chiếc bình gốm vỡ, ngước nhìn lên tinh quái. ","bangvuong":"Vua băng cao lớn râu trắng như tuyết, vương miện tinh thể băng, giơ trượng băng, những cột băng nhọn mọc lên từ đất. ","baocat":"Người cát khô gầy, nửa thân dưới là cơn lốc cát xoáy, tay ném những hòn đá về phía trước, khăn quấn đầu bay. ","battymienvien":"Hiền giả tám tay ngồi giữa vòng bài lá bay, mỗi tay cầm một lá bài, mặt nhắm thiền, áo xanh chàm. ","catlun":"Cô gái nhỏ đang bị lún dần trong hố cát vàng, chỉ còn nửa người, một tay chới với giơ lên, ngước nhìn người xem cầu cứu mà miệng lại cười tinh quái. ","chubao":"Anh Mõ làng gầy nhom áo nâu rách vai, khăn xếp lệch, hai má đỏ, vừa gõ chiếc mõ tre hình cá vừa há miệng rao về phía ống kính, tay kia khum trước miệng; tiền cảnh: con gà mái hoảng","cotnu":"Gương mặt người phụ nữ nửa da thịt nửa xương sọ, búi tóc cài trâm xương, chuỗi hạt xương quanh cổ, ánh mắt u buồn. ","cuduto":"Nàng tiên dệt áo lụa trắng mỏng thả mình từ đám mây xuống, một tay níu sợi tơ trời óng bạc buông thẳng từ vầng trăng, tay kia nâng một chiến binh tí hon đung đưa trên đầu sợi tơ nh","cunemthantoc":"Gã ném đá thần tốc vạm vỡ cởi trần, ném quả cầu đá rực lửa thẳng vào ống kính, cánh tay mờ vì tốc độ. ","cuongtri":"Thiếu niên mặt cười điên, mắt xoáy ốc, tóc dựng, ôm đầy bài lá trong tay đến tràn ra, lá bài rơi khắp nơi. ","cuongtu":"Gã khổng lồ cuồng chiến bảy thước, cơ bắp cuồn cuộn đầy hình xăm trống đồng, gầm thét, vác thân cây làm chuỳ. ","cuvocanhhungvi":"Bướm khổng lồ có cánh như tranh Đông Hồ, nhìn nghiêng khi đang vỗ cánh, gió bụi vàng toả ra từ cánh. ","diaba":"Bá chủ đất đai to béo đội nón lá rộng, tay ôm túi đá, đứng trên ụ đất cao, các tảng đá nhỏ nảy lên quanh chân. ","dichdo":"Cô gái nhỏ áo đỏ quần đen ngồi xếp bằng, tay xáo bài đỏ phát sáng, các con bọ đỏ bò quanh, ngước nhìn lên. ","giacdausi":"Võ sư lôi đài trung niên vạm vỡ, áo võ cộc tay đen, đai đỏ, đứng trên sàn lôi đài tre cắm cờ ngũ sắc, một tay kéo đối thủ áo xanh ngã chúi lên sàn, chân kia tung cú đá thẳng về phí","giacquannhen":"Cô đồng trẻ ngồi xếp bằng trên chiếu cói, mắt nhắm, giữa trán ánh lên một đốm sáng lam, quanh đầu toả ra những gợn sóng cảm ứng như vân nước, ba quả chuông đồng nhỏ treo quanh đang","hackysi":"Kiếm khách lãng tử áo the đen, nón lá rách vành đeo sau lưng, quay lưng 3/4 rồi ngoái lại qua vai, vác thanh kiếm gỗ mun đen tuyền vân như than đá, chuôi quấn vải đỏ, đứng giữa bãi","hacthachtuong":"Tướng đá đen khổng lồ, thân đá núi lửa có khe dung nham, cầm chiếc chuỳ nhỏ trên tay to như cột đình. ","hapkinh":"Mặt người cá voi xanh xám, mắt hiền nhưng to, miệng há hút luồng nước và cá nhỏ vào, râu như rêu biển. ","hauduethoikhong":"Cậu bé hậu duệ thời không đứng giữa những đồng hồ mặt trời vỡ lơ lửng, cơ thể chia thành nhiều bóng mờ ở các tư thế khác nhau. ","hoangngoc":"Thiếu nữ ôm khối ngọc vàng sáng trước bụng, mặt rạng rỡ, áo tứ thân nâu, tóc vấn khăn mỏ quạ. ","hoasu":"Sứ giả lửa tóc rực cháy, vung cánh tay phóng ra con chim lửa về phía ống kính, tàn lửa bay. ","hopamdiectai":"Nhạc công điếc tròn trịa ngồi giữa đống trống, chiêng đồng, đeo nút tai bằng nút gỗ, gõ dùi vào chiêng tạo sóng âm vòng tròn, ngước lên cười. ","kychu":"Kỳ chủ già nhìn nghiêng, ngồi trước bàn cờ tướng, tay nhấc quân cờ lớn, quân cờ phát sáng. ","kynu":"Nữ kỳ thủ trẻ, áo dài xanh chàm, ôm bàn cờ vây bằng gỗ, các quân cờ trắng đen bay lơ lửng xếp hình quanh. ","laogay":"Lão ăn mày râu tóc rối, răng sún, cười hở lợi, chiếc gậy trúc buộc bầu rượu tựa sát mặt. ","linhgaccuoi":"Người lính gác cuối cùng quay lưng đứng trên tường thành đổ nát, ngoái lại, ngọn giáo và lá cờ rách, khói chiến trận phía xa. ","linhthuelammom":"Thằng Bờm tóc để trái đào, áo nâu vá, quần xắn gối, ngồi vắt vẻo trên lưng trâu, tay phe phẩy chiếc quạt mo cau to, tay kia nắm nắm xôi, miệng toe toét cười láu lỉnh. ","loanxa":"Xạ thủ loạn xạ mắt lác, bắn hai cây nỏ cùng lúc về hai hướng, tên bay tán loạn, miệng gào. ","longchu":"Chủ rồng trung niên râu ngắn, mặc giáp vảy, đứng trên đầu con rồng đất khổng lồ đang ngóc lên. ","lukhachtroi":"Lữ khách nhìn nghiêng đi trên mây, nón lá, gậy trúc, tay nải, áo vải nâu bạc màu. ","matocdautien":"Bóng ma chạy đầu tiên, thân mờ như khói xám, lao tới ống kính, phía sau kéo vệt ảnh nhân lên nhiều lần. ","mauthoikhong":"Người mẹ thời không đẫy đà, áo nâu, bế một đứa trẻ phát sáng, sau lưng là chiếc đồng hồ nước bằng đồng. ","maythichnghi":"Con rối nước khổng lồ sơn son thếp vàng hình chú Tễu bụng phệ, đứng trên mặt ao trước thuỷ đình, sau lưng những sào tre và dây gai thò ra từ rèm, một tay vươn ra chộp lấy lá bùa đa","nganluotsokhai":"Hiệp khách già tóc bạc buộc khăn trắng, áo bà ba bạc phai, nhìn nghiêng, đứng chân trần trên tàu lá sen khổng lồ trôi giữa sóng bạc dưới trăng, tay chống cây sào tre, nước bạc toé ","nguoituyet":"Người tuyết khổng lồ lông trắng xù, nắm tay to bằng tảng đá, gầm lên giữa bão tuyết. ","nguumamienvien":"Ma đầu trâu già gầy, sừng gãy một bên, cầm cây giáo ba mũi, giẫm lên những chiếc khiên gỗ vỡ. ","niemluctu":"Thiền sinh trẻ đầu cạo trọc, mắt nhắm, trán có ấn phát sáng, những viên sỏi lơ lửng sát mặt. ","nokiem":"Thanh kiếm sống có mắt đỏ trên chuôi, tự bay chém ngang về phía ống kính, lưỡi kiếm rạn nứt toả lửa đỏ. ","nubatuoc":"Bà Chúa Kho trung niên đẫy đà phúc hậu, khăn vấn vàng, áo the vàng thêu hoa cúc, đứng trước cửa kho thóc lợp ngói, tay cầm chiếc chìa khoá đồng lớn, sau lưng bồ thóc và hòm tiền đồ","nuphanquan":"Nữ phán quan trẻ, mũ quan đen, áo đỏ son, tay cầm cân đồng nhỏ đang nghiêng về một bên, nét mặt nghiêm nghị. ","phonghiem":"Chiến binh phòng hiểm quay lưng, ngoái lại, giơ tấm khiên tròn lớn che sau lưng, khiên khắc mặt hổ. ","phuonghoa":"Chu Tước, thần điểu phương Nam dáng chim lạc mỏ dài, mào cao, lông đỏ son điểm hoa văn trống đồng vàng trên cánh, lao vút về phía ống kính từ một lư hương đồng đang toả khói, móng ","quadao":"Sát thủ quạ, mặt nạ mỏ quạ đen, nhìn nghiêng, áo choàng lông quạ, cầm đôi đao cong. ","quandoanmotnguoi":"Người lính một mình là cả quân đoàn: đại hán đứng trên gò đất, phía sau là hàng chục bóng chính mình mờ dần xếp thành đội ngũ, giương cờ. ","thietthieunien":"Cậu bé thợ rèn làng nghề áo cánh nâu, đội chiếc nồi đồng làm mũ, khoác tấm giáp vá từ mâm đồng và đinh tán, lưng đeo hai ống bễ lò rèn phì hơi nước, lao về phía ống kính trên đôi g","thieutachienthang":"Vị tướng thời Trần trung niên, mũ trụ đồng chóp nhọn tua đỏ, áo giáp vảy, nhìn nghiêng giơ cao thanh kiếm chỉ về phía trước, hai thiếu niên lính cầm cờ hiệu và tù và đứng hai bên d","thongkho":"Gương mặt đau khổ của một hồn ma lam lũ, nước mắt đen chảy dài, những bàn tay mờ bám lên vai và cổ. ","thosanhuyetthach":"Thợ săn đá máu quay lưng, ngoái lại, đeo gùi đầy tinh thể đỏ, tay cầm chiếc cuốc đá, áo da thú. ","thuyngannu":"Người phụ nữ làm từ thuỷ ngân lỏng bạc, thân hình đang chảy và biến dạng, tay kéo dài thành lưỡi dao, phản chiếu méo mó xung quanh. ","thuynhan":"Người nước cao lớn, cơ thể là dòng nước trong vắt có cá bơi bên trong, giơ hai tay nâng một vòng xoáy nước trên đầu. ","thuytoquyen":"Võ sư thuỷ tổ già nhưng rắn rỏi, tung cú đấm về phía ống kính, quả đấm cuộn theo cột nước xoáy, áo nâu sờn. ","tienbui":"Nàng tiên bụi nhỏ xíu cỡ bàn tay ngồi trên chiếc lá khô, cánh như bụi phấn vàng, rắc bụi sáng lên những con số bay, ngước lên. ","trathan":"Gương mặt kẻ lừa đảo trơn tru, ria mép nhọn, một mắt nháy, nụ cười gian, tay cầm xấp bài che nửa mặt, lá bài trên cùng đang đổi hình. ","trungchien":"Chiến binh côn trùng nhỏ như con bọ ngựa đứng hai chân, giáp vỏ xanh lục, hai càng như lưỡi hái giơ cao, tư thế lao tới. ","trungvuong":"Vua côn trùng khổng lồ thân bọ hung giáp đen ánh xanh, sừng cong, ngồi trên ngai làm từ tổ mối, xung quanh bầy bọ nhỏ. ","ungsao":"Chim ưng sao nhìn nghiêng sải cánh, lông cánh lấp lánh như bầu trời sao, mắt sáng. ","ungtoi":"Chim ưng đen khổng lồ đậu trên vách đá, cánh xoè che bầu trời, mắt đỏ nhìn xuống, móng vuốt quắp lá bài. ","vuotnu":"Nữ thú nhân mèo rừng vồ tới ống kính, móng vuốt giương, đuôi dựng, tóc rối, áo da báo. ","xackimve":"Bộ xương lính gác mặc giáp đồng gỉ, ngồi gục trên bậc đá, đầu lâu ngẩng lên nhìn người xem, trong hốc mắt lửa xanh. ","xebay":"Chiếc kiệu bát cống sơn son thếp vàng, mái cong đầu rồng, rèm lụa đỏ bay, không có bánh xe, bốn đòn khiêng được nâng bởi những đám mây cuộn và bốn con hạc trắng, đang bay lên trời.","ainunuotsao":"Thiếu nữ si tình ôm một ngôi sao nhỏ phát sáng trước ngực như ôm người yêu, má ửng hồng, áo yếm hồng nhạt. ","annusokhai":"Nữ ẩn sĩ khoác áo tơi rơm quay lưng giữa rừng trúc, ngoái lại, đèn lồng giấy nhỏ trong tay. ","aosi":"Ảo thuật gia gầy cao, áo the đen, tay tung những đồng xu biến thành bướm, bóng của ông là một con hổ. ","bachdich":"Nhà sư trẻ gầy guộc mặc áo nâu sồng, nửa người đang hoá thành lớp thạch cao trắng mịn như pho tượng chùa chưa tô màu, những vết rạn trắng lan từ bàn tay lên vai, tay kia lần chuỗi ","bangca":"Cô bé hát băng ngồi trên khối băng, miệng hát ra những bông tuyết, ngước lên, khăn len đỏ. ","baochuahauthe":"Gương mặt hoàng đế đeo nửa mặt nạ sắt rèn che từ mũi trở lên, chạm hình rồng cuộn thời Lý, cằm để râu đen ngắn, đội mũ bình thiên có rèm châu, ánh mắt lạnh nhìn thẳng ống kính, cạn","batbainu":"Nữ đấu sĩ bất bại đầy vết thương nhưng vẫn lao lên, chém thanh đao về phía ống kính, máu và bụi bay. ","bato":"Bà lão quay tơ ngồi bên guồng quay gỗ, sợi tơ bạc kéo dài từ tay bà ra xa, mắt híp cười hiền. ","bavuongmienvien":"Bá vương xạ thủ nhìn nghiêng, giương cây cung lớn, ống tên sau lưng đầy mũi tên đủ màu, áo choàng ngắn. ","bavuongtim":"Bá vương khổng lồ da xám xanh, cằm nhiều nếp, đeo găng đồng khảm sáu viên đá màu, ngồi trên ngai đá nhìn xuống. ","bocapngaymoi":"Rết chúa khổng lồ đốt đỏ thẫm viền đen bóng, trăm chân vàng nghệ, trên đầu mọc chiếc mào sừng như vương miện, cuộn mình quanh vách hang đá ẩm, hai nanh nhỏ giọt độc lục; khung nghi","buisao":"Đứa trẻ bụi sao lơ lửng xoay vòng giữa không trung, thân thể lấp lánh như vũ trụ, bụi sao toả thành vòng xoắn. ","camapcan":"Cá mập đứng hai chân trên cạn, đội nón lá, há hàm răng lao về phía ống kính, vây lưng rẽ đất như rẽ nước. ","chienthan":"Chiến thần cao lớn, mũ giáp sừng trâu, cầm giáo và khiên tròn trống đồng, đứng trên đỉnh núi, mây bão quanh. ","chimcanhdo":"Chim cánh đỏ nhìn nghiêng đang lao xuống, cánh xoè đỏ như lửa, mỏ vàng. ","chimnhai":"Chim nhại đậu trên cành tre nhỏ, ngửa cổ hót, quanh nó là bóng mờ của những con chim khác mà nó bắt chước, ngước nhìn lên. ","chomay":"Chú chó máy bằng đồng thau và gỗ, chạy nhảy về phía ống kính, đuôi là lò xo, mắt đèn xanh. ","chonvacay":"Đôi bạn rừng xanh: chú khỉ đuôi dài lông nâu vàng quàng chiếc khăn rằn nhỏ ngồi trên lưng chú gấu ngựa con lông đen có vầng trăng trắng trước ngực, cả hai ngồi giữa đám dương xỉ ng","chutruongnu":"Nữ pháp sư trẻ cầm cây trượng gỗ có đầu là đá đổi màu, đặt sát má, mắt một màu xanh một màu đỏ. ","cohoangvocuc":"Cơ hoàng uy nghi bằng đồng xanh, mặt nạ vua, ngực có lõi phát sáng, hai tay nâng hai viên đá phát sáng. ","comaychien":"Cỗ máy chiến tranh khổng lồ bằng gỗ và đồng như con voi chiến cơ khí, tháp nỏ trên lưng, ống khói phun khói. ","conhan":"Ông cổ nhân râu dài quay lưng, ngoái lại, tay ôm cuộn bản đồ cổ phát sáng, gậy chống. ","conhansu":"Gương mặt thầy pháp cổ nhãn có con mắt thứ ba dọc giữa trán phát sáng xanh lục, râu bạc, khăn đỏ. ","cosi":"Cờ sĩ trẻ tay vẫy lá cờ lệnh lớn, áo lính đỏ, miệng hô to, tóc buộc khăn. ","cosinhthe":"Người nửa máy nửa cây: thân gỗ có bánh răng và dây leo, đang tự sửa chữa cánh tay, mạch nhựa sáng. ","cucquang":"Nữ thần cực quang nhìn nghiêng, tóc dài là dải cực quang xanh lục hồng chảy ngược lên trời, áo trắng. ","culongco":"Cự long cổ đại khổng lồ, vảy đá rêu phủ, mắt vàng, đầu ngẩng cao trên vách núi, nhìn xuống. ","cunhan":"Người khổng lồ hiền lành nhỏ con nhất bộ tộc, ngồi bó gối trên đồi, ngước lên cười ngượng, tay cầm bông hoa. ","cuongdomienvien":"Chiến binh cuồng nộ đỏ tóc rực, lao tới ống kính vung rìu, mắt đỏ, miệng gầm. ","cuongnhando":"Gã khổng lồ cởi trần, mặt vẽ kép tuồng mặt đỏ với lông mày xếch rậm, râu đen dài, quấn khố vải điều, hai tay vác ngang cây chày giã gạo bằng gỗ lim khổng lồ, hơi nóng bốc khỏi vai,","cuongnhanxam":"Người khổng lồ già trầm lặng, mặt vẽ tuồng trắng xám lạnh như sương, tóc bạc búi cao, khoác áo tơi lá màu tro, nhìn nghiêng, một tay ôm tảng đá núi phủ sương giá, hơi thở thành làn","dacvuquocgia":"Nữ đặc vụ quay lưng, ngoái qua vai, áo dài đen, tay giấu khẩu súng hoả mai ngắn, mũ nồi. ","daitaxacsong":"Gương mặt đại tá xác sống, da xanh nhợt, một mắt chảy xệ, mũ quân đội cũ, huân chương gỉ. ","dakhuc":"Nhạc công dạ khúc nhìn nghiêng, thổi sáo trúc dưới trăng, nốt nhạc phát sáng bay ra thành những cánh cửa nhỏ. ","dathuongnu":"Nữ đạo tặc đêm, khăn che mặt, cầm thanh đoản đao ngược, áo đen ôm, nhìn sắc lạnh. ","daubay":"Chiếc đầu người bay có tai như cánh dơi, tóc dài kéo theo, cười láu lỉnh, ngước nhìn lên từ dưới. ","deonhansokhai":"Chàng trai dẻo như cao su, cánh tay vươn dài vòng thẳng về phía ống kính, chân quấn quanh cột tre. ","dichcuongcot":"Bộ xương khổng lồ bị chất nhầy đen bao bọc như cơ bắp, đứng dậy từ đất mộ, mắt đỏ. ","diennu":"Thiếu nữ tóc ngắn dựng vì tĩnh điện, tia điện nhỏ chạy trên ngón tay đặt cạnh má, cười tinh nghịch. ","dihien":"Người dì hiền đẫy đà, áo bà ba, quấn khăn, tay xách giỏ trái cây, tay kia vẫy, mỉm cười. ","diphaptoithuong":"Vị chưởng giáo đạo quán râu dài trắng, đạo bào xanh chàm thêu bát quái, đội mũ đạo sĩ, tay cầm phất trần, đứng giữa sân đạo quán; quanh ông những lá bùa vàng nhỏ đang bay tụ vào ng","docdich":"Con quái nhầy độc xanh lục nhỏ ngồi trong vũng nhớt, nhiều mắt, ngước nhìn lên, cười. ","docnutrang":"Nữ độc dược sư áo trắng quay lưng, ngoái qua vai, thổi một nụ hôn ra làn khói độc xanh nhạt. ","dothan":"Đồ thần to lớn mặc áo choàng nâu, tay cầm cây bút lông khổng lồ vẽ lên bầu trời những bản đồ phát sáng. ","giapdam":"Bộ giáp đồng bước dậm chân lao tới, mặt đất rung, bụi bốc, nắm đấm đồng đấm thẳng ống kính. ","hacdichbinh":"Lính nhầy đen lao tới, cánh tay biến thành lưỡi giáo nhầy đâm thẳng ống kính; tiền cảnh là giọt nhầy đen bắn sát máy, nhoè. ","hacdiemchua":"Chúa lửa đen khổng lồ ngồi trên ngai đá núi lửa, sừng dài, lửa đen liếm quanh vai, một tay cầm cuộn bùa triệu hồi đang cháy; tiền cảnh: tàn tro bay sát máy. ","hacthuatsi":"Gương mặt thầy bùa trẻ gầy, nửa mặt che bởi bóng tối, mắt phản chiếu những lá bùa đang cháy, môi lẩm nhẩm; tiền cảnh: lá bùa giấy vàng nhoè sát máy. ","haplucchiare":"Nữ pháp sư chia đôi: nửa người trái áo trắng, nửa phải áo đen, hai tay kéo căng một sợi sáng giữa hai nửa đang tách; phía sau là bóng mờ của chính bà. ","hoamavuong":"Vua quỷ lửa bụng phệ, râu bằng lửa, cười hả hê, nâng chén rượu sôi sục; tiền cảnh: than hồng sát máy. ","hoanhanmay":"Ông Táo con mũm mĩm đội mũ cánh chuồn, áo thụng đỏ, cưỡi con cá chép vàng nhỏ, ngồi trên miệng chiếc kiềng ba chân đang đỏ lửa, ngước nhìn người xem, tay vung ra những đồng xu hồng","hoanhansokhai":"Chàng trai Tây Nguyên đóng khố, tóc dài buộc dây cườm, nhìn nghiêng đứng cạnh đống lửa trước nhà rông, hai tay giơ cao bó đuốc nứa lớn, lửa cháy loang theo cánh tay thành dải như t","hoasat":"Hoạ sĩ sát thủ cao gầy đứng trên đống tranh rách, cây bút lông khổng lồ như ngọn giáo nhỏ mực đỏ; tiền cảnh: vệt mực bắn sát máy. ","hoathuatnu":"Thiếu nữ phép lửa, đốm lửa nhỏ nhảy múa trên đầu ngón tay đặt trước môi như thổi, mắt phản chiếu lửa; tiền cảnh: tàn lửa nhoè. ","hoatinhnu":"Nàng tiên sao hoả nhỏ ngồi trên một viên than hồng, tóc lửa, ngước lên ước, tay chụm chờ ngôi sao rơi. ","hoavatnu":"Nữ pháp sư biến hoá vung tay về phía ống kính, quanh bàn tay các con vật đang hoá thành đồ vật và ngược lại (chim thành quạt, cá thành dao); tiền cảnh: lông chim bay sát máy. ","hongnutinhquai":"Nữ tinh quái tóc hồng quay lưng, ngoái lại nháy mắt, tung ba viên xúc xắc phát sáng qua vai; tiền cảnh: một viên xúc xắc nhoè sát máy. ","hongtam":"Cung thủ áo đỏ trái tim nghiêng người bắn liền ba mũi tên đầu hình trái tim, quân bài lá thấp rơi rách quanh chân. ","hongve":"Vệ binh áo đỏ mặt nạ đồng, cầm gậy trường côn chặn ngang, vững chãi; tiền cảnh: bụi đỏ sát chân. ","huyenconu":"Nữ ảo thuật máy nhìn nghiêng, nửa thân là bộ khung đồng hở lộ bánh răng, tay giơ chiếc gương phản chiếu ảo ảnh. ","huyetdichhangxom":"Gã hàng xóm hiền lành bụng phệ đứng trong ngõ, sau lưng mọc ra những xúc tu máu đỏ đang kéo các vật dụng sang bên; tiền cảnh: chậu cây vỡ sát máy. ","huyetmenu":"Nữ huyết thuật vươn tay về ống kính, những sợi máu đỏ bay từ nhiều hướng tụ vào lòng bàn tay; tiền cảnh: giọt máu nhoè sát máy. ","huyetsatvuong":"Vua huyết sát lùn béo ngồi trên rương vàng, cầm cây giáo hút máu nhỏ, ngước lên cười gian. ","huyettruonglao":"Gương mặt trưởng lão máu già nhăn nheo, đồng tử đỏ, râu bạc dài, nanh nhỏ, phía sau thấp thoáng bóng một con thú đỏ khổng lồ. ","hyvong":"Cô bé cầm đèn lồng giấy ông sao phát sáng, mắt sáng ngời, đứng giữa đêm tối; tiền cảnh: đom đóm nhoè. ","kechinhphatthoigian":"Kẻ chinh phạt thời gian mặc giáp đồng, áo choàng xanh, đứng trên những bánh răng đồng hồ khổng lồ, phía sau là bốn bóng của chính hắn ở bốn thời đại. ","kenuotsao":"Cự thần da xanh đen như bầu trời đêm, đầu trọc, bụng to như vò rượu, ngồi xổm trên đỉnh núi, há miệng thật rộng hút cả dải ngân hà và vầng trăng khuyết vào bụng, hai tay ôm những h","kenuotsaosokhai":"Kẻ nuốt sao đời đầu quay lưng, ngoái lại, áo choàng tím sẫm như bầu trời đêm, vai mang bình gốm đựng sao. ","kerinh":"Kẻ rình rập nhìn nghiêng, cúi thấp sau góc tường, khăn đen che mặt, tay cầm bộ dụng cụ mở khoá. ","kesanga":"Thiên thần sa ngã quỳ trên đất, đôi cánh trắng bị cháy xém, ngước nhìn lên trời, áo trắng nhuốm tro. ","kevocam":"Người đàn ông vô cảm mặc áo the xám, mặt không biểu cảm, đứng giữa những bóng người đang khóc mờ xung quanh. ","khinhdich":"Sinh vật nhầy nhỏ trong suốt bật nảy về phía ống kính như quả bóng, mặt cười. ","khoinguyenvuong":"Vua khởi nguyên trung niên đội vương miện hình mầm cây, đứng giữa vòng tròn đá cổ, tay chống quyền trượng gỗ có rễ. ","kiemquyen":"Võ sư kiếm–quyền trẻ, một nắm đấm và một thanh kiếm ngắn đặt chéo trước mặt, mắt sắc. ","kimcuongxa":"Rắn kim cương khổng lồ cuộn mình, vảy là kim cương lấp lánh, há miệng nanh ngọc. ","kydong":"Kỳ Đồng nhỏ tuổi ngồi trên lưng con cóc to, cầm cờ lệnh nhỏ, ngước lên cười. ","kysibaitu":"Kỵ sĩ áo choàng ghép từ những lá bài cũ quay lưng trên con ngựa xếp bằng giấy dó, ngoái lại qua vai, tay giơ một lá bài đang bốc cháy; tiền cảnh: lá bài rơi nhoè sát máy. ","kysichienxa":"Kỵ sĩ râu quai nón đứng trên chiến xa đồng chạm trống đồng do hai ngựa chiến kéo, bánh xe lao qua đá, một tay giơ cờ lệnh, tay kia ghì cương; tiền cảnh: đá văng và bụi sát máy. ","kysidaoquoc":"Kỵ sĩ đảo quốc nhìn nghiêng cưỡi con ngựa biển lớn vảy xanh, giáp làm từ vỏ ốc xà cừ, cầm ngọn giáo san hô, bọt sóng tung quanh. ","kysidichkhuyen":"Kỵ sĩ áo tơi rách cưỡi con chó săn khổng lồ lở loét phát lục, cả hai lao thẳng về phía ống kính, nhớt độc bắn ra; tiền cảnh: giọt nhớt nhoè sát máy. ","kysidoibao":"Kỵ sĩ đói khát gầy trơ xương, mặt hốc hác, cưỡi con ngựa gầy guộc giữa bão cát, giơ cái cân đồng rỗng; khung nghiêng tạo cảm giác lảo đảo, cát quất ngang. ","kysiho":"Nữ kỵ sĩ hồ nước đứng trên mặt hồ phẳng như gương, vừa rút thanh kiếm sáng từ nước lên, nước nhỏ giọt thành chuỗi, áo giáp vảy bạc; tiền cảnh: lá sen nhoè sát máy. ","kysinguyetyeu":"Kỵ sĩ yêu tinh trăng nhỏ bé, tai nhọn, cưỡi con thỏ trắng to lớn, ngước lên trăng tròn, tay cầm cây thương nhỏ bằng nhành quế. ","kysitudich":"Gương mặt kỵ sĩ chết đội mũ giáp rỉ sét sứt mẻ, nửa mặt da khô nửa đầu lâu, mắt lửa xanh, nhầy đen rỉ ra từ khe giáp. ","kysituduc":"Kỵ sĩ giáp đen cưỡi con quạ khổng lồ đang đáp xuống, đôi cánh đen xoè rộng, lông vũ rơi; tiền cảnh: lông quạ nhoè sát máy. ","kysivuottu":"Kỵ sĩ tử thần lao tới ống kính trên lưng ngựa xương, cánh tay phải là bộ móng vuốt xương dài giương ra; tiền cảnh: bụi xương vụn. ","langthan":"Thần sói lông bạc khổng lồ nhìn nghiêng, đứng trên đỉnh đồi đá, ngửa cổ hú về trăng tròn, gió thổi lông dựng. ","lanvuong":"Vua thợ lặn nhỏ con đội mũ lặn đồng tròn có kính, ngồi trên vỏ sò khổng lồ, ngước lên, bong bóng bay quanh, tay cầm ngọc trai. ","laonhen":"Lão nhện râu dài trắng, có tám cánh tay gầy, ngồi trên khung tơ đan dở, các tay cùng lúc đan sợi tơ bạc; tiền cảnh: sợi tơ nhoè sát máy. ","linhchindau":"Người lính đang hoá thành rắn chín đầu, thân trên còn áo giáp, từ cổ vươn ra chín đầu rắn chĩa mọi hướng; khung nghiêng hỗn loạn. ","linhdondoc":"Người lính đơn độc quay lưng giữa chiến trường hoang, ngoái lại qua vai, ngọn giáo gãy, lá cờ rách cắm bên cạnh; tiền cảnh: cỏ khô nhoè. ","linhduoc":"Lương y già cao lớn, râu dài, cầm bình gốm men lam phát sáng xanh lục, thảo dược và lá cây bay xoáy quanh. ","loantuong":"Gương mặt vị tướng loạn trí tóc rối, mũ giáp méo lệch, cười điên dại, vết máu trên má, mắt mở to. ","longbattu":"Rồng bất tử bằng xương cuộn mình bay lên, lửa xanh cháy trong lồng ngực, móng vuốt cào không khí. ","longuclua":"Võ sĩ cởi trần, lồng ngực là cửa lò đồng đang mở cháy rực, tung cú đấm lửa thẳng vào ống kính; tiền cảnh: tàn lửa. ","lucac":"Sáu tiểu quỷ đủ màu đang trèo lên nhau hợp thành một ác quỷ khổng lồ, khung nghiêng hỗn loạn, mặt quỷ nhe răng. ","matocvutru":"Ma tốc độ vũ trụ nhìn nghiêng, cơ thể như khói ánh sao, lướt nhanh để lại vệt sáng dài giữa các vì sao. ","mauhau":"Mẫu hậu đẫy đà phúc hậu, vương miện vàng ngọc, ôm hài nhi phát sáng trong lòng, áo đỏ thêu phượng; tiền cảnh: cánh hoa sen. ","maynuotthoigian":"Đám mây khổng lồ có khuôn mặt và cái miệng há rộng, đang nuốt những chiếc đồng hồ mặt trời và đồng hồ cát. ","muoikiepnu":"Thiếu nữ đứng giữa, quanh cô là mười bóng mờ của chính cô từ bé đến già xếp thành vòng, cô ngước lên. ","namtuocmatna":"Gương mặt quý tộc đeo mặt nạ tuồng nửa đỏ nửa trắng, mắt thật lộ ra sau mặt nạ, mũ cánh chuồn. ","nangtocdo":"Nàng tóc đỏ rực chạy lướt về phía ống kính, tóc bay như lửa, áo bà ba xanh lá; tiền cảnh: cánh hoa bay. ","ngansat":"Sát thủ bạc gầy quay lưng, ngoái lại, kẹp ba phi tiêu bạc giữa các ngón tay, khăn che mặt bạc. ","nghichtuvuong":"Đạo sĩ áo nâu đất râu dài đứng trên một tảng đá bay, phất mạnh tay áo khiến ba tảng đá núi phủ rêu cùng bay vụt sang ba hướng, trên mỗi tảng đá là một chiến binh tí hon; khung nghi","nguyetlong":"Rồng trăng nhìn nghiêng, thân uốn quanh vầng trăng tròn, vảy bạc lấp lánh, râu dài. ","nguyetlongnu":"Thiếu nữ rồng trăng nhỏ nhắn ngồi trên chiếc sừng của con rồng bạc đang cuộn bên dưới, ngước nhìn trăng, sừng nhỏ trên trán, áo trắng bạc; tiền cảnh: vảy rồng lấp lánh nhoè sát máy","nguyetthach":"Khối đá trăng khổng lồ hình người ngồi tĩnh toạ, thân đá có những hõm phát sáng xanh lam như mặt trăng, rêu bạc phủ vai; tiền cảnh: đá vụn sát máy. ","nguyetthan":"Thần mặt trăng nhìn nghiêng, ông lão cao gầy râu bạc chấm đất, tay nâng chiếc đèn lồng hình trăng khuyết, áo choàng xanh đêm có hoa văn mây. ","nhaihinh":"Sinh vật nhại hình đang biến dạng giữa chừng: nửa trái là một bà lão bán hàng, nửa phải là con tắc kè xanh, khung nghiêng; tiền cảnh: vảy rơi nhoè. ","nhannhenquai":"Quỷ sứ sáu tay da chàm thẫm, mặt vẽ tuồng xanh đỏ, các tay cầm chuỳ, xích, đinh ba, mõ, đèn lồng, lá bùa, lao về phía ống kính, hai tay trước vươn ra chộp lấy một chiến binh tí hon","nhenbongdem":"Nữ nhện bóng đêm quay lưng bò trên vách tường, ngoái lại qua vai, đôi mắt đỏ, áo đen như mực, tám chân đen mảnh sau lưng. ","nhencogiap":"Cậu bé thợ mộc tóc ba chỏm, áo nâu xắn tay, bút than giắt tai, đang ngồi gõ búa lắp dở một con giáp tám chân nhỏ bằng tre và đồng trên bàn thợ, phoi bào bay; tiền cảnh: đục bào nho","nhendotham":"Hiệp khách áo the đen tuyền, đai lưng đỏ son, đội nón chóp, quay lưng 3/4 rồi ngoái lại qua vai; từ người hắn tách ra một bóng phân thân giống hệt bằng mực nhạt đang bước sang hướn","nhenhacdich":"Yêu nhện mực khổng lồ, thân và tám chân như những nét mực tàu loang, trên lưng mang chiếc mặt nạ tuồng đen trắng, đứng trên mái đình cong, những sợi mực nhỏ giọt xuống sân gạch. ","nhenlong":"Con nhện lông xù to bằng con mèo, lông nâu vàng mềm, ngồi trong tổ, tám mắt tròn to ngước nhìn lên, dễ thương. ","nhenngaymoi":"Thiếu nữ áo tứ thân hồng đào, khăn mỏ quạ trắng, nhìn nghiêng khi đứng nhón chân trên mũi thuyền nan, hai tay tung dải lụa hồng thật dài uốn thành vòng cung như ráng trời bình minh","nhennoiloan":"Gương mặt chàng hát xẩm ngổ ngáo, tóc rối buộc khăn rằn lệch, một bên má vẽ vạch chàm, miệng đang gào hát, cây đàn nguyệt sứt quai vác ngang vai, mắt loé tinh nghịch. ","nhennon":"Chú nhện non bé xíu nhìn nghiêng trên chiếc lá, nhả sợi tơ đầu tiên bay theo gió. ","nhenthuongdang":"Vị nguyên soái trung niên mặc giáp vảy vàng kim kiểu Đại Việt, mũ trụ chóp nhọn tua đỏ, áo choàng gấm, đứng trên tường thành; sau lưng tám ngọn kỳ lệnh vàng cắm xoè thành hình nan ","nuchienbathu":"Nữ chiến binh bất tử, vết sẹo khắp người, cầm hai thanh đao chéo trước ngực, ánh mắt bình thản; tiền cảnh: lá vàng rơi. ","nuco":"Gương mặt nữ cơ khí sứ trắng như búp bê, đôi mắt thuỷ tinh xanh, vết nứt mảnh trên má, bánh răng nhỏ hiện sau gáy. ","nuhoanghonmang":"Nữ hoàng hỗn mang ngồi lệch trên ngai, vương miện lệch, xung quanh các vật thể ngẫu nhiên bay lộn xộn (ấm trà, con cá, cái ô). ","nuhongtam":"Nữ xạ thủ áo đỏ bắn liên tiếp những mũi tên đỏ về phía ống kính. ","nuloimienvien":"Bà Pháp Lôi trong Tứ Pháp: nữ thần trung niên phúc hậu đội mũ tỳ lư vàng, áo cà sa đỏ thắm phủ hoa văn mây, ngồi trên toà sen, một tay cầm chiếc khánh đồng phóng tia sét bạc, tay k","nuthantien":"Thiếu nữ cung thủ ngồi trên cành cây, ống tên tre sau lưng, ngước lên cười, kẹp một mũi tên trên môi. ","nuthuantuong":"Nữ tướng tóc tết vấn khăn, mặc giáp vảy trắng bạc, quỳ một gối, hai tay dựng tấm khiên chữ nhật cao bằng gỗ lim viền vàng kim chạm rồng thời Lý, che cho ba người lính nhỏ nấp phía ","phanquanthiengioi":"Phán quan trời khổng lồ ngồi trên mây, tay cầm sổ thiên mệnh và bút lông, nhìn xuống. ","phaodaimay":"Pháo đài máy di động trên bốn chân cơ khí, nhiều nòng pháo đồng chĩa ra, khói phụt. ","phaohoanganha":"Thiếu niên ném quả pháo hoa bạc về phía ống kính, pháo nổ thành chòm sao. ","phapsudaomong":"Pháp sư mộng mơ lùn béo ngồi trên đám mây gối, ôm cuốn sổ vẽ bản đồ giấc mơ, ngước lên. ","phapsugia":"Gương mặt pháp sư già râu dài trắng, mắt kính tròn, cái nón chóp đầy bùa, mỉm cười bí ẩn. ","phatuongsinhlinh":"Linh hồn phá tướng nhìn nghiêng, chiến binh sương khói, giơ chuỳ lên định đập. ","phitieuhoi":"Nữ sát thủ ném chiếc phi tiêu hình trăng khuyết về phía ống kính, phi tiêu xoay tròn. ","phiungtre":"Chàng trai trẻ có cánh chim ưng sau lưng, nhìn nghiêng khi đang bay lượn. ","phonglinhnu":"Nữ phong linh xoay tròn giữa cơn gió, chuông gió đồng treo quanh người kêu leng keng. ","phuthuytre":"Phù thuỷ trẻ áo xanh lá, cầm cây chổi rơm, mỉm cười, quả cầu phép bay quanh. ","quyensuthaphoan":"Võ thánh trung niên cởi trần, quần võ đen thắt đai vàng, đứng trên đỉnh núi đá, một tay giơ cao chiếc vòng càn khôn bằng vàng duy nhất đang xoay toả sáng, tay kia thủ thế, sau lưng","saotrongdau":"Gương mặt cô gái có bầu trời sao bên trong hộp sọ trong suốt, mắt nhắm. ","sautham":"Người đàn ông trung niên u sầu ngồi bó gối trên bậc đá dưới mưa, ngước lên trời xám, áo tơi lá rách, những giọt mưa đọng thành vệt sáng; tiền cảnh: giọt mưa nhoè sát máy. ","soidomienvien":"Sói đỏ khổng lồ lông như lửa lao thẳng về phía ống kính, nanh nhe, móng trước giương, đất bắn tung; tiền cảnh: đất đá nhoè. ","songsinhtamlinh":"Hai chị em sinh đôi đứng tựa lưng vào nhau, một người áo lam một người áo hồng, người phía trước ngoái lại qua vai, sợi chỉ sáng nối hai bàn tay. ","tamkiemmienvien":"Nữ kiếm khách áo tứ thân hồng sen, tóc búi cài trâm, nhìn nghiêng, đứng trên lá sen giữa đầm, dựng thẳng trước mặt thanh kiếm có chuôi hình búp sen, lưỡi kiếm toả ra những cánh sen","tamlinhtu":"Thầy tâm linh cao gầy áo dài trắng, đứng giữa nghĩa địa, tay xoè ra, những linh hồn nhỏ như đom đóm bay vào lòng bàn tay. ","tammanu":"Nữ tâm ma bò ra từ một vũng bóng tối, tóc đen dài che kín mặt, tay gầy bám đất, khung nghiêng rùng rợn; tiền cảnh: tóc nhoè sát máy. ","tamtudo":"Gương mặt người đàn ông có ba con mắt đỏ, con mắt giữa trán đang mở, đường gân đỏ toả ra, môi mím. ","taysatnu":"Nữ thợ rèn có cánh tay phải bằng sắt rèn, tay trái cầm búa, đứng bên đe đang rèn một lưỡi đao đỏ rực; tiền cảnh: tia lửa. ","thachlucnu":"Nữ lực sĩ đá cao lớn, da là đá xám vân rạn, hai tay nâng một cột đá lên quá đầu, mặt kiên định. ","thachquaisokhai":"Tượng đá ông tổ cổ xưa khổng lồ như tượng quan hầu lăng mộ, đá xanh phong rêu, mũ cánh chuồn bằng đá, hai tay cầm hốt đá, đang bước ra khỏi bệ, mảnh bệ đá vỡ tung quanh chân. ","thanai":"Ông Tơ râu tóc bạc phơ, má hồng, áo the hồng đào, ngồi dưới gốc đa dưới trăng, tay se những sợi chỉ hồng buộc nối hai chiếc vòng cỏ, cuộn chỉ đỏ lăn bên chân, ngước nhìn người xem ","thandong":"Thần đồng tóc trái đào quay lưng đứng trước tấm bảng chữ Hán khổng lồ, ngoái lại cười, tay cầm bút lông. ","thantocnu":"Nữ thần tốc chạy như bay về phía ống kính, chân để lại vệt lửa vàng, tóc bay thẳng ra sau; tiền cảnh: bụi xoáy. ","thetdich":"Ma nữ gào khóc nhìn nghiêng, tóc dài xanh rêu bay ngược, miệng há thét tạo những vòng sóng âm đồng tâm loang ra như mặt nước, vạt áo trắng rách hoá thành khói xanh. ","thiemnu":"Nữ ảo ảnh xuất hiện thành ba hình nhoè ở ba vị trí khác nhau như đang dịch chuyển tức thời, khung nghiêng. ","thienngaden":"Thiên nga đen duyên dáng nhìn nghiêng, cổ cong, đang múa trên mặt hồ đêm, cánh xoè. ","thienthantimkiem":"Thiên thần tìm kiếm khổng lồ có tấm áo choàng như bầu trời sao, mặt ẩn sau mũ trùm, tay giơ ngọn đèn rọi xuống. ","thietaiquoc":"Người lính hộ quốc thời Trần mặc giáp da trâu sơn then đen, đội nón dấu, cánh tay buộc khăn chàm, quay lưng 3/4 rồi ngoái lại qua vai, vác ngọn giáo dài treo lá cờ đuôi nheo xanh l","thietgiapthuongdang":"Võ tướng đứng vững trên mỏm đá, khoác bộ giáp lá đồng xanh gỉ xếp vảy cá, ngực mang tấm hộ tâm kính hình mặt trời trống đồng nhiều cánh đang toả nắng, mũ trụ cắm lông chim lạc, hai","thuanung":"Chú chim ưng nhỏ đậu trên tấm khiên tròn lớn, ngước lên, lông vũ xù. ","thukydungcam":"Gương mặt cô thư ký gan dạ đeo kính tròn, tóc búi, kẹp bút lông sau tai, ánh mắt kiên quyết. ","thuyhau":"Nữ hoàng nước đứng trên ngọn sóng xoắn ốc, vương miện san hô, quyền trượng ba mũi, khung nghiêng. ","thuynu":"Thiếu nữ làm từ nước nhìn nghiêng, tóc chảy như thác, đứng trên mặt hồ. ","tienhoasu":"Tiến hoá sư cao gầy đứng giữa phòng thí nghiệm, tay cầm ống nghiệm phát sáng, phía sau là các bộ xương thú đang biến đổi. ","tiensigamma":"Anh thư sinh gầy khăn đóng áo dài the xanh chàm, kính tròn gọng đồi mồi văng khỏi mặt, quyển sách bung trang; nửa người bên phải đang phình to thành cơ bắp màu đồng hun như tượng h","tieukhonglo":"Người khổng lồ thu nhỏ ngồi xổm trên nắp hũ, ngước nhìn lên, cười. ","tieulong":"Rồng con xanh ngọc mũm mĩm cuộn trên tảng đá rêu, đầu ngẩng lên phun một đốm lửa nhỏ cam, sừng non mới nhú, đuôi quấn quanh viên ngọc; tiền cảnh: lá dương xỉ nhoè sát máy. ","tieuthu":"Gương mặt xạ thủ trung niên áp má vào báng nỏ, một mắt nheo nhìn qua ống ngắm bằng đồng, mắt kia mở to, mồ hôi trên thái dương, khăn quấn đầu nâu. ","tinhchuathaiduong":"Tinh chúa mặt trời cao lớn, áo choàng đỏ cam như lửa, đứng giữa một vầng mặt trời khổng lồ hình trống đồng toả tia, hai tay dang rộng; tiền cảnh: tàn lửa sát máy. ","toclua":"Thiếu nữ tóc lửa dài quay lưng, ngoái lại qua vai với ánh mắt buồn, mái tóc đang cháy nhẹ thành ngọn lửa đỏ cam bay lên, áo nâu giản dị. ","toctu":"Cậu bé tốc độ nhỏ con chạy lao thẳng về phía ống kính, chân mờ thành vệt, áo vàng phấp phới, tóc dựng, miệng cười toe; tiền cảnh: bụi đường cuộn lên. ","trinu":"Cô bé thông thái đeo kính tròn ngồi xếp bằng giữa những chồng sách cao ngất, quyển sách mở trên đùi, ngước nhìn lên người xem, bút lông giắt tóc. ","trolymay":"Người hầu bằng gỗ mít thô mộc như tượng nhà mồ, khớp tay chân buộc dây mây, mặt khắc nụ cười ngây ngô, bốn cánh tay gỗ cầm khay trà, chổi rơm, quạt nan và đèn lồng, chạy lao về phí","trumthanhpho":"Ông bá hộ béo tròn áo the đen, khăn xếp, ngồi chễm chệ trên sập gụ khảm xà cừ giữa sân gạch, phe phẩy quạt giấy, nhẫn vàng đầy tay, ngước nhìn người xem vênh váo, xung quanh thóc v","trungphatcogiap":"Cỗ giáp gỗ lim sơn then của quan coi ngục, ngực chạm mặt hổ phù đỏ son, trên vai gắn khẩu thần công đồng nhỏ, hai tay cầm cái gông gỗ và roi mây; khung nghiêng; tiền cảnh: dây xích","tuongquan":"Vị tướng quân trung niên râu ngắn, giáp Đại Việt đỏ đồng, tay đặt lên chuôi kiếm, tay kia chỉ về phía trước ra lệnh, khăn đỏ bay; tiền cảnh: ngọn cờ nhoè. ","tuthanmienvien":"Bạch Vô Thường cao lêu nghêu mặc áo tang trắng, đội mũ cao chóp vuông trắng trơn, mặt trắng bệch với nụ cười hiền kỳ lạ, tay cầm lá phướn trắng và sợi xích hồn, bước thẳng về phía ","virutcosinh":"Gương mặt sinh vật cơ khí bị nhiễm: nửa mặt kim loại đồng, nửa mặt mọc những sợi tơ xanh lục như nấm lan dần, mắt đèn đỏ chập chờn. ","vouyamdia":"Chiến binh bịt mắt quay lưng giữa âm phủ, ngoái lại qua vai, sau lưng là ba con quỷ nhỏ đang bám theo, dải băng đỏ trên mắt. ","vuathoigian":"Vua thời gian nhìn nghiêng, ông lão vương miện bánh xe đồng hồ, chống trượng hình kim đồng hồ, áo bào thêu cung hoàng đạo, đồng hồ cát lơ lửng phía trước. ","vuatienhac":"Vua tiên hắc ám nhỏ bé đứng trên chiếc nấm đen, cánh chuồn chuồn đen, vương miện gai, ngước lên cười gian, tay cầm cây trượng nhánh khô. ","vukhih":"Pho tượng hộ pháp bằng gang đen cao lớn vừa thức dậy giữa sân chùa đổ nát, mặt tượng trợn mắt, đôi mắt là hai hòn than hồng, một tay cầm chày kim cương, tay kia cầm cây giản sắt, r","vukhix":"Thợ săn hổ người Mường vạm vỡ, tóc búi, áo chàm cộc tay, hai bàn tay đeo bao da gắn năm móng hổ đồng cong ngắn ôm sát đầu ngón, nhìn nghiêng khom người rình mồi giữa lau sậy, mắt h","vuongbathu":"Vương bất hủ ngồi trên ngai đá trắng giữa trời, vương miện ánh sáng, áo choàng xanh ngọc phủ bậc thềm, nhìn xuống bình thản. ","xacdao":"Xác sống đao phủ cầm đại đao gỉ, đầu nghiêng, áo rách, khung nghiêng, phía sau thấp thoáng bầy xác; tiền cảnh: bàn tay xác nhoè sát máy. ","xacdeo":"Xác sống dẻo như cao su ngồi bệt dưới đất, tay chân kéo dài uốn éo, ngước lên cười ngớ ngẩn. ","xachacdich":"Xác cương thi mặc áo tấc đen rách, khăn vấn bạc màu, đứng chụm chân trên nấm mộ, nửa người bị bóng mực đen quấn lấy thành những dải lụa đen bay phần phật, ngước nhìn người xem với ","xachacmieu":"Xác mèo đen gầy trơ xương nhìn nghiêng, đứng trên tường đổ, đuôi dài cong, mắt lửa xanh. ","xachongphuthuy":"Xác bà đồng già trong bộ áo hầu đồng sặc sỡ đã bạc màu rách tả tơi, khăn chầu đỏ phủ đầu, vung quạt giấy và bó hương cháy về phía ống kính, dưới đất những bàn tay xương trồi lên th","xactinhquang":"Xác nữ tinh quang tóc trắng, mắt sao, lao về phía ống kính, tay toả luồng sáng sao lạnh. ","yeuhau":"Yêu hậu cao lớn đội vương miện sừng, áo đen đỏ, tay nâng một chiếc bình đựng linh hồn đang bay ra. ","huyettinhquyen":"Gương mặt võ sư trung niên tóc búi, râu quai nón, khăn đầu rìu nâu, răng cắn chặt đầu dải vải điều đang quấn quanh cổ tay giơ trước cằm, đôi mắt trầm như than đỏ, phía sau là vầng ","phankysi":"Kỵ sĩ phản trắc áo giáp đen viền đỏ quay lưng, ngoái lại cười khẩy, tay giấu con dao sau lưng. ","vuarutkiem":"Vị vua trẻ tóc búi, áo giao lĩnh trắng viền đỏ, hai tay đang rút thanh kiếm sáng ra khỏi tảng đá phủ rêu, ánh sáng trắng bùng lên thành cột, đá nứt quanh chân; tiền cảnh: mảnh đá v","xactantinh":"Xác sống nhỏ con đội chiếc mũ chóp có ngôi sao đang tắt, ngồi trên nấm mộ, ngước lên người xem với vẻ ngơ ngác, quanh vai là bụi sao mờ rơi. ","anhcothuat":"Pháp sư bóng cổ thuật áo đen đứng giữa vòng gương đồng lơ lửng, mỗi gương phản chiếu ông ở một tư thế khác, khung nghiêng; tiền cảnh: mảnh gương vỡ nhoè sát máy. ","aoanh":"Ảo ảnh của ảo thuật gia nhìn nghiêng, đội mũ chóp đen, tay cầm quạt giấy che nửa mặt, nửa thân sau đang tan thành bụi sáng hồng bay đi. ","bansaota":"Bản sao tà sư bằng mực đen đặc, dáng người cao gầy giống hệt pháp sư nhưng mặt chưa có đường nét, mực nhỏ giọt từ đầu ngón tay, đôi mắt là hai đốm đỏ; tiền cảnh: vệt mực bắn sát má","baoco":"Bạo cơ: người máy chiến đấu khổng lồ bằng sắt xám và sơn đỏ, giáp vai dày như tường thành, mắt đơn đỏ rực, một tay giơ cao tạo thành nòng pháo; tiền cảnh: khói và tàn sắt sát máy. ","baocohauthe":"Gương mặt người máy bạo cơ đời sau: mặt nạ đồng đúc hình người có nét hiền nhưng mắt đỏ lạnh, vết hàn trên má, dây điện thò ra sau cổ. ","bayxac":"Một bầy xác sống tí hon đủ kiểu (đội nón, cầm cuốc, mặc yếm) chen chúc chồng lên nhau thành đống, tất cả ngước nhìn lên người xem với vẻ ngớ ngẩn. ","bienhinhthuat":"Cuộn bùa biến hình bằng giấy vàng tung thẳng về phía ống kính, trong làn khói xanh một con ếch đang hoá thành chàng trai giữa chừng; tiền cảnh: bùa giấy nhoè. ","buasam":"Chiếc búa sấm bảo vật bằng đồng chạm hoa văn trống đồng lơ lửng giữa không trung, cán quấn da, sét bạc quấn quanh đầu búa, mây bão xoáy phía dưới. ","chanthutienhoa":"Siêu chấn thủ vạm vỡ đeo găng đá, tung cú đấm về phía ống kính tạo vòng sóng chấn động làm không khí gợn méo, đất đá dưới chân vỡ tung; tiền cảnh: đá bay nhoè. ","chopcothuat":"Cuộn bùa sấm cổ thuật bằng lụa vàng đang mở tung giữa không trung, tia chớp bạc phóng ra từ dòng chữ cổ, khung nghiêng; tiền cảnh: tàn giấy cháy. ","cogiapnhen":"Bộ giáp nhện cơ khí bằng đồng đỏ có tám chân khớp nối, buồng lái hở trống như đang chờ chủ, đậu trên mái ngói; nhìn từ trên xuống. ","cucquanggau":"Gấu cực quang khổng lồ lông trắng như tuyết, trên lưng chảy dải sáng xanh lục hồng như cực quang, đứng hai chân gầm lên giữa đồng băng. ","cucquangung":"Chim ưng cực quang nhìn nghiêng đang sải cánh lướt ngang, lông cánh trong suốt như băng, dải sáng xanh lục hồng chảy dọc đuôi. ","cuongnhantienhoa":"Siêu cuồng nhân tiến hoá khổng lồ, da xanh xám với những mảng giáp xương mọc ra, gầm lên ngửa cổ, hai nắm tay to như cối đá; tiền cảnh: đá văng sát máy. ","cuthudotham":"Cự thú đỏ thẫm bốn chân như con tê giác lai hổ, lao thẳng về phía ống kính, sừng nhọn phía trước, bờm lửa đỏ; tiền cảnh: bụi đỏ cuộn. ","da":"Một hòn đá cuội xám to bằng nắm tay, phủ rêu xanh, có khuôn mặt cười khắc nguệch ngoạc, nằm trên bãi cỏ, nhìn từ trên xuống, vài con kiến bò quanh. ","dahon":"Viên đá hồn màu cam nhạt nhốt trong chiếc lồng đồng nhỏ lơ lửng, khói linh hồn trắng bay ra qua khe lồng, khung nghiêng. ","daibay":"Chiếc đai bay bằng da thêu hoa văn trống đồng, có đôi cánh chim nhỏ hai bên, nhìn nghiêng khi đang bay vút ngang, vệt gió phía sau. ","daidoan":"Cuộn đại đồ án khổng lồ bằng giấy dó mở tung lơ lửng, trên đó bản vẽ một cỗ máy phát sáng xanh lam đang nổi lên thành hình ba chiều; nhìn từ dưới lên. ","dakhong":"Viên đá không gian thô màu xanh lam nằm trong hốc đá núi vừa bị đập vỡ, ánh lam rò ra qua vết nứt, nhìn từ trên xuống. ","dakhonggian":"Khối lập phương xanh lam phát sáng khảm trên đỉnh một tháp đồng nhỏ, mở ra cánh cổng không gian xoáy lao về phía ống kính; tiền cảnh: mảnh không gian vỡ như kính. ","dalinhhon":"Viên đá linh hồn màu cam khảm trên mặt dây chuyền bằng xương, treo lơ lửng giữa không trung, quanh nó các linh hồn mờ xoay vòng; nhìn từ dưới lên. ","daluc":"Viên đá lực màu đỏ thô to bằng quả trứng đặt trên chiếc đe đồng, toả nhiệt làm không khí méo đi, tia lửa nhỏ bắn quanh. ","daodo":"Đạo đồ: chiếc la bàn phong thuỷ bằng gỗ sơn mài lơ lửng, nhìn từ phía sau nghiêng 3/4, kim la bàn phát sáng chỉ về phía xa, các vòng chữ xoay. ","dasucmanh":"Viên đá sức mạnh đỏ khảm trên đầu chiếc búa chiến khổng lồ cắm thẳng xuống đất, năng lượng đỏ nứt toác mặt đất quanh; nhìn từ dưới lên. ","datam":"Viên đá tâm màu vàng thô đặt trên đĩa đồng của bàn thờ, nén nhang toả khói quanh, nhìn từ trên xuống. ","datamtri":"Cận cảnh viên đá tâm trí vàng khảm trên đầu cây trượng, sóng tâm trí vàng toả ra từng vòng, phản chiếu một con mắt bên trong viên đá. ","dathoi":"Viên đá thời màu xanh lục thô nằm trong chiếc đồng hồ cát bằng tre, cát vàng chảy ngược quanh viên đá, khung nghiêng. ","dathoigian":"Bùa hộ mệnh hình con mắt bằng đồng nhìn nghiêng, mở ra lộ viên đá lục bên trong, các vòng ấn chú lục xoay quanh. ","dathuc":"Viên đá thực màu đỏ son thô đang tan chảy thành chất lỏng bắn về phía ống kính; tiền cảnh: giọt đỏ nhoè sát máy. ","dathuctai":"Dòng chất lỏng đỏ son xoáy quanh một khối cầu nhỏ, biến đổi cảnh vật xung quanh thành những mảnh méo mó; nhìn từ dưới lên. ","docnhantienhoa":"Gương mặt siêu độc nhãn: một con mắt lớn duy nhất giữa trán phát tia đỏ, mặt nạ đồng che nửa dưới. ","gangchandong":"Đôi găng chấn động bằng đồng lơ lửng, đập vào nhau tạo vòng sóng chấn động lao về phía ống kính. ","giaohutmau":"Ngọn giáo hút máu đỏ thẫm cắm xuống đất, dây máu đỏ quấn quanh cán, nhìn từ trên xuống. ","giocothuat":"Cuộn bùa gió cổ thuật mở ra, gió xoáy trắng cuốn lá bay, khung nghiêng. ","hackiem":"Thanh kiếm đen bất hoại cắm thẳng đứng trên tảng đá, lưỡi kiếm có vết nứt đỏ phát sáng, nhìn từ dưới lên. ","hienthanvangioi":"Hiện thân vạn giới: bóng người cao gầy nhìn nghiêng, cơ thể trong suốt chứa nhiều thế giới thu nhỏ (núi, biển, thành quách) xoay bên trong, tay nâng một tinh cầu. ","ho":"Con hổ vằn lớn lao thẳng về phía ống kính, há miệng gầm, móng vuốt giương; tiền cảnh: cỏ bay. ","hukhong":"Hư không: lỗ xoáy đen khổng lồ lơ lửng, nuốt ánh sáng, mép xoáy có viền trắng bạc, đá vụn và lá bị hút vào trong; nhìn từ dưới lên. ","khientuong":"Tấm khiên tướng tròn bằng đồng chạm trống đồng nằm nghiêng trên nền đất đá, nhìn từ trên xuống, đầy vết kiếm chém nhưng không vỡ, một mũi tên gãy cắm vào. ","khoibang":"Khối băng lập phương trong suốt, bên trong đóng băng một bông sen, sương lạnh toả. ","kiemphuchy":"Thanh kiếm phục hy cổ lưỡi mảnh phát sáng xanh ngọc, lơ lửng thẳng đứng trên bệ đá chạm rồng, dây tua đỏ ở chuôi bay nhẹ; nhìn từ dưới lên. ","kientho":"Robot thợ nhỏ bằng gỗ và đồng hình con kiến, đeo kính bảo hộ, ngồi trên đống dụng cụ (búa, đục, ốc vít), ngước lên người xem. ","linhmuadong":"Lính mùa đông áo bông dày, mũ lông, má đỏ, vung ngọn giáo băng đâm về phía ống kính, tuyết bay; tiền cảnh: bông tuyết nhoè. ","luahacdiem":"Ngọn lửa đen kỳ dị bùng lên thành hình xoắn ốc có khuôn mặt quỷ ẩn bên trong, viền lửa lục, khung nghiêng; tiền cảnh: tàn tro đen. ","manhkiemquy":"Cận cảnh mảnh kiếm quỷ gãy màu đỏ thẫm, khắc con mắt quỷ đang mở trên lưỡi, quấn dải vải đen rách. ","matthethientuyen":"Kẻ được chọn của mạt thế cao lớn mặc giáp đen gai, áo choàng rách, đứng trên đống đổ nát giữa trời đỏ, tay cầm thanh đại kiếm; nhìn từ dưới lên. ","maybaycon":"Chiếc máy bay con bằng tre và giấy dó sơn đỏ, có cánh quạt gỗ, nhìn nghiêng khi đang bay lượn, dải đuôi vải bay. ","mintuxa":"Quả mìn từ xa hình trống đồng nhỏ nằm vùi trong đất, nhìn từ trên xuống, kim chỉ đang nhấp nháy đỏ, dây ngòi đồng vươn ra; tiền cảnh: sỏi nhoè sát máy. ","nghithuctrieuhoii":"Bước một của nghi thức triệu hồi: vòng ấn chú lửa đầu tiên bùng lên trên đất, một bàn tay đen trồi lên vươn về phía ống kính; tiền cảnh: tro bay. ","nghithuctrieuhoiii":"Bước hai của nghi thức: ba vòng ấn chú lửa chồng lên nhau, khói đen xoáy thành hình đầu quỷ đang hiện dần, khung nghiêng. ","nghithuctrieuhoiiii":"Bước ba của nghi thức: cột lửa đen bốc thẳng lên trời từ vòng ấn chú, bóng một chúa quỷ khổng lồ hiện ra trong lửa; nhìn từ dưới lên. ","nguyetthanbannguyet":"Thần bán nguyệt nhìn nghiêng, nửa người sáng bạc nửa người chìm trong bóng tối, đội vương miện trăng khuyết, tay cầm chiếc liềm trăng. ","nguyetthantrangtron":"Thần trăng tròn uy nghi lơ lửng trước vầng trăng tròn khổng lồ, áo choàng bạc trải rộng, hai tay mở, những linh hồn bay lên về phía trăng; nhìn từ dưới lên. ","nuhondoc":"Cận cảnh đôi môi đỏ son đang thổi ra một làn khói độc xanh lục hình trái tim, chiếc khăn lụa trắng che nửa mặt dưới. ","ongnutienhoa":"Siêu ong nữ nhỏ xíu mặc giáp vỏ vàng sọc đen, cánh trong suốt, đứng trên nhị bông hoa bí, ngước lên giương kim chích như ngọn giáo. ","quaituongtienhoa":"Siêu quái tướng tiến hoá khổng lồ da xanh rêu sần sùi, sừng gai trên vai, cầm chuỳ gai, đứng gầm trên vách đá; nhìn từ dưới lên. ","quy":"Con quỷ nhỏ đỏ, sừng cong, đuôi nhọn, nhảy xổ về phía ống kính, cười toe, móng vuốt giương; tiền cảnh: tàn lửa bắn. ","riubao":"Chiếc rìu bão bằng đồng lưỡi đôi lơ lửng giữa cơn bão, sét xanh quấn cán, khung nghiêng, mây đen xoáy. ","soc":"Chú sóc nâu nhỏ ôm hạt dẻ ngồi trên cành, đuôi xù, ngước lên người xem với mắt tròn. ","taymaynutienhoa":"Siêu tay máy nữ: thiếu nữ có đôi cánh tay máy đồng to quá khổ, khớp nối hở, đứng thẳng tự tin, hơi nước phụt ở khuỷu. ","tenaxit":"Mũi tên axit đầu xanh lục nhỏ giọt bay thẳng về phía ống kính, vệt khói độc phía sau. ","tenmoc":"Mũi tên móc câu nhìn nghiêng đang bay, kéo theo sợi dây thừng dài. ","tenthuong":"Một bó mũi tên tre thường cắm trong ống tên gỗ, khung nghiêng, lông đuôi trắng. ","tenthuphong":"Mũi tên thu phóng nằm trên nền đất, nhìn từ trên xuống, đầu tên có nhiều vòng phóng to thu nhỏ. ","thachquaitienhoa":"Siêu thạch quái tiến hoá: khổng lồ đá xám có mạch tinh thể lam, giơ hai tay đập xuống; nhìn từ dưới lên. ","thanhkiem":"Thánh kiếm sáng trắng cắm xiên trên đỉnh núi, tia sáng vàng toả ra, khung nghiêng. ","thaphoan":"Cận cảnh mười chiếc vòng bằng đồng xếp chồng trên cổ tay, mỗi vòng khắc một ký tự cổ phát sáng màu khác nhau. ","thaphoankhaimo":"Mười chiếc vòng đồng đã khai mở lơ lửng thành vòng tròn quanh một nắm tay giơ cao, mỗi vòng phát sáng rực. ","thoicothuat":"Cuộn bùa thời gian cổ thuật mở tung, các con số và kim đồng hồ bay ra xoáy, khung nghiêng. ","thuhoang":"Lính thuê lực lưỡng đeo khăn rằn, vác thanh mã tấu trên vai, nhìn thẳng tự tin. ","trungcon":"Ba con trùng non xanh ngọc mũm mĩm chen nhau trong tổ lá, ngước nhìn lên với đôi mắt to. ","vetcandoc":"Cận cảnh vết cắn độc hai lỗ răng trên một lá bài, quanh vết cắn lan ra mạch xanh lục. ","vuongtrieutailai":"Vị vua tái lai nhìn nghiêng bước ra từ vòng tròn ánh sáng, áo bào trắng, vương miện vàng đang hình thành từ ánh sáng. "};
/* ---- hệ của thẻ (Đợt 3): màu chính, màu phụ, tên ---- */
const ELD={lua:["#ff6a1f","#ffd27a","Lửa"],bang:["#8fe6ff","#ffffff","Băng"],sam:["#ffe04a","#9fd8ff","Sấm"],doc:["#7dff4a","#c04dff","Độc"],toi:["#a04dff","#ff3d8a","Bóng tối"],sang:["#fff2a8","#ffd65a","Ánh sáng"],gio:["#b6ffe8","#7fd0ff","Gió"],dat:["#d8a868","#8a6a4a","Đất đá"],nuoc:["#40a8ff","#bff4ff","Nước"],mau:["#ff2d4d","#ff9aa8","Máu"],cokhi:["#b8c8d8","#ffb347","Cơ khí"],hon:["#9fffe0","#8f9cff","Linh hồn"],moc:["#6ade4a","#d6ff8a","Thiên nhiên"]};
const ELW={
lua:"lửa,hoả,hỏa,viêm,dung nham,cháy,thiêu,thiêu đốt,bỏng,phượng,phượng hoàng,lò rèn,than hồng,ngọn đuốc,đuốc,hoả ngục,bùng cháy,nóng,hun",
bang:"băng,tuyết,giá,đóng băng,sương giá,lạnh,giá lạnh,hàn,băng giá",
sam:"sấm,sét,lôi,điện,chớp,tia chớp,sấm sét,lôi công,giông",
doc:"độc,nọc,axit,chất độc,dịch bệnh,virut,vi rút,thối,nhện,rắn,bọ cạp,cóc,nấm độc,khí độc,ô nhiễm,mủ,sâu,ôn dịch,dịch",
toi:"bóng tối,hắc,ám,quỷ,tà,đêm,u minh,hư không,địa ngục,hố đen,bóng,đen,ác,ma quỷ,hắc ám,tà thuật,nguyền,lời nguyền,vực",
sang:"ánh sáng,thánh,thiên thần,hào quang,thần thánh,tiên,mặt trời,vàng rực,tinh tú,thiên giới,ánh sao,phát sáng,rực sáng",
gio:"gió,bão,lốc,cánh,bay,lông vũ,chim,mây,phong,diều,đại bàng,quạ,cú,dơi,không trung",
dat:"đá,đất,núi,thạch,sa mạc,cát,khoáng,nham,tảng,hang,bùn,đất sét,trâu,voi,gấu",
nuoc:"nước,thuỷ,thủy,biển,sóng,sông,hồ,cá,mưa,thác,san hô,bạch tuộc,rùa,cua,tôm,thuyền,đại dương,thuỷ triều,bong bóng",
mau:"máu,huyết,ma cà rồng,hút máu,đỏ thẫm,xương,sọ,thịt,nanh,vuốt,giết,sát",
cokhi:"máy,cơ khí,robot,sắt,thép,bánh răng,đồng hồ,súng,kim loại,giáp sắt,giáp,đồng,pháo,xích,búa,kiếm,đao,khiên,mũi tên,cung,tên lửa,lò xo",
hon:"linh hồn,hồn,vong,u linh,bóng ma,ma,tâm linh,ảo ảnh,hồn ma,mộng,ảo,giấc mơ,thời gian,không gian,phép,phù thuỷ,pháp sư,huyền bí",
moc:"cây,rừng,lá,hoa,rễ,gai,thiên nhiên,mộc,tre,nấm,cỏ,dây leo,hạt,quả,sen,ong,bướm,thú,hổ,sói,cáo,khỉ,hươu"};
const ELR={};for(const k in ELW){const ws=ELW[k].split(",").sort((a,b)=>b.length-a.length).map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));ELR[k]=new RegExp("(^|[^\\p{L}])("+ws.join("|")+")(?=$|[^\\p{L}])","giu");}
/* bảng ghi đè thủ công cho các thẻ nổi bật */
const ELMAN={chanthu:"sam",madienloi:"sam",hoasu:"lua",phuonghoa:"lua",longuclua:"lua",toclua:"lua",hoatinhnu:"lua",tinhchuathaiduong:"lua",cunemthantoc:"lua",hacthachtuong:"lua",quadao:"gio",
  bangvuong:"bang",nguoituyet:"bang",thongkho:"hon",hauduethoikhong:"hon",honxuatkhieu:"hon",maynuotthoigian:"hon",thiemnu:"hon",niemluctu:"hon",kychu:"hon",trathan:"hon",mauthoikhong:"hon",matocdautien:"hon",phatuongsinhlinh:"hon",aosi:"hon",vouy:"hon",
  hackysi:"toi",ungtoi:"toi",quandoanmotnguoi:"toi",nguoisoidem:"toi",dichcuongcot:"toi",hacdichbinh:"toi",bachdich:"toi",kysituduc:"toi",thienngaden:"toi",tammanu:"toi",tuthanmienvien:"toi",
  trungvuong:"doc",chodoc:"doc",tiensigamma:"doc",kysidichkhuyen:"doc",daitaxacsong:"doc",nhennon:"doc",laonhen:"doc",
  thosanhuyetthach:"mau",cotnu:"mau",huyetdichhangxom:"mau",dichdo:"mau",
  phonghiem:"cokhi",nokiem:"cokhi",thietthieunien:"cokhi",nghichtuvuong:"cokhi",phaodaimay:"cokhi",thuyngannu:"cokhi",maythichnghi:"cokhi",
  thuytoquyen:"nuoc",kysidaoquoc:"nuoc",thuynhan:"nuoc",longchu:"dat",chienthan:"dat",culongco:"dat",kimcuongxa:"dat",thachlucnu:"dat",
  lukhachtroi:"gio",cuvocanhhungvi:"gio",trungchien:"moc",vuotnu:"moc",linhduoc:"moc",
  tienbui:"sang",ungsao:"sang",hoangngoc:"sang",conhansu:"sang",cucquang:"sang",phitieuhoi:"sang",nguyetlong:"sang",kesanga:"sang",langthan:"sang",xactinhquang:"sang"};
const ELC={};
function elOf(id){if(!id||!C[id])return null;if(ELC[id]!==undefined)return ELC[id];let e=ELMAN[id]||null;
  if(!e){const sc={},add=(t,w)=>{t=String(t||"").toLowerCase();for(const k in ELR){const m=t.match(ELR[k]);if(m)sc[k]=(sc[k]||0)+m.length*w;}};
    add(C[id].n,4);add(String(MOTA[id]||"").replace(/ánh sáng\s*:.*$/i,""),2);add(C[id].x,1);let bv=0;for(const k in sc)if(sc[k]>bv){bv=sc[k];e=k;}}
  if(!e){const t=String(C[id].x||"").toLowerCase();e=/tiêu huỷ/.test(t)?"mau":/vứt bỏ/.test(t)?"lua":/(dời|di chuyển)/.test(t)?"gio":/năng lượng/.test(t)?"sam":/hồi sinh/.test(t)?"hon":/bộ bài|rút/.test(t)?"nuoc":/không thể/.test(t)?"dat":["moc","sang","cokhi","nuoc","gio","dat"][lhash(id)%6];}
  return ELC[id]=e;}
const elU=uid=>{const c=anyC(uid);return c?elOf(c.id):null;};
const elCol=uid=>{const e=elU(uid);return e?ELD[e][0]:"#ffffff";};
/* hiệu ứng lật/tác động theo hệ */
function elFx(e,x,y,w,h,small){if(reduced||!e||!ELD[e])return;const k=small?.6:1,c=ELD[e][0],c2=ELD[e][1];w=w||60;h=h||84;
  if(small){const ek=e==="lua"||e==="mau"?"thieu_dot":e==="bang"||e==="nuoc"?"dong_bang":e==="sam"||e==="cokhi"?"set_danh":e==="doc"||e==="moc"?"doc_lan":"";if(ek)playV16(ek,x,y,Math.max(92,w*1.75),480,0);}
  switch(e){
    case "lua":if(!small)FX.pillar(x,y+h*.45,c,w*.8,h*1.7);FX.ash(x,y,small?8:18);FX.rise(x,y+10,"#ffb04d",small?8:14);break;
    case "bang":FX.shards(x,y,"#bff4ff");FX.ring(x,y,"#ffffff",w*.8*k,3);FX.snow(x,y,small?8:16);FX.glow(x,y,c,60*k);break;
    case "sam":FX.bolts(x,y,c,small?4:8,w*.9);FX.bolts(x,y,c2,small?2:4,w*.6);if(!small)FX.flash("#fff6c0",.1);FX.glow(x,y,c,56*k);break;
    case "doc":FX.puff(x,y,"rgba(40,110,20,.85)",small?4:8);FX.rise(x,y,c,small?8:12);FX.burst(x,y,c2,small?6:10,90);break;
    case "toi":FX.miasma(x,y,small?4:8);FX.vortex(x,y,c,small?8:12);break;
    case "sang":FX.rays(x,y,c,w*1.1*k,12);FX.glow(x,y,c2,90*k);FX.rise(x,y,"#ffffff",small?6:10);break;
    case "gio":FX.vortex(x,y,c,small?10:18);FX.dust(x,y+h*.4,"#e8fff8");FX.leaves(x,y,"#d8fff4",small?4:8);break;
    case "dat":FX.shards(x,y,"#a07a50");FX.dust(x,y+h*.45,c);if(!small)FX.shake(4);break;
    case "nuoc":FX.wave(x,y,c,w*k);FX.drip(x,y,c2,small?8:16);break;
    case "mau":FX.sparks(x,y,c,small?8:16,220);FX.drip(x,y,c,small?6:12);break;
    case "cokhi":FX.sparks(x,y,c2,small?10:18,300);FX.ring(x,y,c,w*.7*k,3);FX.sigil(x,y,c,w*.5*k,10,false,.6);break;
    case "hon":FX.rise(x,y,c,small?8:16);FX.ring(x,y,c2,w*.8*k,2);FX.glow(x,y,c,60*k);break;
    case "moc":FX.leaves(x,y,c,small?7:14);FX.rise(x,y,c2,small?6:10);break;}}
function elFlip(uid,p){const e=elU(uid);if(!e||!p)return;elFx(e,p.x,p.y,p.w,p.h,false);}
/* ---- ảnh chụp trạng thái trước mỗi bước để so sánh sau bước ---- */
let SNX=null;
function snapX(){if(!G||!G.hand||!G.deck)return;const o={G,hand:{},deck:{},cm:new Map(),bp:new Map()};
  for(const s of E.SIDES){o.hand[s]=new Set(G.hand[s].map(c=>c.uid));o.deck[s]=new Set(G.deck[s].map(c=>c.uid));for(const k of ["hand","deck"])for(const c of G[k][s])o.cm.set(c.uid,c.cm||0);}
  o.cs=new Map();for(const s of E.SIDES)for(const c of G.hand[s])try{o.cs.set(c.uid,E.cost(G,c));}catch(e){}
  o.bn=new Map();for(let i=0;i<3;i++)for(const s of E.SIDES)for(const c of G.locs[i].cards[s]){o.bp.set(c.uid,c.bp);o.bn.set(c.uid,c.bonus);}SNX=o;}
const K7=/^(tohand|clone|abcopy|discard|lock|blocked)$/;
function pre7(evs){const X={cm:[],bp:[],bpU:new Set(),din:{p:[],a:[]},hnew:{p:[],a:[]},fromHand:new Set(),stolen:[]};evs.x7=X;let any=evs.some(e=>K7.test(e.k));
  const S=SNX;if(!S||S.G!==G||!G.deck)return any;
  const surg=new Set(evs.filter(e=>e.k==="surge").map(e=>e.uid));
  const sev=evs.find(e=>e.k==="skill"||e.k==="act"),src0=sev?sev.uid:((evs.find(e=>e.src>0)||{}).src||0);
  for(const s of E.SIDES){const os=s==="p"?"a":"p";
    for(const c of G.hand[s]){if(surg.has(c.uid)||!S.hand[s].has(c.uid))continue;let d=0;if(S.cs&&S.cs.has(c.uid)){try{d=E.cost(G,c)-S.cs.get(c.uid);}catch(e){}}else if(S.cm.has(c.uid))d=(c.cm||0)-S.cm.get(c.uid);if(d)X.cm.push({u:c.uid,s,z:"hand",d});}
    for(const c of G.deck[s])if(S.cm.has(c.uid)&&(c.cm||0)!==S.cm.get(c.uid)&&!surg.has(c.uid))X.cm.push({u:c.uid,s,z:"deck",d:(c.cm||0)-S.cm.get(c.uid)});
    for(const c of G.deck[s])if(!S.deck[s].has(c.uid)){X.din[s].push(c.uid);if(S.hand[s].has(c.uid))X.fromHand.add(c.uid);}
    for(const c of G.hand[s]){if(S.deck[os].has(c.uid)||S.hand[os].has(c.uid))X.stolen.push({uid:c.uid,id:c.id,fromSide:os,toSide:s,fromZone:S.deck[os].has(c.uid)?"deck":"hand",toZone:"hand",src:src0});
      else if(!S.hand[s].has(c.uid)&&!S.deck[s].has(c.uid)&&!S.bp.has(c.uid))X.hnew[s].push(c.uid);}}
  for(let i=0;i<3;i++)for(const s of E.SIDES){const os=s==="p"?"a":"p";for(const c of G.locs[i].cards[s]){if(S.bp.has(c.uid)&&c.bp!=null&&c.bp!==S.bp.get(c.uid)){X.bp.push({u:c.uid,v:c.bp});X.bpU.add(c.uid);}
    if(!S.bp.has(c.uid)&&(S.deck[os].has(c.uid)||S.hand[os].has(c.uid)))X.stolen.push({uid:c.uid,id:c.id,fromSide:os,toSide:s,fromZone:S.deck[os].has(c.uid)?"deck":"hand",toZone:"board",src:src0});}}
  return !!(any||X.stolen.length||X.cm.length||X.bp.length||X.din.p.length||X.din.a.length||X.hnew.p.length||X.hnew.a.length);}
/* ---- vị trí ---- */
function anyC(uid){let c=null;try{c=cardOf(uid);}catch(e){}if(c||!G)return c;for(const s of E.SIDES){c=(G.deck[s]||[]).find(x=>x.uid===uid);if(c)return c;}return null;}
function liteId(id,cs,pw){if(!id||!C[id])return `<span class="lc lcb"><i></i></span>`;const d=C[id];return `<span class="lc" style="--hc:${HC[d.h]}">${nbL(id)}${art(id)}<b class="lcc">${cs!=null?cs:d.c}</b><b class="lcp">${pw!=null?pw:d.p}</b><i class="lcn">${esc(d.n)}</i></span>`;}
const BACK7=()=>liteId(null);
function hpt(uid){const el=document.querySelector(`#hand [data-hc="${uid}"]`);if(!el)return null;const r=el.getBoundingClientRect();if(!r.width)return null;return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};}
function zpt(id){const el=$(id);if(!el)return null;const r=el.getBoundingClientRect();if(!r.width&&!r.height)return null;return {x:r.left+r.width/2,y:r.top+r.height/2,w:44,h:62};}
const DECKZ=s=>zpt(s==="p"?"meSub":"oppSub")||zpt(s==="p"?"avMe":"avFoe"),HANDZ=s=>s==="p"?zpt("hand"):zpt("avFoe");
function where7(uid,R0,R1){if(!uid)return null;const b=(R1&&R1.get(uid))||(R0&&R0.get(uid));if(b)return b;const h=hpt(uid)||HAND0.get(uid);if(h)return h;if(!G)return null;
  for(const s of E.SIDES){if(G.hand[s].some(c=>c.uid===uid))return HANDZ(s);if((G.deck[s]||[]).some(c=>c.uid===uid))return DECKZ(s);}return null;}
/* chữ nổi không chồng lên nhau */

var say; /* gpu23: chữ nổi trên bàn — định nghĩa ở 08-vfx-webgl.js mục 3 (thông báo nửa trên chiến địa / số nảy); bản cũ ở đây đã bị thay hoàn toàn nên đã xoá */
/* bước 1: thẻ gây ra sáng lên */
function lit7(p,c,uid){if(reduced||!p)return;FX.glow(p.x,p.y,c,Math.max(54,(p.w||50)*1.15),.6);FX.ring(p.x,p.y,c,Math.max(30,(p.w||50)*.8),4);
  if(uid!=null)pulse(`#board [data-mc="${uid}"]`,[{transform:"scale(1)"},{transform:"scale(1.22)",offset:.4},{transform:"scale(1)"}],560);}
/* bước 2: vật/ảnh thẻ bay tới */
function fly7(fr,to,html,cb,dl){dl=dl||0;if(reduced||!fr||!to){if(cb)fxT(cb,dl);return;}fxT(()=>FX.comet(fr.x,fr.y,to.x,to.y,"#ffffff"),dl);if(html)chip(fr,to,html,cb,dl);else if(cb)fxT(cb,dl+420);}
/* ===== vứt bỏ: nhịp "phóng to giữa màn hình" ===== */
let DCB=null;
function discardBeat(list,hMap,srcUid){
  if(reduced||!list.length)return;
  if(DCB)DCB.skip(true);
  const lo=window.FXLV===0,ff=window.FFTURN&&window.FFTURN.on;
  const show=list.slice(0,5),n=show.length,extra=list.length-n;
  const W=Math.min(innerWidth*(n>2?.26:.34),n>3?104:n>2?124:150),H=W*1.36,gap=Math.min(W*.86,(innerWidth-W-24)/Math.max(1,n-1)),cx0=innerWidth/2,cy=Math.max(H*.62+70,innerHeight*.44);
  const pile=PILEPT(),ov=document.createElement("div");ov.className="dcb";
  const tt=document.createElement("div");tt.className="dcl";tt.textContent="VỨT BỎ"+(list.length>1?" ×"+list.length:"");tt.style.top=Math.max(40,cy-H/2-54)+"px";ov.appendChild(tt);
  document.body.appendChild(ov);
  const S=()=>SPD,cards=[];let done=false,out=false,tmr=0;
  const IN=220,HOLD=ff?240:lo?560:820,OUT=360;
  /* gpu35: Element.animate đã tự nhân SPD (bản vá toàn cục) -> thời lượng hoạt ảnh dùng ms gốc, chỉ hẹn giờ setTimeout mới nhân S() */
  const ea=ov.animate([{opacity:0},{opacity:1}],{duration:IN*.8,fill:"both"});
  show.forEach((e,i)=>{
    const k=i-(n-1)/2,x=cx0+k*gap,rot=k*(n>3?5:7),mine=e.side==="p";
    const g=ghost({x,y:cy,w:W,h:H},liteId(e.id),"fxchip dcc");g.style.zIndex="47";
    const cap=document.createElement("div");cap.className="dcw "+(mine?"me":"foe");cap.textContent=mine?"Bạn":"Đối thủ";cap.style.left=x+"px";cap.style.top=(cy+H/2+10)+"px";ov.appendChild(cap);
    let fr=mine&&hMap?hMap.get(e.uid):null;if(!fr)fr=mine?zpt("hand"):(zpt("oppSub")||zpt("avFoe"));
    const f0=fr?{dx:fr.x-x,dy:fr.y-cy,sc:Math.min(.7,(fr.w||50)/W)}:{dx:0,dy:70,sc:.5};
    g.animate([{transform:`translate(${f0.dx}px,${f0.dy}px) scale(${f0.sc}) rotate(0deg)`,opacity:.2},{transform:`translate(0,0) scale(1.06) rotate(${rot}deg)`,opacity:1,offset:.7},{transform:`translate(0,0) scale(1) rotate(${rot}deg)`,opacity:1}],{duration:IN,delay:i*40,easing:"cubic-bezier(.2,.8,.3,1)",fill:"both"});
    cap.animate([{opacity:0},{opacity:1}],{duration:IN,delay:i*40+120,fill:"both"});
    cards.push({g,cap,x,rot});
  });
  if(extra>0){const ex=document.createElement("div");ex.className="dcw foe";ex.textContent="+"+extra+" thẻ nữa";ex.style.left=cx0+"px";ex.style.top=(cy+H/2+34)+"px";ov.appendChild(ex);}
  if(srcUid){try{const sp=where7(srcUid,null,null);if(sp)lit7(sp,"#ff9a4d",srcUid);}catch(x){}}
  holdFx(IN+HOLD+OUT+n*60+60);
  const finish=()=>{if(done)return;done=true;cards.forEach(c=>{c.g.remove();c.cap.remove();});ov.remove();if(DCB&&DCB.id===id)DCB=null;};
  const fly=(quick)=>{
    if(out)return;out=true;clearTimeout(tmr);
    const d=OUT*(quick?.6:1);
    ov.animate([{opacity:1},{opacity:0}],{duration:d,delay:d*.3,fill:"both"});
    cards.forEach((c,i)=>{
      const dx=pile.x-c.x,dy=pile.y-cy;
      c.cap.animate([{opacity:1},{opacity:0}],{duration:d*.3,fill:"both"});
      const a=c.g.animate([{transform:`translate(0,0) scale(1) rotate(${c.rot}deg)`,opacity:1},{transform:`translate(${dx*.55}px,${dy*.5-30}px) scale(.55) rotate(${c.rot+10}deg)`,opacity:1,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(.18) rotate(${c.rot+24}deg)`,opacity:0}],{duration:d,delay:i*50*(quick?.5:1),easing:"cubic-bezier(.5,0,.8,.6)",fill:"both"});
      a.onfinish=()=>{if(!lo&&i===cards.length-1){FX.sparks(pile.x,pile.y,"#ff9a4d",10,140);FX.glow(pile.x,pile.y,"#ff9a4d",44,.4);}try{pulse("#btnPiles",[{transform:"scale(1)"},{transform:"scale(1.25)",offset:.4},{transform:"scale(1)"}],300);}catch(x){}};
    });
    setTimeout(finish,(d+n*50+80)*S());
  };
  const id=(DCB&&DCB.id||0)+1;
  DCB={id,skip:q=>fly(q)};
  ov.addEventListener("pointerdown",()=>fly(true));
  tmr=setTimeout(()=>fly(false),(IN+HOLD)*S());
}
function burn7(r,html,dl){dl=+dl||0;if(reduced||!r)return;holdFx(dl+640);if(typeof window.playV16==="function")window.playV16("loai_bo",r.x,r.y-22,Math.max(104,(r.w||50)*1.95),560,dl);const w=r.w||46,h=r.h||64,g=ghost({x:r.x,y:r.y,w,h},html,"fxchip fx7b");
  const a=g.animate([{transform:"translateY(0) scale(1)",opacity:1},{transform:"translateY(-48px) scale(1.22) rotate(-6deg)",opacity:1,offset:.38},{transform:"translateY(-56px) scale(1.20) rotate(4deg)",opacity:1,offset:.58},{transform:"translateY(-102px) scale(.68) rotate(12deg)",opacity:0}],{duration:620,delay:dl,easing:"ease-out",fill:"both"});
  a.onfinish=()=>g.remove();fxT(()=>g.remove(),dl+700);
  fxT(()=>{FX.ash(r.x,r.y-56,16);FX.rise(r.x,r.y-48,"#ff8a2b",16);FX.rise(r.x,r.y-66,"#ffd27a",10);FX.glow(r.x,r.y-56,"#ff7a2b",56,.5);},dl+320);}
function clone7(fp,tp,html,dl){if(reduced||!fp||!tp)return;const w=fp.w||46,h=fp.h||64,g=ghost({x:fp.x,y:fp.y,w,h},html,"fxchip fx7cl"),dx=tp.x-fp.x,dy=tp.y-fp.y,s=tp.w?Math.max(.4,Math.min(1.6,tp.w/w)):.6;
  const a=g.animate([{transform:"translate(0,0) scale(1)",opacity:0},{transform:"translate(14px,-10px) scale(1.06)",opacity:.9,offset:.22},{transform:`translate(${dx*.5+14}px,${dy*.5-34}px) scale(${(1+s)/2})`,opacity:.85,offset:.6},{transform:`translate(${dx}px,${dy}px) scale(${s})`,opacity:.25}],{duration:820,delay:dl,easing:"cubic-bezier(.4,0,.4,1)",fill:"both"});
  a.onfinish=()=>g.remove();fxT(()=>g.remove(),dl+1100);fxT(()=>{FX.holo(tp.x,tp.y,"#7fe0ff",22);FX.ring(tp.x,tp.y,"#bff4ff",(tp.w||50)*.8,3);},dl+800);}
const LOCKSVG=`<svg viewBox="-60 -60 120 120" aria-hidden="true"><g class="ch"><path d="M-58 -40L58 40M-58 40L58 -40" stroke="#5a6478" stroke-width="13" stroke-linecap="round"/><path d="M-58 -40L58 40M-58 40L58 -40" stroke="#c8d2e8" stroke-width="7" stroke-dasharray="11 5" stroke-linecap="round"/></g><g class="pl"><path d="M-14 -6v-12a14 14 0 0 1 28 0v12" fill="none" stroke="#e8c060" stroke-width="7"/><rect x="-22" y="-8" width="44" height="34" rx="6" fill="#d8a838" stroke="#7a5a10" stroke-width="3"/><circle cy="6" r="5" fill="#4a3208"/><rect x="-2" y="8" width="4" height="10" fill="#4a3208"/></g></svg>`;
function lock7(li,txt,src,R0,R1){if(reduced)return;const ln=document.querySelector(`#board [data-lane="${li}"]`);if(!ln)return;const r=ln.getBoundingClientRect(),q={x:r.left+r.width/2,y:r.top+r.height/2,w:r.width*.6,h:r.height*.3};
  let dl=0;if(src){const sp=where7(src,R0,R1);if(sp){lit7(sp,"#e8c060",src);fxT(()=>FX.comet(sp.x,sp.y,q.x,q.y,"#e8c060"),120);dl=480;}}
  if(typeof window.playV16==="function")window.playV16("khoa_dia",q.x,q.y,Math.max(122,Math.min(r.width*.95,180)),560,dl,0,true);
  fxT(()=>{const d=document.createElement("div"),s=Math.min(r.width*.9,r.height*.6,190);d.className="fx7lock";d.style.cssText=`left:${q.x}px;top:${q.y}px;width:${s}px;height:${s}px`;d.innerHTML=LOCKSVG;document.body.appendChild(d);fxT(()=>d.remove(),1900);
    FX.ring(q.x,q.y,"#e8c060",s*.6,5);FX.sparks(q.x,q.y,"#ffe08a",14,240);FX.shake(3);SFX.fam("lock",{el:null});},dl);
  say(q.x,r.top+18,txt,"#ffe08a",dl+180);}
function chain7(p,dl){if(reduced||!p)return;fxT(()=>{const d=document.createElement("div"),s=Math.max(36,Math.min(70,(p.w||46)*1.1));d.className="fx7lock sm";d.style.cssText=`left:${p.x}px;top:${p.y}px;width:${s}px;height:${s}px`;d.innerHTML=LOCKSVG;document.body.appendChild(d);fxT(()=>d.remove(),1700);FX.sparks(p.x,p.y,"#ffe08a",8,160);},dl||0);}
const SHDSVG=`<svg viewBox="-50 -60 100 120" aria-hidden="true"><path d="M0 -54L42 -38V2C42 30 22 46 0 56C-22 46 -42 30 -42 2V-38Z" fill="rgba(120,200,255,.22)" stroke="#bfe8ff" stroke-width="5" stroke-linejoin="round"/><path d="M0 -40L28 -29V1C28 21 15 33 0 41C-15 33 -28 21 -28 1V-29Z" fill="none" stroke="#ffffff" stroke-width="2" opacity=".8"/><path d="M-14 0L-3 11L16 -12" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function shield7(ev,p,R0,R1){if(reduced||!p)return;if(document.querySelectorAll(".fx7shd").length>=5)return;const src=ev.src&&ev.src!==ev.uid?ev.src:null,sp=src?where7(src,R0,R1):null;let dl=0;
  if(sp){lit7(sp,elCol(src),src);fxT(()=>FX.comet(sp.x,sp.y,p.x,p.y,"#ff7a9a"),100);dl=420;}
  playV16("khien_chan",p.x,p.y,Math.max(108,(p.w||52)*1.95),560,dl);
  fxT(()=>{const d=document.createElement("div"),s=Math.max(40,(p.w||50)*1.15);d.className="fx7shd";d.style.cssText=`left:${p.x}px;top:${p.y}px;width:${s}px;height:${s*1.2}px`;d.innerHTML=SHDSVG;document.body.appendChild(d);fxT(()=>d.remove(),1500);
    FX.ring(p.x,p.y,"#bfe8ff",s*.75,5);FX.sparks(p.x,p.y-10,"#ffffff",12,260);SFX.fam("block",{el:null});},dl);
  const t=ev.w==="d"?"KHÔNG BỊ HUỶ":ev.w==="r"?"MIỄN NHIỄM":ev.w==="m"?"KHÔNG THỂ DỜI":"BỊ CHẶN";say(p.x,p.y-(p.h||70)*.55,t,"#bfe8ff",dl+120);}
const EYESVG=`<svg viewBox="-60 -34 120 68" aria-hidden="true"><path d="M-56 0Q0 -58 56 0Q0 58 -56 0Z" fill="rgba(10,20,40,.75)" stroke="#9ff2ff" stroke-width="5"/><circle r="20" fill="#3fe0ff"/><circle r="9" fill="#04121c"/><circle cx="-6" cy="-7" r="4" fill="#fff"/></svg>`;
function eye7(a,b,txt){if(reduced||!a||!b)return;const mk=(p,dl)=>fxT(()=>{const d=document.createElement("div");d.className="fx7eye";d.style.cssText=`left:${p.x}px;top:${p.y}px`;d.innerHTML=EYESVG;document.body.appendChild(d);fxT(()=>d.remove(),1500);},dl);
  FX.glow(a.x,a.y,"#3fe0ff",70,.6);mk(a,0);fxT(()=>{beam(a,b,"#9ff2ff","",0);FX.comet(a.x,a.y,b.x,b.y,"#9ff2ff");},300);mk(b,700);fxT(()=>{FX.glow(b.x,b.y,"#3fe0ff",60);FX.ring(b.x,b.y,"#9ff2ff",50,3);},700);say(b.x,b.y+46,txt,"#9ff2ff",760);SFX.play("e_hon");}
let EYEL=null;
/* ---- bảng ánh xạ v7 ---- */
const LOCK7={hacthiet:"CẤM ĐẶT",giaosutam:"CẤM ĐẶT",mieunuot:"CẤM THẺ 4⚡+"};
function fx7(evs,R0,P0){if(reduced||!G)return;const X=evs.x7||{};const R1=rects();
  const sev=evs.find(e=>e.k==="skill"||e.k==="act"),SRC0=sev?sev.uid:(evs.find(e=>e.src)||{}).src;
  const litD=new Set(),L=(u,c)=>{const p=where7(u,R0,R1);if(!u||litD.has(u))return p;litD.add(u);lit7(p,c||elCol(u),u);return p;};
  /* thu thẻ về tay */
  for(const e of evs)if(e.k==="tohand"&&R0.has(e.uid)&&!S8.has("h"+e.uid)){const s=e.side,src=e.src&&e.src!==e.uid?e.src:null,r=R0.get(e.uid);
    if(src){const sp=L(src,"#ffb3e0");if(sp)FX.comet(sp.x,sp.y,r.x,r.y,"#ffb3e0");}else lit7(r,"#ffb3e0");
    const dst=s==="p"?(hpt(e.uid)||zpt("hand")):zpt("avFoe");if(dst){SFX.fam("bounce",{delay:.45,el:SRC0?elU(SRC0):null});say(dst.x,s==="p"?dst.y-(dst.h||60)*.6:dst.y+50,"VỀ TAY","#ffb3e0",680);fxT(()=>{FX.wave(dst.x,dst.y,"#ffb3e0",50);FX.sparks(dst.x,dst.y,"#ffd6f0",10,180);},680);}}
  /* tạo thẻ vào tay */
  const cl=new Set(evs.filter(e=>e.k==="clone").map(e=>e.uid));
  for(const s of E.SIDES){const cr=((X.hnew&&X.hnew[s])||[]).filter(u=>!cl.has(u));if(!cr.length)continue;
    const te=evs.find(e=>e.k==="tohand"&&cr.includes(e.uid)&&e.src),src=te?te.src:SRC0,sp=src?L(src,"#ffd65a"):null;
    let dst=s==="p"?(hpt(cr[0])||zpt("hand")):zpt("avFoe");if(!dst)continue;
    if(s==="a"){cr.slice(0,3).forEach((u,i)=>fly7(sp||zpt("oppSub"),dst,BACK7(),null,i*130));}
    else if(!te&&sp)cr.slice(0,3).forEach((u,i)=>{const c=anyC(u),hp=hpt(u)||dst;if(c)fly7(sp,hp,liteId(c.id),null,i*130);});
    SFX.fam("create",{delay:.5,el:SRC0?elU(SRC0):null});say(dst.x,s==="p"?dst.y-(dst.h||60)*.6:dst.y+50,cr.length>1?"+"+cr.length+" THẺ":"+1 THẺ","#ffd65a",640);fxT(()=>{FX.sparks(dst.x,dst.y,"#ffd65a",14,200);FX.glow(dst.x,dst.y,"#ffd65a",50,.4);},640);}
  /* vứt bỏ: phóng to các lá bị vứt giữa màn hình (xoè quạt, một nhịp duy nhất, chạm để bỏ qua) rồi bay xuống nút Mộ */
  {const dl=evs.filter(e=>e.k==="discard");if(dl.length)discardBeat(dl,evs._hand0||HAND0,SRC0);}
  /* sao chép thẻ: nếu có CardChoreo (Gương Đồng Đông Sơn) thì để CardChoreo diễn tuần tự duy nhất */
  let nc=0;const cdst={};for(const e of evs)if(e.k==="clone"){const c=anyC(e.uid);if(!c)continue;const fp=where7(e.from,R0,R1),s=c.side;let tp=R1.get(e.uid)||hpt(e.uid);
    if(!tp)tp=G.hand[s].includes(c)?HANDZ(s):(G.deck[s]||[]).includes(c)?DECKZ(s):null;if(!fp||!tp)continue;
    const pub=R0.has(e.from)||R1.has(e.from)||R1.has(e.uid)||s==="p",html=pub?liteId(c.id):BACK7();
    if(!window.CardChoreo&&nc<4){if(R1.has(e.from)||R0.has(e.from))lit7(fp,"#7fe0ff",e.from);clone7(fp,tp,html,nc*680);holdFx(nc*680+820);}nc++;
    const k=Math.round(tp.x/20)+","+Math.round(tp.y/20);cdst[k]=cdst[k]||{p:tp,n:0,into:e.into};cdst[k].n++;}
  for(const k in cdst){const q=cdst[k];say(q.p.x,q.p.y-(q.p.h||60)*.6,q.into?"SAO CHÉP":(q.n>1?"NHÂN BẢN ×"+q.n:"NHÂN BẢN"),"#7fe0ff",window.CardChoreo?620:820);}
  /* sao chép kỹ năng: ảnh thẻ bị chép bay tới thẻ chép */
  let na=0;for(const e of evs)if(e.k==="abcopy"&&!e.st&&!S8.has("c"+e.uid+"_"+e.from)){const tp=R1.get(e.uid)||R0.get(e.uid);if(!tp)continue;const fc=anyC(e.from),me=anyC(e.uid);let fp=e.deck?DECKZ((me||{}).side||"p"):where7(e.from,R0,R1);if(!fp)fp=tp;
    const html=fc?liteId(fc.id):null,same=Math.abs(fp.x-tp.x)+Math.abs(fp.y-tp.y)<6;if(!same)lit7(fp,"#c45cff",e.from);lit7(tp,"#7fe0ff",e.uid);
    const go=()=>{playV16("sao_chep",tp.x,tp.y,Math.max(104,(tp.w||52)*1.9),520,0);FX.sigil(tp.x,tp.y,"#c45cff",tp.w*.8,6,false,1);FX.glow(tp.x,tp.y,"#c45cff",64);FX.vortex(tp.x,tp.y,"#e0b0ff",12);};
    if(na<4&&html&&!same)chip(fp,tp,html,go,220+na*160);else fxT(go,300);if(na<4)say(tp.x,tp.y-tp.h*.6,"CHÉP KỸ NĂNG","#d9a6ff",660+na*160);na++;}
  /* năng lượng của thẻ trên tay / trong bộ bài */
  if(X.cm&&X.cm.length&&!X.cm8){const sp=SRC0?L(SRC0,"#7fe0ff"):null,grp=[];const ph=X.cm.filter(q=>q.s==="p"&&q.z==="hand");
    if(ph.length&&ph.length<=3)for(const q of ph){const p=hpt(q.u);if(p)grp.push({p,ds:[q.d],us:[q.u],one:1});}
    const rest={};for(const q of X.cm){if(q.s==="p"&&q.z==="hand"&&ph.length<=3)continue;const k=q.s+q.z;(rest[k]=rest[k]||{p:q.z==="hand"?HANDZ(q.s):DECKZ(q.s),ds:[],us:[],hand:q.z==="hand",zid:q.z==="deck"?(q.s==="p"?"meSub":"oppSub"):null}).ds.push(q.d);rest[k].us.push(q.u);}
    for(const k in rest)if(rest[k].p)grp.push(rest[k]);
    grp.forEach((g,i)=>{const d=g.ds[0],same=g.ds.every(x=>x===d),c=d<0?"#7fe0ff":"#ff7a9a",t=(same?(d<0?"−":"+")+Math.abs(d)+" ⚡":"⚡ ĐỔI")+(g.ds.length>1?" ×"+g.ds.length:""),dl=(sp?420:0)+i*110;
      if(sp)fxT(()=>proj(sp,g.p,c,"coin",420,true),i*110);
      fxT(()=>{FX.glow(g.p.x,g.p.y,c,48,.45);FX.bolts(g.p.x,g.p.y,c,5,26);for(const u of g.us.slice(0,7))pulse(`#hand [data-hc="${u}"]`,[{transform:"scale(1)"},{transform:"scale(1.16) translateY(-8px)",offset:.4},{transform:"scale(1)"}],560);if(g.zid)pulse("#"+g.zid,[{transform:"scale(1)"},{transform:"scale(1.3)",offset:.4},{transform:"scale(1)"}],480);},dl);
      say(g.p.x,g.p.y-(g.one?g.p.h*.62:30),t,c,dl);if(i<2)SFX.fam(d<0?"costdn":"costup",{delay:dl/1000,vol:i?.75:1});});}
  /* khoá chiến địa / cấm đặt thẻ */
  for(const e of evs){if(e.k==="lock"&&e.t==="flood")lock7(e.li,"BỊ NGẬP",e.src,R0,R1);
    else if(e.k==="flip"){const c=anyC(e.uid);if(c&&LOCK7[c.id]&&!c.sil){const f=E.find(G,e.uid);if(f)lock7(f.li,LOCK7[c.id],null,R0,R1);}}}
  {const np=evs.filter(e=>e.k==="lock"&&e.t==="np");if(np.length){const src=np[0].src,sp=src?L(src,"#e8c060"):null;let n=0;
    for(const e of np){const p=e.side==="p"?hpt(e.uid):zpt("avFoe");if(!p)continue;if(sp){const pp=p;fxT(()=>FX.comet(sp.x,sp.y,pp.x,pp.y,"#e8c060"),n*120);}chain7(p,(sp?420:0)+n*120);n++;if(e.side==="a")break;}
    const q=np[0].side==="p"?zpt("hand"):zpt("avFoe");if(q)say(q.x,q.y-50,"KHOÁ 1 LƯỢT","#ffe08a",560);SFX.fam("lock",{delay:(sp?.42:.1),el:null});}}
  /* đặt lại sức mạnh về số cố định */
  (X.bp||[]).slice(0,5).forEach((q,i)=>{if(S8.has("b"+q.u))return;const tp=R1.get(q.u);if(!tp)return;const src=SRC0&&SRC0!==q.u?SRC0:null,sp=src?L(src,"#ffd65a"):null;
    const go=()=>{FX.sigil(tp.x,tp.y,"#ffd65a",tp.w*.7,4,false,.8);FX.wave(tp.x,tp.y,"#ffd65a",tp.w*.8);pulse(`#board [data-mc="${q.u}"] .pwh`,[{transform:"scale(1)"},{transform:"scale(2)",offset:.35},{transform:"scale(1)"}],600);say(tp.x,tp.y-6,"= "+q.v,"#ffd65a");};
    if(sp)fly7(sp,tp,lite(src),go,i*110);else fxT(go,i*110);});
  /* xáo thẻ vào bộ bài */
  for(const s of E.SIDES){const ins=(X.din&&X.din[s])||[];if(!ins.length)continue;const dz=DECKZ(s);if(!dz)continue;const sp=SRC0?L(SRC0,"#9fd8ff"):null;
    ins.slice(0,4).forEach((u,i)=>{const c=anyC(u);if(!c)return;const fh=X.fromHand.has(u),fp=R0.get(u)||(fh?(HAND0.get(u)||HANDZ(s)):null)||sp||zpt(s==="p"?"oppSub":"meSub");
      const html=fh&&s==="a"?BACK7():liteId(c.id);chip(fp,dz,html,()=>{FX.wave(dz.x,dz.y,"#9fd8ff",44);FX.sparks(dz.x,dz.y,"#9fd8ff",8,160);},(sp?320:0)+i*140);});
    say(dz.x,dz.y+34,"+"+ins.length+" VÀO BỘ BÀI","#9fd8ff",(sp?320:0)+520);fxT(()=>pulse("#"+(s==="p"?"meSub":"oppSub"),[{transform:"scale(1)"},{transform:"scale(1.35)",offset:.4},{transform:"scale(1)"}],520),(sp?320:0)+520);SFX.fam("deckadd",{delay:((sp?320:0)+380)/1000});}
  /* tác động theo hệ của thẻ nguồn lên các mục tiêu đổi sức mạnh */
  if(SRC0){const e=elU(SRC0);if(e){const P1=powers();let n=0;for(const [u,v] of P1){if(n>=5)break;if(u===SRC0||!P0.has(u)||P0.get(u)===v||S8.has("p"+u))continue;const p=R1.get(u);if(!p)continue;n++;fxT(()=>elFx(e,p.x,p.y,p.w,p.h,true),460+n*60);}
    }}
}
/* ===== v8: điều phối tuần tự – từng mục tiêu một, chậm và rõ ===== */
let S8=new Set(),FXBIG=false,LW0=[];
const T8={LIFT:95,FLY:290,REACT:250,BACK:290,GAP:115,MAX:2000};
const K8={steal:["#c45cff","hand","BỊ CƯỚP KỸ NĂNG"],copy:["#7fe0ff","streak","BỊ SAO CHÉP"],sil:["#b8c0dc","seal","MẤT KỸ NĂNG"],kill:["#ff4d5e","blade","TIÊU HUỶ"],
  up:["#7dffb0","streak",""],down:["#ff7a9a","streak",""],summon:["#8fdc4a","streak","TRIỆU HỒI"],bounce:["#ffb3e0","streak","VỀ TAY"],reset:["#ffd65a","streak",""],
  lplus:["#ffd65a","stream",""],lminus:["#b06bff","stream",""],lshield:["#bfe8ff","",""],loc:["#ffd65a","",""]};
const OBJ8={
  hand:`<svg viewBox="-34 -24 68 48" aria-hidden="true"><ellipse cx="2" rx="30" ry="18" fill="#7a2cc4" opacity=".28"/><path d="M-30 0C-23-7-15-11-6-11L3-16L21-21L27-19L9-11L25-11L31-7L10-4L27 0L31 4L10 3L23 10L24 13L6 8L-6 12C-15 12-23 7-30 0Z" fill="#2a0a44" stroke="#e6c2ff" stroke-width="1.8" stroke-linejoin="round"/><circle cx="-12" cy="0" r="3" fill="#ff5ad0"/></svg>`,
  seal:`<svg viewBox="-20 -20 40 40" aria-hidden="true"><circle r="18" fill="#7f8ab0" opacity=".25"/><circle r="14" fill="#141628" stroke="#dfe5ff" stroke-width="3"/><path d="M-9 9L9-9" stroke="#dfe5ff" stroke-width="4" stroke-linecap="round"/></svg>`,
  blade:`<svg viewBox="-34 -9 68 18" aria-hidden="true"><rect x="-33" y="-2.5" width="12" height="5" rx="2" fill="#5a2a14" stroke="#ffcf9a" stroke-width="1"/><rect x="-21" y="-8" width="3.5" height="16" rx="1.5" fill="#e8c060"/><path d="M-17-3.6H23L33 0L23 3.6H-17Z" fill="#f4f6ff" stroke="#ff4d5e" stroke-width="1.6" stroke-linejoin="round"/><path d="M-14 0H26" stroke="#ff8a9a" stroke-width="1"/></svg>`,
  sword:`<svg viewBox="-70 -16 140 32" aria-hidden="true"><ellipse rx="66" ry="14" fill="#7a2cc4" opacity=".25"/><rect x="-68" y="-4" width="22" height="8" rx="3" fill="#2a0a44" stroke="#e6c2ff" stroke-width="1.5"/><rect x="-46" y="-14" width="6" height="28" rx="2.5" fill="#c99a2e" stroke="#fff0b0" stroke-width="1"/><path d="M-40-6H50L68 0L50 6H-40Z" fill="#dfe6ff" stroke="#a04dff" stroke-width="2.2" stroke-linejoin="round"/><path d="M-36 0H56" stroke="#a04dff" stroke-width="1.6"/></svg>`,
  meteor:`<svg viewBox="-30 -20 60 40" aria-hidden="true"><path d="M-30-4L4-10L4 10L-30 4Z" fill="#ff6a1f" opacity=".45"/><circle cx="10" r="13" fill="#2a0a14" stroke="#ff8a2b" stroke-width="3"/><circle cx="14" cy="-4" r="4" fill="#ffd27a"/></svg>`,
  bolt:`<svg viewBox="-20 -20 40 40" aria-hidden="true"><circle r="17" fill="#3fe0ff" opacity=".22"/><path d="M4-17L-9 2H0L-5 17L10-4H1Z" fill="#fff6a8" stroke="#3fa0ff" stroke-width="1.6" stroke-linejoin="round"/></svg>`};
const ang8=(x,y)=>Math.atan2(y,x)*57.2958,near8=(a,b)=>{while(b-a>180)b-=360;while(a-b>180)b+=360;return b;};
function obj8(type,c,html){const d=document.createElement("div");d.className="p8 p8-"+type;d.style.setProperty("--c",c);d.innerHTML=html||OBJ8[type]||"";document.body.appendChild(d);return d;}
/* vật thể bay theo đường cong từ a tới b, mũi luôn hướng theo đường bay */
function fly8(a,b,type,c,dur,dl,cb,html){if(reduced||!a||!b){if(cb)fxT(cb,(dl||0)+(dur||0));return;}dl=dl||0;
  fxT(()=>{const d=obj8(type,c,html);d.style.left=a.x+"px";d.style.top=a.y+"px";
    const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,lift=-Math.min(70,L*.3),rot=!(type==="seal"||type==="card"||type==="bolt");
    let a0=ang8(dx*.5,dy*.5+lift*2),am=near8(a0,ang8(dx,dy)),a1=near8(am,ang8(dx*.5,dy*.5-lift*2));const R=v=>rot?` rotate(${v.toFixed(1)}deg)`:"";
    const kf=[{transform:`translate(-50%,-50%) translate(0px,0px)${R(a0)} scale(.45)`,opacity:0},
      {transform:`translate(-50%,-50%) translate(${(dx*.14).toFixed(1)}px,${(dy*.14+lift*.5).toFixed(1)}px)${R(a0)} scale(1)`,opacity:1,offset:.16},
      {transform:`translate(-50%,-50%) translate(${(dx*.5).toFixed(1)}px,${(dy*.5+lift).toFixed(1)}px)${R(am)} scale(1.08)`,opacity:1,offset:.55},
      {transform:`translate(-50%,-50%) translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)${R(a1)} scale(.95)`,opacity:1}];
    const an=d.animate(kf,{duration:dur,easing:"cubic-bezier(.42,.05,.45,1)",fill:"both"});let done=0;
    const fin=()=>{if(done)return;done=1;const o=d.animate([{opacity:1},{opacity:0}],{duration:180,fill:"forwards"});o.onfinish=()=>d.remove();fxT(()=>d.remove(),400);if(cb)cb();};
    an.onfinish=fin;fxT(fin,dur+150);FX.trail(a.x,a.y,b.x,b.y,c);},dl);}
function tEl8(uid){return document.querySelector(`#board [data-mc="${uid}"]`)||document.querySelector(`#hand [data-hc="${uid}"]`);}
function mark8(tp,k,dl){if(reduced||!tp)return;fxT(()=>{const d=document.createElement("div"),w=tp.w||46,h=tp.h||64;d.className="m8 m8-"+k;d.style.cssText=`left:${tp.x-w/2}px;top:${tp.y-h/2}px;width:${w}px;height:${h}px`;
  d.innerHTML=k==="steal"?`<svg viewBox="0 0 40 56" preserveAspectRatio="none"><path d="M8 8L28 46M15 6L34 40M4 18L20 50" stroke="#e6c2ff" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>`:k==="sil"?`<svg viewBox="-20 -20 40 40"><circle r="13" fill="rgba(10,12,24,.55)" stroke="#dfe5ff" stroke-width="2.6"/><path d="M-8 8L8-8" stroke="#dfe5ff" stroke-width="3.2" stroke-linecap="round"/></svg>`:"";
  document.body.appendChild(d);fxT(()=>d.remove(),1000);},dl||0);}
function lift8(uid,p,c){if(reduced||!p)return;const el=uid>0?document.querySelector(`#board [data-mc="${uid}"]`):null;
  if(el)anim(el,[{transform:"none"},{transform:"translateY(-7px) scale(1.12)",offset:.3},{transform:"translateY(-6px) scale(1.1)",offset:.8},{transform:"none"}],{duration:820,fill:"none"});
  FX.glow(p.x,p.y,c,Math.min(34,(p.w||50)*.55),.6);}
/* phân loại hiệu ứng chiến địa theo mô tả + bảng ghi đè */
const LCATM={bamboo:"shield",forge:"plus",ferry:"plus",shrine:"plus",swamp:"noplay",watch:"block",cave:"noplay",market:"discard",volcano:"kill",graveyard:"draw",den:"summon",anthill:"summon",windhill:"move",mirror:"morph",crystal:"energy",terrace:"energy",tokien:"minus",tramdich:"move",bichdong:"hand",lyson:"set"};
const LCC={};
function lcat8(id){if(LCC[id])return LCC[id];const L=LOC[id];const t=((L&&L.x)||"").toLowerCase();let k=LCATM[id];
  if(!k)k=/không thể bị tiêu huỷ/.test(t)?"shield":/tiêu huỷ/.test(t)?"kill":/không đặt được|chỉ thẻ|chỉ đặt|mới đặt được/.test(t)?"noplay":/triệu hồi|có \d+ .* với \d+ sức mạnh|có thêm 1 sóc|lính thuê|đặt 1 thẻ ngẫu nhiên/.test(t)?"summon":/rút|vào tay|bản sao/.test(t)?"draw":/năng lượng/.test(t)&&/thêm \d+ năng lượng|có thêm 1 năng lượng|tốn/.test(t)?"energy":/vứt/.test(t)?"discard":/di chuyển|thổi/.test(t)?"move":/(−|-)\d/.test(t)?"minus":/\+\d/.test(t)?"plus":"other";
  return LCC[id]=k;}
const LCAT_C={shield:"#bfe8ff",kill:"#ff4d5e",noplay:"#e8c060",summon:"#8fdc4a",draw:"#9fd8ff",energy:"#7fe0ff",discard:"#ff9a4d",move:"#b6ffe8",minus:"#b06bff",plus:"#ffd65a",other:"#ffd65a"};
function plate8(li){const lw=document.querySelector(`#board [data-lane="${li}"] .locw`);if(!lw)return null;const r=lw.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,el:lw};}
function laneOf8(p){if(!p)return -1;const ls=document.querySelectorAll("#board [data-lane]");for(const ln of ls){const r=ln.getBoundingClientRect();if(p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom)return +ln.dataset.lane;}return -1;}
/* sức mạnh do chiến địa góp vào (đổi tạm sang Đồng Cỏ không hiệu ứng để so) */
function locGain8(inst,li){try{const L=G.locs[li];if(!L||!L.rvl||L.gone||L.id==="meadow")return 0;const v=E.power(G,inst,li),id=L.id;L.id="meadow";let w=v;try{w=E.power(G,inst,li);}finally{L.id=id;}return v-w;}catch(e){return 0;}}
function plan8(evA,R0,R1,P0,P1){S8=new Set();if(reduced||!G)return 0;const X=evA.x7||{},steps=[];
  const sev=evA.find(e=>e.k==="skill"||e.k==="act"),SRC=sev?sev.uid:((evA.find(e=>e.src>0&&e.k!=="loc")||{}).src||0);
  const W=u=>where7(u,R0,R1),abN=u=>{const c=anyC(u);return c?C[E.ab(c)]:null;};
  const stealT=new Set(evA.filter(e=>e.k==="abcopy"&&e.st).map(e=>e.from));
  for(const e of evA){
    if(e.k==="abcopy"&&e.from&&e.from!==e.uid){const sp=W(e.uid),tp=e.deck?DECKZ(((anyC(e.uid)||{}).side)||"p"):W(e.from);if(!sp||!tp)continue;const d=abN(e.uid);
      steps.push({k:e.st?"steal":"copy",src:e.uid,dst:e.from,sp,tp,abId:d?d.id:null});S8.add("c"+e.uid+"_"+e.from);if(e.st){S8.add("s"+e.from);seenSil.add(e.from);}}
    else if(e.k==="sil"&&!S8.has("s"+e.uid)&&!stealT.has(e.uid)){const tp=W(e.uid);if(!tp)continue;const src=e.src>0&&e.src!==e.uid?e.src:0,sp=src?W(src):null;
      steps.push({k:"sil",src:sp?src:0,dst:e.uid,sp,tp});S8.add("s"+e.uid);seenSil.add(e.uid);}
    else if(e.k==="destroy"&&e.src>0&&e.src!==e.uid&&R0.has(e.uid)){const sp=W(e.src),tp=R0.get(e.uid);if(!sp)continue;steps.push({k:"kill",src:e.src,dst:e.uid,sp,tp,r0:tp});S8.add("d"+e.uid);}
    else if(e.k==="summon"&&e.src>0&&e.src!==e.uid&&R1.has(e.uid)&&!evA.some(x=>x.k==="clone"&&x.uid===e.uid)){const sp=W(e.src),tp=R1.get(e.uid);if(!sp)continue;steps.push({k:"summon",src:e.src,dst:e.uid,sp,tp});S8.add("u"+e.uid);}
    else if(e.k==="tohand"&&e.src>0&&e.src!==e.uid&&R0.has(e.uid)){const sp=W(e.src),tp=R0.get(e.uid);if(!sp)continue;steps.push({k:"bounce",src:e.src,dst:e.uid,sp,tp,r0:tp,side:e.side});S8.add("h"+e.uid);}
    else if(e.k==="blocked"&&e.w==="d"){const f=E.find(G,e.uid);if(!f)continue;const L=G.locs[f.li];if(!L||!L.rvl||lcat8(L.id)!=="shield")continue;if(steps.some(s=>s.k==="lshield"&&s.li===f.li)){S8.add("k"+e.uid);continue;}
      const ln=document.querySelector(`#board [data-lane="${f.li}"]`);if(!ln)continue;const r=ln.getBoundingClientRect();steps.push({k:"lshield",src:0,dst:e.uid,li:f.li,sp:null,tp:{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}});S8.add("k"+e.uid);}
    else if(e.k==="loc"&&e.old!==undefined){const pl=plate8(e.li);if(!pl)continue;const sp=e.src>0?W(e.src):null;steps.push({k:"loc",src:sp?e.src:0,dst:0,li:e.li,sp,tp:pl,old:e.old,gone:!!e.gone,via:e.src>0?(anyC(e.src)||{}).id:null});S8.add("l"+e.li);}
  }
  try{plan9m(evA,R0,R1,steps,W);}catch(e){console.error(e);}
  (X.bp||[]).forEach(q=>{if(!SRC||SRC===q.u)return;const sp=W(SRC),tp=R1.get(q.u);if(!sp||!tp)return;steps.push({k:"reset",src:SRC,dst:q.u,sp,tp,v:q.v});S8.add("b"+q.u);S8.add("p"+q.u);});
  /* thay đổi sức mạnh: do thẻ nguồn, hoặc do chiến địa vừa chạy hiệu ứng */
  const lev=evA.filter(e=>e.k==="locfx"||(e.k==="loc"&&e.old===undefined));
  for(const [u,v] of P1){if(!P0.has(u)||S8.has("p"+u))continue;const d=v-P0.get(u);if(!d)continue;const tp=R1.get(u);if(!tp)continue;
    if(ONG29.has(u)){const v0=P0.get(u);steps.push({k:d>0?"up":"down",src:0,dst:u,sp:null,tp,d,dbl:v0>0&&v===v0*2,ong:1});S8.add("p"+u);continue;}
    /* gpu29: thẻ nguồn tự cộng/trừ sức mạnh bằng kỹ năng của chính nó: đổi số sau cùng, khi các đòn khác đã xong */
    if(SRC&&SRC===u){const v0=P0.get(u);steps.push({k:d>0?"up":"down",src:0,dst:u,sp:null,tp,d,dbl:v0>0&&v===v0*2,self29:1});S8.add("p"+u);continue;}
    if(SRC&&SRC!==u&&!(evA.x7&&evA.x7.bpU&&evA.x7.bpU.has(u))){const sp=W(SRC);if(!sp)continue;const v0=P0.get(u);steps.push({k:d>0?"up":"down",src:SRC,dst:u,sp,tp,d,dbl:v0>0&&v===v0*2});S8.add("p"+u);}
    else if(!SRC&&lev.length){const li=laneOf8(tp),le=lev.find(e=>e.li===li);if(!le)continue;const pl=plate8(li);if(!pl)continue;steps.push({k:d>0?"lplus":"lminus",src:0,dst:u,sp:pl,tp,d,li});S8.add("p"+u);}}
  /* thẻ vừa lật được chiến địa cộng/trừ sức mạnh */
  for(const e of evA)if(e.k==="flip"){const f=E.find(G,e.uid);if(!f||S8.has("p"+e.uid))continue;const g=locGain8(f.inst,f.li);if(!g)continue;const tp=R1.get(e.uid),pl=plate8(f.li);if(!tp||!pl)continue;steps.push({k:g>0?"lplus":"lminus",src:0,dst:e.uid,sp:null,tp,d:g,li:f.li,fl:1,ong:1});S8.add("p"+e.uid);}
  if(!steps.length)return 0;
  /* sắp lịch: tuần tự từng mục tiêu (đòn sau rời đi ~350ms sau khi đòn trước trúng); quá 4 mục tiêu thì gộp đợt để tổng không quá ~3 giây */
  const bk=s=>s.k==="steal"||s.k==="copy",dur=s=>s.k==="ult29"?s.T:s.k==="top"?topDur29(s):(s.k==="move"||s.k==="swap")?mvDur9(s):s.k==="loc"?T8.LIFT+620+700:s.k==="lshield"?1100:(s.sp?(s.nl?0:T8.LIFT)+T8.FLY:0)+T8.REACT+(bk(s)?T8.BACK:0),
    stg=s=>s.k==="ult29"?s.T+T8.GAP:s.k==="top"?topStg29(s):(s.k==="move"||s.k==="swap")?mvDur9(s)-200+T8.GAP:s.k==="lshield"?700:(s.sp?(s.nl?0:T8.LIFT)+T8.FLY:300)+T8.GAP+(bk(s)?T8.BACK+T8.REACT-80:0);
  const locs=steps.filter(s=>s.k==="loc"),rest=steps.filter(s=>s.k!=="loc");let t=0,T=0;
  const gk=s=>(s.k==="move"||s.k==="swap"||s.k==="lshield"||s.k==="top"||s.k==="ult29"||s.self29)?null:s.ong?"ong|"+s.k:(s.src>0?"u"+s.src:(s.li!=null?"L"+s.li:"x"))+"|"+(s.k==="lminus"?"lplus":s.k);
  const groups=[];for(const s of rest){const k=gk(s),g=groups[groups.length-1];if(k&&g&&g.k===k)g.s.push(s);else groups.push({k,s:[s]});}
  /* gpu35: các đòn đơn của CÙNG một thẻ nguồn (kể cả khác loại: +1 phe mình rồi −1 phe địch) đánh dồn một chuỗi, nhịp nhanh dần
     (240 -> 192 -> 154 -> … tối thiểu 110 ms gốc), không chờ đòn trước bay xong -> thẻ nhấc nhiều mục tiêu ≈ 1 s gốc thay vì 2–3 s */
  const simple=s=>s.src>0&&!s.ong&&!s.self29&&!bk(s)&&!/^(move|swap|top|ult29|lshield|loc|reset)$/.test(s.k),bGap=k=>Math.max(110,Math.round(240*Math.pow(.8,k-1)));let bSrc=0,bT=0,bK=0;
  for(const g of groups){const n=g.s.length,c={x:0,y:0,top:1e9};for(const s of g.s){c.x+=s.tp.x/n;c.y+=s.tp.y/n;c.top=Math.min(c.top,s.tp.y);}
    const s0=g.s[0];
    if(simple(s0)){if(bSrc!==s0.src){bSrc=s0.src;bK=0;}
      g.s.forEach((s,i)=>{s.t0=bK?bT+bGap(bK):t;bT=s.t0;bK++;if(n>1)s.grp={n,i,c,list:g.s};T=Math.max(T,s.t0+dur(s));});t=bT+stg(s0);continue;}
    bSrc=0;const stepGap=s0.ong?70:n<=4?380:230;
    g.s.forEach((s,i)=>{s.t0=t+i*stepGap;if(n>1)s.grp={n,i,c,list:g.s};T=Math.max(T,s.t0+dur(s));});t=Math.max(...g.s.map(s=>s.t0))+stg(s0);}
  t=rest.length?T+T8.GAP:0;
  for(const s of locs){s.t0=t;t+=dur(s)+T8.GAP;T=Math.max(T,s.t0+dur(s));}
  if(locs.length)T+=1200;
  for(const s of steps)pre8(s);
  for(const s of steps)fxT(()=>{try{run8(s);}catch(e){console.error(e);}},s.t0);
  if(locs.length)fxT(()=>{try{locBanner8(locs);}catch(e){}},T-1300);
  fxT(()=>{for(const s of steps)try{post8(s);}catch(e){}},T+220);
  holdFx(T+240);return T;}
/* trạng thái "trước" cho tới khi đòn tới nơi */
function pre8(s){
  if(s.k==="kill"||s.k==="bounce"){if(s.r0&&s.r0.html)s.ph=ghost(s.r0,s.r0.html,"ph8");if(s.k==="bounce"){const he=document.querySelector(`#hand [data-hc="${s.dst}"]`);if(he){he.style.opacity="0";s.he=he;}}}
  else if(s.k==="summon"){const el=tEl8(s.dst);if(el){el.style.opacity="0";s.hid=el;}}
  else if(s.k==="steal"||s.k==="sil"){const el=tEl8(s.dst);if(el&&el.classList.contains("sil")){el.classList.remove("sil");s.unsil=el;}}
  else if(s.k==="loc"){const pl=s.tp,lw=pl.el,o=LW0[s.li];if(lw&&o&&o.html){const d=document.createElement("div");d.className="lw8old";d.innerHTML=o.html;lw.appendChild(d);s.ov=d;}}}
function post8(s){if(s.ph)s.ph.remove();if(s.he)s.he.style.opacity="";if(s.hid)s.hid.style.opacity="";if(s.unsil)s.unsil.classList.add("sil");if(s.ov)s.ov.remove();}
function run8(s){const c=K8[s.k][0],sp=s.sp,tp=s.tp;let tImp=0;
  if(s.k==="lshield"){shieldLane8(s);return;}
  if(s.k==="loc"){locFx8(s);return;}
  if(sp){if(s.k==="lplus"||s.k==="lminus"){pulse(`#board [data-lane="${s.li}"] .locw`,[{transform:"scale(1)"},{transform:"scale(1.06)",offset:.4},{transform:"scale(1)"}],520);FX.glow(sp.x,sp.y,c,30,.5);}else lift8(s.src,sp,c);
    const L0=s.nl?0:T8.LIFT;if(s.k==="lplus"||s.k==="lminus")stream8(sp,tp,c,L0,T8.FLY);else fly8(sp,tp,K8[s.k][1],c,T8.FLY,L0);tImp=L0+T8.FLY;}
  fxT(()=>hit8(s),tImp);
  if((s.k==="steal"||s.k==="copy")&&sp)fxT(()=>{const cur=where7(s.src,null,rects())||sp,html=s.abId?liteId(s.abId):null;
    fly8(tp,cur,"card",c,T8.BACK,0,()=>{FX.ring(cur.x,cur.y,c,Math.min(40,(cur.w||50)*.6),3);FX.glow(cur.x,cur.y,c,30,.5);pulse(`#board [data-mc="${s.src}"]`,[{transform:"scale(1)"},{transform:"scale(1.14)",offset:.4},{transform:"scale(1)"}],520);
      const nm=s.abId&&C[s.abId]?C[s.abId].n:"";say(cur.x,sy8(cur),(s.k==="steal"?"CƯỚP KỸ NĂNG":"CHÉP KỸ NĂNG")+(nm?": "+(nm.length>14?nm.slice(0,13)+"…":nm):""),s.k==="steal"?"#e0b0ff":"#bff4ff");SFX.fam(s.k==="steal"?"steal":"copy",{el:elU(s.src)});},html);},tImp+T8.REACT-80);}
function pwKey(s){const d=s.d,up=d>0,a=Math.abs(d);if(s.dbl&&up)return"dbl";if(s.k==="lplus")return"locup";if(s.k==="lminus")return"locdn";return up?(a>=6?"up3":a>=3?"up2":"up1"):(a>=6?"dn3":a>=3?"dn2":"dn1");}
function sy8(p,up){const h=(p.h||70)*.58,bt=($("board")||document.body).getBoundingClientRect().top+18,y=p.y-h;return y<bt?p.y+h:y;}
function hit8(s){const c=K8[s.k][0],tp=s.tp,el=tEl8(s.dst),hy=sy8(tp);
  switch(s.k){
    case "steal":case "sil":{if(s.unsil){s.unsil.classList.add("sil");s.unsil=null;}if(el)anim(el,[{transform:"none"},{transform:"translateX(-4px) rotate(-3deg)",offset:.2},{transform:"translateX(4px) rotate(3deg)",offset:.45},{transform:"translateX(-2px)",offset:.7},{transform:"none"}],{duration:560,fill:"none"});
      mark8(tp,s.k);FX.shards(tp.x,tp.y,"#9aa3c7");say(tp.x,hy,K8[s.k][2],"#dfe5ff");SFX.fam(s.k==="steal"?"steal":"silence",{el:elU(s.src)});break;}
    case "copy":{if(el)anim(el,[{transform:"none"},{transform:"scale(1.1)",offset:.4},{transform:"none"}],{duration:520,fill:"none"});FX.ring(tp.x,tp.y,c,Math.min(40,(tp.w||50)*.6),3);say(tp.x,hy,K8[s.k][2],"#bff4ff");SFX.fam("copy",{el:elU(s.src)});break;}
    case "kill":{if(s.ph){s.ph.remove();s.ph=null;}CFX.destroy(s.r0);FX.blade(tp.x,tp.y,"#ff4d5e",(tp.w||50)*.6,-2.3,7);FX.ash(tp.x,tp.y,10);say(tp.x,hy,K8.kill[2],"#ff9aa8");SFX.fam("destroy",{el:elU(s.src)});break;}
    case "up":case "down":case "lplus":case "lminus":{const up=s.d>0;if(el)CFX[up?"buff":"debuff"](el,Math.abs(s.d));FX.glow(tp.x,tp.y,c,30,.45);
      say(tp.x,tp.y-(tp.h||70)*.2,(s.dbl?"×2":(up?"+":"−")+Math.abs(s.d))+(s.k[0]==="l"?" (chiến địa)":""),up?(s.k==="lplus"?"#ffe08a":"#7dffb0"):(s.k==="lminus"?"#d9a6ff":"#ff9aa8"));SFX.fam(pwKey(s),{el:elU(s.src)});break;}
    case "summon":{if(s.hid){s.hid.style.opacity="";s.hid=null;}if(el)CFX.summon(el,c);say(tp.x,hy,K8.summon[2],"#c8ff9a");SFX.fam("summon",{el:elU(s.src)});break;}
    case "bounce":{if(s.ph){s.ph.remove();s.ph=null;}const he=s.he,dst=s.side==="p"?(he?ctr(he):zpt("hand")):zpt("avFoe");const r=s.r0;
      if(r&&dst)chip(r,{x:dst.x,y:dst.y,w:40,h:56},lite(s.dst)||r.html,()=>{if(he){he.style.opacity="";s.he=null;pulse(`#hand [data-hc="${s.dst}"]`,[{transform:"scale(1)"},{transform:"scale(1.15) translateY(-8px)",offset:.4},{transform:"scale(1)"}],480);}FX.ring(dst.x,dst.y,c,30,3);});else if(he){he.style.opacity="";s.he=null;}
      say(tp.x,hy,K8.bounce[2],"#ffd6f0");SFX.fam("bounce",{el:elU(s.src)});break;}
    case "reset":{pulse(`#board [data-mc="${s.dst}"] .pwh`,[{transform:"scale(1)"},{transform:"scale(2)",offset:.35},{transform:"scale(1)"}],600);FX.ring(tp.x,tp.y,c,Math.min(40,(tp.w||50)*.6),3);say(tp.x,tp.y-(tp.h||70)*.2,"= "+s.v,"#ffe08a");SFX.fam("morph",{el:elU(s.src)});break;}
  }}
/* chiến địa bảo vệ: khiên lớn che ô */
const LSHD8=`<svg viewBox="-50 -60 100 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M0-56L44-40V2C44 32 23 48 0 58C-23 48-44 32-44 2V-40Z" fill="rgba(120,200,255,.20)" stroke="#bfe8ff" stroke-width="4" stroke-linejoin="round"/><path d="M0-44L32-32V1C32 23 17 36 0 44C-17 36-32 23-32 1V-32Z" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/><path d="M-14 0L-3 11L16-12" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function laneBox8(li,cls){const ln=document.querySelector(`#board [data-lane="${li}"]`);if(!ln)return null;const r=ln.getBoundingClientRect(),d=document.createElement("div");d.className="lx8 "+(cls||"");d.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;document.body.appendChild(d);return d;}
function shieldLane8(s){if(reduced)return;playV16("khien_chan",s.tp.x,s.tp.y,Math.max(156,Math.min(s.tp.w*.95,210)),640,60);const d=laneBox8(s.li,"lsh8");if(!d)return;d.innerHTML=`<i class="lsg"></i>`+LSHD8;fxT(()=>d.remove(),1250);const L=G.locs[s.li];
  say(s.tp.x,s.tp.y-s.tp.h*.32,"CHIẾN ĐỊA BẢO VỆ","#bfe8ff",200);say(s.tp.x,s.tp.y+s.tp.h*.3,"KHÔNG BỊ HUỶ","#ffffff",420);SFX.fam("shield",{el:"cokhi"});}
/* hiệu ứng chiến địa không đổi sức mạnh: hình riêng theo loại, gọn trong làn */
function locfx8(ev,R0,R1,evA){if(reduced)return false;const L=G.locs[ev.li];if(!L)return false;const cat=lcat8(L.id),c=LCAT_C[cat]||"#ffd65a",pl=plate8(ev.li);if(!pl)return false;
  const inLane=u=>{const p=R0.get(u)||R1.get(u);return p&&laneOf8(p)===ev.li;};
  const kills=evA.filter(e=>e.k==="destroy"&&inLane(e.uid)&&!S8.has("d"+e.uid)),sums=evA.filter(e=>e.k==="summon"&&R1.has(e.uid)&&laneOf8(R1.get(e.uid))===ev.li),movs=evA.filter(e=>e.k==="move"&&R0.has(e.uid)&&laneOf8(R0.get(e.uid))===ev.li);
  const X=evA.x7||{},hn=(X.hnew&&(X.hnew.p.length+X.hnew.a.length))||0,draws=evA.filter(e=>e.k==="tohand").length+hn,en=G.energy.p!==EN0.p||G.energy.a!==EN0.a;
  let any=false;const kind=kills.length?"kill":sums.length?"summon":movs.length?"move":draws?"draw":en?"energy":null;if(!kind)return false;
  pulse(`#board [data-lane="${ev.li}"] .locw`,[{transform:"scale(1)"},{transform:"scale(1.06)",offset:.4},{transform:"scale(1)"}],520);FX.glow(pl.x,pl.y,LCAT_C[kind],30,.5);
  const d=laneBox8(ev.li,"lk8 lk8-"+kind);if(d){d.style.setProperty("--c",LCAT_C[kind]);d.innerHTML=`<i></i>`;fxT(()=>d.remove(),1300);}any=true;
  if(kind==="kill"){kills.slice(0,6).forEach((e,i)=>{const p=R0.get(e.uid);if(p)fxT(()=>{FX.blade(p.x,p.y,"#ff4d5e",(p.w||50)*.55,-2.3,6);},200+i*120);});say(pl.x,pl.y+pl.h*.9,"CHIẾN ĐỊA TIÊU HUỶ","#ff9aa8",250);}
  else if(kind==="summon"){sums.slice(0,6).forEach((e,i)=>{const p=R1.get(e.uid);if(p)stream8(pl,p,"#8fdc4a",i*120,420);});say(pl.x,pl.y+pl.h*.9,"CHIẾN ĐỊA TRIỆU HỒI","#c8ff9a",300);}
  else if(kind==="move"){say(pl.x,pl.y+pl.h*.9,"CHIẾN ĐỊA DỜI THẺ","#b6ffe8",250);}
  else if(kind==="draw"){for(const s of E.SIDES){const n=evA.filter(e=>e.k==="tohand"&&e.side===s).length+((X.hnew&&X.hnew[s].length)||0);if(!n)continue;const dst=s==="p"?zpt("hand"):zpt("avFoe");for(let i=0;i<Math.min(3,n);i++)fly8(pl,dst,"card","#9fd8ff",480,i*140,null,BACK7());}say(pl.x,pl.y+pl.h*.9,"CHIẾN ĐỊA CHO BÀI","#bfe8ff",250);}
  else if(kind==="energy"){const o=ctr($("orb"));fly8(pl,o,"bolt","#7fe0ff",500,0,()=>{FX.glow(o.x,o.y,"#7fe0ff",30,.5);pulse("#orb",[{transform:"scale(1)"},{transform:"scale(1.3)",offset:.4},{transform:"scale(1)"}],420);});say(pl.x,pl.y+pl.h*.9,"CHIẾN ĐỊA CHO NĂNG LƯỢNG","#bff4ff",250);}
  FXHOLD=Math.max(FXHOLD,1200);return any;}
/* thẻ tác động lên chiến địa: vật thể bay vào biển chiến địa -> nứt -> đổi -> băng thông báo */
const LOCX8={kiemnuuminh:"sword",kenuotsao:"meteor",quandoanmotnguoi:"bolt",hongphuthuy:"bolt",hienthanvangioi:"bolt",dathuc:"meteor",dakhuc:"bolt"};
function locFx8(s){const pl=s.tp,sp=s.sp,type=LOCX8[s.via]||"bolt",c=type==="sword"?"#c45cff":type==="meteor"?"#ff8a2b":"#7fe0ff";let t=0;
  if(sp){lift8(s.src,sp,c);fly8(sp,{x:pl.x,y:pl.y},type,c,type==="sword"?620:560,T8.LIFT);t=T8.LIFT+(type==="sword"?620:560);}
  fxT(()=>{const d=document.createElement("div"),r=pl.el.getBoundingClientRect();d.className="lc8";d.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;--c:${c}`;
    d.innerHTML=`<svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M50 30L40 4M50 30L66 2M50 30L88 22M50 30L82 56M50 30L44 58M50 30L12 50M50 30L8 16M40 4L30 0M66 2L74 10M88 22L100 18M12 50L2 46" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M50 30L40 4M50 30L66 2M50 30L88 22M50 30L82 56M50 30L44 58M50 30L12 50M50 30L8 16" stroke="${c}" stroke-width="5" opacity=".35" fill="none"/></svg>`;
    document.body.appendChild(d);fxT(()=>d.remove(),900);if(type==="sword")FX.blade(pl.x,pl.y,"#c45cff",pl.w*.4,-2.2,8);else if(type==="bolt")FX.bolts(pl.x,pl.y,"#bff4ff",6,30);else FX.ash(pl.x,pl.y,12);
    FX.glow(pl.x,pl.y,c,34,.5);SFX.play(type==="sword"?"slash":"boom");
    if(s.ov){const o=s.ov;const a=o.animate([{transform:"none",opacity:1},{transform:"scale(1.04)",opacity:1,offset:.3},{transform:"scale(.9) rotate(-2deg)",opacity:0}],{duration:520,delay:260,easing:"ease-in",fill:"forwards"});a.onfinish=()=>o.remove();fxT(()=>o.remove(),1000);s.ov=null;}
    fxT(()=>{pulse(`#board [data-lane="${s.li}"] .locw`,[{transform:"scale(.86)",opacity:.4},{transform:"scale(1.06)",opacity:1,offset:.6},{transform:"scale(1)"}],520);SFX.fam("locx",{el:elU(s.src)});},520);},t);}
function locBanner8(ls){if(reduced)return;document.querySelectorAll(".bn8").forEach(e=>e.remove());const nm=id=>id&&id!=="?"&&LOC[id]?LOC[id].n:"Chiến địa ẩn",gone=ls.every(s=>s.gone);
  const lines=ls.slice(0,3).map(s=>s.gone?esc(nm(s.old)):`${esc(nm(s.old))} <i>→</i> ${esc(nm(G.locs[s.li].id))}`);
  const b=document.createElement("div");b.className="bn8"+(gone?" gone":"");b.innerHTML=`<b>${gone?"CHIẾN ĐỊA BỊ HUỶ":"CHIẾN ĐỊA THAY ĐỔI"}</b><small>${lines.join("<br>")}</small>`;document.body.appendChild(b);fxT(()=>b.remove(),1500);SFX.fam("locrev",{vol:.6,el:null});}

/* ===== v9: hào quang có ấn ký, thân thẻ tự diễn ===== */
let SD0=new Map();
/* V9-3: chiêu riêng – khi có ảnh IMGS.v[img] thì vật thể bay dùng ảnh riêng */
const SIGV={"kiemnuuminh":{"img":"kiemnuuminh","kieu":"phong"},"nuloithan":{"img":"nuloithan","kieu":"giang"},"tonu":{"img":"tonu","kieu":"keo"},"nuthantien":{"img":"nuthantien","kieu":"phong"},"bangca":{"img":"bangca","kieu":"giang"},"kenuotsao":{"img":"kenuotsao","kieu":"giang"},"maynuotthoigian":{"img":"maynuotthoigian","kieu":"giang"},"nghichtuvuong":{"img":"nghichtuvuong","kieu":"giang"},"nuloimienvien":{"img":"nuloimienvien","kieu":"giang"},"thuanung":{"img":"thuanung","kieu":"giang"},"satvuong":{"img":"satvuong","kieu":"giang"},"baonu":{"img":"baonu","kieu":"giang"},"channu":{"img":"channu","kieu":"giang"},"bavuongmienvien":{"img":"bavuongmienvien","kieu":"phong"},"aosi":{"img":"aosi","kieu":"phong"},"baochuahauthe":{"img":"baochuahauthe","kieu":"phong"},"chonvacay":{"img":"chonvacay","kieu":"phong"},"chutruongnu":{"img":"chutruongnu","kieu":"phong"},"dakhuc":{"img":"dakhuc","kieu":"phong"},"docnutrang":{"img":"docnutrang","kieu":"phong"},"hongtam":{"img":"hongtam","kieu":"phong"},"huyetmenu":{"img":"huyetmenu","kieu":"phong"},"kiemquyen":{"img":"kiemquyen","kieu":"phong"},"kysidichkhuyen":{"img":"kysidichkhuyen","kieu":"phong"},"langthan":{"img":"langthan","kieu":"phong"},"matocvutru":{"img":"matocvutru","kieu":"phong"},"namtuocmatna":{"img":"namtuocmatna","kieu":"phong"},"nhannhenquai":{"img":"nhannhenquai","kieu":"phong"},"nhendotham":{"img":"nhendotham","kieu":"phong"},"nuhongtam":{"img":"nuhongtam","kieu":"phong"},"phonglinhnu":{"img":"phonglinhnu","kieu":"phong"},"saotrongdau":{"img":"saotrongdau","kieu":"phong"},"tamlinhtu":{"img":"tamlinhtu","kieu":"phong"},"thetdich":{"img":"thetdich","kieu":"phong"},"thuyhau":{"img":"thuyhau","kieu":"phong"},"tieulong":{"img":"tieulong","kieu":"phong"},"virutcosinh":{"img":"virutcosinh","kieu":"phong"},"hoavatnu":{"img":"hoavatnu","kieu":"phong"},"longbattu":{"img":"longbattu","kieu":"phong"},"bachho":{"img":"bachho","kieu":"phong"},"mehoacnu":{"img":"mehoacnu","kieu":"phong"},"quyensu":{"img":"quyensu","kieu":"phong"},"cohoang":{"img":"cohoang","kieu":"phong"},"cunemthantoc":{"img":"cunemthantoc","kieu":"phong"},"linhgaccuoi":{"img":"linhgaccuoi","kieu":"phong"},"bangvuong":{"img":"bangvuong","kieu":"phong"},"cotnu":{"img":"cotnu","kieu":"phong"},"cucquang":{"img":"cucquang","kieu":"quet"},"culongco":{"img":"culongco","kieu":"quet"},"hongve":{"img":"hongve","kieu":"quet"},"kysivuottu":{"img":"kysivuottu","kieu":"quet"},"tuthanmienvien":{"img":"tuthanmienvien","kieu":"quet"},"quangpho":{"img":"quangpho","kieu":"quet"},"nhennu":{"img":"nhennu","kieu":"quet"},"thukieu":{"img":"thukieu","kieu":"quet"},"batkhacan":{"img":"batkhacan","kieu":"quet"},"kiemlongnhan":{"img":"kiemlongnhan","kieu":"quet"},"tutraonu":{"img":"tutraonu","kieu":"quet"},"bato":{"img":"bato","kieu":"keo"},"huyetdichhangxom":{"img":"huyetdichhangxom","kieu":"keo"},"nhenhacdich":{"img":"nhenhacdich","kieu":"keo"},"nhenngaymoi":{"img":"nhenngaymoi","kieu":"keo"},"nhennon":{"img":"nhennon","kieu":"keo"},"batty":{"img":"batty","kieu":"keo"},"nhennhan":{"img":"nhennhan","kieu":"keo"},"phongnu":{"img":"phongnu","kieu":"keo"},"tunu":{"img":"tunu","kieu":"keo"},"chomay":{"img":"chomay","kieu":"nem_vong"},"cuongdomienvien":{"img":"cuongdomienvien","kieu":"nem_vong"},"kysibaitu":{"img":"kysibaitu","kieu":"nem_vong"},"kysinguyetyeu":{"img":"kysinguyetyeu","kieu":"nem_vong"},"nhennoiloan":{"img":"nhennoiloan","kieu":"nem_vong"},"thachquaisokhai":{"img":"thachquaisokhai","kieu":"nem_vong"},"thiettam":{"img":"thiettam","kieu":"nem_vong"},"hongphuthuy":{"img":"hongphuthuy","kieu":"nem_vong"},"songchuynu":{"img":"songchuynu","kieu":"nem_vong"},"socnu":{"img":"socnu","kieu":"nem_vong"},"baithu":{"img":"baithu","kieu":"nem_vong"},"daudanthieunu":{"img":"daudanthieunu","kieu":"nem_vong"},"phonghiem":{"img":"phonghiem","kieu":"nem_vong"}};/* vd: SIGV.kiemnuuminh={img:"v_kiemnuuminh",kieu:"chem"} – kieu: phong|giang|quet|keo|chem */
/* ---- ấn ký theo loại kỹ năng ---- */
const BADGE9={
  flag:`<svg viewBox="0 0 20 20"><path d="M6 3.5v13.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M6.8 4h8.4l-2.4 3 2.4 3H6.8z" fill="var(--c1)" stroke="#fff" stroke-width=".9" stroke-linejoin="round"/></svg>`,
  chain:`<svg viewBox="0 0 20 20"><g fill="none" stroke-width="2.2"><rect x="2.5" y="7" width="8" height="5.4" rx="2.7" stroke="var(--c1)" transform="rotate(-35 6.5 9.7)"/><rect x="9.5" y="7.6" width="8" height="5.4" rx="2.7" stroke="#fff" transform="rotate(-35 13.5 10.3)"/></g></svg>`,
  shield:`<svg viewBox="0 0 20 20"><path d="M10 2.5l6 2.2v5c0 3.6-2.6 5.8-6 7.3-3.4-1.5-6-3.7-6-7.3v-5z" fill="var(--c1)" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/><path d="M7.3 10l2 2 3.6-4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  lock:`<svg viewBox="0 0 20 20"><path d="M6.8 9V6.8a3.2 3.2 0 0 1 6.4 0V9" fill="none" stroke="#fff" stroke-width="1.8"/><rect x="4.8" y="8.8" width="10.4" height="8" rx="1.6" fill="var(--c1)" stroke="#fff" stroke-width="1"/><circle cx="10" cy="12.6" r="1.3" fill="#fff"/></svg>`,
  gem:`<svg viewBox="0 0 20 20"><path d="M10 2.8l5.6 6.2L10 17.2 4.4 9z" fill="var(--c1)" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/><path d="M4.4 9h11.2M10 2.8L7.6 9 10 17.2 12.4 9z" fill="none" stroke="#fff" stroke-width=".7" opacity=".8"/></svg>`,
  twin:`<svg viewBox="0 0 20 20"><g fill="none" stroke-width="2"><circle cx="7.6" cy="10" r="4.4" stroke="var(--c1)"/><circle cx="12.4" cy="10" r="4.4" stroke="#fff"/></g></svg>`,
  eye:`<svg viewBox="0 0 20 20"><path d="M2.6 10Q10 2.8 17.4 10Q10 17.2 2.6 10z" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="10" cy="10" r="3.2" fill="var(--c1)"/><circle cx="10" cy="10" r="1.3" fill="#05061a"/></svg>`};
const AK9C={};
function akind9(id){if(AK9C[id])return AK9C[id];const t=((C[id]&&C[id].x)||"").toLowerCase();let k="eye";
  if(/không (thể )?đặt|không được đặt|cấm đặt|bị khoá|khoá/.test(t))k="lock";
  else if(/không thể bị|không bị|miễn nhiễm|bảo vệ/.test(t))k="shield";
  else if(/nhân đôi|gấp đôi|lặp lại|chạy 2 lần|hai lần/.test(t))k="twin";
  else if(/năng lượng|tốn /.test(t))k="gem";
  else if(/(địch|đối thủ)/.test(t)&&/(−|-\s?\d|trừ|giảm|mất)/.test(t))k="chain";
  else if(/\+\s?\d|tăng|cộng/.test(t))k="flag";
  return AK9C[id]=k;}
function acol9(id){const h=lhash(id),hue=(h>>>4)%360,h2=(hue+40+((h>>>13)%5)*35)%360,el=elOf(id);return [el?ELD[el][0]:`hsl(${hue} 95% 64%)`,el?ELD[el][1]:`hsl(${h2} 95% 76%)`];}
function badgeHTML9(id,cls){const [c1,c2]=acol9(id),k=akind9(id);return `<span class="ak9 ak9-${k}${cls?" "+cls:""}" style="--c1:${c1};--c2:${c2}" aria-hidden="true">${BADGE9[k]}</span>`;}
/* thẻ Duy Trì: viền 3px + đốm sáng chạy chậm quanh mép + ấn ký góc trái trên */
/* ---- sợi sáng tới các thẻ đang chịu ảnh hưởng ---- */
function affected9(uid){const f=E.find(G,uid);if(!f||f.inst.sil)return [];const s=f.inst,all=[];for(let i=0;i<3;i++)for(const sd of E.SIDES)for(const c of G.locs[i].cards[sd])if(c.rev&&c!==s)all.push([c,i]);
  const base=all.map(([c,i])=>E.power(G,c,i)),out=[];s.sil=true;try{all.forEach(([c,i],k)=>{if(E.power(G,c,i)!==base[k])out.push(c.uid);});}catch(e){}finally{s.sil=false;}return out;}
function threads9(uid,dl){if(reduced||!G)return;fxT(()=>{try{const sp=srcPt(uid);if(!sp)return;const c=anyC(uid);if(!c||c.sil)return;const id=E.ab(c)||c.id,col=acol9(id)[0];
  affected9(uid).slice(0,8).forEach((u,i)=>{const el=document.querySelector(`#board [data-mc="${u}"]`);if(!el)return;const t=ctr(el),dx=t.x-sp.x,dy=t.y-sp.y,L=Math.hypot(dx,dy);if(L<8)return;
    const d=document.createElement("div");d.className="th9";d.style.cssText=`left:${sp.x}px;top:${sp.y}px;width:${L}px;--a:${Math.atan2(dy,dx)}rad;--c:${col};animation-delay:${i*70}ms`;document.body.appendChild(d);fxT(()=>d.remove(),1300+i*70);
    fxT(()=>{FX.ring(t.x,t.y,col,Math.min(30,el.getBoundingClientRect().width*.45),2);pulse(`#board [data-mc="${u}"]`,[{transform:"scale(1)"},{transform:"scale(1.06)",offset:.4},{transform:"scale(1)"}],420);},330+i*70);});}catch(e){}},dl||0);}
function post9(evA){if(reduced||1)return;/* gpu29(c): Duy Trì chỉ hiện trên thẻ bị ảnh hưởng, không vẽ sợi/đạo cụ từ thẻ nguồn */for(const e of evA)if(e.k==="flip"){const c=anyC(e.uid);if(c&&!c.sil&&C[E.ab(c)]&&C[E.ab(c)].t==="on")threads9(e.uid,820);}}
/* ---- bước đi của thân thẻ (chỉ transform/opacity trên bản sao) ---- */
function hide9(el,h){if(!el)return;const ps=el.parentElement,xs=[el];if(ps)ps.querySelectorAll(":scope>.au9,:scope>.au9r,:scope>.ak9,:scope>.au10,:scope>.au10g,:scope>.kh11").forEach(x=>xs.push(x));xs.forEach(x=>x.style.opacity=h?"0":"");}
const mcEl9=u=>u>0?document.querySelector(`#board [data-mc="${u}"]`):null;
function ghostOf9(r,uid){const H=HERO.uid&&HERO.uid===uid&&HERO.g?HERO:null;if(H&&r)r={x:r.x,y:r.y,w:r.w*H.s,h:r.h*H.s,html:r.html};const el=mcEl9(uid),g=ghost(r,el?cleanCloneHTML(el):((r&&r.html)||lite(uid)||""),"g9");
  if(H){g.classList.add("g9h");H.g.style.opacity="0";heroWatch(H);}return g;}
function pop9(el,s,ms){if(el)anim(el,[{transform:"none"},{transform:`scale(${s})`,offset:.4},{transform:"none"}],{duration:ms||420,fill:"none"});}
function shout9(el,p,c){pop9(el,1.25,440);if(p)FX.glow(p.x,p.y,c,Math.min(32,(p.w||50)*.5),.5);}
function swing9(el,p,c){if(el)anim(el,[{transform:"none"},{transform:"rotate(-14deg) scale(1.1)",offset:.35},{transform:"rotate(16deg) scale(1.12)",offset:.65},{transform:"none"}],{duration:620,fill:"none"});if(p)FX.glow(p.x,p.y,c,Math.min(32,(p.w||50)*.5),.5);}
/* thẻ nguồn lao tới đích rồi lùi về (cướp/chép mang theo ấn ký) */
function lunge9(s,el,sp,tp,L0){const g=ghostOf9(sp,s.src);hide9(el,1);s.hidSrc=el;g.style.zIndex="19";
  const dx=tp.x-sp.x,dy=tp.y-sp.y,f=Math.max(.5,1-((tp.w||50)*.95)/Math.max(1,Math.hypot(dx,dy))),lx=dx*f,ly=dy*f,tl=dx>=0?8:-8,bk=s.k==="steal"||s.k==="copy";
  const hold=bk?T8.REACT-80:200,back=bk?T8.BACK:380,tot=L0+T8.FLY+hold+back,o=v=>Math.min(1,v/tot);
  const a=g.animate([{transform:"none",offset:0},{transform:"translateY(-6px) scale(1.12)",offset:o(L0)},{transform:`translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px) scale(1.1) rotate(${tl}deg)`,offset:o(L0+T8.FLY)},
    {transform:`translate(${(lx*.9).toFixed(1)}px,${(ly*.9).toFixed(1)}px) scale(1.06) rotate(${-tl/2}deg)`,offset:o(L0+T8.FLY+hold)},{transform:"none",offset:1}],{duration:tot,easing:"cubic-bezier(.5,0,.35,1)",fill:"both"});
  if(bk)fxT(()=>{const id=s.abId||((anyC(s.dst)||{}).id);if(!id||!C[id])return;g.insertAdjacentHTML("beforeend",badgeHTML9(id,"ak9g"));if(s.tb&&s.k==="steal"){s.tb.remove();s.tb=null;}},L0+T8.FLY+120);
  let done=0;const fin=()=>{if(done)return;done=1;g.remove();hide9(el,0);s.hidSrc=null;if(bk){const cur=ctr(el),nm=s.abId&&C[s.abId]?C[s.abId].n:"";pop9(el,1.16,480);FX.ring(cur.x,cur.y,K8[s.k][0],Math.min(40,(sp.w||50)*.6),3);
      say(cur.x,sy8({x:cur.x,y:cur.y,h:sp.h}),(s.k==="steal"?"CƯỚP KỸ NĂNG":"CHÉP KỸ NĂNG")+(nm?": "+(nm.length>14?nm.slice(0,13)+"…":nm):""),s.k==="steal"?"#e0b0ff":"#bff4ff");SFX.fam(s.k==="steal"?"steal":"copy",{el:elU(s.src)});}};
  a.onfinish=fin;fxT(fin,tot+150);}
const _run8=run8;
run8=function(s){const c=K8[s.k][0],sp=s.sp,tp=s.tp;
  if(s.k==="move"||s.k==="swap"){move9(s);return;}
  const el=mcEl9(s.src),body=!!(el&&sp&&(s.k==="kill"||s.k==="steal"||s.k==="copy"));
  if(!body&&!(sp&&(s.k==="up"||s.k==="down"||s.k==="sil"))){const im=sp&&sigImg9(s.src);if(!im)return _run8(s);}
  const L0=s.nl?0:T8.LIFT;
  if(body)lunge9(s,el,sp,tp,L0);
  else{if(s.k==="up"||s.k==="down")shout9(el,sp,c);else if(s.k==="sil")swing9(el,sp,c);else lift8(s.src,sp,c);const im=sigImg9(s.src);fly8(sp,tp,im?"img":projType9(s),c,T8.FLY,L0,null,im||undefined);}
  fxT(()=>hit8(s),L0+T8.FLY);};
const _pre8=pre8;
pre8=function(s){
  if(s.k==="move"||s.k==="swap"){const el=mcEl9(s.dst);if(el){hide9(el,1);s.hid=el;}if(s.r0)s.ph=ghostOf9(s.r0,s.dst);return;}
  _pre8(s);
  if(s.k==="steal"||s.k==="sil"){const t=anyC(s.dst),id=t?(E.ab(t)||t.id):null;if(id&&C[id]&&C[id].t!=="none"&&s.tp){const w=Math.max(12,(s.tp.w||46)*.3),d=document.createElement("div");d.className="tb9";
    const w2=Math.max(12,Math.min(22,(s.tp.w||46)*.3));d.style.cssText=`left:${s.tp.x-(s.tp.w||46)*.48}px;top:${s.tp.y+(s.tp.h||64)/2-w2/2}px;width:${w2}px;height:${w2}px`;d.innerHTML=badgeHTML9(id);document.body.appendChild(d);s.tb=d;}}};
const _post8=post8;
post8=function(s){_post8(s);if(s.tb)s.tb.remove();if(s.hidSrc)hide9(s.hidSrc,0);if(s.hid)hide9(s.hid,0);};
function stepNum9(el,d){const pw=el&&el.querySelector(".pwh");if(!pw)return;const v1=parseInt(pw.textContent,10);if(isNaN(v1)||!d)return;const n=Math.min(Math.abs(d),8),v0=v1-d;
  for(let i=0;i<=n;i++)fxT(()=>{if(pw.isConnected)pw.textContent=Math.round(v0+d*i/n);},i*70);}
const _hit8=hit8;
hit8=function(s){const c=K8[s.k][0],tp=s.tp,el=tEl8(s.dst);
  switch(s.k){
    case "steal":case "sil":{const un=s.unsil;s.unsil=null;
      if(s.tb){if(s.k==="sil"){const b=s.tb;s.tb=null;const r=b.getBoundingClientRect();for(let i=0;i<4;i++){const p=b.cloneNode(true);p.style.clipPath=["inset(0 50% 50% 0)","inset(0 0 50% 50%)","inset(50% 50% 0 0)","inset(50% 0 0 50%)"][i];document.body.appendChild(p);
          const a=p.animate([{transform:"none",opacity:1},{transform:`translate(${[-1,1,-1,1][i]*16}px,${[-1,-1,1,1][i]*14+10}px) rotate(${[-40,40,-25,30][i]}deg)`,opacity:0}],{duration:560,easing:"ease-in",fill:"forwards"});a.onfinish=()=>p.remove();fxT(()=>p.remove(),700);}b.remove();}}
      if(el)anim(el,[{transform:"none"},{transform:"translateX(-4px) rotate(-3deg)",offset:.15},{transform:"translateX(3px) rotate(2deg)",offset:.3},{transform:"translateY(5px) rotate(3deg) scale(.95)",offset:.6},{transform:"translateY(5px) rotate(3deg) scale(.95)",offset:.85},{transform:"none"}],{duration:640,fill:"none"});
      fxT(()=>{if(un)un.classList.add("sil");},440);
      mark8(tp,s.k);FX.shards(tp.x,tp.y,"#9aa3c7");say(tp.x,sy8(tp),K8[s.k][2],"#dfe5ff");SFX.fam(s.k==="steal"?"steal":"silence",{el:elU(s.src)});break;}
    case "up":case "down":case "lplus":case "lminus":{const up=s.d>0;if(typeof window.playV16==="function")window.playV16(s.dbl?"nhan_doi":up?"tang_suc":"giam_suc",tp.x,tp.y,Math.max(96,(tp.w||52)*1.85),500,0);holdFx(520);
      if(el)anim(el,[{transform:"none"},{transform:`scale(${up?1.15:.88})`,offset:.35},{transform:"none"}],{duration:420,fill:"none"});stepNum9(el,s.d);FX.glow(tp.x,tp.y,c,30,.45);
      say(tp.x,tp.y-(tp.h||70)*.2,(s.dbl?"×2":(up?"+":"−")+Math.abs(s.d))+(s.k[0]==="l"?" (chiến địa)":""),up?(s.k==="lplus"?"#ffe08a":"#7dffb0"):(s.k==="lminus"?"#d9a6ff":"#ff9aa8"));SFX.fam(pwKey(s),{el:elU(s.src)});break;}
    case "summon":{const h=s.hid;s.hid=null;if(!h){_hit8(s);break;}const g=ghost(tp,cleanCloneHTML(h)||lite(s.dst),"g9");
      const a=g.animate([{transform:"translateY(-150px) scale(1.12)",opacity:0},{opacity:1,offset:.25},{transform:"translateY(0) scale(1)",offset:.72},{transform:"translateY(-7px) scale(1.02)",offset:.86},{transform:"none",opacity:1}],{duration:560,easing:"cubic-bezier(.5,0,.75,.4)",fill:"both"});
      fxT(()=>{FX.dust(tp.x,tp.y+(tp.h||70)*.45,"#d8c8a0");const ln=h.closest("[data-lane]");if(ln)anim(ln,[{transform:"none"},{transform:"translateY(2px)",offset:.3},{transform:"translateY(-1px)",offset:.6},{transform:"none"}],{duration:240,fill:"none"});SFX.fam("summon",{el:elU(s.src)});},400);
      const fin=()=>{g.remove();h.style.opacity="";};a.onfinish=fin;fxT(fin,700);say(tp.x,sy8(tp),K8.summon[2],"#c8ff9a",380);break;}
    case "bounce":{if(s.ph){s.ph.remove();s.ph=null;}const he=s.he,r=s.r0;let dst=null;if(s.side==="p"&&he){const b=he.getBoundingClientRect();dst={x:b.left+b.width/2,y:b.top+b.height/2,w:b.width};}else{const z=zpt(s.side==="p"?"hand":"avFoe");if(z)dst={x:z.x,y:z.y,w:(r&&r.w||50)*.3};}
      if(r&&dst){const g=ghostOf9(r,s.dst),dx=dst.x-r.x,dy=dst.y-r.y,sc=Math.max(.25,Math.min(1.6,dst.w/(r.w||50)));
        const a=g.animate([{transform:"none"},{transform:"translateY(-10px) scale(1.08)",offset:.18},{transform:`translate(${dx*.5}px,${dy*.5-60}px) scale(${(1+sc)/2}) rotate(${dx>0?-10:10}deg)`,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(${sc})`}],{duration:620,easing:"cubic-bezier(.45,.05,.4,1)",fill:"both"});
        const fin=()=>{g.remove();if(he){he.style.opacity="";s.he=null;pop9(he,1.15,420);}FX.ring(dst.x,dst.y,c,26,3);};a.onfinish=fin;fxT(fin,800);}else if(he){he.style.opacity="";s.he=null;}
      say(tp.x,sy8(tp),K8.bounce[2],"#ffd6f0");SFX.fam("bounce",{el:elU(s.src)});break;}
    default:_hit8(s);
  }};
/* di chuyển / đổi bên: thẻ nhấc lên bay cong, đáp có bụi và nảy; bị đẩy thì trượt theo quán tính */
function move9(s){const r0=s.r0,r1=s.tp,h=s.hid,ph=s.ph;if(!r0||!r1){if(h)h.style.opacity="";if(ph)ph.remove();return;}let t=0;
  const sel=mcEl9(s.src);if(s.sp&&sel){const g=ghostOf9(s.sp,s.src);hide9(sel,1);const dx=r0.x-s.sp.x,dy=r0.y-s.sp.y,f=Math.max(.3,1-((r0.w||50)*.9)/Math.max(1,Math.hypot(dx,dy)));
    const a=g.animate([{transform:"none"},{transform:"translateY(-5px) scale(1.1)",offset:.3},{transform:`translate(${dx*f}px,${dy*f}px) scale(1.08)`,offset:.6},{transform:"none"}],{duration:T8.LIFT+T8.FLY+300,easing:"cubic-bezier(.5,0,.4,1)",fill:"both"});
    const fin=()=>{g.remove();hide9(sel,0);};a.onfinish=fin;fxT(fin,T8.LIFT+T8.FLY+500);t=T8.LIFT+T8.FLY*.6;}
  fxT(()=>{if(!ph){if(h)h.style.opacity="";return;}const dx=r1.x-r0.x,dy=r1.y-r0.y;let kf,D;
    if(s.k==="swap"){D=900;kf=[{transform:"perspective(600px) rotateY(0)"},{transform:"perspective(600px) translateY(-10px) scale(1.1) rotateY(0)",offset:.2},{transform:`perspective(600px) translate(${dx/2}px,${dy/2}px) scale(1.18) rotateY(180deg)`,offset:.6},{transform:`perspective(600px) translate(${dx}px,${dy}px) rotateY(360deg)`}];}
    else if(s.push){D=620;kf=[{transform:"none"},{transform:`translate(${dx*1.06}px,${dy*1.06}px) rotate(${dx>0?4:-4}deg)`,offset:.7},{transform:`translate(${dx}px,${dy}px)`}];}
    else{D=820;kf=[{transform:"none"},{transform:"translateY(-10px) scale(1.12)",offset:.22},{transform:`translate(${dx/2}px,${dy/2-Math.min(70,Math.hypot(dx,dy)*.35)}px) scale(1.16) rotate(${dx>0?6:-6}deg)`,offset:.6},{transform:`translate(${dx}px,${dy}px) scale(1)`}];}
    ph.style.zIndex="19";const a=ph.animate(kf,{duration:D,easing:"cubic-bezier(.45,.05,.45,1)",fill:"both"});
    const fin=()=>{if(!ph.isConnected)return;ph.remove();s.ph=null;if(h){hide9(h,0);s.hid=null;anim(h,[{transform:"scale(.9) translateY(3px)"},{transform:"scale(1.05) translateY(-3px)",offset:.5},{transform:"none"}],{duration:360,fill:"none"});}
      if(typeof window.playV16==="function")window.playV16("di_chuyen",r1.x,r1.y,Math.max(98,(r1.w||52)*1.85),480,0);
      FX.dust(r1.x,r1.y+(r1.h||70)*.45,"#d8c8a0");SFX.play("place");
      if(s.k==="swap"){const sc=s.side==="p"?"#3fa0ff":"#ff4d6d";FX.ring(r1.x,r1.y,sc,Math.min(40,(r1.w||50)*.6),4);if(h)pulse(`#board [data-mc="${s.dst}"]`,[{boxShadow:`0 0 0 3px ${sc}`},{boxShadow:"0 0 0 0 transparent"}],700);say(r1.x,sy8(r1),"ĐỔI PHE",s.side==="p"?"#9fd0ff":"#ff9aa8");}
      else if(s.push)say(r1.x,sy8(r1),"BỊ ĐẨY","#b6ffe8");};
    a.onfinish=fin;fxT(fin,D+150);SFX.fam(s.k==="swap"?"swap":"move",{el:elU(s.src)});},t);}
function plan9m(evA,R0,R1,steps,W){
  for(const e of evA)if(e.k==="move"&&R0.has(e.uid)&&R1.has(e.uid)&&!S8.has("m"+e.uid)){const src=e.src>0&&e.src!==e.uid?e.src:0,sp=src?W(src):null;steps.push({k:"move",src:sp?src:0,dst:e.uid,sp,tp:R1.get(e.uid),r0:R0.get(e.uid),push:!!sp});S8.add("m"+e.uid);}
  for(const [u,r] of R1){const s0=SD0.get(u),c=anyC(u);if(!s0||!c||c.side===s0||S8.has("m"+u)||!R0.has(u))continue;const me=evA.find(e=>e.k==="morph"&&e.uid===u),src=me&&me.src>0&&me.src!==u?me.src:0,sp=src?W(src):null;
    steps.push({k:"swap",src:sp?src:0,dst:u,sp,tp:r,r0:R0.get(u),side:c.side});S8.add("w"+u);}}
let mvDur9; /* gpu23: thời lượng hoạt ảnh dời thẻ — định nghĩa ở 08-vfx-webgl.js mục 6 */
/* tiêu huỷ: thẻ nứt rồi vỡ mảnh từ chính hình của nó */
let SH9=0;
CFX.destroy=function(r){if(reduced||!r||!r.html)return;const g0=ghost(r,r.html,"g9");g0.insertAdjacentHTML("beforeend",`<svg class="ck9" viewBox="0 0 40 56" preserveAspectRatio="none"><path d="M20 4L17 18L24 26L15 38L21 52M17 18L7 22M24 26L35 30M15 38L5 44" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`);
  anim(g0,[{transform:"none"},{transform:"translateX(-3px) rotate(-2deg)",offset:.3},{transform:"translateX(3px) rotate(2deg)",offset:.6},{transform:"scale(1.03)"}],{duration:260});
  fxT(()=>{g0.remove();const n=SH9>=3?4:6;SH9++;fxT(()=>SH9--,900);
    const P=n===6?["polygon(0 0,55% 0,40% 35%,0 45%)","polygon(55% 0,100% 0,100% 40%,60% 30%,40% 35%)","polygon(0 45%,40% 35%,60% 30%,55% 65%,0 75%)","polygon(60% 30%,100% 40%,100% 70%,55% 65%)","polygon(0 75%,55% 65%,45% 100%,0 100%)","polygon(55% 65%,100% 70%,100% 100%,45% 100%)"]:["polygon(0 0,60% 0,45% 50%,0 55%)","polygon(60% 0,100% 0,100% 50%,45% 50%)","polygon(0 55%,45% 50%,55% 100%,0 100%)","polygon(45% 50%,100% 50%,100% 100%,55% 100%)"];
    const C0=n===6?[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]:[[-1,-1],[1,-1],[-1,1],[1,1]];
    P.forEach((cp,i)=>{const g=ghost(r,r.html,"g9");g.style.clipPath=cp;const[vx,vy]=C0[i],dx=vx*(18+Math.random()*22),dy=vy*14+40+Math.random()*30;
      const a=g.animate([{transform:"none",opacity:1},{transform:`translate(${dx*.4}px,${vy*10-12}px) rotate(${vx*8}deg)`,opacity:1,offset:.3},{transform:`translate(${dx}px,${dy}px) rotate(${vx*(25+Math.random()*30)}deg)`,opacity:0}],{duration:680,easing:"cubic-bezier(.4,0,.8,.6)",fill:"forwards"});
      a.onfinish=()=>g.remove();fxT(()=>g.remove(),900);});
    FX.shards(r.x,r.y,"#ff4d5e");},260);};

K8.move=["#b6ffe8","",""];K8.swap=["#9fd0ff","",""];
/* ===== v10: thẻ bay hẳn tới đích, vật thể có hình thù, hào quang to, tốc độ ===== */
const DK10="#14081f";
const OBJ10={
  sword:c=>`<svg viewBox="0 0 100 26"><g stroke="${DK10}" stroke-width="3" stroke-linejoin="round"><rect x="2" y="9" width="20" height="8" rx="3" fill="#6a3a1a"/><rect x="21" y="2" width="6" height="22" rx="2" fill="#e8c060"/><path d="M27 7H84L98 13L84 19H27Z" fill="#eef2ff"/></g><path d="M30 13H88" stroke="${c}" stroke-width="3"/></svg>`,
  saber:c=>`<svg viewBox="0 0 100 34"><g stroke="${DK10}" stroke-width="3" stroke-linejoin="round"><rect x="2" y="16" width="20" height="8" rx="3" fill="#4a2410"/><rect x="21" y="10" width="6" height="20" rx="2" fill="#e8c060"/><path d="M27 14Q62 2 98 6Q70 22 27 26Z" fill="#f4f0ff"/></g><path d="M32 18Q62 9 90 8" stroke="${c}" stroke-width="3" fill="none"/></svg>`,
  hammer:c=>`<svg viewBox="0 0 80 80"><g stroke="${DK10}" stroke-width="3.5" stroke-linejoin="round"><rect x="35" y="30" width="10" height="46" rx="3" fill="#7a4a1a"/><rect x="12" y="8" width="56" height="26" rx="5" fill="#c9d2e6"/><path d="M44 12L34 24H42L36 32L50 18H42Z" fill="${c}"/></g></svg>`,
  arrow:c=>`<svg viewBox="0 0 100 24"><g stroke="${DK10}" stroke-width="3" stroke-linejoin="round"><path d="M4 12H80" stroke-width="7"/><path d="M4 12H80" stroke="#c99a5a" stroke-width="3.5"/><path d="M78 3L98 12L78 21Z" fill="#dfe6ff"/><path d="M4 12L16 3V10ZM4 12L16 21V14Z" fill="${c}"/></g></svg>`,
  hand:c=>`<svg viewBox="-34 -24 68 48"><path d="M-30 0C-23-7-15-11-6-11L3-16L21-21L27-19L9-11L25-11L31-7L10-4L27 0L31 4L10 3L23 10L24 13L6 8L-6 12C-15 12-23 7-30 0Z" fill="${c}" stroke="${DK10}" stroke-width="3" stroke-linejoin="round"/><circle cx="-12" r="3.5" fill="#fff" stroke="${DK10}" stroke-width="1.5"/></svg>`,
  chainlock:c=>`<svg viewBox="0 0 80 80"><g fill="none" stroke="${DK10}" stroke-width="8"><path d="M6 20L74 60M6 60L74 20"/></g><g fill="none" stroke="#c8d2e8" stroke-width="4" stroke-dasharray="9 4"><path d="M6 20L74 60M6 60L74 20"/></g><g stroke="${DK10}" stroke-width="3"><path d="M30 38V30a10 10 0 0 1 20 0v8" fill="none" stroke-width="7"/><path d="M30 38V30a10 10 0 0 1 20 0v8" fill="none" stroke="#e8c060" stroke-width="3.5"/><rect x="24" y="37" width="32" height="26" rx="4" fill="${c}"/><circle cx="40" cy="48" r="3.5" fill="${DK10}"/></g></svg>`,
  scroll:c=>`<svg viewBox="0 0 90 60"><g stroke="${DK10}" stroke-width="3" stroke-linejoin="round"><rect x="14" y="10" width="62" height="40" fill="#f3e2b0"/><rect x="4" y="6" width="12" height="48" rx="6" fill="${c}"/><rect x="74" y="6" width="12" height="48" rx="6" fill="${c}"/></g><path d="M26 22h38M26 30h30M26 38h34" stroke="#c0392b" stroke-width="3"/></svg>`,
  mirror:c=>`<svg viewBox="0 0 70 80"><g stroke="${DK10}" stroke-width="3"><rect x="31" y="54" width="8" height="24" rx="3" fill="#8a5a2a"/><circle cx="35" cy="32" r="28" fill="#c9a24a"/><circle cx="35" cy="32" r="20" fill="${c}"/></g><path d="M24 24q6-8 14-6" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
  flag:c=>`<svg viewBox="0 0 70 80"><g stroke="${DK10}" stroke-width="3" stroke-linejoin="round"><rect x="8" y="4" width="6" height="74" rx="2" fill="#8a5a2a"/><path d="M14 8H64L54 24L64 40H14Z" fill="${c}"/></g><path d="M30 16l4 8 8 1-6 6 2 8-8-4-8 4 2-8-6-6 8-1z" fill="#fff6c8" stroke="${DK10}" stroke-width="1.5"/></svg>`,
  drum:c=>`<svg viewBox="0 0 80 70"><g stroke="${DK10}" stroke-width="3"><path d="M8 18V52Q40 66 72 52V18" fill="#a8742a"/><ellipse cx="40" cy="18" rx="32" ry="12" fill="#e8c060"/></g><circle cx="40" cy="18" r="6" fill="${c}" stroke="${DK10}" stroke-width="2"/><path d="M40 8v4M40 24v4M28 18h4M48 18h4" stroke="${DK10}" stroke-width="2"/></svg>`,
  skull:c=>`<svg viewBox="0 0 80 80"><g stroke="${DK10}" stroke-width="3"><path d="M10 62q8-14 20-6q10-12 20 0q12-8 20 6" fill="${c}" opacity=".85"/><path d="M40 6C20 6 12 20 14 34c1 8 6 12 6 18h40c0-6 5-10 6-18C68 20 60 6 40 6Z" fill="#eceff6"/><rect x="26" y="50" width="28" height="12" rx="3" fill="#eceff6"/></g><circle cx="30" cy="32" r="7" fill="${DK10}"/><circle cx="50" cy="32" r="7" fill="${DK10}"/><path d="M40 38l-4 8h8z" fill="${DK10}"/></svg>`,
  portal:c=>`<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="${DK10}"/><circle cx="40" cy="40" r="30" fill="none" stroke="${c}" stroke-width="6" stroke-dasharray="20 8"/><circle cx="40" cy="40" r="20" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 6"/><circle cx="40" cy="40" r="9" fill="${c}"/></svg>`,
  windhand:c=>`<svg viewBox="0 0 90 60"><g fill="none" stroke="${DK10}" stroke-width="7" stroke-linecap="round"><path d="M6 18h44q12 0 12-10M6 32h58q14 0 14 12M14 46h30"/></g><g fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"><path d="M6 18h44q12 0 12-10M6 32h58q14 0 14 12M14 46h30"/></g></svg>`,
  flame:c=>`<svg viewBox="0 0 70 90"><path d="M35 4C40 24 62 30 60 56C58 76 46 86 35 86S10 76 10 56C10 40 22 34 22 20C30 30 30 18 35 4Z" fill="#ff6a1f" stroke="${DK10}" stroke-width="3.5" stroke-linejoin="round"/><path d="M35 40C40 52 48 54 46 66C44 76 26 76 25 66C24 58 30 54 35 40Z" fill="#ffd27a"/></svg>`,
  rope:c=>`<svg viewBox="0 0 80 80"><circle cx="34" cy="38" r="22" fill="none" stroke="${DK10}" stroke-width="10"/><circle cx="34" cy="38" r="22" fill="none" stroke="#c99a5a" stroke-width="5" stroke-dasharray="6 3"/><path d="M56 38c10 0 14 8 14 16s-6 12-12 8" fill="none" stroke="${DK10}" stroke-width="6"/><path d="M56 38c10 0 14 8 14 16s-6 12-12 8" fill="none" stroke="${c}" stroke-width="3"/></svg>`,
  shield:c=>`<svg viewBox="0 0 70 80"><path d="M35 4L64 14V38C64 58 50 70 35 77C20 70 6 58 6 38V14Z" fill="${c}" stroke="${DK10}" stroke-width="4" stroke-linejoin="round"/><path d="M35 14L54 21V38C54 52 45 60 35 65C25 60 16 52 16 38V21Z" fill="none" stroke="#fff" stroke-width="2.5"/></svg>`,
  gem:c=>`<svg viewBox="0 0 70 70"><path d="M35 6L62 28L35 64L8 28Z" fill="${c}" stroke="${DK10}" stroke-width="4" stroke-linejoin="round"/><path d="M8 28H62M35 6L24 28L35 64L46 28Z" fill="none" stroke="#fff" stroke-width="2"/></svg>`};
const ROT10={sword:1,saber:1,arrow:1,hand:1,windhand:1};
function cw10(){const m=document.querySelector("#board .mc");return m?m.getBoundingClientRect().width:50;}
function pickObj10(s){const c=s&&s.src>0?anyC(s.src):null,e=c?elOf(E.ab(c)||c.id):null;
  switch(s&&s.k){case "kill":return e==="sam"?"hammer":(e==="gio"||e==="moc")?"arrow":(e==="lua"||e==="mau"||e==="toi")?"saber":"sword";
    case "steal":return "hand";case "sil":return "chainlock";case "copy":return (e==="nuoc"||e==="bang"||e==="sang")?"mirror":"scroll";
    case "up":case "lplus":return (e==="dat"||e==="cokhi"||e==="lua")?"drum":"flag";case "down":case "lminus":return "skull";case "reset":return "gem";
    case "summon":return "portal";case "bounce":return "windhand";default:return "flag";}}
function col10(s){const c=s&&s.src>0?anyC(s.src):null,e=c?elOf(E.ab(c)||c.id):null;return e&&ELD[e]?ELD[e][0]:(K8[s.k]||["#ffd65a"])[0];}
/* vật thể bay: luôn là hình SVG cụ thể, cỡ lớn, có viền tối */
const _obj8=obj8;
obj8=function(type,c,html){if(type==="streak"||type==="dot")type="flag";if(!OBJ10[type])return _obj8(type,c,html);const d=document.createElement("div"),W=osz10(type);d.className="p8 p10 p10-"+type+(ROT10[type]?"":" nr10");d.style.width=W+"px";d.innerHTML=OBJ10[type](c);document.body.appendChild(d);return d;};
const _fly8=fly8;
fly8=function(a,b,type,c,dur,dl,cb,html){if(type==="streak"||type==="dot")type="flag";if(!OBJ10[type]||ROT10[type])return _fly8(a,b,type,c,dur,dl,cb,html);
  dl=dl||0;if(reduced||!a||!b){if(cb)fxT(cb,dl+(dur||0));return;}
  fxT(()=>{const d=obj8(type,c),dx=b.x-a.x,dy=b.y-a.y,lift=-Math.min(70,Math.hypot(dx,dy)*.3);d.style.left=a.x+"px";d.style.top=a.y+"px";
    const an=d.animate([{transform:"translate(-50%,-50%) scale(.4)",opacity:0},{transform:`translate(-50%,-50%) translate(${dx*.14}px,${dy*.14+lift*.5}px) scale(1)`,opacity:1,offset:.16},{transform:`translate(-50%,-50%) translate(${dx*.5}px,${dy*.5+lift}px) scale(1.12) rotate(${dx>0?10:-10}deg)`,offset:.55},{transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) scale(1)`,opacity:1}],{duration:dur,easing:"cubic-bezier(.42,.05,.45,1)",fill:"both"});
    let done=0;const fin=()=>{if(done)return;done=1;const o=d.animate([{opacity:1,transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) scale(1)`},{opacity:0,transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) scale(1.3)`}],{duration:220,fill:"forwards"});o.onfinish=()=>d.remove();fxT(()=>d.remove(),400);if(cb)cb();};
    an.onfinish=fin;fxT(fin,dur+150);},dl);};
function projType9(s){return pickObj10(s);}
K8.kill[1]="sword";K8.steal[1]="hand";K8.sil[1]="chainlock";K8.copy[1]="scroll";K8.up[1]="flag";K8.down[1]="skull";K8.summon[1]="portal";K8.bounce[1]="windhand";K8.reset[1]="gem";
/* luồng từ biển chiến địa: thay bằng 1 vật thể cụ thể */
function stream8(a,b,c,dl,dur){fly8(a,b,c==="#b06bff"?"skull":"flag",c,dur,dl);}
/* vật thể tại chỗ va chạm */
function hitObj10(type,tp,c,ms,from){if(reduced||!tp)return null;const d=obj8(type,c),W=osz10(type,tp.w);d.style.width=W+"px";d.style.left=tp.x+"px";d.style.top=tp.y+"px";d.style.zIndex="20";
  const ux=from?Math.sign(tp.x-from.x)||1:1,kf=(type==="sword"||type==="saber")?[{transform:`translate(-50%,-50%) translate(${-ux*W*.25}px,${-W*.35}px) rotate(${ux>0?-80:-100}deg)`,opacity:0},{transform:`translate(-50%,-50%) translate(${-ux*W*.2}px,${-W*.3}px) rotate(${ux>0?-70:-110}deg)`,opacity:1,offset:.2},{transform:`translate(-50%,-50%) rotate(${ux>0?25:155}deg)`,opacity:1,offset:.55},{transform:`translate(-50%,-50%) rotate(${ux>0?30:150}deg)`,opacity:0}]
    :type==="hammer"?[{transform:"translate(-50%,-50%) translateY(-60px) rotate(-30deg)",opacity:0},{transform:"translate(-50%,-50%) translateY(-50px) rotate(-30deg)",opacity:1,offset:.2},{transform:"translate(-50%,-50%) translateY(-6px) rotate(10deg) scale(1.1)",offset:.5},{transform:"translate(-50%,-50%) rotate(8deg)",opacity:1,offset:.75},{transform:"translate(-50%,-50%) rotate(8deg)",opacity:0}]
    :type==="arrow"?[{transform:`translate(-50%,-50%) translateX(${-ux*W}px) rotate(${ux>0?0:180}deg)`,opacity:0},{transform:`translate(-50%,-50%) translateX(${-ux*W*.2}px) rotate(${ux>0?0:180}deg)`,opacity:1,offset:.35},{transform:`translate(-50%,-50%) translateX(${-ux*W*.25}px) rotate(${ux>0?0:180}deg)`,opacity:1,offset:.8},{transform:`translate(-50%,-50%) translateX(${-ux*W*.25}px) rotate(${ux>0?0:180}deg)`,opacity:0}]
    :[{transform:"translate(-50%,-50%) scale(1.8)",opacity:0},{transform:"translate(-50%,-50%) scale(.95)",opacity:1,offset:.25},{transform:"translate(-50%,-50%) scale(1)",opacity:1,offset:.8},{transform:"translate(-50%,-50%) scale(1.1)",opacity:0}];
  const a=d.animate(kf,{duration:ms||700,easing:"ease-out",fill:"forwards"});a.onfinish=()=>d.remove();fxT(()=>d.remove(),(ms||700)+300);return d;}
/* thẻ nguồn (bản sao) bay hẳn tới sát đích, phóng to 1.25, va chạm, rồi bay về */
const _run9=run8;
run8=function(s){if(s.k==="move"||s.k==="swap"){move10(s);return;}
  const el=mcEl9(s.src),sp=s.sp,tp=s.tp,L0=s.nl?0:T8.LIFT;
  if(el&&sp&&tp&&(s.k==="kill"||s.k==="steal"||s.k==="copy"||s.k==="sil")){lunge10(s,el,sp,tp,L0);fxT(()=>hit8(s),L0+T8.FLY);return;}
  if(el&&sp&&tp&&(s.k==="up"||s.k==="down"||s.k==="reset"||s.k==="summon"||s.k==="bounce")){fxT(()=>lean10(el,sp,tp),Math.max(0,L0-120));if(sp)FX.glow(sp.x,sp.y,col10(s),Math.min(32,(sp.w||50)*.5),.5);
    const im=sigImg9(s.src);fly8(sp,tp,im?"img":pickObj10(s),col10(s),T8.FLY,L0,null,im||undefined);fxT(()=>{hit8(s);if(s.k==="up"||s.k==="down")recoil10(tEl8(s.dst),sp,tp);},L0+T8.FLY);return;}
  return _run9(s);};
/* di chuyển: đẩy (thẻ nguồn húc + khiên) / kéo (dây thừng) / bay thường / đổi bên */
var recoil10,lean10,lunge10,move10; /* gpu23: thẻ tự diễn (giật, nghiêng, lao tới, dời chỗ) — định nghĩa ở 08-vfx-webgl.js mục 6; bản cũ ở đây đã bị thay hoàn toàn nên đã xoá */
/* hào quang v10: viền 5px + quầng sáng thở + 2 đốm sáng + ấn ký to nền sáng */
const AUC10={};
function aura(inst){const id=(E.ab(inst)&&C[E.ab(inst)])?E.ab(inst):inst.id;if(AUC10[id])return AUC10[id];
  const h=lhash(id),[c1,c2]=acol9(id),sp=(7+((h>>>17)%6)).toFixed(1),dl=(4+h%6)+" "+(5+(h>>>5)%5),V=`vector-effect="non-scaling-stroke" fill="none"`;
  return AUC10[id]=`<span class="au10g" style="--c1:${c1}" aria-hidden="true"></span><svg class="au10" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true"><rect x="3.6" y="2.7" width="92.8" height="134.6" rx="12" ry="9" stroke="${c1}" stroke-width="5" ${V}/><rect x="3.6" y="2.7" width="92.8" height="134.6" rx="12" ry="9" stroke="${c2}" stroke-width="1.6" stroke-dasharray="${dl}" ${V}/></svg>`
    +`<span class="au9r au10r" style="--c1:${c1};--rs:${sp}s" aria-hidden="true"><i></i></span><span class="au9r au10r au10b" style="--c1:${c2};--rs:${sp}s" aria-hidden="true"><i></i></span>`+badgeHTML9(id,"ak10");}
/* tốc độ hoạt ảnh: mọi WAAPI và CSS animation trong trận nhân SPD */
(function(){const A=Element.prototype.animate;Element.prototype.animate=function(k,o){if(SPD!==1&&o!=null){if(typeof o==="number")o=o*SPD;else if(typeof o==="object"){o=Object.assign({},o);if(isFinite(o.duration))o.duration*=SPD;if(o.delay)o.delay*=SPD;if(o.endDelay)o.endDelay*=SPD;}}return A.call(this,k,o);};
  document.addEventListener("animationstart",e=>{if(SPD===1)return;const t=e.target;if(!t||!t.getAnimations)return;const lb=$("lobby");if(lb&&lb.classList.contains("on"))return;try{for(const a of t.getAnimations())if(a.animationName===e.animationName&&!a.sp10){a.sp10=1;a.playbackRate=1/SPD;}}catch(x){}},true);})();
function setSpd10(v){store.spd=SPDV[v]?v:"vua";SPD=SPDV[store.spd];try{save();}catch(e){}}

/* ===== v11: chiêu nhiều mục tiêu diễn đồng loạt; ảnh vẽ (sprite) cho vật thể/ấn ký/vụ nổ ===== */
/* --- ảnh vẽ: content/vfx/v_<khoá>.webp -> IMGS.v[khoá]; chưa có ảnh thì giữ hình SVG --- */
const VIMG={sword:"kiem",saber:"dao",hammer:"bua",arrow:"ten",hand:"tay",chainlock:"xich",scroll:"bua_chu",mirror:"guong",flag:"co",drum:"trong",skull:"so",portal:"cong",windhand:"gio",flame:"lua",rope:"day",shield:"khien",gem:"ngoc"};
const VAN={flag:"an_co",chain:"an_xich",shield:"an_khien",lock:"an_khoa",gem:"an_ngoc",twin:"an_vong",eye:"an_mat"};
/* ảnh gốc hướng sang phải; "giáng" (búa) vẽ hướng xuống */
const vimg=k=>(k&&IMGS.v&&IMGS.v[k])||null;
function sigImg9(uid){const c=uid>0?anyC(uid):null;if(!c)return null;const s=SIGV[c.id],k=(s&&String(s.img||"").replace(/^v_/,""))||c.id,h16=v16Html(k,460,1,14);if(h16)return h16;const u=(s&&(vimg(s.img)||vimg(k)))||vimg(c.id);return u?`<img src="${u}" alt="" draggable="false">`:null;}
const _obj10=obj8;
obj8=function(type,c,html){const k=VIMG[type],h16=k?v16Html(k,420,1,14):"",u=vimg(k);if(!h16&&!u)return _obj10(type,c,html);const d=document.createElement("div"),W=osz10(type);d.className="p8 p10 p11 p10-"+type;d.style.width=W+"px";d.style.height=W+"px";d.innerHTML=h16||`<img src="${u}" alt="" draggable="false">`;document.body.appendChild(d);v16Activate(d);return d;};
const _bh9=badgeHTML9;
badgeHTML9=function(id,cls){const u=vimg(VAN[akind9(id)]);if(!u)return _bh9(id,cls);const [c1,c2]=acol9(id);return `<span class="ak9 ak11i${cls?" "+cls:""}" style="--c1:${c1};--c2:${c2}" aria-hidden="true"><img src="${u}" alt="" draggable="false"></span>`;};
/* --- chữ nổi: tạm tắt khi gộp nhóm --- */
let SAYOFF=0;/* đặt >0 để tạm tắt chữ nổi (08 kiểm tra) */
const GLAB={kill:"TIÊU HUỶ",sil:"MẤT KỸ NĂNG",steal:"BỊ CƯỚP KỸ NĂNG",copy:"BỊ SAO CHÉP",summon:"TRIỆU HỒI",bounce:"VỀ TAY",reset:"ĐẶT LẠI"};
function sayGroup11(s){const g=s.grp,L=g.list,n=L.length,k=s.k;let t,c="#ffe08a";
  if(k==="up"||k==="down"||k==="lplus"||k==="lminus"){const d=L[0].d,same=L.every(x=>x.d===d);t=same?(d>0?"+":"−")+Math.abs(d)+" ×"+n:(d>0?"TĂNG SỨC MẠNH ×":"GIẢM SỨC MẠNH ×")+n;c=d>0?"#7dffb0":"#ff9aa8";}
  else{t=(GLAB[k]||"")+" ×"+n;c=k==="kill"?"#ff9aa8":k==="steal"?"#e0b0ff":k==="copy"?"#bff4ff":k==="summon"?"#c8ff9a":k==="bounce"?"#ffd6f0":"#dfe5ff";}
  if(!t.trim())return;say(g.c.x,sy8({x:g.c.x,y:g.c.top,h:s.tp.h}),t,c);}
/* --- một chiêu nhiều mục tiêu: nguồn phóng N vật thể đồng loạt, mọi đích phản ứng cùng lúc --- */
const _run10b=run8;
run8=function(s){const g=s.grp;if(!g||g.n<2||s.k==="move"||s.k==="swap"||s.k==="lshield"||s.k==="loc")return _run10b(s);
  const el=mcEl9(s.src),sp=s.sp,tp=s.tp,L0=T8.LIFT,c=col10(s);
  if(g.i===0&&sp){if(el)lean10(el,sp,g.c);FX.glow(sp.x,sp.y,c,Math.min(32,(sp.w||50)*.5),.5);}
  if(sp){const im=sigImg9(s.src);fly8(sp,tp,im?"img":pickObj10(s),c,T8.FLY,L0,null,im||undefined);}
  const tI=sp?L0+T8.FLY:0;
  fxT(()=>{SAYOFF++;try{hit8(s);}catch(e){}finally{SAYOFF--;}if(s.tb&&s.k!=="sil"){s.tb.remove();s.tb=null;}
    if(sp){recoil10(s.ph||tEl8(s.dst),sp,tp);if(s.k==="kill"||s.k==="sil")hitObj10(pickObj10(s),tp,c,s.k==="sil"?900:640,sp);}
    
    if(g.i===0)sayGroup11(s);},tI);
  if((s.k==="steal"||s.k==="copy")&&sp)fxT(()=>{const cur=where7(s.src,null,rects())||sp;fly8(tp,cur,"card",K8[s.k][0],T8.BACK,g.i*40,()=>{if(g.i===g.n-1&&el){pop9(el,1.16,480);FX.ring(cur.x,cur.y,K8[s.k][0],Math.min(40,(sp.w||50)*.6),3);SFX.fam(s.k==="steal"?"steal":"copy",{el:elU(s.src)});}},s.abId?liteId(s.abId):null);},tI+T8.REACT-80);};

/* --- v11b: dùng ảnh vẽ (webp alpha) cho va chạm + khung hào quang --- */
const VNO2={lua:"no_lua",mau:"no_lua",sam:"no_set",cokhi:"no_set",gio:"no_set",doc:"no_doc",moc:"no_doc",dat:"no_doc",bang:"no_bang",nuoc:"no_bang",sang:"no_sang",hon:"no_sang",toi:"no_toi"};
function elKey11(uid){const c=uid>0?anyC(uid):null,e=c?elOf(E.ab(c)||c.id):null;return VNO2[e]||null;}
function impactFx11(s){const tp=s.tp;if(!tp)return;const w=tp.w,bk=elKey11(s.src)||"song_xung";
  switch(s.k){case "kill":burst11("vet_chem",tp,w);burst11("manh_vo",tp,w,160);burst11(bk,tp,w,60);break;
    case "steal":burst11("vet_cao",tp,w);burst11(bk,tp,w,80);break;
    case "up":case "lplus":burst11("sao_tang",tp,w);break;
    case "summon":burst11("bui_dap",{x:tp.x,y:tp.y+(tp.h||70)*.4},w,400);break;
    case "sil":case "down":case "lminus":case "copy":case "bounce":case "reset":burst11(bk,tp,w);break;}}
const KH11={lua:"khung_lua",mau:"khung_lua",nuoc:"khung_nuoc",bang:"khung_nuoc",hon:"khung_nuoc",sam:"khung_set",sang:"khung_set",gio:"khung_set",cokhi:"khung_set",moc:"khung_moc",dat:"khung_moc",doc:"khung_moc",toi:"khung_lua"};
function khung11(id){const e=elOf(id);let k=KH11[e];if(!k){const hue=(lhash(id)>>>4)%360;k=hue<45||hue>=300?"khung_lua":hue<90?"khung_set":hue<170?"khung_moc":"khung_nuoc";}return vimg(k);}
const AUC11={},_aura10=aura;
/* v11b: khung ảnh phủ lên viền chính thẻ (9-slice), dưới tên/số/+N */
aura=function(inst){const id=(E.ab(inst)&&C[E.ab(inst)])?E.ab(inst):inst.id;if(AUC11[id])return AUC11[id];
  if(IMGS.v16&&IMGS.v16.khung_lua)return AUC11[id]=badgeHTML9(id,"ak10");
  const u=khung11(id);if(!u)return _aura10(inst);
  const h=lhash(id),[c1,c2]=acol9(id),sp=(7+((h>>>17)%6)).toFixed(1);
  return AUC11[id]=`<span class="au9r au10r" style="--c1:${c1};--rs:${sp}s" aria-hidden="true"><i></i></span><span class="au9r au10r au10b" style="--c1:${c2};--rs:${sp}s" aria-hidden="true"><i></i></span>`+badgeHTML9(id,"ak10");};

/* vụ nổ ảnh vẽ cho mục tiêu đơn (bỏ qua nếu CardChoreo đã nổ va chạm chính) */
const _hit11=hit8;
hit8=function(s){_hit11(s);if(!s||!s._choreoHit)impactFx11(s);};

FX.trail=function(){};{const _cm=FX.comet;FX.comet=function(){if(FXBIG)return _cm.apply(FX,arguments);};}
/* hào quang Duy Trì theo hệ */

/* ================= GIAO DIỆN ================= */

const KWT=[["Lật","lat"],["Duy Trì","dt"],["Kích Hoạt","kh"],["Cuối Lượt","cl"],["Đầu Ván","dv"],["Đầu Lượt","dv"],["Nhiệm Vụ","nv"],["Rút Nhanh","rn"],["Phản Ứng","kh"],["Bị Động","dt"]];
const KWA=[[/Cường Hoá/g,"ch"],[/(?:tiêu huỷ|Tiêu huỷ|Tiêu Huỷ)/g,"td"],[/(?:vứt bỏ|Vứt bỏ|Vứt Bỏ)/g,"vb"],[/(?:hợp thể|Hợp thể)/g,"ht"],[/(?:[Nn]hân đôi|[Gg]ấp đôi)/g,"nd"],[/[Kk]hông thể(?: bị)?/g,"kt"],[/\b(?:[Dd]ời)\b/g,"di"]];
function kwfx(t){if(!t)return t;
 t=t.replace(/(^|[.!]\s+|<br>\s*|\n)((?:Lật|Duy Trì|Kích Hoạt|Cuối Lượt|Đầu Ván|Đầu Lượt(?: \(sau khi rút\))?|Nhiệm Vụ|Rút Nhanh|Phản Ứng|Bị Động|Phép đổi theo lượt|Lật và khi bị tiêu huỷ|Khi [^:.<]{2,44})):/g,(m,p,k)=>{const h=KWT.find(x=>k.startsWith(x[0]));const c=k.startsWith("Khi")||/^Lật và/.test(k)?"khi":h?h[1]:"x";return `${p&&/[.!]/.test(p)?p.trim()+"<br>":p}<b class="kt k-${c}">${k}</b> `;});
 return t.split(/(<b class="kt[^>]*>[^<]*<\/b>|<[^>]+>)/).map((x,i)=>i%2?x:x.replace(/([+＋]\d+)(?=\s*(?:sức mạnh|năng lượng|SM|NL)?)/g,'<b class="kp">$1</b>').replace(/((?:^|[\s(])[-−–]\d+)/g,'<b class="km">$1</b>').replace(KWA[0][0],'<b class="ka ch">$&</b>')
   .replace(KWA[1][0],'<b class="ka td">$&</b>').replace(KWA[2][0],'<b class="ka vb">$&</b>').replace(KWA[3][0],'<b class="ka ht">$&</b>').replace(KWA[4][0],'<b class="ka nd">$&</b>').replace(KWA[5][0],'<b class="ka kt">$&</b>')).join("");}
const LINKS={"nghithuctrieuhoii":["nghithuctrieuhoiii","hacdiemchua"],"nghithuctrieuhoiii":["nghithuctrieuhoiiii","hacdiemchua"],"quyensuthaphoan":["thaphoan","thaphoankhaimo"],"thuanung":["khientuong"],"phapsudaomong":["daidoan"],"nhencogiap":["cogiapnhen"],"vouyamdia":["quy"],"conhan":["daodo"],"docnutrang":["nuhondoc"],"vuarutkiem":["thanhkiem"],"kiemquyen":["kiemphuchy"],"bangca":["khoibang"],"dathuctai":["maybaycon","cohoangvocuc"],"madienloi":["riubao"],"dannguoi":["da"],"monghoang":["manhkiemquy"],"chuotchuivuong":["da"],"baocat":["da"],"diaba":["da"],"aothuatgia":["aoanh"],"tuyetve":["cucquangung","cucquanggau"],"trungmau":["trungcon"],"phethachnu":["da"],"baochuasat":["baoco"],"tegiap":["da"],"loda":["da"],"kimve":["hukhong"],"trummu":["quy"],"loithan":["buasam"],"cohoang":["maybaycon"],"thachnhan":["da"],"tasu":["bansaota"],"socnu":["soc"],"bachho":["ho"],"trolymay":["da"],"docnu":["vetcandoc"],"huyetsatvuong":["giaohutmau"],"baochuahauthe":["baocohauthe","baoco"],"taythep":["linhmuadong"],"nguyetthan":["nguyetthanbannguyet","nguyetthantrangtron"],"nguyetthanbannguyet":["nguyetthantrangtron"],"bansaota":["tasu"],"khuonmauchu":["linhgacmay"],"buasam":["loithan"],"aoanh":["aothuatgia"],"hackysi":["hackiem"],"condoi":["bayxac"],"chuhien":["nhennhan"],"xaccunhan":["bayxac"],"xackimve":["bayxac"],"riubao":["madienloi"],"manhkiemquy":["monghoang"],"thoicothuat":["conhansu"],"dasucmanh":["cohoangvocuc"],"dakhonggian":["cohoangvocuc"],"kiemphuchy":["kiemquyen"],"baocohauthe":["baochuasat","baochuahauthe","baoco"],"xacdao":["bayxac"],"xacdeo":["bayxac"],"xachongphuthuy":["bayxac"],"xachacdich":["bayxac"],"xactantinh":["bayxac"],"giaohutmau":["satvuong"],"daluc":["bavuongtim"],"dakhong":["bavuongtim"],"dathoi":["bavuongtim"],"hoathuatnu":["luahacdiem"],"khoinguyenvuong":["matthethientuyen"],"huyettruonglao":["cuthudotham"],"hienthanvangioi":["phapsugia"],"nghithuctrieuhoiiii":["hacdiemchua"],"khientuong":["thuanung"],"kerinh":["daibay","mintuxa","gangchandong"],"cohoangvocuc":["datamtri","dasucmanh","dathuctai","dalinhhon","dakhonggian","dathoigian","maybaycon"],"nuthantien":["tenaxit","tenthuong","tenmoc","tenthuphong"],"conhansu":["giocothuat","thoicothuat","anhcothuat","chopcothuat"],"tienhoasu":["quaituongtienhoa","docnhantienhoa","cuongnhantienhoa","taymaynutienhoa","chanthutienhoa","thachquaitienhoa","ongnutienhoa"],"bavuongtim":["datam","daluc","dathuc","dahon","dakhong","dathoi"],"phapsugia":["hienthanvangioi","vuongtrieutailai","bienhinhthuat"],"hacdiemchua":["nghithuctrieuhoii","nghithuctrieuhoiii","nghithuctrieuhoiiii"],"quaituong":["quaituongtienhoa"],"docnhan":["docnhantienhoa"],"cuongnhan":["cuongnhantienhoa"],"taymaynu":["taymaynutienhoa"],"chanthu":["chanthutienhoa"],"thachquai":["thachquaitienhoa"],"ongnu":["ongnutienhoa"]};
async function endReveal(g,dp){dp=dp||(()=>{});for(let r=0;r<4;r++){const L=E.hiddenOrder(g);if(!L.length){pvApply();return;}
  if(!r){g.msg="<b>Cuối ván:</b> lật các thẻ đang úp (bên đang thắng lật trước, mỗi bên lật theo thứ tự đã đặt)…";dp();render();await sleep(reduced?150:900);}
  for(const h of L){const R0=rects0(),P0=powers(),G0=pvSnap();if(g.evs)g.evs.length=0;if(g.msgs)g.msgs.length=0;if(!E.revealHidden(g,h.uid))continue;const evs=(g.evs||[]).slice();if(g.msgs&&g.msgs.length)g.msg=fmt(g.msgs);dp();stepFx(G0,evs,R0,P0);await sleep(reduced?250:900);}}pvApply();}
function backBg(){const k=(store.decks&&store.decks[store.cur]&&dBack(store.decks[store.cur]))||store.back;return (BACKS[k]||BACKS.b0)[1];}
function flipBtn(){return `<button type="button" class="flb" data-flip="1" aria-label="Lật xem mặt sau thẻ"><i></i></button>`;}
function fanSides(LK,ai){const n=LK.length;if(n<2)return "";const one=(id,dir,side)=>{const d=C[id];return `<button type="button" class="fanc ${side}" data-fan="${dir}" aria-label="Xem ${esc(d.n)}"><span class="gc" style="--hc:${HC[d.h]};display:block">${nbL(id)}${art(id)}<span class="cst">${d.c}</span><span class="pwh">${d.p}</span><span class="n">${logo(id)}</span></span></button>`;};
  return n===2?one(LK[(ai+1)%n],1,"r"):one(LK[(ai-1+n)%n],-1,"l")+one(LK[(ai+1)%n],1,"r");}
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-flip]");if(!b)return;ev.stopPropagation();ev.preventDefault();const c=b.parentElement;if(!c||c.classList.contains("flipping"))return;try{SFX.play("tap");}catch(e){}
  c.classList.add("flipping");setTimeout(()=>{c.classList.toggle("flipped");b.setAttribute("aria-pressed",String(c.classList.contains("flipped")));},190);setTimeout(()=>c.classList.remove("flipping"),400);},true);
function lkBtn(i,n){return n>1?`<button type="button" class="lkb" data-lk="1" aria-label="Xem thẻ được tạo / hình thái khác"><i></i><b>${i+1}/${n}</b></button>`:"";}
function bacTag(d){const h=HE[d.h];return h?`<span class="tbac"><i>${/^Thẻ/i.test(h)?h:"Thẻ "+h}</i></span>`:"";}
function skillText(d){return d.x||"Không có kỹ năng.";}
function firstPreview(){
  let w={p:0,a:0},tp=0,ta=0;
  for(let i=0;i<3;i++){const l=E.lead(G,i);if(l)w[l]++;tp+=E.locPower(G,i,"p");ta+=E.locPower(G,i,"a");}
  if(w.p!==w.a)return w.p>w.a?"Bạn lật trước.":"Máy lật trước.";
  if(tp!==ta)return tp>ta?"Bạn lật trước.":"Máy lật trước.";
  return "Hai bên đang hoà, bên lật trước sẽ là ngẫu nhiên.";
}
function turnMsg(extra){
  let m=`<b>Lượt ${G.turn}/${E.turns(G)}.</b> ${firstPreview()} Kéo thẻ vào chiến địa, hoặc chạm thẻ rồi chạm chiến địa để đặt.`;
  if(G.newLoc>=0){const L=LOC[G.locs[G.newLoc].id];m=`<b>${L.n}</b> lộ diện: ${L.x} `+m;}
  if(extra&&extra.length)m=extra.join(" · ")+".<br>"+m;
  return m;
}
function fmt(msgs){if(!msgs.length)return "";return `<b>${msgs[0]}</b>`+(msgs.length>1?"<br>"+msgs.slice(1,7).join(" · "):"");}
function pendingPlay(uid){return G.q.p.find(a=>a.t==="play"&&a.uid===uid);}
function findAny(uid){
  const f=E.find(G,uid);if(f)return {inst:f.inst,li:f.li,where:"board"};
  const a=pendingPlay(uid);if(a)return {inst:a.inst,li:a.li,where:"staged"};
  const h=G.hand.p.find(c=>c.uid===uid);if(h)return {inst:h,li:-1,where:"hand"};
  return null;
}
function cardInfo(inst,li,where){
  const d=C[inst.id];
  const base=E.basePow(inst)+inst.bonus;
  const cur=where==="board"&&inst.rev?E.power(G,inst,li):base;
  const pw=cur!==d.p?`sức mạnh ${cur} (gốc ${d.p})`:`sức mạnh ${d.p}`;
  const cst=where==="hand"?E.cost(G,inst):d.c;
  let sk=skillText(d);
  if(typeof questProg==="function"){const qp=questProg(inst);if(qp)sk=sk.replace(/\(\d+\/\d+\)/,qp[2]?"(Hoàn thành ✓)":`(${qp[0]}/${qp[1]})`);}
  let s=`<b>${d.n}</b> <span class="meta">${HE[d.h]} · năng lượng ${cst} · ${pw}</span><br>${sk}`;
  const notes=[];
  if(inst.sil)notes.push("Bị "+srcN(inst.silBy)+" vô hiệu hoá, mất kỹ năng");if(inst.cr)notes.push("Được tạo ra bởi "+srcN(inst.by));
  if(inst.rvv)notes.push("Được hồi sinh");else if(inst.sum)notes.push("Được triệu hồi");
  if(where==="board"&&(d.t==="act"||E.ACT[E.ab(inst)])&&!inst.sil){
    if(inst.act)notes.push("Đã kích hoạt");
    else if(inst.side==="p"&&inst.turn>=G.turn)notes.push("Kích hoạt được từ lượt sau");
  }
  if(notes.length)s+=` <span class="warn">${notes.join(". ")}.</span>`;
  return s;
}
function mcHTML(inst,li,staged){
  const d=C[inst.id];
  if(!inst.rev&&!staged&&inst.hid)return `<div class="mc back hidc${inst.own==="p"?" mine":""}" data-mc="${inst.uid}" style="background:${BACKS[inst.own==="p"?dBack(store.decks[store.cur]):foeBack][1]}"><span class="hidb">Úp đến<br>cuối ván</span></div>`;
  if(!inst.rev&&!staged&&inst.own!=="p")return `<div class="mc back" data-mc="${inst.uid}" style="background:${BACKS[foeBack][1]}"></div>`;
  if(!inst.rev&&!staged&&inst.own==="p"&&G.phase==="reveal")return `<div class="mc back mine" data-mc="${inst.uid}" style="background:${BACKS[dBack(store.decks[store.cur])][1]}"></div>`;
  const live=inst.rev&&!staged;
  let pw;try{pw=E.power(G,inst,li);}catch(e){pw=E.basePow(inst)+inst.bonus;}
  let cls="mc"+(inst.own==="p"?qCls(inst.id):"");
  if(!live){cls+=" staged";if(!seenStg.has(inst.uid)){seenStg.add(inst.uid);cls+=" land";}}
  if(live&&!seenRev.has(inst.uid)){seenRev.add(inst.uid);cls+=" flip";}
  else if(live&&prevPow.has(inst.uid)&&prevPow.get(inst.uid)!==pw)cls+=" bump";
  if(live)prevPow.set(inst.uid,pw);
  if(inst.sil)cls+=" sil";else if(live&&C[E.ab(inst)].t==="on")cls+=" ong";
  if(live&&inst.rvv)cls+=" rvv";
  if(look&&look.kind==="card"&&look.uid===inst.uid)cls+=" look";
  const tags=[];
  if(live&&inst.side==="p"){
    if(E.queued(G,"p",inst.uid,"act")){cls+=" qact";tags.push(`<i>KH ✓</i>`);}
    else if(E.ACT[E.ab(inst)]&&!inst.act&&!inst.sil)tags.push(`<i>KH</i>`);
    const mv=E.queued(G,"p",inst.uid,"move");
    if(mv){cls+=" qmove";tags.push(`<i class="go">➜ ${mv.to+1}</i>`);}
  }else if(live&&E.ACT[E.ab(inst)]&&!inst.act&&!inst.sil)tags.push(`<i>KH</i>`);
  if(inst.sil)tags.push(`<i class="x">✕</i>`);
  const pc=pw>d.p?"up":pw<d.p?"down":"";
  const bmk=typeof markBadges==="function"?markBadges(inst,live?"board":"staged"):"";
  return (cls.includes(" ong")?aura(inst):"")+`<button type="button" class="${cls}" style="--hc:${HC[d.h]}${inst.own==="p"?qSt(inst.id):""}" data-mc="${inst.uid}" aria-label="${d.n}, sức mạnh ${pw}">${inst.own==="p"?nbL(inst.id):""}${art(inst.id)}${cls.includes(" ong")?khIn11(inst):""}<span class="mn">${nmFit(d.id)}</span>${inst.own==="p"?spk(d.id):""}<span class="pwh ${pc}">${pw}</span>${pw!==d.p?`<span class="dl ${pc}">${pw>d.p?"+":"−"}${Math.abs(pw-d.p)}</span>`:""}${bmk}${tags.length?`<span class="tg">${tags.join("")}</span>`:""}</button>`;
}
/* ===== v12: tải ảnh có thử lại + màn hình tải; giải mã trước sprite; chiêu thức nổi bật hơn; hào quang đặc ===== */
const IMGRT={ok:{},bad:new Set(),keep:[]},SPK12={},SPKEEP=[];
function bust12(u,n){return n?u+(u.indexOf("?")>=0?"&":"?")+"rt="+n+"_"+(Date.now()%1e6):u;}
function fixRef12(u,g){if(!g||g===u)return;const rp=o=>{for(const k in o){const v=o[k];if(typeof v==="string"){if(v===u)o[k]=g;else if(v.startsWith(u+"#"))o[k]=g+v.slice(u.length);}else if(v&&typeof v==="object")rp(v);}};try{rp(IMGS);}catch(e){}IMGRT.fixed=1;}
/* tải 1 ảnh: hết giờ 8s hoặc lỗi -> thử lại tối đa 3 lần (thêm tham số chống cache) */
function loadImg12(u,tries,dec){tries=tries==null?3:tries;return new Promise(res=>{let n=0;const go=()=>{const im=new Image();im.decoding="async";const url=bust12(u,n);let done=0;
  const fail=()=>{if(done)return;done=1;clearTimeout(t);im.onload=im.onerror=null;if(++n<=tries)setTimeout(go,300*n);else{IMGRT.bad.add(u);res(null);}};
  const t=setTimeout(fail,8000);
  im.onload=()=>{if(done)return;done=1;clearTimeout(t);const ok=()=>{if(n){IMGRT.ok[u]=url;fixRef12(u,url);}IMGRT.bad.delete(u);res(im);};if(dec&&im.decode)im.decode().then(ok,ok);else ok();};
  im.onerror=fail;im.src=url;};go();});}
/* mọi <img> lỗi tự thử lại */
document.addEventListener("error",e=>{const t=e.target;if(!t||t.tagName!=="IMG")return;const s=t.getAttribute("src")||"";if(!s||s.startsWith("data:")||s.startsWith("blob:"))return;
  const o=t.dataset.o||s;t.dataset.o=o;const n=+(t.dataset.rt||0);if(n>=3){IMGRT.bad.add(o.replace(/[?&]rt=[^&]*$/,""));return;}t.dataset.rt=n+1;
  setTimeout(()=>{if(t.isConnected)t.src=IMGRT.ok[o]||bust12(o,n+1);},400*(n+1));},true);
/* gpu22: mỗi thẻ có file riêng: img/ct/<id>.webp (thumbnail 256) và img/c/<id>.webp (đầy đủ 512). Khoá "id" = thumbnail, "id@f" = bản đầy đủ.
   gpu23: bỏ đường dự phòng cắt sprite tờ img/s (thư mục này không còn trong www/, mọi id trong IMGS.c đều có img/c + img/ct). */
const CV12="gpu22";
/* ảnh thẻ vẽ lại: phiên bản riêng theo thẻ để máy người chơi tải ảnh mới mà không phải tải lại toàn bộ */
const CV12X={};for(const k of "nguyetthach thietgiap yeutinhluc thuantuong nguumamienvien lucsi taythep linhgacmay thepnhan yeutinhcam bachho quyensu naomay khoithit phuthan".split(" "))CV12X[k]="a40";
function cardUrl12(id,f){return new URL("img/"+(f?"c":"ct")+"/"+id+".webp?v="+(CV12X[id]||CV12),document.baseURI||location.href).href;}
function spKey12(k){const f=k.slice(-2)==="@f";return {f:f,id:f?k.slice(0,-2):k};}
function spLoad(k){if(SP.c[k]||SP.k[k])return;const q=spKey12(k);if(!IMGS.c[q.id])return;
  SP.k[k]=1;const cu=cardUrl12(q.id,q.f);
  loadImg12(cu,1,true).then(im=>{delete SP.k[k];
    if(im){SP.c[k]=IMGRT.ok[cu]||cu;SPK12[k]="d";SPKEEP.push(im);IMGRT.bad.delete(cu);spPaint(k);}});}
/* gắn ảnh đã có vào mọi phần tử [data-sp] đang chờ, rồi giải mã trước và giữ tham chiếu */
function spPaint(k){const u=SP.c[k];if(!u)return;document.querySelectorAll('[data-sp="'+k+'"]').forEach(e=>{if(e.tagName==="IMG")e.src=u;else e.style.backgroundImage="url('"+u+"')";e.removeAttribute("data-sp");});
  if(!SPK12[k]){SPK12[k]="p";const im=new Image();im.src=u;SPKEEP.push(im);(im.decode?im.decode():Promise.resolve()).then(()=>SPK12[k]="d",()=>SPK12[k]="d");}}
function spWait12(ids,ms){ids=ids.filter(k=>IMGS.c[k]);for(const k of ids)if(!SP.c[k])spLoad(k);const t0=performance.now();
  return new Promise(r=>{const chk=()=>{if(ids.every(k=>SP.c[k]&&SPK12[k]==="d")||performance.now()-t0>ms)return r();setTimeout(chk,25);};chk();});}
function artReady12(evs){if(reduced)return Promise.resolve();const ids=[];for(const e of evs)if(e.k==="flip"){const c=anyC(e.uid);if(c)ids.push(c.id);}return ids.length?spWait12(ids,400):Promise.resolve();}
/* vào trận: tải + giải mã trước sprite cả hai bộ bài và thẻ phụ */
function warmMatch12(){try{const ids=new Set();for(const sd of ["p","a"]){for(const k of (G.start&&G.start[sd])||[])ids.add(k);for(const z of ["hand","deck"])for(const c of (G[z]&&G[z][sd])||[])ids.add(c.id);}
  for(const k of [...ids])for(const t of LINKS[k]||[])ids.add(t);for(const k of ids){spLoad(k);if(C[k]&&isHero5(C[k]))spLoad(k+"@f");v16Pre(k);if(SIGV[k])v16Pre(String(SIGV[k].img||"").replace(/^v_/,""));}
  for(const k of ["tieu_diet","loai_bo","rut_bai","tao_the","cuoc_x2","sao_chep","hoi_sinh","di_chuyen","bien_hinh","nang_luong","nhan_doi","khien_chan","hut_keo","thang","thua","no_lua","no_set","no_doc","no_bang","no_sang","no_toi","vet_chem","vet_cao","manh_vo","bui_dap","sao_tang","thieu_dot","dong_bang","set_danh","doc_lan"])v16Pre(k);}catch(e){}}
/* (warmMatch12 được gọi ở đầu dealIn) */
/* màn hình tải */
function runPool12(jobs,n,each){let i=0;return new Promise(res=>{let act=0;if(!jobs.length)return res();const nx=()=>{if(i>=jobs.length){if(!act)res();return;}const j=jobs[i++];act++;Promise.resolve().then(j).catch(()=>{}).then(()=>{act--;each&&each();nx();});};for(let k=0;k<n;k++)nx();});}
function deckIds12(ids){const s=new Set();for(const k of ids)for(const id of [k,...(LINKS[k]||[])])if(IMGS.c[id])s.add(id);return [...s];}
function boot12(){const L=$("ldr12");if(!L)return;const crit=new Set();
  for(const v of Object.values(IMGS.u||{}))crit.add(v);for(const v of Object.values(IMGS.v||{}))crit.add(v);
  for(const k of ["lat_the","tang_suc","giam_suc","hien_dia","song_xung","khung_lua","khung_nuoc","khung_set","khung_moc"])if(IMGS.v16&&IMGS.v16[k])crit.add(IMGS.v16[k]);
  try{const a=IMGS.a[store.arena]||{};if(a.b)crit.add(a.b);if(a.t)crit.add(a.t);}catch(e){}
  let sh=[];try{sh=deckIds12(store.deck||[]);}catch(e){}
  const jobs=[...[...crit].map(u=>()=>loadImg12(u,3,true).then(im=>{if(im)IMGRT.keep.push(im);})),...sh.map(id=>()=>{spLoad(id);return spWait12([id],20000);}),()=>khPre12()];
  let done=0;const N=jobs.length,upd=()=>{const p=N?Math.round(done*100/N):100;const b=$("ldrBar"),t=$("ldrTxt");if(b)b.style.width=p+"%";if(t)t.textContent="Đang tải hình… "+p+"%";};upd();
  const sk=setTimeout(()=>{const b=$("ldrSkip");if(b)b.hidden=false;},10000);const b=$("ldrSkip");if(b)b.onclick=fin12;
  runPool12(jobs,6,()=>{done++;upd();}).then(()=>{clearTimeout(sk);try{for(const k of store.deck||[])spLoad(k);}catch(e){}fin12();});}
function refresh12(){try{if(IMGRT.fixed){IMGRT.fixed=0;if(typeof applyArena==="function")applyArena();if($("lobby").classList.contains("on"))renderLobby();else if(G)render();}}catch(e){}try{spWatch(document.body);}catch(e){}}
function fin12(){const L=$("ldr12");if(!L||L.classList.contains("off"))return;L.classList.add("off");setTimeout(()=>L.remove(),450);refresh12();setTimeout(bg12,1200);}
/* tải nền tuần tự: sprite sưu tập, chiến địa, sàn đấu (tờ v16 riêng thẻ chỉ tải thông minh theo bộ bài trận đấu) */
function bg12(){const q=[],seen=new Set();
  for(const k in IMGS.c){if(SP.c[k])continue;const cu=cardUrl12(k,0);if(!seen.has(cu)){seen.add(cu);q.push(cu);}}
  for(const k in IMGS.l){const u=IMGS.l[k];if(typeof u==="string"&&!seen.has(u)){seen.add(u);q.push(u);}}for(const k in IMGS.a){const x=IMGS.a[k]||{};for(const u of [x.b,x.t])if(u&&!seen.has(u)){seen.add(u);q.push(u);}}
  bgRun20(q);}
/* gpu20: tải nền từng ảnh một, chỉ lúc máy rảnh; tạm dừng khi đang trong trận hoặc tab ẩn để không giật hình */
function bgBusy20(){try{if(document.hidden)return true;const lb=$("lobby");if(G&&G.phase!=="over"&&!(lb&&lb.classList.contains("on")))return true;}catch(e){}return false;}
function bgIdle20(fn){if(window.requestIdleCallback)requestIdleCallback(fn,{timeout:2500});else setTimeout(fn,180);}
function bgRun20(q){let i=0;const nx=()=>{if(i>=q.length){refresh12();return;}if(bgBusy20()){setTimeout(()=>bgIdle20(nx),1500);return;}
  const u=q[i++];loadImg12(u,3,false).then(()=>setTimeout(()=>bgIdle20(nx),60));};setTimeout(()=>bgIdle20(nx),2500);}
function reCard12(u){const m=u.match(/\/(ct?)\/([^/?]+)\.webp/),k=m[2]+(m[1]==="c"?"@f":"");delete SP.k[k];spLoad(k);return Promise.resolve();}
function reimg12(){const L=[...IMGRT.bad];IMGRT.bad.clear();
  return runPool12(L.map(u=>()=>(/\/ct?\/[^/]+\.webp/.test(u)?reCard12(u):loadImg12(u,3,true))),4).then(()=>{document.querySelectorAll("img[data-rt]").forEach(i=>{const o=i.dataset.o;i.dataset.rt="0";i.src=IMGRT.ok[o]||bust12(o,9);});IMGRT.fixed=1;refresh12();});}
/* (nút Tải lại hình, tốc độ, nhạc trong trận được đồng bộ ngay trong openSet ở trên) */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#setReimg");if(!b)return;b.disabled=true;b.textContent="Đang tải lại…";reimg12().then(()=>{b.disabled=false;b.textContent="Tải lại hình"+(IMGRT.bad.size?` (${IMGRT.bad.size} ảnh lỗi)`:" ✓");});});
/* ---- hào quang: khung ảnh xử lý tĩnh 1 lần (tăng alpha/tương phản) + viền màu đặc + quầng ---- */
const KHP12={};
function khKey12(id){const e=elOf(id);let k=KH11[e];if(!k){const hue=(lhash(id)>>>4)%360;k=hue<45||hue>=300?"khung_lua":hue<90?"khung_set":hue<170?"khung_moc":"khung_nuoc";}return k;}
function khProc12(k){if(KHP12[k])return KHP12[k].p;const u=vimg(k),o=KHP12[k]={u:null,p:null};if(!u)return o.p=Promise.resolve();
  return o.p=loadImg12(u,3,true).then(im=>{if(!im)return;try{const cv=document.createElement("canvas");cv.width=im.naturalWidth;cv.height=im.naturalHeight;const x=cv.getContext("2d");x.drawImage(im,0,0);
    const d=x.getImageData(0,0,cv.width,cv.height),a=d.data;for(let i=0;i<a.length;i+=4){const al=a[i+3];if(!al)continue;a[i+3]=Math.min(255,al*2.6);const r=a[i],g=a[i+1],b=a[i+2],m=(r+g+b)/3;
      for(let j=0;j<3;j++){const v=a[i+j];a[i+j]=Math.max(0,Math.min(255,(m+(v-m)*1.35-128)*1.2+128+12));}}x.putImageData(d,0,0);
    return new Promise(r=>cv.toBlob(bl=>{if(bl){o.u=URL.createObjectURL(bl);document.querySelectorAll(`.kh11b[data-k="${k}"]`).forEach(e=>e.style.borderImageSource=`url('${o.u}')`);}r();},"image/png"));}catch(e){}});}
function khPre12(){const ks=["khung_lua","khung_nuoc","khung_set","khung_moc"];if(IMGS.v16&&IMGS.v16.khung_lua)return Promise.all(ks.map(k=>loadImg12(IMGS.v16[k],2,true)));return Promise.all(ks.map(khProc12));}
function khIn11(inst){const id=(E.ab(inst)&&C[E.ab(inst)])?E.ab(inst):inst.id,k=khKey12(id),u16=v16Pre(k);
  if(u16)return `<span class="kh16" data-k="${k}" style="background-image:url('${u16}')" aria-hidden="true"></span>`;
  const [c1]=acol9(id),u=vimg(k);if(!u)return "";khProc12(k);const P=KHP12[k];
  return `<span class="kh12s" style="--kc:${c1}" aria-hidden="true"></span><span class="kh11b" data-k="${k}" style="border-image-source:url('${(P&&P.u)||u}')" aria-hidden="true"></span>`;}
/* ---- chiêu thức: nhịp bay mượt 60 FPS, đuôi hạt WebGL GPU, ánh đèn sân khấu nhẹ không gây giật ---- */
T8.FLY=260;T8.REACT=200;
function osz10(t,w){return Math.max(44,Math.min(150,(w||cw10())*(t==="sword"||t==="saber"||t==="arrow"?1.7:1.25)));}
const OBJ12=[];let OBJN12=0;
{const _o=obj8;obj8=function(type){const d=_o.apply(this,arguments);if(type==="img"){const W=osz10("img");d.style.width=W+"px";d.style.height=W+"px";}v16Activate(d);OBJ12.push(d);OBJN12++;if(OBJ12.length>60)OBJ12.shift();return d;};}
function burst11(key,p,w,dl){if(reduced||!p)return false;if(IMGS.v16&&IMGS.v16[key]){playV16(key,p.x,p.y,Math.max(92,(w||cw10())*2.2),520,dl||0);return true;}const u=vimg(key);if(!u)return false;fxT(()=>{const d=document.createElement("div"),W=Math.max(70,(w||cw10())*2.2);d.className="vb11";d.style.cssText=`left:${p.x}px;top:${p.y}px;width:${W}px;height:${W}px`;d.innerHTML=`<img src="${u}" alt="">`;document.body.appendChild(d);
  const a=d.animate([{transform:"translate(-50%,-50%) scale(.35)",opacity:0},{transform:"translate(-50%,-50%) scale(1)",opacity:1,offset:.37},{transform:"translate(-50%,-50%) scale(1.04)",opacity:1,offset:.45},{transform:"translate(-50%,-50%) scale(1.2)",opacity:0}],{duration:950,easing:"ease-out",fill:"forwards"});a.onfinish=()=>d.remove();fxT(()=>d.remove(),1200);},dl||0);return true;}
/* năng lượng thẻ trên tay / bộ bài */
K8.cost=["#7fe0ff","gem",""];GLAB.cost="NĂNG LƯỢNG";
{const _pk=pickObj10;pickObj10=function(s){return s&&s.k==="cost"?"gem":_pk(s);};const _cl=col10;col10=function(s){return s&&s.k==="cost"?(s.d>0?"#ff7a9a":"#7fe0ff"):_cl(s);};}
{const _p9m=plan9m;plan9m=function(evA,R0,R1,steps,W){_p9m(evA,R0,R1,steps,W);try{cost12(evA,steps,W);}catch(e){console.error(e);}};}
function cost12(evA,steps,W){const X=evA.x7;if(!X||!X.cm||!X.cm.length)return;
  const sev=evA.find(e=>e.k==="skill"||e.k==="act"),SRC=sev?sev.uid:((evA.find(e=>e.src>0&&e.k!=="loc")||{}).src||0),sp=SRC?W(SRC):null;
  /* gpu29: lá trên cùng bộ bài có sự kiện "top" -> runTop29 diễn trên chính mặt thẻ, không gộp vào cụm bộ bài */
  const tops=new Set(evA.filter(e=>e.k==="top").map(e=>e.uid)),foe=[];
  const zs={};for(const q of X.cm){if(tops.has(q.u))continue;let tp=q.s==="p"&&q.z==="hand"?hpt(q.u):null;
    if(tp){steps.push({k:"cost",src:sp?SRC:0,dst:q.u,sp,tp,d:q.d,hc:q.u});S8.add("m"+q.u);continue;}
    /* tay đối thủ: mỗi lá bị đổi năng lượng một mặt sau nhỏ xếp quạt dưới ảnh đối thủ (đúng số lá, không gộp ×n) */
    if(q.z==="hand"&&q.s!=="p"){foe.push(q);continue;}
    const k=q.s+q.z;if(!zs[k]){const zid=q.z==="deck"?(q.s==="p"?"meSub":"oppSub"):(q.s==="p"?"hand":"avFoe"),p=zpt(zid)||(q.z==="deck"?DECKZ(q.s):HANDZ(q.s));if(!p)continue;zs[k]={k:"cost",src:sp?SRC:0,dst:-1,sp,tp:p,d:q.d,zid,n:0};steps.push(zs[k]);}zs[k].n++;}
  if(foe.length){const av=$("avFoe"),r=av?av.getBoundingClientRect():null;if(r&&r.width){const n=foe.length,w=Math.round(Math.max(30,Math.min(46,cw10()*.78))),h=Math.round(w*1.38),
      gap=Math.min(w*.92,(innerWidth*.86-w)/Math.max(1,n-1)),cx=Math.min(innerWidth-((n-1)*gap+w)/2-6,r.left+r.width/2),y=r.bottom+h/2+12;
    foe.forEach((q,i)=>steps.push({k:"cost",src:sp?SRC:0,dst:-1,sp,tp:{x:cx+(i-(n-1)/2)*gap,y,w,h},d:q.d,fh:1,fu:q.u}));}}
  X.cm8=1;}
{const _h=hit8;hit8=function(s){if(s.k!=="cost")return _h(s);const tp=s.tp,up=s.d>0,c=up?"#ff9aa8":"#7fe0ff";
  if(typeof window.playV16==="function")window.playV16("nang_luong",tp.x,tp.y,Math.max(96,(tp.w||50)*1.8),480,0);
  if(s.hc){const el=document.querySelector(`#hand [data-hc="${s.hc}"]`),cs=el&&el.querySelector(".cst");if(el)pulse(`#hand [data-hc="${s.hc}"]`,[{transform:"scale(1)"},{transform:"scale(1.16) translateY(-8px)",offset:.4},{transform:"scale(1)"}],560);
    if(cs){cs.classList.remove("c12d","c12u");void cs.offsetWidth;cs.classList.add(up?"c12u":"c12d");fxT(()=>cs.classList.remove("c12d","c12u"),1000);}}
  else if(s.zid)pulse("#"+s.zid,[{transform:"scale(1)"},{transform:"scale(1.3)",offset:.4},{transform:"scale(1)"}],480);
  FX.glow(tp.x,tp.y,c,44,.45);burst11("song_xung",tp,tp.w||44);
  say(tp.x,tp.y-(s.hc?(tp.h||60)*.62:30),(up?"+":"−")+Math.abs(s.d)+" NĂNG LƯỢNG"+(s.n>1?" ×"+s.n:""),c);SFX.fam(up?"costup":"costdn",{el:elU(s.src)});};}
{const _sg=sayGroup11;sayGroup11=function(s){if(s.k!=="cost")return _sg(s);const L=s.grp.list,d=L[0].d,same=L.every(x=>x.d===d);say(s.grp.c.x,sy8({x:s.grp.c.x,y:s.grp.c.top,h:s.tp.h}),(same?(d>0?"+":"−")+Math.abs(d)+" NĂNG LƯỢNG":"ĐỔI NĂNG LƯỢNG")+" ×"+L.length,d>0?"#ff9aa8":"#7fe0ff");};}
/* ánh đèn sân khấu GPU siêu nhẹ (không tái tạo SVG mask toàn màn hình gây khựng) */
const DIM12={el:null,h:[],n:0};
function dimDraw12(){let el=DIM12.el;if(!DIM12.h.length){if(el)el.classList.remove("on");return;}if(!el){el=DIM12.el=document.createElement("div");el.id="dim12";el.setAttribute("aria-hidden","true");document.body.appendChild(el);}
  const last=DIM12.h[DIM12.h.length-1],p0=last&&last.ps&&last.ps[0];if(p0){el.style.setProperty("--sx",p0.x.toFixed(0)+"px");el.style.setProperty("--sy",p0.y.toFixed(0)+"px");}
  if(!el.classList.contains("on"))requestAnimationFrame(()=>{if(DIM12.h.length)el.classList.add("on");});}
function dimStep12(s){if(reduced||s.k==="loc"||s.k==="lshield"||(s.grp&&s.grp.i>0))return;const ps=[];if(s.tp)ps.push(s.tp);else if(s.sp)ps.push(s.sp);if(!ps.length)return;
  const ms=(s.k==="move"||s.k==="swap")?mvDur9(s):((s.sp?(s.nl?0:T8.LIFT)+T8.FLY:0)+T8.REACT+((s.k==="steal"||s.k==="copy")?T8.BACK+140:0));const id=++DIM12.n;DIM12.h.push({id,ps});dimDraw12();
  fxT(()=>{DIM12.h=DIM12.h.filter(x=>x.id!==id);dimDraw12();},ms+80);}
const LBL12={kill:"Tiêu huỷ",steal:"Cướp chiêu",copy:"Sao chép",sil:"Xoá chiêu",up:"Cường hoá",down:"Trừ điểm",lplus:"+Điểm địa",lminus:"−Điểm địa",reset:"Đặt lại điểm",summon:"Triệu hồi",bounce:"Trả về tay",move:"Dời thẻ",swap:"Đổi phe",cost:"Đổi năng lượng"};
function srcLbl12(s){if(reduced||(s.grp&&s.grp.i>0)||!s.sp||!LBL12[s.k])return;if(s.src>0&&s.k!=="lplus"&&s.k!=="lminus"&&window.CardChoreo)return;let n="";if(s.src>0){const c=anyC(s.src);n=c&&C[c.id]?C[c.id].n:"";}else if(s.li!=null&&G&&G.locs[s.li]){const L=LOC[G.locs[s.li].id];n=L?L.n:"";}if(!n)return;
  say(s.sp.x,sy8(s.sp),n+" ▸ "+LBL12[s.k],"#fff3c4");}
{const _r=run8;run8=function(s){try{dimStep12(s);srcLbl12(s);}catch(e){}return _r(s);};}
setTimeout(boot12,0);

/* ===== v12b: chiêu riêng từng thẻ (SIGV sinh từ tools/chieu_rieng_ds.json) ===== */
let CUR12=null;const STEPS12=[];
function sigOf12(uid){const c=uid>0?anyC(uid):null;if(!c)return null;const id=E.ab(c)&&SIGV[E.ab(c)]?E.ab(c):c.id,s=SIGV[id];if(!s)return null;const k16=String(s.img||"").replace(/^v_/,"")||id,h16=v16Html(k16,480,1,14)||v16Html(id,480,1,14);if(h16)return {u:IMGS.v16[k16]||IMGS.v16[id],kieu:s.kieu||"phong",html:h16};const u=vimg(s.img)||vimg(id);return u?{u,kieu:s.kieu||"phong",html:`<img src="${u}" alt="" draggable="false">`}:null;}
function sigEl12(html,W){const d=document.createElement("div");d.className="p8 p12s";d.style.width=W+"px";d.style.height=W+"px";d.innerHTML=html;document.body.appendChild(d);v16Activate(d);return d;}
function sigFly12(a,b,g,dur,dl,cb,s){dl=dl||0;if(reduced||!a||!b){if(cb)fxT(cb,dl+dur);return;}
  const cw=(b.w||cw10()),W=Math.max(64,Math.min(240,cw*2.1)),k=g.kieu;
  if(k==="quet"&&s&&s.grp&&s.grp.i>0){if(cb)fxT(cb,dl+dur);return;}
  fxT(()=>{const mk=(op,lag)=>{const d=sigEl12(g.html,W);if(op<1){d.classList.add("tr12");d.style.filter=`opacity(${op}) blur(${lag*.5}px)`;}return d;};
    const run=(op,lag)=>{const d=mk(op,lag),T=(x,y,r,sc)=>`translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(r||0).toFixed(1)}deg) scale(${sc||1})`;let kf,D=dur,ox=b.x,oy=b.y;
      if(k==="giang"){const h=Math.max(150,(b.h||70)*2.6);ox=b.x;oy=b.y-h;kf=[{transform:T(0,0,0,.6),opacity:0},{transform:T(0,h*.25,0,1),opacity:1,offset:.25},{transform:T(0,h,0,1.05),opacity:1,offset:.92},{transform:T(0,h-6,0,1),opacity:1}];}
      else if(k==="quet"){let x0=b.x,x1=b.x;if(s&&s.grp)for(const q of s.grp.list){x0=Math.min(x0,q.tp.x);x1=Math.max(x1,q.tp.x);}const sp=Math.max(W*.9,90);ox=x0-sp;oy=b.y;D=dur*1.25;const L=x1-x0+sp*2;
        kf=[{transform:T(0,0,-25,.8),opacity:0},{transform:T(sp*.5,0,-12,1),opacity:1,offset:.25},{transform:T(sp,0,0,1.08),opacity:1,offset:.6},{transform:T(L,0,15,1),opacity:0}];}
      else if(k==="nem_vong"){ox=a.x;oy=a.y;const dx=b.x-a.x,dy=b.y-a.y,lift=-Math.min(90,Math.hypot(dx,dy)*.45);D=dur+520;const f=dur/D;
        kf=[{transform:T(0,0,0,.5),opacity:0},{transform:T(dx*.5,dy*.5+lift,360,1),opacity:1,offset:f*.5},{transform:T(dx,dy,720,1.05),opacity:1,offset:f},{transform:T(dx*.5,dy*.5-lift*.6,1080,1),opacity:1,offset:f+(1-f)*.5},{transform:T(0,0,1440,.6),opacity:0}];}
      else{/* keo */ox=a.x;oy=a.y;const dx=b.x-a.x,dy=b.y-a.y,r=Math.atan2(dy,dx)*57.2958;D=dur+460;const f=dur/D;
        kf=[{transform:T(0,0,r,.5),opacity:0},{transform:T(dx,dy,r,1.05),opacity:1,offset:f},{transform:T(dx,dy,r,1),opacity:1,offset:f+(1-f)*.2},{transform:T(dx*.12,dy*.12,r,.8),opacity:1,offset:.96},{transform:T(0,0,r,.6),opacity:0}];}
      d.style.left=ox+"px";d.style.top=oy+"px";const an=d.animate(kf,{duration:D,easing:k==="giang"?"cubic-bezier(.55,0,.9,.6)":"cubic-bezier(.42,.05,.45,1)",fill:"both"});an.onfinish=()=>d.remove();fxT(()=>d.remove(),D+300);return D;};
    run(1,0);
    if(k==="keo"&&a){playV16("hut_keo",b.x,b.y,Math.max(96,cw*1.85),480,dur*.6);fxT(()=>{const el=s&&(s.ph||tEl8(s.dst));if(el)anim(el,[{transform:"none"},{transform:`translate(${((a.x-b.x)/Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))*14).toFixed(1)}px,${((a.y-b.y)/Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))*14).toFixed(1)}px) scale(1.06)`,offset:.5},{transform:"none"}],{duration:420,fill:"none"});},dur+60);}
    if(cb)fxT(cb,dur);},dl);}
{const _f=fly8;fly8=function(a,b,type,c,dur,dl,cb,html){const s=CUR12;if(type==="img"&&s&&s.sig){if(s.sig.kieu!=="phong")return sigFly12(a,b,s.sig,dur,dl,cb,s);
    if(s.grp&&s.grp.i>0&&false)return;}return _f(a,b,type,c,dur,dl,cb,html);};}
{const _p=pre8;pre8=function(s){STEPS12.push(s);return _p(s);};}
{const _r=run8;run8=function(s){const g=s.sp&&s.tp&&s.src>0?sigOf12(s.src):null;s.sig=g;
    if(g&&!s.grp&&(s.k==="kill"||s.k==="sil"||s.k==="steal"||s.k==="copy")){try{dimStep12(s);srcLbl12(s);}catch(e){}
      const el=mcEl9(s.src),sp=s.sp,tp=s.tp,L0=s.nl?0:T8.LIFT,c=col10(s);if(el)fxT(()=>lean10(el,sp,tp),Math.max(0,L0-120));FX.glow(sp.x,sp.y,c,Math.min(32,(sp.w||50)*.5),.5);
      CUR12=s;try{fly8(sp,tp,"img",c,T8.FLY,L0,null,g.html);}finally{CUR12=null;}
      fxT(()=>{hit8(s);recoil10(s.ph||tEl8(s.dst),sp,tp);},L0+T8.FLY);
      if(s.k==="steal"||s.k==="copy")fxT(()=>{const cur=where7(s.src,null,rects())||sp,html=s.abId?liteId(s.abId):null;fly8(tp,cur,"card",c,T8.BACK,0,()=>{if(el)pop9(el,1.16,480);FX.ring(cur.x,cur.y,c,Math.min(40,(cur.w||50)*.6),3);
        const nm=s.abId&&C[s.abId]?C[s.abId].n:"";say(cur.x,sy8(cur),(s.k==="steal"?"CƯỚP KỸ NĂNG":"CHÉP KỸ NĂNG")+(nm?": "+(nm.length>14?nm.slice(0,13)+"…":nm):""),s.k==="steal"?"#e0b0ff":"#bff4ff");SFX.fam(s.k==="steal"?"steal":"copy",{el:elU(s.src)});},html);},L0+T8.FLY+T8.REACT-80);
      return;}
    if(g&&s.k==="loc"){/* đổi chiến địa: vật thể riêng bay tới biển chiến địa */CUR12=s;try{fly8(s.sp,s.tp,"img","#fff",T8.FLY,0,null,g.html);}finally{CUR12=null;}}
    CUR12=s;try{return _r(s);}finally{CUR12=null;}};}
/* thẻ có ảnh riêng nhưng kỹ năng không nhắm thẻ khác: diễn quanh chính thẻ khi lật (hoặc bay tới biển chiến địa / bộ bài) */
function selfSig12(uid,evA){const g=sigOf12(uid);if(!g||reduced)return;const el=tEl8(uid);if(!el)return;const r=el.getBoundingClientRect(),p={x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};
  const c=anyC(uid),side=c?c.side:"p";let to=null;const lf=evA.find(e=>(e.k==="locfx"||e.k==="loc")&&(e.src===uid||!e.src));
  if(lf&&lf.li!=null)to=plate8(lf.li);else if(evA.some(e=>(e.k==="tohand"||e.k==="draw"||e.k==="surge")&&(e.src===uid)))to=DECKZ(side);
  srcLbl12({k:"self",grp:null,sp:p,src:uid});
  if(to&&g.kieu!=="quet"){sigFly12(p,to,g,T8.FLY,200,()=>{burst11(elKey11(uid)||"song_xung",to,p.w);},{dst:0});return;}
  /* bay vòng quanh thẻ */
  fxT(()=>{const W=Math.max(54,Math.min(200,p.w*1.7)),d=sigEl12(g.html,W),R=Math.max(p.w,p.h)*.62,kf=[];for(let i=0;i<=12;i++){const t=i/12,an=-Math.PI/2+t*Math.PI*2,rot=g.kieu==="giang"?an*57.3-90:an*57.3+90;
      kf.push({transform:`translate(-50%,-50%) translate(${(Math.cos(an)*R).toFixed(1)}px,${(Math.sin(an)*R).toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${(.7+.3*Math.sin(t*Math.PI)).toFixed(2)})`,opacity:i===0||i===12?0:1});}
    d.style.left=p.x+"px";d.style.top=p.y+"px";const a=d.animate(kf,{duration:1100,easing:"ease-in-out",fill:"both"});a.onfinish=()=>{d.remove();burst11(elKey11(uid)||"song_xung",p,p.w);pop9(el,1.12,420);};fxT(()=>d.remove(),1500);},250);}
LBL12.self="KỸ NĂNG";
{const _p8=plan8;plan8=function(evA,R0,R1,P0,P1){STEPS12.length=0;const T=_p8(evA,R0,R1,P0,P1);try{if(!reduced&&G)for(const e of evA)if(e.k==="flip"&&sigOf12(e.uid)&&!STEPS12.some(s=>s.src===e.uid))selfSig12(e.uid,evA);}catch(x){console.error(x);}return T;};}


/* ===== gpu29 (tiếp): che kết quả tới lúc đòn trúng · năng lượng từng lá trên tay (cả tay đối thủ) · lá trên cùng bộ bài ===== */
let PWL=0,P8=null,PULLD29=0;const TP29=new Set();
K8.top=["#ffe08a","",""];
/* (d) che số sức mạnh / năng lượng tới lúc trúng */
function mask29(s){
  if(/^(up|down|lplus|lminus|reset)$/.test(s.k)){const el=tEl8(s.dst),pw=el&&el.querySelector(".pwh");if(!pw)return;const v1=parseInt(pw.textContent,10);if(isNaN(v1))return;
    const v0=s.k==="reset"?(P8&&P8.has(s.dst)?P8.get(s.dst):null):v1-(s.d||0);if(v0==null||isNaN(v0)||v0===v1)return;
    s.m29={el:pw,t:pw.textContent,c:pw.className};pw.textContent=v0;pw.className="pwh";const dl=el.querySelector(".dl");if(dl){s.m29.dl=dl;dl.style.visibility="hidden";}}
  else if(s.k==="cost"&&s.hc){const el=document.querySelector(`#hand [data-hc="${s.hc}"]`),cs=el&&el.querySelector(".cst");if(!cs)return;const v1=parseInt(cs.textContent,10);if(isNaN(v1))return;
    s.m29={el:cs,t:cs.textContent,c:cs.className};cs.textContent=Math.max(0,v1-(s.d||0));cs.className="cst";}
  else if(s.k==="summon"&&s.hid){s.hid.style.visibility="hidden";s.vh29=s.hid;}
  else if(s.k==="cost"&&s.fh&&!reduced){/* mặt sau nhỏ của lá trên tay đối thủ, hiện cho tới hết nhịp */const t=s.tp,d=document.createElement("div");d.className="fxg fxchip c29f";
    d.style.cssText=`left:${(t.x-t.w/2).toFixed(1)}px;top:${(t.y-t.h/2).toFixed(1)}px;width:${t.w}px;height:${t.h}px;z-index:46`;d.innerHTML=BACK7();document.body.appendChild(d);
    anim(d,[{transform:"translateY(-14px) scale(.6)",opacity:0},{transform:"none",opacity:1}],{duration:260,fill:"both"});s.fb=d;}}
function unmask29(s){if(s.vh29){const h=s.vh29;s.vh29=null;fxT(()=>{h.style.visibility="";},s.k==="summon"?520:0);}const m=s.m29;if(!m)return;s.m29=null;if(m.el&&m.el.isConnected){m.el.textContent=m.t;m.el.className=m.c;}if(m.dl)m.dl.style.visibility="";}
{const _p=pre8;pre8=function(s){const r=_p(s);try{if(s.k==="top")preTop29(s);else mask29(s);}catch(e){console.error(e);}return r;};}
{const _q=post8;post8=function(s){try{unmask29(s);if(s.fb){const d=s.fb;s.fb=null;const a=anim(d,[{opacity:1},{opacity:0,transform:"translateY(-8px) scale(.85)"}],{duration:240,fill:"forwards"});if(a)a.onfinish=()=>d.remove();fxT(()=>d.remove(),400);}if(s.k==="top")postTop29(s);}catch(e){}return _q(s);};}
{const _h=hit8;hit8=function(s){try{unmask29(s);}catch(e){}const r=_h(s);
  try{if(s.self29&&HERO.uid===s.dst&&HERO.g){const el=mcEl9(s.dst),src=el&&el.querySelector(".pwh"),pw=HERO.g.querySelector(".pwh");if(pw&&src){pw.textContent=src.textContent;pw.className=src.className;anim(pw,[{transform:"scale(1)"},{transform:"scale(1.9)",offset:.35},{transform:"scale(1)"}],{duration:520,fill:"none"});}const dl=HERO.g.querySelector(".dl");if(dl)dl.style.visibility="";}}catch(e){}
  try{if(s.k==="cost"&&s.fb){const d=s.fb,up=s.d>0;anim(d,[{transform:"none"},{transform:"scale(1.22) translateY(-6px)",offset:.4},{transform:"none"}],{duration:480,fill:"none"});
    const b=document.createElement("b");b.className="c29b"+(up?" up":"");b.textContent=(up?"+":"−")+Math.abs(s.d);d.appendChild(b);}}catch(e){}return r;};}
/* (8) lá trên cùng bộ bài: lật ra từ bộ bài, hiện mặt đủ lâu để đọc, trúng đòn rồi chịu đúng hành động */
/* gpu35: rút gọn — lá hiện ≈0,45 s gốc (≈0,9 s thật ở SPD 2,0) từ lúc lật xong tới lúc thu về; tua nhanh (FFTURN) ×0,6; chạm để bỏ qua */
const TOPT0={RISE:200,HOLD:210,OUT:200,PLACE:420,LIFT:40,FLY:200},TOPT={};for(const k in TOPT0)Object.defineProperty(TOPT,k,{get(){return Math.round(TOPT0[k]*((window.FFTURN&&FFTURN.on)?.6:1));}});
const TOPLB={buff:"",steal:"",set:"",cost:"",fix6:"NĂNG LƯỢNG 6 ĐẾN LƯỢT 6",exile:"TRỤC XUẤT",destroy:"TIÊU HUỶ",discard:"VỨT BỎ",place:"LÊN CHIẾN ĐỊA",peek:"LỘ THẺ TRÊN CÙNG"};
function topHit29(s){return TOPT.RISE+(s.sp2&&!s.ns?TOPT.LIFT+TOPT.FLY:100);}
function topDur29(s){const h=topHit29(s);return h+(s.a==="place"?TOPT.PLACE+120:TOPT.HOLD+TOPT.OUT)+(s.extra||0);}
function topStg29(s){return s.ns?TOPT.RISE+60:s.a==="place"?topHit29(s)+TOPT.PLACE+60:topDur29(s)-TOPT.OUT+T8.GAP;}
/* chỗ hiện thẻ: ngay dưới cụm bộ bài, xếp vào phía trong màn hình */
function topSpot29(side,i,row2){const dz=DECKZ(side)||{x:innerWidth/2,y:30,w:44,h:62},W=Math.round(Math.max(76,Math.min(118,innerWidth*.27))),H=Math.round(W*1.36),gap=W*.86;
  const x0=Math.min(innerWidth-W/2-6,Math.max(W/2+6,dz.x)),dir=dz.x<innerWidth/2?1:-1,x=Math.min(innerWidth-W/2-6,Math.max(W/2+6,x0+dir*i*gap));
  const y=Math.round(dz.y+(dz.h||40)/2+H/2+10+(row2?H+30:0));return {x,y,w:W,h:H,dz};}
const topPub29=e=>e.side==="p"||/^(exile|destroy|discard|place)$/.test(e.a);
function topSteps29(evA,steps,W){TP29.clear();if(reduced)return;const tops=evA.filter(e=>e.k==="top");if(!tops.length)return;
  /* cùng một kỹ năng tác động cả hai bộ bài (vd Thuỷ Thân) -> diễn đồng thời ở hai cụm bộ bài */
  const gs=new Map();for(const e of tops){const k=e.a+"|"+(e.src||0);if(!gs.has(k))gs.set(k,[]);gs.get(k).push(e);}
  const out=[];for(const [,es] of gs){const e0=es[0],src=e0.src>0?e0.src:0,sp2=src?W(src):null;
    topLay29(es,src&&sp2?heroRect35(src,sp2):null);
    const s={k:"top",a:e0.a,side:e0.side,src,dst:e0.uid,sp:null,sp2,tp:es[0].sp,es};
    if(e0.a==="place"){for(const e of es){TP29.add(e.uid);S8.add("u"+e.uid);for(let j=steps.length-1;j>=0;j--)if(steps[j].k==="summon"&&steps[j].dst===e.uid)steps.splice(j,1);}}
    /* Thiết Thiếu Niên: đòn "chép kỹ năng" bay tới chính lá vừa lật ra, lá chờ tới lúc chép xong mới về bộ bài */
    if(e0.a==="peek"){const cp=steps.find(x=>(x.k==="copy"||x.k==="steal")&&es.some(e=>e.uid===x.dst));if(cp){cp.tp=es[0].sp;s.ns=1;s.extra=T8.LIFT+T8.FLY+T8.REACT;}}
    out.push(s);}
  steps.unshift(...out);}
{const _p9=plan9m;plan9m=function(evA,R0,R1,steps,W){try{topSteps29(evA,steps,W);}catch(e){console.error(e);}try{ultSteps29(evA,steps);}catch(e){console.error(e);}return _p9(evA,R0,R1,steps,W);};}
K8.ult29=["#ffd65a","",""];
function ultSteps29(evA,steps){const L=evA._ultD;if(!L||!L.length||reduced)return;
  for(const inst of L){const d=C[inst.id];if(!d)continue;const nth=ucNth(),T=ucDur(isUlt(d),nth)/SPD+90,st={k:"ult29",inst,nth,T,src:0,dst:inst.uid,sp:null,tp:{x:innerWidth/2,y:innerHeight/2,w:1,h:1}};
    const i=steps.findIndex(x=>(x.k==="summon"&&x.dst===inst.uid)||(x.k==="top"&&x.a==="place"&&x.es&&x.es.some(e=>e.uid===inst.uid)));
    if(i>=0)steps.splice(i+1,0,st);else steps.unshift(st);}}
function topFace29(e,pub){return pub?liteId(e.id,e.c0,e.p0):BACK7();}
/* ẩn bằng visibility: hoạt ảnh CSS lật thẻ (opacity) đè lên style.opacity */
function vis29(el,h){if(!el)return;hide9(el,h);el.style.visibility=h?"hidden":"";}
function preTop29(s){if(s.a!=="place")return;for(const e of s.es){const el=mcEl9(e.uid);if(el){vis29(el,1);(s.hidEls=s.hidEls||[]).push(el);}}}
function postTop29(s){if(s.hidEls){for(const el of s.hidEls)vis29(el,0);s.hidEls=null;}if(s.gs){for(const g of s.gs)g.remove();s.gs=null;}}
function runTop29(s){const c=s.a==="exile"?"#c49bff":s.a==="steal"||s.a==="destroy"?"#ff7a9a":s.a==="place"?"#8fdc4a":"#ffe08a";s.gs=[];
  try{dimStep12({k:"top",tp:s.tp,sp:s.sp2,grp:null,nl:1});}catch(e){}
  /* (1) lật ra từ bộ bài: mặt sau rời cụm bộ bài, xoay nửa vòng thành mặt thẻ */
  s.es.forEach((e,i)=>{const t=e.sp,dz=t.dz,pub=topPub29(e),dl=i*70;
    const bk=ghost({x:t.x,y:t.y,w:t.w,h:t.h},BACK7(),"fxchip t29");bk.style.zIndex="46";const fc=ghost({x:t.x,y:t.y,w:t.w,h:t.h},topFace29(e,pub),"fxchip t29");fc.style.zIndex="46";
    const dx=(dz.x-t.x).toFixed(1),dy=(dz.y-t.y).toFixed(1),s0=Math.max(.2,(dz.w||44)/t.w).toFixed(3),R=TOPT.RISE;
    anim(bk,[{transform:`translate(${dx}px,${dy}px) scale(${s0}) rotateY(0deg)`,opacity:.3},{transform:`translate(${(dx*.4).toFixed(1)}px,${(dy*.4).toFixed(1)}px) scale(.7) rotateY(90deg)`,opacity:1}],{duration:R*.5,delay:dl,easing:"cubic-bezier(.3,.6,.4,1)",fill:"both"});
    anim(fc,[{transform:`translate(${(dx*.4).toFixed(1)}px,${(dy*.4).toFixed(1)}px) scale(.7) rotateY(-90deg)`,opacity:0},{transform:`translate(${(dx*.4).toFixed(1)}px,${(dy*.4).toFixed(1)}px) scale(.7) rotateY(-90deg)`,opacity:1,offset:.01},{transform:"translateY(-6px) scale(1.06) rotateY(0deg)",opacity:1,offset:.8},{transform:"none",opacity:1}],{duration:R*.5,delay:dl+R*.5,easing:"cubic-bezier(.2,.8,.3,1)",fill:"both"});
    fxT(()=>bk.remove(),R*.5+dl+40);e.g=fc;s.gs.push(fc);if(e.cdx)fc.dataset.cdx=e.cdx;
    if(e.cap)cap29(fc,e.side==="p"?"THẺ TRÊN CÙNG BỘ BÀI":"BỘ BÀI ĐỐI THỦ","#fff3c4");
    fxT(()=>FX.glow(t.x,t.y,c,Math.min(70,t.w*.8),.45),R+dl);});
  try{SFX.play("place");}catch(e){}
  /* (2) đòn từ thẻ nguồn bay tới lá vừa lật */
  const tH=topHit29(s);
  if(s.sp2&&!s.ns){fxT(()=>{lift8(s.src,s.sp2,c);const im=sigImg9(s.src);for(const e of s.es.slice(0,3))fly8(s.sp2,e.sp,im?"img":"bolt",c,TOPT.FLY,TOPT.LIFT,null,im||undefined);},TOPT.RISE);}
  /* (3) trúng: hành động đúng theo kỹ năng */
  let acted=0,outd=0;const act=()=>{if(acted)return;acted=1;for(const e of s.es)try{topAct29(s,e,c);}catch(x){console.error(x);}};
  const tA=fxT(act,tH);
  /* (4) lá còn ở bộ bài thu nhỏ bay về cụm bộ bài */
  const back=!(s.a==="place"||/^(exile|destroy|discard)$/.test(s.a)),out=q=>{if(outd)return;outd=1;for(const e of s.es){const g=e.g,t=e.sp;if(!g||!g.isConnected)continue;const dz=t.dz;
      const a=anim(g,[{transform:"none",opacity:1},{transform:`translate(${(dz.x-t.x).toFixed(1)}px,${(dz.y-t.y).toFixed(1)}px) scale(${Math.max(.2,(dz.w||44)/t.w).toFixed(3)})`,opacity:.15}],{duration:q,easing:"cubic-bezier(.5,0,.6,1)",fill:"forwards"});if(a)a.onfinish=()=>g.remove();fxT(()=>g.remove(),q+80);
      fxT(()=>pulse("#"+(e.side==="p"?"meSub":"oppSub"),[{transform:"scale(1)"},{transform:"scale(1.25)",offset:.4},{transform:"scale(1)"}],420),q-40);}};
  const tO=back?fxT(()=>out(TOPT.OUT),tH+TOPT.HOLD+(s.extra||0)):0;
  holdFx(topDur29(s)+80);
  /* gpu35: chạm màn hình khi lá đang hiện -> trúng/thu về ngay (lá chép kỹ năng của Thiết Thiếu Niên chờ đòn chép nên không bỏ qua) */
  if(!s.ns){const t0=performance.now();s.skip=()=>{clearTimeout(tA);clearTimeout(tO);act();if(back)fxT(()=>out(120),s.a==="peek"?160:60);
      try{const left=topDur29(s)-(performance.now()-t0)/SPD,rest=STEPS12.some(x=>x!==s&&(x.t0||0)>(s.t0||0));if(!rest){hold29InfoRel();if(left>300)FX_UNTIL=Math.min(FX_UNTIL,performance.now()+300*SPD);}}catch(e){}};
    TOPSK.add(s);fxT(()=>TOPSK.delete(s),topDur29(s));}}
const TOPSK=new Set();
document.addEventListener("pointerdown",()=>{if(!TOPSK.size)return;const L=[...TOPSK];TOPSK.clear();for(const s of L)try{s.skip();}catch(e){console.error(e);}try{noClick=Date.now()+450;}catch(e){}},true);
/* chú thích ngay dưới lá thẻ (đi theo lá, không phải thông báo nửa trên sân) */
/* gpu35: chú thích gắn vào lá nằm trên cùng (lá cuối) của nhóm, dịch về giữa nhóm (data-cdx) để không bị lá sau đè */
function cap29(g,t,c){if(!g||!t)return;let d=g.querySelector(".t29cap");if(!d){d=document.createElement("div");d.className="t29cap";const dx=+(g.dataset.cdx||0);if(dx)d.style.left=`calc(50% + ${dx}px)`;g.appendChild(d);}d.textContent=t;d.style.color=c||"#fff";anim(d,[{opacity:.2,transform:"translateX(-50%) scale(.8)"},{opacity:1,transform:"translateX(-50%) scale(1)"}],{duration:200,fill:"none"});}
function topNum29(g,sel,v,up){const b=g&&g.querySelector(sel);if(!b||v==null)return;b.textContent=v;b.classList.add(up?"t29u":"t29d");anim(b,[{transform:"scale(1)"},{transform:"scale(1.9)",offset:.35},{transform:"scale(1)"}],{duration:520,fill:"none"});}
function topAct29(s,e,c){const g=e.g,t=e.sp,pub=topPub29(e);if(!g)return;const r={x:t.x,y:t.y,w:t.w,h:t.h,html:topFace29(e,pub)},ly=t.y-t.h/2-12;
  FX.glow(t.x,t.y,c,Math.min(64,t.w*.7),.5);
  switch(e.a){
    case "buff":case "steal":case "set":case "cost":case "fix6":{const dc=e.c1!=null&&e.c1!==e.c0,dp=e.p1!=null&&e.p1!==e.p0;
      if(pub){if(dc)topNum29(g,".lcc",e.c1,e.c1>e.c0);if(dp)topNum29(g,".lcp",e.p1,e.p1>e.p0);}
      anim(g,[{transform:"none"},{transform:`scale(1.1) rotate(${e.a==="steal"?-4:3}deg)`,offset:.35},{transform:"none"}],{duration:460,fill:"none"});
      let tx=TOPLB[e.a];if(!tx){const q=[];if(dc)q.push(e.a==="set"||e.a==="cost"?"NĂNG LƯỢNG → "+e.c1:(e.c1>e.c0?"+":"−")+Math.abs(e.c1-e.c0)+" NĂNG LƯỢNG");if(dp)q.push(e.a==="set"?"SỨC MẠNH → "+e.p1:(e.p1>e.p0?"+":"−")+Math.abs(e.p1-e.p0)+" SỨC MẠNH");tx=q.join(" · ");}
      if(tx)cap29(g,tx,e.a==="steal"?"#ff9aa8":dp&&e.p1>e.p0?"#7dffb0":"#bff4ff");
      try{playV16(e.a==="steal"?"giam_suc":dp&&e.p1>e.p0?"tang_suc":"nang_luong",t.x,t.y,Math.max(96,t.w*1.6),480,0);}catch(x){}
      if(e.a==="steal"&&e.to){const to=where7(e.to,null,rects());if(to)fly8(t,to,"bolt","#ff9aa8",T8.FLY,120,()=>{FX.glow(to.x,to.y,"#7dffb0",40,.5);pulse(`#board [data-mc="${e.to}"]`,[{transform:"scale(1)"},{transform:"scale(1.15)",offset:.4},{transform:"scale(1)"}],420);});}
      SFX.fam(e.a==="steal"?"dn1":dp&&e.p1>e.p0?"up1":"costdn",{el:elU(s.src)});break;}
    case "peek":{anim(g,[{transform:"none"},{transform:"scale(1.08)",offset:.4},{transform:"none"}],{duration:420,fill:"none"});if(e.sum!=null){if(e.cap)cap29(g,"TỔNG "+e.sum,"#ffe08a");}else cap29(g,TOPLB.peek,"#ffe08a");break;}
    case "exile":{g.style.zIndex="47";const a=anim(g,[{transform:"none",opacity:1,filter:"none"},{transform:"scale(1.08)",opacity:1,filter:"brightness(1.8) saturate(.4)",offset:.25},{transform:"translateY(-34px) scale(.86)",opacity:0,filter:"blur(6px) brightness(2.2) saturate(0)"}],{duration:720,easing:"ease-in",fill:"forwards"});if(a)a.onfinish=()=>g.remove();fxT(()=>g.remove(),900);
      FX.rise(t.x,t.y,"#c49bff",22);FX.rise(t.x,t.y-t.h*.2,"#efe0ff",12);cap29(g,TOPLB.exile,"#d9c2ff");SFX.fam("exile",{el:elU(s.src)});break;}
    case "destroy":{g.remove();CFX.destroy(r);cap29(g,TOPLB.destroy,"#ff9aa8");SFX.fam("destroy",{el:elU(s.src)});break;}
    case "discard":{g.remove();CFX.burn(r);const pl=PILEPT();if(pl)chip(r,{x:pl.x,y:pl.y,w:36,h:50},r.html,()=>pulse("#btnPiles",[{transform:"scale(1)"},{transform:"scale(1.3)",offset:.4},{transform:"scale(1)"}],420),260);cap29(g,TOPLB.discard,"#ffb27a");SFX.fam("discard",{el:elU(s.src)});break;}
    case "place":{const el=mcEl9(e.uid),b=el?el.getBoundingClientRect():null;if(!b||!b.width){g.remove();break;}const q={x:b.left+b.width/2,y:b.top+b.height/2},sc=(b.width/t.w).toFixed(3);
      const a=anim(g,[{transform:"none"},{transform:`translate(${((q.x-t.x)*.5).toFixed(1)}px,${((q.y-t.y)*.5-50).toFixed(1)}px) scale(${((+sc+1)/2).toFixed(3)}) rotate(-6deg)`,offset:.55},{transform:`translate(${(q.x-t.x).toFixed(1)}px,${(q.y-t.y).toFixed(1)}px) scale(${sc})`}],{duration:TOPT.PLACE,easing:"cubic-bezier(.45,.05,.4,1)",fill:"forwards"});
      const fin=()=>{if(!g.isConnected)return;g.remove();if(el){vis29(el,0);anim(el,[{transform:"scale(.9) translateY(4px)"},{transform:"scale(1.06) translateY(-3px)",offset:.5},{transform:"none"}],{duration:340,fill:"none"});}
        try{playV16("lat_the",q.x,q.y,Math.max(92,b.width*1.72),400,0);}catch(x){}FX.dust(q.x,q.y+b.height*.45,"#d8c8a0");SFX.play("place");};if(a)a.onfinish=fin;fxT(fin,TOPT.PLACE+120);
      cap29(g,TOPLB.place,"#c8ff9a");break;}
  }}
{const _r=run8;run8=function(s){if(s&&s.k==="top"){try{runTop29(s);}catch(e){console.error(e);}return;}
  if(s&&s.k==="ult29"){try{ultShow(s.inst,null,s.nth);}catch(e){console.error(e);}return;}
  /* gpu29(c): đổi sức mạnh do Duy Trì: chỉ diễn trên chính thẻ (+N/−N nổi lên, nhịp sáng, số đổi), không đòn bay, mỗi thẻ có số riêng */
  if(s&&(s.ong||s.self29)){try{hit8(s);}catch(e){console.error(e);}return;}return _r(s);};}
LBL12.top="Bộ bài";
{const _p=plan8;plan8=function(evA,R0,R1,P0,P1){PWL=0;P8=P0;PULLD29=0;const T=_p(evA,R0,R1,P0,P1);
  try{for(const s of STEPS12){if(s.k==="ult29")PULLD29=Math.max(PULLD29,(s.t0||0)+s.T);else if(s.k==="top"&&s.a==="place")PULLD29=Math.max(PULLD29,(s.t0||0)+topHit29(s)+TOPT.PLACE);}}catch(e){}
  try{for(const s of STEPS12){if(s.k==="loc"||s.k==="lshield")continue;let t;if(s.k==="move"||s.k==="swap")t=(s.t0||0)+mvDur9(s)*.85;else if(s.k==="top")t=(s.t0||0)+topHit29(s);else t=(s.t0||0)+(s.sp?(s.nl?0:T8.LIFT)+T8.FLY:0)+60;PWL=Math.max(PWL,t);}}catch(e){}
  return T;};}

/* ===== gpu35: giữ phần hiển thị phụ tới lúc đòn trúng =====
   Màu/viền bên dẫn của chiến địa + nhãn ×/± tổng giữ cùng nhịp với tổng điểm (PWH, tới đòn đổi sức mạnh cuối cùng);
   số "Bài N"/"Tay N" và lời nhắn khung thông tin (G.msg) giữ tới đòn trúng cuối cùng của bước (HIT29). */
let HIT29=0;
const H29={L:null,lon:0,ion:0,tm:0,me:null,op:null,meN:null,opN:null,m0:null,mN:null};
function hold29Start(){hold29Rel();if(reduced)return;const L=[];
  document.querySelectorAll("#board [data-lane]").forEach(ln=>{const pw=s=>{const e=ln.querySelector(".pw."+s);return !!(e&&e.classList.contains("lead"));};
    L[+ln.dataset.lane]={ld:ln.classList.contains("lp")?"lp":ln.classList.contains("la")?"la":"",pw:{a:pw("a"),p:pw("p")},mx:[...ln.querySelectorAll(".mx")].filter(e=>e.style.display!=="none").map(e=>e.outerHTML)};});
  const me=$("meSub"),op=$("oppSub");H29.L=L;H29.lon=1;H29.ion=1;H29.me=me?me.innerHTML:null;H29.op=op?op.textContent:null;H29.meN=H29.opN=null;H29.m0=H29.mN=null;
  if(GV&&G&&typeof GV.msg==="string"&&G.msg!==GV.msg){H29.m0=GV.msg;H29.mN=G.msg;G.msg=GV.msg;}
  clearTimeout(H29.tm);H29.tm=setTimeout(hold29Rel,5000*SPD);}
function hold29Lanes(){if(!H29.lon||!H29.L)return;
  document.querySelectorAll("#board [data-lane]").forEach(ln=>{const o=H29.L[+ln.dataset.lane];if(!o)return;
    ln.classList.toggle("lp",o.ld==="lp");ln.classList.toggle("la",o.ld==="la");
    for(const s of ["a","p"]){const e=ln.querySelector(".pw."+s);if(e){e.classList.toggle("lead",o.pw[s]);e.classList.remove("lchg");}}
    const lw=ln.querySelector(".locw");if(!lw)return;
    lw.querySelectorAll(".mx:not(.mx29o)").forEach(e=>{if(!e.dataset.h29){e.dataset.h29="1";e.style.display="none";}});
    if(!lw.querySelector(".mx29o"))for(const m of o.mx){const t=document.createElement("template");t.innerHTML=m;const e=t.content.firstElementChild;if(!e)continue;e.classList.add("mx29o");delete e.dataset.h29;e.style.display="";
      const pw=lw.querySelector(".pw."+(e.classList.contains("a")?"a":"p"));if(pw)pw.after(e);else lw.appendChild(e);}});}
function hold29LanesRel(){if(!H29.lon)return;H29.lon=0;const L=H29.L||[],g=GV||G;
  document.querySelectorAll("#board [data-lane]").forEach(ln=>{const li=+ln.dataset.lane,o=L[li];let ld="";try{ld=(g&&E.lead(g,li))||"";}catch(e){}
    ln.classList.toggle("lp",ld==="p");ln.classList.toggle("la",ld==="a");
    for(const s of ["a","p"]){const e=ln.querySelector(".pw."+s);if(!e)continue;e.classList.toggle("lead",ld===s);if(o&&ld===s&&o.ld!=="l"+s){e.classList.remove("lchg");void e.offsetWidth;e.classList.add("lchg");}}
    ln.querySelectorAll(".mx29o").forEach(e=>e.remove());ln.querySelectorAll(".mx[data-h29]").forEach(e=>{e.style.display="";delete e.dataset.h29;});});}
function hold29Subs(){if(!H29.ion)return;const me=$("meSub"),op=$("oppSub");
  if(me&&H29.me!=null&&me.innerHTML!==H29.me){H29.meN=me.innerHTML;me.innerHTML=H29.me;}
  if(op&&H29.op!=null&&op.textContent!==H29.op){H29.opN=op.textContent;op.textContent=H29.op;}}
function hold29InfoRel(){if(!H29.ion)return;H29.ion=0;const me=$("meSub"),op=$("oppSub");if(me&&H29.meN!=null)me.innerHTML=H29.meN;if(op&&H29.opN!=null)op.textContent=H29.opN;H29.meN=H29.opN=null;
  if(H29.m0!=null&&G&&G.msg===H29.m0){G.msg=H29.mN;try{if(!sel&&!look&&!moveSel&&!GV){const it=$("infoText");if(it)it.innerHTML=G.msg||"";}}catch(e){}}H29.m0=H29.mN=null;}
function hold29Info(ms){clearTimeout(H29.tm);if(!(ms>0)||reduced){hold29InfoRel();H29.tm=setTimeout(hold29Rel,5000*SPD);return;}H29.tm=setTimeout(()=>{hold29InfoRel();H29.tm=setTimeout(hold29Rel,3000*SPD);},ms*SPD+20);}
function hold29Rel(){clearTimeout(H29.tm);try{hold29LanesRel();}catch(e){console.error(e);}try{hold29InfoRel();}catch(e){console.error(e);}}
/* mốc đòn trúng cuối cùng của bước (mọi loại đòn, kể cả đổi chiến địa / lá trên cùng bộ bài / màn ra mắt kéo xuống) */
{const _p=plan8;plan8=function(evA,R0,R1,P0,P1){const T=_p(evA,R0,R1,P0,P1);let h=Math.max(PWL||0,PULLD29||0);
  try{for(const s of STEPS12){const t0=s.t0||0;let t;if(s.k==="loc")t=t0+T8.LIFT+620;else if(s.k==="lshield")t=t0+120;else if(s.k==="ult29")t=t0+s.T;else if(s.k==="top")t=t0+topHit29(s)+(s.a==="place"?TOPT.PLACE:0);else if(s.k==="move"||s.k==="swap")t=t0+mvDur9(s)*.85;else t=t0+(s.sp?(s.nl?0:T8.LIFT)+T8.FLY:0)+60;h=Math.max(h,t);}}catch(e){}
  HIT29=h;
  /* nhả theo đòn trúng THẬT (hit8) thay vì chỉ theo đồng hồ: máy chậm/khựng thì số & màu dẫn vẫn đổi đúng lúc trúng.
     Chỉ khi đòn trúng cuối cùng thuộc loại gọi hit8 (bước khác như dời/lá bộ bài/đổi chiến địa vẫn theo đồng hồ). */
  PEND35=new Set();HOLD35={p:0,i:0};
  try{let hp=0,op=0,hi=0,oi=PULLD29||0;for(const s of STEPS12){const t0=s.t0||0,isH=HK35.test(s.k)&&!/^(move|swap|top|ult29|loc|lshield)$/.test(s.k);
      const tp=s.k==="loc"||s.k==="lshield"?0:(s.k==="move"||s.k==="swap")?t0+mvDur9(s)*.85:s.k==="top"?t0+topHit29(s):t0+(s.sp?(s.nl?0:T8.LIFT)+T8.FLY:0)+60;
      const ti=s.k==="loc"?t0+T8.LIFT+620:s.k==="lshield"?t0+120:s.k==="ult29"?t0+s.T:s.k==="top"?t0+topHit29(s)+(s.a==="place"?TOPT.PLACE:0):tp;
      if(isH){PEND35.add(s);hp=Math.max(hp,tp);hi=Math.max(hi,ti);}else{op=Math.max(op,tp);oi=Math.max(oi,ti);}}
    if(PEND35.size){HOLD35.p=op<=hp?1:0;HOLD35.i=oi<=hi?1:0;}}catch(e){PEND35=new Set();}
  return T;};}
let PEND35=new Set(),HOLD35={p:0,i:0};const HK35=/^(kill|up|down|lplus|lminus|steal|sil|copy|summon|bounce|reset|cost)$/;
{const _h=hit8;hit8=function(s){const r=_h(s);try{if(PEND35.has(s)){PEND35.delete(s);if(!PEND35.size){if(HOLD35.p&&PWH>performance.now()){clearTimeout(PWHT);PWH=0;tickPw();}if(HOLD35.i&&H29.ion)hold29Info(0);}}}catch(e){console.error(e);}return r;};}
/* gpu35 (3): xếp lá trên cùng bộ bài. Cả hai bộ bài -> MỘT hàng, mỗi bên nửa màn phía cụm bộ bài của mình, lá nhỏ xếp chồng quạt;
   không che lá thẻ đang nhấc (đặt xuống dưới thẻ nhấc nếu còn chỗ, không thì thu nhỏ cho vừa khoảng trống phía trên) */
function heroRect35(src,sp){if(!HERO.uid||HERO.uid!==src||!HERO.r)return null;const w=HERO.r.w*HERO.s,h=HERO.r.h*HERO.s;return {l:sp.x-w/2,r:sp.x+w/2,t:sp.y-h/2,b:sp.y+h/2};}
function topLay29(es,hr){const VW=innerWidth,VH=innerHeight,by={p:[],a:[]};for(const e of es)(by[e.side]||(by[e.side]=[])).push(e);
  for(const k in by)by[k].sort((x,y)=>(x.n!=null?x.n:0)-(y.n!=null?y.n:0));
  const two=by.p.length>0&&by.a.length>0,m=Math.max(by.p.length,by.a.length),CAP=24;
  const dzOf=s=>DECKZ(s)||{x:s==="p"?VW*.25:VW*.75,y:30,w:44,h:62};
  let W=two?Math.min(92,VW*.2):Math.max(64,Math.min(118,VW*.27,(VW-12)/(1+.86*Math.max(0,m-1))));
  const top0=Math.max(...[...(by.p.length?["p"]:[]),...(by.a.length?["a"]:[])].map(s=>{const d=dzOf(s);return d.y+(d.h||40)/2;}))+10;
  const place=(W,y)=>{const H=Math.round(W*1.36);for(const s of ["p","a"]){const L=by[s];if(!L.length)continue;const dz=dzOf(s),gap=two?W*.56:W*.86,GW=W+(L.length-1)*gap;
      let lo=6,hi=VW-6;if(two){if(dz.x<VW/2)hi=VW/2-3;else lo=VW/2+3;}const cx=Math.min(hi-GW/2,Math.max(lo+GW/2,dz.x)),mid=Math.floor((L.length-1)/2);
      L.forEach((e,i)=>{const x=Math.round(cx-GW/2+W/2+i*gap);e.sp={x,y:Math.round(y+(two&&L.length>2&&i===mid?-5:0)),w:Math.round(W),h:H,dz};e.cap=i===L.length-1;e.cdx=Math.round(cx-x);});}return H;};
  let H=Math.round(W*1.36),y=top0+H/2;
  if(hr){const hit=(y,H)=>y+H/2+CAP>hr.t&&y-H/2<hr.b;
    if(hit(y,H)){const yb=hr.b+8+H/2;if(yb+H/2+CAP<=VH-96)y=yb;else{const av=hr.t-top0-CAP;if(av>=56){H=Math.min(H,av);W=Math.max(40,H/1.36);H=Math.round(W*1.36);y=top0+H/2;}}}}
  place(W,y);}
