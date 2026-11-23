# Cách làm việc với www/

Từ bản gpu22, **kho GitHub này là bản gốc duy nhất** của game. Sửa thẳng trong `www/`, không chép đè từ thư mục `dist/` trên máy Mac nữa (chép đè sẽ xoá mất mọi thay đổi từ gpu20 trở đi).

## Quy trình

1. Sửa mã trong `www/` (HTML/CSS/JS thuần, không có bước dựng).
2. Khi phát hành bản mới, đổi nhãn phiên bản `?v=gpuNN` trong `www/index.html` (mọi dòng css/js và dòng đăng ký `sw.js`). Service worker dùng nhãn này để tách bộ nhớ đệm, nên không đổi nhãn thì máy người chơi có thể trộn tệp cũ với tệp mới.
3. Chạy kiểm thử:
   ```
   node tests/engine-sim.mjs                                  # luật, ~2 phút
   cd tests && npm i && CHROME_PATH=/usr/bin/google-chrome node ui-smoke.mjs   # giao diện
   ```
   GitHub Actions ("Kiểm thử") cũng tự chạy hai bài này ở mọi nhánh.
4. Bản thử: đưa lên nhánh `gh-pages` trong thư mục con `/gpuNN/` (index.html có `<base href="../">`, css/js chép vào thư mục con; ảnh, font, âm thanh dùng chung ở gốc). Trang chính chỉ cập nhật khi chủ game đồng ý.
5. Phát hành: gộp vào `main` → workflow "Dựng APK Android" tự dựng APK và đăng ở Releases (bản "ban-thu-moi-nhat").

## Tài nguyên

- Ảnh thẻ: `www/img/ct/<id>.webp` (256 px) và `www/img/c/<id>.webp` (512 px). Tách lại từ sprite gốc bằng `python3 tools/tach_anh_the.py --force` (sprite gốc ở `tools/nguon_sprite/s`, không đóng gói vào APK).
- Âm thanh: `www/sfx/sfx.mp3` + `sfx.json` (ElevenLabs, 69 âm) và `sfx2.mp3` + `sfx2.json` (34 âm dựng offline từ chính các mẫu đó bằng `tools/dung_sfx2.mjs`: lớp lật thẻ theo Bậc, họ kỹ năng). Phân họ kỹ năng: `www/js/04a-sfx-fam.js`. Trang nghe thử: `www/sfx/nghe-thu.html`.
- Nền thẻ: `www/js/11-nen-the.js`, `www/css/07-nen-the.css` (CSS sinh từ `tools/dung_css_nen_the.py`).
- Bảng test VFX chỉ tải khi mở: `www/js/dev-vfx-lab.js`, `www/css/dev-vfx-lab.css`.
- Máy chủ online: thư mục `server/` (xem `server/README.md`).

Ghi chú: CI Android tự chạy `tools/android/patch_www.py` (thêm app-shim.js, chuẩn hoá meta viewport).
