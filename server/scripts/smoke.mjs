// Thử nhanh không cần trình duyệt: chạy `npm run dev` ở cửa sổ khác, rồi `npm run smoke`.
// Biến môi trường: SERVER (mặc định http://localhost:8787), ADMIN_TOKEN (mặc định khớp .dev.vars).
import WebSocket from "ws";
const SERVER = process.env.SERVER || "http://localhost:8787";
const ADMIN = process.env.ADMIN_TOKEN || "dev-admin-token-123456";
const j = async (m, p, body, h = {}) => { const r = await fetch(SERVER + p, { method: m, headers: { "content-type": "application/json", ...h }, body: body ? JSON.stringify(body) : undefined }); return { s: r.status, j: await r.json().catch(() => ({})) }; };
const must = (c, m) => { if (!c) { console.error("HỎNG:", m); process.exit(1); } console.log("ok  ", m); };
const sfx = Date.now().toString(36).slice(-5);
const names = [`sm${sfx}a`, `sm${sfx}b`];
for (const n of names) must((await j("POST", "/api/admin/users", { username: n, password: "smoke-pass", display: n }, { "x-admin-token": ADMIN })).s === 201, "tạo " + n);
must((await j("POST", "/api/login", { username: names[0], password: "sai" })).s === 401, "sai mật khẩu bị từ chối");
const toks = [];
for (const n of names) { const r = await j("POST", "/api/login", { username: n, password: "smoke-pass" }); must(r.s === 200 && r.j.token, "đăng nhập " + n); toks.push(r.j.token); }
function open(tok, q = "") {
  const ws = new WebSocket(SERVER.replace(/^http/, "ws") + "/api/play" + q, ["ltd1", "tk." + tok]);
  const msgs = [], w = [];
  ws.on("message", (d) => { msgs.push(JSON.parse(d)); w.splice(0).forEach((f) => f()); });
  const wait = async (p, ms = 8000) => { const t = Date.now(); for (;;) { const i = msgs.findIndex(p); if (i >= 0) return msgs.splice(i, 1)[0]; if (Date.now() - t > ms) throw new Error("hết giờ chờ"); await new Promise((r) => { w.push(r); setTimeout(r, 100); }); } };
  return new Promise((res, rej) => { ws.on("open", () => res({ ws, wait, send: (o) => ws.send(JSON.stringify(o)) })); ws.on("error", rej); ws.on("unexpected-response", (_, r) => rej(new Error("HTTP " + r.statusCode))); });
}
const pres = (nm) => ({ nm, av: "x", rk: 0, dk: Array.from({ length: 12 }, (_, i) => "c" + i) });
const L = await Promise.all(toks.map((t) => open(t)));
L.forEach((l, i) => l.send({ type: "seek", mode: "online", pres: pres(names[i]) }));
const F = await Promise.all(L.map((l) => l.wait((m) => m.type === "found")));
must(F[0].mid === F[1].mid, "ghép được trận " + F[0].mid);
L.forEach((l) => l.ws.close());
const R = await Promise.all(toks.map((t) => open(t, "?room=" + F[0].mid)));
R[0].send({ type: "pres", patch: { v: 2, t: 1, sub: 1, acts: [] } });
await R[1].wait((m) => m.type === "peers" && m.peers.some((p) => p.presence.sub === 1));
must(true, "presence được chuyển tiếp sang đối thủ");
R[0].send({ type: "result", w: "p", kind: "end" }); R[1].send({ type: "result", w: "a", kind: "end" });
const e = await R[0].wait((m) => m.type === "ended");
must(e.result.verified && e.result.outcome === "win", "kết quả hai bên khớp, tính hạng");
const lb = await j("GET", "/api/leaderboard?mode=online", null, { authorization: "Bearer " + toks[0] });
must(lb.j.rows.length >= 1, "bảng xếp hạng có dữ liệu");
R.forEach((r) => r.ws.close());
console.log("SMOKE ĐẠT");
process.exit(0);
