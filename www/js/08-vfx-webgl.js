/* Module 08: Bộ máy Đồ hoạ WebGL2 GPU, Quỹ Đạo 3D Bezier Mượt 60FPS, Hoạt Ảnh Cướp Thẻ & HUD Thông Báo Sân Đối Thủ */
(function () {
  "use strict";

  const $id = (id) => document.getElementById(id);

  /* ==================== 1. TINH CHỈNH TỐC ĐỘ NHỊP TRẬN CHUẨN MARVEL SNAP ==================== */
  try {
    /* gpu21: 5 mức tốc độ, đều chậm hơn trước (Nhanh mới = Vừa cũ). Hệ số nhân thời lượng mọi hoạt ảnh trong trận */
    SPDV.nhanh = 1.0;
    SPDV.vua = 1.3;
    SPDV.cham = 1.6;
    SPDV.ratcham = 2.0;
    SPDV.dienanh = 2.5;
    window.SPD_LEVELS = [
      { k: "nhanh", n: "Nhanh", v: 1.0 },
      { k: "vua", n: "Vừa", v: 1.3 },
      { k: "cham", n: "Chậm", v: 1.6 },
      { k: "ratcham", n: "Rất chậm", v: 2.0 },
      { k: "dienanh", n: "Điện ảnh", v: 2.5 }
    ];
    const initKey = "linhthu.tamdia.gpu_vfx_v2";
    if (!localStorage.getItem(initKey)) {
      localStorage.setItem(initKey, "1");
      store.spd = "vua";
      store.gpu = true;
      save();
    }
    /* chuyển một lần sang mức mặc định mới "Chậm" (anh thấy các mức cũ còn quá nhanh) */
    if (!localStorage.getItem("ltd_spd_v3")) {
      localStorage.setItem("ltd_spd_v3", "1");
      store.spd = "cham";
      try { save(); } catch (e) {}
    }
    SPD = SPDV[store.spd] || 1.0;
    if (typeof GPUON !== "undefined") GPUON = store.gpu !== false;
    document.body.classList.toggle("gpu", store.gpu !== false);
  } catch (e) {}

  /* ==================== 2. TIỆN ÍCH MÀU SẮC, ĐƯỜNG CONG BEZIER 3D & CHỐNG XUNG ĐỘT WAAPI ==================== */
  const COLOR_CACHE = new Map();
  function parseCol(str) {
    if (!str) return [1, 1, 1];
    if (COLOR_CACHE.has(str)) return COLOR_CACHE.get(str);
    let r = 1, g = 1, b = 1;
    const s = String(str).trim();
    if (s[0] === "#") {
      if (s.length === 4) {
        r = parseInt(s[1] + s[1], 16) / 255;
        g = parseInt(s[2] + s[2], 16) / 255;
        b = parseInt(s[3] + s[3], 16) / 255;
      } else if (s.length >= 7) {
        r = parseInt(s.slice(1, 3), 16) / 255;
        g = parseInt(s.slice(3, 5), 16) / 255;
        b = parseInt(s.slice(5, 7), 16) / 255;
      }
    } else {
      const m = s.match(/[\d.]+/g);
      if (m && m.length >= 3) {
        r = Math.min(1, +m[0] / 255);
        g = Math.min(1, +m[1] / 255);
        b = Math.min(1, +m[2] / 255);
      }
    }
    if (isNaN(r) || isNaN(g) || isNaN(b)) { r = 1; g = 1; b = 1; }
    const out = [r, g, b];
    COLOR_CACHE.set(str, out);
    return out;
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* Huỷ các hoạt ảnh WAAPI thủ công đang chạy trên cùng 1 phần tử để không bao giờ bị giật/khựng chồng chéo */
  function cancelProcAnims(el) {
    if (!el || typeof el.getAnimations !== "function") return;
    try {
      for (const a of el.getAnimations()) {
        if (!a.animationName) a.cancel();
      }
    } catch (e) {}
  }

  function smoothAnim(el, kf, opts) {
    if (reduced || !el || typeof el.animate !== "function") return null;
    cancelProcAnims(el);
    return el.animate(kf, Object.assign({ duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "none" }, opts || {}));
  }

  /* Hàm nội suy mượt bậc 5 (C2-continuous quintic smoothstep) – vận tốc & gia tốc bằng 0 ở hai đầu */
  function easeQuintInOut(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }
  function easeOutBackSoft(t) {
    const c1 = 1.18, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function bezierPt(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const tt = t * t, uu = u * u;
    const uuu = uu * u, ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }

  /* Sinh mảng keyframe 3D Bezier 32 điểm liên tục (dùng với easing: "linear" để loại bỏ hoàn toàn điểm gãy) */
  function build3DArcFrames(cfg) {
    const N = cfg.steps || 32;
    const dx = cfg.dx || 0, dy = cfg.dy || 0;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = -dy / dist, ny = dx / dist;
    const curveSide = cfg.curve != null ? cfg.curve : (dx >= 0 ? 1 : -1) * Math.min(68, dist * 0.24);
    const liftY = cfg.lift != null ? cfg.lift : -Math.min(72, 24 + dist * 0.22);

    const p0 = { x: 0, y: 0 };
    const p1 = { x: dx * 0.22 + nx * curveSide * 0.85, y: dy * 0.22 + ny * curveSide * 0.85 + liftY * 0.85 };
    const p2 = { x: dx * 0.74 + nx * curveSide * 0.65, y: dy * 0.74 + ny * curveSide * 0.65 + liftY * 0.75 };
    const p3 = { x: dx, y: dy };

    const s0 = cfg.s0 != null ? cfg.s0 : 1;
    const sMid = cfg.sMid != null ? cfg.sMid : 1.2;
    const s1 = cfg.s1 != null ? cfg.s1 : 1;
    const flipY0 = cfg.rotY0 || 0;
    const flipY1 = cfg.rotY1 || 0;
    const bankMax = cfg.bank != null ? cfg.bank : clamp(dx * 0.065, -14, 14);
    const pitchMax = cfg.pitch != null ? cfg.pitch : 12;
    const op0 = cfg.op0 != null ? cfg.op0 : 1;
    const op1 = cfg.op1 != null ? cfg.op1 : 1;
    const persp = cfg.persp || 720;

    const frames = [];
    for (let i = 0; i <= N; i++) {
      const rawT = i / N;
      const u = cfg.overshoot ? easeOutBackSoft(rawT) : (rawT < 0.14 ? (rawT / 0.14) * (rawT / 0.14) * 0.14 : easeQuintInOut(rawT));
      const pt = bezierPt(p0, p1, p2, p3, clamp(u, 0, 1.05));
      const bell = Math.sin(Math.min(1, rawT) * Math.PI);
      const scBase = s0 + (s1 - s0) * clamp(u, 0, 1);
      const sc = scBase + (sMid - (s0 + s1) * 0.5) * Math.pow(bell, 0.85);
      const ry = flipY0 + (flipY1 - flipY0) * easeQuintInOut(rawT);
      const rz = bankMax * Math.sin(rawT * Math.PI) + (cfg.spinZ ? cfg.spinZ * rawT : 0);
      const rx = pitchMax * Math.cos(rawT * Math.PI) * bell;
      const tz = Math.round(bell * (cfg.zLift || 46));
      let op = op0 + (op1 - op0) * rawT;
      if (cfg.fadeIn && rawT < 0.15) op = (rawT / 0.15) * op1;
      if (cfg.fadeOut && rawT > 0.82) op = op1 * (1 - (rawT - 0.82) / 0.18);

      frames.push({
        offset: rawT,
        opacity: clamp(op, 0, 1),
        transform: `perspective(${persp}px) translate3d(${pt.x.toFixed(2)}px, ${pt.y.toFixed(2)}px, ${tz}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sc.toFixed(3)})`
      });
    }
    return { frames, p0, p1, p2, p3 };
  }

  /* ==================== 3. HỆ THỐNG THÔNG BÁO NỬA TRÊN CHIẾN ĐỊA (PHẦN SÂN ĐỐI THỦ) ==================== */
  let oppHost = null;
  let lastNotifText = "";
  let lastNotifTime = 0;

  function syncOppCourtMetrics() {
    const root = document.documentElement;
    const board = $id("board");
    if (!board) return;
    const br = board.getBoundingClientRect();
    if (br.width < 20 || br.height < 20) return;

    const opps = board.querySelectorAll(".side.opp");
    let oppTop = br.top + 6;
    let oppBot = br.top + br.height * 0.42;
    if (opps.length) {
      let minT = Infinity, maxB = -Infinity;
      opps.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height > 8) {
          minT = Math.min(minT, r.top);
          maxB = Math.max(maxB, r.bottom);
        }
      });
      if (isFinite(minT) && isFinite(maxB) && maxB > minT) {
        oppTop = minT;
        oppBot = maxB;
      }
    }
    const oppCy = oppTop + (oppBot - oppTop) * 0.48;
    const oppLeft = br.left + br.width * 0.5;
    const oppW = Math.min(window.innerWidth * 0.95, Math.max(270, br.width));

    root.style.setProperty("--opp-left", oppLeft.toFixed(1) + "px");
    root.style.setProperty("--opp-top", Math.max(46, oppTop).toFixed(1) + "px");
    root.style.setProperty("--opp-cy", Math.max(92, oppCy).toFixed(1) + "px");
    root.style.setProperty("--opp-w", oppW.toFixed(1) + "px");
  }

  window.addEventListener("resize", syncOppCourtMetrics, { passive: true });

  function ensureOppHost() {
    if (oppHost && oppHost.isConnected) return oppHost;
    oppHost = $id("oppNotifHost");
    if (!oppHost) {
      oppHost = document.createElement("div");
      oppHost.id = "oppNotifHost";
      oppHost.setAttribute("aria-live", "polite");
      document.body.appendChild(oppHost);
    }
    return oppHost;
  }

  let lastNotifSrc = "";
  function condenseActLabel(raw) {
    let s = String(raw || "").replace(/!+/g, "").replace(/\s+/g, " ").trim();
    if (!s) return "";
    const low = s.toLowerCase();
    if (/lôi thẻ từ tay|kéo thẻ từ bộ bài/.test(low)) return "Lôi thẻ xuống sân";
    if (/xúc tu.*kéo|lưới tơ.*kéo|nam châm.*hút|rễ đa.*kéo|móc câu.*giật|dải lụa.*kéo|vòi rồng.*cuốn|linh phù.*dẫn/.test(low)) return "Kéo thẻ";
    if (/điều quân cờ|thổi dời|đẩy sóng|đấm văng|quét văng|húc tung|hất văng/.test(low)) return "Đẩy dời thẻ";
    if (/cướp thẻ|về phe ta|sang phe đối thủ|đổi sang phe/.test(low)) return "Đổi phe";
    if (/nhân bản/.test(low)) return "Nhân bản";
    if (/chép kỹ năng|sao chép/.test(low)) return "Sao chép";
    if (/cướp kỹ năng/.test(low)) return "Cướp chiêu";
    if (/mất kỹ năng|xoá kỹ năng|phong ấn/.test(low)) return "Xoá chiêu";
    if (/tiêu huỷ|chém hạ|nghiền nát/.test(low)) return "Tiêu huỷ";
    if (/triệu hồi/.test(low)) return "Triệu hồi";
    if (/về tay/.test(low)) return "Trả về tay";
    if (/vứt bỏ/.test(low)) return "Vứt bỏ";
    if (s.length > 22) s = s.slice(0, 21).trim() + "…";
    return s;
  }

  function formatNotifInner(raw, isHtml) {
    if (isHtml) return raw;
    const s = String(raw || "").trim();
    const arrowIdx = s.indexOf("▸");
    if (arrowIdx > 0) {
      let left = s.slice(0, arrowIdx).trim();
      if (left.length > 18) left = left.slice(0, 17).trim() + "…";
      const right = condenseActLabel(s.slice(arrowIdx + 1));
      return `<span class="ntf-src">${esc(left)}</span><span class="ntf-sep">▸</span><span class="ntf-act">${esc(right)}</span>`;
    }
    const colonIdx = s.indexOf(":");
    if (colonIdx > 1 && colonIdx < 20) {
      const left = esc(s.slice(0, colonIdx + 1));
      const right = esc(condenseActLabel(s.slice(colonIdx + 1)));
      return `<span class="ntf-src">${left}</span> <span class="ntf-act">${right}</span>`;
    }
    return `<span class="ntf-act">${esc(condenseActLabel(s))}</span>`;
  }

  const NTF_KEEP_RE = /CƯỚP THẺ|BỊ CƯỚP|ĐỔI PHE|CƯỚP KỸ NĂNG|CHÉP KỸ NĂNG|CẤM ĐẶT|KHÔNG THỂ ĐẶT|CƯỢC|HẾT GIỜ|BỎ LƯỢT/i;
  function pushOppNotif(text, color, opts) {
    if (reduced || !text) return;
    const lobby = $id("lobby");
    if (lobby && lobby.classList.contains("on") && !(opts && opts.allowLobby)) return;

    syncOppCourtMetrics();
    const host = ensureOppHost();
    const cleanKey = String(text).replace(/<[^>]*>/g, "").trim();
    if (!cleanKey) return;
    /* gpu21: nửa trên sân chỉ hiện thông tin cần thiết (điều người chơi không tự thấy trên bàn).
       Bảng test VFX đang mở thì vẫn hiện đủ để thử. */
    const labOn = !!document.querySelector("#vfxLabDrawer.on");
    if (!labOn && !(opts && opts.essential) && !NTF_KEEP_RE.test(cleanKey)) return;

    const arrowIdx = cleanKey.indexOf("▸");
    const srcTag = arrowIdx > 0 ? cleanKey.slice(0, arrowIdx).trim().toUpperCase() : "";
    const now = performance.now();
    if (
      (cleanKey === lastNotifText && now - lastNotifTime < 650) ||
      (srcTag && srcTag === lastNotifSrc && now - lastNotifTime < 520 && !(opts && opts.force))
    ) {
      if (host.lastElementChild && !host.lastElementChild.dataset.leaving) {
        const prev = host.lastElementChild;
        prev.style.setProperty("--nc", color || "#7fe8ff");
        prev.innerHTML = formatNotifInner(text, !!(opts && opts.html));
      }
      lastNotifText = cleanKey;
      lastNotifTime = now;
      return;
    }
    lastNotifText = cleanKey;
    lastNotifSrc = srcTag;
    lastNotifTime = now;

    /* Chỉ giữ 1 nhãn chiêu siêu gọn duy nhất để không che khuất bàn đấu */
    const activeItems = Array.from(host.children).filter((el) => !el.dataset.leaving);
    while (activeItems.length >= 1) {
      const old = activeItems.shift();
      dismissOppNotif(old);
    }

    const item = document.createElement("div");
    item.className = "opp-ntf";
    item.style.setProperty("--nc", color || "#7fe8ff");
    item.innerHTML = formatNotifInner(text, !!(opts && opts.html));
    host.appendChild(item);

    item.animate([
      { opacity: 0, transform: "translate3d(0, -8px, 0) scale(0.9)" },
      { opacity: 1, transform: "translate3d(0, 1px, 0) scale(1.02)", offset: 0.55 },
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
    ], { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });

    const stayMs = (opts && opts.dur) || 1280;
    fxT(() => dismissOppNotif(item), stayMs);
  }

  function dismissOppNotif(item) {
    if (!item || !item.isConnected || item.dataset.leaving) return;
    item.dataset.leaving = "1";
    const a = item.animate([
      { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
      { opacity: 0, transform: "translate3d(0, -10px, 0) scale(0.92)" }
    ], { duration: 240, easing: "ease-out", fill: "forwards" });
    a.onfinish = () => item.remove();
    setTimeout(() => item.remove(), 340);
  }

  window.pushOppNotif = pushOppNotif;

  /* Chỉ giữ con số cộng/trừ ngắn gọn (+3, -2, ×2, = 4) nảy trên chính thẻ; mọi câu chữ thông báo đưa hết lên sân đối thủ */
  const PURE_STAT_RE = /^[+＋−\-×=]\s*\d+(?:\s*⚡\s*[+＋−\-]?\d*)?$/;
  function isPureStatNumber(txt) {
    const s = String(txt || "").trim();
    return s.length <= 9 && PURE_STAT_RE.test(s);
  }

  function spawnStatPop(x, y, txt, c) {
    if (reduced) return;
    const d = document.createElement("div");
    d.className = "float f7";
    d.textContent = txt;
    const cx = clamp(x, 26, window.innerWidth - 26);
    const cy = clamp(y, 54, window.innerHeight - 36);
    d.style.left = cx + "px";
    d.style.top = cy + "px";
    d.style.color = c || "#ffffff";
    d.style.animation = "none";
    document.body.appendChild(d);

    const a = d.animate([
      { transform: "translate3d(-50%, -30%, 0) scale(0.45)", opacity: 0 },
      { transform: "translate3d(-50%, -78%, 0) scale(1.28)", opacity: 1, offset: 0.22 },
      { transform: "translate3d(-50%, -96%, 0) scale(1.0)", opacity: 1, offset: 0.42 },
      { transform: "translate3d(-50%, -125%, 0) scale(1.0)", opacity: 1, offset: 0.78 },
      { transform: "translate3d(-50%, -158%, 0) scale(0.88)", opacity: 0 }
    ], { duration: 1080, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
    a.onfinish = () => d.remove();
    fxT(() => d.remove(), 1250);
  }

  if (typeof say === "function") {
    say = function (x, y, t, c, dl) {
      if (reduced || !t) return;
      const run = () => {
        if (typeof SAYOFF !== "undefined" && SAYOFF) return;
        if (isPureStatNumber(t)) spawnStatPop(x, y, t, c);
        else pushOppNotif(t, c);
      };
      if (dl) fxT(run, dl);
      else run();
    };
  }

  if (typeof banner === "function") {
    const _bannerOrig = banner;
    banner = function (t, s) {
      syncOppCourtMetrics();
      return _bannerOrig(t, s);
    };
  }

  if (typeof locBanner8 === "function") {
    const _locBannerOrig = locBanner8;
    locBanner8 = function (ls) {
      syncOppCourtMetrics();
      return _locBannerOrig(ls);
    };
  }

  /* ==================== 4. BỘ MÁY SHADER WEBGL GPU (HẠT HDR + SÓNG XUNG KÍCH + DÂY XÍCH NĂNG LƯỢNG) ==================== */
  const GLFX = (() => {
    const cv = document.createElement("canvas");
    cv.id = "fxgl";
    cv.setAttribute("aria-hidden", "true");
    const fx2d = $id("fx");
    if (fx2d && fx2d.parentNode) fx2d.parentNode.insertBefore(cv, fx2d.nextSibling);
    else document.body.appendChild(cv);

    const gl =
      cv.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: "high-performance" }) ||
      cv.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });

    if (!gl) {
      return { ok: false, count: () => 0, fps: () => 60, emit() {}, ring() {}, arc() {}, tether() {}, impulseShake() {} };
    }

    let W = window.innerWidth, H = window.innerHeight, dpr = 1;
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, window.innerWidth);
      H = Math.max(1, window.innerHeight);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
    }
    resize();
    window.addEventListener("resize", resize);

    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    function linkProg(vsSrc, fsSrc) {
      const vs = compile(gl.VERTEX_SHADER, vsSrc);
      const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
      if (!vs || !fs) return null;
      const pr = gl.createProgram();
      gl.attachShader(pr, vs);
      gl.attachShader(pr, fs);
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
      return pr;
    }

    const VS_PARTICLE = `
      attribute vec2 aPos;
      attribute vec2 aUV;
      attribute vec4 aCol;
      attribute float aKind;
      uniform vec2 uRes;
      varying vec2 vUV;
      varying vec4 vCol;
      varying float vKind;
      void main() {
        vec2 clip = (aPos / uRes) * 2.0 - 1.0;
        gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
        vUV = aUV;
        vCol = aCol;
        vKind = aKind;
      }
    `;

    const FS_PARTICLE = `
      precision mediump float;
      varying vec2 vUV;
      varying vec4 vCol;
      varying float vKind;
      void main() {
        vec2 p = vUV;
        float d = length(p);
        float intensity = 0.0;
        float core = 0.0;

        if (vKind < 0.5) {
          if (d > 1.0) discard;
          intensity = exp(-d * d * 4.2) * (1.0 - smoothstep(0.72, 1.0, d));
          core = exp(-d * d * 20.0) * 0.95;
        } else if (vKind < 1.5) {
          vec2 q = vec2(p.x * 0.85, p.y * 2.35);
          float dq = length(q);
          if (dq > 1.05) discard;
          float head = smoothstep(-0.9, 0.55, p.x);
          intensity = exp(-dq * dq * 3.8) * (0.45 + 0.75 * head) * (1.0 - smoothstep(0.75, 1.05, dq));
          core = exp(-(q.x - 0.18) * (q.x - 0.18) * 10.0 - q.y * q.y * 16.0);
        } else if (vKind < 2.5) {
          if (d > 1.02) discard;
          float ringDist = abs(d - 0.76);
          float outer = exp(-ringDist * ringDist * 95.0);
          float innerGlow = smoothstep(0.0, 0.76, d) * (1.0 - smoothstep(0.76, 0.92, d)) * 0.28;
          intensity = outer + innerGlow;
          core = exp(-ringDist * ringDist * 320.0) * 0.9;
        } else if (vKind < 3.5) {
          if (d > 1.0) discard;
          float ax = exp(-abs(p.x) * 7.5) * exp(-abs(p.y) * 1.4);
          float ay = exp(-abs(p.y) * 7.5) * exp(-abs(p.x) * 1.4);
          float orb = exp(-d * d * 7.0);
          intensity = clamp(ax + ay + orb * 0.8, 0.0, 1.6) * (1.0 - smoothstep(0.78, 1.0, d));
          core = exp(-d * d * 26.0);
        } else if (vKind < 4.5) {
          float md = abs(p.x) * 1.15 + abs(p.y) * 1.75;
          if (md > 1.0) discard;
          intensity = (1.0 - smoothstep(0.55, 1.0, md)) * 0.95;
          core = (1.0 - smoothstep(0.0, 0.42, md)) * 0.85;
        } else {
          float cy = p.y + p.x * p.x * 0.42;
          float blade = exp(-cy * cy * 28.0) * (1.0 - smoothstep(0.25, 1.0, abs(p.x)));
          intensity = blade * 1.25;
          core = exp(-cy * cy * 95.0) * (1.0 - smoothstep(0.15, 0.92, abs(p.x)));
        }

        float a = intensity * vCol.a;
        if (a < 0.004) discard;
        vec3 rgb = mix(vCol.rgb * intensity, vec3(1.0, 0.99, 0.96), clamp(core * vCol.a * 0.88, 0.0, 0.92));
        gl_FragColor = vec4(rgb * vCol.a, clamp(a, 0.0, 1.0));
      }
    `;

    const prog = linkProg(VS_PARTICLE, FS_PARTICLE);
    if (!prog) {
      return { ok: false, count: () => 0, fps: () => 60, emit() {}, ring() {}, arc() {}, tether() {}, impulseShake() {} };
    }

    const locPos = gl.getAttribLocation(prog, "aPos");
    const locUV = gl.getAttribLocation(prog, "aUV");
    const locCol = gl.getAttribLocation(prog, "aCol");
    const locKind = gl.getAttribLocation(prog, "aKind");
    const locRes = gl.getUniformLocation(prog, "uRes");

    const MAX_QUADS = 1600;
    const FLOATS_PER_VERT = 9;
    const FLOATS_PER_QUAD = FLOATS_PER_VERT * 6;
    const vboData = new Float32Array(MAX_QUADS * FLOATS_PER_QUAD);
    const vbo = gl.createBuffer();

    const particles = [];
    const segments = [];
    let rafId = 0;
    let lastT = performance.now();
    let fpsSmooth = 60;

    function pushQuad(qi, cx, cy, ux, uy, vx, vy, r, g, b, a, kind) {
      const o = qi * FLOATS_PER_QUAD;
      const x0 = cx - ux - vx, y0 = cy - uy - vy;
      const x1 = cx + ux - vx, y1 = cy + uy - vy;
      const x2 = cx + ux + vx, y2 = cy + uy + vy;
      const x3 = cx - ux + vx, y3 = cy - uy + vy;

      vboData[o]      = x0; vboData[o + 1]  = y0; vboData[o + 2]  = -1; vboData[o + 3]  = -1;
      vboData[o + 4]  = r;  vboData[o + 5]  = g;  vboData[o + 6]  = b;  vboData[o + 7]  = a;  vboData[o + 8]  = kind;

      vboData[o + 9]  = x1; vboData[o + 10] = y1; vboData[o + 11] =  1; vboData[o + 12] = -1;
      vboData[o + 13] = r;  vboData[o + 14] = g;  vboData[o + 15] = b;  vboData[o + 16] = a;  vboData[o + 17] = kind;

      vboData[o + 18] = x2; vboData[o + 19] = y2; vboData[o + 20] =  1; vboData[o + 21] =  1;
      vboData[o + 22] = r;  vboData[o + 23] = g;  vboData[o + 24] = b;  vboData[o + 25] = a;  vboData[o + 26] = kind;

      vboData[o + 27] = x0; vboData[o + 28] = y0; vboData[o + 29] = -1; vboData[o + 30] = -1;
      vboData[o + 31] = r;  vboData[o + 32] = g;  vboData[o + 33] = b;  vboData[o + 34] = a;  vboData[o + 35] = kind;

      vboData[o + 36] = x2; vboData[o + 37] = y2; vboData[o + 38] =  1; vboData[o + 39] =  1;
      vboData[o + 40] = r;  vboData[o + 41] = g;  vboData[o + 42] = b;  vboData[o + 43] = a;  vboData[o + 44] = kind;

      vboData[o + 45] = x3; vboData[o + 46] = y3; vboData[o + 47] = -1; vboData[o + 48] =  1;
      vboData[o + 49] = r;  vboData[o + 50] = g;  vboData[o + 51] = b;  vboData[o + 52] = a;  vboData[o + 53] = kind;
    }

    function pushSegmentQuad(qi, x1, y1, x2, y2, halfW, r, g, b, a) {
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 0.5) return false;
      const nx = (-dy / len) * halfW;
      const ny = (dx / len) * halfW;
      const tx = (dx / len) * (halfW * 0.35);
      const ty = (dy / len) * (halfW * 0.35);
      const ax = x1 - tx, ay = y1 - ty;
      const bx = x2 + tx, by = y2 + ty;

      const o = qi * FLOATS_PER_QUAD;
      const p0x = ax - nx, p0y = ay - ny;
      const p1x = bx - nx, p1y = by - ny;
      const p2x = bx + nx, p2y = by + ny;
      const p3x = ax + nx, p3y = ay + ny;

      vboData[o]      = p0x; vboData[o + 1]  = p0y; vboData[o + 2]  = 0; vboData[o + 3]  = -0.55;
      vboData[o + 4]  = r;   vboData[o + 5]  = g;   vboData[o + 6]  = b; vboData[o + 7]  = a; vboData[o + 8]  = 5;

      vboData[o + 9]  = p1x; vboData[o + 10] = p1y; vboData[o + 11] = 0; vboData[o + 12] = -0.55;
      vboData[o + 13] = r;   vboData[o + 14] = g;   vboData[o + 15] = b; vboData[o + 16] = a; vboData[o + 17] = 5;

      vboData[o + 18] = p2x; vboData[o + 19] = p2y; vboData[o + 20] = 0; vboData[o + 21] =  0.55;
      vboData[o + 22] = r;   vboData[o + 23] = g;   vboData[o + 24] = b; vboData[o + 25] = a; vboData[o + 26] = 5;

      vboData[o + 27] = p0x; vboData[o + 28] = p0y; vboData[o + 29] = 0; vboData[o + 30] = -0.55;
      vboData[o + 31] = r;   vboData[o + 32] = g;   vboData[o + 33] = b; vboData[o + 34] = a; vboData[o + 35] = 5;

      vboData[o + 36] = p2x; vboData[o + 37] = p2y; vboData[o + 38] = 0; vboData[o + 39] =  0.55;
      vboData[o + 40] = r;   vboData[o + 41] = g;   vboData[o + 42] = b; vboData[o + 43] = a; vboData[o + 44] = 5;

      vboData[o + 45] = p3x; vboData[o + 46] = p3y; vboData[o + 47] = 0; vboData[o + 48] =  0.55;
      vboData[o + 49] = r;   vboData[o + 50] = g;   vboData[o + 51] = b; vboData[o + 52] = a; vboData[o + 53] = 5;
      return true;
    }

    function ensureLoop() {
      if (!rafId) {
        lastT = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    }

    function emit(opts) {
      if (reduced || store.gpu === false) return;
      /* gpu20: máy đang yếu thì bớt hạt nhỏ (giữ nguyên vòng sóng, vệt chém, hình chiêu) */
      if (window.FXLV === 0 && (opts.kind || 0) <= 1 && !opts.keep && Math.random() < 0.35) return;
      if (particles.length >= MAX_QUADS - 450) particles.shift();
      const rgb = Array.isArray(opts.col) ? opts.col : parseCol(opts.c || "#3fe0ff");
      particles.push({
        x: opts.x || 0,
        y: opts.y || 0,
        vx: opts.vx || 0,
        vy: opts.vy || 0,
        gx: opts.gx || 0,
        gy: opts.gy || 0,
        drag: opts.drag != null ? opts.drag : 1.2,
        turb: opts.turb || 0,
        phase: Math.random() * 6.283,
        s0: opts.s0 != null ? opts.s0 : 12,
        s1: opts.s1 != null ? opts.s1 : (opts.s0 != null ? opts.s0 * 0.25 : 4),
        sy: opts.sy || 1,
        rot: opts.rot != null ? opts.rot : Math.random() * 6.283,
        vrot: opts.vrot || 0,
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        a0: opts.a != null ? opts.a : 0.95,
        kind: opts.kind || 0,
        dur: Math.max(0.08, opts.dur || 0.55),
        age: -(opts.delay || 0),
        stretch: opts.stretch || 0
      });
      ensureLoop();
    }

    function ring(x, y, c, radius, dur, alpha, flatY) {
      emit({
        x, y, c,
        kind: 2,
        s0: Math.max(6, radius * 0.14),
        s1: radius || 95,
        sy: flatY || 1,
        dur: dur || 0.46,
        a: alpha != null ? alpha : 0.92,
        drag: 0,
        rot: 0
      });
    }

    function arc(x1, y1, x2, y2, c, width, jagged, branches, dur) {
      if (reduced || store.gpu === false) return;
      const rgb = parseCol(c || "#7fe8ff");
      const dist = Math.hypot(x2 - x1, y2 - y1);
      const steps = Math.max(5, Math.min(18, Math.round(dist / 22)));
      const dx = x2 - x1, dy = y2 - y1;
      const nx = -dy / (dist || 1), ny = dx / (dist || 1);
      const spread = (jagged != null ? jagged : 1) * Math.min(32, dist * 0.14);

      const pts = [[x1, y1]];
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const env = Math.sin(t * Math.PI);
        const off = rnd(-spread, spread) * env;
        pts.push([x1 + dx * t + nx * off, y1 + dy * t + ny * off]);
      }
      pts.push([x2, y2]);

      const lifeDur = dur || 0.28;
      const w = width || 12;
      for (let i = 0; i < pts.length - 1; i++) {
        if (segments.length >= 1000) segments.shift();
        segments.push({
          x1: pts[i][0], y1: pts[i][1],
          x2: pts[i + 1][0], y2: pts[i + 1][1],
          w, r: rgb[0], g: rgb[1], b: rgb[2],
          a0: 0.95, dur: lifeDur, age: 0
        });
        if (branches && i > 1 && i < pts.length - 2 && Math.random() < 0.35) {
          const bx = pts[i][0] + dx * 0.22 + nx * rnd(-spread * 1.5, spread * 1.5);
          const by = pts[i][1] + dy * 0.22 + ny * rnd(-spread * 1.5, spread * 1.5);
          segments.push({
            x1: pts[i][0], y1: pts[i][1], x2: bx, y2: by,
            w: w * 0.58, r: rgb[0], g: rgb[1], b: rgb[2],
            a0: 0.72, dur: lifeDur * 0.8, age: 0
          });
        }
      }
      ensureLoop();
    }

    /* Dây xích / dải lụa năng lượng uốn cong mượt (dùng khi Cướp Thẻ / Kéo Thẻ / Hút Kỹ Năng) */
    function tether(x1, y1, x2, y2, c, width, curveAmt, dur) {
      if (reduced || store.gpu === false) return;
      const rgb = parseCol(c || "#c45cff");
      const dx = x2 - x1, dy = y2 - y1;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist, ny = dx / dist;
      const bend = (curveAmt != null ? curveAmt : 0.22) * dist;
      const cx = (x1 + x2) * 0.5 + nx * bend;
      const cy = (y1 + y2) * 0.5 + ny * bend;
      const steps = 16;
      let px = x1, py = y1;
      const lifeDur = dur || 0.36;
      const w = width || 10;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, u = 1 - t;
        const qx = u * u * x1 + 2 * u * t * cx + t * t * x2;
        const qy = u * u * y1 + 2 * u * t * cy + t * t * y2;
        if (segments.length >= 1000) segments.shift();
        segments.push({
          x1: px, y1: py, x2: qx, y2: qy,
          w: w * (0.65 + 0.55 * Math.sin(t * Math.PI)),
          r: rgb[0], g: rgb[1], b: rgb[2],
          a0: 0.92, dur: lifeDur, age: 0
        });
        px = qx; py = qy;
      }
      ensureLoop();
    }

    const cam = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vrot: 0, active: false };
    function impulseShake(power, dirX, dirY) {
      if (reduced) return;
      const amp = Math.min(13, Math.max(1.6, power));
      const ang = dirX != null && dirY != null ? Math.atan2(dirY, dirX) : Math.random() * 6.283;
      cam.vx += Math.cos(ang) * amp * 40;
      cam.vy += Math.sin(ang) * amp * 40;
      cam.vrot += rnd(-1, 1) * amp * 0.26;
      cam.active = true;
      ensureLoop();
    }

    function stepShake(dt) {
      if (!cam.active) return;
      const board = $id("board");
      const k = 270, damp = 19;
      cam.vx += (-k * cam.x - damp * cam.vx) * dt;
      cam.vy += (-k * cam.y - damp * cam.vy) * dt;
      cam.vrot += (-k * cam.rot - damp * cam.vrot) * dt;
      cam.x += cam.vx * dt;
      cam.y += cam.vy * dt;
      cam.rot += cam.vrot * dt;
      if (Math.abs(cam.x) < 0.08 && Math.abs(cam.y) < 0.08 && Math.abs(cam.vx) < 0.5 && Math.abs(cam.vy) < 0.5) {
        cam.x = cam.y = cam.vx = cam.vy = cam.rot = cam.vrot = 0;
        cam.active = false;
        if (board) board.style.transform = "";
      } else if (board) {
        board.style.transform = `translate3d(${cam.x.toFixed(2)}px, ${cam.y.toFixed(2)}px, 0) rotate(${cam.rot.toFixed(2)}deg)`;
      }
    }

    let ambTimer = 0;
    function isBattleVisible() {
      if (reduced || store.gpu === false || document.hidden || !G || G.phase === "over") return false;
      const lobby = $id("lobby");
      if (lobby && lobby.classList.contains("on")) return false;
      return !document.querySelector(".ov.on");
    }

    /* gpu20: hạt bay nền chiến địa chạy bằng lớp CSS nhẹ (chỉ transform/opacity, GPU ghép sẵn),
       không bắt lớp WebGL toàn màn hình (có hoà trộn screen) vẽ lại mỗi khung khi không có chiêu */
    let ambHost = null;
    function ambEnsure() {
      if (ambHost && ambHost.isConnected) return ambHost;
      ambHost = document.createElement("div");
      ambHost.id = "ambFx";
      ambHost.setAttribute("aria-hidden", "true");
      (document.body).appendChild(ambHost);
      return ambHost;
    }
    function ambClear() { if (ambHost && ambHost.firstChild) ambHost.textContent = ""; }
    function ambEmit(o) {
      const h = ambEnsure();
      const cap = window.FXLV === 0 ? 14 : 34;
      if (h.childElementCount >= cap) return;
      const drag = 1.2, sp = Math.max(0.55, (typeof SPD !== "undefined" && SPD) || 1);
      const T = o.dur * sp, k = (1 - Math.exp(-drag * o.dur)) / drag;
      const d = Math.round(o.s0 * 2.3);
      const el = document.createElement("i");
      el.className = "amb k" + (o.kind || 0);
      const wob = (o.turb || 0) * (Math.random() < 0.5 ? -0.16 : 0.16);
      el.style.cssText = `left:${o.x.toFixed(1)}px;top:${o.y.toFixed(1)}px;width:${d}px;height:${d}px;--c:${o.c};--a:${(Math.min(1, o.a * 1.55)).toFixed(2)};--dx:${(o.vx * k).toFixed(1)}px;--dy:${(o.vy * k).toFixed(1)}px;--wx:${wob.toFixed(1)}px;--s:${Math.max(0.18, (o.s1 || 1.5) / o.s0).toFixed(2)};--r:${o.vrot ? (o.vrot * o.dur * 57).toFixed(0) : 0}deg;animation-duration:${T.toFixed(2)}s`;
      el.addEventListener("animationend", () => el.remove(), { once: true });
      h.appendChild(el);
    }

    function stepAmbient(dt) {
      if (!isBattleVisible()) { ambClear(); return; }
      ambTimer += dt;
      if (ambTimer < 0.24) return;
      ambTimer = 0;
      const emit = ambEmit;
      const lrs = window._gpuLaneRects;
      if (!lrs) return;
      for (let li = 0; li < 3; li++) {
        const L = G.locs && G.locs[li];
        const r = lrs[li];
        if (!L || !L.rvl || L.gone || !r || r.width < 10 || Math.random() > 0.42) continue;
        const th = (typeof LTH !== "undefined" && LTH[L.id]) || "thieng";
        const px = rnd(r.left + 8, r.right - 8);
        const py = rnd(r.top + 14, r.bottom - 14);
        if (th === "lua") {
          emit({ x: px, y: r.bottom - rnd(4, 30), vx: rnd(-14, 14), vy: rnd(-68, -32), turb: 26, c: Math.random() < 0.5 ? "#ff7a1f" : "#ffd06a", kind: 1, stretch: 0.018, s0: rnd(4.5, 8), s1: 1.5, dur: rnd(0.85, 1.4), a: 0.55 });
        } else if (th === "suong") {
          emit({ x: px, y: r.top + rnd(0, 36), vx: rnd(-14, 14), vy: rnd(20, 46), turb: 16, c: "#dff6ff", kind: 3, s0: rnd(4.5, 8), s1: 2, dur: rnd(1.1, 1.8), a: 0.48, vrot: rnd(-1.6, 1.6) });
        } else if (th === "nuoc") {
          emit({ x: px, y: py, vx: rnd(-8, 8), vy: rnd(-34, -14), turb: 14, c: "#40e0ff", kind: 0, s0: rnd(4.5, 8.5), s1: 2, dur: rnd(1.0, 1.7), a: 0.42 });
        } else if (th === "toi") {
          emit({ x: px, y: py, vx: rnd(-12, 12), vy: rnd(-24, -8), turb: 22, c: "#b45cff", kind: 0, s0: rnd(6, 11), s1: 2, dur: rnd(1.1, 1.8), a: 0.4 });
        } else if (th === "rung") {
          emit({ x: px, y: py, vx: rnd(-14, 14), vy: rnd(-26, -8), turb: 24, c: Math.random() < 0.35 ? "#ffe27a" : "#74f268", kind: 0, s0: rnd(4, 7.5), s1: 1.5, dur: rnd(1.1, 1.9), a: 0.45 });
        } else {
          emit({ x: px, y: py, vx: rnd(-8, 8), vy: rnd(-30, -10), turb: 14, c: "#ffd86b", kind: 3, s0: rnd(4.5, 8), s1: 1.5, dur: rnd(1.1, 1.8), a: 0.44 });
        }
      }
    }

    let canvasCleared = false;
    function frame(now) {
      rafId = 0;
      if (document.hidden || reduced || store.gpu === false) {
        particles.length = 0;
        segments.length = 0;
        if (!canvasCleared) {
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          canvasCleared = true;
          cv.style.visibility = "hidden";
        }
        return;
      }

      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
      lastT = now;
      fpsSmooth = fpsSmooth * 0.92 + (1 / rawDt) * 0.08;
      const dt = rawDt / Math.max(0.55, SPD || 1);

      stepShake(rawDt);
      stepAmbient(rawDt);

      const hasWork = particles.length > 0 || segments.length > 0 || cam.active;
      if (!hasWork) {
        if (!canvasCleared) {
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          canvasCleared = true;
          cv.style.visibility = "hidden";
        }
        if (isBattleVisible()) rafId = requestAnimationFrame(frame);
        return;
      }

      if (canvasCleared) cv.style.visibility = "";
      canvasCleared = false;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      let qi = 0;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        if (p.age < 0) continue;
        const t = p.age / p.dur;
        if (t >= 1) {
          particles[i] = particles[particles.length - 1];
          particles.pop();
          continue;
        }
        if (qi >= MAX_QUADS) continue;

        const damp = Math.exp(-p.drag * dt);
        p.vx = p.vx * damp + p.gx * dt;
        p.vy = p.vy * damp + p.gy * dt;
        if (p.turb) {
          p.vx += Math.sin(p.age * 7.5 + p.phase) * p.turb * dt;
          p.vy += Math.cos(p.age * 6.3 + p.phase) * p.turb * 0.6 * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;

        const easeOut = 1 - Math.pow(1 - t, 2.4);
        const sz = p.s0 + (p.s1 - p.s0) * easeOut;
        const fadeIn = Math.min(1, t * 8.5);
        const fadeOut = Math.pow(1 - t, p.kind === 2 ? 1.55 : 1.25);
        const alpha = p.a0 * fadeIn * fadeOut;

        let ux, uy, vx, vy;
        if (p.kind === 1) {
          const sp = Math.hypot(p.vx, p.vy);
          const ang = sp > 2 ? Math.atan2(p.vy, p.vx) : p.rot;
          const len = Math.max(sz, sz + sp * (p.stretch || 0.032));
          const c = Math.cos(ang), s = Math.sin(ang);
          ux = c * len; uy = s * len;
          vx = -s * sz * 0.65; vy = c * sz * 0.65;
        } else {
          const c = Math.cos(p.rot), s = Math.sin(p.rot);
          ux = c * sz; uy = s * sz * p.sy;
          vx = -s * sz; vy = c * sz * p.sy;
        }

        pushQuad(qi++, p.x, p.y, ux, uy, vx, vy, p.r, p.g, p.b, alpha, p.kind);
      }

      for (let i = segments.length - 1; i >= 0; i--) {
        const s = segments[i];
        s.age += dt;
        const t = s.age / s.dur;
        if (t >= 1) {
          segments[i] = segments[segments.length - 1];
          segments.pop();
          continue;
        }
        if (qi >= MAX_QUADS) continue;
        const flicker = 0.8 + 0.2 * Math.sin(s.age * 65);
        const alpha = s.a0 * (1 - t) * flicker;
        const hw = s.w * (0.45 + 0.55 * (1 - t));
        if (pushSegmentQuad(qi, s.x1, s.y1, s.x2, s.y2, hw, s.r, s.g, s.b, alpha)) qi++;
      }

      if (qi > 0) {
        gl.useProgram(prog);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.uniform2f(locRes, W, H);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vboData.subarray(0, qi * FLOATS_PER_QUAD), gl.DYNAMIC_DRAW);

        const stride = FLOATS_PER_VERT * 4;
        gl.enableVertexAttribArray(locPos);
        gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(locUV);
        gl.vertexAttribPointer(locUV, 2, gl.FLOAT, false, stride, 8);
        gl.enableVertexAttribArray(locCol);
        gl.vertexAttribPointer(locCol, 4, gl.FLOAT, false, stride, 16);
        gl.enableVertexAttribArray(locKind);
        gl.vertexAttribPointer(locKind, 1, gl.FLOAT, false, stride, 32);

        gl.drawArrays(gl.TRIANGLES, 0, qi * 6);
      }

      if (particles.length > 0 || segments.length > 0 || cam.active || isBattleVisible()) {
        rafId = requestAnimationFrame(frame);
      }
    }

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && isBattleVisible()) ensureLoop();
    });

    return {
      ok: true,
      wake: ensureLoop,
      count: () => particles.length + segments.length,
      fps: () => Math.round(fpsSmooth),
      emit,
      ring,
      arc,
      tether,
      impulseShake
    };
  })();

  window.GLFX = GLFX;

  /* ==================== 5. NÂNG CẤP TOÀN DIỆN FX.* LÊN GPU ==================== */
  function gpuFlash(col, opacity, dur) {
    if (reduced) return;
    const el = $id("flash");
    if (!el || !el.animate) return;
    const op = Math.min(0.45, opacity || 0.22);
    el.style.background = `radial-gradient(circle at 50% 48%, ${col || "#ffffff"} 0%, ${col || "#3fe0ff"}55 48%, transparent 82%)`;
    el.animate([{ opacity: op }, { opacity: 0 }], { duration: dur || 260, easing: "ease-out" });
  }

  /* Theo dõi một đường cong Bezier theo thời gian thực để rải hạt đuôi sao chổi 60FPS mượt không tốn DOM */
  function streamBezierRibbon(x0, y0, p1, p2, p3, durMs, col1, col2, density) {
    if (reduced || !GLFX.ok) return;
    const t0 = performance.now();
    const scaledD = Math.max(80, durMs * (SPD || 1));
    const nPerFrame = density || 2;
    const step = (now) => {
      const q = Math.min(1, (now - t0) / scaledD);
      const u = easeQuintInOut(q);
      const pt = bezierPt({ x: 0, y: 0 }, p1, p2, p3, u);
      const px = x0 + pt.x, py = y0 + pt.y;
      for (let i = 0; i < nPerFrame; i++) {
        GLFX.emit({
          x: px + rnd(-5, 5),
          y: py + rnd(-5, 5),
          vx: rnd(-32, 32),
          vy: rnd(-32, 32),
          c: i % 2 === 0 ? col1 : (col2 || "#ffffff"),
          kind: i % 2 === 0 ? 1 : 3,
          stretch: 0.026,
          s0: rnd(6, 11.5),
          s1: 1.5,
          dur: rnd(0.3, 0.48),
          a: 0.92
        });
      }
      if (q < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if (typeof FX === "object" && FX && GLFX.ok) {
    const _sigil2d = FX.sigil.bind(FX);

    FX.float = function (x, y, txt, c) {
      if (reduced || !txt) return;
      if (isPureStatNumber(txt)) spawnStatPop(x, y, txt, c);
      else pushOppNotif(txt, c);
    };

    FX.burst = function (x, y, c, n, sp) {
      if (reduced) return;
      const cnt = Math.min(32, Math.round((n || 18) * 0.95));
      const speed = Math.max(150, (sp || 180) * 1.25);
      GLFX.emit({ x, y, c, kind: 0, s0: 14, s1: 46, dur: 0.26, a: 0.72 });
      for (let i = 0; i < cnt; i++) {
        const a = rnd(0, 6.283), v = rnd(0.28, 1.05) * speed;
        GLFX.emit({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          gy: 110,
          drag: 2.4,
          turb: 20,
          c: i % 5 === 0 ? "#ffffff" : c,
          kind: i % 3 === 0 ? 1 : 0,
          stretch: 0.032,
          s0: rnd(5, 11),
          s1: 1.5,
          dur: rnd(0.34, 0.64),
          a: 0.92
        });
      }
    };

    FX.sparks = function (x, y, c, n, sp) {
      if (reduced) return;
      const cnt = Math.min(28, Math.round((n || 14) * 1.0));
      const speed = Math.max(200, (sp || 250) * 1.18);
      for (let i = 0; i < cnt; i++) {
        const a = rnd(0, 6.283), v = rnd(0.38, 1.12) * speed;
        GLFX.emit({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 45,
          gy: 460,
          drag: 1.9,
          c: i % 4 === 0 ? "#ffffff" : c,
          kind: 1,
          stretch: 0.04,
          s0: rnd(4.5, 9.5),
          s1: 1.2,
          dur: rnd(0.28, 0.56),
          a: 0.96
        });
      }
    };

    FX.ring = function (x, y, c, r1) {
      if (reduced) return;
      const rad = Math.max(50, (r1 || 54) * 1.2);
      GLFX.ring(x, y, c, rad, 0.42, 0.88);
    };

    FX.wave = function (x, y, c, r) {
      if (reduced) return;
      const rad = Math.max(72, (r || 70) * 1.28);
      GLFX.ring(x, y, c, rad, 0.44, 0.92);
      GLFX.ring(x, y, "#ffffff", rad * 0.65, 0.32, 0.78);
    };

    FX.glow = function (x, y, c, r, dur) {
      if (reduced) return;
      const rad = Math.max(52, (r || 64) * 1.2);
      GLFX.emit({ x, y, c, kind: 0, s0: rad * 0.35, s1: rad * 1.08, dur: dur || 0.42, a: 0.65, drag: 0 });
    };

    FX.rays = function (x, y, c, r) {
      if (reduced) return;
      const rad = Math.max(68, (r || 72) * 1.28);
      GLFX.emit({ x, y, c, kind: 3, s0: rad * 0.35, s1: rad * 1.2, dur: 0.52, a: 0.86, vrot: 1.2 });
      GLFX.emit({ x, y, c: "#ffffff", kind: 3, s0: rad * 0.25, s1: rad * 0.9, dur: 0.44, a: 0.74, rot: 0.785, vrot: -1.0 });
    };

    FX.shards = function (x, y, c) {
      if (reduced) return;
      for (let i = 0; i < 12; i++) {
        const a = rnd(0, 6.283), v = rnd(80, 240);
        GLFX.emit({
          x: x + rnd(-10, 10),
          y: y + rnd(-12, 12),
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 65,
          gy: 540,
          drag: 1.1,
          c: i % 3 === 0 ? "#eef4ff" : c,
          kind: 4,
          s0: rnd(6.5, 12.5),
          s1: 2,
          vrot: rnd(-10, 10),
          dur: rnd(0.4, 0.75),
          a: 0.92
        });
      }
    };

    FX.rise = function (x, y, c, n) {
      if (reduced) return;
      const cnt = Math.min(18, Math.round((n || 12) * 1.0));
      for (let i = 0; i < cnt; i++) {
        GLFX.emit({
          x: x + rnd(-20, 20),
          y: y + rnd(-6, 20),
          vx: rnd(-18, 18),
          vy: rnd(-140, -60),
          gy: -38,
          turb: 28,
          c: i % 4 === 0 ? "#ffffff" : c,
          kind: i % 3 === 0 ? 3 : 0,
          s0: rnd(5.5, 10.5),
          s1: 2,
          dur: rnd(0.48, 0.88),
          delay: rnd(0, 0.14),
          a: 0.85
        });
      }
    };

    FX.trail = function (x1, y1, x2, y2, c) {
      if (reduced) return;
      const steps = 12;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t - Math.sin(t * Math.PI) * 24;
        GLFX.emit({
          x: px + rnd(-3, 3),
          y: py + rnd(-3, 3),
          vx: rnd(-18, 18),
          vy: rnd(-18, 18),
          c: i % 4 === 0 ? "#ffffff" : c,
          kind: i % 3 === 0 ? 3 : 0,
          s0: 4 + 6.5 * t,
          s1: 1,
          dur: 0.36,
          delay: t * 0.14,
          a: 0.85
        });
      }
    };

    FX.comet = function (x1, y1, x2, y2, c) {
      if (reduced) return;
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t - Math.sin(t * Math.PI) * 30;
        GLFX.emit({
          x: px,
          y: py,
          vx: (x2 - x1) * 0.2 + rnd(-16, 16),
          vy: (y2 - y1) * 0.2 + rnd(-16, 16),
          c: i % 3 === 0 ? "#ffffff" : c,
          kind: 1,
          stretch: 0.026,
          s0: 5 + 8.5 * t,
          s1: 1.5,
          dur: 0.38,
          delay: t * 0.16,
          a: 0.92
        });
      }
    };

    FX.bolts = function (x, y, c, n, len) {
      if (reduced) return;
      const cnt = n || 7;
      const L = Math.max(52, (len || 54) * 1.28);
      for (let i = 0; i < cnt; i++) {
        const a = rnd(0, 6.283);
        const r = L * rnd(0.75, 1.25);
        GLFX.arc(x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, i % 3 === 0 ? "#ffffff" : c, 9.5, 1.2, true, rnd(0.22, 0.36));
      }
      GLFX.emit({ x, y, c, kind: 0, s0: 16, s1: 50, dur: 0.24, a: 0.8 });
    };

    FX.slash = function (x, y, c) {
      if (reduced) return;
      GLFX.emit({ x, y, c: c || "#ff4d6d", kind: 5, s0: 56, s1: 86, rot: -0.72, dur: 0.32, a: 1.0, drag: 0 });
      GLFX.emit({ x, y, c: "#ffffff", kind: 5, s0: 44, s1: 74, rot: 0.72, dur: 0.28, delay: 0.04, a: 0.95, drag: 0 });
      FX.sparks(x, y, c || "#ff8aa5", 16, 250);
    };

    FX.blade = function (x, y, c, R0, ang) {
      if (reduced) return;
      const rot = ang == null ? rnd(-0.6, 0.6) : ang;
      const sz = Math.max(60, (R0 || 70) * 1.1);
      GLFX.emit({ x, y, c: c || "#7fe8ff", kind: 5, s0: sz * 0.75, s1: sz * 1.2, rot, dur: 0.34, a: 1.0, drag: 0 });
      FX.sparks(x, y, c || "#ffffff", 12, 220);
    };

    FX.vortex = function (x, y, c, n) {
      if (reduced) return;
      const cnt = Math.round((n || 22) * 1.45);
      GLFX.ring(x, y, c, 72, 0.56, 0.8);
      for (let i = 0; i < cnt; i++) {
        const a = rnd(0, 6.283), rad = rnd(42, 80);
        const sx = x + Math.cos(a) * rad, sy = y + Math.sin(a) * rad * 0.75;
        GLFX.emit({
          x: sx, y: sy,
          vx: (x - sx) * 2.4 - Math.sin(a) * 92,
          vy: (y - sy) * 2.4 + Math.cos(a) * 92,
          drag: 0.8,
          c: i % 3 === 0 ? "#ffffff" : c,
          kind: 1,
          stretch: 0.034,
          s0: rnd(6, 10.5),
          s1: 2,
          dur: rnd(0.44, 0.76),
          a: 0.92
        });
      }
    };

    FX.pillar = function (x, y, c, w, h) {
      if (reduced) return;
      const H0 = Math.max(130, h || 205);
      const W0 = Math.max(36, w || 48);
      GLFX.emit({
        x, y: y - H0 * 0.42,
        c, kind: 0,
        s0: W0 * 0.8, s1: W0 * 1.32, sy: H0 / W0,
        dur: 0.65, a: 0.82, rot: 0
      });
      GLFX.ring(x, y, c, W0 * 1.6, 0.48, 0.9, 0.38);
      FX.rise(x, y, c, 18);
    };

    FX.dust = function (x, y, c) {
      if (reduced) return;
      for (let i = 0; i < 15; i++) {
        const dir = i % 2 ? 1 : -1;
        GLFX.emit({
          x: x + dir * rnd(4, 22),
          y: y + rnd(-3, 5),
          vx: dir * rnd(55, 170),
          vy: rnd(-50, -10),
          gy: 130,
          drag: 2.5,
          c: c || "#dce8ff",
          kind: 0,
          s0: rnd(6, 11.5),
          s1: 2,
          dur: rnd(0.32, 0.56),
          a: 0.74
        });
      }
    };

    FX.holo = function (x, y, c, n) {
      if (reduced) return;
      const cnt = Math.min(36, Math.max(18, n || 28));
      const pal = [c || "#3fe0ff", "#ffd65a", "#ff5ae0", "#3dffb4", "#ffffff"];
      for (let i = 0; i < cnt; i++) {
        const a = rnd(0, 6.283), v = rnd(90, 360);
        GLFX.emit({
          x: x + rnd(-8, 8),
          y: y + rnd(-8, 8),
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          gy: 75,
          drag: 1.8,
          c: pal[i % pal.length],
          kind: i % 2 ? 3 : 4,
          s0: rnd(6.5, 13),
          s1: 2,
          vrot: rnd(-6, 6),
          dur: rnd(0.46, 0.92),
          delay: rnd(0, 0.08),
          a: 0.92
        });
      }
    };

    FX.sigil = function (x, y, c, r, n, flat, dur) {
      _sigil2d(x, y, c, r, n, flat, dur);
      GLFX.ring(x, y, c, Math.max(46, (r || 46) * 1.16), dur || 0.68, 0.62, flat ? 0.42 : 1);
    };

    FX.miasma = function (x, y) {
      FX.vortex(x, y, "#b84dff", 10);
    };

    FX.puff = function (x, y, c) {
      FX.dust(x, y, c);
    };

    FX.shake = function (n) {
      GLFX.impulseShake(n || 4.5);
    };

    FX.flash = function (c, o) {
      gpuFlash(c || "#ffffff", o || 0.22);
    };

    FX.impact = function (x, y, k) {
      if (reduced) return 0;
      const p = Math.max(0.6, k || 1);
      gpuFlash("#ffffff", Math.min(0.3, 0.1 + 0.065 * p));
      GLFX.impulseShake(3.0 + 3.0 * p);
      FX.wave(x, y, "#ffffff", 50 + 22 * p);
      FX.sparks(x, y, "#ffe9a8", Math.round(12 + 8 * p), 240 + 55 * p);
      return 150 + 75 * p;
    };
  }

  /* ==================== 6. HOẠT ẢNH CHUYỂN ĐỘNG THẺ BÀI MƯỢT 60FPS (CƯỚP THẺ, CƯỚP CHIÊU, DỜI, HUỶ, VỀ TAY) ==================== */

  /* 6.1. Chống chồng chéo phản ứng giật thẻ (recoil10 & lean10 mượt một nhịp duy nhất) */
  if (typeof recoil10 === "function") {
    recoil10 = function (el, from, to) {
      if (reduced || !el || !from || !to) return;
      const dx = to.x - from.x, dy = to.y - from.y;
      const L = Math.hypot(dx, dy) || 1;
      const ux = (dx / L) * 11, uy = (dy / L) * 11;
      const rot = dx >= 0 ? 4.5 : -4.5;
      smoothAnim(el, [
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: `translate3d(${ux.toFixed(1)}px, ${uy.toFixed(1)}px, 0) rotate(${rot}deg) scale(0.94)`, offset: 0.26 },
        { transform: `translate3d(${(-ux * 0.28).toFixed(1)}px, ${(-uy * 0.28).toFixed(1)}px, 0) rotate(${(-rot * 0.35).toFixed(1)}deg) scale(1.02)`, offset: 0.64 },
        { transform: "translate3d(0,0,0) scale(1)" }
      ], { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    };
  }

  if (typeof lean10 === "function") {
    lean10 = function (el, sp, tp) {
      if (reduced || !el || !sp || !tp) return;
      const dx = tp.x - sp.x, dy = tp.y - sp.y;
      const L = Math.hypot(dx, dy) || 1;
      const ux = (dx / L) * 9, uy = (dy / L) * 9;
      const rot = dx >= 0 ? 7 : -7;
      smoothAnim(el, [
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: `translate3d(${(-ux * 0.35).toFixed(1)}px, ${(-uy * 0.35 + 3).toFixed(1)}px, 0) scale(0.96)`, offset: 0.18 },
        { transform: `perspective(620px) translate3d(${ux.toFixed(1)}px, ${(uy - 6).toFixed(1)}px, 24px) rotate(${rot}deg) scale(1.16)`, offset: 0.48 },
        { transform: "translate3d(0,0,0) scale(1)" }
      ], { duration: 540, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    };
  }

  /* 6.2. Hoạt ảnh CƯỚP THẺ / ĐỔI PHE (swap) & DỜI / ĐẨY / KÉO (move) 3D Bezier siêu mượt */
  function playCardStealSwap(r0, r1, actorGhost, realTargetEl, srcPtObj, srcEl, toSide, cardName) {
    const isMineNow = toSide === "p";
    const mainCol = isMineNow ? "#3fe0ff" : "#ff4d7d";
    const subCol = isMineNow ? "#ffd65a" : "#c45cff";
    let startDelay = 0;

    /* Bước 1: Thẻ nguồn tung xích năng lượng WebGL khoá chặt con mồi */
    if (srcPtObj) {
      if (srcEl) {
        smoothAnim(srcEl, [
          { transform: "perspective(650px) translate3d(0,0,0) scale(1)" },
          { transform: "perspective(650px) translate3d(0,-10px,34px) scale(1.18)", offset: 0.36 },
          { transform: "perspective(650px) translate3d(0,-4px,16px) scale(1.08)", offset: 0.72 },
          { transform: "perspective(650px) translate3d(0,0,0) scale(1)" }
        ], { duration: 640 });
      }
      FX.glow(srcPtObj.x, srcPtObj.y, subCol, 68, 0.48);
      GLFX.tether(srcPtObj.x, srcPtObj.y, r0.x, r0.y, mainCol, 11, 0.24, 0.44);
      GLFX.tether(srcPtObj.x, srcPtObj.y, r0.x, r0.y, subCol, 7, -0.22, 0.44);
      GLFX.arc(srcPtObj.x, srcPtObj.y, r0.x, r0.y, "#ffffff", 7, 0.85, true, 0.32);
      SFX.play("e_hon");
      startDelay = 160;
    }

    /* Vòng xoáy khoá mục tiêu tại vị trí cũ */
    fxT(() => {
      FX.vortex(r0.x, r0.y, subCol, 18);
      FX.ring(r0.x, r0.y, mainCol, Math.max(48, (r0.w || 54) * 0.95), 3);
    }, Math.max(0, startDelay - 40));

    /* Bước 2: Thẻ thật bay vòng cung chữ S 3D lật 360 độ mượt mà sang sân mới */
    const flightDur = 760;
    fxT(() => {
      if (!actorGhost) {
        if (realTargetEl) hide9(realTargetEl, 0);
        return;
      }
      actorGhost.classList.add("gpu-steal-actor");
      actorGhost.style.setProperty("--steal-c", mainCol);
      actorGhost.style.zIndex = "34";

      const dx = r1.x - r0.x;
      const dy = r1.y - r0.y;
      const curveDir = (dx >= 0 ? 1 : -1) * Math.max(42, Math.min(84, Math.hypot(dx, dy) * 0.34));
      const arcData = build3DArcFrames({
        steps: 34,
        dx,
        dy,
        curve: curveDir,
        lift: -34,
        s0: 1.0,
        sMid: 1.28,
        s1: 1.0,
        rotY0: 0,
        rotY1: 360,
        bank: dx >= 0 ? 12 : -12,
        pitch: 15,
        zLift: 70,
        persp: 760
      });

      streamBezierRibbon(r0.x, r0.y, arcData.p1, arcData.p2, arcData.p3, flightDur, mainCol, subCol, 2);
      if (srcPtObj) {
        fxT(() => GLFX.tether(srcPtObj.x, srcPtObj.y, (r0.x + r1.x) * 0.5 + curveDir * 0.5, (r0.y + r1.y) * 0.5 - 24, mainCol, 8, 0.14, 0.28), flightDur * 0.32);
      }
      SFX.play("whoosh");

      const animRef = actorGhost.animate(arcData.frames, {
        duration: flightDur,
        easing: "linear",
        fill: "both"
      });

      let finished = false;
      const onDone = () => {
        if (finished) return;
        finished = true;
        if (actorGhost.isConnected) actorGhost.remove();
        if (realTargetEl) {
          hide9(realTargetEl, 0);
          smoothAnim(realTargetEl, [
            { transform: "perspective(650px) translate3d(0, 4px, 0) scale(0.9)" },
            { transform: "perspective(650px) translate3d(0, -3px, 14px) scale(1.07)", offset: 0.48 },
            { transform: "perspective(650px) translate3d(0, 0, 0) scale(1)" }
          ], { duration: 340 });
        }
        FX.wave(r1.x, r1.y, mainCol, 86);
        FX.sparks(r1.x, r1.y, subCol, 22, 250);
        FX.dust(r1.x, r1.y + (r1.h || 70) * 0.42, "#dff6ff");
        GLFX.impulseShake(5.8, dx, dy);
        SFX.play("place");
        SFX.play("chime");

        const label = cardName
          ? (isMineNow ? `CƯỚP THẺ ▸ ${cardName.toUpperCase()} VỀ PHE TA!` : `${cardName.toUpperCase()} ▸ ĐỔI SANG PHE ĐỐI THỦ`)
          : (isMineNow ? "CƯỚP THẺ ▸ ĐỔI SANG PHE TA" : "ĐỔI PHE ▸ SANG SÂN ĐỐI THỦ");
        pushOppNotif(label, mainCol);
      };

      animRef.onfinish = onDone;
      fxT(onDone, flightDur + 120);
    }, startDelay);

    return startDelay + flightDur;
  }

  if (typeof mvDur9 === "function") {
    mvDur9 = (s) => (s.k === "swap" ? (s.sp ? 1280 : 1080) : (s.sp ? 1260 : 880));
  }

  if (typeof move10 === "function") {
    move10 = function (s) {
      const r0 = s.r0, r1 = s.tp, h = s.hid, ph = s.ph;
      if (!r0 || !r1) {
        if (h) hide9(h, 0);
        if (ph) ph.remove();
        return;
      }
      const sel = mcEl9(s.src);
      const dstInst = anyC(s.dst);
      const dstName = dstInst && C[dstInst.id] ? C[dstInst.id].n : "";

      /* Trường hợp 1: CƯỚP THẺ / ĐỔI PHE (swap) */
      if (s.k === "swap") {
        s.ph = null;
        s.hid = null;
        playCardStealSwap(r0, r1, ph, h, s.sp, sel, s.side, dstName);
        return;
      }

      /* Trường hợp 2: ĐẨY (push) / KÉO (pull) / TỰ DỜI (move) mượt bằng đường cong Bezier 3D */
      let pull = false;
      if (s.sp && sel) {
        const ls = laneOf8(s.sp), l0 = laneOf8(r0), l1 = laneOf8(r1);
        pull = ls >= 0 && l0 >= 0 && l1 >= 0 && Math.abs(l1 - ls) < Math.abs(l0 - ls);
      }

      let launchDelay = 0;
      const col = col10(s) || "#6fe8ff";

      if (s.sp && sel && pull) {
        /* KÉO THẺ: Phóng dây tơ/từ trường năng lượng WebGL móc vào mục tiêu rồi kéo mượt sang */
        lean10(sel, s.sp, r0);
        GLFX.tether(s.sp.x, s.sp.y, r0.x, r0.y, col, 10, 0.18, 0.45);
        GLFX.arc(s.sp.x, s.sp.y, r0.x, r0.y, "#ffffff", 6, 0.7, false, 0.3);
        FX.sparks(r0.x, r0.y, col, 14, 190);
        SFX.play("whoosh");
        launchDelay = 190;
      } else if (s.sp && sel && !pull) {
        /* ĐẨY THẺ: Thẻ nguồn lướt cong tới tung chấn động hất văng mục tiêu */
        const gSrc = ghostOf9(s.sp, s.src);
        hide9(sel, 1);
        gSrc.style.zIndex = "33";
        const sdx = (r0.x - s.sp.x) * 0.68, sdy = (r0.y - s.sp.y) * 0.68;
        const pounce = build3DArcFrames({ steps: 20, dx: sdx, dy: sdy, lift: -22, s0: 1, sMid: 1.2, s1: 1.08, bank: sdx >= 0 ? 9 : -9, zLift: 36 });
        const a1 = gSrc.animate(pounce.frames, { duration: 240, easing: "linear", fill: "forwards" });
        a1.onfinish = () => {
          FX.wave((s.sp.x + r0.x) * 0.5, (s.sp.y + r0.y) * 0.5, col, 68);
          GLFX.impulseShake(4.2, r1.x - r0.x, r1.y - r0.y);
          SFX.play("e_dat");
          const ret = build3DArcFrames({ steps: 18, dx: -sdx, dy: -sdy, lift: -14, s0: 1.08, sMid: 1.02, s1: 1 });
          const a2 = gSrc.animate(ret.frames.map((f) => ({
            offset: f.offset,
            opacity: 1,
            transform: `translate3d(${(sdx + parseFloat(f.transform.split("translate3d(")[1])).toFixed(1)}px, ${(sdy + parseFloat(f.transform.split(",")[1])).toFixed(1)}px, 0) scale(1)`
          })), { duration: 230, easing: "linear", fill: "forwards" });
          const cleanSrc = () => { gSrc.remove(); hide9(sel, 0); };
          a2.onfinish = cleanSrc;
          fxT(cleanSrc, 280);
        };
        fxT(() => { gSrc.remove(); hide9(sel, 0); }, 560);
        launchDelay = 220;
      }

      fxT(() => {
        if (!ph) {
          if (h) hide9(h, 0);
          return;
        }
        ph.style.zIndex = "32";
        const dx = r1.x - r0.x, dy = r1.y - r0.y;
        const flightDur = pull || s.push ? 520 : 580;
        const arcData = build3DArcFrames({
          steps: 30,
          dx,
          dy,
          curve: (dy >= 0 ? 1 : -1) * Math.min(34, Math.hypot(dx, dy) * 0.14),
          lift: pull || s.push ? -26 : -48,
          s0: 1,
          sMid: 1.18,
          s1: 1,
          bank: clamp(dx * 0.06, -12, 12),
          pitch: 10,
          zLift: 44,
          overshoot: !!(pull || s.push)
        });

        streamBezierRibbon(r0.x, r0.y, arcData.p1, arcData.p2, arcData.p3, flightDur, col, "#ffffff", 1);
        if (pull && s.sp) GLFX.tether(s.sp.x, s.sp.y, r1.x, r1.y, col, 7, -0.14, 0.34);
        SFX.play("whoosh");

        const animRef = ph.animate(arcData.frames, { duration: flightDur, easing: "linear", fill: "both" });
        let done = false;
        const fin = () => {
          if (done) return;
          done = true;
          if (ph.isConnected) ph.remove();
          s.ph = null;
          if (h) {
            hide9(h, 0);
            s.hid = null;
            smoothAnim(h, [
              { transform: "translate3d(0, 3px, 0) scale(0.92)" },
              { transform: "translate3d(0, -2px, 0) scale(1.05)", offset: 0.5 },
              { transform: "translate3d(0, 0, 0) scale(1)" }
            ], { duration: 300 });
          }
          FX.dust(r1.x, r1.y + (r1.h || 70) * 0.42, "#d8f0ff");
          FX.ring(r1.x, r1.y, col, 52, 2.5);
          SFX.play("place");
          if (pull) pushOppNotif((dstName ? dstName.toUpperCase() + " ▸ " : "") + "BỊ KÉO SANG CHIẾN ĐỊA", "#e8c79a");
          else if (s.push) pushOppNotif((dstName ? dstName.toUpperCase() + " ▸ " : "") + "BỊ ĐẨY SANG CHIẾN ĐỊA", "#b6ffe8");
        };
        animRef.onfinish = fin;
        fxT(fin, flightDur + 120);
      }, launchDelay);
    };
  }

  /* 6.3. Hoạt ảnh CƯỚP KỸ NĂNG (steal), SAO CHÉP (copy), TIÊU HUỶ (kill) & KHOÁ KỸ NĂNG (sil) mượt 60FPS */
  function spawnSoulSiphonOrb(fromPt, toPt, badgeId, col, durMs, onArrive) {
    if (reduced || !fromPt || !toPt) {
      if (onArrive) onArrive();
      return;
    }
    const orb = document.createElement("div");
    orb.className = "gpu-soul-orb";
    orb.style.left = fromPt.x + "px";
    orb.style.top = fromPt.y + "px";
    orb.style.setProperty("--orb-c", col);
    if (badgeId && C[badgeId] && typeof badgeHTML9 === "function") {
      orb.innerHTML = badgeHTML9(badgeId, "ak10");
    }
    document.body.appendChild(orb);

    const dx = toPt.x - fromPt.x, dy = toPt.y - fromPt.y;
    const arcData = build3DArcFrames({
      steps: 28,
      dx,
      dy,
      curve: (dx >= 0 ? -1 : 1) * Math.max(44, Math.min(90, Math.hypot(dx, dy) * 0.36)),
      lift: -36,
      s0: 0.55,
      sMid: 1.25,
      s1: 0.75,
      spinZ: 360,
      pitch: 0,
      bank: 0,
      zLift: 30
    });

    streamBezierRibbon(fromPt.x, fromPt.y, arcData.p1, arcData.p2, arcData.p3, durMs, col, "#ffffff", 2);
    const a = orb.animate(arcData.frames, { duration: durMs, easing: "linear", fill: "both" });
    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      orb.remove();
      if (onArrive) onArrive();
    };
    a.onfinish = fin;
    fxT(fin, durMs + 100);
  }

  if (typeof lunge10 === "function") {
    lunge10 = function (s, el, sp, tp, L0) {
      const g = ghostOf9(sp, s.src);
      hide9(el, 1);
      s.hidSrc = el;
      g.style.zIndex = "33";
      const isStealOrCopy = s.k === "steal" || s.k === "copy";
      const col = isStealOrCopy ? (s.k === "copy" ? "#3fe0ff" : "#d46bff") : (col10(s) || "#ff4d6d");
      g.classList.add("gpu-steal-actor");
      g.style.setProperty("--steal-c", col);

      const dx = tp.x - sp.x, dy = tp.y - sp.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const stopRatio = clamp(1 - ((tp.w || 52) * 0.58) / dist, 0.42, 0.86);
      const lx = dx * stopRatio, ly = dy * stopRatio;

      const flyDur = T8.FLY;
      const holdDur = isStealOrCopy ? 180 : 120;
      const backDur = isStealOrCopy ? T8.BACK : 340;

      /* Nhịp 1: Lấy đà mềm & vồ theo đường cong Bezier 3D tới sát mục tiêu */
      fxT(() => {
        const outArc = build3DArcFrames({
          steps: 26,
          dx: lx,
          dy: ly,
          curve: (dx >= 0 ? 1 : -1) * Math.min(48, dist * 0.2),
          lift: -32,
          s0: 1.0,
          sMid: 1.26,
          s1: 1.2,
          bank: dx >= 0 ? 11 : -11,
          pitch: 14,
          zLift: 52
        });
        streamBezierRibbon(sp.x, sp.y, outArc.p1, outArc.p2, outArc.p3, flyDur, col, "#ffffff", 2);
        const aOut = g.animate(outArc.frames, { duration: flyDur, easing: "linear", fill: "forwards" });

        aOut.onfinish = () => {
          const tgt = s.ph || tEl8(s.dst);
          recoil10(tgt, sp, tp);
          if (s.k === "kill" || s.k === "sil") {
            hitObj10(pickObj10(s), tp, col, s.k === "sil" ? 720 : 540, sp);
          } else if (isStealOrCopy) {
            FX.slash(tp.x, tp.y, col);
            GLFX.tether(tp.x, tp.y, sp.x + lx, sp.y + ly, col, 10, 0.18, 0.34);
            if (s.tb && s.k === "steal") {
              s.tb.remove();
              s.tb = null;
            }
          }

          /* Nhịp 2: Hút Linh Cầu Kỹ Năng xoắn ốc về thẻ nguồn trong lúc thẻ nguồn bật lùi mượt về ô */
          fxT(() => {
            const id = s.abId || ((anyC(s.dst) || {}).id);
            if (isStealOrCopy) {
              spawnSoulSiphonOrb(tp, sp, id, col, backDur + 60, () => {
                if (el && el.isConnected) {
                  const cur = ctr(el);
                  FX.wave(cur.x, cur.y, col, 74);
                  FX.holo(cur.x, cur.y, col, 28);
                  smoothAnim(el, [
                    { transform: "perspective(650px) scale(0.94)" },
                    { transform: "perspective(650px) translate3d(0,-5px,22px) scale(1.18)", offset: 0.45 },
                    { transform: "perspective(650px) scale(1)" }
                  ], { duration: 420 });
                  const nm = id && C[id] ? C[id].n : "";
                  pushOppNotif((s.k === "steal" ? "CƯỚP KỸ NĂNG" : "SAO CHÉP KỸ NĂNG") + (nm ? `: ${nm}` : ""), col);
                  SFX.play(s.k === "steal" ? "dark" : "e_hon");
                }
              });
            }

            /* Đường cong lộn về mượt mà từ (lx, ly) về (0, 0) */
            const backFrames = [];
            const NB = 22;
            const p0 = { x: lx, y: ly };
            const p1 = { x: lx * 0.65, y: ly * 0.65 - 26 };
            const p2 = { x: lx * 0.2, y: ly * 0.2 - 14 };
            const p3 = { x: 0, y: 0 };
            for (let i = 0; i <= NB; i++) {
              const t = i / NB;
              const u = easeQuintInOut(t);
              const pt = bezierPt(p0, p1, p2, p3, u);
              const sc = 1.2 - 0.2 * u;
              const rz = (dx >= 0 ? -6 : 6) * Math.sin(t * Math.PI);
              backFrames.push({
                offset: t,
                transform: `perspective(700px) translate3d(${pt.x.toFixed(2)}px, ${pt.y.toFixed(2)}px, ${Math.round((1 - u) * 32)}px) rotateZ(${rz.toFixed(2)}deg) scale(${sc.toFixed(3)})`
              });
            }
            const aBack = g.animate(backFrames, { duration: backDur, easing: "linear", fill: "forwards" });
            const finishAll = () => {
              if (g.isConnected) g.remove();
              hide9(el, 0);
              s.hidSrc = null;
            };
            aBack.onfinish = finishAll;
            fxT(finishAll, backDur + 100);
          }, holdDur);
        };
      }, L0);

      fxT(() => {
        if (g.isConnected) g.remove();
        if (s.hidSrc) {
          hide9(el, 0);
          s.hidSrc = null;
        }
      }, L0 + flyDur + holdDur + backDur + 260);
    };
  }

  /* 6.4. Hoạt ảnh CƯỚP THẺ TỪ BỘ BÀI / TAY ĐỐI THỦ (Chú Cuội, Nam Tước Mặt Nạ, Bạch Tuộc Tinh...) */
  function playDeckOrHandSteal(st, idx) {
    if (reduced) return;
    const delay = idx * 180;
    fxT(() => {
      const fromEl = st.fromSide === "a" ? ($id("avFoe") || $id("oppSub")) : ($id("meSub") || $id("avMe"));
      const toEl = st.toZone === "board"
        ? document.querySelector(`#board [data-mc="${st.uid}"]`)
        : (st.toSide === "p" ? (document.querySelector(`#hand [data-hc="${st.uid}"]`) || $id("hand")) : ($id("avFoe") || $id("oppSub")));
      if (!fromEl || !toEl) return;

      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();
      const startPt = { x: fr.left + fr.width / 2, y: fr.top + fr.height / 2 };
      const endPt = { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 };
      const w = clamp(tr.width || 62, 52, 86);
      const h = Math.round(w * 1.4);

      const srcEl = st.src ? document.querySelector(`#board [data-mc="${st.src}"]`) : null;
      if (srcEl) {
        const sr = srcEl.getBoundingClientRect();
        const sx = sr.left + sr.width / 2, sy = sr.top + sr.height / 2;
        GLFX.tether(sx, sy, startPt.x, startPt.y, "#ffd65a", 9, 0.2, 0.42);
        GLFX.arc(sx, sy, startPt.x, startPt.y, "#c45cff", 7, 0.9, true, 0.32);
      }

      const isToMe = st.toSide === "p";
      const col = isToMe ? "#ffd65a" : "#ff4d7d";
      if (toEl.hasAttribute && (toEl.hasAttribute("data-hc") || toEl.hasAttribute("data-mc"))) {
        toEl.style.opacity = "0";
      }

      const actor = document.createElement("div");
      actor.className = "gpu-card3d";
      actor.style.cssText = `left:${(startPt.x - w / 2).toFixed(1)}px;top:${(startPt.y - h / 2).toFixed(1)}px;width:${w}px;height:${h}px;--steal-c:${col}`;
      const backStyle = (typeof BACKS !== "undefined" && typeof foeBack !== "undefined" && BACKS[foeBack]) ? BACKS[foeBack][1] : "linear-gradient(135deg,#2b195c,#0d0826)";
      const frontHtml = isToMe || st.toZone === "board"
        ? ((toEl.hasAttribute && (toEl.hasAttribute("data-hc") || toEl.hasAttribute("data-mc"))) ? cleanCloneHTML(toEl) : liteId(st.id))
        : BACK7();

      actor.innerHTML = `<div class="c3d-face c3d-front">${frontHtml}</div><div class="c3d-face c3d-back" style="background:${backStyle}"></div>`;
      document.body.appendChild(actor);

      FX.vortex(startPt.x, startPt.y, "#c45cff", 16);
      SFX.play("whoosh");

      const dur = 760;
      const dx = endPt.x - startPt.x, dy = endPt.y - startPt.y;
      const arcData = build3DArcFrames({
        steps: 34,
        dx,
        dy,
        curve: (dx >= 0 ? 1 : -1) * 64,
        lift: -42,
        s0: 0.65,
        sMid: 1.24,
        s1: 1.0,
        rotY0: 180,
        rotY1: 0,
        bank: clamp(dx * 0.05, -14, 14),
        pitch: 14,
        zLift: 60,
        persp: 760
      });

      streamBezierRibbon(startPt.x, startPt.y, arcData.p1, arcData.p2, arcData.p3, dur, col, "#c45cff", 2);
      const animRef = actor.animate(arcData.frames, { duration: dur, easing: "linear", fill: "both" });

      let done = false;
      const fin = () => {
        if (done) return;
        done = true;
        actor.remove();
        if (toEl && toEl.style) {
          toEl.style.opacity = "";
          smoothAnim(toEl, [
            { transform: "scale(0.88)" },
            { transform: "scale(1.1) translateY(-6px)", offset: 0.45 },
            { transform: "scale(1)" }
          ], { duration: 340 });
        }
        FX.holo(endPt.x, endPt.y, col, 30);
        FX.wave(endPt.x, endPt.y, col, 72);
        SFX.play("chime");
        const nm = st.id && C[st.id] ? C[st.id].n : "1 thẻ";
        pushOppNotif(isToMe ? `CƯỚP THẺ ĐỐI THỦ ▸ ${nm.toUpperCase()}` : `BỊ CƯỚP THẺ ▸ ${nm.toUpperCase()}`, col);
      };
      animRef.onfinish = fin;
      fxT(fin, dur + 120);
    }, delay);
  }

  if (typeof fx7 === "function") {
    const _fx7Orig = fx7;
    fx7 = function (evs, R0, P0) {
      _fx7Orig(evs, R0, P0);
      if (reduced || !evs || !evs.x7 || !Array.isArray(evs.x7.stolen)) return;
      evs.x7.stolen.slice(0, 4).forEach((st, idx) => playDeckOrHandSteal(st, idx));
    };
  }

  /* 6.5. Nâng cấp CFX (Tiêu huỷ mảnh vỡ 3D, Về tay, Rút bài, Triệu hồi, Biến hình, Buff/Debuff mượt + v16) */
  if (typeof CFX === "object" && CFX) {
    CFX.destroy = function (r) {
      if (reduced || !r || !r.html) return;
      if (typeof holdFx === "function") holdFx(800);
      if (typeof window.playV16 === "function") window.playV16("tieu_diet", r.x, r.y, Math.max(112, (r.w || 54) * 2.05), 560, 140);
      const g0 = ghost(r, r.html, "g9");
      g0.insertAdjacentHTML(
        "beforeend",
        `<svg class="ck9" viewBox="0 0 40 56" preserveAspectRatio="none"><path d="M20 3L16 17L25 25L14 39L22 53M16 17L5 22M25 25L36 30M14 39L4 45" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" filter="drop-shadow(0 0 4px #ff4d6d)"/></svg>`
      );
      g0.animate([
        { transform: "perspective(600px) scale(1)" },
        { transform: "perspective(600px) translate3d(-3px, -2px, 18px) rotate(-2.5deg) scale(1.06)", offset: 0.45 },
        { transform: "perspective(600px) translate3d(3px, -4px, 26px) rotate(2deg) scale(1.1)" }
      ], { duration: 170, easing: "ease-out", fill: "forwards" });

      fxT(() => {
        g0.remove();
        FX.slash(r.x, r.y, "#ff4d6d");
        FX.wave(r.x, r.y, "#ff6a2b", 92);
        FX.shards(r.x, r.y, "#ff4d6d");
        FX.sparks(r.x, r.y, "#ffd27a", 26, 290);
        GLFX.impulseShake(7.2);

        const polys = [
          ["polygon(0 0, 56% 0, 42% 36%, 0 44%)", -1.1, -1.0],
          ["polygon(56% 0, 100% 0, 100% 42%, 42% 36%)", 1.1, -0.95],
          ["polygon(0 44%, 42% 36%, 58% 66%, 0 74%)", -1.25, -0.15],
          ["polygon(42% 36%, 100% 42%, 100% 72%, 58% 66%)", 1.25, -0.1],
          ["polygon(0 74%, 58% 66%, 46% 100%, 0 100%)", -0.9, 0.85],
          ["polygon(58% 66%, 100% 72%, 100% 100%, 46% 100%)", 0.95, 0.9]
        ];

        polys.forEach(([cp, vx, vy]) => {
          const piece = ghost(r, r.html, "g9");
          piece.style.clipPath = cp;
          const endX = vx * rnd(34, 62);
          const peakY = vy * 24 - rnd(18, 38);
          const endY = peakY + rnd(68, 110);
          const rx = rnd(-140, 140), ry = rnd(-160, 160), rz = vx * rnd(32, 68);
          const frames = [];
          const S = 20;
          for (let i = 0; i <= S; i++) {
            const t = i / S;
            const px = endX * t;
            const py = peakY * (4 * t * (1 - t)) + endY * t * t;
            const sc = 1 - 0.32 * t;
            const op = t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35;
            frames.push({
              offset: t,
              opacity: op,
              transform: `perspective(600px) translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, ${(t * 40).toFixed(0)}px) rotateX(${(rx * t).toFixed(1)}deg) rotateY(${(ry * t).toFixed(1)}deg) rotateZ(${(rz * t).toFixed(1)}deg) scale(${sc.toFixed(2)})`
            });
          }
          const pa = piece.animate(frames, { duration: 620, easing: "linear", fill: "forwards" });
          pa.onfinish = () => piece.remove();
          fxT(() => piece.remove(), 750);
        });
      }, 170);
    };

    CFX.fromBoard = function (el, r) {
      if (reduced || !el || !r) return;
      if (typeof holdFx === "function") holdFx(580);
      const b = el.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const dx = r.x - cx, dy = r.y - cy;
      const s0 = clamp(r.w / Math.max(1, b.width), 0.45, 1.3);
      const arcData = build3DArcFrames({
        steps: 26,
        dx: -dx,
        dy: -dy,
        lift: -52,
        s0,
        sMid: 1.14,
        s1: 1,
        bank: dx >= 0 ? -10 : 10,
        zLift: 40
      });
      const shifted = arcData.frames.map((f) => ({
        offset: f.offset,
        opacity: 1,
        transform: f.transform.replace(
          /translate3d\(([^,]+)px,\s*([^,]+)px,/,
          (_, x, y) => `translate3d(${(dx + parseFloat(x)).toFixed(2)}px, ${(dy + parseFloat(y)).toFixed(2)}px,`
        )
      }));
      smoothAnim(el, shifted, { duration: 560, easing: "linear" });
      streamBezierRibbon(r.x, r.y, arcData.p1, arcData.p2, arcData.p3, 560, "#9ff2ff", "#ffffff", 1);
      fxT(() => FX.wave(cx, cy, "#9ff2ff", 54), 500);
    };

    CFX.drawIn = function (el, cr, k) {
      if (reduced || !el) return;
      const b = el.getBoundingClientRect();
      const col = cr ? "#ffd65a" : "#7fe8ff";
      const delay = (k || 0) * 95;
      if (typeof holdFx === "function") holdFx(480 + delay);
      if (b.width > 0 && typeof window.playV16 === "function") {
        window.playV16("rut_bai", b.left + b.width / 2, b.top + b.height / 2, Math.max(92, b.width * 1.75), 460, delay);
      }
      smoothAnim(el, [
        { opacity: 0, transform: "perspective(650px) translate3d(130px, 34px, 40px) rotateY(-65deg) rotateZ(22deg) scale(0.48)" },
        { opacity: 1, transform: "perspective(650px) translate3d(-8px, -24px, 28px) rotateY(8deg) rotateZ(-4deg) scale(1.12)", offset: 0.62 },
        { opacity: 1, transform: "perspective(650px) translate3d(0, 0, 0) rotateY(0deg) rotateZ(0deg) scale(1)" }
      ], { duration: 460, delay, fill: "backwards" });
      fxT(() => {
        FX.glow(b.left + b.width / 2, b.top + b.height / 2, col, 62);
        FX.sparks(b.left + b.width / 2, b.top + b.height / 2, col, cr ? 18 : 10, 210);
      }, 330 + delay);
    };

    CFX.summon = function (el, c) {
      if (reduced || !el) return;
      const col = c || "#7dffb0";
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (typeof holdFx === "function") holdFx(580);
      if (r.width > 0 && typeof window.playV16 === "function") {
        window.playV16("tao_the", cx, cy, Math.max(106, r.width * 1.95), 520, 0);
      }
      portal(el, col);
      /* Vòng cổng triệu hồi tranh vẽ xoay mở rộng dưới chân thẻ */
      const gate = document.createElement("div");
      gate.className = "gpu-summon-gate";
      gate.style.cssText = `left:${cx}px;top:${cy}px;width:${Math.max(96, r.width * 2.1)}px;height:${Math.max(96, r.width * 2.1)}px;--gc:${col}`;
      const g16 = typeof window.v16Html === "function" ? window.v16Html("cong", 540, 0, 15) : "";
      gate.innerHTML = g16 || `<img src="img/v/v_cong.webp?v=gpu19" alt="">`;
      document.body.appendChild(gate);
      if (typeof window.v16Activate === "function") window.v16Activate(gate);
      gate.animate([
        { transform: "translate(-50%,-50%) scale(0.25) rotate(-90deg)", opacity: 0 },
        { transform: "translate(-50%,-50%) scale(1.12) rotate(35deg)", opacity: 0.95, offset: 0.35 },
        { transform: "translate(-50%,-50%) scale(1.05) rotate(130deg)", opacity: 0.85, offset: 0.72 },
        { transform: "translate(-50%,-50%) scale(1.35) rotate(220deg)", opacity: 0 }
      ], { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => gate.remove();
      fxT(() => gate.remove(), 600);

      smoothAnim(el, [
        { opacity: 0, transform: "perspective(650px) translate3d(0, 34px, -45px) rotateX(42deg) scale(0.28)" },
        { opacity: 1, transform: "perspective(650px) translate3d(0, -14px, 38px) rotateX(-10deg) scale(1.24)", offset: 0.56 },
        { opacity: 1, transform: "perspective(650px) translate3d(0, 2px, 0) scale(0.97)", offset: 0.84 },
        { opacity: 1, transform: "perspective(650px) translate3d(0, 0, 0) scale(1)" }
      ], { duration: 420 });
    };

    CFX.morph = function (el) {
      if (reduced || !el) return;
      if (typeof holdFx === "function") holdFx(580);
      const r = el.getBoundingClientRect();
      if (r.width > 0 && typeof window.playV16 === "function") {
        window.playV16("bien_hinh", r.left + r.width / 2, r.top + r.height / 2, Math.max(104, r.width * 1.9), 520, 0);
      }
      FX.holo(r.left + r.width / 2, r.top + r.height / 2, "#d46bff", 26);
      smoothAnim(el, [
        { transform: "perspective(620px) rotateY(0deg) scale(1)" },
        { transform: "perspective(620px) translate3d(0, -8px, 30px) rotateY(90deg) scale(1.18)", offset: 0.45 },
        { transform: "perspective(620px) translate3d(0, -4px, 14px) rotateY(190deg) scale(1.1)", offset: 0.72 },
        { transform: "perspective(620px) rotateY(360deg) scale(1)" }
      ], { duration: 560 });
    };

    CFX.buff = function (el, d) {
      if (reduced || !el) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && typeof window.playV16 === "function") {
        window.playV16("tang_suc", r.left + r.width / 2, r.top + r.height / 2, Math.max(96, r.width * 1.85), 500, 0);
      }
      if (typeof holdFx === "function") holdFx(520);
      smoothAnim(el, [
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: "perspective(600px) translate3d(0,-7px,22px) scale(1.16)", offset: 0.38 },
        { transform: "translate3d(0,0,0) scale(1)" }
      ], { duration: 500 });
      const pwh = el.querySelector(".pwh");
      if (pwh) {
        smoothAnim(pwh, [
          { transform: "scale(1)" },
          { transform: "scale(1.85) rotate(-8deg)", offset: 0.38 },
          { transform: "scale(1)" }
        ], { duration: 480 });
      }
    };

    CFX.debuff = function (el) {
      if (reduced || !el) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && typeof window.playV16 === "function") {
        window.playV16("giam_suc", r.left + r.width / 2, r.top + r.height / 2, Math.max(96, r.width * 1.85), 500, 0);
      }
      if (typeof holdFx === "function") holdFx(520);
      smoothAnim(el, [
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: "translate3d(-5px, 2px, 0) rotate(-3deg) scale(0.94)", offset: 0.24 },
        { transform: "translate3d(5px, 1px, 0) rotate(3deg) scale(0.96)", offset: 0.52 },
        { transform: "translate3d(0,0,0) scale(1)" }
      ], { duration: 500 });
    };
  }

  /* 6.6. Đuôi hạt GPU & Quỹ đạo mượt cho đòn phóng kỹ năng (fly8 & hit8 & ult) */
  if (typeof fly8 === "function" && GLFX.ok) {
    const _fly8Orig = fly8;
    fly8 = function (a, b, type, c, dur, dl, cb, html) {
      _fly8Orig(a, b, type, c, dur, dl, cb, html);
      if (reduced || !a || !b) return;
      const D = dur || 460;
      const startDelay = dl || 0;
      fxT(() => {
        const dx = b.x - a.x, dy = b.y - a.y;
        const lift = -Math.min(60, Math.hypot(dx, dy) * 0.24);
        streamBezierRibbon(
          a.x, a.y,
          { x: dx * 0.3, y: dy * 0.3 + lift },
          { x: dx * 0.7, y: dy * 0.7 + lift * 0.8 },
          { x: dx, y: dy },
          D, c || "#7fe8ff", "#ffffff", 2
        );
      }, startDelay);
    };
  }

  if (typeof hit8 === "function" && GLFX.ok) {
    const _hit8Orig = hit8;
    hit8 = function (s) {
      _hit8Orig(s);
      if (reduced || !s || !s.tp) return;
      const tp = s.tp, sp = s.sp;
      const dx = sp ? tp.x - sp.x : 0, dy = sp ? tp.y - sp.y : 1;
      if (s.k === "kill") {
        FX.slash(tp.x, tp.y, "#ff4d6d");
        FX.wave(tp.x, tp.y, "#ff5a36", 92);
        GLFX.impulseShake(7.8, dx, dy);
        gpuFlash("#ff4d6d", 0.2);
      } else if (s.k === "up" || s.k === "lplus") {
        FX.ring(tp.x, tp.y, "#3dffb4", 68);
        FX.rise(tp.x, tp.y + 12, "#7dffb0", 16);
        GLFX.impulseShake(2.4, 0, -1);
      } else if (s.k === "down" || s.k === "lminus") {
        FX.sparks(tp.x, tp.y, "#ff4d7d", 18, 230);
        FX.ring(tp.x, tp.y, "#ff4d7d", 64);
        if (sp) GLFX.arc(sp.x, sp.y, tp.x, tp.y, "#ff5a8a", 8, 0.85, false, 0.22);
        GLFX.impulseShake(3.8, dx, dy);
      } else if (s.k === "sil" || s.k === "steal" || s.k === "copy") {
        const col = s.k === "copy" ? "#3fe0ff" : "#c45cff";
        if (sp) GLFX.arc(sp.x, sp.y, tp.x, tp.y, col, 10, 1.1, true, 0.28);
        FX.vortex(tp.x, tp.y, col, 16);
        GLFX.impulseShake(4.2, dx, dy);
      } else if (s.k === "summon") {
        FX.pillar(tp.x, tp.y + 20, "#7dffb0", 42, 145);
        GLFX.impulseShake(3.2, 0, 1);
      }
    };
  }

  if (typeof ult === "function" && GLFX.ok) {
    const _ultOrig = ult;
    ult = function (inst) {
      syncOppCourtMetrics();
      _ultOrig(inst);
      if (reduced || !inst) return;
      const d = C[inst.id];
      const col = (d && HC[d.h]) || "#ffd65a";
      const cx = window.innerWidth / 2, cy = window.innerHeight * 0.26;
      FX.rays(cx, cy, col, 200);
      FX.wave(cx, cy, col, 220);
      FX.holo(cx, cy, col, 58);
      FX.bolts(cx, cy, col, 8, 130);
      gpuFlash(col, 0.3, 380);
      GLFX.impulseShake(9);
    };
  }

  if (typeof ultS4 === "function" && GLFX.ok) {
    const _ultS4Orig = ultS4;
    ultS4 = function (inst) {
      syncOppCourtMetrics();
      _ultS4Orig(inst);
      if (reduced || !inst) return;
      const d = C[inst.id];
      const col = (d && HC[d.h]) || "#ff7ae6";
      const cx = window.innerWidth / 2, cy = window.innerHeight * 0.25;
      FX.rays(cx, cy, col, 130);
      FX.wave(cx, cy, col, 155);
      FX.sparks(cx, cy, col, 18, 220);
      gpuFlash(col, 0.14, 260);
      GLFX.impulseShake(5.5);
    };
  }

  /* 6.7. Đặt Bài Siêu Nhanh (148ms), Rút Lại Về Tay (155ms), Đối Thủ Úp Bài & Mở Chiến Địa 3D Kiểu Marvel Snap */
  let knownQueued = new Set();
  let lastStagePrompt = "";

  function animateFastCardPlace(mc, origin, col) {
    if (!mc || reduced) return;
    const rect = mc.getBoundingClientRect();
    const tx = rect.left + rect.width / 2;
    const ty = rect.top + rect.height / 2;
    const tw = Math.max(44, rect.width);
    const th = Math.max(62, rect.height);
    const sx = origin ? origin.x : tx;
    const sy = origin ? origin.y : ty + 90;
    const sw = origin ? Math.max(44, origin.w) : tw * 1.18;
    const sh = origin ? Math.max(62, origin.h) : th * 1.18;
    const dx = tx - sx, dy = ty - sy;
    const dur = origin && origin.fromDrag ? 110 : 130;
    window._placeLockUntil = Math.max(window._placeLockUntil || 0, performance.now() + (dur + 45) * (typeof SPD !== "undefined" ? SPD : 1));

    mc.classList.add("gpu-fly-wait");
    mc.classList.remove("land");

    const flyer = ghost({ x: sx, y: sy, w: sw, h: sh }, cleanCloneHTML(mc), "g9");
    flyer.style.zIndex = "35";
    const endScaleX = tw / sw;
    const endScaleY = th / sh;
    const midLift = origin && origin.fromDrag ? -8 : -22;
    const tiltZ = clamp(dx * 0.035, -7, 7);

    /* Tia rút năng lượng từ Quả cầu #orb lên ô vừa đặt */
    const orbEl = $id("orb");
    if (orbEl && GLFX.ok) {
      const or = orbEl.getBoundingClientRect();
      const ox = or.left + or.width / 2, oy = or.top + or.height / 2;
      GLFX.tether(ox, oy, tx, ty, "#3fe0ff", 7, 0.14, 0.24);
      if (typeof pulse === "function") {
        pulse("#orb", [{ transform: "scale(0.88)", filter: "brightness(1.8)" }, { transform: "scale(1)", filter: "brightness(1)" }], 190);
      }
    }

    if (GLFX.ok && Math.hypot(dx, dy) > 18) {
      streamBezierRibbon(
        sx, sy,
        { x: dx * 0.35, y: dy * 0.35 + midLift },
        { x: dx * 0.75, y: dy * 0.75 + midLift * 0.4 },
        { x: dx, y: dy },
        dur, col || "#3fe0ff", "#ffffff", 1
      );
    }

    const animRef = flyer.animate([
      { transform: "perspective(650px) translate3d(0px, 0px, 24px) scale(1.06) rotateZ(0deg)", opacity: 0.96 },
      { transform: `perspective(650px) translate3d(${(dx * 0.58).toFixed(1)}px, ${(dy * 0.58 + midLift).toFixed(1)}px, 34px) scale(${((1 + endScaleX) * 0.54).toFixed(3)}) rotateZ(${tiltZ.toFixed(1)}deg)`, opacity: 1, offset: 0.52 },
      { transform: `perspective(650px) translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0px) scale(${endScaleX.toFixed(3)}, ${endScaleY.toFixed(3)}) rotateZ(0deg)`, opacity: 1 }
    ], { duration: dur, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" });

    let landed = false;
    const finishPlace = () => {
      if (landed) return;
      landed = true;
      if (flyer.isConnected) flyer.remove();
      if (mc.isConnected) {
        mc.classList.remove("gpu-fly-wait");
        mc.classList.remove("gpu-slam");
        void mc.offsetWidth;
        mc.classList.add("gpu-slam");
      }
      FX.wave(tx, ty, col || "#3fe0ff", 68);
      FX.dust(tx, ty + th * 0.42, "#d8f3ff");
      FX.sparks(tx, ty, col || "#3fe0ff", 14, 195);
      GLFX.impulseShake(3.6, 0, 1);
    };
    animRef.onfinish = finishPlace;
    setTimeout(finishPlace, dur + 35);
  }

  function animateFastCardUnplay(origin) {
    if (!origin || reduced) return;
    const hc = document.querySelector(`#hand [data-hc="${origin.uid}"]`);
    const handHost = $id("hand");
    const tgtEl = hc || handHost;
    if (!tgtEl) return;
    const tr = tgtEl.getBoundingClientRect();
    const tx = tr.left + tr.width / 2;
    const ty = tr.top + tr.height / 2;
    const sx = origin.x, sy = origin.y;
    const sw = Math.max(44, origin.w || 52), sh = Math.max(62, origin.h || 72);
    const tw = hc ? Math.max(48, tr.width) : sw * 1.15;
    const th = hc ? Math.max(66, tr.height) : sh * 1.15;
    const dx = tx - sx, dy = ty - sy;
    const dur = 155;
    window._placeLockUntil = Math.max(window._placeLockUntil || 0, performance.now() + (dur + 45) * (typeof SPD !== "undefined" ? SPD : 1));

    if (hc) hc.style.opacity = "0";

    /* Trả năng lượng ngược về Quả cầu #orb */
    const orbEl = $id("orb");
    if (orbEl && GLFX.ok) {
      const or = orbEl.getBoundingClientRect();
      GLFX.tether(sx, sy, or.left + or.width / 2, or.top + or.height / 2, "#7fe8ff", 6, 0.14, 0.24);
      if (typeof pulse === "function") {
        pulse("#orb", [{ transform: "scale(1.22)", filter: "brightness(1.9)" }, { transform: "scale(1)", filter: "brightness(1)" }], 210);
      }
    }

    const tempWrap = document.createElement("div");
    tempWrap.innerHTML = origin.html || "";
    const rawNode = tempWrap.firstElementChild;
    const cleanHtml = rawNode ? cleanCloneHTML(rawNode) : (origin.html || "");
    const flyer = ghost({ x: sx, y: sy, w: sw, h: sh }, cleanHtml, "g9");
    flyer.style.zIndex = "35";
    const scX = tw / sw, scY = th / sh;

    const animRef = flyer.animate([
      { transform: "perspective(620px) translate3d(0px, 0px, 18px) scale(1)", opacity: 1 },
      { transform: `perspective(620px) translate3d(${(dx * 0.55).toFixed(1)}px, ${(dy * 0.55 - 24).toFixed(1)}px, 28px) scale(${((1 + scX) * 0.55).toFixed(3)}) rotateZ(${(dx >= 0 ? 5 : -5)}deg)`, opacity: 1, offset: 0.5 },
      { transform: `perspective(620px) translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0px) scale(${scX.toFixed(3)}, ${scY.toFixed(3)})`, opacity: 0.96 }
    ], { duration: dur, easing: "cubic-bezier(0.2, 0.95, 0.3, 1)", fill: "forwards" });

    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      if (flyer.isConnected) flyer.remove();
      if (hc && hc.isConnected) {
        hc.style.opacity = "";
        smoothAnim(hc, [
          { transform: "translateY(-8px) scale(1.08)" },
          { transform: "translateY(0) scale(1)" }
        ], { duration: 160 });
      }
      FX.ring(tx, ty, "#7fe8ff", 44, 3);
    };
    animRef.onfinish = fin;
    setTimeout(fin, dur + 40);
  }

  window.gpuFlipDownMine = function (uids) {
    if (reduced || !G || !Array.isArray(uids) || !uids.length) return 0;
    let cnt = 0;
    uids.forEach((uid, idx) => {
      const mc = document.querySelector(`#board .side.me [data-mc="${uid}"]`);
      if (!mc) return;
      cnt++;
      const r = mc.getBoundingClientRect();
      const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
      fxT(() => {
        if (!mc.isConnected) return;
        smoothAnim(mc, [
          { transform: "perspective(580px) translate3d(0, -6px, 18px) rotateY(-95deg) scale(1.06)", filter: "brightness(1.35)" },
          { transform: "perspective(580px) translate3d(0, 1px, 0) rotateY(0deg) scale(0.97)", filter: "brightness(1)", offset: 0.78 },
          { transform: "perspective(580px) translate3d(0, 0, 0) rotateY(0deg) scale(1)", filter: "none" }
        ], { duration: 140, easing: "cubic-bezier(0.2, 0.95, 0.32, 1)" });
        FX.ring(tx, ty, "#5ee6ff", 38, 2.6);
      }, idx * 40);
    });
    const tot = cnt ? 140 + (cnt - 1) * 40 : 0;
    if (tot && typeof holdFx === "function") holdFx(tot);
    return tot;
  };

  window.gpuDropFoeStaged = function (foeHad, startDelayMs) {
    if (reduced || !G) return 0;
    const baseDelay = Math.max(0, +startDelayMs || 0);
    const av = $id("avFoe");
    const ar = av ? av.getBoundingClientRect() : { left: window.innerWidth * 0.72, top: 24, width: 48, height: 48 };
    const sx = ar.left + ar.width / 2, sy = ar.top + ar.height / 2;
    let idx = 0;
    document.querySelectorAll("#board .side.opp [data-mc]").forEach((mc) => {
      const uid = +mc.dataset.mc;
      if (foeHad && foeHad.has(uid)) return;
      const r = mc.getBoundingClientRect();
      const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
      const dx = sx - tx, dy = sy - ty;
      const delay = baseDelay + idx * 50;
      idx++;
      mc.style.opacity = "0";
      fxT(() => {
        if (!mc.isConnected) return;
        mc.style.opacity = "";
        smoothAnim(mc, [
          { transform: `perspective(620px) translate3d(${(dx * 0.38).toFixed(1)}px, ${Math.min(-28, dy * 0.38).toFixed(1)}px, 36px) scale(1.16) rotateZ(${(dx >= 0 ? 6 : -6)}deg)`, opacity: 0.45 },
          { transform: "perspective(620px) translate3d(0, 1.5px, 0) scale(0.96)", opacity: 1, offset: 0.74 },
          { transform: "perspective(620px) translate3d(0, 0, 0) scale(1)", opacity: 1 }
        ], { duration: 160, easing: "cubic-bezier(0.18, 0.95, 0.32, 1)" });
        fxT(() => {
          FX.dust(tx, ty + r.height * 0.4, "#ffd8d0");
          FX.ring(tx, ty, "#ff7a5a", 42, 2.8);
          GLFX.impulseShake(2.2, 0, 1);
        }, 110);
      }, delay);
    });
    const foeDur = idx ? 160 + (idx - 1) * 50 : 0;
    if (foeDur && typeof holdFx === "function") holdFx(baseDelay + foeDur);
    return foeDur;
  };

  /* ==================== HỆ THỐNG VFX CHIẾN ĐỊA ĐỘNG & HIỆU ỨNG TRỰC QUAN TRÊN 2 PHẦN SÂN ==================== */
  const LOC_FIELD_MAP = {};
  const LOC_FIELD_META = {
    shield:      { col: "#6ef3ff", k16: "khien",    img: "img/v/v_khien.webp?v=gpu19",    sig: "img/v/v_an_khien.webp?v=gpu19", tag: "Khiên Bất Diệt" },
    poison:      { col: "#62ff8e", k16: "no_doc",   img: "img/v/v_no_doc.webp?v=gpu19",   sig: "img/v/v_an_xich.webp?v=gpu19",  tag: "Chướng Khí Độc" },
    frost:       { col: "#9eeeff", k16: "no_bang",  img: "img/v/v_no_bang.webp?v=gpu19",  sig: "img/v/v_khung_nuoc.webp?v=gpu19", tag: "Băng Sương Hàn" },
    lava_kill:   { col: "#ff5436", k16: "so",       img: "img/v/v_so.webp?v=gpu19",       sig: "img/v/v_lua.webp?v=gpu19",      tag: "Hoả Ngục Huỷ" },
    lock_chain:  { col: "#ffd269", k16: "xich",     img: "img/v/v_xich.webp?v=gpu19",     sig: "img/v/v_an_khoa.webp?v=gpu19",  tag: "Xiềng Phong Ấn" },
    forge:       { col: "#ff9a3c", k16: "bua",      img: "img/v/v_bua_ren.webp?v=gpu19",  sig: "img/v/v_lua.webp?v=gpu19",      tag: "Lửa Rèn Thần" },
    double_drum: { col: "#ffe066", k16: "trong",    img: "img/v/v_trong.webp?v=gpu19",    sig: "img/v/v_an_vong.webp?v=gpu19",  tag: "Cộng Hưởng ×2" },
    wind_move:   { col: "#74ffdf", k16: "gio",      img: "img/v/v_gio.webp?v=gpu19",      sig: "img/v/v_an_vong.webp?v=gpu19",  tag: "Gió Dịch Chuyển" },
    summon_gate: { col: "#95ff75", k16: "cong",     img: "img/v/v_cong.webp?v=gpu19",     sig: "img/v/v_an_vong.webp?v=gpu19",  tag: "Cổng Triệu Hồi" },
    mirror_clone:{ col: "#86d8ff", k16: "guong",    img: "img/v/v_guong.webp?v=gpu19",    sig: "img/v/v_an_mat.webp?v=gpu19",   tag: "Gương Nhân Bản" },
    energy_gem:  { col: "#4fd8ff", k16: "ngoc",     img: "img/v/v_ngoc.webp?v=gpu19",     sig: "img/v/v_an_ngoc.webp?v=gpu19",  tag: "Mạch Tinh Thể" },
    blessing:    { col: "#ffd96a", k16: "sao_tang", img: "img/v/v_sao_tang.webp?v=gpu19", sig: "img/v/v_an_co.webp?v=gpu19",    tag: "Linh Khí Hộ Trì" },
    cosmic_rule: { col: "#cf88ff", k16: "bua_chu",  img: "img/v/v_bua_chu.webp?v=gpu19",  sig: "img/v/v_an_vong.webp?v=gpu19",  tag: "Kỳ Giới Biến Luật" }
  };

  function classifyLocField(id) {
    if (!id || id === "meadow") return "";
    if (LOC_FIELD_MAP[id]) return LOC_FIELD_MAP[id];
    const def = typeof LOC !== "undefined" ? LOC[id] : null;
    if (!def) return "";
    const tx = ((def.n || "") + " " + (def.x || "")).toLowerCase();
    let kind = "";
    if (id === "bamboo" || /không thể bị tiêu huỷ|không bị tiêu huỷ|miễn nhiễm/.test(tx)) kind = "shield";
    else if (/tuyết|băng|mẫu sơn|sa pa|phan xi păng|lạnh/.test(tx)) kind = "frost";
    else if (/(−|-\s?\d)\s*sức mạnh|giảm\s+\d+\s*sức mạnh|trừ\s+\d+/.test(tx) || /^(amphu|bachdang|badennui|muine|tokien|hangtoi|kinhthanhhue|dongrom)$/.test(id)) kind = "poison";
    else if (/tiêu huỷ|bãi tha ma|mộ|vực/.test(tx)) kind = "lava_kill";
    else if (/không đặt được|không thể đặt|chỉ thẻ|chỉ đặt|mới đặt được|cấm|tắt kỹ năng|mất kỹ năng|không chạy ở đây|chỉ chứa tối đa/.test(tx)) kind = "lock_chain";
    else if (/lò rèn|lò thần|rèn/.test(tx)) kind = "forge";
    else if (/chạy 2 lần|gấp đôi|nhân đôi/.test(tx)) kind = "double_drum";
    else if (/di chuyển|dời|thổi|bến đò|đồi gió|trạm dịch|cầu treo/.test(tx)) kind = "wind_move";
    else if (/triệu hồi|đặt 1 thẻ|có thêm 1|gọi|sinh ra/.test(tx)) kind = "summon_gate";
    else if (/bản sao|sao chép|hồ gương|hoán đổi|đổi tay|rút\s+\d+|thêm .* vào tay/.test(tx)) kind = "mirror_clone";
    else if (/năng lượng|tốn ít hơn|tốn nhiều hơn/.test(tx)) kind = "energy_gem";
    else if (/\+\s*\d+\s*sức mạnh|tăng .* sức mạnh/.test(tx)) kind = "blessing";
    else kind = "cosmic_rule";
    LOC_FIELD_MAP[id] = kind;
    return kind;
  }

  let bfxHost = null;
  const bfxBoxes = [];
  let bfxRaf = 0;

  function buildBfxInner(kind) {
    const m = LOC_FIELD_META[kind];
    if (!m) return "";
    return `
      <i class="bfx-aura"></i>
      <i class="bfx-rim"></i>
      <span class="bfx-plume p1"></span>
      <span class="bfx-plume p2"></span>
      <span class="bfx-plume p3"></span>
      <span class="bfx-plume p4"></span>
      <img class="bfx-sig" src="${m.sig}" alt="" decoding="async">
      <img class="bfx-crest" src="${m.img}" alt="" decoding="async">
    `;
  }

  function ensureBoardFieldHost() {
    if (bfxHost && bfxHost.isConnected) return bfxHost;
    bfxHost = document.createElement("div");
    bfxHost.id = "boardFieldVfx";
    bfxHost.setAttribute("aria-hidden", "true");
    bfxBoxes.length = 0;
    for (let li = 0; li < 3; li++) {
      for (const sd of ["opp", "me"]) {
        const box = document.createElement("div");
        box.className = `bfx-box bfx-${sd}`;
        box.dataset.lane = String(li);
        box.dataset.sd = sd;
        box.dataset.kind = "";
        bfxHost.appendChild(box);
        bfxBoxes.push(box);
      }
    }
    const app = $id("app") || document.body;
    app.appendChild(bfxHost);
    return bfxHost;
  }

  function syncBoardFieldVfxNow() {
    bfxRaf = 0;
    const host = ensureBoardFieldHost();
    const lobbyOn = $id("lobby") && $id("lobby").classList.contains("on");
    if (reduced || lobbyOn || !G || !G.locs) {
      host.style.display = "none";
      window._gpuLaneRects = null;
      return;
    }
    host.style.display = "block";
    const lrs = [null, null, null];
    for (let li = 0; li < 3; li++) {
      const L = G.locs[li];
      const kind = L && L.rvl && !L.gone ? classifyLocField(L.id) : "";
      const ln = document.querySelector(`#board [data-lane="${li}"]`);
      if (ln) {
        ln.dataset.lfx = kind || "";
        lrs[li] = ln.getBoundingClientRect();
      }
      for (let si = 0; si < 2; si++) {
        const sd = si === 0 ? "opp" : "me";
        const box = bfxBoxes[li * 2 + si];
        if (!box) continue;
        const sideEl = ln ? ln.querySelector(`.side.${sd}`) : null;
        if (!kind || !sideEl) {
          box.style.display = "none";
          if (box.dataset.kind !== "") {
            box.dataset.kind = "";
            box.className = `bfx-box bfx-${sd}`;
            box.innerHTML = "";
          }
          continue;
        }
        const meta = LOC_FIELD_META[kind];
        if (box.dataset.kind !== kind) {
          box.dataset.kind = kind;
          box.className = `bfx-box bfx-${sd} k-${kind}`;
          box.style.setProperty("--fc", meta.col);
          box.innerHTML = buildBfxInner(kind);
        }
        const r = sideEl.getBoundingClientRect();
        if (r.width < 10 || r.height < 10) {
          box.style.display = "none";
          continue;
        }
        box.style.display = "block";
        box.style.left = (r.left - 2).toFixed(1) + "px";
        box.style.top = (r.top - 2).toFixed(1) + "px";
        box.style.width = (r.width + 4).toFixed(1) + "px";
        box.style.height = (r.height + 4).toFixed(1) + "px";
      }
    }
    window._gpuLaneRects = lrs;
    if (GLFX.wake) GLFX.wake();
  }

  function syncBoardFieldVfx() {
    if (!bfxRaf) bfxRaf = requestAnimationFrame(syncBoardFieldVfxNow);
  }
  window.syncBoardFieldVfx = syncBoardFieldVfx;
  window.classifyLocField = classifyLocField;
  window.addEventListener("resize", syncBoardFieldVfx, { passive: true });

  /* Mở Chiến Địa 3D Chậm Rãi & Hoành Tráng (Phong Ấn Cổ Ngữ -> Lật 3D -> Lan Hào Quang Sang 2 Phần Sân) */
  if (typeof locReveal === "function") {
    const _locRevOrig = locReveal;
    locReveal = function (li) {
      if (reduced || !G || !G.locs[li]) return;
      const ln = document.querySelector(`#board [data-lane="${li}"]`);
      const lw = ln && ln.querySelector(".locw");
      if (!lw) return;
      const L = G.locs[li];
      const def = typeof LOC !== "undefined" ? LOC[L.id] : null;
      const kind = classifyLocField(L.id);
      const fMeta = kind ? LOC_FIELD_META[kind] : null;
      const th = (typeof LTH !== "undefined" && LTH[L.id]) || "thieng";
      const col = (fMeta && fMeta.col) || (typeof LTC !== "undefined" && LTC[th]) || (typeof LHUE !== "undefined" && LHUE[L.id]) || "#40d8ff";
      const lr = lw.getBoundingClientRect();
      const cx = lr.left + lr.width / 2, cy = lr.top + lr.height / 2;
      const hw = lr.width * 0.5, hh = lr.height * 0.45;

      if (typeof holdFx === "function") holdFx(940);
      SFX.play("loc");
      lw.classList.remove("gpu-loc-rev");
      void lw.offsetWidth;
      lw.classList.add("gpu-loc-rev");
      fxT(() => lw.classList.remove("gpu-loc-rev"), 920);

      /* Vòng ấn cổ ngữ xoay mở phong ấn Chiến Địa (900ms chuẩn xác) */
      const seal = document.createElement("div");
      seal.className = "gpu-loc-seal";
      seal.style.cssText = `left:${cx}px;top:${cy}px;width:${Math.max(126, lr.width * 1.42)}px;height:${Math.max(126, lr.width * 1.42)}px;--lc:${col}`;
      const ic16 = typeof window.v16Html === "function" ? window.v16Html((fMeta && fMeta.k16) || "bua_chu", 840, 0, 15, "ls-icon") : "";
      seal.innerHTML = `<img class="ls-ring" src="img/v/v_an_vong.webp?v=gpu19" alt="">` + (ic16 || `<img class="ls-icon" src="${(fMeta && fMeta.img) || "img/v/v_bua_chu.webp?v=gpu19"}" alt="">`);
      document.body.appendChild(seal);
      if (typeof window.v16Activate === "function") window.v16Activate(seal);
      seal.animate([
        { transform: "translate(-50%,-50%) scale(0.32) rotate(-80deg)", opacity: 0 },
        { transform: "translate(-50%,-50%) scale(1.16) rotate(12deg)", opacity: 1, offset: 0.32 },
        { transform: "translate(-50%,-50%) scale(1.06) rotate(68deg)", opacity: 0.92, offset: 0.72 },
        { transform: "translate(-50%,-50%) scale(1.38) rotate(125deg)", opacity: 0 }
      ], { duration: 900, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => seal.remove();
      fxT(() => seal.remove(), 940);

      /* Viền tia điện bát giác + Sóng lan toả lên cả 2 phần sân của 2 người chơi */
      if (GLFX.ok) {
        const pts = [
          [cx - hw * 0.82, cy - hh],
          [cx + hw * 0.82, cy - hh],
          [cx + hw, cy - hh * 0.68],
          [cx + hw, cy + hh * 0.68],
          [cx + hw * 0.82, cy + hh],
          [cx - hw * 0.82, cy + hh],
          [cx - hw, cy + hh * 0.68],
          [cx - hw, cy - hh * 0.68]
        ];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          GLFX.arc(a[0], a[1], b[0], b[1], col, 6, 0.85, false, 0.55);
        }
        const oppSide = ln.querySelector(".side.opp");
        const meSide = ln.querySelector(".side.me");
        fxT(() => {
          [oppSide, meSide].forEach((sEl) => {
            if (!sEl) return;
            const sr = sEl.getBoundingClientRect();
            const sx = sr.left + sr.width / 2, sy = sr.top + sr.height / 2;
            GLFX.tether(cx, cy, sx, sy, col, 9, 0.16, 0.52);
            FX.wave(sx, sy, col, Math.max(75, sr.width * 0.65));
            FX.sparks(sx, sy, col, 14, 180);
          });
          syncBoardFieldVfx();
        }, 360);
      }

      _locRevOrig(li);
      FX.rays(cx, cy, col, 138, 12);
      FX.wave(cx, cy, col, 132);
      FX.sparks(cx, cy, col, 28, 260);
      GLFX.impulseShake(5.0, 0, 1);
      syncBoardFieldVfx();
      if (def && def.n) {
        pushOppNotif(`${def.n} ▸ Lộ diện`, col, { dur: 1450, force: true });
      }
    };
    window.gpuLocReveal = locReveal;
  }

  function syncSlamAndHud(prevSet) {
    syncOppCourtMetrics();
    if (!G) return;

    /* Phản hồi gợi ý ngắn gọn lên sân đối thủ khi đang chọn dời thẻ hoặc bước lật bài */
    if (typeof moveSel !== "undefined" && moveSel && G.phase === "play") {
      const mvCard = E.find(G, moveSel);
      const pTxt = mvCard ? `DỜI ${C[mvCard.inst.id].n.toUpperCase()} ▸ Chạm chiến địa muốn chuyển tới` : "";
      if (pTxt && pTxt !== lastStagePrompt) {
        lastStagePrompt = pTxt;
        pushOppNotif(pTxt, "#3fe0ff", { dur: 2000 });
      }
    } else if (G.msg && /^Hai bên đã đặt bài/.test(G.msg) && lastStagePrompt !== "REVEAL") {
      lastStagePrompt = "REVEAL";
      pushOppNotif("HAI BÊN ĐÃ ĐẶT BÀI ▸ LẬT THẺ!", "#ffd65a", { dur: 1150 });
    } else if (G.phase === "play" && (!moveSel)) {
      lastStagePrompt = "";
    }

    /* Hoạt ảnh rút lại thẻ về tay tức thì (155ms) */
    const unp = window._lastUnplayOrigin;
    if (unp && performance.now() - unp.ts < 800) {
      window._lastUnplayOrigin = null;
      animateFastCardUnplay(unp);
    }

    if (!G.q || !Array.isArray(G.q.p)) return;
    const curSet = new Set(G.q.p.filter((a) => a.t === "play").map((a) => a.uid));
    for (const uid of curSet) {
      if (!prevSet.has(uid)) {
        const mc = document.querySelector(`#board [data-mc="${uid}"]`);
        if (mc && !reduced) {
          const hcInst = E.find(G, uid);
          const col = (hcInst && C[hcInst.inst.id] && HC[C[hcInst.inst.id].h]) || "#3fe0ff";
          const po = window._lastPlayOrigin;
          const validOrigin = po && po.uid === uid && (performance.now() - po.ts < 800) ? po : null;
          if (validOrigin) window._lastPlayOrigin = null;
          animateFastCardPlace(mc, validOrigin, col);
        }
      }
    }
    knownQueued = curSet;
  }

  if (typeof render === "function") {
    try {
      if (G && G.q && Array.isArray(G.q.p)) {
        knownQueued = new Set(G.q.p.filter((a) => a.t === "play").map((a) => a.uid));
      }
    } catch (e) {}
    const _renderOrig = render;
    render = function () {
      const prev = knownQueued;
      _renderOrig.apply(this, arguments);
      try { syncSlamAndHud(prev); } catch (e) {}
    };
    if (window.UI) window.UI.render = render;
  }

  /* ==================== 7. TƯƠNG TÁC HOLOGRAPHIC 3D & ĐƯỜNG NGẮM NĂNG LƯỢNG KHI KÉO THẢ ==================== */
  let hovCard = null;
  function clearHov() {
    if (!hovCard) return;
    hovCard.classList.remove("gpu-hov");
    hovCard.style.removeProperty("--tilt-x");
    hovCard.style.removeProperty("--tilt-y");
    hovCard = null;
  }

  const arcSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arcSvg.id = "dragArcSvg";
  arcSvg.setAttribute("aria-hidden", "true");
  arcSvg.innerHTML = `
    <path class="arc-glow" d=""/>
    <path class="arc-core" d=""/>
    <circle class="arc-reticle" cx="-100" cy="-100" r="22" opacity="0"/>
  `;
  document.body.appendChild(arcSvg);
  const arcGlow = arcSvg.querySelector(".arc-glow");
  const arcCore = arcSvg.querySelector(".arc-core");
  const arcRet = arcSvg.querySelector(".arc-reticle");

  /* gpu21: bỏ đường ngắm nét đứt; thay bằng "ô đáp": ô sẽ nhận thẻ sáng lên kèm bóng mờ của chính thẻ đang kéo */
  arcSvg.style.display = "none";
  let landSlot = null;
  function clearLand() {
    if (!landSlot) return;
    landSlot.classList.remove("land");
    const g = landSlot.querySelector(".land-ghost");
    if (g) g.remove();
    landSlot = null;
  }
  function setLand(slot, srcEl) {
    if (slot === landSlot) return;
    clearLand();
    if (!slot) return;
    landSlot = slot;
    slot.classList.add("land");
    const face = srcEl && (srcEl.querySelector(".hc") || srcEl);
    if (face) {
      const g = document.createElement("div");
      g.className = "land-ghost";
      g.setAttribute("aria-hidden", "true");
      const cl = face.cloneNode(true);
      cl.removeAttribute("id");
      cl.classList.remove("dsrc", "gpu-hov", "sel");
      g.appendChild(cl);
      slot.appendChild(g);
    }
  }
  function hideDragArc() {
    clearLand();
  }

  let dragTrailTick = 0;
  document.addEventListener("pointermove", (ev) => {
    if (reduced) return;

    if (typeof drag !== "undefined" && drag && drag.on && drag.el) {
      clearHov();
      const hovLane = document.querySelector(".lane.dhov");
      if (hovLane) {
        const side = hovLane.querySelector(hovLane.classList.contains("okx") ? ".side.opp" : ".side.me") || hovLane;
        const slot = Array.from(side.querySelectorAll(".slot")).find((x) => !x.querySelector(".mc"));
        setLand(slot || null, drag.el);
      } else {
        clearLand();
      }

      if (drag.g) {
        const hcIn = drag.g.querySelector(".hc");
        if (hcIn) {
          hcIn.style.setProperty("--mx", (50 + (drag.ry || 0) * 1.4).toFixed(1) + "%");
          hcIn.style.setProperty("--my", (50 - (drag.rx || 0) * 1.4).toFixed(1) + "%");
        }
      }

      if ((++dragTrailTick & 1) === 0 && GLFX.ok) {
        GLFX.emit({
          x: ev.clientX + rnd(-15, 15),
          y: ev.clientY + rnd(-15, 15),
          vx: rnd(-26, 26),
          vy: rnd(10, 44),
          c: hovLane ? "#3dffb4" : "#3fe0ff",
          kind: 3,
          s0: rnd(5, 9),
          s1: 1,
          dur: 0.35,
          a: 0.78
        });
      }
      return;
    }

    hideDragArc();

    const card = ev.target && ev.target.closest
      ? ev.target.closest("#zoom .gc, #cardBody .gc, #pkBody .gc, #hand .hc:not(.no), #board .mc:not(.back)")
      : null;

    if (!card) {
      clearHov();
      return;
    }
    if (hovCard && hovCard !== card) clearHov();
    hovCard = card;
    card.classList.add("gpu-hov");

    const r = card.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      const nx = clamp((ev.clientX - r.left) / r.width, 0, 1);
      const ny = clamp((ev.clientY - r.top) / r.height, 0, 1);
      const maxDeg = card.classList.contains("mc") ? 13 : 17;
      card.style.setProperty("--mx", (nx * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (ny * 100).toFixed(1) + "%");
      card.style.setProperty("--tilt-y", ((nx - 0.5) * maxDeg * 2).toFixed(2) + "deg");
      card.style.setProperty("--tilt-x", ((0.5 - ny) * maxDeg * 2).toFixed(2) + "deg");
    }
  }, { passive: true });

  document.addEventListener("pointerup", hideDragArc, { passive: true });
  document.addEventListener("pointercancel", hideDragArc, { passive: true });
  document.addEventListener("pointerleave", clearHov, { passive: true });

  /* ==================== 8. BẢNG TEST HIỆU ỨNG & ÂM THANH LUÔN HIỂN THỊ (5 NHÓM · 32 HIỆU ỨNG ĐẦY ĐỦ) ==================== */
  const VFX_LAB_TABS = [
    {
      id: "play",
      label: "⚡ Ra Bài",
      items: [
        ["fastplay", "⚡ Đặt Thẻ Nhanh", true],
        ["foedrop", "🎴 Đối Thủ Úp Bài", false],
        ["fliprev", "🔄 Lật Thẻ Mở Chiêu", true],
        ["locrev", "🏛️ Mở Chiến Địa 3D", true],
        ["unplay", "↩️ Rút Lại Về Tay", false],
        ["drawcard", "🃏 Rút Bài Đầu Lượt", false],
        ["turnbn", "🚩 Băng Hiệu Lượt", false],
        ["fuse10s", "⏱️ Đếm Ngược 10s", false]
      ]
    },
    {
      id: "interact",
      label: "🧲 Cướp/Dời",
      items: [
        ["stealcard", "🧲 Cướp Thẻ Đổi Phe", true],
        ["decksteal", "🕵️ Cướp Bộ Bài", true],
        ["stealskill", "🔮 Cướp Kỹ Năng", true],
        ["clonecard", "🪞 Nhân Bản Thẻ", false],
        ["silence", "🔇 Xoá Kỹ Năng", false],
        ["pullcard", "🪝 Kéo Thẻ Đối Thủ", false],
        ["pushcard", "💨 Đẩy Thẻ Khỏi Ô", false],
        ["morphcard", "🦋 Biến Hình 3D", false]
      ]
    },
    {
      id: "combat",
      label: "💥 Phá/Điểm",
      items: [
        ["destroyer", "☄️ Tia Huỷ Diệt Bàn", true],
        ["destroy3d", "💔 Chém Vỡ Thẻ 3D", true],
        ["summon", "🐉 Triệu Hồi Thú", false],
        ["buffpw", "💚 Cộng Điểm (+6)", false],
        ["debuffpw", "❤️‍🔥 Trừ Điểm (−4)", false],
        ["doublepw", "✨ Nhân Đôi (×2)", true]
      ]
    },
    {
      id: "elem",
      label: "🔥 Hệ/Cược",
      items: [
        ["snapcube", "🎲 Cược SNAP ×2/×8", true],
        ["locklane", "⛓️ Khoá Chiến Địa", false],
        ["shieldfx", "🛡️ Khiên Bất Tử", false],
        ["fire", "🔥 Nổ Hoả Ngục", false],
        ["thunder", "⚡ Lôi Phạt Sét", false],
        ["frost", "❄️ Băng Phong", false],
        ["ult", "🗡️ Tuyệt Kỹ S5", true]
      ]
    },
    {
      id: "audio",
      label: "🎵 Nhạc/Tốc",
      items: [
        ["bgm_b1", "🎵 Nhạc Lượt 1–3", true],
        ["bgm_b2", "🎸 Nhạc Cao Trào", false],
        ["bgm_climax", "🔥 Nhạc Lượt Cuối", true],
        ["bgm_lobby", "🌌 Nhạc Sảnh Chờ", false],
        ["bgm_toggle", "🔊 Bật/Tắt Nhạc", false],
        ["spd_fast", "⏩ Nhanh (0.78×)", false],
        ["spd_norm", "▶️ Chuẩn (1.0×)", false],
        ["spd_slow", "🐢 Chậm (1.3×)", false]
      ]
    }
  ];

  let curLabTab = "play";
  let demoLocIdx = 0;
  let demoTurnIdx = 0;
  let demoSnapIdx = 0;

  function syncLabButtonsState(isOpen) {
    const b = $id("btnVfxLab");
    if (b) b.classList.toggle("active", !!isOpen);
  }

  function renderLabTab(tabId) {
    curLabTab = tabId;
    const drawer = $id("vfxLabDrawer");
    if (!drawer) return;
    drawer.querySelectorAll(".vl-tab").forEach((t) => t.classList.toggle("on", t.dataset.vtab === tabId));
    const tabObj = VFX_LAB_TABS.find((t) => t.id === tabId) || VFX_LAB_TABS[0];
    const grid = $id("vlGrid");
    if (grid) {
      grid.innerHTML = tabObj.items
        .map(([k, lbl, feat]) => `<button type="button" class="vl-btn${feat ? " vl-feat" : ""}" data-demo="${k}">${lbl}</button>`)
        .join("");
    }
  }

  function buildVfxLab() {
    if ($id("vfxLabDrawer")) return;

    /* gpu21: bỏ nút "✨ VFX" khỏi thanh công cụ trận đấu (bảng test vẫn mở được ở sảnh và Cài đặt) */
    const toolsL = null;
    if (toolsL) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tb tb-vfx-lab";
      btn.id = "btnVfxLab";
      btn.title = "Bật/tắt bảng test hiệu ứng cố định";
      btn.textContent = "✨ VFX";
      toolsL.appendChild(btn);
      btn.addEventListener("click", toggleLab);
    }

    const lobby = $id("lobby");
    if (lobby) {
      const lbBtn = document.createElement("button");
      lbBtn.type = "button";
      lbBtn.id = "lbVfxTest";
      lbBtn.textContent = "✨ Bảng Test VFX";
      lobby.appendChild(lbBtn);
      lbBtn.addEventListener("click", toggleLab);
    }

    const setReimg = $id("setReimg");
    if (setReimg && setReimg.parentNode) {
      const sBtn = document.createElement("button");
      sBtn.type = "button";
      sBtn.className = "btn end";
      sBtn.style.cssText = "width:100%;margin-top:10px";
      sBtn.textContent = "✨ Mở Bảng Test Hiệu Ứng (Ghim Cố Định)";
      setReimg.parentNode.appendChild(sBtn);
      sBtn.addEventListener("click", () => {
        $id("ovSet").classList.remove("on");
        openLab();
      });
    }

    const drawer = document.createElement("div");
    drawer.id = "vfxLabDrawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-label", "Bảng Test Hiệu Ứng & Âm Thanh");
    drawer.innerHTML = `
      <div class="vl-hd" id="vlHeader" title="Kéo thanh tiêu đề để di chuyển bảng test">
        <b>⚡ BẢNG TEST VFX (GHIM MỞ)</b>
        <div class="vl-hd-act">
          <span class="vl-fps" id="vlFps">60 FPS</span>
          <button type="button" class="vl-min" id="vlMin" title="Thu gọn / Mở rộng">▾ Thu gọn</button>
          <button type="button" class="vl-x" id="vlClose" aria-label="Đóng bảng test" title="Đóng bảng test">✕</button>
        </div>
      </div>
      <div class="vl-tabs" id="vlTabs">
        ${VFX_LAB_TABS.map((t) => `<button type="button" class="vl-tab${t.id === curLabTab ? " on" : ""}" data-vtab="${t.id}">${t.label}</button>`).join("")}
      </div>
      <div class="vl-grid" id="vlGrid"></div>
      <div class="vl-sub">Bảng luôn giữ mở khi bấm test · Kéo tiêu đề để dời vị trí · Chỉ đóng khi bấm ✕</div>
    `;
    document.body.appendChild(drawer);
    renderLabTab(curLabTab);

    /* Chỉ đóng khi bấm ✕ (KHÔNG BAO GIỜ tự tắt khi bấm nút test!) */
    $id("vlClose").addEventListener("click", (ev) => {
      ev.stopPropagation();
      SFX.play("tap");
      drawer.classList.remove("on");
      syncLabButtonsState(false);
    });

    /* Nút Thu gọn / Mở rộng nhanh ngay trên thanh tiêu đề */
    const minBtn = $id("vlMin");
    minBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      SFX.play("tap");
      const isMin = drawer.classList.toggle("min");
      minBtn.textContent = isMin ? "▴ Mở rộng" : "▾ Thu gọn";
    });

    /* Chuyển tab danh mục test & kích hoạt demo liên tục mà KHÔNG đóng bảng */
    drawer.addEventListener("click", (ev) => {
      const tabBtn = ev.target.closest("[data-vtab]");
      if (tabBtn) {
        SFX.play("tap");
        drawer.classList.remove("min");
        minBtn.textContent = "▾ Thu gọn";
        renderLabTab(tabBtn.dataset.vtab);
        return;
      }
      const demoBtn = ev.target.closest("[data-demo]");
      if (demoBtn) {
        SFX.wake();
        demoBtn.classList.remove("vl-fired");
        void demoBtn.offsetWidth;
        demoBtn.classList.add("vl-fired");
        setTimeout(() => demoBtn.classList.remove("vl-fired"), 360);
        runDemo(demoBtn.dataset.demo);
      }
    });

    /* Cho phép kéo thả di chuyển bảng test nếu người dùng muốn đặt lên góc bất kỳ */
    let vDrag = null;
    let vlOffX = 0, vlOffY = 0;
    $id("vlHeader").addEventListener("pointerdown", (ev) => {
      if (ev.target.closest("button")) return;
      vDrag = { sx: ev.clientX, sy: ev.clientY, ox: vlOffX, oy: vlOffY, pid: ev.pointerId };
    });
    document.addEventListener("pointermove", (ev) => {
      if (!vDrag || ev.pointerId !== vDrag.pid) return;
      vlOffX = clamp(vDrag.ox + (ev.clientX - vDrag.sx), -window.innerWidth * 0.42, window.innerWidth * 0.42);
      vlOffY = clamp(vDrag.oy + (ev.clientY - vDrag.sy), -window.innerHeight * 0.68, 52);
      drawer.style.setProperty("--vlx", vlOffX.toFixed(1) + "px");
      drawer.style.setProperty("--vly", vlOffY.toFixed(1) + "px");
    }, { passive: true });
    const endVDrag = () => { vDrag = null; };
    document.addEventListener("pointerup", endVDrag, { passive: true });
    document.addEventListener("pointercancel", endVDrag, { passive: true });

    setInterval(() => {
      if (!drawer.classList.contains("on")) return;
      const el = $id("vlFps");
      const bgmTag = window.BGM && BGM.isPlaying() ? "🎵" : "🔇";
      if (el) el.textContent = `${GLFX.fps()} FPS · ${GLFX.count()} hạt · ${bgmTag}`;
    }, 350);
  }

  function openLab() {
    const d = $id("vfxLabDrawer");
    if (d) {
      d.classList.add("on");
      d.classList.remove("min");
      const minBtn = $id("vlMin");
      if (minBtn) minBtn.textContent = "▾ Thu gọn";
      syncLabButtonsState(true);
    }
  }
  function toggleLab() {
    SFX.play("tap");
    const d = $id("vfxLabDrawer");
    if (!d) return;
    const on = d.classList.toggle("on");
    if (on) {
      d.classList.remove("min");
      const minBtn = $id("vlMin");
      if (minBtn) minBtn.textContent = "▾ Thu gọn";
    }
    syncLabButtonsState(on);
  }

  function ensureInMatchForDemo(kind) {
    const lobby = $id("lobby");
    if (lobby && lobby.classList.contains("on")) {
      if (typeof newGame === "function") {
        newGame();
        lobby.classList.remove("on");
        if (window.BGM) BGM.syncGame(G);
        render();
        openLab();
        setTimeout(() => runDemo(kind), 110);
        return false;
      }
      const lbPlay = $id("lbPlay");
      if (lbPlay) {
        lbPlay.click();
        openLab();
        setTimeout(() => runDemo(kind), 820);
        return false;
      }
    }
    return true;
  }

  function sampleDemoCardHTML(id, pwDelta) {
    const pick = id && C[id] ? id : "bachho";
    const d = C[pick];
    const delta = pwDelta != null ? pwDelta : 3;
    const pw = Math.max(0, d.p + delta);
    const cls = delta > 0 ? "up" : delta < 0 ? "down" : "";
    return `<button type="button" class="mc q5" style="--hc:${HC[d.h] || "#ffd65a"}">${art(pick)}<span class="mn">${logo(pick)}</span><span class="pwh ${cls}">${pw}</span></button>`;
  }

  function getLaneSlotRect(laneIdx, side, slotIdx) {
    const ln = document.querySelector(`#board [data-lane="${laneIdx}"]`) || document.querySelector("#board [data-lane]");
    if (!ln) return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4, w: 54, h: 76, slot: null, lane: null };
    const slots = ln.querySelectorAll(`.side.${side} .slot`);
    const sl = slots[slotIdx || 0] || slots[0] || ln;
    const r = sl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: Math.max(48, r.width), h: Math.max(67, r.height), slot: sl, lane: ln };
  }

  function runDemo(kind) {
    if (reduced) {
      store.fx = "on";
      reduced = false;
      document.body.classList.remove("rm");
    }
    const cx = window.innerWidth * 0.5, cy = window.innerHeight * 0.36;

    switch (kind) {
      /* ===== NHÓM 1: RA BÀI & LƯỢT ===== */
      case "fastplay": {
        if (!ensureInMatchForDemo("fastplay")) return;
        const handEl = document.querySelector("#hand [data-hc]") || $id("hand");
        const hr = handEl ? handEl.getBoundingClientRect() : { left: cx - 32, top: window.innerHeight - 130, width: 64, height: 90 };
        const dst = getLaneSlotRect(demoLocIdx % 3, "me", 1);
        demoLocIdx++;
        const cardId = C.thanhlong ? "thanhlong" : Object.keys(C)[0];
        const col = (C[cardId] && HC[C[cardId].h]) || "#3fe0ff";
        SFX.play("place");
        const dummy = ghost({ x: dst.x, y: dst.y, w: dst.w, h: dst.h }, sampleDemoCardHTML(cardId, 2), "g9");
        dummy.style.opacity = "0";
        animateFastCardPlace(
          dummy,
          { x: hr.left + hr.width / 2, y: hr.top + hr.height / 2, w: Math.max(52, hr.width), h: Math.max(72, hr.height), fromDrag: false },
          col
        );
        pushOppNotif("ĐẶT THẺ TỨC THÌ (150MS) ▸ HÚT VÀO CHIẾN ĐỊA!", "#3fe0ff");
        setTimeout(() => { if (dummy.isConnected) dummy.remove(); }, 650);
        break;
      }

      case "foedrop": {
        if (!ensureInMatchForDemo("foedrop")) return;
        const av = $id("avFoe");
        const ar = av ? av.getBoundingClientRect() : { left: cx + 80, top: 28, width: 48, height: 48 };
        const sx = ar.left + ar.width / 2, sy = ar.top + ar.height / 2;
        SFX.play("place");
        [0, 1].forEach((k) => {
          const dst = getLaneSlotRect((demoLocIdx + k) % 3, "opp", 2);
          setTimeout(() => {
            const backHtml = typeof BACK7 === "function" ? BACK7() : sampleDemoCardHTML("haclong", 0);
            const g = ghost({ x: dst.x, y: dst.y, w: dst.w, h: dst.h }, backHtml, "g9");
            const dx = (sx - dst.x) * 0.45, dy = Math.min(-42, (sy - dst.y) * 0.42);
            g.animate([
              { transform: `perspective(620px) translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 46px) scale(1.22) rotateZ(7deg)`, opacity: 0.35 },
              { transform: "perspective(620px) translate3d(0, 2px, 0) scale(0.95)", opacity: 1, offset: 0.72 },
              { transform: "perspective(620px) translate3d(0, 0, 0) scale(1)", opacity: 1 }
            ], { duration: 185, easing: "cubic-bezier(0.18, 0.95, 0.32, 1)", fill: "forwards" });
            setTimeout(() => {
              FX.dust(dst.x, dst.y + dst.h * 0.4, "#ffd8d0");
              FX.ring(dst.x, dst.y, "#ff7a5a", 46, 3);
              GLFX.impulseShake(2.8, 0, 1);
            }, 135);
            setTimeout(() => g.remove(), 680);
          }, k * 65);
        });
        demoLocIdx++;
        pushOppNotif("ĐỐI THỦ ĐẶT THẺ ÚP ▸ CHUẨN BỊ LẬT BÀI!", "#ff8a5a");
        break;
      }

      case "fliprev": {
        if (!ensureInMatchForDemo("fliprev")) return;
        const liveCard = document.querySelector("#board [data-mc]");
        if (liveCard && typeof revealZoom === "function") {
          const uid = +liveCard.dataset.mc;
          SFX.play("flip");
          revealZoom(uid);
          const r = liveCard.getBoundingClientRect();
          setTimeout(() => {
            FX.wave(r.left + r.width / 2, r.top + r.height / 2, "#ffd65a", 92);
            FX.sparks(r.left + r.width / 2, r.top + r.height / 2, "#ffd65a", 22, 240);
            GLFX.impulseShake(4.2, 0, 1);
          }, 220);
        } else {
          const dst = getLaneSlotRect(1, "me", 0);
          const pick = C.chuque ? "chuque" : Object.keys(C)[0];
          const d = C[pick];
          const col = HC[d.h] || "#ff7a2b";
          const bk = (typeof BACKS !== "undefined" && BACKS.b0) ? BACKS.b0[1] : "linear-gradient(135deg,#2b195c,#0d0826)";
          SFX.play("flip");
          const z = document.createElement("div");
          z.className = "rvz snap-revz";
          z.style.setProperty("--c", col);
          z.innerHTML = `<div class="rvz-card"><div class="rvz-face rvz-front"><span class="gc q5" style="--hc:${col}">${art(pick)}<span class="cst">${d.c}</span><span class="pwh up">${d.p + 2}</span><span class="n">${logo(pick)}</span></span></div><div class="rvz-face rvz-back" style="background:${bk}"></div></div>`;
          document.body.appendChild(z);
          const zr = z.getBoundingClientRect();
          const zx = window.innerWidth / 2 - zr.width / 2, zy = window.innerHeight * 0.42 - zr.height / 2;
          z.style.left = zx + "px";
          z.style.top = zy + "px";
          const sx = dst.w / zr.width;
          const tx = dst.x - (zx + zr.width / 2), ty = dst.y - (zy + zr.height / 2);
          z.firstElementChild.animate(
            [{ transform: "rotateY(180deg)" }, { transform: "rotateY(0deg)", offset: 0.34 }, { transform: "rotateY(0deg)" }],
            { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
          );
          z.animate([
            { transform: `translate3d(${tx}px, ${ty}px, 0) scale(${sx})`, opacity: 0.85 },
            { transform: "translate3d(0, -6px, 40px) scale(1.08) rotate(-2.5deg)", opacity: 1, offset: 0.3 },
            { transform: "translate3d(0, 0, 30px) scale(1.02) rotate(-1.5deg)", opacity: 1, offset: 0.68 },
            { transform: `translate3d(${tx}px, ${ty}px, 0) scale(${sx})`, opacity: 0.95 }
          ], { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => {
            z.remove();
            const landed = ghost(dst, sampleDemoCardHTML(pick, 2), "g9");
            FX.wave(dst.x, dst.y, col, 96);
            FX.sparks(dst.x, dst.y, col, 24, 250);
            GLFX.impulseShake(4.5, 0, 1);
            setTimeout(() => landed.remove(), 460);
          };
        }
        pushOppNotif("LẬT THẺ 3D (480MS) ▸ BUNG KỸ NĂNG NGAY LẬP TỨC!", "#ffd65a");
        break;
      }

      case "locrev": {
        if (!ensureInMatchForDemo("locrev")) return;
        const li = demoLocIdx % 3;
        demoLocIdx++;
        if (G && G.locs[li]) {
          G.locs[li].rvl = true;
          render();
        }
        if (typeof window.gpuLocReveal === "function") window.gpuLocReveal(li);
        break;
      }

      case "unplay": {
        if (!ensureInMatchForDemo("unplay")) return;
        const src = getLaneSlotRect(1, "me", 0);
        SFX.play("unplay");
        animateFastCardUnplay({
          uid: (G && G.hand.p[0] && G.hand.p[0].uid) || -1,
          x: src.x,
          y: src.y,
          w: src.w,
          h: src.h,
          html: sampleDemoCardHTML("bachho", 0)
        });
        pushOppNotif("RÚT LẠI THẺ VỀ TAY (155MS) ▸ HOÀN NĂNG LƯỢNG!", "#7fe8ff");
        break;
      }

      case "drawcard": {
        if (!ensureInMatchForDemo("drawcard")) return;
        const hc = document.querySelector("#hand [data-hc]:last-child") || document.querySelector("#hand [data-hc]");
        SFX.play("draw");
        if (hc && CFX && CFX.drawIn) {
          CFX.drawIn(hc, true, 0);
        }
        pushOppNotif("RÚT THẺ ĐẦU LƯỢT ▸ XOÁY 3D VÀO TAY BÀI!", "#7fe8ff");
        break;
      }

      case "turnbn": {
        const labels = [
          ["LƯỢT 2/6", "Chiến địa giữa lộ diện"],
          ["LƯỢT 5/6", "Nhịp độ cao trào"],
          ["LƯỢT CUỐI!", "Tất tay quyết định thắng bại"]
        ];
        const [t, s] = labels[demoTurnIdx % labels.length];
        demoTurnIdx++;
        if (typeof banner === "function") banner(t, s);
        break;
      }

      case "fuse10s": {
        if (!ensureInMatchForDemo("fuse10s")) return;
        if (typeof tLeft !== "undefined") {
          tLeft = 10;
          tArmed = true;
          tLast = performance.now();
          tBeep = 0;
          if (typeof paintTimer === "function") paintTimer();
        }
        SFX.play("tick");
        pushOppNotif("CẢNH BÁO 10 GIÂY CUỐI ▸ DÂY CHÁY ĐỎ & TIM ĐẬP!", "#ff5a36");
        break;
      }

      /* ===== NHÓM 2: CƯỚP & DỜI ===== */
      case "stealcard": {
        if (!ensureInMatchForDemo("stealcard")) return;
        const opp = getLaneSlotRect(1, "opp", 2);
        const me = getLaneSlotRect(1, "me", 1);
        const thief = getLaneSlotRect(1, "me", 0);
        const existingOpp = opp.lane && opp.lane.querySelector(".side.opp .mc:not(.back)");
        const cardHtml = existingOpp ? cleanCloneHTML(existingOpp) : sampleDemoCardHTML("bachho", 3);
        const cardName = existingOpp ? (existingOpp.getAttribute("aria-label") || "Bạch Hổ").split(",")[0] : (C.bachho ? C.bachho.n : "Bạch Hổ");
        pushOppNotif("HỒ TINH ▸ TUNG XÍCH CƯỚP THẺ ĐỔI PHE!", "#d46bff");
        const actor = ghost(opp, cardHtml, "g9");
        playCardStealSwap(opp, me, actor, null, thief, thief.slot && thief.slot.querySelector(".mc"), "p", cardName);
        break;
      }

      case "decksteal": {
        if (!ensureInMatchForDemo("decksteal")) return;
        const pick = C.loithan ? "loithan" : Object.keys(C)[2];
        const thiefSlot = getLaneSlotRect(1, "me", 0);
        const thiefGhost = ghost(thiefSlot, sampleDemoCardHTML("chucuoi", 1), "g9");
        const avFoe = $id("avFoe");
        if (avFoe && GLFX.ok) {
          const ar = avFoe.getBoundingClientRect();
          GLFX.tether(thiefSlot.x, thiefSlot.y, ar.left + ar.width / 2, ar.top + ar.height / 2, "#ffd65a", 10, 0.2, 0.42);
        }
        playDeckOrHandSteal({
          fromSide: "a",
          toSide: "p",
          toZone: "hand",
          uid: (G && G.hand.p[0] && G.hand.p[0].uid) || -99,
          id: pick
        }, 0);
        setTimeout(() => thiefGhost.remove(), 920);
        break;
      }

      case "stealskill": {
        if (!ensureInMatchForDemo("stealskill")) return;
        const tp = getLaneSlotRect(1, "opp", 2);
        const sp = getLaneSlotRect(1, "me", 0);
        pushOppNotif("HẤP LỰC NỮ ▸ CƯỚP KỸ NĂNG ĐỐI THỦ", "#d46bff");
        const victimGhost = ghost(tp, sampleDemoCardHTML("loithan", 2), "g9");
        const thiefGhost = ghost(sp, sampleDemoCardHTML("haplucnu", 1), "g9 gpu-steal-actor");
        thiefGhost.style.setProperty("--steal-c", "#d46bff");
        thiefGhost.style.zIndex = "34";

        const dx = (tp.x - sp.x) * 0.72, dy = (tp.y - sp.y) * 0.72;
        const outArc = build3DArcFrames({ steps: 22, dx, dy, curve: 42, lift: -26, s0: 1, sMid: 1.24, s1: 1.18, bank: 10, zLift: 46 });
        streamBezierRibbon(sp.x, sp.y, outArc.p1, outArc.p2, outArc.p3, 290, "#d46bff", "#ffffff", 2);
        SFX.play("whoosh");

        thiefGhost.animate(outArc.frames, { duration: 290, easing: "linear", fill: "forwards" }).onfinish = () => {
          FX.slash(tp.x, tp.y, "#d46bff");
          FX.vortex(tp.x, tp.y, "#d46bff", 18);
          GLFX.arc(sp.x + dx, sp.y + dy, tp.x, tp.y, "#ffffff", 9, 1.1, true, 0.26);
          recoil10(victimGhost, sp, tp);
          GLFX.impulseShake(4.8, dx, dy);
          SFX.play("dark");

          setTimeout(() => {
            spawnSoulSiphonOrb(tp, sp, "loithan", "#d46bff", 340, () => {
              FX.wave(sp.x, sp.y, "#d46bff", 78);
              FX.holo(sp.x, sp.y, "#d46bff", 30);
              SFX.play("e_hon");
              pushOppNotif("ĐÃ ĐOẠT KỸ NĂNG: LÔI THẦN!", "#e0b0ff");
            });
            const backArc = build3DArcFrames({ steps: 18, dx: -dx, dy: -dy, curve: -32, lift: -18, s0: 1.18, sMid: 1.06, s1: 1 });
            const backShifted = backArc.frames.map((f) => ({
              offset: f.offset,
              transform: f.transform.replace(
                /translate3d\(([^,]+)px,\s*([^,]+)px,/,
                (_, x, y) => `translate3d(${(dx + parseFloat(x)).toFixed(2)}px, ${(dy + parseFloat(y)).toFixed(2)}px,`
              )
            }));
            thiefGhost.animate(backShifted, { duration: 290, easing: "linear", fill: "forwards" }).onfinish = () => {
              setTimeout(() => {
                thiefGhost.remove();
                victimGhost.remove();
              }, 220);
            };
          }, 95);
        };
        break;
      }

      case "clonecard": {
        if (!ensureInMatchForDemo("clonecard")) return;
        const src = getLaneSlotRect(1, "me", 0);
        const dstA = getLaneSlotRect(0, "me", 1);
        const dstB = getLaneSlotRect(2, "me", 1);
        const html = sampleDemoCardHTML("bachho", 2);
        const baseG = ghost(src, html, "g9");
        SFX.play("chime");
        FX.holo(src.x, src.y, "#3fe0ff", 36);
        pushOppNotif("NHÂN BẢN THẺ ▸ PHÂN TÁCH SANG 2 CHIẾN ĐỊA!", "#3fe0ff");
        [dstA, dstB].forEach((dst, i) => {
          setTimeout(() => {
            const cl = ghost(src, html, "g9");
            const dx = dst.x - src.x, dy = dst.y - src.y;
            const arc = build3DArcFrames({ steps: 22, dx, dy, curve: i === 0 ? -28 : 28, lift: -46, s0: 0.9, sMid: 1.22, s1: 1, bank: i === 0 ? -12 : 12, zLift: 54 });
            streamBezierRibbon(src.x, src.y, arc.p1, arc.p2, arc.p3, 360, "#3fe0ff", "#ffd65a", 2);
            SFX.play("whoosh");
            cl.animate(arc.frames, { duration: 360, easing: "linear", fill: "forwards" }).onfinish = () => {
              SFX.play("summon");
              FX.wave(dst.x, dst.y, "#3fe0ff", 78);
              FX.sparks(dst.x, dst.y, "#ffd65a", 18, 210);
              GLFX.impulseShake(3.2, 0, 1);
              setTimeout(() => cl.remove(), 420);
            };
          }, i * 90);
        });
        setTimeout(() => baseG.remove(), 680);
        break;
      }

      case "silence": {
        if (!ensureInMatchForDemo("silence")) return;
        const tp = getLaneSlotRect(1, "opp", 2);
        const victim = ghost(tp, sampleDemoCardHTML("loithan", 0), "g9");
        SFX.play("silence");
        GLFX.arc(tp.x - 28, tp.y - 34, tp.x + 28, tp.y + 34, "#ff4d7d", 10, 0.5, false, 0.38);
        GLFX.arc(tp.x + 28, tp.y - 34, tp.x - 28, tp.y + 34, "#ff4d7d", 10, 0.5, false, 0.38);
        FX.ring(tp.x, tp.y, "#c45cff", 88, 6);
        FX.vortex(tp.x, tp.y, "#ff4d7d", 22);
        FX.float(tp.x, tp.y - 16, "⊘ CẤM CHIÊU!", "#ff7a9e");
        GLFX.impulseShake(4.8);
        pushOppNotif("PHÁP ẤN TRẦM MẶC ▸ VÔ HIỆU HOÁ KỸ NĂNG!", "#ff7a9e");
        victim.animate([
          { filter: "brightness(2.2) saturate(2)" },
          { transform: "translateX(-5px) rotate(-3deg)", filter: "grayscale(1) brightness(0.7)", offset: 0.35 },
          { transform: "translateX(5px) rotate(3deg)", filter: "grayscale(1) brightness(0.7)", offset: 0.65 },
          { transform: "none", filter: "grayscale(1) brightness(0.75)" }
        ], { duration: 480, fill: "forwards" });
        setTimeout(() => victim.remove(), 820);
        break;
      }

      case "pullcard": {
        if (!ensureInMatchForDemo("pullcard")) return;
        const puller = getLaneSlotRect(2, "me", 0);
        const fromOpp = getLaneSlotRect(0, "opp", 2);
        const toOpp = getLaneSlotRect(2, "opp", 2);
        const gPuller = ghost(puller, sampleDemoCardHTML("huyenquy", 1), "g9");
        const gVictim = ghost(fromOpp, sampleDemoCardHTML("satvuong", 0), "g9");
        SFX.play("chain");
        GLFX.tether(puller.x, puller.y, fromOpp.x, fromOpp.y, "#ff9a2b", 12, 0.25, 0.42);
        pushOppNotif("XÍCH TRÓI HÚT THẺ ▸ KÉO ĐỐI THỦ SANG CHIẾN ĐỊA PHẢI!", "#ffb347");
        setTimeout(() => {
          const dx = toOpp.x - fromOpp.x, dy = toOpp.y - fromOpp.y;
          const arc = build3DArcFrames({ steps: 22, dx, dy, lift: -36, s0: 1, sMid: 1.18, s1: 1, bank: 12, zLift: 44 });
          streamBezierRibbon(fromOpp.x, fromOpp.y, arc.p1, arc.p2, arc.p3, 330, "#ff9a2b", "#ffd65a", 2);
          SFX.play("whoosh");
          gVictim.animate(arc.frames, { duration: 330, easing: "linear", fill: "forwards" }).onfinish = () => {
            SFX.play("place");
            FX.wave(toOpp.x, toOpp.y, "#ff9a2b", 76);
            FX.dust(toOpp.x, toOpp.y + toOpp.h * 0.4, "#ffe2b0");
            GLFX.impulseShake(4.5, 1, 0);
            setTimeout(() => { gPuller.remove(); gVictim.remove(); }, 420);
          };
        }, 140);
        break;
      }

      case "pushcard": {
        if (!ensureInMatchForDemo("pushcard")) return;
        const pusher = getLaneSlotRect(1, "me", 0);
        const fromOpp = getLaneSlotRect(1, "opp", 2);
        const toOpp = getLaneSlotRect(0, "opp", 2);
        const gPusher = ghost(pusher, sampleDemoCardHTML("cuongphong", 2), "g9");
        const gVictim = ghost(fromOpp, sampleDemoCardHTML("satvuong", 0), "g9");
        SFX.play("boom");
        FX.wave(fromOpp.x, fromOpp.y, "#5ad8ff", 95);
        GLFX.arc(pusher.x, pusher.y, fromOpp.x, fromOpp.y, "#7fe8ff", 10, 0.8, false, 0.25);
        pushOppNotif("CUỒNG PHONG CHƯỞNG ▸ ĐẨY VĂNG THẺ ĐỐI THỦ!", "#7fe8ff");
        const dx = toOpp.x - fromOpp.x, dy = toOpp.y - fromOpp.y;
        const arc = build3DArcFrames({ steps: 20, dx, dy, lift: -44, s0: 1, sMid: 1.2, s1: 1, bank: -14, zLift: 48 });
        streamBezierRibbon(fromOpp.x, fromOpp.y, arc.p1, arc.p2, arc.p3, 310, "#5ad8ff", "#ffffff", 2);
        gVictim.animate(arc.frames, { duration: 310, easing: "linear", fill: "forwards" }).onfinish = () => {
          SFX.play("place");
          FX.wave(toOpp.x, toOpp.y, "#5ad8ff", 72);
          GLFX.impulseShake(4.2, -1, 0);
          setTimeout(() => { gPusher.remove(); gVictim.remove(); }, 400);
        };
        break;
      }

      case "morphcard": {
        if (!ensureInMatchForDemo("morphcard")) return;
        const slot = getLaneSlotRect(1, "me", 0);
        const g = ghost(slot, sampleDemoCardHTML("cuhou", 0), "g9");
        SFX.play("morph");
        CFX.morph(g);
        setTimeout(() => {
          const keys = Object.keys(C);
          const nextId = C.phuonghoang ? "phuonghoang" : keys[Math.floor(Math.random() * keys.length)];
          g.innerHTML = sampleDemoCardHTML(nextId, 4);
          FX.wave(slot.x, slot.y, "#ffd65a", 86);
          FX.sparks(slot.x, slot.y, "#d46bff", 22, 240);
          pushOppNotif(`BIẾN HÌNH 3D ▸ HOÁ THÀNH ${(C[nextId] ? C[nextId].n : "THẦN THÚ").toUpperCase()}!`, "#e0b0ff");
        }, 250);
        setTimeout(() => g.remove(), 860);
        break;
      }

      /* ===== NHÓM 3: PHÁ HUỶ & TĂNG GIẢM ĐIỂM ===== */
      case "destroyer": {
        if (!ensureInMatchForDemo("destroyer")) return;
        const boardEl = $id("board");
        const br = boardEl ? boardEl.getBoundingClientRect() : { top: 110, height: 420 };
        SFX.play("laser");
        pushOppNotif("TIA HUỶ DIỆT TOÀN BÀN ▸ QUÉT SẠCH MỌI CHIẾN ĐỊA!", "#ff6a2b");
        const beamEl = document.createElement("div");
        beamEl.className = "gpu-laser-sweep";
        beamEl.style.top = br.top + "px";
        document.body.appendChild(beamEl);
        beamEl.animate([
          { transform: "translateY(0px) scaleY(0.4)", opacity: 0.4 },
          { transform: `translateY(${(br.height * 0.15).toFixed(0)}px) scaleY(1.35)`, opacity: 1, offset: 0.18 },
          { transform: `translateY(${(br.height * 0.85).toFixed(0)}px) scaleY(1.25)`, opacity: 1, offset: 0.82 },
          { transform: `translateY(${br.height.toFixed(0)}px) scaleY(0.3)`, opacity: 0 }
        ], { duration: 540, easing: "cubic-bezier(0.22, 0.8, 0.32, 1)", fill: "forwards" }).onfinish = () => beamEl.remove();

        [0, 1, 2].forEach((li) => {
          setTimeout(() => {
            const sl = getLaneSlotRect(li, li === 1 ? "me" : "opp", li === 1 ? 1 : 2);
            SFX.play("destroy");
            CFX.destroy({ x: sl.x, y: sl.y, w: sl.w, h: sl.h, html: sampleDemoCardHTML(li === 0 ? "satvuong" : li === 1 ? "bachho" : "loithan", 0) });
          }, 95 + li * 115);
        });
        gpuFlash("#ff4d1f", 0.28, 360);
        GLFX.impulseShake(9.5, 0, 1);
        break;
      }

      case "destroy3d": {
        if (!ensureInMatchForDemo("destroy3d")) return;
        const sl = getLaneSlotRect(1, "opp", 2);
        pushOppNotif("KIẾM QUYỀN ▸ CHÉM VỠ THẺ ĐỐI THỦ 6 MẢNH 3D!", "#ff6b8a");
        SFX.play("slash");
        SFX.play("destroy");
        CFX.destroy({ x: sl.x, y: sl.y, w: sl.w, h: sl.h, html: sampleDemoCardHTML("satvuong", 0) });
        break;
      }

      case "summon": {
        if (!ensureInMatchForDemo("summon")) return;
        const sl = getLaneSlotRect(demoLocIdx % 3, "me", 2);
        demoLocIdx++;
        const g = ghost(sl, sampleDemoCardHTML("thanhlong", 4), "g9");
        SFX.play("summon");
        CFX.summon(g, "#3dffb4");
        FX.pillar(sl.x, sl.y + 18, "#3dffb4", 46, 150);
        FX.sparks(sl.x, sl.y, "#7dffb0", 22, 230);
        pushOppNotif("TRIỆU HỒI LINH THÚ ▸ CỔNG PHÙ VĂN TRỖI DẬY!", "#7dffb0");
        setTimeout(() => g.remove(), 820);
        break;
      }

      case "buffpw": {
        if (!ensureInMatchForDemo("buffpw")) return;
        const live = document.querySelector("#board .side.me [data-mc]");
        const sl = getLaneSlotRect(1, "me", 0);
        const target = live || ghost(sl, sampleDemoCardHTML("bachho", 6), "g9");
        const r = target.getBoundingClientRect();
        const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
        SFX.play("buff");
        CFX.buff(target, 6);
        FX.ring(tx, ty, "#3dffb4", 76, 5);
        FX.rise(tx, ty + 14, "#7dffb0", 20);
        FX.float(tx, ty - 18, "+6 SỨC MẠNH", "#5effb8");
        pushOppNotif("CƯỜNG HOÁ LINH LỰC ▸ +6 SỨC MẠNH!", "#5effb8");
        if (!live) setTimeout(() => target.remove(), 740);
        break;
      }

      case "debuffpw": {
        if (!ensureInMatchForDemo("debuffpw")) return;
        const live = document.querySelector("#board .side.opp [data-mc]");
        const sl = getLaneSlotRect(1, "opp", 2);
        const target = live || ghost(sl, sampleDemoCardHTML("satvuong", -4), "g9");
        const r = target.getBoundingClientRect();
        const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
        SFX.play("debuff");
        CFX.debuff(target);
        FX.ring(tx, ty, "#ff4d7d", 72, 5);
        FX.sparks(tx, ty, "#ff4d7d", 20, 220);
        FX.float(tx, ty - 18, "−4 SỨC MẠNH", "#ff6b8a");
        GLFX.impulseShake(3.8);
        pushOppNotif("ÁM KHÍ ĂN MÒN ▸ −4 SỨC MẠNH ĐỐI THỦ!", "#ff6b8a");
        if (!live) setTimeout(() => target.remove(), 720);
        break;
      }

      case "doublepw": {
        if (!ensureInMatchForDemo("doublepw")) return;
        const ln = document.querySelector('#board [data-lane="1"]') || document.querySelector("#board [data-lane]");
        const pwBadge = ln && ln.querySelector(".pw.p");
        const r = (pwBadge || ln).getBoundingClientRect();
        const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
        SFX.play("snap");
        SFX.play("buff");
        FX.rays(tx, ty, "#ffd65a", 125);
        FX.wave(tx, ty, "#ffb32e", 110);
        FX.holo(tx, ty, "#ffd65a", 40);
        FX.float(tx, ty - 22, "×2 TỔNG SỨC MẠNH!", "#ffe37a");
        if (pwBadge) {
          smoothAnim(pwBadge, [
            { transform: "translateX(-50%) scale(1)" },
            { transform: "translateX(-50%) scale(1.65)", filter: "brightness(2)", offset: 0.4 },
            { transform: "translateX(-50%) scale(1.08)" }
          ], { duration: 520 });
        }
        GLFX.impulseShake(5.5);
        pushOppNotif("DUY TRÌ NHÂN ĐÔI ▸ ×2 TỔNG SỨC MẠNH CHIẾN ĐỊA!", "#ffd65a");
        break;
      }

      /* ===== NHÓM 4: HỆ NGUYÊN TỐ & CƯỢC SNAP ===== */
      case "snapcube": {
        const stakes = [["×2", "#b07bff"], ["×4", "#3fe0ff"], ["×8", "#ffd65a"]];
        const [txt, col] = stakes[demoSnapIdx % stakes.length];
        demoSnapIdx++;
        SFX.play("snap");
        if (typeof snapFx === "function") snapFx(col, txt);
        pushOppNotif(`CƯỢC SNAP NHÂN ĐÔI ▸ MỨC CƯỢC LÊN ${txt}!`, col, { allowLobby: true });
        break;
      }

      case "locklane": {
        if (!ensureInMatchForDemo("locklane")) return;
        const ln = document.querySelector(`#board [data-lane="${demoLocIdx % 3}"]`) || document.querySelector("#board [data-lane]");
        demoLocIdx++;
        if (!ln) return;
        const lr = ln.getBoundingClientRect();
        const lx = lr.left + lr.width / 2, ly = lr.top + lr.height / 2;
        SFX.play("chain");
        if (typeof window.playV16 === "function") window.playV16("khoa_dia", lx, ly, Math.max(148, lr.width * 1.15), 620, 0);
        GLFX.arc(lr.left + 6, ly - 55, lr.right - 6, ly + 55, "#59e8ff", 9, 0.35, false, 0.45);
        GLFX.arc(lr.right - 6, ly - 55, lr.left + 6, ly + 55, "#59e8ff", 9, 0.35, false, 0.45);
        FX.wave(lx, ly, "#59e8ff", 110);
        FX.float(lx, ly, "⛓ KHOÁ CHIẾN ĐỊA!", "#9ef4ff");
        GLFX.impulseShake(4.8);
        pushOppNotif("PHONG ẤN KHÔNG GIAN ▸ KHOÁ CỨNG CHIẾN ĐỊA!", "#7fe8ff");
        break;
      }

      case "shieldfx": {
        if (!ensureInMatchForDemo("shieldfx")) return;
        const sl = getLaneSlotRect(1, "me", 0);
        const g = ghost(sl, sampleDemoCardHTML("kimquy", 3), "g9");
        SFX.play("shield");
        if (typeof window.playV16 === "function") window.playV16("khien_chan", sl.x, sl.y, 148, 620, 0);
        FX.ring(sl.x, sl.y, "#ffd65a", 68, 6);
        FX.ring(sl.x, sl.y, "#7fe8ff", 52, 4);
        FX.holo(sl.x, sl.y, "#ffd65a", 34);
        FX.float(sl.x, sl.y - 16, "🛡 BẤT TỬ HỘ THỂ", "#ffe68a");
        pushOppNotif("KHIÊN HỘ THỂ BẤT DIỆT ▸ CHẶN ĐỨNG SÁT THƯƠNG!", "#ffd65a");
        setTimeout(() => g.remove(), 760);
        break;
      }

      case "fire": {
        SFX.play("boom");
        SFX.play("e_lua");
        if (typeof window.playV16 === "function") {
          window.playV16("thieu_dot", cx, cy, 220, 660, 0);
          window.playV16("no_lua", cx, cy, 240, 560, 60);
        }
        FX.pillar(cx, cy + 60, "#ff6a1f", 72, 260);
        FX.wave(cx, cy, "#ff8a2b", 165);
        FX.burst(cx, cy, "#ff5518", 55, 320);
        FX.sparks(cx, cy, "#ffd65a", 45, 380);
        FX.rise(cx, cy + 30, "#ffb02e", 28);
        gpuFlash("#ff6a1f", 0.28, 320);
        GLFX.impulseShake(8.5);
        pushOppNotif("HOẢ NGỤC BÙNG NỔ ▸ THIÊU RỤI CHIẾN ĐỊA!", "#ffd65a", { allowLobby: true });
        break;
      }

      case "thunder": {
        SFX.play("e_sam");
        if (typeof window.playV16 === "function") window.playV16("set_danh", cx, cy, 220, 620, 0);
        const targets = [
          [cx - 115, cy - 45],
          [cx + 115, cy - 35],
          [cx - 95, cy + 80],
          [cx + 105, cy + 75]
        ];
        GLFX.arc(cx, 20, cx, cy, "#7fe8ff", 16, 1.4, true, 0.42);
        FX.wave(cx, cy, "#3fe0ff", 150);
        targets.forEach(([tx, ty], i) => {
          setTimeout(() => {
            SFX.play("e_sam");
            if (typeof window.playV16 === "function") window.playV16(i % 2 ? "no_set" : "set_danh", tx, ty, 136, 500, 0);
            GLFX.arc(cx, cy, tx, ty, i % 2 ? "#b99aff" : "#3fe0ff", 12, 1.3, true, 0.34);
            FX.sparks(tx, ty, "#7fe8ff", 24, 280);
            FX.ring(tx, ty, "#ffffff", 74);
            GLFX.impulseShake(4.8);
          }, 60 + i * 65);
        });
        gpuFlash("#7fe8ff", 0.24, 280);
        pushOppNotif("LÔI THẦN ▸ GIÁNG SÉT LIÊN HOÀN!", "#7fe8ff", { allowLobby: true });
        break;
      }

      case "frost": {
        SFX.play("e_bang");
        if (typeof window.playV16 === "function") {
          window.playV16("dong_bang", cx, cy, 220, 640, 0);
          window.playV16("no_bang", cx, cy, 236, 560, 50);
        }
        FX.wave(cx, cy, "#9ef0ff", 160);
        FX.rays(cx, cy, "#dffaff", 145);
        FX.shards(cx, cy, "#7fe8ff");
        FX.shards(cx, cy, "#ffffff");
        FX.burst(cx, cy, "#5ad8ff", 40, 260);
        gpuFlash("#bff6ff", 0.24, 300);
        GLFX.impulseShake(5.5);
        pushOppNotif("BĂNG VƯƠNG ▸ ĐÓNG BĂNG TUYỆT ĐỐI!", "#bff6ff", { allowLobby: true });
        break;
      }

      case "ult": {
        const s5Keys = Object.keys(C).filter((k) => C[k].h === "S5");
        const pickId = s5Keys[Math.floor(Math.random() * s5Keys.length)] || Object.keys(C)[0];
        ult({ id: pickId, own: "p" });
        setTimeout(() => {
          SFX.play("slash");
          FX.slash(cx, cy, "#ffd65a");
        }, 260);
        break;
      }

      /* ===== NHÓM 5: NHẠC NỀN & TỐC ĐỘ HOẠT ẢNH ===== */
      case "bgm_lobby": {
        if (window.BGM) { store.bgm = true; BGM.play("lobby"); }
        pushOppNotif("NHẠC NỀN SẢNH CHỜ ▸ 92 BPM COSMIC SYNTH!", "#8ceeff", { allowLobby: true });
        break;
      }
      case "bgm_b1": {
        if (window.BGM) { store.bgm = true; BGM.play("battle1"); }
        pushOppNotif("NHẠC CHIẾN ĐẤU LƯỢT 1–3 ▸ 114 BPM CYBER PULSE!", "#3fe0ff", { allowLobby: true });
        break;
      }
      case "bgm_b2": {
        if (window.BGM) { store.bgm = true; BGM.play("battle2"); }
        pushOppNotif("NHẠC CAO TRÀO LƯỢT 4–5 ▸ 116 BPM DRIVING ARP!", "#c45cff", { allowLobby: true });
        break;
      }
      case "bgm_climax": {
        if (window.BGM) { store.bgm = true; BGM.play("climax"); }
        pushOppNotif("NHẠC LƯỢT CUỐI / SNAP ▸ 122 BPM HEROIC CLIMAX!", "#ffd65a", { allowLobby: true });
        break;
      }
      case "bgm_toggle": {
        if (window.BGM) {
          const next = store.bgm === false;
          BGM.toggle(next);
          pushOppNotif(next ? "ĐÃ BẬT NHẠC NỀN TRẬN ĐẤU!" : "ĐÃ TẮT NHẠC NỀN TRẬN ĐẤU!", next ? "#6effc8" : "#ff8a9e", { allowLobby: true });
        }
        break;
      }
      case "spd_fast": {
        if (typeof setSpd10 === "function") setSpd10("nhanh");
        SFX.play("pick");
        pushOppNotif("TỐC ĐỘ HOẠT ẢNH: NHANH (0.78×)!", "#6effc8", { allowLobby: true });
        break;
      }
      case "spd_norm": {
        if (typeof setSpd10 === "function") setSpd10("vua");
        SFX.play("pick");
        pushOppNotif("TỐC ĐỘ HOẠT ẢNH: CHUẨN MARVEL SNAP (1.0×)!", "#3fe0ff", { allowLobby: true });
        break;
      }
      case "spd_slow": {
        if (typeof setSpd10 === "function") setSpd10("cham");
        SFX.play("pick");
        pushOppNotif("TỐC ĐỘ HOẠT ẢNH: CHẬM (1.3×)!", "#ffd65a", { allowLobby: true });
        break;
      }
    }
  }

  buildVfxLab();
  setTimeout(syncOppCourtMetrics, 60);
})();

/* ==================== gpu20: TỰ CHỈNH MỨC HIỆU ỨNG THEO KHUNG HÌNH ĐO THẬT ====================
   Mỗi trận đo khoảng 3 giây đầu (sau khi chia bài). Dưới 40 khung/giây: bớt hạt nhỏ (FXLV=0).
   Từ 54 khung/giây trở lên: trở lại đầy đủ (FXLV=1). Hình thẻ, chữ, hoạt ảnh chiêu không đổi. */
(function () {
  "use strict";
  window.FXLV = 1;
  try { const v = localStorage.getItem("ltd_fxlv"); if (v === "0") window.FXLV = 0; } catch (e) {}
  let lastG = null, busy = false;
  function inBattle() {
    try {
      if (document.hidden || typeof G === "undefined" || !G || G.phase === "over") return false;
      const lb = document.getElementById("lobby");
      return !(lb && lb.classList.contains("on")) && !document.querySelector(".ov.on");
    } catch (e) { return false; }
  }
  function measure() {
    busy = true;
    let n = 0, t0 = 0;
    const f = (t) => {
      if (!inBattle()) { busy = false; return; }
      if (!t0) t0 = t;
      n++;
      if (t - t0 < 3000) { requestAnimationFrame(f); return; }
      const fps = n * 1000 / (t - t0);
      const lv = fps < 40 ? 0 : fps >= 54 ? 1 : window.FXLV;
      window.FXLV = lv;
      try { localStorage.setItem("ltd_fxlv", String(lv)); } catch (e) {}
      busy = false;
    };
    requestAnimationFrame(f);
  }
  setInterval(() => {
    if (busy || !inBattle()) return;
    if (G !== lastG) { lastG = G; setTimeout(() => { if (inBattle()) measure(); }, 2500); }
  }, 2000);
})();

/* ==================== gpu21: TỰ TUA NHANH KHI HOẠT ẢNH CỦA MỘT LƯỢT KÉO DÀI QUÁ 15 GIÂY ====================
   Đếm từ lúc bấm Kết thúc lượt (lật bài, kỹ năng, cuối lượt, đầu lượt mới). Quá 15 giây thì phần còn lại
   chạy ở tốc độ tua nhanh và hiện nhãn "⏩ Tua nhanh"; hết lượt trả về tốc độ người chơi đã chọn. */
(function () {
  "use strict";
  const FF_AFTER = 15000, FF_SPD = 0.45;
  const FF = { iv: 0, t0: 0, on: false };
  let chip = null;
  function showChip(on) {
    if (on) {
      if (!chip) { chip = document.createElement("div"); chip.id = "ffChip"; chip.setAttribute("aria-live", "polite"); chip.textContent = "⏩ Tua nhanh"; }
      if (!chip.isConnected) document.body.appendChild(chip);
      chip.classList.add("on");
    } else if (chip) chip.classList.remove("on");
  }
  function engage() {
    if (FF.on) return;
    const old = SPD;
    if (old <= FF_SPD) return;
    FF.on = true;
    SPD = FF_SPD;
    /* các hoạt ảnh đang chạy dở cũng tăng tốc theo (chỉ hoạt ảnh có hồi kết, không đụng hào quang lặp vô hạn) */
    try {
      for (const a of document.getAnimations()) {
        const t = a.effect && a.effect.getTiming && a.effect.getTiming();
        if (t && isFinite(t.iterations) && a.playState === "running") a.playbackRate = a.playbackRate * (old / FF_SPD);
      }
    } catch (e) {}
    showChip(true);
  }
  function start() {
    FF.t0 = performance.now(); FF.on = false; clearInterval(FF.iv);
    FF.iv = setInterval(() => { if (!document.hidden && performance.now() - FF.t0 > FF_AFTER) engage(); }, 200);
  }
  function stop() {
    clearInterval(FF.iv); FF.iv = 0;
    if (FF.on) { FF.on = false; try { SPD = SPDV[store.spd] || 1; } catch (e) { SPD = 1; } }
    showChip(false);
  }
  window.FFTURN = { start, stop, get on() { return FF.on; } };
  try { if (typeof endTurnUI === "function") { const f0 = endTurnUI; endTurnUI = async function () { start(); try { return await f0.apply(this, arguments); } finally { stop(); } }; } } catch (e) {}
  try { if (typeof onlineResolve === "function") { const f1 = onlineResolve; onlineResolve = async function () { start(); try { return await f1.apply(this, arguments); } finally { stop(); } }; } } catch (e) {}
})();
