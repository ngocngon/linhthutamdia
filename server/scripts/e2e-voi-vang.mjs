// Thử đầu-cuối "vội vàng": như e2e.mjs nhưng bot bấm Kết thúc lượt ngay cả khi hoạt ảnh đầu lượt chưa xong (bắt lỗi lệch đồng bộ đã sửa ở gpu22).
// Cần: máy chủ chạy (npm run dev) ở SERVER, thư mục www phục vụ ở GAME, và Playwright (PW_PATH, mặc định "playwright").
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const SERVER = process.env.SERVER || "http://localhost:8787";
const GAME_PORT = +(process.env.GAME_PORT || 8795);
const ADMIN = process.env.ADMIN_TOKEN || "dev-admin-token-123456";
const WWW = process.env.WWW ? path.resolve(process.env.WWW) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../www");
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH || "playwright");
const SHOTS = process.env.SHOTS || "/tmp/ltd-shots";
fs.mkdirSync(SHOTS, { recursive: true });

const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(WWW, p);
  if (!f.startsWith(WWW) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": mime[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(GAME_PORT);

async function admin(method, p, body) {
  const r = await fetch(SERVER + p, { method, headers: { "x-admin-token": ADMIN, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}
const sfx = Date.now().toString(36).slice(-5);
const users = [`ea${sfx}`, `eb${sfx}`];
for (const u of users) {
  const r = await admin("POST", "/api/admin/users", { username: u, password: "e2e-pass-123", display: "Tester " + u });
  if (r.status !== 201) throw new Error("tạo tài khoản lỗi " + JSON.stringify(r));
}
console.log("đã tạo", users.join(", "));

const browser = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const errors = [];
const BASE = !!process.env.BASELINE; // chạy kênh giả lập 2 tab (không máy chủ) để so sánh
let sharedCtx = null;
async function mkPage(name, u) {
  const ctx = BASE ? (sharedCtx ||= await browser.newContext({ viewport: { width: 390, height: 780 } })) : await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(name + " pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/status of 401/.test(m.text())) errors.push(name + " console: " + m.text()); });
  await page.goto(`http://localhost:${GAME_PORT}/index.html` + (BASE ? "" : `?server=${encodeURIComponent(SERVER)}`));
  await page.waitForFunction(() => typeof G !== "undefined" && G, null, { timeout: 30000 });
  if (BASE) return page;
  // đăng nhập bằng giao diện thật
  await page.evaluate(() => document.getElementById("btnProfile").click());
  await page.waitForSelector('#accBox [data-cf="login"]');
  if (name === "A") await page.screenshot({ path: `${SHOTS}/1-profile-chua-dang-nhap.png` });
  await page.click('#accBox [data-cf="login"]');
  await page.waitForSelector("#cfU");
  if (name === "A") await page.screenshot({ path: `${SHOTS}/2-man-dang-nhap.png` });
  await page.fill("#cfU", u);
  await page.fill("#cfP", name === "A" ? "sai-mat-khau" : "e2e-pass-123");
  await page.click('#accBody [data-cf="go"]');
  if (name === "A") {
    await page.waitForFunction(() => /Sai tên/.test(document.getElementById("cfE").textContent), null, { timeout: 15000 });
    if (name === "A") await page.screenshot({ path: `${SHOTS}/3-sai-mat-khau.png` });
    await page.fill("#cfP", "e2e-pass-123");
    await page.click('#accBody [data-cf="go"]');
  }
  await page.waitForFunction(() => !document.getElementById("ovAcc").classList.contains("on"), null, { timeout: 15000 });
  await page.waitForFunction((u) => document.getElementById("accBox").textContent.includes("@" + u), u, { timeout: 15000 });
  if (name === "A") await page.screenshot({ path: `${SHOTS}/4-da-dang-nhap.png` });
  await page.evaluate(() => document.querySelector("#ovProfile").classList.remove("on"));
  return page;
}
const pa = await mkPage("A", users[0]);
const pb = await mkPage("B", users[1]);
console.log("cả hai đã đăng nhập");
// đồng bộ tiến trình: liên kết tài khoản rồi đọc lại bằng REST
await pa.evaluate(() => accLink());
await pa.waitForFunction(() => accLinked() && !ACC.busy && ACC.last, null, { timeout: 15000 });
const tokA = await pa.evaluate(() => localStorage.getItem("ltd.cf.token"));
const sv = await (await fetch(SERVER + "/api/save", { headers: { authorization: "Bearer " + tokA } })).json();
if (!sv.blob || !JSON.parse(JSON.parse(sv.blob).s).deck) throw new Error("tiến trình chưa lên máy chủ");
console.log("đồng bộ tiến trình đạt, phiên bản", sv.version);

for (const p of [pa, pb]) await p.evaluate(() => { document.getElementById("modeOnline").click(); });
await Promise.all([pa, pb].map((p) => p.waitForFunction(() => OL.st === "play" && G && G.online, null, { timeout: 60000 })));
console.log("đã ghép trận, đang chơi");
await pa.screenshot({ path: `${SHOTS}/5-trong-tran.png` });

// tự chơi: mỗi lượt đặt thẻ bằng aiPlan rồi kết thúc lượt
const auto = () => {
  window.__auto = setInterval(() => {
    try {
      if (!G || !G.online || G.phase !== "play") return;
      if (OL.sub || OL.resolving || document.querySelector("#mm.on")) return;

      if (window.__lastTurn !== G.turn) { window.__lastTurn = G.turn; for (const c of G.hand.p.slice()) { const order = [0, 1, 2].sort(() => Math.random() - 0.5); for (const li of order) { if (E.queuePlay(G, "p", c.uid, li)) break; } } }
      endTurnUI(true);
    } catch (e) { window.__err = String(e && e.stack || e); }
  }, 900);
};
for (const p of [pa, pb]) await p.evaluate(auto);
// ngắt kết nối mạng của máy A giữa trận (lượt 2) để thử tự nối lại
if (!BASE) {
  if (process.env.CUT_AT_LOCK) {
    /* ngắt ngay sau khi máy A vừa chốt lượt (lock) mà chưa kịp nhận chốt của máy B -> B diễn trước rồi sang lượt sau,
       A kết nối lại phải bắt kịp (trước gpu35: kẹt, hai bên cùng báo "đối thủ không ra bài quá 3 phút") */
    await pa.evaluate(() => { const cr = window.checkResolve; window.checkResolve = function () { const r = cr.apply(this, arguments); if (!window.__cutDone && G.turn >= 2 && OL.locked && !OL.resolving) { window.__cutDone = 1; window.__cut = LTD_CF.conns.filter((c) => c.up).length; LTD_CF.conns.forEach((c) => c.ws && c.ws.close(4999));
      /* chặn kết nối lại 12 s (đủ lâu để máy B diễn xong lượt và sang lượt sau) */
      const WS = window.WebSocket; window.WebSocket = function () { const o = { readyState: 3, close() {}, send() {} }; setTimeout(() => o.onclose && o.onclose({ code: 1006 }), 30); return o; }; setTimeout(() => { window.WebSocket = WS; }, 12000); } return r; }; });
    await pa.waitForFunction(() => window.__cutDone, null, { timeout: 180000, polling: 200 });
    const st = async (p) => p.evaluate(() => { const o = oppOf(OL.mr.peers()); return { t: G.turn, sub: OL.sub, lock: OL.locked, res: OL.resolving, op: o && { t: o.presence.t, sub: o.presence.sub, lock: o.presence.lock, la: o.presence.la && o.presence.la.t } }; });
    console.log("lúc ngắt: A", JSON.stringify(await st(pa)), "B", JSON.stringify(await st(pb)));
    await new Promise((r) => setTimeout(r, 20000));
    console.log("sau 20 s: A", JSON.stringify(await st(pa)), "B", JSON.stringify(await st(pb)));
  } else await pa.waitForFunction(() => G.turn >= 2, null, { timeout: 120000, polling: 300 });
  if (!process.env.CUT_AT_LOCK) await pa.evaluate(() => { window.__cut = LTD_CF.conns.filter((c) => c.up).length; LTD_CF.conns.forEach((c) => c.ws && c.ws.close(4999)); });
  console.log("đã ngắt kết nối máy A ở lượt 2");
}
await Promise.all([pa, pb].map((p) => p.waitForFunction(() => G.phase === "over", null, { timeout: 240000, polling: 500 })));
console.log("ván kết thúc ở cả hai máy");
if (!BASE) console.log("số kết nối bị ngắt ở A:", await pa.evaluate(() => window.__cut));
const res = [];
for (const p of [pa, pb]) res.push(await p.evaluate(() => ({ log: JSON.stringify(OL.log), seed: OL.seedUsed, dk: JSON.stringify(OL.dk), turn: OL.CG.turn, hash: hashSt(OL.CG), role: OL.role, winnerP: G.result.winner, kind: G.result.kind, note: OL.note || "", err: window.__err || "", resTitle: document.getElementById("resTitle").textContent })));
console.log(JSON.stringify(res.map(r=>({...r,log:undefined,dk:undefined}))));
if (process.env.DUMP) fs.writeFileSync(process.env.DUMP, JSON.stringify(res));
await pa.screenshot({ path: `${SHOTS}/6-ket-qua-A.png` });
await pb.screenshot({ path: `${SHOTS}/7-ket-qua-B.png` });

let ok = true;
const fail = (m) => { ok = false; console.log("HỎNG:", m); };
if (res[0].hash !== res[1].hash) fail("băm trạng thái cuối khác nhau");
if (res[0].err || res[1].err) fail("lỗi trong trang: " + res[0].err + res[1].err);
const wa = res[0].winnerP, wb = res[1].winnerP;
if (!((wa === "p" && wb === "a") || (wa === "a" && wb === "p") || (wa === wb && wa !== "p" && wa !== "a"))) fail("kết quả hai bên không khớp: " + wa + "/" + wb);
if (res.some((r) => /đồng bộ/.test(r.note))) fail("báo lỗi đồng bộ");

// máy chủ phải ghi nhận trận (chờ báo cáo kết quả hai bên)
await new Promise((r) => setTimeout(r, 2500));
if (BASE) { await browser.close(); srv.close(); console.log(ok ? "BASELINE ĐẠT" : "BASELINE HỎNG"); process.exit(ok ? 0 : 1); }
/* máy bận có thể gửi báo cáo kết quả chậm hơn: đợi tới 30 s thay vì kết luận sau 2,5 s */
let mine = [], tRec = Date.now();
for (;;) {
  const ul = await admin("GET", "/api/admin/users");
  mine = ul.json.users.filter((u) => users.includes(u.username));
  if (mine.every((u) => u.games === 1) || Date.now() - tRec > 30000) break;
  await new Promise((r) => setTimeout(r, 1000));
}
console.log("máy chủ ghi nhận sau thêm", ((Date.now() - tRec) / 1000).toFixed(1), "s");
console.log("hạng trên máy chủ:", mine.map((u) => `${u.username}=${u.rating}/${u.games} ván`).join(", "));
if (!mine.every((u) => u.games === 1)) fail("máy chủ chưa ghi nhận trận cho cả hai");
if (errors.length) { console.log("lỗi console/trang:\n" + errors.slice(0, 10).join("\n")); fail("có lỗi trên trang"); }
await browser.close();
srv.close();
console.log(ok ? "E2E ĐẠT" : "E2E HỎNG");
process.exit(ok ? 0 : 1);
