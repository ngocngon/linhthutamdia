// Kiểm thử trận online do máy chủ giữ trạng thái (server/src/authmatch.js + authgame.js), chạy thẳng trong Node (không cần Cloudflare).
// Hai "client" mô phỏng chỉ nhìn bản nhìn máy chủ gửi (chọn nước bằng aiPlan trên chính bản nhìn đó — giống client thật chạy luật trên bản nhìn),
// so với một lần chạy THAM CHIẾU bằng engine cục bộ theo đúng thuật toán lockstep cũ (cùng hạt giống + cùng hành động):
//  (a) kết quả và trạng thái từng khung hình trùng engine cục bộ;
//  (b) không tin nào gửi cho một bên chứa thông tin ẩn (id/tên thẻ trên tay, bộ bài, thẻ úp của đối thủ chưa từng lộ; thứ tự bộ bài của mình; hạt giống);
//  (c) kết nối lại / máy chủ dỡ bộ nhớ (dựng lại từ nhật ký) trả đúng bản nhìn + lượt đang nộp dở; đồng hồ lượt + bỏ 3 lượt = thua.
// Chạy: node tests/online-auth.mjs   (AUTH_GAMES=60 mặc định; AUTH_SEED=<n> chạy lại một ván)
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import path from "node:path";
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, "..");
const REF = require(path.join(root, "www/js/01-engine.js"));               // engine tham chiếu (y như client chạy lockstep)
const { AuthMatch, AUTH } = await import(path.join(root, "server/src/authmatch.js"));
const AG = await import(path.join(root, "server/src/authgame.js"));
/* engine riêng cho "client" (bản sao độc lập, đăng ký thẻ giữ chỗ như 10-online-cf.js làm trên trình duyệt) */
function freshEngine() { const m = { exports: {} }; new Function("module", readFileSync(path.join(root, "www/js/01-engine.js"), "utf8"))(m); const E = m.exports;
  E.C.__an = { id: "__an", n: "Thẻ ẩn", e: "", c: 0, p: 0, t: "none", h: "PH", x: "", tok: true }; E.LOC.__loc = { n: "?", s: "", x: "" }; return E; }
const CE = freshEngine();

const N = +process.env.AUTH_GAMES || 60, ONLY = process.env.AUTH_SEED ? +process.env.AUTH_SEED : null;
let fails = 0, checks = 0, frameN = 0, msgN = 0, bytes = 0, aiErr = 0, rejected = 0;
const fail = (m) => { fails++; if (fails <= 25) console.log("  LỖI " + m); };
const ok = (c, m) => { checks++; if (!c) fail(m); };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const RAND0 = Math.random;
const oth = (s) => (s === "p" ? "a" : "p");

/* ---------- engine tham chiếu: chạy lượt như onlineResolveRun / endReveal của client, ghi lại trạng thái từng khung ---------- */
function refTurn(CG, entry) {
  const fr = [];
  const snap = (k) => fr.push({ k, g: JSON.parse(JSON.stringify(CG)) });
  for (const [s, e] of [["p", entry.p], ["a", entry.a]]) for (const a of e.acts) (a.t === "p" ? REF.queuePlay(CG, s, a.u, a.l) : a.t === "m" ? REF.queueMove(CG, s, a.u, a.l) : REF.queueAct(CG, s, a.u));
  if (entry.p.snap && !CG.snap.p) { CG.snap.p = true; CG.pendingDouble++; } if (entry.a.snap && !CG.snap.a) { CG.snap.a = true; CG.pendingDouble++; }
  const steps = REF.beginReveal(CG); snap("rev0");
  for (const st of steps) { const did = REF.doStep(CG, st); if (!did && !CG.msgs.length) continue; snap("st"); }
  for (const st of REF.beginEndTurn(CG)) { const did = REF.stepEndTurn(CG, st); if (!did && !CG.msgs.length && !CG.evs.length) continue; snap("eot"); }
  REF.finishEndTurn(CG); snap("fin");
  if (CG.turn >= REF.turns(CG)) {
    for (let r = 0; r < 4; r++) { const L = REF.hiddenOrder(CG); if (!L.length) break; if (!r) { CG.evs.length = 0; CG.msgs.length = 0; snap("er0"); }
      for (const h of L) { CG.evs.length = 0; CG.msgs.length = 0; if (!REF.revealHidden(CG, h.uid)) continue; snap("er"); } }
    CG.evs.length = 0; CG.msgs.length = 0; REF.finish(CG, "end"); snap("over");
  } else { REF.startTurn(CG); snap("start"); }
  return fr;
}

/* ---------- kiểm tra rò rỉ: bộ theo dõi "được thấy" ĐỘC LẬP với máy chủ ---------- */
function seenAdd(S, g, v) {
  const add = (c) => { if (!c) return; S.add(c.id); if (typeof c.ab === "string") S.add(c.ab); if (Array.isArray(c.xab)) c.xab.forEach((x) => S.add(x)); if (c.cpOf) S.add(c.cpOf); };
  for (const z of ["hand", "deck"]) g[z][v].forEach(add);
  for (const s of ["p", "a"]) for (const z of ["disc", "dead"]) (g[z][s] || []).forEach(add);
  for (const L of g.locs) for (const s of ["p", "a"]) for (const c of L.cards[s]) if (s === v || c.rev) add(c);
  if (g.s6 && g.s6[v] && g.s6[v].c) add(g.s6[v].c);
  for (const e of g.evs || []) if (e.k === "deckadd" && e.priv === v) S.add(e.id);
}
function walk(x, f) { if (Array.isArray(x)) { for (const y of x) walk(y, f); return; } if (x && typeof x === "object") { f(x); for (const k in x) walk(x[k], f); } }
/* g: trạng thái gốc tại khung; V: bản nhìn gửi cho v (đã lật góc nhìn nếu v="a"); raw: chuỗi JSON của tin */
function leakCheck(g, v, V, raw, seen, tag) {
  const o = oth(v), secret = new Map(); // uid -> id
  for (const c of g.hand[o]) secret.set(c.uid, c.id);
  for (const c of g.deck[o]) secret.set(c.uid, c.id);
  for (const L of g.locs) for (const c of L.cards[o]) if (!c.rev) secret.set(c.uid, c.id);
  if (g.s6 && g.s6[o] && g.s6[o].c) secret.set(g.s6[o].c.uid, g.s6[o].c.id);
  const ownDeck = new Set(g.deck[v].map((c) => c.uid));
  walk(V, (x) => {
    if (typeof x.uid !== "number" || !("id" in x)) return;
    if (secret.has(x.uid) && x.id !== "__an") fail(`${tag}: thẻ ẩn uid ${x.uid} của đối thủ lộ id "${x.id}"`);
    if (ownDeck.has(x.uid) && x.id !== "__an" && x.mask) fail(`${tag}: thẻ trong bộ bài của mình lộ id`);
  });
  ok(!/"rs":/.test(raw) && !/"seed"/.test(raw) && !/"idOf"/.test(raw), `${tag}: lộ hạt giống / bảng uid→id`);
  const myView = v === "a" ? AG.mirrorG(V) : V;   // về toạ độ gốc
  ok(Array.isArray(myView.start && myView.start[o]) ? myView.start[o].length === 0 : true, `${tag}: lộ danh sách bộ bài đối thủ`);
  /* bộ bài của mình: chỉ số lượng, thứ tự theo uid (không lộ thứ tự rút) */
  const dk = myView.deck[v]; ok(dk.length === g.deck[v].length && dk.every((c, i) => c.id === "__an" && (!i || dk[i - 1].uid < c.uid)), `${tag}: bộ bài của mình không bị che / lộ thứ tự`);
  ok(myView.hand[o].length === g.hand[o].length && myView.deck[o].length === g.deck[o].length, `${tag}: sai số lượng tay/bộ bài đối thủ`);
  /* chuỗi: id + tên thẻ chưa từng lộ */
  for (const id of new Set(secret.values())) {
    if (seen.has(id)) continue;
    if (raw.includes(`"${id}"`)) fail(`${tag}: chuỗi tin chứa id thẻ ẩn "${id}"`);
    const n = REF.C[id] && REF.C[id].n; if (n && n.length >= 4 && raw.includes(n) && ![...seen].some((k) => REF.C[k] && REF.C[k].n.includes(n))) fail(`${tag}: chuỗi tin chứa tên thẻ ẩn "${n}"`);
  }
  /* chiến địa chưa lộ (trừ Kẻ Quan Sát) */
  if (!(g.uatu && g.uatu[v])) for (const L of g.locs) if (!L.rvl && !seen.has("L:" + L.id) && raw.includes(`"${L.id}"`)) fail(`${tag}: lộ chiến địa chưa mở "${L.id}"`);
  checks++;
}
/* phần công khai của bản nhìn khớp trạng thái gốc */
function publicCheck(g, v, V, tag) {
  const W = v === "a" ? AG.mirrorG(V) : V, o = oth(v);
  const ids = (a) => a.map((c) => c.uid + ":" + c.id + ":" + (c.rev ? 1 : 0) + ":" + (c.bonus | 0)).join(",");
  ok(W.turn === g.turn && W.energy.p === g.energy.p && W.energy.a === g.energy.a && W.stake === g.stake && W.phase === g.phase, `${tag}: lượt/năng lượng/cược lệch`);
  ok(ids(W.hand[v]) === ids(g.hand[v]), `${tag}: tay của mình lệch`);
  ok(W.hand[o].map((c) => c.uid).join() === g.hand[o].map((c) => c.uid).join(), `${tag}: thứ tự mặt lưng tay đối thủ lệch`);
  for (let i = 0; i < 3; i++) {
    ok(ids(W.locs[i].cards[v]) === ids(g.locs[i].cards[v]), `${tag}: chiến địa ${i} phía mình lệch`);
    ok(ids(W.locs[i].cards[o].filter((c) => c.rev)) === ids(g.locs[i].cards[o].filter((c) => c.rev)) && W.locs[i].cards[o].length === g.locs[i].cards[o].length, `${tag}: chiến địa ${i} phía đối thủ lệch`);
    if (g.locs[i].rvl) ok(W.locs[i].id === g.locs[i].id, `${tag}: tên chiến địa ${i} lệch`);
    for (const c of g.locs[i].cards[v].concat(g.locs[i].cards[o].filter((c) => c.rev))) if (c.rev) {
      /* sức mạnh client tự tính trên bản nhìn == sức mạnh thật */
      const wc = W.locs[i].cards[c.side].find((x) => x.uid === c.uid);
      let pw; try { pw = CE.power(W, wc, i); } catch (e) { pw = "lỗi " + e.message; }
      if (pw !== REF.power(g, c, i)) { checks++; diffPow++; if (diffPow <= 5) console.log(`  (ghi chú) ${tag}: sức mạnh ${c.id} trên bản nhìn ${pw} ≠ thật ${REF.power(g, c, i)}`); }
    }
  }
  ok(JSON.stringify(W.result) === JSON.stringify(g.result), `${tag}: kết quả lệch`);
}
let diffPow = 0;

/* ---------- client mô phỏng ---------- */
class SimClient {
  constructor(side, rnd) { this.side = side; this.rnd = rnd; this.V = null; this.n = -1; this.inbox = []; this.up = true; }
  recv(msg) { const raw = JSON.stringify(msg); bytes += raw.length; msgN++; this.inbox.push({ msg, raw }); }
  /* chọn nước trên bản nhìn (luật chạy trên bản nhìn, như client thật) */
  plan() {
    const g = JSON.parse(JSON.stringify(this.V));
    Math.random = this.rnd;
    try { CE.aiPlan(g, "p", 6); } catch (e) { aiErr++; if (aiErr <= 3) console.log("  (ghi chú) aiPlan trên bản nhìn lỗi: " + e.message); g.q.p = [];
      for (const c of g.hand.p.slice()) { const li = Math.floor(this.rnd() * 3); try { CE.queuePlay(g, "p", c.uid, li); } catch (e2) { fail("queuePlay trên bản nhìn ném lỗi: " + e2.message); } } }
    finally { Math.random = RAND0; }
    /* thỉnh thoảng gửi thêm một nước sai/giả để máy chủ phải từ chối */
    const acts = g.q.p.map((a) => (a.t === "play" ? { t: "p", u: a.uid, l: a.li } : a.t === "move" ? { t: "m", u: a.uid, l: a.to } : { t: "a", u: a.uid }));
    if (this.rnd() < 0.15) acts.push({ t: "p", u: 99999, l: 1 });
    return { acts, snap: this.V.turn >= 3 && this.rnd() < 0.25 ? 1 : 0 };
  }
}

async function game(seed) {
  const R = mulberry(seed);
  const pickDeck = () => { const pool = REF.COLLECT.slice(); const d = []; while (d.length < 12) { const i = Math.floor(R() * pool.length); d.push(pool.splice(i, 1)[0]); } return d; };
  const decks = { p: pickDeck(), a: pickDeck() };
  if (seed % 7 === 0) decks.p[0] = "kequansat";             // Kẻ Quan Sát: thấy trước chiến địa
  if (seed % 5 === 0) decks.a[1] = "phanquanthiengioi";      // thêm 12 thẻ ngẫu nhiên vào bộ bài (ẩn)
  if (seed % 3 === 0) decks.p[2] = "conhansu";
  let now = 1_000_000;
  let M = AuthMatch.create(seed, decks, now);
  const CG = REF.newGame(decks.p.slice(), decks.a.slice(), { seed: seed >>> 0 }); CG.mode = { k: "online", diff: "thuong", lbl: "Đấu online" }; CG.online = 1;
  const cl = { p: new SimClient("p", mulberry(seed * 31 + 1)), a: new SimClient("a", mulberry(seed * 31 + 2)) };
  const seen = { p: new Set(), a: new Set() };
  const seenLocs = (g) => { for (const s of ["p", "a"]) for (const L of g.locs) if (L.rvl) seen[s].add("L:" + L.id); };
  const deliver = (outs) => { for (const x of outs) if (cl[x.to].up) cl[x.to].recv(x.msg); };
  const tag = (s, t) => `seed ${seed} lượt ${t} bên ${s}`;
  /* vào trận */
  for (const s of ["p", "a"]) {
    seenAdd(seen[s], CG, s); seenLocs(CG);
    const st = M.stateMsg(s, now); cl[s].recv(st);
    const { msg, raw } = cl[s].inbox.pop(); leakCheck(CG, s, msg.v, raw, seen[s], tag(s, 0) + " (vào trận)"); publicCheck(CG, s, msg.v, tag(s, 0)); cl[s].V = msg.v; cl[s].n = msg.n;
  }
  let guard = 0, endInfo = null, didReconnect = false, didEvict = false;
  while (!endInfo && ++guard < 40) {
    const t = M.turn;
    /* (c) giữa trận: p mất kết nối trước khi nộp lượt, a nộp, p kết nối lại -> nhận lại bản nhìn + lượt đối thủ đã nộp */
    const dropP = !didReconnect && t === 3;
    const order = seed % 2 ? ["a", "p"] : ["p", "a"];
    let pend = [];
    for (const s of order) {
      const pl = cl[s].plan();
      if (dropP && s === "p") { cl.p.up = false; pend.push(pl); continue; }
      const r = M.onMsg(s, { type: "sub", t, acts: pl.acts, snap: pl.snap }, now); deliver(r.out); if (r.end) endInfo = r.end;
      /* (c) nộp lượt rồi mất kết nối (tải lại trang): kết nối lại phải thấy lượt mình đã nộp, đối thủ chưa nộp */
      if (t === 5 && s === order[0]) {
        const st = M.stateMsg(s, now);
        ok(st.sub && JSON.stringify(st.sub.acts) === JSON.stringify(AG.cleanActs(pl.acts)) && st.sub.snap === (pl.snap ? 1 : 0) && st.osub === 0, `seed ${seed}: kết nối lại không thấy lượt đã nộp`);
        let r2 = M.onMsg(s, { type: "unsub", t }, now); ok(!M.st.sub[s] && r2.out.some((x) => x.msg.type === "osub" && x.msg.sub === 0), `seed ${seed}: huỷ nộp không được`);
        r2 = M.onMsg(s, { type: "sub", t, acts: pl.acts, snap: pl.snap }, now); deliver(r2.out);
        cl[oth(s)].inbox = cl[oth(s)].inbox.filter((x) => x.msg.type !== "osub"); cl[s].inbox = cl[s].inbox.filter((x) => x.msg.type !== "subr");
      }
      /* (c) máy chủ dỡ bộ nhớ ngay sau khi một bên nộp -> dựng lại từ nhật ký phải giữ nguyên lượt đã nộp */
      if (!didEvict && t === 4 && s === order[0]) {
        didEvict = true; const before = { p: M.stateMsg("p", now), a: M.stateMsg("a", now) };
        M = new AuthMatch(JSON.parse(JSON.stringify(M.toJSON())));
        for (const x of ["p", "a"]) { const after = M.stateMsg(x, now); before[x].last = null; ok(JSON.stringify(after) === JSON.stringify(before[x]), `seed ${seed}: dựng lại từ nhật ký cho bản nhìn khác (${x})`); }
      }
    }
    if (dropP) {
      didReconnect = true; cl.p.up = true; cl.p.inbox.length = 0;
      const st = M.stateMsg("p", now); ok(st.osub === 1 && st.sub === null && st.n === cl.p.n, `seed ${seed}: kết nối lại sai trạng thái chờ (${JSON.stringify({ osub: st.osub, n: st.n })})`);
      ok(JSON.stringify(Object.assign({}, st.v, { evs: [], msgs: [] })) === JSON.stringify(Object.assign({}, cl.p.V, { evs: [], msgs: [] })), `seed ${seed}: kết nối lại cho bản nhìn khác bản đang có`);
      cl.p.recv(st); cl.p.inbox.length = 0;
      const pl = pend[0];
      const r = M.onMsg("p", { type: "sub", t, acts: pl.acts, snap: pl.snap }, now);
      ok(r.out.some((x) => x.to === "p" && x.msg.type === "turn") && r.out.some((x) => x.to === "a" && x.msg.type === "turn"), `seed ${seed}: đủ hai bên mà không giải lượt`);
      deliver(r.out); if (r.end) endInfo = r.end;
    }
    if (!M.st.sub.p || !M.st.sub.a) { /* trường hợp đã huỷ: nộp lại phần thiếu */ for (const s of ["p", "a"]) if (!M.st.sub[s]) { const pl = cl[s].plan(); const r = M.onMsg(s, { type: "sub", t, acts: pl.acts, snap: pl.snap }, now); deliver(r.out); if (r.end) endInfo = r.end; } }
    /* lượt đã giải: so từng khung với engine tham chiếu */
    const entry = M.st.log[M.st.log.length - 1];
    const ref = refTurn(CG, entry);
    for (const s of ["p", "a"]) {
      const tm = cl[s].inbox.filter((x) => x.msg.type === "turn"); cl[s].inbox = [];
      ok(tm.length === 1, `${tag(s, t)}: nhận ${tm.length} gói lượt`);
      if (!tm.length) continue;
      const { msg } = tm[0]; rejected += msg.bad;
      ok(msg.frames.length === ref.length && msg.frames.every((f, i) => f.k === ref[i].k), `${tag(s, t)}: chuỗi khung khác tham chiếu (${msg.frames.map((f) => f.k).join(",")} / ${ref.map((f) => f.k).join(",")})`);
      for (let i = 0; i < Math.min(ref.length, msg.frames.length); i++) {
        frameN++;
        seenAdd(seen[s], ref[i].g, s); seenLocs(ref[i].g);
        const F = msg.frames[i];
        leakCheck(ref[i].g, s, F.v, JSON.stringify(F), seen[s], tag(s, t) + " khung " + i + "/" + F.k);
        publicCheck(ref[i].g, s, F.v, tag(s, t) + " khung " + i + "/" + F.k);
        /* sự kiện: cùng số lượng và cùng loại (hoạt ảnh diễn được đủ) */
        const re = ref[i].g.evs || [], ve = F.v.evs || [];
        ok(re.length === ve.length && re.every((e, j) => e.k === ve[j].k && e.uid === (ve[j].uid)), `${tag(s, t)} khung ${i}: chuỗi sự kiện bị rơi/đổi`);
      }
      cl[s].V = msg.frames[msg.frames.length - 1].v; cl[s].n = msg.n;
      /* client báo đã diễn xong */
      deliver(M.onMsg(s, { type: "ready", n: msg.n }, now).out);
    }
    ok(AG.hashSt(M.G) === AG.hashSt(CG), `seed ${seed} lượt ${t}: trạng thái máy chủ khác engine cục bộ`);
    if (CG.phase === "over") {
      ok(endInfo && endInfo.reason === "end", `seed ${seed}: hết ván mà máy chủ không kết thúc`);
      const w = CG.result.winner; ok(endInfo && endInfo.w === (w === "draw" ? null : w), `seed ${seed}: người thắng lệch (${endInfo && endInfo.w} / ${w})`);
      for (const s of ["p", "a"]) { const st = M.stateMsg(s, now); ok(st.over && st.over.w === (w === "draw" ? null : w === s ? "p" : "a"), `seed ${seed}: kết quả gửi bên ${s} sai`); }
    }
    now += 20000;
  }
  ok(!!endInfo, `seed ${seed}: ván không kết thúc`);
  return endInfo;
}

/* ---------- đồng hồ lượt & bỏ 3 lượt ---------- */
function timerTest() {
  let now = 5_000_000;
  const decks = { p: REF.themedDeck("KD", () => 0.3).slice(0, 12), a: REF.themedDeck("KD", () => 0.6).slice(0, 12) };
  const M = AuthMatch.create(777, decks, now);
  ok(M.nextDeadline() === now + AUTH.introMs + AUTH.turnMs + AUTH.graceMs, "hạn lượt 1 sai");
  let r = M.tick(now + 1000); ok(!r.out.length, "chưa tới hạn mà đã tự bỏ lượt");
  /* a nộp, p im lặng -> quá hạn: máy chủ tự ra lượt trống cho p và giải lượt */
  M.onMsg("a", { type: "sub", t: 1, acts: [], snap: 0 }, now);
  r = M.tick(M.deadline("p") + 1);
  ok(r.out.some((x) => x.to === "p" && x.msg.type === "turn") && M.st.miss.p === 1 && M.st.miss.a === 0, "quá hạn không tự bỏ lượt / sai đếm");
  /* p nộp tay lượt 2 (đếm về 0), rồi bỏ 3 lượt liên tiếp -> thua */
  now = M.st.clk.p; M.onMsg("p", { type: "ready", n: M.st.n }, now);
  M.onMsg("p", { type: "sub", t: 2, acts: [], snap: 0 }, now); M.onMsg("a", { type: "sub", t: 2, acts: [], snap: 0 }, now);
  ok(M.st.miss.p === 0, "nộp tay không xoá đếm bỏ lượt");
  let end = null;
  for (let k = 0; k < 3 && !end; k++) { M.onMsg("a", { type: "sub", t: M.turn, acts: [], snap: 0 }, now); r = M.tick(M.deadline("p") + 1); end = r.end; now = M.deadline("p"); }
  ok(end && end.w === "a" && end.reason === "turn_timeout", "bỏ 3 lượt liên tiếp không bị xử thua: " + JSON.stringify(end));
  /* client tự báo hết giờ (auto) cũng được đếm */
  const M2 = AuthMatch.create(778, decks, now);
  for (let k = 0; k < 2; k++) { M2.onMsg("p", { type: "sub", t: M2.turn, acts: [], auto: 1 }, now); M2.onMsg("a", { type: "sub", t: M2.turn, acts: [] }, now); }
  ok(M2.st.miss.p === 2 && M2.stateMsg("p", now).v.cnt.missed === 2, "đếm bỏ lượt từ client (auto) sai");
  /* nộp sai lượt bị từ chối */
  r = M2.onMsg("a", { type: "sub", t: 1, acts: [] }, now); ok(r.out[0].msg.type === "subr" && r.out[0].msg.ok === 0, "nộp sai lượt không bị từ chối");
  /* rút lui */
  const f = M2.forfeit("a", "retreat"); ok(f.w === "p" && M2.stateMsg("a", now).over.w === "a", "rút lui sai");
}

/* engine.gen.js phải khớp 01-engine.js */
try { execFileSync(process.execPath, [path.join(root, "server/scripts/gen-engine.mjs"), "--check"], { stdio: "pipe" }); checks++; }
catch (e) { fail("server/src/engine.gen.js cũ: chạy node server/scripts/gen-engine.mjs"); }

const t0 = Date.now();
timerTest();
const seeds = ONLY != null ? [ONLY] : Array.from({ length: N }, (_, i) => 1000 + i * 17);
const res = { p: 0, a: 0, draw: 0 };
for (const s of seeds) { const e = await game(s); if (e) res[e.w === null ? "draw" : e.w]++; }
console.log(`online-auth: ${seeds.length} ván (p thắng ${res.p}, a thắng ${res.a}, hoà ${res.draw}), ${frameN} khung, ${msgN} tin (${Math.round(bytes / msgN / 1024)} KB/tin), ${checks} kiểm tra, nước bị máy chủ từ chối ${rejected}, aiPlan trên bản nhìn lỗi ${aiErr}, sức mạnh hiển thị lệch ${diffPow} — ${Date.now() - t0} ms`);
if (fails) { console.log(`THẤT BẠI: ${fails} lỗi`); process.exit(1); }
console.log("OK");
