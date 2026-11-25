import { b64u, unb64u, utf8, fromUtf8, hmacSign, timingSafeEq, pbkdf2, newSalt, PBKDF2_ITERS } from "./util.js";

export const TOKEN_TTL = 30 * 24 * 3600; // giây

/* Khoá ký phiên: dùng secret SESSION_SECRET nếu có; nếu không, tự sinh 32 byte ngẫu nhiên một lần và lưu trong D1
   (bảng config). Đổi khoá = mọi phiên đăng nhập cũ hết hiệu lực. */
let _sk = null;
export async function sessionKey(env) {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (_sk) return _sk;
  const row = await env.DB.prepare("SELECT v FROM config WHERE k='session_secret'").first();
  if (row && row.v) return (_sk = row.v);
  const k = b64u(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare("INSERT OR IGNORE INTO config (k, v) VALUES ('session_secret', ?)").bind(k).run();
  const again = await env.DB.prepare("SELECT v FROM config WHERE k='session_secret'").first();
  return (_sk = again.v);
}

export async function signToken(env, user, now = Date.now()) {
  const p = b64u(utf8(JSON.stringify({ u: user.id, n: user.username, v: user.token_ver | 0, e: Math.floor(now / 1000) + TOKEN_TTL })));
  const body = "v1." + p;
  return body + "." + (await hmacSign(await sessionKey(env), body));
}

// Trả về payload hợp lệ (chưa kiểm tra D1) hoặc null
export async function verifyToken(env, token, now = Date.now()) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const sig = await hmacSign(await sessionKey(env), parts[0] + "." + parts[1]);
  if (!timingSafeEq(sig, parts[2])) return null;
  let p;
  try { p = JSON.parse(fromUtf8(unb64u(parts[1]))); } catch { return null; }
  if (!p || typeof p.u !== "number" || p.e * 1000 < now) return null;
  return p;
}

// Lấy người dùng đang đăng nhập từ token; kiểm tra còn hoạt động và chưa bị thu hồi
export async function authUser(env, token) {
  const p = await verifyToken(env, token);
  if (!p) return null;
  const u = await env.DB.prepare("SELECT id, username, display, disabled, token_ver FROM users WHERE id=?").bind(p.u).first();
  if (!u || u.disabled || (u.token_ver | 0) !== (p.v | 0)) return null;
  return u;
}

export function bearer(request) {
  const h = request.headers.get("authorization") || "";
  const m = /^Bearer\s+(\S+)$/i.exec(h);
  return m ? m[1] : "";
}

export function adminOk(env, request) {
  if (!env.ADMIN_TOKEN || String(env.ADMIN_TOKEN).length < 12) return false;
  const t = request.headers.get("x-admin-token") || bearer(request);
  return !!t && timingSafeEq(t, env.ADMIN_TOKEN);
}

export const USERNAME_RE = /^[a-z0-9_.-]{3,24}$/i;
export function checkNewCreds(username, password) {
  if (!USERNAME_RE.test(String(username || ""))) return "Tên đăng nhập 3–24 ký tự: chữ, số, _ . -";
  if (typeof password !== "string" || password.length < 6 || password.length > 128) return "Mật khẩu 6–128 ký tự";
  return "";
}

export async function hashPassword(password) {
  const salt = newSalt();
  return { salt, iters: PBKDF2_ITERS, pass_hash: await pbkdf2(password, salt, PBKDF2_ITERS) };
}

// ---- chống dò mật khẩu: 6 lần sai / 10 phút theo (tên, IP) ----
const FAIL_MAX = 6, FAIL_MAX_IP = 40, FAIL_WIN = 10 * 60 * 1000;
export async function throttled(env, key, now = Date.now()) {
  const r = await env.DB.prepare("SELECT n, ts FROM auth_fail WHERE k=?").bind(key).first();
  return !!r && now - r.ts < FAIL_WIN && r.n >= (key.startsWith("i:") ? FAIL_MAX_IP : FAIL_MAX);
}
export async function noteFail(env, key, now = Date.now()) {
  const r = await env.DB.prepare("SELECT n, ts FROM auth_fail WHERE k=?").bind(key).first();
  const n = r && now - r.ts < FAIL_WIN ? r.n + 1 : 1;
  await env.DB.prepare("INSERT INTO auth_fail(k,n,ts) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET n=excluded.n, ts=excluded.ts").bind(key, n, now).run();
}
export async function clearFail(env, key) {
  await env.DB.prepare("DELETE FROM auth_fail WHERE k=?").bind(key).run();
}

export async function login(env, request, username, password) {
  const ip = request.headers.get("cf-connecting-ip") || "-";
  const uname = String(username || "").toLowerCase().slice(0, 40);
  const keys = ["u:" + uname, "i:" + ip];
  for (const k of keys) if (await throttled(env, k)) return { status: 429, error: "too_many", message: "Sai quá nhiều lần, thử lại sau ít phút" };
  const u = await env.DB.prepare("SELECT * FROM users WHERE username=?").bind(uname).first();
  // tài khoản chỉ có Google (pass_hash rỗng) KHÔNG BAO GIỜ đăng nhập được bằng mật khẩu
  const hasPw = !!(u && u.pass_hash && u.salt && u.iters > 0);
  // luôn tính băm để tránh lộ tên có tồn tại hay không qua thời gian phản hồi
  const h = await pbkdf2(String(password || "").slice(0, 128), hasPw ? u.salt : "AAAAAAAAAAAAAAAAAAAAAA", hasPw ? u.iters : PBKDF2_ITERS);
  if (!u || !hasPw || u.disabled || !timingSafeEq(h, u.pass_hash)) {
    for (const k of keys) await noteFail(env, k);
    return { status: 401, error: "bad_login", message: u && u.disabled ? "Tài khoản đã bị khoá" : "Sai tên đăng nhập hoặc mật khẩu" };
  }
  await clearFail(env, "u:" + uname);
  await env.DB.prepare("UPDATE users SET last_login=? WHERE id=?").bind(Date.now(), u.id).run();
  return { status: 200, token: await signToken(env, u), user: { id: u.id, username: u.username, display: u.display } };
}

// Kiểm tra mật khẩu của một người dùng đã có (dùng khi đổi mật khẩu)
export async function checkPassword(u, password) {
  if (!u || !u.pass_hash || !u.salt || !(u.iters > 0)) return false;
  const h = await pbkdf2(String(password || "").slice(0, 128), u.salt, u.iters);
  return timingSafeEq(h, u.pass_hash);
}

export const clientIp = (request) => request.headers.get("cf-connecting-ip") || "-";
