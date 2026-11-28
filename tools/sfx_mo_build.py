#!/usr/bin/env python3
"""gpu71 (làn D): hậu kỳ + ghép sprite www/sfx/mo.mp3 + mo.json — tiếng VỨT BỎ / TIÊU HUỶ theo thẻ bị ảnh hưởng (tools/sfx_mo_ds.json), nạp lười khi trận có vứt bỏ/tiêu huỷ.
Cùng chuẩn bộ sfx3 (tools/sfx_do.py): cắt lặng, lọc cao 45 Hz, hạ dải 2–6 kHz, chuẩn hoá độ to theo lớp, trần đỉnh -3 dBFS, mono 44,1 kHz, mp3 96 kb/s.
  python3 tools/sfx_mo_build.py <thư_mục_mp3_thô> <thư_mục_ra (www/sfx)> [tên=bản ...]
"""
import sys, os, json, subprocess, tempfile, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sfx_do as D


def main():
    raw, out = sys.argv[1], sys.argv[2]
    pick = dict((a.split("=")[0], int(a.split("=")[1])) for a in sys.argv[3:])
    here = os.path.dirname(os.path.abspath(__file__))
    ds = json.load(open(os.path.join(here, "sfx_mo_ds.json")))["list"]
    tmp = tempfile.mkdtemp(); wd = os.path.join(tmp, "wav"); os.makedirs(wd)
    names = []
    for x in ds:
        cand = []
        for i in range(x.get("n", 1)):
            f = os.path.join(raw, f"{x['k']}_{i}.mp3")
            if os.path.exists(f): cand.append((D.score(D.stats(D.read(f))), i, f))
        if not cand: print("THIẾU", x["k"]); continue
        cand.sort(reverse=True)
        if x["k"] in pick: cand.sort(key=lambda c: c[1] != pick[x["k"]])
        print(x["k"], "chọn", os.path.basename(cand[0][2]), " điểm:", " ".join(f"{c[1]}={c[0]:.0f}" for c in sorted(cand, key=lambda c: c[1])))
        D.process(cand[0][2], os.path.join(wd, x["k"] + ".wav"), x["c"], x["d"] + 0.05, tmp)
        names.append(x["k"])
    gap = np.zeros(int(0.1 * D.SR)); parts = [np.zeros(int(0.05 * D.SR))]; t = 0.05; idx = {}
    for n in names:
        y = D.read(os.path.join(wd, n + ".wav")); idx[n] = [round(t, 3), round(len(y) / D.SR, 3)]
        parts += [y, gap]; t += len(y) / D.SR + 0.1
    tw = os.path.join(tmp, "sprite.wav")
    with wave.open(tw, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(D.SR); w.writeframes((np.clip(np.concatenate(parts), -1, 1) * 32767).astype("<i2").tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tw, "-ac", "1", "-ar", str(D.SR), "-c:a", "libmp3lame", "-b:a", "96k", os.path.join(out, "mo.mp3")], check=True)
    json.dump(idx, open(os.path.join(out, "mo.json"), "w"), separators=(",", ":"))
    print("sprite mo.mp3", f"{t:.1f}s", len(names), "mẫu")
    # bảng đo sau hậu kỳ
    for n in names:
        s = D.stats(D.read(os.path.join(wd, n + ".wav")))
        print(f"  {n}\t{s['dur']:.2f}s\tđỉnh {s['peak']:.1f}\tLUFS {s['lufs']:.1f}\t2–6k {s['h26']:.0f}%\t>6k {s['hi']:.0f}%")


if __name__ == "__main__":
    main()
