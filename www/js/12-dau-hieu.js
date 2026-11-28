/* Module 12: Dấu hiệu trên bàn đấu
   (7) Thẻ Lật / Kích Hoạt đặt hiệu ứng chờ cho lượt sau hoặc "thẻ kế tiếp" -> chip vàng ở đúng chiến địa/phía.
   (8) Thẻ Duy Trì có tác dụng lên cả chiến địa / cả bàn -> hào quang nền + chip theo phe + dải toàn bàn.
   Chỉ ĐỌC trạng thái engine (G), không đổi luật. Vẽ lại khi render()/patchBoard (MutationObserver), không có vòng lặp mỗi khung hình. */
(function () {
"use strict";
if (typeof document === "undefined" || typeof E === "undefined") return;

const SVGNS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + [
  ["hg", '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>'],
  ["up", '<path d="M12 20V5M5 11l7-7 7 7"/>'],
  ["dn", '<path d="M12 4v15M5 13l7 7 7-7"/>'],
  ["sh", '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>'],
  ["mu", '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/><path d="M3 3l18 18"/>'],
  ["bo", '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>'],
  ["mv", '<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/>'],
  ["ml", '<path d="M20 12H5M11 6l-6 6 6 6"/>'],
  ["mr", '<path d="M4 12h15M13 6l6 6-6 6"/>'],
  ["lk", '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>'],
  ["ey", '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>'],
  ["x2", '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'],
  ["no", '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>'],
  ["cp", '<rect x="3" y="3" width="12" height="16" rx="2"/><path d="M19 11v9M14.5 15.5h9"/>'],
  ["wv", '<path d="M2 9c3-3 5 3 8 0s5 3 8 0 3 0 4 0M2 16c3-3 5 3 8 0s5 3 8 0 3 0 4 0"/>'],
  ["st", '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'],
  ["dv", '<path d="M5 12h14"/><circle cx="12" cy="5.5" r="1.4"/><circle cx="12" cy="18.5" r="1.4"/>'],
  ["bk", '<path d="M3 12h12M10 6l6 6-6 6M21 4v16"/>'],
  ["sw", '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'],
  ["mg", '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>'],
  ["sk", '<circle cx="12" cy="10" r="7"/><path d="M9 21v-4M15 21v-4M9 10h.01M15 10h.01"/>'],
].map(([k, p]) => '<symbol id="dhi-' + k + '" viewBox="0 0 24 24">' + p + "</symbol>").join("") + "</defs></svg>";
const ic = k => '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#dhi-' + k + '"/></svg>';
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

const C = E.C, other = E.other;
const nm = c => (C[c.id] && C[c.id].n) || c.id;
const own = s => s === "p" ? "dme" : s === "a" ? "dop" : "dne";
const tintCode = s => s === "p" ? "b" : s === "a" ? "r" : "n";

/* ---------- Danh mục Duy Trì: [id, phạm vi, hàng, icon, chữ ngắn, tiêu đề, điều kiện?] ----------
   phạm vi: li = chiến địa của thẻ, adj = liền kề, r = bên phải, oth = các chiến địa khác, all = cả bàn
   hàng: S = phía chủ thẻ, O = phía đối thủ, B = cả hai phía (chip ở phía chủ), G = không thuộc hàng nào (chỉ dải toàn bàn)  */
const AU = [
  ["giaphon", "li", "B", "sh", "Bền", "Thẻ ở đây không thể bị tiêu huỷ"],
  ["lamkynhan", "all", "S", "up", "+1", "Mọi thẻ khác của bạn +1", null, "Thẻ bạn +1"],
  ["thuantuong", "li", "S", "up", "+2", "Thẻ Duy Trì khác của bạn ở đây +2"],
  ["khuyenduhanh", "li", "B", "mu", "Im", "Kỹ năng Lật không chạy ở đây"],
  ["thietgiap", "li", "S", "x2", "×2", "Tổng sức mạnh của bạn ở đây nhân đôi"],
  ["chuarung", "all", "S", "up", "+1", "Thẻ 1 năng lượng của bạn +1", null, "Thẻ 1NL +1"],
  ["amtrao", "r", "S", "up", "+6", "Chiến địa bên phải +6 cho bạn"],
  ["deonhan", "adj", "S", "up", "+3", "Chiến địa liền kề +3 cho bạn"],
  ["tamtuquai", "li", "S", "x2", "×2", "Duy Trì khác của bạn ở đây áp dụng thêm 1 lần"],
  ["giaosutam", "li", "B", "lk", "Dời", "Chỉ dời mới thêm hoặc loại thẻ ở đây"],
  ["mieunuot", "li", "B", "no", "≥4", "Không ai đặt thẻ từ 4 năng lượng ở đây"],
  ["xichxuctu", "oth", "S", "up", "+3", "Đang thắng: chiến địa khác +3", (G, c, li, s) => E.lead(G, li) === s],
  ["quanthoigian", "all", "G", "bo", "Khoá", "Năng lượng bạn không tăng; của địch không giảm", null, "NL khoá"],
  ["phiconamcanh", "all", "G", "bo", "−1", "Thẻ tạo ra của bạn giảm 1 năng lượng", null, "Tạo ra −1"],
  ["thienlenhnu", "all", "G", "bo", "−1", "Thẻ trên tay bạn giảm 1 năng lượng", null, "Tay −1"],
  ["giacnguu", "all", "G", "bo", "+1", "Thẻ tạo ra của đối thủ tăng 1 năng lượng", null, "Địch +1"],
  ["sodo", "li", "O", "up", "+2", "Thẻ đối thủ ở đây +2"],
  ["dichnu", "li", "S", "dn", "−2", "Thẻ khác của bạn ở đây −2"],
  ["damquai", "li", "B", "dn", "−2", "Thẻ ≤3 năng lượng ở đây −2"],
  ["dacvuquocgia", "li", "B", "dn", "−3", "Thẻ từ 4 năng lượng ở đây −3"],
  ["kimcuongxa", "li", "O", "dn", "−2", "Thẻ địch đang bị trừ ở đây chịu thêm −2"],
  ["thuthu", "li", "S", "x2", "×2", "Kỹ năng Lật của bạn ở đây lặp lại"],
  ["phiungtre", "li", "S", "x2", "×2", "Lật của thẻ 1 năng lượng ở đây lặp lại"],
  ["ansao", "oth", "O", "up", "+3", "Đối thủ +3 ở mỗi chiến địa khác"],
  ["buisao", "all", "G", "lk", "Chặn", "Chỉ đặt hoặc dời mới thêm được thẻ vào chiến địa", null, "Chỉ đặt/dời"],
  ["comaychien", "all", "G", "st", "Tự do", "Bạn đặt thẻ ở bất kỳ đâu", null, "Đặt tự do"],
  ["phuongtamnu", "li", "B", "mr", "Đầu", "Thẻ đầu tiên mỗi lượt phải đặt ở đây"],
  ["annu", "li", "S", "ey", "Úp", "Thẻ bạn đặt ở đây úp đến hết ván"],
  ["toaansong", "all", "S", "dv", "÷3", "Chia đều sức mạnh của bạn cho 3 chiến địa", null, "Chia đều"],
  ["thachlucnu", "all", "S", "sh", "Bền", "Thẻ 1 và 6 năng lượng của bạn không bị tiêu huỷ", null, "Bền 1&6NL"],
  ["dathep", "li", "S", "sh", "Giữ", "Thẻ hàng trước của bạn ở đây không bị giảm"],
  ["maydotam", "all", "S", "up", "+3", "Thẻ mạnh nhất của bạn +3", null, "Mạnh nhất +3"],
  ["aiquoc", "all", "S", "up", "+2", "Thẻ không kỹ năng của bạn +2", null, "Thẻ trơn +2"],
  ["cosi", "li", "S", "up", "+2", "Thẻ đã được tăng của bạn ở đây +2"],
  ["kysiho", "all", "S", "up", "+1", "Thẻ đã được tăng của bạn +1", null, "Đã tăng +1"],
  ["nuthuantuong", "li", "S", "up", (G, c, li) => "+" + Math.max(0, E.power(G, c, li)), "Cộng sức mạnh cho thẻ hàng sau của bạn ở đây"],
  ["daitaxacsong", "li", "S", "up", (G, c, li, s) => "+" + (G.cnt && G.cnt.discTurns ? G.cnt.discTurns[s] : 0), "Thẻ khác của bạn ở đây +1 mỗi lượt đã vứt bỏ", (G, c, li, s) => G.cnt && G.cnt.discTurns && G.cnt.discTurns[s] > 0],
  ["bato", "li", "S", "mv", "Dời", "Mỗi lượt 1 thẻ khác của bạn ở đây được dời"],
  ["datientri", "all", "S", "up", "+3", "Đá của bạn +3", null, "Đá +3"],
  ["taysatnu", "all", "G", "up", "+2", "Thẻ tạo ra trên tay bạn +2", null, "Tay +2"],
  ["nuphanquan", "all", "G", "bo", "−1", "Thẻ ≤1 sức mạnh của bạn giảm 1 năng lượng", null, "Rẻ −1"],
  ["bocapngaymoi", "all", "O", "x2", "×2", "Nhân đôi phần giảm sức mạnh của thẻ địch", null, "Trừ địch ×2"],
  ["kynu", "adj", "S", "up", "+6", "Thẻ ở đây đủ 2+ và khác năng lượng: +6", (G, c, li, s, l) => { const a = G.locs[l].cards[s].filter(k => k.rev); if (a.length < 2) return false; const cs = a.map(k => C[k.id].c + (k.cm || 0)); return new Set(cs).size === cs.length; }],
];
const AUIDX = AU.map(a => a[0]);

/* ---------- gom dấu hiệu từ trạng thái ---------- */
function compute() {
  /* gpu29: trong lúc diễn một bước, bàn đang vẽ "khung trước bước" GV (05) -> dấu hiệu cũng đọc khung đó, không lộ kết quả trước đòn */
  const G0 = typeof GV !== "undefined" && GV ? GV : typeof G !== "undefined" ? G : null;
  if (!G0 || !G0.locs || G0.phase === "over") return [];
  const T = G0.turn, out = [], agg = new Map();
  const when = t => (t > T ? "Lượt sau" : "Lượt này");
  const push = m => {
    m.k = (m.pd ? "p" : "a") + ":" + (m.id || "") + ":" + (m.src || "") + ":" + m.lane + ":" + m.row + ":" + m.own;
    const a = m.agg && agg.get(m.k);
    if (a) { a.n++; return; }
    if (m.src && !m.srcName) { const f = E.find(G0, m.src); if (f) { m.srcName = nm(f.inst); if (m.pd && ["thantien", "giapcuuho", "thamtunu", "w2", "ip"].includes(m.id)) m.t = (C[f.inst.ab || f.inst.id] || C[f.inst.id]).x || m.t; } }
    m.n = 1; out.push(m); if (m.agg) agg.set(m.k, m);
  };
  const srcBy = (side, ids) => { for (let l = 0; l < 3; l++) for (const c of G0.locs[l].cards[side]) if (c.rev && !c.sil && ids.some(i => E.is(G0, c, i))) return c; return null; };
  const live = L => !L.gone;

  for (let li = 0; li < 3; li++) {
    const L = G0.locs[li]; if (!live(L)) continue;
    for (const s of ["p", "a"]) {
      const o = other(s);
      for (const c of L.cards[s]) {
        if (!c.rev || c.sil) continue;
        const who = nm(c);
        /* --- chờ lượt sau gắn với thẻ --- */
        if (c.wait > 0 && c.wait >= T) {
          const w = when(c.wait);
          if (E.is(G0, c, "thantien")) push({ pd: 1, id: "thantien", src: c.uid, lane: li, row: s, own: s, i: "cp", v: "+4", h: w + " đặt thẻ ở đây: +4", t: who + " +4 sức mạnh nếu bạn đặt 1 thẻ ở chiến địa này.", when: w });
          else if (E.is(G0, c, "giapcuuho")) push({ pd: 1, id: "giapcuuho", src: c.uid, lane: li, row: s, own: s, i: "cp", v: "+5", h: w + " đặt thẻ ở đây: +5", t: who + " +5 sức mạnh nếu bạn đặt 1 thẻ ở chiến địa này.", when: w });
          else if (E.is(G0, c, "thamtunu")) push({ pd: 1, id: "thamtunu", src: c.uid, lane: li, row: s, own: s, i: "no", v: "+5", h: w + " KHÔNG đặt thẻ ở đây: +5", t: who + " +5 sức mạnh nếu bạn không đặt thẻ nào ở chiến địa này.", when: w });
        }
        if (c.w2 && c.w2.t >= T) { const w = when(c.w2.t); push({ pd: 1, id: "w2", src: c.uid, lane: li, row: s, own: s, i: "cp", v: "+" + c.w2.a, h: w + " đặt thẻ ở đây: +" + c.w2.a, t: who + " +" + c.w2.a + " sức mạnh nếu bạn đặt thẻ tại đây.", when: w }); }
        if (c.ip && c.ip.t >= T) { const w = when(c.ip.t); push({ pd: 1, id: "ip", src: c.uid, lane: li, row: s, own: s, i: "dn", v: "−3", h: "Sau " + w.toLowerCase() + ", dẫn ở đây: −3 năng lượng", t: who + ": nếu bạn đang thắng tại đây sau lượt tiếp theo, thẻ vừa thêm vào tay giảm 3 năng lượng.", when: w }); }
        /* --- Duy Trì --- */
        for (let ai = 0; ai < AU.length; ai++) {
          const d = AU[ai]; if (!E.is(G0, c, d[0])) continue;
          const sc = d[1], rw = d[2], cond = d[6];
          const lanes = sc === "li" ? [li] : sc === "adj" ? [li - 1, li + 1] : sc === "r" ? [li + 1] : sc === "oth" ? [0, 1, 2].filter(l => l !== li) : [0, 1, 2];
          const base = { id: d[0], src: c.uid, own: s, i: d[3], agg: 1, t: C[c.id].x || "", when: "Duy Trì · đang có hiệu lực", srcName: who };
          if (sc === "all") {
            if (cond && !cond(G0, c, li, s)) continue;
            const v = typeof d[4] === "function" ? d[4](G0, c, li, s) : d[4];
            const rowSide = rw === "S" ? s : rw === "O" ? o : null;
            push(Object.assign({}, base, { lane: -1, row: rowSide || "g", v, g: d[7] || (v + " " + d[5].split(" ").slice(0, 2).join(" ")), h: d[5], tint: rw === "G" ? null : (rowSide || s), glob: 1 }));
            continue;
          }
          for (const l of lanes) {
            if (l < 0 || l > 2 || !live(G0.locs[l])) continue;
            if (cond && !cond(G0, c, li, s, l)) continue;
            const v = typeof d[4] === "function" ? d[4](G0, c, li, s, l) : d[4];
            const rowSide = rw === "S" || rw === "B" ? s : o;
            push(Object.assign({}, base, { lane: l, row: rowSide, v, h: d[5], tint: rw === "B" ? "both" : rowSide }));
          }
        }
      }
    }
    /* --- chờ lượt sau gắn với chiến địa --- */
    if (L.cloak >= T) push({ pd: 1, id: "cloak", lane: li, row: "p", own: "n", i: "mv", v: "Dời", h: (L.cloak > T ? "Lượt sau" : "Lượt này") + ": mọi thẻ dời được tới đây", t: "Thầy Ẩn Thân: " + (L.cloak > T ? "lượt sau" : "lượt này") + " tất cả thẻ đều có thể dời tới chiến địa này.", when: L.cloak > T ? "Lượt sau" : "Lượt này", srcName: C.aochoangtoi.n, srcSide: null });
    if (L.flood >= T) push({ pd: 1, id: "flood", lane: li, row: "p", own: "n", i: "wv", v: "Ngập", h: (L.flood > T ? "Lượt sau" : "Lượt này") + " là lượt cuối đặt thẻ ở đây", t: "Pháp Vũ: chiến địa bị ngập, hết " + (L.flood > T ? "lượt sau" : "lượt này") + " không đặt thêm thẻ từ tay vào đây.", when: L.flood > T ? "Lượt sau" : "Lượt này", srcName: C.baonu.n });
    for (const s of ["p", "a"]) {
      if (L.hell && L.hell[s] >= T) push({ pd: 1, id: "hell", lane: li, row: s, own: s, i: "mv", v: "Dời", h: (L.hell[s] > T ? "Lượt sau" : "Lượt này") + ": thẻ dời được tới đây", t: "Niệm Lực Sư: " + (L.hell[s] > T ? "lượt sau" : "lượt này") + " các thẻ của " + (s === "p" ? "bạn" : "đối thủ") + " có thể dời tới chiến địa này.", when: L.hell[s] > T ? "Lượt sau" : "Lượt này", srcName: C.niemluctu.n });
      if (L.grant && L.grant[s] >= T) push({ pd: 1, id: "grant", lane: li, row: s, own: s, i: "mv", v: "Dời", h: "Dời 1 thẻ từ đây, +1 sức mạnh", t: "Sợi Tơ Trời: một thẻ của " + (s === "p" ? "bạn" : "đối thủ") + " tại đây có thể dời và nhận +1 sức mạnh khi dời.", when: L.grant[s] > T ? "Lượt sau" : "Lượt này", srcName: C.cuduto.n });
    }
  }
  /* --- thẻ kế tiếp / điều kiện theo phe (cờ trong G) --- */
  for (const s of ["p", "a"]) {
    const g = (id, o) => push(Object.assign({ pd: 1, id, own: s, row: "g", lane: -1, glob: 1, when: "Thẻ kế tiếp" }, o));
    const nx = (ids, fb) => { const c = srcBy(s, ids); return c ? nm(c) : fb; };
    if (G0.forge && G0.forge[s] > 0) g("forge", { i: "cp", v: "+" + G0.forge[s], g: "Thẻ kế +" + G0.forge[s], h: "Thẻ kế tiếp bạn đặt +" + G0.forge[s], t: nx(["thoren", "laogay", "linhdondoc"], "Thẻ") + ": thẻ tiếp theo " + (s === "p" ? "bạn" : "đối thủ") + " đặt nhận +" + G0.forge[s] + " sức mạnh.", srcName: nx(["thoren", "laogay", "linhdondoc"], "") });
    if (G0.fist && G0.fist[s]) g("fist", { i: "ml", v: "←", g: "Kế → trái", h: "Thẻ kế tiếp dời sang trái", t: "Võ Sư Bình Định: sau khi đặt thẻ tiếp theo, dời nó sang trái một chiến địa.", srcName: nx(["thietquyen"], "") });
    if (G0.zero && G0.zero[s]) g("zero", { i: "mu", v: "Mất", g: "Kế mất KN", h: "Thẻ kế tiếp mất kỹ năng", t: "Vô Diện: xoá kỹ năng của thẻ tiếp theo " + (s === "p" ? "bạn" : "đối thủ") + " đặt.", srcName: nx(["sokhong"], "") });
    if (G0.nico && G0.nico[s]) { const f = E.find(G0, G0.nico[s]); g("nico", { i: "mg", v: "Phép", g: "Kế có phép", h: "Thẻ kế tiếp được niệm phép", t: "Tiểu Phù Sư: sau khi đặt thẻ tiếp theo, niệm một phép lên thẻ đó.", srcName: f ? nm(f.inst) : "" }); }
    if (G0.omega && G0.omega[s]) { const f = E.find(G0, G0.omega[s]); g("omega", { i: "sk", v: "Nuốt", g: "Kế bị nuốt", h: "Thẻ kế tiếp bị tiêu huỷ lấy sức mạnh", t: "Linh Môi Sư: tiêu huỷ thẻ tiếp theo bạn đặt trong lượt này để nhận sức mạnh của nó.", srcName: f ? nm(f.inst) : "" }); }
    /* m44: Gã Hái Sao (trên tay mình / trên bàn) chưa có Sứ Giả -> nhân vật kế tiếp đặt sẽ thành Sứ Giả */
    { const pool = (s === "p" ? G0.hand.p : []).concat([0, 1, 2].flatMap(l => G0.locs[l].cards[s].filter(k => k.rev)));
      const hw = pool.find(k => !k.sil && !k.her && E.is(G0, k, "kenuotsaosokhai"));
      if (hw) g("herWait", { i: "st", v: "Sứ Giả", g: "Kế = Sứ Giả", h: "Nhân vật kế tiếp bạn đặt thành Sứ Giả", t: nm(hw) + ": nhân vật tiếp theo " + (s === "p" ? "bạn" : "đối thủ") + " đặt sẽ thành Sứ Giả; Cuối Lượt +2 sức mạnh nếu đang thắng ở chiến địa của Sứ Giả.", srcName: nm(hw) }); }
    if (G0.arana && G0.arana[s]) g("arana", { i: "mr", v: "+1→", g: "Kế +1 →", h: "Thẻ kế tiếp +1 và dời sang phải", t: "Nhện Non: sau khi đặt thẻ tiếp theo, cho nó +1 sức mạnh và dời sang phải.", srcName: nx(["nhennon"], "") });
    if (G0.lockjaw && G0.lockjaw[s]) g("lockjaw", { i: "sw", v: "Đổi", g: "Kế bị đổi", h: "Thẻ kế tiếp đổi với thẻ từ bộ bài", t: "Linh Khuyển: sau khi đặt nhân vật tiếp theo, đổi nó với một thẻ từ bộ bài.", srcName: nx(["khuyendichchuyen"], "") });
    if (G0.swan && G0.swan[s] >= T) g("swan", { i: "bo", v: "0", g: "1NL = 0", h: "Thẻ 1 năng lượng của bạn thành 0 đến hết lượt sau", t: "Thiên Nga Đen: đến hết lượt sau, các thẻ 1 năng lượng của " + (s === "p" ? "bạn" : "đối thủ") + " có năng lượng 0.", when: G0.swan[s] > T ? "Lượt sau" : "Lượt này", srcName: nx(["thienngaden"], "") });
    if (G0.endTwice && G0.endTwice[s] === T) g("endTwice", { i: "x2", v: "×2", g: "Cuối Lượt ×2", h: "Lượt này: kỹ năng Cuối Lượt lặp lại", t: "Ẩn Nữ Rừng Trúc: trong lượt này, các kỹ năng Cuối Lượt của " + (s === "p" ? "bạn" : "đối thủ") + " được lặp lại.", when: "Lượt này", srcName: nx(["annusokhai"], "") });
    if (G0.nextBonus && G0.nextBonus[s] > 0) g("nrg", { i: "bo", v: "+" + G0.nextBonus[s], g: "Lượt sau +" + G0.nextBonus[s], h: "Lượt sau +" + G0.nextBonus[s] + " năng lượng", t: "Lượt sau " + (s === "p" ? "bạn" : "đối thủ") + " nhận thêm " + G0.nextBonus[s] + " năng lượng.", when: "Lượt sau", srcName: nx(["tamkiemnu", "gangchandong", "tinhchuathaiduong", "phuthuydamlay", "chopcothuat", "tieuthu", "cogiapnhen"], "") });
    /* cờ theo chiến địa gắn với phe: Tiên Dung / Tên Móc */
    const sh = G0.shuri && G0.shuri[s];
    if (sh) { const f = srcBy(s, ["congchuacongnghe"]); push({ pd: 1, id: "shuri", src: f ? f.uid : 0, lane: sh - 1, row: s, own: s, i: "x2", v: "×2", h: "Thẻ kế tiếp đặt ở đây: ×2 sức mạnh", t: "Tiên Dung: nếu bạn đặt thẻ tiếp theo ở chiến địa này, nhân đôi sức mạnh của nó.", when: "Thẻ kế tiếp", srcName: f ? nm(f) : C.congchuacongnghe.n }); }
    const gr = G0.grapple && G0.grapple[s];
    if (gr) push({ pd: 1, id: "grapple", lane: gr - 1, row: s, own: s, i: "bk", v: "Kéo", h: "Thẻ kế tiếp bạn đặt bị kéo về đây", t: "Tên Móc: sau khi đặt thẻ kế tiếp, dời nó về chiến địa này.", when: "Thẻ kế tiếp", srcName: C.tenmoc.n });
  }
  /* cờ chung cả hai phe */
  const gn = (id, o) => push(Object.assign({ pd: 1, id, own: "n", row: "g", lane: -1, glob: 1 }, o));
  if (G0.hideT >= T) gn("hideT", { i: "ey", v: "Úp", g: "Đặt = úp", h: (G0.hideT > T ? "Lượt sau" : "Lượt này") + " thẻ đặt xuống úp đến hết ván", t: "Già Thiên: tất cả thẻ đặt " + (G0.hideT > T ? "ở lượt sau" : "trong lượt này") + " sẽ không lật cho đến khi ván đấu kết thúc.", when: G0.hideT > T ? "Lượt sau" : "Lượt này", srcName: C.sieusaokhonglo.n });
  if (G0.noLoc >= T) gn("noLoc", { i: "no", v: "Bỏ", g: "Bỏ KN địa", h: "Bỏ qua kỹ năng chiến địa đến hết lượt sau", t: "Cực Quang Ưng: bỏ qua mọi kỹ năng chiến địa đến hết lượt sau.", when: G0.noLoc > T ? "Lượt sau" : "Lượt này", srcName: C.cucquangung.n });
  if (G0.costUp === T) gn("costUp", { i: "up", v: "+1", g: "Giá +1", h: "Lượt này mọi thẻ +1 năng lượng (tối đa 6)", t: "Ma Cát: các thẻ tăng 1 năng lượng (tối đa 6) trong lượt này.", when: "Lượt này", srcName: C.catnhan.n });
  else if (G0.costUp > T) gn("costUp", { i: "up", v: "+1", g: "Giá +1", h: "Lượt sau mọi thẻ +1 năng lượng (tối đa 6)", t: "Ma Cát: lượt sau các thẻ tăng 1 năng lượng (tối đa 6).", when: "Lượt sau", srcName: C.catnhan.n });
  if (G0.costCap >= T) gn("costCap", { i: "dn", v: "≤4", g: "Giá ≤4", h: "Năng lượng thẻ tối đa 4 đến hết lượt sau", t: "Ba Đào Tiên: tất cả thẻ có năng lượng tối đa 4 cho đến hết lượt sau.", when: G0.costCap > T ? "Lượt sau" : "Lượt này", srcName: C.songnu.n });
  return out;
}

/* ---------- vẽ ---------- */
let SIG = "", LASTM = [], POP = null, CACHE = new Map(), glob = null, ready = false;
const prio = m => (m.pd ? 0 : 10) + (m.own === "p" ? 0 : m.own === "a" ? 1 : 2);
const sigOf = ms => ms.map(m => m.k + "|" + m.v + "|" + m.n + "|" + (m.when || "")).join(";");

function chipHTML(m, extra) {
  const isNew = !CACHE.has(m.k);
  return '<button type="button" class="dhc ' + own(m.own) + (m.pd ? " dpd" : " dau") + (isNew ? " dnw" : "") + (extra || "") + '" data-dhk="' + esc(m.k) + '" title="' + esc(m.h) + '" aria-label="' + esc(m.h + (m.srcName ? " — " + m.srcName : "")) + '">' + ic(m.pd && !m.i ? "hg" : m.i) + "<b>" + esc(m.v) + "</b>" + (m.n > 1 ? '<i class="dhn">' + m.n + "</i>" : "") + "</button>";
}
function moreHTML(n, lane) { return '<button type="button" class="dhc dne dmo" data-dhk="more" data-dhl="' + lane + '" aria-label="Xem thêm ' + n + ' dấu hiệu"><b>…+' + n + "</b></button>"; }

function railsHTML(lane, ms, locw) {
  const rows = { a: [], p: [] };
  for (const m of ms) if (m.lane === lane) rows[m.row === "a" ? "a" : "p"].push(m);
  let html = "";
  for (const r of ["a", "p"]) {
    const arr = rows[r].sort((x, y) => prio(x) - prio(y));
    if (!arr.length) continue;
    const mx = locw.querySelector(".mx." + r);
    const slots = mx ? 2 : 4;
    let vis = arr, hid = 0;
    if (arr.length > slots) { vis = arr.slice(0, slots - 1); hid = arr.length - vis.length; }
    const left = [], right = [];
    const chips = vis.map(m => chipHTML(m));
    if (hid) chips.push(moreHTML(hid, lane));
    chips.forEach((h, i) => { (mx || i % 2 === 0 ? left : right).push(h); });
    // thứ tự điền: trái-trên, phải-trên, trái-dưới, phải-dưới -> cột trái nhận chip 0,2 và cột phải chip 1,3
    /* gpu35: tổng điểm 3–4 chữ số làm lục giác rộng hơn -> thu hẹp cột chip để không đè số */
    const pwe = locw.querySelector(".pw." + r), pos = (r === "a" ? "ft" : "fb") + (pwe && /\bd4\b/.test(pwe.className) ? " w4" : pwe && /\bd3\b/.test(pwe.className) ? " w3" : "");
    if (left.length) html += '<div class="dh-f ' + pos + ' fl">' + left.join("") + "</div>";
    if (right.length) html += '<div class="dh-f ' + pos + ' fr">' + right.join("") + "</div>";
  }
  return html;
}

function ghost(m, rect, pulse) {
  if (document.body.classList.contains("rm") || !rect || !rect.width || !document.body.animate) return;
  const g = document.createElement("div");
  g.innerHTML = chipHTML(m, " dh-ghost").replace(" dnw", "");
  const el = g.firstChild; el.style.left = rect.left + "px"; el.style.top = rect.top + "px"; el.removeAttribute("data-dhk"); el.tabIndex = -1;
  document.body.appendChild(el);
  const a = pulse
    ? el.animate([{ transform: "scale(1)", opacity: 1, filter: "brightness(1)" }, { transform: "scale(1.7)", opacity: 1, filter: "brightness(2)", offset: .35 }, { transform: "scale(1.15)", opacity: 0 }], { duration: 620, easing: "ease-out" })
    : el.animate([{ opacity: .9, transform: "scale(1)" }, { opacity: 0, transform: "scale(.6)" }], { duration: 260, easing: "ease-in" });
  a.onfinish = a.oncancel = () => el.remove();
  setTimeout(() => el.remove(), 900);
}

let MT = 0;
function measure() {
  MT = 0;
  for (const el of document.querySelectorAll(".dhc[data-dhk]")) {
    const c = CACHE.get(el.dataset.dhk); if (!c) continue;
    const r = el.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight; // tâm không đổi dù đang phóng/thu khi vào
    if (w > 8) c.rect = { left: r.left + r.width / 2 - w / 2, top: r.top + r.height / 2 - h / 2, width: w, height: h };
  }
}
function paint() {
  if (!ready) return;
  const board = document.getElementById("board"); if (!board) return;
  let ms; try { ms = compute(); } catch (e) { ms = []; }
  const sig = sigOf(ms);
  let rebuilt = false;
  const lanes = [...board.querySelectorAll(".lane")];
  const gl = ms.filter(m => m.lane < 0), ln = ms.filter(m => m.lane >= 0);
  /* hào quang nền: hàng/phe nào bị tác động */
  const tl = [0, 1, 2].map(() => ({ p: new Set(), a: new Set() }));
  for (const m of ms) {
    if (m.pd || m.tint === null || m.tint === undefined) continue;
    const lanesT = m.lane < 0 ? [0, 1, 2] : [m.lane];
    const rowsT = m.tint === "both" ? ["p", "a"] : [m.row === "a" ? "a" : "p"];
    for (const l of lanesT) for (const r of rowsT) tl[l][r].add(tintCode(m.own));
  }
  const code = set => !set || !set.size ? "" : set.size > 1 ? "m" : [...set][0];
  lanes.forEach((lane, li) => {
    const lp = code(tl[li] && tl[li].p), la = code(tl[li] && tl[li].a);
    if ((lane.dataset.dhp || "") !== lp) { if (lp) lane.dataset.dhp = lp; else delete lane.dataset.dhp; }
    if ((lane.dataset.dha || "") !== la) { if (la) lane.dataset.dha = la; else delete lane.dataset.dha; }
    const locw = lane.querySelector(".locw"); if (!locw) return;
    const key = ln.filter(m => m.lane === li).map(m => m.k + m.v + m.n).join(";") + "|" + !!locw.querySelector(".mx.a") + !!locw.querySelector(".mx.p") + [...locw.querySelectorAll(".pw")].map(e => /\bd[34]\b/.exec(e.className) || "").join("");
    if (locw.dataset.dhs === key && (key.length < 4 || locw.querySelector(".dh-f"))) return;
    locw.querySelectorAll(".dh-f").forEach(e => e.remove());
    const h = railsHTML(li, ln, locw);
    if (h) locw.insertAdjacentHTML("beforeend", h);
    locw.dataset.dhs = key; rebuilt = true;
  });
  /* dải toàn bàn */
  const bar = document.querySelector("#app > .sub");
  if (bar && !glob) { glob = document.createElement("div"); glob.id = "dhGlob"; const fin = bar.querySelector(".final"); bar.insertBefore(glob, fin ? fin.nextSibling : bar.querySelector(".tools.r")); }
  if (glob) {
    const gk = gl.map(m => m.k + m.v + m.n).join(";") + innerWidth;
    if (glob.dataset.dhs !== gk) {
      const arr = gl.slice().sort((x, y) => prio(x) - prio(y));
      const gm = m => Object.assign({}, m, { v: m.g || m.v });
      let nv = arr.length;
      const draw = () => { glob.innerHTML = arr.slice(0, nv).map(m => chipHTML(gm(m))).join("") + (nv < arr.length ? moreHTML(arr.length - nv, "g") : ""); };
      draw();
      const used = () => { let w = 0, n = 0; for (const e of glob.children) { w += e.offsetWidth; n++; } return w + Math.max(0, n - 1) * 3; };
      /* fix55: đo bề rộng mọi chip MỘT lần rồi tính số chip vừa dải (trước: xoá-vẽ-đo lặp từng chip, mỗi vòng buộc tính lại bố cục) */
      const avail = glob.clientWidth - 8, ws = [...glob.children].map(e => e.offsetWidth);
      if (ws.reduce((a, b) => a + b, 0) + Math.max(0, ws.length - 1) * 3 > avail && nv > 1) {
        let acc = 0, k = 0; while (k < nv && acc + ws[k] + 3 * k + 40 <= avail) { acc += ws[k]; k++; }
        nv = Math.max(1, k); draw();
        while (nv > 1 && used() > avail) { nv--; draw(); }
      }
      glob.dataset.dhs = gk; rebuilt = true;
    }
  }
  if (rebuilt && !MT) MT = setTimeout(() => requestAnimationFrame(measure), 150); /* fix55: đọc toạ độ gộp ở đầu khung */ // lưu vị trí chip để diễn nhịp "đã chạy" khi nó biến mất
  /* vào/ra: chip biến mất khi đã chạy -> nhịp nhỏ; chip mới đánh dấu để tắt hiệu ứng vào ở lần sau */
  if (sig !== SIG) {
    const nowKeys = new Set(ms.map(m => m.k));
    for (const [k, v] of CACHE) if (!nowKeys.has(k)) {
      const alive = v.m.src && (typeof G !== "undefined" && G && E.find(G, v.m.src));
      if (v.m.pd) ghost(v.m, v.rect, !!alive || !v.m.src);
    }
    SIG = sig; LASTM = ms;
    const nc = new Map(); for (const m of ms) nc.set(m.k, { m, rect: (CACHE.get(m.k) || {}).rect || null });
    CACHE = nc;
    document.body.classList.toggle("dh-lo", window.FXLV === 0);
  } else {
    LASTM = ms;
  }
}

/* ---------- bảng chi tiết ---------- */
function pop(focusKey) {
  if (!POP) { POP = document.createElement("div"); POP.id = "dhPop"; POP.setAttribute("role", "dialog"); POP.setAttribute("aria-label", "Dấu hiệu trên bàn"); document.body.appendChild(POP); }
  const ms = LASTM.slice();
  const f = ms.find(m => m.k === focusKey);
  const fl = f ? f.lane : (focusKey && /^\d$/.test(String(focusKey)) ? +focusKey : -2);
  const groups = [["Toàn bàn", ms.filter(m => m.lane < 0)]];
  for (let l = 0; l < 3; l++) { const a = ms.filter(m => m.lane === l); if (a.length) groups.push(["Chiến địa " + (l + 1) + (G.locs[l].rvl && !locVeiled(G) ? " · " + E.LOC[G.locs[l].id].n : ""), a, l]); }
  groups.sort((a, b) => (b[2] === fl ? 1 : 0) - (a[2] === fl ? 1 : 0));
  let h = '<button type="button" class="dhx" aria-label="Đóng">✕</button><h4>Dấu hiệu trên bàn</h4>';
  for (const [t, arr] of groups) {
    if (!arr.length) continue;
    h += '<div class="dsc">' + esc(t) + "</div>";
    for (const m of arr.sort((x, y) => prio(x) - prio(y))) {
      const who = m.own === "p" ? "của bạn" : m.own === "a" ? "của đối thủ" : "chung hai bên";
      h += '<div class="dit' + (m.k === focusKey ? " hl" : "") + '">' + chipHTML(Object.assign({}, m, { n: 1 }), "").replace(" dnw", "").replace(/ data-dhk="[^"]*"/, "") +
        '<div><div class="dhd">' + esc(m.h) + (m.n > 1 ? " (×" + m.n + ")" : "") + '</div><div class="dmt">' + (m.srcName ? "Từ <b>" + esc(m.srcName) + "</b> · " : "") + who + " · " + esc(m.when || "") + "</div>" +
        (m.t ? '<div class="dtx">' + esc(m.t) + "</div>" : "") + "</div></div>";
    }
  }
  POP.innerHTML = h; POP.classList.add("on"); POP.scrollTop = 0;
}
function closePop() { if (POP) POP.classList.remove("on"); }

function init() {
  if (ready) return; ready = true;
  document.body.insertAdjacentHTML("beforeend", SVGNS);
  document.addEventListener("click", ev => {
    const x = ev.target.closest && ev.target.closest("#dhPop .dhx");
    if (x) { closePop(); ev.stopPropagation(); return; }
    const chip = ev.target.closest && ev.target.closest(".dhc[data-dhk]");
    if (chip) {
      ev.stopPropagation(); ev.preventDefault();
      const k = chip.dataset.dhk; pop(k === "more" ? (chip.dataset.dhl === "g" ? "" : chip.dataset.dhl) : k); return;
    }
    if (POP && POP.classList.contains("on") && !ev.target.closest("#dhPop")) { closePop(); ev.stopPropagation(); ev.preventDefault(); }
  }, true);
  document.addEventListener("keydown", ev => { if (ev.key === "Escape") closePop(); });
  /* vẽ lại khi bàn thay đổi (render/patchBoard) — gộp một lần mỗi khung hình */
  let q = 0; const sched = () => { if (q) return; q = requestAnimationFrame(() => { q = 0; try { paint(); } catch (e) {} }); };
  const b = document.getElementById("board");
  /* fix55: chỉ vẽ lại khi thêm/gỡ đúng thẻ (.mc) hoặc khung chiến địa (.lane/.side/.slot/.locw) — các nút VFX tạm thêm vào #board (vệt, hạt, nhãn bay…) không kích hoạt paint nữa.
     render() đã tự gọi sched(), nên mọi thay đổi theo luật vẫn được vẽ. */
  const REL = ".mc,.lane,.side,.slot,.locw,.loc";
  const rel = n => n.nodeType === 1 && !n.classList.contains("dh-f") && n.id !== "dhGlob" && (n.matches(REL) || !!n.querySelector(".mc,.locw"));
  if (b) new MutationObserver(ms => { for (const m of ms) { for (const n of m.addedNodes) if (rel(n)) return sched(); for (const n of m.removedNodes) if (rel(n)) return sched(); } }).observe(b, { childList: true, subtree: true });
  const r0 = window.render; if (typeof r0 === "function" && !r0.__dh) { const r1 = function () { const r = r0.apply(this, arguments); sched(); return r; }; r1.__dh = 1; window.render = r1; }
  sched();
  window.DauHieu = { compute, paint, pop, measure, cache: () => CACHE };
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* ===== m44: HỆ DẤU HIỆU TRẠNG THÁI (window.TT) — một danh mục cho mọi trạng thái thẻ / chiến địa / bộ bài =====
   Thẻ (trên tay, trên bàn): một VÒNG hào quang của trạng thái ưu tiên cao nhất + tối đa 2 HUY HIỆU tròn (ảnh vẽ sẵn img/v) ở mép phải giữa thẻ,
   không đè ô năng lượng (trái trên), sức mạnh (phải trên), tên (dưới).
     zg      Cương Thi Nuốt Sao đánh dấu (sẽ hoá bản sao)         · surge  Lôi Quang Tiên truyền điện (đặt -> lặp lại)
     infect  bị Vi-rút Cơ Giới lây nhiễm                          · shield Phá Sơn (thẻ 1 & 6 NL) / Giáp Hộ Thân (chiến địa) không thể bị tiêu huỷ
     herald  Sứ Giả của Gã Hái Sao (và chính Gã Hái Sao đã chọn)   · link   ảo ảnh đang nối với Ảo Thuật Gia
     act-ready / act-queued / act-used / act-wait  thẻ Kích Hoạt  · quick  Rút Nhanh đang bật trên tay · evil thẻ ÁC (Lục Ác)
   Tay: lớp .ttc-on = kỹ năng Lật có điều kiện đang thoả (tính bằng chạy lật thật trên bản sao, ngoài khung hình, có bộ nhớ đệm);
        lớp phủ .tth nháy khi một hiệu ứng chạm vào thẻ đang trên tay (năng lượng / sức mạnh / biến đổi).
   Chiến địa (.ttl trong .locw): cờ Giáp Trừng Phạt, sao Sứ Giả, mắt canh (thẻ chờ lượt sau), ×2 Tiên Dung, móc Tên Móc.
   Bộ bài (#ttDeckP / #ttDeckA cạnh "Bài N"): số thẻ zg còn trong bộ bài, đỉnh bộ bài mang điện.
   Chỉ ĐỌC trạng thái; hoạt ảnh chỉ transform/opacity (CSS 08-dau-hieu.css); body.rm: tĩnh. */
(function () {
"use strict";
if (typeof document === "undefined" || typeof E === "undefined") return;
const C = E.C;
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const NM = id => (C[id] && C[id].n) || id;
const cur = () => (typeof G !== "undefined" ? G : null); /* render() tạm đặt G = GV (khung trước bước) nên đọc G là đúng khung đang vẽ */
const isA = (g, c, id) => { try { return E.is(g, c, id); } catch (e) { return c.id === id; } };
const abOf = c => { try { return E.ab(c); } catch (e) { return c.ab || c.id; } };
const IMG = { lockd: "v_an_xich", zg: "v_kenuotsao", infect: "v_tt_virut", shield: "v_an_khien", herald: "v_sao_tang", link: "v_an_vong", mark: "v_an_co", watch: "v_an_mat", hook: "v_an_xich", x2: "v_an_ngoc" };

/* ---------- ngữ cảnh mỗi lần vẽ (tính một lần cho cả bàn, xoá ở vi tác vụ kế tiếp) ---------- */
let CTX = null;
function ctx() {
  const g = cur(); if (!g || !g.locs) return null;
  if (CTX && CTX.g === g) return CTX;
  const x = { g, her: new Map(), herSrc: new Map(), shieldOn: { p: false, a: false }, giap: [false, false, false], ill: new Map(), lanes: [] };
  const vis = (c, s, where) => where === "board" ? c.rev : s === "p"; /* thẻ trên tay / bộ bài của đối thủ là thông tin ẩn */
  for (const s of E.SIDES) {
    const pools = [["hand", g.hand[s] || []], ["deck", g.deck[s] || []]];
    for (let li = 0; li < 3; li++) pools.push(["board", g.locs[li].cards[s]]);
    for (const [where, arr] of pools) for (const c of arr) {
      if (!c || c.sil || !vis(c, s, where)) continue;
      if (c.her && isA(g, c, "kenuotsaosokhai")) {
        const f = E.find(g, c.her);
        if (f && f.inst.rev && f.inst.side === s) { x.her.set(f.inst.uid, c); x.herSrc.set(c.uid, f); if (!x.lanes.some(m => m.tt === "herald" && m.lane === f.li && m.side === s)) x.lanes.push({ tt: "herald", lane: f.li, side: s, src: c.id, t: `${NM(c.id)}: Sứ Giả là ${NM(f.inst.id)} — Cuối Lượt +2 sức mạnh nếu bạn đang thắng ở chiến địa này.` }); }
      }
      if (c.mk != null && !c.done && isA(g, c, "trungphatcogiap") && !(g.locs[c.mk] && g.locs[c.mk].gone))
        x.lanes.push({ tt: "mark", lane: c.mk, side: s, src: c.id, t: `${NM(c.id)} đánh dấu chiến địa ${c.mk + 1}: thắng ở đây cuối lượt -> +1 năng lượng tối đa.` });
      if (where === "board" && c.rev) {
        if (isA(g, c, "thachlucnu")) x.shieldOn[s] = true;
        if (isA(g, c, "giaphon")) x.giap[g.locs.findIndex(L => L.cards[s].includes(c))] = true;
        if (c.ill && isA(g, c, "aothuatgia")) x.ill.set(c.ill, c);
        const li = g.locs.findIndex(L => L.cards[s].includes(c)), T = g.turn;
        if (c.wait > 0 && c.wait >= T && ["thantien", "giapcuuho", "thamtunu", "tenthuong"].some(i => isA(g, c, i)))
          x.lanes.push({ tt: "watch", lane: li, side: s, src: c.id, t: `${NM(c.id)} đang canh chiến địa này (${c.wait > T ? "lượt sau" : "lượt này"}).` });
        else if ((c.w2 && c.w2.t >= T) || (c.ip && c.ip.t >= T)) x.lanes.push({ tt: "watch", lane: li, side: s, src: c.id, t: `${NM(c.id)} đang canh chiến địa này.` });
      }
    }
    if (g.shuri && g.shuri[s]) x.lanes.push({ tt: "x2", lane: g.shuri[s] - 1, side: s, src: "congchuacongnghe", t: `${NM("congchuacongnghe")}: thẻ kế tiếp đặt ở đây được nhân đôi sức mạnh.` });
    if (g.grapple && g.grapple[s]) x.lanes.push({ tt: "hook", lane: g.grapple[s] - 1, side: s, src: "tenmoc", t: `${NM("tenmoc")}: thẻ kế tiếp sẽ bị kéo về chiến địa này.` });
  }
  CTX = x; queueMicrotask(() => { if (CTX === x) CTX = null; });
  return x;
}

/* ---------- danh mục trạng thái thẻ: [khoá, vòng?, kiểm tra(c, where, x) -> chữ giải thích | ""] (thứ tự = ưu tiên) ---------- */
const own = c => (c.side || c.own || "p");
function actState(c, where, x) {
  if (where !== "board" || !c.rev || c.sil || !E.ACT[abOf(c)]) return "";
  const g = x.g, s = own(c);
  if (c.act) return "used";
  if (s === "p" && E.queued(g, "p", c.uid, "act")) return "queued";
  if (c.turn >= g.turn) return "wait";
  return "ready";
}
const ST = [
  ["zg", 1, (c, w, x) => c.zg && (c.zgo || own(c)) === "p" ? `Bị ${NM("bayxacnuotsao")} đánh dấu: khi ${NM("bayxacnuotsao")} lật, thẻ này (trên tay, trên bàn hoặc trong bộ bài) hoá thành bản sao của nó.` : ""],
  ["surge", 1, c => c.surge ? `Được ${NM("diennu")} truyền điện: khi đặt thẻ này, kỹ năng lặp lại lên thẻ trên cùng bộ bài.` : ""],
  ["infect", 1, c => !c.sil && c.ab === "virutcosinh" && c.id !== "virutcosinh" ? `Bị ${NM("virutcosinh")} lây nhiễm: kỹ năng bị thay bằng kỹ năng vi-rút.` : ""],
  ["herald", 1, (c, w, x) => x.her.has(c.uid) ? `Sứ Giả của ${NM("kenuotsaosokhai")}: thắng ở chiến địa này cuối lượt -> ${NM("kenuotsaosokhai")} +2 sức mạnh.`
    : x.herSrc.has(c.uid) ? `Đã chọn Sứ Giả: ${NM(x.herSrc.get(c.uid).inst.id)} ở chiến địa ${x.herSrc.get(c.uid).li + 1}.` : ""],
  ["act", 1, (c, w, x) => { const a = actState(c, w, x); return a ? "act-" + a : ""; }],
  ["quick", 1, (c, w, x) => w === "hand" && !c.sil && c.dr === x.g.turn && (/Rút Nhanh/i.test((C[abOf(c)] || {}).x || "") || (x.g.tff && x.g.tff[own(c)])) ? "Rút Nhanh đang bật: thẻ vừa rút lượt này." : ""],
  ["shield", 0, (c, w, x) => { if (w !== "board" || !c.rev) return ""; const s = own(c), cc = (C[c.id] || {}).c;
    if (x.shieldOn[s] && (cc === 1 || cc === 6)) return `${NM("thachlucnu")}: thẻ ${cc} năng lượng của bạn không thể bị tiêu huỷ.`;
    const li = x.g.locs.findIndex(L => L.cards[s].includes(c)); return li >= 0 && x.giap[li] ? `${NM("giaphon")}: thẻ ở chiến địa này không thể bị tiêu huỷ.` : ""; }],
  ["lockd", 1, (c, w, x) => w === "hand" && c.noPlay && c.noPlay >= x.g.turn ? `Bị ${NM("chodoc")} trói: không thể đặt ở ${c.noPlay > x.g.turn ? "lượt sau" : "lượt này"}.` : ""],
  ["free", 0, (c, w, x) => w === "board" && c.rev && c.free && c.free >= x.g.turn ? `Dời được ${c.free > x.g.turn ? "ở lượt sau" : "trong lượt này"}.` : ""],
  ["tcm", 0, (c, w, x) => w === "hand" && c.tcm && c.tcm.t > x.g.turn ? `Lượt sau thẻ này ${c.tcm.a < 0 ? "giảm " + -c.tcm.a : "tăng " + c.tcm.a} năng lượng.` : ""],
  ["link", 0, (c, w, x) => x.ill.has(c.uid) ? `Ảo ảnh nối với ${NM(x.ill.get(c.uid).id)}: cuối lượt hai thẻ đổi sức mạnh.` : ""],
  ["evil", 1, c => c.evil && !c.evp ? "Thẻ ÁC của Lục Ác: đặt đủ 6 thẻ ÁC để hợp thể." : ""],
];
const ACT_TX = { "act-ready": "Kích Hoạt: SẴN SÀNG — chạm thẻ để kích hoạt.", "act-queued": "Kích Hoạt: đã chọn, chạy khi lật bài.", "act-used": "Kích Hoạt: đã dùng.", "act-wait": "Kích Hoạt: dùng được từ lượt sau." };
function card(c, where) {
  const x = ctx(); if (!x || !c) return [];
  const out = [];
  for (const [k, ring, f] of ST) { let t = ""; try { t = f(c, where, x); } catch (e) {} if (!t) continue;
    if (k === "act") out.push({ k: t, ring: t === "act-ready" || t === "act-queued", t: ACT_TX[t] }); else out.push({ k, ring: !!ring, t }); }
  return out;
}
const GLY = { "act-ready": '<svg viewBox="0 0 24 24"><path d="M13 2L5 13h6l-1 9 8-11h-6z"/></svg>', "act-queued": '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  "act-used": '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>', "act-wait": '<svg viewBox="0 0 24 24"><path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/></svg>',
  free: '<svg viewBox="0 0 24 24"><path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/></svg>', tcm: '<svg viewBox="0 0 24 24"><path d="M12 4v15M5 13l7 7 7-7"/></svg>',
  surge: '<svg viewBox="0 0 24 24"><path d="M13 2L5 13h6l-1 9 8-11h-6z"/></svg>', quick: '<svg viewBox="0 0 24 24"><path d="M13 2L5 13h6l-1 9 8-11h-6z"/></svg>', evil: '<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="7"/><path d="M9 21v-4M15 21v-4M9 10h.01M15 10h.01"/></svg>' };
/* ---------- BỘ ĐẾM: thẻ có hiệu ứng "cho mỗi …" hiện số đếm hiện tại (ô tròn vàng mép trái dưới, trên tên thẻ) ----------
   [id] -> (g, c, li, s, where) => [số, chữ giải thích] | null. li = chiến địa (trên bàn / thẻ đang chờ lật), -1 trên tay.
   Số theo đúng công thức engine; thông tin ẩn (năng lượng / tay đối thủ khi chưa lộ, thẻ đối thủ vừa đặt úp) không hiện. */
const sh = (g, li, s) => li >= 0 && g.locs[li] ? g.locs[li].cards[s].filter(k => k.rev) : [];
const bc = (g, s) => { const r = []; for (let l = 0; l < 3; l++) for (const k of g.locs[l].cards[s]) if (k.rev) r.push([k, l]); return r; };
const pw = (g, k, l) => { try { return E.power(g, k, l); } catch (e) { return E.basePow(k) + (k.bonus || 0); } };
const cnt = (g, k, s) => (g.cnt && g.cnt[k] ? g.cnt[k][s] || 0 : 0);
const left = (g, s) => s === "p" ? Math.max(0, g.energy.p) : null; /* năng lượng còn lại: chỉ của mình */
const queuedPlays = (g, s, c) => (g.q[s] || []).filter(a => a.t === "play" && a.uid !== c.uid).length;
const CNT = {
  longdo: (g, c, li, s) => [g.hand[s].length, "thẻ trên tay bạn (+2 mỗi thẻ)"],
  phanquanbua: (g, c, li, s) => [g.hand[E.other(s)].length, "thẻ trên tay đối thủ (+2 mỗi thẻ)"],
  ungtoi: (g, c, li, s) => [g.deck[E.other(s)].length, "thẻ trong bộ bài đối thủ (+2 mỗi thẻ)"],
  huyetbacsi: (g, c, li, s) => [cnt(g, "disc", s), "lần bạn đã vứt bỏ (+2 mỗi lần)"],
  daitaxacsong: (g, c, li, s) => [cnt(g, "discTurns", s), "lượt bạn đã vứt bỏ (+1 cho thẻ khác tại đây)"],
  giapdam: (g, c, li, s) => [cnt(g, "moves", s), "lần thẻ của bạn đã di chuyển"],
  hoasat: (g, c, li, s) => [g.destLoc && g.destLoc[s] ? g.destLoc[s].reduce((a, b) => a + (b ? 1 : 0), 0) : 0, "chiến địa có thẻ của bạn đã bị tiêu huỷ (+3 mỗi nơi)"],
  toctu: (g, c, li, s) => [cnt(g, "allSpent", s), "lượt bạn đã dùng hết năng lượng"],
  kevocam: g => [E.SIDES.reduce((n, sd) => n + bc(g, sd).filter(([k]) => k.bonus < 0).length, 0), "thẻ trên bàn đang bị trừ sức mạnh"],
  cunhan: (g, c, li, s) => [bc(g, s).filter(([k]) => k !== c && !k.sil && (C[abOf(k)] || {}).t === "on").length, "thẻ Duy Trì khác của bạn trên bàn"],
  tuthan: (g, c) => [g.cnt ? g.cnt.dest || 0 : 0, "thẻ đã bị tiêu huỷ trong ván (−1 năng lượng mỗi thẻ)"],
  nucuongnhan: (g, c, li, s) => s === "p" ? [g.unspentPrev ? g.unspentPrev[s] || 0 : 0, "năng lượng chưa dùng ở lượt trước"] : null,
  nguoituyet: (g, c, li, s) => [cnt(g, "playedLast", s), "thẻ bạn đã đặt lượt trước"],
  cuongtu: (g, c, li, s) => [bc(g, s).filter(([k, l]) => pw(g, k, l) >= 10).length, "thẻ của bạn có từ 10 sức mạnh (−2 năng lượng mỗi thẻ)"],
  giacquannhen: (g, c, li, s) => [cnt(g, "mvPlayed", s), "thẻ dời được bạn đã đặt"],
  chimnhai: (g, c, li, s) => [bc(g, s).filter(([k]) => k.sum || k.cr).length, "thẻ được tạo ra của bạn trên bàn"],
  daidoan: (g, c, li, s) => [cnt(g, "crPlayed", s), "thẻ được tạo ra bạn đã đặt"],
  quaituongtienhoa: (g, c, li, s) => [bc(g, E.other(s)).filter(([k]) => k.bonus < 0).length, "thẻ địch đang bị trừ sức mạnh"],
  khisatthu: (g, c, li, s, w) => [w === "board" ? Math.max(0, cnt(g, "playedNow", s) - 1) : queuedPlays(g, s, c), "thẻ khác bạn đặt lượt này (+2 mỗi thẻ)"],
  vuongbathu: (g, c, li, s) => [bc(g, s).filter(([k]) => k !== c && k.bonus > 0).length, "thẻ khác của bạn đã được tăng sức mạnh"],
  horangkiem: (g, c, li, s) => [g.deck[s].filter(k => (C[k.id] || {}).c === 4).length, "thẻ 4 năng lượng trong bộ bài bạn"],
  thantho: (g, c, li, s) => [g.deck[s].length, "thẻ trong bộ bài bạn"],
  soidomienvien: (g, c, li, s, w) => [g.hand[s].filter(k => k !== c).length, "thẻ trên tay bạn"],
  cosinhthe: (g, c, li, s) => left(g, s) == null ? null : [left(g, s), "năng lượng chưa dùng (giảm năng lượng bấy nhiêu thẻ trên tay)"],
  nuhongtam: (g, c, li, s) => left(g, s) == null ? null : [1 + left(g, s), "lần trừ 2 sức mạnh (1 + năng lượng chưa dùng)"],
  vetmattroi: (g, c, li, s) => left(g, s) == null ? null : [left(g, s), "năng lượng chưa dùng (+1 mỗi năng lượng, Cuối Lượt)"],
  docnhantienhoa: (g, c, li, s) => left(g, s) == null ? null : [left(g, s), "năng lượng chưa dùng (>0 thì Cuối Lượt kích hoạt)"],
  cuongnhantienhoa: (g, c, li, s) => left(g, s) == null ? null : [left(g, s), "năng lượng chưa dùng (>0 thì Cuối Lượt +2)"],
  taymaynutienhoa: (g, c, li, s) => left(g, s) == null ? null : [left(g, s), "năng lượng chưa dùng (>0 thì Cuối Lượt kích hoạt)"],
  nguyetlongnu: (g, c, li, s) => left(g, s) == null ? null : [left(g, s), "năng lượng chưa dùng (cần 0 và đặt đúng 1 thẻ)"],
  quangca: (g, c, li, s) => [[0, 1, 2].filter(k => !g.locs[k].gone && g.locs[k].cards[s].length >= E.cap(g, k)).length, "chiến địa đã đầy phía bạn (+2 mỗi nơi)"],
  longuclua: (g, c, li, s) => li < 0 ? null : [sh(g, li, s).filter(k => (C[k.id] || {}).c >= 5).length + g.hand[s].filter(k => (C[k.id] || {}).c >= 5).length, "thẻ từ 5 năng lượng tại đây và trên tay (+2 mỗi thẻ)"],
  cuongnhanxam: (g, c, li, s) => [new Set(bc(g, s).map(([k]) => (C[k.id] || {}).c)).size, "mức năng lượng khác nhau trên bàn của bạn"],
  thukydungcam: (g, c, li, s) => [[1, 2, 3].filter(n => bc(g, s).some(([k]) => (C[k.id] || {}).c === n)).length, "loại thẻ 1/2/3 năng lượng bạn có trên bàn"],
  nhenbongdem: (g, c, li, s) => [bc(g, s).filter(([k]) => k !== c).reduce((a, [k]) => a + ((C[k.id] || {}).c || 0), 0), "tổng năng lượng các thẻ khác của bạn trên bàn"],
  nangtocdo: (g, c, li, s) => [bc(g, s).filter(([k]) => k.mt === g.turn).length, "thẻ của bạn đã di chuyển lượt này"],
  xackimve: (g, c, li, s) => [sh(g, 2, s).length, "thẻ của bạn ở chiến địa bên phải"],
  huyetdich: (g, c, li, s) => li < 0 ? null : [sh(g, li, s).filter(k => k !== c).length, "thẻ khác của bạn tại đây (+2 mỗi thẻ bị huỷ)"],
  soinu: (g, c, li, s) => li < 0 ? null : [sh(g, li, s).filter(k => k !== c).length, "thẻ khác của bạn tại đây (+2 mỗi thẻ)"],
  docdich: (g, c, li, s) => li < 0 ? null : [sh(g, li, s).filter(k => k !== c).length, "thẻ khác của bạn tại đây (+2 mỗi thẻ trả về)"],
  huyetdichhangxom: (g, c, li, s) => li < 0 ? null : [li >= 2 ? 0 : sh(g, li, s).filter(k => k !== c).length, "thẻ khác của bạn tại đây (+2 mỗi thẻ dời sang phải)"],
  ketrungphat: (g, c, li, s) => li < 0 ? null : [sh(g, li, E.other(s)).length, "thẻ địch tại đây (+1 mỗi thẻ)"],
  cuongdomienvien: (g, c, li, s) => li < 0 ? null : [sh(g, li, E.other(s)).length, "thẻ địch tại đây (−1 mỗi thẻ; Rút Nhanh: +1)"],
  trinu: (g, c, li, s) => li < 0 ? null : [new Set(E.SIDES.flatMap(sd => sh(g, li, sd).filter(k => k !== c).map(k => pw(g, k, li)))).size, "mức sức mạnh khác nhau tại đây (+2 mỗi mức)"],
  thuyhau: (g, c, li, s) => li < 0 ? null : [[0, 1, 2].filter(l => l !== li && g.locs[l].cards[s].length === 1 && g.locs[l].cards[s][0].rev).length, "thẻ đứng một mình ở chiến địa khác (+5 mỗi thẻ)"],
  phankysi: (g, c, li, s) => li < 0 ? null : [E.SIDES.reduce((n, sd) => n + sh(g, li, sd).filter(k => (C[k.id] || {}).c > (C[c.id] || {}).c).length, 0), "thẻ năng lượng cao hơn tại đây (+2 mỗi thẻ)"],
};
function counter(c, where) {
  const x = ctx(); if (!x || !c || c.sil) return null;
  const f = CNT[abOf(c)]; if (!f) return null;
  const g = x.g, s = own(c); if (where === "hand" && s !== "p") return null;
  let li = -1;
  if (where === "board") li = g.locs.findIndex(L => L.cards[s].includes(c));
  else if (where === "staged") { const a = (g.q[s] || []).find(a => a.t === "play" && a.uid === c.uid); li = a ? a.li : -1; }
  try { return f(g, c, li, s, where); } catch (e) { return null; }
}
/* HTML gắn vào thẻ: vòng + huy hiệu (gọi từ markBadges trong 06 khi vẽ tay / bàn) */
function aura(c, where) {
  if (!c) return "";
  const ss = card(c, where); if (where === "hand" || where === "board") HS.note(c, where);
  const cn = counter(c, where);
  const ch = cn ? `<i class="ttn" data-tt="count" data-n="${cn[0]}" title="${esc(cn[0] + " " + cn[1])}" aria-label="${esc("Đếm: " + cn[0] + " " + cn[1])}">${cn[0]}</i>` : "";
  if (!ss.length) return ch;
  const r = ss.find(s => s.ring);
  let h = r ? `<i class="aur aur-${r.k}" aria-hidden="true"><i></i></i>` : "";
  let n = 0;
  for (const s of ss) { if (n >= 2) break; const im = IMG[s.k], gl = GLY[s.k];
    if (!im && !gl) continue;
    if (s.k === "surge" || s.k === "evil" || s.k === "quick") continue; /* đã có biểu tượng trong cột huy hiệu */
    h += `<i class="tts tts-${s.k} n${n}" data-tt="${s.k}" title="${esc(s.t)}" aria-hidden="true">${im ? `<b style="background-image:url(img/v/${im}.webp)"></b>` : gl}</i>`; n++; }
  /* mọi trạng thái còn lại vẫn có dấu đọc được (kiểm thử / trình đọc màn hình) */
  for (const s of ss) if (!h.includes(`data-tt="${s.k}"`)) h += `<i class="tts tts-x" data-tt="${s.k}" hidden></i>`;
  return h + ch;
}

/* ---------- tay: nháy phủ khi hiệu ứng chạm vào thẻ trên tay ---------- */
const HS = { prev: new Map(), now: new Map(),
  note(c, where) { if (where !== "hand" || own(c) !== "p") return; let cs = 0; try { cs = E.cost(cur(), c); } catch (e) {} this.now.set(c.uid, [c.id, c.ab || "", cs, E.basePow(c) + (c.bonus || 0), c.sil ? 1 : 0, c.surge ? 1 : 0]); },
  flush() {
    const now = this.now; this.now = new Map(); if (!now.size && !this.prev.size) return;
    const hit = [];
    for (const [u, v] of now) { const o = this.prev.get(u); if (!o) continue;
      const k = o[0] !== v[0] || o[1] !== v[1] || o[4] !== v[4] ? "mo" : v[5] && !o[5] ? "sg" : v[3] > o[3] ? "up" : v[3] < o[3] ? "dn" : v[2] < o[2] ? "cd" : v[2] > o[2] ? "cu" : "";
      if (k) hit.push([u, k]); }
    /* thẻ không còn được vẽ trong lần này (đang kéo / đã đặt) -> giữ dấu cũ để lần sau không nháy nhầm */
    for (const [u, v] of this.prev) if (!now.has(u) && cur() && cur().hand.p.some(c => c.uid === u)) now.set(u, v);
    this.prev = now;
    if (!hit.length || document.body.classList.contains("rm")) return;
    for (const [u, k] of hit) { const el = document.querySelector(`#hand [data-hc="${u}"]`); if (!el) continue;
      el.querySelectorAll(".tth").forEach(e => e.remove());
      const f = document.createElement("i"); f.className = "tth tth-" + k; f.setAttribute("aria-hidden", "true"); f.innerHTML = "<i></i>"; el.appendChild(f);
      setTimeout(() => f.remove(), 1500); }
  } };

/* ---------- tay: kỹ năng Lật có điều kiện đang thoả (Phù Thuỷ Trẻ & mọi thẻ "Lật: Nếu …") ----------
   Loại: điều kiện ở lượt sau (đặt tiếp ở đây…), điều kiện là lá đối thủ vừa đặt úp (chưa lộ), và thẻ chỉ có một phần phụ thuộc điều kiện. */
const NOGATE = new Set(["thantien", "giapcuuho", "thamtunu", "tenthuong", "congchuacongnghe", "lucsatnu", "mocnhan", "xucgiacnu", "chonphao", "tinhchua", "phatuong"]);
const COND = new Set(Object.keys(C).filter(k => C[k].t === "rev" && /^Lật: Nếu /.test(C[k].x || "") && !NOGATE.has(k)));
const SKIP = { hist: 1, _b: 1, _bp: 1, _m: 1, _nb: 1, abBy: 1, tf: 1, silBy: 1, lostTo: 1, msgs: 1, evs: 1 };
function clone(g) { const S = JSON.parse(JSON.stringify(g, (k, v) => (SKIP[k] === 1 ? undefined : v))); S.msgs = null; S.evs = null; return S; }
/* thử đặt uid vào li trên bản sao, chạy lật tới hết thẻ đó; so với bản kỹ năng bị xoá. true = kỹ năng tạo khác biệt (điều kiện thoả) */
function trial(g, uid, li) {
  const run = sil => {
    const S = clone(g); S.q.a = [];
    const h = S.hand.p.find(c => c.uid === uid); if (!h) return null;
    try { S.energy.p = Math.max(S.energy.p, E.cost(S, h, li)); } catch (e) { S.energy.p = 99; }
    if (!E.queuePlay(S, "p", uid, li)) return null;
    if (sil) h.sil = true;
    for (const st of E.beginReveal(S)) { E.doStep(S, st); if (st.uid === uid && st.t === "play") break; }
    let sc = 0; for (let k = 0; k < 3; k++) sc += E.locPower(S, k, "p") - E.locPower(S, k, "a");
    const cc = c => [c.uid, c.id, c.bonus, c.bp, c.cm, c.rev, c === h ? 0 : c.sil, c.ab || ""].join(",");
    return { sc, fp: JSON.stringify([S.locs.map(L => [L.cards.p.map(cc), L.cards.a.map(cc)]), S.hand.p.map(cc), S.deck.p.length, S.maxE, S.energy, S.nextBonus]) };
  };
  const A = run(false); if (!A) return false;
  const B = run(true); return !!B && (A.fp !== B.fp || A.sc > B.sc);
}
const CD = { key: "", res: new Map(), busy: 0 };
function condKey(g) {
  const cc = c => c.uid + ":" + c.id + ":" + (c.ab || "") + ":" + c.bonus + ":" + c.cm + ":" + (c.rev ? 1 : 0) + ":" + (c.sil ? 1 : 0);
  return [g.turn, g.phase, g.energy.p, g.maxE && g.maxE.p, JSON.stringify(g.cnt && g.cnt.allSpent), g.q.p.map(a => a.t + a.uid + ":" + a.li).join(","),
    g.hand.p.map(cc).join(","), g.locs.map(L => (L.gone ? "x" : L.id) + "|" + L.cards.p.map(cc).join(",") + "|" + L.cards.a.map(cc).join(",")).join(";")].join("#");
}
function condApply() {
  for (const el of document.querySelectorAll("#hand .hc[data-hc]")) { const on = CD.res.get(+el.dataset.hc) === true; if (el.classList.contains("ttc-on") !== on) el.classList.toggle("ttc-on", on);
    const gl = el.querySelector(":scope>.ttcg"); if (on && !gl) { const i = document.createElement("i"); i.className = "ttcg"; i.setAttribute("aria-hidden", "true"); el.appendChild(i); } else if (!on && gl) gl.remove();
    const c = COND.size && cur() && cur().hand.p.find(x => x.uid === +el.dataset.hc), cd = !!(c && !c.sil && COND.has(abOf(c)));
    if (el.classList.contains("ttc") !== cd) el.classList.toggle("ttc", cd); }
}
function condSched() {
  const g = cur(); if (!g || !g.hand || g.phase !== "play" || g.online && g.online.spect) { if (CD.res.size) { CD.res = new Map(); CD.key = ""; condApply(); } return; }
  const cands = g.hand.p.filter(c => !c.sil && COND.has(abOf(c)));
  if (!cands.length) { if (CD.res.size) { CD.res = new Map(); CD.key = ""; } condApply(); return; }
  const key = condKey(g); condApply();
  if (key === CD.key || CD.busy) return;
  CD.busy = 1;
  const ric = window.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 8 }), 30));
  ric(() => {
    CD.busy = 0; const g2 = cur(); if (!g2 || g2 !== g || condKey(g2) !== key) { condSched(); return; }
    const res = new Map();
    for (const c of cands) { let ok = false;
      for (let li = 0; li < 3 && !ok; li++) { let can = false; try { can = E.canPlay(g, "p", c, li); } catch (e) {} if (!can) continue; try { ok = trial(g, c.uid, li); } catch (e) {} }
      res.set(c.uid, ok); }
    CD.key = key; CD.res = res; condApply();
  }, { timeout: 400 });
}

/* ---------- chiến địa: dấu lớn trên ô chiến địa ---------- */
const LPRIO = { mark: 0, herald: 1, x2: 2, hook: 3, watch: 4 };
function lanes() { const x = ctx(); return x ? x.lanes.slice().sort((a, b) => LPRIO[a.tt] - LPRIO[b.tt]) : []; }
function paintLanes() {
  const board = document.getElementById("board"); if (!board) return;
  const ms = lanes();
  board.querySelectorAll(".lane").forEach((lane, li) => {
    const locw = lane.querySelector(".locw"); if (!locw) return;
    const mine = ms.filter(m => m.lane === li);
    const key = mine.map(m => m.tt + m.side + m.src).join(",");
    if (locw.dataset.tts === key && (!key || locw.querySelector(".ttl"))) return;
    locw.querySelectorAll(".ttl").forEach(e => e.remove());
    locw.dataset.tts = key;
    const per = { p: 0, a: 0 };
    for (const m of mine) { if (per[m.side] >= 2) continue;
      const k = per[m.side]++, sideEl = lane.querySelector(m.side === "p" ? ".side.me" : ".side.opp");
      const d = document.createElement("div");
      d.className = `ttl ttl-${m.tt} s${m.side} k${k}`; d.dataset.tt = m.tt; d.dataset.side = m.side; d.title = m.t; d.setAttribute("aria-label", m.t);
      if (sideEl) d.style.setProperty("--th", Math.round(sideEl.offsetHeight || 140) + "px");
      d.innerHTML = (k === 0 ? '<i class="ttl-fr"></i><i class="ttl-fl"></i>' : "") + `<i class="ttl-em" style="background-image:url(img/v/${IMG[m.tt]}.webp)"></i>`;
      locw.appendChild(d); }
  });
}

/* ---------- bộ bài: dấu cạnh "Bài N" ---------- */
function paintDeck() {
  const g = cur(); if (!g || !g.deck) return;
  for (const s of E.SIDES) {
    const sub = document.getElementById(s === "p" ? "meSub" : "oppSub"), ban = sub && sub.parentElement; if (!ban) continue;
    let el = document.getElementById(s === "p" ? "ttDeckP" : "ttDeckA");
    const d = g.deck[s] || [], top = d[d.length - 1], parts = [];
    if (s === "p") { const n = d.filter(c => c.zg && (c.zgo || "p") === "p").length; if (n) parts.push(["zg", `<b style="background-image:url(img/v/${IMG.zg}.webp)"></b>${n}`, `${n} thẻ trong bộ bài bị ${NM("bayxacnuotsao")} đánh dấu`]); }
    if (top && top.surge) parts.push(["surge", GLY.surge, `Thẻ trên cùng bộ bài đang mang điện của ${NM("diennu")} (−1 năng lượng, +1 sức mạnh).`]);
    const html = parts.map(([k, h, t]) => `<i class="ttdk-i ttdk-${k}" data-tt="${k}" title="${esc(t)}">${h}</i>`).join("");
    if (!el) { if (!html) continue; el = document.createElement("span"); el.id = s === "p" ? "ttDeckP" : "ttDeckA"; el.className = "ttdk " + s; el.setAttribute("aria-live", "polite"); ban.appendChild(el); }
    if (el._h !== html) { el._h = html; el.innerHTML = html; el.hidden = !html; }
  }
}

/* chạm dấu ♾ ở bộ bài -> xem đúng 6 thẻ bị Cương Thi đánh dấu (chỉ phe mình) và chúng đang ở đâu */
function zgList() {
  const g = cur(); if (!g) return [];
  const all = []; for (const z of ["deck", "hand"]) for (const c of g[z].p || []) all.push([c, z]);
  for (let li = 0; li < 3; li++) for (const s of E.SIDES) for (const c of g.locs[li].cards[s]) all.push([c, "board"]);
  const ids = g.zgm && Array.isArray(g.zgm.p) && g.zgm.p.length ? new Set(g.zgm.p) : null;
  return all.filter(([c]) => ids ? ids.has(c.uid) && c.zg : c.zg && (c.zgo || own(c)) === "p");
}
function zgPop(anchor) {
  let P = document.getElementById("ttPop");
  if (!P) { P = document.createElement("div"); P.id = "ttPop"; P.setAttribute("role", "dialog"); document.body.appendChild(P); }
  const L = zgList(), ZN = { deck: "Trong bộ bài", hand: "Trên tay", board: "Trên bàn" };
  const face = id => typeof faceHTML === "function" ? faceHTML(id) : `<b>${esc(NM(id))}</b>`;
  P.innerHTML = `<button type="button" class="dhx" aria-label="Đóng">✕</button><h4>${esc(NM("bayxacnuotsao"))} đã đánh dấu ${L.length} thẻ</h4>` +
    `<div class="ttpg">${L.map(([c, z]) => `<div class="ttpc z-${z}"><div class="ttpf">${face(c.id)}<i class="aur aur-zg"><i></i></i></div><small>${ZN[z]}</small></div>`).join("")}</div>` +
    `<p>Khi ${esc(NM("bayxacnuotsao"))} được đặt và lật, các thẻ này (trong bộ bài, trên tay và trên bàn) hoá thành bản sao của nó, mang sức mạnh hiện tại của nó.</p>`;
  P.classList.add("on");
  const r = anchor.getBoundingClientRect(); P.style.top = Math.round(r.bottom + 6) + "px";
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("#ttDeckP .ttdk-zg");
  const P = document.getElementById("ttPop");
  if (t) { ev.stopPropagation(); ev.preventDefault(); if (P && P.classList.contains("on")) P.classList.remove("on"); else zgPop(t); return; }
  if (P && P.classList.contains("on") && (!ev.target.closest("#ttPop") || ev.target.closest("#ttPop .dhx"))) { P.classList.remove("on"); ev.stopPropagation(); ev.preventDefault(); }
}, true);

function after() { try { HS.flush(); } catch (e) {} try { paintLanes(); } catch (e) {} try { paintDeck(); } catch (e) {} try { condSched(); } catch (e) {} }
function init() {
  /* vẽ lại sau render(); lớp .ttl nằm trong .locw (patchBoard thay .locw khi đổi -> MutationObserver gọi lại) */
  const r0 = window.render;
  if (typeof r0 === "function" && !r0.__tt) {
    const r1 = function () { const g = typeof GV !== "undefined" && GV && GV !== G ? GV : G; const sv = typeof G !== "undefined" ? G : null; const res = r0.apply(this, arguments);
      try { if (g && g !== sv) { G = g; try { after(); } finally { G = sv; } } else after(); } catch (e) {} return res; };
    r1.__tt = 1; r1.__dh = r0.__dh; window.render = r1;
  }
  const b = document.getElementById("board");
  let q = 0;
  if (b) new MutationObserver(ms => { for (const m of ms) for (const n of m.removedNodes) if (n.nodeType === 1 && (n.classList.contains("locw") || n.classList.contains("lane"))) { if (!q) q = requestAnimationFrame(() => { q = 0; try { paintLanes(); } catch (e) {} }); return; } }).observe(b, { childList: true, subtree: true });
  window.TT = { card, counter, CNT, aura, lanes, paintLanes, paintDeck, condSched, COND, trial, zgList, zgPop, ST: ST.map(s => s[0]) };
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
