// Kết trận (gpu71): chuỗi tính điểm → kết quả → thưởng đủ chậm để đọc ở "Rất chậm", đúng giọng xướng theo kết quả, nhạc nền hạ, không sót lớp.
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/end-match.mjs
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => {
  try { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); } }).listen(0);
await new Promise(r => server.once("listening", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const fails = []; const ok = (c, m) => { if (!c) { fails.push(m); console.log("FAIL", m); } else console.log("ok  ", m); };
/* tối thiểu mỗi nhịp (ms) ở Rất chậm */
const MIN = { lane: 2600, laneLast: 2600, result: 3200, panel: 1500, reward: 1500 };
for (const [res, key, vk] of [["p", "kt_v_win", "kt_s_win"], ["a", "kt_v_lose", "kt_s_lose"], ["d", "kt_v_draw", "kt_s_draw"]]) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.addInitScript(() => { window.__snd = []; window.__duck = []; window.SFX_TAP = (n, v, o) => window.__snd.push({ n, t: performance.now(), d: (o && o.delay) || 0 }); });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { document.getElementById("lobby").classList.remove("on"); newGame(); const bd = BGM.duck; BGM.duck = function (d, s) { window.__duck.push([d, s]); return bd.apply(this, arguments); }; SFX.play("gavel", 0.01); });
  await page.waitForTimeout(3500); /* nạp sprite ketthuc */
  ok(await page.evaluate(() => SPD === 2), `[${res}] tốc độ mặc định Rất chậm (SPD=2)`);
  await page.evaluate(r => {
    window.__snd.length = 0; window.__duck.length = 0;
    E.locPower = (g, i, s) => s === "p" ? 12 + i : 7 + i; E.lead = (g, i) => r === "p" ? "p" : r === "a" ? "a" : i === 1 ? "p" : "a";
    G.phase = "over"; G.result = { winner: r === "p" ? "p" : r === "a" ? "a" : "draw", kind: "end", stake: 10 }; showEnd(); window.__t0 = performance.now(); window.__mid = [];
    const poll = setInterval(() => { document.querySelectorAll(".es-tally .me").forEach((e, i) => window.__mid.push([i, e.textContent])); if (!ES || ES.ph >= 4) clearInterval(poll); }, 90);
  }, res);
  await page.waitForFunction(() => ES && ES.log.some(l => l.b === "done"), null, { timeout: 60000 });
  const d = await page.evaluate(() => ({ log: ES.log.map(l => [l.b, Math.round(l.t - window.__t0)]), snd: window.__snd.map(s => [s.n, Math.round(s.t - window.__t0), s.d]), duck: window.__duck, mid: window.__mid, K: ES.K }));
  const L = Object.fromEntries(d.log); console.log(res, JSON.stringify(d.log));
  ok(L.lane1 - L.lane0 >= MIN.lane && L.lane2 - L.lane1 >= MIN.lane, `[${res}] mỗi chiến địa >= ${MIN.lane} ms (${L.lane1 - L.lane0}, ${L.lane2 - L.lane1})`);
  ok(L.result - L.lane2 >= MIN.laneLast, `[${res}] chiến địa cuối -> kết quả >= ${MIN.laneLast} ms (${L.result - L.lane2})`);
  ok(L.panel - L.result >= MIN.result, `[${res}] biểu ngữ kết quả >= ${MIN.result} ms (${L.panel - L.result})`);
  ok(L.reward - L.panel >= 700, `[${res}] bảng -> thưởng >= 700 ms (${L.reward - L.panel})`);
  ok(L.done - L.reward >= MIN.reward, `[${res}] thưởng hiện đủ lâu >= ${MIN.reward} ms (${L.done - L.reward})`);
  const names = d.snd.map(s => s[0]);
  ok(names.filter(n => n === key).length === 1 && names.filter(n => n === vk).length === 1, `[${res}] đúng 1 giọng ${key} + 1 nhạc hiệu ${vk}`);
  ok(!names.some(n => /^kt_[vs]_/.test(n) && n !== key && n !== vk), `[${res}] không phát giọng/nhạc hiệu của kết quả khác`);
  ok(!names.includes("win") && !names.includes("lose"), `[${res}] không còn tiếng thắng/thua cũ`);
  const tv = d.snd.find(s => s[0] === key)[1], tb = L.result; ok(Math.abs(tv - tb) < 600, `[${res}] giọng xướng phát cùng lúc biểu ngữ (lệch ${tv - tb} ms)`);
  ok(d.duck.some(x => x[0] >= 0.8 && x[1] >= 5), `[${res}] nhạc nền hạ sâu >= 80% trong >= 5 s`);
  const vals = d.mid.filter(m => m[0] === 0).map(m => +m[1]); ok(vals.some(v => v > 0 && v < 12) && vals.includes(12), `[${res}] số đếm tăng dần tới 12 (thấy ${[...new Set(vals)].join(",")})`);
  /* bảng thưởng xong: không sót lớp, chơi ván mới thì sạch */
  const left = await page.evaluate(() => ({ seq: !!document.getElementById("endSeq"), tally: document.querySelectorAll(".es-tally").length, foot: document.querySelector("#ovEnd .foot").style.pointerEvents }));
  ok(!left.seq && left.tally === 0 && left.foot === "", `[${res}] hết chuỗi: không sót #endSeq/.es-tally, nút bấm được`);
  await page.evaluate(() => newGame()); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !document.getElementById("endSeq") && !document.querySelector(".es-tally") && !document.getElementById("ovEnd").classList.contains("on")), `[${res}] ván mới: sạch lớp kết trận`);
  ok(errs.length === 0, `[${res}] không lỗi trang ${errs.join("|")}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails.length ? `\n${fails.length} LỖI` : "\nĐẠT"); process.exit(fails.length ? 1 : 0);
