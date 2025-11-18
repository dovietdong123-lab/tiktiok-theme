# Phân tích Logic: Giỏ hàng, Mã giảm giá, Thanh toán

## ✅ Điểm tốt

1. **Order Creation với Transaction**: Sử dụng database transaction để đảm bảo atomicity
2. **Coupon Race Condition**: Đã xử lý bằng transaction và WHERE clause trong UPDATE
3. **Coupon Date Validation**: Dùng database `NOW()` để tránh timezone issues
4. **Coupon Code Normalization**: Uppercase và trim để đảm bảo consistency
5. **Input Validation**: Validate đầy đủ customer info và cart items

## ✅ Đã sửa

### 1. ✅ **CartSidebar: "Xóa đã chọn" không gọi API** - ĐÃ SỬA

**File**: `components/CartSidebar.tsx:299-332`

**Đã sửa**: 
- Gọi API POST với items rỗng khi xóa tất cả
- Xóa từng item đã chọn bằng `removeFromCart` với productId+variant
- Loại bỏ `localStorage` (không dùng nữa)

---

### 2. ✅ **CartSidebar: updateQuantity và removeFromCart dùng index** - ĐÃ SỬA

**File**: `components/CartSidebar.tsx:72-147`

**Đã sửa**: 
- `updateQuantity` dùng PUT endpoint với `productId + variant`
- `removeFromCart` dùng DELETE endpoint với `productId + variant`
- Thêm optimistic update và rollback khi lỗi
- Interface CartItem đã được cập nhật để match với API (thêm `productId`, `productName`, `variant`)

---

### 3. ✅ **CheckoutOverlay: updateQuantity dùng index** - ĐÃ SỬA

**File**: `components/CheckoutOverlay.tsx:169-233`

**Đã sửa**: 
- Tìm item bằng `productId + variant` thay vì index
- Thêm rollback khi lỗi
- Giữ nguyên logic cho `directProduct` (chỉ update local state)

---

### 4. ✅ **Cart API DELETE: dùng index thay vì productId+variant** - ĐÃ SỬA

**File**: `app/api/cart/route.ts:213-275`

**Đã sửa**: 
- DELETE endpoint nhận `productId` và `variant` từ query params
- Dùng `normalizeVariant` để match variant đúng cách
- Hỗ trợ xóa toàn bộ giỏ hàng nếu không có `productId`

---

## ❌ Vấn đề còn lại

---

### 5. **Cart lưu trong memory - sẽ mất khi server restart**

**File**: `app/api/cart/route.ts:21`

```typescript
const carts = new Map<string, CartItem[]>()
```

**Vấn đề**: 
- Cart lưu trong memory, sẽ mất khi:
  - Server restart
  - Vercel function cold start
  - Multiple server instances (không share state)

**Giải pháp**: 
- Option 1: Lưu vào database (bảng `cart_sessions`)
- Option 2: Dùng Redis (tốt nhất cho production)
- Option 3: Lưu vào cookie (giới hạn size)

**Ưu tiên**: Nên migrate sang database hoặc Redis

---

### 6. **CheckoutOverlay: Coupon validation trước submit**

**File**: `components/CheckoutOverlay.tsx:326-355`

**Vấn đề**: 
- Coupon được validate khi apply, nhưng không re-validate khi submit
- Nếu coupon hết hạn giữa lúc apply và submit, vẫn dùng được

**Giải pháp**: 
- Order API đã validate lại coupon trong transaction (tốt)
- Nhưng nên show error message rõ ràng hơn nếu coupon invalid khi submit

---

### 7. **CartSidebar: Checkbox "Xóa đã chọn" không hoạt động**

**File**: `components/CartSidebar.tsx:192-198, 252-259`

**Vấn đề**: 
- Có checkbox cho từng item, nhưng logic xóa không check checkbox nào được chọn
- "Xóa đã chọn" xóa tất cả, không phải chỉ item đã chọn

**Sửa**: Cần track selected items và chỉ xóa những item đã chọn

---

## 🔍 Logic đúng cần giữ

1. ✅ **Order Transaction**: Đảm bảo order + items + coupon update trong 1 transaction
2. ✅ **Coupon Race Condition**: WHERE clause trong UPDATE ngăn over-usage
3. ✅ **Coupon Date Check**: Dùng database NOW() để tránh timezone issues
4. ✅ **Input Validation**: Validate đầy đủ trước khi tạo order
5. ✅ **Final Amount Calculation**: `Math.max(0, subtotal - discountAmount)` đúng

---

## 📋 Ưu tiên sửa

1. **Cao**: CartSidebar "Xóa đã chọn" không gọi API
2. **Cao**: CartSidebar và CheckoutOverlay dùng index thay vì productId+variant
3. **Trung bình**: Cart API DELETE dùng index
4. **Trung bình**: Cart lưu trong memory (cần database/Redis)
5. **Thấp**: Checkbox "Xóa đã chọn" không hoạt động đúng

