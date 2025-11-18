# Hướng dẫn cấu hình MySQL

## 1. Cài đặt dependencies

```bash
npm install
```

Package `mysql2` đã được thêm vào `package.json`.

## 2. Cấu hình database

File `.env.local` đã được tạo với cấu hình:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=k1
DB_PORT=3306
```

## 3. Tạo database và tables

Chạy file SQL để tạo database và tables:

```bash
mysql -u root -p < database/schema.sql
```

Hoặc mở MySQL và chạy:

```sql
source database/schema.sql
```

File `database/schema.sql` bao gồm:
- Tạo database `k1`
- Tạo các bảng: `categories`, `products`, `product_variants`, `product_reviews`, `orders`, `order_items`
- Insert sample data

## 4. Cấu trúc database

### Bảng `products`
- `id` - ID sản phẩm
- `name` - Tên sản phẩm
- `price` - Giá bán
- `regular_price` - Giá gốc
- `discount` - % giảm giá
- `image` - Ảnh chính
- `gallery` - JSON array các ảnh
- `description` - Mô tả HTML
- `category_id` - ID danh mục
- `sold` - Số lượng đã bán
- `status` - Trạng thái (active/inactive/deleted)
- `featured` - Sản phẩm nổi bật

### Bảng `categories`
- `id` - ID danh mục
- `name` - Tên danh mục
- `slug` - URL slug
- `image` - Ảnh danh mục
- `status` - Trạng thái

## 5. API Routes đã được cập nhật

Tất cả API routes đã được cập nhật để sử dụng MySQL:

- ✅ `GET /api/products` - Lấy danh sách sản phẩm
- ✅ `POST /api/products` - Tạo sản phẩm mới
- ✅ `GET /api/products/[id]` - Chi tiết sản phẩm
- ✅ `PUT /api/products/[id]` - Cập nhật sản phẩm
- ✅ `DELETE /api/products/[id]` - Xóa sản phẩm
- ✅ `GET /api/products/featured` - Sản phẩm nổi bật
- ✅ `GET /api/products/recommended` - Sản phẩm đề xuất
- ✅ `GET /api/categories` - Danh sách danh mục

## 6. Test connection

Để test kết nối database, tạo file test:

```typescript
// test-db.ts
import { testConnection } from './lib/db'

testConnection().then(success => {
  console.log(success ? '✅ Database connected' : '❌ Database connection failed')
})
```

## 7. Lưu ý

- File `.env.local` không được commit lên git (đã có trong `.gitignore`)
- Nếu database chưa sẵn sàng, API sẽ fallback về mock data
- Connection pool được sử dụng để tối ưu performance
- Tất cả queries đều có error handling

## 8. Troubleshooting

### Lỗi kết nối database
- Kiểm tra MySQL đã chạy chưa
- Kiểm tra thông tin trong `.env.local`
- Kiểm tra database `k1` đã được tạo chưa

### Lỗi table không tồn tại
- Chạy lại file `database/schema.sql`
- Kiểm tra user có quyền CREATE TABLE

### API trả về mock data
- Kiểm tra console log để xem lỗi
- Đảm bảo database và tables đã được tạo
- Kiểm tra connection trong `lib/db.ts`

