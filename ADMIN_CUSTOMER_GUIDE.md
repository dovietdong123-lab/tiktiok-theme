
## 1. Đăng nhập & thoát ra

1. Mở trình duyệt và vào địa chỉ `https://<domain>/admin/login`.
2. Điền **Tên đăng nhập** và **Mật khẩu** được đội kỹ thuật cấp.
3. Sau khi đăng nhập, hệ thống lưu phiên làm việc trên trình duyệt. Khi kết thúc ca làm, bấm nút **Đăng xuất** (góc phải phía trên) để bảo vệ tài khoản.

> ⚠️ Nếu quên mật khẩu, hãy liên hệ đội kỹ thuật để chạy script `scripts/create-admin.js` đặt lại.

---

## 2. Giao diện tổng quan

Khu vực quản trị gồm 3 phần chính:

1. **Sidebar (bên trái)**: chứa các mục điều hướng – Dashboard, Sản phẩm, Danh mục, Thư viện ảnh, Đơn hàng, Mã giảm giá, Cài đặt.
2. **Header (trên cùng)**: hiển thị tên trang hiện tại, lời chào và nút Đăng xuất.
3. **Main Content**: nơi làm việc của từng trang (danh sách, biểu mẫu, bảng, v.v.).

Bạn có thể mở cùng lúc nhiều tab trình duyệt; mỗi tab tự kiểm tra đăng nhập trước khi hiển thị dữ liệu.

---

## 3. Quy trình quản lý sản phẩm

### 3.1 Xem danh sách
- Chọn **Sản phẩm** → `/admin/products`.
- Danh sách hiển thị ảnh, tên, giá bán, trạng thái. Bấm **Chỉnh sửa** để mở form hoặc thùng rác để xóa (xóa mềm, có thể khôi phục).
- Nút **+ Thêm sản phẩm mới** nằm góc phải phía trên danh sách.

### 3.2 Thêm / Sửa sản phẩm
Form gồm 5 nhóm:

1. **Thông tin cơ bản**: tên, slug (đường dẫn thân thiện, hệ thống tự tạo), giá bán, giá gốc, tồn kho. Discount % tự tính dựa trên giá.
2. **Hình ảnh**: chọn ảnh chính và gallery từ **Thư viện ảnh** hoặc dán URL. Có thể nhấn “Chọn từ thư viện” để mở popup media.
3. **Mô tả**: mô tả ngắn (văn bản ngắn) và mô tả chi tiết sử dụng trình soạn thảo rich text (chèn ảnh, định dạng chữ…).
4. **Thuộc tính & đánh giá**: thêm các thuộc tính như Size, Color cùng giá trị cụ thể; tạo review mẫu để hiển thị social proof.
5. **Cài đặt**: chọn danh mục, bật tắt trạng thái, đánh dấu “Sản phẩm nổi bật”.

Sau khi bấm **Lưu**, hệ thống hiển thị thông báo thành công và tự chuyển về danh sách.

### 3.3 Xóa sản phẩm
- Khi xóa, trạng thái chuyển sang `deleted`. Sản phẩm không còn hiển thị ở shop nhưng vẫn lưu trong DB để khôi phục sau này (liên hệ dev khi cần).

---

## 4. Quản lý danh mục

1. Vào **Danh mục** → `/admin/categories`.
2. Danh sách hiển thị tên, slug, trạng thái, ảnh minh họa.
3. Form thêm/sửa gồm: tên, slug, ảnh, danh mục cha (để trống nếu là gốc), mô tả, trạng thái.
4. Dùng danh mục cha/con để xây dựng menu dạng cây trong frontend.

---

## 5. Thư viện ảnh

Đây là nơi lưu tất cả ảnh sản phẩm, banner, logo…

### Chức năng chính
- **Tạo thư mục**: nhóm ảnh theo sản phẩm/bộ sưu tập.
- **Upload ảnh**: hỗ trợ kéo thả hoặc chọn file (PNG/JPG/WebP).
- **Chọn ảnh**: click vào ảnh để dùng cho sản phẩm, danh mục, settings.
- **Chọn nhiều ảnh**: bật chế độ multiple khi cần gắn nhiều hình vào gallery.
- **Xóa ảnh / thư mục**: đảm bảo ảnh không dùng trước khi xóa để tránh link hỏng.

> Khi upload ảnh mới, đường dẫn được sinh tự động (ví dụ `/uploads/<timestamp>-<random>.webp>`). Bạn có thể sao chép URL này để dùng ở nơi khác.

---

## 6. Quản lý đơn hàng

1. Vào **Đơn hàng** → `/admin/orders`.
2. Bộ lọc trạng thái nằm góc phải (Chờ xử lý, Đang xử lý, Đang giao, Đã giao, Đã hủy).
3. Bảng hiển thị thông tin khách, địa chỉ, danh sách sản phẩm, tổng tiền, giảm giá.
4. Để cập nhật trạng thái, chọn giá trị mới trong dropdown của từng đơn. Hệ thống lưu lại thời điểm cập nhật để tiện theo dõi.

> Gợi ý: Sau khi giao thành công, chuyển trạng thái sang “Đã giao” để bộ phận CSKH không gọi lại.

---

## 7. Mã giảm giá

1. Vào **Mã giảm giá** → `/admin/coupons`.
2. Bên trái là form tạo/cập nhật; bên phải là danh sách hiện có.
3. Thông tin cần nhập:
   - **Mã** (ví dụ SUMMER50) – có nút tạo ngẫu nhiên.
   - **Loại giảm**: theo phần trăm hoặc số tiền.
   - **Giá trị**: số phần trăm hoặc số tiền giảm.
   - **Đơn tối thiểu** (nếu muốn).
   - **Giới hạn số lần sử dụng**.
   - **Ngày hiệu lực** (có thể bỏ trống để dùng vô thời hạn).
   - **Trạng thái**: Active / Inactive.
4. Sau khi lưu, khách hàng có thể nhập mã tại bước Checkout của website.

---

## 8. Cài đặt cửa hàng

Trang **Cài đặt** cho phép bạn đổi logo, tên shop, hotline, email hỗ trợ, địa chỉ, link Facebook & TikTok, màu thương hiệu và banner trang chủ.

Quy trình:

1. Chỉnh sửa các trường văn bản theo nhu cầu.
2. Với logo/hero banner, hãy dùng nút **Chọn từ thư viện ảnh** để đảm bảo đúng URL.
3. Bấm **Lưu thay đổi**; thông báo thành công sẽ xuất hiện ở góc dưới.

> Những cài đặt này ảnh hưởng trực tiếp tới giao diện người dùng (header, footer, màu sắc). Nên tránh để trống logo hoặc hotline.

---

## 9. Kiểm tra & bảo trì định kỳ

| Hạng mục | Tần suất | Cách làm |
|----------|----------|----------|
| Đổi mật khẩu admin | 1–2 tháng/lần | Chạy script reset mật khẩu hoặc nhờ dev tạo user mới. |
| Sao lưu dữ liệu sản phẩm | Tháng | Xuất dữ liệu từ DB hoặc yêu cầu dev hỗ trợ. |
| Kiểm tra media rác | Tuần | Mở thư viện ảnh, xóa file không còn dùng. |
| Dọn giỏ hàng test | Khi kết thúc test | Trong Dashboard hoặc DB, xóa các đơn/giỏ hàng test để tránh thống kê sai. |

---

## 10. Khi gặp sự cố

- **Không đăng nhập được**: Kiểm tra lại URL, chắc chắn gõ đúng user/password. Nếu vẫn lỗi 401, hỏi đội kỹ thuật để kiểm tra token/middleware.
- **Không tải được danh sách**: Thử refresh trang. Nếu vẫn lỗi, chụp màn hình console (F12 → tab Console) gửi cho dev.
- **Không upload được ảnh**: Kiểm tra dung lượng (<5MB) và định dạng (png/jpg/webp). Nếu lỗi 500, có thể thư mục `public/uploads` chưa có quyền ghi – báo dev xử lý.
- **Đơn hàng không cập nhật**: Kiểm tra lại kết nối mạng, reload trang. Nếu dropdown bị mờ, nghĩa là bạn chưa đăng nhập hoặc phiên đã hết hạn.

---

Luôn đăng xuất sau khi hoàn thành công việc và giữ bí mật thông tin đăng nhập. Nếu cần thêm module hoặc chỉnh sửa giao diện, hãy mở ticket cho nhóm phát triển. Chúc bạn quản lý cửa hàng hiệu quả! 💼🛍️

