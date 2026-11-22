/* Linh Thú Tam Địa — hình linh thú vẽ bằng vector (mặt nạ đối xứng, 19 kiểu dáng) */
(function (root) {
"use strict";
const PAL = {
  gold: ["#f5b83d", "#b9781a", "#ffe9a6", "#ff7a3d"], orange: ["#f58a2e", "#b3521a", "#ffd9b0", "#fff2c9"],
  red: ["#e5484d", "#9c1f2b", "#ffb9ae", "#ffd84d"], green: ["#4cc46a", "#1f7a3d", "#c9f5b0", "#ffe066"],
  jade: ["#2fcfa6", "#11705c", "#b8f5e3", "#ffe066"], teal: ["#2bb8c9", "#136a7a", "#b5f0f5", "#ffd84d"],
  blue: ["#4a9bf5", "#1f4fa8", "#bfe0ff", "#ffd84d"], indigo: ["#6a6cf0", "#2f2f9c", "#c9c9ff", "#ff7ad9"],
  violet: ["#a36bf0", "#5a2fa8", "#e3ccff", "#7dffcf"], pink: ["#f27fb5", "#a83a72", "#ffd1e6", "#fff2a8"],
  brown: ["#a8703f", "#5e3a1c", "#e6c49a", "#ffd84d"], grey: ["#8b93a8", "#4a5068", "#d5dbea", "#7dd3ff"],
  white: ["#e9eef7", "#9aa5bd", "#ffffff", "#7dd3ff"], black: ["#453f63", "#1d1934", "#9d94c4", "#ff4d6d"],
  lime: ["#b5e04a", "#5f8f1a", "#eeffb3", "#ff7a3d"], sand: ["#e0c08a", "#9c7a45", "#fff0cf", "#ff7a3d"]
};
const K = "#0a0816", W = "#fff", M = "§m", D = "§d", L = "§l", X = "§x", E = "§e", B = "§b", RED = "#e5484d";
const p = (d, f, o) => `<path d="${d}" fill="${f}"${o ? " " + o : ""}/>`;
const c = (x, y, r, f, o) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${o ? " " + o : ""}/>`;
const e = (x, y, rx, ry, f, o) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}"${o ? " " + o : ""}/>`;
const s = (d, col, w, o) => w ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o ? " " + o : ""}/>` : "";
const g = (t, h) => `<g transform="${t}">${h}</g>`;
const mir = h => h + g("matrix(-1 0 0 1 100 0)", h);
function burst(cx, cy, r1, r2, n, f, rot) {
  let d = "";
  for (let i = 0; i < n * 2; i++) { const a = (rot || 0) + Math.PI * i / n, r = i % 2 ? r2 : r1; d += (i ? "L" : "M") + (cx + r * Math.sin(a)).toFixed(1) + " " + (cy - r * Math.cos(a)).toFixed(1); }
  return p(d + "Z", f);
}
function eyeG(kind) {
  const hi = c(-1.9, -2.8, 2.1, W) + c(1.7, 2, 1.05, W);
  const iris = e(0, 0, 7, 8, K) + e(0, 0.4, 5.6, 6.6, E);
  switch (kind) {
    case "slit": return iris + e(0, 0.4, 1.9, 5.4, K) + hi;
    case "angry": return iris + e(0, 1, 3.4, 4.4, K) + hi + p("M-9 -10.5L8 -4.5L8 -8L-7.5 -13.5Z", K);
    case "big": return c(0, 0, 11, L) + iris + e(0, 1, 3.4, 4.4, K) + hi;
    case "dot": return e(0, 0, 5.2, 6.4, K) + c(-1.6, -2.2, 1.9, W) + c(1.4, 1.8, 0.95, W);
    default: return iris + e(0, 1, 3.4, 4.4, K) + hi;
  }
}
const eye1 = (kind, x, y, sc) => g(`translate(${x} ${y}) scale(${sc || 1})`, eyeG(kind));
const eyes = (kind, x, y, sc) => mir(eye1(kind, x, y, sc));
const blush = (x, y) => mir(e(x, y, 5.5, 3.2, "#ff8fb0", 'opacity=".55"'));
/* thân chibi: đầu to đặt trên một thân nhỏ */
function core(feet) { return e(50, 81, 16, 15, M) + e(50, 84, 9.5, 10, L) + mir(g("rotate(18 34 80)", e(34, 80, 5, 8.5, M))) + mir(e(41, 95, 8, 4.6, feet || D)); }
const BODY = {
  feline: () => s("M63 86C84 90 92 72 81 62", M, 5.5) + c(81, 62, 3.4, D) + core(),
  canine: () => p("M61 82C86 64 98 84 82 97C76 93 68 93 61 90Z", M) + p("M85 79C92 85 90 92 82 97C85 90 87 85 85 79Z", L) + core(),
  bear: () => c(67, 88, 4.5, D) + core(),
  rodent: o => (o.ear === "long" ? c(68, 88, 6, L) : o.ear === "tuft" ? p("M62 92C94 98 98 56 76 54C88 66 80 82 62 80Z", M) + p("M70 86C86 84 88 68 80 62C84 72 78 80 70 80Z", L) : s("M64 88C86 94 92 76 82 68", X, 2.6)) + core(),
  bird: () => p("M50 84L36 100H64Z", D) + mir(p("M35 72C20 76 18 92 28 95C35 91 37 80 37 74Z", D)) + e(50, 81, 15, 15, M) + e(50, 84, 9, 10, L) + mir(p("M42 93L35 99H48Z", B)),
  hoofed: () => s("M64 84C78 84 80 74 76 70", D, 2.4) + c(76, 69, 3, D) + core(K),
  primate: () => s("M64 86C86 88 88 66 76 66C69 66 69 75 76 75", M, 3.6) + core(),
  dragon: () => mir(p("M36 74L12 60L20 74L10 78L22 82L16 88L34 84Z", D)) + s("M62 88C82 96 94 80 86 68", M, 6) + p("M86 69L79 58L93 60Z", X) + core() + s("M43 80H57M42 86H58", D, 1),
  lizard: o => (o.frog ? "" : s("M62 88C84 96 92 80 84 70", M, 5.5)) + core(),
  bat: () => e(50, 60, 10, 13, M) + e(50, 62, 5.5, 8, L) + mir(e(45.5, 74, 4.5, 3, D))
};
function feline(o) {
  let h = "";
  if (o.mane) h += burst(50, 52, 47, 37, 14, D) + c(50, 52, 37, D);
  if (o.ear === "tuft") h += mir(p("M22 34L14 4L42 24Z", M) + p("M16 9L11 0L20 5Z", K) + p("M25 28L21 14L36 24Z", D));
  else h += mir(p("M22 34L17 8L42 24Z", M) + p("M25 28L22 15L36 24Z", X));
  h += p("M50 20C72 20 86 34 84 54C82 74 66 88 50 88C34 88 18 74 16 54C14 34 28 20 50 20Z", M);
  if (o.stripes) h += p("M50 21L46 35L54 35Z", K) + mir(p("M17 46L31 50L18 55Z", K) + p("M21 63L32 63L25 71Z", K) + p("M38 22L41 33L35 30Z", K));
  if (o.spots) h += mir(c(26, 40, 3, D) + c(22, 58, 3, D) + c(34, 30, 2.5, D) + c(30, 70, 2.5, D)) + c(50, 30, 3, D);
  h += e(50, 69, 17, 12, L) + p("M44 60L56 60L50 67Z", K) + s("M50 67V72M50 72Q44 78 39 73M50 72Q56 78 61 73", K, 1.8);
  h += mir(s("M36 68L18 63M36 71L19 73", L, 1.2));
  if (o.fangs) h += mir(p("M43 74L45 84L48 75Z", W));
  return h + blush(24, 60) + eyes("slit", 34, 48);
}
function canine(o) {
  let h = "";
  if (o.tails) h += burst(50, 58, 50, 30, 9, X, 0.35);
  if (o.ear === "drop") h += mir(p("M24 26C8 32 6 52 16 66L32 40Z", D));
  else if (o.ear === "round") h += mir(c(24, 26, 12, M) + c(24, 26, 6, D));
  else h += mir(p("M24 38L19 4L44 24Z", M) + p("M27 31L24 13L39 25Z", D));
  if (o.fluffy) h += mir(p("M20 48L4 60L24 68Z", L));
  h += p("M50 22C70 22 84 34 82 50C80 62 68 72 62 80C58 88 54 92 50 92C46 92 42 88 38 80C32 72 20 62 18 50C16 34 30 22 50 22Z", M);
  if (o.spots) h += mir(c(28, 42, 3, D) + c(24, 54, 2.5, D) + c(36, 30, 2.5, D));
  h += p("M50 52C60 56 62 70 58 80C55 88 52 91 50 91C48 91 45 88 42 80C38 70 40 56 50 52Z", L) + e(50, 85, 5, 3.6, K);
  if (o.fangs) h += mir(p("M40 80L41 91L46 83Z", W));
  return h + blush(27, 59) + eyes(o.fangs ? "angry" : "round", 34, 48);
}
function bear(o) {
  let h = o.patch ? mir(c(24, 26, 12, K)) : mir(c(24, 26, 12, M) + c(24, 26, 6, D));
  h += c(50, 54, 34, M);
  if (o.patch) h += mir(g("rotate(-20 35 50)", e(35, 50, 8, 11, K)));
  h += e(50, 69, 15, 12, L) + e(50, 63, 6, 4, K) + s("M50 67V72M44 75Q50 80 56 75", K, 1.8);
  if (o.tusks) h += mir(p("M42 76L39 97L47 78Z", W)) + mir(s("M38 70L22 68M38 73L24 77", L, 1.2));
  return h + blush(25, 62) + (o.patch ? mir(c(35, 50, 3.4, W) + c(35, 50, 1.6, K)) : eyes("dot", 36, 48));
}
function rodent(o) {
  let h = "";
  if (o.spikes) h += burst(50, 52, 48, 34, 18, D);
  if (o.scales) h += burst(50, 50, 46, 37, 10, D, 0.3);
  if (o.ear === "long") h += mir(g("rotate(-10 34 20)", e(34, 20, 8, 21, M) + e(34, 22, 3.6, 15, X)));
  else if (o.ear === "tuft") h += mir(p("M24 38L16 6L42 26Z", M) + p("M27 32L22 16L36 27Z", X));
  else if (o.ear === "small") h += mir(c(26, 32, 7, M) + c(26, 32, 3.5, D));
  else h += mir(c(22, 28, 14, M) + c(22, 28, 8, X));
  h += e(50, 58, 30, 28, M);
  if (o.band) h += p("M22 48Q36 38 50 48Q64 38 78 48Q77 60 63 59Q50 54 37 59Q23 60 22 48Z", K);
  if (o.stripe) h += p("M45 30L55 30L56 62L44 62Z", L);
  h += e(50, 71, 12, 9, L) + c(50, 66, 3.4, o.band || o.stripe ? K : X);
  if (o.teeth) h += `<rect x="46" y="74" width="8" height="8" rx="1" fill="#fff"/>` + s("M50 74V82", K, 0.8);
  h += mir(s("M40 70L22 66M40 73L23 76", L, 1.1));
  return h + blush(27, 64) + (o.band ? mir(c(37, 50, 3.6, W) + c(37, 50, 1.7, K)) : eyes("dot", 37, 52));
}
function bird(o) {
  let h = "";
  if (o.fan) h += burst(50, 54, 50, 26, 9, X, 0.35) + burst(50, 54, 40, 22, 9, D, 0);
  if (o.wings) h += mir(p("M34 62C12 58 2 40 4 20C12 32 20 36 30 36C24 40 24 46 36 48Z", D) + s("M8 28C14 40 22 46 32 50", M, 1.5));
  if (o.tuft) h += mir(p("M26 34L20 10L42 26Z", M));
  if (o.crest === "comb") h += p("M38 28Q34 10 44 16Q46 4 53 13Q62 6 62 28Z", RED);
  else if (o.crest === "crown") h += e(50, 25, 10, 6, RED);
  else if (o.crest === "tuft") h += p("M50 26L41 4L50 13L59 4Z", X);
  h += c(50, 52, 28, M);
  if (o.belly) h += e(50, 68, 17, 12, L);
  if (o.disc) h += mir(c(37, 50, 14, L));
  if (o.brow) h += mir(p("M24 40L46 48L45 43L30 34Z", D));
  if (o.wattle) h += e(50, 83, 5, 8, RED);
  const bk = o.beak || "short";
  if (bk === "hook") h += p("M42 54L58 54L56 66Q52 78 47 71L45 64Z", B) + p("M47 68Q50 74 52 70L50 78Q47 76 47 68Z", K);
  else if (bk === "long") h += p("M45 56L55 56L50 98Z", B);
  else if (bk === "flat") h += e(50, 67, 15, 7.5, B) + c(46, 65, 1, K) + c(54, 65, 1, K);
  else if (bk === "curve") h += p("M40 54Q50 46 60 54Q61 70 50 78Q45 66 40 54Z", B) + p("M46 68Q50 72 54 68L50 78Z", K);
  else h += p("M43 56L57 56L50 69Z", B);
  return h + (o.disc ? "" : blush(29, 60)) + eyes(o.eye || "round", 37, o.disc ? 50 : 47, o.eye === "big" ? 0.9 : 0.85);
}
function serpent(o) {
  let h = "";
  if (o.hood) h += p("M50 12C78 14 92 40 80 66C74 80 60 86 52 98L48 98C40 86 26 80 20 66C8 40 22 14 50 12Z", D) + mir(p("M30 40Q24 52 30 64Q36 52 30 40Z", X));
  else h += e(50, 80, 32, 13, D) + e(50, 74, 23, 9, M) + s("M30 76Q50 84 70 76", D, 2);
  h += p("M50 24C63 24 71 35 69 48C67 61 58 69 50 71C42 69 33 61 31 48C29 35 37 24 50 24Z", M);
  if (o.pattern) h += p("M50 28L46 36L50 44L54 36Z", X) + mir(p("M36 50L40 58L44 52Z", X));
  h += s("M50 69V80M50 80L45 87M50 80L55 87", "#ff4d6d", 2) + c(46, 62, 1, K) + c(54, 62, 1, K);
  return h + eyes("slit", 40, 45, 0.8);
}
function lizard(o) {
  let h = "";
  if (o.frill) h += burst(50, 54, 48, 34, 12, X);
  if (o.crest) h += p("M50 4L44 20L38 14L36 28L64 28L62 14L56 20Z", X);
  if (o.frog) {
    h += mir(c(30, 32, 13, M)) + p("M50 30C74 30 90 44 88 60C86 76 68 86 50 86C32 86 14 76 12 60C10 44 26 30 50 30Z", M) + e(50, 70, 26, 10, L) + s("M22 62Q50 80 78 62", K, 2);
    if (o.warts) h += mir(c(22, 52, 2.5, D) + c(34, 46, 2, D) + c(28, 64, 2, D));
    return h + blush(24, 60) + eyes("round", 30, 31, 0.8);
  }
  h += mir(c(22, 44, 10, M));
  h += p("M50 28C70 28 84 42 80 58C76 74 60 84 50 84C40 84 24 74 20 58C16 42 30 28 50 28Z", M) + p("M50 58C62 60 70 66 66 74C60 82 54 84 50 84C46 84 40 82 34 74C30 66 38 60 50 58Z", L);
  h += s("M28 66Q50 80 72 66", K, 2) + c(45, 54, 1.2, K) + c(55, 54, 1.2, K);
  if (o.fangs) h += p("M32 68L35 76L38 71L41 78L44 73L47 79L50 74L53 79L56 73L59 78L62 71L65 76L68 68Q50 78 32 68Z", W);
  return h + eyes("slit", 23, 44, 0.8);
}
function turtle(o) {
  let h = "";
  if (o.glow) h += c(50, 56, 42, E, 'opacity=".28"');
  h += mir(g("rotate(-35 22 36)", e(22, 36, 9, 5, M)) + g("rotate(35 22 78)", e(22, 78, 8, 5, M)));
  h += e(50, 20, 13, 13, M) + eyes("dot", 44.5, 18, 0.6) + p("M47 86L50 96L53 86Z", M);
  h += e(50, 57, 31, 28, D) + p("M50 38L64 46L64 64L50 74L36 64L36 46Z", M) + s("M50 38V30M64 46L74 40M64 64L74 72M50 74V84M36 64L26 72M36 46L26 40", M, 2.2);
  if (o.snake) h += s("M20 70C30 50 70 66 78 44C82 34 74 28 68 32", X, 4) + c(68, 32, 3.5, X);
  return h;
}
function fish(o) {
  const k = o.kind || "small";
  if (k === "puffer") return burst(46, 54, 40, 30, 16, D) + c(46, 54, 29, M) + e(46, 64, 18, 10, L) + p("M74 50L94 40L90 54L94 68L74 58Z", D) + eye1("round", 34, 47, 0.7) + eye1("round", 55, 45, 0.7) + e(44, 61, 4, 3, K);
  if (k === "whale") return s("M40 26C38 14 30 12 26 16M40 26C42 14 50 12 54 16", "#bfe0ff", 3) + p("M8 58C10 36 40 28 62 36C74 40 80 50 84 44L96 30L92 52L96 66L82 58C70 76 30 80 14 70C10 66 8 62 8 58Z", M) + p("M10 62C24 74 60 76 80 60C62 68 30 70 10 62Z", L) + eye1("dot", 25, 51, 0.75) + s("M12 62Q22 66 32 62", K, 1.5);
  if (k === "tadpole") return s("M52 52C66 42 76 64 94 50", M, 8) + c(34, 52, 21, M) + e(34, 59, 12, 8, L) + eye1("dot", 26, 47, 0.8) + eye1("dot", 42, 47, 0.8);
  const shark = k === "shark", dol = k === "dolphin";
  let h = p(shark ? "M38 36L50 8L62 38Z" : dol ? "M42 36L56 16L60 38Z" : "M36 36L50 18L62 38Z", D);
  h += p(dol ? "M4 54L14 50C24 34 58 30 76 46L94 32L89 52L94 72L76 58C58 76 26 74 14 60Z" : shark ? "M4 50C22 30 58 28 76 46L94 30L89 52L94 74L76 58C58 76 24 74 4 50Z" : "M10 52C24 28 58 28 76 46L92 34L88 52L92 70L76 58C58 76 24 76 10 52Z", M);
  h += p("M14 56C28 70 56 72 74 58C56 64 30 64 14 56Z", L) + p("M44 62L52 76L58 62Z", D);
  if (k === "carp") h += s("M36 44Q40 50 36 56M46 42Q50 50 46 58M56 42Q60 50 56 58", D, 1.6) + s("M12 54Q6 58 8 64M14 56Q10 62 13 67", B, 1.5);
  if (shark || o.teeth) h += p("M8 54L12 59L15 54L18 59L21 54L24 59L27 54Q18 50 8 54Z", W);
  return h + eye1(shark ? "angry" : "round", 27, 47, 0.62) + s("M38 44Q42 52 38 60", D, shark ? 1.6 : 0);
}
function insect(o) {
  let h = "";
  if (o.wings === "butterfly") {
    h += mir(p("M48 46C32 10 2 16 8 42C12 56 36 54 48 50Z", M) + p("M48 53C30 56 12 66 22 84C32 94 46 72 48 58Z", X) + c(22, 34, 6, L) + c(27, 74, 4, L));
    return h + e(50, 58, 5, 22, K) + c(50, 30, 10, K) + mir(s("M47 22Q41 10 33 9", K, 1.6)) + eyes("round", 45.5, 30, 0.45);
  }
  h += o.hind ? mir(s("M44 44L26 34M44 50L22 50", D, 2.4) + s("M45 58L18 52L26 90", D, 3)) : mir(s("M44 44L26 32L20 34M44 50L22 52L16 50M45 58L28 72L24 80", D, 2.4));
  if (o.mantis) h += mir(s("M44 42L28 30L34 14L40 24", M, 4));
  if (o.wings === "bee") h += mir(g("rotate(-28 28 44)", e(28, 44, 18, 9, "#eaf6ff", 'opacity=".8"')) + g("rotate(18 30 58)", e(30, 58, 13, 6, "#eaf6ff", 'opacity=".6"')));
  if (o.wings === "fly") h += mir(g("rotate(-50 30 56)", e(30, 56, 20, 8, "#eaf6ff", 'opacity=".7"')));
  if (o.shell === "shield") h += p("M50 34L74 44L70 76L50 90L30 76L26 44Z", M) + s("M50 40V86M34 56H66", D, 2);
  else if (o.shell) h += e(50, 62, 24, 27, M) + s("M50 36V88", K, 2) + mir(c(38, 52, 4.5, K) + c(34, 68, 4, K) + c(42, 80, 3, K));
  else {
    h += e(50, 68, 11, 19, M);
    if (o.stripes) h += s("M41 60H59M40 68H60M42 76H58", K, 3.4);
    if (o.glow) h += c(50, 80, 14, E, 'opacity=".45"') + c(50, 80, 7, E);
    h += e(50, 46, 9, 9, D);
  }
  h += mir(s("M46 21Q40 9 32 9", D, 1.6)) + c(50, 29, 11.5, o.shell ? K : D) + eyes("round", 44.5, 29, 0.5);
  if (o.proboscis) h += s("M50 19V2", D, 1.8);
  if (o.crown) h += p("M42 20L42 9L46 14L50 6L54 14L58 9L58 20Z", "#ffd84d");
  return h;
}
function worm(o) {
  let h = "";
  for (let i = 7; i >= 0; i--) {
    const x = 22 + i * 9, y = 58 + 11 * Math.sin(i * 0.95), r = i ? 9.5 - i * 0.5 : 12;
    if (o.legs && i) h += s(`M${x} ${(y - 6).toFixed(1)}L${x - 3} ${(y - 16).toFixed(1)}M${x} ${(y + 6).toFixed(1)}L${x - 3} ${(y + 16).toFixed(1)}`, D, 1.8);
    h += c(x, y.toFixed(1), r, i % 2 ? D : M);
  }
  h += eye1("dot", 17, 55, 0.6) + eye1("dot", 27, 54, 0.6) + s("M17 47Q12 37 8 37M26 46Q26 36 30 34", D, 1.6) + e(22, 63, 3, 1.6, "#ff8fb0", 'opacity=".6"');
  if (o.sucker) h += c(14, 63, 5, K) + c(14, 63, 2.5, "#ff4d6d");
  if (o.crown) h += p("M14 44L13 33L18 38L22 31L26 38L31 33L30 44Z", "#ffd84d");
  return h;
}
function spider(o) {
  const k = o.kind || "spider";
  let h = "";
  if (k === "crab") {
    h += mir(s("M30 62L14 70M30 68L16 80M34 72L24 88", D, 3) + s("M28 54L14 42", M, 5) + c(12, 34, 10, M) + p("M12 34L4 26L14 30L18 22Z", K));
    return h + e(50, 60, 28, 18, M) + e(50, 56, 20, 9, L, 'opacity=".35"') + mir(s("M42 46V36", D, 2.4)) + eyes("dot", 42, 32, 0.8);
  }
  if (k === "scorpion") {
    h += mir(s("M40 62L24 58M40 68L22 70M42 74L28 84", D, 2.6) + s("M40 50L24 40", M, 4.5) + c(20, 34, 8, M) + p("M20 34L12 28L22 30L24 22Z", K));
    return h + s("M50 80C84 84 92 42 64 22", M, 7) + p("M64 22L52 14L60 28Z", X) + e(50, 66, 13, 18, M) + s("M40 60H60M40 68H60M41 76H59", D, 1.6) + c(50, 46, 12, D) + eyes("angry", 45, 45, 0.45);
  }
  if (o.web) h += s("M50 4V96M4 50H96M16 16L84 84M84 16L16 84", L, 0.8, 'opacity=".5"') + s("M50 22L70 30L78 50L70 70L50 78L30 70L22 50L30 30Z", L, 0.8, 'opacity=".5"');
  h += mir(s("M44 44L30 28L14 32M44 48L24 44L8 54M44 54L24 60L10 74M44 58L32 74L24 92", D, 3));
  h += c(50, 66, 16, M) + c(50, 42, 14, D);
  if (o.mark) h += p("M45 56L55 56L50 64L55 72L45 72L50 64Z", X);
  return h + eyes("round", 44, 41, 0.6);
}
function cephalo(o) {
  const k = o.kind || "octopus", jelly = k === "jelly";
  let h = "";
  for (const x of (jelly ? [30, 40, 50, 60, 70] : [24, 37, 50, 63, 76])) h += s(`M${x} 56Q${x - 7} 70 ${x} 80Q${x + 6} 88 ${x - 3} 96`, jelly ? L : M, jelly ? 2.5 : 7);
  if (k === "squid") h += p("M50 4L72 36C76 50 70 60 50 60C30 60 24 50 28 36Z", M) + mir(p("M30 30L14 22L26 40Z", D));
  else h += p("M20 52C20 18 80 18 80 52C80 60 70 62 50 62C30 62 20 60 20 52Z", M) + (jelly ? e(50, 40, 22, 14, L, 'opacity=".5"') : mir(c(30, 30, 3, D) + c(38, 24, 2, D)));
  return h + (jelly ? "" : blush(30, 54)) + eyes(jelly ? "dot" : "round", 39, 44, 0.85);
}
function hoofed(o) {
  let h = "";
  if (o.horn === "buffalo") h += mir(p("M34 30C12 30 0 16 6 2C12 18 24 20 38 22Z", B));
  else if (o.horn === "goat") h += mir(p("M38 28C32 10 20 4 10 10C22 12 28 20 32 32Z", B));
  else if (o.horn === "bull") h += mir(p("M32 30L10 14L36 22Z", B));
  else if (o.horn === "straight") h += mir(p("M36 28L26 0L42 24Z", B));
  else if (o.horn === "antler") h += mir(s("M38 28L30 6M35 20L20 14M32 12L26 0M24 15L16 6", B, 3.4));
  else if (o.horn === "uni") h += p("M45 26L50 0L55 26Z", B);
  if (o.ears === "big") h += mir(p("M32 34C4 14 -4 50 8 68C16 80 30 66 34 54Z", D));
  else if (o.ears === "long") h += mir(g("rotate(-24 28 22)", e(28, 22, 7, 18, M) + e(28, 24, 3, 12, X)));
  else h += mir(g("rotate(-25 20 38)", e(20, 38, 11, 5.5, M)));
  h += p("M50 22C66 22 76 32 74 46C73 60 66 72 62 82C60 90 56 94 50 94C44 94 40 90 38 82C34 72 27 60 26 46C24 32 34 22 50 22Z", M);
  if (o.wool) h += c(38, 24, 8, L) + c(50, 20, 9, L) + c(62, 24, 8, L) + c(30, 32, 6, L) + c(70, 32, 6, L);
  if (o.mane) h += p("M43 20L50 2L57 20L55 46L50 40L45 46Z", D);
  if (o.stripes) h += mir(p("M27 44L40 48L28 52Z", K) + p("M30 60L41 62L33 68Z", K) + p("M36 76L44 76L39 82Z", K)) + p("M50 24L46 34L54 34Z", K);
  if (o.spots) h += mir(c(34, 36, 2.6, L) + c(31, 58, 2.2, L) + c(40, 28, 2, L));
  if (o.snout === "pig") h += e(50, 80, 13, 10, X) + c(45, 80, 2.2, K) + c(55, 80, 2.2, K);
  else if (o.snout === "wide") h += e(50, 78, 22, 14, L) + c(42, 74, 2.4, K) + c(58, 74, 2.4, K);
  else if (!o.trunk) h += e(50, 85, 11, 8, L) + c(46, 85, 1.6, K) + c(54, 85, 1.6, K);
  if (o.trunk) h += p("M43 60C42 80 38 92 48 97C58 99 58 88 55 82C54 74 57 60 57 60Z", M) + s("M44 70H56M44 78H55M45 86H54", D, 1.4);
  if (o.tusks || o.trunk) h += mir(p("M38 70C32 84 38 94 44 96C40 88 41 78 42 70Z", W));
  if (o.tusks9) h += mir(p("M34 66C22 76 24 90 30 94C29 82 34 74 38 68Z", W) + p("M30 62C16 68 14 82 18 88C20 76 28 70 34 64Z", W));
  if (o.horn === "rhino") h += p("M43 76L50 42L57 76Z", B);
  if (o.beard) h += p("M44 92L50 100L56 92Z", L);
  return h + blush(33, 61) + eyes("round", 38, 47, 0.8);
}
function primate(o) {
  let h = mir(c(18, 50, 10, M) + c(18, 50, 5, X));
  h += c(50, 50, 31, M) + p("M50 30C62 23 75 34 73 48C72 58 67 62 65 69C62 79 56 85 50 85C44 85 38 79 35 69C33 62 28 58 27 48C25 34 38 23 50 30Z", L);
  h += blush(34, 60) + eyes("dot", 40, 48) + c(47, 63, 1.3, K) + c(53, 63, 1.3, K) + s("M41 72Q50 79 59 72", K, 1.8);
  if (o.hands) h += mir(e(38, 48, 11, 7, M) + s("M30 46V50M35 44V51M40 44V51", D, 1));
  return h;
}
function dragon(o) {
  let h = "";
  if (o.mane) h += burst(50, 50, 50, 34, 11, D, 0.28);
  if (o.horn === "single") h += p("M45 24L50 -2L55 24Z", B);
  else if (o.horn === "spike") h += mir(p("M34 30L18 2L42 22Z", B));
  else h += mir(p("M36 30C30 16 22 8 12 2C18 14 20 24 28 34Z", B) + p("M27 20L14 18L24 26Z", B));
  h += p("M50 18L68 26L82 44L74 62L64 70L60 88L50 95L40 88L36 70L26 62L18 44L32 26Z", M);
  h += mir(p("M22 42L46 51L44 44L30 35Z", D)) + p("M50 56L60 66L58 86L50 93L42 86L40 66Z", L) + c(46, 84, 1.5, K) + c(54, 84, 1.5, K) + p("M50 28L46 36L50 44L54 36Z", X);
  if (o.whisk) h += mir(s("M40 78C24 80 14 94 6 84", B, 2.4));
  if (o.fangs) h += mir(p("M40 86L41 98L46 90Z", W));
  return h + eyes("angry", 35, 52, 0.95);
}
function bat() {
  let h = mir(p("M48 48L22 28L2 42L11 46L6 60L17 57L19 71L29 63L35 74L48 62Z", D) + p("M38 32L33 8L48 26Z", M) + p("M39 28L37 16L45 26Z", X));
  h += c(50, 46, 16, M) + e(50, 54, 7, 5, L) + mir(p("M46 56L47 64L50 57Z", W));
  return h + eyes("round", 44, 44, 0.62);
}
function snail(o) {
  let h = "";
  if (o.claws) h += mir(s("M30 72L16 62", M, 4) + c(12, 56, 8, M) + p("M12 56L5 49L14 52L17 45Z", K));
  h += p("M10 82C26 70 70 72 92 82L92 90L10 90Z", L);
  h += s("M22 78L16 54M30 76L28 52", L, 2.6) + eye1("dot", 16, 51, 0.85) + eye1("dot", 28, 49, 0.85);
  return h + c(58, 52, 27, M) + s("M58 34A18 18 0 1 1 41 46", D, 3.2) + s("M58 43A9 9 0 1 1 50 51", D, 3.2) + c(58, 52, 2.6, D);
}
function misc(o) {
  const k = o.kind;
  if (k === "egg") return (o.glow ? c(50, 54, 40, E, 'opacity=".25"') : "") + e(50, 54, 25, 33, L) + mir(c(38, 44, 4, X) + c(42, 68, 5, X)) + c(50, 34, 3.5, X) + (o.crack ? s("M30 56L40 50L50 58L60 50L70 56", K, 2) : "");
  if (k === "rock") return p("M18 80L10 56L26 30L52 20L80 34L92 62L78 84Z", M) + p("M26 30L52 20L56 46L34 54Z", L) + p("M56 46L80 34L92 62L66 66Z", D) + s("M34 54L44 82M66 66L60 84", K, 1.4);
  if (k === "cocoon") return s("M50 2V22", L, 1.5) + e(50, 56, 22, 36, L) + s("M30 44Q50 54 70 44M29 58Q50 68 71 58M32 72Q50 82 68 72M34 30Q50 40 66 30", M, 2.2);
  return s("M18 50H78", L, 4) + s("M30 34L36 50L30 66M44 32L48 50L44 68M58 34L60 50L58 66", L, 3) + p("M78 50L94 36L90 50L94 64Z", L) + c(14, 50, 9, L) + c(12, 48, 2.4, K);
}
const T = { feline, canine, bear, rodent, bird, serpent, lizard, turtle, fish, insect, worm, spider, cephalo, hoofed, primate, dragon, bat, snail, misc };

const MAP = {
  ant: ["insect", "brown"], fox: ["canine", "orange", { fluffy: 1 }], bear: ["bear", "brown"], tiger: ["feline", "orange", { stripes: 1 }], lion: ["feline", "gold", { mane: 1 }], dragon: ["dragon", "brown", { whisk: 1 }],
  ongtho: ["insect", "gold", { wings: "bee", stripes: 1 }], chimsau: ["bird", "lime"], ruada: ["turtle", "grey"], tamvang: ["worm", "gold"], hactien: ["bird", "white", { beak: "long", crest: "crown", wings: 1 }],
  soibay: ["canine", "grey", { fangs: 1 }], daibang: ["bird", "brown", { beak: "hook", brow: 1, wings: 1 }], traumong: ["hoofed", "black", { horn: "buffalo", e: "#ffd84d" }], voichien: ["hoofed", "grey", { trunk: 1, ears: "big" }],
  kylan: ["dragon", "jade", { horn: "single", mane: 1, whisk: 1 }], ngheda: ["dragon", "grey", { horn: "spike", mane: 1, e: "#7dd3ff" }], cavoi: ["fish", "blue", { kind: "whale" }],
  gatrong: ["bird", "red", { crest: "comb", wattle: 1 }], socnhanh: ["rodent", "orange", { ear: "tuft", teeth: 1 }], vesau: ["insect", "green", { wings: "fly" }], cumeo: ["bird", "brown", { disc: 1, tuft: 1, eye: "big" }],
  galoi: ["bird", "indigo", { crest: "tuft", fan: 1 }], kienchua: ["insect", "red", { crown: 1, wings: "fly" }], haily: ["rodent", "brown", { ear: "small", teeth: 1 }], vet: ["bird", "green", { beak: "curve", crest: "tuft" }],
  bonong: ["bird", "white", { beak: "flat", b: "#ffb347" }], cotrang: ["bird", "white", { beak: "long", wings: 1 }], khunglong: ["lizard", "green", { crest: 1, fangs: 1 }], ruabien: ["turtle", "teal"],
  muoivan: ["insect", "grey", { proboscis: 1, wings: "fly" }], diarung: ["worm", "black", { sucker: 1 }], randoc: ["serpent", "green"], retnui: ["worm", "brown", { legs: 1 }], bocap: ["spider", "violet", { kind: "scorpion" }],
  tacke: ["lizard", "teal"], sualua: ["cephalo", "orange", { kind: "jelly" }], camap: ["fish", "grey", { kind: "shark" }], nhengoa: ["spider", "black", { mark: 1 }], bachtuoc: ["cephalo", "violet"],
  ranhomang: ["serpent", "sand", { hood: 1 }], chimlac: ["bird", "gold", { beak: "long", crest: "tuft", wings: 1, fan: 1 }],
  doidem: ["bat", "violet"], cuada: ["spider", "grey", { kind: "crab" }], nhimgai: ["rodent", "brown", { spikes: 1, ear: "small" }], gokien: ["bird", "black", { beak: "long", crest: "tuft", x: "#e5484d" }], ocsen: ["snail", "sand"],
  tete: ["rodent", "sand", { scales: 1, ear: "small" }], linhcau: ["canine", "sand", { spots: 1, ear: "round" }], canoc: ["fish", "lime", { kind: "puffer" }], coctia: ["lizard", "red", { frog: 1, warts: 1 }],
  trangam: ["serpent", "brown", { pattern: 1 }], gautrang: ["bear", "white"], ruathan: ["turtle", "gold", { glow: 1 }],
  chuotchu: ["rodent", "grey"], demen: ["insect", "brown", { hind: 1 }], cachep: ["fish", "red", { kind: "carp" }], khivang: ["primate", "gold"], quaden: ["bird", "black", { b: "#cfc8ee" }],
  chontrom: ["rodent", "brown", { band: 1, ear: "small" }], heovoi: ["hoofed", "black", { snout: "pig", x: "#d5dbea" }], lonrung: ["hoofed", "brown", { snout: "pig", tusks: 1, x: "#e6a08a" }], meohoang: ["feline", "grey"],
  cuvo: ["bird", "grey", { disc: 1, eye: "big" }], hama: ["hoofed", "violet", { snout: "wide" }], casau: ["lizard", "green", { fangs: 1 }],
  sauken: ["worm", "lime"], kienlua: ["insect", "red"], chorung: ["canine", "brown", { fangs: 1 }], nhendoc: ["spider", "green", { mark: 1 }], cayhuong: ["rodent", "grey", { stripe: 1 }], baodom: ["feline", "gold", { spots: 1 }],
  phuonglua: ["bird", "orange", { fan: 1, crest: "tuft", beak: "hook", x: "#e5484d" }], bongua: ["insect", "green", { mantis: 1 }], tegiac: ["hoofed", "grey", { horn: "rhino" }], caho: ["fish", "orange", { teeth: 1 }],
  soituyet: ["canine", "white", { fangs: 1, e: "#7dd3ff" }], haclong: ["dragon", "black", { horn: "spike", fangs: 1, mane: 1, e: "#ff4d6d" }],
  gamai: ["bird", "sand", { crest: "comb" }], borua: ["insect", "red", { shell: "spots" }], thongoc: ["rodent", "white", { ear: "long", x: "#f27fb5" }], vittroi: ["bird", "green", { beak: "flat" }], echdong: ["lizard", "green", { frog: 1 }],
  chuotme: ["rodent", "grey", { x: "#f27fb5" }], denui: ["hoofed", "white", { horn: "goat", beard: 1 }], cuubong: ["hoofed", "sand", { wool: 1 }], huousao: ["hoofed", "orange", { horn: "antler", spots: 1 }],
  ongchua: ["insect", "gold", { wings: "bee", stripes: 1, crown: 1 }], lacda: ["hoofed", "sand"], gautruc: ["bear", "white", { patch: 1 }],
  nguagio: ["hoofed", "blue", { mane: 1 }], chauchau: ["insect", "lime", { hind: 1 }], chimse: ["bird", "brown", { wings: 1, belly: 1 }], linhduong: ["hoofed", "sand", { horn: "straight" }], caheo: ["fish", "blue", { kind: "dolphin" }],
  kangaroo: ["hoofed", "sand", { ears: "long" }], seu: ["bird", "grey", { beak: "long", crest: "crown", wings: 1 }], traurung: ["hoofed", "brown", { horn: "buffalo" }], nguavan: ["hoofed", "white", { stripes: 1, mane: 1 }],
  hotrang: ["feline", "white", { stripes: 1 }], botot: ["hoofed", "black", { horn: "bull" }], haima: ["bear", "brown", { tusks: 1 }],
  domdom: ["insect", "black", { glow: 1, wings: "fly", e: "#b5ff4a" }], lung: ["rodent", "grey", { stripe: 1, ear: "small" }], ranlotda: ["serpent", "lime", { pattern: 1 }], culon: ["bird", "white", { disc: 1, eye: "big" }],
  linhmieu: ["feline", "sand", { ear: "tuft", spots: 1 }], cohuong: ["bird", "black", { beak: "long", wings: 1, b: "#e5484d" }], buomdem: ["insect", "violet", { wings: "butterfly" }], chongao: ["canine", "black", { ear: "drop", fangs: 1 }],
  holy: ["canine", "pink", { fluffy: 1, tails: 1 }], voigia: ["hoofed", "sand", { trunk: 1, ears: "big" }], phuonghoang: ["bird", "red", { fan: 1, crest: "tuft", beak: "hook", wings: 1 }], thuongluong: ["dragon", "teal", { horn: "spike", whisk: 1, fangs: 1 }],
  trungrong: ["misc", "jade", { kind: "egg", glow: 1 }], thanlan: ["lizard", "orange", { frill: 1 }], raica: ["rodent", "brown", { ear: "small" }], nhongve: ["misc", "sand", { kind: "cocoon" }], ocmuonhon: ["snail", "red", { claws: 1 }],
  vetnhai: ["bird", "red", { beak: "curve" }], khibatchuoc: ["primate", "brown", { hands: 1 }], mucnang: ["cephalo", "pink", { kind: "squid" }], tamchua: ["worm", "white", { crown: 1 }], kynhong: ["lizard", "lime", { crest: 1 }],
  lyngu: ["fish", "gold", { kind: "carp" }], hotinh: ["canine", "violet", { fluffy: 1, tails: 1, e: "#7dffcf" }],
  ruoitrau: ["insect", "black", { wings: "fly" }], chuotcong: ["rodent", "black"], khiduoidai: ["primate", "grey"], tuhu: ["bird", "grey", { belly: 1 }], boxit: ["insect", "green", { shell: "shield" }],
  acla: ["bird", "black", { wings: 1, belly: 1 }], danmoi: ["insect", "sand"], gaumeo: ["rodent", "grey", { band: 1 }], camutda: ["worm", "teal", { sucker: 1 }], nhengiangto: ["spider", "white", { web: 1 }],
  saoden: ["bird", "black", { crest: "tuft", b: "#ffb347" }], tyhuu: ["dragon", "gold", { horn: "single", mane: 1, fangs: 1 }],
  linhquy: ["turtle", "jade", { glow: 1 }], nghecon: ["dragon", "sand", { mane: 1, horn: "spike" }], gachincua: ["bird", "gold", { crest: "comb", fan: 1 }], nguachin: ["hoofed", "red", { mane: 1, e: "#ffd84d" }],
  voichinnga: ["hoofed", "white", { trunk: 1, ears: "big", tusks9: 1 }], chutuoc: ["bird", "red", { wings: 1, beak: "hook", crest: "tuft", fan: 1, x: "#ffb347" }], bachho: ["feline", "white", { stripes: 1, fangs: 1, e: "#7dd3ff" }],
  huyenvu: ["turtle", "black", { snake: 1 }], bachlong: ["dragon", "white", { whisk: 1, e: "#7dd3ff" }], thanhlong: ["dragon", "blue", { whisk: 1, mane: 1 }], laclong: ["dragon", "gold", { whisk: 1, mane: 1, fangs: 1, e: "#ff4d6d" }],
  giaolong: ["dragon", "indigo", { horn: "spike", whisk: 1, fangs: 1 }],
  gacon: ["bird", "gold"], thocon: ["rodent", "white", { ear: "long", x: "#f27fb5" }], vitcon: ["bird", "gold", { beak: "flat", b: "#ff8a3d" }], chuotcon: ["rodent", "grey", { x: "#f27fb5" }], nongnoc: ["fish", "green", { kind: "tadpole" }],
  kientho: ["insect", "brown"], cacon: ["fish", "teal"], onglinh: ["insect", "gold", { wings: "bee", stripes: 1 }], cuunon: ["hoofed", "white", { wool: 1 }], thuhoang: ["hoofed", "brown", { snout: "pig", tusks: 1, x: "#e6a08a" }],
  gaucon: ["bear", "brown"], buomthan: ["insect", "jade", { wings: "butterfly" }], rongcon: ["dragon", "green", { horn: "spike" }], kimlong: ["dragon", "gold", { whisk: 1, mane: 1 }], huoucon: ["hoofed", "orange", { spots: 1 }],
  rock: ["misc", "grey", { kind: "rock" }], cocoon: ["misc", "white", { kind: "cocoon" }], bone: ["misc", "white", { kind: "bone" }], egg: ["misc", "sand", { kind: "egg", crack: 1 }]
};
const cache = {};
function art(id) {
  if (cache[id]) return cache[id];
  let hsh = 0; for (let k = 0; k < id.length; k++) hsh = (hsh * 31 + id.charCodeAt(k)) >>> 0;
  const TK = ["feline", "canine", "bear", "rodent", "bird", "lizard", "primate", "dragon", "bat", "hoofed", "turtle", "fish"], PK = Object.keys(PAL);
  const a = MAP[id] || [TK[hsh % TK.length], PK[(hsh >>> 5) % PK.length], {}], P = PAL[a[1]], o = a[2] || {};
  const rep = { m: P[0], d: P[1], l: P[2], x: o.x || P[3], e: o.e || "#fff38a", b: o.b || (a[0] === "bird" ? "#ff9a1f" : "#ffd27a") };
  const head = T[a[0]](o), bd = BODY[a[0]];
  const body = (bd ? bd(o) + g("translate(50 37) scale(0.7) translate(-50 -52)", head) : head).replace(/§([mdlxeb])/g, (_, k) => rep[k]);
  return (cache[id] = `<svg class="art" viewBox="-1 -2 102 104" aria-hidden="true">${body}</svg>`);
}
const API = { art, MAP, PAL };
if (typeof module !== "undefined" && module.exports) module.exports = API; else root.ART = API;
})(typeof globalThis !== "undefined" ? globalThis : this);

