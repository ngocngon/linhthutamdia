-- Đăng ký mở + đăng nhập Google.
-- google_sub: mã người dùng Google (claim "sub"), duy nhất nếu có; email: email Google đã xác minh (chỉ để hiển thị).
-- Tài khoản chỉ dùng Google có pass_hash = '' (không đăng nhập được bằng mật khẩu cho tới khi tự đặt mật khẩu).
ALTER TABLE users ADD COLUMN google_sub TEXT;
ALTER TABLE users ADD COLUMN email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL;
