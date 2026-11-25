// Dữ liệu MẪU (giả) để thử trang /admin trên máy: KHÔNG BAO GIỜ chạy với máy chủ thật.
// Ghi vào CSDL D1 cục bộ riêng ở .wrangler/demo (đã .gitignore), tách khỏi dữ liệu chạy thử thường ngày.
//   node scripts/seed-demo.mjs
//   npx wrangler dev --local --port 8787 --persist-to .wrangler/demo
// rồi mở http://localhost:8787/admin với ADMIN_TOKEN trong .dev.vars
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CARDS } from "../src/cards.js";

if (process.argv.includes("--remote")) { console.error("Không chạy dữ liệu mẫu lên máy chủ thật."); process.exit(1); }
const PERSIST = ".wrangler/demo";
const DAY = 864e5, VN = 7 * 3600e3, now = Date.now();
const vnDay = (ts) => new Date(ts + VN).toISOString().slice(0, 10);
const dayStart = (d) => Date.parse(d + "T00:00:00Z") - VN;
const today = vnDay(now);
const dayAdd = (d, n) => new Date(Date.parse(d + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);
let seed = 20261125;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const q = (v) => (v == null ? "NULL" : typeof v === "number" ? String(v) : "'" + String(v).replace(/'/g, "''") + "'");

const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô"];
const TEN = ["Minh", "An", "Bảo", "Linh", "Khánh", "Hà", "Tú", "Nam", "Vy", "Quân", "Thảo", "Long", "Mai", "Phúc", "Hùng", "Trang", "Duy", "Ngọc", "Sơn", "Yến"];
const NICK = ["Rồng Lửa", "Kỳ Lân Xanh", "Phượng Hoàng", "Hổ Bạch", "Rùa Thần", "Sói Đêm", "Cá Chép Vàng", "Hạc Tiên", "Lân Đỏ", "Nghê Đá"];
const ids = Object.keys(CARDS);
const sql = ["DELETE FROM ratings;", "DELETE FROM matches;", "DELETE FROM saves;", "DELETE FROM scores;", "DELETE FROM users;", "DELETE FROM activity;", "DELETE FROM mail;", "DELETE FROM mail_claim;", "DELETE FROM giftcodes;", "DELETE FROM giftcode_redeem;", "DELETE FROM announcements;", "DELETE FROM admin_log;", "DELETE FROM sqlite_sequence;"];

const N = 140, users = [];
for (let i = 1; i <= N; i++) {
  const ageDays = Math.floor(Math.pow(rnd(), 1.25) * 58);
  const created = Math.min(now - 2 * 3600e3, dayStart(dayAdd(today, -ageDays)) + Math.floor(rnd() * 20 * 3600e3));
  const display = rnd() < 0.35 ? pick(NICK) + " " + (10 + i) : pick(HO) + " " + pick(TEN);
  const username = "demo" + String(i).padStart(3, "0");
  const google = rnd() < 0.3;
  const platform = pick(["web", "web", "web", "apk", "apk", "tester"]);
  const ver = pick(["gpu52", "gpu52", "gpu51", "gpu50"]);
  const net = i >= 30 && i <= 33 ? "demo-net-a" : i >= 70 && i <= 72 ? "demo-net-b" : "net" + i;
  const u = { id: i, created, ageDays, display, username, google, platform, ver, net, eng: rnd() };
  users.push(u);
}
// hoạt động: người gắn bó cao chơi nhiều ngày hơn
const act = [];
for (const u of users) {
  const c = vnDay(u.created);
  for (let n = 0; n <= u.ageDays; n++) {
    const pDay = n === 0 ? 0.92 : Math.max(0.04, u.eng * 0.9 * Math.pow(0.93, n) + (u.eng > 0.7 ? 0.25 : 0));
    if (rnd() > pDay) continue;
    const d = dayAdd(c, n), st = dayStart(d) + (8 + Math.floor(rnd() * 13)) * 3600e3 + Math.floor(rnd() * 3600e3);
    const pings = 1 + Math.floor(rnd() * (u.eng > 0.6 ? 26 : 9));
    let last = st + (pings - 1) * 5 * 60e3 + Math.floor(rnd() * 60e3);
    if (d === today) last = Math.min(last, now - Math.floor(rnd() * 3 * 3600e3));
    if (last < st || st > now) continue;
    act.push([u.id, d, st, last, pings]);
    u.last_seen = Math.max(u.last_seen || 0, last);
  }
}
// một nhóm đang online
for (const u of users.filter((x) => x.eng > 0.55).slice(0, 11)) {
  const t = now - Math.floor(rnd() * 5 * 60e3);
  const ex = act.find((a) => a[0] === u.id && a[1] === today);
  if (ex) { ex[3] = t; ex[4] += 2; } else act.push([u.id, today, t - 40 * 60e3, t, 9]);
  u.last_seen = t;
}
for (const u of users) {
  sql.push(`INSERT INTO users(id,username,display,pass_hash,salt,iters,created_at,last_login,google_sub,email,last_version,platform,last_seen,reg_ip) VALUES(${u.id},${q(u.username)},${q(u.display)},'','',0,${u.created},${q(u.last_seen || u.created)},${u.google ? q("g-demo-" + u.id) : "NULL"},${u.google ? q(u.username + "@example.com") : "NULL"},${q(u.last_seen ? u.ver : null)},${q(u.last_seen ? u.platform : null)},${q(u.last_seen || null)},${q(u.net)});`);
}
for (const a of act) sql.push(`INSERT INTO activity VALUES(${a.map(q).join(",")});`);
// khoá
sql.push(`UPDATE users SET ban_until=${now + 3 * DAY}, ban_reason='Gian lận điểm Hành Trình' WHERE id=31;`);
sql.push(`UPDATE users SET ban_until=4102444800000, ban_reason='Dùng công cụ sửa bộ nhớ' WHERE id=72;`);
// bản lưu + Elo + trận
const elo = {};
for (const u of users) {
  if (!u.last_seen) continue;
  const own = ids.filter(() => rnd() < 0.55 + u.eng * 0.4);
  const cards = {};
  for (const k of own) if (rnd() < 0.25 * u.eng + 0.03) cards[k] = { l: 1 + Math.floor(rnd() * 5) };
  const decks = Array.from({ length: 1 + Math.floor(rnd() * 4) }, (_, j) => ({ n: j ? "Bộ " + pick(["Lửa", "Nước", "Rừng", "Đá", "Gió"]) : "Bộ bài 1", ids: Array.from({ length: 12 }, () => pick(own.length ? own : ids)), b: "" }));
  const store = { gems: Math.floor(u.eng * 900), gold: Math.floor(500 + u.eng * 250000 + rnd() * 30000), up: Math.floor(rnd() * 2000), tok: Math.floor(rnd() * 3000), evp: Math.floor(rnd() * 800), name: u.display.slice(0, 12), avatar: pick(ids), own, cards, decks, cur: 0, st: { g: Math.floor(u.eng * 300), w: Math.floor(u.eng * 170) }, gift99: true };
  sql.push(`INSERT INTO saves(user_id,slot,blob,version,updated_at) VALUES(${u.id},'save',${q(JSON.stringify(store))},${1 + Math.floor(rnd() * 80)},${u.last_seen});`);
}
const active = users.filter((u) => u.last_seen && u.eng > 0.3);
for (const u of active) elo[u.id] = { r: 1000, g: 0, w: 0, l: 0, d: 0 };
let mi = 0;
for (let k = 0; k < 420; k++) {
  const a = pick(active), b = pick(active);
  if (a === b) continue;
  const start = Math.max(a.created, b.created) + Math.floor(rnd() * (now - Math.max(a.created, b.created)));
  const end = start + (4 + Math.floor(rnd() * 9)) * 60e3;
  if (end > now) continue;
  const roll = rnd();
  let outcome = "win", reason = "agreed", verified = 1, winner = rnd() < 0.5 + (a.eng - b.eng) * 0.4 ? a.id : b.id;
  if (roll < 0.05) { outcome = "draw"; winner = null; }
  else if (roll < 0.1) { outcome = "forfeit"; reason = pick(["disconnect", "idle"]); }
  else if (roll < 0.14) { outcome = "void"; reason = pick(["disputed", "unconfirmed", "abandoned"]); verified = 0; winner = null; }
  else if (roll < 0.17) { reason = "single_report"; verified = 0; }
  // người chơi 45 hay báo lệch
  const dA = winner === a.id ? 12 : winner === b.id ? -12 : 0;
  sql.push(`INSERT INTO matches VALUES(${q("m-demo" + ++mi)},'online',${a.id},${b.id},${q(winner)},${q(outcome)},${q(reason)},${verified},${dA},${-dA},${start},${end});`);
  if (outcome !== "void") for (const [p, d] of [[a, dA], [b, -dA]]) { const e = elo[p.id]; e.r += d; e.g++; if (winner === p.id) e.w++; else if (winner == null) e.d++; else e.l++; }
}
for (let k = 0; k < 3; k++) sql.push(`INSERT INTO matches VALUES(${q("m-demo-x" + k)},'online',45,${active[k].id},NULL,'void','disputed',0,0,0,${now - (k + 1) * DAY},${now - (k + 1) * DAY + 600e3});`);
for (const [id, e] of Object.entries(elo)) if (e.g) sql.push(`INSERT INTO ratings VALUES(${id},'online',${e.r},${e.g},${e.w},${e.l},${e.d},${now});`);
// điểm chế độ máy theo ngày
for (const a of act) {
  if (rnd() < 0.5) continue;
  const mode = pick(["jr", "wk", "conq", "draft", "rank"]), d = "d" + a[1], m = "m" + a[1].slice(0, 7);
  const pts = Math.min(200, a[4] * 3 + Math.floor(rnd() * 10));
  sql.push(`INSERT INTO scores VALUES(${a[0]},${q(mode)},${q(d)},${pts}) ON CONFLICT DO UPDATE SET pts=pts+excluded.pts;`);
  sql.push(`INSERT INTO scores VALUES(${a[0]},${q(mode)},${q(m)},${pts}) ON CONFLICT DO UPDATE SET pts=pts+excluded.pts;`);
}
sql.push(`INSERT INTO scores VALUES(31,'jr',${q("d" + today)},780) ON CONFLICT DO UPDATE SET pts=780;`);
// thư, giftcode, thông báo, nhật ký
const mails = [[null, "Quà ra mắt máy chủ online", "Cảm ơn bạn đã cùng Linh Thú Tam Địa!\nNhận quà bên dưới.", { vang: 5000, ngoc: 100 }, 20], [null, "Bồi thường bảo trì", "Xin lỗi vì gián đoạn tối qua.", { token: 300, vang: 2000 }, 4], [12, "Quà tester tích cực", "Cảm ơn bạn đã báo lỗi.", { ngoc: 500, the: ids.slice(0, 3) }, 2], [null, "Sự kiện Tết sắp tới", "Chuẩn bị đón sự kiện mới!", {}, 1]];
mails.forEach(([uid, t, b, r, ago], i) => {
  const ts = now - ago * DAY;
  sql.push(`INSERT INTO mail(id,user_id,title,body,rewards,created_at,expires_at,created_by) VALUES(${i + 1},${q(uid)},${q(t)},${q(b)},${q(JSON.stringify(r))},${ts},${ts + 30 * DAY},'admin');`);
  for (const u of users) if ((uid == null ? u.created <= ts : u.id === uid) && u.last_seen > ts && rnd() < 0.8) sql.push(`INSERT INTO mail_claim VALUES(${i + 1},${u.id},${Math.min(now, ts + Math.floor(rnd() * 2 * DAY))});`);
  sql.push(`INSERT INTO admin_log(ts,action,target,detail) VALUES(${ts},'mail.send',${q(uid ? "u:" + uid : "all")},${q(JSON.stringify({ id: i + 1, title: t, rewards: r }))});`);
});
const gcs = [["TET2027", { vang: 10000, ngoc: 200 }, 500, now - 5 * DAY, now + 40 * DAY, "Sự kiện Tết"], ["TESTER01", { token: 500 }, 50, null, null, "Tặng nhóm tester"], ["RAMAT", { vang: 3000 }, 0, now - 30 * DAY, now - DAY, "Ra mắt (đã hết hạn)"], ["XUANMOI", { ngoc: 50, the: [ids[5]] }, 100, now + 5 * DAY, now + 20 * DAY, "Chờ tới giờ"], ["EV7KQ2MZP9", { diem: 100 }, 1, null, null, "Mã một lần"]];
for (const [c, r, mx, st, ex, note] of gcs) {
  const who = users.filter((u) => u.last_seen && rnd() < (c === "TESTER01" ? 0.36 : c === "TET2027" ? 0.5 : c === "RAMAT" ? 0.3 : c === "EV7KQ2MZP9" ? 0.01 : 0)).slice(0, mx || 999);
  sql.push(`INSERT INTO giftcodes VALUES(${q(c)},${q(JSON.stringify(r))},${mx},${who.length},${q(st)},${q(ex)},${q(note)},${now - 6 * DAY});`);
  for (const u of who) sql.push(`INSERT INTO giftcode_redeem VALUES(${q(c)},${u.id},${Math.min(now, Math.max(u.created, now - 4 * DAY))});`);
}
sql.push(`INSERT INTO announcements(text,level,starts_at,ends_at,created_at) VALUES('Bảo trì máy chủ 22:00–22:30 tối nay để cập nhật bản mới.','warn',${now - 3600e3},${now + 8 * 3600e3},${now - 3600e3});`);
sql.push(`INSERT INTO announcements(text,level,starts_at,ends_at,created_at) VALUES('Sự kiện Tết: dùng mã TET2027 để nhận quà!','event',${now + 5 * DAY},${now + 20 * DAY},${now - 2 * DAY});`);
sql.push(`INSERT INTO announcements(text,level,starts_at,ends_at,created_at) VALUES('Chào mừng tới máy chủ online.','info',${now - 20 * DAY},${now - 10 * DAY},${now - 20 * DAY});`);
for (const [a, t, d, ago] of [["player.ban", "u:31", { reason: "Gian lận điểm Hành Trình", until: now + 3 * DAY }, 0.2], ["player.ban", "u:72", { reason: "Dùng công cụ sửa bộ nhớ", until: "vĩnh viễn" }, 1.5], ["player.rename", "u:12", { from: "abc", to: users[11].display }, 3], ["giftcode.create", "giftcode", { codes: ["TET2027"], rewards: { vang: 10000, ngoc: 200 }, max_uses: 500 }, 6], ["config.register", "config", { registerOpen: true }, 9]])
  sql.push(`INSERT INTO admin_log(ts,action,target,detail) VALUES(${Math.floor(now - ago * DAY)},${q(a)},${q(t)},${q(JSON.stringify(d))});`);

const dir = mkdtempSync(join(tmpdir(), "ltd-seed-"));
const file = join(dir, "seed.sql");
writeFileSync(file, sql.join("\n"));
const run = (args) => execFileSync("npx", ["wrangler", "d1", ...args, "--local", "--persist-to", PERSIST], { stdio: ["ignore", "ignore", "inherit"] });
run(["migrations", "apply", "linhthu"]);
run(["execute", "linhthu", "--file", file]);
console.log(`Đã tạo dữ liệu mẫu: ${N} người chơi, ${act.length} ngày hoạt động, ${mi} trận. Chạy: npx wrangler dev --local --port 8787 --persist-to ${PERSIST}`);
