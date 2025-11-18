# Hướng dẫn cấu hình Vercel Blob Storage

## Vấn đề
Khi deploy lên Vercel, filesystem là read-only, không thể lưu file vào `public/uploads`. Cần sử dụng Vercel Blob Storage để lưu trữ media.

## Cách cấu hình

### Bước 1: Tạo Vercel Blob Store

**Cách 1: Từ Dashboard chính**
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Ở sidebar bên trái, tìm và click **Storage** (biểu tượng database/ổ đĩa)
3. Nếu không thấy, click **More** hoặc **...** để xem thêm menu
4. Trong trang Storage, tìm phần **Blob** hoặc **Blob Storage**
5. Click nút **Create** hoặc **Add Blob Store**
6. Đặt tên store (ví dụ: `tiktiok-media`)
7. Chọn region gần nhất (ví dụ: `sin1` cho Singapore, hoặc `iad1` cho US)
8. Click **Create**

**Cách 2: Từ Project Settings**
1. Vào project của bạn trên Vercel Dashboard
2. Click vào tab **Storage** (có thể ở trên cùng hoặc trong Settings)
3. Tìm phần **Blob** và click **Create** hoặc **Add**

**Cách 3: Trực tiếp từ URL**
1. Truy cập: https://vercel.com/dashboard/storage
2. Click **Create Database** hoặc **Add Blob Store**
3. Chọn **Blob** làm loại storage
4. Điền thông tin và tạo

**Lưu ý**: Nếu không thấy Storage trong menu:
- Có thể cần upgrade plan (nhưng Blob có free tier)
- Hoặc thử refresh trang
- Hoặc tìm trong **Settings** → **Storage**

### Bước 2: Tạo Access Token

**Sau khi tạo Blob Store thành công:**

1. Click vào tên Blob Store vừa tạo để mở chi tiết
2. Vào tab **Settings** (hoặc **Configuration**)
3. Scroll xuống tìm phần **Access Tokens** hoặc **Tokens**
4. Click nút **Create Token** hoặc **Generate Token**
5. Điền thông tin:
   - **Name**: `media-upload-token` (hoặc tên bạn muốn)
   - **Permissions**: Chọn **Read and Write** (hoặc **Full Access**)
6. Click **Create** hoặc **Generate**
7. **⚠️ QUAN TRỌNG**: Copy token ngay lập tức! 
   - Token chỉ hiển thị 1 lần duy nhất
   - Format: `vercel_blob_rw_xxxxx...` (bắt đầu bằng `vercel_blob_rw_`)
   - Lưu token vào nơi an toàn

**Nếu không thấy Access Tokens:**
- Thử click vào tên store trong danh sách Storage
- Hoặc vào **Settings** → **Security** → **Tokens**
- Hoặc tìm trong **API** tab

### Bước 3: Thêm Environment Variable vào Vercel Project

1. Vào project của bạn trên Vercel Dashboard
2. Click tab **Settings** (ở trên cùng, bên cạnh Deployments, Analytics...)
3. Trong menu bên trái của Settings, tìm và click **Environment Variables**
4. Click nút **Add New** hoặc **+ Add** (thường ở góc trên bên phải)
5. Nhập thông tin:
   - **Key** (hoặc Name): `BLOB_READ_WRITE_TOKEN`
   - **Value**: Dán token vừa copy (ví dụ: `vercel_blob_rw_xxxxx...`)
   - **Environment**: 
     - ✅ Chọn **Production**
     - ✅ Chọn **Preview** 
     - ✅ Chọn **Development**
     - (Hoặc chọn "All Environments")
6. Click **Save** hoặc **Add**

**Kiểm tra lại:**
- Trong danh sách Environment Variables, phải thấy `BLOB_READ_WRITE_TOKEN`
- Đảm bảo có dấu tick ở cả 3 môi trường (Production, Preview, Development)

### Bước 4: Redeploy Project

1. Vào **Deployments** tab
2. Click **...** (3 chấm) trên deployment mới nhất
3. Chọn **Redeploy**
4. Hoặc push code mới lên GitHub để trigger auto-deploy

## Kiểm tra

Sau khi redeploy, thử upload ảnh trong admin:
1. Vào `/admin/media`
2. Upload một ảnh
3. Nếu thành công, URL sẽ có dạng: `https://blob.vercel-storage.com/...`

## Troubleshooting

### Lỗi: "BLOB_READ_WRITE_TOKEN is required"
- **Nguyên nhân**: Chưa thêm environment variable hoặc token không đúng
- **Giải pháp**: 
  1. Kiểm tra lại trong Vercel Dashboard → Settings → Environment Variables
  2. Đảm bảo tên biến đúng: `BLOB_READ_WRITE_TOKEN`
  3. Đảm bảo token có quyền Read and Write
  4. Redeploy project

### Lỗi: "Invalid token" hoặc "Unauthorized"
- **Nguyên nhân**: Token không hợp lệ hoặc đã bị revoke
- **Giải pháp**: Tạo token mới và cập nhật lại environment variable

### Upload thành công nhưng ảnh không hiển thị
- **Nguyên nhân**: URL không đúng hoặc CORS issue
- **Giải pháp**: 
  1. Kiểm tra URL trong database (bảng `media`)
  2. URL phải có dạng: `https://blob.vercel-storage.com/...`
  3. Nếu là `/uploads/...`, có nghĩa là chưa dùng Blob

## Lưu trữ vĩnh viễn

✅ **Có, Vercel Blob lưu trữ vĩnh viễn!**
- Files được lưu trữ với độ bền 99.999999999% (11 số 9)
- Dựa trên cơ sở hạ tầng AWS S3
- Files chỉ bị xóa khi bạn chủ động xóa qua API hoặc dashboard
- Không tự động expire hay xóa sau thời gian nhất định

## Chi phí

### Free Tier (Gói Hobby)
- ✅ **1 GB storage miễn phí** (mỗi tháng)
- ✅ **10 GB bandwidth miễn phí** (mỗi tháng)
- ✅ **Không giới hạn số lượng files**

### Chi phí khi vượt free tier
- **Storage**: $0.023/GB/tháng (khoảng 550,000 VNĐ/GB/tháng)
- **Bandwidth**: $0.050/GB (khoảng 1,200,000 VNĐ/GB)
- **Operations**:
  - Đọc dữ liệu: $0.40/million requests
  - Upload/Write: $5.00/million requests

### Ví dụ tính toán
- **1,000 ảnh** (mỗi ảnh 500KB) = ~500MB = **0.5GB**
  - Trong free tier: ✅ **Miễn phí**
  - Vượt free tier: ~$0.01/tháng (khoảng 250 VNĐ/tháng)

- **10,000 ảnh** (mỗi ảnh 500KB) = ~5GB
  - Vượt free tier: ~$0.10/tháng (khoảng 2,500 VNĐ/tháng)

## Lưu ý

- Files được lưu vĩnh viễn cho đến khi bạn xóa
- URL là public, có thể truy cập trực tiếp
- Không cần cấu hình CORS
- CDN tự động, tốc độ tải nhanh toàn cầu
- Hỗ trợ HTTPS tự động

## Kết luận

**Với hầu hết website nhỏ/trung bình:**
- ✅ **Hoàn toàn miễn phí** (dưới 1GB storage, dưới 10GB bandwidth/tháng)
- ✅ **Lưu trữ vĩnh viễn**, không lo mất dữ liệu
- ✅ **Chi phí rất thấp** nếu vượt free tier

**Khuyến nghị**: Dùng Vercel Blob cho production, rất phù hợp cho website bán hàng!

Xem thêm: https://vercel.com/docs/storage/vercel-blob/usage-and-pricing

