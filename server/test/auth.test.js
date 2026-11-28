// Trận online do máy chủ giữ trạng thái (Durable Object Match + authmatch.js) chạy thật trong workerd.
import { SELF, env, runInDurableObject, runDurableObjectAlarm } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { E, HID } from "../src/authgame.js";
import { onlineMode } from "../src/matchmaker.js";

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
  const msgs = [], raws = [], waiters = [];
  ws.addEventListener("message", (e) => { raws.push(e.data); msgs.push(JSON.parse(e.data)); waiters.splice(0).forEach((f) => f()); });
  const closed = new Promise((r) => ws.addEventListener("close", (e) => r(e.code)));
  const wait = async (pred, ms = 8000) => {
    const t0 = Date.now();
    for (;;) {
      const i = msgs.findIndex(pred);
      if (i >= 0) return msgs.splice(i, 1)[0];
      if (Date.now() - t0 > ms) throw new Error("hết giờ chờ tin: " + JSON.stringify(msgs).slice(0, 500));
      await new Promise((r) => { waiters.push(r); setTimeout(r, 100); });
    }
  };
  return { ws, msgs, raws, wait, closed, send: (o) => ws.send(JSON.stringify(o)), status: 101 };
}
const DK1 = E.COLLECT.slice(0, 12), DK2 = E.COLLECT.slice(40, 52);
const pres = (nm, dk) => ({ v: 2, nm, av: dk[0], rk: 5, dk });
async function pairAuth(u1, u2, cap1 = 1, cap2 = 1) {
  const l1 = await open(u1.token), l2 = await open(u2.token);
  await l1.wait((m) => m.type === "hello"); await l2.wait((m) => m.type === "hello");
  l1.send({ type: "seek", mode: "online", cap: cap1, pres: pres(u1.name, DK1) });
  l2.send({ type: "seek", mode: "online", cap: cap2, pres: pres(u2.name, DK2) });
  const f1 = await l1.wait((m) => m.type === "found"), f2 = await l2.wait((m) => m.type === "found");
  l1.ws.close(); l2.ws.close();
  return { f1, f2 };
}

describe("trận do máy chủ giữ trạng thái", () => {
  it("chế độ mặc định là auth; ONLINE_MODE đổi được", () => {
    expect(onlineMode({})).toBe("auth");
    expect(onlineMode({ ONLINE_MODE: "lockstep" })).toBe("lockstep");
    expect(onlineMode({ ONLINE_MODE: "auth-only" })).toBe("auth-only");
  });
  it("client cũ (không cap) vẫn ghép lockstep, có bộ bài đối thủ", async () => {
    const a = await user("oa1"), b = await user("oa2");
    const { f1 } = await pairAuth(a, b, 0, 1);
    expect(f1.auth).toBe(0);
    expect(f1.opp.pres.dk.length).toBe(12);
  });
  it("ghép, nhận bản nhìn riêng, giải lượt, kết nối lại, rút lui", async () => {
    const a = await user("ob1"), b = await user("ob2");
    const { f1, f2 } = await pairAuth(a, b);
    expect(f1.auth).toBe(1); expect(f2.auth).toBe(1);
    expect(f1.opp.pres.dk).toEqual([]);   // không lộ bộ bài đối thủ
    const host = f1.role === "host" ? a : b, guest = host === a ? b : a;
    const hostDk = host === a ? DK1 : DK2, guestDk = host === a ? DK2 : DK1;
    const ra = await open(host.token, "?room=" + f1.mid), rb = await open(guest.token, "?room=" + f1.mid);
    expect((await ra.wait((m) => m.type === "hello")).auth).toBe(1);
    const sa = await ra.wait((m) => m.type === "state"), sb = await rb.wait((m) => m.type === "state");
    expect(sa.n).toBe(0); expect(sa.t).toBe(1);
    // mỗi bên: tay mình đủ, tay/bộ bài đối thủ chỉ là mặt lưng; không hạt giống
    expect(sa.v.hand.p.every((c) => hostDk.includes(c.id) || c.cr)).toBe(true);
    expect(sa.v.hand.a.every((c) => c.id === HID)).toBe(true);
    expect(sb.v.hand.a.every((c) => c.id === HID)).toBe(true);
    expect(sa.v.deck.p.every((c) => c.id === HID)).toBe(true);
    expect(sa.v.rs).toBeUndefined();
    // id thẻ của khách chỉ được xuất hiện nếu luật cho chủ phòng thấy (vd. Chợ Đen chép thẻ đối thủ vào tay, Chợ Phiên vứt thẻ ra Mộ)
    const legit = new Set(), addL = (c) => { if (c) { legit.add(c.id); if (c.cpOf) legit.add(c.cpOf); if (typeof c.ab === "string") legit.add(c.ab); } };
    sa.v.hand.p.forEach(addL);
    for (const s of ["p", "a"]) for (const z of ["disc", "dead"]) (sa.v[z][s] || []).forEach(addL);
    for (const L of sa.v.locs) for (const s of ["p", "a"]) for (const c of L.cards[s]) if (s === "p" || c.rev) addL(c);
    for (const id of guestDk) if (!hostDk.includes(id) && !legit.has(id)) expect(ra.raws.join("")).not.toContain('"' + id + '"');
    // tên bị lọc khỏi presence
    ra.send({ type: "pres", patch: { v: 2, nm: "Chủ", dk: hostDk, seed: 5, acts: [1] } });
    const pp = await rb.wait((m) => m.type === "peers" && m.peers.some((p) => p.presence.nm === "Chủ"));
    const hp = pp.peers.find((p) => p.presence.nm === "Chủ").presence;
    expect(hp.dk).toBeUndefined(); expect(hp.seed).toBeUndefined(); expect(hp.acts).toBeUndefined();
    // giải lượt 1
    const play = sa.v.hand.p[0];
    ra.send({ type: "sub", t: 1, acts: [{ t: "p", u: play.uid, l: 0 }], snap: 0 });
    await ra.wait((m) => m.type === "subr" && m.ok === 1);
    await rb.wait((m) => m.type === "osub" && m.sub === 1);
    rb.send({ type: "sub", t: 1, acts: [], snap: 0 });
    const ta = await ra.wait((m) => m.type === "turn"), tb = await rb.wait((m) => m.type === "turn");
    expect(ta.n).toBe(1); expect(tb.n).toBe(1);
    expect(ta.frames[0].k).toBe("rev0"); expect(ta.frames.at(-1).k).toBe("start");
    const va = ta.frames.at(-1).v, vb = tb.frames.at(-1).v;
    expect(va.turn).toBe(2);
    // khách thấy thẻ chủ phòng vừa lật (đã lộ) ở phía đối thủ của mình
    const cost = E.C[play.id].c;
    if (cost <= 1) expect(vb.locs[0].cards.a.some((c) => c.uid === play.uid && c.id === play.id)).toBe(true);
    // kết nối lại: nhận đúng bản nhìn hiện tại
    rb.ws.close();
    await new Promise((r) => setTimeout(r, 150));
    const rb2 = await open(guest.token, "?room=" + f1.mid);
    const sb2 = await rb2.wait((m) => m.type === "state");
    expect(sb2.n).toBe(1); expect(sb2.t).toBe(2);
    expect(JSON.stringify({ ...sb2.v, evs: [], msgs: [] })).toBe(JSON.stringify({ ...vb, evs: [], msgs: [] }));
    // Durable Object bị dỡ khỏi bộ nhớ: dựng lại từ nhật ký cho đúng bản nhìn
    const stub = env.MATCH.get(env.MATCH.idFromName(f1.mid));
    await runInDurableObject(stub, async (inst) => { inst.am.G = null; inst.am.know = null; });
    rb2.send({ type: "sync" });
    const sb3 = await rb2.wait((m) => m.type === "state");
    expect(JSON.stringify(sb3.v)).toBe(JSON.stringify(sb2.v));
    // hết giờ: máy chủ tự ra lượt trống cho bên chưa nộp
    ra.send({ type: "sub", t: 2, acts: [], snap: 0 });
    await ra.wait((m) => m.type === "subr");
    await runInDurableObject(stub, async (inst) => { inst.am.st.clk.p -= 400000; inst.am.st.clk.a -= 400000; });
    await runDurableObjectAlarm(stub);
    const t2 = await rb2.wait((m) => m.type === "turn");
    expect(t2.n).toBe(2); expect(t2.miss).toBe(1);
    // rút lui
    rb2.send({ type: "retreat" });
    const e = await ra.wait((m) => m.type === "ended");
    expect(e.result.winner).toBe(host.id);
    expect(e.result.outcome).toBe("forfeit");
    expect(e.result.verified).toBe(true);
    ra.ws.close(); rb2.ws.close();
  });
  it("đánh hết ván: máy chủ tự chấm kết quả, không cần client báo", async () => {
    const a = await user("oc1"), b = await user("oc2");
    const { f1 } = await pairAuth(a, b);
    const ra = await open(a.token, "?room=" + f1.mid), rb = await open(b.token, "?room=" + f1.mid);
    let s = await ra.wait((m) => m.type === "state"); await rb.wait((m) => m.type === "state");
    let over = null;
    for (let t = 1; t <= 8 && !over; t++) {
      ra.send({ type: "sub", t, acts: [], snap: 0 }); rb.send({ type: "sub", t, acts: [], snap: 0 });
      const ta = await ra.wait((m) => m.type === "turn"); await rb.wait((m) => m.type === "turn");
      over = ta.over;
    }
    expect(over).toBeTruthy();
    const e = await ra.wait((m) => m.type === "ended");
    expect(e.result.verified).toBe(true);
    expect(["draw", "win"]).toContain(e.result.outcome);
    ra.ws.close(); rb.ws.close();
  });
});
