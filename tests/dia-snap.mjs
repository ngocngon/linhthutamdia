// Kiểm hoạt ảnh mở chiến địa kiểu Marvel Snap + cược "Ấn triện đỏ" (gpu51). In OK nếu đạt.
// Chạy trong thư mục tests: CHROME_PATH=/usr/bin/google-chrome node dia-snap.mjs   (ảnh: SHOTS_DIR, mặc định /home/claude/shots-gpu51/diasnap)
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const shots = process.env.SHOTS_DIR || "/home/claude/shots-gpu51/diasnap";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const errors = [], fails = [];
const must = (c, m) => { if (!c) { fails.push(m); console.log("  SAI:", m); } };
const near = (v, lo, hi) => v >= lo && v <= hi;
const VPS = (process.env.VPS ? process.env.VPS.split(",").map(v => v.split("x").map(Number)) : [[360, 640], [412, 915], [1280, 720]]);

async function open(vw, vh, slow) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, isMobile: vw < 800, hasTouch: vw < 800 });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(`${vw}x${vh} pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 120000 });
  await page.evaluate((slow) => {
    window.__snd = []; window.SFX_TAP = (n) => window.__snd.push({ n, t: performance.now() });
    window.__ev = []; window.__k0 = 0;
    const lg = (n) => window.__ev.push({ n, t: performance.now() });
    new MutationObserver((ms) => { for (const m of ms) {
      for (const x of m.addedNodes) if (x.classList) { if (x.classList.contains("l51-k")) { if (!window.__k0) window.__k0 = performance.now(); lg("k+"); } else if (x.classList.contains("l51-c")) lg("c+"); else if (x.classList.contains("l51-sw")) lg("sw+"); else if (x.classList.contains("an51")) lg("an+"); }
      for (const x of m.removedNodes) if (x.classList) { if (x.classList.contains("l51-k")) lg("k-"); else if (x.classList.contains("l51-c")) lg("c-"); else if (x.classList.contains("l51-sw")) lg("sw-"); else if (x.classList.contains("an51")) lg("an-"); }
    } }).observe(document.body, { childList: true });
    /* mỗi khung hình: ghi vị trí lá lớn, trạng thái che, tên hiện trên ô thật */
    window.__fr = [];
    const tick = () => {
      const c = document.querySelector(".l51-c"), lc = document.querySelector('#board [data-lane="0"] .locw .loc'), ln = document.querySelector('#board [data-lane="0"] .ln');
      const r = c && c.querySelector(".l51-f").getBoundingClientRect(), r2 = lc && lc.getBoundingClientRect();
      window.__fr.push({ t: performance.now(), veil: typeof LVEIL !== "undefined" && typeof G !== "undefined" && LVEIL === G, ln: ln ? ln.textContent : null, c: r ? [r.left, r.top, r.width, r.height] : null, nmo: c ? +getComputedStyle(c.querySelector(".l51-nm")).opacity : 1, cell: r2 ? [r2.left, r2.top, r2.width, r2.height] : null });
      const kk = document.querySelector(".l51-k"); if (kk && !window.__kd) { const a0 = kk.getAnimations()[0]; if (a0) window.__kd = a0.effect.getTiming().duration; }
      if (c && lc && window.__tm && !window.__geo) { /* hình học lúc kết thúc: tua hoạt ảnh bay về tới cuối trong cùng một tác vụ (không vẽ ra màn) rồi trả lại */
        const tA = c.getAnimations().find(a => a.effect.getKeyframes()[0].transform), sv = tA.currentTime;
        tA.currentTime = tA.effect.getComputedTiming().endTime - 0.5;
        const q = c.querySelector(".l51-f").getBoundingClientRect(); window.__geo = { c: [q.left, q.top, q.width, q.height], cell: [r2.left, r2.top, r2.width, r2.height] };
        tA.currentTime = sv; }
      if (c && !window.__tm) { const an = c.getAnimations(), nmA = c.querySelector(".l51-nm").getAnimations()[0], tA = an.find(a => a.effect.getKeyframes()[0].transform), vA = an.find(a => !a.effect.getKeyframes()[0].transform);
        if (tA && vA && nmA && tA.startTime != null) { const g = (x) => x.effect.getTiming(), nk = nmA.effect.getKeyframes(); window.__tm = { base: tA.startTime, tEnd: g(tA).delay + g(tA).duration, tDelay: g(tA).delay, vEnd: g(vA).delay + g(vA).duration, fade: g(nmA).delay + nk[2].offset * g(nmA).duration, kd: window.__kd }; } }
      if (window.__fr.length > 4000) window.__fr.shift();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    if (slow) { const o = window.gpuLocOpen51; window.gpuLocOpen51 = function () { SPD = 8; return o.apply(this, arguments); }; }
  }, slow);
  return page;
}
const startMatch = async (page) => {
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 60000 });
};
const idle = (page) => page.waitForFunction(() => typeof LVEIL !== "undefined" && LVEIL === null && !document.querySelector(".l51-c,.l51-k,.l51-sw,.l51-bg"), null, { timeout: 30000 });

for (const [vw, vh] of VPS) {
  const tag = `${vw}x${vh}`;
  console.log("== " + tag);
  /* ---- (A) đo nhịp ở SPD mặc định (máy chung hay bị tải nặng: thử tối đa 3 lần, lần nào đạt hết thì tính đạt; trục thời gian hoạt ảnh luôn được kiểm chính xác) ---- */
  {
    let ok = false, last = [];
    for (let att = 1; att <= (+process.env.TRIES || 3) && !ok; att++) {
      const bad = [];
      const chk = (c, m) => { if (!c) bad.push(m); };
      const page = await open(vw, vh, false);
      await startMatch(page);
      await page.waitForFunction(() => window.__ev.some(e => e.n === "sw-") || (window.__ev.some(e => e.n === "c-") && !document.querySelector(".l51-sw")), null, { timeout: 40000 });
      await idle(page);
      const r = await page.evaluate(() => ({ ev: window.__ev, snd: window.__snd, fr: window.__fr, tm: window.__tm, geo: window.__geo, spd: SPD, ln: document.querySelector('#board [data-lane="0"] .ln').textContent, name: (G.locs[0].rvl ? LOC[G.locs[0].id].n : null), left: [...document.body.children].filter(e => /^(l51|an51)/.test(e.className)).length, dat: document.body.dataset.l51 || null }));
      const t = (n) => (r.ev.find(e => e.n === n) || {}).t;
      const k0 = t("k+"), cEnd = t("c-"), swEnd = t("sw-"), tm = r.tm || {}, base = tm.base;
      const loc = r.snd.filter(s => s.n === "loc"), locT = loc[0] && loc[0].t;
      /* mốc thực đo (giờ tường) tính từ lúc các hoạt ảnh bắt đầu; mốc thiết kế lấy từ chính trục thời gian hoạt ảnh */
      const P = { p1: (tm.kd || NaN) / 1000, p2: ((locT - base) - (tm.kd || 0)) / 1000, p3: (tm.fade - (locT - base)) / 1000, p4: ((cEnd - base) - tm.fade) / 1000, tot: ((swEnd || cEnd) - base) / 1000 };
      console.log(`  [lần ${att}] SPD=${r.spd}  nhịp1 ${P.p1.toFixed(2)}s  nhịp2 ${P.p2.toFixed(2)}s  nhịp3 ${P.p3.toFixed(2)}s  nhịp4 ${P.p4.toFixed(2)}s  tổng ${P.tot.toFixed(2)}s  (lá chạm ô lúc ${((cEnd - base) / 1000).toFixed(2)} s)`);
      chk(r.spd === 2, "SPD mặc định phải 2.0");
      chk(near(P.p1, 0.25, 0.45), "nhịp 1 ≈ 0,35 s");
      chk(near(P.p2, 0.25, 0.45), "nhịp 2 ≈ 0,35 s");
      chk(near(P.p3, 0.7, 0.9), "nhịp 3 ≈ 0,8 s");
      chk(near(P.p4, 0.4, 0.6), "nhịp 4 ≈ 0,5 s");
      chk(near(P.tot, 1.9, 2.2), "tổng 1,9–2,2 s");
      chk(loc.length === 1, `tiếng loc phải đúng 1 lần (được ${loc.length})`);
      chk(!r.snd.some(s => s.n === "locrev"), "không có tiếng locrev thừa");
      const pre = r.fr.filter(f => f.t > k0 && f.t < locT - 20);
      chk(pre.length > 5 && pre.every(f => f.veil && f.ln === "?"), "trước khi lá lớn lật xong phải còn che (LVEIL===G, ô hiện \"?\")");
      const d = r.geo ? Math.max(...r.geo.c.map((v, i) => Math.abs(v - r.geo.cell[i]))) : 999;
      console.log(`    lệch lá/ô lúc chạm: ${d.toFixed(1)} px`);
      chk(d <= 4, "lá lớn kết thúc phải trùng ô ±4 px");
      chk(r.name && r.ln === r.name, `sau khi xong ô phải hiện tên thật (${r.ln} / ${r.name})`);
      chk(r.left === 0 && !r.dat, "không sót phần tử / thuộc tính");
      /* trục thời gian hoạt ảnh (không phụ thuộc tải máy): lá lớn lật xong 0,7 s, hết trình diện 1,5 s, chạm ô 1,95 s */
      chk(near(tm.vEnd, 695, 705) && near(tm.tEnd, 1945, 1955) && near(tm.tDelay, 345, 355) && near(tm.fade, 1495, 1505) && near(tm.kd, 345, 355), "trục thời gian hoạt ảnh lệch: " + JSON.stringify(tm));
      await page.context().close();
      ok = bad.length === 0; last = bad;
      if (!ok) console.log("    chưa đạt:", bad.join(" | "));
    }
    must(ok, "đo nhịp (A) không đạt sau 3 lần: " + last.join(" | "));
  }
  /* ---- (A) chụp từng nhịp (chậm ×4 chỉ để chụp) + (B) ấn triện ---- */
  {
    const page = await open(vw, vh, true);
    await startMatch(page);
    await page.waitForFunction(() => window.__k0 > 0, null, { timeout: 40000 });
    const at = async (ms, name) => {
      await page.waitForFunction((ms) => performance.now() - window.__k0 >= ms, ms);
      await page.screenshot({ path: path.join(shots, `A_${tag}_${name}.png`) });
    };
    await at(0.5 * 350 * 4, "1_lat_o_dong");
    await at((350 + 175) * 4, "2_la_lon_lat");
    await at((700 + 650) * 4, "3_ten_va_mo_ta");
    if (vw === 360 || vw === 412 || vw === 1280) {
      const box = await page.evaluate(() => { const c = document.querySelector(".l51-c"); if (!c) return null; const f = c.querySelector(".l51-f").getBoundingClientRect(), x = c.querySelector(".l51-tx").getBoundingClientRect(), ds = c.querySelector(".l51-ds"); return { f: [f.left, f.top, f.right, f.bottom], x: [x.left, x.top, x.right, x.bottom], clip: ds.scrollHeight > ds.clientHeight + 1, w: innerWidth, h: innerHeight, fw: f.width }; });
      must(box && box.f[0] >= 0 && box.x[2] <= box.w + 0.5 && box.x[3] <= box.h && box.f[1] >= 0 && !box.clip, "lá lớn + băng tên + mô tả phải nằm gọn trong màn, không cắt chữ " + JSON.stringify(box));
      must(box && box.fw <= box.w * 0.78 + 1, "lá lớn ≤ 78% bề ngang");
    }
    await at((1500 + 250) * 4, "4_bay_ve_o");
    await idle(page);
    await page.screenshot({ path: path.join(shots, `A_${tag}_5_xong.png`) });
    /* (B) ấn triện: bấm nút cược thật */
    await page.evaluate(() => { SPD = 2; window.__snd.length = 0; window.__ev.length = 0; });
    await page.evaluate(() => document.getElementById("btnSnap").click());
    await page.waitForSelector(".an51");
    const info = await page.evaluate(() => ({ txt: document.querySelector(".an51 b").textContent, want: "×" + Math.min(8, G.stake * Math.pow(2, G.pendingDouble)), snap: window.__snd.filter(s => s.n === "snap").length, svg: !!document.querySelector(".an51 svg") || !!document.querySelector(".an51 img") }));
    console.log(`  cược: "${info.txt}" (G: ${info.want}), tiếng snap ${info.snap}`);
    must(info.txt === info.want, "số cược phải khớp G");
    must(info.snap === 1, "tiếng snap đúng 1 lần");
    must(info.svg, "ấn phải có hình");
    for (const [ms, nm] of [[90, "1_giang"], [500, "2_giu"], [1200, "3_mo"]]) {
      await page.evaluate((ms) => { for (const a of document.getAnimations()) { const el = a.effect && a.effect.target; if (el && el.closest && el.closest(".an51")) { a.pause(); a.currentTime = ms; } } }, ms);
      await page.screenshot({ path: path.join(shots, `B_${tag}_${nm}.png`) });
    }
    await page.evaluate(() => { for (const a of document.getAnimations()) a.play(); });
    await page.waitForFunction(() => !document.querySelector(".an51"), null, { timeout: 8000 });
    /* ấn của đối thủ: nhỏ hơn, lệch lên trên */
    const cmp = await page.evaluate(async () => {
      snapFx("#ff4d7d", "×4", "a"); const o = document.querySelector(".an51.opp").getBoundingClientRect();
      snapFx("#b07bff", "×2"); const m = [...document.querySelectorAll(".an51")].find(e => !e.classList.contains("opp")).getBoundingClientRect();
      for (const a of document.getAnimations()) { const el = a.effect && a.effect.target; if (el && el.closest && el.closest(".an51")) { a.pause(); a.currentTime = 500; } }
      return { o: [o.width, o.top + o.height / 2], m: [m.width, m.top + m.height / 2] };
    });
    await page.screenshot({ path: path.join(shots, `B_${tag}_4_doi_thu.png`) });
    must(cmp.o[0] < cmp.m[0] && cmp.o[1] < cmp.m[1], "ấn đối thủ phải nhỏ hơn và cao hơn");
    await page.evaluate(() => { for (const a of document.getAnimations()) a.play(); });
    await page.waitForFunction(() => !document.querySelector(".an51"), null, { timeout: 8000 });
    const left = await page.evaluate(() => document.querySelectorAll(".an51,.snapfx,.l51-c,.l51-k,.l51-bg,.l51-sw").length);
    must(left === 0, "không sót phần tử sau khi xong");
    await page.context().close();
  }
  /* ---- nhiều chiến địa mở cùng lúc: lần lượt từng lá ---- */
  if (vw === 412) {
    const page = await open(vw, vh, false);
    await startMatch(page);
    await idle(page);
    await page.evaluate(() => { window.__snd.length = 0; window.__ev.length = 0; for (const i of [1, 2]) { G.locs[i].rvl = true; } render(); gpuLocReveal(1); gpuLocReveal(2); });
    await page.waitForFunction(() => window.__ev.filter(e => e.n === "c-").length === 2, null, { timeout: 30000 });
    await idle(page);
    const r = await page.evaluate(() => ({ ev: window.__ev, snd: window.__snd.filter(s => s.n === "loc").length }));
    const ks = r.ev.filter(e => e.n === "k+"), cs = r.ev.filter(e => e.n === "c-");
    const per = (cs[1].t - cs[0].t) / 1000;
    console.log(`  2 lá: tiếng loc ${r.snd}, lá 2 sau lá 1 ${per.toFixed(2)} s`);
    must(r.snd === 2, "2 chiến địa -> đúng 2 tiếng loc");
    must(near(per, 1.5, 1.95), "lá thứ 2 nhịp 3 rút còn 0,5 s (mỗi lá ≈ 1,7 s)");
    await page.context().close();
  }
}
await browser.close(); server.close();
if (errors.length) { console.log("pageerror:", errors); fails.push("có pageerror"); }
if (fails.length) { console.log("THẤT BẠI:", fails.length); process.exit(1); }
console.log("DIA-SNAP OK");
