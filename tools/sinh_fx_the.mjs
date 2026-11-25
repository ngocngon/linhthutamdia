// gpu51: sinh BẢNG CẤU HÌNH HIỆU ỨNG TỪNG THẺ (FXT) cho bộ phát FXR (www/js/13-fxr.js), từ dữ liệu thẻ thật:
//   hệ (elOf), mô-típ đòn (resolveStyle của 09 theo MOTA), màu phụ, quỹ đạo, bậc, tình huống thẻ có thể gây ra, ấn ký, tiếng riêng.
// + bảng ghi đè tay tools/fx_ghi_de.json ({id: {e, m, c2, q}}), ưu tiên hơn số tự sinh.
//   node tools/sinh_fx_the.mjs          -> ghi khối FXT trong www/js/13-fxr.js + tools/fx_he_ra_tay.txt (thẻ xếp hệ theo băm/quy tắc phụ cần rà tay)
//   node tools/sinh_fx_the.mjs --kiem   -> chỉ kiểm, không ghi (thoát 1 nếu khối trong 13-fxr.js lệch dữ liệu)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "./he_mota.mjs";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, "..");
const H = load(), C = H.C, ids = Object.keys(C).sort();
const EL13 = ["lua", "bang", "sam", "doc", "toi", "sang", "gio", "dat", "nuoc", "mau", "cokhi", "hon", "moc"];
/* mô-típ: các kiểu đòn của 09 (resolveStyle) — thứ tự cố định, chỉ thêm vào cuối */
const MOT = ["slash_cleave", "throw_daggers", "throw_cards", "shoot_royal_bow", "shoot_venom_bow", "shoot_cannon", "melee_fist", "water_fist", "arena_ko",
  "sky_hammer", "forge_strike", "yama_judge", "claw_rip", "beast_bite", "beast_devour", "venom_hex", "mystic_seal", "talisman_summon", "kite_summon",
  "mirror_copy", "feather_copy", "persimmon_gift", "banyan_steal", "goblin_flip", "destroyer_beam", "shield_bash"];
/* màu phụ: [màu phụ của hệ, trắng, màu bậc (S5 vàng / S4 tím / khác vàng), bổ sắc của hệ] — 13-fxr.js đọc lại từ khối sinh ra */
const C2X = { lua: "#ff3d8a", bang: "#b08cff", sam: "#ff9a2b", doc: "#ffe04a", toi: "#5ad0ff", sang: "#ff9a4d", gio: "#fff2a8", dat: "#7dde5a", nuoc: "#7dffb0", mau: "#ffd27a", cokhi: "#5ad0ff", hon: "#ff7ac0", moc: "#ffd65a" };
const TIERC = { 5: "#ffd65a", 4: "#c77dff" };
const col2 = (e, t, i) => [H.ELD[e][1], "#ffffff", TIERC[t] || "#ffd65a", C2X[e]][i].toLowerCase();
/* tình huống (bit) — trùng tên với FXR.SIT trong 13-fxr.js */
const SIT = ["tang", "giam", "ung", "x2", "nl", "gia", "huy", "vut", "kich", "trieu", "tao", "hoi", "chan"];
const theIdx = JSON.parse(readFileSync(path.join(root, "www", "sfx", "the.json"), "utf8"));
const ghiDeF = path.join(here, "fx_ghi_de.json");
if (!existsSync(ghiDeF)) writeFileSync(ghiDeF, JSON.stringify({ _ghi_chu: "Ghi đè tay cấu hình hiệu ứng thẻ (gpu51): {id: {e: hệ trong 13 hệ, m: mô-típ (tên kiểu đòn 09), c2: 0-3 màu phụ, q: 0-2 quỹ đạo (cong trái/cong phải/thẳng)}}. Sau khi sửa: node tools/sinh_fx_the.mjs", the: {} }, null, 1) + "\n");
const GD = JSON.parse(readFileSync(ghiDeF, "utf8")).the || {};

/* tình huống thẻ có thể GÂY RA (suy từ loại kích hoạt, họ âm thanh, mô tả); thẻ nào cũng CHỊU được huy/vut/chan */
function sitsOf(id) {
  const d = C[id], x = String(d.x || "").toLowerCase(), f = H.sfxFamOf(d) || "", s = new Set(["huy", "vut", "chan"]);
  if (d.t === "act") s.add("kich");
  if (/\+\s?\d+\s*sức mạnh|tăng.*sức mạnh|được \+|có thêm \+|\+\d/.test(x) || /^up/.test(f)) s.add(d.t === "on" || d.t === "pas" ? "ung" : "tang");
  if (/(−|-)\s?\d+\s*sức mạnh|giảm.*sức mạnh|(−|-)\d/.test(x) || /^dn/.test(f)) s.add("giam");
  if (/nhân đôi|gấp đôi/.test(x) || f === "dbl") s.add("x2");
  if (/năng lượng/.test(x) || f === "egain" || f === "energy" || f === "nrgloss") s.add("nl");
  if (/tốn|giá/.test(x) || f === "costdn" || f === "costup") s.add("gia");
  if (/tiêu huỷ|tiêu hủy/.test(x)) s.add("huy");
  if (/vứt/.test(x)) s.add("vut");
  if (/triệu hồi|thêm .* (tại|vào) (đây|chiến địa)|đặt .* tại/.test(x) || f === "summon") s.add("trieu");
  if (/vào tay|tạo|bản sao|thêm .* vào (tay|bộ bài)/.test(x) || f === "create" || f === "deckadd") s.add("tao");
  if (/hồi sinh/.test(x) || f === "revive") s.add("hoi");
  if (d.t === "on" || d.t === "pas") s.add("ung");
  let m = 0; for (const k of s) m |= 1 << SIT.indexOf(k);
  return m;
}
const tierOf = d => (d.h === "S5" || d.h === "MP" ? 5 : d.h === "S4" ? 4 : d.h === "S3" ? 3 : d.h === "PH" ? 0 : 1);

/* chữ ký (hệ, mô-típ, màu phụ, quỹ đạo, nhịp): mỗi thẻ một tổ hợp khác — chọn (c2,q,nh) theo băm, tránh trùng */
const used = new Set(), rows = [], review = [];
for (const id of ids) {
  const d = C[id], g = GD[id] || {};
  const e = g.e || H.elOf(id), why = g.e ? "tay" : H.elWhy(id);
  let m = g.m || H.styleOf(id, null); if (MOT.indexOf(m) < 0) m = "mystic_seal";
  const h = H.lhash(id + "#fx"), t = tierOf(d), key = (c2, q, nh) => [e, m, col2(e, t, c2), q, nh].join();
  let c2 = g.c2 != null ? g.c2 : (h >>> 3) % 4, q = g.q != null ? g.q : (h >>> 7) % 3, nh = (h >>> 11) % 2;
  /* 24 tổ hợp (màu phụ 4 × quỹ đạo 3 × nhịp 2) cho mỗi (hệ, mô-típ); bắt đầu từ vị trí băm của thẻ */
  if (g.c2 == null && g.q == null) for (let k = 0; k < 24 && used.has(key(c2, q, nh)); k++) { const z = ((h >>> 3) + k) % 24; c2 = z % 4; q = Math.floor(z / 4) % 3; nh = z >= 12 ? 1 : 0; }
  used.add(key(c2, q, nh));
  const em = t >= 4 ? (H.SIGV[id] ? 2 : 1) : (H.SIGV[id] ? 2 : 0), snd = theIdx[id] ? 1 : 0;
  rows.push([id, EL13.indexOf(e), MOT.indexOf(m), c2, q, nh, t, sitsOf(id), em, snd, why]);
  if (why === "hash" || why === "text") review.push(`${id}\t${d.h}\t${d.n}\thệ=${e}\t(${why === "hash" ? "băm" : "quy tắc chữ"})\t${String(d.x || "").slice(0, 90)}`);
}
const WHY = { man: 0, kw: 1, text: 2, hash: 3, tay: 4 };
/* khối mã: chuỗi gọn "id:e,m,c2,q,nh,t,p,em,s,w;" (giải mã trong 13-fxr.js) */
const data = rows.map(r => r[0] + ":" + r.slice(1, 10).join(",") + "," + WHY[r[10]]).join(";");
const blk = `/*FXT:BAT_DAU — sinh tự động bởi tools/sinh_fx_the.mjs, KHÔNG sửa tay (ghi đè: tools/fx_ghi_de.json) */\n` +
  `const FXT_EL=${JSON.stringify(EL13)},FXT_MOT=${JSON.stringify(MOT)},FXT_SIT=${JSON.stringify(SIT)},FXT_N=${rows.length},FXT_C2X=${JSON.stringify(C2X)},FXT_TIERC=${JSON.stringify(TIERC)};\n` +
  `const FXT_RAW="${data}";\n/*FXT:KET_THUC*/`;
const f13 = path.join(root, "www", "js", "13-fxr.js"), src = readFileSync(f13, "utf8");
const re = /\/\*FXT:BAT_DAU[\s\S]*?\/\*FXT:KET_THUC\*\//;
if (!re.test(src)) { console.error("13-fxr.js thiếu khối /*FXT:BAT_DAU … FXT:KET_THUC*/"); process.exit(2); }
const out = src.replace(re, () => blk);
const sig = new Set(rows.map(r => [r[1], r[2], col2(EL13[r[1]], r[6], r[3]), r[4], r[5]].join())).size;
console.log(`${rows.length} thẻ; chữ ký khác nhau: ${sig}; theo hệ: ` + EL13.map((e, i) => e + " " + rows.filter(r => r[1] === i).length).join(", "));
console.log(`nguồn hệ: tay ${rows.filter(r => r[10] === "tay").length}, bảng ELMAN ${rows.filter(r => r[10] === "man").length}, từ khoá ${rows.filter(r => r[10] === "kw").length}, quy tắc chữ ${rows.filter(r => r[10] === "text").length}, băm ${rows.filter(r => r[10] === "hash").length} -> cần rà tay: ${review.length} (tools/fx_he_ra_tay.txt)`);
if (process.argv.includes("--kiem")) { if (out !== src) { console.error("khối FXT trong 13-fxr.js LỆCH dữ liệu thẻ -> chạy lại node tools/sinh_fx_the.mjs"); process.exit(1); } console.log("khối FXT khớp"); process.exit(0); }
writeFileSync(f13, out);
/* mẫu chỉ mục atlas cho đợt vẽ ảnh: www/img/fx/fx.json dùng đúng định dạng này (chỉ chép tấm nào ĐÃ có tệp .webp vào "tam") */
{
  const PROTO = [["L01_tang", "tang"], ["L03_huy", "huy"], ["L04_vut", "vut"], ["L05_trieu", "trieu"], ["L06_hoi", "hoi"], ["L07_giam", "giam"], ["L08_kich", "kich"], ["L09_tao", "tao"]];
  const tam = PROTO.map(([f, k]) => ({ f: f + ".webp", n: 4, k: [...EL13.map(e => k + "_" + e), k + "_tr", k + "_s4", k + "_s5"] }));
  tam.splice(1, 0, { f: "L02_bieutuong.webp", n: 4, k: ["ic_dongho", "ic_dongho2", "ic_ngoc", "ic_ngocvo", "ic_ngocxuong", "ic_ngoclen", "ic_tim", "ic_sen", "ic_khien", "ic_xich", "ic_giay", "ic_cong", "ic_la", "ic_labang", "ic_chuong", "ic_holo"] });
  const em = rows.filter(r => r[6] >= 4 && r[8] === 1).map(r => r[0]); /* S4/S5 chưa có chiêu v16 riêng (SIGV) */
  for (let i = 0; i < em.length; i += 16) { const k = em.slice(i, i + 16).map(id => "em_" + id); while (k.length < 16) k.push(""); tam.push({ f: `L${String(11 + i / 16).padStart(2, "0")}_anky.webp`, n: 4, k }); }
  writeFileSync(path.join(here, "fx_atlas_mau.json"), JSON.stringify({ _ghi_chu: "gpu51: MẪU chỉ mục atlas cho bộ phát FXR (www/js/13-fxr.js). Mỗi tấm vuông n×n ô (768², ô 192px), ô theo hàng trái->phải, trên->xuống; \"\" = ô trống. Mã ô: <nguyên mẫu>_<hệ> | <nguyên mẫu>_tr/_s4/_s5 (trung tính / Bậc 4 / Bậc 5) | ic_<biểu tượng> | em_<id thẻ> (ấn ký S4/S5). Khi có ảnh: đặt www/img/fx/<f> rồi chép mục tương ứng vào \"tam\" của www/img/fx/fx.json; thiếu tệp -> hình dự phòng SVG.", v: 1, tam }, null, 1) + "\n");
  console.log(`mẫu atlas: ${tam.length} tấm (${PROTO.length} nguyên mẫu × 13 hệ + 3, 1 biểu tượng, ${Math.ceil(em.length / 16)} ấn ký cho ${em.length} thẻ S4/S5) -> tools/fx_atlas_mau.json`);
}
writeFileSync(path.join(here, "fx_he_ra_tay.txt"), [
  '# gpu51: thẻ có hệ xếp theo BĂM hoặc QUY TẮC CHỮ phụ (không khớp từ khoá tên/MOTA) — rà tay, sửa trong tools/fx_ghi_de.json {"the":{id:{"e":"<hệ>"}}}',
  "# id\tbậc\ttên\thệ hiện tại\tnguồn\tmô tả",
  ...review
].join("\n") + "\n");
console.log("đã ghi khối FXT vào www/js/13-fxr.js");
