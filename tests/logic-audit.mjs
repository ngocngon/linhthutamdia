// gpu68 — Kiểm logic "thẻ đưa/kéo/dời 1 thẻ rồi tác động lên CHÍNH thẻ đó" (lỗi 9: Lôi Đài Chủ kéo thẻ rồi huỷ nhầm thẻ khác).
// Phần A (node, nhanh): kịch bản dựng tay cho từng thẻ đã sửa — đúng thẻ bị tác động trong trạng thái engine + sự kiện mang đúng uid/li/ix.
// Phần B (trình duyệt): màn diễn tiêu huỷ / kỹ năng nhắm đúng lá (data-mc uid) hoặc đúng Ô TRỐNG nơi thẻ bị kéo đã đứng.
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/logic-audit.mjs   (LA_NO_BROWSER=1: chỉ phần A)
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const LT = require(path.join(www, "js", "01-engine.js"));
const C = LT.C;

let pass = 0; const fails = [];
function test(name, fn) {
  try { fn(); pass++; console.log("  ✓ " + name); }
  catch (e) { fails.push(name); console.error("  ✗ " + name + "\n    " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n    ") : e)); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || "") + " — mong đợi " + JSON.stringify(b) + ", nhận " + JSON.stringify(a)); }
function ok(v, msg) { if (!v) throw new Error(msg || "điều kiện sai"); }
for (const id of ["giacdausi", "kychu", "soinu", "lucthan", "nhennhan", "naomay", "hongve", "nghithuctrieuhoiiii", "hacdiemchua", "buisao", "da", "cuongnhan", "thachquai"]) ok(C[id], "thiếu thẻ " + id);

function setup(seed) {
  const G = LT.newGame(LT.randomDeck(() => 0.5), LT.randomDeck(() => 0.5), { seed: seed || 7, locs: ["meadow", "meadow", "meadow"] });
  for (const s of ["p", "a"]) { G.hand[s] = []; G.deck[s] = []; G.disc[s] = []; G.dead[s] = []; }
  G.turn = 3; G.phase = "play"; G.locs.forEach(L => { L.rvl = true; L.cards.p = []; L.cards.a = []; });
  G.energy = { p: 30, a: 30 }; G.evs = [];
  return G;
}
function onBoard(G, s, id, li, bonus) { const c = LT.mk(G, id, s); c.rev = true; c.turn = 1; c.played = true; if (bonus) c.bonus = bonus; G.locs[li].cards[s].push(c); return c; }
function inHand(G, s, id) { const c = LT.mk(G, id, s); G.hand[s].push(c); return c; }
function inDeck(G, s, id) { const c = LT.mk(G, id, s); G.deck[s].push(c); return c; }
function play(G, s, card, li) { ok(LT.queuePlay(G, s, card.uid, li), "không đặt được " + card.id); for (const st of LT.beginReveal(G)) LT.doStep(G, st); }
const pw = (G, c) => LT.power(G, c, LT.locOf(G, c));
const evsOf = (G, k) => G.evs.filter(e => e.k === k);

console.log("A. Engine — đúng thẻ bị tác động:");

test("giacdausi: kéo thẻ yếu hơn -> tiêu huỷ ĐÚNG thẻ bị kéo, sự kiện mang li/ix/side/id; thẻ khác trên bàn nguyên vẹn", () => {
  for (let seed = 1; seed <= 12; seed++) {
    const G = setup(seed);
    const f0 = onBoard(G, "a", "thachquai", 0), f1 = onBoard(G, "a", "thachquai", 1), f2 = onBoard(G, "a", "thachquai", 0);
    const pulled = inDeck(G, "a", "da");
    const g = inHand(G, "p", "giacdausi");
    play(G, "p", g, 0);
    const ds = evsOf(G, "destroy");
    eq(ds.length, 1, "đúng 1 thẻ bị tiêu huỷ");
    eq(ds[0].uid, pulled.uid, "thẻ bị tiêu huỷ phải là thẻ bị kéo");
    eq(ds[0].li, 0, "li của sự kiện tiêu huỷ"); eq(ds[0].side, "a", "phe"); eq(ds[0].ix, 2, "ô thứ 3 (sau 2 thẻ địch có sẵn)"); eq(ds[0].id, "da", "id");
    const sm = evsOf(G, "summon").find(e => e.uid === pulled.uid);
    ok(sm && sm.li === 0 && sm.ix === 2 && sm.side === "a" && sm.src === g.uid, "sự kiện kéo thẻ mang li/ix/side/src: " + JSON.stringify(sm));
    for (const c of [f0, f1, f2]) ok(LT.locOf(G, c) >= 0, "thẻ " + c.uid + " không được bị huỷ");
    eq(LT.locOf(G, pulled), -1, "thẻ bị kéo đã rời bàn");
  }
});

test("giacdausi: kéo thẻ mạnh hơn -> không huỷ gì, thẻ bị kéo đứng phía đối thủ", () => {
  const G = setup(); onBoard(G, "a", "thachquai", 1);
  const big = inDeck(G, "a", "cuongnhan"), g = inHand(G, "p", "giacdausi");
  play(G, "p", g, 1);
  eq(evsOf(G, "destroy").length, 0, "không có thẻ nào bị huỷ");
  eq(LT.locOf(G, big), 1); eq(big.side, "a");
});

test("giacdausi: thẻ bị kéo tự dời đi (Nhện Nhân) -> so & huỷ đúng thẻ đó tại NƠI MỚI, không huỷ thẻ nào khác", () => {
  let moved = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const G = setup(seed);
    const others = [onBoard(G, "a", "thachquai", 1), onBoard(G, "a", "thachquai", 2), onBoard(G, "p", "da", 0)];
    const nn = inDeck(G, "a", "nhennhan"), g = inHand(G, "p", "giacdausi");
    play(G, "p", g, 0);
    const ds = evsOf(G, "destroy");
    ok(ds.every(e => e.uid === nn.uid), "chỉ được huỷ thẻ bị kéo: " + JSON.stringify(ds));
    for (const c of others) ok(LT.locOf(G, c) >= 0, "thẻ khác bị huỷ nhầm");
    const fromMv = G.evs.some(e => e.k === "move" && e.uid === nn.uid);
    if (fromMv) { moved++; ok(ds.length === 1 && ds[0].li !== 0, "Nhện Nhân đã dời đi nên phải bị huỷ ở chiến địa mới: " + JSON.stringify(ds)); }
    else if (LT.locOf(G, nn) >= 0) ok(pw(G, nn) >= pw(G, g), "thẻ bị kéo còn lại phải không yếu hơn");
  }
  ok(moved > 0, "kịch bản phải có lần Nhện Nhân dời đi");
});

test("kychu: thẻ được dời bị Lực Thần dời tiếp -> Lật chạy lại tại nơi nó đứng thật + sự kiện skill đúng uid", () => {
  for (let seed = 1; seed <= 8; seed++) {
    const G = setup(seed);
    const so = onBoard(G, "p", "soinu", 0); onBoard(G, "p", "lucthan", 1); onBoard(G, "p", "da", 2); onBoard(G, "p", "da", 2);
    const k = inHand(G, "p", "kychu"); const b0 = so.bonus;
    play(G, "p", k, 0);
    const at = LT.locOf(G, so); ok(at === 0 || at === 2, "Lực Thần phải dời Sói Nữ khỏi giữa, đang ở " + at);
    const mine = G.locs[at].cards.p.filter(c => c !== so && c.rev).length;
    eq(so.bonus - b0, 2 * mine, "Sói Nữ +2 cho mỗi thẻ khác tại nơi nó đứng (" + at + ")");
    const sk = G.evs.find(e => e.k === "skill" && e.uid === so.uid && e.t === "rev");
    ok(sk, "phải có sự kiện skill của Sói Nữ để diễn đúng lá");
  }
});

test("nhennhan: thẻ địch bị kéo tới ĐÚNG nơi Nhện Nhân đang đứng (kể cả khi bị Lực Thần dời tiếp)", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const G = setup(seed);
    onBoard(G, "p", "lucthan", 1); const t = onBoard(G, "a", "thachquai", 0);
    const n = inHand(G, "p", "nhennhan");
    play(G, "p", n, 0);
    const nl = LT.locOf(G, n), tl = LT.locOf(G, t);
    if (nl === 0) eq(tl, 0, "Nhện Nhân quay về chỗ cũ thì thẻ địch không đi");
    else eq(tl, nl, "thẻ địch phải ở cùng chiến địa với Nhện Nhân");
  }
});

test("naomay: bản sao 'bay ra' từ đúng thẻ bị huỷ (clone.from = uid thẻ đó), không phát sự kiện cho bản chụp ẩn", () => {
  const G = setup(); const t = onBoard(G, "p", "thachquai", 0, 3);
  const n = inHand(G, "p", "naomay");
  play(G, "p", n, 0);
  ok(evsOf(G, "destroy").some(e => e.uid === t.uid), "thẻ bị huỷ");
  const cl = evsOf(G, "clone");
  eq(cl.length, 2, "2 bản sao ở 2 chiến địa khác");
  for (const e of cl) { eq(e.from, t.uid, "nguồn bản sao"); ok(LT.locOf(G, LT.find(G, e.uid).inst) >= 0, "bản sao nằm trên bàn"); }
  for (const l of [1, 2]) { const c = G.locs[l].cards.p[0]; ok(c && c.id === "thachquai" && c.bonus === 3, "bản sao giữ sức mạnh cộng thêm"); }
});

test("hongve: xoá kỹ năng -> sự kiện 'sil' (bộ theo dõi engine) đúng uid thẻ bị nhắm", () => {
  const G = setup(); const lo = onBoard(G, "a", "soinu", 2), hi = onBoard(G, "a", "cuongnhan", 2);
  const h = inHand(G, "p", "hongve");
  play(G, "p", h, 2);
  ok(lo.sil && !hi.sil, "thẻ yếu nhất mất kỹ năng");
  const s = evsOf(G, "sil"); ok(s.length === 1 && s[0].uid === lo.uid, JSON.stringify(s));
});

test("nghithuctrieuhoiiii: không triệu hồi được (Bụi Sao) + tay đầy -> Hắc Diệm Chúa không vượt giới hạn tay", () => {
  const G = setup(); onBoard(G, "p", "da", 1); onBoard(G, "p", "da", 1); onBoard(G, "a", "buisao", 2);
  const dm = inDeck(G, "p", "hacdiemchua");
  const n = inHand(G, "p", "nghithuctrieuhoiiii"); for (let k = 0; k < LT.HAND_MAX - 1; k++) inHand(G, "p", "da");
  play(G, "p", n, 1);
  ok(G.hand.p.length <= LT.HAND_MAX, "tay vượt giới hạn: " + G.hand.p.length);
  eq(LT.locOf(G, dm), -1, "Bụi Sao cấm thêm thẻ");
  ok(G.hand.p.includes(dm) || G.deck.p.includes(dm), "Hắc Diệm Chúa vẫn còn (tay hoặc bộ bài)");
});

test("bất biến: mọi sự kiện destroy có li/ix khớp vị trí thẻ ngay trước khi huỷ (200 ván ngẫu nhiên)", () => {
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R0 = Math.random; let n = 0;
  try {
    for (let g = 0; g < 200; g++) {
      const seed = 70000 + g, r = mulberry(seed); Math.random = mulberry(seed ^ 99);
      const G = LT.newGame(LT.randomDeck(r), LT.randomDeck(r), { seed });
      for (let t = 0; t < 20 && G.phase !== "over"; t++) {
        LT.startTurn(G); for (const s of ["p", "a"]) LT.aiPlan(G, s, 8);
        for (const st of LT.beginReveal(G)) {
          G.evs = []; LT.doStep(G, st);
          for (const e of G.evs) if (e.k === "destroy") { n++; ok(e.li >= 0 && e.li <= 2 && e.ix >= 0 && (e.side === "p" || e.side === "a") && C[e.id], "destroy thiếu li/ix/side/id: " + JSON.stringify(e)); }
        }
        G.evs = null; LT.endTurn(G);
        if (G.phase !== "over" && G.turn >= LT.turns(G)) LT.finish(G, "end");
      }
    }
  } finally { Math.random = R0; }
  ok(n > 50, "quá ít sự kiện huỷ để kiểm: " + n);
});

/* ---------------- A2. gpu68-audit2: kỹ năng có tác dụng phải phát sự kiện để giao diện diễn được + lỗi logic đã sửa ---------------- */
console.log("A2. Kỹ năng có tác dụng -> có sự kiện cho giao diện (gpu68-audit2):");
function nextTurn(G) { G.q = { p: [], a: [] }; for (const st of LT.beginEndTurn(G)) LT.stepEndTurn(G, st); LT.finishEndTurn(G); G.evs = []; LT.startTurn(G); return G.evs; }
test("Nụ Hôn Độc bị xoá kỹ năng thì KHÔNG tự huỷ khi phía đầy; còn kỹ năng thì tự huỷ", () => {
  for (const sil of [false, true]) {
    const G = setup(); const n = onBoard(G, "p", "nuhondoc", 1); if (sil) n.sil = true;
    onBoard(G, "p", "taymaynu", 1); onBoard(G, "p", "taymaynu", 1);
    play(G, "p", inHand(G, "p", "chanthu"), 1);
    eq(LT.locOf(G, n) >= 0, sil, sil ? "bị xoá kỹ năng: còn trên bàn" : "còn kỹ năng: tự huỷ");
  }
});
test("Khối Băng / Nhện Thượng Đẳng / Loạn Xạ: năng lượng Đầu Lượt phát egain mang uid thẻ nguồn (không còn 'skill' giả của Loạn Xạ)", () => {
  const G = setup(); G.turn = 2; const kb = onBoard(G, "p", "khoibang", 0), nt = onBoard(G, "p", "nhenthuongdang", 1); onBoard(G, "p", "taymaynu", 1, 2);
  const lx = onBoard(G, "a", "loanxa", 2); G.nextBonus.p = 2;
  const evs = nextTurn(G), eg = evs.filter(e => e.k === "egain");
  ok(eg.some(e => e.uid === kb.uid && e.side === "p" && e.n === 1), "egain Khối Băng " + JSON.stringify(eg));
  ok(eg.some(e => e.uid === nt.uid && e.side === "p"), "egain Nhện Thượng Đẳng");
  ok(eg.some(e => e.uid === lx.uid && e.side === "a" && e.from === "p"), "egain Loạn Xạ lấy từ đối thủ");
  ok(!evs.some(e => e.k === "skill" && e.uid === lx.uid), "Loạn Xạ không phát 'skill' Đầu Lượt (giao diện từng vẽ +N năng lượng sai bằng cả lượng hồi đầu lượt)");
});
test("Huyễn Cơ Nữ đang thắng: +1 cho mọi thẻ trên tay -> sự kiện hbuff kê đúng các lá", () => {
  const G = setup(); G.turn = 2; const h = onBoard(G, "p", "huyenconu", 1); onBoard(G, "p", "cuongnhan", 1); onBoard(G, "a", "taymaynu", 1);
  const a = inHand(G, "p", "chanthu"), b = inHand(G, "p", "docnhan");
  const evs = nextTurn(G), hb = evs.find(e => e.k === "hbuff");
  ok(hb && hb.uid === h.uid && hb.us.includes(a.uid) && hb.us.includes(b.uid), "hbuff " + JSON.stringify(hb)); eq(a.bonus, 1, "lá trên tay +1");
});
test("Ẩn Nữ: thẻ đặt tại đây bị giấu -> sự kiện hide (uid lá, src Ẩn Nữ)", () => {
  const G = setup(); const an = onBoard(G, "p", "annu", 1), c = inHand(G, "p", "chanthu");
  play(G, "p", c, 1);
  const e = evsOf(G, "hide")[0]; ok(e && e.uid === c.uid && e.src === an.uid && e.li === 1, "hide " + JSON.stringify(G.evs)); eq(c.rev, false, "lá còn úp");
});
test("Heo Nhện (Kích Hoạt) / Dực Long Nhân: xoá kỹ năng lá trên tay đối thủ / trong bộ bài -> sự kiện sil có đích (hand/deck)", () => {
  const G = setup(); const hn = onBoard(G, "p", "heonhen", 1); const t = inHand(G, "a", "thoren");
  ok(LT.queueAct(G, "p", hn.uid), "kích hoạt được"); for (const st of LT.beginReveal(G)) LT.doStep(G, st);
  const s1 = evsOf(G, "sil").find(e => e.uid === t.uid); ok(s1 && s1.src === hn.uid && s1.hand && t.sil, "sil Heo Nhện " + JSON.stringify(G.evs));
  const G2 = setup(); const d1 = inDeck(G2, "p", "kiengiap"), d2 = inDeck(G2, "p", "taymaynu");
  play(G2, "p", inHand(G2, "p", "duclongnhan"), 0);
  ok(evsOf(G2, "sil").some(e => e.uid === d1.uid && e.deck) && d1.sil && !d2.sil, "sil Dực Long Nhân chỉ lá Duy Trì trong bộ bài");
});
test("Khuyển Dịch Chuyển: lá đặt sau Kích Hoạt đổi với bộ bài -> sự kiện lockswap (lá cũ, lá mới, nguồn)", () => {
  const G = setup(); const kd = onBoard(G, "p", "khuyendichchuyen", 1); inDeck(G, "p", "docnhan");
  ok(LT.queueAct(G, "p", kd.uid)); const c = inHand(G, "p", "chanthu"); ok(LT.queuePlay(G, "p", c.uid, 0));
  for (const st of LT.beginReveal(G)) LT.doStep(G, st);
  const e = evsOf(G, "lockswap")[0]; ok(e && e.old === c.uid && e.by === kd.uid && e.li === 0, "lockswap " + JSON.stringify(G.evs)); ok(G.deck.p.includes(c), "lá cũ về bộ bài");
});
test("Thạch Lực Nữ: thẻ 1 và 6 năng lượng của bạn không bị tiêu huỷ (Xác Máy)", () => {
  const G = setup(); onBoard(G, "p", "thachlucnu", 0); const a = onBoard(G, "p", "taymaynu", 1), b = onBoard(G, "p", "cuongnhan", 1), c = onBoard(G, "p", "chanthu", 1);
  play(G, "p", inHand(G, "p", "xacmay"), 1);
  ok(LT.locOf(G, a) === 1 && LT.locOf(G, b) === 1 && LT.locOf(G, c) < 0, "chỉ thẻ 2 năng lượng bị huỷ");
});
test("Linh Môi Sư (tamlinhtu): Kích Hoạt rồi đặt thẻ -> thẻ đó bị huỷ, Linh Môi Sư nhận ĐÚNG sức mạnh, sự kiện destroy.src + absorb; hết hạn cuối lượt", () => {
  const G = setup(); const t = onBoard(G, "p", "tamlinhtu", 0); const c = inHand(G, "p", "thachquai");
  ok(LT.queueAct(G, "p", t.uid)); ok(LT.queuePlay(G, "p", c.uid, 1)); for (const st of LT.beginReveal(G)) LT.doStep(G, st);
  eq(LT.locOf(G, c), -1, "thẻ bị nuốt"); eq(pw(G, t), 1 + 7, "Linh Môi Sư 1 + 7");
  const d = evsOf(G, "destroy").find(e => e.uid === c.uid), a = evsOf(G, "absorb")[0];
  ok(d && d.src === t.uid, "destroy.src = Linh Môi Sư"); ok(a && a.uid === t.uid && a.from === c.uid && a.v === 7, "absorb " + JSON.stringify(a));
  /* đặt thẻ TRƯỚC rồi mới Kích Hoạt: lượt này không nuốt; lượt sau cũng không (chỉ trong lượt kích hoạt) */
  const G2 = setup(); const t2 = onBoard(G2, "p", "tamlinhtu", 0); const c2 = inHand(G2, "p", "thachquai");
  ok(LT.queuePlay(G2, "p", c2.uid, 1)); ok(LT.queueAct(G2, "p", t2.uid)); for (const st of LT.beginReveal(G2)) LT.doStep(G2, st);
  ok(LT.locOf(G2, c2) === 1, "thẻ đặt trước khi kích hoạt không bị nuốt");
  nextTurn(G2); G2.energy.p = 30; const c3 = inHand(G2, "p", "docnhan"); play(G2, "p", c3, 2);
  ok(LT.locOf(G2, c3) === 2 && pw(G2, t2) === 1, "lượt sau: không còn nuốt (trước đây nuốt nhầm sang lượt sau)");
});
test("Lôi Quang Tiên (diennu): đỉnh bộ bài -1 năng lượng +1 sức mạnh + dấu surge; đặt lá đó -> lặp lại lên lá đỉnh mới (chuỗi), sự kiện surge.src = lá vừa đặt", () => {
  const G = setup(); const b2 = inDeck(G, "p", "docnhan"), b1 = inDeck(G, "p", "chanthu");
  play(G, "p", inHand(G, "p", "diennu"), 0);
  ok(b1.surge && b1.cm === -1 && b1.bonus === 1 && !b2.surge, "lá đỉnh được truyền điện");
  G.deck.p.splice(G.deck.p.indexOf(b1), 1); G.hand.p.push(b1); G.evs = [];
  play(G, "p", b1, 1);
  const e = evsOf(G, "surge")[0]; ok(e && e.src === b1.uid && e.uid === b2.uid, "lặp lại từ lá vừa đặt " + JSON.stringify(G.evs.filter(x => x.k === "surge")));
  ok(!b1.surge && b2.surge && b2.cm === -1 && b2.bonus === 1, "dấu chuyển sang lá đỉnh mới");
});
test("Bảng Test VFX: mọi thẻ ưu tiên (Nữ Lôi Thần, Bóng Ma, Mây Nuốt Thời Gian, Thạch Lực Nữ, Kẻ Nuốt Sao, Tiến Sĩ Gamma, Chiến Thần…) có thế cờ cho thấy tác dụng", () => {
  const PLAN = require(path.join(www, "js", "dev-vfx-lab.js"));
  const bad = [];
  for (const id of ["nuloithan", "bongma", "maynuotthoigian", "thachlucnu", "kenuotsao", "tiensigamma", "chienthan", "nuhondoc", "vohannhan", "vuabong", "heonhen", "khuyendichchuyen", "huyenconu", "annu", "khoibang", "dahanh"]) { const p = PLAN.plan(id, 777); if (!p.effect) bad.push(id); }
  eq(bad.join(","), "", "thẻ chưa có thế cờ cho thấy tác dụng");
});

test("Bảng Test VFX (kiểm nhanh engine): MỌI thẻ có kỹ năng đều cho thấy tác dụng hoặc có giải thích đã kiểm (0 cảnh báo không giải thích)", () => {
  const PLAN = require(path.join(www, "js", "dev-vfx-lab.js"));
  const bad = [];
  for (const id of Object.keys(C)) { if (C[id].t === "none") continue; const p = PLAN.plan(id, 777); if (p.err) bad.push(id + "(lỗi: " + p.err + ")"); else if (!p.effect && !p.notes.length) bad.push(id); }
  eq(bad.join(", "), "", "thẻ không tác dụng, không giải thích");
});

/* ---------------- A3. b44 (làn E): luật thẻ theo 44 nhận xét ---------------- */
console.log("A3. b44 — luật thẻ (làn E):");
const runSteps = (G) => { for (const st of LT.beginReveal(G)) LT.doStep(G, st); };
const endT = (G) => { G.q = { p: [], a: [] }; const all = []; for (const st of LT.beginEndTurn(G)) { LT.stepEndTurn(G, st); if (G.evs) all.push(...G.evs); } LT.finishEndTurn(G); if (G.evs) { G.evs.length = 0; G.evs.push(...all); } };
test("[6] Cương Thi Nuốt Sao: đánh dấu 6 lá lúc Đầu Ván (startFx.mk/priv, G.zgm), CHƯA biến trước khi lật", () => {
  const d = LT.randomDeck(() => 0.5); d[0] = "bayxacnuotsao";
  const G = LT.newGame(d, LT.randomDeck(() => 0.3), { seed: 5 });
  const mk = G.hand.p.concat(G.deck.p).filter(c => c.zg);
  eq(mk.length, 6, "6 lá đánh dấu"); ok(mk.every(c => c.id !== "bayxacnuotsao" && !LT.SKILLS.includes(c.id)), "không đánh dấu chính nó / thẻ phép");
  const sf = G.startFx.find(x => x.id === "bayxacnuotsao"); ok(sf && sf.mk.length === 6 && sf.priv === "p", "startFx.mk/priv");
  eq(G.zgm.p.length, 6, "G.zgm"); ok(mk.every(c => c.id === C[c.id].id), "chưa biến");
});
test("[6] Cương Thi lật: biến MỌI lá đánh dấu (tay, bộ bài, sân kể cả lá úp) thành bản sao mang sức mạnh hiện tại; sự kiện zgx + morph(z)", () => {
  const G = setup(); const z = inHand(G, "p", "bayxacnuotsao"); z.bonus = 3;
  const h = inHand(G, "p", "da"), dk = inDeck(G, "p", "thachquai"), b = onBoard(G, "p", "chanthu", 1), hid = onBoard(G, "p", "taymaynu", 2), nm = inHand(G, "p", "cuongnhan");
  hid.rev = false; hid.hid = true;
  for (const c of [h, dk, b, hid]) c.zg = z.uid;
  play(G, "p", z, 0);
  for (const c of [h, dk, b, hid]) { eq(c.id, "bayxacnuotsao", "lá " + c.uid + " phải biến"); eq(LT.basePow(c) + c.bonus, 8, "sức mạnh = Cương Thi lúc lật (5+3)"); ok(!c.zg, "hết dấu"); }
  eq(nm.id, "cuongnhan", "lá không đánh dấu giữ nguyên");
  const zx = evsOf(G, "zgx")[0]; ok(zx && zx.uid === z.uid && zx.us.length === 4 && zx.v === 8, "zgx: " + JSON.stringify(zx));
  ok(evsOf(G, "morph").some(e => e.uid === h.uid && e.z === "hand" && e.src === z.uid), "morph trên tay có z/src");
});
test("[5] Hắc Diệm Đế: bước 1 thất bại -> trả lại bước 1 (thẻ tạo); bước 2 tôn trọng Thép Nhân; bước 3 triệu hồi; sự kiện ritual", () => {
  const G = setup(); const dm = inDeck(G, "p", "hacdiemchua");
  play(G, "p", inHand(G, "p", "nghithuctrieuhoii"), 0);
  let r = evsOf(G, "ritual")[0]; ok(r && r.step === 1 && !r.ok && r.dm === dm.uid && r.why, "ritual 1 thất bại: " + JSON.stringify(r));
  const s1 = G.hand.p.find(c => c.id === "nghithuctrieuhoii"); ok(s1 && s1.cr, "bước 1 trở lại tay (thẻ tạo)");
  const dead = onBoard(G, "p", "cuongnhan", 1); LT.destroy(G, dead, 1);
  G.evs = []; play(G, "p", s1, 0); eq(dm.bonus, 14, "nuốt thẻ mạnh nhất đã bị huỷ");
  ok(evsOf(G, "absorb").some(e => e.uid === dm.uid && e.from === dead.uid), "absorb bước 1");
  const s2 = G.hand.p.find(c => c.id === "nghithuctrieuhoiii"); ok(s2 && s2.cr && s2.by === "nghithuctrieuhoii", "bước 2 là thẻ tạo bởi bước 1");
  onBoard(G, "a", "da", 2); onBoard(G, "a", "thepnhan", 2); G.evs = []; play(G, "p", s2, 2);
  eq(dm.bonus, 15, "chỉ lấy được từ thẻ không được bảo vệ"); r = evsOf(G, "ritual")[0]; eq(r.v, 1, "ritual.v");
  const s3 = G.hand.p.find(c => c.id === "nghithuctrieuhoiiii"); onBoard(G, "p", "da", 1); onBoard(G, "p", "da", 1);
  G.evs = []; play(G, "p", s3, 1); eq(LT.locOf(G, dm), 1, "Hắc Diệm Đế ra sân"); eq(pw(G, dm), 28, "13 + 14 + 1");
  r = evsOf(G, "ritual")[0]; ok(r.ok && r.step === 3 && r.from.length === 2 && r.dz === "deck", "ritual 3: " + JSON.stringify(r));
});
test("[10] Thẻ được tạo: Càn Khôn Khai Quang (cr + tf), Pháp Sư Già, Hắc Kỵ Sĩ, Mười Kiếp Nữ, Chợ Đen mang đúng nguồn", () => {
  const d = LT.randomDeck(() => 0.5); d[0] = "quyensuthaphoan";
  const G = LT.newGame(d, LT.randomDeck(() => 0.3), { seed: 3 }); G.evs = [];
  const q = G.hand.p.find(c => c.id === "thaphoan"); ok(q && q.cr && q.by === "quyensuthaphoan", "Càn Khôn Quyển là thẻ tạo");
  const v = LT.mk(G, "quyensuthaphoan", "p"); G.hand.p.push(v); G.energy.p = 10; G.turn = 3; G.locs.forEach(L => { L.rvl = true; });
  ok(LT.queuePlay(G, "p", v.uid, 0)); runSteps(G);
  eq(q.id, "thaphoankhaimo"); ok(q.cr && q.by === "quyensuthaphoan" && q.tf && q.tf.o === "thaphoan", "Khai Quang vẫn là thẻ tạo + có tf");
  ok(evsOf(G, "morph").some(e => e.uid === q.uid && e.z === "hand"), "morph trên tay");
  const G2 = setup(); const ps = onBoard(G2, "p", "phapsugia", 0); endT(G2); G2.evs = []; LT.startTurn(G2);
  const sp = G2.hand.p.find(c => c.cr); ok(sp && sp.by === "phapsugia" && sp.bu === ps.uid, "Pháp Sư Già: " + JSON.stringify(sp && [sp.by, sp.bu]));
  const G3 = setup(); const hk = onBoard(G3, "p", "hackysi", 0); inHand(G3, "p", "da"); LT.discard(G3, "p", G3.hand.p[0]);
  const hb = G3.hand.p.find(c => c.id === "hackiem"); ok(hb && hb.cr && hb.by === "hackysi" && hb.bu === hk.uid, "Hắc Kỵ Sĩ");
  const G4 = setup(); G4.open = { p: ["da"], a: [] }; const mm = onBoard(G4, "p", "muoikiepnu", 0); const kx = onBoard(G4, "a", "da", 0); G4.srcU = kx.uid; LT.destroy(G4, mm, 0); G4.srcU = 0;
  const mc = G4.hand.p.find(c => c.cr); ok(mc && mc.by === "muoikiepnu", "Mười Kiếp Nữ: nguồn là chính nó, không phải thẻ huỷ nó: " + (mc && mc.by));
});
test("[11] Thẻ đưa vào sân bằng hiệu ứng: summon/revive luôn có li/ix/side/id/src (Phân Thân, Thiên Dực, tự hồi sinh)", () => {
  const G = setup(); const pt = onBoard(G, "p", "phanthan", 0); LT.moveCard(G, pt, 0, 1);
  const s = evsOf(G, "summon")[0]; ok(s && s.li === 0 && s.ix >= 0 && s.side === "p" && s.id === "phanthan" && s.clone === pt.uid, JSON.stringify(s));
  const G2 = setup(); const td = inHand(G2, "p", "thienduc"); const v = onBoard(G2, "p", "da", 2); LT.destroy(G2, v, 2);
  const s2 = evsOf(G2, "summon").find(e => e.uid === td.uid); ok(s2 && s2.li === 2 && s2.from === "hand", JSON.stringify(s2));
  ok(evsOf(G2, "flip").some(e => e.uid === td.uid && e.eff), "Thiên Dực lật như thẻ được đưa vào");
});
test("[13] Rồng Bất Tử: đếm mọi lượt đặt >=2 thẻ GỒM lượt hiện tại; buff nhân vật cuối (bỏ qua thẻ phép); lá bị trả về không tính", () => {
  const G = setup(); G.cnt.two.p = 2; const a = inHand(G, "p", "da"), sp = inHand(G, "p", "daodo"), r = inHand(G, "p", "longbattu");
  LT.queuePlay(G, "p", a.uid, 0); LT.queuePlay(G, "p", sp.uid, 1); LT.queuePlay(G, "p", r.uid, 1); runSteps(G);
  eq(a.bonus, 6, "3 lượt x2 (2 cũ + lượt này) cho nhân vật cuối (Đá), không mất vào thẻ phép");
  const pb = evsOf(G, "pbuff").find(e => e.why === "longbattu"); ok(pb && pb.uid === a.uid && pb.src === r.uid && pb.turns === 3, JSON.stringify(pb));
  endT(G); eq(G.cnt.two.p, 3, "cuối lượt đếm lượt này đúng 1 lần"); eq(LT.counter(G, r).txt, "(+6)");
});
test("[16] Chúa Mặt Trời: đếm lượt kết thúc còn dư năng lượng (cả lá bị trả về được hoàn năng lượng) + egain", () => {
  const G = setup(); G.energy.p = 2; runSteps(G); endT(G); eq(G.cnt.unspentTurns.p, 1);
  G.turn++; G.energy.p = 1; const x = inHand(G, "p", "da"); LT.queuePlay(G, "p", x.uid, 0); runSteps(G); endT(G); eq(G.cnt.unspentTurns.p, 1, "dùng hết -> không tính");
  G.turn++; G.energy.p = 9; const t = inHand(G, "p", "tinhchuathaiduong"); LT.queuePlay(G, "p", t.uid, 0); runSteps(G);
  eq(G.nextBonus.p, 1); const e = evsOf(G, "egain").find(x => x.uid === t.uid); ok(e && e.n === 1 && e.next, JSON.stringify(e)); eq(LT.counter(G, t).v, 1);
});
test("[22] Nhện Non: Kích Hoạt -> thẻ NHÂN VẬT kế tiếp (lượt sau) +1 & dời phải; bỏ qua thẻ phép; 2 lần kích hoạt cộng dồn", () => {
  const G = setup(); const n = onBoard(G, "p", "nhennon", 0), n2 = onBoard(G, "p", "nhennon", 2); act(G, "p", n); act(G, "p", n2); endT(G); G.turn++; G.energy.p = 30;
  const sp = inHand(G, "p", "daodo"), c = inHand(G, "p", "chanthu"); LT.queuePlay(G, "p", sp.uid, 0); LT.queuePlay(G, "p", c.uid, 0); G.evs = []; runSteps(G);
  eq(c.bonus, 2, "+1 mỗi lần kích hoạt"); eq(LT.locOf(G, c), 2, "dời sang phải 2 lần"); eq(evsOf(G, "pbuff").filter(e => e.why === "nhennon").length, 2);
  ok(!G.arana.p, "đã dùng hết");
});
function act(G, s, c) { ok(LT.queueAct(G, s, c.uid), "không kích hoạt được " + c.id); runSteps(G); }
test("[25] Thẻ phép không mang tăng/giảm sức mạnh (Huyễn Cơ Nữ/Ngã Ba Sông cả tay), vẫn được đổi năng lượng", () => {
  const G = setup(); const sp = inHand(G, "p", "daodo"), ch = inHand(G, "p", "da"); onBoard(G, "p", "huyenconu", 0); onBoard(G, "p", "thachquai", 0);
  sp.cm = -1; endT(G); LT.startTurn(G); eq(sp.bonus, 0, "thẻ phép không +"); eq(ch.bonus, 1, "nhân vật +1"); eq(sp.cm, -1, "giữ giảm năng lượng");
  const G2 = setup(); const s2 = inHand(G2, "p", "daodo"); for (let k = 0; k < 20; k++) { const G3 = setup(k + 1); const a = inHand(G3, "p", "daodo"), b = inHand(G3, "p", "da"); play(G3, "p", inHand(G3, "p", "hongnutinhquai"), 0); eq(a.bonus, 0); eq(b.bonus, 6); }
});
test("[26] Nụ Hôn Độc tự huỷ khi phía nó đầy vì TRIỆU HỒI / DI CHUYỂN (không chỉ khi đặt)", () => {
  const G = setup(); const n = onBoard(G, "a", "nuhondoc", 1); onBoard(G, "a", "da", 1); onBoard(G, "a", "da", 1); const mv = onBoard(G, "a", "da", 0);
  ok(LT.queueAct(G, "p", onBoard(G, "p", "da", 2).uid) === false); G.q = { p: [], a: [] };
  G.q.a.push({ t: "move", uid: mv.uid, to: 1, from: 0 }); mv.fly = true; mv.turn = 1; runSteps(G);
  eq(LT.locOf(G, n), -1, "đầy do dời thẻ -> tự huỷ");
  const G2 = setup(); onBoard(G2, "a", "da", 0); onBoard(G2, "a", "da", 0); onBoard(G2, "a", "da", 0); play(G2, "p", inHand(G2, "p", "docnutrang"), 0);
  ok(!G2.locs[0].cards.a.some(c => c.id === "nuhondoc"), "Nụ Hôn Độc lấp ô cuối -> tự huỷ ngay");
  ok(evsOf(G2, "destroy").some(e => e.id === "nuhondoc"), "có sự kiện destroy");
});
test("[27] Cậu Thợ Khéo: Bát Túc Giáp hợp thể vào thẻ khác -> lượt sau +1 năng lượng; sự kiện absorb + egain", () => {
  const G = setup(); const pk = onBoard(G, "p", "nhencogiap", 1); const t = onBoard(G, "p", "chanthu", 0);
  const sp = LT.mk(G, "cogiapnhen", "p"); sp.cr = true; sp.by = "nhencogiap"; sp.bu = pk.uid; G.hand.p.push(sp); play(G, "p", sp, 0);
  eq(t.bonus, 5, "hợp thể +5"); eq(G.nextBonus.p, 1, "+1 năng lượng lượt sau");
  ok(evsOf(G, "absorb").some(e => e.uid === t.uid && e.from === sp.uid && e.merge), "absorb"); ok(evsOf(G, "egain").some(e => e.uid === pk.uid && e.next), "egain");
});
test("[28] Đồng Trảo: 7 thẻ bị huỷ -> +1+1+1+2+2+2+3 = 12; mỗi lần 1 pbuff, bộ đếm hiển thị", () => {
  const G = setup(); const w = onBoard(G, "p", "vukhix", 0); for (let k = 0; k < 7; k++) LT.destroy(G, onBoard(G, "p", "da", 1), 1);
  eq(w.bonus, 12); eq(evsOf(G, "pbuff").filter(e => e.why === "vukhix").length, 7); eq(LT.counter(G, w).txt, "(1/3)");
});
test("[34] Thư Sinh Hoá Cuồng: dư năng lượng -> ~33% hoá cuồng (giữ sức mạnh cộng thêm); không dư -> 0%", () => {
  let n = 0, n0 = 0; for (let s = 1; s <= 600; s++) { for (const un of [2, 0]) { const G = setup(s); const z = onBoard(G, "p", "tiensigamma", 0, 2); G.unspent.p = un; G.cnt.playedNow.p = 0; for (const st of LT.beginEndTurn(G)) LT.stepEndTurn(G, st); if (z.id !== "tiensigamma") { if (un) { n++; eq(z.bonus, 2); } else n0++; } } }
  ok(n / 600 > 0.27 && n / 600 < 0.4, "tỉ lệ " + n / 600); eq(n0, 0);
});
test("[37] Ngọn Đuốc Sống: phía đầy -> nhân đôi TOÀN BỘ sức mạnh (gốc+cộng) 1 lần/ván, còn lại +1", () => {
  const G = setup(); const x = onBoard(G, "p", "hoanhansokhai", 0, 3); for (let k = 0; k < 3; k++) onBoard(G, "p", "da", 0);
  endT(G); eq(pw(G, x), 10, "(2+3) x2"); const e = evsOf(G, "pbuff").find(e => e.uid === x.uid); ok(e && e.why === "x2" && e.n === 5, JSON.stringify(e));
  G.turn++; G.evs = []; endT(G); eq(pw(G, x), 11, "lần sau chỉ +1");
});
test("[39] Thần Đồng: hàng sau LUÔN ghi lại thẻ phía trước (kể cả không kỹ năng); học được Lật -> chạy ngay", () => {
  const G = setup(); onBoard(G, "p", "da", 0); onBoard(G, "p", "da", 0); const t = inHand(G, "p", "thandong"); play(G, "p", t, 0);
  ok(t.tdg && t.tdg.why === "none" && t.tdg.id === "da" && !t.ab, "ghi 'không có kỹ năng': " + JSON.stringify(t.tdg));
  const G2 = setup(); const f = onBoard(G2, "p", "tinhquyennu", 0); onBoard(G2, "p", "da", 0); const top = inDeck(G2, "p", "da"); const t2 = inHand(G2, "p", "thandong"); play(G2, "p", t2, 0);
  eq(t2.ab, "tinhquyennu"); eq(t2.tdg.f, f.uid); eq(top.bonus, 3, "Lật học được chạy ngay");
  const G3 = setup(); const t3 = inHand(G3, "p", "thandong"); play(G3, "p", t3, 0); eq(t3.tdg.why, "front", "hàng trước");
});
test("[14] Ly Gián Ma Nữ: cướp kỹ năng thẻ mạnh nhất (năng lượng cao nhất, hoà -> sức mạnh) trên tay đối thủ; Lật cướp được chạy ngay", () => {
  const G = setup(); const lo = inHand(G, "a", "tinhquyennu"), hi = inHand(G, "a", "tinhquyennu"); hi.cm = 3; inHand(G, "a", "cuongnhan"); const top = inDeck(G, "p", "da");
  const h = inHand(G, "p", "haplucchiare"); play(G, "p", h, 0);
  eq(h.ab, "tinhquyennu"); ok(hi.sil && !lo.sil, "đúng lá mạnh nhất bị mất kỹ năng"); eq(top.bonus, 3, "Lật cướp được chạy");
  ok(evsOf(G, "abcopy").some(e => e.uid === h.uid && e.from === hi.uid && e.hand), "abcopy");
});
test("[42] Hồng Nữ Tinh Quái: 3 lần chọn ngẫu nhiên, mỗi lần 1 sự kiện hbuff (+2)", () => {
  const G = setup(); const a = inHand(G, "p", "da"), b = inHand(G, "p", "chanthu"); play(G, "p", inHand(G, "p", "hongnutinhquai"), 0);
  const hb = evsOf(G, "hbuff"); eq(hb.length, 3); eq(a.bonus + b.bonus, 6); ok(hb.every(e => e.n === 2 && e.us.length === 1), JSON.stringify(hb));
});
test("[44] Sầu Lão: chỉ lặp + tiêu huỷ thẻ có Lật; thẻ không Lật / bị xoá kỹ năng giữ nguyên", () => {
  const G = setup(); const r = onBoard(G, "p", "tinhquyennu", 0), n = onBoard(G, "p", "da", 0), s = onBoard(G, "p", "tinhquyennu", 0); s.sil = true; const top = inDeck(G, "p", "da");
  play(G, "p", inHand(G, "p", "sautham"), 0);
  eq(LT.locOf(G, r), -1, "thẻ Lật bị huỷ"); ok(LT.locOf(G, n) === 0 && LT.locOf(G, s) === 0, "thẻ không Lật / bị xoá kỹ năng còn"); eq(top.bonus, 3, "Lật được lặp");
  ok(evsOf(G, "skill").some(e => e.uid === r.uid && e.rep), "skill rep cho thẻ được lặp");
});
test("[19] Thây Ma Ánh Sao: tiêu huỷ đúng thẻ ở chiến địa nó đang đứng khi kích hoạt, rồi mới dời", () => {
  const G = setup(); const x = onBoard(G, "p", "xactinhquang", 0); const a = onBoard(G, "p", "da", 0), b = onBoard(G, "p", "da", 1); onBoard(G, "a", "cuongnhan", 2);
  act(G, "p", x); eq(LT.locOf(G, a), -1); eq(LT.locOf(G, b), 1); eq(x.bonus, 3); ok(evsOf(G, "destroy").every(e => e.li === 0)); eq(LT.locOf(G, x), 2, "dời tới nơi đang thua");
});
test("[40] Ảo Thuật Sư: Kích Hoạt được từ lượt sau khi lật (nút Kích Hoạt = canActivate)", () => {
  const G = setup(); const x = inHand(G, "p", "aosi"); play(G, "p", x, 0); ok(!LT.canActivate(G, "p", x), "lượt vừa lật: chưa"); endT(G); LT.startTurn(G); ok(LT.canActivate(G, "p", x), "lượt sau: được");
});
test("[3] Máy không biết thứ tự bộ bài người chơi: aiPlan không đổi G nhưng mô phỏng xáo bộ bài đối thủ", () => {
  const d = LT.randomDeck(() => 0.5); d[0] = "phanquanthiengioi"; const G = LT.newGame(d, LT.randomDeck(() => 0.3), { seed: 9 });
  const o = G.deck.p.map(c => c.uid).join(); LT.aiPlan(G, "a", 6); eq(G.deck.p.map(c => c.uid).join(), o, "bộ bài thật không đổi");
  const sf = G.startFx.find(x => x.id === "phanquanthiengioi"); ok(sf && sf.s === "p", "Đầu Ván Phán Quan chỉ thuộc phe chủ");
});

/* ---------------- B. trình duyệt ---------------- */
async function browserPart() {
  console.log("B. Diễn hoạt — nhắm đúng lá / đúng ô:");
  let chromium;
  try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
  const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
  const server = http.createServer(async (req, res) => {
    try { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html"; const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); } const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b); }
    catch { res.writeHead(404); res.end("nf"); }
  }).listen(0);
  await new Promise(r => server.once("listening", r));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
  const errors = []; const IGN = /ERR_TUNNEL|ERR_PROXY|Failed to load resource/;
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error" && !IGN.test(m.text())) errors.push("console: " + m.text()); });
  await page.addInitScript(() => { localStorage.setItem("ltd_p6lv", "full"); window.__ct = []; window.__choreoTap = (k, o) => window.__ct.push(Object.assign({ k }, o)); });
  const btest = async (name, fn) => { try { await fn(); pass++; console.log("  ✓ " + name); } catch (e) { fails.push(name); console.error("  ✗ " + name + "\n    " + (e && e.message)); } };
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
    await page.evaluate(() => { document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); store.mute = true; });
    await page.evaluate(() => document.getElementById("lbPlay").click());
    await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !TURN_BUSY, null, { timeout: 180000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => { G.hand.a = []; document.getElementById("btnEnd").click(); });
    await page.waitForFunction(() => !TURN_BUSY && G.phase === "play", null, { timeout: 180000 });
    await page.evaluate(() => {
      FFTURN.start = () => {};
      const d0 = CFX.destroy; CFX.destroy = function (r) { if (r && r.x != null) window.__des.push({ x: r.x, y: r.y, rects: [...document.querySelectorAll("#board [data-mc]")].map(e => { const q = e.getBoundingClientRect(); return { u: +e.dataset.mc, l: q.left, r: q.right, t: q.top, b: q.bottom }; }) }); return d0.apply(this, arguments); };
      const a0 = Element.prototype.animate; Element.prototype.animate = function () { const m = this.closest && this.closest("#board [data-mc]"); if (m) window.__an.add(+m.dataset.mc); return a0.apply(this, arguments); };
    });
    /* dàn cảnh rồi bấm Kết thúc lượt, chờ diễn xong */
    const stage = async (o) => {
      const U = await page.evaluate((o) => {
        G.turn = 3; for (const L of G.locs) { L.rvl = true; L.id = "meadow"; L.gone = false; L.cards.p.length = 0; L.cards.a.length = 0; }
        const U = {}; const put = (k, id, side, li) => { const c = E.mk(G, id, side); c.rev = true; c.played = true; c.turn = 1; c.et = G.turn; G.locs[li].cards[side].push(c); U[k] = c.uid; };
        for (const [k, id, li] of o.foe || []) put(k, id, "a", li);
        for (const [k, id, li] of o.own || []) put(k, id, "p", li);
        G.hand.a = []; G.energy.p = 40; G.energy.a = 0;
        G.hand.p = (o.hand || []).map(([k, id]) => { const c = E.mk(G, id, "p"); U[k] = c.uid; return c; });
        if (o.decka) G.deck.a = o.decka.map(([k, id]) => { const c = E.mk(G, id, "a"); U[k] = c.uid; return c; });
        render(); (o.hand || []).forEach(([k, id, li]) => E.queuePlay(G, "p", U[k], li)); render();
        window.__ct.length = 0; window.__des = []; window.__an = new Set(); window.__ev = [];
        return U;
      }, o);
      await page.waitForTimeout(300);
      await page.evaluate(() => document.getElementById("btnEnd").click());
      const t0 = Date.now();
      while (Date.now() - t0 < 60000) { if (!(await page.evaluate(() => TURN_BUSY)) && Date.now() - t0 > 1500) break; await page.waitForTimeout(60); }
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => ({ ct: window.__ct.slice(), des: window.__des.slice(), an: [...window.__an], dead: G.dead.a.map(c => c.uid).concat(G.dead.p.map(c => c.uid)) }));
      return { U, ...r };
    };
    const inside = (p, q) => p.x >= q.l && p.x <= q.r && p.y >= q.t && p.y <= q.b;

    await btest("giacdausi làn 0 (có thẻ địch ở làn 1 = chỗ mặc định cũ): nổ tiêu huỷ ở Ô TRỐNG làn 0, không trúng lá nào khác", async () => {
      const r = await stage({ foe: [["f0", "thachquai", 0], ["f1", "thachquai", 1]], hand: [["g", "giacdausi", 0]], decka: [["v", "tunguyennu"]] });
      ok(r.dead.includes(r.U.v), "thẻ bị kéo phải bị huỷ trong engine");
      const pk = r.ct.find(x => x.k === "pullKill" && x.uid === r.U.v);
      ok(pk, "màn diễn kéo-huỷ phải chạy cho đúng uid " + r.U.v + " " + JSON.stringify(r.ct));
      eq(pk.li, 0, "làn của màn diễn"); eq(pk.side, "a", "phe");
      ok(r.des.length >= 1, "phải có nổ tiêu huỷ");
      for (const d of r.des) {
        const hit = d.rects.filter(q => inside(d, q));
        ok(!hit.length, "nổ tiêu huỷ trùng lá trên bàn " + JSON.stringify(hit.map(q => q.u)));
        ok(Math.abs(d.x - pk.x) < 2 && Math.abs(d.y - pk.y) < 2, "nổ đúng toạ độ ô của thẻ bị kéo");
      }
      ok(!r.an.includes(r.U.f0) && !r.an.includes(r.U.f1), "không lá địch nào bị diễn hoạt (rung/huỷ): " + JSON.stringify(r.an));
    });

    await btest("giacdausi làn 2 (2 thẻ địch sẵn): ô thứ 3 của phe trên — đúng ô trống, không trúng thẻ", async () => {
      const r = await stage({ foe: [["f0", "thachquai", 2], ["f1", "thachquai", 2]], own: [["o", "tunguyennu", 2]], hand: [["g", "giacdausi", 2]], decka: [["v", "tunguyennu"]] });
      const pk = r.ct.find(x => x.k === "pullKill" && x.uid === r.U.v);
      ok(pk && pk.li === 2 && pk.ix === 2, "màn diễn ở làn 2, ô 2: " + JSON.stringify(pk));
      for (const d of r.des) ok(!d.rects.some(q => inside(d, q)), "nổ trùng lá trên bàn");
    });

    await btest("giacdausi kéo thẻ mạnh hơn: thẻ ở lại, màn kéo nhắm đúng lá data-mc của nó, không nổ huỷ", async () => {
      const r = await stage({ foe: [["f0", "thachquai", 1]], hand: [["g", "giacdausi", 1]], decka: [["v", "cuongnhan"]] });
      ok(!r.dead.includes(r.U.v), "thẻ mạnh hơn không bị huỷ");
      ok(!r.des.length && !r.ct.some(x => x.k === "pullKill"), "không được có màn tiêu huỷ");
      ok(await page.evaluate(u => !!document.querySelector(`#board [data-lane="1"] .side.opp [data-mc="${u}"]`), r.U.v), "lá bị kéo hiện ở phe địch làn 1");
      ok(r.an.includes(r.U.v), "màn kéo diễn trên đúng lá data-mc=" + r.U.v + " " + JSON.stringify(r.an));
    });

    await btest("kychu: Lật chạy lại của lá được dời diễn trên đúng lá (data-mc) ", async () => {
      const r = await stage({ own: [["so", "soinu", 0], ["x", "tunguyennu", 1]], hand: [["k", "kychu", 0]] });
      ok(r.an.includes(r.U.so), "lá Sói Nữ được diễn hoạt " + JSON.stringify(r.an));
      ok(await page.evaluate(u => !!document.querySelector(`#board [data-lane="1"] [data-mc="${u}"]`), r.U.so), "Sói Nữ ở chiến địa giữa");
    });
  } catch (e) { fails.push("browser"); console.error("THẤT BẠI: " + e.stack); }
  if (errors.length) { fails.push("lỗi trang"); console.error([...new Set(errors)].slice(0, 8).join("\n")); }
  await browser.close(); server.close();
}
if (!process.env.LA_NO_BROWSER) await browserPart();

console.log(`\n${pass} đạt, ${fails.length} lỗi`);
process.exit(fails.length ? 1 : 0);
