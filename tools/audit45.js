/* Mục 45: bảng rà soát mọi thẻ theo 44 nhận xét. node audit45.js <www> <outdir> */
const fs = require("fs"), path = require("path");
const WWW = process.argv[2] || "/home/claude/wt/audit/www", OUT = process.argv[3] || "/home/claude/b44";
const E = require(path.join(WWW, "js/01-engine.js")), C = E.C;
const P = require(path.join(WWW, "js/dev-vfx-lab.js"));
const src = (f) => fs.readFileSync(path.join(WWW, "js", f), "utf8");
const ds = src("03-data-store.js");
const RENAME = JSON.parse(ds.match(/const RENAME=(\{.*?\}),TEXTS=/s)[1]);
const TEXTS = JSON.parse(ds.match(/,TEXTS=(\{.*?\})[;,\n]/s)[1]);
const eng = src("01-engine.js"), SKILLS = JSON.parse(eng.match(/const SKILLS = (\[[^\]]*\])/)[1]);
const dau = src("12-dau-hieu.js"), ui = src("06-ui-match.js"), fxr = src("13-fxr.js"), sig = src("17-sig.js");
const VKD = new Set([...fxr.matchAll(/const VKD_(?:DK|CHO)=(\[[^\]]*\])/g)].flatMap((m) => JSON.parse(m[1])));
const NM = (id) => RENAME[id] || (C[id] ? C[id].n : id);
const TX = (id) => TEXTS[id] || (C[id] ? C[id].x : "");
const HN = { KD: "Khởi Đầu", C1: "C1", TB: "TB", S1: "S1", S2: "S2", S3: "S3", S4: "S4", S5: "S5", PH: "Phụ", MP: "MP" };
const fold = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
/* thẻ người dùng đã nêu đích danh trong 44 mục (để gắn số mục + làn) */
const NAMED = [[1, "Hải Kỵ", "I"], [2, "Quyền Sư Máu", "A"], [3, "Phán Quan Trời", "E"], [5, "Hắc Diệm Đế", "E"], [6, "Cương Thi Nuốt Sao", "M"], [7, "Cự Long Cổ", "A"], [8, "Tiểu Khổng Lồ", "I"], [9, "Gã Hái Sao", "M"], [10, "Càn Khôn Khai Quang", "E"], [13, "Rồng Bất Tử", "E"], [14, "Ly Gián Ma Nữ", "E"], [16, "Chúa Mặt Trời", "E"], [17, "Vua Thời Gian", "A"], [17, "Tướng Loạn Trí", "A"], [19, "Thây Ma Ánh Sao", "E"], [20, "Đầu Bay", "A"], [22, "Nhện Non", "E"], [26, "Nụ Hôn Độc", "E"], [27, "Cậu Thợ Khéo", "E"], [27, "Bát Túc Giáp", "E"], [28, "Đồng Trảo", "E"], [29, "Giáp Trừng Phạt", "M"], [30, "Hắc Thuật Sĩ", "I"], [31, "Lôi Quang Tiên", "M"], [33, "Thiện Xạ", "A"], [34, "Thư Sinh Hoá Cuồng", "E"], [35, "Tiêu Long", "A"], [36, "Vi-rút Cơ Giới", "M"], [37, "Ngọn Đuốc Sống", "E"], [38, "Phá Sơn", "M"], [39, "Thần Đồng", "I"], [40, "Ảo Thuật Sư", "E"], [41, "Chiến Thần", "A"], [42, "Hồng Nữ Tinh Quái", "E"], [43, "Phù Thuỷ Trẻ", "M"], [44, "Sầu Lão", "E"]];
const byName = new Map(); for (const id of Object.keys(C)) { byName.set(fold(NM(id)), id); byName.set(fold(C[id].n), id); }
const named = {}; const unmatched = [];
for (const [n, nm, ln] of NAMED) { const id = byName.get(fold(nm)); if (id) (named[id] = named[id] || []).push([n, ln]); else unmatched.push(n + ":" + nm); }

/* ----- mô phỏng: chạy lại thế cờ của Bảng Test (bật/tắt kỹ năng) và soi siêu dữ liệu hiển thị ----- */
function sim(id) {
  const p = P.plan(id, 777);
  if (!p.spec) return { p, A: null };
  const one = (sil, sp) => {
    sp = sp || p.spec; const G = P.newG(id, sp, p.seed); const st = P.stage(G, id, sp, { sil });
    if (!st.ok) return { st, G };
    const all0 = new Set(); for (const s of ["p", "a"]) { for (const z of ["hand", "deck", "dead", "disc"]) for (const c of G[z][s]) all0.add(c.uid); for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[s]) all0.add(c.uid); }
    const before = P.snap(G), r = P.simTurn(G);
    if (sp.endGame && !r.err) { try { G.evs = []; E.endGame(G); r.evs.push(...G.evs.splice(0)); } catch (e) {} }
    return { st, G, all0, before, after: P.snap(G), evs: r.evs || [], err: r.err };
  };
  const A = one(false); if (!A.st.ok) return { p, A: null, block: 1 };
  let B = one(true); if (!B.st.ok) B = one(true, Object.assign({}, p.spec, { act: false, move: null }));
  return { p, A, B, su: A.st.subj.uid };
}
const zones = (G) => { const o = []; for (const s of ["p", "a"]) { for (const z of ["hand", "deck", "dead", "disc"]) for (const c of G[z][s]) o.push([c, z]); for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[s]) o.push([c, "L" + i]); } return o; };

function dyn(id) {
  const R = { x: [], w: [] };
  let S; try { S = sim(id); } catch (e) { R.x.push(["E", 44, "Mô phỏng lỗi: " + (e.message || e)]); return R; }
  const { p, A, B, su } = S;
  if (p.err) R.x.push(["E", 44, "Engine lỗi khi chạy kỹ năng: " + p.err]);
  if (!A) return R;
  if (A.err) R.x.push(["E", 44, "Engine lỗi: " + A.err]);
  const D = B && B.after ? P.diff(A.after, B.after, su) : [];
  const Z = new Map(zones(A.G).map(([c, z]) => [c.uid, [c, z]])), ZB = new Map(zones(B.G).map(([c, z]) => [c.uid, c]));
  const T = p.spec.turn;
  const SKD = new Set(A.evs.filter((e) => (e.k === "skill" || e.k === "act") && e.uid !== su).map((e) => { const f = Z.get(e.uid); return f ? E.ab(f[0]) : null; }).filter(Boolean));
  for (const d of D) {
    if (!d.u) continue; const f = Z.get(d.u); if (!f) continue; const [c] = f, nm = NM(c.id) + (c.side === "a" ? " (địch)" : "");
    /* (10) thẻ mới sinh ra do kỹ năng phải là "thẻ tạo" + có nguồn */
    if (!A.all0.has(c.uid) && /mới xuất hiện/.test(d.w)) { R.c10 = 1;
      if (!c.cr) R.x.push(["E", 10, `Thẻ tạo ra không được đánh dấu "thẻ tạo": ${nm}`]);
      else if (!c.by) R.w.push(["I", 23, `Thẻ tạo ${nm} không ghi thẻ nguồn (c.by)`]);
    }
    /* (1)(23) đổi sức mạnh / năng lượng phải ghi nguồn trong thông tin thẻ */
    const pw = /sức mạnh/.test(d.w), cs = /năng lượng/.test(d.w) && /tay|bộ bài/.test(f[1] === "hand" || f[1] === "deck" ? "tay" : "");
    if ((pw || cs) && A.all0.has(c.uid) && f[1] !== "dead" && f[1] !== "disc") {
      const H = (c.hist || []).filter((h) => h.t >= T && (pw ? h.k === "p" || h.k === "bp" : h.k === "c"));
      const mine = H.filter((h) => h.by === id || h.f === id || h.w || h.by === E.ab(c) && c.uid === su);
      const cb = ZB.get(c.uid), stored = !cb || (pw ? cb.bonus !== c.bonus || cb.bp !== c.bp : cb.cm !== c.cm); /* chỉ xét thay đổi LƯU trên thẻ (không tính Duy Trì động) */
      if (!stored) continue;
      if (!H.length) { if (!/vùng/.test(d.w)) R.w.push(["I", 23, `${nm}: ${pw ? "sức mạnh" : "năng lượng"} đổi nhưng thông tin thẻ không có dòng nguồn (có thể do Duy Trì — tính động)`]); }
      else if (!mine.length) {
        const nmB = (h) => h.by ? (String(h.by).startsWith("L:") ? "chiến địa" : NM(h.by)) : "một hiệu ứng trong trận";
        const txt = `${nm}: ${pw ? "sức mạnh" : "năng lượng"} đổi khi có ${NM(id)} nhưng thông tin thẻ ghi nguồn "${H.map(nmB).join(", ")}"`;
        const generic = H.some((h) => !h.by), loc = H.some((h) => String(h.by || "").startsWith("L:"));
        const viaPlain = H.some((h) => h.by && C[h.by] && C[h.by].t === "none"); /* thẻ KHÔNG kỹ năng (vừa được đặt) bị ghi làm nguồn -> chắc chắn ghi nhầm */
        if (generic) R.x.push(["I", 23, txt + " (chung chung)"]);
        else if (viaPlain) R.x.push(["I", 1, txt + " (kỹ năng bị động/phản ứng ghi nhầm sang thẻ vừa đặt)"]);
        else R.w.push(["I", 1, txt + (loc ? " (cần xem: hiệu ứng chiến địa hay của thẻ?)" : " (có thể là chuỗi hợp lệ: thẻ kia tác động sau — cần xem)")]);
      }
    }
    /* (30)(39) học/chép/cướp kỹ năng phải ghi đã chép thẻ nào */
    if (/kỹ năng/.test(d.w) && c.ab && c.ab !== c.id && !c.abBy) R.x.push(["I", 30, `${nm} mang kỹ năng ${NM(c.ab)} nhưng không có ghi chú nguồn (abBy)`]);
  }
  /* (11) thẻ được đưa xuống sân bằng hiệu ứng phải chạy Lật của nó */
  for (const e of A.evs) {
    const arrive = e.k === "summon" || e.k === "revive" || (e.k === "top" && e.a === "place");
    if (!arrive || (e.src && e.src !== su)) continue;
    const c = (Z.get(e.uid) || [])[0] || null, a = c ? E.ab(c) : e.id; if (!a || !C[a] || !E.REV[a] || C[a].t !== "rev") continue;
    R.c11 = 1; const ran = A.evs.some((x) => (x.k === "skill" || x.k === "blocked") && x.uid === e.uid) || (c && c.sil);
    if (!ran) R.x.push(["E", 11, `${NM(c ? c.id : e.id)} được đưa xuống sân (${e.k}) nhưng kỹ năng Lật không chạy`]);
  }
  /* (21)(23) thẻ đổi chỗ / bị cướp... đã có sự kiện; (6)(29) dấu chờ trên thẻ khác */
  return R;
}

/* ----- nhóm theo chữ kỹ năng (rủi ro tiềm ẩn, cần người xem / làn khác) ----- */
const has = (re, id) => re.test(TX(id));
const inDau = (id) => dau.includes('"' + id + '"') || ui.includes('"' + id + '"');
function stat(id, dy) {
  const d = C[id], t = TX(id), W = [];
  const add = (ln, n, m) => W.push([ln, n, m]);
  if (d.t === "act") add("M", 21, "Thẻ Kích Hoạt: cần dấu hiệu trên bàn ĐÃ / CHƯA kích hoạt (hiện chỉ có nút trong bảng thông tin)");
  if (/đánh dấu|theo dõi|Nhiệm Vụ|lượt sau|lượt tới|thẻ tiếp theo|kế tiếp|tiếp theo bạn đặt|lần tới|sau khi bạn đặt nó/.test(t) && !inDau(id)) add("M", 29, "Có trạng thái chờ / đánh dấu / tiến độ nhưng chưa thấy dấu hiệu riêng (12-dau-hieu / 06 MARKS)");
  if (/^Lật:\s*Nếu|Lật:[^.]*\bnếu\b/.test(t) && !VKD.has(id)) add("M", 43, "Lật có điều kiện: chưa có phát sáng trên tay khi đang thoả điều kiện");
  if (/Rút Nhanh|trên tay|Khi bạn rút|khi được rút|Khi được rút|trở về tay|trở lại tay/.test(t)) add("A", 32, "Kỹ năng chạy khi thẻ nằm trên tay: cần VFX phủ lá trên tay");
  if (/(thẻ trên cùng|trong bộ bài|bộ bài (của )?(bạn|đối thủ))/.test(t) && /sức mạnh|năng lượng|Lấy|Cho/.test(t)) add("A", 2, "Tác động thẻ trong bộ bài: chỉ hiện mặt lưng bộ bài (không lộ lá)");
  if (/(Xáo|Thêm|thêm)[^.]*vào bộ bài/.test(t)) add("I", 3, "Thêm thẻ vào bộ bài: chỉ chủ bộ bài được thấy lá thêm (kiểm ẩn với đối thủ)");
  if (/[Vv]ứt [Bb]ỏ/.test(t)) add("A", 4, "Vứt bỏ / quay lại tay / bay ra sân: làm lại hiệu ứng (demo)");
  if (d.t === "end") add("A", 12, "Cuối Lượt: hiệu ứng theo loại (tăng/giảm chỉ số, năng lượng, đổi kỹ năng, biến đổi)");
  if (/từ tay (của )?bạn (vào|lên|tới)|[Đđ]ặt (một|1|các)? ?thẻ[^.]*từ tay|vào đây\.$/.test(t) && /tay/.test(t)) add("A", 15, "Đặt thẻ từ tay lên sân: VFX lá bay từ tay (bản sao thì giữ lá trên tay)");
  if (/[Dd]ùng (\d+ )?kỹ năng|[Ss]ao chép kỹ năng|[Cc]hép kỹ năng|[Ll]ấy kỹ năng|[Hh]ọc|kỹ năng Lật từ/.test(t)) add("I", 17, "Chạy / chép kỹ năng thẻ khác: VFX của thẻ được dùng + thông tin ghi rõ thẻ nào");
  if (/cho mỗi|mỗi lượt bạn|số lần|chưa dùng|còn năng lượng|đã đặt \d|lượt bạn đã|bị tiêu huỷ \d|\(\d+\/\d+\)|\(\+0\)|\(0 lượt/.test(t)) add("M", 16, "Phụ thuộc bộ đếm (lượt / số lần / năng lượng thừa): cần hiển thị số đếm hiện tại và kiểm đếm đúng");
  if (/\d+% cơ hội|ngẫu nhiên/.test(t)) add("E", 34, "Ngẫu nhiên / tỉ lệ: kiểm tỉ lệ và số lần chọn đúng chữ");
  if (SKILLS.includes(id)) add("E", 25, "Thẻ phép: biến mất sau khi đặt, không nhận tăng/giảm sức mạnh, có thể nhận đổi năng lượng");
  if ((d.t === "react" || /Khi [Bb]ị (Tiêu Huỷ|Vứt Bỏ|tiêu huỷ|vứt bỏ)/.test(t)) && /sức mạnh|năng lượng/.test(t)) add("A", 20, "Khi bị huỷ / vứt bỏ có đổi chỉ số: cần VFX nhận dạng nguồn → mục tiêu");
  if (/[Ll]ấy (\d+ )?sức mạnh|hút|[Hh]ấp thụ|nuốt/.test(t)) add("A", 7, "Lấy sức mạnh: cần VFX riêng dòng sức mạnh chảy về");
  if (!dy.c11 && /[Tt]riệu hồi|[Hh]ồi sinh|[Kk]éo|vào (chiến địa|đây)|[Tt]hêm [^.]*vào (một |mỗi )?chiến địa/.test(t)) add("E", 11, "(gợi ý, chưa kiểm được trên thế cờ) Đưa thẻ xuống sân bằng hiệu ứng: thẻ đó phải chạy kỹ năng như vừa lật");
  if (!dy.c10 && /[Tt]hêm|[Tt]ạo|[Tt]riệu hồi|[Bb]ản sao|[Xx]áo/.test(t)) add("E", 10, "(gợi ý, chưa kiểm được trên thế cờ) Sinh thẻ mới: phải đánh dấu thẻ tạo + nguồn");
  const refs = Object.keys(C).filter((k) => k !== id && NM(k).length > 3 && t.includes(NM(k)));
  if (refs.length) add("E", 27, "Phụ thuộc thẻ khác (" + refs.slice(0, 3).map(NM).join(", ") + "): kiểm khi thẻ kia được tạo / hợp thể / bị chép");
  if (/(di chuyển|Dời Được)/.test(t) && !/không thể di chuyển/.test(t)) add("I", 24, "Có di chuyển: người chơi kéo được tới đúng chiến địa (cả di chuyển bị động / Bà Quay Tơ)");
  return W;
}

const lanesOf = (a) => [...new Set(a.map((x) => x[0]))].sort((p, q) => "EMAI".indexOf(p) - "EMAI".indexOf(q)).join(",");
const rows = [];
const V = JSON.parse(fs.readFileSync("/home/claude/vfx_audit2.json", "utf8"));
const VR = new Map(V.rows.map((r) => [r.id, r]));
for (const id of Object.keys(C)) {
  const d = C[id], dy = dyn(id), st = stat(id, dy), nm = named[id] || [];
  const x = dy.x.slice(), w = dy.w.concat(st);
  for (const [n, ln] of nm) x.push([ln, n, `Người dùng đã báo ở mục ${n} — làn ${ln} đang sửa`]);
  const vr = VR.get(id); if (vr && vr.verdict && vr.verdict !== "ok") w.push(["A", 0, "Bảng Test VFX: " + vr.why]);
  const verdict = x.length ? "✗" : w.filter((q) => q[1] !== 10 && q[1] !== 11 && q[1] !== 27 && q[1] !== 24).length ? "⚠" : "✓";
  const all = x.concat(w);
  rows.push({
    id, ten: NM(id), bac: HN[d.h] || d.h, kieu: E.DANG ? E.DANG[d.t] || d.t : d.t, chu: TX(id),
    nhom: [...new Set(all.map((q) => q[1]).filter(Boolean))].sort((a, b) => a - b).map((n) => "#" + n).join(" "),
    ket_qua: verdict,
    van_de: x.map((q) => "✗ " + q[2]).concat(w.map((q) => "⚠ " + q[2])).join(" | "),
    de_xuat: suggest(all),
    lan: lanesOf(x.length ? x : w) || "",
    mo_phong: vr ? (vr.simDiff || []).slice(0, 3).join("; ") : "",
    da_kiem_dong: [dy.c10 ? "thẻ tạo" : "", dy.c11 ? "đưa xuống sân" : "", "nguồn chỉ số"].filter(Boolean).join(", ")
  });
}
function suggest(a) {
  const S = { 1: "ghi nb()/hist nguồn đúng thẻ gây ra", 2: "diễn mặt lưng bộ bài", 3: "ẩn lá thêm với đối thủ", 4: "làm lại VFX vứt bỏ/quay lại", 7: "VFX hút sức mạnh riêng", 10: "mk() khi G.live / đặt cr+by", 11: "dùng effReveal cho thẻ đưa xuống sân", 12: "VFX Cuối Lượt theo loại", 15: "VFX lá bay từ tay", 16: "huy hiệu đếm trên thẻ + kiểm đếm", 17: "chạy VFX/SIG của thẻ được dùng + ghi thông tin", 20: "VFX nguồn→mục tiêu khi bị huỷ/vứt", 21: "dấu đã/chưa kích hoạt trên thẻ", 23: "ghi nguồn cụ thể (không 'một hiệu ứng trong trận')", 24: "cho kéo tới chiến địa đích", 25: "kiểm luật thẻ phép", 27: "kiểm với thẻ tạo/hợp thể", 29: "dấu hiệu theo dõi to rõ", 30: "ghi chép kỹ năng từ thẻ nào", 32: "VFX phủ lá trên tay", 34: "kiểm tỉ lệ/số lần ngẫu nhiên", 43: "phát sáng trên tay khi thoả điều kiện", 44: "đối chiếu logic với chữ" };
  return [...new Set(a.map((q) => S[q[1]]).filter(Boolean))].slice(0, 4).join("; ");
}
const cols = ["id", "ten", "bac", "kieu", "chu", "nhom", "ket_qua", "van_de", "de_xuat", "lan", "mo_phong", "da_kiem_dong"];
const head = ["id", "tên hiển thị", "bậc", "kiểu", "chữ kỹ năng", "nhóm lỗi (mục)", "kết quả", "mô tả vấn đề", "đề xuất sửa", "làn", "mô phỏng engine (bật/tắt kỹ năng)", "đã kiểm động"];
const q = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
fs.writeFileSync(path.join(OUT, "audit_45.csv"), "\ufeff" + [head.map(q).join(",")].concat(rows.map((r) => cols.map((k) => q(r[k])).join(","))).join("\n"));
const cnt = {}; for (const r of rows) cnt[r.ket_qua] = (cnt[r.ket_qua] || 0) + 1;
const byG = {}; for (const r of rows) for (const g of r.nhom.split(" ").filter(Boolean)) byG[g] = (byG[g] || 0) + 1;
fs.writeFileSync(path.join(OUT, "audit_45.json"), JSON.stringify({ at: new Date().toISOString(), base: "wt/audit", n: rows.length, counts: cnt, byGroup: byG, unmatchedNames: unmatched, rows }, null, 1));
console.log(JSON.stringify(cnt), "unmatched:", unmatched.join(", "));
console.log(JSON.stringify(byG));
for (const r of rows.filter((r) => r.ket_qua === "✗" && !/Người dùng đã báo/.test(r.van_de.split(" | ")[0])).slice(0, 60)) console.log(r.id, "|", r.ten, "|", r.van_de.split(" | ").filter((s) => s.startsWith("✗")).join(" | ").slice(0, 230));
