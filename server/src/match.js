import { DurableObject } from "cloudflare:workers";
import { cleanName } from "./util.js";
import { eloDelta, START_RATING, PTS_WIN, PTS_DRAW } from "./elo.js";

export const LIMITS = {
  msg: 12 * 1024,        // kích thước một tin
  pres: 6 * 1024,        // kích thước trạng thái một người chơi
  acts: 64,              // số thao tác tối đa mỗi lượt
  burst: 30, perSec: 15, // giới hạn tốc độ (token bucket)
  waitMs: 180000,        // mất kết nối / chờ đối thủ tối đa 3 phút
  reportMs: 45000,       // chờ báo cáo kết quả của người còn lại
  keepMs: 10 * 60 * 1000 // giữ trận đã xong để người chơi xem kết quả
};
const PRES_KEYS = new Set(["v", "nm", "av", "rk", "dk", "mid", "role", "seed", "t", "sub", "acts", "lock", "snap", "rt", "emo", "h", "mm"]);

export class Match extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.bucket = new Map();
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}'));
    this.ready = ctx.blockConcurrencyWhile(async () => {
      this.meta = (await ctx.storage.get("meta")) || null;
      this.pres = (await ctx.storage.get("pres")) || {};
      this.rep = (await ctx.storage.get("rep")) || {};
      this.disc = (await ctx.storage.get("disc")) || {};
      this.subAt = (await ctx.storage.get("subAt")) || {};
    });
  }

  save(...keys) {
    const all = { meta: this.meta, pres: this.pres, rep: this.rep, disc: this.disc, subAt: this.subAt };
    const o = {};
    for (const k of keys) o[k] = all[k];
    return this.ctx.storage.put(o);
  }

  async fetch(request) {
    await this.ready;
    const url = new URL(request.url);
    if (url.pathname === "/init" && request.method === "POST") {
      if (this.meta) return new Response("exists", { status: 409 });
      const b = await request.json();
      this.meta = { mid: b.mid, mode: b.mode, startedAt: Date.now(), ended: null, players: b.players.map((p) => ({ uid: p.uid, name: p.name, rating: p.rating, peer: p.peer, keys: p.keys || {} })) };
      await this.save("meta");
      await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000); // phòng bỏ hoang
      return new Response("ok");
    }
    if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket") return new Response("expected websocket", { status: 426 });
    const uid = +request.headers.get("x-ltd-uid");
    if (!this.meta) return new Response("no such match", { status: 404 });
    if (!this.meta.players.some((p) => p.uid === uid)) return new Response("forbidden", { status: 403 });
    for (const old of this.ctx.getWebSockets("u" + uid)) { try { old.close(4000, "replaced"); } catch {} }
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], ["u" + uid]);
    pair[1].serializeAttachment({ uid });
    if (this.disc[uid]) { delete this.disc[uid]; await this.save("disc"); }
    pair[1].send(JSON.stringify({ type: "hello", me: "u" + uid, ended: this.meta.ended }));
    this.broadcastPeers();
    await this.schedule();
    return new Response(null, { status: 101, webSocket: pair[0], headers: { "sec-websocket-protocol": "ltd1" } });
  }

  peerList() {
    const out = [];
    for (const p of this.meta.players) {
      if (this.ctx.getWebSockets("u" + p.uid).length) out.push({ peer: p.peer, presence: this.pres[p.uid] || {}, updatedAt: (this.pres[p.uid] && this.pres[p.uid]._at) || 0 });
    }
    return out.map((x) => ({ peer: x.peer, presence: stripInternal(x.presence), updatedAt: x.updatedAt }));
  }
  broadcastPeers() {
    const msg = JSON.stringify({ type: "peers", peers: this.peerList() });
    for (const ws of this.ctx.getWebSockets()) { try { ws.send(msg); } catch {} }
  }

  allow(ws) {
    const now = Date.now();
    let b = this.bucket.get(ws);
    if (!b) { b = { n: LIMITS.burst, t: now, drops: 0 }; this.bucket.set(ws, b); }
    b.n = Math.min(LIMITS.burst, b.n + ((now - b.t) / 1000) * LIMITS.perSec); b.t = now;
    if (b.n < 1) { if (++b.drops > 200) { try { ws.close(1008, "rate"); } catch {} } return false; }
    b.n -= 1; return true;
  }

  async webSocketMessage(ws, data) {
    await this.ready;
    if (typeof data !== "string" || data.length > LIMITS.msg) { try { ws.close(1009, "too big"); } catch {} return; }
    if (!this.allow(ws)) return;
    const att = ws.deserializeAttachment() || {};
    const uid = att.uid;
    if (!this.meta || !uid) return;
    let m; try { m = JSON.parse(data); } catch { return; }
    if (!m || typeof m !== "object") return;
    if (m.type === "ping") { ws.send('{"type":"pong"}'); return; }
    if (this.meta.ended) return;
    if (m.type === "pres") { await this.onPres(uid, m.patch); return; }
    if (m.type === "result") { await this.onResult(uid, m); return; }
  }

  async onPres(uid, patch) {
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) return;
    const cur = { ...(this.pres[uid] || {}) };
    for (const k of Object.keys(patch)) {
      if (!PRES_KEYS.has(k)) continue;
      const v = patch[k];
      if (v === null) delete cur[k];
      else if (k === "acts") { if (Array.isArray(v) && v.length <= LIMITS.acts) cur.acts = v; }
      else if (k === "nm") cur.nm = cleanName(v);
      else cur[k] = v;
    }
    const me = this.meta.players.find((p) => p.uid === uid);
    cur.pid = me.peer;
    cur._at = Date.now();
    if (JSON.stringify(cur).length > LIMITS.pres) return;
    this.pres[uid] = cur;
    // theo dõi ai đang chờ ai (luật 3 phút)
    for (const p of this.meta.players) {
      const pr = this.pres[p.uid];
      if (pr && pr.sub && typeof pr.t === "number") { if (!this.subAt[p.uid] || this.subAt[p.uid].t !== pr.t) this.subAt[p.uid] = { t: pr.t, at: Date.now() }; }
      else delete this.subAt[p.uid];
    }
    await this.save("pres", "subAt");
    this.broadcastPeers();
    if (cur.rt) { await this.onResult(uid, { w: "a", kind: "retreatP" }); return; }
    await this.schedule();
  }

  async onResult(uid, m) {
    if (this.meta.ended) return;
    const w = m.w === "p" || m.w === "a" ? m.w : null;
    const kind = typeof m.kind === "string" ? m.kind.slice(0, 20) : "";
    if (this.rep[uid]) return;
    this.rep[uid] = { w, kind, at: Date.now() };
    await this.save("rep");
    const both = this.meta.players.every((p) => this.rep[p.uid]);
    if (both || (kind === "retreatP" || kind === "timeoutP") && w === "a") await this.settle(false);
    else await this.schedule();
  }

  // Kết quả theo góc nhìn người báo -> uid thắng (null = hoà)
  claimWinner(uid) {
    const r = this.rep[uid];
    if (!r) return undefined;
    const other = this.meta.players.find((p) => p.uid !== uid).uid;
    return r.w === "p" ? uid : r.w === "a" ? other : null;
  }

  async settle(timedOut) {
    const [A, B] = this.meta.players;
    const ca = this.claimWinner(A.uid), cb = this.claimWinner(B.uid);
    const selfLoss = (uid) => { const r = this.rep[uid]; return r && r.w === "a" && (r.kind === "retreatP" || r.kind === "timeoutP"); };
    let winner, outcome, reason, verified = false, rate = true;
    if (ca !== undefined && cb !== undefined && ca === cb) { winner = ca; verified = true; outcome = winner === null ? "draw" : "win"; reason = "agreed"; }
    else if (selfLoss(A.uid) || selfLoss(B.uid)) {
      const loser = selfLoss(A.uid) ? A : B;
      winner = this.meta.players.find((p) => p.uid !== loser.uid).uid; outcome = "forfeit"; reason = this.rep[loser.uid].kind; verified = true;
    } else if (ca !== undefined && cb !== undefined) { winner = null; outcome = "void"; reason = "disputed"; rate = false; }
    else {
      const who = ca !== undefined ? A : B, claim = ca !== undefined ? ca : cb, opp = who === A ? B : A;
      const oppOnline = this.ctx.getWebSockets("u" + opp.uid).length > 0;
      if (claim !== who.uid || !oppOnline) { winner = claim; outcome = claim === null ? "draw" : "win"; reason = "single_report"; }
      else { winner = null; outcome = "void"; reason = "unconfirmed"; rate = false; }
    }
    await this.finish({ winner, outcome, reason, verified, rate });
  }

  async forfeit(loserUid, reason) {
    if (this.meta.ended) return;
    const winner = this.meta.players.find((p) => p.uid !== loserUid).uid;
    await this.finish({ winner, outcome: "forfeit", reason, verified: true, rate: true });
  }

  async finish({ winner, outcome, reason, verified, rate }) {
    if (this.meta.ended) return;
    const [A, B] = this.meta.players, now = Date.now();
    let dA = 0, dB = 0, newA = A.rating, newB = B.rating;
    const db = this.env.DB;
    try {
      if (rate) {
        const cur = async (u) => (await db.prepare("SELECT rating, games FROM ratings WHERE user_id=? AND mode=?").bind(u.uid, this.meta.mode).first()) || { rating: START_RATING, games: 0 };
        const ra = await cur(A), rb = await cur(B);
        const sa = winner === null ? 0.5 : winner === A.uid ? 1 : 0;
        dA = eloDelta(ra.rating, rb.rating, sa); dB = -dA;
        newA = Math.max(100, ra.rating + dA); newB = Math.max(100, rb.rating + dB);
        dA = newA - ra.rating; dB = newB - rb.rating;
        const upd = (u, nr, win, draw) => db.prepare("INSERT INTO ratings(user_id,mode,rating,games,wins,losses,draws,updated_at) VALUES(?1,?2,?3,1,?4,?5,?6,?7) ON CONFLICT(user_id,mode) DO UPDATE SET rating=?3, games=games+1, wins=wins+?4, losses=losses+?5, draws=draws+?6, updated_at=?7").bind(u.uid, this.meta.mode, nr, win ? 1 : 0, !win && !draw ? 1 : 0, draw ? 1 : 0, now);
        const stmts = [upd(A, newA, winner === A.uid, winner === null), upd(B, newB, winner === B.uid, winner === null)];
        for (const u of [A, B]) {
          const pts = winner === null ? PTS_DRAW : winner === u.uid ? PTS_WIN : 0;
          if (!pts) continue;
          for (const k of [u.keys && u.keys.d, u.keys && u.keys.s]) if (k) stmts.push(db.prepare("INSERT INTO scores(user_id,mode,pkey,pts) VALUES(?,?,?,?) ON CONFLICT(user_id,mode,pkey) DO UPDATE SET pts=pts+excluded.pts").bind(u.uid, this.meta.mode, k, pts));
        }
        await db.batch(stmts);
      }
      await db.prepare("INSERT OR IGNORE INTO matches(id,mode,host_uid,guest_uid,winner_uid,outcome,reason,verified,host_delta,guest_delta,started_at,ended_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind(this.meta.mid, this.meta.mode, A.uid, B.uid, winner, outcome, reason, verified ? 1 : 0, dA, dB, this.meta.startedAt, now).run();
    } catch (e) { console.error("ghi kết quả lỗi", e && e.stack || e); }
    this.meta.ended = { mid: this.meta.mid, winner, outcome, reason, verified, deltas: { [A.uid]: dA, [B.uid]: dB }, ratings: { [A.uid]: newA, [B.uid]: newB }, at: now, peers: { [A.uid]: A.peer, [B.uid]: B.peer } };
    await this.save("meta");
    const msg = JSON.stringify({ type: "ended", result: this.meta.ended });
    for (const ws of this.ctx.getWebSockets()) { try { ws.send(msg); } catch {} }
    await this.ctx.storage.setAlarm(now + LIMITS.keepMs);
  }

  async webSocketClose(ws) { await this.onGone(ws); }
  async webSocketError(ws) { await this.onGone(ws); }
  async onGone(ws) {
    await this.ready;
    try { ws.close(); } catch {}
    const att = ws.deserializeAttachment() || {};
    this.bucket.delete(ws);
    if (!this.meta || this.meta.ended || !att.uid) return;
    // còn kết nối khác của cùng người (do thay thế) thì bỏ qua
    if (this.ctx.getWebSockets("u" + att.uid).some((s) => s !== ws && s.readyState === 1)) return;
    if (!this.rep[att.uid]) { this.disc[att.uid] = Date.now(); await this.save("disc"); }
    this.broadcastPeers();
    await this.schedule();
  }

  // Báo thức kế tiếp = hạn gần nhất trong: mất kết nối, chờ đối thủ ra bài, chờ báo cáo kết quả
  // Người chơi p đang bị đối thủ chờ (đối thủ đã ra bài lượt t mà p chưa ra bài lượt t)
  stalledSince(p) {
    const o = this.meta.players.find((q) => q !== p), s = this.subAt[o.uid], pr = this.pres[p.uid];
    if (!s || this.rep[p.uid] || this.rep[o.uid]) return null;
    if (pr && typeof pr.t === "number" && pr.t > s.t) return null;
    if (pr && pr.sub && pr.t === s.t) return null;
    return s;
  }
  nextDeadline() {
    const ds = [];
    for (const u of Object.keys(this.disc)) ds.push(this.disc[u] + LIMITS.waitMs);
    for (const p of this.meta.players) { const s = this.stalledSince(p); if (s) ds.push(s.at + LIMITS.waitMs); }
    const reps = Object.values(this.rep).map((r) => r.at);
    if (reps.length && reps.length < this.meta.players.length) ds.push(Math.min(...reps) + LIMITS.reportMs);
    return ds.length ? Math.min(...ds) : 0;
  }
  async schedule() {
    if (!this.meta || this.meta.ended) return;
    const d = this.nextDeadline();
    if (d) await this.ctx.storage.setAlarm(Math.max(d, Date.now() + 200));
  }

  async alarm() {
    await this.ready;
    if (!this.meta) return;
    if (this.meta.ended) { await this.ctx.storage.deleteAll(); this.meta = null; return; }
    const now = Date.now();
    for (const p of this.meta.players) {
      if (this.disc[p.uid] && now - this.disc[p.uid] >= LIMITS.waitMs && !this.rep[p.uid]) { await this.forfeit(p.uid, "disconnect"); return; }
    }
    for (const p of this.meta.players) {
      const s = this.stalledSince(p);
      if (s && now - s.at >= LIMITS.waitMs) { await this.forfeit(p.uid, "turn_timeout"); return; }
    }
    const reps = Object.values(this.rep).map((r) => r.at);
    if (reps.length && now - Math.min(...reps) >= LIMITS.reportMs) { await this.settle(true); return; }
    if (!this.meta.players.some((p) => this.pres[p.uid])) {
      // trận bỏ hoang (không ai vào)
      if (now - this.meta.startedAt > 5 * 60 * 1000) { await this.finish({ winner: null, outcome: "void", reason: "abandoned", verified: false, rate: false }); return; }
    }
    await this.schedule();
  }
}

function stripInternal(p) {
  const o = { ...p }; delete o._at; return o;
}
