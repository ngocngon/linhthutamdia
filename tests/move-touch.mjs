// gpu70: KÉO DỜI THẺ TRÊN BÀN BẰNG CẢM ỨNG (điện thoại, vd Galaxy S21 Ultra Chrome).
// Thẻ được người chơi dời chủ động (Dạ Hành, Huyễn Cơ, Thuỷ Ngân Nữ, thẻ khác tại chiến địa của Bà Tơ) phải kéo được bằng ngón tay:
//   chạm giữ thẻ -> kéo -> chiến địa hợp lệ sáng + số sẽ nhận -> thả = xếp lệnh dời; thả chỗ sai = thẻ về chỗ cũ.
// Thẻ không dời được thì không kéo; chạm nhẹ vẫn mở bảng thông tin; cách dự phòng "chạm thẻ -> Dời thẻ -> chạm chiến địa" vẫn chạy.
// Dùng sự kiện chạm thật qua CDP (Input.dispatchTouchEvent) trên ngữ cảnh di động (isMobile, hasTouch) -> kiểm cả touch-action.
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/move-touch.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }

let pass = 0; const fails = [];
async function test(name, fn) {
  try { await fn(); pass++; console.log("  ✓ " + name); }
  catch (e) { fails.push(name); console.error("  ✗ " + name + "\n    " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join("\n    ") : e)); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || "") + " — mong đợi " + JSON.stringify(b) + ", nhận " + JSON.stringify(a)); }
function ok(v, msg) { if (!v) throw new Error(msg || "điều kiện sai"); }

const www = path.join(here, "..", "www");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => { try { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html"; const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); } const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404); res.end("nf"); } }).listen(0);
await new Promise(r => server.once("listening", r));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
const errors = [];
try {
  /* Galaxy S21 Ultra: 384×854 CSS px, DPR 3.75 (dùng DPR 2 cho nhẹ) */
  const ctx = await browser.newContext({ viewport: { width: 384, height: 854 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36" });
  const page = await ctx.newPage();
  await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] });
  async function swipe(a, b, steps = 12) {
    await touch("touchStart", a.x, a.y); await page.waitForTimeout(60);
    for (let i = 1; i <= steps; i++) { await touch("touchMove", a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps); await page.waitForTimeout(16); }
    await page.waitForTimeout(80);
    const mid = await page.evaluate(() => ({ mvok: [...document.querySelectorAll("#board .lane.mvok")].map(e => +e.dataset.lane).join(), gain: [...document.querySelectorAll("#board .mvgain")].map(e => e.dataset.mvg + "=" + e.textContent).join(), ghost: !!document.getElementById("ghost") }));
    await touch("touchEnd"); await page.waitForTimeout(250);
    return mid;
  }
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 120000 });
  await page.evaluate(() => { store.mute = true; document.getElementById("lbPlay").click(); });
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 90000 });
  await page.waitForTimeout(1500);
  /* dựng bàn: lượt 3, cả 3 chiến địa trơn, thẻ đặt từ lượt trước */
  const scene = (spec) => page.evaluate((spec) => {
    try { resetTimer(false); } catch (e) {} G.turn = 3; G.q = { p: [], a: [] }; G.phase = "play"; look = null; sel = null; moveSel = null;
    for (const L of G.locs) { L.rvl = true; L.id = "meadow"; L.gone = false; L.cards.p.length = 0; L.cards.a.length = 0; L.grant.p = 0; }
    const U = {};
    for (const [k, id, li, side] of spec) { const c = E.mk(G, id, side || "p"); c.rev = true; c.played = true; c.turn = 1; G.locs[li].cards[side || "p"].push(c); U[k] = c.uid; }
    if (U.bato) G.locs[0].grant.p = G.turn;
    render(); return U;
  }, spec).then(async (U) => { await page.waitForFunction(() => !document.querySelector("#board .mc.flip,#board .mc.land"), null, { timeout: 5000 }).catch(() => {}); return U; });
  const ctr = (sel) => page.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
  const cardAt = (u) => ctr(`#board [data-mc="${u}"]`), laneMe = (li) => ctr(`#board [data-lane="${li}"] .side.me`);
  const moves = () => page.evaluate(() => G.q.p.filter(a => a.t === "move").map(a => a.uid + ">" + a.to).join());

  for (const [name, id, from, to] of [["Dạ Hành", "dahanh", 2, 0], ["Huyễn Cơ", "huyenco", 0, 1], ["Thuỷ Ngân Nữ", "thuyngannu", 1, 2]]) {
    await test(`${name}: kéo bằng ngón tay sang chiến địa ${to} = xếp lệnh dời; chiến địa hợp lệ sáng + số sẽ nhận`, async () => {
      const U = await scene([["c", id, from]]); await page.waitForTimeout(400);
      ok(await page.evaluate(u => { const e = document.querySelector(`#board [data-mc="${u}"]`); return e && e.classList.contains("mvable") && getComputedStyle(e).touchAction === "none"; }, U.c), "thẻ dời được phải có touch-action:none");
      const mid = await swipe(await cardAt(U.c), await laneMe(to));
      ok(mid.ghost, "thẻ phải bám theo ngón tay (bóng kéo)");
      eq(mid.mvok, [0, 1, 2].filter(l => l !== from).join(), "chiến địa đích sáng");
      eq(await moves(), U.c + ">" + to, "lệnh dời đúng chiến địa thả");
    });
  }
  await test("Bà Tơ: thẻ khác tại chiến địa của Bà Tơ kéo được bằng ngón tay; Bà Tơ thì không", async () => {
    const U = await scene([["bato", "bato", 0], ["c", "da", 0]]); await page.waitForTimeout(400);
    await swipe(await cardAt(U.bato), await laneMe(2)); eq(await moves(), "", "Bà Tơ không tự dời");
    const mid = await swipe(await cardAt(U.c), await laneMe(2)); eq(mid.mvok, "1,2"); eq(await moves(), U.c + ">2");
  });
  await test("Chuỳ Ánh Sáng: lúc kéo hiện số sẽ nhận tại từng chiến địa (+2 mỗi thẻ địch)", async () => {
    const U = await scene([["c", "quangchuy", 0], ["f1", "da", 1, "a"], ["f2", "da", 1, "a"]]);
    await page.evaluate(u => { const f = E.find(G, u); f.inst.free = G.turn; render(); }, U.c); await page.waitForTimeout(400);
    const mid = await swipe(await cardAt(U.c), await laneMe(1)); eq(mid.gain, "1=+4,2=+0"); eq(await moves(), U.c + ">1");
  });
  await test("Thả ngoài chiến địa hợp lệ -> thẻ về chỗ cũ, không có lệnh dời", async () => {
    const U = await scene([["c", "dahanh", 0]]); await page.waitForTimeout(400);
    const a = await cardAt(U.c); await swipe(a, { x: a.x, y: 40 });
    eq(await moves(), ""); eq(await page.evaluate(u => E.locOf(G, E.find(G, u).inst), U.c), 0);
    ok(await page.evaluate(() => !document.getElementById("ghost") && !document.querySelector("#board .mc.mvsrc")), "không sót bóng kéo");
  });
  await test("Thẻ không dời được: kéo không làm gì (không bóng kéo, không lệnh dời)", async () => {
    const U = await scene([["c", "da", 0]]); await page.waitForTimeout(400);
    ok(await page.evaluate(u => !document.querySelector(`#board [data-mc="${u}"]`).classList.contains("mvable"), U.c));
    const mid = await swipe(await cardAt(U.c), await laneMe(1)); ok(!mid.ghost); eq(await moves(), "");
  });
  await test("Chạm nhẹ thẻ dời được vẫn mở bảng thông tin; cách dự phòng 'Dời thẻ' -> chạm chiến địa vẫn chạy", async () => {
    const U = await scene([["c", "dahanh", 0]]); await page.waitForTimeout(400);
    const a = await cardAt(U.c); await page.touchscreen.tap(a.x, a.y);
    await page.waitForFunction(() => look && look.kind === "card", null, { timeout: 3000 }); await page.waitForTimeout(800); /* bảng thông tin trượt vào xong */
    const b = await ctr('[data-do="move"]'); ok(b, "có nút Dời thẻ");     await page.touchscreen.tap(b.x, b.y); await page.waitForTimeout(200);
    eq(await page.evaluate(() => moveSel), U.c, "đang chọn dời"); await page.waitForTimeout(400);
    eq(await page.evaluate(() => look), null, "bảng thông tin đóng để chạm chiến địa");
    const l = await laneMe(2);
    await page.touchscreen.tap(l.x, l.y); await page.waitForTimeout(200);
    eq(await moves(), U.c + ">2");
  });
  /* gpu71 (L1): kéo dời kiểu Marvel Snap — thả xong thẻ nằm NGAY ở chiến địa đích (DOM), kết thúc lượt vào đúng chiến địa/ô đó, không nhảy về chỗ cũ */
  const laneOf = (u) => page.evaluate(u => { const e = document.querySelector(`#board [data-mc="${u}"]`); const l = e && e.closest("[data-lane]"); return l ? +l.dataset.lane : -1; }, u);
  const slotOf = (u) => page.evaluate(u => { const e = document.querySelector(`#board [data-mc="${u}"]`); const sl = e && e.closest(".slot"); return sl ? [...sl.parentElement.children].indexOf(sl) : -1; }, u);
  await test("Thả xong: thẻ hiện ngay ở chiến địa đích (ô cũ trống); kết thúc lượt -> engine đúng chiến địa + ô hiển thị, không nhảy về chỗ cũ", async () => {
    const U = await scene([["c", "dahanh", 2], ["x", "da", 0]]); await page.waitForTimeout(400);
    await page.evaluate(() => { G.hand.p = []; G.hand.a = []; render(); });
    await swipe(await cardAt(U.c), await laneMe(0));
    eq(await moves(), U.c + ">0", "lệnh dời");
    eq(await laneOf(U.c), 0, "thẻ nằm ngay ở chiến địa đích trong DOM");
    const sl = await slotOf(U.c); eq(sl, 1, "ô đích ngay sau thẻ đã có");
    ok(await page.evaluate(u => document.querySelector(`#board [data-mc="${u}"]`).classList.contains("qmvin"), U.c), "có dấu đang dời");
    eq(await page.evaluate(() => document.querySelectorAll('#board [data-lane="2"] .side.me .mc').length), 0, "ô cũ trống");
    /* theo dõi DOM suốt lúc giải lượt: thẻ không bao giờ quay về chiến địa cũ */
    await page.evaluate(u => { window.__jump = 0; window.__jt = setInterval(() => { const e = document.querySelector(`#board [data-mc="${u}"]`); const l = e && e.closest("[data-lane]"); if (l && +l.dataset.lane === 2) window.__jump++; }, 30); document.getElementById("btnEnd").click(); }, U.c);
    await page.waitForFunction(() => !TURN_BUSY && G.phase === "play", null, { timeout: 120000 });
    await page.waitForTimeout(400);
    const r = await page.evaluate(u => { clearInterval(window.__jt); const f = E.find(G, u); return { li: f && f.li, ix: f ? G.locs[f.li].cards.p.indexOf(f.inst) : -1, jump: window.__jump }; }, U.c);
    eq(r.li, 0, "engine: thẻ ở chiến địa đích"); eq(r.ix, sl, "engine: cùng ô đã hiển thị"); eq(r.jump, 0, "không nhảy về chỗ cũ lúc giải lượt");
    eq(await laneOf(U.c), 0, "DOM sau lượt");
  });
  await test("Kéo lại thẻ đang chờ dời: sang chiến địa khác = đổi lệnh; về chiến địa gốc = huỷ; hoàn tác rút lệnh dời", async () => {
    const U = await scene([["c", "dahanh", 2]]); await page.waitForTimeout(400);
    await swipe(await cardAt(U.c), await laneMe(0)); eq(await moves(), U.c + ">0");
    await swipe(await cardAt(U.c), await laneMe(1)); eq(await moves(), U.c + ">1", "đổi đích"); eq(await laneOf(U.c), 1);
    await swipe(await cardAt(U.c), await laneMe(2)); eq(await moves(), "", "về gốc = huỷ dời"); eq(await laneOf(U.c), 2);
    await swipe(await cardAt(U.c), await laneMe(0)); eq(await moves(), U.c + ">0");
    await page.evaluate(() => undoLastUI()); await page.waitForTimeout(150);
    eq(await moves(), "", "hoàn tác"); eq(await laneOf(U.c), 2, "hoàn tác -> thẻ về chỗ cũ");
  });
  await test("Ô đích đã đầy (tính cả thẻ đặt/dời đang chờ) thì không nhận dời", async () => {
    const U = await scene([["c", "dahanh", 2], ["a1", "da", 0], ["a2", "da", 0], ["a3", "da", 0]]); await page.waitForTimeout(300);
    const h = await page.evaluate(() => { const c = E.mk(G, "da", "p"); G.hand.p = [c]; G.energy.p = 10; render(); return E.queuePlay(G, "p", c.uid, 0); });
    ok(h, "đặt thẻ thứ 4 vào chiến địa 1");
    eq(await page.evaluate(u => E.moveTargets(G, "p", u).join(), U.c), "1", "chiến địa 1 đã kín (thẻ đặt chờ lật giữ chỗ)");
    await page.evaluate(u => { G.q.p.length = 0; E.queueMove(G, "p", u, 1); const c = E.mk(G, "da", "p"); G.hand.p = [c]; }, U.c);
    eq(await page.evaluate(() => [0, 1].map(li => G.locs[li].cards.p.length).join()), "3,0");
  });
  ok(!errors.length, errors.join("\n"));
} catch (e) { fails.push("ui: " + e.message); console.error(e); }
finally { await browser.close(); server.close(); }
console.log(`\n${pass} đạt, ${fails.length} lỗi`);
if (fails.length) process.exit(1);
