import { DurableObject } from "cloudflare:workers";
import { hsx, cleanName } from "./util.js";
import { okDeck } from "./authgame.js";

/* Chế độ trận online (biến môi trường ONLINE_MODE):
   "auth" (mặc định) — máy chủ giữ trạng thái trận khi CẢ HAI client hỗ trợ (seek.cap >= 1); client cũ -> lockstep cũ (dự phòng)
   "auth-only"       — chỉ ghép client hỗ trợ; client cũ nhận lỗi update_required
   "lockstep"        — tắt chế độ máy chủ giữ trạng thái, dùng lockstep cũ cho mọi trận */
export function onlineMode(env) { const m = String((env && env.ONLINE_MODE) || "auth").trim(); return m === "lockstep" || m === "auth-only" ? m : "auth"; }

const MAX_MSG = 8 * 1024;
const RECENT_MS = 30 * 60 * 1000;
const MODES = ["online"];
const PKEY_RE = /^(d\d{4}-\d{2}-\d{2}|m\d{4}-\d{2}|w\d{1,5})$/;

// Làm sạch trạng thái hiển thị của người chơi gửi lên khi ghép trận (đúng cấu trúc myPres của client)
export function cleanPres(p, uid, name) {
  p = p && typeof p === "object" ? p : {};
  const dk = Array.isArray(p.dk) ? p.dk.slice(0, 12).map((x) => String(x).slice(0, 40)) : [];
  return { v: 2, pid: "u" + uid, nm: cleanName(p.nm || name) || name, av: typeof p.av === "string" ? p.av.slice(0, 40) : "", rk: Number.isFinite(p.rk) ? Math.max(0, Math.min(1e9, p.rk | 0)) : 0, dk };
}

export class Matchmaker extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}'));
  }
  async fetch(request) {
    // thống kê nội bộ cho trang quản trị (chỉ Worker gọi được: đường dẫn ngoài luôn là /api/play)
    if (new URL(request.url).pathname === "/__stats") {
      const all = this.ctx.getWebSockets().map((ws) => ws.deserializeAttachment() || {});
      const now = Date.now();
      const recent = ((await this.ctx.storage.get("recent")) || []).filter((x) => now - x.t < RECENT_MS);
      return Response.json({ lobby: new Set(all.map((a) => a.uid)).size, seeking: all.filter((a) => a.seeking).length, recent });
    }
    if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket") return new Response("expected websocket", { status: 426 });
    const uid = +request.headers.get("x-ltd-uid");
    if (!uid) return new Response("unauthorized", { status: 401 });
    const name = decodeURIComponent(request.headers.get("x-ltd-name") || "");
    const rating = +request.headers.get("x-ltd-rating") || 1000;
    for (const old of this.ctx.getWebSockets("u" + uid)) { try { old.close(4000, "replaced"); } catch {} }
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], ["u" + uid]);
    pair[1].serializeAttachment({ uid, name, rating, seeking: false });
    pair[1].send(JSON.stringify({ type: "hello", me: "u" + uid }));
    return new Response(null, { status: 101, webSocket: pair[0], headers: { "sec-websocket-protocol": "ltd1" } });
  }

  async webSocketMessage(ws, data) {
    if (typeof data !== "string" || data.length > MAX_MSG) { try { ws.close(1009, "too big"); } catch {} return; }
    let m; try { m = JSON.parse(data); } catch { return; }
    const att = ws.deserializeAttachment() || {};
    if (m.type === "ping") { ws.send('{"type":"pong"}'); return; }
    if (m.type === "cancel") { ws.serializeAttachment({ ...att, seeking: false }); return; }
    if (m.type === "seek") {
      const mode = MODES.includes(m.mode) ? m.mode : "online";
      const code = typeof m.code === "string" ? m.code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) : "";
      const keys = {};
      if (typeof m.keys === "object" && m.keys) for (const k of ["d", "s"]) if (typeof m.keys[k] === "string" && PKEY_RE.test(m.keys[k])) keys[k] = m.keys[k];
      const cap = Number.isInteger(m.cap) && m.cap > 0 ? Math.min(m.cap, 9) : 0;
      if (onlineMode(this.env) === "auth-only" && !cap) { try { ws.send('{"type":"error","error":"update_required"}'); } catch {} return; }
      ws.serializeAttachment({ ...att, seeking: true, mode, code, keys, cap, t0: Date.now(), pres: cleanPres(m.pres, att.uid, att.name) });
      await this.tryPair();
      if (this.seekers().length) await this.ctx.storage.setAlarm(Date.now() + 2000);
    }
  }
  webSocketClose(ws) { try { ws.close(); } catch {} }
  webSocketError() {}

  seekers() {
    return this.ctx.getWebSockets().map((ws) => ({ ws, a: ws.deserializeAttachment() })).filter((x) => x.a && x.a.seeking);
  }

  async alarm() {
    await this.tryPair();
    if (this.seekers().length) await this.ctx.storage.setAlarm(Date.now() + 2000);
  }

  // Ghép theo (chế độ, mã riêng); gần điểm nhau trước, chờ càng lâu càng nới rộng
  async tryPair() {
    const now = Date.now();
    const list = this.seekers().sort((x, y) => x.a.t0 - y.a.t0);
    const used = new Set();
    for (const x of list) {
      if (used.has(x)) continue;
      let best = null, bestD = 1e9;
      for (const y of list) {
        if (y === x || used.has(y) || y.a.uid === x.a.uid || y.a.mode !== x.a.mode || y.a.code !== x.a.code) continue;
        const d = Math.abs(y.a.rating - x.a.rating);
        const wait = (now - Math.min(x.a.t0, y.a.t0)) / 1000;
        if (d <= 100 + 40 * wait && d < bestD) { best = y; bestD = d; }
      }
      if (!best) continue;
      used.add(x); used.add(best);
      await this.makeMatch(x, best);
    }
  }

  async makeMatch(x, y) {
    const px = "u" + x.a.uid, py = "u" + y.a.uid;
    // Thứ tự chủ phòng giống hệt mmPair của client: (t0, peer) nhỏ hơn là chủ phòng
    const t0x = x.a.t0, t0y = y.a.t0;
    const xFirst = (t0x - t0y) || (px < py ? -1 : 1);
    const host = xFirst < 0 ? { s: x, p: px, t0: t0x } : { s: y, p: py, t0: t0y };
    const guest = xFirst < 0 ? { s: y, p: py, t0: t0y } : { s: x, p: px, t0: t0x };
    const mid = "m-" + hsx(host.p + "|" + guest.p + "|" + host.t0);
    const stub = this.env.MATCH.get(this.env.MATCH.idFromName(mid));
    const mk = (z) => ({ uid: z.s.a.uid, name: z.s.a.name, rating: z.s.a.rating, peer: z.p, keys: z.s.a.keys || {} });
    /* máy chủ giữ trạng thái trận: cả hai client hỗ trợ + bộ bài hợp lệ; hạt giống do máy chủ sinh, KHÔNG gửi cho client */
    const auth = onlineMode(this.env) !== "lockstep" && host.s.a.cap >= 1 && guest.s.a.cap >= 1;
    const init = { mid, mode: x.a.mode, players: [mk(host), mk(guest)] };
    if (auth) {
      const bad = [host, guest].filter((z) => !okDeck(z.s.a.pres && z.s.a.pres.dk));
      if (bad.length) { for (const z of bad) { try { z.s.ws.send('{"type":"error","error":"bad_deck"}'); } catch {} z.s.ws.serializeAttachment({ ...z.s.a, seeking: false }); } return; }
      init.auth = { seed: crypto.getRandomValues(new Uint32Array(1))[0], decks: { p: host.s.a.pres.dk, a: guest.s.a.pres.dk } };
    }
    const r = await stub.fetch("https://match/init", { method: "POST", body: JSON.stringify(init) });
    if (!r.ok) { used_fail(x, y); return; }
    // nhớ các trận vừa ghép (30 phút) để trang quản trị ước tính số trận đang diễn ra
    try {
      const now = Date.now();
      const rec = ((await this.ctx.storage.get("recent")) || []).filter((z) => now - z.t < RECENT_MS);
      rec.push({ mid, t: now });
      await this.ctx.storage.put("recent", rec.slice(-500));
    } catch {}
    /* trận máy chủ giữ trạng thái: không gửi danh sách bộ bài của đối thủ */
    const info = (z, isOpp) => ({ peer: z.p, t0: z.t0, pres: auth && isOpp ? { ...z.s.a.pres, dk: [] } : z.s.a.pres });
    for (const [me, opp] of [[host, guest], [guest, host]]) {
      try { me.s.ws.send(JSON.stringify({ type: "found", mid, role: me === host ? "host" : "guest", me: info(me, false), opp: info(opp, true), auth: auth ? 1 : 0 })); } catch {}
      me.s.ws.serializeAttachment({ ...me.s.a, seeking: false });
    }
  }
}
function used_fail(x, y) { for (const z of [x, y]) { try { z.ws.send('{"type":"error","error":"match_init"}'); } catch {} } }
