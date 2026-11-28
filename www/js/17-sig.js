/* ===== Module 17 (gpu67): ẤN KÝ KỸ NĂNG RIÊNG (SIG) =====
   Mỗi thẻ trong bảng REG (khoá = id thẻ) có một màn diễn kỹ năng riêng, theo kiểu Hồn Xuất: đạo cụ (ảnh img/sig/<id>.webp,
   thiếu ảnh -> huy hiệu ảnh thẻ) rời thẻ (hoặc rời hồn PA6 của thẻ S5), tác động lên ĐÚNG mục tiêu thật rồi quay về.
   - Lật: chạy khi có sự kiện skill/rev của thẻ. Duy Trì: chạy khi thẻ vừa lật (lúc hiệu ứng Duy Trì bắt đầu có tác dụng).
   - Kết quả thật (số sức mạnh, tổng điểm làn, năng lượng trên tay, lá mới trên tay, chiến địa…) được giữ/ẩn tới đúng
     "mốc trúng" (T) của màn diễn: dời lịch plan8 qua P6.shift, giữ tổng điểm qua pwHold, ẩn lá mới bằng một luật CSS,
     giữ số năng lượng cũ trên lá trên tay. Không đổi luật chơi.
   - Thẻ S5 đang xuất hồn PA6: đạo cụ bay ra từ hồn; hồn chờ (selfT) tới khi đạo cụ quay về. Thẻ khác: hồn nhỏ ló khỏi thẻ.
   - Nút "Bỏ qua" (gpu71, thay chạm màn hình): tua nhanh (mọi kết quả hiện ngay, lớp phủ dọn sạch). Mức Nhẹ: ít hạt, không hồn nhỏ, không nét mực.
     Giảm chuyển động / tua lượt máy (FFTURN): đường cũ.
   Hiệu năng: DOM chỉ đổi transform/opacity (WAAPI); ánh sáng/hạt/vệt ở lớp WebGL của PA6 (có trần); nét mực ở một canvas
   2D chỉ tồn tại khi đang vẽ. Thêm thẻ: SG.add("<id>", { kind:"rev"|"on", T, dur, run, ... }). */
(function () {
  "use strict";
  const W = window;
  if (!W.P6 || !P6.kit) return;
  const K = P6.kit, SG = {}, VER = "gpu67";
  W.SIGK = SG;
  const tap = (k, o) => { try { if (W.SIG_TAP) W.SIG_TAP(k, o || {}); } catch (e) {} };
  const { glow, ring, star, streaks, converge, beam } = P6.fx;
  const E6 = K.E6, rnd = K.rnd, cols = P6.cols;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const sm = (u) => u * u * (3 - 2 * u), eo = (u) => 1 - Math.pow(1 - u, 2.2), ei = (u) => u * u;
  const ff = () => !!(W.FFTURN && FFTURN.on);
  const lite = () => P6.tier() === "lite";
  const on = () => { try { return !reduced && !!G && !ff(); } catch (e) { return false; } };
  const REG = new Map();
  SG.reg = REG;
  SG.add = (id, def) => { REG.set(id, def); };
  SG.has = (id) => REG.has(id);
  const mcOf = (uid) => document.querySelector(`#board [data-mc="${uid}"]`);
  const hcOf = (uid) => document.querySelector(`#hand [data-hc="${uid}"]`);
  /* hình chữ nhật trên màn hình; bề ngang suy từ chiều cao × tỉ lệ bố cục (lá đang lật quanh trục dọc vẫn đo đúng) */
  const rc = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); if (!b.height) return null; const w = el.offsetHeight ? Math.max(b.width, b.height * el.offsetWidth / el.offsetHeight) : b.width; return w ? { x: b.left + b.width / 2, y: b.top + b.height / 2, w, h: b.height, t: b.top, b: b.bottom } : null; };
  const fl = (x, y, t, c) => { try { FXBIG = true; FX.float(x, y, t, c); } catch (e) {} finally { try { FXBIG = false; } catch (e) {} } };
  const sfx = (k) => { try { SFX.play(k); } catch (e) {} };
  const live = (ms) => { try { holdFx(ms); } catch (e) {} };

  /* ---------- ảnh đạo cụ: img/sig/sig.json kê các id có ảnh; tải + giải mã sẵn ngay khi vào trang ---------- */
  const IMG = new Map(), HAS = new Set();
  const sigUrl = (id) => new URL("img/sig/" + id + ".webp?v=" + VER, document.baseURI).href;
  function pre(id) { if (IMG.has(id)) return; const im = new Image(); im.decoding = "async"; im.src = sigUrl(id); IMG.set(id, im); if (im.decode) im.decode().catch(() => {}); }
  fetch("img/sig/sig.json?v=" + VER).then((r) => (r.ok ? r.json() : [])).then((j) => { for (const k of Array.isArray(j) ? j : Object.keys(j || {})) { HAS.add(k); pre(k); } }).catch(() => {});
  const propImg = (id) => { const im = HAS.has(id) && IMG.get(id); return im && im.complete && im.naturalWidth ? im : null; };
  SG.ready = () => [...REG.keys()].filter((k) => !!propImg(k));
  /* ảnh hồn (tư thế PA6 nếu có, nếu không: ảnh nhân vật đang hiện trên lá) */
  const SOUL = new Map();
  function soulSrc(id, el) {
    let im = SOUL.get(id);
    if (!im && P6.hasPose(id)) { im = new Image(); im.decoding = "async"; im.src = K.soulUrl(id); SOUL.set(id, im); }
    if (im && im.complete && im.naturalWidth) return { src: im.currentSrc || im.src, pose: 1 };
    const a = el && el.querySelector(":scope>img.art");
    return a && a.complete && a.naturalWidth ? { src: a.currentSrc || a.src, pose: 0, fit: getComputedStyle(a).objectFit, pos: getComputedStyle(a).objectPosition } : null;
  }
  try { const w0 = warmMatch12; warmMatch12 = function () { const r = w0.apply(this, arguments); setTimeout(() => { try { for (const sd of ["p", "a"]) for (const z of ["hand", "deck"]) for (const c of (G[z] && G[z][sd]) || []) if (REG.has(c.id)) { pre(c.id); soulSrc(c.id, null); } } catch (e) {} }, 1400); return r; }; } catch (e) {}

  /* ---------- việc đang diễn (tua nhanh / dọn sạch) ---------- */
  const ACT = new Set();
  function job(ms) {
    const j = { els: [], tms: [], fins: [], dead: 0 };
    j.add = (el) => { j.els.push(el); return el; };
    /* t: ms gốc tính từ mốc j.t0 (lúc màn diễn bắt đầu) — gọi lồng trong callback vẫn đúng mốc tuyệt đối */
    j.t0 = performance.now();
    j.at = (t, f) => { const tm = fxT(() => { if (!j.dead) { try { f(); } catch (e) { console.error(e); } } }, Math.max(0, t - (performance.now() - j.t0) / SPD)); j.tms.push(tm); return tm; };
    j.onEnd = (f) => j.fins.push(f);
    j.fin = (fast) => {
      if (j.dead) return;
      j.dead = 1; ACT.delete(j);
      for (const t of j.tms) clearTimeout(t);
      clearTimeout(j.wd);
      for (const f of j.fins) { try { f(!!fast); } catch (e) { console.error(e); } }
      for (const e of j.els) e.remove();
      /* gpu69: hết màn diễn -> không còn nét mực nào được sống (gốc lỗi sót .sgcv khi máy tải nặng) */
      if (!ACT.size) CV.L.length = 0;
      cvGC();
    };
    j.wd = setTimeout(() => j.fin(true), (ms + 2500) * SPD);
    ACT.add(j);
    return j;
  }
  SG.busy = () => ACT.size;

  /* ---------- ẩn lá mới trên tay bằng luật CSS (bền với vẽ lại) ---------- */
  const HS = document.createElement("style");
  HS.id = "sigHide";
  document.head.appendChild(HS);
  const HID = new Set();
  const hsSync = () => { HS.textContent = [...HID].map((u) => `#hand [data-hc="${u}"]`).join(",") + (HID.size ? "{opacity:0!important}" : ""); };
  const hideH = (u) => { HID.add(u); hsSync(); };
  const showH = (u) => { if (HID.delete(u)) hsSync(); };
  function revealH(u, c) {
    if (!HID.has(u)) return;
    showH(u);
    const el = hcOf(u), q = rc(el);
    if (!el || !q) return;
    try { el.animate([{ transform: "translateY(-22px) scale(1.22)", filter: "brightness(1.8)" }, { transform: "translateY(-6px) scale(1.06)", filter: "brightness(1.2)", offset: 0.55 }, { transform: "none", filter: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.3,1)", composite: "add" }); } catch (e) {}
    ring(q.x, q.y, c, q.w * 1.25, 0.4, 0.95);
    glow(q.x, q.y, c, q.w * 1.6, 0.35, 0.6);
    streaks(q.x, q.y, [c, "#ffffff", "#ffe7a0"], lite() ? 6 : 12, 240, 0, 6.283, 0.4, 5);
    sfx("place");
  }

  /* ---------- lớp 2D (nét mực) ---------- */
  const CV = { c: null, x: null, L: [], raf: 0, d: 1, last: 0 };
  function cvOn() {
    if (CV.c) return;
    const c = document.createElement("canvas");
    c.className = "sgcv"; c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    CV.c = c; CV.x = c.getContext("2d");
    CV.d = Math.min(lite() ? 1 : 2, W.devicePixelRatio || 1);
    c.width = Math.round(innerWidth * CV.d); c.height = Math.round(innerHeight * CV.d);
  }
  function cvAdd(p) {
    if (reduced) return null;
    cvOn();
    p.t = 0; p.dead = 0;
    /* gpu69: hạn chót theo đồng hồ thật — máy chậm (khung hình > 50 ms) không làm nét mực sống quá màn diễn */
    p.until = performance.now() + ((p.life || 1) * (SPD || 1) * 1000) + 400;
    CV.L.push(p);
    if (!CV.raf) { CV.last = performance.now(); CV.raf = requestAnimationFrame(cvTick); }
    return p;
  }
  function cvTick(now) {
    CV.raf = 0;
    if (!CV.c) return;
    const dt = Math.min(0.05, (now - CV.last) / 1000) / (SPD || 1), x = CV.x, d = CV.d;
    CV.last = now;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, CV.c.width, CV.c.height); x.setTransform(d, 0, 0, d, 0, 0);
    for (const p of CV.L) {
      if (p.dead) continue;
      p.t += dt;
      const u = Math.min(1, p.t / p.life);
      try { p.draw(x, p, u); } catch (e) { p.dead = 1; }
      if (u >= 1 || now > p.until) p.dead = 1;
    }
    CV.L = CV.L.filter((p) => !p.dead);
    if (CV.L.length) CV.raf = requestAnimationFrame(cvTick);
    else cvGC();
  }
  function cvGC() { if (CV.c && !CV.L.length) { CV.c.remove(); CV.c = null; if (CV.raf) cancelAnimationFrame(CV.raf); CV.raf = 0; } }
  /* nét mực vàng mọc theo prog() (0..1 theo số điểm), mờ dần khi fade() > 0 */
  function inkDraw(x, p) {
    const n = p.pts.length, g = clamp(p.prog(), 0, 1), m = Math.max(2, Math.round(1 + (n - 1) * g)), f = clamp(p.fade(), 0, 1);
    if (f >= 1 || g <= 0) return;
    x.save(); x.lineCap = "round"; x.lineJoin = "round";
    for (const [w, c, al, op] of [[p.w * 3.2, p.c, 0.25, "lighter"], [p.w * 1.25, "#3a2208", 0.85, "source-over"], [p.w, p.c, 0.95, "source-over"], [p.w * 0.35, "#fff6d8", 0.9, "lighter"]]) {
      x.globalCompositeOperation = op; x.globalAlpha = al * (1 - f); x.strokeStyle = c; x.lineWidth = w;
      x.beginPath(); for (let i = 0; i < m; i++) { const q = p.pts[i]; if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); }
      x.stroke();
    }
    x.restore();
  }

  /* ---------- đạo cụ / phần tử DOM ---------- */
  function el0(cls, x, y, w, h, c, html) {
    const d = document.createElement("div");
    d.className = cls;
    d.style.cssText = `left:${(x - w / 2).toFixed(1)}px;top:${(y - h / 2).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;--c:${c || "#ffd65a"}`;
    d._x = x; d._y = y;
    if (html) d.innerHTML = html;
    d.style.opacity = "0";
    document.body.appendChild(d);
    return d;
  }
  /* đạo cụ của thẻ: ảnh img/sig nếu đã giải mã, không thì huy hiệu tròn ảnh nhân vật (không bao giờ là khung rỗng) */
  function prop(P, x, y, s) {
    const im = propImg(P.id);
    let d;
    if (im) d = el0("sgp", x, y, s, s, P.c1, `<img src="${im.currentSrc || im.src}" alt="" draggable="false">`);
    else { const so = soulSrc(P.id, mcOf(P.uid)); d = el0("sgp med", x, y, s * 0.78, s * 0.78, P.c1, so ? `<img src="${so.src}" alt="" draggable="false">` : ""); }
    d._hw = s * 0.42; /* giữ đạo cụ trong màn hình (lá ở mép làn) */
    return d;
  }
  /* huy hiệu tròn (ảnh nhân vật của thẻ uid) */
  function medal(uid, x, y, s, c) {
    const f = E.find(G, uid), id = f ? f.inst.id : null, so = id ? soulSrc(id, mcOf(uid)) : null;
    return el0("sgp med sm", x, y, s, s, c, so ? `<img src="${so.src}" alt="" draggable="false">` : "");
  }
  const TF = (d, p) => `translate(${(p.x - d._x).toFixed(1)}px,${(p.y - d._y).toFixed(1)}px) rotate(${(p.r || 0).toFixed(2)}deg) scale(${((p.s == null ? 1 : p.s) * (p.sx == null ? 1 : p.sx)).toFixed(3)},${((p.s == null ? 1 : p.s) * (p.sy == null ? 1 : p.sy)).toFixed(3)})`;
  /* một hoạt ảnh WAAPI cho cả dòng thời gian của phần tử: pts = [{t,x,y,s,sx,sy,r,o,e}] (t: ms gốc từ lúc bắt đầu) */
  function tl(d, pts, total) {
    pts = pts.slice().sort((a, b) => a.t - b.t);
    if (d._hw) pts = pts.map((p) => { const h = d._hw * (p.s == null ? 1 : p.s); return Object.assign({}, p, { x: clamp(p.x, h + 2, innerWidth - h - 2), y: clamp(p.y, h * 0.7 + 2, innerHeight - h * 0.7 - 2) }); });
    const kf = pts.map((p) => ({ offset: clamp(p.t / total, 0, 1), transform: TF(d, p), opacity: p.o == null ? 1 : p.o, easing: p.e || "linear" }));
    if (kf[0].offset > 0) kf.unshift(Object.assign({}, kf[0], { offset: 0 }));
    if (kf[kf.length - 1].offset < 1) kf.push(Object.assign({}, kf[kf.length - 1], { offset: 1 }));
    for (let i = 1; i < kf.length; i++) if (kf[i].offset < kf[i - 1].offset) kf[i].offset = kf[i - 1].offset;
    d.style.opacity = "";
    return d.animate(kf, { duration: Math.max(16, total), fill: "both" });
  }
  /* cung bay Bezier bậc 2 từ a tới b trong [t0,t1]: trả về các mốc (bỏ điểm đầu) */
  function arc(a, b, lift, t0, t1, o) {
    o = o || {};
    const n = o.n || 10, c = [(a.x + b.x) / 2 + (o.bend || 0), Math.min(a.y, b.y) - lift], out = [], ez = o.ease || sm;
    let px = a.x, py = a.y;
    for (let i = 1; i <= n; i++) {
      const u = i / n, e = ez(u), v = 1 - e, x = v * v * a.x + 2 * v * e * c[0] + e * e * b.x, y = v * v * a.y + 2 * v * e * c[1] + e * e * b.y;
      const r = o.face ? Math.atan2(y - py, x - px) * 57.2958 + (o.face0 || 0) : lerp(o.r0 || 0, o.r1 || 0, e) + (o.wob ? Math.sin(Math.PI * u) * o.wob : 0);
      out.push({ t: t0 + (t1 - t0) * u, x, y, s: lerp(o.s0 == null ? 1 : o.s0, o.s1 == null ? 1 : o.s1, e), r, o: o.o == null ? 1 : o.o });
      px = x; py = y;
    }
    if (o.face && out.length > 1) out[0].r = out[1].r;
    return out;
  }
  const bz = (a, c, b, u) => { const v = 1 - u; return [v * v * a.x + 2 * v * u * c[0] + u * u * b.x, v * v * a.y + 2 * v * u * c[1] + u * u * b.y]; };
  /* hạt dọc đường bay (GPU, có trần) */
  function trail(a, b, lift, t0, t1, L, n) {
    n = lite() ? Math.ceil(n / 2) : n;
    const c = [(a.x + b.x) / 2, Math.min(a.y, b.y) - lift];
    for (let i = 1; i <= n; i++) { const u = i / (n + 1), q = bz(a, c, b, sm(u)); E6({ x: q[0], y: q[1], vx: rnd(-25, 25), vy: rnd(-25, 25), c: L[i % L.length], kind: 0, s0: rnd(6, 11), s1: 1.5, drag: 1.5, dur: 0.32, a: 0.85, delay: (t0 + (t1 - t0) * u) / 1000 }); }
  }
  /* chữ dấu ấn lớn (×2, 0/0, +2…) */
  function stamp(j, x, y, txt, c, size, t, hold) {
    j.at(t, () => {
      const d = j.add(el0("sgx", x, y, 160, size * 1.3, c, `<b style="font-size:${size}px">${esc(txt)}</b>`));
      const H = hold || 520;
      tl(d, [{ t: 0, x, y, s: 2.2, o: 0, e: "cubic-bezier(.2,.9,.3,1.2)" }, { t: 150, x, y, s: 0.92, o: 1 }, { t: 230, x, y, s: 1.05 }, { t: 300, x, y, s: 1 }, { t: 300 + H, x, y: y - 6, s: 1, o: 1, e: "ease-in" }, { t: 300 + H + 200, x, y: y - 18, s: 1.1, o: 0 }], 500 + H);
      fxT(() => d.remove(), 560 + H);
    });
  }
  /* cỡ đạo cụ: theo bề ngang lá trên bàn, tối thiểu 96 px (đủ rõ trên điện thoại) */
  const PS = (P, k) => Math.min(innerWidth * 0.42, Math.max(96, (P.q0 ? P.q0.w : 60) * (k || 1.8)));

  /* ---------- hồn nhỏ ló khỏi thẻ (thẻ không xuất hồn PA6): cùng ảnh nhân vật, nổi lên trên mép lá, cuối màn chui về ---------- */
  function miniSoul(P, j, total) {
    const el = mcOf(P.uid), q = rc(el);
    if (!q) return null;
    const top = { x: q.x, y: q.t - q.h * 0.12 };
    if (lite()) return top;
    const so = soulSrc(P.id, el);
    if (!so) return top;
    const w = q.w * 1.25, h = q.h * 1.25;
    const d = j.add(el0("sgsoul" + (so.pose ? " pose" : ""), q.x, q.y, w, h, P.c1, `<img src="${so.src}" alt="" draggable="false" style="${so.pose ? "" : `object-fit:${so.fit};object-position:${so.pos}`}">`));
    const hy = q.t - h * 0.18, back = Math.max(300, total - 260);
    tl(d, [{ t: 0, x: q.x, y: q.y, s: 0.8, o: 0, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 260, x: q.x, y: hy - 6, s: 1.06, o: 0.95 }, { t: 360, x: q.x, y: hy, s: 1, o: 0.95 }, { t: back, x: q.x, y: hy + 2, s: 1, o: 0.95, e: "ease-in" }, { t: back + 240, x: q.x, y: q.y, s: 0.82, o: 0 }], back + 240);
    glow(q.x, q.y, P.c1, q.w * 1.6, 0.4, 0.6);
    ring(q.x, q.y, P.c2, q.w * 1.2, 0.4, 0.85);
    return { x: q.x, y: hy - h * 0.12 };
  }
  /* điểm phát đạo cụ: hồn PA6 (đang sống) hoặc hồn nhỏ / mép trên lá */
  function srcPt(P) {
    const ch = P6.ch();
    if (ch && !ch.dead && ch.src === P.uid) return { x: ch.x, y: ch.y - ch.bh * ch.s * 0.2, w: ch.bw, chain: 1 };
    if (P.ms) return { x: P.ms.x, y: P.ms.y, w: P.q0 ? P.q0.w : 60 };
    const q = rc(mcOf(P.uid)) || P.q0;
    return q ? { x: q.x, y: q.t - q.h * 0.1, w: q.w } : { x: innerWidth / 2, y: innerHeight / 2, w: 60 };
  }

  /* ---------- năng lượng trên tay: bước "cost" (cost12 / mask29 giữ số cũ) — ngôn ngữ đổi chỉ số chung (P6.stat, 15-pa6.js) ----------
     gpu68 (vis): bỏ ấn ngọc vuông lớn và cú phóng to ô năng lượng 2,2×. Đạo cụ phát một sợi sáng tới ĐÚNG ô năng lượng của từng lá,
     ô số đếm cũ -> mới, nhãn "−1" nhỏ cạnh ô; dưới đạo cụ một bộ đếm gọn "−1 ×n" tăng theo từng lá (nhịp đếm kiểu Tiểu Trạng Nguyên). */
  function costHit(s, src, i) {
    try { unmask29(s); } catch (e) {}
    const el = hcOf(s.hc), c = el && el.querySelector(".cst");
    if (c && P6.stat) { const v1 = parseInt(c.textContent, 10); P6.stat({ el, k: "cost", v0: v1 - (s.d || 0), v1, src: src || null, c: "#5fe0a8", uid: s.hc }); }
    try { SFX.fam(s.d > 0 ? "costup" : "costdn", { el: null }); } catch (e) {}
  }
  const LINK = 200;
  /* sợi sáng từ a tới ô năng lượng của từng lá có năng lượng đổi; ô số đổi ở mốc t0 + i*gap */
  function seals(P, j, a, diffs, t0, gap) {
    const jade = "#5fe0a8";
    const n0 = diffs.length, dd = (diffs[0] && diffs[0].d) || -1, same = diffs.every((x) => x.d === dd);
    let cn = null, k = 0;
    j.at(Math.max(0, t0 - LINK - 60), () => {
      const txt = same ? (dd > 0 ? "+" : "−") + Math.abs(dd) + " năng lượng" : "đổi năng lượng";
      cn = j.add(el0("sgx sm sgct", a.x, a.y + 30, 150, 24, jade, `<b>${esc(txt)} <em>×0</em></b>`));
      tl(cn, [{ t: 0, x: a.x, y: a.y + 30, s: 0.6, o: 0 }, { t: 140, x: a.x, y: a.y + 26, s: 1, o: 1 }, { t: LINK + 60 + n0 * gap + 520, x: a.x, y: a.y + 24, s: 1, o: 1 }, { t: LINK + 60 + n0 * gap + 760, x: a.x, y: a.y + 14, s: 0.9, o: 0 }], LINK + 60 + n0 * gap + 760);
    });
    diffs.forEach((st, i) => {
      j.at(t0 - LINK + i * gap, () => {
        const el = hcOf(st.hc), q = rc(el);
        if (!q) { P.hit(st); return; }
        const cs = el.querySelector(".cst"), cb = cs ? cs.getBoundingClientRect() : null, b = cb && cb.width ? { x: cb.left + cb.width / 2, y: cb.top + cb.height / 2 } : { x: q.x - q.w * 0.3, y: q.t + 10 };
        trail(a, b, 50, 0, LINK, [jade, "#ffffff", "#c8ffe8"], 4);
        st._sigSrc = a;
        P.hit(st);
        j.at(t0 + i * gap, () => {
          k++;
          if (cn) { const e = cn.querySelector("em"); if (e) { e.textContent = "×" + k; try { e.animate([{ transform: "scale(1.5)" }, { transform: "scale(1)" }], { duration: 200, easing: "cubic-bezier(.2,.8,.3,1)" }); } catch (x) {} } }
          if (!lite()) star(a.x, a.y, "#ffffff", 40, 0.18);
          sfx("place");
          tap("sig:seal", { id: P.id, u: st.hc });
        });
      });
    });
  }

  /* ---------- trạng thái của bước đang chạy ---------- */
  let PEND = null;
  const CLM = new Set();
  const hitT = (s) => { try { return q8(s, () => { const t0 = s.t0 || 0; if (s.k === "move" || s.k === "swap") return t0 + mvDur9(s) * 0.85; if (s.k === "top") return t0 + topHit29(s); if (s.k === "loc") return t0 + T8.LIFT + 620; if (s.k === "ult29" || s.k === "lshield") return null; return t0 + (s.sp ? (s.nl ? 0 : T8.LIFT) + T8.FLY : 0); }); } catch (e) { return s.t0 || 0; } };
  const s0Of = (P) => { const ch = P6.ch(); return ch && !ch.dead && ch.src === P.uid && ch.off0 ? ch.off0 + 20 : 40; };
  function hitOwn(s) {
    if (!s || s._sigHit) return;
    s._sigHit = 1; s._hit = 1; s._ran = 1;
    if (s.k === "top" || s.k === "ult29") return; /* gpu69: bước lá trên cùng / màn ra mắt do màn diễn riêng tự vẽ */
    try { if (s.k === "loc") locHit(s); else if (s.k === "cost" && s.hc) costHit(s, s._sigSrc); else q8(s, () => hit8(s)); } catch (e) { console.error(e); }
  }
  function locHit(s) {
    if (s.ov) { const o = s.ov; s.ov = null; try { const a = o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }); a.onfinish = () => o.remove(); } catch (e) { o.remove(); } fxT(() => o.remove(), 400); }
    try { pulse(`#board [data-lane="${s.li}"] .locw`, [{ transform: "scale(.88)", opacity: 0.5 }, { transform: "scale(1.06)", opacity: 1, offset: 0.6 }, { transform: "scale(1)" }], 520); } catch (e) {}
    try { SFX.fam("locx", { el: elU(s.src) }); } catch (e) {}
  }

  /* gpu69 (làn A): bảng phụ SG.x — màn diễn riêng của các thẻ khác (Cự Long Cổ, Tiểu Long, Chiến Thần…) và màn diễn chung
     theo tình huống (match). Không tính vào bảng 12 ấn ký (SG.reg). kind: "rev" | "on" | "end" | "act" | "react". */
  const XREG = new Map();
  SG.x = XREG;
  SG.addX = (id, def) => { XREG.set(id, def); };
  function mkP(e, inst, li, def, evs, R0, P0) {
    const { c1, c2, L } = cols(inst.id);
    const q0 = (R0 && R0.get(e.uid)) || null;
    return { uid: e.uid, id: inst.id, inst, li, side: inst.side || inst.own, mine: (inst.side || inst.own) === "p", def, evs, R0, P0, c1, c2, L, q0, owned: [], delay: 0, dead: 0, ev: e };
  }
  function detectX(evs, R0, P0) {
    if (!XREG.size) return null;
    for (const e of evs) {
      let kind = "";
      if (e.k === "skill" && /^(rev|end|act|react)$/.test(e.t)) kind = e.t;
      else if (e.k === "act") kind = "act";
      else if (e.k === "flip") kind = "on";
      else continue;
      let inst = null, li = -1;
      const f = E.find(G, e.uid);
      if (f) { inst = f.inst; li = f.li; } else if (kind === "react") { try { inst = anyC(e.uid); } catch (x) {} }
      if (!inst) continue;
      if (kind !== "react" && (!inst.rev || inst.sil)) continue;
      const id = kind === "react" && e.id ? e.id : inst.id, def = XREG.get(id);
      if (!def || def.match) continue;
      if (![].concat(def.kind).includes(kind)) continue;
      const P = mkP(e, inst, li, def, evs, R0, P0);
      if (def.prep && def.prep(P) === false) continue;
      timing(P);
      return P;
    }
    for (const [key, def] of XREG) {
      if (!def.match) continue;
      let m = null;
      try { m = def.match(evs, R0, P0); } catch (x) { console.error(x); }
      if (!m || !m.inst) continue;
      const P = mkP(m.ev || { uid: m.inst.uid }, m.inst, m.li == null ? -1 : m.li, def, evs, R0, P0);
      P.key = key; Object.assign(P, m.extra || {});
      if (def.prep && def.prep(P) === false) continue;
      timing(P);
      return P;
    }
    return null;
  }

  /* phát hiện thẻ có ấn ký trong bước */
  function detect(evs, R0, P0) {
    const px = detect0(evs, R0, P0);
    if (px) return px;
    return detectX(evs, R0, P0);
  }
  function detect0(evs, R0, P0) {
    for (const e of evs) {
      let kind = "";
      if (e.k === "skill" && e.t === "rev") kind = "rev";
      else if (e.k === "flip") kind = "on";
      else continue;
      const f = E.find(G, e.uid);
      if (!f || !f.inst.rev || f.inst.sil) continue;
      const inst = f.inst, def = REG.get(inst.id);
      if (!def || def.kind !== kind) continue;
      if (kind === "on" && E.ab(inst) !== inst.id) continue;
      const q0 = R0 && R0.get(e.uid);
      const { c1, c2, L } = cols(inst.id);
      const P = { uid: e.uid, id: inst.id, inst, li: f.li, side: inst.side, mine: inst.side === "p", def, evs, R0, P0, c1, c2, L, q0, owned: [], delay: 0, dead: 0 };
      if (def.prep && def.prep(P) === false) continue;
      timing(P);
      return P;
    }
    return null;
  }

  /* ---------- móc vào lõi diễn ---------- */
  {
    const pc0 = playFxCore;
    playFxCore = function (evs, R0, P0, part) {
      if (part === 1 || !on() || PEND) return pc0.apply(this, arguments);
      let P = null;
      try { P = detect(evs, R0, P0); } catch (e) { console.error(e); P = null; }
      if (!P) return pc0.apply(this, arguments);
      /* chuẩn bị: giữ năng lượng cũ trên tay, ẩn lá mới (nếu màn diễn tự đưa lá vào tay) */
      try {
        if (P.def.hand && (P.mine || P.def.hand === 2)) for (const c of G.hand.p) if (!HAND0.has(c.uid)) { CLM.add(c.uid); hideH(c.uid); }
        P.newHand = [...CLM];
      } catch (e) { console.error(e); }
      /* lá mới do màn diễn tự đưa vào tay: tắt hiệu ứng "tạo thẻ vào tay" mặc định (fx7) cho đúng các lá đó */
      const X = evs.x7, hn0 = X && X.hnew ? { p: X.hnew.p, a: X.hnew.a } : null;
      if (hn0 && P.def.hand) { X.hnew.p = (hn0.p || []).filter((u) => !CLM.has(u)); if (P.def.hand === 2) X.hnew.a = []; }
      PEND = P;
      let r;
      try { r = pc0.apply(this, arguments); }
      finally { PEND = null; CLM.clear(); if (hn0) { X.hnew.p = hn0.p; X.hnew.a = hn0.a; } }
      try {
        P.diffs = P.owned.filter((s) => s.k === "cost" && s.hc);
        launch(P);
      } catch (e) { console.error(e); for (const u of P.newHand || []) showH(u); for (const s of P.owned) hitOwn(s); }
      return r;
    };
  }
  /* lá mới do màn diễn đưa vào tay: bỏ hoạt ảnh rút bài mặc định (lá ẩn tới khi đạo cụ tới nơi) */
  for (const k of ["drawIn", "drawFrom"]) {
    const f0 = CFX[k];
    if (typeof f0 !== "function") continue;
    CFX[k] = function (el) {
      try { const u = +(el && el.dataset.hc); if (u && CLM.has(u)) { el.style.opacity = ""; return; } } catch (e) {}
      return f0.apply(this, arguments);
    };
  }
  /* dời lịch plan8: mốc trúng đầu tiên của bước = mốc trúng của màn diễn (T); bước "của riêng" màn diễn do màn diễn tự đánh */
  {
    const sh0 = P6.shift;
    P6.shift = function (steps) {
      const x = sh0.apply(this, arguments) || 0;
      const P = PEND;
      if (!P || P.shifted) return x;
      P.shifted = 1;
      let D = 0;
      try {
        const S0 = s0Of(P), Cl = S0 + P.T;
        for (const s of steps) if (P.def.own && P.def.own(s, P)) { s.sigOwn = P; P.owned.push(s); }
        let h = Infinity;
        for (const s of steps) { if (s.sigOwn) continue; const v = hitT(s); if (v != null && isFinite(v)) h = Math.min(h, v); }
        if (isFinite(h)) { if (h < Cl) D = Cl - h; else P.delay = Math.min(1500, h - Cl); }
        if (D > 0) {
          for (const s of steps) s.t0 = (s.t0 || 0) + D;
          const ch = P6.ch();
          if (ch && !ch.dead && ch.pending) { for (const q of ch.oth || []) q.h += D; if (ch.selfT != null) ch.selfT += D; }
        }
        const at = Cl + P.delay;
        for (const s of P.owned) s.t0 = Math.max(s.t0 || 0, at);
        P.D = D;
        tap("sig:shift", { id: P.id, D, delay: P.delay, own: P.owned.length });
      } catch (e) { console.error(e); }
      return x + D;
    };
  }
  /* hồn PA6 của thẻ có ấn ký chờ tới khi đạo cụ quay về rồi mới chui vào khung */
  {
    const pl0 = P6.plan;
    P6.plan = function (H) {
      const P = PEND, ch = P6.ch();
      try {
        if (P && ch && !ch.dead && ch.pending && ch.src === P.uid) {
          const end = (ch.off0 || 0) + 20 + P.delay + P.dur + P6.T.RET * 0.2 + P6.T.DIVE * 0.2;
          ch.selfT = Math.max(ch.selfT == null ? 0 : ch.selfT, end);
          P.chain = 1;
        }
      } catch (e) { console.error(e); }
      return pl0.apply(this, arguments);
    };
  }
  /* tổng điểm làn: giữ tới mốc trúng (thẻ nhân đôi tổng) */
  {
    const pw0 = pwHold;
    pwHold = function (ms) {
      const P = PEND;
      if (P && P.def.pw) { try { ms = Math.max(+ms || 0, s0Of(P) + P.T + 30); P.pwHeld = 1; } catch (e) {} }
      return pw0.call(this, ms);
    };
    SG._pw0 = pw0;
  }
  /* đổi số lượt do màn diễn (U Minh): băng "THÊM LƯỢT" chờ tới sau mốc trúng */
  {
    const tf0 = turnFlare;
    turnFlare = function (n, o) {
      const P = PEND;
      if (P && P.def.lateTurn) { const at = s0Of(P) + P.T + 520; fxT(() => { try { tf0(n, o); } catch (e) {} }, at); live(at + 800); return; }
      return tf0.apply(this, arguments);
    };
  }
  /* bước "của riêng" màn diễn: không bắn đạn mặc định, màn diễn tự gọi hit ở đúng nhịp */
  {
    const r8 = run8;
    run8 = function (s) {
      if (s && s.sigOwn) { s._ran = 1; if (s.sigOwn.dead) hitOwn(s); return; }
      return r8.apply(this, arguments);
    };
  }

  /* ---------- chạy màn diễn ---------- */
  function launch(P) {
    const def = P.def;
    P.T = P.T || 0;
    if (def.late) { try { def.late(P); } catch (e) { console.error(e); } }
    /* dur có thể phụ thuộc số lá đổi năng lượng (chỉ biết sau khi bàn vẽ kết quả) */
    if (typeof def.dur === "function") P.dur = def.dur(P);
    const S0 = s0Of(P), st = S0 + (P.delay || 0), total = P.dur;
    const j = job(st + total);
    P.j = j;
    P.hit = (s) => hitOwn(s);
    j.onEnd((fast) => {
      P.dead = 1;
      for (const s of P.owned) hitOwn(s);
      for (const u of P.newHand || []) { if (fast) showH(u); else revealH(u, P.c1); }
      if (P.pwHeld && fast) { try { SG._pw0(0); } catch (e) {} }
      tap("sig:end", { id: P.id, fast: !!fast });
    });
    live(st + total + 120);
    tap("sig", { id: P.id, uid: P.uid, chain: !!P.chain, st, T: P.T, total });
    j.at(st, () => {
      j.t0 = performance.now();
      P.q0 = rc(mcOf(P.uid)) || P.q0;
      if (!P.chain) P.ms = miniSoul(P, j, total);
      try { def.run(P, j, total); } catch (e) { console.error(e); }
      /* gpu68-audit2: mốc trúng chỉ rơi vào CHÍNH thẻ (Trí Nữ đếm, Đồ Thần đếm, Vua Bóng khi chỉ chính nó đổi) -> self:1 */
      const selfHit = !!def.selfHit || (P.owned.length > 0 && P.owned.every((s) => s.dst === P.uid));
      j.at(P.T, () => tap("sig:hit", { id: P.id, self: selfHit ? 1 : 0 }));
      j.at(total, () => j.fin(false));
    });
  }
  /* T và dur (ms gốc) tính lúc phát hiện để dời lịch đúng */
  function timing(P) { P.T = typeof P.def.T === "function" ? P.def.T(P) : P.def.T; P.dur = typeof P.def.dur === "function" ? P.def.dur(P) : P.def.dur; }

  /* nút "Bỏ qua": tua nhanh màn diễn (chuỗi PA6 nếu có tự tua phần của nó) */
  /* gpu71 (L1): bỏ chạm-màn-hình-để-tua; chỉ nút "Bỏ qua" (06 FFTURN.skipNow) */
  if (W.FFTURN && FFTURN.reg) FFTURN.reg(() => {
    if (!ACT.size) return;
    const chainLive = (() => { try { const ch = P6.ch(); return !!(ch && !ch.dead); } catch (e) { return false; } })();
    for (const j of [...ACT]) j.fin(true);
    if (!chainLive) {
      const Pl = W.PLAN8;
      if (Pl && Pl.tms && Pl.tms.length) {
        for (const [s, tm] of Pl.tms) {
          if (s._ran) continue;
          clearTimeout(tm); s._ran = 1;
          try { if (s.k === "copy" || s.k === "steal") q8(s, () => hit8(s)); else run8(s); } catch (e) { console.error(e); }
        }
        clearTimeout(Pl.pt);
        const steps = Pl.tms.map((x) => x[0]);
        setTimeout(() => { for (const s of steps) try { post8(s); } catch (e) {} }, 420);
        Pl.tms = [];
      }
      try { clearTimeout(PWHT); PWH = 0; tickPw(); } catch (e) {}
      try { hold29Info(0); } catch (e) {}
    }
    try { P6.statEnd(); } catch (e) {}
    try { FX_UNTIL = Math.min(FX_UNTIL, performance.now() + 520 * SPD); } catch (e) {}
    tap("sig:skip", {});
  });
  SG.clean = () => { for (const j of [...ACT]) j.fin(true); HID.clear(); hsSync(); document.querySelectorAll(".sgp,.sgsoul,.sga,.sgx,.sgseal,.sgvx,.sgbk,.sgsw,.sgcv").forEach((e) => e.remove()); CV.L.length = 0; cvGC(); };

  /* ============================== 12 MÀN DIỄN ============================== */
  /* khung chung: đạo cụ hiện ở điểm phát (0–260), làm việc, quay về chui vào thẻ ở cuối (total) */
  function appear(P, j, d, a, s, total, back) {
    const k = [{ t: 0, x: a.x, y: a.y + 10, s: s * 0.3, o: 0, e: "cubic-bezier(.2,.9,.3,1.3)" }, { t: 200, x: a.x, y: a.y - 6, s: s * 1.1, o: 1 }, { t: 260, x: a.x, y: a.y, s }];
    glow(a.x, a.y, P.c1, (P.q0 ? P.q0.w : 60) * 1.6, 0.4, 0.7);
    ring(a.x, a.y, P.c2, (P.q0 ? P.q0.w : 60) * 1.1, 0.4, 0.9);
    if (!lite()) converge(a.x, a.y, P.L, 16, 70, 0.26);
    sfx("whoosh");
    return k;
  }
  function home(P, from, t0, t1, s) {
    const b = srcPt(P);
    return [...arc(from, b, 40, t0, t1 - 90, { s0: s, s1: s * 0.8 }), { t: t1, x: b.x, y: b.y + 18, s: s * 0.35, o: 0, e: "ease-in" }];
  }
  const lanePlate = (li) => { try { return plate8(li); } catch (e) { return null; } };
  const laneRect = (li) => rc(document.querySelector(`#board [data-lane="${li}"]`));
  const pwOf = (li, side) => document.querySelector(`#board [data-lane="${li}"] .pw.${side}`);
  const cardIdOf = (uid) => { try { const f = E.find(G, uid); return f ? f.inst.id : null; } catch (e) { return null; } };
  const nm = (id) => (id && C[id] ? C[id].n : "");
  const short = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

  /* 1. Nữ Phán Quan — Duy Trì: thẻ ≤1 sức mạnh giảm 1 năng lượng. Cân công lý nghiêng, ấn ngọc bích đóng lên từng lá. */
  const ownCost = (s) => s.k === "cost" && !!s.hc;
  SG.add("nuphanquan", {
    kind: "on", T: 860, own: ownCost,
    dur: (P) => 1300 + Math.max(0, ((P.diffs || []).length || 3) - 1) * 130,
    run(P, j, total) {
      const a = srcPt(P), w = P.q0 ? P.q0.w : 60, s = 1, sz = PS(P, 1.76), up = { x: a.x, y: a.y - sz * 0.25 };
      const d = j.add(prop(P, up.x, up.y, sz));
      const k = appear(P, j, d, up, s, total);
      k.push({ t: 360, x: up.x, y: up.y, r: -14, s, e: "ease-in-out" }, { t: 520, x: up.x, y: up.y, r: 10, s }, { t: 660, x: up.x, y: up.y, r: -4, s }, { t: 760, x: up.x, y: up.y, r: 0, s });
      const diffs = P.diffs || [];
      const endT = 900 + Math.max(0, diffs.length - 1) * 130 + 200;
      k.push({ t: Math.min(total - 260, endT), x: up.x, y: up.y, s }, ...home(P, up, Math.min(total - 260, endT), total, s));
      tl(d, k, total);
      j.at(360, () => { ring(up.x, up.y + sz * 0.3, "#5fe0a8", sz * 1.1, 0.5, 0.8, 0.35); glow(up.x, up.y, "#5fe0a8", sz * 1.3, 0.5, 0.55); });
      if (diffs.length) seals(P, j, { x: up.x, y: up.y + sz * 0.2 }, diffs, P.T, 130, total);
      else j.at(P.T, () => {
        const h = rc(document.getElementById(P.mine ? "hand" : "avFoe"));
        if (h) { ring(h.x, h.y, "#5fe0a8", Math.min(innerWidth * 0.8, h.w * 0.8), 0.6, 0.8, 0.35); glow(h.x, h.y, "#5fe0a8", 120, 0.5, 0.5); }
        fl(up.x, up.y - sz * 0.5, "Thẻ ≤1 sức mạnh: −1 năng lượng", "#9dffd2");
      });
    },
  });

  /* 2. Thiện Xạ — Lật: thêm 2 Mũi Tên vào tay. Cung bật ra, hai mũi tên sáng bay vòng vào tay thành hai lá. */
  let ARW = null;
  function arrowUrl() {
    if (ARW) return ARW;
    const c = document.createElement("canvas"), w = 150, h = 30;
    c.width = w * 2; c.height = h * 2;
    const x = c.getContext("2d");
    x.scale(2, 2);
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "rgba(255,240,180,0)"); g.addColorStop(0.35, "#ffe7a0"); g.addColorStop(1, "#ffffff");
    x.shadowColor = "#ffd65a"; x.shadowBlur = 8;
    x.strokeStyle = g; x.lineWidth = 3.2; x.lineCap = "round"; x.beginPath(); x.moveTo(14, h / 2); x.lineTo(w - 22, h / 2); x.stroke();
    x.fillStyle = "#fff8e0"; x.beginPath(); x.moveTo(w - 2, h / 2); x.lineTo(w - 26, h / 2 - 8); x.lineTo(w - 20, h / 2); x.lineTo(w - 26, h / 2 + 8); x.closePath(); x.fill();
    x.fillStyle = "#ffb84d"; for (const sy of [-1, 1]) { x.beginPath(); x.moveTo(26, h / 2); x.lineTo(8, h / 2 + sy * 9); x.lineTo(16, h / 2); x.closePath(); x.fill(); x.beginPath(); x.moveTo(36, h / 2); x.lineTo(18, h / 2 + sy * 9); x.lineTo(26, h / 2); x.closePath(); x.fill(); }
    return (ARW = c.toDataURL());
  }
  SG.add("nuthantien", {
    kind: "rev", hand: 1, T: 800, dur: 1180,
    run(P, j, total) {
      const a0 = srcPt(P), a = { x: a0.x, y: a0.chain ? a0.y - 30 : a0.y }, w = P.q0 ? P.q0.w : 60, im = propImg(P.id), aw = PS(P, 2.1), ah = im ? aw * im.naturalHeight / im.naturalWidth : aw * 0.2;
      const src = im ? im.currentSrc || im.src : arrowUrl();
      /* mũi tên thần hiện trên đầu (mũi hướng lên), gồng sáng rồi tách thành hai mũi bay vào tay */
      const d = j.add(el0("sga" + (im ? " pic" : ""), a.x, a.y, aw, ah, P.c1, `<img src="${src}" alt="" draggable="false">`));
      appear(P, j, d, a, 1, total);
      tl(d, [{ t: 0, x: a.x, y: a.y + 12, s: 0.3, r: -90, o: 0, e: "cubic-bezier(.2,.9,.3,1.3)" }, { t: 220, x: a.x, y: a.y - 8, s: 1.1, r: -90 }, { t: 300, x: a.x, y: a.y, s: 1, r: -90 }, { t: 380, x: a.x, y: a.y + 6, s: 0.96, r: -90, e: "ease-in" }, { t: 430, x: a.x, y: a.y - 10, s: 1.25, r: -90, o: 0 }], 430);
      j.at(300, () => { glow(a.x, a.y, "#ffe7a0", aw * 1.1, 0.3, 0.8); if (!lite()) converge(a.x, a.y, ["#ffe7a0", P.c1, "#ffffff"], 14, aw * 0.6, 0.12); });
      const tg = [];
      for (const u of P.newHand || []) tg.push({ u });
      if (!tg.length) { const z = zpt(P.mine ? "hand" : "avFoe"); if (z) tg.push({ z }, { z }); }
      /* gpu69 (A-33): mỗi mũi tên bay đúng hình của LOẠI mũi tên được thêm (Thực Cốt Tiễn axit xanh, Câu Liêm Tiễn móc, Như Ý Tiễn xoắn,
         Trúc Tiễn = mũi tên trúc mặc định), nhãn tên riêng từng mũi */
      const ARK = { tenaxit: { a: -42, c: "#9dff5a" }, tenmoc: { a: -36, c: "#ffd27a" }, tenthuphong: { a: -52, c: "#7fdcff" }, tenthuong: { c: "#ffe7a0" } };
      tg.slice(0, 2).forEach((g, i) => {
        const t0 = 400 + i * 110, t1 = P.T + i * 110;
        j.at(t0, () => {
          const q = g.u ? rc(hcOf(g.u)) || zpt("hand") : g.z;
          if (!q) return;
          const aid = g.u ? cardIdOf(g.u) || ((G.hand.p.find((c) => c.uid === g.u) || {}).id) : null, ak = aid && ARK[aid], own = ak && ak.a != null;
          const asrc = own ? new URL("img/c/" + aid + ".webp", document.baseURI).href : src, aC = (ak && ak.c) || P.c1;
          const b = { x: q.x, y: q.y }, lift = Math.max(70, Math.abs(b.y - a.y) * 0.3), bend = (i ? 1 : -1) * Math.min(90, innerWidth * 0.18);
          const s1 = 0.62, w2 = own ? aw * 0.62 : aw, h2 = own ? aw * 0.62 : ah, f0 = own ? -ak.a : 0;
          const ar = j.add(el0("sga" + (im || own ? " pic" : "") + (own ? " own" : ""), a.x, a.y, w2, h2, aC, `<img src="${asrc}" alt="" draggable="false">`));
          tl(ar, [{ t: 0, x: a.x, y: a.y, s: 0.9, o: 0, r: -90 + f0 }, { t: 40, x: a.x, y: a.y - 4, s: 0.9, o: 1, r: -90 + f0 }, ...arc({ x: a.x, y: a.y - 4 }, b, lift, 40, t1 - t0, { face: 1, face0: f0, s0: 0.9, s1: s1, n: 14, bend, ease: (u) => 1 - Math.pow(1 - u, 1.6) }), { t: t1 - t0 + 80, x: b.x, y: b.y, s: 0.25, o: 0 }], t1 - t0 + 80);
          trail(a, b, lift, 40, t1 - t0, [aC, "#ffe7a0", "#ffffff"], 10);
          if (aid) j.at(t1, () => fl(b.x, b.y - 50 - i * 22, nm(aid), aC));
          sfx("whoosh");
          j.at(t1, () => {
            if (g.u) revealH(g.u, "#ffd65a"); else ring(b.x, b.y, "#ffd65a", 60, 0.4, 0.9);
            star(b.x, b.y, "#ffffff", 70, 0.25);
            if (!aid && (i === 1 || tg.length === 1)) fl(b.x, b.y - 50, "+2 Mũi Tên", "#ffe7a0");
            tap("sig:arrow", { id: P.id, i, a: aid });
          });
        });
      });
    },
  });

  /* 3. Tiểu Trạng Nguyên — Lật: +2 cho mỗi giá trị sức mạnh khác nhau. Cuộn sớ mở trên chiến địa, từng giá trị sáng lên và đếm +2. */
  SG.add("trinu", {
    kind: "rev", selfHit: 1, T: (P) => 520 + P.groups.length * 190 + 160, dur: (P) => 520 + P.groups.length * 190 + 160 + 520,
    prep(P) {
      const m = new Map();
      for (const sd of E.SIDES) for (const c of G.locs[P.li].cards[sd]) {
        if (c === P.inst || !c.rev) continue;
        const v = P.P0 && P.P0.has(c.uid) ? P.P0.get(c.uid) : E.power(G, c, P.li);
        if (!m.has(v)) m.set(v, []);
        m.get(v).push(c.uid);
      }
      P.groups = [...m.entries()].sort((a, b) => a[0] - b[0]).slice(0, 8);
    },
    run(P, j, total) {
      const a = srcPt(P), pl = lanePlate(P.li), lr = laneRect(P.li), w = P.q0 ? P.q0.w : 60;
      const bim0 = propImg(P.id), sw = Math.min(innerWidth * (bim0 ? 0.5 : 0.62), Math.max(130, (lr ? lr.w : 140) * (bim0 ? 1.05 : 1.25))), sh = sw * (bim0 ? 0.88 : 0.62);
      const c = pl ? { x: clamp(pl.x, sw / 2 + 4, innerWidth - sw / 2 - 4), y: pl.y } : { x: a.x, y: a.y - 80 };
      const d = j.add(prop(P, a.x, a.y, Math.max(70, w * 1.3)));
      const k = appear(P, j, d, a, 1, total);
      /* đạo cụ bay lên chiến địa rồi thành cuộn sớ lớn (lớp .sgscroll) */
      k.push(...arc(a, c, 40, 260, 480, { s0: 1, s1: 1.2 }), { t: 560, x: c.x, y: c.y, s: 0.2, o: 0 }, { t: total - 380, x: c.x, y: c.y, s: 0.2, o: 0 }, { t: total - 300, x: c.x, y: c.y, s: 1.1, o: 1 }, ...home(P, c, total - 300, total, 1.1));
      tl(d, k, total);
      const bim = propImg(P.id), sc = j.add(el0("sgscroll" + (bim ? " pic" : ""), c.x, c.y, sw, sh, P.c1, (bim ? `<img src="${bim.currentSrc || bim.src}" alt="">` : `<i class="sgsr"></i>`) + `<b class="sgcnt">+0</b>`));
      const cnt = sc.querySelector(".sgcnt");
      tl(sc, [{ t: 0, x: c.x, y: c.y, s: 0.9, sx: 0.08, o: 0 }, { t: 460, x: c.x, y: c.y, s: 0.9, sx: 0.08, o: 0 }, { t: 500, x: c.x, y: c.y, s: 1, sx: 0.12, o: 1, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 700, x: c.x, y: c.y, s: 1, sx: 1 }, { t: P.T + 80, x: c.x, y: c.y, s: 1, sx: 1, e: "ease-in" }, { t: P.T + 340, x: c.x, y: c.y, s: 0.95, sx: 0.1, o: 0 }], total);
      j.at(480, () => { glow(c.x, c.y, "#ffe7a0", sw * 0.9, 0.5, 0.55); sfx("whoosh"); });
      P.groups.forEach(([v, us], i) => {
        const t = 700 + i * 190;
        j.at(t, () => {
          for (const u of us) {
            const q = rc(mcOf(u));
            if (!q) continue;
            ring(q.x, q.y, "#ffe7a0", q.w * 1.15, 0.38, 0.95);
            glow(q.x, q.y, "#ffd65a", q.w * 1.5, 0.35, 0.6);
            beam(q.x, q.t + 6, c.x, c.y, "#ffe7a0", 5, 0.25);
            const n = j.add(el0("sgx sm", q.x, q.t + 8, 40, 26, "#ffd65a", `<b>${esc(String(v))}</b>`));
            tl(n, [{ t: 0, x: q.x, y: q.t + 8, s: 0.4, o: 0 }, { t: 90, x: q.x, y: q.t - 4, s: 1.25, o: 1 }, ...arc({ x: q.x, y: q.t - 4 }, { x: c.x, y: c.y }, 30, 90, 260, { s0: 1.25, s1: 0.7 }), { t: 300, x: c.x, y: c.y, s: 0.5, o: 0 }], 300);
            fxT(() => n.remove(), 360);
          }
          j.at(t + 260, () => {
            cnt.textContent = "+" + 2 * (i + 1);
            try { cnt.animate([{ transform: "scale(1.7)" }, { transform: "scale(1)" }], { duration: 220, easing: "cubic-bezier(.2,.8,.3,1)" }); } catch (e) {}
            star(c.x, c.y, "#ffffff", sw * 0.3, 0.22);
            sfx("place");
          });
        });
      });
      /* mốc trúng: con số bay từ cuộn sớ vào thẻ (bước tự cộng của thẻ trúng đúng lúc này) */
      j.at(P.T - 160, () => {
        const q = rc(mcOf(P.uid)) || a;
        const n = j.add(el0("sgx", c.x, c.y, 110, 44, "#ffd65a", `<b>+${2 * P.groups.length}</b>`));
        tl(n, [{ t: 0, x: c.x, y: c.y, s: 1.4, o: 1 }, ...arc(c, q, 40, 0, 160, { s0: 1.4, s1: 0.8 }), { t: 220, x: q.x, y: q.y, s: 0.4, o: 0 }], 220);
        fxT(() => n.remove(), 280);
        trail(c, q, 40, 0, 160, ["#ffd65a", "#ffffff"], 6);
      });
      j.at(P.T, () => { const q = rc(mcOf(P.uid)); if (q) { ring(q.x, q.y, "#ffd65a", q.w * 1.3, 0.45, 0.95); streaks(q.x, q.y, ["#ffd65a", "#ffffff", P.c1], 14, 260, 0, 6.283, 0.45, 5); } });
    },
  });

  /* 4. Thiên Diện — Lật: chép kỹ năng Duy Trì của thẻ vừa đặt. Mặt nạ bay tới soi gương, ấn ký kỹ năng bay về in lên Thiên Diện. */
  SG.add("thiendien", {
    kind: "rev", T: 1000, dur: (P) => 1360 + ((P.diffs || []).length ? 260 + 120 * (P.diffs || []).length : 0),
    prep(P) {
      const e = P.evs.find((x) => x.k === "abcopy" && x.uid === P.uid && x.from && !x.st);
      if (!e) return false;
      P.from = e.from;
    },
    own: (s, P) => (s.k === "copy" && s.src === P.uid) || ownCost(s),
    run(P, j, total) {
      const a = srcPt(P), w = P.q0 ? P.q0.w : 60, sz = PS(P, 1.62);
      const tq = rc(mcOf(P.from)) || a, tp = { x: tq.x, y: tq.y - (tq.h || 80) * 0.62 };
      const d = j.add(prop(P, a.x, a.y, sz));
      const k = appear(P, j, d, a, 1, total);
      k.push(...arc(a, tp, 70, 260, 560, { s0: 1, s1: 1.1, wob: 8 }), { t: 640, x: tp.x, y: tp.y, s: 1.18, r: -6 }, { t: 760, x: tp.x, y: tp.y, s: 1.1, r: 4 }, ...arc(tp, a, 60, 780, P.T - 40, { s0: 1.1, s1: 1 }), { t: P.T + 60, x: a.x, y: a.y, s: 1.15 });
      k.push(...home(P, a, P.T + 120, total, 1));
      tl(d, k, total);
      trail(a, tp, 70, 260, 560, P.L, 8);
      /* soi gương: bản phản chiếu (ảnh mục tiêu, lật ngang) hiện sau mặt nạ */
      j.at(560, () => {
        const te = mcOf(P.from), so = soulSrc(cardIdOf(P.from), te), q = rc(te);
        if (!so || !q) return;
        const mw = q.w * 1.2, mh = q.h * 1.2, my = q.y - q.h * 0.3;
        const m = j.add(el0("sgsoul mirror", q.x, my, mw, mh, "#bff4ff", `<img src="${so.src}" alt="" style="${so.pose ? "" : `object-fit:${so.fit};object-position:${so.pos}`}">`));
        tl(m, [{ t: 0, x: q.x, y: my + 8, s: 0.8, sx: -1, o: 0 }, { t: 120, x: q.x, y: my, s: 1.05, sx: -1, o: 0.8 }, { t: 340, x: q.x, y: my - 4, s: 1, sx: -1, o: 0.7 }, { t: 460, x: q.x, y: my - 10, s: 1.1, sx: -1, o: 0 }], 460);
        fxT(() => m.remove(), 520);
        glow(tp.x, tp.y, "#bff4ff", sz * 1.6, 0.35, 0.75);
        star(tp.x, tp.y, "#ffffff", sz * 1.2, 0.3);
        sfx("chime");
      });
      j.at(660, () => { for (const s of P.owned) P.hit(s); });
      /* ấn ký kỹ năng (huy hiệu ảnh thẻ bị chép) bay về Thiên Diện */
      j.at(720, () => {
        const q = rc(mcOf(P.from)) || tq, me = rc(mcOf(P.uid)) || a, s = Math.max(30, w * 0.6);
        const m = j.add(medal(P.from, q.x, q.y, s, "#bff4ff"));
        tl(m, [{ t: 0, x: q.x, y: q.y, s: 0.4, o: 0 }, { t: 100, x: q.x, y: q.y - 20, s: 1.2, o: 1 }, ...arc({ x: q.x, y: q.y - 20 }, me, 70, 100, P.T - 720, { s0: 1.2, s1: 0.9 }), { t: P.T - 720 + 120, x: me.x, y: me.y, s: 0.3, o: 0, e: "ease-in" }], P.T - 720 + 120);
        trail({ x: q.x, y: q.y - 20 }, me, 70, 100, P.T - 720, ["#bff4ff", "#ffffff", P.c1], 8);
      });
      j.at(P.T, () => {
        const me = rc(mcOf(P.uid)) || a;
        ring(me.x, me.y, "#bff4ff", me.w * 1.3, 0.45, 0.95);
        glow(me.x, me.y, "#bff4ff", me.w * 1.8, 0.4, 0.7);
        streaks(me.x, me.y, ["#bff4ff", "#ffffff", P.c1], 14, 260, 0, 6.283, 0.45, 5);
        const ab = nm((P.inst.ab && C[P.inst.ab]) ? P.inst.ab : cardIdOf(P.from));
        fl(me.x, me.t - 10, "CHÉP KỸ NĂNG" + (ab ? ": " + short(ab, 14) : ""), "#bff4ff");
        try { SFX.fam("copy", { el: elOf(P.id) }); } catch (e) {}
      });
      const diffs = P.diffs || [];
      if (diffs.length) seals(P, j, a, diffs, P.T + 260, 120, total);
    },
  });

  /* 5. U Minh Kiếm — Lật: đổi chiến địa thành U Minh. Kiếm ma cắm xuống chiến địa, xoáy U Minh nuốt ảnh cũ. */
  SG.add("kiemnuuminh", {
    kind: "rev", T: 660, dur: 1400, lateTurn: 1,
    prep(P) { if (!P.evs.some((e) => e.k === "loc" && e.li === P.li && e.old !== undefined)) return false; },
    own: (s, P) => s.k === "loc" && s.li === P.li,
    run(P, j, total) {
      const a = srcPt(P), pl = lanePlate(P.li) || { x: a.x, y: a.y - 120, w: 120, h: 60 }, w = P.q0 ? P.q0.w : 60, sz = PS(P, 1.95);
      const hi = { x: pl.x, y: pl.y - pl.h * 0.9 - sz * 0.3 }, hit = { x: pl.x, y: pl.y - sz * 0.22 };
      const d = j.add(prop(P, a.x, a.y, sz));
      const k = appear(P, j, d, a, 1, total);
      k.push(...arc(a, hi, 50, 260, 500, { s0: 1, s1: 1.1, r0: 0, r1: 0, wob: -10 }), { t: 560, x: hi.x, y: hi.y - 12, s: 1.12, e: "cubic-bezier(.6,0,.9,.4)" }, { t: P.T, x: hit.x, y: hit.y, s: 1.2 }, { t: P.T + 40, x: hit.x, y: hit.y + 4, s: 1.15, sy: 0.94 }, { t: P.T + 120, x: hit.x, y: hit.y, s: 1.18 }, { t: 1050, x: hit.x, y: hit.y - 4, s: 1.18, o: 1, e: "ease-in" }, { t: 1200, x: hit.x, y: hit.y - 40, s: 1.3, o: 0 }, { t: total, x: hit.x, y: hit.y - 40, s: 1, o: 0 });
      tl(d, k, total);
      j.at(500, () => { streaks(hi.x, hi.y, ["#c45cff", "#ffffff"], 8, 200, 1.2, 1.9, 0.3, 5); sfx("whoosh"); });
      j.at(P.T, () => {
        ring(pl.x, pl.y, "#c45cff", pl.w * 0.9, 0.5, 0.95, 0.45);
        ring(pl.x, pl.y, "#ffffff", pl.w * 0.6, 0.35, 0.8, 0.45, 0.06);
        glow(pl.x, pl.y, "#7a2cff", pl.w * 1.1, 0.6, 0.7);
        streaks(pl.x, pl.y, ["#c45cff", "#2a0a4a", "#ffffff"], 18, 320, 0, 6.283, 0.5, 6);
        K.shake(6, 0, 1);
        try { SFX.play("slash"); } catch (e) {}
        /* xoáy U Minh */
        const vs = Math.max(pl.w, pl.h) * 1.15;
        const v = j.add(el0("sgvx", pl.x, pl.y, vs, vs * 0.62, "#c45cff", "<i></i>"));
        const T2 = 640;
        tl(v, [{ t: 0, x: pl.x, y: pl.y, s: 0.1, o: 0 }, { t: 120, x: pl.x, y: pl.y, s: 0.75, o: 0.95 }, { t: 430, x: pl.x, y: pl.y, s: 1, o: 0.9 }, { t: T2, x: pl.x, y: pl.y, s: 1.2, o: 0, e: "ease-in" }], T2);
        try { v.firstChild.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-540deg)" }], { duration: T2, easing: "cubic-bezier(.3,.2,.6,1)" }); } catch (e) {}
        if (!lite()) converge(pl.x, pl.y, ["#c45cff", "#7a2cff", "#ffffff"], 26, pl.w * 0.7, 0.42, 1);
        /* ảnh chiến địa cũ bị cuốn vào xoáy */
        for (const s of P.owned) if (s.ov) { const o = s.ov; try { o.animate([{ transform: "none", opacity: 1 }, { transform: "scale(.9) rotate(-60deg)", opacity: 0.9, offset: 0.4 }, { transform: "scale(.05) rotate(-260deg)", opacity: 0 }], { duration: 380, delay: 40, easing: "ease-in", fill: "forwards" }); } catch (e) {} }
      });
      j.at(P.T + 420, () => { for (const s of P.owned) P.hit(s); glow(pl.x, pl.y, "#c45cff", pl.w, 0.4, 0.6); fl(pl.x, pl.y - pl.h * 0.6, "U MINH", "#e0b0ff"); });
    },
  });

  /* 6. Hấp Tinh Ma Nữ — Lật: cướp kỹ năng Duy Trì của địch tại đây. Vuốt ma tóm quả cầu kỹ năng ra khỏi lá địch (lá xám đi). */
  SG.add("haplucnu", {
    kind: "rev", T: 600, dur: 1300,
    prep(P) { const e = P.evs.find((x) => x.k === "abcopy" && x.uid === P.uid && x.st); if (!e) return false; P.from = e.from; },
    own: (s, P) => s.k === "steal" && s.src === P.uid,
    run(P, j, total) {
      const a = srcPt(P), w = P.q0 ? P.q0.w : 60, sz = PS(P, 1.76), pc = "#c45cff";
      const tq = rc(mcOf(P.from)) || { x: a.x, y: a.y - 120, w, h: w * 1.3, t: a.y - 160 };
      const grip = { x: tq.x, y: tq.y + (P.mine ? 1 : -1) * tq.h * 0.08 };
      const d = j.add(prop(P, a.x, a.y, sz));
      const k = appear(P, j, d, a, 1, total);
      k.push(...arc(a, grip, 60, 260, 520, { s0: 1, s1: 1.1, face: 0, r0: 0, r1: P.mine ? -10 : 170 }), { t: 560, x: grip.x, y: grip.y, s: 0.92, sy: 0.9, r: P.mine ? -10 : 170 }, { t: 640, x: grip.x, y: grip.y + (P.mine ? 6 : -6), s: 0.88, r: P.mine ? -10 : 170 });
      const back = { x: a.x, y: a.y };
      k.push(...arc(grip, back, 60, 720, 1020, { s0: 0.95, s1: 1, r0: P.mine ? -10 : 170, r1: 0 }), ...home(P, back, 1080, total, 1));
      tl(d, k, total);
      trail(a, grip, 60, 260, 520, [pc, P.c1, "#ffffff"], 8);
      j.at(P.T, () => {
        for (const s of P.owned) P.hit(s);
        ring(tq.x, tq.y, pc, tq.w * 1.25, 0.42, 0.95);
        glow(tq.x, tq.y, pc, tq.w * 1.6, 0.4, 0.6);
        if (!lite()) converge(grip.x, grip.y, [pc, "#ffffff"], 14, tq.w * 0.9, 0.25, 1);
        K.shake(4, 0, 1);
        /* quả cầu kỹ năng bị lôi ra, theo vuốt về */
        const s = Math.max(30, w * 0.62), m = j.add(medal(P.from, tq.x, tq.y, s, pc));
        tl(m, [{ t: 0, x: tq.x, y: tq.y, s: 0.3, o: 0 }, { t: 110, x: grip.x, y: grip.y, s: 1.15, o: 1 }, { t: 120, x: grip.x, y: grip.y, s: 1.1 }, ...arc(grip, back, 60, 120, 420, { s0: 1.1, s1: 0.9 }), { t: 520, x: back.x, y: back.y, s: 0.3, o: 0, e: "ease-in" }], 520);
        trail(grip, back, 60, 120, 420, [pc, "#ffffff", P.c1], 8);
        try { SFX.fam("steal", { el: elOf(P.id) }); } catch (e) {}
      });
      j.at(1040, () => {
        const me = rc(mcOf(P.uid)) || a;
        ring(me.x, me.y, pc, me.w * 1.3, 0.45, 0.95);
        glow(me.x, me.y, pc, me.w * 1.8, 0.4, 0.7);
        streaks(me.x, me.y, [pc, "#ffffff", P.c1], 14, 260, 0, 6.283, 0.45, 5);
        const ab = nm(P.inst.ab && C[P.inst.ab] ? P.inst.ab : cardIdOf(P.from));
        fl(me.x, me.t - 10, "CƯỚP KỸ NĂNG" + (ab ? ": " + short(ab, 14) : ""), "#e0b0ff");
      });
    },
  });

  /* 7. Dạ Ảnh Vương — Lật: mọi thẻ tại đây về sức mạnh gốc. Vương miện bóng đêm toả sóng, số trên từng lá tua ngược về gốc. */
  SG.add("vuabong", {
    kind: "rev", T: 560, dur: 1350,
    own: (s, P) => s.src === P.uid && /^(reset|up|down)$/.test(s.k),
    run(P, j, total) {
      const a = srcPt(P), pl = lanePlate(P.li), lr = laneRect(P.li), w = P.q0 ? P.q0.w : 60, sz = PS(P, 1.76), sc = "#8a5cff";
      const c = pl ? { x: pl.x, y: pl.y - pl.h * 0.15 } : { x: a.x, y: a.y - 100 };
      const d = j.add(prop(P, a.x, a.y, sz));
      const k = appear(P, j, d, a, 1, total);
      k.push(...arc(a, c, 50, 260, 480, { s0: 1, s1: 1.15 }), { t: 530, x: c.x, y: c.y, s: 1.3, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 640, x: c.x, y: c.y, s: 1.12 }, { t: 1000, x: c.x, y: c.y, s: 1.12 }, ...home(P, c, 1000, total, 1.1));
      tl(d, k, total);
      const R = lr ? Math.max(lr.w, lr.h) * 0.62 : 160;
      j.at(P.T - 40, () => {
        const sw = j.add(el0("sgsw", c.x, c.y, R * 2, R * 2, sc, ""));
        tl(sw, [{ t: 0, x: c.x, y: c.y, s: 0.05, o: 0.9 }, { t: 420, x: c.x, y: c.y, s: 1, o: 0.5, e: "ease-in" }, { t: 560, x: c.x, y: c.y, s: 1.08, o: 0 }], 560);
        fxT(() => sw.remove(), 620);
        ring(c.x, c.y, sc, R * 1.6, 0.6, 0.9, 0.55);
        ring(c.x, c.y, "#1a0830", R * 1.2, 0.5, 0.7, 0.55, 0.05);
        glow(c.x, c.y, sc, R, 0.5, 0.55);
        K.shake(3, 0, 1);
        sfx("whoosh");
      });
      /* sóng tới lá nào thì lá đó tua về gốc (đánh bước reset/up/down của chính thẻ này) */
      const by = new Map();
      for (const s of P.owned) { const q = rc(mcOf(s.dst)) || s.tp; if (!q) continue; const dd = Math.hypot(q.x - c.x, q.y - c.y); const t = P.T + clamp(dd / R, 0, 1) * 360; by.set(s, { t, q }); }
      for (const [s, o] of by) j.at(o.t, () => {
        P.hit(s);
        const q = rc(mcOf(s.dst)) || o.q;
        ring(q.x, q.y, sc, q.w * 1.0, 0.4, 0.8);
        /* gpu68 (vis): số trên ô sức mạnh đếm về gốc do hit8 -> P6.stat (không xoay/phóng ô số) */
      });
      if (!P.owned.length) j.at(P.T + 200, () => fl(c.x, c.y - 30, "VỀ SỨC MẠNH GỐC", "#c9b0ff"));
    },
  });

  /* 8. Tứ Nguyên Cơ — Lật: mỗi người chơi rút 1 thẻ. Khối tứ nguyên xoay, mỗi bộ bài bắn một lá về tay chủ của nó. */
  const EL4 = ["#ff6a3d", "#4dc3ff", "#8fdc4a", "#ffd65a"];
  SG.add("tunguyennu", {
    kind: "rev", hand: 2, T: 1050, dur: 1420,
    run(P, j, total) {
      const a = srcPt(P), w = P.q0 ? P.q0.w : 60, sz = PS(P, 1.76), up = { x: a.x, y: a.y - sz * 0.25 };
      const d = j.add(prop(P, a.x, a.y, sz));
      const k = appear(P, j, d, a, 1, total);
      k.push({ t: 320, x: up.x, y: up.y, s: 1.05, r: 0, e: "cubic-bezier(.5,0,.3,1)" }, { t: 640, x: up.x, y: up.y, s: 1.15, r: 540 }, { t: 720, x: up.x, y: up.y, s: 1.05, r: 540 }, { t: 1100, x: up.x, y: up.y, s: 1.05, r: 600 }, ...home(P, up, 1100, total, 1).map((p) => Object.assign(p, { r: 600 })));
      tl(d, k, total);
      /* bốn đốm nguyên tố quay quanh khối */
      if (!lite()) for (let i = 0; i < 4; i++) for (let m = 0; m < 6; m++) { const an = i * 1.5708 + m * 0.5, R = sz * 0.62; E6({ x: up.x + Math.cos(an) * R, y: up.y + Math.sin(an) * R * 0.7, vx: -Math.sin(an) * R * 3, vy: Math.cos(an) * R * 2, c: EL4[i], kind: 0, s0: 12, s1: 3, drag: 1, dur: 0.3, a: 0.95, delay: (320 + m * 50) / 1000 }); }
      j.at(600, () => { for (let i = 0; i < 4; i++) ring(up.x, up.y, EL4[i], sz * (0.9 + i * 0.18), 0.4, 0.8, 1, i * 0.04); sfx("chime"); });
      const decks = [{ sd: "p", u: (P.newHand || [])[0] || null }, { sd: "a" }];
      for (const g of decks) {
        j.at(640, () => {
          const dz = DECKZ(g.sd), to = g.sd === "p" ? (g.u ? rc(hcOf(g.u)) : null) || zpt("hand") : zpt("avFoe");
          if (!dz || !to) return;
          beam(up.x, up.y, dz.x, dz.y, g.sd === "p" ? EL4[1] : EL4[0], 6, 0.3);
          ring(dz.x, dz.y, "#ffe7a0", 50, 0.35, 0.9);
          const bw = 40, bh = 56, T1 = P.T - 700;
          const bk = j.add(el0("sgbk", dz.x, dz.y, bw, bh, "#ffe7a0", `<i style="background:${P6.back({ own: g.sd })}"></i>`));
          const sc1 = g.sd === "p" && to.w ? clamp(to.w / bw, 0.8, 1.6) : 0.7;
          tl(bk, [{ t: 0, x: dz.x, y: dz.y, s: 0.5, o: 0 }, { t: 60, x: dz.x, y: dz.y, s: 0.8, o: 1 }, ...arc(dz, to, 80, 60, T1 + 40, { s0: 0.8, s1: sc1, r0: -12, r1: 0, wob: 10 }), { t: T1 + 120, x: to.x, y: to.y, s: sc1, sx: 0.05, o: 1, e: "ease-in" }, { t: T1 + 130, x: to.x, y: to.y, s: sc1, sx: 0.05, o: 0 }], T1 + 130);
          trail(dz, to, 80, 60, T1 + 40, [EL4[0], EL4[1], EL4[2], EL4[3]], 8);
          sfx("whoosh");
          j.at(640 + T1 + 120, () => {
            if (g.sd === "p" && g.u) revealH(g.u, "#ffe7a0");
            else { ring(to.x, to.y, EL4[0], 54, 0.4, 0.9); glow(to.x, to.y, EL4[0], 70, 0.35, 0.7); try { pulse("#avFoe", [{ transform: "scale(1)" }, { transform: "scale(1.15)", offset: 0.4 }, { transform: "scale(1)" }], 320); } catch (e) {} }
            if (g.sd === "p") fl(to.x, to.y - 50, "+1 lá", "#ffe7a0");
          });
        });
      }
    },
  });

  /* 9. Nguyệt Thạch — Duy Trì: có kỹ năng Duy Trì của thẻ ≤3 năng lượng của bạn tại đây. Đá trăng nổi lên, tia trăng nối từng lá, ấn ký của chúng bay vòng vào đá. */
  SG.add("nguyetthach", {
    kind: "on", own: ownCost, T: (P) => (P.links.length ? 1000 : 640), dur: (P) => (P.links.length ? 1000 : 640) + 520 + ((P.diffs || []).length ? 300 + 120 * (P.diffs || []).length : 0),
    prep(P) {
      P.links = [];
      for (const c of G.locs[P.li].cards[P.side]) if (c !== P.inst && c.rev && !c.sil && C[c.id] && C[c.id].c <= 3 && C[E.ab(c)] && C[E.ab(c)].t === "on" && E.ab(c) !== "nguyetthach") P.links.push(c.uid);
    },
    run(P, j, total) {
      const a = srcPt(P), w = P.q0 ? P.q0.w : 60, sz = PS(P, 1.89), mc = "#bfe0ff";
      const up = { x: a.x, y: a.y - sz * 0.35 };
      const d = j.add(prop(P, a.x, a.y, sz));
      const k = appear(P, j, d, a, 1, total);
      k.push({ t: 420, x: up.x, y: up.y, s: 1.05, e: "ease-in-out" }, { t: 700, x: up.x, y: up.y - 6, s: 1.05 }, { t: P.T, x: up.x, y: up.y, s: 1.05 }, { t: P.T + 80, x: up.x, y: up.y, s: 1.25 }, { t: P.T + 200, x: up.x, y: up.y, s: 1.05 }, { t: total - 300, x: up.x, y: up.y, s: 1.05 }, ...home(P, up, total - 300, total, 1.05));
      tl(d, k, total);
      j.at(300, () => { glow(up.x, up.y, mc, sz * 2.2, 0.9, 0.45); ring(up.x, up.y, mc, sz * 1.3, 0.7, 0.6); sfx("chime"); });
      P.links.forEach((u, i) => {
        j.at(420 + i * 90, () => {
          const q = rc(mcOf(u));
          if (!q) return;
          for (const dl of [0, 0.14, 0.28]) fxT(() => { if (!j.dead) beam(up.x, up.y, q.x, q.t + 4, mc, 6, 0.24); }, dl * 1000);
          ring(q.x, q.y, mc, q.w * 1.15, 0.45, 0.9);
          glow(q.x, q.y, mc, q.w * 1.5, 0.4, 0.55);
          /* ấn ký của lá bay vòng (xoắn ốc) vào đá */
          const s = Math.max(28, q.w * 0.55), m = j.add(medal(u, q.x, q.y, s, mc)), T1 = P.T - (520 + i * 90), kk = [{ t: 0, x: q.x, y: q.y, s: 0.3, o: 0 }, { t: 100, x: q.x, y: q.t, s: 1.1, o: 1 }];
          const a0 = Math.atan2(q.t - up.y, q.x - up.x), R0 = Math.hypot(q.x - up.x, q.t - up.y);
          for (let n = 1; n <= 14; n++) { const u2 = n / 14, e = sm(u2), an = a0 + e * Math.PI * 1.6, R = R0 * (1 - e) + sz * 0.15 * (1 - e); kk.push({ t: 100 + (T1 - 100) * u2, x: up.x + Math.cos(an) * R, y: up.y + Math.sin(an) * R * 0.8, s: lerp(1.1, 0.45, e), o: n === 14 ? 0.2 : 1 }); }
          tl(m, kk, T1);
          fxT(() => m.remove(), T1 + 40);
          tap("sig:link", { id: P.id, u });
        });
      });
      j.at(P.T, () => {
        glow(up.x, up.y, "#ffffff", sz * 1.2, 0.2, 0.9);
        ring(up.x, up.y, mc, sz * 1.6, 0.5, 0.95);
        streaks(up.x, up.y, [mc, "#ffffff", P.c1], 16, 280, 0, 6.283, 0.5, 5);
        const names = P.links.map((u) => nm(E.ab(E.find(G, u).inst))).filter(Boolean);
        fl(up.x, up.y - sz * 0.55, names.length ? "CÓ KỸ NĂNG: " + short(names.join(", "), 24) : "ĐÁ TRĂNG CHỜ ĐỢI", "#cfe6ff");
        sfx("chime");
      });
      const diffs = P.diffs || [];
      if (diffs.length) seals(P, j, up, diffs, P.T + 300, 120, total);
    },
  });

  /* 10. Bạch Thể — Lật: lá trên cùng bộ bài thành 0/0. Bùa trắng bay tới bộ bài, sóng trắng quét, lá trên cùng loé 0/0. */
  SG.add("bachdich", {
    kind: "rev", T: 620, dur: 1150,
    run(P, j, total) {
      const a = srcPt(P), w = P.q0 ? P.q0.w : 60, sz = PS(P, 1.69), dz = DECKZ(P.side) || { x: 40, y: 60 };
      const hit = { x: dz.x, y: dz.y + (P.mine ? -30 : 30) };
      const d = j.add(prop(P, a.x, a.y, sz));
      const k = appear(P, j, d, a, 1, total);
      k.push(...arc(a, hit, 80, 260, 560, { s0: 1, s1: 0.9, r0: 0, r1: 360 }), { t: P.T, x: dz.x, y: dz.y, s: 1.25, r: 360, e: "cubic-bezier(.3,1.6,.5,1)" }, { t: P.T + 90, x: dz.x, y: dz.y, s: 1, r: 360 }, { t: 820, x: dz.x, y: dz.y, s: 1, r: 360 }, ...home(P, dz, 820, total, 1));
      tl(d, k, total);
      trail(a, hit, 80, 260, 560, ["#ffffff", "#e8f4ff", P.c1], 9);
      j.at(P.T, () => {
        for (let i = 0; i < 3; i++) ring(dz.x, dz.y, i ? "#e8f4ff" : "#ffffff", 70 + i * 34, 0.45 + i * 0.08, 0.9 - i * 0.2, 1, i * 0.07);
        glow(dz.x, dz.y, "#ffffff", 120, 0.35, 0.85);
        streaks(dz.x, dz.y, ["#ffffff", "#dfefff"], 16, 280, 0, 6.283, 0.45, 5);
        sfx("chime");
      });
      /* gpu68 (vis): không đóng dấu "0/0" lớn — chính lá trên cùng (mặt thẻ đầy đủ) đếm ô số về 0/0 (P6.stat) */
    },
  });

  /* 11. Thần Trống Đồng — Duy Trì: tổng sức mạnh của bạn tại đây ×2. Trống đồng đánh ba nhịp, sóng vàng lan khắp chiến địa, tổng điểm nhân đôi. */
  SG.add("thietgiap", {
    kind: "on", pw: 1, T: 820, dur: 1400,
    run(P, j, total) {
      const a = srcPt(P), w = P.q0 ? P.q0.w : 60, sz = PS(P, 1.95), gd = "#ffc94a";
      const up = { x: a.x, y: a.y - sz * 0.22 }, lr = laneRect(P.li), R = lr ? Math.max(lr.w, lr.h * 0.5) : 160;
      const d = j.add(prop(P, a.x, a.y, sz));
      const k = appear(P, j, d, a, 1, total);
      k.push({ t: 320, x: up.x, y: up.y, s: 1 });
      const beats = [380, 600, P.T];
      for (const b of beats) { const big = b === P.T; k.push({ t: b - 60, x: up.x, y: up.y - 8, s: 1.04, e: "cubic-bezier(.6,0,.9,.4)" }, { t: b, x: up.x, y: up.y + 4, s: big ? 1.22 : 1.1, sy: 0.86 }, { t: b + 90, x: up.x, y: up.y, s: 1 }); }
      k.push({ t: 1060, x: up.x, y: up.y, s: 1 }, ...home(P, up, 1060, total, 1));
      tl(d, k, total);
      beats.forEach((b, i) => j.at(b, () => {
        const big = b === P.T;
        ring(up.x, up.y, gd, R * (big ? 1.9 : 1.1 + i * 0.25), big ? 0.7 : 0.5, 0.95, 0.5);
        ring(up.x, up.y, "#fff2c0", R * (big ? 1.4 : 0.8), 0.4, 0.8, 0.5, 0.05);
        glow(up.x, up.y, gd, sz * (big ? 2.4 : 1.5), 0.35, 0.7);
        K.shake(big ? 7 : 3, 0, 1);
        try { SFX.play(big ? "boom" : "place"); } catch (e) {}
      }));
      j.at(P.T, () => {
        const pe = pwOf(P.li, P.side), q = rc(pe);
        if (q) {
          stamp(j, q.x, q.y, "×2", gd, 40, P.T + 30, 650);
          ring(q.x, q.y, gd, 90, 0.5, 0.95);
          glow(q.x, q.y, gd, 120, 0.45, 0.8);
          streaks(q.x, q.y, [gd, "#ffffff"], 18, 300, 0, 6.283, 0.5, 6);
          try { pe.animate([{ transform: "scale(1)" }, { transform: "scale(1.6)", offset: 0.35 }, { transform: "scale(1)" }], { duration: 520, easing: "cubic-bezier(.2,.8,.3,1)" }); } catch (e) {}
        }
        if (lr) for (const sd of [P.side]) for (const c of G.locs[P.li].cards[sd]) { const cq = rc(mcOf(c.uid)); if (cq) glow(cq.x, cq.y, gd, cq.w * 1.3, 0.4, 0.5); }
        tap("sig:x2", { id: P.id });
      });
    },
  });

  /* 12. Chủ Bút Sơn Hà — Duy Trì: +2 cho MỖI thẻ Lật trên bàn. Bút lông lớn quét nét mực vàng nối mọi lá Lật, mỗi lá +2, mực chảy về Chủ Bút. */
  SG.add("dothan", {
    kind: "on", selfHit: 1, T: (P) => 420 + P.tg.length * 160 + 260, dur: (P) => 420 + P.tg.length * 160 + 260 + 480,
    prep(P) {
      P.tg = [];
      for (let li = 0; li < 3; li++) for (const sd of E.SIDES) for (const c of G.locs[li].cards[sd]) if (c.rev && C[E.ab(c)] && C[E.ab(c)].t === "rev") P.tg.push({ u: c.uid, li, sd });
      P.n = P.tg.length; P.tg = P.tg.slice(0, 10);
    },
    run(P, j, total) {
      const a = srcPt(P), w = P.q0 ? P.q0.w : 60, sz = PS(P, 1.89), gd = "#ffd65a";
      const pts = P.tg.map((g) => { const q = rc(mcOf(g.u)); return q ? { x: q.x, y: q.y - q.h * 0.05, u: g.u, q } : null; }).filter(Boolean);
      pts.sort((p, q) => p.y - q.y || p.x - q.x);
      /* đường quét: theo hàng (trên xuống), mỗi hàng đổi chiều — nét liền, không gãy gắt */
      const rows = [];
      for (const p of pts) { const r = rows.find((r) => Math.abs(r.y - p.y) < 30); if (r) r.L.push(p); else rows.push({ y: p.y, L: [p] }); }
      const path = [];
      rows.forEach((r, i) => { r.L.sort((p, q) => (i % 2 ? q.x - p.x : p.x - q.x)); path.push(...r.L); });
      const d = j.add(prop(P, a.x, a.y, sz));
      const k = appear(P, j, d, a, 1, total);
      const tp = (i) => 420 + i * 160;
      let prev = a;
      const ink = [[a.x, a.y]];
      path.forEach((p, i) => {
        const t0 = i ? tp(i - 1) : 260, t1 = tp(i);
        k.push(...arc(prev, p, i ? 18 : 50, t0, t1, { s0: 1, s1: 1, r0: -20, r1: 20, n: 6 }));
        const c = [(prev.x + p.x) / 2, Math.min(prev.y, p.y) - (i ? 18 : 50)];
        for (let n = 1; n <= 8; n++) { const q = bz(prev, c, p, n / 8); ink.push([q[0] + Math.sin(n) * 1.5, q[1] + Math.cos(n * 1.3) * 1.5]); }
        prev = p;
      });
      const tEnd = path.length ? tp(path.length - 1) : 420;
      k.push(...arc(prev, a, 60, tEnd + 20, P.T - 20, { s0: 1, s1: 1.1, r0: 20, r1: 0 }), { t: P.T + 60, x: a.x, y: a.y, s: 1.2 }, { t: P.T + 140, x: a.x, y: a.y, s: 1.05 }, ...home(P, a, P.T + 160, total, 1.05));
      tl(d, k, total);
      /* nét mực theo đầu bút (cùng dòng thời gian) */
      if (!lite() && path.length) j.at(260, () => {
        const t0 = performance.now(), span = (tEnd - 260) * SPD, fadeAt = (P.T - 260) * SPD;
        cvAdd({ pts: ink, w: 7, c: gd, life: (total - 260) / 1000, prog: () => (performance.now() - t0) / span, fade: () => ((performance.now() - t0) - fadeAt) / (300 * SPD), draw: inkDraw });
      });
      path.forEach((p, i) => j.at(tp(i), () => {
        const q = rc(mcOf(p.u)) || p.q;
        ring(q.x, q.y, gd, q.w * 1.15, 0.4, 0.95);
        glow(q.x, q.y, gd, q.w * 1.4, 0.35, 0.6);
        /* gpu68-audit2: thẻ Lật chỉ được ĐẾM (sức mạnh của nó không đổi) — nhãn đếm "LẬT n" thay cho "+2" dễ hiểu nhầm */
        fl(q.x, q.t + 6, "LẬT " + (i + 1), "#ffe08a");
        if (lite()) beam(prev.x, prev.y, q.x, q.y, gd, 5, 0.2);
        tap("sig:ink", { id: P.id, u: p.u });
      }));
      j.at(P.T, () => {
        const q = rc(mcOf(P.uid)) || a;
        ring(q.x, q.y, gd, q.w * 1.4, 0.5, 0.95);
        glow(q.x, q.y, gd, q.w * 2, 0.45, 0.75);
        streaks(q.x, q.y, [gd, "#ffffff", P.c1], 16, 280, 0, 6.283, 0.5, 5);
        fl(q.x, q.t - 12, P.n + " thẻ Lật × 2", "#ffe08a");
        sfx("chime");
      });
    },
  });

  /* gpu69 (làn A): bộ công cụ cho màn diễn ở tệp khác (18-act.js) */
  SG.kit = { job, el0, prop, medal, tl, arc, trail, stamp, PS, srcPt, miniSoul, appear, home, rc, mcOf, hcOf, revealH, hideH, showH, seals, lanePlate, laneRect, pwOf, cardIdOf, nm, short, fl, sfx, live, soulSrc, propImg, lite, on, ff, hitOwn, tap, cvAdd };
  /* gpu68 (vis): CỔNG LUẬT TRÌNH DIỄN (15-pa6.js, đầu tệp) — lớp ngoài cùng của playFxCore: nhịp kỹ năng không bao giờ bắt đầu khi màn ra mắt [A] còn mở */
  {
    const pcG = playFxCore;
    playFxCore = function (evs, R0, P0, part) {
      const self = this, args = arguments;
      if (part === 1 || !P6.seq) return pcG.apply(self, args);
      return P6.seq.skill(() => (P6.spinGate ? P6.spinGate(evs, () => pcG.apply(self, args)) : pcG.apply(self, args))); /* gpu70: nhịp quay chọn ngẫu nhiên trước [B] */
    };
  }

})();
