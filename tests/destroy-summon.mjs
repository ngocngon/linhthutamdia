// gpu71 (làn D): kiểm VỨT BỎ phóng lớn giữa màn, TIÊU HUỶ rõ trên đúng lá, TIẾNG riêng theo lá, TRIỆU HỒI đáp ô trước kỹ năng của lá
//   (www/js/19-mo.js + discardBeat2 trong 18-act.js + SFX.mo trong 04-audio.js, sprite www/sfx/mo.mp3)
//  Mỗi cảnh dàn sẵn bàn, bấm Kết thúc lượt, ghi ACT_TAP/HX_TAP/MO_TAP/MO_SND và kiểm:
//   - vứt bỏ: mỗi lá hiện phóng lớn (rộng >= 96 px, 1 lá >= 40% màn) ở dải giữa màn, các lá cháy LẦN LƯỢT, rồi mới vào Mộ / phản ứng
//   - tiêu huỷ: màn huỷ chạy đúng trên uid bị huỷ (nứt -> vỡ -> hết), không chạy trên lá khác
//   - tiếng: mỗi lá vứt/huỷ gọi SFX.mo một lần; thẻ có tiếng riêng -> c_<id>, còn lại v_/d_<hệ của lá>
//   - triệu hồi: mọi đòn của lá vừa xuống sân bắt đầu SAU khi lá đáp >= ~SETTLE, không chồng nhau
//   - sau cảnh: không sót DOM, không lá bị ẩn, số trên màn hình = kết quả thật, không lỗi console
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/destroy-summon.mjs
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
const ok = (c, m) => { console.log((c ? "  ok   " : "  LỖI  ") + m); if (!c) failed = true; };
await page.addInitScript(() => {
  localStorage.setItem("ltd_p6lv", "full"); localStorage.removeItem("ltd_hx_all");
  window.__t = [];
  const T = (src) => (k, o) => window.__t.push(Object.assign({ k, src, t: performance.now() }, o || {}));
  window.ACT_TAP = T("a"); window.SIG_TAP = T("s"); window.HX_TAP = T("h"); window.MO_TAP = T("m");
  window.__snd = []; window.MO_SND = (kind, id, key) => window.__snd.push({ kind, id, key, t: performance.now() });
  /* ghi lại mọi lá "lá trên cùng bộ bài" (.t29) được dựng: có mặt thẻ (.fxface) hay chỉ mặt lưng (.dkp) */
  window.__t29 = [];
  const mo = () => new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList && n.classList.contains("t29")) window.__t29.push(n.querySelector(".dkp") ? "back" : n.querySelector(".fxface") ? "face" : "other"); }).observe(document.body, { childList: true, subtree: true });
  if (document.body) mo(); else document.addEventListener("DOMContentLoaded", mo);
});
const LEAK = [".acp", ".acf", ".actag", ".acpile", ".acvs", ".fxg.acd", ".fxg.acgh", ".sgp", ".sgx", ".sgsoul", ".sga", ".dkp", ".hxsoul", ".mo-g", ".mo-dim", ".fxg.g9", ".fxg.ph8"];
const W0 = 430, H0 = 932;
const discChk = (r, uids, minW) => {
  const d = r.t.filter(x => x.k === "disc" && uids.includes(x.uid));
  ok(d.length === uids.length, `vứt bỏ: đủ ${uids.length} lá hiện ra (${d.length})`);
  ok(d.every(x => x.w >= minW), `vứt bỏ: lá phóng lớn rộng >= ${minW}px (${d.map(x => x.w).join(",")})`);
  ok(d.every(x => x.y > H0 * 0.25 && x.y < H0 * 0.72 && x.x > 0 && x.x < W0), `vứt bỏ: lá nằm ở dải giữa màn (${d.map(x => x.x + ":" + x.y).join(" ")})`);
  const big = r.t.filter(x => x.k === "disc:big" && uids.includes(x.uid));
  ok(big.length === uids.length && big.every(x => x.w >= minW * 0.9), `vứt bỏ: lá thật sự hiện to trên màn (${big.map(x => x.w).join(",")})`);
  const burns = r.t.filter(x => x.k === "HX04:burn" && uids.includes(x.uid)).map(x => x.t);
  const gaps = burns.slice(1).map((t, i) => t - burns[i]);
  ok(burns.length === uids.length && gaps.every(g => g > 120), `vứt bỏ: các lá cháy lần lượt (cách ${gaps.map(Math.round).join(",")} ms)`);
  const firstBurn = Math.min(...burns), firstDisc = Math.min(...d.map(x => x.t));
  ok(firstBurn - firstDisc > 900, `vứt bỏ: lá đứng yên đủ lâu để đọc trước khi cháy (${Math.round(firstBurn - firstDisc)} ms)`);
  for (const u of uids) { const gi = r.t.findIndex(x => x.k === "disc:grave" && x.uid === u), bi = r.t.findIndex(x => x.k === "HX04:burn" && x.uid === u); ok(bi >= 0 && gi > bi, `vứt bỏ ${u}: cháy rồi mới vào Mộ`); }
};
const sndChk = (r, kind, want) => {
  for (const [id, key] of want) { const s = r.snd.filter(x => x.kind === kind && x.id === id); ok(s.length >= 1 && (!key || s.some(x => x.key === key)), `tiếng ${kind === "v" ? "vứt bỏ" : "tiêu huỷ"} ${id}: ${key || "có"} (${s.map(x => x.key).join(",") || "không"})`); }
};
const SC = [
  { name: "Vứt 1 lá: phóng lớn giữa màn", turn: 4, hand: [["dauto", 1]], extraHand: ["kiemsu"],
    chk: (r, u) => { discChk(r, u.extra, Math.round(W0 * 0.4)); sndChk(r, "v", [["kiemsu", null]]); } },
  { name: "Quái Đầu To vứt 4 lá (hàng giữa màn + phản ứng + tiếng riêng)", turn: 4, foe: [["thachquai", 0], ["thachquai", 1]], own: [["tunguyennu", 2]], hand: [["dauto", 1]], extraHand: ["matthevuong", "bayong", "cotnu", "dathuongnu"],
    chk: (r, u) => {
      discChk(r, u.extra, 92);
      sndChk(r, "v", [["matthevuong", "c_matthevuong"], ["bayong", "c_bayong"], ["cotnu", "c_cotnu"], ["dathuongnu", "c_dathuongnu"]]);
      const gi = r.t.findIndex(x => x.k === "disc:grave" && x.uid === u.extra[2]), ri = r.t.findIndex(x => x.k === "react" && x.uid === u.extra[2]);
      ok(gi >= 0 && ri > gi, "Bạch Cốt Yêu: phản ứng −7 diễn SAU khi lá vào Mộ");
      ok(r.t.some(x => x.k === "disc:land" && x.uid === u.extra[3] && x.to === "board"), "Dạ Thương: từ Mộ nhảy tới chiến địa");
    } },
  { name: "Hồ Tinh tiêu huỷ 2 lá của mình (Bạch Cốt Yêu + Thạch Quái)", turn: 4, own: [["cotnu", 1], ["thachquai", 1], ["thachquai", 2]], hand: [["huyetdich", 1]],
    chk: (r, u) => {
      const ds = r.t.filter(x => x.k === "d").map(x => x.uid);
      ok(ds.length === 2 && ds.includes(u.own[0]) && ds.includes(u.own[1]) && !ds.includes(u.own[2]), `tiêu huỷ: đúng 2 lá bị huỷ (${ds.join(",")}; mong ${u.own[0]},${u.own[1]})`);
      for (const x of [u.own[0], u.own[1]]) { const c = r.t.findIndex(y => y.k === "d:crack" && y.uid === x), b = r.t.findIndex(y => y.k === "d:break" && y.uid === x), e = r.t.findIndex(y => y.k === "d:end" && y.uid === x); ok(c >= 0 && b > c && e > b, `tiêu huỷ ${x}: nứt -> vỡ -> hết`); }
      sndChk(r, "d", [["cotnu", "c_cotnu"], ["thachquai", "d_" + r.el.thachquai]]);
      ok(!r.boardU.includes(u.own[0]) && !r.boardU.includes(u.own[1]), "tiêu huỷ: ô đã trống (lá không còn trên bàn)");
    } },
  { name: "Sát Thủ Nón Lá huỷ thẻ địch (đòn kill)", turn: 4, foe: [["soc", 1], ["thachquai", 1]], hand: [["songchuynu", 1]],
    chk: (r, u) => { const ds = r.t.filter(x => x.k === "d").map(x => x.uid); ok(ds.length === 1 && ds[0] === u.foe[0], `tiêu huỷ đúng lá địch 1 năng lượng (${ds.join(",")})`); sndChk(r, "d", [["soc", "d_" + r.el.soc]]); } },
  { name: "Nàng Hoa Đăng kéo Linh Giác lên sân: đáp ô rồi mới +3", turn: 4, own: [["thachquai", 1], ["thachquai", 1]], deckTop: "giacquannhen", hand: [["phaohoanu", 1]],
    chk: (r, u) => {
      const su = r.topU;
      const land = r.t.find(x => x.k === "land" && x.uid === su), runs = r.t.filter(x => x.k === "run" && x.uid === su);
      ok(!!land, "triệu hồi: có mốc lá Linh Giác đáp ô");
      ok(runs.length >= 2, `triệu hồi: đòn +3 của Linh Giác tới 2 lá (${runs.length})`);
      ok(land && runs.every(x => x.t - land.t >= (x.step === "ult29" ? 0 : 0.8 * r.settle * r.spd)), `triệu hồi: màn ra mắt/đòn của lá bắt đầu sau khi lá đáp (${runs.map(x => x.step + "+" + Math.round(x.t - (land ? land.t : 0))).join(",")} ms, SPD ${r.spd})`);
      const ts = runs.map(x => x.t); ok(ts.every((t, i) => !i || t >= ts[i - 1]), "triệu hồi: các đòn của lá chạy lần lượt, không chen trước");
      ok(r.t.some(x => x.k === "gate" && x.D > 0), "triệu hồi: lịch bị dời cho lá đáp trước");
    } },
  { name: "Trùng Mẹ: bầy trùng con xuống sân", turn: 4, own: [["thachquai", 0]], hand: [["trungmau", 1]],
    chk: (r) => { ok(r.board.filter(id => id === "trungcon").length === 2, "bầy: 2 trùng con trên bàn"); } },
  { name: "U Minh Hậu hồi sinh Ma Sói từ Mộ: mọc lên tại ô rồi mới +2", turn: 4, own: [["thachquai", 0], ["thachquai", 1], ["thachquai", 2]], disc: ["soinu"], hand: [["minhhau", 1]],
    chk: (r) => {
      const su = r.discU[0], land = r.t.find(x => x.k === "disc:land" && x.uid === su), runs = r.t.filter(x => x.k === "run" && x.uid === su);
      ok(!!land && r.t.some(x => x.k === "rise" && x.uid === su && x.from === "grave"), "hồi sinh: Ma Sói từ Mộ MỌC LÊN tại chiến địa");
      ok(!runs.length || (land && runs.every(x => x.t >= land.t)), `hồi sinh: đòn của Ma Sói sau khi lá đáp (${runs.map(x => Math.round(x.t - (land ? land.t : 0))).join(",")})`);
      sndChk(r, "v", []);
    } },
  { name: "Phượng Lửa bị huỷ -> tự hồi sinh: MỌC LÊN tại ô (không bay từ Mộ)", turn: 4, own: [["vuotsoi", 1], ["thachquai", 1]], hand: [["huyetdich", 1]],
    chk: (r, u) => { const rs = r.t.filter(x => x.k === "rise" && x.uid === u.own[0]); ok(rs.length >= 1 && rs[0].from === "grave", `hồi sinh: Phượng Lửa mọc lên tại ô, nguồn Mộ (${JSON.stringify(rs.map(x => x.from))})`); ok(!r.t.some(x => x.k === "HX14"), "hồi sinh: không hồn trèo khỏi Mộ bay về ô (HX-14)"); ok(r.t.some(x => x.k === "rise:land" && x.uid === u.own[0]), "hồi sinh: lá đáp ô"); { const bi = r.t.findIndex(x => x.k === "d:break" && x.uid === u.own[0]), ri = r.t.findIndex(x => x.k === "react" && x.uid === u.own[0]), si = r.t.findIndex(x => x.k === "rise:land" && x.uid === u.own[0]); ok(bi >= 0 && (ri < 0 || ri > bi) && si > bi, "tiêu huỷ -> lá vỡ xong rồi mới phản ứng / mọc lại"); } } },
  { name: "Tốc Ảnh đưa lá từ Mộ ra sân: mọc lên tại ô", turn: 4, disc: ["kiemsu"], hand: [["matoc", 1]],
    chk: (r, u) => { ok(r.t.some(x => x.k === "rise" && x.uid === u.disc[0] && x.from === "grave"), "từ Mộ: lá mọc lên tại ô (không bay từ chồng Mộ)"); ok(r.t.some(x => x.k === "disc:land" && x.uid === u.disc[0] && x.to === "board"), "từ Mộ: lá đáp ô"); } },
  { name: "Nam Tước Mặt Nạ chiêu mộ từ BỘ BÀI ĐỐI THỦ", turn: 4, hand: [["namtuocmatna", 1]],
    chk: (r) => { const p = r.t.find(x => x.k === "pull"); ok(!!p && p.from === "deck" && p.foe === 1, `từ bộ bài đối thủ: mặt lưng rời cụm bộ bài đối thủ, lật tại ô (${JSON.stringify(p || null)})`); ok(!!p && r.t.some(x => x.k === "pull:land" && x.uid === p.uid), "từ bộ bài: lá đáp ô"); } },
  { name: "Lữ Khách Trời bị huỷ -> lá 4 năng lượng TỪ TAY", turn: 4, own: [["lukhachtroi", 1]], hand: [["huyetdich", 1]], extraHand: ["thachquai"],
    chk: (r, u) => { ok(r.t.some(x => x.k === "handPlace" && x.uid === u.extra[0]) && r.t.some(x => x.k === "handPlace:land" && x.uid === u.extra[0]), "từ tay: lá rời đúng chỗ trên tay bay lên ô"); { const bi = r.t.findIndex(x => x.k === "d:break" && x.uid === u.own[0]), hi = r.t.findIndex(x => x.k === "handPlace" && x.uid === u.extra[0]); ok(bi >= 0 && hi > bi, "thẻ thay thế chỉ xuống sau khi lá bị huỷ đã vỡ"); } } },
  { name: "Thằng Bờm bị huỷ -> lá 1 năng lượng TỪ BỘ BÀI", turn: 4, own: [["linhthuelammom", 1]], hand: [["huyetdich", 1]], deckTop: "soc",
    chk: (r) => { const p = r.t.find(x => x.k === "pull"); ok(!!p && p.from === "deck" && p.foe === 0, `từ bộ bài mình: mặt lưng rời cụm bộ bài, lật tại ô (${JSON.stringify(p || null)})`); } },
  { name: "Rắn Lục Nữ: lá bị KÉO sang phe kia từ đúng ô", turn: 4, own: [["thachquai", 1]], hand: [["ranlucnu", 1]],
    chk: (r, u) => { ok(r.t.some(x => x.k === "drag" && x.uid === u.own[0]) && r.t.some(x => x.k === "drag:land" && x.uid === u.own[0]), "đổi phe: xích móc lá ở ô cũ, kéo sang ô mới"); } },
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
  await page.evaluate(() => { FFTURN.start = () => {}; SFX.moLoad(); });
  await page.waitForFunction(() => SFX.moReady(), null, { timeout: 60000 }).catch(() => {});
  ok(await page.evaluate(() => !!(window.MO && MO.gate && SFX.moReady() && SFX.names().includes("c_cotnu") && SFX.names().includes("d_lua") && SFX.names().includes("v_moc"))), "19-mo.js nạp; sprite tiếng vứt bỏ/tiêu huỷ (mo.mp3) nạp đủ khoá c_/d_/v_");
  let n = 0;
  for (const o of SC) {
    n++;
    if (process.env.ONLY && !process.env.ONLY.split(",").includes(String(n))) continue;
    const tag = `${String(n).padStart(2, "0")} ${o.name}`;
    const oo = Object.assign({}, o); delete oo.chk;
    const u = await page.evaluate(({ o }) => {
      G.turn = o.turn || 3;
      for (const L of G.locs) { L.rvl = true; L.id = "meadow"; L.gone = false; L.cards.p.length = 0; L.cards.a.length = 0; }
      const put = (id, side, li, b) => { const c = E.mk(G, id, side); c.rev = true; c.played = true; c.turn = 1; c.et = G.turn; if (b) c.bonus = b; G.locs[li].cards[side].push(c); return c; };
      const U = { foe: [], own: [], hand: [], extra: [] };
      for (const [id, li, b] of o.foe || []) U.foe.push(put(id, "a", li, b).uid);
      for (const [id, li, b] of o.own || []) U.own.push(put(id, "p", li, b).uid);
      G.hand.p = (o.hand || []).map(([id]) => E.mk(G, id, "p"));
      for (const id of o.extraHand || []) { const c = E.mk(G, id, "p"); G.hand.p.push(c); U.extra.push(c.uid); }
      G.hand.a = []; G.energy.p = 40; G.energy.a = 0;
      G.disc.p = (o.disc || []).map(id => E.mk(G, id, "p")); U.disc = G.disc.p.map(c => c.uid);
      if (G.deck.p.length < 4) for (let i = 0; i < 4; i++) G.deck.p.unshift(E.mk(G, "tunguyennu", "p"));
      if (G.deck.a.length < 4) for (let i = 0; i < 4; i++) G.deck.a.unshift(E.mk(G, "thachquai", "a"));
      if (o.deckTop) { const c = E.mk(G, o.deckTop, "p"); G.deck.p.push(c); U.top = c.uid; }
      render();
      U.hand = G.hand.p.slice(0, (o.hand || []).length).map(c => c.uid);
      (o.hand || []).forEach(([id, li], k) => E.queuePlay(G, "p", U.hand[k], li));
      render(); window.__t.length = 0; window.__t29.length = 0; window.__snd.length = 0;
      return U;
    }, { o: oo });
    await page.waitForTimeout(500);
    await page.evaluate(() => document.getElementById("btnEnd").click());
    const t0 = Date.now();
    const shot = {};
    while (Date.now() - t0 < 90000) {
      const st = await page.evaluate(() => ({ b: TURN_BUSY, ph: G.phase, big: window.__t.some(x => x.k === "disc:big"), brk: window.__t.some(x => x.k === "d:break"), rise: window.__t.some(x => x.k === "rise"), drag: window.__t.some(x => x.k === "drag") }));
      if (process.env.SHOTS) for (const k of ["big", "brk", "rise", "drag"]) if (st[k] && !shot[k]) { shot[k] = 1; await page.waitForTimeout(k === "brk" ? 150 : k === "rise" ? 420 : k === "drag" ? 600 : 250); await page.screenshot({ path: `${process.env.SHOTS}/ds${n}_${k}.png`, scale: "css", type: "jpeg", quality: 60 }); }
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
      for (let li = 0; li < 3; li++) for (const sd of ["p", "a"]) for (const c of G.locs[li].cards[sd]) { const el = document.querySelector(`#board [data-mc="${c.uid}"] .pwh`); if (el && c.rev && parseInt(el.textContent, 10) !== E.power(G, c, li)) bad.push(`${c.id}:${el.textContent}≠${E.power(G, c, li)}`); }
      const board = [], boardU = [];
      for (let li = 0; li < 3; li++) for (const sd of ["p", "a"]) for (const c of G.locs[li].cards[sd]) { board.push(c.id); boardU.push(c.uid); }
      const el = {}; for (const id of ["thachquai", "soc", "kiemsu"]) el[id] = elOf(id);
      return { t: window.__t.slice(), snd: window.__snd.slice(), dom, hide: hide.trim(), hid, bad, board, boardU, el, settle: MO.SETTLE, spd: SPD, busy: (window.ACT44 ? ACT44.busy() : 0) + SIGK.busy() + MO.busy() };
    }, { LEAK });
    r.topU = u.top; r.discU = u.disc;
    console.log(tag + " — " + [...new Set(r.t.filter(x => x.src === "m").map(x => x.k))].join(" "));
    if (process.env.DBG) console.log(JSON.stringify(r.t.filter(x => x.src !== "s").map(x => x.k + "#" + (x.uid || "") + (x.step ? ":" + x.step + ">" + x.dst : "") + "@" + Math.round(x.t) + (x.st ? JSON.stringify(x.st) : ""))), JSON.stringify(u), JSON.stringify(r.snd), r.bad);
    try { o.chk(r, u); } catch (e) { ok(false, tag + ": lỗi kiểm " + e.message); }
    ok(!r.dom.length && !r.hide && !r.busy, `${tag}: không sót DOM/luật ẩn ${JSON.stringify(r.dom)} ${r.hide} busy=${r.busy}`);
    ok(!r.hid.length, `${tag}: không lá nào bị ẩn ${JSON.stringify(r.hid)}`);
    ok(!r.bad.length, `${tag}: số trên màn hình đúng kết quả thật ${JSON.stringify(r.bad)}`);
  }
  /* MO.skip: kết thúc ngay màn huỷ đang chạy (đường cho nút Bỏ qua), không sót DOM */
  const sk = await page.evaluate(async () => { const el = document.querySelector("#board [data-mc]"); if (!el) return { n: -1 }; const b = el.getBoundingClientRect(); MO.destroy({ x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height, html: el.outerHTML }); await new Promise(r => setTimeout(r, 120)); const n0 = document.querySelectorAll(".mo-g").length; MO.skip(); return { n0, n1: document.querySelectorAll(".mo-g,.mo-dim").length, busy: MO.busy() }; });
  ok(sk.n0 >= 1 && sk.n1 === 0 && sk.busy === 0, `MO.skip: màn huỷ kết thúc ngay, sạch (${JSON.stringify(sk)})`);
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.stack); }
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
await browser.close(); server.close();
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
