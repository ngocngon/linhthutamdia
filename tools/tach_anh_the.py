#!/usr/bin/env python3
"""Tách sprite thẻ www/img/s/sNNN.webp (2x2) thành từng thẻ:
   www/img/c/<id>.webp  (đầy đủ, nguyên ô sprite, thường 512px)
   www/img/ct/<id>.webp (thumbnail, 1/2 kích thước, thường 256px)
Giữ đúng khung cắt của game cũ: ô = sheet/2, chỉ số i -> x=(i%2)*t, y=(i>>1)*t.
Nguồn sprite: www/img/s nếu có (vừa chép từ dist), nếu không thì tools/nguon_sprite/s (bản lưu, không đóng gói vào app).
Chạy lại được: python3 tools/tach_anh_the.py [--force] [--don]  (cần Pillow có WebP).
  --force  tách lại cả những thẻ đã có file;  --don  xoá www/img/s sau khi tách (để www không chứa sprite)."""
import re, sys, os
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, "www")
Q, METHOD = 82, 5  # method 6 chậm gấp ~18 lần mà chỉ nhỏ hơn ~1.5%
FORCE = "--force" in sys.argv
SRC = next((d for d in (os.path.join(WWW, "img", "s"), os.path.join(ROOT, "tools", "nguon_sprite", "s")) if os.path.isdir(d)), None)


def mapping():
    src = open(os.path.join(WWW, "js", "03-data-store.js"), encoding="utf-8").read()
    m = re.search(r'IMGS=\{"c":\{(.*?)\},"', src, re.S)
    return re.findall(r'"([^"]+)":"(img/s/[^"?#]+)(?:\?[^"#]*)?#(\d)"', m.group(1))


def job(a):
    cid, sheet, idx = a
    out_f = os.path.join(WWW, "img", "c", cid + ".webp")
    out_t = os.path.join(WWW, "img", "ct", cid + ".webp")
    if not FORCE and os.path.exists(out_f) and os.path.exists(out_t):
        return 0
    im = Image.open(os.path.join(SRC, os.path.basename(sheet))).convert("RGBA")
    t = im.width // 2
    i = int(idx)
    cell = im.crop(((i % 2) * t, (i >> 1) * t, (i % 2) * t + t, (i >> 1) * t + t))
    cell.save(out_f, "WEBP", quality=Q, method=METHOD)
    th = cell.resize((t // 2, t // 2), Image.LANCZOS)
    th.save(out_t, "WEBP", quality=Q, method=METHOD)
    return 1


if __name__ == "__main__":
    os.makedirs(os.path.join(WWW, "img", "c"), exist_ok=True)
    os.makedirs(os.path.join(WWW, "img", "ct"), exist_ok=True)
    jobs = mapping()
    with ProcessPoolExecutor() as ex:
        n = sum(ex.map(job, jobs, chunksize=8))
    print("đã tách", n, "/", len(jobs), "thẻ (nguồn:", SRC + ")")
    if "--don" in sys.argv and os.path.isdir(os.path.join(WWW, "img", "s")):
        import shutil
        shutil.rmtree(os.path.join(WWW, "img", "s"))
        print("đã xoá www/img/s")
