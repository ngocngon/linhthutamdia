// Sinh src/engine.gen.js: bộ máy luật của game (www/js/01-engine.js) bọc thành ES module cho Worker.
// Máy chủ chạy ĐÚNG bộ luật client đang dùng (trận online do máy chủ giữ trạng thái). Đừng sửa tay file sinh ra.
// Chạy lại mỗi khi sửa 01-engine.js: node scripts/gen-engine.mjs   (kiểm tra: node scripts/gen-engine.mjs --check)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const src = readFileSync(new URL("../../www/js/01-engine.js", import.meta.url), "utf8");
const sha = createHash("sha256").update(src).digest("hex").slice(0, 16);
export const OUT = "// TỰ SINH bởi scripts/gen-engine.mjs từ www/js/01-engine.js (sha256 " + sha + ") — đừng sửa tay.\n" +
  "const module = { exports: {} };\n" + src + "\nexport const ENGINE_SHA = " + JSON.stringify(sha) + ";\nexport default module.exports;\n";
const dst = new URL("../src/engine.gen.js", import.meta.url);
if (process.argv.includes("--check")) {
  const cur = existsSync(dst) ? readFileSync(dst, "utf8") : "";
  if (cur !== OUT) { console.error("server/src/engine.gen.js CŨ so với www/js/01-engine.js — chạy: node server/scripts/gen-engine.mjs"); process.exit(1); }
  console.log("engine.gen.js khớp 01-engine.js (" + sha + ")");
} else { writeFileSync(dst, OUT); console.log("đã ghi src/engine.gen.js (" + sha + ", " + Math.round(OUT.length / 1024) + " KB)"); }
