import { env, SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { taoSaoLuu, danhSachSaoLuu, GIU } from "../src/backup.js";

const H = { "x-admin-token": "test-admin-token-123456" };

describe("sao lưu D1", () => {
  it("tạo bản sao nén, đọc lại đủ bảng và hàng", async () => {
    const r = await taoSaoLuu(env, Date.UTC(2026, 10, 30, 20, 17), "test");
    expect(r.key).toBe("saoluu/2026-11-30T20:17:00.000Z");
    expect(r.bang).toBeGreaterThan(5);
    const buf = await env.BACKUP.get(r.key, { type: "arrayBuffer" });
    const txt = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
    const d = JSON.parse(txt);
    expect(d.v).toBe(1);
    expect(Object.keys(d.tables)).toContain("users");
  });

  it(`chỉ giữ ${GIU} bản mới nhất`, async () => {
    for (let i = 0; i < GIU + 3; i++) await taoSaoLuu(env, Date.UTC(2027, 0, 1 + i), "test");
    const ds = await danhSachSaoLuu(env);
    expect(ds.length).toBe(GIU);
    expect(ds[0].key > ds[ds.length - 1].key).toBe(true);
  });

  it("API quản trị: liệt kê, tạo, tải; không có quyền thì bị chặn", async () => {
    for (const x of await danhSachSaoLuu(env)) await env.BACKUP.delete(x.key);
    expect((await SELF.fetch("https://x/api/admin/backups")).status).toBe(401);
    const c = await (await SELF.fetch("https://x/api/admin/backups", { method: "POST", headers: H })).json();
    expect(c.ok).toBe(true);
    const ls = await (await SELF.fetch("https://x/api/admin/backups", { headers: H })).json();
    expect(ls.items.some((x) => x.key === c.key)).toBe(true);
    const dl = await SELF.fetch("https://x/api/admin/backups/download?key=" + encodeURIComponent(c.key), { headers: H });
    expect(dl.status).toBe(200);
    expect(dl.headers.get("content-type")).toBe("application/gzip");
    expect((await SELF.fetch("https://x/api/admin/backups/download?key=../users", { headers: H })).status).toBe(404);
  });
});
