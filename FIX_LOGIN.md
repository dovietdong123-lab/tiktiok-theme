# Sửa lỗi đăng nhập Admin

## Lỗi: "Tên đăng nhập hoặc mật khẩu không đúng"

### Nguyên nhân có thể:
1. Password hash trong database không đúng
2. User chưa được tạo trong database
3. Salt không khớp giữa login và database

## Giải pháp

### Cách 1: Chạy script tạo/reset admin (Khuyên dùng)

```bash
npm run create-admin
```

Script này sẽ:
- Tự động tạo bảng `admin_users` nếu chưa có
- Tạo hoặc reset user `admin` với password `admin123`
- Hiển thị thông tin user đã tạo

### Cách 2: Reset password trong MySQL

```sql
-- Mở MySQL
mysql -u root -p k1

-- Reset password cho user admin
UPDATE admin_users 
SET password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    status = 'active',
    updated_at = NOW()
WHERE username = 'admin';

-- Hoặc tạo mới nếu chưa có
INSERT INTO admin_users (username, password_hash, role, status) 
VALUES ('admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'admin', 'active')
ON DUPLICATE KEY UPDATE 
  password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  status = 'active';
```

### Cách 3: Tạo password hash mới

Nếu muốn đổi password, chạy:

```javascript
// Tạo file temp: hash-password.js
const crypto = require('crypto');
const password = 'your_new_password';
const salt = 'default-salt'; // Phải giống với PASSWORD_SALT trong .env.local
const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
console.log('Password:', password);
console.log('Hash:', hash);

// Sau đó update vào database:
// UPDATE admin_users SET password_hash = 'hash_here' WHERE username = 'admin';
```

## Kiểm tra

Sau khi fix, test đăng nhập:

1. Truy cập: `http://localhost:3000/admin/login`
2. Username: `admin`
3. Password: `admin123`
4. Nếu vẫn lỗi, kiểm tra:
   - Database có kết nối không: `http://localhost:3000/api/test-db`
   - User có tồn tại không: `SELECT * FROM admin_users WHERE username = 'admin';`
   - Password hash có đúng không

## Debug

### Kiểm tra user trong database:

```sql
SELECT id, username, password_hash, role, status 
FROM admin_users 
WHERE username = 'admin';
```

### Kiểm tra password hash:

Hash đúng cho `admin123` với salt `default-salt`:
```
a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
```

### Test hash generation:

```javascript
const crypto = require('crypto');
const password = 'admin123';
const salt = 'default-salt';
const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
console.log(hash);
// Phải ra: a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
```

## Lưu ý

- Salt mặc định là `'default-salt'`
- Có thể đổi salt trong `.env.local`: `PASSWORD_SALT=your-salt`
- Nếu đổi salt, phải tạo lại password hash với salt mới

