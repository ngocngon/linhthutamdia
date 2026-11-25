// Tiện ích dùng chung cho vận hành/quản trị: ngày giờ Việt Nam, phần quà, nhật ký quản trị, băm IP.
import { hmacSign } from "./util.js";
import { sessionKey } from "./auth.js";
import { CARDS } from "./cards.js";

// Phiên bản Worker: tăng khi đổi mã máy chủ (hiện ở trang Sức khoẻ máy chủ)
export const WORKER_VERSION = "2026.11.25-admin1";

export const VN_OFFSET = 7 * 3600 * 1000;
export const DAY_MS = 24 * 3600 * 1000;
// 'YYYY-MM-DD' theo giờ Việt Nam
export const vnDay = (ts) => new Date(ts + VN_OFFSET).toISOString().slice(0, 10);
export const dayAdd = (day, n) => new Date(Date.parse(day + "T00:00:00Z") + n * DAY_MS).toISOString().slice(0, 10);
// mốc 00:00 giờ Việt Nam của một ngày
export const dayStart = (day) => Date.parse(day + "T00:00:00Z") - VN_OFFSET;
export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const ONLINE_MS = 6 * 60 * 1000; // ping trong 6 phút = đang online
export const PING_MS = 5 * 60 * 1000; // game ping mỗi 5 phút khi trang hiển thị

// ---- phần quà ----
export const REWARD_CAPS = { vang: 1000000, ngoc: 100000, token: 10000, diem: 100000 };
export const CARD_ID_RE = /^[a-z0-9_]{2,40}$/;
// Trả { rewards } (đã chuẩn hoá, chỉ giữ khoá có giá trị) hoặc { error, message }
export function cleanRewards(r, { required = false } = {}) {
  if (r == null || r === "") r = {};
  if (typeof r === "string") { try { r = JSON.parse(r); } catch { return { error: "bad_rewards", message: "Phần quà không phải JSON" }; } }
  if (typeof r !== "object" || Array.isArray(r)) return { error: "bad_rewards", message: "Phần quà phải là đối tượng" };
  const out = {};
  for (const k of Object.keys(r)) {
    if (k === "the") continue;
    if (!(k in REWARD_CAPS)) return { error: "bad_rewards", message: "Khoá quà không hợp lệ: " + String(k).slice(0, 20) };
    const v = r[k];
    if (v == null || v === 0) continue;
    if (!Number.isInteger(v) || v < 0) return { error: "bad_rewards", message: k + " phải là số nguyên không âm" };
    if (v > REWARD_CAPS[k]) return { error: "bad_rewards", message: k + " tối đa " + REWARD_CAPS[k] };
    out[k] = v;
  }
  if (r.the != null) {
    if (!Array.isArray(r.the)) return { error: "bad_rewards", message: "the phải là danh sách id thẻ" };
    if (r.the.length > 20) return { error: "bad_rewards", message: "Tối đa 20 thẻ" };
    for (const id of r.the) if (typeof id !== "string" || !CARD_ID_RE.test(id) || !Object.prototype.hasOwnProperty.call(CARDS, id)) return { error: "bad_rewards", message: "Id thẻ không hợp lệ: " + String(id).slice(0, 40) };
    if (r.the.length) out.the = [...new Set(r.the)];
  }
  if (required && !Object.keys(out).length) return { error: "bad_rewards", message: "Cần ít nhất một phần quà" };
  return { rewards: out };
}
export function parseRewards(s) {
  try { const r = JSON.parse(s || "{}"); return r && typeof r === "object" && !Array.isArray(r) ? r : {}; } catch { return {}; }
}

// ---- nhật ký quản trị ----
export async function logAdmin(env, action, target = "", detail = {}) {
  let d = typeof detail === "string" ? detail : JSON.stringify(detail);
  if (d.length > 2000) d = d.slice(0, 2000);
  await env.DB.prepare("INSERT INTO admin_log(ts,action,target,detail) VALUES(?,?,?,?)").bind(Date.now(), action, String(target).slice(0, 80), d).run();
}

// Băm IP bằng khoá phiên (không lưu IP thô); "-" (không rõ) thì trả null
export async function ipTag(env, ip) {
  if (!ip || ip === "-") return null;
  return (await hmacSign(await sessionKey(env), "ip|" + ip)).slice(0, 16);
}

// Giới hạn tần suất dùng chung bảng auth_fail: { n, ok } — n là số lần trong cửa sổ hiện tại (đã cộng lần này nếu add)
export async function rateHit(env, key, max, winMs, { add = true, now = Date.now() } = {}) {
  const r = await env.DB.prepare("SELECT n, ts FROM auth_fail WHERE k=?").bind(key).first();
  const inWin = !!r && now - r.ts < winMs;
  const cur = inWin ? r.n : 0;
  if (cur >= max) return { ok: false, n: cur };
  if (add) await env.DB.prepare("INSERT INTO auth_fail(k,n,ts) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET n=excluded.n, ts=excluded.ts").bind(key, cur + 1, inWin ? r.ts : now).run();
  return { ok: true, n: cur + (add ? 1 : 0) };
}
