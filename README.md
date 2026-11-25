# Linh Thú Tam Địa

> **Phiên làm việc mới:** đọc [`TIEN_TRINH.md`](TIEN_TRINH.md) trước.

Game thẻ bài chiến thuật phong cách thần thoại Việt Nam. Bản web nằm ở `www/`, đóng gói thành ứng dụng Android bằng Capacitor.

## Cài bản thử trên Android

Đây là bản thử (APK debug, ký bằng khoá debug), chưa phải bản phát hành.

1. Mở trang Releases của kho: https://github.com/Ngocngon/linhthutamdia/releases/tag/ban-thu-moi-nhat (cần đăng nhập, vì kho riêng tư).
2. Tải tệp `LinhThuTamDia-debug.apk` về điện thoại.
3. Mở tệp vừa tải. Nếu máy hỏi, cho phép "Cài ứng dụng từ nguồn không xác định" cho trình duyệt hoặc ứng dụng Tệp bạn đang dùng.
4. Cài và mở "Linh Thú Tam Địa". Ứng dụng chạy dọc, toàn màn hình; bấm Back hai lần để thoát.

Mỗi lần đẩy thay đổi vào `www/` (hoặc cấu hình dựng), GitHub Actions tự dựng lại APK và thay bản trong Releases. Tiến độ chơi lưu cục bộ trong máy (localStorage), gỡ ứng dụng là mất.

## Cấu trúc

- `www/`: bản web (dist)
- `capacitor.config.json`, `package.json`: cấu hình Capacitor
- `assets/`: biểu tượng gốc (icon-only, icon-foreground, icon-background); CI sinh các cỡ mipmap
- `tools/android/`: MainActivity (immersive, giữ sáng, Back 2 lần) và script vá manifest
- `.github/workflows/android.yml`: dựng APK, đăng Releases
- `tools/dong_bo_www.md`: cách cập nhật www/
- Thư mục `android/` không commit, được sinh trong CI bằng `npx cap add android`.
