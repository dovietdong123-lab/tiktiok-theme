# Hướng dẫn Deploy nhanh lên Vercel

## Bước 1: Cấu hình Git (CHẠY NGAY)

```bash
cd D:\tiktiok-theme\k1

# Cấu hình Git user (thay bằng thông tin của bạn)
git config user.email "your-email@example.com"
git config user.name "Your Name"

# Hoặc dùng --global để set cho tất cả repositories
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

## Bước 2: Commit code

```bash
cd D:\tiktiok-theme\k1

# Commit code
git commit -m "Initial commit - Prepare for Vercel deployment"
```

## Bước 3: Tạo repository trên GitHub

1. Truy cập https://github.com/new
2. Tạo repository mới (ví dụ: `tiktiok-theme`)
3. **KHÔNG** tích "Initialize with README"
4. Copy URL repository

## Bước 4: Push code lên GitHub

```bash
cd D:\tiktiok-theme\k1

# Thêm remote repository (thay URL bằng URL của bạn)
git remote add origin https://github.com/username/tiktiok-theme.git

# Đổi tên branch thành main
git branch -M main

# Push code
git push -u origin main
```

## Bước 5: Deploy lên Vercel

1. **Truy cập:** https://vercel.com
2. **Đăng nhập** bằng GitHub
3. **Click "Add New Project"**
4. **Chọn repository** vừa tạo
5. **Cấu hình:**
   - Root Directory: `k1`
   - Framework: Next.js (auto-detect)
   - Build Command: `npm run build`
   - Output Directory: `.next`

6. **Thêm Environment Variables:**
   - Vào Settings > Environment Variables
   - Thêm các biến sau:
     ```
     DB_HOST=your-database-host
     DB_USER=your-database-user
     DB_PASSWORD=your-database-password
     DB_NAME=your-database-name
     DB_PORT=3306
     SESSION_SECRET=random-secret-key-here
     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
     ```

7. **Click "Deploy"**

## ⚠️ Lưu ý quan trọng:

### Database:
Vercel không hỗ trợ MySQL trực tiếp. Bạn cần:
- **PlanetScale** (recommended): https://planetscale.com
- **Railway**: https://railway.app
- Hoặc bất kỳ MySQL hosting nào khác

### Sau khi deploy:
1. Import database schema từ `database/schema.sql`
2. Tạo admin user
3. Kiểm tra các chức năng

## Troubleshooting:

### Lỗi: "Author identity unknown"
```bash
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

### Lỗi: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/username/repo.git
```

### Kiểm tra Git status:
```bash
git status
```

### Kiểm tra remote:
```bash
git remote -v
```

