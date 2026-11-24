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
/* gpu43: xem thông tin thẻ trong Bộ bài + lối tắt giữa các màn + nút Back + màn chờ ghép trận */
if (!ONLY || ONLY.test("lien-ket")) {
  cur = "lien-ket";
  const W8 = ms => page.waitForTimeout(ms), ovs = () => page.evaluate(() => [...document.querySelectorAll(".ov.on")].map(o => o.id).join(","));
  const chk = (ok, msg) => { if (!ok) errs.push(`[lien-ket] ${msg}`); else console.log("  ✓ " + msg); };
  await page.evaluate(() => { closeAll(); showLobby(); OWN.clear(); for (const k of E.COLLECT) OWN.add(k); store.own = [...OWN]; store.decks = [store.decks[store.cur]]; store.cur = 0; store.deck = store.decks[0].ids; save(); });
  /* danh sách bộ bài: chạm thẻ trong khay */
  await page.evaluate(() => { document.getElementById("lbDeck").click(); });await W8(300);
  await page.evaluate(() => { const d = document.getElementById("vfxLabDrawer"); if (d) d.classList.remove("on"); document.querySelector("#dkSelTray [data-dsel]").click(); }); await W8(500);
  let r = await page.evaluate(() => ({ ov: [...document.querySelectorAll(".ov.on")].map(o => o.id).join(","), src: cardCtx.src, n: cardList().length, go: $("cardGo").innerText }));
  chk(r.ov === "ovDecks,ovCard" && r.src === "decks" && r.n === 12, `chạm thẻ ở danh sách bộ bài mở #ovCard, chuyển thẻ theo 12 thẻ của bộ (${r.ov} ${r.src} ${r.n})`);
  await page.evaluate(() => document.querySelector('#cardGo [data-cg="edit"]').click()); await W8(400);
  chk(await ovs() === "ovDeck" && await page.evaluate(() => !F.col), "lối tắt ✎ Sửa bộ này mở trình sửa bộ");
  /* trình sửa: chạm 1 lần = thông tin, danh sách theo lưới */
  await page.evaluate(() => { const k = [...draft][0]; draft.delete(k); renderDeck(true); }); await W8(200);
  await page.evaluate(() => document.querySelectorAll("#deckList [data-pick]")[1].click()); await W8(600);
  r = await page.evaluate(() => { const L = DK.ids.slice(), nDom = document.querySelectorAll("#deckList [data-pick]").length; const k0 = cardId; cardNav(1); return { ov: [...document.querySelectorAll(".ov.on")].map(o => o.id).join(","), same: cardList().length === L.length && nDom <= L.length && nDom >= 1 && L.slice(0, nDom).every((k, i) => document.querySelectorAll("#deckList [data-pick]")[i].dataset.pick === k), i0: L.indexOf(k0), i1: L.indexOf(cardId) }; });
  chk(r.ov === "ovDeck,ovCard" && r.same && r.i0 === 1 && r.i1 === 2, `chạm thẻ trong lưới trình sửa mở #ovCard; mũi tên sau đi đúng thẻ kế trong lưới (${JSON.stringify(r)})`);
  r = await page.evaluate(() => { const k = cardId, had = draft.has(k), b = document.querySelector("#cardGo [data-cg]"); const a = b && b.dataset.cg; if (b) b.click(); return { a, had, now: draft.has(k), n: draft.size }; });
  chk((r.a === "add" && !r.had && r.now) || (r.a === "rm" && r.had && !r.now), `nút ${r.a} trong #ovCard thêm/bỏ thẻ (${JSON.stringify(r)})`);
  /* khay: chạm = thông tin; chạm 2 lần = bỏ */
  await page.evaluate(() => closeOv($("ovCard"))); await W8(200);
  await page.evaluate(() => document.querySelector("#deckTray [data-tray]").click()); await W8(500);
  r = await page.evaluate(() => ({ ov: [...document.querySelectorAll(".ov.on")].map(o => o.id).join(","), src: cardCtx.src, n: cardList().length, d: draft.size }));
  chk(r.ov === "ovDeck,ovCard" && r.src === "tray" && r.n === r.d, `chạm thẻ trong khay mở #ovCard theo danh sách khay (${JSON.stringify(r)})`);
  await page.evaluate(() => closeOv($("ovCard"))); await W8(150);
  r = await page.evaluate(async () => { const e = document.querySelector("#deckTray [data-tray]"), k = e.dataset.tray, n0 = draft.size; e.click(); await new Promise(z => setTimeout(z, 60)); document.querySelector(`#deckTray [data-tray="${k}"]`).click(); await new Promise(z => setTimeout(z, 400)); return { gone: !draft.has(k), n0, n1: draft.size }; });
  chk(r.gone && r.n1 === r.n0 - 1, "chạm 2 lần thẻ trong khay bỏ khỏi bộ");
  r = await page.evaluate(async () => { const k = E.COLLECT.find(x => !draft.has(x) && document.querySelector(`#deckList [data-pick="${x}"]`)); const q = () => document.querySelector(`#deckList [data-pick="${k}"]`); q().click(); await new Promise(z => setTimeout(z, 60)); q().click(); await new Promise(z => setTimeout(z, 400)); return draft.has(k); });
  chk(r, "chạm 2 lần thẻ trong lưới thêm vào bộ");
  /* bộ đủ 12: đổi thẻ */
  await page.evaluate(() => { for (const k of E.COLLECT) { if (draft.size >= 12) break; draft.add(k); } renderDeck(true); });
  r = await page.evaluate(async () => { const k = E.COLLECT.find(x => !draft.has(x) && document.querySelector(`#deckList [data-pick="${x}"]`)); openCard(k, { list: [k], src: "edit" }); document.querySelector('#cardGo [data-cg="swap"]').click(); await new Promise(z => setTimeout(z, 200)); const t = document.querySelector("#deckTray [data-tray]"), tk = t.dataset.tray; const banner = !$("dkSwap").hidden; t.click(); await new Promise(z => setTimeout(z, 200)); return { banner, ok: draft.has(k) && !draft.has(tk) && draft.size === 12 }; });
  chk(r.banner && r.ok, "bộ đủ 12: Đổi với thẻ trong bộ → chạm thẻ khay để thay");
  /* lưu → quay lại danh sách bộ bài, có nút Chơi */
  await page.evaluate(() => document.getElementById("btnSaveDeck").click()); await W8(400);
  chk(await ovs() === "ovDecks" && await page.evaluate(() => !$("btnDkPlay").disabled), "Lưu bộ bài quay về danh sách bộ bài (nút Chơi sẵn sàng)");
  /* Sưu tập → thông tin → Thêm vào bộ đang dùng → đóng: về Sưu tập, giữ bộ lọc + vị trí cuộn */
  await page.evaluate(() => { closeAll(); openCol(); F.cost = 2; renderDeck(); $("deckList").parentElement.scrollTop = 300; }); await W8(300);
  const st0 = await page.evaluate(() => ({ he: F.cost, y: $("deckList").parentElement.scrollTop }));
  await page.evaluate(() => { const k = [...document.querySelectorAll("#deckList [data-pick]")].map(e => e.dataset.pick).find(x => !store.deck.includes(x)); document.querySelector(`#deckList [data-pick="${k}"]`).click(); }); await W8(500);
  r = await page.evaluate(() => { const b = document.querySelector('#cardGo [data-cg="go"]'); if (!b) return { no: 1, go: $("cardGo").innerText }; b.click(); return { ov: [...document.querySelectorAll(".ov.on")].map(o => o.id).join(","), col: F.col, swap: !!swapK }; });
  chk(r.ov === "ovDeck" && r.col === false && r.swap, `Sưu tập: + Thêm vào bộ đang dùng mở trình sửa bộ ở chế độ đổi thẻ (${JSON.stringify(r)})`);
  await page.evaluate(() => document.querySelector("#ovDeck .foot [data-close]").click()); await W8(400);
  r = await page.evaluate(() => ({ ov: [...document.querySelectorAll(".ov.on")].map(o => o.id).join(","), col: F.col, he: F.cost, y: $("deckList").parentElement.scrollTop }));
  chk(r.ov === "ovDeck" && r.col && r.he === st0.he && st0.y > 100 && Math.abs(r.y - st0.y) < 4, `đóng trình sửa quay về Sưu tập, giữ bộ lọc + vị trí cuộn (${JSON.stringify(r)} vs ${JSON.stringify(st0)})`);
  /* nút Back: đóng bảng phủ trên cùng */
  await page.evaluate(() => document.querySelector("#deckList [data-pick]").click()); await W8(500);
  await page.goBack().catch(() => {}); await W8(500);
  chk(await ovs() === "ovDeck", "nút Back đóng #ovCard trước, Sưu tập vẫn mở");
  await page.goBack().catch(() => {}); await W8(500);
  chk(await ovs() === "", "nút Back lần nữa đóng Sưu tập");
  chk(page.url().includes("index.html"), "nút Back không rời trang khi đóng bảng phủ");
  /* thiếu tài nguyên → Cửa hàng, đóng → về thông tin thẻ */
  await page.evaluate(() => { store.tok = 5; save(); const k = store.deck[0]; OWN.delete(k); openCard(k); }); await W8(400);
  await page.evaluate(() => { const b = document.querySelector('#cardGo [data-cg="res:tok"]'); if (b) b.click(); }); await W8(500);
  chk(await ovs() === "ovCard,ovShop", "thẻ chưa có + thiếu token: Lấy thêm token mở Cửa hàng");
  await page.evaluate(() => document.querySelector("#ovShop [data-close]").click()); await W8(300);
  chk(await ovs() === "ovCard", "đóng Cửa hàng quay về thông tin thẻ");
  await page.evaluate(() => { OWN.add(store.deck[0]); store.tok = 99999; save(); closeAll(); showLobby(); });
  /* sảnh: sửa nhanh */
  await page.evaluate(() => document.getElementById("lbDeckEd").click()); await W8(400);
  r = await page.evaluate(() => ({ ov: [...document.querySelectorAll(".ov.on")].map(o => o.id).join(","), idx: editIdx, cur: store.cur, col: F.col }));
  chk(r.ov === "ovDeck" && r.idx === r.cur && !r.col, "nút ✎ ở sảnh mở thẳng trình sửa bộ đang dùng");
  await page.evaluate(() => document.querySelector("#ovDeck .foot [data-close]").click()); await W8(300);
  chk(await ovs() === "", "đóng trình sửa (mở từ sảnh) về sảnh");
  /* nhiệm vụ: Chơi ngay */
  await page.evaluate(() => { store.ms.v = store.ms.v.map(() => 0); document.getElementById("lbMisBtn").click(); }); await W8(300);
  chk(await page.evaluate(() => !$("misPlay").hidden), "Nhiệm vụ có nút Chơi ngay khi còn nhiệm vụ ngày");
  await page.evaluate(() => closeAll());
  /* màn chờ ghép trận (máy) */
  r = await page.evaluate(async () => { let went = 0; mmBot(() => { went = 1; }); await new Promise(z => setTimeout(z, 200)); const s0 = { on: $("mm").classList.contains("on"), found: $("mm").classList.contains("found"), tip: $("mmTipT").textContent.length, dk: document.querySelectorAll("#mmDk .gc").length }; await new Promise(z => setTimeout(z, 1900)); const s1 = $("mm").classList.contains("found"); await new Promise(z => setTimeout(z, 1600)); return { s0, s1, off: !$("mm").classList.contains("on"), went, rm: !!reduced }; });
  chk(r.s0.dk === 4 && r.s0.tip > 10 && r.off && r.went && (r.rm || (r.s0.on && !r.s0.found && r.s1)), /* body.rm: ghép máy gần như tức thì */ `màn chờ: đang tìm (mẹo, 4 thẻ tiêu biểu) → tìm thấy → vào trận (${JSON.stringify(r)})`);
  r = await page.evaluate(async () => { mmBot(() => {}); await new Promise(z => setTimeout(z, 200)); $("mmCancel").click(); await new Promise(z => setTimeout(z, 2500)); return !$("mm").classList.contains("on"); });
  chk(r, "nút Huỷ ghép trận dừng màn chờ");
  await page.evaluate(() => { closeAll(); showLobby(); });
}
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
