// QA gpu52: tự chơi nhiều ván, ghi nhật ký tiếng / sự kiện / phần tử sót / FPS / ảnh.
// node play.mjs <W> <H> <games> <mode: normal|cpu4|lo|rm> <tag>
import http from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire("/home/claude/linhthutamdia/tests/package.json");
const { chromium } = require("playwright-core");
const www = "/home/claude/linhthutamdia/www";
const [W, H, NG, MODE, TAG] = [+process.argv[2], +process.argv[3], +process.argv[4], process.argv[5], process.argv[6]];
const OUT = "/home/claude/qa52/shots"; await mkdir(OUT, { recursive: true });
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => { try { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html"; const f = path.join(www, path.normalize(p)); const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404); res.end("nf"); } }).listen(0);
await new Promise(r => server.once("listening", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.route(/^https:\/\/[^/]*workers\.dev\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
const errors = []; page.on("pageerror", e => errors.push("pageerror: " + e.message)); page.on("console", m => { if (m.type() === "error") errors.push("console.error: " + m.text()); });
const cdp = await ctx.newCDPSession(page);
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
await page.evaluate(() => document.getElementById("lbPlay").click());
await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 90000 });
await sleep(4500);
if (MODE === "cpu4") await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await page.evaluate(m => {
  window.FXLV = m === "lo" ? 0 : 1; window.__pin = setInterval(() => { window.FXLV = m === "lo" ? 0 : 1; }, 500);
  if (m === "rm") { reduced = true; document.body.classList.add("rm"); }
  window.FXR_LOG = true; window.__snd = []; window.__ev = []; window.__fr = []; window.__leak = []; window.__beams = [];
  window.SFX_TAP = (n, v, o) => window.__snd.push({ n, t: performance.now(), uid: o && o.uid, skill: o && o.skill, dl: (o && o.delay) || 0, g: window.__g || 0, tn: window.G ? G.turn : 0 });
  const o = window.playFx; window.playFx = function (evs) { try { for (const e of evs || []) window.__ev.push({ k: e.k, uid: e.uid, src: e.src, t: performance.now(), g: window.__g || 0, tn: G.turn }); } catch (x) {} return o.apply(this, arguments); };
  let last = performance.now(); (function raf(t) { window.__fr.push(t - last); last = t; requestAnimationFrame(raf); })(last);
  setInterval(() => { for (const x of FXR.log.splice(0)) if (x.k === "beam") window.__beams.push(x); }, 50);
  window.__maxFx = 0; setInterval(() => { const n = document.querySelectorAll(".fxr,.fxg,.mvfl9,[class*='l51-'],[class*='an51']").length; if (n > window.__maxFx) window.__maxFx = n; }, 60);
}, MODE);
/* tập thẻ theo mô tả kỹ năng */
const pools = await page.evaluate(() => {
  const ids = Object.keys(C), t = id => C[id].x || "", P = {};
  const m = (n, re) => P[n] = ids.filter(id => C[id].h !== "PH" && C[id].c <= 6 && (C[id].t === "rev" || C[id].t === "on") && re.test(t(id)));
  m("move", /di chuyển/i); m("pow", /(\+|−|-)\s?\d+\s*sức mạnh/i); m("des", /tiêu huỷ|tiêu hủy/i); m("dis", /vứt/i); m("sum", /triệu hồi|tạo/i);
  return Object.fromEntries(Object.entries(P).map(([k, v]) => [k, v]));
});
console.log(TAG, "pools", Object.fromEntries(Object.entries(pools).map(([k, v]) => [k, v.length])));
const shotsDone = new Set(); let shotN = 0;
const shot = async n => { try { await page.screenshot({ path: path.join(OUT, `${TAG}_${n}.png`) }); } catch {} };
const WANT = { destroy: 1, summon: 1, discard: 1, revive: 1, act: 1, blocked: 1, move: 1, pw: 1 };
const LEFT = ".fxr,.fxg,.mvfl9,.mvhd9,[class*='l51-'],[class*='an51']";
const t0 = Date.now(); let g = 0, turnsDone = 0; const leaks = [];
for (g = 1; g <= NG; g++) {
  await page.evaluate(g => { window.__g = g; }, g);
  let lastTurn = -1, guard = 0;
  while (Date.now() - t0 < 14 * 60000) {
    const ph = await page.evaluate(() => G.phase);
    if (ph === "over") break;
    if (ph !== "play") { await sleep(200); continue; }
    const tn = await page.evaluate(() => G.turn);
    if (tn !== lastTurn) {
      lastTurn = tn;
      await page.evaluate(({ pools, g, tn }) => {
        const mix = ["move", "pow", "des", "dis", "sum", "pow", "move"].map((k, i) => pools[k]);
        for (const s of ["p", "a"]) {
          const e = Math.max(G.energy[s] || 1, 4); const h = [];
          for (let i = 0; i < 5; i++) { const pl = mix[(i + tn + g + (s === "a" ? 3 : 0)) % mix.length]; const ok = pl.filter(id => C[id].c <= Math.ceil(e / 1.5)); const pick = (ok.length ? ok : pl); h.push(E.mk(G, pick[(tn * 11 + i * 17 + g * 5) % pick.length], s)); }
          G.hand[s] = h; if (s === "p") G.energy.p = Math.max(G.energy.p, 12);
        }
        E.aiPlan(G, "p", 60); render();
        if (tn === 2 && g % 2) { const b = document.getElementById("btnSnap"); if (b && !b.disabled) b.click(); }
        document.getElementById("btnEnd").click();
      }, { pools, g, tn });
      /* chờ lượt chạy xong: phase đổi sang play với turn lớn hơn (hoặc over) */
      const t1 = Date.now();
      while (Date.now() - t1 < 90000) {
        const s = await page.evaluate(() => ({ ph: G.phase, tn: G.turn, ev: window.__ev.slice(-30).map(e => e.k) }));
        for (const k of Object.keys(WANT)) if (s.ev.includes(k) && !shotsDone.has(k + g % 2)) { shotsDone.add(k + g % 2); await sleep(250); await shot(`${k}_g${g}`); }
        if (await page.evaluate(() => !!document.querySelector(".l51-c")) && !shotsDone.has("lane" + g % 2)) { shotsDone.add("lane" + g % 2); await sleep(700); await shot(`lane_g${g}`); }
        if (await page.evaluate(() => !!document.querySelector(".an51")) && !shotsDone.has("snap" + g % 2)) { shotsDone.add("snap" + g % 2); await sleep(250); await shot(`snap_g${g}`); }
        if (await page.evaluate(() => !!document.querySelector(".fxr-bm")) && !shotsDone.has("beam" + g % 2)) { shotsDone.add("beam" + g % 2); await sleep(120); await shot(`beam_g${g}`); }
        if (s.ph === "over" || (s.ph === "play" && s.tn > tn)) break;
        await sleep(100);
      }
      /* đợi hết hoạt ảnh trên bàn + 3s rồi đếm phần tử sót */
      await sleep(3000);
      const left = await page.evaluate(sel => [...document.querySelectorAll(sel)].map(e => e.className.toString().slice(0, 40) + (getComputedStyle(e).display === "none" ? "(hidden)" : "")), LEFT);
      turnsDone++;
      if (left.length) leaks.push({ g, tn, left });
    }
    if (++guard > 40) break;
  }
  const r = await page.evaluate(() => G.phase); console.log(TAG, `ván ${g}: phase=${r} turn=${await page.evaluate(() => G.turn)} (${((Date.now() - t0) / 1000) | 0}s)`);
  if (g < NG) { await page.evaluate(() => document.getElementById("btnEnd").click()); await page.waitForFunction(() => G.phase === "play", null, { timeout: 40000 }).catch(() => {}); await sleep(2500); }
}
const R = await page.evaluate(() => ({ snd: window.__snd, ev: window.__ev, fr: window.__fr, beams: window.__beams, maxFx: window.__maxFx, prf: FXR.prf, spd: SPD, lvl: window.FXLV, rm: document.body.classList.contains("rm") }));
await writeFile(`/home/claude/qa52/${TAG}.json`, JSON.stringify({ R, leaks, errors, turnsDone }));
/* phân tích */
const snd = R.snd, dup = [];
for (let i = 0; i < snd.length; i++) for (let j = i + 1; j < snd.length && snd[j].t - snd[i].t < 150; j++) if (snd[j].n === snd[i].n && snd[j].g === snd[i].g) dup.push([snd[i].n, snd[i].uid, snd[j].uid, Math.round(snd[j].t - snd[i].t), "g" + snd[i].g + "t" + snd[i].tn]);
const cnt = {}; for (const s of snd) cnt[s.n] = (cnt[s.n] || 0) + 1;
const fr = R.fr.slice(5), tot = fr.reduce((a, b) => a + b, 0), slow = fr.filter(d => d > 33.4), avg = 1000 * fr.length / tot, sorted = [...fr].sort((a, b) => a - b);
const evc = {}; for (const e of R.ev) evc[e.k] = (evc[e.k] || 0) + 1;
console.log(TAG, `turns=${turnsDone} sfx=${snd.length} top=${JSON.stringify(Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 14))}`);
console.log(TAG, `events=${JSON.stringify(evc)}`);
console.log(TAG, `dups<150ms same name: ${dup.length}`, JSON.stringify(dup.slice(0, 12)));
console.log(TAG, `fps avg=${avg.toFixed(1)} p50=${sorted[sorted.length >> 1].toFixed(1)}ms p95=${sorted[(sorted.length * .95) | 0].toFixed(1)}ms p99=${sorted[(sorted.length * .99) | 0].toFixed(1)}ms frames>33ms=${(100 * slow.length / fr.length).toFixed(1)}% time-in-slow=${(100 * slow.reduce((a, b) => a + b, 0) / tot).toFixed(1)}%  maxFxNodes=${R.maxFx} spd=${R.spd} FXLV=${R.lvl} rm=${R.rm}`);
console.log(TAG, `leaks: ${leaks.length}/${turnsDone}`, JSON.stringify(leaks.slice(0, 6)));
console.log(TAG, `fxr cpu: ${R.prf.n} calls ${R.prf.ms.toFixed(0)}ms max ${R.prf.max.toFixed(1)}`);
console.log(TAG, `errors: ${[...new Set(errors)].slice(0, 6).join(" | ")}`);
await browser.close(); server.close();
