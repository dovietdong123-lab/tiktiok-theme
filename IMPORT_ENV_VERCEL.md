# Hướng dẫn Import Environment Variables vào Vercel

## 📁 Các file .env có sẵn:

1. **`.env.example`** - Template mẫu (an toàn để commit)
2. **`.env.development`** - Cho môi trường Development (local)
3. **`.env.preview`** - Cho môi trường Preview (Pull Requests)
4. **`.env.production`** - Cho môi trường Production
5. **`.env.vercel`** - File tổng hợp để import vào Vercel (khuyến nghị)

## 🚀 Cách import vào Vercel:

### Cách 1: Import từ file `.env.vercel` (Khuyến nghị)

#### Bước 1: Điền thông tin vào `.env.vercel`
1. Mở file `.env.vercel`
2. Thay thế tất cả các giá trị placeholder:
   ```env
   DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
   DB_USER=root
   DB_PASSWORD=your-actual-password
   DB_NAME=k1
   DB_PORT=4000
   PASSWORD_SALT=your-generated-salt
   SESSION_SECRET=your-generated-secret
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

#### Bước 2: Generate random secrets
**Windows PowerShell:**
```powershell
# Generate PASSWORD_SALT
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Generate SESSION_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Linux/Mac:**
```bash
# Generate PASSWORD_SALT
openssl rand -hex 32

# Generate SESSION_SECRET
openssl rand -hex 32
```

#### Bước 3: Import vào Vercel Dashboard
1. **Mở file `.env.vercel`** và copy tất cả nội dung

2. **Vào Vercel Dashboard:**
   - Truy cập: https://vercel.com
   - Chọn project của bạn
   - Vào **Settings** > **Environment Variables**

3. **Thêm từng biến:**
   - Với mỗi dòng trong file `.env.vercel` (bỏ qua comment và dòng trống):
     - **Key:** Tên biến (ví dụ: `DB_HOST`)
     - **Value:** Giá trị (ví dụ: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`)
     - **Environment:** ✅ Chọn tất cả 3 môi trường:
       - ✅ Production
       - ✅ Preview
       - ✅ Development

4. **Danh sách biến cần thêm:**
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_PORT`
   - `PASSWORD_SALT`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_APP_URL`

5. **Lưu ý:** Bỏ qua:
   - Dòng comment (bắt đầu bằng `#`)
   - Dòng trống
   - `NODE_ENV` (Vercel tự động set)

#### Bước 4: Redeploy
1. Vào tab **"Deployments"**
2. Click **"..."** (3 chấm) ở deployment mới nhất
3. Chọn **"Redeploy"**

### Cách 2: Import từng file riêng cho từng môi trường

Nếu bạn muốn có cấu hình khác nhau cho từng môi trường:

#### Production:
1. Mở file `.env.production`
2. Điền thông tin Production
3. Import vào Vercel, chỉ chọn **Production**

#### Preview:
1. Mở file `.env.preview`
2. Điền thông tin Preview
3. Import vào Vercel, chỉ chọn **Preview**

#### Development:
1. Mở file `.env.development`
2. Điền thông tin Development (thường là local)
3. Import vào Vercel, chỉ chọn **Development**

## 📋 Checklist trước khi import:

- [ ] Đã tạo database (TiDB Cloud, PlanetScale, etc.)
- [ ] Đã lấy connection string từ database
- [ ] Đã generate `PASSWORD_SALT` ngẫu nhiên
- [ ] Đã generate `SESSION_SECRET` ngẫu nhiên
- [ ] Đã có URL của app trên Vercel (hoặc sẽ cập nhật sau)
- [ ] Đã điền đầy đủ thông tin vào file `.env.vercel`

## 🔐 Bảo mật:

- ✅ **KHÔNG** commit file `.env.vercel`, `.env.production`, `.env.preview`, `.env.development` lên Git
- ✅ Chỉ commit file `.env.example`
- ✅ **KHÔNG** chia sẻ giá trị thực tế của Environment Variables
- ✅ Sử dụng **strong password** cho database
- ✅ Generate **random secrets** cho `PASSWORD_SALT` và `SESSION_SECRET`

## 📝 Format giá trị:

### DB_HOST:
- ✅ Đúng: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
- ❌ Sai: `https://gateway01.ap-southeast-1.prod.aws.tidbcloud.com`

### DB_PORT:
- ✅ Đúng: `4000`
- ❌ Sai: `:4000` hoặc `4000/`

### DB_NAME:
- ✅ Đúng: `k1` hoặc `tiktiok_db`

## ✅ Kiểm tra sau khi import:

1. **Vào Vercel Dashboard** > **Settings** > **Environment Variables**
2. Xác nhận tất cả biến đã được thêm
3. Kiểm tra đã chọn đúng môi trường
4. **Redeploy** project
5. Xem **Build Logs** để kiểm tra có lỗi không

## 🐛 Troubleshooting:

### Lỗi: "Environment variable not found"
- Kiểm tra đã thêm biến vào Vercel chưa
- Kiểm tra đã chọn đúng environment
- Redeploy lại project

### Lỗi: "Database connection failed"
- Kiểm tra `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` đúng chưa
- Kiểm tra database có cho phép connection từ Vercel IP không
- Kiểm tra firewall của database

### Lỗi: "Cannot read property of undefined"
- Kiểm tra tất cả biến đã được thêm chưa
- Kiểm tra tên biến có đúng chữ hoa/thường không (case-sensitive)

## 📚 Tài liệu tham khảo:

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel CLI Environment Variables](https://vercel.com/docs/cli/env)
- File `VERCEL_ENV_SETUP.md` - Hướng dẫn chi tiết
- File `IMPORT_ENV_TO_VERCEL.md` - Hướng dẫn import cơ bản

