# Hướng dẫn Setup Database

## Vấn đề: Lỗi "Access denied for user to database"

Nếu bạn gặp lỗi `#1044 - Access denied for user 'xxx'@'localhost' to database 'k1'`, điều này có nghĩa là user của bạn không có quyền tạo database.

## Giải pháp:

### Cách 1: Yêu cầu Admin tạo database (Khuyến nghị)

1. **Liên hệ admin** để tạo database `k1` với:
   - Character set: `utf8mb4`
   - Collation: `utf8mb4_unicode_ci`

2. **Sau khi database đã được tạo**, sử dụng file:
   - `complete_setup_no_create_db.sql`

3. **Import file vào phpMyAdmin:**
   - Chọn database `k1` trong phpMyAdmin (bên trái)
   - Vào tab **"Import"**
   - Chọn file `complete_setup_no_create_db.sql`
   - Click **"Go"**

### Cách 2: Sử dụng file setup không có CREATE DATABASE

1. **Mở phpMyAdmin**

2. **Chọn database `k1`** trong danh sách bên trái
   - Nếu chưa có database `k1`, yêu cầu admin tạo
   - Hoặc sử dụng database khác (đổi tên trong file SQL)

3. **Import file `complete_setup_no_create_db.sql`:**
   - Vào tab **"Import"**
   - Chọn file `complete_setup_no_create_db.sql`
   - Click **"Go"**

### Cách 3: Import từng file riêng lẻ

Nếu vẫn gặp lỗi, có thể import từng file:

1. **Chọn database `k1`** trong phpMyAdmin

2. **Import theo thứ tự:**
   - `schema.sql` (bỏ qua dòng CREATE DATABASE)
   - `admin_users.sql`
   - `admin_sessions.sql`
   - `media.sql`
   - `media_folders.sql`

## Các file SQL có sẵn:

### 1. `complete_setup.sql`
- **Dùng khi:** Bạn có quyền CREATE DATABASE
- **Chức năng:** Tạo database và tất cả tables, dữ liệu mẫu

### 2. `complete_setup_no_create_db.sql` ⭐ (Dùng khi không có quyền CREATE DATABASE)
- **Dùng khi:** Database đã được tạo sẵn bởi admin
- **Chức năng:** Chỉ tạo tables và dữ liệu mẫu (không tạo database)

### 3. `schema.sql`
- **Dùng khi:** Chỉ cần tạo cấu trúc database cơ bản
- **Chức năng:** Tạo database và các bảng chính

### 4. Các file riêng lẻ:
- `admin_users.sql` - Bảng admin users
- `admin_sessions.sql` - Bảng sessions
- `media.sql` - Bảng media
- `media_folders.sql` - Bảng media folders

## Kiểm tra sau khi import:

### 1. Kiểm tra tables đã được tạo:
```sql
SHOW TABLES;
```

Kết quả mong đợi:
- categories
- products
- product_variants
- product_reviews
- orders
- order_items
- admin_users
- admin_sessions
- media
- media_folders

### 2. Kiểm tra dữ liệu mẫu:
```sql
-- Kiểm tra categories
SELECT * FROM categories;

-- Kiểm tra products
SELECT * FROM products;

-- Kiểm tra admin user
SELECT * FROM admin_users;
```

### 3. Kiểm tra admin user:
- **Username:** `admin`
- **Password:** `admin123`
- Đăng nhập vào `/admin/login` để test

## Troubleshooting:

### Lỗi: "Table already exists"
- **Nguyên nhân:** Tables đã được tạo trước đó
- **Giải pháp:** 
  - Bỏ qua lỗi này (file đã dùng `CREATE TABLE IF NOT EXISTS`)
  - Hoặc xóa tables cũ và import lại

### Lỗi: "Foreign key constraint fails"
- **Nguyên nhân:** Import không đúng thứ tự
- **Giải pháp:** Import lại file `complete_setup_no_create_db.sql` (đã có thứ tự đúng)

### Lỗi: "Access denied"
- **Nguyên nhân:** User không có quyền
- **Giải pháp:** 
  - Yêu cầu admin cấp quyền
  - Hoặc sử dụng file `complete_setup_no_create_db.sql` sau khi database đã được tạo

### Lỗi: "Database does not exist"
- **Nguyên nhân:** Database chưa được tạo
- **Giải pháp:** Yêu cầu admin tạo database `k1` trước

## Tạo database thủ công (nếu có quyền):

```sql
CREATE DATABASE k1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Sau đó import file `complete_setup_no_create_db.sql`.

## Liên hệ hỗ trợ:

Nếu vẫn gặp vấn đề, vui lòng:
1. Chụp màn hình lỗi
2. Gửi thông tin:
   - User database
   - Host database
   - Loại hosting (shared hosting, VPS, cloud, etc.)

