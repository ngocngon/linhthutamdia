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
    await page.click("#vlBar [data-a=pause]");
    ok(await page.evaluate(() => VFXLAB.state.paused), "⏸ tạm dừng");
    await page.waitForTimeout(600);
    await page.click("#vlBar [data-a=pause]");
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
    await page.click("#vlBar [data-a=next]");
    await page.waitForTimeout(400);
    const iN = await page.evaluate(() => VFXLAB.state.i);
    await page.click("#vlBar [data-a=prev]");
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
