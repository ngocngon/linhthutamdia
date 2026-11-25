import { SELF, env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { vnDay, dayAdd, dayStart } from "../src/ops.js";
import { summarizeSave } from "../src/admin.js";

const A = { "x-admin-token": "test-admin-token-123456", "content-type": "application/json" };
const req = (method, path, body, headers = {}) => SELF.fetch("https://t" + path, { method, headers: { "content-type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
const adm = async (method, path, body) => { const r = await req(method, path, body, A); return { s: r.status, j: await r.json() }; };
let seq = 0;
async function user(prefix = "u", ip) {
  const name = (prefix + (++seq) + Date.now().toString(36).slice(-4)).toLowerCase();
  const r = await req("POST", "/api/register", { username: name, password: "matkhau123", display: "Người " + name }, { "cf-connecting-ip": ip || "30.0." + (seq % 250) + "." + (seq % 200) });
  const j = await r.json();
  expect(r.status).toBe(200);
  const H = { authorization: "Bearer " + j.token, "content-type": "application/json" };
  const call = async (method, path, body) => { const x = await req(method, path, body, H); return { s: x.status, j: await x.json() }; };
  return { id: j.user.id, name, token: j.token, H, call };
}

describe("API game: ping, thông báo", () => {
  it("ping cần đăng nhập, ghi hoạt động theo ngày VN, chuẩn hoá nền tảng", async () => {
    expect((await req("POST", "/api/ping", { v: "1", platform: "web" })).status).toBe(401);
    const u = await user("pg");
    let r = await u.call("POST", "/api/ping", { v: "gpu52", platform: "web" });
    expect(r.s).toBe(200);
    expect(r.j).toEqual({ ok: true });
    await u.call("POST", "/api/ping", { v: "gpu52", platform: "apk" });
    const a = await env.DB.prepare("SELECT * FROM activity WHERE user_id=?").bind(u.id).all();
    expect(a.results.length).toBe(1);
    expect(a.results[0].day).toBe(vnDay(Date.now()));
    expect(a.results[0].pings).toBe(2);
    let x = await env.DB.prepare("SELECT platform, last_version, last_seen FROM users WHERE id=?").bind(u.id).first();
    expect(x.platform).toBe("apk");
    expect(x.last_version).toBe("gpu52");
    expect(x.last_seen).toBeGreaterThan(0);
    await u.call("POST", "/api/ping", { v: "<b>x</b>", platform: "hack" });
    x = await env.DB.prepare("SELECT platform, last_version FROM users WHERE id=?").bind(u.id).first();
    expect(x.platform).toBe("khac");
    expect(x.last_version).not.toContain("<");
  });
  it("ping quá 30 lần/giờ bị chặn", async () => {
    const u = await user("pl");
    for (let i = 0; i < 30; i++) expect((await u.call("POST", "/api/ping", { v: "1", platform: "tester" })).s).toBe(200);
    const r = await u.call("POST", "/api/ping", { v: "1", platform: "tester" });
    expect(r.s).toBe(429);
    const a = await env.DB.prepare("SELECT pings FROM activity WHERE user_id=?").bind(u.id).first();
    expect(a.pings).toBe(30);
  });
  it("thông báo công khai chỉ trả mục trong khung giờ", async () => {
    const now = Date.now();
    const live = await adm("POST", "/api/admin/announcements", { text: "Bảo trì <tối nay>", level: "warn", starts_at: now - 1000, ends_at: now + 3600e3 });
    expect(live.s).toBe(201);
    await adm("POST", "/api/admin/announcements", { text: "Sắp tới", level: "event", starts_at: now + 3600e3 });
    await adm("POST", "/api/admin/announcements", { text: "Đã qua", level: "info", starts_at: now - 7200e3, ends_at: now - 3600e3 });
    expect((await adm("POST", "/api/admin/announcements", { text: "x", level: "boom" })).s).toBe(400);
    const r = await req("GET", "/api/announce");
    expect(r.status).toBe(200);
    const j = await r.json();
    const texts = j.items.map((x) => x.text);
    expect(texts).toContain("Bảo trì tối nay");
    expect(texts).not.toContain("Sắp tới");
    expect(texts).not.toContain("Đã qua");
    expect(Object.keys(j.items[0]).sort()).toEqual(["id", "level", "text"]);
    // sửa, xoá
    expect((await adm("PATCH", "/api/admin/announcements/" + live.j.id, { ends_at: now - 10 })).s).toBe(200);
    expect((await (await req("GET", "/api/announce")).json()).items.map((x) => x.text)).not.toContain("Bảo trì tối nay");
    expect((await adm("DELETE", "/api/admin/announcements/" + live.j.id)).s).toBe(200);
    expect((await adm("DELETE", "/api/admin/announcements/" + live.j.id)).s).toBe(404);
  });
});

describe("API game: thư và quà", () => {
  it("thư riêng + thư tất cả chỉ tới người tạo tài khoản trước khi gửi; nhận một lần", async () => {
    const old = await user("mo");
    const other = await user("mx");
    await new Promise((r) => setTimeout(r, 5));
    const all = await adm("POST", "/api/admin/mail", { to: "all", title: "Quà ra mắt", body: "Cảm ơn\nbạn", rewards: { vang: 1000, ngoc: 50, the: ["quaituong"] }, expires_days: 7 });
    expect(all.s).toBe(201);
    const mine = await adm("POST", "/api/admin/mail", { to: old.id, title: "Bồi thường", rewards: { token: 30 } });
    expect(mine.s).toBe(201);
    await new Promise((r) => setTimeout(r, 5));
    const late = await user("ml");
    const lo = await old.call("GET", "/api/mail");
    expect(lo.s).toBe(200);
    expect(lo.j.items.map((x) => x.id).sort()).toEqual([all.j.id, mine.j.id].sort());
    const it0 = lo.j.items.find((x) => x.id === all.j.id);
    expect(it0).toMatchObject({ title: "Quà ra mắt", body: "Cảm ơn\nbạn", rewards: { vang: 1000, ngoc: 50, the: ["quaituong"] }, claimed: false });
    expect(it0.expires_at).toBeGreaterThan(it0.created_at);
    expect((await other.call("GET", "/api/mail")).j.items.map((x) => x.id)).toEqual([all.j.id]);
    expect((await late.call("GET", "/api/mail")).j.items).toEqual([]);
    // nhận
    const c1 = await old.call("POST", "/api/mail/claim", { id: all.j.id });
    expect(c1.s).toBe(200);
    expect(c1.j).toEqual({ ok: true, rewards: { vang: 1000, ngoc: 50, the: ["quaituong"] } });
    const c2 = await old.call("POST", "/api/mail/claim", { id: all.j.id });
    expect(c2.s).toBe(409);
    expect(c2.j.error).toBe("claimed");
    expect((await old.call("GET", "/api/mail")).j.items.find((x) => x.id === all.j.id).claimed).toBe(true);
    // người tạo sau không nhận được thư tất cả cũ, người khác không nhận được thư riêng
    expect((await late.call("POST", "/api/mail/claim", { id: all.j.id })).s).toBe(404);
    expect((await other.call("POST", "/api/mail/claim", { id: mine.j.id })).s).toBe(404);
    expect((await other.call("POST", "/api/mail/claim", { id: all.j.id })).s).toBe(200);
    // hết hạn
    await env.DB.prepare("UPDATE mail SET expires_at=? WHERE id=?").bind(Date.now() - 1, mine.j.id).run();
    const ex = await old.call("POST", "/api/mail/claim", { id: mine.j.id });
    expect(ex.s).toBe(410);
    expect(ex.j.error).toBe("expired");
    expect((await old.call("GET", "/api/mail")).j.items.map((x) => x.id)).toEqual([all.j.id]);
    // quản trị xem danh sách thư có số người nhận
    const list = await adm("GET", "/api/admin/mail");
    expect(list.j.items.find((x) => x.id === all.j.id).claims).toBe(2);
  });
  it("kiểm phần quà: khoá lạ, vượt trần, id thẻ sai", async () => {
    const u = await user("mr");
    for (const rewards of [{ vang: 1000001 }, { ngoc: 100001 }, { token: 10001 }, { diem: 100001 }, { vang: -1 }, { vang: 1.5 }, { kimcuong: 1 }, { the: ["Hoa Sen"] }, { the: ["a_1"] }, { the: Array.from({ length: 21 }, (_, i) => "the" + i) }, [1]])
      expect((await adm("POST", "/api/admin/mail", { to: u.id, title: "x", rewards })).s).toBe(400);
    expect((await adm("POST", "/api/admin/mail", { to: u.id, title: "x", rewards: { vang: 1000000, ngoc: 100000, token: 10000, diem: 100000, the: ["quaituong"] } })).s).toBe(201);
    expect((await adm("POST", "/api/admin/mail", { to: 999999, title: "x" })).s).toBe(404);
    expect((await adm("POST", "/api/admin/mail", { to: u.id, title: "" })).s).toBe(400);
  });
  it("giftcode: dùng, đã dùng, hết lượt, hết hạn, chưa tới giờ, sai mã", async () => {
    const [a, b, c] = [await user("ga"), await user("gb"), await user("gc")];
    const now = Date.now();
    const g = await adm("POST", "/api/admin/giftcodes", { code: "tet2027", rewards: { vang: 500, the: ["quaituong"] }, max_uses: 2, note: "Tết" });
    expect(g.s).toBe(201);
    expect(g.j.codes).toEqual(["TET2027"]);
    expect((await adm("POST", "/api/admin/giftcodes", { code: "TET2027", rewards: { vang: 1 } })).s).toBe(409);
    expect((await adm("POST", "/api/admin/giftcodes", { code: "RONG", rewards: {} })).s).toBe(400);
    const r1 = await a.call("POST", "/api/giftcode", { code: " tet2027 " });
    expect(r1.s).toBe(200);
    expect(r1.j).toEqual({ ok: true, rewards: { vang: 500, the: ["quaituong"] } });
    const r2 = await a.call("POST", "/api/giftcode", { code: "TET2027" });
    expect([r2.s, r2.j.error]).toEqual([409, "already"]);
    expect((await b.call("POST", "/api/giftcode", { code: "TET2027" })).s).toBe(200);
    const r3 = await c.call("POST", "/api/giftcode", { code: "TET2027" });
    expect([r3.s, r3.j.error]).toEqual([409, "used_up"]);
    const gl = await adm("GET", "/api/admin/giftcodes");
    expect(gl.j.items.find((x) => x.code === "TET2027").uses).toBe(2);
    expect((await adm("GET", "/api/admin/giftcodes/TET2027/redeems")).j.items.length).toBe(2);
    await adm("POST", "/api/admin/giftcodes", { code: "HETHAN", rewards: { ngoc: 1 }, starts_at: now - 7200e3, expires_at: now - 1000 });
    const e1 = await c.call("POST", "/api/giftcode", { code: "HETHAN" });
    expect([e1.s, e1.j.error]).toEqual([410, "expired"]);
    await adm("POST", "/api/admin/giftcodes", { code: "SAPTOI", rewards: { ngoc: 1 }, starts_at: now + 3600e3 });
    const e2 = await c.call("POST", "/api/giftcode", { code: "SAPTOI" });
    expect([e2.s, e2.j.error]).toEqual([410, "not_started"]);
    const n = await c.call("POST", "/api/giftcode", { code: "KHONGCO" });
    expect([n.s, n.j.error]).toEqual([404, "not_found"]);
    // mã ngẫu nhiên
    const rnd = await adm("POST", "/api/admin/giftcodes", { prefix: "ev", count: 3, rewards: { diem: 10 }, max_uses: 1 });
    expect(rnd.j.codes.length).toBe(3);
    for (const k of rnd.j.codes) expect(k).toMatch(/^EV[A-Z2-9]{8}$/);
    expect((await c.call("POST", "/api/giftcode", { code: rnd.j.codes[0] })).s).toBe(200);
    // sửa quà khi đã có người dùng: từ chối
    expect((await adm("PATCH", "/api/admin/giftcodes/TET2027", { rewards: { vang: 1 } })).s).toBe(409);
    expect((await adm("PATCH", "/api/admin/giftcodes/TET2027", { max_uses: 5 })).s).toBe(200);
    expect((await c.call("POST", "/api/giftcode", { code: "TET2027" })).s).toBe(200);
  });
  it("giftcode: quá 10 lần sai/giờ thì 429, kể cả mã đúng", async () => {
    const u = await user("gs");
    await adm("POST", "/api/admin/giftcodes", { code: "DUNGMA", rewards: { vang: 1 } });
    for (let i = 0; i < 10; i++) expect((await u.call("POST", "/api/giftcode", { code: "SAI" + i })).s).toBe(404);
    const r = await u.call("POST", "/api/giftcode", { code: "DUNGMA" });
    expect(r.s).toBe(429);
  });
});

describe("khoá tài khoản", () => {
  it("khoá có thời hạn: mọi API cần đăng nhập trả 403 banned kèm lý do, mở khoá dùng lại được", async () => {
    const u = await user("bn");
    expect((await adm("POST", `/api/admin/players/${u.id}/ban`, { hours: 24 })).s).toBe(400);
    const b = await adm("POST", `/api/admin/players/${u.id}/ban`, { reason: "Gian lận điểm", hours: 24 });
    expect(b.s).toBe(200);
    for (const [m, p, body] of [["GET", "/api/me"], ["POST", "/api/ping", { v: "1", platform: "web" }], ["GET", "/api/mail"], ["POST", "/api/giftcode", { code: "X" }], ["GET", "/api/save"]]) {
      const r = await u.call(m, p, body);
      expect(r.s).toBe(403);
      expect(r.j.error).toBe("banned");
      expect(r.j.reason).toBe("Gian lận điểm");
      expect(r.j.until).toBeGreaterThan(Date.now() + 23 * 3600e3);
    }
    // vẫn đăng nhập lấy được token để client thấy lý do
    const lg = await req("POST", "/api/login", { username: u.name, password: "matkhau123" });
    expect(lg.status).toBe(200);
    // ghép trận bị chặn
    const ws = await SELF.fetch("https://t/api/play", { headers: { upgrade: "websocket", "sec-websocket-protocol": "ltd1, tk." + u.token } });
    expect(ws.status).toBe(401);
    const bans = await adm("GET", "/api/admin/bans");
    expect(bans.j.items.map((x) => x.id)).toContain(u.id);
    expect((await adm("POST", `/api/admin/players/${u.id}/unban`, {})).s).toBe(200);
    expect((await u.call("GET", "/api/me")).s).toBe(200);
    // vĩnh viễn: until null
    await adm("POST", `/api/admin/players/${u.id}/ban`, { reason: "Spam", forever: true });
    const r = await u.call("GET", "/api/me");
    expect([r.s, r.j.error, r.j.until]).toEqual([403, "banned", null]);
    // hết hạn tự mở
    await env.DB.prepare("UPDATE users SET ban_until=? WHERE id=?").bind(Date.now() - 1, u.id).run();
    expect((await u.call("GET", "/api/me")).s).toBe(200);
  });
});

describe("API quản trị", () => {
  it("cần mã quản trị", async () => {
    for (const p of ["/api/admin/players", "/api/admin/flags", "/api/admin/health", "/api/admin/stats/retention", "/api/admin/mail"]) expect((await req("GET", p)).status).toBe(401);
  });
  it("tìm người chơi theo id, tên, tên hiển thị, email; phân trang", async () => {
    const us = [];
    for (let i = 0; i < 5; i++) us.push(await user("tim"));
    await env.DB.prepare("UPDATE users SET google_sub='g-tim', email='timkiem.vui@gmail.com' WHERE id=?").bind(us[2].id).run();
    await adm("POST", `/api/admin/players/${us[1].id}/rename`, { display: "Rồng Lửa 100%" });
    let r = await adm("GET", "/api/admin/players?q=" + us[0].id);
    expect(r.j.items.map((x) => x.id)).toContain(us[0].id);
    r = await adm("GET", "/api/admin/players?q=" + encodeURIComponent("Rồng Lửa"));
    expect(r.j.items.map((x) => x.id)).toEqual([us[1].id]);
    r = await adm("GET", "/api/admin/players?q=" + encodeURIComponent("100%"));
    expect(r.j.items.map((x) => x.id)).toEqual([us[1].id]);
    r = await adm("GET", "/api/admin/players?q=timkiem.vui");
    expect(r.j.items.map((x) => x.id)).toEqual([us[2].id]);
    expect(r.j.items[0].email).toBe("timkiem.vui@gmail.com");
    r = await adm("GET", "/api/admin/players?q=" + us[3].name);
    expect(r.j.items[0].id).toBe(us[3].id);
    r = await adm("GET", "/api/admin/players?q=tim&size=2&page=1");
    expect(r.j.items.length).toBe(2);
    expect(r.j.total).toBeGreaterThanOrEqual(5);
    const p2 = await adm("GET", "/api/admin/players?q=tim&size=2&page=2");
    expect(p2.j.items[0].id).not.toBe(r.j.items[0].id);
    expect(JSON.stringify(r.j)).not.toMatch(/pass_hash|salt|reg_ip/);
    await us[4].call("POST", "/api/ping", { v: "1", platform: "web" });
    r = await adm("GET", "/api/admin/players?filter=online");
    expect(r.j.items.map((x) => x.id)).toContain(us[4].id);
    expect(r.j.items.find((x) => x.id === us[4].id).online).toBe(true);
  });
  it("chi tiết người chơi: số liệu từ bản lưu, hoạt động, trận, không lộ bí mật", async () => {
    const u = await user("ct");
    const store = { gold: 131000, gems: 420, up: 77, tok: 12, name: "Bé Na", own: ["quaituong", "thienduc"], cards: { quaituong: { l: 3 } }, decks: [{ n: "Bộ 1", ids: ["quaituong", "thienduc"] }], cur: 0, st: { g: 12, w: 7 }, avatar: "quaituong", acc: { uid: "bimat" } };
    await u.call("PUT", "/api/save", { blob: JSON.stringify(store), base: 0 });
    await u.call("POST", "/api/ping", { v: "gpu52", platform: "web" });
    const other = await user("ct");
    const t = Date.now();
    await env.DB.prepare("INSERT INTO matches(id,mode,host_uid,guest_uid,winner_uid,outcome,reason,verified,host_delta,guest_delta,started_at,ended_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind("m-ct1", "online", u.id, other.id, u.id, "win", "agreed", 1, 12, -12, t - 60000, t).run();
    const r = await adm("GET", "/api/admin/players/" + u.id);
    expect(r.s).toBe(200);
    expect(r.j.user.username).toBe(u.name);
    expect(r.j.user.online).toBe(true);
    expect(r.j.user.platform).toBe("web");
    expect(r.j.save.summary).toMatchObject({ gold: 131000, gems: 420, up: 77, tok: 12, name: "Bé Na", ownCount: 2, cur: 0, st: { g: 12, w: 7 }, levels: { quaituong: 3 } });
    expect(r.j.save.summary.decks[0]).toEqual({ n: "Bộ 1", ids: ["quaituong", "thienduc"] });
    expect(r.j.activity.length).toBe(1);
    expect(r.j.play.days).toBe(1);
    expect(r.j.matches).toMatchObject({ games: 1, wins: 1, losses: 0 });
    const s = JSON.stringify(r.j);
    expect(s).not.toMatch(/pass_hash|"salt"|bimat|"reg_ip"/);
    const mt = await adm("GET", `/api/admin/players/${u.id}/matches`);
    expect(mt.j.items[0]).toMatchObject({ id: "m-ct1", opp_id: other.id });
    const sv = await adm("GET", `/api/admin/players/${u.id}/save`);
    expect(JSON.parse(sv.j.blob).gold).toBe(131000);
    expect((await adm("GET", "/api/admin/players/999999")).s).toBe(404);
    expect(summarizeSave("không phải json")).toEqual({ error: "bad_json" });
    // dạng bọc thật của game
    const wrapped = JSON.stringify({ v: 1, t: Date.now(), gid: "g1", s: JSON.stringify(store) });
    expect(summarizeSave(wrapped)).toMatchObject({ gold: 131000, gems: 420, ownCount: 2 });
  });
  it("đổi tên, đặt lại mật khẩu, ngắt kết nối; ghi nhật ký quản trị", async () => {
    const u = await user("ng");
    expect((await adm("POST", `/api/admin/players/${u.id}/rename`, { display: "<script>" })).j.display).toBe("script");
    expect((await adm("POST", `/api/admin/players/${u.id}/rename`, { display: "  " })).s).toBe(400);
    expect((await adm("POST", `/api/admin/players/${u.id}/kick`, {})).s).toBe(200);
    expect((await u.call("GET", "/api/me")).s).toBe(401);
    expect((await adm("POST", `/api/admin/players/${u.id}/password`, { password: "123" })).s).toBe(400);
    expect((await adm("POST", `/api/admin/players/${u.id}/password`, { password: "moi-mat-khau" })).s).toBe(200);
    expect((await req("POST", "/api/login", { username: u.name, password: "moi-mat-khau" })).status).toBe(200);
    const lg = await adm("GET", `/api/admin/players/${u.id}/log`);
    expect(lg.j.items.map((x) => x.action)).toEqual(["player.password", "player.kick", "player.rename"]);
    expect(JSON.stringify(lg.j)).not.toContain("moi-mat-khau");
    const all = await adm("GET", "/api/admin/log?q=player.kick");
    expect(all.j.items.some((x) => x.target === "u:" + u.id)).toBe(true);
  });
  it("giữ chân D1/D3/D7/D14/D30 tính đúng trên dữ liệu mẫu", async () => {
    const now = Date.now(), today = vnDay(now);
    const c1 = dayAdd(today, -10), c2 = dayAdd(today, -20);
    const mk = async (name, day) => (await env.DB.prepare("INSERT INTO users(username,display,pass_hash,salt,iters,created_at) VALUES(?,?,'','',0,?)").bind(name, name, dayStart(day) + 3 * 3600e3).run()).meta.last_row_id;
    const act = (uid, day) => env.DB.prepare("INSERT INTO activity(user_id,day,first_ts,last_ts,pings) VALUES(?,?,?,?,1)").bind(uid, day, dayStart(day) + 1000, dayStart(day) + 2000).run();
    // đợt c1: 4 người; D0 cả 4, D1: 3, D3: 2, D7: 1, D14/D30: chưa tới
    const g1 = [];
    for (let i = 0; i < 4; i++) g1.push(await mk("ret1x" + i, c1));
    for (const id of g1) await act(id, c1);
    for (const id of g1.slice(0, 3)) await act(id, dayAdd(c1, 1));
    for (const id of g1.slice(0, 2)) await act(id, dayAdd(c1, 3));
    await act(g1[0], dayAdd(c1, 7));
    await act(g1[1], dayAdd(c1, 8)); // ngày 8 không tính vào D7
    // đợt c2: 2 người; D1: 1, D14: 2
    const g2 = [await mk("ret2x0", c2), await mk("ret2x1", c2)];
    await act(g2[0], dayAdd(c2, 1));
    for (const id of g2) await act(id, dayAdd(c2, 14));
    // người tạo ngoài cửa sổ không tính
    await mk("ret3x0", dayAdd(today, -40));
    const r = await adm("GET", "/api/admin/stats/retention?days=30");
    expect(r.s).toBe(200);
    const row1 = r.j.cohorts.find((x) => x.day === c1), row2 = r.j.cohorts.find((x) => x.day === c2);
    expect(row1.size).toBe(4);
    expect(row1.d).toEqual({ 0: 4, 1: 3, 3: 2, 7: 1, 14: null, 30: null });
    expect(row2.size).toBe(2);
    expect(row2.d).toEqual({ 0: 0, 1: 1, 3: 0, 7: 0, 14: 2, 30: null });
    expect(r.j.cohorts.find((x) => x.day === dayAdd(today, -40))).toBeUndefined();
  });
  it("cờ gian lận: lệch kết quả, điểm bất thường, cùng mạng — chỉ liệt kê", async () => {
    const ip = "44.44.44.44";
    const same = [await user("ip", ip), await user("ip", ip), await user("ip", ip)];
    const x = await user("fx"), y = await user("fy");
    const t = Date.now();
    for (let i = 0; i < 2; i++)
      await env.DB.prepare("INSERT INTO matches(id,mode,host_uid,guest_uid,winner_uid,outcome,reason,verified,host_delta,guest_delta,started_at,ended_at) VALUES(?,?,?,?,NULL,'void','disputed',0,0,0,?,?)").bind("m-fx" + i, "online", x.id, y.id, t - 1000, t).run();
    await env.DB.prepare("INSERT INTO scores(user_id,mode,pkey,pts) VALUES(?,?,?,?)").bind(y.id, "jr", "d" + vnDay(t), 300).run();
    const r = await adm("GET", "/api/admin/flags");
    expect(r.s).toBe(200);
    const k = (kind, uid) => r.j.items.find((f) => f.kind === kind && (f.uid === uid || (f.uids || []).includes(uid)));
    expect(k("match", x.id)).toBeTruthy();
    expect(k("match", y.id)).toBeTruthy();
    expect(k("score", y.id).data.pts).toBe(300);
    expect(k("ip", same[0].id).uids.sort()).toEqual(same.map((u) => u.id).sort());
    expect(JSON.stringify(r.j)).not.toContain(ip);
    expect(r.j.names[x.id].username).toBe(x.name);
    const one = await adm("GET", `/api/admin/players/${y.id}/flags`);
    expect(one.j.items.map((f) => f.kind).sort()).toEqual(["match", "score"]);
    // không tự phạt
    expect((await y.call("GET", "/api/me")).s).toBe(200);
  });
  it("tổng quan, thời gian thực, sức khoẻ, cài đặt", async () => {
    const u = await user("tq");
    await u.call("POST", "/api/ping", { v: "gpu52", platform: "web" });
    const o = await adm("GET", "/api/admin/stats/overview?days=30");
    expect(o.s).toBe(200);
    expect(o.j.totals.users).toBeGreaterThan(0);
    expect(o.j.totals.dau).toBeGreaterThanOrEqual(1);
    expect(o.j.totals.mau).toBeGreaterThanOrEqual(o.j.totals.wau);
    expect(o.j.newPerDay.find((d) => d.d === vnDay(Date.now())).n).toBeGreaterThanOrEqual(1);
    expect(o.j.platforms.find((p) => p.k === "web")).toBeTruthy();
    const rt = await adm("GET", "/api/admin/realtime");
    expect(rt.j.online).toBeGreaterThanOrEqual(1);
    expect(rt.j.players.map((p) => p.id)).toContain(u.id);
    expect(rt.j.measured).toBe(true);
    expect(rt.j.seeking).toBe(0);
    const h = await adm("GET", "/api/admin/health");
    expect(h.s).toBe(200);
    expect(h.j.version).toMatch(/^\d{4}\./);
    expect(h.j.counts.users).toBeGreaterThan(0);
    expect(typeof h.j.d1.avg).toBe("number");
    expect(JSON.stringify(h.j)).not.toContain("test-session-secret");
    const c = await adm("GET", "/api/admin/config");
    expect(c.j).toMatchObject({ registerOpen: true, google: false });
    expect((await adm("PUT", "/api/admin/config", { registerOpen: false })).s).toBe(200);
    expect((await adm("PUT", "/api/admin/config", { registerOpen: true })).s).toBe(200);
    expect((await adm("GET", "/api/admin/log?q=config.register")).j.total).toBeGreaterThanOrEqual(2);
    expect(Object.keys((await adm("GET", "/api/admin/cards")).j.cards).length).toBeGreaterThan(100);
  });
});
