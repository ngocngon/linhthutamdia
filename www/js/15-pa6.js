/* ===== Module 15 (gpu60): PA6 – LINH HỒN XUẤT THẺ =====
   Chuỗi diễn của thẻ S5/S4 khi ra tay:
   (A) ultShow (05): thẻ S5 ĐẦU TIÊN của lượt bay ra giữa màn, lật từ mặt úp sang mặt ngửa trong lúc phóng lớn, bong bóng câu thoại @rm.
       Thẻ S5 sau đó trong cùng lượt và thẻ S4: không phóng lớn, chỉ nảy tại ô + vòng sáng (S5 vẫn có bong bóng thoại). S1–S3: vòng sáng tại ô.
   (B) heroUp (05): bản sao thẻ hai lớp — khung/nền ở lại (tối đi), nhân vật (ảnh art tách nền img/c, hoặc ảnh tư thế img/pose) tách ra lớp .p6soul,
       phá khung (phóng 1,3×, viền sáng tĩnh, bóng ảo), bong bóng câu thoại @kn.
   (C) nhân vật bay vòng cung tới từng mục tiêu đúng lúc đòn trúng (lịch plan8 được dời P6.shift), đâm tới + loé va chạm (WebGL), tờ va chạm theo hệ img/hx
       quanh thẻ bị trúng, máy quay #board xích lại gần mục tiêu (≤1,05×); hiệu ứng số/nhãn có sẵn (hit8) diễn đúng lúc trúng.
   (D) nhân vật bay về, xoáy chui vào khung, khung sáng lại; heroDown hạ thẻ đúng ô + vòng bụi.
   Hiệu năng: chỉ transform/opacity trên DOM; ánh sáng/vệt/hạt/sóng vẽ ở lớp WebGL (GLFX, hoà trộn cộng) có trần hạt theo mức máy; thiếu WebGL -> lớp 2D FX.
   Mức máy "Đầy đủ / Vừa / Nhẹ": tự chọn theo khung hình đo đầu trận (08) hoặc chọn tay trong Cài đặt (localStorage "ltd_p6lv").
   Chạm màn hình trong lúc chuỗi diễn: tua nhanh (mọi đòn còn lại trúng ngay, nhân vật chui về, thẻ hạ) — thoại vẫn nói tiếp. */
/* ===== gpu68 (vis): LUẬT TRÌNH DIỄN MỘT THẺ — BẮT BUỘC, DO SEQ (dưới đây) CƯỠNG CHẾ =====
   [A] RA MẮT: phóng lớn + lật mặt + câu thoại ra mắt + chú thích kỹ năng (ultShow 05 / slotShow) — đọc trọn, không gì đè lên.
   [B] KỸ NĂNG: hồn/đạo cụ rời thẻ -> tới mục tiêu -> kết quả (số đổi theo ngôn ngữ đổi chỉ số P6.stat, nhãn nhỏ cạnh ô số).
   [C] THẺ KẾ TIẾP: chỉ khi [B] của thẻ trước xong (06 chờ FX_UNTIL/sleep; [B] giữ holdFx tới hết).
   Luật:
   1. Không phần nào của [B] (playFxCore nhịp kỹ năng: heroUp/PA6, plan8, ấn ký 17-sig, Hồn Xuất 16-hx, đổi chỉ số) được bắt đầu khi [A]
      còn trên màn: playFxCore (trừ nhịp lật, part 1) đi qua SEQ.skill(); nếu SEQ đang mở [A], phần kỹ năng xếp hàng và chạy ngay khi [A] đóng.
   2. Thứ tự một bước có thẻ ra mắt: nhịp lật trên bàn (part 1) -> [A] (từng thẻ một) -> [B] (part 2). Bước chỉ có thẻ lật (Duy Trì) cũng vậy.
   3. Một kỹ năng nhiều mục tiêu: mọi mục tiêu trúng CÙNG LÚC (gom mốc trúng, HXG.shift/plan8 nhóm); đổi chỉ số so le ≤90 ms/lá.
   4. Chữ không chồng: bong bóng thoại [A] tắt trước khi [B] bắt đầu; bong bóng kỹ năng [B] đặt phía xa mục tiêu; không chữ to giữa màn khi đổi số.
   5. Chạm màn hình: tua phần đang diễn ([A] thu về ngay -> [B] chạy; [B] trúng hết ngay, số cuối đặt đúng). Tua lượt máy (FFTURN) CHỈ khi phần diễn của lượt đã quá 60 s (06, FF_AFTER) — dưới 60 s mọi hiệu ứng + câu thoại diễn đủ:
      [A]/[B] rút ngắn nhưng thứ tự giữ nguyên. Giảm chuyển động: không [A], kết quả hiện thẳng. */
(function () {
  "use strict";
  const W = window, LVK = "ltd_p6lv", VER = "gpu60";
  const P6 = {};
  W.P6 = P6;
  const tap = (k, o) => { try { if (W.PA6_TAP) W.PA6_TAP(k, o || {}); } catch (e) {} };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ff = () => !!(W.FFTURN && FFTURN.on);
  const on = () => { try { return !reduced && !!G; } catch (e) { return false; } };
  P6.on = on;

  /* ---------- SEQ: bộ xếp lịch [A] -> [B] (luật ở đầu tệp) ---------- */
  const SEQ = { open: 0, q: [], wd: 0, n: 0 };
  P6.seq = SEQ;
  SEQ.zoomOn = function (uid) {
    SEQ.open++; SEQ.n++;
    tap("Q:A", { uid, open: SEQ.open });
    clearTimeout(SEQ.wd);
    SEQ.wd = setTimeout(() => { if (SEQ.open) { SEQ.open = 0; tap("Q:A/", { wd: 1 }); SEQ.flush(); } }, 9000 * SPD);
  };
  SEQ.zoomOff = function (uid) {
    if (!SEQ.open) return;
    SEQ.open--;
    tap("Q:A/", { uid, open: SEQ.open });
    if (!SEQ.open) { clearTimeout(SEQ.wd); SEQ.flush(); }
  };
  /* gộp gpu69 (P-1): [A] vừa đóng -> phần [B] chạy ở KHUNG SAU (khung 1: vẽ lại bàn pvApply; khung 2: heroUp/plan8/P6.start) thay vì
     cùng một tác vụ dài với lúc đóng màn phóng lớn. Lượt vẫn được giữ (holdFx) suốt 2 khung; nếu [A] khác mở lại thì xếp hàng tiếp (luật 1). */
  SEQ.flush = function () {
    const L = SEQ.q.splice(0);
    if (!L.length) return;
    const run = () => { if (SEQ.open) { SEQ.q.push(...L); return; } for (const f of L) { try { f(); } catch (e) { console.error(e); } } };
    if (reduced || ff() || document.hidden || !W.requestAnimationFrame) return run();
    try { holdFx(400); } catch (e) {}
    requestAnimationFrame(() => { try { if (typeof pvApply === "function") pvApply(); } catch (e) { console.error(e); } requestAnimationFrame(run); });
  };
  /* gộp gpu69 (P-3): giữ lượt tới khi hồn chui về VÀ thẻ đáp ô (D:land) — không chỉ theo hẹn giờ holdFx (máy tải nặng làm hẹn giờ trễ
     -> vòng lượt chạy tiếp giữa lúc hồn đang lao về). Dùng FXPEND (03 sleep chờ thêm), trần an toàn = mốc kết thúc dự kiến + 4 s. */
  const PEND = new Map();
  function pendOn(ch) { if (ch.pd) return; ch.pd = 1; PEND.set(ch.uid, ch); try { FXPEND++; FXPEND_T = Math.max(FXPEND_T, ch.endR || performance.now()); } catch (e) {} }
  function pendOff(ch) { if (!ch || ch.pd !== 1) return; ch.pd = 2; if (PEND.get(ch.uid) === ch) PEND.delete(ch.uid); try { FXPEND = Math.max(0, FXPEND - 1); } catch (e) {} }
  /* chạy phần kỹ năng ngay nếu không có [A] đang mở; nếu có: xếp hàng, giữ lượt chờ */
  SEQ.skill = function (f) {
    if (!SEQ.open) { tap("Q:B", {}); return f(); }
    tap("Q:Bq", { open: SEQ.open });
    try { holdFx(1200); } catch (e) {}
    SEQ.q.push(() => { tap("Q:B", { late: 1 }); f(); });
    return 0;
  };
  /* bọc ultShow (05): mở [A] khi bắt đầu, đóng đúng lúc màn ra mắt gọi done (kể cả khi bị tua / lỗi) */
  try {
    const us0 = ultShow;
    ultShow = function (inst, done, nth) {
      if (reduced || !inst) return us0.apply(this, arguments);
      let closed = 0;
      const uid = inst.uid;
      const fin = () => { if (closed) return; closed = 1; SEQ.zoomOff(uid); if (done) { const f = done; done = null; f(); } };
      SEQ.zoomOn(uid);
      const safety = setTimeout(fin, 8000 * SPD);
      return us0.call(this, inst, () => { clearTimeout(safety); fin(); }, nth);
    };
  } catch (e) {}

  /* ---------- mức máy ---------- */
  let man = "auto";
  try { const v = localStorage.getItem(LVK); if (/^(auto|full|mid|lite)$/.test(v)) man = v; } catch (e) {}
  function tier() {
    if (man !== "auto") return man;
    if (W.P6AUTO) return W.P6AUTO;
    if (W.FXLV === 0) return "lite";
    try { if (FXQ < 0.5) return "lite"; if (FXQ < 1) return "mid"; } catch (e) {}
    return "full";
  }
  P6.tier = tier;
  const LBL = { auto: "Tự động", full: "Đầy đủ", mid: "Vừa", lite: "Nhẹ" };
  P6.LBL = LBL;
  P6.setTier = function (k) { if (!LBL[k]) return; man = k; try { localStorage.setItem(LVK, k); } catch (e) {} syncUi(); };
  Object.defineProperty(P6, "mode", { get() { return man; } });
  function note() {
    const t = tier(), n = LBL[t];
    if (man !== "auto") return "Đang dùng mức " + n + (t === "lite" ? ": không bóng ảo, không rung, nửa số hạt." : t === "mid" ? ": bớt hạt và bóng ảo." : ": đủ bóng ảo, hạt, tờ va chạm.");
    return "Tự động: " + n + (W.P6FPS ? " (đo " + W.P6FPS + " khung/giây đầu trận)." : " — đo lại đầu mỗi trận.");
  }
  function syncUi() {
    const seg = document.getElementById("setP6Seg");
    if (seg) seg.querySelectorAll(".sx-pill").forEach((b) => { const o = b.dataset.k === man; b.classList.toggle("on", o); b.setAttribute("aria-checked", o); });
    const n = document.getElementById("setP6Note");
    if (n) n.textContent = note();
  }
  P6.syncUi = syncUi;
  {
    const seg = document.getElementById("setP6Seg");
    if (seg) seg.addEventListener("click", (e) => { const b = e.target.closest(".sx-pill"); if (!b) return; P6.setTier(b.dataset.k); try { SFX.play("tap"); } catch (er) {} });
    syncUi();
  }
  const KN = { full: 1, mid: 0.7, lite: 0.5 };
  const CAP = { full: 600, mid: 420, lite: 300 };
  const kN = (n) => Math.max(1, Math.round(n * (KN[tier()] || 1)));

  /* ---------- hạt: lớp WebGL (GLFX) có trần; thiếu WebGL -> lớp 2D FX ---------- */
  const live = [];
  let liveMax = 0;
  function prune() { const now = performance.now(); let j = 0; for (let i = 0; i < live.length; i++) if (live[i] > now) live[j++] = live[i]; live.length = j; }
  const gl = () => !!(W.GLFX && GLFX.ok && store.gpu !== false);
  function fb(o) {
    const k = o.kind || 0;
    FXBIG = true;
    try {
      if (k === 2) FX.ring(o.x, o.y, o.c, o.s1, 3);
      else if (k === 0 && o.s1 >= 24) FX.glow(o.x, o.y, o.c, o.s1, o.dur);
      else if (Math.random() < 0.3) FX.sparks(o.x, o.y, o.c, 1, Math.hypot(o.vx || 0, o.vy || 0) || 60);
    } finally { FXBIG = false; }
  }
  function E6(o) {
    if (reduced) return;
    if (live.length >= (CAP[tier()] || 600)) { prune(); if (live.length >= (CAP[tier()] || 600)) return; }
    live.push(performance.now() + ((o.dur || 0.5) + (o.delay || 0)) * SPD * 1000);
    if (live.length > liveMax) liveMax = live.length;
    o.keep = 1;
    if (gl()) GLFX.emit(o); else if (!o.delay) fb(o); else fxT(() => fb(o), o.delay * 1000);
  }
  P6.stats = () => { prune(); return { live: live.length, max: liveMax, gl: gl(), tier: tier() }; };
  P6.resetStats = () => { liveMax = 0; };
  const glow = (x, y, c, r, dur, a, delay) => E6({ x, y, c, kind: 0, s0: r * 0.5, s1: r, dur: dur || 0.4, a: a == null ? 0.8 : a, drag: 0, delay });
  const ring = (x, y, c, r, dur, a, sy, delay) => E6({ x, y, c, kind: 2, s0: Math.max(6, r * 0.14), s1: r, sy: sy || 1, dur: dur || 0.45, a: a == null ? 0.9 : a, drag: 0, rot: 0, delay });
  const star = (x, y, c, s, dur, delay) => E6({ x, y, c, kind: 3, s0: s * 0.35, s1: s, dur: dur || 0.3, a: 0.9, rot: 0, drag: 0, delay });
  function streaks(x, y, cols, n, spd, a0, a1, life, size) {
    n = kN(n);
    for (let i = 0; i < n; i++) {
      const a = rnd(a0, a1), v = rnd(0.45, 1) * spd;
      E6({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: cols[i % cols.length], kind: 1, s0: size * rnd(0.7, 1.25), s1: size * 0.3, stretch: 0.05, drag: 2.4, dur: rnd(life * 0.6, life), a: 0.95 });
    }
  }
  function converge(x, y, cols, n, R, dur, swirl) {
    n = kN(n);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.283), r = R * rnd(0.75, 1.15), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.85, sw = swirl ? r * 0.9 : 0;
      E6({ x: px, y: py, vx: -(Math.cos(a) * r) / dur - Math.sin(a) * sw, vy: -(Math.sin(a) * r * 0.85) / dur + Math.cos(a) * sw, c: cols[i % cols.length], kind: 0, s0: rnd(4, 8), s1: 1.5, drag: 0, dur, a: 0.9, delay: rnd(0, 0.06) });
    }
  }
  const beam = (x1, y1, x2, y2, c, w, dur) => { if (reduced) return; if (gl()) { live.push(performance.now() + (dur || 0.3) * SPD * 1000); GLFX.tether(x1, y1, x2, y2, c, w || 9, 0.18, dur || 0.3); } else { FXBIG = true; try { FX.comet(x1, y1, x2, y2, c); } finally { FXBIG = false; } } };
  const shake = (p, dx, dy) => { if (reduced || tier() === "lite") return; try { if (gl()) GLFX.impulseShake(p, dx, dy); else { FXBIG = true; try { FX.shake(p * 0.6); } finally { FXBIG = false; } } } catch (e) {} };
  P6.fx = { glow, ring, star, streaks, converge, beam };

  /* ---------- gpu68 (vis): NGÔN NGỮ ĐỔI CHỈ SỐ — MỘT KIỂU CHO MỌI THẺ ----------
     Mọi lần năng lượng (cost) hoặc sức mạnh (pow) của một thẻ khác đổi vì kỹ năng (tay bài, bàn, lá vừa lật từ bộ bài):
       1. (nếu có nguồn) một sợi sáng mảnh nối đạo cụ/hồn/thẻ nguồn -> đúng ô số của thẻ bị đổi (WebGL, 0,2 s gốc),
       2. chính ô số trên thẻ đếm từng bước cũ -> mới (kiểu Tiểu Trạng Nguyên: +1, +2…), mỗi nhịp nảy nhẹ ≤1,22×,
          viền ô sáng XANH khi có lợi (năng lượng giảm / sức mạnh tăng), ĐỎ khi bất lợi,
       3. một nhãn nhỏ "−1" / "+3" / "×2" mọc cạnh ô số, nổi lên rồi tan (không chữ to giữa màn, không phóng to ô số).
     Nhiều thẻ: gọi lần lượt với i = 0,1,2… -> các thẻ đếm so le 90 ms (vẫn cùng một nhịp, không chờ nhau).
     Giảm chuyển động: chỉ đặt số mới. Tua lượt máy: không sợi sáng, một nhịp. Luôn đặt đúng số cuối (kể cả khi bị tua). */
  const STL = new Set();
  const badgeOf = (el, k) => el && el.querySelector(k === "cost" ? ":scope>.cst,:scope>.lcc,.gc>.cst,.lc>.lcc" : ":scope>.pwh,:scope>.lcp,.gc>.pwh,.lc>.lcp");
  P6.stat = function (o) {
    const el = o && o.el, k = o.k === "cost" ? "cost" : "pow", b = badgeOf(el, k);
    if (!b) return 0;
    let v1 = o.v1 != null ? +o.v1 : parseInt(b.textContent, 10), v0 = +o.v0;
    if (!isFinite(v1)) return 0;
    if (!isFinite(v0)) v0 = v1;
    const fin = String(o.fin != null ? o.fin : v1);
    const d = v1 - v0, good = k === "cost" ? d < 0 : d > 0, col = good ? "#5dffa8" : "#ff6b86";
    const lab = o.lab || (d === 0 ? "" : (d > 0 ? "+" : "−") + Math.abs(d));
    if (reduced || !d) { b.textContent = fin; return 0; }
    const fast = ff(), dl = (o.dl || 0) + (o.i || 0) * 90, LINK = o.src && !fast ? 200 : 0;
    const rb = () => { const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, w: Math.max(14, q.width) }; };
    b.textContent = String(v0);
    const job = { b, fin, dead: 0, tms: [] };
    STL.add(job);
    const end = () => { if (job.dead) return; job.dead = 1; STL.delete(job); for (const t of job.tms) clearTimeout(t); b.textContent = fin; b.classList.remove("st-up", "st-dn"); };
    job.end = end;
    const at = (f, ms) => job.tms.push(fxT(() => { if (!job.dead) { try { f(); } catch (e) { console.error(e); } } }, ms));
    if (LINK) at(() => { const q = rb(); beam(o.src.x, o.src.y, q.x, q.y, o.c || col, 4, 0.22); glow(o.src.x, o.src.y, o.c || col, 26, 0.25, 0.6); }, dl);
    const steps = fast ? 1 : Math.min(6, Math.abs(d)), TK = 75;
    at(() => {
      const q = rb();
      b.classList.add(good ? "st-up" : "st-dn");
      ring(q.x, q.y, col, q.w * 2.1, 0.32, 0.9);
      if (tier() !== "lite") star(q.x, q.y, "#ffffff", q.w * 1.6, 0.2);
      chip(q, el, lab, good, k);
      tap("stat", { k, d, uid: o.uid });
    }, dl + LINK);
    for (let s = 1; s <= steps; s++) at(() => {
      b.textContent = s === steps ? fin : String(Math.round(v0 + d * s / steps));
      try { b.animate([{ transform: "scale(1)" }, { transform: "scale(1.22)", offset: 0.4 }, { transform: "scale(1)" }], { duration: 130, easing: "ease-out", composite: "add" }); } catch (e) {}
    }, dl + LINK + (s - 1) * TK);
    at(end, dl + LINK + steps * TK + 520);
    job.tms.push(setTimeout(end, (dl + LINK + steps * TK + 900) * SPD + 400));
    return dl + LINK;
  };
  /* nhãn "−1" cạnh ô số: phía ngoài thẻ (ô năng lượng góc trái -> nhãn bên trái, ô sức mạnh góc phải -> bên phải) */
  function chip(q, el, txt, good, k) {
    if (!txt) return;
    const d = document.createElement("div");
    d.className = "stchip " + (good ? "up" : "dn");
    d.textContent = txt;
    document.body.appendChild(d);
    const w = d.offsetWidth, h = d.offsetHeight, side = k === "cost" ? -1 : 1;
    const x = clamp(q.x + side * (q.w * 0.55 + w / 2 + 2) - w / 2, 4, innerWidth - w - 4), y = clamp(q.y - h - 2, 4, innerHeight - h - 4);
    d.style.left = x.toFixed(1) + "px"; d.style.top = y.toFixed(1) + "px";
    const a = d.animate([{ opacity: 0, transform: "translateY(6px) scale(.7)" }, { opacity: 1, transform: "translateY(-2px) scale(1.06)", offset: 0.18 }, { opacity: 1, transform: "translateY(-6px) scale(1)", offset: 0.75 }, { opacity: 0, transform: "translateY(-14px) scale(.95)" }], { duration: 900 * SPD, easing: "ease-out", fill: "forwards" });
    a.onfinish = () => d.remove();
    setTimeout(() => d.remove(), 1300 * SPD);
  }
  P6.statEnd = () => { for (const j of [...STL]) j.end(); document.querySelectorAll(".stchip").forEach((e) => e.remove()); };

  /* FX.shake (05) trong trận: cộng dồn (composite add) với máy quay PA6 thay vì đè lên; mức Nhẹ: không rung khi chuỗi đang diễn */
  try {
    const sh0 = FX.shake;
    FX.shake = function (n) {
      if (reduced || !FXBIG) return;
      if (CH && tier() === "lite") return;
      const el = document.getElementById("board");
      if (!el || !el.animate) return;
      try { el.animate([{ transform: "translate(0,0)" }, { transform: `translate(${n}px,${-n}px)` }, { transform: `translate(${-n}px,${n * 0.6}px)` }, { transform: `translate(${n * 0.6}px,${n * 0.4}px)` }, { transform: "translate(0,0)" }], { duration: 240, easing: "ease-out", composite: "add" }); }
      catch (e) { sh0.call(FX, n); }
    };
  } catch (e) {}

  /* ---------- tài nguyên: câu thoại (chữ), ảnh tư thế, tờ va chạm theo hệ ---------- */
  /* gpu69: người dùng bỏ chữ câu thoại khi thẻ phóng to / xuất hồn — không tải sfx/thoai_chu.json, không bong bóng chữ.
     Giọng đọc và nhịp giữ (theo độ dài giọng) giữ nguyên. */
  function capLoad() {}
  P6.cap = () => "";
  const POSE = new Set(), HX = new Set(), KEEP = [];
  let manSt = 0;
  function manLoad() {
    if (manSt) return;
    manSt = 1;
    fetch("img/pose/pose.json?v=" + VER).then((r) => (r.ok ? r.json() : [])).then((j) => { for (const k of Array.isArray(j) ? j : Object.keys(j || {})) POSE.add(k); }).catch(() => {});
    fetch("img/hx/hx.json?v=" + VER).then((r) => (r.ok ? r.json() : [])).then((j) => {
      const L = Array.isArray(j) ? j : Array.isArray(j && j.sheets) ? j.sheets : Object.keys(j || {});
      for (let k of L) {
        k = String((k && k.k) || k).replace(/^hx_/, "").replace(/\.webp$/, "");
        if (!/^[a-z]+$/.test(k)) continue;
        HX.add(k);
        try { IMGS.v16["hx_" + k] = new URL("img/hx/hx_" + k + ".webp?v=" + VER, document.baseURI).href; } catch (e) {}
      }
    }).catch(() => {});
  }
  const poseUrl = (id) => new URL("img/pose/" + id + ".webp?v=" + VER, document.baseURI).href;
  function soulUrl(id) {
    if (POSE.has(id)) return poseUrl(id);
    try { return SP.c[id + "@f"] || SP.c[id] || cardUrl12(id, 1); } catch (e) { return ""; }
  }
  function pre1(u) { if (!u) return; const im = new Image(); im.decoding = "async"; im.src = u; KEEP.push(im); if (im.decode) im.decode().catch(() => {}); }
  /* gọi trong warmMatch12 (05): tải + giải mã trước art đầy đủ (@f), ảnh tư thế, nền thẻ, tờ va chạm theo hệ của mọi thẻ S5/S4 hai bộ bài */
  P6.warm = function (ids) {
    capLoad(); manLoad();
    KEEP.length = 0;
    const go = () => {
      const els = new Set();
      for (const k of ids || []) {
        const d = C[k];
        if (!d || (d.h !== "S5" && d.h !== "S4")) continue;
        try { spLoad(k + "@f"); } catch (e) {}
        if (POSE.has(k)) pre1(poseUrl(k));
        try { const nb = typeof nbL === "function" ? nbL(k) : ""; const m = /url\(\s*['"]?([^'")]+)/.exec(nb || ""); if (m) pre1(m[1]); } catch (e) {}
        const e = elOf(k); if (e) els.add(e);
      }
      for (const e of els) if (HX.has(e)) { try { v16Pre("hx_" + e); } catch (x) {} }
    };
    go(); setTimeout(go, 1200); /* lần 2: sau khi tệp kê ảnh tư thế / tờ va chạm đã về */
  };
  P6.hasHx = (e) => HX.has(e);
  P6.hasPose = (id) => POSE.has(id);

  /* ---------- màu ---------- */
  function cols(id) {
    const e = elOf(id), d = C[id];
    const c1 = (e && ELD[e] && ELD[e][0]) || (d && HC[d.h]) || "#8ab4ff", c2 = (e && ELD[e] && ELD[e][1]) || "#ffffff";
    return { e, c1, c2, L: [c1, c2, "#ffffff", (d && HC[d.h]) || "#ffe3a0"] };
  }
  P6.cols = cols;

  /* ---------- bong bóng lời thoại ---------- */
  function sayEl(id, ph, x, y, dn, c) {
    const t = P6.cap(id, ph);
    if (!t) return null;
    const b = document.createElement("div");
    b.className = "p6say" + (dn ? " dn" : "");
    b.style.setProperty("--c", c || "#8ab4ff");
    b.innerHTML = `<small>${esc(C[id] ? C[id].n : "")}</small>“${esc(t)}”<i class="p6w"><b></b><b></b><b></b></i>`;
    document.body.appendChild(b);
    const w = b.offsetWidth, h = b.offsetHeight, lx = clamp(x - w / 2, 6, innerWidth - w - 6), ty = dn ? y + 10 : y - h - 10, ly = clamp(ty, 6, innerHeight - h - 6);
    b.style.left = lx.toFixed(1) + "px"; b.style.top = ly.toFixed(1) + "px"; b.style.setProperty("--tx", (x - (lx + w / 2)).toFixed(1) + "px");
    return b;
  }
  /* hiện bong bóng tại (x,y) trong ms GỐC (nhân SPD); dn: nằm dưới điểm neo */
  function say(id, ph, x, y, ms, dn, c, dl) {
    const b = sayEl(id, ph, x, y, dn, c);
    if (!b) return null;
    const ty = dn ? -8 : 8;
    b.animate([{ opacity: 0, transform: `translateY(${ty}px) scale(.7)` }, { opacity: 1, transform: "scale(1.05)", offset: 0.6 }, { opacity: 1, transform: "none" }], { duration: 200, delay: dl || 0, easing: "cubic-bezier(.2,.9,.3,1.3)", fill: "both" });
    const t = fxT(() => { const a = b.animate([{ opacity: 1 }, { opacity: 0, transform: `translateY(${-ty}px) scale(.96)` }], { duration: 180, fill: "forwards" }); a.onfinish = () => b.remove(); setTimeout(() => b.remove(), 600 * SPD); }, Math.max(300, (dl || 0) + ms));
    b._t = t;
    tap("say", { ph, id });
    return b;
  }
  P6.say = say;
  P6.sayHTML = function (id, ph, c) { const t = P6.cap(id, ph); if (!t) return ""; return `<div class="p6say" style="--c:${c || "#8ab4ff"}"><small>${esc(C[id] ? C[id].n : "")}</small>“${esc(t)}”<i class="p6w"><b></b><b></b><b></b></i></div>`; };

  /* ---------- (A) màn phóng lớn: S5 đầu tiên của lượt ---------- */
  const TS = { g: null, t: -1, uid: 0 };
  function claim(uid) {
    const t = G ? G.turn : -1;
    if (TS.g !== G || TS.t !== t) { TS.g = G; TS.t = t; TS.uid = 0; }
    if (!TS.uid) { TS.uid = uid; return true; }
    return TS.uid === uid;
  }
  P6.full = function (inst) {
    if (!on() || !inst || inst.mini || !C[inst.id] || C[inst.id].h !== "S5" || ff()) return false;
    return claim(inst.uid);
  };
  P6.back = function (inst) {
    try {
      const mine = inst.own !== "a";
      const k = mine ? dBack(store.decks[store.cur]) : (typeof foeBack !== "undefined" ? foeBack : "b0");
      return (BACKS[k] || BACKS.b0)[1];
    } catch (e) { return "#2a2060"; }
  };
  const COVER = new Map();
  /* playFx (05): thẻ S5 đầu tiên lật thường trong bước -> giữ mặt úp ở ô (che bằng mặt lưng) tới lúc màn phóng lớn lật nó ra */
  P6.pre = function (us, evs) {
    if (!on() || ff()) return;
    const fl = new Set(evs.filter((e) => e.k === "flip" && !e.eff).map((e) => e.uid));
    for (const i of us) {
      if (i.mini || !C[i.id] || C[i.id].h !== "S5" || !fl.has(i.uid)) continue;
      if (!claim(i.uid)) return;
      const el = document.querySelector(`#board [data-mc="${i.uid}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const g = document.createElement("div");
      g.className = "fxg p6bk";
      g.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
      g.innerHTML = `<i style="background:${P6.back(i)}"></i>`;
      document.body.appendChild(g);
      el.classList.add("hero-hid"); hide9(el, 1);
      const tm = setTimeout(() => P6.uncover(i.uid, 1), 6000);
      COVER.set(i.uid, { g, el, tm });
      tap("A:cover", { uid: i.uid });
      return;
    }
  };
  P6.isPre = (uid) => COVER.has(uid);
  P6.uncover = function (uid, show) {
    const o = COVER.get(uid);
    if (!o) return;
    COVER.delete(uid); clearTimeout(o.tm); o.g.remove();
    if (show) { const e2 = document.querySelector(`#board [data-mc="${uid}"]`); for (const e of [o.el, e2]) if (e) { e.classList.remove("hero-hid"); hide9(e, 0); } }
  };
  /* màn phóng lớn bắt đầu: hiệu ứng GPU (vòng sáng + tia) khi thẻ tới giữa màn */
  P6.zoomFx = function (inst, cx, cy, W, TIN) {
    const { c1, c2, L } = cols(inst.id);
    tap("A:zoom", { uid: inst.uid, id: inst.id });
    fxT(() => {
      tap("A:flip", { uid: inst.uid });
      glow(cx, cy, c1, W * 1.5, 0.5, 0.7);
      ring(cx, cy, c2, W * 1.15, 0.6, 0.85);
      ring(cx, cy, "#ffffff", W * 0.85, 0.45, 0.6, 1, 0.08);
      streaks(cx, cy, L, 26, 520, 0, 6.283, 0.7, 7);
      if (tier() !== "lite") ring(cx, cy + W * 0.7, c1, W * 1.1, 1.1, 0.55, 0.3, 0.1);
    }, TIN * 0.85);
  };

  /* ---------- S4 / S5 sau / S1–S3: không phóng lớn, nảy tại ô ---------- */
  P6.slotShow = function (inst, done, nth) {
    const fin = () => { if (done) { const f = done; done = null; try { f(); } catch (e) { console.error(e); } } };
    try {
      const id = inst.id, d = C[id], mini = !!inst.mini, s5 = !mini && d.h === "S5", mine = inst.own !== "a";
      try { SFX.launch(mini ? 3 : s5 ? 5 : 4, { el: elOf(id), uid: inst.uid, id, nth: nth | 0, foe: !mine }); } catch (e) {}
      P6.uncover(inst.uid, 1);
      let T = ff() ? (mini ? 110 : 180) : mini ? 240 : s5 ? 480 : 380;
      let vd = 0;
      if (s5 && !ff()) { try { vd = SFX.voiceDur ? SFX.voiceDur(id, "rm") : 0; } catch (e) {} if (vd > 0) T = Math.max(T, (320 + vd * 1000 + 120) / SPD); }
      const el = document.querySelector(`#board [data-mc="${inst.uid}"]`), r = el && el.getBoundingClientRect();
      tap("slot", { uid: inst.uid, id, tier: mini ? 3 : s5 ? 5 : 4 });
      if (r && r.width) {
        const x = r.left + r.width / 2, y = r.top + r.height / 2, { c1, c2, L } = cols(id), sc = mini ? 1.1 : 1.2;
        /* gpu61 (HX-02): thẻ vừa lật theo kiểu Hồn Xuất (16-hx.js) đã có nhịp nảy riêng -> không nảy lần hai */
        if (!(el._hx2 && performance.now() - el._hx2 < 1200 * SPD)) el.animate([{ transform: "none" }, { transform: `scale(${sc}) translateY(-3px)`, offset: 0.35 }, { transform: "none" }], { duration: Math.min(T, mini ? 260 : 460), easing: "cubic-bezier(.3,.8,.3,1)" });
        ring(x, y, c2, Math.max(36, r.width * (mini ? 0.85 : 1.05)), 0.5, 0.9);
        if (!mini) { glow(x, y, c1, r.width * 1.3, 0.45, 0.6); streaks(x, y, L, 12, 240, 0, 6.283, 0.5, 5); }
        if (s5) say(id, "rm", x, mine ? r.top - 4 : r.bottom + 4, T - 60, !mine, c1, 60);
      }
      holdFx(T + 40);
      fxT(fin, T);
    } catch (e) { console.error(e); fin(); }
  };

  /* ---------- (B)(C)(D) chuỗi linh hồn ---------- */
  let CH = null;
  P6.ch = () => CH;
  const T6 = { POP: 300, MINFLY: 300, JAB: 70, REC: 150, RET: 320, DIVE: 260, FLOUR: 380, CLU: 170 };
  P6.T = T6;
  /* dời lịch plan8 (base ms) để nhân vật kịp xuất ra, bay tới, chui về trước khi số của chính thẻ đổi */
  let OFF0 = 0;
  const hitRel = (s) => q8(s, () => {
    const t0 = s.t0 || 0;
    if (s.k === "move" || s.k === "swap") return t0 + mvDur9(s) * 0.85;
    if (s.k === "top") return t0 + topHit29(s);
    if (s.k === "loc") return t0 + T8.LIFT + 620;
    if (s.k === "ult29" || s.k === "lshield") return null;
    return t0 + (s.sp ? (s.nl ? 0 : T8.LIFT) + T8.FLY : 0);
  });
  P6.shift = function (steps) {
    const ch = CH;
    if (!ch || !ch.pending || !OFF0) return 0;
    /* gpu61 (16-hx.js): nhiều mục tiêu cùng loại của thẻ Hồn Xuất -> gom về cùng một mốc trúng (toả đòn một lần) */
    if (W.HXG) { try { HXG.shift(ch, steps); } catch (e) { console.error(e); } }
    const oth = [];
    let self = null;
    for (const s of steps) {
      if (s.self29 && s.dst === ch.src) { self = s; continue; }
      if (s.src === ch.src && s.tp && isFinite(s.tp.x)) { const h = hitRel(s); if (h != null) oth.push({ s, h }); }
    }
    let off = OFF0, extra = 0;
    if (oth.length) { const h0 = Math.min(...oth.map((q) => q.h)); off = OFF0 + Math.max(0, T6.MINFLY - h0); }
    if (self) {
      const L = oth.length ? Math.max(...oth.map((q) => q.h)) + off + T6.REC + T6.RET + T6.DIVE : OFF0 + T6.FLOUR + T6.RET * 0.6 + T6.DIVE;
      const at = self.t0 + off;
      if (at < L) { extra = L - at; self.t0 += extra; }
    }
    for (const s of steps) s.t0 = (s.t0 || 0) + off;
    ch.oth = oth.map((q) => ({ s: q.s, h: q.h + off, tp: q.s.tp }));
    ch.selfT = self ? self.t0 : null;
    ch.shifted = 1;
    tap("shift", { off, extra, n: oth.length, self: !!self });
    return off + extra;
  };
  const scheduled = (ch, f, t) => { const el = (performance.now() - ch.t0) / SPD, tm = fxT(() => { if (CH === ch && !ch.dead) { try { f(); } catch (e) { console.error(e); } } }, Math.max(0, t - el)); ch.tms.push(tm); return tm; };
  const TF = (ch, x, y, r, s) => `translate(${(x - ch.hx).toFixed(1)}px,${(y - ch.hy).toFixed(1)}px) rotate(${(r || 0).toFixed(2)}deg) scale(${(s || 1).toFixed(4)})`;
  function soulAnim(ch, kf, dur, easing) {
    const a = ch.so.animate(kf, { duration: Math.max(16, dur), easing: easing || "linear", fill: "forwards" });
    const prev = ch.an;
    ch.an = a;
    if (prev) requestAnimationFrame(() => { try { prev.cancel(); } catch (e) {} });
    return a;
  }
  function setPose(ch, x, y, r, s) { ch.x = x; ch.y = y; ch.r = r; ch.s = s; }
  /* bóng ảo: bản sao ảnh nhân vật mờ dần (không có ở mức Nhẹ) */
  function after(ch, a, grow, life) {
    const t = tier();
    if (t === "lite" || !ch.so) return;
    if (ch.ai >= (t === "full" ? 10 : 5)) return;
    ch.ai++;
    const d = document.createElement("div");
    d.className = "p6ai";
    d.style.cssText = ch.so.style.cssText;
    d.style.opacity = "";
    d.innerHTML = `<img src="${ch.url}" alt="">`;
    document.body.appendChild(d);
    const tf = TF(ch, ch.x, ch.y, ch.r, ch.s), tf2 = TF(ch, ch.x, ch.y, ch.r, ch.s * (grow || 1.12));
    const an = d.animate([{ transform: tf, opacity: a || 0.42 }, { transform: tf2, opacity: 0 }], { duration: life || 300, easing: "ease-out", fill: "forwards" });
    const rm = () => { d.remove(); ch.ai--; };
    an.onfinish = rm; setTimeout(() => { if (d.isConnected) rm(); }, ((life || 300) + 200) * SPD);
  }
  /* đường bay vòng cung (Bezier bậc 2), lấy mẫu thành khung WAAPI; đuôi hạt chạy theo cùng hàm vị trí trong vòng rAF */
  function fly(ch, x1, y1, s1, r1, dur, lift, cb) {
    const x0 = ch.x, y0 = ch.y, s0 = ch.s, r0 = ch.r, mx = (x0 + x1) / 2, my = Math.min(y0, y1) - (lift == null ? 70 : lift);
    const ez = (u) => u * u * (3 - 2 * u), pt = (u) => { const v = 1 - u; return [v * v * x0 + 2 * v * u * mx + u * u * x1, v * v * y0 + 2 * v * u * my + u * u * y1]; };
    const N = 12, kf = [];
    for (let i = 0; i <= N; i++) { const u = ez(i / N), q = pt(u); kf.push({ transform: TF(ch, q[0], q[1], r0 + (r1 - r0) * u + Math.sin(Math.PI * u) * (x1 < x0 ? -10 : 10), s0 + (s1 - s0) * u) }); }
    soulAnim(ch, kf, dur);
    setPose(ch, x1, y1, r1, s1);
    const T0 = performance.now(), TR = dur * SPD, { c1, L } = ch.col, lite = tier() === "lite";
    let nAi = 0;
    after(ch, 0.5, 1.06, 260);
    const step = () => {
      if (CH !== ch || ch.dead) return;
      const u = Math.min(1, (performance.now() - T0) / TR), q = pt(ez(u));
      const k = lite ? 1 : 2;
      for (let i = 0; i < k; i++) E6({ x: q[0] + rnd(-12, 12) * ch.s, y: q[1] + rnd(-8, 24) * ch.s, vx: rnd(-30, 30), vy: rnd(-30, 30), c: L[(Math.random() * L.length) | 0], kind: 0, s0: rnd(5, 11), s1: 1.5, drag: 1.4, dur: rnd(0.28, 0.5), a: 0.75 });
      if (u > 0.33 && nAi === 0) { nAi = 1; ch.x = q[0]; ch.y = q[1]; after(ch, 0.34, 1.04, 240); ch.x = x1; ch.y = y1; }
      if (u > 0.66 && nAi === 1) { nAi = 2; ch.x = q[0]; ch.y = q[1]; after(ch, 0.28, 1.04, 220); ch.x = x1; ch.y = y1; }
      if (u < 1) requestAnimationFrame(step); else if (cb) cb();
    };
    requestAnimationFrame(step);
    glow(x0, y0, c1, ch.bw * 0.9 * s0, 0.3, 0.5);
  }

  /* gọi trong heroUp (05) sau khi tạo bản sao thẻ nhấc g */
  P6.start = function (o) {
    if (!on() || !o || !o.g) return false;
    if (CH) end(CH, true);
    const d = o.d, id = d.id, card = o.g.querySelector(".mc"), art = card && card.querySelector("img.art");
    if (!art) return false;
    const aw = art.offsetWidth, ah = art.offsetHeight;
    if (!aw || !ah) return false;
    const ax = card.offsetLeft + card.clientLeft + art.offsetLeft, ay = card.offsetTop + card.clientTop + art.offsetTop;
    const S = o.S, ra = (o.rot || 0) * Math.PI / 180, lx = ax + aw / 2 - o.r.w / 2, ly = ay + ah / 2 - o.r.h / 2;
    const hx = o.nx + S * (lx * Math.cos(ra) - ly * Math.sin(ra)), hy = o.ny + S * (lx * Math.sin(ra) + ly * Math.cos(ra)), bw = aw * S, bh = ah * S;
    const col = cols(id), t = tier(), cs = getComputedStyle(art);
    const url = soulUrl(id) || art.currentSrc || art.src;
    const so = document.createElement("div");
    so.className = "p6soul" + (t === "lite" ? " lo" : "") + (POSE.has(id) ? " pose" : "");
    so.style.cssText = `left:${(hx - bw / 2).toFixed(1)}px;top:${(hy - bh / 2).toFixed(1)}px;width:${bw.toFixed(1)}px;height:${bh.toFixed(1)}px;--c:${col.c1}`;
    so.innerHTML = `<img src="${url}" alt="" draggable="false" style="object-fit:${POSE.has(id) ? "contain" : cs.objectFit};object-position:${cs.objectPosition}">`;
    so.style.opacity = "0";
    so.style.transform = `rotate(${(o.rot || 0).toFixed(2)}deg)`;
    document.body.appendChild(so);
    card.insertAdjacentHTML("beforeend", `<i class="p6dim"></i><i class="p6lit"></i>`);
    card.style.setProperty("--c", col.c1);
    const ch = CH = {
      g: o.g, so, card, id, uid: o.SRC, src: o.SRC, d, s5: d.h === "S5", col, url, hx, hy, bw, bh, rot: o.rot || 0, t0: performance.now(), tms: [], ai: 0,
      x: hx, y: hy, r: o.rot || 0, s: 1, pending: 1, shifted: 0, oth: [], selfT: null, mine: o.mine, slot: o.r, fy: o.ny, fh: o.r.h * o.S, kvd: o.kvd || 0, UP: o.UP, G, P0: o.P0, P1: o.P1
    };
    OFF0 = Math.round(o.UP + T6.POP);
    ch.off0 = OFF0;
    tap("B:start", { uid: ch.uid, id, s5: ch.s5, tier: t });
    /* lúc thẻ nhấc xong: nhân vật thế chỗ ảnh trên khung (cùng vị trí, không lộ đường nối) rồi phá khung bay lên */
    scheduled(ch, () => pop(ch), o.UP);
    return true;
  };
  function pop(ch) {
    ch.so.style.opacity = "1";
    ch.g.classList.add("p6out");
    const { c1, c2, L } = ch.col, sc = ch.s5 ? 1.3 : 1.2;
    let px = ch.hx, py = ch.hy - ch.bh * 0.24;
    py = Math.max(py, ch.bh * sc / 2 + 4);
    py = Math.min(py, innerHeight - ch.bh * sc / 2 - 4);
    px = clamp(px, ch.bw * sc / 2 + 4, innerWidth - ch.bw * sc / 2 - 4);
    soulAnim(ch, [{ transform: TF(ch, ch.hx, ch.hy, ch.rot, 1) }, { transform: TF(ch, px, py + 6, -1, sc + 0.07), offset: 0.6 }, { transform: TF(ch, px, py, -2, sc) }], T6.POP, "cubic-bezier(.2,.8,.3,1)");
    setPose(ch, px, py, -2, sc);
    ch.px = px; ch.py = py; ch.ps = sc;
    const dim = ch.card.querySelector(".p6dim"), lit = ch.card.querySelector(".p6lit");
    if (dim) dim.animate([{ opacity: 0 }, { opacity: 0.72 }], { duration: T6.POP, fill: "forwards" });
    if (lit) lit.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.25 }, { opacity: 0 }], { duration: T6.POP + 80, fill: "forwards" });
    tap("B:pop", { uid: ch.uid });
    const cx = ch.hx, cy = ch.hy, w = ch.bw;
    glow(cx, cy, "#ffffff", w * 1.2, 0.3, 0.75);
    glow(cx, cy, c1, w * 1.9, 0.55, 0.6);
    ring(cx, cy, c2, w * 1.25, 0.5, 0.9);
    converge(cx, cy, L, 26, w * 1.2, 0.32);
    const fw = ch.slot.w * 0.5 * ((ch.bw / Math.max(1, ch.slot.w)) || 1);
    for (const sd of [-1, 1]) streaks(cx + sd * fw * 0.8, cy, L, 9, 300, sd < 0 ? 2.5 : -0.6, sd < 0 ? 3.8 : 0.6, 0.5, 6);
    after(ch, 0.55, 1.35, 420);
    fxT(() => { if (CH === ch && !ch.dead) after(ch, 0.35, 1.6, 520); }, 60);
    try { SFX.play("whoosh"); } catch (e) {}
    /* bong bóng câu thoại kỹ năng: phía xa mục tiêu */
    if (KNS.g !== G) { KNS.g = G; KNS.s = new Set(); }
    const first = !KNS.s.has(ch.uid);
    if (ch.kvd > 0 || first) {
      KNS.s.add(ch.uid);
      const ty = ch.oth.length ? ch.oth.reduce((a, q) => a + q.tp.y, 0) / ch.oth.length : ch.mine ? 0 : innerHeight;
      const dn = ty < ch.hy;
      const ms = ch.kvd > 0 ? (ch.kvd * 1000 + 120) / SPD : 900;
      const yy = dn ? ch.fy + ch.fh / 2 + 4 : Math.min(py - ch.bh * sc / 2, ch.fy - ch.fh / 2) - 4;
      ch.say = say(ch.id, "kn", ch.hx, yy, ms, dn, c1, 40);
    }
    if (!ch.oth.length && ch.selfT == null) flourish(ch);
  }
  const KNS = { g: null, s: new Set() };
  /* không có mục tiêu: xoay vòng phép trên khung rồi chui về */
  function flourish(ch) {
    const { c1, c2, L } = ch.col;
    const x = ch.px, y = ch.py - 10;
    soulAnim(ch, [{ transform: TF(ch, ch.x, ch.y, ch.r, ch.s) }, { transform: TF(ch, x, y - 8, 4, ch.s * 1.06), offset: 0.5 }, { transform: TF(ch, x, y, 0, ch.s) }], T6.FLOUR, "ease-in-out");
    setPose(ch, x, y, 0, ch.s);
    ring(x, y + ch.bh * 0.45, c1, ch.bw * 1.1, 0.8, 0.6, 0.35);
    star(x, y, c2, ch.bw * 0.9, 0.35, 0.12);
    streaks(x, y, L, 16, 260, -2.8, -0.3, 0.7, 5);
    tap("C:flourish", { uid: ch.uid });
  }
  /* sau plan8 (05 playFxCore): dựng lịch bay theo đúng mốc trúng đòn */
  P6.plan = function (H) {
    const ch = CH;
    OFF0 = 0;
    if (!ch || !ch.pending) return;
    ch.pending = 0;
    ch.H = H; H.p6 = ch;
    const stops = [];
    for (const q of ch.oth.slice().sort((a, b) => a.h - b.h)) {
      const st = stops[stops.length - 1];
      if (st && q.h - st.t <= T6.CLU && st.list.length < 8) st.list.push(q); else stops.push({ t: q.h, list: [q] });
    }
    ch.stops = stops;
    if (W.HXG) { try { HXG.plan(ch, stops); } catch (e) { console.error(e); } }
    let free = ch.off0, D0 = -1, A0 = 0;
    stops.forEach((st, i) => {
      const A = st.t - T6.JAB;
      let D = Math.max(free, A - 420);
      if (A - D < 90) D = Math.max(free - 40, A - 90);
      if (i === 0) { D0 = D; A0 = A; }
      st.D = D; st.A = A;
      scheduled(ch, () => goStop(ch, st, A - D), D);
      scheduled(ch, () => jab(ch, st), A);
      scheduled(ch, () => impact(ch, st), st.t);
      free = st.t + T6.REC + (st.hold || 0);
    });
    let R;
    if (ch.selfT != null) R = ch.selfT - T6.DIVE - T6.RET;
    else if (stops.length) R = free;
    else R = ch.off0 + T6.FLOUR;
    R = Math.max(R, stops.length ? free - 40 : ch.off0 + 120);
    const E = R + T6.RET + T6.DIVE;
    ch.R = R; ch.E = E;
    scheduled(ch, () => ret(ch), R);
    scheduled(ch, () => dive(ch), R + T6.RET);
    ch.endR = ch.t0 + E * SPD;
    holdFx(E - (performance.now() - ch.t0) / SPD + 80);
    pendOn(ch);
    if (stops.length) camera(ch, stops, D0, A0, R);
    /* tua nhanh: chạm màn hình */
    ch.wd = setTimeout(() => { if (CH === ch) end(ch, true); }, (E + 4000) * SPD);
    tap("plan", { stops: stops.map((s) => ({ t: s.t, n: s.list.length })), R, E, self: ch.selfT });
  };
  function strikePt(ch, st) {
    let cx = 0, cy = 0, hh = 0;
    for (const q of st.list) { cx += q.tp.x / st.list.length; cy += q.tp.y / st.list.length; hh = Math.max(hh, q.tp.h || 64); }
    let dx = ch.x - cx, dy = ch.y - cy;
    const L = Math.hypot(dx, dy) || 1;
    dx /= L; dy /= L;
    const sF = clamp((hh * 1.2) / ch.bh, 0.5, 1.0), back = hh * 0.5 + ch.bh * sF * 0.32 + (st.list.length > 1 ? 14 : 0);
    let x = cx + dx * back, y = cy + dy * back;
    x = clamp(x, ch.bw * sF / 2 + 4, innerWidth - ch.bw * sF / 2 - 4);
    y = clamp(y, ch.bh * sF / 2 + 4, innerHeight - ch.bh * sF / 2 - 4);
    return { x, y, s: sF, cx, cy, dx, dy };
  }
  function goStop(ch, st, dur) {
    if (st.hx && W.HXG && HXG.goStop(ch, st, dur)) return;
    const p = strikePt(ch, st);
    st.p = p;
    tap("C:fly", { uid: ch.uid, n: st.list.length });
    try { SFX.play("whoosh"); } catch (e) {}
    const r1 = p.cx < ch.x ? -8 : 8;
    fly(ch, p.x, p.y, p.s, r1, dur, Math.min(110, 40 + Math.abs(p.x - ch.x) * 0.25));
    /* lấy đà: hạt hút vào nhân vật */
    converge(ch.x, ch.y, ch.col.L, 12, ch.bw * 0.7, 0.22);
  }
  function jab(ch, st) {
    if (st.hx && W.HXG && HXG.jab(ch, st)) return;
    const p = st.p || strikePt(ch, st);
    const tx = ch.x + (p.cx - ch.x) * 0.38, ty = ch.y + (p.cy - ch.y) * 0.38;
    const x0 = ch.x, y0 = ch.y, s0 = ch.s, r0 = ch.r;
    soulAnim(ch, [{ transform: TF(ch, x0, y0, r0, s0) }, { transform: TF(ch, tx, ty, r0 * 1.4, s0 * 1.1), offset: 0.45 }, { transform: TF(ch, tx, ty, r0 * 1.4, s0 * 1.1), offset: 0.62 },
      { transform: TF(ch, x0 + (x0 - p.cx) * 0.06, y0 + (y0 - p.cy) * 0.06 - 10, r0 * 0.5, s0) }], T6.JAB + T6.REC, "cubic-bezier(.4,0,.3,1)");
    setPose(ch, x0 + (x0 - p.cx) * 0.06, y0 + (y0 - p.cy) * 0.06 - 10, r0 * 0.5, s0);
    fxT(() => { if (CH === ch) { ch.x = tx; ch.y = ty; ch.s = s0 * 1.1; after(ch, 0.5, 1.22, 300); ch.x = x0 + (x0 - p.cx) * 0.06; ch.y = y0 + (y0 - p.cy) * 0.06 - 10; ch.s = s0; } }, T6.JAB);
  }
  /* va chạm: loé + sóng + vệt bắn + tờ va chạm theo hệ quanh thẻ; số/nhãn do hit8 có sẵn */
  function impact(ch, st) {
    const { e, c1, c2, L } = ch.col, t = tier(), big = st.list.length === 1;
    tap("C:hit", { uid: ch.uid, n: st.list.length });
    let sx = 0, sy = 0;
    for (const q of st.list) {
      const tp = q.tp, w = tp.w || 60, h = tp.h || 80;
      glow(tp.x, tp.y, "#ffffff", w * 0.9, 0.12, 0.9);
      glow(tp.x, tp.y, c1, w * 1.6, 0.45, 0.6);
      ring(tp.x, tp.y, c2, w * 1.05, 0.42, 0.95);
      ring(tp.x, tp.y, c1, w * 0.75, 0.36, 0.8, 1, 0.05);
      const ang = Math.atan2(tp.y - ch.y, tp.x - ch.x);
      streaks(tp.x, tp.y, L, big ? 22 : 12, big ? 480 : 340, ang - 1.1, ang + 1.1, 0.55, 6.5);
      star(tp.x, tp.y, "#ffffff", w * 1.1, 0.22);
      /* gpu61: nhiều mục tiêu -> tờ va chạm nhỏ hơn (không che lá bị trúng / lá bên cạnh) */
      if (e && HX.has(e) && st.hx !== "up") { try { playV16("hx_" + e, tp.x, tp.y, big ? Math.max(120, w * 2.6) : Math.max(96, w * 2.0), 520, 0, 0, true); tap("C:hx", { e }); } catch (x) {} }
      /* đổi điểm chiến địa: vệt sáng từ thẻ tới ô điểm của làn */
      if (/^(up|down|kill)$/.test(q.s.k) && q.s.dst) pwLink(q.s.dst, tp, c1);
      sx += tp.x; sy += tp.y;
    }
    sx /= st.list.length; sy /= st.list.length;
    shake(big ? 6 : 8, sx - ch.x, sy - ch.y);
    try { SFX.play("boom"); } catch (x) {}
    if (st.hx && W.HXG) { try { HXG.impact(ch, st); } catch (x) { console.error(x); } }
  }
  function pwLink(uid, tp, c) {
    try {
      const el = document.querySelector(`#board [data-mc="${uid}"]`), ln = el && el.closest("[data-lane]");
      if (!ln) return;
      const f = E.find(G, uid);
      if (!f) return;
      const side = G.locs[f.li].cards.p.includes(f.inst) ? "p" : "a", pw = ln.querySelector(".pw." + side);
      if (!pw) return;
      const b = pw.getBoundingClientRect();
      if (!b.width) return;
      const x = b.left + b.width / 2, y = b.top + b.height / 2;
      fxT(() => { beam(tp.x, tp.y, x, y, c, 6, 0.3); ring(x, y, c, b.width * 1.2, 0.4, 0.85); pw.animate([{ transform: "none" }, { transform: "scale(1.35)", offset: 0.4 }, { transform: "none" }], { duration: 300 }); tap("C:pw", { side }); }, 90);
    } catch (e) {}
  }
  /* (D) bay về trên khung rồi xoáy chui vào */
  function ret(ch) {
    tap("D:return", { uid: ch.uid });
    fly(ch, ch.px, ch.py - 6, ch.ps * 0.95, 0, T6.RET, 60);
    converge(ch.hx, ch.hy, ch.col.L, 10, ch.bw, 0.3);
  }
  function dive(ch) {
    if (ch.dived) return;
    tap("D:dive", { uid: ch.uid });
    const { c1, c2, L } = ch.col, x0 = ch.x, y0 = ch.y, s0 = ch.s;
    const kf = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8, e = u * u; kf.push({ transform: TF(ch, x0 + (ch.hx - x0) * e, y0 + (ch.hy - y0) * e, ch.rot + Math.sin(u * 9) * 5 * (1 - u), s0 + (1 - s0) * e), opacity: u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15 * 0.2 }); }
    soulAnim(ch, kf, T6.DIVE);
    setPose(ch, ch.hx, ch.hy, ch.rot, 1);
    converge(ch.hx, ch.hy, L, 30, ch.bw * 1.1, T6.DIVE / 1000 * 0.9, 1);
    try { SFX.play("rise"); } catch (e) {}
    scheduled(ch, () => relight(ch), (performance.now() - ch.t0) / SPD + T6.DIVE);
  }
  function relight(ch) {
    if (ch.dived) return;
    ch.dived = 1;
    ch.g.classList.remove("p6out");
    ch.so.style.opacity = "0";
    const dim = ch.card.querySelector(".p6dim"), lit = ch.card.querySelector(".p6lit"), { c1, c2 } = ch.col;
    if (dim) dim.animate([{ opacity: 0.72 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
    if (lit) lit.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 320, fill: "forwards" });
    ring(ch.hx, ch.hy, c2, ch.bw * 1.2, 0.42, 0.9);
    glow(ch.hx, ch.hy, c1, ch.bw * 1.5, 0.4, 0.6);
    tap("D:in", { uid: ch.uid });
  }
  /* máy quay: #board xích nhẹ về phía mục tiêu (scale quanh tâm các mục tiêu nên mục tiêu đứng yên), chỉ transform, cộng dồn với rung */
  function camera(ch, stops, D0, A0, R) {
    if (reduced) return;
    const b = document.getElementById("board");
    if (!b || !b.animate) return;
    let cx = 0, cy = 0, n = 0;
    for (const st of stops) for (const q of st.list) { cx += q.tp.x; cy += q.tp.y; n++; }
    if (!n) return;
    cx /= n; cy /= n;
    /* gpu61: mục tiêu trải rộng (toả nhiều mục tiêu khắp bàn) -> không xích máy quay, tránh cắt lá ở mép màn hình */
    let x0 = 1e9, x1 = -1e9;
    for (const st of stops) for (const q of st.list) { x0 = Math.min(x0, q.tp.x - (q.tp.w || 50) / 2); x1 = Math.max(x1, q.tp.x + (q.tp.w || 50) / 2); }
    if (x1 - x0 > innerWidth * 0.5) return;
    const br = b.getBoundingClientRect();
    const ox = cx - br.left, oy = cy - br.top, Z = 1.05;
    const el = (performance.now() - ch.t0) / SPD, d0 = Math.max(0, D0 - el), tot = Math.max(200, R + T6.RET - D0);
    const k1 = clamp((A0 - D0) / tot, 0.05, 0.6), k2 = clamp((R - D0) / tot, k1 + 0.01, 0.97);
    try {
      ch.cam = b.animate([{ transformOrigin: `${ox}px ${oy}px`, transform: "scale(1)" }, { transformOrigin: `${ox}px ${oy}px`, transform: `scale(${Z})`, offset: k1, easing: "linear" }, { transformOrigin: `${ox}px ${oy}px`, transform: `scale(${Z})`, offset: k2, easing: "cubic-bezier(.4,0,.3,1)" }, { transformOrigin: `${ox}px ${oy}px`, transform: "scale(1)" }],
        { duration: tot, delay: d0, easing: "linear", composite: "add" });
      tap("C:cam", { z: Z });
    } catch (e) { ch.cam = null; }
  }
  function end(ch, fast) {
    if (!ch || ch.dead) return;
    ch.dead = 1;
    for (const t of ch.tms) clearTimeout(t);
    clearTimeout(ch.wd);
    try { if (ch.an) ch.an.cancel(); } catch (e) {}
    try { if (ch.cam) ch.cam.cancel(); } catch (e) {}
    if (ch.so) ch.so.remove();
    if (ch.g) ch.g.classList.remove("p6out");
    if (ch.card) ch.card.querySelectorAll(".p6dim,.p6lit").forEach((e) => e.remove());
    if (fast && ch.say) ch.say.remove();
    if (CH === ch) CH = null;
    if (ch.pending) OFF0 = 0;
    document.querySelectorAll(".p6ai").forEach((e) => e.remove());
    /* tua / dọn: thả ngay; kết thúc thường: chờ D:land (P6.land), dự phòng khi thẻ không hạ được (heroDown 220 ms + 200 ms) */
    if (fast) pendOff(ch); else if (ch.pd === 1) setTimeout(() => pendOff(ch), 700 * SPD);
  }
  /* heroDown (05): bảo đảm nhân vật đã chui về trước khi hạ thẻ */
  P6.down = function (H, fast) {
    const ch = H && H.p6;
    if (!ch || ch !== CH) { if (ch) end(ch, true); return; }
    if (fast || ch.dived) { if (!ch.dived) tap("D:in", { uid: ch.uid, fast: 1 }); end(ch, !!fast); return; }
    /* hạ sớm (bị giới hạn trần): chui về ngay */
    for (const t of ch.tms) clearTimeout(t);
    ch.tms.length = 0;
    soulAnim(ch, [{ transform: TF(ch, ch.x, ch.y, ch.r, ch.s) }, { transform: TF(ch, ch.hx, ch.hy, ch.rot, 1) }], 120, "ease-in");
    setPose(ch, ch.hx, ch.hy, ch.rot, 1);
    tap("D:dive", { uid: ch.uid, fast: 1 });
    setTimeout(() => { if (CH === ch) { relight(ch); end(ch, false); } }, 125 * SPD);
  };
  /* heroDown xong: thẻ đáp đúng ô — vòng bụi + rung nhẹ */
  P6.land = function (uid, c) {
    const pc = PEND.get(uid);
    if (pc) setTimeout(() => pendOff(pc), 0); /* sau tap("D:land") bên dưới */
    if (reduced) return;
    const el = document.querySelector(`#board [data-mc="${uid}"]`), r = el && el.getBoundingClientRect();
    if (!r || !r.width) return;
    const x = r.left + r.width / 2, y = r.bottom - r.height * 0.08;
    ring(x, y, "#d8c8a8", r.width * 1.05, 0.45, 0.7, 0.32);
    ring(x, y, c || "#ffe3a0", r.width * 0.8, 0.35, 0.5, 0.32, 0.05);
    for (let i = 0, n = kN(12); i < n; i++) { const a = rnd(Math.PI * 0.95, Math.PI * 2.05); E6({ x: x + Math.cos(a) * r.width * 0.3, y, vx: Math.cos(a) * rnd(50, 140), vy: Math.sin(a) * rnd(20, 60) - 10, gy: 60, c: i % 2 ? "#b8a888" : "#d8c8a8", kind: 0, s0: rnd(5, 9), s1: 2, drag: 3, dur: rnd(0.35, 0.6), a: 0.45 }); }
    shake(3, 0, 1);
    tap("D:land", { uid });
  };
  P6.clean = function () {
    try { P6.statEnd(); } catch (e) {}
    if (W.HXG) { try { HXG.clean(); } catch (e) {} }
    if (CH) end(CH, true);
    for (const pc of [...PEND.values()]) pendOff(pc);
    for (const k of [...COVER.keys()]) P6.uncover(k, 1);
    document.querySelectorAll(".p6soul,.p6ai,.p6say").forEach((e) => e.remove());
  };
  /* bước đòn: đòn có nguồn là thẻ đang xuất hồn -> nhân vật chính là "đạn" (không bắn thêm đạo cụ/bản sao thẻ), số/nhãn trúng giữ nguyên */
  const SUP = /^(up|down|kill|sil|summon|bounce|reset)$/;
  {
    const r0 = run8;
    run8 = function (s) {
      if (s) s._ran = 1;
      const ch = CH;
      if (ch && !ch.dead && s && s.sp && s.src && s.src === ch.src && SUP.test(s.k) && !s.ong && !s.self29) {
        const d = q8(s, () => (s.nl ? 0 : T8.LIFT) + T8.FLY), g = s.grp;
        s._hitTm = fxT(() => {
          s._hitTm = 0;
          if (s._hit) return;
          s._hit = 1;
          try {
            if (g && g.n > 1) { SAYOFF++; try { q8(s, () => hit8(s)); } finally { SAYOFF--; } if (s.tb && s.k !== "sil") { s.tb.remove(); s.tb = null; } if (g.i === 0) sayGroup11(s); }
            else q8(s, () => hit8(s));
            if (typeof recoil10 === "function" && (s.k === "up" || s.k === "down")) recoil10(tEl8(s.dst), { x: ch.x, y: ch.y }, s.tp);
          } catch (e) { console.error(e); }
        }, d);
        return;
      }
      return r0(s);
    };
  }
  /* chạm màn hình khi chuỗi đang diễn: tua nhanh sạch sẽ */
  P6.skip = function () {
    const ch = CH;
    if (!ch || ch.dead || ch.pending || ch.skipped) return false;
    ch.skipped = 1;
    tap("S:skip", { uid: ch.uid });
    if (W.HXG) { try { HXG.skip(); } catch (e) {} }
    try { noClick = Date.now() + 450; } catch (e) {}
    const P = W.PLAN8;
    if (P && P.tms) {
      for (const [s, tm] of P.tms) {
        if (s._ran) { if (s._hitTm && !s._hit) { clearTimeout(s._hitTm); s._hitTm = 0; s._hit = 1; try { q8(s, () => hit8(s)); } catch (e) { console.error(e); } } continue; }
        clearTimeout(tm); s._ran = 1;
        try { if (s.src === ch.src && SUP.test(s.k) && !s.ong) { s._hit = 1; q8(s, () => hit8(s)); } else run8(s); } catch (e) { console.error(e); }
      }
      clearTimeout(P.pt);
      const steps = P.tms.map((x) => x[0]);
      setTimeout(() => { for (const s of steps) try { post8(s); } catch (e) {} }, 420);
      P.tms = [];
    }
    try { clearTimeout(PWHT); PWH = 0; tickPw(); } catch (e) {}
    try { hold29Info(0); } catch (e) {}
    if (ch.say) { const b = ch.say; ch.say = null; b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" }).onfinish = () => b.remove(); }
    for (const t of ch.tms) clearTimeout(t);
    ch.tms.length = 0;
    try { if (ch.cam) { ch.cam.cancel(); ch.cam = null; } } catch (e) {}
    const H = ch.H;
    if (H) { H.vEnd = 0; clearTimeout(H.tm); H.tm = 0; }
    soulAnim(ch, [{ transform: TF(ch, ch.x, ch.y, ch.r, ch.s) }, { transform: TF(ch, ch.hx, ch.hy, ch.rot, 1) }], 90, "ease-in");
    setPose(ch, ch.hx, ch.hy, ch.rot, 1);
    setTimeout(() => {
      if (CH === ch) relight(ch);
      if (H && HERO === H) { try { heroDown(false); } catch (e) { console.error(e); } }
    }, 100 * SPD);
    try { P6.statEnd(); } catch (e) {}
    try { FX_UNTIL = Math.min(FX_UNTIL, performance.now() + 520 * SPD); } catch (e) {}
    return true;
  };
  document.addEventListener("pointerdown", () => { if (CH && !CH.pending && !CH.dead && !CH.dived) P6.skip(); }, true);
  /* gpu61: bộ công cụ dùng chung cho 16-hx.js (Hồn Xuất vòng 2) */
  P6.kit = { E6, kN, rnd, shake, soulUrl, TF, soulAnim, setPose, fly, after, scheduled, T6, gl, ch: () => CH };
})();
