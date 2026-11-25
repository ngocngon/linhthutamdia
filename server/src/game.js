// API cho game (hợp đồng cố định với client): ping hoạt động, thông báo, thư/quà, giftcode.
import { json, err, readJson, cleanName } from "./util.js";
import { vnDay, parseRewards, rateHit } from "./ops.js";

const PLATFORMS = ["web", "apk", "tester"];
export const PING_MAX = 30, PING_WIN = 3600 * 1000;
export const GC_FAIL_MAX = 10, GC_FAIL_WIN = 3600 * 1000;
export const GC_RE = /^[A-Z0-9_-]{3,32}$/;

// Thông báo đang trong khung giờ (công khai)
export async function announce(env, now = Date.now()) {
  const rs = await env.DB.prepare("SELECT id, text, level FROM announcements WHERE (starts_at IS NULL OR starts_at<=?1) AND (ends_at IS NULL OR ends_at>?1) ORDER BY id DESC LIMIT 20").bind(now).all();
  return json({ ok: true, items: rs.results });
}

// Các API game cần đăng nhập; trả null nếu không khớp đường dẫn
export async function gameApi(request, env, url, user) {
  const path = url.pathname, m = request.method;

  if (path === "/api/ping" && m === "POST") {
    const b = await readJson(request, 2048);
    const now = Date.now();
    const lim = await rateHit(env, "pg:" + user.id, PING_MAX, PING_WIN, { now });
    if (!lim.ok) return err(429, "too_many", "Ping quá nhiều");
    const v = cleanName(typeof b.v === "string" ? b.v : "", 32) || null;
    const platform = PLATFORMS.includes(b.platform) ? b.platform : "khac";
    const day = vnDay(now);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO activity(user_id,day,first_ts,last_ts,pings) VALUES(?,?,?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET last_ts=excluded.last_ts, pings=pings+1").bind(user.id, day, now, now),
      env.DB.prepare("UPDATE users SET last_seen=?, last_version=COALESCE(?,last_version), platform=? WHERE id=?").bind(now, v, platform, user.id),
    ]);
    return json({ ok: true });
  }

  if (path === "/api/mail" && m === "GET") {
    const now = Date.now();
    const rs = await env.DB.prepare(
      "SELECT m.id, m.title, m.body, m.rewards, m.created_at, m.expires_at, CASE WHEN c.mail_id IS NULL THEN 0 ELSE 1 END AS claimed FROM mail m LEFT JOIN mail_claim c ON c.mail_id=m.id AND c.user_id=?1 " +
      "WHERE (m.user_id=?1 OR (m.user_id IS NULL AND m.created_at>=?2)) AND (m.expires_at IS NULL OR m.expires_at>?3) ORDER BY m.created_at DESC, m.id DESC LIMIT 100"
    ).bind(user.id, user.created_at, now).all();
    return json({ ok: true, items: rs.results.map((r) => ({ id: r.id, title: r.title, body: r.body, rewards: parseRewards(r.rewards), created_at: r.created_at, expires_at: r.expires_at, claimed: !!r.claimed })) });
  }

  if (path === "/api/mail/claim" && m === "POST") {
    const b = await readJson(request, 1024);
    const id = Number(b.id);
    if (!Number.isInteger(id) || id <= 0) return err(400, "bad_id");
    const r = await env.DB.prepare("SELECT id, user_id, rewards, created_at, expires_at FROM mail WHERE id=?").bind(id).first();
    // thư của người khác, hoặc thư gửi tất cả trước khi tài khoản này được tạo: coi như không có
    if (!r || (r.user_id != null && r.user_id !== user.id) || (r.user_id == null && r.created_at < user.created_at)) return err(404, "not_found", "Không có thư này");
    const now = Date.now();
    if (r.expires_at != null && r.expires_at <= now) return err(410, "expired", "Thư đã hết hạn");
    const ins = await env.DB.prepare("INSERT OR IGNORE INTO mail_claim(mail_id,user_id,claimed_at) VALUES(?,?,?)").bind(id, user.id, now).run();
    if (!ins.meta.changes) return err(409, "claimed", "Đã nhận quà thư này");
    return json({ ok: true, rewards: parseRewards(r.rewards) });
  }

  if (path === "/api/giftcode" && m === "POST") {
    const b = await readJson(request, 1024);
    const now = Date.now(), fk = "gc:" + user.id;
    const lim = await rateHit(env, fk, GC_FAIL_MAX, GC_FAIL_WIN, { add: false, now });
    if (!lim.ok) return err(429, "too_many", "Nhập sai quá nhiều lần, thử lại sau một giờ");
    const code = String(b.code || "").trim().toUpperCase();
    const g = GC_RE.test(code) ? await env.DB.prepare("SELECT * FROM giftcodes WHERE code=?").bind(code).first() : null;
    if (!g) {
      await rateHit(env, fk, GC_FAIL_MAX, GC_FAIL_WIN, { now });
      return err(404, "not_found", "Mã quà không đúng");
    }
    if (g.starts_at != null && g.starts_at > now) return err(410, "not_started", "Mã quà chưa tới giờ dùng");
    if (g.expires_at != null && g.expires_at <= now) return err(410, "expired", "Mã quà đã hết hạn");
    if (await env.DB.prepare("SELECT 1 FROM giftcode_redeem WHERE code=? AND user_id=?").bind(code, user.id).first()) return err(409, "already", "Bạn đã dùng mã này");
    if (g.max_uses > 0 && g.uses >= g.max_uses) return err(409, "used_up", "Mã quà đã hết lượt");
    // ghi lượt dùng trước (khoá chính chặn dùng hai lần), rồi tăng đếm có điều kiện (chặn vượt lượt khi nhiều người cùng lúc)
    const ins = await env.DB.prepare("INSERT OR IGNORE INTO giftcode_redeem(code,user_id,ts) VALUES(?,?,?)").bind(code, user.id, now).run();
    if (!ins.meta.changes) return err(409, "already", "Bạn đã dùng mã này");
    const up = await env.DB.prepare("UPDATE giftcodes SET uses=uses+1 WHERE code=? AND (max_uses<=0 OR uses<max_uses)").bind(code).run();
    if (!up.meta.changes) {
      await env.DB.prepare("DELETE FROM giftcode_redeem WHERE code=? AND user_id=?").bind(code, user.id).run();
      return err(409, "used_up", "Mã quà đã hết lượt");
    }
    return json({ ok: true, rewards: parseRewards(g.rewards) });
  }

  return null;
}
