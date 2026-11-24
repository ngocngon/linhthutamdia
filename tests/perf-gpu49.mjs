// Đo 3 điểm hiệu năng gpu49: (1) byte ảnh img/u trước khi sảnh tương tác, (2) chi phí vẽ bàn/patchBoard/getAnimations trong ván,
// (3) số phần tử DOM + thời gian mở trình sửa bộ bài. Chạy: CHROME_PATH=/usr/bin/google-chrome node tests/perf-gpu49.mjs [1|2|3|all]
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const WHICH = process.argv[2] || "all", THR = +(process.env.CPU_THROTTLE || 4), OUT = process.env.PERF_OUT || "/home/claude/shots-gpu49/perf";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => {
  try { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); } }).listen(0);
await new Promise(r => server.once("listening", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const seeded = () => { let a = 12345; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
async function fresh(vp = { width: 412, height: 915 }) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(seeded);
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  return { ctx, page, cdp };
}
const num = (a) => a.reduce((x, y) => x + y, 0);

if (WHICH === "1" || WHICH === "all") {
  const { ctx, page, cdp } = await fresh();
  const rq = new Map(), done = []; await cdp.send("Network.enable");
  cdp.on("Network.requestWillBeSent", e => rq.set(e.requestId, e.request.url));
  cdp.on("Network.loadingFinished", e => done.push({ t: Date.now(), b: e.encodedDataLength, u: rq.get(e.requestId) }));
  await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  const tReady = Date.now();
  /* byte tính theo kích thước tệp trên đĩa của các tệp img/u đã được yêu cầu (loadingFinished báo 0 với ảnh lấy từ bộ nhớ đệm) */
  const { statSync } = await import("node:fs");
  const sz = list => { const m = new Map(); for (const x of list) if (/\/img\/u\//.test(x.u)) { const f = new URL(x.u).pathname; m.set(f, statSync(path.join(www, f)).size); } return [m.size, num([...m.values()])]; };
  const reqAt = (t) => sz(done.filter(x => x.t <= t));
  const [n1, b1] = reqAt(tReady);
  console.log(`[1] img/u được tải khi sảnh tương tác: ${n1} tệp, ${(b1 / 1024).toFixed(0)} KB`);
  await page.waitForFunction(() => typeof store !== "undefined" && document.getElementById("lobby").classList.contains("on"), null, { timeout: 60000 });
  await page.waitForTimeout(10000);
  const [n2, b2] = sz(done);
  const tot = await page.evaluate(() => Object.keys(IMGS.u).length + Object.keys(IMGS.uz || {}).length);
  console.log(`[1] img/u sau 10 s nhàn rỗi: ${n2} tệp, ${(b2 / 1024).toFixed(0)} KB (tổng ${tot} ảnh)`);
  await ctx.close();
}

if (WHICH === "2" || WHICH === "all") {
  const { ctx, page, cdp } = await fresh();
  await page.addInitScript(() => {
    const P = window.__P = { pb: { n: 0, ms: 0, max: 0 }, ga: { n: 0, ms: 0 }, gx: { n: 0, ms: 0 }, r: { n: 0, ms: 0 }, inPB: 0 };
    const hook = (o) => { const g0 = o.getAnimations; o.getAnimations = function () { const t = performance.now(); try { return g0.apply(this, arguments); } finally { const d = performance.now() - t; const k = P.inPB ? P.ga : P.gx; k.n++; k.ms += d; } }; };
    hook(Element.prototype); hook(Document.prototype);
    const wrap = () => { for (const [n, k] of [["patchBoard", "pb"], ["render", "r"]]) { const f = window[n]; if (typeof f === "function" && !f.__w) { const w = function () { const t = performance.now(); if (n === "patchBoard" || n === "render") P.inPB++; try { return f.apply(this, arguments); } finally { if (n === "patchBoard" || n === "render") P.inPB--; const d = performance.now() - t; P[k].n++; P[k].ms += d; if (d > (P[k].max || 0)) P[k].max = d; } }; w.__w = 1; window[n] = w; } } };
    document.addEventListener("DOMContentLoaded", wrap); window.addEventListener("load", wrap);
  });
  await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.waitForTimeout(1500);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: THR });
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !document.getElementById("lobby").classList.contains("on"), null, { timeout: 120000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => { const P = window.__P; P.pb = { n: 0, ms: 0, max: 0 }; P.ga = { n: 0, ms: 0 }; P.gx = { n: 0, ms: 0 }; P.r = { n: 0, ms: 0, max: 0 }; });
  const TURNS = +(process.env.TURNS || 4);
  for (let k = 0; k < TURNS; k++) {
    const t = await page.evaluate(() => G.turn);
    if (await page.evaluate(() => G.phase) === "over") break;
    await page.evaluate(() => { E.aiPlan(G, "p", 40); render(); document.getElementById("btnEnd").click(); });
    await page.waitForFunction(t => G.phase === "over" || (G.phase === "play" && G.turn > t), t, { timeout: 240000, polling: 200 });
    await page.waitForTimeout(600);
  }
  const P = await page.evaluate(() => window.__P);
  console.log(`[2] (CPU ${THR}x, ${TURNS} lượt) render(): ${P.r.n} lần, TB ${(P.r.ms / P.r.n).toFixed(1)} ms; patchBoard: ${P.pb.n} lần, TB ${(P.pb.ms / P.pb.n).toFixed(2)} ms, max ${P.pb.max.toFixed(1)} ms; getAnimations trong lần vẽ bàn: ${P.ga.n} lần, ${(P.ga.ms / P.r.n).toFixed(1)} ms/lần render(); getAnimations nơi khác: ${P.gx.n} lần, ${P.gx.ms.toFixed(0)} ms`);
  await ctx.close();
}

if (WHICH === "3" || WHICH === "all") {
  for (const vp of [{ width: 412, height: 915 }, { width: 360, height: 640 }]) {
    const { ctx, page, cdp } = await fresh(vp);
    await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { OWN.clear(); for (const k of E.COLLECT) OWN.add(k); store.own = [...OWN]; save(); renderLobby(); });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: THR });
    const r = await page.evaluate(async () => {
      const t0 = performance.now(); openCol();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const ms = performance.now() - t0;
      return { ms, dom: document.querySelectorAll("#ovDeck *").length, all: document.getElementsByTagName("*").length, cards: document.querySelectorAll("#deckList .gc").length, total: E.COLLECT.length };
    });
    await page.waitForTimeout(800);
    /* chuỗi thao tác: cuộn sâu, lọc, xoá lọc */
    const r2 = await page.evaluate(async () => { const b = document.getElementById("deckList").parentElement; b.scrollTop = b.scrollHeight; await new Promise(r => setTimeout(r, 600)); b.scrollTop = b.scrollHeight; await new Promise(r => setTimeout(r, 600)); return { y: b.scrollTop, dom: document.querySelectorAll("#ovDeck *").length, cards: document.querySelectorAll("#deckList .gc").length }; });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await page.evaluate(() => { const b = document.getElementById("deckList").parentElement; b.scrollTop = 0; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `editor-${vp.width}x${vp.height}-${process.env.TAG || "x"}.png`) });
    console.log(`[3] ${vp.width}x${vp.height} (CPU ${THR}x) mở Sưu tập: ${r.ms.toFixed(0)} ms, #ovDeck ${r.dom} phần tử (toàn trang ${r.all}), thẻ vẽ ${r.cards}/${r.total}; sau cuộn xuống cuối: ${r2.dom} phần tử, ${r2.cards} thẻ`);
    await ctx.close();
  }
}
await browser.close(); server.close();
