/* gpu71 (L1, mục a): BẢNG THÔNG TIN CHIẾN ĐỊA — chạm ô chiến địa (06: look = {kind:"loc", li}) LUÔN mở bảng:
   ảnh chiến địa thu nhỏ + tên + hiệu ứng, điểm từng bên, các thẻ đang đặt ở đó (cả hai bên; thẻ úp của đối thủ hiện mặt lưng,
   thẻ úp / chờ lật của mình hiện mặt kèm nhãn). Chạy cả lúc đang diễn lượt (lật bài, màn phóng lớn PA6, lộ diện chiến địa), sau lộ diện,
   trên điện thoại (chạm) lẫn máy tính.
   - Lấy trạng thái ĐANG HIỂN THỊ (GV khi đang diễn, nếu không thì G) để không lộ trước kết quả; điểm đọc từ huy hiệu trên bàn.
   - Bảng không nhận chạm (pointer-events: none) trừ nút ✕ -> không chặn kéo thẻ / chạm tay bài / chạm chiến địa khác.
   - Đóng: chạm lại ô đó, chạm thẻ / ô khác, chọn thẻ trên tay, nút ✕, Esc. */
(function () {
  "use strict";
  let P = null, lastH = "", iv = 0;
  const vg = () => (typeof GV !== "undefined" && GV && GV !== G ? GV : (typeof G !== "undefined" ? G : null));
  const escH = (t) => (typeof esc === "function" ? esc(t) : String(t));
  function panel() {
    if (P) return P;
    P = document.createElement("div");
    P.id = "locPanel"; P.className = "lpn"; P.hidden = true;
    P.setAttribute("role", "dialog"); P.setAttribute("aria-live", "polite");
    P.addEventListener("click", (ev) => { if (ev.target.closest(".lpx")) { ev.preventDefault(); ev.stopPropagation(); closeLoc(); } });
    document.body.appendChild(P);
    return P;
  }
  function closeLoc() {
    try { if (typeof look !== "undefined" && look && look.kind === "loc") { look = null; render(); } } catch (e) {}
    hide();
  }
  function hide() { if (P && !P.hidden) { P.hidden = true; P.classList.remove("on"); lastH = ""; } clearInterval(iv); iv = 0; }
  function inMatch() {
    try {
      if (typeof G === "undefined" || !G || !G.locs) return false;
      const lb = document.getElementById("lobby"); if (lb && lb.classList.contains("on")) return false;
      return true;
    } catch (e) { return false; }
  }
  function want() {
    try {
      if (!inMatch()) return -1;
      if (typeof look === "undefined" || !look || look.kind !== "loc") return -1;
      if ((typeof sel !== "undefined" && sel) || (typeof moveSel !== "undefined" && moveSel) || (typeof drag !== "undefined" && drag && drag.on)) return -1;
      return look.li;
    } catch (e) { return -1; }
  }
  /* thẻ: mặt (ảnh + năng lượng + sức mạnh hiện tại) hoặc mặt lưng */
  function tile(g, c, li, opt) {
    const d = C[c.id];
    if (!d || opt.back) {
      let bk = "";
      try { const k = c.own === "p" || c.side === "p" ? dBack(store.decks[store.cur]) : foeBack; bk = BACKS[k] ? ` style="background:${BACKS[k][1]}"` : ""; } catch (e) {}
      return `<span class="lpc bk"${bk} aria-label="Thẻ úp"></span>`;
    }
    let pw = d.p;
    try { pw = c.rev ? E.power(g, c, li) : E.basePow(c) + (c.bonus || 0); } catch (e) {}
    const tag = opt.tag ? `<i class="lpt">${opt.tag}</i>` : "";
    const art0 = typeof art === "function" ? art(c.id) : "";
    return `<span class="gc mini lpc${opt.tag ? " dim" : ""}" style="--hc:${HC[d.h]}" aria-label="${escH(d.n)}, sức mạnh ${pw}">${art0}<span class="pwh${pw > d.p ? " up" : pw < d.p ? " down" : ""}">${pw}</span><span class="lpn-n">${escH(d.n)}</span>${tag}</span>`;
  }
  function row(g, li, sd) {
    const L = g.locs[li], out = [];
    for (const c of L.cards[sd] || []) {
      const mineC = c.own === "p";
      if (c.rev) out.push(tile(g, c, li, {}));
      else if (!mineC) out.push(tile(g, c, li, { back: true }));
      else out.push(tile(g, c, li, { tag: c.hid ? "Úp đến cuối" : "Úp" }));
    }
    /* thẻ mình vừa đặt trong lượt (chưa nộp) */
    try { for (const a of g.q && g.q.p ? g.q.p : []) if (a.t === "play" && a.li === li && (a.row || "p") === sd && a.inst) out.push(tile(g, a.inst, li, { tag: "Chờ lật" })); } catch (e) {}
    return out;
  }
  function html(li) {
    const g = vg(); if (!g || !g.locs || !g.locs[li]) return "";
    const L = g.locs[li], def = LOC[L.id] || { n: "?", s: "", x: "" };
    const lane = document.querySelector(`#board [data-lane="${li}"]`), w = lane && lane.querySelector(".locw");
    const l51 = (document.body.dataset.l51 || "").split(" ").includes(String(li));
    let rv = w ? !w.classList.contains("hid") : !!L.rvl;
    if (l51 && L.rvl) rv = true;
    if (L.gone) rv = true;
    const num = (sd) => { const b = lane && lane.querySelector(`.pw.${sd}`); const v = b ? parseInt(b.textContent, 10) : NaN; if (isFinite(v)) return v; try { return E.locPower(g, li, sd); } catch (e) { return 0; } };
    const pp = num("p"), pa = num("a");
    const url = rv && typeof IMGL !== "undefined" && IMGL.has(L.id) ? IMGS.l[L.id] : "";
    const hue = rv && typeof LHUE !== "undefined" && LHUE[L.id] ? LHUE[L.id] : "#3a376e";
    const name = L.gone ? "Đã bị huỷ" : rv ? def.n : "Chiến địa chưa lộ diện";
    const txt = L.gone ? "Không còn tính điểm." : rv ? (typeof kwfx === "function" ? kwfx(def.x || def.s) : escH(def.x || def.s)) : `Sẽ lộ diện ở lượt ${li + 1}. Bạn vẫn đặt bài vào đây được.`;
    const mine = row(g, li, "p"), foe = row(g, li, "a");
    const lead = pp > pa ? "p" : pa > pp ? "a" : "";
    return `<button type="button" class="lpx" aria-label="Đóng">✕</button>`
      + `<div class="lph" style="--lc:${hue}"><div class="lpi${url ? "" : " q"}"${url ? ` style="background-image:url(${url})"` : ""}>${url ? "" : "?"}</div>`
      + `<div class="lpd"><b class="lpnm">${escH(name)}</b><small>Chiến địa ${li + 1}</small><p>${txt}</p></div></div>`
      + `<div class="lps"><span class="lpsc me${lead === "p" ? " lead" : ""}"><small>Bạn</small><b>${pp}</b></span><i>–</i><span class="lpsc foe${lead === "a" ? " lead" : ""}"><b>${pa}</b><small>Đối thủ</small></span></div>`
      + `<div class="lpr foe"><small>Đối thủ · ${foe.length} thẻ</small><div class="lpg">${foe.join("") || `<em>Chưa có thẻ</em>`}</div></div>`
      + `<div class="lpr me"><small>Bạn · ${mine.length} thẻ</small><div class="lpg">${mine.join("") || `<em>Chưa có thẻ</em>`}</div></div>`;
  }
  function paint() {
    const li = want();
    if (li < 0) { hide(); return; }
    const p = panel(), h = html(li);
    if (!h) { hide(); return; }
    if (h !== lastH) { lastH = h; p.innerHTML = h; }
    p.dataset.li = String(li);
    if (p.hidden) { p.hidden = false; void p.offsetWidth; }
    p.classList.add("on");
    /* đang diễn: điểm / thẻ đổi liên tục mà không qua render() -> làm mới nhẹ (chỉ thay khi khác) */
    if (!iv) iv = setInterval(() => { try { paint(); } catch (e) {} }, 300);
  }
  window.LOCP = { paint, close: closeLoc, get li() { return P && !P.hidden ? +P.dataset.li : -1; } };
  function hook() {
    const r0 = window.render;
    if (typeof r0 !== "function" || r0.__lp) return;
    const r1 = function () { const res = r0.apply(this, arguments); try { paint(); } catch (e) { console.error(e); } return res; };
    r1.__lp = true; for (const k of Object.keys(r0)) r1[k] = r0[k];
    window.render = r1;
  }
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && P && !P.hidden) closeLoc(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hook); else hook();
  /* 12-dau-hieu bọc render lúc DOMContentLoaded/khởi tạo -> bọc lại sau cùng nếu bị thay */
  setTimeout(hook, 0); window.addEventListener("load", hook);
})();
