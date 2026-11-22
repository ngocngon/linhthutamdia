-- Tài khoản do quản trị tạo (không có đăng ký mở)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  iters INTEGER NOT NULL,
  disabled INTEGER NOT NULL DEFAULT 0,
  token_ver INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_login INTEGER
);

-- Xếp hạng Elo theo chế độ
CREATE TABLE ratings (
  user_id INTEGER NOT NULL REFERENCES users(id),
  mode TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 1000,
  games INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, mode)
);
CREATE INDEX ratings_mode_rating ON ratings(mode, rating DESC);

-- Điểm theo kỳ (ngày d2026-11-23, tháng m2026-11, tuần w123) cho từng chế độ
CREATE TABLE scores (
  user_id INTEGER NOT NULL REFERENCES users(id),
  mode TEXT NOT NULL,
  pkey TEXT NOT NULL,
  pts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, mode, pkey)
);
CREATE INDEX scores_board ON scores(mode, pkey, pts DESC);

-- Lịch sử trận
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  host_uid INTEGER NOT NULL,
  guest_uid INTEGER NOT NULL,
  winner_uid INTEGER,
  outcome TEXT NOT NULL,
  reason TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  host_delta INTEGER NOT NULL DEFAULT 0,
  guest_delta INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL
);
CREATE INDEX matches_host ON matches(host_uid, ended_at DESC);
CREATE INDEX matches_guest ON matches(guest_uid, ended_at DESC);

-- Tiến trình người chơi (đồng bộ nhiều máy)
CREATE TABLE saves (
  user_id INTEGER NOT NULL REFERENCES users(id),
  slot TEXT NOT NULL DEFAULT 'save',
  blob TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, slot)
);

-- Chống dò mật khẩu
CREATE TABLE auth_fail (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  ts INTEGER NOT NULL
);
