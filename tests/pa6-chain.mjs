// gpu60: kiểm chuỗi PA6 "Linh Hồn Xuất Thẻ" (www/js/15-pa6.js) trong trận thật với bộ bài nhiều thẻ S5.
//  - pha diễn đúng thứ tự: (A) phóng lớn + lật -> (B) xuất hồn -> (C) bay/trúng -> (D) chui về -> đáp ô (móc window.PA6_TAP)
//  - mỗi lượt: không sót bản sao DOM (.p6soul/.p6ai/.p6say/.p6bk/.hero5/.uc5), không thẻ trên bàn bị ẩn
//  - đo khung hình (rAF) trong lúc chuỗi diễn: p95 và số khung > 50 ms (headless vẽ bằng phần mềm -> chỉ báo cáo)
//  - chụp màn hình từng pha vào SHOTS (mặc định /home/claude/shots-pa6)
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/pa6-chain.mjs [turns]
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const SHOTS = process.env.SHOTS || "/home/claude/shots-pa6";
const TURNS = +(process.argv[2] || 6);
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
const errors = [];
const IGN = /ERR_TUNNEL|ERR_PROXY|Failed to load resource/;
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error" && !IGN.test(m.text())) errors.push("console: " + m.text()); });
let failed = false;
const ok = (c, m) => { console.log((c ? "  ok   " : "  LỖI  ") + m); if (!c) failed = true; };
await page.addInitScript((LV) => {
  localStorage.setItem("ltd_p6lv", LV);
  window.__p6 = []; window.__fr = [];
  window.PA6_TAP = (k, o) => window.__p6.push({ k, t: performance.now(), uid: o && o.uid, o });
  let last = 0;
  const loop = t => { if (last) window.__fr.push([t, t - last, !!(window.P6 && P6.ch && P6.ch()) || !!document.querySelector(".uc5")]); last = t; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}, process.env.P6LV || "full");
const DECK = ["nguyetlong", "hacdichbinh", "namtuocmatna", "tammanu", "linhduoc", "songsinhtamlinh", "bavuongtim", "conhansu", "kevocam", "maynuotthoigian", "bachdich", "tuthanmienvien"];
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 120000 });
  await page.evaluate(d => { document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); store.mute = true; store.decks[store.cur].ids = d.slice(); store.deck = store.decks[store.cur].ids; }, DECK);
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !TURN_BUSY, null, { timeout: 120000 });
  const shot = new Set();
  const cnt = {}, MAXN = { c1_bay: 3, c2_trung: 3, b_xuat_hon: 2 };
  const snap = async (k0, t) => { cnt[k0] = (cnt[k0] || 0) + 1; if (cnt[k0] > (MAXN[k0] || 1)) return; const k = cnt[k0] > 1 ? k0 + "_" + cnt[k0] : k0; shot.add(k); await page.screenshot({ path: path.join(SHOTS, `${String(shot.size).padStart(2, "0")}_${k}.png`) }); console.log("  ảnh", k, "lượt", t); if (process.env.DBG) console.log("   dbg", JSON.stringify(await page.evaluate(() => { const d = document.querySelector(".p6dim"), g = document.querySelector(".fxg.hero5"); return { dim: d && getComputedStyle(d).opacity, dimR: d && JSON.stringify(d.getBoundingClientRect()), cls: g && g.className, mc: g && g.querySelector(".mc") && g.querySelector(".mc").className, anims: d && d.getAnimations().length }; }))); };
  const PH = { "A:cover": "a0_mat_up", "A:zoom": "a1_phong_lon", "A:flip": "a2_lat_thoai", "B:pop": "b_xuat_hon", "C:fly": "c1_bay", "C:hit": "c2_trung", "D:return": "d1_bay_ve", "D:dive": "d2_chui_ve", "D:land": "d3_dap_o", slot: "s4_tai_o" };
  const DLY = { "A:zoom": 250, "A:flip": 450, "B:pop": 330, "C:fly": 250, "C:hit": 40, "D:return": 200, "D:dive": 220, "D:land": 30, slot: 120 };
  for (let t = 1; t <= TURNS; t++) {
    await page.evaluate(() => {
      const e = Math.max(G.energy.p, 6), all = Object.keys(C).filter(k => C[k].h === "S5" && C[k].c <= e && C[k].t === "rev"), hitx = all.filter(k => /[+−-]\d+ sức mạnh|tiêu huỷ/i.test(C[k].x || "")), ids = hitx.length >= 3 ? hitx : all;
      const s4 = Object.keys(C).filter(k => C[k].h === "S4" && C[k].c <= Math.max(1, e - 1) && C[k].t === "rev");
      /* tay: 2 thẻ S5 + 1 thẻ S4 (năng lượng vừa đủ) */
      const pick = (L, i) => L[(G.turn * 5 + i * 7) % L.length];
      const pref = ["cuongdomienvien", "hongve", "huyetmenu"].filter(k => C[k] && C[k].c <= e);
      G.hand.p = [E.mk(G, pref[G.turn % Math.max(1, pref.length)] || pick(ids, 0), "p"), E.mk(G, pick(ids, 1), "p"), ...(s4.length ? [E.mk(G, pick(s4, 0), "p")] : [])];
      G.energy.p = Math.max(G.energy.p, 6);
      E.aiPlan(G, "p", 60); render(); window.__ts = performance.now(); document.getElementById("btnEnd").click();
    });
    const t0 = Date.now(); let seen = 0, tapped = 0;
    while (Date.now() - t0 < 120000) {
      const st = await page.evaluate(() => ({ ev: window.__p6.map(x => x.k), busy: TURN_BUSY, ph: G.phase, over: !!G.result || G.phase === "over" }));
      for (let i = seen; i < st.ev.length; i++) { const k = st.ev[i]; if (PH[k] && (cnt[PH[k]] || 0) < (MAXN[PH[k]] || 1)) { await page.waitForTimeout(DLY[k] || 0); await snap(PH[k], t); } }
      seen = st.ev.length;
      /* tua nhanh (gpu71: nút "Bỏ qua" = FFTURN.skipNow, không còn chạm màn hình): lượt 3 trở đi, ngay sau khi nhân vật xuất hồn lần đầu */
      if (t >= 3 && !tapped && st.ev.lastIndexOf("B:pop") >= 0 && st.ev.lastIndexOf("B:pop") > st.ev.lastIndexOf("D:land")) { tapped = 1; await page.waitForTimeout(250); await page.evaluate(() => FFTURN.skipNow()); console.log("  chạm tua nhanh (lượt " + t + ")"); }
      if (st.over || (!st.busy && st.ph === "play" && Date.now() - t0 > 1500)) break;
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(400);
    const leak = await page.evaluate(() => ({
      dom: [".p6soul", ".p6ai", ".p6say", ".fxg.p6bk", ".fxg.hero5", ".uc5"].map(s => [s, document.querySelectorAll(s).length]).filter(x => x[1]),
      hid: [...document.querySelectorAll("#board [data-mc]")].filter(e => e.classList.contains("hero-hid") || getComputedStyle(e).visibility === "hidden" || +getComputedStyle(e).opacity < 0.5).map(e => e.dataset.mc),
      ch: !!(P6.ch && P6.ch()), board: document.getElementById("board").getAnimations().filter(a => a.playState === "running").length
    }));
    const nz = await page.evaluate(ts => window.__p6.filter(x => x.k === "A:zoom" && x.t >= ts).length, await page.evaluate(() => window.__ts));
    ok(nz <= 1, `lượt ${t}: ${nz} màn phóng lớn (tối đa 1 — chỉ S5 đầu tiên)`);
    ok(!leak.dom.length && !leak.hid.length && !leak.ch, `lượt ${t}: không sót DOM ${JSON.stringify(leak.dom)}, không thẻ ẩn ${JSON.stringify(leak.hid)}, chuỗi đã kết thúc`);
    if (await page.evaluate(() => !!G.result || G.phase === "over")) break;
  }
  const r = await page.evaluate(() => ({ ev: window.__p6, fr: window.__fr, st: P6.stats() }));
  const ks = r.ev.map(e => e.k);
  console.log("sự kiện:", Object.entries(ks.reduce((a, k) => (a[k] = (a[k] || 0) + 1, a), {})).map(([k, v]) => k + "×" + v).join(" "));
  // thứ tự pha trong từng chuỗi B..D
  let bad = 0, nCh = 0;
  for (let i = 0; i < r.ev.length; i++) {
    if (r.ev[i].k !== "B:start") continue;
    nCh++;
    const uid = r.ev[i].uid, seq = [];
    for (let j = i + 1; j < r.ev.length && !(r.ev[j].k === "B:start" && r.ev[j].uid === uid); j++) if (r.ev[j].uid === uid) seq.push(r.ev[j].k);
    const want = ["B:pop", "D:dive", "D:in", "D:land"], pos = want.map(k => seq.indexOf(k));
    const hits = seq.map((k, x) => k === "C:hit" ? x : -1).filter(x => x >= 0);
    const ordered = pos.every(p => p >= 0) && pos.every((p, x) => !x || p > pos[x - 1]) && hits.every(h => h > pos[0] && h < pos[1]);
    if (!ordered && !seq.includes("S:skip")) { bad++; if (bad < 4) { console.log("  thứ tự sai:", seq.join(" > ")); if (process.env.DBG) console.log("   quanh:", r.ev.slice(Math.max(0, i - 6), i + 8).map(e => ((e.t - r.ev[i].t) | 0) + ":" + e.k + "@" + e.uid).join(" ")); } }
  }
  ok(nCh >= 2, `có ${nCh} chuỗi xuất hồn`);
  ok(bad === 0, "mọi chuỗi đúng thứ tự xuất hồn > trúng > chui về > đáp ô");
  // phóng lớn: chỉ S5 đầu tiên mỗi lượt
  ok(ks.includes("A:zoom") && ks.includes("A:flip"), "có màn phóng lớn + lật (pha A)");
  ok(ks.includes("slot"), "có màn ngắn tại ô (S4 / S5 sau / S1–S3)");
  // khung hình
  const ch = r.fr.filter(f => f[2]).map(f => f[1]).sort((a, b) => a - b);
  const p95 = ch.length ? ch[Math.floor(ch.length * 0.95)] : 0, long = ch.filter(x => x > 50).length;
  console.log(`khung hình trong chuỗi: ${ch.length} khung, p50 ${ch[Math.floor(ch.length / 2)]?.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms, >50 ms: ${long}; hạt tối đa ${r.st.max} (WebGL ${r.st.gl}, mức ${r.st.tier})`);
  ok(r.st.max <= 600, "trần hạt PA6 ≤ 600");
  if (TURNS >= 3) ok(ks.includes("S:skip"), "Bỏ qua giữa chuỗi -> tua nhanh (S:skip), sau đó không sót DOM");
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.stack); }
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
await browser.close(); server.close();
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
