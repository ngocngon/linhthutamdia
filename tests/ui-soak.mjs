// Chơi tự động nhiều ván trên giao diện (Playwright + Chrome) để bắt lỗi, treo lượt, rò rỉ.
// Chạy: CHROME_PATH=/usr/bin/google-chrome SOAK_GAMES=5 SOAK_CFG=0,1,2 node tests/ui-soak.mjs
//   SOAK_CFG: chỉ số cấu hình (xem CFGS), SOAK_GAMES: số ván mỗi cấu hình, SOAK_OUT: thư mục ảnh/báo cáo
// Mỗi ván xoay vòng chế độ: xếp hạng thường -> tuyển chọn -> chinh phục -> hành trình -> biến động.
// Ghi lại sau mỗi ván (ở sảnh, đã gom rác): số nút DOM, con trực tiếp của body, heap JS, interval/timeout đang sống,
// Blob URL chưa thu hồi, listener window/document, canvas, animation đang chạy (sảnh nhàn rỗi + trong trận nhàn rỗi),
// số lần gọi requestAnimationFrame mỗi giây khi nhàn rỗi.
import http from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const OUT = process.env.SOAK_OUT || "/tmp/ltd-soak";
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
await mkdir(OUT, { recursive: true });

const CFGS = [
  { vp: [412, 915], fxlv: 1, fx: "on", spd: "vua" },
  { vp: [360, 640], fxlv: 1, fx: "on", spd: "nhanh" },
  { vp: [412, 915], fxlv: 0, fx: "on", spd: "nhanh" },
  { vp: [360, 640], fxlv: 0, fx: "off", spd: "nhanh" },
  { vp: [412, 915], fxlv: 1, fx: "off", spd: "nhanh" },
  { vp: [360, 640], fxlv: 1, fx: "on", spd: "vua" },
];
const MODES = ["rank", "draft", "conq", "jr", "wk"];
const NG = +process.env.SOAK_GAMES || 5;
const pick = (process.env.SOAK_CFG || CFGS.map((_, i) => i).join(",")).split(",").map(Number);

/* gắn trước mọi script của trang: đếm timer, Blob URL, listener, rAF */
function instrument(fxlv) {
  const W = window, T = W.__T = { iv: new Set(), to: new Set(), blob: new Set(), lis: 0, raf: 0 };
  const si = W.setInterval, ci = W.clearInterval, st = W.setTimeout, ct = W.clearTimeout;
  W.setInterval = function (f, ms, ...a) { const id = si.call(W, f, ms, ...a); T.iv.add(id); return id; };
  W.clearInterval = function (id) { T.iv.delete(id); return ci.call(W, id); };
  W.setTimeout = function (f, ms, ...a) { let id; const g = typeof f === "function" ? function () { T.to.delete(id); return f.apply(this, arguments); } : f; id = st.call(W, g, ms, ...a); T.to.add(id); return id; };
  W.clearTimeout = function (id) { T.to.delete(id); return ct.call(W, id); };
  const co = URL.createObjectURL, ro = URL.revokeObjectURL;
  URL.createObjectURL = function (b) { const u = co.call(URL, b); T.blob.add(u); return u; };
  URL.revokeObjectURL = function (u) { T.blob.delete(u); return ro.call(URL, u); };
  for (const o of [W, document]) { const ae = o.addEventListener, re = o.removeEventListener; o.addEventListener = function () { T.lis++; return ae.apply(this, arguments); }; o.removeEventListener = function () { T.lis--; return re.apply(this, arguments); }; }
  const rf = W.requestAnimationFrame; W.requestAnimationFrame = function (f) { T.raf++; return rf.call(W, f); };
  if (fxlv != null) { let v = fxlv; Object.defineProperty(W, "FXLV", { configurable: true, get: () => v, set: () => {} }); }
}

/* một bước tự lái trong trang: trả về trạng thái để node theo dõi */
function stepPage(mode) {
  const $ = id => document.getElementById(id), on = id => { const e = $(id); return !!e && e.classList.contains("on"); };
  const vis = e => e && !e.disabled && e.offsetParent !== null;
  const clickFirst = sels => { for (const s of sels) { const e = [...document.querySelectorAll(s)].find(vis); if (e) { e.click(); return s; } } return null; };
  const g = typeof G !== "undefined" ? G : null;
  const st = { mm: on("mm"), ph: g ? g.phase : "-", t: g ? g.turn : 0, mk: g && g.mode ? g.mode.k : "rank", lobby: on("lobby"), ovs: [...document.querySelectorAll(".ov.on")].map(o => o.id) };
  if (on("mm")) { st.did = "mm"; return st; } /* đang ghép trận: chờ, không bấm thêm */
  if (on("ovOpen")) { clickFirst(["#openBody [data-op=x]", "#openBody .opx", "#openBody button"]); st.did = "open"; return st; }
  if (on("ovEnd")) { st.did = "end"; return st; }
  if (on("ovGacha")) { clickFirst(["#ovGacha .foot button"]); st.did = "gacha"; return st; }
  if (on("ovRun")) {
    const r = clickFirst(["#drClaim", "#drPlay", "#cqPlay", "#jrPlay", "#wkPlay", "#jrGo", "#jrStart", "#runBody [data-drp]", "#runBody [data-jp]", "#runBody [data-dru]", "#runBody [data-ju]", "#runBody [data-jr]", "#runBody [data-js]", "#runBody [data-jx]", "#runBody [data-jy]", "#runBody [data-jf]", "#runBody [data-jk]", "#runBody [data-jn]", "#runBody [data-cq]", "#drSkip", "#jrRelSkip", "#jrUpSkip", "#runFoot .btn.end", "#runBody .btn.end"]);
    st.did = "run:" + r; return st;
  }
  if (st.ovs.length && !(g && g.phase === "play" && !st.lobby)) { st.did = "close"; return st; }
  if (st.lobby) {
    if (mode === "rank") { $("lbPlay").click(); st.did = "lbPlay"; return st; }
    if (!on("ovModes")) { document.querySelector('[data-nav="modes"]').click(); st.did = "nav"; return st; }
    return st;
  }
  if (g && g.phase === "play" && !st.ovs.length && !window.__hold) {
    if (window.__lastPlay !== g.turn + ":" + g.rs) {
      window.__lastPlay = g.turn + ":" + g.rs;
      try { E.aiPlan(g, "p", 40); render(); } catch (e) { st.err = String(e); }
      if (g.turn === 3 && !g.snap.p && Math.random() < .5) { const b = $("btnSnap"); if (vis(b)) b.click(); }
    }
    const b = $("btnEnd"); if (vis(b)) b.click(); st.did = "endTurn";
  }
  return st;
}
const modeBtn = { draft: "modeDraft", conq: "modeConq", jr: "modeJr", wk: "modeWk" };

const report = { cfgs: [] }, errors = [];
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--enable-precise-memory-info"] });
for (const ci of pick) {
  const cfg = CFGS[ci], tag = `c${ci}-${cfg.vp.join("x")}-lv${cfg.fxlv}-${cfg.fx}-${cfg.spd}`;
  console.log("== cấu hình " + tag);
  const ctx = await browser.newContext({ viewport: { width: cfg.vp[0], height: cfg.vp[1] }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(instrument, cfg.fxlv);
  const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
  const errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message + " @" + (e.stack || "").split("\n").slice(1, 3).join(" | ")));
  page.on("console", m => { if (m.type() === "error") errs.push("console.error: " + m.text()); });
  page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(BASE)) errs.push("http " + r.status() + ": " + r.url()); });
  page.on("requestfailed", r => { if (r.url().startsWith(BASE)) errs.push("requestfailed: " + r.url()); });
  await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.evaluate(c => { store.fx = c.fx; reduced = c.fx === "off"; document.body.classList.toggle("rm", reduced); store.spd = c.spd; SPD = SPDV[c.spd] || 1; store.gold = 99999; save(); }, cfg);
  const metrics = async (where) => {
    await cdp.send("HeapProfiler.collectGarbage").catch(() => {});
    await page.waitForTimeout(400);
    await cdp.send("Performance.enable").catch(() => {});
    const pm = async () => Object.fromEntries(((await cdp.send("Performance.getMetrics").catch(() => ({ metrics: [] }))).metrics || []).map(m => [m.name, m.value]));
    const a0 = await pm();
    const r = await page.evaluate(async (where) => {
      const T = window.__T, r0 = T.raf; await new Promise(r => setTimeout(r, 1000)); const raf = T.raf - r0;
      const anims = document.getAnimations().filter(a => a.playState === "running");
      const names = {}; for (const a of anims) { const t = a.effect && a.effect.target; const k = (a.animationName || a.constructor.name) + "@" + (t ? (t.id || (t.className && String(t.className).split(" ")[0]) || t.tagName) : "?"); names[k] = (names[k] || 0) + 1; }
      return { where, bodyCls: document.body.className, nodes: document.getElementsByTagName("*").length, body: document.body.children.length, heapMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1), iv: T.iv.size, to: T.to.size, blob: T.blob.size, lis: T.lis, canvas: document.querySelectorAll("canvas").length, anims: anims.length, top: Object.entries(names).sort((a, b) => b[1] - a[1]).slice(0, 6), rafPerSec: raf, bodyKids: [...document.body.children].map(e => e.tagName + (e.id ? "#" + e.id : e.className ? "." + String(e.className).split(" ")[0] : "")).slice(-8) };
    }, where);
    const a1 = await pm(); /* thời gian CPU luồng chính (ms) trong ~1 s nhàn rỗi */
    r.cpuMs = Math.round(((a1.TaskDuration || 0) - (a0.TaskDuration || 0)) * 1000); r.layouts = (a1.LayoutCount || 0) - (a0.LayoutCount || 0); r.styles = (a1.RecalcStyleCount || 0) - (a0.RecalcStyleCount || 0);
    return r;
  };
  const C = { tag, games: [], metrics: [await metrics("lobby0")], hangs: [], modeFail: [] };
  for (let gi = 0; gi < NG; gi++) {
    const mode = MODES[gi % MODES.length], t0 = Date.now();
    let last = "", lastT = Date.now(), idleChecked = false, entered = false, res = null;
    while (Date.now() - t0 < 12 * 60000) {
      let st;
      try {
        if (mode !== "rank" && !entered) await page.evaluate(id => { const m = document.getElementById("ovModes"); if (m && m.classList.contains("on")) document.getElementById(id).click(); }, modeBtn[mode]);
        st = await page.evaluate(stepPage, mode);
      } catch (e) { st = { ph: "?", err: String(e) }; }
      if (st.err) errs.push("bước: " + st.err);
      if (st.ph === "play" && !st.lobby) {
        if (!entered && st.mk !== mode) { /* trận cũ của chế độ khác còn dở: về sảnh */ }
        entered = true;
        if (!idleChecked && st.t === 1) { /* đo nhàn rỗi trong trận: giữ tay 4 s */
          idleChecked = true; await page.evaluate(() => { window.__hold = 1; }); await page.waitForTimeout(3000);
          C.metrics.push(await metrics(`match-idle g${gi} ${mode}`)); await page.evaluate(() => { window.__hold = 0; });
        }
      }
      if (st.ovs && st.ovs.includes("ovEnd") && entered) {
        res = await page.evaluate(() => ({ w: G.result && G.result.winner, turn: G.turn, k: G.mode ? G.mode.k : "rank" }));
        await page.waitForTimeout(1200); await page.screenshot({ path: path.join(OUT, `${tag}-g${gi}-${mode}-end.png`) }).catch(() => {});
        await page.evaluate(() => document.getElementById("btnEndLobby").click());
        break;
      }
      if (st.ovs && st.ovs.includes("ovEnd") && !entered) await page.evaluate(() => document.getElementById("btnEndLobby").click());
      const key = JSON.stringify([st.ph, st.t, st.ovs, st.lobby, st.did && st.did.startsWith("run") ? st.did : ""]);
      if (key !== last) { last = key; lastT = Date.now(); }
      else if (Date.now() - lastT > 60000) {
        const dump = await page.evaluate(() => ({ ph: G && G.phase, turn: G && G.turn, q: G && G.q, ovs: [...document.querySelectorAll(".ov.on")].map(o => o.id), btnEnd: document.getElementById("btnEnd").outerHTML.slice(0, 300), run: (document.getElementById("runBody") || {}).innerText })).catch(e => String(e));
        C.hangs.push({ gi, mode, key, dump }); console.log("  TREO: " + key + " " + JSON.stringify(dump).slice(0, 400));
        await page.screenshot({ path: path.join(OUT, `${tag}-g${gi}-${mode}-hang.png`) }).catch(() => {});
        await page.evaluate(() => { try { G.phase = "over"; } catch (e) {} showLobby(); }); break;
      }
      await page.waitForTimeout(st.ph === "play" ? 350 : 250);
    }
    if (!entered) { C.modeFail.push(mode); await page.screenshot({ path: path.join(OUT, `${tag}-g${gi}-${mode}-noenter.png`) }).catch(() => {}); await page.evaluate(() => showLobby()); }
    await page.waitForTimeout(2500);
    const m = await metrics(`lobby g${gi} ${mode}`);
    C.metrics.push(m); C.games.push({ gi, mode, res, sec: Math.round((Date.now() - t0) / 1000) });
    console.log(`  ván ${gi} ${mode}: ${JSON.stringify(res)} ${Math.round((Date.now() - t0) / 1000)}s | nodes=${m.nodes} body=${m.body} heap=${m.heapMB}MB iv=${m.iv} to=${m.to} blob=${m.blob} lis=${m.lis} canvas=${m.canvas} anims=${m.anims} raf/s=${m.rafPerSec}`);
  }
  C.errors = [...new Set(errs)]; errors.push(...C.errors.map(e => tag + " " + e));
  report.cfgs.push(C);
  await ctx.close();
}
await browser.close(); server.close();
await writeFile(path.join(OUT, `report-${pick.join("_")}.json`), JSON.stringify(report, null, 1));
for (const C of report.cfgs) {
  console.log(`\n# ${C.tag}: ${C.games.length} ván, treo ${C.hangs.length}, không vào được: ${C.modeFail.join(",") || "-"}`);
  for (const m of C.metrics) console.log(`  ${m.where.padEnd(26)} nodes=${m.nodes} body=${m.body} heap=${m.heapMB} iv=${m.iv} to=${m.to} blob=${m.blob} lis=${m.lis} canvas=${m.canvas} anims=${m.anims} raf/s=${m.rafPerSec} cpu=${m.cpuMs}ms lay=${m.layouts} sty=${m.styles} ${JSON.stringify(m.top)}`);
}
if (errors.length) console.log("\nLỖI TRANG:\n" + [...new Set(errors)].slice(0, 60).join("\n"));
const bad = errors.length || report.cfgs.some(c => c.hangs.length || c.modeFail.length);
console.log(bad ? "SOAK CÓ VẤN ĐỀ" : "SOAK OK");
process.exit(bad ? 1 : 0);
