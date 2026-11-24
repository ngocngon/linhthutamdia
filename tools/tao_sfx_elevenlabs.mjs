// Tạo SFX bằng ElevenLabs Sound Effects API theo danh sách tools/sfx_ds.json.
// Khoá API: biến môi trường ELEVENLABS_API_KEY, hoặc tệp ghi trong ELEVENLABS_KEY_FILE (mặc định ~/.secrets/elevenlabs_key).
// KHÔNG ghi khoá vào repo / log.
//   node tools/tao_sfx_elevenlabs.mjs <thư_mục_ra> [tên ...] [--du-phong=1000] [--thu]
//   --thu: chỉ in danh sách + ước tính credit, không gọi API.
// Bỏ qua tệp đã có (chạy lại an toàn). Dừng khi credit còn lại dưới mức dự phòng.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), flags = Object.fromEntries(args.filter(a => a.startsWith("--")).map(a => { const [k, v] = a.slice(2).split("="); return [k, v ?? "1"]; }));
const pos = args.filter(a => !a.startsWith("--")), out = pos[0], only = new Set(pos.slice(1));
if (!out) { console.error("cần thư mục ra"); process.exit(2); }
const RESERVE = +(flags["du-phong"] || 1000), PER_SEC = 40;
const ds = JSON.parse(readFileSync(path.join(here, "sfx_ds.json"), "utf8")).list.filter(x => !only.size || only.has(x.k));
const jobs = ds.flatMap(x => Array.from({ length: x.n || 1 }, (_, i) => ({ ...x, i, f: path.join(out, `${x.k}_${i}.mp3`) })));
const est = jobs.reduce((s, j) => s + j.d * PER_SEC, 0);
console.log(`${ds.length} tiếng, ${jobs.length} lần tạo, ước tính ${est.toFixed(0)} credit (${PER_SEC}/giây)`);
if (flags.thu) process.exit(0);
const key = (process.env.ELEVENLABS_API_KEY || readFileSync(process.env.ELEVENLABS_KEY_FILE || path.join(homedir(), ".secrets", "elevenlabs_key"), "utf8")).trim();
const H = { "xi-api-key": key };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// số credit báo về có độ trễ và endpoint dễ bị giới hạn tần suất (429): đọc thưa, lỗi thì giữ số cũ
async function credit(old) { for (let k = 0; k < 3; k++) { const r = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: H }); if (r.ok) { const j = await r.json(); return j.character_limit - j.character_count; } await sleep(3000 * (k + 1)); } if (old == null) throw new Error("không đọc được credit"); return old; }
mkdirSync(out, { recursive: true });
let left = await credit(); console.log("credit còn:", left);
const EST = 15; // ước tính bảo thủ (đo thực tế ~10 credit/giây) để trừ dần giữa các lần đọc
let done = 0;
for (const j of jobs) {
  if (existsSync(j.f)) continue;
  if (left - j.d * PER_SEC * 1.5 < RESERVE) { console.log("dừng: sắp chạm mức dự phòng", left); break; }
  let r;
  for (let k = 0; k < 4; k++) { r = await fetch("https://api.elevenlabs.io/v1/sound-generation", { method: "POST", headers: { ...H, "content-type": "application/json" }, body: JSON.stringify({ text: j.t, duration_seconds: j.d, prompt_influence: j.p ?? 0.5 }) }); if (r.status !== 429) break; await sleep(5000 * (k + 1)); }
  if (!r.ok) { console.log("lỗi", j.k, j.i, r.status, (await r.text()).slice(0, 200)); if (r.status === 401 || r.status === 402) break; continue; }
  writeFileSync(j.f, Buffer.from(await r.arrayBuffer()));
  left -= j.d * EST;
  if (++done % 10 === 0) left = Math.min(left, await credit(left));
  console.log(`${j.k}_${j.i}\t${j.d}s\tcòn ~${Math.round(left)}`);
}
await sleep(5000); console.log("xong, credit còn (API, có thể trễ):", await credit(left), " ước tính:", Math.round(left));
