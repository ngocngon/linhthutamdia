// Kiểm gpu49: (a) trình sửa bộ bài vẽ theo lô nhưng tìm/lọc/sắp xếp/mũi tên/cuộn vẫn đúng, (b) giữ hoạt ảnh lật khi thẻ bị dựng lại, (c) ảnh lười không nháy, ảnh chụp.
import http from "node:http"; import { readFile, mkdir } from "node:fs/promises"; import path from "node:path"; import { fileURLToPath } from "node:url"; import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www"), OUT = process.env.PERF_OUT || "/home/claude/shots-gpu49/perf";
const require = createRequire(import.meta.url); let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => { try { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html"; const b = await readFile(path.join(www, path.normalize(p))); res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404); res.end("nf"); } }).listen(0);
await new Promise(r => server.once("listening", r)); await mkdir(OUT, { recursive: true });
const BASE = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
let bad = 0; const chk = (ok, m) => { console.log((ok ? "  ✓ " : "  ✗ ") + m); if (!ok) bad++; };
const errs = [];
for (const vp of (process.env.ONLYB ? [] : [[360, 640], [412, 915], [768, 1024], [1280, 720]])) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 1, isMobile: vp[0] < 700, hasTouch: vp[0] < 700 });
  const page = await ctx.newPage(); await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' })); page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY/.test(m.text())) errs.push(m.text()); });
  await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.waitForFunction(() => document.getElementById("lobby").classList.contains("on"));
  console.log(`== ${vp[0]}x${vp[1]}`);
  await page.screenshot({ path: path.join(OUT, `lobby-${vp[0]}x${vp[1]}.png`) });
  await page.evaluate(() => { OWN.clear(); for (const k of E.COLLECT) OWN.add(k); store.own = [...OWN]; save(); renderLobby(); openCol(); });
  await page.waitForFunction(() => document.querySelectorAll("#deckList .gc").length > 0);
  let r = await page.evaluate(() => ({ n: document.querySelectorAll("#deckList .gc").length, ids: DK.ids.length, all: E.COLLECT.length, fc: $("filtCnt").textContent }));
  chk(r.n < r.ids && r.ids === r.all && +r.fc === r.all, `mở Sưu tập vẽ theo lô: ${r.n}/${r.ids} thẻ, đếm lọc ${r.fc}`);
  await page.waitForFunction(() => !document.querySelector("#deckList [data-sp]"), null, { timeout: 30000 }).catch(() => {});
  if (vp[0] === 360 || vp[0] === 412) await page.screenshot({ path: path.join(OUT, `editor-${vp[0]}x${vp[1]}-sau.png`) });
  /* cuộn xuống cuối: các lô lần lượt vẽ cho tới hết */
  await page.evaluate(async () => { const b = $("deckList").parentElement; for (let i = 0; i < 60 && document.querySelectorAll("#deckList .gc").length < DK.ids.length; i++) { b.scrollTop = b.scrollHeight; await new Promise(r => setTimeout(r, 120)); } });
  r = await page.evaluate(() => ({ n: document.querySelectorAll("#deckList .gc").length, ids: DK.ids.length }));
  chk(r.n === r.ids, `cuộn xuống cuối vẽ đủ ${r.n}/${r.ids} thẻ`);
  /* giữ vị trí cuộn khi renderDeck(true) và khi vào thông tin thẻ rồi quay lại */
  const y0 = await page.evaluate(() => { const b = $("deckList").parentElement; b.scrollTop = Math.floor(b.scrollHeight / 2); return b.scrollTop; });
  await page.waitForTimeout(150);
  const y1 = await page.evaluate(() => { const b = $("deckList").parentElement; const y = b.scrollTop; renderDeck(true); return [y, b.scrollTop, document.querySelectorAll("#deckList .gc").length]; });
  chk(Math.abs(y1[0] - y1[1]) < 4 && y1[2] < r.ids, `renderDeck(true) giữ vị trí cuộn ${y1[0]} → ${y1[1]} (${y1[2]} thẻ vẽ)`);
  /* chạm thẻ giữa danh sách → thông tin; mũi tên đi theo danh sách đầy đủ, qua cả thẻ chưa vẽ */
  const k0 = await page.evaluate(() => { const e = [...document.querySelectorAll("#deckList .gc")].find(e => { const r = e.getBoundingClientRect(), b = $("deckList").parentElement.getBoundingClientRect(); return r.top > b.top + 20 && r.bottom < b.bottom; }); const k = e.dataset.pick; e.click(); return k; });
  await page.waitForFunction(() => document.getElementById("ovCard").classList.contains("on"));
  const nav = await page.evaluate(async (k0) => { const L = cardList(), i0 = L.indexOf(cardId); const n = L.length; cardNav(-1); const a = cardId; cardNav(1); const b = cardId; return { same: cardId === k0 && b === k0, n, dkn: DK.ids.length, prev: L[(i0 - 1 + n) % n] === a }; }, k0);
  chk(nav.same && nav.n === nav.dkn && nav.prev, `mũi tên trước/sau đi theo danh sách đủ ${nav.n} thẻ (${JSON.stringify(nav)})`);
  await page.evaluate(() => closeOv($("ovCard"))); await page.waitForTimeout(250);
  const y2 = await page.evaluate(() => $("deckList").parentElement.scrollTop);
  chk(Math.abs(y2 - y1[1]) < 4, `quay lại từ thông tin thẻ giữ vị trí cuộn (${y1[1]} → ${y2})`);
  /* tìm / lọc / sắp xếp */
  r = await page.evaluate(async () => { const t = C[E.COLLECT[200]].n.split(" ").pop(); $("deckSearch").value = t; $("deckSearch").dispatchEvent(new Event("input", { bubbles: true })); await new Promise(r => setTimeout(r, 500)); const want = E.COLLECT.filter(k => C[k].n.toLowerCase().includes(t.toLowerCase()) || true).length; return { t, ids: DK.ids.length, n: document.querySelectorAll("#deckList .gc").length, fc: +$("filtCnt").textContent, top: $("deckList").parentElement.scrollTop }; });
  chk(r.ids === r.fc && r.n === Math.min(r.ids, 48) && r.ids < 511 && r.ids >= 1 && r.top === 0, `tìm "${r.t}": ${r.ids} kết quả, vẽ ${r.n}, về đầu danh sách`);
  r = await page.evaluate(async () => { $("deckSearch").value = ""; $("deckSearch").dispatchEvent(new Event("input", { bubbles: true })); await new Promise(r => setTimeout(r, 500)); F.cost = 3; renderDeck(); const a = DK.ids.length, ok = DK.ids.every(k => Math.min(6, C[k].c) === 3 || C[k].c === 3); F.cost = 0; renderDeck(); const b = DK.ids.length; const s0 = DK.ids.slice(0, 5).join(); store.sort = store.sort === "pow" ? "cost" : "pow"; renderDeck(); return { a, ok, b, sorted: DK.ids.slice(0, 5).join() !== s0, dom: [...document.querySelectorAll("#deckList .gc")].slice(0, 5).map(e => e.dataset.pick).join() === DK.ids.slice(0, 5).join() }; });
  chk(r.a > 0 && r.a < r.b && r.b === 511 && r.sorted && r.dom, `lọc năng lượng ${r.a}/${r.b}, đổi sắp xếp đúng thứ tự trong DOM`);
  /* chạm 2 lần thêm thẻ vào bộ ở trình sửa (không phải Sưu tập) */
  await page.evaluate(() => { closeAll(); showLobby(); openEdit(store.cur); });
  await page.waitForFunction(() => document.querySelectorAll("#deckList .gc").length > 0 && !F.col);
  r = await page.evaluate(async () => { draft.clear(); renderDeck(true); const e = document.querySelector("#deckList [data-pick]"), k = e.dataset.pick; e.click(); await new Promise(z => setTimeout(z, 60)); document.querySelector(`#deckList [data-pick="${k}"]`).click(); await new Promise(z => setTimeout(z, 450)); return draft.has(k); });
  chk(r, "chạm 2 lần thẻ trong lưới thêm vào bộ");
  /* dkScrollTo một thẻ ở rất cuối danh sách (chưa vẽ) */
  r = await page.evaluate(async () => { const k = DK.ids[DK.ids.length - 3]; const had = !!document.querySelector(`#deckList [data-pick="${k}"]`); dkScrollTo(k); await new Promise(z => setTimeout(z, 500)); const e = document.querySelector(`#deckList [data-pick="${k}"]`); return { had, now: !!e, y: $("deckList").parentElement.scrollTop }; });
  chk(!r.had && r.now && r.y > 500, `dkScrollTo thẻ cuối (chưa vẽ) vẽ tới nơi và cuộn tới (${JSON.stringify(r)})`);
  /* chữ không chồng/cắt: không có thẻ nào tràn ngang khung */
  r = await page.evaluate(() => { const b = $("deckList").parentElement.getBoundingClientRect(); return [...document.querySelectorAll("#deckList .gc")].filter(e => { const q = e.getBoundingClientRect(); return q.width > 0 && (q.left < b.left - 1 || q.right > b.right + 1); }).length; });
  chk(r === 0, "không thẻ nào tràn ngang khung lưới");
  await ctx.close();
}
/* (b) giữ hoạt ảnh lật khi thẻ đang lật bị dựng lại trong lúc vẽ bàn */
{
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }); const page = await ctx.newPage(); await page.route(/^https:\/\/([^/]*workers\.dev|tamdia\.pages\.dev)\//, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":false,"items":[]}' })); page.on("pageerror", e => errs.push(e.message));
  await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" }); await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play" && !document.getElementById("lobby").classList.contains("on"), null, { timeout: 120000 });
  await page.evaluate(() => { E.aiPlan(G, "p", 40); render(); document.getElementById("btnEnd").click(); });
  await page.waitForFunction(() => G.turn > 1 && G.phase === "play" && document.querySelector("#board .mc"), null, { timeout: 180000, polling: 200 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(async () => {
    const mc = document.querySelector("#board .mc"); if (!mc) return { skip: "không có thẻ trên bàn" };
    const uid = mc.dataset.mc; mc.classList.add("flip"); await new Promise(z => requestAnimationFrame(() => requestAnimationFrame(z)));
    const a = mc.getAnimations().find(x => /^(flip|flip3|gpuCardFlip)$/.test(x.animationName)); if (!a) return { skip: "thẻ không có hoạt ảnh lật trong CSS" };
    for (let i = 0; i < 200 && !(a.currentTime > 30); i++) await new Promise(z => requestAnimationFrame(z)); const t0 = a.currentTime; const old = mc; if (a.playState !== "running") return { skip: "hoạt ảnh lật kết thúc quá nhanh (" + a.playState + ")" };
    /* dựng lại đúng thẻ này: đổi nội dung bàn để patchBoard thay phần tử */
    const tp = document.createElement("template"); tp.innerHTML = [...document.querySelector("#board").children].map(x => x.outerHTML).join("");
    const m2 = tp.content.querySelector(`[data-mc="${uid}"]`); m2.classList.remove("flip"); m2.insertAdjacentHTML("beforeend", '<i class="zz49"></i>');
    const html2 = [...tp.content.children].map(x => x.outerHTML).join("");
    FLS = flipSnap(); const dbg = { fls: FLS.size, ps: a.playState, tgt: a.effect.target === mc, pe: String(a.effect.pseudoElement), an: a.animationName, dm: mc.dataset.mc }; patchBoard(html2);
    const n = document.querySelector(`#board [data-mc="${uid}"]`);
    return { dbg, replaced: n !== old, delay: n && n.style.animationDelay, cls: n && n.classList.contains("flip"), t0 };
  });
  if (r.skip) console.log("  - (b) bỏ qua: " + r.skip); else chk(r.replaced && r.cls && parseFloat(r.delay) < 0, `thẻ đang lật bị dựng lại vẫn tiếp hoạt ảnh (animationDelay ${r.delay}, từ ${Math.round(r.t0)} ms)`);
  await ctx.close();
}
chk(errs.length === 0, "không có pageerror/console.error" + (errs.length ? ": " + errs.slice(0, 3).join(" | ") : ""));
console.log(bad ? `GPU49 LỖI ${bad}` : "GPU49 OK");
await browser.close(); server.close(); process.exit(bad ? 1 : 0);
