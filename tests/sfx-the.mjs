// Kiểm tra tiếng KỸ NĂNG riêng từng thẻ S5/S4 (www/sfx/the.json + the-1..6.mp3, tải lười trong 04-audio.js).
// Chạy trong thư mục tests: CHROME_PATH=/usr/bin/google-chrome node sfx-the.mjs
//  (a) the.json: mọi id là thẻ S5/S4 có thật, đủ số thẻ đã tạo (tools/sfx_the.json), vị trí khớp độ dài sprite, không chồng nhau
//  (b) chơi một ván có thẻ S5/S4 dùng kỹ năng: tiếng riêng phát đúng thẻ, không kèm tiếng nhóm cùng bước, chỉ tải các sprite cần thiết
//  (c) thẻ không có tiếng riêng (bậc thấp) vẫn phát tiếng nhóm (gpu51: tiếng nhóm gồm cả tiếng tình huống x_* của sprite fx); tải lười: chưa có sprite -> tiếng nhóm + tải nền, rồi mới có tiếng riêng
import http from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright-core")); } catch { try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); } }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".mp3": "audio/mpeg", ".svg": "image/svg+xml" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const fail = m => { throw new Error(m); };

// ---------- (a) tĩnh ----------
const m = { exports: {} }; new Function("module", "exports", readFileSync(path.join(www, "js", "01-engine.js"), "utf8"))(m, m.exports);
const C = m.exports.C;
const idx = JSON.parse(readFileSync(path.join(www, "sfx", "the.json"), "utf8"));
const want = [...JSON.parse(readFileSync(path.join(here, "..", "tools", "sfx_the.json"), "utf8")).list, ...JSON.parse(readFileSync(path.join(here, "..", "tools", "sfx_the_s3.json"), "utf8")).list, ...JSON.parse(readFileSync(path.join(here, "..", "tools", "sfx_the_thap.json"), "utf8")).list].map(x => x.k);
const ids = Object.keys(idx);
const bad = ids.filter(id => !C[id]);
if (bad.length) fail("the.json có id không phải thẻ: " + bad.slice(0, 5));
const miss = want.filter(id => !idx[id]);
if (miss.length) fail(`thiếu ${miss.length}/${want.length} thẻ trong the.json: ` + miss.slice(0, 8));
const nS5 = ids.filter(i => C[i].h === "S5").length, nS4 = ids.length - nS5;
const sprites = [...new Set(ids.map(i => idx[i][0]))].sort();
if (sprites.length > 10) fail("quá 10 sprite");
let failed = false;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [], reqSp = new Set();
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("request", r => { const mm = /\/sfx\/the-(\d+)\.mp3/.exec(r.url()); if (mm) reqSp.add(+mm[1]); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  // độ dài sprite: giải mã trong trình duyệt (không cần ffmpeg)
  await page.goto(`http://127.0.0.1:${server.address().port}/sfx/nghe-thu.html`, { waitUntil: "domcontentloaded" });
  const lens = await page.evaluate(async (sp) => {
    const AC = new (window.AudioContext || window.webkitAudioContext)(), o = {}, sz = {};
    for (const n of sp) { const ab = await (await fetch(`/sfx/the-${n}.mp3`)).arrayBuffer(); sz[n] = ab.byteLength; o[n] = (await AC.decodeAudioData(ab)).duration; }
    return { o, sz };
  }, sprites);
  const by = {}; for (const id of ids) (by[idx[id][0]] ||= []).push(idx[id]);
  for (const n of sprites) {
    const L = by[n].sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < L.length; i++) {
      const [, a, d] = L[i];
      if (d < 0.6 || d > 1.2) fail(`sprite ${n}: độ dài ${d}s ngoài khoảng 0,6–1,2 s`);
      if (a + d > lens.o[n] + 0.03) fail(`sprite ${n}: vị trí ${a}+${d} vượt độ dài ${lens.o[n].toFixed(2)}s`);
      if (i && a < L[i - 1][1] + L[i - 1][2]) fail(`sprite ${n}: hai thẻ chồng nhau`);
    }
    if (lens.sz[n] > 900 * 1024) fail(`sprite ${n} lớn ${Math.round(lens.sz[n] / 1024)} KB`);
  }
  console.log(`(a) the.json: ${ids.length} thẻ (S5 ${nS5}, S4 ${nS4}), ${sprites.length} sprite, ` + sprites.map(n => `${n}:${by[n].length} thẻ/${Math.round(lens.sz[n] / 1024)}KB`).join(" "));

  reqSp.clear();
  // ---------- vào ván ----------
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 120000 });
  await page.evaluate(() => { window.__snd = []; window.__ult = []; window.SFX_TAP = (n) => window.__snd.push({ n, t: performance.now() });
    const o = window.ultShow; window.ultShow = function (inst) { window.__ult.push({ id: inst && inst.id, t: performance.now() }); return o.apply(this, arguments); }; });
  // thẻ đã xuất hiện trong ván này (tay hai bên + thẻ trên bàn): từ đó suy ra tập sprite "cần thiết" (autoPre nạp sprite của thẻ S4/S5 đang cầm trên tay)
  await page.evaluate(() => { window.__qaSeen55 = new Set(); window.__scan = () => { try { if (G && G.hand) for (const sd of ["p", "a"]) for (const c of G.hand[sd]) window.__qaSeen55.add(c.id); if (G && G.locs) for (const L of G.locs) for (const sd of ["p", "a"]) for (const c of L.cards[sd]) window.__qaSeen55.add(c.id); } catch (e) {} }; setInterval(window.__scan, 30); });
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 60000 });
  await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.waitForFunction(() => SFX.loaded() > 50 && SFX.cardIds().length > 0, null, { timeout: 20000 });
  if (reqSp.size) fail("sprite thẻ bị tải ngay lúc khởi động: " + [...reqSp]);
  console.log("lúc khởi động chỉ tải the.json, chưa tải sprite nào");

  // chờ theo trạng thái (không chờ cố định): chiến địa đã lộ, hết hiệu ứng mở ván, và 800 ms không có tiếng nào của ván (tiếng "loc"/giới thiệu lượt) -> phép thử phát lại không bị tiếng ván xen vào
  await page.waitForFunction(() => LVEIL !== G && G.phase === "play" && !document.querySelector(".l47") && (!window.__snd.length || performance.now() - window.__snd[window.__snd.length - 1].t > 800), null, { timeout: 30000, polling: 100 });

  // ---------- (c) + tải lười, xác định (gọi trực tiếp) ----------
  const pickA = ids.find(i => idx[i][0] === sprites[0] && C[i].h === "S5"), pickB = ids.find(i => i !== pickA && idx[i][0] === sprites[0] && C[i].h === "S5");
  const low = Object.keys(C).find(k => /^S[123]$/.test(C[k].h) && C[k].t === "rev");
  const r = await page.evaluate(async ({ a, b, low }) => {
    const w = ms => new Promise(r => setTimeout(r, ms)), tap = () => (window.__snd = [], null), names = () => window.__snd.map(x => x.n).filter(n => /^(the:|x_|f_|destroy$|discard$|move$|draw$|summon$|revive$|steal$|silence$|shield$|buff$|debuff$|energy$|morph$|act$|hurt$)/.test(n)); /* không đếm "loc" (mở chiến địa): không do fam() phát ra */
    const out = {}; const GRP = new Set(["destroy", "buff", "debuff", "summon", "act", "morph", "move", "discard", "revive", "steal", "silence", "shield", "energy", "hurt", "draw"]);
    out.has = !!SFX.cardLoaded(a);
    tap(); SFX.fam("destroy", { id: a, el: null }); await w(60); out.lazy1 = names();           // chưa nạp: tiếng nhóm
    for (let i = 0; i < 60 && !SFX.cardLoaded(a); i++) await w(100);
    out.loaded = !!SFX.cardLoaded(a);
    await w(500); tap(); SFX.fam("destroy", { id: a, el: null }); await w(60); out.own = names();  // đã nạp: tiếng riêng, không tiếng nhóm
    tap(); SFX.fam("up2", { id: a, el: null, delay: 0 }); SFX.fam("destroy", { id: a, el: null }); await w(60); out.dup = names();   // trong 0,4 s: bỏ
    await w(600); tap(); SFX.fam("destroy", { id: a, el: "lua" }); SFX.fam("up2", { id: a, el: "lua", delay: 0.09 }); await w(60); out.step = names(); // 1 tiếng riêng, bỏ nhóm + hệ
    await w(600); tap(); SFX.fam("destroy", { id: b, el: null }); await w(60); out.other = names();   // thẻ khác cùng sprite, đã nạp sẵn
    await w(600); tap(); SFX.fam("destroy", { el: null }); await w(60); out.nocard = names();       // không biết thẻ: tiếng nhóm
    tap(); const uid = (() => { const c = E.mk(G, low, "p"); return c.uid; })(); SFX.fam("up2", { uid, el: null }); await w(60); out.low = names();  // thẻ bậc thấp (không tiếng riêng)
    out.GRP = [...GRP]; return out;
  }, { a: pickA, b: pickB, low });
  const own = n => n.filter(x => x.startsWith("the:")), grp = n => n.filter(x => !x.startsWith("the:"));
  if (!(grp(r.lazy1).length >= 1 && own(r.lazy1).length === 0)) fail("chưa nạp sprite: phải phát tiếng nhóm, được " + JSON.stringify(r.lazy1));
  if (!r.loaded) fail("sprite không được tải nền sau lần gọi đầu");
  if (JSON.stringify(r.own) !== JSON.stringify(["the:" + pickA])) fail("tiếng riêng sai: " + JSON.stringify(r.own));
  if (r.dup.length) fail("phát lại cùng thẻ trong 0,4 s chưa bị bỏ: " + JSON.stringify(r.dup));
  if (JSON.stringify(r.step) !== JSON.stringify(["the:" + pickA])) fail("nhiều tiếng nhóm cùng bước phải gộp thành 1 tiếng riêng: " + JSON.stringify(r.step));
  if (JSON.stringify(r.other) !== JSON.stringify(["the:" + pickB])) fail("thẻ thứ hai sai: " + JSON.stringify(r.other));
  if (!(grp(r.nocard).length >= 1 && own(r.nocard).length === 0)) fail("không biết thẻ: phải tiếng nhóm " + JSON.stringify(r.nocard));
  if (!(grp(r.low).length >= 1 && own(r.low).length === 0)) fail("thẻ không có tiếng riêng phải dùng tiếng nhóm " + JSON.stringify(r.low));
  console.log("(c) tải lười: lần đầu tiếng nhóm", JSON.stringify(r.lazy1), "-> nạp nền -> tiếng riêng", JSON.stringify(r.own), "; cùng bước gộp:", JSON.stringify(r.step), "; không tiếng riêng:", JSON.stringify(r.low));
  // sprite được phép tải ở bước (c): sprites[0] (do phép thử gọi) + sprite của thẻ S4/S5 đã xuất hiện trong ván này (autoPre nạp theo tay bài); KHÔNG được tải sprite nào khác
  await page.evaluate(() => window.__scan());
  const seenC = await page.evaluate(() => [...window.__qaSeen55]);
  const needC = new Set([sprites[0], ...seenC.filter(i => idx0(i)).map(i => idx0(i))]);
  function idx0(i) { return idx[i] ? idx[i][0] : 0; }
  if (!reqSp.has(sprites[0]) || [...reqSp].some(n => !needC.has(n))) fail("tải sprite thừa: " + [...reqSp] + " (cần: " + [...needC] + ")");

  // ---------- (b) chơi một ván: thẻ S5/S4 có kỹ năng Lật, giới hạn trong 2 sprite đầu ----------
  const allow = new Set(sprites.slice(0, 2));
  await page.evaluate(() => { window.__snd = []; window.__ult = []; });
  const t0 = Date.now(); let lastTurn = -1, g = 0;
  while (Date.now() - t0 < 5 * 60000 && g < 2) {
    /* gpu56: lượt đang diễn (TURN_BUSY) thì chờ; ghi lại mọi thẻ từng có trên bàn (thẻ bậc thấp có tiếng riêng nhưng không có màn ra mắt) */
    const ph = await page.evaluate(() => { const sn = (window.__qaSeen55 = window.__qaSeen55 || Object.create(null)); for (const L of G.locs) for (const s of ["p", "a"]) for (const c of L.cards[s]) sn[c.id] = 1; return G.phase === "play" && typeof TURN_BUSY !== "undefined" && TURN_BUSY ? "busy" : G.phase; });
    if (ph === "over") { g++; if (g >= 2) break; await page.evaluate(() => document.getElementById("btnEnd").click()); await page.waitForFunction(() => G.phase === "play", null, { timeout: 30000 }); lastTurn = -1; continue; }
    if (ph === "play") {
      await page.evaluate(({ lt, pool }) => {
        if (G.turn !== lt) for (const s of ["p", "a"]) {
          const e = G.energy[s] || 1; let ok = pool.filter(k => C[k].c <= Math.max(1, Math.ceil(e / 2))); if (!ok.length) ok = [...pool].sort((x, y) => C[x].c - C[y].c).slice(0, 4);
          G.hand[s] = [0, 1, 2].map(i => E.mk(G, ok[(G.turn * 7 + i * 13 + (s === "a" ? 5 : 0)) % ok.length], s));
        }
        E.aiPlan(G, "p", 60); render(); document.getElementById("btnEnd").click();
      }, { lt: lastTurn, pool: ids.filter(i => allow.has(idx[i][0]) && C[i].t === "rev") });
      lastTurn = await page.evaluate(() => G.turn);
    }
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1500);
  const R = await page.evaluate(() => ({ snd: window.__snd, ult: window.__ult, seen: Object.keys(window.__qaSeen55 || {}) }));
  const owns = R.snd.filter(s => s.n.startsWith("the:"));
  const ultIds = new Set(R.ult.map(u => u.id));
  console.log(`(b) ván: ${R.ult.length} màn ra mắt, ${owns.length} tiếng riêng; sprite đã tải: ${[...reqSp].sort()}`);
  let wrong = 0, overlap = 0;
  for (const o of owns) {
    const id = o.n.slice(4);
    // đúng thẻ: thẻ đó vừa ra mắt/đang có trên bàn trong ván (ra mắt gần nhất trong 6 s trước)
    // thẻ S4/S5: phải khớp màn ra mắt trong 6 s; thẻ bậc khác (không có màn ra mắt): phải là thẻ từng có trên bàn trong ván
    const coRaMat = C[id] && (C[id].h === "S5" || C[id].h === "S4");
    // S4/S5: khớp màn ra mắt trong 6 s, HOẶC thẻ đang nằm trên bàn kích hoạt kỹ năng muộn (kỹ năng khi bị phá huỷ, cuối lượt…)
    if (!(coRaMat && R.ult.some(u => u.id === id && o.t - u.t > -50 && o.t - u.t < 6000)) && !R.seen.includes(id)) { wrong++; console.log("  lệch:", id, C[id] && C[id].h, "lúc", Math.round(o.t), "ra mắt gần nhất:", JSON.stringify(R.ult.filter(u => u.id === id).map(u => Math.round(u.t))), "trên bàn:", R.seen.includes(id)); }
    // không chồng tiếng nhóm: không có tiếng kỹ năng nhóm nào (mẫu f_*/destroy/buff/…) trong ±120 ms
    { const ch = R.snd.filter(s => s !== o && !s.n.startsWith("the:") && /^(x_|f_|destroy$|discard$|draw$|summon$|revive$|steal$|silence$|shield$|buff$|debuff$|energy$|morph$|act$|hurt$)/.test(s.n) && Math.abs(s.t - o.t) < 120); /* "move" có tiếng riêng theo từng thẻ bị dời (move-smooth), không tính là chồng */
      if (ch.length) { overlap++; console.log("  chồng:", o.n, Math.round(o.t), "với", JSON.stringify(ch.map(s => [s.n, Math.round(s.t - o.t), s.src || s.id || ""]))); } }
  }
  if (owns.length < 1) fail("không có tiếng riêng nào được phát trong ván");
  if (wrong) fail(`${wrong} tiếng riêng không khớp thẻ vừa ra mắt`);
  if (overlap) fail(`${overlap} tiếng riêng bị chồng với tiếng nhóm`);
  // sprite cần thiết = sprite chứa thẻ S4/S5 từng nằm trên tay hai bên hoặc từng ra mắt trong ván (+ sprite đã nạp ở bước (c))
  await page.evaluate(() => window.__scan());
  const seen = await page.evaluate(() => [...window.__qaSeen55]);
  const need = new Set([sprites[0], ...seen.filter(i => idx[i]).map(i => idx[i][0]), ...[...ultIds].filter(i => idx[i]).map(i => idx[i][0])]);
  for (const n of reqSp) if (!need.has(n)) fail("tải sprite không cần thiết: " + n + " (cần: " + [...need] + ")");
  console.log(`(b) đúng thẻ, không chồng tiếng nhóm; sprite đã tải ${[...reqSp].sort()} ⊆ sprite cần (${[...need].sort()}) trong tổng ${sprites.length}`);
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.message); }
await browser.close(); server.close();
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
