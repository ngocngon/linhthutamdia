/* ===== Module 16 (gpu61): HỒN XUẤT vòng 2 — PA6 làm lõi, thêm 8 hiệu ứng Hồn Xuất =====
   Chỉ bật khi THẺ HÀNH ĐỘNG (thẻ nguồn) nằm trong 20 thẻ có ảnh tư thế (img/pose/pose.json); mọi thẻ khác giữ nguyên gpu60.
   (localStorage "ltd_hx_all" = "1": bật cho mọi thẻ — chỉ để duyệt thử.)
   RB-B Rút bài    : (gpu62, thay HX-01) đỉnh bộ bài loé ấn, lá bay úp rồi lật một vòng giữa không trung, đáp với vòng tia lửa theo hệ — KHÔNG hồn.
   HX-02 Lật thẻ   : lật kiểu cũ (.mc.flip + elFx) đẹp hơn: nhấc + xoay 3D + loé theo hệ + ấn dưới chân; S4/S5 ló nửa người. S1–S3: lật y như gpu60.
   HX-03 Hủy thẻ   : nhát chém, hồn mục tiêu bị giật khỏi khung rồi vỡ thành mảnh ảnh thật, khung rỗng sụp vụn (CPU, lớp 2D).
   HX-04 Vứt bài   : lá nhấc khỏi tay, hồn rời thẻ, thẻ cháy thành tro (CPU), hồn chạy vào mộ bài.
   HX-05 Triệu hồi : khung mới thành hình trên ấn, hồn mới giáng xuống chui vào khung. Nhiều mục tiêu: một lần toả (fan-out).
   HX-06 Tăng sức  : hồn đồng minh gồng ló khỏi khung. HX-07 Giảm sức: hồn địch bị kéo tụt xuống, dải năng lượng hút về hồn PA6.
                     Nhiều mục tiêu cùng loại: gom về MỘT mốc trúng, hồn PA6 toả nhiều tia hồn cùng lúc (tổng thời gian ≈ một mục tiêu).
   HX-08 Di chuyển : hồn ló khỏi khung và bay CÙNG lá thẻ thành một khối.
   HX-09 Về tay / Đánh cắp: hồn PA6 ở lại cạnh ô của thẻ nguồn, vươn cánh tay linh hồn tóm mục tiêu.
   Mức máy: Nhẹ -> HX-03/04 dùng CFX cũ, không ló hồn / tay / dải (chỉ tia GPU). Giảm chuyển động / tua nhanh (FFTURN) -> đường cũ.
   Hiệu năng: DOM chỉ đổi transform/opacity; hạt sáng ở GLFX (PA6), mảnh vỡ/cháy/tay ở một canvas 2D chỉ tồn tại khi đang diễn. */
(function () {
  "use strict";
  const W = window;
  if (!W.P6 || !P6.kit) return;
  const K = P6.kit, HXG = {};
  W.HXG = HXG;
  const tap = (k, o) => { try { if (W.HX_TAP) W.HX_TAP(k, o || {}); } catch (e) {} };
  const rnd = K.rnd, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const ff = () => !!(W.FFTURN && FFTURN.on);
  const tier = () => P6.tier(), isLite = () => tier() === "lite";
  const on = () => { try { return !reduced && !!G && P6.on(); } catch (e) { return false; } };
  let ALL = false;
  try { ALL = localStorage.getItem("ltd_hx_all") === "1"; } catch (e) {}
  HXG.setAll = (v) => { ALL = !!v; try { localStorage.setItem("ltd_hx_all", v ? "1" : "0"); } catch (e) {} };
  const ok = (id) => !!id && !!C[id] && on() && (ALL || P6.hasPose(id));
  HXG.ok = ok;
  const idOf = (uid) => { try { const c = anyC(uid); return c ? c.id : null; } catch (e) { return null; } };
  const okU = (uid) => uid > 0 && ok(idOf(uid));
  HXG.okU = okU;
  const { glow, ring, star, streaks, converge, beam } = P6.fx;
  const E6 = K.E6, kN = K.kN, cols = P6.cols;
  const mcOf = (uid) => document.querySelector(`#board [data-mc="${uid}"]`);
  const ctrR = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height });
  const live = (ms) => { try { holdFx(ms); } catch (e) {} };

  /* ---------- việc đang diễn: tua nhanh / dọn sạch ---------- */
  const ACT = new Set();
  function job(end, ms) {
    const j = { end, dead: 0 };
    j.fin = (fast) => { if (j.dead) return; j.dead = 1; ACT.delete(j); clearTimeout(j.wd); try { end(!!fast); } catch (e) { console.error(e); } };
    j.wd = setTimeout(() => j.fin(true), (ms + 1500) * SPD);
    ACT.add(j);
    return j;
  }
  HXG.skip = () => { for (const j of [...ACT]) j.fin(true); cvClear(); };
  HXG.clean = () => { HXG.skip(); document.querySelectorAll(".hxsoul,.hxds,.hxbolt,.hxemb,.hxbk,.hxclip,.hxorb,.hxrc,.fxg.hxold").forEach((e) => e.remove()); for (const el of document.querySelectorAll(".hxpk,.hxm,.hx2z")) el.classList.remove("hxpk", "hxm", "hx2z"); };
  HXG.busy = () => ACT.size + CV.L.length;

  /* ---------- lớp 2D (mảnh vỡ ảnh thật, cháy, tay linh hồn, dải năng lượng, nét chém) ---------- */
  const CV = { c: null, x: null, L: [], raf: 0, dpr: 1, last: 0, off: 0 };
  function cvOn() {
    clearTimeout(CV.off);
    if (CV.c) return;
    const c = document.createElement("canvas");
    c.className = "hxcv"; c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    CV.c = c; CV.x = c.getContext("2d"); cvSize();
  }
  function cvSize() { if (!CV.c) return; const d = Math.min(isLite() ? 1 : 2, W.devicePixelRatio || 1); CV.dpr = d; CV.c.width = Math.round(innerWidth * d); CV.c.height = Math.round(innerHeight * d); }
  addEventListener("resize", cvSize);
  function cvAdd(p) {
    if (reduced) return null;
    cvOn();
    p.t = 0; p.life = p.life || 1; p.delay = p.delay || 0;
    CV.L.push(p);
    if (!CV.raf) { CV.last = performance.now(); CV.raf = requestAnimationFrame(cvTick); }
    return p;
  }
  function cvClear() { for (const p of CV.L) p.dead = 1; }
  function cvTick(now) {
    CV.raf = 0;
    if (!CV.c) return;
    const dt = Math.min(0.05, (now - CV.last) / 1000) / (SPD || 1), x = CV.x, d = CV.dpr;
    CV.last = now;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, CV.c.width, CV.c.height); x.setTransform(d, 0, 0, d, 0, 0);
    for (const p of CV.L) {
      if (p.dead) continue;
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.t += dt;
      const u = Math.min(1, p.t / p.life);
      try { if (p.upd) p.upd(p, dt, u); DRAW[p.k](x, p, u, dt); } catch (e) { p.dead = 1; }
      if (u >= 1) p.dead = 1;
    }
    CV.L = CV.L.filter((p) => !p.dead);
    if (CV.L.length) CV.raf = requestAnimationFrame(cvTick);
    else { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, CV.c.width, CV.c.height); CV.off = setTimeout(() => { if (!CV.L.length && CV.c) { CV.c.remove(); CV.c = null; } }, 250); }
  }
  const env = (u, fi, fo) => (u < fi ? u / fi : 1 - Math.pow(Math.max(0, (u - fi) / (1 - fi)), fo || 2));
  const DRAW = {
    /* mảnh tam giác cắt từ ảnh thật */
    shard(x, p, u, dt) {
      if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt;
      const a = env(u, 0.02, p.fo || 2.2), s = p.shrink ? 1 - u * 0.55 : 1;
      if (a <= 0.01) return;
      x.save(); x.globalAlpha = a; x.globalCompositeOperation = p.blend || "source-over";
      x.translate(p.x, p.y); x.rotate(p.rot); x.scale(s, s);
      x.beginPath(); x.moveTo(p.pts[0][0], p.pts[0][1]); x.lineTo(p.pts[1][0], p.pts[1][1]); x.lineTo(p.pts[2][0], p.pts[2][1]); x.closePath();
      x.save(); x.clip(); x.drawImage(p.img, -p.ox, -p.oy, p.dw, p.dh); x.restore();
      if (p.edge) { x.globalCompositeOperation = "lighter"; x.strokeStyle = p.edge; x.lineWidth = 1.1; x.globalAlpha = a * (1 - u) * 0.9; x.stroke(); }
      x.restore();
    },
    /* thẻ cháy: ngưỡng nhiễu trên bitmap, mép cháy màu cam */
    diss(x, p, u) {
      const th = lerp(-0.08, 1.08, p.ease ? p.ease(u) : u), N = p.noise, s = p.src.data, o = p.out.data, n = N.length;
      for (let i = 0; i < n; i++) {
        const v = N[i], j = i * 4;
        if (v < th) { o[j + 3] = 0; continue; }
        const e = v - th;
        if (e < 0.06 && s[j + 3] > 0) { const k = 1 - e / 0.06; o[j] = 255; o[j + 1] = 120 + 110 * k; o[j + 2] = 30 + 120 * k * k; o[j + 3] = 255; }
        else { o[j] = s[j]; o[j + 1] = s[j + 1]; o[j + 2] = s[j + 2]; o[j + 3] = s[j + 3]; }
      }
      p.oc.getContext("2d").putImageData(p.out, 0, 0);
      x.save(); x.globalAlpha = Math.min(1, (1 - u) * 6); x.translate(p.x, p.y); if (p.rot) x.rotate(p.rot); x.drawImage(p.oc, -p.w / 2, -p.h / 2, p.w, p.h); x.restore();
    },
    /* dải năng lượng lượn sóng giữa hai điểm (có thể đang động) */
    rib(x, p, u) {
      const A = p.a(), B = p.b(), a = env(u, 0.12, 3) * (p.a0 || 1), g = p.grow ? Math.min(1, u / p.grow) : 1;
      if (!A || !B || a <= 0.01) return;
      const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = 22, T = p.t * p.sp + p.ph;
      x.save(); x.globalCompositeOperation = "lighter"; x.lineCap = "round"; x.lineJoin = "round";
      for (const [w, c, al] of [[p.w * 3.2, p.c, 0.22], [p.w, p.c, 0.85], [p.w * 0.38, "#ffffff", 0.9]]) {
        x.beginPath();
        for (let i = 0; i <= n * g; i++) { const t = i / n, w0 = Math.sin(Math.PI * t) * p.amp * Math.sin(t * p.f * 6.283 - T); x.lineTo(A[0] + dx * t + nx * w0, A[1] + dy * t + ny * w0); }
        x.strokeStyle = c; x.globalAlpha = a * al; x.lineWidth = w; x.stroke();
      }
      x.restore();
    },
    /* nét chém mọc dần */
    path(x, p, u) {
      const pts = p.pts, g = Math.min(1, u / (p.grow || 0.2)), m = Math.max(2, Math.round(pts.length * g)), a = env(u, 0.02, 2.4);
      x.save(); x.globalCompositeOperation = "lighter"; x.lineCap = "round"; x.lineJoin = "round";
      for (const [w, c, al] of [[p.w * 3, p.c, 0.3], [p.w, p.c, 0.95], [p.w * 0.4, "#ffffff", 1]]) {
        x.beginPath(); for (let i = 0; i < m; i++) x.lineTo(pts[i][0], pts[i][1]);
        x.strokeStyle = c; x.globalAlpha = a * al; x.lineWidth = w * (1 - u * 0.5); x.stroke();
      }
      x.restore();
    },
    /* cánh tay linh hồn: ống sáng + bàn tay nét, ext (độ vươn) / close (độ nắm) */
    arm(x, p) {
      const A = p.a(), B = p.b();
      if (!A || !B) return;
      const ext = clamp(p.ext, 0, 1), a = p.alpha == null ? 1 : p.alpha;
      if (ext <= 0.02 || a <= 0.01) return;
      const mx = (A[0] + B[0]) / 2 + p.bend, my = Math.min(A[1], B[1]) - 36, n = 26, pts = [];
      for (let i = 0; i <= n; i++) { const t = (i / n) * ext, v = 1 - t; pts.push([v * v * A[0] + 2 * v * t * mx + t * t * B[0], v * v * A[1] + 2 * v * t * my + t * t * B[1]]); }
      x.save(); x.globalCompositeOperation = "lighter"; x.lineCap = "round"; x.lineJoin = "round";
      for (const [w, c, al] of [[p.w * 3, p.c, 0.18], [p.w * 1.6, p.c, 0.45], [p.w, p.c2, 0.85], [p.w * 0.35, "#ffffff", 0.95]]) {
        x.beginPath(); pts.forEach((q, i) => (i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])));
        x.strokeStyle = c; x.globalAlpha = a * al; x.lineWidth = w; x.stroke();
      }
      const q = pts[n], q0 = pts[n - 2], ang = Math.atan2(q[1] - q0[1], q[0] - q0[0]), cl = clamp(p.close, 0, 1), hs = p.hs || 1;
      x.translate(q[0], q[1]); x.rotate(ang); x.scale(hs, hs);
      x.strokeStyle = p.c2; x.lineWidth = 2.4; x.globalAlpha = a;
      x.beginPath(); x.ellipse(0, 0, 8, 7, 0, 0, 6.283); x.stroke();
      for (let i = 0; i < 4; i++) { const sp = (i - 1.5) * 0.34 * (1 - cl * 0.7), L = 14 - Math.abs(i - 1.5) * 2; x.beginPath(); x.moveTo(6, 0); x.quadraticCurveTo(6 + L * 0.6, Math.sin(sp) * L, 6 + L * Math.cos(sp) * (1 - cl * 0.45), Math.sin(sp) * L + cl * 6 * (i - 1.5)); x.stroke(); }
      x.beginPath(); x.moveTo(0, -6); x.quadraticCurveTo(8, -14 + cl * 6, 12 - cl * 4, -8 + cl * 6); x.stroke();
      x.fillStyle = p.c; x.globalAlpha = a * 0.25; x.beginPath(); x.arc(0, 0, 16, 0, 6.283); x.fill();
      x.restore();
    },
  };
  /* mảnh vỡ cắt từ ảnh/canvas: tâm (cx,cy), cỡ vẽ dw×dh; bỏ mảnh rỗng theo kênh alpha */
  function shatter(src, cx, cy, dw, dh, o) {
    o = o || {};
    const cols_ = o.cols || 5, rows = o.rows || 6, pts = [];
    for (let j = 0; j <= rows; j++) { pts.push([]); for (let i = 0; i <= cols_; i++) { const ji = i > 0 && i < cols_ ? rnd(-0.32, 0.32) : 0, jj = j > 0 && j < rows ? rnd(-0.32, 0.32) : 0; pts[j].push([((i + ji) / cols_) * dw, ((j + jj) / rows) * dh]); } }
    let AL = null, sw = 0, shh = 0;
    try { sw = Math.max(8, Math.round(dw / 4)); shh = Math.max(8, Math.round(dh / 4)); const sc = document.createElement("canvas"); sc.width = sw; sc.height = shh; const sx = sc.getContext("2d"); sx.drawImage(src, 0, 0, sw, shh); AL = sx.getImageData(0, 0, sw, shh).data; } catch (e) { AL = null; }
    const alpha = (x, y) => (AL ? AL[(clamp(Math.floor((y / dh) * shh), 0, shh - 1) * sw + clamp(Math.floor((x / dw) * sw), 0, sw - 1)) * 4 + 3] : 255);
    let n = 0;
    const tri = (a, b, c) => {
      const gx = (a[0] + b[0] + c[0]) / 3, gy = (a[1] + b[1] + c[1]) / 3;
      if (Math.max(alpha(gx, gy), alpha((a[0] + gx) / 2, (a[1] + gy) / 2), alpha((b[0] + gx) / 2, (b[1] + gy) / 2), alpha((c[0] + gx) / 2, (c[1] + gy) / 2)) < 40) return;
      const dx = gx - dw / 2, dy = gy - dh / 2, L = Math.hypot(dx, dy) || 1, sp = (o.spd || 240) * rnd(0.5, 1.2);
      n++;
      cvAdd({ k: "shard", img: src, pts: [a, b, c].map((q) => [q[0] - gx, q[1] - gy]), ox: gx, oy: gy, dw, dh, x: cx - dw / 2 + gx, y: cy - dh / 2 + gy,
        vx: (dx / L) * sp * (o.sx || 1) + rnd(-30, 30), vy: (dy / L) * sp * (o.sy || 1) + (o.vy || 0) + rnd(-30, 30), g: o.g == null ? 500 : o.g, drag: o.drag || 0.8, rot: 0, vr: rnd(-1, 1) * (o.vr || 5),
        life: rnd((o.life || 1) * 0.7, o.life || 1), fo: o.fo || 2.5, blend: o.blend, edge: o.edge, shrink: o.shrink, delay: o.delay ? rnd(0, o.delay) : 0 });
    };
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols_; i++) { const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i], d = pts[j + 1][i + 1]; if ((i + j) % 2) { tri(a, b, d); tri(a, d, c); } else { tri(a, b, c); tri(b, d, c); } }
    return n;
  }
  /* bitmap khung thẻ (không nhân vật) để vỡ / cháy: viền màu bậc, nền tối, nền thẻ (img/nen) nếu có, tên */
  const NBI = new Map();
  function nbImg(id) {
    let u = "";
    try { const m = /url\(\s*['"]?([^'")]+)/.exec((typeof nbL === "function" && nbL(id)) || ""); if (m) u = m[1]; } catch (e) {}
    if (!u) return null;
    let i = NBI.get(u);
    if (!i) { i = new Image(); i.src = u; NBI.set(u, i); }
    return i.complete && i.naturalWidth ? i : null;
  }
  /* bitmap trung thực của lá thẻ đang hiện (đọc từ DOM): màu nền/viền, nền thẻ, ảnh nhân vật (tuỳ chọn), tên, năng lượng, sức mạnh */
  function cardBmp(card, o) {
    o = o || {};
    if (!card) return null;
    const w = card.offsetWidth, h = card.offsetHeight;
    if (!w || !h) return null;
    const S = 2, c = document.createElement("canvas");
    c.width = Math.round(w * S); c.height = Math.round(h * S);
    const x = c.getContext("2d"), cs = getComputedStyle(card), hc = (cs.getPropertyValue("--hc") || "").trim() || "#8a7cff";
    const br = Math.min(parseFloat(cs.borderTopLeftRadius) || 8, w / 3) * S, bw = (parseFloat(cs.borderTopWidth) || 1.5) * S;
    const rr = (X, Y, w2, h2, r2) => { x.beginPath(); x.moveTo(X + r2, Y); x.arcTo(X + w2, Y, X + w2, Y + h2, r2); x.arcTo(X + w2, Y + h2, X, Y + h2, r2); x.arcTo(X, Y + h2, X, Y, r2); x.arcTo(X, Y, X + w2, Y, r2); x.closePath(); };
    rr(0, 0, c.width, c.height, br); x.fillStyle = hc; x.fill();
    rr(bw, bw, c.width - 2 * bw, c.height - 2 * bw, Math.max(1, br - bw)); x.save(); x.clip();
    const bg = cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) ? cs.backgroundColor : "#1a1636";
    x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    const g0 = x.createLinearGradient(0, 0, 0, c.height); g0.addColorStop(0, "rgba(255,255,255,.08)"); g0.addColorStop(1, "rgba(0,0,0,.35)"); x.fillStyle = g0; x.fillRect(0, 0, c.width, c.height);
    try {
      const nb = card.querySelector("[data-nth]"), m = nb && /url\(\s*['"]?([^'")]+)/.exec(getComputedStyle(nb).getPropertyValue("--nbimg") || nb.style.getPropertyValue("--nbimg") || "");
      if (m) { let i = NBI.get(m[1]); if (!i) { i = new Image(); i.src = m[1]; NBI.set(m[1], i); } if (i.complete && i.naturalWidth) { const sc = Math.max(c.width / i.naturalWidth, c.height / i.naturalHeight); x.drawImage(i, (c.width - i.naturalWidth * sc) / 2, (c.height - i.naturalHeight * sc) / 2, i.naturalWidth * sc, i.naturalHeight * sc); } }
    } catch (e) {}
    const art = card.querySelector("img.art");
    if (art && !o.noArt && art.complete && art.naturalWidth) {
      const ax = art.offsetLeft * S, ay = art.offsetTop * S, aw = art.offsetWidth * S, ah = art.offsetHeight * S, fit = getComputedStyle(art).objectFit, iw = art.naturalWidth, ih = art.naturalHeight;
      let dw = aw, dh = ah;
      if (fit === "contain" || fit === "cover") { const k = fit === "contain" ? Math.min(aw / iw, ah / ih) : Math.max(aw / iw, ah / ih); dw = iw * k; dh = ih * k; }
      x.drawImage(art, ax + (aw - dw) / 2, ay + (ah - dh) / 2, dw, dh);
    }
    if (o.dark) { x.fillStyle = "rgba(6,4,18,.42)"; x.fillRect(0, 0, c.width, c.height); }
    const vg = x.createLinearGradient(0, c.height * 0.6, 0, c.height); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.7)"); x.fillStyle = vg; x.fillRect(0, 0, c.width, c.height);
    x.restore();
    const txt = (sel) => { const e = card.querySelector(sel); return e ? (e.textContent || "").trim() : ""; };
    const nm = txt(".mn,.lcn,.n");
    if (nm) { x.font = `italic 900 ${Math.round(Math.min(11, w / 6.2) * S)}px sans-serif`; x.fillStyle = "#fff4d8"; x.textAlign = "center"; x.shadowColor = "#000"; x.shadowBlur = 3 * S; x.fillText(nm, c.width / 2, c.height - 6 * S, c.width - 8 * S); x.shadowBlur = 0; }
    const badge = (v, X, Y, c1, c2) => { if (!v) return; const r = Math.min(9, w / 7) * S; const g = x.createRadialGradient(X - r * 0.3, Y - r * 0.3, 0, X, Y, r); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.beginPath(); x.arc(X, Y, r, 0, 6.283); x.fill(); x.font = `italic 900 ${Math.round(r * 1.1)}px sans-serif`; x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(v, X, Y + 1); x.textBaseline = "alphabetic"; };
    badge(txt(".cst,.lcc"), 9 * S, 9 * S, "#9ff2ff", "#1b6cff");
    badge(txt(".pwh,.lcp"), c.width - 9 * S, 9 * S, "#ffd27a", "#ff8a2b");
    return c;
  }
  function frameBmp(id, w, h, dark) {
    const S = 2, c = document.createElement("canvas"), W0 = Math.max(8, Math.round(w * S)), H0 = Math.max(8, Math.round(h * S));
    c.width = W0; c.height = H0;
    const x = c.getContext("2d"), d = C[id] || {}, hc = (d.h && HC[d.h]) || "#8a7cff", r = 7 * S;
    const rr = (X, Y, w2, h2, r2) => { x.beginPath(); x.moveTo(X + r2, Y); x.arcTo(X + w2, Y, X + w2, Y + h2, r2); x.arcTo(X + w2, Y + h2, X, Y + h2, r2); x.arcTo(X, Y + h2, X, Y, r2); x.arcTo(X, Y, X + w2, Y, r2); x.closePath(); };
    rr(0, 0, W0, H0, r); x.fillStyle = hc; x.fill();
    rr(1.5 * S, 1.5 * S, W0 - 3 * S, H0 - 3 * S, r * 0.8); x.save(); x.clip();
    const g = x.createLinearGradient(0, 0, 0, H0); g.addColorStop(0, "#2a2450"); g.addColorStop(1, "#0c0a20"); x.fillStyle = g; x.fillRect(0, 0, W0, H0);
    const nb = nbImg(id);
    if (nb) { const sc = Math.max(W0 / nb.naturalWidth, H0 / nb.naturalHeight); x.drawImage(nb, (W0 - nb.naturalWidth * sc) / 2, (H0 - nb.naturalHeight * sc) / 2, nb.naturalWidth * sc, nb.naturalHeight * sc); }
    if (dark) { x.fillStyle = "rgba(6,4,18,.5)"; x.fillRect(0, 0, W0, H0); }
    const vg = x.createLinearGradient(0, H0 * 0.55, 0, H0); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.75)"); x.fillStyle = vg; x.fillRect(0, 0, W0, H0);
    x.restore();
    if (d.n) { x.font = `italic 900 ${Math.round(9 * S)}px sans-serif`; x.fillStyle = "#fff4d8"; x.textAlign = "center"; x.shadowColor = "#000"; x.shadowBlur = 3 * S; x.fillText(d.n.length > 16 ? d.n.slice(0, 15) + "…" : d.n, W0 / 2, H0 - 6 * S, W0 - 8 * S); }
    return c;
  }
  function dissolve(bmp, x, y, w, h, o) {
    o = o || {};
    const bw = bmp.width, bh = bmp.height, sx = bmp.getContext("2d"), src = sx.getImageData(0, 0, bw, bh), oc = document.createElement("canvas");
    oc.width = bw; oc.height = bh;
    const out = oc.getContext("2d").createImageData(bw, bh), gw = 8, gh = 11, grid = Array.from({ length: (gw + 1) * (gh + 1) }, () => Math.random()), N = new Float32Array(bw * bh);
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
      const fx = (i / bw) * gw, fy = (j / bh) * gh, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, Gd = (a, b) => grid[b * (gw + 1) + a];
      const v = lerp(lerp(Gd(ix, iy), Gd(ix + 1, iy), tx), lerp(Gd(ix, iy + 1), Gd(ix + 1, iy + 1), tx), ty);
      N[j * bw + i] = clamp(v * 0.5 + (1 - j / bh) * 0.45 + Math.random() * 0.05, 0, 1);
    }
    return cvAdd({ k: "diss", src, out, oc, noise: N, x, y, w, h, rot: o.rot || 0, life: o.life || 0.9, upd: o.upd });
  }

  /* ---------- ló khỏi khung: ảnh nhân vật trong chính lá thẻ (img.art) dịch ra ngoài mép khung ----------
     .hxpk tạm bỏ overflow:hidden của .mc -> phần ra ngoài vượt qua viền, phần trong vẫn nằm DƯỚI tên/sức mạnh; theo mọi transform của lá. */
  function peek(el, kf, ms, o) {
    o = o || {};
    if (!el || !el.isConnected) return null;
    const art = el.querySelector(":scope>img.art");
    if (!art || !art.complete || !art.naturalWidth) return null;
    /* một lá chỉ một lần ló tại một thời điểm: lần mới thay lần cũ */
    if (el._hxpk) el._hxpk.end();
    const tm = { duration: ms, easing: o.easing || "linear", delay: o.delay || 0, fill: "both" };
    const h = { el, art, a: null, done: 0 };
    const bind = (e2, a2, t) => {
      h.el = e2; h.art = a2; e2._hxpk = h; e2.classList.add("hxpk");
      h.a = a2.animate(kf, tm);
      if (t) h.a.currentTime = t;
      h.a.onfinish = () => j.fin(false);
    };
    h.end = () => { if (h.done) return; h.done = 1; try { h.a.cancel(); } catch (e) {} const e2 = h.el; if (e2._hxpk === h) { e2._hxpk = null; e2.classList.remove("hxpk"); } };
    const j = job(() => h.end(), ms + (o.delay || 0));
    bind(el, art, 0);
    /* lá trên bàn bị vẽ lại giữa chừng (render) -> chuyển nhịp ló sang phần tử mới, đúng thời điểm (không giật) */
    const uid = el.dataset && el.dataset.mc;
    if (uid && el.closest("#board")) {
      const chk = () => {
        if (h.done) return;
        if (!h.el.isConnected) {
          const n = mcOf(uid), a2 = n && n.querySelector(":scope>img.art");
          if (!n || !a2 || !(a2.complete && a2.naturalWidth)) { j.fin(true); return; }
          const t = h.a.currentTime;
          try { h.a.cancel(); } catch (e) {}
          bind(n, a2, t);
          tap("HX:rebind", { uid });
        }
        requestAnimationFrame(chk);
      };
      requestAnimationFrame(chk);
    }
    return h;
  }
  const PK = (dy, s, r) => ({ transform: `translateY(${dy.toFixed(1)}%) rotate(${(r || 0).toFixed(2)}deg) scale(${s.toFixed(3)})` });

  /* hồn rời thẻ: ảnh cố định trùng khít ảnh nhân vật trong lá (cùng nguồn đã giải mã) */
  function soulFrom(art, c) {
    const b = art.getBoundingClientRect();
    if (!b.width || !art.complete || !art.naturalWidth) return null;
    const cs = getComputedStyle(art), d = document.createElement("div");
    d.className = "hxsoul";
    d.style.cssText = `left:${b.left.toFixed(1)}px;top:${b.top.toFixed(1)}px;width:${b.width.toFixed(1)}px;height:${b.height.toFixed(1)}px;--c:${c || "#8ab4ff"}`;
    d.innerHTML = `<img src="${art.currentSrc || art.src}" alt="" draggable="false" style="object-fit:${cs.objectFit};object-position:${cs.objectPosition}">`;
    document.body.appendChild(d);
    return { d, img: d.querySelector("img"), x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height };
  }

  /* ================= RB-B RÚT BÀI "ÁNH LỬA ẤN" (gpu62, thay HX-01 — không hồn) =================
     Đỉnh bộ bài loé ấn sáng; lá rời bộ bài ÚP (mặt lưng là lớp .hxbk trong chính lá), bay vòng cung và lật một vòng rotateY giữa không trung
     (thấy mặt từ ~185 ms), đáp vào tay với vòng tia lửa theo hệ của lá. 1 lá ≈ 0,56 s; lá sau lệch 150 ms (3 lá ≈ 0,86 s). */
  const d0 = CFX.drawIn;
  CFX.drawIn = function (el, cr, k) {
    try {
      const u = +(el && el.dataset.hc), c = G && G.hand.p.find((x) => x.uid === u);
      if (c && ok(c.id) && !ff()) { if (drawRB(el, c, k | 0)) return; }
    } catch (e) { console.error(e); }
    return d0.call(this, el, cr, k);
  };
  function drawRB(el, c, k) {
    const b = el.getBoundingClientRect();
    if (!b.width) return false;
    el.style.opacity = "";
    const id = c.id, dz = (typeof DECKZ === "function" && DECKZ("p")) || { x: innerWidth * 0.2, y: 50 };
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2, dx = dz.x - cx, dy = dz.y - cy, lite = isLite();
    const T = 560, L0 = 70, LF = 400, dl = k * 150, FL = 185;
    /* tư thế nghỉ của lá trên tay (quạt: translateY) -> khung cuối trùng khít, không giật khi hoạt ảnh xong */
    let ry = 0;
    try { const m = new DOMMatrixReadOnly(getComputedStyle(el).transform); ry = m.m42 || 0; } catch (e) {}
    const up = dy < -40, mx = up ? dx * 0.16 : dx / 2, my = up ? dy * 0.4 : Math.min(dy, 0) - 80;
    const bz = (u) => { const v = 1 - u; return [v * v * dx + 2 * v * u * mx, v * v * dy + 2 * v * u * my]; };
    const eo = (u) => 1 - Math.pow(1 - u, 2.2), sm = (u) => u * u * (3 - 2 * u);
    const s0 = clamp((dz.w || 40) / b.width, 0.32, 0.6);
    const tf = (x, y, r, yr, s) => `perspective(900px) translate(${x.toFixed(1)}px,${(y + ry).toFixed(1)}px) rotate(${r.toFixed(2)}deg) rotateY(${yr.toFixed(1)}deg) scale(${s.toFixed(3)})`;
    const yAt = (t) => 180 * (1 - sm(clamp((t - L0) / 230, 0, 1)));
    const kf = [{ transform: tf(dx, dy, -12, 180, s0 * 0.8), opacity: 0, offset: 0 }, { transform: tf(dx, dy, -12, 180, s0), opacity: 1, offset: L0 / T }];
    const N = 12;
    for (let i = 1; i <= N; i++) {
      const u = i / N, t = L0 + LF * u, e = eo(u), [x, y] = bz(e);
      kf.push({ transform: tf(x, y, lerp(-12, 0, e), yAt(t), lerp(s0, 1, Math.min(1, e * 1.15)) * (1 + 0.18 * Math.sin(Math.PI * Math.min(1, u * 1.05)))), opacity: 1, offset: t / T });
    }
    kf[kf.length - 1].transform = tf(0, 0, 0, 0, 1.06);
    kf.push({ transform: tf(0, 0, 0, 0, 1), opacity: 1, offset: 1 });
    const a = el.animate(kf, { duration: T, delay: dl, easing: "linear", fill: "backwards" });
    /* mặt lưng: lớp trong lá, tắt đúng lúc lá quay qua 90° */
    const bk = document.createElement("i");
    bk.className = "hxbk"; bk.setAttribute("aria-hidden", "true");
    try { bk.style.background = P6.back({ own: "p" }); } catch (e) { bk.style.background = "#2a2060"; }
    el.appendChild(bk);
    const ab = bk.animate([{ opacity: 1 }, { opacity: 1, offset: FL / T }, { opacity: 0, offset: Math.min(1, (FL + 1) / T) }, { opacity: 0 }], { duration: T, delay: dl, easing: "linear", fill: "both" });
    const j = job((fast) => { bk.remove(); if (fast) { try { a.finish(); } catch (e) {} } }, dl + T);
    ab.onfinish = () => j.fin(false);
    const { c1, c2, L } = cols(id), col = c.cr ? "#ffd65a" : c1;
    /* đỉnh bộ bài loé: quầng + vòng + ấn xoay */
    fxT(() => {
      glow(dz.x, dz.y, "#ffd76a", 64, 0.36, 0.75);
      ring(dz.x, dz.y, "#ffd76a", 46, 0.32, 0.9);
      if (!lite) { try { FX.sigil(dz.x, dz.y, "#ffd76a", 22, 6, false, 0.4); } catch (e) {} }
      try { SFX.play("whoosh"); } catch (e) {}
    }, dl);
    /* đuôi sáng theo hệ dọc đường bay (hạt GPU, có trần) */
    const n = lite ? 5 : 10;
    for (let i = 1; i <= n; i++) {
      const u = i / (n + 1), e = eo(u), [x, y] = bz(e);
      E6({ x: cx + x, y: cy + y, vx: rnd(-20, 20), vy: rnd(-20, 20), c: [c1, c2, "#ffd76a"][i % 3], kind: 0, s0: rnd(6, 10), s1: 1.5, drag: 1.5, dur: 0.3, a: 0.85, delay: (dl + L0 + LF * u) / 1000 });
    }
    fxT(() => {
      if (!el.isConnected) return;
      const q = ctrR(el.getBoundingClientRect());
      if (!q.w) return;
      ring(q.x, q.y, col, q.w * 1.2, 0.38, 0.95);
      glow(q.x, q.y, c1, q.w * 1.5, 0.3, 0.55);
      streaks(q.x, q.y, [c1, c2, "#ffffff"], lite ? 7 : 14, 280, 0, 6.283, 0.36, 5);
      try { SFX.play("place"); } catch (e) {}
      tap("RB:land", { id, uid: c.uid });
    }, dl + L0 + LF + 10);
    live(dl + T + 60);
    tap("RB", { id, uid: c.uid, k });
    return true;
  }
  const IMR = new Map();
  function imgReady(u) {
    if (!u) return null;
    let i = IMR.get(u);
    if (!i) { i = new Image(); i.decoding = "async"; i.src = u; IMR.set(u, i); if (i.decode) i.decode().catch(() => {}); return null; }
    return i.complete && i.naturalWidth ? i : null;
  }
  /* tải trước ảnh tư thế cho hồn loé */
  HXG.warm = function (ids) { for (const k of ids || []) if (ok(k)) imgReady(K.soulUrl(k)); };
  try { const w0 = warmMatch12; warmMatch12 = function () { const r = w0.apply(this, arguments); try { const ids = new Set(); for (const sd of ["p", "a"]) for (const z of ["hand", "deck"]) for (const c of (G[z] && G[z][sd]) || []) ids.add(c.id); setTimeout(() => HXG.warm([...ids]), 1300); } catch (e) {} return r; }; } catch (e) {}

  /* ================= HX-02 LẬT THẺ ================= */
  HXG.flip = function (uid, p) {
    const id = idOf(uid);
    if (!ok(id) || ff() || !p) return false;
    /* gpu62: S1–S3 (và mọi bậc khác ngoài S4/S5) lật đúng kiểu cũ gpu59/gpu60 — kể cả khi ltd_hx_all=1 */
    if (!/^S[45]$/.test((C[id] || {}).h || "")) return false;
    const el = mcOf(uid);
    if (!el || !el.classList.contains("flip")) return false;
    const d = C[id], h5 = d.h === "S5" || d.h === "S4", { e, c1, c2, L } = cols(id), lite = isLite(), T = 420;
    el._hx2 = performance.now();
    /* hx2 giữ tới khi lá được vẽ lại (gỡ ra sẽ làm keyframes flip của CSS chạy lại); hx2z chỉ nổi lá trong lúc lật */
    el.classList.add("hx2", "hx2z");
    const pr = "perspective(640px)";
    const a = el.animate([
      { transform: `${pr} translateY(0) rotateY(-90deg) scale(1.04)`, opacity: 0.55 },
      { transform: `${pr} translateY(-9px) rotateY(12deg) scale(1.22)`, opacity: 1, offset: 0.48 },
      { transform: `${pr} translateY(-7px) rotateY(0deg) scale(1.19)`, opacity: 1, offset: 0.66 },
      { transform: `${pr} translateY(2px) rotateY(0deg) scale(.96)`, opacity: 1, offset: 0.86 },
      { transform: "none", opacity: 1 }], { duration: T, easing: "cubic-bezier(.25,.8,.3,1)" });
    const fin = () => { el.classList.remove("hx2z"); };
    a.onfinish = fin; fxT(fin, T + 120);
    const { x, y, w, h } = p;
    /* S4/S5: hồn ló nửa người khỏi mép trên trong lúc lá đang nhấc cao, thụt về trước khi lá đáp (xong trong nhịp lật, trước khi bàn vẽ lại) */
    if (h5 && !lite) fxT(() => {
      if (!el.isConnected) return;
      peek(el, [PK(0, 1, 0), PK(-44, 1.2, -3), PK(-48, 1.24, 2), PK(-26, 1.1, -1), PK(0, 1, 0)].map((k, i) => Object.assign(k, { offset: [0, 0.32, 0.55, 0.8, 1][i] })), T * 0.5, { easing: "cubic-bezier(.3,.7,.3,1)" });
      const q = ctrR(el.getBoundingClientRect());
      if (q.w) streaks(q.x, q.y - q.h * 0.55, L, 10, 260, -2.7, -0.45, 0.4, 5);
    }, T * 0.4);
    /* lúc mặt thẻ quay ra: loé + vòng theo hệ */
    fxT(() => {
      glow(x, y, c1, w * 1.7, 0.42, 0.65);
      ring(x, y, c2, w * 1.25, 0.42, 0.9);
      star(x, y - h * 0.1, "#ffffff", w * 1.2, 0.26);
      streaks(x, y, L, lite ? 8 : 16, 300, -3.05, -0.1, 0.5, 5.5);
    }, T * 0.45);
    /* đáp: vòng bụi + ấn dưới chân + hiệu ứng hệ cũ (elFx) */
    fxT(() => {
      ring(x, y + h * 0.42, c1, w * 1.3, 0.5, 0.75, 0.32);
      try { FX.sigil(x, y + h * 0.42, c1, w * 0.85, 6, true, 0.85); } catch (er) {}
      try { if (e) elFx(e, x, y, w, h, lite); } catch (er) {}
      const art = el.querySelector(":scope>img.art");
      if (!(h5 && !lite) && art) art.animate([{ transform: "scale(1)" }, { transform: "scale(1.1) translateY(-3%)", offset: 0.4 }, { transform: "scale(1)" }], { duration: 260, easing: "ease-out" });
      tap("HX02:land", { uid, id });
    }, T * 0.84);
    live(T + 120);
    tap("HX02", { uid, id, h: d.h });
    return true;
  };

  /* ================= PA6: gom nhiều mục tiêu (HX-05/06/07) + lịch dừng ================= */
  const FANK = /^(up|down|summon)$/;
  HXG.shift = function (ch, steps) {
    if (!okU(ch.src) || ff()) return;
    const L = steps.filter((s) => s.src === ch.src && FANK.test(s.k) && !s.self29 && !s.ong && s.tp && isFinite(s.tp.x)).sort((a, b) => (a.t0 || 0) - (b.t0 || 0));
    if (L.length < 2) return;
    const t = L[0].t0 || 0;
    L.forEach((s, i) => { s.t0 = t + i * 18; s.hxFan = 1; });
    tap("HXfan", { src: ch.src, n: L.length, k: [...new Set(L.map((s) => s.k))].join(",") });
  };
  const REV = new Map(); /* uid thẻ hồi sinh -> stop của PA6 */
  HXG.plan = function (ch, stops) {
    if (!okU(ch.src) || ff()) return;
    /* hồi sinh do thẻ Hồn Xuất: thêm một điểm dừng (toả tới mọi ô hồi sinh cùng lúc) */
    try {
      const evs = HXG._evs || [], rv = evs.filter((e) => e.k === "revive" && e.src === ch.src && e.uid !== ch.src);
      if (rv.length && !isLite()) {
        const list = [];
        for (const e of rv) { const el = mcOf(e.uid); if (!el) continue; const b = el.getBoundingClientRect(); if (!b.width) continue; list.push({ s: { k: "revive", dst: e.uid, src: ch.src }, tp: ctrR(b) }); }
        if (list.length) {
          const t0 = stops.length ? Math.max(...stops.map((s) => s.t)) + 260 : ch.off0 + 420;
          const st = { t: t0, list };
          stops.push(st);
          for (const q of list) REV.set(q.s.dst, st);
          tap("HX05:rev", { n: list.length });
        }
      }
    } catch (e) { console.error(e); }
    for (const st of stops) {
      const ks = new Set(st.list.map((q) => q.s.k));
      st.fan = st.list.length > 1;
      st.hx = ks.has("kill") ? "kill" : ks.has("bounce") || ks.has("steal") ? "arm" : ks.has("summon") || ks.has("revive") ? "sum" : st.list.some((q) => q.s.hx15c) ? "copy" : ks.has("down") ? "down" : ks.has("up") ? "up" : st.fan ? "fan" : "";
      if (st.hx === "arm") st.hold = 200;
      else if (st.hx === "down") st.hold = 170;
      else if (st.hx === "sum") st.hold = 200;
      else if (st.hx === "up") st.hold = 90;
      else if (st.hx === "copy") st.hold = 520;
    }
  };
  HXG.ownRev = (ev) => REV.has(ev.uid) || (typeof R14 !== "undefined" && R14.has(ev.uid));
  /* HX-09: hồn ở lại cạnh thẻ nguồn (không bay tới mục tiêu), chỉ nghiêng về phía mục tiêu rồi vươn tay */
  HXG.goStop = function (ch, st, dur) {
    if (st.hx !== "arm") return false;
    let cx = 0, cy = 0;
    for (const q of st.list) { cx += q.tp.x / st.list.length; cy += q.tp.y / st.list.length; }
    const x = clamp(ch.px + (cx - ch.px) * 0.12, ch.bw / 2 + 4, innerWidth - ch.bw / 2 - 4), y = clamp(ch.py + (cy - ch.py) * 0.08 - 6, ch.bh / 2 + 4, innerHeight - ch.bh / 2 - 4);
    st.p = { x, y, s: ch.s, cx, cy };
    K.fly(ch, x, y, ch.s * 1.04, cx < ch.x ? -6 : 6, Math.max(120, dur), 14);
    if (isLite()) return true;
    const { c1, c2 } = ch.col, el = (performance.now() - ch.t0) / SPD;
    for (const q of st.list.slice(0, 4)) {
      const arm = { k: "arm", a: () => [ch.x + (q.tp.x > ch.x ? 14 : -14), ch.y + ch.bh * ch.s * 0.05], b: () => [q.tp.x, q.tp.y], ext: 0, close: 0, w: 6, hs: clamp((q.tp.w || 50) / 50, 0.8, 1.3), bend: q.tp.x > ch.x ? 40 : -40, c: c1, c2: "#ffffff", life: 9 };
      q.arm = arm;
      /* vươn trong khoảng thời gian bay, chạm đích đúng mốc trúng */
      const t0 = Math.max(el, st.t - 300), T = st.t - t0;
      K.scheduled(ch, () => {
        cvAdd(arm);
        const s0 = performance.now();
        arm.upd = (p) => { if (ch.dead || K.ch() !== ch) { p.dead = 1; return; } const u = (performance.now() - s0) / (T * SPD); if (p.ph === 1) return; p.ext = 1 - Math.pow(1 - clamp(u, 0, 1), 2); };
        tap("HX09:arm", { uid: ch.uid, dst: q.s.dst });
      }, t0);
    }
    return true;
  };
  /* đâm tới: nhiều mục tiêu -> hồn toả tia hồn tới tất cả cùng lúc (tới nơi đúng mốc trúng) */
  HXG.jab = function (ch, st) {
    if (st.hx === "arm") return true;
    if (!st.fan) return false;
    const { c1, c2, L } = ch.col, lite = isLite();
    for (const q of st.list) {
      const tp = q.tp;
      beam(ch.x, ch.y, tp.x, tp.y, c1, lite ? 6 : 9, 0.22);
      if (!lite) {
        for (let i = 0; i < 6; i++) { const t = i / 6; E6({ x: lerp(ch.x, tp.x, t), y: lerp(ch.y, tp.y, t) - Math.sin(Math.PI * t) * 18, vx: (tp.x - ch.x) * 1.4, vy: (tp.y - ch.y) * 1.4, c: L[i % L.length], kind: 0, s0: rnd(6, 11), s1: 2, drag: 2, dur: 0.22, a: 0.9, delay: t * 0.06 }); }
        bolt(ch, tp);
      }
    }
    tap("HXfan:bolts", { uid: ch.uid, n: st.list.length });
    return false;
  };
  /* tia hồn: bản sao nhỏ của hồn PA6 lao tới mục tiêu (DOM, transform/opacity) */
  function bolt(ch, tp) {
    if (!ch.so || !ch.url) return;
    const d = document.createElement("div"), w = ch.bw * 0.5, h = ch.bh * 0.5;
    d.className = "hxsoul hxbolt";
    d.style.cssText = `left:${(ch.x - w / 2).toFixed(1)}px;top:${(ch.y - h / 2).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;--c:${ch.col.c1}`;
    d.innerHTML = `<img src="${ch.url}" alt="" style="object-fit:contain">`;
    document.body.appendChild(d);
    const dx = tp.x - ch.x, dy = tp.y - ch.y, r = Math.atan2(dy, dx) * 57.3 + 90;
    const a = d.animate([{ transform: "translate(0,0) scale(.6)", opacity: 0 }, { transform: `translate(${(dx * 0.5).toFixed(1)}px,${(dy * 0.5 - 16).toFixed(1)}px) rotate(${(r * 0.15).toFixed(1)}deg) scale(.9)`, opacity: 0.9, offset: 0.5 }, { transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(.55)`, opacity: 0 }], { duration: 150, easing: "cubic-bezier(.5,0,.6,1)", fill: "both" });
    const rm = () => d.remove();
    a.onfinish = rm; fxT(rm, 500);
  }
  /* va chạm: phản ứng của từng mục tiêu, diễn cùng lúc */
  HXG.impact = function (ch, st) {
    const lite = isLite(), { c1, c2, L } = ch.col;
    tap("HX:hit", { uid: ch.uid, hx: st.hx, n: st.list.length, fan: !!st.fan });
    if (st.hx === "up") for (const q of st.list) flex(q.s.dst, q.tp, lite);
    else if (st.hx === "down") {
      const n = st.list.length;
      for (const q of st.list) drain(ch, q, n, lite);
      if (!lite) K.after(ch, 0.45, 1.3, 360);
    }
    else if (st.hx === "kill") {
      for (const q of st.list) {
        const tp = q.tp, w = tp.w || 50, h = tp.h || 70, s = Math.sign(tp.x - ch.x) || 1, pts = [];
        for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([tp.x + lerp(w * 0.75, -w * 0.75, t) * s + Math.sin(Math.PI * t) * 8, tp.y + lerp(-h * 0.6, h * 0.6, t) + Math.sin(Math.PI * t) * 6]); }
        if (!lite) cvAdd({ k: "path", pts, w: 5, c: c1, life: 0.42, grow: 0.25 });
      }
      try { SFX.play("slash"); } catch (e) {}
    }
    else if (st.hx === "arm") {
      for (const q of st.list) {
        const arm = q.arm, tp = q.tp;
        if (arm) {
          arm.ph = 1; arm.ext = 1;
          const s0 = performance.now();
          arm.upd = (p) => { const t = (performance.now() - s0) / SPD; p.close = clamp(t / 90, 0, 1); p.ext = t < 110 ? 1 : 1 - clamp((t - 110) / 300, 0, 1); p.alpha = t < 300 ? 1 : 1 - clamp((t - 300) / 140, 0, 1); if (t > 460) p.dead = 1; };
          /* đánh cắp: quả cầu sáng bị kéo về hồn */
          if (q.s.k === "steal") for (let i = 0; i < 10; i++) E6({ x: tp.x, y: tp.y, vx: (ch.x - tp.x) * 2.2 + rnd(-20, 20), vy: (ch.y - tp.y) * 2.2 + rnd(-20, 20), c: i % 2 ? c1 : "#ffffff", kind: 0, s0: rnd(8, 14), s1: 3, drag: 0.6, dur: 0.42, a: 0.95, delay: 0.1 + i * 0.012 });
        } else beam(ch.x, ch.y, tp.x, tp.y, c1, 7, 0.3);
        ring(tp.x, tp.y, c2, (tp.w || 50) * 1.2, 0.36, 0.9);
      }
      try { SFX.play("whoosh"); } catch (e) {}
    }
    else if (st.hx === "copy") { for (const q of st.list) if (q.s.hx15c) { try { mimic15(ch, q); } catch (e) { console.error(e); } } }
    else if (st.hx === "sum") {
      for (const q of st.list) if (q.s.k === "revive") { const el = mcOf(q.s.dst); REV.delete(q.s.dst); if (el && !rev14(el, q.s.dst, ch.src, { chain: 1 })) { el.classList.remove("hx14h"); materialize(el, q.s.dst, 0); } }
    }
    if (st.fan && !lite) { converge(ch.x, ch.y, L, 14, ch.bw * 0.8, 0.25); }
  };
  /* HX-06: hồn đồng minh gồng ló khỏi khung 2 nhịp */
  function flex(uid, tp, lite) {
    const el = mcOf(uid);
    if (!el) return;
    const id = idOf(uid), { c1, L } = cols(id);
    if (!lite) peek(el, [PK(0, 1, 0), PK(-46, 1.2, -3), PK(-38, 1.15, 2), PK(-50, 1.24, -2), PK(-40, 1.17, 1), PK(0, 1, 0)].map((k, i) => Object.assign(k, { offset: [0, 0.2, 0.38, 0.56, 0.78, 1][i] })), 560, { easing: "cubic-bezier(.3,.7,.3,1)" });
    const x = tp.x, y = tp.y, w = tp.w || 50, h = tp.h || 70;
    ring(x, y + h * 0.42, "#ffd76a", w * 1.4, 0.5, 0.8, 0.32);
    for (const dl of [0.12, 0.32]) fxT(() => { streaks(x, y - h * 0.55, ["#ffd76a", "#ffffff", c1], lite ? 5 : 9, 240, -2.7, -0.45, 0.38, 5); }, dl * 1000);
    tap("HX06:flex", { uid, peek: !lite });
  }
  /* HX-07: hồn địch bị kéo tụt xuống, dải năng lượng hút về hồn PA6 */
  function drain(ch, q, n, lite) {
    const el = mcOf(q.s.dst), tp = q.tp, { c1, c2 } = ch.col, h = tp.h || 70;
    if (!lite && el) peek(el, [PK(0, 1, 0), PK(30, 1.06, 3), PK(34, 1.04, -3), PK(38, 1.03, 2), PK(36, 1.02, -2), PK(0, 1, 0)].map((k, i) => Object.assign(k, { offset: [0, 0.18, 0.4, 0.6, 0.8, 1][i] })), 470, { easing: "ease-in-out" });
    const src = () => [tp.x, tp.y + h * 0.45], dst = () => [ch.x, ch.y];
    if (!lite) {
      const m = n > 1 ? 1 : 3;
      for (let i = 0; i < m; i++) cvAdd({ k: "rib", a: src, b: dst, amp: 9 + i * 6, f: 1 + i * 0.5, sp: 16 + i * 4, ph: i * 2, w: (n > 1 ? 3.2 : 4.2) - i * 0.9, c: [c1, c2, "#d8c8ff"][i], life: 0.5, grow: 0.25, a0: 0.95 });
    } else beam(tp.x, tp.y, ch.x, ch.y, c1, 6, 0.3);
    for (let i = 0; i < (lite ? 4 : 10); i++) { const t = Math.random(); E6({ x: lerp(tp.x, ch.x, t * 0.3), y: lerp(tp.y + h * 0.4, ch.y, t * 0.3), vx: (ch.x - tp.x) * 2.1, vy: (ch.y - tp.y - h * 0.4) * 2.1, c: i % 2 ? c1 : "#ffffff", kind: 0, s0: rnd(6, 11), s1: 2, drag: 0.4, dur: 0.4, a: 0.9, delay: i * 0.03 }); }
    tap("HX07:drain", { uid: q.s.dst, peek: !lite && !!el });
  }

  /* ================= HX-03 HỦY THẺ / HX-05 TRIỆU HỒI (bọc hit8) ================= */
  {
    const h0 = hit8;
    hit8 = function (s) {
      if (s && s.k === "kill" && okU(s.src) && !isLite() && !ff() && s.r0) {
        const ph = s.ph, dx = CFX.destroy;
        s.ph = null;
        CFX.destroy = (r) => { try { if (!rip(s, r, ph)) { if (ph) ph.remove(); dx.call(CFX, r); } } catch (e) { console.error(e); if (ph) ph.remove(); dx.call(CFX, r); } };
        try { return h0(s); } finally { CFX.destroy = dx; if (ph && ph.isConnected && !ph._hx) ph.remove(); }
      }
      if (s && s.k === "summon" && okU(s.src) && !ff()) {
        /* lá được triệu hồi đang bị pre8 ẩn: khung thành hình + hồn giáng (thay bản sao rơi xuống của lớp dưới); nhãn/tiếng giữ nguyên */
        const el = s.hid || mcOf(s.dst);
        let done = false;
        try { done = !!(el && materialize(el, s.dst, 0)); } catch (e) { console.error(e); }
        if (done) {
          s.hid = null;
          const sm = CFX.summon;
          CFX.summon = () => {};
          try { return h0(s); } finally { CFX.summon = sm; }
        }
      }
      return h0(s);
    };
  }
  /* hồn mục tiêu bị giật khỏi khung -> vỡ; khung rỗng sụp vụn */
  function rip(s, r, ph) {
    if (!ph || !ph.isConnected) return false;
    const art = ph.querySelector("img.art");
    if (!art || !art.complete || !art.naturalWidth) return false;
    const tid = idOf(s.dst) || "", tc = cols(tid), so = soulFrom(art, tc.c1);
    if (!so) return false;
    ph._hx = 1;
    art.style.visibility = "hidden";
    const ch = K.ch(), sx = ch && !ch.dead ? () => [ch.x, ch.y] : null;
    tap("HX03", { dst: s.dst, src: s.src });
    /* lá rung, hồn bị kéo lên */
    ph.animate([{ transform: "none" }, { transform: "translate(-4px,1px) rotate(-4deg) scale(1.05)", offset: 0.15 }, { transform: "translate(4px,-1px) rotate(3deg)", offset: 0.35 }, { transform: "translate(-2px,0) rotate(-1deg)", offset: 0.6 }, { transform: "none" }], { duration: 380, easing: "linear" });
    so.d.animate([{ transform: "none" }, { transform: "translate(3px,-8px) rotate(4deg) scale(1.04)", offset: 0.2 }, { transform: "translate(-3px,-14px) rotate(-5deg) scale(1.08)", offset: 0.45 }, { transform: "translate(3px,-20px) rotate(4deg) scale(1.1)", offset: 0.7 }, { transform: "translate(0,-24px) rotate(0) scale(1.12)" }], { duration: 300, easing: "linear", fill: "both" });
    if (sx) cvAdd({ k: "rib", a: sx, b: () => [so.x, so.y - 18], amp: 7, f: 1.5, sp: 18, ph: 0, w: 3, c: tc.c1, life: 0.34, grow: 0.3 });
    const job1 = job((fast) => { so.d.remove(); if (ph.isConnected) ph.remove(); }, 900);
    /* hồn vỡ thành mảnh ảnh thật + hạt theo hệ của mục tiêu */
    fxT(() => {
      if (job1.dead) return;
      const b = so.d.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
      shatter(art, x, y, b.width, b.height, { cols: 6, rows: 7, spd: 170, g: 150, life: 0.85, edge: "#ffe0a0", vr: 6, shrink: 1, blend: "lighter" });
      so.d.remove();
      glow(x, y, "#ffffff", so.w * 1.2, 0.16, 0.9);
      glow(x, y, tc.c1, so.w * 2, 0.45, 0.6);
      ring(x, y, tc.c2, so.w * 1.3, 0.42, 0.9);
      streaks(x, y, tc.L, 24, 300, 0, 6.283, 0.7, 6);
      try { SFX.play("boom"); } catch (e) {}
      tap("HX03:soul", { dst: s.dst });
    }, 300);
    /* khung rỗng sụp vụn */
    fxT(() => {
      if (job1.dead) return;
      const b = ph.getBoundingClientRect();
      if (b.width) {
        const bmp = cardBmp(ph.firstElementChild, { noArt: true, dark: true }) || frameBmp(tid, b.width, b.height, true);
        shatter(bmp, b.left + b.width / 2, b.top + b.height / 2, b.width, b.height, { cols: 4, rows: 5, spd: 40, g: 900, vy: -60, life: 0.8, vr: 4, sx: 1.4, sy: 0.3, delay: 0.08, shrink: 1 });
        for (let i = 0, n = kN(12); i < n; i++) { const a = rnd(Math.PI, Math.PI * 2); E6({ x: b.left + b.width / 2 + rnd(-b.width / 2, b.width / 2), y: b.bottom - 6, vx: Math.cos(a) * rnd(20, 70), vy: Math.sin(a) * rnd(20, 60), gy: -20, c: i % 2 ? "#5a4a40" : "#8a7a66", kind: 0, s0: rnd(10, 18), s1: 22, drag: 2, dur: rnd(0.5, 0.8), a: 0.45 }); }
      }
      ph.remove();
      job1.fin(false);
      tap("HX03:frame", { dst: s.dst });
    }, 470);
    live(1000);
    return true;
  }
  /* khung mới thành hình, hồn mới giáng xuống chui vào khung */
  const MAT = new Set();
  function materialize(el, uid, dl) {
    if (!el || !el.isConnected || MAT.has(uid)) return false;
    const id = idOf(uid), art = el.querySelector(":scope>img.art"), b = el.getBoundingClientRect();
    if (!id || !b.width) return false;
    MAT.add(uid);
    el.style.opacity = "";
    const { c1, c2, L } = cols(id), x = b.left + b.width / 2, y = b.top + b.height / 2, w = b.width, h = b.height, lite = isLite(), slot = el.parentElement;
    const hasArt = !!(art && art.complete && art.naturalWidth) && !lite && slot;
    tap("HX05", { uid, id, soul: hasArt });
    try { FX.sigil(x, y + h * 0.42, c1, w * 0.95, 6, true, 1); } catch (e) {}
    ring(x, y + h * 0.42, c2, w * 1.5, 0.6, 0.8, 0.32);
    el.animate([{ transform: "scale(.72)", opacity: 0 }, { transform: "scale(1.04)", opacity: 1, offset: 0.55 }, { transform: "none", opacity: 1 }], { duration: 260, easing: "cubic-bezier(.2,.8,.3,1)" });
    for (let i = 0, n = kN(20); i < n; i++) { const t = (i / n) * 4, sd = Math.floor(t), f = t - sd, hw = w / 2, hh = h / 2, px = sd === 0 ? lerp(-hw, hw, f) : sd === 1 ? hw : sd === 2 ? lerp(hw, -hw, f) : -hw, py = sd === 0 ? -hh : sd === 1 ? lerp(-hh, hh, f) : sd === 2 ? hh : lerp(hh, -hh, f); E6({ x: x + px * 1.6, y: y + py * 1.6, vx: -px * 2, vy: -py * 2, c: L[i % L.length], kind: 0, s0: rnd(5, 9), s1: 2, drag: 0, dur: 0.3, a: 0.9 }); }
    if (!hasArt) {
      if (art) art.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
      fxT(() => { glow(x, y, c1, w * 1.5, 0.35, 0.6); MAT.delete(uid); }, 220);
      live(400);
      return true;
    }
    /* hồn mới: ảnh nhân vật trong ô (theo máy quay #board), từ trên cao giáng xuống đúng chỗ ảnh trong lá */
    el.classList.add("hxm");
    const d = document.createElement("img");
    d.className = "hxds"; d.alt = ""; d.src = art.currentSrc || art.src;
    const cs = getComputedStyle(art);
    d.style.cssText = `left:${(el.offsetLeft + el.clientLeft + art.offsetLeft).toFixed(1)}px;top:${(el.offsetTop + el.clientTop + art.offsetTop).toFixed(1)}px;width:${art.offsetWidth}px;height:${art.offsetHeight}px;object-fit:${cs.objectFit};object-position:${cs.objectPosition};--c:${c1}`;
    slot.appendChild(d);
    beam(x, y - h * 2.2, x, y + h * 0.2, c1, w * 0.5, 0.42);
    const T = 300;
    const a = d.animate([{ transform: `translateY(${(-h * 1.9).toFixed(1)}px) scale(1.3)`, opacity: 0 }, { transform: `translateY(${(-h * 1.2).toFixed(1)}px) scale(1.24)`, opacity: 1, offset: 0.3 }, { transform: "translateY(0) scale(1)", opacity: 1 }], { duration: T, delay: dl || 0, easing: "cubic-bezier(.55,0,.75,.4)", fill: "both" });
    let cur = el;
    const j = job((fast) => { d.remove(); cur.classList.remove("hxm"); MAT.delete(uid); }, T + (dl || 0));
    /* bàn vẽ lại giữa chừng: chuyển lớp ẩn ảnh + hồn đang giáng sang ô mới (cùng toạ độ) */
    const chk = () => { if (j.dead) return; if (!cur.isConnected) { const n = mcOf(uid); if (!n || !n.parentElement) { j.fin(true); return; } cur = n; n.classList.add("hxm"); n.parentElement.appendChild(d); } requestAnimationFrame(chk); };
    requestAnimationFrame(chk);
    const arrive = () => {
      if (j.dead) return;
      j.fin(false);
      glow(x, y, "#ffffff", w * 1.1, 0.14, 0.9);
      ring(x, y, c2, w * 1.3, 0.4, 0.9);
      streaks(x, y, L, 14, 260, 0, 6.283, 0.5, 5);
      const a3 = cur.querySelector(":scope>img.art");
      if (a3) a3.animate([{ transform: "scale(1.12)" }, { transform: "scale(.97)", offset: 0.6 }, { transform: "none" }], { duration: 240, easing: "ease-out" });
      tap("HX05:in", { uid });
    };
    a.onfinish = arrive; fxT(arrive, T + (dl || 0) + 60);
    live(T + (dl || 0) + 260);
    return true;
  }
  /* hồi sinh do thẻ Hồn Xuất: ẩn lá tới đúng mốc hồn PA6 toả tới (HXG.impact) */
  {
    const rv0 = CFX.revive;
    CFX.revive = function (el) {
      try {
        const uid = +(el && el.dataset.mc);
        /* gpu62 (HX-14): hồi sinh của thẻ Hồn Xuất (thẻ được hồi sinh hoặc thẻ nguồn) */
        if (uid && !REV.has(uid) && R14.has(uid)) { const src = R14.get(uid); R14.delete(uid); if (rev14(el, uid, src, {})) return; }
        if (uid && REV.has(uid)) {
          el.style.opacity = "0"; el.classList.add("hx14h");
          /* bàn vẽ lại trong lúc chờ: lá mới cũng ẩn */
          const keep = () => { if (!REV.has(uid)) return; const n = mcOf(uid); if (n && !n.classList.contains("hx14h")) n.classList.add("hx14h"); requestAnimationFrame(keep); };
          requestAnimationFrame(keep);
          const st = REV.get(uid), ch = K.ch();
          /* lưới an toàn: chuỗi PA6 bị huỷ/tua nhanh -> hiện ngay */
          const wd = () => { if (!REV.has(uid)) return; const c = K.ch(); if (c && !c.dead && c === ch) { fxT(wd, 200); return; } REV.delete(uid); el.classList.remove("hx14h"); const e2 = mcOf(uid); if (e2) { e2.classList.remove("hx14h"); e2.style.opacity = ""; rv0.call(CFX, e2); } else el.style.opacity = ""; };
          fxT(wd, 600);
          return;
        }
      } catch (e) { console.error(e); }
      return rv0.apply(this, arguments);
    };
  }

  /* ================= HX-04 VỨT BÀI ================= */
  {
    const db0 = discardBeat;
    discardBeat = function (list, hMap, srcUid) {
      try {
        if (list && list.length && !reduced && !ff() && !isLite() && on()) {
          const mine = list.filter((e) => okU(srcUid) || ok(e.id));
          if (mine.length) {
            const rest = list.filter((e) => !mine.includes(e));
            if (rest.length) db0.call(this, rest, hMap, srcUid);
            mine.slice(0, 4).forEach((e, i) => burn1(e, hMap, i, mine.length));
            if (mine.length > 4) live(200);
            return;
          }
        }
      } catch (e) { console.error(e); }
      return db0.apply(this, arguments);
    };
  }
  function burn1(e, hMap, i, n) {
    const mine = e.side === "p", fr = (mine && hMap && hMap.get(e.uid)) || (mine ? zpt("hand") : zpt("oppSub") || zpt("avFoe"));
    if (!fr) return;
    const W0 = Math.min(78, innerWidth * 0.2), H0 = W0 * 1.36, k = i - (n - 1) / 2;
    /* nhấc khỏi chỗ cũ một đoạn ngắn (tay bài: lên trên; đối thủ: xuống dưới), các lá xếp ngang */
    const tx = clamp((mine ? fr.x : Math.min(fr.x, innerWidth - W0 / 2 - 40)) + k * W0 * 0.95, W0 / 2 + 10, innerWidth - W0 / 2 - 10);
    const ty = mine ? clamp(fr.y - 12, H0 / 2 + 70, innerHeight - H0 / 2 - 96) : clamp(fr.y + 120, H0 / 2 + 90, innerHeight * 0.4);
    const g = ghost({ x: tx, y: ty, w: W0, h: H0 }, liteId(e.id), "hxd");
    g.style.opacity = "0";
    const { c1, L } = cols(e.id), PILE = PILEPT(), s0 = Math.min(0.9, (fr.w || 50) / W0), rot = mine ? -3 : 3;
    tap("HX04", { uid: e.uid, id: e.id, side: e.side });
    let so = null;
    const j = job(() => { g.remove(); if (so) so.d.remove(); }, 2400);
    const t0 = performance.now();
    /* chờ ảnh của bản sao đã giải mã (không lộ khung rỗng) rồi mới hiện */
    const go = () => {
      if (j.dead) return;
      const art = g.querySelector("img.art");
      if (art && !(art.complete && art.naturalWidth) && performance.now() - t0 < 500) { requestAnimationFrame(go); return; }
      g.style.opacity = "";
      g.animate([{ transform: `translate(${(fr.x - tx).toFixed(1)}px,${(fr.y - ty).toFixed(1)}px) scale(${s0.toFixed(3)})`, opacity: 0.5 }, { transform: `translate(0,-5px) scale(1.08) rotate(${rot}deg)`, opacity: 1, offset: 0.7 }, { transform: `rotate(${rot}deg)`, opacity: 1 }], { duration: 240, delay: i * 50, easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" });
      fxT(() => burnNow(art), 260 + i * 50);
    };
    requestAnimationFrame(go);
    const burnNow = (art) => {
      if (j.dead) return;
      const card = g.firstElementChild, w = card ? card.offsetWidth : W0, h = card ? card.offsetHeight : H0;
      const bmp = cardBmp(card) || frameBmp(e.id, w, h, false);
      /* hồn rời thẻ (thẻ phe mình — bên đối thủ chỉ cháy): bản sao ảnh nhân vật bốc lên khỏi lá đang cháy */
      if (mine && art && art.complete && art.naturalWidth) {
        so = soulFrom(art, c1);
        if (so) {
          so.d.style.opacity = "0";
          so.d.animate([{ transform: "none", opacity: 0 }, { transform: "translate(-4px,-22px) rotate(-5deg) scale(1.1)", opacity: 1, offset: 0.5 }, { transform: "translate(-8px,-34px) rotate(-7deg) scale(1.14)", opacity: 1 }], { duration: 380, easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" });
        }
      }
      /* đổi sang bitmap đúng khung hình (cùng chỗ, cùng góc) rồi cháy từ dưới lên, mép cam + tàn lửa */
      g.style.visibility = "hidden";
      dissolve(bmp, tx, ty, w, h, { rot: (rot * Math.PI) / 180, life: 0.8, upd: (p, dt, u) => { if (u > 0.04 && u < 0.92 && Math.random() < 0.75) E6({ x: tx + rnd(-w / 2, w / 2), y: ty + h / 2 - u * h * 1.05, vx: rnd(-20, 20), vy: rnd(-120, -50), c: ["#ff6a1f", "#ffd27a", "#ff3a00"][(Math.random() * 3) | 0], kind: 0, s0: rnd(5, 10), s1: 1, drag: 0.5, dur: rnd(0.35, 0.6), a: 0.9 }); } });
      glow(tx, ty, "#ff6a1f", w * 2.2, 0.9, 0.45);
      glow(tx, ty + h * 0.4, "#ffd27a", w * 1.2, 0.3, 0.7);
      try { SFX.fam("discard", { el: elOf(e.id) }); } catch (er) {}
      tap("HX04:burn", { uid: e.uid });
      /* hồn chạy vào mộ bài */
      fxT(() => {
        if (j.dead) return;
        if (so) {
          const dx = PILE.x - so.x, dy = PILE.y - so.y;
          const a = so.d.animate([{ transform: "translate(-8px,-34px) rotate(-7deg) scale(1.14)", opacity: 1 }, { transform: `translate(${(dx * 0.45).toFixed(1)}px,${(dy * 0.45 - 50).toFixed(1)}px) rotate(${dx < 0 ? -14 : 14}deg) scale(.75)`, opacity: 0.95, offset: 0.5 }, { transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(.25)`, opacity: 0 }], { duration: 460, easing: "cubic-bezier(.45,0,.4,1)", fill: "both" });
          a.onfinish = () => { if (so) so.d.remove(); };
          converge(so.x, so.y - 30, L, 10, so.w * 0.8, 0.22);
        }
        fxT(() => {
          if (j.dead) return;
          ring(PILE.x, PILE.y, "#9a46ff", 50, 0.42, 0.9);
          glow(PILE.x, PILE.y, "#9a46ff", 80, 0.4, 0.6);
          try { pulse("#btnPiles", [{ transform: "scale(1.2)" }, { transform: "scale(1)" }], 300); } catch (er) {}
          j.fin(false);
          tap("HX04:grave", { uid: e.uid });
        }, mine && so ? 460 : 300);
      }, 380);
    };
    live(1450 + i * 50);
  }

  /* ================= HX-08 DI CHUYỂN: hồn và lá thẻ bay cùng một khối ================= */
  {
    const m0 = move10;
    move10 = function (s) {
      const r = m0.apply(this, arguments);
      try {
        if (s && s.k === "move" && !ff() && (okU(s.dst) || okU(s.src))) ride(s);
        /* gpu68-audit2: thẻ tự dời bằng kỹ năng của chính nó ("Có thể di chuyển": Dạ Hành, Huyễn Cơ, Thuỷ Ngân Nữ, Cá Heo Con, Cá Mập Cạn…)
           không có ảnh tư thế -> HX-08 bản không hồn: vệt hạt bám lá đang bay + vòng đáp + nhãn kỹ năng */
        else if (s && s.k === "move" && !ff() && on() && !s.src && selfMover(s.dst)) ride(s, 1);
      } catch (e) { console.error(e); }
      return r;
    };
  }
  function selfMover(uid) {
    try { const c = anyC(uid); if (!c || c.sil) return false; const a = E.ab(c); return !!C[a] && /[Cc]ó thể di chuyển/.test(C[a].x || "") && c.mt === G.turn; } catch (e) { return false; }
  }
  function ride(s, noSoul) {
    const t0 = performance.now(), id = idOf(s.dst), { c1, c2, L } = cols(id), lite = isLite();
    let ph = null, an = null;
    const find = () => {
      if (performance.now() - t0 > 1800 * SPD) return;
      ph = s.ph && s.ph.isConnected ? s.ph : ph;
      if (ph) for (const a of ph.getAnimations()) { const tm = a.effect && a.effect.getTiming(); if (tm && +tm.duration >= 200 && a.playState === "running") { an = a; break; } }
      if (!an) { requestAnimationFrame(find); return; }
      go();
    };
    const go = () => {
      const tm = an.effect.getTiming(), D = (+tm.duration) / SPD, ct = (+an.currentTime || 0) / SPD - (tm.delay || 0) / SPD, rest = Math.max(120, D - Math.max(0, ct));
      const mc = noSoul ? null : ph.querySelector(".mc") || ph.firstElementChild;
      tap("HX08", { uid: s.dst, src: s.src, peek: !!mc, self: noSoul ? 1 : 0 });
      if (noSoul) { const b0 = ph.getBoundingClientRect(); if (b0.width) { glow(b0.left + b0.width / 2, b0.top + b0.height / 2, c1, b0.width * 1.3, 0.3, 0.6); ring(b0.left + b0.width / 2, b0.top + b0.height / 2, c1, b0.width * 0.9, 0.3, 0.85); } }
      if (mc) peek(mc, [PK(0, 1, 0), PK(-42, 1.16, -6), PK(-44, 1.18, 4), PK(-40, 1.15, -3), PK(0, 1, 0)].map((k, i) => Object.assign(k, { offset: [0, 0.22, 0.5, 0.78, 1][i] })), rest, { easing: "ease-in-out" });
      /* đuôi hạt bám theo lá đang bay */
      const T1 = performance.now();
      const trail = () => {
        if (!ph.isConnected || performance.now() - T1 > rest * SPD) return;
        const b = ph.getBoundingClientRect();
        if (b.width) for (let i = 0; i < (lite ? 1 : 2); i++) E6({ x: b.left + b.width / 2 + rnd(-8, 8), y: b.top + rnd(0, b.height * 0.4), vx: rnd(-25, 25), vy: rnd(-20, 30), c: L[(Math.random() * L.length) | 0], kind: 0, s0: rnd(6, 11), s1: 2, drag: 1.4, dur: rnd(0.28, 0.45), a: 0.8 });
        requestAnimationFrame(trail);
      };
      requestAnimationFrame(trail);
      fxT(() => {
        const r1 = s.tp;
        if (!r1) return;
        ring(r1.x, r1.y + (r1.h || 70) * 0.42, "#d8c8a8", (r1.w || 50) * 1.4, 0.45, 0.75, 0.32);
        glow(r1.x, r1.y, c1, (r1.w || 50) * 1.5, 0.35, 0.55);
        if (!lite && P6.hasHx("dat")) { try { playV16("hx_dat", r1.x, r1.y + (r1.h || 70) * 0.3, Math.max(110, (r1.w || 50) * 2.2), 480, 0, 0, true); } catch (e) {} }
        if (noSoul) { try { FX.float(r1.x, r1.y - (r1.h || 70) * 0.5, "TỰ DI CHUYỂN", c1); } catch (e) {} }
        tap("HX08:land", { uid: s.dst });
      }, rest);
    };
    requestAnimationFrame(find);
  }

  /* ======================================================================================================
     gpu62: HỒN XUẤT VÒNG 3 — DT-B (Duy Trì bám lần đầu), HX-14 Hồi sinh, HX-15 Sao chép kỹ năng, HX-16 Biến đổi thẻ,
     HX-19 Năng lượng, HX-20 Cuối lượt. Cùng cổng: thẻ hành động (nguồn; hồi sinh/biến đổi: thẻ bị tác động hoặc nguồn) có ảnh tư thế,
     trừ khi ltd_hx_all=1. Mức Nhẹ: DT-B/HX-20 bản rẻ (không ló / ít hạt); HX-14/15/16/19 về đường cũ. Giảm chuyển động / FFTURN: đường cũ.
     Chạm màn hình: tua nhanh (mọi đòn đã dời lịch trúng ngay, lớp phủ dọn sạch).
     ====================================================================================================== */
  const R3 = new Set(); /* việc vòng 3 đang diễn (để chạm-tua-nhanh khi không có chuỗi PA6) */
  function job3(end, ms) { const j = job((f) => { R3.delete(j); end(f); }, ms); R3.add(j); return j; }
  const okId = (id) => !!id && ok(id);
  const artOf = (el) => { const a = el && el.querySelector(":scope>img.art"); return a && a.complete && a.naturalWidth ? a : null; };
  const soulImg = (id, el) => imgReady(K.soulUrl(id)) || artOf(el);
  const flt = (x, y, t, c) => { try { if (typeof say === "function" && say.length >= 4) say(x, y, t, c); else FX.float(x, y, t, c); } catch (e) {} };
  const bez2 = (a, c, b, u) => { const v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; };
  /* tạo .hxsoul ở tâm (x,y), cỡ w×h, ảnh src (contain, chân chạm đáy) */
  function soulAt(src, x, y, w, h, c, cls) {
    const d = document.createElement("div");
    d.className = "hxsoul" + (cls ? " " + cls : "");
    d.style.cssText = `left:${(x - w / 2).toFixed(1)}px;top:${(y - h / 2).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;--c:${c || "#8ab4ff"}`;
    d.innerHTML = `<img src="${src}" alt="" draggable="false" style="object-fit:contain;object-position:50% 100%">`;
    document.body.appendChild(d);
    return d;
  }
  const kfT = (dx, dy, s, r, o, off, sx) => ({ transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${(r || 0).toFixed(2)}deg) scale(${((sx || 1) * s).toFixed(3)},${s.toFixed(3)})`, opacity: o, offset: off });

  /* ---------- lịch: dời các bước plan8 cho nhịp vòng 3 (gọi trong plan8 qua P6.shift) ---------- */
  let HX3S = null;
  {
    const sh0 = P6.shift;
    P6.shift = function (steps) {
      let x = 0;
      try { x = sh0.apply(this, arguments) || 0; } catch (e) { console.error(e); }
      let y = 0;
      try { y = r3plan(steps); } catch (e) { console.error(e); }
      if (y) HX3S = steps;
      return x + y;
    };
  }
  const later = (steps, t, D, skip) => { for (const s of steps) if (!(skip && skip.has(s)) && (s.t0 || 0) >= t) s.t0 = (s.t0 || 0) + D; };
  function r3plan(steps) {
    if (ff() || !G || reduced) return 0;
    let extra = 0;
    /* HX-15: sao chép kỹ năng do thẻ Hồn Xuất -> bản song sinh (dài hơn đòn cũ ~0,9 s) */
    for (const s of steps) {
      if (s.k !== "copy" || s.hx15 || s.hx15c || !s.sp || !s.tp || !okU(s.src) || isLite()) continue;
      if (!mcOf(s.dst) || !artOf(mcOf(s.dst))) continue;
      /* thẻ nguồn đang xuất hồn PA6: chính hồn PA6 tới mục tiêu, bản soi gương hiện cạnh mục tiêu (HXG.impact) */
      const ch = K.ch();
      if (ch && !ch.dead && ch.src === s.src) { s.hx15c = 1; continue; }
      if (!mcOf(s.src) || !artOf(mcOf(s.src))) continue;
      s.hx15 = 1;
      later(steps, (s.t0 || 0) + 1, X15, null);
      extra += X15;
    }
    /* DT-B: hiệu ứng Duy Trì bám lần đầu */
    extra += dtPlan(steps);
    return extra;
  }

  /* ================= DT-B ẤN HỒN SAU LƯNG ================= */
  const ONGS = { g: null, s: new Set() };
  const ongSeen = () => { if (ONGS.g !== G) { ONGS.g = G; ONGS.s = new Set(); } return ONGS.s; };
  HXG.ongSeen = (uid) => ongSeen().has(uid);
  /* thẻ X đang tác động lên những thẻ nào (so sức mạnh khi tạm tắt kỹ năng của X) */
  function ongAff(X, uids) {
    const out = [], sv = X.sil;
    try {
      for (const u of uids) {
        const f = E.find(G, u);
        if (!f) continue;
        const v1 = E.power(G, f.inst, f.li);
        X.sil = true;
        let v2 = v1;
        try { v2 = E.power(G, f.inst, f.li); } finally { X.sil = sv; }
        if (v1 !== v2) out.push(u);
      }
    } finally { X.sil = sv; }
    return out;
  }
  function dtPlan(steps) {
    const ong = steps.filter((s) => s.ong && !s.fl && (s.k === "up" || s.k === "down") && s.dst && s.tp);
    if (!ong.length) return 0;
    const seen = ongSeen(), cands = [];
    for (let li = 0; li < 3; li++) for (const sd of E.SIDES) for (const c of G.locs[li].cards[sd]) {
      if (!c.rev || c.sil || seen.has(c.uid)) continue;
      const a = C[E.ab(c)];
      /* gpu66: thẻ có ấn ký kỹ năng riêng (17-sig.js) tự diễn lúc Duy Trì bắt đầu -> không chồng thêm DT-B */
      if (a && a.t === "on" && ok(c.id) && !(W.SIGK && SIGK.has(c.id))) cands.push(c);
    }
    let extra = 0, nth = 0;
    for (const X of cands) {
      const aff = ongAff(X, ong.map((s) => s.dst));
      if (!aff.length) continue;
      const L = ong.filter((s) => aff.includes(s.dst) && !s.hxDt);
      if (!L.length || !mcOf(X.uid)) continue;
      seen.add(X.uid);
      const t0 = Math.min(...L.map((s) => s.t0 || 0)) + nth * 150, oth = L.filter((s) => s.dst !== X.uid).sort((a, b) => a.tp.x - b.tp.x);
      const D0 = oth.length ? 660 : 380, D = D0 + Math.max(0, oth.length - 1) * 60, skip = new Set(L);
      later(steps, t0, D, skip);
      for (const s of L) { s.hxDt = 1; s.t0 = s.dst === X.uid ? t0 + 380 : t0 + D0 + oth.indexOf(s) * 60; }
      const tg = oth.map((s) => s.dst);
      fxT(() => { try { dtB(X.uid, X.id, tg, L.some((s) => s.dst === X.uid)); } catch (e) { console.error(e); } }, t0);
      extra += D; nth++;
      tap("DTB:plan", { uid: X.uid, n: tg.length, self: L.some((s) => s.dst === X.uid) });
    }
    return extra;
  }
  /* ấn: bóng nhân vật tô màu hệ + quầng + lõi sáng + 35% chi tiết ảnh — dựng MỘT lần mỗi thẻ */
  const EMBC = new Map();
  function embCanvas(id, c, el) {
    const k = id + "|" + c;
    if (EMBC.has(k)) return EMBC.get(k);
    const im = soulImg(id, el);
    if (!im) return null;
    const S = 256, P = 30, sil = document.createElement("canvas"), cv = document.createElement("canvas");
    sil.width = sil.height = cv.width = cv.height = S;
    const iw = im.naturalWidth, ih = im.naturalHeight, k2 = Math.min((S - 2 * P) / iw, (S - 2 * P) / ih), w = iw * k2, h = ih * k2, X = (S - w) / 2, Y = S - P - h;
    const sx = sil.getContext("2d"), x = cv.getContext("2d");
    const paint = (col) => { sx.globalCompositeOperation = "source-over"; sx.clearRect(0, 0, S, S); sx.drawImage(im, X, Y, w, h); sx.globalCompositeOperation = "source-in"; sx.fillStyle = col; sx.fillRect(0, 0, S, S); };
    paint(c);
    x.shadowColor = c; x.shadowBlur = 16; x.drawImage(sil, 0, 0); x.shadowBlur = 26; x.drawImage(sil, 0, 0); x.shadowBlur = 0;
    paint("#fff1cc");
    x.globalAlpha = 0.85; x.drawImage(sil, 0, 0);
    x.globalAlpha = 0.35; x.globalCompositeOperation = "source-atop"; x.drawImage(im, X, Y, w, h);
    EMBC.set(k, cv);
    return cv;
  }
  function dtB(uid, id, tgts, self) {
    const el = mcOf(uid);
    if (!el || !el.isConnected || !el.parentElement || !on() || ff()) return;
    const { c1, c2, L } = cols(id), lite = isLite(), cvs = embCanvas(id, c1, el);
    const b = el.getBoundingClientRect(), w = b.width, h = b.height, x = b.left + w / 2, top = b.top;
    tap("DTB", { uid, id, n: tgts.length, emb: !!cvs });
    let e = null;
    const place = (n) => {
      /* ô vuông ~1,8× chiều cao lá, tâm cao hơn tâm lá: bóng nhân vật khổng lồ đứng sau lưng, lộ phần trên khỏi mép lá */
      const W0 = n.offsetHeight * 1.8, cx = n.offsetLeft + n.offsetWidth / 2, cy = n.offsetTop + n.offsetHeight / 2 - W0 * 0.24;
      e.style.cssText = `left:${(cx - W0 / 2).toFixed(1)}px;top:${(cy - W0 / 2).toFixed(1)}px;width:${W0.toFixed(1)}px;height:${W0.toFixed(1)}px;--c:${c1}`;
      n.parentElement.insertBefore(e, n);
    };
    let ea = null, cur = el;
    if (cvs) {
      e = document.createElement("div");
      e.className = "hxemb"; e.setAttribute("aria-hidden", "true");
      const k = document.createElement("canvas");
      k.width = cvs.width; k.height = cvs.height; k.getContext("2d").drawImage(cvs, 0, 0);
      e.appendChild(k);
      place(el);
      /* nhịp: hiện 0–300 ms (vượt đà), giữ tới ~860 ms (sợi sáng chạm các thẻ), tắt dần tới 1130 ms — easing theo từng đoạn, tổng thể tuyến tính */
      ea = e.animate([{ transform: "scale(.55)", opacity: 0, easing: "cubic-bezier(.2,.8,.3,1)" }, { transform: "scale(1.06)", opacity: 1, offset: 0.27, easing: "ease-out" }, { transform: "scale(1)", opacity: 1, offset: 0.4 }, { transform: "scale(1)", opacity: 1, offset: 0.76, easing: "ease-in" }, { transform: "scale(1.12)", opacity: 0 }], { duration: 1130, easing: "linear", fill: "both" });
    }
    const j = job3(() => { if (e) e.remove(); }, 1200);
    if (ea) ea.onfinish = () => j.fin(false);
    else fxT(() => j.fin(false), 900);
    /* lá bị vẽ lại giữa chừng: chuyển ấn sang ô mới (hoạt ảnh WAAPI giữ nguyên nhịp) */
    if (e) { const chk = () => { if (j.dead) return; const n = mcOf(uid); if (n && n !== cur && n.parentElement) { cur = n; place(n); } else if (!n && !e.isConnected) { j.fin(true); return; } requestAnimationFrame(chk); }; requestAnimationFrame(chk); }
    /* ấn phù văn xoay + quầng sáng tại thẻ */
    /* vòng phù văn xoay ở ngực bóng (trên mép lá, không che mặt lá) */
    if (!lite) { try { FX.sigil(x, top - h * 0.28, c1, w * 0.8, 6, false, 1.05); } catch (er) {} }
    glow(x, top - h * 0.2, c1, w * 2.4, 0.9, 0.55);
    try { SFX.play("chime"); } catch (er) {}
    if (self || !tgts.length) fxT(() => { if (j.dead) return; ring(x, b.top + h / 2, c1, w * 1.15, 0.4, 0.9); glow(x, b.top + h / 2, c2, w * 1.5, 0.35, 0.5); }, 380);
    /* sợi sáng từ hai mép ấn tới mép trên từng thẻ được tác động + đốm sáng chạy theo sợi */
    fxT(() => {
      if (j.dead) return;
      tgts.forEach((u, i) => {
        const t = mcOf(u);
        if (!t) return;
        const q = ctrR(t.getBoundingClientRect()), sd = q.x < x - 4 ? -1 : q.x > x + 4 ? 1 : (i % 2 ? 1 : -1);
        const a0 = [x + sd * w * 0.55, top - h * 0.22], b0 = [q.x + sd * q.w * 0.12, q.y - q.h / 2 + 5], cp = [a0[0] + sd * 22, Math.min(a0[1], b0[1]) - 26];
        glow(a0[0], a0[1], c1, 34, 0.9, 0.8);
        if (!lite) cvAdd({ k: "rib", a: () => a0, b: () => b0, amp: 5, f: 1, sp: 10, ph: i * 2, w: 2.4, c: c1, life: 0.9, grow: 0.35, a0: 0.9 });
        else beam(a0[0], a0[1], b0[0], b0[1], c1, 4, 0.45);
        const n = lite ? 4 : 9, dl0 = 0.1 + i * 0.06;
        for (let m = 0; m <= n; m++) { const u2 = m / n, p = bez2(a0, cp, b0, 1 - Math.pow(1 - u2, 2)); E6({ x: p[0], y: p[1], c: m % 2 ? "#ffffff" : c1, kind: 0, s0: m === n ? 16 : 10, s1: 2, drag: 0, dur: 0.16, a: 0.95, delay: dl0 + 0.3 * u2 }); }
        fxT(() => { if (j.dead) return; ring(q.x, q.y, c1, q.w * 0.95, 0.4, 0.9); glow(q.x, q.y, c1, q.w * 1.6, 0.42, 0.55); tap("DTB:hit", { uid: u }); }, 400 + i * 60);
      });
    }, 260);
    live(1200);
  }

  /* ================= HX-20 CUỐI LƯỢT: loé hồn rất nhanh (lên 0,15 s · giữ 0,08 s · xuống 0,14 s) ================= */
  const EOT = new Set();
  HXG.eot = function (uid) {
    const id = idOf(uid);
    if (!ok(id) || ff()) return false;
    const el = mcOf(uid);
    if (!el) return false;
    const q = ctrR(el.getBoundingClientRect());
    if (!q.w) return false;
    const { c1, c2 } = cols(id), lite = isLite();
    EOT.add(uid);
    if (!lite) peek(el, [PK(0, 1, 0), PK(-40, 1.14, -2), PK(-43, 1.14, 0), PK(0, 1, 0)].map((k, i) => Object.assign(k, { offset: [0, 0.4, 0.62, 1][i], easing: ["cubic-bezier(.2,.8,.3,1)", "linear", "cubic-bezier(.5,0,.8,.5)", "linear"][i] })), 370, { easing: "linear" });
    glow(q.x, q.y - q.h * 0.18, c1, q.w * 2, 0.35, 0.7);
    fxT(() => { streaks(q.x, q.y - q.h * 0.5, [c1, c2, "#ffffff"], lite ? 4 : 8, 150, -2.8, -0.3, 0.4, 5); ring(q.x, q.y + q.h * 0.42, c1, q.w * 1.1, 0.35, 0.7, 0.32); }, 140);
    live(380);
    tap("HX20", { uid, id, peek: !lite });
    return true;
  };
  /* thẻ Cuối Lượt Hồn Xuất: nhịp loé hồn thay cho màn ra mắt bản gọn (mini40) -> không chờ thêm ~0,25 s trước mỗi thẻ */
  {
    const m0 = mini40;
    mini40 = function (evs) {
      try { const sv = (evs || []).find((e) => e.k === "skill" || e.k === "act"); if (sv && sv.k === "skill" && sv.t === "end" && okU(sv.uid) && !ff() && mcOf(sv.uid)) return null; } catch (e) {}
      return m0.apply(this, arguments);
    };
  }
  /* bước Cuối Lượt đã loé hồn -> nghỉ ngắn hơn giữa các thẻ (3 thẻ ≤ 1,5 s) */
  /* gpu69 (làn A): bộ công cụ cho 18-act.js (cháy thẻ, hồn rời thẻ, lớp 2D) */
  HXG.kit = { cardBmp, frameBmp, dissolve, soulFrom, peek, PK };
  HXG.eotFast = function (evs) { const r = (evs || []).some((e) => e.k === "skill" && e.t === "end" && EOT.has(e.uid)); EOT.clear(); return r; };

  /* ================= HX-15 SAO CHÉP KỸ NĂNG ================= */
  const X15 = 880;
  {
    const r8 = run8;
    run8 = function (s) {
      if (s && s.k === "copy" && s.hx15c) { s._ran = 1; return; }
      if (s && s.k === "copy" && s.hx15 && !s._hx15) {
        s._hx15 = 1;
        let done = false;
        try { done = copy15(s); } catch (e) { console.error(e); }
        if (done) { s._ran = 1; return; }
      }
      return r8.apply(this, arguments);
    };
  }
  function copy15(s) {
    const se = mcOf(s.src), te = mcOf(s.dst);
    if (!se || !te || ff() || !on()) return false;
    const sid = idOf(s.src), tid = idOf(s.dst), sa = artOf(se), ta = artOf(te);
    if (!sid || !tid || !sa || !ta) return false;
    const sI = soulImg(sid, se), tI = soulImg(tid, te);
    const sr = ctrR(se.getBoundingClientRect()), tr = ctrR(te.getBoundingClientRect());
    if (!sr.w || !tr.w || !sI || !tI) return false;
    const sc = cols(sid), tc = cols(tid), TT = 1800;
    tap("HX15", { src: s.src, dst: s.dst });
    /* người sao chép ló nửa người suốt cảnh */
    peek(se, [PK(0, 1, 0), PK(-42, 1.16, -2), PK(-44, 1.17, -3), PK(-46, 1.18, 0), PK(-50, 1.24, 0), PK(0, 1, 0)].map((k, i) => Object.assign(k, { offset: [0, 0.1, 0.5, 0.86, 0.93, 1][i] })), TT, { easing: "linear" });
    glow(sr.x, sr.y, sc.c1, sr.w * 2, 0.45, 0.6);
    /* bản song sinh (dáng mình) và bản hoá dáng mục tiêu (soi gương) — mỗi bản một hoạt ảnh WAAPI suốt cảnh */
    const w = sr.w * 1.12, h = sr.h * 1.12, ax = sr.x, ay = sr.y - sr.h * 0.42;
    /* bản hoá dáng đứng về phía biển chiến địa (trên lá phe mình / dưới lá phe địch) — không đè lá bên cạnh */
    const mine = (() => { try { const f = E.find(G, s.dst); return f && G.locs[f.li].cards.p.includes(f.inst); } catch (e) { return true; } })(), side = tr.x < innerWidth / 2 ? 1 : -1;
    const px = clamp(tr.x + side * tr.w * 0.25, w / 2 + 4, innerWidth - w / 2 - 4), py = clamp(tr.y + (mine ? -1 : 1) * tr.h * 0.92, h / 2 + 4, innerHeight - h / 2 - 4);
    const A = soulAt(sI.currentSrc || sI.src, ax, ay, w, h, sc.c1, "hxtw"), B = soulAt(tI.currentSrc || tI.src, px, py, w, h, sc.c1, "hxtw");
    A.style.opacity = "0"; B.style.opacity = "0";
    const o = (t) => t / TT, cA = [ax + (px - ax) * 0.5, Math.min(ay, py) - 70];
    const kA = [kfT(0, 0, 0.6, 0, 0, 0), kfT(0, 0, 0.75, 0, 0.85, o(180)), kfT(28, -22, 0.86, 10, 0.85, o(300))];
    for (let i = 1; i <= 6; i++) { const u = i / 6, p = bez2([ax + 28, ay - 22], cA, [px, py], u * u * (3 - 2 * u)); kA.push(kfT(p[0] - ax, p[1] - ay, lerp(0.86, 1, u), lerp(10, 0, u), 0.85, o(300 + 300 * u))); }
    kA.push(kfT(px - ax, py - ay, 1, 0, 0, o(800)), kfT(px - ax, py - ay, 1, 0, 0, o(1100)), kfT(px - ax, py - ay, 1, 0, 0.85, o(1260)));
    for (let i = 1; i <= 6; i++) { const u = i / 6, p = bez2([px, py], [cA[0], cA[1] + 20], [ax, ay - 6], u * u * (3 - 2 * u)); kA.push(kfT(p[0] - ax, p[1] - ay, lerp(1, 0.8, u), 0, 0.85, o(1260 + 340 * u))); }
    kA.push(kfT(0, -6, 0.5, 0, 0, o(1760)), kfT(0, -6, 0.5, 0, 0, 1));
    const aA = A.animate(kA, { duration: TT, easing: "linear", fill: "both" });
    const wob = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8, wv = Math.sin(u * Math.PI * 3), kk = Math.abs(wv); wob.push(kfT(0, -3 * kk, 1 + 0.04 * kk, 4 * wv, 0.85, o(800 + 480 * u), -1)); }
    const aB = B.animate([kfT(0, 0, 1, 0, 0, 0, -1), kfT(0, 0, 1, 0, 0, o(560), -1), kfT(0, 0, 1, 0, 0.85, o(780), -1), ...wob, kfT(0, 0, 1, 0, 0, o(1290), -1), kfT(0, 0, 1, 0, 0, 1, -1)], { duration: TT, easing: "linear", fill: "both" });
    /* mục tiêu lắc cùng nhịp với bản hoá dáng */
    const tw = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8, wv = Math.sin(u * Math.PI * 3), kk = Math.abs(wv); tw.push({ transform: `rotate(${(-4 * wv).toFixed(2)}deg) scale(${(1 + 0.04 * kk).toFixed(3)})` }); }
    const tA = te.animate(tw, { duration: 480, delay: 800, easing: "linear" });
    const j = job3(() => { A.remove(); B.remove(); try { tA.cancel(); } catch (e) {} }, TT);
    aA.onfinish = () => j.fin(false);
    try { SFX.play("whoosh"); } catch (e) {}
    fxT(() => {
      if (j.dead) return;
      glow(px, py, sc.c1, 110, 0.35, 0.7);
      if (!isLite()) cvAdd({ k: "rib", a: () => [tr.x, tr.y - 6], b: () => [px - side * 12, py], amp: 6, f: 1.5, sp: 16, ph: 0, w: 2.6, c: tc.c1, life: 0.6, grow: 0.3, a0: 0.95 });
      for (let i = 0; i < kN(14); i++) { const sx = tr.x + rnd(-10, 10), sy = tr.y + rnd(-14, 6); E6({ x: sx, y: sy, vx: (px - sx) * 2.2, vy: (py - sy) * 2.2, c: i % 2 ? tc.c1 : "#ffffff", kind: 3, s0: rnd(9, 14), s1: 4, drag: 0, dur: 0.42, a: 0.9, rot: rnd(0, 6), delay: i * 0.03 }); }
      flt(tr.x, tr.y - tr.h * 0.6, K8.copy ? K8.copy[2] : "BỊ SAO CHÉP", "#bff4ff");
      try { SFX.fam("copy", { el: elOf(sid) }); } catch (e) {}
      tap("HX15:mimic", { dst: s.dst });
    }, 780);
    fxT(() => { if (j.dead) return; glow(px, py, tc.c1, 120, 0.4, 0.7); ring(px, py, tc.c1, 60, 0.35, 0.9); }, 1280);
    fxT(() => {
      if (j.dead) return;
      converge(ax, ay, [tc.c1, sc.c1, "#ffffff"], 18, 60, 0.25, 1);
      glow(ax, ay, tc.c1, 140, 0.45, 0.7);
      ring(sr.x, sr.y, tc.c1, sr.w * 1.1, 0.4, 0.9);
      const nm = s.abId && C[s.abId] ? C[s.abId].n : "";
      flt(sr.x, sr.y - sr.h * 0.62, "CHÉP KỸ NĂNG" + (nm ? ": " + (nm.length > 14 ? nm.slice(0, 13) + "…" : nm) : ""), "#bff4ff");
      tap("HX15:back", { src: s.src });
    }, 1620);
    live(TT + 120);
    return true;
  }

  /* HX-15 trong chuỗi PA6: hồn PA6 đứng trước mục tiêu, bản soi gương (dáng mục tiêu) hiện phía bên kia, lắc cùng nhịp; phù văn kỹ năng chảy vào hồn PA6 */
  function mimic15(ch, q) {
    const s = q.s, te = mcOf(s.dst), tid = idOf(s.dst), sid = idOf(s.src);
    if (!te || !tid) return;
    const tr = ctrR(te.getBoundingClientRect()), tI = soulImg(tid, te);
    if (!tI || !tr.w) return;
    const tc = cols(tid), w = tr.w * 1.12, h = tr.h * 1.12, side = Math.sign(tr.x - ch.x) || 1, TT = 640;
    /* phía đối diện hồn PA6 so với mục tiêu (hồn PA6 đứng trước mục tiêu, bản soi gương đứng sau) */
    const vy = Math.sign(tr.y - ch.y) || 1, px = clamp(tr.x + side * tr.w * 0.3, w / 2 + 4, innerWidth - w / 2 - 4), py = clamp(tr.y + vy * tr.h * 0.85, h / 2 + 4, innerHeight - h / 2 - 4);
    const B = soulAt(tI.currentSrc || tI.src, px, py, w, h, tc.c1, "hxtw"), o = (t) => t / TT;
    B.style.opacity = "0";
    const wob = [];
    for (let i = 0; i <= 6; i++) { const u = i / 6, wv = Math.sin(u * Math.PI * 2), kk = Math.abs(wv); wob.push(kfT(0, -3 * kk, 1 + 0.04 * kk, 4 * wv, 0.85, o(140 + 340 * u), -1)); }
    const aB = B.animate([kfT(0, 6, 0.8, 0, 0, 0, -1), ...wob, kfT(-side * 10, -4, 0.7, 0, 0, 1, -1)], { duration: TT, easing: "linear", fill: "both" });
    const tw = [];
    for (let i = 0; i <= 6; i++) { const u = i / 6, wv = Math.sin(u * Math.PI * 2); tw.push({ transform: `rotate(${(-4 * wv).toFixed(2)}deg) scale(${(1 + 0.04 * Math.abs(wv)).toFixed(3)})` }); }
    const tA = te.animate(tw, { duration: 340, delay: 140, easing: "linear" });
    const j = job(() => { B.remove(); try { tA.cancel(); } catch (e) {} }, TT);
    aB.onfinish = () => j.fin(false);
    tap("HX15", { src: s.src, dst: s.dst, chain: 1 });
    glow(px, py, tc.c1, 110, 0.35, 0.7);
    flt(tr.x, tr.y - tr.h * 0.6, K8.copy ? K8.copy[2] : "BỊ SAO CHÉP", "#bff4ff");
    if (!isLite()) cvAdd({ k: "rib", a: () => [tr.x, tr.y - 6], b: () => [ch.x, ch.y], amp: 6, f: 1.5, sp: 16, ph: 0, w: 2.6, c: tc.c1, life: 0.55, grow: 0.3, a0: 0.95 });
    for (let i = 0; i < kN(12); i++) { const sx = tr.x + rnd(-10, 10), sy = tr.y + rnd(-14, 6); E6({ x: sx, y: sy, vx: (ch.x - sx) * 2.2, vy: (ch.y - sy) * 2.2, c: i % 2 ? tc.c1 : "#ffffff", kind: 3, s0: rnd(9, 14), s1: 4, drag: 0, dur: 0.42, a: 0.9, rot: rnd(0, 6), delay: 0.12 + i * 0.025 }); }
    try { SFX.fam("copy", { el: elOf(sid) }); } catch (e) {}
    fxT(() => {
      if (j.dead) return;
      converge(ch.x, ch.y, [tc.c1, ch.col.c1, "#ffffff"], 16, ch.bw * 0.7, 0.25, 1);
      glow(ch.x, ch.y, tc.c1, ch.bw * 1.4, 0.4, 0.7);
      const nm = s.abId && C[s.abId] ? C[s.abId].n : "";
      flt(ch.x, ch.y - ch.bh * ch.s * 0.45, "CHÉP KỸ NĂNG" + (nm ? ": " + (nm.length > 14 ? nm.slice(0, 13) + "…" : nm) : ""), "#bff4ff");
      tap("HX15:back", { src: s.src, chain: 1 });
    }, 480);
  }

  /* ================= HX-16 BIẾN ĐỔI THẺ: khung luôn có ảnh (ảnh cũ mờ dần -> ảnh mới), hồn cũ bị giật ra, hồn mới xoáy vào ================= */
  const TFS = new Map();
  HXG.ownTf = (uid) => TFS.has(uid);
  {
    const mo0 = CFX.morph;
    CFX.morph = function (el) {
      try {
        const uid = +(el && el.dataset.mc), t = TFS.get(uid);
        if (t) {
          TFS.delete(uid);
          const ch = K.ch(), D = ch && !ch.dead && t.src && ch.src === t.src ? clamp((ch.off0 || 0) + 160 - (performance.now() - ch.t0) / SPD, 0, 1400) : 0;
          if (tf16(el, uid, t, D)) return;
        }
      } catch (e) { console.error(e); }
      return mo0.apply(this, arguments);
    };
  }
  function tf16(el, uid, t, D) {
    D = D || 0;
    if (!el || !el.isConnected || ff() || !on()) return false;
    const nid = idOf(uid), b = el.getBoundingClientRect(), r0 = t.r0;
    if (!nid || !b.width || !r0 || !r0.html) return false;
    const nI = soulImg(nid, el), art = artOf(el);
    if (!nI || !art) return false;
    const q = ctrR(b), oc = cols(t.old), nc = cols(nid), lite = isLite();
    /* lá cũ phủ đúng chỗ lá mới (z thấp hơn hồn) */
    const g = ghost({ x: q.x, y: q.y, w: q.w, h: q.h }, r0.html, "hxold");
    const gArt = g.querySelector("img.art");
    if (!gArt || !(gArt.complete && gArt.naturalWidth)) { g.remove(); return false; }
    tap("HX16", { uid, from: t.old, to: nid });
    let so = null, rc = null, cur = el;
    const j = job3(() => { g.remove(); if (so) so.remove(); if (rc) rc.remove(); try { const a = cur.querySelector(":scope>img.art"); if (a) for (const an of a.getAnimations()) if (an.id === "hx16") an.cancel(); } catch (e) {} }, 1300 + D);
    /* gió từ thẻ nguồn (lá cũ phủ sẵn từ đầu; nhịp biến đổi bắt đầu sau D ms khi thẻ nguồn đang xuất hồn PA6) */
    fxT(() => { if (!j.dead) wind(); }, D);
    const wind = () => {
    const se = t.src && t.src !== uid ? mcOf(t.src) : null;
    if (se) {
      const sp = ctrR(se.getBoundingClientRect()), sc = cols(idOf(t.src));
      for (let i = 0; i < (lite ? 1 : 2); i++) cvAdd({ k: "rib", a: () => [sp.x, sp.y - 10], b: () => [q.x, q.y], amp: 10 + i * 6, f: 1.2 + i * 0.6, sp: 16, ph: i * 2, w: 2.6 - i * 0.8, c: i ? sc.c2 : sc.c1, life: 0.8, grow: 0.25, a0: 0.9 });
      converge(sp.x, sp.y, [sc.c1, sc.c2, "#ffffff"], 14, 54, 0.28, 1);
    }
    glow(q.x, q.y, oc.c1, q.w * 1.6, 0.5, 0.55);
    try { SFX.play("whoosh"); } catch (e) {}
    };
    /* ảnh mới trong lá mới: mờ (không bao giờ trống) tới khi hồn mới chui vào */
    art.animate([{ opacity: 0.32 }, { opacity: 0.32, offset: (880 + D) / (1080 + D) }, { opacity: 1 }], { duration: 1080 + D, easing: "linear", id: "hx16" });
    /* 240 ms: hồn cũ bị giật khỏi lá cũ, xoáy lên và tan thành khói màu hệ cũ; lá cũ mờ dần lộ lá mới */
    fxT(() => {
      if (j.dead) return;
      const ob = gArt.getBoundingClientRect();
      so = soulAt(gArt.currentSrc || gArt.src, ob.left + ob.width / 2, ob.top + ob.height / 2, ob.width, ob.height, oc.c1);
      so.querySelector("img").style.objectFit = getComputedStyle(gArt).objectFit;
      so.querySelector("img").style.objectPosition = getComputedStyle(gArt).objectPosition;
      gArt.style.visibility = "hidden";
      g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, easing: "ease-in", fill: "forwards" });
      const kf = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8, e = 1 - Math.pow(1 - u, 2); kf.push(kfT(Math.sin(u * 10) * 10 * u, -74 * e, 1 - 0.4 * u, u * 240, i === 8 ? 0 : 1 - Math.max(0, (u - 0.6) / 0.4) * 0.9, u)); }
      so.animate(kf, { duration: 380, easing: "linear", fill: "both" });
      for (let i = 0; i < kN(16); i++) E6({ x: q.x + rnd(-14, 14), y: q.y - rnd(0, 70), vx: rnd(-50, 50), vy: rnd(-80, -20), c: [oc.c1, oc.c2, "#ffffff"][i % 3], kind: 0, s0: rnd(10, 16), s1: 26, drag: 1.5, dur: rnd(0.4, 0.6), a: 0.55, delay: rnd(0, 0.3) });
      tap("HX16:out", { uid });
    }, 240 + D);
    /* 300 ms: dải màu hệ mới quét từ trên xuống trong lá mới */
    fxT(() => {
      if (j.dead || !cur.isConnected) return;
      rc = document.createElement("i");
      rc.className = "hxrc"; rc.style.setProperty("--c", nc.c1); rc.setAttribute("aria-hidden", "true");
      rc.innerHTML = "<b></b>";
      cur.appendChild(rc);
      rc.firstChild.animate([{ transform: "translateY(-110%)", opacity: 0 }, { transform: "translateY(-40%)", opacity: 0.9, offset: 0.25 }, { transform: "translateY(240%)", opacity: 0.6 }], { duration: 600, easing: "ease-in-out", fill: "both" }).onfinish = () => { if (rc) { rc.remove(); rc = null; } };
    }, 300 + D);
    /* 600 ms: hồn mới xoáy ốc vào khung */
    fxT(() => {
      if (j.dead) return;
      if (so) { so.remove(); so = null; }
      g.remove();
      const ab = (cur.isConnected ? cur : el).querySelector(":scope>img.art"), r = (ab || cur).getBoundingClientRect(), cy = r.top + r.height / 2;
      const ns = soulAt(nI.currentSrc || nI.src, q.x, cy, r.width, r.height, nc.c1);
      so = ns;
      const kf = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10, e = 1 - Math.pow(1 - u, 2), an = e * Math.PI * 2.3, R0 = 62 * (1 - e); kf.push(kfT(Math.cos(an) * R0, Math.sin(an) * R0 * 0.55 - 40 * (1 - e), lerp(0.8, 1, e), Math.sin(an) * 10 * (1 - e), i === 0 ? 0 : i === 10 ? 0.25 : 1, u)); }
      ns.animate(kf, { duration: 480, easing: "linear", fill: "both" });
      for (let i = 0; i < kN(12); i++) E6({ x: q.x, y: cy, vx: rnd(-40, 40), vy: rnd(-40, 40), c: nc.L[i % 4], kind: 0, s0: rnd(5, 9), s1: 1.5, drag: 1.4, dur: 0.3, a: 0.85, delay: i * 0.03 });
      tap("HX16:in", { uid });
    }, 600 + D);
    fxT(() => {
      if (j.dead) return;
      glow(q.x, q.y, "#ffffff", q.w * 1.1, 0.16, 0.9);
      ring(q.x, q.y, nc.c1, q.w * 1.3, 0.4, 0.9);
      streaks(q.x, q.y, nc.L, isLite() ? 7 : 14, 260, 0, 6.283, 0.45, 5);
      const a3 = cur.querySelector(":scope>img.art");
      if (a3) a3.animate([{ transform: "scale(1.1)" }, { transform: "scale(.97)", offset: 0.6 }, { transform: "none" }], { duration: 240, easing: "ease-out" });
      const nm = C[nid] ? C[nid].n : "";
      flt(q.x, q.y - q.h * 0.6, "BIẾN THÀNH " + (nm.length > 14 ? nm.slice(0, 13) + "…" : nm), "#ffb3e0");
      try { SFX.play("morph"); } catch (e) {}
      j.fin(false);
      tap("HX16:done", { uid });
    }, 1090 + D);
    /* lá mới bị vẽ lại giữa chừng: dải quét theo lá mới */
    const chk = () => { if (j.dead) return; const n = mcOf(uid); if (n && n !== cur) { cur = n; if (rc) n.appendChild(rc); const a = n.querySelector(":scope>img.art"); if (a) a.animate([{ opacity: 0.32 }, { opacity: 1 }], { duration: 400, id: "hx16" }); } requestAnimationFrame(chk); };
    requestAnimationFrame(chk);
    live(1350 + D);
    return true;
  }

  /* ================= HX-14 HỒI SINH: hồn trèo ra khỏi mộ bài, bay về ô, mảnh khung vàng tụ lại, hồn chui vào lá ================= */
  const R14 = new Map(); /* uid -> src (hồi sinh diễn bằng HX-14 trong bước này) */
  let RVK = { t: 0, n: 0 };
  function rev14(el, uid, src, o) {
    o = o || {};
    if (!el || !el.isConnected || ff() || !on() || isLite()) return false;
    const id = idOf(uid), b = el.getBoundingClientRect();
    if (!id || !b.width) return false;
    const sI = soulImg(id, el);
    if (!sI) return false;
    const now = performance.now();
    if (now - RVK.t > 300) RVK = { t: now, n: 0 };
    const k = RVK.n++, dl = k * 120, PILE = PILEPT(), { c1, c2, L } = cols(id);
    const q = ctrR(b), w = q.w * 1.12, h = q.h * 1.12, pb = document.getElementById("btnPiles"), ph = pb ? pb.getBoundingClientRect().height : 24;
    /* mộ bài ở mép trên màn (bố cục hiện tại): hồn chui XUỐNG khỏi cổng mộ thay vì trèo lên (không tràn mép màn) */
    const upM = PILE.y - ph / 2 - h > 8, line = upM ? PILE.y - ph / 2 + 4 : PILE.y + ph / 2 + 2;
    tap("HX14", { uid, id, k });
    let cur = el, shown = false, clip = null, so = null, cx = 0, cy = 0;
    /* ẩn bằng lớp !important: thắng cả hoạt ảnh CSS lật (.flip) đang chạy trên lá vừa hồi sinh */
    const hide = (n) => { n.classList.add("hx14h"); };
    hide(cur);
    const j = job3((fast) => { shown = true; if (clip) clip.remove(); if (so) so.remove(); for (const n of [cur, mcOf(uid)]) if (n) { n.classList.remove("hx14h"); n.style.opacity = ""; } }, 1650 + dl);
    /* bàn vẽ lại giữa chừng: lá mới cũng ẩn tới đúng lúc hồn hạ vào */
    const chk = () => { if (j.dead) return; const n = mcOf(uid); if (n && n !== cur) { cur = n; if (!shown) hide(cur); } requestAnimationFrame(chk); };
    requestAnimationFrame(chk);
    /* mộ mở (một lần cho cả loạt) + sợi thuốc từ thẻ nguồn tới mộ */
    if (k === 0) {
      glow(PILE.x, line, "#9a46ff", 110, 1.0, 0.8);
      ring(PILE.x, line, "#d8b8ff", 54, 0.5, 0.9, 0.4);
      try { pulse("#btnPiles", [{ transform: "scale(1)" }, { transform: "scale(1.12)", offset: 0.35 }, { transform: "scale(1)" }], 320); } catch (e) {}
      const se = !o.chain && src && src !== uid ? mcOf(src) : null;
      if (se) { const sp = ctrR(se.getBoundingClientRect()), sc = cols(idOf(src)); cvAdd({ k: "rib", a: () => [sp.x, sp.y + 10], b: () => [PILE.x, PILE.y - 10], amp: 12, f: 1.4, sp: 12, ph: 0, w: 3, c: sc.c1, life: 0.8, grow: 0.3, a0: 0.9 }); }
      try { SFX.play("rise"); } catch (e) {}
    }
    /* 180: hồn trèo lên khỏi mặt mộ (hộp overflow:hidden có đáy cố định ở mặt mộ; ảnh chỉ đổi transform) */
    fxT(() => {
      if (j.dead) return;
      const x0 = clamp(PILE.x, w / 2 + 4, innerWidth - w / 2 - 4);
      clip = document.createElement("div");
      clip.className = "hxclip"; clip.style.cssText = `left:${(x0 - w / 2).toFixed(1)}px;top:${(upM ? line - h : line).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;--c:${c1}`;
      clip.innerHTML = `<img src="${sI.currentSrc || sI.src}" alt="" draggable="false">`;
      document.body.appendChild(clip);
      const kf = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8, e = 1 - Math.pow(1 - u, 2); kf.push({ transform: `translate(${(Math.sin(u * 14) * 2).toFixed(1)}px,${((upM ? 100 : -100) * (1 - e)).toFixed(1)}%) rotate(${(Math.sin(u * 13) * 6 * (1 - u)).toFixed(2)}deg)`, offset: u }); }
      clip.firstChild.animate(kf, { duration: 440, easing: "linear", fill: "both" });
      for (let i = 0; i < kN(14); i++) E6({ x: x0 + rnd(-22, 22), y: line + rnd(-4, 4), vx: rnd(-20, 20), vy: upM ? rnd(-90, -40) : rnd(40, 90), c: ["#9a46ff", "#d8b8ff", c1][i % 3], kind: 0, s0: rnd(6, 11), s1: 1, drag: 0.5, dur: rnd(0.3, 0.5), a: 0.9, delay: rnd(0, 0.35) });
      tap("HX14:climb", { uid });
      /* 440: thay hộp cắt bằng hồn tự do (cùng toạ độ, cùng ảnh -> liền mạch) rồi bay về trên ô, chờ khung tụ */
      fxT(() => {
        if (j.dead) return;
        cx = x0; cy = upM ? line - h / 2 : line + h / 2;
        so = soulAt(sI.currentSrc || sI.src, cx, cy, w, h, c1);
        clip.remove(); clip = null;
        const tx = q.x, ty = q.y - q.h * 0.42, cp = [(cx + tx) / 2, Math.min(cy, ty) - 80], kf2 = [];
        for (let i = 0; i <= 10; i++) { const u = i / 10, e = u * u * (3 - 2 * u), p = bez2([cx, cy], cp, [tx, ty], e); kf2.push(kfT(p[0] - cx, p[1] - cy, lerp(1, 0.92, e), Math.sin(u * Math.PI) * (tx < cx ? -10 : 10), 1, u * (420 / 680))); }
        kf2.push(kfT(tx - cx, ty - cy - 4, 0.92, 0, 1, 1));
        so.animate(kf2, { duration: 680, easing: "linear", fill: "both" });
        afterimg(so);
        tap("HX14:fly", { uid });
      }, 440);
    }, 180 + dl);
    const afterimg = (d) => { for (let i = 1; i <= 3; i++) E6({ x: cx, y: cy, vx: 0, vy: -20, c: c1, kind: 0, s0: q.w * 0.6, s1: q.w * 0.9, drag: 0, dur: 0.3, a: 0.25, delay: 0.04 * i }); };
    /* 880: mảnh khung vàng tụ vào viền ô */
    fxT(() => {
      if (j.dead) return;
      const hw = q.w / 2, hh = q.h / 2, n = kN(28);
      for (let i = 0; i < n; i++) { const t = (i / n) * 4, sd = Math.floor(t), f = t - sd, px = sd === 0 ? lerp(-hw, hw, f) : sd === 1 ? hw : sd === 2 ? lerp(hw, -hw, f) : -hw, py = sd === 0 ? -hh : sd === 1 ? lerp(-hh, hh, f) : sd === 2 ? hh : lerp(hh, -hh, f), an = rnd(0, 6.283), d0 = rnd(40, 80);
        E6({ x: q.x + px + Math.cos(an) * d0, y: q.y + py + Math.sin(an) * d0, vx: -Math.cos(an) * d0 / 0.28, vy: -Math.sin(an) * d0 / 0.28, c: i % 2 ? "#ffd76a" : "#fff3c4", kind: 3, s0: rnd(8, 12), s1: 5, rot: rnd(0, 6), drag: 0, dur: 0.28, a: 0.95 }); }
      glow(q.x, q.y, "#ffd76a", q.w * 1.4, 0.4, 0.5);
      try { SFX.play("summon"); } catch (e) {}
      tap("HX14:frame", { uid });
    }, 180 + 440 + 260 + dl);
    /* 1300: lá hiện (đã có ảnh) đúng lúc hồn hạ vào — không lúc nào có khung rỗng */
    fxT(() => {
      if (j.dead) return;
      shown = true;
      const n = mcOf(uid) || cur;
      n.classList.remove("hx14h"); cur.classList.remove("hx14h"); n.style.opacity = "";
      n.animate([{ opacity: 0 }, { opacity: 1, offset: 0.6 }, { opacity: 1 }], { duration: 220, easing: "linear" });
      n.animate([{ transform: "scale(.9)" }, { transform: "scale(1.04)", offset: 0.6 }, { transform: "none" }], { duration: 220, easing: "cubic-bezier(.2,.8,.3,1)" });
      if (so) { const tx = q.x, ty = q.y - q.h * 0.42; so.animate([kfT(tx - cx, ty - cy - 4, 0.92, 0, 1, 0), kfT(q.x - cx, q.y - cy, 0.86, 0, 0, 1)], { duration: 220, easing: "ease-in", fill: "both" }); }
      glow(q.x, q.y, "#ffffff", q.w * 1.1, 0.16, 0.9);
      ring(q.x, q.y, "#ffd76a", q.w * 1.25, 0.38, 0.9);
      streaks(q.x, q.y, [c1, c2, "#ffd76a", "#ffffff"], 14, 240, 0, 6.283, 0.5, 5);
      flt(q.x, q.y - q.h * 0.6, "HỒI SINH", "#8dffc0");
      tap("HX14:in", { uid });
      fxT(() => j.fin(false), 240);
    }, 180 + 440 + 680 + dl);
    live(1700 + dl);
    return true;
  }

  /* ================= HX-19 NĂNG LƯỢNG: quả cầu năng lượng bật ra, hồn nắm lấy, ném vào ngọc năng lượng thật (#orb) ================= */
  function nrg19(o) {
    if (ff() || !on() || isLite()) return false;
    const orb = document.getElementById("orb"), el = o.el;
    if (!orb) return false;
    /* thẻ nguồn đang xuất hồn PA6: quả cầu bật ra từ chính hồn PA6, khi hồn đã ra khỏi khung */
    if (o.ch) {
      const ch = o.ch, D = clamp((ch.off0 || 0) + 220 - (performance.now() - ch.t0) / SPD, 0, 1500);
      if (o.e0 != null) orb.textContent = String(o.e0);
      const j0 = job3(() => {}, D + 100);
      fxT(() => {
        if (j0.dead) { if (o.e1 != null) orb.textContent = String(o.e1()); return; }
        j0.fin(false);
        const live6 = K.ch() === ch && !ch.dead, w = ch.bw * (ch.s || 1), h = ch.bh * (ch.s || 1);
        const pt = live6 ? { gx: ch.x - w * 0.32, gy: ch.y - h * 0.18, hx: ch.x + 6, hy: ch.y - h * 0.42 } : null;
        if (!nrg19(Object.assign({}, o, { ch: null, pt, el: pt ? null : mcOf(o.src) }))) { if (o.e1 != null) orb.textContent = String(o.e1()); }
      }, D);
      live(D + 1100);
      return true;
    }
    if (!o.pt && (!el || !el.isConnected)) return false;
    const b = o.pt ? null : el.getBoundingClientRect(), obr = orb.getBoundingClientRect();
    if ((b && !b.width) || !obr.width) return false;
    const ob = ctrR(obr), onBoard = !!(el && el.closest("#board")), bl = ["#5ab8ff", "#bff4ff", "#ffffff"];
    const gx = o.pt ? o.pt.gx : b.left + b.width * 0.14, gy = o.pt ? o.pt.gy : b.top + b.width * 0.14, hx = o.pt ? o.pt.hx : b.left + b.width / 2 + 6, hy = o.pt ? o.pt.hy : onBoard ? b.top - b.height * 0.2 : b.top - 18;
    tap("HX19", { id: o.id, n: o.n, max: !!o.max, board: onBoard });
    if (o.e0 != null) orb.textContent = String(o.e0);
    const d = document.createElement("i");
    d.className = "hxorb"; d.setAttribute("aria-hidden", "true");
    d.style.left = gx.toFixed(1) + "px"; d.style.top = gy.toFixed(1) + "px";
    document.body.appendChild(d);
    const TT = 820, P = (t) => {
      if (t <= 300) { const u = t / 300, e = 1 - Math.pow(1 - u, 2); return [lerp(gx, hx, e), lerp(gy, hy, e) - Math.sin(Math.PI * u) * 24, 1]; }
      if (t <= 440) { const u = (t - 300) / 140; return [hx, hy - 3 * Math.sin(Math.PI * u), 1 + 0.3 * Math.sin(Math.PI * u)]; }
      const u = (t - 440) / 360, e = u * u, p = bez2([hx, hy], [(hx + ob.x) / 2 + 30, Math.min(hy, ob.y) - 50], [ob.x, ob.y], e); return [p[0], p[1], lerp(1, 0.7, u)];
    };
    const kf = [];
    for (let t = 0; t <= 800; t += 40) { const [x, y, s] = P(t); kf.push({ transform: `translate(${(x - gx).toFixed(1)}px,${(y - gy).toFixed(1)}px) scale(${s.toFixed(3)})`, opacity: t === 0 ? 0 : 1, offset: t / TT }); }
    kf.push({ transform: `translate(${(ob.x - gx).toFixed(1)}px,${(ob.y - gy).toFixed(1)}px) scale(.6)`, opacity: 0, offset: 1 });
    const a = d.animate(kf, { duration: TT, easing: "linear", fill: "both" });
    for (let t = 40; t <= 780; t += 45) { const [x, y] = P(t); E6({ x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: rnd(-20, 20), vy: rnd(-20, 20), c: bl[(t / 45) % 3 | 0], kind: 0, s0: rnd(6, 10), s1: 1, drag: 1, dur: 0.3, a: 0.85, delay: t / 1000 }); }
    const fin = (fast) => { d.remove(); if (o.e1 != null) orb.textContent = String(o.e1()); };
    const j = job3(fin, TT + 200);
    /* nguồn: ló nửa người nắm quả cầu (trên bàn) / lá trên tay nhấc nhẹ + ngọc chi phí nảy */
    if (o.pt) { /* hồn PA6 tự nắm quả cầu */ }
    else if (onBoard) peek(el, [PK(0, 1, 0), PK(-52, 1.2, -2), PK(-56, 1.2, -4), PK(-52, 1.22, 6), PK(-50, 1.2, 2), PK(0, 1, 0)].map((k, i) => Object.assign(k, { offset: [0, 0.27, 0.37, 0.53, 0.8, 1][i] })), 1000, { easing: "ease-in-out" });
    else {
      try { el.animate([{ transform: "translateY(0)" }, { transform: "translateY(-12px)", offset: 0.4 }, { transform: "translateY(0)" }], { duration: 700, easing: "ease-in-out", composite: "add" }); } catch (e) {}
      const cst = el.querySelector(".cst");
      if (cst) cst.animate([{ transform: "scale(1)" }, { transform: "scale(1.2)", offset: 0.35 }, { transform: "scale(1)" }], { duration: 460 });
    }
    glow(gx, gy, bl[0], 70, 0.6, 0.8);
    ring(gx, gy, bl[0], 30, 0.35, 0.9);
    try { SFX.play("chime"); } catch (e) {}
    fxT(() => { if (j.dead) return; ring(hx, hy, bl[0], 40, 0.3, 0.9); glow(hx, hy, bl[1], 60, 0.3, 0.7); }, 300);
    fxT(() => { if (j.dead) return; try { SFX.play("whoosh"); } catch (e) {} tap("HX19:throw", { id: o.id }); }, 440);
    fxT(() => {
      if (j.dead) return;
      ring(ob.x, ob.y, bl[0], 56, 0.4, 0.95);
      glow(ob.x, ob.y, bl[0], 110, 0.45, 0.8);
      streaks(ob.x, ob.y, bl, 14, 200, 0, 6.283, 0.45, 5);
      try { orb.animate([{ transform: "scale(1)" }, { transform: "scale(1.45)", offset: 0.3 }, { transform: "scale(1)" }], { duration: 440, easing: "ease-out" }); } catch (e) {}
      if (o.e1 != null) orb.textContent = String(o.e1());
      flt(ob.x, ob.y - 36, "+" + o.n + (o.max ? " năng lượng tối đa" : " năng lượng"), "#7fe0ff");
      try { SFX.fam("egain", { el: elOf(o.id) }); } catch (e) {}
      tap("HX19:orb", { id: o.id });
    }, 800);
    a.onfinish = () => j.fin(false);
    live(TT + 260);
    return true;
  }
  /* playFxCore (05): năng lượng hiện tại tăng do kỹ năng của SRC */
  HXG.nrg = function (src, n, e0) {
    const id = idOf(src);
    if (!ok(id) || !(n > 0)) return false;
    const ch = K.ch();
    return nrg19({ el: mcOf(src), src, ch: ch && !ch.dead && ch.src === src ? ch : null, id, n, e0, e1: () => (G ? G.energy.p : e0 + n) });
  };
  /* cardFx (05): năng lượng tối đa tăng (búa cũ) */
  let EGH = 0;
  HXG.nrgMax = function (evs, n) {
    if (EGH && performance.now() - EGH < 400) return true; /* đã diễn ở sự kiện egain có id (Phán Quan Thiên Giới) */
    const sv = (evs || []).find((e) => e.k === "skill" || e.k === "act");
    if (!sv || !okU(sv.uid)) return false;
    const ch = K.ch();
    return nrg19({ el: mcOf(sv.uid), src: sv.uid, ch: ch && !ch.dead && ch.src === sv.uid ? ch : null, id: idOf(sv.uid), n: n || 1, max: 1 });
  };
  /* đầu lượt: năng lượng do thẻ (egain có id, vd. Phán Quan Thiên Giới lượt 3) — nguồn ở trên bàn / trên tay / bộ bài */
  function egain19(e) {
    if (e.side !== "p" || !e.id || !ok(e.id)) return;
    let el = null;
    try { for (let li = 0; li < 3 && !el; li++) for (const c of G.locs[li].cards.p) if (c.id === e.id && c.rev) { el = mcOf(c.uid); break; } } catch (x) {}
    if (!el) { const c = G.hand.p.find((x) => x.id === e.id); if (c) el = document.querySelector(`#hand [data-hc="${c.uid}"]`); }
    if (!el) return;
    const e1 = G.energy.p;
    if (nrg19({ el, id: e.id, n: 1, e0: e1 - 1, e1: () => (G ? G.energy.p : e1), max: 0 })) EGH = performance.now();
  }

  /* ---------- tua nhanh (chạm màn hình) khi việc vòng 3 đang diễn mà không có chuỗi PA6 ---------- */
  function r3skip() {
    for (const j of [...R3]) j.fin(true);
    const P = W.PLAN8;
    if (P && P.tms && P.tms.length && HX3S && P.tms[0] && HX3S.includes(P.tms[0][0])) {
      for (const [s, tm] of P.tms) {
        if (s._ran) continue;
        clearTimeout(tm); s._ran = 1;
        try { if (s.k === "copy") q8(s, () => hit8(s)); else run8(s); } catch (e) { console.error(e); }
      }
      clearTimeout(P.pt);
      const steps = P.tms.map((x) => x[0]);
      setTimeout(() => { for (const s of steps) try { post8(s); } catch (e) {} }, 420);
      P.tms = [];
      HX3S = null;
      try { clearTimeout(PWHT); PWH = 0; tickPw(); } catch (e) {}
      try { hold29Info(0); } catch (e) {}
    }
    try { FX_UNTIL = Math.min(FX_UNTIL, performance.now() + 420 * SPD); } catch (e) {}
    tap("HX3:skip", {});
  }
  HXG.skip3 = r3skip;
  document.addEventListener("pointerdown", () => {
    if (!R3.size) return;
    try { const ch = P6.ch(); if (ch && !ch.dead) return; } catch (e) {}
    try { noClick = Date.now() + 450; } catch (e) {}
    r3skip();
  }, true);

  /* ---------- sự kiện của bước đang diễn (HX-05 hồi sinh cần biết thẻ nguồn; vòng 3: hồi sinh / biến đổi / năng lượng) ---------- */
  {
    const sf0 = stepFx;
    stepFx = function (G0, evs) { HXG._g0 = { G0, evs }; return sf0.apply(this, arguments); };
    const pc0 = playFxCore;
    playFxCore = function (evs, R0) {
      let eg = null;
      if (arguments[3] !== 1) { HXG._evs = evs; try { eg = pre3(evs, R0); } catch (e) { console.error(e); } }
      const r = pc0.apply(this, arguments);
      if (eg) for (const e of eg) { try { egain19(e); } catch (x) { console.error(x); } }
      return r;
    };
  }
  function pre3(evs, R0) {
    R14.clear(); TFS.clear();
    if (!G || !on() || ff() || isLite()) return null;
    const g0 = HXG._g0 && HXG._g0.evs === evs ? HXG._g0.G0 : null;
    let eg = null;
    for (const e of evs) {
      if (e.k === "revive") { if (okId(idOf(e.uid)) || okU(e.src)) R14.set(e.uid, e.src || 0); }
      else if (e.k === "morph" && g0 && R0 && R0.get(e.uid)) {
        let old = null;
        try { const f = E.find(g0, e.uid); old = f ? f.inst.id : null; } catch (x) {}
        const nid = idOf(e.uid);
        if (old && nid && old !== nid && C[old] && (okId(nid) || okId(old) || okU(e.src))) TFS.set(e.uid, { old, src: e.src || 0, r0: R0.get(e.uid) });
      }
      else if (e.k === "egain" && e.id && e.side === "p" && ok(e.id)) { (eg = eg || []).push(e); EGH = performance.now(); /* búa năng lượng tối đa cũ (cardFx) nhường cho HX-19 */ }
    }
    return eg;
  }

  /* ---------- kiểm tra (test): ảnh của mọi lớp Hồn Xuất đang hiện đều đã giải mã ---------- */
  HXG.audit = function () {
    const bad = [];
    for (const im of document.querySelectorAll(".hxsoul img,img.hxds,.fxg.hxd img.art,.fxg.hxold img.art,.hxclip img,.mc.hxpk>img.art,.p6soul img")) {
      const v = getComputedStyle(im).visibility !== "hidden" && +getComputedStyle(im.closest(".hxsoul,.hxclip,.fxg,.mc,.p6soul") || im).opacity > 0.05;
      if (v && !(im.complete && im.naturalWidth)) bad.push(im.className || im.parentElement.className);
    }
    return bad;
  };
})();
