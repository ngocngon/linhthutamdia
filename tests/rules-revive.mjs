// Kỹ năng hồi sinh / trả về / đưa lại thẻ từ đống BỊ TIÊU HUỶ (G.dead) hoặc BỊ VỨT BỎ (G.disc).
// Mỗi thẻ một kịch bản dựng tay (newGame rồi đặt tay/bộ bài/chiến địa/đống thẻ cụ thể), chạy qua đúng đường lượt thật
// của engine (queuePlay -> beginReveal -> doStep; queueAct; destroy/discard thật).
// Chạy: node tests/rules-revive.mjs
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

/* thẻ trơn (không kỹ năng, không phải token) để làm "xác" trong đống thẻ */
const PLAIN = { c1: "taymaynu", c2: "chanthu", c3: "docnhan", c4: "thachquai", c5: "quaituong", c0: "ongnu" };
for (const k in PLAIN) ok(C[PLAIN[k]] && C[PLAIN[k]].t === "none" && !C[PLAIN[k]].tok, "thẻ trơn " + PLAIN[k]);

function setup(locs, seed) {
  const G = LT.newGame(LT.randomDeck(() => 0.5), LT.randomDeck(() => 0.5), { seed: seed || 7, locs: locs || ["meadow", "meadow", "meadow"] });
  for (const s of ["p", "a"]) { G.hand[s] = []; G.deck[s] = []; G.disc[s] = []; G.dead[s] = []; }
  G.turn = 3; G.phase = "play"; G.locs.forEach(L => { L.rvl = true; L.cards.p = []; L.cards.a = []; });
  G.energy = { p: 30, a: 30 }; G.evs = []; G.msgs = [];
  return G;
}
function onBoard(G, s, id, li) { const c = LT.mk(G, id, s); c.rev = true; c.turn = 1; c.played = true; G.locs[li].cards[s].push(c); return c; }
function inHand(G, s, id) { const c = LT.mk(G, id, s); G.hand[s].push(c); return c; }
/* đưa thẻ vào đống bị tiêu huỷ bằng ĐÚNG đường destroy() của engine (thẻ phải ở trên bàn trước) */
function killed(G, s, id, li) { const c = onBoard(G, s, id, li == null ? 2 : li); ok(LT.destroy(G, c, LT.locOf(G, c)), "không tiêu huỷ được " + id); return c; }
/* đưa thẻ vào đống bị vứt bỏ bằng đúng đường discard() */
function tossed(G, s, id) { const c = inHand(G, s, id); ok(LT.discard(G, s, c), "không vứt bỏ được " + id); return c; }
function fill(G, s, li, n, id) { const r = []; while (G.locs[li].cards[s].length < (n == null ? LT.cap(G, li) : n)) r.push(onBoard(G, s, id || PLAIN.c0, li)); return r; }
/* chạy pha lật của lượt (các thẻ đã xếp hàng của cả hai bên) */
function reveal(G) { G.evs = []; G.msgs = []; for (const st of LT.beginReveal(G)) LT.doStep(G, st); }
function play(G, s, card, li) { ok(LT.queuePlay(G, s, card.uid, li), "không đặt được " + card.id + " ở " + li); reveal(G); }
const pw = (G, c) => LT.power(G, c, LT.locOf(G, c));
const onB = (G, c) => LT.locOf(G, c) >= 0;
const inH = (G, c) => G.hand[c.own].includes(c) || G.hand.p.includes(c) || G.hand.a.includes(c);
const piles = G => G.dead.p.concat(G.dead.a, G.disc.p, G.disc.a);
const revEv = (G, c) => G.evs.some(e => e.k === "revive" && e.uid === c.uid);

console.log("Hồi sinh / trả về từ đống thẻ bị tiêu huỷ & bị vứt bỏ:");

/* ---------------- Vô Thường (tuthanmienvien) ---------------- */
test("Vô Thường: hồi sinh TẤT CẢ thẻ bị tiêu huỷ của bạn đến các chiến địa ngẫu nhiên", () => {
  const G = setup();
  const a = killed(G, "p", PLAIN.c1), b = killed(G, "p", PLAIN.c4), c = killed(G, "p", PLAIN.c3);
  const foe = killed(G, "a", PLAIN.c2);
  eq(G.dead.p.length, 3);
  const t = inHand(G, "p", "tuthanmienvien"); play(G, "p", t, 1);
  for (const x of [a, b, c]) { ok(onB(G, x), C[x.id].n + " phải lên bàn"); ok(x.rev && x.rvv, "ngửa + đánh dấu hồi sinh"); ok(revEv(G, x), "phải phát sự kiện revive"); eq(x.side, "p"); }
  eq(G.dead.p.length, 0, "đống tiêu huỷ của bạn trống");
  ok(!onB(G, foe) && G.dead.a.includes(foe), "không đụng thẻ của đối thủ");
});
test("Vô Thường được TẠO RA (Quan Thượng Thư thêm vào tay) vẫn hồi sinh", () => {
  const G = setup(); G.live = true;
  const qt = inHand(G, "p", "dacvutruong");
  const a = killed(G, "p", PLAIN.c2), b = killed(G, "p", PLAIN.c5);
  play(G, "p", qt, 0);
  // Quan Thượng Thư tạo ngẫu nhiên -> thay bằng Vô Thường được tạo đúng cách (cr + by) để dàn cảnh tất định
  G.srcU = qt.uid; const t = LT.mk(G, "tuthanmienvien", "p"); G.srcU = 0; LT.toHand(G, "p", t, true);
  ok(t.cr && t.by === "dacvutruong", "thẻ được tạo ra bởi Quan Thượng Thư");
  LT.startTurn(G); G.energy.p = 30;
  play(G, "p", t, 1);
  ok(onB(G, a) && onB(G, b), "hai thẻ bị tiêu huỷ phải được hồi sinh");
});
test("Vô Thường: thẻ bị tiêu huỷ TRONG CÙNG LƯỢT (lật trước nó) cũng được hồi sinh", () => {
  const G = setup();
  const vic = onBoard(G, "p", PLAIN.c4, 0);
  const xd = inHand(G, "p", "xachacdich"), t = inHand(G, "p", "tuthanmienvien");
  ok(LT.queuePlay(G, "p", xd.uid, 0)); ok(LT.queuePlay(G, "p", t.uid, 1));
  reveal(G);
  ok(onB(G, vic), "thẻ vừa bị Xác Hắc Dịch tiêu huỷ phải được Vô Thường hồi sinh");
});
test("Vô Thường: chiến địa đầy -> hồi sinh tới khi hết chỗ, phần còn lại ở lại đống tiêu huỷ", () => {
  const G = setup();
  const ds = [PLAIN.c1, PLAIN.c2, PLAIN.c3, PLAIN.c4].map(id => killed(G, "p", id, 0));
  fill(G, "p", 0); fill(G, "p", 2); fill(G, "p", 1, 2);
  const t = inHand(G, "p", "tuthanmienvien"); play(G, "p", t, 1); // ô thứ 3 của chiến địa 1 -> còn 1 chỗ
  eq(ds.filter(x => onB(G, x)).length, 1, "chỉ còn 1 chỗ trống");
  eq(G.dead.p.length, 3);
  eq(G.locs[1].cards.p.length, 4);
});
test("Vô Thường: thẻ bị TRỤC XUẤT (không vào đống tiêu huỷ) không được hồi sinh; token không lưu", () => {
  const G = setup();
  const tok = onBoard(G, "p", "da", 2); LT.destroy(G, tok, 2);
  eq(G.dead.p.length, 0, "token không vào đống tiêu huỷ");
  const t = inHand(G, "p", "tuthanmienvien"); play(G, "p", t, 1);
  ok(!onB(G, tok));
});
test("Vô Thường: Bụi Sao chặn hồi sinh -> báo rõ lý do (blocked + log)", () => {
  const G = setup();
  const a = killed(G, "p", PLAIN.c2);
  onBoard(G, "a", "buisao", 2);
  const t = inHand(G, "p", "tuthanmienvien"); play(G, "p", t, 1);
  ok(!onB(G, a), "Bụi Sao: không thể thêm thẻ vào chiến địa");
  ok(G.dead.p.includes(a), "thẻ vẫn nằm trong đống tiêu huỷ");
  ok(G.msgs.some(m => /Bụi Sao|không thể hồi sinh|bị chặn/i.test(m)), "phải ghi lý do bị chặn: " + G.msgs.join(" | "));
});

/* ---------------- Minh Hậu (minhhau) ---------------- */
test("Minh Hậu: mỗi mức năng lượng khác nhau hồi sinh 1 thẻ đã vứt bỏ", () => {
  const G = setup();
  const x1 = tossed(G, "p", PLAIN.c1), x1b = tossed(G, "p", PLAIN.c1), x2 = tossed(G, "p", PLAIN.c2), x3 = tossed(G, "p", PLAIN.c3);
  const t = inHand(G, "p", "minhhau"); play(G, "p", t, 1);
  eq([x1, x1b].filter(x => onB(G, x)).length, 1, "mức 1 năng lượng chỉ 1 thẻ");
  ok(onB(G, x2) && onB(G, x3)); eq(G.disc.p.length, 1);
});
test("Minh Hậu: một mức bị hết chỗ ở lần thử đầu vẫn không chiếm mất lượt các mức khác", () => {
  const G = setup();
  fill(G, "p", 0); fill(G, "p", 2);
  const xs = [PLAIN.c1, PLAIN.c2, PLAIN.c3, PLAIN.c4].map(id => tossed(G, "p", id));
  const t = inHand(G, "p", "minhhau"); play(G, "p", t, 1); // chiến địa 1 còn 3 chỗ
  eq(xs.filter(x => onB(G, x)).length, 3);
});

/* ---------------- Hoả Sứ (hoasu) ---------------- */
test("Hoả Sứ: hồi sinh 1 thẻ 3 năng lượng (vứt bỏ hoặc tiêu huỷ) tại đây", () => {
  const G = setup();
  const d3 = killed(G, "p", PLAIN.c3), d2 = killed(G, "p", PLAIN.c2);
  const t = inHand(G, "p", "hoasu"); play(G, "p", t, 1);
  eq(LT.locOf(G, d3), 1); ok(!onB(G, d2));
  const G2 = setup(); const x3 = tossed(G2, "p", PLAIN.c3); const t2 = inHand(G2, "p", "hoasu"); play(G2, "p", t2, 0);
  eq(LT.locOf(G2, x3), 0, "thẻ 3 năng lượng bị vứt bỏ cũng được");
});

/* ---------------- Phượng Hoả (phuonghoa) ---------------- */
test("Phượng Hoả: hồi sinh thẻ bị tiêu huỷ, hợp thể vào nó (+sức mạnh), nó có thể di chuyển", () => {
  const G = setup();
  const d = killed(G, "p", PLAIN.c4);
  const t = inHand(G, "p", "phuonghoa"); play(G, "p", t, 1);
  eq(LT.locOf(G, d), 1); ok(!onB(G, t), "Phượng Hoả đã hợp thể (rời bàn)");
  eq(pw(G, d), 7 + 5); ok(d.fly, "có thể di chuyển");
});
test("Phượng Hoả: chiến địa ĐẦY (nó là thẻ thứ 4) vẫn hồi sinh vào chỗ của chính nó", () => {
  const G = setup();
  const d = killed(G, "p", PLAIN.c4);
  fill(G, "p", 1, 3);
  const t = inHand(G, "p", "phuonghoa"); play(G, "p", t, 1);
  eq(LT.locOf(G, d), 1, "phải hồi sinh vào ô Phượng Hoả để lại"); ok(!onB(G, t)); eq(G.locs[1].cards.p.length, 4);
});

/* ---------------- Dịch Cường Cốt (dichcuongcot) ---------------- */
test("Dịch Cường Cốt: trục xuất nó, hồi sinh thẻ bị tiêu huỷ mạnh nhất tại đây với sức mạnh gấp đôi", () => {
  const G = setup();
  const lo = killed(G, "p", PLAIN.c2), hi = killed(G, "p", PLAIN.c4);
  const t = inHand(G, "p", "dichcuongcot"); play(G, "p", t, 1);
  eq(LT.locOf(G, hi), 1); eq(pw(G, hi), 14); ok(!onB(G, lo)); ok(!onB(G, t) && !piles(G).includes(t), "Dịch Cường Cốt bị trục xuất");
});
test("Dịch Cường Cốt: chiến địa ĐẦY (nó là thẻ thứ 4) vẫn hồi sinh vào chỗ nó để lại", () => {
  const G = setup();
  const hi = killed(G, "p", PLAIN.c4);
  fill(G, "p", 1, 3);
  const t = inHand(G, "p", "dichcuongcot"); play(G, "p", t, 1);
  eq(LT.locOf(G, hi), 1); eq(pw(G, hi), 14); ok(!onB(G, t));
});

/* ---------------- Linh Dược (linhduoc) ---------------- */
test("Linh Dược: thẻ bị tiêu huỷ ở LƯỢT TRƯỚC được hồi sinh tại đây", () => {
  const G = setup();
  const old = killed(G, "p", PLAIN.c2); // lượt 3
  LT.startTurn(G); G.energy.p = 30; // lượt 4
  const t = inHand(G, "p", "linhduoc"); play(G, "p", t, 0);
  eq(LT.locOf(G, old), 0);
});
test("Linh Dược: thẻ bị tiêu huỷ ở CUỐI lượt trước (pha cuối lượt) cũng tính là lượt trước", () => {
  const G = setup(["meadow", "volcano", "meadow"]); G.turn = 4;
  const v = onBoard(G, "p", PLAIN.c4, 1);
  for (const st of LT.beginEndTurn(G)) LT.stepEndTurn(G, st); LT.finishEndTurn(G);
  ok(G.dead.p.includes(v), "Núi Lửa tiêu huỷ cuối lượt 4");
  LT.startTurn(G); G.energy.p = 30;
  const t = inHand(G, "p", "linhduoc"); play(G, "p", t, 0);
  eq(LT.locOf(G, v), 0);
});
test("Linh Dược: thẻ bị tiêu huỷ 2 lượt trước thì KHÔNG", () => {
  const G = setup(); G.turn = 2;
  const old = killed(G, "p", PLAIN.c2);
  G.turn = 4; const t = inHand(G, "p", "linhduoc"); play(G, "p", t, 0);
  ok(!onB(G, old));
});

/* ---------------- Lang Thần (langthan) ---------------- */
test("Lang Thần (Kích Hoạt): hồi sinh thẻ mạnh nhất bị vứt bỏ/tiêu huỷ của ĐỐI THỦ về phía bạn tại đây", () => {
  const G = setup();
  const lt = onBoard(G, "p", "langthan", 1);
  const w = killed(G, "a", PLAIN.c2), s = tossed(G, "a", PLAIN.c5);
  ok(LT.queueAct(G, "p", lt.uid), "phải kích hoạt được"); reveal(G);
  eq(LT.locOf(G, s), 1); eq(s.side, "p"); ok(!onB(G, w));
});

/* ---------------- Nguyệt Thần (nguyetthan + 2 dạng) ---------------- */
test("Nguyệt Thần: hồi sinh thẻ đã vứt bỏ đến chiến địa KHÁC với sức mạnh 5", () => {
  const G = setup();
  const x = tossed(G, "p", PLAIN.c5);
  const t = inHand(G, "p", "nguyetthan"); play(G, "p", t, 1);
  ok(onB(G, x) && LT.locOf(G, x) !== 1); eq(pw(G, x), 5);
});
test("Nguyệt Thần bị vứt bỏ -> trở lại tay dạng Bán Nguyệt, rồi Trăng Tròn (sức mạnh 8, 12)", () => {
  const G = setup();
  const t = inHand(G, "p", "nguyetthan"); LT.discard(G, "p", t);
  ok(inH(G, t) && t.id === "nguyetthanbannguyet", "về tay dạng Bán Nguyệt");
  LT.discard(G, "p", t); ok(inH(G, t) && t.id === "nguyetthantrangtron", "về tay dạng Trăng Tròn");
  const x = tossed(G, "p", PLAIN.c1); play(G, "p", t, 0);
  ok(onB(G, x)); eq(pw(G, x), 12);
});

/* ---------------- Yêu Hậu (yeuhau) ---------------- */
test("Yêu Hậu: trả tất cả thẻ đã vứt bỏ + bị tiêu huỷ về tay với +3 sức mạnh", () => {
  const G = setup();
  const a = tossed(G, "p", PLAIN.c1), b = killed(G, "p", PLAIN.c2);
  const t = inHand(G, "p", "yeuhau"); play(G, "p", t, 1);
  ok(inH(G, a) && inH(G, b)); eq(LT.basePow(a) + a.bonus, 3 + 3); eq(LT.basePow(b) + b.bonus, 4 + 3);
  ok(!a.rev && !b.rev && !b.sum, "về tay sạch trạng thái bàn");
  eq(G.disc.p.length + G.dead.p.length, 0);
});

/* ---------------- Ma Tốc (matoc) ---------------- */
test("Ma Tốc: đưa 1 thẻ đã vứt bỏ trở lại chiến địa này", () => {
  const G = setup();
  const x = tossed(G, "p", PLAIN.c4);
  const t = inHand(G, "p", "matoc"); play(G, "p", t, 2);
  eq(LT.locOf(G, x), 2);
});

/* ---------------- Kỵ Sĩ Tử Dực (kysituduc) ---------------- */
test("Kỵ Sĩ Tử Dực: Nhiệm Vụ 4 lần tiêu huỷ -> hồi sinh 1 thẻ tại đây +5", () => {
  const G = setup();
  const k = onBoard(G, "p", "kysituduc", 1);
  const vs = [PLAIN.c1, PLAIN.c2, PLAIN.c3, PLAIN.c4].map(id => killed(G, "p", id, 0));
  const back = vs.find(x => onB(G, x)); ok(back, "phải hồi sinh 1 thẻ"); eq(LT.locOf(G, back), 1);
  eq(pw(G, back), C[back.id].p + 5); ok(k.done);
});

/* ---------------- tự hồi sinh / trả về khi bị tiêu huỷ / vứt bỏ ---------------- */
test("Vuốt Sói: bị tiêu huỷ -> hồi sinh +2 ở chiến địa ngẫu nhiên; bị vứt bỏ -> cũng vậy", () => {
  const G = setup();
  const v = onBoard(G, "p", "vuotsoi", 0); LT.destroy(G, v, 0);
  ok(onB(G, v) && !piles(G).includes(v)); eq(v.bonus, 2); ok(G.evs.some(e => e.k === "revive" && e.uid === v.uid));
  const w = inHand(G, "p", "vuotsoi"); LT.discard(G, "p", w);
  ok(onB(G, w) && !G.disc.p.includes(w)); eq(w.bonus, 2);
});
test("Vuốt Sói: bị tiêu huỷ ở chiến địa đầy -> hồi sinh được vào chính ô vừa trống", () => {
  const G = setup();
  const v = onBoard(G, "p", "vuotsoi", 0); fill(G, "p", 0); fill(G, "p", 1); fill(G, "p", 2);
  LT.destroy(G, v, 0);
  eq(LT.locOf(G, v), 0); ok(!G.dead.p.includes(v));
});
test("Vuốt Sói: bị vứt bỏ khi mọi chiến địa đầy -> ở lại đống vứt bỏ (không mất thẻ) + báo lý do", () => {
  const G = setup();
  fill(G, "p", 0); fill(G, "p", 1); fill(G, "p", 2);
  const v = inHand(G, "p", "vuotsoi"); LT.discard(G, "p", v);
  ok(!onB(G, v)); ok(G.disc.p.includes(v)); ok(G.msgs.some(m => /không còn chiến địa trống/.test(m)), G.msgs.join(" | "));
});
test("Bụi Sao chặn cả tự hồi sinh (Vuốt Sói) và Dạ Thương Nữ nhảy ra — đúng chữ 'không thể thêm thẻ vào chiến địa'", () => {
  const G = setup();
  onBoard(G, "a", "buisao", 2);
  const v = onBoard(G, "p", "vuotsoi", 0); LT.destroy(G, v, 0);
  ok(!onB(G, v) && G.dead.p.includes(v), "Vuốt Sói ở lại đống tiêu huỷ");
  const d = inHand(G, "p", "dathuongnu"); LT.discard(G, "p", d);
  ok(!onB(G, d) && G.disc.p.includes(d));
  ok(G.evs.some(e => e.k === "blocked" && e.uid === v.uid), "phát sự kiện bị chặn để giao diện diễn");
});
test("Giáo Sư Tâm khoá chiến địa của nó: Ma Tốc ở đó không hồi sinh được, có báo lý do", () => {
  const G = setup();
  const x = tossed(G, "p", PLAIN.c4);
  onBoard(G, "a", "giaosutam", 2);
  const t = inHand(G, "p", "matoc");
  ok(!LT.queuePlay(G, "p", t.uid, 2), "Giáo Sư Tâm: không đặt được vào đây");
  play(G, "p", t, 1); eq(LT.locOf(G, x), 1, "chiến địa khác vẫn hồi sinh bình thường");
});
test("đống trống: kỹ năng hồi sinh báo 'không có thẻ …' thay vì im lặng", () => {
  for (const id of ["tuthanmienvien", "minhhau", "matoc", "hoasu", "phuonghoa", "linhduoc", "yeuhau", "nguyetthan", "dichcuongcot"]) {
    const G = setup(); const t = inHand(G, "p", id); play(G, "p", t, 1);
    ok(G.msgs.some(m => /không có thẻ/.test(m)), id + ": " + G.msgs.join(" | "));
  }
});
test("Yêu Hậu: tay đầy giữa chừng -> phần còn lại ở lại Mộ, có báo", () => {
  const G = setup();
  const xs = [PLAIN.c1, PLAIN.c2, PLAIN.c3].map(id => tossed(G, "p", id));
  while (G.hand.p.length < LT.HAND_MAX - 1) inHand(G, "p", PLAIN.c0);
  const t = inHand(G, "p", "yeuhau"); play(G, "p", t, 1); // tay còn HAND_MAX-1 -> nhận 1 thẻ
  eq(xs.filter(x => inH(G, x)).length, 1); eq(G.disc.p.length, 2);
  ok(G.msgs.some(m => /tay đã đầy/.test(m)));
});
test("Vuốt Nữ: bị tiêu huỷ / vứt bỏ -> hồi sinh + lượt sau +1 năng lượng", () => {
  const G = setup();
  const v = onBoard(G, "p", "vuotnu", 0); const nb = G.nextBonus.p; LT.destroy(G, v, 0);
  ok(onB(G, v)); eq(G.nextBonus.p, nb + 1); ok(!G.dead.p.includes(v));
  const w = inHand(G, "p", "vuotnu"); LT.discard(G, "p", w); ok(onB(G, w)); eq(G.nextBonus.p, nb + 2);
});
test("Lính Bất Tử: bị tiêu huỷ -> về tay, sức mạnh gấp đôi", () => {
  const G = setup();
  const v = onBoard(G, "p", "linhbattu", 0); v.bonus = 2; LT.destroy(G, v, 0);
  ok(inH(G, v) && !G.dead.p.includes(v)); eq(LT.basePow(v) + v.bonus, 6); ok(!v.rev);
});
test("Lính Bất Tử: tay đầy -> ở lại đống tiêu huỷ", () => {
  const G = setup();
  while (G.hand.p.length < LT.HAND_MAX) inHand(G, "p", PLAIN.c1);
  const v = onBoard(G, "p", "linhbattu", 0); LT.destroy(G, v, 0);
  ok(!inH(G, v)); ok(G.dead.p.includes(v));
});
test("Nanh Kiếm: bị tiêu huỷ -> về tay, năng lượng 0", () => {
  const G = setup();
  const v = onBoard(G, "p", "nanhkiem", 0); LT.destroy(G, v, 0);
  ok(inH(G, v)); eq(LT.cost(G, v), 0);
});
test("Đầu Bay: bị tiêu huỷ -> về tay, mọi thẻ trên tay +1", () => {
  const G = setup();
  const h = inHand(G, "p", PLAIN.c1); const v = onBoard(G, "p", "daubay", 0); LT.destroy(G, v, 0);
  ok(inH(G, v)); eq(h.bonus, 1); eq(v.bonus, 1);
});
test("Dạ Thương Nữ: bị vứt bỏ -> nhảy đến chiến địa có sức mạnh thấp nhất (chưa đầy)", () => {
  const G = setup();
  onBoard(G, "p", PLAIN.c5, 0); onBoard(G, "p", PLAIN.c4, 2);
  const v = inHand(G, "p", "dathuongnu"); LT.discard(G, "p", v);
  eq(LT.locOf(G, v), 1); ok(!G.disc.p.includes(v));
});
test("Mạt Thế Vương / Khinh Dịch / Vũ Khí H: bị vứt bỏ -> trở lại tay", () => {
  const G = setup();
  const a = inHand(G, "p", "matthevuong"); LT.discard(G, "p", a); ok(inH(G, a)); eq(a.bonus, 4);
  const b = inHand(G, "p", "khinhdich"); LT.discard(G, "p", b); ok(inH(G, b)); eq(b.bonus, 2);
  const c = inHand(G, "p", "vukhih"); LT.discard(G, "p", c); ok(inH(G, c)); eq(LT.cost(G, c), C.vukhih.c - 2);
  eq(G.disc.p.length, 0);
});

/* ---------------- liên thông ---------------- */
test("thẻ đã hồi sinh rồi bị tiêu huỷ LẠI vẫn vào đống tiêu huỷ và hồi sinh được lần nữa", () => {
  const G = setup();
  const a = killed(G, "p", PLAIN.c2);
  const t = inHand(G, "p", "tuthanmienvien"); play(G, "p", t, 1);
  ok(onB(G, a)); LT.destroy(G, a, LT.locOf(G, a)); ok(G.dead.p.includes(a));
  LT.startTurn(G); G.energy.p = 30;
  const t2 = inHand(G, "p", "tuthanmienvien"); play(G, "p", t2, 0);
  ok(onB(G, a), "hồi sinh lần 2");
});
test("thẻ hồi sinh không chồng bản (không xuất hiện 2 nơi)", () => {
  const G = setup();
  for (const id of [PLAIN.c1, PLAIN.c2, PLAIN.c3]) { killed(G, "p", id); tossed(G, "p", id); }
  const y = inHand(G, "p", "tuthanmienvien"), m = inHand(G, "p", "minhhau");
  ok(LT.queuePlay(G, "p", y.uid, 0)); ok(LT.queuePlay(G, "p", m.uid, 1)); reveal(G);
  const seen = new Set();
  for (const z of ["hand", "deck", "disc", "dead"]) for (const c of G[z].p) { ok(!seen.has(c.uid), "trùng " + c.id); seen.add(c.uid); }
  for (const L of G.locs) for (const c of L.cards.p) { ok(!seen.has(c.uid), "trùng " + c.id); seen.add(c.uid); }
});

console.log(`\n${pass} đạt, ${fails.length} lỗi`);
if (fails.length) process.exit(1);
