import { json, err, readJson, cleanName } from "./util.js";
import { authUser, bearer, adminOk, login, checkNewCreds, hashPassword, USERNAME_RE } from "./auth.js";
import { START_RATING, MODES, SCORE_MODES, PKEY_RE } from "./elo.js";

const SAVE_MAX = 512 * 1024;

export async function handleApi(request, env, url) {
  const path = url.pathname, m = request.method;

  if (path === "/api/health") return json({ ok: true, t: Date.now() });

  if (path === "/api/login" && m === "POST") {
    const b = await readJson(request, 4096);
    const r = await login(env, request, b.username, b.password);
    if (r.error) return err(r.status, r.error, r.message);
    return json({ ok: true, token: r.token, user: r.user });
  }

  if (path.startsWith("/api/admin/")) return admin(request, env, url);

  // --- cần đăng nhập ---
  const user = await authUser(env, bearer(request));
  if (!user) return err(401, "unauthorized", "Cần đăng nhập");

  if (path === "/api/me" && m === "GET") {
    const rs = await env.DB.prepare("SELECT mode, rating, games, wins, losses, draws FROM ratings WHERE user_id=?").bind(user.id).all();
    const ratings = {};
    for (const mode of MODES) ratings[mode] = { rating: START_RATING, games: 0, wins: 0, losses: 0, draws: 0 };
    for (const r of rs.results) ratings[r.mode] = r;
    const sv = await env.DB.prepare("SELECT version, updated_at FROM saves WHERE user_id=? AND slot='save'").bind(user.id).first();
    return json({ ok: true, user: { id: user.id, username: user.username, display: user.display }, ratings, save: sv ? { version: sv.version, updatedAt: sv.updated_at } : null, serverTime: Date.now() });
  }

  if (path === "/api/save") {
    const slot = url.searchParams.get("slot") || "save";
    if (!["save", "avatar"].includes(slot)) return err(400, "bad_slot");
    if (m === "GET") {
      const r = await env.DB.prepare("SELECT blob, version, updated_at FROM saves WHERE user_id=? AND slot=?").bind(user.id, slot).first();
      if (!r) return json({ ok: true, blob: null, version: 0, updatedAt: 0 });
      return json({ ok: true, blob: r.blob, version: r.version, updatedAt: r.updated_at });
    }
    if (m === "PUT") {
      const b = await readJson(request, SAVE_MAX + 1024);
      if (typeof b.blob !== "string" || !b.blob.length) return err(400, "bad_blob", "Thiếu dữ liệu");
      if (b.blob.length > SAVE_MAX) return err(413, "too_big", "Dữ liệu quá lớn");
      try { JSON.parse(b.blob); } catch { return err(400, "bad_blob", "Dữ liệu không phải JSON"); }
      const cur = await env.DB.prepare("SELECT version, updated_at FROM saves WHERE user_id=? AND slot=?").bind(user.id, slot).first();
      // chống ghi đè mất dữ liệu khi hai máy cùng lưu: client gửi 'base' = version đã tải gần nhất
      if (cur && !b.force && typeof b.base === "number" && b.base !== cur.version)
        return json({ ok: false, error: "conflict", message: "Máy khác đã lưu bản mới hơn", version: cur.version, updatedAt: cur.updated_at }, 409);
      const now = Date.now(), ver = (cur ? cur.version : 0) + 1;
      await env.DB.prepare("INSERT INTO saves(user_id,slot,blob,version,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,slot) DO UPDATE SET blob=excluded.blob, version=excluded.version, updated_at=excluded.updated_at").bind(user.id, slot, b.blob, ver, now).run();
      return json({ ok: true, version: ver, updatedAt: now });
    }
  }

  if (path === "/api/leaderboard" && m === "GET") {
    const mode = url.searchParams.get("mode") || "online", key = url.searchParams.get("key") || "";
    if (!SCORE_MODES.includes(mode)) return err(400, "bad_mode");
    let rows, me = null;
    if (!key) {
      if (!MODES.includes(mode)) return json({ ok: true, mode, key: "", kind: "rating", rows: [], me: null });
      rows = (await env.DB.prepare("SELECT u.display AS name, u.id AS uid, r.rating AS v, r.games, r.wins FROM ratings r JOIN users u ON u.id=r.user_id WHERE r.mode=? AND r.games>0 AND u.disabled=0 ORDER BY r.rating DESC, r.wins DESC, u.id LIMIT 50").bind(mode).all()).results;
      const mine = await env.DB.prepare("SELECT rating, games, wins FROM ratings WHERE user_id=? AND mode=?").bind(user.id, mode).first();
      if (mine && mine.games > 0) {
        const hi = await env.DB.prepare("SELECT COUNT(*) AS c FROM ratings r JOIN users u ON u.id=r.user_id WHERE r.mode=? AND r.games>0 AND u.disabled=0 AND r.rating>?").bind(mode, mine.rating).first();
        me = { rank: hi.c + 1, v: mine.rating, games: mine.games, wins: mine.wins };
      }
    } else {
      if (!PKEY_RE.test(key)) return err(400, "bad_key");
      rows = (await env.DB.prepare("SELECT u.display AS name, u.id AS uid, s.pts AS v FROM scores s JOIN users u ON u.id=s.user_id WHERE s.mode=? AND s.pkey=? AND s.pts>0 AND u.disabled=0 ORDER BY s.pts DESC, u.id LIMIT 50").bind(mode, key).all()).results;
      const mine = await env.DB.prepare("SELECT pts FROM scores WHERE user_id=? AND mode=? AND pkey=?").bind(user.id, mode, key).first();
      if (mine && mine.pts > 0) {
        const hi = await env.DB.prepare("SELECT COUNT(*) AS c FROM scores s JOIN users u ON u.id=s.user_id WHERE s.mode=? AND s.pkey=? AND u.disabled=0 AND s.pts>?").bind(mode, key, mine.pts).first();
        me = { rank: hi.c + 1, v: mine.pts };
      }
    }
    return json({ ok: true, mode, key, kind: key ? "score" : "rating", rows: rows.map((r, i) => ({ rank: i + 1, name: r.name, v: r.v, me: r.uid === user.id, games: r.games, wins: r.wins })), me });
  }

  // Điểm các chế độ chơi với máy: client tự báo (không xác minh được), có giới hạn. Chế độ online do máy chủ chấm.
  if (path === "/api/score" && m === "POST") {
    const b = await readJson(request, 2048);
    if (!SCORE_MODES.includes(b.mode) || MODES.includes(b.mode) || b.mode === "online") return err(400, "bad_mode");
    const pts = b.pts | 0;
    if (pts < 1 || pts > 12) return err(400, "bad_pts");
    const keys = [b.d, b.s].filter((k) => typeof k === "string" && PKEY_RE.test(k));
    if (!keys.length || keys.length > 2) return err(400, "bad_key");
    const now = Date.now();
    const lim = await env.DB.prepare("SELECT n, ts FROM auth_fail WHERE k=?").bind("sc:" + user.id).first();
    const inWin = !!lim && now - lim.ts < 60000, n = inWin ? lim.n + 1 : 1;
    if (n > 30) return err(429, "too_many");
    await env.DB.prepare("INSERT INTO auth_fail(k,n,ts) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET n=excluded.n, ts=excluded.ts").bind("sc:" + user.id, n, inWin ? lim.ts : now).run();
    for (const k of keys) await env.DB.prepare("INSERT INTO scores(user_id,mode,pkey,pts) VALUES(?,?,?,?) ON CONFLICT(user_id,mode,pkey) DO UPDATE SET pts=pts+excluded.pts").bind(user.id, b.mode, k, pts).run();
    return json({ ok: true });
  }

  if (path === "/api/history" && m === "GET") {
    const rs = await env.DB.prepare("SELECT id, mode, host_uid, guest_uid, winner_uid, outcome, reason, verified, host_delta, guest_delta, ended_at FROM matches WHERE host_uid=?1 OR guest_uid=?1 ORDER BY ended_at DESC LIMIT 30").bind(user.id).all();
    return json({ ok: true, matches: rs.results });
  }

  return err(404, "not_found");
}

async function admin(request, env, url) {
  if (!adminOk(env, request)) return err(401, "unauthorized", "Sai mã quản trị");
  const path = url.pathname, m = request.method;
  if (path === "/api/admin/users" && m === "GET") {
    const rs = await env.DB.prepare("SELECT u.id, u.username, u.display, u.disabled, u.created_at, u.last_login, r.rating, r.games, r.wins FROM users u LEFT JOIN ratings r ON r.user_id=u.id AND r.mode='online' ORDER BY u.id").all();
    return json({ ok: true, users: rs.results });
  }
  if (path === "/api/admin/users" && m === "POST") {
    const b = await readJson(request, 4096);
    const username = String(b.username || "").trim().toLowerCase();
    const bad = checkNewCreds(username, b.password);
    if (bad) return err(400, "bad_creds", bad);
    const display = cleanName(b.display || username) || username;
    const h = await hashPassword(b.password);
    try {
      const r = await env.DB.prepare("INSERT INTO users(username,display,pass_hash,salt,iters,created_at) VALUES(?,?,?,?,?,?)").bind(username, display, h.pass_hash, h.salt, h.iters, Date.now()).run();
      return json({ ok: true, id: r.meta.last_row_id, username, display }, 201);
    } catch (e) {
      if (/UNIQUE/i.test(String(e && (e.message || e)))) return err(409, "exists", "Tên đăng nhập đã có");
      throw e;
    }
  }
  const mm = /^\/api\/admin\/users\/(\d+)$/.exec(path);
  if (mm && m === "PATCH") {
    const id = +mm[1], b = await readJson(request, 4096);
    const u = await env.DB.prepare("SELECT id FROM users WHERE id=?").bind(id).first();
    if (!u) return err(404, "not_found");
    if (typeof b.display === "string") {
      const d = cleanName(b.display);
      if (!d) return err(400, "bad_display");
      await env.DB.prepare("UPDATE users SET display=? WHERE id=?").bind(d, id).run();
    }
    if (typeof b.disabled === "boolean") {
      await env.DB.prepare("UPDATE users SET disabled=?, token_ver=token_ver+1 WHERE id=?").bind(b.disabled ? 1 : 0, id).run();
    }
    if (b.password !== undefined) {
      const bad = checkNewCreds("abc", b.password);
      if (bad) return err(400, "bad_creds", bad);
      const h = await hashPassword(b.password);
      await env.DB.prepare("UPDATE users SET pass_hash=?, salt=?, iters=?, token_ver=token_ver+1 WHERE id=?").bind(h.pass_hash, h.salt, h.iters, id).run();
    }
    return json({ ok: true });
  }
  return err(404, "not_found");
}
