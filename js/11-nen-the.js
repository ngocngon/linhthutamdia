/* =====================================================================
   NỀN THẻ (11-nen-the.js) — mỹ phẩm đổi nền phía sau nhân vật trên thẻ.
   - Nhân vật trong sprite đã tách nền sẵn (kênh alpha), nên nền chỉ là một lớp <nb-l class="nb"> đặt NGAY TRƯỚC ảnh thẻ
     trong phần tử thẻ; ảnh thẻ (art) nằm trên (z-index:1). Không phụ thuộc cách tải ảnh gốc (sprite hay từng file).
   - Mặc định (không trang bị) không thêm gì: nbL(id) trả "" ngay.
   - Mỗi nền có thể được thay bằng tranh vẽ: đặt img/nen/<id>.webp rồi thêm id vào NEN.IMG.
   - Tệp này nạp ĐẦU TIÊN (trước 01) nên chỉ khai báo hàm; mọi truy cập store/C chỉ xảy ra lúc gọi.
   ===================================================================== */
(function () {
  "use strict";
  const TQ = [["Thường", "#b9bcc8"], ["Đặc Biệt", "#35d07f"], ["Hiếm", "#3aa0ff"], ["Hùng Tráng", "#c45cff"], ["Huyền Thoại", "#ff9a1f"], ["Siêu Cấp", "#ff4d6d"], ["Vô Cực", "#ffffff"]];
  const GR = [["nh", "Ngũ hành"], ["vn", "Hoạ tiết Việt"], ["pc", "Phong cảnh"], ["tt", "Thần thoại"], ["ak", "Ánh kim"], ["dg", "Nền động"], ["mv", "Lễ hội"]];
  const PR = [150, 500, 1000, 250, 450, 800, 1500]; // giá theo bậc: bậc 0-2 trả vàng, bậc 3 trở lên trả token
  const SAMPLE = "ho"; // thẻ mẫu để xem thử trong cửa hàng
  const CAT = [];
  const add = (id, n, g, t, src, o) => CAT.push(Object.assign({ id, n, g, t, src, c: t <= 2 ? "gold" : "tok", p: PR[t] }, o || {}));
  // [Ngũ hành] — kiếm khi chơi (nhiệm vụ)
  add("kim", "Kim Ngân", "nh", 0, "Nhiệm vụ"); add("moc", "Mộc Lâm", "nh", 0, "Nhiệm vụ"); add("thuy", "Thuỷ Triều", "nh", 0, "Nhiệm vụ");
  add("hoa", "Hoả Diệm", "nh", 0, "Nhiệm vụ"); add("tho", "Thổ Địa", "nh", 0, "Nhiệm vụ");
  // [Hoạ tiết Việt] — tranh vẽ ChatGPT (lưới 4×4, cắt bằng tools/cat_luoi_nen.py) ở img/nen/<id>.webp
  add("donghoo", "Tranh Đông Hồ", "vn", 1, "Cửa hàng"); add("gomlam", "Gốm Lam Chu Đậu", "vn", 1, "Cửa hàng"); add("gachbong", "Gạch Bông Men Lam", "vn", 1, "Cửa hàng");
  add("maingoi", "Mái Ngói Rêu Phong", "vn", 1, "Nhiệm vụ"); add("ruonglua", "Đồng Lúa Chiều Quê", "vn", 1, "Nhiệm vụ");
  add("trongdong", "Trống Đồng Đông Sơn", "vn", 2, "Cửa hàng"); add("chamgo", "Chạm Gỗ Đình Làng", "vn", 2, "Cửa hàng"); add("senthuymac", "Sen Thuỷ Mặc", "vn", 2, "Cửa hàng");
  add("denlong", "Đèn Lồng Hội An", "vn", 2, "Cửa hàng"); add("thocam", "Thổ Cẩm Núi Rừng", "vn", 2, "Cửa hàng");
  add("sonmai", "Sơn Mài Son Vàng", "vn", 3, "Cửa hàng"); add("khamxacu", "Khảm Xà Cừ", "vn", 3, "Cửa hàng"); add("luatheu", "Lụa Thêu Rồng Mây", "vn", 3, "Cửa hàng");
  add("maycungdinh", "Mây Cung Đình Huế", "vn", 3, "Thẻ tháng"); add("phudieucham", "Phù Điêu Chăm Pa", "vn", 3, "Cửa hàng"); add("tranhkinh", "Tranh Kính Hoa Sen", "vn", 3, "Cửa hàng");
  // [Phong cảnh] — 16 tranh vẽ ChatGPT (img/nen) + 6 cảnh dùng tranh chiến địa sẵn có (img/l)
  add("hoguom", "Cầu Thê Húc Đêm", "pc", 2, "Cửa hàng"); add("muine", "Đồi Cát Mũi Né", "pc", 2, "Cửa hàng"); add("bangioc", "Thác Bản Giốc", "pc", 2, "Cửa hàng");
  add("dalat", "Rừng Thông Đà Lạt", "pc", 2, "Cửa hàng"); add("chonoi", "Chợ Nổi Bình Minh", "pc", 2, "Nhiệm vụ"); add("trangan", "Bến Thuyền Tràng An", "pc", 2, "Cửa hàng");
  add("thapcham", "Tháp Chàm", "pc", 2, "Cửa hàng"); add("ngocson", "Đền Ngọc Sơn", "pc", 2, "Cửa hàng"); add("vanmieu", "Văn Miếu", "pc", 2, "Cửa hàng");
  add("halong", "Vịnh Hạ Long Sương Sớm", "pc", 3, "Cửa hàng"); add("bacthang", "Ruộng Bậc Thang Mùa Vàng", "pc", 3, "Cửa hàng"); add("hue", "Ngọ Môn Hoàng Hôn", "pc", 3, "Cửa hàng");
  add("fansipan", "Fansipan Biển Mây", "pc", 3, "Cửa hàng"); add("bienchieu", "Biển Đảo Hoàng Hôn", "pc", 3, "Cửa hàng"); add("ructrang", "Rừng Trúc Đêm Trăng", "pc", 3, "Cửa hàng");
  add("thanglong", "Hoàng Thành Thăng Long", "pc", 3, "Cửa hàng"); add("hoian", "Phố Cổ Hội An", "pc", 3, "Cửa hàng"); add("sapa", "Sa Pa Mây Phủ", "pc", 3, "Thẻ tháng"); add("phongnha", "Động Phong Nha", "pc", 3, "Cửa hàng");
  add("sondoong", "Cột Sáng Sơn Đoòng", "pc", 4, "Cửa hàng"); add("nuilua", "Núi Lửa Thần Thoại", "pc", 4, "Cửa hàng");
  add("thuyte", "Cung Điện Thuỷ Tề", "pc", 4, "Thẻ tháng"); add("tanvien", "Tản Viên Mây Ngũ Sắc", "pc", 4, "Cửa hàng");
  // [Thần thoại] — tranh vẽ ChatGPT (img/nen)
  add("rungnam", "Rừng Nấm Linh Thú", "tt", 3, "Cửa hàng"); add("bangtuyet", "Băng Tuyết Pha Lê", "tt", 3, "Cửa hàng"); add("giongbao", "Giông Bão Sấm Tím", "tt", 3, "Nhiệm vụ");
  add("nganha", "Dải Ngân Hà", "tt", 4, "Cửa hàng"); add("dungnham", "Dung Nham Rực Cháy", "tt", 4, "Cửa hàng"); add("amphu", "Âm Phủ Lửa Xanh", "tt", 4, "Cửa hàng");
  add("cungtrang", "Cung Trăng Chị Hằng", "tt", 4, "Thẻ tháng"); add("thiendinh", "Thiên Đình Mây Ngọc", "tt", 5, "Cửa hàng");
  add("rongvang", "Rồng Vàng Mây Ngũ Sắc", "tt", 5, "Cửa hàng"); add("phuonghoang", "Phượng Hoàng Lửa", "tt", 5, "Cửa hàng"); add("daisen", "Đài Sen Hào Quang", "tt", 6, "Cửa hàng");
  // [Ánh kim] — phản chiếu theo độ nghiêng (chạm/rê, con quay)
  add("vangdat", "Vàng Dát", "ak", 3, "Cửa hàng", { f: 1 }); add("bac", "Bạc Trăng", "ak", 3, "Cửa hàng", { f: 1 }); add("cauvong", "Cầu Vồng Holo", "ak", 4, "Cửa hàng", { f: 1 });
  // [Nền động] — chỉ chạy ở thẻ lớn
  add("maytroi", "Mây Trôi", "dg", 5, "Cửa hàng", { a: 1 }); add("dentroi", "Đèn Trời", "dg", 5, "Cửa hàng", { a: 1 });
  add("songnuoc", "Sóng Nước", "dg", 5, "Thẻ tháng", { a: 1 }); add("lua", "Lửa Thiêng", "dg", 6, "Cửa hàng", { a: 1 });
  // [Lễ hội] — giới hạn
  add("tet", "Xuân Tết", "mv", 4, "Sự kiện Tết", { lim: 1, a: 1 }); add("trungthu", "Rằm Trung Thu", "mv", 4, "Sự kiện Trung Thu", { lim: 1, a: 1 });

  const BY = {}; for (const b of CAT) BY[b.id] = b;
  const IMG = new Set([                 // id có tranh vẽ img/nen/<id>.webp (ghi đè bản CSS)
    "donghoo", "gomlam", "gachbong", "maingoi", "ruonglua", "trongdong", "chamgo", "senthuymac", "denlong", "thocam",
    "sonmai", "khamxacu", "luatheu", "maycungdinh", "phudieucham", "tranhkinh",
    "halong", "bacthang", "fansipan", "sondoong", "trangan", "hoguom", "hue", "muine", "bangioc", "dalat", "chonoi", "bienchieu",
    "nuilua", "thuyte", "tanvien", "ructrang",
    "tet", "trungthu", "dentroi", "rongvang", "phuonghoang", "thiendinh", "amphu", "rungnam", "nganha", "giongbao", "bangtuyet",
    "dungnham", "cungtrang", "vangdat", "cauvong", "daisen",
    "kim", "moc", "thuy", "hoa", "tho", "thapcham", "ngocson", "vanmieu", "hoian", "sapa", "phongnha", "bac", "maytroi", "songnuoc", "lua", "thanglong"]);
  const KEM = new Set(["datamtri", "lucthan", "matoc", "maydotam", "mieunuot", "phiung"]); // thẻ chưa hỗ trợ nền (xem tools/tach_nen_nhan_vat.py)
  try { fetch("img/cut/_kem.json").then(r => r.json()).then(j => { for (const k in j) KEM.add(k); }).catch(() => { }); } catch (e) { }

  let NS = null, cnt = 0;
  function st() { // store.nen: {eq:{idThẻ:idNền}, own:{idNền:1}, all:1(bản thử mở khoá hết)}
    if (NS && NS === store.nen) return NS;
    let n = store.nen; if (!n || typeof n !== "object") n = store.nen = { eq: {}, own: {}, all: 1 };
    if (!n.eq || typeof n.eq !== "object") n.eq = {}; if (!n.own || typeof n.own !== "object") n.own = {};
    for (const k in n.eq) if (!BY[n.eq[k]]) delete n.eq[k];
    NS = n; cnt = Object.keys(n.eq).length; return n;
  }
  const owned = id => { const s = st(); return !!(s.all || s.own[id]); };
  const supported = k => !KEM.has(k);
  const cur = c => c === "gold" ? "gold" : "tok";
  const esc2 = t => String(t).replace(/[&<>"']/g, ch => "&#" + ch.charCodeAt(0) + ";");

  /* url() trong biến CSS bị trình duyệt tính theo thư mục của tệp CSS (css/img/...) -> dùng đường dẫn tuyệt đối */
  const NBURL = {};
  const nbUrl = id => NBURL[id] || (NBURL[id] = (() => { try { return new URL("img/nen/" + id + ".webp?v=1", document.baseURI).href; } catch (e) { return "img/nen/" + id + ".webp"; } })());
  function bgHTML(id) {
    const im = IMG.has(id), b = BY[id], k = im && b && (b.a || b.f); // nền động/ánh kim: giữ lớp hiệu ứng chồng lên tranh vẽ
    return `<nb-l class="nth nth-${id}${im ? " nbi" : ""}${k ? " nbfx" : ""}" data-nth="${id}"${im ? ` style="--nbimg:url(${nbUrl(id)})"` : ""} aria-hidden="true"></nb-l><b class="nbm" aria-hidden="true"></b>`;
  }
  /* gọi trước ${art(id)} ở mọi nơi vẽ thẻ. Không trang bị -> "" (không tốn gì) */
  function layer(k) {
    try {
      if (!NS || NS !== store.nen) st();
      if (!cnt) return "";
      const id = NS.eq[k]; if (!id || KEM.has(k) || !BY[id] || !owned(id)) return "";
      return bgHTML(id);
    } catch (e) { return ""; }
  }
  window.nbL = layer;
  /* đổi nền ngay trên phần tử thẻ đã vẽ (không dựng lại) */
  function swap(el, k, id) {
    if (!el) return;
    for (const x of el.querySelectorAll(":scope>.nth,:scope>.nbm")) x.remove();
    if (!id || KEM.has(k) || !BY[id]) return;
    el.insertAdjacentHTML("afterbegin", bgHTML(id));
  }
  function refreshCards(k) {
    for (const el of document.querySelectorAll(`[data-pick="${k}"],[data-zk="${k}"] .gc`)) swap(el, k, eqOf(k));
  }
  const eqOf = k => { st(); const id = NS.eq[k]; return id && owned(id) ? id : ""; };
  function setEq(k, id) { const s = st(); if (id) s.eq[k] = id; else delete s.eq[k]; cnt = Object.keys(s.eq).length; save(); }

  /* ---- mua ---- */
  function buy(id) {
    const b = BY[id], s = st(); if (!b || owned(id)) return false;
    if (store[b.c] < b.p) { try { SFX.play("ui_error", 0.6); } catch (e) { } toast("Không đủ " + (b.c === "gold" ? "vàng" : "token")); return false; }
    store[b.c] -= b.p; s.own[id] = 1; save(); try { SFX.play("ui_buy", 0.9); } catch (e) { } return true;
  }
  const priceHTML = b => `<span class="nbpr">${icn(b.c)}${b.p}</span>`;
  const lockSVG = `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 5V4a3 3 0 016 0v1h.6c.4 0 .8.3.8.8v4.4c0 .5-.4.8-.8.8H2.4c-.4 0-.8-.3-.8-.8V5.8c0-.5.4-.8.8-.8zm1.4 0h3.2V4a1.6 1.6 0 00-3.2 0z" fill="#ffd65a"/></svg>`;

  /* ---- bảng chọn nền trong chi tiết thẻ ---- */
  const UI = { k: "", mode: "info", sel: "", sl: 0, g: "" };
  function swHTML(b, k, eq) {
    const o = owned(b.id), tc = TQ[b.t][1];
    return `<button type="button" class="nbsw${UI.sel === b.id ? " sel" : ""}${o ? "" : " no"}" data-nbs="${b.id}" style="--tc:${tc}" aria-label="${esc2(b.n)}, ${TQ[b.t][0]}${o ? "" : ", chưa mở khoá, " + b.p + (b.c === "gold" ? " vàng" : " token")}" aria-pressed="${UI.sel === b.id}"><span class="nbsb">${bgHTML(b.id).replace(/<b class="nbm"[^>]*><\/b>/, "")}${o ? "" : `<span class="nbk">${lockSVG}</span>`}${eq === b.id ? `<span class="nbe">✓</span>` : ""}</span><span class="nbn">${esc2(b.n)}</span></button>`;
  }
  function infoHTML(k, eq) {
    const id = UI.sel, b = BY[id], ok = supported(k);
    let h = "";
    if (!ok) h += `<div class="nbwarn">Thẻ này chưa hỗ trợ nền: ảnh nhân vật chưa được tách khỏi nền gốc nên vẫn hiện tranh gốc.</div>`;
    if (!b) {
      h += `<div class="nbi2"><div class="tx"><b>Tranh gốc</b><small>Thẻ dùng ảnh nền gốc của nhân vật.</small></div></div>`;
      h += `<div class="nbact"><button type="button" class="nbb gh" data-nbx="1" ${eq ? "" : "disabled"}>Bỏ nền</button></div>`;
      return h;
    }
    const o = owned(id);
    h += `<div class="nbi2" style="--tc:${TQ[b.t][1]}"><div class="tx"><b>${esc2(b.n)}</b><small><span class="nbtag">${TQ[b.t][0]}</span>${b.lim ? `<span class="nbtag lim">Giới hạn</span>` : ""}${esc2(GR.find(x => x[0] === b.g)[1])} · ${esc2(b.src)}${b.a ? " · động" : ""}${b.f ? " · ánh kim" : ""}</small></div>${o ? "" : priceHTML(b)}</div>`;
    const here = eq === id;
    h += `<div class="nbact">`;
    if (!o) h += `<button type="button" class="nbb go" data-nbbuy="${id}" ${store[b.c] < b.p || !ok ? "disabled" : ""}>Mua ${icn(b.c)}${b.p}</button>`;
    else h += `<button type="button" class="nbb go" data-nbuse="${id}" ${here || !ok ? "disabled" : ""}>${here ? "Đang dùng" : "Dùng nền này"}</button>`;
    h += `<button type="button" class="nbb gh" data-nbx="1" ${eq ? "" : "disabled"}>Bỏ nền</button></div>`;
    return h;
  }
  function panelHTML(k) {
    const eq = eqOf(k);
    let strip = `<div class="nbgrp"><small>Gốc</small><div class="nbrow"><button type="button" class="nbsw none${UI.sel === "" ? " sel" : ""}" data-nbs="" aria-label="Tranh gốc" aria-pressed="${UI.sel === ""}"><span class="nbsb" style="--tc:#7a86c8">∅</span><span class="nbn">Tranh gốc</span></button></div></div>`;
    for (const [g, gn] of GR) strip += `<div class="nbgrp" data-g="${g}"><small>${gn}</small><div class="nbrow">${CAT.filter(b => b.g === g).map(b => swHTML(b, k, eq)).join("")}</div></div>`;
    const chips = GR.map(([g, gn]) => `<button type="button" data-nbg="${g}" class="${UI.g === g ? "on" : ""}">${gn}</button>`).join("");
    return `<div class="nbp" data-nbk="${k}"><div class="nbchips">${chips}</div><div class="nbstrip">${strip}</div><div class="nbinfo">${infoHTML(k, eq)}</div></div>`;
  }
  /* Phần chèn vào chi tiết thẻ: thanh tab [Kỹ năng | Nền] + bảng chọn nền. ctx = "card" | "pz" */
  function slot(k) {
    if (UI.k !== k) { UI.k = k; UI.mode = UI.mode === "nen" ? "nen" : "info"; UI.sel = eqOf(k); UI.g = ""; UI.sl = 0; }
    document.body.classList.toggle("nblow", window.FXLV === 0);
    bindTilt();
    queueMicrotask(() => { const r = document.querySelector("#ovCard.on #cardBody,#ovPZ.on #pzBody"); if (r && UI.k === k) { applyMode(r); swap(bigOf(r), k, UI.mode === "nen" ? UI.sel : eqOf(k)); } });
    return `<div class="nbtabs" role="tablist"><button type="button" role="tab" data-nbm="info" class="${UI.mode === "nen" ? "" : "on"}" aria-selected="${UI.mode !== "nen"}">Kỹ năng</button><button type="button" role="tab" data-nbm="nen" class="${UI.mode === "nen" ? "on" : ""}" aria-selected="${UI.mode === "nen"}">Nền thẻ${eqOf(k) ? " ✓" : ""}</button></div>${panelHTML(k)}`;
  }
  function root(el) { return el.closest("#cardBody") || el.closest("#pzBody"); }
  function bigOf(r) { return r.querySelector(".bigc") || r.querySelector(".gc"); }
  function applyMode(r) { r.classList.toggle("nbmode", UI.mode === "nen"); const o = r.closest("#ovCard"); if (o) o.classList.toggle("nbm-on", UI.mode === "nen"); }
  function repaintPanel(r, keep) {
    const p = r.querySelector(".nbp"); if (!p) return;
    const sl = p.querySelector(".nbstrip"), x = sl ? sl.scrollLeft : 0;
    p.outerHTML = panelHTML(UI.k);
    const n = r.querySelector(".nbstrip"); if (n) n.scrollLeft = keep ? x : 0;
    r.querySelectorAll("[data-nbm]").forEach(b => { const on = b.dataset.nbm === UI.mode; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    const tn = r.querySelector('[data-nbm="nen"]'); if (tn) tn.textContent = "Nền thẻ" + (eqOf(UI.k) ? " ✓" : "");
  }
  function onClick(ev) {
    const r = ev.currentTarget, t = ev.target.closest("button"); if (!t || !r.contains(t)) return;
    const d = t.dataset, k = UI.k;
    if (d.nbm !== undefined) {
      ev.stopPropagation(); try { SFX.play("ui_tab"); } catch (e) { } UI.mode = d.nbm; applyMode(r);
      r.querySelectorAll("[data-nbm]").forEach(b => { const on = b.dataset.nbm === UI.mode; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
      if (UI.mode === "nen") { const s = r.querySelector(".nbsw.sel"); if (s && s.scrollIntoView) { const sp = r.querySelector(".nbstrip"); sp.scrollLeft = Math.max(0, s.offsetLeft - sp.offsetLeft - 40); } }
      else swap(bigOf(r), k, eqOf(k)); // rời tab Nền: thẻ về nền đang dùng
      return;
    }
    if (d.nbs === undefined && d.nbg === undefined && d.nbuse === undefined && d.nbbuy === undefined && d.nbx === undefined) return;
    ev.stopPropagation(); try { SFX.play("tap"); } catch (e) { }
    if (d.nbg !== undefined) { // nhảy tới nhóm
      UI.g = d.nbg; const g = r.querySelector(`.nbgrp[data-g="${d.nbg}"]`), sp = r.querySelector(".nbstrip");
      if (g && sp) sp.scrollTo({ left: g.offsetLeft - sp.offsetLeft - 2, behavior: window.reduced ? "auto" : "smooth" });
      r.querySelectorAll("[data-nbg]").forEach(b => b.classList.toggle("on", b.dataset.nbg === d.nbg)); return;
    }
    if (d.nbs !== undefined) { // thử lên thẻ
      UI.sel = d.nbs; swap(bigOf(r), k, UI.sel);
      r.querySelectorAll(".nbsw").forEach(b => { const on = b.dataset.nbs === UI.sel; b.classList.toggle("sel", on); b.setAttribute("aria-pressed", on); });
      r.querySelector(".nbinfo").innerHTML = infoHTML(k, eqOf(k)); return;
    }
    if (d.nbbuy !== undefined) {
      if (buy(d.nbbuy)) { const b = BY[d.nbbuy]; if (UI.sel === b.id && supported(k)) setEq(k, b.id); toast("Đã mua nền " + b.n); refreshAfter(r, k); }
      return;
    }
    if (d.nbuse !== undefined) { setEq(k, d.nbuse); toast("Đã dùng nền " + BY[d.nbuse].n); refreshAfter(r, k); return; }
    if (d.nbx !== undefined) { setEq(k, ""); UI.sel = ""; swap(bigOf(r), k, ""); toast("Đã bỏ nền, thẻ về tranh gốc"); refreshAfter(r, k); }
  }
  function refreshAfter(r, k) {
    repaintPanel(r, true); refreshCards(k);
    try { if (r.id === "cardBody") { document.getElementById("cardRes").innerHTML = resHTML(["up", "tok", "gold"]); renderDeck(true); } } catch (e) { }
    try { if (typeof renderShop === "function" && document.getElementById("ovShop").classList.contains("on")) renderShop(); renderLobby(); } catch (e) { }
  }
  for (const id of ["cardBody", "pzBody"]) { const el = document.getElementById(id); if (el) el.addEventListener("click", onClick, true); }
  /* mở lại thẻ khác -> bỏ thử */
  function reset() { UI.k = ""; }
  for (const id of ["ovCard", "ovPZ"]) { const el = document.getElementById(id); if (el) new MutationObserver(() => { if (!el.classList.contains("on")) { UI.mode = "info"; UI.k = ""; if (el.classList.contains("nbm-on")) el.classList.remove("nbm-on"); } }).observe(el, { attributes: true, attributeFilter: ["class"] }); }

  /* ---- ánh kim: theo con trỏ / con quay (gắn khi cần, một lần) ---- */
  let tiltOn = false, tr = 0;
  function bigs() { return document.querySelectorAll("#cardBody .bigc,#pzBody .gc,#ovNen .nbbig"); }
  function bindTilt() {
    if (tiltOn) return; tiltOn = true;
    document.addEventListener("pointermove", e => {
      const el = e.target.closest && e.target.closest("#cardBody .bigc,#pzBody .gc,#ovNen .nbbig"); if (!el) return;
      const r = el.getBoundingClientRect(); if (!r.width) return;
      el.style.setProperty("--mx", Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)).toFixed(1) + "%");
      el.style.setProperty("--my", Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)).toFixed(1) + "%");
    }, { passive: true });
    addEventListener("deviceorientation", e => {
      if (window.reduced || (typeof store !== "undefined" && store.gyro === false) || e.gamma == null || tr) return;
      tr = requestAnimationFrame(() => {
        tr = 0; const x = 50 + Math.max(-30, Math.min(30, e.gamma)) * 1.4, y = 50 + Math.max(-30, Math.min(30, (e.beta || 45) - 45)) * 1.4;
        for (const el of bigs()) { el.style.setProperty("--mx", x.toFixed(1) + "%"); el.style.setProperty("--my", y.toFixed(1) + "%"); }
      });
    }, { passive: true });
  }

  /* ---- cửa hàng: thẻ tab "Nền thẻ" ---- */
  function sections() { return GR.map(([g, n]) => [g, n, "brush"]); }
  function shopItem(b) {
    const o = owned(b.id), tc = TQ[b.t][1];
    return `<button type="button" class="si nbit" data-nbp="${b.id}" style="--tc:${tc}" aria-label="${esc2(b.n)}, ${TQ[b.t][0]}"><span class="nbmini">${b.lim ? `<span class="nbq">Giới hạn</span>` : ""}${bgHTML(b.id).replace(/<b class="nbm"[^>]*><\/b>/, "")}${art(SAMPLE)}</span><span class="nbnm">${esc2(b.n)}</span><span class="nbsrc"><span class="nbtag" style="--tc:${tc}">${TQ[b.t][0]}</span>${esc2(b.src)}</span>${o ? `<span class="pz own">${st().all && !st().own[b.id] ? "Mở (bản thử)" : "Đã có"}</span>` : `<span class="pz${store[b.c] < b.p ? " no" : ""}">${icn(b.c)}${b.p}</span>`}</button>`;
  }
  function shop() {
    const s = st();
    let h = `<button type="button" class="nbtest${s.all ? " on" : ""}" data-nbt="1" aria-pressed="${!!s.all}"><i></i><span>Bản thử: mở khoá mọi nền. Tắt để thử luồng mua bằng vàng và token.</span></button>`;
    for (const [g, gn] of GR) {
      const L = CAT.filter(b => b.g === g);
      h += `<section class="ssec" id="ss-${g}"><div class="shh"><span class="sht"><b>${gn}</b><small>${L.length} nền${g === "mv" ? " · giới hạn theo sự kiện" : g === "dg" ? " · chuyển động ở thẻ lớn" : g === "ak" ? " · ánh kim theo độ nghiêng" : ""}</small></span></div><div class="shg">${L.map(shopItem).join("")}</div></section>`;
    }
    return h + `<div class="shn">Chọn nền ở Sưu tập: mở thẻ, bấm tab "Nền thẻ". Mỗi thẻ có thể dùng một nền riêng.</div>`;
  }
  let ov = null;
  function openPrev(id) {
    const b = BY[id]; if (!b) return;
    if (!ov) { ov = document.createElement("div"); ov.className = "ov sheet"; ov.id = "ovNen"; ov.innerHTML = `<div class="pk" id="nenBody" role="dialog" aria-label="Xem nền"></div>`; document.body.appendChild(ov); ov.addEventListener("click", e => { if (e.target.id === "ovNen" || e.target.closest("[data-nbclose]")) { ov.classList.remove("on"); return; } const t = e.target.closest("button"); if (!t) return; const d = t.dataset; if (d.nbbuy) { if (buy(d.nbbuy)) { toast("Đã mua nền " + BY[d.nbbuy].n); const bb = BY[d.nbbuy]; paintPrev(d.nbbuy); try { document.getElementById("shopRes").innerHTML = resHTML(["gold", "up", "tok", "evp", "gems"]); renderShop(); renderLobby(); } catch (x) { } } } }); }
    paintPrev(id); bindTilt(); document.body.classList.toggle("nblow", window.FXLV === 0); ov.classList.add("on");
  }
  function paintPrev(id) {
    const b = BY[id], o = owned(id), tc = TQ[b.t][1];
    document.getElementById("nenBody").innerHTML = `<div class="nbbig nbpv" style="--tc:${tc}">${bgHTML(id).replace(/<b class="nbm"[^>]*><\/b>/, "")}${art(SAMPLE)}</div>
      <div class="nbtxt" style="--tc:${tc}"><div class="nbi2"><div class="tx"><b>${esc2(b.n)}</b><small><span class="nbtag">${TQ[b.t][0]}</span>${b.lim ? `<span class="nbtag lim">Giới hạn</span>` : ""}${esc2(GR.find(x => x[0] === b.g)[1])} · ${esc2(b.src)}</small></div>${o ? "" : priceHTML(b)}</div>
      <p>${o ? "Bạn đã có nền này. Mở Sưu tập, chọn thẻ rồi vào tab Nền thẻ để dùng." : "Mua để dùng cho mọi thẻ. Mỗi thẻ chọn nền riêng."}${KEM.size ? " Vài thẻ ánh sáng mờ chưa hỗ trợ nền." : ""}</p>
      <div class="nbact">${o ? "" : `<button type="button" class="nbb go" data-nbbuy="${id}" ${store[b.c] < b.p ? "disabled" : ""}>Mua ${icn(b.c)}${b.p}</button>`}<button type="button" class="nbb gh" data-nbclose="1">Đóng</button></div></div>`;
  }
  function shopClick(ds) {
    if (ds.nbt) { const s = st(); s.all = s.all ? 0 : 1; save(); renderShop(); return true; }
    if (ds.nbp) { openPrev(ds.nbp); return true; }
    return false;
  }
  window.NEN = { CAT, BY, GR, TQ, IMG, KEM, slot, shop, sections, shopClick, owned, eqOf, setEq, buy, swap, layer, supported };
})();
