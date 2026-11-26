// Smoke test giao diện bằng Playwright (chromium, 412x915).
// Chạy: npx playwright install chromium && node tests/ui-smoke.mjs   (CHROME_PATH để dùng Chrome có sẵn)
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const out = process.env.ARTIFACTS_DIR || path.join(here, "artifacts");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".webmanifest": "application/manifest+json" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p));
    if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
await mkdir(out, { recursive: true });

const errors = [];
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' })); /* gpu52: không gọi máy chủ online thật */
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY/.test(m.text()) && !/\/sfx\/thoai/.test(m.location().url || "")) errors.push("console.error: " + m.text()); });
page.on("requestfailed", r => { if (r.url().startsWith(url.replace(/index\.html$/, ""))) errors.push("requestfailed: " + r.url()); }); // bỏ qua host ngoài (Google Fonts) khi chạy offline
page.on("response", r => { if (r.status() >= 400 && !/\/sfx\/thoai/.test(r.url())) errors.push("http " + r.status() + ": " + r.url()); });
const shot = n => page.screenshot({ path: path.join(out, n + ".png") }).catch(() => {});
const step = s => console.log("• " + s);
const click = id => page.evaluate(i => document.getElementById(i).click(), id);
let failed = false;
try {
  step("mở trang");
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 120000 });
  await page.waitForTimeout(1500); await shot("01-lobby");

  step("cài đặt ở sảnh");
  await click("lbMute"); await page.waitForSelector("#ovSet.on", { timeout: 5000 }); await shot("02-settings-lobby");
  await page.evaluate(() => document.getElementById("ovSet").classList.remove("on"));

  step("vào trận");
  await click("lbPlay");
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 60000 });
  await page.waitForTimeout(2500); await shot("03-match");

  step("cài đặt trong trận");
  await click("btnMute"); await page.waitForSelector("#ovSet.on", { timeout: 5000 }); await shot("04-settings-match");
  await page.evaluate(() => document.getElementById("ovSet").classList.remove("on"));

  step("nghĩa địa");
  await click("btnPiles"); await page.waitForSelector("#ovPiles.on", { timeout: 5000 }); await shot("05-piles");
  await page.evaluate(() => document.getElementById("ovPiles").classList.remove("on"));

  const t0 = Date.now(), CAP = 8 * 60 * 1000;
  for (let g = 1; g <= 2; g++) {
    step("ván " + g);
    let guard = 0;
    while (Date.now() - t0 < CAP) {
      const ph = await page.evaluate(() => G.phase);
      if (ph === "over") break;
      if (ph === "play") await page.evaluate(() => { E.aiPlan(G, "p", 60); render(); document.getElementById("btnEnd").click(); });
      await page.waitForTimeout(250);
      if (++guard % 40 === 0) await shot(`06-game${g}-t${guard}`);
    }
    const r = await page.evaluate(() => ({ phase: G.phase, turn: G.turn, res: G.result && G.result.winner }));
    if (r.phase !== "over") throw new Error(`ván ${g} chưa kết thúc (phase=${r.phase}, turn=${r.turn})`);
    console.log(`  ván ${g}: thắng=${r.res} lượt=${r.turn} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    await page.waitForTimeout(1500); await shot(`07-game${g}-over`);
    if (g < 2) {
      await page.evaluate(() => document.getElementById("btnEnd").click());
      await page.waitForFunction(() => G.phase === "play", null, { timeout: 30000 }).catch(async () => { await click("btnEnd"); });
      await page.waitForFunction(() => G.phase === "play", null, { timeout: 30000 });
      await page.waitForTimeout(2500);
    }
  }

  /* Luật kéo thẻ: thẻ được kéo/đưa vào chiến địa bằng hiệu ứng phải lật + chạy kỹ năng, giao diện diễn được (không lỗi) */
  step("luật kéo thẻ: dàn cảnh Long Chủ / Bát Tý / Ma Tốc / Pháo Hoa Nữ rồi chạy lượt trên giao diện");
  await page.evaluate(() => document.getElementById("btnEnd").click());
  await page.waitForFunction(() => G.phase === "play", null, { timeout: 30000 }).catch(async () => { await click("btnEnd"); });
  await page.waitForFunction(() => G.phase === "play", null, { timeout: 30000 });
  await page.waitForTimeout(2000);
  const sc = await page.evaluate(() => {
    const mk = (s, id) => E.mk(G, id, s);
    for (const s of ["p", "a"]) { G.hand[s] = []; for (const L of G.locs) L.cards[s] = []; G.disc[s] = []; }
    G.locs.forEach(L => { L.rvl = true; L.id = "meadow"; });
    G.locs[2].id = "watch";
    G.energy.p = 30; G.energy.a = 0; /* đối thủ không đánh thẻ -> kết quả không phụ thuộc AI ngẫu nhiên */
    const lc = mk("p", "longchu"), so = mk("p", "soinu"), bt = mk("p", "batty"), mt = mk("p", "matoc"), ph = mk("p", "phaohoanu");
    const dn = mk("a", "dichnu"); G.hand.a.push(dn);
    const so2 = mk("p", "soinu"); G.disc.p.push(so2);
    const top = mk("p", "dichnu"); G.deck.p.push(top);
    G.hand.p.push(lc, so, bt, mt, ph);
    const q = (c, li) => E.queuePlay(G, "p", c.uid, li);
    const okq = [q(lc, 0), q(bt, 0), q(mt, 1), q(ph, 1)];
    render();
    return { turn0: G.turn, okq, uids: { so: so.uid, dn: dn.uid, so2: so2.uid, top: top.uid } };
  });
  if (sc.okq.some(x => !x)) throw new Error("không dàn được cảnh luật kéo thẻ: " + JSON.stringify(sc.okq));
  await page.evaluate(() => document.getElementById("btnEnd").click());
  /* bấm Kết thúc lượt có thể chờ hoạt ảnh đặt thẻ trước khi chạy lượt -> chờ lượt thật sự bắt đầu rồi mới chờ xong */
  await page.waitForFunction(t => G.phase === "over" || (G.phase === "play" && G.turn > t), sc.turn0, { timeout: 120000 });
  await page.waitForTimeout(1500); await shot("08-luat-keo-the");
  const chk = await page.evaluate(u => {
    const f = id => E.find(G, id);
    const so = f(u.so), dn = f(u.dn), so2 = f(u.so2), top = f(u.top);
    return { so: so && [so.li, so.inst.rev, so.inst.bonus], dn: dn && [dn.li, dn.inst.side, dn.inst.rev], so2: so2 && [so2.li, so2.inst.rev, so2.inst.bonus], top: top && [top.li, top.inst.rev] };
  }, sc.uids);
  console.log("  kết quả: " + JSON.stringify(chk));
  if (!chk.so || !chk.so[1]) throw new Error("Sói Nữ được Long Chủ kéo không lên bàn/không lật");
  if (!chk.dn || chk.dn[1] !== "a" || !chk.dn[2]) throw new Error("Bát Tý không kéo thẻ đối thủ về phía họ");
  if (!chk.so2 || !chk.so2[1]) throw new Error("Ma Tốc không hồi sinh");
  if (!chk.top || !chk.top[1]) throw new Error("Pháo Hoa Nữ không đưa thẻ bộ bài vào");

  /* (a) Hồi sinh: Phượng Hoả ở chiến địa ĐẦY + Vô Thường được Quan Thượng Thư tạo ra -> thẻ hồi sinh lên bàn, có diễn "revive" */
  step("hồi sinh: Phượng Hoả (chiến địa đầy) + Vô Thường (thẻ được tạo ra) trên giao diện");
  await page.waitForFunction(() => G.phase === "play", null, { timeout: 30000 });
  await page.evaluate(() => { window.__fxk = []; if (!window.__fxw) { window.__fxw = 1; const o = window.playFx; window.playFx = function (evs) { try { for (const e of evs || []) window.__fxk.push(e.k + ":" + e.uid); } catch (x) { } return o.apply(this, arguments); }; } });
  const rv = await page.evaluate(() => {
    const mk = (s, id) => E.mk(G, id, s), put = (s, id, li) => { const c = mk(s, id); c.rev = true; c.turn = 1; c.played = true; G.locs[li].cards[s].push(c); return c; };
    for (const s of ["p", "a"]) { G.hand[s] = []; for (const L of G.locs) L.cards[s] = []; G.disc[s] = []; G.dead[s] = []; }
    G.locs.forEach(L => { L.rvl = true; L.id = "meadow"; }); G.energy.p = 30; G.energy.a = 0;
    const dead = ["thachquai", "chanthu", "docnhan"].map(id => { const c = put("p", id, 2); E.destroy(G, c, 2); return c; });
    for (let k = 0; k < 3; k++) put("p", "ongnu", 0);
    const ph = mk("p", "phuonghoa"), vt = mk("p", "tuthanmienvien"); vt.cr = true; vt.by = "dacvutruong";
    G.hand.p.push(ph, vt);
    const okq = [E.queuePlay(G, "p", ph.uid, 0), E.queuePlay(G, "p", vt.uid, 1)]; render();
    return { turn0: G.turn, okq, dead: dead.map(c => c.uid), ph: ph.uid, nDead: G.dead.p.length };
  });
  if (rv.okq.some(x => !x) || rv.nDead !== 3) throw new Error("không dàn được cảnh hồi sinh: " + JSON.stringify(rv));
  await page.evaluate(() => document.getElementById("btnEnd").click());
  await page.waitForFunction(t => G.phase === "over" || (G.phase === "play" && G.turn > t), rv.turn0, { timeout: 120000 });
  await page.waitForTimeout(1200); await shot("09-hoi-sinh");
  const rvc = await page.evaluate(u => ({
    on: u.dead.map(x => { const f = E.find(G, x); const el = document.querySelector(`#board [data-mc="${x}"]`); return f ? [f.li, f.inst.rev, !!el && getComputedStyle(el).opacity !== "0"] : null; }),
    ph: !!E.find(G, u.ph), dead: G.dead.p.length, fx: window.__fxk.filter(k => k.startsWith("revive:")),
  }), rv);
  console.log("  kết quả: " + JSON.stringify(rvc));
  if (rvc.on.some(x => !x || !x[1] || !x[2])) throw new Error("thẻ bị tiêu huỷ không được hồi sinh lên bàn / không hiện");
  if (rvc.ph) throw new Error("Phượng Hoả phải hợp thể (rời bàn)");
  if (rvc.dead !== 0) throw new Error("đống tiêu huỷ phải trống");
  for (const x of rv.dead) if (!rvc.fx.includes("revive:" + x)) throw new Error("thiếu diễn hoạt hồi sinh cho uid " + x);

  /* (b) Hoàn tác theo ngăn xếp: đặt 3 thẻ, kéo thẻ 1 -> bị chặn; chạm rút 3, 2, 1 lần lượt -> được */
  step("hoàn tác theo ngăn xếp: đặt 3 thẻ, kéo thẻ đầu bị chặn, rút 3-2-1");
  await page.waitForFunction(() => G.phase === "play" && !TURN_BUSY, null, { timeout: 30000 }); /* fix55: chờ hết lượt đang diễn */
  const ud = await page.evaluate(() => {
    for (const L of G.locs) { L.cards.p = []; L.cards.a = []; L.id = "meadow"; L.rvl = true; }
    G.q.p = []; G.hand.p = []; G.energy.p = 10;
    const cs = ["taymaynu", "chanthu", "docnhan"].map(id => { const c = E.mk(G, id, "p"); G.hand.p.push(c); return c; });
    const okq = cs.map((c, i) => E.queuePlay(G, "p", c.uid, i)); render();
    return { okq, u: cs.map(c => c.uid) };
  });
  if (ud.okq.some(x => !x)) throw new Error("không đặt được 3 thẻ: " + JSON.stringify(ud.okq));
  await page.waitForTimeout(700);
  const qst = () => page.evaluate(() => ({ q: G.q.p.map(a => a.uid), hand: G.hand.p.map(c => c.uid), lock: G.q.p.map(a => { const e = document.querySelector(`#board [data-mc="${a.uid}"]`); return e ? e.classList.contains("qlock") : null; }), undo: !document.getElementById("btnUndo").hidden, toast: (document.getElementById("toastX") || {}).textContent || "" }));
  let s0 = await qst();
  if (JSON.stringify(s0.lock) !== "[true,true,false]") throw new Error("thẻ đặt trước phải có dấu khoá, thẻ cuối thì không: " + JSON.stringify(s0.lock));
  if (!s0.undo) throw new Error("thiếu nút Hoàn tác khi có hành động");
  const b1 = await page.locator(`#board [data-mc="${ud.u[0]}"]`).boundingBox();
  await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2); await page.mouse.down();
  await page.mouse.move(b1.x + b1.width / 2 + 30, b1.y + b1.height / 2 + 80, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(250);
  let s1 = await qst();
  if (s1.q.length !== 3 || !/Rút lại thẻ đặt sau trước/.test(s1.toast)) throw new Error("kéo thẻ đặt đầu tiên phải bị chặn + nhắc: " + JSON.stringify(s1));
  await page.locator(`#board [data-mc="${ud.u[0]}"]`).click(); await page.waitForTimeout(150);
  if ((await qst()).q.length !== 3) throw new Error("chạm thẻ đặt đầu tiên không được rút");
  for (const k of [2, 1, 0]) {
    await page.locator(`#board [data-mc="${ud.u[k]}"]`).click(); await page.waitForTimeout(200);
    const s = await qst();
    if (s.q.length !== k || !s.hand.includes(ud.u[k])) throw new Error(`rút thẻ ${k + 1} thất bại: ` + JSON.stringify(s));
  }
  const s2 = await qst(); if (s2.undo) throw new Error("hết hành động thì ẩn nút Hoàn tác");
  if (await page.evaluate(() => G.energy.p) !== 10) throw new Error("năng lượng không trả đủ");
  await shot("10-hoan-tac");
  console.log("  hoàn tác: OK");
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.message); await shot("99-failure"); }
await browser.close(); server.close();
const uniq = [...new Set(errors)];
if (uniq.length) { console.error("Lỗi trang:\n" + uniq.slice(0, 30).join("\n")); failed = true; }
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
