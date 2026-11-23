// Cần: thư mục src/<tên>.wav (cắt từ sfx.mp3 theo sfx.json, mono 44,1 kHz) và ffmpeg có rubberband. Chạy trong thư mục chứa src/. Kết quả: sfx2.mp3 + sfx2.json -> chép vào www/sfx/.
// Tạo sprite sfx2 hoàn toàn offline bằng ffmpeg từ các mẫu ElevenLabs có sẵn (không tốn credit).
import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
mkdirSync("new", { recursive: true });
const SR = 44100;
// Mỗi bước: [nguồn, {p: tỉ lệ cao độ, rev, lp, hp, d: trễ(s), v: dB, t: cắt(s), ss: bắt đầu(s), fi, fo}]
const R = {
  /* ---- LẬT THẺ: 3 thân lật + bản mỏng + 3 lớp theo bậc + bản gộp ---- */
  rv_a: [["flip", { p: 1.12, lp: 9000 }], ["pick", { p: .8, d: 0.01, v: -3 }], ["place", { p: 1.3, d: .13, v: -9, t: .1 }]],
  rv_b: [["flip", { p: .88, hp: 120 }], ["draw", { p: 1.25, v: -6, d: 0 }], ["tap", { p: .7, d: .1, v: -4 }]],
  rv_c: [["flip", { p: 1.28, hp: 500, t: .3 }], ["place", { p: .75, d: .11, v: -3 }], ["unplay", { p: 1.4, v: -10, d: .02, t: .15 }]],
  rv_soft: [["flip", { p: 1.4, hp: 1400, t: .22, fo: .08, v: -2 }]],
  rv_t3: [["flip", { p: .95, t: .3 }], ["chime", { p: 1.0, d: .08, t: .55, fo: .25, v: -4 }], ["e_sang", { p: 1.25, d: .1, t: .5, fo: .2, v: -9 }]],
  rv_t4: [["flip", { p: .9, t: .3 }], ["e_sang", { p: 1.5, d: .06, t: .7, fo: .3, v: -5 }], ["chime", { p: 1.5, d: .14, t: .75, fo: .3, v: -5 }], ["buff", { p: 1.2, rev: 1, d: 0, t: .45, v: -10 }], ["place", { p: .65, d: .2, v: -6 }]],
  rv_t5: [["boom", { p: .72, t: 1.1, fo: .5, v: -3 }], ["horn", { p: .85, d: .05, t: 1.2, fo: .5, v: -9 }], ["chime", { p: .7, d: .12, t: 1.4, fo: .6, v: -5 }], ["gavel", { p: .8, d: .0, v: -4 }], ["e_sang", { p: 1.0, d: .15, t: 1.2, fo: .5, v: -8 }], ["flip", { p: .8, d: 0, v: -6, t: .3 }]],
  rv_cas: [["flip", { p: .95, t: .22, v: -3 }], ["flip", { p: 1.1, d: .09, t: .22, v: -3 }], ["flip", { p: 1.26, d: .18, t: .22, v: -2 }], ["chime", { p: 1.1, d: .2, t: .6, fo: .3, v: -7 }], ["place", { p: .8, d: .21, v: -5 }]],
  /* ---- HỌ KỸ NĂNG MỚI ---- */
  f_create: [["chime", { p: 1.0, rev: 1, t: .5, v: -3 }], ["summon", { p: 1.35, d: .45, t: .6, fo: .2, v: -3 }], ["e_sang", { p: 1.3, d: .5, t: .45, fo: .2, v: -9 }]],
  f_shuffle: [...[0, 1, 2, 3, 4, 5].map(i => ["draw", { p: 1 + (i % 3) * .12, d: i * .055, t: .09, v: -4 + (i % 2) * 2 }]), ["tap", { p: .8, d: .36, v: -3 }]],
  f_bounce: [["move", { p: 1.15, rev: 1, v: -2 }], ["pick", { p: 1.1, d: .32, v: -3 }], ["draw", { p: 1.3, d: .3, v: -9, t: .2 }]],
  f_swap: [["move", { p: 1.25, v: -2 }], ["move", { p: .85, rev: 1, d: .14, v: -2 }], ["whoosh", { p: 1.0, d: .05, v: -9 }]],
  f_exile: [["destroy", { p: .85, rev: 1, lp: 3000, v: -2 }], ["dark", { p: .7, d: .5, t: .8, fo: .3, v: -4 }], ["silence", { p: .6, d: .55, t: .6, fo: .3, v: -9 }]],
  f_lock: [["chain", { p: .75, v: -2 }], ["gavel", { p: 1.5, d: .3, v: -2 }], ["horn", { p: 1.3, d: .31, t: .35, fo: .2, v: -12 }]],
  f_copy: [["e_hon", { p: 1.0, t: .6, fo: .2, v: -3 }], ["e_hon", { p: 1.5, d: .13, t: .6, fo: .25, v: -5 }], ["chime", { p: 1.2, d: .24, t: .7, fo: .3, v: -8 }]],
  f_pull: [["magnet", { p: .9, rev: 1, v: -2 }], ["whoosh", { p: .6, d: .1, v: -5 }], ["draw", { p: .9, d: .5, v: -3 }]],
  f_absorb: [["morph", { p: .8, rev: 1, lp: 4000, v: -2 }], ["energy", { p: .75, d: .28, t: .6, fo: .3, v: -4 }], ["boom", { p: 1.4, d: .45, t: .3, fo: .2, v: -11 }]],
  f_costdn: [["energy", { p: 1.4, t: .13, fo: .03, v: -3 }], ["energy", { p: 1.15, d: .14, t: .13, fo: .03, v: -3 }], ["energy", { p: .9, d: .28, t: .35, fo: .2, v: -3 }]],
  f_costup: [["energy", { p: .9, t: .13, fo: .03, v: -3 }], ["energy", { p: 1.15, d: .14, t: .13, fo: .03, v: -3 }], ["energy", { p: 1.5, d: .28, t: .45, fo: .25, v: -3 }]],
  f_bigup: [["buff", { p: .75, v: -2 }], ["boom", { p: .85, d: .0, t: .8, fo: .3, v: -8 }], ["chime", { p: 1.4, d: .16, t: .8, fo: .35, v: -6 }], ["double", { p: 1.1, d: .1, t: .7, fo: .3, v: -9 }]],
  f_bigdn: [["debuff", { p: .7, v: -2 }], ["dark", { p: .9, d: .05, t: .8, fo: .3, v: -5 }], ["boom", { p: .6, d: .05, t: .9, fo: .4, v: -7 }]],
  f_smallup: [["buff", { p: 1.45, t: .4, fo: .15, v: -2 }], ["tap", { p: 1.6, d: .06, v: -6 }]],
  f_smalldn: [["hurt", { p: 1.3, t: .4, fo: .15, v: -2 }], ["tap", { p: .6, d: .02, v: -6 }]],
  f_afflict: [["loc", { p: .9, hp: 250, t: .9, fo: .3, v: -3 }], ["silence", { p: 1.1, d: .08, t: .7, fo: .3, v: -5 }], ["e_toi", { p: 1.4, hp: 600, d: .2, t: .6, fo: .3, v: -7 }]],
  f_xform: [["loc", { p: 1.0, rev: 1, v: -3 }], ["morph", { p: .9, d: .5, v: -4 }], ["whoosh", { p: .8, d: .45, v: -8 }]],
  f_locup: [["loc", { p: 1.35, t: .8, fo: .3, v: -4 }], ["chime", { p: 1.1, d: .12, t: .8, fo: .3, v: -5 }], ["shield", { p: 1.25, d: .2, t: .6, fo: .3, v: -9 }]],
  f_aura: [["shield", { p: 1.2, t: .55, fo: .3, v: -3 }], ["e_hon", { p: .8, d: .05, t: .55, fo: .3, v: -8 }]],
  f_end: [["chime", { p: .8, t: .8, fo: .4, v: -3 }], ["tick", { p: .75, d: .02, t: .25, v: -7 }]],
  f_deckadd: [["draw", { p: .8, rev: 1, v: -3 }], ["place", { p: .75, d: .22, v: -4 }], ["whoosh", { p: 1.1, d: .05, t: .25, v: -10 }]],
  f_block: [["shield", { p: 1.5, t: .35, fo: .12, v: -3 }], ["slash", { p: .6, d: .0, v: -5 }], ["tap", { p: 1.8, d: .02, v: -8 }]],
  f_dbl: [["double", { p: 1.0, v: -2 }], ["double", { p: 1.5, d: .12, t: .5, fo: .2, v: -6 }], ["boom", { p: 1.2, d: .0, t: .4, fo: .2, v: -9 }]],
  f_energy2: [["energy", { p: 1.25, v: -2 }], ["chime", { p: 1.6, d: .1, t: .5, fo: .2, v: -8 }]],
  f_nrg_loss: [["energy", { p: .8, rev: 1, v: -3 }], ["tick", { p: .6, d: .45, t: .2, v: -6 }]],
  f_reveal_loc: [["loc", { p: 1.0, v: -3 }], ["gavel", { p: 1.1, d: .15, v: -6 }], ["e_sang", { p: .9, d: .2, t: .6, fo: .3, v: -10 }]],
};
function chain(o) {
  const f = [];
  if (o.ss != null || o.t != null) f.push(`atrim=start=${o.ss || 0}${o.t != null ? ":duration=" + o.t : ""}`, "asetpts=PTS-STARTPTS");
  if (o.p && o.p !== 1) f.push(`rubberband=pitch=${o.p}:transients=crisp`);
  if (o.rev) f.push("areverse");
  if (o.hp) f.push(`highpass=f=${o.hp}`);
  if (o.lp) f.push(`lowpass=f=${o.lp}`);
  if (o.fo) f.push(`afade=t=out:st=${Math.max(0, ((o.t != null ? o.t : 5) / 1) - o.fo)}:d=${o.fo}`);
  if (o.fi) f.push(`afade=t=in:d=${o.fi}`);
  if (o.v) f.push(`volume=${o.v}dB`);
  if (o.d) f.push(`adelay=${Math.round(o.d * 1000)}:all=1`);
  return f.length ? f.join(",") : "anull";
}
const out = {};
for (const [name, steps] of Object.entries(R)) {
  const args = ["-v", "error", "-y"];
  steps.forEach(([s]) => args.push("-i", `src/${s}.wav`));
  const parts = steps.map(([, o], i) => `[${i}:a]${chain(o)}[a${i}]`);
  const mix = `${steps.map((_, i) => `[a${i}]`).join("")}amix=inputs=${steps.length}:normalize=0:duration=longest,alimiter=limit=0.95:level=0[m]`;
  args.push("-filter_complex", parts.concat(mix).join(";"), "-map", "[m]", "-ac", "1", "-ar", String(SR), `new/${name}.raw.wav`);
  execFileSync("ffmpeg", args);
  // chuẩn hoá đỉnh về -2.5 dBFS, cắt đuôi lặng
  const vd = execSync(`ffmpeg -nostats -i new/${name}.raw.wav -af volumedetect -f null - 2>&1 | grep max_volume`).toString();
  const mx = parseFloat(/max_volume: (-?[\d.]+)/.exec(vd)[1]);
  const gain = (-2.5 - mx).toFixed(2);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `new/${name}.raw.wav`, "-af", `volume=${gain}dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,afade=t=in:d=0.012,areverse`, `new/${name}.wav`]);
  out[name] = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 new/${name}.wav`).toString());
}
console.log(JSON.stringify(out));
// ghép sprite: 50ms đầu lặng, mỗi mẫu cách nhau 120ms
let t = 0.05; const idx = {}; const list = ["-f", "lavfi", "-t", "0.05", "-i", `anullsrc=r=${SR}:cl=mono`];
const names = Object.keys(R); const ins = [];
names.forEach(n => { idx[n] = [+t.toFixed(3), +out[n].toFixed(3)]; t += out[n] + 0.12; });
const args = ["-v", "error", "-y", ...list];
names.forEach(n => args.push("-i", `new/${n}.wav`, "-f", "lavfi", "-t", "0.12", "-i", `anullsrc=r=${SR}:cl=mono`));
const labels = ["[0:a]"]; names.forEach((n, i) => { labels.push(`[${1 + i * 2}:a]`, `[${2 + i * 2}:a]`); });
args.push("-filter_complex", `${labels.join("")}concat=n=${labels.length}:v=0:a=1[o]`, "-map", "[o]", "-ac", "1", "-ar", String(SR), "-c:a", "libmp3lame", "-b:a", "96k", "sfx2.mp3");
execFileSync("ffmpeg", args);
writeFileSync("sfx2.json", JSON.stringify(idx));
console.log("sprite", t.toFixed(2), "s", names.length, "mẫu");
