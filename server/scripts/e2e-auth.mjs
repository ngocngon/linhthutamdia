// Thử đầu-cuối trận online DO MÁY CHỦ GIỮ TRẠNG THÁI: hai Chrome headless, ghép trận, tự chơi hết ván;
// giữa trận cắt kết nối máy A (tự nối lại) và TẢI LẠI TRANG máy B (vào lại trận); quét mọi tin WebSocket xem có lộ thông tin ẩn.
// Cần: máy chủ chạy (npx wrangler dev --local ... với ADMIN_TOKEN), Playwright. Chạy: SERVER=http://localhost:8787 node scripts/e2e-auth.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const SERVER = process.env.SERVER || "http://localhost:8787";
const ADMIN = process.env.ADMIN_TOKEN || "dev-admin-token-123456";
const WWW = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../www");
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require(process.env.PW_PATH || "playwright")); } catch { ({ chromium } = require("/home/claude/linhthutamdia/tests/node_modules/playwright")); }
const SHOTS = process.env.SHOTS || "/tmp/ltd-shots-auth"; fs.mkdirSync(SHOTS, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".woff2": "font/woff2" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
  const f = path.join(WWW, p);
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": mime[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(0);
await new Promise((r) => srv.once("listening", r));
const GAME = `http://127.0.0.1:${srv.address().port}/index.html?server=${encodeURIComponent(SERVER)}`;
async function admin(method, p, body) { const r = await fetch(SERVER + p, { method, headers: { "x-admin-token": ADMIN, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, json: await r.json().catch(() => ({})) }; }
const sfx = Date.now().toString(36).slice(-5), users = [`xa${sfx}`, `xb${sfx}`], toks = [];
for (const u of users) {
  const r = await admin("POST", "/api/admin/users", { username: u, password: "e2e-pass-123", display: "Tester " + u }); if (r.status !== 201) throw new Error("tạo tài khoản lỗi " + JSON.stringify(r));
  toks.push(await (await fetch(SERVER + "/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: u, password: "e2e-pass-123" }) })).json());
}
const browser = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const errors = [];
const DECKS = [null, null];
async function mkPage(name, i) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(([tok, user]) => {
    if (!sessionStorage.getItem("e2e.init")) { localStorage.setItem("ltd.cf.token", tok); localStorage.setItem("ltd.cf.user", JSON.stringify(user)); sessionStorage.setItem("e2e.init", "1"); }
    /* ghi lại mọi tin phòng trận nhận được (quét rò rỉ) */
    const WS = window.WebSocket; window.__rx = JSON.parse(sessionStorage.getItem("e2e.rx") || "[]");
    window.WebSocket = function (u, p) { const w = new WS(u, p); if (/room=/.test(u)) w.addEventListener("message", (e) => { window.__rx.push(e.data); }); return w; };
    window.WebSocket.prototype = WS.prototype; Object.assign(window.WebSocket, { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2 });
    addEventListener("beforeunload", () => { try { sessionStorage.setItem("e2e.rx", JSON.stringify(window.__rx)); } catch (e) {} });
  }, [toks[i].token, toks[i].user]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(name + " pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/status of 40[14]|ERR_|Failed to load resource/.test(m.text())) errors.push(name + " console: " + m.text()); });
  await page.goto(GAME);
  await page.waitForFunction(() => typeof G !== "undefined" && G && typeof OL === "object", null, { timeout: 30000 });
  return page;
}
const auto = () => {
  clearInterval(window.__auto); window.__tc = { t: -1, at: 0 };
  window.__auto = setInterval(() => {
    try {
      if (!G || !G.online || G.phase !== "play" || OL.st !== "play") return;
      if (window.__tc.t !== G.turn) { window.__tc = { t: G.turn, at: Date.now() }; return; }
      if (OL.sub || OL.resolving || document.querySelector("#mm.on") || Date.now() - window.__tc.at < 1800) return;
      if (window.__lastTurn !== G.turn) { window.__lastTurn = G.turn; for (const c of G.hand.p.slice()) { for (const li of [0, 1, 2].sort(() => Math.random() - 0.5)) if (E.queuePlay(G, "p", c.uid, li)) break; } if (G.turn === 4 && !G.snap.p && Math.random() < 0.5) { G.snap.p = true; G.pendingDouble++; } }
      endTurnUI(true);
    } catch (e) { window.__err = String(e && e.stack || e); }
  }, 700);
};
const pa = await mkPage("A", 0), pb = await mkPage("B", 1);
/* B dùng bộ bài khác hẳn A (để quét rò rỉ có ý nghĩa) */
await pb.evaluate(() => { const own = new Set(store.deck); const pool = E.COLLECT.filter((id) => !own.has(id) && !C[id].tok && C[id].c <= 4); store.deck = pool.sort(() => Math.random() - 0.5).slice(0, 12); });
for (const [i, p] of [[0, pa], [1, pb]]) DECKS[i] = await p.evaluate(() => store.deck.slice(0, 12));
for (const p of [pa, pb]) await p.evaluate(() => document.getElementById("modeOnline").click());
await Promise.all([pa, pb].map((p) => p.waitForFunction(() => OL.st === "play" && G && G.online, null, { timeout: 60000 })));
const auth = await Promise.all([pa, pb].map((p) => p.evaluate(() => !!OL.auth)));
console.log("đã ghép trận, máy chủ giữ trạng thái:", auth.join("/"));
await pa.screenshot({ path: `${SHOTS}/1-trong-tran-A.png` });
for (const p of [pa, pb]) await p.evaluate(auto);
/* cắt kết nối A ở lượt 2 */
await pa.waitForFunction(() => G.turn >= 2, null, { timeout: 120000, polling: 300 });
await pa.evaluate(() => { window.__cut = LTD_CF.conns.filter((c) => c.up).length; LTD_CF.conns.forEach((c) => c.ws && c.ws.close(4999)); });
console.log("đã cắt kết nối máy A ở lượt", await pa.evaluate(() => G.turn));
/* tải lại trang B ở lượt 4 */
await pb.waitForFunction(() => G.turn >= 4 && !OL.resolving, null, { timeout: 180000, polling: 300 });
const before = await pb.evaluate(() => ({ t: G.turn, hand: G.hand.p.map((c) => c.uid + c.id).join(), board: G.locs.map((L) => L.cards.p.concat(L.cards.a).map((c) => c.uid + ":" + c.id).join()).join("|") }));
if (process.env.DEBUG) console.log("B trước tải lại:", await pb.evaluate(() => JSON.stringify({ sv: localStorage.getItem("linhthu.olm.auth"), st: OL.st, auth: OL.auth, mid: OL.mid, t: typeof auSave })));
await pb.reload();
try { await pb.waitForFunction(() => typeof OL === "object" && OL.st === "play" && OL.auth && G && G.online, null, { timeout: 30000, polling: 300 }); }
catch (e) { console.log("B sau tải lại:", JSON.stringify(await pb.evaluate(() => ({ st: OL.st, auth: OL.auth, mid: OL.mid, sv: localStorage.getItem("linhthu.olm.auth"), conns: LTD_CF.conns.map((c) => c.q + ":" + c.up), mm: document.getElementById("mmBig").textContent })))); console.log(errors.join("\n")); throw e; }
const after = await pb.evaluate(() => ({ t: G.turn, hand: G.hand.p.map((c) => c.uid + c.id).join(), board: G.locs.map((L) => L.cards.p.concat(L.cards.a).map((c) => c.uid + ":" + c.id).join()).join("|") }));
console.log("tải lại trang B: lượt", before.t, "->", after.t, after.t === before.t && after.hand === before.hand && after.board === before.board ? "(bản nhìn giữ nguyên)" : "(đã sang lượt khác)");
await pb.waitForFunction(() => !document.querySelector("#mm.on") && document.querySelectorAll("#hand .gc, #hand > *").length > 0, null, { timeout: 20000 }).catch(() => {}); await new Promise((r) => setTimeout(r, 2500));
await pb.screenshot({ path: `${SHOTS}/2-B-sau-tai-lai.png` });
await pb.evaluate(auto);
await Promise.all([pa, pb].map((p) => p.waitForFunction(() => G.phase === "over", null, { timeout: 300000, polling: 500 })));
console.log("ván kết thúc ở cả hai máy");
await pa.screenshot({ path: `${SHOTS}/3-ket-qua-A.png` }); await pb.screenshot({ path: `${SHOTS}/4-ket-qua-B.png` });
const res = [];
for (const p of [pa, pb]) res.push(await p.evaluate(() => ({ winner: G.result.winner, kind: G.result.kind, turn: G.turn, err: window.__err || "", note: OL.note || "", rx: window.__rx, cut: window.__cut,
  board: G.locs.map((L) => [L.id, L.cards.p.map((c) => c.uid + ":" + c.id), L.cards.a.map((c) => c.uid + ":" + c.id)]) })));
let ok = true; const fail = (m) => { ok = false; console.log("HỎNG:", m); };
for (const r of res) if (r.err) fail("lỗi trong trang: " + r.err);
const [wa, wb] = [res[0].winner, res[1].winner];
if (!((wa === "p" && wb === "a") || (wa === "a" && wb === "p") || (wa === wb && wa === "draw"))) fail("kết quả hai bên không khớp: " + wa + "/" + wb);
/* bàn cuối hai bên phải là ảnh gương của nhau */
const mir = res[1].board.map(([id, p, a]) => [id, a, p]);
if (JSON.stringify(mir) !== JSON.stringify(res[0].board)) fail("bàn cuối hai bên khác nhau");
/* quét rò rỉ: mọi tin phòng trận của mỗi bên */
for (const [i, r] of res.entries()) {
  const mine = new Set(DECKS[i]), opp = DECKS[1 - i], pub = new Set();
  let n = 0, bytes = 0;
  for (const raw of r.rx) {
    n++; bytes += raw.length; let m; try { m = JSON.parse(raw); } catch { continue; }
    if (/"rs":|"seed"/.test(raw)) fail(`${"AB"[i]}: tin chứa hạt giống`);
    const views = m.type === "state" ? [m.v] : m.type === "turn" ? m.frames.map((f) => f.v) : [];
    for (const v of views) {
      if (v.hand.a.some((c) => c.id !== "__an") || v.deck.a.some((c) => c.id !== "__an") || v.deck.p.some((c) => c.id !== "__an")) fail(`${"AB"[i]}: tay/bộ bài bị lộ`);
      for (const L of v.locs) for (const c of L.cards.a) { if (!c.rev && c.id !== "__an") fail(`${"AB"[i]}: thẻ úp đối thủ lộ`); if (c.rev) pub.add(c.id); }
      for (const z of ["disc", "dead"]) for (const c of v[z].a || []) pub.add(c.id);
      for (const c of v.hand.p) mine.add(c.id);
    }
    if (m.type === "peers" && /"dk"/.test(raw)) fail(`${"AB"[i]}: presence đối thủ còn bộ bài`);
  }
  const all = r.rx.filter((x) => /^\{"type":"(state|turn)"/.test(x)).join("\n"); /* kênh trận; ảnh đại diện người chơi tự chọn trong presence là hồ sơ công khai */
  for (const id of opp) if (!mine.has(id) && !pub.has(id) && all.includes(`"${id}"`)) fail(`${"AB"[i]}: lộ thẻ chưa lật "${id}" của đối thủ`);
  console.log(`${"AB"[i]}: ${n} tin phòng trận, ${Math.round(bytes / 1024)} KB; thẻ đối thủ đã lộ ${[...pub].filter((x) => opp.includes(x)).length}/${new Set(opp).size}`);
}
await new Promise((r) => setTimeout(r, 2500));
const ul = await admin("GET", "/api/admin/users"); const rec = ul.json.users.filter((u) => users.includes(u.username));
console.log("máy chủ ghi nhận:", rec.map((u) => `${u.username}=${u.rating}/${u.games} ván`).join(", "));
if (!rec.every((u) => u.games === 1)) fail("máy chủ chưa ghi nhận trận");
if (errors.length) { console.log("lỗi console/trang:\n" + errors.slice(0, 12).join("\n")); fail("có lỗi trên trang"); }
await browser.close(); srv.close();
console.log(ok ? "E2E-AUTH ĐẠT" : "E2E-AUTH HỎNG"); process.exit(ok ? 0 : 1);
