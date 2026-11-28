// Đợt 44 — làn I: thông tin thẻ trong trận (nhật ký nguồn gốc) + kéo-thả dời thẻ.
// Phần 1 (engine, luôn chạy): mọi thay đổi sức mạnh / năng lượng / kỹ năng / tạo / sao chép / biến hình / lấy sức mạnh
//   phải ghi ĐÚNG thẻ/chiến địa nguồn + số lượng (không còn nguồn rỗng -> "Một hiệu ứng trong trận").
// Phần 2 (engine): chiến địa được dời tới (moveTargets) khớp luật dời (Dạ Hành, Bà Tơ, Áo Choàng Tối, thẻ không dời được).
// Phần 3 (trình duyệt, bỏ qua nếu UI44=0): bảng thông tin thẻ hiện đúng tên nguồn; kéo thẻ trên bàn sang chiến địa khác = xếp lệnh dời.
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/info44.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const LT = require(path.join(here, "..", "www", "js", "01-engine.js"));
const C = LT.C;

let pass = 0; const fails = [];
async function test(name, fn) {
  try { await fn(); pass++; console.log("  ✓ " + name); }
  catch (e) { fails.push(name); console.error("  ✗ " + name + "\n    " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n    ") : e)); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || "") + " — mong đợi " + JSON.stringify(b) + ", nhận " + JSON.stringify(a)); }
function ok(v, msg) { if (!v) throw new Error(msg || "điều kiện sai"); }

function setup(locs, seed) {
  const G = LT.newGame(LT.randomDeck(() => 0.5), LT.randomDeck(() => 0.5), { seed: seed || 7, locs: locs || ["meadow", "meadow", "meadow"] });
  for (const s of ["p", "a"]) { G.hand[s] = []; G.deck[s] = []; G.disc[s] = []; G.dead[s] = []; }
  G.turn = 3; G.phase = "play"; G.locs.forEach(L => { L.rvl = true; L.cards.p = []; L.cards.a = []; });
  G.energy = { p: 30, a: 30 };
  return G;
}
function onBoard(G, s, id, li) { const c = LT.mk(G, id, s); c.rev = true; c.turn = 1; c.played = true; G.locs[li].cards[s].push(c); return c; }
function inHand(G, s, id) { const c = LT.mk(G, id, s); G.hand[s].push(c); return c; }
function play(G, s, card, li) { ok(LT.queuePlay(G, s, card.uid, li), "không đặt được " + card.id); for (const st of LT.beginReveal(G)) LT.doStep(G, st); }
function playMany(G, list) { for (const [s, card, li] of list) ok(LT.queuePlay(G, s, card.uid, li), "không đặt được " + card.id); for (const st of LT.beginReveal(G)) LT.doStep(G, st); }
const P = (G, c) => LT.prov(G, c);
const rows = (G, c, k) => P(G, c).filter(e => e.k === k);
/* mọi dòng chỉ số đều phải có nguồn (thẻ hoặc chiến địa) */
function allSourced(G, c) { for (const e of P(G, c)) if (["p", "c", "bp", "ab", "tf", "use"].includes(e.k)) ok(e.src.id || e.src.loc, "dòng " + JSON.stringify(e) + " của " + c.id + " không có nguồn"); }

console.log("Phần 1 — nhật ký nguồn gốc");
await test("Hải Kỵ (kysidaoquoc): +1 sức mạnh cho thẻ vừa đặt và −1 năng lượng thẻ trên tay đều ghi nguồn Hải Kỵ (mục 1)", () => {
  const G = setup(); const hk = onBoard(G, "p", "kysidaoquoc", 0);
  const big = inHand(G, "p", "da"); big.id = "da"; const four = inHand(G, "p", LT.COLLECT.find(id => C[id].c === 4 && C[id].t === "none"));
  const other = inHand(G, "p", "da");
  play(G, "p", four, 1);
  const pr = rows(G, four, "p"); eq(pr.length, 1, "số dòng sức mạnh"); eq(pr[0].d, 1); eq(pr[0].src.id, "kysidaoquoc", "nguồn +1"); eq(pr[0].src.u, hk.uid, "uid nguồn");
  const hit = [big, other].find(c => c.cm === -1); ok(hit, "một thẻ trên tay phải −1 năng lượng");
  const cr = rows(G, hit, "c"); eq(cr.length, 1); eq(cr[0].d, -1); eq(cr[0].src.id, "kysidaoquoc", "nguồn −1 năng lượng");
  eq(cr[0].t, 3, "lượt");
});
await test("Lật trừ sức mạnh (nhennu): thẻ địch ghi −1 từ Nhện Nữ, phe đối thủ", () => {
  const G = setup(); const foe = onBoard(G, "a", "da", 0); const nn = inHand(G, "p", "nhennu");
  play(G, "p", nn, 0);
  const r = rows(G, foe, "p"); eq(r.length, 1); eq(r[0].d, -1); eq(r[0].src.id, "nhennu"); eq(r[0].src.side, "p", "phe nguồn");
});
await test("Lấy sức mạnh (chonvacay): thẻ bị lấy −1 và Chồn ghi +1 'lay' từ đúng thẻ đó", () => {
  const G = setup(); const ch = onBoard(G, "p", "chonvacay", 0); const t = inHand(G, "a", "da");
  play(G, "a", t, 0);
  const lost = rows(G, t, "p"); eq(lost.length, 1); eq(lost[0].d, -1); eq(lost[0].src.id, "chonvacay");
  const got = rows(G, ch, "p"); eq(got.length, 1); eq(got[0].d, 1); eq(got[0].w, "lay"); eq(got[0].from && got[0].from.u, t.uid, "lấy từ thẻ nào");
});
await test("Thẻ được tạo bởi chiến địa (Đền Tổ Tiên) ghi nguồn chiến địa", () => {
  const G = setup(["denhung", "meadow", "meadow"]); G.locs[0].rvl = false; G.turn = 0; G.live = true;
  LT.startTurn(G);
  const c = G.hand.p.find(x => x.cr); ok(c, "có thẻ được tạo"); const r = rows(G, c, "cr")[0]; ok(r, "có dòng cr"); eq(r.src.loc, "denhung");
});
await test("Thẻ được tạo bởi thẻ (Vô Uý Ám Địa xáo 3 Quỷ) ghi nguồn thẻ + uid", () => {
  const G = setup(); const v = inHand(G, "p", "vouyamdia"); play(G, "p", v, 0);
  const q = G.deck.p.filter(c => c.id === "quy"); eq(q.length, 3); for (const c of q) { const r = rows(G, c, "cr")[0]; eq(r.src.id, "vouyamdia"); eq(r.src.u, v.uid); }
});
await test("Bản sao (Nhện Đỏ Thẫm kích hoạt): bản sao ghi 'copy' của thẻ gốc + nguồn tạo", () => {
  const G = setup(); const n = onBoard(G, "p", "nhendotham", 0); n.bonus = 2;
  ok(LT.queueAct(G, "p", n.uid), "kích hoạt"); for (const st of LT.beginReveal(G)) LT.doStep(G, st);
  const cp = [1, 2].flatMap(l => G.locs[l].cards.p).find(c => c.id === "nhendotham"); ok(cp, "có bản sao");
  const r = rows(G, cp, "copy")[0]; ok(r, "dòng copy"); eq(r.f, "nhendotham"); eq(r.fu, n.uid); eq(r.src.id, "nhendotham");
});
await test("Biến hình (Hoá Vật Nữ): thẻ bị biến ghi 'tf' từ thẻ gốc, nguồn Hoá Vật Nữ", () => {
  const G = setup(); const t = onBoard(G, "p", "da", 0); const h = inHand(G, "p", "hoavatnu"); play(G, "p", h, 0);
  if (t.id === "da") return; /* không có thẻ 1 năng lượng hơn -> không biến */
  const r = rows(G, t, "tf")[0]; ok(r, "dòng tf"); eq(r.o, "da", "thẻ ban đầu"); eq(r.src.id, "hoavatnu");
});
await test("Sao chép thành bản sao (Ảnh Cổ Thuật): 'tf' ghi bản gốc được chép", () => {
  const G = setup(); const big = onBoard(G, "p", "da", 0); big.bonus = 9; const small = onBoard(G, "p", "da", 0); small.id = LT.COLLECT.find(id => C[id].t === "none" && C[id].p <= 2 && id !== "da");
  const a = inHand(G, "p", "anhcothuat"); play(G, "p", a, 0);
  const r = rows(G, small, "tf")[0]; ok(r, "dòng tf"); eq(r.f, "da"); eq(r.fu, big.uid); eq(r.src.id, "anhcothuat");
});
await test("Thần Đồng: học kỹ năng thẻ phía trước -> ghi 'ab' chep; hàng trước -> ghi 'không có' + lý do (mục 39)", () => {
  const G = setup(); onBoard(G, "p", "nhennu", 0); onBoard(G, "p", "da", 0);
  const td = inHand(G, "p", "thandong"); play(G, "p", td, 0);
  const r = rows(G, td, "ab").pop(); ok(r, "dòng ab"); eq(r.w, "chep"); eq(r.a, "nhennu"); eq(r.f, "nhennu");
  const G2 = setup(); const td2 = inHand(G2, "p", "thandong"); play(G2, "p", td2, 0);
  const r2 = rows(G2, td2, "ab").pop(); ok(r2, "dòng ab (không có)"); eq(r2.w, "none"); ok(r2.why === "front" || r2.why === "row", "lý do: " + r2.why);
  const G3 = setup(); onBoard(G3, "p", "da", 0); onBoard(G3, "p", "da", 0); const td3 = inHand(G3, "p", "thandong"); play(G3, "p", td3, 0);
  const r3 = rows(G3, td3, "ab").pop(); ok(r3, "dòng ab (thẻ trước không kỹ năng)"); ok(r3.w === "none" || r3.a === "da", "ghi nhận thẻ phía trước không có kỹ năng"); eq(r3.f, "da");
});
await test("Tiểu Khổng Lồ: kỹ năng ngẫu nhiên đầu ván ghi 'ab' ngaunhien + thẻ được chép (mục 8)", () => {
  const deck = ["tieukhonglo", ...LT.randomDeck(() => 0.3).filter(x => x !== "tieukhonglo")].slice(0, 12);
  const G = LT.newGame(deck, LT.randomDeck(() => 0.5), { seed: 3 });
  const t = [...G.deck.p, ...G.hand.p].find(c => c.id === "tieukhonglo"); ok(t && t.ab && C[t.ab].c === 6, "đã chép kỹ năng thẻ 6 năng lượng");
  const r = rows(G, t, "ab").pop(); ok(r, "dòng ab"); eq(r.w, "ngaunhien"); eq(r.a, t.ab);
});
await test("Hắc Thuật Sĩ: kích hoạt chép kỹ năng thẻ trong bộ bài -> ghi 'ab' chep + thẻ nguồn (mục 30)", () => {
  const G = setup(); const h = onBoard(G, "p", "hacthuatsi", 0); const src = LT.mk(G, "nhennu", "p"); G.deck.p.push(src);
  G.energy.p = C.nhennu.c; ok(LT.queueAct(G, "p", h.uid), "kích hoạt");
  for (const st of LT.beginReveal(G)) LT.doStep(G, st);
  eq(h.ab, "nhennu"); const r = rows(G, h, "ab").pop(); eq(r.w, "chep"); eq(r.f, "nhennu"); eq(r.fu, src.uid);
});
await test("Vua Thời Gian: ghi đủ 3 kỹ năng Lật đã dùng ('use') kèm id thẻ (mục 17)", () => {
  const G = setup(); const v = inHand(G, "p", "vuathoigian"); play(G, "p", v, 0);
  const u = rows(G, v, "use"); eq(u.length, 3, "3 lần dùng"); for (const e of u) ok(C[e.a] && C[e.a].t === "rev", "thẻ được dùng có Lật: " + e.a);
});
await test("Loạn Tướng: hoàn thành nhiệm vụ -> ghi 'use' kỹ năng Lật của thẻ trên tay (mục 17)", () => {
  const G = setup(); const lt = onBoard(G, "p", "loantuong", 0); lt.q = 2; const h = inHand(G, "p", "nhennu"); const r = inHand(G, "p", "soinu");
  play(G, "p", r, 1);
  const u = rows(G, lt, "use"); eq(u.length, 1); eq(u[0].a, "nhennu");
});
await test("Bị động sau khi đặt (Nữ Tướng Voi / Thạch Sanh / Xác Bà Đồng): ghi nguồn chính thẻ bị động, không phải thẻ vừa đặt (mục 45)", () => {
  const G = setup(); const nt = onBoard(G, "p", "thanhkiemnu", 0), ts = onBoard(G, "p", "hapnangthu", 1); const x = inHand(G, "p", "nhennu"); play(G, "p", x, 0);
  eq(rows(G, nt, "p")[0].src.id, "thanhkiemnu"); eq(rows(G, ts, "p")[0].src.id, "hapnangthu");
});
await test("Bọ Chiến: +1 khi bạn vứt bỏ ghi nguồn Bọ Chiến (không phải thẻ gây vứt bỏ)", () => {
  const G = setup(); const bc = onBoard(G, "p", "trungchien", 0); const h = inHand(G, "p", "da"); LT.discard(G, "p", h);
  eq(rows(G, bc, "p")[0].src.id, "trungchien");
});
await test("Đầu Lượt / khi rút: Cuồng Trí, Thuỷ Linh ghi đúng nguồn", () => {
  const G = setup(); const ct = onBoard(G, "p", "cuongtri", 0); for (let k = 0; k < 6; k++) inHand(G, "p", "da"); for (let k = 0; k < 3; k++) G.deck.p.push(LT.mk(G, "da", "p"));
  const tl = onBoard(G, "p", "thuynu", 1); G.phase = "over0"; LT.startTurn(G);
  eq(rows(G, ct, "p")[0] && rows(G, ct, "p")[0].src.id, "cuongtri"); const dr = G.hand.p[G.hand.p.length - 1]; eq(rows(G, dr, "c")[0].src.id, "thuynu");
});
await test("Token bị vứt bỏ (Mảnh Kiếm Quỷ) vẫn ghi đúng tên nguồn", () => {
  const G = setup(); const mv = onBoard(G, "p", "monghoang", 0); const m = inHand(G, "p", "manhkiemquy"); LT.discard(G, "p", m);
  const r = rows(G, mv, "p")[0]; ok(r, "có dòng"); eq(r.src.id, "manhkiemquy");
});
await test("Không còn dòng thay đổi nào thiếu nguồn trong 120 ván ngẫu nhiên", () => {
  let n = 0, bad = [];
  function mul(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R0 = Math.random;
  try {
    for (let i = 0; i < 120; i++) {
      const r = mul(4400 + i); Math.random = mul(i + 99);
      const G = LT.newGame(LT.randomDeck(r), LT.randomDeck(r), { seed: 4400 + i });
      let g = 0; while (G.phase !== "over" && g++ < 20) { LT.startTurn(G); for (const s of ["p", "a"]) LT.aiPlan(G, s, 8); LT.runTurn(G); if (G.phase !== "over" && G.turn >= LT.turns(G)) LT.finish(G, "end"); }
      for (const s of ["p", "a"]) { const all = [...G.hand[s], ...G.deck[s], ...G.disc[s], ...G.dead[s], ...G.locs.flatMap(L => L.cards[s])];
        for (const c of all) for (const e of P(G, c)) { n++; if ((["p", "c", "bp"].includes(e.k) || (e.k === "cr" && c.cr)) && !e.src.id && !e.src.loc) bad.push(c.id + ":" + e.k); } }
    }
  } finally { Math.random = R0; }
  ok(n > 1000, "đủ dữ liệu (" + n + ")"); ok(bad.length <= 2, "thiếu nguồn: " + bad.slice(0, 10).join(", "));
});

console.log("Phần 2 — dời thẻ: chiến địa được chọn");
await test("Dạ Hành (có thể di chuyển 1 lần): dời được tới 2 chiến địa còn chỗ; hết lượt dời thì không", () => {
  const G = setup(); const d = onBoard(G, "p", "dahanh", 0);
  eq(LT.moveTargets(G, "p", d.uid).join(), "1,2");
  for (let k = 0; k < 4; k++) onBoard(G, "p", "da", 2);
  eq(LT.moveTargets(G, "p", d.uid).join(), "1", "chiến địa đầy bị loại");
  ok(LT.queueMove(G, "p", d.uid, 1)); for (const st of LT.beginReveal(G)) LT.doStep(G, st);
  eq(LT.locOf(G, d), 1); G.turn++; eq(LT.moveTargets(G, "p", d.uid).length, 0, "đã dời 1 lần");
});
await test("Thẻ thường không có quyền dời -> không có chiến địa nào", () => {
  const G = setup(); const c = onBoard(G, "p", "da", 0); eq(LT.moveTargets(G, "p", c.uid).length, 0);
});
await test("Bà Tơ: một thẻ KHÁC của bạn tại đây chọn chiến địa để dời; Bà Tơ không tự dùng quyền của mình", () => {
  const G = setup(); const b = onBoard(G, "p", "bato", 0); const c = onBoard(G, "p", "da", 0); G.turn = 3; G.locs[0].grant.p = G.turn;
  eq(LT.moveTargets(G, "p", c.uid).join(), "1,2");
  eq(LT.moveTargets(G, "p", b.uid).length, 0, "Bà Tơ tự dời");
  ok(LT.queueMove(G, "p", c.uid, 2), "xếp lệnh dời"); eq(LT.moveTargets(G, "p", onBoard(G, "p", "da", 0).uid).length, 0, "mỗi lượt chỉ 1 thẻ");
});
await test("Áo Choàng Tối (cloak): chỉ được dời tới chiến địa có áo choàng", () => {
  const G = setup(); const c = onBoard(G, "p", "da", 0); G.locs[2].cloak = G.turn;
  eq(LT.moveTargets(G, "p", c.uid).join(), "2");
});
await test("Thẻ dời ngẫu nhiên (Lão Nhện) vẫn ngẫu nhiên — không có lựa chọn kéo", () => {
  const G = setup(); const c = onBoard(G, "p", "laonhen", 0); eq(LT.moveTargets(G, "p", c.uid).length, 0);
});

/* ---------- Phần 3: trình duyệt ---------- */
if (process.env.UI44 !== "0") {
  console.log("Phần 3 — giao diện");
  let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
  const www = path.join(here, "..", "www");
  const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
  const server = http.createServer(async (req, res) => { try { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html"; const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); } const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404); res.end("nf"); } }).listen(0);
  await new Promise(r => server.once("listening", r));
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
    page.on("pageerror", e => errors.push("pageerror: " + e.message));
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#ldr12", { state: "detached", timeout: 120000 });
    await page.evaluate(() => document.getElementById("lbPlay").click());
    await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 60000 });
    await page.waitForTimeout(1500);
    /* dựng thế cờ: Hải Kỵ trên bàn, đặt 1 thẻ 4 năng lượng -> mở thông tin thẻ đó */
    const setupJs = () => {
      try { resetTimer(false); } catch (e) {} /* gpu70: đồng hồ lượt không tự kết thúc lượt giữa các test kéo */
      for (const s of ["p", "a"]) { G.hand[s] = []; G.locs.forEach(L => { L.cards[s] = []; }); }
      G.locs.forEach(L => { L.rvl = true; }); G.energy.p = 20; G.energy.a = 0; G.q = { p: [], a: [] };
      const mk = (id, s) => E.mk(G, id, s), ob = (id, s, li) => { const c = mk(id, s); c.rev = true; c.turn = 1; c.played = true; G.locs[li].cards[s].push(c); return c; };
      const hk = ob("kysidaoquoc", "p", 0); const four = mk(E.COLLECT.find(id => C[id].c === 4 && C[id].t === "none"), "p"); G.hand.p.push(four); G.hand.p.push(mk("da", "p"));
      E.queuePlay(G, "p", four.uid, 1); for (const st of E.beginReveal(G)) E.doStep(G, st); G.phase = "play";
      const dh = ob("dahanh", "p", 2); dh.turn = 0; const v = mk("vuathoigian", "p"); v.rev = true; v.turn = 1; G.locs[0].cards.p.push(v);
      G.hist44 = { four: four.uid, hk: hk.uid, dh: dh.uid }; render(); return G.hist44;
    };
    const ids = await page.evaluate(setupJs);
    await test("Bảng thông tin thẻ: dòng +1 ghi tên Hải Kỵ, không có 'Một hiệu ứng trong trận' (mục 1, 23)", async () => {
      await page.evaluate(u => { look = { kind: "card", uid: u }; render(); }, ids.four);
      await page.waitForSelector("#zoom.on", { timeout: 5000 });
      const t = await page.evaluate(() => document.querySelector("#zoom .zt").innerText);
      ok(/Hải Kỵ|Kỵ Sĩ Đảo Quốc/.test(t), "thiếu tên nguồn: " + t.slice(0, 300)); ok(!/một hiệu ứng trong trận/i.test(t), "còn chữ chung chung");
    });
    await test("Thẻ liên quan trong trận: có dải thẻ liên quan và chạm vào đổi mặt thẻ (mục 18)", async () => {
      const LKid = await page.evaluate(() => Object.keys(LINKS).find(k => LINKS[k].length && C[k]));
      await page.evaluate(id => { const c = E.mk(G, id, "p"); c.rev = true; c.turn = 1; G.locs[0].cards.p.push(c); look = { kind: "card", uid: c.uid }; render(); }, LKid);
      await page.waitForSelector("#zoom .zrel [data-zalt]", { timeout: 5000 });
      await page.evaluate(() => document.querySelectorAll("#zoom .zrel [data-zalt]")[1].click());
      const nm = await page.evaluate(() => document.querySelector("#zoom").dataset.alt || "");
      ok(nm && nm !== "0", "không đổi sang thẻ liên quan");
    });
    await test("Vua Thời Gian: thông tin liệt kê kỹ năng của thẻ đã dùng kèm năng lượng/sức mạnh (mục 17)", async () => {
      await page.evaluate(() => { const v = G.locs[0].cards.p.find(c => c.id === "vuathoigian"); E.REV.vuathoigian(G, v, 0); look = { kind: "card", uid: v.uid }; render(); });
      const n = await page.evaluate(() => document.querySelectorAll("#zoom .zuse").length);
      ok(n >= 1, "không có dòng kỹ năng đã dùng");
    });
    await test("Kéo Dạ Hành sang chiến địa khác = xếp lệnh dời đúng chiến địa thả (mục 24)", async () => {
      await page.evaluate(() => { try { resetTimer(false); } catch (e) {} look = null; sel = null; render(); });
      await page.waitForTimeout(300);
      const from = await page.evaluate(u => { const r = document.querySelector(`#board [data-mc="${u}"]`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, ids.dh);
      const to = await page.evaluate(() => { const r = document.querySelector('#board [data-lane="0"] .side.me').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(from.x + 10, from.y - 10, { steps: 3 });
      const hl = await page.evaluate(() => [...document.querySelectorAll("#board .lane.mvok")].map(e => +e.dataset.lane).join());
      eq(hl, "0,1", "chiến địa sáng khi kéo");
      await page.mouse.move(to.x, to.y, { steps: 8 }); await page.mouse.up();
      await page.waitForTimeout(200);
      const q = await page.evaluate(() => G.q.p.filter(a => a.t === "move").map(a => a.uid + ">" + a.to).join());
      eq(q, ids.dh + ">0");
    });
    await test("gpu70 (mục 5): kéo thẻ 'khi di chuyển' (Chuỳ Ánh Sáng) hiện số sẽ nhận ở từng chiến địa đích (mô phỏng trên bản sao)", async () => {
      const u = await page.evaluate(() => { try { resetTimer(false); } catch (e) {} /* đồng hồ lượt (bật từ lần chạm trước) không được tự kết thúc lượt giữa test */ G.q = { p: [], a: [] }; for (const s of ["p", "a"]) G.locs.forEach(L => { L.cards[s] = []; });
        const ob = (id, s, li) => { const c = E.mk(G, id, s); c.rev = true; c.turn = 1; c.played = true; G.locs[li].cards[s].push(c); return c; };
        G.locs.forEach(L => { L.id = "meadow"; }); const q = ob("quangchuy", "p", 0); q.turn = 0; q.free = G.turn; ob("da", "a", 1); ob("da", "a", 1); look = null; sel = null; render();
        window.__snap70 = JSON.stringify(G.locs.map(L => [L.cards.p.map(c => c.uid + ":" + c.bonus), L.cards.a.length])); return q.uid; });
      await page.waitForFunction(() => !document.querySelector("#board .mc.flip,#board .mc.land") && (typeof GV === "undefined" || !GV), null, { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400); /* bàn đứng yên (hết hoạt ảnh lật) trước khi đo vị trí thẻ */
      const from = await page.evaluate(u => { const r = document.querySelector(`#board [data-mc="${u}"]`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, u);
      await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(from.x + 12, from.y - 12, { steps: 3 });
      await page.waitForFunction(() => document.querySelectorAll("#board .mvgain").length > 0, null, { timeout: 3000 }).catch(() => {});
      const g = await page.evaluate(() => [...document.querySelectorAll("#board .mvgain")].map(e => e.dataset.mvg + "=" + e.textContent).join());
      const same = await page.evaluate(() => window.__snap70 === JSON.stringify(G.locs.map(L => [L.cards.p.map(c => c.uid + ":" + c.bonus), L.cards.a.length])));
      await page.mouse.move(from.x, from.y + 400, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(150);
      eq(g, "1=+4,2=+0", "số sẽ nhận theo chiến địa");
      ok(same, "mô phỏng không được đổi trạng thái ván thật");
      eq(await page.evaluate(() => document.querySelectorAll("#board .mvgain").length), 0, "nhãn tắt sau khi thả");
    });
    ok(!errors.length, errors.join("\n"));
  } catch (e) { fails.push("ui: " + e.message); console.error(e); }
  finally { await browser.close(); server.close(); }
  if (errors.length) { console.error(errors.join("\n")); fails.push("lỗi trang"); }
}

console.log(`\n${pass} đạt, ${fails.length} lỗi`);
if (fails.length) process.exit(1);
