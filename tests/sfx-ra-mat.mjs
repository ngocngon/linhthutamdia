// Kiểm tra âm thanh màn ra mắt thẻ S4/S5: mỗi lần ra mắt chỉ phát MỘT tiếng ra mắt, không lặp, không chồng.
// Chạy trong thư mục tests: CHROME_PATH=/usr/bin/google-chrome node sfx-ra-mat.mjs
// Cách làm: mỗi lượt thay bài trên tay hai bên bằng thẻ S4/S5 rẻ (đặt được ngay), móc window.SFX_TAP (gọi mỗi khi một mẫu âm
// thật sự được phát) và móc ultShow để đếm số lần ra mắt.
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
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
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message));
// Tên các tiếng "ra mắt" (mới) và các tiếng cũ từng chồng lên nhau khi ra mắt
const LAUNCH = ["ra_s5", "ra_s5b", "ra_s4", "ra_s4b", "ra_mini", "ra_minib"], OLD = ["ult", "rv_t5", "rv_t4"];
let failed = false;
try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 120000 });
  await page.evaluate(() => {
    window.__snd = []; window.__ult = [];
    window.SFX_TAP = (n) => window.__snd.push({ n, t: performance.now() });
    const o = window.ultShow;
    window.ultShow = function (inst, done, nth) { window.__ult.push({ id: inst && inst.id, mini: !!(inst && inst.mini), t: performance.now() }); return o.apply(this, arguments); };
  });
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 60000 });
  await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }))); // mở khoá AudioContext
  await page.waitForFunction(() => SFX.loaded() > 50, null, { timeout: 20000 });
  const t0 = Date.now();
  for (let g = 0; g < 2 && Date.now() - t0 < 6 * 60000; g++) {
    if (g) { await page.evaluate(() => document.getElementById("btnEnd").click()); await page.waitForFunction(() => G.phase === "play", null, { timeout: 30000 }); }
    let lastTurn = -1;
    while (Date.now() - t0 < 6 * 60000) {
      const ph = await page.evaluate(() => G.phase);
      if (ph === "over") break;
      if (ph === "play") {
        await page.evaluate((lt) => {
          if (G.turn !== lt) {
            const ids = Object.keys(C).filter(k => (C[k].h === "S5" || C[k].h === "S4") && C[k].t === "rev");
            // bậc thấp có kỹ năng Lật cộng/trừ sức mạnh -> màn ra mắt gọn
            const low = Object.keys(C).filter(k => /^S[123]$/.test(C[k].h) && C[k].t === "rev" && /[+−-]\d+ sức mạnh/.test(C[k].x || ""));
            for (const s of ["p", "a"]) {
              const e = G.energy[s] || 1, src = s === "a" && G.turn % 2 === 0 ? low : ids, pool = src.filter(k => C[k].c <= Math.max(1, Math.ceil(e / 2)));
              G.hand[s] = [0, 1, 2].map(i => E.mk(G, pool[(G.turn * 7 + i * 13 + (s === "a" ? 5 : 0)) % pool.length], s));
            }
          }
          E.aiPlan(G, "p", 60); render(); document.getElementById("btnEnd").click();
        }, lastTurn);
        lastTurn = await page.evaluate(() => G.turn);
      }
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1500);
  }
  const r = await page.evaluate(() => ({ snd: window.__snd, ult: window.__ult }));
  const cnt = {}; for (const s of r.snd) cnt[s.n] = (cnt[s.n] || 0) + 1;
  const big = r.ult.filter(u => !u.mini).length, mini = r.ult.filter(u => u.mini).length;
  const nL = r.snd.filter(s => LAUNCH.includes(s.n)).length, nO = r.snd.filter(s => OLD.includes(s.n)).length;
  console.log("ra mắt S4/S5:", big, " ra mắt gọn:", mini);
  console.log("tiếng ra mắt mới:", LAUNCH.map(n => n + "=" + (cnt[n] || 0)).join(" "), " tiếng cũ:", OLD.map(n => n + "=" + (cnt[n] || 0)).join(" "));
  console.log("top tiếng:", Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => k + ":" + v).join(" "));
  // mỗi màn ra mắt -> đúng 1 tiếng ra mắt, phát trong vòng 0,3 s sau khi màn bắt đầu; không có tiếng ra mắt nào khác
  const used = new Set(); let bad = 0;
  for (const u of r.ult) {
    const hit = r.snd.map((s, i) => [s, i]).filter(([s, i]) => LAUNCH.includes(s.n) && !used.has(i) && s.t >= u.t - 5 && s.t - u.t < 300);
    if (hit.length !== 1) { bad++; if (bad < 6) console.log("  màn ra mắt", u.id, u.mini ? "(gọn)" : "", "có", hit.length, "tiếng ra mắt"); }
    if (hit[0]) used.add(hit[0][1]);
  }
  // tiếng ra mắt dư (không thuộc màn nào) = lặp
  const extra = r.snd.filter((s, i) => LAUNCH.includes(s.n) && !used.has(i)).length;
  // khoảng cách tối thiểu giữa hai tiếng ra mắt liên tiếp (không dồn chồng)
  const lt = r.snd.filter(s => LAUNCH.includes(s.n)).map(s => s.t); let gap = Infinity; for (let i = 1; i < lt.length; i++) gap = Math.min(gap, lt[i] - lt[i - 1]);
  console.log("màn thiếu/thừa tiếng:", bad, " tiếng ra mắt dư:", extra, " tiếng cũ còn phát:", nO, " khoảng cách nhỏ nhất (ms):", isFinite(gap) ? gap.toFixed(0) : "-");
  if (big < 2) throw new Error("không có đủ màn ra mắt S4/S5 để kiểm tra");
  // chống trùng: gọi dồn dập trong 0,25 s -> chỉ 1 tiếng; cùng thẻ gọi lại trong 3 s -> bỏ; thẻ khác cách >= 0,25 s -> phát (tiếng trước tắt dần)
  const burst = await page.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)); window.__snd = [];
    SFX.launch(5, { uid: 9001 }); SFX.launch(5, { uid: 9001 }); SFX.launch(4, { uid: 9002 }); await w(100); SFX.launch(4, { uid: 9003 });
    const a = window.__snd.length; await w(400); SFX.launch(5, { uid: 9001 }); const b = window.__snd.length; SFX.launch(4, { uid: 9004 }); await w(300); SFX.launch(4, { uid: 9005 });
    return [a, b, window.__snd.length];
  });
  console.log("dồn dập:", JSON.stringify(burst), "(mong đợi [1,1,3])");
  if (JSON.stringify(burst) !== "[1,1,3]") throw new Error("chống trùng tiếng ra mắt sai");
  if (bad || extra || nO) throw new Error("tiếng ra mắt chưa đúng 1 lần mỗi màn");
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.message); }
await browser.close(); server.close();
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
