# Hướng dẫn Deploy lên Vercel

## Bước 1: Chuẩn bị

1. **Đảm bảo code đã được commit lên Git:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Tạo tài khoản Vercel:**
   - Truy cập https://vercel.com
   - Đăng nhập bằng GitHub/GitLab/Bitbucket

## Bước 2: Cấu hình Database

Vercel không hỗ trợ MySQL trực tiếp. Bạn cần sử dụng một trong các giải pháp sau:

### Option 1: Sử dụng TiDB Cloud (Recommended - FREE) ⭐
- **URL:** https://tidbcloud.com
- **Free tier:** Tối đa 5 clusters miễn phí, MySQL compatible
- **Setup:**
  1. Đăng ký tại https://tidbcloud.com
  2. Tạo Serverless cluster (free)
  3. Lấy connection string
  4. Import schema từ `database/schema.sql`
- **Xem chi tiết:** Xem file `MYSQL_FREE_OPTIONS.md`

### Option 2: Sử dụng PlanetScale
- Truy cập https://planetscale.com
- Tạo database mới (kiểm tra free tier còn không)
- Lấy connection string
- Import schema từ `database/schema.sql`

### Option 3: Sử dụng Railway
- Truy cập https://railway.app
- Tạo MySQL service ($5 credit free mỗi tháng)
- Lấy connection string
- Import schema

### Option 4: Sử dụng Vercel Postgres (cần migrate từ MySQL sang PostgreSQL)

## Bước 3: Deploy lên Vercel

### Cách 1: Deploy qua Vercel Dashboard (Recommended)

1. **Import Project:**
   - Vào https://vercel.com/new
   - Chọn repository từ GitHub/GitLab/Bitbucket
   - Chọn project folder: `k1`

2. **Cấu hình Environment Variables:**
   - Vào Settings > Environment Variables
   - Thêm các biến sau:
     ```
     DB_HOST=your-database-host
     DB_USER=your-database-user
     DB_PASSWORD=your-database-password
     DB_NAME=your-database-name
     DB_PORT=3306
     SESSION_SECRET=your-random-secret-key
     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
     ```

3. **Cấu hình Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy:**
   - Click "Deploy"
   - Chờ build hoàn tất

### Cách 2: Deploy qua Vercel CLI

1. **Cài đặt Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd k1
   vercel
   ```

4. **Thêm Environment Variables:**
   ```bash
   vercel env add DB_HOST
   vercel env add DB_USER
   vercel env add DB_PASSWORD
   vercel env add DB_NAME
   vercel env add DB_PORT
   vercel env add SESSION_SECRET
   vercel env add NEXT_PUBLIC_APP_URL
   ```

5. **Deploy production:**
   ```bash
   vercel --prod
   ```

## Bước 4: Cấu hình sau khi deploy

1. **Import Database Schema:**
   - Kết nối đến database production
   - Chạy các file SQL trong thư mục `database/`:
     - `schema.sql`
     - `admin_users.sql`
     - `admin_sessions.sql`
     - `media.sql`
     - `media_folders.sql`

2. **Tạo Admin User:**
   - Sử dụng script: `npm run create-admin`
   - Hoặc tạo trực tiếp trong database

3. **Cấu hình Domain (Optional):**
   - Vào Project Settings > Domains
   - Thêm custom domain nếu có

## Bước 5: Kiểm tra

1. Truy cập URL được cung cấp bởi Vercel
2. Kiểm tra các chức năng:
   - Trang chủ
   - Chi tiết sản phẩm
   - Giỏ hàng
   - Checkout
   - Admin panel

## Troubleshooting

### Lỗi Database Connection
- Kiểm tra Environment Variables đã được set đúng chưa
- Kiểm tra database có cho phép connection từ Vercel IP không
- Thử sử dụng connection string thay vì các biến riêng lẻ

### Lỗi Build
- Kiểm tra logs trong Vercel Dashboard
- Đảm bảo tất cả dependencies đã được cài đặt
- Kiểm tra TypeScript errors

### Lỗi Runtime
- Kiểm tra server logs trong Vercel Dashboard
- Kiểm tra database connection pool settings
- Kiểm tra memory limits

## Lưu ý quan trọng

1. **Database Connection:**
   - Vercel sử dụng serverless functions, mỗi request có thể tạo connection mới
   - Đảm bảo database có connection pool phù hợp
   - Xem xét sử dụng connection pooling service

2. **File Uploads:**
   - Vercel không lưu trữ files persistent
   - Cần sử dụng external storage (S3, Cloudinary, etc.)
   - Hoặc sử dụng Vercel Blob Storage

3. **Environment Variables:**
   - Không commit `.env` files
   - Sử dụng Vercel Environment Variables
   - Có thể set khác nhau cho Production, Preview, Development

4. **Performance:**
   - Enable Edge Functions nếu có thể
   - Sử dụng ISR (Incremental Static Regeneration) cho static pages
   - Optimize images với Next.js Image component

## Tài liệu tham khảo

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PlanetScale Documentation](https://planetscale.com/docs)

