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
