#!/usr/bin/env python3
"""Hậu kỳ + ghép sprite tiếng KỸ NĂNG riêng từng thẻ S5/S4 (mô tả ở tools/sfx_the.json, sinh bởi tools/sfx_the_ds.mjs).

  python3 tools/sfx_the_build.py <thư_mục_mp3_thô> <thư_mục_làm_việc> [số_sprite=6]
Với mỗi thẻ chọn bản tốt hơn theo số đo (cùng cách sfx_do.py: nhiều thân âm dải trung, ít dải 2–6 kHz, không lặng, không cắt đỉnh),
hậu kỳ bằng sfx_do.process (cắt lặng, lọc <45 Hz, hạ dải gắt, chuẩn hoá -17 LUFS (S5) / -18 LUFS (S4), trần đỉnh -3 dBFS, fade 4 ms / <=120 ms),
rồi ghép tối đa N sprite www/sfx/the-1.mp3 … the-N.mp3 (mono 44,1 kHz 96 kb/s) + MỘT chỉ mục www/sfx/the.json: id thẻ -> [số sprite, bắt đầu, độ dài].
Xếp theo bậc (S5 trước) rồi theo hệ để thẻ cùng hệ nằm chung sprite. Số đo từng thẻ ghi ra <thư_mục_làm_việc>/do.tsv.
"""
import sys, os, json, math, tempfile, subprocess, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sfx_do as D

SR = D.SR
HE_ORDER = ["lua", "bang", "sam", "doc", "toi", "sang", "gio", "dat", "nuoc", "mau", "cokhi", "hon", "moc", ""]


def clip_frac(x):
    return float(np.mean(np.abs(x) > 0.985))


def the_score(raw_x, s):
    sc = D.score(s)
    if clip_frac(raw_x) > 0.002: sc -= 25          # cắt đỉnh
    if s["dur"] < 0.45: sc -= 20                    # quá ngắn / gần như lặng
    return sc


TARGET = {"the5": -17.0, "the4": -18.0}
# các lần thử hậu kỳ tăng dần: (bộ lọc tiền xử lý trên bản thô, thêm đuôi vang nếu quá ngắn)
ATT = [("", False),
       ("equalizer=f=3600:t=o:w=1.4:g=-4,lowpass=f=8000", False),
       ("equalizer=f=3200:t=o:w=1.6:g=-7,lowpass=f=6000,acompressor=threshold=0.08:ratio=3:attack=3:release=80:makeup=2", False),
       ("equalizer=f=3200:t=o:w=1.6:g=-7,lowpass=f=6000,acompressor=threshold=0.08:ratio=3:attack=3:release=80:makeup=2,apad=pad_dur=0.5,aecho=0.8:0.6:60|120|180:0.4|0.25|0.12", True),
       ("equalizer=f=2800:t=o:w=1.6:g=-8,lowpass=f=5000,equalizer=f=220:t=o:w=1.5:g=3", False),
       # hạ cao độ (và kéo dài nhẹ) -> dồn năng lượng xuống dải trầm-trung, ấm hơn, dài hơn
       ("asetrate=44100*0.82,aresample=44100,equalizer=f=2800:t=o:w=1.6:g=-6,lowpass=f=5500,acompressor=threshold=0.08:ratio=3:attack=3:release=80:makeup=2", False),
       ("asetrate=44100*0.7,aresample=44100,equalizer=f=2500:t=o:w=1.6:g=-6,lowpass=f=5000,acompressor=threshold=0.08:ratio=3:attack=3:release=80:makeup=2", False)]


def final_score(s, cls):
    sc = D.score(s)
    sc -= 3 * max(0.0, TARGET[cls] - 1.0 - s["lufs"])        # quá nhỏ vì trần đỉnh bóp
    sc -= 1.0 * max(0.0, s["h26"] - 30)                       # còn gắt
    sc -= 60 * max(0.0, 0.6 - s["dur"])                        # ngắn hơn 0,6 s
    return sc


def attempt(raw_f, cls, k, tmp, a):
    flt, _ = ATT[a]
    src = raw_f
    if flt:
        src = os.path.join(tmp, f"pre{a}.wav")
        D.ff(raw_f, src, flt)
    out = os.path.join(tmp, f"o{a}.wav")
    D.process(src, out, cls, 1.2, tmp)
    return out, D.stats(D.read(out))


def main():
    raw, work = sys.argv[1], sys.argv[2]
    nsp = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    here = os.path.dirname(os.path.abspath(__file__))
    ds = json.load(open(os.path.join(here, "sfx_the.json")))["list"]
    wav = os.path.join(work, "wav"); os.makedirs(wav, exist_ok=True)
    tmp = tempfile.mkdtemp()
    rows = []; done = []
    for x in ds:
        cand = []
        for i in range(x.get("n", 1)):
            f = os.path.join(raw, f"{x['k']}_{i}.mp3")
            if not os.path.exists(f): continue
            r = D.read(f)
            if len(r) < 2000: continue
            s0 = D.stats(r)
            if not s0: continue
            cand.append((the_score(r, s0), i, f))
        if not cand: print("THIẾU", x["k"]); continue
        cand.sort(reverse=True)
        best = None; good = False
        for _, i, f in cand:
            for a in range(len(ATT)):
                try: o, s = attempt(f, x["c"], x["k"], tmp, a)
                except RuntimeError: break
                sc = final_score(s, x["c"])
                if best is None or sc > best[0]:
                    keep = os.path.join(tmp, f"best_{x['k']}.wav"); os.replace(o, keep); best = (sc, i, a, keep, s)
                if s["h26"] <= 30 and s["lufs"] >= TARGET[x["c"]] - 1.5 and s["dur"] >= 0.6: good = True; break
            if good: break    # bản này đã đạt, không cần thử bản kia
        if best is None: print("LẶNG", x["k"]); continue
        out = os.path.join(wav, x["k"] + ".wav"); os.replace(best[3], out)
        rows.append((x["k"], x["h"], best[1], len(cand), best[4], best[2]))
        done.append(x)
    with open(os.path.join(work, "do.tsv"), "w") as fh:
        fh.write("id\tbậc\tbản\tsố bản\tlần thử\tgiây\tđỉnh dBFS\tLUFS\t%2–6kHz\t%>6kHz\t%300–2k\n")
        for k, h, i, n, s, a in rows:
            fh.write(f"{k}\t{h}\t{i}\t{n}\t{a}\t{s['dur']:.2f}\t{s['peak']:.1f}\t{s['lufs']:.1f}\t{s['h26']:.1f}\t{s['hi']:.1f}\t{s['mid']:.0f}\n")
    # xếp: bậc (S5, S4) -> hệ -> id
    done.sort(key=lambda x: (0 if x["h"] == "S5" else 1, HE_ORDER.index(x.get("he", "")) if x.get("he", "") in HE_ORDER else 99, x["k"]))
    per = math.ceil(len(done) / nsp)
    root = os.path.join(here, "..", "www", "sfx")
    idx = {}
    for si in range(nsp):
        part = done[si * per:(si + 1) * per]
        if not part: continue
        gap = np.zeros(int(0.1 * SR)); parts = [np.zeros(int(0.05 * SR))]; t = 0.05
        for x in part:
            y = D.read(os.path.join(wav, x["k"] + ".wav"))
            idx[x["k"]] = [si + 1, round(t, 3), round(len(y) / SR, 3)]
            parts += [y, gap]; t += len(y) / SR + 0.1
        big = np.concatenate(parts)
        tw = os.path.join(tmp, f"sp{si}.wav")
        with wave.open(tw, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(big, -1, 1) * 32767).astype("<i2").tobytes())
        mp = os.path.join(root, f"the-{si + 1}.mp3")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tw, "-ac", "1", "-ar", str(SR), "-c:a", "libmp3lame", "-b:a", "96k", mp], check=True)
        print(f"the-{si + 1}.mp3", len(part), "thẻ", f"{t:.1f}s", os.path.getsize(mp) // 1024, "KB")
    json.dump(idx, open(os.path.join(root, "the.json"), "w"), separators=(",", ":"))
    L = np.array([r[4]["lufs"] for r in rows]); H = np.array([r[4]["h26"] for r in rows]); Dd = np.array([r[4]["dur"] for r in rows])
    print(len(idx), "thẻ; LUFS", f"{L.min():.1f}…{L.max():.1f}", "; %2–6kHz", f"{H.min():.1f}…{H.max():.1f} (tb {H.mean():.1f}); dài {Dd.min():.2f}…{Dd.max():.2f}s; <0.6s: {(Dd < 0.6).sum()}; h26>30: {(H > 30).sum()}; lufs<-19.5: {(L < -19.5).sum()}")


if __name__ == "__main__":
    main()
