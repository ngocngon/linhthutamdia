// vfx55: kiểm (1) Ô KÍCH HOẠT KỸ NĂNG khi chọn/kéo thẻ có điều kiện vị trí và (2) SÓNG PHỦ CHIẾN ĐỊA khi kỹ năng tác động cả chiến địa.
// Chạy: CHROME_PATH=/usr/bin/google-chrome node tests/vfx-dieukien.mjs   (ảnh: tests/artifacts/vfx55/, đổi bằng SHOT_OUT)
//  (a) tĩnh: tools/vfx_dieu_kien.json khớp khối VKD trong 13-fxr.js; mọi id có thật; FXR.oKichHoat là hàm thuần (không đổi G)
//  (b) chọn Âu Cơ (chỉ chiến địa giữa) -> chỉ chiến địa giữa được tô (data-vk="on" + ô kế tiếp data-vks), hai chiến địa kia mờ (off)
//  (c) KÉO Thuồng Luồng (+5 nếu là thẻ duy nhất) -> chỉ chiến địa còn trống phía ta được tô trong lúc kéo; thả ra ngoài -> tắt hết
//  (d) Kiến Lửa (đầy phía ta) -> đúng chiến địa đang có 3 thẻ, ô số 4; Cung Thủ Mường đang chờ -> chọn thẻ bất kỳ tô chiến địa của nó
//  (e) thẻ không điều kiện -> không tô gì; huỷ chọn -> tắt
//  (f) Băng Đế lật thật (kết thúc lượt) -> sóng phủ chiến địa (FXR.log k:"phu") phủ đúng khung chiến địa, chụp giữa hiệu ứng;
//      Mặc Y Nương (Duy Trì phủ) trên bàn -> viền mờ thường trực data-vko
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const OUT = process.env.SHOT_OUT || path.join(here, "artifacts", "vfx55");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright-core")); } catch { try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); } }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => {
  try { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html"; const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
await mkdir(OUT, { recursive: true });
let bad = 0; const chk = (ok, m) => { console.log((ok ? "  ✓ " : "  ✗ ") + m); if (!ok) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- (a) tĩnh ----------
const J = JSON.parse(readFileSync(path.join(here, "..", "tools", "vfx_dieu_kien.json"), "utf8"));
const src13 = readFileSync(path.join(www, "js", "13-fxr.js"), "utf8");
const m = src13.match(/const VKD_DK=(\[.*?\]),VKD_CHO=(\[.*?\]),VKD_PHU=(\{.*?\});/);
chk(!!m, "13-fxr.js có khối VKD");
if (m) {
  const dk = JSON.parse(m[1]), cho = JSON.parse(m[2]), phu = JSON.parse(m[3]);
  chk(dk.join() === J.dieu_kien.map(o => o.id).join() && cho.join() === J.cho.map(o => o.id).join() && Object.keys(phu).join() === J.phu_chien_dia.map(o => o.id).join(), `VKD khớp tools/vfx_dieu_kien.json (điều kiện ${dk.length}, chờ ${cho.length}, phủ ${Object.keys(phu).length})`);
  for (const id of ["tocnuhoang", "thuyvuong", "kinhnhan", "kiengiap", "batbainu"]) chk(dk.includes(id), `danh sách điều kiện có ${id}`);
  chk(cho.includes("thantien"), "nhóm chờ có Cung Thủ Mường (thantien)");
  for (const id of ["bangvuong", "nhennu", "nguumamienvien"]) chk(id in phu, `danh sách phủ chiến địa có ${id}`);
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", x => { if (x.type() === "error" && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY|workers\.dev/.test(x.text())) errors.push("console.error: " + x.text()); });
try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 60000 });
  await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.waitForFunction(() => LVEIL !== G && G.phase === "play" && !document.querySelector(".l47"), null, { timeout: 60000, polling: 100 });
  await sleep(800);
  /* bàn cố định: 3 chiến địa trung tính, tay rỗng, nhiều năng lượng, không hết giờ */
  const setBoard = async (spec) => page.evaluate((spec) => {
    window.__tmr = window.__tmr || setInterval(() => { try { tLeft = 999; } catch (e) {} }, 400);
    sel = null; look = null; moveSel = null;
    G.q.p = []; G.q.a = []; G.energy.p = 9; G.turn = Math.max(G.turn, 3); G.hand.a = [];
    for (let i = 0; i < 3; i++) { const L = G.locs[i]; L.id = "meadow"; L.rvl = true; L.gone = false; L.cards.p = []; L.cards.a = []; L.lock = { p: 0, a: 0 }; L.flood = 0; }
    const mk = (id, s, li, x) => { const c = E.mk(G, id, s); c.side = s; c.rev = true; c.turn = 1; Object.assign(c, x || {}); G.locs[li].cards[s].push(c); return c.uid; };
    const filler = Object.keys(C).filter(k => C[k].t === "none" && !C[k].tok && C[k].c <= 4);
    const out = { b: {} };
    for (const [li, s, id, x] of spec.board || []) out.b[id + "@" + li + s] = mk(id === "_" ? filler[(li * 2 + (s === "p" ? 0 : 1)) % filler.length] : id, s, li, x === "wait" ? { wait: G.turn } : x);
    G.hand.p = (spec.hand || []).map(id => E.mk(G, id === "_" ? filler[1] : id, "p"));
    out.h = G.hand.p.map(c => c.uid);
    render();
    return out;
  }, spec);
  const lanes = () => page.evaluate(() => [...document.querySelectorAll("#board .lane[data-lane]")].map(l => ({ vk: l.dataset.vk || "", vko: l.dataset.vko || "", col: l.style.getPropertyValue("--vk"), slots: [...l.querySelectorAll(".side.me .slot")].map(s => s.hasAttribute("data-vks") ? 1 : 0).join("") })));
  const tapHand = uid => page.evaluate(u => { const el = document.querySelector(`#hand [data-hc="${u}"]`); el.dispatchEvent(new MouseEvent("click", { bubbles: true })); }, uid);
  const shot = async (n) => { await sleep(350); await page.screenshot({ path: path.join(OUT, n) }); console.log("    ảnh " + path.join(OUT, n)); };

  // ---------- (b) Âu Cơ: chỉ chiến địa giữa ----------
  let st = await setBoard({ board: [[0, "p", "_"], [0, "a", "_"], [2, "a", "_"]], hand: ["tocnuhoang", "_"] });
  const pure = await page.evaluate((u) => { const s0 = JSON.stringify(G, (k, v) => (k === "evs" || k === "msgs" ? undefined : v)); const r = FXR.oKichHoat("tocnuhoang", { G, side: "p", uid: u }); return { r, same: s0 === JSON.stringify(G, (k, v) => (k === "evs" || k === "msgs" ? undefined : v)) }; }, st.h[0]);
  chk(pure.same, "oKichHoat không đổi trạng thái G (hàm thuần)");
  chk(JSON.stringify(pure.r.map(o => [o.lane, o.slot])) === "[[1,0]]", "oKichHoat(Âu Cơ) = chiến địa giữa, ô 0: " + JSON.stringify(pure.r));
  await tapHand(st.h[0]); await sleep(200);
  let L = await lanes();
  chk(L[1].vk === "on" && L[0].vk === "off" && L[2].vk === "off", "chọn Âu Cơ: giữa sáng, hai bên mờ " + JSON.stringify(L.map(x => x.vk)));
  chk(L[1].slots === "1000" && L[0].slots === "0000", "ô kế tiếp ở chiến địa giữa được tô " + L[1].slots);
  chk(/^#/.test(L[1].col.trim()), "màu viền theo hệ thẻ " + L[1].col);
  await shot("1-au-co-chon.png");
  await tapHand(st.h[0]); await sleep(150);
  L = await lanes();
  chk(L.every(x => !x.vk && x.slots === "0000"), "bấm lại (huỷ chọn) -> tắt hết");

  // ---------- (c) Thuồng Luồng: kéo ----------
  st = await setBoard({ board: [[0, "p", "_"], [2, "p", "_"], [2, "p", "_"], [1, "a", "_"]], hand: ["thuyvuong"] });
  const hb = await page.evaluate(u => { const r = document.querySelector(`#hand [data-hc="${u}"]`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, st.h[0]);
  await page.mouse.move(hb.x, hb.y); await page.mouse.down();
  for (let k = 1; k <= 8; k++) { await page.mouse.move(hb.x + 150 * k / 8, hb.y - 130 * k / 8); await sleep(30); } /* bóng thẻ đứng ngoài chiến địa giữa để ảnh thấy rõ ô sáng */
  await sleep(250);
  L = await lanes();
  const drg = await page.evaluate(() => !!(drag && drag.on) && document.body.classList.contains("dragging"));
  chk(drg, "đang kéo thẻ");
  chk(L[1].vk === "on" && L[0].vk === "off" && L[2].vk === "off" && L[1].slots === "1000", "kéo Thuồng Luồng: chỉ chiến địa trống (giữa) sáng " + JSON.stringify(L.map(x => x.vk + ":" + x.slots)));
  await shot("2-thuong-luong-keo.png");
  await page.mouse.move(hb.x, 900); await page.mouse.up(); await sleep(300);
  L = await lanes();
  chk(L.every(x => !x.vk && x.slots === "0000"), "thả ra ngoài (huỷ) -> tắt hết");
  chk(await page.evaluate(() => G.q.p.length === 0), "không đặt nhầm thẻ khi huỷ kéo");

  // ---------- (d) Kiến Lửa + Cung Thủ Mường chờ ----------
  st = await setBoard({ board: [[0, "p", "_"], [0, "p", "_"], [0, "p", "_"], [1, "p", "_"], [2, "p", "thantien", "wait"]], hand: ["kiengiap", "_"] });
  await tapHand(st.h[0]); await sleep(200);
  L = await lanes();
  chk(L[0].vk === "on" && L[0].slots === "0001", "Kiến Lửa: chiến địa có 3 thẻ (đặt vào là đầy) sáng, ô số 4 " + JSON.stringify(L.map(x => x.vk + ":" + x.slots)));
  chk(L[2].vk === "on", "Cung Thủ Mường đang chờ ở chiến địa phải -> chiến địa đó cũng sáng");
  await shot("3-kien-lua-cung-thu.png");
  await tapHand(st.h[1]); await sleep(200);
  L = await lanes();
  chk(L[2].vk === "on" && L[0].vk === "off" && L[1].vk === "off" && L[2].slots === "0100", "thẻ thường + Cung Thủ Mường chờ -> chỉ chiến địa của Cung Thủ sáng " + JSON.stringify(L.map(x => x.vk + ":" + x.slots)));
  await shot("4-cung-thu-cho.png");

  // ---------- (e) thẻ không điều kiện ----------
  st = await setBoard({ board: [[0, "p", "_"]], hand: ["_"] });
  await tapHand(st.h[0]); await sleep(200);
  L = await lanes();
  chk(L.every(x => !x.vk), "thẻ không có điều kiện vị trí -> không tô");
  await tapHand(st.h[0]); await sleep(150);

  // ---------- (f) phủ chiến địa: Băng Đế lật thật + Mặc Y Nương Duy Trì ----------
  st = await setBoard({ board: [[1, "p", "_"], [1, "p", "_"], [1, "a", "_"], [1, "a", "_"], [0, "a", "dichnu"]], hand: ["bangvuong"] });
  L = await lanes();
  chk(L[0].vko === "a" && !L[1].vko && !L[2].vko, "Mặc Y Nương (Duy Trì phủ) -> viền mờ thường trực ở chiến địa của nó " + JSON.stringify(L.map(x => x.vko)));
  await page.evaluate(() => { window.FXR_LOG = true; FXR.log.length = 0; });
  const okq = await page.evaluate(u => { const r = E.queuePlay(G, "p", u, 1); render(); return r; }, st.h[0]);
  chk(okq, "đặt Băng Đế vào chiến địa giữa");
  await page.evaluate(() => document.getElementById("btnEnd").click());
  const ph = await page.evaluate(() => new Promise(r => { const t0 = performance.now(); const go = () => { const x = FXR.log.find(e => e.k === "phu"); if (!x && performance.now() - t0 < 20000) return setTimeout(go, 15);
    if (!x) return r(null);
    /* giữa hiệu ứng: dừng mọi hoạt ảnh, đặt sóng phủ về ~45% */
    setTimeout(() => { const el = document.querySelector(".fxr-phu"); document.getAnimations().forEach(a => { try { a.pause(); } catch (e) {} });
      if (el) [el, ...el.children].forEach(n => n.getAnimations().forEach(a => { try { const tm = a.effect.getTiming(); a.currentTime = (tm.delay || 0) + tm.duration * .45; } catch (e) {} }));
      const lr = document.querySelector('#board .lane[data-lane="1"]').getBoundingClientRect(), pr = el ? el.getBoundingClientRect() : null;
      requestAnimationFrame(() => requestAnimationFrame(() => r({ x, el: !!el, lane: { x: lr.left, y: lr.top, w: lr.width, h: lr.height }, box: pr && { x: pr.left, y: pr.top, w: pr.width, h: pr.height }, op: el ? +getComputedStyle(el).opacity : 0 }))); }, 30); }; go(); }));
  chk(!!ph && ph.x.srcId === "bangvuong" && ph.x.li === 1, "Băng Đế lật -> sóng phủ chiến địa giữa (FXR.log phu) " + JSON.stringify(ph && { id: ph.x.srcId, li: ph.x.li, e: ph.x.e }));
  if (ph && ph.box) chk(Math.abs(ph.box.x - ph.lane.x) < 2 && Math.abs(ph.box.w - ph.lane.w) < 2 && Math.abs(ph.box.h - ph.lane.h) < 2, "sóng phủ đúng khung chiến địa (cả hai phía) " + JSON.stringify(ph.box));
  chk(ph && ph.op > 0.3, "giữa hiệu ứng sóng đang hiện (opacity " + (ph && ph.op) + ")");
  await page.screenshot({ path: path.join(OUT, "5-bang-de-phu.png") }); console.log("    ảnh " + path.join(OUT, "5-bang-de-phu.png"));
  await page.evaluate(() => document.getAnimations().forEach(a => { try { a.play(); } catch (e) {} }));
  await sleep(2500);
  chk(await page.evaluate(() => !document.querySelector(".fxr-phu")), "sóng phủ tự tan, không sót nút");
  const nCss = await page.evaluate(() => { const d = document.createElement("div"); d.className = "slot"; d.setAttribute("data-vks", ""); document.body.appendChild(d); const a = getComputedStyle(d, "::after").animationName, b = getComputedStyle(d, "::before").animationName; d.remove(); return a + "|" + b; });
  chk(/vkHat/.test(nCss) && /vkTho/.test(nCss), "CSS ô sáng có hạt bay lên + nhịp thở " + nCss);
} catch (e) { console.error(e); bad++; }
await browser.close(); server.close();
if (errors.length) { console.log("Lỗi trang:\n  " + errors.slice(0, 8).join("\n  ")); bad += errors.length; }
console.log(bad ? `THẤT BẠI: ${bad} lỗi` : "ĐẠT: vfx-dieukien");
process.exit(bad ? 1 : 0);
