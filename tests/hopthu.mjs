// Kiểm hộp thư / thông báo / giftcode / ping / khoá tài khoản với MÁY CHỦ GIẢ LẬP (chặn route trên trình duyệt, không gọi máy chủ thật).
// Chạy: CHROME_PATH=/usr/bin/google-chrome node tests/hopthu.mjs   (HOPTHU_SHOTS=thư mục để chụp ảnh 3 khung)
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const SHOTS = process.env.HOPTHU_SHOTS || "";
if (SHOTS) await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const errs = []; let okN = 0;
const ck = (c, m) => { if (c) okN++; else errs.push("SAI: " + m); };
const MOCK = "http://mock.test";
const DAY = 86400000, now = Date.now(), iso = d => new Date(d).toISOString();

/* ---- máy chủ giả lập: trạng thái + nhật ký gọi ---- */
function mkServer(o = {}) {
  const S = {
    log: [], mail: o.mail || [], ann: o.ann || [], banOn: o.banOn || "", claimDelay: o.claimDelay || 0,
    claimed: new Set(), codes: o.codes || {},
    ...o
  };
  S.count = (m, p) => S.log.filter(x => x.m === m && x.p === p).length;
  return S;
}
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
async function attach(ctx, S) {
  await ctx.route(MOCK + "/**", async route => {
    const rq = route.request(), u = new URL(rq.url()), p = u.pathname, m = rq.method();
    if (m === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    let body = null; try { body = rq.postDataJSON(); } catch {}
    S.log.push({ m, p, body, auth: rq.headers()["authorization"] || "" });
    const J = (status, j) => route.fulfill({ status, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify(j) });
    const ban = () => J(403, { error: "banned", reason: "Gian lận thử nghiệm", until: "2026-12-31T10:00:00Z" });
    if (p === "/api/config") return J(200, { ok: true, googleClientId: "", registerOpen: true });
    if (p === "/api/announce") return J(200, { items: S.ann });
    if (p === "/api/me") return J(200, { user: { id: 7, username: "tester" }, ratings: {}, google: { linked: false, email: "" }, hasPassword: true });
    if (S.banOn && p === S.banOn) return ban();
    if (p === "/api/ping") return J(200, { ok: true });
    if (p === "/api/mail") return J(200, { items: S.mail.map(x => ({ ...x, claimed: S.claimed.has(x.id) || x.claimed })) });
    if (p === "/api/mail/claim") {
      if (S.claimDelay) await new Promise(r => setTimeout(r, S.claimDelay));
      const x = S.mail.find(z => z.id === body.id); if (!x) return J(404, { error: "not_found" });
      if (x.forceStatus) return J(x.forceStatus, { error: x.forceErr || "x" });
      if (S.claimed.has(x.id) && !S.allowDouble) return J(409, { error: "claimed" });
      S.claimed.add(x.id); return J(200, { ok: true, rewards: x.rewards });
    }
    if (p === "/api/giftcode") {
      const c = S.codes[body.code]; if (!c) return J(404, { error: "not_found" });
      if (c.status) return J(c.status, c.err ? { error: c.err } : {});
      return J(200, { ok: true, rewards: c.rewards });
    }
    return J(404, { error: "nf" });
  });
}

/* ---- tạo trang ---- */
async function open(S, { w = 412, h = 915, token = "tok-test", iframe = false, ctx0 } = {}) {
  const ctx = ctx0 || await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  if (!ctx0) {
    await ctx.addInitScript(([tk, mock]) => {
      try {
        if (!localStorage.getItem("ltd.hth.init")) {
          localStorage.setItem("ltd.hth.init", "1"); localStorage.setItem("ltd.server", mock);
          if (tk) { localStorage.setItem("ltd.cf.token", tk); localStorage.setItem("ltd.cf.user", JSON.stringify({ id: 7, username: "tester" })); }
        }
      } catch {}
    }, [token, MOCK]);
    await attach(ctx, S);
  }
  const page = await ctx.newPage();
  /* nút dev "Bảng Test VFX" (08-vfx-webgl.js, agent khác) đè lên hàng nút sảnh: ẩn trong test để bấm được */
  await page.addInitScript(() => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "#lbVfxTest{display:none!important}"; document.head.appendChild(s); }); });
  page.on("pageerror", e => errs.push("pageerror: " + e.message + " @" + (e.stack || "").split("\n").slice(1, 3).join("|")));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR|ERR_FAILED|status of 40/.test(m.text())) errs.push("console.error: " + m.text()); });
  page.on("dialog", d => d.dismiss().catch(() => {}));
  page.on("popup", p => p.close().catch(() => {}));
  await page.goto(BASE + "index.html", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.waitForFunction(() => document.getElementById("lobby").classList.contains("on") && typeof store !== "undefined", null, { timeout: 60000 });
  return { ctx, page };
}
const snap = page => page.evaluate(() => ({ gold: store.gold, gems: store.gems, tok: store.tok, up: store.up, own: store.own.length, mg: store.mailGot.length, cg: store.codeGot.length }));

const mails = (cardNew, cardDup) => [
  { id: "m1", title: "Quà tạ lỗi bảo trì", body: "Cảm ơn bạn đã chờ.\nXin nhận quà nhỏ.", rewards: { vang: 500, ngoc: 20 }, created_at: iso(now - 2 * DAY), expires_at: iso(now + 5 * DAY), claimed: false },
  { id: "m2", title: "Thẻ tặng", body: "Chúc bạn chơi vui.", rewards: { vang: 100, the: [cardNew, cardDup] }, created_at: iso(now - 1 * DAY), expires_at: iso(now + 9 * DAY), claimed: false },
  { id: "m3", title: "Quà sự kiện", body: "<img src=x onerror=alert(1)> Nhận token", rewards: { token: 50, diem: 30 }, created_at: iso(now - 3 * DAY), expires_at: null, claimed: false },
  { id: "m4", title: "Thư cũ đã nhận", body: "x", rewards: { vang: 999 }, created_at: iso(now - 9 * DAY), expires_at: iso(now + 1 * DAY), claimed: true },
  { id: "m5", title: "Thư hết hạn", body: "x", rewards: { vang: 777 }, created_at: iso(now - 20 * DAY), expires_at: iso(now - 5 * DAY), claimed: false },
];
const anns = [
  { id: 1, text: "Máy chủ sẽ bảo trì lúc 02:00 sáng mai, dự kiến 30 phút.", level: "warn" },
  { id: 2, text: "Sự kiện cuối tuần: nhận gấp đôi vàng khi thắng trận!", level: "event" },
  { id: 3, text: "Phiên bản mới đã có.", level: "info" },
];

/* ======== A. chưa đăng nhập: không nút hộp thư, không ping ======== */
{
  const S = mkServer({ ann: anns, mail: [] });
  const { ctx, page } = await open(S, { token: "" });
  await page.waitForFunction(() => document.getElementById("hthAnn") && !document.getElementById("hthAnn").hidden, null, { timeout: 15000 });
  ck(await page.locator("#lbMail").isHidden(), "A: chưa đăng nhập vẫn thấy nút hộp thư");
  await page.waitForTimeout(800);
  ck(S.count("POST", "/api/ping") === 0, "A: chưa đăng nhập mà vẫn ping");
  ck(S.count("GET", "/api/mail") === 0, "A: chưa đăng nhập mà vẫn tải thư");
  await ctx.close();
}

/* ======== B. đăng nhập: ping, thông báo, hộp thư, nhận quà ======== */
{
  const probe = await open(mkServer(), { token: "" }); /* lấy id thẻ để dựng thư */
  const ids = await probe.page.evaluate(() => { const a = E.COLLECT.filter(k => C[k].h === "S3"); return [a[0], a[1]]; });
  await probe.ctx.close();
  const [cardNew, cardDup] = ids;
  const S = mkServer({ ann: anns, mail: mails(cardNew, cardDup), claimDelay: 150 });
  const { ctx, page } = await open(S);
  await page.waitForFunction(() => !document.getElementById("lbMail").hidden && document.getElementById("lbMailN").textContent !== "", null, { timeout: 15000 });
  /* ping đúng */
  const pg = S.log.filter(x => x.p === "/api/ping");
  const ver = await page.evaluate(() => window.LTD_VER);
  ck(pg.length === 1, "B: ping lúc mở game phải đúng 1 lần, thực tế " + pg.length);
  ck(pg[0] && pg[0].body && pg[0].body.platform === "web" && pg[0].body.v === ver && ver, "B: nội dung ping sai " + JSON.stringify(pg[0] && pg[0].body));
  ck(pg[0] && pg[0].auth === "Bearer tok-test", "B: ping thiếu phiên đăng nhập");
  /* thông báo */
  const lvOf = t => (anns.find(x => x.text === t) || {}).level;
  const a1 = await page.evaluate(() => ({ t: document.getElementById("hthTx").textContent, c: document.getElementById("hthAnn").className }));
  ck(lvOf(a1.t) && a1.c === "hth-ann lv-" + lvOf(a1.t), "B: dải thông báo/màu theo level sai " + JSON.stringify(a1));
  await page.click("#hthAt");
  await page.waitForSelector("#hthAnnOv.on");
  ck(await page.locator("#hthAnnOv .hth-ai2").count() === 3, "B: xem đầy đủ phải có 3 thông báo");
  ck((await page.locator("#hthAnnOv").innerText()).includes("dự kiến 30 phút"), "B: xem đầy đủ thiếu chữ");
  await page.click("#hthAnnOv [data-close]");
  const hid = await page.locator("#hthTx").textContent();
  await page.click("#hthAx");
  const a2 = await page.locator("#hthTx").textContent();
  ck(a2 !== hid && lvOf(a2), "B: sau khi ẩn phải sang thông báo khác: " + a2);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.waitForFunction(() => document.getElementById("hthAnn") && !document.getElementById("hthAnn").hidden, null, { timeout: 15000 });
  const a3 = await page.evaluate(() => { const x = []; document.getElementById("hthAt").click(); document.querySelectorAll("#hthAnnOv .hth-at2").forEach(e => x.push(e.textContent)); document.getElementById("hthAnnOv").classList.remove("on"); return x; });
  ck(a3.length === 2 && !a3.includes(hid), "B: thông báo đã ẩn hiện lại sau tải lại: " + JSON.stringify(a3));
  /* ẩn hết -> dải biến mất */
  await page.click("#hthAx"); await page.click("#hthAx");
  ck(await page.locator("#hthAnn").isHidden(), "B: ẩn hết mà dải vẫn còn");
  /* hộp thư: đếm chưa nhận = m1,m2,m3 */
  await page.waitForFunction(() => !document.getElementById("lbMail").hidden && document.getElementById("lbMailN").textContent !== "", null, { timeout: 15000 });
  ck(await page.locator("#lbMailN").textContent() === "3", "B: chấm đỏ phải là 3, thực tế " + await page.locator("#lbMailN").textContent());
  await page.evaluate(([n]) => { OWN.delete(n); store.own = [...OWN]; save(); }, [cardNew]);
  const s0 = await snap(page);
  await page.click("#lbMail");
  await page.waitForSelector("#hthMail.on .hth-it");
  ck(await page.locator("#hthMail .hth-it").count() === 5, "B: phải liệt kê 5 thư");
  const chipsTxt = await page.locator("#hthMail .hth-it").first().locator(".hth-chip").allTextContents();
  const allTxt = await page.locator("#hthMail .body").innerText();
  ck(/\+500 vàng/.test(allTxt) && /\+20 ngọc/.test(allTxt) && /\+50 token/.test(allTxt) && /\+30 điểm nâng cấp/.test(allTxt), "B: thiếu chip quà: " + chipsTxt.join("|"));
  const nmNew = await page.evaluate(k => C[k].n, cardNew);
  ck(allTxt.includes(nmNew), "B: chip phải ghi tên thẻ tiếng Việt " + nmNew);
  ck(/Đã nhận/.test(allTxt) && /Đã hết hạn/.test(allTxt), "B: thiếu nhãn Đã nhận / Đã hết hạn");
  /* mở thư m3: nội dung HTML phải là chữ, không thành thẻ (XSS) */
  await page.locator("#hthMail .hth-hd", { hasText: "Quà sự kiện" }).click();
  ck(await page.locator("#hthMail .hth-bd img").count() === 0, "B: nội dung thư bị dựng thành HTML (XSS)");
  ck(/<img src=x/.test(await page.locator("#hthMail .hth-bd").innerText()), "B: nội dung thư phải hiện nguyên chữ");
  /* nhận m1 (bấm đúp -> chỉ 1 lần gọi, 1 lần cộng) */
  await page.locator("#hthMail .hth-hd", { hasText: "Quà tạ lỗi" }).click();
  await page.locator("#hthMail .hth-claim").dblclick();
  await page.waitForSelector("#hthGain.on");
  const s1 = await snap(page);
  ck(s1.gold === s0.gold + 500 && s1.gems === s0.gems + 20, `B: nhận m1 cộng sai vàng/ngọc ${JSON.stringify(s0)} -> ${JSON.stringify(s1)}`);
  ck(S.count("POST", "/api/mail/claim") === 1, "B: bấm đúp gọi claim " + S.count("POST", "/api/mail/claim") + " lần");
  ck(s1.mg === s0.mg + 1, "B: chưa nhớ id thư đã nhận");
  ck(await page.locator("#lbMailN").textContent() === "2", "B: chấm đỏ sau khi nhận m1 phải là 2");
  await page.click("#hthGain [data-close]");
  /* nhận lại (đóng mở lại) -> không còn nút, không cộng */
  /* nhận tất cả */
  const nb = await page.evaluate(([n, d]) => ({ hasNew: OWN.has(n), hasDup: OWN.has(d) }), [cardNew, cardDup]);
  ck(!nb.hasNew && nb.hasDup, "B: tiền đề thẻ sai");
  await page.click("#hthMail .foot .btn.end");
  await page.waitForSelector("#hthGain.on");
  const s2 = await snap(page);
  ck(s2.gold === s1.gold + 100 && s2.tok === s1.tok + 50 && s2.up === s1.up + 30, `B: nhận tất cả cộng sai ${JSON.stringify(s1)} -> ${JSON.stringify(s2)}`);
  ck(await page.evaluate(k => OWN.has(k) && store.own.includes(k), cardNew), "B: thẻ mới chưa vào bộ sưu tập");
  ck(s2.own === s1.own + 1, "B: thẻ đã có không được cộng thêm");
  ck(/đã có sẵn/i.test(await page.locator("#hthGain .body").innerText()), "B: phải báo thẻ đã có sẵn");
  ck(S.count("POST", "/api/mail/claim") === 3, "B: tổng claim phải 3, thực tế " + S.count("POST", "/api/mail/claim"));
  ck(await page.locator("#lbMailN").textContent() === "", "B: sau nhận hết chấm đỏ phải biến mất");
  ck(await page.locator("#hthMail .foot .btn.end").isDisabled(), "B: Nhận tất cả phải bị vô hiệu khi hết thư");
  await page.click("#hthGain [data-close]"); await page.click("#hthMail [data-close]");
  /* tải lại: máy chủ (giả) cố tình báo m1 chưa nhận + cho phép 200 lặp -> vẫn không cộng lại */
  S.claimed.clear(); S.allowDouble = true; S.mail.forEach(m => { if (m.id !== "m4") m.claimed = false; });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.waitForFunction(() => store.mailGot && store.mailGot.length >= 3);
  await page.waitForFunction(() => !document.getElementById("lbMail").hidden);
  await page.waitForTimeout(600);
  const s3 = await snap(page);
  ck(s3.gold >= s2.gold && s3.mg >= 3, "B: tải lại mất bộ nhớ thư đã nhận " + JSON.stringify(s3));
  ck(await page.locator("#lbMailN").textContent() === "", "B: thư đã nhận (nhớ trong store) vẫn hiện chấm đỏ sau tải lại");
  await page.click("#lbMail"); await page.waitForSelector("#hthMail.on .hth-it");
  ck(await page.locator("#hthMail .hth-claim").count() === 0, "B: không được còn nút Nhận quà cho thư đã nhận");
  const s4 = await snap(page);
  ck(s4.gold === s3.gold && s4.gems === s3.gems && s4.tok === s3.tok, "B: nhận lại làm đổi số dư");
  await page.click("#hthMail [data-close]");

  /* ---- giftcode ---- */
  S.codes = {
    E404: { status: 404, err: "not_found" }, EEXP: { status: 410, err: "expired" }, ENOT: { status: 410, err: "not_started" }, EUSED: { status: 409, err: "used_up" },
    EALR: { status: 409, err: "already" }, ERATE: { status: 429, err: "rate" }, GOOD: { rewards: { vang: 300, ngoc: 5, the: [cardNew] } }
  };
  await page.click("#lbMute"); await page.waitForSelector("#ovSet.on");
  ck(await page.locator("#hthGc").isVisible(), "C: không thấy mục Giftcode trong Cài đặt");
  const gc = async code => { await page.fill("#hthGcIn", code); await page.click("#hthGcBtn"); await page.waitForFunction(() => !document.getElementById("hthGcBtn").disabled && !/Đang kiểm tra/.test(document.getElementById("hthGcMsg").textContent)); return page.locator("#hthGcMsg").textContent(); };
  const expect = { E404: /không tồn tại/, EEXP: /hết hạn/, ENOT: /chưa đến thời gian/, EUSED: /hết lượt/, EALR: /đã đổi mã này rồi/, ERATE: /sai quá nhiều/ };
  const g0 = await snap(page);
  for (const [c, re] of Object.entries(expect)) { const m = await gc(c); ck(re.test(m), `C: mã ${c} báo "${m}"`); }
  ck((await snap(page)).gold === g0.gold, "C: mã lỗi không được cộng quà");
  await page.evaluate(k => { OWN.delete(k); store.own = [...OWN]; }, cardNew);
  const g1 = await snap(page);
  const mOk = await gc("GOOD");
  ck(/thành công/.test(mOk) && /\+300 vàng/.test(mOk), "C: mã đúng báo " + mOk);
  const g2 = await snap(page);
  ck(g2.gold === g1.gold + 300 && g2.gems === g1.gems + 5 && g2.own === g1.own + 1 && g2.cg === g1.cg + 1, "C: mã đúng cộng sai " + JSON.stringify([g1, g2]));
  await page.click("#hthGain [data-close]");
  const n1 = S.count("POST", "/api/giftcode");
  const mAgain = await gc("good");
  ck(/đã đổi mã này rồi/.test(mAgain) && S.count("POST", "/api/giftcode") === n1 && (await snap(page)).gold === g2.gold, "C: đổi lại mã đã dùng phải bị chặn tại máy: " + mAgain);
  ck(/Hãy nhập/.test(await gc("")), "C: ô trống phải báo nhập mã");
  await page.click("#ovSet [data-close]");

  /* ---- chụp ảnh ---- */
  if (SHOTS) {
    await ctx.close();
    for (const [w, h] of [[360, 640], [412, 915], [1280, 720]]) {
      const S2 = mkServer({ ann: anns, mail: mails(cardNew, cardDup) });
      const o = await open(S2, { w, h });
      const pg2 = o.page;
      await pg2.waitForFunction(() => document.getElementById("lbMailN").textContent !== "" && !document.getElementById("hthAnn").hidden, null, { timeout: 15000 });
      await pg2.waitForTimeout(500);
      /* kiểm chồng lấn ở sảnh */
      const ov = await pg2.evaluate(() => {
        const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, sw: e.scrollWidth, cw: e.clientWidth }; };
        const els = ["#lbPass", "#lbMisBtn", "#lbMail", "#hthAnn"].map(R), bad = [];
        for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], b = els[j]; if (a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5) bad.push([i, j]); }
        const sp = document.querySelector("#lbMisBtn span"); const cut = sp.scrollWidth > sp.clientWidth + 1 || sp.getBoundingClientRect().right > document.querySelector("#lbMisBtn").getBoundingClientRect().right + 0.5;
        const m = R("#lbMail"); return { bad, cut, out: m.r > innerWidth + 0.5 };
      });
      ck(!ov.bad.length && !ov.cut && !ov.out, `ẢNH ${w}x${h}: nút sảnh chồng lấn/cắt ${JSON.stringify(ov)}`);
      await pg2.screenshot({ path: path.join(SHOTS, `sanh-${w}x${h}.png`) });
      await pg2.click("#lbMail"); await pg2.waitForSelector("#hthMail.on .hth-it");
      await pg2.locator("#hthMail .hth-hd").first().click(); await pg2.waitForTimeout(250);
      const pov = await pg2.evaluate(() => { const p = document.querySelector("#hthMail .panel").getBoundingClientRect(); const bad = [...document.querySelectorAll("#hthMail .hth-chip, #hthMail .hth-ti, #hthMail .foot .btn")].filter(e => { const r = e.getBoundingClientRect(); return r.right > p.right + 0.5 || r.left < p.left - 0.5; }).length; const f = [...document.querySelectorAll("#hthMail .foot .btn")].map(e => e.scrollWidth > e.clientWidth + 1).some(Boolean); return { bad, f, h: p.height, vh: innerHeight }; });
      ck(!pov.bad && !pov.f && pov.h <= pov.vh + 0.5, `ẢNH ${w}x${h}: lớp phủ hộp thư tràn/cắt ${JSON.stringify(pov)}`);
      await pg2.screenshot({ path: path.join(SHOTS, `hopthu-${w}x${h}.png`) });
      await pg2.click("#hthMail [data-close]");
      await pg2.click("#lbMute"); await pg2.waitForSelector("#ovSet.on");
      await pg2.locator("#hthGc").scrollIntoViewIfNeeded();
      await pg2.fill("#hthGcIn", "THU-NGHIEM"); await pg2.waitForTimeout(250);
      await pg2.screenshot({ path: path.join(SHOTS, `giftcode-${w}x${h}.png`) });
      await o.ctx.close();
    }
  } else await ctx.close();
}

/* ======== D. bị khoá: hộp thông báo, đăng xuất phiên, tiến trình còn nguyên ======== */
for (const [ep, label] of [["/api/ping", "ping"], ["/api/mail", "mail"]]) {
  const S = mkServer({ banOn: ep, ann: [], mail: [] });
  const { ctx, page } = await open(S);
  await page.waitForSelector("#hthBan.on", { timeout: 15000 });
  const t = await page.locator("#hthBan").textContent();
  ck(/Tài khoản đã bị khoá/.test(t) && /Gian lận thử nghiệm/.test(t) && /31\/12\/2026/.test(t) && /17:00/.test(t) && /giờ Việt Nam/.test(t), `D(${label}): hộp báo khoá sai nội dung: ${t.replace(/\s+/g, " ")}`);
  ck(await page.evaluate(() => !LTD_CF.token && !localStorage.getItem("ltd.cf.token")), `D(${label}): chưa đăng xuất phiên online`);
  ck(await page.evaluate(() => !!localStorage.getItem(KEY) && store.gold > 0 && store.own.length > 0), `D(${label}): mất tiến trình trên máy`);
  await page.click("#hthBan [data-close]");
  ck(await page.locator("#lbMail").isHidden(), `D(${label}): nút hộp thư phải ẩn sau khi bị khoá`);
  ck(await page.locator("#lbPlay").isVisible(), `D(${label}): game offline phải còn chơi được`);
  await ctx.close();
}

await browser.close(); server.close();
if (errs.length) { console.log(errs.join("\n")); console.log(`HOPTHU FAIL (${okN} đạt, ${errs.length} lỗi)`); process.exit(1); }
console.log(`HOPTHU OK (${okN} kiểm)`);
