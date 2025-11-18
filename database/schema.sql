-- Database schema cho project k1
-- Chạy file này trong MySQL để tạo database và tables

CREATE DATABASE IF NOT EXISTS k1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE k1;

-- Bảng categories (danh mục)
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

-- Bảng products (sản phẩm)
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

-- Bảng product_variants (biến thể sản phẩm)
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

-- Bảng product_reviews (đánh giá sản phẩm)
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

-- Bảng orders (đơn hàng)
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

-- Bảng order_items (chi tiết đơn hàng)
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

-- Insert sample data
INSERT INTO categories (name, slug, image, status) VALUES
('ÁO HOODIE - SWEATER', 'ao-hoodie-sweater', 'https://via.placeholder.com/100', 'active'),
('QUẦN ÁO', 'quan-ao', 'https://via.placeholder.com/100', 'active'),
('GIÀY DÉP', 'giay-dep', 'https://via.placeholder.com/100', 'active');

INSERT INTO products (name, slug, price, regular_price, discount, image, gallery, description, category_id, sold, status, featured) VALUES
('Sản phẩm 1', 'san-pham-1', 99000, 150000, 34, 'https://via.placeholder.com/300', JSON_ARRAY('https://via.placeholder.com/600', 'https://via.placeholder.com/600'), '<p>Mô tả sản phẩm 1</p>', 1, 500, 'active', TRUE),
('Sản phẩm 2', 'san-pham-2', 149000, 200000, 25, 'https://via.placeholder.com/300', JSON_ARRAY('https://via.placeholder.com/600'), '<p>Mô tả sản phẩm 2</p>', 1, 300, 'active', TRUE),
('Sản phẩm 3', 'san-pham-3', 199000, 250000, 20, 'https://via.placeholder.com/300', JSON_ARRAY('https://via.placeholder.com/600'), '<p>Mô tả sản phẩm 3</p>', 2, 200, 'active', TRUE);

