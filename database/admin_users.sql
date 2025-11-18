-- Tạo bảng admin_users
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo admin user mặc định
-- Username: admin
-- Password: admin123
-- (Password hash được tạo bằng SHA256 với salt 'default-salt')
-- 
-- Để tạo password hash mới, chạy:
-- node scripts/create-admin.js
-- 
-- Hoặc trong Node.js:
-- const crypto = require('crypto');
-- const hash = crypto.createHash('sha256').update('admin123' + 'default-salt').digest('hex');
-- console.log(hash);

-- Hash cho 'admin123' với salt 'default-salt'
-- Được tính: SHA256('admin123' + 'default-salt')
-- Hash đúng: 466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be
INSERT INTO admin_users (username, password_hash, role, status) VALUES
('admin', '466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be', 'admin', 'active')
ON DUPLICATE KEY UPDATE 
  password_hash = '466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be',
  status = 'active',
  updated_at = NOW();

