// lane P (b44): đo khung hình lúc thẻ LẬT -> PHÓNG LỚN (ultShow / PA6 [A]) dưới CPU giả lập chậm (CDP), trên 4 thẻ:
//   S5 có ảnh tư thế (phóng lớn), S5 Duy Trì (bước chỉ có lật -> màn phóng lớn), S4 (nảy tại ô), S3 (lật thường / màn mini), một thẻ SIG (17-sig, S5 -> phóng lớn).
// Cửa sổ đo: từ lúc bước lật của thẻ bắt đầu (A:cover / flip) tới khi màn [A] đóng (Q:A/) hoặc hết màn tại ô.
// Báo p50/p95/max khung (rAF) + số tác vụ dài (longtask) và tổng ms; ngưỡng ở cuối tệp (CPU_THROTTLE mặc định 4).
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/perf-zoom.mjs
//   PERF_STRICT=0: chỉ báo số, không đặt ngưỡng. TRACE=<thư mục>: ghi trace CDP cho từng thẻ (để soi nguyên nhân).
import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = process.env.WWW || path.join(here, "..", "www");
const THR = +(process.env.CPU_THROTTLE || 4), STRICT = process.env.PERF_STRICT !== "0", TRACE = process.env.TRACE || "";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => {
  try { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); } }).listen(0);
await new Promise(r => server.once("listening", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
if (TRACE) await mkdir(TRACE, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
let failed = false;
const ok = (c, m) => { console.log((c ? "  ok   " : "  LỖI  ") + m); if (!c) failed = true; };
const errors = [];
const IGN = /ERR_TUNNEL|ERR_PROXY|Failed to load resource/;

/* thẻ đo: chọn trong trang theo dữ liệu thật (C[id].h / .t / ảnh tư thế / bảng SIG) */
const PICK = (POSE) => {
  const rev = (h) => Object.keys(C).filter(k => C[k].h === h && C[k].t === "rev" && C[k].c <= 6 && !SIGK.has(k));
  const s5 = rev("S5").filter(k => POSE.includes(k) && /[+−-]\d+ sức mạnh/i.test(C[k].x || ""));
  const s4 = rev("S4").filter(k => /[+−-]\d+ sức mạnh/i.test(C[k].x || ""));
  const s3 = ["hacbaovuong", "trungmau", "dacvutruong"].filter(k => C[k] && C[k].h === "S3").concat(rev("S3").filter(k => /[+−-]\d+ sức mạnh/i.test(C[k].x || "")));
  const dt = Object.keys(C).filter(k => C[k].h === "S5" && C[k].t === "on" && C[k].c <= 6 && POSE.includes(k) && !SIGK.has(k));
  const sg = [...SIGK.reg.keys()].filter(k => C[k] && C[k].h === "S5" && C[k].t === "rev" && C[k].c <= 6);
  return [["S5+pose", s5[0]], ["S5-DT", dt[0]], ["S4", s4[0]], ["S3", s3[0]], ["SIG", sg[0] || [...SIGK.reg.keys()][0]]].filter(x => x[1]);
};

async function runCard(label, id, all) {
  const ctx = await browser.newContext({ viewport: { width: 384, height: 854 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error" && !IGN.test(m.text())) errors.push("console: " + m.text()); });
  await page.addInitScript((DBG) => {
    localStorage.setItem("ltd_p6lv", "auto"); window.__dbg = DBG;
    window.__p6 = []; window.__fr = []; window.__lt = [];
    window.PA6_TAP = (k, o) => { window.__p6.push({ k, t: performance.now(), uid: o && o.uid }); try { performance.mark("P6:" + k); } catch (e) {} };
    let last = 0; const loop = t => { if (last) window.__fr.push([t, t - last]); last = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([e.startTime, e.duration]); }).observe({ type: "longtask", buffered: true }); } catch (e) {}
  }, !!process.env.DBG);
  await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  const deck = [id, ...all.filter(x => x !== id)];
  await page.evaluate(d => {
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); store.mute = true;
    const fill = Object.keys(C).filter(k => C[k].h === "S1" && C[k].t !== "rev" && !d.includes(k)).slice(0, 12 - d.length);
    store.decks[store.cur].ids = d.concat(fill).slice(0, 12); store.deck = store.decks[store.cur].ids;
  }, deck);
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !TURN_BUSY, null, { timeout: 120000 });
  await page.waitForTimeout(3500); /* thời gian rảnh đầu trận (warmMatch12 + lần 2 sau 1,2–1,4 s) như máy thật */
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: THR });
  await page.waitForTimeout(600);
  await cdp.send("Tracing.start", { categories: TRACE ? "devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack,disabled-by-default-devtools.timeline.frame,blink.user_timing,v8.execute,disabled-by-default-v8.cpu_profiler" : "devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing", transferMode: "ReturnAsStream" });
  const t0 = await page.evaluate(id => {
    /* thẻ cần đo: lấy từ bộ bài (đã được làm nóng như ván thật) đưa lên tay; máy không ra thẻ */
    const ix = G.deck.p.findIndex(c => c.id === id); const inst = ix >= 0 ? G.deck.p.splice(ix, 1)[0] : E.mk(G, id, "p");
    G.hand.p = [inst]; G.hand.a = []; G.energy.p = Math.max(G.energy.p, C[id].c, 6);
    window.__uid = inst.uid; window.__fr.length = 0; window.__p6.length = 0;
    window.__rc = []; const r0 = rects0; rects0 = function () { window.__rc.push(performance.now()); if (window.__dbg) window.__p6.push({ k: 'rects0 FXU' + Math.round(FX_UNTIL - performance.now()) + ' ' + (new Error().stack.split('\n')[2] || '').trim(), t: performance.now() }); return r0.apply(this, arguments); };
    E.aiPlan(G, "p", 60); render(); const t = performance.now(); performance.mark("P6:t0"); document.getElementById("btnEnd").click(); return t;
  }, id);
  await page.waitForFunction(() => G.phase === "over" || (G.phase === "play" && !TURN_BUSY), null, { timeout: 180000, polling: 250 });
  await page.waitForTimeout(300);
  const tdone = new Promise(r => cdp.once("Tracing.tracingComplete", r)); await cdp.send("Tracing.end"); const { stream } = await tdone;
  let ts = ""; for (;;) { const c = await cdp.send("IO.read", { handle: stream }); ts += c.data; if (c.eof) break; }
  if (TRACE) await writeFile(path.join(TRACE, label.replace(/\W/g, "_") + ".json"), ts);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  if (process.env.DBG) console.log(await page.evaluate(() => window.__p6.map(e => Math.round(e.t) + ' ' + e.k).join('\n')));
  const r = await page.evaluate(t0 => {
    const ev = window.__p6, u = window.__uid, f = k => (ev.find(e => e.k === k && (e.uid == null || e.uid === u)) || {}).t;
    const zA = f("A:zoom"), zEnd = (ev.find(e => e.k === "Q:A/" && e.t > (zA || 0)) || {}).t, sl = f("slot");
    let a, b, kind;
    if (zA && zEnd) { a = f("A:cover") || zA - 400; b = zEnd + 100; kind = "zoom"; } else if (sl) { a = sl - 700; b = sl + 900; kind = "slot"; } else { a = t0; b = t0 + 4000; kind = "turn"; }
    const fr = window.__fr.filter(x => x[0] >= a && x[0] <= b).map(x => x[1]).sort((x, y) => x - y);
    const lt = window.__lt.filter(x => x[0] + x[1] >= a && x[0] <= b);
    const q = p => fr.length ? fr[Math.min(fr.length - 1, Math.floor(fr.length * p))] : 0;
    const qa = f("Q:A"), ovl = zA && zEnd ? window.__rc.filter(t => t > (qa || zA) && t < zEnd).length : 0;
    return { ovl, kind, win: Math.round(b - a), n: fr.length, p50: q(0.5), p95: q(0.95), max: fr.length ? fr[fr.length - 1] : 0, lt: lt.length, ltMs: lt.reduce((s, x) => s + x[1], 0), ltMax: lt.reduce((s, x) => Math.max(s, x[1]), 0), tier: P6.tier() };
  }, t0);
  /* từ trace: thời gian CPU THẬT của luồng chính (tdur — không tính lúc máy đo bị chiếm CPU) + số lần tính bố cục / kiểu trong cửa sổ đo */
  try {
    const tev = JSON.parse(ts); const ev = Array.isArray(tev) ? tev : tev.traceEvents; let main = null;
    for (const e of ev) if (e.name === "thread_name" && e.args && e.args.name === "CrRendererMain") main = e.pid + ":" + e.tid;
    const mk = {}; for (const e of ev) if (e.name && e.name.startsWith("P6:")) (mk[e.name] = mk[e.name] || []).push(e.ts);
    const z = (mk["P6:A:zoom"] || [])[0], q = (mk["P6:Q:A"] || []).filter(t => !z || t <= z).pop(), zc = (mk["P6:Q:A/"] || []).find(t => z && t > z), sl = (mk["P6:slot"] || [])[0];
    let a, b; if (z && zc) { a = (q || z) - 50000; b = zc + 100000; } else if (sl) { a = sl - 700000; b = sl + 900000; } else { a = (mk["P6:t0"] || [0])[0]; b = a + 4000000; }
    let cpu = 0, lay = 0, sty = 0, big = 0;
    for (const e of ev) {
      if (e.ph !== "X" || e.pid + ":" + e.tid !== main || e.ts < a || e.ts > b) continue;
      if (e.name === "RunTask" || e.name === "ThreadControllerImpl::RunTask") { const c = (e.tdur != null ? e.tdur : e.dur) / 1000; cpu += c; if (c > big) big = c; }
      else if (e.name === "Layout") lay++; else if (e.name === "UpdateLayoutTree") sty++;
    }
    Object.assign(r, { cpu, lay, sty, big, twin: (b - a) / 1000 });
  } catch (e) { Object.assign(r, { cpu: -1, lay: -1, sty: -1, big: -1 }); }
  await ctx.close();
  return r;
}

let ids;
{
  const ctx = await browser.newContext({ serviceWorkers: "block" }); const page = await ctx.newPage();
  await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
  await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  ids = await page.evaluate(PICK, JSON.parse(await readFile(path.join(www, "img/pose/pose.json"), "utf8")));
  await ctx.close();
}
if (process.env.CARDS) ids = process.env.CARDS.split(",").map(s => s.split(":")).map(([l, i]) => [l, i]);
console.log(`CPU ×${THR}, 384×854 — thẻ: ${ids.map(x => x.join("=")).join(", ")}`);
const all = ids.map(x => x[1]);
/* ngưỡng (ms) cho máy này dưới CPU ×4, headless vẽ phần mềm: max khung, p95, tổng tác vụ dài trong cửa sổ */
const LIM = { cpu: +(process.env.LIM_CPU || 1800), big: +(process.env.LIM_BIG || 400), lay: +(process.env.LIM_LAY || 40) };
const res = [];
for (const [label, id] of ids) {
  const r = await runCard(label, id, all);
  res.push([label, id, r]);
  console.log(`${label.padEnd(8)} ${id.padEnd(18)} [${r.kind} ${r.win} ms, ${r.tier}] khung ${r.n}: p50 ${r.p50.toFixed(1)} p95 ${r.p95.toFixed(1)} max ${r.max.toFixed(1)} ms | longtask ${r.lt} (tổng ${r.ltMs.toFixed(0)} ms, dài nhất ${r.ltMax.toFixed(0)} ms) | bước lượt chạy giữa màn phóng lớn: ${r.ovl}`);
  if (r.kind === "zoom") ok(r.ovl === 0, `${label}: vòng lượt không chạy tiếp (rects0/render) khi màn phóng lớn còn mở`);
  console.log(`         CPU luồng chính trong cửa sổ ${r.twin.toFixed(0)} ms: ${r.cpu.toFixed(0)} ms (tác vụ lớn nhất ${r.big.toFixed(0)} ms), Layout ×${r.lay}, UpdateLayoutTree ×${r.sty}`);
  if (STRICT) ok(r.n >= 3 && r.cpu >= 0 && r.cpu <= LIM.cpu && r.big <= LIM.big && r.lay <= LIM.lay, `${label}: CPU ≤ ${LIM.cpu} ms, tác vụ ≤ ${LIM.big} ms, Layout ≤ ${LIM.lay} (khung/longtask chỉ để xem — máy đo dùng chung nên nhiễu)`);
}
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
await browser.close(); server.close();
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
