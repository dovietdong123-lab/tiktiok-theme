# Các tùy chọn MySQL Free cho Vercel

## ⚠️ Lưu ý quan trọng:
**Vercel KHÔNG cung cấp MySQL miễn phí**. Bạn cần sử dụng dịch vụ database bên thứ ba.

## Các tùy chọn MySQL Free (2024):

### 1. **TiDB Cloud** ⭐ (Recommended - Free tier tốt nhất)
- **URL:** https://tidbcloud.com
- **Free tier:**
  - Tối đa 5 clusters miễn phí
  - MySQL compatible (100% tương thích)
  - Serverless, auto-scaling
  - Không giới hạn storage (có giới hạn về performance)
- **Setup:**
  1. Đăng ký tại https://tidbcloud.com
  2. Tạo cluster mới
  3. Lấy connection string
  4. Import schema từ `database/schema.sql`
- **Ưu điểm:** Hoàn toàn miễn phí, MySQL compatible, dễ setup
- **Nhược điểm:** Có thể chậm hơn so với paid plans

### 2. **PlanetScale** (Có thể đã thay đổi free tier)
- **URL:** https://planetscale.com
- **Free tier (nếu còn):**
  - 1 database miễn phí
  - 5GB storage
  - MySQL compatible
  - Serverless
- **Setup:**
  1. Đăng ký tại https://planetscale.com
  2. Tạo database mới
  3. Lấy connection string
  4. Import schema
- **Lưu ý:** Có thể đã thay đổi chính sách free tier, cần kiểm tra lại

### 3. **Railway** (Free trial, sau đó trả phí)
- **URL:** https://railway.app
- **Free tier:**
  - $5 credit miễn phí mỗi tháng
  - Có thể chạy MySQL instance
  - Hết credit sẽ bị tạm dừng
- **Setup:**
  1. Đăng ký tại https://railway.app
  2. Tạo MySQL service
  3. Lấy connection string
  4. Import schema

### 4. **Supabase** (PostgreSQL - Cần migrate)
- **URL:** https://supabase.com
- **Free tier:**
  - PostgreSQL database
  - 500MB database
  - 2GB file storage
- **Lưu ý:** Không phải MySQL, cần migrate database schema

### 5. **Aiven** (Free trial)
- **URL:** https://aiven.io
- **Free tier:**
  - $300 credit miễn phí
  - MySQL, PostgreSQL, và nhiều database khác
  - Hết credit sẽ bị tạm dừng

### 6. **TiDB Serverless** (Qua Vercel Marketplace)
- **URL:** https://vercel.com/marketplace/tidb-cloud
- **Free tier:**
  - Tối đa 5 clusters miễn phí
  - MySQL compatible
  - Tích hợp sẵn với Vercel
- **Setup:**
  1. Vào Vercel Dashboard
  2. Chọn Marketplace
  3. Tìm "TiDB Cloud"
  4. Kết nối và tạo database

## Khuyến nghị:

### Cho Development/Testing:
✅ **TiDB Cloud** - Hoàn toàn miễn phí, dễ setup, MySQL compatible

### Cho Production (nếu có budget):
- **PlanetScale** - Nếu vẫn còn free tier
- **Railway** - $5/month cho MySQL instance nhỏ
- **Aiven** - $300 credit free trial

## Hướng dẫn setup với TiDB Cloud (Free):

### Bước 1: Tạo tài khoản
1. Truy cập: https://tidbcloud.com
2. Đăng ký tài khoản (có thể dùng GitHub)
3. Xác thực email

### Bước 2: Tạo Cluster
1. Click "Create Cluster"
2. Chọn "Serverless" (Free tier)
3. Chọn region gần nhất (ví dụ: Singapore)
4. Đặt tên cluster
5. Click "Create"

### Bước 3: Lấy Connection String
1. Vào cluster vừa tạo
2. Click tab "Connect"
3. Copy connection string (dạng: `mysql://user:password@host:port/database`)

### Bước 4: Cấu hình Vercel
1. Vào Vercel Dashboard > Project Settings > Environment Variables
2. Thêm các biến:
   ```
   DB_HOST=your-tidb-host
   DB_USER=your-tidb-user
   DB_PASSWORD=your-tidb-password
   DB_NAME=your-database-name
   DB_PORT=4000
   ```

### Bước 5: Import Schema
1. Kết nối đến TiDB Cloud bằng MySQL client
2. Import file `database/schema.sql`
3. Import các file khác nếu cần:
   - `admin_users.sql`
   - `admin_sessions.sql`
   - `media.sql`
   - `media_folders.sql`

## Lưu ý:

1. **Free tier có giới hạn:**
   - Performance có thể chậm hơn
   - Có thể có giới hạn về số lượng connections
   - Storage có thể bị giới hạn

2. **Backup:**
   - Free tier thường không có auto-backup
   - Nên backup database thường xuyên

3. **Production:**
   - Nếu dùng cho production, nên cân nhắc upgrade lên paid plan
   - Hoặc sử dụng database hosting riêng

## Tài liệu tham khảo:
- [TiDB Cloud Documentation](https://docs.pingcap.com/tidbcloud/)
- [PlanetScale Documentation](https://planetscale.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Database Integration](https://vercel.com/docs/storage)

