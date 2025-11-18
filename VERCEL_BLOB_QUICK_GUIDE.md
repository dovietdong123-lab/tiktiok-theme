# Hướng dẫn nhanh: Tìm Blob Storage trên Vercel

## Nếu không tìm thấy "Storage" trong menu

### Cách 1: Tìm trong Dashboard chính
1. Vào https://vercel.com/dashboard
2. Nhìn vào **sidebar bên trái**
3. Tìm các mục sau (theo thứ tự):
   - **Home** (trang chủ)
   - **Projects** (dự án)
   - **Deployments** (triển khai)
   - **Storage** ← **Tìm ở đây!**
   - **Analytics**
   - **Settings**

### Cách 2: Tìm trong Project
1. Click vào **tên project** của bạn
2. Ở **trên cùng** có các tab:
   - **Overview**
   - **Deployments**
   - **Analytics**
   - **Storage** ← **Có thể ở đây!**
   - **Settings**

### Cách 3: Tìm trong Settings
1. Vào project → **Settings**
2. Trong menu bên trái Settings, tìm:
   - **General**
   - **Environment Variables**
   - **Storage** ← **Có thể ở đây!**
   - **Domains**

### Cách 4: Dùng URL trực tiếp
Truy cập trực tiếp: **https://vercel.com/dashboard/storage**

## Nếu vẫn không thấy

### Kiểm tra Plan
- Vercel Blob có free tier, nhưng có thể cần:
  - Đăng nhập tài khoản Vercel
  - Xác minh email (nếu chưa)
  - Có ít nhất 1 project đã deploy

### Thử các cách khác
1. **Tìm kiếm**: Click vào ô search (thường ở trên cùng) và gõ "blob" hoặc "storage"
2. **Menu More**: Click vào "..." hoặc "More" để xem menu ẩn
3. **Refresh**: F5 để refresh trang
4. **Đăng xuất/đăng nhập lại**: Có thể do session cũ

## Screenshot mô tả vị trí

```
Vercel Dashboard
├── Sidebar (bên trái)
│   ├── Home
│   ├── Projects
│   ├── Deployments
│   ├── Storage ← TÌM Ở ĐÂY
│   ├── Analytics
│   └── Settings
│
└── Hoặc trong Project
    ├── Overview
    ├── Deployments
    ├── Analytics
    ├── Storage ← HOẶC Ở ĐÂY
    └── Settings
```

## Liên hệ hỗ trợ

Nếu vẫn không tìm thấy:
1. Vào https://vercel.com/support
2. Hoặc email: support@vercel.com
3. Hoặc chat trực tiếp trong dashboard (icon chat ở góc dưới bên phải)

## Alternative: Dùng Vercel CLI

Nếu không tìm thấy trên web, có thể dùng CLI:

```bash
# Cài Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
cd k1
vercel link

# Tạo Blob store qua CLI (nếu hỗ trợ)
# Hoặc dùng API
```

