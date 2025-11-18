# 🔧 Sửa lỗi đăng nhập NGAY

## Vấn đề
Hash password trong database không khớp với hash được tính khi login.

## ✅ Giải pháp nhanh

### Cách 1: Chạy script (Khuyên dùng)

```bash
npm run create-admin
```

Script này sẽ tự động:
- Tạo bảng nếu chưa có
- Tạo/reset user admin với password đúng
- Hash: `466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be`

### Cách 2: Update trực tiếp trong MySQL

```sql
-- Mở MySQL
mysql -u root -p k1

-- Update password hash
UPDATE admin_users 
SET password_hash = '466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be',
    status = 'active',
    updated_at = NOW()
WHERE username = 'admin';

-- Hoặc tạo mới
INSERT INTO admin_users (username, password_hash, role, status) 
VALUES ('admin', '466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be', 'admin', 'active')
ON DUPLICATE KEY UPDATE 
  password_hash = '466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be',
  status = 'active';
```

### Cách 3: Import lại SQL file (đã được cập nhật)

```powershell
# Trong PowerShell
Get-Content database\admin_users.sql | mysql -u root -p k1
```

## Thông tin đăng nhập

- **Username:** `admin`
- **Password:** `admin123`
- **Hash:** `466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be`
- **Salt:** `default-salt`

## Debug

Sau khi fix, test:

1. **Debug endpoint:**
   ```
   http://localhost:3000/api/admin/auth/debug
   ```
   Sẽ hiển thị hash expected vs hash trong database.

2. **Test login:**
   - Truy cập: `http://localhost:3000/admin/login`
   - Username: `admin`
   - Password: `admin123`

## Kiểm tra

```sql
-- Kiểm tra user
SELECT id, username, password_hash, status 
FROM admin_users 
WHERE username = 'admin';

-- Hash phải là: 466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be
```

