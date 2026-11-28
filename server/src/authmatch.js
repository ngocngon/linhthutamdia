// Bộ điều khiển một trận online do máy chủ giữ trạng thái (không phụ thuộc Cloudflare — Durable Object Match gọi vào,
// tests/online-auth.mjs chạy trực tiếp). Đầu vào: tin của từng bên + giờ hiện tại. Đầu ra: danh sách tin cần gửi + kết thúc trận (nếu có).
// Trạng thái lưu (toJSON) chỉ gồm hạt giống, bộ bài, nhật ký hành động từng lượt, lượt đang chờ, đồng hồ; trạng thái trận dựng lại
// bằng cách chạy lại nhật ký (replay) khi Durable Object bị dỡ khỏi bộ nhớ.
import { newAuthGame, viewFor, resolveTurn, replay, newKnow, cleanActs, SIDES } from "./authgame.js";

export const AUTH = {
  turnMs: 90000,   // đồng hồ lượt (khớp TURN_SEC=90 của client, 03-data-store.js)
  graceMs: 8000,   // bù trễ mạng trước khi máy chủ tự tính "bỏ lượt"
  introMs: 15000,  // lượt 1: màn mở đầu + đếm ngược
  animMax: 60000,  // tối đa thời gian chờ client diễn xong lượt (nếu client không báo "ready")
  missMax: 3,      // bỏ 3 lượt liên tiếp = thua
};
const oth = (s) => (s === "p" ? "a" : "p");
const animMs = (nFrames) => Math.min(AUTH.animMax, 4000 + nFrames * 700);

export class AuthMatch {
  constructor(st) {
    this.st = st;          // dữ liệu lưu trữ được
    this.G = null; this.know = null; this.last = { p: null, a: null }; // chỉ trong bộ nhớ
  }
  static create(seed, decks, now) {
    const m = new AuthMatch({ v: 1, seed: seed >>> 0, decks: { p: decks.p.slice(0, 12), a: decks.a.slice(0, 12) }, log: [], n: 0, sub: { p: null, a: null }, miss: { p: 0, a: 0 }, clk: { p: now + AUTH.introMs, a: now + AUTH.introMs }, over: null });
    m.ensure();
    return m;
  }
  toJSON() { return this.st; }
  ensure() {
    if (this.G) return;
    const r = replay(this.st.seed, this.st.decks, this.st.log);
    this.G = r.G; this.know = r.know;
  }
  get turn() { this.ensure(); return this.G.turn; }

  /* trạng thái đầy đủ cho một bên (khi vào trận / kết nối lại) */
  stateMsg(side, now) {
    this.ensure();
    const v = viewFor(this.G, side, this.know[side]);
    v.evs = []; v.msgs = []; v.cnt.missed = this.st.miss[side];
    const sb = this.st.sub[side];
    return { type: "state", n: this.st.n, t: this.G.turn, side, v, sub: sb && !sb.auto ? { acts: sb.acts, snap: sb.snap ? 1 : 0 } : null, osub: this.st.sub[oth(side)] ? 1 : 0, miss: this.st.miss[side], left: this.leftMs(side, now), over: this.st.over ? this.overFor(side) : null, last: this.last[side] && this.last[side].n === this.st.n ? this.last[side] : null };
  }
  leftMs(side, now) { return Math.max(0, this.st.clk[side] + AUTH.turnMs - now); }
  overFor(side) { const o = this.st.over; if (!o) return null; return { w: o.w === null ? null : o.w === side ? "p" : "a", kind: o.kind }; }
  deadline(side) { return this.st.clk[side] + AUTH.turnMs + AUTH.graceMs; }
  nextDeadline() {
    if (this.st.over) return 0;
    const ds = SIDES.filter((s) => !this.st.sub[s]).map((s) => this.deadline(s));
    return ds.length ? Math.min(...ds) : 0;
  }

  /* tin từ client; trả {out:[{to, msg}], end:{w:"p"|"a"|null, reason}|null} */
  onMsg(side, m, now) {
    const out = [], res = { out, end: null };
    if (this.st.over || !m || typeof m !== "object") return res;
    this.ensure();
    if (m.type === "sub") {
      if (m.t !== this.G.turn) { out.push({ to: side, msg: { type: "subr", ok: 0, t: this.G.turn, n: this.st.n } }); return res; }
      this.st.sub[side] = { acts: cleanActs(m.acts), snap: m.snap ? 1 : 0, auto: m.auto ? 1 : 0 };
      out.push({ to: side, msg: { type: "subr", ok: 1, t: this.G.turn, n: this.st.n } });
      out.push({ to: oth(side), msg: { type: "osub", t: this.G.turn, sub: 1 } });
      if (this.st.sub.p && this.st.sub.a) this.resolve(now, res);
    } else if (m.type === "unsub") {
      if (m.t === this.G.turn && this.st.sub[side] && !this.st.sub[side].auto) { this.st.sub[side] = null; out.push({ to: oth(side), msg: { type: "osub", t: this.G.turn, sub: 0 } }); }
    } else if (m.type === "ready") {
      if (m.n === this.st.n && now < this.st.clk[side]) this.st.clk[side] = now;
    } else if (m.type === "sync") {
      out.push({ to: side, msg: this.stateMsg(side, now) });
    }
    return res;
  }
  /* đồng hồ: ai quá hạn mà chưa ra bài -> máy chủ tự ra lượt trống (tính 1 lần bỏ lượt) */
  tick(now) {
    const out = [], res = { out, end: null };
    if (this.st.over) return res;
    this.ensure();
    for (const s of SIDES) if (!this.st.sub[s] && now >= this.deadline(s)) {
      this.st.sub[s] = { acts: [], snap: 0, auto: 1 };
      out.push({ to: oth(s), msg: { type: "osub", t: this.G.turn, sub: 1 } });
    }
    if (this.st.sub.p && this.st.sub.a) this.resolve(now, res);
    return res;
  }
  forfeit(side, kind) {
    if (this.st.over) return null;
    this.st.over = { w: oth(side), kind: kind || "retreat" };
    return { w: oth(side), reason: kind || "retreat" };
  }

  resolve(now, res) {
    const sub = this.st.sub, miss = this.st.miss;
    for (const s of SIDES) miss[s] = sub[s].auto ? miss[s] + 1 : 0;
    const lost = SIDES.filter((s) => miss[s] >= AUTH.missMax);
    if (lost.length) {
      this.st.sub = { p: null, a: null };
      if (lost.length === 2) { this.st.over = { w: null, kind: "timeout2" }; res.end = { w: null, reason: "turn_timeout" }; }
      else { this.st.over = { w: oth(lost[0]), kind: "timeout" }; res.end = { w: oth(lost[0]), reason: "turn_timeout" }; }
      return;
    }
    const entry = { p: { acts: sub.p.acts, snap: sub.p.snap }, a: { acts: sub.a.acts, snap: sub.a.snap } };
    const t0 = this.G.turn;
    const r = resolveTurn(this.G, entry, this.know);
    this.st.log.push(entry);
    this.st.n++;
    this.st.sub = { p: null, a: null };
    const over = this.G.phase === "over";
    if (over) { const w = this.G.result.winner; this.st.over = { w: w === "p" || w === "a" ? w : null, kind: "end" }; res.end = { w: this.st.over.w, reason: "end" }; }
    for (const s of SIDES) {
      for (const f of r.frames[s]) if (f.v && f.v.cnt) f.v.cnt.missed = miss[s];
      const pkt = { type: "turn", n: this.st.n, t: t0, frames: r.frames[s], miss: miss[s], bad: r.bad[s], over: over ? this.overFor(s) : null };
      this.last[s] = pkt;
      this.st.clk[s] = now + animMs(r.frames[s].length);
      res.out.push({ to: s, msg: pkt });
    }
  }
}
export { newKnow };
