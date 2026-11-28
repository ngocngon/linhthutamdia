/* ===== Module 18 (gpu69, làn A): HOẠT CẢNH HÀNH ĐỘNG =====
   Theo QUY LUẬT DIỄN ở đầu 15-pa6.js ([A] ra mắt -> [B] kỹ năng -> thẻ kế tiếp) và ngôn ngữ đổi chỉ số P6.stat.
   Màn diễn đăng ký vào bảng phụ SIGK.x (17-sig.js) nên dùng chung lịch dời/giữ kết quả tới mốc trúng của ấn ký:
   - Bộ bài (mục 2): kỹ năng lấy/cho sức mạnh, đổi năng lượng lá trên cùng (Quyền Sư Máu, Sát Thủ Bạc, Nàng Tấm, Thuỷ Thân, Ngải Sư…)
     chỉ hiện MẶT LƯNG chồng bộ bài (của mình hoặc đối thủ), không lộ mặt thẻ; Tâm Ma hút từ cả chồng bài.
   - Cự Long Cổ (7): vuốt rồng cào thẻ địch hàng trước, dòng sức mạnh chảy về. Tiểu Long (35): cầu lửa trừ sức mạnh thẻ địch.
   - Chiến Thần (41): bảng so 3 SỐ sức mạnh trên cùng hai bộ bài (không mặt thẻ), đếm tổng, đạt thì +6 bay về thẻ.
   - Cuối Lượt (12): ấn trăng dưới thẻ + nhãn loại hiệu ứng, mỗi loại (tăng/giảm sức mạnh, năng lượng, đổi kỹ năng, biến hình…) một kiểu riêng.
   - Mượn kỹ năng (17): Vua Thời Gian, Tướng Loạn Trí, chép kỹ năng… diễn TỪNG kỹ năng mượn: mặt thẻ gốc hiện cạnh thẻ nguồn, đạo cụ riêng của thẻ gốc bay tới mục tiêu.
   - Phản ứng khi bị tiêu huỷ / vứt bỏ (20): hồn thẻ ở lại chỗ cũ (hoặc nổi từ Mộ), đạo cụ riêng bay tới từng thẻ được tăng/giảm (trên bàn và trên tay).
   - Đặt thẻ từ tay lên bàn (15): lá rời đúng chỗ trên tay, bay vòng cung, đáp ô; bản sao: lá trên tay nhân đôi, bản sao bay đi, lá gốc ở lại.
   - Vứt bỏ (4): lá nhấc khỏi tay -> bay ra GIỮA MÀN PHÓNG LỚN (gpu71: hàng/quạt gọn, nền tối nhẹ, đọc được) -> từng lá cháy, hồn bay vào Mộ
     -> phản ứng: lá từ Mộ bay về tay / tới chiến địa / bản sao vào tay. Tiếng riêng theo lá bị vứt (19-mo.js MO.snd).
   Nút "Bỏ qua" (gpu71, thay chạm màn hình): tua nhanh (kết quả hiện ngay, lớp phủ dọn sạch). Giảm chuyển động / tua lượt máy: đường cũ. */
(function () {
  "use strict";
  const W = window;
  if (!W.SIGK || !SIGK.kit || !W.P6 || !P6.kit) return;
  const SG = SIGK, K = SG.kit, AC = {};
  W.ACT44 = AC;
  const { glow, ring, star, streaks, converge, beam } = P6.fx;
  const E6 = P6.kit.E6, rnd = P6.kit.rnd, cols = P6.cols;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const tap = (k, o) => { try { if (W.ACT_TAP) W.ACT_TAP(k, o || {}); } catch (e) {} };
  const htap = (k, o) => { try { if (W.HX_TAP) W.HX_TAP(k, o || {}); } catch (e) {} };
  const lite = () => P6.tier() === "lite";
  const ff = () => !!(W.FFTURN && FFTURN.on);
  const on = () => { try { return !reduced && !!G && !ff(); } catch (e) { return false; } };
  const { el0, tl, arc, trail, rc, mcOf, hcOf, fl, sfx, live, job } = K;
  const nmOf = (id) => (id && C[id] ? C[id].n : "");
  const short = (t, n) => (t && t.length > n ? t.slice(0, n - 1) + "…" : t || "");
  const VI = (k) => { try { return (typeof vimg === "function" && vimg(k)) || null; } catch (e) { return null; } };
  /* ảnh đạo cụ đã vẽ (img/v): tải sẵn những ảnh màn diễn dùng */
  const PRE = ["culongco", "vet_cao", "tieulong", "no_lua", "no_toi", "no_bang", "sao_tang", "an_ngoc", "ngoc", "an_trien", "bua_chu", "cong", "vet_chem", "maynuotthoigian", "an_vong", "manh_vo", "lua", "so", "cotnu", "ten", "nuthantien"];
  const KEEP = [];
  setTimeout(() => { for (const k of PRE) { const u = VI(k); if (!u) continue; const im = new Image(); im.decoding = "async"; im.src = u; KEEP.push(im); } }, 2500);
  /* đạo cụ ảnh (k = khoá img/v) hoặc huy hiệu ảnh thẻ */
  function pic(j, k, x, y, w, h, c, cls) {
    const u = VI(k);
    if (!u) return null;
    return j.add(el0("sgp acp" + (cls ? " " + cls : ""), x, y, w, h || w, c || "#ffd65a", `<img src="${u}" alt="" draggable="false">`));
  }
  /* mặt thẻ đầy đủ (lá thật) theo id — dùng cho thẻ được mượn kỹ năng, lá rời tay/Mộ */
  function face(j, id, x, y, w, c, cls) {
    const h = w * 1.36, d = el0("acf" + (cls ? " " + cls : ""), x, y, w, h, c || "#ffd65a", liteId(id));
    try { if (typeof spWatch === "function") spWatch(d); } catch (e) {}
    return j ? j.add(d) : d;
  }
  /* nhãn gọn: bề ngang theo chữ, luôn nằm trong màn hình (tl kẹp theo _hw) */
  function tagEl(j, cls, x, y, w0, h, c, html) {
    const d = j.add(el0(cls, x, y, w0, h, c, html)), b = d.firstElementChild, w = Math.min(innerWidth - 8, Math.max(40, b ? b.offsetWidth + 4 : w0));
    d.style.width = w.toFixed(1) + "px"; d.style.left = (x - w / 2).toFixed(1) + "px"; d._hw = w / 2 + 2;
    return d;
  }
  const projOf = (id) => { const s = typeof SIGV !== "undefined" && SIGV[id]; return (s && VI(s.img)) ? s.img : VI(id) ? id : null; };
  const REV0 = Object.assign({}, E.REV);
  const realRev = (id) => !!id && E.REV[id] === REV0[id];
  const jnow = (j) => (performance.now() - j.t0) / SPD;
  const posOf = (uid) => { const q = rc(mcOf(uid)) || rc(hcOf(uid)); return q; };
  const deckPt = (side) => { try { return DECKZ(side); } catch (e) { return null; } };

  /* ---------- ngữ cảnh của bước đang diễn (plan8 chạy đầu phần kỹ năng) ---------- */
  let CUR = null;
  {
    const p0 = plan8;
    plan8 = function (evA, R0, R1, P0, P1) {
      CUR = { evs: evA, R0, R1, P0, P1, t: performance.now() };
      try { DS.plan(CUR); } catch (e) { console.error(e); }
      try { handCover(evA); } catch (e) { console.error(e); }
      const r = p0.apply(this, arguments);
      /* lá do phần diễn vứt bỏ đưa lên bàn: không lật/ra mắt trước khi bay tới; không giữ nhịp tay bài chờ chúng */
      try {
        const P = DS.P;
        if (P && P.own.size) {
          for (const u of P.own) TP29.add(u);
          let D = 0;
          for (const s of STEPS12) { if (P.own.has(s.dst) || (s.inst && P.own.has(s.inst.uid))) continue; if (s.k === "ult29") D = Math.max(D, (s.t0 || 0) + s.T); else if (s.k === "top" && s.a === "place") D = Math.max(D, (s.t0 || 0) + topHit29(s) + TOPT.PLACE); }
          PULLD29 = D;
          P.tbx = performance.now() + (D > 0 ? D * SPD : 0);
        }
      } catch (e) { console.error(e); }
      return r;
    };
  }
  AC.cur = () => CUR;
  /* kỹ năng chạy khi thẻ đang nằm TRÊN TAY (Cuối Lượt từ tay, phản ứng khi về tay, kỹ năng tay bài…): khung sáng theo hệ phủ trọn lá,
     ảnh nhân vật nảy nhẹ, nhãn nhỏ tên kỹ năng trên lá — trước khi kết quả bay đi */
  function handCover(evs) {
    if (!on()) return;
    const seen = new Set();
    for (const e of evs) {
      if (!(e.k === "skill" || e.k === "act") || !(e.uid > 0) || seen.has(e.uid)) continue;
      if (E.find(G, e.uid) || HH.has(e.uid) || (CUR && CUR.R0 && CUR.R0.has(e.uid)) || (DS.P && DS.P.own.has(e.uid))) continue;
      const el = hcOf(e.uid), q = rc(el);
      if (!el || !q) continue;
      seen.add(e.uid);
      const c = anyC(e.uid), id = c ? c.id : null, c1 = (id && cols(id).c1) || "#ffd65a";
      const t = e.t === "end" ? "CUỐI LƯỢT" : e.t === "react" ? (e.w === "x" || e.z === "disc" ? "KHI BỊ VỨT BỎ" : "PHẢN ỨNG") : "KỸ NĂNG TRÊN TAY";
      try { el.animate([{ transform: "none", filter: "none" }, { transform: "translateY(-16px) scale(1.1)", filter: `brightness(1.6) drop-shadow(0 0 10px ${c1})`, offset: 0.3 }, { transform: "translateY(-12px) scale(1.08)", filter: `brightness(1.3) drop-shadow(0 0 8px ${c1})`, offset: 0.75 }, { transform: "none", filter: "none" }], { duration: 760, easing: "ease-out", composite: "add" }); } catch (x) {}
      ring(q.x, q.y, c1, q.w * 1.25, 0.45, 0.95, 1.3);
      glow(q.x, q.y, c1, q.w * 1.9, 0.5, 0.6);
      converge(q.x, q.y, [c1, "#ffffff"], 12, q.w * 0.9, 0.3);
      try { say(q.x, q.t - 12, t, c1); } catch (x) {}
      try { holdFx(420); } catch (x) {}
      tap("handCover", { uid: e.uid, t: e.t });
    }
  }

  /* ---------- ẩn tạm lá trên tay / trên bàn bằng luật CSS (bền với vẽ lại) ---------- */
  const HS = document.createElement("style");
  HS.id = "actHide";
  document.head.appendChild(HS);
  const HH = new Set(), HB = new Set();
  const hsSync = () => {
    const a = [...HH].map((u) => `#hand [data-hc="${u}"]`), b = [...HB].map((u) => `#board [data-mc="${u}"]`);
    HS.textContent = (a.length ? a.join(",") + "{opacity:0!important}" : "") + (b.length ? b.join(",") + "{visibility:hidden!important}" : "");
  };
  const hideHand = (u) => { HH.add(u); hsSync(); };
  const hideBoard = (u) => { HB.add(u); hsSync(); };
  const showHand = (u, c) => {
    if (!HH.delete(u)) return;
    hsSync();
    const el = hcOf(u), q = rc(el);
    if (!el || !q || reduced) return;
    try { el.animate([{ transform: "translateY(-20px) scale(1.2)", filter: "brightness(1.8)" }, { transform: "translateY(-5px) scale(1.05)", filter: "brightness(1.2)", offset: 0.55 }, { transform: "none", filter: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.3,1)", composite: "add" }); } catch (e) {}
    ring(q.x, q.y, c || "#ffd65a", q.w * 1.2, 0.4, 0.95);
    glow(q.x, q.y, c || "#ffd65a", q.w * 1.5, 0.35, 0.6);
  };
  const showBoard = (u) => { if (HB.delete(u)) hsSync(); };
  AC.hidden = () => ({ hand: [...HH], board: [...HB] });
  function unhideAll() { HH.clear(); HB.clear(); hsSync(); }

  /* ============ MỤC 2: BỘ BÀI — chỉ mặt lưng chồng bài ============ */
  const BACKACT = /^(buff|steal|set|cost|fix6)$/;
  const bkCss = (side) => { try { if (side === "p") return backBg(); const b = BACKS[foeBack] || BACKS.b1; return b[1]; } catch (e) { return "#14205a"; } };
  const pileHTML = (side, n) => `<span class="dkp" style="--bk:${String(bkCss(side)).replace(/"/g, "'")}">${"<i></i>".repeat(n || 3)}<b></b></span>`;
  AC.pileHTML = pileHTML;
  {
    const tf0 = topFace29;
    topFace29 = function (e, pub) { if (e && BACKACT.test(e.a) && !reduced) return pileHTML(e.side); return tf0.apply(this, arguments); };
    const ta0 = topAct29;
    topAct29 = function (s, e, c) {
      if (!e || !BACKACT.test(e.a) || reduced || !e.g) return ta0.apply(this, arguments);
      try { deckAct(s, e); } catch (x) { console.error(x); }
    };
  }
  /* nhãn trên chồng bài: chỉ phần đổi (không lộ số của lá) */
  function deckLab(e) {
    const dc = e.c1 != null && e.c1 !== e.c0, dp = e.p1 != null && e.p1 !== e.p0, q = [];
    if (e.a === "fix6") return "NĂNG LƯỢNG 6 ĐẾN LƯỢT 6";
    if (dc) q.push(e.a === "set" || e.a === "cost" ? "NĂNG LƯỢNG → " + e.c1 : (e.c1 > e.c0 ? "+" : "−") + Math.abs(e.c1 - e.c0) + " NĂNG LƯỢNG");
    if (dp) q.push(e.a === "set" ? "SỨC MẠNH → " + e.p1 : (e.p1 > e.p0 ? "+" : "−") + Math.abs(e.p1 - e.p0) + " SỨC MẠNH");
    return q.join(" · ") || (e.a === "steal" ? "BỊ LẤY SỨC MẠNH" : "");
  }
  function deckAct(s, e) {
    const g = e.g, t = e.sp, steal = e.a === "steal", up = e.p1 != null && e.p0 != null && e.p1 > e.p0;
    const c = steal ? "#ff6b86" : up ? "#5dffa8" : e.a === "set" ? "#ffe7a0" : "#7fe0ff";
    tap("deck", { a: e.a, uid: e.uid, side: e.side });
    try { g.animate([{ transform: "none" }, { transform: `scale(1.12) rotate(${steal ? -5 : 4}deg)`, offset: 0.35 }, { transform: "none" }], { duration: 480, fill: "none" }); } catch (x) {}
    const b = g.querySelector(".dkp>b");
    if (b) { b.textContent = deckLab(e); b.style.color = c; try { b.animate([{ opacity: 0, transform: "translate(-50%,6px) scale(.7)" }, { opacity: 1, transform: "translate(-50%,0) scale(1)" }], { duration: 220, fill: "both" }); } catch (x) {} }
    ring(t.x, t.y, c, t.w * 0.95, 0.4, 0.95);
    glow(t.x, t.y, c, t.w * 1.5, 0.4, 0.6);
    if (steal) {
      /* sức mạnh rời chồng bài: hạt đỏ bay ra, đến thẻ nhận */
      streaks(t.x, t.y, ["#ff6b86", "#ffd0d6", "#ffffff"], 12, 220, -2.6, -0.5, 0.45, 5);
      const to = e.to && where7(e.to, null, rects());
      if (to) { trail({ x: t.x, y: t.y }, to, 60, 0, T8.FLY, ["#ff9aa8", "#ffd65a", "#ffffff"], 10); fxT(() => { glow(to.x, to.y, "#7dffb0", 46, 0.4, 0.7); ring(to.x, to.y, "#7dffb0", (to.w || 50) * 0.9, 0.35, 0.9); try { pulse(`#board [data-mc="${e.to}"]`, [{ transform: "scale(1)" }, { transform: "scale(1.14)", offset: 0.4 }, { transform: "scale(1)" }], 420); } catch (x) {} }, T8.FLY); }
      try { SFX.fam("dn1", { el: elU(s.src) }); } catch (x) {}
    } else {
      streaks(t.x, t.y, up ? ["#5dffa8", "#ffffff", "#ffe7a0"] : ["#7fe0ff", "#ffffff"], 12, 200, -2.8, -0.3, 0.45, 5);
      try { SFX.fam(up ? "up1" : "costdn", { el: elU(s.src) }); } catch (x) {}
    }
  }

  /* ============ XREG: màn diễn riêng ============ */
  const selfStep = (P) => (s) => (s.k === "up" || s.k === "down") && s.dst === P.uid;
  const hitAll = (P) => { for (const s of P.owned) P.hit(s); };
  /* điểm phát nhỏ trên thẻ (thẻ không có chuỗi PA6): mép trên lá */
  const topOf = (q) => ({ x: q.x, y: q.t - q.h * 0.05 });

  /* --- Tâm Ma: lấy 1 sức mạnh từ MỖI lá trong bộ bài đối thủ — chồng bài đối thủ hiện mặt lưng, dòng hồn đỏ chảy về --- */
  SG.addX("tammanu", {
    kind: "rev", T: 980, dur: 1500,
    prep(P) { if (!realRev("tammanu")) return false; P.n = (G.deck[P.side === "p" ? "a" : "p"] || []).length; if (!P.n) return false; },
    own: (s, P) => selfStep(P)(s),
    run(P, j, total) {
      const a = K.srcPt(P), os = P.side === "p" ? "a" : "p", dz = deckPt(os) || { x: innerWidth - 40, y: 60, w: 44, h: 62 };
      const W0 = Math.round(clamp(innerWidth * 0.2, 70, 96)), H0 = Math.round(W0 * 1.36);
      const px = clamp(dz.x, W0 / 2 + 8, innerWidth - W0 / 2 - 8), py = clamp(dz.y + (dz.h || 40) / 2 + H0 / 2 + 12, H0 / 2 + 8, innerHeight * 0.5);
      const pl = j.add(el0("acpile", px, py, W0, H0, "#ff6b86", pileHTML(os, 4)));
      tl(pl, [{ t: 0, x: dz.x, y: dz.y, s: 0.4, o: 0 }, { t: 240, x: px, y: py, s: 1.06, o: 1, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 320, x: px, y: py, s: 1 }, { t: total - 260, x: px, y: py, s: 1 }, { t: total, x: dz.x, y: dz.y, s: 0.4, o: 0, e: "ease-in" }], total);
      const lb = pl.querySelector(".dkp>b");
      j.at(300, () => { ring(px, py, "#ff6b86", W0 * 1.2, 0.45, 0.9); glow(px, py, "#ff3a5a", W0 * 1.8, 0.5, 0.55); sfx("whoosh"); if (lb) { lb.textContent = "−1 × 0 LÁ"; lb.style.color = "#ff9aa8"; } });
      const n = P.n, steps = Math.min(n, 8), gap = Math.round(440 / Math.max(1, steps));
      for (let i = 0; i < steps; i++) j.at(360 + i * gap, () => {
        const me = rc(mcOf(P.uid)) || a, k = Math.round(((i + 1) * n) / steps);
        trail({ x: px + rnd(-W0 * 0.3, W0 * 0.3), y: py - H0 * 0.3 }, topOf(me), 70, 0, 520, ["#ff6b86", "#ffd0d6", "#ffffff"], 6);
        if (lb) { lb.textContent = "−1 × " + k + " LÁ"; try { lb.animate([{ transform: "translate(-50%,0) scale(1.35)" }, { transform: "translate(-50%,0) scale(1)" }], { duration: 180 }); } catch (e) {} }
        try { pl.animate([{ transform: pl.style.transform || "none", filter: "brightness(1.6)" }, { filter: "brightness(1)" }], { duration: 160, composite: "add" }); } catch (e) {}
      });
      j.at(P.T - 60, () => { const me = rc(mcOf(P.uid)) || a; converge(me.x, me.y, ["#ff6b86", "#ffffff", P.c1], 16, me.w * 0.9, 0.3, 1); });
      j.at(P.T, () => { hitAll(P); const me = rc(mcOf(P.uid)) || a; ring(me.x, me.y, "#ff6b86", me.w * 1.3, 0.45, 0.95); streaks(me.x, me.y, ["#ff6b86", "#ffffff", P.c1], 14, 260, 0, 6.283, 0.45, 5); tap("tammanu:hit", { uid: P.uid, n }); });
    },
  });

  /* --- Cự Long Cổ: Lật — nhận sức mạnh của 1 thẻ địch hàng trước. Vuốt rồng cào thẻ địch, sức mạnh của nó chảy thành dòng vàng-đỏ về Cự Long --- */
  SG.addX("culongco", {
    kind: "rev", T: 1180, dur: 1700,
    prep(P) {
      if (!realRev("culongco") || P.li < 0) return false;
      const os = P.side === "p" ? "a" : "p", fr = G.locs[P.li].cards[os].slice(0, 2).filter((c) => c.rev);
      const nb = (P.inst._nb || []).slice().reverse().find((x) => x.w === "lay");
      let t = null;
      if (nb) t = fr.find((c) => c.id === nb.f && (P.P0 && P.P0.has(c.uid) ? P.P0.get(c.uid) === nb.d : true)) || fr.find((c) => c.id === nb.f);
      if (!t) t = fr[0];
      if (!t) return false;
      P.tg = t.uid; P.v = nb ? nb.d : P.P0 && P.P0.has(t.uid) ? P.P0.get(t.uid) : 0;
    },
    own: (s, P) => selfStep(P)(s),
    run(P, j, total) {
      const a = K.srcPt(P), me0 = rc(mcOf(P.uid)) || P.q0 || a, tq = rc(mcOf(P.tg));
      if (!tq) { j.at(P.T, () => hitAll(P)); return; }
      const sz = clamp((tq.w || 60) * 1.9, 96, innerWidth * 0.42), up = { x: a.x, y: a.y - 10 };
      const d = pic(j, "culongco", up.x, up.y, sz, sz, "#ff8a2b") || j.add(K.prop(P, up.x, up.y, sz));
      const k = K.appear(P, j, d, up, 1, total);
      const hit = { x: tq.x - (me0.x < tq.x ? -1 : 1) * tq.w * 0.15, y: tq.y - tq.h * 0.12 };
      /* lao tới, cào (360-620), rút về mang theo dòng sức mạnh */
      k.push(...arc(up, hit, 60, 260, 520, { s0: 1, s1: 1.15, r0: -10, r1: 18 }), { t: 560, x: hit.x, y: hit.y + 18, s: 1.2, r: 34, e: "cubic-bezier(.6,0,.4,1)" }, { t: 640, x: hit.x, y: hit.y + 8, s: 1.1, r: 24 }, { t: 760, x: hit.x, y: hit.y - 6, s: 1, r: 8 });
      k.push(...K.home(P, { x: hit.x, y: hit.y - 6 }, 1260, total, 1));
      k.splice(k.length - K.home(P, { x: hit.x, y: hit.y - 6 }, 1260, total, 1).length, 0, { t: 1260, x: hit.x, y: hit.y - 6, s: 1, r: 0 });
      tl(d, k, total);
      trail(up, hit, 60, 260, 520, ["#ff8a2b", "#ffd27a", "#ffffff"], 9);
      j.at(560, () => {
        const vc = pic(j, "vet_cao", tq.x, tq.y, tq.w * 1.5, tq.h * 1.2, "#ff4d5e");
        if (vc) tl(vc, [{ t: 0, x: tq.x, y: tq.y, s: 0.6, o: 0, r: -8 }, { t: 70, x: tq.x, y: tq.y, s: 1.1, o: 1, r: -8 }, { t: 360, x: tq.x, y: tq.y + 6, s: 1.05, o: 0.9, r: -8 }, { t: 520, x: tq.x, y: tq.y + 10, s: 1.1, o: 0, r: -8 }], 520);
        ring(tq.x, tq.y, "#ff8a2b", tq.w * 1.25, 0.4, 0.95);
        glow(tq.x, tq.y, "#ff5a2b", tq.w * 1.8, 0.4, 0.7);
        streaks(tq.x, tq.y, ["#ff8a2b", "#ffd27a", "#ffffff"], 14, 260, -3.1, 0.1, 0.4, 5);
        P6.kit.shake(4, 0, 1);
        try { const el = mcOf(P.tg); if (el) el.animate([{ transform: "none" }, { transform: "translateX(-5px) rotate(-3deg)", offset: 0.25 }, { transform: "translateX(4px) rotate(2deg)", offset: 0.55 }, { transform: "none" }], { duration: 420, composite: "add" }); } catch (e) {}
        try { SFX.fam("dn2", { el: elOf(P.id) }); } catch (e) {}
      });
      /* số sức mạnh của thẻ địch nhấc lên khỏi ô số rồi bay về Cự Long (thẻ địch giữ nguyên sức mạnh — chỉ bị "đọc") */
      j.at(700, () => {
        const el = mcOf(P.tg), b = el && el.querySelector(".pwh"), bq = b ? b.getBoundingClientRect() : null, bp = bq && bq.width ? { x: bq.left + bq.width / 2, y: bq.top + bq.height / 2 } : { x: tq.x + tq.w * 0.3, y: tq.t + 10 };
        const me = rc(mcOf(P.uid)) || me0;
        const n = j.add(el0("sgx acnum", bp.x, bp.y, 90, 44, "#ff8a2b", `<b>+${P.v}</b>`));
        tl(n, [{ t: 0, x: bp.x, y: bp.y, s: 0.5, o: 0 }, { t: 120, x: bp.x, y: bp.y - 22, s: 1.35, o: 1, e: "cubic-bezier(.2,.9,.3,1.3)" }, { t: 260, x: bp.x, y: bp.y - 26, s: 1.2 }, ...arc({ x: bp.x, y: bp.y - 26 }, topOf(me), 80, 260, P.T - 700, { s0: 1.2, s1: 0.8 }), { t: P.T - 700 + 80, x: me.x, y: me.y, s: 0.4, o: 0 }], P.T - 700 + 80);
        glow(bp.x, bp.y, "#ffd27a", 40, 0.4, 0.8);
        /* dòng sức mạnh: hai dải hạt nối thẻ địch -> Cự Long */
        for (let i = 0; i < 2; i++) trail({ x: tq.x, y: tq.y }, me, 90 + i * 40, 60 + i * 80, P.T - 700, ["#ff8a2b", "#ffd27a", "#ffffff", "#ff4d5e"], 14);
        if (!lite()) for (let i = 0; i < 3; i++) fxT(() => beam(tq.x, tq.y, me.x, me.y, i % 2 ? "#ffd27a" : "#ff8a2b", 7 - i * 2, 0.28), i * 120);
      });
      j.at(P.T - 80, () => { const me = rc(mcOf(P.uid)) || me0; converge(me.x, me.y, ["#ff8a2b", "#ffd27a", P.c1], 18, me.w, 0.3, 1); });
      j.at(P.T, () => {
        hitAll(P);
        const me = rc(mcOf(P.uid)) || me0;
        ring(me.x, me.y, "#ffd27a", me.w * 1.4, 0.5, 0.95);
        glow(me.x, me.y, "#ff8a2b", me.w * 2.2, 0.5, 0.75);
        streaks(me.x, me.y, ["#ff8a2b", "#ffd27a", "#ffffff"], 18, 300, 0, 6.283, 0.5, 6);
        P6.kit.shake(5, 0, 1);
        tap("culongco:hit", { uid: P.uid, tg: P.tg, v: P.v });
      });
    },
  });

  /* --- Tiểu Long: Cuối Lượt — trừ 2 sức mạnh một thẻ địch tại đây. Rồng con phun cầu lửa vào thẻ địch, nổ lửa, số giảm --- */
  SG.addX("tieulong", {
    kind: "end", T: 760, dur: 1300,
    prep(P) {
      if (P.li < 0) return false;
      const os = P.side === "p" ? "a" : "p";
      P.tgs = G.locs[P.li].cards[os].filter((c) => P.P0 && P.P0.has(c.uid) && E.power(G, c, P.li) < P.P0.get(c.uid)).map((c) => c.uid);
      if (!P.tgs.length) return false;
    },
    own: (s, P) => (s.k === "down" || s.k === "up") && P.tgs.includes(s.dst),
    run(P, j, total) {
      const a = K.srcPt(P), sz = clamp(((P.q0 && P.q0.w) || 60) * 1.5, 80, innerWidth * 0.32);
      eotMark(P, j, "−2 SỨC MẠNH", "#ff6a1f");
      P.tgs.forEach((u, i) => {
        const tq = rc(mcOf(u));
        if (!tq) return;
        const t0 = 300 + i * 80;
        j.at(t0, () => {
          const b = { x: tq.x, y: tq.y }, fb = pic(j, "tieulong", a.x, a.y, sz * 0.9, sz * 0.9 * 0.6, "#ff6a1f", "face");
          if (fb) tl(fb, [{ t: 0, x: a.x, y: a.y, s: 0.4, o: 0, r: 0 }, { t: 60, x: a.x, y: a.y - 6, s: 0.9, o: 1 }, ...arc({ x: a.x, y: a.y - 6 }, b, 50, 60, P.T - t0, { face: 1, s0: 0.9, s1: 1.05, n: 12 }), { t: P.T - t0 + 40, x: b.x, y: b.y, s: 1.3, o: 0 }], P.T - t0 + 40);
          trail(a, b, 50, 60, P.T - t0, ["#ff6a1f", "#ffd27a", "#ff3a00"], 12);
          sfx("whoosh");
        });
        j.at(P.T, () => {
          const q = rc(mcOf(u)) || tq, ex = pic(j, "no_lua", q.x, q.y, q.w * 1.7, q.w * 1.7, "#ff6a1f");
          if (ex) tl(ex, [{ t: 0, x: q.x, y: q.y, s: 0.3, o: 0 }, { t: 90, x: q.x, y: q.y, s: 1.05, o: 1, e: "cubic-bezier(.2,.9,.3,1.2)" }, { t: 380, x: q.x, y: q.y - 6, s: 1.15, o: 0 }], 380);
          ring(q.x, q.y, "#ff6a1f", q.w * 1.3, 0.4, 0.95);
          streaks(q.x, q.y, ["#ff6a1f", "#ffd27a", "#ff3a00"], 16, 280, 0, 6.283, 0.45, 6);
          P6.kit.shake(4, 0, 1);
          try { SFX.fam("dn1", { el: elOf(P.id) }); } catch (e) {}
          tap("tieulong:hit", { uid: u });
        });
      });
      j.at(P.T, () => hitAll(P));
    },
  });

  /* --- Chiến Thần: so 3 SỐ sức mạnh trên cùng hai bộ bài (không mặt thẻ), đếm tổng, đạt -> +6 bay về thẻ --- */
  SG.addX("chienthan", {
    kind: "rev",
    T: (P) => 1700 + (P.win ? 0 : 0), dur: (P) => 2350,
    prep(P) {
      if (!realRev("chienthan")) return false;
      const tops = P.evs.filter((e) => e.k === "top" && e.a === "peek" && e.src === P.uid);
      if (!tops.length) return false;
      const S = (sd) => tops.filter((e) => e.side === sd).sort((x, y) => (x.n || 0) - (y.n || 0)).map((e) => +e.p0 || 0);
      P.me = S(P.side); P.op = S(P.side === "p" ? "a" : "p");
      P.sm = P.me.reduce((x, y) => x + y, 0); P.so = P.op.reduce((x, y) => x + y, 0); P.win = P.sm > P.so;
    },
    own: (s, P) => (s.k === "top" && s.src === P.uid) || selfStep(P)(s),
    run(P, j, total) {
      const a = K.srcPt(P), bd = rc(document.getElementById("board")) || { x: innerWidth / 2, y: innerHeight * 0.45, w: innerWidth, h: 400, t: 120 };
      /* gpu70 (mục 8): bảng nhỏ gọn (số xếp ngang), đặt GIỮA màn — tâm hàng chiến địa giữa — không che hàng thẻ trên cùng (đối thủ) */
      const lw = rc(document.querySelector('#board [data-lane="1"] .locw')), PW = Math.min(innerWidth - 40, 250), PH = 96, cx = innerWidth / 2;
      let ob0 = 0; document.querySelectorAll("#board .side.opp").forEach((e) => { const r = e.getBoundingClientRect(); if (r.height) ob0 = Math.max(ob0, r.bottom); });
      const cy = clamp(lw ? lw.y : (bd.y || innerHeight / 2), Math.max(PH / 2 + 8, ob0 + PH / 2 + 2), innerHeight - PH / 2 - 8);
      const pn = j.add(el0("acvs sm70", cx, cy, PW, PH, "#ff6a3a", `<div class="acvs-in">
        <div class="col me"><h6>BẠN</h6><div class="nums">${[0, 1, 2].map((i) => `<i data-i="${i}">${P.me[i] != null ? "?" : "–"}</i>`).join("")}</div><b class="sum">0</b></div>
        <div class="mid"><span class="cmp">VS</span><small>3 lá trên cùng</small></div>
        <div class="col op"><h6>ĐỐI THỦ</h6><div class="nums">${[0, 1, 2].map((i) => `<i data-i="${i}">${P.op[i] != null ? "?" : "–"}</i>`).join("")}</div><b class="sum">0</b></div></div>`));
      tl(pn, [{ t: 0, x: a.x, y: a.y, s: 0.2, o: 0 }, { t: 280, x: cx, y: cy, s: 1.04, o: 1, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 360, x: cx, y: cy, s: 1 }, { t: total - 260, x: cx, y: cy, s: 1 }, { t: total, x: cx, y: cy - 10, s: 0.92, o: 0, e: "ease-in" }], total);
      sfx("whoosh");
      const cMe = pn.querySelector(".me"), cOp = pn.querySelector(".op"), sMe = cMe.querySelector(".sum"), sOp = cOp.querySelector(".sum"), cmp = pn.querySelector(".cmp");
      const bump = (e) => { try { e.animate([{ transform: "scale(1.6)" }, { transform: "scale(1)" }], { duration: 220, easing: "cubic-bezier(.2,.8,.3,1)" }); } catch (x) {} };
      let am = 0, ao = 0;
      for (let i = 0; i < 3; i++) j.at(420 + i * 260, () => {
        for (const [col, arr, sEl, isMe] of [[cMe, P.me, sMe, 1], [cOp, P.op, sOp, 0]]) {
          if (arr[i] == null) continue;
          const n = col.querySelector(`i[data-i="${i}"]`);
          n.textContent = String(arr[i]); n.classList.add("on"); bump(n);
          if (isMe) { am += arr[i]; sEl.textContent = String(am); } else { ao += arr[i]; sEl.textContent = String(ao); }
          bump(sEl);
          const q = rc(n); if (q) { star(q.x, q.y, "#ffffff", 34, 0.2); ring(q.x, q.y, isMe ? "#5dffa8" : "#ff9a6b", 26, 0.3, 0.8); }
        }
        sfx("place");
      });
      j.at(1260, () => {
        cmp.textContent = P.sm > P.so ? ">" : P.sm < P.so ? "<" : "=";
        pn.classList.add(P.win ? "win" : "lose");
        bump(cmp);
        const w = P.win ? cMe : cOp, q = rc(w.querySelector(".sum"));
        if (q) { ring(q.x, q.y, P.win ? "#5dffa8" : "#ff6b86", 60, 0.45, 0.95); glow(q.x, q.y, P.win ? "#5dffa8" : "#ff6b86", 90, 0.45, 0.7); }
        try { SFX.play(P.win ? "chime" : "place"); } catch (e) {}
        { let ob = 0; document.querySelectorAll("#board .side.opp").forEach((e) => { const r = e.getBoundingClientRect(); if (r.height) ob = Math.max(ob, r.bottom); }); tap("chienthan:cmp", { uid: P.uid, win: P.win ? 1 : 0, pw: PW, ph: PH, top: Math.round(cy - PH / 2), cx: Math.round(cx - innerWidth / 2), ob: Math.round(ob) }); }
      });
      if (P.win) {
        j.at(1420, () => {
          const q = rc(sMe) || { x: cx - PW * 0.3, y: cy + 50 }, me = rc(mcOf(P.uid)) || a;
          const n = j.add(el0("sgx acnum", q.x, q.y, 90, 44, "#5dffa8", "<b>+6</b>"));
          tl(n, [{ t: 0, x: q.x, y: q.y, s: 0.6, o: 0 }, { t: 100, x: q.x, y: q.y - 12, s: 1.4, o: 1 }, ...arc({ x: q.x, y: q.y - 12 }, topOf(me), 60, 100, P.T - 1420, { s0: 1.4, s1: 0.8 }), { t: P.T - 1420 + 60, x: me.x, y: me.y, s: 0.4, o: 0 }], P.T - 1420 + 60);
          trail(q, me, 60, 100, P.T - 1420, ["#5dffa8", "#ffffff", "#ffd65a"], 8);
        });
      } else j.at(1420, () => { const q = rc(cmp); if (q) fl(q.x, q.y + 46, "KHÔNG ĐẠT", "#ffb0b0"); });
      j.at(P.T, () => { hitAll(P); if (P.win) { const me = rc(mcOf(P.uid)) || a; ring(me.x, me.y, "#5dffa8", me.w * 1.3, 0.45, 0.95); streaks(me.x, me.y, ["#5dffa8", "#ffffff", P.c1], 14, 260, 0, 6.283, 0.45, 5); } });
    },
  });

  /* --- mẫu chung "HÚT SỨC MẠNH" (Lật / Kích Hoạt): thẻ nguồn tăng đúng bằng phần các thẻ trên bàn bị giảm (Rồng Trăng, Băng Đế, Huyết Phi…)
     đạo cụ riêng của thẻ (img/v) chạm từng mục tiêu, số "−n" nhấc khỏi ô số mục tiêu và chảy thành dòng hạt về thẻ nguồn --- */
  SG.addX("drain", {
    T: (P) => 760 + Math.min(4, P.tgs.length) * 70, dur: (P) => 1250 + Math.min(4, P.tgs.length) * 70,
    match(evs, R0, P0) {
      if (!P0) return null;
      let e = evs.find((x) => x.k === "skill" && (x.t === "rev" || x.t === "act") || x.k === "act"), f = e ? E.find(G, e.uid) : null;
      if (!e && evs.some((x) => x.k === "move")) {
        /* bị động khi di chuyển (Quỷ Khiếu, Loạn Ca Tử…) / Nhiệm Vụ: thẻ tăng nhiều nhất trên bàn là nguồn */
        let best = null, bg = 0;
        for (let i = 0; i < 3; i++) for (const sd of E.SIDES) for (const c of G.locs[i].cards[sd]) { if (!c.rev || !P0.has(c.uid)) continue; const d = E.power(G, c, i) - P0.get(c.uid); if (d > bg) { bg = d; best = { inst: c, li: i }; } }
        if (best && /lấy \d+ sức mạnh/i.test((C[E.ab(best.inst)] || {}).x || "")) { f = best; e = { uid: best.inst.uid }; }
      }
      if (!e || !f || !f.inst.rev || f.inst.sil || XREG_has(f.inst.id)) return null;
      if (!realRev(E.ab(f.inst)) && E.REV[E.ab(f.inst)]) return null;
      if (evs.some((x) => x.k === "borrow" || x.k === "top" || x.k === "discard" || x.k === "destroy")) return null;
      const me = f.inst, g = P0.has(me.uid) ? E.power(G, me, f.li) - P0.get(me.uid) : 0;
      if (!(g > 0)) return null;
      const tgs = [];
      let lost = 0;
      for (let i = 0; i < 3; i++) for (const sd of E.SIDES) for (const c of G.locs[i].cards[sd]) { if (c === me || !c.rev || !P0.has(c.uid)) continue; const d = E.power(G, c, i) - P0.get(c.uid); if (d < 0) { tgs.push([c.uid, -d]); lost -= d; } }
      const hb = SNX && SNX.hb;
      if (hb) for (const sd of E.SIDES) for (const c of G.hand[sd]) if (hb.has(c.uid) && (c.bonus || 0) < hb.get(c.uid)) { const d = hb.get(c.uid) - (c.bonus || 0); tgs.push([c.uid, d, 1]); lost += d; }
      if (!tgs.length || lost < g * 0.5 || lost > g * 2) return null;
      return { inst: me, li: f.li, ev: e, extra: { tgs: tgs.slice(0, 6), gain: g } };
    },
    own: (s, P) => (s.k === "up" || s.k === "down") && !s.ong && (s.dst === P.uid || P.tgs.some((x) => x[0] === s.dst)),
    run(P, j, total) {
      const a = K.srcPt(P), me0 = rc(mcOf(P.uid)) || P.q0 || a, pk = projOf(P.id), cc = P.c1 || "#ff8a2b";
      const sz = clamp(((P.q0 && P.q0.w) || 60) * 1.3, 64, innerWidth * 0.3);
      const foeHand = rc(document.getElementById("avFoe"));
      const tqOf = (u, h) => rc(mcOf(u)) || rc(hcOf(u)) || (h ? foeHand : null);
      P.tgs.forEach(([u, d, h], i) => {
        const tq = tqOf(u, h);
        if (!tq) return;
        const t0 = 260 + i * 70;
        j.at(t0, () => {
          const pr = pk ? pic(j, pk, a.x, a.y, sz, sz, cc, "face") : null;
          if (pr) tl(pr, [{ t: 0, x: a.x, y: a.y, s: 0.4, o: 0 }, { t: 80, x: a.x, y: a.y - 8, s: 1, o: 1 }, ...arc({ x: a.x, y: a.y - 8 }, tq, 60, 80, 300, { face: 1, s0: 1, s1: 1, n: 10 }), { t: 380, x: tq.x, y: tq.y, s: 1.2, o: 0 }], 380);
          trail(a, tq, 60, 80, 300, [cc, "#ffffff"], 7);
        });
        j.at(t0 + 300, () => {
          const q = tqOf(u, h) || tq, el = mcOf(u) || hcOf(u), b = el && el.querySelector(".pwh"), bq = b ? b.getBoundingClientRect() : null;
          if (h && el && !mcOf(u)) { try { const v1 = parseInt(b.textContent, 10); P6.stat({ el, k: "pow", v0: v1 + d, v1, uid: u }); } catch (x) {} }
          const bp = bq && bq.width ? { x: bq.left + bq.width / 2, y: bq.top + bq.height / 2 } : { x: q.x + q.w * 0.3, y: q.t + 10 };
          ring(q.x, q.y, "#ff6b86", q.w * 1.2, 0.4, 0.95); glow(q.x, q.y, cc, q.w * 1.6, 0.4, 0.6);
          const st = P.owned.find((s) => s.dst === u); if (st) P.hit(st);
          const me = rc(mcOf(P.uid)) || me0, n = j.add(el0("sgx acnum", bp.x, bp.y, 70, 36, "#ffd27a", `<b style="font-size:24px">+${d}</b>`)), T2 = P.T - (t0 + 300);
          tl(n, [{ t: 0, x: bp.x, y: bp.y, s: 0.5, o: 0 }, { t: 100, x: bp.x, y: bp.y - 18, s: 1.1, o: 1 }, ...arc({ x: bp.x, y: bp.y - 18 }, topOf(me), 60, 140, T2, { s0: 1.1, s1: 0.7 }), { t: T2 + 60, x: me.x, y: me.y, s: 0.4, o: 0 }], T2 + 60);
          trail(q, me, 80, 60, T2, [cc, "#ffd27a", "#ffffff"], 10);
          tap("drain:hit", { uid: u, src: P.uid });
        });
      });
      j.at(P.T - 60, () => { const me = rc(mcOf(P.uid)) || me0; converge(me.x, me.y, [cc, "#ffd27a", "#ffffff"], 14, me.w, 0.3, 1); });
      j.at(P.T, () => { hitAll(P); const me = rc(mcOf(P.uid)) || me0; ring(me.x, me.y, "#ffd27a", me.w * 1.35, 0.45, 0.95); streaks(me.x, me.y, [cc, "#ffd27a", "#ffffff"], 14, 260, 0, 6.283, 0.45, 5); tap("drain", { uid: P.uid, n: P.tgs.length }); });
    },
  });

  /* ============ MỤC 12: CUỐI LƯỢT theo loại hiệu ứng ============ */
  /* ấn trăng dưới chân thẻ nguồn + nhãn loại; dùng chung cho mọi thẻ Cuối Lượt */
  function eotMark(P, j, lab, c) {
    const q = rc(mcOf(P.uid)) || rc(hcOf(P.uid)) || P.q0;
    if (!q) return;
    const s = clamp(q.w * 1.5, 70, 130), y = q.y + q.h * 0.36;
    const m = pic(j, "vet_chem", q.x, y, s, s, "#ffe7a0", "moon");
    if (m) tl(m, [{ t: 0, x: q.x, y, s: 0.4, o: 0, r: -40 }, { t: 200, x: q.x, y, s: 1.05, o: 1, r: -10, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 520, x: q.x, y, s: 1, o: 0.95, r: 0 }, { t: 760, x: q.x, y: y + 4, s: 1.1, o: 0, r: 6 }], 760);
    ring(q.x, y, "#ffe7a0", q.w * 1.1, 0.5, 0.8, 0.32);
    glow(q.x, q.y, c || "#ffe7a0", q.w * 1.7, 0.45, 0.55);
    const t = tagEl(j, "actag", q.x, q.t - 14, 170, 26, c || "#ffe7a0", `<b><em>CUỐI LƯỢT</em>${lab ? " · " + esc(lab) : ""}</b>`);
    const ty = clamp(q.t - 16, 70, innerHeight - 40);
    tl(t, [{ t: 0, x: q.x, y: ty + 8, s: 0.7, o: 0 }, { t: 180, x: q.x, y: ty, s: 1, o: 1, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 900, x: q.x, y: ty - 2, s: 1, o: 1 }, { t: 1100, x: q.x, y: ty - 10, s: 0.95, o: 0 }], 1100);
    tap("eot", { uid: P.uid, lab });
  }
  AC.eotMark = eotMark;
  /* phân loại kết quả của một bước Cuối Lượt */
  function eotKind(P) {
    const ev = P.evs, X = ev.x7 || {}, o = { self: 0, up: [], dn: [], cost: [], hand: [], ab: [], tf: [], misc: "" };
    const P1 = new Map();
    try { for (let i = 0; i < 3; i++) for (const sd of E.SIDES) for (const c of G.locs[i].cards[sd]) if (c.rev) P1.set(c.uid, E.power(G, c, i)); } catch (e) {}
    if (P.P0) for (const [u, v] of P1) { if (!P.P0.has(u)) continue; const d = v - P.P0.get(u); if (!d) continue; if (u === P.uid) o.self = d; else (d > 0 ? o.up : o.dn).push([u, d]); }
    for (const c of X.cm || []) if (c.z === "hand") o.cost.push([c.u, c.d]);
    const hb = SNX && SNX.hb;
    if (hb) for (const sd of E.SIDES) for (const c of G.hand[sd]) if (hb.has(c.uid) && (c.bonus || 0) !== hb.get(c.uid)) o.hand.push([c.uid, (c.bonus || 0) - hb.get(c.uid)]);
    for (const e of ev) { if (e.k === "abcopy" || e.k === "sil") o.ab.push(e.uid); if (e.k === "morph") o.tf.push(e.uid); }
    if (ev.some((e) => e.k === "destroy")) o.misc = "TIÊU HUỶ"; else if (ev.some((e) => e.k === "discard")) o.misc = "VỨT BỎ"; else if (ev.some((e) => e.k === "move")) o.misc = "DI CHUYỂN"; else if (ev.some((e) => e.k === "summon")) o.misc = "TRIỆU HỒI"; else if ((X.hnew && (X.hnew.p.length || X.hnew.a.length)) || ev.some((e) => e.k === "draw" || e.k === "tohand")) o.misc = "THÊM THẺ";
    try { if (G.maxE && SNX && SNX.mx && G.maxE[P.side] !== SNX.mx[P.side]) o.mx = G.maxE[P.side] - SNX.mx[P.side]; } catch (e) {}
    return o;
  }
  /* SNX (05 snapX): thêm sức mạnh lá trên tay + năng lượng tối đa để so sau bước */
  {
    const sx0 = snapX;
    snapX = function () {
      const r = sx0.apply(this, arguments);
      try { if (SNX && G) { SNX.hb = new Map(); for (const sd of E.SIDES) for (const c of G.hand[sd]) SNX.hb.set(c.uid, c.bonus || 0); SNX.mx = G.maxE ? { p: G.maxE.p, a: G.maxE.a } : null; } } catch (e) {}
      return r;
    };
  }
  const sgn = (d) => (d > 0 ? "+" : "−") + Math.abs(d);
  SG.addX("eot", {
    T: 640, dur: 1500,
    match(evs) {
      const e = evs.find((x) => x.k === "skill" && x.t === "end");
      if (!e) return null;
      let inst = null, li = -1;
      const f = E.find(G, e.uid);
      if (f) { inst = f.inst; li = f.li; } else { try { inst = anyC(e.uid); } catch (x) {} }
      if (!inst || inst.sil || XREG_has(inst.id)) return null;
      if (!realRev(E.ab(inst)) && E.REV[E.ab(inst)]) return null;
      return { inst, li, ev: e };
    },
    prep(P) {
      P.o = eotKind(P);
      const o = P.o, L = [];
      if (o.self) L.push((o.self > 0 && P.P0 && P.P0.get(P.uid) > 0 && o.self === P.P0.get(P.uid) ? "×2" : sgn(o.self)) + " SỨC MẠNH");
      const grp = (arr) => { const same = arr.every((x) => x[1] === arr[0][1]); return (same ? sgn(arr[0][1]) : arr[0][1] > 0 ? "+" : "−") + " SỨC MẠNH" + (arr.length > 1 ? " ×" + arr.length + " THẺ" : ""); };
      if (o.up.length) L.push(grp(o.up));
      if (o.dn.length) L.push(grp(o.dn));
      if (o.cost.length) L.push(sgn(o.cost[0][1]) + " NĂNG LƯỢNG");
      if (o.hand.length) L.push(o.hand.length === 1 && o.hand[0][0] === P.uid ? sgn(o.hand[0][1]) + " SỨC MẠNH (TRÊN TAY)" : "TAY BÀI " + sgn(o.hand[0][1]) + (o.hand.length > 1 ? " ×" + o.hand.length : ""));
      if (o.mx) L.push(sgn(o.mx) + " NĂNG LƯỢNG TỐI ĐA");
      if (o.ab.length) L.push("ĐỔI KỸ NĂNG");
      if (o.tf.length) L.push("BIẾN HÌNH");
      if (o.misc) L.push(o.misc);
      P.lab = L.slice(0, 2).join(" · ");
      P.kd = o.tf.length ? "tf" : o.ab.length ? "ab" : o.cost.length || o.mx ? "nrg" : o.dn.length && !o.up.length && !(o.self > 0) ? "dn" : o.up.length || o.self > 0 || o.hand.length ? "up" : o.self < 0 ? "dn" : "misc";
    },
    own: (s, P) => (s.k === "up" || s.k === "down") && !s.ong && (s.dst === P.uid || P.o.up.some((x) => x[0] === s.dst) || P.o.dn.some((x) => x[0] === s.dst)),
    run(P, j, total) {
      const C2 = { up: "#ffd65a", dn: "#b06bff", nrg: "#5fe0a8", ab: "#bff4ff", tf: "#ff7ac0", misc: "#ffe7a0" }[P.kd];
      eotMark(P, j, P.lab, C2);
      const src = rc(mcOf(P.uid)) || rc(hcOf(P.uid)) || P.q0;
      const o = P.o, T = P.T;
      /* thẻ đích theo loại: mỗi loại một đạo cụ ảnh riêng */
      const tgt = (u, k, d, i) => {
        const q = rc(mcOf(u)) || rc(hcOf(u));
        if (!q) return;
        const img = k === "up" ? "sao_tang" : k === "dn" ? "no_toi" : k === "nrg" ? "an_ngoc" : k === "ab" ? "an_trien" : k === "tf" ? "cong" : "sao_tang";
        const col = k === "up" ? "#ffd65a" : k === "dn" ? "#b06bff" : k === "nrg" ? "#5fe0a8" : k === "ab" ? "#bff4ff" : "#ff7ac0";
        const t0 = T - 220 + i * 70;
        if (src && u !== P.uid) j.at(t0, () => { trail(topOf(src), q, 50, 0, 220, [col, "#ffffff"], 6); });
        j.at(t0 + 220, () => {
          const s = clamp(q.w * (k === "up" ? 1.1 : 1.35), 44, 120), p = pic(j, img, q.x, q.y - (k === "up" ? q.h * 0.25 : 0), s, s, col);
          if (p) {
            if (k === "up") tl(p, [{ t: 0, x: q.x, y: q.y, s: 0.4, o: 0 }, { t: 140, x: q.x, y: q.y - q.h * 0.3, s: 1.1, o: 1 }, { t: 520, x: q.x, y: q.y - q.h * 0.55, s: 0.9, o: 0 }], 520);
            else if (k === "dn") tl(p, [{ t: 0, x: q.x, y: q.y - 10, s: 0.5, o: 0 }, { t: 120, x: q.x, y: q.y, s: 1.05, o: 0.95 }, { t: 460, x: q.x, y: q.y + 14, s: 0.9, o: 0 }], 460);
            else tl(p, [{ t: 0, x: q.x, y: q.y, s: 0.3, o: 0, r: -30 }, { t: 160, x: q.x, y: q.y, s: 1.05, o: 1, r: 0, e: "cubic-bezier(.2,.9,.3,1.2)" }, { t: 520, x: q.x, y: q.y, s: 1.15, o: 0, r: 20 }], 520);
          }
          ring(q.x, q.y, col, q.w * 1.2, 0.4, 0.9);
          if (k === "up") streaks(q.x, q.y + q.h * 0.3, [col, "#ffffff"], 10, 220, -2.0, -1.1, 0.5, 5);
          else if (k === "dn") streaks(q.x, q.y - q.h * 0.3, [col, "#3a1060"], 10, 200, 1.1, 2.0, 0.5, 5);
          else streaks(q.x, q.y, [col, "#ffffff"], 10, 220, 0, 6.283, 0.4, 5);
          if (d && hcOf(u) && !mcOf(u)) { const el = hcOf(u); try { P6.stat({ el, k: k === "nrg" ? "cost" : "pow", v1: parseInt((el.querySelector(k === "nrg" ? ".cst" : ".pwh") || {}).textContent, 10), v0: parseInt((el.querySelector(k === "nrg" ? ".cst" : ".pwh") || {}).textContent, 10) - d, uid: u, i }); } catch (e) {} }
          tap("eot:hit", { uid: u, kd: k });
        });
      };
      let i = 0;
      if (o.self) tgt(P.uid, o.self > 0 ? "up" : "dn", 0, i++);
      for (const [u] of o.up) tgt(u, "up", 0, i++);
      for (const [u] of o.dn) tgt(u, "dn", 0, i++);
      for (const [u, d] of o.cost) if (!(P.diffs || []).some((s) => s.hc === u)) tgt(u, "nrg", 0, i++);
      for (const [u, d] of o.hand) tgt(u, d > 0 ? "up" : "dn", d, i++);
      for (const u of o.ab) tgt(u, "ab", 0, i++);
      for (const u of o.tf) tgt(u, "tf", 0, i++);
      if (o.mx) j.at(T, () => { const q = rc(document.getElementById("orb")); if (q) { const p = pic(j, "ngoc", q.x, q.y, 60, 60, "#5fe0a8"); if (p) tl(p, [{ t: 0, x: q.x, y: q.y - 30, s: 0.5, o: 0 }, { t: 150, x: q.x, y: q.y, s: 1.1, o: 1 }, { t: 520, x: q.x, y: q.y + 10, s: 0.8, o: 0 }], 520); ring(q.x, q.y, "#5fe0a8", 60, 0.4, 0.9); } });
      j.at(T, () => hitAll(P));
      if ((P.diffs || []).length) K.seals(P, j, topOf(src || { x: innerWidth / 2, y: innerHeight / 2, t: innerHeight / 2, h: 0 }), P.diffs, T, 120, total);
    },
  });
  const XREG_has = (id) => SG.x.has(id) && !SG.x.get(id).match;

  /* ============ MỤC 17: MƯỢN KỸ NĂNG (Vua Thời Gian, Tướng Loạn Trí, chép kỹ năng…) ============ */
  const BW = 980; /* mỗi kỹ năng mượn ≈ 0,98 s gốc */
  SG.addX("borrow", {
    T: 620, dur: (P) => 620 + P.bw.length * BW + 260,
    match(evs) {
      const bs = evs.filter((e) => e.k === "borrow" && e.uid > 0 && C[e.id]);
      if (!bs.length) return null;
      const u = bs[0].uid, f = E.find(G, u);
      let inst = f ? f.inst : null;
      if (!inst) { try { inst = anyC(u); } catch (x) {} }
      if (!inst) return null;
      if (!realRev(E.ab(inst)) && E.REV[E.ab(inst)]) return null;
      return { inst, li: f ? f.li : -1, ev: bs[0], extra: { bw: bs.filter((e) => e.uid === u).slice(0, 4) } };
    },
    prep(P) {
      /* mỗi kỹ năng mượn: các thẻ đổi sức mạnh/năng lượng (chg) + mục tiêu của sự kiện mang as */
      for (const b of P.bw) {
        b._tg = new Map();
        for (const [u, db, dc] of b.chg || []) b._tg.set(u, { db, dc });
      }
    },
    own: (s, P) => (s.k === "up" || s.k === "down" || s.k === "cost") && !s.ong && P.bw.some((b) => b._tg.has(s.hc || s.dst)),
    run(P, j, total) {
      const a = K.srcPt(P), src = rc(mcOf(P.uid)) || P.q0 || a, isTime = P.id === "vuathoigian";
      /* đạo cụ của thẻ nguồn (Vua Thời Gian: đồng hồ mặt trời) đứng sau thẻ nguồn suốt màn */
      const dz = clamp(((P.q0 && P.q0.w) || 60) * 1.7, 90, innerWidth * 0.36);
      const dial = isTime ? pic(j, "maynuotthoigian", a.x, a.y - 8, dz, dz, "#ffe7a0", "dial") : null;
      if (dial) tl(dial, [{ t: 0, x: a.x, y: a.y, s: 0.3, o: 0, r: -60 }, { t: 300, x: a.x, y: a.y - 10, s: 1, o: 0.95, r: 0, e: "cubic-bezier(.2,.8,.3,1)" }, { t: total - 280, x: a.x, y: a.y - 10, s: 1, o: 0.95, r: 360 * P.bw.length }, { t: total, x: a.x, y: a.y, s: 0.4, o: 0, r: 360 * P.bw.length + 40 }], total);
      else { glow(a.x, a.y, P.c1, dz * 1.2, 0.5, 0.6); ring(a.x, a.y, P.c2, dz * 0.8, 0.5, 0.9); }
      sfx("whoosh");
      const all = new Map(P.owned.map((s) => [s.hc || s.dst, s]));
      P.bw.forEach((b, k) => {
        const t0 = 300 + k * BW, id = b.id, cc = cols(id).c1 || "#ffd65a";
        const fw = clamp(innerWidth * 0.2, 70, 92), side = src.x < innerWidth / 2 ? 1 : -1;
        const fx0 = clamp(src.x + side * (src.w * 0.5 + fw * 0.62), fw / 2 + 6, innerWidth - fw / 2 - 6), fy0 = clamp(src.y - src.h * 0.5, fw * 0.68 + 70, innerHeight - fw);
        /* mặt thẻ gốc hiện cạnh thẻ nguồn + tên kỹ năng */
        j.at(t0, () => {
          const f = face(j, id, a.x, a.y, fw, cc, "bw");
          tl(f, [{ t: 0, x: a.x, y: a.y, s: 0.2, o: 0, r: -20 }, { t: 220, x: fx0, y: fy0, s: 1.08, o: 1, r: side * 6, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 300, x: fx0, y: fy0, s: 1, r: side * 4 }, { t: BW - 120, x: fx0, y: fy0, s: 1, o: 1, r: side * 4 }, { t: BW, x: fx0, y: fy0 - 12, s: 0.85, o: 0, e: "ease-in" }], BW);
          ring(fx0, fy0, cc, fw * 1.1, 0.4, 0.9); glow(fx0, fy0, cc, fw * 1.6, 0.4, 0.6);
          const lab = tagEl(j, "actag bwl", fx0, fy0 + fw * 0.68 + 14, 190, 24, cc, `<b><em>KỸ NĂNG ${k + 1}</em> · ${esc(short(nmOf(id), 16))}</b>`);
          tl(lab, [{ t: 0, x: fx0, y: fy0 + fw * 0.68 + 20, s: 0.7, o: 0 }, { t: 200, x: fx0, y: fy0 + fw * 0.68 + 14, s: 1, o: 1 }, { t: BW - 120, x: fx0, y: fy0 + fw * 0.68 + 14, s: 1, o: 1 }, { t: BW, x: fx0, y: fy0 + fw * 0.68 + 8, s: 0.9, o: 0 }], BW);
          if (dial) { try { dial.animate([{ filter: "brightness(1)" }, { filter: "brightness(1.8)" }, { filter: "brightness(1)" }], { duration: 300 }); } catch (e) {} }
          sfx("chime");
          tap("borrow", { uid: P.uid, id, n: k + 1 });
        });
        /* đạo cụ riêng của thẻ gốc bay tới đúng mục tiêu của kỹ năng đó */
        const tg = [...b._tg.keys()], evT = P.evs.filter((e) => e.as === id && e.uid && e.uid !== P.uid && e.k !== "borrow").map((e) => e.uid);
        const goals = [...new Set([...tg, ...evT])].slice(0, 5);
        const pj = projOf(id);
        goals.forEach((u, i) => j.at(t0 + 380 + i * 60, () => {
          const q = posOf(u);
          if (!q) return;
          const from = { x: fx0, y: fy0 }, ps = clamp(fw * 0.9, 50, 90);
          const d = pj ? pic(j, pj, from.x, from.y, ps, ps, cc, "face") : j.add(el0("acf sm", from.x, from.y, fw * 0.5, fw * 0.68, cc, liteId(id)));
          if (d) tl(d, [{ t: 0, x: from.x, y: from.y, s: 0.5, o: 0 }, { t: 60, x: from.x, y: from.y, s: 1, o: 1 }, ...arc(from, q, 60, 60, 340, pj ? { face: 1, s0: 1, s1: 0.9, n: 10 } : { s0: 1, s1: 0.7 }), { t: 400, x: q.x, y: q.y, s: 0.5, o: 0 }], 400);
          trail(from, q, 60, 60, 340, [cc, "#ffffff"], 8);
        }));
        j.at(t0 + 740, () => {
          let i = 0;
          for (const u of goals) {
            const q = posOf(u), st = all.get(u);
            if (st) { P.hit(st); all.delete(u); }
            else { const t = b._tg.get(u), el = hcOf(u); if (t && el && !mcOf(u)) { try { if (t.db) P6.stat({ el, k: "pow", v1: parseInt((el.querySelector(".pwh") || {}).textContent, 10), v0: parseInt((el.querySelector(".pwh") || {}).textContent, 10) - t.db, uid: u, i }); if (t.dc) P6.stat({ el, k: "cost", v1: parseInt((el.querySelector(".cst") || {}).textContent, 10), v0: parseInt((el.querySelector(".cst") || {}).textContent, 10) - t.dc, uid: u, i }); } catch (e) {} } }
            if (q) { ring(q.x, q.y, cc, q.w * 1.2, 0.4, 0.95); glow(q.x, q.y, cc, q.w * 1.6, 0.35, 0.6); streaks(q.x, q.y, [cc, "#ffffff"], 10, 220, 0, 6.283, 0.4, 5); }
            i++;
          }
          if (!goals.length) { fl(fx0, fy0 - fw * 0.8, "KHÔNG CÓ MỤC TIÊU", "#cfd6ff"); }
          tap("borrow:hit", { uid: P.uid, id, n: goals.length });
        });
      });
      j.at(total - 200, () => { for (const s of all.values()) P.hit(s); });
    },
  });

  /* ============ MỤC 20: KHI BỊ TIÊU HUỶ / KHI BỊ VỨT BỎ — tăng/giảm chỉ số ============ */
  SG.addX("react", {
    T: 0, dur: (P) => 360 + P.rx.length * 820,
    match(evs, R0) {
      const rx = evs.filter((e) => e.k === "skill" && e.t === "react" && e.uid > 0 && (e.chg || []).some((x) => x[0] !== e.uid || e.w === "d"));
      const L = rx.filter((e) => (e.chg || []).length);
      if (!L.length) return null;
      let inst = null;
      try { inst = anyC(L[0].uid); } catch (x) {}
      if (!inst) return null;
      return { inst, li: -1, ev: L[0], extra: { rx: L.slice(0, 4) } };
    },
    prep(P) {
      for (const e of P.rx) { e._tg = new Map(); for (const [u, db, dc] of e.chg || []) if (u !== e.uid || mcOf(u)) e._tg.set(u, { db, dc }); }
      P.rx = P.rx.filter((e) => e._tg.size);
      if (!P.rx.length) return false;
    },
    late(P) {
      /* vứt bỏ: chờ lá bay vào Mộ (mục 4); tiêu huỷ: chờ nhát huỷ trúng (P.delay do lịch dời) */
      const la = Math.max(0, ...P.rx.map((e) => DS.landIn(e.uid)));
      if (la > 0) P.delay = Math.max(P.delay || 0, la + 80);
      /* gpu71: tiêu huỷ -> phản ứng chỉ hiện SAU khi lá đã vỡ (màn huỷ 19-mo: nứt -> vỡ) */
      try {
        for (const e of P.rx) {
          if (e.w === "x" || e.z === "disc" || !window.MO) continue;
          const k = STEPS12.find((s) => s.k === "kill" && s.dst === e.uid);
          P.delay = Math.max(P.delay || 0, (k ? (k.t0 || 0) + T8.LIFT + T8.FLY : 0) + MO.T.END);
        }
      } catch (x) {}
    },
    own: (s, P) => (s.k === "up" || s.k === "down" || s.k === "cost") && !s.ong && P.rx.some((e) => e._tg.has(s.hc || s.dst)),
    run(P, j, total) {
      const all = new Map(P.owned.map((s) => [s.hc || s.dst, s]));
      P.rx.forEach((e, k) => {
        const t0 = k * 820, id = e.id || (anyC(e.uid) || {}).id, cc = cols(id).c1 || "#ffd65a", disc = e.w === "x" || e.z === "disc";
        const r0 = P.R0 && P.R0.get(e.uid), pile = PILEPT();
        const o = disc ? { x: pile.x, y: pile.y - 40, w: 60, h: 82 } : r0 ? { x: r0.x, y: r0.y, w: r0.w, h: r0.h } : (posOf(e.uid) || { x: innerWidth / 2, y: innerHeight / 2, w: 60, h: 82 });
        const fw = clamp((o.w || 60), 56, 84);
        /* hồn thẻ (mặt thẻ mờ) hiện ở chỗ cũ / nổi lên từ Mộ + nhãn "KHI BỊ TIÊU HUỶ / VỨT BỎ" */
        j.at(t0, () => {
          const f = face(j, id, o.x, o.y, fw, cc, "ghost");
          tl(f, [{ t: 0, x: o.x, y: o.y + (disc ? 30 : 0), s: 0.6, o: 0 }, { t: 220, x: o.x, y: o.y, s: 1.05, o: 0.85, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 600, x: o.x, y: o.y - 6, s: 1, o: 0.85 }, { t: 820, x: o.x, y: o.y - 20, s: 0.9, o: 0 }], 820);
          glow(o.x, o.y, cc, fw * 1.8, 0.5, 0.6); ring(o.x, o.y, cc, fw * 1.2, 0.45, 0.9);
          const lab = tagEl(j, "actag", o.x, o.y - fw * 0.68 - 16, 180, 24, cc, `<b><em>${disc ? "KHI BỊ VỨT BỎ" : "KHI BỊ TIÊU HUỶ"}</em> · ${esc(short(nmOf(id), 14))}</b>`);
          const ly = clamp(o.y - fw * 0.68 - 16, 60, innerHeight - 30);
          tl(lab, [{ t: 0, x: o.x, y: ly + 6, s: 0.7, o: 0 }, { t: 200, x: o.x, y: ly, s: 1, o: 1 }, { t: 700, x: o.x, y: ly, s: 1, o: 1 }, { t: 820, x: o.x, y: ly - 8, s: 0.9, o: 0 }], 820);
          sfx("chime");
          tap("react", { uid: e.uid, id, w: e.w });
        });
        const pj = projOf(id), goals = [...e._tg.keys()].slice(0, 7);
        goals.forEach((u, i) => j.at(t0 + 260 + i * 50, () => {
          const q = posOf(u);
          if (!q) return;
          const ps = clamp(fw * 0.85, 46, 80);
          const d = pj ? pic(j, pj, o.x, o.y, ps, ps, cc, "face") : null;
          if (d) tl(d, [{ t: 0, x: o.x, y: o.y, s: 0.5, o: 0 }, { t: 60, x: o.x, y: o.y, s: 1, o: 1 }, ...arc(o, q, 50, 60, 320, { face: 1, s0: 1, s1: 0.85, n: 10 }), { t: 380, x: q.x, y: q.y, s: 0.5, o: 0 }], 380);
          trail(o, q, 50, 60, 320, [cc, "#ffffff"], 7);
        }));
        j.at(t0 + 600, () => {
          let i = 0;
          for (const u of goals) {
            const q = posOf(u), st = all.get(u), t = e._tg.get(u);
            if (st) { P.hit(st); all.delete(u); }
            else { const el = hcOf(u); if (t && el && !mcOf(u)) { try { if (t.db) P6.stat({ el, k: "pow", v1: parseInt((el.querySelector(".pwh") || {}).textContent, 10), v0: parseInt((el.querySelector(".pwh") || {}).textContent, 10) - t.db, uid: u, i }); if (t.dc) P6.stat({ el, k: "cost", v1: parseInt((el.querySelector(".cst") || {}).textContent, 10), v0: parseInt((el.querySelector(".cst") || {}).textContent, 10) - t.dc, uid: u, i }); } catch (x) {} } }
            const good = t && (t.db > 0 || t.dc < 0), col = good ? "#5dffa8" : "#ff6b86";
            if (q) { ring(q.x, q.y, col, q.w * 1.2, 0.4, 0.95); glow(q.x, q.y, cc, q.w * 1.5, 0.35, 0.6); streaks(q.x, q.y, [cc, col, "#ffffff"], 10, 220, 0, 6.283, 0.4, 5); }
            i++;
          }
          tap("react:hit", { uid: e.uid, n: goals.length });
        });
      });
      j.at(total - 100, () => { for (const s of all.values()) P.hit(s); });
    },
  });

  /* ============ MỤC 15: ĐẶT THẺ TỪ TAY LÊN BÀN ============ */
  const fromHand = (uid) => { const S = SNX; if (!S || S.G !== G) return null; for (const sd of E.SIDES) if (S.hand[sd] && S.hand[sd].has(uid)) return sd; return null; };
  {
    const r8 = run8;
    run8 = function (s) {
      try {
        if (s && !s.sigOwn && on() && s.k === "summon" && !DS.owns(s.dst)) { const sd = fromHand(s.dst); if (sd) { handPlace(s, sd); return; } }
        if (s && !s.sigOwn && DS.ownStep(s)) return;
      } catch (e) { console.error(e); }
      return r8.apply(this, arguments);
    };
    const p8 = post8;
    post8 = function (s) { if (s && s._dsHold && !s._dsDone) { s._dsPost = 1; return; } return p8.apply(this, arguments); };
    AC._post8 = p8;
  }
  function handPlace(s, sd) {
    const tp = s.tp, H0 = (CUR && CUR.evs && CUR.evs._hand0) || HAND0, fr = sd === "p" ? H0.get(s.dst) || zpt("hand") : zpt("avFoe");
    const c = anyC(s.dst), id = c ? c.id : null, col = (id && cols(id).c1) || "#8fdc4a";
    s._ran = 1;
    if (!fr || !tp || !id) { hit8(s); return; }
    const w = tp.w || 52, h = tp.h || 70, g = ghost({ x: tp.x, y: tp.y, w, h }, sd === "p" ? (fr.html || liteId(id)) : liteId(id), "fxchip acgh");
    const s0 = (fr.w || 46) / w, dx = fr.x - tp.x, dy = fr.y - tp.y, L = T8.LIFT + T8.FLY, flip = sd !== "p";
    tap("handPlace", { uid: s.dst, side: sd });
    /* lá nhấc khỏi tay (nảy lên), bay vòng cung lên bàn, đáp ô */
    g.animate([{ transform: `translate(${dx}px,${dy}px) scale(${s0})`, opacity: 1 }, { transform: `translate(${dx}px,${dy - 26}px) scale(${s0 * 1.15}) rotate(-4deg)${flip ? " rotateY(90deg)" : ""}`, opacity: 1, offset: 0.28 }, { transform: `translate(${dx * 0.45}px,${dy * 0.45 - 60}px) scale(${(s0 + 1) / 2 * 1.08}) rotate(4deg)`, opacity: 1, offset: 0.7 }, { transform: "translate(0,0) scale(1)", opacity: 1 }], { duration: L, easing: "cubic-bezier(.4,0,.3,1)", fill: "both" });
    fxT(() => { glow(fr.x, fr.y - 20, col, (fr.w || 46) * 1.6, 0.35, 0.6); ring(fr.x, fr.y, col, (fr.w || 46) * 1.1, 0.35, 0.8); }, 0);
    trail(fr, tp, 60, T8.LIFT, L, [col, "#ffffff"], 8);
    const lab = sd === "p" ? "TỪ TAY LÊN BÀN" : "TỪ TAY ĐỐI THỦ";
    fxT(() => {
      g.remove();
      try { hit8(s); } catch (e) { console.error(e); }
      ring(tp.x, tp.y, col, w * 1.25, 0.4, 0.95);
      try { FX.dust(tp.x, tp.y + h * 0.45, "#d8c8a0"); } catch (e) {}
      try { say(tp.x, sy8(tp), lab, "#c8ff9a"); } catch (e) {}
      tap("handPlace:land", { uid: s.dst });
    }, L);
    fxT(() => g.remove(), L + 400);
  }
  /* sao chép một lá trên tay lên bàn: lá gốc nảy + nhân đôi tại chỗ, bản sao tách ra bay đi, lá gốc ở lại */
  {
    const c7 = clone7;
    clone7 = function (fp, tp, html, dl) {
      try {
        const H0 = (CUR && CUR.evs && CUR.evs._hand0) || HAND0;
        let hu = 0;
        for (const [u, r] of H0) if (Math.abs(r.x - fp.x) < 2 && Math.abs(r.y - fp.y) < 2) { hu = u; break; }
        if (hu && on()) {
          const el = hcOf(hu);
          fxT(() => { if (el) try { el.animate([{ transform: "none", filter: "none" }, { transform: "translateY(-14px) scale(1.12)", filter: "brightness(1.7)", offset: 0.4 }, { transform: "none", filter: "none" }], { duration: 520, composite: "add" }); } catch (e) {} ring(fp.x, fp.y, "#7fe0ff", (fp.w || 46) * 1.2, 0.4, 0.9); try { say(fp.x, fp.y - (fp.h || 64) * 0.7, "BẢN SAO", "#bff4ff"); } catch (e) {} }, dl || 0);
          tap("handCopy", { uid: hu });
        }
      } catch (e) { console.error(e); }
      return c7.apply(this, arguments);
    };
  }

  /* ============ MỤC 4: VỨT BỎ — nhấc khỏi tay -> cháy -> hồn vào Mộ -> phản ứng ============ */
  const DS = { P: null, jobs: new Set() };
  AC.DS = DS;
  /* lập kế hoạch khi bước bắt đầu (plan8): lá bị vứt, phản ứng của từng lá (về tay, bản sao, tới chiến địa) */
  DS.plan = function (cur) {
    DS.P = null;
    if (reduced || !on()) return;
    const evs = cur.evs, ds = evs.filter((e) => e.k === "discard" && e.uid > 0);
    if (!ds.length && !PILE0.size) return;
    const P = { list: ds, own: new Set(), seg: new Map(), land: new Map(), t0: 0, steps: new Map(), ret: [] };
    let curU = 0;
    for (const e of evs) {
      if (e.k === "discard") { curU = e.uid; if (!P.seg.has(curU)) P.seg.set(curU, { e, rx: null, evs: [] }); continue; }
      if (e.k === "skill" && e.t === "react" && (e.w === "x" || e.z === "disc")) { curU = e.uid; const g = P.seg.get(curU); if (g) g.rx = e; continue; }
      if (e.k === "skill") { curU = 0; continue; }
      if (curU && P.seg.has(curU)) P.seg.get(curU).evs.push(e);
    }
    for (const [u, g] of P.seg) {
      g.hand = []; g.board = []; g.self = null;
      for (const e of g.evs) {
        if (e.k === "tohand" && e.uid) { if (e.uid === u) g.self = "hand"; else g.hand.push(e.uid); }
        else if ((e.k === "summon" || e.k === "revive") && e.uid) { if (e.uid === u) g.self = "board"; else g.board.push(e.uid); }
      }
      for (const x of [u, ...g.hand, ...g.board]) P.own.add(x);
    }
    /* lá trở lại từ Mộ do thẻ khác (Ma Tốc, U Minh Hậu, Yêu Hậu, Hoả Sứ…): bay từ Mộ ra */
    for (const e of evs) {
      if (!(e.uid > 0) || P.own.has(e.uid) || !PILE0.has(e.uid)) continue;
      if (e.k === "tohand") { P.ret.push({ uid: e.uid, to: "hand", src: e.src }); P.own.add(e.uid); }
      else if (e.k === "revive" || e.k === "summon") { P.ret.push({ uid: e.uid, to: "board", src: e.src }); P.own.add(e.uid); }
    }
    /* gpu71: mốc đáp của lá từ Mộ ra bàn (runRet) -> MO.gate (19-mo.js) dời kỹ năng của chính lá đó tới sau khi lá đáp */
    P.ret.slice(0, 8).forEach((r, k) => { if (r.to === "board") P.land.set(r.uid, 300 + k * 120 + DT.BACK); });
    if (!P.own.size && !ds.some((e) => P.seg.get(e.uid) && P.seg.get(e.uid).rx)) return;
    DS.P = P;
    { const gap = ds.length > 4 ? Math.round(DT.GAP * 0.7) : DT.GAP; ds.slice(0, 7).forEach((e, i) => P.land.set(e.uid, DT.LIFT + DT.READ + i * gap + DT.BURN + DT.SOUL)); }
    /* lá trên tay sẽ xuất hiện khi lá từ Mộ bay tới: ẩn ngay; lá trên bàn: ẩn tới lúc đáp */
    for (const u of P.own) { const c = anyC(u); if (!c) continue; if (G.hand[c.side || c.own] && G.hand[c.side || c.own].includes(c)) hideHand(u); else if (E.find(G, u)) hideBoard(u); }
    P.t0 = performance.now();
    tap("disc:plan", { n: ds.length, own: P.own.size, ret: P.ret.length });
  };
  /* Mộ trước bước (snapX): uid của lá trong disc/dead */
  let PILE0 = new Set();
  {
    const sx1 = snapX;
    snapX = function () { const r = sx1.apply(this, arguments); try { PILE0 = new Set(); if (G) for (const sd of E.SIDES) for (const k of ["disc", "dead"]) for (const c of G[k][sd] || []) PILE0.add(c.uid); } catch (e) {} return r; };
  }
  DS.owns = (u) => !!(DS.P && DS.P.own.has(u));
  DS.landIn = (u) => { const P = DS.P; if (!P || !P.land.has(u)) return 0; const tb = P.tb || P.tbx || performance.now(); return Math.max(0, P.land.get(u) - (performance.now() - tb) / SPD); };
  /* bước plan8 thuộc phần diễn vứt bỏ: giữ lại, phần diễn tự đánh trúng */
  DS.ownStep = function (s) {
    const P = DS.P;
    if (!P || !s || !P.own.has(s.dst)) return false;
    if (s.k === "summon" || s.k === "ult29" || s.k === "bounce") { s._ran = 1; s._dsHold = 1; P.steps.set(s.dst + ":" + s.k, s); if (P.go) P.go(); return true; }
    return false;
  };
  /* hồi sinh lá vứt bỏ: phần diễn vứt bỏ tự vẽ (không loé hồi sinh mặc định) */
  try { const or0 = HXG.ownRev; HXG.ownRev = (ev) => DS.owns(ev.uid) || or0(ev); } catch (e) {}
  /* lá do phản ứng đưa vào tay (bản sao Bầy Ong, Thuyền Mây…): không diễn "tạo thẻ" mặc định */
  {
    const f7 = fx7;
    fx7 = function (evs, R0, P0) {
      const P = DS.P, X = evs && evs.x7;
      let hn = null;
      if (P && X && X.hnew) { hn = { p: X.hnew.p, a: X.hnew.a }; X.hnew.p = (hn.p || []).filter((u) => !P.own.has(u)); X.hnew.a = (hn.a || []).filter((u) => !P.own.has(u)); }
      try { return f7.apply(this, arguments); } finally { if (hn) { X.hnew.p = hn.p; X.hnew.a = hn.a; } if (P && !P.ran && P.ret.length) { try { runRet(P); } catch (e) { console.error(e); } } }
    };
  }
  /* --- nhịp chính --- */
  /* gpu71 (làn D): lá bị vứt bay ra GIỮA MÀN, PHÓNG LỚN (mặt thẻ nguyên vẹn, đọc được) trên nền tối nhẹ; nhiều lá -> một hàng/quạt gọn ở giữa
     (cả hai phe: hàng đối thủ phía trên, hàng mình phía dưới). Đứng yên READ để đọc, rồi TỪNG LÁ một cháy (GAP giữa hai lá) -> hồn vào Mộ -> phản ứng.
     Mỗi lá có tiếng riêng theo lá (SFX.mo "v": tiếng riêng thẻ > hệ của lá). */
  const DT = { LIFT: 380, READ: 900, GAP: 300, BURN: 320, SOUL: 460, BACK: 520 };
  AC.DT = DT;
  /* bố cục hàng giữa màn: trả { Wc, Hc, pos(side,k,cnt) -> {x,y,rot} } */
  function discLay(ns, nf) {
    const VW = innerWidth, VH = innerHeight, two = ns > 0 && nf > 0, m = Math.max(ns, nf, 1);
    const maxH = two ? VH * 0.27 : VH * 0.4, room = VW - 20;
    /* hàng thẳng không chồng nếu mỗi lá vẫn rộng >= 92 px (tới 4 lá trên máy 430 px); nhiều hơn -> quạt chồng mép */
    const row = room / (m * 0.98);
    let Wc = m <= 1 ? Math.min(VW * 0.52, 230) : row >= 92 ? row : room / (1 + (m - 1) * 0.6);
    Wc = Math.round(clamp(Math.min(Wc, maxH / 1.36, 230), two ? 84 : 92, 230));
    const Hc = Math.round(Wc * 1.36), cy = clamp(VH * 0.46, Hc / 2 + 70, VH - Hc / 2 - 40);
    const yOf = (side) => (two ? (side === "p" ? cy + Hc * 0.55 : cy - Hc * 0.55) : cy);
    const pos = (side, k, cnt) => {
      const step = cnt > 1 ? Math.min(Wc * 1.02, (room - Wc) / (cnt - 1)) : 0, span = step * (cnt - 1), mid = (cnt - 1) / 2, fan = step < Wc * 0.9;
      const x = clamp(VW / 2 - span / 2 + step * k, Wc / 2 + 6, VW - Wc / 2 - 6);
      const rot = fan ? (k - mid) * Math.min(6, 24 / cnt) : 0;
      return { x, y: yOf(side) + (fan ? Math.pow(k - mid, 2) * 2.2 : 0), rot };
    };
    return { Wc, Hc, pos, yOf, two };
  }
  AC.discLay = discLay;
  function discardBeat2(list, hMap, srcUid) {
    if (reduced || !list.length || !on()) return DB0.apply(this, arguments);
    const P = DS.P && DS.P.list.includes(list[0]) ? DS.P : { list, own: new Set(), seg: new Map(), land: new Map(), steps: new Map(), ret: [] };
    P.ran = 1; P.tb = performance.now();
    const n = list.length, show = list.slice(0, 7), gap = n > 4 ? Math.round(DT.GAP * 0.7) : DT.GAP;
    const ns = show.filter((e) => e.side === "p").length, nf = show.length - ns, LY = discLay(ns, nf), Wc = LY.Wc, Hc = LY.Hc;
    const pile = PILEPT(), src = srcUid ? where7(srcUid, null, null) : null, sc = srcUid ? (window.FXR ? FXR.c1(srcUid, "#ff9a4d") : "#ff9a4d") : "#ff9a4d";
    const tRead = DT.LIFT + DT.READ, tLast = tRead + (show.length - 1) * gap;
    const j = job(tLast + DT.BURN + DT.SOUL + 6000);
    DS.jobs.add(j);
    j.onEnd((fast) => { DS.jobs.delete(j); if (fast) dsFinish(P); });
    if (src) { try { lit7(src, sc, srcUid); } catch (e) {} }
    /* nền tối nhẹ sau hàng lá phóng lớn (tắt dần khi lá cuối cháy) */
    const dim = j.add(document.createElement("div"));
    dim.className = "mo-dim";
    document.body.appendChild(dim);
    dim.animate([{ opacity: 0 }, { opacity: 1, offset: DT.LIFT / (tLast + DT.BURN) }, { opacity: 1, offset: tLast / (tLast + DT.BURN) }, { opacity: 0 }], { duration: (tLast + DT.BURN) * SPD, fill: "forwards" });
    /* nhãn đầu nhịp: trên hàng lá trên cùng */
    const sn = srcUid ? nmOf((anyC(srcUid) || {}).id) : "";
    const topY = Math.min(LY.yOf(nf ? "a" : "p")) - Hc / 2 - 22;
    const hd = tagEl(j, "actag dch", innerWidth / 2, topY, 220, 26, "#ff9a4d", `<b><em>VỨT BỎ${n > 1 ? " ×" + n : ""}</em>${sn ? " · " + esc(short(sn, 16)) : ""}</b>`);
    tl(hd, [{ t: 0, x: innerWidth / 2, y: topY + 8, s: 0.7, o: 0 }, { t: 200, x: innerWidth / 2, y: topY, s: 1, o: 1 }, { t: tLast + 300, x: innerWidth / 2, y: topY, s: 1, o: 1 }, { t: tLast + 500, x: innerWidth / 2, y: topY - 8, s: 0.9, o: 0 }], tLast + 500);
    let im = 0, ifo = 0;
    show.forEach((e, i) => {
      const mine = e.side === "p", k = mine ? im++ : ifo++, cnt = mine ? ns : nf;
      const q = LY.pos(e.side, k, cnt), x = q.x, y = q.y, rot = q.rot;
      const fr = (mine && hMap && hMap.get(e.uid)) || (mine ? zpt("hand") : zpt("avFoe") || zpt("oppSub")) || { x, y: y + 80, w: 46 };
      const g = j.add(ghost({ x, y, w: Wc, h: Hc }, liteId(e.id), "acd"));
      g.style.opacity = "0";
      g.style.zIndex = String(41 + i);
      const s0 = Math.min(1, (fr.w || 46) / Wc), dx = fr.x - x, dy = fr.y - y;
      const c1 = cols(e.id).c1 || "#ff9a4d", g0 = P.seg.get(e.uid), rx = !!(g0 && g0.rx);
      htap("HX04", { uid: e.uid, id: e.id, side: e.side });
      tap("disc", { uid: e.uid, id: e.id, side: e.side, rx: rx ? 1 : 0, w: Wc, x: Math.round(x), y: Math.round(y) });
      const go = () => {
        if (j.dead) return;
        g.style.opacity = "";
        g.animate([{ transform: `translate(${dx}px,${dy}px) scale(${s0})${mine ? "" : " rotateY(90deg)"}`, opacity: 0.6 }, { transform: `translate(0,-8px) scale(1.06) rotate(${rot}deg)`, opacity: 1, offset: 0.7 }, { transform: `rotate(${rot}deg)`, opacity: 1 }], { duration: DT.LIFT * SPD, delay: i * 60 * SPD, easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" });
      };
      requestAnimationFrame(go);
      j.at(DT.LIFT + i * 60 + 90, () => { glow(x, y, c1, Wc * 1.4, 0.4, 0.45); tap("disc:big", { uid: e.uid, w: Math.round(g.getBoundingClientRect().width) }); });
      const tb = tRead + i * gap;
      /* phản ứng (Khi Bị Vứt Bỏ): ấn phản ứng loé trên lá trước khi cháy */
      if (rx) j.at(tb - 200, () => { ring(x, y, c1, Wc * 1.25, 0.45, 0.95); glow(x, y, c1, Wc * 1.8, 0.45, 0.7); const t = tagEl(j, "actag sm", x, y + Hc / 2 + 14, 130, 20, c1, `<b><em>KHI BỊ VỨT BỎ</em></b>`); tl(t, [{ t: 0, x, y: y + Hc / 2 + 18, s: 0.7, o: 0 }, { t: 160, x, y: y + Hc / 2 + 14, s: 1, o: 1 }, { t: 700, x, y: y + Hc / 2 + 14, s: 1, o: 1 }, { t: 860, x, y: y + Hc / 2 + 8, s: 0.9, o: 0 }], 860); });
      j.at(tb, () => burnCard(j, g, e, x, y, Wc, Hc, rot, mine, rx ? c1 : null, pile));
      const land = tb + DT.BURN + DT.SOUL;
      P.land.set(e.uid, land);
      j.at(land, () => {
        ring(pile.x, pile.y, rx ? c1 : "#9a46ff", 50, 0.42, 0.9);
        glow(pile.x, pile.y, rx ? c1 : "#9a46ff", 80, 0.4, 0.6);
        try { pulse("#btnPiles", [{ transform: "scale(1.25)" }, { transform: "scale(1)" }], 300); } catch (er) {}
        htap("HX04:grave", { uid: e.uid });
        tap("disc:grave", { uid: e.uid });
        if (g0) rebound(P, j, e, g0, pile);
      });
    });
    const tEnd = tLast + DT.BURN + DT.SOUL + (P.seg.size ? DT.BACK + 500 : 200);
    live(tEnd + 200);
    try { FX_UNTIL = Math.max(FX_UNTIL || 0, performance.now() + (tEnd + 200) * SPD); } catch (e) {}
    j.at(tEnd, () => { dsFinish(P); j.fin(false); });
    /* bước plan8 bị giữ (triệu hồi lá vứt bỏ) đến sau -> rebound gọi lại */
    P.go = null;
  }
  /* cháy từ dưới lên (bitmap đúng khung), tàn lửa; hồn (ảnh nhân vật) bay vào Mộ */
  function burnCard(j, g, e, x, y, w, h, rot, mine, rc1, pile) {
    const HK = W.HXG && HXG.kit;
    const card = g.firstElementChild, art = g.querySelector("img.art");
    let so = null;
    if (HK && !lite()) {
      let bmp = HK.cardBmp(card) || HK.frameBmp(e.id, w, h, false);
      /* gpu71: lá phóng lớn -> cháy trên bitmap nửa độ phân giải (tính theo điểm ảnh mỗi khung: nhẹ hơn 4×, nhìn không khác) */
      if (bmp && bmp.width > 260) { const c2 = document.createElement("canvas"); c2.width = Math.round(bmp.width / 2); c2.height = Math.round(bmp.height / 2); c2.getContext("2d").drawImage(bmp, 0, 0, c2.width, c2.height); bmp = c2; }
      if (art && art.complete && art.naturalWidth) {
        so = HK.soulFrom(art, rc1 || cols(e.id).c1);
        if (so) { j.add(so.d); so.d.style.opacity = "0"; so.d.animate([{ transform: "none", opacity: 0 }, { transform: "translate(-4px,-22px) rotate(-5deg) scale(1.1)", opacity: 1, offset: 0.5 }, { transform: "translate(-8px,-34px) rotate(-7deg) scale(1.14)", opacity: 1 }], { duration: 300, easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" }); }
      }
      g.style.visibility = "hidden";
      if (bmp) HK.dissolve(bmp, x, y, w, h, { rot: (rot * Math.PI) / 180, life: 0.7, upd: (p, dt, u) => { if (u > 0.04 && u < 0.92 && Math.random() < 0.7) E6({ x: x + rnd(-w / 2, w / 2), y: y + h / 2 - u * h * 1.05, vx: rnd(-20, 20), vy: rnd(-120, -50), c: ["#ff6a1f", "#ffd27a", "#ff3a00"][(Math.random() * 3) | 0], kind: 0, s0: rnd(5, 10), s1: 1, drag: 0.5, dur: rnd(0.35, 0.6), a: 0.9 }); } });
    } else {
      try { g.animate([{ opacity: 1, filter: "brightness(1)" }, { opacity: 0, filter: "brightness(2.2) sepia(1)", transform: `translateY(-20px) rotate(${rot}deg) scale(.9)` }], { duration: DT.BURN + 200, fill: "forwards" }); } catch (x) {}
      try { FX.ash(x, y, 10); } catch (x) {}
    }
    glow(x, y, "#ff6a1f", w * 2, 0.8, 0.45);
    try { if (window.MO) MO.snd("v", e.id, elOf(e.id)); else SFX.fam("discard", { el: elOf(e.id) }); } catch (er) {} /* gpu71: tiếng riêng theo lá bị vứt */
    htap("HX04:burn", { uid: e.uid });
    j.at(jnow(j) + DT.BURN, () => {
      const from = so ? { x: so.x, y: so.y - 34 } : { x, y: y - 20 };
      const dx = pile.x - from.x, dy = pile.y - from.y, c = rc1 || "#b98aff";
      if (so) {
        const a = so.d.animate([{ transform: "translate(-8px,-34px) rotate(-7deg) scale(1.14)", opacity: 1 }, { transform: `translate(${(dx * 0.45).toFixed(1)}px,${(dy * 0.45 - 50).toFixed(1)}px) rotate(${dx < 0 ? -14 : 14}deg) scale(.75)`, opacity: 0.95, offset: 0.5 }, { transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(.25)`, opacity: 0 }], { duration: DT.SOUL, easing: "cubic-bezier(.45,0,.4,1)", fill: "both" });
        a.onfinish = () => so.d.remove();
      }
      trail(from, pile, 60, 0, DT.SOUL, [c, "#ffffff"], 8);
    });
  }
  /* phản ứng sau khi lá vào Mộ */
  function rebound(P, j, e, g0, pile) {
    const t0 = jnow(j), id = e.id, c1 = cols(id).c1 || "#ffd65a", rx = g0.rx, chg = new Map(((rx && rx.chg) || []).map((x) => [x[0], x]));
    const fw = Math.round(clamp(innerWidth * 0.18, 60, 84));
    const flyOut = (u, to, k) => {
      const cid = (anyC(u) || {}).id || id;
      const mineH = to === "hand";
      j.at(t0 + 120 + k * 90, () => {
        const tq = mineH ? rc(hcOf(u)) || zpt("hand") : rc(mcOf(u));
        if (!tq) { if (mineH) showHand(u, c1); else showBoard(u); return; }
        /* gpu71: lá từ Mộ ra chiến địa MỌC LÊN tại ô (không bay từ chồng Mộ) */
        if (!mineH && window.MO && MO.rise) { showBoard(u); MO.rise(u, { from: "grave", src: e.uid }); tap("disc:back", { uid: u, to }); j.at(jnow(j) + MO.RISE * 0.8, () => { landBoard(P, u, c1); tap("disc:land", { uid: u, to }); }); return; }
        const f = face(j, cid, pile.x, pile.y, fw, c1, "reb");
        const s1 = (tq.w || fw) / fw;
        tl(f, [{ t: 0, x: pile.x, y: pile.y, s: 0.25, o: 0 }, { t: 160, x: pile.x, y: pile.y - 40, s: 1.05, o: 1, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 220, x: pile.x, y: pile.y - 44, s: 1 }, ...arc({ x: pile.x, y: pile.y - 44 }, tq, 80, 220, DT.BACK, { s0: 1, s1, r0: -6, r1: 0 }), { t: DT.BACK + 40, x: tq.x, y: tq.y, s: s1, o: 0 }], DT.BACK + 40);
        glow(pile.x, pile.y - 30, c1, 90, 0.4, 0.7); ring(pile.x, pile.y - 30, c1, 60, 0.4, 0.9);
        trail({ x: pile.x, y: pile.y - 44 }, tq, 80, 220, DT.BACK, [c1, "#ffffff"], 8);
        tap("disc:back", { uid: u, to });
        j.at(jnow(j) + DT.BACK, () => {
          if (mineH) {
            showHand(u, c1);
            const x = chg.get(u), el = hcOf(u);
            if (x && el) { try { if (x[1]) P6.stat({ el, k: "pow", v1: parseInt((el.querySelector(".pwh") || {}).textContent, 10), v0: parseInt((el.querySelector(".pwh") || {}).textContent, 10) - x[1], uid: u }); if (x[2]) P6.stat({ el, k: "cost", v1: parseInt((el.querySelector(".cst") || {}).textContent, 10), v0: parseInt((el.querySelector(".cst") || {}).textContent, 10) - x[2], uid: u, i: 1 }); } catch (er) {} }
            try { say(tq.x, tq.y - (tq.h || 70) * 0.7, u === e.uid ? "TRỞ LẠI TAY" : "+1 THẺ", "#ffd6f0"); } catch (er) {}
          } else {
            showBoard(u);
            landBoard(P, u, c1);
          }
          tap("disc:land", { uid: u, to });
        });
      });
    };
    let k = 0;
    if (g0.self) flyOut(e.uid, g0.self, k++);
    for (const u of g0.hand) flyOut(u, "hand", k++);
    for (const u of g0.board) flyOut(u, "board", k++);
  }
  function landBoard(P, u, c1) {
    const q = rc(mcOf(u));
    if (q) { ring(q.x, q.y, c1, q.w * 1.3, 0.45, 0.95); glow(q.x, q.y, c1, q.w * 1.8, 0.4, 0.6); try { FX.dust(q.x, q.y + q.h * 0.45, "#d8c8a0"); } catch (e) {} P6.kit.shake(3, 0, 1); }
    for (const k of ["summon", "bounce"]) { const s = P.steps.get(u + ":" + k); if (s) { s._dsDone = 1; try { q8(s, () => hit8(s)); } catch (e) {} if (s._dsPost) try { AC._post8(s); } catch (e) {} } }
    const ul = P.steps.get(u + ":ult29");
    if (ul) { ul._dsDone = 1; try { ultShow(ul.inst, null, ul.nth); } catch (e) {} }
  }
  /* lá trở lại từ Mộ do thẻ khác (Ma Tốc, U Minh Hậu, Yêu Hậu…) */
  function runRet(P) {
    P.ran = 1; P.tb = performance.now();
    const pile = PILEPT(), L = P.ret.slice(0, 8);
    const j = job(600 + L.length * 120 + DT.BACK + 4000);
    DS.jobs.add(j);
    j.onEnd((fast) => { DS.jobs.delete(j); if (fast) dsFinish(P); });
    const s0 = L[0] && L[0].src ? where7(L[0].src, null, null) : null;
    if (s0) { beam(s0.x, s0.y, pile.x, pile.y, "#b98aff", 6, 0.35); glow(pile.x, pile.y, "#b98aff", 90, 0.5, 0.7); }
    ring(pile.x, pile.y, "#b98aff", 60, 0.5, 0.9);
    try { pulse("#btnPiles", [{ transform: "scale(1.3)" }, { transform: "scale(1)" }], 360); } catch (e) {}
    const lab = tagEl(j, "actag", pile.x, pile.y - 70, 170, 24, "#b98aff", `<b><em>TỪ MỘ</em> · ${L.length} THẺ</b>`);
    const lx = clamp(pile.x, 90, innerWidth - 90);
    tl(lab, [{ t: 0, x: lx, y: pile.y - 60, s: 0.7, o: 0 }, { t: 200, x: lx, y: pile.y - 70, s: 1, o: 1 }, { t: 900, x: lx, y: pile.y - 70, s: 1, o: 1 }, { t: 1100, x: lx, y: pile.y - 78, s: 0.9, o: 0 }], 1100);
    tap("disc:ret", { n: L.length });
    const fw = Math.round(clamp(innerWidth * 0.18, 60, 84));
    L.forEach((r, k) => j.at(300 + k * 120, () => {
      const u = r.uid, c = anyC(u), id = c ? c.id : null, c1 = (id && cols(id).c1) || "#b98aff";
      const tq = r.to === "hand" ? rc(hcOf(u)) || zpt("hand") : rc(mcOf(u));
      if (!tq || !id) { if (r.to === "hand") showHand(u); else showBoard(u); return; }
      if (r.to !== "hand" && window.MO && MO.rise) { showBoard(u); MO.rise(u, { from: "grave", src: r.src, foe: c && c.own !== c.side }); j.at(jnow(j) + MO.RISE * 0.8, () => { landBoard(P, u, c1); tap("disc:land", { uid: u, to: r.to }); }); return; }
      const f = face(j, id, pile.x, pile.y, fw, c1, "reb"), s1 = (tq.w || fw) / fw;
      tl(f, [{ t: 0, x: pile.x, y: pile.y, s: 0.25, o: 0 }, { t: 160, x: pile.x, y: pile.y - 40, s: 1.05, o: 1, e: "cubic-bezier(.2,.8,.3,1)" }, ...arc({ x: pile.x, y: pile.y - 40 }, tq, 80, 200, DT.BACK, { s0: 1, s1 }), { t: DT.BACK + 40, x: tq.x, y: tq.y, s: s1, o: 0 }], DT.BACK + 40);
      trail({ x: pile.x, y: pile.y - 40 }, tq, 80, 200, DT.BACK, [c1, "#ffffff"], 8);
      j.at(jnow(j) + DT.BACK, () => {
        if (r.to === "hand") { showHand(u, c1); try { say(tq.x, tq.y - (tq.h || 70) * 0.7, "TỪ MỘ VỀ TAY", "#e3ccff"); } catch (e) {} }
        else { showBoard(u); landBoard(P, u, c1); }
        tap("disc:land", { uid: u, to: r.to });
      });
    }));
    const tEnd = 300 + L.length * 120 + DT.BACK + 200;
    live(tEnd + 100);
    j.at(tEnd, () => { dsFinish(P); j.fin(false); });
  }
  function dsFinish(P) {
    if (P.fin) return;
    P.fin = 1;
    for (const u of P.own) { showHand(u); showBoard(u); }
    for (const [k, s] of P.steps) {
      if (s._dsDone) continue;
      s._dsDone = 1;
      if (s.k === "ult29") continue;
      try { q8(s, () => hit8(s)); } catch (e) {}
      if (s._dsPost) try { AC._post8(s); } catch (e) {}
    }
    if (DS.P === P) DS.P = null;
    tap("disc:end", {});
  }
  const DB0 = discardBeat;
  discardBeat = discardBeat2;
  AC.discardBeat = discardBeat2;

  /* ---------- tua nhanh / dọn sạch ---------- */
  /* gpu71 (L1): bỏ chạm-màn-hình-để-tua; chỉ nút "Bỏ qua" (06 FFTURN.skipNow) */
  if (W.FFTURN && FFTURN.reg) FFTURN.reg(() => {
    if (!DS.jobs.size) return;
    for (const j of [...DS.jobs]) j.fin(true);
  });
  AC.clean = () => { for (const j of [...DS.jobs]) j.fin(true); unhideAll(); DS.P = null; document.querySelectorAll(".acp,.acf,.actag,.acpile,.acvs,.acnum,.fxg.acd,.fxg.acgh").forEach((e) => e.remove()); };
  AC.busy = () => DS.jobs.size;
  /* an toàn: ván mới / thoát trận -> không để lá bị ẩn */
  setInterval(() => { try { if ((HH.size || HB.size) && !DS.jobs.size && !(DS.P && !DS.P.fin) && !SG.busy()) unhideAll(); } catch (e) {} }, 4000);
})();
