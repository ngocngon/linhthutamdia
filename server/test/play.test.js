import { SELF, env, runInDurableObject, runDurableObjectAlarm } from "cloudflare:test";
import { describe, it, expect } from "vitest";

const A = { "x-admin-token": "test-admin-token-123456", "content-type": "application/json" };
async function user(name) {
  const r = await SELF.fetch("https://t/api/admin/users", { method: "POST", headers: A, body: JSON.stringify({ username: name, password: "matkhau123", display: name.toUpperCase() }) });
  const { id } = await r.json();
  const l = await (await SELF.fetch("https://t/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: name, password: "matkhau123" }) })).json();
  return { id, token: l.token, name };
}
async function open(token, qs = "") {
  const res = await SELF.fetch("https://t/api/play" + qs, { headers: { upgrade: "websocket", "sec-websocket-protocol": "ltd1, tk." + token } });
  if (res.status !== 101) return { status: res.status };
  const ws = res.webSocket; ws.accept();
  const msgs = [], waiters = [];
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); msgs.push(m); waiters.splice(0).forEach((f) => f()); });
  const closed = new Promise((r) => ws.addEventListener("close", (e) => r(e.code)));
  const wait = async (pred, ms = 8000) => {
    const t0 = Date.now();
    for (;;) {
      const i = msgs.findIndex(pred);
      if (i >= 0) return msgs.splice(i, 1)[0];
      if (Date.now() - t0 > ms) throw new Error("hết giờ chờ tin: " + JSON.stringify(msgs));
      await new Promise((r) => { waiters.push(r); setTimeout(r, 100); });
    }
  };
  return { ws, msgs, wait, closed, send: (o) => ws.send(JSON.stringify(o)), status: 101 };
}
const pres = (nm) => ({ v: 2, nm, av: "x", rk: 5, dk: Array.from({ length: 12 }, (_, i) => "c" + i) });

async function pair(u1, u2, extra = {}) {
  const l1 = await open(u1.token), l2 = await open(u2.token);
  await l1.wait((m) => m.type === "hello"); await l2.wait((m) => m.type === "hello");
  l1.send({ type: "seek", mode: "online", pres: pres(u1.name), keys: { d: "d2026-11-23", s: "m2026-11" }, ...extra });
  l2.send({ type: "seek", mode: "online", pres: pres(u2.name), keys: { d: "d2026-11-23", s: "m2026-11" }, ...extra });
  const f1 = await l1.wait((m) => m.type === "found"), f2 = await l2.wait((m) => m.type === "found");
  l1.ws.close(); l2.ws.close();
  return { f1, f2 };
}

describe("ghép trận", () => {
  it("ghép hai người, cùng mã trận, một chủ phòng một khách", async () => {
    const a = await user("ppp1"), b = await user("ppp2");
    const { f1, f2 } = await pair(a, b);
    expect(f1.mid).toBe(f2.mid);
    expect(f1.mid).toMatch(/^m-[a-z0-9]+$/);
    expect([f1.role, f2.role].sort()).toEqual(["guest", "host"]);
    expect(f1.opp.peer).toBe(f2.me.peer);
    expect(f1.opp.pres.nm).toBe("ppp2");
    expect(f1.opp.pres.dk.length).toBe(12);
    expect(f1.opp.pres.pid).toBe("u" + b.id);
  });
  it("mã riêng ngăn ghép chéo; cùng người không tự ghép với mình", async () => {
    const a = await user("qqq1"), b = await user("qqq2");
    const la = await open(a.token), lb = await open(b.token);
    await la.wait((m) => m.type === "hello"); await lb.wait((m) => m.type === "hello");
    la.send({ type: "seek", pres: pres("a"), code: "abc" });
    lb.send({ type: "seek", pres: pres("b"), code: "xyz" });
    await new Promise((r) => setTimeout(r, 400));
    expect(la.msgs.find((m) => m.type === "found")).toBeUndefined();
    const la2 = await open(a.token);
    expect(await la.closed).toBe(4000);
    la2.ws.close(); lb.ws.close();
  });
  it("từ chối khi chưa đăng nhập / sai nguồn / không phải người trong trận", async () => {
    expect((await open("v1.x.y")).status).toBe(401);
    const r = await SELF.fetch("https://t/api/play", { headers: { upgrade: "websocket", origin: "https://evil.example", "sec-websocket-protocol": "ltd1, tk.x" } });
    expect(r.status).toBe(403);
    const a = await user("rrr1"), b = await user("rrr2"), c = await user("rrr3");
    const { f1 } = await pair(a, b);
    expect((await open(c.token, "?room=" + f1.mid)).status).toBe(403);
    expect((await open(a.token, "?room=m-khongco")).status).toBe(404);
  });
});

describe("phòng trận", () => {
  it("chuyển tiếp presence, báo kết quả hai bên, cập nhật Elo và bảng", async () => {
    const a = await user("sss1"), b = await user("sss2");
    const { f1, f2 } = await pair(a, b);
    const ra = await open(a.token, "?room=" + f1.mid), rb = await open(b.token, "?room=" + f1.mid);
    const ha = await ra.wait((m) => m.type === "hello");
    expect(ha.me).toBe("u" + a.id);
    ra.send({ type: "pres", patch: { v: 2, mid: f1.mid, t: 1, sub: 1, acts: [{ t: "p", u: 1, l: 0 }], pid: "gia" } });
    const pa = await rb.wait((m) => m.type === "peers" && m.peers.length === 2 && m.peers.find((p) => p.peer === "u" + a.id).presence.sub === 1);
    const pr = pa.peers.find((p) => p.peer === "u" + a.id).presence;
    expect(pr.pid).toBe("u" + a.id); // không giả mạo được
    expect(pr.acts.length).toBe(1);
    expect(pr._at).toBeUndefined();
    ra.send({ type: "pres", patch: { sub: null, junk: "x" } });
    const pb = await rb.wait((m) => m.type === "peers" && m.peers.find((p) => p.peer === "u" + a.id && p.presence.sub === undefined));
    expect(pb.peers.find((p) => p.peer === "u" + a.id).presence.junk).toBeUndefined();
    // la: hành động lượt vừa chốt (máy kia bắt kịp sau khi mất kết nối) — được chuyển tiếp, lọc gọn
    ra.send({ type: "pres", patch: { la: { t: 1, acts: [{ t: "p", u: 1, l: 0 }], sn: 7, x: "bỏ" } } });
    const pl = await rb.wait((m) => m.type === "peers" && m.peers.find((p) => p.peer === "u" + a.id && p.presence.la));
    expect(pl.peers.find((p) => p.peer === "u" + a.id).presence.la).toEqual({ t: 1, acts: [{ t: "p", u: 1, l: 0 }], sn: 1 });
    // kết quả: bên A (người thứ nhất) thắng
    ra.send({ type: "result", w: "p", kind: "end" });
    rb.send({ type: "result", w: "a", kind: "end" });
    const ea = await ra.wait((m) => m.type === "ended");
    expect(ea.result.winner).toBe(a.id);
    expect(ea.result.verified).toBe(true);
    expect(ea.result.deltas[a.id]).toBe(12);
    expect(ea.result.deltas[b.id]).toBe(-12);
    const rows = await (await SELF.fetch("https://t/api/leaderboard?mode=online", { headers: { authorization: "Bearer " + a.token } })).json();
    expect(rows.rows[0].name).toBe("SSS1");
    expect(rows.rows[0].v).toBe(1012);
    const sc = await (await SELF.fetch("https://t/api/leaderboard?mode=online&key=d2026-11-23", { headers: { authorization: "Bearer " + a.token } })).json();
    expect(sc.rows[0].v).toBe(3);
    const h = await (await SELF.fetch("https://t/api/history", { headers: { authorization: "Bearer " + b.token } })).json();
    expect(h.matches[0].outcome).toBe("win");
    ra.ws.close(); rb.ws.close();
  });
  it("rút lui qua presence rt=1 thì người rút thua ngay", async () => {
    const a = await user("ttt1"), b = await user("ttt2");
    const { f1 } = await pair(a, b);
    const ra = await open(a.token, "?room=" + f1.mid), rb = await open(b.token, "?room=" + f1.mid);
    await ra.wait((m) => m.type === "hello");
    rb.send({ type: "pres", patch: { rt: 1 } });
    const e = await ra.wait((m) => m.type === "ended");
    expect(e.result.winner).toBe(a.id);
    expect(e.result.outcome).toBe("forfeit");
    ra.ws.close(); rb.ws.close();
  });
  it("mất kết nối quá 3 phút thì xử thua (alarm)", async () => {
    const a = await user("uuu1"), b = await user("uuu2");
    const { f1 } = await pair(a, b);
    const ra = await open(a.token, "?room=" + f1.mid), rb = await open(b.token, "?room=" + f1.mid);
    await ra.wait((m) => m.type === "hello"); await rb.wait((m) => m.type === "hello");
    rb.ws.close();
    await ra.wait((m) => m.type === "peers" && m.peers.length === 1);
    const stub = env.MATCH.get(env.MATCH.idFromName(f1.mid));
    await runInDurableObject(stub, async (inst) => { for (const k of Object.keys(inst.disc)) inst.disc[k] -= 200000; });
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    const e = await ra.wait((m) => m.type === "ended");
    expect(e.result.winner).toBe(a.id);
    expect(e.result.reason).toBe("disconnect");
    ra.ws.close();
  });
  it("đối thủ không ra bài quá 3 phút thì xử thua; kết nối lại trước hạn thì không", async () => {
    const a = await user("vvv1"), b = await user("vvv2");
    const { f1 } = await pair(a, b);
    const ra = await open(a.token, "?room=" + f1.mid), rb = await open(b.token, "?room=" + f1.mid);
    await ra.wait((m) => m.type === "hello"); await rb.wait((m) => m.type === "hello");
    ra.send({ type: "pres", patch: { t: 1, sub: 1, acts: [] } });
    rb.send({ type: "pres", patch: { t: 1, sub: 0, acts: [] } });
    await rb.wait((m) => m.type === "peers" && m.peers.find((p) => p.peer === "u" + a.id && p.presence.sub === 1));
    const stub = env.MATCH.get(env.MATCH.idFromName(f1.mid));
    await runInDurableObject(stub, async (inst) => { for (const k of Object.keys(inst.subAt)) inst.subAt[k].at -= 200000; });
    await runDurableObjectAlarm(stub);
    const e = await ra.wait((m) => m.type === "ended");
    expect(e.result.winner).toBe(a.id);
    expect(e.result.reason).toBe("turn_timeout");
    ra.ws.close(); rb.ws.close();
  });
  it("giới hạn kích thước tin", async () => {
    const a = await user("www1"), b = await user("www2");
    const { f1 } = await pair(a, b);
    const ra = await open(a.token, "?room=" + f1.mid);
    await ra.wait((m) => m.type === "hello");
    ra.send({ type: "pres", patch: { nm: "x".repeat(20000) } });
    expect(await ra.closed).toBe(1009);
  });
});
