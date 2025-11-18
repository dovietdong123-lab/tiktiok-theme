# Admin Logic Issues & Fixes

## ✅ Đã đúng

1. **Authentication**: Tất cả routes đều có authentication check
2. **SQL Injection Protection**: Tất cả queries đều dùng parameterized queries
3. **Error Handling**: Có try-catch và error messages
4. **Validation cơ bản**: Có validate required fields

## ⚠️ Vấn đề cần sửa

### 1. **Products - Reviews Update Logic** (Nghiêm trọng)
**File**: `app/api/admin/products/[id]/route.ts`

**Vấn đề**: 
- Dòng 169: Xóa TẤT CẢ reviews trước khi insert lại
- Nếu insert reviews fail, sẽ mất hết reviews cũ
- Không có transaction để đảm bảo atomicity

**Giải pháp**: 
- Dùng transaction
- Hoặc chỉ update/insert reviews thay đổi thay vì xóa hết

### 2. **Coupons - Hard Delete** (Nghiêm trọng)
**File**: `app/api/admin/coupons/[id]/route.ts`

**Vấn đề**:
- Dòng 167: Dùng `DELETE` thay vì soft delete
- Mất dữ liệu vĩnh viễn, không thể khôi phục
- Có thể ảnh hưởng đến orders đã dùng coupon

**Giải pháp**:
- Dùng soft delete: `UPDATE discount_coupons SET status = 'inactive' WHERE id = ?`
- Hoặc thêm cột `deleted_at`

### 3. **Validation thiếu**
**Files**: `app/api/admin/products/route.ts`, `app/api/admin/categories/route.ts`

**Vấn đề**:
- Không validate `price > 0`
- Không validate `stock >= 0`
- Không validate `discount >= 0 && discount <= 100`
- Không validate `category_id` tồn tại

**Giải pháp**: Thêm validation cho các trường này

### 4. **Settings Authentication Inconsistency**
**File**: `app/api/admin/settings/route.ts`

**Vấn đề**:
- Dùng custom token verification thay vì `requireAuth()`
- Không consistent với các routes khác
- GET không có authentication (có thể OK nếu là public settings)

**Giải pháp**: 
- Nếu settings là public, OK
- Nếu cần auth, dùng `requireAuth()` như các routes khác

### 5. **Products - Gallery JSON Handling**
**File**: `app/api/admin/products/route.ts`, `app/api/admin/products/[id]/route.ts`

**Vấn đề**:
- Gallery được lưu trực tiếp, không validate format
- Nếu gallery là array, cần stringify trước khi lưu

**Giải pháp**: 
- Validate và stringify gallery nếu là array

### 6. **Categories - Parent ID Validation**
**File**: `app/api/admin/categories/[id]/route.ts`

**Vấn đề**:
- Không validate `parent_id` tồn tại
- Có thể tạo circular reference (category là parent của chính nó)

**Giải pháp**:
- Validate parent_id tồn tại
- Kiểm tra circular reference

### 7. **Orders - Status Update Validation**
**File**: `app/api/admin/orders/[id]/route.ts`

**Vấn đề**: 
- Không validate status transition (ví dụ: không thể chuyển từ "delivered" về "pending")
- Không có audit log

**Giải pháp**: 
- Thêm validation cho status transitions
- Có thể thêm audit log table

### 8. **Number Parsing**
**Files**: Nhiều files

**Vấn đề**:
- Một số nơi dùng `parseInt()` không có validation
- Có thể return `NaN` nếu input không hợp lệ

**Giải pháp**: 
- Kiểm tra `Number.isNaN()` sau khi parse
- Hoặc dùng helper function như `parseNumber()` trong coupons

## 📋 Đề xuất cải thiện

1. **Transaction cho operations phức tạp**:
   - Products update (với reviews)
   - Orders update
   - Categories với parent relationships

2. **Soft Delete cho tất cả entities**:
   - Products: Đã có (status = 'deleted')
   - Categories: Đã có (status = 'deleted')
   - Coupons: Chưa có
   - Orders: Không nên xóa, chỉ cancel

3. **Validation helper functions**:
   - `validateProduct(data)`
   - `validateCategory(data)`
   - `validateCoupon(data)`

4. **Consistent error messages**:
   - Dùng constants cho error messages
   - Format nhất quán

5. **Audit Log**:
   - Log tất cả admin actions
   - Track who did what and when

