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
    /* gpu22: mặc định "Rất chậm" (anh chọn sau khi thử 5 mức); chuyển một lần cho mọi máy */
    if (!localStorage.getItem("ltd_spd_v4")) {
      localStorage.setItem("ltd_spd_v4", "1");
      store.spd = "ratcham";
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

    /* gpu35: chỉ ghi khi đổi — đổi biến CSS ở :root làm tính lại style toàn trang */
    const v = [oppLeft.toFixed(1), Math.max(46, oppTop).toFixed(1), Math.max(92, oppCy).toFixed(1), oppW.toFixed(1)];
    ["--opp-left", "--opp-top", "--opp-cy", "--opp-w"].forEach((k, i) => { if (oppVals[i] !== v[i]) { oppVals[i] = v[i]; root.style.setProperty(k, v[i] + "px"); } });
  }
  const oppVals = [];
  /* gom các lần đo về 1 lần mỗi khung hình (render() gọi rất dày; đo ngay sau khi ghi DOM buộc tính lại bố cục) */
  let oppRaf = 0;
  function schedOppMetrics() { if (oppRaf) return; oppRaf = requestAnimationFrame(() => { oppRaf = 0; try { syncOppCourtMetrics(); } catch (e) {} }); }

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

  /* gpu40: chữ cộng/trừ gộp nhóm ("+2 ×3", "TĂNG SỨC MẠNH ×4", "−1 NĂNG LƯỢNG ×2") ở nửa sân trên: hiện nửa thời gian */
  const PW_GRP_RE = /^(?:[+＋−\-]\s*\d+(?:\s*NĂNG LƯỢNG)?\s*×\s*\d+|(?:TĂNG|GIẢM) SỨC MẠNH ×\s*\d+|(?:ĐỔI NĂNG LƯỢNG) ×\s*\d+|[+＋−\-]\s*\d+\s*NĂNG LƯỢNG|[+＋]\d+ năng lượng)$/;
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
    ], { duration: 540, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }); /* gpu40: x2 nhanh (cũ 1080) */
    a.onfinish = () => d.remove();
    fxT(() => d.remove(), 640);
  }

  { /* gpu23: say khai báo ở 05, thân hàm ở đây */
    say = function (x, y, t, c, dl) {
      if (reduced || !t) return;
      const run = () => {
        if (typeof SAYOFF !== "undefined" && SAYOFF) return;
        if (isPureStatNumber(t)) spawnStatPop(x, y, t, c);
        else pushOppNotif(t, c, PW_GRP_RE.test(String(t).trim()) ? { dur: 640 } : undefined);
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
        if (!L || !L.rvl || L.gone || !r || r.width < 10 || locVeiled(G) || Math.random() > 0.42) continue;
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
      else pushOppNotif(txt, c, PW_GRP_RE.test(String(txt).trim()) ? { dur: 640 } : undefined);
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
  { /* gpu23: recoil10 khai báo ở 05, thân hàm ở đây */
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

  { /* gpu23: lean10 khai báo ở 05, thân hàm ở đây */
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

  { /* gpu23: mvDur9 khai báo ở 05, thân hàm ở đây */
    mvDur9 = (s) => (s.k === "swap" ? (s.sp ? 1280 : 1080) : (s.sp ? 1260 : 880));
  }

  { /* gpu23: move10 khai báo ở 05, thân hàm ở đây */
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

  { /* gpu23: lunge10 khai báo ở 05, thân hàm ở đây */
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
                  SFX.fam(s.k === "steal" ? "steal" : "copy", { el: typeof elU === "function" ? elU(s.src) : null });
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

    /* gpu40: rút bài đầu lượt — lá bay từ cụm bộ bài vào tay, luôn MẶT TRƯỚC (bỏ sprite mặt lưng "rut_bai" và pha xoay lật), gọn ~0,3 s gốc */
    CFX.drawIn = function (el, cr, k) {
      if (el) el.style.opacity = "";
      if (reduced || !el) return;
      const b = el.getBoundingClientRect();
      const col = cr ? "#ffd65a" : "#7fe8ff";
      const delay = (k || 0) * 70;
      if (typeof holdFx === "function") holdFx(320 + delay);
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const dz = (typeof DECKZ === "function" && DECKZ("p")) || { x: window.innerWidth * 0.2, y: cy - 200 };
      const dx = dz.x - cx, dy = dz.y - cy, s0 = Math.max(0.35, Math.min(0.7, (dz.w || 44) / Math.max(1, b.width)));
      smoothAnim(el, [
        { opacity: 0, transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${s0.toFixed(3)})`, easing: "cubic-bezier(0.3, 0.7, 0.4, 1)" },
        { opacity: 1, transform: `translate3d(${(dx * 0.12).toFixed(1)}px, ${(dy * 0.12 - 12).toFixed(1)}px, 0) scale(1.08)`, offset: 0.72, easing: "ease-out" },
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
      ], { duration: 300, delay, easing: "linear", fill: "backwards" });
      fxT(() => { FX.glow(cx, cy, col, 50, 0.4); if (cr) FX.sparks(cx, cy, col, 10, 180); }, 250 + delay);
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

    /* gpu68 (vis): tăng/giảm sức mạnh theo ngôn ngữ đổi chỉ số chung (P6.stat): lá nhích nhẹ, ô sức mạnh đếm cũ -> mới + nhãn nhỏ.
       Bỏ ảnh "tang_suc"/"giam_suc" lớn đè lên mặt thẻ và cú phóng to ô số 1,85×. d: lượng đổi (dương), o.v1: số mới, o.lab: nhãn (×2). */
    const statPow = (el, dd, o) => {
      o = o || {};
      if (!dd || o.stat === false || !window.P6 || !P6.stat) return;
      const pw = el.querySelector(":scope>.pwh,.lc>.lcp,.gc>.pwh");
      const v1 = o.v1 != null ? o.v1 : pw ? parseInt(pw.textContent, 10) : NaN;
      if (!isFinite(v1)) return;
      P6.stat({ el, k: "pow", v0: v1 - dd, v1, lab: o.lab, src: o.src, i: o.i, dl: o.dl, uid: o.uid });
    };
    CFX.buff = function (el, d, o) {
      if (reduced || !el) return;
      if (typeof holdFx === "function") holdFx(420);
      smoothAnim(el, [
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: "translate3d(0,-4px,0) scale(1.05)", offset: 0.4 },
        { transform: "translate3d(0,0,0) scale(1)" }
      ], { duration: 300 });
      statPow(el, Math.abs(+d || 0), o);
    };
    CFX.debuff = function (el, d, o) {
      if (reduced || !el) return;
      if (typeof holdFx === "function") holdFx(420);
      smoothAnim(el, [
        { transform: "translate3d(0,0,0)" },
        { transform: "translate3d(-3px,1px,0) rotate(-1.5deg)", offset: 0.3 },
        { transform: "translate3d(3px,1px,0) rotate(1.5deg)", offset: 0.6 },
        { transform: "translate3d(0,0,0)" }
      ], { duration: 280 });
      statPow(el, -Math.abs(+d || 0), o);
    };
  }

  /* 6.6. Đuôi hạt GPU & Quỹ đạo mượt cho đòn phóng kỹ năng (fly8 & hit8) */
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
        /* gpu68 (vis): gọn — vòng nhỏ + vài hạt, không rung (số đổi do P6.stat trên ô sức mạnh) */
        FX.ring(tp.x, tp.y, "#3dffb4", 40);
        FX.rise(tp.x, tp.y + 12, "#7dffb0", 6);
      } else if (s.k === "down" || s.k === "lminus") {
        FX.sparks(tp.x, tp.y, "#ff4d7d", 8, 180);
        FX.ring(tp.x, tp.y, "#ff4d7d", 40);
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

  /* gpu26: màn tuyệt kỹ S5/S4 cũ (dải băng) đã thay bằng màn ra mắt lá thẻ ở 05 (ultShow) — bỏ lớp phủ GPU cũ */

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
      if (host.style.display !== "none") host.style.display = "none";
      window._gpuLaneRects = null;
      return;
    }
    /* gpu35: đọc hết kích thước trước rồi mới ghi (trước đây ghi data-lfx/style xen giữa các lần đo -> tính lại bố cục nhiều lần mỗi khung) */
    const lrs = [null, null, null], kinds = [], lanes = [], sideR = [];
    for (let li = 0; li < 3; li++) {
      const L = G.locs[li];
      kinds[li] = L && L.rvl && !L.gone && !locVeiled(G) ? classifyLocField(L.id) : ""; /* gpu43: chưa mở che -> không tô nền theo chiến địa */
      const ln = lanes[li] = document.querySelector(`#board [data-lane="${li}"]`);
      if (ln) lrs[li] = ln.getBoundingClientRect();
      for (let si = 0; si < 2; si++) {
        const sideEl = ln && kinds[li] ? ln.querySelector(`.side.${si === 0 ? "opp" : "me"}`) : null;
        sideR[li * 2 + si] = sideEl ? sideEl.getBoundingClientRect() : null;
      }
    }
    if (host.style.display !== "block") host.style.display = "block";
    const set = (box, k, v) => { const c = "_s" + k; if (box[c] !== v) { box[c] = v; box.style[k] = v; } };
    for (let li = 0; li < 3; li++) {
      const kind = kinds[li], ln = lanes[li];
      if (ln && ln.dataset.lfx !== (kind || "")) ln.dataset.lfx = kind || "";
      for (let si = 0; si < 2; si++) {
        const sd = si === 0 ? "opp" : "me";
        const box = bfxBoxes[li * 2 + si];
        if (!box) continue;
        const r = sideR[li * 2 + si];
        if (!kind || !r) {
          set(box, "display", "none");
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
        if (r.width < 10 || r.height < 10) { set(box, "display", "none"); continue; }
        set(box, "display", "block");
        set(box, "left", (r.left - 2).toFixed(1) + "px");
        set(box, "top", (r.top - 2).toFixed(1) + "px");
        set(box, "width", (r.width + 4).toFixed(1) + "px");
        set(box, "height", (r.height + 4).toFixed(1) + "px");
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

  /* gpu51: MỞ CHIẾN ĐỊA kiểu Marvel Snap, tổng ≈ 2,0 s ở SPD 2.0 (mọi thời lượng WAAPI viết ms/2 vì 05 tự nhân SPD):
     (1) 0–350 ô đóng (dấu "?") nhấc nhẹ scale 1 -> 1,04 rồi lật quanh trục Y tới 90°.
     (2) 350–700 "lá chiến địa lớn" (ảnh thật, viền vàng mảnh, ~78% bề ngang) lật tiếp 90° -> 0° giữa màn, nền tối mờ 35%.
     (3) 700–1500 lá đứng yên; băng tên trượt vào dưới ảnh, dòng mô tả (kwfx) hiện dưới băng; tiếng `loc` đúng 1 lần ở đầu nhịp.
     (4) 1500–1950 lá thu nhỏ bay về đúng ô (getBoundingClientRect), nền tan; chạm ô -> ô lộ mặt thật (LVEIL/LVOPEN) + một vệt sáng quét qua.
     Không rung màn hình, không chớp trắng, không hạt. Nhiều lá: xếp hàng từng lá (nhịp 3 còn 500). FXLV=0: bỏ vệt sáng + bóng. reduced: hiện thẳng.
     Mốc chuyển nhịp đi theo animation.finished (WAAPI) nên tự tua nhanh (FFTURN đổi playbackRate) vẫn khớp. */
  const L51 = { n: 0, tot: 0, chain: Promise.resolve(), hide: new Set(), els: new Set() };
  function l51Hide(li, on) {
    if (on) L51.hide.add(li); else L51.hide.delete(li);
    if (L51.hide.size) document.body.dataset.l51 = [...L51.hide].join(" "); else delete document.body.dataset.l51;
  }
  function l51Add(el) { document.body.appendChild(el); L51.els.add(el); return el; }
  function l51Del(el) { if (el) { el.remove(); L51.els.delete(el); } }
  const l51Fin = (a) => (a && a.finished ? a.finished.catch(() => {}) : Promise.resolve());
  const l51Rect = (li) => {
    const lc = document.querySelector(`#board [data-lane="${li}"] .locw .loc`);
    return lc ? { lc, r: lc.getBoundingClientRect() } : null;
  };
  async function l51Run(li, pre, k, g0) {
    const T = (ms) => ms / 2; /* Element.prototype.animate (05) đã nhân mọi thời lượng/độ trễ với SPD: mốc viết theo SPD 2.0 -> chia 2 ở đây */
    const lo = window.FXLV === 0, short = L51.tot >= 2;
    const A = (el, kf, op) => el.animate(kf, Object.assign({ fill: "both", easing: "linear" }, op));
    let c = null, bg = null, landed = false;
    const land = () => {
      if (landed) return; landed = true;
      try { if (pre) pre(); } catch (e) {}
      l51Hide(li, false);
      l51Del(c); l51Del(bg); l51Del(k);
    };
    try {
      const cur = l51Rect(li);
      if (G !== g0 || !cur || cur.r.width < 20) { land(); return; }
      const lc = cur.lc, r0 = cur.r, L = G.locs[li], def = LOC[L.id] || { n: "?", s: "" };
      k.style.cssText = `left:${r0.left.toFixed(1)}px;top:${r0.top.toFixed(1)}px;width:${r0.width.toFixed(1)}px;height:${r0.height.toFixed(1)}px;--lc:#3a376e`;
      /* lá lớn: cỡ + vị trí */
      const VW = innerWidth, VH = innerHeight, asp = r0.width / Math.max(1, r0.height);
      /* gpu68 (vis): lá lớn gọn hơn (≤56% bề ngang, ≤26% chiều cao, ≤340px) — trước 78%/40%/520px quá to; không chặn chạm (pointer-events: none) */
      const cw = Math.round(Math.min(VW * 0.56, VH * 0.26 * asp, Math.min(((document.getElementById("board") || {}).clientWidth || VW), 340))), ch = Math.round(cw / asp);
      const rdc = parseFloat(getComputedStyle(lc).borderTopLeftRadius) || 16, rd = rdc * (cw / r0.width);
      const th = (typeof LTH !== "undefined" && LTH[L.id]) || "thieng";
      const col = (typeof LHUE !== "undefined" && LHUE[L.id]) || (typeof LTC !== "undefined" && LTC[th]) || "#ffd65a";
      bg = l51Add(document.createElement("div")); bg.className = "l51-bg";
      c = l51Add(document.createElement("div")); c.className = "l51-c" + (lo ? " lo" : "");
      c.setAttribute("aria-hidden", "true"); bg.setAttribute("aria-hidden", "true");
      const url = IMGL.has(L.id) ? IMGS.l[L.id] : "";
      c.style.cssText = `left:${Math.round((VW - cw) / 2)}px;top:0;width:${cw}px;height:${ch}px;--rd:${rd.toFixed(1)}px;--lc:${col};font-size:${Math.max(13, cw * 0.074).toFixed(1)}px`;
      c.innerHTML = `<div class="l51-f"${url ? ` style="background-image:url(${url})"` : ""}><i class="l51-sh"></i></div><div class="l51-tx"><div class="l51-nm"><b></b></div><div class="l51-ds"></div></div>`;
      c.querySelector(".l51-nm b").textContent = def.n;
      const nm = c.querySelector(".l51-nm"), ds = c.querySelector(".l51-ds"), sh = c.querySelector(".l51-sh");
      ds.innerHTML = typeof kwfx === "function" ? kwfx(def.s) : def.s;
      const stack = ch + nm.offsetHeight + ds.offsetHeight + cw * 0.05;
      const top = Math.round(Math.max(VH * 0.06, Math.min(VH * 0.4 - stack / 2, VH * 0.94 - stack)));
      c.style.top = top + "px";
      const fresh = l51Rect(li), r1 = fresh ? fresh.r : r0;
      const dx = r0.left + r0.width / 2 - VW / 2, dy = r0.top + r0.height / 2 - (top + ch / 2), s0 = r0.width / cw;
      const dx1 = r1.left + r1.width / 2 - VW / 2, dy1 = r1.top + r1.height / 2 - (top + ch / 2), s1 = r1.width / cw;
      const tf = (x, y, s, d) => `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(4)}) perspective(900px) rotateY(${d}deg)`;
      /* mốc (ms ở SPD 2.0): 350 lật ô đóng | 700 lá lớn lật xong | e3 hết trình diện | e4 chạm ô */
      const e3 = 700 + (short ? 500 : 800), e4 = e3 + 450, D = e4 - 350; /* nhịp 4 = 450 ms (chạm ô lúc 1,95 s) để cộng vệt sáng 0,1 s vẫn ≤ 2,1 s */
      const P = "perspective(700px)";
      /* toàn bộ hoạt ảnh dựng sẵn theo trục thời gian (delay) -> không cộng dồn độ trễ khung hình giữa các nhịp */
      const aK = A(k, [
        { transform: `scale(1) ${P} rotateY(0deg)`, easing: "ease-out" },
        { transform: `scale(1.04) ${P} rotateY(0deg)`, offset: 0.3, easing: "ease-in" },
        { transform: `scale(1.04) ${P} rotateY(90deg)` }
      ], { duration: T(350) });
      l51Fin(aK).then(() => l51Del(k));
      setTimeout(() => l51Del(k), T(350) * (typeof SPD === "number" && SPD > 0 ? SPD : 1) + 40);
      A(bg, [{ opacity: 0 }, { opacity: 1, offset: 350 / D }, { opacity: 1, offset: (e3 - 350) / D }, { opacity: 0 }], { delay: T(350), duration: T(D) });
      const aV = A(c, [{ opacity: 1 }, { opacity: 1 }], { delay: T(350), duration: T(350), fill: "forwards" }); /* hiện lá lớn đúng lúc nhịp 2; finished = đầu nhịp 3 */
      const aT = A(c, [
        { transform: tf(dx, dy, s0, -90), easing: "cubic-bezier(.2,.75,.25,1)" },
        { transform: tf(0, 0, 1, 0), offset: 350 / D, easing: "linear" },
        { transform: tf(0, 0, 1, 0), offset: (e3 - 350) / D, easing: "cubic-bezier(.55,0,.25,1)" },
        { transform: tf(dx1, dy1, s1, 0) }
      ], { delay: T(350), duration: T(D) });
      A(sh, [{ opacity: 0 }, { opacity: 1 }], { delay: T(e3), duration: T(450), easing: "ease-in" });
      const inN = short ? 220 : 300, d0 = short ? 120 : 220, inD = short ? 160 : 300, t3 = e3 - 700, durN = t3 + 500;
      A(nm, [
        { opacity: 0, transform: "translateX(-38%)", easing: "cubic-bezier(.2,.8,.2,1)" },
        { opacity: 1, transform: "none", offset: inN / durN },
        { opacity: 1, transform: "none", offset: t3 / durN },
        { opacity: 0, transform: "none", offset: (t3 + 140) / durN },
        { opacity: 0, transform: "none" }
      ], { delay: T(700), duration: T(durN) });
      const durD = t3 + 500 - d0;
      A(ds, [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "none", offset: inD / durD },
        { opacity: 1, transform: "none", offset: (t3 - d0) / durD },
        { opacity: 0, transform: "none", offset: (t3 - d0 + 140) / durD },
        { opacity: 0, transform: "none" }
      ], { delay: T(700 + d0), duration: T(durD) });
      const spd0 = typeof SPD === "number" && SPD > 0 ? SPD : 1;
      const til = (a, ms) => Promise.race([l51Fin(a), new Promise((r) => setTimeout(r, ms * spd0))]); /* hẹn giờ + finished: khung hình trễ (máy yếu) không làm lệch mốc; tua nhanh thì finished tới trước */
      await til(aV, T(700));
      if (G !== g0) { land(); return; }
      try { SFX.play("loc", 0.85); } catch (e) {} /* đầu nhịp 3, đúng 1 lần */
      await til(aT, T(e4));
      /* chạm ô: lộ mặt thật + một vệt sáng */
      const fin = l51Rect(li), rr = fin ? fin.r : r1;
      land();
      if (!lo && rr.width > 10) {
        const sw = l51Add(document.createElement("div"));
        sw.className = "l51-sw"; sw.setAttribute("aria-hidden", "true");
        sw.style.cssText = `left:${rr.left.toFixed(1)}px;top:${rr.top.toFixed(1)}px;width:${rr.width.toFixed(1)}px;height:${rr.height.toFixed(1)}px;border-radius:${rdc}px`;
        sw.innerHTML = "<i></i>";
        const a = sw.firstChild.animate([{ transform: "translateX(-160%) skewX(-18deg)" }, { transform: "translateX(460%) skewX(-18deg)" }], { duration: T(100), easing: "ease-in-out", fill: "both" });
        l51Fin(a).then(() => l51Del(sw));
        setTimeout(() => l51Del(sw), T(100) * spd0 + 30); /* hẹn giờ gỡ: khung hình trễ không làm vệt sáng sót lâu */
      }
    } catch (e) {
      land();
    } finally {
      if (!landed) land();
    }
  }
  /* trả về Promise (xong khi lá chạm ô) hoặc false nếu không dựng được (người gọi dùng đường cũ) */
  window.gpuLocOpen51 = function (li, pre) {
    const g0 = G, cur = g0 && g0.locs[li] ? l51Rect(li) : null;
    if (!cur || cur.r.width < 20 || cur.r.height < 16 || !cur.lc.animate || !document.body.animate) return false;
    const lc = cur.lc, r0 = cur.r;
    /* ô đóng giả (bản sao .loc, chữ "?") nằm đúng chỗ ô thật; ô thật ẩn bằng body[data-l51] */
    const k = document.createElement("div");
    k.className = "locw hid l51-k"; k.setAttribute("aria-hidden", "true");
    const cl = lc.cloneNode(true);
    const inn = cl.querySelector(".in");
    if (inn) { inn.style.removeProperty("--li"); const q = inn.querySelector(".ln"), t = inn.querySelector(".lt"), lk = inn.querySelector(".lk"); if (q) q.textContent = "?"; if (t) t.textContent = "Lộ diện ở lượt " + (li + 1); if (lk) lk.remove(); }
    k.appendChild(cl);
    k.style.cssText = `left:${r0.left.toFixed(1)}px;top:${r0.top.toFixed(1)}px;width:${r0.width.toFixed(1)}px;height:${r0.height.toFixed(1)}px;--lc:#3a376e`;
    l51Add(k); l51Hide(li, true);
    L51.n++; L51.tot = L51.n === 1 ? 1 : L51.tot + 1;
    const p = L51.chain.then(() => l51Run(li, pre, k, g0)).catch(() => {}).then(() => {
      if (--L51.n <= 0) { L51.n = 0; L51.tot = 0; }
      return true;
    });
    L51.chain = p;
    return p;
  };
  if (typeof locReveal === "function") {
    /* giữa ván (lượt 2/3): ô đã vẽ ở trạng thái lộ diện -> bản sao ô đóng che lại rồi diễn đủ 4 nhịp */
    locReveal = function (li) {
      if (!G || !G.locs[li] || locVeiled(G)) return;
      if (reduced || !gpuLocOpen51(li, null)) { try { SFX.play("loc", 0.85); } catch (e) {} }
    };
    window.gpuLocReveal = locReveal;
  }

  /* gpu51: CƯỢC "ẤN TRIỆN ĐỎ" — con dấu son vuông giáng giữa màn (hoặc nhỏ, lệch lên trên nếu là đối thủ), số cược ×2/×4/×8 ở giữa.
     Ảnh www/img/v/an_trien.webp (IMGS.v.an_trien) nếu có trong danh mục ảnh, không thì vẽ SVG. Không rung màn hình, không chớp. */
  let an51n = 0;
  function an51Svg(id) {
    const g = (x, y, r) => `<use href="#${id}m" transform="translate(${x} ${y}) rotate(${r})"/>`;
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs>
<filter id="${id}w" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed="${3 + (an51n % 5)}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${11 + (an51n % 7)}" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -8 5.3" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>
<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#da2a2e"/><stop offset=".55" stop-color="#bd141d"/><stop offset="1" stop-color="#8f0b14"/></linearGradient>
<path id="${id}m" d="M0 0H30V30H5V10H21V21H12" fill="none" stroke="#ffc7b0" stroke-opacity=".8" stroke-width="3.6" stroke-linecap="square" stroke-linejoin="miter"/>
</defs><g filter="url(#${id}w)">
<rect x="6" y="6" width="188" height="188" rx="8" fill="url(#${id}g)"/>
<rect x="13" y="13" width="174" height="174" rx="4" fill="none" stroke="#6f0710" stroke-opacity=".75" stroke-width="2.4"/>
<rect x="20" y="20" width="160" height="160" rx="2" fill="none" stroke="#ffc7b0" stroke-opacity=".8" stroke-width="3"/>
<rect x="27" y="27" width="146" height="146" rx="1" fill="none" stroke="#ffc7b0" stroke-opacity=".5" stroke-width="1.4"/>
${g(36, 36, 0)}${g(164, 36, 90)}${g(164, 164, 180)}${g(36, 164, 270)}${g(84, 33, 0)}${g(116, 33, 0)}${g(84, 167, 0)}${g(116, 167, 0)}
</g></svg>`;
  }
  const an51Ink = `<svg class="an51-ink" viewBox="0 0 300 300" aria-hidden="true"><defs><radialGradient id="an51r"><stop offset="0" stop-color="#b3121c" stop-opacity=".62"/><stop offset=".7" stop-color="#b3121c" stop-opacity=".3"/><stop offset="1" stop-color="#b3121c" stop-opacity="0"/></radialGradient></defs><path d="M150 14c34 4 52 20 82 22 26 12 36 38 46 66 4 28-6 44-12 70-10 30-30 52-62 62-34 10-56-8-88-10-30-8-52-26-58-62-6-32 4-54 14-78 14-26 40-34 78-70z" fill="url(#an51r)"/><g fill="#b3121c" fill-opacity=".55"><circle cx="30" cy="70" r="6"/><circle cx="268" cy="214" r="7"/><circle cx="46" cy="246" r="4"/><circle cx="262" cy="52" r="4.5"/><circle cx="150" cy="288" r="3.5"/></g></svg>`;
  function snapFx51(c, txt, opp) {
    if (reduced) return;
    const VW = innerWidth, VH = innerHeight, S0 = Math.round(Math.min(VW * 0.56, VH * 0.3, 260));
    const S = opp ? Math.round(S0 * 0.62) : S0, cx = VW / 2, cy0 = Math.round(VH * 0.42);
    const cy = opp ? Math.round(Math.max(S / 2 + VH * 0.09, cy0 - S0 * 0.62)) : cy0;
    const spd = typeof SPD === "number" && SPD > 0 ? SPD : 1; /* 05 nhân SPD vào mọi WAAPI -> chia lại để ấn luôn ~1,4 s thật */
    const id = "an51" + (++an51n) + "_";
    const img = typeof IMGS !== "undefined" && IMGS.v && IMGS.v.an_trien;
    const d = document.createElement("div");
    d.className = "an51" + (opp ? " opp" : "") + (window.FXLV === 0 ? " lo" : "");
    d.setAttribute("aria-hidden", "true");
    d.style.cssText = `left:${Math.round(cx - S / 2)}px;top:${Math.round(cy - S / 2)}px;width:${S}px;height:${S}px;font-size:${S}px`;
    d.innerHTML = (window.FXLV === 0 ? "" : an51Ink) + `<div class="an51-s">${img ? `<img src="${img}" alt="" draggable="false">` : an51Svg(id)}</div><b></b>`;
    d.querySelector("b").textContent = txt;
    document.body.appendChild(d);
    const ink = d.querySelector(".an51-ink"), seal = d.querySelector(".an51-s");
    const done = () => d.remove();
    seal.animate([
      { transform: "scale(1.8)", opacity: 0, offset: 0, easing: "cubic-bezier(.55,0,.9,.5)" },
      { transform: "scale(1)", opacity: 1, offset: 0.13 },
      { transform: "scale(1.035,.95) translateY(1.5%)", opacity: 1, offset: 0.17, easing: "ease-out" },
      { transform: "scale(1)", opacity: 1, offset: 0.23 },
      { transform: "scale(1)", opacity: 1, offset: 0.78 },
      { transform: "scale(1.03)", opacity: 0, offset: 1 }
    ], { duration: 1380 / spd, easing: "linear", fill: "both" });
    const b = d.querySelector("b");
    b.animate([
      { transform: "scale(1.8)", opacity: 0, offset: 0, easing: "cubic-bezier(.55,0,.9,.5)" },
      { transform: "scale(1)", opacity: 1, offset: 0.13 },
      { transform: "scale(1.035,.95) translateY(1.5%)", opacity: 1, offset: 0.17, easing: "ease-out" },
      { transform: "scale(1)", opacity: 1, offset: 0.23 },
      { transform: "scale(1)", opacity: 1, offset: 0.78 },
      { transform: "scale(1.03)", opacity: 0, offset: 1 }
    ], { duration: 1380 / spd, easing: "linear", fill: "both" });
    if (ink) ink.animate([
      { transform: "scale(.6)", opacity: 0, offset: 0 },
      { transform: "scale(.7)", opacity: 0, offset: 0.12 },
      { transform: "scale(1)", opacity: 1, offset: 0.3, easing: "ease-out" },
      { transform: "scale(1.06)", opacity: 0.9, offset: 0.78 },
      { transform: "scale(1.1)", opacity: 0, offset: 1 }
    ], { duration: 1380 / spd, easing: "linear", fill: "both" }).onfinish = done;
    else seal.getAnimations()[0].onfinish = done;
    setTimeout(done, 3500);
  }
  snapFx = snapFx51;
  window.snapFx = snapFx51;

  function syncSlamAndHud(prevSet) {
    schedOppMetrics();
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

  /* ==================== 8. BẢNG TEST HIỆU ỨNG & ÂM THANH (CHỈ CHO NHÀ PHÁT TRIỂN) ====================
     gpu23: mã bảng test nằm ở js/dev-vfx-lab.js (+ css/dev-vfx-lab.css), chỉ nạp khi bấm nút "✨ Bảng Test VFX" ở sảnh
     hoặc nút mở bảng trong Cài đặt > Nâng cao. Ở đây chỉ gắn 2 nút đó và đưa ra các hàm nội bộ mà bảng test cần. */
  window.VFX08_LAB = {
    clamp, smoothAnim, build3DArcFrames, gpuFlash, streamBezierRibbon, pushOppNotif, playCardStealSwap, spawnSoulSiphonOrb,
    playDeckOrHandSteal, animateFastCardPlace, animateFastCardUnplay
  };
  const LAB_VER = (() => { try { return new URL(document.currentScript.src).searchParams.get("v") || ""; } catch (e) { return ""; } })();
  /* thư mục js/ thật của chính file này (bản thử ở thư mục con có <base href="../"> nên không dùng đường dẫn tương đối) */
  const LAB_JS = (() => { try { return new URL(".", document.currentScript.src).href; } catch (e) { return "js/"; } })();
  const LAB_CSS = (() => { try { return new URL("../css/", document.currentScript.src).href; } catch (e) { return "css/"; } })();
  let labLoad = null;
  function loadVfxLab() {
    if (window.VFXLAB) return Promise.resolve(window.VFXLAB);
    if (labLoad) return labLoad;
    const q = LAB_VER ? "?v=" + LAB_VER : "";
    const css = new Promise((res) => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = LAB_CSS + "dev-vfx-lab.css" + q;
      l.onload = l.onerror = res;
      document.head.appendChild(l);
    });
    const js = new Promise((res, rej) => {
      const sc = document.createElement("script");
      sc.src = LAB_JS + "dev-vfx-lab.js" + q;
      sc.onload = res;
      sc.onerror = rej;
      document.body.appendChild(sc);
    });
    labLoad = Promise.all([css, js]).then(() => window.VFXLAB, (e) => { labLoad = null; throw e; });
    return labLoad;
  }
  function addVfxLabButtons() {
    const lobby = null; /* gpu52: nút dev ở sảnh che hàng nút (Nhiệm vụ, Hộp thư) — chỉ giữ nút trong Cài đặt > Nâng cao */
    if (lobby) {
      const lbBtn = document.createElement("button");
      lbBtn.type = "button";
      lbBtn.id = "lbVfxTest";
      lbBtn.textContent = "✨ Bảng Test VFX";
      lobby.appendChild(lbBtn);
      lbBtn.addEventListener("click", () => { loadVfxLab().then((L) => L.toggleLab()).catch(() => {}); });
    }

    const setReimg = $id("setReimg");
    if (setReimg && setReimg.parentNode) {
      const sBtn = document.createElement("button");
      sBtn.type = "button";
      sBtn.className = "btn end sx-btn";
      sBtn.textContent = "✨ Mở Bảng Test Hiệu Ứng (Ghim Cố Định)";
      setReimg.parentNode.appendChild(sBtn); /* nút dev nằm trong mục Nâng cao */
      sBtn.addEventListener("click", () => {
        $id("ovSet").classList.remove("on");
        loadVfxLab().then((L) => L.openLab()).catch(() => {});
      });
    }
  }

  addVfxLabButtons();
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
      /* gpu60 (PA6): mức hiệu ứng chuỗi linh hồn khi chọn Tự động: Đầy đủ ≥ 50, Vừa ≥ 36, còn lại Nhẹ */
      window.P6FPS = Math.round(fps);
      window.P6AUTO = fps >= 50 ? "full" : fps >= 36 ? "mid" : "lite";
      try { if (window.P6) P6.syncUi(); } catch (e) {}
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

/* ==================== gpu22: CHẾ ĐỘ KHUNG HÌNH 60 / 30 / TỰ ĐỘNG ====================
   60: không giới hạn (theo màn hình, thường 60). 30: mọi vòng vẽ JS (hạt GPU, lớp 2D, hoạt cảnh canvas,
   đồng hồ) chạy 30 khung/giây đều đặn, đỡ nóng máy và pin. Tự động: đầu mỗi trận đo thật; máy không giữ
   nổi khoảng 45 khung/giây thì tự khoá 30 cho đều (30 đều mắt hơn 40 giật). Hoạt ảnh CSS do GPU tự chạy. */
(function () {
  "use strict";
  const KEY = "ltd_fps";
  let mode = "auto";
  try { const v = localStorage.getItem(KEY); if (v === "60" || v === "30" || v === "auto") mode = v; } catch (e) {}
  const raf0 = window.requestAnimationFrame.bind(window);
  const caf0 = window.cancelAnimationFrame.bind(window);
  let cap = mode === "30" ? 30 : 0, autoCap = 0, seq = 0, drv = 0, last = 0, measuring = false;
  const q = new Map();
  function curCap() { return measuring ? 0 : (mode === "30" ? 30 : mode === "auto" ? autoCap : 0); }
  function driver(t) {
    drv = 0;
    if (!q.size) return;
    const c = curCap();
    if (c && t - last < 1000 / c - 4) { drv = raf0(driver); return; }
    last = t;
    const cbs = Array.from(q.values());
    q.clear();
    for (const cb of cbs) { try { cb(t); } catch (e) { setTimeout(() => { throw e; }); } }
  }
  window.requestAnimationFrame = function (cb) {
    if (!curCap()) return raf0(cb);
    const id = --seq;
    q.set(id, cb);
    if (!drv) drv = raf0(driver);
    return id;
  };
  window.cancelAnimationFrame = function (id) { if (id < 0) q.delete(id); else caf0(id); };

  /* đo thật đầu mỗi trận (chế độ Tự động) */
  let lastG = null;
  function inBattle() {
    try {
      if (document.hidden || typeof G === "undefined" || !G || G.phase === "over") return false;
      const lb = document.getElementById("lobby");
      return !(lb && lb.classList.contains("on")) && !document.querySelector(".ov.on");
    } catch (e) { return false; }
  }
  function measure() {
    measuring = true;
    let n = 0, t0 = 0;
    const f = (t) => {
      if (!inBattle()) { measuring = false; return; }
      if (!t0) t0 = t;
      n++;
      if (t - t0 < 2500) { raf0(f); return; }
      measuring = false;
      const fps = n * 1000 / (t - t0);
      autoCap = fps < 45 ? 30 : 0;
      window.FPS_MEASURED = Math.round(fps);
    };
    raf0(f);
  }
  setInterval(() => {
    if (mode !== "auto" || measuring || !inBattle()) return;
    if (G !== lastG) { lastG = G; setTimeout(() => { if (inBattle()) measure(); }, 3200); }
  }, 2000);

  function label() {
    if (mode === "60") return "Luôn ưu tiên mượt nhất máy cho phép.";
    if (mode === "30") return "Khoá 30 khung/giây: mát máy, đỡ tốn pin.";
    return autoCap ? "Tự động: máy đang chạy ổn định ở 30 khung/giây." : "Tự động: đang chạy 60 khung/giây, đo lại đầu mỗi trận.";
  }
  window.FPSMODE = {
    get mode() { return mode; },
    set(m) { if (m !== "60" && m !== "30" && m !== "auto") return; mode = m; try { localStorage.setItem(KEY, m); } catch (e) {} syncUi(); },
    get cap() { return curCap(); },
    label,
    syncUi /* openSet (05) gọi khi mở Cài đặt */
  };
  function syncUi() {
    const seg = document.getElementById("setFpsSeg");
    if (seg) seg.querySelectorAll(".sx-pill").forEach((b) => { const on = b.dataset.k === mode; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    const n = document.getElementById("setFpsNote");
    if (n) n.textContent = label();
  }
  const seg = document.getElementById("setFpsSeg");
  if (seg) {
    seg.addEventListener("click", (e) => {
      const b = e.target.closest(".sx-pill");
      if (!b) return;
      window.FPSMODE.set(b.dataset.k);
      try { SFX.play("tap"); } catch (er) {}
    });
  }
  syncUi();
})();

/* ==================== gpu35: LỚP TRẠNG THÁI TRÊN BODY (thay cho body:has(...) trong CSS) ====================
   body.lbon = sảnh đang mở, body.ovon = có bảng phủ .ov đang mở, body.ovfull = có bảng phủ không phải dạng tấm (.sheet),
   body.mmon = màn ghép trận. Bộ chọn body:has(#lobby.on) X buộc trình duyệt xét lại :has() cho mọi phần tử X
   mỗi lần tính style (đo: dựng lại sân ~15 ms -> ~8 ms khi bỏ :has). Chỉ theo dõi thuộc tính class của vài phần tử. */
(function () {
  "use strict";
  const b = document.body, lb = document.getElementById("lobby"), mm = document.getElementById("mm");
  if (!b) return;
  const on = (el) => !!el && el.classList.contains("on");
  function sync() {
    const lbo = on(lb);
    b.classList.toggle("lbon", lbo);
    b.classList.toggle("ovon", !!document.querySelector("body > .ov.on"));
    b.classList.toggle("ovfull", !!document.querySelector("body > .ov.on:not(.sheet)"));
    b.classList.toggle("mmon", on(mm));
  }
  const mo = new MutationObserver(sync), opt = { attributes: true, attributeFilter: ["class"] };
  const watch = (el) => { if (el && el.nodeType === 1 && !el._st35 && (el === lb || el === mm || el.classList.contains("ov"))) { el._st35 = 1; mo.observe(el, opt); } };
  watch(lb); watch(mm); document.querySelectorAll("body > .ov").forEach(watch);
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) watch(n); sync(); }).observe(b, { childList: true });
  sync();
})();
