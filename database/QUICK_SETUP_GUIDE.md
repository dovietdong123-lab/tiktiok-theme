# Hướng dẫn Setup Database nhanh (Khi không có quyền CREATE DATABASE)

## ⚠️ Lỗi thường gặp:
```
#1044 - Access denied for user 'xxx'@'localhost' to database 'k1'
```

## ✅ Giải pháp từng bước:

### Bước 1: Yêu cầu Admin tạo database

**Liên hệ admin** để tạo database với thông tin sau:
- **Tên database:** `k1`
- **Character set:** `utf8mb4`
- **Collation:** `utf8mb4_unicode_ci`

Hoặc nếu bạn có quyền, chạy SQL:
```sql
CREATE DATABASE k1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2: Mở phpMyAdmin

1. Đăng nhập vào phpMyAdmin
2. Ở **danh sách bên trái**, tìm database `k1`
3. **CLICK vào tên database `k1`** để chọn nó
   - Khi chọn đúng, bạn sẽ thấy database được highlight
   - URL sẽ có dạng: `...phpmyadmin/index.php?route=/database/structure&db=k1`

### Bước 3: Import file SQL

1. Sau khi **đã chọn database `k1`**, vào tab **"Import"** (ở menu trên)
2. Click **"Choose File"**
3. Chọn file: `complete_setup_no_create_db.sql`
4. Click **"Go"** ở cuối trang

### Bước 4: Kiểm tra kết quả

Sau khi import thành công, bạn sẽ thấy:
- Message: "28 truy vấn đã thực thi"
- Hoặc: "Database setup completed successfully!"

## 📋 Checklist:

- [ ] Database `k1` đã được tạo bởi admin
- [ ] Đã mở phpMyAdmin
- [ ] **Đã CLICK chọn database `k1` trong danh sách bên trái** ⭐ QUAN TRỌNG
- [ ] Đã vào tab "Import"
- [ ] Đã chọn file `complete_setup_no_create_db.sql`
- [ ] Đã click "Go"

## 🎯 Hình ảnh minh họa:

```
phpMyAdmin
├── [Danh sách databases bên trái]
│   ├── information_schema
│   ├── mysql
│   ├── performance_schema
│   └── k1  ← CLICK VÀO ĐÂY TRƯỚC!
│
└── [Nội dung bên phải]
    └── Tab: Import ← Vào tab này sau khi đã chọn database
```

## ❌ Các lỗi thường gặp:

### Lỗi 1: "Access denied for user to database 'k1'"
**Nguyên nhân:** Chưa chọn database trong phpMyAdmin
**Giải pháp:** 
- Click vào tên database `k1` trong danh sách bên trái
- Đảm bảo database đã được highlight
- Sau đó mới import

### Lỗi 2: "Unknown database 'k1'"
**Nguyên nhân:** Database chưa được tạo
**Giải pháp:** Yêu cầu admin tạo database `k1`

### Lỗi 3: "Table already exists"
**Nguyên nhân:** Đã import trước đó
**Giải pháp:** 
- Bỏ qua lỗi này (file đã dùng `CREATE TABLE IF NOT EXISTS`)
- Hoặc xóa tables cũ và import lại

## 🔍 Kiểm tra sau khi import:

### 1. Kiểm tra tables:
```sql
SHOW TABLES;
```

Kết quả mong đợi (10 tables):
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
-- Kết quả: 3 categories

-- Kiểm tra products
SELECT * FROM products;
-- Kết quả: 4 products

-- Kiểm tra admin user
SELECT * FROM admin_users;
-- Kết quả: 1 user (admin/admin123)
```

### 3. Test đăng nhập admin:
- URL: `http://your-domain.com/admin/login`
- Username: `admin`
- Password: `admin123`

## 💡 Mẹo:

1. **Luôn chọn database trước khi import** - Đây là bước quan trọng nhất!
2. Nếu không thấy database `k1` trong danh sách, yêu cầu admin tạo
3. Nếu import bị lỗi, xóa các tables đã tạo và import lại
4. Lưu backup database sau khi setup thành công

## 📞 Cần hỗ trợ?

Nếu vẫn gặp vấn đề:
1. Chụp màn hình lỗi
2. Chụp màn hình phpMyAdmin (cả danh sách databases và tab Import)
3. Gửi thông tin:
   - User database
   - Loại hosting (shared hosting, VPS, cloud, etc.)

