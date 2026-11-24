#!/usr/bin/env python3
"""Cắt lưới 2x2 nhân vật (ChatGPT, nền trắng) thành ảnh thẻ tách nền:
   www/img/c/<id>.webp (512, RGBA) + www/img/ct/<id>.webp (256).
   python3 tools/cat_luoi_nhan_vat.py <ảnh> id1,id2,id3,id4 [--xem]   (id '-' = bỏ ô)
Tách nền bằng rembg (isnet-general-use), cắt sát nhân vật, đặt giữa khung vuông (lề 3%)."""
import sys, os
from PIL import Image
from rembg import remove, new_session
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "www")
src, ids = sys.argv[1], sys.argv[2].split(",")
im = Image.open(src).convert("RGB"); W, H = im.size
ses = new_session("isnet-general-use")
outs = []
for i, k in enumerate(ids):
    if k == "-": continue
    cell = im.crop(((i % 2) * W // 2, (i // 2) * H // 2, (i % 2 + 1) * W // 2, (i // 2 + 1) * H // 2))
    cut = remove(cell, session=ses, post_process_mask=True)
    a = cut.getchannel("A").point(lambda v: 0 if v < 24 else v)
    if k.endswith("!"):  # id! = tách bằng loang nền trắng từ mép (giữ được vật mảnh như giáo, dây) hợp với mặt nạ rembg
        k = k[:-1]
        import numpy as np
        from scipy import ndimage
        from PIL import ImageFilter
        rgb = np.asarray(cell).astype(int); white = (rgb.min(2) > 236) & ((rgb.max(2) - rgb.min(2)) < 14)
        lab, n = ndimage.label(white); edge = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1]); edge.discard(0)
        bg = np.isin(lab, list(edge)); fg = ndimage.binary_opening(~bg, iterations=1)
        lab2, n2 = ndimage.label(fg); sz = ndimage.sum(fg, lab2, range(1, n2 + 1)); keep = np.isin(lab2, [i + 1 for i, v in enumerate(sz) if v > 400])
        m = Image.fromarray((keep * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.8))
        from PIL import ImageChops
        a = ImageChops.lighter(a, m); cut = cell.convert("RGBA")
    cut.putalpha(a)
    bb = a.point(lambda v: 255 if v > 40 else 0).getbbox(); cut = cut.crop(bb)
    S = 512; m = int(S * 0.03); sc = min((S - 2 * m) / cut.width, (S - 2 * m) / cut.height)
    cut = cut.resize((max(1, round(cut.width * sc)), max(1, round(cut.height * sc))), Image.LANCZOS)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0)); out.paste(cut, ((S - cut.width) // 2, (S - cut.height) // 2), cut)
    out.save(os.path.join(ROOT, "img/c", k + ".webp"), quality=90, method=5)
    out.resize((256, 256), Image.LANCZOS).save(os.path.join(ROOT, "img/ct", k + ".webp"), quality=86, method=5)
    outs.append((k, out)); print("ok", k, bb)
if "--xem" in sys.argv:
    sh = Image.new("RGB", (512 * len(outs), 512), (36, 38, 60))
    for j, (k, o) in enumerate(outs): sh.paste(o, (j * 512, 0), o)
    sh.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), "_xem_nhan_vat.png"))
