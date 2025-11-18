-- ============================================
-- COMPLETE DATABASE SETUP FOR K1 PROJECT
-- Import file này vào phpMyAdmin để setup toàn bộ database
-- ============================================

-- Tạo database
CREATE DATABASE IF NOT EXISTS k1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE k1;

-- ============================================
-- BẢNG CATEGORIES (Danh mục)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  image VARCHAR(500),
  description TEXT,
  parent_id INT DEFAULT NULL,
  status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_parent (parent_id),
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG PRODUCTS (Sản phẩm)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  regular_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount INT DEFAULT 0,
  image VARCHAR(500),
  gallery JSON,
  description TEXT,
  short_description TEXT,
  category_id INT,
  sold INT DEFAULT 0,
  stock INT DEFAULT 0,
  status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_category (category_id),
  INDEX idx_featured (featured),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm cột attributes vào bảng products (bỏ qua lỗi nếu đã tồn tại)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'products' 
   AND COLUMN_NAME = 'attributes') = 0,
  'ALTER TABLE products ADD COLUMN attributes JSON NULL',
  'SELECT "Column attributes already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- BẢNG PRODUCT_VARIANTS (Biến thể sản phẩm)
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  label VARCHAR(100) NOT NULL,
  value VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  regular_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount INT DEFAULT 0,
  image VARCHAR(500),
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product (product_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG PRODUCT_REVIEWS (Đánh giá sản phẩm)
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_name VARCHAR(100),
  content TEXT NOT NULL,
  rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product (product_id),
  INDEX idx_status (status),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG ORDERS (Đơn hàng)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG ORDER_ITEMS (Chi tiết đơn hàng)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order (order_id),
  INDEX idx_product (product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG ADMIN_USERS (Quản trị viên)
-- ============================================
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

-- ============================================
-- BẢNG ADMIN_SESSIONS (Phiên đăng nhập)
-- ============================================
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

-- Thêm cột username nếu chưa có (bỏ qua lỗi nếu đã tồn tại)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'admin_sessions' 
   AND COLUMN_NAME = 'username') = 0,
  'ALTER TABLE admin_sessions ADD COLUMN username VARCHAR(255) NOT NULL DEFAULT ""',
  'SELECT "Column username already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- BẢNG MEDIA (Thư viện ảnh)
-- ============================================
CREATE TABLE IF NOT EXISTS media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  file_size INT,
  width INT,
  height INT,
  alt_text VARCHAR(255),
  uploaded_by INT,
  folder_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_folder_id (folder_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (uploaded_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG MEDIA_FOLDERS (Thư mục ảnh)
-- ============================================
CREATE TABLE IF NOT EXISTS media_folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parent_id (parent_id),
  FOREIGN KEY (parent_id) REFERENCES media_folders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm foreign key cho folder_id trong media (bỏ qua lỗi nếu đã tồn tại)
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'media' 
   AND COLUMN_NAME = 'folder_id') = 0,
  'ALTER TABLE media ADD COLUMN folder_id INT NULL, ADD INDEX idx_folder_id (folder_id), ADD FOREIGN KEY (folder_id) REFERENCES media_folders(id) ON DELETE SET NULL',
  'SELECT "Column folder_id already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- BẢNG STORE_SETTINGS (Cài đặt cửa hàng)
-- ============================================
CREATE TABLE IF NOT EXISTS store_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(191) NOT NULL UNIQUE,
  setting_value TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DỮ LIỆU MẪU
-- ============================================

-- Thêm danh mục mẫu
INSERT INTO categories (name, slug, image, status) VALUES
('ÁO HOODIE - SWEATER', 'ao-hoodie-sweater', 'https://via.placeholder.com/100', 'active'),
('QUẦN ÁO', 'quan-ao', 'https://via.placeholder.com/100', 'active'),
('GIÀY DÉP', 'giay-dep', 'https://via.placeholder.com/100', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Thêm admin user mặc định
-- Username: admin
-- Password: admin123
INSERT INTO admin_users (username, password_hash, role, status) VALUES
('admin', '466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be', 'admin', 'active')
ON DUPLICATE KEY UPDATE 
  password_hash = '466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be',
  status = 'active',
  updated_at = NOW();

-- Thêm 4 sản phẩm mẫu
INSERT INTO products (name, slug, price, regular_price, discount, image, gallery, description, short_description, category_id, stock, status, featured) VALUES
('Áo Hoodie Nỉ Dày Dặn', 'ao-hoodie-ni-day-dan', 299000, 399000, 25, 'https://via.placeholder.com/500', 
 JSON_ARRAY('https://via.placeholder.com/600', 'https://via.placeholder.com/600', 'https://via.placeholder.com/600'),
 '<p>Áo hoodie nỉ cao cấp với chất liệu dày dặn, ấm áp. Thiết kế hiện đại, phù hợp cho mùa đông.</p><p><strong>Đặc điểm:</strong></p><ul><li>Chất liệu nỉ cao cấp</li><li>Form dáng rộng rãi, thoải mái</li><li>Nhiều màu sắc đa dạng</li><li>Size từ S đến XXL</li></ul>',
 'Áo hoodie nỉ cao cấp, ấm áp cho mùa đông', 1, 50, 'active', TRUE),

('Quần Jogger Thể Thao', 'quan-jogger-the-thao', 249000, 349000, 29, 'https://via.placeholder.com/500',
 JSON_ARRAY('https://via.placeholder.com/600', 'https://via.placeholder.com/600'),
 '<p>Quần jogger thể thao với thiết kế năng động, chất liệu co giãn tốt. Phù hợp cho các hoạt động thể thao và mặc hàng ngày.</p><p><strong>Đặc điểm:</strong></p><ul><li>Chất liệu co giãn 4 chiều</li><li>Thiết kế hiện đại, trẻ trung</li><li>Dễ dàng vận động</li><li>Nhiều size và màu</li></ul>',
 'Quần jogger thể thao năng động, co giãn tốt', 2, 75, 'active', TRUE),

('Giày Sneaker Thời Trang', 'giay-sneaker-thoi-trang', 599000, 799000, 25, 'https://via.placeholder.com/500',
 JSON_ARRAY('https://via.placeholder.com/600', 'https://via.placeholder.com/600', 'https://via.placeholder.com/600', 'https://via.placeholder.com/600'),
 '<p>Giày sneaker thời trang với thiết kế đẹp mắt, đế cao su bền chắc. Phù hợp cho mọi hoạt động hàng ngày.</p><p><strong>Đặc điểm:</strong></p><ul><li>Đế cao su chống trượt</li><li>Lót giày êm ái</li><li>Thiết kế thời trang</li><li>Nhiều size từ 36-44</li></ul>',
 'Giày sneaker thời trang, đế cao su bền chắc', 3, 30, 'active', TRUE),

('Áo Thun Cổ Tròn Basic', 'ao-thun-co-tron-basic', 99000, 149000, 34, 'https://via.placeholder.com/500',
 JSON_ARRAY('https://via.placeholder.com/600', 'https://via.placeholder.com/600'),
 '<p>Áo thun cổ tròn basic với chất liệu cotton mềm mại, thoáng mát. Thiết kế đơn giản, dễ phối đồ.</p><p><strong>Đặc điểm:</strong></p><ul><li>Chất liệu cotton 100%</li><li>Mềm mại, thoáng mát</li><li>Thiết kế basic, dễ phối đồ</li><li>Nhiều màu sắc</li></ul>',
 'Áo thun cổ tròn basic, cotton mềm mại', 2, 100, 'active', FALSE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- HOÀN TẤT
-- ============================================
SELECT 'Database setup completed successfully!' as message;

