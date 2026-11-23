-- Khoá phiên tự sinh khi chưa đặt SESSION_SECRET (chủ game không phải tạo tay)
CREATE TABLE IF NOT EXISTS config (k TEXT PRIMARY KEY, v TEXT NOT NULL);
