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
      while (nv > 1 && used() > glob.clientWidth - 8) { nv--; draw(); }
      glob.dataset.dhs = gk; rebuilt = true;
    }
  }
  if (rebuilt && !MT) MT = setTimeout(measure, 150); // lưu vị trí chip để diễn nhịp "đã chạy" khi nó biến mất
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
  for (let l = 0; l < 3; l++) { const a = ms.filter(m => m.lane === l); if (a.length) groups.push(["Chiến địa " + (l + 1) + (G.locs[l].rvl ? " · " + E.LOC[G.locs[l].id].n : ""), a, l]); }
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
  if (b) new MutationObserver(ms => { if (ms.some(m => [...m.addedNodes, ...m.removedNodes].some(n => !(n.nodeType === 1 && (n.classList.contains("dh-f") || n.id === "dhGlob"))))) sched(); }).observe(b, { childList: true, subtree: true });
  const r0 = window.render; if (typeof r0 === "function" && !r0.__dh) { const r1 = function () { const r = r0.apply(this, arguments); sched(); return r; }; r1.__dh = 1; window.render = r1; }
  sched();
  window.DauHieu = { compute, paint, pop, measure, cache: () => CACHE };
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
