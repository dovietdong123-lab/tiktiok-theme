# Components Directory

Thư mục này chứa toàn bộ frontend components của ứng dụng.

## Quick Reference

| Component | Mô tả | Props | State |
|-----------|-------|-------|-------|
| `ShopHeader` | Header cửa hàng | - | - |
| `Tabs` | Navigation tabs | `activeTab`, `setActiveTab` | - |
| `ProductCard` | Card sản phẩm | `product`, `rank?`, `detailed?` | - |
| `ProductDetailModal` | Modal chi tiết | - | `product`, `currentImageIndex` |
| `CartSidebar` | Sidebar giỏ hàng | - | `cart`, `isEditMode` |
| `HomeTab` | Tab trang chủ | `isActive` | `featuredProducts`, `recommendedProducts` |
| `ProductsTab` | Tab sản phẩm | `isActive` | `products` |
| `CategoriesTab` | Tab danh mục | `isActive` | `categories` |

## Import Examples

```typescript
// Import component
import ShopHeader from '@/components/ShopHeader'
import ProductCard from '@/components/ProductCard'

// Import tab components
import HomeTab from '@/components/tabs/HomeTab'
```

## Component Guidelines

1. **Naming**: PascalCase cho component names
2. **Props**: TypeScript interfaces cho type safety
3. **State**: Sử dụng useState/useEffect cho local state
4. **Styling**: Tailwind CSS classes
5. **API**: Fetch trong useEffect với error handling

