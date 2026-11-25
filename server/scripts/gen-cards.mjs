// Sinh src/cards.js (id → [tên, năng lượng, sức mạnh, nhóm]) từ danh sách thẻ của game, để trang quản trị hiện tên thẻ.
// Chỉ ĐỌC www/js/01-engine.js. Chạy lại khi game thêm/đổi thẻ: node scripts/gen-cards.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../..", import.meta.url));
const src = readFileSync(root + "www/js/01-engine.js", "utf8");
const start = src.indexOf("const RAW = [");
const end = src.indexOf("\n];", start);
const rows = JSON.parse(src.slice(start + "const RAW = ".length, end + 2).replace(/,\s*\]$/, "]"));
const out = {};
for (const r of rows) if (r[6] !== "PH") out[r[0]] = [r[1], r[3], r[4], r[6]];
writeFileSync(new URL("../src/cards.js", import.meta.url), "// TỰ SINH bởi scripts/gen-cards.mjs từ www/js/01-engine.js — đừng sửa tay.\nexport const CARDS = " + JSON.stringify(out) + ";\n");
console.log("đã ghi", Object.keys(out).length, "thẻ");
