// Sao lưu D1 hằng tuần vào KV (binding BACKUP, namespace "linhthu-saoluu" — riêng tư, chỉ Worker đọc được).
// - Cron (wrangler.toml [triggers]) gọi taoSaoLuu() mỗi tuần; quản trị có thể tạo tay ở /admin.
// - Mỗi bản: JSON {v, t, tables:{ten:[hàng…]}} nén gzip, khoá "saoluu/<ISO thời điểm>", giữ GIU bản mới nhất.
// - Không bao giờ đưa bản sao lên GitHub: nó chứa mật khẩu đã băm và IP người chơi.
// - Khôi phục: tải bản sao ở /admin rồi chạy tools/khoi_phuc_saoluu.mjs (sinh tệp SQL cho `wrangler d1 execute`).

export const GIU = 12;
const TIEN_TO = "saoluu/";
const GIOI_HAN = 24 * 1024 * 1024; // KV tối đa 25 MiB/giá trị

async function danhSachBang(env) {
  const r = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'd1_%' ORDER BY name",
  ).all();
  return (r.results || []).map((x) => x.name);
}

async function nen(text) {
  const s = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

export async function taoSaoLuu(env, now = Date.now(), nguon = "cron") {
  if (!env.BACKUP) throw new Error("thiếu binding BACKUP");
  const bang = await danhSachBang(env);
  const out = { v: 1, t: now, tables: {} };
  const soHang = {};
  for (const ten of bang) {
    const rows = (await env.DB.prepare(`SELECT * FROM "${ten.replace(/"/g, '""')}"`).all()).results || [];
    out.tables[ten] = rows;
    soHang[ten] = rows.length;
  }
  const json = JSON.stringify(out);
  const gz = await nen(json);
  if (gz.byteLength > GIOI_HAN) throw new Error(`bản sao quá lớn cho KV: ${gz.byteLength} byte`);
  const key = TIEN_TO + new Date(now).toISOString();
  const meta = { t: now, nguon, json: json.length, gz: gz.byteLength, bang: bang.length, hang: Object.values(soHang).reduce((a, b) => a + b, 0) };
  await env.BACKUP.put(key, gz, { metadata: meta });
  const xoa = await donDep(env);
  return { key, ...meta, soHang, xoa };
}

export async function danhSachSaoLuu(env) {
  if (!env.BACKUP) return [];
  const items = [];
  let cursor;
  do {
    const r = await env.BACKUP.list({ prefix: TIEN_TO, cursor });
    for (const k of r.keys) items.push({ key: k.name, ...(k.metadata || {}) });
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);
  return items.sort((a, b) => (a.key < b.key ? 1 : -1)); // mới nhất trước
}

async function donDep(env) {
  const ds = await danhSachSaoLuu(env);
  const cu = ds.slice(GIU);
  for (const x of cu) await env.BACKUP.delete(x.key);
  return cu.length;
}

export async function taiSaoLuu(env, key) {
  if (!env.BACKUP || !key.startsWith(TIEN_TO) || key.includes("..")) return null;
  return env.BACKUP.get(key, { type: "arrayBuffer" });
}
