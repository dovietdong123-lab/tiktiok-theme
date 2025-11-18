# 🔧 Sửa lỗi đăng nhập - Hướng dẫn chi tiết

## Bước 1: Kiểm tra user trong database

Truy cập: `http://localhost:3000/api/admin/auth/check-user`

Endpoint này sẽ hiển thị:
- User có tồn tại không
- Hash trong database
- Hash expected
- Hash có khớp không

## Bước 2: Fix admin user

### Cách 1: Chạy script fix (Khuyên dùng)

```bash
npm run fix-admin
```

Script này sẽ:
- Xóa user admin cũ (nếu có)
- Tạo lại user admin với hash đúng
- Verify hash match

### Cách 2: Fix thủ công trong MySQL

```sql
-- Mở MySQL
mysql -u root -p k1

-- Xóa user cũ
DELETE FROM admin_users WHERE username = 'admin';

-- Tạo lại với hash đúng
INSERT INTO admin_users (username, password_hash, role, status) 
VALUES ('admin', '466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be', 'admin', 'active');

-- Verify
SELECT id, username, password_hash, status FROM admin_users WHERE username = 'admin';
```

## Bước 3: Kiểm tra lại

1. **Check user:**
   ```
   http://localhost:3000/api/admin/auth/check-user
   ```
   Phải thấy: `hashMatch: true`

2. **Test login:**
   - Truy cập: `http://localhost:3000/admin/login`
   - Username: `admin`
   - Password: `admin123`
   - Mở Console (F12) để xem debug info nếu vẫn lỗi

## Debug thông tin

### Hash đúng:
- Password: `admin123`
- Salt: `default-salt`
- Hash: `466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be`

### Kiểm tra trong database:

```sql
SELECT 
  id, 
  username, 
  password_hash, 
  LENGTH(password_hash) as hash_length,
  role, 
  status 
FROM admin_users 
WHERE username = 'admin';
```

Hash phải là: `466ae5ad5bd70dd0a6623f48754821aba94e6531da53b9eb5b4fb8b7e8df50be`
Length phải là: `64`

## Các lỗi thường gặp

### 1. User không tồn tại
**Triệu chứng:** `hashMatch: false, adminUser: null`

**Fix:**
```bash
npm run fix-admin
```

### 2. Hash không khớp
**Triệu chứng:** `hashMatch: false, adminUser exists`

**Fix:**
```bash
npm run fix-admin
```

### 3. User status không phải 'active'
**Triệu chứng:** Lỗi "Tài khoản đã bị khóa"

**Fix:**
```sql
UPDATE admin_users SET status = 'active' WHERE username = 'admin';
```

### 4. Database không kết nối được
**Triệu chứng:** Lỗi connection

**Fix:**
- Kiểm tra MySQL đang chạy
- Kiểm tra .env.local
- Test: `http://localhost:3000/api/test-db`

## Logs

Sau khi fix, check server logs khi login:
- Sẽ hiển thị: `providedHash`, `storedHash`, `hashMatch`
- Nếu `hashMatch: false` → Hash vẫn chưa đúng

