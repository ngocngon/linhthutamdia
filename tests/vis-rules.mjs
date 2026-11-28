// gpu68 (vis): kiểm LUẬT TRÌNH DIỄN + ngôn ngữ đổi chỉ số + chiến địa + ô cược + mặt thẻ đầy đủ.
//  1. thứ tự [A] ra mắt -> [B] kỹ năng: không sự kiện kỹ năng nào (sig, đổi chỉ số, hồn PA6, Hồn Xuất) xảy ra khi màn phóng lớn còn mở
//  2. đổi năng lượng / sức mạnh: mọi lá bị đổi đều có nhịp đổi chỉ số (P6.stat) trên chính lá đó; không còn ấn ngọc vuông lớn
//  3. chiến địa: trong lúc lộ diện và sau đó chạm vào ô chiến địa -> thông tin chiến địa hiện; lá lớn ≤ 60% bề ngang
//  4. không chữ nào ngay dưới ô cược (dải Duy Trì toàn bàn đã bỏ)
//  5. lá hiện ra từ bộ bài (Bạch Thể): mặt thẻ đầy đủ, nằm trọn trong màn hình, đúng tỉ lệ, ảnh đã tải
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/vis-rules.mjs
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const SHOTS = process.env.SHOTS || "/home/claude/shots-vis/rules";
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
const DECK = ["nuphanquan", "nuthantien", "trinu", "thiendien", "kiemnuuminh", "haplucnu", "vuabong", "tunguyennu", "nguyetthach", "bachdich", "thietgiap", "dothan"];
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
const errors = [];
const IGN = /ERR_TUNNEL|ERR_PROXY|Failed to load resource/;
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error" && !IGN.test(m.text())) errors.push("console: " + m.text()); });
let failed = false;
const ok = (c, m) => { console.log((c ? "  ok   " : "  LỖI  ") + m); if (!c) failed = true; };
await page.addInitScript(() => {
  localStorage.setItem("ltd_p6lv", "full"); localStorage.removeItem("ltd_hx_all");
  window.__ev = [];
  const push = (src) => (k, o) => window.__ev.push({ src, k, o: o || {}, t: performance.now() });
  window.PA6_TAP = push("p6"); window.SIG_TAP = push("sig"); window.HX_TAP = push("hx");
});
const SKILL = (e) => (e.src === "sig" && /^sig($|:hit|:seal|:arrow|:ink|:link|:x2)/.test(e.k)) || (e.src === "p6" && /^(stat|B:|C:|Q:B$)/.test(e.k)) || (e.src === "hx" && !/^(HX02|flip|RB)/i.test(e.k)) /* RB = rút bài đầu lượt, không thuộc kỹ năng */;
async function scen(o) {
  await page.evaluate(({ o }) => {
    P6.setTier("full"); reduced = false; document.body.classList.remove("rm");
    G.turn = o.turn || 3;
    for (const L of G.locs) { L.rvl = true; L.id = "meadow"; L.gone = false; L.cards.p.length = 0; L.cards.a.length = 0; }
    const put = (id, side, li, bonus) => { const c = E.mk(G, id, side); c.rev = true; c.played = true; c.turn = 1; c.et = G.turn; if (bonus) c.bonus = bonus; G.locs[li].cards[side].push(c); return c; };
    for (const [id, li, b] of o.foe || []) put(id, "a", li, b);
    for (const [id, li, b] of o.own || []) put(id, "p", li, b);
    G.hand.p = (o.hand || []).map(([id]) => E.mk(G, id, "p"));
    for (const id of o.extraHand || []) G.hand.p.push(E.mk(G, id, "p"));
    G.hand.a = []; G.energy.p = 40; G.energy.a = 0;
    for (const id of o.top || []) { G.deck.p = G.deck.p.filter(c => c.id !== id); G.deck.p.push(E.mk(G, id, "p")); }
    if (G.deck.p.length < 3) for (let i = 0; i < 3; i++) G.deck.p.unshift(E.mk(G, "tunguyennu", "p"));
    if (G.deck.a.length < 3) for (let i = 0; i < 3; i++) G.deck.a.unshift(E.mk(G, "thachquai", "a"));
    render();
    const hu = G.hand.p.slice(0, (o.hand || []).length).map(c => c.uid);
    (o.hand || []).forEach(([id, li], k) => E.queuePlay(G, "p", hu[k], li));
    render();
    window.__pre = { cost: new Map(G.hand.p.map(c => [c.uid, E.cost(G, c)])), pow: new Map() };
    for (let li = 0; li < 3; li++) for (const sd of ["p", "a"]) for (const c of G.locs[li].cards[sd]) window.__pre.pow.set(c.uid, E.power(G, c, li));
    window.__ev.length = 0;
  }, { o });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.getElementById("btnEnd").click());
  const t0 = Date.now();
  const probes = [];
  let shot = 0;
  while (Date.now() - t0 < 90000) {
    const st = await page.evaluate((probe) => {
      const r = { b: TURN_BUSY, ph: G.phase, s: window.__ev.map(x => x.k + ":" + (x.o.id || "")) };
      if (probe) {
        const L = [];
        for (const g of document.querySelectorAll(".fxg.t29")) {
          if (g.querySelector(".lcb")) continue; /* mặt sau đang lật */
          /* gpu69 (mục 2): đổi chỉ số lá trong bộ bài -> chỉ mặt lưng chồng bài (.dkp) */
          const k = g.querySelector(".dkp"); if (k) { const b = g.getBoundingClientRect(); L.push({ face: 0, back: 1, x0: b.left, y0: b.top, x1: b.right, y1: b.bottom, w: g.offsetWidth, h: g.offsetHeight, op: +getComputedStyle(g).opacity, vw: innerWidth, vh: innerHeight }); continue; }
          const f = g.querySelector(".fxface"); if (!f) { L.push({ face: 0 }); continue; }
          const b = f.getBoundingClientRect(), im = f.querySelector("img.art");
          const op = +getComputedStyle(g).opacity;
          L.push({ face: 1, x0: b.left, y0: b.top, x1: b.right, y1: b.bottom, w: f.offsetWidth, h: f.offsetHeight, op, img: !!(im && im.complete && im.naturalWidth && !im.dataset.sp), cst: !!f.querySelector(".cst"), pwh: !!f.querySelector(".pwh"), n: !!f.querySelector(".n"), vw: innerWidth, vh: innerHeight });
        }
        r.t29 = L;
        r.seal = document.querySelectorAll(".sgseal").length;
      }
      return r;
    }, o.probe);
    if (o.probe && st.t29 && st.t29.length) probes.push(...st.t29);
    if (o.shotAt && !shot && st.s.some(k => k.startsWith(o.shotAt))) { shot = 1; await page.waitForTimeout(o.shotDl || 250); await page.screenshot({ path: path.join(SHOTS, o.name + ".png") }); }
    if (!st.b && st.ph === "play" && Date.now() - t0 > 1500) break;
    await page.waitForTimeout(o.probe ? 40 : 80);
  }
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const ev = window.__ev.slice();
    const post = { cost: [], pow: [] };
    for (const c of G.hand.p) { const v0 = window.__pre.cost.get(c.uid); if (v0 != null && v0 !== E.cost(G, c)) post.cost.push(c.uid); }
    for (let li = 0; li < 3; li++) for (const sd of ["p", "a"]) for (const c of G.locs[li].cards[sd]) { const v0 = window.__pre.pow.get(c.uid); if (v0 != null && c.rev && v0 !== E.power(G, c, li)) post.pow.push(c.uid); }
    return { ev, post, chips: document.querySelectorAll(".stchip").length };
  });
  return { r, probes };
}
/* luật [A] -> [B]: duyệt theo thời gian, đếm số màn phóng lớn đang mở */
function seqViol(ev) {
  let open = 0; const bad = [];
  for (const e of ev.slice().sort((a, b) => a.t - b.t)) {
    if (e.src === "p6" && e.k === "Q:A") open++;
    else if (e.src === "p6" && e.k === "Q:A/") open = Math.max(0, open - 1);
    else if (open > 0 && SKILL(e)) bad.push(e.src + ":" + e.k);
  }
  return bad;
}
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.evaluate(d => { document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); store.mute = true; store.decks[store.cur].ids = d.slice(); store.deck = store.decks[store.cur].ids; }, DECK);
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !TURN_BUSY, null, { timeout: 180000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { G.hand.a = []; document.getElementById("btnEnd").click(); });
  await page.waitForFunction(() => !TURN_BUSY && G.phase === "play", null, { timeout: 180000 });

  /* 4. ô cược: không chữ ngay dưới */
  const under = await page.evaluate(() => {
    const b = document.getElementById("btnSnap").getBoundingClientRect(), out = [];
    for (const el of document.querySelectorAll("#app .sub *, #dhGlob, #dhGlob *")) {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < 0.05) continue;
      if (r.right < b.left || r.left > b.right || r.top > b.bottom + 60) continue;
      if (!el.children.length && (el.textContent || "").trim()) out.push(el.id || el.className || el.tagName);
    }
    return out;
  });
  ok(!under.length, `không chữ dưới ô cược ${JSON.stringify(under)}`);
  ok(await page.evaluate(() => { const g = document.getElementById("dhGlob"); return !g || getComputedStyle(g).display === "none"; }), "dải Duy Trì toàn bàn (#dhGlob) đã bỏ");

  /* 1+2. Nữ Phán Quan (Duy Trì, đổi năng lượng 3 lá) — thứ tự [A]->[B] + đổi chỉ số trên từng lá */
  {
    const { r } = await scen({ name: "nuphanquan", turn: 3, own: [["tunguyennu", 0]], hand: [["nuphanquan", 0]], extraHand: ["trinu", "thietgiap", "dothan"], shotAt: "stat", shotDl: 220 });
    const bad = seqViol(r.ev), za = r.ev.filter(e => e.k === "Q:A").length;
    if (process.env.DBG && bad.length) { const t0 = r.ev[0].t; console.log(r.ev.map(e => ((e.t - t0) | 0) + " " + e.src + ":" + e.k).join(" | ")); }
    ok(!bad.length, `nuphanquan: không kỹ năng nào khi màn ra mắt còn mở (mở ${za} lần) ${JSON.stringify(bad.slice(0, 5))}`);
    const st = new Set(r.ev.filter(e => e.k === "stat" && e.o.k === "cost").map(e => e.o.uid));
    ok(r.post.cost.length > 0 && r.post.cost.every(u => st.has(u)), `nuphanquan: mọi lá đổi năng lượng có nhịp đổi chỉ số (${st.size}/${r.post.cost.length})`);
    ok(!r.ev.some(e => e.k === "sig:seal") || st.size > 0, "nuphanquan: ấn ngọc vuông lớn đã thay bằng sợi sáng + đếm số");
    ok(r.chips === 0, "nuphanquan: nhãn đổi số đã tan hết");
  }
  /* Tiểu Trạng Nguyên (S5 phóng lớn) + Chủ Bút Sơn Hà (+2 mỗi thẻ Lật): đổi sức mạnh trên bàn */
  for (const o of [
    { name: "trinu", turn: 3, own: [["tunguyennu", 1], ["vuabong", 1], ["nuphanquan", 1]], foe: [["thachquai", 1]], hand: [["trinu", 1]] },
    { name: "dothan", turn: 3, own: [["nuthantien", 0], ["trinu", 1], ["vuabong", 2]], foe: [["thachquai", 1], ["tunguyennu", 2]], hand: [["dothan", 1]], shotAt: "stat", shotDl: 120 },
    { name: "vuabong", turn: 4, own: [["nuthantien", 2, 4], ["trinu", 2, 6]], foe: [["thachquai", 2, 5]], hand: [["vuabong", 2]], shotAt: "stat", shotDl: 120 },
    { name: "thiendien", turn: 4, hand: [["nuphanquan", 2], ["thiendien", 2]], extraHand: ["thietgiap"] },
  ]) {
    const { r } = await scen(o);
    const bad = seqViol(r.ev);
    ok(!bad.length, `${o.name}: không kỹ năng nào khi màn ra mắt còn mở ${JSON.stringify(bad.slice(0, 5))}`);
    const st = new Set(r.ev.filter(e => e.k === "stat").map(e => e.o.uid));
    const need = [...r.post.cost, ...r.post.pow];
    if (process.env.DBG && !need.every(u => st.has(u))) console.log([...new Set(r.ev.map(e => e.src + ':' + e.k))].join(' '), need, JSON.stringify(r.ev.filter(e=>/shift|^sig$/.test(e.k)).map(e=>e.o)));
    ok(need.every(u => st.has(u)), `${o.name}: mọi lá đổi chỉ số có nhịp đổi số trên chính lá (${need.filter(u => st.has(u)).length}/${need.length})`);
  }
  /* 5. Bạch Thể: lá trên cùng bộ bài hiện đầy đủ */
  {
    const { r, probes } = await scen({ name: "bachdich", turn: 3, own: [["tunguyennu", 2]], hand: [["bachdich", 2]], top: ["dothan"], probe: 1, shotAt: "sig:hit", shotDl: 350 });
    /* gpu69 (mục 2 đợt 44): đổi năng lượng/sức mạnh lá trên cùng -> CHỈ mặt lưng chồng bài, không lộ mặt thẻ */
    const vis = probes.filter(p => p.back && p.op > 0.9);
    ok(probes.length > 0 && probes.every(p => p.back && !p.face), `bachdich: lá trên cùng chỉ hiện mặt lưng chồng bài (${probes.length} mẫu)`);
    ok(vis.length > 0 && vis.every(p => p.x0 >= -1 && p.y0 >= -1 && p.x1 <= p.vw + 1 && p.y1 <= p.vh + 1), "bachdich: chồng bài nằm trọn trong màn hình");
    ok(vis.every(p => p.h / p.w > 1.2 && p.h / p.w < 1.5), `bachdich: đúng tỉ lệ thẻ (${vis.slice(0, 1).map(p => (p.h / p.w).toFixed(2))})`);
    ok(!seqViol(r.ev).length, "bachdich: thứ tự [A] -> [B]");
  }
  /* 3. chiến địa: chạm trong lúc lộ diện và sau đó */
  {
    await page.evaluate(() => { for (const L of G.locs) { L.rvl = true; L.gone = false; } G.locs[1].id = Object.keys(LOC).find(k => k !== "meadow" && IMGL.has(k)) || "meadow"; look = null; render(); });
    const name = await page.evaluate(() => LOC[G.locs[1].id].n);
    await page.evaluate(() => { gpuLocReveal(1); });
    await page.waitForFunction(() => { const c = document.querySelector(".l51-c"); return c && +getComputedStyle(c).opacity > 0.5; }, null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(250);
    const big = await page.evaluate(() => { const c = document.querySelector(".l51-c"); return c ? c.getBoundingClientRect().width / innerWidth : 0; });
    await page.screenshot({ path: path.join(SHOTS, "loc_reveal.png") });
    ok(big > 0 && big <= 0.6, `chiến địa: lá lộ diện gọn (${(big * 100).toFixed(0)}% bề ngang)`);
    const pt = await page.evaluate(() => { const r = document.querySelector('#board [data-lane="1"] .locw').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const top = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e ? (e.closest('#board [data-lane="1"]') ? "lane" : e.className || e.tagName) : null; }, pt);
    ok(top === "lane", `chiến địa: trong lúc lộ diện, điểm chạm thuộc ô chiến địa (${top})`);
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(250);
    const t1 = await page.evaluate(() => document.getElementById("infoText").textContent);
    ok(t1.includes(name), `chiến địa: chạm trong lúc lộ diện -> hiện thông tin (${t1.slice(0, 40)})`);
    await page.waitForTimeout(2600);
    await page.evaluate(() => { look = null; render(); });
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(250);
    const t2 = await page.evaluate(() => document.getElementById("infoText").textContent);
    ok(t2.includes(name), "chiến địa: chạm sau khi lộ diện -> hiện thông tin");
    ok(await page.evaluate(() => !document.querySelector(".l51-c,.l51-bg,.l51-k")), "chiến địa: không sót lớp lộ diện");
  }
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.stack); }
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
await browser.close(); server.close();
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
