// Kiểm tra cập nhật bản mới qua service worker: mở trang (bản A), "phát hành" bản B (đổi ?v= mọi nơi),
// quay lại trang -> phải tự tải lại sang bản B khi đang ở sảnh; đang mở bảng phủ thì hiện nút "Có bản mới".
// Chạy: CHROME_PATH=/usr/bin/google-chrome node tests/sw-update.mjs
import http from "node:http";
import { readFile, writeFile, cp, rm, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), src = process.env.SW_SRC || path.join(here, "..", "www");
const tmp = "/tmp/ltd-swtest/www";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
await rm("/tmp/ltd-swtest", { recursive: true, force: true });
await cp(src, tmp, { recursive: true });
const ver0 = /sw\.js\?v=([\w.-]+)/.exec(await readFile(path.join(tmp, "index.html"), "utf8"))[1], ver1 = ver0 + "x";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(tmp, path.normalize(p));
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream", "cache-control": "max-age=600" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const url = `http://localhost:${server.address().port}/index.html`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
const page = await ctx.newPage();
let fail = 0; const ok = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; };
const verNow = () => page.evaluate(() => { const s = [...document.scripts].map(x => x.src).find(x => /01-engine\.js/.test(x)) || ""; return (/[?&]v=([\w.-]+)/.exec(s) || [])[1]; });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 60000 }).catch(() => {});
if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) { await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 60000 }); await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 }); }
ok(await verNow() === ver0, "đang chạy bản " + ver0 + " (có service worker điều khiển)");
/* phát hành bản mới: đổi số phiên bản ở mọi tệp văn bản */
for (const f of ["index.html", "sw.js", ...(await readdir(path.join(tmp, "js"))).map(x => "js/" + x), ...(await readdir(path.join(tmp, "css"))).map(x => "css/" + x)]) {
  const p = path.join(tmp, f); const t = await readFile(p, "utf8"); if (t.includes(ver0)) await writeFile(p, t.split(ver0).join(ver1));
}
/* 1) đang ở sảnh, quay lại trang -> tự tải lại sang bản mới */
const nav = page.waitForEvent("framenavigated", { timeout: 30000 }).catch(() => null);
await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
await nav; await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 }).catch(() => {});
ok(await verNow() === ver1, "ở sảnh: tự tải lại sang bản " + ver1 + " (đang chạy: " + (await verNow()) + ")");
await page.waitForFunction(v => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL.endsWith("v=" + v), ver1, { timeout: 60000 }).catch(() => {});
console.log("  service worker điều khiển:", await page.evaluate(() => navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL));
await page.evaluate(() => fetch("img/u/gold_big.webp?v=probe").catch(() => {})); await page.waitForTimeout(1500);
const caches = await page.evaluate(async () => (await caches.keys()).filter(k => k.startsWith("ltd-")));
ok(caches.includes("ltd-" + ver1) && !caches.includes("ltd-" + ver0), "bộ nhớ đệm: " + caches.join(", ") + " (bản cũ đã xoá)");
/* 2) bản kế tiếp trong lúc đang mở bảng phủ -> chỉ hiện nút cập nhật, không tự tải lại */
const ver2 = ver1 + "y";
for (const f of ["index.html", "sw.js"]) { const p = path.join(tmp, f); const t = await readFile(p, "utf8"); await writeFile(p, t.split(ver1).join(ver2)); }
await page.evaluate(() => { document.getElementById("ovSet").classList.add("on"); document.dispatchEvent(new Event("visibilitychange")); });
await page.waitForSelector("#updBar", { timeout: 15000 }).catch(() => {});
ok(await page.evaluate(() => !!document.getElementById("updBar")), "đang mở bảng phủ: hiện nút \"Có bản mới — chạm để cập nhật\"");
ok(await verNow() === ver1, "chưa tự tải lại khi người chơi đang thao tác");
await browser.close(); server.close();
console.log(fail ? "SW-UPDATE HỎNG" : "SW-UPDATE OK");
process.exit(fail ? 1 : 0);
