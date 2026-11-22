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
        masterOut = comp;
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

  const VIB = { ult: [15, 35, 65], boom: [20, 25, 50], place: 10, flip: 8, destroy: [25, 25, 35], snap: [25, 35, 25], act: 16, win: [35, 50, 35] };

  return {
    ctx,
    outNode,
    wake() {
      try {
        ctx();
        if (typeof BGM !== "undefined") BGM.wake();
      } catch (e) {}
    },
    play(n) {
      if (store.vib !== false && VIB[n] && navigator.vibrate) {
        try { navigator.vibrate(VIB[n]); } catch (e) {}
      }
      if (store.mute) return;
      try {
        if (ctx() && S[n]) S[n]();
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
document.addEventListener("visibilitychange", () => {
  try {
    const ac = SFX.ctx();
    if (!ac) return;
    if (document.hidden) ac.suspend();
    else if (!store.mute) ac.resume();
  } catch (e) {}
});
