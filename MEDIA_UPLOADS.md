# Media Uploads (Admin Thư viện ảnh)

## 1. Behavior

- **Local development**: files are saved to `public/uploads`. Thư viện ảnh hiển thị qua URL `/uploads/<filename>`.
- **Production (Vercel)**: filesystem read-only ⇒ images được upload lên **Vercel Blob** (CDN). Cần token `BLOB_READ_WRITE_TOKEN`.

## 2. Setup Vercel Blob

1. Vào [Vercel Blob dashboard](https://vercel.com/dashboard/storage/blob).
2. Tạo Blob store (hoặc dùng store mặc định).
3. Tạo **Access Token** (Read/Write).
4. Vào Vercel project → **Settings → Environment Variables**, thêm:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
```

5. Redeploy project.

## 3. Local development

- Không cần token.
- Đảm bảo thư mục `public/uploads` được commit rỗng (có `.gitkeep` nếu muốn) hoặc để script tự tạo.

## 4. Deleting images

- Nếu ảnh nằm trên Vercel Blob (URL bắt đầu bằng `https://blob.vercel-storage.com/...`), API sẽ gọi `del()` để xoá trên Blob.
- Nếu ảnh nằm trong `public/uploads`, API xoá file trên disk.

## 5. Troubleshooting

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-------------|-----------|
| `ENOENT: no such file or directory, mkdir '/var/task/public/uploads'` | Đang chạy trên Vercel (read-only FS) nhưng chưa cấu hình `BLOB_READ_WRITE_TOKEN`. | Tạo token blob và thêm vào env. |
| Upload thành công nhưng ảnh không xuất hiện | URL trả về `/uploads/...` nhưng file không được deploy. | Với Vercel, phải dùng Blob. |
| Không chọn được ảnh từ Media Library | Chưa đăng nhập admin hoặc token hết hạn. | Đăng nhập lại `/admin/login`. |

## 6. Using Media URLs

- Các component frontend (header, checkout, v.v.) sử dụng trực tiếp `media.url`. Nếu là URL tuyệt đối (Blob) sẽ được load qua CDN.
- Khi chọn ảnh trong admin (ví dụ logo), hệ thống lưu URL đó vào store settings.


