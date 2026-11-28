// gpu68-lab: kiểm Bảng Test VFX (www/js/dev-vfx-lab.js) — mọi màn diễn chạy qua lượt THẬT (endTurnUI) với thế cờ do mô phỏng engine chọn.
//  - mở bảng từ Cài đặt > Nâng cao (nút thật), chọn Bậc trên giao diện, bấm "Kiểm tra cả bậc" -> diễn hết mọi thẻ của bậc (mặc định S2)
//  - thêm một mẫu vài thẻ ở mọi bậc khác (VFXLAB.startAudit), thử ◀ / ⏸ / ▶ / nhảy tới thẻ bằng ô tìm
//  - LỖI nếu: lỗi trang (pageerror / console.error), bảng ghi LỖI JS / SÓT DOM / thẻ bị ẩn / chưa diễn xong, bảng tràn khỏi màn hình 390×844 hoặc 1280×800
//  - FULL=1: chạy kiểm tra MỌI bậc, lưu bảng vào OUT (mặc định /home/claude/vfx_audit.json) + in tóm tắt thẻ đáng ngờ (không làm test LỖI vì cảnh báo của thẻ)
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/vfx-lab.mjs
//   biến: TIER=S2 (bậc chạy đủ), SAMPLE=2 (số thẻ mẫu mỗi bậc khác), SPEED=4, FULL=1, OUT=..., SHOTS=thư-mục (chụp 3 ảnh nhỏ)
import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const TIER = process.env.TIER || "S2", SAMPLE = +(process.env.SAMPLE || 2), SPEED = process.env.SPEED || "4", FULL = !!process.env.FULL;
const OUT = process.env.OUT || "/home/claude/vfx_audit.json", SHOTS = process.env.SHOTS || "";
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
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
let failed = false;
const ok = (c, m) => { console.log((c ? "  ok   " : "  LỖI  ") + m); if (!c) failed = true; };
const IGN = /ERR_TUNNEL|ERR_PROXY|Failed to load resource/;

async function openPage(vp, mobile) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' }));
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error" && !IGN.test(m.text())) errors.push("console: " + m.text()); });
  await page.addInitScript(() => { localStorage.setItem("ltd_p6lv", "full"); localStorage.removeItem("ltd_hx_all"); });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.evaluate(() => { document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })); store.mute = true; });
  /* mở bảng bằng nút thật trong Cài đặt > Nâng cao */
  await page.evaluate(() => { const b = [...document.querySelectorAll("#ovSet button")].find(x => /Bảng Test/.test(x.textContent)); b.click(); });
  await page.waitForFunction(() => window.VFXLAB && document.querySelector("#vlBar.on") && typeof G !== "undefined" && G, null, { timeout: 60000 });
  await page.evaluate((s) => VFXLAB.setSpeed(s), SPEED);
  return { ctx, page, errors };
}
const inView = (page) => page.evaluate(() => {
  const out = [];
  for (const id of ["vlBar", "vfxLabDrawer"]) { const r = document.getElementById(id).getBoundingClientRect(); if (r.left < -1 || r.right > innerWidth + 1 || r.width > innerWidth + 1) out.push(id + " ngang " + Math.round(r.left) + ".." + Math.round(r.right)); if (r.height > innerHeight * 0.9) out.push(id + " cao " + Math.round(r.height)); }
  const bar = document.getElementById("vlBar").getBoundingClientRect();
  return { out, bar: Math.round(bar.height), w: innerWidth };
});
async function waitDone(page, maxMs, tag, saveTo) {
  const t0 = Date.now(); let last = -1, ts = Date.now();
  while (Date.now() - t0 < maxMs) {
    if (saveTo && Date.now() - ts > 60000) { ts = Date.now(); try { await writeFile(saveTo, await page.evaluate(() => VFXLAB.exportJSON())); } catch (e) {} }
    const st = await page.evaluate(() => ({ m: VFXLAB.state.mode, i: VFXLAB.state.i, n: VFXLAB.state.list.length, busy: VFXLAB.state.busy, cur: VFXLAB.state.cur }));
    if (st.i !== last && (st.i % 20 === 0 || st.n < 40)) { console.log(`  … ${tag} ${st.i}/${st.n} ${st.cur || ""}`); last = st.i; }
    if (!st.busy && (st.m === "done" || st.m === "idle")) return true;
    await page.waitForTimeout(400);
  }
  return false;
}
const summarize = (rows) => {
  const bad = rows.filter(r => r.bad), warn = rows.filter(r => r.warn.length && !r.bad);
  const cat = {};
  for (const r of rows) for (const w of r.warn) { const k = w.replace(/[:(].*$/, "").replace(/ \d.*$/, "").trim(); cat[k] = (cat[k] || 0) + 1; }
  return { n: rows.length, bad: bad.length, warn: warn.length, cat };
};

try {
  /* ===== điện thoại 390×844 ===== */
  const { ctx, page, errors } = await openPage({ width: 390, height: 844 }, true);
  let v = await inView(page);
  ok(!v.out.length, `bảng vừa màn hình 390×844 (thanh trên ${v.bar}px) ${v.out.join("; ")}`);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "lab_menu_390.png"), type: "jpeg", quality: 55 });
  const tiers = await page.evaluate(() => [...document.querySelectorAll("#vlTier option")].map(o => o.value).filter(v => v !== "*"));
  console.log("bậc:", tiers.join(" "));

  if (FULL) {
    console.log("\n== FULL: kiểm tra MỌI bậc");
    await page.evaluate(() => VFXLAB.startAudit(Object.keys(LT.C).sort((a, b) => LT.C[a].h.localeCompare(LT.C[b].h) || LT.C[a].c - LT.C[b].c)));
    const done = await waitDone(page, 4 * 3600e3, "ALL", OUT);
    ok(done, "kiểm tra mọi bậc chạy xong");
    const rows = await page.evaluate(() => VFXLAB.rows());
    const json = await page.evaluate(() => VFXLAB.exportJSON());
    await writeFile(OUT, json);
    const s = summarize(rows);
    console.log(`đã lưu ${OUT}: ${s.n} thẻ, ${s.bad} lỗi, ${s.warn} cảnh báo`);
    console.log("nhóm cảnh báo:", JSON.stringify(s.cat));
    for (const r of rows.filter(r => r.bad).slice(0, 60)) console.log("  LỖI", r.id, r.h, r.t, "|", r.warn.join(" | ").slice(0, 220));
    /* gpu68-lab3: MỌI thẻ có kỹ năng: điều kiện của chính nó được đáp ứng trên thế cờ (mô phỏng) VÀ tác dụng xuất hiện trong lượt thật; nếu không — phải có lý do */
    const withSkill = rows.filter(r => r.t !== "none");
    const met = withSkill.filter(r => r.cond && r.cond.met && r.cond.live !== false);
    const why = withSkill.filter(r => r.cond && !r.cond.met && r.cond.why && r.cond.why !== "chưa dựng được điều kiện");
    const fail = withSkill.filter(r => !met.includes(r) && !why.includes(r));
    console.log(`điều kiện: đáp ứng ${met.length} · không dựng được giữa ván (có lý do) ${why.length} · CHƯA ĐÁP ỨNG ${fail.length}`);
    for (const r of why) console.log("  lý do", r.id, "|", r.cond.why);
    for (const r of fail.slice(0, 40)) console.log("  ✗ điều kiện", r.id, "|", r.cond ? (r.cond.met ? "lượt thật không thấy tác dụng" : r.cond.why) : "thiếu cond", "|", (r.simDiff || [])[0] || "");
    ok(!fail.length, `mọi thẻ có kỹ năng: điều kiện đáp ứng hoặc có lý do (${fail.length} chưa)`);
  } else {
    /* --- một bậc chạy đủ qua giao diện --- */
    console.log(`\n== bậc ${TIER}: chạy đủ qua giao diện`);
    await page.selectOption("#vlTier", TIER);
    const nT = await page.evaluate(() => document.querySelectorAll("#vlList .vl-it").length);
    await page.click("#vfxLabDrawer [data-a=audit]");
    await page.waitForTimeout(1500);
    ok(await page.evaluate(() => !document.querySelector("#vfxLabDrawer.open")), "bắt đầu kiểm tra: bảng tự thu lại, bàn chơi lộ ra");
    const cap = await page.evaluate(() => document.getElementById("vlCap").textContent);
    ok(/Thế cờ:/.test(cap), "chú thích có tên thẻ + kỹ năng + thế cờ: " + cap.replace(/\s+/g, " ").slice(0, 110));
    if (SHOTS) { await page.waitForTimeout(1200); await page.screenshot({ path: path.join(SHOTS, "lab_play_390.png"), type: "jpeg", quality: 55 }); }
    /* tạm dừng / tiếp */
    await page.click("#vlDet [data-a=pause]");
    ok(await page.evaluate(() => VFXLAB.state.paused), "⏸ tạm dừng");
    await page.waitForTimeout(600);
    await page.click("#vlDet [data-a=pause]");
    const done = await waitDone(page, 40 * 60e3, TIER);
    ok(done, `kiểm tra bậc ${TIER} chạy xong`);
    let rows = await page.evaluate(() => VFXLAB.rows());
    ok(rows.length === nT, `đủ ${nT} thẻ trong nhật ký (${rows.length})`);
    /* --- mẫu các bậc khác --- */
    const ids = await page.evaluate(({ tiers, TIER, SAMPLE }) => {
      const out = []; for (const h of tiers) if (h !== TIER) { const L = VFXLAB.listFor(h, ""); for (let k = 0; k < SAMPLE && k < L.length; k++) out.push(L[Math.floor((k + 0.5) * L.length / SAMPLE)]); }
      for (const id of ["bachdich", "aiquoc", "tuthanmienvien", "matthevuong", "phonghiem", "hacdiemchua"]) if (LT.C[id] && !out.includes(id)) out.push(id);
      return out;
    }, { tiers, TIER, SAMPLE });
    console.log(`\n== mẫu ${ids.length} thẻ ở các bậc khác: ${ids.join(" ")}`);
    await page.evaluate((ids) => VFXLAB.startAudit(ids), ids);
    await page.waitForTimeout(2500);
    /* ▶ thẻ sau giữa chừng rồi ◀ quay lại */
    await page.click("#vlDet [data-a=next]");
    await page.waitForTimeout(400);
    const iN = await page.evaluate(() => VFXLAB.state.i);
    await page.click("#vlDet [data-a=prev]");
    ok(iN >= 1 && await page.evaluate(() => VFXLAB.state.i) === iN - 1, "▶ sang thẻ sau, ◀ về thẻ trước");
    ok(await waitDone(page, 20 * 60e3, "mẫu"), "mẫu chạy xong");
    /* nhảy tới thẻ bằng ô tìm */
    await page.click("#vlBar [data-a=menu]");
    await page.fill("#vlQ", "Song Chuỷ");
    await page.press("#vlQ", "Enter");
    await page.waitForTimeout(800);
    ok(await page.evaluate(() => VFXLAB.state.cur === "songchuynu"), "tìm + Enter: nhảy tới Song Chuỷ Nữ");
    ok(await waitDone(page, 60e3, "nhảy"), "diễn thẻ được chọn xong");
    rows = await page.evaluate(() => VFXLAB.rows());
    const sc = rows.find(r => r.id === "songchuynu");
    ok(!!sc && sc.simEffect && sc.evKinds.includes("destroy"), `Song Chuỷ Nữ: tiêu huỷ thật trong lượt (${sc && sc.evKinds.join(",")}) · hiệu ứng: ${sc && sc.fired.slice(0, 6).join(" ")}`);
    const tm = rows.find(r => r.id === "tuthanmienvien");
    if (tm) ok(tm.fired.some(k => /^PA6 /.test(k)) && tm.evKinds.includes("revive"), `Tử Thần Miền Viễn (S5): chuỗi PA6 + hồi sinh thật (${tm.fired.filter(k => !/^PA6/.test(k)).slice(0, 6).join(" ")})`);
    const bd = rows.find(r => r.id === "bachdich");
    if (bd) ok(bd.fired.some(k => /^SIG /.test(k)), `Bạch Địch: ấn ký riêng SIGK chạy (${bd.fired.filter(k => /^SIG/.test(k)).slice(0, 4).join(" ")})`);
    /* gpu68-audit2: thẻ trước đây "kỹ năng chạy nhưng không vẽ gì" / "diễn đánh trúng mà chỉ đổi chính nó" */
    const A2 = ["khoibang", "nhenthuongdang", "huyenconu", "heonhen", "khuyendichchuyen", "annu", "dahanh", "camapcan", "vuabong", "trinu", "dothan", "nuhondoc", "maynuotthoigian"];
    await page.evaluate((ids) => VFXLAB.startAudit(ids), A2);
    ok(await waitDone(page, 8 * 60e3, "audit2"), "nhóm audit2 chạy xong");
    rows = await page.evaluate(() => VFXLAB.rows());
    for (const id of A2) {
      const r = rows.find(x => x.id === id);
      const w = r ? r.warn.filter(x => /gần như không có hiệu ứng|diễn đánh trúng|mô phỏng|^(LỖI JS|SÓT DOM|thẻ bị ẩn|diễn chưa xong)/.test(x)) : ["thiếu dòng"];
      const fxs = r ? Object.entries(r.fx).filter(([k]) => k !== "CFX.drawIn").map(([k, v]) => k.replace(/^FX\./, "") + "×" + v).join(" ") : "";
      ok(!w.length, `${id}: có tác dụng + có hiệu ứng (${r && r.setup}) · ${r && r.fired.filter(k => !/drawIn|PA6 Q:/.test(k)).slice(0, 4).join(" ")} · ${fxs.slice(0, 90)} ${w.join(" | ")}`);
    }
    { const r = rows.find(x => x.id === "dahanh"); ok(r && r.taps.some(t => /^HX HX08/.test(t)), "Dạ Hành tự di chuyển: HX-08 (bản không hồn) chạy"); }
    { const r = rows.find(x => x.id === "khuyendichchuyen"); ok(r && r.evKinds.includes("lockswap"), "Khuyển Dịch Chuyển: đổi lá với bộ bài có sự kiện + diễn"); }
    /* gpu68-audit2: tiện kiểm — chữ kỹ năng luôn hiện, bảng kết luận, đánh dấu OK/Lỗi + ghi chú (lưu + xuất JSON), lọc, phím tắt */
    {
      await page.click("#vlCap").catch(() => {});
      await page.click("#vlBar [data-a=cap]");
      const capVis = await page.evaluate(() => { const c = document.getElementById("vlCap"); return !c.hidden && c.getBoundingClientRect().height > 10 && /Thế cờ|Lật|Kích|Duy|Cuối|Đầu/.test(c.textContent); });
      await page.click("#vlBar [data-a=cap]");
      ok(capVis, "chữ kỹ năng vẫn hiện sau khi chạm chú thích / bấm Aa (Aa chỉ đổi gọn ↔ đầy đủ)");
      const det = await page.evaluate(() => { const d = document.getElementById("vlDet"); return { on: d.classList.contains("on"), v: d.querySelector(".vd-v").textContent, b: d.querySelector(".vd-b").textContent }; });
      ok(det.on && /✓|⚠|✗/.test(det.v) && /Engine đổi/.test(det.b) && /Kết luận/.test(det.b), "bảng kiểm: kết luận + engine đổi + hiệu ứng (" + det.v + ")");
      await page.click("#vlDet .vd-ctl [data-a=mbad]");
      await page.click("#vlDet [data-a=note]");
      await page.fill("#vlNote", "thử ghi chú"); await page.press("#vlNote", "Tab");
      const cur = await page.evaluate(() => VFXLAB.state.cur);
      const mk = await page.evaluate(() => ({ ls: localStorage.getItem("ltd_vlab_marks"), ex: JSON.parse(VFXLAB.exportJSON()).rows.find(r => r.id === VFXLAB.state.cur) }));
      ok(/"bad"/.test(mk.ls || "") && mk.ex && mk.ex.userMark === "bad" && mk.ex.userNote === "thử ghi chú" && mk.ex.verdict, `đánh dấu Lỗi + ghi chú lưu localStorage và có trong JSON (${cur})`);
      await page.click("#vlBar [data-a=menu]");
      await page.fill("#vlQ", "");
      await page.selectOption("#vlFilt", "u:bad");
      const nF = await page.evaluate(() => document.querySelectorAll("#vlList .vl-it").length);
      await page.selectOption("#vlFilt", "*");
      await page.click("#vlBar [data-a=menu]");
      ok(nF === 1, "lọc 'Bạn đánh: Lỗi' còn đúng 1 thẻ (" + nF + ")");
      await page.evaluate(() => VFXLAB.setMark(VFXLAB.state.cur, null));
      const before = await page.evaluate(() => VFXLAB.state.cur);
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(800);
      ok(await page.evaluate((b) => VFXLAB.state.cur !== b, before), "phím → sang thẻ kế");
      ok(await waitDone(page, 60e3, "phím"), "diễn thẻ kế xong");
      rows = await page.evaluate(() => VFXLAB.rows());
      /* gpu68-lab3: dễ thao tác — thẻ mục nhớ được, nút ⚠→, điều kiện + "đã đáp ứng", bàn chơi không bị che */
      await page.click("#vlDet [data-tab=en]");
      const tabOk = await page.evaluate(() => localStorage.getItem("ltd_vlab_tab") === "en" && !document.querySelector("#vlDet .vd-p[data-p=en]").hidden && document.querySelector("#vlDet .vd-p[data-p=sk]").hidden);
      ok(tabOk, "thẻ mục Engine đổi mở + nhớ lựa chọn");
      await page.click("#vlDet [data-tab=sk]");
      const cap = await page.evaluate(() => document.getElementById("vlCap").innerText);
      ok(/Điều kiện \(/.test(cap) && /đã đáp ứng ✓|không dựng được giữa ván/.test(cap) && /Thế cờ:/.test(cap), "chú thích có Điều kiện → đã đáp ứng ✓ + Thế cờ: " + cap.replace(/\s+/g, " ").slice(0, 120));
      ok(await page.evaluate(() => document.querySelectorAll("#vlCap .kw-t, #vlCap .kw-c, #vlCap .kw-n").length > 0), "chữ kỹ năng có tô từ khoá");
      const lay = await page.evaluate(() => { const b = document.getElementById("board").getBoundingClientRect(), h = document.getElementById("hand").getBoundingClientRect(), t = document.getElementById("vlBar").getBoundingClientRect(), d = document.getElementById("vlDet").getBoundingClientRect(); return { bt: Math.round(b.top), tb: Math.round(t.bottom), hb: Math.round(h.bottom), dt: Math.round(d.top), btn: Math.round(document.querySelector("#vlDet .vd-ctl button").getBoundingClientRect().height) }; });
      ok(lay.bt >= lay.tb - 2 && lay.hb <= lay.dt + 2 && lay.btn >= 40, `bàn + tay không bị thanh trên/dưới che (bàn ${lay.bt} ≥ ${lay.tb}, tay ${lay.hb} ≤ ${lay.dt}; nút ${lay.btn}px)`);
      /* gộp gpu69: đánh Lỗi một thẻ TRONG danh sách đang chạy (trước đây dựa vào cảnh báo giả của Trí Nữ/Đồ Thần trong nhóm audit2) */
      const mkB = await page.evaluate(() => { const L = VFXLAB.state.list, id = L.find((x) => x !== VFXLAB.state.cur) || "aiquoc"; VFXLAB.setMark(id, "bad"); return id; });
      await page.click("#vlDet [data-a=nextbad]");
      await page.waitForTimeout(600);
      ok(await page.evaluate(() => { const c = VFXLAB.state.cur, r = VFXLAB.rows().find((x) => x.id === c), m = VFXLAB.marks()[c]; return (r && r.verdict !== "ok") || (m && m.m === "bad"); }), "⚠→ nhảy tới thẻ ⚠/✗/bạn đánh Lỗi kế tiếp");
      await page.evaluate((id) => VFXLAB.setMark(id, null), mkB);
      ok(await waitDone(page, 60e3, "nextbad"), "diễn thẻ ⚠→ xong");
      rows = await page.evaluate(() => VFXLAB.rows());
    }
    /* xuất JSON */
    const j = JSON.parse(await page.evaluate(() => VFXLAB.exportJSON()));
    ok(j.rows.length === rows.length && j.rows[0].id, `xuất JSON: ${j.rows.length} dòng`);
    v = await inView(page);
    ok(!v.out.length, "bảng (mở) vẫn vừa màn hình " + v.out.join("; "));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "lab_log_390.png"), type: "jpeg", quality: 55 });
    const s = summarize(rows);
    console.log(`tóm tắt: ${s.n} thẻ, ${s.bad} lỗi, ${s.warn} cảnh báo · ${JSON.stringify(s.cat)}`);
    const hard = rows.filter(r => r.warn.some(w => /^(LỖI JS|SÓT DOM|thẻ bị ẩn|luật ẩn|diễn chưa xong)/.test(w)));
    for (const r of hard) console.log("  !!", r.id, r.h, r.warn.join(" | ").slice(0, 200));
    ok(!hard.length, `không thẻ nào gây lỗi JS / sót DOM / thẻ bị ẩn (${hard.length})`);
    for (const r of rows.filter(r => r.warn.length && !hard.includes(r)).slice(0, 12)) console.log("  cảnh báo", r.id, r.h, "|", r.warn.join(" | ").slice(0, 160));
    /* đóng bảng: trả lại sảnh, gỡ móc */
    await page.click("#vlBar [data-a=close]");
    await page.waitForTimeout(1500);
    ok(await page.evaluate(() => !document.querySelector("#vlBar.on") && document.getElementById("lobby").classList.contains("on") && LT.aiWantsRetreat.toString().indexOf("=> false") < 0), "✕ đóng: về sảnh, gỡ móc engine");
  }
  ok(!errors.length, "không lỗi trang " + errors.slice(0, 5).join(" || "));
  await ctx.close();

  if (!FULL) {
    /* ===== máy tính 1280×800: mở + diễn 1 thẻ ===== */
    console.log("\n== 1280×800");
    const D = await openPage({ width: 1280, height: 800 }, false);
    v = await inView(D.page);
    ok(!v.out.length, "bảng vừa màn hình 1280×800 " + v.out.join("; "));
    await D.page.evaluate(() => VFXLAB.jump("aiquoc"));
    ok(await waitDone(D.page, 90e3, "pc"), "diễn Ái Quốc xong");
    const r = await D.page.evaluate(() => VFXLAB.rows()[0]);
    ok(r && !r.bad, `Ái Quốc: ${r && r.setup} · ${r && r.fired.slice(0, 5).join(" ")} ${r && r.warn.join("|")}`);
    if (SHOTS) await D.page.screenshot({ path: path.join(SHOTS, "lab_pc.png"), type: "jpeg", quality: 50 });
    ok(!D.errors.length, "không lỗi trang (PC) " + D.errors.slice(0, 3).join(" || "));
    await D.ctx.close();
  }
} catch (e) {
  console.error(e); failed = true;
} finally {
  await browser.close(); server.close();
}
console.log(failed ? "\nKẾT QUẢ: LỖI" : "\nKẾT QUẢ: ĐẠT");
process.exit(failed ? 1 : 0);
