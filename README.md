# TikTiok Theme - Next.js Version

Đây là phiên bản Next.js của theme WordPress TikTiok.

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Chạy development server:
```bash
npm run dev
```

3. Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

## Cấu trúc dự án

- `app/` - Next.js App Router
  - `page.tsx` - Trang chủ
  - `layout.tsx` - Layout chính
  - `api/` - API routes
- `components/` - React components
  - `tabs/` - Các tab components (Home, Products, Categories)
  - `ProductCard.tsx` - Component hiển thị sản phẩm
  - `ProductDetailModal.tsx` - Modal chi tiết sản phẩm
  - `CartSidebar.tsx` - Sidebar giỏ hàng
- `hooks/` - Custom React hooks
  - `useProductDetail.tsx` - Hook quản lý product detail modal

## Tính năng

- ✅ Tabs navigation (Trang chủ, Sản phẩm, Danh mục)
- ✅ Hiển thị sản phẩm nổi bật
- ✅ Hiển thị sản phẩm đề xuất
- ✅ Modal chi tiết sản phẩm với gallery
- ✅ Giỏ hàng với localStorage
- ✅ API routes cho products và categories

## Lưu ý

- API routes hiện đang sử dụng mock data. Cần kết nối với database thực tế.
- Cần cấu hình logo và thông tin shop trong `ShopHeader.tsx`
- Cần implement các tính năng như search, checkout, etc.

