/* ===== Module 19 (gpu71, làn D): TIÊU HUỶ rõ ràng + TRIỆU HỒI đáp ô trước khi kỹ năng của lá được triệu hồi chạy =====
   (d) TIÊU HUỶ — MO.destroy(r) thay CFX.destroy cho MỌI đường huỷ (đòn plan8 "kill", huỷ chung 05, lá đưa vào rồi bị huỷ ngay (CFX.gone),
       lá trên cùng bộ bài bị huỷ, HX-03): đúng lá đó tại đúng ô (uid lấy từ data-mc của ảnh chụp ô):
         1. NỨT: bản sao lá nhấc nhẹ, rung, vết nứt sáng theo màu hệ của chính lá lan dần trên mặt thẻ, vòng đỏ dưới ô;
         2. VỠ THEO HỆ của lá bị huỷ (Lửa cháy rụi, Băng vỡ vụn tinh thể, Đất sụp từng khối, Gió thổi tung, Độc/Nước tan chảy,
            Tối/Hồn tan thành khói, Sáng tan thành ánh sáng, Sấm/Huyết/Cơ khí/Mộc vỡ mảnh + hạt riêng); HỒN (ảnh nhân vật) rời khung bay lên rồi tắt;
         3. Ô trống: vòng tắt dần tại ô (lá biến mất hẳn), không sót phần tử.
       Tiếng riêng theo LÁ BỊ HUỶ (SFX.mo: tiếng riêng thẻ c_<id> > d_<hệ>), phát đúng nhịp vỡ.
   (d) VỨT BỎ — phần phóng lớn ở giữa màn nằm trong 18-act.js (discardBeat2); tiếng riêng theo lá bị vứt (v_<hệ> / c_<id>).
   (e) TRIỆU HỒI — MO.gate (gọi trong plan8 qua P6.shift, sau PA6/HX/ấn ký): lá được đưa xuống sân trong bước (summon / revive /
       kéo từ bộ bài "top place" / bầy / lá tạo ra / chiến địa tạo) phải ĐÁP Ô và đứng yên ~0,42 s rồi kỹ năng của CHÍNH lá đó mới chạy;
       các đòn của lá đó (src = uid lá) và màn ra mắt S4/S5 (ult29) bị dời, mọi bước sau dời theo (giữ thứ tự, không chồng).
       Đòn đổi sức mạnh mà plan8 gán cho thẻ nguồn của bước nhưng thật ra do lá vừa triệu hồi gây ra (lịch sử hist.u) được gán lại cho lá đó
       (bay ra từ đúng lá, sau khi lá đáp).
   Không có chạm-để-tua: MO.skip() kết thúc ngay mọi màn huỷ (trạng thái cuối, không sót DOM) — cho nút "Bỏ qua" (> 60 s) gọi.
   Móc kiểm thử: window.MO_TAP(k, o): "d" (bắt đầu huỷ), "d:crack", "d:break", "d:end"; "gate" (dời lịch). */
(function () {
  "use strict";
  const W = window;
  if (!W.P6 || !P6.kit || !W.HXG || !HXG.kit) return;
  const MO = {};
  W.MO = MO;
  const tap = (k, o) => { try { if (W.MO_TAP) W.MO_TAP(k, o || {}); } catch (e) {} };
  const K = P6.kit, E6 = K.E6, rnd = K.rnd, cols = P6.cols;
  const { glow, ring, streaks } = P6.fx;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ff = () => !!(W.FFTURN && FFTURN.on);
  const isLite = () => { try { return P6.tier() === "lite"; } catch (e) { return false; } };
  const kN = (n) => { try { return K.kN(n); } catch (e) { return n; } };

  /* ---------- kiểu dáng ---------- */
  const css = document.createElement("style");
  css.textContent = `
.mo-g{position:fixed;z-index:41;pointer-events:none}
.mo-g>.mo-ck{position:absolute;inset:0;width:100%;height:100%;z-index:30;pointer-events:none;overflow:visible}
.mo-g>.mo-ck path{fill:none;stroke:#fff;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:80;stroke-dashoffset:80;
  filter:drop-shadow(0 0 2px var(--c)) drop-shadow(0 0 5px var(--c));animation:moCk var(--d,300ms) cubic-bezier(.3,.7,.4,1) forwards}
.mo-g>.mo-tint{position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 50% 50%,transparent 30%,var(--c) 140%);mix-blend-mode:screen;opacity:0;animation:moTint var(--d,300ms) ease-in forwards;z-index:29}
@keyframes moCk{to{stroke-dashoffset:0}}
@keyframes moTint{to{opacity:.85}}
.mo-dim{position:fixed;inset:0;z-index:14;pointer-events:none;background:radial-gradient(ellipse at 50% 46%,rgba(8,4,20,.55),rgba(4,2,12,.78));opacity:0}
.fxg.acd{container-type:inline-size}
.fxg.acd .fxface>.n{font-size:clamp(9px,8.6cqw,19px)!important;line-height:1.12!important}
body.rm .mo-g,body.rm .mo-dim{display:none!important}`;
  document.head.appendChild(css);

  /* ---------- hệ của lá bị huỷ -> cách vỡ ---------- */
  const EL = {
    lua: { c: "#ff7a2a", c2: "#ffd27a", k: "burn", p: ["#ff6a1f", "#ffd27a", "#ff3a00"] },
    bang: { c: "#9fe6ff", c2: "#ffffff", k: "shard", o: { cols: 7, rows: 9, spd: 230, g: 220, life: 0.9, edge: "#e8fbff", vr: 7, shrink: 1, blend: "lighter" }, p: ["#d8f6ff", "#9fe6ff", "#ffffff"] },
    sam: { c: "#ffe94d", c2: "#7fe0ff", k: "shard", o: { cols: 5, rows: 6, spd: 260, g: 260, life: 0.75, edge: "#fff6a8", vr: 9, shrink: 1, blend: "lighter" }, p: ["#fff6a8", "#7fe0ff", "#ffffff"], zap: 1 },
    doc: { c: "#7dff5a", c2: "#c8ff9a", k: "melt", p: ["#7dff5a", "#3fbf2a", "#c8ff9a"], up: 1 },
    toi: { c: "#a05cff", c2: "#3a1a66", k: "smoke", p: ["#2a1446", "#6a3ab0", "#140a24"], up: 1 },
    sang: { c: "#ffe9a0", c2: "#ffffff", k: "light", p: ["#fff6c8", "#ffe08a", "#ffffff"], up: 1 },
    gio: { c: "#a8ffe0", c2: "#ffffff", k: "shard", o: { cols: 6, rows: 7, spd: 120, sx: 3.2, sy: 0.35, vy: -90, g: 0, drag: 0.4, life: 0.95, vr: 10, shrink: 1 }, p: ["#d8fff0", "#a8ffe0", "#ffffff"], wind: 1 },
    dat: { c: "#c9a46a", c2: "#7a5a32", k: "shard", o: { cols: 3, rows: 4, spd: 70, g: 1300, vy: -120, life: 0.95, vr: 3, sx: 1.2, sy: 0.4 }, p: ["#8a6a40", "#c9a46a", "#5a4026"], dust: 1 },
    nuoc: { c: "#5ab8ff", c2: "#bff0ff", k: "melt", p: ["#5ab8ff", "#bff0ff", "#2a7ad0"], down: 1 },
    mau: { c: "#ff3a5a", c2: "#8a0a20", k: "shard", o: { cols: 5, rows: 6, spd: 210, g: 600, life: 0.8, edge: "#ff8a9a", vr: 6, shrink: 1 }, p: ["#ff3a5a", "#8a0a20", "#ff8a9a"], down: 1 },
    cokhi: { c: "#ffb347", c2: "#c0c8d8", k: "shard", o: { cols: 4, rows: 5, spd: 220, g: 800, life: 0.85, edge: "#ffd9a0", vr: 8 }, p: ["#ffb347", "#ffe0a0", "#c0c8d8"] },
    hon: { c: "#7fe8ff", c2: "#d8f6ff", k: "smoke", p: ["#bff4ff", "#7fe8ff", "#5a8aff"], up: 1 },
    moc: { c: "#8fdc4a", c2: "#d8ff9a", k: "shard", o: { cols: 5, rows: 6, spd: 190, g: 480, life: 0.85, edge: "#e8ffb0", vr: 7, shrink: 1 }, p: ["#5aa82a", "#8fdc4a", "#c8a060"] }
  };
  const elId = (id) => { try { return (typeof elOf === "function" && elOf(id)) || null; } catch (e) { return null; } };
  MO.EL = EL;

  /* ---------- việc đang diễn (để MO.skip / dọn sạch) ---------- */
  const JOBS = new Set();
  function job(ms) {
    const j = { els: [], tms: [], fins: [], dead: 0, t0: performance.now() };
    j.add = (el) => { j.els.push(el); return el; };
    j.at = (t, f) => { const tm = fxT(() => { if (!j.dead) { try { f(); } catch (e) { console.error(e); } } }, t); j.tms.push(tm); return tm; };
    j.fin = (fast) => {
      if (j.dead) return;
      j.dead = 1; JOBS.delete(j);
      for (const t of j.tms) clearTimeout(t);
      clearTimeout(j.wd);
      for (const f of j.fins) { try { f(!!fast); } catch (e) { console.error(e); } }
      for (const e of j.els) e.remove();
    };
    j.wd = setTimeout(() => j.fin(true), (ms + 1500) * SPD);
    JOBS.add(j);
    return j;
  }
  MO.busy = () => JOBS.size;
  MO.skip = () => { for (const j of [...JOBS]) j.fin(true); document.querySelectorAll(".mo-g,.mo-dim").forEach((e) => e.remove()); try { if (W.ACT44 && ACT44.DS) for (const j of [...ACT44.DS.jobs]) j.fin(true); } catch (e) {} };

  /* bản đồ uid -> id (lá đã rời bàn vẫn tìm được trong Mộ / bộ bài; lá token bị huỷ: lấy từ sự kiện của bước) */
  const UID = new Map();
  function idOfUid(uid) {
    if (!uid) return null;
    try { const c = anyC(uid); if (c) return c.id; } catch (e) {}
    if (UID.has(uid)) return UID.get(uid);
    try { if (G && G.evs) { const e = G.evs.find((x) => x.uid === uid && x.id); if (e) return e.id; } } catch (e) {}
    try { if (G) for (const s of E.SIDES) for (const k of ["dead", "disc", "hand", "deck", "exiled"]) { const c = (G[k] && G[k][s] || []).find((x) => x.uid === uid); if (c) return c.id; } } catch (e) {}
    return null;
  }
  /* vết nứt ngẫu nhiên từ một điểm va chạm (toạ độ 0..40 × 0..56) */
  function cracks() {
    const cx = rnd(14, 26), cy = rnd(18, 30), P = [];
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + rnd(-0.35, 0.35);
      let x = cx, y = cy, d = `M${cx.toFixed(1)} ${cy.toFixed(1)}`;
      const L = rnd(16, 30), seg = 3;
      for (let k = 1; k <= seg; k++) { const t = (L * k) / seg, aa = a + rnd(-0.45, 0.45); x = cx + Math.cos(aa) * t; y = cy + Math.sin(aa) * t * 1.3; d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; }
      P.push(d);
      if (i % 2 === 0) { const a2 = a + rnd(0.5, 0.9), t2 = rnd(5, 9); P.push(`M${x.toFixed(1)} ${y.toFixed(1)} L${(x + Math.cos(a2) * t2).toFixed(1)} ${(y + Math.sin(a2) * t2).toFixed(1)}`); }
    }
    return `<svg class="mo-ck" viewBox="0 0 40 56" preserveAspectRatio="none" aria-hidden="true">${P.map((d) => `<path d="${d}"/>`).join("")}</svg>`;
  }
  /* bitmap nửa độ phân giải (tan rã/cháy tính theo điểm ảnh: nhẹ hơn 4×) */
  function half(b) {
    if (!b || b.width < 80) return b;
    const c = document.createElement("canvas");
    c.width = Math.round(b.width / 2); c.height = Math.round(b.height / 2);
    c.getContext("2d").drawImage(b, 0, 0, c.width, c.height);
    return c;
  }
  const T = { CRACK: 330, BREAK: 620, END: 980 };
  MO.T = T;
  const SNDQ = []; /* trần tiếng huỷ: tối đa 3 tiếng / 220 ms (huỷ hàng loạt không ồn) */
  function snd(kind, id, el) {
    const now = performance.now();
    while (SNDQ.length && now - SNDQ[0] > 220) SNDQ.shift();
    if (SNDQ.length >= 3) return;
    SNDQ.push(now);
    try { if (typeof SFX !== "undefined" && SFX.mo) SFX.mo(kind, id, el, { vol: SNDQ.length > 1 ? 0.75 : 1 }); } catch (e) {}
  }
  MO.snd = snd;

  /* ================= TIÊU HUỶ ================= */
  MO.destroy = function (r, o) {
    o = o || {};
    if (!r || !r.html) return false;
    const m = /data-mc="(\d+)"/.exec(r.html), uid = r.uid || (m ? +m[1] : 0);
    let id = r.id || idOfUid(uid);
    if (!id) { const ms = /data-sp="([a-z0-9_]+)/.exec(r.html); if (ms && C[ms[1]]) id = ms[1]; }
    const el = (id && elId(id)) || "toi", S = EL[el] || EL.toi;
    tap("d", { uid, id, el });
    if (typeof reduced !== "undefined" && reduced) { snd("d", id, el); tap("d:end", { uid, fast: 1 }); return true; }
    if (ff()) { snd("d", id, el); tap("d:end", { uid, fast: 1 }); return false; } /* tua lượt (> 60 s): màn huỷ cũ, nhanh */
    const w = r.w || 52, h = r.h || 72, x = r.x, y = r.y, lite = isLite() || ff();
    const j = job(T.END + 200);
    try { holdFx(T.END + 120); } catch (e) {}
    /* 1. NỨT */
    const g = j.add(ghost(r, r.html, "mo-g"));
    g.style.setProperty("--c", S.c);
    g.style.setProperty("--d", Math.round(T.CRACK * SPD) + "ms");
    g.insertAdjacentHTML("beforeend", `<i class="mo-tint"></i>` + cracks());
    try { g.animate([{ transform: "none", filter: "none" }, { transform: "translate(-2px,-3px) rotate(-2deg) scale(1.05)", filter: "brightness(1.25)", offset: 0.25 }, { transform: "translate(3px,-4px) rotate(2deg) scale(1.07)", offset: 0.5 }, { transform: "translate(-2px,-5px) rotate(-1deg) scale(1.08)", offset: 0.75 }, { transform: "translate(0,-6px) scale(1.1)", filter: "brightness(1.5) saturate(1.3)" }], { duration: T.CRACK * SPD, easing: "linear", fill: "forwards" }); } catch (e) {}
    ring(x, y, "#ff4d5e", w * 1.25, 0.4, 0.9);
    glow(x, y, S.c, w * 1.6, T.CRACK / 1000, 0.45);
    tap("d:crack", { uid });
    /* 2. VỠ theo hệ + hồn rời khung */
    j.at(T.CRACK, () => {
      const HK = HXG.kit, card = g.firstElementChild, art = g.querySelector("img.art");
      const b = g.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2, bw = b.width || w, bh = b.height || h;
      snd("d", id, el);
      tap("d:break", { uid, el, kind: S.k });
      let so = null;
      if (!lite && art && art.complete && art.naturalWidth && HK.soulFrom) {
        so = HK.soulFrom(art, S.c);
        if (so) {
          j.add(so.d);
          so.d.style.zIndex = "42";
          so.d.animate([{ transform: "none", opacity: 0.95, filter: "brightness(1.3)" }, { transform: `translate(${rnd(-6, 6).toFixed(1)}px,-${(bh * 0.35).toFixed(1)}px) scale(1.08)`, opacity: 0.85, offset: 0.45, filter: "brightness(1.8) saturate(.6)" }, { transform: `translate(${rnd(-10, 10).toFixed(1)}px,-${(bh * 0.8).toFixed(1)}px) scale(.9)`, opacity: 0, filter: "brightness(2.4) blur(3px) saturate(0)" }], { duration: (T.END - T.CRACK) * SPD, easing: "cubic-bezier(.3,.6,.5,1)", fill: "forwards" });
        }
      }
      let bmp = null;
      try { bmp = (HK.cardBmp && HK.cardBmp(card, { noArt: !!so, dark: !!so })) || (HK.frameBmp && HK.frameBmp(id || "", bw, bh, !!so)); } catch (e) { bmp = null; }
      g.style.visibility = "hidden";
      const L = S.p;
      if (bmp && !lite) {
        if (S.k === "burn" || S.k === "melt" || S.k === "smoke" || S.k === "light") {
          const hb = half(bmp);
          HK.dissolve(hb, bx, by, bw, bh, { life: 0.62, upd: (p, dt, u) => {
            if (u < 0.04 || u > 0.94 || Math.random() > 0.75) return;
            const yy = S.down ? by - bh / 2 + u * bh : by + bh / 2 - u * bh * 1.05;
            E6({ x: bx + rnd(-bw / 2, bw / 2), y: yy, vx: rnd(-25, 25), vy: S.down ? rnd(40, 120) : rnd(-140, -50), c: L[(Math.random() * L.length) | 0], kind: 0, s0: rnd(5, S.k === "smoke" ? 16 : 10), s1: S.k === "smoke" ? 18 : 1, drag: 0.5, dur: rnd(0.35, 0.65), a: S.k === "smoke" ? 0.55 : 0.9 });
          } });
        } else {
          const sh = W.HXG && HXG.kit.shatter;
          if (sh) sh(bmp, bx, by, bw, bh, S.o || {});
        }
      } else {
        try { CFX.shatter({ x: bx, y: by, w: bw, h: bh, html: r.html }, S.c, false); } catch (e) {}
      }
      /* hạt riêng theo hệ */
      const n = kN(lite ? 8 : 22);
      for (let i = 0; i < n; i++) {
        const a = rnd(0, 6.283), sp = rnd(60, 220);
        E6({ x: bx + rnd(-bw * 0.3, bw * 0.3), y: by + rnd(-bh * 0.3, bh * 0.3), vx: Math.cos(a) * sp * (S.wind ? 2.2 : 1), vy: Math.sin(a) * sp * (S.wind ? 0.4 : 1) - (S.up ? 80 : 0), gy: S.dust || S.down ? 260 : 0, c: L[i % L.length], kind: 0, s0: rnd(4, 9), s1: 1, drag: 0.6, dur: rnd(0.4, 0.75), a: 0.95 });
      }
      glow(bx, by, "#ffffff", bw * 1.1, 0.14, 0.85);
      glow(bx, by, S.c, bw * 2.1, 0.5, 0.65);
      ring(bx, by, S.c2, bw * 1.4, 0.45, 0.9);
      streaks(bx, by, [S.c, S.c2, "#ffffff"], lite ? 8 : 18, 260, 0, 6.283, 0.55, 5);
      if (S.zap) { try { FX.sparks(bx, by, "#fff6a8", 18, 300); } catch (e) {} }
      if (S.dust) { try { FX.dust(bx, by + bh * 0.45, "#c9a46a"); FX.dust(bx, by + bh * 0.4, "#8a6a40"); } catch (e) {} }
      try { K.shake(lite ? 2 : 4, 0, 1); } catch (e) {}
    });
    /* 3. ô trống: vòng tắt dần, lá biến mất hẳn */
    j.at(T.BREAK, () => { ring(x, y, "#ffffff", w * 0.9, 0.35, 0.4); glow(x, y, S.c, w * 0.9, 0.3, 0.3); });
    j.at(T.END, () => { tap("d:end", { uid }); j.fin(false); });
    return true;
  };
  MO.destroyUid = function (uid, o) { const el = document.querySelector(`#board [data-mc="${uid}"]`); if (!el) return false; const b = el.getBoundingClientRect(); return MO.destroy({ x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height, html: cleanCloneHTML(el), uid }, o); };

  /* thay mọi CFX.destroy (05/08) — HX-03 (16-hx.js) nhường cho MO khi MO có mặt */
  const CD0 = CFX.destroy;
  CFX.destroy = function (r) {
    try { if (MO.destroy(r)) return; } catch (e) { console.error(e); }
    return CD0.apply(this, arguments);
  };
  /* lá đưa vào rồi bị huỷ ngay trong cùng bước: hiện lá ở đúng ô (thành hình), rồi huỷ rõ ràng */
  CFX.gone = function (ev, R0) {
    if (typeof reduced !== "undefined" && reduced) return;
    const r = W.slotRect9 ? slotRect9(ev.li, ev.side, ev.ix) : null;
    if (!r) return;
    const html = typeof lite === "function" ? lite(ev.uid) : null;
    if (!html) return;
    const g = ghost(r, html);
    try { g.animate([{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1.06)", offset: 0.6 }, { opacity: 1, transform: "none" }], { duration: 320 * SPD }); } catch (e) {}
    try { FX.glow(r.x, r.y, "#c8ff9a", 56, 0.35); } catch (e) {}
    fxT(() => { g.remove(); MO.destroy({ x: r.x, y: r.y, w: r.w, h: r.h, html, uid: ev.uid }); try { FX.float(r.x, r.y - r.h * 0.5, "BỊ TIÊU HUỶ", "#ff9aa8"); } catch (e) {} }, 520);
    fxT(() => g.remove(), 1400);
    holdFx(520 + T.END + 100);
  };

  /* ================= TRIỆU HỒI: đáp ô trước, kỹ năng của lá sau ================= */
  const SETTLE = 420;
  MO.SETTLE = SETTLE;
  let EVA = null;
  {
    const p0 = plan8;
    plan8 = function (evA) { EVA = evA; try { if (UID.size > 400) UID.clear(); for (const e of evA) if (e.uid > 0 && e.id && (e.k === "destroy" || e.k === "discard")) UID.set(e.uid, e.id); } catch (e) {} try { return p0.apply(this, arguments); } finally { EVA = null; } };
  }
  const flyT = (s) => { try { return q8(s, () => (s.sp ? (s.nl ? 0 : T8.LIFT) + T8.FLY : 0)); } catch (e) { return 385; } };
  const rectOf = (uid) => { const e = document.querySelector(`#board [data-mc="${uid}"]`); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height } : null; };
  /* nguồn thật của một lần đổi sức mạnh trong lượt này (hist cuối cùng) */
  function powSrc(uid) {
    try { const c = anyC(uid); if (!c || !c.hist) return 0; for (let i = c.hist.length - 1; i >= 0; i--) { const h = c.hist[i]; if (h.k !== "p" && h.k !== "bp") continue; return h.t === G.turn ? h.u || 0 : 0; } } catch (e) {}
    return 0;
  }
  MO.gate = function (steps, evA) {
    evA = evA || EVA;
    if (!evA || !steps || !steps.length || (typeof reduced !== "undefined" && reduced)) return 0;
    const DS = W.ACT44 && ACT44.DS;
    const owned = (u) => !!(DS && DS.owns && DS.owns(u));
    /* lá được đưa xuống sân trong bước: uid -> mốc đáp (ms gốc từ đầu nhịp kỹ năng) */
    const arr = new Map();
    for (const e of evA) {
      if (!(e.uid > 0)) continue;
      /* lá do phần diễn vứt bỏ / từ Mộ (18-act) đưa xuống: mốc đáp do phần diễn đó báo */
      if (owned(e.uid)) { if ((e.k === "summon" || e.k === "revive") && !arr.has(e.uid)) { const t = DS.landIn ? DS.landIn(e.uid) : 0; if (t > 0) arr.set(e.uid, { t, step: null, ds: 1 }); } continue; }
      if (e.k === "summon" || e.k === "clone") { if (!arr.has(e.uid)) arr.set(e.uid, { t: 480, step: null }); }
      else if (e.k === "revive") { if (!arr.has(e.uid)) arr.set(e.uid, { t: 620, step: null }); }
    }
    for (const s of steps) {
      if (s.k === "summon" && arr.has(s.dst) && !arr.get(s.dst).ds) arr.get(s.dst).step = s;
      else if (s.k === "top" && s.a === "place" && s.es) for (const e of s.es) { if (!owned(e.uid)) arr.set(e.uid, { t: 0, step: s, top: 1 }); }
    }
    if (!arr.size) return 0;
    /* gán lại nguồn: đòn đổi sức mạnh do lá vừa xuống sân gây ra */
    for (const s of steps) {
      if ((s.k !== "up" && s.k !== "down") || s.ong) continue;
      const u = powSrc(s.dst);
      if (!u || !arr.has(u) || u === s.src) continue;
      if (u === s.dst) { s.src = 0; s.sp = null; s.self29 = 1; s.grp = null; s._moSelf = u; continue; }
      /* lá vừa xuống sân còn ẩn tới lúc đáp: vị trí nguồn đọc lại lúc đòn chạy (run8) */
      s.src = u; s.sp = rectOf(u) || s.sp || s.tp; s.grp = null; s._moSp = u; if (s.self29) s.self29 = 0;
    }
    const dep = (s) => { if (s.k === "summon" || (s.k === "top" && s.a === "place")) return 0; if (s.k === "ult29") return arr.has(s.dst) ? s.dst : 0; if (s._moSelf) return s._moSelf; return s.src > 0 && arr.has(s.src) ? s.src : 0; };
    const L = steps.filter((s) => s.k !== "loc").slice().sort((a, b) => (a.t0 || 0) - (b.t0 || 0));
    let D = 0, n = 0;
    const land = new Map();
    for (const [u, a] of arr) if (!a.step) land.set(u, a.t);
    for (const s of L) {
      s.t0 = (s.t0 || 0) + D;
      if (s.k === "summon" && arr.has(s.dst)) land.set(s.dst, s.t0 + flyT(s));
      else if (s.k === "top" && s.a === "place") { let t = s.t0 + 900; try { t = s.t0 + topHit29(s) + TOPT.PLACE; } catch (e) {} for (const e of s.es || []) if (arr.has(e.uid)) land.set(e.uid, t); }
      const u = dep(s);
      if (!u || !land.has(u)) continue;
      s._moDep = u;
      const need = land.get(u) + (s.k === "ult29" ? 160 : SETTLE);
      if (s.t0 < need) { const d = need - s.t0; D += d; s.t0 += d; n++; }
    }
    for (const s of steps) if (s.k === "loc") s.t0 = (s.t0 || 0) + D;
    if (n) tap("gate", { n, D: Math.round(D), uids: [...arr.keys()] });
    if (W.MO_TAP) for (const [u, t] of land) fxT(() => tap("land", { uid: u }), t);
    return D;
  };
  {
    const sh0 = P6.shift;
    P6.shift = function (steps) {
      let x = 0;
      try { x = sh0.apply(this, arguments) || 0; } catch (e) { console.error(e); }
      try { x += MO.gate(steps) || 0; } catch (e) { console.error(e); }
      return x;
    };
  }
  {
    const r0 = run8;
    run8 = function (s) {
      if (s && s._moSp) { const q = rectOf(s._moSp); if (q) s.sp = q; }
      if (s && s._moDep) tap("run", { step: s.k, uid: s._moDep, dst: s.dst });
      return r0.apply(this, arguments);
    };
  }
  /* ván mới / thoát trận: dọn sạch */
  MO.clean = () => { MO.skip(); };
})();
