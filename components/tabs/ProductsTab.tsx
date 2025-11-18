'use client'

import { useState, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'

interface ProductsTabProps {
  isActive: boolean
  selectedCategoryId?: number | null
  selectedCategoryName?: string | null
  onClearCategory?: () => void
}

interface Product {
  id: number
  slug: string
  name: string
  price: number
  regular_price?: number
  discount?: number
  image: string
  sold?: number
}

export default function ProductsTab({
  isActive,
  selectedCategoryId,
  selectedCategoryName,
  onClearCategory,
}: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isActive) {
      loadProducts(selectedCategoryId)
    }
  }, [isActive, selectedCategoryId])

  const loadProducts = async (categoryId?: number | null) => {
    try {
      setLoading(true)
      let url = '/api/products'
      if (categoryId) {
        url += `?category=${encodeURIComponent(String(categoryId))}`
      }
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isActive) {
    return (
      <div
        id="tab-products"
        className="transform translate-x-full transition-transform duration-300 ease-in-out opacity-0 pointer-events-none"
      ></div>
    )
  }

  return (
    <div
      id="tab-products"
      className="transform translate-x-0 transition-transform duration-300 ease-in-out z-10"
    >
      <div className="p-4 overflow-y-auto h-full">
        {selectedCategoryId && (
          <div className="flex items-center justify-between mb-4 text-sm bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
            <div>
              Đang xem danh mục:{' '}
              <span className="font-medium text-gray-800">{selectedCategoryName || 'Không xác định'}</span>
            </div>
            <button
              type="button"
              onClick={onClearCategory}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              Xóa lọc
            </button>
          </div>
        )}
        <div id="product-list" className="grid grid-cols-2 gap-4">
          {loading ? (
            // Skeleton loading
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="skeleton-card border rounded-md overflow-hidden shadow-sm"
                >
                  <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                  <div className="p-2 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="flex space-x-2">
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  regular: product.regular_price,
                  discount: product.discount,
                  image: product.image,
                  sold: product.sold,
                }}
                detailed={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

