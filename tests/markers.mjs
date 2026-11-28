// m44: HỆ DẤU HIỆU TRẠNG THÁI (12-dau-hieu.js · TT) — mỗi dấu hiệu hiện/tắt đúng theo trạng thái.
// Chạy: CHROME_PATH=/usr/bin/google-chrome NODE_PATH=/opt/npm-tools/node_modules node tests/markers.mjs   (SHOT=1 để chụp ảnh vào tests/artifacts/m44/)
//  zg (Cương Thi Nuốt Sao đánh dấu) · surge (Lôi Quang Tiên) · nhiễm Vi-rút · khiên Phá Sơn (1 & 6 NL) · Sứ Giả + chiến địa của Gã Hái Sao
//  cờ chiến địa Giáp Trừng Phạt · Kích Hoạt (sẵn sàng / đã chọn / đã dùng / chờ lượt sau) · phát sáng điều kiện Lật trên tay (Phù Thuỷ Trẻ, Âu Cơ)
//  Rút Nhanh trên tay · nháy phủ khi hiệu ứng chạm thẻ trên tay · dấu bộ bài (zg / surge)
import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www");
const OUT = process.env.SHOT_OUT || path.join(here, "artifacts", "m44"), SHOT = !!process.env.SHOT;
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
if (SHOT) await mkdir(OUT, { recursive: true });
let bad = 0; const chk = (ok, m) => { console.log((ok ? "  ✓ " : "  ✗ ") + m); if (!ok) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: +(process.env.DPR || 1) });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", x => { if (x.type() === "error" && !/ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY|workers\.dev/.test(x.text())) errors.push("console.error: " + x.text()); });
const shot = async n => { if (!SHOT) return; await sleep(400); await page.screenshot({ path: path.join(OUT, n) }); console.log("    ảnh " + path.join(OUT, n)); };
try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ldr12", { state: "detached", timeout: 180000 });
  await page.evaluate(() => document.getElementById("lbPlay").click());
  await page.waitForFunction(() => typeof G !== "undefined" && G && G.phase === "play", null, { timeout: 60000 });
  await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await page.waitForFunction(() => LVEIL !== G && G.phase === "play" && !document.querySelector(".l47"), null, { timeout: 60000, polling: 100 });
  await sleep(800);
  chk(await page.evaluate(() => !!(window.TT && TT.card && TT.lanes)), "có hệ dấu hiệu trạng thái window.TT");
  /* bàn cố định: 3 chiến địa trung tính, tay/bộ bài theo spec */
  const setBoard = spec => page.evaluate(spec => {
    window.__tmr = window.__tmr || setInterval(() => { try { tLeft = 999; } catch (e) {} }, 400);
    sel = null; look = null; moveSel = null;
    G.q.p = []; G.q.a = []; G.energy.p = spec.energy != null ? spec.energy : 9; G.turn = spec.turn || Math.max(G.turn, 3); G.hand.a = [];
    for (let i = 0; i < 3; i++) { const L = G.locs[i]; L.id = "meadow"; L.rvl = true; L.gone = false; L.cards.p = []; L.cards.a = []; L.lock = { p: 0, a: 0 }; L.flood = 0; }
    const filler = Object.keys(C).filter(k => C[k].t === "none" && !C[k].tok && C[k].c <= 4 && C[k].c > 1);
    const mk = (id, s, x) => { const c = E.mk(G, id === "_" ? filler[(s === "p" ? 0 : 1) % filler.length] : id, s); c.side = s; Object.assign(c, x || {}); return c; };
    const out = { b: {}, h: [], d: [] };
    for (const [li, s, id, x] of spec.board || []) { const c = mk(id, s, Object.assign({ rev: true, turn: 1 }, x || {})); G.locs[li].cards[s].push(c); out.b[id + "@" + li + s] = c.uid; }
    G.hand.p = (spec.hand || []).map(([id, x]) => mk(id, "p", x)); out.h = G.hand.p.map(c => c.uid);
    if (spec.deck) { G.deck.p = spec.deck.map(([id, x]) => mk(id, "p", x)); out.d = G.deck.p.map(c => c.uid); }
    render();
    return out;
  }, spec);
  const card = uid => page.evaluate(u => { const el = document.querySelector(`#board [data-mc="${u}"],#hand [data-hc="${u}"]`); if (!el) return null;
    return { st: [...el.querySelectorAll(".tts")].map(e => e.dataset.tt).join(","), ring: (el.querySelector(".aur") || {}).className || "" }; }, uid);
  const lanesM = () => page.evaluate(() => [...document.querySelectorAll("#board .lane")].map(l => [...l.querySelectorAll(".ttl")].map(e => e.dataset.tt + ":" + e.dataset.side).join(",")));
  const idle = () => page.evaluate(() => new Promise(r => { requestAnimationFrame(() => setTimeout(() => requestAnimationFrame(r), 60)); }));

  // ---------- (1) Cương Thi Nuốt Sao: zg trên tay + bộ bài; mất khi biến đổi ----------
  let st = await setBoard({ board: [[0, "p", "_"], [1, "a", "_"]], hand: [["_", { zg: true }], ["_"]], deck: [["_", { zg: true }], ["_", { zg: true }], ["_"]] });
  await idle();
  let a = await card(st.h[0]), b = await card(st.h[1]);
  chk(/zg/.test(a && a.st) && /aur-zg/.test(a.ring), "thẻ bị Cương Thi đánh dấu trên tay có hào quang zg " + JSON.stringify(a));
  chk(b && !/zg/.test(b.st), "thẻ thường không có zg");
  let dk = await page.evaluate(() => { const e = document.querySelector("#ttDeckP"); return e ? e.textContent + "|" + [...e.querySelectorAll("[data-tt]")].map(x => x.dataset.tt).join(",") : ""; });
  chk(/zg/.test(dk) && /2/.test(dk), "dấu bộ bài: 2 thẻ zg còn trong bộ bài " + dk);
  await shot("1-zg.png");
  const pop = await page.evaluate(() => { document.querySelector("#ttDeckP .ttdk-zg").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const P = document.getElementById("ttPop"); return P && P.classList.contains("on") ? [...P.querySelectorAll(".ttpc")].map(e => e.className.replace("ttpc ", "")).join(",") : ""; });
  chk(pop === "z-deck,z-deck,z-hand", "chạm dấu bộ bài -> bảng đúng các thẻ bị đánh dấu và nơi chúng ở " + pop);
  await shot("1b-zg-pop.png");
  await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  chk(await page.evaluate(() => !document.getElementById("ttPop").classList.contains("on")), "chạm ra ngoài -> đóng bảng");
  await page.evaluate(u => { const c = G.hand.p.find(x => x.uid === u); c.zg = false; render(); }, st.h[0]); await idle();
  a = await card(st.h[0]);
  chk(a && !/zg/.test(a.st), "hết đánh dấu (đã biến đổi) -> tắt hào quang");

  // ---------- (2) Lôi Quang Tiên: surge trên tay + đỉnh bộ bài ----------
  st = await setBoard({ board: [[0, "p", "diennu"]], hand: [["_", { surge: true }]], deck: [["_"], ["_", { surge: true }]] });
  await idle();
  a = await card(st.h[0]);
  chk(/surge/.test(a && a.st), "thẻ mang điện trên tay có dấu surge " + JSON.stringify(a));
  dk = await page.evaluate(() => [...document.querySelectorAll("#ttDeckP [data-tt]")].map(x => x.dataset.tt).join(","));
  chk(/surge/.test(dk), "đỉnh bộ bài mang điện -> dấu ⚡ ở bộ bài " + dk);
  await shot("2-surge.png");

  // ---------- (3) Vi-rút: thẻ bị nhiễm ----------
  st = await setBoard({ board: [[0, "p", "virutcosinh"], [0, "p", "_", { ab: "virutcosinh" }], [0, "p", "_"]] });
  await idle();
  a = await card(st.b["_@0p"]);
  const ids0 = await page.evaluate(() => G.locs[0].cards.p.map(c => c.uid));
  const inf = await Promise.all(ids0.map(card));
  chk(!/infect/.test(inf[0].st) && /infect/.test(inf[1].st) && !/infect/.test(inf[2].st), "chỉ thẻ bị lây nhiễm có hào quang vi-rút " + JSON.stringify(inf.map(x => x.st)));
  await shot("3-virus.png");

  // ---------- (4) Phá Sơn: khiên cho thẻ 1 và 6 năng lượng của mình ----------
  const ids16 = await page.evaluate(() => { const one = Object.keys(C).find(k => C[k].c === 1 && C[k].t === "none" && !C[k].tok), six = Object.keys(C).find(k => C[k].c === 6 && C[k].t === "none" && !C[k].tok), two = Object.keys(C).find(k => C[k].c === 2 && C[k].t === "none" && !C[k].tok); return [one, six, two]; });
  st = await setBoard({ board: [[1, "p", "thachlucnu"], [0, "p", ids16[0]], [2, "p", ids16[1]], [2, "p", ids16[2]], [0, "a", ids16[0]]] });
  await idle();
  let sh = await Promise.all([st.b[ids16[0] + "@0p"], st.b[ids16[1] + "@2p"], st.b[ids16[2] + "@2p"], st.b[ids16[0] + "@0a"]].map(card));
  chk(/shield/.test(sh[0].st) && /shield/.test(sh[1].st) && !/shield/.test(sh[2].st) && !/shield/.test(sh[3].st), "Phá Sơn: khiên cho thẻ 1 & 6 NL của mình, không cho thẻ 2 NL / thẻ địch " + JSON.stringify(sh.map(x => x.st)));
  await shot("4-shield.png");
  await page.evaluate(() => { G.locs[1].cards.p = []; render(); }); await idle();
  sh = await card(st.b[ids16[0] + "@0p"]);
  chk(!/shield/.test(sh.st), "Phá Sơn rời bàn -> tắt khiên");

  // ---------- (5) Gã Hái Sao: Sứ Giả + chiến địa ----------
  st = await setBoard({ board: [[2, "p", "_"]], hand: [["kenuotsaosokhai"]] });
  await page.evaluate(([h, u]) => { G.hand.p.find(c => c.uid === h).her = u; render(); }, [st.h[0], st.b["_@2p"]]); await idle();
  a = await card(st.b["_@2p"]);
  let lm = await lanesM();
  chk(/herald/.test(a.st), "thẻ Sứ Giả có dấu herald " + JSON.stringify(a));
  chk(/herald:p/.test(lm[2]) && !lm[0] && !lm[1], "chiến địa của Sứ Giả có dấu lớn " + JSON.stringify(lm));
  a = await card(st.h[0]);
  chk(/herald/.test(a.st), "Gã Hái Sao trên tay cũng có dấu đã chọn Sứ Giả " + JSON.stringify(a));
  await shot("5-herald.png");

  // ---------- (6) Giáp Trừng Phạt: cờ chiến địa ----------
  st = await setBoard({ board: [[0, "a", "_"]], hand: [["trungphatcogiap", { mk: 1, mkn: 2 }]] });
  await idle();
  lm = await lanesM();
  chk(/mark:p/.test(lm[1]) && !/mark/.test(lm[0] + lm[2]), "Giáp Trừng Phạt đánh dấu chiến địa 2 " + JSON.stringify(lm));
  await shot("6-mark.png");
  await page.evaluate(() => { G.hand.p[0].done = true; render(); }); await idle();
  lm = await lanesM();
  chk(!/mark/.test(lm.join()), "hoàn thành Nhiệm Vụ -> tắt dấu " + JSON.stringify(lm));

  // ---------- (7) Kích Hoạt: sẵn sàng / chờ lượt sau / đã chọn / đã dùng ----------
  st = await setBoard({ turn: 4, board: [[0, "p", "dauvuong", { turn: 2 }], [1, "p", "phuthuydamlay", { turn: 4 }], [2, "p", "xebay", { turn: 1, act: true }], [0, "a", "dauvuong", { turn: 1 }]] });
  await idle();
  let ac = await Promise.all([st.b["dauvuong@0p"], st.b["phuthuydamlay@1p"], st.b["xebay@2p"], st.b["dauvuong@0a"]].map(card));
  chk(/act-ready/.test(ac[0].st), "Kích Hoạt sẵn sàng " + ac[0].st);
  chk(/act-wait/.test(ac[1].st), "vừa đặt lượt này -> chờ lượt sau " + ac[1].st);
  chk(/act-used/.test(ac[2].st), "đã kích hoạt -> dấu đã dùng " + ac[2].st);
  chk(/act-ready/.test(ac[3].st), "thẻ địch chưa kích hoạt cũng hiện sẵn sàng " + ac[3].st);
  await page.evaluate(u => { E.queueAct(G, "p", u); render(); }, st.b["dauvuong@0p"]); await idle();
  ac = await card(st.b["dauvuong@0p"]);
  chk(/act-queued/.test(ac.st), "đã chọn kích hoạt (chờ lật) " + ac.st);
  await shot("7-act.png");

  // ---------- (8) Điều kiện Lật trên tay: Phù Thuỷ Trẻ / Âu Cơ ----------
  st = await setBoard({ turn: 4, board: [[0, "p", "_"]], hand: [["phuthuytre"], ["tocnuhoang"], ["_"]] });
  await page.evaluate(() => { G.cnt.allSpent.p = 3; render(); });
  await page.waitForFunction(() => document.querySelectorAll("#hand .hc.ttc-on").length >= 1, null, { timeout: 8000 }).catch(() => {});
  let cc = await page.evaluate(() => [...document.querySelectorAll("#hand .hc")].map(e => e.classList.contains("ttc-on") ? 1 : 0).join(""));
  chk(cc === "110", "Phù Thuỷ Trẻ (đã dùng hết NL) + Âu Cơ (chiến địa giữa trống) phát sáng; thẻ thường không " + cc);
  await shot("8-cond.png");
  await page.evaluate(() => { G.cnt.allSpent.p = 1; render(); });
  await page.waitForFunction(() => !document.querySelector("#hand .hc.ttc-on[data-hc='" + G.hand.p[0].uid + "']"), null, { timeout: 8000 }).catch(() => {});
  cc = await page.evaluate(() => [...document.querySelectorAll("#hand .hc")].map(e => e.classList.contains("ttc-on") ? 1 : 0).join(""));
  chk(cc === "010", "Phù Thuỷ Trẻ hết điều kiện -> tắt sáng " + cc);

  // ---------- (9) Rút Nhanh + nháy phủ khi hiệu ứng chạm thẻ trên tay ----------
  st = await setBoard({ turn: 4, hand: [["soidomienvien", { dr: 4 }], ["_"]] });
  await idle();
  a = await card(st.h[0]);
  chk(/quick/.test(a.st), "Rút Nhanh đang kích hoạt trên tay " + a.st);
  await page.evaluate(u => { const c = G.hand.p.find(x => x.uid === u); c.bonus += 2; c.cm -= 1; render(); }, st.h[1]); await idle();
  const fl = await page.evaluate(u => { const e = document.querySelector(`#hand [data-hc="${u}"] .tth`); return e ? e.className : ""; }, st.h[1]);
  chk(/tth/.test(fl), "hiệu ứng chạm thẻ trên tay -> lớp phủ nháy " + fl);
  await shot("9-hand.png");

  // ---------- (10) các thẻ theo dõi / đánh dấu khác: Chó Độc (trói tay), Lam Thú (giảm NL lượt sau), Cơ Giáp Nhện (dời được), Ảo Thuật Gia (ảo ảnh)
  //            chiến địa: Cung Thủ Mường (canh), Tiên Dung (×2), Tên Móc (kéo về) ----------
  st = await setBoard({ turn: 4, board: [[0, "p", "thantien", { wait: 5 }], [1, "p", "_", { free: 5 }], [2, "p", "aothuatgia"], [2, "p", "aoanh"]], hand: [["_", { noPlay: 5 }], ["_", { tcm: { t: 5, a: -1 } }], ["_"]] });
  await page.evaluate(() => { const a = G.locs[2].cards.p; a[0].ill = a[1].uid; G.shuri.p = 2; G.grapple.p = 3; render(); }); await idle();
  const hs = await Promise.all(st.h.map(card));
  chk(/lockd/.test(hs[0].st) && /tcm/.test(hs[1].st) && !hs[2].st, "tay: bị trói (không đặt được lượt sau) / giảm NL lượt sau / thẻ thường " + JSON.stringify(hs.map(x => x.st)));
  const fr = await card(st.b["_@1p"]), il = await card(st.b["aoanh@2p"]);
  chk(/free/.test(fr.st), "thẻ dời được lượt sau có dấu " + fr.st);
  chk(/link/.test(il.st), "ảo ảnh của Ảo Thuật Gia có dấu nối " + il.st);
  lm = await lanesM();
  chk(/watch:p/.test(lm[0]) && /x2:p/.test(lm[1]) && /hook:p/.test(lm[2]), "chiến địa: canh (Cung Thủ Mường) / ×2 (Tiên Dung) / kéo về (Tên Móc) " + JSON.stringify(lm));
  await shot("10-khac.png");
  await page.evaluate(() => { G.shuri.p = 0; G.grapple.p = 0; G.turn = 6; render(); }); await idle();
  lm = await lanesM();
  chk(!lm.join(""), "hết hạn -> tắt mọi dấu chiến địa " + JSON.stringify(lm));
  const hs2 = await Promise.all(st.h.map(card));
  chk(!hs2.some(x => /lockd|tcm/.test(x.st)), "hết hạn -> tắt dấu trên tay " + JSON.stringify(hs2.map(x => x.st)));

  // ---------- (11) bộ đếm "cho mỗi …": Xích Long (thẻ trên tay), Ma Sói Rừng (thẻ khác tại đây), Hắc Đao Khách (thẻ địch tại đây) ----------
  st = await setBoard({ turn: 4, board: [[0, "p", "longdo"], [1, "p", "soinu"], [1, "p", "_"], [1, "p", "_"], [2, "p", "ketrungphat"], [2, "a", "_"]], hand: [["_"], ["_"], ["thantho"]], deck: [["_"], ["_"], ["_"], ["_"]] });
  await idle();
  const nOf = uid => page.evaluate(u => { const e = document.querySelector(`#board [data-mc="${u}"] .ttn,#hand [data-hc="${u}"] .ttn`); return e ? e.dataset.n : null; }, uid);
  chk(await nOf(st.b["longdo@0p"]) === "3", "Xích Long đếm 3 thẻ trên tay");
  chk(await nOf(st.b["soinu@1p"]) === "2", "Ma Sói Rừng đếm 2 thẻ khác tại đây");
  chk(await nOf(st.b["ketrungphat@2p"]) === "1", "Hắc Đao Khách đếm 1 thẻ địch tại đây");
  chk(await nOf(st.h[2]) === "4", "Tổ Nghề Rèn trên tay đếm 4 thẻ trong bộ bài");
  chk(await nOf(st.h[0]) === null, "thẻ thường không có bộ đếm");
  await page.evaluate(() => { G.hand.p.pop(); render(); }); await idle();
  chk(await nOf(st.b["longdo@0p"]) === "2", "bớt 1 thẻ trên tay -> Xích Long đếm 2");
  await shot("11-dem.png");
} catch (e) { console.error(e); bad++; }
await browser.close(); server.close();
if (errors.length) { console.log("Lỗi trang:\n  " + errors.slice(0, 8).join("\n  ")); bad += errors.length; }
console.log(bad ? `THẤT BẠI: ${bad} lỗi` : "ĐẠT: markers");
process.exit(bad ? 1 : 0);
