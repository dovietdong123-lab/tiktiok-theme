# Hướng dẫn Setup Git và Deploy

## Đã hoàn thành:
✅ Git repository đã được khởi tạo
✅ Files đã được add vào staging

## Bước tiếp theo:

### 1. Tạo repository trên GitHub/GitLab/Bitbucket

**GitHub:**
1. Truy cập https://github.com/new
2. Tạo repository mới (ví dụ: `tiktiok-theme`)
3. **KHÔNG** tích "Initialize with README"
4. Copy URL repository (ví dụ: `https://github.com/username/tiktiok-theme.git`)

### 2. Kết nối local repository với remote

```bash
cd D:\tiktiok-theme\k1

# Thêm remote repository
git remote add origin https://github.com/username/tiktiok-theme.git

# Đổi tên branch thành main (nếu cần)
git branch -M main

# Push code lên GitHub
git push -u origin main
```

### 3. Deploy lên Vercel

Sau khi code đã được push lên GitHub:

1. **Truy cập Vercel:**
   - Vào https://vercel.com
   - Đăng nhập bằng GitHub

2. **Import Project:**
   - Click "Add New Project"
   - Chọn repository vừa tạo
   - Cấu hình:
     - **Root Directory:** `k1`
     - **Framework Preset:** Next.js (auto-detect)
     - **Build Command:** `npm run build` (default)
     - **Output Directory:** `.next` (default)

3. **Thêm Environment Variables:**
   Vào Settings > Environment Variables và thêm:
   ```
   DB_HOST=your-database-host
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=your-database-name
   DB_PORT=3306
   SESSION_SECRET=generate-random-string-here
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Deploy:**
   - Click "Deploy"
   - Chờ build hoàn tất

## Lưu ý quan trọng:

### ⚠️ KHÔNG commit các file sau:
- `.env` hoặc `.env.local` (đã có trong .gitignore)
- `node_modules/` (đã có trong .gitignore)
- `.next/` (đã có trong .gitignore)
- Files upload trong `public/uploads/` (đã có trong .gitignore)

### 🔐 Bảo mật:
- **KHÔNG** commit file `.env` chứa thông tin database
- Sử dụng Vercel Environment Variables thay vì file .env
- Generate SESSION_SECRET mạnh cho production

### 📦 Database:
Vercel không hỗ trợ MySQL trực tiếp. Bạn cần:
- **PlanetScale** (MySQL compatible, recommended)
- **Railway** (MySQL hosting)
- **Supabase** (PostgreSQL, cần migrate)
- Hoặc bất kỳ MySQL hosting service nào khác

## Troubleshooting:

### Lỗi: "fatal: not a git repository"
```bash
cd D:\tiktiok-theme\k1
git init
```

### Lỗi khi push: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/username/repo.git
```

### Kiểm tra remote đã được thêm chưa:
```bash
git remote -v
```

## Tài liệu tham khảo:
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

