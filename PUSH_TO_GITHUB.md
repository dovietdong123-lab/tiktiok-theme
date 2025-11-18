# Hướng dẫn Push code lên GitHub

## Bước 1: Tạo repository trên GitHub

1. Truy cập: https://github.com/new
2. Điền thông tin:
   - **Repository name:** `tiktiok-theme` (hoặc tên bạn muốn)
   - **Description:** (tùy chọn)
   - **Visibility:** Public hoặc Private
   - **KHÔNG** tích "Initialize with README"
   - **KHÔNG** chọn .gitignore hoặc license
3. Click **"Create repository"**
4. **Copy URL** repository (ví dụ: `https://github.com/your-username/tiktiok-theme.git`)

## Bước 2: Cập nhật remote URL

```bash
cd D:\tiktiok-theme\k1

# Xóa remote cũ (nếu có)
git remote remove origin

# Thêm remote mới với URL thật của bạn
git remote add origin https://github.com/your-username/tiktiok-theme.git

# Kiểm tra lại
git remote -v
```

## Bước 3: Push code lên GitHub

```bash
cd D:\tiktiok-theme\k1

# Đảm bảo đang ở branch main
git branch -M main

# Push code lên GitHub
git push -u origin main
```

## Nếu gặp lỗi:

### Lỗi: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/your-username/repo-name.git
```

### Lỗi: "authentication failed"
- Cần cấu hình GitHub authentication:
  - Sử dụng Personal Access Token (PAT)
  - Hoặc SSH key
  - Xem hướng dẫn: https://docs.github.com/en/authentication

### Lỗi: "repository not found"
- Kiểm tra URL repository đã đúng chưa
- Kiểm tra bạn có quyền truy cập repository không

## Sau khi push thành công:

1. Truy cập repository trên GitHub để xác nhận code đã được upload
2. Tiếp tục deploy lên Vercel:
   - Vào https://vercel.com
   - Import project từ GitHub
   - Deploy

