// Sinh mô tả tiếng riêng từng thẻ S5/S4 -> tools/sfx_the.json (đầu vào của tao_sfx_elevenlabs.mjs --ds=sfx_the.json).
// Mô tả (tiếng Anh, 1 câu) ghép từ: tên thẻ + mô tả hình ảnh (MOTA) -> "chất liệu/sinh vật" ; nhóm kỹ năng (sfxFamOf) -> "hành động" ; bậc.
//   node tools/sfx_the_ds.mjs            # ghi tools/sfx_the.json
// Thẻ cần chỉnh tay: thêm vào OVERRIDE (id -> câu mô tả).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)), js = path.join(here, "..", "www", "js");
const m = { exports: {} }; new Function("module", "exports", fs.readFileSync(path.join(js, "01-engine.js"), "utf8"))(m, m.exports);
const C = m.exports.C;
const grab = (s, name) => { const i = s.indexOf("const " + name + "="); let j = s.indexOf("{", i), dep = 0, k = j; for (; k < s.length; k++) { if (s[k] == "{") dep++; else if (s[k] == "}") { dep--; if (!dep) break; } } return new Function("return " + s.slice(j, k + 1))(); };
const RENAME = grab(fs.readFileSync(path.join(js, "03-data-store.js"), "utf8"), "RENAME");
const MOTA = grab(fs.readFileSync(path.join(js, "05-vfx-core.js"), "utf8"), "MOTA");
const fam = new Function("module", fs.readFileSync(path.join(js, "04a-sfx-fam.js"), "utf8") + ";return module.exports;")({ exports: {} });
// hệ của thẻ: dùng đúng hàm elOf của 05-vfx-core.js (chỉ ĐỌC) để xếp thẻ cùng hệ vào chung sprite
const d5 = fs.readFileSync(path.join(js, "05-vfx-core.js"), "utf8");
const lhash = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619) >>> 0; return h; };
const elOf = new Function("C", "MOTA", "lhash", d5.slice(d5.indexOf("const ELW={"), d5.indexOf("const elU=")) + ";return elOf;")(C, MOTA, lhash);
const strip = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
const hash = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

// [các từ khoá (chữ không dấu, khớp NGUYÊN TỪ trong tên / mô tả hình ảnh), cụm âm thanh, ưu tiên (nhỏ = ưu tiên hơn)]
const KW = [
  [["rong", "cu long", "tieu long", "rong dat", "dragon"], "a deep dragon roar with a warm rumbling breath", 1],
  [["soi", "lang than", "cho soi"], "a low wolf howl with a throaty growl", 1],
  [["nhen", "to troi", "quay to", "to hong", "tuoi to"], "soft silk threads plucked like a taut zither string with faint chittering", 2],
  [["ran", "xa nhan", "9 dau", "chin dau", "cuu dau"], "a slow dry slithering with a low rattling hiss", 2],
  [["ho", "mieu", "meo", "bao", "su tu", "linh mieu", "mang"], "a low big-cat growl with a soft paw thud", 2],
  [["trau", "nguu", "bo_"], "a heavy bull snort and stamping hooves", 2],
  [["chim", "ung", "dieu hau", "qua", "phuong", "chu tuoc", "thien nga", "canh", "dai bang", "chim nhai", "hac"], "broad wing flaps with a low bird call", 2],
  [["buom", "ho diep", "tien bui", "con trung", "bo hung", "con_"], "soft glittering wing flutters with tiny bell sparkles", 3],
  [["ca map", "ca heo", "ngu nhan", "thuy", "nuoc", "song", "bien", "ho nuoc", "thuy hau", "ngan thuy", "dam", "mua", "lan_"], "rolling water with a deep splash and gurgle", 2],
  [["bang", "tuyet", "lanh", "bang de", "bang vuong", "bang ca"], "an icy crystal crack with a low frosty wind and a soft chime", 2],
  [["lua", "hoa", "hoa tinh", "diem", "pho", "phao", "than hong", "dot", "chay", "lo", "nong", "nui lua", "dung nham", "ngon lua"], "crackling flames with a warm fire whoosh", 2],
  [["loi", "sam", "set", "chop", "dien"], "distant thunder rumble with crackling electricity", 1],
  [["gio", "bao", "phong", "bay", "luot", "toc", "truy", "xoay", "loc"], "a rushing wind swirl with a soft whoosh", 3],
  [["da", "thach", "nui", "son", "tru", "khoi", "tuong da", "chuy", "dam", "dat"], "a heavy stone thud with a low rolling rumble", 2],
  [["cat", "bao cat", "cat lun"], "a dry sand rush with a muffled thump", 3],
  [["xuong", "cot", "xac", "thay ma", "cuong thi", "thi", "tu than", "bia", "mo", "ma", "quy", "hon", "vo thuong", "tam ma", "am", "phan quan", "doi"], "a hollow bone rattle with a low ghostly drone", 2],
  [["doc", "dich", "nhay", "nhot", "lay", "bach doc"], "a thick bubbling slime gurgle with a wet pop", 2],
  [["mau", "huyet", "mau hau"], "a wet dark pulse with a throbbing low heartbeat", 2],
  [["kiem", "dao", "guom", "ken", "giao", "dinh ba", "duoi", "bua", "riu", "luoi", "thanh kiem", "dao kiem", "dagger"], "a muted steel blade swish with a low metallic ring", 3],
  [["cung", "ten", "no", "xa thu", "bach phat", "phi tieu", "hau nghe", "cung thu", "mui ten"], "a bowstring twang followed by an arrow whoosh", 3],
  [["trong", "chieng", "trong dong", "nhac", "dan", "chuong", "phong linh", "kenh", "cong chieng"], "a resonant Vietnamese bronze drum beat with a low gong", 3],
  [["sao", "trang", "nguyet", "cuc quang", "thien ha", "vu tru", "thoi gian", "thoi khong", "dong ho", "tinh"], "a shimmering starry bell glissando with a soft airy pad", 3],
  [["may", "co khi", "phao dai", "banh rang", "khoi loi", "thiet", "sat thu", "rô bot", "bua", "cot may"], "clockwork gears turning with a brass clank", 3],
  [["giap", "ho giap", "ao giap"], "heavy armor plates clanking with a low metallic ring", 3],
  [["bai", "la bai", "xuc xac", "ban co", "quan co", "con bai", "xep"], "playing cards riffling with a wooden board-piece clack", 3],
  [["vua", "hoang", "de", "hau", "chua", "vuong", "to", "mau hau", "nu hoang", "ngai", "vuong mien"], "a majestic bronze gong with a warm low brass swell", 2],
  [["tien", "than", "thien", "thien than", "ngoc hoang", "thien su", "than tien"], "a soft angelic wooden chime with a gentle airy shimmer", 4],
  [["moc", "cay", "truc", "la", "rung", "thao", "linh duoc", "luong y", "reu", "hoa"], "a bamboo creak with rustling leaves", 3],
  [["phap su", "phu thuy", "thay phap", "thay bua", "ao thuat", "huyen", "bua", "ao anh", "mong", "giac mo", "phu su", "phu"], "a mystical shimmering whoosh with a plucked zither glissando", 4],
  [["lao", "ong", "ba", "gia", "tho"], "a warm bamboo flute phrase with a soft wooden knock", 4],
  [["khong lo", "cu nhan", "cuong nhan"], "a heavy gruff bellow with a thudding footstep", 3],
  [["khi", "chuot", "dia thu", "tac ke", "bo ngua"], "quick scurrying with a cheeky wooden clack", 4],
  [["ky", "ky si"], "galloping hooves with a low horse snort and a jingle of harness", 3],
  [["vong", "bong", "luan hoi", "hy vong", "den long", "dom dom", "anh", "sang"], "a soft glowing shimmer with a gentle bell tone", 4]
];
const words = t => " " + strip(t).replace(/[^a-z0-9]+/g, " ").trim() + " ";
const INSTR = ["a deep wooden drum", "a small bronze gong", "a plucked đàn tranh zither", "a bamboo sáo flute", "a twangy đàn bầu string", "a wooden fish mõ knock", "a bronze bell"];
const ACT = {
  destroy: "ending in a crunching shattering impact", exile: "fading into a hollow echoing void", discard: "with a papery tear and a dull thud", move: "with a quick rushing slide",
  swap: "with two whooshes crossing over", bounce: "ending in an upward springy pop", pull: "with a pulling suction swoosh", draw: "with a soft card slide", summon: "ending in a heavy thump of something arriving",
  create: "with a magical shimmer that materializes", deckadd: "with cards sliding into a stack", shuffle: "with a quick card riffle", revive: "rising into a warm swelling comeback",
  copy: "with an echoing doubled chime", steal: "with a snatching swipe", silence: "ending in a muffled dampening hush", lock: "ending in a heavy wooden latch clunk", shield: "ending in a solid shield thud and soft ring",
  up1: "with a small gentle swelling lift", up2: "with a rising swelling surge", up3: "with a powerful swelling surge", dn1: "with a small sinking groan", dn2: "with a descending groan", dn3: "with a deep crushing downward drop",
  dbl: "with two quick successive hits", egain: "with a bright warm chime", nrgloss: "with a draining falling tone", costup: "with a draining falling tone", costdn: "with a light downward chime",
  merge: "with a swirling absorbing gulp", morph: "with a warping transformation sweep", locup: "with a rising ground swell", locdn: "with a dark ground tremor", locx: "with a grinding shifting of the ground",
  aura: "with a steady resonant hum that blooms softly", endt: "with a slow tolling bell", act: "with a snappy trigger click and bloom", none: "with a soft bloom"
};
const SIZE = { S5: "epic and full-bodied, layered, cinematic", S4: "compact and punchy, tight" };
const END = "warm low-mid body, rounded, no harsh or shrill high frequencies, no voices or singing, short one-shot";
const CHESS = "wooden Go and chess pieces clacking on a board with a soft bamboo knock";
const OVERRIDE = { /* id -> cụm âm thanh thay cho phần tự khớp từ khoá */
  kydong: CHESS, cosi: CHESS, kynu: CHESS, kychu: CHESS, kysibaitu: "playing cards riffling with galloping hooves and a soft paper rustle",
  tackehoa: "a wet chameleon tongue snap with a soft shimmering color-shift", nhaihinh: "a rubbery shape-shifting squelch with a soft warping tone",
  kiemquyen: "a muted sword swish and a dull fist thud with a low metallic ring",
  thiemnu: "a quick teleport whoosh repeated three times, fading with soft zither plucks",
  dauvuong: "a heavy square stone block slamming with a deep wooden drum thud",
  // --- đợt sửa âm thanh 2: viết tay lại cho thẻ mô tả tự sinh lệch chất liệu (đọc tên + hình + kỹ năng) ---
  phanquanthiengioi: "a solemn celestial bronze gong with a long paper scroll unrolling and a soft airy cloud-wind pad",
  chienthan: "a deep Vietnamese bronze drum beat with a spear tip thumping on a round shield and a low rumbling wind swell",
  bachdich: "dry white plaster cracking and crumbling with a soft powdery hiss and a hollow low hum",
  namtuocmatna: "a wooden tuồng opera mask clack with a soft traditional drum roll and a quick silk sleeve swish",
  tiensigamma: "cloth tearing and muscles straining into a heavy stomping footstep with a deep guttural beastly growl",
  nuthuantuong: "a heavy silver shield planted on stone with a muted metallic clang and a low ring",
  huyetdichhangxom: "wet red tentacles stretching and slithering with a squelching low pulse",
  songsinhtamlinh: "two soft mirrored bell chimes answering each other with a gentle ethereal breath",
  langthan: "a low majestic wolf howl at the moon with a throaty warm echo over soft night wind",
  kenuotsao: "a vast gulping swallow with a deep rumbling belly boom and a fading starlight shimmer",
  trolymay: "creaking wooden joints and rattan ropes tightening with a hollow wooden knock",
  hoanhansokhai: "a crackling bonfire with a torch whoosh and a low wooden drum thump",
  batbainu: "a wounded warrior's saber slash swish with a dull impact and a determined heavy thud",
  nuhongtam: "rapid red arrows whistling in quick succession with soft bowstring plucks",
  hacthuatsi: "paper talismans burning with a dark low whoosh over a ghostly drone",
  deonhansokhai: "a rubbery elastic stretch snapping back like a whip with a soft boing",
  dathuongnu: "a stealthy dagger swish with a soft footstep and a low hush",
  hongve: "a heavy bronze staff spinning with a swish and a thud and a soft metal mask clink",
  vouyamdia: "a slow blade being drawn with a hollow underworld drone and faint dragging chains",
  chomay: "clockwork gears whirring with a brass clack and quick trotting steps",
  nhendotham: "two swift blades swishing across each other with a soft shadowy whoosh",
  cosinhthe: "wooden gears creaking with a leafy rustle and a low mechanical hum",
  vukhix: "a low tiger growl with a wooden spear thud and a bamboo rustle",
  phuthuytre: "a straw broom whoosh with a soft mystical shimmer and a small sparkle",
  thongkho: "a mournful hollow wind with a soft bone creak and a low sinking tone",
  loanxa: "rapid crossbow twangs with bolts whistling past and a soft wooden clack",
  chubao: "a wooden fish mõ knock rolling into a bamboo clack with a warm village echo",
  vualunren: "a hammer ringing on an anvil with bellows breathing over a warm forge fire",
  phuonghoa: "powerful fiery wing beats with crackling flames and a warm rising whoosh",
  cuvocanhhungvi: "large soft butterfly wings fluttering with tiny bell sparkles and a gentle breeze",
  hoasat: "a calligraphy brush stroke swish on paper with an ink splash and a low dark pulse",
  dakhuc: "a soft bamboo sáo flute melody drifting in the night wind over a low warm drone",
  tuongquan: "heavy armor plates clanking with a steady war drum march and a low brass resonance",
  cunemthantoc: "a stone sling whoosh with a fiery flick and a heavy thud",
};
const out = [];
for (const id of Object.keys(C)) {
  const c = C[id]; if (c.h !== "S5" && c.h !== "S4") continue;
  const vn = RENAME[id] || c.n, nm = words(vn), mo = words(MOTA[id] || ""), hh = hash(id);
  const sc = [];
  for (const [ws, ph, pr] of KW) { let s = 0; for (const w of ws) { const q = " " + w + " "; if (nm.includes(q)) s += 6; if (w.length > 3 && mo.includes(q)) s += 2; } if (s) sc.push([s - pr * 0.5, ph]); }
  sc.sort((a, b) => b[0] - a[0] || 0);
  const ph = []; for (const [v, p] of sc) { if (ph.length < 2 && !ph.includes(p) && (ph.length === 0 || v >= 4)) ph.push(p); }
  const f = fam.sfxFamOf(c);
  const ins = INSTR[hh % INSTR.length];
  let core = OVERRIDE[id] ? OVERRIDE[id] : ph.length ? ph.join(", layered with ") : "a layered fantasy impact built from " + ins;
  if (ph.length && hh % 3 === 0) core += ", accented by " + ins;
  const t = `${c.h === "S5" ? "Epic" : "Compact"} fantasy card skill sound: ${core}, ${ACT[f] || ACT.none}; ${SIZE[c.h]}, ${END}`;
  out.push({ k: id, h: c.h, vn, he: elOf(id) || "", fam: f, d: c.h === "S5" ? 1.1 : 1.0, n: 2, c: c.h === "S5" ? "the5" : "the4", dung: `Tiếng kỹ năng riêng của thẻ ${vn} (${c.h})`, t });
}
out.sort((a, b) => (a.h < b.h ? 1 : a.h > b.h ? -1 : 0));
fs.writeFileSync(path.join(here, "sfx_the.json"), JSON.stringify({ _ghi_chu: "Sinh bởi tools/sfx_the_ds.mjs. k = id thẻ; n = số bản; d = giây; c = lớp độ to (the5 = -17 LUFS, the4 = -18 LUFS).", list: out }, null, 1));
console.log(out.length, "thẻ;", out.filter(x => !/layered with|accented/.test(x.t) && x.t.includes("built from")).length, "thẻ dùng mô tả chung");
