// gpu61: kiểm HỒN XUẤT vòng 2 (www/js/16-hx.js) trong trận thật.
//  - bộ bài 20 thẻ có ảnh tư thế (img/pose/pose.json); kỹ năng Lật của vài thẻ được thay tạm (E.REV) để gây đúng loại sự kiện engine:
//    tiêu huỷ / vứt bỏ / triệu hồi / hồi sinh / tăng-giảm sức nhiều mục tiêu / dời thẻ / trả về tay. Thẻ đối chứng (không có ảnh tư thế) dùng cùng kỹ năng.
//  - mỗi kịch bản = một lượt: kiểm HX đúng loại chỉ bật cho thẻ Hồn Xuất (móc window.HX_TAP), nhiều mục tiêu gom một lần toả (HXfan),
//    không sót DOM, không thẻ bị ẩn, không khung rỗng (mẫu HXG.audit() mỗi khung rAF trong lúc diễn), thống kê khung hình.
//  - chụp từng nhịp HX vào SHOTS (mặc định /home/claude/shots-hx2)
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/hx-chain.mjs [chỉ-kịch-bản]
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const SHOTS = process.env.SHOTS || "/home/claude/shots-hx2";
const ONLY = process.argv[2] || "";
/* chụp ảnh: chạy chậm (SPD × SLOW, tắt tự tua nhanh) để chụp đúng nhịp; NOSHOT=1: tốc độ thật, không chụp -> số đo khung hình */
const NOSHOT = !!process.env.NOSHOT, SLOW = NOSHOT ? 1 : +(process.env.SLOW || 2.5);
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
await page.addInitScript(() => {
  localStorage.setItem("ltd_p6lv", "full");
  localStorage.removeItem("ltd_hx_all");
  window.__hx = []; window.__fr = []; window.__bad = [];
  window.HX_TAP = (k, o) => window.__hx.push({ k, t: performance.now(), o: o || {} });
  let last = 0;
  const loop = t => {
    const act = !!(window.HXG && (HXG.busy() || document.querySelector(".hxsoul,.hxds,.mc.hxpk,.mc.hx2z,.fxg.hxd")));
    if (last) window.__fr.push([t, t - last, act, !!(window.P6 && P6.ch && P6.ch())]);
    last = t;
    if (act) { try { const b = HXG.audit(); if (b.length) window.__bad.push([t, b.join(",")]); } catch (e) {} }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
const POSE = JSON.parse(await readFile(path.join(www, "img/pose/pose.json"), "utf8"));
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 120000 });
  await page.evaluate(d => { document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); store.mute = true; store.decks[store.cur].ids = d.slice(0, 12); store.deck = store.decks[store.cur].ids; }, POSE);
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !TURN_BUSY, null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  /* lượt khởi động (màn mở đầu / lộ diện chiến địa lượt 1) */
  await page.evaluate(() => { G.hand.a = []; document.getElementById("btnEnd").click(); });
  await page.waitForFunction(() => !TURN_BUSY && G.phase === "play", null, { timeout: 120000 });
  await page.waitForTimeout(800);
  if (SLOW !== 1) await page.evaluate((k) => { SPD = (SPDV[store.spd] || 1) * k; FFTURN.start = () => {}; }, SLOW);
  /* kỹ năng thử (thay tạm E.REV): mỗi kỹ năng gây đúng loại sự kiện engine */
  await page.evaluate((POSE) => {
    window.__POSE = POSE;
    const NEG = Object.keys(C).find(k => C[k].h === "S5" && C[k].t === "rev" && !POSE.includes(k) && C[k].c <= 6);
    window.__NEG = NEG;
    const foes = (G) => [0, 1, 2].flatMap(li => G.locs[li].cards.a.filter(c => c.rev).map(c => [c, li]));
    const mine = (G, i) => [0, 1, 2].flatMap(li => G.locs[li].cards.p.filter(c => c.rev && c !== i).map(c => [c, li]));
    const kill1 = (G, i) => { const f = foes(G)[0]; if (f) E.destroy(G, f[0], f[1]); };
    window.__AB = {
      kill1, kill2: (G, i) => { for (const [c, li] of foes(G).slice(0, 2)) E.destroy(G, c, li); },
      up3: (G, i) => { for (const [c] of mine(G, i)) { c.bonus += 3; } },
      down3: (G, i) => { for (const [c] of foes(G)) { c.bonus -= 2; } },
      up1: (G, i) => { const m = mine(G, i)[0]; if (m) m[0].bonus += 3; },
      sum1: (G, i) => { const li = E.locOf(G, i); E.summon(G, "p", "thachnhan", li); },
      sum3: (G, i) => { for (const li of [0, 1, 2]) E.summon(G, "p", "thachnhan", li); },
      move1: (G, i) => { const m = mine(G, i).find(x => x[1] === 0); if (m) E.moveCard(G, m[0], 0, 2); },
      bounce1: (G, i) => { const f = foes(G)[0]; if (!f) return; const [c, li] = f, a = G.locs[li].cards.a; a.splice(a.indexOf(c), 1); c.rev = false; c.played = false; E.toHand(G, "a", c); },
      disc2: (G, i) => { if (G.hand.p[0]) E.discard(G, "p", G.hand.p[0]); if (G.hand.a[0]) E.discard(G, "a", G.hand.a[0]); },
      none: () => {},
    };
    window.__REV0 = Object.assign({}, E.REV);
  }, POSE);

  const shotN = { n: 0 };
  const snap = async (k) => { if (NOSHOT) return; shotN.n++; const f = `${String(shotN.n).padStart(2, "0")}_${k}.png`; await page.screenshot({ path: path.join(SHOTS, f) }); console.log("  ảnh", f); return f; };
  const SHOTS_AT = { /* nhịp HX -> các mốc chụp (ms sau sự kiện) */
    HX01: [["HX01_rut_bai_bay", 200]], "HX01:land": [["HX01_rut_bai_dap", 90]],
    HX02: [["HX02_lat_xoay", 170]], "HX02:land": [["HX02_lat_lo_hon", 150]],
    HX03: [["HX03_huy_hon_bi_giat", 150]], "HX03:soul": [["HX03_huy_hon_vo", 70]], "HX03:frame": [["HX03_huy_khung_vun", 120]],
    HX04: [["HX04_vut_nhac", 330]], "HX04:burn": [["HX04_vut_chay", 300]], "HX04:grave": [["HX04_vut_vao_mo", 0]],
    "HX05": [["HX05_trieu_hon_giang", 140]], "HX05:in": [["HX05_trieu_chui_vao", 40]],
    "HXfan:bolts": [["HXfan_toa_tia_hon", 60]],
    "HX06:flex": [["HX06_tang_gong", 170]], "HX07:drain": [["HX07_giam_hut", 180]],
    HX08: [["HX08_di_chuyen_bay", 170]], "HX08:land": [["HX08_di_chuyen_dap", 40]],
    "HX09:arm": [["HX09_tay_vuon", 200]], "HX:hit": [["HX_hit", 50]],
  };
  const taken = new Map();
  /* một kịch bản = một lượt */
  async function scen(name, o) {
    if (ONLY && !name.includes(ONLY)) return null;
    console.log(`\n== ${name}`);
    const n0 = await page.evaluate(({ o }) => {
      if (o.tier) P6.setTier(o.tier); else P6.setTier("full");
      E.REV = Object.assign(E.REV, window.__REV0);
      for (const [id, ab] of Object.entries(o.ab || {})) E.REV[id] = window.__AB[ab];
      G.turn = (window.__tn = (window.__tn || 0) + 1) % 2 ? 3 : 4; /* đổi lượt -> thẻ S5 đầu tiên của lượt được phóng lớn như trận thật */
      for (const L of G.locs) { L.rvl = true; L.id = "meadow"; L.gone = false; L.cards.p.length = 0; L.cards.a.length = 0; }
      const put = (id, side, li, pw) => { const c = E.mk(G, id, side); c.rev = true; c.played = true; c.turn = 1; if (pw != null) c.bp = pw; G.locs[li].cards[side].push(c); return c; };
      for (const [id, li] of o.foe || []) put(id, "a", li);
      for (const [id, li] of o.own || []) put(id, "p", li);
      G.dead.p.length = 0;
      for (const id of o.dead || []) { const c = E.mk(G, id, "p"); c.dt = G.turn - 1; G.dead.p.push(c); }
      G.hand.p = (o.hand || []).map(([id]) => E.mk(G, id, "p"));
      G.hand.a = (o.foeHand || []).map(id => E.mk(G, id, "a"));
      G.energy.p = 40; G.energy.a = 0;
      /* lá rút đầu lượt sau */
      const tops = o.draw || [];
      G.deck.p = G.deck.p.filter(c => !tops.includes(c.id));
      for (const id of tops) G.deck.p.push(E.mk(G, id, "p"));
      render();
      const hs = G.hand.p.slice(0, (o.hand || []).length);
      (o.hand || []).forEach(([id, li], k) => { const c = hs[k]; if (c && li != null) E.queuePlay(G, "p", c.uid, li); });
      render();
      window.__ts = performance.now();
      return window.__hx.length;
    }, { o });
    await page.waitForTimeout(250);
    await page.evaluate(() => document.getElementById("btnEnd").click());
    const t0 = Date.now(); let seen = n0, tapped = 0;
    while (Date.now() - t0 < 90000 * SLOW) {
      const st = await page.evaluate(() => ({ ev: window.__hx.map(x => x.k), busy: TURN_BUSY, ph: G.phase, over: !!G.result || G.phase === "over" }));
      for (let i = seen; i < st.ev.length; i++) {
        const k = st.ev[i], L = (process.env.BURST ? [] : SHOTS_AT[k]) || [];
        if (process.env.BURST === k && !NOSHOT) { for (let b = 0; b < 8; b++) { await snap(`burst_${k.replace(/:/g, "_")}_${b}`); await page.waitForTimeout(+(process.env.BSTEP || 60)); } }
        for (const [nm, dl] of L) { const key = nm + (o.tag || ""); if ((taken.get(key) || 0) >= (o.shotMax || 1)) continue; taken.set(key, (taken.get(key) || 0) + 1); if (dl && !NOSHOT) await page.waitForTimeout(dl * SLOW); await snap(`${nm}${o.tag || ""}`); }
      }
      seen = st.ev.length;
      if (o.skip && !tapped && st.ev.slice(n0).includes(o.skip)) { tapped = 1; await page.waitForTimeout(60 * SLOW); await page.evaluate(() => document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); console.log("  chạm tua nhanh"); }
      if (st.over || (!st.busy && st.ph === "play" && Date.now() - t0 > 1500)) break;
      await page.waitForTimeout(25);
    }
    await page.waitForTimeout(1100 * SLOW);
    const r = await page.evaluate(({ n0 }) => {
      const ev = window.__hx.slice(n0);
      const leak = [".hxsoul", ".hxds", ".hxcv", ".hxbolt", ".mc.hxpk", ".mc.hxm", ".mc.hx2z", ".fxg.hxd", ".p6soul", ".p6ai", ".p6say", ".fxg.hero5", ".uc5"].map(s => [s, document.querySelectorAll(s).length]).filter(x => x[1]);
      const hid = [...document.querySelectorAll("#board [data-mc], #hand [data-hc]")].filter(e => e.classList.contains("hero-hid") || getComputedStyle(e).visibility === "hidden" || +getComputedStyle(e).opacity < 0.5).map(e => e.dataset.mc || ("h" + e.dataset.hc));
      const arts = [...document.querySelectorAll("#board [data-mc] img.art")].filter(i => getComputedStyle(i).visibility === "hidden" || +getComputedStyle(i).opacity < 0.5 || i.getAnimations().some(a => a.playState === "running" && isFinite(a.effect.getTiming().iterations))).length;
      return { ev, leak, hid, arts, busy: HXG.busy(), ch: !!P6.ch() };
    }, { n0 });
    const ks = r.ev.map(e => e.k);
    console.log("  HX:", Object.entries(ks.reduce((a, k) => (a[k] = (a[k] || 0) + 1, a), {})).map(([k, v]) => k + "×" + v).join(" ") || "(không)");
    ok(!r.leak.length && !r.hid.length && !r.arts && !r.busy && !r.ch, `${name}: không sót DOM ${JSON.stringify(r.leak)}, không thẻ ẩn ${JSON.stringify(r.hid)}, ảnh nhân vật về chỗ (${r.arts}), không việc HX treo (${r.busy})`);
    return r;
  }
  const has = (r, k, pred) => !!r && r.ev.some(e => e.k === k && (!pred || pred(e.o)));
  const cnt = (r, k) => (r ? r.ev.filter(e => e.k === k).length : 0);
  const NEG = await page.evaluate(() => window.__NEG);
  console.log("thẻ đối chứng (không ảnh tư thế):", NEG);
  const F3 = [["thachquai", 0], ["thachquai", 1], ["thachquai", 2]];

  let r;
  r = await scen("HX-03 hủy 1 mục tiêu + HX-02 lật thẻ S5 thứ hai + HX-01 rút", { ab: { bachdich: "kill1" }, foe: [["thachquai", 0]], own: [["thachnhan", 1]], hand: [["bachdich", 0], ["kevocam", 1]], draw: ["linhduoc"] });
  if (r) { ok(has(r, "HX03") && has(r, "HX03:soul") && has(r, "HX03:frame"), "HX-03: hồn bị giật -> vỡ -> khung vụn"); ok(has(r, "HX02"), "HX-02: thẻ S5 thứ hai lật kiểu Hồn Xuất"); ok(has(r, "HX01"), "HX-01: rút thẻ Hồn Xuất"); }
  r = await scen("đối chứng: thẻ thường cùng kỹ năng hủy + rút thẻ thường", { ab: { [NEG]: "kill1" }, foe: [["thachquai", 0]], hand: [[NEG, 0]], draw: ["thachnhan"] });
  if (r) { ok(!has(r, "HX03") && !has(r, "HX01") && !has(r, "HX02"), "không HX nào bật cho thẻ không có ảnh tư thế"); }
  r = await scen("HX-06 tăng sức 3 mục tiêu (toả một lần)", { ab: { chienthan: "up3" }, own: [["thachnhan", 0], ["thachnhan", 1], ["thachnhan", 2]], hand: [["chienthan", 1]], draw: ["tammanu"] });
  if (r) { ok(has(r, "HXfan", o => o.n === 3), "HX-06: 3 mục tiêu gom một mốc (HXfan n=3)"); ok(cnt(r, "HX:hit") === 1 && has(r, "HX:hit", o => o.n === 3 && o.fan), "HX-06: một điểm dừng duy nhất, toả 3"); ok(cnt(r, "HX06:flex") === 3, "HX-06: 3 hồn đồng minh gồng cùng lúc"); ok(has(r, "HXfan:bolts"), "HX-06: tia hồn toả"); }
  r = await scen("HX-06 tăng sức 1 mục tiêu", { ab: { chienthan: "up1" }, own: [["thachnhan", 0]], hand: [["chienthan", 0]] });
  if (r) { ok(cnt(r, "HX06:flex") === 1 && !has(r, "HXfan"), "HX-06 đơn: 1 gồng, không toả"); }
  r = await scen("HX-07 giảm sức 3 mục tiêu", { ab: { tammanu: "down3" }, foe: F3, hand: [["tammanu", 1]] });
  if (r) { ok(has(r, "HXfan", o => o.n === 3) && cnt(r, "HX:hit") === 1, "HX-07: 3 mục tiêu một lần toả"); ok(cnt(r, "HX07:drain") === 3, "HX-07: hút cả 3 cùng lúc"); }
  r = await scen("HX-07 giảm sức 1 mục tiêu", { ab: { tammanu: "down3" }, foe: [["thachquai", 0]], hand: [["tammanu", 0]] });
  if (r) { ok(cnt(r, "HX07:drain") === 1, "HX-07 đơn: hút 1"); }
  r = await scen("HX-05 triệu hồi 3 (toả một lần)", { ab: { songsinhtamlinh: "sum3" }, hand: [["songsinhtamlinh", 1]] });
  if (r) { ok(has(r, "HXfan", o => o.n === 3) && cnt(r, "HX05") === 3 && cnt(r, "HX05:in") >= 2, "HX-05: 3 khung thành hình + hồn giáng cùng lúc"); }
  r = await scen("HX-05 triệu hồi 1", { ab: { linhduoc: "sum1" }, hand: [["linhduoc", 0]] });
  if (r) { ok(cnt(r, "HX05") === 1, "HX-05 đơn"); }
  r = await scen("HX-05 hồi sinh 2 (Tử Thần Miền Viễn, kỹ năng thật)", { dead: ["thachnhan", "thachquai"], hand: [["tuthanmienvien", 1]] });
  if (r) { ok(has(r, "HX05:rev", o => o.n >= 2) && cnt(r, "HX05") >= 2, "HX-05: hồi sinh nhiều ô một lần toả"); }
  r = await scen("HX-08 dời thẻ", { ab: { nguyetlong: "move1" }, own: [["thachnhan", 0]], hand: [["nguyetlong", 1]] });
  if (r) { ok(has(r, "HX08", o => o.peek) && has(r, "HX08:land"), "HX-08: hồn ló và bay cùng lá thẻ, đáp ô"); }
  r = await scen("HX-09 trả về tay (tay linh hồn)", { ab: { namtuocmatna: "bounce1" }, foe: [["thachquai", 1]], hand: [["namtuocmatna", 0]] });
  if (r) { ok(has(r, "HX09:arm") && has(r, "HX:hit", o => o.hx === "arm"), "HX-09: hồn ở lại, tay vươn tóm mục tiêu"); }
  r = await scen("HX-04 vứt bài (2 phe)", { ab: { hacdichbinh: "disc2" }, hand: [["hacdichbinh", 1], ["thachnhan", null]], foeHand: ["thachquai"] });
  if (r) { ok(cnt(r, "HX04") === 2 && cnt(r, "HX04:burn") === 2 && cnt(r, "HX04:grave") === 2, "HX-04: 2 lá cháy, hồn vào mộ"); }
  r = await scen("HX-03 hủy 2 mục tiêu", { ab: { bachdich: "kill2" }, foe: [["thachquai", 0], ["thachquai", 2]], hand: [["bachdich", 1]], tag: "_2" });
  if (r) { ok(cnt(r, "HX03") === 2, "HX-03: 2 mục tiêu"); }
  r = await scen("mức Nhẹ: HX-03 về CFX cũ, HX-06 không ló hồn", { tier: "lite", ab: { bachdich: "kill1", chienthan: "up3" }, foe: [["thachquai", 0]], own: [["thachnhan", 2]], hand: [["bachdich", 0], ["chienthan", 2]], tag: "_nhe" });
  if (r) { ok(!has(r, "HX03"), "Nhẹ: không vỡ hồn CPU (CFX.destroy cũ)"); ok(!has(r, "HX06:flex", o => o.peek), "Nhẹ: không ló hồn"); }
  r = await scen("chạm tua nhanh giữa toả 3 mục tiêu", { ab: { tammanu: "down3" }, foe: F3, hand: [["tammanu", 1]], skip: "HXfan", tag: "_tua" });

  const s = await page.evaluate(() => ({ fr: window.__fr, bad: window.__bad }));
  ok(!s.bad.length, `không khung rỗng / ảnh chưa giải mã trong lúc HX diễn (${s.bad.length} mẫu xấu${s.bad.length ? ": " + JSON.stringify(s.bad.slice(0, 3)) : ""})`);
  const st = (L) => { const a = L.map(f => f[1]).sort((x, y) => x - y); return a.length ? `${a.length} khung, p50 ${a[a.length >> 1].toFixed(1)} ms, p95 ${a[Math.floor(a.length * 0.95)].toFixed(1)} ms, >50 ms: ${a.filter(x => x > 50).length}` : "0 khung"; };
  console.log("khung hình lúc HX diễn: " + st(s.fr.filter(f => f[2])));
  console.log("khung hình lúc chuỗi PA6 diễn: " + st(s.fr.filter(f => f[3])));
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.stack); }
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
await browser.close(); server.close();
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
