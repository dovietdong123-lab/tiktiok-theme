# Admin Panel Guide

## Tổng quan

Admin panel được tạo để quản lý sản phẩm và danh mục một cách dễ dàng.

## Truy cập Admin

- **Dashboard**: `/admin`
- **Sản phẩm**: `/admin/products`
- **Thêm sản phẩm**: `/admin/products/new`
- **Sửa sản phẩm**: `/admin/products/[id]`
- **Danh mục**: `/admin/categories`
- **Thêm danh mục**: `/admin/categories/new`
- **Sửa danh mục**: `/admin/categories/[id]`

## Tính năng

### Quản lý Sản phẩm

#### Danh sách sản phẩm (`/admin/products`)
- Xem tất cả sản phẩm
- Xem ảnh, tên, giá, trạng thái
- Sửa sản phẩm
- Xóa sản phẩm (soft delete)

#### Thêm/Sửa sản phẩm
**Thông tin cơ bản:**
- Tên sản phẩm * (bắt buộc)
- Slug (tự động tạo từ tên)
- Giá bán * (bắt buộc)
- Giá gốc
- Giảm giá (%)
- Tồn kho

**Hình ảnh:**
- Ảnh chính (URL)
- Gallery (JSON array hoặc URLs cách nhau bởi dấu phẩy)

**Mô tả:**
- Mô tả ngắn
- Mô tả chi tiết (HTML)

**Cài đặt:**
- Danh mục (ID)
- Trạng thái (active/inactive/deleted)
- Sản phẩm nổi bật (checkbox)

### Quản lý Danh mục

#### Danh sách danh mục (`/admin/categories`)
- Xem tất cả danh mục
- Xem ảnh, tên, slug, trạng thái
- Sửa danh mục
- Xóa danh mục (soft delete)

#### Thêm/Sửa danh mục
**Thông tin:**
- Tên danh mục * (bắt buộc)
- Slug (tự động tạo từ tên)
- Ảnh danh mục (URL)
- Danh mục cha (ID - để trống nếu là danh mục gốc)
- Trạng thái (active/inactive/deleted)
- Mô tả

## API Endpoints

### Products

- `GET /api/admin/products` - Lấy danh sách
- `POST /api/admin/products` - Tạo mới
- `GET /api/admin/products/[id]` - Chi tiết
- `PUT /api/admin/products/[id]` - Cập nhật
- `DELETE /api/admin/products/[id]` - Xóa (soft delete)

### Categories

- `GET /api/admin/categories` - Lấy danh sách
- `POST /api/admin/categories` - Tạo mới
- `GET /api/admin/categories/[id]` - Chi tiết
- `PUT /api/admin/categories/[id]` - Cập nhật
- `DELETE /api/admin/categories/[id]` - Xóa (soft delete)

## Tính năng tự động

1. **Auto-generate slug**: Nếu không nhập slug, hệ thống tự động tạo từ tên
2. **Slug uniqueness**: Tự động thêm timestamp nếu slug đã tồn tại
3. **Soft delete**: Xóa không xóa thật, chỉ đổi status
4. **Validation**: Kiểm tra danh mục có sản phẩm trước khi xóa

## Lưu ý

- Tất cả thao tác đều có confirm dialog
- Xóa danh mục sẽ kiểm tra xem có sản phẩm không
- Gallery có thể nhập JSON array hoặc URLs cách nhau bởi dấu phẩy
- Slug được normalize (bỏ dấu, chuyển thành lowercase)

## Bảo mật

⚠️ **Hiện tại chưa có authentication!** 

Để thêm authentication:
1. Tạo login page
2. Thêm middleware để check authentication
3. Sử dụng session hoặc JWT

## Cải thiện có thể thêm

- [ ] Authentication & Authorization
- [ ] Image upload (thay vì chỉ URL)
- [ ] Bulk actions (xóa nhiều, đổi status nhiều)
- [ ] Search & Filter
- [ ] Pagination
- [ ] Export/Import
- [ ] Activity log
- [ ] Rich text editor cho description

