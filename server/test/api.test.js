import { SELF, env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

const A = { "x-admin-token": "test-admin-token-123456", "content-type": "application/json" };
const post = (path, body, headers = {}) => SELF.fetch("https://t" + path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

async function mkUser(name, pw = "matkhau123") {
  const r = await post("/api/admin/users", { username: name, password: pw, display: "Tên " + name }, A);
  return r;
}
async function loginTok(name, pw = "matkhau123") {
  const r = await post("/api/login", { username: name, password: pw });
  const j = await r.json();
  return j.token;
}

describe("quản trị & đăng nhập", () => {
  it("không có mã quản trị thì bị từ chối", async () => {
    expect((await post("/api/admin/users", { username: "abc", password: "123456" })).status).toBe(401);
    expect((await post("/api/admin/users", { username: "abc", password: "123456" }, { "x-admin-token": "sai" })).status).toBe(401);
  });
  it("tạo, trùng tên, đăng nhập, sai mật khẩu", async () => {
    expect((await mkUser("alice")).status).toBe(201);
    expect((await mkUser("ALICE")).status).toBe(409);
    expect((await post("/api/admin/users", { username: "a!", password: "123456" }, A)).status).toBe(400);
    const ok = await post("/api/login", { username: "Alice", password: "matkhau123" });
    expect(ok.status).toBe(200);
    const j = await ok.json();
    expect(j.token).toMatch(/^v1\./);
    expect(j.user.display).toBe("Tên alice");
    expect((await post("/api/login", { username: "alice", password: "sai" })).status).toBe(401);
    expect((await post("/api/login", { username: "khongco", password: "sai" })).status).toBe(401);
  });
  it("khoá sau nhiều lần sai", async () => {
    await mkUser("bob");
    for (let i = 0; i < 6; i++) await post("/api/login", { username: "bob", password: "sai" + i });
    expect((await post("/api/login", { username: "bob", password: "matkhau123" })).status).toBe(429);
  });
  it("/api/me cần token, khoá tài khoản thu hồi token, đổi mật khẩu thu hồi token", async () => {
    const r = await mkUser("carol");
    const { id } = await r.json();
    const tok = await loginTok("carol");
    const me = () => SELF.fetch("https://t/api/me", { headers: { authorization: "Bearer " + tok } });
    expect((await SELF.fetch("https://t/api/me")).status).toBe(401);
    expect((await SELF.fetch("https://t/api/me", { headers: { authorization: "Bearer v1.x.y" } })).status).toBe(401);
    const j = await (await me()).json();
    expect(j.user.username).toBe("carol");
    expect(j.ratings.online.rating).toBe(1000);
    await SELF.fetch("https://t/api/admin/users/" + id, { method: "PATCH", headers: A, body: JSON.stringify({ disabled: true }) });
    expect((await me()).status).toBe(401);
    expect((await post("/api/login", { username: "carol", password: "matkhau123" })).status).toBe(401);
    await SELF.fetch("https://t/api/admin/users/" + id, { method: "PATCH", headers: A, body: JSON.stringify({ disabled: false, password: "moi12345" }) });
    expect((await me()).status).toBe(401);
    expect((await post("/api/login", { username: "carol", password: "moi12345" })).status).toBe(200);
  });
  it("danh sách tài khoản (admin)", async () => {
    const r = await SELF.fetch("https://t/api/admin/users", { headers: A });
    const j = await r.json();
    expect(j.users.length).toBeGreaterThan(0);
    expect(JSON.stringify(j)).not.toContain("pass_hash");
  });
});

describe("tiến trình, bảng xếp hạng, CORS", () => {
  it("lưu/đọc tiến trình, phát hiện xung đột", async () => {
    await mkUser("dave");
    const tok = await loginTok("dave");
    const H = { authorization: "Bearer " + tok, "content-type": "application/json" };
    let r = await (await SELF.fetch("https://t/api/save", { headers: H })).json();
    expect(r.blob).toBe(null);
    r = await (await SELF.fetch("https://t/api/save", { method: "PUT", headers: H, body: JSON.stringify({ blob: '{"gold":5}', base: 0 }) })).json();
    expect(r.version).toBe(1);
    r = await (await SELF.fetch("https://t/api/save", { headers: H })).json();
    expect(JSON.parse(r.blob).gold).toBe(5);
    const c = await SELF.fetch("https://t/api/save", { method: "PUT", headers: H, body: JSON.stringify({ blob: '{"gold":6}', base: 0 }) });
    expect(c.status).toBe(409);
    expect((await SELF.fetch("https://t/api/save", { method: "PUT", headers: H, body: JSON.stringify({ blob: "không phải json" }) })).status).toBe(400);
    expect((await SELF.fetch("https://t/api/save", { method: "PUT", headers: H, body: JSON.stringify({ blob: '{"a":"' + "x".repeat(600000) + '"}' }) })).status).toBe(413);
  });
  it("điểm theo kỳ và bảng xếp hạng", async () => {
    await mkUser("erin");
    const tok = await loginTok("erin");
    const H = { authorization: "Bearer " + tok, "content-type": "application/json" };
    expect((await post("/api/score", { mode: "online", pts: 3, d: "d2026-11-23" }, H)).status).toBe(400);
    expect((await post("/api/score", { mode: "jr", pts: 3, d: "d2026-11-23", s: "m2026-11" }, H)).status).toBe(200);
    expect((await post("/api/score", { mode: "jr", pts: 3, d: "d2026-11-23" }, H)).status).toBe(200);
    expect((await post("/api/score", { mode: "jr", pts: 99, d: "d2026-11-23" }, H)).status).toBe(400);
    const j = await (await SELF.fetch("https://t/api/leaderboard?mode=jr&key=d2026-11-23", { headers: H })).json();
    expect(j.rows[0].v).toBe(6);
    expect(j.rows[0].me).toBe(true);
    expect(j.me.rank).toBe(1);
  });
  it("CORS chỉ cho nguồn được phép", async () => {
    const ok = await SELF.fetch("https://t/api/health", { headers: { origin: "https://tamdia.pages.dev" } });
    expect(ok.headers.get("access-control-allow-origin")).toBe("https://tamdia.pages.dev");
    const lo = await SELF.fetch("https://t/api/health", { headers: { origin: "http://localhost:8793" } });
    expect(lo.headers.get("access-control-allow-origin")).toBe("http://localhost:8793");
    const cap = await SELF.fetch("https://t/api/health", { headers: { origin: "https://localhost" } });
    expect(cap.headers.get("access-control-allow-origin")).toBe("https://localhost");
    const bad = await SELF.fetch("https://t/api/health", { headers: { origin: "https://evil.example" } });
    expect(bad.headers.get("access-control-allow-origin")).toBe(null);
    const pre = await SELF.fetch("https://t/api/login", { method: "OPTIONS", headers: { origin: "https://tamdia.pages.dev", "access-control-request-method": "POST" } });
    expect(pre.status).toBe(204);
    expect(pre.headers.get("access-control-allow-headers")).toContain("authorization");
  });
  it("trang quản trị được phục vụ", async () => {
    const r = await SELF.fetch("https://t/admin");
    expect(r.status).toBe(200);
    const t = await r.text();
    expect(t).toContain("Linh Thú Tam Địa — Quản trị");
    expect(t).not.toMatch(/<script[^>]+src=/);
  });
});
