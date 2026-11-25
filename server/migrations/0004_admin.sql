-- Trang quản trị đầy đủ: hoạt động hằng ngày, khoá có thời hạn, thư/quà, giftcode, thông báo, nhật ký quản trị.
-- Chỉ THÊM bảng/cột/chỉ mục, không sửa hay xoá dữ liệu cũ.

-- Hoạt động theo ngày (giờ Việt Nam UTC+7), ghi từ POST /api/ping
CREATE TABLE IF NOT EXISTS activity (
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  first_ts INTEGER NOT NULL,
  last_ts INTEGER NOT NULL,
  pings INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS activity_day ON activity(day);
CREATE INDEX IF NOT EXISTS activity_last ON activity(last_ts);

-- Thông tin thêm cho người chơi
ALTER TABLE users ADD COLUMN last_version TEXT;
ALTER TABLE users ADD COLUMN platform TEXT;
ALTER TABLE users ADD COLUMN ban_reason TEXT;
ALTER TABLE users ADD COLUMN ban_until INTEGER;
-- lần cuối thấy (ping), để tra cứu nhanh
ALTER TABLE users ADD COLUMN last_seen INTEGER;
-- băm HMAC của IP lúc tạo tài khoản (không lưu IP thô), để phát hiện nhiều tài khoản cùng mạng
ALTER TABLE users ADD COLUMN reg_ip TEXT;
CREATE INDEX IF NOT EXISTS users_reg_ip ON users(reg_ip) WHERE reg_ip IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_created ON users(created_at);
CREATE INDEX IF NOT EXISTS users_last_seen ON users(last_seen);
CREATE INDEX IF NOT EXISTS matches_ended ON matches(ended_at);

-- Thư (user_id NULL = gửi tất cả người chơi có tài khoản tạo TRƯỚC thời điểm gửi)
CREATE TABLE IF NOT EXISTS mail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  rewards TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  created_by TEXT NOT NULL DEFAULT 'admin'
);
CREATE INDEX IF NOT EXISTS mail_user ON mail(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mail_created ON mail(created_at DESC);

CREATE TABLE IF NOT EXISTS mail_claim (
  mail_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  claimed_at INTEGER NOT NULL,
  PRIMARY KEY (mail_id, user_id)
);
CREATE INDEX IF NOT EXISTS mail_claim_user ON mail_claim(user_id);

CREATE TABLE IF NOT EXISTS giftcodes (
  code TEXT PRIMARY KEY,
  rewards TEXT NOT NULL DEFAULT '{}',
  max_uses INTEGER NOT NULL DEFAULT 0,
  uses INTEGER NOT NULL DEFAULT 0,
  starts_at INTEGER,
  expires_at INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS giftcode_redeem (
  code TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  ts INTEGER NOT NULL,
  PRIMARY KEY (code, user_id)
);
CREATE INDEX IF NOT EXISTS giftcode_redeem_user ON giftcode_redeem(user_id);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  starts_at INTEGER,
  ends_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS admin_log_ts ON admin_log(ts DESC);
CREATE INDEX IF NOT EXISTS admin_log_target ON admin_log(target, ts DESC);
