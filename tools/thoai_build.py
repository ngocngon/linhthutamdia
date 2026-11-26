#!/usr/bin/env python3
"""Hậu kỳ + ghép sprite LỜI THOẠI thẻ S5 (mô tả ở tools/thoai_s5.json: list các {k, ...}; k = id thẻ).

  python3 tools/thoai_build.py <thư_mục_mp3_thô> <thư_mục_ra> [kbps=80]
    <thư_mục_mp3_thô>/<k>.mp3  ->  <thư_mục_ra>/thoai-1.mp3 … thoai-N.mp3 + thoai.json  { "<k>": [số sprite, giây bắt đầu, thời lượng] }
Thư mục ra thường là www/sfx. Biến môi trường THOAI_DS=<tệp json> đổi tệp mô tả (mặc định tools/thoai_s5.json; không có thì lấy mọi <k>.mp3 trong thư mục thô).
Mỗi câu: cắt lặng đầu/cuối, lọc <70 Hz, chuẩn hoá giọng nói -16 LUFS (loudnorm 2 lượt, đỉnh <= -1 dBFS), fade 8 ms / 40 ms, mono 44,1 kHz.
Ghép sprite mono 44,1 kHz mp3 ~80 kb/s, mỗi tệp <= ~700 KB (nếu vượt thì tự chia nhỏ hơn). Thẻ thiếu/lặng/hỏng bị bỏ và in ra, không làm hỏng cả lượt.
"""
import sys, os, json, math, tempfile, subprocess, wave, re
import numpy as np

SR = 44100
LIMIT = 700 * 1024
GAP = 0.1


def run(cmd):
    try: return subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    except subprocess.TimeoutExpired: return subprocess.CompletedProcess(cmd, 1, "", "")


def decode(path):
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    if p.returncode: return np.zeros(0)
    return np.frombuffer(p.stdout, dtype="<f4").astype(np.float64)


def process(src, tmp):
    """Trả mảng float (mono 44,1 kHz) đã hậu kỳ hoặc None."""
    # chỉ cắt lặng ĐẦU và CUỐI câu (stop_periods cắt luôn sau chỗ ngắt hơi giữa câu -> câu cụt/rỗng)
    one = "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.03"
    sil = f"{one},areverse,{one},areverse"  # apad+loudnorm làm ffmpeg treo -> đệm lặng bằng numpy
    pre = f"highpass=f=70,{sil}"
    # bước 1: cắt lặng ra wav tạm (gộp areverse + loudnorm một lệnh làm ffmpeg treo)
    trim = os.path.join(tmp, "t.wav")
    r = run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", str(SR), "-af", pre, trim])
    if r.returncode or not os.path.exists(trim): return None
    r = run(["ffmpeg", "-hide_banner", "-i", trim, "-af", "loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-"])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S)
    if not m: return None
    j = json.loads(m.group(0))
    ln = (f"loudnorm=I=-16:TP=-1.5:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    out = os.path.join(tmp, "n.wav")
    r = run(["ffmpeg", "-v", "error", "-y", "-i", trim, "-af", f"{ln},aresample={SR}", "-ac", "1", out])
    if r.returncode or not os.path.exists(out): return None
    y = decode(out)
    if len(y) < int(0.25 * SR) or np.max(np.abs(y)) < 0.01: return None
    pk = np.max(np.abs(y)); lim = 10 ** (-1.0 / 20)
    if pk > lim: y = y * (lim / pk)                     # đỉnh <= -1 dBFS
    a = int(0.008 * SR); b = min(len(y) // 2, int(0.04 * SR))
    y[:a] *= np.linspace(0, 1, a); y[-b:] *= np.linspace(1, 0, b)
    return np.concatenate([y, np.zeros(int(0.12 * SR))])


def write_wav(path, y):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())


def pack(done, ys, root, kbps, tmp):
    """Chia thành các sprite <= LIMIT, trả chỉ mục."""
    maxsec = LIMIT / (kbps * 125.0) * 0.92
    idx = {}; si = 0; i = 0
    while i < len(done):
        t = 0.05; part = []
        while i < len(done) and (not part or t + len(ys[done[i]]) / SR + GAP <= maxsec):
            k = done[i]; part.append((k, round(t, 3))); t += len(ys[k]) / SR + GAP; i += 1
        parts = [np.zeros(int(0.05 * SR))]
        for k, _ in part: parts += [ys[k], np.zeros(int(GAP * SR))]
        tw = os.path.join(tmp, "sp.wav"); write_wav(tw, np.concatenate(parts))
        mp = os.path.join(root, f"thoai-{si + 1}.mp3")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tw, "-ac", "1", "-ar", str(SR), "-c:a", "libmp3lame", "-b:a", f"{kbps}k", mp], check=True)
        for k, st in part: idx[k] = [si + 1, st, round(len(ys[k]) / SR, 3)]
        print(f"thoai-{si + 1}.mp3", len(part), "câu", f"{t:.1f}s", os.path.getsize(mp) // 1024, "KB")
        si += 1
    return idx


def main():
    if len(sys.argv) < 3: print(__doc__); sys.exit(1)
    raw, root = sys.argv[1], sys.argv[2]
    kbps = int(sys.argv[3]) if len(sys.argv) > 3 else 80
    here = os.path.dirname(os.path.abspath(__file__))
    ds = os.environ.get("THOAI_DS") or os.path.join(here, "thoai_s5.json")
    if os.path.exists(ds):
        j = json.load(open(ds, encoding="utf-8"))
        keys = [x["k"] for x in (j["list"] if isinstance(j, dict) else j)]
    else:
        keys = sorted(f[:-4] for f in os.listdir(raw) if f.endswith(".mp3"))
    os.makedirs(root, exist_ok=True)
    tmp = tempfile.mkdtemp()
    ys = {}; done = []
    for k in keys:
        f = os.path.join(raw, k + ".mp3")
        if not os.path.exists(f): print("THIẾU", k); continue
        y = process(f, tmp)
        if y is None: print("LẶNG/HỎNG", k); continue
        ys[k] = y; done.append(k)
    if not done: print("không có câu nào"); sys.exit(1)
    idx = pack(done, ys, root, kbps, tmp)
    json.dump(idx, open(os.path.join(root, "thoai.json"), "w"), separators=(",", ":"))
    d = np.array([len(ys[k]) / SR for k in done])
    print(len(idx), "/", len(keys), "câu; dài", f"{d.min():.2f}…{d.max():.2f}s", "; ngoài 1–4 s:", int(((d < 1) | (d > 4)).sum()))


if __name__ == "__main__":
    main()
