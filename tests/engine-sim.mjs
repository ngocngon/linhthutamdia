// Mô phỏng engine: chạy nhiều ván ngẫu nhiên (có hạt giống) + ép từng thẻ vào bộ bài.
// Chạy: node tests/engine-sim.mjs   (SIM_GAMES=500 mặc định, SIM_FORCE=3 ván/thẻ)
// Tái hiện đúng 1 ván: SIM_SEED=<seed> [SIM_CARD=<id thẻ ép>] node tests/engine-sim.mjs  (dòng LỖI in sẵn lệnh)
//   (aiPlan/aiWantsSnap trong engine dùng Math.random -> trong TEST thay bằng PRNG có hạt giống theo từng ván,
//    nên cùng seed luôn cho cùng ván; game thật không bị đụng tới)
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const LT = require(path.join(here, "..", "www", "js", "01-engine.js"));
const N = +process.env.SIM_GAMES || 500, FORCE = +process.env.SIM_FORCE || 3;
const HAND_MAX = LT.HAND_MAX || 7, MAXT = 20;
const known = existsSync(path.join(here, "known-issues.json")) ? JSON.parse(readFileSync(path.join(here, "known-issues.json"), "utf8")) : { cards: [], messages: [] };

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function check(G) {
  const seen = new Set(), errs = [];
  const add = (c, where) => {
    if (!c || typeof c !== "object") return;
    if (c.uid != null) { if (seen.has(c.uid)) errs.push("thẻ uid " + c.uid + " (" + c.id + ") xuất hiện 2 nơi, lần 2 tại " + where); seen.add(c.uid); }
  };
  for (const s of ["p", "a"]) {
    if (!(G.energy[s] >= 0)) errs.push("năng lượng âm/NaN " + s + "=" + G.energy[s]);
    if (G.hand[s].length > HAND_MAX) errs.push("tay " + s + " vượt " + HAND_MAX + ": " + G.hand[s].length);
    for (const z of ["hand", "deck", "disc", "dead"]) for (const c of G[z][s]) add(c, z + "." + s);
  }
  G.locs.forEach((L, li) => {
    for (const s of ["p", "a"]) {
      if (L.cards[s].length > Math.max(4, LT.cap(G, li) || 0)) errs.push("khu " + li + " phe " + s + " có " + L.cards[s].length + " thẻ");
      for (const c of L.cards[s]) {
        add(c, "loc" + li + "." + s);
        let pw; if (!c.rev) continue; try { pw = LT.power(G, c, li); } catch (e) { pw = e; }
        if (typeof pw !== "number" || !Number.isFinite(pw)) errs.push("sức mạnh không hữu hạn: " + c.id + " = " + pw);
      }
    }
  });
  return errs;
}

const ONLY = process.env.SIM_SEED != null && process.env.SIM_SEED !== "" ? +process.env.SIM_SEED : null;
const ONLY_CARD = process.env.SIM_CARD || null;
const RAND0 = Math.random;
/* Math.random có hạt giống riêng cho từng ván (khác dãy với hạt giống bộ bài) */
function withSeededRandom(seed, fn) { Math.random = mulberry((seed ^ 0x5EED1234) >>> 0); try { return fn(); } finally { Math.random = RAND0; } }
function fingerprint(G) { return JSON.stringify([G.turn, G.rs, G.result && G.result.winner, G.locs.map(L => [L.id, L.cards.p.map(c => c.id + ":" + c.bonus), L.cards.a.map(c => c.id + ":" + c.bonus)])]); }

function play(deckP, deckA, seed) { return withSeededRandom(seed, () => play0(deckP, deckA, seed)); }
function play0(deckP, deckA, seed) {
  const G = LT.newGame(deckP, deckA, { seed });
  const used = new Set();
  let guard = 0;
  while (G.phase !== "over") {
    if (++guard > MAXT) throw new Error("ván không kết thúc sau " + MAXT + " lượt (turn=" + G.turn + ", phase=" + G.phase + ")");
    LT.startTurn(G);
    for (const s of ["p", "a"]) LT.aiPlan(G, s, 8);
    LT.runTurn(G);
    for (const s of ["p", "a"]) for (const L of G.locs) for (const c of L.cards[s]) used.add(c.id);
    const errs = check(G);
    if (errs.length) throw new Error("trạng thái sai ở lượt " + G.turn + ": " + errs.slice(0, 3).join("; "));
    if (G.phase !== "over" && G.turn >= LT.turns(G)) LT.finish(G, "end");
  }
  return { G, used };
}

const stats = { games: 0, p: 0, a: 0, draw: 0, slow: 0, slowSeed: null }, exercised = new Set(), failures = [];
function run(label, deckP, deckA, seed, forced) {
  if (ONLY != null && (seed !== ONLY || (ONLY_CARD && forced !== ONLY_CARD))) return;
  const t0 = performance.now();
  try {
    const { G, used } = play(deckP, deckA, seed);
    const w = G.result && G.result.winner; if (w === "p") stats.p++; else if (w === "a") stats.a++; else stats.draw++;
    used.forEach(x => exercised.add(x));
  } catch (e) {
    failures.push({ label, card: forced || null, seed, deckP, deckA, msg: String(e.message), stack: String(e.stack).split("\n").slice(0, 6).join("\n") });
  }
  const ms = performance.now() - t0; stats.games++;
  if (ms > stats.slow) { stats.slow = ms; stats.slowSeed = seed; }
}

const t0 = Date.now();
{ /* tự kiểm tính tái hiện: cùng seed chạy 2 lần phải ra cùng một ván */
  const seed = 1000, r1 = mulberry(seed), dp = LT.randomDeck(r1), da = LT.randomDeck(r1);
  const a = fingerprint(play(dp, da, seed).G), b = fingerprint(play(dp, da, seed).G);
  if (a !== b) { console.error("LỖI: cùng seed nhưng ván khác nhau -> mô phỏng không tái hiện được"); process.exit(1); }
}
for (let i = 0; i < N; i++) { const seed = 1000 + i, r = mulberry(seed); run("random", LT.randomDeck(r), LT.randomDeck(r), seed); }
const nRandom = stats.games;
for (const id of LT.COLLECT) {
  for (let k = 0; k < FORCE; k++) {
    const seed = 500000 + k * 7919 + id.length, r = mulberry(seed);
    const mk = () => { const d = LT.randomDeck(r).filter(x => x !== id); d.splice(Math.floor(r() * (d.length + 1)), 0, id); return d.slice(0, 12).includes(id) ? d.slice(0, 12) : [id, ...d.slice(0, 11)]; };
    run("forced:" + id, mk(), mk(), seed, id);
  }
}
const isKnown = f => (known.cards || []).includes(f.card) || (known.messages || []).some(m => f.msg.includes(m));
const real = failures.filter(f => !isKnown(f)), allowed = failures.filter(isKnown);
console.log(`Ván: ${stats.games} (ngẫu nhiên ${nRandom}, ép thẻ ${stats.games - nRandom}) | thắng p=${stats.p} a=${stats.a} hòa=${stats.draw}`);
console.log(`Ván chậm nhất: ${stats.slow.toFixed(0)}ms (seed ${stats.slowSeed}) | thẻ đã xuất hiện trên bàn: ${LT.COLLECT.filter(x => exercised.has(x)).length}/${LT.COLLECT.length} | tổng ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (ONLY != null) console.log("(chỉ chạy seed " + ONLY + ")");
const unseen = ONLY != null ? [] : LT.COLLECT.filter(x => !exercised.has(x)); if (unseen.length) console.log("Thẻ chưa từng ra bàn (" + unseen.length + "): " + unseen.slice(0, 40).join(", "));
for (const f of allowed) console.log(`[đã biết] ${f.label} seed=${f.seed}: ${f.msg}`);
for (const f of real) console.error(`LỖI ${f.label} card=${f.card} seed=${f.seed}  (tái hiện: SIM_SEED=${f.seed}${f.card ? " SIM_CARD=" + f.card : ""} node tests/engine-sim.mjs)\n  deckP=${f.deckP.join(",")}\n  deckA=${f.deckA.join(",")}\n  ${f.msg}\n${f.stack}`);
if (real.length) { console.error(`${real.length} ván lỗi`); process.exit(1); }
console.log("OK");
