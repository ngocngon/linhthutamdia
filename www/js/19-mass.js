/* ===== Module 19 (gpu71, làn C): TUYỆT KỸ DIỆN RỘNG CỦA THẺ S5 (MASS) =====
   Mẫu: Tiểu Trạng Nguyên (17-sig.js). Thẻ S5 có kỹ năng chạm tới NHIỀU thẻ (cả hai phía, toàn bàn, cả tay / bộ bài) hoặc TOÀN BẢN ĐỒ
   không bay tới tấn công từng mục tiêu. Thẻ chỉ HIỆN RA (hồn PA6 trên khung / hồn nhỏ ló khỏi lá) rồi thi triển TUYỆT KỸ:
     1. SÂN KHẤU: khung sáng theo hệ bao đúng vùng bị tác động (một chiến địa / toàn bàn / tay bài / bộ bài), ảnh nhân vật hiện mờ khổng lồ,
        đạo cụ vẽ riêng của thẻ (img/mass/<id>.webp, thiếu thì img/v) mở ra giữa sân khấu + tờ va chạm theo hệ (img/hx).
     2. ĐIỂM DANH: từng mục tiêu sáng lên TẠI CHỖ theo thứ tự đọc được (trái -> phải, phía địch rồi phía mình, rồi tay, bộ bài, chiến địa);
        sợi sáng từ đạo cụ tới ô số -> ô số đếm cũ -> mới + nhãn nhỏ (P6.stat), hoặc dấu riêng của loại hiệu ứng (tiêu huỷ, dời, biến hình,
        mất kỹ năng, vào tay…). Nhiều mục tiêu giống hệt nhau (> 6 mục tiêu): cả nhóm cùng nhịp, so le ≤ 90 ms. Bộ đếm "k/n · +x −y" dưới đạo cụ.
     3. KẾT: đạo cụ + bộ đếm thu về thành luồng sáng chảy vào thẻ nguồn, số của chính thẻ đổi đúng lúc này.
   Dữ liệu: mục tiêu lấy từ CHÊNH LỆCH trạng thái engine trước/sau bước (snapX mở rộng: bàn, tay, bộ bài, chiến địa) — không đoán theo chữ.
   Lịch: đăng ký vào bảng phụ SIGK.x (17-sig.js) -> dùng chung cơ chế giữ kết quả tới mốc trúng, QUY LUẬT DIỄN ([A] -> [B] -> [C]) ở đầu 15-pa6.js.
   P6.noFly: mọi chuỗi PA6 của thẻ S5 không bay tới mục tiêu (hồn thi triển tại chỗ, P6.ultFx vẽ tuyệt kỹ trên vùng mục tiêu).
   MASS.skip(): kết thúc ngay, hiện trạng thái cuối (cho nút "Bỏ qua" > 60 s của làn khác). Không có chạm-để-tua riêng.
   Hiệu năng: DOM chỉ transform/opacity (WAAPI), ánh sáng/hạt ở lớp WebGL của PA6 (có trần), không đo bố cục trong vòng lặp khung hình. */
(function () {
  "use strict";
  const W = window;
  if (!W.SIGK || !SIGK.kit || !W.P6 || !P6.kit) return;
  const SG = SIGK, K = SG.kit, VER = "gpu71";
  const MS = {};
  W.MASS = MS;
  const { glow, ring, star, streaks, converge, beam } = P6.fx;
  const E6 = P6.kit.E6, rnd = P6.kit.rnd, cols = P6.cols;
  const { el0, tl, arc, trail, rc, mcOf, hcOf, sfx, live } = K;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const tap = (k, o) => { try { if (W.MASS_TAP) W.MASS_TAP(k, o || {}); } catch (e) {} };
  const lite = () => P6.tier() === "lite";
  const nmOf = (id) => (id && C[id] ? C[id].n : "");

  /* ---------- danh sách thẻ (quét C[id].h === "S5" + chữ kỹ năng "tất cả / mỗi / các thẻ / mọi chiến địa…" + engine chạm ≥ 3 thẻ / toàn bản đồ;
     bỏ thẻ chỉ tự cộng theo số đếm và thẻ đã có màn diễn riêng: Tiểu Trạng Nguyên, Đồ Thần, Nguyệt Thạch, Chiến Thần) ---------- */
  const IDS = ["hacdichbinh", "maynuotthoigian", "nghichtuvuong", "cucquang", "phaodaimay", "thienngaden", "hongtam", "nuthuantuong", "tammanu",
    "daitaxacsong", "matocvutru", "tuthanmienvien", "nguyetlong", "aosi", "huyetdichhangxom", "kenuotsao", "thukydungcam", "cuongnhanxam", "nuhongtam",
    "bangca", "sautham", "yeuhau", "acmong", "tamkiemmienvien", "bocapngaymoi", "hoavatnu", "virutcosinh", "docdich", "huyetmenu", "cosinhthe",
    "xactinhquang", "kimcuongxa", "dacvuquocgia", "cosi", "kysiho", "nuloimienvien", "phonglinhnu", "hongnutinhquai", "taysatnu"];
  MS.ids = IDS;
  /* chủ đề tuyệt kỹ riêng (nhãn + màu nhấn), ảnh đạo cụ: img/mass/<id>.webp hoặc img/v/v_<id>.webp */
  const THEME = {
    hacdichbinh: ["DỊCH BỆNH NHUỘM BỘ BÀI", "#9dff5a"], maynuotthoigian: ["MÂY NUỐT KỸ NĂNG", "#c7b8ff"], nghichtuvuong: ["TỪ TRƯỜNG ĐẢO CHIỀU", "#ff5ad0"],
    cucquang: ["DẢI CỰC QUANG", "#7dffd8"], phaodaimay: ["XƯỞNG ĐÚC BẢN SAO", "#ffb84d"], thienngaden: ["VŨ ĐIỆU THIÊN NGA ĐEN", "#b06bff"],
    hongtam: ["MƯA TÊN HỒNG TÂM", "#ff5a7a"], nuthuantuong: ["THUẪN TRẬN", "#ffd65a"], tammanu: ["TÂM MA HÚT HỒN", "#ff6b86"],
    daitaxacsong: ["HIỆU LỆNH XÁC SỐNG", "#9dff5a"], matocvutru: ["XOÁ VŨ TRỤ", "#7fdcff"], tuthanmienvien: ["CỔNG ÂM HỒI SINH", "#b6ffe8"],
    nguyetlong: ["TRĂNG HÚT LỰC", "#bfe8ff"], aosi: ["ẢO ẢNH TRỪ LỰC", "#d46bff"], huyetdichhangxom: ["HUYẾT LỆNH DỜI QUÂN", "#ff4d5e"],
    kenuotsao: ["NUỐT CHIẾN ĐỊA", "#8a5cff"], thukydungcam: ["SỔ PHONG THƯỞNG", "#ffe7a0"], cuongnhanxam: ["CUỒNG LỰC GIẢM GIÁ", "#b8c0dc"],
    nuhongtam: ["TÊN HỒNG TÂM", "#ff5a7a"], bangca: ["BĂNG PHONG", "#8fe6ff"], sautham: ["KHÚC SẦU TẾ HIẾN", "#9aa3c7"],
    yeuhau: ["YÊU HẬU GỌI HỒN", "#ff7ad9"], acmong: ["ÁC MỘNG ĐỔI HỒN", "#8a5cff"], tamkiemmienvien: ["TÂM KIẾM GIẢM LỰC", "#7fe0ff"],
    bocapngaymoi: ["ĐỘC VĨ NHÂN ĐÔI", "#9dff5a"], hoavatnu: ["HOÁ VẬT", "#d46bff"], virutcosinh: ["LÂY NHIỄM", "#9dff5a"],
    docdich: ["ĐỘC DỊCH CUỐN VỀ", "#9dff5a"], huyetmenu: ["HUYẾT MÊ HÚT LỰC", "#ff4d5e"], cosinhthe: ["CƠ SINH GIẢM NĂNG", "#7fe0ff"],
    xactinhquang: ["TẾ XÁC TINH QUANG", "#ffe7a0"], kimcuongxa: ["NỌC KIM CƯƠNG", "#7fdcff"], dacvuquocgia: ["LỆNH ĐẶC VỤ", "#ff6b86"],
    cosi: ["CỜ HIỆU TIẾP SỨC", "#ffd65a"], kysiho: ["HỘ VỆ TIẾP SỨC", "#ffd65a"], nuloimienvien: ["LÔI PHÁN XÉT", "#ffe04a"],
    phonglinhnu: ["GIÓ LINH TRUYỀN LỰC", "#b6ffe8"], hongnutinhquai: ["TRÒ TINH QUÁI", "#ff7ad9"], taysatnu: ["TAY SẮT RÈN BÀI", "#c9d2e6"],
  };

  /* ---------- ảnh đạo cụ ---------- */
  const PIMG = new Map(), MHAS = new Set();
  fetch("img/mass/mass.json?v=" + VER).then((r) => (r.ok ? r.json() : [])).then((j) => { for (const k of Array.isArray(j) ? j : []) MHAS.add(k); }).catch(() => {});
  const propUrl = (id) => {
    if (MHAS.has(id)) return new URL("img/mass/" + id + ".webp?v=" + VER, document.baseURI).href;
    try { return (typeof vimg === "function" && vimg(id)) || null; } catch (e) { return null; }
  };
  function pre(id) {
    if (PIMG.has(id)) return;
    const u = propUrl(id);
    if (!u) return;
    const im = new Image(); im.decoding = "async"; im.src = u; PIMG.set(id, im);
    if (im.decode) im.decode().catch(() => {});
  }
  const propOk = (id) => { const im = PIMG.get(id); return im && im.complete && im.naturalWidth ? im : null; };
  try { const w0 = warmMatch12; warmMatch12 = function () { const r = w0.apply(this, arguments); setTimeout(() => { try { for (const sd of ["p", "a"]) for (const z of ["hand", "deck"]) for (const c of (G[z] && G[z][sd]) || []) if (IDS.includes(c.id)) { pre(c.id); K.soulSrc(c.id, null); } } catch (e) {} }, 1600); return r; }; } catch (e) {}
  MS.ready = () => IDS.filter((k) => !!propOk(k));
  MS.pre = pre;

  /* ---------- ảnh chụp trạng thái trước bước (mở rộng snapX của 05) ---------- */
  const hp = (c) => { try { return typeof handPow === "function" ? handPow(c) : E.basePow(c) + (c.bonus || 0); } catch (e) { return 0; } };
  const cst = (c) => { try { return E.cost(G, c); } catch (e) { return C[c.id] ? C[c.id].c : 0; } };
  const abOf = (c) => { try { return E.ab(c); } catch (e) { return c.id; } };
  function snapM() {
    const o = { G, b: new Map(), h: new Map(), d: new Map(), pile: new Map(), L: [] };
    for (let li = 0; li < 3; li++) {
      const L = G.locs[li];
      o.L.push({ id: L.id, gone: !!L.gone, rvl: !!L.rvl });
      for (const sd of E.SIDES) L.cards[sd].forEach((c, k) => o.b.set(c.uid, { li, sd, k, id: c.id, ab: abOf(c), sil: !!c.sil, rev: !!c.rev }));
    }
    for (const sd of E.SIDES) {
      for (const c of G.hand[sd]) o.h.set(c.uid, { sd, id: c.id, ab: abOf(c), pw: hp(c), cs: cst(c) });
      for (const c of G.deck[sd]) o.d.set(c.uid, { sd, id: c.id, pw: E.basePow(c) + (c.bonus || 0), cs: cst(c) });
      for (const z of ["disc", "dead"]) for (const c of (G[z] && G[z][sd]) || []) o.pile.set(c.uid, z);
    }
    return o;
  }
  let SNM = null;
  {
    const sx0 = snapX;
    snapX = function () { const r = sx0.apply(this, arguments); try { if (G && !reduced) SNM = snapM(); } catch (e) { SNM = null; } return r; };
  }
  MS.snap = () => SNM;

  /* ---------- chênh lệch -> danh sách mục tiêu ---------- */
  const where = (u) => {
    for (let li = 0; li < 3; li++) for (const sd of E.SIDES) { const k = G.locs[li].cards[sd].findIndex((c) => c.uid === u); if (k >= 0) return { z: "board", li, sd, k, c: G.locs[li].cards[sd][k] }; }
    for (const sd of E.SIDES) {
      let c = G.hand[sd].find((x) => x.uid === u); if (c) return { z: "hand", sd, c };
      c = G.deck[sd].find((x) => x.uid === u); if (c) return { z: "deck", sd, c };
      for (const z of ["disc", "dead"]) { c = ((G[z] && G[z][sd]) || []).find((x) => x.uid === u); if (c) return { z, sd, c }; }
    }
    return null;
  };
  function diff(P) {
    const S = SNM, out = [], seen = new Set(), P0 = P.P0 || new Map();
    if (!S || S.G !== G) return out;
    const add = (t) => { if (t.u === P.uid) return; if (seen.has(t.z + t.u)) return; seen.add(t.z + t.u); out.push(t); };
    /* bàn */
    for (let li = 0; li < 3; li++) for (const sd of E.SIDES) G.locs[li].cards[sd].forEach((c, k) => {
      if (c.uid === P.uid) return;
      const b = S.b.get(c.uid);
      const pw1 = c.rev ? E.power(G, c, li) : null, pw0 = P0.has(c.uid) ? P0.get(c.uid) : null;
      const dp = pw0 != null && pw1 != null ? pw1 - pw0 : 0;
      const base = { u: c.uid, z: "board", li, sd, k, id: c.id };
      if (!b) { add(Object.assign(base, { kind: "summon", from: S.h.has(c.uid) ? "hand" : S.pile.has(c.uid) ? S.pile.get(c.uid) : S.d.has(c.uid) ? "deck" : "new" })); return; }
      if (b.li !== li) { add(Object.assign(base, { kind: "move", li0: b.li, d: dp, v0: pw0, v1: pw1 })); return; }
      if (b.id !== c.id) { add(Object.assign(base, { kind: "transform", id0: b.id, d: dp, v0: pw0, v1: pw1 })); return; }
      if (!b.sil && c.sil) { add(Object.assign(base, { kind: "silence", d: dp, v0: pw0, v1: pw1 })); return; }
      if (b.ab !== abOf(c)) { add(Object.assign(base, { kind: "copy", d: dp, v0: pw0, v1: pw1 })); return; }
      if (dp) add(Object.assign(base, { kind: dp > 0 ? "buff" : "debuff", d: dp, v0: pw0, v1: pw1 }));
    });
    for (const [u, b] of S.b) {
      if (u === P.uid) continue;
      const w = where(u);
      if (w && w.z === "board") continue;
      const base = { u, z: "board", li: b.li, sd: b.sd, k: b.k, id: b.id, gone: 1 };
      add(Object.assign(base, { kind: !w ? "destroy" : w.z === "dead" ? "destroy" : w.z === "hand" ? "bounce" : w.z === "disc" ? "discard" : w.z === "deck" ? "bounce" : "destroy" }));
    }
    /* tay */
    for (const sd of E.SIDES) {
      G.hand[sd].forEach((c) => {
        if (c.uid === P.uid) return;
        const h = S.h.get(c.uid), base = { u: c.uid, z: "hand", sd, id: c.id };
        if (!h) { if (!S.b.has(c.uid)) add(Object.assign(base, { kind: "add", from: S.pile.get(c.uid) || (S.d.has(c.uid) ? "deck" : "new") })); return; }
        const dc = cst(c) - h.cs, dp = hp(c) - h.pw;
        if (abOf(c) !== h.ab) add(Object.assign(base, { kind: "transform", d: dp, c0: h.cs, c1: cst(c), v0: h.pw, v1: hp(c) }));
        else if (dc) add(Object.assign(base, { kind: "cost", d: dc, c0: h.cs, c1: cst(c), dp, v0: h.pw, v1: hp(c) }));
        else if (dp) add(Object.assign(base, { kind: dp > 0 ? "buff" : "debuff", d: dp, v0: h.pw, v1: hp(c) }));
      });
      for (const [u, h] of S.h) { if (h.sd !== sd || u === P.uid) continue; const w = where(u); if (w && w.z === "disc") add({ u, z: "hand", sd, id: h.id, kind: "discard" }); }
      /* bộ bài */
      for (const c of G.deck[sd]) {
        const d = S.d.get(c.uid);
        if (!d) continue;
        const dp = E.basePow(c) + (c.bonus || 0) - d.pw, dc = cst(c) - d.cs;
        if (dp || dc) add({ u: c.uid, z: "deck", sd, id: c.id, kind: dc && !dp ? "cost" : dp > 0 ? "buff" : "debuff", d: dp || dc, v0: d.pw, v1: d.pw + dp });
      }
    }
    /* chiến địa */
    G.locs.forEach((L, li) => { const o = S.L[li]; if (o && (o.gone !== !!L.gone || (o.rvl && L.rvl && o.id !== L.id))) add({ u: -1 - li, z: "loc", li, kind: "loc", gone: !!L.gone }); });
    return out;
  }
  MS.diff = diff;

  /* thứ tự đọc: chiến địa trái -> phải (địch trước, mình sau, theo ô), rồi tay mình, tay địch, bộ bài, chiến địa */
  const ZO = { board: 0, hand: 1, deck: 2, loc: 3 };
  const ord = (P) => (a, b) => (ZO[a.z] - ZO[b.z]) || (a.z === "board" ? (a.li - b.li) || ((a.sd === P.side ? 1 : 0) - (b.sd === P.side ? 1 : 0)) || (a.k - b.k) : a.z === "hand" || a.z === "deck" ? ((a.sd === P.side ? 0 : 1) - (b.sd === P.side ? 0 : 1)) : (a.li || 0) - (b.li || 0));

  /* ---------- nhịp ---------- */
  const TM = { OPEN: 720, BEAT1: 330, BEATG: 430, STAG: 90, FL: 720, NATG: 160 };
  const NATIVE = /^(move|swap|loc|top|ult29|lshield)$/;
  const OWNK = /^(up|down|kill|summon|bounce|reset|sil|copy|steal|cost)$/;
  function groupsOf(P) {
    const L = P.tg.filter((t) => !t.nat);
    if (L.length <= 6) return L.map((t) => [t]);
    const m = new Map();
    for (const t of L) { const k = t.z + "|" + t.kind + "|" + (t.d || 0) + "|" + (t.z === "deck" ? t.sd : ""); if (!m.has(k)) m.set(k, []); m.get(k).push(t); }
    let g = [...m.values()];
    while (g.length > 7) { const x = g.pop(); g[g.length - 1].push(...x); }
    return g;
  }
  const s0Of = (P) => { try { const ch = P6.ch(); return ch && !ch.dead && ch.src === P.uid && ch.off0 ? ch.off0 + 20 : 40; } catch (e) { return 40; } };
  const natHit = (s) => { try { return q8(s, () => { const t0 = s.t0 || 0; if (s.k === "move" || s.k === "swap") return t0 + mvDur9(s) * 0.85; if (s.k === "top") return t0 + topHit29(s) + 200; if (s.k === "loc") return t0 + T8.LIFT + 620 + 700; if (s.k === "ult29") return t0 + (s.T || 900); return t0 + 400; }); } catch (e) { return (s.t0 || 0) + 600; } };
  /* mốc: OPEN (sân khấu mở) -> bước gốc (dời/chiến địa/ra mắt) -> điểm danh từng nhóm -> KẾT (P.Tf) */
  function sched(P) {
    const g = groupsOf(P), st = s0Of(P) + (P.delay || 0);
    let t = TM.OPEN, natEnd = 0;
    for (const s of P.nat || []) { const h = natHit(s) - st; natEnd = Math.max(natEnd, h); }
    if (natEnd) t = Math.max(t, natEnd + TM.NATG);
    const beat = g.length && g.every((x) => x.length === 1) ? TM.BEAT1 : TM.BEATG;
    P.G = g.map((list, i) => ({ list, t: t + i * beat }));
    P.Tf = t + g.length * beat + (g.length ? 160 : 260);
    P.natEnd = natEnd;
    return P.Tf + TM.FL;
  }

  /* ---------- màn diễn chung ---------- */
  let CUR = null;
  const def0 = (id) => ({
    kind: C[id].t,
    T: (P) => (P.hasNat ? TM.OPEN : P.Tf || TM.OPEN + 400),
    dur: (P) => sched(P),
    hand: 1,
    prep(P) {
      pre(id);
      const tg = diff(P);
      if (!tg.length) return false;
      tg.sort(ord(P));
      P.tg = tg; P.allSteps = []; P.nat = [];
      P.hasNat = tg.some((t) => t.kind === "move" || t.kind === "loc" || (t.kind === "summon" && C[t.id] && /S4|S5/.test(C[t.id].h)));
      sched(P);
      P.mid = id;
      CUR = P;
    },
    own(s, P) {
      P.allSteps.push(s);
      if ((s.k === "up" || s.k === "down") && s.dst === P.uid) { P.selfStep = s; return true; }
      const u = s.k === "cost" && s.hc ? s.hc : s.dst;
      const t = P.tg.find((x) => x.u === u);
      if (NATIVE.test(s.k)) { if (t) { t.nat = s; P.nat.push(s); } return false; }
      if (!t || !OWNK.test(s.k)) return false;
      (t.steps || (t.steps = [])).push(s);
      return true;
    },
    late(P) { sched(P); },
    run(P, j, total) { runMass(P, j, total); },
  });
  for (const id of IDS) if (C[id] && /^(rev|on|act|end)$/.test(C[id].t)) SG.addX(id, def0(id));

  /* hồn PA6 của thẻ đang diễn tuyệt kỹ: không có điểm dừng ở mục tiêu (mục tiêu sáng tại chỗ trong màn diễn), chờ tới cuối */
  {
    const pl0 = P6.plan;
    P6.plan = function (H) {
      const P = CUR, ch = P6.ch();
      try {
        if (P && !P.dead && ch && !ch.dead && ch.pending && ch.src === P.uid) {
          ch.oth = ch.oth.filter((q) => !q.s.sigOwn && !(q.s.dst === P.uid));
          P.dur = sched(P);
        }
      } catch (e) { console.error(e); }
      return pl0.apply(this, arguments);
    };
  }

  /* ---------- vị trí ---------- */
  const deckPt = (sd) => { try { return DECKZ(sd); } catch (e) { return null; } };
  const posOf = (P, t) => {
    if (t.z === "board") return rc(mcOf(t.u)) || (P.R0 && P.R0.get(t.u)) || null;
    if (t.z === "hand") { const q = rc(hcOf(t.u)); if (q) return q; const z = (typeof zpt === "function" && zpt(t.sd === "p" ? "hand" : "avFoe")) || null; return z ? { x: z.x, y: z.y, w: 44, h: 60, t: z.y - 30 } : null; }
    if (t.z === "deck") { const z = deckPt(t.sd); return z ? { x: z.x, y: z.y, w: 44, h: 60, t: z.y - 30 } : null; }
    if (t.z === "loc") { const p = K.lanePlate(t.li); return p ? { x: p.x, y: p.y, w: p.w, h: p.h, t: p.y - p.h / 2 } : null; }
    return null;
  };
  /* vùng sân khấu: hộp bao mọi mục tiêu (+ lề), kẹp trong màn hình */
  function areaOf(P) {
    const pts = P.tg.map((t) => posOf(P, t)).filter(Boolean);
    const zs = new Set(P.tg.map((t) => t.z)), lanes = new Set(P.tg.filter((t) => t.z === "board" || t.z === "loc").map((t) => t.li));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const q of pts) { x0 = Math.min(x0, q.x - (q.w || 50) / 2); x1 = Math.max(x1, q.x + (q.w || 50) / 2); y0 = Math.min(y0, q.y - (q.h || 64) / 2); y1 = Math.max(y1, q.y + (q.h || 64) / 2); }
    if (!pts.length) { const b = rc(document.getElementById("board")); if (b) { x0 = b.x - b.w / 2; x1 = b.x + b.w / 2; y0 = b.t; y1 = b.b; } else { x0 = 20; x1 = innerWidth - 20; y0 = innerHeight * 0.2; y1 = innerHeight * 0.7; } }
    const m = 8;
    x0 = clamp(x0 - m, 2, innerWidth - 40); x1 = clamp(x1 + m, x0 + 40, innerWidth - 2); y0 = clamp(y0 - m, 2, innerHeight - 40); y1 = clamp(y1 + m, y0 + 40, innerHeight - 2);
    let scope = "";
    if (zs.has("loc") || lanes.size >= 2) scope = "TOÀN BẢN ĐỒ";
    else if (zs.has("board")) scope = "TẠI CHIẾN ĐỊA NÀY";
    else if (zs.has("hand")) { const sides = new Set(P.tg.filter((t) => t.z === "hand").map((t) => t.sd)); scope = sides.size > 1 ? "CẢ HAI TAY BÀI" : [...sides][0] === P.side ? "TAY BÀI" : "TAY ĐỐI THỦ"; }
    else if (zs.has("deck")) scope = P.tg[0].sd === P.side ? "BỘ BÀI" : "BỘ BÀI ĐỐI THỦ";
    if (zs.size > 1 && zs.has("board") && (zs.has("hand") || zs.has("deck"))) scope = "BÀN + " + (zs.has("hand") ? "TAY" : "BỘ BÀI");
    /* tâm sân khấu: hàng ô chiến địa (không đè lên mặt thẻ) khi có mục tiêu trên bàn; trên tay bài: phía trên tay; bộ bài: cạnh chồng bài */
    let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (zs.has("board") || zs.has("loc")) {
      const ps = [...lanes].map((li) => K.lanePlate(li)).filter(Boolean);
      if (ps.length) { cy = ps.reduce((a, p) => a + p.y, 0) / ps.length; cx = ps.reduce((a, p) => a + p.x, 0) / ps.length; }
      if (lanes.size >= 2 || zs.has("loc")) { const p1 = K.lanePlate(1); if (p1) { cx = p1.x; cy = p1.y; } }
    } else if (zs.has("hand")) cy = Math.max(70, y0 - 70);
    else if (zs.has("deck")) { cy = clamp(y1 + 80, 80, innerHeight * 0.6); cx = clamp(cx, 110, innerWidth - 110); }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx, cy, scope, lanes };
  }

  /* ---------- nhãn loại ---------- */
  const KLAB = { destroy: "TIÊU HUỶ", move: "DỜI CHỖ", transform: "BIẾN HÌNH", silence: "MẤT KỸ NĂNG", copy: "ĐỔI KỸ NĂNG", summon: "XUỐNG SÂN", bounce: "VỀ TAY", add: "VÀO TAY", discard: "VỨT BỎ", loc: "CHIẾN ĐỊA" };
  const KCOL = { buff: "#5dffa8", debuff: "#ff6b86", cost: "#5fe0a8", destroy: "#ff4d5e", move: "#b6ffe8", transform: "#d46bff", silence: "#c7cee8", copy: "#7fe0ff", summon: "#8fdc4a", bounce: "#ffb3e0", add: "#ffe7a0", discard: "#ff9a4d", loc: "#c45cff" };
  const sgn = (d) => (d > 0 ? "+" : "−") + Math.abs(d);

  /* ---------- MÀN DIỄN ---------- */
  const LIVE = new Set();
  function runMass(P, j, total) {
    const A = areaOf(P), c1 = (THEME[P.id] && THEME[P.id][1]) || P.c1, th = THEME[P.id] ? THEME[P.id][0] : "TUYỆT KỸ";
    const n = P.tg.length, lt = lite();
    LIVE.add(P);
    j.onEnd((fast) => {
      LIVE.delete(P); if (CUR === P) CUR = null; if (fast) finalize(P);
      /* thẻ xuống sân trong tuyệt kỹ: chắc chắn hiện khi màn diễn kết thúc */
      for (const t of P.tg) if (t.z === "board" && t.kind === "summon") { const el = mcOf(t.u); if (el && el.style.opacity === "0") el.style.opacity = ""; }
      tap("mass:end", { id: P.id, fast: !!fast });
    });
    tap("mass", { id: P.id, uid: P.uid, n, tg: P.tg.map((t) => t.z + ":" + t.u + ":" + t.kind), scope: A.scope, total });
    /* giữ số cũ trên tay / bộ bài tới nhịp điểm danh */
    for (const t of P.tg) if (t.z === "hand" && (t.kind === "buff" || t.kind === "debuff" || t.kind === "cost")) holdBadge(t);
    /* 1. SÂN KHẤU */
    const aw = A.w, ah = A.h;
    const fr = j.add(el0("msarea", A.x0 + aw / 2, A.y0 + ah / 2, aw, ah, c1, ""));
    tl(fr, [{ t: 0, x: A.x0 + aw / 2, y: A.y0 + ah / 2, s: 1.04, o: 0 }, { t: 260, x: A.x0 + aw / 2, y: A.y0 + ah / 2, s: 1, o: 1, e: "cubic-bezier(.2,.8,.3,1)" }, { t: P.Tf, x: A.x0 + aw / 2, y: A.y0 + ah / 2, s: 1, o: 0.9 }, { t: P.Tf + 300, x: A.x0 + aw / 2, y: A.y0 + ah / 2, s: 0.98, o: 0 }], total);
    const onB = A.lanes.size > 0, pl1 = onB ? K.lanePlate([...A.lanes][0]) : null;
    const ps = onB ? clamp(((pl1 && pl1.h) || 70) * 1.9, 100, 150) : clamp(Math.min(innerWidth * 0.5, Math.max(130, Math.min(aw, 420) * 0.5)), 120, 220);
    const cx = clamp(A.cx, ps / 2 + 4, innerWidth - ps / 2 - 4), cy = clamp(A.cy, ps / 2 + 40, innerHeight - ps / 2 - 40);
    P.hub = { x: cx, y: cy }; P.ps = ps;
    /* chữ: trên bàn -> tên tuyệt kỹ + bộ đếm nằm trong hàng ô chiến địa, cạnh đạo cụ (không đè ô số của thẻ); tay / bộ bài -> trên / dưới đạo cụ */
    const sd = cx < innerWidth / 2 ? 1 : -1, tx = onB ? cx + sd * (ps / 2 + 74) : cx;
    /* ảnh nhân vật hiện mờ khổng lồ sau đạo cụ (hiện ra rồi lui vào nền khi điểm danh) */
    const so = K.soulSrc(P.id, mcOf(P.uid));
    if (so && !lt) {
      const sw = ps * 1.9, sh = ps * 1.9;
      const ap = j.add(el0("msghost", cx, cy - ps * 0.15, sw, sh, c1, `<img src="${so.src}" alt="" draggable="false" style="${so.pose ? "" : `object-fit:${so.fit};object-position:${so.pos}`}">`));
      tl(ap, [{ t: 0, x: cx, y: cy - ps * 0.05, s: 0.7, o: 0 }, { t: 320, x: cx, y: cy - ps * 0.15, s: 1, o: 0.55, e: "cubic-bezier(.2,.8,.3,1)" }, { t: TM.OPEN, x: cx, y: cy - ps * 0.18, s: 1.04, o: 0.28 }, { t: P.Tf, x: cx, y: cy - ps * 0.2, s: 1.06, o: 0.18 }, { t: P.Tf + 280, x: cx, y: cy - ps * 0.2, s: 1.1, o: 0 }], total);
    }
    /* đạo cụ tuyệt kỹ: mở ra như cuộn sớ của Tiểu Trạng Nguyên (hẹp -> đầy), lơ lửng, nảy theo từng nhịp điểm danh */
    pre(P.id);
    const pu = propUrl(P.id);
    const pr = j.add(el0("msprop" + (pu ? "" : " med"), cx, cy, ps, ps, c1, pu ? `<img src="${pu}" alt="" draggable="false" decoding="async">` : (so ? `<img src="${so.src}" alt="" draggable="false">` : "")));
    P.pr = pr;
    const a0 = K.srcPt(P);
    tl(pr, [{ t: 0, x: a0.x, y: a0.y, s: 0.2, o: 0 }, { t: 180, x: a0.x, y: a0.y - 10, s: 0.45, o: 1 }, ...arc({ x: a0.x, y: a0.y - 10 }, { x: cx, y: cy }, 50, 180, 420, { s0: 0.45, s1: 0.9 }), { t: 470, x: cx, y: cy, s: 1, sx: 0.12 }, { t: 640, x: cx, y: cy, s: 1, sx: 1.06, e: "cubic-bezier(.2,.8,.3,1)" }, { t: TM.OPEN, x: cx, y: cy, s: 1, sx: 1 }, { t: P.Tf, x: cx, y: cy - 4, s: 1, sx: 1 }], total);
    j.at(430, () => {
      glow(cx, cy, c1, ps * 1.5, 0.55, 0.65); ring(cx, cy, c1, ps * 1.3, 0.55, 0.9); ring(cx, cy, "#ffffff", ps * 0.9, 0.45, 0.7, 1, 0.08);
      if (!lt) { converge(cx, cy, [c1, P.c2 || "#fff", "#ffffff"], 22, ps * 0.9, 0.3, 1); streaks(cx, cy, [c1, "#ffffff"], 16, 320, 0, 6.283, 0.5, 5); }
      const e = P6.cols(P.id).e;
      if (e && P6.hasHx(e)) { try { playV16("hx_" + e, cx, cy, Math.min(innerWidth * 0.9, Math.max(aw, ah) * 0.9), 620, 0, 0, true); } catch (x) {} }
      /* làn bị tác động: vòng sáng trên ô chiến địa */
      for (const li of A.lanes) { const p = K.lanePlate(li); if (p) ring(p.x, p.y, c1, p.w * 1.05, 0.5, 0.8, 0.55); }
      sfx("whoosh");
      try { SFX.play("boom"); } catch (x) {}
    });
    /* tên tuyệt kỹ + phạm vi (phía trên đạo cụ) và bộ đếm (dưới đạo cụ) */
    const bt = (rc(document.getElementById("board")) || { t: 60 }).t;
    const hy = clamp(cy - ps * 0.62, Math.max(18, bt + 16), innerHeight - 60);
    const hy2 = onB ? cy - 17 : hy;
    const hd = tagEl(j, "mshead", tx, hy2, 220, 30, c1, `<b><em>${esc(th)}</em><i>${esc(A.scope)}</i></b>`);
    tl(hd, [{ t: 0, x: tx, y: hy2 + 8, s: 0.7, o: 0 }, { t: 560, x: tx, y: hy2 + 8, s: 0.7, o: 0 }, { t: 720, x: tx, y: hy2, s: 1, o: 1, e: "cubic-bezier(.2,.8,.3,1)" }, { t: P.Tf, x: tx, y: hy2, s: 1, o: 1 }, { t: P.Tf + 200, x: tx, y: hy2 - 8, s: 0.95, o: 0 }], total);
    const ny = onB ? cy + 19 : clamp(cy + ps * 0.56, 40, innerHeight - 20);
    const cn = tagEl(j, "mscnt", tx, ny, 150, 26, c1, `<b><em>0</em>/${n}<i></i></b>`);
    tl(cn, [{ t: 0, x: tx, y: ny, s: 0.6, o: 0 }, { t: 600, x: tx, y: ny, s: 0.6, o: 0 }, { t: 760, x: tx, y: ny, s: 1, o: 1, e: "cubic-bezier(.2,.8,.3,1)" }, { t: P.Tf, x: tx, y: ny, s: 1, o: 1 }], total);
    const ce = cn.querySelector("em"), ci = cn.querySelector("i");
    let k = 0, up = 0, dn = 0;
    const kinds = new Map();
    const tick = (t) => {
      k++;
      if (t.kind === "buff" || (t.kind !== "debuff" && t.kind !== "cost" && t.d > 0 && t.z !== "deck")) up += Math.abs(t.d || 0);
      else if (t.kind === "debuff") dn += Math.abs(t.d || 0);
      if (t.z === "deck" && t.kind === "buff") up += Math.abs(t.d || 0);
      if (KLAB[t.kind] || t.kind === "cost") kinds.set(t.kind, (kinds.get(t.kind) || 0) + 1);
      if (ce) { ce.textContent = String(k); try { ce.animate([{ transform: "scale(1.6)" }, { transform: "scale(1)" }], { duration: 200, easing: "cubic-bezier(.2,.8,.3,1)" }); } catch (e) {} }
      if (ci) {
        const q = [];
        if (up) q.push("+" + up); if (dn) q.push("−" + dn);
        for (const [kk, v] of kinds) q.push((kk === "cost" ? "năng lượng" : KLAB[kk].toLowerCase()) + " ×" + v);
        ci.textContent = q.length ? " · " + q.slice(0, 3).join(" · ") : "";
      }
      try { pr.animate([{ transform: pr.style.transform || "none", filter: "brightness(1.7)" }, { filter: "brightness(1)" }], { duration: 180, composite: "add" }); } catch (e) {}
    };
    /* 2a. bước gốc (dời chỗ / chiến địa / thẻ S4–S5 xuống sân): đếm đúng lúc chúng diễn */
    const st0 = s0Of(P) + (P.delay || 0);
    for (const t of P.tg) if (t.nat) j.at(Math.max(TM.OPEN - 100, natHit(t.nat) - st0), () => { visitNat(P, t, c1); tick(t); });
    /* 2b. điểm danh từng nhóm */
    for (const g of P.G) g.list.forEach((t, i) => j.at(g.t + Math.min(i, 8) * TM.STAG * (g.list.length > 1 ? 1 : 0), () => { visit(P, t, c1, i); tick(t); }));
    /* 3. KẾT: đạo cụ + bộ đếm thu về thẻ nguồn */
    j.at(P.Tf, () => {
      const me = rc(mcOf(P.uid)) || rc(hcOf(P.uid)) || a0;
      const pp = { x: cx, y: cy };
      tl(pr, [{ t: 0, x: cx, y: cy, s: 1 }, { t: 120, x: cx, y: cy - 6, s: 1.12 }, ...arc({ x: cx, y: cy - 6 }, me, 60, 120, 460, { s0: 1.12, s1: 0.2 }), { t: 520, x: me.x, y: me.y, s: 0.1, o: 0, e: "ease-in" }], 520);
      tl(cn, [{ t: 0, x: tx, y: ny, s: 1, o: 1 }, ...arc({ x: tx, y: ny }, me, 40, 60, 440, { s0: 1, s1: 0.4 }), { t: 500, x: me.x, y: me.y, s: 0.3, o: 0 }], 500);
      trail(pp, me, 60, 120, 460, [c1, "#ffffff", "#ffe7a0"], lt ? 6 : 14);
      if (!lt) streaks(cx, cy, [c1, "#ffffff"], 12, 260, 0, 6.283, 0.4, 5);
      sfx("whoosh");
    });
    j.at(P.Tf + 470, () => {
      const me = rc(mcOf(P.uid)) || rc(hcOf(P.uid)) || a0;
      ring(me.x, me.y, c1, (me.w || 60) * 1.4, 0.5, 0.95); glow(me.x, me.y, c1, (me.w || 60) * 2, 0.45, 0.7);
      if (!lt) { streaks(me.x, me.y, [c1, "#ffffff", "#ffe7a0"], 16, 280, 0, 6.283, 0.45, 5); converge(me.x, me.y, [c1, "#ffffff"], 14, (me.w || 60) * 1.1, 0.25, 1); }
      if (P.selfStep) P.hit(P.selfStep);
      try { if (mcOf(P.uid)) mcOf(P.uid).animate([{ transform: "none" }, { transform: "scale(1.12)", offset: 0.35 }, { transform: "none" }], { duration: 420, composite: "add" }); } catch (e) {}
      tap("mass:fin", { id: P.id, n: k });
    });
  }

  /* nhãn gọn (bề ngang theo chữ) */
  function tagEl(j, cls, x, y, w0, h, c, html) {
    const d = j.add(el0(cls, x, y, w0, h, c, html)), b = d.firstElementChild, w = Math.min(innerWidth - 8, Math.max(40, b ? b.offsetWidth + 6 : w0));
    d.style.width = w.toFixed(1) + "px"; d.style.left = (x - w / 2).toFixed(1) + "px"; d._hw = w / 2 + 2;
    return d;
  }
  /* số cũ trên lá trên tay: giữ tới nhịp điểm danh (P6.stat đặt số cuối) */
  function holdBadge(t) {
    const el = hcOf(t.u);
    if (!el) return;
    if (t.kind === "cost") { const b = el.querySelector(".cst"); if (b && t.c0 != null) { b.textContent = String(t.c0); t.held = 1; } }
    else { const b = el.querySelector(".pwh"); if (b && t.v0 != null) { b.textContent = String(t.v0); t.held = 1; } }
  }
  /* tua / kết thúc sớm: số cuối đúng engine */
  function finalize(P) {
    for (const t of P.tg) {
      if (t.done) continue;
      t.done = 1;
      if (t.z === "hand") { const el = hcOf(t.u), c = G.hand[t.sd].find((x) => x.uid === t.u); if (el && c) { const b = el.querySelector(".pwh"), q = el.querySelector(".cst"); if (b) b.textContent = String(hp(c)); if (q) q.textContent = String(cst(c)); } }
    }
  }
  /* điểm danh MỘT mục tiêu, tại chỗ */
  function visit(P, t, c1, i) {
    if (t.done) return;
    t.done = 1;
    const q = posOf(P, t), hub = P.hub, col = KCOL[t.kind] || c1, src = hub ? { x: hub.x, y: hub.y } : null;
    tap("mass:visit", { id: P.id, u: t.u, z: t.z, kind: t.kind });
    const lt = lite();
    if (q && t.z !== "deck") {
      ring(q.x, q.y, col, (q.w || 50) * 1.2, 0.42, 0.95);
      glow(q.x, q.y, c1, (q.w || 50) * 1.6, 0.4, 0.55);
      if (!lt) star(q.x, q.y, "#ffffff", (q.w || 50) * 0.9, 0.2);
    }
    const steps = t.steps || [];
    if (t.z === "board" && (t.kind === "buff" || t.kind === "debuff")) {
      for (const s of steps) { s._sigHit = 1; s._hit = 1; s._ran = 1; }
      const el = mcOf(t.u);
      if (el) {
        try { el.animate([{ transform: "none" }, { transform: `translateY(${t.d > 0 ? -5 : 3}px) scale(1.06)`, offset: 0.4 }, { transform: "none" }], { duration: 320, composite: "add" }); } catch (e) {}
        P6.stat({ el, k: "pow", v0: t.v0, v1: t.v1, src, c: c1, uid: t.u, lab: t.v0 > 0 && t.v1 === t.v0 * 2 ? "×2" : null });
      }
      try { SFX.fam(t.d > 0 ? (t.d >= 3 ? "up2" : "up1") : (-t.d >= 3 ? "dn2" : "dn1"), { el: null }); } catch (e) {}
      return;
    }
    if (t.z === "hand" && (t.kind === "buff" || t.kind === "debuff" || t.kind === "cost")) {
      const el = hcOf(t.u);
      for (const s of steps) { s._sigSrc = src; s._sigHit = 1; s._hit = 1; s._ran = 1; try { unmask29(s); } catch (e) {} }
      if (el) {
        if (t.kind === "cost") P6.stat({ el, k: "cost", v0: t.c0, v1: t.c1, src, c: "#5fe0a8", uid: t.u });
        if (t.kind !== "cost" || t.dp) P6.stat({ el, k: "pow", v0: t.v0, v1: t.v1, src, c: c1, uid: t.u, dl: t.kind === "cost" ? 120 : 0 });
        try { el.animate([{ transform: "none" }, { transform: "translateY(-10px) scale(1.08)", offset: 0.4 }, { transform: "none" }], { duration: 360, composite: "add" }); } catch (e) {}
      } else if (q) { beam(src.x, src.y, q.x, q.y, col, 4, 0.22); K.fl(q.x, q.y - 26, t.kind === "cost" ? sgn(t.d) + " năng lượng" : sgn(t.d), col); }
      try { SFX.fam(t.kind === "cost" ? (t.d < 0 ? "costdn" : "costup") : t.d > 0 ? "up1" : "dn1", { el: null }); } catch (e) {}
      return;
    }
    if (t.z === "deck") { deckTick(P, t, c1, i); return; }
    /* loại khác: sợi sáng tới lá + dấu riêng; bước có sẵn (tiêu huỷ, về tay, xuống sân, mất kỹ năng, chép…) chạy đúng nhịp này */
    if (q && src) beam(src.x, src.y, q.x, q.y, col, lt ? 4 : 6, 0.24);
    if (steps.length) for (const s of steps) P.hit(s);
    else if (q) {
      if (t.kind === "transform") { try { playV16("bien_hinh", q.x, q.y, Math.max(100, (q.w || 50) * 1.9), 520, 0); } catch (e) {} try { SFX.fam("morph", { el: null }); } catch (e) {} }
      else if (t.kind === "silence") { try { FX.shards(q.x, q.y, "#9aa3c7"); SFX.fam("silence", { el: null }); } catch (e) {} }
      else if (t.kind === "copy") { try { playV16("sao_chep", q.x, q.y, Math.max(100, (q.w || 50) * 1.9), 520, 0); SFX.fam("copy", { el: null }); } catch (e) {} }
      else if (t.kind === "add") { if (t.sd === "p" && hcOf(t.u)) K.revealH(t.u, c1); else ring(q.x, q.y, c1, 60, 0.4, 0.9); try { playV16("tao_the", q.x, q.y, 104, 480, 0); } catch (e) {} }
      else if (t.kind === "destroy" && P.R0 && P.R0.get(t.u) && !t.gone2) { try { CFX.destroy(P.R0.get(t.u)); } catch (e) {} }
      else if (t.kind === "summon") { const el = mcOf(t.u); if (el) try { CFX.summon(el, c1); } catch (e) {} }
    }
    if (t.kind === "add" && t.sd === "p") K.showH(t.u);
    if (t.kind === "bounce" && t.sd === "p") fxT(() => { if (!P.dead) K.showH(t.u); }, 420);
    if (q && KLAB[t.kind]) lab(q, KLAB[t.kind], col, t, i);
    /* số sức mạnh đổi kèm (dời / biến hình…) */
    if (t.z === "board" && t.d && mcOf(t.u) && t.v0 != null && t.v1 != null) P6.stat({ el: mcOf(t.u), k: "pow", v0: t.v0, v1: t.v1, src, c: c1, uid: t.u, dl: 140 });
  }
  function visitNat(P, t, c1) {
    t.done = 1;
    tap("mass:visit", { id: P.id, u: t.u, z: t.z, kind: t.kind, nat: 1 });
    const q = posOf(P, t);
    if (!q) return;
    ring(q.x, q.y, KCOL[t.kind] || c1, (q.w || 50) * 1.25, 0.45, 0.9);
    if (P.hub) beam(P.hub.x, P.hub.y, q.x, q.y, c1, 5, 0.24);
    if (KLAB[t.kind] && t.kind !== "loc") lab(q, KLAB[t.kind], KCOL[t.kind] || c1, t);
  }
  /* nhãn nhỏ cạnh lá (phía xa đạo cụ, không đè chữ trên lá) */
  function lab(q, txt, col, t, i) {
    const d = document.createElement("div");
    d.className = "stchip mslab";
    d.style.setProperty("--c", col);
    d.textContent = txt;
    document.body.appendChild(d);
    const w = d.offsetWidth, h = d.offsetHeight;
    const x = clamp(q.x - w / 2, 4, innerWidth - w - 4), y = clamp((q.t != null ? q.t : q.y - (q.h || 64) / 2) - h - 2 + ((i || 0) % 2) * (h + 4), 4, innerHeight - h - 4);
    d.style.left = x.toFixed(1) + "px"; d.style.top = y.toFixed(1) + "px";
    const a = d.animate([{ opacity: 0, transform: "translateY(6px) scale(.7)" }, { opacity: 1, transform: "translateY(-2px) scale(1.06)", offset: 0.18 }, { opacity: 1, transform: "translateY(-6px) scale(1)", offset: 0.78 }, { opacity: 0, transform: "translateY(-12px) scale(.95)" }], { duration: 1000 * SPD, easing: "ease-out", fill: "forwards" });
    a.onfinish = () => d.remove();
    setTimeout(() => d.remove(), 1400 * SPD);
  }
  /* bộ bài: chồng mặt lưng (không lộ mặt thẻ) cạnh chỗ bộ bài, nhãn đếm "−1 × k lá" */
  const PILES = new Map();
  function deckTick(P, t, c1, i) {
    let pl = PILES.get(P.uid + t.sd);
    const dz = deckPt(t.sd) || { x: innerWidth - 40, y: 60 };
    const W0 = Math.round(clamp(innerWidth * 0.17, 62, 84)), H0 = Math.round(W0 * 1.36);
    /* chồng bài đứng cạnh đạo cụ (phía còn chỗ), không đè tên tuyệt kỹ */
    const hb = P.hub, side = hb && hb.x < innerWidth / 2 ? 1 : -1;
    const px = clamp(hb ? hb.x + side * ((P.ps || 120) / 2 + W0 / 2 + 14) : dz.x, W0 / 2 + 8, innerWidth - W0 / 2 - 8), py = clamp(hb ? hb.y + 10 : dz.y + H0, H0 / 2 + 30, innerHeight - H0 / 2 - 8);
    if (!pl) {
      const html = W.ACT44 && ACT44.pileHTML ? ACT44.pileHTML(t.sd, 4) : "";
      pl = { el: P.j.add(el0("acpile mspile", px, py, W0, H0, c1, html)), n: 0, sum: 0, d: t.d, same: 1 };
      PILES.set(P.uid + t.sd, pl);
      P.j.onEnd(() => PILES.delete(P.uid + t.sd));
      const left = Math.max(300, P.Tf - (performance.now() - P.j.t0) / SPD + 300);
      tl(pl.el, [{ t: 0, x: dz.x, y: dz.y, s: 0.4, o: 0 }, { t: 220, x: px, y: py, s: 1.06, o: 1, e: "cubic-bezier(.2,.8,.3,1)" }, { t: 300, x: px, y: py, s: 1 }, { t: left, x: px, y: py, s: 1 }, { t: left + 260, x: dz.x, y: dz.y, s: 0.4, o: 0, e: "ease-in" }], left + 260);
      ring(px, py, c1, W0 * 1.2, 0.45, 0.9); glow(px, py, c1, W0 * 1.8, 0.5, 0.55);
    }
    pl.n++; pl.sum += t.d || 0; if (t.d !== pl.d) pl.same = 0;
    const b = pl.el.querySelector(".dkp>b");
    if (b) {
      b.textContent = t.kind === "cost" ? "NĂNG LƯỢNG đổi × " + pl.n + " LÁ" : P.id === "hacdichbinh" ? "SỨC MẠNH → 3 × " + pl.n + " LÁ" : (pl.same ? sgn(pl.d) + " × " + pl.n + " LÁ" : sgn(pl.sum) + " · " + pl.n + " LÁ");
      b.style.color = (t.d || 0) >= 0 ? "#9dffc8" : "#ff9aa8";
      try { b.animate([{ transform: "translate(-50%,0) scale(1.3)" }, { transform: "translate(-50%,0) scale(1)" }], { duration: 160 }); } catch (e) {}
    }
    if (P.hub && (i || 0) < 3) beam(P.hub.x, P.hub.y, px, py, c1, 4, 0.2);
  }

  /* ---------- tuyệt kỹ của chuỗi PA6 thường (thẻ S5 không trong danh sách diện rộng): hồn thi triển tại chỗ ---------- */
  MS.cfg = { noFly: true };
  P6.noFly = (ch) => !!(MS.cfg.noFly && ch && ch.s5);
  P6.ultFx = function (ch, st, dur) {
    if (lite() && st.list.length > 2) return;
    let cx = 0, cy = 0, w = 0;
    for (const q of st.list) { cx += q.tp.x / st.list.length; cy += q.tp.y / st.list.length; w = Math.max(w, q.tp.w || 50); }
    const id = ch.id, c1 = (THEME[id] && THEME[id][1]) || ch.col.c1;
    pre(id);
    const im = propUrl(id), sz = clamp(w * 2.1, 96, innerWidth * 0.42);
    const html = im ? `<img src="${im}" alt="" draggable="false" decoding="async">` : `<img src="${ch.url}" alt="" draggable="false">`;
    const d = el0("msprop ult" + (im ? "" : " med"), cx, cy - (st.list.length > 1 ? 0 : w * 0.2), sz, sz, c1, html);
    const D = Math.max(200, dur) + P6.T.JAB + 260, y = cy - (st.list.length > 1 ? 0 : w * 0.2);
    tl(d, [{ t: 0, x: cx, y, s: 0.5, o: 0 }, { t: Math.max(120, dur * 0.7), x: cx, y, s: 1, o: 0.95, e: "cubic-bezier(.2,.8,.3,1)" }, { t: dur + P6.T.JAB, x: cx, y, s: 1.08, o: 0.9 }, { t: D, x: cx, y: y - 6, s: 1.2, o: 0 }], D);
    fxT(() => d.remove(), D + 80);
    glow(cx, cy, c1, sz * 1.1, Math.max(0.25, dur / 1000), 0.5);
    ring(cx, cy, c1, sz * 0.9, Math.max(0.3, dur / 1000), 0.8, 0.6);
    beam(ch.x, ch.y, cx, cy, c1, 6, Math.max(0.2, dur / 1000));
  };

  /* ---------- bỏ qua (nút > 60 s của làn khác gọi): hiện ngay trạng thái cuối ---------- */
  MS.skip = function () {
    for (const P of [...LIVE]) { try { P.j.fin(true); } catch (e) { console.error(e); } }
    try { P6.statEnd(); } catch (e) {}
  };
  MS.busy = () => LIVE.size;
  MS.clean = () => { MS.skip(); document.querySelectorAll(".msarea,.msghost,.msprop,.mshead,.mscnt,.mspile,.mslab").forEach((e) => e.remove()); };
})();
