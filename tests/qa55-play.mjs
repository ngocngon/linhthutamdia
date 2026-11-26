// QA55: tự chơi trọn nhiều trận đấu máy qua giao diện thật (bấm thẻ trên tay -> bấm chiến địa -> Kết thúc lượt),
// chụp ảnh các mốc, đo khung hình (rAF), khung > 50 ms kèm bối cảnh, lỗi console, nút DOM theo lượt, tiếng phát đôi,
// kiểm bố cục (chữ tràn/bị cắt, nút chồng nhau, phần tử ra ngoài màn), luồng trận (lượt, lộ diện, kết quả).
// Chạy:  node tests/qa55-play.mjs <W> <H> <số_trận> <tốc_độ: nhanh|vua|cham|ratcham> <tag> [chiến_thuật,...]
//   chiến thuật mỗi trận xoay vòng: ui (đặt bài bằng chạm), snap (cược ở lượt 2), idle (không đặt gì),
//   retreat (rút lui lượt 3), skipend (chạm tua màn kết quả), ai (E.aiPlan thay người),
//   spam (từ lượt 2: vừa đến lượt là bấm Kết thúc lượt ngay, khi lộ diện/rút bài/băng hiệu còn đang diễn)
//   QA_PERF=1: không chụp ảnh/quét bố cục để đo khung hình sạch hơn
// Ví dụ: node tests/qa55-play.mjs 390 844 3 nhanh mob ui,snap,idle
import http from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const require = createRequire("/opt/npm-tools/node_modules/");
const { chromium } = require("playwright");
const [W, H, NG, SPDK, TAG] = [+(process.argv[2] || 390), +(process.argv[3] || 844), +(process.argv[4] || 2), process.argv[5] || "nhanh", process.argv[6] || "t"];
const STRATS = (process.argv[7] || "ui,snap,idle").split(",");
const OUT = path.join(here, "artifacts", "qa55"); await mkdir(OUT, { recursive: true });
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".woff2": "font/woff2", ".ttf": "font/ttf" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(+(process.env.QA_PORT || 0));
await new Promise(r => server.once("listening", r));
const URLX = `http://127.0.0.1:${server.address().port}/index.html`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const mobile = W < 700;
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
/* đặt tốc độ trước khi trang chạy: đánh dấu đã chuyển ltd_spd_v4 + ghi store.spd */
await ctx.addInitScript(spd => {
  try {
    localStorage.setItem("ltd_spd_v4", "1"); localStorage.setItem("linhthu.tamdia.gpu_vfx_v2", "1");
    window.__wantSpd = spd;
  } catch (e) {}
  /* nhạc cụ đo: khung hình + tiếng */
  window.__fr = []; window.__long = []; window.__snd = []; window.__ctx = "boot";
  let last = performance.now();
  const raf = t => { const d = t - last; last = t; window.__fr.push(d); if (d > 50) window.__long.push({ d: Math.round(d), at: Math.round(t), ctx: window.__ctx, turn: typeof G !== "undefined" && G ? G.turn : 0, ph: typeof G !== "undefined" && G ? G.phase : "" }); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  window.SFX_TAP = (n, v, o) => window.__snd.push({ n, t: Math.round(performance.now()), d: (o && o.delay) || 0, ctx: window.__ctx, turn: typeof G !== "undefined" && G ? G.turn : 0 });
}, SPDK);
const page = await ctx.newPage();
await page.route(/workers\.dev|firebase|googleapis|gstatic/, r => r.abort());
const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message + " @" + String(e.stack || "").split("\n")[1]));
page.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY|workers\.dev|ERR_FAILED|net::/.test(m.text())) errors.push("console.error: " + m.text().slice(0, 200)); });
page.on("response", r => { if (r.status() >= 400 && r.url().startsWith("http://127.0.0.1")) errors.push("http " + r.status() + " " + r.url()); });
const cdp = await ctx.newCDPSession(page);
const PERF = !!process.env.QA_PERF; /* QA_PERF=1: không chụp ảnh / không quét bố cục (chụp ảnh làm đứng rAF, sai số đo) */
await cdp.send("Performance.enable").catch(() => {});
const pm = async () => Object.fromEntries(((await cdp.send("Performance.getMetrics").catch(() => ({ metrics: [] }))).metrics || []).map(m => [m.name, m.value]));
const shot = async n => { if (PERF) return null; const f = path.join(OUT, `${TAG}_${n}.png`); try { await page.screenshot({ path: f }); } catch {} return f; };
/* lý do Playwright không bấm được: lấy dòng "intercepts pointer events" / "not stable" trong call log + chụp ảnh */
const why = e => { const L = String(e.message).split("\n"); const hit = L.filter(l => /intercepts|not stable|not visible|not enabled|outside of the viewport|retrying|performing/.test(l)).map(l => l.trim()); return (L[0] + " | " + [...new Set(hit)].slice(-3).join(" | ")).slice(0, 330); };
let failN = 0;
const failShot = async n => { if (failN++ < 6) await shot("FAIL_" + n); };
const setCtx = c => page.evaluate(c => { window.__ctx = c; }, c).catch(() => {});

const t00 = Date.now();
await page.goto(URLX, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
const spdInfo = await page.evaluate(k => { store.spd = k; SPD = SPDV[k] || 1; save(); return { spd: SPD, k: store.spd, levels: JSON.stringify(SPDV) }; }, SPDK);
console.log(TAG, `tải ${(Date.now() - t00) / 1000}s, tốc độ`, spdInfo);
/* đếm số lần endTurnRun chạy CHỒNG nhau (bấm Kết thúc lượt khi màn đầu lượt mới còn đang diễn) */
await page.evaluate(() => { window.__conc = 0; window.__maxConc = 0; const o = window.endTurnRun; window.endTurnRun = async function () { window.__conc++; window.__maxConc = Math.max(window.__maxConc, window.__conc); try { return await o.apply(this, arguments); } finally { window.__conc--; } }; });
await sleep(1500);
await shot("00_lobby");

/* ===== kiểm bố cục trong trận: tràn chữ, nút chồng nhau, phần tử ra ngoài khung nhìn ===== */
function layoutCheck() {
  const out = [], vw = innerWidth, vh = innerHeight;
  const vis = e => { if (!e) return false; const s = getComputedStyle(e); if (s.display === "none" || s.visibility === "hidden" || +s.opacity < 0.05) return false; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  const R = e => e.getBoundingClientRect();
  const nm = e => (e.id ? "#" + e.id : "") + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : "") + (e.textContent ? `「${e.textContent.trim().slice(0, 18)}」` : "");
  /* 1) chữ bị cắt: phần tử lá có chữ mà scrollWidth > clientWidth (+2) và overflow hidden/ellipsis */
  for (const e of document.querySelectorAll("#app *")) {
    if (!vis(e) || e.children.length > 0 || !e.textContent.trim()) continue;
    if (e.closest("#lobby,.ov:not(.on)")) continue;
    if (e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0) { const s = getComputedStyle(e); if (s.overflow !== "visible" || s.textOverflow === "ellipsis") out.push({ k: "cut-x", el: nm(e), sw: e.scrollWidth, cw: e.clientWidth }); }
    if (e.scrollHeight > e.clientHeight + 3 && e.clientHeight > 0) { const s = getComputedStyle(e); if (s.overflowY !== "visible") out.push({ k: "cut-y", el: nm(e), sh: e.scrollHeight, ch: e.clientHeight }); }
  }
  /* 2) nút điều khiển chồng nhau / ra ngoài màn */
  const ctl = ["btnEnd", "btnSnap", "btnRetreat", "orb", "btnUndo", "btnLobby", "btnPiles", "btnFx", "btnMute", "btnHelp", "btnProfile", "finalV"].map(id => document.getElementById(id)).filter(vis);
  for (const e of ctl) { const r = R(e); if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1) out.push({ k: "offscreen", el: nm(e), r: [r.left, r.top, r.right, r.bottom].map(Math.round) }); }
  for (let i = 0; i < ctl.length; i++) for (let j = i + 1; j < ctl.length; j++) {
    const a = R(ctl[i]), b = R(ctl[j]); const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ox > 3 && oy > 3) { if (ctl[i].contains(ctl[j]) || ctl[j].contains(ctl[i])) continue; out.push({ k: "overlap", a: nm(ctl[i]), b: nm(ctl[j]), ox: Math.round(ox), oy: Math.round(oy) }); }
  }
  /* 3) thẻ trên tay ra ngoài màn hoặc chồng quá 60% lên nhau */
  const hc = [...document.querySelectorAll("#hand [data-hc]")].filter(vis);
  for (const e of hc) { const r = R(e); if (r.left < -2 || r.right > vw + 2 || r.bottom > vh + 2) out.push({ k: "hand-off", el: nm(e), r: [r.left, r.top, r.right, r.bottom].map(Math.round) }); }
  for (let i = 0; i + 1 < hc.length; i++) { const a = R(hc[i]), b = R(hc[i + 1]); const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left); if (ox > a.width * 0.6) out.push({ k: "hand-overlap", i, ox: Math.round(ox), w: Math.round(a.width) }); }
  /* 4) thẻ trên bàn chồng nhau trong cùng một nửa chiến địa (>45%) */
  for (const side of document.querySelectorAll("#board .side")) {
    const cs = [...side.querySelectorAll("[data-mc]")].filter(vis).map(R);
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const a = cs[i], b = cs[j]; const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (ox > a.width * .45 && oy > a.height * .45) out.push({ k: "board-overlap", ox: Math.round(ox), oy: Math.round(oy) }); }
  }
  /* 5) board + hand + thanh dưới có vượt khỏi chiều cao màn không */
  const doc = document.documentElement; if (doc.scrollHeight > vh + 2 || doc.scrollWidth > vw + 2) out.push({ k: "page-scroll", sh: doc.scrollHeight, sw: doc.scrollWidth });
  /* 6) chữ nhỏ dưới 9px */
  let tiny = 0, tinyEx = ""; for (const e of document.querySelectorAll("#board *,#hand *,.info *")) { if (!vis(e) || e.children.length || !e.textContent.trim()) continue; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 9) { tiny++; tinyEx = tinyEx || nm(e) + " " + fs + "px"; } }
  if (tiny) out.push({ k: "tiny-font", n: tiny, ex: tinyEx });
  return out;
}
const state = () => page.evaluate(() => {
  const $ = id => document.getElementById(id), on = id => { const e = $(id); return !!e && e.classList.contains("on"); };
  const g = typeof G !== "undefined" ? G : null;
  return { ph: g ? g.phase : "-", turn: g ? g.turn : 0, turns: g ? E.turns(g) : 0, lobby: on("lobby"), end: on("ovEnd"), endSeq: !!$("endSeq"), endDis: $("btnEnd").disabled, endTxt: $("endMain").textContent, veil: typeof LVEIL !== "undefined" && LVEIL === g, ovs: [...document.querySelectorAll(".ov.on")].map(o => o.id), mm: on("mm"), energy: g ? g.energy.p : 0, rvl: g ? g.locs.map(l => !!l.rvl) : [], nodes: document.getElementsByTagName("*").length, hand: g ? g.hand.p.length : 0 };
});

const report = { tag: TAG, W, H, spd: spdInfo, games: [] };
for (let gi = 0; gi < NG; gi++) {
  const strat = STRATS[gi % STRATS.length];
  const G0 = { gi, strat, turns: [], issues: [], layout: [], shots: [], result: null };
  console.log(TAG, `== trận ${gi + 1} (${strat})`);
  await setCtx("lobby");
  /* vào trận từ sảnh bằng chạm thật */
  let s = await state();
  if (!s.lobby) { await page.evaluate(() => showLobby()); await sleep(1200); }
  await page.locator("#lbPlay").click({ timeout: 10000 }).catch(e => G0.issues.push("không bấm được Chơi: " + e.message.slice(0, 80)));
  const tEnter = Date.now(); await setCtx("matchmaking");
  let sawMM = false;
  while (Date.now() - tEnter < 60000) { s = await state(); if (s.mm) sawMM = true; if (s.ph === "play" && !s.lobby && !s.mm) break; await sleep(150); }
  G0.enterMs = Date.now() - tEnter;
  await setCtx("intro");
  await sleep(400); G0.shots.push(await shot(`g${gi}_01_intro`));
  /* chờ hết màn mở đầu (LVEIL) */
  const tIntro = Date.now(); while (Date.now() - tIntro < 30000) { s = await state(); if (!s.veil) break; await sleep(150); }
  G0.introMs = Date.now() - tIntro;
  let lastTurn = 0, guard = 0;
  while (guard++ < 20) {
    s = await state();
    if (s.ph === "over" || s.end || s.endSeq) break;
    /* chờ đến lúc nhận lệnh */
    const tw = Date.now(); while (Date.now() - tw < 120000) { s = await state(); if (s.ph === "over" || s.end || s.endSeq) break; if (s.ph === "play" && !s.endDis && !s.veil && !s.ovs.length) break; await sleep(strat === "spam" ? 15 : 120); }
    if (s.ph !== "play") break;
    if (s.turn === lastTurn) { G0.issues.push(`lượt ${s.turn} không tăng sau khi kết thúc lượt`); }
    lastTurn = s.turn;
    if (strat === "spam" && s.turn > 1) { /* người chơi sốt ruột: vừa thấy KẾT THÚC LƯỢT sáng lại là bấm ngay */
      await page.evaluate(() => { E.aiPlan(G, "p", 40); render(); document.getElementById("btnEnd").click(); });
      await sleep(250); G0.shots.push(await shot(`g${gi}_t${s.turn}_spam`));
      const tS = Date.now(); while (Date.now() - tS < 120000) { const q = await state(); if (q.ph === "over" || q.end || q.endSeq || (q.ph === "play" && q.turn > s.turn)) break; await sleep(15); }
      G0.turns.push({ turn: s.turn, spam: true, conc: await page.evaluate(() => window.__maxConc) }); continue;
    }
    await setCtx(`t${s.turn}-input`);
    const T = { turn: s.turn, energy: s.energy, hand: s.hand, nodes: s.nodes, rvl: s.rvl.join(""), played: [] };
    await sleep(250);
    G0.shots.push(await shot(`g${gi}_t${s.turn}_a_start`));
    const lay = PERF ? [] : await page.evaluate(layoutCheck);
    for (const x of lay) G0.layout.push({ turn: s.turn, ...x });
    /* ---- người chơi hành động ---- */
    if (strat === "ai") {
      await page.evaluate(() => { E.aiPlan(G, "p", 40); render(); });
    } else if (strat !== "idle" && !(strat === "retreat" && s.turn >= 3)) {
      for (let k = 0; k < 4; k++) {
        const pick = await page.evaluate(() => {
          const hs = [...document.querySelectorAll("#hand [data-hc]:not(.no)")];
          const c = hs.map(e => ({ uid: +e.dataset.hc, c: +((e.querySelector(".cst") || {}).textContent || 99) })).filter(x => x.c <= G.energy.p).sort((a, b) => b.c - a.c);
          return c[0] || null;
        });
        if (!pick) break;
        const hc = page.locator(`#hand [data-hc="${pick.uid}"]`);
        try { if (mobile) await hc.tap({ timeout: 3000 }); else await hc.click({ timeout: 3000 }); } catch (e) { G0.issues.push(`t${s.turn}: không chạm được thẻ trên tay ${pick.uid}: ${why(e)}`); await failShot(`g${gi}_t${s.turn}_hand`); break; }
        await sleep(200);
        const lanes = await page.evaluate(() => [...document.querySelectorAll("#board .lane")].map(l => ({ li: +l.dataset.lane, ok: l.classList.contains("ok") || l.classList.contains("okx") })));
        const okL = lanes.filter(l => l.ok); if (!okL.length) { G0.issues.push(`t${s.turn}: chọn thẻ ${pick.uid} (giá ${pick.c}, năng lượng đủ) nhưng không chiến địa nào sáng 'ok'`); await page.keyboard.press("Escape"); break; }
        const li = okL[(s.turn + k + gi) % okL.length].li;
        /* chạm vào vùng nửa dưới (phía mình) của chiến địa */
        const box = await page.locator(`#board .lane[data-lane="${li}"] .side.me`).boundingBox().catch(() => null) || await page.locator(`#board .lane[data-lane="${li}"]`).boundingBox();
        const x = box.x + box.width / 2, y = box.y + box.height / 2;
        if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
        await sleep(350);
        const ok = await page.evaluate(u => G.q.p.some(a => a.uid === u), pick.uid);
        T.played.push({ uid: pick.uid, li, ok });
        if (!ok) { G0.issues.push(`t${s.turn}: chạm chiến địa ${li} (${Math.round(x)},${Math.round(y)}) không đặt được thẻ ${pick.uid}`); const hit = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.className.toString()).slice(0, 60) : null; }, [x, y]); G0.issues.push("   phần tử nhận chạm: " + hit); break; }
      }
      if (T.played.length) G0.shots.push(await shot(`g${gi}_t${s.turn}_b_staged`));
    }
    if (strat === "snap" && s.turn === 2) { await page.locator("#btnSnap").click().catch(() => {}); await sleep(300); G0.shots.push(await shot(`g${gi}_t${s.turn}_snap`)); }
    if (strat === "retreat" && s.turn === 3) {
      await page.locator("#btnRetreat").click(); await sleep(400); G0.shots.push(await shot(`g${gi}_t3_retreat_arm`));
      await page.locator("#btnRetreat").click(); await sleep(300); break;
    }
    /* ---- kết thúc lượt ---- */
    await setCtx(`t${s.turn}-resolve`);
    const tEnd = Date.now(); const turnBefore = s.turn;
    const lt0 = await page.evaluate(() => window.__long.length); const pm0 = await pm();
    await page.locator("#btnEnd").click({ timeout: 5000 }).catch(async e => { G0.issues.push(`t${turnBefore}: không bấm được Kết thúc lượt: ${why(e)}`); await failShot(`g${gi}_t${turnBefore}_end`); await page.evaluate(() => document.getElementById("btnEnd").click()); });
    let midShot = false, locShot = false, ffSeen = false;
    while (Date.now() - tEnd < 150000) {
      s = await state();
      if (!midShot && Date.now() - tEnd > (SPDK === "nhanh" ? 1500 : 3000)) { midShot = true; G0.shots.push(await shot(`g${gi}_t${turnBefore}_c_mid`)); }
      const l51 = await page.evaluate(() => !!document.querySelector(".l51-c,[class*='l51-big'],.l51"));
      if (l51 && !locShot) { locShot = true; await sleep(SPDK === "nhanh" ? 350 : 700); G0.shots.push(await shot(`g${gi}_t${turnBefore}_d_locreveal`)); }
      if (!ffSeen && await page.evaluate(() => { const c = document.getElementById("ffChip"); return !!(c && c.classList.contains("on")); })) ffSeen = true;
      if (s.end || s.endSeq || s.ph === "over") break;
      if (s.ph === "play" && s.turn > turnBefore && !s.endDis) break;
      await sleep(120);
    }
    T.resolveMs = Date.now() - tEnd; T.ff = ffSeen;
    { const pm1 = await pm(); T.cpuMsPerS = Math.round((pm1.TaskDuration - pm0.TaskDuration) * 1e6 / T.resolveMs); T.layouts = pm1.LayoutCount - pm0.LayoutCount; T.styles = pm1.RecalcStyleCount - pm0.RecalcStyleCount; }
    T.long = await page.evaluate(n => window.__long.slice(n), lt0);
    G0.turns.push(T);
    console.log(TAG, `  lượt ${T.turn}: E=${T.energy} tay=${T.hand} đặt=${T.played.filter(p => p.ok).length} diễn=${(T.resolveMs / 1000).toFixed(1)}s ${ffSeen ? "(tua nhanh)" : ""} khung>50ms=${T.long.length} CPU=${T.cpuMsPerS}ms/s layout=${T.layouts} nodes=${T.nodes} lộ=${T.rvl}`);
  }
  /* ---- màn kết quả ---- */
  await setCtx("endseq");
  const tE = Date.now(); let endShot = false, sawSeq = false;
  while (Date.now() - tE < 40000) {
    s = await state();
    if (s.endSeq) { sawSeq = true; if (!endShot && Date.now() - tE > 900) { endShot = true; G0.shots.push(await shot(`g${gi}_e1_endseq`)); if (strat === "skipend") { for (let i = 0; i < 4; i++) { await page.mouse.click(W / 2, H / 2); await sleep(250); } } } }
    if (s.end && !s.endSeq) break;
    await sleep(150);
  }
  G0.endSeqMs = Date.now() - tE; G0.sawSeq = sawSeq;
  await sleep(1300);
  G0.shots.push(await shot(`g${gi}_e2_result`));
  G0.result = await page.evaluate(() => {
    const r = G.result || {}, $ = id => document.getElementById(id);
    const lanes = G.locs.map((L, i) => [E.locPower(G, i, "p"), E.locPower(G, i, "a"), E.lead(G, i)]);
    return { winner: r.winner, kind: r.kind, stake: r.stake, turn: G.turn, title: $("resTitle").textContent, score: $("resScore").innerText.replace(/\s+/g, " "), rows: $("resRows").innerText.replace(/\s+/g, " "), gem: $("resGem").innerText.replace(/\s+/g, " "), lanes, again: $("btnAgain").textContent };
  });
  G0.endLayout = await page.evaluate(() => { const o = document.getElementById("ovEnd"), out = []; for (const e of o.querySelectorAll("*")) { const r = e.getBoundingClientRect(); if (r.width < 2) continue; if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) out.push((e.id || e.className.toString()).slice(0, 30) + " " + [r.left, r.top, r.right, r.bottom].map(Math.round)); if (e.children.length === 0 && e.scrollWidth > e.clientWidth + 2 && e.clientWidth) out.push("cut " + (e.id || e.className.toString()).slice(0, 30)); } return out; });
  G0.maxConc = await page.evaluate(() => window.__maxConc); if (G0.maxConc > 1) G0.issues.push(`endTurnRun chạy chồng ${G0.maxConc} lớp (bấm Kết thúc lượt lúc màn đầu lượt chưa xong)`);
  console.log(TAG, `  KẾT QUẢ: ${JSON.stringify(G0.result)} màn kết ${(G0.endSeqMs / 1000).toFixed(1)}s seq=${sawSeq}`);
  /* đúng/sai: người thắng phải khớp số chiến địa dẫn */
  if (G0.result.kind === "end") {
    let wp = 0, wa = 0, pp = 0, pa = 0; for (const [a, b, l] of G0.result.lanes) { if (l === "p") wp++; else if (l === "a") wa++; pp += a; pa += b; }
    const exp = wp > wa ? "p" : wa > wp ? "a" : pp > pa ? "p" : pa > pp ? "a" : "d";
    if (exp !== (G0.result.winner || "d") && !(exp === "d" && !G0.result.winner)) G0.issues.push(`kết quả lệch: theo chiến địa ${wp}-${wa} (tổng ${pp}-${pa}) mong ${exp}, game ghi ${G0.result.winner}`);
    if (G0.result.turn !== 6 && G0.result.turn !== 7) G0.issues.push(`trận kết thúc ở lượt ${G0.result.turn}`);
  }
  /* rời màn kết quả về sảnh bằng nút thật */
  await setCtx("toLobby");
  await page.locator("#btnEndLobby").click({ timeout: 8000 }).catch(e => G0.issues.push("không bấm được Về sảnh: " + e.message.slice(0, 80)));
  await sleep(2500);
  await cdp.send("HeapProfiler.collectGarbage").catch(() => {});
  G0.lobbyAfter = await page.evaluate(() => ({ nodes: document.getElementsByTagName("*").length, body: document.body.children.length, heap: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1), lobby: document.getElementById("lobby").classList.contains("on"), stray: [...document.querySelectorAll("#endSeq,.fxr,.fxg,[class*='l51-'],.tbn,#ghost")].length }));
  G0.shots.push(await shot(`g${gi}_f_lobby`));
  console.log(TAG, `  về sảnh: ${JSON.stringify(G0.lobbyAfter)}`);
  report.games.push(G0);
}
/* ===== tổng hợp ===== */
const R = await page.evaluate(() => ({ fr: window.__fr, long: window.__long, snd: window.__snd }));
report.load = (await import("node:os")).loadavg();
const fr = R.fr.slice(30), tot = fr.reduce((a, b) => a + b, 0), sorted = [...fr].sort((a, b) => a - b);
report.perf = { frames: fr.length, fps: +(1000 * fr.length / tot).toFixed(1), p95: +sorted[(sorted.length * .95) | 0].toFixed(1), p99: +sorted[(sorted.length * .99) | 0].toFixed(1), over50: fr.filter(d => d > 50).length, over100: fr.filter(d => d > 100).length, max: Math.round(sorted[sorted.length - 1]) };
const byCtx = {}; for (const l of R.long) { const k = l.ctx.replace(/^t\d+-/, "t*-"); (byCtx[k] = byCtx[k] || []).push(l.d); }
report.perf.longByCtx = Object.fromEntries(Object.entries(byCtx).map(([k, v]) => [k, { n: v.length, max: Math.max(...v) }]));
report.perf.worst = [...R.long].sort((a, b) => b.d - a.d).slice(0, 10);
const dup = []; const snd = R.snd;
for (let i = 0; i < snd.length; i++) for (let j = i + 1; j < snd.length && snd[j].t - snd[i].t < 60; j++) if (snd[j].n === snd[i].n && Math.abs(snd[j].d - snd[i].d) < 0.03) dup.push(`${snd[i].n}@${snd[i].ctx} Δ${snd[j].t - snd[i].t}ms`);
const cnt = {}; for (const x of snd) cnt[x.n] = (cnt[x.n] || 0) + 1;
report.sound = { total: snd.length, dup: dup.length, dupEx: [...new Set(dup)].slice(0, 15), top: Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 20) };
/* tiếng thắng/thua có phát không */
report.sound.endSfx = ["win", "lose", "draw_game"].map(n => [n, cnt[n] || 0]);
report.errors = [...new Set(errors)];
await writeFile(path.join(OUT, `${TAG}_report.json`), JSON.stringify(report, null, 1));
console.log(TAG, "HIỆU NĂNG", JSON.stringify({ ...report.perf, worst: undefined }), "loadavg máy:", report.load.map(x => x.toFixed(1)).join("/"));
console.log(TAG, "khung tệ nhất", JSON.stringify(report.perf.worst.slice(0, 6)));
console.log(TAG, "TIẾNG", JSON.stringify(report.sound));
for (const g of report.games) {
  const lk = {}; for (const l of g.layout) { const k = l.k + " " + (l.el || l.a + "×" + l.b || ""); lk[k] = (lk[k] || 0) + 1; }
  console.log(TAG, `trận ${g.gi} ${g.strat}: vào ${g.enterMs}ms intro ${g.introMs}ms, vấn đề: ${JSON.stringify(g.issues)}`);
  console.log(TAG, `   bố cục: ${JSON.stringify(Object.entries(lk).slice(0, 12))}`);
  if (g.endLayout.length) console.log(TAG, `   màn kết quả: ${JSON.stringify(g.endLayout.slice(0, 6))}`);
}
console.log(TAG, "LỖI:", report.errors.slice(0, 15).join(" | ") || "không");
await browser.close(); server.close();
