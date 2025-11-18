-- Thêm các cột coupon và discount vào bảng orders
-- Chạy script này trên TiDB Cloud nếu gặp lỗi "Unknown column 'discount_amount'"

USE tiktiok-theme;

-- Kiểm tra và thêm cột discount_amount
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND COLUMN_NAME = 'discount_amount') = 0,
  'ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER total_amount',
  'SELECT "Column discount_amount already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột final_amount
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND COLUMN_NAME = 'final_amount') = 0,
  'ALTER TABLE orders ADD COLUMN final_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER discount_amount',
  'SELECT "Column final_amount already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột coupon_code
SET @sql = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() 
   AND TABLE_NAME = 'orders' 
   AND COLUMN_NAME = 'coupon_code') = 0,
  'ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL AFTER final_amount',
  'SELECT "Column coupon_code already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'All columns added successfully!' as result;

