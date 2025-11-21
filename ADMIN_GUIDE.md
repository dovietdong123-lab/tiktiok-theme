# Admin Panel Guide

Tài liệu này giúp bạn kiểm tra nhanh trạng thái admin, hiểu luồng bảo mật và vận hành từng module trong `tiktiok-theme`.

---

## 1. Chuẩn bị & tạo tài khoản

1. Thiết lập môi trường Next.js/Node.js (xem `README.md` để cài đặt dependencies).
2. Cấu hình kết nối DB trong `.env.local` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PASSWORD_SALT`, ...).
3. Khởi tạo tài khoản quản trị bằng script có sẵn:
   ```
   cd k1
   node scripts/create-admin.js
   ```
   Script sẽ tạo user mặc định `admin/admin123` và bảng `admin_users` nếu chưa tồn tại.

---

## 2. Đăng nhập & bảo mật

- Trang đăng nhập: `/admin/login`.
- Thông tin đăng nhập thành công được lưu vào `localStorage` dưới khóa `admin_token` và `admin_user`, đồng thời cookie session được set từ API (`/api/admin/auth/login`).
- `AdminLayout` kiểm tra token ngay khi mount và tự động redirect về `/admin/login` nếu token không tồn tại hoặc hết hạn.
- Đăng xuất gọi `POST /api/admin/auth/logout`, xóa token ở client và chuyển về trang đăng nhập.
- Tất cả requests trong admin đều đính kèm `Authorization: Bearer <token>` + `credentials: 'include'` để dùng cookie khi cần.

---

## 3. Điều hướng & layout

- Sidebar cố định (`components/admin/Sidebar.tsx`) gồm các mục: Dashboard, Sản phẩm, Danh mục, Thư viện ảnh, Đơn hàng, Mã giảm giá, Cài đặt.
- Header hiển thị tiêu đề trang, chào admin đang đăng nhập và nút `Đăng xuất`.
- Nội dung chính cuộn độc lập, thuận tiện xem bảng dữ liệu dài.

---

## 4. Module theo menu

### 4.1 Dashboard (`/admin`)
Hiển thị các thẻ thống kê (placeholder 3 ô). Dùng để cắm số liệu tổng quan trong tương lai.

### 4.2 Sản phẩm (`/admin/products`, `/admin/products/new`, `/admin/products/[id]`)
- **Danh sách** (`ProductTable`):
  - Fetch `GET /api/admin/products` ngay sau khi mount.
  - Nút `+ Thêm sản phẩm mới` dẫn tới trang tạo sản phẩm.
  - Xóa sản phẩm gọi `DELETE /api/admin/products/{id}` (soft delete thông qua status).
- **Form tạo/sửa** (`ProductForm`):
  1. **Thông tin cơ bản**: tên, slug (tự sinh từ tên, chuẩn hóa bỏ dấu), giá bán/gốc, tồn kho. Discount % tự tính theo giá.
  2. **Hình ảnh**: chọn ảnh chính hoặc gallery từ thư viện (MediaLibrary) hoặc nhập URL, gallery lưu dạng JSON string.
  3. **Mô tả**: mô tả ngắn (textarea) và mô tả chi tiết bằng Rich Text Editor (ReactQuill/Tiptap).
  4. **Thuộc tính**: tạo các attribute (Size, Color, ...) kèm nhiều giá trị, có thể đính ảnh, màu, giá riêng và auto tính discount cho từng option.
  5. **Đánh giá mẫu**: thêm review với avatar, nội dung (HTML), trạng thái hiển thị, bộ ảnh minh họa; hỗ trợ multi-select ảnh từ media.
  6. **Cài đặt**: chọn danh mục (fetch từ `/api/admin/categories`), trạng thái (active/inactive/deleted), đánh dấu sản phẩm nổi bật.
  7. Gửi form sẽ tự gọi `POST /api/admin/products` hoặc `PUT /api/admin/products/{id}`, hiển thị `Toast` và redirect về danh sách.

### 4.3 Danh mục (`/admin/categories`, `/admin/categories/new`, `/admin/categories/[id]`)
- **Danh sách**: hiển thị bảng danh mục cùng ảnh, slug, trạng thái.
- **Form** (`CategoryForm`):
  - Tên bắt buộc, slug tự sinh nếu trống.
  - Chọn ảnh đại diện từ MediaLibrary.
  - Thiết lập danh mục cha (dropdown lấy từ `/api/admin/categories`, loại trừ chính nó khi chỉnh sửa).
  - Mô tả chi tiết, trạng thái.
  - Lưu gọi `POST/PUT /api/admin/categories`, redirect về danh sách sau khi hiện toast.

### 4.4 Thư viện ảnh (`/admin/media`)
- Giao diện full-screen dùng chung cho form sản phẩm, danh mục, settings.
- Tính năng:
  - Upload ảnh (drag input) → `POST /api/admin/media`.
  - Tạo/xóa thư mục → `POST/DELETE /api/admin/media/folders`, hỗ trợ đếm số ảnh mỗi thư mục.
  - Liệt kê ảnh với preview, delete từng ảnh (`DELETE /api/admin/media/{id}`).
  - Chế độ chọn single hoặc multiple; trong chế độ multiple có nút `✓ Chọn n ảnh`.
  - Có thể mở như modal (form) hoặc trang riêng trong admin.

### 4.5 Đơn hàng (`/admin/orders`)
- Lọc theo trạng thái (`pending`, `processing`, `shipped`, `delivered`, `cancelled`).
- Bảng chi tiết mỗi đơn: thông tin khách, địa chỉ, tổng tiền, giảm giá/coupon, danh sách sản phẩm.
- Có dropdown cập nhật trạng thái, gọi `PUT /api/admin/orders/{id}` và cập nhật local state ngay.
- Loading skeleton + thông báo lỗi rõ ràng khi fetch thất bại.

### 4.6 Mã giảm giá (`/admin/coupons`)
- Sidebar form tạo/cập nhật coupon, phần còn lại hiển thị danh sách.
- Thuộc tính coupon: mã, mô tả, loại giảm (percent/fixed), giá trị, đơn tối thiểu, giới hạn sử dụng, thời gian hiệu lực, trạng thái.
- Có nút tạo mã ngẫu nhiên, filter theo trạng thái.
- CRUD sử dụng `POST/PUT/DELETE /api/admin/coupons` với toast thông báo kết quả.

### 4.7 Cài đặt (`/admin/settings`)
- Form chia 3 section: thông tin cửa hàng, màu sắc/banner, liên kết MXH.
- Logo và hero banner chọn từ MediaLibrary.
- Dữ liệu fetch/save qua `GET/POST /api/admin/settings`.
- Toast hiển thị trạng thái lưu, nút lưu cuối trang.

---

## 5. API endpoints chính

| Module | Endpoints |
| --- | --- |
| Auth | `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`, `GET /api/admin/auth/check-user`, `GET /api/admin/auth/debug` |
| Products | `GET/POST /api/admin/products`, `GET/PUT/DELETE /api/admin/products/{id}` |
| Categories | `GET/POST /api/admin/categories`, `GET/PUT/DELETE /api/admin/categories/{id}` |
| Media | `GET/POST /api/admin/media`, `DELETE /api/admin/media/{id}`, `GET/POST /api/admin/media/folders`, `DELETE /api/admin/media/folders/{id}`, `POST /api/admin/upload` |
| Orders | `GET /api/admin/orders`, `GET/PUT /api/admin/orders/{id}` |
| Coupons | `GET/POST /api/admin/coupons`, `GET/PUT/DELETE /api/admin/coupons/{id}` |
| Settings | `GET/POST /api/admin/settings` |
| Stats | `GET /api/admin/stats` (chưa dùng ở UI) |

Tất cả endpoints (trừ stats public) đều gọi `requireAdminAuth` để kiểm tra token + session.

---

## 6. Checklist kiểm tra admin

1. **Auth**  
   - Chạy `node scripts/create-admin.js`, đăng nhập tại `/admin/login`.  
   - Đảm bảo khi xóa token khỏi `localStorage`, UI tự động back to login.
2. **Điều hướng**  
   - Sidebar hiển thị đủ 7 mục, trạng thái active đúng route.
3. **CRUD sản phẩm**  
   - Tạo sản phẩm với gallery + thuộc tính + review mẫu.  
   - Chỉnh sửa sản phẩm, đảm bảo thuộc tính được load đúng.  
   - Xóa sản phẩm → quay lại danh sách và không còn trong bảng (status `deleted`).
4. **CRUD danh mục**  
   - Tạo danh mục cha/con, đổi trạng thái.  
   - Kiểm tra slug tự sinh và ảnh.
5. **Media**  
   - Upload ảnh (PNG/JPG/WebP), tạo thư mục, di chuyển vào folder, xóa ảnh/thư mục.  
   - Chọn ảnh cho sản phẩm/danh mục/settings.
6. **Đơn hàng & Coupons**  
   - Lọc đơn hàng, cập nhật trạng thái.  
   - Tạo coupon percent + fixed, chỉnh sửa, xóa, kiểm tra bộ lọc trạng thái.
7. **Cài đặt**  
   - Cập nhật logo, màu sắc, hero banner, social links; reload trang để chắc chắn dữ liệu được lưu.

---

## 7. Lưu ý & hạn chế hiện tại

- **Products - Reviews Update**: API đang xóa toàn bộ review trước khi insert lại (cần transaction/logic tinh chỉnh).
- **Coupons - Hard Delete**: Route `DELETE` xóa thẳng DB → cân nhắc soft delete để lưu lịch sử.
- **Validation**: Còn thiếu các check `price > 0`, `discount <= 100`, `category_id` hợp lệ, vv.
- **Orders**: Chưa kiểm soát quy tắc chuyển trạng thái, chưa có audit log.
- **Settings API**: Một số handler chưa dùng `requireAuth` đồng nhất; cần confirm mức độ public.
- **Number parsing**: Nhiều chỗ dùng `parseInt`/`Number` không bắt lỗi → nên wrap helper.

Chi tiết xem thêm `ADMIN_LOGIC_ISSUES.md`.

---

## 8. Troubleshooting nhanh

- **401 liên tục**: kiểm tra token trong `localStorage`, cookie `admin_session`, và middleware `app/middleware.ts`.
- **Không tạo được sản phẩm**: kiểm tra network tab xem payload đã stringify đúng (gallery phải là JSON string); đảm bảo categories đã tồn tại để chọn.
- **Media upload fail**: xác minh thư mục `public/uploads` có quyền ghi và `.env` đã set biến storage (nếu dùng service bên ngoài).
- **Login sai hash**: đảm bảo `PASSWORD_SALT` ở `.env.local` khớp với salt dùng khi tạo tài khoản.

---

## 9. Đề xuất mở rộng

- Bổ sung phân trang/bộ lọc nâng cao cho danh sách sản phẩm.
- Cho phép bulk actions (đổi trạng thái hàng loạt).
- Ghi log hoạt động (ai tạo/sửa/xóa).
- Tích hợp upload trực tiếp đến S3/Vercel Blob để giảm tải server.

Tài liệu sẽ được cập nhật khi có module mới hoặc thay đổi quy trình.

