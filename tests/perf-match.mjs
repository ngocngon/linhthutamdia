// Đo hiệu năng giao diện (Playwright + Chrome): tải lần đầu, khung hình/long task trong trận (CPU chậm 4×),
// thời gian render(), MutationObserver, hoạt ảnh/CPU khi nhàn rỗi ở sảnh và trong trận.
// Chạy: CHROME_PATH=/usr/bin/google-chrome node tests/perf-match.mjs [thư_mục_www] [số_lượt=4]
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url));
const www = path.resolve(process.argv[2] || path.join(here, "..", "www")), TURNS = +(process.argv[3] || 4);
const THR = +(process.env.CPU_THROTTLE || 4);
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".woff2": "font/woff2", ".ttf": "font/ttf" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p));
    if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

function instrument(seed) {
  if (seed) { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const P = window.__P = { lt: [], mo: {}, render: { n: 0, ms: 0, max: 0 }, frames: [] };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) P.lt.push(e.duration); }).observe({ entryTypes: ["longtask"] }); } catch (e) {}
  const MO = window.MutationObserver;
  window.MutationObserver = function (cb) {
    const key = String(cb).replace(/\s+/g, " ").slice(0, 70);
    const s = P.mo[key] || (P.mo[key] = { n: 0, ms: 0 });
    return new MO(function (a, b) { const t = performance.now(); try { return cb.call(this, a, b); } finally { s.n++; s.ms += performance.now() - t; } });
  };
  window.MutationObserver.prototype = MO.prototype;
  /* bọc render() khi nó xuất hiện (khai báo hàm toàn cục ở script cổ điển) */
  const wrap = () => { if (typeof window.render === "function" && !window.render.__w) { const r0 = window.render; const w = function () { const t = performance.now(); try { return r0.apply(this, arguments); } finally { const d = performance.now() - t; P.render.n++; P.render.ms += d; if (d > P.render.max) P.render.max = d; } }; w.__w = 1; window.render = w; } };
  document.addEventListener("DOMContentLoaded", wrap); window.addEventListener("load", wrap);
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--enable-precise-memory-info"] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await ctx.addInitScript(instrument, +(process.env.SEED || 12345)); /* Math.random cố định -> cùng bộ bài/cùng nước đi giữa hai lần đo */
const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
let nReq = 0, bytes = 0; const big = [];
await cdp.send("Network.enable");
const reqUrl = new Map();
cdp.on("Network.requestWillBeSent", e => reqUrl.set(e.requestId, e.request.url));
cdp.on("Network.loadingFinished", e => { nReq++; bytes += e.encodedDataLength; big.push([e.encodedDataLength, reqUrl.get(e.requestId)]); });
const t0 = Date.now();
await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
const tLobby = Date.now() - t0, nLobby = nReq, bLobby = bytes;
await page.waitForTimeout(4000);
console.log(`tải đến sảnh: ${(tLobby / 1000).toFixed(1)} s, ${nLobby} request, ${(bLobby / 1048576).toFixed(2)} MB (sau 4 s nhàn rỗi: ${nReq} request, ${(bytes / 1048576).toFixed(2)} MB)`);
console.log("  lớn nhất: " + big.sort((a, b) => b[0] - a[0]).slice(0, 6).map(([b, u]) => (b / 1024).toFixed(0) + "KB " + String(u).replace(BASE, "")).join(", "));

await cdp.send("Performance.enable");
const pm = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(m => [m.name, m.value]));
async function idle(label, ms = 3000) {
  const a = await pm();
  const r = await page.evaluate(async ms => { let n = 0, run = true; const f = () => { n++; if (run) requestAnimationFrame(f); }; requestAnimationFrame(f); await new Promise(r => setTimeout(r, ms)); run = false; return { fps: +(n * 1000 / ms).toFixed(1), anims: document.getAnimations().filter(x => x.playState === "running").length }; }, ms);
  const b = await pm();
  console.log(`${label}: CPU luồng chính ${Math.round((b.TaskDuration - a.TaskDuration) * 1000 / (ms / 1000))} ms/s, style ${b.RecalcStyleCount - a.RecalcStyleCount}, layout ${b.LayoutCount - a.LayoutCount}, hoạt ảnh chạy ${r.anims}`);
}
await cdp.send("Emulation.setCPUThrottlingRate", { rate: THR });
await idle(`sảnh nhàn rỗi (CPU ${THR}×)`);
await page.evaluate(() => document.getElementById("lbPlay").click());
await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !document.getElementById("lobby").classList.contains("on"), null, { timeout: 120000 });
await page.waitForTimeout(6000);
await idle(`trong trận nhàn rỗi (CPU ${THR}×)`);
await page.evaluate(() => { const P = window.__P; P.lt = []; P.render = { n: 0, ms: 0, max: 0 }; for (const k in P.mo) { P.mo[k].n = 0; P.mo[k].ms = 0; } });
/* chơi TURNS lượt, đo khung hình bằng rAF trong lúc diễn lượt */
const fr = await page.evaluate(() => { window.__fr = []; let last = performance.now(); const f = t => { window.__fr.push(t - last); last = t; if (!window.__frStop) requestAnimationFrame(f); }; requestAnimationFrame(f); return 1; });
const a0 = await pm(), tt0 = Date.now();
for (let k = 0; k < TURNS; k++) {
  const t = await page.evaluate(() => G.turn);
  if (await page.evaluate(() => G.phase) === "over") break;
  await page.evaluate(() => { E.aiPlan(G, "p", 40); render(); document.getElementById("btnEnd").click(); });
  await page.waitForFunction(t => G.phase === "over" || (G.phase === "play" && G.turn > t), t, { timeout: 180000, polling: 200 });
  await page.waitForTimeout(800);
}
const a1 = await pm(), wall = (Date.now() - tt0) / 1000;
const P = await page.evaluate(() => { window.__frStop = 1; const f = window.__fr.slice(1), s = f.slice().sort((a, b) => a - b); const P = window.__P; return { frames: f.length, avg: f.reduce((a, b) => a + b, 0) / f.length, p95: s[Math.floor(s.length * .95)], over50: f.filter(x => x > 50).length, lt: P.lt.length, ltMs: P.lt.reduce((a, b) => a + b, 0), ltMax: Math.max(0, ...P.lt), render: P.render, mo: Object.entries(P.mo).filter(([, v]) => v.n).sort((a, b) => b[1].ms - a[1].ms).slice(0, 5) }; });
console.log(`${TURNS} lượt (CPU ${THR}×, ${wall.toFixed(0)} s): FPS TB ${(1000 / P.avg).toFixed(1)}, khung p95 ${P.p95.toFixed(0)} ms, khung >50ms: ${P.over50}/${P.frames}, long task ${P.lt} (tổng ${P.ltMs.toFixed(0)} ms, dài nhất ${P.ltMax.toFixed(0)} ms)`);
console.log(`  CPU luồng chính ${((a1.TaskDuration - a0.TaskDuration) / wall * 1000).toFixed(0)} ms/s, style ${a1.RecalcStyleCount - a0.RecalcStyleCount}, layout ${a1.LayoutCount - a0.LayoutCount}, script ${((a1.ScriptDuration - a0.ScriptDuration) * 1000).toFixed(0)} ms, layout ${((a1.LayoutDuration - a0.LayoutDuration) * 1000).toFixed(0)} ms, style ${((a1.RecalcStyleDuration - a0.RecalcStyleDuration) * 1000).toFixed(0)} ms`);
console.log(`  render(): ${P.render.n} lần, TB ${(P.render.ms / Math.max(1, P.render.n)).toFixed(1)} ms, lâu nhất ${P.render.max.toFixed(1)} ms`);
for (const [k, v] of P.mo) console.log(`  MutationObserver ${v.n} lần, ${v.ms.toFixed(0)} ms: ${k}`);
await page.evaluate(() => { showLobby(); });
await page.waitForTimeout(3000);
await idle(`sảnh sau trận (CPU ${THR}×)`);
await browser.close(); server.close();
