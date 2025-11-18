-- Thêm cột attributes vào bảng products (an toàn)
-- Chạy câu lệnh này nếu cột chưa tồn tại

SET @db_name = DATABASE();
SET @table_name = 'products';
SET @column_name = 'attributes';

SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = @table_name 
    AND COLUMN_NAME = @column_name
);

SET @sql = IF(@column_exists = 0,
  CONCAT('ALTER TABLE ', @table_name, ' ADD COLUMN ', @column_name, ' JSON NULL'),
  'SELECT "Column already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

