import { SELF, env } from "cloudflare:test";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { handleApi } from "../src/api.js";
import { JWKS_URL, _resetJwksCache } from "../src/google.js";
import { b64u, utf8 } from "../src/util.js";

const A = { "x-admin-token": "test-admin-token-123456", "content-type": "application/json" };
const post = (path, body, headers = {}) => SELF.fetch("https://t" + path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
const reg = (ip, username, password = "matkhau123", display) => post("/api/register", { username, password, display }, { "cf-connecting-ip": ip });
const me = (tok) => SELF.fetch("https://t/api/me", { headers: { authorization: "Bearer " + tok } });
const setOpen = (v) => SELF.fetch("https://t/api/admin/config", { method: "PUT", headers: A, body: JSON.stringify({ registerOpen: v }) });

describe("đăng ký mở", () => {
  it("cấu hình công khai, đăng ký thành công trả phiên đăng nhập", async () => {
    const c = await (await SELF.fetch("https://t/api/config")).json();
    expect(c.registerOpen).toBe(true);
    expect(c.googleClientId).toBe("");
    const r = await reg("10.0.0.1", "TanThu1", "matkhau123", "Tân Thủ <b>");
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.token).toMatch(/^v1\./);
    expect(j.user.username).toBe("tanthu1");
    expect(j.user.display).toBe("Tân Thủ b");
    expect(j.created).toBe(true);
    const m = await (await me(j.token)).json();
    expect(m.hasPassword).toBe(true);
    expect(m.google).toEqual({ linked: false, email: "" });
    expect((await post("/api/login", { username: "tanthu1", password: "matkhau123" })).status).toBe(200);
  });
  it("trùng tên, sai định dạng", async () => {
    expect((await reg("10.0.0.3", "trung1")).status).toBe(200);
    const d = await reg("10.0.0.3", "TRUNG1");
    expect(d.status).toBe(409);
    expect((await d.json()).error).toBe("exists");
    const b1 = await reg("10.0.0.3", "a!");
    expect(b1.status).toBe(400);
    expect((await b1.json()).error).toBe("bad_creds");
    expect((await reg("10.0.0.3", "ab")).status).toBe(400);
    expect((await reg("10.0.0.3", "hople1", "123")).status).toBe(400);
    expect((await reg("10.0.0.3", "hople2", 123456)).status).toBe(400);
  });
  it("vượt giới hạn tài khoản mỗi IP mỗi giờ", async () => {
    for (let i = 0; i < 5; i++) expect((await reg("10.0.0.2", "spam" + i)).status).toBe(200);
    const r = await reg("10.0.0.2", "spam5");
    expect(r.status).toBe(429);
    expect((await r.json()).error).toBe("too_many_accounts");
    expect((await reg("10.0.0.9", "spam5")).status).toBe(200);
  });
  it("quản trị tắt/bật đăng ký", async () => {
    expect((await SELF.fetch("https://t/api/admin/config", { method: "PUT", headers: { "content-type": "application/json" }, body: '{"registerOpen":false}' })).status).toBe(401);
    expect((await setOpen(false)).status).toBe(200);
    expect((await (await SELF.fetch("https://t/api/config")).json()).registerOpen).toBe(false);
    expect((await (await SELF.fetch("https://t/api/admin/config", { headers: A })).json()).registerOpen).toBe(false);
    const r = await reg("10.0.0.4", "dongcua");
    expect(r.status).toBe(403);
    expect((await r.json()).error).toBe("register_closed");
    // quản trị vẫn tạo được
    expect((await post("/api/admin/users", { username: "dongcua", password: "matkhau123" }, A)).status).toBe(201);
    expect((await setOpen(true)).status).toBe(200);
    expect((await reg("10.0.0.4", "mocua")).status).toBe(200);
  });
});

/* ---------- Google: khoá RSA tự sinh + JWKS giả lập (không gọi Google thật) ---------- */
const CID = "123-test.apps.googleusercontent.com";
const GENV = () => ({ ...env, GOOGLE_CLIENT_ID: CID });
let K1, K2, jwk1, jwksCalls = 0, realFetch;
const now = () => Math.floor(Date.now() / 1000);

async function mkKey() {
  return crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
}
async function idToken(claims = {}, { key = K1, kid = "k1", alg = "RS256" } = {}) {
  const h = b64u(utf8(JSON.stringify({ alg, kid, typ: "JWT" })));
  const p = b64u(utf8(JSON.stringify({ iss: "https://accounts.google.com", aud: CID, sub: "1001", email: "alice.nguyen@gmail.com", email_verified: true, name: "Alice Nguyễn", iat: now() - 10, exp: now() + 3600, ...claims })));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key.privateKey, utf8(h + "." + p));
  return h + "." + p + "." + b64u(sig);
}
async function call(path, body, { token, ip = "20.0.0.1", e = GENV() } = {}) {
  const h = { "content-type": "application/json", "cf-connecting-ip": ip };
  if (token) h.authorization = "Bearer " + token;
  const req = new Request("https://t" + path, { method: "POST", headers: h, body: JSON.stringify(body || {}) });
  const r = await handleApi(req, e, new URL(req.url));
  return { status: r.status, j: await r.json() };
}

beforeAll(async () => {
  K1 = await mkKey(); K2 = await mkKey();
  jwk1 = { ...(await crypto.subtle.exportKey("jwk", K1.publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  realFetch = globalThis.fetch;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (u, init) => {
    if (String(u) === JWKS_URL) { jwksCalls++; return new Response(JSON.stringify({ keys: [jwk1] }), { headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" } }); }
    return realFetch(u, init);
  });
  _resetJwksCache();
});
afterAll(() => vi.restoreAllMocks());

describe("đăng nhập Google", () => {
  it("token hợp lệ tạo tài khoản rồi đăng nhập lại đúng tài khoản; JWKS được cache", async () => {
    const r1 = await call("/api/login/google", { credential: await idToken() });
    expect(r1.status).toBe(200);
    expect(r1.j.created).toBe(true);
    expect(r1.j.user.username).toMatch(/^alice\.nguyen\d{4}$/);
    expect(r1.j.user.display).toBe("Alice Nguyễn");
    const r2 = await call("/api/login/google", { credential: await idToken({ iss: "accounts.google.com", email: "alice2@gmail.com" }) });
    expect(r2.status).toBe(200);
    expect(r2.j.created).toBe(false);
    expect(r2.j.user.id).toBe(r1.j.user.id);
    expect(jwksCalls).toBe(1);
    const m = await (await me(r2.j.token)).json();
    expect(m.google).toEqual({ linked: true, email: "alice2@gmail.com" });
    expect(m.hasPassword).toBe(false);
    // không lưu token Google
    const row = await env.DB.prepare("SELECT * FROM users WHERE id=?").bind(r1.j.user.id).first();
    expect(JSON.stringify(row)).not.toContain(".ey");
    expect(row.google_sub).toBe("1001");
  });
  it("tài khoản chỉ có Google không đăng nhập được bằng mật khẩu (kể cả rỗng)", async () => {
    const r = await call("/api/login/google", { credential: await idToken({ sub: "1002", email: "bob@gmail.com" }) });
    const u = r.j.user.username;
    for (const pw of ["", "matkhau123", undefined]) expect((await post("/api/login", { username: u, password: pw })).status).toBe(401);
  });
  it("từ chối: sai aud, sai iss, hết hạn, iat tương lai, sai chữ ký, kid lạ, chưa xác minh email, alg khác, rác", async () => {
    const bad = async (tok, reason) => { const r = await call("/api/login/google", { credential: tok }, { ip: "20.0.0.2" }); expect(r.status).toBe(401); expect(r.j.reason).toBe(reason); };
    await bad(await idToken({ aud: "khac.apps.googleusercontent.com" }), "bad_aud");
    await bad(await idToken({ iss: "https://evil.example" }), "bad_iss");
    await bad(await idToken({ exp: now() - 400, iat: now() - 4000 }), "expired");
    await bad(await idToken({ iat: now() + 3600 }), "bad_iat");
    await bad(await idToken({}, { key: K2 }), "bad_signature");
    await bad(await idToken({}, { key: K2, kid: "k9" }), "unknown_kid");
    await bad(await idToken({ email_verified: false }), "email_unverified");
    await bad(await idToken({}, { alg: "HS256" }), "bad_alg");
    await bad("khong.phai.jwt", "bad_format");
    // lệch đồng hồ trong 5 phút vẫn chấp nhận
    expect((await call("/api/login/google", { credential: await idToken({ sub: "1003", email: "c@gmail.com", exp: now() - 100 }) }, { ip: "20.0.0.3" })).status).toBe(200);
  });
  it("chưa đặt GOOGLE_CLIENT_ID thì 503 google_off", async () => {
    const r = await call("/api/login/google", { credential: await idToken() }, { e: { ...env, GOOGLE_CLIENT_ID: "" } });
    expect(r.status).toBe(503);
    expect(r.j.error).toBe("google_off");
    expect((await post("/api/login/google", { credential: "x" })).status).toBe(503); // cấu hình thật của wrangler.toml để trống
  });
  it("đăng ký đóng thì Google không tạo tài khoản mới nhưng vẫn đăng nhập tài khoản đã có", async () => {
    await call("/api/login/google", { credential: await idToken({ sub: "1004", email: "d@gmail.com" }) }, { ip: "20.0.0.4" });
    await setOpen(false);
    expect((await call("/api/login/google", { credential: await idToken({ sub: "1005", email: "e@gmail.com" }) }, { ip: "20.0.0.4" })).status).toBe(403);
    expect((await call("/api/login/google", { credential: await idToken({ sub: "1004", email: "d@gmail.com" }) }, { ip: "20.0.0.4" })).status).toBe(200);
    await setOpen(true);
  });
});

describe("liên kết / huỷ liên kết / đặt mật khẩu", () => {
  it("liên kết Google vào tài khoản mật khẩu, Google đó đăng nhập vào đúng tài khoản; 409 khi đã thuộc tài khoản khác", async () => {
    const a = await (await reg("30.0.0.1", "linker1")).json();
    const b = await (await reg("30.0.0.1", "linker2")).json();
    expect((await call("/api/link/google", { credential: await idToken({ sub: "2001", email: "l1@gmail.com" }) })).status).toBe(401);
    const l = await call("/api/link/google", { credential: await idToken({ sub: "2001", email: "l1@gmail.com" }) }, { token: a.token });
    expect(l.status).toBe(200);
    expect(l.j.google).toEqual({ linked: true, email: "l1@gmail.com" });
    expect((await (await me(a.token)).json()).google.email).toBe("l1@gmail.com");
    const g = await call("/api/login/google", { credential: await idToken({ sub: "2001", email: "l1@gmail.com" }) });
    expect(g.j.user.id).toBe(a.user.id);
    expect(g.j.created).toBe(false);
    const t = await call("/api/link/google", { credential: await idToken({ sub: "2001", email: "l1@gmail.com" }) }, { token: b.token });
    expect(t.status).toBe(409);
    expect(t.j.error).toBe("google_taken");
    const h = await call("/api/link/google", { credential: await idToken({ sub: "2002", email: "l2@gmail.com" }) }, { token: a.token });
    expect(h.status).toBe(409);
    expect(h.j.error).toBe("has_google");
    // huỷ liên kết (có mật khẩu) -> Google đó lần sau tạo tài khoản mới
    const u = await post("/api/unlink/google", {}, { authorization: "Bearer " + a.token });
    expect(u.status).toBe(200);
    expect((await (await me(a.token)).json()).google.linked).toBe(false);
    const g2 = await call("/api/login/google", { credential: await idToken({ sub: "2001", email: "l1@gmail.com" }) }, { ip: "30.0.0.2" });
    expect(g2.j.created).toBe(true);
    expect(g2.j.user.id).not.toBe(a.user.id);
  });
  it("tài khoản chỉ-Google: không huỷ liên kết được khi chưa có mật khẩu; đặt mật khẩu rồi đăng nhập cả hai cách; đổi mật khẩu cần mật khẩu cũ", async () => {
    const g = await call("/api/login/google", { credential: await idToken({ sub: "3001", email: "only@gmail.com", name: "" }) }, { ip: "40.0.0.1" });
    expect(g.j.user.display).toBe(g.j.user.username);
    const H = (tk) => ({ authorization: "Bearer " + tk });
    const nu = await post("/api/unlink/google", {}, H(g.j.token));
    expect(nu.status).toBe(400);
    expect((await nu.json()).error).toBe("need_password");
    expect((await post("/api/password", { password: "12" }, H(g.j.token))).status).toBe(400);
    const sp = await (await post("/api/password", { password: "moi-mat-khau" }, H(g.j.token))).json();
    expect(sp.ok).toBe(true);
    expect((await me(g.j.token)).status).toBe(200); // đặt lần đầu không đăng xuất máy khác
    expect((await (await me(sp.token)).json()).hasPassword).toBe(true);
    expect((await post("/api/login", { username: g.j.user.username, password: "moi-mat-khau" })).status).toBe(200);
    expect((await call("/api/login/google", { credential: await idToken({ sub: "3001", email: "only@gmail.com" }) })).j.user.id).toBe(g.j.user.id);
    // đổi mật khẩu: thiếu/sai mật khẩu cũ bị từ chối
    expect((await post("/api/password", { password: "khac-nua-123" }, H(sp.token))).status).toBe(403);
    expect((await post("/api/password", { password: "khac-nua-123", old: "sai" }, H(sp.token))).status).toBe(403);
    const ch = await (await post("/api/password", { password: "khac-nua-123", old: "moi-mat-khau" }, H(sp.token))).json();
    expect(ch.ok).toBe(true);
    expect((await me(sp.token)).status).toBe(401); // phiên cũ bị thu hồi
    expect((await me(ch.token)).status).toBe(200);
    expect((await post("/api/unlink/google", {}, H(ch.token))).status).toBe(200);
  });
  it("trang quản trị: cột Google và công tắc đăng ký", async () => {
    const j = await (await SELF.fetch("https://t/api/admin/users", { headers: A })).json();
    const row = j.users.find((u) => u.email === "alice2@gmail.com");
    expect(row && row.google).toBe(1);
    expect(JSON.stringify(j)).not.toContain("google_sub");
    expect(JSON.stringify(j)).not.toContain("pass_hash");
    const html = await (await SELF.fetch("https://t/admin")).text();
    expect(html).toContain("Cho phép đăng ký");
    expect(html).toContain("Google");
  });
});
