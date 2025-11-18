-- Tạo bảng media_folders để lưu trữ thư mục ảnh
CREATE TABLE IF NOT EXISTS media_folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parent_id (parent_id),
  FOREIGN KEY (parent_id) REFERENCES media_folders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm cột folder_id vào bảng media (chạy từng câu lệnh, bỏ qua lỗi nếu cột đã tồn tại)
-- ALTER TABLE media ADD COLUMN folder_id INT NULL;
-- ALTER TABLE media ADD INDEX idx_folder_id (folder_id);
-- ALTER TABLE media ADD FOREIGN KEY (folder_id) REFERENCES media_folders(id) ON DELETE SET NULL;

-- Hoặc sử dụng procedure để kiểm tra trước khi thêm
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS add_folder_id_to_media()
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'media'
    AND COLUMN_NAME = 'folder_id';
    
    IF column_exists = 0 THEN
        ALTER TABLE media ADD COLUMN folder_id INT NULL;
        ALTER TABLE media ADD INDEX idx_folder_id (folder_id);
        ALTER TABLE media ADD FOREIGN KEY (folder_id) REFERENCES media_folders(id) ON DELETE SET NULL;
    END IF;
END$$

DELIMITER ;

CALL add_folder_id_to_media();
DROP PROCEDURE IF EXISTS add_folder_id_to_media;

