/* Module 09 (v2 AAA): Hệ Thống Hoạt Cảnh Tranh Vẽ Đông Sơn & Dây Kéo Mesh-Ribbon 60fps
 * - Xoá bỏ 100% hình vẽ SVG phẳng/hoạt hình; sử dụng trọn bộ 133 sprite tranh vẽ phát sáng (.webp) phong cách Đông Sơn Huyền Sử.
 * - Dây kéo vật lý biến dạng ảnh vẽ thật trên High-DPI Canvas2D (Xúc tu bạch tuộc uốn lượn, Đinh ba & Lưới tơ pha lê, Rễ đa Chú Cuội, Dây móc câu, Từ trường Nam Châm Tiên, Vòi rồng Phong Thần).
 * - Đòn đánh 3 nhịp chuẩn Marvel Snap / Legends of Runeterra: Nhún lấy đà + Tàn ảnh 3D -> Phóng đạo cụ cỡ lớn (130px–185px) -> Hit-Stop 45ms + Nổ đa lớp (Sóng xung kích + Nổ nguyên tố + Vết chém/Vết lõm/Mảnh vỡ).
 */
(function () {
  "use strict";

  const $id = (id) => document.getElementById(id);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* gpu24: nhịp gọn hơn (SPD mặc định đã là 'rất chậm' ×2.0 nên thời gian gốc phải ngắn để vẫn rõ mà không ì) */
  try {
    if (typeof T8 === "object" && T8) {
      T8.LIFT = 100;
      T8.FLY = 280;
      T8.REACT = 220;
      T8.BACK = 280;
      T8.GAP = 120;
    }
  } catch (e) {}

  /* ==================== 1. ĐĂNG KÝ & NẠP SẴN KHO 133 TRANH VẼ ĐẠO CỤ ĐÔNG SƠN (.WEBP) ==================== */
  const NEW_PAINTED_VFX = {
    nam_dam_lua: "img/v/v_nam_dam_lua.webp?v=gpu19",
    quyen_nuoc:  "img/v/v_quyen_nuoc.webp?v=gpu19",
    cung_doc:    "img/v/v_cung_doc.webp?v=gpu19",
    ham_nanh:    "img/v/v_ham_nanh.webp?v=gpu19",
    ham_tren:    "img/v/v_ham_tren.webp?v=gpu19",
    ham_duoi:    "img/v/v_ham_duoi.webp?v=gpu19",
    bua_ren:     "img/v/v_bua_ren.webp?v=gpu19",
    luoi_nhen:   "img/v/v_luoi_nhen.webp?v=gpu19",
    re_da:       "img/v/v_re_da.webp?v=gpu19",
    quan_co:     "img/v/v_quan_co.webp?v=gpu19",
    phao_tre:    "img/v/v_phao_tre.webp?v=gpu19",
    vet_lom:     "img/v/v_vet_lom.webp?v=gpu19"
  };

  if (typeof IMGS === "object" && IMGS) {
    if (!IMGS.v) IMGS.v = {};
    for (const k in NEW_PAINTED_VFX) if (!IMGS.v[k]) IMGS.v[k] = NEW_PAINTED_VFX[k];
  }

  const VFX_IMG_CACHE = new Map();

  function vfxUrl(key) {
    if (!key) return "";
    if (typeof IMGS === "object" && IMGS && IMGS.v && IMGS.v[key]) return IMGS.v[key];
    return `img/v/v_${key}.webp?v=gpu19`;
  }

  function getVfxImg(key) {
    if (!key) return null;
    let im = VFX_IMG_CACHE.get(key);
    if (im) return im;
    const url = vfxUrl(key);
    if (!url) return null;
    im = new Image();
    im.decoding = "async";
    im.src = url;
    VFX_IMG_CACHE.set(key, im);
    return im;
  }

  /* Chỉ nạp sẵn 8 dải dây kéo ngang dùng trên Canvas2D (toàn bộ 137 tờ v16 đã tải thông minh theo bộ bài trận đấu) */
  const CORE_PRELOAD_KEYS = [
    "luoi_nhen", "re_da", "day", "xich",
    "batty", "huyetdichhangxom", "nhenhacdich", "nhennhan"
  ];
  for (const k of CORE_PRELOAD_KEYS) getVfxImg(k);

  const DEMO_CARD_IDS = [
    "thietquyen", "giaphuydiet", "giacdausi", "songchuynu", "tinhquyennu", "docxanu",
    "loithan", "kiemlongnhan", "satvuong", "huyetdich", "thantien", "tutraonu",
    "chonphao", "nhennhan", "batty", "bachho", "tunu", "batkhacan", "thoren",
    "kiemsu", "linhtuonglai", "kychu", "thuytoquyen", "kiemnuuminh"
  ];
  if (typeof spLoad === "function") {
    for (const cid of DEMO_CARD_IDS) spLoad(cid);
  }

  function spriteHtml(key, durMs, f0, f1) {
    if (typeof window.v16Html === "function") {
      const h16 = window.v16Html(key, durMs || 460, f0 != null ? f0 : 0, f1 != null ? f1 : 15);
      if (h16) return h16;
    }
    const u = vfxUrl(key);
    getVfxImg(key);
    return `<img src="${u}" alt="" draggable="false">`;
  }

  /* Bảng tương thích PROPS (trả về 100% ảnh tranh vẽ .webp, tuyệt đối không còn vector SVG phẳng) */
  const PROPS = {
    fist_gold: () => spriteHtml("nam_dam_lua"),
    fist_palm: () => spriteHtml("quyensu"),
    fist_water: () => spriteHtml("quyen_nuoc"),
    kick_boot: () => spriteHtml("nam_dam_lua"),
    twin_daggers: () => spriteHtml("songchuynu"),
    poker_cards: () => spriteHtml("baithu"),
    bow_mount: () => spriteHtml("cung_doc"),
    arrow_venom: () => spriteHtml("nuthantien"),
    arrow_royal: () => spriteHtml("ten"),
    bamboo_cannon: () => spriteHtml("phao_tre"),
    cannon_shell: () => spriteHtml("tieulong"),
    dragon_blade: () => spriteHtml("kiemlongnhan"),
    great_blade: () => spriteHtml("dao"),
    ivory_tusks: () => spriteHtml("batkhacan"),
    jaw_top: () => spriteHtml("ham_tren"),
    jaw_bot: () => spriteHtml("ham_duoi"),
    shadow_claws: () => spriteHtml("tutraonu"),
    yama_seal: () => spriteHtml("satvuong"),
    thunder_hammer: () => spriteHtml("nuloithan"),
    venom_glob: () => spriteHtml("docnutrang"),
    silence_ribbon: () => spriteHtml("mehoacnu"),
    bronze_mirror: () => spriteHtml("guong"),
    goose_feather: () => spriteHtml("cohoang"),
    forge_hammer: () => spriteHtml("bua_ren"),
    bamboo_kite: () => spriteHtml("cohoang"),
    paper_talisman: () => spriteHtml("bua_chu"),
    golden_persimmon: () => spriteHtml("socnu"),
    chess_piece: () => spriteHtml("quan_co"),
    wind_tornado: () => spriteHtml("phongnu"),
    web_net: () => spriteHtml("luoi_nhen"),
    banyan_hook: () => spriteHtml("re_da"),
    grapple_claw: () => spriteHtml("day"),
    magnet_u: () => spriteHtml("tunu"),
    dent_crater: () => spriteHtml("vet_lom"),
    cross_gash: () => spriteHtml("vet_chem")
  };

  /* ==================== 2. PHÂN LOẠI KÉO / ĐẨY / VŨ KHÍ RIÊNG CHO TOÀN BỘ 314 THẺ LẬT & KÍCH HOẠT ==================== */
  const PULL_MAP = {
    nhennhan: "web",
    nhenma: "web",
    nhennon: "web",
    nhenhacdich: "web",
    cuduto: "web",
    nhenngaymoi: "web",
    giacquannhen: "web",
    tonu: "silk",
    bato: "silk",
    tunu: "magnet",
    tuvuong: "magnet",
    dakhonggian: "magnet",
    chomay: "magnet",
    cogiapnhen: "magnet",
    batty: "tentacle",
    dianang: "tentacle",
    huyetdichhangxom: "blood_tentacle",
    diphapsu: "talisman",
    aochoangtoi: "talisman",
    niemluctu: "talisman",
    chutruongnu: "talisman",
    phongnu: "tornado",
    linhtuonglai: "banyan",
    tenmoc: "hook",
    giacdausi: "hook"
  };

  function getPullKind(id) {
    if (id && PULL_MAP[id]) return PULL_MAP[id];
    const m = (((typeof MOTA !== "undefined" && MOTA[id]) || "") + " " + ((typeof C !== "undefined" && C[id] && C[id].n) || "") + " " + ((typeof C !== "undefined" && C[id] && C[id].x) || "")).toLowerCase();
    if (/tơ lụa|dệt|khung cửi|con thoi/.test(m)) return "silk";
    if (/nhện|tơ|kén/.test(m)) return "web";
    if (/nam châm|từ trường|sắt|đồng|máy|cơ khí/.test(m)) return "magnet";
    if (/huyết|máu/.test(m) && /xúc tu|vòi|đỉa/.test(m)) return "blood_tentacle";
    if (/bạch tuộc|xúc tu|đỉa|vòi|nhầy/.test(m)) return "tentacle";
    if (/gió|phong|bão|lốc|mây/.test(m)) return "tornado";
    if (/pháp|bùa|đạo|niệm|hồn|ấn/.test(m)) return "talisman";
    if (/cuội|cây|rừng|dây leo|mộc|đa/.test(m)) return "banyan";
    return "hook";
  }

  const PUSH_MAP = {
    thietquyen: "punch_gold",
    thuytoquyen: "punch_water",
    dannguoi: "punch_gold",
    kiemlongnhan: "blade_knock",
    batkhacan: "tusks",
    phonghiem: "tusks",
    thukieu: "wind_gust",
    giocothuat: "wind_gust",
    daibay: "wind_gust",
    kychu: "chess"
  };

  function getPushKind(id) {
    if (id && PUSH_MAP[id]) return PUSH_MAP[id];
    const m = (((typeof MOTA !== "undefined" && MOTA[id]) || "") + " " + ((typeof C !== "undefined" && C[id] && C[id].n) || "") + " " + ((typeof C !== "undefined" && C[id] && C[id].x) || "")).toLowerCase();
    if (/nước|thuỷ|sóng/.test(m) && /quyền|đấm|võ/.test(m)) return "punch_water";
    if (/võ|quyền|đấm|cước|đá|lôi đài/.test(m)) return "punch_gold";
    if (/kiếm|đao|chém|thương|giáo/.test(m)) return "blade_knock";
    if (/voi|ngà|tê giác|trâu|húc|khiên|giáp/.test(m)) return "tusks";
    if (/cờ|kỳ chủ/.test(m)) return "chess";
    return "wind_gust";
  }

  const CARD_STYLE = {
    /* A1: Thiết Quyền Đông Sơn, Ấn Chưởng Vàng & Thủy Tổ Quyền */
    quyensu: "melee_fist",
    thietquyen: "melee_fist",
    thuytoquyen: "water_fist",
    giacdausi: "arena_ko",
    chanthutienhoa: "melee_fist",
    daudanthieunu: "melee_fist",
    dannguoi: "melee_fist",
    cunemthantoc: "sky_hammer",
    giaphuydiet: "destroyer_beam",

    /* A2: Song Chuỷ Nón Lá & Xúc Xắc / Phi Bài */
    songchuynu: "throw_daggers",
    quangchuy: "throw_daggers",
    baithu: "throw_cards",
    aosi: "throw_cards",
    dichdo: "throw_cards",
    kerinh: "throw_daggers",
    linhgaccuoi: "throw_daggers",

    /* A3: Giương Cung Tre Thần / Nỏ Độc & Pháo Rồng Tre */
    docxanu: "shoot_venom_bow",
    tenaxit: "shoot_venom_bow",
    hongtam: "shoot_royal_bow",
    nuhongtam: "shoot_royal_bow",
    bavuongmienvien: "shoot_royal_bow",
    thantien: "shoot_royal_bow",
    nuthantien: "shoot_royal_bow",
    tenmoc: "shoot_royal_bow",
    chonphao: "shoot_cannon",
    phaodaimay: "shoot_cannon",
    mintuxa: "shoot_cannon",

    /* A4: Đại Đao / Long Kiếm / U Minh Kiếm Trảm */
    kiemlongnhan: "slash_cleave",
    kiemsu: "slash_cleave",
    daothosan: "slash_cleave",
    kiemnupho: "slash_cleave",
    ngankiemsi: "slash_cleave",
    quadao: "slash_cleave",
    lucsatnu: "slash_cleave",
    kiemquyen: "slash_cleave",
    kiemnuuminh: "slash_cleave",
    cuongdomienvien: "slash_cleave",
    nguuma: "slash_cleave",

    /* A5: Mãnh Thú Ngoạm Nuốt & Ngũ Tử Trảo */
    huyetdich: "beast_devour",
    xacmay: "beast_devour",
    hacdich: "beast_devour",
    xactinhquang: "beast_devour",
    xachacdich: "beast_devour",
    bachho: "beast_bite",
    hacbaovuong: "beast_bite",
    langthan: "beast_bite",
    tutraonu: "claw_rip",
    monghoang: "claw_rip",
    culongco: "claw_rip",
    phonghiem: "shield_bash",

    /* A8: Búa Sấm Lôi Thần & Ấn Phán Quan Diêm Vương */
    satvuong: "yama_judge",
    nuloimienvien: "sky_hammer",
    nuloithan: "sky_hammer",
    tuthanmienvien: "yama_judge",
    loithan: "sky_hammer",
    buasam: "sky_hammer",
    thachquaitienhoa: "sky_hammer",

    /* A9: Độc Dược Liên Hoa & Phách Ca Trù Phong Ấn */
    nhennu: "venom_hex",
    docnutrang: "venom_hex",
    bocap: "venom_hex",
    ongnutienhoa: "venom_hex",
    ongvang: "venom_hex",
    docdich: "venom_hex",
    virutcosinh: "venom_hex",
    luahacdiem: "venom_hex",
    camvuong: "mystic_seal",
    mehoacnu: "mystic_seal",
    hopamdiectai: "mystic_seal",
    bongma: "mystic_seal",
    dianang: "mystic_seal",
    maynuotthoigian: "mystic_seal",
    hongve: "mystic_seal",
    nguyetyeu: "mystic_seal",

    /* A10: Gương Đồng Đông Sơn & Cánh Diều / Lông Vũ Sao Chép */
    xucgiacnu: "mirror_copy",
    anhcothuat: "mirror_copy",
    dainao: "mirror_copy",
    nguyetdong: "mirror_copy",
    bachhau: "feather_copy",
    linhtuonglai: "banyan_steal",
    yeutinhluc: "goblin_flip",
    yeutinhcam: "goblin_flip",

    /* A11 & A12: Búa Rèn Đúc Đồng, Quả Thị Vàng, Diều Sáo, Linh Phù */
    thoren: "forge_strike",
    thantho: "forge_strike",
    khuonmauchu: "forge_strike",
    thietthieunien: "forge_strike",
    longuclua: "forge_strike",
    tinhquyennu: "persimmon_gift",
    tocnuhoang: "persimmon_gift",
    socnu: "persimmon_gift",
    cohoang: "kite_summon",
    dathuctai: "kite_summon",
    tasu: "talisman_summon",
    hongphuthuy: "talisman_summon"
  };

  function resolveStyle(id, stepKind) {
    if (id && CARD_STYLE[id]) return CARD_STYLE[id];
    const m = (((typeof MOTA !== "undefined" && MOTA[id]) || "") + " " + ((typeof C !== "undefined" && C[id] && C[id].n) || "") + " " + ((typeof C !== "undefined" && C[id] && C[id].x) || "")).toLowerCase();

    if (stepKind === "sil") return "mystic_seal";
    if (stepKind === "copy") return /lông|chim|ngỗng|mây|hạc|phượng/.test(m) ? "feather_copy" : "mirror_copy";
    if (stepKind === "steal") return "claw_rip";
    if (stepKind === "summon") {
      if (/diều|chim|ưng|phượng|cánh/.test(m)) return "kite_summon";
      return "talisman_summon";
    }
    if (stepKind === "up" || stepKind === "reset" || stepKind === "cost") {
      if (/rèn|đúc|búa|lò|sắt|đồng|giáp|máy/.test(m)) return "forge_strike";
      if (/cung|nỏ|tên/.test(m)) return "shoot_royal_bow";
      return "persimmon_gift";
    }
    if (/cung|nỏ|bắn tên|mũi tên|xạ/.test(m)) return /độc|axit|rắn/.test(m) ? "shoot_venom_bow" : "shoot_royal_bow";
    if (/pháo|súng|đạn|mìn|tên lửa/.test(m)) return "shoot_cannon";
    if (/dao găm|song chuỷ|phi đao|phi tiêu|ám khí|nón lá/.test(m)) return "throw_daggers";
    if (/bài|xúc xắc|đồng xu|ảo thuật/.test(m)) return "throw_cards";
    if (/quyền|đấm|võ sư|đấu sĩ|cước/.test(m)) return /nước|thuỷ|sóng/.test(m) ? "water_fist" : "melee_fist";
    if (/búa|sấm|sét|phán quan|diêm vương|thiên thạch|đá tảng/.test(m)) return "sky_hammer";
    if (/vuốt|trảo|cào/.test(m)) return "claw_rip";
    if (/hổ|sói|báo|cá sấu|ngư tinh|hồ tinh|cắn|nanh|nuốt|quái cá|rồng/.test(m) && !/kiếm/.test(m)) {
      return stepKind === "kill" && /bạn tại đây/.test((typeof C !== "undefined" && C[id] && C[id].x) || "") ? "beast_devour" : "beast_bite";
    }
    if (/kiếm|đao|mã tấu|gươm|rìu|thương|giáo|chém/.test(m)) return "slash_cleave";
    if (/độc|rết|nhện|ong|rắn|sương|nhớt|vi-rút/.test(m)) return "venom_hex";
    if (id && typeof SIGV === "object" && SIGV[id]) {
      const ku = SIGV[id].kieu;
      if (ku === "giang") return "sky_hammer";
      if (ku === "nem_vong") return "throw_daggers";
      if (ku === "quet") return "slash_cleave";
    }
    return stepKind === "kill" ? "slash_cleave" : "mystic_seal";
  }

  /* Chọn đúng sprite tranh vẽ riêng của thẻ từ SIGV (đủ 80/80 thẻ có tờ 16 khung v16!) hoặc fallback sang vũ khí Đông Sơn */
  function pickCardSpriteKey(srcId, fallbackKey, allowedKieu) {
    if (srcId && typeof SIGV === "object" && SIGV[srcId]) {
      const k = String(SIGV[srcId].img || "").replace(/^v_/, "") || srcId;
      if (typeof IMGS === "object" && IMGS && IMGS.v16 && IMGS.v16[k] && SIGV[srcId].kieu !== "keo") {
        return k;
      }
      if (typeof IMGS === "object" && IMGS && IMGS.v && IMGS.v[k]) {
        if (!allowedKieu || allowedKieu.includes(SIGV[srcId].kieu)) return k;
      }
    }
    return fallbackKey;
  }

  /* ==================== 3. BỘ DỰNG SPRITE TRANH VẼ, NỔ ĐA LỚP, TÀN ẢNH 3D & HIT-STOP 45MS ==================== */
  /* gpu24: cỡ hiệu ứng tính theo cỡ thẻ trên sân (không bao giờ lớn hơn ~1.6x thẻ sau khi phóng) */
  function cwB() { const m = document.querySelector("#board .mc"); const w = m ? m.getBoundingClientRect().width : 0; return w > 20 ? w : 56; }
  function capSz(W, H, k) { const m = Math.max(W, H), cap = cwB() * k; if (m <= cap) return [W, H]; const f = cap / m; return [W * f, H * f]; }
  function spawnProp(htmlOrKey, x, y, w, h, glowCol, zIndex, screenBlend) {
    const d = document.createElement("div");
    d.className = "choreo-prop" + (screenBlend ? " choreo-screen" : "");
    let [W, H] = capSz(w || 128, h || w || 128, screenBlend ? 1.5 : 1.15);
    d.style.cssText = `width:${W.toFixed(0)}px;height:${H.toFixed(0)}px;left:${(x - W / 2).toFixed(1)}px;top:${(y - H / 2).toFixed(1)}px;--cp-glow:${glowCol || "#ffd65a"};z-index:${zIndex || 38}`;
    d.innerHTML = htmlOrKey && htmlOrKey.charAt(0) === "<" ? htmlOrKey : spriteHtml(htmlOrKey, 440, 1, 14);
    document.body.appendChild(d);
    if (typeof window.v16Activate === "function") window.v16Activate(d);
    return d;
  }

  function spawnPaintedBurst(key, x, y, size, glowCol, durMs, rotDeg) {
    if (typeof reduced !== "undefined" && reduced) return null;
    const d = document.createElement("div");
    d.className = "choreo-burst";
    const S = Math.min(size || 168, cwB() * 1.5);
    const D = Math.min(durMs || 460, 420);
    const hasV16 = typeof IMGS === "object" && IMGS && IMGS.v16 && !!IMGS.v16[key];
    d.style.cssText = `width:${S.toFixed(0)}px;height:${S.toFixed(0)}px;left:${(x - S / 2).toFixed(1)}px;top:${(y - S / 2).toFixed(1)}px;--cb-glow:${glowCol || "#ffb84d"}`;
    d.innerHTML = spriteHtml(key, D, 0, 15);
    document.body.appendChild(d);
    if (typeof window.v16Activate === "function") window.v16Activate(d);
    const r0 = rotDeg || 0;
    const kf = hasV16
      ? [
          { transform: `rotate(${r0}deg) scale(0.88)`, opacity: 0.96, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { transform: `rotate(${r0 + 2}deg) scale(1.04)`, opacity: 1, offset: 0.22 },
          { transform: `rotate(${r0 + 4}deg) scale(1.06)`, opacity: 1, offset: 0.86 },
          { transform: `rotate(${r0 + 6}deg) scale(1.08)`, opacity: 0 }
        ]
      : [
          { transform: `rotate(${r0}deg) scale(0.28)`, opacity: 0.95, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { transform: `rotate(${r0 + 10}deg) scale(1.10)`, opacity: 1, offset: 0.25 },
          { transform: `rotate(${r0 + 16}deg) scale(1.09)`, opacity: 0.88, offset: 0.62 },
          { transform: `rotate(${r0 + 24}deg) scale(1.17)`, opacity: 0 }
        ];
    const a = d.animate(kf, { duration: D, easing: "linear", fill: "forwards" });
    a.onfinish = () => d.remove();
    fxT(() => d.remove(), D + 100);
    return d;
  }

  function spawnMark(htmlOrKey, x, y, size, glowCol, durMs, rotDeg, screenMode) {
    if (typeof reduced !== "undefined" && reduced) return null;
    const d = document.createElement("div");
    d.className = "choreo-mark" + (screenMode ? " choreo-mark-screen" : "");
    const S = Math.min(size || 142, cwB() * 1.5);
    const D = Math.min(durMs || 560, 460);
    d.style.cssText = `width:${S.toFixed(0)}px;height:${S.toFixed(0)}px;left:${(x - S / 2).toFixed(1)}px;top:${(y - S / 2).toFixed(1)}px;--cm-glow:${glowCol || "#ff8a3d"}`;
    d.innerHTML = htmlOrKey && htmlOrKey.charAt(0) === "<" ? htmlOrKey : spriteHtml(htmlOrKey, D, 0, 15);
    document.body.appendChild(d);
    if (typeof window.v16Activate === "function") window.v16Activate(d);
    const r = rotDeg || 0;
    const a = d.animate([
      { transform: `rotate(${r}deg) scale(0.42)`, opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      { transform: `rotate(${r}deg) scale(1.07)`, opacity: 1, offset: 0.18 },
      { transform: `rotate(${r}deg) scale(1.04)`, opacity: 1, offset: 0.78 },
      { transform: `rotate(${r}deg) scale(1.10)`, opacity: 0 }
    ], { duration: D, easing: "linear", fill: "forwards" });
    a.onfinish = () => d.remove();
    fxT(() => d.remove(), D + 120);
    return d;
  }

  /* Tạo 2 tàn ảnh nhẹ mượt (chỉ transform + opacity, không dùng filter blur nặng GPU) bám theo đường lao */
  function spawnCardAfterimages(sp, lx, ly, cardHtml) {
    if (!sp || !cardHtml || (typeof reduced !== "undefined" && reduced)) return;
    [0.34, 0.68].forEach((f, idx) => {
      fxT(() => {
        const ai = ghost(sp, cardHtml, "g9 choreo-afterimage");
        ai.animate([
          { transform: `perspective(650px) translate3d(${(lx * f).toFixed(1)}px, ${(ly * f).toFixed(1)}px, ${(20 + idx * 8)}px) scale(${(1.04 + idx * 0.04).toFixed(2)})`, opacity: 0.42 - idx * 0.12 },
          { transform: `perspective(650px) translate3d(${(lx * (f + 0.05)).toFixed(1)}px, ${(ly * (f + 0.05)).toFixed(1)}px, 8px) scale(0.96)`, opacity: 0 }
        ], { duration: 200, easing: "ease-out", fill: "forwards" }).onfinish = () => ai.remove();
        fxT(() => ai.remove(), 250);
      }, 45 + idx * 36);
    });
  }

  /* Cú nổ va chạm tối ưu hoá GPU: 1 tờ nổ v16 sắc nét + vòng xung kích WebGL + dấu vết mặt thẻ + Hit-Stop 45ms */
  function triggerPaintedImpact(tp, opts) {
    if (!tp) return;
    const o = opts || {};
    const col = o.col || "#ffd65a";
    const burstKey = o.burst || "no_lua";
    const decalKey = o.decal || null;
    const dstEl = o.dstEl || null;
    const dx = o.dx || 0, dy = o.dy || 0;
    const dist = Math.hypot(dx, dy) || 1;
    const shake = o.shake != null ? o.shake : 6.2;

    /* Lớp 1: Quả cầu nổ nguyên tố 16 khung sắc nét (không chồng đè 3-4 tờ nổ cùng lúc gây mù sáng) */
    spawnPaintedBurst(burstKey, tp.x, tp.y, o.burstSize || 164, col, 440, (Math.random() - 0.5) * 18);
    /* Lớp 2: Dấu ấn vết chém / vết cào / hố lõm trên mặt thẻ (nếu khác lớp nổ chính) */
    if (decalKey && decalKey !== burstKey) {
      spawnMark(decalKey, tp.x, tp.y, o.decalSize || Math.max(128, (tp.w || 56) * 2.05), col, o.decalDur || 480, o.decalRot || 0, o.decalScreen !== false);
    }

    if (window.GLFX) {
      if (GLFX.ring) GLFX.ring(tp.x, tp.y, col, o.ringSize ? o.ringSize * 0.58 : 96, 0.36, 0.88);
      if (GLFX.impulseShake) GLFX.impulseShake(shake, dx / dist, dy / dist);
    }

    /* Hit-Stop 45ms: Thẻ trúng đòn khựng nảy 3D sắc gọn */
    if (dstEl && dstEl.isConnected) {
      fxT(() => {
        if (dstEl && dstEl.isConnected) {
          dstEl.animate([
            { transform: "perspective(560px) translate3d(0,0,0) scale(1)" },
            { transform: `perspective(560px) translate3d(${(dx / dist * 15).toFixed(1)}px, ${(dy / dist * 15).toFixed(1)}px, -24px) rotateX(18deg) rotateZ(${(dx >= 0 ? 7 : -7)}deg) scale(0.85)`, offset: 0.28 },
            { transform: `perspective(560px) translate3d(${(-dx / dist * 4).toFixed(1)}px, ${(-dy / dist * 4).toFixed(1)}px, 6px) scale(1.03)`, offset: 0.68 },
            { transform: "perspective(560px) translate3d(0,0,0) scale(1)" }
          ], { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
        }
        if (o.afterHitStop) o.afterHitStop();
      }, 45);
    } else if (o.afterHitStop) {
      fxT(o.afterHitStop, 45);
    }
  }

  /* ==================== 4. ENGINE DÂY KÉO MESH-RIBBON 60FPS BIẾN DẠNG ẢNH TRANH VẼ (.WEBP) TRÊN CANVAS2D ==================== */
  /* Cắt lát ảnh sprite ngang (.webp) thành 48 lát dọc tối ưu hoá tốc độ vẽ 60FPS trên Canvas2D */
  function drawWarpedSpriteRibbon(ctx, img, ptFn, thickness, slices, flipY) {
    if (!img || !img.complete || !img.naturalWidth) return false;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const N = Math.min(52, Math.max(slices || 48, 36));
    let prev = ptFn(0);
    for (let i = 0; i < N; i++) {
      const u1 = (i + 1) / N;
      const next = ptFn(u1);
      const mx = (prev.x + next.x) * 0.5;
      const my = (prev.y + next.y) * 0.5;
      const segLen = Math.hypot(next.x - prev.x, next.y - prev.y);
      if (segLen > 0.1) {
        const ang = Math.atan2(next.y - prev.y, next.x - prev.x);
        const sx = (i / N) * iw;
        const sw = Math.max(1, iw / N);
        const uMid = (i + 0.5) / N;
        const taper = 0.78 + 0.30 * Math.sin(Math.min(1, uMid * 1.12) * Math.PI * 0.85);
        const dh = thickness * taper;
        const dw = segLen + 1.05;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(ang);
        if (flipY) ctx.scale(1, -1);
        ctx.drawImage(img, sx, 0, sw, ih, -dw * 0.5, -dh * 0.5, dw, dh);
        ctx.restore();
      }
      prev = next;
    }
    return true;
  }

  function runPhysicalTether(opts) {
    if (typeof reduced !== "undefined" && reduced) return;
    const cvs = document.createElement("canvas");
    cvs.className = "choreo-canvas";
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    /* gpu24: canvas chỉ rộng bằng vùng dây kéo (không phủ cả màn hình) để lọc/ghép lớp rẻ hơn nhiều */
    const _p = [opts.src, opts.from, opts.to || opts.from].filter(Boolean), PADV = 110;
    const bx0 = Math.max(0, Math.min(..._p.map((q) => q.x)) - PADV), by0 = Math.max(0, Math.min(..._p.map((q) => q.y)) - PADV);
    const bx1 = Math.min(window.innerWidth, Math.max(..._p.map((q) => q.x)) + PADV), by1 = Math.min(window.innerHeight, Math.max(..._p.map((q) => q.y)) + PADV);
    const vw = Math.max(40, bx1 - bx0), vh = Math.max(40, by1 - by0);
    cvs.width = Math.round(vw * dpr);
    cvs.height = Math.round(vh * dpr);
    cvs.style.cssText = `left:${bx0.toFixed(1)}px;top:${by0.toFixed(1)}px;width:${vw.toFixed(1)}px;height:${vh.toFixed(1)}px`;
    document.body.appendChild(cvs);
    const ctx = cvs.getContext("2d");

    const kind = opts.kind || "hook";
    const srcId = opts.srcId || "";
    const extendMs = opts.extendMs || 185;
    const holdMs = opts.holdMs || 65;
    const pullMs = opts.pullMs || 450;
    const spdMul = (typeof SPD !== "undefined" && SPD) || 1;
    const totalMs = (extendMs + holdMs + pullMs) * spdMul;
    const t0 = performance.now();

    const sPt = opts.src;
    const r0 = opts.from;
    const r1 = opts.to || opts.from;

    /* Áp dụng hào quang phát sáng trên toàn tấm Canvas bằng GPU thay vì shadowBlur từng lát cắt! */
    const cvsGlowMap = {
      tentacle: "drop-shadow(0 0 14px rgba(205,95,255,0.78))",
      blood_tentacle: "drop-shadow(0 0 14px rgba(255,60,95,0.8))",
      banyan: "drop-shadow(0 6px 12px rgba(0,0,0,0.75)) drop-shadow(0 0 14px rgba(90,255,140,0.68))",
      hook: "drop-shadow(0 6px 10px rgba(0,0,0,0.75)) drop-shadow(0 0 12px rgba(255,200,85,0.72))"
    };
    if (cvsGlowMap[kind]) cvs.style.filter = cvsGlowMap[kind];

    /* Nạp đúng ảnh tranh vẽ cho từng chủng loại dây kéo */
    const tentacleImg = getVfxImg(kind === "blood_tentacle" ? "huyetdichhangxom" : (srcId === "nhenhacdich" ? "nhenhacdich" : "batty"));
    const banyanImg = getVfxImg("re_da");
    const hookImg = getVfxImg(srcId === "giacdausi" ? "day" : "day");
    const chainImg = getVfxImg("xich");
    const silkHeadImg = getVfxImg(kind === "silk" ? (srcId === "bato" ? "bato" : "tonu") : "nhennhan");

    let snareOverlay = null;
    let casterProp = null;
    let flyingTalisman = null;
    let swirlingTornado = null;
    let latchedFxDone = false;

    /* Khởi tạo đạo cụ gắn tại thẻ nguồn / thẻ đích theo chủng loại */
    if (kind === "magnet") {
      const magAng = Math.atan2(r0.y - sPt.y, r0.x - sPt.x) * 57.2958;
      const cs = Math.cos(magAng * 0.01745), sn = Math.sin(magAng * 0.01745);
      casterProp = spawnProp("tunu", sPt.x + cs * 38, sPt.y + sn * 38, 158, 134, "#5ad8ff", 42);
      casterProp.animate([
        { transform: `rotate(${magAng.toFixed(1)}deg) scale(0.42)`, opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        { transform: `translate(${(cs * 16).toFixed(1)}px, ${(sn * 16).toFixed(1)}px) rotate(${magAng.toFixed(1)}deg) scale(1.11)`, opacity: 1, offset: 0.14 },
        { transform: `translate(${(cs * 10).toFixed(1)}px, ${(sn * 10).toFixed(1)}px) rotate(${(magAng + 3).toFixed(1)}deg) scale(1.07)`, opacity: 1, offset: 0.88 },
        { transform: `rotate(${magAng.toFixed(1)}deg) scale(0.75)`, opacity: 0 }
      ], { duration: totalMs, easing: "linear", fill: "forwards" }).onfinish = () => casterProp.remove();
    } else if (kind === "tornado") {
      swirlingTornado = spawnProp("phongnu", sPt.x, sPt.y, 156, 168, "#7ff5e0", 39);
    } else if (kind === "talisman") {
      flyingTalisman = spawnProp("bua_chu", sPt.x, sPt.y, 96, 112, "#ffd65a", 39);
    }

    const tick = (now) => {
      const el = now - t0;
      const pAll = clamp(el / totalMs, 0, 1);
      const tE = extendMs * spdMul;
      const tH = (extendMs + holdMs) * spdMul;

      let tx, ty, phase;
      if (el <= tE) {
        phase = "extend";
        const p = 1 - Math.pow(1 - clamp(el / tE, 0, 1), 2.4);
        tx = lerp(sPt.x, r0.x, p);
        ty = lerp(sPt.y, r0.y, p);
      } else if (el <= tH) {
        phase = "hold";
        tx = r0.x;
        ty = r0.y;
      } else {
        phase = "pull";
        const p = clamp((el - tH) / (pullMs * spdMul), 0, 1);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        tx = lerp(r0.x, r1.x, ease);
        ty = lerp(r0.y, r1.y, ease);
      }

      /* Ngay khoảnh khắc chạm mục tiêu: Bung lưới nhện pha lê / nổ tia lửa móc khoá! */
      if (!latchedFxDone && phase !== "extend") {
        latchedFxDone = true;
        if (typeof window.playV16 === "function") window.playV16("hut_keo", r0.x, r0.y, Math.max(118, (r0.w || 56) * 2.05), 480, 0);
        if (kind === "web" || kind === "silk") {
          const netSz = Math.max(142, (r0.w || 56) * 2.35);
          snareOverlay = spawnProp("luoi_nhen", r0.x, r0.y, netSz, netSz, "#9ef6ff", 38, true);
          spawnPaintedBurst("no_bang", r0.x, r0.y, 136, "#9ef6ff", 340);
        } else if (kind === "tentacle" || kind === "blood_tentacle") {
          spawnPaintedBurst(kind === "blood_tentacle" ? "no_lua" : "no_toi", r0.x, r0.y, 145, kind === "blood_tentacle" ? "#ff4d6d" : "#d580ff", 360);
        } else if (kind === "banyan") {
          spawnPaintedBurst("no_sang", r0.x, r0.y, 138, "#7dff70", 360);
        } else if (kind === "magnet") {
          spawnPaintedBurst("no_set", r0.x, r0.y, 146, "#5ad8ff", 360);
          if (window.GLFX && GLFX.arc) GLFX.arc(sPt.x, sPt.y, r0.x, r0.y, "#6ef2ff", 10, 0.9, true, 0.28);
        } else {
          spawnPaintedBurst("sao_tang", r0.x, r0.y, 132, "#ffd65a", 340);
        }
      }

      /* Cập nhật vị trí lưới tơ / bùa chú / vòi rồng bám sát mục tiêu khi kéo về */
      if (snareOverlay && snareOverlay.isConnected) {
        const w = snareOverlay.offsetWidth || 136;
        snareOverlay.style.left = `${(tx - w / 2).toFixed(1)}px`;
        snareOverlay.style.top = `${(ty - w / 2).toFixed(1)}px`;
        snareOverlay.style.transform = `rotate(${(el * 0.14).toFixed(1)}deg) scale(${pAll > 0.88 ? ((1 - pAll) / 0.12 * 1.1).toFixed(2) : "1.04"})`;
        snareOverlay.style.opacity = pAll > 0.88 ? ((1 - pAll) / 0.12).toFixed(2) : "0.96";
      }
      if (flyingTalisman && flyingTalisman.isConnected) {
        flyingTalisman.style.left = `${(tx - flyingTalisman.offsetWidth / 2).toFixed(1)}px`;
        flyingTalisman.style.top = `${(ty - flyingTalisman.offsetHeight / 2).toFixed(1)}px`;
        flyingTalisman.style.transform = `rotate(${(Math.sin(el * 0.02) * 14).toFixed(1)}deg) scale(${pAll > 0.88 ? "0.6" : "1.06"})`;
        flyingTalisman.style.opacity = pAll > 0.88 ? ((1 - pAll) / 0.12).toFixed(2) : "1";
      }
      if (swirlingTornado && swirlingTornado.isConnected) {
        swirlingTornado.style.left = `${(tx - swirlingTornado.offsetWidth / 2).toFixed(1)}px`;
        swirlingTornado.style.top = `${(ty - swirlingTornado.offsetHeight / 2).toFixed(1)}px`;
        swirlingTornado.style.transform = `skewX(${(Math.sin(el * 0.025) * 11).toFixed(1)}deg) scale(${(0.95 + 0.18 * Math.sin(el * 0.018)).toFixed(2)})`;
        swirlingTornado.style.opacity = pAll > 0.88 ? ((1 - pAll) / 0.12).toFixed(2) : "0.98";
      }

      ctx.setTransform(dpr, 0, 0, dpr, -bx0 * dpr, -by0 * dpr);
      ctx.clearRect(bx0, by0, vw, vh);

      const dx = tx - sPt.x, dy = ty - sPt.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist, ny = dx / dist;
      const fadeAlpha = pAll > 0.86 ? clamp((1 - pAll) / 0.14, 0, 1) : 1;
      ctx.globalAlpha = fadeAlpha;

      if (kind === "tentacle" || kind === "blood_tentacle") {
        /* 2 Xúc tu tranh vẽ uốn lượn sinh học ngược pha nhau + lõi hào quang tím/huyết phát sáng! */
        const amp = phase === "pull" ? 15 : 26;

        const ptMain = (u) => {
          const wv = Math.sin(u * Math.PI) * Math.sin(u * 8.5 - el * 0.019) * amp;
          return { x: sPt.x + dx * u + nx * wv, y: sPt.y + dy * u + ny * wv };
        };
        const ptSub = (u) => {
          const wv = Math.sin(u * Math.PI) * Math.cos(u * 7.2 - el * 0.016 + 1.4) * (amp * 0.72);
          return { x: sPt.x + dx * u - nx * wv, y: sPt.y + dy * u - ny * wv };
        };

        ctx.globalAlpha = fadeAlpha * 0.78;
        drawWarpedSpriteRibbon(ctx, tentacleImg, ptSub, 44, 80, true);
        ctx.globalAlpha = fadeAlpha;
        drawWarpedSpriteRibbon(ctx, tentacleImg, ptMain, 64, 84, false);
      } else if (kind === "banyan") {
        /* Rễ cây đa cổ thụ thần linh uốn lượn liền mạch + đom đóm vàng ngọc bích bay lấp lánh */
        const sag = phase === "pull" ? 8 : 22;
        const ptRoot = (u) => {
          const wv = Math.sin(u * Math.PI) * (sag * Math.sin(u * 5.2 - el * 0.012));
          return { x: sPt.x + dx * u + nx * wv, y: sPt.y + dy * u + ny * wv };
        };
        drawWarpedSpriteRibbon(ctx, banyanImg, ptRoot, 66, 84, false);

        /* Hạt đom đóm linh mộc lấp lánh dọc thân rễ đa */
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 9; i++) {
          const u = ((i * 0.11 + el * 0.0009) % 1);
          const p = ptRoot(u);
          const off = Math.sin(el * 0.014 + i * 2.1) * 14;
          ctx.fillStyle = i % 2 === 0 ? "#ffe97d" : "#7dffb0";
          ctx.beginPath();
          ctx.arc(p.x + nx * off, p.y + ny * off, 2.8 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (kind === "web" || kind === "silk") {
        /* Đa luồng tơ nhện / lụa kim tuyến căng bóng + Đinh ba tơ pha lê v_nhennhan.webp phóng dẫn đầu! */
        const isSilk = kind === "silk";
        const mainStroke = isSilk ? "#ffe082" : "#e8fbff";
        const glowStroke = isSilk ? "rgba(255,190,60,0.85)" : "rgba(110,235,255,0.88)";
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.shadowColor = glowStroke;
        ctx.shadowBlur = 14;

        [-1, 0, 1].forEach((laneOff) => {
          ctx.beginPath();
          ctx.moveTo(sPt.x, sPt.y);
          const vib = phase === "pull" ? Math.sin(el * 0.06 + laneOff) * 3 : (1 - clamp(el / tE, 0, 1)) * 16 * laneOff;
          const cx = sPt.x + dx * 0.5 + nx * (laneOff * 11 + vib);
          const cy = sPt.y + dy * 0.5 + ny * (laneOff * 11 + vib);
          ctx.quadraticCurveTo(cx, cy, tx, ty);
          ctx.strokeStyle = laneOff === 0 ? "#ffffff" : mainStroke;
          ctx.lineWidth = laneOff === 0 ? 4.2 : 2.1;
          ctx.stroke();

          /* Giọt sương pha lê óng ánh đính dọc sợi tơ */
          for (let k = 1; k <= 4; k++) {
            const u = k / 5;
            const px = (1 - u) * (1 - u) * sPt.x + 2 * (1 - u) * u * cx + u * u * tx;
            const py = (1 - u) * (1 - u) * sPt.y + 2 * (1 - u) * u * cy + u * u * ty;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(px, py, laneOff === 0 ? 3.2 : 2.0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();

        /* Đầu mũi Đinh Ba Tơ Nhện (v_nhennhan.webp) hoặc Con Thoi Vàng (v_tonu.webp) dẫn mũi phóng */
        if (silkHeadImg && silkHeadImg.complete && silkHeadImg.naturalWidth) {
          const ang = Math.atan2(dy, dx);
          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(ang);
          ctx.shadowColor = glowStroke;
          ctx.shadowBlur = 18;
          ctx.drawImage(silkHeadImg, -96, -38, 114, 76);
          ctx.restore();
        }
      } else if (kind === "magnet") {
        /* Sóng vòng từ trường Đông Sơn + 2 tia hồ quang điện từ xanh–đỏ hút ghì mục tiêu! */
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const ang = Math.atan2(dy, dx);
        for (let rIdx = 0; rIdx < 5; rIdx++) {
          const u = 1 - (((el * 0.0026) + rIdx * 0.2) % 1);
          const rx = sPt.x + dx * u, ry = sPt.y + dy * u;
          const rad = 14 + u * 26;
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(ang);
          ctx.strokeStyle = rIdx % 2 === 0 ? "rgba(90,235,255,0.86)" : "rgba(255,105,135,0.82)";
          ctx.lineWidth = 3.4;
          ctx.shadowColor = "#5eeeff";
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.ellipse(0, 0, 9, rad, 0, -Math.PI * 0.68, Math.PI * 0.68);
          ctx.stroke();
          ctx.restore();
        }
        /* Hai tia điện từ nối 2 cực Bắc - Nam của nam châm tới thẳng thẻ địch */
        [-14, 14].forEach((pole, pIdx) => {
          ctx.beginPath();
          ctx.moveTo(sPt.x + nx * pole, sPt.y + ny * pole);
          for (let s = 1; s <= 8; s++) {
            const u = s / 8;
            const jitter = s < 8 ? Math.sin(el * 0.07 + s * 2.9 + pIdx * 3.1) * 7 : 0;
            ctx.lineTo(sPt.x + dx * u + nx * (pole * (1 - u) + jitter), sPt.y + dy * u + ny * (pole * (1 - u) + jitter));
          }
          ctx.strokeStyle = pIdx === 0 ? "#ff6b8b" : "#6bf4ff";
          ctx.lineWidth = 3.0;
          ctx.stroke();
        });
        ctx.restore();
      } else if (kind === "tornado") {
        /* Dải cuồng phong ngọc bích xoắn ốc nối từ thẻ nguồn tới vòi rồng */
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let strand = 0; strand < 2; strand++) {
          ctx.beginPath();
          for (let s = 0; s <= 18; s++) {
            const u = s / 18;
            const wv = Math.sin(u * 10 - el * 0.025 + strand * Math.PI) * (18 * Math.sin(u * Math.PI));
            const px = sPt.x + dx * u + nx * wv;
            const py = sPt.y + dy * u + ny * wv;
            if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = strand === 0 ? "rgba(130,255,230,0.85)" : "rgba(220,255,250,0.65)";
          ctx.lineWidth = strand === 0 ? 5 : 2.6;
          ctx.shadowColor = "#6ef7dc";
          ctx.shadowBlur = 14;
          ctx.stroke();
        }
        ctx.restore();
      } else if (kind === "talisman") {
        /* Dải lụa linh phù vàng rực dẫn hồn thẻ */
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        for (let s = 0; s <= 20; s++) {
          const u = s / 20;
          const wv = Math.sin(u * 7 - el * 0.018) * 14 * Math.sin(u * Math.PI);
          const px = sPt.x + dx * u + nx * wv;
          const py = sPt.y + dy * u + ny * wv - Math.sin(u * Math.PI) * 18;
          if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = "#ffd86b";
        ctx.lineWidth = 5.5;
        ctx.shadowColor = "#ffae2b";
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.restore();
      } else {
        /* Dây thừng bện vàng & Móc câu đồng Đông Sơn (v_day.webp / v_xich.webp) uốn vật lý thật! */
        const sag = phase === "pull" ? 2 : (1 - clamp(el / tE, 0, 1)) * 28;
        const ropeImg = srcId === "camvuong" ? chainImg : hookImg;
        const ptRope = (u) => ({
          x: sPt.x + dx * u,
          y: sPt.y + dy * u + Math.sin(u * Math.PI) * sag
        });
        drawWarpedSpriteRibbon(ctx, ropeImg, ptRope, 56, 80, false);
      }

      if (pAll < 1) {
        requestAnimationFrame(tick);
      } else {
        cvs.remove();
        if (snareOverlay && snareOverlay.isConnected) snareOverlay.remove();
        if (casterProp && casterProp.isConnected) casterProp.remove();
        if (flyingTalisman && flyingTalisman.isConnected) flyingTalisman.remove();
        if (swirlingTornado && swirlingTornado.isConnected) swirlingTornado.remove();
      }
    };
    requestAnimationFrame(tick);
  }

  /* ==================== 5. HIỆU ỨNG CHÉM ĐÔI MẶT THẺ & 2 HÀM NANH HỒ TINH TRANH VẼ NGOẠM SẬP ==================== */
  function cleaveSplitCard(r, col) {
    if (!r || !r.html || (typeof reduced !== "undefined" && reduced)) return;
    const h1 = ghost(r, r.html, "g9 choreo-cleave-half");
    const h2 = ghost(r, r.html, "g9 choreo-cleave-half");
    h1.style.clipPath = "polygon(0 0, 100% 0, 100% 34%, 0 68%)";
    h2.style.clipPath = "polygon(100% 34%, 100% 100%, 0 100%, 0 68%)";

    h1.animate([
      { transform: "translate3d(0,0,0)", opacity: 1 },
      { transform: "translate3d(-18px, -15px, 0) rotate(-7deg)", opacity: 1, offset: 0.52 },
      { transform: "translate3d(-32px, -24px, 0) rotate(-13deg) scale(0.9)", opacity: 0 }
    ], { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => h1.remove();

    h2.animate([
      { transform: "translate3d(0,0,0)", opacity: 1 },
      { transform: "translate3d(18px, 15px, 0) rotate(7deg)", opacity: 1, offset: 0.52 },
      { transform: "translate3d(32px, 24px, 0) rotate(13deg) scale(0.9)", opacity: 0 }
    ], { duration: 340, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => h2.remove();

    if (window.GLFX && GLFX.arc) {
      GLFX.arc(r.x - 52, r.y + 28, r.x + 52, r.y - 28, col || "#7fe8ff", 13, 0.16, false, 0.32);
    }
    fxT(() => { h1.remove(); h2.remove(); }, 400);
  }

  function snapBeastJaws(tp, col, dstEl, onSnap) {
    const w = Math.max(168, (tp.w || 58) * 2.65);
    const h = Math.round(w * 0.55);
    const topJaw = spawnProp("ham_tren", tp.x, tp.y - 46, w, h, col, 42);
    const botJaw = spawnProp("ham_duoi", tp.x, tp.y + 46, w, h, col, 42);

    topJaw.animate([
      { transform: "translateY(-28px) scale(0.75)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      { transform: "translateY(-14px) scale(1.11)", opacity: 1, offset: 0.22, easing: "cubic-bezier(0.55, 0, 0.9, 0.45)" },
      { transform: "translateY(34px) scale(1.06)", opacity: 1, offset: 0.46 },
      { transform: "translateY(31px) scale(1.08)", opacity: 1, offset: 0.85 },
      { transform: "translateY(24px) scale(1.11)", opacity: 0 }
    ], { duration: 540, easing: "linear", fill: "forwards" }).onfinish = () => topJaw.remove();

    botJaw.animate([
      { transform: "translateY(28px) scale(0.75)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      { transform: "translateY(14px) scale(1.11)", opacity: 1, offset: 0.22, easing: "cubic-bezier(0.55, 0, 0.9, 0.45)" },
      { transform: "translateY(-34px) scale(1.06)", opacity: 1, offset: 0.46 },
      { transform: "translateY(-31px) scale(1.08)", opacity: 1, offset: 0.85 },
      { transform: "translateY(-24px) scale(1.11)", opacity: 0 }
    ], { duration: 540, easing: "linear", fill: "forwards" }).onfinish = () => botJaw.remove();

    fxT(() => {
      SFX.play("bite");
      triggerPaintedImpact(tp, {
        col: col || "#ff4d3d",
        burst: "no_lua",
        decal: "vet_cao",
        dstEl,
        shake: 7.8,
        afterHitStop: onSnap
      });
    }, 245);
    fxT(() => { topJaw.remove(); botJaw.remove(); }, 600);
  }

  /* ==================== 6. GHI ĐÈ MOVE10: KÉO BẰNG TRANH VẼ MESH-RIBBON & ĐẨY BẰNG VŨ KHÍ ĐÔNG SƠN CỠ LỚN ==================== */
  const _prevMove10 = typeof move10 === "function" ? move10 : null;
  if (_prevMove10) {
    move10 = function (s) {
      const r0 = s.r0, r1 = s.tp, h = s.hid, ph = s.ph;
      if (!r0 || !r1) return _prevMove10(s);

      const srcInst = s.src > 0 ? anyC(s.src) : null;
      const srcId = srcInst ? (E.ab(srcInst) || srcInst.id) : (s.srcId || null);
      const dstInst = s.dst > 0 ? anyC(s.dst) : null;
      const dstId = dstInst ? dstInst.id : null;
      const dstName = dstId && C[dstId] ? C[dstId].n : "";

      if (s.k === "swap") {
        if (dstId === "yeutinhluc" || dstId === "yeutinhcam") {
          SFX.play("morph");
          spawnPaintedBurst("no_toi", r0.x, r0.y, 145, "#a86eff", 380);
        }
        return _prevMove10(s);
      }

      const sel = mcEl9(s.src);
      if (!s.sp || !sel) {
        if (typeof holdFx === "function") holdFx(700);
        if (dstId === "nhennhan" || dstId === "nhenma" || dstId === "cuduto") {
          SFX.play("web");
          const topAnchor = { x: (r0.x + r1.x) * 0.5, y: Math.max(58, Math.min(r0.y, r1.y) - 125) };
          runPhysicalTether({ kind: "web", srcId: dstId, src: topAnchor, from: r0, to: r1, extendMs: 140, holdMs: 60, pullMs: 400 });
        }
        /* Dịch chuyển / Tự dời thẻ: mở cổng gió linh giới ở điểm đi & điểm đến, bay vòng cung 3D rõ nét (760ms) */
        const mvCol = dstId && C[dstId] ? (HC[C[dstId].h] || "#74ffdf") : "#74ffdf";
        SFX.play("e_gio");
        spawnPaintedBurst("gio", r0.x, r0.y, 138, mvCol, 620);
        spawnPaintedBurst("an_vong", r0.x, r0.y, 118, mvCol, 580);
        if (ph && ph.isConnected) {
          ph.style.zIndex = "36";
          const mdx = r1.x - r0.x, mdy = r1.y - r0.y;
          spawnCardAfterimages(r0, mdx, mdy, ph.innerHTML, mvCol);
          const animMv = ph.animate([
            { transform: "perspective(650px) translate3d(0, 0, 0) scale(1)" },
            { transform: "perspective(650px) translate3d(0, -16px, 18px) scale(1.10)", offset: 0.22 },
            { transform: `perspective(650px) translate3d(${(mdx * 0.54).toFixed(1)}px, ${(mdy * 0.54 - 44).toFixed(1)}px, 54px) rotateZ(${(mdx >= 0 ? 10 : -10)}deg) scale(1.11)`, offset: 0.62 },
            { transform: `perspective(650px) translate3d(${mdx.toFixed(1)}px, ${mdy.toFixed(1)}px, 0) scale(1)` }
          ], { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });
          let doneMv = false;
          const finMv = () => {
            if (doneMv) return;
            doneMv = true;
            if (ph.isConnected) ph.remove();
            s.ph = null;
            if (h) { hide9(h, 0); s.hid = null; }
            spawnPaintedBurst("gio", r1.x, r1.y, 142, mvCol, 460);
            spawnPaintedBurst("song_xung", r1.x, r1.y, 136, mvCol, 420);
            SFX.play("place");
            if (dstName && window.pushOppNotif) window.pushOppNotif(`${dstName} ▸ Dịch chuyển`, mvCol);
          };
          animMv.onfinish = finMv;
          fxT(finMv, 560);
          return;
        }
        return _prevMove10(s);
      }

      const ls = laneOf8(s.sp), l0 = laneOf8(r0), l1 = laneOf8(r1);
      const isPull = ls >= 0 && l0 >= 0 && l1 >= 0 && Math.abs(l1 - ls) < Math.abs(l0 - ls);

      /* 6.1. KÉO THẺ BẰNG ĐẠO CỤ MESH-RIBBON TRANH VẼ (CHẬM RÕ 3 NHỊP: PHÓNG DÂY -> MÓC GIỮ -> LÔI KÉO) */
      if (isPull) {
        const pullKind = getPullKind(srcId);
        const extendMs = 200, holdMs = 90, flightDur = 420;
        if (typeof holdFx === "function") holdFx(extendMs + holdMs + flightDur + 220);
        const sfxMap = { web: "web", silk: "web", magnet: "magnet", tentacle: "tentacle", blood_tentacle: "tentacle", tornado: "e_gio", talisman: "e_hon", banyan: "e_moc", hook: "chain" };
        const colMap = { web: "#9ef6ff", silk: "#ffd86b", magnet: "#5ad8ff", tentacle: "#d580ff", blood_tentacle: "#ff4d6d", tornado: "#7ff5e0", talisman: "#ffd65a", banyan: "#7dff70", hook: "#ffb84d" };
        const pCol = colMap[pullKind] || "#ffd65a";
        SFX.play(sfxMap[pullKind] || "chain");

        const dx0 = r0.x - s.sp.x, dy0 = r0.y - s.sp.y, L0 = Math.hypot(dx0, dy0) || 1;
        const ux = dx0 / L0, uy = dy0 / L0;
        sel.animate([
          { transform: "translate3d(0,0,0) scale(1)" },
          { transform: `perspective(620px) translate3d(${(ux * 14).toFixed(1)}px, ${(uy * 14 - 7).toFixed(1)}px, 28px) scale(1.10)`, offset: 0.28 },
          { transform: `perspective(620px) translate3d(${(-ux * 18).toFixed(1)}px, ${(-uy * 18).toFixed(1)}px, 32px) rotate(${(ux >= 0 ? -10 : 10)}deg) scale(1.11)`, offset: 0.65 },
          { transform: "translate3d(0,0,0) scale(1)" }
        ], { duration: extendMs + holdMs + 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });

        runPhysicalTether({ kind: pullKind, srcId, src: s.sp, from: r0, to: r1, extendMs, holdMs, pullMs: flightDur });

        /* Nhịp móc trúng mục tiêu: loé vòng trói và nhấc thẻ bị kéo lên trước khi lôi đi */
        fxT(() => {
          spawnPaintedBurst("song_xung", r0.x, r0.y, 136, pCol, 420);
          if (ph && ph.isConnected) {
            ph.style.zIndex = "35";
            ph.animate([
              { transform: "perspective(650px) translate3d(0,0,0) scale(1)" },
              { transform: "perspective(650px) translate3d(0,-10px,28px) rotateZ(-5deg) scale(1.09)" }
            ], { duration: holdMs, easing: "ease-out", fill: "forwards" });
          }
        }, extendMs);

        fxT(() => {
          if (ph && ph.isConnected) {
            ph.style.zIndex = "35";
            const mdx = r1.x - r0.x, mdy = r1.y - r0.y;
            const liftY = pullKind === "tornado" ? -58 : -28;
            const rotMid = pullKind === "tornado" ? (mdx >= 0 ? 22 : -22) : (mdx >= 0 ? -9 : 9);
            const animRef = ph.animate([
              { transform: "perspective(650px) translate3d(0,-10px,28px) scale(1.09)" },
              { transform: `perspective(650px) translate3d(${(mdx * 0.52).toFixed(1)}px, ${(mdy * 0.52 + liftY).toFixed(1)}px, 48px) rotateZ(${rotMid}deg) scale(1.11)`, offset: 0.54 },
              { transform: `perspective(650px) translate3d(${(mdx * 1.03).toFixed(1)}px, ${(mdy * 1.03).toFixed(1)}px, 8px) rotateZ(${(mdx >= 0 ? 3 : -3)}deg) scale(0.96)`, offset: 0.88 },
              { transform: `perspective(650px) translate3d(${mdx.toFixed(1)}px, ${mdy.toFixed(1)}px, 0) scale(1)` }
            ], { duration: flightDur, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });

            let done = false;
            const fin = () => {
              if (done) return;
              done = true;
              if (ph.isConnected) ph.remove();
              s.ph = null;
              if (h) { hide9(h, 0); s.hid = null; }
              spawnPaintedBurst("song_xung", r1.x, r1.y, 152, pCol, 420);
              spawnPaintedBurst("bui_dap", r1.x, r1.y + 18, 132, pCol, 420);
              if (window.GLFX) GLFX.impulseShake(5.0, mdx, mdy);
              SFX.play("place");
              const srcNm = srcId && C[srcId] ? C[srcId].n : "Chiêu Lật";
              if (window.pushOppNotif) pushOppNotif(`${srcNm} ▸ Kéo thẻ`, pCol);
            };
            animRef.onfinish = fin;
            fxT(fin, flightDur + 120);
          } else if (h) {
            hide9(h, 0);
            s.hid = null;
          }
        }, extendMs + holdMs);
        return;
      }

      /* 6.2. ĐẨY / HÚC NGÀ VOI / THIẾT QUYỀN / QUÂN CỜ TƯỚNG / TÚI GIÓ PHONG THẦN */
      const pushKind = getPushKind(srcId);
      const flightDur = 420;
      let launchDelay = 180;
      if (typeof holdFx === "function") holdFx(launchDelay + flightDur + 220);
      let pCol = "#ffd65a";
      let pushVerb = "HẤT VĂNG SANG CHIẾN ĐỊA";

      if (pushKind === "chess") {
        pCol = "#ffd65a";
        pushVerb = "ĐIỀU QUÂN CỜ NGỌC ĐẾ VỀ TRUNG TÂM";
        launchDelay = 135;
        const cp = spawnProp("quan_co", r0.x, r0.y - 22, 146, 146, "#ffd65a", 42);
        const mdx = r1.x - r0.x, mdy = r1.y - r0.y;
        cp.animate([
          { transform: "translate3d(0, -28px, 0) scale(0.45)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { transform: "translate3d(0, 0px, 0) scale(1.09)", opacity: 1, offset: 0.20, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          { transform: `translate3d(${mdx.toFixed(1)}px, ${(mdy - 26).toFixed(1)}px, 0) scale(1.12)`, opacity: 1, offset: 0.84 },
          { transform: `translate3d(${mdx.toFixed(1)}px, ${mdy.toFixed(1)}px, 0) scale(0.92)`, opacity: 0 }
        ], { duration: launchDelay + flightDur + 80, easing: "linear", fill: "forwards" }).onfinish = () => cp.remove();
        fxT(() => cp.remove(), launchDelay + flightDur + 160);
        SFX.play("pick");
      } else if (pushKind === "wind_gust") {
        pCol = "#7ff5e0";
        pushVerb = "TÚI GIÓ CUỒNG PHONG THỔI DỜI";
        launchDelay = 155;
        SFX.play("e_gio");
        const bagKey = srcId === "thukieu" ? "thukieu" : "phongnu";
        const tor = spawnProp(bagKey, s.sp.x, s.sp.y, 158, 158, "#7ff5e0", 41);
        const gdx = r1.x - s.sp.x, gdy = r1.y - s.sp.y;
        tor.animate([
          { transform: "translate3d(0,0,0) scale(0.45)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { transform: `translate3d(${((r0.x - s.sp.x)).toFixed(1)}px, ${((r0.y - s.sp.y)).toFixed(1)}px, 0) scale(1.12) skewX(-10deg)`, opacity: 1, offset: 0.30 },
          { transform: `translate3d(${(gdx * 0.85).toFixed(1)}px, ${(gdy * 0.85).toFixed(1)}px, 0) scale(1.09) skewX(6deg)`, opacity: 1, offset: 0.84 },
          { transform: `translate3d(${gdx.toFixed(1)}px, ${gdy.toFixed(1)}px, 0) scale(1.04) skewX(10deg)`, opacity: 0 }
        ], { duration: launchDelay + flightDur + 60, easing: "linear", fill: "forwards" }).onfinish = () => tor.remove();
        fxT(() => tor.remove(), launchDelay + flightDur + 140);
      } else {
        const gSrc = ghostOf9(s.sp, s.src);
        hide9(sel, 1);
        gSrc.style.zIndex = "36";
        const sdx = (r0.x - s.sp.x) * 0.72, sdy = (r0.y - s.sp.y) * 0.72;
        const dirSign = r1.x >= r0.x ? 1 : -1;
        let spriteKey = "nam_dam_lua";
        let burstKey = "no_lua";
        let hitSfx = "punch";

        if (pushKind === "punch_water") {
          spriteKey = "quyen_nuoc";
          burstKey = "no_bang";
          pCol = "#3fe0ff";
          pushVerb = "THỦY TỔ QUYỀN ĐẨY SÓNG";
        } else if (pushKind === "punch_gold") {
          spriteKey = "nam_dam_lua";
          burstKey = "no_lua";
          pCol = "#ffd65a";
          pushVerb = "THIẾT QUYỀN ĐẤM VĂNG";
        } else if (pushKind === "blade_knock") {
          spriteKey = pickCardSpriteKey(srcId, "kiemlongnhan", ["quet", "phong"]);
          burstKey = "no_sang";
          pCol = "#5effc8";
          hitSfx = "slash";
          pushVerb = "LONG ĐAO QUÉT VĂNG";
        } else if (pushKind === "tusks") {
          spriteKey = pickCardSpriteKey(srcId, "batkhacan", ["quet", "phong", "nem_vong"]);
          burstKey = "no_sang";
          pCol = "#ffb84d";
          hitSfx = "horn";
          pushVerb = "NGÀ VOI CHIẾN HÚC TUNG";
        }

        spawnCardAfterimages(s.sp, sdx, sdy, gSrc.innerHTML, pCol);
        gSrc.animate([
          { transform: "perspective(650px) translate3d(0,0,0) scale(1)" },
          { transform: `perspective(650px) translate3d(${(-sdx * 0.18).toFixed(1)}px, 5px, 14px) scale(0.93)`, offset: 0.2 },
          { transform: `perspective(650px) translate3d(${sdx.toFixed(1)}px, ${sdy.toFixed(1)}px, 52px) rotateZ(${(dirSign * 10)}deg) scale(1.14)`, offset: 0.56 },
          { transform: "perspective(650px) translate3d(0,0,0) scale(1)" }
        ], { duration: 445, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => {
          gSrc.remove();
          hide9(sel, 0);
        };
        fxT(() => { if (gSrc.isConnected) gSrc.remove(); hide9(sel, 0); }, 490);

        fxT(() => {
          SFX.play(hitSfx);
          const impactProp = spawnProp(spriteKey, r0.x - dirSign * 18, r0.y, 168, 132, pCol, 42);
          impactProp.animate([
            { transform: `scaleX(${dirSign}) translateX(-28px) scale(0.55)`, opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
            { transform: `scaleX(${dirSign}) translateX(10px) scale(1.13)`, opacity: 1, offset: 0.24 },
            { transform: `scaleX(${dirSign}) translateX(18px) scale(1.10)`, opacity: 1, offset: 0.82 },
            { transform: `scaleX(${dirSign}) translateX(30px) scale(1.02)`, opacity: 0 }
          ], { duration: 420, easing: "linear", fill: "forwards" }).onfinish = () => impactProp.remove();
          fxT(() => impactProp.remove(), 470);
          spawnPaintedBurst("song_xung", r0.x, r0.y, 175, pCol, 360);
          spawnPaintedBurst(burstKey, r0.x, r0.y, 156, pCol, 390);
          if (window.GLFX) GLFX.impulseShake(6.5, dirSign, 0);
        }, launchDelay - 15);
      }

      fxT(() => {
        if (!ph || !ph.isConnected) {
          if (h) { hide9(h, 0); s.hid = null; }
          return;
        }
        ph.style.zIndex = "35";
        const mdx = r1.x - r0.x, mdy = r1.y - r0.y;
        const lift = pushKind === "chess" ? -58 : -32;
        const animRef = ph.animate([
          { transform: "perspective(650px) translate3d(0,0,0) scale(1)" },
          { transform: `perspective(650px) translate3d(${(mdx * 0.55).toFixed(1)}px, ${(mdy * 0.55 + lift).toFixed(1)}px, 46px) rotateZ(${(mdx >= 0 ? 12 : -12)}deg) scale(1.10)`, offset: 0.54 },
          { transform: `perspective(650px) translate3d(${(mdx * 1.05).toFixed(1)}px, ${(mdy * 1.05).toFixed(1)}px, 6px) rotateZ(${(mdx >= 0 ? 4 : -4)}deg) scale(0.95)`, offset: 0.86 },
          { transform: `perspective(650px) translate3d(${mdx.toFixed(1)}px, ${mdy.toFixed(1)}px, 0) scale(1)` }
        ], { duration: flightDur, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });

        let done = false;
        const fin = () => {
          if (done) return;
          done = true;
          if (ph.isConnected) ph.remove();
          s.ph = null;
          if (h) { hide9(h, 0); s.hid = null; }
          spawnPaintedBurst("bui_dap", r1.x, r1.y + 18, 134, pCol, 380);
          spawnPaintedBurst("song_xung", r1.x, r1.y, 146, pCol, 350);
          SFX.play("place");
          const srcNm = srcId && C[srcId] ? C[srcId].n.toUpperCase() : "CHIÊU LẬT";
          if (window.pushOppNotif) pushOppNotif(`${srcNm} ▸ ${pushVerb}${dstName ? ": " + dstName.toUpperCase() : ""}!`, pCol);
        };
        animRef.onfinish = fin;
        fxT(fin, flightDur + 95);
      }, launchDelay);
    };
  }

  /* ==================== 6B. DỜI THẺ MƯỢT: MỌI LẦN THẺ ĐỔI CHIẾN ĐỊA ĐỀU LÀ MỘT CHUYẾN BAY LIỀN MẠCH (gpu51) ====================
     Bản sao (ph, dựng ở pre8) nằm yên ở ô cũ -> nhấc nhẹ -> bay cong ease-in-out -> đáp đúng ô mới; ô mới bị giữ ẩn (visibility, không phụ
     thuộc opacity nên hoạt ảnh lật của thẻ vẽ lại không lộ thẻ sớm) tới lúc đáp; thẻ khác trong hai chiến địa được ghim ở chỗ cũ (FLIP) rồi
     trượt về chỗ mới lúc cất cánh. Chỉ transform/opacity. Thời lượng gốc MVD (nhân SPD): 0,8 s ở SPD 2,0. Tiếng: SFX.fam("move") đúng một lần lúc cất cánh. */
  const MVD = 400;
  const MVHOLD = new Map();
  let mvRaf = 0;
  const mvSibs = (el) => {
    const xs = [el], ps = el.parentElement;
    if (ps) ps.querySelectorAll(":scope>.au9,:scope>.au9r,:scope>.ak9,:scope>.au10,:scope>.au10g,:scope>.kh11").forEach((x) => xs.push(x));
    return xs;
  };
  function mvApply() {
    mvRaf = 0;
    if (!MVHOLD.size) return;
    for (const u of MVHOLD.keys()) {
      const el = mcEl9(u);
      if (el) for (const x of mvSibs(el)) if (!x.classList.contains("mvhd9")) x.classList.add("mvhd9");
    }
    mvRaf = requestAnimationFrame(mvApply);
  }
  function mvHold(uid) {
    if (!uid) return;
    MVHOLD.set(uid, (MVHOLD.get(uid) || 0) + 1);
    mvApply();
  }
  function mvRel(uid) {
    const n = (MVHOLD.get(uid) || 0) - 1;
    if (n > 0) { MVHOLD.set(uid, n); return; }
    MVHOLD.delete(uid);
    const el = mcEl9(uid);
    if (el) for (const x of mvSibs(el)) x.classList.remove("mvhd9");
  }
  /* đường bay: nhấc 10% đầu, bay smoothstep, đáp 10% cuối; cong lên giữa đường */
  function mvPath(dx, dy) {
    const dist = Math.hypot(dx, dy) || 1, arch = Math.min(46, Math.max(14, dist * 0.16)), A = 0.1, B = 0.9;
    const at = (u) => {
      const q = u <= A ? 0 : u >= B ? 1 : (u - A) / (B - A), s = q * q * (3 - 2 * q);
      return { s, x: dx * s, y: dy * s - arch * Math.sin(Math.PI * s) - 8 * Math.sin(Math.PI * u) };
    };
    return { dist, at };
  }
  function mvKF(dx, dy) {
    const P = mvPath(dx, dy), N = 28, kf = [], tilt = Math.max(0.35, Math.abs(dx) / P.dist) * (dx >= 0 ? 1 : -1) * 8;
    for (let i = 0; i <= N; i++) {
      const u = i / N, p = P.at(u);
      kf.push({ offset: u, transform: `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0) rotate(${(tilt * Math.sin(Math.PI * p.s)).toFixed(2)}deg) scale(${(1 + 0.13 * Math.sin(Math.PI * u)).toFixed(3)})` });
    }
    return kf;
  }
  /* vệt sáng mảnh theo màu hệ: các đoạn nhỏ dọc đường bay, mỗi đoạn chỉ đổi opacity đúng lúc thẻ bay qua (bỏ khi máy yếu) */
  function mvTrail(s, col) {
    if (window.FXLV === 0) return;
    const r0 = s.r0, dx = s.tp.x - r0.x, dy = s.tp.y - r0.y, P = mvPath(dx, dy), K = 14, els = [], AN = Element.prototype.animate;
    for (let k = 1; k <= K; k++) {
      const u = 0.1 + 0.82 * k / K, p = P.at(u), q = P.at(Math.min(1, u + 0.02)), o = P.at(Math.max(0, u - 0.02));
      const ang = Math.atan2(q.y - o.y, q.x - o.x) * 57.2958, e = document.createElement("i");
      e.className = "mvtr9";
      e.style.cssText = `left:${(r0.x + p.x - 15).toFixed(1)}px;top:${(r0.y + p.y - 1.5).toFixed(1)}px;transform:rotate(${ang.toFixed(1)}deg);--mc9:${col}`;
      document.body.appendChild(e);
      els.push(e);
      AN.call(e, [{ opacity: 0 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0 }], { duration: MVD * 0.4, delay: u * MVD, easing: "ease-out", fill: "both" });
    }
    s.trl = els;
    fxT(() => els.forEach((e) => e.remove()), MVD * 1.7);
  }
  /* thẻ khác trong hai chiến địa: ghim ở chỗ cũ ngay khi bàn vẽ lại, rồi trượt về chỗ mới lúc thẻ cất cánh */
  window.mvPre9 = function (s) {
    if (reduced || !s.ph) return;
    mvHold(s.dst);
    s.mvh = 1;
    const M = window.MVR9;
    if (!M || !M.R1) return;
    (M.t0s || (M.t0s = {}))[s.dst] = s.t0 || 0; /* lịch cất cánh gốc (nhân SPD ra ms thật), để kiểm so le */
    s.pins = [];
    const AN = Element.prototype.animate;
    for (const [u, q1] of M.R1) {
      if (u === s.dst || M.skip.has(u) || M.pin.has(u)) continue;
      const q0 = M.R0.get(u);
      if (!q0) continue;
      const ddx = q0.x - q1.x, ddy = q0.y - q1.y;
      if (Math.abs(ddx) < 3 && Math.abs(ddy) < 3) continue;
      const el = mcEl9(u);
      if (!el) continue;
      M.pin.add(u);
      const a = AN.call(el, [{ transform: `translate3d(${ddx.toFixed(1)}px,${ddy.toFixed(1)}px,0)` }, { transform: "none" }], { duration: MVD * 0.9, easing: "cubic-bezier(.4,0,.2,1)", fill: "both" });
      a.pause();
      a.currentTime = 0;
      a.onfinish = () => { try { a.cancel(); } catch (e) {} };
      s.pins.push(a);
    }
  };
  function mvGo(s) {
    if (s.pins) for (const a of s.pins) { try { if (a.playState === "paused") a.play(); } catch (e) {} }
  }
  window.mvPost9 = function (s) { /* chốt an toàn: nhả mọi thứ còn giữ */
    mvGo(s);
    if (s.mvh) { s.mvh = 0; mvRel(s.dst); }
    if (s.ph && s.ph.isConnected) s.ph.remove();
  };
  /* một chuyến bay: tạo hoạt ảnh trên bản sao; light = chỉ nhả ô/ghim khi đáp (đường kéo/đẩy tự lo hiệu ứng đáp) */
  function mvFlyAnim(s, light) {
    const r0 = s.r0, r1 = s.tp, ph = s.ph, dx = r1.x - r0.x, dy = r1.y - r0.y, AN = Element.prototype.animate;
    const c = anyC(s.dst), col = (c && typeof acol9 === "function" ? acol9((E.ab && E.ab(c)) || c.id)[0] : null) || "#8fe8ff";
    ph.classList.add("mvfl9");
    ph.style.zIndex = "36";
    mvGo(s);
    try { SFX.fam("move", { el: c ? elU(s.dst) : null, moveUid: s.dst }); } catch (e) {}
    mvTrail(s, col);
    const a = AN.call(ph, mvKF(dx, dy), { duration: MVD, easing: "linear", fill: "both" });
    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      if (s.mvh) { s.mvh = 0; mvRel(s.dst); }
      if (s.trl) { s.trl.forEach((e) => e.remove()); s.trl = null; }
      const el = mcEl9(s.dst);
      if (el && typeof pop9 === "function") pop9(el, 1.07, 300);
      if (light) return;
      if (ph.isConnected) ph.remove();
      s.ph = null;
      if (s.hid) { hide9(s.hid, 0); s.hid = null; }
      if (window.FXLV !== 0) {
        if (typeof window.playV16 === "function") window.playV16("di_chuyen", r1.x, r1.y, Math.max(98, (r1.w || 52) * 1.85), 480, 0);
        FX.dust(r1.x, r1.y + (r1.h || 70) * 0.45, "#d8c8a0");
      }
      if (s.k === "swap") {
        const sc = s.side === "p" ? "#3fa0ff" : "#ff4d6d";
        FX.ring(r1.x, r1.y, sc, Math.min(40, (r1.w || 50) * 0.6), 4);
        if (typeof say === "function") say(r1.x, sy8(r1), "ĐỔI PHE", s.side === "p" ? "#9fd0ff" : "#ff9aa8");
        const nm = c && C[c.id] ? C[c.id].n.toUpperCase() : "";
        if (window.pushOppNotif) pushOppNotif(nm ? (s.side === "p" ? `CƯỚP THẺ ▸ ${nm} VỀ PHE TA!` : `${nm} ▸ ĐỔI SANG PHE ĐỐI THỦ`) : "ĐỔI PHE", s.side === "p" ? "#3fe0ff" : "#ff4d7d");
      }
    };
    a.addEventListener("finish", fin);
    fxT(fin, MVD + 150);
    return a;
  }
  { /* thời lượng bước: bay MVD + nhịp đáp; có thẻ nguồn kéo/đẩy thì cộng nhịp phóng */
    mvDur9 = (s) => (s.k === "move" && s.sp ? 300 : 0) + MVD + 100;
  }
  { /* ghi đè move10 lớp ngoài cùng */
    const _m10 = move10;
    move10 = function (s) {
      const r0 = s.r0, r1 = s.tp, ph = s.ph;
      if (reduced || !r0 || !r1 || !ph || !ph.isConnected) return _m10(s);
      const sel = s.sp ? mcEl9(s.src) : null;
      if (s.k === "move" && s.sp && sel) {
        /* kéo / đẩy: giữ nguyên phần thẻ nguồn (dây, đòn) của lớp dưới; chuyến bay của thẻ bị dời thay bằng đường bay chung */
        ph.animate = function (kf, o) {
          if (!(o && +o.duration >= 200)) return Element.prototype.animate.call(this, kf, o);
          delete ph.animate;
          return mvFlyAnim(s, true);
        };
        return _m10(s);
      }
      /* tự dời, đổi phe, hoặc dời không có sự kiện: bay thẳng, chỉ một tiếng "move" lúc cất cánh */
      if (s.sp && sel && typeof lean10 === "function") lean10(sel, s.sp, r0);
      s.ph = ph;
      if (typeof holdFx === "function") holdFx(MVD + 200);
      mvFlyAnim(s, false);
    };
  }

  /* ==================== 7. BỘ DIỄN HOẠT 12 NHÓM CHIÊU LẬT TRANH VẼ ĐÔNG SƠN CỠ LỚN (130PX–185PX) ==================== */
  function makeSrcGhost(sp, srcUid, srcEl) {
    if (srcUid > 0) return ghostOf9(sp, srcUid);
    const html = (sp && sp.html) || (srcEl ? srcEl.innerHTML : "");
    return ghost(sp, html, "g9");
  }

  function executeChoreoStrike(cfg) {
    if (typeof reduced !== "undefined" && reduced) {
      if (cfg.onImpact) cfg.onImpact();
      return;
    }
    const style = cfg.style || "slash_cleave";
    const sp = cfg.sp;
    const tp = cfg.tp;
    const srcId = cfg.srcId || "";
    const srcEl = cfg.srcEl || null;
    const dstEl = cfg.dstEl || null;
    const isFirstInGrp = !cfg.grp || cfg.grp.i === 0;
    const isMulti = !!(cfg.grp && cfg.grp.n > 1);
    const L0 = cfg.liftMs != null ? cfg.liftMs : 85;
    const flyMs = cfg.flyMs != null ? cfg.flyMs : 230;
    const isKill = cfg.stepKind === "kill";
    if (typeof holdFx === "function") holdFx(L0 + flyMs + 220);

    if (!sp || !tp) {
      if (cfg.onImpact) fxT(cfg.onImpact, 60);
      return;
    }

    const dx = tp.x - sp.x, dy = tp.y - sp.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angDeg = Math.atan2(dy, dx) * 57.2958;
    const dirSign = dx >= 0 ? 1 : -1;

    /* ---------- NHÓM A1: THIẾT QUYỀN RỒNG LỬA / ẤN CHƯỞNG PHẬT KIM / THỦY TỔ QUYỀN ---------- */
    if (style === "melee_fist" || style === "water_fist" || style === "arena_ko" || style === "shield_bash") {
      const col = style === "water_fist" ? "#3fe0ff" : style === "arena_ko" ? "#ff7a2b" : "#ffd65a";
      const fistKey = style === "water_fist" ? pickCardSpriteKey(srcId, "quyen_nuoc")
        : style === "shield_bash" ? pickCardSpriteKey(srcId, "batkhacan", ["quet", "phong", "nem_vong"])
        : pickCardSpriteKey(srcId, "nam_dam_lua");
      const burstKey = style === "water_fist" ? "dong_bang" : style === "shield_bash" ? "khien_chan" : "no_lua";

      if (isFirstInGrp && srcEl && !isMulti) {
        const g = makeSrcGhost(sp, cfg.srcUid, srcEl);
        hide9(srcEl, 1);
        g.style.zIndex = "36";
        const stop = clamp(1 - ((tp.w || 56) * 0.56) / dist, 0.35, 0.85);
        const lx = dx * stop, ly = dy * stop;
        spawnCardAfterimages(sp, lx, ly, g.innerHTML, col);

        g.animate([
          { transform: "perspective(650px) translate3d(0,0,0) scale(1)" },
          { transform: `perspective(650px) translate3d(${(-dx / dist * 15).toFixed(1)}px, ${(-dy / dist * 12 + 5).toFixed(1)}px, 18px) rotateX(-10deg) scale(0.92)`, offset: 0.22 },
          { transform: `perspective(650px) translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 58px) rotateZ(${(dirSign * 10)}deg) scale(1.16)`, offset: 0.58 },
          { transform: `perspective(650px) translate3d(${(lx * 0.90).toFixed(1)}px, ${(ly * 0.90).toFixed(1)}px, 44px) scale(1.11)`, offset: 0.72 },
          { transform: "perspective(650px) translate3d(0,0,0) scale(1)" }
        ], { duration: L0 + flyMs + 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => {
          g.remove();
          hide9(srcEl, 0);
        };
        fxT(() => { if (g.isConnected) g.remove(); hide9(srcEl, 0); }, L0 + flyMs + 300);
      } else if (isFirstInGrp && srcEl && typeof lean10 === "function") {
        lean10(srcEl, sp, tp);
      }

      /* Phóng Thiết Quyền / Ấn Chưởng cỡ đại (184px) lao xé gió đập thẳng và ghì giữ trên mặt thẻ đối thủ! */
      fxT(() => {
        const fist = spawnProp(fistKey, sp.x + dx * 0.22, sp.y + dy * 0.22, 184, 142, col, 42);
        fist.animate([
          { transform: `translate3d(0,0,0) rotate(${angDeg.toFixed(1)}deg) scale(0.50)`, opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { transform: `translate3d(${(dx * 0.42).toFixed(1)}px, ${(dy * 0.42).toFixed(1)}px, 0) rotate(${angDeg.toFixed(1)}deg) scale(1.06)`, opacity: 1, offset: 0.22 },
          { transform: `translate3d(${(dx * 0.76).toFixed(1)}px, ${(dy * 0.76).toFixed(1)}px, 0) rotate(${angDeg.toFixed(1)}deg) scale(1.17)`, opacity: 1, offset: 0.60 },
          { transform: `translate3d(${(dx * 0.80).toFixed(1)}px, ${(dy * 0.80).toFixed(1)}px, 0) rotate(${angDeg.toFixed(1)}deg) scale(1.19)`, opacity: 1, offset: 0.86 },
          { transform: `translate3d(${(dx * 0.84).toFixed(1)}px, ${(dy * 0.84).toFixed(1)}px, 0) rotate(${angDeg.toFixed(1)}deg) scale(1.24)`, opacity: 0 }
        ], { duration: flyMs + 170, easing: "linear", fill: "forwards" }).onfinish = () => fist.remove();
        fxT(() => fist.remove(), flyMs + 230);
      }, L0);

      fxT(() => {
        SFX.play(style === "shield_bash" ? "horn" : "punch");
        triggerPaintedImpact(tp, {
          col,
          burst: burstKey,
          decal: "vet_lom",
          decalSize: 162,
          dstEl,
          dx,
          dy,
          shake: 8.2,
          afterHitStop: cfg.onImpact
        });
      }, L0 + flyMs);
      return;
    }

    /* ---------- NHÓM A2: PHÓNG NÓN LÁ SONG CHUỶ XOÁY LỐC / XÚC XẮC NGÀ ĐÔNG SƠN ---------- */
    if (style === "throw_daggers" || style === "throw_cards") {
      const isCards = style === "throw_cards";
      const col = isCards ? "#ffd65a" : "#ff4d6d";
      const projKey = pickCardSpriteKey(srcId, isCards ? "baithu" : "songchuynu", ["nem_vong", "phong"]);
      if (isFirstInGrp && srcEl && typeof lean10 === "function") lean10(srcEl, sp, tp);

      fxT(() => {
        SFX.play(isCards ? "pick" : "dagger");
        const projEl = spawnProp(projKey, sp.x, sp.y, 144, 144, col, 42);
        const curveY = -Math.min(58, dist * 0.24);
        projEl.animate([
          { transform: `translate3d(0,0,0) rotate(${angDeg.toFixed(1)}deg) scale(0.45)`, opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { transform: `translate3d(${(dx * 0.5).toFixed(1)}px, ${(dy * 0.5 + curveY).toFixed(1)}px, 0) rotate(${(angDeg + 360).toFixed(1)}deg) scale(1.11)`, opacity: 1, offset: 0.44 },
          { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${(angDeg + 720).toFixed(1)}deg) scale(1.07)`, opacity: 1, offset: 0.68 },
          { transform: `translate3d(${dx.toFixed(1)}px, ${(dy - 4).toFixed(1)}px, 0) rotate(${(angDeg + 745).toFixed(1)}deg) scale(1.09)`, opacity: 1, offset: 0.88 },
          { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${(angDeg + 760).toFixed(1)}deg) scale(1.14)`, opacity: 0 }
        ], { duration: flyMs + 150, easing: "linear", fill: "forwards" }).onfinish = () => projEl.remove();
        fxT(() => projEl.remove(), flyMs + 220);
      }, L0);

      fxT(() => {
        SFX.play("dagger");
        triggerPaintedImpact(tp, {
          col,
          burst: isCards ? "no_sang" : "no_lua",
          decal: "vet_chem",
          decalSize: 154,
          dstEl,
          dx,
          dy,
          shake: 6.8,
          afterHitStop: () => {
            if (isKill && cfg.r0) cleaveSplitCard(cfg.r0, col);
            if (cfg.onImpact) cfg.onImpact();
          }
        });
      }, L0 + flyMs);
      return;
    }

    /* ---------- NHÓM A3: ĐẠI CUNG TRE NGỌC ĐỘC TIỄN & ĐẠI PHÁO ĐẦU RỒNG BẮN ĐẠN HỎA LONG ---------- */
    if (style === "shoot_venom_bow" || style === "shoot_royal_bow" || style === "shoot_cannon") {
      const isCannon = style === "shoot_cannon";
      const isVenom = style === "shoot_venom_bow";
      const col = isVenom ? "#6eff7a" : isCannon ? "#ff7a2b" : "#ffd86b";

      if (isFirstInGrp) {
        const aimAng = cfg.grp && cfg.grp.c ? Math.atan2(cfg.grp.c.y - sp.y, cfg.grp.c.x - sp.x) * 57.2958 : angDeg;
        const cs = Math.cos(aimAng * 0.01745), sn = Math.sin(aimAng * 0.01745);
        const mount = spawnProp(isCannon ? "phao_tre" : "cung_doc", sp.x + cs * 18, sp.y + sn * 18, isCannon ? 178 : 162, isCannon ? 84 : 182, col, 42);
        mount.animate([
          { transform: `rotate(${aimAng.toFixed(1)}deg) scale(0.45)`, opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { transform: `rotate(${aimAng.toFixed(1)}deg) scale(1.12)`, opacity: 1, offset: 0.14 },
          /* Giật nảy lùi khi buông dây cung / khai hoả pháo rồng! */
          { transform: `translate(${(-cs * 14).toFixed(1)}px, ${(-sn * 14).toFixed(1)}px) rotate(${aimAng.toFixed(1)}deg) scale(1.08)`, opacity: 1, offset: 0.32 },
          { transform: `rotate(${aimAng.toFixed(1)}deg) scale(1.07)`, opacity: 1, offset: 0.86 },
          { transform: `rotate(${aimAng.toFixed(1)}deg) scale(0.86)`, opacity: 0 }
        ], { duration: L0 + flyMs + 190, easing: "linear", fill: "forwards" }).onfinish = () => mount.remove();
        fxT(() => mount.remove(), L0 + flyMs + 250);

        fxT(() => {
          SFX.play(isCannon ? "boom" : "bow");
          if (isCannon) spawnPaintedBurst("no_lua", sp.x + cs * 48, sp.y + sn * 48, 118, "#ff8a2b", 280);
        }, Math.max(0, L0 - 8));

        if (srcEl) {
          srcEl.animate([
            { transform: "scale(1)" },
            { transform: `translate3d(${(-dx / dist * 10).toFixed(1)}px, ${(-dy / dist * 10).toFixed(1)}px, 0) scale(1.10)`, offset: 0.45 },
            { transform: "scale(1)" }
          ], { duration: 340 });
        }
      }

      fxT(() => {
        const ammoKey = pickCardSpriteKey(srcId, isCannon ? "tieulong" : isVenom ? "nuthantien" : "ten", ["phong", "nem_vong"]);
        const ammo = spawnProp(ammoKey, sp.x, sp.y, isCannon ? 132 : 142, isCannon ? 98 : 68, col, 42);
        const arcLift = isMulti ? -Math.min(105, 44 + dist * 0.26) : -Math.min(38, dist * 0.14);
        ammo.animate([
          { transform: `translate3d(0,0,0) rotate(${(angDeg - 15).toFixed(1)}deg) scale(0.55)`, opacity: 0 },
          { transform: `translate3d(${(dx * 0.5).toFixed(1)}px, ${(dy * 0.5 + arcLift).toFixed(1)}px, 0) rotate(${angDeg.toFixed(1)}deg) scale(1.09)`, opacity: 1, offset: 0.42 },
          { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${(angDeg + 11).toFixed(1)}deg) scale(1.06)`, opacity: 1, offset: 0.72 },
          /* Cắm ngập rung bần bật đuôi tên trên mặt thẻ! */
          { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${(angDeg + 5).toFixed(1)}deg) scale(1.02)`, opacity: 1, offset: 0.90 },
          { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${(angDeg + 10).toFixed(1)}deg) scale(0.92)`, opacity: 0 }
        ], { duration: flyMs + 170, easing: "linear", fill: "forwards" }).onfinish = () => ammo.remove();
        fxT(() => ammo.remove(), flyMs + 240);
      }, L0);

      fxT(() => {
        if (isVenom) SFX.play("e_doc");
        triggerPaintedImpact(tp, {
          col,
          burst: isVenom ? "no_doc" : "no_lua",
          decal: isCannon ? "vet_lom" : null,
          ringSize: isMulti ? 142 : 178,
          burstSize: isMulti ? 136 : 168,
          shards: isCannon,
          dstEl,
          dx,
          dy,
          shake: isCannon ? 7.6 : 5.4,
          afterHitStop: cfg.onImpact
        });
      }, L0 + flyMs);
      return;
    }

    /* ---------- NHÓM A4: ĐẠI ĐAO / LONG KIẾM / U MINH KIẾM CHÉM ĐỨT ĐÔI MẶT THẺ ---------- */
    if (style === "slash_cleave") {
      const col = srcId === "kiemnuuminh" ? "#c45cff" : (cfg.col || "#5ce8ff");
      const bladeKey = pickCardSpriteKey(srcId, srcId === "kiemsu" || srcId === "quadao" ? "dao" : "kiem", ["phong", "quet", "nem_vong"]);

      if (isFirstInGrp && srcEl && !isMulti) {
        const g = makeSrcGhost(sp, cfg.srcUid, srcEl);
        hide9(srcEl, 1);
        g.style.zIndex = "36";
        const stop = clamp(1 - ((tp.w || 56) * 0.5) / dist, 0.35, 0.86);
        const lx = dx * stop, ly = dy * stop;
        spawnCardAfterimages(sp, lx, ly, g.innerHTML, col);

        g.animate([
          { transform: "perspective(650px) translate3d(0,0,0) scale(1)" },
          { transform: `perspective(650px) translate3d(${(-dx / dist * 12).toFixed(1)}px, 4px, 16px) scale(0.94)`, offset: 0.18 },
          { transform: `perspective(650px) translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 54px) rotateZ(${(dirSign * 13)}deg) scale(1.14)`, offset: 0.56 },
          { transform: "perspective(650px) translate3d(0,0,0) scale(1)" }
        ], { duration: L0 + flyMs + 225, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => {
          g.remove();
          hide9(srcEl, 0);
        };
        fxT(() => { if (g.isConnected) g.remove(); hide9(srcEl, 0); }, L0 + flyMs + 280);
      } else if (isFirstInGrp && srcEl && typeof lean10 === "function") {
        lean10(srcEl, sp, tp);
      }

      fxT(() => {
        const blade = spawnProp(bladeKey, tp.x, tp.y, 184, 104, col, 42);
        blade.animate([
          { transform: `scaleX(${dirSign}) translate(-42px, -48px) rotate(-68deg) scale(0.68)`, opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { transform: `scaleX(${dirSign}) translate(-12px, -14px) rotate(-28deg) scale(1.15)`, opacity: 1, offset: 0.22 },
          { transform: `scaleX(${dirSign}) translate(22px, 26px) rotate(38deg) scale(1.12)`, opacity: 1, offset: 0.80 },
          { transform: `scaleX(${dirSign}) translate(36px, 40px) rotate(56deg) scale(0.95)`, opacity: 0 }
        ], { duration: 380, easing: "linear", fill: "forwards" }).onfinish = () => blade.remove();
        fxT(() => blade.remove(), 430);

        SFX.play("slash");
        triggerPaintedImpact(tp, {
          col,
          burst: srcId === "kiemnuuminh" ? "no_toi" : "no_set",
          decal: "vet_chem",
          decalSize: 172,
          decalRot: dirSign > 0 ? -18 : 162,
          dstEl,
          dx,
          dy,
          shake: 7.6,
          afterHitStop: () => {
            if (isKill && cfg.r0) cleaveSplitCard(cfg.r0, col);
            if (cfg.onImpact) cfg.onImpact();
          }
        });
      }, L0 + flyMs * 0.72);
      return;
    }

    /* ---------- NHÓM A5: BẠCH HỔ VỒ MỒI / HÀM HỒ TINH NGOẠM NUỐT / NGŨ TỬ TRẢO ---------- */
    if (style === "beast_bite" || style === "beast_devour" || style === "claw_rip") {
      const col = style === "claw_rip" ? "#ff3b6b" : "#ff5a3c";
      if (isFirstInGrp && srcEl) {
        srcEl.animate([
          { transform: "scale(1)" },
          { transform: "perspective(600px) translate3d(0, -16px, 21px) scale(1.14)", offset: 0.42 },
          { transform: "scale(1)" }
        ], { duration: 440 });
      }

      /* Nếu thẻ linh thú có tờ hoạt ảnh riêng (bachho, langthan, culongco, chomay...): phóng linh thú v16 vồ tới! */
      if (style !== "claw_rip" && srcId && typeof SIGV === "object" && SIGV[srcId] && SIGV[srcId].kieu !== "keo") {
        fxT(() => {
          const beast = spawnProp(pickCardSpriteKey(srcId, srcId), sp.x, sp.y, 168, 136, "#ffd65a", 42);
          beast.animate([
            { transform: `translate3d(0,0,0) scaleX(${dirSign}) scale(0.5)`, opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
            { transform: `translate3d(${(dx * 0.6).toFixed(1)}px, ${(dy * 0.6 - 32).toFixed(1)}px, 0) scaleX(${dirSign}) scale(1.13)`, opacity: 1, offset: 0.45 },
            { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scaleX(${dirSign}) scale(1.08)`, opacity: 1, offset: 0.85 },
            { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scaleX(${dirSign}) scale(1.06)`, opacity: 0 }
          ], { duration: flyMs + 60, easing: "linear", fill: "forwards" }).onfinish = () => beast.remove();
          fxT(() => beast.remove(), flyMs + 120);
        }, L0 * 0.4);
      }

      fxT(() => {
        if (style === "claw_rip") {
          SFX.play("slash");
          const clawKey = pickCardSpriteKey(srcId, "tutraonu", ["quet", "phong"]);
          const claws = spawnProp(clawKey, tp.x, tp.y, 172, 160, col, 42);
          claws.animate([
            { transform: "translate(-22px, -26px) scale(0.62)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
            { transform: "translate(0px, 0px) scale(1.13)", opacity: 1, offset: 0.22 },
            { transform: "translate(10px, 12px) scale(1.09)", opacity: 1, offset: 0.84 },
            { transform: "translate(18px, 20px) scale(1.06)", opacity: 0 }
          ], { duration: 410, easing: "linear", fill: "forwards" }).onfinish = () => claws.remove();
          fxT(() => claws.remove(), 460);

          triggerPaintedImpact(tp, {
            col,
            burst: "no_toi",
            decal: "vet_cao",
            decalSize: 164,
            dstEl,
            dx,
            dy,
            shake: 7.2,
            afterHitStop: cfg.onImpact
          });
        } else {
          snapBeastJaws(tp, col, dstEl, () => {
            if (cfg.onImpact) cfg.onImpact();
            if (style === "beast_devour" && window.GLFX && GLFX.tether) {
              GLFX.tether(tp.x, tp.y, sp.x, sp.y, "#ff3b5c", 13, 0.22, 0.42);
              spawnPaintedBurst("no_lua", sp.x, sp.y, 142, "#ff5a3c", 380);
            }
          });
        }
      }, L0 + flyMs * 0.45);
      return;
    }

    /* ---------- NHÓM A8: BÚA SẤM LÔI THẦN & ẤN PHÁN QUAN DIÊM VƯƠNG GIÁNG TRỜI ---------- */
    if (style === "sky_hammer" || style === "yama_judge" || style === "destroyer_beam") {
      const isYama = style === "yama_judge";
      const col = isYama ? "#7fa8ff" : "#5ce8ff";
      const skyKey = pickCardSpriteKey(srcId, isYama ? "satvuong" : "nuloithan", ["giang", "phong", "quet"]);

      if (isFirstInGrp && srcEl) {
        srcEl.animate([
          { transform: "scale(1)" },
          { transform: "perspective(600px) translate3d(0, -14px, 19px) scale(1.13)", offset: 0.45 },
          { transform: "scale(1)" }
        ], { duration: 430 });
      }

      fxT(() => {
        const dropH = 165;
        spawnPaintedBurst("cong", tp.x, tp.y - dropH, 138, col, 340);
        const prop = spawnProp(skyKey, tp.x, tp.y - dropH, 164, 168, col, 42);
        prop.animate([
          { transform: "translateY(0px) rotate(-16deg) scale(0.62)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { transform: `translateY(${(dropH * 0.28).toFixed(0)}px) rotate(-8deg) scale(1.11)`, opacity: 1, offset: 0.20, easing: "cubic-bezier(0.55, 0, 0.9, 0.5)" },
          { transform: `translateY(${dropH}px) rotate(2deg) scale(1.11)`, opacity: 1, offset: 0.56 },
          { transform: `translateY(${(dropH - 4)}px) rotate(0deg) scale(1.13)`, opacity: 1, offset: 0.86 },
          { transform: `translateY(${(dropH - 8)}px) rotate(0deg) scale(1.16)`, opacity: 0 }
        ], { duration: 400, easing: "linear", fill: "forwards" }).onfinish = () => prop.remove();
        fxT(() => prop.remove(), 460);

        fxT(() => {
          SFX.play("gavel");
          if (window.GLFX && GLFX.arc) GLFX.arc(tp.x, Math.max(18, tp.y - 210), tp.x, tp.y, "#8cf4ff", 15, 1.25, true, 0.34);
          triggerPaintedImpact(tp, {
            col,
            burst: isYama ? "no_toi" : "set_danh",
            decal: "vet_lom",
            decalSize: 172,
            dstEl,
            dx: 0,
            dy: 1,
            shake: 8.6,
            afterHitStop: cfg.onImpact
          });
        }, 225);
      }, L0);
      return;
    }

    /* ---------- NHÓM A9: LIÊN HOA ĐỘC DƯỢC & PHÁCH CA TRÙ / XIỀNG XÍCH PHONG ẤN ---------- */
    if (style === "venom_hex" || style === "mystic_seal") {
      const isVenom = style === "venom_hex";
      const col = isVenom ? "#7dff5a" : "#ffd65a";
      const hexKey = pickCardSpriteKey(srcId, isVenom ? "docnutrang" : (srcId === "camvuong" ? "xich" : "mehoacnu"), ["phong", "quet", "giang"]);
      if (isFirstInGrp && srcEl && typeof lean10 === "function") lean10(srcEl, sp, tp);

      fxT(() => {
        const p = spawnProp(hexKey, sp.x, sp.y, 136, 136, col, 42);
        p.animate([
          { transform: "translate3d(0,0,0) scale(0.45)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { transform: `translate3d(${(dx * 0.5).toFixed(1)}px, ${(dy * 0.5 - 36).toFixed(1)}px, 0) rotate(${(isVenom ? 180 : -12)}deg) scale(1.11)`, opacity: 1, offset: 0.45 },
          { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(1.08)`, opacity: 1, offset: 0.86 },
          { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(1.16)`, opacity: 0 }
        ], { duration: flyMs + 130, easing: "linear", fill: "forwards" }).onfinish = () => p.remove();
        fxT(() => p.remove(), flyMs + 190);
      }, L0);

      fxT(() => {
        SFX.play(isVenom ? "e_doc" : "silence");
        triggerPaintedImpact(tp, {
          col,
          burst: isVenom ? "doc_lan" : "no_toi",
          decal: isVenom ? null : "xich",
          decalSize: 132,
          shards: false,
          dstEl,
          dx,
          dy,
          shake: 5.2,
          afterHitStop: cfg.onImpact
        });
      }, L0 + flyMs);
      return;
    }

    /* ---------- NHÓM A10: GƯƠNG ĐỒNG ĐÔNG SƠN SOI CHIẾU & CÁNH HẠC SAO CHÉP ---------- */
    if (style === "mirror_copy" || style === "feather_copy") {
      const isFeather = style === "feather_copy";
      const col = "#8cf4ff";
      fxT(() => {
        SFX.play("chime");
        const p = spawnProp(isFeather ? "cohoang" : "guong", isFeather ? sp.x : tp.x, isFeather ? sp.y : tp.y - 8, 144, 144, col, 42);
        if (isFeather) {
          p.animate([
            { transform: `translate3d(0,0,0) rotate(${angDeg.toFixed(1)}deg) scale(0.45)`, opacity: 0 },
            { transform: `translate3d(${(dx * 0.5).toFixed(1)}px, ${(dy * 0.5 - 42).toFixed(1)}px, 0) rotate(${(angDeg + 14).toFixed(1)}deg) scale(1.11)`, opacity: 1, offset: 0.48 },
            { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${angDeg.toFixed(1)}deg) scale(1.06)`, opacity: 1, offset: 0.86 },
            { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${angDeg.toFixed(1)}deg) scale(1.0)`, opacity: 0 }
          ], { duration: flyMs + 120, easing: "linear", fill: "forwards" }).onfinish = () => p.remove();
        } else {
          p.animate([
            { transform: "perspective(520px) rotateY(-82deg) scale(0.5)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
            { transform: "perspective(520px) rotateY(0deg) scale(1.12)", opacity: 1, offset: 0.26 },
            { transform: "perspective(520px) rotateY(14deg) scale(1.08)", opacity: 1, offset: 0.84 },
            { transform: "perspective(520px) rotateY(75deg) scale(0.75)", opacity: 0 }
          ], { duration: 480, easing: "linear", fill: "forwards" }).onfinish = () => p.remove();
        }
        fxT(() => p.remove(), 550);
        spawnPaintedBurst("no_sang", tp.x, tp.y, 156, col, 400);
        spawnPaintedBurst("song_xung", tp.x, tp.y, 162, col, 380);
        if (cfg.onImpact) cfg.onImpact();
      }, L0 + (isFeather ? flyMs * 0.65 : 70));
      return;
    }

    /* ---------- NHÓM A11 & A12: BÚA RÈN ĐÔNG SƠN, QUẢ THỊ VÀNG, DIỀU SÁO PHƯỢNG & LINH PHÙ ---------- */
    const isForge = style === "forge_strike";
    const isKite = style === "kite_summon";
    const isTal = style === "talisman_summon";
    const col = isForge ? "#ffb02e" : isKite ? "#ffd65a" : isTal ? "#d580ff" : "#7dffb0";
    const propKey = isForge ? "bua_ren"
      : isKite ? pickCardSpriteKey(srcId, "cohoang", ["phong", "nem_vong"])
      : isTal ? pickCardSpriteKey(srcId, "bua_chu", ["phong", "nem_vong", "giang"])
      : pickCardSpriteKey(srcId, "socnu", ["nem_vong", "phong"]);

    if (isFirstInGrp && srcEl && typeof lean10 === "function") lean10(srcEl, sp, tp);
    fxT(() => {
      const p = spawnProp(propKey, sp.x, sp.y, isForge ? 164 : 140, isForge ? 152 : 140, col, 42);
      p.animate([
        { transform: `translate3d(0,0,0) rotate(${(isForge ? 44 : 0)}deg) scale(0.50)`, opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        { transform: `translate3d(${(dx * 0.5).toFixed(1)}px, ${(dy * 0.5 - 52).toFixed(1)}px, 0) rotate(${(isForge ? 32 : 12)}deg) scale(1.14)`, opacity: 1, offset: 0.38, easing: "cubic-bezier(0.55, 0, 0.9, 0.5)" },
        { transform: `translate3d(${dx.toFixed(1)}px, ${(dy - 8).toFixed(1)}px, 0) rotate(${(isForge ? -14 : 0)}deg) scale(1.11)`, opacity: 1, offset: 0.66 },
        { transform: `translate3d(${dx.toFixed(1)}px, ${(dy - 6).toFixed(1)}px, 0) rotate(${(isForge ? -10 : 0)}deg) scale(1.13)`, opacity: 1, offset: 0.88 },
        { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(1.16)`, opacity: 0 }
      ], { duration: flyMs + 160, easing: "linear", fill: "forwards" }).onfinish = () => p.remove();
      fxT(() => p.remove(), flyMs + 220);
    }, L0);

    fxT(() => {
      SFX.play(isForge ? "forge" : isKite || isTal ? "summon" : "buff");
      spawnPaintedBurst(isForge ? "no_lua" : "no_sang", tp.x, tp.y, 158, col, 400);
      spawnPaintedBurst(isForge ? "sao_tang" : "song_xung", tp.x, tp.y, 152, col, 380);
      if (isForge && window.GLFX) GLFX.impulseShake(5.8, 0, 1);
      if (cfg.onImpact) cfg.onImpact();
    }, L0 + flyMs);
  }

  /* ==================== 8. TÍCH HỢP TRỰC TIẾP VÀO RUN8 & FX7 TRONG TRẬN ĐẤU THỰC TẾ ==================== */
  const _prevRun8 = typeof run8 === "function" ? run8 : null;
  if (_prevRun8) {
    run8 = function (s) {
      if (!s || s.k === "move" || s.k === "swap" || s.k === "lshield" || s.k === "loc" || s.k === "lplus" || s.k === "lminus" || !s.sp || !s.tp || !(s.src > 0)) {
        return _prevRun8(s);
      }

      const srcInst = anyC(s.src);
      const srcId = srcInst ? (E.ab(srcInst) || srcInst.id) : null;
      if (!srcId) return _prevRun8(s);

      /* Bạch Tuộc Tinh (batty) phóng 2 xúc tu tranh vẽ uốn lượn lôi thẻ từ tay đối thủ xuống bàn */
      if (s.k === "summon" && srcId === "batty") {
        try { if (typeof dimStep12 === "function") dimStep12(s); } catch (e) {}
        if (typeof holdFx === "function") holdFx(860);
        const foeHand = (typeof HANDZ === "function" && HANDZ(srcInst.side === "p" ? "a" : "p")) || { x: window.innerWidth * 0.72, y: 36 };
        SFX.play("tentacle");
        runPhysicalTether({ kind: "tentacle", srcId: "batty", src: s.sp, from: foeHand, to: s.tp, extendMs: 200, holdMs: 90, pullMs: 420 });
        fxT(() => {
          hit8(s);
          spawnPaintedBurst("no_toi", s.tp.x, s.tp.y, 162, "#d580ff", 460);
          spawnPaintedBurst("song_xung", s.tp.x, s.tp.y, 170, "#d580ff", 440);
          if (window.pushOppNotif) pushOppNotif("Bạch Tuộc Tinh ▸ Lôi thẻ xuống sân", "#e09eff");
        }, 700);
        return;
      }

      /* Lôi Đài Chủ (giacdausi) quăng dây móc đồng Đông Sơn kéo thẻ từ bộ bài địch xuống sàn */
      if (s.k === "summon" && srcId === "giacdausi") {
        try { if (typeof dimStep12 === "function") dimStep12(s); } catch (e) {}
        if (typeof holdFx === "function") holdFx(840);
        const foeDeck = (typeof DECKZ === "function" && DECKZ(srcInst.side === "p" ? "a" : "p")) || { x: window.innerWidth * 0.75, y: 36 };
        SFX.play("chain");
        runPhysicalTether({ kind: "hook", srcId: "giacdausi", src: s.sp, from: foeDeck, to: s.tp, extendMs: 190, holdMs: 80, pullMs: 400 });
        fxT(() => {
          hit8(s);
          if (window.pushOppNotif) pushOppNotif("Lôi Đài Chủ ▸ Lôi thẻ xuống sân", "#ffb84d");
        }, 670);
        return;
      }

      if (s.k === "steal") return _prevRun8(s);

      try {
        if (typeof dimStep12 === "function") dimStep12(s);
        if (typeof srcLbl12 === "function") srcLbl12(s);
      } catch (e) {}

      const style = resolveStyle(srcId, s.k);
      const grp = s.grp && s.grp.n >= 2 ? s.grp : null;
      const srcEl = mcEl9(s.src);
      const dstEl = s.ph || tEl8(s.dst);
      const L0 = s.nl ? 0 : T8.LIFT;

      executeChoreoStrike({
        style,
        stepKind: s.k,
        srcUid: s.src,
        srcId,
        sp: s.sp,
        tp: s.tp,
        r0: s.r0,
        srcEl,
        dstEl,
        grp,
        liftMs: L0,
        flyMs: T8.FLY,
        col: typeof col10 === "function" ? col10(s) : "#ffd65a",
        onImpact: () => {
          s._choreoHit = 1;
          if (grp) {
            SAYOFF++;
            try { hit8(s); } catch (e) {} finally { SAYOFF--; }
            if (s.tb && s.k !== "sil") { s.tb.remove(); s.tb = null; }
            if (typeof recoil10 === "function") recoil10(dstEl, s.sp, s.tp);
            if (grp.i === 0 && typeof sayGroup11 === "function") sayGroup11(s);
          } else {
            hit8(s);
            if (typeof recoil10 === "function") recoil10(dstEl, s.sp, s.tp);
          }
          if (s.k === "copy" && s.sp) {
            if (typeof holdFx === "function") holdFx(960);
            const cur = (typeof where7 === "function" && where7(s.src, null, rects())) || s.sp;
            const abId = s.abId || ((anyC(s.dst) || {}).id);
            /* Hiện Gương Đồng Đông Sơn trên thẻ bị chép rồi rút tinh hồn thẻ bay chậm rãi về chủ thể */
            if (typeof window.playV16 === "function") window.playV16("sao_chep", s.tp.x, s.tp.y, 132, 540, 0);
            const mir = document.createElement("div");
            mir.className = "choreo-mirror-fx";
            mir.style.cssText = `left:${s.tp.x}px;top:${s.tp.y}px;width:${Math.min(136, cwB() * 1.4).toFixed(0)}px;height:${Math.min(136, cwB() * 1.4).toFixed(0)}px;--gc:#8cf4ff`;
            mir.innerHTML = spriteHtml("guong", 640, 0, 15);
            document.body.appendChild(mir);
            if (typeof window.v16Activate === "function") window.v16Activate(mir);
            mir.animate([
              { transform: "translate(-50%,-50%) scale(0.35) rotate(-25deg)", opacity: 0 },
              { transform: "translate(-50%,-50%) scale(1.07) rotate(0deg)", opacity: 1, offset: 0.35 },
              { transform: "translate(-50%,-50%) scale(1.12) rotate(12deg)", opacity: 0 }
            ], { duration: 680, easing: "ease-out", fill: "forwards" }).onfinish = () => mir.remove();
            fxT(() => mir.remove(), 760);

            if (abId && C[abId] && typeof liteId === "function") {
              if (typeof spLoad === "function") spLoad(abId);
              const soul = ghost({ x: s.tp.x, y: s.tp.y, w: s.tp.w || 54, h: s.tp.h || 76 }, liteId(abId), "g9");
              soul.style.zIndex = "38";
              const rdx = cur.x - s.tp.x, rdy = cur.y - s.tp.y;
              soul.animate([
                { transform: "perspective(650px) translate3d(0, 0, 5px) scale(0.85)", opacity: 0.9 },
                { transform: "perspective(650px) translate3d(0, -18px, 21px) scale(1.12)", opacity: 1, offset: 0.32 },
                { transform: `perspective(650px) translate3d(${(rdx * 0.55).toFixed(1)}px, ${(rdy * 0.55 - 32).toFixed(1)}px, 48px) scale(1.08)`, opacity: 1, offset: 0.68 },
                { transform: `perspective(650px) translate3d(${rdx.toFixed(1)}px, ${rdy.toFixed(1)}px, 0) scale(0.75)`, opacity: 0.2 }
              ], { duration: 720, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => soul.remove();
              fxT(() => soul.remove(), 800);
            }

            fxT(() => {
              if (srcEl && srcEl.isConnected) {
                spawnPaintedBurst("no_sang", cur.x, cur.y, 152, "#8cf4ff", 440);
                spawnPaintedBurst("sao_tang", cur.x, cur.y, 138, "#ffd65a", 420);
                if (!grp || grp.i === 0) {
                  const srcNm = srcId && C[srcId] ? C[srcId].n : "Sao chép";
                  if (window.pushOppNotif) pushOppNotif(`${srcNm} ▸ Sao chép`, "#8cf4ff");
                }
              }
            }, 680);
          }
        }
      });
    };
  }

  /* gpu40: lớp ngoài cùng của run8 — bước cộng/trừ sức mạnh / năng lượng đọc mốc T8 (nhấc, bay, phản ứng) ×0,5 */
  if (typeof run8 === "function" && typeof PQ8 === "function") {
    const _r40 = run8;
    run8 = function (s) { const o = T8Q; T8Q = PQ8(s); try { return _r40(s); } finally { T8Q = o; } };
  }

  const _prevFx7 = typeof fx7 === "function" ? fx7 : null;
  if (_prevFx7) {
    fx7 = function (evs, R0, P0) {
      _prevFx7(evs, R0, P0);
      if ((typeof reduced !== "undefined" && reduced) || !G || !Array.isArray(evs)) return;

      const R1 = typeof rects === "function" ? rects() : new Map();
      const W = (u) => (typeof where7 === "function" ? where7(u, R0, R1) : null);

      /* (A) Vứt bỏ bài tuần tự: (1) Vũ khí bay chém trúng lá bài (230ms) -> (2) Lá bài mới bốc cháy (620ms) — KHÔNG đè nhau! */
      const discards = []; /* vứt bỏ do 05-vfx-core.discardBeat diễn: phóng to giữa màn hình rồi bay xuống Mộ */
      const hMap = evs._hand0 || (typeof HAND0 !== "undefined" ? HAND0 : null);
      discards.slice(0, 4).forEach((e, idx) => {
        const sc = anyC(e.src);
        const sid = sc ? (E.ab(sc) || sc.id) : null;
        const sp = W(e.src);
        let tp = null;
        if (e.side === "p") {
          const rHand = hMap ? hMap.get(e.uid) : null;
          const hz = typeof zpt === "function" ? zpt("hand") : null;
          tp = rHand
            ? { x: rHand.x, y: rHand.y, w: rHand.w, h: rHand.h, html: liteId(e.id) }
            : (hz ? { x: hz.x + (idx - 0.5) * 20, y: hz.y, w: 52, h: 72, html: liteId(e.id) } : null);
        } else {
          const oz = typeof zpt === "function" ? (zpt("oppSub") || zpt("avFoe")) : null;
          tp = oz ? { x: oz.x + (idx - 0.5) * 18, y: oz.y + 28, w: 50, h: 70, html: liteId(e.id) } : null;
        }
        if (!sid || !sp || !tp) return;
        const st = resolveStyle(sid, "kill");
        const stDelay = idx * 560;
        if (typeof holdFx === "function") holdFx(stDelay + 560);
        fxT(() => {
          const gDisc = tp.html ? ghost({ x: tp.x, y: tp.y, w: tp.w || 50, h: tp.h || 70 }, tp.html, "g9") : null;
          if (gDisc) gDisc.style.zIndex = "34";
          let burned = false;
          const fireBurn = () => {
            if (burned) return;
            burned = true;
            if (gDisc && gDisc.isConnected) gDisc.remove();
            if (typeof burn7 === "function" && tp.html) burn7(tp, tp.html, 0);
          };
          executeChoreoStrike({
            style: st,
            stepKind: "discard",
            srcUid: e.src,
            srcId: sid,
            sp,
            tp,
            r0: null,
            srcEl: mcEl9(e.src),
            liftMs: 45,
            flyMs: 185,
            onImpact: fireBurn
          });
          fxT(fireBurn, 260);
        }, stDelay);
      });

      /* (B) Chú Cuội (linhtuonglai) phóng rễ đa cổ thụ câu trộm bộ bài đối thủ (tuần tự 880ms/thẻ) */
      if (evs.x7 && Array.isArray(evs.x7.stolen)) {
        evs.x7.stolen.slice(0, 2).forEach((st, idx) => {
          const sc = st.src ? anyC(st.src) : null;
          const sid = sc ? (E.ab(sc) || sc.id) : null;
          const sp = st.src ? W(st.src) : null;
          if (!sp || !sid) return;
          const fromBox = (typeof DECKZ === "function" && DECKZ(st.fromSide)) || { x: window.innerWidth * 0.74, y: 34 };
          const toBox = st.toSide === "p" ? ((typeof zpt === "function" && zpt("hand")) || { x: window.innerWidth * 0.5, y: window.innerHeight - 90 }) : fromBox;
          const k = getPullKind(sid);
          const stDelay = idx * 580;
          if (typeof holdFx === "function") holdFx(stDelay + 560);
          fxT(() => {
            SFX.play(k === "banyan" ? "e_moc" : "chain");
            runPhysicalTether({ kind: k, srcId: sid, src: sp, from: fromBox, to: toBox, extendMs: 150, holdMs: 60, pullMs: 320 });
          }, stDelay);
        });
      }

      /* (D) NHÂN BẢN THẺ BÀI (clone): Mở Gương Đồng Đông Sơn -> Tách bóng song sinh -> Bay vòng cung tuần tự 860ms/thẻ */
      const clones = evs.filter((e) => e.k === "clone");
      clones.slice(0, 4).forEach((e, idx) => {
        const c = anyC(e.uid);
        if (!c) return;
        const fp = W(e.from);
        const s = c.side;
        let tp = R1.get(e.uid) || (typeof hpt === "function" ? hpt(e.uid) : null);
        if (!tp) tp = G.hand[s] && G.hand[s].includes(c) ? HANDZ(s) : (G.deck[s] || []).includes(c) ? DECKZ(s) : null;
        if (!fp || !tp) return;
        const pub = R0.has(e.from) || R1.has(e.from) || R1.has(e.uid) || s === "p";
        if (pub && typeof spLoad === "function") spLoad(c.id);
        const dstDom = document.querySelector(`#board [data-mc="${e.uid}"]`) || (s === "p" ? document.querySelector(`#hand [data-hc="${e.uid}"]`) : null);
        const srcDom = document.querySelector(`#board [data-mc="${e.from}"]`);
        const html = pub
          ? ((dstDom && typeof cleanCloneHTML === "function" && cleanCloneHTML(dstDom)) || (srcDom && typeof cleanCloneHTML === "function" && cleanCloneHTML(srcDom)) || (typeof liteId === "function" ? liteId(c.id) : ""))
          : (typeof BACK7 === "function" ? BACK7() : "");
        const stDelay = idx * 560;
        const mirMs = 170, showMs = 120, flyMs = 300;
        if (typeof holdFx === "function") holdFx(stDelay + mirMs + showMs + flyMs + 60);
        if (dstDom) dstDom.style.opacity = "0";

        fxT(() => {
          SFX.fam("create", { el: null });
          if (typeof window.playV16 === "function") window.playV16("sao_chep", fp.x, fp.y, 136, 540, 0);
          const mir = document.createElement("div");
          mir.className = "choreo-mirror-fx";
          mir.style.cssText = `left:${fp.x}px;top:${fp.y}px;width:${Math.min(146, cwB() * 1.4).toFixed(0)}px;height:${Math.min(146, cwB() * 1.4).toFixed(0)}px;--gc:#7fe8ff`;
          mir.innerHTML = `<img src="img/v/v_an_mat.webp?v=gpu19" alt="">` + spriteHtml("guong", mirMs + showMs + 100, 0, 15);
          document.body.appendChild(mir);
          if (typeof window.v16Activate === "function") window.v16Activate(mir);
          mir.animate([
            { transform: "translate(-50%,-50%) scale(0.28) rotate(-35deg)", opacity: 0 },
            { transform: "translate(-50%,-50%) scale(1.09) rotate(0deg)", opacity: 1, offset: 0.36 },
            { transform: "translate(-50%,-50%) scale(1.08) rotate(8deg)", opacity: 0.92, offset: 0.72 },
            { transform: "translate(-50%,-50%) scale(1.17) rotate(22deg)", opacity: 0 }
          ], { duration: mirMs + showMs + 120, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => mir.remove();
          fxT(() => mir.remove(), mirMs + showMs + 180);

          const w0 = Math.max(48, fp.w || 54), h0 = Math.max(68, fp.h || 76);
          const twin = ghost({ x: fp.x, y: fp.y, w: w0, h: h0 }, html, "g9");
          twin.style.zIndex = "39";
          const dx = tp.x - fp.x, dy = tp.y - fp.y;
          const splitX = dx >= 0 ? 24 : -24;
          const scEnd = clamp((tp.w || w0) / w0, 0.65, 1.25);

          const animTwin = twin.animate([
            { transform: "perspective(680px) translate3d(0, 0, 5px) scale(0.65)", opacity: 0 },
            { transform: `perspective(680px) translate3d(${splitX}px, -20px, 22px) rotateY(-12deg) scale(1.12)`, opacity: 1, offset: 0.26 },
            { transform: `perspective(680px) translate3d(${splitX}px, -22px, 24px) rotateY(0deg) scale(1.12)`, opacity: 1, offset: 0.50 },
            { transform: `perspective(680px) translate3d(${(dx * 0.56).toFixed(1)}px, ${(dy * 0.56 - 38).toFixed(1)}px, 42px) rotateZ(${(dx >= 0 ? 8 : -8)}deg) scale(1.08)`, opacity: 1, offset: 0.78 },
            { transform: `perspective(680px) translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${scEnd.toFixed(2)})`, opacity: 1 }
          ], { duration: mirMs + showMs + flyMs, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });

          let doneCl = false;
          const finCl = () => {
            if (doneCl) return;
            doneCl = true;
            if (twin.isConnected) twin.remove();
            if (dstDom && dstDom.isConnected) {
              dstDom.style.opacity = "";
              dstDom.animate([
                { transform: "scale(1.09)" },
                { transform: "scale(1)" }
              ], { duration: 240, easing: "ease-out" });
            }
            spawnPaintedBurst("song_xung", tp.x, tp.y, 138, "#7fe8ff", 340);
            spawnPaintedBurst("sao_tang", tp.x, tp.y, 124, "#b8f6ff", 340);
            SFX.play("place");
            if (idx === 0 && pub && C[c.id] && window.pushOppNotif) {
              window.pushOppNotif(`${C[c.id].n} ▸ Nhân bản`, "#7fe8ff");
            }
          };
          animTwin.onfinish = finCl;
          fxT(finCl, mirMs + showMs + flyMs + 60);
        }, stDelay);
      });

      /* (E) TRIỆU HỒI TỰ ĐỘNG / TỪ CHIẾN ĐỊA / TỪ MỘ: Mở Cổng Triệu Hồi tuần tự 620ms/thẻ */
      const freeSummons = evs.filter((e) => e.k === "summon" && R1.has(e.uid) && !clones.some((x) => x.uid === e.uid) && !(typeof S8 !== "undefined" && S8.has("u" + e.uid)));
      freeSummons.slice(0, 4).forEach((e, idx) => {
        if (typeof S8 !== "undefined") S8.add("u" + e.uid);
        const tp = R1.get(e.uid);
        const dom = document.querySelector(`#board [data-mc="${e.uid}"]`);
        if (!tp || !dom) return;
        const c = anyC(e.uid);
        const col = c && C[c.id] ? (HC[C[c.id].h] || "#86ff8a") : "#86ff8a";
        const stDelay = idx * 440;
        if (typeof holdFx === "function") holdFx(stDelay + 600);
        dom.style.opacity = "0";
        fxT(() => {
          SFX.fam("create", { el: null });
          if (typeof window.playV16 === "function") window.playV16("tao_the", tp.x, tp.y, Math.max(108, (tp.w || 54) * 1.95), 520, 0);
          const gate = document.createElement("div");
          gate.className = "gpu-summon-gate";
          gate.style.cssText = `left:${tp.x}px;top:${tp.y}px;width:146px;height:146px;--gc:${col}`;
          gate.innerHTML = `<img src="img/v/v_an_vong.webp?v=gpu19" alt="">` + spriteHtml("cong", 520, 0, 15);
          document.body.appendChild(gate);
          if (typeof window.v16Activate === "function") window.v16Activate(gate);
          gate.animate([
            { transform: "translate(-50%,-50%) scale(0.25) rotate(-90deg)", opacity: 0 },
            { transform: "translate(-50%,-50%) scale(1.07) rotate(25deg)", opacity: 1, offset: 0.30 },
            { transform: "translate(-50%,-50%) scale(1.04) rotate(120deg)", opacity: 0.85, offset: 0.72 },
            { transform: "translate(-50%,-50%) scale(1.16) rotate(210deg)", opacity: 0 }
          ], { duration: 540, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => gate.remove();
          fxT(() => gate.remove(), 580);

          fxT(() => {
            if (!dom.isConnected) return;
            dom.style.opacity = "";
            dom.animate([
              { opacity: 0, transform: "perspective(650px) translate3d(0, 24px, -30px) rotateX(32deg) scale(0.42)" },
              { opacity: 1, transform: "perspective(650px) translate3d(0, -8px, 12px) rotateX(-6deg) scale(1.07)", offset: 0.56 },
              { opacity: 1, transform: "perspective(650px) translate3d(0, 0, 0) scale(1)" }
            ], { duration: 360, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
            spawnPaintedBurst("song_xung", tp.x, tp.y, 136, col, 320);
            if (idx === 0 && c && C[c.id] && window.pushOppNotif) {
              window.pushOppNotif(`${C[c.id].n} ▸ Triệu hồi`, col);
            }
          }, 120);
        }, stDelay);
      });

      /* (C) Lôi Đài Chủ (giacdausi) kéo thẻ từ bộ bài địch ra sàn VÀ tung Thiết Quyền rồng lửa hạ đo ván! */
      for (const e of evs) {
        if (e.k === "destroy" && e.src > 0 && !R0.has(e.uid) && !R1.has(e.uid) && evs.some((x) => x.k === "summon" && x.uid === e.uid && x.src === e.src)) {
          const sc = anyC(e.src);
          const sid = sc ? (E.ab(sc) || sc.id) : null;
          const sp = W(e.src);
          if (!sp) continue;
          if (typeof holdFx === "function") holdFx(1520);
          const ln = document.querySelector(`#board [data-lane="${e.li != null ? e.li : 1}"]`);
          const oppSide = ln && ln.querySelector(sc && sc.side === "p" ? ".side.opp" : ".side.me");
          const lr = (oppSide || ln || document.body).getBoundingClientRect();
          const stagePt = { x: lr.left + lr.width / 2, y: lr.top + lr.height / 2, w: 54, h: 76, html: liteId(e.id) };
          const foeDeck = (typeof DECKZ === "function" && DECKZ(sc && sc.side === "p" ? "a" : "p")) || { x: window.innerWidth * 0.74, y: 34 };

          SFX.play("chain");
          runPhysicalTether({ kind: "hook", srcId: sid, src: sp, from: foeDeck, to: stagePt, extendMs: 130, holdMs: 35, pullMs: 285 });
          const victim = ghost(foeDeck, stagePt.html, "g9");
          victim.style.zIndex = "35";
          victim.animate([
            { transform: "translate3d(0,0,0) scale(0.6)" },
            { transform: `translate3d(${(stagePt.x - foeDeck.x).toFixed(1)}px, ${(stagePt.y - foeDeck.y).toFixed(1)}px, 0) scale(1)` }
          ], { duration: 375, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });

          fxT(() => {
            victim.remove();
            executeChoreoStrike({
              style: sid === "giacdausi" ? "arena_ko" : resolveStyle(sid, "kill"),
              stepKind: "kill",
              srcUid: e.src,
              srcId: sid,
              sp,
              tp: stagePt,
              r0: stagePt,
              srcEl: mcEl9(e.src),
              liftMs: 42,
              flyMs: 220,
              onImpact: () => {
                SFX.play("destroy");
                CFX.destroy(stagePt);
                const victimNm = e.id && C[e.id] ? C[e.id].n.toUpperCase() : "ĐỐI THỦ";
                if (window.pushOppNotif) pushOppNotif(`LÔI ĐÀI CHỦ ▸ KÉO ${victimNm} LÊN ĐÀI & ĐẤM HẠ ĐO VÁN!`, "#ff7a3d");
              }
            });
          }, 385);
        }
      }

      /* (D) Các thẻ tự kích hoạt tại chỗ / phóng đạo cụ vào Bộ Bài */
      const steppedSrcs = new Set((typeof STEPS12 !== "undefined" ? STEPS12 : []).map((s) => s.src));
      for (const e of evs) {
        if (e.k !== "flip" && e.k !== "act") continue;
        if (steppedSrcs.has(e.uid)) continue;
        const inst = anyC(e.uid);
        if (!inst || inst.sil) continue;
        const cid = E.ab(inst) || inst.id;
        const def = C[cid];
        if (!def || (def.t !== "rev" && def.t !== "act")) continue;
        const sp = R1.get(e.uid) || W(e.uid);
        if (!sp) continue;

        if (cid === "tinhquyennu" || cid === "thantho" || cid === "loithan") {
          const dz = (typeof DECKZ === "function" && DECKZ(inst.side)) || sp;
          executeChoreoStrike({
            style: cid === "loithan" ? "sky_hammer" : cid === "thantho" ? "forge_strike" : "persimmon_gift",
            stepKind: "up",
            srcUid: e.uid,
            srcId: cid,
            sp,
            tp: dz,
            srcEl: mcEl9(e.uid),
            liftMs: 90,
            flyMs: 275
          });
        } else if (cid === "thoren" || cid === "longuclua") {
          fxT(() => {
            SFX.play("forge");
            const hm = spawnProp("bua_ren", sp.x + 14, sp.y - 24, 138, 128, "#ffd65a", 40);
            hm.animate([
              { transform: "rotate(38deg) scale(0.6)", opacity: 0 },
              { transform: "rotate(46deg) scale(1.09)", opacity: 1, offset: 0.3 },
              { transform: "translate(-12px, 20px) rotate(-6deg) scale(1.11)", opacity: 1, offset: 0.62 },
              { transform: "translate(-8px, 16px) rotate(-2deg) scale(1.0)", opacity: 0 }
            ], { duration: 400, easing: "ease-out", fill: "forwards" }).onfinish = () => hm.remove();
            fxT(() => hm.remove(), 460);
            spawnPaintedBurst("sao_tang", sp.x, sp.y, 146, "#ffd65a", 380);
            spawnPaintedBurst("no_lua", sp.x, sp.y, 138, "#ff9a2b", 360);
          }, 140);
        } else if (cid === "chonphao") {
          fxT(() => {
            SFX.play("boom");
            const cn = spawnProp("phao_tre", sp.x, sp.y - 8, 154, 68, "#ff7a2b", 40);
            cn.animate([
              { transform: "rotate(-28deg) scale(0.5)", opacity: 0 },
              { transform: "rotate(-35deg) scale(1.09)", opacity: 1, offset: 0.35 },
              { transform: "translate(-8px, 8px) rotate(-25deg) scale(1.08)", opacity: 1, offset: 0.65 },
              { transform: "rotate(-25deg) scale(0.8)", opacity: 0 }
            ], { duration: 420, fill: "forwards" }).onfinish = () => cn.remove();
            fxT(() => cn.remove(), 480);
            spawnPaintedBurst("no_lua", sp.x + 24, sp.y - 22, 148, "#ffd65a", 380);
          }, 140);
        } else if (cid === "thantien" || cid === "nuthantien") {
          fxT(() => {
            SFX.play("bow");
            const bw = spawnProp("cung_doc", sp.x, sp.y, 128, 146, "#ffd65a", 40);
            bw.animate([
              { transform: "rotate(-90deg) scale(0.5)", opacity: 0 },
              { transform: "rotate(-90deg) scale(1.09)", opacity: 1, offset: 0.45 },
              { transform: "rotate(-90deg) scale(0.85)", opacity: 0 }
            ], { duration: 400, fill: "forwards" }).onfinish = () => bw.remove();
            fxT(() => bw.remove(), 460);
          }, 130);
        } else if (cid === "channu") {
          const f = E.find(G, e.uid);
          const others = [0, 1, 2].filter((x) => !f || x !== f.li);
          if (others.length === 2) {
            const lA = document.querySelector(`#board [data-lane="${others[0]}"] .locw`);
            const lB = document.querySelector(`#board [data-lane="${others[1]}"] .locw`);
            if (lA && lB) {
              const rA = lA.getBoundingClientRect(), rB = lB.getBoundingClientRect();
              const dxAB = rB.left - rA.left;
              SFX.play("e_dat");
              if (window.GLFX) GLFX.impulseShake(7.8, 1, 0);
              lA.animate([{ transform: `translateX(${dxAB.toFixed(0)}px) scale(1.08)` }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
              lB.animate([{ transform: `translateX(${(-dxAB).toFixed(0)}px) scale(1.08)` }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
            }
          }
        }
      }
    };
  }

  window.CardChoreo = {
    PROPS,
    VFX_IMG_CACHE,
    getPullKind,
    getPushKind,
    resolveStyle,
    executeChoreoStrike,
    runPhysicalTether,
    /* gpu23: dùng bởi Bảng Test VFX (js/dev-vfx-lab.js); runChoreoPreset/previewSpecificCard được bảng test gắn thêm khi nạp */
    PULL_MAP,
    PUSH_MAP,
    spawnProp,
    spawnPaintedBurst,
    pickCardSpriteKey
  };
})();
