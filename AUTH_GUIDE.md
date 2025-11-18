# Authentication Guide - Admin Panel

## Tổng quan

Hệ thống authentication đã được thêm vào admin panel với các tính năng:
- Login/Logout
- Session management
- Protected routes
- Middleware protection

## Cài đặt

### 1. Tạo bảng admin_users

Chạy file SQL để tạo bảng và user mặc định:

```bash
mysql -u root -p k1 < database/admin_users.sql
```

Hoặc chạy trực tiếp trong MySQL:

```sql
source database/admin_users.sql
```

### 2. Tài khoản mặc định

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Lưu ý**: Đổi mật khẩu ngay sau khi cài đặt!

## Cách sử dụng

### Đăng nhập

1. Truy cập: `http://localhost:3000/admin/login`
2. Nhập username và password
3. Click "Đăng nhập"
4. Tự động redirect đến `/admin`

### Đăng xuất

- Click nút "Đăng xuất" ở góc trên bên phải dashboard
- Hoặc xóa token trong localStorage

## Bảo vệ Routes

### Middleware

File `middleware.ts` tự động:
- Redirect đến `/admin/login` nếu chưa đăng nhập
- Redirect đến `/admin` nếu đã đăng nhập nhưng truy cập `/admin/login`

### API Protection

Tất cả API routes trong `/api/admin/*` đều được bảo vệ:
- Kiểm tra authentication trước khi xử lý request
- Trả về 401 Unauthorized nếu không có token hợp lệ

## Cách hoạt động

### 1. Login Flow

```
User → /admin/login
  ↓
Submit form → POST /api/admin/auth/login
  ↓
Verify credentials → Check database
  ↓
Generate token → Store in session
  ↓
Return token → Save to localStorage
  ↓
Redirect → /admin
```

### 2. Session Management

- Token được lưu trong memory (Map)
- Expires sau 24 giờ
- Có thể lấy từ:
  - Cookie: `admin_token`
  - Authorization header: `Bearer <token>`
  - localStorage (client-side)

### 3. Protected Routes

```
Request → Middleware
  ↓
Check token → Get from cookie/header
  ↓
Validate session → Check expires
  ↓
Allow/Deny → Continue or 401
```

## Tạo user mới

### Cách 1: SQL

```sql
INSERT INTO admin_users (username, password_hash, role, status) 
VALUES ('newuser', 'hash_here', 'admin', 'active');
```

### Cách 2: Node.js script

Tạo file `scripts/create-admin.js`:

```javascript
const crypto = require('crypto');
const password = 'your_password';
const salt = process.env.PASSWORD_SALT || 'default-salt';
const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
console.log('Password hash:', hash);
```

Chạy: `node scripts/create-admin.js`

## Đổi mật khẩu

### Cách 1: SQL

```sql
UPDATE admin_users 
SET password_hash = 'new_hash_here' 
WHERE username = 'admin';
```

### Cách 2: Tạo API endpoint

Có thể thêm endpoint `/api/admin/auth/change-password` để đổi mật khẩu.

## Security Notes

### Hiện tại:
- ✅ Password hashing (SHA256)
- ✅ Session expiration (24h)
- ✅ Protected routes
- ✅ Middleware protection

### Cần cải thiện:
- [ ] Use bcrypt thay vì SHA256
- [ ] Store sessions in database/Redis
- [ ] Add refresh tokens
- [ ] Add rate limiting
- [ ] Add 2FA
- [ ] Add password strength requirements
- [ ] Add login attempt limiting

## Environment Variables

Thêm vào `.env.local`:

```env
PASSWORD_SALT=your-secret-salt-here
```

## Troubleshooting

### Không đăng nhập được
1. Kiểm tra bảng `admin_users` đã được tạo chưa
2. Kiểm tra user mặc định đã được insert chưa
3. Kiểm tra password hash có đúng không

### Token không hợp lệ
1. Kiểm tra token trong localStorage
2. Kiểm tra session có expired không
3. Thử đăng nhập lại

### 401 Unauthorized
1. Kiểm tra token có được gửi trong request không
2. Kiểm tra middleware có chạy không
3. Kiểm tra session có tồn tại không

