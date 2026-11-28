// Trận online do MÁY CHỦ giữ trạng thái (server-authoritative).
// Máy chủ chạy đúng bộ luật của game (engine.gen.js sinh từ www/js/01-engine.js), giữ toàn bộ trạng thái trận,
// nhận hành động mỗi lượt của hai bên, tự giải lượt rồi gửi cho MỖI BÊN chỉ phần bên đó được thấy:
//  - tay đối thủ: chỉ số lượng + mặt lưng (thẻ giữ chỗ id "__an", giữ uid để diễn hoạt ảnh);
//  - bộ bài của mình và của đối thủ: chỉ số lượng (thẻ giữ chỗ, xếp theo uid nên không lộ thứ tự rút);
//  - thẻ úp của đối thủ: mặt lưng tới khi lật; chiến địa chưa lộ: "__loc" (trừ khi luật cho xem — Kẻ Quan Sát);
//  - không gửi hạt giống RNG, danh sách bộ bài đối thủ, bài khởi đầu của đối thủ, hiệu ứng Đầu Ván riêng của đối thủ;
//  - chuỗi sự kiện (G.evs) được lọc: sự kiện riêng (deckadd priv, top) chỉ phe được phép thấy mới có danh tính thẻ.
// Lớp lọc thứ hai (phòng sót): mọi chuỗi trong bản gửi đi trùng id thẻ mà bên nhận CHƯA từng được thấy -> "__an",
// tên thẻ đó trong chữ (nhật ký, ghi chú) -> "Thẻ ẩn"; khoá đối tượng là id thẻ chưa thấy cũng bị đổi.
// Trường cấp cao của trạng thái đi qua DANH SÁCH TRẮNG VIEW_KEYS: trường engine mới chưa phân loại không được gửi.
// File này không phụ thuộc Cloudflare: Worker (match.js) và bộ test Node (tests/online-auth.mjs) dùng chung.
import E from "./engine.gen.js";

export const HID = "__an", HLOC = "__loc", HNAME = "Thẻ ẩn";
export const SIDES = ["p", "a"];
const oth = (s) => (s === "p" ? "a" : "p");
const C = E.C, LOC = E.LOC;

/* lật góc nhìn: y hệt mirrorG của client (05-vfx-core.js) — trạng thái gốc chủ phòng là "p" */
export function mirrorG(o) {
  if (Array.isArray(o)) return o.map(mirrorG);
  if (o && typeof o === "object") { const r = {}, pa = ("p" in o) && ("a" in o); for (const k in o) { const nk = pa && k === "p" ? "a" : pa && k === "a" ? "p" : k; r[nk] = mirrorG(o[k]); } return r; }
  return o === "p" ? "a" : o === "a" ? "p" : o;
}

export const okDeck = (dk) => Array.isArray(dk) && dk.length === 12 && dk.every((id) => typeof id === "string" && C[id] && E.COLLECT.includes(id));

export function newAuthGame(seed, decks) {
  const G = E.newGame(decks.p.slice(), decks.a.slice(), { seed: seed >>> 0 });
  G.mode = { k: "online", diff: "thuong", lbl: "Đấu online" }; G.online = 1;
  return G;
}

/* hành động client gửi (myActs của client): {t:"p"|"m"|"a", u:uid, l:chiến địa} */
export function cleanActs(acts) {
  if (!Array.isArray(acts)) return [];
  const out = [];
  for (const a of acts.slice(0, 64)) {
    if (!a || typeof a !== "object" || !["p", "m", "a"].includes(a.t) || !Number.isInteger(a.u)) continue;
    out.push({ t: a.t, u: a.u, l: Number.isInteger(a.l) ? Math.max(0, Math.min(2, a.l)) : 0 });
  }
  return out;
}
export function applyActs(G, side, acts) {
  let bad = 0;
  for (const a of acts) {
    let r = false;
    try { r = a.t === "p" ? E.queuePlay(G, side, a.u, a.l | 0) : a.t === "m" ? E.queueMove(G, side, a.u, a.l | 0) : a.t === "a" ? E.queueAct(G, side, a.u) : false; } catch (e) { r = false; }
    if (!r) bad++;
  }
  return bad;
}

/* ---------- ai được thấy gì ---------- */
function addC(K, c) {
  if (!c || typeof c !== "object") return;
  if (c.id) K.add(c.id);
  if (typeof c.ab === "string") K.add(c.ab);
  if (Array.isArray(c.xab)) for (const x of c.xab) if (typeof x === "string") K.add(x);
  if (typeof c.cpOf === "string") K.add(c.cpOf);
}
/* id thẻ bên `side` được thấy ở khung hình hiện tại (theo luật) */
export function visibleIds(G, side) {
  const K = new Set();
  for (const c of G.hand[side]) addC(K, c);
  for (const c of G.deck[side]) addC(K, c);
  for (const s of SIDES) for (const z of ["disc", "dead"]) for (const c of G[z][s] || []) addC(K, c);
  for (const L of G.locs) for (const s of SIDES) for (const c of L.cards[s]) if (s === side || c.rev) addC(K, c);
  if (G.s6 && G.s6[side] && G.s6[side].c) addC(K, G.s6[side].c);
  for (const e of G.evs || []) if (e && e.k === "deckadd" && e.priv === side && typeof e.id === "string") K.add(e.id);
  return K;
}
export function knownLocs(G, side, KL) {
  const out = new Set(KL || []);
  for (const L of G.locs) if (L.rvl) out.add(L.id);
  if (G.uatu && G.uatu[side]) for (const L of G.locs) out.add(L.id); /* Kẻ Quan Sát: thấy trước chiến địa */
  return out;
}

/* ---------- dựng bản nhìn cho một bên ---------- */
function blank(c, extra) {
  return Object.assign({ uid: c.uid, id: HID, side: c.side, own: c.own, cr: false, by: null, bu: 0, bonus: 0, bp: null, cm: 0, rev: false, turn: 0, sum: false, rvv: false, eb: 0, sil: null, act: false, mv: false, age: 0, played: false, et: 0, mask: 1 }, extra || {});
}
const PRIV_EV = { deckadd: 1 };
/* DANH SÁCH TRẮNG trường cấp cao của trạng thái trận (G) được gửi cho client.
   "pub": công khai (vẫn qua lớp lọc thứ hai: chuỗi / khoá là id thẻ chưa thấy -> "__an");
   "own": đối tượng {p,a} theo phe — chỉ giữ phần của bên nhận, phần đối thủ thay bằng giá trị rỗng;
   "fix": có xử lý riêng trong viewFor (che thẻ / lọc sự kiện ...); "drop": không bao giờ gửi.
   Trường engine MỚI chưa có ở đây bị BỎ khỏi bản nhìn (an toàn mặc định) và tests/online-auth.mjs báo lỗi để phân loại. */
export const VIEW_KEYS = {
  hand: "fix", deck: "fix", locs: "fix", q: "fix", s6: "fix", start: "fix", open: "fix", startFx: "fix", evs: "fix",
  arishem: "fix", uatu: "fix", agatha: "fix", tff: "fix", zgm: "fix",
  pmv: "own",      /* gpu71 L1: lệnh dời đang chờ giải — của đối thủ là bí mật tới khi bước dời chạy */
  rs: "drop", idOf: "drop",
  _fk: "pub", arana: "pub", aranaU: "pub", asId: "pub", bonusNow: "pub", bwN: "pub", cnt: "pub", costCap: "pub", costUp: "pub",
  cur: "pub", curId: "pub", dead: "pub", depth: "pub", destLoc: "pub", disc: "pub", edep: "pub", endTwice: "pub", energy: "pub",
  first: "pub", fist: "pub", forge: "pub", fr: "pub", grapple: "pub", hideT: "pub", km: "pub", lastChar: "pub", lastMove: "pub",
  lastPlay: "pub", lastRev: "pub", ldd: "pub", live: "pub", locMk: "pub", lockjaw: "pub", lsk: "pub", lskId: "pub", ltp: "pub",
  maxE: "pub", mg: "pub", mode: "pub", mods: "pub", msg: "pub", msgs: "pub", newLoc: "pub", nextBonus: "pub", nico: "pub",
  noLoc: "pub", omega: "pub", online: "pub", pendingDouble: "pub", ph: "pub", phase: "pub", prevPlay: "pub", pseq: "pub",
  result: "pub", retreatChecked: "pub", shots: "pub", shuri: "pub", sling: "pub", slingU: "pub", snap: "pub", srcU: "pub",
  stake: "pub", stones: "pub", swan: "pub", turn: "pub", twoT: "pub", uid: "pub", unspent: "pub", unspentPrev: "pub",
  usStreak: "pub", vtt: "pub", zero: "pub",
};
/* trường cấp cao của G chưa được phân loại (test dùng để bắt trường engine mới) */
export const unclassifiedKeys = (G) => Object.keys(G).filter((k) => !(k in VIEW_KEYS));
const emptyLike = (x) => (Array.isArray(x) ? [] : x && typeof x === "object" ? {} : typeof x === "number" ? 0 : typeof x === "boolean" ? false : null);
const EV_ID_KEYS = ["id", "fid", "oid", "ab", "c0", "p0", "c1", "p1", "as"];

/* G: trạng thái gốc (chủ phòng = "p"); side: bên nhận; know: {ids:Set, locs:Set} (tích luỹ, được cập nhật tại đây) */
export function viewFor(G, side, know, extra) {
  const o = oth(side);
  const K = know.ids; for (const id of visibleIds(G, side)) K.add(id);
  know.locs = knownLocs(G, side, know.locs);
  const V = {};
  for (const k in G) { const kind = VIEW_KEYS[k]; if (!kind || kind === "drop" || G[k] === undefined) continue; V[k] = JSON.parse(JSON.stringify(G[k])); }
  for (const k in V) if (VIEW_KEYS[k] === "own" && V[k] && typeof V[k] === "object" && o in V[k]) V[k][o] = emptyLike(V[k][o]);
  const masked = new Set(), secretIds = new Set();
  const hide = (c, extra2) => { masked.add(c.uid); if (!K.has(c.id)) secretIds.add(c.id); if (typeof c.ab === "string" && !K.has(c.ab)) secretIds.add(c.ab); return blank(c, extra2); };
  V.hand[o] = V.hand[o].map((c) => hide(c));
  V.deck[o] = V.deck[o].map((c) => hide(c)).sort((x, y) => x.uid - y.uid);
  V.deck[side] = V.deck[side].map((c) => { masked.add(c.uid); return blank(c); }).sort((x, y) => x.uid - y.uid);
  for (const L of V.locs) L.cards[o] = L.cards[o].map((c) => (c.rev ? c : hide(c, { hid: c.hid || false, ps: c.ps || 0, turn: c.turn || 0, played: !!c.played, sum: !!c.sum })));
  V.q[o] = [];
  if (V.s6 && V.s6[o] && V.s6[o].c) V.s6[o] = { c: hide(V.s6[o].c), m: V.s6[o].m, n: V.s6[o].n, last: V.s6[o].last, done: V.s6[o].done };
  /* thông tin bộ bài / Đầu Ván của đối thủ */
  if (V.start) V.start[o] = [];
  if (V.open) V.open[o] = [];
  if (Array.isArray(V.startFx)) V.startFx = V.startFx.filter((f) => f && f.s === side);
  for (const k of ["arishem", "uatu", "agatha", "tff"]) if (V[k] && typeof V[k] === "object" && o in V[k]) V[k][o] = false;
  if (V.zgm) V.zgm[o] = [];
  /* chiến địa chưa lộ */
  const hiddenLocNames = [];
  for (const L of V.locs) if (!L.rvl && !know.locs.has(L.id)) { if (LOC[L.id]) hiddenLocNames.push(LOC[L.id].n); L.id = HLOC; }
  const hiddenLocIds = new Set(G.locs.filter((L, i) => V.locs[i].id === HLOC).map((L) => L.id));
  /* sự kiện riêng */
  if (Array.isArray(V.evs)) V.evs = V.evs.map((e) => {
    if (!e || typeof e !== "object") return e;
    const priv = (PRIV_EV[e.k] && e.priv && e.priv !== side) || (e.k === "top" && e.side && e.side !== side);
    if (priv || (typeof e.uid === "number" && masked.has(e.uid) && !(e.k === "deckadd" && e.priv === side) && !(e.k === "top" && e.side === side))) { const x = Object.assign({}, e); for (const k of EV_ID_KEYS) if (k in x && (k !== "as" || priv)) delete x[k]; return x; }
    return e;
  });
  /* lớp lọc thứ hai: id / tên thẻ chưa từng được thấy */
  for (const id of secretIds) if (K.has(id)) secretIds.delete(id);
  const names = [];
  for (const id of secretIds) if (C[id] && C[id].n && C[id].n.length >= 3) names.push(C[id].n);
  for (const n of hiddenLocNames) if (n && n.length >= 3) names.push(n);
  names.sort((a, b) => b.length - a.length);
  const scrubStr = (s) => {
    if (C[s] && s !== HID) return K.has(s) ? s : HID;
    if (hiddenLocIds.has(s)) return HLOC;
    if (names.length && s.length >= 3) for (const n of names) if (s.includes(n)) s = s.split(n).join(HNAME);
    return s;
  };
  const scrub = (x) => {
    if (typeof x === "string") return scrubStr(x);
    if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) x[i] = scrub(x[i]); return x; }
    if (x && typeof x === "object") {
      for (const k in x) {
        const v = scrub(x[k]);
        /* khoá đối tượng là id thẻ chưa thấy (vd. bộ đếm theo id) -> đổi khoá */
        if (C[k] && k !== HID && !K.has(k)) { delete x[k]; x[HID] = v; } else x[k] = v;
      }
      return x;
    }
    return x;
  };
  scrub(V);
  if (extra) Object.assign(V, extra);
  return side === "a" ? mirrorG(V) : V;
}

/* ---------- giải một lượt, sinh khung hình cho cả hai bên ----------
   Thứ tự khung khớp onlineResolveRun / endReveal của client:
   rev0 (đặt úp) · st (từng bước lật) · eot (từng bước cuối lượt) · fin · [er0, er (lật thẻ giấu cuối ván), over] | start (lượt mới) */
export function resolveTurn(G, sub, know, opts) {
  opts = opts || {};
  const want = opts.views !== false;
  const frames = { p: [], a: [] };
  const push = (k, extra) => {
    for (const s of SIDES) {
      if (!want) { for (const id of visibleIds(G, s)) know[s].ids.add(id); know[s].locs = knownLocs(G, s, know[s].locs); continue; }
      const v = viewFor(G, s, know[s], opts.extra && opts.extra[s]);
      frames[s].push(Object.assign({ k, v }, extra || {}));
    }
  };
  const bad = { p: applyActs(G, "p", sub.p.acts), a: applyActs(G, "a", sub.a.acts) };
  if (sub.p.snap && !G.snap.p) { G.snap.p = true; G.pendingDouble++; }
  if (sub.a.snap && !G.snap.a) { G.snap.a = true; G.pendingDouble++; }
  const steps = E.beginReveal(G); push("rev0");
  for (const st of steps) { const did = E.doStep(G, st); if (!did && !G.msgs.length) continue; push("st"); }
  for (const st of E.beginEndTurn(G)) { const did = E.stepEndTurn(G, st); if (!did && !G.msgs.length && !G.evs.length) continue; push("eot"); }
  E.finishEndTurn(G); push("fin");
  if (G.turn >= E.turns(G)) {
    for (let r = 0; r < 4; r++) {
      const L = E.hiddenOrder(G); if (!L.length) break;
      if (!r) { G.evs.length = 0; G.msgs.length = 0; push("er0"); }
      for (const h of L) { G.evs.length = 0; G.msgs.length = 0; if (!E.revealHidden(G, h.uid)) continue; push("er"); }
    }
    G.evs.length = 0; G.msgs.length = 0;
    E.finish(G, "end"); push("over");
  } else { E.startTurn(G); push("start"); }
  return { frames, bad };
}

/* dựng lại trận từ nhật ký (Durable Object bị dỡ khỏi bộ nhớ) — cập nhật luôn "đã thấy" của hai bên */
export function newKnow() { return { p: { ids: new Set(), locs: new Set() }, a: { ids: new Set(), locs: new Set() } }; }
export function replay(seed, decks, log) {
  const G = newAuthGame(seed, decks), know = newKnow();
  for (const s of SIDES) viewFor(G, s, know[s]);
  for (const t of log) { resolveTurn(G, t, know, { views: false }); if (G.phase === "over") break; }
  return { G, know };
}

/* dấu vân tay trạng thái (so khớp test / chẩn đoán) — giống hashSt của client */
export function hashSt(g) {
  let s = g.turn + "|" + g.energy.p + "," + g.energy.a;
  for (let i = 0; i < 3; i++) { s += "|" + g.locs[i].id; for (const sd of ["p", "a"]) for (const c of g.locs[i].cards[sd]) s += "," + c.uid + ":" + c.id + ":" + (c.rev ? E.power(g, c, i) : 0); }
  s += "|" + g.hand.p.map((c) => c.uid).join(".") + "|" + g.hand.a.map((c) => c.uid).join(".");
  let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
export { E };
