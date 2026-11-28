// gpu71 (làn C): kiểm TUYỆT KỸ DIỆN RỘNG S5 (www/js/19-mass.js).
//  - mỗi thẻ trong MASS.ids: dàn bàn chung (cả hai phía, ba chiến địa, tay, bộ bài, Mộ) -> thẻ ra tay (Lật / Duy Trì / Kích Hoạt)
//  - màn diễn mass chạy (mass -> mass:fin -> mass:end tự nhiên, không tua)
//  - các mục tiêu được điểm danh (mass:visit) KHỚP ĐÚNG tập thay đổi engine (tự tính độc lập trong bài test: bàn, tay, bộ bài, chiến địa)
//  - sau cảnh: số trên màn hình = engine (tổng làn, sức mạnh trên bàn, năng lượng + sức mạnh trên tay), không sót DOM, không lá nào bị ẩn
//  - P6.noFly: chuỗi PA6 của S5 không có bước bay tới mục tiêu (C:fly), MASS.skip() hiện trạng thái cuối
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/mass-s5.mjs [id,id…]
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const SHOTS = process.env.SHOTS || "";
const ONLY = (process.argv[2] || "").split(",").filter(Boolean);
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
if (SHOTS) await mkdir(SHOTS, { recursive: true });
/* chỉnh riêng từng thẻ: lane = chiến địa đặt; tweak = tên cách dàn thêm */
const OPT = {
  bangca: { lane: 2 }, dacvuquocgia: { lane: 2 }, kimcuongxa: { lane: 0 }, cosi: { lane: 0 },
  maynuotthoigian: { tweak: "foeHidden" }, kenuotsao: { tweak: "alone" }, cucquang: { tweak: "revEach" }, sautham: { tweak: "revHere" },
  taysatnu: { tweak: "created" },
};
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
const errors = [];
const IGN = /ERR_TUNNEL|ERR_PROXY|Failed to load resource/;
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error" && !IGN.test(m.text())) errors.push("console: " + m.text()); });
let failed = false, nOk = 0, nBad = 0;
const ok = (c, m) => { if (c) nOk++; else { nBad++; console.log("  LỖI  " + m); failed = true; } };
await page.addInitScript(() => {
  localStorage.setItem("ltd_p6lv", "full"); localStorage.removeItem("ltd_hx_all");
  window.__m = []; window.__p6 = [];
  window.MASS_TAP = (k, o) => {
    window.__m.push(Object.assign({ k, t: performance.now() }, o || {}));
    if (k === "mass" && window.__snapT) window.__exp = window.__expect();
  };
  window.PA6_TAP = (k, o) => window.__p6.push(k);
});
const LEAK = [".sgp", ".sgsoul", ".sga", ".sgx", ".sgscroll", ".sgcv", ".p6soul", ".p6ai", ".fxg.hero5", ".uc5", ".hxsoul", ".msarea", ".msghost", ".msprop", ".mshead", ".mscnt", ".mspile", ".acpile"];
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  const IDS = await page.evaluate(() => MASS.ids.slice());
  const list = ONLY.length ? IDS.filter(i => ONLY.includes(i)) : IDS;
  await page.evaluate(d => { document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); store.mute = true; store.decks[store.cur].ids = d.slice(0, 12); store.deck = store.decks[store.cur].ids; }, IDS);
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !TURN_BUSY, null, { timeout: 180000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => { G.hand.a = []; document.getElementById("btnEnd").click(); });
  await page.waitForFunction(() => !TURN_BUSY && G.phase === "play", null, { timeout: 180000 });
  await page.evaluate(() => { FFTURN.start = () => {}; });
  ok(await page.evaluate(() => typeof P6.noFly === "function" && typeof MASS.skip === "function"), "API: P6.noFly + MASS.skip");
  /* bộ tính mục tiêu ĐỘC LẬP: chụp trước -> so sau ngay khi bước của thẻ xong (lúc màn diễn bắt đầu) */
  await page.evaluate(() => {
    window.__snapAll = (src) => {
      const o = { b: new Map(), h: new Map(), d: new Map(), L: G.locs.map(L => [L.id, !!L.gone]) };
      G.locs.forEach((L, li) => E.SIDES.forEach(sd => L.cards[sd].forEach(c => { if (c.uid !== src) o.b.set(c.uid, [li, c.rev ? E.power(G, c, li) : null, !!c.sil, c.id, E.ab(c)]); })));
      E.SIDES.forEach(sd => { G.hand[sd].forEach(c => { if (c.uid !== src) o.h.set(c.uid, [E.cost(G, c), handPow(c), E.ab(c)]); }); G.deck[sd].forEach(c => o.d.set(c.uid, [E.cost(G, c), E.basePow(c) + (c.bonus || 0)])); });
      return o;
    };
    window.__expect = () => {
      const S = window.__snapT, src = window.__src, out = new Set();
      const now = new Map();
      G.locs.forEach((L, li) => E.SIDES.forEach(sd => L.cards[sd].forEach(c => { if (c.uid === src) return; now.set(c.uid, 1); const b = S.b.get(c.uid); if (!b) { out.add("board:" + c.uid); return; } const p = c.rev ? E.power(G, c, li) : null; if (b[0] !== li || b[3] !== c.id || (!b[2] && c.sil) || b[4] !== E.ab(c) || (b[1] != null && p != null && p !== b[1])) out.add("board:" + c.uid); })));
      for (const u of S.b.keys()) if (!now.has(u)) out.add("board:" + u);
      E.SIDES.forEach(sd => {
        G.hand[sd].forEach(c => { if (c.uid === src) return; const h = S.h.get(c.uid); if (!h) { if (!S.b.has(c.uid)) out.add("hand:" + c.uid); return; } if (h[0] !== E.cost(G, c) || h[1] !== handPow(c) || h[2] !== E.ab(c)) out.add("hand:" + c.uid); });
        for (const [u] of S.h) if (!G.hand.p.some(c => c.uid === u) && !G.hand.a.some(c => c.uid === u) && ((G.disc && (G.disc.p.some(c => c.uid === u) || G.disc.a.some(c => c.uid === u))))) out.add("hand:" + u);
        G.deck[sd].forEach(c => { const d = S.d.get(c.uid); if (d && (d[0] !== E.cost(G, c) || d[1] !== E.basePow(c) + (c.bonus || 0))) out.add("deck:" + c.uid); });
      });
      G.locs.forEach((L, li) => { if (S.L[li][1] !== !!L.gone || S.L[li][0] !== L.id) out.add("loc:" + (-1 - li)); });
      return [...out];
    };
  });
  for (const id of list) {
    const o = OPT[id] || {};
    const set = await page.evaluate(({ id, o }) => {
      P6.setTier("full"); reduced = false; document.body.classList.remove("rm");
      G.turn = 4;
      for (const L of G.locs) { L.rvl = true; L.id = "meadow"; L.gone = false; L.cards.p.length = 0; L.cards.a.length = 0; }
      const put = (cid, side, li, bonus, rev) => { const c = E.mk(G, cid, side); c.rev = rev !== false; c.played = true; c.turn = 1; c.et = 1; if (bonus) c.bonus = bonus; G.locs[li].cards[side].push(c); return c; };
      const own = o.tweak === "revEach" ? [["chonphao", 0], ["chanthu", 0], ["chonphao", 1], ["taymaynu", 1], ["chonphao", 2]]
        : o.tweak === "revHere" ? [["chonphao", 1], ["chonphao", 1], ["docnhan", 0], ["thachquai", 2]]
        : o.tweak === "alone" ? [["chanthu", 0], ["docnhan", 0, 2], ["thachquai", 2]]
        : [["chanthu", 0], ["docnhan", 0, 2], ["taymaynu", 1], ["chanthu", 1], ["docnhan", 1], ["thachquai", 2]];
      const foe = o.tweak === "alone" ? [["chanthu", 0, -2], ["taymaynu", 0], ["thachquai", 2], ["quaituong", 2]]
        : [["chanthu", 0, -2], ["taymaynu", 0], ["docnhan", 1], ["chanthu", 1, -1], ["thachquai", 2], ["quaituong", 2]];
      for (const [c, li, b] of foe) put(c, "a", li, b, !(o.tweak === "foeHidden" && li === 1));
      for (const [c, li, b] of own) put(c, "p", li, b);
      if (o.tweak === "created") { const c = G.locs[0].cards.p[0]; c.cr = true; }
      G.hand.p = ["taymaynu", "chanthu", "docnhan", "thachquai", "quaituong", "cuongnhan"].map(c => E.mk(G, c, "p"));
      if (o.tweak === "created") { const c = E.mk(G, "chanthu", "p"); c.cr = true; G.hand.p.push(c); }
      G.hand.a = ["chanthu", "thachquai", "cuongnhan"].map(c => E.mk(G, c, "a"));
      G.deck.p = ["taymaynu", "chanthu", "docnhan", "thachquai", "quaituong", "chanthu"].map(c => E.mk(G, c, "p"));
      G.deck.a = ["taymaynu", "chanthu", "docnhan", "thachquai", "quaituong", "chanthu"].map(c => E.mk(G, c, "a"));
      G.dead.p = ["docnhan", "chanthu"].map(c => E.mk(G, c, "p")); G.disc.p = [E.mk(G, "taymaynu", "p")];
      G.dead.a = []; G.disc.a = [];
      G.cnt.disc.p = 1; G.cnt.destOwn.p = 1; G.cnt.discTurns.p = 2;
      G.energy.p = 40; G.energy.a = 0;
      const lane = o.lane != null ? o.lane : 1, kind = C[id].t;
      let src;
      if (kind === "act") { src = put(id, "p", lane, 0); render(); E.queueAct(G, "p", src.uid); }
      else { const c = E.mk(G, id, "p"); G.hand.p.unshift(c); src = c; render(); E.queuePlay(G, "p", c.uid, lane); }
      render();
      window.__m.length = 0; window.__p6.length = 0; window.__exp = null; window.__src = src.uid;
      window.__snapT = window.__snapAll(src.uid);
      return { kind, q: G.q.p.length };
    }, { id, o });
    if (!set.q) { ok(false, `${id}: không xếp được lượt (${set.kind})`); continue; }
    await page.waitForTimeout(400);
    await page.evaluate(() => document.getElementById("btnEnd").click());
    const t0 = Date.now();
    let shot = 0;
    while (Date.now() - t0 < 90000) {
      const st = await page.evaluate(() => ({ b: TURN_BUSY, ph: G.phase, fin: window.__m.filter(x => x.k === "mass:visit").length >= 2 }));
      if (SHOTS && !shot && st.fin) { shot = 1; await page.screenshot({ path: path.join(SHOTS, `${id}.png`) }); }
      if (!st.b && st.ph === "play" && Date.now() - t0 > 1500) break;
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(700);
    const r = await page.evaluate(({ LEAK }) => {
      const m = window.__m.slice();
      const dom = LEAK.map(s => [s, document.querySelectorAll(s).length]).filter(x => x[1]);
      const hide = ((document.getElementById("sigHide") || {}).textContent || "") + ((document.getElementById("actHide") || {}).textContent || "");
      const hid = [...document.querySelectorAll("#board [data-mc],#hand [data-hc]")].filter(e => getComputedStyle(e).visibility === "hidden" || +getComputedStyle(e).opacity < 0.5).map(e => e.dataset.mc || e.dataset.hc);
      const bad = [];
      document.querySelectorAll("#board [data-lane]").forEach(ln => { const li = +ln.dataset.lane; for (const sd of ["p", "a"]) { const el = ln.querySelector(".pw." + sd); if (el && !G.locs[li].gone) { const v = parseInt(el.textContent, 10), w = E.locPower(G, li, sd); if (v !== w) bad.push(`làn${li}${sd}:${v}≠${w}`); } } });
      for (const c of G.hand.p) { const el = document.querySelector(`#hand [data-hc="${c.uid}"]`); if (!el) continue; const a = el.querySelector(".cst"), b = el.querySelector(".pwh"); if (a && parseInt(a.textContent, 10) !== E.cost(G, c)) bad.push(`tay ${c.id} nl ${a.textContent}≠${E.cost(G, c)}`); if (b && parseInt(b.textContent, 10) !== handPow(c)) bad.push(`tay ${c.id} sm ${b.textContent}≠${handPow(c)}`); }
      for (let li = 0; li < 3; li++) for (const sd of ["p", "a"]) for (const c of G.locs[li].cards[sd]) { const el = document.querySelector(`#board [data-mc="${c.uid}"] .pwh`); if (el && c.rev && parseInt(el.textContent, 10) !== E.power(G, c, li)) bad.push(`${c.id}:${el.textContent}≠${E.power(G, c, li)}`); }
      return { m, dom, hide: hide.trim(), hid, bad, exp: window.__exp, fly: window.__p6.filter(k => k === "C:fly").length };
    }, { LEAK });
    const start = r.m.find(x => x.k === "mass"), end = r.m.find(x => x.k === "mass:end"), fin = r.m.find(x => x.k === "mass:fin");
    const vis = r.m.filter(x => x.k === "mass:visit").map(x => x.z + ":" + x.u);
    const exp = r.exp || [];
    const vs = new Set(vis), es = new Set(exp);
    const miss = exp.filter(x => !vs.has(x)), extra = vis.filter(x => !es.has(x)), dup = vis.length - vs.size;
    if (process.env.DBG && start) console.log("tg", JSON.stringify(start.tg), "exp", JSON.stringify(r.exp));
    if (process.env.DBG) console.log(JSON.stringify(r.m.map(x => [x.k, Math.round(x.t - (start ? start.t : 0)), x.fast])));
    console.log(`${id.padEnd(17)} ${start ? start.scope : "—"} · mục tiêu ${vis.length}/${exp.length}${start ? " · " + Math.round((end ? end.t : 0) - start.t) + " ms" : ""}`);
    ok(!!start && start.id === id, `${id}: màn diễn tuyệt kỹ chạy`);
    ok(!!fin && !!end && !end.fast, `${id}: kết thúc tự nhiên (mass:fin + mass:end)`);
    ok(exp.length > 0 && !miss.length && !extra.length && !dup, `${id}: điểm danh đúng mục tiêu engine — thiếu ${JSON.stringify(miss)} thừa ${JSON.stringify(extra)} lặp ${dup}${miss.length ? " tg=" + JSON.stringify(start && start.tg) + " vis=" + JSON.stringify(vis) : ""}`);
    ok(!r.dom.length && !r.hide, `${id}: không sót DOM ${JSON.stringify(r.dom)} ${r.hide}`);
    ok(!r.hid.length, `${id}: không lá nào bị ẩn ${JSON.stringify(r.hid)}`);
    ok(!r.bad.length, `${id}: số cuối khớp engine ${JSON.stringify(r.bad)}`);
    ok(!r.fly, `${id}: hồn PA6 không bay tới mục tiêu (C:fly=${r.fly})`);
  }
  /* MASS.skip(): kết thúc ngay giữa màn diễn, trạng thái cuối đúng */
  if (!ONLY.length || ONLY.includes("skip")) {
    await page.evaluate(() => {
      for (const L of G.locs) { L.rvl = true; L.id = "meadow"; L.gone = false; L.cards.p.length = 0; L.cards.a.length = 0; }
      for (const [cid, li, b] of [["chanthu", 0, -2], ["docnhan", 1], ["thachquai", 2]]) { const c = E.mk(G, cid, "a"); c.rev = true; c.played = true; c.turn = 1; if (b) c.bonus = b; G.locs[li].cards.a.push(c); }
      G.hand.p = ["chanthu", "thachquai", "cuongnhan"].map(c => E.mk(G, c, "p")); G.hand.a = ["chanthu", "thachquai"].map(c => E.mk(G, c, "a"));
      const c = E.mk(G, "nguyetlong", "p"); G.hand.p.unshift(c); render(); E.queuePlay(G, "p", c.uid, 1); render(); window.__m.length = 0; window.__snapT = null;
    });
    await page.evaluate(() => document.getElementById("btnEnd").click());
    await page.waitForFunction(() => window.__m.some(x => x.k === "mass:visit"), null, { timeout: 60000 }).catch(() => {});
    await page.evaluate(() => MASS.skip());
    await page.waitForFunction(() => !TURN_BUSY && G.phase === "play", null, { timeout: 90000 });
    await page.waitForTimeout(600);
    const s = await page.evaluate(() => ({ end: window.__m.find(x => x.k === "mass:end"), dom: document.querySelectorAll(".msarea,.msprop,.mscnt,.mshead,.msghost").length, bad: G.hand.p.filter(c => { const el = document.querySelector(`#hand [data-hc="${c.uid}"] .pwh`); return el && parseInt(el.textContent, 10) !== handPow(c); }).length }));
    ok(!!s.end && s.end.fast, "MASS.skip(): kết thúc ngay (fast)");
    ok(!s.dom && !s.bad, `MASS.skip(): không sót DOM, số trên tay đúng (dom ${s.dom}, sai ${s.bad})`);
  }
  await page.evaluate(() => { P6.setTier("auto"); });
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.stack); }
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
await browser.close(); server.close();
console.log(`${nOk} ok, ${nBad} lỗi`);
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
