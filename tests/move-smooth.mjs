// Kiểm hoạt ảnh thẻ đổi chiến địa (move, swap, đẩy/kéo): bản sao bay liên tục, ô mới chỉ hiện thẻ thật sau khi đáp, thời lượng, không sót bản sao.
// Chạy trong thư mục tests: CHROME_PATH=/usr/bin/google-chrome node move-smooth.mjs   (SHOTS=thư_mục để chụp chuỗi khung)
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright-core")); } catch { try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); } }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => {
  try { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html"; const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const SHOTS = process.env.SHOTS || "";
if (SHOTS) await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
let bad = 0; const chk = (ok, m) => { console.log((ok ? "  ✓ " : "  ✗ ") + m); if (!ok) bad++; };
const errors = [];



const VPS = process.env.VPS ? JSON.parse(process.env.VPS) : [[412, 915], [360, 640]];
const SCEN = [["move", "normal"], ["move2", "normal"], ["swap", "normal"], ["opp", "normal"], ["lane", "normal"], ["src", "normal"], ["move", "lo"], ["move", "rm"]];

/* Cài móc hoạt ảnh (một lần mỗi trang): bắt chuyến bay của bản sao, vệt sáng, hoạt ảnh ghim thẻ khác. */
const HOOK = () => {
  if (window.__hooked) return; window.__hooked = 1;
  window.__fly = []; window.__tr = []; window.__pin = [];
  const AN0 = Element.prototype.animate;
  Element.prototype.animate = function (kf, o) {
    const a = AN0.call(this, kf, o);
    try {
      const c = this.classList;
      if (c && c.contains("mvfl9") && Array.isArray(kf) && kf.length >= 20) window.__fly.push({ a, el: this, t: performance.now() });
      else if (c && c.contains("mvtr9")) window.__tr.push({ a, el: this, t: performance.now() });
      else if (this.dataset && this.dataset.mc && Array.isArray(kf) && kf.length === 2 && kf[1].transform === "none" && o && o.fill === "both") window.__pin.push({ a, el: this, t: performance.now() });
    } catch (e) {}
    return a;
  };
};

/* Chạy một kịch bản: dựng bàn, chụp "khung trước bước", đổi bàn bằng engine, phát stepFx; khi các chuyến bay xuất hiện thì tạm dừng
   rồi tua từng 1/60 s (lấy mẫu mỗi khung, không phụ thuộc máy chậm), sau đó cho chạy nốt và kiểm sót. */
async function run(page, kind, mode, tag, vp) {
  const shotSpd = SHOTS ? 10 : 0;
  await page.evaluate(HOOK);
  if (shotSpd) await page.evaluate(v => { window.__spd0 = SPD; SPD = v; }, shotSpd);
  const r = await page.evaluate(async ([kind, mode, shotSpd]) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    document.querySelectorAll(".fxg,.mvtr9").forEach(e => e.remove());
    window.__fly.length = 0; window.__tr.length = 0; window.__pin.length = 0;
    for (let i = 0; i < 3; i++) { G.locs[i].cards.p = []; G.locs[i].cards.a = []; G.locs[i].rvl = true; G.locs[i].gone = false; }
    const ids = Object.keys(C).filter(k => C[k].t === "none" && C[k].c <= 3).slice(0, 12);
    const mk = (id, s) => { const c = E.mk(G, id, s); c.rev = true; c.turn = 0; c.sum = false; return c; };
    const A = mk(ids[0], "p"), B = mk(ids[1], "p"), Cc = mk(ids[2], "p"), X = mk(ids[3], "a"), Y = mk(ids[4], "p"), Z = mk(ids[5], "p");
    G.locs[0].cards.p.push(A, B, Z); G.locs[1].cards.p.push(Cc, Y); G.locs[0].cards.a.push(X);
    if (window.FXLV_SAVE === undefined) window.FXLV_SAVE = window.FXLV;
    window.FXLV = mode === "lo" ? 0 : window.FXLV_SAVE;
    reduced = mode === "rm"; document.body.classList.toggle("rm", reduced);
    render();
    { const t1 = performance.now(); while (performance.now() - t1 < 8000 && (document.getAnimations().some(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest("#board") && a.playState === "running" && a.effect.getComputedTiming().iterations !== Infinity) || document.querySelectorAll(".fxg").length)) await sleep(60); await sleep(150); }
    const rect = u => { const e = document.querySelector(`#board [data-mc="${u}"]`); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height }; };
    const wCard = rect(A.uid).w;
    const tS = performance.now(); window.__snd = []; window.SFX_TAP = n => window.__snd.push(n + "@" + Math.round(performance.now() - tS));
    const R0 = rects0(), P0 = powers(), G0 = pvSnap();
    G.evs.length = 0; if (G.msgs) G.msgs.length = 0;
    let uids;
    if (kind === "move") { uids = [A.uid]; E.moveCard(G, A, 0, 1); }
    else if (kind === "move2") { uids = [A.uid, B.uid]; E.moveCard(G, A, 0, 2); E.moveCard(G, B, 0, 2); }
    else if (kind === "opp") { uids = [A.uid, Cc.uid]; E.moveCard(G, A, 0, 1); E.moveCard(G, Cc, 1, 0); }
    else if (kind === "swap") { uids = [X.uid]; const a = G.locs[0].cards.a; a.splice(a.indexOf(X), 1); X.side = "p"; G.locs[0].cards.p.push(X); G.evs.push({ k: "morph", uid: X.uid }); }
    else if (kind === "lane") { const t = G.locs[1]; G.locs[1] = G.locs[2]; G.locs[2] = t; uids = [Cc.uid, Y.uid]; }
    else if (kind === "src") { uids = [A.uid]; G.srcU = X.uid; E.moveCard(G, A, 0, 1); G.srcU = 0; }
    const evs = G.evs.slice();
    const wanted = new Set(uids), n = uids.length;
    const start = uids.map(u => R0.get(u)).map(r => r && { x: r.x, y: r.y });
    stepFx(G0, evs, R0, P0);
    const out = { uids, wCard, start, n, mode };
    if (mode === "rm") { await sleep(700); out.snd = window.__snd.slice(); out.end = uids.map(u => rect(u)); out.left = { hid: document.querySelectorAll(".mvhd9").length, fxg: document.querySelectorAll(".fxg").length }; out.flights = window.__fly.length; return out; }
    // chờ đủ n chuyến bay
    { const tw = performance.now(); while (performance.now() - tw < 12000 && window.__fly.length < n) await sleep(15); }
    out.flights = window.__fly.length;
    const F = window.__fly.slice(), f0 = F[0] ? F[0].t : 0;
    for (const f of F) { f.a.pause(); f.off = f.t - f0; f.dur = f.a.effect.getComputedTiming().duration; }
    await sleep(40);
    const PN = window.__pin.slice(), TR = window.__tr.slice();
    for (const p of PN) { p.a.pause(); p.dur = p.a.effect.getComputedTiming().duration; p.off = p.t - f0; }
    for (const t of TR) { t.a.pause(); t.off = t.t - f0; }
    out.trailCount = TR.length; out.pinCount = PN.length;
    out.durs = F.map(f => Math.round(f.dur)); out.offs = F.map(f => Math.round(f.off));
    out.snd = window.__snd.slice();
    const FR = 1000 / 60, Tend = Math.max(...F.map(f => f.off + f.dur), 0) + FR;
    const frames = [];
    const setT = tt => {
      for (const f of F) f.a.currentTime = Math.max(0, Math.min(f.dur, tt - f.off));
      for (const p of PN) p.a.currentTime = Math.max(0, Math.min(p.dur, tt - Math.max(0, p.off)));
      for (const t of TR) t.a.currentTime = Math.max(0, tt - t.off);
    };
    const snap = tt => ({
      t: tt,
      cl: F.map(f => { const b = f.el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, b.width, f.el.isConnected ? 1 : 0, f.el.style.transform || getComputedStyle(f.el).transform]; }),
      real: uids.map(u => { const e = document.querySelector(`#board [data-mc="${u}"]`); return e ? getComputedStyle(e).visibility : "none"; }),
      oth: [...document.querySelectorAll("#board [data-mc]")].filter(e => !wanted.has(+e.dataset.mc)).map(e => { const b = e.getBoundingClientRect(); return [+e.dataset.mc, b.left + b.width / 2, b.top + b.height / 2]; }),
      tr: TR.reduce((s2, t) => s2 + (+getComputedStyle(t.el).opacity || 0), 0)
    });
    window.__scrub = tt => { setT(tt); return snap(tt); };
    out.Tend = Tend; out.shotsAt = [0, 0.25, 0.5, 0.75, 1].map(q => q * (Tend - FR));
    if (!shotSpd) { for (let tt = 0; tt <= Tend; tt += FR) { setT(tt); frames.push(snap(tt)); } out.frames = frames; await finishAll(); }
    out.finishAll = 0;
    async function finishAll() {
      setT(1e9);
      for (const p of PN) p.a.play();
      for (const t of TR) t.a.play();
      for (const f of F) f.a.play();
      await Promise.race([Promise.all(F.map(f => f.a.finished)), sleep(4000)]);
      await sleep(450);
      out.left = { clones: document.querySelectorAll(".fxg.mvfl9").length, fxg: document.querySelectorAll(".fxg").length, trail: document.querySelectorAll(".mvtr9").length, hid: document.querySelectorAll(".mvhd9").length, pinned: document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest("#board") && a.playState === "paused").length };
      out.realAfter = uids.map(u => { const e = document.querySelector(`#board [data-mc="${u}"]`); return e ? getComputedStyle(e).visibility : "none"; });
      out.end = uids.map(u => rect(u));
    }
    window.__finishAll = finishAll;
    return out;
  }, [kind, mode, shotSpd]);
  if (SHOTS && r.shotsAt) {
    for (let k = 0; k < r.shotsAt.length; k++) {
      await page.evaluate(tt => window.__scrub(tt), r.shotsAt[k]);
      await page.screenshot({ path: path.join(SHOTS, `${tag.replace("/", "-")}-${vp[0]}x${vp[1]}-${k + 1}.png`) });
    }
    await page.evaluate(async () => { await window.__finishAll(); });
    await page.evaluate(v => { SPD = window.__spd0; }, 0);
    r.frames = null; r.left = await page.evaluate(() => ({ clones: document.querySelectorAll(".fxg.mvfl9").length })); 
  }
  if (shotSpd === 0 && false) {}
  return r;
}

function analyse(tag, kind, mode, r) {
  const n = r.n;
  console.log(` - ${tag}: ${n} thẻ, ${r.flights} chuyến bay, vệt=${r.trailCount}, ghim=${r.pinCount}, thời lượng=${JSON.stringify(r.durs)}, lệch pha=${JSON.stringify(r.offs)}, âm=${(r.snd || []).join(",")}`);
  if (mode === "rm") {
    chk(r.flights === 0, "giảm hiệu ứng: không có bản sao bay (chuyển tức thời như cũ)");
    chk(r.snd.filter(s => /^move@/.test(s)).length === n, `giảm hiệu ứng: đúng ${n} tiếng move`);
    chk(r.left.hid === 0 && r.left.fxg === 0, "giảm hiệu ứng: không sót ô ẩn/bản sao");
    return;
  }
  if (!r.frames) return;
  chk(r.flights === n, `đúng ${n} bản sao bay (mỗi thẻ một bản), thực tế ${r.flights}`);
  const fr = r.frames, w = r.wCard;
  for (let i = 0; i < r.flights; i++) {
    const p = fr.map(f => f.cl[i]), d = Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]);
    let mj = 0; for (let k = 1; k < p.length; k++) mj = Math.max(mj, Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]));
    chk(d > 20 && mj <= 0.25 * d, `bản sao ${i}: quãng ${d.toFixed(0)}px, bước nhảy lớn nhất giữa hai khung 1/60 s = ${mj.toFixed(1)}px (${(mj / d * 100).toFixed(0)}%), ${p.length} khung`);
    chk(Math.abs(p[0][2] - w) < w * 0.12 && Math.abs(p[p.length - 1][2] - w) < w * 0.12, `bản sao ${i}: cùng kích thước thẻ (${p[0][2].toFixed(0)} so với ${w.toFixed(0)})`);
    chk(r.durs[i] >= 700 && r.durs[i] <= 900, `bản sao ${i}: thời lượng bay ${r.durs[i]} ms (700–900)`);
    const endIdx = fr.findIndex(f => f.t >= r.offs[i] + r.durs[i]);
    const q = p[endIdx < 0 ? p.length - 1 : endIdx];
    if (r.end[i]) chk(Math.hypot(q[0] - r.end[i].x, q[1] - r.end[i].y) < 6, `bản sao ${i}: đáp đúng ô mới (lệch ${Math.hypot(q[0] - r.end[i].x, q[1] - r.end[i].y).toFixed(1)}px)`);
    // nhấc lên: ở khoảng 50% quãng thì cao hơn đường thẳng (cong lên)
    const mid = p[Math.floor(p.length / 2)], lin = [(p[0][0] + p[p.length - 1][0]) / 2, (p[0][1] + p[p.length - 1][1]) / 2];
    chk(mid[1] < lin[1] - 4 || Math.abs(d) < 30, `bản sao ${i}: nhấc cong lên giữa đường (${(lin[1] - mid[1]).toFixed(0)}px)`);
  }
  // (b) ô mới ẩn suốt chuyến bay, hiện sau khi đáp
  let early = 0; for (const f of fr) if (f.t < Math.max(...r.offs.map((o, i) => o + r.durs[i])) - 1) f.real.forEach((v, i) => { if (f.t < r.offs[i] + r.durs[i] - 1 && v === "visible") early++; });
  chk(early === 0, `ô mới không hiện thẻ thật trước khi bản sao đáp (${early} khung vi phạm)`);
  chk(r.realAfter.every(v => v === "visible"), `sau khi đáp thẻ thật hiện (${r.realAfter})`);
  chk(r.left.clones === 0 && r.left.fxg === 0 && r.left.trail === 0 && r.left.hid === 0 && r.left.pinned === 0, `không sót bản sao/vệt/ô ẩn/hoạt ảnh ghim (${JSON.stringify(r.left)})`);
  const mv = r.snd.filter(s => /^move@/.test(s)).length;
  chk(mv === n, `đúng ${n} tiếng move (thực tế ${mv})`);
  if (kind !== "src" && kind !== "swap") chk(!r.snd.some(s => /^(e_gio|place|whoosh)@/.test(s)), "không tiếng thừa (e_gio/place/whoosh)");
  chk(mode === "lo" ? r.trailCount === 0 : r.trailCount > 0, mode === "lo" ? "FXLV=0: bỏ vệt sáng nhưng vẫn bay" : `có vệt sáng theo màu hệ (${r.trailCount} đoạn)`);
  if (mode !== "lo") chk(fr.some(f => f.tr > 0.3), "vệt sáng hiện thật (opacity > 0) trong chuyến bay");
  if (kind === "move2") { const g = r.offs[1] - r.offs[0]; chk(g >= 60 && g <= 160, `so le ${g} ms giữa hai thẻ (80–120, sai số hẹn giờ)`); }
  if (kind === "opp") { const g = Math.abs(r.offs[1] - r.offs[0]); chk(g <= 45, `hai thẻ ngược chiều bay cùng lúc (lệch ${g} ms)`);
    const a = fr.map(f => f.cl[0]), b = fr.map(f => f.cl[1]); chk((a[a.length - 1][0] - a[0][0]) * (b[b.length - 1][0] - b[0][0]) < 0, "hai thẻ đi ngược chiều nhau"); }
  // thẻ khác dồn chỗ mượt
  const first = new Map(fr[0].oth.map(o => [o[0], [o[1], o[2]]])), last = new Map(fr[fr.length - 1].oth.map(o => [o[0], [o[1], o[2]]]));
  let moved = 0;
  for (const [u, p0] of first) { const p1 = last.get(u); if (!p1) continue; const D = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); if (D < 6) continue; moved++;
    let mj = 0, pp = p0; for (const f of fr) { const q = f.oth.find(o => o[0] === u); if (q) { mj = Math.max(mj, Math.hypot(q[1] - pp[0], q[2] - pp[1])); pp = [q[1], q[2]]; } }
    chk(mj <= 0.25 * D, `thẻ khác ${u} dồn chỗ ${D.toFixed(0)}px, bước nhảy lớn nhất ${(mj / D * 100).toFixed(0)}%`); }
  if (kind === "move" || kind === "move2") chk(moved > 0, `có thẻ khác dồn chỗ (${moved})`);
}

for (const vp of VPS) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 120000 });
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 60000 });
  await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.waitForFunction(() => SFX.loaded() > 50, null, { timeout: 20000 });
  console.log(`== ${vp[0]}x${vp[1]}  SPD=${await page.evaluate(() => SPD)}`);
  chk(await page.evaluate(() => SPD) === 2, "tốc độ mặc định SPD=2");
  for (const [kind, mode] of SCEN) {
    const tag = `${kind}/${mode}`;
    if (process.env.ONLY && process.env.ONLY !== tag) continue;
    const r = await run(page, kind, mode, tag, vp);
    if (process.env.DUMP === tag && r.frames) for (const x of r.frames) console.log(x.t.toFixed(0), JSON.stringify(x.cl.map(g => g.slice(0, 3).map(Math.round))), x.real.join(','));
    analyse(tag, kind, mode, r);
  }
  await ctx.close();
}
await browser.close(); server.close();
if (errors.length) { console.log("lỗi trang:", errors.slice(0, 5)); bad++; }
console.log(bad ? `FAIL (${bad})` : "OK");
process.exit(bad ? 1 : 0);
