// gpu66: kiểm ẤN KÝ KỸ NĂNG RIÊNG (www/js/17-sig.js) cho bộ 12 thẻ (dàn cảnh như /home/claude/deckdemo/scen.json).
//  - mỗi cảnh: màn diễn của đúng thẻ đó chạy (sig -> sig:hit -> sig:end, không tua), không màn diễn của thẻ khác ngoài danh sách
//  - sau cảnh: không sót DOM (.sg*, .p6*, .hxsoul, .uc5, .fxg.hero5), luật ẩn lá (#sigHide) rỗng, không lá nào bị ẩn trên bàn / trên tay
//  - kết quả thật hiện đúng: tổng điểm làn = E.locPower, năng lượng trên tay = E.cost, sức mạnh trên bàn = E.power
//  - cảnh riêng: chạm màn hình giữa màn diễn (tua nhanh), mức Nhẹ, giảm chuyển động (không diễn, không lỗi)
//  - ảnh đạo cụ img/sig: đủ 12 ảnh đã giải mã; chụp ảnh mốc trúng của từng thẻ vào SHOTS (mặc định /home/claude/shots-sig/test)
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/sig-deck.mjs
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const SHOTS = process.env.SHOTS || "/home/claude/shots-sig/test";
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
/* cảnh: thẻ cần diễn (want), bàn dàn sẵn (own/foe: [id, làn, bonus]), tay (hand: [id, làn đặt]), lá thêm trên tay, lá trên cùng bộ bài */
const SC = [
  { want: "nuphanquan", turn: 3, own: [["tunguyennu", 0]], hand: [["nuphanquan", 0]], extraHand: ["trinu", "thietgiap", "dothan"], seal: 3 },
  { want: "nuthantien", turn: 4, own: [["tunguyennu", 1]], foe: [["thachquai", 1]], hand: [["nuthantien", 1]], arrows: 2 },
  { want: "trinu", turn: 3, own: [["tunguyennu", 1], ["vuabong", 1], ["nuphanquan", 1]], foe: [["thachquai", 1]], hand: [["trinu", 1]] },
  { want: "thiendien", also: ["nuphanquan"], turn: 4, hand: [["nuphanquan", 2], ["thiendien", 2]], extraHand: ["thietgiap"], seal: 1 },
  { want: "haplucnu", turn: 3, foe: [["ungtoi", 1]], own: [["nuthantien", 1]], hand: [["haplucnu", 1]] },
  { want: "vuabong", turn: 4, own: [["nuthantien", 2, 4], ["trinu", 2, 6]], foe: [["thachquai", 2, 5]], hand: [["vuabong", 2]] },
  { want: "tunguyennu", turn: 3, own: [["nuthantien", 0]], hand: [["tunguyennu", 0]] },
  { want: "nguyetthach", turn: 4, own: [["nuphanquan", 1], ["thiendien", 1]], foe: [["thachquai", 1]], hand: [["nguyetthach", 1]], extraHand: ["trinu"] },
  { want: "bachdich", turn: 3, own: [["tunguyennu", 2]], hand: [["bachdich", 2]], top: ["dothan"] },
  { want: "thietgiap", turn: 4, own: [["vuabong", 0], ["tunguyennu", 0]], foe: [["thachquai", 0], ["thachquai", 0]], hand: [["thietgiap", 0]], x2: 1 },
  { want: "dothan", turn: 3, own: [["nuthantien", 0], ["trinu", 1], ["vuabong", 2]], foe: [["thachquai", 1], ["tunguyennu", 2]], hand: [["dothan", 1]] },
  { want: "kiemnuuminh", turn: 4, own: [["tunguyennu", 0]], foe: [["thachquai", 0]], hand: [["kiemnuuminh", 0]], loc: "limbo" },
  /* chạm tua nhanh giữa màn diễn */
  { want: "dothan", tapAt: 900, turn: 3, own: [["nuthantien", 0], ["trinu", 1]], foe: [["tunguyennu", 2]], hand: [["dothan", 1]] },
  { want: "nuthantien", tapAt: 1500, turn: 4, own: [["tunguyennu", 1]], hand: [["nuthantien", 1]], arrows: 2 },
  { want: "thietgiap", tapAt: 700, turn: 4, own: [["vuabong", 0]], hand: [["thietgiap", 0]] },
  /* mức Nhẹ */
  { want: "tunguyennu", tier: "lite", turn: 3, own: [["nuthantien", 0]], hand: [["tunguyennu", 0]] },
  { want: "haplucnu", tier: "lite", turn: 3, foe: [["ungtoi", 1]], hand: [["haplucnu", 1]] },
  /* giảm chuyển động: không diễn, kết quả vẫn đúng */
  { want: null, reduced: 1, turn: 4, own: [["vuabong", 0]], hand: [["thietgiap", 0]] },
];
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
  window.__sig = []; window.SIG_TAP = (k, o) => window.__sig.push({ k, id: o && o.id, fast: o && o.fast, t: performance.now() });
});
const LEAK = [".sgp", ".sgsoul", ".sga", ".sgx", ".sgseal", ".sgvx", ".sgbk", ".sgsw", ".sgscroll", ".sgcv", ".p6soul", ".p6ai", ".p6say", ".fxg.hero5", ".fxg.p6bk", ".uc5", ".hxsoul"];
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.evaluate(d => { document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); store.mute = true; store.decks[store.cur].ids = d.slice(); store.deck = store.decks[store.cur].ids; }, DECK);
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !TURN_BUSY, null, { timeout: 180000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { G.hand.a = []; document.getElementById("btnEnd").click(); });
  await page.waitForFunction(() => !TURN_BUSY && G.phase === "play", null, { timeout: 180000 });
  await page.evaluate(() => { FFTURN.start = () => {}; });
  const props = await page.evaluate(() => (window.SIGK ? SIGK.ready().length : -1));
  ok(props === 12, `ảnh đạo cụ img/sig đã giải mã: ${props}/12`);
  ok(await page.evaluate(() => { const s = new Set(["nuphanquan", "nuthantien", "trinu", "thiendien", "kiemnuuminh", "haplucnu", "vuabong", "tunguyennu", "nguyetthach", "bachdich", "thietgiap", "dothan"]); return SIGK.reg.size === 12 && [...SIGK.reg.keys()].every(k => s.has(k)); }), "bảng ấn ký đúng 12 id");
  let n = 0;
  for (const o of SC) {
    n++;
    const tag = `${String(n).padStart(2, "0")} ${o.want || "(giảm chuyển động)"}${o.tapAt ? " +chạm" : ""}${o.tier ? " " + o.tier : ""}`;
    await page.evaluate(({ o }) => {
      P6.setTier(o.tier || "full");
      reduced = !!o.reduced; document.body.classList.toggle("rm", reduced);
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
      render(); window.__sig.length = 0; window.__h0 = G.hand.p.length - (o.hand || []).length;
    }, { o });
    await page.waitForTimeout(500);
    await page.evaluate(() => document.getElementById("btnEnd").click());
    const t0 = Date.now();
    let shot = 0, tapped = 0;
    while (Date.now() - t0 < 90000) {
      const st = await page.evaluate(() => ({ b: TURN_BUSY, ph: G.phase, s: window.__sig.map(x => x.k + ":" + x.id) }));
      if (!shot && o.want && st.s.includes("sig:hit:" + o.want)) { shot = 1; await page.waitForTimeout(150); await page.screenshot({ path: path.join(SHOTS, `${String(n).padStart(2, "0")}_${o.want}${o.tier ? "_" + o.tier : ""}${o.tapAt ? "_tap" : ""}.png`) }); }
      if (o.tapAt && !tapped && st.s.includes("sig:" + o.want)) {
        tapped = 1;
        await page.waitForTimeout(o.tapAt);
        await page.evaluate(() => document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
      }
      if (!st.b && st.ph === "play" && Date.now() - t0 > 1500) break;
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(700);
    const r = await page.evaluate(({ LEAK }) => {
      const sig = window.__sig.slice();
      const dom = LEAK.map(s => [s, document.querySelectorAll(s).length]).filter(x => x[1]);
      const hide = (document.getElementById("sigHide") || {}).textContent || "";
      const hid = [...document.querySelectorAll("#board [data-mc],#hand [data-hc]")].filter(e => e.classList.contains("hero-hid") || getComputedStyle(e).visibility === "hidden" || +getComputedStyle(e).opacity < 0.5).map(e => e.dataset.mc || e.dataset.hc);
      const pw = [], cost = [], pow = [];
      document.querySelectorAll("#board [data-lane]").forEach(ln => { const li = +ln.dataset.lane; for (const sd of ["p", "a"]) { const el = ln.querySelector(".pw." + sd); if (el) { const v = parseInt(el.textContent, 10), w = E.locPower(G, li, sd); if (v !== w) pw.push(`${li}${sd}:${v}≠${w}`); } } });
      for (const c of G.hand.p) { const el = document.querySelector(`#hand [data-hc="${c.uid}"] .cst`); if (el && parseInt(el.textContent, 10) !== E.cost(G, c)) cost.push(`${c.id}:${el.textContent}≠${E.cost(G, c)}`); }
      for (let li = 0; li < 3; li++) for (const sd of ["p", "a"]) for (const c of G.locs[li].cards[sd]) { const el = document.querySelector(`#board [data-mc="${c.uid}"] .pwh`); if (el && c.rev && parseInt(el.textContent, 10) !== E.power(G, c, li)) pow.push(`${c.id}:${el.textContent}≠${E.power(G, c, li)}`); }
      return { sig, dom, hide, hid, pw, cost, pow, hand: G.hand.p.length - window.__h0, loc: G.locs.map(L => L.id) };
    }, { LEAK });
    const ks = r.sig.map(x => x.k + ":" + x.id), ids = [...new Set(r.sig.filter(x => x.k === "sig").map(x => x.id))];
    console.log(tag + " —", ks.filter(k => /^sig(:hit|:end|:skip)?:/.test(k) || k.startsWith("sig:")).slice(0, 14).join(" "));
    if (o.want) {
      ok(ks.includes("sig:" + o.want) && (o.tapAt || ks.includes("sig:hit:" + o.want)), `${tag}: màn diễn ${o.want} chạy${o.tapAt ? "" : " tới mốc trúng"}`);
      const endE = r.sig.find(x => x.k === "sig:end" && x.id === o.want);
      ok(!!endE && (o.tapAt ? true : !endE.fast), `${tag}: màn diễn kết thúc ${o.tapAt ? "(tua nhanh)" : "tự nhiên"}`);
      if (o.tapAt) ok(ks.includes("sig:skip:undefined") || r.sig.some(x => x.k === "sig:skip"), `${tag}: chạm màn hình -> tua nhanh`);
      ok(ids.every(i => i === o.want || (o.also || []).includes(i)), `${tag}: chỉ thẻ trong cảnh diễn ấn ký (${ids.join(",")})`);
    } else ok(!ids.length, `${tag}: giảm chuyển động -> không diễn ấn ký`);
    ok(!r.dom.length && !r.hide.trim(), `${tag}: không sót DOM ${JSON.stringify(r.dom)}${r.hide.trim() ? " luật ẩn: " + r.hide : ""}`);
    ok(!r.hid.length, `${tag}: không lá nào bị ẩn ${JSON.stringify(r.hid)}`);
    ok(!r.pw.length && !r.cost.length && !r.pow.length, `${tag}: số trên màn hình đúng kết quả thật ${JSON.stringify([...r.pw, ...r.cost, ...r.pow])}`);
    if (o.seal && !o.tapAt) ok(r.sig.filter(x => x.k === "sig:seal").length >= o.seal, `${tag}: ấn ngọc bích đóng lên ${o.seal} lá trên tay`);
    if (o.arrows) ok(r.hand >= o.arrows, `${tag}: ${r.hand} lá Mũi Tên đã vào tay (hiện rõ)`);
    if (o.x2) ok(ks.includes("sig:x2:thietgiap"), `${tag}: dấu ×2 trên tổng điểm làn`);
    if (o.loc) ok(r.loc.includes(o.loc), `${tag}: chiến địa đã thành U Minh`);
    if ((o.want === "trinu" || o.want === "dothan") && !o.tapAt) ok(ks.includes("sig:shift:" + o.want), `${tag}: lịch đòn được dời khớp mốc trúng`);
  }
  await page.evaluate(() => { reduced = false; document.body.classList.remove("rm"); P6.setTier("auto"); });
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.stack); }
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
await browser.close(); server.close();
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
