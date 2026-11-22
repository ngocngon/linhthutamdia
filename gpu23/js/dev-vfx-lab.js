/* Bảng Test VFX & Âm Thanh (chỉ dành cho nhà phát triển) — gpu23: tách khỏi 08-vfx-webgl.js (mục 8) và 09-card-choreo.js (mục 9).
   Nạp lười: 08 gắn nút "✨ Bảng Test VFX" ở sảnh và nút trong Cài đặt > Nâng cao; lần bấm đầu mới tải file này (và css/dev-vfx-lab.css).
   Hành vi giữ nguyên như khi bảng được dựng sẵn lúc tải trang. */
(function () {
  "use strict";

  const $id = (id) => document.getElementById(id);
  const {
    clamp, smoothAnim, build3DArcFrames, gpuFlash, streamBezierRibbon, pushOppNotif, playCardStealSwap, spawnSoulSiphonOrb,
    playDeckOrHandSteal, animateFastCardPlace, animateFastCardUnplay
  } = window.VFX08_LAB;
  const GLFX = window.GLFX;

  /* ==================== 8. BẢNG TEST HIỆU ỨNG & ÂM THANH LUÔN HIỂN THỊ (5 NHÓM · 32 HIỆU ỨNG ĐẦY ĐỦ) ==================== */
  const VFX_LAB_TABS = [
    {
      id: "play",
      label: "⚡ Ra Bài",
      items: [
        ["fastplay", "⚡ Đặt Thẻ Nhanh", true],
        ["foedrop", "🎴 Đối Thủ Úp Bài", false],
        ["fliprev", "🔄 Lật Thẻ Mở Chiêu", true],
        ["locrev", "🏛️ Mở Chiến Địa 3D", true],
        ["unplay", "↩️ Rút Lại Về Tay", false],
        ["drawcard", "🃏 Rút Bài Đầu Lượt", false],
        ["turnbn", "🚩 Băng Hiệu Lượt", false],
        ["fuse10s", "⏱️ Đếm Ngược 10s", false]
      ]
    },
    {
      id: "interact",
      label: "🧲 Cướp/Dời",
      items: [
        ["stealcard", "🧲 Cướp Thẻ Đổi Phe", true],
        ["decksteal", "🕵️ Cướp Bộ Bài", true],
        ["stealskill", "🔮 Cướp Kỹ Năng", true],
        ["clonecard", "🪞 Nhân Bản Thẻ", false],
        ["silence", "🔇 Xoá Kỹ Năng", false],
        ["pullcard", "🪝 Kéo Thẻ Đối Thủ", false],
        ["pushcard", "💨 Đẩy Thẻ Khỏi Ô", false],
        ["morphcard", "🦋 Biến Hình 3D", false]
      ]
    },
    {
      id: "combat",
      label: "💥 Phá/Điểm",
      items: [
        ["destroyer", "☄️ Tia Huỷ Diệt Bàn", true],
        ["destroy3d", "💔 Chém Vỡ Thẻ 3D", true],
        ["summon", "🐉 Triệu Hồi Thú", false],
        ["buffpw", "💚 Cộng Điểm (+6)", false],
        ["debuffpw", "❤️‍🔥 Trừ Điểm (−4)", false],
        ["doublepw", "✨ Nhân Đôi (×2)", true]
      ]
    },
    {
      id: "elem",
      label: "🔥 Hệ/Cược",
      items: [
        ["snapcube", "🎲 Cược SNAP ×2/×8", true],
        ["locklane", "⛓️ Khoá Chiến Địa", false],
        ["shieldfx", "🛡️ Khiên Bất Tử", false],
        ["fire", "🔥 Nổ Hoả Ngục", false],
        ["thunder", "⚡ Lôi Phạt Sét", false],
        ["frost", "❄️ Băng Phong", false],
        ["ult", "🗡️ Tuyệt Kỹ S5", true]
      ]
    },
    {
      id: "audio",
      label: "🎵 Nhạc/Tốc",
      items: [
        ["bgm_b1", "🎵 Nhạc Lượt 1–3", true],
        ["bgm_b2", "🎸 Nhạc Cao Trào", false],
        ["bgm_climax", "🔥 Nhạc Lượt Cuối", true],
        ["bgm_lobby", "🌌 Nhạc Sảnh Chờ", false],
        ["bgm_toggle", "🔊 Bật/Tắt Nhạc", false],
        ["spd_fast", "⏩ Nhanh (0.78×)", false],
        ["spd_norm", "▶️ Chuẩn (1.0×)", false],
        ["spd_slow", "🐢 Chậm (1.3×)", false]
      ]
    }
  ];

  let curLabTab = "play";
  let demoLocIdx = 0;
  let demoTurnIdx = 0;
  let demoSnapIdx = 0;

  function syncLabButtonsState(isOpen) {
    const b = $id("btnVfxLab");
    if (b) b.classList.toggle("active", !!isOpen);
  }

  function renderLabTab(tabId) {
    curLabTab = tabId;
    const drawer = $id("vfxLabDrawer");
    if (!drawer) return;
    drawer.querySelectorAll(".vl-tab").forEach((t) => t.classList.toggle("on", t.dataset.vtab === tabId));
    const tabObj = VFX_LAB_TABS.find((t) => t.id === tabId) || VFX_LAB_TABS[0];
    const grid = $id("vlGrid");
    if (grid) {
      grid.innerHTML = tabObj.items
        .map(([k, lbl, feat]) => `<button type="button" class="vl-btn${feat ? " vl-feat" : ""}" data-demo="${k}">${lbl}</button>`)
        .join("");
    }
  }

  function buildVfxLab() {
    if ($id("vfxLabDrawer")) return;

    const drawer = document.createElement("div");
    drawer.id = "vfxLabDrawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-label", "Bảng Test Hiệu Ứng & Âm Thanh");
    drawer.innerHTML = `
      <div class="vl-hd" id="vlHeader" title="Kéo thanh tiêu đề để di chuyển bảng test">
        <b>⚡ BẢNG TEST VFX (GHIM MỞ)</b>
        <div class="vl-hd-act">
          <span class="vl-fps" id="vlFps">60 FPS</span>
          <button type="button" class="vl-min" id="vlMin" title="Thu gọn / Mở rộng">▾ Thu gọn</button>
          <button type="button" class="vl-x" id="vlClose" aria-label="Đóng bảng test" title="Đóng bảng test">✕</button>
        </div>
      </div>
      <div class="vl-tabs" id="vlTabs">
        ${VFX_LAB_TABS.map((t) => `<button type="button" class="vl-tab${t.id === curLabTab ? " on" : ""}" data-vtab="${t.id}">${t.label}</button>`).join("")}
      </div>
      <div class="vl-grid" id="vlGrid"></div>
      <div class="vl-sub">Bảng luôn giữ mở khi bấm test · Kéo tiêu đề để dời vị trí · Chỉ đóng khi bấm ✕</div>
    `;
    document.body.appendChild(drawer);
    renderLabTab(curLabTab);

    /* Chỉ đóng khi bấm ✕ (KHÔNG BAO GIỜ tự tắt khi bấm nút test!) */
    $id("vlClose").addEventListener("click", (ev) => {
      ev.stopPropagation();
      SFX.play("tap");
      drawer.classList.remove("on");
      syncLabButtonsState(false);
    });

    /* Nút Thu gọn / Mở rộng nhanh ngay trên thanh tiêu đề */
    const minBtn = $id("vlMin");
    minBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      SFX.play("tap");
      const isMin = drawer.classList.toggle("min");
      minBtn.textContent = isMin ? "▴ Mở rộng" : "▾ Thu gọn";
    });

    /* Chuyển tab danh mục test & kích hoạt demo liên tục mà KHÔNG đóng bảng */
    drawer.addEventListener("click", (ev) => {
      const tabBtn = ev.target.closest("[data-vtab]");
      if (tabBtn) {
        SFX.play("tap");
        drawer.classList.remove("min");
        minBtn.textContent = "▾ Thu gọn";
        renderLabTab(tabBtn.dataset.vtab);
        return;
      }
      const demoBtn = ev.target.closest("[data-demo]");
      if (demoBtn) {
        SFX.wake();
        demoBtn.classList.remove("vl-fired");
        void demoBtn.offsetWidth;
        demoBtn.classList.add("vl-fired");
        setTimeout(() => demoBtn.classList.remove("vl-fired"), 360);
        runDemo(demoBtn.dataset.demo);
      }
    });

    /* Cho phép kéo thả di chuyển bảng test nếu người dùng muốn đặt lên góc bất kỳ */
    let vDrag = null;
    let vlOffX = 0, vlOffY = 0;
    $id("vlHeader").addEventListener("pointerdown", (ev) => {
      if (ev.target.closest("button")) return;
      vDrag = { sx: ev.clientX, sy: ev.clientY, ox: vlOffX, oy: vlOffY, pid: ev.pointerId };
    });
    document.addEventListener("pointermove", (ev) => {
      if (!vDrag || ev.pointerId !== vDrag.pid) return;
      vlOffX = clamp(vDrag.ox + (ev.clientX - vDrag.sx), -window.innerWidth * 0.42, window.innerWidth * 0.42);
      vlOffY = clamp(vDrag.oy + (ev.clientY - vDrag.sy), -window.innerHeight * 0.68, 52);
      drawer.style.setProperty("--vlx", vlOffX.toFixed(1) + "px");
      drawer.style.setProperty("--vly", vlOffY.toFixed(1) + "px");
    }, { passive: true });
    const endVDrag = () => { vDrag = null; };
    document.addEventListener("pointerup", endVDrag, { passive: true });
    document.addEventListener("pointercancel", endVDrag, { passive: true });

    setInterval(() => {
      if (!drawer.classList.contains("on")) return;
      const el = $id("vlFps");
      const bgmTag = window.BGM && BGM.isPlaying() ? "🎵" : "🔇";
      if (el) el.textContent = `${GLFX.fps()} FPS · ${GLFX.count()} hạt · ${bgmTag}`;
    }, 350);
  }

  function openLab() {
    const d = $id("vfxLabDrawer");
    if (d) {
      d.classList.add("on");
      d.classList.remove("min");
      const minBtn = $id("vlMin");
      if (minBtn) minBtn.textContent = "▾ Thu gọn";
      syncLabButtonsState(true);
    }
  }
  function toggleLab() {
    SFX.play("tap");
    const d = $id("vfxLabDrawer");
    if (!d) return;
    const on = d.classList.toggle("on");
    if (on) {
      d.classList.remove("min");
      const minBtn = $id("vlMin");
      if (minBtn) minBtn.textContent = "▾ Thu gọn";
    }
    syncLabButtonsState(on);
  }

  function ensureInMatchForDemo(kind) {
    const lobby = $id("lobby");
    if (lobby && lobby.classList.contains("on")) {
      if (typeof newGame === "function") {
        newGame();
        lobby.classList.remove("on");
        if (window.BGM) BGM.syncGame(G);
        render();
        openLab();
        setTimeout(() => runDemo(kind), 110);
        return false;
      }
      const lbPlay = $id("lbPlay");
      if (lbPlay) {
        lbPlay.click();
        openLab();
        setTimeout(() => runDemo(kind), 820);
        return false;
      }
    }
    return true;
  }

  function sampleDemoCardHTML(id, pwDelta) {
    const pick = id && C[id] ? id : "bachho";
    const d = C[pick];
    const delta = pwDelta != null ? pwDelta : 3;
    const pw = Math.max(0, d.p + delta);
    const cls = delta > 0 ? "up" : delta < 0 ? "down" : "";
    return `<button type="button" class="mc q5" style="--hc:${HC[d.h] || "#ffd65a"}">${nbL(pick)}${art(pick)}<span class="mn">${logo(pick)}</span><span class="pwh ${cls}">${pw}</span></button>`;
  }

  function getLaneSlotRect(laneIdx, side, slotIdx) {
    const ln = document.querySelector(`#board [data-lane="${laneIdx}"]`) || document.querySelector("#board [data-lane]");
    if (!ln) return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4, w: 54, h: 76, slot: null, lane: null };
    const slots = ln.querySelectorAll(`.side.${side} .slot`);
    const sl = slots[slotIdx || 0] || slots[0] || ln;
    const r = sl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: Math.max(48, r.width), h: Math.max(67, r.height), slot: sl, lane: ln };
  }

  function runDemo(kind) {
    if (reduced) {
      store.fx = "on";
      reduced = false;
      document.body.classList.remove("rm");
    }
    const cx = window.innerWidth * 0.5, cy = window.innerHeight * 0.36;

    switch (kind) {
      /* ===== NHÓM 1: RA BÀI & LƯỢT ===== */
      case "fastplay": {
        if (!ensureInMatchForDemo("fastplay")) return;
        const handEl = document.querySelector("#hand [data-hc]") || $id("hand");
        const hr = handEl ? handEl.getBoundingClientRect() : { left: cx - 32, top: window.innerHeight - 130, width: 64, height: 90 };
        const dst = getLaneSlotRect(demoLocIdx % 3, "me", 1);
        demoLocIdx++;
        const cardId = C.thanhlong ? "thanhlong" : Object.keys(C)[0];
        const col = (C[cardId] && HC[C[cardId].h]) || "#3fe0ff";
        SFX.play("place");
        const dummy = ghost({ x: dst.x, y: dst.y, w: dst.w, h: dst.h }, sampleDemoCardHTML(cardId, 2), "g9");
        dummy.style.opacity = "0";
        animateFastCardPlace(
          dummy,
          { x: hr.left + hr.width / 2, y: hr.top + hr.height / 2, w: Math.max(52, hr.width), h: Math.max(72, hr.height), fromDrag: false },
          col
        );
        pushOppNotif("ĐẶT THẺ TỨC THÌ (150MS) ▸ HÚT VÀO CHIẾN ĐỊA!", "#3fe0ff");
        setTimeout(() => { if (dummy.isConnected) dummy.remove(); }, 650);
        break;
      }

      case "foedrop": {
        if (!ensureInMatchForDemo("foedrop")) return;
        const av = $id("avFoe");
        const ar = av ? av.getBoundingClientRect() : { left: cx + 80, top: 28, width: 48, height: 48 };
        const sx = ar.left + ar.width / 2, sy = ar.top + ar.height / 2;
        SFX.play("place");
        [0, 1].forEach((k) => {
          const dst = getLaneSlotRect((demoLocIdx + k) % 3, "opp", 2);
          setTimeout(() => {
            const backHtml = typeof BACK7 === "function" ? BACK7() : sampleDemoCardHTML("haclong", 0);
            const g = ghost({ x: dst.x, y: dst.y, w: dst.w, h: dst.h }, backHtml, "g9");
            const dx = (sx - dst.x) * 0.45, dy = Math.min(-42, (sy - dst.y) * 0.42);
            g.animate([
              { transform: `perspective(620px) translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 46px) scale(1.22) rotateZ(7deg)`, opacity: 0.35 },
              { transform: "perspective(620px) translate3d(0, 2px, 0) scale(0.95)", opacity: 1, offset: 0.72 },
              { transform: "perspective(620px) translate3d(0, 0, 0) scale(1)", opacity: 1 }
            ], { duration: 185, easing: "cubic-bezier(0.18, 0.95, 0.32, 1)", fill: "forwards" });
            setTimeout(() => {
              FX.dust(dst.x, dst.y + dst.h * 0.4, "#ffd8d0");
              FX.ring(dst.x, dst.y, "#ff7a5a", 46, 3);
              GLFX.impulseShake(2.8, 0, 1);
            }, 135);
            setTimeout(() => g.remove(), 680);
          }, k * 65);
        });
        demoLocIdx++;
        pushOppNotif("ĐỐI THỦ ĐẶT THẺ ÚP ▸ CHUẨN BỊ LẬT BÀI!", "#ff8a5a");
        break;
      }

      case "fliprev": {
        if (!ensureInMatchForDemo("fliprev")) return;
        const liveCard = document.querySelector("#board [data-mc]");
        if (liveCard && typeof revealZoom === "function") {
          const uid = +liveCard.dataset.mc;
          SFX.play("flip");
          revealZoom(uid);
          const r = liveCard.getBoundingClientRect();
          setTimeout(() => {
            FX.wave(r.left + r.width / 2, r.top + r.height / 2, "#ffd65a", 92);
            FX.sparks(r.left + r.width / 2, r.top + r.height / 2, "#ffd65a", 22, 240);
            GLFX.impulseShake(4.2, 0, 1);
          }, 220);
        } else {
          const dst = getLaneSlotRect(1, "me", 0);
          const pick = C.chuque ? "chuque" : Object.keys(C)[0];
          const d = C[pick];
          const col = HC[d.h] || "#ff7a2b";
          const bk = (typeof BACKS !== "undefined" && BACKS.b0) ? BACKS.b0[1] : "linear-gradient(135deg,#2b195c,#0d0826)";
          SFX.play("flip");
          const z = document.createElement("div");
          z.className = "rvz snap-revz";
          z.style.setProperty("--c", col);
          z.innerHTML = `<div class="rvz-card"><div class="rvz-face rvz-front"><span class="gc q5" style="--hc:${col}">${nbL(pick)}${art(pick)}<span class="cst">${d.c}</span><span class="pwh up">${d.p + 2}</span><span class="n">${logo(pick)}</span></span></div><div class="rvz-face rvz-back" style="background:${bk}"></div></div>`;
          document.body.appendChild(z);
          const zr = z.getBoundingClientRect();
          const zx = window.innerWidth / 2 - zr.width / 2, zy = window.innerHeight * 0.42 - zr.height / 2;
          z.style.left = zx + "px";
          z.style.top = zy + "px";
          const sx = dst.w / zr.width;
          const tx = dst.x - (zx + zr.width / 2), ty = dst.y - (zy + zr.height / 2);
          z.firstElementChild.animate(
            [{ transform: "rotateY(180deg)" }, { transform: "rotateY(0deg)", offset: 0.34 }, { transform: "rotateY(0deg)" }],
            { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
          );
          z.animate([
            { transform: `translate3d(${tx}px, ${ty}px, 0) scale(${sx})`, opacity: 0.85 },
            { transform: "translate3d(0, -6px, 40px) scale(1.08) rotate(-2.5deg)", opacity: 1, offset: 0.3 },
            { transform: "translate3d(0, 0, 30px) scale(1.02) rotate(-1.5deg)", opacity: 1, offset: 0.68 },
            { transform: `translate3d(${tx}px, ${ty}px, 0) scale(${sx})`, opacity: 0.95 }
          ], { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }).onfinish = () => {
            z.remove();
            const landed = ghost(dst, sampleDemoCardHTML(pick, 2), "g9");
            FX.wave(dst.x, dst.y, col, 96);
            FX.sparks(dst.x, dst.y, col, 24, 250);
            GLFX.impulseShake(4.5, 0, 1);
            setTimeout(() => landed.remove(), 460);
          };
        }
        pushOppNotif("LẬT THẺ 3D (480MS) ▸ BUNG KỸ NĂNG NGAY LẬP TỨC!", "#ffd65a");
        break;
      }

      case "locrev": {
        if (!ensureInMatchForDemo("locrev")) return;
        const li = demoLocIdx % 3;
        demoLocIdx++;
        if (G && G.locs[li]) {
          G.locs[li].rvl = true;
          render();
        }
        if (typeof window.gpuLocReveal === "function") window.gpuLocReveal(li);
        break;
      }

      case "unplay": {
        if (!ensureInMatchForDemo("unplay")) return;
        const src = getLaneSlotRect(1, "me", 0);
        SFX.play("unplay");
        animateFastCardUnplay({
          uid: (G && G.hand.p[0] && G.hand.p[0].uid) || -1,
          x: src.x,
          y: src.y,
          w: src.w,
          h: src.h,
          html: sampleDemoCardHTML("bachho", 0)
        });
        pushOppNotif("RÚT LẠI THẺ VỀ TAY (155MS) ▸ HOÀN NĂNG LƯỢNG!", "#7fe8ff");
        break;
      }

      case "drawcard": {
        if (!ensureInMatchForDemo("drawcard")) return;
        const hc = document.querySelector("#hand [data-hc]:last-child") || document.querySelector("#hand [data-hc]");
        SFX.play("draw");
        if (hc && CFX && CFX.drawIn) {
          CFX.drawIn(hc, true, 0);
        }
        pushOppNotif("RÚT THẺ ĐẦU LƯỢT ▸ XOÁY 3D VÀO TAY BÀI!", "#7fe8ff");
        break;
      }

      case "turnbn": {
        const labels = [
          ["LƯỢT 2/6", "Chiến địa giữa lộ diện"],
          ["LƯỢT 5/6", "Nhịp độ cao trào"],
          ["LƯỢT CUỐI!", "Tất tay quyết định thắng bại"]
        ];
        const [t, s] = labels[demoTurnIdx % labels.length];
        demoTurnIdx++;
        if (typeof banner === "function") banner(t, s);
        break;
      }

      case "fuse10s": {
        if (!ensureInMatchForDemo("fuse10s")) return;
        if (typeof tLeft !== "undefined") {
          tLeft = 10;
          tArmed = true;
          tLast = performance.now();
          tBeep = 0;
          if (typeof paintTimer === "function") paintTimer();
        }
        SFX.play("tick");
        pushOppNotif("CẢNH BÁO 10 GIÂY CUỐI ▸ DÂY CHÁY ĐỎ & TIM ĐẬP!", "#ff5a36");
        break;
      }

      /* ===== NHÓM 2: CƯỚP & DỜI ===== */
      case "stealcard": {
        if (!ensureInMatchForDemo("stealcard")) return;
        const opp = getLaneSlotRect(1, "opp", 2);
        const me = getLaneSlotRect(1, "me", 1);
        const thief = getLaneSlotRect(1, "me", 0);
        const existingOpp = opp.lane && opp.lane.querySelector(".side.opp .mc:not(.back)");
        const cardHtml = existingOpp ? cleanCloneHTML(existingOpp) : sampleDemoCardHTML("bachho", 3);
        const cardName = existingOpp ? (existingOpp.getAttribute("aria-label") || "Bạch Hổ").split(",")[0] : (C.bachho ? C.bachho.n : "Bạch Hổ");
        pushOppNotif("HỒ TINH ▸ TUNG XÍCH CƯỚP THẺ ĐỔI PHE!", "#d46bff");
        const actor = ghost(opp, cardHtml, "g9");
        playCardStealSwap(opp, me, actor, null, thief, thief.slot && thief.slot.querySelector(".mc"), "p", cardName);
        break;
      }

      case "decksteal": {
        if (!ensureInMatchForDemo("decksteal")) return;
        const pick = C.loithan ? "loithan" : Object.keys(C)[2];
        const thiefSlot = getLaneSlotRect(1, "me", 0);
        const thiefGhost = ghost(thiefSlot, sampleDemoCardHTML("chucuoi", 1), "g9");
        const avFoe = $id("avFoe");
        if (avFoe && GLFX.ok) {
          const ar = avFoe.getBoundingClientRect();
          GLFX.tether(thiefSlot.x, thiefSlot.y, ar.left + ar.width / 2, ar.top + ar.height / 2, "#ffd65a", 10, 0.2, 0.42);
        }
        playDeckOrHandSteal({
          fromSide: "a",
          toSide: "p",
          toZone: "hand",
          uid: (G && G.hand.p[0] && G.hand.p[0].uid) || -99,
          id: pick
        }, 0);
        setTimeout(() => thiefGhost.remove(), 920);
        break;
      }

      case "stealskill": {
        if (!ensureInMatchForDemo("stealskill")) return;
        const tp = getLaneSlotRect(1, "opp", 2);
        const sp = getLaneSlotRect(1, "me", 0);
        pushOppNotif("HẤP LỰC NỮ ▸ CƯỚP KỸ NĂNG ĐỐI THỦ", "#d46bff");
        const victimGhost = ghost(tp, sampleDemoCardHTML("loithan", 2), "g9");
        const thiefGhost = ghost(sp, sampleDemoCardHTML("haplucnu", 1), "g9 gpu-steal-actor");
        thiefGhost.style.setProperty("--steal-c", "#d46bff");
        thiefGhost.style.zIndex = "34";

        const dx = (tp.x - sp.x) * 0.72, dy = (tp.y - sp.y) * 0.72;
        const outArc = build3DArcFrames({ steps: 22, dx, dy, curve: 42, lift: -26, s0: 1, sMid: 1.24, s1: 1.18, bank: 10, zLift: 46 });
        streamBezierRibbon(sp.x, sp.y, outArc.p1, outArc.p2, outArc.p3, 290, "#d46bff", "#ffffff", 2);
        SFX.play("whoosh");

        thiefGhost.animate(outArc.frames, { duration: 290, easing: "linear", fill: "forwards" }).onfinish = () => {
          FX.slash(tp.x, tp.y, "#d46bff");
          FX.vortex(tp.x, tp.y, "#d46bff", 18);
          GLFX.arc(sp.x + dx, sp.y + dy, tp.x, tp.y, "#ffffff", 9, 1.1, true, 0.26);
          recoil10(victimGhost, sp, tp);
          GLFX.impulseShake(4.8, dx, dy);
          SFX.play("dark");

          setTimeout(() => {
            spawnSoulSiphonOrb(tp, sp, "loithan", "#d46bff", 340, () => {
              FX.wave(sp.x, sp.y, "#d46bff", 78);
              FX.holo(sp.x, sp.y, "#d46bff", 30);
              SFX.play("e_hon");
              pushOppNotif("ĐÃ ĐOẠT KỸ NĂNG: LÔI THẦN!", "#e0b0ff");
            });
            const backArc = build3DArcFrames({ steps: 18, dx: -dx, dy: -dy, curve: -32, lift: -18, s0: 1.18, sMid: 1.06, s1: 1 });
            const backShifted = backArc.frames.map((f) => ({
              offset: f.offset,
              transform: f.transform.replace(
                /translate3d\(([^,]+)px,\s*([^,]+)px,/,
                (_, x, y) => `translate3d(${(dx + parseFloat(x)).toFixed(2)}px, ${(dy + parseFloat(y)).toFixed(2)}px,`
              )
            }));
            thiefGhost.animate(backShifted, { duration: 290, easing: "linear", fill: "forwards" }).onfinish = () => {
              setTimeout(() => {
                thiefGhost.remove();
                victimGhost.remove();
              }, 220);
            };
          }, 95);
        };
        break;
      }

      case "clonecard": {
        if (!ensureInMatchForDemo("clonecard")) return;
        const src = getLaneSlotRect(1, "me", 0);
        const dstA = getLaneSlotRect(0, "me", 1);
        const dstB = getLaneSlotRect(2, "me", 1);
        const html = sampleDemoCardHTML("bachho", 2);
        const baseG = ghost(src, html, "g9");
        SFX.play("chime");
        FX.holo(src.x, src.y, "#3fe0ff", 36);
        pushOppNotif("NHÂN BẢN THẺ ▸ PHÂN TÁCH SANG 2 CHIẾN ĐỊA!", "#3fe0ff");
        [dstA, dstB].forEach((dst, i) => {
          setTimeout(() => {
            const cl = ghost(src, html, "g9");
            const dx = dst.x - src.x, dy = dst.y - src.y;
            const arc = build3DArcFrames({ steps: 22, dx, dy, curve: i === 0 ? -28 : 28, lift: -46, s0: 0.9, sMid: 1.22, s1: 1, bank: i === 0 ? -12 : 12, zLift: 54 });
            streamBezierRibbon(src.x, src.y, arc.p1, arc.p2, arc.p3, 360, "#3fe0ff", "#ffd65a", 2);
            SFX.play("whoosh");
            cl.animate(arc.frames, { duration: 360, easing: "linear", fill: "forwards" }).onfinish = () => {
              SFX.play("summon");
              FX.wave(dst.x, dst.y, "#3fe0ff", 78);
              FX.sparks(dst.x, dst.y, "#ffd65a", 18, 210);
              GLFX.impulseShake(3.2, 0, 1);
              setTimeout(() => cl.remove(), 420);
            };
          }, i * 90);
        });
        setTimeout(() => baseG.remove(), 680);
        break;
      }

      case "silence": {
        if (!ensureInMatchForDemo("silence")) return;
        const tp = getLaneSlotRect(1, "opp", 2);
        const victim = ghost(tp, sampleDemoCardHTML("loithan", 0), "g9");
        SFX.play("silence");
        GLFX.arc(tp.x - 28, tp.y - 34, tp.x + 28, tp.y + 34, "#ff4d7d", 10, 0.5, false, 0.38);
        GLFX.arc(tp.x + 28, tp.y - 34, tp.x - 28, tp.y + 34, "#ff4d7d", 10, 0.5, false, 0.38);
        FX.ring(tp.x, tp.y, "#c45cff", 88, 6);
        FX.vortex(tp.x, tp.y, "#ff4d7d", 22);
        FX.float(tp.x, tp.y - 16, "⊘ CẤM CHIÊU!", "#ff7a9e");
        GLFX.impulseShake(4.8);
        pushOppNotif("PHÁP ẤN TRẦM MẶC ▸ VÔ HIỆU HOÁ KỸ NĂNG!", "#ff7a9e");
        victim.animate([
          { filter: "brightness(2.2) saturate(2)" },
          { transform: "translateX(-5px) rotate(-3deg)", filter: "grayscale(1) brightness(0.7)", offset: 0.35 },
          { transform: "translateX(5px) rotate(3deg)", filter: "grayscale(1) brightness(0.7)", offset: 0.65 },
          { transform: "none", filter: "grayscale(1) brightness(0.75)" }
        ], { duration: 480, fill: "forwards" });
        setTimeout(() => victim.remove(), 820);
        break;
      }

      case "pullcard": {
        if (!ensureInMatchForDemo("pullcard")) return;
        const puller = getLaneSlotRect(2, "me", 0);
        const fromOpp = getLaneSlotRect(0, "opp", 2);
        const toOpp = getLaneSlotRect(2, "opp", 2);
        const gPuller = ghost(puller, sampleDemoCardHTML("huyenquy", 1), "g9");
        const gVictim = ghost(fromOpp, sampleDemoCardHTML("satvuong", 0), "g9");
        SFX.play("chain");
        GLFX.tether(puller.x, puller.y, fromOpp.x, fromOpp.y, "#ff9a2b", 12, 0.25, 0.42);
        pushOppNotif("XÍCH TRÓI HÚT THẺ ▸ KÉO ĐỐI THỦ SANG CHIẾN ĐỊA PHẢI!", "#ffb347");
        setTimeout(() => {
          const dx = toOpp.x - fromOpp.x, dy = toOpp.y - fromOpp.y;
          const arc = build3DArcFrames({ steps: 22, dx, dy, lift: -36, s0: 1, sMid: 1.18, s1: 1, bank: 12, zLift: 44 });
          streamBezierRibbon(fromOpp.x, fromOpp.y, arc.p1, arc.p2, arc.p3, 330, "#ff9a2b", "#ffd65a", 2);
          SFX.play("whoosh");
          gVictim.animate(arc.frames, { duration: 330, easing: "linear", fill: "forwards" }).onfinish = () => {
            SFX.play("place");
            FX.wave(toOpp.x, toOpp.y, "#ff9a2b", 76);
            FX.dust(toOpp.x, toOpp.y + toOpp.h * 0.4, "#ffe2b0");
            GLFX.impulseShake(4.5, 1, 0);
            setTimeout(() => { gPuller.remove(); gVictim.remove(); }, 420);
          };
        }, 140);
        break;
      }

      case "pushcard": {
        if (!ensureInMatchForDemo("pushcard")) return;
        const pusher = getLaneSlotRect(1, "me", 0);
        const fromOpp = getLaneSlotRect(1, "opp", 2);
        const toOpp = getLaneSlotRect(0, "opp", 2);
        const gPusher = ghost(pusher, sampleDemoCardHTML("cuongphong", 2), "g9");
        const gVictim = ghost(fromOpp, sampleDemoCardHTML("satvuong", 0), "g9");
        SFX.play("boom");
        FX.wave(fromOpp.x, fromOpp.y, "#5ad8ff", 95);
        GLFX.arc(pusher.x, pusher.y, fromOpp.x, fromOpp.y, "#7fe8ff", 10, 0.8, false, 0.25);
        pushOppNotif("CUỒNG PHONG CHƯỞNG ▸ ĐẨY VĂNG THẺ ĐỐI THỦ!", "#7fe8ff");
        const dx = toOpp.x - fromOpp.x, dy = toOpp.y - fromOpp.y;
        const arc = build3DArcFrames({ steps: 20, dx, dy, lift: -44, s0: 1, sMid: 1.2, s1: 1, bank: -14, zLift: 48 });
        streamBezierRibbon(fromOpp.x, fromOpp.y, arc.p1, arc.p2, arc.p3, 310, "#5ad8ff", "#ffffff", 2);
        gVictim.animate(arc.frames, { duration: 310, easing: "linear", fill: "forwards" }).onfinish = () => {
          SFX.play("place");
          FX.wave(toOpp.x, toOpp.y, "#5ad8ff", 72);
          GLFX.impulseShake(4.2, -1, 0);
          setTimeout(() => { gPusher.remove(); gVictim.remove(); }, 400);
        };
        break;
      }

      case "morphcard": {
        if (!ensureInMatchForDemo("morphcard")) return;
        const slot = getLaneSlotRect(1, "me", 0);
        const g = ghost(slot, sampleDemoCardHTML("cuhou", 0), "g9");
        SFX.play("morph");
        CFX.morph(g);
        setTimeout(() => {
          const keys = Object.keys(C);
          const nextId = C.phuonghoang ? "phuonghoang" : keys[Math.floor(Math.random() * keys.length)];
          g.innerHTML = sampleDemoCardHTML(nextId, 4);
          FX.wave(slot.x, slot.y, "#ffd65a", 86);
          FX.sparks(slot.x, slot.y, "#d46bff", 22, 240);
          pushOppNotif(`BIẾN HÌNH 3D ▸ HOÁ THÀNH ${(C[nextId] ? C[nextId].n : "THẦN THÚ").toUpperCase()}!`, "#e0b0ff");
        }, 250);
        setTimeout(() => g.remove(), 860);
        break;
      }

      /* ===== NHÓM 3: PHÁ HUỶ & TĂNG GIẢM ĐIỂM ===== */
      case "destroyer": {
        if (!ensureInMatchForDemo("destroyer")) return;
        const boardEl = $id("board");
        const br = boardEl ? boardEl.getBoundingClientRect() : { top: 110, height: 420 };
        SFX.play("laser");
        pushOppNotif("TIA HUỶ DIỆT TOÀN BÀN ▸ QUÉT SẠCH MỌI CHIẾN ĐỊA!", "#ff6a2b");
        const beamEl = document.createElement("div");
        beamEl.className = "gpu-laser-sweep";
        beamEl.style.top = br.top + "px";
        document.body.appendChild(beamEl);
        beamEl.animate([
          { transform: "translateY(0px) scaleY(0.4)", opacity: 0.4 },
          { transform: `translateY(${(br.height * 0.15).toFixed(0)}px) scaleY(1.35)`, opacity: 1, offset: 0.18 },
          { transform: `translateY(${(br.height * 0.85).toFixed(0)}px) scaleY(1.25)`, opacity: 1, offset: 0.82 },
          { transform: `translateY(${br.height.toFixed(0)}px) scaleY(0.3)`, opacity: 0 }
        ], { duration: 540, easing: "cubic-bezier(0.22, 0.8, 0.32, 1)", fill: "forwards" }).onfinish = () => beamEl.remove();

        [0, 1, 2].forEach((li) => {
          setTimeout(() => {
            const sl = getLaneSlotRect(li, li === 1 ? "me" : "opp", li === 1 ? 1 : 2);
            SFX.play("destroy");
            CFX.destroy({ x: sl.x, y: sl.y, w: sl.w, h: sl.h, html: sampleDemoCardHTML(li === 0 ? "satvuong" : li === 1 ? "bachho" : "loithan", 0) });
          }, 95 + li * 115);
        });
        gpuFlash("#ff4d1f", 0.28, 360);
        GLFX.impulseShake(9.5, 0, 1);
        break;
      }

      case "destroy3d": {
        if (!ensureInMatchForDemo("destroy3d")) return;
        const sl = getLaneSlotRect(1, "opp", 2);
        pushOppNotif("KIẾM QUYỀN ▸ CHÉM VỠ THẺ ĐỐI THỦ 6 MẢNH 3D!", "#ff6b8a");
        SFX.play("slash");
        SFX.play("destroy");
        CFX.destroy({ x: sl.x, y: sl.y, w: sl.w, h: sl.h, html: sampleDemoCardHTML("satvuong", 0) });
        break;
      }

      case "summon": {
        if (!ensureInMatchForDemo("summon")) return;
        const sl = getLaneSlotRect(demoLocIdx % 3, "me", 2);
        demoLocIdx++;
        const g = ghost(sl, sampleDemoCardHTML("thanhlong", 4), "g9");
        SFX.play("summon");
        CFX.summon(g, "#3dffb4");
        FX.pillar(sl.x, sl.y + 18, "#3dffb4", 46, 150);
        FX.sparks(sl.x, sl.y, "#7dffb0", 22, 230);
        pushOppNotif("TRIỆU HỒI LINH THÚ ▸ CỔNG PHÙ VĂN TRỖI DẬY!", "#7dffb0");
        setTimeout(() => g.remove(), 820);
        break;
      }

      case "buffpw": {
        if (!ensureInMatchForDemo("buffpw")) return;
        const live = document.querySelector("#board .side.me [data-mc]");
        const sl = getLaneSlotRect(1, "me", 0);
        const target = live || ghost(sl, sampleDemoCardHTML("bachho", 6), "g9");
        const r = target.getBoundingClientRect();
        const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
        SFX.play("buff");
        CFX.buff(target, 6);
        FX.ring(tx, ty, "#3dffb4", 76, 5);
        FX.rise(tx, ty + 14, "#7dffb0", 20);
        FX.float(tx, ty - 18, "+6 SỨC MẠNH", "#5effb8");
        pushOppNotif("CƯỜNG HOÁ LINH LỰC ▸ +6 SỨC MẠNH!", "#5effb8");
        if (!live) setTimeout(() => target.remove(), 740);
        break;
      }

      case "debuffpw": {
        if (!ensureInMatchForDemo("debuffpw")) return;
        const live = document.querySelector("#board .side.opp [data-mc]");
        const sl = getLaneSlotRect(1, "opp", 2);
        const target = live || ghost(sl, sampleDemoCardHTML("satvuong", -4), "g9");
        const r = target.getBoundingClientRect();
        const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
        SFX.play("debuff");
        CFX.debuff(target);
        FX.ring(tx, ty, "#ff4d7d", 72, 5);
        FX.sparks(tx, ty, "#ff4d7d", 20, 220);
        FX.float(tx, ty - 18, "−4 SỨC MẠNH", "#ff6b8a");
        GLFX.impulseShake(3.8);
        pushOppNotif("ÁM KHÍ ĂN MÒN ▸ −4 SỨC MẠNH ĐỐI THỦ!", "#ff6b8a");
        if (!live) setTimeout(() => target.remove(), 720);
        break;
      }

      case "doublepw": {
        if (!ensureInMatchForDemo("doublepw")) return;
        const ln = document.querySelector('#board [data-lane="1"]') || document.querySelector("#board [data-lane]");
        const pwBadge = ln && ln.querySelector(".pw.p");
        const r = (pwBadge || ln).getBoundingClientRect();
        const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
        SFX.play("snap");
        SFX.play("buff");
        FX.rays(tx, ty, "#ffd65a", 125);
        FX.wave(tx, ty, "#ffb32e", 110);
        FX.holo(tx, ty, "#ffd65a", 40);
        FX.float(tx, ty - 22, "×2 TỔNG SỨC MẠNH!", "#ffe37a");
        if (pwBadge) {
          smoothAnim(pwBadge, [
            { transform: "translateX(-50%) scale(1)" },
            { transform: "translateX(-50%) scale(1.65)", filter: "brightness(2)", offset: 0.4 },
            { transform: "translateX(-50%) scale(1.08)" }
          ], { duration: 520 });
        }
        GLFX.impulseShake(5.5);
        pushOppNotif("DUY TRÌ NHÂN ĐÔI ▸ ×2 TỔNG SỨC MẠNH CHIẾN ĐỊA!", "#ffd65a");
        break;
      }

      /* ===== NHÓM 4: HỆ NGUYÊN TỐ & CƯỢC SNAP ===== */
      case "snapcube": {
        const stakes = [["×2", "#b07bff"], ["×4", "#3fe0ff"], ["×8", "#ffd65a"]];
        const [txt, col] = stakes[demoSnapIdx % stakes.length];
        demoSnapIdx++;
        SFX.play("snap");
        if (typeof snapFx === "function") snapFx(col, txt);
        pushOppNotif(`CƯỢC SNAP NHÂN ĐÔI ▸ MỨC CƯỢC LÊN ${txt}!`, col, { allowLobby: true });
        break;
      }

      case "locklane": {
        if (!ensureInMatchForDemo("locklane")) return;
        const ln = document.querySelector(`#board [data-lane="${demoLocIdx % 3}"]`) || document.querySelector("#board [data-lane]");
        demoLocIdx++;
        if (!ln) return;
        const lr = ln.getBoundingClientRect();
        const lx = lr.left + lr.width / 2, ly = lr.top + lr.height / 2;
        SFX.play("chain");
        if (typeof window.playV16 === "function") window.playV16("khoa_dia", lx, ly, Math.max(148, lr.width * 1.15), 620, 0);
        GLFX.arc(lr.left + 6, ly - 55, lr.right - 6, ly + 55, "#59e8ff", 9, 0.35, false, 0.45);
        GLFX.arc(lr.right - 6, ly - 55, lr.left + 6, ly + 55, "#59e8ff", 9, 0.35, false, 0.45);
        FX.wave(lx, ly, "#59e8ff", 110);
        FX.float(lx, ly, "⛓ KHOÁ CHIẾN ĐỊA!", "#9ef4ff");
        GLFX.impulseShake(4.8);
        pushOppNotif("PHONG ẤN KHÔNG GIAN ▸ KHOÁ CỨNG CHIẾN ĐỊA!", "#7fe8ff");
        break;
      }

      case "shieldfx": {
        if (!ensureInMatchForDemo("shieldfx")) return;
        const sl = getLaneSlotRect(1, "me", 0);
        const g = ghost(sl, sampleDemoCardHTML("kimquy", 3), "g9");
        SFX.play("shield");
        if (typeof window.playV16 === "function") window.playV16("khien_chan", sl.x, sl.y, 148, 620, 0);
        FX.ring(sl.x, sl.y, "#ffd65a", 68, 6);
        FX.ring(sl.x, sl.y, "#7fe8ff", 52, 4);
        FX.holo(sl.x, sl.y, "#ffd65a", 34);
        FX.float(sl.x, sl.y - 16, "🛡 BẤT TỬ HỘ THỂ", "#ffe68a");
        pushOppNotif("KHIÊN HỘ THỂ BẤT DIỆT ▸ CHẶN ĐỨNG SÁT THƯƠNG!", "#ffd65a");
        setTimeout(() => g.remove(), 760);
        break;
      }

      case "fire": {
        SFX.play("boom");
        SFX.play("e_lua");
        if (typeof window.playV16 === "function") {
          window.playV16("thieu_dot", cx, cy, 220, 660, 0);
          window.playV16("no_lua", cx, cy, 240, 560, 60);
        }
        FX.pillar(cx, cy + 60, "#ff6a1f", 72, 260);
        FX.wave(cx, cy, "#ff8a2b", 165);
        FX.burst(cx, cy, "#ff5518", 55, 320);
        FX.sparks(cx, cy, "#ffd65a", 45, 380);
        FX.rise(cx, cy + 30, "#ffb02e", 28);
        gpuFlash("#ff6a1f", 0.28, 320);
        GLFX.impulseShake(8.5);
        pushOppNotif("HOẢ NGỤC BÙNG NỔ ▸ THIÊU RỤI CHIẾN ĐỊA!", "#ffd65a", { allowLobby: true });
        break;
      }

      case "thunder": {
        SFX.play("e_sam");
        if (typeof window.playV16 === "function") window.playV16("set_danh", cx, cy, 220, 620, 0);
        const targets = [
          [cx - 115, cy - 45],
          [cx + 115, cy - 35],
          [cx - 95, cy + 80],
          [cx + 105, cy + 75]
        ];
        GLFX.arc(cx, 20, cx, cy, "#7fe8ff", 16, 1.4, true, 0.42);
        FX.wave(cx, cy, "#3fe0ff", 150);
        targets.forEach(([tx, ty], i) => {
          setTimeout(() => {
            SFX.play("e_sam");
            if (typeof window.playV16 === "function") window.playV16(i % 2 ? "no_set" : "set_danh", tx, ty, 136, 500, 0);
            GLFX.arc(cx, cy, tx, ty, i % 2 ? "#b99aff" : "#3fe0ff", 12, 1.3, true, 0.34);
            FX.sparks(tx, ty, "#7fe8ff", 24, 280);
            FX.ring(tx, ty, "#ffffff", 74);
            GLFX.impulseShake(4.8);
          }, 60 + i * 65);
        });
        gpuFlash("#7fe8ff", 0.24, 280);
        pushOppNotif("LÔI THẦN ▸ GIÁNG SÉT LIÊN HOÀN!", "#7fe8ff", { allowLobby: true });
        break;
      }

      case "frost": {
        SFX.play("e_bang");
        if (typeof window.playV16 === "function") {
          window.playV16("dong_bang", cx, cy, 220, 640, 0);
          window.playV16("no_bang", cx, cy, 236, 560, 50);
        }
        FX.wave(cx, cy, "#9ef0ff", 160);
        FX.rays(cx, cy, "#dffaff", 145);
        FX.shards(cx, cy, "#7fe8ff");
        FX.shards(cx, cy, "#ffffff");
        FX.burst(cx, cy, "#5ad8ff", 40, 260);
        gpuFlash("#bff6ff", 0.24, 300);
        GLFX.impulseShake(5.5);
        pushOppNotif("BĂNG VƯƠNG ▸ ĐÓNG BĂNG TUYỆT ĐỐI!", "#bff6ff", { allowLobby: true });
        break;
      }

      case "ult": {
        const s5Keys = Object.keys(C).filter((k) => C[k].h === "S5");
        const pickId = s5Keys[Math.floor(Math.random() * s5Keys.length)] || Object.keys(C)[0];
        ult({ id: pickId, own: "p" });
        setTimeout(() => {
          SFX.play("slash");
          FX.slash(cx, cy, "#ffd65a");
        }, 260);
        break;
      }

      /* ===== NHÓM 5: NHẠC NỀN & TỐC ĐỘ HOẠT ẢNH ===== */
      case "bgm_lobby": {
        if (window.BGM) { store.bgm = true; BGM.play("lobby"); }
        pushOppNotif("NHẠC NỀN SẢNH CHỜ ▸ 92 BPM COSMIC SYNTH!", "#8ceeff", { allowLobby: true });
        break;
      }
      case "bgm_b1": {
        if (window.BGM) { store.bgm = true; BGM.play("battle1"); }
        pushOppNotif("NHẠC CHIẾN ĐẤU LƯỢT 1–3 ▸ 114 BPM CYBER PULSE!", "#3fe0ff", { allowLobby: true });
        break;
      }
      case "bgm_b2": {
        if (window.BGM) { store.bgm = true; BGM.play("battle2"); }
        pushOppNotif("NHẠC CAO TRÀO LƯỢT 4–5 ▸ 116 BPM DRIVING ARP!", "#c45cff", { allowLobby: true });
        break;
      }
      case "bgm_climax": {
        if (window.BGM) { store.bgm = true; BGM.play("climax"); }
        pushOppNotif("NHẠC LƯỢT CUỐI / SNAP ▸ 122 BPM HEROIC CLIMAX!", "#ffd65a", { allowLobby: true });
        break;
      }
      case "bgm_toggle": {
        if (window.BGM) {
          const next = store.bgm === false;
          BGM.toggle(next);
          pushOppNotif(next ? "ĐÃ BẬT NHẠC NỀN TRẬN ĐẤU!" : "ĐÃ TẮT NHẠC NỀN TRẬN ĐẤU!", next ? "#6effc8" : "#ff8a9e", { allowLobby: true });
        }
        break;
      }
      case "spd_fast": {
        if (typeof setSpd10 === "function") setSpd10("nhanh");
        SFX.play("pick");
        pushOppNotif("TỐC ĐỘ HOẠT ẢNH: NHANH (0.78×)!", "#6effc8", { allowLobby: true });
        break;
      }
      case "spd_norm": {
        if (typeof setSpd10 === "function") setSpd10("vua");
        SFX.play("pick");
        pushOppNotif("TỐC ĐỘ HOẠT ẢNH: CHUẨN MARVEL SNAP (1.0×)!", "#3fe0ff", { allowLobby: true });
        break;
      }
      case "spd_slow": {
        if (typeof setSpd10 === "function") setSpd10("cham");
        SFX.play("pick");
        pushOppNotif("TỐC ĐỘ HOẠT ẢNH: CHẬM (1.3×)!", "#ffd65a", { allowLobby: true });
        break;
      }
    }
  }

  buildVfxLab();
  window.VFXLAB = { openLab, toggleLab, runDemo };
})();

/* Tab "🎭 Chiêu Lật" của bảng test (từ 09-card-choreo.js) */
(function () {
  "use strict";

  const $id = (id) => document.getElementById(id);
  const {
    executeChoreoStrike, runPhysicalTether, spawnPaintedBurst, spawnProp, PULL_MAP, PUSH_MAP, getPullKind, getPushKind,
    pickCardSpriteKey, resolveStyle
  } = window.CardChoreo;

  /* ==================== 9. BẢNG TEST ✨ VFX CỐ ĐỊNH: TAB "🎭 CHIÊU LẬT" + CHỌN THỬ TOÀN BỘ 314 THẺ ==================== */
  const CHOREO_DEMOS = [
    ["ch_fist", "🥊 Thiết Quyền Đấm Vỡ Thẻ", true],
    ["ch_arena", "🥋 Lôi Đài Kéo & Đấm KO", true],
    ["ch_dagger", "🗡️ Nón Lá Xoáy Song Chuỷ", true],
    ["ch_bow", "🏹 Cung Thần Mưa Tên Độc", true],
    ["ch_blade", "⚔️ Long Đao Chém Đôi Thẻ", true],
    ["ch_jaws", "🐯 Hồ Tinh Ngoạm Nuốt", true],
    ["ch_claws", "🐾 Tử Trảo Cào 5 Vệt", false],
    ["ch_web", "🕸️ Phi Ti Lang Lưới Tơ", true],
    ["ch_tentacle", "🐙 Bạch Tuộc Xúc Tu Kéo", true],
    ["ch_magnet", "🧲 Nam Châm Đông Sơn Hút", true],
    ["ch_tusks", "🐘 Voi Chiến Ngà Húc Văng", false],
    ["ch_forge", "🔨 Thợ Đúc Đồng Gõ Búa", false]
  ];

  function slotRect(laneIdx, side, idx) {
    const ln = document.querySelector(`#board [data-lane="${laneIdx}"]`) || document.querySelector("#board [data-lane]");
    if (!ln) return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4, w: 54, h: 76 };
    const sls = ln.querySelectorAll(`.side.${side} .slot`);
    const sl = sls[idx || 0] || sls[0] || ln;
    const r = sl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: Math.max(48, r.width), h: Math.max(67, r.height) };
  }

  function demoCardHTML(id, dPw) {
    const k = id && C[id] ? id : Object.keys(C)[0];
    const d = C[k];
    const pw = Math.max(0, d.p + (dPw || 0));
    const cls = dPw > 0 ? "up" : dPw < 0 ? "down" : "";
    return `<button type="button" class="mc q5" style="--hc:${HC[d.h] || "#ffd65a"}">${nbL(k)}${art(k)}<span class="mn">${logo(k)}</span><span class="pwh ${cls}">${pw}</span></button>`;
  }

  function ensureBoardReady(cb) {
    if (typeof reduced !== "undefined" && reduced) {
      store.fx = "on";
      reduced = false;
      document.body.classList.remove("rm");
    }
    const lobby = $id("lobby");
    if (lobby && lobby.classList.contains("on") && typeof newGame === "function") {
      newGame();
      lobby.classList.remove("on");
      if (window.BGM) BGM.syncGame(G);
      render();
      const dr = $id("vfxLabDrawer");
      if (dr) dr.classList.add("on");
      setTimeout(cb, 90);
      return;
    }
    cb();
  }

  function runChoreoPreset(code) {
    ensureBoardReady(() => {
      const sp = slotRect(1, "me", 0);
      const tp = slotRect(1, "opp", 2);

      switch (code) {
        case "ch_fist": {
          const gSrc = ghost(sp, demoCardHTML("thietquyen", 0), "g9");
          const stageR = Object.assign({}, tp, { html: demoCardHTML("giaphuydiet", 0) });
          const gDst = ghost(tp, stageR.html, "g9");
          if (window.pushOppNotif) pushOppNotif("VÕ SƯ ĐÔNG SƠN ▸ THIẾT QUYỀN RỒNG LỬA ĐẤM VỠ MẶT THẺ!", "#ffd65a");
          executeChoreoStrike({
            style: "melee_fist", stepKind: "kill", srcUid: -1, srcId: "thietquyen",
            sp, tp, r0: stageR, srcEl: gSrc, dstEl: gDst,
            onImpact: () => { gDst.remove(); SFX.play("destroy"); CFX.destroy(stageR); }
          });
          setTimeout(() => gSrc.remove(), 880);
          break;
        }
        case "ch_arena": {
          const gSrc = ghost(sp, demoCardHTML("giacdausi", 0), "g9");
          const foeDeck = (typeof DECKZ === "function" && DECKZ("a")) || { x: window.innerWidth * 0.74, y: 34 };
          SFX.play("chain");
          runPhysicalTether({ kind: "hook", srcId: "giacdausi", src: sp, from: foeDeck, to: tp, extendMs: 130, holdMs: 35, pullMs: 285 });
          const pulled = ghost(foeDeck, demoCardHTML("songchuynu", 0), "g9");
          pulled.animate([
            { transform: "translate3d(0,0,0) scale(0.6)" },
            { transform: `translate3d(${(tp.x - foeDeck.x).toFixed(1)}px, ${(tp.y - foeDeck.y).toFixed(1)}px, 0) scale(1)` }
          ], { duration: 365, fill: "forwards" });
          setTimeout(() => {
            pulled.remove();
            const stageR = Object.assign({}, tp, { html: demoCardHTML("songchuynu", 0) });
            const gVictim = ghost(tp, stageR.html, "g9");
            executeChoreoStrike({
              style: "arena_ko", stepKind: "kill", srcUid: -1, srcId: "giacdausi",
              sp, tp, r0: stageR, srcEl: gSrc, dstEl: gVictim, liftMs: 42, flyMs: 225,
              onImpact: () => {
                gVictim.remove(); SFX.play("destroy"); CFX.destroy(stageR);
                if (window.pushOppNotif) pushOppNotif("LÔI ĐÀI CHỦ ▸ MÓC CÂU ĐỒNG KÉO LÊN ĐÀI & ĐẤM HẠ ĐO VÁN!", "#ff7a3d");
              }
            });
          }, 380);
          setTimeout(() => gSrc.remove(), 1160);
          break;
        }
        case "ch_dagger": {
          const gSrc = ghost(sp, demoCardHTML("songchuynu", 0), "g9");
          const stageR = Object.assign({}, tp, { html: demoCardHTML("tinhquyennu", 0) });
          const gDst = ghost(tp, stageR.html, "g9");
          if (window.pushOppNotif) pushOppNotif("SÁT THỦ NÓN LÁ ▸ PHÓNG NÓN LÁ SONG CHUỶ CHÉM ĐỨT ĐÔI THẺ!", "#ff4d6d");
          executeChoreoStrike({
            style: "throw_daggers", stepKind: "kill", srcUid: -1, srcId: "songchuynu", sp, tp, r0: stageR, srcEl: gSrc, dstEl: gDst,
            onImpact: () => { gDst.remove(); SFX.play("destroy"); CFX.destroy(stageR); }
          });
          setTimeout(() => gSrc.remove(), 860);
          break;
        }
        case "ch_bow": {
          const gSrc = ghost(sp, demoCardHTML("docxanu", 0), "g9");
          const targets = [slotRect(0, "opp", 1), slotRect(1, "opp", 2), slotRect(2, "opp", 1)];
          const ghosts = targets.map((t) => ghost(t, demoCardHTML("loithan", -1), "g9"));
          if (window.pushOppNotif) pushOppNotif("ĐỘC TIỄN ▸ GIƯƠNG ĐẠI CUNG TRE NGỌC BẮN MƯA TÊN ĐỘC!", "#6eff7a");
          const center = { x: targets[1].x, y: targets[1].y };
          targets.forEach((t, i) => {
            executeChoreoStrike({
              style: "shoot_venom_bow", stepKind: "down", srcUid: -1, srcId: "docxanu", sp, tp: t, srcEl: gSrc, dstEl: ghosts[i],
              grp: { n: 3, i, c: center },
              onImpact: () => { CFX.debuff(ghosts[i]); FX.float(t.x, t.y - 16, "−1", "#ff7a9a"); }
            });
          });
          setTimeout(() => { gSrc.remove(); ghosts.forEach((g) => g.remove()); }, 920);
          break;
        }
        case "ch_blade": {
          const gSrc = ghost(sp, demoCardHTML("kiemlongnhan", 0), "g9");
          const stageR = Object.assign({}, tp, { html: demoCardHTML("satvuong", 0) });
          const gDst = ghost(tp, stageR.html, "g9");
          if (window.pushOppNotif) pushOppNotif("LONG ĐAO KHÁCH ▸ LƯỚT TÀN ẢNH CHÉM ĐỨT ĐÔI MẶT THẺ!", "#5ce8ff");
          executeChoreoStrike({
            style: "slash_cleave", stepKind: "kill", srcUid: -1, srcId: "kiemlongnhan", sp, tp, r0: stageR, srcEl: gSrc, dstEl: gDst, col: "#5ce8ff",
            onImpact: () => { gDst.remove(); SFX.play("destroy"); CFX.destroy(stageR); }
          });
          setTimeout(() => gSrc.remove(), 880);
          break;
        }
        case "ch_jaws": {
          const srcSlot = slotRect(0, "me", 0);
          const ally = slotRect(1, "me", 0);
          const gSrc = ghost(srcSlot, demoCardHTML("huyetdich", 4), "g9");
          const stageR = Object.assign({}, ally, { html: demoCardHTML("thantien", 0) });
          const gAlly = ghost(ally, stageR.html, "g9");
          if (window.pushOppNotif) pushOppNotif("HỒ TINH CỬU VĨ ▸ HÀM NANH HOÀNG KIM NGOẠM NUỐT HÚT LINH HUYẾT!", "#ff5a3c");
          executeChoreoStrike({
            style: "beast_devour", stepKind: "kill", srcUid: -1, srcId: "huyetdich", sp: srcSlot, tp: ally, r0: stageR, srcEl: gSrc, dstEl: gAlly,
            onImpact: () => {
              gAlly.remove(); SFX.play("destroy"); CFX.destroy(stageR);
              CFX.buff(gSrc, 4); FX.float(srcSlot.x, srcSlot.y - 16, "+4", "#7dffb0");
            }
          });
          setTimeout(() => gSrc.remove(), 960);
          break;
        }
        case "ch_claws": {
          const gSrc = ghost(sp, demoCardHTML("tutraonu", 0), "g9");
          const stageR = Object.assign({}, tp, { html: demoCardHTML("chonphao", 0) });
          const gDst = ghost(tp, stageR.html, "g9");
          if (window.pushOppNotif) pushOppNotif("TỬ TRẢO NỮ ▸ NGŨ TỬ TRẢO CÀO TOẠC MẶT THẺ!", "#ff3b6b");
          executeChoreoStrike({
            style: "claw_rip", stepKind: "kill", srcUid: -1, srcId: "tutraonu", sp, tp, r0: stageR, srcEl: gSrc, dstEl: gDst,
            onImpact: () => { gDst.remove(); SFX.play("destroy"); CFX.destroy(stageR); }
          });
          setTimeout(() => gSrc.remove(), 880);
          break;
        }
        case "ch_web": {
          const puller = slotRect(2, "me", 0);
          const fromOpp = slotRect(0, "opp", 2);
          const toOpp = slotRect(2, "opp", 2);
          const gSrc = ghost(puller, demoCardHTML("nhennhan", 0), "g9");
          const gDst = ghost(fromOpp, demoCardHTML("loithan", 0), "g9");
          SFX.play("web");
          runPhysicalTether({ kind: "web", srcId: "nhennhan", src: puller, from: fromOpp, to: toOpp, extendMs: 185, holdMs: 65, pullMs: 455 });
          setTimeout(() => {
            gDst.animate([
              { transform: "perspective(650px) translate3d(0,0,0) scale(1)" },
              { transform: `perspective(650px) translate3d(${((toOpp.x - fromOpp.x) * 0.52).toFixed(1)}px, ${((toOpp.y - fromOpp.y) * 0.52 - 22).toFixed(1)}px, 42px) rotateZ(-8deg) scale(1.16)`, offset: 0.52 },
              { transform: `perspective(650px) translate3d(${(toOpp.x - fromOpp.x).toFixed(1)}px, ${(toOpp.y - fromOpp.y).toFixed(1)}px, 0) scale(1)` }
            ], { duration: 455, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
          }, 250);
          if (window.pushOppNotif) pushOppNotif("PHI TI LANG ▸ ĐINH BA & LƯỚI TƠ PHA LÊ TRÓI KÉO ĐỐI THỦ!", "#9ef6ff");
          setTimeout(() => { gSrc.remove(); gDst.remove(); }, 920);
          break;
        }
        case "ch_tentacle": {
          const gSrc = ghost(sp, demoCardHTML("batty", 0), "g9");
          const foeHand = (typeof zpt === "function" && zpt("avFoe")) || { x: window.innerWidth * 0.72, y: 38 };
          SFX.play("tentacle");
          runPhysicalTether({ kind: "tentacle", srcId: "batty", src: sp, from: foeHand, to: tp, extendMs: 185, holdMs: 65, pullMs: 445 });
          if (window.pushOppNotif) pushOppNotif("BẠCH TUỘC TINH ▸ SONG XÚC TU TRANH VẼ UỐN LƯỢN LÔI THẺ ĐỊCH!", "#e09eff");
          const gPulled = ghost(foeHand, demoCardHTML("bachho", 0), "g9");
          setTimeout(() => {
            gPulled.animate([
              { transform: "translate3d(0,0,0) scale(0.6)" },
              { transform: `translate3d(${(tp.x - foeHand.x).toFixed(1)}px, ${(tp.y - foeHand.y).toFixed(1)}px, 0) scale(1)` }
            ], { duration: 445, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
          }, 240);
          setTimeout(() => {
            spawnPaintedBurst("no_toi", tp.x, tp.y, 156, "#d580ff", 380);
            spawnPaintedBurst("song_xung", tp.x, tp.y, 162, "#d580ff", 360);
            SFX.play("place");
          }, 680);
          setTimeout(() => { gSrc.remove(); gPulled.remove(); }, 1020);
          break;
        }
        case "ch_magnet": {
          const puller = slotRect(1, "me", 0);
          const fromOpp = slotRect(0, "opp", 1);
          const toOpp = slotRect(1, "opp", 2);
          const gSrc = ghost(puller, demoCardHTML("tunu", 0), "g9");
          const gDst = ghost(fromOpp, demoCardHTML("thietquyen", 0), "g9");
          SFX.play("magnet");
          runPhysicalTether({ kind: "magnet", srcId: "tunu", src: puller, from: fromOpp, to: toOpp, extendMs: 185, holdMs: 65, pullMs: 450 });
          setTimeout(() => {
            gDst.animate([
              { transform: "translate3d(0,0,0)" },
              { transform: `translate3d(${(toOpp.x - fromOpp.x).toFixed(1)}px, ${(toOpp.y - fromOpp.y).toFixed(1)}px, 0)` }
            ], { duration: 445, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
          }, 245);
          if (window.pushOppNotif) pushOppNotif("NAM CHÂM TIÊN ▸ NAM CHÂM ĐÔNG SƠN PHÓNG HỒ QUANG HÚT THẺ!", "#5ad8ff");
          setTimeout(() => { gSrc.remove(); gDst.remove(); }, 920);
          break;
        }
        case "ch_tusks": {
          const gSrc = ghost(sp, demoCardHTML("batkhacan", 0), "g9");
          const toOpp = slotRect(2, "opp", 2);
          const gDst = ghost(tp, demoCardHTML("satvuong", 0), "g9");
          SFX.play("horn");
          const impactProp = spawnProp("batkhacan", tp.x - 18, tp.y, 172, 134, "#ffb84d", 42);
          impactProp.animate([
            { transform: "translateX(-28px) scale(0.55)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
            { transform: "translateX(10px) scale(1.28)", opacity: 1, offset: 0.22 },
            { transform: "translateX(18px) scale(1.22)", opacity: 1, offset: 0.84 },
            { transform: "translateX(30px) scale(1.02)", opacity: 0 }
          ], { duration: 440, easing: "linear", fill: "forwards" }).onfinish = () => impactProp.remove();
          spawnPaintedBurst("song_xung", tp.x, tp.y, 172, "#ffb84d", 360);
          spawnPaintedBurst("no_sang", tp.x, tp.y, 152, "#ffd65a", 380);
          gDst.animate([
            { transform: "translate3d(0,0,0)" },
            { transform: `translate3d(${((toOpp.x - tp.x) * 0.55).toFixed(1)}px, ${(toOpp.y - tp.y - 30).toFixed(1)}px, 0) rotate(12deg) scale(1.14)`, offset: 0.55 },
            { transform: `translate3d(${(toOpp.x - tp.x).toFixed(1)}px, ${(toOpp.y - tp.y).toFixed(1)}px, 0)` }
          ], { duration: 450, fill: "forwards" });
          if (window.GLFX) GLFX.impulseShake(6.8, 1, 0);
          if (window.pushOppNotif) pushOppNotif("VOI CHIẾN CHÍN NGÀ ▸ NGÀ VÀNG ĐÔNG SƠN HÚC VĂNG ĐỐI THỦ!", "#ffb84d");
          setTimeout(() => { gSrc.remove(); gDst.remove(); }, 880);
          break;
        }
        case "ch_forge": {
          const srcSlot = slotRect(0, "me", 0);
          const ally = slotRect(1, "me", 0);
          const gSrc = ghost(srcSlot, demoCardHTML("thoren", 0), "g9");
          const gAlly = ghost(ally, demoCardHTML("kiemsu", 2), "g9");
          if (window.pushOppNotif) pushOppNotif("THỢ ĐÚC ĐỒNG ĐÔNG SƠN ▸ BÚA RÈN NẶNG LỬA CỘNG +2 SỨC MẠNH!", "#ffb02e");
          executeChoreoStrike({
            style: "forge_strike", stepKind: "up", srcUid: -1, srcId: "thoren", sp: srcSlot, tp: ally, srcEl: gSrc, dstEl: gAlly,
            onImpact: () => { CFX.buff(gAlly, 2); FX.float(ally.x, ally.y - 16, "+2", "#7dffb0"); }
          });
          setTimeout(() => { gSrc.remove(); gAlly.remove(); }, 950);
          break;
        }
      }
    });
  }

  function previewSpecificCard(cardId) {
    if (!cardId || !C[cardId]) return;
    ensureBoardReady(() => {
      const d = C[cardId];
      const txt = (d.x || "").toLowerCase();
      const sp = slotRect(1, "me", 0);
      const tpOpp = slotRect(1, "opp", 2);
      const tpAlly = slotRect(2, "me", 0);
      const gSrc = ghost(sp, demoCardHTML(cardId, 0), "g9");

      const isPullCard = PULL_MAP[cardId] || /kéo|di chuyển .* đến chiến địa này|dời .* về chiến địa này|di chuyển .* đến đây/.test(txt);
      const isPushCard = !isPullCard && (PUSH_MAP[cardId] || /di chuyển .* sang|dời .* sang|đi nơi khác/.test(txt));

      if (isPullCard) {
        const pk = getPullKind(cardId);
        const fromPt = cardId === "batty" ? ((typeof zpt === "function" && zpt("avFoe")) || slotRect(0, "opp", 1))
          : cardId === "linhtuonglai" ? ((typeof DECKZ === "function" && DECKZ("a")) || slotRect(0, "opp", 1))
          : slotRect(0, "opp", 1);
        const gDst = ghost(fromPt, demoCardHTML("loithan", 0), "g9");
        SFX.play(pk === "web" || pk === "silk" ? "web" : pk === "magnet" ? "magnet" : pk === "tentacle" || pk === "blood_tentacle" ? "tentacle" : "chain");
        runPhysicalTether({ kind: pk, srcId: cardId, src: sp, from: fromPt, to: tpOpp, extendMs: 185, holdMs: 65, pullMs: 450 });
        setTimeout(() => {
          gDst.animate([
            { transform: "translate3d(0,0,0)" },
            { transform: `translate3d(${(tpOpp.x - fromPt.x).toFixed(1)}px, ${(tpOpp.y - fromPt.y).toFixed(1)}px, 0)` }
          ], { duration: 450, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
        }, 245);
        if (window.pushOppNotif) pushOppNotif(`${d.n.toUpperCase()} ▸ HOẠT CẢNH KÉO TRANH VẼ RIÊNG (${pk.toUpperCase()})!`, "#7fe8ff");
        setTimeout(() => { gSrc.remove(); gDst.remove(); }, 940);
        return;
      }

      if (isPushCard) {
        const pushK = getPushKind(cardId);
        const toLane = slotRect(2, "opp", 2);
        const gDst = ghost(tpOpp, demoCardHTML("satvuong", 0), "g9");
        SFX.play(pushK === "tusks" ? "horn" : pushK === "blade_knock" ? "slash" : pushK === "wind_gust" ? "e_gio" : pushK === "chess" ? "pick" : "punch");
        const pushSprite = pushK === "punch_water" ? "quyen_nuoc"
          : pushK === "blade_knock" ? pickCardSpriteKey(cardId, "kiemlongnhan", ["quet", "phong"])
          : pushK === "tusks" ? pickCardSpriteKey(cardId, "batkhacan", ["quet", "phong"])
          : pushK === "chess" ? "quan_co"
          : pushK === "wind_gust" ? (cardId === "thukieu" ? "thukieu" : "phongnu")
          : "nam_dam_lua";
        const mdx = toLane.x - tpOpp.x, mdy = toLane.y - tpOpp.y;
        const p = spawnProp(pushSprite, tpOpp.x - (pushK === "chess" ? 0 : 18), tpOpp.y - (pushK === "chess" ? 22 : 0), pushK === "chess" ? 152 : 168, pushK === "chess" ? 152 : 138, "#ffd65a", 42);
        if (pushK === "chess") {
          p.animate([
            { transform: "translate3d(0, -28px, 0) scale(0.45)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
            { transform: "translate3d(0, 0px, 0) scale(1.22)", opacity: 1, offset: 0.20 },
            { transform: `translate3d(${mdx.toFixed(1)}px, ${(mdy - 24).toFixed(1)}px, 0) scale(1.26)`, opacity: 1, offset: 0.86 },
            { transform: `translate3d(${mdx.toFixed(1)}px, ${mdy.toFixed(1)}px, 0) scale(0.92)`, opacity: 0 }
          ], { duration: 580, easing: "linear", fill: "forwards" }).onfinish = () => p.remove();
        } else {
          p.animate([
            { transform: "translateX(-28px) scale(0.55)", opacity: 0, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
            { transform: "translateX(10px) scale(1.28)", opacity: 1, offset: 0.20 },
            { transform: "translateX(18px) scale(1.22)", opacity: 1, offset: 0.85 },
            { transform: "translateX(30px) scale(0.95)", opacity: 0 }
          ], { duration: 520, easing: "linear", fill: "forwards" }).onfinish = () => p.remove();
        }
        spawnPaintedBurst("song_xung", tpOpp.x, tpOpp.y, 164, "#ffd65a", 360);
        gDst.animate([
          { transform: "translate3d(0,0,0)" },
          { transform: `translate3d(${(mdx * 0.55).toFixed(1)}px, ${(mdy - 28).toFixed(1)}px, 0) rotate(11deg)`, offset: 0.55 },
          { transform: `translate3d(${mdx.toFixed(1)}px, ${mdy.toFixed(1)}px, 0)` }
        ], { duration: 480, fill: "forwards" });
        if (window.pushOppNotif) pushOppNotif(`${d.n.toUpperCase()} ▸ HOẠT CẢNH ĐẨY TRANH VẼ RIÊNG (${pushK.toUpperCase()})!`, "#ffd65a");
        setTimeout(() => { gSrc.remove(); gDst.remove(); }, 920);
        return;
      }

      if (/vứt bỏ/.test(txt)) {
        const foeDisc = /đối thủ|địch/.test(txt) && !/tay bạn/.test(txt);
        const hz = foeDisc
          ? (typeof zpt === "function" ? (zpt("oppSub") || zpt("avFoe")) : null)
          : (typeof zpt === "function" ? zpt("hand") : null);
        const tpD = hz
          ? { x: hz.x, y: foeDisc ? hz.y + 28 : hz.y - 8, w: 54, h: 76, html: demoCardHTML(foeDisc ? "satvuong" : "cuongnhan", 0) }
          : Object.assign({}, tpOpp, { html: demoCardHTML("satvuong", 0) });
        const gDisc = ghost(tpD, tpD.html, "g9");
        const stD = resolveStyle(cardId, "kill");
        if (window.pushOppNotif) pushOppNotif(`${d.n.toUpperCase()} ▸ CHÉM VỨT BỎ BÀI ${foeDisc ? "ĐỐI PHƯƠNG" : "TRÊN TAY"}!`, "#ff9a4d");
        executeChoreoStrike({
          style: stD,
          stepKind: "kill",
          srcUid: -1,
          srcId: cardId,
          sp,
          tp: tpD,
          r0: tpD,
          srcEl: gSrc,
          dstEl: gDisc,
          liftMs: 35,
          flyMs: 195,
          onImpact: () => {
            gDisc.remove();
            SFX.play("destroy");
            if (typeof CFX !== "undefined" && CFX.burn) CFX.burn(tpD);
            FX.float(tpD.x, tpD.y - 18, "VỨT BỎ!", "#ff9a4d");
          }
        });
        setTimeout(() => { gSrc.remove(); if (gDisc.isConnected) gDisc.remove(); }, 860);
        return;
      }

      const stepKind = /tiêu huỷ/.test(txt) ? "kill"
        : /mất kỹ năng|xoá kỹ năng|vô hiệu/.test(txt) ? "sil"
        : /sao chép|bản sao/.test(txt) ? "copy"
        : /(−|-\d|trừ \d|giảm \d)/.test(txt) ? "down"
        : /triệu hồi|thêm .* vào chiến địa|hồi sinh/.test(txt) ? "summon"
        : "up";
      const targetFriendly = stepKind === "up" || stepKind === "summon" || (/bạn tại đây/.test(txt) && stepKind === "kill");
      const tp = targetFriendly ? tpAlly : tpOpp;
      const stageR = Object.assign({}, tp, { html: demoCardHTML(targetFriendly ? "kiemsu" : "satvuong", stepKind === "up" ? 3 : stepKind === "down" ? -2 : 0) });
      const gDst = ghost(tp, stageR.html, "g9");
      const st = resolveStyle(cardId, stepKind);

      if (window.pushOppNotif) pushOppNotif(`${d.n.toUpperCase()} ▸ DIỄN CHIÊU LẬT TRANH VẼ (${st.toUpperCase()})!`, "#ffd65a");
      executeChoreoStrike({
        style: st,
        stepKind,
        srcUid: -1,
        srcId: cardId,
        sp,
        tp,
        r0: stageR,
        srcEl: gSrc,
        dstEl: gDst,
        onImpact: () => {
          if (stepKind === "kill") {
            gDst.remove();
            SFX.play("destroy");
            CFX.destroy(stageR);
          } else if (stepKind === "down") {
            CFX.debuff(gDst);
            FX.float(tp.x, tp.y - 16, "−2", "#ff7a9a");
          } else if (stepKind === "up") {
            CFX.buff(gDst, 3);
            FX.float(tp.x, tp.y - 16, "+3", "#7dffb0");
          } else if (stepKind === "summon") {
            CFX.summon(gDst, "#7dffb0");
          }
        }
      });
      setTimeout(() => { gSrc.remove(); if (gDst.isConnected) gDst.remove(); }, 940);
    });
  }

  function mountChoreoLabTab() {
    const drawer = $id("vfxLabDrawer");
    const tabs = $id("vlTabs");
    const grid = $id("vlGrid");
    if (!drawer || !tabs || !grid || drawer.dataset.choreoMounted) return;
    drawer.dataset.choreoMounted = "1";

    const tabBtn = document.createElement("button");
    tabBtn.type = "button";
    tabBtn.className = "vl-tab";
    tabBtn.dataset.vtab = "choreo";
    tabBtn.textContent = "🎭 Chiêu Lật";
    tabs.insertBefore(tabBtn, tabs.firstChild);

    const cardBar = document.createElement("div");
    cardBar.className = "vl-cardbar";
    cardBar.id = "vlCardBar";
    cardBar.hidden = true;

    const revCards = Object.values(typeof C !== "undefined" ? C : {})
      .filter((c) => c && (c.t === "rev" || c.t === "act"))
      .sort((a, b) => a.n.localeCompare(b.n, "vi"));

    const priorityIds = [
      "thietquyen", "quyensu", "thuytoquyen", "giacdausi", "songchuynu", "docxanu",
      "kiemlongnhan", "kiemsu", "kiemnuuminh", "huyetdich", "bachho", "tutraonu",
      "nhennhan", "batty", "linhtuonglai", "tunu", "phongnu", "thukieu",
      "batkhacan", "kychu", "satvuong", "nuloithan", "loithan", "baithu",
      "camvuong", "mehoacnu", "xucgiacnu", "bachhau", "thoren", "tinhquyennu",
      "chonphao", "cohoang", "tasu"
    ].filter((id) => C[id]);

    const optStar = priorityIds
      .map((id) => `<option value="${id}">★ ${C[id].n} (${C[id].t === "act" ? "Kích Hoạt" : "Lật"})</option>`)
      .join("");
    const optAll = revCards
      .filter((c) => !priorityIds.includes(c.id))
      .map((c) => `<option value="${c.id}">${c.n} (${c.t === "act" ? "KH" : "Lật"})</option>`)
      .join("");

    cardBar.innerHTML = `
      <select class="vl-sel" id="vlCardSelect" aria-label="Chọn thẻ Lật hoặc Kích Hoạt để test hoạt cảnh riêng">
        <optgroup label="★ Các Thẻ Chiêu Tranh Vẽ Tiêu Biểu">${optStar}</optgroup>
        <optgroup label="Toàn Bộ Thẻ Lật & Kích Hoạt (${revCards.length} thẻ)">${optAll}</optgroup>
      </select>
      <button type="button" class="vl-fire-card" id="vlFireCardBtn">▶ Diễn Thử</button>
    `;
    grid.parentNode.insertBefore(cardBar, grid);

    const activateChoreoTab = () => {
      drawer.classList.remove("min");
      const minBtn = $id("vlMin");
      if (minBtn) minBtn.textContent = "▾ Thu gọn";
      tabs.querySelectorAll(".vl-tab").forEach((b) => b.classList.toggle("on", b === tabBtn));
      cardBar.hidden = false;
      grid.innerHTML = CHOREO_DEMOS
        .map(([k, lbl, feat]) => `<button type="button" class="vl-btn${feat ? " vl-feat" : ""}" data-choreo="${k}">${lbl}</button>`)
        .join("");
    };

    drawer.addEventListener("click", (ev) => {
      const tBtn = ev.target.closest("[data-vtab]");
      if (tBtn) {
        if (tBtn.dataset.vtab === "choreo") {
          ev.stopPropagation();
          SFX.play("tap");
          activateChoreoTab();
        } else {
          cardBar.hidden = true;
        }
        return;
      }
      const cBtn = ev.target.closest("[data-choreo]");
      if (cBtn) {
        ev.stopPropagation();
        SFX.wake();
        cBtn.classList.remove("vl-fired");
        void cBtn.offsetWidth;
        cBtn.classList.add("vl-fired");
        setTimeout(() => cBtn.classList.remove("vl-fired"), 360);
        runChoreoPreset(cBtn.dataset.choreo);
        return;
      }
      if (ev.target.closest("#vlFireCardBtn")) {
        ev.stopPropagation();
        SFX.wake();
        const sel = $id("vlCardSelect");
        if (sel && sel.value) previewSpecificCard(sel.value);
      }
    }, true);

    activateChoreoTab();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountChoreoLabTab);
  } else {
    mountChoreoLabTab();
  }

  window.CardChoreo.runChoreoPreset = runChoreoPreset;
  window.CardChoreo.previewSpecificCard = previewSpecificCard;
})();

/* bảng vừa được dựng: ép tính style một lần để lần mở đầu tiên vẫn có hiệu ứng mờ dần (opacity transition) như khi dựng sẵn */
void document.getElementById("vfxLabDrawer").offsetWidth;
