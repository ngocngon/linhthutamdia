// Kiểm tra LỜI THOẠI thẻ S5 (voiceLine trong www/js/04-audio.js): đúng thẻ, đúng 1 lần mỗi lần ra mắt, tắt công tắc / tắt tiếng thì im,
// không 2 thoại trong 2 s, hạ tiếng kỹ năng khi chồng, thiếu thoai.json thì im lặng không lỗi.
// Chạy: CHROME_PATH=/usr/bin/google-chrome node tests/thoai-s5.mjs   (cần ffmpeg; tự sinh thoai giả bằng tools/thoai_build.py vào thư mục tạm, KHÔNG ghi vào www/sfx)
import http from "node:http";
import { readFile, mkdtemp, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, ".."), www = path.join(root, "www");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const IDS = ["hacdichbinh", "namtuocmatna", "tammanu", "nguyetlong", "linhduoc", "songsinhtamlinh"]; // thẻ S5 thật
const tmp = await mkdtemp(path.join(os.tmpdir(), "thoai-"));
await mkdir(path.join(tmp, "raw")); await mkdir(path.join(tmp, "out"));
IDS.forEach((k, i) => execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `sine=f=${300 + i * 70}:d=1.4`, "-af", "afade=t=in:d=0.1,afade=t=out:st=1.1:d=0.3,volume=0.3", path.join(tmp, "raw", k + ".mp3")]));
execFileSync("python3", [path.join(root, "tools", "thoai_build.py"), path.join(tmp, "raw"), path.join(tmp, "out")], { env: { ...process.env, THOAI_DS: path.join(tmp, "none.json") }, stdio: "pipe" });
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".mp3": "audio/mpeg", ".svg": "image/svg+xml" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
let failed = false;
const ok = (c, m) => { console.log((c ? "  ok   " : "  LỖI  ") + m); if (!c) failed = true; };
const IGN = /ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY|thoai|Failed to load resource/;

async function open(withVoice) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error" && !IGN.test(m.text())) errors.push("console: " + m.text()); });
  await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
  if (withVoice) await page.route(/\/sfx\/thoai(\.json|-\d+\.mp3)/, async r => {
    const n = new URL(r.request().url()).pathname.split("/").pop();
    await r.fulfill({ status: 200, contentType: n.endsWith(".json") ? "application/json" : "audio/mpeg", body: await readFile(path.join(tmp, "out", n)) });
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 120000 });
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 60000 });
  await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.waitForFunction(() => SFX.loaded() > 50, null, { timeout: 20000 });
  await page.evaluate(() => { window.__snd = []; window.SFX_TAP = (n, v, o) => window.__snd.push({ n, v, d: o && o.delay, t: performance.now() }); });
  return { ctx, page, errors };
}
const voices = page => page.evaluate(() => window.__snd.filter(s => /^voice:/.test(s.n)).map(s => s.n));
const reset = page => page.evaluate(() => { window.__snd = []; });
const w = (page, ms) => page.waitForTimeout(ms);

try {
  // ---------- có thoại ----------
  const A = await open(true), pg = A.page;
  await pg.evaluate(() => localStorage.removeItem("ltd_voice_v1"));
  console.log("1) màn ra mắt thật (ultShow)");
  await pg.evaluate(() => { store.mute = false; SFX.preloadCards && 0; });
  await pg.evaluate(async () => { await SFX.preloadVoices(["hacdichbinh", "namtuocmatna"]); });
  await pg.evaluate(() => { const i = E.mk(G, "hacdichbinh", "p"); window.ultShow(i, () => {}, 0); window.__u0 = performance.now(); window.__uid = i.uid; });
  await w(pg, 2500);
  let v = await voices(pg);
  ok(v.length === 1 && v[0] === "voice:hacdichbinh", "ra mắt hacdichbinh -> đúng 1 thoại đúng thẻ: " + JSON.stringify(v));
  const dl = await pg.evaluate(() => { const V = window.__snd.find(s => /^voice:/.test(s.n)); return V && V.d; });
  ok(dl >= 0.2 && dl <= 0.45, "thoại lùi sau tiếng ra mắt " + (dl && dl.toFixed(2)) + " s (0,25–0,4 s)");
  console.log("2) gọi lại cùng thẻ/uid -> không phát lần 2");
  await reset(pg);
  await pg.evaluate(() => { SFX.launch(5, { id: "hacdichbinh", uid: window.__uid }); });
  await w(pg, 900);
  ok((await voices(pg)).length === 0, "cùng uid trong 3 s: 0 thoại");
  console.log("3) nhiều S5 dồn dập -> chỉ thẻ đầu trong 2 s");
  await w(pg, 2500); await reset(pg);
  await pg.evaluate(async () => { await SFX.preloadVoices(["namtuocmatna", "tammanu", "nguyetlong"]); SFX.launch(5, { id: "namtuocmatna", uid: 9201 }); });
  await w(pg, 500);
  await pg.evaluate(() => SFX.launch(5, { id: "tammanu", uid: 9202 }));
  await w(pg, 600);
  await pg.evaluate(() => SFX.launch(5, { id: "nguyetlong", uid: 9203 }));
  await w(pg, 1000);
  v = await voices(pg);
  ok(v.length === 1 && v[0] === "voice:namtuocmatna", "3 ra mắt trong ~1,1 s: chỉ thẻ đầu nói: " + JSON.stringify(v));
  await w(pg, 1500); await reset(pg);
  await pg.evaluate(() => SFX.launch(5, { id: "tammanu", uid: 9204 }));
  await w(pg, 900);
  v = await voices(pg);
  ok(v.length === 1 && v[0] === "voice:tammanu", "sau hơn 2 s thẻ khác lại được nói: " + JSON.stringify(v));
  console.log("4) tiếng kỹ năng riêng hạ ~60% khi chồng với thoại");
  await w(pg, 2300); await reset(pg);
  const duck = await pg.evaluate(async () => {
    await SFX.preloadCards(["hacdichbinh", "linhduoc"]); await SFX.preloadVoices(["linhduoc"]);
    SFX.launch(5, { id: "linhduoc", uid: 9301 });
    await new Promise(r => setTimeout(r, 450));
    SFX.fam("act", { id: "hacdichbinh" });
    await new Promise(r => setTimeout(r, 200));
    const t = window.__snd.find(s => s.n === "the:hacdichbinh");
    return { hasCard: SFX.cardLoaded("hacdichbinh"), t: t && t.v };
  });
  if (duck.hasCard) ok(duck.t === 0.6, "the:hacdichbinh phát với âm lượng " + duck.t + " (mong đợi 0.6)");
  else console.log("   (bỏ qua: sprite tiếng kỹ năng chưa nạp được trong test)");
  console.log("5) công tắc / tắt tiếng");
  await w(pg, 2500); await reset(pg);
  await pg.evaluate(() => { const c = document.getElementById("setVoice"); c.checked = false; c.dispatchEvent(new Event("change")); });
  ok(await pg.evaluate(() => localStorage.getItem("ltd_voice_v1") === "0" && !SFX.voiceOn()), "tắt công tắc -> ltd_voice_v1 = 0");
  await pg.evaluate(() => SFX.launch(5, { id: "songsinhtamlinh", uid: 9401 }));
  await w(pg, 1200);
  ok((await voices(pg)).length === 0, "công tắc tắt: 0 thoại");
  await pg.evaluate(() => { const c = document.getElementById("setVoice"); c.checked = true; c.dispatchEvent(new Event("change")); store.mute = true; });
  await pg.evaluate(() => SFX.launch(5, { id: "songsinhtamlinh", uid: 9402 }));
  await w(pg, 1200);
  ok((await voices(pg)).length === 0, "tắt toàn bộ tiếng: 0 thoại");
  await pg.evaluate(() => { store.mute = false; });
  await pg.evaluate(() => SFX.launch(5, { id: "songsinhtamlinh", uid: 9403 }));
  await w(pg, 1200);
  ok((await voices(pg)).length === 1, "bật lại cả hai: thoại phát lại");
  await pg.evaluate(() => SFX.launch(5, { id: "carayi_khong_co", uid: 9404 })); // thẻ không có thoại
  ok(await pg.evaluate(() => SFX.voiceLine("khongcoid") === false), "thẻ không có thoại: bỏ qua im lặng");
  ok(A.errors.length === 0, "không lỗi console" + (A.errors.length ? ": " + A.errors.slice(0, 3).join(" | ") : ""));
  await A.ctx.close();
  // ---------- thiếu thoai.json ----------
  console.log("6) thiếu thoai.json/mp3");
  const B = await open(false);
  await B.page.evaluate(() => SFX.launch(5, { id: "hacdichbinh", uid: 9501 }));
  await w(B.page, 1500);
  ok((await voices(B.page)).length === 0, "không có thoai.json: 0 thoại");
  ok(B.errors.length === 0, "không lỗi console" + (B.errors.length ? ": " + B.errors.slice(0, 3).join(" | ") : ""));
  await B.ctx.close();
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.message); }
await browser.close(); server.close();
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
