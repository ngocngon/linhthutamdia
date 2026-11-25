// Xác minh Google ID token (JWT do Google Identity Services cấp) bằng WebCrypto.
// Chuẩn: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
// - chữ ký RS256 theo "kid" với khoá công khai JWKS của Google (cache theo Cache-Control)
// - iss là accounts.google.com hoặc https://accounts.google.com
// - aud đúng GOOGLE_CLIENT_ID, exp/iat còn hạn (cho lệch ±5 phút), email_verified
// Không lưu token; chỉ trả về sub, email, name.
import { unb64u, utf8, fromUtf8 } from "./util.js";

export const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISS = ["accounts.google.com", "https://accounts.google.com"];
const SKEW = 300; // giây
const ALG = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };

// cache trong isolate: { keys: Map<kid, CryptoKey>, exp: ms, lastFetch: ms }
let _jwks = null;
export function _resetJwksCache() { _jwks = null; }

function maxAge(cc) {
  const m = /max-age=(\d+)/i.exec(cc || "");
  const s = m ? +m[1] : 3600;
  return Math.min(Math.max(s, 60), 24 * 3600) * 1000;
}

async function loadJwks(now) {
  const r = await fetch(JWKS_URL, { headers: { accept: "application/json" } });
  if (!r.ok) throw Object.assign(new Error("jwks_http_" + r.status), { status: 503 });
  const j = await r.json();
  const keys = new Map();
  for (const k of (j && Array.isArray(j.keys) ? j.keys : [])) {
    if (!k || k.kty !== "RSA" || typeof k.kid !== "string" || (k.alg && k.alg !== "RS256") || (k.use && k.use !== "sig")) continue;
    try {
      keys.set(k.kid, await crypto.subtle.importKey("jwk", { kty: "RSA", n: k.n, e: k.e, alg: "RS256", ext: true }, ALG, false, ["verify"]));
    } catch { /* bỏ khoá hỏng */ }
  }
  _jwks = { keys, exp: now + maxAge(r.headers.get("cache-control")), lastFetch: now };
  return _jwks;
}

async function keyFor(kid, now) {
  let c = _jwks;
  if (!c || c.exp <= now) c = await loadJwks(now);
  let k = c.keys.get(kid);
  // kid lạ: có thể Google vừa xoay khoá -> tải lại, nhưng không quá 1 lần/phút
  if (!k && now - c.lastFetch > 60000) { c = await loadJwks(now); k = c.keys.get(kid); }
  return k || null;
}

const fail = (reason) => ({ ok: false, reason });

// Trả về { ok:true, sub, email, name } hoặc { ok:false, reason }
export async function verifyGoogleIdToken(env, token, now = Date.now()) {
  const aud = String((env && env.GOOGLE_CLIENT_ID) || "").trim();
  if (!aud) return fail("google_off");
  if (typeof token !== "string" || token.length > 4096) return fail("bad_format");
  const parts = token.split(".");
  if (parts.length !== 3) return fail("bad_format");
  let h, p, sig;
  try {
    h = JSON.parse(fromUtf8(unb64u(parts[0])));
    p = JSON.parse(fromUtf8(unb64u(parts[1])));
    sig = unb64u(parts[2]);
  } catch { return fail("bad_format"); }
  if (!h || h.alg !== "RS256" || typeof h.kid !== "string") return fail("bad_alg");
  const key = await keyFor(h.kid, now);
  if (!key) return fail("unknown_kid");
  const good = await crypto.subtle.verify(ALG, key, sig, utf8(parts[0] + "." + parts[1]));
  if (!good) return fail("bad_signature");
  if (!p || typeof p !== "object") return fail("bad_payload");
  if (!ISS.includes(p.iss)) return fail("bad_iss");
  if (typeof p.aud !== "string" || p.aud !== aud) return fail("bad_aud");
  const t = Math.floor(now / 1000);
  if (typeof p.exp !== "number" || p.exp + SKEW < t) return fail("expired");
  if (typeof p.iat !== "number" || p.iat - SKEW > t) return fail("bad_iat");
  if (typeof p.sub !== "string" || !/^[0-9A-Za-z_-]{1,255}$/.test(p.sub)) return fail("bad_sub");
  if (!(p.email_verified === true || p.email_verified === "true")) return fail("email_unverified");
  const email = typeof p.email === "string" ? p.email.slice(0, 254) : "";
  if (!email) return fail("no_email");
  return { ok: true, sub: p.sub, email, name: typeof p.name === "string" ? p.name : "" };
}
