# Hướng dẫn sử dụng TikTiok Shop (Frontend)

Tài liệu này dành cho người mua hàng trực tiếp trên giao diện Next.js của TikTiok Shop. Làm theo từng bước bên dưới để duyệt sản phẩm, thêm vào giỏ, áp dụng mã giảm giá và hoàn tất đơn hàng.

---

## 1. Bắt đầu
1. Mở trình duyệt và truy cập địa chỉ được đội kỹ thuật cung cấp.
2. Đợi giao diện chính tải xong; bạn sẽ thấy header cửa hàng cùng các tab điều hướng.

---

## 2. Duyệt và tìm sản phẩm
- Các tab chính gồm **Trang chủ**, **Sản phẩm**, **Danh mục**. Mỗi tab hiển thị nguồn dữ liệu tương ứng (sản phẩm nổi bật, toàn bộ catalog, hoặc phân loại). Chuyển tab bằng cách chạm/lướt như TikTok feed hoặc bấm trực tiếp vào tiêu đề tab.
- Trên Trang chủ, kéo xuống để xem danh sách video-card sản phẩm; ở tab Sản phẩm/Danh mục, danh sách ở dạng lưới giúp bạn lọc nhanh hơn.

**Mẹo:** Mỗi card sản phẩm hiển thị giá hiện tại, giá gốc (gạch ngang nếu đang giảm), huy hiệu giảm giá và thống kê bán chạy/đánh giá sao. Các chỉ số này giúp bạn đánh giá nhanh sản phẩm nào đang hot.

---

## 3. Xem chi tiết sản phẩm
1. Click/nhấn vào bất kỳ card sản phẩm nào để mở trang chi tiết (`/products/[slug]`).  
2. Tại trang chi tiết:
   - Xem gallery ảnh, mô tả dài, thông tin tồn kho hoặc các thuộc tính (màu sắc/kích thước).
   - Chọn biến thể nếu có (ví dụ Size, Màu). Một số sản phẩm hỗ trợ ảnh riêng cho từng biến thể.
   - Bấm **Thêm vào giỏ** để lưu trong giỏ hàng, hoặc **Mua ngay** để chuyển thẳng tới màn hình thanh toán với sản phẩm hiện tại.

---

## 4. Quản lý giỏ hàng
TikTiok Shop dùng các thành phần `CartOverlay`/`CartSidebar` để giúp bạn kiểm soát giỏ ở bất kỳ trang nào:

1. **Mở giỏ:** Bấm biểu tượng giỏ hoặc thanh thông báo “X sản phẩm” ở góc phải.  
2. **Điều chỉnh số lượng:**  
   - Nhấn nút `+`/`-` để tăng giảm.  
   - Hệ thống bảo đảm mỗi dòng có tối thiểu 1 sản phẩm và đồng bộ cùng server.  
3. **Xóa sản phẩm:** Nhấn biểu tượng thùng rác trên từng dòng.  
4. **Đồng bộ thiết bị:** Giỏ được lưu cả trên server và localStorage, nên bạn có thể đóng trình duyệt và tiếp tục sau đó.  
5. **Mở thanh toán:** Bấm **Thanh toán** để mở `CheckoutOverlay`.

---

## 5. Áp dụng mã giảm giá
Trong `CheckoutOverlay`, mục “Mã giảm giá” cho phép nhập mã do cửa hàng cung cấp:

1. Nhập mã, nhấn **Áp dụng**.  
2. Nếu hợp lệ, bạn sẽ thấy thông báo thành công kèm số tiền giảm.  
3. Có thể bấm **Gỡ mã** để quay lại giá gốc và thử mã khác.  
4. Mã giảm giá chỉ áp dụng khi giỏ có sản phẩm và thỏa điều kiện đơn tối thiểu (nếu được cấu hình ở trang quản trị).

---

## 6. Thanh toán
`CheckoutOverlay` là bước cuối để tạo đơn hàng. Bạn có thể mở nó từ giỏ hoặc nút “Mua ngay”.

1. **Kiểm tra danh sách sản phẩm:**  
   - Hình ảnh, tên, phân loại, số lượng và tổng tiền của từng dòng.  
   - Có thể tiếp tục chỉnh số lượng ngay trong overlay.
2. **Điền thông tin giao hàng:**  
   - Tên khách (tối thiểu 2 ký tự).  
   - Số điện thoại (9–11 chữ số).  
   - Địa chỉ (tối thiểu 5 ký tự, gồm số nhà + phường xã + quận/huyện).  
   - Nếu sai định dạng, ô lỗi sẽ cảnh báo màu đỏ.
3. **Xem tổng kết đơn:**  
   - Tạm tính, mã giảm giá (nếu có) và tổng phải trả.  
   - Đồng hồ đếm ngược nhắc bạn hoàn tất sớm để giữ ưu đãi.
4. **Gửi đơn:**  
   - Bấm **Đặt hàng ngay**.  
   - Nếu thành công, hệ thống hiển thị modal cảm ơn kèm mã đơn, đồng thời reset giỏ hàng.
5. **Đóng overlay:**  
   - Dùng nút `X` hoặc bấm ngoài overlay.  
   - Khi quay lại trang trước, overlay sẽ không chạy animation dài để thao tác nhanh hơn.

---

## 7. Theo dõi sau đặt hàng
- Sau khi đặt đơn, đội vận hành sẽ thấy đơn trong `/admin/orders`.  
- Bạn sẽ nhận được liên hệ qua số điện thoại đã cung cấp để xác nhận và giao hàng.  
- Nếu cần sửa địa chỉ/reorder, hãy giữ lại mã đơn xuất hiện ở modal cảm ơn và gửi cho bộ phận hỗ trợ.

---

## 8. Tips & xử lý lỗi thường gặp
| Tình huống | Cách xử lý |
|------------|-----------|
| Không áp dụng được mã giảm giá | Kiểm tra lại chính tả, đảm bảo giỏ thỏa điều kiện đơn tối thiểu, hoặc mã chưa hết hạn. |
| Nút Thanh toán không phản hồi | Kiểm tra lại các ô thông tin giao hàng đã được điền đúng định dạng; lỗi sẽ hiện ngay dưới từng ô. |
| Dữ liệu giỏ không cập nhật | Thử refresh trang; nếu vẫn lỗi hãy xóa cache trình duyệt và thử lại, hoặc đăng nhập lại nếu bạn đang dùng tài khoản có đồng bộ server. |

---

## 9. Thuật ngữ
- **Direct checkout**: Mua ngay một sản phẩm mà không cần thêm vào giỏ (hữu ích khi chạy quảng cáo).  
- **Cart overlay**: Giao diện nổi cho phép xem giỏ trên mọi trang.  
- **Checkout overlay**: Màn hình nhập thông tin đặt hàng cuối cùng.  
- **Coupon**: Mã giảm giá dạng phần trăm hoặc số tiền cố định.

---

Chúc bạn mua sắm vui vẻ! Nếu cần hỗ trợ thêm, hãy liên hệ bộ phận CSKH của cửa hàng.

