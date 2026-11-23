// Duyệt các màn meta và bấm thử mọi nút (Playwright + Chrome), bắt pageerror/console.error/404.
// Chạy: CHROME_PATH=/usr/bin/google-chrome node tests/ui-meta.mjs   (META_VP=360x640 để đổi khung)
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const OUT = process.env.META_OUT || "/tmp/ltd-meta";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".woff2": "font/woff2", ".ttf": "font/ttf" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p));
    if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
await mkdir(OUT, { recursive: true });
const [W, H] = (process.env.META_VP || "412x915").split("x").map(Number);
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errs = []; let cur = "";
page.on("pageerror", e => errs.push(`[${cur}] pageerror: ${e.message} @${(e.stack || "").split("\n").slice(1, 3).join(" | ")}`));
page.on("console", m => { if (m.type() === "error") errs.push(`[${cur}] console.error: ${m.text()}`); });
page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(BASE)) errs.push(`[${cur}] http ${r.status()}: ${r.url()}`); });
page.on("dialog", d => d.dismiss().catch(() => {}));
page.on("popup", p => p.close().catch(() => {}));
await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
await page.waitForTimeout(1500);
await page.evaluate(() => { store.gold = 999999; store.tok = 99999; store.up = 99999; store.evp = 99999; store.gems = 9999; save(); renderLobby(); });

const SKIP = /Xoá|Xóa|Đặt lại|Đăng xuất|Huỷ liên kết|Hủy liên kết|Bỏ hành trình|Bỏ lượt tuyển|Bỏ tầng|Bỏ$|Nạp|Tải lại|Làm mới ảnh/i;
/* bấm lần lượt các nút trong bảng phủ đang mở (chỉ mục i), trả về số nút & nhãn đã bấm */
async function monkeyF(label, open, max = 45) {
  cur = label; const clicked = [];
  await page.evaluate(() => { closeAll(); });
  await open(); await page.waitForTimeout(500);
  const root = await page.evaluate(() => { const o = [...document.querySelectorAll(".ov.on")].pop(); return o ? o.id : ""; });
  if (!root) { errs.push(`[${label}] không mở được màn`); return; }
  await page.screenshot({ path: path.join(OUT, `${label}.png`) }).catch(() => {});
  for (let i = 0; i < max; i++) {
    const r = await page.evaluate(([root, i, skip]) => {
      const ov = document.getElementById(root); if (!ov || !ov.classList.contains("on")) return { gone: 1 };
      const vis = e => e.offsetParent !== null && !e.disabled && e.getAttribute("aria-disabled") !== "true";
      const els = [...ov.querySelectorAll("button, [role=button], [data-tab], .tab, input[type=checkbox], input[type=range], select")].filter(vis);
      const e = els[i]; if (!e) return { done: 1, n: els.length };
      const t = (e.textContent || e.getAttribute("aria-label") || e.id || e.className || "").trim().replace(/\s+/g, " ").slice(0, 40);
      if (new RegExp(skip).test(t) || e.hasAttribute("data-close") || /close|opx|shp-x|\bx\b/.test(String(e.className))) return { skip: t };
      if (e.tagName === "INPUT" && e.type === "range") { e.value = String((+e.min || 0) + 1); e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); }
      else if (e.tagName === "SELECT") { if (e.options.length > 1) { e.selectedIndex = (e.selectedIndex + 1) % e.options.length; e.dispatchEvent(new Event("change", { bubbles: true })); } }
      else e.click();
      return { t };
    }, [root, i, SKIP.source]);
    if (r.gone || r.done) { if (r.gone) { /* nút đã đóng/chuyển màn: mở lại để bấm tiếp */ await page.evaluate(() => closeAll()); await open(); await page.waitForTimeout(300); } else break; }
    if (r.t) clicked.push(r.t);
    if (process.env.META_TRACE) console.log("   bấm", i, r.t || r.skip || "", JSON.stringify(await page.evaluate(() => ({ heap: (performance.memory.usedJSHeapSize / 1048576) | 0, nodes: document.getElementsByTagName("*").length })).catch(e => String(e).slice(0, 80))));
    await page.waitForTimeout(220);
    /* đóng các bảng phủ con mở chồng lên (trừ bảng gốc) */
    await page.evaluate(root => { for (const o of document.querySelectorAll(".ov.on")) if (o.id !== root) o.classList.remove("on"); const m = document.getElementById("mm"); if (m) m.classList.remove("on"); if (typeof G !== "undefined" && G && G.phase === "play" && !document.getElementById("lobby").classList.contains("on") && root !== "ovPiles" && root !== "ovSet" && root !== "ovHelp") { showLobby(); } }, root);
  }
  console.log(`• ${label} (${root}): bấm ${clicked.length} nút — ${clicked.slice(0, 14).join(" | ")}${clicked.length > 14 ? " …" : ""}`);
}
let monkey = monkeyF; const ev = f => () => page.evaluate(f);
const ONLY = process.env.META_ONLY ? new RegExp(process.env.META_ONLY) : null;
const monkey0 = monkeyF; monkey = async (l, o, m) => { if (!ONLY || ONLY.test(l)) return monkey0(l, o, m); };
await monkey("cua-hang", ev(() => document.querySelector('[data-nav="shop"]').click()), 60);
for (const t of [1, 2]) await monkey("cua-hang-tab" + t, ev(t => { document.querySelector('[data-nav="shop"]').click(); const tabs = document.querySelectorAll("#shopTabs button, #shopTabs [data-tab]"); if (tabs[t]) tabs[t].click(); }), 60);
await monkey("suu-tap", ev(() => document.querySelector('[data-nav="col"]').click()), 30);
await monkey("chi-tiet-the", ev(() => { openCard(store.deck[0]); }), 40);
await monkey("bo-bai", ev(() => document.getElementById("lbDeck").click()), 30);
await monkey("the-thang", ev(() => document.getElementById("lbPass").click()), 30);
await monkey("nhiem-vu", ev(() => document.getElementById("lbMisBtn").click()), 30);
await monkey("xep-hang", ev(() => document.querySelector('[data-nav="rank"]').click()), 30);
await monkey("ho-so", ev(() => document.getElementById("lbProfile").click()), 30);
await monkey("cai-dat", ev(() => document.getElementById("lbMute").click()), 40);
await monkey("luat-choi", ev(() => document.getElementById("lbHelp").click()), 20);
await monkey("che-do", ev(() => document.querySelector('[data-nav="modes"]').click()), 4);
await monkey("san-dau", ev(() => document.getElementById("lbArena").click()), 20);
await monkey("mo-goi", ev(() => { openPreview("S1"); }), 6);
/* mở gói (mua bằng token, xem hoạt cảnh lật) + nâng cấp thẻ */
cur = "mo-goi-mua";
await page.evaluate(() => { OWN.clear(); for (const k of store.deck) OWN.add(k); store.own = [...OWN]; store.tok = 99999; for (const k of store.deck) if (store.cards[k]) store.cards[k].l = 0; save(); });
for (const x of ["S1", "CB", "S5"]) {
  const r = await page.evaluate(x => { closeAll(); openPreview(x); const b = document.querySelector('#openBody [data-op="buy"]'); if (!b || b.disabled) return "không có nút mua"; b.click(); return "đã mua"; }, x);
  await page.waitForTimeout(2600); await page.screenshot({ path: path.join(OUT, `mo-goi-${x}.png`) }).catch(() => {});
  const shown = await page.evaluate(() => { const o = document.getElementById("ovOpen"); const t = o && o.classList.contains("on") ? o.innerText.replace(/\s+/g, " ").slice(0, 60) : "(đã đóng)"; const x = document.querySelector('#openBody [data-op="x"]'); if (x) x.click(); return t; });
  console.log(`• mở gói ${x}: ${r} → ${shown}`);
}
cur = "nang-cap";
const up = await page.evaluate(() => { closeAll(); const k = store.deck[1]; const l0 = (store.cards[k] || {}).l | 0; openCard(k); const b = document.getElementById("btnUp"); if (!b || b.disabled) return "nút nâng cấp không bấm được (cấp " + l0 + ")"; b.click(); return "cấp " + l0 + " → " + ((store.cards[k] || {}).l | 0); });
await page.waitForTimeout(1500); console.log("• nâng cấp thẻ: " + up); await page.evaluate(() => closeAll());
await monkey("the-tu-sanh", ev(() => { document.getElementById("lbShow").click(); }), 40);
/* trong trận: mộ bài, cài đặt, luật */
cur = "vao-tran"; await page.evaluate(() => { closeAll(); document.getElementById("lbPlay").click(); });
await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !document.getElementById("lobby").classList.contains("on"), null, { timeout: 120000 });
await page.waitForTimeout(2500);
await monkey("mo-bai", ev(() => document.getElementById("btnPiles").click()), 12);
await monkey("cai-dat-tran", ev(() => document.getElementById("btnMute").click()), 40);
await monkey("luat-tran", ev(() => document.getElementById("btnHelp").click()), 10);
await page.evaluate(() => { closeAll(); });
await page.screenshot({ path: path.join(OUT, "cuoi.png") }).catch(() => {});
await browser.close(); server.close();
const u = [...new Set(errs)];
if (u.length) console.log("LỖI:\n" + u.slice(0, 60).join("\n"));
console.log(u.length ? "META CÓ LỖI" : "META OK");
process.exit(u.length ? 1 : 0);
