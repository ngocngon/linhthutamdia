#!/usr/bin/env python3
"""Cắt ảnh lưới nền thẻ (ChatGPT, 4×4 hoặc 2×2, có đường kẻ đen giữa các ô) thành từng nền riêng.

Dùng:
  python3 tools/cat_luoi_nen.py <anh_luoi.png> <so_cot> <so_hang> id1,id2,...   [--xem]

- Tự dò đường kẻ tối giữa các ô (không phụ thuộc kích thước chính xác của ảnh).
- Mỗi ô được cắt bỏ viền kẻ, phóng lên 512×768 (Lanczos + làm nét nhẹ), lưu www/img/nen/<id>.webp.
- --xem: ghi thêm ảnh ghép kiểm tra tools/_xem_luoi_nen.png.
"""
import sys, os
from PIL import Image, ImageFilter, ImageDraw

W_OUT, H_OUT = 512, 768
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "www", "img", "nen")


def lines(profile, n, total):
    """Tìm n-1 đường kẻ tối gần các vị trí chia đều nhất; trả về danh sách (đầu, cuối) của từng ô."""
    cuts = []
    for i in range(1, n):
        guess = total * i / n
        lo, hi = int(guess - total * 0.06), int(guess + total * 0.06)
        best = min(range(lo, hi), key=lambda x: profile[x])
        # mở rộng vùng tối quanh điểm tối nhất
        thr = profile[best] + 18
        a = best
        while a > lo and profile[a - 1] <= thr:
            a -= 1
        b = best
        while b < hi and profile[b + 1] <= thr:
            b += 1
        cuts.append((a, b))
    spans, start = [], 0
    for a, b in cuts:
        spans.append((start, a))
        start = b + 1
    spans.append((start, total))
    return spans


def main():
    src, cols, rows, ids = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4].split(",")
    assert len(ids) == cols * rows, f"cần {cols*rows} id, có {len(ids)}"
    im = Image.open(src).convert("RGB")
    g = im.convert("L")
    W, H = g.size
    px = g.load()
    colp = [sum(px[x, y] for y in range(0, H, 2)) / (H / 2) for x in range(W)]
    rowp = [sum(px[x, y] for x in range(0, W, 2)) / (W / 2) for y in range(H)]
    xs, ys = lines(colp, cols, W), lines(rowp, rows, H)
    os.makedirs(OUT, exist_ok=True)
    tiles = []
    k = 0
    for (y0, y1) in ys:
        for (x0, x1) in xs:
            pad = 3
            cell = im.crop((x0 + pad, y0 + pad, x1 - pad, y1 - pad))
            # giữ đúng tỉ lệ 2:3 bằng cách cắt giữa
            cw, ch = cell.size
            if cw / ch > 2 / 3:
                nw = int(ch * 2 / 3); cell = cell.crop(((cw - nw) // 2, 0, (cw - nw) // 2 + nw, ch))
            else:
                nh = int(cw * 3 / 2); cell = cell.crop((0, (ch - nh) // 2, cw, (ch - nh) // 2 + nh))
            out = cell.resize((W_OUT, H_OUT), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
            out.save(os.path.join(OUT, ids[k] + ".webp"), "WEBP", quality=86, method=5)
            tiles.append((ids[k], out))
            k += 1
    print("o cot:", xs, "\no hang:", ys)
    if "--xem" in sys.argv:
        tw, th = 160, 240
        sheet = Image.new("RGB", (cols * (tw + 6) + 6, rows * (th + 22) + 6), (20, 20, 30))
        d = ImageDraw.Draw(sheet)
        for i, (n, t) in enumerate(tiles):
            x, y = 6 + (i % cols) * (tw + 6), 6 + (i // cols) * (th + 22)
            sheet.paste(t.resize((tw, th)), (x, y))
            d.text((x + 2, y + th + 4), n, fill=(255, 220, 120))
        sheet.save(os.path.join(ROOT, "tools", "_xem_luoi_nen.png"))
    print("xong", len(tiles), "nen ->", OUT)


if __name__ == "__main__":
    main()
