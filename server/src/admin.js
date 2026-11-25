// API quản trị /api/admin/* (đã kiểm ADMIN_TOKEN ở api.js). Mọi thao tác ghi đều ghi admin_log.
// Trang quản trị KHÔNG sửa/xoá bản lưu người chơi (chỉ đọc).
import { json, err, readJson, cleanName } from "./util.js";
import { checkNewCreds, hashPassword, BAN_FOREVER } from "./auth.js";
import { registerOpen } from "./api.js";
import { CARDS } from "./cards.js";
import { GC_RE } from "./game.js";
import { WORKER_VERSION, vnDay, dayAdd, dayStart, DAY_MS, ONLINE_MS, PING_MS, cleanRewards, parseRewards, logAdmin } from "./ops.js";

const VN_DAY_SQL = (col) => `strftime('%Y-%m-%d', (${col} + 25200000) / 1000, 'unixepoch')`;
// thời gian chơi ước tính của một dòng activity: không quá khoảng đầu–cuối (+1 nhịp ping), không quá số ping × 5 phút
const PLAY_SQL = `MIN(last_ts - first_ts + ${PING_MS}, pings * ${PING_MS})`;
export const RET_DAYS = [1, 3, 7, 14, 30];
export const FLAG = { disputed: 2, soloWins: 2, unverified: 3, scoreDay: 240, scoreOutlier: 10, scoreNearCap: 25, sameIp: 3 };

const intParam = (url, k, def, lo, hi) => {
  const v = parseInt(url.searchParams.get(k) || "", 10);
  return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def;
};
const likeEsc = (s) => "%" + s.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
// chữ tự do (tiêu đề/nội dung): bỏ ký tự điều khiển và < >
export const cleanText = (s, max, multi = false) => String(s == null ? "" : s).replace(multi ? /[\u0000-\u0009\u000b-\u001f<>]/g : /[\u0000-\u001f<>]/g, "").trim().slice(0, max);
const tsOrNull = (v) => (v == null || v === "" ? null : Number.isFinite(+v) && +v > 0 ? Math.floor(+v) : undefined);

async function userExists(env, id) {
  return env.DB.prepare("SELECT id, display FROM users WHERE id=?").bind(id).first();
}

// ---------- tóm tắt bản lưu (blob JSON là `store` của game, xem www/js/03-data-store.js) ----------
export function summarizeSave(blob) {
  let s;
  try { s = JSON.parse(blob); } catch { return { error: "bad_json" }; }
  if (!s || typeof s !== "object" || Array.isArray(s)) return { error: "bad_json" };
  // Game lưu dạng bọc {v, t, gid, s: "<chuỗi JSON của store>"} (10-online-cf.js cfPush); bản cũ/thử có thể là store phẳng.
  if (typeof s.s === "string" && s.v != null) {
    try { s = JSON.parse(s.s); } catch { return { error: "bad_json" }; }
    if (!s || typeof s !== "object" || Array.isArray(s)) return { error: "bad_json" };
  }
  const out = {};
  const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : undefined);
  const ids = (a, n) => (Array.isArray(a) ? a.filter((x) => typeof x === "string").slice(0, n).map((x) => x.slice(0, 40)) : undefined);
  if (str(s.name, 40) !== undefined) out.name = str(s.name, 40);
  for (const k of ["gold", "gems", "up", "tok", "evp"]) if (Number.isFinite(s[k])) out[k] = Math.floor(s[k]);
  if (Array.isArray(s.own)) { out.own = ids(s.own, 2000); out.ownCount = out.own.length; }
  if (s.cards && typeof s.cards === "object") {
    const lv = {};
    for (const k of Object.keys(s.cards).slice(0, 2000)) { const l = s.cards[k] && s.cards[k].l | 0; if (l > 0) lv[k.slice(0, 40)] = Math.min(99, l); }
    out.levels = lv;
  }
  if (Array.isArray(s.decks)) out.decks = s.decks.slice(0, 12).filter((d) => d && typeof d === "object").map((d) => ({ n: str(d.n, 24) || "", ids: ids(d.ids, 12) || [] }));
  if (Number.isInteger(s.cur)) out.cur = s.cur;
  if (s.st && Number.isFinite(s.st.g) && Number.isFinite(s.st.w)) out.st = { g: Math.floor(s.st.g), w: Math.floor(s.st.w) };
  if (str(s.avatar, 40) !== undefined) out.avatar = str(s.avatar, 40);
  if (Array.isArray(s.backs)) out.backs = s.backs.length;
  if (Array.isArray(s.arenas)) out.arenas = ids(s.arenas, 30);
  if (typeof s.gift99 === "boolean") out.gift99 = s.gift99;
  if (Array.isArray(s.fav)) out.fav = s.fav.length;
  if (s.ms && typeof s.ms.d === "string" && Array.isArray(s.ms.v)) out.ms = { d: s.ms.d.slice(0, 12), v: s.ms.v.slice(0, 3).map((x) => +x || 0) };
  return out;
}

// ---------- cờ gian lận (chỉ liệt kê, không tự phạt) ----------
async function matchFlagRows(env, since, uid) {
  const q = `SELECT uid, COUNT(*) AS games, SUM(verified=0) AS unverified, SUM(reason='disputed') AS disputed, SUM(reason='single_report' AND winner_uid=uid) AS solo_wins
    FROM (SELECT host_uid AS uid, verified, reason, winner_uid FROM matches WHERE ended_at>=?1 UNION ALL SELECT guest_uid AS uid, verified, reason, winner_uid FROM matches WHERE ended_at>=?1)
    ${uid ? "WHERE uid=?2" : ""} GROUP BY uid ${uid ? "" : "HAVING disputed>=?2 OR solo_wins>=?3 OR (unverified>=?4 AND unverified*2>=games)"}`;
  const st = env.DB.prepare(q);
  return (await (uid ? st.bind(since, uid) : st.bind(since, FLAG.disputed, FLAG.soloWins, FLAG.unverified)).all()).results;
}

async function buildFlags(env, uid = null, now = Date.now()) {
  const since = now - 30 * DAY_MS, items = [];
  for (const r of await matchFlagRows(env, since, uid)) {
    const why = [];
    if (r.disputed >= FLAG.disputed) why.push(r.disputed + " trận hai bên báo lệch kết quả");
    if (r.solo_wins >= FLAG.soloWins) why.push(r.solo_wins + " trận tự báo thắng khi đối thủ không báo");
    if (r.unverified >= FLAG.unverified && r.unverified * 2 >= r.games) why.push(r.unverified + "/" + r.games + " trận không xác minh được");
    if (uid && !why.length) continue;
    items.push({ kind: "match", uid: r.uid, level: r.disputed >= 4 || r.solo_wins >= 4 ? "cao" : "vừa", text: why.join("; "), data: r });
  }
  // điểm tự báo: tổng/ngày (14 ngày gần nhất) vượt ngưỡng hoặc gấp nhiều lần trung vị ngày đó
  const d0 = "d" + dayAdd(vnDay(now), -13);
  const rows = (await env.DB.prepare(`SELECT user_id, pkey, SUM(pts) AS pts FROM scores WHERE pkey LIKE 'd%' AND pkey>=?1 ${uid ? "AND user_id=?2" : ""} GROUP BY user_id, pkey`).bind(...(uid ? [d0, uid] : [d0])).all()).results;
  const byDay = {};
  for (const r of rows) (byDay[r.pkey] = byDay[r.pkey] || []).push(r);
  const medians = {};
  if (!uid) for (const [k, list] of Object.entries(byDay)) { const v = list.map((x) => x.pts).sort((a, b) => a - b); medians[k] = v.length >= 5 ? v[Math.floor(v.length / 2)] : 0; }
  else for (const k of Object.keys(byDay)) {
    const m = await env.DB.prepare("SELECT COUNT(*) AS n FROM (SELECT user_id FROM scores WHERE pkey=? GROUP BY user_id)").bind(k).first();
    if (m.n >= 5) { const v = (await env.DB.prepare("SELECT SUM(pts) AS p FROM scores WHERE pkey=? GROUP BY user_id ORDER BY p LIMIT 1 OFFSET ?").bind(k, Math.floor(m.n / 2)).first()); medians[k] = v ? v.p : 0; }
  }
  for (const r of rows) {
    const med = medians[r.pkey] || 0;
    const hi = r.pts >= FLAG.scoreDay, out = med > 0 && r.pts >= FLAG.scoreOutlier * med && r.pts >= 60;
    if (hi || out) items.push({ kind: "score", uid: r.user_id, level: r.pts >= 2 * FLAG.scoreDay ? "cao" : "vừa", text: `Điểm tự báo ngày ${r.pkey.slice(1)}: ${r.pts}` + (out ? ` (gấp ${Math.round(r.pts / med)} lần trung vị ${med})` : ""), data: { day: r.pkey.slice(1), pts: r.pts, median: med } });
  }
  // đang gửi điểm sát trần 30 lần/phút
  const rc = (await env.DB.prepare(`SELECT k, n, ts FROM auth_fail WHERE k LIKE 'sc:%' AND n>=?1 AND ts>=?2 ${uid ? "AND k=?3" : ""}`).bind(...(uid ? [FLAG.scoreNearCap, now - 60000, "sc:" + uid] : [FLAG.scoreNearCap, now - 60000])).all()).results;
  for (const r of rc) items.push({ kind: "rate", uid: +r.k.slice(3), level: "vừa", text: `Gửi điểm ${r.n} lần trong một phút (trần 30)`, data: { n: r.n, ts: r.ts } });
  // nhiều tài khoản tạo từ cùng một mạng (IP đã băm)
  let ipRows;
  if (uid) ipRows = (await env.DB.prepare("SELECT reg_ip, COUNT(*) AS c, GROUP_CONCAT(id) AS ids FROM users WHERE reg_ip=(SELECT reg_ip FROM users WHERE id=?1) AND reg_ip IS NOT NULL GROUP BY reg_ip HAVING c>=?2").bind(uid, FLAG.sameIp).all()).results;
  else ipRows = (await env.DB.prepare("SELECT reg_ip, COUNT(*) AS c, GROUP_CONCAT(id) AS ids FROM users WHERE reg_ip IS NOT NULL GROUP BY reg_ip HAVING c>=?1 ORDER BY c DESC LIMIT 100").bind(FLAG.sameIp).all()).results;
  for (const r of ipRows) {
    const list = String(r.ids).split(",").map(Number).slice(0, 50);
    items.push({ kind: "ip", uid: uid || list[0], uids: list, level: r.c >= 5 ? "cao" : "vừa", text: `${r.c} tài khoản đăng ký từ cùng một mạng`, data: { net: r.reg_ip, count: r.c } });
  }
  // gắn tên
  const ids = [...new Set(items.flatMap((x) => [x.uid, ...(x.uids || [])]))].slice(0, 500);
  const names = {};
  for (let i = 0; i < ids.length; i += 90) {
    const part = ids.slice(i, i + 90);
    const rs = await env.DB.prepare(`SELECT id, display, username FROM users WHERE id IN (${part.map(() => "?").join(",")})`).bind(...part).all();
    for (const u of rs.results) names[u.id] = { display: u.display, username: u.username };
  }
  return { items, names, thresholds: FLAG };
}

// ---------- chi tiết người chơi ----------
async function playerDetail(env, id, now = Date.now()) {
  const u = await env.DB.prepare(`SELECT id, username, display, disabled, token_ver, created_at, last_login, last_seen, last_version, platform, ban_reason, ban_until,
    CASE WHEN google_sub IS NULL THEN 0 ELSE 1 END AS google, CASE WHEN google_sub IS NULL THEN NULL ELSE email END AS email, CASE WHEN pass_hash='' THEN 0 ELSE 1 END AS has_pw,
    CASE WHEN reg_ip IS NULL THEN 0 ELSE 1 END AS has_reg_ip FROM users WHERE id=?`).bind(id).first();
  if (!u) return null;
  const today = vnDay(now), from = dayAdd(today, -59);
  const [ratings, act, tot, sv, mt, mail, gc, scores, sameIp] = await env.DB.batch([
    env.DB.prepare("SELECT mode, rating, games, wins, losses, draws, updated_at FROM ratings WHERE user_id=?").bind(id),
    env.DB.prepare("SELECT day, first_ts, last_ts, pings FROM activity WHERE user_id=? AND day>=? ORDER BY day").bind(id, from),
    env.DB.prepare(`SELECT COUNT(*) AS days, COALESCE(SUM(pings),0) AS pings, COALESCE(SUM(${PLAY_SQL}),0) AS play_ms, MIN(day) AS first_day FROM activity WHERE user_id=?`).bind(id),
    env.DB.prepare("SELECT blob, version, updated_at, length(blob) AS size FROM saves WHERE user_id=? AND slot='save'").bind(id),
    env.DB.prepare("SELECT COUNT(*) AS games, SUM(winner_uid=?1) AS wins, SUM(winner_uid IS NOT NULL AND winner_uid<>?1) AS losses, SUM(outcome='draw') AS draws, SUM(outcome='void') AS voids FROM matches WHERE host_uid=?1 OR guest_uid=?1").bind(id),
    env.DB.prepare("SELECT (SELECT COUNT(*) FROM mail WHERE user_id=?1) AS personal, (SELECT COUNT(*) FROM mail_claim WHERE user_id=?1) AS claimed").bind(id),
    env.DB.prepare("SELECT COUNT(*) AS n FROM giftcode_redeem WHERE user_id=?").bind(id),
    env.DB.prepare("SELECT mode, SUM(pts) AS pts FROM scores WHERE user_id=? AND pkey LIKE 'm%' GROUP BY mode").bind(id),
    env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE reg_ip IS NOT NULL AND reg_ip=(SELECT reg_ip FROM users WHERE id=?1) AND id<>?1").bind(id),
  ]);
  const s = sv.results[0];
  const ban = u.disabled ? { reason: u.ban_reason || "", until: null, legacy: true } : u.ban_until && u.ban_until > now ? { reason: u.ban_reason || "", until: u.ban_until >= BAN_FOREVER ? null : u.ban_until } : null;
  const flags = await buildFlags(env, id, now);
  return {
    user: { ...u, online: !!(u.last_seen && now - u.last_seen < ONLINE_MS), ban },
    ratings: ratings.results,
    activity: act.results,
    play: { days: tot.results[0].days, pings: tot.results[0].pings, ms: tot.results[0].play_ms, firstDay: tot.results[0].first_day },
    save: s ? { version: s.version, updated_at: s.updated_at, size: s.size, summary: summarizeSave(s.blob) } : null,
    matches: mt.results[0],
    mail: mail.results[0],
    giftcodes: gc.results[0].n,
    scores: scores.results,
    sameIp: sameIp.results[0].n,
    flags: flags.items.length,
  };
}

// ---------- thống kê ----------
async function overview(env, days, now = Date.now()) {
  const today = vnDay(now), from = dayAdd(today, -(days - 1)), fromTs = dayStart(from);
  const [tot, newPer, dauPer, dwm, mPer, outc, scPer, plat, ver, top, play] = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS users, SUM(disabled=1 OR (ban_until IS NOT NULL AND ban_until>?1)) AS banned, SUM(last_seen>=?2) AS online, SUM(created_at>=?3) AS new_today, SUM(google_sub IS NOT NULL) AS google FROM users").bind(now, now - ONLINE_MS, dayStart(today)),
    env.DB.prepare(`SELECT ${VN_DAY_SQL("created_at")} AS d, COUNT(*) AS n FROM users WHERE created_at>=? GROUP BY d ORDER BY d`).bind(fromTs),
    env.DB.prepare("SELECT day AS d, COUNT(*) AS n, SUM(" + PLAY_SQL + ") AS ms FROM activity WHERE day>=? GROUP BY day ORDER BY day").bind(from),
    env.DB.prepare("SELECT COUNT(DISTINCT CASE WHEN day=?1 THEN user_id END) AS dau, COUNT(DISTINCT CASE WHEN day>=?2 THEN user_id END) AS wau, COUNT(DISTINCT user_id) AS mau FROM activity WHERE day>=?3").bind(today, dayAdd(today, -6), dayAdd(today, -29)),
    env.DB.prepare(`SELECT ${VN_DAY_SQL("ended_at")} AS d, mode, COUNT(*) AS n FROM matches WHERE ended_at>=? GROUP BY d, mode ORDER BY d`).bind(fromTs),
    env.DB.prepare("SELECT outcome, reason, COUNT(*) AS n FROM matches WHERE ended_at>=? GROUP BY outcome, reason ORDER BY n DESC").bind(fromTs),
    env.DB.prepare("SELECT substr(pkey,2) AS d, mode, SUM(pts) AS pts, COUNT(*) AS players FROM scores WHERE pkey LIKE 'd%' AND pkey>=? GROUP BY pkey, mode ORDER BY pkey").bind("d" + from),
    env.DB.prepare("SELECT COALESCE(platform,'chưa rõ') AS k, COUNT(*) AS n FROM users WHERE last_seen>=? GROUP BY k ORDER BY n DESC").bind(fromTs),
    env.DB.prepare("SELECT COALESCE(last_version,'chưa rõ') AS k, COUNT(*) AS n FROM users WHERE last_seen>=? GROUP BY k ORDER BY n DESC LIMIT 12").bind(fromTs),
    env.DB.prepare("SELECT u.id, u.display, r.rating, r.games, r.wins, r.losses, r.draws FROM ratings r JOIN users u ON u.id=r.user_id WHERE r.mode='online' AND r.games>0 ORDER BY r.rating DESC, r.wins DESC LIMIT 20"),
    env.DB.prepare("SELECT COUNT(*) AS rows, COALESCE(SUM(" + PLAY_SQL + "),0) AS ms FROM activity WHERE day>=?").bind(from),
  ]);
  return {
    days, from, today, totals: { ...tot.results[0], ...dwm.results[0] },
    newPerDay: newPer.results, dauPerDay: dauPer.results, matchesPerDay: mPer.results, outcomes: outc.results, scoresPerDay: scPer.results,
    platforms: plat.results, versions: ver.results, topElo: top.results,
    avgPlayMs: play.results[0].rows ? Math.round(play.results[0].ms / play.results[0].rows) : 0,
  };
}

export async function retention(env, days, now = Date.now()) {
  const today = vnDay(now), from = dayAdd(today, -(days - 1)), fromTs = dayStart(from);
  const [us, act] = await env.DB.batch([
    env.DB.prepare(`SELECT id, ${VN_DAY_SQL("created_at")} AS c FROM users WHERE created_at>=?`).bind(fromTs),
    env.DB.prepare("SELECT a.user_id, a.day FROM activity a JOIN users u ON u.id=a.user_id WHERE u.created_at>=?").bind(fromTs),
  ]);
  const seen = new Set(act.results.map((r) => r.user_id + "|" + r.day));
  const coh = {};
  for (const u of us.results) (coh[u.c] = coh[u.c] || []).push(u.id);
  const cols = [0, ...RET_DAYS];
  const agg = Object.fromEntries(cols.map((n) => [n, { ret: 0, base: 0 }]));
  const cohorts = Object.keys(coh).sort().reverse().map((c) => {
    const ids = coh[c], row = { day: c, size: ids.length, d: {} };
    for (const n of cols) {
      const t = dayAdd(c, n);
      if (t > today) { row.d[n] = null; continue; }
      const k = ids.filter((id) => seen.has(id + "|" + t)).length;
      row.d[n] = k;
      agg[n].ret += k; agg[n].base += ids.length;
    }
    return row;
  });
  return { days, today, cols, cohorts, total: Object.fromEntries(cols.map((n) => [n, agg[n].base ? { ret: agg[n].ret, base: agg[n].base, pct: Math.round((1000 * agg[n].ret) / agg[n].base) / 10 } : null])) };
}

async function realtime(env, now = Date.now()) {
  const on = await env.DB.prepare("SELECT id, display, platform, last_version, last_seen FROM users WHERE last_seen>=? ORDER BY last_seen DESC LIMIT 100").bind(now - ONLINE_MS).all();
  const cnt = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE last_seen>=?").bind(now - ONLINE_MS).first();
  const out = { online: cnt.n, players: on.results, lobby: null, seeking: null, inMatch: null, measured: false, note: "" };
  try {
    const stub = env.MATCHMAKER.get(env.MATCHMAKER.idFromName("global"));
    const r = await stub.fetch("https://mm/__stats");
    const j = await r.json();
    out.lobby = j.lobby; out.seeking = j.seeking;
    const mids = (j.recent || []).map((x) => x.mid).slice(-90);
    let ended = 0;
    if (mids.length) ended = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM matches WHERE id IN (${mids.map(() => "?").join(",")})`).bind(...mids).first()).n;
    out.inMatch = mids.length - ended;
    out.recentMatches = mids.length;
    out.measured = true;
    out.note = "Đang trong trận = trận ghép trong 30 phút qua mà chưa có kết quả (ước tính).";
  } catch (e) {
    out.note = "Chưa đo được số đang ghép/đang trong trận.";
  }
  return out;
}

const TABLES = ["users", "ratings", "scores", "matches", "saves", "activity", "mail", "mail_claim", "giftcodes", "giftcode_redeem", "announcements", "admin_log", "auth_fail", "config"];
async function health(env) {
  const lat = [];
  for (let i = 0; i < 3; i++) { const t = performance.now(), t1 = Date.now(); await env.DB.prepare("SELECT 1 AS x").first(); lat.push(Math.max(performance.now() - t, Date.now() - t1)); }
  const counts = {};
  const rs = await env.DB.batch(TABLES.map((t) => env.DB.prepare(`SELECT COUNT(*) AS n FROM ${t}`)));
  TABLES.forEach((t, i) => (counts[t] = rs[i].results[0].n));
  let migrations = null;
  try { migrations = (await env.DB.prepare("SELECT name, applied_at FROM d1_migrations ORDER BY id").all()).results; } catch {}
  let doMs = null;
  try { const t = Date.now(); await (await env.MATCHMAKER.get(env.MATCHMAKER.idFromName("global")).fetch("https://mm/__stats")).text(); doMs = Date.now() - t; } catch {}
  const sz = await env.DB.prepare("SELECT COALESCE(SUM(length(blob)),0) AS b, COALESCE(MAX(length(blob)),0) AS mx FROM saves").first();
  return {
    version: WORKER_VERSION, now: Date.now(), d1: { ms: lat.map((x) => Math.round(x * 10) / 10), avg: Math.round((lat.reduce((a, b) => a + b, 0) / lat.length) * 10) / 10 }, durableObjectMs: doMs,
    counts, migrations, saves: { bytes: sz.b, max: sz.mx },
    config: { google: !!String(env.GOOGLE_CLIENT_ID || "").trim(), sessionSecret: !!env.SESSION_SECRET, registerOpen: await registerOpen(env), allowedOrigins: String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean) },
  };
}

// ---------- giftcode ----------
const GC_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randCode(prefix, n = 8) {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return prefix + Array.from(b, (x) => GC_ALPHA[x % GC_ALPHA.length]).join("");
}

// ---------- định tuyến ----------
export async function adminApi(request, env, url) {
  const path = url.pathname, m = request.method, now = Date.now();
  const page = intParam(url, "page", 1, 1, 100000), size = intParam(url, "size", 20, 1, 100), off = (page - 1) * size;

  if (path === "/api/admin/cards" && m === "GET") return json({ ok: true, cards: CARDS });
  if (path === "/api/admin/online" && m === "GET") {
    const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE last_seen>=?").bind(now - ONLINE_MS).first();
    return json({ ok: true, online: r.n, version: WORKER_VERSION });
  }

  // --- tra cứu ---
  if (path === "/api/admin/players" && m === "GET") {
    const q = String(url.searchParams.get("q") || "").trim().slice(0, 60), f = url.searchParams.get("filter") || "all";
    const idq = /^#?\d{1,12}$/.test(q) ? +q.replace("#", "") : -1;
    const where = [], args = [];
    if (q) { const lk = likeEsc(q); where.push("(u.id=? OR u.username LIKE ? ESCAPE '\\' OR u.display LIKE ? ESCAPE '\\' OR (u.google_sub IS NOT NULL AND u.email LIKE ? ESCAPE '\\'))"); args.push(idq, lk, lk, lk); }
    if (f === "online") { where.push("u.last_seen>=?"); args.push(now - ONLINE_MS); }
    else if (f === "banned") { where.push("(u.disabled=1 OR u.ban_until>?)"); args.push(now); }
    else if (f === "new") { where.push("u.created_at>=?"); args.push(now - 7 * DAY_MS); }
    const W = where.length ? "WHERE " + where.join(" AND ") : "";
    const total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM users u ${W}`).bind(...args).first()).n;
    const rs = await env.DB.prepare(`SELECT u.id, u.username, u.display, CASE WHEN u.google_sub IS NULL THEN NULL ELSE u.email END AS email, u.created_at, u.last_seen, u.last_login, u.platform, u.last_version, u.disabled, u.ban_until, u.ban_reason, r.rating, r.games, r.wins
      FROM users u LEFT JOIN ratings r ON r.user_id=u.id AND r.mode='online' ${W} ORDER BY COALESCE(u.last_seen, u.last_login, u.created_at) DESC, u.id DESC LIMIT ? OFFSET ?`).bind(...args, size, off).all();
    return json({ ok: true, total, page, size, items: rs.results.map((u) => ({ ...u, online: !!(u.last_seen && now - u.last_seen < ONLINE_MS), banned: !!(u.disabled || (u.ban_until && u.ban_until > now)) })) });
  }

  if (path === "/api/admin/bans" && m === "GET") {
    const rs = await env.DB.prepare("SELECT id, username, display, disabled, ban_until, ban_reason, last_seen FROM users WHERE disabled=1 OR ban_until>? ORDER BY COALESCE(ban_until, 0) DESC, id DESC LIMIT 200").bind(now).all();
    return json({ ok: true, items: rs.results });
  }

  const pm = /^\/api\/admin\/players\/(\d{1,12})(?:\/([a-z]+))?$/.exec(path);
  if (pm) {
    const id = +pm[1], sub = pm[2] || "";
    const ex = await userExists(env, id);
    if (!ex) return err(404, "not_found", "Không có người chơi này");
    const T = "u:" + id;
    if (m === "GET") {
      if (!sub) return json({ ok: true, ...(await playerDetail(env, id, now)) });
      if (sub === "save") {
        const r = await env.DB.prepare("SELECT blob, version, updated_at FROM saves WHERE user_id=? AND slot='save'").bind(id).first();
        return json({ ok: true, blob: r ? r.blob : null, version: r ? r.version : 0, updated_at: r ? r.updated_at : 0 });
      }
      if (sub === "matches") {
        const total = (await env.DB.prepare("SELECT COUNT(*) AS n FROM matches WHERE host_uid=?1 OR guest_uid=?1").bind(id).first()).n;
        const rs = await env.DB.prepare(`SELECT m.id, m.mode, m.host_uid, m.guest_uid, m.winner_uid, m.outcome, m.reason, m.verified, m.host_delta, m.guest_delta, m.started_at, m.ended_at,
          CASE WHEN m.host_uid=?1 THEN m.guest_uid ELSE m.host_uid END AS opp_id, o.display AS opp_name
          FROM matches m LEFT JOIN users o ON o.id = CASE WHEN m.host_uid=?1 THEN m.guest_uid ELSE m.host_uid END
          WHERE m.host_uid=?1 OR m.guest_uid=?1 ORDER BY m.ended_at DESC LIMIT ?2 OFFSET ?3`).bind(id, size, off).all();
        return json({ ok: true, total, page, size, items: rs.results });
      }
      if (sub === "mail") {
        const u = await env.DB.prepare("SELECT created_at FROM users WHERE id=?").bind(id).first();
        const rs = await env.DB.prepare(`SELECT m.id, m.user_id, m.title, m.body, m.rewards, m.created_at, m.expires_at, c.claimed_at FROM mail m LEFT JOIN mail_claim c ON c.mail_id=m.id AND c.user_id=?1
          WHERE m.user_id=?1 OR (m.user_id IS NULL AND m.created_at>=?2) ORDER BY m.created_at DESC LIMIT 100`).bind(id, u.created_at).all();
        const gc = await env.DB.prepare("SELECT r.code, r.ts, g.rewards FROM giftcode_redeem r LEFT JOIN giftcodes g ON g.code=r.code WHERE r.user_id=? ORDER BY r.ts DESC LIMIT 100").bind(id).all();
        return json({ ok: true, items: rs.results.map((r) => ({ ...r, rewards: parseRewards(r.rewards) })), giftcodes: gc.results.map((r) => ({ ...r, rewards: parseRewards(r.rewards) })) });
      }
      if (sub === "log") {
        const rs = await env.DB.prepare("SELECT id, ts, action, target, detail FROM admin_log WHERE target=? ORDER BY id DESC LIMIT 100").bind(T).all();
        return json({ ok: true, items: rs.results });
      }
      if (sub === "flags") return json({ ok: true, ...(await buildFlags(env, id, now)) });
      return err(404, "not_found");
    }
    if (m === "POST") {
      const b = await readJson(request, 4096);
      if (sub === "ban") {
        const reason = cleanText(b.reason, 200);
        if (!reason) return err(400, "bad_reason", "Cần ghi lý do khoá");
        let until;
        if (b.forever === true) until = BAN_FOREVER;
        else {
          const h = Number(b.hours);
          if (!Number.isFinite(h) || h <= 0 || h > 24 * 3650) return err(400, "bad_until", "Thời hạn khoá không hợp lệ");
          until = now + Math.round(h * 3600 * 1000);
        }
        await env.DB.prepare("UPDATE users SET ban_until=?, ban_reason=? WHERE id=?").bind(until, reason, id).run();
        await logAdmin(env, "player.ban", T, { reason, until: until >= BAN_FOREVER ? "vĩnh viễn" : until });
        return json({ ok: true, until: until >= BAN_FOREVER ? null : until });
      }
      if (sub === "unban") {
        await env.DB.prepare("UPDATE users SET ban_until=NULL, ban_reason=NULL, disabled=0 WHERE id=?").bind(id).run();
        await logAdmin(env, "player.unban", T, {});
        return json({ ok: true });
      }
      if (sub === "rename") {
        const d = cleanName(b.display);
        if (!d) return err(400, "bad_display", "Tên hiển thị không hợp lệ");
        await env.DB.prepare("UPDATE users SET display=? WHERE id=?").bind(d, id).run();
        await logAdmin(env, "player.rename", T, { from: ex.display, to: d });
        return json({ ok: true, display: d });
      }
      if (sub === "password") {
        const bad = checkNewCreds("abc", b.password);
        if (bad) return err(400, "bad_creds", bad);
        const h = await hashPassword(b.password);
        await env.DB.prepare("UPDATE users SET pass_hash=?, salt=?, iters=?, token_ver=token_ver+1 WHERE id=?").bind(h.pass_hash, h.salt, h.iters, id).run();
        await logAdmin(env, "player.password", T, { note: "đặt lại mật khẩu, thu hồi phiên" });
        return json({ ok: true });
      }
      if (sub === "kick") {
        await env.DB.prepare("UPDATE users SET token_ver=token_ver+1 WHERE id=?").bind(id).run();
        await logAdmin(env, "player.kick", T, { note: "thu hồi mọi phiên đăng nhập" });
        return json({ ok: true });
      }
    }
    return err(404, "not_found");
  }

  // --- thư ---
  if (path === "/api/admin/mail" && m === "GET") {
    const total = (await env.DB.prepare("SELECT COUNT(*) AS n FROM mail").first()).n;
    const rs = await env.DB.prepare(`SELECT m.*, u.display AS to_name, (SELECT COUNT(*) FROM mail_claim c WHERE c.mail_id=m.id) AS claims,
      CASE WHEN m.user_id IS NULL THEN (SELECT COUNT(*) FROM users x WHERE x.created_at<=m.created_at) ELSE 1 END AS recipients
      FROM mail m LEFT JOIN users u ON u.id=m.user_id ORDER BY m.id DESC LIMIT ? OFFSET ?`).bind(size, off).all();
    return json({ ok: true, total, page, size, items: rs.results.map((r) => ({ ...r, rewards: parseRewards(r.rewards) })) });
  }
  if (path === "/api/admin/mail" && m === "POST") {
    const b = await readJson(request, 8192);
    const title = cleanText(b.title, 80), body = cleanText(b.body, 1000, true);
    if (!title) return err(400, "bad_title", "Cần tiêu đề thư");
    const rw = cleanRewards(b.rewards);
    if (rw.error) return err(400, rw.error, rw.message);
    let uid = null;
    if (b.to !== "all") {
      uid = Number(b.to);
      if (!Number.isInteger(uid) || uid <= 0 || !(await userExists(env, uid))) return err(404, "no_user", "Không có người chơi này");
    }
    let exp = null;
    if (b.expires_days != null) {
      const d = Number(b.expires_days);
      if (!Number.isFinite(d) || d <= 0 || d > 365) return err(400, "bad_expiry", "Hạn thư 1–365 ngày");
      exp = now + Math.round(d * DAY_MS);
    }
    const r = await env.DB.prepare("INSERT INTO mail(user_id,title,body,rewards,created_at,expires_at,created_by) VALUES(?,?,?,?,?,?,'admin')").bind(uid, title, body, JSON.stringify(rw.rewards), now, exp).run();
    await logAdmin(env, "mail.send", uid ? "u:" + uid : "all", { id: r.meta.last_row_id, title, rewards: rw.rewards, expires_at: exp });
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  }
  const mm = /^\/api\/admin\/mail\/(\d{1,12})$/.exec(path);
  if (mm && m === "DELETE") {
    const id = +mm[1];
    const r = await env.DB.prepare("SELECT id, user_id, title FROM mail WHERE id=?").bind(id).first();
    if (!r) return err(404, "not_found");
    await env.DB.batch([env.DB.prepare("DELETE FROM mail WHERE id=?").bind(id), env.DB.prepare("DELETE FROM mail_claim WHERE mail_id=?").bind(id)]);
    await logAdmin(env, "mail.delete", r.user_id ? "u:" + r.user_id : "all", { id, title: r.title });
    return json({ ok: true });
  }

  // --- giftcode ---
  if (path === "/api/admin/giftcodes" && m === "GET") {
    const rs = await env.DB.prepare("SELECT * FROM giftcodes ORDER BY created_at DESC LIMIT 500").all();
    return json({ ok: true, items: rs.results.map((r) => ({ ...r, rewards: parseRewards(r.rewards) })) });
  }
  if (path === "/api/admin/giftcodes" && m === "POST") {
    const b = await readJson(request, 8192);
    const rw = cleanRewards(b.rewards, { required: true });
    if (rw.error) return err(400, rw.error, rw.message);
    const maxUses = b.max_uses == null ? 0 : Number(b.max_uses);
    if (!Number.isInteger(maxUses) || maxUses < 0 || maxUses > 1000000) return err(400, "bad_max_uses", "Số lượt 0–1.000.000 (0 = không giới hạn)");
    const st = tsOrNull(b.starts_at), ex = tsOrNull(b.expires_at);
    if (st === undefined || ex === undefined || (st && ex && ex <= st)) return err(400, "bad_time", "Thời gian không hợp lệ");
    const note = cleanText(b.note, 120);
    const count = b.code ? 1 : Math.max(1, Math.min(50, Number(b.count) | 0 || 1));
    let codes = [];
    if (b.code) {
      const c = String(b.code).trim().toUpperCase();
      if (!GC_RE.test(c)) return err(400, "bad_code", "Mã 3–32 ký tự: chữ in, số, _ -");
      codes = [c];
    } else {
      const prefix = String(b.prefix || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
      for (let i = 0; i < count; i++) codes.push(randCode(prefix));
    }
    const made = [];
    for (const c of codes) {
      const r = await env.DB.prepare("INSERT OR IGNORE INTO giftcodes(code,rewards,max_uses,uses,starts_at,expires_at,note,created_at) VALUES(?,?,?,0,?,?,?,?)").bind(c, JSON.stringify(rw.rewards), maxUses, st, ex, note, now).run();
      if (r.meta.changes) made.push(c);
      else if (b.code) return err(409, "exists", "Mã này đã có");
    }
    await logAdmin(env, "giftcode.create", "giftcode", { codes: made, rewards: rw.rewards, max_uses: maxUses, starts_at: st, expires_at: ex, note });
    return json({ ok: true, codes: made }, 201);
  }
  const gm = /^\/api\/admin\/giftcodes\/([A-Za-z0-9_-]{3,32})(\/redeems)?$/.exec(path);
  if (gm) {
    const code = gm[1].toUpperCase();
    const g = await env.DB.prepare("SELECT * FROM giftcodes WHERE code=?").bind(code).first();
    if (!g) return err(404, "not_found");
    if (gm[2] && m === "GET") {
      const rs = await env.DB.prepare("SELECT r.user_id, r.ts, u.display, u.username FROM giftcode_redeem r LEFT JOIN users u ON u.id=r.user_id WHERE r.code=? ORDER BY r.ts DESC LIMIT ? OFFSET ?").bind(code, size, off).all();
      return json({ ok: true, total: g.uses, items: rs.results });
    }
    if (!gm[2] && m === "PATCH") {
      const b = await readJson(request, 4096);
      const set = {};
      if (b.max_uses !== undefined) { const v = Number(b.max_uses); if (!Number.isInteger(v) || v < 0 || v > 1000000) return err(400, "bad_max_uses"); set.max_uses = v; }
      if (b.starts_at !== undefined) { const v = tsOrNull(b.starts_at); if (v === undefined) return err(400, "bad_time"); set.starts_at = v; }
      if (b.expires_at !== undefined) { const v = tsOrNull(b.expires_at); if (v === undefined) return err(400, "bad_time"); set.expires_at = v; }
      if (b.note !== undefined) set.note = cleanText(b.note, 120);
      if (b.rewards !== undefined) {
        if (g.uses > 0) return err(409, "in_use", "Mã đã có người dùng, không đổi quà được");
        const rw = cleanRewards(b.rewards, { required: true }); if (rw.error) return err(400, rw.error, rw.message);
        set.rewards = JSON.stringify(rw.rewards);
      }
      const ks = Object.keys(set);
      if (!ks.length) return err(400, "nothing");
      await env.DB.prepare(`UPDATE giftcodes SET ${ks.map((k) => k + "=?").join(",")} WHERE code=?`).bind(...ks.map((k) => set[k]), code).run();
      await logAdmin(env, "giftcode.update", "gc:" + code, set);
      return json({ ok: true });
    }
    if (!gm[2] && m === "DELETE") {
      // xoá mã chỉ ngừng dùng tiếp; giữ lịch sử lượt dùng để người đã nhận không nhận lại nếu mã được tạo lại
      await env.DB.prepare("DELETE FROM giftcodes WHERE code=?").bind(code).run();
      await logAdmin(env, "giftcode.delete", "gc:" + code, { uses: g.uses });
      return json({ ok: true });
    }
    return err(404, "not_found");
  }

  // --- thông báo ---
  if (path === "/api/admin/announcements" && m === "GET") {
    const rs = await env.DB.prepare("SELECT * FROM announcements ORDER BY id DESC LIMIT 200").all();
    return json({ ok: true, items: rs.results.map((r) => ({ ...r, live: (r.starts_at == null || r.starts_at <= now) && (r.ends_at == null || r.ends_at > now) })) });
  }
  const am = /^\/api\/admin\/announcements(?:\/(\d{1,12}))?$/.exec(path);
  if (am && (m === "POST" || m === "PATCH")) {
    const b = await readJson(request, 4096);
    const isNew = m === "POST" && !am[1];
    if (!isNew && !am[1]) return err(404, "not_found");
    const old = am[1] ? await env.DB.prepare("SELECT * FROM announcements WHERE id=?").bind(+am[1]).first() : null;
    if (am[1] && !old) return err(404, "not_found");
    const text = b.text !== undefined ? cleanText(b.text, 300) : old && old.text;
    if (!text) return err(400, "bad_text", "Cần nội dung thông báo");
    const level = b.level !== undefined ? b.level : old ? old.level : "info";
    if (!["info", "warn", "event"].includes(level)) return err(400, "bad_level");
    const st = b.starts_at !== undefined ? tsOrNull(b.starts_at) : old ? old.starts_at : null;
    const en = b.ends_at !== undefined ? tsOrNull(b.ends_at) : old ? old.ends_at : null;
    if (st === undefined || en === undefined || (st && en && en <= st)) return err(400, "bad_time", "Thời gian không hợp lệ");
    let id = old && old.id;
    if (isNew) id = (await env.DB.prepare("INSERT INTO announcements(text,level,starts_at,ends_at,created_at) VALUES(?,?,?,?,?)").bind(text, level, st, en, now).run()).meta.last_row_id;
    else await env.DB.prepare("UPDATE announcements SET text=?, level=?, starts_at=?, ends_at=? WHERE id=?").bind(text, level, st, en, id).run();
    await logAdmin(env, isNew ? "announce.create" : "announce.update", "an:" + id, { text, level, starts_at: st, ends_at: en });
    return json({ ok: true, id }, isNew ? 201 : 200);
  }
  if (am && am[1] && m === "DELETE") {
    const r = await env.DB.prepare("DELETE FROM announcements WHERE id=?").bind(+am[1]).run();
    if (!r.meta.changes) return err(404, "not_found");
    await logAdmin(env, "announce.delete", "an:" + am[1], {});
    return json({ ok: true });
  }

  // --- cờ, phân tích, hệ thống ---
  if (path === "/api/admin/flags" && m === "GET") return json({ ok: true, ...(await buildFlags(env, null, now)) });
  if (path === "/api/admin/stats/overview" && m === "GET") return json({ ok: true, ...(await overview(env, intParam(url, "days", 30, 7, 90), now)) });
  if (path === "/api/admin/stats/retention" && m === "GET") return json({ ok: true, ...(await retention(env, intParam(url, "days", 30, 7, 90), now)) });
  if (path === "/api/admin/realtime" && m === "GET") return json({ ok: true, ...(await realtime(env, now)) });
  if (path === "/api/admin/health" && m === "GET") return json({ ok: true, ...(await health(env)) });
  if (path === "/api/admin/log" && m === "GET") {
    const q = String(url.searchParams.get("q") || "").trim().slice(0, 60);
    const W = q ? "WHERE action LIKE ?1 ESCAPE '\\' OR target LIKE ?1 ESCAPE '\\' OR detail LIKE ?1 ESCAPE '\\'" : "WHERE ?1=?1";
    const total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM admin_log ${W}`).bind(likeEsc(q)).first()).n;
    const rs = await env.DB.prepare(`SELECT * FROM admin_log ${W} ORDER BY id DESC LIMIT ?2 OFFSET ?3`).bind(likeEsc(q), size, off).all();
    return json({ ok: true, total, page, size, items: rs.results });
  }
  return err(404, "not_found");
}
