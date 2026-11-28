// gpu69 (làn A, đợt 44 lỗi): kiểm HOẠT CẢNH HÀNH ĐỘNG (www/js/18-act.js + phần nối ở 17-sig.js / 01-engine.js)
//  Mỗi cảnh dàn sẵn bàn, bấm Kết thúc lượt, ghi nhịp ACT_TAP/SIG_TAP/HX_TAP và kiểm:
//   - hiệu ứng chạy đúng thẻ (đúng uid mục tiêu), đúng thứ tự (vứt bỏ: vào Mộ rồi mới phản ứng)
//   - sau cảnh: không sót DOM, không lá bị ẩn (#actHide/#sigHide rỗng), số trên màn hình = kết quả thật
//   - riêng: Thiện Xạ 2 mũi tên KHÁC nhau; Chiến Thần không hiện mặt thẻ lá trên cùng; Quyền Sư Máu chỉ hiện mặt lưng chồng bài
//   - chạm màn hình giữa nhịp vứt bỏ: tua nhanh sạch
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/action44.mjs
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
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
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
const errors = [];
const IGN = /ERR_TUNNEL|ERR_PROXY|Failed to load resource/;
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error" && !IGN.test(m.text())) errors.push("console: " + m.text()); });
let failed = false;
const eq1 = (a, b, m) => ok(a === b, m + " (" + a + ")");
const ok = (c, m) => { console.log((c ? "  ok   " : "  LỖI  ") + m); if (!c) failed = true; };
await page.addInitScript(() => {
  localStorage.setItem("ltd_p6lv", "full"); localStorage.removeItem("ltd_hx_all");
  window.__t = [];
  const T = (src) => (k, o) => window.__t.push(Object.assign({ k, src, t: performance.now() }, o || {}));
  window.ACT_TAP = T("a"); window.SIG_TAP = T("s"); window.HX_TAP = T("h"); window.PA6_TAP = T("p");
  /* ghi lại mọi lá "lá trên cùng bộ bài" (.t29) được dựng: có mặt thẻ (.fxface) hay chỉ mặt lưng (.dkp) */
  window.__t29 = [];
  const mo = () => new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList && n.classList.contains("t29")) window.__t29.push(n.querySelector(".dkp") ? "back" : n.querySelector(".fxface") ? "face" : "other"); }).observe(document.body, { childList: true, subtree: true });
  if (document.body) mo(); else document.addEventListener("DOMContentLoaded", mo);
});
const LEAK = [".acp", ".acf", ".actag", ".acpile", ".acvs", ".fxg.acd", ".fxg.acgh", ".sgp", ".sgx", ".sgsoul", ".sga", ".dkp", ".hxsoul"];
/* cảnh: own/foe [id, làn, bonus], hand [id, làn đặt], extraHand, disc (Mộ), eot (thẻ được chạy Cuối Lượt), js (dàn thêm) */
const SC = [
  { name: "Cự Long Cổ (7)", turn: 4, own: [["tunguyennu", 1]], foe: [["thachquai", 1, 3]], hand: [["culongco", 1]],
    chk: (r, u) => { const h = r.t.find(x => x.k === "culongco:hit"); ok(!!h && h.tg === u.foe[0] && h.v === 10, "Cự Long Cổ: vuốt rồng lấy đúng thẻ địch hàng trước (+10)"); } },
  { name: "Tiểu Long Cuối Lượt (35)", turn: 4, own: [["tieulong", 1]], eot: ["tieulong"], foe: [["thachquai", 1, 3]], hand: [["tinhquyennu", 0]],
    chk: (r, u) => { ok(r.t.some(x => x.k === "tieulong:hit" && x.uid === u.foe[0]), "Tiểu Long: cầu lửa trúng đúng thẻ địch"); ok(r.t.some(x => x.k === "eot" && x.uid === u.own[0]), "Tiểu Long: ấn Cuối Lượt trên chính thẻ"); } },
  { name: "Chiến Thần (41)", turn: 4, foe: [["thachquai", 1]], hand: [["chienthan", 1]],
    chk: (r) => { ok(r.t.some(x => x.k === "chienthan:cmp"), "Chiến Thần: bảng so 3 số hiện + so sánh"); { const c = r.t.find(x => x.k === "chienthan:cmp"); ok(c.pw <= 260 && c.ph <= 110, "gpu70 (mục 8): bảng Chiến Thần nhỏ gọn (" + c.pw + "×" + c.ph + ")"); ok(Math.abs(c.cx) <= 2, "gpu70: bảng ở giữa màn theo chiều ngang"); ok(c.top >= c.ob - 2, "gpu70: bảng không che hàng thẻ đối thủ phía trên (đỉnh bảng " + c.top + " < đáy hàng trên " + c.ob + ")"); } ok(!r.t29.includes("face"), "Chiến Thần: không hiện mặt thẻ lá trên cùng (" + r.t29.join(",") + ")"); } },
  { name: "Quyền Sư Máu (2)", turn: 4, own: [["thachquai", 0], ["thachquai", 2]], hand: [["huyettinhquyen", 1]],
    chk: (r) => { ok(r.t.some(x => x.k === "deck" && x.a === "steal" && x.side === "a"), "Quyền Sư Máu: lấy sức mạnh từ chồng bài đối thủ"); ok(r.t29.length > 0 && !r.t29.includes("face"), "Quyền Sư Máu: chỉ mặt lưng chồng bài (" + r.t29.join(",") + ")"); } },
  { name: "Nàng Tấm (2, bộ bài mình)", turn: 4, hand: [["tinhquyennu", 1]],
    chk: (r) => { ok(r.t.some(x => x.k === "deck" && x.a === "buff" && x.side === "p"), "Nàng Tấm: +3 cho lá trên cùng bộ bài mình"); ok(r.t29.length > 0 && !r.t29.includes("face"), "Nàng Tấm: chỉ mặt lưng (" + r.t29.join(",") + ")"); } },
  { name: "Tâm Ma (2, cả bộ bài đối thủ)", turn: 4, hand: [["tammanu", 1]],
    chk: (r) => { ok(r.t.some(x => x.k === "tammanu:hit" && x.n > 0), "Tâm Ma: hút từ chồng bài đối thủ"); } },
  { name: "Thiện Xạ (33)", turn: 4, own: [["tunguyennu", 1]], hand: [["nuthantien", 1]],
    chk: (r) => { const a = r.t.filter(x => x.k === "sig:arrow").map(x => x.a); ok(a.length === 2 && a[0] && a[1] && a[0] !== a[1], "Thiện Xạ: 2 mũi tên khác nhau bay vào tay (" + a.join(",") + ")"); const hs = r.hand.filter(id => /^ten/.test(id)); ok(hs.length === 2 && hs[0] !== hs[1], "Thiện Xạ: tay có 2 Mũi Tên khác loại (" + hs.join(",") + ")"); } },
  { name: "Vua Thời Gian (17)", rs: 777, turn: 4, own: [["tunguyennu", 1], ["thachquai", 0]], foe: [["thachquai", 1], ["thachquai", 2]], hand: [["vuathoigian", 1]], extraHand: ["kiemsu"],
    chk: (r, u) => { const b = r.t.filter(x => x.k === "borrow" && x.uid === u.hand[0]); ok(b.length === 3 && new Set(b.map(x => x.id)).size >= 1, "Vua Thời Gian: diễn 3 kỹ năng mượn (" + b.map(x => x.id).join(",") + ")"); ok(r.t.filter(x => x.k === "borrow:hit").length === 3, "Vua Thời Gian: mỗi kỹ năng mượn có nhịp trúng riêng"); } },
  { name: "Đầu Bay khi bị tiêu huỷ (20)", turn: 4, own: [["daubay", 1]], hand: [["xacmay", 1]], extraHand: ["tinhquyennu", "kiemsu"],
    chk: (r, u) => { ok(r.t.some(x => x.k === "react" && x.uid === u.own[0] && x.w === "d"), "Đầu Bay: hồn + nhãn KHI BỊ TIÊU HUỶ"); const h = r.t.find(x => x.k === "react:hit" && x.uid === u.own[0]); ok(!!h && h.n >= 2, "Đầu Bay: đạo cụ tới từng lá trên tay (" + (h && h.n) + ")"); } },
  { name: "Chúa Rồng đặt thẻ từ tay (15)", turn: 5, hand: [["longchu", 1]], extraHand: ["kiemsu", "thachquai"],
    chk: (r) => { const h = r.t.find(x => x.k === "handPlace"); ok(!!h && r.t.some(x => x.k === "handPlace:land" && x.uid === h.uid), "Chúa Rồng: lá rời tay bay lên bàn rồi đáp ô"); } },
  { name: "Kỳ Đồng Cuối Lượt (12)", turn: 4, own: [["kydong", 1], ["tinhquyennu", 1], ["daothosan", 0]], eot: ["kydong"], hand: [["tasu", 2]],
    chk: (r, u) => { const hs = r.t.filter(x => x.k === "eot:hit").map(x => x.uid); ok(hs.includes(u.own[1]) && hs.includes(u.own[2]) && !hs.includes(u.own[0]), "Kỳ Đồng: đúng 2 thẻ 1 năng lượng được +1 (" + hs.join(",") + ")"); ok(r.t.some(x => x.k === "eot" && /SỨC MẠNH/.test(x.lab || "")), "Kỳ Đồng: nhãn Cuối Lượt theo loại"); } },
  { name: "Quái Đầu To vứt cả tay (4 + 20)", turn: 4, foe: [["thachquai", 0], ["thachquai", 1]], own: [["tunguyennu", 2]], hand: [["dauto", 1]], extraHand: ["matthevuong", "bayong", "cotnu", "dathuongnu"],
    chk: (r, u) => {
      const ex = u.extra, d = r.t.filter(x => x.k === "disc").map(x => x.uid);
      ok(ex.every(x => d.includes(x)), "vứt bỏ: đủ 4 lá nhấc khỏi tay + cháy");
      ok(ex.every(x => r.t.some(y => y.k === "disc:grave" && y.uid === x)), "vứt bỏ: 4 hồn vào Mộ");
      ok(r.t.some(x => x.k === "disc:land" && x.uid === ex[0] && x.to === "hand"), "Thuỷ Tinh: từ Mộ bay về tay");
      ok(r.t.filter(x => x.k === "disc:land" && x.to === "hand" && x.uid !== ex[0]).length === 2, "Đàn Ong Vàng: 2 bản sao từ Mộ vào tay");
      ok(r.t.some(x => x.k === "disc:land" && x.uid === ex[3] && x.to === "board"), "Dạ Thương: từ Mộ nhảy tới chiến địa");
      const gi = r.t.findIndex(x => x.k === "disc:grave" && x.uid === ex[2]), ri = r.t.findIndex(x => x.k === "react" && x.uid === ex[2]);
      ok(gi >= 0 && ri > gi, "Bạch Cốt Yêu: phản ứng −7 diễn SAU khi lá vào Mộ");
    } },
  { name: "Ma Tốc đưa lá vứt bỏ lên bàn (4)", turn: 4, disc: ["kiemsu"], hand: [["matoc", 1]],
    chk: (r) => { ok(r.t.some(x => x.k === "disc:ret") && r.t.some(x => x.k === "disc:land" && x.to === "board"), "Ma Tốc: lá bay từ Mộ ra chiến địa"); } },
  { name: "Băng Đế hút sức mạnh (mẫu chung)", turn: 4, own: [["tinhquyennu", 1]], foe: [["thachquai", 1], ["thachquai", 1]], hand: [["bangvuong", 1]],
    chk: (r, u) => { const hs = r.t.filter(x => x.k === "drain:hit").map(x => x.uid); ok([u.own[0], ...u.foe].every(x => hs.includes(x)) && r.t.some(x => x.k === "drain" && x.uid === u.hand[0]), "Băng Đế: hút từ đúng 3 thẻ khác tại đây về thẻ nguồn (" + hs.join(",") + ")"); } },
  { name: "Nộ Diện Cự Nhân Cuối Lượt trên tay (12/32)", turn: 4, hand: [["tinhquyennu", 1]], extraHand: ["cuongnhando"], js: "G.energy.a = 3;",
    chk: (r, u) => { ok(r.t.some(x => x.k === "handCover" && x.uid === u.extra[0]), "Nộ Diện: khung phủ lá trên tay khi kỹ năng chạy"); ok(r.t.some(x => x.k === "eot:hit" && x.uid === u.extra[0]), "Nộ Diện: +3 diễn trên chính lá trên tay"); } },
  { name: "gpu70 (mục 6): Trương Chi đạt điều kiện -> vòng vàng sau khi lật", turn: 4, foe: [["thachquai", 1]], hand: [["tinhchua", 1]], js: "G.locs[1].cards.a[0].turn = G.turn;",
    chk: (r, u) => { const ci = r.t.findIndex(x => x.k === "cond" && x.uid === u.hand[0]), fi = r.t.findIndex(x => x.k === "Q:B"); ok(ci >= 0, "Trương Chi: vòng vàng điều kiện đạt"); ok(fi >= 0 && ci > fi, "vòng vàng chỉ trong phần kỹ năng [B] (sau khi lật)"); eq1(r.t.filter(x => x.k === "cond").length, 1, "loé đúng một lần"); } },
  { name: "gpu70 (mục 6): Trương Chi KHÔNG đạt điều kiện -> không vòng vàng", turn: 4, foe: [["thachquai", 1]], hand: [["tinhchua", 1]],
    chk: (r) => { ok(!r.t.some(x => x.k === "cond"), "không loé khi đối thủ không đặt thẻ tại đây lượt này"); } },
  { name: "gpu70 (mục 7): Thư Sinh Hoá Cuồng 33% -> nhịp quay TRÚNG/TRƯỢT", turn: 4, own: [["tiensigamma", 0]], eot: ["tiensigamma"], hand: [["tinhquyennu", 2]],
    chk: (r) => { const a = r.t.findIndex(x => x.k === "spin" && x.roll >= 1), b = r.t.findIndex(x => x.k === "spin/"); ok(a >= 0 && b > a, "nhịp quay xác suất chạy rồi kết thúc trước kết quả"); } },
  { name: "Quái Đầu To + chạm tua nhanh", tapAt: 1400, turn: 4, hand: [["dauto", 1]], extraHand: ["matthevuong", "bayong", "kiemsu"],
    chk: (r) => { ok(r.t.some(x => x.k === "disc:end"), "chạm: phần diễn vứt bỏ kết thúc ngay"); } },
];
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.evaluate(() => { document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); store.mute = true; });
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !TURN_BUSY, null, { timeout: 180000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => { G.hand.a = []; document.getElementById("btnEnd").click(); });
  await page.waitForFunction(() => !TURN_BUSY && G.phase === "play", null, { timeout: 180000 });
  await page.evaluate(() => { FFTURN.start = () => {}; });
  ok(await page.evaluate(() => !!(window.ACT44 && SIGK.x && SIGK.x.size >= 7 && SIGK.reg.size === 12)), "18-act.js nạp, bảng phụ SIGK.x có màn diễn, bảng 12 ấn ký không đổi");
  let n = 0;
  for (const o of SC) {
    n++;
    if (process.env.ONLY && !process.env.ONLY.split(",").includes(String(n))) continue;
    const tag = `${String(n).padStart(2, "0")} ${o.name}`;
    const oo = Object.assign({}, o); delete oo.chk;
    const u = await page.evaluate(({ o }) => {
      G.turn = o.turn || 3;
      for (const L of G.locs) { L.rvl = true; L.id = "meadow"; L.gone = false; L.cards.p.length = 0; L.cards.a.length = 0; }
      const put = (id, side, li, b) => { const c = E.mk(G, id, side); c.rev = true; c.played = true; c.turn = 1; c.et = (o.eot || []).includes(id) ? 0 : G.turn; if (b) c.bonus = b; G.locs[li].cards[side].push(c); return c; };
      const U = { foe: [], own: [], hand: [], extra: [] };
      for (const [id, li, b] of o.foe || []) U.foe.push(put(id, "a", li, b).uid);
      for (const [id, li, b] of o.own || []) U.own.push(put(id, "p", li, b).uid);
      G.hand.p = (o.hand || []).map(([id]) => E.mk(G, id, "p"));
      for (const id of o.extraHand || []) { const c = E.mk(G, id, "p"); G.hand.p.push(c); U.extra.push(c.uid); }
      G.hand.a = []; G.energy.p = 40; G.energy.a = 0;
      G.disc.p = (o.disc || []).map(id => E.mk(G, id, "p"));
      if (G.deck.p.length < 4) for (let i = 0; i < 4; i++) G.deck.p.unshift(E.mk(G, "tunguyennu", "p"));
      if (G.deck.a.length < 4) for (let i = 0; i < 4; i++) G.deck.a.unshift(E.mk(G, "thachquai", "a"));
      render();
      U.hand = G.hand.p.slice(0, (o.hand || []).length).map(c => c.uid);
      (o.hand || []).forEach(([id, li], k) => E.queuePlay(G, "p", U.hand[k], li));
      if (o.rs != null) G.rs = o.rs;
      if (o.js) eval(o.js);
      render(); window.__t.length = 0; window.__t29.length = 0;
      return U;
    }, { o: oo });
    await page.waitForTimeout(500);
    await page.evaluate(() => document.getElementById("btnEnd").click());
    const t0 = Date.now();
    let tapped = 0;
    while (Date.now() - t0 < 90000) {
      const st = await page.evaluate(() => ({ b: TURN_BUSY, ph: G.phase, d: window.__t.some(x => x.k === "disc") }));
      if (o.tapAt && !tapped && st.d) { tapped = 1; await page.waitForTimeout(o.tapAt); await page.evaluate(() => document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); }
      if (!st.b && st.ph === "play" && Date.now() - t0 > 1500) break;
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(900);
    const r = await page.evaluate(({ LEAK }) => {
      const dom = LEAK.map(s => [s, document.querySelectorAll(s).length]).filter(x => x[1]);
      const hide = ((document.getElementById("actHide") || {}).textContent || "") + ((document.getElementById("sigHide") || {}).textContent || "");
      const hid = [...document.querySelectorAll("#board [data-mc],#hand [data-hc]")].filter(e => getComputedStyle(e).visibility === "hidden" || +getComputedStyle(e).opacity < 0.5).map(e => e.dataset.mc || e.dataset.hc);
      const bad = [];
      document.querySelectorAll("#board [data-lane]").forEach(ln => { const li = +ln.dataset.lane; for (const sd of ["p", "a"]) { const el = ln.querySelector(".pw." + sd); if (el) { const v = parseInt(el.textContent, 10), w = E.locPower(G, li, sd); if (v !== w) bad.push(`tổng ${li}${sd}:${v}≠${w}`); } } });
      for (const c of G.hand.p) { const el = document.querySelector(`#hand [data-hc="${c.uid}"] .cst`); if (el && parseInt(el.textContent, 10) !== E.cost(G, c)) bad.push(`${c.id}:${el.textContent}≠${E.cost(G, c)}`); }
      for (let li = 0; li < 3; li++) for (const sd of ["p", "a"]) for (const c of G.locs[li].cards[sd]) { const el = document.querySelector(`#board [data-mc="${c.uid}"] .pwh`); if (el && c.rev && parseInt(el.textContent, 10) !== E.power(G, c, li)) bad.push(`${c.id}:${el.textContent}≠${E.power(G, c, li)}`); }
      return { t: window.__t.slice(), t29: window.__t29.slice(), dom, hide: hide.trim(), hid, bad, hand: G.hand.p.map(c => c.id), busy: (window.ACT44 ? ACT44.busy() : 0) + SIGK.busy() };
    }, { LEAK });
    console.log(tag + " — " + [...new Set(r.t.filter(x => x.src === "a").map(x => x.k))].join(" "));
    if (process.env.DBG) console.log(JSON.stringify(r.t.map(x => x.k + "#" + (x.uid || "") + (x.lab ? ":" + x.lab : ""))), JSON.stringify(u), JSON.stringify(r.hand), r.bad);
    try { o.chk(r, u); } catch (e) { ok(false, tag + ": lỗi kiểm " + e.message); }
    ok(!r.dom.length && !r.hide && !r.busy, `${tag}: không sót DOM/luật ẩn ${JSON.stringify(r.dom)} ${r.hide}`);
    ok(!r.hid.length, `${tag}: không lá nào bị ẩn ${JSON.stringify(r.hid)}`);
    ok(!r.bad.length, `${tag}: số trên màn hình đúng kết quả thật ${JSON.stringify(r.bad)}`);
  }
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.stack); }
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
await browser.close(); server.close();
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
