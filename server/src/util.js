// Tiện ích dùng chung: base64url, HMAC, PBKDF2, JSON, CORS.
const enc = new TextEncoder();
const dec = new TextDecoder();

export function b64u(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function unb64u(s) {
  s = String(s).replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export const utf8 = (s) => enc.encode(s);
export const fromUtf8 = (b) => dec.decode(b);

export function timingSafeEq(a, b) {
  const x = utf8(String(a)), y = utf8(String(b));
  let d = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", utf8(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function hmacSign(secret, data) {
  return b64u(await crypto.subtle.sign("HMAC", await hmacKey(secret), utf8(data)));
}

export const PBKDF2_ITERS = 100000; // giới hạn của WebCrypto trên Workers
export async function pbkdf2(password, saltB64, iters = PBKDF2_ITERS) {
  const key = await crypto.subtle.importKey("raw", utf8(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unb64u(saltB64), iterations: iters }, key, 256);
  return b64u(bits);
}
export function newSalt() {
  return b64u(crypto.getRandomValues(new Uint8Array(16)));
}

export function json(data, status = 200, extra) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(extra || {}) } });
}
export const err = (status, code, msg) => json({ ok: false, error: code, message: msg || code }, status);

export async function readJson(request, max = 64 * 1024) {
  const len = +request.headers.get("content-length") || 0;
  if (len > max) throw Object.assign(new Error("too_big"), { status: 413 });
  const text = await request.text();
  if (text.length > max) throw Object.assign(new Error("too_big"), { status: 413 });
  let v;
  try { v = JSON.parse(text || "{}"); } catch { throw Object.assign(new Error("bad_json"), { status: 400 }); }
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

// ---- CORS ----
export function originAllowed(origin, env) {
  if (!origin) return false;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  const list = String((env && env.ALLOWED_ORIGINS) || "").split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(origin);
}
export function corsHeaders(request, env) {
  const o = request.headers.get("origin");
  const h = { vary: "Origin" };
  if (o && originAllowed(o, env)) {
    h["access-control-allow-origin"] = o;
    h["access-control-allow-methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
    h["access-control-allow-headers"] = "authorization,content-type,x-admin-token";
    h["access-control-max-age"] = "86400";
  }
  return h;
}

// hsx: cùng công thức băng băm của client (05-vfx-core.js) để máy chủ và client tính ra cùng mã trận
export function hsx(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

export const cleanName = (s, max = 24) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
