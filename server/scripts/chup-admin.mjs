// Chụp ảnh trang quản trị (server/admin.html) với API giả lập, ở 1440x900 và 390x844.
// Chạy: node scripts/chup-admin.mjs   (ảnh lưu ở test-artifacts/admin/)
import { createRequire } from "module";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const require = createRequire(process.env.PW_PATH || "/opt/npm-tools/node_modules/");
const { chromium } = require("playwright");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "test-artifacts", "admin");
mkdirSync(OUT, { recursive: true });
const HTML = readFileSync(join(ROOT, "admin.html"), "utf8");
const ORIGIN = "http://admin.test";
const NOW = Date.now(), DAY = 864e5, VN = 7 * 3600e3;
const dayStr = (n) => new Date(NOW + VN - n * DAY).toISOString().slice(0, 10);

// ---------- dữ liệu mẫu đúng hình dạng JSON của src/admin.js ----------
const names = ["Hùng Cường", "Minh Anh", "Bảo Ngọc", "Thanh Tùng", "Lan Phương", "Quốc Khánh", "Thu Hà", "Đức Mạnh", "Ngọc Trâm", "Việt Hoàng", "Khánh Linh", "Gia Bảo"];
const mkUser = (i) => ({ id: 100 + i, username: "nguoichoi" + i, display: names[i % names.length] + (i > 11 ? " " + i : ""), email: i % 3 === 0 ? "u" + i + "@gmail.com" : null, created_at: NOW - (i * 2 + 1) * DAY, last_seen: i % 4 === 0 ? NOW - 60e3 * (i + 1) : NOW - i * 3600e3 * 5, last_login: NOW - i * 3600e3, platform: ["web", "apk", "tester"][i % 3], last_version: "1.4." + (i % 5), disabled: 0, ban_until: i === 5 ? NOW + 3 * DAY : null, ban_reason: i === 5 ? "gian lận điểm" : null, rating: 1000 + (30 - i) * 23, games: 40 - i, wins: 20 - (i % 7) });
const users = Array.from({ length: 24 }, (_, i) => mkUser(i)).map((u) => ({ ...u, online: u.last_seen > NOW - 360e3, banned: !!u.ban_until }));
const days60 = Array.from({ length: 60 }, (_, i) => dayStr(59 - i));
const overview = (days) => {
  const ds = days60.slice(60 - days);
  return { ok: true, days, from: ds[0], today: ds[ds.length - 1],
    totals: { users: 1842, banned: 3, online: 37, new_today: 14, google: 612, dau: 211, wau: 640, mau: 1180 },
    newPerDay: ds.map((d, i) => ({ d, n: 8 + ((i * 7) % 13) + (i > ds.length - 30 ? 6 : 0) })),
    dauPerDay: ds.map((d, i) => ({ d, n: 120 + ((i * 11) % 40) + i, ms: (900 + i * 13) * 6e4 })),
    matchesPerDay: ds.flatMap((d, i) => [{ d, mode: "online", n: 60 + ((i * 5) % 30) + i }, { d, mode: "rank", n: 20 + ((i * 3) % 12) }]),
    outcomes: [{ outcome: "win", reason: "agreed", n: 3100 }, { outcome: "win", reason: "single_report", n: 410 }, { outcome: "void", reason: "abandoned", n: 120 }, { outcome: "draw", reason: "agreed", n: 80 }, { outcome: "forfeit", reason: "disconnect", n: 60 }],
    scoresPerDay: ds.flatMap((d, i) => [{ d, mode: "jr", pts: 300, players: 40 + (i % 9) }, { d, mode: "wk", pts: 200, players: 22 + (i % 5) }]),
    platforms: [{ k: "apk", n: 820 }, { k: "web", n: 540 }, { k: "tester", n: 31 }, { k: "chưa rõ", n: 12 }],
    versions: [{ k: "1.4.4", n: 700 }, { k: "1.4.3", n: 380 }, { k: "1.4.2", n: 190 }, { k: "chưa rõ", n: 30 }],
    topElo: users.slice(0, 12).map((u) => ({ id: u.id, display: u.display, rating: u.rating, games: u.games, wins: u.wins, losses: u.games - u.wins, draws: 0 })),
    avgPlayMs: 38 * 60e3 };
};
const retention = { ok: true, days: 60, today: dayStr(0), cols: [0, 1, 3, 7, 14, 30],
  cohorts: Array.from({ length: 14 }, (_, i) => { const size = 10 + (i * 3) % 17; const d = {}; [0, 1, 3, 7, 14, 30].forEach((n) => { d[n] = n > i ? null : Math.round(size * Math.max(0.05, 0.95 - n * 0.03)); }); return { day: dayStr(i), size, d }; }),
  total: { 0: { ret: 200, base: 230, pct: 87 }, 1: { ret: 90, base: 220, pct: 40.9 }, 3: { ret: 60, base: 200, pct: 30 }, 7: { ret: 40, base: 180, pct: 22.2 }, 14: null, 30: null } };
const flags = { ok: true, thresholds: { disputed: 2, soloWins: 2, unverified: 3, scoreDay: 240, scoreOutlier: 10, scoreNearCap: 25, sameIp: 3 }, names: { 105: { display: "Thu Hà", username: "nguoichoi5" }, 103: { display: "Thanh Tùng", username: "x" }, 101: { display: "Minh Anh", username: "y" } },
  items: [{ kind: "match", uid: 105, level: "cao", text: "4 trận hai bên báo lệch kết quả; 2 trận tự báo thắng khi đối thủ không báo" }, { kind: "score", uid: 103, level: "vừa", text: "Điểm tự báo ngày 2026-11-20: 310 (gấp 12 lần trung vị 25)" }, { kind: "rate", uid: 101, level: "vừa", text: "Gửi điểm 27 lần trong một phút (trần 30)" }, { kind: "ip", uid: 101, uids: [101, 103, 105, 107], level: "cao", text: "5 tài khoản đăng ký từ cùng một mạng" }] };
const rewards = { vang: 5000, ngoc: 50, the: ["card_a"] };
const mails = Array.from({ length: 6 }, (_, i) => ({ id: 50 - i, user_id: i % 3 === 0 ? 101 : null, to_name: "Minh Anh", title: ["Quà bảo trì", "Chào mừng", "Tạ lỗi sự cố", "Thưởng sự kiện Tết", "Quà tri ân", "Cập nhật 1.4"][i], body: "Nội dung", rewards: i % 2 ? { vang: 1000 } : rewards, created_at: NOW - i * DAY, expires_at: NOW + (20 - i) * DAY, claims: 80 - i * 9, recipients: i % 3 === 0 ? 1 : 1800 }));
const gifts = Array.from({ length: 9 }, (_, i) => ({ code: ["TET2027", "EVABCD12", "EVQ7X9KM", "WELCOME", "BETA100", "NOEL26", "VIP2026", "TANTHU", "QUATANG"][i], rewards: i % 2 ? { ngoc: 100 } : rewards, max_uses: i % 3 ? 500 : 0, uses: i * 53, starts_at: i === 4 ? NOW + DAY : null, expires_at: i === 2 ? NOW - DAY : NOW + 30 * DAY, note: i % 2 ? "sự kiện Tết" : "", created_at: NOW - i * DAY }));
const ann = [{ id: 3, text: "Bảo trì máy chủ 22:00–22:30 tối nay", level: "warn", starts_at: null, ends_at: NOW + DAY, created_at: NOW, live: true }, { id: 2, text: "Sự kiện Tết bắt đầu từ ngày mai", level: "event", starts_at: NOW + DAY, ends_at: null, created_at: NOW, live: false }, { id: 1, text: "Chào mừng đến Linh Thú Tam Địa", level: "info", starts_at: null, ends_at: NOW - DAY, created_at: NOW - 9 * DAY, live: false }];
const logs = Array.from({ length: 12 }, (_, i) => ({ id: 99 - i, ts: NOW - i * 3600e3 * 7, action: ["player.ban", "mail.send", "giftcode.create", "player.kick", "config.register", "announce.create"][i % 6], target: i % 6 === 1 ? "all" : i % 6 === 2 ? "giftcode" : "u:10" + (i % 5), detail: JSON.stringify(i % 6 === 0 ? { reason: "gian lận điểm", until: NOW + DAY } : i % 6 === 1 ? { id: 7, title: "Quà bảo trì", rewards } : { note: "ok" }) }));
const player = (id) => { const u = users.find((x) => x.id === id) || users[0]; return { ok: true,
  user: { ...u, token_ver: 0, last_seen: u.last_seen, google: 1, has_pw: 1, has_reg_ip: 1, ban: u.banned ? { reason: u.ban_reason, until: u.ban_until } : null },
  ratings: [{ mode: "online", rating: u.rating, games: u.games, wins: u.wins, losses: 5, draws: 1, updated_at: NOW }],
  activity: Array.from({ length: 40 }, (_, i) => ({ day: dayStr(i + (i % 3 ? 0 : 1)), first_ts: NOW - i * DAY - 3600e3 * 2, last_ts: NOW - i * DAY - (i % 4) * 900e3, pings: 3 + i % 17 })).filter((_, i) => i % 2 === 0),
  play: { days: 31, pings: 420, ms: 3 * 3600e3 * 31, firstDay: dayStr(40) },
  save: { version: 12, updated_at: NOW - 3600e3, size: 5400, summary: { name: u.display, gold: 12840, gems: 230, up: 18, tok: 41, evp: 5, own: ["card_a", "card_b", "card_c"], ownCount: 3, levels: { card_a: 4, card_b: 2 }, decks: [{ n: "Bộ chủ lực", ids: ["card_a", "card_b", "card_c"] }], cur: 0, st: { g: 120, w: 77 } } },
  matches: { games: 38, wins: 20, losses: 16, draws: 2, voids: 1 }, mail: { personal: 3, claimed: 9 }, giftcodes: 4, scores: [{ mode: "jr", pts: 1200 }, { mode: "wk", pts: 640 }], sameIp: 2, flags: id === 105 ? 3 : 0 }; };
const CARDS = { card_a: ["Rồng Lửa", 3, 5], card_b: ["Hổ Thần", 2, 4], card_c: ["Rùa Vàng", 1, 2] };
const health = { ok: true, version: "2026.11.26", now: NOW, d1: { ms: [12.4, 9.8, 11.1], avg: 11.1 }, durableObjectMs: 34,
  counts: { users: 1842, ratings: 900, scores: 5200, matches: 4100, saves: 1700, activity: 30210, mail: 52, mail_claim: 8100, giftcodes: 9, giftcode_redeem: 1400, announcements: 3, admin_log: 220, auth_fail: 4, config: 1 },
  migrations: [{ name: "0001_init.sql", applied_at: "2026-10-01 10:00:00" }, { name: "0002_ops.sql", applied_at: "2026-10-20 10:00:00" }], saves: { bytes: 9400000, max: 21000 },
  config: { google: true, sessionSecret: true, registerOpen: true, allowedOrigins: ["https://tamdia.pages.dev"] } };
const realtime = { ok: true, online: 37, players: users.filter((u) => u.online).map((u) => ({ id: u.id, display: u.display, platform: u.platform, last_version: u.last_version, last_seen: u.last_seen })), lobby: 12, seeking: 3, inMatch: 8, measured: true, recentMatches: 21, note: "Đang trong trận = trận ghép trong 30 phút qua mà chưa có kết quả (ước tính)." };
const page = (url, items) => { const sz = +url.searchParams.get("size") || 20, pg = +url.searchParams.get("page") || 1; return { ok: true, total: items.length, page: pg, size: sz, items: items.slice((pg - 1) * sz, pg * sz) }; };

// mode: "ok" | "empty" | "error"
function handler(mode) {
  return (route) => {
    const req = route.request(), url = new URL(req.url()), p = url.pathname, m = req.method();
    const J = (o, st = 200) => route.fulfill({ status: st, contentType: "application/json", body: JSON.stringify(o) });
    if (req.headers()["x-admin-token"] !== "token-thu") return J({ ok: false, error: "unauthorized", message: "Sai mã quản trị" }, 401);
    if (m !== "GET") return J({ ok: true, id: 1, codes: ["EVAB12CD"], until: null, display: "x", registerOpen: true });
    if (p === "/api/admin/online") return J({ ok: true, online: 37, version: "2026.11.26" });
    if (p === "/api/admin/cards") return J({ ok: true, cards: CARDS });
    if (p === "/api/admin/config") return J({ ok: true, registerOpen: true, google: true, googleClientId: "123456-abc.apps.googleusercontent.com", version: "2026.11.26" });
    if (mode === "error" && !/online|cards|config/.test(p)) return J({ ok: false, error: "server", message: "Lỗi 500: cơ sở dữ liệu tạm thời không phản hồi" }, 500);
    const E = mode === "empty";
    if (p === "/api/admin/stats/overview") { const o = overview(+url.searchParams.get("days") || 30); if (E) Object.assign(o, { newPerDay: [], dauPerDay: [], matchesPerDay: [], outcomes: [], scoresPerDay: [], platforms: [], versions: [], topElo: [], totals: { users: 0, banned: 0, online: 0, new_today: 0, google: 0, dau: 0, wau: 0, mau: 0 }, avgPlayMs: 0 }); return J(o); }
    if (p === "/api/admin/stats/retention") return J(E ? { ...retention, cohorts: [], total: {} } : retention);
    if (p === "/api/admin/players") { const q = (url.searchParams.get("q") || "").toLowerCase(); let l = users.filter((u) => !q || (u.display + u.username + u.id).toLowerCase().includes(q)); const f = url.searchParams.get("filter"); if (f === "online") l = l.filter((u) => u.online); return J(E ? page(url, []) : page(url, l)); }
    if (p === "/api/admin/bans") return J({ ok: true, items: E ? [] : users.filter((u) => u.banned).map((u) => ({ id: u.id, username: u.username, display: u.display, disabled: 0, ban_until: u.ban_until, ban_reason: u.ban_reason, last_seen: u.last_seen })).concat([{ id: 130, username: "cheater", display: "Kẻ gian lận", disabled: 0, ban_until: 4102444800000, ban_reason: "dùng phần mềm thứ ba", last_seen: NOW - 9 * DAY }]) });
    let mm;
    if ((mm = /^\/api\/admin\/players\/(\d+)\/(\w+)$/.exec(p))) { const sub = mm[2];
      if (sub === "matches") return J(E ? page(url, []) : page(url, Array.from({ length: 25 }, (_, i) => ({ id: i, mode: "online", host_uid: +mm[1], guest_uid: 101 + (i % 5), winner_uid: i % 3 ? +mm[1] : 101, outcome: i === 4 ? "void" : "win", reason: ["agreed", "single_report", "disputed"][i % 3], verified: i % 3 !== 2 ? 1 : 0, host_delta: i % 2 ? 12 : -9, guest_delta: 9, started_at: NOW - i * 3600e3 * 3 - 600e3, ended_at: NOW - i * 3600e3 * 3, opp_id: 101 + (i % 5), opp_name: names[i % 5] }))));
      if (sub === "mail") return J({ ok: true, items: E ? [] : mails.map((x) => ({ ...x, claimed_at: x.id % 2 ? NOW - DAY : null })), giftcodes: E ? [] : [{ code: "TET2027", ts: NOW - DAY, rewards }] });
      if (sub === "log") return J({ ok: true, items: E ? [] : logs.slice(0, 4) });
      if (sub === "flags") return J({ ...flags, items: E ? [] : flags.items.slice(0, 2) });
      if (sub === "save") return J({ ok: true, blob: JSON.stringify({ gold: 1 }), version: 1, updated_at: NOW }); }
    if ((mm = /^\/api\/admin\/players\/(\d+)$/.exec(p))) return J(player(+mm[1]));
    if (p === "/api/admin/mail") return J(E ? page(url, []) : page(url, mails));
    if (p === "/api/admin/giftcodes") return J({ ok: true, items: E ? [] : gifts });
    if (/redeems$/.test(p)) return J({ ok: true, total: 2, items: [{ user_id: 101, ts: NOW, display: "Minh Anh" }] });
    if (p === "/api/admin/announcements") return J({ ok: true, items: E ? [] : ann });
    if (p === "/api/admin/flags") return J(E ? { ...flags, items: [] } : flags);
    if (p === "/api/admin/realtime") return J(E ? { ...realtime, online: 0, players: [], measured: false } : realtime);
    if (p === "/api/admin/health") return J(health);
    if (p === "/api/admin/log") return J(E ? page(url, []) : page(url, logs));
    return J({ ok: false, error: "not_found" }, 404);
  };
}

const SCREENS = [["tong-quan", "#/tong-quan"], ["tra-cuu", "#/tra-cuu"], ["tra-cuu-loc", "#/tra-cuu?q=an"], ["nguoi-choi", "#/p/105"], ["nguoi-choi-tien-trinh", "#/p/105/tien-trinh"], ["nguoi-choi-tran", "#/p/105/tran"], ["nguoi-choi-thu", "#/p/105/thu"], ["nguoi-choi-nhat-ky", "#/p/105/nhat-ky"], ["nguoi-choi-co", "#/p/105/co"],
  ["khoa", "#/khoa"], ["co", "#/co"], ["tao", "#/tao"], ["thu", "#/thu"], ["giftcode", "#/giftcode"], ["thong-bao", "#/thong-bao"], ["cai-dat", "#/cai-dat"],
  ["realtime", "#/realtime"], ["dau", "#/dau"], ["giu-chan", "#/giu-chan"], ["tran", "#/tran"], ["nen-tang", "#/nen-tang"], ["suc-khoe", "#/suc-khoe"], ["nhat-ky", "#/nhat-ky"]];
const errors = [];
const browser = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", args: ["--no-sandbox"] });
async function open(vw, vh, tag, mode) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" });
  await ctx.route(ORIGIN + "/admin", (r) => r.fulfill({ contentType: "text/html; charset=utf-8", body: HTML }));
  await ctx.route(ORIGIN + "/api/admin/**", handler(mode));
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(tag + ": " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/status of 500|401|favicon/.test(m.text())) errors.push(tag + " console: " + m.text()); });
  return { ctx, page };
}
async function settle(page) { await page.waitForFunction(() => !document.querySelector("#view [aria-label='Đang tải']"), null, { timeout: 15000 }); await page.waitForTimeout(350); }
async function overflow(page, tag, name) {
  const over = await page.evaluate(() => { const w = document.documentElement.clientWidth; const bad = []; if (document.documentElement.scrollWidth > w + 1) bad.push("trang cuộn ngang " + document.documentElement.scrollWidth + ">" + w); for (const e of document.querySelectorAll("#view *")) { const r = e.getBoundingClientRect(); if (r.width && r.right > w + 1 && !e.closest(".tw,.tabs,.dwrap")) { bad.push(e.tagName + "." + e.className + " " + (e.textContent || "").slice(0, 24)); if (bad.length > 4) break; } } return bad; });
  if (over.length) errors.push(tag + " " + name + " tràn: " + over.join(" | "));
}
for (const [vw, vh, tag] of [[1440, 900, "pc"], [390, 844, "dt"]]) {
  // đăng nhập thật qua biểu mẫu
  let { ctx, page } = await open(vw, vh, tag, "ok");
  await page.goto(ORIGIN + "/admin");
  await page.screenshot({ path: `${OUT}/${tag}-dang-nhap.png` });
  await page.fill("#ltok", "sai"); await page.click("#lform button[type=submit]"); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${tag}-dang-nhap-sai.png` });
  await page.fill("#ltok", "token-thu"); await page.click("#lform button[type=submit]"); await settle(page);
  if (await page.evaluate(() => sessionStorage.getItem("ltd.admin.tok")) !== "token-thu") errors.push(tag + ": token không vào sessionStorage");
  if (await page.evaluate(() => localStorage.getItem("ltd.admin.tok"))) errors.push(tag + ": token lọt vào localStorage");
  for (const [name, hash] of SCREENS) {
    await page.evaluate((h) => { location.hash = h; }, hash); await settle(page);
    await overflow(page, tag, name);
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png`, fullPage: true });
  }
  // hộp thoại xác nhận
  await page.evaluate(() => { location.hash = "#/thu"; }); await settle(page);
  await page.fill("#view input[placeholder^='Ví dụ: Quà']", "Quà bảo trì"); await page.fill("#view input[type=number][placeholder='0'] >> nth=0", "5000");
  await page.click("#view form button.btn.pri"); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/${tag}-xac-nhan-thu.png` }); await page.keyboard.press("Escape");
  await page.evaluate(() => { location.hash = "#/giftcode"; }); await settle(page);
  await page.fill("#view input[type=number][placeholder='0'] >> nth=0", "5000"); await page.click("#view form button.btn.pri"); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/${tag}-xac-nhan-giftcode.png` }); await page.keyboard.press("Escape");
  await page.evaluate(() => { location.hash = "#/p/101"; }); await settle(page);
  await page.click("#view .pact button.red"); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/${tag}-xac-nhan-khoa.png` }); await page.keyboard.press("Escape");
  // tìm kiếm gợi ý
  await page.fill("#q", "an"); await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${tag}-tim-nhanh.png` });
  await page.fill("#q", ""); await page.keyboard.press("Escape");
  if (tag === "dt") { await page.evaluate(() => { location.hash = "#/tong-quan"; }); await settle(page); await page.click("#burger"); await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/dt-menu.png` }); }
  await ctx.close();
  // trạng thái rỗng và lỗi
  for (const mode of ["empty", "error"]) {
    ({ ctx, page } = await open(vw, vh, tag, mode));
    await page.addInitScript(() => sessionStorage.setItem("ltd.admin.tok", "token-thu"));
    await page.goto(ORIGIN + "/admin#/tong-quan"); await settle(page);
    for (const [name, hash] of mode === "empty" ? [["tong-quan", "#/tong-quan"], ["tra-cuu", "#/tra-cuu"], ["giftcode", "#/giftcode"], ["khoa", "#/khoa"], ["co", "#/co"], ["nhat-ky", "#/nhat-ky"], ["giu-chan", "#/giu-chan"]] : [["tong-quan", "#/tong-quan"], ["tra-cuu", "#/tra-cuu"]]) {
      await page.evaluate((h) => { location.hash = h; }, hash); await settle(page); await overflow(page, tag, mode + "-" + name);
      await page.screenshot({ path: `${OUT}/${tag}-${mode}-${name}.png`, fullPage: true });
    }
    await ctx.close();
  }
  // trạng thái đang tải (chậm)
  ({ ctx, page } = await open(vw, vh, tag, "ok"));
  await ctx.unroute(ORIGIN + "/api/admin/**");
  const base = handler("ok");
  await ctx.route(ORIGIN + "/api/admin/**", async (r) => { if (/overview/.test(r.request().url())) await new Promise((x) => setTimeout(x, 1500)); return base(r); });
  await page.addInitScript(() => sessionStorage.setItem("ltd.admin.tok", "token-thu"));
  await page.goto(ORIGIN + "/admin#/tong-quan"); await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${tag}-dang-tai.png` });
  await ctx.close();
}
await browser.close();
console.log(errors.length ? "CẢNH BÁO:\n" + errors.join("\n") : "không có lỗi trang");
