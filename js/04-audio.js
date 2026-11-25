/* Module 04: Bộ tổng hợp Âm thanh Điện ảnh (SFX) & Nhạc nền Động Đa Tầng (Procedural Cyber-Heroic BGM) */

const SFX = (() => {
  let ac = null;
  let masterOut = null;

  function ctx() {
    if (!ac) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (A) {
        ac = new A();
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.knee.value = 18;
        comp.ratio.value = 4;
        comp.attack.value = 0.004;
        comp.release.value = 0.16;
        comp.connect(ac.destination);
        /* gpu43: hạ nhẹ dải chói (kệ cao -3 dB từ ~4,5 kHz) cho mọi âm, kể cả bộ tổng hợp dự phòng */
        const shelf = ac.createBiquadFilter();
        shelf.type = "highshelf";
        shelf.frequency.value = 4500;
        shelf.gain.value = -3;
        shelf.connect(comp);
        masterOut = shelf;
      }
    }
    if (ac && ac.state === "suspended") ac.resume();
    return ac;
  }

  function outNode() {
    ctx();
    return masterOut || (ac && ac.destination);
  }

  function sfxGainVal(v) {
    return Math.max(0.0001, v * ((store.vol ?? 100) / 100));
  }

  function tone(f0, f1, dur, type, vol, delay) {
    if (!ctx()) return;
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(sfxGainVal(vol), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(outNode());
    o.start(t);
    o.stop(t + dur + 0.025);
  }

  function noise(dur, vol, f0, f1, delay, qVal) {
    if (!ctx()) return;
    const t = ac.currentTime + (delay || 0);
    const n = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    const f = ac.createBiquadFilter();
    const g = ac.createGain();
    src.buffer = buf;
    f.type = "bandpass";
    f.Q.value = qVal || 1.3;
    f.frequency.setValueAtTime(Math.max(40, f0), t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    g.gain.setValueAtTime(sfxGainVal(vol), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(outNode());
    src.start(t);
  }

  const S = {
    tap() {
      tone(820, 1180, 0.042, "triangle", 0.08);
    },
    pick() {
      tone(540, 920, 0.065, "triangle", 0.11);
      noise(0.045, 0.1, 1800, 4200, 0, 2.0);
    },
    tick() {
      /* Tiếng đếm ngược 10s cuối kiểu nhịp tim kim loại đôi như Marvel Snap */
      tone(1240, 1180, 0.045, "triangle", 0.11);
      tone(880, 820, 0.055, "sine", 0.08, 0.09);
    },
    timeout() {
      tone(340, 120, 0.36, "sawtooth", 0.16);
      tone(170, 65, 0.38, "sine", 0.24);
    },
    /* Đặt thẻ nhanh xuống bàn: tiếng vút gọn + cú đập sub-bass chắc nịch + tia năng lượng */
    place() {
      noise(0.055, 0.26, 2400, 620, 0, 1.1);
      tone(210, 58, 0.11, "sine", 0.42, 0.015);
      tone(620, 1280, 0.08, "triangle", 0.1, 0.02);
    },
    /* Rút lại thẻ về tay */
    unplay() {
      noise(0.065, 0.18, 650, 2800, 0, 1.4);
      tone(420, 760, 0.08, "triangle", 0.12);
    },
    /* Lật thẻ mở chiêu: tiếng búng lật 3D + dậm xuống bàn */
    flip() {
      noise(0.055, 0.24, 1200, 4800, 0, 1.5);
      tone(320, 640, 0.08, "triangle", 0.13);
      tone(185, 56, 0.14, "sine", 0.44, 0.12);
      noise(0.05, 0.22, 2200, 520, 0.12, 1.0);
    },
    /* Bảng hiệu đổi lượt */
    turn() {
      noise(0.14, 0.22, 600, 3600, 0, 1.8);
      tone(146.8, 293.7, 0.22, "sawtooth", 0.08);
      tone(293.7, 440, 0.28, "triangle", 0.12, 0.05);
      tone(98, 55, 0.3, "sine", 0.32, 0.02);
    },
    buff() {
      tone(523, 784, 0.1, "triangle", 0.14);
      tone(784, 1175, 0.13, "triangle", 0.12, 0.06);
    },
    hurt() {
      tone(420, 155, 0.19, "sawtooth", 0.11);
      noise(0.1, 0.16, 1400, 320, 0);
    },
    destroy() {
      noise(0.24, 0.48, 3600, 160, 0, 0.9);
      tone(135, 42, 0.28, "sine", 0.44);
      tone(280, 75, 0.18, "sawtooth", 0.12);
    },
    laser() {
      tone(920, 180, 0.34, "sawtooth", 0.18);
      tone(140, 42, 0.42, "sine", 0.48, 0.03);
      noise(0.32, 0.42, 3800, 220, 0.02, 1.1);
    },
    discard() {
      noise(0.26, 0.26, 420, 3400);
      tone(320, 140, 0.18, "triangle", 0.1);
    },
    summon() {
      tone(290, 880, 0.14, "sine", 0.22);
      tone(580, 1175, 0.16, "triangle", 0.1, 0.04);
    },
    revive() {
      tone(220, 660, 0.36, "sine", 0.18);
      tone(330, 990, 0.36, "triangle", 0.09, 0.07);
    },
    move() {
      noise(0.18, 0.24, 520, 3200, 0, 1.5);
      tone(360, 620, 0.12, "sine", 0.12);
    },
    morph() {
      [587, 784, 988, 1319].forEach((f, i) => tone(f, f * 1.02, 0.11, "triangle", 0.11, i * 0.038));
    },
    act() {
      tone(110, 106, 0.55, "sine", 0.34);
      tone(440, 880, 0.24, "triangle", 0.12);
      noise(0.12, 0.2, 1200, 4200, 0, 1.8);
    },
    /* Mở Chiến Địa Mới: Mạch điện kích hoạt + Cổng không gian mở 3D trầm hùng */
    loc() {
      noise(0.14, 0.24, 900, 4600, 0, 2.2);
      tone(330, 660, 0.14, "triangle", 0.12);
      tone(130.8, 65.4, 0.42, "sine", 0.45, 0.12);
      [392, 587.3, 784].forEach((f, i) => tone(f, f, 0.34, "triangle", 0.08, 0.13 + i * 0.035));
    },
    slash() {
      noise(0.12, 0.44, 5800, 1100, 0, 1.1);
      tone(1950, 480, 0.11, "sawtooth", 0.07);
    },
    chime() {
      [1568, 2093, 2637].forEach((f, i) => tone(f, f * 0.998, 0.48, "sine", 0.065, i * 0.03));
    },
    boom() {
      tone(78, 30, 0.52, "sine", 0.56);
      noise(0.42, 0.34, 760, 65, 0, 0.8);
    },
    whoosh() {
      noise(0.17, 0.24, 380, 4000, 0, 1.4);
    },
    ult() {
      noise(0.3, 0.32, 280, 4800);
      tone(220, 520, 0.28, "sawtooth", 0.07);
      tone(110, 44, 0.68, "sine", 0.46, 0.16);
      [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.44, "triangle", 0.075, 0.18 + i * 0.038));
    },
    dark() {
      tone(155, 58, 0.36, "sawtooth", 0.09);
      noise(0.32, 0.16, 460, 130);
    },
    /* Khối Cược SNAP! Năng lượng bùng nổ */
    snap() {
      noise(0.08, 0.32, 1800, 5200, 0, 2.0);
      tone(110, 42, 0.46, "sine", 0.55, 0.04);
      noise(0.24, 0.34, 1400, 160, 0.04, 1.0);
      [440, 659.3, 880, 1318.5].forEach((f, i) => tone(f, f * 1.01, 0.28, "sawtooth", 0.07, 0.06 + i * 0.025));
    },
    e_lua() { noise(0.36, 0.32, 950, 200); noise(0.24, 0.2, 3200, 1200, 0.06); },
    e_bang() { [2093, 2637, 3136].forEach((f, i) => tone(f, f * 1.01, 0.3, "sine", 0.06, i * 0.035)); noise(0.11, 0.16, 6000, 4000); },
    e_sam() { noise(0.16, 0.52, 4200, 280); tone(85, 38, 0.36, "sawtooth", 0.14, 0.02); },
    e_doc() { [0, 1, 2, 3].forEach((i) => tone(310 + i * 70, 200 + i * 40, 0.075, "sine", 0.1, i * 0.055)); },
    e_toi() { tone(110, 52, 0.45, "sawtooth", 0.08); tone(165, 78, 0.45, "sine", 0.11); },
    e_sang() { [784, 1175, 1568].forEach((f, i) => tone(f, f, 0.45, "triangle", 0.065, i * 0.045)); },
    e_gio() { noise(0.38, 0.26, 320, 2600); },
    e_dat() { tone(64, 34, 0.42, "sine", 0.52); noise(0.26, 0.3, 420, 80); },
    e_nuoc() { tone(900, 300, 0.11, "sine", 0.15); noise(0.25, 0.2, 1200, 500, 0.04); tone(600, 1200, 0.09, "sine", 0.08, 0.12); },
    e_mau() { tone(210, 88, 0.26, "sawtooth", 0.09); noise(0.18, 0.2, 720, 200); },
    e_cokhi() { [0, 1, 2].forEach((i) => tone(1450, 1450, 0.028, "square", 0.065, i * 0.05)); tone(220, 180, 0.18, "square", 0.055, 0.16); },
    e_hon() { tone(520, 780, 0.48, "sine", 0.07); tone(524, 792, 0.48, "triangle", 0.055, 0.02); },
    e_moc() { noise(0.28, 0.18, 1800, 3600); tone(660, 990, 0.14, "triangle", 0.065, 0.08); },
    /* === Âm thanh Vũ Khí & Đạo Cụ Vật Lý Riêng Cho Các Thẻ Lật === */
    punch() {
      noise(0.05, 0.34, 2200, 380, 0, 1.1);
      tone(168, 42, 0.19, "sine", 0.56, 0.01);
      tone(310, 78, 0.13, "triangle", 0.22, 0.012);
    },
    bow() {
      tone(240, 560, 0.055, "triangle", 0.16);
      tone(560, 195, 0.11, "sine", 0.14, 0.04);
      noise(0.11, 0.25, 2600, 5600, 0.02, 2.2);
    },
    dagger() {
      noise(0.085, 0.36, 6200, 1800, 0, 1.6);
      tone(2400, 720, 0.08, "sawtooth", 0.08);
      tone(220, 68, 0.09, "sine", 0.28, 0.06);
    },
    web() {
      noise(0.12, 0.28, 1100, 4800, 0, 3.2);
      tone(680, 1920, 0.09, "sine", 0.11);
    },
    magnet() {
      tone(145, 290, 0.24, "sawtooth", 0.085);
      tone(290, 210, 0.24, "sine", 0.12, 0.04);
      [1320, 1760].forEach((f, i) => tone(f, f * 0.98, 0.09, "triangle", 0.08, 0.14 + i * 0.035));
    },
    tentacle() {
      noise(0.18, 0.28, 480, 2200, 0, 2.0);
      tone(190, 420, 0.11, "sine", 0.16);
      tone(340, 95, 0.15, "sine", 0.24, 0.09);
    },
    bite() {
      noise(0.11, 0.42, 2800, 260, 0.02, 0.95);
      tone(155, 48, 0.22, "sawtooth", 0.18);
      tone(110, 38, 0.24, "sine", 0.45, 0.02);
    },
    forge() {
      noise(0.05, 0.3, 4200, 1400, 0, 1.5);
      [1318.5, 1975.5, 2793.8].forEach((f, i) => tone(f, f * 0.996, 0.36, "sine", 0.095, i * 0.012));
      tone(180, 65, 0.16, "triangle", 0.26);
    },
    gavel() {
      tone(92, 32, 0.48, "sine", 0.58);
      noise(0.28, 0.44, 3400, 140, 0, 0.85);
      [392, 587.3, 784].forEach((f, i) => tone(f, f * 0.99, 0.32, "triangle", 0.075, 0.02 + i * 0.02));
    },
    horn() {
      tone(130.8, 146.8, 0.34, "sawtooth", 0.12);
      tone(65.4, 73.4, 0.38, "sine", 0.38);
      noise(0.18, 0.24, 620, 180, 0.05, 1.1);
    },
    chain() {
      [0, 1, 2].forEach((i) => {
        noise(0.055, 0.24, 3600, 1600, i * 0.048, 2.2);
        tone(1480 - i * 160, 920, 0.05, "triangle", 0.08, i * 0.048);
      });
    },
    silence() {
      tone(640, 140, 0.26, "sawtooth", 0.11);
      tone(320, 82, 0.28, "sine", 0.22, 0.02);
    },
    shield() {
      [523.25, 783.99, 1046.5].forEach((f, i) => tone(f, f, 0.24, "triangle", 0.09, i * 0.025));
      noise(0.08, 0.18, 2400, 4800, 0, 2.0);
    },
    debuff() {
      tone(440, 165, 0.2, "sawtooth", 0.11);
      noise(0.11, 0.18, 1500, 320, 0);
    },
    draw() {
      noise(0.075, 0.2, 900, 3800, 0, 1.7);
      tone(480, 820, 0.07, "triangle", 0.09);
    },
    win() {
      tone(98, 49, 0.55, "sine", 0.42);
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
        tone(f, f, 0.34, "triangle", 0.16, i * 0.09);
        tone(f * 0.5, f * 0.5, 0.36, "sawtooth", 0.05, i * 0.09);
      });
    },
    lose() {
      [392, 349.2, 311.1, 261.6].forEach((f, i) => tone(f, f * 0.98, 0.34, "sine", 0.16, i * 0.13));
    }
  };

  const VIB = { ra_s5: [12, 20, 30], ra_s5b: [12, 20, 30], ra_s4: 14, ult: [15, 35, 65], boom: [20, 25, 50], place: 10, flip: 8, destroy: [25, 25, 35], snap: [25, 35, 25], act: 16, win: [35, 50, 35] };

  /* ===== Mẫu âm thanh thật (sprite www/sfx/sfx3.mp3 + sfx3.json: tên → [bắt đầu, độ dài] giây) =====
     Chưa tải xong / thiếu mẫu → dùng lại bộ tổng hợp S[...] ở trên làm dự phòng. */
  const bufs = {};
  let lastH = null; /* âm vừa phát (để màn ra mắt có thể tắt dần tiếng ra mắt trước) */
  let loadState = 0; // 0 chưa tải, 1 đang tải, 2 xong, 3 lỗi
  const recent = {};
  let voices = 0;
  const live = []; /* thời điểm bắt đầu của các âm đang phát */
  const DUCK = { ra_s5: 1.2, ra_s5b: 1.2, ra_s4: 0.9, boom: 0.7, destroy: 0.6, snap: 0.8, win: 1.6, lose: 1.4, horn: 0.6, e_sam: 0.4, e_dat: 0.4, gacha3: 1.4, loc: 0.6, timeout: 0.5, f_bigup: 0.4, f_bigdn: 0.5, f_exile: 0.5 };
  const MAXV = 10; /* trần số âm phát cùng lúc */

  /* gpu43: một sprite sfx3.mp3 (+ sfx3.json: tên -> [bắt đầu, độ dài] giây): toàn bộ âm tạo lại bằng ElevenLabs,
     đã chuẩn hoá độ to, hạ dải 2–6 kHz, fade đầu/cuối (tools/sfx_do.py build). Mono 44,1 kHz, 96 kb/s. */
  function cutSprite(idx, big) {
    const sr = big.sampleRate, src = big.getChannelData(0);
    for (const k in idx) {
      const a = Math.floor(idx[k][0] * sr), n = Math.max(1, Math.floor(idx[k][1] * sr));
      const b = ac.createBuffer(1, n, sr);
      b.getChannelData(0).set(src.subarray(a, a + n));
      bufs[k] = b;
    }
  }
  function loadSprite(name, optional) {
    return Promise.all([
      fetch("sfx/" + name + ".json").then((r) => { if (!r.ok) throw new Error(name); return r.json(); }),
      fetch("sfx/" + name + ".mp3").then((r) => { if (!r.ok) throw new Error(name); return r.arrayBuffer(); })
    ])
      .then(([idx, ab]) => new Promise((res, rej) => {
        const p = ac.decodeAudioData(ab, (b) => res([idx, b]), rej);
        if (p && p.catch) p.catch(rej);
      }))
      .then(([idx, big]) => cutSprite(idx, big))
      .catch((e) => { if (!optional) throw e; });
  }
  function loadSamples() {
    if (loadState || !ac) return;
    loadState = 1;
    loadCardIndex();
    loadSprite("sfx3", false)
      .then(() => { loadState = 2; })
      .catch(() => { loadState = 3; });
    loadSprite("fx", true); /* gpu51: 10 tiếng tình huống FXR (x_*), một sprite riêng; thiếu tệp -> dùng tiếng họ như cũ */
  }


  /* ===== Tiếng KỸ NĂNG riêng từng thẻ S5/S4 (gpu47) =====
     Chỉ mục sfx/the.json (id thẻ -> [số sprite, bắt đầu, độ dài]) nhỏ, tải lúc khởi động; các sprite sfx/the-1.mp3 … the-9.mp3 (~46 thẻ/cái, gồm S5/S4/S3)
     tải LƯỜI: khi có thẻ cần phát mà sprite chưa sẵn sàng thì phát tiếng nhóm như cũ và tải nền cho lần sau.
     fam(key,o): nếu biết thẻ nguồn (o.id / o.uid, hoặc SFX.src(el, uid), hoặc thẻ S4/S5 đang được nhấc lên màn chiến đấu) và thẻ có tiếng riêng
     đã sẵn sàng -> phát tiếng riêng THAY cho tiếng nhóm; các tiếng nhóm còn lại của cùng bước đó bị bỏ (không chồng). */
  const cardBufs = {}; /* id thẻ -> AudioBuffer; tên mẫu khi phát: "the:<id>" */
  let cardIdx = null, cardIdxState = 0; /* 0 chưa tải, 1 đang tải, 2 xong, 3 lỗi */
  const spState = {}; /* số sprite -> 1 đang tải, 2 xong, 3 lỗi */
  const spWait = []; /* lời gọi preloadCards chờ chỉ mục */
  let stepSeq = 0, srcUid = 0, srcStamp = 0, lastStep = { key: null, cid: null };
  const lastCard = {}; /* id thẻ -> thời điểm (ac.currentTime) phát tiếng riêng gần nhất */
  let autoT = 0;
  function loadCardIndex() {
    if (cardIdxState) return;
    cardIdxState = 1;
    fetch("sfx/the.json?v=gpu54").then((r) => { if (!r.ok) throw new Error("the.json"); return r.json(); })
      .then((j) => { cardIdx = j; cardIdxState = 2; const w = spWait.splice(0); w.forEach((f) => { try { f(); } catch (e) {} }); })
      .catch(() => { cardIdxState = 3; spWait.length = 0; });
  }
  function loadCardSprite(n) {
    if (spState[n] || !ac || !cardIdx) return Promise.resolve();
    spState[n] = 1;
    return fetch("sfx/the-" + n + ".mp3?v=gpu54").then((r) => { if (!r.ok) throw new Error("the-" + n); return r.arrayBuffer(); })
      .then((ab) => new Promise((res, rej) => { const p = ac.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); }))
      .then((big) => {
        const sr = big.sampleRate, src = big.getChannelData(0);
        for (const id in cardIdx) {
          const e = cardIdx[id];
          if (e[0] !== n) continue;
          const a = Math.floor(e[1] * sr), len = Math.max(1, Math.floor(e[2] * sr)), b = ac.createBuffer(1, len, sr);
          b.getChannelData(0).set(src.subarray(a, a + len));
          cardBufs["the:" + id] = b;
        }
        spState[n] = 2;
      })
      .catch(() => { spState[n] = 3; setTimeout(() => { if (spState[n] === 3) spState[n] = 0; }, 20000); /* thử lại sau 20 giây */ });
  }
  /* tải các sprite chứa những thẻ này (id thẻ, mảng); trả về Promise */
  function preloadCards(ids) {
    if (!ac && !ctx()) return Promise.resolve();
    loadCardIndex();
    return new Promise((res) => {
      const go = () => {
        if (!cardIdx) return res();
        const need = new Set();
        for (const id of ids || []) { const e = cardIdx[id]; if (e && !cardBufs["the:" + id]) need.add(e[0]); }
        Promise.all([...need].map(loadCardSprite)).then(() => res());
      };
      if (cardIdx || cardIdxState === 3) go(); else spWait.push(go);
    });
  }
  function cardIdByUid(uid) {
    try {
      if (!uid || typeof G === "undefined" || !G) return null;
      let c = typeof cardOf === "function" ? cardOf(uid) : null;
      if (!c && typeof E !== "undefined" && E.find) { const f = E.find(G, uid); c = f && f.inst; }
      return (c && c.id) || null;
    } catch (e) { return null; }
  }
  /* thẻ nguồn của tiếng kỹ năng vừa gọi + khoá "bước" (mọi tiếng nhóm trong cùng một bước kỹ năng dùng chung khoá) */
  /* gpu51: tiếng riêng CHỈ phát ở nhịp kỹ năng của chính thẻ: nơi gọi phải chỉ rõ thẻ (o.id, hoặc o.skill + o.uid từ SFX.skill).
     Không còn đoán thẻ nguồn từ SFX.src()/HERO (trước đây làm tiếng riêng lặp lại ở mọi tình huống: +sức, tiêu huỷ, triệu hồi… của cùng thẻ). */
  function cardSource(o) {
    if (o.id && cardIdx && cardIdx[o.id]) return { id: o.id, key: null };
    if (o.skill && o.uid) { const id = cardIdByUid(o.uid); if (id) return { id, key: "s:" + stepSeq }; }
    return null;
  }
  const NOCARD = { locrev: 1 };
  /* trả true nếu đã xử lý (phát tiếng riêng hoặc bỏ tiếng nhóm trùng bước); false -> để fam() phát tiếng nhóm */
  function cardSkill(key, o) {
    if (!cardIdx || NOCARD[key] || !ac) return false;
    const src = cardSource(o);
    if (!src || !cardIdx[src.id]) return false;
    const n = "the:" + src.id;
    if (!cardBufs[n]) { preloadCards([src.id]); return false; } /* chưa sẵn sàng: tiếng nhóm, tải nền cho lần sau */
    if (src.key != null && lastStep.cid === src.id && lastStep.key === src.key) return true; /* cùng bước kỹ năng của cùng thẻ: đã có tiếng riêng, bỏ tiếng nhóm */
    const now = ac.currentTime;
    if (lastCard[src.id] != null && now - lastCard[src.id] < 0.4 && now >= lastCard[src.id]) return true; /* cùng thẻ phát lại trong 0,4 s */
    lastStep = { key: src.key, cid: src.id };
    lastCard[src.id] = now;
    beatT = now + (o.delay || 0); beatCall = performance.now();
    if (ac.state !== "running") return true;
    return playSample(n, o.vol == null ? 1 : o.vol, { delay: o.delay, rate: 1, skill: src.id }) !== false;
  }
  /* nạp trước (nhẹ, 4 giây/lần) sprite của các thẻ S4/S5 đang cầm trên tay */
  function autoPre() {
    const t = performance.now();
    if (t - autoT < 4000 || !cardIdx) return;
    autoT = t;
    try {
      if (typeof G === "undefined" || !G || !G.hand) return;
      const ids = [];
      for (const sd of ["p", "a"]) for (const c of G.hand[sd] || []) if (c && cardIdx[c.id]) ids.push(c.id);
      if (ids.length) preloadCards(ids);
    } catch (e) {}
  }

  function playSample(n, vol, o) {
    const b = bufs[n] || cardBufs[n];
    if (!b || !ac) return false;
    if (ac.state !== "running") return true; /* bộ âm đang tạm dừng: không xếp hàng âm (tránh kẹt bộ đếm), chờ mở khoá */
    o = o || {};
    const now = ac.currentTime;
    /* tự chữa bộ đếm: nếu có âm không bao giờ báo kết thúc (máy treo/tạm dừng giữa chừng) thì xoá phiếu quá 4 giây */
    for (let i = live.length - 1; i >= 0; i--) if (now - live[i] > 4) { live.splice(i, 1); }
    voices = live.length;
    /* Mẫu thường tối đa 2 lần trong 0,12 s. Tiếng thẻ dời đã được gộp theo UID ở bước hiệu ứng. */
    const r = (recent[n] = (recent[n] || []).filter((t) => now - t < 0.12 && t <= now));
    if (!o.pri && (voices >= MAXV || (o.moveUid == null && r.length >= 2))) return true; // nuốt bớt, không rơi về synth
    r.push(now);
    /* chồng nhiều âm -> mỗi âm nhỏ đi (tổng không dồn lên chói) */
    const stack = 1 / Math.sqrt(1 + 0.3 * voices) * (r.length > 1 ? 0.7 : 1);
    const src = ac.createBufferSource();
    const g = ac.createGain();
    const nodes = [g];
    src.buffer = b;
    src.playbackRate.value = (o.rate || 1) * (1 + (Math.random() * 2 - 1) * 0.04);
    g.gain.value = sfxGainVal(0.9 * stack * (vol == null ? 1 : vol) * (1 + (Math.random() * 2 - 1) * 0.08));
    src.connect(g);
    let last = g;
    for (const [ty, fr] of [["highpass", o.hp], ["lowpass", o.lp]]) {
      if (!fr) continue;
      const f = ac.createBiquadFilter();
      f.type = ty;
      f.frequency.value = fr;
      last.connect(f);
      last = f;
      nodes.push(f);
    }
    last.connect(outNode());
    const tk = now; live.push(tk); voices = live.length;
    if (GRPN.test(n)) famCall = performance.now(); /* gpu51: mốc tiếng nhóm/tình huống gần nhất (tách tiếng riêng ở nhịp kỹ năng) */
    src.onended = () => { const i = live.indexOf(tk); if (i >= 0) live.splice(i, 1); voices = live.length; for (const x of nodes) { try { x.disconnect(); } catch (e) {} } };
    src.start(now + (o.delay || 0));
    lastH = { src, g, n, t: now };
    if (window.SFX_TAP) try { window.SFX_TAP(n, vol, o); } catch (e) {} /* móc kiểm thử: đếm âm thật sự phát */
    if (DUCK[n] && typeof BGM !== "undefined" && BGM.duck) BGM.duck(0.4, DUCK[n]);
    return true;
  }

  /* ===== Sắc thái theo HỆ của thẻ nguồn: chỉnh cao độ/lọc nhẹ + lớp nhấn e_<hệ> ===== */
  const EL = {
    lua: { r: 0.95, lp: 7500, a: "e_lua" }, bang: { r: 1.08, hp: 450, a: "e_bang" }, sam: { r: 1.04, hp: 220, a: "e_sam" },
    doc: { r: 0.93, lp: 5200, a: "e_doc" }, toi: { r: 0.85, lp: 3800, a: "e_toi" }, sang: { r: 1.12, hp: 500, a: "e_sang" },
    gio: { r: 1.06, hp: 320, a: "e_gio" }, dat: { r: 0.8, lp: 4800, a: "e_dat" }, nuoc: { r: 1.0, lp: 6500, a: "e_nuoc" },
    mau: { r: 0.9, lp: 5200, a: "e_mau" }, cokhi: { r: 1.02, hp: 260, a: "e_cokhi" }, hon: { r: 1.15, hp: 300, a: "e_hon" },
    moc: { r: 0.97, a: "e_moc" }
  };
  /* tên mẫu "hiệu ứng" được nhuộm theo hệ khi đang có thẻ nguồn (UI, lật thẻ, thắng/thua... không bị nhuộm) */
  const FLAV = new Set(["destroy", "slash", "boom", "punch", "bow", "dagger", "bite", "web", "chain", "magnet", "tentacle", "forge", "gavel", "horn",
    "whoosh", "laser", "summon", "buff", "hurt", "debuff", "silence", "shield", "steal", "dark", "double", "energy", "move", "morph", "discard", "revive", "act", "chime"]);
  const ACC = new Set(["destroy", "summon", "buff", "hurt", "debuff", "silence", "shield", "steal", "morph", "revive", "move", "discard", "boom", "act", "double", "energy"]);
  let srcEl = null, srcT = 0;
  const curEl = () => (srcEl && performance.now() - srcT < 1800 ? srcEl : null);

  /* ===== Họ kỹ năng: khoá -> các biến thể mẫu (xoay vòng để không lặp y hệt) ===== */
  const FAM = {
    destroy: ["destroy"], exile: ["f_exile"], discard: ["discard"], move: ["move"], swap: ["f_swap"], bounce: ["f_bounce"], pull: ["f_pull"], draw: ["draw"],
    summon: ["summon"], create: ["f_create"], deckadd: ["f_deckadd"], shuffle: ["f_shuffle"], revive: ["revive"], copy: ["f_copy"], steal: ["steal"],
    silence: ["silence"], lock: ["f_lock"], shield: ["shield"], block: ["f_block"], up1: ["f_smallup"], up2: ["buff"], up3: ["f_bigup"],
    dn1: ["f_smalldn"], dn2: ["debuff"], dn3: ["f_bigdn"], dbl: ["f_dbl"], energy: ["energy"], egain: ["f_energy2"], nrgloss: ["f_nrg_loss"],
    costdn: ["f_costdn"], costup: ["f_costup"], merge: ["f_absorb"], morph: ["morph"], locup: ["f_locup"], locdn: ["f_afflict"], locx: ["f_xform"],
    locrev: ["loc", "f_reveal_loc"], aura: ["f_aura"], endt: ["f_end"], act: ["act"], hurt: ["hurt"]
  };
  const famIdx = {};
  /* gpu51: họ kỹ năng -> tiếng TÌNH HUỐNG (sprite fx: x_*) — nhịp chạm đích của ±sức mạnh, năng lượng, tiêu huỷ, vứt bỏ, kích hoạt,
     triệu hồi, hồi sinh, bị chặn; nhuộm hệ (đổi tốc/lọc + lớp nhấn e_<hệ>) như cũ. Đòn lớn (up3/dn3/dbl) giữ thêm tiếng họ nhỏ cho "nặng". */
  const SIT_OF = { up1: "tang", up2: "tang", up3: "tang", dbl: "tang", locup: "tang", dn1: "giam", dn2: "giam", dn3: "giam", locdn: "giam",
    egain: "nl", energy: "nl", nrgloss: "nl", costdn: "nl", costup: "nl", destroy: "huy", exile: "huy", discard: "vut", act: "kich",
    summon: "trieu", create: "trieu", revive: "hoi", block: "chan", shield: "chan" };
  const SIT_RATE = { up1: 1.08, up3: 0.92, dn1: 1.06, dn3: 0.9, costup: 0.94, costdn: 1.06, nrgloss: 0.88 };
  const HEAVY = { up3: 1, dn3: 1, dbl: 1, exile: 1 };
  const GRPN = /^(x_|f_|destroy$|discard$|move$|draw$|summon$|revive$|steal$|silence$|shield$|buff$|debuff$|energy$|morph$|act$|hurt$)/;
  const lastK = {}; let hintO = null, beatT = -9, beatCall = -1e9, famCall = -1e9; /* beatCall/famCall: thời điểm GỌI (performance.now) tiếng riêng / tiếng nhóm gần nhất */ /* gợi ý tình huống/hệ cho lời gọi fam() kế tiếp (FXR đặt quanh hit8); mốc tiếng riêng vừa phát */
  function fam(key, o) {
    o = o || {};
    if (key === "ult") { launch(o.rate > 1.05 ? 4 : 5, o); return; } /* tương thích lời gọi cũ fam("ult") */
    if (store.mute) return;
    try {
      if (!ctx()) return;
      if (loadState === 0) loadSamples();
      const L = FAM[key];
      if (!L) return;
      autoPre();
      if (cardSkill(key, o)) return; /* tiếng riêng của thẻ (chỉ ở nhịp kỹ năng của chính thẻ) */
      const moveUid = key === "move" ? o.moveUid : undefined;
      const group = !o.skill && moveUid == null;
      if (group && performance.now() - beatCall < 150) return; /* tiếng nhóm gọi ngay sau tiếng riêng (cùng bước): bỏ, không chồng */
      /* ngay sau tiếng riêng (0,25 s): không chồng tiếng nhóm lên */
      if (group && ac.currentTime + (o.delay || 0) - beatT < 0.25 && ac.currentTime + (o.delay || 0) >= beatT - 0.02) return;
      const hk = hintO;
      const i = (famIdx[key] = ((famIdx[key] == null ? -1 : famIdx[key]) + 1) % L.length), n = L[i];
      const el = hk && hk.el ? hk.el : o.el === undefined ? curEl() : o.el, p = el && EL[el];
      const vol = o.vol == null ? 1 : o.vol;
      const sk = (hk && hk.k) || SIT_OF[key];
      /* gpu52 QA: tiếng tình huống do FXR gợi ý (vd. Duy Trì ủng hộ nhiều thẻ cùng lúc -> x_tim ×3 trong 150 ms) -> chỉ phát 1 lần mỗi 200 ms */
      if (hk && hk.k && !o.skill) { const now = performance.now(); if (now - (lastK[hk.k] || -1e9) < 200) return; lastK[hk.k] = now; }
      if (sk && bufs["x_" + sk]) {
        if (VIB[n] && store.vib !== false && navigator.vibrate) { try { navigator.vibrate(VIB[n]); } catch (e) {} }
        playSample("x_" + sk, vol, { rate: (p ? p.r : 1) * (SIT_RATE[key] || 1) * (o.rate || 1), hp: p && p.hp, lp: p && p.lp, delay: o.delay });
        if (HEAVY[key] && bufs[n]) playSample(n, vol * 0.45, { rate: p ? p.r : 1, delay: (o.delay || 0) + 0.04 });
        if (p && !o.noacc) playSample(p.a, vol * 0.4, { delay: (o.delay || 0) + 0.05, rate: 1 + (famIdx[key] % 2) * 0.06 });
        return;
      }
      if (VIB[n] && store.vib !== false && navigator.vibrate) { try { navigator.vibrate(VIB[n]); } catch (e) {} }
      const ok = playSample(n, vol, { rate: (p ? p.r : 1) * (o.rate || 1), hp: p && p.hp, lp: p && p.lp, delay: o.delay, moveUid });
      if (!ok && S[n]) S[n]();
      if (ok && p && !o.noacc) playSample(p.a, vol * 0.4, { delay: (o.delay || 0) + 0.05, rate: 1 + (famIdx[key] % 2) * 0.06 });
    } catch (e) {}
  }

  /* ===== Lật thẻ: thân lật xoay vòng + nhấn hệ nhẹ; lật dồn dập thì thưa dần =====
     gpu43: BỎ lớp Bậc 4/5 (rv_t4/rv_t5) ở nhịp lật — trước đây thẻ S4/S5 kêu 2 lần (lớp Bậc khi lật + tiếng "ult" 2 s khi màn ra mắt
     diễn ngay sau, cộng 2 lớp nhấn hệ) nên nghe như lặp lại. Nay tiếng ra mắt chỉ phát MỘT lần trong launch(), gọi từ màn ra mắt.
     Khi tắt hiệu ứng (không có màn ra mắt) thì launch() được gọi ngay tại nhịp lật. */
  const REVB = ["rv_a", "rv_b", "rv_c"];
  let revBody = 0, revTimes = [];
  const tierOf = (h) => (h === "S5" || h === "MP" ? 5 : h === "S4" ? 4 : h === "S3" ? 3 : 1);
  const noShow = () => typeof reduced !== "undefined" && !!reduced;
  function reveal(o) {
    o = o || {};
    if (store.mute) return;
    try {
      if (!ctx()) return;
      if (loadState === 0) loadSamples();
      if (!bufs.rv_a) { if (S.flip) S.flip(); return; }
      autoPre();
      const now = performance.now();
      revTimes = revTimes.filter((t) => now - t < 1800);
      const n = revTimes.length, tier = o.tier || tierOf(o.h), el = o.el, p = el && EL[el];
      revTimes.push(now);
      if (store.vib !== false && navigator.vibrate && tier < 4) { try { navigator.vibrate(8); } catch (e) {} }
      const rate = p ? 1 + (p.r - 1) * 0.5 : 1;
      if (n === 0) {
        revBody = (revBody + 1 + (Math.random() < 0.5 ? 1 : 0)) % 3;
        playSample(REVB[revBody], 1, { rate });
      } else if (n === 1) {
        playSample("rv_soft", 0.85, { rate: rate * (0.95 + Math.random() * 0.1) });
      } else if (n % 2 === 0) {
        playSample("rv_soft", 0.55, { rate });
      }
      if (tier >= 4) { if (noShow()) launch(tier, { el, uid: o.uid }); return; }
      if (p && n < 2) playSample(p.a, (tier === 3 ? 0.36 : 0.28), { delay: 0.08 });
      if (tier === 3 && n < 2) playSample("rv_t3", 0.55, { delay: 0.05 });
    } catch (e) {}
  }

  /* ===== Màn ra mắt: đúng MỘT tiếng mỗi lần ra mắt =====
     tier 5 / 4 / 3 (= bản gọn cho Bậc 1–3). Chống trùng: cùng thẻ (uid) trong 3 s hoặc bất kỳ tiếng ra mắt nào trong 0,25 s -> bỏ;
     tiếng ra mắt trước còn ngân thì được tắt dần 60 ms trước khi phát tiếng mới (nhiều thẻ ra mắt liền nhau không dồn chồng);
     bản gọn không phát khi một tiếng ra mắt lớn vừa phát < 0,6 s. Thẻ thứ 2 trở đi trong lượt nhỏ hơn. */
  const LAUNCH = { 5: ["ra_s5", "ra_s5b"], 4: ["ra_s4", "ra_s4b"], 3: ["ra_mini", "ra_minib"] };
  const lIdx = { 5: 0, 4: 0, 3: 0 };
  let lastL = null;
  function launch(tier, o) {
    o = o || {};
    tier = tier >= 5 ? 5 : tier === 4 ? 4 : 3;
    if (store.vib !== false && tier >= 4 && navigator.vibrate) { try { navigator.vibrate(VIB[tier === 5 ? "ra_s5" : "ra_s4"]); } catch (e) {} }
    if (store.mute) return;
    try {
      if (!ctx()) return;
      if (loadState === 0) loadSamples();
      if (ac.state !== "running") return;
      try { const cid = o.uid && cardIdByUid(o.uid); if (cid && cardIdx && cardIdx[cid]) preloadCards([cid]); } catch (e) {} /* thẻ S4/S5 ra mắt: nạp sprite tiếng kỹ năng riêng trước khi kỹ năng chạy */
      const now = ac.currentTime;
      if (lastL) {
        const dt = now - lastL.t;
        if ((o.uid && lastL.uid === o.uid && dt < 3) || dt < 0.25) return;
        if (tier === 3 && lastL.tier >= 4 && dt < 0.6) return;
      }
      const L = LAUNCH[tier].filter((n) => bufs[n]);
      if (!L.length) { if (tier >= 4 && S.ult) S.ult(); return; }
      if (lastL && lastL.h && now - lastL.t < 2.5) {
        try { lastL.h.g.gain.cancelScheduledValues(now); lastL.h.g.gain.setTargetAtTime(0.0001, now, 0.06); lastL.h.src.stop(now + 0.35); } catch (e) {}
      }
      const n = L[lIdx[tier]++ % L.length], p = o.el && EL[o.el];
      const vol = (tier === 5 ? 1 : tier === 4 ? 0.85 : 0.5) * (o.nth > 0 ? 0.8 : 1) * (o.foe ? 0.9 : 1);
      lastH = null;
      playSample(n, vol, { rate: p ? 1 + (p.r - 1) * 0.35 : 1, pri: 1 });
      lastL = { t: now, uid: o.uid || 0, tier, h: lastH && lastH.n === n ? lastH : null };
    } catch (e) {}
  }

  return {
    ctx,
    outNode,
    loaded() { return Object.keys(bufs).length; },
    names() { return Object.keys(bufs); },
    wake() {
      try {
        ctx();
        loadSamples();
        if (typeof BGM !== "undefined") BGM.wake();
      } catch (e) {}
    },
    fam,
    reveal,
    launch,
    src(el, uid) { srcEl = el || null; srcT = performance.now(); srcUid = uid || 0; srcStamp = srcT; stepSeq++; }, /* el: hệ thẻ nguồn của bước (nhuộm tiếng); uid: chỉ để ghi nhận */
    /* gpu51: NHỊP KỸ NĂNG của thẻ uid: phát tiếng riêng (S4/S5, nếu đã nạp) thay cho tiếng họ key; trả true nếu đã phát tiếng riêng */
    skill(uid, key, o) {
      o = Object.assign({}, o || {}, { uid, skill: 1 });
      if (window.SFX_BEAT) try { window.SFX_BEAT(uid, cardIdByUid(uid), key); } catch (e) {}
      if (store.mute) return false;
      try {
        if (!ctx()) return false;
        if (loadState === 0) loadSamples();
        const id = cardIdByUid(uid), had = !!(id && cardBufs["the:" + id]);
        if (!had) { if (id && cardIdx && cardIdx[id]) preloadCards([id]); return false; }
        /* vừa có tiếng nhóm (bước trước còn ngân) < 130 ms: lùi tiếng riêng cho tách tiếng, không chồng */
        const go = (k) => { const gap = performance.now() - famCall; if (k < 4 && gap >= 0 && gap < 130) { setTimeout(() => go(k + 1), 130 - gap); return true; } try { return cardSkill(key || "act", o); } catch (e) { return false; } };
        return go(0);
      } catch (e) { return false; }
    },
    hint(h) { hintO = h || null; },
    hasFx() { return !!bufs.x_tang; },
    preloadCards,
    cardLoaded(id) { return !!cardBufs["the:" + id]; },
    cardIds() { return cardIdx ? Object.keys(cardIdx) : []; },
    famOf(id) { try { return typeof sfxFamOf === "function" && C[id] ? sfxFamOf(C[id]) : "none"; } catch (e) { return "none"; } },
    famKeys() { return Object.keys(FAM); },
    play(n, vol) { /* vol: hệ số âm lượng riêng cho mẫu này (mặc định 1) */
      if (n === "ult") { launch(5); return; } /* tên cũ: tiếng ra mắt */
      if (store.vib !== false && VIB[n] && navigator.vibrate) {
        try { navigator.vibrate(VIB[n]); } catch (e) {}
      }
      if (store.mute) return;
      try {
        if (!ctx()) return;
        if (loadState === 0) loadSamples();
        if (GRPN.test(n) && performance.now() - beatCall < 150) return; /* gpu51: không chồng lên tiếng riêng vừa phát ở nhịp kỹ năng */
        const el = FLAV.has(n) ? curEl() : null, p = el && EL[el];
        if (playSample(n, vol, p ? { rate: p.r, hp: p.hp, lp: p.lp } : null)) {
          if (p && ACC.has(n)) playSample(p.a, (vol == null ? 1 : vol) * 0.3, { delay: 0.05 });
          return;
        }
        if (S[n]) S[n]();
      } catch (e) {}
    }
  };
})();

/* ================= HỆ THỐNG NHẠC NỀN ĐỘNG ĐA TẦNG (CYBER-HEROIC BGM) =================
   Lấy cảm hứng từ nhạc nền hành động tốc độ cao trong video tham khảo:
   - "lobby"   : Không gian huyền sử Vũ trụ êm dịu (92 BPM)
   - "battle1" : Lượt 1–3 — Sub-bass nhịp nhàng + Trống điện tử chắc gọn + Arpeggio chiến thuật (114 BPM)
   - "battle2" : Lượt 4–5 — Cao trào thêm Hi-hat 16 nốt + Brass/Synth anh hùng (116 BPM)
   - "climax"  : Lượt Cuối / Cược SNAP — Xung nhịp dồn dập kịch tính quyết định thắng bại (122 BPM)
*/
const BGM = (() => {
  let mode = "lobby";
  let playingBgm = false;
  let stepIdx = 0;
  let nextStepTime = 0;
  let schedTimer = 0;
  let bgmBus = null;
  let delayNode = null;
  let delayFb = null;

  const MODES = {
    lobby:   { bpm: 92,  root: 146.83, label: "Nhạc Sảnh Vũ Trụ" },       // D3
    battle1: { bpm: 114, root: 146.83, label: "Chiến Địa (Lượt 1–3)" },   // D3 minor heroic
    battle2: { bpm: 116, root: 164.81, label: "Cao Trào (Lượt 4–5)" },    // E3 minor heroic
    climax:  { bpm: 122, root: 174.61, label: "Lượt Cuối Quyết Định!" }   // F3 minor climax
  };

  /* Chuỗi bậc bán âm theo ô nhịp 4 bar (64 bước 16th-note): i - VI - III - VII hào hùng */
  const PROG_SEMI = [0, -4, 3, -2];
  const ARP_OFFSETS = [0, 3, 7, 12, 7, 3, 10, 7];

  function ensureBus() {
    const ac = SFX.ctx();
    if (!ac) return null;
    if (!bgmBus) {
      bgmBus = ac.createGain();
      bgmBus.gain.value = calcGain();

      /* Tạo không gian Stereo Echo nhẹ cho Arpeggio & Pad mà không tốn CPU */
      delayNode = ac.createDelay(0.6);
      delayNode.delayTime.value = 0.26;
      delayFb = ac.createGain();
      delayFb.gain.value = 0.24;
      const dFilter = ac.createBiquadFilter();
      dFilter.type = "lowpass";
      dFilter.frequency.value = 1900;

      delayNode.connect(dFilter);
      dFilter.connect(delayFb);
      delayFb.connect(delayNode);
      dFilter.connect(bgmBus);

      bgmBus.connect(SFX.outNode());
    }
    return ac;
  }

  function inLobbyView() {
    const lb = document.getElementById("lobby");
    const mm = document.getElementById("mm");
    return !!(lb && lb.classList.contains("on")) && !(mm && mm.classList.contains("on"));
  }

  function isBgmAllowed() {
    if (store.mute) return false;
    if (inLobbyView()) return store.bgm !== false;
    return !!store.battleBgm && mode !== "lobby";
  }

  function calcGain() {
    if (!isBgmAllowed()) return 0.0001;
    const v = (store.bgmVol ?? 55) / 100;
    return Math.max(0.0001, v * 0.28);
  }

  function syncVol() {
    if (!bgmBus) return;
    const ac = SFX.ctx();
    if (!ac) return;
    bgmBus.gain.setTargetAtTime(calcGain(), ac.currentTime, isBgmAllowed() ? 0.08 : 0.025);
  }

  function semiToFreq(base, semi) {
    return base * Math.pow(2, semi / 12);
  }

  function playKick(ac, t, punch) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(punch ? 138 : 118, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.13);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(punch ? 0.58 : 0.44, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
    o.connect(g);
    g.connect(bgmBus);
    o.start(t);
    o.stop(t + 0.21);
  }

  function playSnareRim(ac, t, fullSnare) {
    const dur = fullSnare ? 0.13 : 0.065;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    const flt = ac.createBiquadFilter();
    const g = ac.createGain();
    src.buffer = buf;
    flt.type = "bandpass";
    flt.frequency.setValueAtTime(fullSnare ? 1850 : 2600, t);
    flt.Q.value = fullSnare ? 1.1 : 2.4;
    g.gain.setValueAtTime(fullSnare ? 0.28 : 0.14, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(bgmBus);
    src.start(t);

    if (fullSnare) {
      const body = ac.createOscillator();
      const bg = ac.createGain();
      body.type = "triangle";
      body.frequency.setValueAtTime(210, t);
      body.frequency.exponentialRampToValueAtTime(115, t + 0.08);
      bg.gain.setValueAtTime(0.18, t);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      body.connect(bg);
      bg.connect(bgmBus);
      body.start(t);
      body.stop(t + 0.1);
    }
  }

  function playHat(ac, t, open) {
    const dur = open ? 0.09 : 0.032;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    const hp = ac.createBiquadFilter();
    const g = ac.createGain();
    src.buffer = buf;
    hp.type = "highpass";
    hp.frequency.value = 6800;
    g.gain.setValueAtTime(open ? 0.11 : 0.065, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(hp);
    hp.connect(g);
    g.connect(bgmBus);
    src.start(t);
  }

  function playBass(ac, t, freq, dur, gritty) {
    const o = ac.createOscillator();
    const lp = ac.createBiquadFilter();
    const g = ac.createGain();
    o.type = gritty ? "sawtooth" : "triangle";
    o.frequency.setValueAtTime(freq * 0.5, t);
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(gritty ? 620 : 380, t);
    lp.frequency.exponentialRampToValueAtTime(140, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gritty ? 0.34 : 0.28, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(bgmBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function playArp(ac, t, freq, dur, wave, vol) {
    const o = ac.createOscillator();
    const lp = ac.createBiquadFilter();
    const g = ac.createGain();
    o.type = wave || "triangle";
    o.frequency.setValueAtTime(freq, t);
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(700, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol || 0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(bgmBus);
    if (delayNode) g.connect(delayNode);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function playPadChord(ac, t, baseFreq, dur, heroic) {
    const intervals = heroic ? [0, 3, 7, 12] : [0, 7, 10, 15];
    intervals.forEach((semi, idx) => {
      const o = ac.createOscillator();
      const lp = ac.createBiquadFilter();
      const g = ac.createGain();
      o.type = heroic && idx === 3 ? "sawtooth" : "sine";
      o.detune.value = (idx % 2 ? 1 : -1) * 5;
      o.frequency.setValueAtTime(semiToFreq(baseFreq, semi), t);
      lp.type = "lowpass";
      lp.frequency.value = heroic ? 1350 : 900;
      const peak = heroic ? 0.075 : 0.06;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + dur * 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp);
      lp.connect(g);
      g.connect(bgmBus);
      if (delayNode) g.connect(delayNode);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  function scheduleStep(ac, step, t) {
    const cfg = MODES[mode] || MODES.battle1;
    const stepDur = 60 / cfg.bpm / 4; // 16th note
    const bar = Math.floor(step / 16) % 4;
    const s = step % 16;
    const chordRoot = semiToFreq(cfg.root, PROG_SEMI[bar]);

    if (mode === "lobby") {
      if (s === 0) playPadChord(ac, t, chordRoot, stepDur * 15.5, false);
      if (s === 0 || s === 10) playBass(ac, t, chordRoot, stepDur * 4.5, false);
      if (s % 4 === 2) {
        const note = semiToFreq(chordRoot * 2, [0, 3, 7, 10][(bar + (s >> 2)) % 4]);
        playArp(ac, t, note, stepDur * 3.2, "sine", 0.09);
      }
      return;
    }

    const isHigh = mode === "battle2" || mode === "climax";
    const isClimax = mode === "climax";

    /* Pad nền không gian mở đầu mỗi ô nhịp */
    if (s === 0) playPadChord(ac, t, chordRoot, stepDur * 15, isHigh);

    /* Kick điện tử kiểu Marvel Snap: nhịp 0, 6, 8, (14 ở cao trào) */
    if (s === 0 || s === 6 || s === 10 || (isClimax && s === 14)) {
      playKick(ac, t, isHigh);
    }

    /* Snare / Rim ở phách 4 và 12 */
    if (s === 4 || s === 12) {
      playSnareRim(ac, t, isHigh);
    }

    /* Hi-hat tăng động năng */
    if (isClimax) {
      playHat(ac, t, s % 4 === 2);
    } else if (isHigh) {
      if (s % 2 === 0 || s === 15) playHat(ac, t, s === 6 || s === 14);
    } else if (s % 4 === 2) {
      playHat(ac, t, false);
    }

    /* Sub-bass xung lực */
    const bassHit = isClimax
      ? (s % 2 === 0)
      : (s === 0 || s === 3 || s === 6 || s === 8 || s === 11 || s === 14);
    if (bassHit) {
      const oct = isClimax && s % 4 === 2 ? 2 : 1;
      playBass(ac, t, chordRoot * oct, stepDur * 1.9, isHigh);
    }

    /* Chuỗi Arpeggio điện tử thông minh */
    if (isClimax || s % 2 === 0 || s === 7 || s === 15) {
      const off = ARP_OFFSETS[s % ARP_OFFSETS.length] + (isClimax && s >= 12 ? 12 : 0);
      const freq = semiToFreq(chordRoot * 2, off);
      playArp(ac, t, freq, stepDur * 1.65, isClimax ? "sawtooth" : "triangle", isClimax ? 0.095 : 0.085);
    }
  }

  function scheduler() {
    if (!playingBgm) return;
    if (!isBgmAllowed()) {
      stopLoop();
      return;
    }
    const ac = ensureBus();
    if (!ac || ac.state !== "running") return;

    const cfg = MODES[mode] || MODES.battle1;
    const stepDur = 60 / cfg.bpm / 4;
    if (nextStepTime < ac.currentTime - 0.05) {
      nextStepTime = ac.currentTime + 0.02;
    }
    while (nextStepTime < ac.currentTime + 0.16) {
      scheduleStep(ac, stepIdx++, nextStepTime);
      nextStepTime += stepDur;
    }
  }

  function startLoop() {
    if (!isBgmAllowed()) {
      stopLoop();
      return;
    }
    if (playingBgm) {
      syncVol();
      return;
    }
    playingBgm = true;
    const ac = ensureBus();
    if (ac) nextStepTime = ac.currentTime + 0.04;
    syncVol();
    clearInterval(schedTimer);
    schedTimer = setInterval(scheduler, 50);
  }

  function stopLoop() {
    playingBgm = false;
    clearInterval(schedTimer);
    schedTimer = 0;
    if (bgmBus) {
      const ac = SFX.ctx();
      if (ac) {
        try {
          bgmBus.gain.cancelScheduledValues(ac.currentTime);
          bgmBus.gain.setTargetAtTime(0.0001, ac.currentTime, 0.02);
        } catch (e) {}
      }
    }
  }

  return {
    duck(depth, sec) {
      if (!bgmBus || !isBgmAllowed()) return;
      const ac = SFX.ctx();
      if (!ac) return;
      const t = ac.currentTime, g = calcGain();
      try {
        bgmBus.gain.cancelScheduledValues(t);
        bgmBus.gain.setTargetAtTime(Math.max(0.0001, g * (1 - depth)), t, 0.03);
        bgmBus.gain.setTargetAtTime(g, t + sec, 0.25);
      } catch (e) {}
    },
    wake() {
      if (store.bgm === undefined) store.bgm = true;
      if (store.battleBgm === undefined) store.battleBgm = false;
      if (store.bgmVol === undefined) store.bgmVol = 55;
      ensureBus();
      if (inLobbyView()) {
        mode = "lobby";
        if (!playingBgm && isBgmAllowed()) startLoop();
      } else {
        this.syncGame(typeof G !== "undefined" ? G : null);
      }
      syncVol();
    },
    setMode(m) {
      if (!MODES[m]) return;
      if (m === "lobby" && !inLobbyView()) {
        stopLoop();
        return;
      }
      mode = m;
      if (isBgmAllowed()) startLoop();
      else stopLoop();
      syncVol();
    },
    play(m) {
      this.setMode(m || mode);
    },
    stop() {
      stopLoop();
    },
    getMode() {
      return mode;
    },
    mode() {
      return mode;
    },
    isPlaying() {
      return !!(playingBgm && isBgmAllowed());
    },
    getLabel() {
      return (MODES[mode] && MODES[mode].label) || "";
    },
    syncGame(g) {
      if (inLobbyView()) {
        this.setMode("lobby");
        return;
      }
      /* Vào trận đấu hoặc màn ghép trận: tắt ngay nhạc nền sảnh */
      if (!store.battleBgm || !g || g.phase === "over") {
        stopLoop();
        return;
      }
      const maxT = typeof E !== "undefined" && E.turns ? E.turns(g) : 6;
      if (g.turn >= maxT || (g.snap && (g.snap.p || g.snap.a))) this.setMode("climax");
      else if (g.turn >= 4) this.setMode("battle2");
      else this.setMode("battle1");
    },
    toggle(on) {
      store.battleBgm = on !== undefined ? !!on : !store.battleBgm;
      this.syncGame(typeof G !== "undefined" ? G : null);
      syncVol();
      try { save(); } catch (e) {}
      return store.battleBgm;
    },
    setVol(v) {
      store.bgmVol = Math.max(0, Math.min(100, +v || 0));
      syncVol();
      try { save(); } catch (e) {}
    },
    syncVol
  };
})();

window.BGM = BGM;
/* Mở khoá âm thanh: trình duyệt điện thoại chỉ cho bật AudioContext trong thao tác thật của người dùng
   (touchend / click / keydown; pointerdown bằng ngón tay KHÔNG tính). Gọi lại mỗi lần chạm để hồi phục sau khi
   chuyển app, khoá màn hình, có cuộc gọi... (iOS chuyển AudioContext sang "interrupted"/"suspended"). */
(() => {
  const unlock = () => {
    try {
      if (store.mute) return;
      SFX.wake();
      const ac = SFX.ctx();
      if (ac && ac.state !== "running" && ac.resume) ac.resume().catch(() => {});
    } catch (e) {}
  };
  for (const ev of ["touchend", "click", "keydown"]) document.addEventListener(ev, unlock, { capture: true, passive: true });
})();
document.addEventListener("visibilitychange", () => {
  try {
    const ac = SFX.ctx();
    if (!ac) return;
    if (document.hidden) ac.suspend();
    else if (!store.mute) ac.resume();
  } catch (e) {}
});
