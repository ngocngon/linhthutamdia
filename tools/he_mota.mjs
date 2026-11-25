// gpu51: mô-đun THUẦN (chạy bằng node) dùng chung dữ liệu hệ / mô tả / kiểu đòn của trò chơi mà KHÔNG chép lại mã:
// đọc nguyên văn các khối trong www/js (01-engine C, 05-vfx-core MOTA/ELD/ELW/ELMAN/elOf/SIGV, 06 lhash, 09 CARD_STYLE/resolveStyle,
// 04a sfxFamOf) rồi chạy trong một hàm riêng -> kết quả luôn khớp đúng mã đang chạy trong trình duyệt, chỗ dùng cũ không đổi gì.
//   import { load } from "./he_mota.mjs"; const H = load(); H.elOf(id), H.elWhy(id) ("man"|"kw"|"text"|"hash"), H.styleOf(id, kind)
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)), js = f => readFileSync(path.join(here, "..", "www", "js", f), "utf8");

/* cắt khối mã từ dòng bắt đầu bằng `head` tới hết câu lệnh (đếm ngoặc, bỏ qua chuỗi) */
function block(src, head) {
  const i = src.indexOf(head);
  if (i < 0) throw new Error("không thấy khối: " + head);
  let d = 0, q = null, j = head.startsWith("function") ? src.indexOf("{", i) : i, seen = false;
  for (; j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === "\\") { j++; continue; } if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { q = ch; continue; }
    if (ch === "/" && src[j + 1] === "*") { j = src.indexOf("*/", j + 2) + 1; continue; }
    if (ch === "{" || ch === "(" || ch === "[") { d++; seen = true; }
    else if (ch === "}" || ch === ")" || ch === "]") { d--; if (d === 0 && seen) { j++; break; } }
  }
  if (src[j] === ";") j++;
  return src.slice(i, j);
}

/* cả dòng bắt đầu bằng `head` (khối có biểu thức chính quy chứa ngoặc) */
function line(src, head) { const i = src.indexOf(head); if (i < 0) throw new Error("không thấy dòng: " + head); const j = src.indexOf("\n", i); return src.slice(i, j < 0 ? src.length : j); }

let CACHE = null;
export function load() {
  if (CACHE) return CACHE;
  const m = { exports: {} };
  new Function("module", "exports", js("01-engine.js"))(m, m.exports);
  const C = m.exports.C;
  const fm = { exports: {} };
  new Function("module", "exports", js("04a-sfx-fam.js"))(fm, fm.exports);
  const v5 = js("05-vfx-core.js"), v6 = js("06-ui-match.js"), v9 = js("09-card-choreo.js");
  const parts = [
    block(v6, "function lhash("),
    block(v5, "const MOTA="), block(v5, "const ELD="), block(v5, "const ELW="), line(v5, "const ELR="), block(v5, "const ELMAN="), "const ELC={};",
    /* chỉ trong bản chạy ở node: đánh dấu thẻ rơi vào nhánh "băm" (tệp gốc không đổi) */
    block(v5, "function elOf(").replace(/\[lhash\(id\)%6\]/, "[(HASHED.add(id),lhash(id)%6)]"),
    block(v5, "const SIGV="),
    block(v9, "const CARD_STYLE = {"), block(v9, "function resolveStyle("),
    "return {lhash,MOTA,ELD,ELW,ELMAN,elOf,SIGV,CARD_STYLE,resolveStyle};"
  ].join("\n");
  const HASHED = new Set();
  const o = new Function("C", "HASHED", parts)(C, HASHED);
  for (const id in C) o.elOf(id); /* điền ELC + HASHED */
  const elWhy = id => o.ELMAN[id] ? "man" : HASHED.has(id) ? "hash" : (() => {
    /* có điểm từ khoá (tên/MOTA/mô tả) hay chỉ khớp quy tắc chữ trong mô tả */
    const t = [C[id].n, String(o.MOTA[id] || "").replace(/ánh sáng\s*:.*$/i, ""), C[id].x].join(" ").toLowerCase();
    for (const k in o.ELW) { const r = new RegExp(o.ELW && "(^|[^\\p{L}])(" + o.ELW[k].split(",").map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?=$|[^\\p{L}])", "iu"); if (r.test(t)) return "kw"; }
    return "text";
  })();
  CACHE = { C, ...o, HASHED, elWhy, sfxFamOf: fm.exports.sfxFamOf, styleOf: (id, k) => o.resolveStyle(id, k || null) };
  return CACHE;
}
