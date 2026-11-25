#!/usr/bin/env bash
# ĐÃ NGỪNG (2026-11-26). Trang game không còn chạy trên GitHub Pages.
# Phát hành bây giờ: commit vào gpu24 rồi `git push origin gpu24 && git push origin gpu24:main`.
# Workflow .github/workflows/deploy-trang.yml tự đưa www/ lên https://tamdia.pages.dev (Cloudflare Pages).
# Nhánh gh-pages chỉ còn trang chuyển tiếp tools/ghpages_chuyen/ (đưa người chơi cũ + tiến trình sang địa chỉ mới).
echo "Đã ngừng: phát hành bằng cách push gpu24 lên main (xem TIEN_TRINH.md)." >&2
exit 1
