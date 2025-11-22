'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { generateProductStats } from '@/utils/productStats'
import { getDisplayPricing } from '@/utils/productPricing'
import MediaDisplay from '@/components/MediaDisplay'

interface Product {
  id: number
  slug?: string
  name: string
  price?: number
  regular?: number
  regular_price?: number
  discount?: number
  image: string
  sold?: number
  variants?: Array<{
    price?: number
    regular?: number
    discount?: number
  }>
  attributes?: any
}

interface ProductCardProps {
  product: Product
  rank?: number
  rankColor?: string
  height?: string
  detailed?: boolean
}

export default function ProductCard({
  product,
  rank,
  rankColor,
  height = 'h-48',
  detailed = false,
}: ProductCardProps) {
  const router = useRouter()
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || ''
  const statsSeed = product.id ?? product.slug ?? product.name
  const listStats = useMemo(() => generateProductStats(statsSeed), [statsSeed])
  const pricing = useMemo(() => getDisplayPricing(product), [product])

const getImageUrl = (src: string) => {
  if (!src) return ''
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }

  if (!baseUrl) {
    return src
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const normalizedPath = src.startsWith('/') ? src : `/${src}`
  return `${normalizedBase}${normalizedPath}`
}

const formatCurrency = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

  const handleClick = () => {
    // Navigate to product detail page with route
    const targetSlug = product.slug || String(product.id)
    const encodedSlug = encodeURIComponent(targetSlug)
    router.push(`/products/${encodedSlug}`)
  }

  if (detailed) {
    return (
      <div
        className="border rounded-md overflow-hidden shadow-sm view-detail-btn product-card cursor-pointer hover:shadow-md transition-shadow"
        data-id={product.id}
        onClick={handleClick}
      >
        <div className="relative">
          <MediaDisplay
            url={getImageUrl(product.image)}
            alt={product.name}
            className="w-full h-48 object-cover"
            autoPlay={true}
          />
          {pricing.discount > 0 && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
              -{pricing.discount}%
            </span>
          )}
        </div>
        <div className="p-2">
          <h3 className="text-xs font-medium line-clamp-2">{product.name}</h3>
          <div className="space-y-1 mt-1">
            <span className="text-red-600 font-bold text-sm">{formatCurrency(pricing.price)}</span>
            {pricing.regular > pricing.price && (
              <div className="text-gray-400 line-through text-xs">{formatCurrency(pricing.regular)}</div>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-1 text-xs">
            <span className="bg-green-100 text-green-600 px-1 rounded">Freeship</span>
            <span className="bg-gray-100 text-gray-600 px-1 rounded">COD</span>
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <span className="text-yellow-500 mr-1">★</span> {listStats.rating}
            <span className="ml-2">Đã bán {listStats.soldLabel}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="product-card relative bg-white rounded-lg overflow-hidden shadow-sm p-2 flex flex-col cursor-pointer hover:shadow-md transition-shadow"
      data-id={product.id}
      onClick={handleClick}
    >
      {rank && (
        <span
          className={`absolute top-1 left-1 ${rankColor} text-white text-xs font-bold px-2 py-0.5 rounded`}
        >
          {rank}
        </span>
      )}
      <div className="flex-1 flex items-end relative">
        <MediaDisplay
          url={getImageUrl(product.image)}
          alt={product.name}
          className={`w-full ${height} object-cover rounded`}
          autoPlay={true}
        />
        {pricing.discount > 0 && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
            -{pricing.discount}%
          </span>
        )}
      </div>
      <div className="mt-2 space-y-1">
        <h3 className="text-xs font-medium line-clamp-2 leading-snug">{product.name}</h3>
        <div className="text-red-600 font-semibold text-sm">{formatCurrency(pricing.price)}</div>
        {pricing.regular > pricing.price && (
          <div className="text-gray-500 line-through text-[11px]">{formatCurrency(pricing.regular)}</div>
        )}
        <div className="flex items-center text-xs text-gray-500">
          <span className="text-yellow-500 mr-1">★</span>
          {listStats.rating}
          <span className="ml-2">Đã bán {listStats.soldLabel}</span>
        </div>
      </div>
    </div>
  )
}

