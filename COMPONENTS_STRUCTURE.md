# Cấu trúc Components - Frontend Architecture

## Tổng quan

Toàn bộ frontend được tổ chức trong thư mục `components/` với cấu trúc rõ ràng và dễ bảo trì.

## Cấu trúc thư mục

```
components/
├── ShopHeader.tsx           # Header cửa hàng (logo, tên shop, nút tin nhắn)
├── Tabs.tsx                 # Navigation tabs (Trang chủ, Sản phẩm, Danh mục)
├── ProductCard.tsx          # Component hiển thị sản phẩm (2 modes: simple & detailed)
├── ProductDetailModal.tsx   # Modal chi tiết sản phẩm (gallery, tabs, reviews)
├── CartSidebar.tsx          # Sidebar giỏ hàng (danh sách, tổng tiền, checkout)
├── PopupCart.tsx           # Popup chọn variant và số lượng
└── tabs/                    # Các tab components
    ├── HomeTab.tsx          # Tab trang chủ (featured + recommended products)
    ├── ProductsTab.tsx      # Tab danh sách sản phẩm
    └── CategoriesTab.tsx    # Tab danh mục sản phẩm
```

## Chi tiết từng component

### 1. ShopHeader.tsx
**Chức năng:** Header của cửa hàng
- Hiển thị logo
- Tên cửa hàng
- Số lượng đã bán
- Nút "Tin nhắn"

**Props:** Không có
**State:** Không có

---

### 2. Tabs.tsx
**Chức năng:** Navigation tabs
- 3 tabs: Trang chủ, Sản phẩm, Danh mục
- Active state management
- Smooth transitions

**Props:**
```typescript
{
  activeTab: 'home' | 'products' | 'categories'
  setActiveTab: (tab) => void
}
```

---

### 3. ProductCard.tsx
**Chức năng:** Component hiển thị sản phẩm
- 2 modes: `simple` (cho HomeTab) và `detailed` (cho ProductsTab)
- Click để mở ProductDetailModal
- Hiển thị: ảnh, tên, giá, discount, rank (optional)

**Props:**
```typescript
{
  product: Product
  rank?: number           // Số thứ hạng (1, 2, 3)
  rankColor?: string     // Màu badge rank
  height?: string        // Chiều cao ảnh
  detailed?: boolean     // Mode chi tiết
}
```

**Features:**
- Lazy loading images
- Hover effects
- Responsive design

---

### 4. ProductDetailModal.tsx
**Chức năng:** Modal chi tiết sản phẩm
- Gallery với swipe navigation
- Tabs: Tổng quan, Đánh giá, Mô tả, Đề xuất
- Product info, variants, reviews
- Actions: Thêm vào giỏ, Mua ngay

**State Management:**
- Sử dụng `useProductDetail` hook
- Fetch data từ API `/api/products/[id]`
- Gallery navigation
- Tab navigation với scroll sync

**Features:**
- Image gallery với touch swipe
- Scroll-triggered tab navigation
- Expandable description
- Recommended products
- Reviews display

---

### 5. CartSidebar.tsx
**Chức năng:** Sidebar giỏ hàng
- Hiển thị danh sách sản phẩm trong giỏ
- Update quantity
- Remove items
- Edit mode với bulk actions
- Tính tổng tiền
- Checkout button

**State Management:**
- localStorage để lưu cart
- Event listener cho cart updates
- Real-time total calculation

**Features:**
- Empty state
- Quantity controls
- Bulk edit mode
- Checkout integration

---

### 6. PopupCart.tsx
**Chức năng:** Popup chọn variant và số lượng
- Hiển thị sản phẩm
- Chọn variants (size, color, etc.)
- Chọn số lượng
- Actions: Thêm vào giỏ / Mua ngay

**Status:** Placeholder (có thể implement sau)

---

### 7. HomeTab.tsx
**Chức năng:** Tab trang chủ
- Featured products (top 3 với rank)
- Recommended products (grid 2 columns)
- Skeleton loading states

**API Calls:**
- `/api/products/featured` - Featured products
- `/api/products/recommended` - Recommended products

**Features:**
- Lazy loading
- Skeleton states
- Error handling

---

### 8. ProductsTab.tsx
**Chức năng:** Tab danh sách sản phẩm
- Grid layout 2 columns
- Detailed product cards
- Skeleton loading

**API Calls:**
- `/api/products` - All products

**Features:**
- Infinite scroll (có thể thêm)
- Filter & search (có thể thêm)
- Skeleton loading

---

### 9. CategoriesTab.tsx
**Chức năng:** Tab danh mục
- List danh mục với ảnh
- Số lượng sản phẩm mỗi danh mục
- Click để filter products

**API Calls:**
- `/api/categories` - All categories

**Features:**
- Category count
- Empty state
- Click handler (có thể navigate)

---

## State Management

### Context API
- `ProductDetailProvider` - Quản lý ProductDetailModal state
  - `isOpen` - Modal open/close
  - `productId` - Current product ID
  - `openProductDetail(id)` - Open modal
  - `closeProductDetail()` - Close modal

### Local Storage
- `cart` - Giỏ hàng (JSON array)
- Auto-sync với CartSidebar

### Component State
- Mỗi component quản lý local state riêng
- API data fetching với `useState` + `useEffect`

---

## Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
API Call (/api/...)
    ↓
Database Query
    ↓
Response
    ↓
Update Component State
    ↓
Re-render UI
```

---

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Custom CSS** - Trong `app/globals.css`
  - Animations (flying product, cart shake, pulse)
  - Custom scrollbar
  - Tab transitions
  - Gallery styles

---

## Best Practices

### ✅ Đã áp dụng:
1. Component separation - Mỗi component có trách nhiệm rõ ràng
2. Reusable components - ProductCard có thể dùng nhiều nơi
3. TypeScript - Type safety
4. Error handling - Try/catch trong API calls
5. Loading states - Skeleton components
6. Responsive design - Mobile-first

### 🔄 Có thể cải thiện:
1. **Component splitting** - ProductDetailModal quá lớn, có thể tách:
   - `ProductGallery.tsx`
   - `ProductInfo.tsx`
   - `ProductTabs.tsx`
   - `ProductReviews.tsx`

2. **Custom hooks** - Tách logic ra hooks:
   - `useProducts.ts` - Fetch products
   - `useCart.ts` - Cart management
   - `useCategories.ts` - Fetch categories

3. **Error boundaries** - Thêm error boundaries cho error handling tốt hơn

4. **Performance** - Thêm:
   - React.memo cho components
   - useMemo, useCallback cho expensive operations
   - Virtual scrolling cho long lists

5. **Accessibility** - Thêm:
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

---

## Component Dependencies

```
app/page.tsx
├── ProductDetailProvider (Context)
├── ShopHeader
├── Tabs
├── HomeTab
│   └── ProductCard
├── ProductsTab
│   └── ProductCard
├── CategoriesTab
├── ProductDetailModal
│   └── useProductDetail (Hook)
├── CartSidebar
└── PopupCart
```

---

## API Integration

Tất cả components fetch data từ:
- `/api/products` - Products list
- `/api/products/featured` - Featured products
- `/api/products/recommended` - Recommended products
- `/api/products/[id]` - Product detail
- `/api/categories` - Categories list

---

## Next Steps

1. **Tách ProductDetailModal** thành sub-components
2. **Tạo custom hooks** cho data fetching
3. **Thêm error boundaries**
4. **Optimize performance** với React.memo
5. **Implement PopupCart** đầy đủ
6. **Thêm search & filter** functionality
7. **Thêm pagination** cho products list

