/* Bảng Test VFX (dev) — gpu68-lab: MỌI màn diễn chạy qua ĐÚNG đường ống trận thật.
   Không còn hoạt ảnh "tấn công" dựng tay: chọn một thẻ -> bảng dựng một thế cờ (thẻ ta / thẻ địch tại chiến địa, tay, đỉnh bộ bài,
   mộ, bài vứt) rồi bấm "Kết thúc lượt" thật (endTurnUI): engine chạy kỹ năng thật của thẻ, giao diện diễn bằng đúng các module
   đang dùng trong game (lật S1–S3 kiểu cũ, PA6 Hồn Xuất, HX-02..20, RB-B rút bài, DT-B Duy Trì, ấn ký riêng SIGK).
   - Thế cờ được CHỌN BẰNG MÔ PHỎNG ENGINE: với mỗi thẻ thử nhiều cách dựng (đặt từ tay, đã nằm trên bàn rồi đặt thêm thẻ, Kích Hoạt,
     bị tiêu huỷ, bị vứt bỏ, di chuyển, địch di chuyển tới, địch đặt thẻ, nằm đỉnh bộ bài, Đầu Ván...), mỗi cách chạy 2 lần trên bản
     sao ván (kỹ năng bật / kỹ năng bị xoá) — khác biệt giữa 2 lần = tác dụng thật của kỹ năng. Lấy cách đầu tiên có tác dụng.
     Thẻ có kỹ năng không tác động thẻ khác thì thế cờ không bày mục tiêu giả và ghi rõ trong nhật ký.
   - Chế độ Kiểm tra (audit): chọn Bậc -> diễn lần lượt mọi thẻ của bậc đó (tạm dừng / trước / sau / tốc độ / nhảy tới thẻ),
     ghi lại sự kiện engine, các mốc HX_TAP / PA6_TAP / SIG_TAP / CFX đã bật, cảnh báo, lỗi; xuất JSON.
   Nạp lười từ 08-vfx-webgl.js (Cài đặt > Nâng cao > "Mở Bảng Test Hiệu Ứng"). Phần PLAN (thuần engine) chạy được trong Node. */
(function (root) {
  "use strict";

  /* =========================================================================================
     PHẦN 1 — PLAN: dựng thế cờ + mô phỏng engine (không đụng DOM)
     ========================================================================================= */
  const PLAN = (function (E) {
    const C = E.C;
    const LANE = 1;
    const VAN = { c1: "taymaynu", c2: "chanthu", c3: "docnhan", c4: "thachquai", c5: "quaituong", c6: "cuongnhan" };
    const H = { killOwn: "xacmay", discR: "daothosan", pullHi: "diphapsu", buffTop: "tinhquyennu", buffAlly: "thaphoan", moveFoeR: "kiemlongnhan", onCard: "kiengiap", revCard: "thoren", endCard: "thaphoankhaimo" };
    const DECK = [VAN.c2, VAN.c5, VAN.c3, VAN.c1, VAN.c4, VAN.c2, VAN.c6, VAN.c3, VAN.c1, VAN.c2];
    const TIERS = Object.keys(E.HE);
    const tierName = (h) => E.HE[h] || h;
    const typeName = (t) => E.DANG[t] || t;
    const txt = (id) => (C[id] && C[id].x) || "";

    /* ---------- thế cờ cơ bản ---------- */
    function baseSpec() {
      return {
        lane: LANE, turn: 3, loc: ["meadow", "meadow", "meadow"],
        own: [[VAN.c2, LANE], [H.buffAlly, LANE], [VAN.c1, 0], [H.onCard, 0], [VAN.c3, 2], [H.endCard, 2]],
        foe: [[VAN.c1, LANE, { cr: 1 }], [VAN.c6, LANE], [H.onCard, LANE], [VAN.c3, 0], [VAN.c2, 0, { bonus: -1 }], [VAN.c4, 2]],
        hand: [VAN.c2, H.revCard, VAN.c1],
        foeHand: [VAN.c2, VAN.c6],
        deck: DECK.slice(), top: [],
        dead: [VAN.c4, VAN.c3], foeDead: [VAN.c3], disc: [VAN.c1], foeDisc: [VAN.c2],
        subj: { at: "hand" }, pre: [], plays: [], foePlays: [], act: false, move: null, next: null
      };
    }
    const S = (o) => Object.assign(baseSpec(), o);

    /* các cách dựng (k = mã, n = tên hiển thị) */
    function allCands(id) {
      const d = C[id], L = LANE, out = [], x0 = txt(id);
      const add = (k, n, o) => out.push({ k, n, spec: S(o) });
      add("hand", "Đặt từ tay", { subj: { at: "hand" } });
      add("act", "Đã trên bàn · Kích Hoạt", { subj: { at: "board", li: L }, act: true });
      for (const [hk, hid] of [["v", VAN.c2], ["big", VAN.c6], ["c3", VAN.c3], ["c4", VAN.c4], ["rev", H.revCard], ["on", H.onCard]])
        add("board+" + hk, "Đã trên bàn · đặt thêm " + C[hid].n, { subj: { at: "board", li: L }, plays: [[hid, L]] });
      add("board+else", "Đã trên bàn · đặt thẻ ở chiến địa khác", { subj: { at: "board", li: L }, plays: [[VAN.c3, 0]] });
      add("board", "Đã trên bàn (Đầu/Cuối Lượt)", { subj: { at: "board", li: L }, plays: [] });
      add("dead:self", "Bị tiêu huỷ trên bàn", { subj: { at: "board", li: L }, plays: [[H.killOwn, L]] });
      add("dead:ally", "Thẻ ta khác bị tiêu huỷ", { subj: { at: "board", li: 0 }, plays: [[H.killOwn, L]] });
      add("dead:ally-hand", "Thẻ ta bị tiêu huỷ (thẻ trên tay)", { subj: { at: "hand", keep: 1 }, plays: [[H.killOwn, L]] });
      add("disc:self", "Bị vứt bỏ khỏi tay", { subj: { at: "handR" }, plays: [[H.discR, L]] });
      add("disc:you", "Bạn vứt bỏ một thẻ", { subj: { at: "board", li: 0 }, plays: [[H.discR, L]] });
      add("move:self", "Tự di chuyển", { subj: { at: "board", li: L }, move: 2 });
      add("move:pull", "Bị kéo sang chiến địa khác", { subj: { at: "board", li: L, bp: 30 }, plays: [[H.pullHi, 2]] });
      add("move:ally", "Thẻ ta di chuyển", { subj: { at: "board", li: 2 }, own: [[VAN.c2, L], [VAN.c1, 0], [VAN.c6, L, { bp: 30 }]], plays: [[H.pullHi, 2]] });
      add("move:foe", "Thẻ địch di chuyển tới", { lane: 2, subj: { at: "board", li: 2 }, plays: [[H.moveFoeR, 1]] });
      add("foe:play", "Địch đặt thẻ tại đây", { subj: { at: "board", li: L }, foePlays: [[VAN.c3, L]] });
      add("foe:on", "Địch đặt thẻ Duy Trì tại đây", { subj: { at: "board", li: L }, foePlays: [[H.onCard, L]] });
      add("top", "Nằm đỉnh bộ bài (được rút / cường hoá)", { subj: { at: "top" }, plays: [[H.buffTop, L]] });
      add("buff", "Được cường hoá trên bàn", { subj: { at: "board", li: L }, plays: [[H.buffAlly, L]] });
      add("hand+foe", "Đặt từ tay · địch đặt thẻ cùng chiến địa", { subj: { at: "hand" }, foePlays: [[VAN.c3, L]] });
      add("hand+pre", "Đặt từ tay sau một thẻ Lật", { subj: { at: "hand" }, pre: [[H.revCard, 0]] });
      add("hand+pre-on", "Đặt từ tay sau một thẻ Duy Trì", { subj: { at: "hand" }, pre: [[H.onCard, 2]] });
      add("hand+next", "Đặt từ tay rồi đặt thêm thẻ", { subj: { at: "hand" }, plays: [[VAN.c2, L], [VAN.c4, 2]] });
      add("next:play", "Lượt sau đặt thẻ cùng chiến địa", { subj: { at: "hand" }, next: { plays: [[VAN.c2, L]] } });
      add("next:idle", "Lượt sau không đặt thẻ", { subj: { at: "hand" }, next: { plays: [] } });
      add("solo", "Thẻ duy nhất của bạn tại đây", { subj: { at: "hand" }, own: [[VAN.c1, 0], [VAN.c3, 0]] });
      add("full", "Phía bạn tại đây đầy", { subj: { at: "hand" }, own: [[VAN.c2, L], [VAN.c1, L], [VAN.c3, L], [VAN.c4, 0]], foe: [[VAN.c1, L], [VAN.c6, L], [VAN.c3, L], [VAN.c2, L], [VAN.c4, 2]] });
      add("emptyhand", "Tay gần trống", { subj: { at: "hand" }, hand: [] });
      add("spent", "Dùng hết năng lượng", { subj: { at: "hand" }, spend: 1 });
      add("foeE", "Đối thủ còn năng lượng", { subj: { at: "hand" }, foeE: 3 });
      add("spent:board", "Trên bàn · dùng hết năng lượng", { subj: { at: "board", li: L }, plays: [[VAN.c2, 0]], spend: 1 });
      const refs = Object.keys(C).filter((k) => k !== id && C[k].n.length > 3 && x0.includes(C[k].n)).slice(0, 2);
      if (refs.length) {
        add("ref", "Có " + refs.map((k) => C[k].n).join(", ") + " trên bàn", { subj: { at: "hand" }, own: [[refs[0], L], [VAN.c1, 0]].concat(refs[1] ? [[refs[1], 2]] : []) });
        add("ref:deck", "Có " + refs.map((k) => C[k].n).join(", ") + " trong bộ bài", { subj: { at: "hand" }, deck: DECK.concat(refs) });
      }
      add("hand:idle", "Nằm trên tay", { subj: { at: "hand", keep: 1 }, plays: [[VAN.c3, L]] });
      if (d && d.t === "start") add("start", "Đầu Ván (bộ bài có thẻ này)", { subj: { at: "hand" }, start: 1 });
      for (const [k, n, o] of XTRA[id] || []) add("x:" + k, n, o);
      return out;
    }
    /* thế cờ RIÊNG cho thẻ có điều kiện mà các cách dựng chung không chạm tới (gpu68-audit2).
       tw(G, subj) chỉnh ván ngay trước khi xếp hàng; mv: [[li, ix, to]] = thẻ ta ở (li, ix) dời sang to. */
    const L1 = LANE, V = VAN;
    const XTRA = {
      nuhondoc: [["full", "Trên bàn · đặt thẻ làm đầy phía bạn", { subj: { at: "board", li: L1 }, own: [[V.c2, L1], [V.c1, L1], [V.c3, 0]], plays: [[V.c3, L1]] }]],
      manhkiemquy: [["mh", "Có Móng Hoang trên bàn · bị vứt bỏ", { subj: { at: "handR" }, own: [["monghoang", L1], [V.c1, 0]], plays: [[H.discR, 0]] }]],
      tenmoc: [["next", "Đặt từ tay rồi đặt thẻ ở chiến địa khác", { subj: { at: "hand" }, plays: [[V.c2, 0]] }]],
      datam: [["deck", "Bộ bài có Đá Vô Cực", { subj: { at: "hand" }, deck: DECK.concat(["dathuc", "dahon"]) }]],
      daluc: [["bv", "Bá Vương Tím trên bàn · đã đặt 5 viên Đá", { subj: { at: "hand" }, own: [["bavuongtim", L1], [V.c1, 0]], tw: (G) => { G.stones.p = 5; } }]],
      cucquangung: [["loc", "Chiến địa có hiệu ứng (Long Cung)", { subj: { at: "hand" }, loc: ["meadow", "longcung", "meadow"] }]],
      cucquanggau: [["loc", "Chiến địa có hiệu ứng lộ diện (Hang Ổ)", { subj: { at: "hand" }, loc: ["meadow", "den", "meadow"] }]],
      daodo: [["on", "Có thẻ Duy Trì của bạn tại đây", { subj: { at: "hand" }, own: [[H.onCard, L1], [V.c2, L1], [V.c1, 0]] }]],
      nhasuutam: [["tohand", "Trên bàn · thẻ được thêm vào tay", { subj: { at: "board", li: L1 }, plays: [["tuyetve", 0]] }]],
      vohannhan: [["blk", "Lượt trước đã đặt thẻ (bị cấm đặt)", { subj: { at: "hand" } }]],
      mieunuot: [["next4", "Lượt sau đặt thẻ 4 năng lượng tại đây", { subj: { at: "hand" }, next: { plays: [[V.c4, L1]] } }]],
      phuongtamnu: [["next0", "Lượt sau đặt thẻ ở chiến địa khác", { subj: { at: "hand" }, next: { plays: [[V.c2, 0]] } }]],
      quanthoigian: [["cm", "Tay có thẻ bị tăng/giảm năng lượng", { subj: { at: "hand" }, tw: (G) => { G.hand.p.forEach((c) => (c.cm = 2)); G.hand.a.forEach((c) => (c.cm = -1)); } }]],
      nhentre: [["mv", "Nằm trên tay · có thẻ di chuyển lượt này", { subj: { at: "hand", keep: 1 }, own: [[V.c6, 0], [V.c1, L1]], plays: [[H.pullHi, 2]] }]],
      cuocthu: [["mv", "Trên bàn · thẻ ta khác di chuyển", { subj: { at: "board", li: 0 }, own: [[V.c6, L1], [V.c1, 0]], plays: [[H.pullHi, 2]] }]],
      nuloithan: [["deck0", "Bộ bài có thẻ 0 năng lượng", { subj: { at: "hand" }, deck: DECK.concat(["ongnu"]).concat(DECK.slice(0, 2)) }]],
      bongma: [["end", "Có thẻ Cuối Lượt tại đây", { subj: { at: "hand" }, own: [[V.c2, L1], [H.endCard, L1], [V.c1, 0]], foe: [[V.c1, L1], [H.endCard, L1], [V.c3, 0], [V.c4, 2]] }]],
      maynuotthoigian: [["prio", "Bạn lật trước · địch đặt thẻ tại đây", { subj: { at: "hand" }, own: [[V.c6, 0], [V.c6, 2], [V.c2, L1]], foe: [[V.c1, L1], [V.c1, 0]], foePlays: [["thoren", L1]] }]],
      thachlucnu: [["kill", "Thẻ 1 và 6 năng lượng của bạn bị tiêu huỷ", { subj: { at: "board", li: 0 }, own: [[V.c1, L1], [V.c6, L1], [V.c2, 2]], plays: [[H.killOwn, L1]] }]],
      kenuotsao: [["solo", "Thẻ duy nhất của bạn tại đây · địch trống", { subj: { at: "hand" }, own: [[V.c1, 0], [V.c3, 2]], foe: [[V.c1, 0], [V.c2, 2]] }]],
      chienthan: [["top", "Đỉnh bộ bài của bạn mạnh hơn", { subj: { at: "hand" }, deck: DECK.concat([V.c6, V.c5, V.c6]) }]],
      duclongnhan: [["deck", "Bộ bài có thẻ Duy Trì", { subj: { at: "hand" }, deck: DECK.concat([H.onCard, H.onCard]) }]],
      phiconamcanh: [["cr", "Tay có thẻ được tạo ra", { subj: { at: "hand" }, tw: (G) => { G.hand.p.forEach((c) => (c.cr = true)); } }]],
      giacnguu: [["cr", "Tay đối thủ có thẻ được tạo ra", { subj: { at: "hand" }, tw: (G) => { G.hand.a.forEach((c) => (c.cr = true)); } }]],
      nuphanquan: [["lo", "Tay có thẻ sức mạnh ≤1", { subj: { at: "hand" }, tw: (G) => { G.hand.p.forEach((c) => (c.bonus = -6)); } }]],
      dathep: [["hurt", "Thẻ ta hàng trước bị trừ sức mạnh", { subj: { at: "hand" }, own: [[V.c2, L1], [V.c1, 0]], plays: [["ongvang", L1]] }]],
      cuongtri: [["full", "Trên bàn · tay đầy", { subj: { at: "board", li: L1 }, hand: [V.c1, V.c2, V.c3, V.c1, V.c2, V.c3, V.c1] }]],
      quytu: [["sk", "Trên bàn · đặt một kỹ năng", { subj: { at: "board", li: L1 }, plays: [["daodo", 0]] }]],
      kychu: [["rev", "Có thẻ Lật của bạn tại đây (chiến địa trái)", { lane: 0, subj: { at: "hand" }, own: [["tinhquyennu", 0], [V.c2, L1]] }]],
      catlun: [["bn", "Trên bàn · đối thủ có năng lượng thưởng", { subj: { at: "board", li: L1 }, tw: (G) => { G.nextBonus.a = 2; } }]],
      tackehoa: [["pre", "Đặt sau một thẻ Lật cùng chiến địa", { subj: { at: "hand" }, pre: [[H.buffAlly, L1]] }]],
      loanxa: [["bn", "Trên bàn · đối thủ có năng lượng thưởng", { subj: { at: "board", li: L1 }, tw: (G) => { G.nextBonus.a = 2; } }]],
      maythichnghi: [["act", "Địch có thẻ Kích Hoạt tại đây", { subj: { at: "hand" }, foe: [[V.c1, L1], ["nguuma", L1], [V.c3, 0]] }]],
      ngunhan: [["ltp", "Lượt trước mỗi bên đã đặt thẻ", { subj: { at: "hand" }, tw: (G) => { G.ltp.p = G.locs[L1].cards.p[0].uid; G.ltp.a = G.locs[L1].cards.a[0].uid; } }]],
      thietthieunien: [["top", "Đỉnh bộ bài là thẻ có kỹ năng", { subj: { at: "hand" }, deck: DECK.concat(["thaphoankhaimo"]) }]],
      trungvuong: [["neg", "Thẻ ta có sức mạnh âm", { subj: { at: "hand" }, own: [[V.c1, L1, { bonus: -5 }], [V.c2, 0, { bonus: -6 }]] }]],
      quandoanmotnguoi: [["loc", "Chiến địa này có hiệu ứng (Long Cung)", { subj: { at: "hand" }, loc: ["meadow", "longcung", "meadow"] }]],
      cuongtu: [["big", "Nằm trên tay · có thẻ ta ≥10 sức mạnh", { subj: { at: "hand", keep: 1 }, own: [[V.c6, L1], [V.c1, 0]], plays: [[V.c3, 2]] }]],
      linhchindau: [["snap", "Đã có người Snap", { subj: { at: "hand" }, tw: (G) => { G.snap.p = true; } }]],
      hoanhanmay: [["bn", "Trên bàn · có năng lượng thưởng", { subj: { at: "board", li: L1 }, tw: (G) => { G.nextBonus.p = 2; } }]],
      phiungtre: [["r1", "Đặt từ tay rồi đặt thẻ Lật 1 năng lượng tại đây", { subj: { at: "hand" }, plays: [["tinhquyennu", L1]] }]],
      dihien: [["mv", "Có thẻ di chuyển lượt này · tay có thẻ Dời Được", { subj: { at: "hand" }, hand: [V.c2, "dahanh", V.c1], own: [[V.c6, 0], [V.c1, L1]], plays: [[H.pullHi, 2]] }]],
      buisao: [["sum", "Trên bàn · có thẻ đưa thẻ vào chiến địa", { subj: { at: "board", li: L1 }, plays: [["docnutrang", 0]] }]],
      comaychien: [["blk", "Trên bàn · địch cấm đặt thẻ 4+ tại đây", { subj: { at: "board", li: 0 }, foe: [[V.c1, L1], ["mieunuot", L1]], plays: [[V.c4, L1]] }]],
      phuthuytre: [["spent", "Các lượt trước đã dùng hết năng lượng", { subj: { at: "hand" }, tw: (G) => { G.cnt.allSpent.p = G.turn; } }]],
      vuongbathu: [["buff", "Thẻ ta đã được tăng sức mạnh", { subj: { at: "hand" }, own: [[V.c2, L1, { bonus: 2 }], [V.c1, 0, { bonus: 1 }]] }]],
      haplucchiare: [["ab", "Tay đối thủ có thẻ kỹ năng", { subj: { at: "hand" }, foeHand: [H.revCard, "quaituong", H.endCard] }]],
      longbattu: [["two", "Đã nhiều lượt đặt 2 thẻ", { subj: { at: "hand" }, tw: (G) => { G.cnt.two.p = 2; } }]],
      tinhchuathaiduong: [["us", "Đã có lượt còn năng lượng chưa dùng", { subj: { at: "hand" }, tw: (G) => { G.cnt.unspentTurns.p = 2; } }]],
      trumthanhpho: [["top", "Nằm trên tay · bạn có thẻ mạnh nhất", { subj: { at: "hand", keep: 1 }, own: [[V.c6, L1, { bonus: 6 }], [V.c1, 0]], plays: [[V.c3, 2]] }]],
      bavuongmienvien: [["shots", "Đã nạp Phát Bắn", { subj: { at: "hand" }, tw: (G) => { G.shots.p = [1, 0, 3]; } }]],
      nghichtuvuong: [["h34", "Tay có thẻ 3–4 năng lượng", { subj: { at: "hand" }, hand: [V.c3, V.c4, V.c1] }]],
      thienthantimkiem: [["cr", "Tay có thẻ được tạo ra", { subj: { at: "hand" }, tw: (G) => { G.hand.p.forEach((c) => (c.cr = true)); } }]],
      tiensigamma: [["rng", "Còn năng lượng chưa dùng (thử nhiều hạt ngẫu nhiên)", { subj: { at: "hand" }, rng: 1 }]],
      thandong: [["back", "Hàng sau, phía trước là thẻ Lật", { subj: { at: "hand" }, own: [[H.buffAlly, L1], [V.c2, L1], [V.c1, 0]] }]],
      tamkiemmienvien: [["h5", "Tay có thẻ từ 5 năng lượng", { subj: { at: "hand" }, hand: [V.c5, V.c6, V.c1] }]],
      horangkiem: [["deck4", "Bộ bài có thẻ 4 năng lượng", { subj: { at: "hand" } }]],
      giaohutmau: [["ref", "Có Huyết Sát Vương trên bàn", { subj: { at: "hand" }, own: [["huyetsatvuong", 0], [V.c1, L1]] }]],
      dakhonggian: [["ref", "Có Cơ Hoàng Vô Cực ở chiến địa khác", { subj: { at: "hand" }, own: [["cohoangvocuc", 2], [V.c1, L1]] }]],
      /* Nhiệm Vụ: dựng tiến độ còn thiếu 1 bước rồi để lượt thử hoàn thành */
      kysituduc: [["q", "Nhiệm Vụ 3/4 · thêm 1 thẻ ta bị tiêu huỷ", { subj: { at: "board", li: L1 }, own: [[V.c1, L1], [V.c2, 0]], plays: [[H.killOwn, L1]], tw: (G, c) => { c.prog = 3; } }]],
      kysitudich: [["q", "Nhiệm Vụ: thẻ trên bàn đã bị trừ ≥5", { subj: { at: "board", li: L1 }, tw: (G) => { G.locs[0].cards.a[0].bonus = -6; }, plays: [[V.c1, 0]] }]],
      trungphatcogiap: [["q", "Trên tay · đã đánh dấu chiến địa bạn đang thắng", { subj: { at: "hand", keep: 1 }, own: [[V.c6, 0], [V.c1, 2]], foe: [[V.c1, 0], [V.c3, L1]], plays: [[V.c2, 2]], tw: (G, c) => { c.mk = 0; c.mkn = 1; } }]],
      kysidichkhuyen: [["q", "Nhiệm Vụ: có 3 thẻ từ 4 năng lượng trên bàn", { subj: { at: "board", li: L1 }, own: [[V.c4, 0], [V.c5, 2]], plays: [[V.c6, 0]] }]],
      huyettruonglao: [["q", "Nhiệm Vụ: 3 thẻ ta đã hút sức mạnh", { subj: { at: "board", li: L1 }, own: [[V.c2, L1], [V.c1, 0], [V.c3, 2]], plays: [[V.c1, 0]], tw: (G) => { for (const l of [0, 1, 2]) for (const c of G.locs[l].cards.p) if (c.id !== "huyettruonglao") c.stl = true; } }]],
      loantuong: [["q", "Nhiệm Vụ 2/3 · đặt thêm 1 thẻ Lật", { subj: { at: "board", li: L1 }, hand: [V.c2, "tinhquyennu", "kiemlongnhan"], plays: [[H.revCard, 0]], tw: (G, c) => { c.q = 2; } }]],
      /* Cuối ván: chạy thêm hiệu ứng kết thúc ván (endGame) trên bản mô phỏng; bảng diễn chỉ diễn lượt thường */
      khitrang: [["end", "Nằm trong bộ bài · kết thúc ván", { subj: { at: "top" }, plays: [], endGame: 1, tw: (G, c) => { const d = G.deck.p; d.splice(d.indexOf(c), 1); d.unshift(c); } }]],
      ketudao: [["end", "Trên bàn · kết thúc ván (đang thắng)", { subj: { at: "board", li: 0 }, own: [[V.c6, L1], [V.c1, 2]], foe: [[V.c1, 0], [V.c3, L1], [V.c4, 2]], endGame: 1 }]],
      tinhquangnu: [["end", "Trên bàn · kết thúc ván (đang thua)", { subj: { at: "board", li: 0 }, own: [[V.c6, 0], [V.c1, L1], [V.c1, 2]], foe: [[V.c1, 0], [V.c3, L1], [V.c3, 2]], endGame: 1 }]],
      huyetbatuoc: [["end", "Trên bàn · tay có thẻ · kết thúc ván", { subj: { at: "board", li: L1 }, endGame: 1 }]],
      datientri: [["da", "Có Đá của bạn trên bàn", { subj: { at: "hand" }, own: [["da", L1], [V.c1, 0]] }]],
      tamlinhtu: [["act", "Kích Hoạt rồi đặt thẻ (thẻ đó bị nuốt)", { subj: { at: "board", li: L1 }, act: true, actFirst: 1, plays: [[V.c4, L1]] }]],
      diennu: [["next", "Đặt từ tay · lượt sau đặt lá được truyền điện", { subj: { at: "hand" }, deck: DECK.concat([V.c3]), next: { plays: [], surge: 1 } }]],
      vuabong: [["mix", "Thẻ tại đây đã được tăng / bị giảm sức mạnh", { subj: { at: "hand" }, own: [[V.c2, L1, { bonus: 3 }], [V.c1, 0]], foe: [[V.c3, L1, { bonus: -2 }], [V.c6, L1, { bonus: 2 }], [V.c1, 0]] }]],
      heonhen: [["act", "Kích Hoạt · tay đối thủ có thẻ kỹ năng", { subj: { at: "board", li: L1 }, act: true, foeHand: [H.revCard, H.endCard] }]],
      khuyendichchuyen: [["act", "Kích Hoạt rồi đặt thẻ", { subj: { at: "board", li: L1 }, act: true, actFirst: 1, plays: [[V.c2, 0]] }]],
      huyenconu: [["lead", "Trên bàn · đang thắng tại đây", { subj: { at: "board", li: L1 }, own: [[V.c6, L1], [V.c1, 0]], foe: [[V.c1, L1], [V.c3, 0]] }]]
    };
    /* thẻ không có tác dụng lên ván để dựng (chỉ thông tin / chữ / Đầu Ván) — ghi chú "đúng thiết kế" */
    /* luật Đầu Ván kiểm bằng nhiều ván mô phỏng (không dựng được trên một thế cờ giữa ván) */
    const CHECK = {
      ngantoc: () => { for (let sd = 1; sd <= 30; sd++) { const G = E.newGame(["ngantoc"].concat(DECK, DECK.slice(0, 1)), DECK.concat(DECK.slice(0, 2)), { seed: sd, locs: ["meadow", "meadow", "meadow"] }); if (!G.hand.p.some((c) => c.id === "ngantoc")) return "ván " + sd + ": không có trong tay khởi đầu"; } return ""; },
      maymannu: () => { for (let sd = 1; sd <= 30; sd++) { const G = E.newGame(["maymannu"].concat(DECK, DECK.slice(0, 1)), DECK.concat(DECK.slice(0, 2)), { seed: sd, locs: ["meadow", "meadow", "meadow"] }); const inH = () => G.hand.p.some((c) => c.id === "maymannu"); if (inH()) return "ván " + sd + ": có trên tay ở lượt 1"; G.q = { p: [], a: [] }; for (const st of E.beginReveal(G)) E.doStep(G, st); for (const st of E.beginEndTurn(G)) E.stepEndTurn(G, st); E.finishEndTurn(G); E.startTurn(G); if (!inH()) return "ván " + sd + ": không rút ở lượt 2"; } return ""; }
    };
    const NOTE = { ngantoc: "Luôn trong tay khởi đầu (Đầu Ván)", maymannu: "Chỉ đổi lượt rút bài (Đầu Ván)", vitthamtu: "Chỉ cho xem thẻ (giao diện)", chubao: "Chỉ đổi biểu cảm chữ", vouy: "Chỉ ảnh hưởng thông tin lượt 5" };
    /* thứ tự ưu tiên theo dạng + chữ kỹ năng */
    function cands(id) {
      const d = C[id], x = txt(id), all = allCands(id), pri = [];
      const P = (...ks) => { for (const k of ks) if (!pri.includes(k)) pri.push(k); };
      if (!d) return [];
      if (XTRA[id]) P(...XTRA[id].map((x) => "x:" + x[0]));
      if (d.t === "start") P("start");
      if (d.t === "act") P("act");
      if (/Vứt Bỏ/.test(x)) P("disc:self");
      if (/Tiêu Huỷ/.test(x)) P("dead:self");
      if (d.t === "rev" || d.t === "none" || d.t === "on" || d.t === "end") P("hand");
      if (/đối thủ (đã )?đặt|địch được đặt|BẤT KỲ thẻ/.test(x)) P(/Duy Trì/.test(x) ? "foe:on" : "foe:play", "foe:play");
      if (/thẻ địch di chuyển/.test(x)) P("move:foe");
      if (/[Ss]au khi bạn đặt|[Ss]au lần tới bạn đặt|[Mm]ỗi thẻ bạn đặt|[Ss]au khi bạn đặt một kỹ năng/.test(x)) {
        if (/10 sức mạnh|6 năng lượng/.test(x)) P("board+big");
        if (/Lật/.test(x)) P("board+rev");
        if (/3 hoặc 4|từ 4/.test(x)) P("board+c4", "board+c3");
        P("board+v", "board+big", "board+rev", "board+else");
      }
      if (/thẻ (khác )?của bạn bị tiêu huỷ|thẻ khác của bạn bị tiêu huỷ/.test(x)) P("dead:ally", "dead:ally-hand");
      if (/bị tiêu huỷ/.test(x)) P("dead:ally", "dead:self");
      if (/vứt bỏ/.test(x)) P("disc:you");
      if (/thẻ này di chuyển|[Cc]ó thể di chuyển|[Kk]hi thẻ này di chuyển/.test(x)) P("move:self", "move:pull");
      if (/một thẻ (khác của bạn )?di chuyển|thẻ di chuyển/.test(x)) P("move:ally", "move:foe");
      if (/cường hoá|Cường Hoá/.test(x)) P("top", "buff");
      if (/rút/.test(x)) P("top");
      if (/Đầu Lượt|Cuối Lượt|Mỗi lượt|mỗi lượt/.test(x)) P("board", "board+v");
      if (/dùng hết năng lượng/.test(x)) P("spent", "spent:board");
      if (/đối thủ còn năng lượng/.test(x)) P("foeE");
      P("ref", "ref:deck");
      if (/trên tay|[Kk]hi thẻ này trở về tay|[Kk]hi bạn rút thẻ này/.test(x)) P("hand:idle", "top");
      P("hand", "board+v", "board", "act");
      for (const c of all) P(c.k);
      return pri.map((k) => all.find((c) => c.k === k)).filter(Boolean);
    }

    /* ---------- dựng thế cờ lên một ván G (ván mô phỏng hoặc ván thật) ---------- */
    function newG(id, spec, seed) {
      const deck = spec.start ? [id].concat(DECK.slice(0, 11)) : DECK.slice(0, 12);
      return E.newGame(deck, DECK.slice(0, 12), { seed: seed >>> 0, locs: spec.loc.slice() });
    }
    function stage(G, id, spec, opt) {
      opt = opt || {};
      G.live = false; G.srcU = 0;
      G.turn = spec.turn; G.phase = "play"; G.result = null; G.first = "p";
      G.q.p = []; G.q.a = [];
      for (let i = 0; i < 3; i++) { const L = G.locs[i]; L.id = spec.loc[i]; L.rvl = true; L.gone = false; L.cards.p = []; L.cards.a = []; }
      const mk = (cid, side) => E.mk(G, cid, side);
      const put = (cid, side, li, o) => {
        const c = mk(cid, side); c.rev = true; c.played = true; c.turn = spec.turn - 1; c.et = 0; c.age = 1;
        if (o && o.cr) c.cr = true; if (o && o.bp != null) c.bp = o.bp; if (o && o.bonus) c.bonus = o.bonus;
        G.locs[li].cards[side].push(c); return c;
      };
      for (const [cid, li, o] of spec.foe) put(cid, "a", li, o);
      for (const [cid, li, o] of spec.own) put(cid, "p", li, o);
      const startHand = spec.start ? G.hand.p.filter((c) => c.id !== id && !DECK.includes(c.id)) : [];
      G.hand.p = spec.hand.map((cid) => mk(cid, "p")).concat(startHand);
      G.hand.a = spec.foeHand.map((cid) => mk(cid, "a"));
      if (!spec.start) G.deck.p = spec.deck.map((cid) => mk(cid, "p"));
      G.deck.a = DECK.map((cid) => mk(cid, "a"));
      G.dead.p = spec.dead.map((cid) => { const c = mk(cid, "p"); c.dt = spec.turn - 1; return c; });
      G.dead.a = spec.foeDead.map((cid) => { const c = mk(cid, "a"); c.dt = spec.turn - 1; return c; });
      G.disc.p = spec.disc.map((cid) => mk(cid, "p")); G.disc.a = spec.foeDisc.map((cid) => mk(cid, "a"));
      /* thẻ được thử */
      const sj = spec.subj; let subj = null;
      if (sj.at === "board") { subj = put(id, "p", sj.li, sj); }
      else if (sj.at === "top") { subj = mk(id, "p"); G.deck.p.push(subj); }
      else { subj = (spec.start && G.hand.p.find((c) => c.id === id)) || mk(id, "p"); if (sj.at === "handR") G.hand.p.push(subj); else G.hand.p.unshift(subj); }
      if (opt.sil) subj.sil = true;
      /* bối cảnh ván: đã có thẻ bị vứt/tiêu huỷ/di chuyển, lượt trước có đặt thẻ */
      try {
        G.cnt.disc.p = 1; G.cnt.disc.a = 1; G.cnt.dest = 2; G.cnt.movedPrev = true; G.cnt.playedLast.p = 1; G.cnt.playedLast.a = 1;
        const o0 = G.locs[0].cards.p[0], f0 = G.locs[0].cards.a[0];
        if (o0) { G.prevPlay.p = o0.uid; G.lastPlay.p = o0.uid; }
        if (f0) { G.lastPlay.a = f0.uid; G.prevPlay.a = f0.uid; }
      } catch (e) {}
      G.energy.p = 12; G.energy.a = 6; G.maxE.p = 0; G.maxE.a = 0; G.nextBonus.p = 0; G.nextBonus.a = 0;
      if (spec.tw) { try { spec.tw(G, subj); } catch (e) {} }
      G.live = true;
      /* hàng đợi: thẻ được thử (nếu đặt từ tay) rồi các thẻ phụ */
      const res = { subj, ok: true, why: "", lane: spec.lane };
      for (const [cid, li] of spec.pre) { const c = mk(cid, "p"); G.hand.p.push(c); if (!E.queuePlay(G, "p", c.uid, li)) { G.hand.p.splice(G.hand.p.indexOf(c), 1); res.ok = false; res.why = "thẻ phụ " + C[cid].n + " không đặt được"; } }
      if (sj.at === "hand" && !sj.keep) {
        let li = spec.lane, ok = E.queuePlay(G, "p", subj.uid, li);
        if (!ok) for (const l2 of [0, 1, 2]) if (l2 !== li && E.queuePlay(G, "p", subj.uid, l2)) { ok = true; li = l2; break; }
        if (!ok) { res.ok = false; res.why = "không đặt được ở chiến địa nào"; }
        res.lane = li;
      }
      if (spec.act && spec.actFirst && !E.queueAct(G, "p", subj.uid)) { res.ok = false; res.why = "không Kích Hoạt được"; }
      for (const [cid, li] of spec.plays) { const c = mk(cid, "p"); G.hand.p.push(c); if (!E.queuePlay(G, "p", c.uid, li)) { G.hand.p.splice(G.hand.p.indexOf(c), 1); res.ok = false; res.why = res.why || "thẻ phụ " + C[cid].n + " không đặt được"; } }
      if (spec.act && !spec.actFirst && !E.queueAct(G, "p", subj.uid)) { res.ok = false; res.why = "không Kích Hoạt được"; }
      if (spec.move != null && !E.queueMove(G, "p", subj.uid, spec.move)) { res.ok = false; res.why = "không di chuyển được"; }
      for (const [cid, li] of spec.foePlays) { const c = mk(cid, "a"); G.hand.a.push(c); G.energy.a = 10; if (!E.queuePlay(G, "a", c.uid, li)) { G.hand.a.splice(G.hand.a.indexOf(c), 1); res.ok = false; res.why = "địch không đặt được"; } }
      G.energy.a = spec.foeE || 0;
      if (spec.spend) G.energy.p = 0;
      return res;
    }

    /* ---------- chụp trạng thái + so sánh ---------- */
    function snap(G) {
      const m = new Map();
      const rec = (c, z, li) => {
        let pw = (c.bp != null ? c.bp : C[c.id] ? C[c.id].p : 0) + (c.bonus || 0), cs = "";
        if (li != null && li >= 0) { try { pw = E.power(G, c, li); } catch (e) {} }
        if (z === "hand" || z === "deck") { try { cs = E.cost(G, c, null); } catch (e) {} }
        m.set(c.uid, [z, c.side, c.id, c.ab || "", pw, cs, c.sil ? 1 : 0].join("|"));
      };
      for (const s of ["p", "a"]) {
        for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[s]) rec(c, "L" + i, i);
        for (const z of ["hand", "deck", "dead", "disc"]) for (const c of G[z][s] || []) rec(c, z, null);
      }
      let lp = ""; try { lp = [0, 1, 2].map((i) => E.locPower(G, i, "p") + "/" + E.locPower(G, i, "a")).join(","); } catch (e) {}
      const g = { lp, loc: G.locs.map((L) => L.id + (L.gone ? "x" : "")).join(","), e: [G.energy.p, G.energy.a, G.maxE.p, G.maxE.a, G.nextBonus.p, G.nextBonus.a].join(","), st: stFlags(G) };
      return { m, g };
    }
    /* cờ trạng thái ván do kỹ năng đặt cho lượt sau (ngập, Dời Được, móc kéo, bỏ qua chiến địa…) — so như một tác dụng */
    const STF = [["flood", "ngập"], ["cloak", "dời tới (mọi thẻ)"], ["hell", "dời tới (thẻ ta)"], ["grant", "được dời"], ["lock", "khoá đặt"]];
    function stFlags(G) {
      const o = [];
      G.locs.forEach((L, i) => { for (const [k, n] of STF) { const v = L[k]; if (v && (typeof v !== "object" || v.p || v.a)) o.push("L" + i + " " + n + "=" + (typeof v === "object" ? (v.p || 0) + "/" + (v.a || 0) : v)); } });
      if (G.noLoc) o.push("bỏ qua chiến địa=" + G.noLoc);
      for (const [k, n] of [["grapple", "móc kéo"], ["sling", "đu tơ"]]) if (G[k] && (G[k].p || G[k].a)) o.push(n + "=" + G[k].p + "/" + G[k].a);
      return o.join("; ");
    }
    /* tên vùng / tên thẻ dễ đọc cho nhật ký */
    const ZN = (z) => ({ L0: "chiến địa 1", L1: "chiến địa 2", L2: "chiến địa 3", hand: "tay", deck: "bộ bài", dead: "mộ", disc: "bài vứt" })[z] || z;
    const NM = (v) => { const p = String(v || "").split("|"); return p[2] ? (C[p[2]] ? C[p[2]].n : p[2]) + (p[1] === "a" ? " (địch)" : "") : ""; };
    const F = ["vùng", "phe", "thẻ", "kỹ năng", "sức mạnh", "năng lượng", "mất kỹ năng"];
    function diff(A, B, subjUid) {
      const out = [];
      for (const [u, a] of A.m) {
        const b = B.m.get(u);
        if (!b) { out.push({ u, w: "mới xuất hiện (" + ZN(a.split("|")[0]) + ")", a, n: NM(a) }); continue; }
        if (a === b) continue;
        const pa = a.split("|"), pb = b.split("|"), ch = [];
        for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i] && !(i === 6 && u === subjUid)) ch.push(F[i] + " " + (i === 0 ? ZN(pb[i]) + "→" + ZN(pa[i]) : i === 2 ? (C[pb[i]] ? C[pb[i]].n : pb[i]) + "→" + (C[pa[i]] ? C[pa[i]].n : pa[i]) : (pb[i] || "—") + "→" + (pa[i] || "—")));
        if (!ch.length) continue;
        out.push({ u, w: ch.join(", "), self: u === subjUid, n: NM(a) });
      }
      for (const [u, b] of B.m) if (!A.m.has(u)) out.push({ u, w: "biến mất (từ " + ZN(b.split("|")[0]) + ")", b, n: NM(b) });
      if (A.g.loc !== B.g.loc) out.push({ u: 0, w: "chiến địa " + B.g.loc + "→" + A.g.loc, loc: 1 });
      if (A.g.lp !== B.g.lp && !out.length) out.push({ u: 0, w: "tổng sức mạnh chiến địa " + B.g.lp + "→" + A.g.lp, lp: 1 });
      if (A.g.e !== B.g.e) out.push({ u: 0, w: "năng lượng " + B.g.e + "→" + A.g.e, en: 1 });
      if (A.g.st !== B.g.st) out.push({ u: 0, w: "trạng thái " + (B.g.st || "—") + " → " + (A.g.st || "—"), st: 1 });
      return out;
    }

    /* ---------- chạy trọn một lượt không hoạt ảnh ---------- */
    function simTurn(G) {
      const evs = [], grab = () => { if (G.evs && G.evs.length) evs.push(...G.evs.splice(0)); };
      try {
        const steps = E.beginReveal(G); grab();
        for (const st of steps) { E.doStep(G, st); grab(); }
        for (const st of E.beginEndTurn(G)) { E.stepEndTurn(G, st); grab(); }
        E.finishEndTurn(G); grab();
        if (G.turn < E.turns(G)) { E.startTurn(G); grab(); }
        return { evs };
      } catch (e) { return { evs, err: String(e && e.message || e) }; }
    }
    /* lượt 2 (kỹ năng "lượt sau"): đặt thêm thẻ rồi chạy tiếp một lượt */
    function stageNext(G, spec) {
      const ok = []; G.live = false; const cs = spec.next.plays.map(([cid, li]) => { const c = E.mk(G, cid, "p"); G.hand.p.push(c); return [c, li]; }); G.live = true;
      G.energy.p = Math.max(G.energy.p, 12); G.energy.a = spec.foeE || 0;
      for (const [c, li] of cs) ok.push(E.queuePlay(G, "p", c.uid, li));
      if (spec.next.surge) for (const c of G.hand.p.filter((x) => x.surge)) ok.push(E.queuePlay(G, "p", c.uid, LANE));
      return ok.every(Boolean);
    }
    function runCand(id, cand, seed) {
      const one = (sil, sp) => {
        sp = sp || cand.spec;
        const G = newG(id, sp, seed); const st = stage(G, id, sp, { sil });
        if (!st.ok) return { st, G };
        const before = snap(G); let r = simTurn(G);
        if (cand.spec.next && !r.err && G.phase !== "over") { stageNext(G, cand.spec); const r2 = simTurn(G); r = { evs: r.evs.concat(r2.evs), err: r2.err }; }
        if (cand.spec.endGame && !r.err) { try { G.evs = []; E.endGame(G); if (G.evs.length) r.evs.push(...G.evs.splice(0)); } catch (e) { r.err = String(e && e.message || e); } }
        return { st, G, before, after: snap(G), evs: r.evs, err: r.err };
      };
      const A = one(false);
      if (!A.st.ok) {
        /* kỹ năng CẤM/GIỚI HẠN chính thẻ (vd Vô Hạn Nhân): bật thì không dựng được, xoá kỹ năng thì dựng được -> đó là tác dụng */
        const B0 = one(true);
        if (B0.st.ok) return { cand, ok: true, block: 1, score: 1, d: [{ u: 0, w: "kỹ năng ngăn: " + A.st.why, rule: 1 }], others: 0, self: true, evk: [], evs: [], subjUid: A.st.subj.uid, lane: A.st.lane };
        return { cand, ok: false, why: A.st.why, score: 0, d: [] };
      }
      if (A.err) return { cand, ok: true, err: A.err, score: 0, d: [], evs: A.evs };
      let B = one(true);
      /* xoá kỹ năng làm hỏng chính thao tác (không Kích Hoạt / không tự dời được): so với ván y hệt nhưng bỏ thao tác đó */
      const Bf = B.st.ok ? null : one(true, Object.assign({}, cand.spec, { act: false, move: null }));
      const su = A.st.subj.uid;
      let d = B.after ? diff(A.after, B.after, su) : Bf && Bf.after ? diff(A.after, Bf.after, su) : diff(A.after, A.before, su);
      if (!B.st.ok) d.push({ u: 0, w: "chỉ làm được nhờ kỹ năng (" + B.st.why + ")", rule: 1 });
      const sf = A.G.startFx ? A.G.startFx.filter((x) => x.id === id && x.s === "p") : [];
      if (cand.k === "start" && sf.length) d = d.concat(sf.map((x) => ({ u: 0, w: "Đầu Ván: " + (x.add || []).length + " thẻ thêm vào " + x.to, start: 1 })));
      const others = d.filter((x) => x.u && x.u !== su);
      const evk = A.evs.filter((e) => e.uid === su || e.src === su).map((e) => e.k);
      return { cand, ok: true, score: d.length, d, others: others.length, self: d.some((x) => x.u === su), evk, evs: A.evs, subjUid: su, lane: A.st.lane };
    }
    /* chọn thế cờ: cách đầu tiên (theo ưu tiên) có tác dụng; không có -> cách đầu tiên dựng được */
    function plan(id, seed) {
      seed = seed == null ? 12345 : seed;
      const list = cands(id), tried = [];
      let pick = null, first = null;
      for (const c of list) {
        /* kỹ năng may rủi: thử thêm vài hạt ngẫu nhiên, giữ hạt cho ra tác dụng (bảng diễn dùng lại hạt đó) */
        const seeds = c.spec.rng ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => (seed + k * 7919) >>> 0) : [seed];
        let r = null;
        for (const sd of seeds) { r = runCand(id, c, sd); r.seed = sd; if (r.ok && r.score > 0 && !r.err) break; }
        tried.push({ k: c.k, ok: r.ok, score: r.score, err: r.err || "", why: r.why || "" });
        if (r.ok && !first) first = r;
        if (r.ok && r.score > 0 && !r.err) { pick = r; break; }
      }
      const r = pick || first;
      const d = C[id];
      const notes = [];
      if (d.t === "none") notes.push("Không kỹ năng (chỉ lật thường)");
      if (/Nhiệm Vụ/.test(d.x)) notes.push("Nhiệm Vụ nhiều lượt");
      if (/[Kk]hi kết thúc ván|[Cc]uối ván/.test(d.x)) notes.push("Chỉ chạy khi kết thúc ván");
      if (d.t === "start") notes.push("Đầu Ván");
      let chk = null;
      if (CHECK[id] && !pick) { try { chk = CHECK[id](); } catch (e) { chk = "lỗi kiểm: " + (e && e.message || e); } }
      if (NOTE[id] && !pick) notes.push(NOTE[id] + (chk === "" ? " — đã kiểm 30 ván: đúng" : ""));
      return {
        id, n: d.n, h: d.h, t: d.t, x: d.x, seed: r && r.seed != null ? r.seed : seed, block: !!(r && r.block),
        k: r ? r.cand.k : "", kn: r ? r.cand.n : "", spec: r ? r.cand.spec : null,
        effect: !!pick, score: r ? r.score : 0, others: r ? r.others || 0 : 0, self: !!(r && r.self),
        area: !!(r && ((r.d && r.d.some((x) => x.loc || x.lp || x.en || x.start || x.st)) || (r.evk || []).some((k) => /^(summon|destroy|discard|move|tohand|sil|revive|morph|clone|abcopy|surge|top|absorb|hide|lockswap|hbuff)$/.test(k)) || (r.evs || []).some((e) => e.k === "top" && e.a === "peek"))),
        d: r ? r.d.slice(0, 12).map((x) => (x.n ? x.n + (x.u === r.subjUid ? " (thẻ thử)" : "") + ": " : "") + x.w) : [], evk: r ? r.evk || [] : [],
        err: r && r.err ? r.err : (chk ? "luật Đầu Ván sai: " + chk : ""), tried, notes
      };
    }
    return { LANE, VAN, H, DECK, TIERS, tierName, typeName, cands, allCands, newG, stage, snap, diff, simTurn, runCand, plan };
  })(root.LT || (typeof require === "function" ? require("./01-engine.js") : null));

  if (typeof module !== "undefined" && module.exports) { module.exports = PLAN; return; }
  root.VFXLAB_PLAN = PLAN;

  /* =========================================================================================
     PHẦN 2 — GIAO DIỆN BẢNG + CHẠY QUA ĐƯỜNG ỐNG TRẬN THẬT
     ========================================================================================= */
  const W = root, D = document, $id = (id) => D.getElementById(id);
  const E = W.LT, C = E.C;
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SPEEDS = [["0.5", "Chậm ×0.5", 2], ["1", "Thường ×1", 1], ["2", "Nhanh ×2", 0.5], ["4", "Rất nhanh ×4", 0.25]];
  /* lớp diễn còn sót sau một màn (HX / PA6 / SIG) */
  const LEAK = [".hxsoul", ".hxds", ".hxcv", ".hxbolt", ".mc.hxpk", ".mc.hxm", ".mc.hx2z", ".fxg.hxd", ".hxemb", ".hxbk", ".hxclip", ".hxorb", ".hxrc", ".fxg.hxold", ".mc.hx14h",
    ".p6soul", ".p6ai", ".p6say", ".fxg.hero5", ".fxg.p6bk", ".uc5", ".sgp", ".sgsoul", ".sga", ".sgx", ".sgseal", ".sgvx", ".sgbk", ".sgsw", ".sgscroll", ".sgcv"];
  /* mốc "đánh trúng mục tiêu" của các module diễn */
  const HIT_RE = /^(HX:hit|HXfan|HXfan:bolts|HX03|HX04|HX07:drain|HX09:arm|C:hit|sig:hit|sig:arrow|sig:link)$/;

  const ST = {
    on: false, hooked: false, tier: "S1", q: "", list: [], i: 0, mode: "idle", paused: false, stopReq: false, busy: false,
    speed: "1", rows: new Map(), cur: null, rec: null, prev: null, seed: 777, capOn: true, auto: true, filt: "*"
  };
  W.VFXLAB_STATE = ST;

  /* ---------- móc ghi nhận (chỉ khi bảng mở) ---------- */
  const SAVED = {};
  function hook() {
    if (ST.hooked) return; ST.hooked = true;
    const tapK = (pre) => (k, o) => { const r = ST.rec; if (r) r.taps.push(pre + k + (o && o.self ? ":self" : "") + (o && o.id ? "@" + o.id : "")); };
    for (const [nm, pre] of [["HX_TAP", "HX "], ["PA6_TAP", "PA6 "], ["SIG_TAP", "SIG "]]) {
      SAVED[nm] = W[nm]; const mine = tapK(pre), prev = W[nm];
      W[nm] = function (k, o) { try { mine(k, o); } catch (e) {} if (typeof prev === "function") return prev.apply(this, arguments); };
    }
    /* CFX.* / FX.*: đếm lời gọi (đường lật/diễn cũ S1–S3 và hạt chung) */
    SAVED.fx = [];
    for (const [obj, nm] of [[typeof CFX !== "undefined" ? CFX : W.CFX, "CFX"], [typeof FX !== "undefined" ? FX : W.FX, "FX"]]) {
      if (!obj) continue;
      for (const k of Object.keys(obj)) {
        const f = obj[k]; if (typeof f !== "function") continue;
        const w = function () { const r = ST.rec; if (r) { const key = nm + "." + k; r.fx[key] = (r.fx[key] || 0) + 1; } return f.apply(this, arguments); };
        obj[k] = w; SAVED.fx.push([obj, k, f, w]);
      }
    }
    /* sự kiện engine (G.evs) sau mỗi bước của lượt thật */
    SAVED.e = {};
    for (const fn of ["doStep", "stepEndTurn", "startTurn", "finishEndTurn"]) {
      const f0 = E[fn]; SAVED.e[fn] = f0;
      E[fn] = function () { const r = f0.apply(this, arguments); try { const R = ST.rec; if (R && typeof G !== "undefined" && arguments[0] === G && G.evs) for (const e of G.evs) R.ev.push(e); } catch (e) {} return r; };
    }
    /* bảng thử: máy không rút lui / không cược, không tự tua nhanh lượt (giữ đúng màn diễn đầy đủ) */
    SAVED.retreat = E.aiWantsRetreat; SAVED.snap = E.aiWantsSnap;
    E.aiWantsRetreat = () => false; E.aiWantsSnap = () => false;
    if (W.FFTURN) { SAVED.ffs = W.FFTURN.start; W.FFTURN.start = () => {}; }
    SAVED.onerr = (ev) => { const r = ST.rec; if (r) r.err.push(String((ev && (ev.message || (ev.reason && ev.reason.message) || ev.reason)) || "lỗi")); };
    W.addEventListener("error", SAVED.onerr); W.addEventListener("unhandledrejection", SAVED.onerr);
    SAVED.cerr = console.error;
    console.error = function () { const r = ST.rec; if (r) try { r.err.push([...arguments].map((a) => (a && a.message) || String(a)).join(" ").slice(0, 200)); } catch (e) {} return SAVED.cerr.apply(console, arguments); };
    /* chạm vào bảng không được tính là "chạm tua nhanh" của trận */
    SAVED.pd = (ev) => { if (ev.target && ev.target.closest && ev.target.closest("#vfxLabDrawer,#vlBar,#vlDet")) ev.stopImmediatePropagation(); };
    W.addEventListener("pointerdown", SAVED.pd, true);
    SAVED.kd = (ev) => {
      if (!ST.on || (ev.target && /^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName))) return;
      const k = ev.key, map = { ArrowRight: "next", n: "next", ArrowLeft: "prev", p: "prev", r: "replay", " ": "pause", o: "mok", x: "mbad", a: "auto" }, a = map[k] || map[String(k).toLowerCase()];
      if (!a) return; ev.preventDefault(); ev.stopPropagation();
      if ((a === "next" || a === "prev") && ST.mode !== "audit" && ST.cur) { let L = (ST.filt && ST.filt !== "*" ? listFor("*", ST.q) : listFor(ST.tier, ST.q)).filter(filtOk); if (!L.includes(ST.cur)) L = listFor("*", "").filter(filtOk); const i = L.indexOf(ST.cur), j = i + (a === "next" ? 1 : -1); if (L[j]) jump(L[j]); return; }
      act(a);
    };
    W.addEventListener("keydown", SAVED.kd, true);
  }
  function unhook() {
    if (!ST.hooked) return; ST.hooked = false;
    for (const nm of ["HX_TAP", "PA6_TAP", "SIG_TAP"]) W[nm] = SAVED[nm];
    for (const [obj, k, f, w] of SAVED.fx) if (obj[k] === w) obj[k] = f;
    for (const fn in SAVED.e) E[fn] = SAVED.e[fn];
    E.aiWantsRetreat = SAVED.retreat; E.aiWantsSnap = SAVED.snap;
    if (W.FFTURN && SAVED.ffs) W.FFTURN.start = SAVED.ffs;
    W.removeEventListener("error", SAVED.onerr); W.removeEventListener("unhandledrejection", SAVED.onerr);
    console.error = SAVED.cerr;
    W.removeEventListener("pointerdown", SAVED.pd, true);
    W.removeEventListener("keydown", SAVED.kd, true);
  }

  /* ---------- danh sách thẻ theo bậc ---------- */
  const ALL = Object.keys(C);
  const tierCount = (h) => ALL.filter((k) => C[k].h === h).length;
  const fold = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
  function listFor(tier, q) {
    const qq = fold(q);
    return ALL.filter((k) => (tier === "*" || C[k].h === tier) && (!qq || k.includes(qq.replace(/\s+/g, "")) || fold(C[k].n).includes(qq)))
      .sort((a, b) => C[a].c - C[b].c || C[a].n.localeCompare(C[b].n, "vi"));
  }

  /* ---------- dựng bảng ---------- */
  function build() {
    if ($id("vfxLabDrawer")) return;
    const bar = D.createElement("div");
    bar.id = "vlBar";
    bar.innerHTML = `
      <div class="vl-row">
        <button type="button" data-a="menu" title="Danh sách / nhật ký">☰</button>
        <button type="button" data-a="prev" title="Thẻ trước">◀</button>
        <button type="button" data-a="pause" id="vlPause" title="Tạm dừng / tiếp tục">❚❚</button>
        <button type="button" data-a="next" title="Thẻ sau">▶</button>
        <button type="button" data-a="replay" title="Diễn lại thẻ này">↻</button>
        <select id="vlSpd" aria-label="Tốc độ">${SPEEDS.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select>
        <span class="vl-prog" id="vlProg"></span>
        <button type="button" data-a="auto" id="vlAuto" title="Tự sang thẻ sau khi diễn xong (tắt: dừng ở mỗi thẻ để xem)">⇥</button>
        <button type="button" data-a="cap" title="Chữ kỹ năng: gọn / đầy đủ (luôn hiện)">Aa</button>
        <button type="button" data-a="close" class="vl-x" title="Đóng bảng test">✕</button>
      </div>
      <div class="vl-cap" id="vlCap">Chọn bậc rồi bấm ▶ Kiểm tra, hoặc chọn một thẻ để diễn thử.</div>`;
    D.body.appendChild(bar);
    /* bảng kiểm từng thẻ (dưới cùng, thu/mở được, nhớ trạng thái; mặc định mở) */
    const det = D.createElement("div");
    det.id = "vlDet";
    det.innerHTML = `<div class="vd-hd" data-a="det"><b class="vd-v">…</b><span class="vd-k">←/→ thẻ · R diễn lại · Space dừng · O đúng · X lỗi</span><i class="vd-t">▾</i></div><div class="vd-b"></div>`;
    if (!PREF("det", true)) det.classList.add("shut");
    D.body.appendChild(det);
    det.addEventListener("click", (ev) => { const b = ev.target.closest("[data-a]"); if (!b) return; ev.stopPropagation(); act(b.dataset.a, b); });
    det.addEventListener("change", (ev) => { if (ev.target.id === "vlNote") setMark(ST.cur, undefined, ev.target.value); });
    det.addEventListener("keydown", (ev) => ev.stopPropagation());

    const dr = D.createElement("div");
    dr.id = "vfxLabDrawer";
    dr.setAttribute("role", "dialog");
    dr.setAttribute("aria-label", "Bảng Test VFX");
    const tiers = PLAN.TIERS.filter((h) => tierCount(h));
    dr.innerHTML = `
      <div class="vl-hd"><b>✨ BẢNG TEST VFX · đường ống trận thật</b><button type="button" data-a="menu" class="vl-x" title="Thu bảng">▾</button></div>
      <div class="vl-ctl">
        <select id="vlTier" aria-label="Bậc thẻ">
          ${tiers.map((h) => `<option value="${h}">${esc(PLAN.tierName(h))} (${h}) · ${tierCount(h)}</option>`).join("")}
          <option value="*">Tất cả bậc · ${ALL.length}</option>
        </select>
        <input id="vlQ" type="search" placeholder="Tìm thẻ / nhảy tới…" autocomplete="off">
        <select id="vlFilt" aria-label="Lọc theo kết luận"><option value="*">Mọi kết luận</option><option value="ok">✓ đúng</option><option value="look">⚠ cần xem</option><option value="bad">✗ lỗi</option><option value="u:bad">Bạn đánh: Lỗi</option><option value="u:ok">Bạn đánh: OK</option><option value="u:none">Chưa đánh dấu</option></select>
      </div>
      <div class="vl-ctl">
        <button type="button" data-a="audit" class="vl-go">▶ Kiểm tra cả bậc</button>
        <button type="button" data-a="stop">■ Dừng</button>
        <button type="button" data-a="quick" title="Chỉ chạy engine (không hoạt ảnh) để lập bảng nhanh">⚡ Kiểm nhanh engine</button>
      </div>
      <div class="vl-list" id="vlList"></div>
      <div class="vl-hd2"><b>Nhật ký kiểm tra</b> <span id="vlSum"></span>
        <button type="button" data-a="copy">⧉ Sao chép JSON</button><button type="button" data-a="clear">Xoá</button></div>
      <div class="vl-log" id="vlLog"><table><thead><tr><th>Thẻ</th><th>Bậc</th><th>Thế cờ</th><th>Hiệu ứng đã bật</th><th>Cảnh báo</th></tr></thead><tbody id="vlRows"></tbody></table></div>`;
    D.body.appendChild(dr);

    const onClick = (ev) => {
      const b = ev.target.closest("[data-a]"); if (!b) return;
      ev.stopPropagation();
      act(b.dataset.a, b);
    };
    bar.addEventListener("click", onClick);
    dr.addEventListener("click", (ev) => {
      const it = ev.target.closest("[data-id]");
      if (it) { ev.stopPropagation(); jump(it.dataset.id); return; }
      onClick(ev);
    });
    $id("vlTier").addEventListener("change", (e) => { ST.tier = e.target.value; renderList(); });
    $id("vlQ").addEventListener("input", (e) => { ST.q = e.target.value; renderList(); });
    $id("vlQ").addEventListener("keydown", (e) => { if (e.key === "Enter") { const f = listFor(ST.tier, ST.q)[0] || listFor("*", ST.q)[0]; if (f) jump(f); } });
    $id("vlSpd").addEventListener("change", (e) => { ST.speed = e.target.value; applySpeed(); });
    $id("vlFilt").addEventListener("change", (e) => { ST.filt = e.target.value; renderList(); });
    $id("vlAuto").classList.toggle("on", ST.auto);
    $id("vlTier").value = ST.tier;
    renderList(); renderLog();
  }
  function renderList() {
    const el = $id("vlList"); if (!el) return;
    const L = (ST.filt && ST.filt !== "*" ? listFor("*", ST.q) : listFor(ST.tier, ST.q)).filter(filtOk); /* lọc theo kết luận/đánh dấu: xét mọi bậc */
    el.innerHTML = L.map((k) => {
      const r = ST.rows.get(k), mk = MARK.get(k), cls = (r ? (r.verdict === "bad" ? " bad" : r.verdict === "look" ? " warn" : " ok") : "") + (mk && mk.m ? " u" + mk.m : "");
      return `<button type="button" class="vl-it${cls}${ST.cur === k ? " cur" : ""}" data-id="${k}" title="${esc(C[k].x)}"><i>${C[k].c}</i>${esc(C[k].n)}<small>${esc(PLAN.typeName(C[k].t))}</small></button>`;
    }).join("") || `<div class="vl-empty">Không có thẻ</div>`;
  }
  function renderLog() {
    const tb = $id("vlRows"); if (!tb) return;
    const rows = [...ST.rows.values()];
    tb.innerHTML = rows.slice(-400).reverse().map((r) => `<tr class="${r.bad ? "bad" : r.warn.length ? "warn" : ""}" data-id="${r.id}"><td>${esc(r.n)}</td><td>${r.h}</td><td>${esc(r.setup)}</td><td>${esc(r.fired.slice(0, 8).join(" · "))}</td><td>${esc(r.warn.join(" | ") || "—")}</td></tr>`).join("");
    const s = $id("vlSum");
    if (s) { const w = rows.filter((r) => r.warn.length).length, b = rows.filter((r) => r.bad).length; s.textContent = `${rows.length} thẻ · ${w} cảnh báo · ${b} lỗi`; }
  }
  function caption(id, p, extra) {
    const c = $id("vlCap"); if (!c) return;
    if (!id) { c.innerHTML = esc(extra || ""); return; }
    const d = C[id];
    c.innerHTML = `<b>${esc(d.n)}</b> <span class="vl-tag">${esc(PLAN.tierName(d.h))}</span> <span class="vl-tag">${esc(PLAN.typeName(d.t))}</span> <span class="vl-tag">${d.c}⚡ ${d.p}💪</span>
      <div class="vl-x1">${esc(d.x || "Không kỹ năng")}</div>
      <div class="vl-x2">Thế cờ: ${esc(p ? p.kn : "")}${p && !p.effect && d.t !== "none" ? " · <em>mô phỏng: kỹ năng không đổi gì trên thế cờ này</em>" : ""}${p && p.effect && !p.others ? " · <em>kỹ năng không nhắm thẻ khác</em>" : ""}${extra ? " · " + esc(extra) : ""}</div>`;
    c.classList.toggle("mini", !ST.capOn); c.hidden = false; /* gpu68-audit2: chữ kỹ năng LUÔN hiện; Aa chỉ đổi gọn/đầy đủ */
    renderDet(ST.rows.get(id) && ST.cur === id && !ST.busyCard ? ST.rows.get(id) : null, id);
  }
  function prog() {
    const el = $id("vlProg"); if (!el) return;
    el.textContent = ST.mode === "audit" ? `${Math.min(ST.i + 1, ST.list.length)}/${ST.list.length}${ST.paused ? " ⏸" : ""}` : ST.mode === "one" ? "1 thẻ" : "";
    const pb = $id("vlPause"); if (pb) pb.textContent = ST.paused ? "▶" : "❚❚";
  }
  function applySpeed() {
    const k = (SPEEDS.find((x) => x[0] === ST.speed) || SPEEDS[1])[2];
    try { const base = (typeof SPDV !== "undefined" && SPDV[store.spd]) || 1; SPD = base * k; } catch (e) {}
  }
  function restoreSpeed() { try { SPD = (typeof SPDV !== "undefined" && SPDV[store.spd]) || 1; } catch (e) {} }

  /* ---------- trận dùng cho bảng ---------- */
  function ensureMatch() {
    const lob = $id("lobby");
    if (!ST.prev) ST.prev = { G: typeof G !== "undefined" ? G : null, lobby: !!(lob && lob.classList.contains("on")) };
    if (lob) lob.classList.remove("on");
    try { D.querySelectorAll(".ov.on").forEach((o) => o.classList.remove("on")); } catch (e) {}
  }
  function resetUiCaches(g) {
    try { BC = null; TN0 = 0; LOCID = []; seenRev.clear(); prevPow.clear(); seenLoc.clear(); seenStg.clear(); prevLd = []; PWV = {}; } catch (e) {}
    try { sel = look = moveSel = null; armRetreat = 0; } catch (e) {}
    try { for (let i = 0; i < 3; i++) { if (g.locs[i].rvl) seenLoc.add(i); for (const s of ["p", "a"]) for (const c of g.locs[i].cards[s]) if (c.rev) seenRev.add(c.uid); } } catch (e) {}
    try { LVEIL = null; } catch (e) {}
  }
  function idle() {
    try {
      if (TURN_BUSY) return false;
      if (W.HXG && HXG.busy && HXG.busy()) return false;
      if (W.SIGK && SIGK.busy && SIGK.busy()) return false;
      if (W.P6 && P6.ch && P6.ch()) return false;
    } catch (e) {}
    return true;
  }
  async function settle(max) {
    const t0 = performance.now();
    while (performance.now() - t0 < (max || 9000)) { if (idle()) break; await sleep(60); }
    return idle();
  }
  function leftovers() {
    const dom = LEAK.map((s) => [s, D.querySelectorAll(s).length]).filter((x) => x[1]);
    const hid = [...D.querySelectorAll("#board [data-mc], #hand [data-hc]")].filter((e) => e.classList.contains("hero-hid") || getComputedStyle(e).visibility === "hidden" || +getComputedStyle(e).opacity < 0.5).map((e) => e.dataset.mc || "h" + e.dataset.hc);
    const sh = ($id("sigHide") || {}).textContent || "";
    const pw = [];
    try {
      D.querySelectorAll("#board [data-lane]").forEach((ln) => { const li = +ln.dataset.lane; for (const sd of ["p", "a"]) { const el = ln.querySelector(".pw." + sd); if (el) { const v = parseInt(el.textContent, 10), w = E.locPower(G, li, sd); if (!isNaN(v) && v !== w) pw.push(`${li}${sd}:${v}≠${w}`); } } });
    } catch (e) {}
    return { dom, hid, sh: sh.trim(), pw };
  }
  function cleanLeft() { /* dọn chỗ sót để thẻ sau không bị ảnh hưởng (đã ghi cảnh báo) */
    for (const s of LEAK) D.querySelectorAll(s).forEach((e) => { if (!e.matches(".mc")) e.remove(); else e.classList.remove("hxpk", "hxm", "hx2z", "hx14h"); });
    D.querySelectorAll(".hero-hid").forEach((e) => e.classList.remove("hero-hid"));
  }

  /* ---------- diễn MỘT thẻ qua lượt thật ---------- */
  async function runCard(id) {
    const t0 = performance.now(), d = C[id];
    ST.cur = id; ST.busyCard = true; renderList();
    const p = PLAN.plan(id, ST.seed);
    caption(id, p);
    const row = { id, n: d.n, h: d.h, t: d.t, x: d.x, setup: p.kn || "—", k: p.k, simEffect: p.effect, simDiff: p.d, simEv: [...new Set(p.evk)], notes: p.notes, fired: [], taps: [], fx: {}, ev: [], warn: [], err: [], bad: false, ms: 0 };
    if (!p.spec) { row.warn.push("không dựng được thế cờ (" + (p.tried.map((t) => t.why).filter(Boolean)[0] || "?") + ")"); row.bad = true; verdict(row); ST.busyCard = false; ST.rows.set(id, row); renderLog(); renderDet(row); return row; }
    await settle(6000); cleanLeft();
    ensureMatch(); applySpeed();
    const rec = (ST.rec = { taps: [], fx: {}, ev: [], err: [] });
    let g;
    try {
      g = PLAN.newG(id, p.spec, p.seed);
      const stg = PLAN.stage(g, id, p.spec);
      if (!stg.ok && !p.block) row.warn.push("dựng thế cờ: " + stg.why);
      G = g; resetUiCaches(g);
      try { if (W.BGM) BGM.syncGame(G); } catch (e) {}
      try { resetTimer(false); } catch (e) {}
      G.msg = `<b>Bảng test:</b> ${esc(d.n)} — ${esc(p.kn)}`;
      render();
    } catch (e) { rec.err.push("dựng: " + (e && e.message || e)); }
    await sleep(380);
    const before = PLAN.snap(G);
    try {
      if (p.spec.start && typeof startShow === "function") await startShow();
      if (ST.stopReq) throw new Error("stop");
      const turn = async () => {
        ddPlan = true; let hung = false;
        await Promise.race([endTurnUI(), sleep(45000).then(() => { hung = true; })]);
        if (hung) { rec.err.push("lượt treo > 45 s"); try { TURN_BUSY = false; } catch (e) {} }
      };
      await turn();
      if (p.spec.next && G === g && G.phase === "play") {
        await settle(6000);
        stageNext2(g, p.spec); render(); await sleep(300);
        await turn();
      }
    } catch (e) { if (String(e && e.message) !== "stop") rec.err.push("lượt: " + (e && e.message || e)); }
    const calm = await settle(9000);
    await sleep(260);
    const after = PLAN.snap(G);
    let lo = leftovers();
    for (let k = 0; k < 4 && (lo.hid.length || lo.pw.length || lo.dom.length); k++) { await sleep(500); lo = leftovers(); } /* lá rút / tổng điểm có thể còn đang chạy nhịp cuối */
    ST.rec = null;
    /* kết quả */
    row.taps = rec.taps; row.fx = rec.fx;
    row.ev = rec.ev.map((e) => e.k).slice(0, 80);
    const keys = [...new Set(rec.taps.map((t) => t.replace(/@.*/, "")))];
    row.fired = keys.concat(Object.keys(rec.fx).filter((k) => /^CFX\./.test(k)).map((k) => k + "×" + rec.fx[k]));
    const realDiff = PLAN.diff(after, before, -1).length;
    const evKinds = [...new Set(rec.ev.map((e) => e.k))];
    row.evKinds = evKinds;
    row.err = rec.err.slice(0, 6);
    row.ms = Math.round(performance.now() - t0);
    noEff(row, p);
    row.real = PLAN.diff(after, before, -1).slice(0, 14).map((x) => (x.n ? x.n + ": " : "") + x.w);
    if (p.err) { row.warn.push("engine lỗi: " + p.err); row.bad = true; }
    if (rec.err.length) { row.warn.push("LỖI JS: " + rec.err[0]); row.bad = true; }
    if (!calm) { row.warn.push("diễn chưa xong sau 9 s (HX/SIG/PA6 còn bận)"); row.bad = true; }
    if (lo.dom.length) { row.warn.push("SÓT DOM " + lo.dom.map((x) => x[0] + "×" + x[1]).join(",")); row.bad = true; }
    if (lo.hid.length) { row.warn.push("thẻ bị ẩn " + lo.hid.join(",")); row.bad = true; }
    if (lo.sh) { row.warn.push("luật ẩn lá còn: " + lo.sh.slice(0, 60)); row.bad = true; }
    if (lo.pw.length) { row.warn.push("tổng điểm hiển thị lệch " + lo.pw.join(",")); row.bad = true; }
    const hits = keys.filter((k) => HIT_RE.test(k.replace(/^(HX|PA6|SIG) /, "")));
    if (p.effect && p.others === 0 && !p.area && hits.length) row.warn.push("diễn đánh trúng (" + hits.slice(0, 3).join(",") + ") nhưng kỹ năng chỉ tác động chính nó/không nhắm thẻ khác");
    const skillEv = rec.ev.some((e) => /^(skill|act|destroy|discard|summon|revive|move|morph|abcopy|tohand|sil|surge|egain|loc|locfx|clone|blocked|top|draw|lock|hbuff|hide|pbuff|eblock|absorb|lockswap)$/.test(e.k) && e.k !== "flip");
    const endOnly = !!(p.spec && p.spec.endGame) || !!p.block;
    if (p.block) row.info = "ℹ Kỹ năng CẤM/GIỚI HẠN: " + (p.d[0] || "") + " (không có màn diễn riêng — thẻ/hành động bị chặn)";
    else if (endOnly) row.info = "ℹ Hiệu ứng KẾT THÚC VÁN: đã kiểm bằng mô phỏng engine (endGame) — bảng chỉ diễn một lượt thường";
    if (p.effect && !endOnly && !skillEv && !realDiff) row.warn.push("mô phỏng có tác dụng nhưng lượt thật không thấy sự kiện/kết quả nào");
    const fxN = Object.keys(rec.fx).filter((k) => /^FX\./.test(k)).reduce((a, k) => a + rec.fx[k], 0);
    const visK = keys.filter((k) => !/^PA6 (Q:|shift|plan)/.test(k)); /* mốc xếp lịch của SEQ/PA6 không phải hình vẽ */
    if (p.effect && !endOnly && (skillEv || realDiff) && !visK.length && !Object.keys(rec.fx).some((k) => /^CFX\./.test(k) && k !== "CFX.drawIn") && fxN < 8) row.warn.push("kỹ năng chạy nhưng gần như không có hiệu ứng nào được gọi");
    if (row.ms > 20000) row.warn.push("diễn quá lâu " + (row.ms / 1000).toFixed(1) + " s");
    if (lo.dom.length || lo.hid.length) cleanLeft();
    verdict(row); ST.busyCard = false;
    ST.rows.set(id, row);
    renderLog(); renderList(); renderDet(row);
    return row;
  }
  function stageNext2(g, spec) {
    g.live = false; const cs = spec.next.plays.map(([cid, li]) => { const c = E.mk(g, cid, "p"); g.hand.p.push(c); return [c, li]; }); g.live = true;
    g.energy.p = Math.max(g.energy.p, 12); g.energy.a = spec.foeE || 0;
    for (const [c, li] of cs) E.queuePlay(g, "p", c.uid, li);
    if (spec.next.surge) for (const c of g.hand.p.filter((x) => x.surge)) E.queuePlay(g, "p", c.uid, PLAN.LANE);
  }

  /* ---------- điều khiển ---------- */
  async function loop() {
    if (ST.busy) return; ST.busy = true;
    try {
      while (ST.on && !ST.stopReq && ST.mode === "audit" && ST.i < ST.list.length) {
        while (ST.paused && !ST.stopReq && ST.on) await sleep(120);
        if (ST.stopReq || !ST.on) break;
        const i0 = ST.i; prog();
        await runCard(ST.list[i0]);
        if (!ST.auto && ST.mode === "audit" && !ST.stopReq) { ST.paused = true; if (ST.i === i0) ST.i++; prog(); continue; } /* tắt tự sang: dừng để xem, ▶/❚❚ đi tiếp */
        await sleep(ST.speed === "4" ? 150 : 450);
        if (ST.i === i0) ST.i++;
      }
      if (ST.mode === "audit" && ST.i >= ST.list.length) { toastL(`Xong kiểm tra ${ST.list.length} thẻ — xem nhật ký (☰).`); ST.mode = "done"; } /* gpu68-audit2: giữ chữ kỹ năng của thẻ cuối, không thay bằng thông báo */
      while (ST.on && !ST.stopReq && ST.mode === "one" && ST.oneQ) { const id = ST.oneQ; ST.oneQ = null; prog(); await runCard(id); }
      if (ST.mode === "one" && !ST.oneQ) ST.mode = "idle";
    } finally { ST.busy = false; ST.stopReq = false; prog(); }
  }
  function startAudit(ids) {
    ST.list = ids || listFor(ST.tier, "");
    ST.i = 0; ST.mode = "audit"; ST.paused = false;
    menu(false); prog(); loop();
  }
  function jump(id) {
    if (ST.mode === "audit" && ST.list.includes(id)) { ST.i = ST.list.indexOf(id); ST.paused = false; skipCur(); }
    else { ST.mode = "one"; ST.oneQ = id; skipCur(); }
    menu(false); prog(); loop();
  }
  function skipCur() { /* thẻ đang diễn: chạm tua nhanh như người chơi, vòng lặp tự sang thẻ được chọn */
    try { if (!idle()) D.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); } catch (e) {}
  }
  function menu(on) {
    const dr = $id("vfxLabDrawer"); if (!dr) return;
    const v = on == null ? !dr.classList.contains("open") : on;
    dr.classList.toggle("open", v); D.body.classList.toggle("vlmenu", v);
  }
  async function quick() { /* chỉ engine: lập bảng tức thì cho cả bậc */
    const L = listFor(ST.tier, ST.q);
    for (const id of L) {
      const p = PLAN.plan(id, ST.seed), d = C[id];
      const row = { id, n: d.n, h: d.h, t: d.t, x: d.x, setup: p.kn, k: p.k, simEffect: p.effect, simDiff: p.d, simEv: [...new Set(p.evk)], notes: p.notes, fired: ["(chỉ engine)"], taps: [], fx: {}, ev: [], warn: [], err: [], bad: !!p.err, ms: 0, quick: 1 };
      noEff(row, p);
      if (p.err) row.warn.push("engine lỗi: " + p.err);
      if (!p.spec) row.warn.push("không dựng được thế cờ");
      verdict(row);
      ST.rows.set(id, row);
    }
    renderLog(); renderList();
  }
  function exportJSON() {
    const rows = [...ST.rows.values()].map((r) => { const m = MARK.get(r.id); return { id: r.id, n: r.n, h: r.h, t: r.t, setup: r.setup, k: r.k, simEffect: r.simEffect, simDiff: r.simDiff, simEv: r.simEv, real: r.real || [], fired: r.fired, taps: r.taps.slice(0, 60), fx: r.fx, evKinds: r.evKinds || [], warn: r.warn, info: r.info || "", verdict: r.verdict, why: r.why, err: r.err, bad: r.bad, ms: r.ms, notes: r.notes, userMark: m ? m.m : "", userNote: m ? m.note || "" : "" }; });
    return JSON.stringify({ ver: "gpu68-lab2", at: new Date().toISOString(), n: rows.length, rows }, null, 1);
  }
  /* ---------- kết luận + đánh dấu của người kiểm (gpu68-audit2) ---------- */
  /* kỹ năng không đổi gì trên thế cờ: có giải thích (đúng thiết kế / chỉ giao diện / Đầu Ván đã kiểm) -> ghi chú, không cảnh báo */
  function noEff(row, p) {
    if (C[row.id].t === "none" || p.effect) return;
    if (p.notes.length) row.info = "ℹ " + p.notes.join(" · ");
    else row.warn.push("chưa dựng được điều kiện của kỹ năng trên thế cờ thử — cần xem chữ kỹ năng");
  }
  function verdict(r) {
    const hard = r.warn.filter((w) => /^(LỖI JS|SÓT DOM|thẻ bị ẩn|luật ẩn|diễn chưa xong|engine lỗi|tổng điểm hiển thị lệch|không dựng được)/.test(w));
    if (r.bad || hard.length) { r.verdict = "bad"; r.why = (hard[0] || r.warn[0] || "lỗi"); }
    else if (r.warn.length) { r.verdict = "look"; r.why = r.warn.join(" | "); }
    else { r.verdict = "ok"; r.why = r.info ? r.info : C[r.id].t === "none" ? "Không kỹ năng — chỉ lật" : r.quick ? "Engine: kỹ năng tạo khác biệt" : "Kỹ năng tạo khác biệt và có hiệu ứng tương ứng"; }
    return r;
  }
  const VSYM = { ok: "✓ đúng", look: "⚠ cần xem", bad: "✗ lỗi" };
  const LSK = "ltd_vlab_marks";
  const MARK = new Map();
  try { const o = JSON.parse(localStorage.getItem(LSK) || "{}"); for (const k in o) MARK.set(k, o[k]); } catch (e) {}
  const saveMarks = () => { try { localStorage.setItem(LSK, JSON.stringify(Object.fromEntries(MARK))); } catch (e) {} };
  function setMark(id, m, note) {
    if (!id) return; const cur = MARK.get(id) || {};
    if (m === null) MARK.delete(id); else MARK.set(id, { m: m != null ? m : cur.m || "", note: note != null ? note : cur.note || "", at: Date.now() });
    saveMarks(); renderList(); renderDet(ST.rows.get(id) || null, id);
  }
  const PREF = (k, d) => { try { const v = localStorage.getItem("ltd_vlab_" + k); return v == null ? d : v === "1"; } catch (e) { return d; } };
  const SETP = (k, v) => { try { localStorage.setItem("ltd_vlab_" + k, v ? "1" : "0"); } catch (e) {} };
  /* bảng chi tiết: kỹ năng | thế cờ | engine đổi gì (trước→sau) | hiệu ứng | kết luận + đánh dấu */
  function renderDet(r, idOpt) {
    const el = $id("vlDet"); if (!el) return;
    const id = (r && r.id) || idOpt || ST.cur; if (!id || !C[id]) { el.querySelector(".vd-b").innerHTML = `<div class="vd-x">Chọn một thẻ hoặc bấm ▶ Kiểm tra.</div>`; return; }
    const m = MARK.get(id), d = C[id];
    const li = (a) => (a && a.length ? `<ul>${a.slice(0, 10).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<i class="vd-0">—</i>`);
    const fx = r ? r.fired.filter((k) => !/drawIn|PA6 Q:|PA6 (shift|plan)/.test(k)).slice(0, 8).join(" · ") : "";
    el.querySelector(".vd-hd b").textContent = (r ? (VSYM[r.verdict] || "…") : "… đang diễn") + " · " + d.n;
    el.querySelector(".vd-hd b").className = "vd-v " + (r ? r.verdict || "" : "run");
    el.querySelector(".vd-b").innerHTML = `
      <div class="vd-g"><b>Thế cờ</b><span>${esc(r ? r.setup : "…")}</span></div>
      <div class="vd-g"><b>Engine đổi (mô phỏng bật/tắt kỹ năng)</b>${r ? li(r.simDiff) : "…"}</div>
      ${r && r.real ? `<div class="vd-g"><b>Lượt thật: trước → sau</b>${li(r.real)}</div>` : ""}
      <div class="vd-g"><b>Hiệu ứng đã chạy</b><span>${esc(fx || (r ? "—" : "…"))}</span></div>
      <div class="vd-g"><b>Kết luận</b><span class="vd-why ${r ? r.verdict : ""}">${esc(r ? r.why || "" : "đang diễn…")}</span></div>
      <div class="vd-mk"><button type="button" data-a="mok" class="${m && m.m === "ok" ? "on" : ""}">✓ OK</button><button type="button" data-a="mbad" class="${m && m.m === "bad" ? "on" : ""}">✗ Lỗi</button>
        <input id="vlNote" type="text" placeholder="Ghi chú cho thẻ này…" value="${esc(m && m.note || "")}"><button type="button" data-a="mclr" title="Xoá đánh dấu">⌫</button></div>`;
  }
  function filtOk(id) {
    const f = ST.filt || "*"; if (f === "*") return true;
    const r = ST.rows.get(id), m = MARK.get(id);
    if (f === "ok" || f === "look" || f === "bad") return !!r && r.verdict === f;
    if (f === "u:bad") return !!m && m.m === "bad";
    if (f === "u:ok") return !!m && m.m === "ok";
    if (f === "u:none") return !m || !m.m;
    return true;
  }
  async function act(a) {
    switch (a) {
      case "menu": menu(); break;
      case "close": closeLab(); break;
      case "pause": if (ST.mode === "audit") { ST.paused = !ST.paused; prog(); if (!ST.busy) loop(); } break;
      case "next": if (ST.mode === "audit" && ST.paused && !ST.auto) { ST.paused = false; prog(); if (!ST.busy) loop(); break; }
        if (ST.mode === "audit") { ST.i = Math.min(ST.list.length - 1, ST.i + 1); ST.paused = false; skipCur(); prog(); if (!ST.busy) loop(); } break;
      case "prev": if (ST.mode === "audit") { ST.i = Math.max(0, ST.i - 1); ST.paused = false; skipCur(); prog(); if (!ST.busy) loop(); } break;
      case "replay": if (ST.cur) { if (ST.mode === "audit") { ST.i = ST.list.indexOf(ST.cur); ST.paused = false; skipCur(); if (!ST.busy) loop(); } else jump(ST.cur); } break;
      case "audit": startAudit(); break;
      case "stop": ST.mode = "idle"; ST.stopReq = ST.busy; ST.paused = false; prog(); break;
      case "quick": quick(); break;
      case "cap": ST.capOn = !ST.capOn; SETP("cap", ST.capOn); { const c = $id("vlCap"); if (c) { c.hidden = false; c.classList.toggle("mini", !ST.capOn); } } break;
      case "det": { const el = $id("vlDet"); if (el) { el.classList.toggle("shut"); SETP("det", !el.classList.contains("shut")); } break; }
      case "mok": setMark(ST.cur, "ok"); break;
      case "mbad": setMark(ST.cur, "bad"); break;
      case "mclr": setMark(ST.cur, null); break;
      case "auto": ST.auto = !ST.auto; SETP("auto", ST.auto); { const b = $id("vlAuto"); if (b) b.classList.toggle("on", ST.auto); } break;
      case "copy": {
        const j = exportJSON(); W.VFXLAB_LAST = j;
        try { await navigator.clipboard.writeText(j); toastL("Đã chép JSON nhật ký (" + ST.rows.size + " thẻ)"); }
        catch (e) { const t = D.createElement("textarea"); t.value = j; D.body.appendChild(t); t.select(); try { D.execCommand("copy"); toastL("Đã chép JSON"); } catch (e2) { toastL("Không chép được — dùng VFXLAB.exportJSON()"); } t.remove(); }
        break;
      }
      case "clear": ST.rows.clear(); renderLog(); renderList(); break;
    }
  }
  function toastL(t) { try { toast(t); } catch (e) { caption(null, null, t); } }

  function openLab() {
    ST.capOn = PREF("cap", true); ST.auto = PREF("auto", true);
    build(); hook(); ST.on = true;
    { const dt = $id("vlDet"); if (dt) dt.classList.add("on"); renderDet(null); }
    D.body.classList.add("vlab");
    $id("vfxLabDrawer").classList.add("on", "open"); D.body.classList.add("vlmenu");
    $id("vlBar").classList.add("on");
    ensureMatch();
    if (typeof G === "undefined" || !G) { try { newGame(); } catch (e) {} }
    try { LVEIL = null; render(); } catch (e) {}
    prog();
  }
  function closeLab() {
    ST.on = false; ST.stopReq = ST.busy; ST.mode = "idle"; ST.paused = false;
    const dr = $id("vfxLabDrawer"), bar = $id("vlBar");
    if (dr) dr.classList.remove("on", "open"); if (bar) bar.classList.remove("on"); D.body.classList.remove("vlmenu");
    { const dt = $id("vlDet"); if (dt) dt.classList.remove("on"); }
    D.body.classList.remove("vlab");
    const fin = async () => {
      await settle(6000); unhook(); restoreSpeed(); cleanLeft();
      const pv = ST.prev; ST.prev = null;
      if (pv) {
        try { if (pv.G) { G = pv.G; resetUiCaches(G); render(); } } catch (e) {}
        try { if (pv.lobby || !pv.G) showLobby(); } catch (e) {}
      }
    };
    fin();
  }
  function toggleLab() { const dr = $id("vfxLabDrawer"); if (dr && dr.classList.contains("on")) closeLab(); else openLab(); }

  W.VFXLAB = {
    openLab, toggleLab, closeLab, runCard, startAudit, jump, quick, exportJSON, listFor, plan: PLAN.plan, PLAN, state: ST,
    rows: () => [...ST.rows.values()], marks: () => Object.fromEntries(MARK), setMark, idle, settle, setSpeed: (k) => { ST.speed = String(k); const s = $id("vlSpd"); if (s) s.value = ST.speed; applySpeed(); },
    pause: (v) => { ST.paused = v == null ? !ST.paused : !!v; prog(); }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
