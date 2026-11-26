#!/usr/bin/env node
// Khôi phục D1 từ một bản sao tải ở /admin → "Sao lưu dữ liệu" → "Tải về" (tệp linhthu-*.json.gz).
//
//   node tools/khoi_phuc_saoluu.mjs <tệp.json.gz> [ra.sql] [--bang=users,saves]
//   cd server && npx wrangler d1 execute linhthu --remote --file=../ra.sql
//
// Tệp SQL XOÁ dữ liệu hiện có của các bảng được chọn rồi chèn lại đúng như bản sao.
// Trước khi chạy: tắt đăng ký ở /admin, báo người chơi, và tạo một bản "Sao lưu ngay" của hiện trạng.
// Không đưa tệp .json.gz hay .sql lên GitHub (chứa mật khẩu đã băm và IP người chơi).
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const args = process.argv.slice(2);
const vao = args.find((a) => !a.startsWith("--"));
const ra = args.filter((a) => !a.startsWith("--"))[1] || "khoi_phuc.sql";
const chon = (args.find((a) => a.startsWith("--bang=")) || "").slice(7).split(",").filter(Boolean);
if (!vao) { console.error("Cách dùng: node tools/khoi_phuc_saoluu.mjs <tệp.json.gz> [ra.sql] [--bang=a,b]"); process.exit(1); }

const d = JSON.parse(gunzipSync(readFileSync(vao)).toString("utf8"));
if (d.v !== 1 || !d.tables) { console.error("Không phải bản sao Linh Thú (v1)."); process.exit(1); }

const q = (v) => v === null || v === undefined ? "NULL" : typeof v === "number" ? (Number.isFinite(v) ? String(v) : "NULL") : "'" + String(v).replace(/'/g, "''") + "'";
const id = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const bang = Object.keys(d.tables).filter((t) => !chon.length || chon.includes(t));
const out = ["-- Khôi phục từ bản sao " + new Date(d.t).toISOString(), "PRAGMA defer_foreign_keys = true;"];
let tong = 0;
for (const t of bang) {
  const rows = d.tables[t];
  out.push(`DELETE FROM ${id(t)};`);
  for (const r of rows) {
    const cols = Object.keys(r);
    out.push(`INSERT INTO ${id(t)} (${cols.map(id).join(",")}) VALUES (${cols.map((c) => q(r[c])).join(",")});`);
  }
  tong += rows.length;
  console.log(`  ${t}: ${rows.length} dòng`);
}
writeFileSync(ra, out.join("\n") + "\n");
console.log(`Đã ghi ${ra}: ${bang.length} bảng, ${tong} dòng (bản sao lúc ${new Date(d.t).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}).`);
