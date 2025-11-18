'use client'

import { useState, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'

interface HomeTabProps {
  isActive: boolean
}

interface Product {
  id: number
  slug: string
  name: string
  price: number
  regular: number
  discount: number
  image: string
  sold?: number
  created_at?: string
}

export default function HomeTab({ isActive }: HomeTabProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [storeName, setStoreName] = useState('TikTiok Shop')

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (response.ok && data.success && data.data?.storeName) {
          setStoreName(data.data.storeName)
        }
      } catch (error) {
        console.warn('Failed to load store settings', error)
      }
    }

    loadSettings()
  }, [])

  useEffect(() => {
    if (isActive) {
      loadFeaturedProducts()
      loadRecommendedProducts()
    }
  }, [isActive])

  const sortProductsByNewest = (items: Product[]) => {
    return [...items].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : a.id
      const dateB = b.created_at ? new Date(b.created_at).getTime() : b.id
      return dateB - dateA
    })
  }

  const loadFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products/featured')
      const data = await response.json()
      if (data.success) {
        setFeaturedProducts(sortProductsByNewest(data.data))
      }
    } catch (error) {
      console.error('Error loading featured products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendedProducts = async () => {
    try {
      const response = await fetch('/api/products/recommended')
      const data = await response.json()
      if (data.success) {
        setRecommendedProducts(sortProductsByNewest(data.data))
      }
    } catch (error) {
      console.error('Error loading recommended products:', error)
    }
  }

  if (!isActive) return null

  return (
    <div
      id="tab-home"
      className="transform translate-x-0 transition-transform duration-300 ease-in-out z-10"
    >
      <div className="p-4 overflow-y-auto h-full">
        {/* Featured Products */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold">Sản phẩm hàng đầu</h2>
          <span className="text-xs text-gray-500">{storeName}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 items-end" id="featured-products">
          {loading ? (
            // Skeleton loading
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="relative bg-white rounded-lg overflow-hidden shadow-sm p-2 flex flex-col"
                >
                  <span
                    className={`absolute top-1 left-1 ${
                      i === 1 ? 'bg-yellow-400' : i === 2 ? 'bg-gray-200' : 'bg-orange-400'
                    } text-white text-xs font-bold px-2 py-0.5 rounded`}
                  >
                    {i}
                  </span>
                  <div className="flex-1 flex items-end">
                    <div
                      className={`w-full ${
                        i === 1 ? 'h-36' : 'h-32'
                      } bg-gray-200 rounded animate-pulse`}
                    ></div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            featuredProducts.map((product, index) => {
              const rankColors = ['bg-yellow-400', 'bg-gray-200', 'bg-orange-400']
              const heights = ['h-32', 'h-36', 'h-32']
              const rank = index + 1
              const color = rankColors[index] || 'bg-gray-400'
              const height = heights[index] || 'h-32'

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  rank={rank}
                  rankColor={color}
                  height={height}
                />
              )
            })
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center my-6 gap-3">
          <div className="w-12 h-[3px] bg-gradient-to-r from-transparent to-pink-500"></div>
          <span className="font-bold text-lg text-black">Đề xuất cho bạn</span>
          <div className="w-12 h-[3px] bg-gradient-to-l from-transparent to-pink-500"></div>
        </div>

        {/* Recommended Products */}
        <div id="product-list-home" className="grid grid-cols-2 gap-2 items-end">
          {loading ? (
            // Skeleton loading
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="skeleton-card relative bg-white rounded-lg overflow-hidden shadow-sm p-2 flex flex-col"
                >
                  <div className="flex-1 flex items-end">
                    <div className="w-full h-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            recommendedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

