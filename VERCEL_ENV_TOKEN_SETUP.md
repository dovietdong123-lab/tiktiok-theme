# ⚠️ QUAN TRỌNG: Thêm Token vào Vercel Environment Variables

## Token của bạn
```
tiktiok_theme_READ_WRITE_TOKEN=vercel_blob_rw_gUCERyRjf4dOF1MF_6H7PmxbZgQjAGx6wEZjjBr4f0ve27s
```

## Cách thêm vào Vercel

### Bước 1: Vào Project Settings
1. Đăng nhập [Vercel Dashboard](https://vercel.com/dashboard)
2. Click vào **project của bạn** (tiktiok-theme)
3. Click tab **Settings** (ở trên cùng)

### Bước 2: Thêm Environment Variable
1. Trong menu bên trái Settings, click **Environment Variables**
2. Click nút **Add New** (góc trên bên phải)
3. Nhập:
   - **Key**: `tiktiok_theme_READ_WRITE_TOKEN`
   - **Value**: `vercel_blob_rw_gUCERyRjf4dOF1MF_6H7PmxbZgQjAGx6wEZjjBr4f0ve27s`
   - **Environment**: 
     - ✅ **Production**
     - ✅ **Preview**
     - ✅ **Development**
4. Click **Save**

### Bước 3: Redeploy
1. Vào tab **Deployments**
2. Click **...** (3 chấm) trên deployment mới nhất
3. Chọn **Redeploy**
4. Hoặc đợi auto-deploy từ Git push

## Kiểm tra

Sau khi redeploy, thử upload ảnh:
1. Vào `/admin/media`
2. Upload một ảnh
3. Nếu thành công, URL sẽ có dạng: `https://blob.vercel-storage.com/...`

## Lưu ý

- ✅ `.env.local` chỉ dùng cho **local development**
- ✅ **Vercel Environment Variables** dùng cho **production trên Vercel**
- ⚠️ Phải thêm vào cả 2 nơi nếu muốn chạy được ở cả local và production

