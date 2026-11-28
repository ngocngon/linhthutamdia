// gpu71 (L1): chạm chiến địa LUÔN mở bảng thông tin + khung chiến địa không mất khi lộ diện + nút "Bỏ qua" thay chạm-màn-hình-để-tua.
//  1. lượt 1 trước khi lộ diện (màn mở đầu đóng ô): chạm từng ô (cảm ứng) -> bảng hiện "?", điểm 2 bên, khu thẻ 2 bên
//  2. giữa lúc lộ diện (body[data-l51]): chạm từng ô -> bảng; ô đang lộ diện vẫn còn khung (.loc hiện, nền viền gradient)
//  3. giữa màn phóng lớn PA6 (.uc5): chạm từng ô -> bảng có ảnh, điểm khớp huy hiệu, đủ thẻ 2 bên (thẻ úp đối thủ = mặt lưng); chạm KHÔNG tua (không S:skip)
//  4. sau lộ diện: chạm từng ô -> bảng có ảnh + điểm + thẻ; khung đủ (opacity 1, có viền); chuột (máy tính) cũng mở bảng
//  5. nút "Bỏ qua": không hiện trước ngưỡng (test đặt FFTURN.after = 2,5 s thay 60 s), hiện sau ngưỡng; bấm -> phần còn lại của lượt tua, điểm cuối đúng engine
//  6. kéo thẻ từ tay thả vào chiến địa vẫn đặt thẻ (không bị bảng chặn), bảng đóng khi đang kéo
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/loc-info.mjs
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const SHOTS = process.env.SHOTS || "/tmp/shots-loc-info";
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
  window.__p6 = [];
  window.PA6_TAP = (k, o) => window.__p6.push({ k, t: performance.now(), o });
});
const pt = (li) => page.evaluate((li) => { const r = document.querySelector(`#board [data-lane="${li}"] .locw`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, li);
/* trạng thái bảng + ô chiến địa li */
const panel = (li) => page.evaluate((li) => {
  const p = document.getElementById("locPanel"), lane = document.querySelector(`#board [data-lane="${li}"]`);
  const lc = lane.querySelector(".locw .loc"), cs = getComputedStyle(lc);
  const fr = { op: +cs.opacity, bg: /gradient/.test(cs.backgroundImage), pad: parseFloat(cs.paddingTop) };
  if (!p || p.hidden || !p.classList.contains("on")) return { open: false, fr };
  const pv = (sd) => +lane.querySelector(`.pw.${sd}`).textContent;
  const sc = [...p.querySelectorAll(".lpsc b")].map(b => +b.textContent);
  const g = typeof GV !== "undefined" && GV && GV !== G ? GV : G, L = g.locs[li];
  const qn = (sd) => G.q.p.filter(a => a.t === "play" && a.li === li && (a.row || "p") === sd).length;
  return {
    open: true, li: +p.dataset.li, img: !!p.querySelector(".lpi:not(.q)"), q: !!p.querySelector(".lpi.q"), name: p.querySelector(".lpnm").textContent,
    sc, badge: [pv("p"), pv("a")],
    nMe: p.querySelectorAll(".lpr.me .lpc").length, nFoe: p.querySelectorAll(".lpr.foe .lpc").length, nBack: p.querySelectorAll(".lpr.foe .lpc.bk").length,
    wantMe: L.cards.p.length + qn("p"), wantFoe: L.cards.a.length + qn("a"), foeHidden: L.cards.a.filter(c => !c.rev).length,
    vis: (() => { const r = p.getBoundingClientRect(); const cs = getComputedStyle(p); return r.width > 100 && r.height > 80 && cs.visibility !== "hidden" && cs.display !== "none" && p.classList.contains("on") && +cs.zIndex >= 50; })(), fr
  };
}, li);
const tapLoc = async (li, mouse) => { const p = await pt(li); if (mouse) await page.mouse.click(p.x, p.y); else await page.touchscreen.tap(p.x, p.y); await page.waitForTimeout(300); return panel(li); };
const closeP = () => page.evaluate(() => { if (window.LOCP) LOCP.close(); });

try {
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.evaluate(() => { document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); store.mute = true; });
  ok(await page.evaluate(() => !!(window.FFTURN && FFTURN.skipNow && FFTURN.reg && window.LOCP)), "FFTURN.skipNow/reg + LOCP đã nạp");
  ok(await page.evaluate(() => { const z = document.createElement("div"); z.className = "uc5 s5"; document.body.appendChild(z); const pe = getComputedStyle(z).pointerEvents; z.remove(); const d = document.createElement("div"); d.className = "dcb"; document.body.appendChild(d); const pd = getComputedStyle(d).pointerEvents; d.remove(); return pe === "none" && pd === "none"; }), "lớp phủ màn ra mắt (.uc5) và vứt bỏ (.dcb) không chặn chạm");
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.locs && document.querySelector('#board [data-lane="2"] .locw') && !document.querySelector("#mm.on"), null, { timeout: 180000 });

  /* 1. lượt 1 trước lộ diện */
  {
    const pre = await page.evaluate(() => !!document.body.dataset.l51 || !(LVEIL === G));
    let good = 0;
    for (const li of [0, 1, 2]) { await closeP(); const r = await tapLoc(li); if (r.open && r.li === li && r.vis && (r.q || r.img) && r.sc.length === 2) good++; else console.log("   ", li, JSON.stringify(r)); }
    if (pre) console.log("  (màn mở đầu đã bắt đầu lộ diện trước khi chạm — vẫn tính)");
    ok(good === 3, `lượt 1 trước lộ diện: chạm cả 3 ô -> bảng "?", điểm 2 bên (${good}/3)`);
    await page.screenshot({ path: path.join(SHOTS, "1_truoc_lo_dien.png") });
  }
  await page.waitForFunction(() => !document.body.dataset.l51 && !TURN_BUSY && G.phase === "play" && LVEIL !== G, null, { timeout: 60000 });
  await page.waitForTimeout(600);
  /* 2. giữa lúc lộ diện: diễn lại màn lộ diện của ô 1 (gpuLocReveal — đúng đường lộ diện lượt 2/3) */
  {
    await page.evaluate(() => { const L = G.locs[1]; L.rvl = true; L.id = Object.keys(LOC).find(k => k !== "meadow" && IMGL.has(k) && k !== G.locs[0].id) || L.id; look = null; render(); gpuLocReveal(1); });
    const on = await page.waitForFunction(() => document.body.dataset.l51, null, { timeout: 8000 }).then(() => true).catch(() => false);
    ok(on, "màn lộ diện chiến địa bắt đầu");
    await page.waitForTimeout(250);
    const r0 = await panel(1);
    ok(r0.fr.op > 0.9 && r0.fr.bg && r0.fr.pad >= 1, `giữa lộ diện: ô đang lộ diện vẫn còn khung (${JSON.stringify(r0.fr)})`);
    await page.screenshot({ path: path.join(SHOTS, "2a_khung_giua_lo_dien.png") });
    let good = 0;
    for (const li of [1, 0, 2]) {
      await closeP();
      const midNow = await page.evaluate(() => !!document.body.dataset.l51);
      const r = await tapLoc(li);
      if (r.open && r.li === li && r.vis && (li !== 1 || r.img)) good++; else console.log("   ", li, midNow, JSON.stringify(r));
      if (li === 1) await page.screenshot({ path: path.join(SHOTS, "2_giua_lo_dien.png") });
    }
    ok(good === 3, `giữa lộ diện: chạm cả 3 ô -> bảng (ô đang lộ diện có ảnh) (${good}/3)`);
  }
  await page.waitForFunction(() => !document.body.dataset.l51, null, { timeout: 20000 });
  await page.waitForTimeout(400);
  {
    const r = await panel(0);
    ok(r.fr.op > 0.9 && r.fr.bg && r.fr.pad >= 1, `sau lộ diện: ô 1 còn khung ${JSON.stringify(r.fr)}`);
  }

  /* 3. giữa màn phóng lớn PA6 */
  await page.evaluate(() => { FFTURN.after = 600000; });
  const setup = () => page.evaluate(() => {
    G.turn = 4;
    for (const L of G.locs) { L.rvl = true; L.gone = false; L.cards.p.length = 0; L.cards.a.length = 0; }
    const put = (id, side, li, rev) => { const c = E.mk(G, id, side); c.rev = rev !== false; c.played = true; c.turn = 1; c.et = 1; G.locs[li].cards[side].push(c); return c; };
    put("thachquai", "a", 0); put("tunguyennu", "a", 1); put("thachquai", "p", 2); put("tunguyennu", "p", 0);
    const all = Object.keys(C).filter(k => C[k].h === "S5" && C[k].t === "rev" && C[k].c <= 6);
    const pick = ["cuongdomienvien", "hongve", "huyetmenu"].filter(k => C[k]).concat(all);
    G.hand.p = [E.mk(G, pick[0], "p"), E.mk(G, pick[1], "p"), E.mk(G, pick[2], "p")];
    G.hand.a = [E.mk(G, "thachquai", "a")];
    G.energy.p = 30; G.energy.a = 0;
    if (G.deck.p.length < 4) for (let i = 0; i < 4; i++) G.deck.p.unshift(E.mk(G, "tunguyennu", "p"));
    if (G.deck.a.length < 4) for (let i = 0; i < 4; i++) G.deck.a.unshift(E.mk(G, "thachquai", "a"));
    look = null; render();
    G.hand.p.slice().forEach((c, k) => E.queuePlay(G, "p", c.uid, k % 3));
    /* đối thủ đặt 1 thẻ (úp tới lúc lật) */
    try { E.queuePlay(G, "a", G.hand.a[0].uid, 1); } catch (e) {}
    render(); window.__p6.length = 0;
  });
  {
    await setup();
    await page.waitForTimeout(400);
    await page.evaluate(() => document.getElementById("btnEnd").click());
    const z = await page.waitForFunction(() => document.querySelector(".uc5"), null, { timeout: 40000 }).then(() => true).catch(() => false);
    ok(z, "màn phóng lớn (.uc5) xuất hiện");
    let good = 0, res = [];
    for (const li of [0, 1, 2]) {
      await closeP();
      const still = await page.evaluate(() => !!document.querySelector(".uc5"));
      const r = await tapLoc(li); res.push(r);
      if (r.open && r.li === li && r.vis && r.img && r.sc[0] === r.badge[0] && r.sc[1] === r.badge[1] && r.nMe === r.wantMe && r.nFoe === r.wantFoe && r.nBack >= r.foeHidden) good++;
      else console.log("   ", li, still, JSON.stringify(r));
      if (li === 0) await page.screenshot({ path: path.join(SHOTS, "3_giua_pa6.png") });
    }
    ok(good === 3, `giữa màn phóng lớn PA6: chạm cả 3 ô -> bảng có ảnh, điểm khớp, đủ thẻ 2 bên (${good}/3)`);
    ok(res.some(r => r.nMe + r.nFoe > 0), "bảng liệt kê thẻ đang đặt");
    /* chạm vùng trống giữa màn: KHÔNG tua */
    await page.touchscreen.tap(195, 120);
    await page.waitForTimeout(150);
    ok(await page.evaluate(() => !window.__p6.some(e => e.k === "S:skip")), "chạm màn hình không còn tua nhanh (không S:skip)");
    await page.waitForFunction(() => !TURN_BUSY && G.phase === "play", null, { timeout: 180000 });
    ok(await page.evaluate(() => !document.getElementById("skipBtn") || document.getElementById("skipBtn").hidden), "lượt < ngưỡng: nút Bỏ qua không hiện");
  }
  /* 4. sau lộ diện: chạm (cảm ứng) + chuột */
  {
    await page.waitForTimeout(500);
    let good = 0;
    for (const li of [0, 1, 2]) {
      await closeP();
      const r = await tapLoc(li, li === 2);
      if (r.open && r.li === li && r.img && r.sc[0] === r.badge[0] && r.sc[1] === r.badge[1] && r.nMe === r.wantMe && r.nFoe === r.wantFoe && r.fr.op > 0.9 && r.fr.bg) good++; else console.log("   ", li, JSON.stringify(r));
    }
    ok(good === 3, `sau lộ diện: chạm 3 ô (ô 3 bằng chuột) -> bảng đủ ảnh/điểm/thẻ, khung còn (${good}/3)`);
    await page.screenshot({ path: path.join(SHOTS, "4_sau.png") });
    const r = await tapLoc(1); const r2 = await tapLoc(1);
    ok(r.open && !r2.open, "chạm lại cùng ô -> đóng bảng");
  }
  /* 5. nút Bỏ qua */
  {
    await setup();
    await page.evaluate(() => { FFTURN.after = 2500; });
    await page.waitForTimeout(300);
    const t0 = Date.now();
    await page.evaluate(() => document.getElementById("btnEnd").click());
    await page.waitForTimeout(1500);
    const early = await page.evaluate(() => FFTURN.btnOn);
    ok(!early, "trước ngưỡng: nút Bỏ qua chưa hiện");
    const shown = await page.waitForFunction(() => FFTURN.btnOn || !TURN_BUSY, null, { timeout: 20000 }).then(() => page.evaluate(() => FFTURN.btnOn));
    ok(shown, `quá ngưỡng: nút Bỏ qua hiện (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    if (shown) {
      await page.screenshot({ path: path.join(SHOTS, "5_nut_bo_qua.png") });
      const b = await page.evaluate(() => { const r = document.getElementById("skipBtn").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      const top = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return !!(e && e.closest("#skipBtn")); }, b);
      ok(top, "nút Bỏ qua nằm trên cùng, chạm được");
      const t1 = Date.now();
      await page.touchscreen.tap(b.x, b.y);
      await page.waitForFunction(() => !TURN_BUSY && G.phase === "play", null, { timeout: 60000 });
      const dt = (Date.now() - t1) / 1000;
      ok(dt < 25, `bấm Bỏ qua -> phần còn lại của lượt xong nhanh (${dt.toFixed(1)} s)`);
      await page.waitForTimeout(1200);
      const st = await page.evaluate(() => ({
        ff: FFTURN.on, btn: FFTURN.btnOn, uc: document.querySelectorAll(".uc5,.p6soul,.hero5,.dcb").length,
        bad: [0, 1, 2].filter(li => ["p", "a"].some(sd => +document.querySelector(`#board [data-lane="${li}"] .pw.${sd}`).textContent !== E.locPower(G, li, sd))).length,
        spd: SPD === (SPDV[store.spd] || 1)
      }));
      ok(!st.ff && !st.btn && st.spd, `hết lượt: tắt chế độ tua, ẩn nút, trả tốc độ (${JSON.stringify(st)})`);
      ok(st.uc === 0, "không sót lớp diễn sau khi bỏ qua");
      ok(st.bad === 0, "điểm trên bàn khớp engine sau khi bỏ qua");
    }
    await page.evaluate(() => { FFTURN.after = 60000; });
  }
  /* 6. kéo thẻ từ tay vào chiến địa (chuột) khi bảng đang mở */
  {
    await page.evaluate(() => { G.hand.p = [E.mk(G, "thachquai", "p")]; G.energy.p = 10; G.q.p.length = 0; for (const L of G.locs) { L.cards.p.length = 0; } look = null; render(); });
    await tapLoc(0);
    const h = await page.evaluate(() => { const r = document.querySelector("#hand [data-hc]").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const tli = await page.evaluate(() => [1, 0, 2].find(li => E.canPlay(G, "p", G.hand.p[0], li)) ?? 1);
    const d = await pt(tli);
    await page.mouse.move(h.x, h.y); await page.mouse.down();
    for (let i = 1; i <= 12; i++) { await page.mouse.move(h.x + (d.x - h.x) * i / 12, h.y + (d.y + 60 - h.y) * i / 12); await page.waitForTimeout(16); }
    const mid = await page.evaluate(() => { const p = document.getElementById("locPanel"); return !!(p && !p.hidden); });
    await page.mouse.up();
    await page.waitForTimeout(200);
    const q = await page.evaluate((tli) => G.q.p.filter(a => a.t === "play" && a.li === tli).length, tli);
    ok(!mid, "đang kéo thẻ: bảng chiến địa đóng");
    ok(q === 1, `kéo thẻ thả vào chiến địa ${tli + 1} vẫn đặt được (${q})`);
  }
} catch (e) { failed = true; console.error("THẤT BẠI: " + e.stack); }
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); failed = true; }
await browser.close(); server.close();
console.log(failed ? "FAIL" : "OK");
process.exit(failed ? 1 : 0);
