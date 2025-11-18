-- Tạo bảng admin_sessions để lưu sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm cột username nếu bảng đã tồn tại nhưng chưa có cột này
-- Chạy file add_username_to_sessions.sql nếu bảng đã tồn tại

-- Clean expired sessions periodically (run this manually or via cron)
-- DELETE FROM admin_sessions WHERE expires_at < NOW();

