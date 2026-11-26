// vfx55: LẬP DANH SÁCH thẻ cho hai hiệu ứng trận, dựa HOÀN TOÀN vào luật engine (không đoán bằng chữ):
//  (1) "dieu_kien": thẻ mà kỹ năng chỉ kích hoạt ở một số ô/chiến địa — chạy LT.duDoanKichHoat (bản sao, lật thật,
//      so với bản sao bị xoá kỹ năng) trên nhiều thế trận lấy từ ván máy-đấu-máy; thẻ nào có thế trận mà tập chiến địa
//      kích hoạt là tập con THẬT SỰ (khác rỗng, khác toàn bộ) của các chiến địa đặt được -> có điều kiện vị trí.
//      Thêm nhóm "cho": thẻ đã nằm trên bàn và chờ bạn đặt thẻ vào chiến địa của nó ở lượt sau (đọc trường wait/w2/shuri của engine).
//  (2) "phu_chien_dia": thẻ mà khi kỹ năng chạy, MỌI thẻ khác ở chiến địa của nó (một phía trọn vẹn ≥2 thẻ, hoặc cả hai phía)
//      đều đổi sức mạnh/bị huỷ/bị xoá kỹ năng, còn chiến địa khác không bị phủ trọn -> VFX phủ chiến địa.
// Chạy: node tools/vfx_dieu_kien.mjs   (ghi tools/vfx_dieu_kien.json + khối VKD trong www/js/13-fxr.js)
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, "..");
const LT = require(path.join(root, "www", "js", "01-engine.js"));
const ds = readFileSync(path.join(root, "www", "js", "03-data-store.js"), "utf8");
const RN = JSON.parse(ds.match(/const RENAME=(\{.*?\}),TEXTS=/s)[1]), TX = JSON.parse(ds.match(/,TEXTS=(\{.*?\});for/s)[1]);
const ten = id => RN[id] || LT.C[id].n;
const moTa = id => { let x = TX[id] || LT.C[id].x || ""; const pairs = Object.entries(RN).filter(([k]) => LT.C[k] && LT.C[k].n !== RN[k]).map(([k, v]) => [LT.C[k].n, v]).sort((a, b) => b[0].length - a[0].length); for (const [a, b] of pairs) x = x.split(a).join(b); return x; };

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R0 = Math.random;
/* thế trận mẫu: đầu mỗi lượt 2..6 của các ván máy-đấu-máy (hạt giống cố định -> kết quả lặp lại được).
   Chiến địa đặt về "meadow" (trung tính) để chỉ đo điều kiện do THẺ; lúc chơi thật vẫn xét chiến địa thật (vd Chòi Canh chặn Lật -> không tô). */
function snapshots(nGames) {
  const out = [];
  for (let g = 0; g < nGames; g++) {
    Math.random = mulberry(1000 + g);
    try {
      const R = mulberry(77 + g), dp = LT.randomDeck(R), da = LT.randomDeck(R);
      const G = LT.newGame(dp, da, { seed: 4242 + g });
      let guard = 0;
      while (G.phase !== "over" && guard++ < 9) {
        LT.startTurn(G);
        if (G.turn >= 2 && G.turn <= 6) { const S = LT.clone(G); S.msgs = null; S.evs = null; for (const L of S.locs) { if (!L.gone) { L.id = "meadow"; L.rvl = true; } } out.push(S); }
        for (const s of ["p", "a"]) LT.aiPlan(G, s, 6);
        LT.runTurn(G);
      }
    } finally { Math.random = R0; }
  }
  return out;
}
const SN = snapshots(+process.env.VKD_GAMES || 40);
const withCard = (S0, id) => { const S = LT.clone(S0); S.msgs = null; S.evs = null; if (S.hand.p.length >= LT.HAND_MAX) S.hand.p.shift(); const c = LT.mk(S, id, "p"); S.hand.p.push(c); return [S, c]; };

/* ---------- (1) điều kiện vị trí ---------- */
const TYPES = new Set(["rev", "on", "end"]);
const cand = Object.keys(LT.C).filter(id => TYPES.has(LT.C[id].t));
const dk = [];
for (const id of cand) {
  let tests = 0, proper = 0, never = 0, all = 0;
  for (const S0 of SN) {
    const [S, c] = withCard(S0, id);
    const can = [0, 1, 2].filter(li => { const e = S.energy.p; S.energy.p = 99; const ok = LT.canPlay(S, "p", c, li); S.energy.p = e; return ok; });
    if (can.length < 2) continue;
    const yes = can.filter(li => { const r = LT.duDoanKichHoat(S, "p", c.uid, li); return r && r.kich; });
    tests++;
    if (yes.length === 0) never++; else if (yes.length === can.length) all++; else proper++;
  }
  /* có điều kiện: tập con thật sự xuất hiện ở ≥4 thế trận và ≥8% số thế trận thử */
  if (proper >= 4 && proper >= tests * 0.08) dk.push({ id, ten: ten(id), dang: LT.C[id].t, he: LT.C[id].h, mo_ta: moTa(id), thu: tests, tap_con: proper, khong_bao_gio: never, moi_noi: all });
}
/* nhóm "cho": engine đặt wait/w2/shuri khi lật, rồi xét ở cuối lượt sau/thẻ đặt kế tiếp tại chiến địa đó */
const CHO = [
  { id: "thantien", truong: "wait", luat: "end_delayed: thẻ chờ, G.ph[s][l] > 0 -> +4" },
  { id: "giapcuuho", truong: "wait", luat: "end_delayed: thẻ chờ, G.ph[s][l] > 0 -> +5" },
  { id: "tenthuong", truong: "w2", luat: "end_delayed: c.w2.t === lượt, G.ph[s][l] > 0 -> +w2.a" },
  { id: "congchuacongnghe", truong: "shuri", luat: "revealCard: thẻ đặt kế tiếp ở G.shuri[s]-1 -> nhân đôi sức mạnh" }
].map(o => Object.assign(o, { ten: ten(o.id), he: LT.C[o.id].h, mo_ta: moTa(o.id) }));

/* ---------- (2) phủ chiến địa ---------- */
function laneDiff(S0, id, li) {
  const once = sil => {
    const [S, c] = withCard(S0, id); S.q.a = []; S.energy.p = 99;
    if (!LT.queuePlay(S, "p", c.uid, li)) return null;
    const pre = new Map(); for (let k = 0; k < 3; k++) for (const s of ["p", "a"]) for (const x of S.locs[k].cards[s]) if (x.rev) pre.set(x.uid, [k, s]);
    if (sil) c.sil = true;
    const steps = LT.beginReveal(S);
    for (const st of steps) { LT.doStep(S, st); if (st.uid === c.uid && st.t === "play") break; }
    const l2 = LT.locOf(S, c);
    if (!sil && l2 >= 0 && c.rev && LT.END[LT.ab(c)]) LT.END[LT.ab(c)](S, c, l2);
    const st = new Map();
    for (const [u, [k, s]] of pre) { const f = LT.find(S, u); st.set(u, f ? [f.li, f.inst.side, LT.power(S, f.inst, f.li), f.inst.sil ? 1 : 0].join() : "x"); }
    return { st, pre };
  };
  const A = once(false), B = once(true); if (!A || !B) return null;
  const by = {}; /* by[lane][side] = [đổi, tổng] */
  for (const [u, [k, s]] of A.pre) { const o = (by[k] = by[k] || {}), e = (o[s] = o[s] || [0, 0]); e[1]++; if (A.st.get(u) !== B.st.get(u)) e[0]++; }
  return by;
}
const phu = [];
for (const id of cand) {
  let n = 0, both = 0, mine = 0, foe = 0, spill = 0;
  for (const S0 of SN) {
    /* chiến địa có ≥2 thẻ đã lật mỗi phía và còn chỗ cho phe ta */
    for (let li = 0; li < 3; li++) {
      const L = S0.locs[li]; if (L.gone || L.cards.p.filter(x => x.rev).length < 2 || L.cards.a.filter(x => x.rev).length < 2 || L.cards.p.length >= LT.cap(S0, li)) continue;
      const by = laneDiff(S0, id, li); if (!by || !by[li]) continue;
      n++;
      const full = s => by[li][s] && by[li][s][1] >= 2 && by[li][s][0] === by[li][s][1];
      if (full("p") && full("a")) both++; else if (full("a")) foe++; else if (full("p")) mine++;
      for (let k = 0; k < 3; k++) if (k !== li && by[k]) for (const s of ["p", "a"]) if (by[k][s] && by[k][s][1] >= 1 && by[k][s][0] === by[k][s][1]) { spill++; k = 3; break; }
      break;
    }
  }
  if (n < 4) continue;
  const hit = both + mine + foe;
  /* phủ: ≥60% số thế trận thử thì mọi thẻ (một/hai phía) ở chiến địa đó đều bị tác động; không lan trọn sang chiến địa khác quá 1/3 */
  if (hit >= n * 0.6 && spill <= n / 3) phu.push({ id, ten: ten(id), dang: LT.C[id].t, he: LT.C[id].h, mo_ta: moTa(id), pham_vi: both >= Math.max(mine, foe) ? "ca_hai" : foe >= mine ? "dich" : "ta", lien_tuc: LT.C[id].t === "on", thu: n, phu_kin: hit });
}

/* bổ sung theo MÃ engine (không theo chữ): kỹ năng Lật/Cuối Lượt duyệt MỌI thẻ đã lật của CẢ HAI phía ở chiến địa của nó
   (vòng "for (const s of SIDES) for (const c of shown(G, li, s))"), và Duy Trì áp lên cả chiến địa cho cả hai phía
   (hasOn(G, li, "p", X) || hasOn(G, li, "a", X) / hasOn(G, li, other(s), X) || hasOn(G, li, s, X)) hoặc nhân đôi tổng (locPowerRaw). */
const engSrc = readFileSync(path.join(root, "www", "js", "01-engine.js"), "utf8"), have = new Set(phu.map(o => o.id));
const addPhu = (id, lt, why) => { if (have.has(id) || !LT.C[id]) return; have.add(id); phu.push({ id, ten: ten(id), dang: LT.C[id].t, he: LT.C[id].h, mo_ta: moTa(id), pham_vi: "ca_hai", lien_tuc: lt, thu: 0, phu_kin: 0, theo_ma: why }); };
for (const [tbl, nm] of [[LT.REV, "REV"], [LT.END, "END"]]) for (const id in tbl) if (/for \(const s of SIDES\) for \(const c of shown\(G, li, s\)\)/.test(String(tbl[id]))) addPhu(id, false, nm + "." + id + ": duyệt mọi thẻ cả hai phía tại chiến địa");
for (const m of engSrc.matchAll(/hasOn\(G, li, "p", "(\w+)"\) \|\| hasOn\(G, li, "a", "\1"\)|hasOn\(G, li, other\(s\), "(\w+)"\) \|\| hasOn\(G, li, s, "\2"\)/g)) addPhu(m[1] || m[2], true, "luật chiến địa: hasOn(... cả hai phía ..., \"" + (m[1] || m[2]) + "\")");
if (/is\(G, c, "thietgiap"\)\) s \*= /.test(engSrc)) addPhu("thietgiap", true, "locPowerRaw: nhân đôi tổng sức mạnh của bạn tại chiến địa");

const out = {
  ghi_chu: "Sinh bởi tools/vfx_dieu_kien.mjs từ luật engine (LT.duDoanKichHoat + chạy lật trên bản sao). KHÔNG sửa tay.",
  so_the_ran: SN.length,
  dieu_kien: dk, cho: CHO, phu_chien_dia: phu
};
writeFileSync(path.join(here, "vfx_dieu_kien.json"), JSON.stringify(out, null, 1) + "\n");
/* khối VKD trong 13-fxr.js: danh sách id gọn cho trình duyệt */
const fxp = path.join(root, "www", "js", "13-fxr.js"); let src = readFileSync(fxp, "utf8");
const blk = `/*VKD:BAT_DAU — sinh tự động bởi tools/vfx_dieu_kien.mjs, KHÔNG sửa tay */\nconst VKD_DK=${JSON.stringify(dk.map(o => o.id))},VKD_CHO=${JSON.stringify(CHO.map(o => o.id))},VKD_PHU=${JSON.stringify(Object.fromEntries(phu.map(o => [o.id, (o.lien_tuc ? 1 : 0) + (o.pham_vi === "ca_hai" ? 0 : o.pham_vi === "dich" ? 2 : 4)])))};\n/*VKD:KET_THUC*/`;
if (/\/\*VKD:BAT_DAU[\s\S]*?\/\*VKD:KET_THUC\*\//.test(src)) src = src.replace(/\/\*VKD:BAT_DAU[\s\S]*?\/\*VKD:KET_THUC\*\//, blk);
else src = src.replace("/*FXT:KET_THUC*/", "/*FXT:KET_THUC*/\n" + blk);
writeFileSync(fxp, src);
console.log(`thế trận ${SN.length} · điều kiện ${dk.length} · chờ ${CHO.length} · phủ chiến địa ${phu.length}`);
