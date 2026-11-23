// Hoàn tác trong lượt theo NGĂN XẾP: chỉ hành động xếp hàng mới nhất (đặt / dời / kích hoạt) được rút lại.
// Chạy: node tests/rules-undo.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const LT = require(path.join(here, "..", "www", "js", "01-engine.js"));

let pass = 0; const fails = [];
function test(name, fn) {
  try { fn(); pass++; console.log("  ✓ " + name); }
  catch (e) { fails.push(name); console.error("  ✗ " + name + "\n    " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n    ") : e)); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || "") + " — mong đợi " + JSON.stringify(b) + ", nhận " + JSON.stringify(a)); }
function ok(v, msg) { if (!v) throw new Error(msg || "điều kiện sai"); }
function setup() {
  const G = LT.newGame(LT.randomDeck(() => 0.5), LT.randomDeck(() => 0.5), { seed: 5, locs: ["meadow", "meadow", "meadow"] });
  for (const s of ["p", "a"]) { G.hand[s] = []; G.deck[s] = []; }
  G.turn = 3; G.phase = "play"; G.locs.forEach(L => { L.rvl = true; L.cards.p = []; L.cards.a = []; });
  G.energy = { p: 10, a: 10 };
  return G;
}
const inHand = (G, id) => { const c = LT.mk(G, id, "p"); G.hand.p.push(c); return c; };
const onBoard = (G, id, li) => { const c = LT.mk(G, id, "p"); c.rev = true; c.turn = 1; c.played = true; G.locs[li].cards.p.push(c); return c; };

console.log("Hoàn tác theo ngăn xếp:");
test("đặt 3 thẻ: chỉ rút được thẻ thứ 3, rồi 2, rồi 1 (năng lượng + vị trí trên tay trả đúng)", () => {
  const G = setup();
  const a = inHand(G, "taymaynu"), b = inHand(G, "chanthu"), c = inHand(G, "docnhan"), d = inHand(G, "ongnu");
  const hand0 = G.hand.p.map(x => x.uid).join();
  ok(LT.queuePlay(G, "p", b.uid, 0)); ok(LT.queuePlay(G, "p", a.uid, 1)); ok(LT.queuePlay(G, "p", c.uid, 2));
  eq(G.energy.p, 10 - 2 - 1 - 3);
  ok(!LT.canUnqueue(G, "p", b.uid, "play") && !LT.unqueue(G, "p", b.uid, "play"), "thẻ đặt đầu tiên bị khoá");
  ok(!LT.unqueue(G, "p", a.uid, "play"), "thẻ đặt thứ 2 bị khoá");
  eq(G.q.p.length, 3, "rút sai thứ tự không đổi gì");
  ok(LT.unqueue(G, "p", c.uid, "play")); ok(LT.unqueue(G, "p", a.uid, "play")); ok(LT.unqueue(G, "p", b.uid, "play"));
  eq(G.energy.p, 10); eq(G.hand.p.map(x => x.uid).join(), hand0, "tay trở lại đúng thứ tự cũ"); void d;
});
test("dời thẻ / kích hoạt cũng theo ngăn xếp, undoLast rút đúng hành động cuối", () => {
  const G = setup();
  const mv = onBoard(G, "huyenco", 0), x = inHand(G, "taymaynu");
  ok(LT.queueMove(G, "p", mv.uid, 1), "Huyền Cơ dời được");
  ok(LT.queuePlay(G, "p", x.uid, 2));
  ok(!LT.unqueue(G, "p", mv.uid, "move"), "lần dời (cũ hơn) bị khoá");
  eq(LT.lastQueued(G, "p").uid, x.uid);
  eq(LT.undoLast(G, "p").uid, x.uid); eq(LT.undoLast(G, "p").uid, mv.uid); eq(LT.undoLast(G, "p"), null);
  ok(G.hand.p.includes(x)); eq(G.energy.p, 10);
});
test("rút xong rồi đặt lại ở chỗ khác vẫn hợp lệ (đổi chỗ thẻ đặt sau cùng)", () => {
  const G = setup();
  const a = inHand(G, "taymaynu"), b = inHand(G, "chanthu");
  ok(LT.queuePlay(G, "p", a.uid, 0)); ok(LT.queuePlay(G, "p", b.uid, 0));
  ok(LT.unqueue(G, "p", b.uid, "play")); ok(LT.queuePlay(G, "p", b.uid, 2));
  for (const st of LT.beginReveal(G)) LT.doStep(G, st);
  eq(LT.locOf(G, a), 0); eq(LT.locOf(G, b), 2);
});
test("online: danh sách hành động nộp (giống myActs) áp lại trên bản sao cho cùng kết quả sau khi hoàn tác", () => {
  const G = setup();
  const a = inHand(G, "taymaynu"), b = inHand(G, "chanthu"), c = inHand(G, "docnhan");
  LT.queuePlay(G, "p", a.uid, 0); LT.queuePlay(G, "p", b.uid, 1); LT.queuePlay(G, "p", c.uid, 2);
  LT.undoLast(G, "p"); LT.queuePlay(G, "p", c.uid, 0);
  const acts = G.q.p.map(x => ({ t: x.t, u: x.uid, l: x.li }));
  const H = LT.clone(G); for (const x of H.q.p.slice().reverse()) LT.unqueue(H, "p", x.uid, x.t);
  eq(H.q.p.length, 0, "hoàn tác hết theo thứ tự ngược"); eq(H.energy.p, 10);
  for (const x of acts) ok(LT.queuePlay(H, "p", x.u, x.l), "áp lại " + x.u);
  eq(JSON.stringify(H.q.p.map(x => [x.uid, x.li])), JSON.stringify(G.q.p.map(x => [x.uid, x.li]))); eq(H.energy.p, G.energy.p);
});
console.log(`\n${pass} đạt, ${fails.length} lỗi`);
if (fails.length) process.exit(1);
