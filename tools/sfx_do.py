#!/usr/bin/env python3
"""Đo đạc & hậu kỳ SFX (không cần nghe): độ to (LUFS gần đúng theo BS.1770, K-weighting), đỉnh, trọng tâm phổ, tỉ lệ năng lượng dải 2–6 kHz.

  python3 tools/sfx_do.py cut   <sprite.mp3> <sprite.json> <thư_mục_ra>     # cắt sprite thành từng tệp wav mono 44,1 kHz
  python3 tools/sfx_do.py meter <thư_mục_wav> [tên ...]                     # in bảng số liệu (TSV)
  python3 tools/sfx_do.py build <thư_mục_mp3_thô> <thư_mục_ra>               # chọn bản thử, hậu kỳ, ghép sprite sfx3.mp3 + sfx3.json
  python3 tools/sfx_do.py page                                              # sinh lại www/sfx/nghe-thu.html
Hậu kỳ: cắt lặng đầu/cuối, lọc cao 45 Hz, hạ dải 2–6 kHz (mức hạ theo độ gắt đo được), lọc thấp nếu nhiều >6 kHz,
chuẩn hoá độ to theo lớp (LOP), trần đỉnh -3 dBFS, fade vào 4 ms / ra tới 120 ms, mono 44,1 kHz; sprite mp3 96 kb/s.
"""
import sys, os, json, subprocess
import numpy as np
from scipy.signal import lfilter

SR = 44100


def kweight(sr=SR):
    # hệ số theo pyloudnorm (BS.1770-4): high-shelf + high-pass
    import math
    G, Q, fc = 3.99984385397, 0.7071752369554193, 1681.9744509555319
    A = 10 ** (G / 40.0); w0 = 2 * math.pi * fc / sr; al = math.sin(w0) / (2 * Q)
    b1 = [A * ((A + 1) + (A - 1) * math.cos(w0) + 2 * math.sqrt(A) * al), -2 * A * ((A - 1) + (A + 1) * math.cos(w0)), A * ((A + 1) + (A - 1) * math.cos(w0) - 2 * math.sqrt(A) * al)]
    a1 = [(A + 1) - (A - 1) * math.cos(w0) + 2 * math.sqrt(A) * al, 2 * ((A - 1) - (A + 1) * math.cos(w0)), (A + 1) - (A - 1) * math.cos(w0) - 2 * math.sqrt(A) * al]
    Q2, fc2 = 0.5003270373253953, 38.13547087613982
    w0 = 2 * math.pi * fc2 / sr; al = math.sin(w0) / (2 * Q2)
    b2 = [(1 + math.cos(w0)) / 2, -(1 + math.cos(w0)), (1 + math.cos(w0)) / 2]
    a2 = [1 + al, -2 * math.cos(w0), 1 - al]
    return (np.array(b1) / a1[0], np.array(a1) / a1[0]), (np.array(b2) / a2[0], np.array(a2) / a2[0])


KW = kweight()


def read(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def stats(x):
    if len(x) < 64:
        return None
    y = lfilter(*KW[0], x); y = lfilter(*KW[1], y)
    pk = 20 * np.log10(np.max(np.abs(x)) + 1e-12)
    # độ to "khi đang kêu": trung bình bình phương trên các khối 100 ms không lặng (cổng -70 LUFS & -20 dB so với khối to nhất)
    B = int(0.1 * SR); n = max(1, len(y) // B)
    ms = np.array([np.mean(y[i * B:(i + 1) * B] ** 2) for i in range(n)]) + 1e-15
    l = -0.691 + 10 * np.log10(ms)
    keep = (l > -70) & (l > l.max() - 20)
    lufs = -0.691 + 10 * np.log10(np.mean(ms[keep])) if keep.any() else -99
    # momentary max (cửa sổ 400 ms, bước 100 ms)
    W = int(0.4 * SR); yy = np.concatenate([y, np.zeros(W)])
    mm = max(-0.691 + 10 * np.log10(np.mean(yy[i:i + W] ** 2) + 1e-15) for i in range(0, max(1, len(y)), B))
    sp = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / SR)
    # phổ theo trọng số A (gần với tai nghe): bass sâu được tính nhẹ đi như tai người
    f2 = f ** 2; ra = (12194 ** 2 * f2 ** 2) / ((f2 + 20.6 ** 2) * np.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2) + 1e-30)
    sp = sp * (ra / 0.7943) ** 2
    cen = float(np.sum(f * sp) / (np.sum(sp) + 1e-15))
    tot = np.sum(sp) + 1e-15
    band = lambda a, b: float(np.sum(sp[(f >= a) & (f < b)]) / tot) * 100
    return dict(dur=len(x) / SR, peak=pk, lufs=lufs, mmax=mm, cen=cen, h26=band(2000, 6000), lo=band(0, 150), mid=band(300, 2000), hi=band(6000, SR))


def cmd_cut(mp3, js, out):
    os.makedirs(out, exist_ok=True)
    idx = json.load(open(js)); x = read(mp3)
    import wave
    for k, (a, d) in idx.items():
        seg = x[int(a * SR):int(a * SR) + int(d * SR)]
        with wave.open(os.path.join(out, k + ".wav"), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(seg, -1, 1) * 32767).astype("<i2").tobytes())


def cmd_meter(d, names):
    names = names or sorted(n[:-4] for n in os.listdir(d) if n.endswith(".wav"))
    print("tên\tgiây\tđỉnh dBFS\tLUFS\tLUFS-M max\ttrọng tâm Hz\t%<150Hz\t%300–2k\t%2–6kHz\t%>6kHz")
    for n in names:
        s = stats(read(os.path.join(d, n + ".wav")))
        if s: print(f"{n}\t{s['dur']:.2f}\t{s['peak']:.1f}\t{s['lufs']:.1f}\t{s['mmax']:.1f}\t{s['cen']:.0f}\t{s['lo']:.0f}\t{s['mid']:.0f}\t{s['h26']:.1f}\t{s['hi']:.1f}")


if __name__ == "__main__":
    c = sys.argv[1]
    if c == "cut": cmd_cut(*sys.argv[2:5])
    elif c == "meter": cmd_meter(sys.argv[2], sys.argv[3:])


# độ to mục tiêu ("LUFS khi đang kêu" của meter) theo lớp trong tools/sfx_ds.json
LOP = {"ui": -21.0, "nho": -19.0, "vua": -18.0, "lon": -16.5, "dinh": -16.0}
PEAK = -3.0
# tên phụ: bản thử tốt thứ hai dùng làm biến thể xoay vòng
ALT = {"ra_s5": "ra_s5b", "ra_s4": "ra_s4b", "ra_mini": "ra_minib"}


def score(s):
    # ưu tiên thân âm ở dải trung (nghe được trên loa điện thoại), phạt dải gắt 2–6 kHz, dải rít >6 kHz và âm chỉ toàn sub-bass
    return s["mid"] - 1.5 * max(0, s["h26"] - 20) - 2 * max(0, s["hi"] - 10) - 0.5 * max(0, s["lo"] - 30) - (20 if s["lufs"] < -45 else 0)


def ff(inp, out, af):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", inp, "-af", af, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_f32le", out], check=True)


def process(src, dst, cls, dmax, tmp):
    x = read(src)
    # cắt lặng đầu/cuối (ngưỡng -50 dBFS, giữ 10 ms trước điểm bắt đầu)
    env = np.abs(x); thr = 10 ** (-50 / 20)
    idx = np.where(env > thr)[0]
    if len(idx) == 0: raise RuntimeError("lặng: " + src)
    a = max(0, idx[0] - int(0.01 * SR)); b = min(len(x), idx[-1] + int(0.02 * SR))
    x = x[a:b][: int(dmax * SR)]
    s0 = stats(x)
    eq = ["highpass=f=45"]
    if s0["h26"] > 20: eq.append(f"equalizer=f=3600:t=o:w=1.4:g={-3 if s0['h26'] < 40 else -5 if s0['h26'] < 60 else -7}")
    if s0["hi"] > 15: eq.append("lowpass=f=11000" if s0["hi"] < 35 else "lowpass=f=8500")
    if s0["hi"] > 35: eq.append("highshelf=f=6000:g=-4")
    import wave
    t1 = os.path.join(tmp, "a.wav")
    with wave.open(t1, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    t2 = os.path.join(tmp, "b.wav"); ff(t1, t2, ",".join(eq))
    y = read(t2); s1 = stats(y)
    g = LOP[cls] - s1["lufs"]
    y = y * 10 ** (g / 20)
    # trần đỉnh: nén mềm phần vượt (tanh) rồi đặt đỉnh <= PEAK
    lim = 10 ** (PEAK / 20); pk = np.max(np.abs(y))
    if pk > lim:
        k = lim * 1.12
        y = np.where(np.abs(y) > lim * 0.7, np.sign(y) * (lim * 0.7 + (k - lim * 0.7) * np.tanh((np.abs(y) - lim * 0.7) / (k - lim * 0.7))), y)
        y = y * min(1, lim / np.max(np.abs(y)))
    n = len(y); fi = int(0.004 * SR); fo = int(min(0.12, 0.25 * n / SR) * SR)
    y[:fi] *= np.linspace(0, 1, fi); y[n - fo:] *= np.linspace(1, 0, fo) ** 1.5
    with wave.open(dst, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())


def cmd_build(raw, out, pick=None):
    import tempfile, shutil
    here = os.path.dirname(os.path.abspath(__file__))
    ds = json.load(open(os.path.join(here, "sfx_ds.json")))["list"]
    pick = pick or {}
    os.makedirs(os.path.join(out, "wav"), exist_ok=True); tmp = tempfile.mkdtemp()
    chosen = []  # (tên, tệp thô, lớp, giây)
    for x in ds:
        cand = []
        for i in range(x.get("n", 1)):
            f = os.path.join(raw, f"{x['k']}_{i}.mp3")
            if os.path.exists(f): cand.append((score(stats(read(f))), i, f))
        if not cand: print("THIẾU", x["k"]); continue
        cand.sort(reverse=True)
        if x["k"] in pick: cand.sort(key=lambda c: c[1] != pick[x["k"]])
        chosen.append((x["k"], cand[0][2], x["c"], x["d"]))
        if x["k"] in ALT and len(cand) > 1 and cand[1][0] > cand[0][0] - 25:
            chosen.append((ALT[x["k"]], cand[1][2], x["c"], x["d"]))
        print(x["k"], "chọn", os.path.basename(cand[0][2]), " điểm:", " ".join(f"{c[1]}={c[0]:.0f}" for c in sorted(cand, key=lambda c: c[1])))
    for k, f, c, d in chosen: process(f, os.path.join(out, "wav", k + ".wav"), c, d + 0.05, tmp)
    # tên phụ dựng từ mẫu sẵn có: flip = rv_a; rv_soft = rv_c ngắn, nhỏ, cao hơn một chút
    shutil.copy(os.path.join(out, "wav", "rv_a.wav"), os.path.join(out, "wav", "flip.wav"))
    ff(os.path.join(out, "wav", "rv_c.wav"), os.path.join(tmp, "s.wav"), "asetrate=44100*1.08,aresample=44100,atrim=0:0.26,afade=t=out:st=0.16:d=0.1,volume=-3dB")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(tmp, "s.wav"), "-c:a", "pcm_s16le", os.path.join(out, "wav", "rv_soft.wav")], check=True)
    names = [c[0] for c in chosen] + ["flip", "rv_soft"]
    # ghép sprite: 50 ms lặng đầu, mỗi mẫu cách 100 ms
    gap = np.zeros(int(0.1 * SR)); parts = [np.zeros(int(0.05 * SR))]; t = 0.05; idx = {}
    for n in names:
        y = read(os.path.join(out, "wav", n + ".wav")); idx[n] = [round(t, 3), round(len(y) / SR, 3)]
        parts += [y, gap]; t += len(y) / SR + 0.1
    big = np.concatenate(parts)
    import wave
    tw = os.path.join(tmp, "sprite.wav")
    with wave.open(tw, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(big, -1, 1) * 32767).astype("<i2").tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tw, "-ac", "1", "-ar", str(SR), "-c:a", "libmp3lame", "-b:a", "96k", os.path.join(out, "sfx3.mp3")], check=True)
    json.dump(idx, open(os.path.join(out, "sfx3.json"), "w"), separators=(",", ":"))
    print("sprite", f"{t:.1f}s", len(names), "mẫu")


if __name__ == "__main__" and sys.argv[1] == "build":
    pk = {}
    for a in sys.argv[4:]:
        k, v = a.split("="); pk[k] = int(v)
    cmd_build(sys.argv[2], sys.argv[3], pk)


def cmd_page(out_html, sprite_json):
    """Viết trang nghe thử www/sfx/nghe-thu.html từ tools/sfx_ds.json + sfx3.json."""
    import html
    here = os.path.dirname(os.path.abspath(__file__))
    ds = {x["k"]: x for x in json.load(open(os.path.join(here, "sfx_ds.json")))["list"]}
    idx = json.load(open(sprite_json))
    base = {v: k for k, v in ALT.items()}
    rows = []
    for n, (a, d) in idx.items():
        x = ds.get(n) or ds.get(base.get(n, "")) or {}
        use = x.get("dung", {"flip": "Lật thẻ (tên cũ, = rv_a)", "rv_soft": "Lá lật thứ 2 trở đi trong 1,8 s (dựng từ rv_c)"}.get(n, ""))
        if n in base: use += " (biến thể 2, xoay vòng)"
        rows.append(f'<tr><td><button class="pl" data-n="{n}">&#9654;</button></td><td><code>{n}</code></td><td>{html.escape(use)}</td><td>{d:.2f}s</td><td class="pr">{html.escape(x.get("t", ""))}</td></tr>')
    page = f'''<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nghe thử âm thanh - Linh Thú Tam Địa</title>
<base href="../">
<style>
body{{background:#10131a;color:#e6e9f0;font:15px/1.5 system-ui,sans-serif;margin:0;padding:16px}}
h1{{font-size:20px;margin:0 0 4px}}h2{{font-size:17px;margin:22px 0 6px;color:#ffd37a}}p.s{{color:#8c95a8;margin:0 0 14px}}
table{{border-collapse:collapse;width:100%;max-width:1100px}}th,td{{border-bottom:1px solid #232938;padding:7px 8px;text-align:left;vertical-align:top}}
th{{color:#8c95a8;font-weight:600}}code{{color:#ffd37a}}.pr{{color:#8c95a8;font-size:12px}}
button{{background:#2b6cff;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:14px;margin:2px}}
select{{background:#171c27;color:#e6e9f0;border:1px solid #232938;border-radius:6px;padding:5px}}#st{{color:#8c95a8;margin-left:10px}}
</style></head><body>
<h1>Nghe thử âm thanh ({len(idx)} âm, sprite <code>sfx/sfx3.mp3</code>)</h1>
<p class="s">Toàn bộ tạo lại bằng ElevenLabs Sound Effects (gpu43), hậu kỳ bằng <code>tools/sfx_do.py</code>: cắt lặng, hạ dải 2–6 kHz, chuẩn hoá độ to theo lớp, đỉnh ≤ −3 dBFS. Trang được sinh tự động: <code>python3 tools/sfx_do.py page</code>.</p>
<h2>1. Màn ra mắt &mdash; mỗi lần ra mắt đúng MỘT tiếng</h2>
<p class="s">Bậc 5 <code>ra_s5/ra_s5b</code>, Bậc 4 <code>ra_s4</code>, bản gọn Bậc 1–3 <code>ra_mini/ra_minib</code> (nhỏ). Lật thẻ chỉ còn thân lật, không còn lớp Bậc 4/5.
Bấm nhanh nhiều lần để thử chống trùng (tiếng trước tắt dần, không dồn chồng).</p>
<div><button data-l="5">Ra mắt Bậc 5</button><button data-l="4">Ra mắt Bậc 4</button><button data-l="3">Ra mắt gọn</button>
<button id="l3">3 thẻ S5/S4 liên tiếp (0,9 s)</button> Hệ: <select id="E"></select></div>
<h2>2. Lật thẻ</h2>
<div>Bậc: <select id="rvH"><option>S1</option><option>S3</option><option>S4</option><option>S5</option></select>
<button id="rv1">Lật 1 lá</button><button id="rv4">Lật dồn 5 lá</button></div>
<h2>3. Họ kỹ năng</h2><div id="fam"></div>
<h2>4. Toàn bộ mẫu</h2>
<div><button id="all">Nghe lần lượt</button><span id="st">Đang tải...</span></div>
<table><thead><tr><th></th><th>Tên</th><th>Dùng cho</th><th>Dài</th><th>Mô tả gửi ElevenLabs</th></tr></thead><tbody>
{chr(10).join(rows)}
</tbody></table>
<script>window.store={{vol:100,vib:false,mute:false}};</script>
<script src="js/01-engine.js"></script><script src="js/04a-sfx-fam.js"></script><script src="js/04-audio.js"></script>
<script>
const AC=new (window.AudioContext||window.webkitAudioContext)();let big=null,idx={{}},cur=null;
const ELN={{lua:"Lửa",bang:"Băng",sam:"Sấm sét",doc:"Độc",toi:"Bóng tối",sang:"Ánh sáng",gio:"Gió",dat:"Đất",nuoc:"Nước",mau:"Máu",cokhi:"Cơ khí",hon:"Hồn",moc:"Mộc"}};
const $=i=>document.getElementById(i);
$("E").innerHTML='<option value="">(không hệ)</option>'+Object.keys(ELN).map(k=>`<option value="${{k}}">${{ELN[k]}}</option>`).join("");
Promise.all([fetch("sfx/sfx3.json").then(r=>r.json()),fetch("sfx/sfx3.mp3").then(r=>r.arrayBuffer())]).then(([j,ab])=>new Promise((res,rej)=>{{idx=j;const p=AC.decodeAudioData(ab,res,rej);if(p&&p.catch)p.catch(rej);}})).then(b=>{{big=b;$("st").textContent="Sẵn sàng";SFX.wake();}}).catch(e=>{{$("st").textContent="Lỗi tải: "+e;}});
function play(n){{return new Promise(res=>{{if(!big||!idx[n])return res();AC.resume();if(cur)try{{cur.stop()}}catch(e){{}}const s=AC.createBufferSource();s.buffer=big;s.connect(AC.destination);s.onended=res;s.start(0,idx[n][0],idx[n][1]);cur=s;}});}}
document.querySelectorAll(".pl").forEach(b=>b.onclick=()=>play(b.dataset.n));
let U=1;document.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{{SFX.wake();SFX.launch(+b.dataset.l,{{el:$("E").value||null,uid:U++}});}});
$("l3").onclick=()=>{{SFX.wake();[5,4,5].forEach((t,i)=>setTimeout(()=>SFX.launch(t,{{el:$("E").value||null,uid:U++,nth:i}}),i*900));}};
$("rv1").onclick=()=>{{SFX.wake();SFX.reveal({{h:$("rvH").value,el:$("E").value||null}});}};
$("rv4").onclick=()=>{{SFX.wake();["S1","S3","S1","S1","S3"].forEach((h,i)=>setTimeout(()=>SFX.reveal({{h,el:$("E").value||null}}),i*440));}};
$("fam").innerHTML=Object.keys(SFX_FAMS).filter(k=>k!=="none").map(k=>`<button class="fm" data-k="${{k}}" title="${{SFX_FAMS[k][1]}}">${{SFX_FAMS[k][0]}}</button>`).join("");
document.querySelectorAll(".fm").forEach(b=>b.onclick=()=>{{SFX.wake();SFX.fam(b.dataset.k,{{el:$("E").value||null}});}});
$("all").onclick=async()=>{{for(const b of document.querySelectorAll(".pl")){{b.scrollIntoView({{block:"center"}});await play(b.dataset.n);await new Promise(r=>setTimeout(r,250));}}}};
</script></body></html>
'''
    open(out_html, "w").write(page)


if __name__ == "__main__" and sys.argv[1] == "page":
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "www", "sfx")
    cmd_page(os.path.join(root, "nghe-thu.html"), os.path.join(root, "sfx3.json"))
