// gpu51: kiểm bộ phát hiệu ứng tình huống theo từng thẻ (FXR, www/js/13-fxr.js) + tiếng riêng S4/S5 chỉ ở nhịp kỹ năng.
// Chạy trong thư mục tests: CHROME_PATH=/usr/bin/google-chrome node fxr-check.mjs   (ảnh so sánh: SHOT_OUT, mặc định /home/claude/shots-gpu51/fxr)
//  (a) bảng FXT khớp dữ liệu thẻ (tools/sinh_fx_the.mjs --kiem); 585/585 thẻ có cấu hình cho MỌI tình huống, hệ ∈ 13 hệ, không thẻ nào rơi về
//      mặc định chung; S4/S5 có ấn ký; thẻ có tiếng riêng khớp the.json; chữ ký (hệ, mô-típ, màu phụ, quỹ đạo, nhịp) không trùng;
//      thẻ xếp hệ theo băm/quy tắc phụ đều có trong tools/fx_he_ra_tay.txt; atlas thiếu ảnh -> dùng hình dự phòng, không lỗi
//  (b) ván thật 412×915, SPD mặc định: mỗi tình huống × 3 hệ chụp ảnh giữa hiệu ứng (ghép 1 ảnh/tình huống) và đo màu chủ đạo khác nhau
//  (c) ván tự chơi với thẻ ±sức mạnh/tiêu huỷ/triệu hồi + S4/S5: mọi luồng sáng ±sức mạnh đi từ đúng thẻ nguồn tới đúng thẻ đích;
//      mọi tiếng riêng "the:<id>" phát đúng ở nhịp kỹ năng của chính thẻ đó (móc SFX_TAP + SFX_BEAT); có tiếng tình huống x_*
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www"), OUT = process.env.SHOT_OUT || "/home/claude/shots-gpu51/fxr";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright-core")); } catch { try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright")); } }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".mp3": "audio/mpeg", ".svg": "image/svg+xml" };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const f = path.join(www, path.normalize(p)); if (!f.startsWith(www)) { res.writeHead(403); return res.end(); }
    const b = await readFile(f); res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); res.end(b);
  } catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
await new Promise(r => server.once("listening", r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const fails = [], fail = m => { fails.push(m); console.error("  LỖI: " + m); };
await mkdir(OUT, { recursive: true });

// ---------- (a) tĩnh ----------
try { console.log("(a) " + execFileSync("node", [path.join(here, "..", "tools", "sinh_fx_the.mjs"), "--kiem"], { encoding: "utf8" }).trim().split("\n").join(" | ")); }
catch (e) { fail("bảng FXT lệch dữ liệu thẻ: " + (e.stdout || "") + (e.stderr || "")); }
const reviewIds = new Set(readFileSync(path.join(here, "..", "tools", "fx_he_ra_tay.txt"), "utf8").split("\n").filter(l => l && !l.startsWith("#")).map(l => l.split("\t")[0]));
const theIdx = JSON.parse(readFileSync(path.join(www, "sfx", "the.json"), "utf8"));

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error" && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY/.test(m.text())) errors.push("console.error: " + m.text()); });
page.on("response", r => { if (r.status() >= 400) errors.push("http " + r.status() + ": " + r.url()); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  const A = await page.evaluate(({ the }) => {
    const ids = Object.keys(C), EL = Object.keys(ELD), bad = [], sig = new Set(), why = {};
    for (const id of ids) {
      const c = FXR.cfg(id);
      if (!c) { bad.push(id + ": thiếu cấu hình"); continue; }
      why[c.why] = (why[c.why] || 0) + 1;
      if (!EL.includes(c.e)) bad.push(id + ": hệ lạ " + c.e);
      for (const k of FXR.SITS) { const s = FXR.sit(id, k); if (!s || s.src !== "the" || !s.c1 || !s.c2 || !s.gl || !s.cell || s.cell !== k + "_" + c.e) bad.push(id + ": tình huống " + k); }
      if ((C[id].h === "S5" || C[id].h === "S4") && !c.em) bad.push(id + ": S4/S5 thiếu ấn ký");
      if (!!the[id] !== c.snd) bad.push(id + ": cờ tiếng riêng lệch the.json");
      sig.add([c.e, c.m, c.c2.toLowerCase(), c.q, c.nh].join());
    }
    return { n: ids.length, fx: FXR.n(), bad, sig: sig.size, why, sits: FXR.SITS.length, rv: ids.filter(id => { const w = FXR.cfg(id).why; return w === "hash" || w === "text"; }) };
  }, { the: theIdx });
  if (A.n !== 585 || A.fx !== 585) fail(`số thẻ có cấu hình ${A.fx}/${A.n}`);
  if (A.bad.length) fail(`${A.bad.length} lỗi cấu hình: ` + A.bad.slice(0, 6).join("; "));
  if (A.sig !== A.n) fail(`chữ ký trùng: ${A.sig} khác nhau / ${A.n}`);
  const miss = A.rv.filter(id => !reviewIds.has(id));
  if (miss.length) fail("thẻ hệ băm/quy tắc phụ chưa có trong fx_he_ra_tay.txt: " + miss.slice(0, 5));
  console.log(`(a) ${A.fx}/${A.n} thẻ có cấu hình đủ ${A.sits} tình huống, 0 rơi mặc định chung; chữ ký khác nhau ${A.sig}; nguồn hệ ${JSON.stringify(A.why)}; cần rà tay ${A.rv.length} (đã liệt kê)`);

  // ---------- vào ván ----------
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 60000 });
  await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.waitForFunction(() => LVEIL !== G && G.phase === "play" && !document.querySelector(".l47") && SFX.loaded() > 50, null, { timeout: 60000, polling: 100 });
  const at = await page.evaluate(() => FXR.atlas());
  if (at.st !== 2 && at.st !== 0) fail("atlas không nạp được chỉ mục (st=" + at.st + ")");
  const spd = await page.evaluate(() => ({ SPD, spd: store.spd, hasFx: SFX.hasFx() }));
  console.log(`(b) SPD=${spd.SPD} (${spd.spd}), sprite tiếng fx: ${spd.hasFx ? "đã nạp" : "CHƯA"}, atlas ảnh: ${at.n} ô (thiếu ảnh -> hình dự phòng)`);
  if (!spd.hasFx) fail("chưa nạp sprite tiếng fx");

  // ---------- (b) ảnh so sánh 3 hệ ----------
  const ELS = ["lua", "nuoc", "moc"];
  const setup = await page.evaluate((ELS) => {
    window.FXR_LOG = true;
    window.__tmr = setInterval(() => { try { tLeft = 999; } catch (e) {} }, 500); /* không để hết giờ lượt trong lúc chụp */
    const pick = (e, used, ok) => Object.keys(C).find(id => !used.has(id) && FXR.cfg(id).e === e && C[id].h === "S3" && (!ok || ok(id)));
    const used = new Set(), src = [], dst = [];
    for (const e of ELS) { const a = pick(e, used); used.add(a); const b = pick(e, used); used.add(b); src.push(a); dst.push(b); }
    for (let i = 0; i < 3; i++) for (const s of ["p", "a"]) G.locs[i].cards[s] = [];
    const put = (id, li, s) => { const c = E.mk(G, id, s); c.side = s; c.rev = true; c.turn = G.turn; G.locs[li].cards[s].push(c); return c.uid; };
    const S = src.map(id => put(id, 0, "p")), D = dst.map(id => put(id, 2, "p"));
    G.hand.p = ELS.map((e, i) => E.mk(G, dst[i], "p"));
    render();
    return { src, dst, S, D, H: G.hand.p.map(c => c.uid) };
  }, ELS);
  await sleep(600);
  const idle = () => page.waitForFunction(() => FXR.nodes() === 0 && !document.querySelector(".fxg,.p8,.dcb") && (typeof FX_UNTIL === "undefined" || performance.now() > FX_UNTIL), null, { timeout: 20000, polling: 50 }).catch(() => {});
  const SHOTS = ["tang", "giam", "ung", "nl", "gia", "huy", "vut", "kich", "trieu", "tao", "hoi"];
  const meta = {}, beamsB = [];
  for (const k of SHOTS) {
    meta[k] = [];
    for (let i = 0, tries = 0; i < 3; i++) {
      await idle(); await sleep(150);
      await page.evaluate(({ k, i, st }) => {
        const S = st.S[i], D = st.D[(i + 1) % 3], W = u => where7(u, null, rects()), sp = W(S), tp = W(D), h = st.H[i], hp = hpt(h), orb = ctr($("orb"));
        FXR.log.length = 0;
        const q = s => q8(s, () => [s.nl ? 0 : T8.LIFT, T8.FLY]), r = s => { const t = q(s); return (t[0] + t[1] * .72) * SPD; };
        switch (k) {
          case "tang": { const s = { k: "up", src: S, dst: D, sp, tp, d: 3 }; run8(s); return r(s); }
          case "giam": { const s = { k: "down", src: S, dst: D, sp, tp, d: -3 }; run8(s); return r(s); }
          case "ung": { const s = { k: "up", src: 0, dst: S, sp: null, tp: sp, d: 1, ong: 1 }; run8(s); return 230 * SPD; }
          case "gia": { const s = { k: "cost", src: S, dst: h, sp, tp: hp, d: -1, hc: h }; run8(s); return r(s) - 20 * SPD; }
          case "nl": FXR.nl(sp, orb, S, 2, { dur: 260 }); return 170 * SPD;
          case "huy": { const r0 = Object.assign({}, W(S), { html: cleanCloneHTML(document.querySelector(`#board [data-mc="${S}"]`)) }); const s = { k: "kill", src: D, dst: S, sp: tp, tp: r0, r0 }; pre8(s); run8(s); setTimeout(() => post8(s), 3000); return r(s) + 140 * SPD; }
          case "vut": discardBeat([{ k: "discard", uid: S, id: st.src[i], side: "p" }], null, D); setTimeout(() => DCB && DCB.skip(false), 300 * SPD); return 520 * SPD;
          case "kich": FXR.kich(sp, S); return 220 * SPD;
          case "trieu": { const s = { k: "summon", src: S, dst: D, sp, tp }; run8(s); return r(s) + 200 * SPD; }
          case "tao": FXR.trieu(hp, h, S, { tao: 1 }); return 260 * SPD;
          case "hoi": FXR.hoi(sp, S, S); return 330 * SPD;
        }
      }, { k, i, st: setup });
      /* chụp theo trạng thái: chờ FXR ghi nhận tình huống rồi mới tính thời điểm giữa hiệu ứng */
      const WANT = { tang: ["beam", 0], giam: ["beam", 0], ung: ["hit", 200], nl: ["nl", 140], gia: ["gia", 130], huy: ["huy", 170], vut: ["vut", 130], kich: ["kich", 220], trieu: ["trieu", 250], tao: ["tao", 260], hoi: ["hoi", 330] };
      await page.evaluate(([w, off]) => new Promise(r => { const t0 = performance.now(); const go = () => { const x = FXR.log.find(e => e.k === w); if (!x && performance.now() - t0 < 6000) return setTimeout(go, 10);
        const ms = x && x.k === "beam" ? (x.dl + x.du * .75) * SPD - (performance.now() - x.t) : off * SPD - (x ? performance.now() - x.t : 0);
        setTimeout(() => { document.getAnimations().forEach(a => { try { a.pause(); } catch (e) {} });
          /* máy bận làm hẹn giờ trễ: đặt hoạt ảnh FXR về đúng khung giữa hiệu ứng (không phụ thuộc độ trễ) */
          const FR = { "fxr-bm": .5, "fxr-hd": .7, "fxr-ht": .35, "fxr-ck": .4, "fxr-ic": .42, "fxr-hy": .32, "fxr-fl": .36, "fxr-sl": .4, "fxr-pt": .42 };
          document.querySelectorAll(".fxr").forEach(el => { const k = Object.keys(FR).find(c => el.classList.contains(c)); if (!k) return; el.getAnimations().forEach(a => { try { const tm = a.effect.getTiming(); a.currentTime = (tm.delay || 0) + tm.duration * FR[k]; } catch (e) {} }); });
          requestAnimationFrame(() => requestAnimationFrame(r)); }, Math.max(0, ms)); }; go(); }), WANT[k]);
      const f = path.join(OUT, `${k}-${ELS[i]}.png`);
      await page.screenshot({ path: f });
      if (k === "tang" || k === "giam") { await sleep(700); beamsB.push(...await page.evaluate(() => FXR.log.filter(x => x.k === "beam" && x.as && x.bs))); }
      const m = await page.evaluate(() => { const L = FXR.log.filter(x => x.k !== "beam" || true); const n = document.querySelectorAll(".fxr").length; document.getAnimations().forEach(a => { try { a.play(); } catch (e) {} }); return { n, e: L.map(x => x.e), k: L.map(x => x.k + (x.kind ? ":" + x.kind : "")) }; });
      /* máy bận làm hẹn giờ trễ -> chụp lỡ lúc hiệu ứng đã tắt: chụp lại (tối đa 3 lần) */
      if (!m.n && ++tries < 3) { i--; continue; }
      tries = 0;
      meta[k].push({ el: ELS[i], f, ...m });
    }
    const es = new Set(meta[k].map(x => x.e[0]));
    if (es.size < 3) fail(`${k}: chỉ ${es.size} hệ khác nhau (${meta[k].map(x => x.e.join("/")).join(" | ")})`);
    if (meta[k].some(x => !x.e.length)) fail(`${k}: có lần không phát FXR (${meta[k].map(x => x.k.join("/")).join(" | ")})`);
  }
  await idle();
  /* ghép ảnh: 3 hệ cạnh nhau cho mỗi tình huống + đo khác biệt màu vùng hiệu ứng */
  const py = `
import sys, json
from PIL import Image, ImageDraw, ImageChops, ImageStat
meta = json.loads(sys.argv[1]); out = sys.argv[2]; res = {}
for k, L in meta.items():
    ims = [Image.open(x["f"]).convert("RGB") for x in L]
    W, H = ims[0].size; s = 0.5
    sheet = Image.new("RGB", (int(W * s) * 3 + 8, int(H * s) + 22), (16, 16, 24)); d = ImageDraw.Draw(sheet)
    for i, (im, x) in enumerate(zip(ims, L)):
        sheet.paste(im.resize((int(W * s), int(H * s))), (i * (int(W * s) + 4), 22)); d.text((i * (int(W * s) + 4) + 6, 4), k + " / " + x["el"], fill=(255, 255, 255))
    sheet.save(out + "/so-sanh-" + k + ".png")
    # khác biệt từng cặp (trung bình độ lệch RGB toàn ảnh): 0 = giống hệt
    dif = [round(sum(ImageStat.Stat(ImageChops.difference(ims[a], ims[b])).mean) / 3, 2) for a, b in ((0, 1), (1, 2), (0, 2))]
    res[k] = dif
print(json.dumps(res))
`;
  const dif = JSON.parse(execFileSync("python3", ["-c", py, JSON.stringify(meta), OUT], { encoding: "utf8" }));
  for (const k in dif) if (Math.min(...dif[k]) < 0.05) fail(`${k}: ảnh hai hệ gần như giống nhau (${dif[k]})`);
  console.log("(b) ảnh 3 hệ (lua/nuoc/moc), độ lệch từng cặp: " + Object.entries(dif).map(([k, v]) => `${k} ${v.join("/")}`).join(", "));
  console.log("    -> " + OUT + "/so-sanh-<tình huống>.png; số nút FXR lúc chụp: " + Object.entries(meta).map(([k, v]) => k + " " + v.map(x => x.n).join("/")).join(", "));

  // ---------- (c) ván tự chơi: luồng nguồn -> đích + tiếng riêng chỉ ở nhịp kỹ năng ----------
  await page.evaluate(() => {
    window.__snd = []; window.__beat = []; FXR.log.length = 0; window.__beams = [];
    window.SFX_TAP = (n, v, o) => window.__snd.push({ n, t: performance.now(), skill: o && o.skill });
    window.SFX_BEAT = (uid, id) => window.__beat.push({ uid, id, t: performance.now() });
    setInterval(() => { for (const x of FXR.log.splice(0)) if (x.k === "beam") window.__beams.push(x); }, 50);
  });
  /* thẻ Lật cộng/trừ sức mạnh cho thẻ KHÁC (để có luồng nguồn -> đích) + thẻ S4/S5 có tiếng riêng */
  const pool = await page.evaluate(() => Object.keys(C).filter(id => C[id].t === "rev" && C[id].h !== "PH" && /(\+|−|-)\s?\d+\s*sức mạnh/.test(C[id].x || "") && /(thẻ khác|các thẻ|một thẻ|1 thẻ|thẻ (của )?(bạn|đối thủ|địch)|mỗi thẻ)/.test(C[id].x || "")));
  console.log(`(c) bộ thẻ tự chơi: ${pool.length} thẻ ±sức mạnh cho thẻ khác`);
  const own = new Set(Object.keys(theIdx));
  const t0 = Date.now(); let lastTurn = -1, g = 0;
  /* tối đa 4 ván / 8 phút; dừng sớm khi đã có đủ mẫu (≥4 luồng ±sức mạnh, ≥2 tiếng riêng) sau ít nhất 2 ván */
  const enough = () => page.evaluate(() => (window.__beams.filter(b => /^(tang|giam|x2)$/.test(b.kind)).length + FXR.log.filter(b => b.k === "beam").length) >= 4 && window.__snd.filter(s => s.n.startsWith("the:")).length >= 2);
  while (Date.now() - t0 < 8 * 60000 && g < 4) {
    /* fix55: lượt đang diễn (TURN_BUSY: lộ diện/rút bài/băng LƯỢT n sau E.startTurn) thì chờ — không chen aiPlan/đổi tay bài giữa nhịp rút bài */
    const ph = await page.evaluate(() => G.phase === "play" && typeof TURN_BUSY !== "undefined" && TURN_BUSY ? "busy" : G.phase);
    if (ph === "over") { g++; if (g >= 4 || (g >= 2 && await enough())) break; await page.evaluate(() => document.getElementById("btnEnd").click()); await page.waitForFunction(() => G.phase === "play", null, { timeout: 30000 }); lastTurn = -1; continue; }
    if (ph === "play") {
      await page.evaluate(({ lt, pool }) => {
        if (G.turn !== lt) for (const s of ["p", "a"]) {
          const e = G.energy[s] || 1; let ok = pool.filter(k => C[k].c <= Math.max(1, Math.ceil(e / 2))); if (!ok.length) ok = [...pool].sort((x, y) => C[x].c - C[y].c).slice(0, 6);
          G.hand[s] = [0, 1, 2].map(i => E.mk(G, ok[(G.turn * 7 + i * 13 + (s === "a" ? 5 : 0)) % ok.length], s));
        }
        E.aiPlan(G, "p", 60); render(); document.getElementById("btnEnd").click();
      }, { lt: lastTurn, pool: pool.concat(Object.keys(theIdx).filter(id => !pool.includes(id)).slice(0, pool.length >> 1)) });
      lastTurn = await page.evaluate(() => G.turn);
    }
    await sleep(250);
  }
  await sleep(1500);
  const R = await page.evaluate(() => { for (const x of FXR.log.splice(0)) if (x.k === "beam") window.__beams.push(x); return { snd: window.__snd, beat: window.__beat, beams: window.__beams, prf: FXR.prf }; });
  console.log(`(c) chi phí CPU của FXR trong ${g} ván (CPU thường): ${R.prf.n} lần gọi, tổng ${R.prf.ms.toFixed(1)} ms, TB ${(R.prf.ms / Math.max(1, R.prf.n)).toFixed(2)} ms/lần, lâu nhất ${R.prf.max.toFixed(1)} ms`);
  const owns = R.snd.filter(s => s.n.startsWith("the:")), xs = R.snd.filter(s => s.n.startsWith("x_"));
  let bad = 0;
  for (const o of owns) { const id = o.n.slice(4); if (o.skill !== id || !R.beat.some(b => b.id === id && o.t - b.t >= -5 && o.t - b.t < 200)) bad++; }
  if (!owns.length) fail("không có tiếng riêng S4/S5 nào trong ván");
  if (bad) fail(`${bad}/${owns.length} tiếng riêng phát NGOÀI nhịp kỹ năng của chính thẻ`);
  if (!xs.length) fail("không có tiếng tình huống x_* nào");
  const xc = {}; for (const s of xs) xc[s.n] = (xc[s.n] || 0) + 1;
  console.log(`(c) tiếng: ${R.beat.length} nhịp kỹ năng, ${owns.length} tiếng riêng (đều đúng nhịp của chính thẻ: ${owns.length - bad}/${owns.length}); tiếng tình huống: ${JSON.stringify(xc)}`);
  const pw = R.beams.filter(b => b.kind === "tang" || b.kind === "giam" || b.kind === "x2").concat(beamsB.map(b => Object.assign(b, { tb: 1 })));
  let wrong = 0, meas = 0;
  for (const b of pw) {
    if (!b.as || !b.bs) continue; meas++;
    const tol = Math.max(14, (b.as.w || 50) * .35), d1 = Math.hypot(b.a.x - b.as.x, b.a.y - b.as.y), d2 = Math.hypot(b.b.x - b.bs.x, b.b.y - b.bs.y);
    if (d1 > tol || d2 > tol) wrong++;
  }
  if (!meas) { fail("ván tự chơi không có luồng ±sức mạnh nào đo được"); console.error(JSON.stringify(pw.slice(0, 2))); }
  if (wrong) { fail(`${wrong}/${meas} luồng ±sức mạnh lệch thẻ nguồn/đích`); console.error(JSON.stringify(pw.slice(0, 3))); }
  const els = new Set(pw.map(b => b.e));
  console.log(`(c) luồng ±sức mạnh: ${pw.length} (${pw.filter(b => !b.tb).length} trong ván tự chơi + ${beamsB.length} ở bước (b)); đo được ${meas}, đúng nguồn -> đích ${meas - wrong}; ${els.size} hệ nguồn khác nhau: ${[...els].join(",")}`);
} catch (e) { fail(e.message); }
await browser.close(); server.close();
if (errors.length) { console.error([...new Set(errors)].slice(0, 10).join("\n")); fails.push("lỗi trang"); }
console.log(fails.length ? "FAIL" : "FXR OK");
process.exit(fails.length ? 1 : 0);
