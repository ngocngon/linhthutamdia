// Luật kéo thẻ xuống chiến địa (chủ game chốt 2026-11-23):
// "Kéo thẻ xuống chiến địa luôn chạy kỹ năng, trừ khi có hiệu ứng cấm thi triển."
// Các kịch bản dựng tay (newGame rồi đặt tay/bộ bài/chiến địa cụ thể), chạy qua đúng đường lật thường của engine.
// Chạy: node tests/rules-pulled.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const LT = require(path.join(here, "..", "www", "js", "01-engine.js"));
const C = LT.C;

let pass = 0; const fails = [];
function test(name, fn) {
  try { fn(); pass++; console.log("  ✓ " + name); }
  catch (e) { fails.push(name); console.error("  ✗ " + name + "\n    " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n    ") : e)); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || "") + " — mong đợi " + JSON.stringify(b) + ", nhận " + JSON.stringify(a)); }
function ok(v, msg) { if (!v) throw new Error(msg || "điều kiện sai"); }

/* dùng đúng id thẻ / chiến địa trong dữ liệu (tên hiển thị trong game có thể đã đổi qua RENAME ở 03-data-store.js) */
const ID = {
  longchu: "longchu", nhenbongdem: "nhenbongdem", matoc: "matoc", batty: "batty", nghichtuvuong: "nghichtuvuong",
  dathoigian: "dathoigian", phaohoanu: "phaohoanu", thuanung: "thuanung", khientuong: "khientuong",
  soinu: "soinu",           // Lật: +2 sức mạnh cho mỗi thẻ khác của bạn tại đây
  dichnu: "dichnu",         // Duy Trì: các thẻ khác của bạn tại đây -2
  choDa: "khuyenduhanh",    // "Chó Đá": Duy Trì: Kỹ năng Lật không chạy tại đây
  kinhAnh: "vonganh",       // "Kính Ảnh": Sau khi đối thủ đặt 1 thẻ Duy Trì tại đây, xoá kỹ năng của nó
  sokhong: "sokhong",       // Lật: xoá kỹ năng của thẻ tiếp theo bạn đặt
  lucac: "da",              // thẻ trơn 0 năng lượng, không kỹ năng
};
for (const k in ID) ok(C[ID[k]], "thiếu thẻ " + ID[k]);
for (const l of ["meadow", "watch", "arena"]) ok(LT.LOC[l], "thiếu chiến địa " + l);

function setup(locs, seed) {
  const G = LT.newGame(LT.randomDeck(() => 0.5), LT.randomDeck(() => 0.5), { seed: seed || 7, locs: locs || ["meadow", "meadow2", "meadow3"].map(() => "meadow") });
  for (const s of ["p", "a"]) { G.hand[s] = []; G.deck[s] = []; G.disc[s] = []; G.dead[s] = []; }
  G.turn = 3; G.phase = "play"; G.locs.forEach(L => { L.rvl = true; L.cards.p = []; L.cards.a = []; });
  G.energy = { p: 30, a: 30 };
  return G;
}
function onBoard(G, s, id, li) { const c = LT.mk(G, id, s); c.rev = true; c.turn = 1; c.played = true; G.locs[li].cards[s].push(c); return c; }
function inHand(G, s, id) { const c = LT.mk(G, id, s); G.hand[s].push(c); return c; }
function inDeckTop(G, s, id) { const c = LT.mk(G, id, s); G.deck[s].push(c); return c; }
/* đặt thẻ từ tay như người chơi rồi chạy pha lật thật (beginReveal + doStep) */
function play(G, s, card, li) {
  ok(LT.queuePlay(G, s, card.uid, li), "không đặt được " + card.id);
  for (const st of LT.beginReveal(G)) LT.doStep(G, st);
}
const pw = (G, c) => LT.power(G, c, LT.locOf(G, c));
const L3 = id => [id, "meadow", "meadow"];

console.log("Luật kéo thẻ xuống chiến địa:");

test("(1) Long Chủ kéo thẻ Lật từ tay -> thẻ đó chạy Lật", () => {
  const G = setup(); G.evs = [];
  const lc = inHand(G, "p", ID.longchu), so = inHand(G, "p", ID.soinu);
  play(G, "p", lc, 0);
  eq(LT.locOf(G, so), 0, "Sói Nữ phải ở chiến địa của Long Chủ");
  ok(so.rev && !so.played, "thẻ được kéo phải ngửa và KHÔNG tính là được đặt");
  eq(pw(G, so), 2 + 2, "Lật của Sói Nữ (+2 cho Long Chủ cạnh nó)");
  ok(G.evs.some(e => e.k === "flip" && e.uid === so.uid && e.eff === 1), "phải phát sự kiện flip (eff) để giao diện diễn lật");
  ok(G.evs.some(e => e.k === "skill" && e.uid === so.uid && e.t === "rev"), "phải phát sự kiện skill của thẻ được kéo");
});

test("(2) Nhện Bóng Đêm kéo thẻ trên cùng bộ bài -> thẻ đó chạy Lật", () => {
  const G = setup();
  onBoard(G, "p", ID.batty, 1); onBoard(G, "p", ID.matoc, 2); // tổng năng lượng các thẻ khác = 4 + 4 = 8
  const nb = inHand(G, "p", ID.nhenbongdem), so = inDeckTop(G, "p", ID.soinu);
  play(G, "p", nb, 0);
  eq(LT.locOf(G, so), 0, "thẻ bộ bài phải vào chiến địa");
  eq(pw(G, so), 8 + 2, "sức mạnh đặt thành 8 rồi Lật của Sói Nữ +2");
});

test("(3) Ma Tốc hồi sinh thẻ đã vứt bỏ -> thẻ hồi sinh chạy Lật", () => {
  const G = setup();
  const so = LT.mk(G, ID.soinu, "p"); G.disc.p.push(so);
  const mt = inHand(G, "p", ID.matoc);
  play(G, "p", mt, 1);
  eq(LT.locOf(G, so), 1); ok(so.rvv, "phải đánh dấu hồi sinh");
  eq(pw(G, so), 2 + 2, "Lật của Sói Nữ sau khi hồi sinh");
});

test("(4) thẻ Duy Trì được kéo xuống có hiệu lực ngay", () => {
  const G = setup();
  const lc = inHand(G, "p", ID.longchu), dn = inHand(G, "p", ID.dichnu);
  play(G, "p", lc, 0);
  eq(LT.locOf(G, dn), 0);
  eq(pw(G, lc), 5 - 2, "Duy Trì của Dịch Nữ trừ 2 Long Chủ");
});

test("(4b) Đấu Trường: Lật của thẻ được kéo chạy 2 lần như thẻ lật thường", () => {
  const G = setup(L3("arena"));
  const lc = inHand(G, "p", ID.longchu), so = inHand(G, "p", ID.soinu);
  play(G, "p", lc, 0);
  eq(pw(G, so), 2 + 2 * 2, "Sói Nữ chạy Lật 2 lần ở Đấu Trường");
});

test("(5a) Chòi Canh (cấm Lật) chặn Lật của thẻ được kéo", () => {
  const G = setup(["meadow", "watch", "meadow"]);
  onBoard(G, "p", ID.lucac, 1);
  const nv = inHand(G, "p", ID.nghichtuvuong), so = inHand(G, "p", ID.soinu);
  play(G, "p", nv, 0); // Nghịch Từ Vương thêm thẻ 3–4 năng lượng từ tay vào các chiến địa khác: chiến địa 1 trước
  eq(LT.locOf(G, so), 1, "Sói Nữ vào Chòi Canh");
  eq(pw(G, so), 2, "Lật bị Chòi Canh chặn");
  ok(G.evs.some(e => e.k === "blocked" && e.uid === so.uid), "phải báo bị chặn");
});

test("(5b) Chó Đá (khuyenduhanh) của đối thủ chặn Lật của thẻ được kéo", () => {
  const G = setup();
  onBoard(G, "p", ID.lucac, 1); onBoard(G, "a", ID.choDa, 1);
  const nv = inHand(G, "p", ID.nghichtuvuong), so = inHand(G, "p", ID.soinu);
  play(G, "p", nv, 0);
  eq(LT.locOf(G, so), 1); eq(pw(G, so), 2, "Lật bị Chó Đá chặn");
});

test("(5b') đối chứng: không có Chó Đá thì cùng kịch bản Lật chạy", () => {
  const G = setup();
  onBoard(G, "p", ID.lucac, 1);
  const nv = inHand(G, "p", ID.nghichtuvuong), so = inHand(G, "p", ID.soinu);
  play(G, "p", nv, 0);
  eq(pw(G, so), 2 + 2);
});

test("(5c) Kính Ảnh xoá kỹ năng thẻ Duy Trì đối thủ được KÉO vào chiến địa của nó", () => {
  const G = setup();
  onBoard(G, "p", ID.kinhAnh, 0);
  const lc = inHand(G, "a", ID.longchu), dn = inHand(G, "a", ID.dichnu);
  play(G, "a", lc, 0);
  eq(LT.locOf(G, dn), 0); eq(dn.side, "a");
  ok(dn.sil, "Dịch Nữ phải mất kỹ năng"); eq(dn.silBy, ID.kinhAnh);
  eq(pw(G, lc), 5, "Duy Trì đã bị xoá nên Long Chủ không bị -2");
});

test("(5c') Kính Ảnh cũng xoá kỹ năng thẻ Duy Trì được TRIỆU HỒI vào (Thuẫn Ưng -> Khiên Tướng)", () => {
  const G = setup();
  onBoard(G, "p", ID.kinhAnh, 1); for (let k = 0; k < 4; k++) onBoard(G, "a", ID.lucac, 2); // chiến địa 2 phía a đầy -> Khiên Tướng phải vào chiến địa 1
  const tu = inHand(G, "a", ID.thuanung);
  play(G, "a", tu, 0);
  const kt = G.locs[1].cards.a.find(c => c.id === ID.khientuong);
  ok(kt, "Khiên Tướng phải xuất hiện ở chiến địa 1"); ok(kt.sil, "Khiên Tướng (Duy Trì) phải bị Kính Ảnh xoá kỹ năng");
});

test("(5c'') Kính Ảnh không đụng thẻ Duy Trì của chính phe mình", () => {
  const G = setup();
  onBoard(G, "p", ID.kinhAnh, 0);
  const lc = inHand(G, "p", ID.longchu), dn = inHand(G, "p", ID.dichnu);
  play(G, "p", lc, 0);
  ok(!dn.sil);
});

test("(5d) thẻ đã bị xoá kỹ năng trên tay vẫn im lặng khi bị kéo xuống", () => {
  const G = setup();
  const lc = inHand(G, "p", ID.longchu), so = inHand(G, "p", ID.soinu); so.sil = true; so.silBy = "dianang";
  play(G, "p", lc, 0);
  eq(LT.locOf(G, so), 0); ok(so.sil); eq(pw(G, so), 2, "không chạy Lật");
});

test("(5e) Bát Tý kéo thẻ từ tay đối thủ về phía HỌ -> Lật chạy cho phe đối thủ", () => {
  const G = setup();
  onBoard(G, "a", ID.lucac, 0);
  const bt = inHand(G, "p", ID.batty), so = inHand(G, "a", ID.soinu);
  play(G, "p", bt, 0);
  eq(LT.locOf(G, so), 0); eq(so.side, "a");
  eq(pw(G, so), 2 + 2, "Sói Nữ đếm thẻ của phe a (1 thẻ) chứ không phải phe p");
});

test("(5f) thẻ được đưa vào KHÔNG ăn 'thẻ tiếp theo bạn đặt' (Thợ Rèn/Số Không) — Rừng Thượng Ngàn cuối lượt 3", () => {
  const G = setup(["thuongngan", "meadow", "meadow"]);
  onBoard(G, "p", ID.lucac, 0);
  const so = inDeckTop(G, "p", ID.soinu);
  G.forge.p = 2; G.zero.p = true; // còn treo từ Thợ Rèn / Số Không
  for (const st of LT.beginEndTurn(G)) LT.stepEndTurn(G, st);
  eq(LT.locOf(G, so), 0, "Rừng Thượng Ngàn đặt thẻ bộ bài vào đây");
  ok(!so.sil, "không bị Số Không xoá kỹ năng"); eq(G.zero.p, true, "Số Không vẫn chờ thẻ đặt từ tay");
  eq(G.forge.p, 2, "+2 của Thợ Rèn vẫn chờ thẻ đặt từ tay");
  eq(pw(G, so), 2 + 2, "Lật của Sói Nữ chạy (+2 cho thẻ cạnh nó), không có +2 Thợ Rèn");
});

test("(6) không lặp vô hạn: chuỗi kéo nhau (Long Chủ / Đá Thời Gian / Pháo Hoa Nữ)", () => {
  const G = setup();
  const lc = inHand(G, "p", ID.longchu);
  for (const id of [ID.dathoigian, ID.longchu, ID.dathoigian, ID.longchu, ID.dathoigian]) inHand(G, "p", id);
  for (let k = 0; k < 8; k++) inDeckTop(G, "p", ID.phaohoanu);
  play(G, "p", lc, 0);
  ok(G.locs[0].cards.p.length <= 4, "không vượt số ô");
  eq(G.edep, undefined, "bộ đếm tầng phải trả về 0 sau chuỗi");
});

test("(6b) giới hạn tầng: thẻ tự triệu hồi bản sao của nó dừng sau EFF_MAX tầng", () => {
  // thẻ giả chỉ dùng trong test: Lật: rời chiến địa rồi triệu hồi một bản sao chính nó tại đây (không có giới hạn ô)
  C.__keovohan = { n: "Thử Kéo Vô Hạn", t: "rev", c: 1, p: 1, h: "KD", x: "test" };
  let runs = 0;
  LT.REV.__keovohan = (G, i, li) => { runs++; const a = G.locs[li].cards[i.side]; a.splice(a.indexOf(i), 1); LT.summon(G, i.side, "__keovohan", li); };
  try {
    const G = setup();
    const t = inHand(G, "p", "__keovohan");
    play(G, "p", t, 0);
    ok(runs >= 2 && runs <= 8, "số lần chạy phải hữu hạn, nhận " + runs);
    eq(G.locs[0].cards.p.length, 1, "còn đúng 1 bản sao cuối (ngửa, không chạy Lật)");
    ok(G.locs[0].cards.p[0].rev);
    eq(G.edep, undefined);
  } finally { delete C.__keovohan; delete LT.REV.__keovohan; }
});

test("(7) thẻ úp (Vua Tiên Hắc) vẫn úp đến cuối ván", () => {
  const G = setup();
  const vt = inHand(G, "p", "vuatienhac"), so = inDeckTop(G, "p", ID.soinu); void so;
  play(G, "p", vt, 0);
  const h = G.locs[0].cards.p.find(c => c.id === ID.soinu);
  ok(h && h.hid && !h.rev, "thẻ úp không lật ngay");
});

test("(8) tất định: cùng seed -> cùng kết quả (lockstep online)", () => {
  const run = () => { const G = setup(null, 99); const lc = inHand(G, "p", ID.longchu); for (const id of [ID.soinu, ID.dichnu, ID.dathoigian]) inHand(G, "p", id); for (let k = 0; k < 4; k++) inDeckTop(G, "p", ID.phaohoanu); play(G, "p", lc, 0); return JSON.stringify(G.locs.map(L => L.cards.p.map(c => c.id + ":" + c.bonus))) + G.rs; };
  eq(run(), run());
});

console.log("\nNăng lượng thẻ trên tay / thẻ trên cùng bộ bài (gpu29):");

test("(9) Lãnh Diện Cự Nhân: MỖI người chơi giảm 1 năng lượng ngẫu nhiên, lặp lại theo số mức năng lượng khác nhau trên bàn", () => {
  let multi = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const G = setup(null, seed); G.evs = [];
    for (const s of ["p", "a"]) { for (const id of ["vohannhan", "cuthubien", "tuvuong", "conhan"]) inHand(G, s, id); onBoard(G, s, "soc", 0); onBoard(G, s, "conhan", 0); onBoard(G, s, "thuyvuong", 2); }
    const base = new Map(); for (const s of ["p", "a"]) for (const c of G.hand[s]) base.set(c.uid, LT.cost(G, c));
    const cx = inHand(G, "p", "cuongnhanxam"); play(G, "p", cx, 1);
    // bên p: bàn có các mức 1,3,4,5 (Lãnh Diện Cự Nhân) = 4 mức; bên a: 1,3,4 = 3 mức
    for (const [s, n] of [["p", 4], ["a", 3]]) {
      let tot = 0, hit = 0; for (const c of G.hand[s]) { if (!base.has(c.uid)) continue; const d = base.get(c.uid) - LT.cost(G, c); ok(d >= 0, "không được tăng năng lượng"); tot += d; if (d) hit++; }
      eq(tot, n, "tổng năng lượng giảm của bên " + s);
      eq(hit, Math.min(n, 4), "mỗi lần giảm rơi vào một thẻ khác nhau (tay có 4 thẻ) — bên " + s);
      if (hit > 1) multi++;
    }
  }
  ok(multi > 0, "phải có lượt giảm rơi vào nhiều thẻ khác nhau (không dồn hết vào 1 thẻ)");
});

test("(10) thẻ tác động lá trên cùng bộ bài phát sự kiện 'top' đúng lá (Bạch Thể / Xạ Thủ Nỏ / Nàng Tấm / Thuỷ Thân)", () => {
  { const G = setup(); G.evs = []; inDeckTop(G, "p", "ho"); const t = inDeckTop(G, "p", "vohannhan"); const b = inHand(G, "p", "bachdich"); play(G, "p", b, 0);
    const e = G.evs.find(x => x.k === "top"); ok(e, "Bạch Thể phải phát sự kiện top"); eq(e.uid, t.uid); eq(e.a, "set"); eq(e.c0, 6); eq(e.c1, 0); eq(e.p1, 0); eq(LT.cost(G, t), 0); }
  { const G = setup(); G.evs = []; const t = inDeckTop(G, "p", "vohannhan"); const b = inHand(G, "p", "tieuthu"); play(G, "p", b, 0);
    const e = G.evs.find(x => x.k === "top"); ok(e && e.a === "exile" && e.uid === t.uid && e.c1 === null, "Xạ Thủ Nỏ trục xuất đúng lá trên cùng"); ok(!G.deck.p.includes(t)); }
  { const G = setup(); G.evs = []; const t = inDeckTop(G, "p", "ho"); const b = inHand(G, "p", "tinhquyennu"); play(G, "p", b, 0);
    const e = G.evs.find(x => x.k === "top"); ok(e && e.a === "buff" && e.p1 - e.p0 === 3, "Nàng Tấm +3 lá trên cùng"); eq(t.bonus, 3); }
  { const G = setup(); G.evs = []; const tp = inDeckTop(G, "p", "ho"), ta = inDeckTop(G, "a", "vohannhan"); const b = inHand(G, "p", "thuynhan"); play(G, "p", b, 0);
    const es = G.evs.filter(x => x.k === "top"); eq(es.length, 2, "Thuỷ Thân tác động lá trên cùng của CẢ HAI bộ bài"); eq(LT.cost(G, tp), 1); eq(LT.cost(G, ta), 1); }
});

console.log(`\n${pass} đạt, ${fails.length} lỗi`);
if (fails.length) process.exit(1);
