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
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error") errors.push("console.error: " + m.text()); });
page.on("requestfailed", r => { if (r.url().startsWith(url.replace(/index\.html$/, ""))) errors.push("requestfailed: " + r.url()); }); // bỏ qua host ngoài (Google Fonts) khi chạy offline
page.on("response", r => { if (r.status() >= 400) errors.push("http " + r.status() + ": " + r.url()); });
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
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.message); await shot("99-failure"); }
await browser.close(); server.close();
const uniq = [...new Set(errors)];
if (uniq.length) { console.error("Lỗi trang:\n" + uniq.slice(0, 30).join("\n")); failed = true; }
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
