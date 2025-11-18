# Hướng dẫn cấu hình Environment Variables trong Vercel

## Cách 1: Qua Vercel Dashboard (Khuyến nghị)

### Bước 1: Truy cập Project Settings
1. Đăng nhập vào https://vercel.com
2. Chọn **project** của bạn (ví dụ: `tiktiok-theme`)
3. Click vào tab **Settings** (ở thanh menu trên cùng)

### Bước 2: Vào mục Environment Variables
1. Trong menu bên trái, tìm và click **"Environment Variables"**
2. Hoặc scroll xuống phần **"Environment Variables"** trong Settings

### Bước 3: Thêm các biến môi trường
1. Bạn sẽ thấy form với 3 trường:
   - **Key** (Tên biến)
   - **Value** (Giá trị)
   - **Environment** (Môi trường: Production, Preview, Development)

2. Thêm từng biến một:

   **Biến 1:**
   - Key: `DB_HOST`
   - Value: `your-database-host` (ví dụ: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`)
   - Environment: Chọn tất cả (Production, Preview, Development)

   **Biến 2:**
   - Key: `DB_USER`
   - Value: `your-database-user` (ví dụ: `root`)
   - Environment: Chọn tất cả

   **Biến 3:**
   - Key: `DB_PASSWORD`
   - Value: `your-database-password` (password từ TiDB Cloud)
   - Environment: Chọn tất cả

   **Biến 4:**
   - Key: `DB_NAME`
   - Value: `your-database-name` (tên database)
   - Environment: Chọn tất cả

   **Biến 5:**
   - Key: `DB_PORT`
   - Value: `4000` (hoặc port của database)
   - Environment: Chọn tất cả

   **Biến 6:**
   - Key: `SESSION_SECRET`
   - Value: `your-random-secret-key` (tạo một chuỗi ngẫu nhiên)
   - Environment: Chọn tất cả

   **Biến 7:**
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://your-app.vercel.app` (URL của app trên Vercel)
   - Environment: Chọn tất cả

   **Biến 8 (nếu dùng thư viện ảnh trên Vercel):**
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: token RW từ [Vercel Blob](https://vercel.com/dashboard/storage/blob)
   - Environment: Chọn tất cả
   - Ghi chú: Bắt buộc để upload ảnh vì Vercel không cho ghi file hệ thống

3. Sau mỗi lần thêm, click nút **"Save"** hoặc **"Add"**

### Bước 4: Redeploy
1. Sau khi thêm tất cả biến, bạn cần **redeploy** project
2. Vào tab **"Deployments"**
3. Click vào deployment mới nhất
4. Click menu **"..."** (3 chấm) ở góc trên bên phải
5. Chọn **"Redeploy"**
6. Hoặc vào tab **"Settings"** > **"General"** > Click **"Redeploy"**

## Cách 2: Qua Vercel CLI

### Bước 1: Cài đặt Vercel CLI
```bash
npm i -g vercel
```

### Bước 2: Login
```bash
vercel login
```

### Bước 3: Thêm Environment Variables
```bash
cd D:\tiktiok-theme\k1

# Thêm từng biến
vercel env add DB_HOST
# Nhập giá trị khi được hỏi
# Chọn environment: Production, Preview, Development

vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add DB_PORT
vercel env add SESSION_SECRET
vercel env add NEXT_PUBLIC_APP_URL
```

### Bước 4: Deploy lại
```bash
vercel --prod
```

## Cách 3: Import từ file (CLI)

### Tạo file `.env.production`
```env
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_PORT=4000
SESSION_SECRET=your-random-secret-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Import vào Vercel
```bash
vercel env pull .env.production
# Sau đó
vercel env add DB_HOST < .env.production
```

## Lưu ý quan trọng:

### 🔐 Bảo mật:
- **KHÔNG** commit file `.env` lên Git
- **KHÔNG** chia sẻ giá trị của Environment Variables
- Sử dụng **strong password** cho database
- Generate **random SESSION_SECRET** (có thể dùng: `openssl rand -hex 32`)

### 📝 Format giá trị:
- **DB_HOST:** Chỉ hostname, không có `http://` hoặc `https://`
  - ✅ Đúng: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
  - ❌ Sai: `https://gateway01.ap-southeast-1.prod.aws.tidbcloud.com`

- **DB_PORT:** Chỉ số port
  - ✅ Đúng: `4000`
  - ❌ Sai: `:4000` hoặc `4000/`

- **DB_NAME:** Tên database
  - ✅ Đúng: `k1` hoặc `tiktiok_db`

### 🔄 Sau khi thêm Environment Variables:
1. **Phải redeploy** để các biến có hiệu lực
2. Các deployment cũ sẽ **KHÔNG** có các biến mới
3. Chỉ các deployment mới sau khi thêm biến mới có

### ✅ Kiểm tra:
1. Vào **Deployments** > Chọn deployment mới nhất
2. Xem **Build Logs** để kiểm tra có lỗi không
3. Nếu có lỗi database connection, kiểm tra lại các biến đã đúng chưa

## Ví dụ với TiDB Cloud:

### Connection String từ TiDB Cloud:
```
mysql://root:password123@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test
```

### Environment Variables tương ứng:
```
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_USER=root
DB_PASSWORD=password123
DB_NAME=test
DB_PORT=4000
```

## Troubleshooting:

### Lỗi: "Environment variable not found"
- Kiểm tra đã thêm biến chưa
- Kiểm tra đã chọn đúng environment (Production/Preview/Development)
- Redeploy lại project

### Lỗi: "Database connection failed"
- Kiểm tra DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT đã đúng chưa
- Kiểm tra database có cho phép connection từ Vercel IP không
- Kiểm tra firewall của database

### Lỗi: "Cannot read property of undefined"
- Kiểm tra tất cả biến đã được thêm chưa
- Kiểm tra tên biến có đúng chữ hoa/thường không (case-sensitive)

## Tài liệu tham khảo:
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel CLI Environment Variables](https://vercel.com/docs/cli/env)

