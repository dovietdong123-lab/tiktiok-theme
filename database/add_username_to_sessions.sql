-- Thêm cột username vào bảng admin_sessions nếu chưa có
-- Chạy lệnh này nếu bảng đã tồn tại nhưng chưa có cột username
-- Nếu lỗi "Duplicate column name", nghĩa là cột đã tồn tại, bỏ qua lỗi đó

ALTER TABLE admin_sessions ADD COLUMN username VARCHAR(255) NOT NULL DEFAULT '';

