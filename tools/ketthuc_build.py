#!/usr/bin/env python3
"""Ghép sprite GIỌNG + NHẠC HIỆU kết trận: www/sfx/ketthuc.mp3 + ketthuc.json { "<tên>": [bắt đầu s, dài s] }.
  python3 tools/ketthuc_build.py <thư_mục_mp3_thô> <thư_mục_ra>
Thô: v_win.mp3 v_lose.mp3 v_draw.mp3 (giọng đọc Victory!/Defeat!/Draw!, ElevenLabs TTS) và s_win.mp3 s_lose.mp3 s_draw.mp3 (nhạc hiệu, ElevenLabs sound-generation).
Giọng: dùng lại process() của thoai_build.py (cắt lặng, lọc <70 Hz, -16 LUFS, đỉnh <= -1 dBFS). Nhạc hiệu: loudnorm -19 LUFS (thấp hơn giọng để giọng nổi), đỉnh <= -2 dBFS, fade ra 0,7 s.
Sprite mono 44,1 kHz mp3 96 kb/s."""
import sys, os, json, tempfile, subprocess
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import thoai_build as T
SR = T.SR
src, out = sys.argv[1], sys.argv[2]
tmp = tempfile.mkdtemp()
parts, idx, t = [], {}, 0.0
def add(k, y):
    global t
    idx[k] = [round(t, 3), round(len(y) / SR, 3)]
    parts.append(y); parts.append(np.zeros(int(0.15 * SR))); t += len(y) / SR + 0.15
for k in ["v_win", "v_lose", "v_draw"]:
    y = T.process(os.path.join(src, k + ".mp3"), tmp)
    if y is None: sys.exit("hỏng " + k)
    add(k, y)
for k in ["s_win", "s_lose", "s_draw"]:
    w = os.path.join(tmp, k + ".wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(src, k + ".mp3"), "-ac", "1", "-ar", str(SR), "-af", "highpass=f=50,silenceremove=start_periods=1:start_threshold=-50dB,loudnorm=I=-19:TP=-2:LRA=9", w], check=True)
    y = T.decode(w)
    pk = np.max(np.abs(y)); lim = 10 ** (-2.0 / 20)
    if pk > lim: y = y * (lim / pk)
    # bỏ đuôi lặng, fade ra 0,7 s
    nz = np.where(np.abs(y) > 0.01)[0]; y = y[: nz[-1] + 1] if len(nz) else y
    f = min(len(y) // 2, int(0.7 * SR)); y[-f:] *= np.linspace(1, 0, f)
    a = int(0.004 * SR); y[:a] *= np.linspace(0, 1, a)
    add(k, y)
big = np.concatenate(parts)
wav = os.path.join(tmp, "all.wav"); T.write_wav(wav, big)
os.makedirs(out, exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-ac", "1", "-ar", str(SR), "-b:a", "96k", os.path.join(out, "ketthuc.mp3")], check=True)
json.dump(idx, open(os.path.join(out, "ketthuc.json"), "w"), separators=(",", ":"))
print(idx)
