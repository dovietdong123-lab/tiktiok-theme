'use client'

import { useState, useEffect, useRef } from 'react'
import { useProductDetail } from '@/hooks/useProductDetail'
import CartOverlay from '@/components/CartOverlay'
import CheckoutOverlay from '@/components/CheckoutOverlay'

interface Product {
  id: number
  name: string
  price: number
  regular: number
  discount: number
  image: string
  gallery: string[]
  description: string
  recommended?: Product[]
  reviews?: Review[]
  variants?: Variant[]
  coupons?: Coupon[]
}

interface Review {
  id?: number
  content: string
  rating: number
  user_name?: string
  avatar?: string
  created_at?: string
}

interface Variant {
  label: string
  value: string
  price: number
  regular: number
  discount: number
  image?: string
}

interface Coupon {
  id: number
  code: string
  description?: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order_amount?: number | null
  end_date?: string | null
}

export default function ProductDetailModal() {
  const { isOpen, productId, closeProductDetail } = useProductDetail()
  const [product, setProduct] = useState<Product | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('tongquan')
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [tabNavVisible, setTabNavVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [flashCountdown, setFlashCountdown] = useState(27099)
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [copyToast, setCopyToast] = useState({ visible: false, message: '' })

  const renderLoadingSkeleton = () => (
    <div className="p-4 space-y-6">
      <div className="w-full aspect-square bg-gray-200 rounded-lg animate-pulse" />
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
      </div>
      <div className="bg-white rounded shadow p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="bg-white rounded shadow p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
        ))}
      </div>
    </div>
  )

  // Load cart count on mount and when cart updates
  useEffect(() => {
    const loadCartCount = async () => {
      try {
        const response = await fetch('/api/cart')
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          const total = data.data.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
          setCartCount(total)
          // Update all cart-count elements
          const cartCountElements = document.getElementsByClassName('cart-count')
          for (let i = 0; i < cartCountElements.length; i++) {
            cartCountElements[i].textContent = String(total)
          }
        }
      } catch (error) {
        console.error('Error loading cart count:', error)
      }
    }

    loadCartCount()

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCartCount()
    }
    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  useEffect(() => {
    if (isOpen && productId) {
      // Kiểm tra xem có phải là quay lại từ back button không
      const isBackNavigation = sessionStorage.getItem('product_modal_back') === 'true'
      
      setIsClosing(false)
      loadProductDetail(productId)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
      
      if (isBackNavigation) {
        // Nếu là back navigation, không animate
        sessionStorage.removeItem('product_modal_back')
        setIsAnimating(false)
      } else {
        // Nếu là lần đầu mở, có animation
        setIsAnimating(true)
        const timer = setTimeout(() => {
          setIsAnimating(false)
        }, 50)
        return () => clearTimeout(timer)
      }
    } else {
      setIsAnimating(true)
      setIsClosing(false)
    }
  }, [isOpen, productId])

  useEffect(() => {
    if (!isOpen) return
    setFlashCountdown(27099)
    const interval = setInterval(() => {
      setFlashCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen, product?.id])

  useEffect(() => {
    if (!copyToast.visible) return
    const timer = setTimeout(() => {
      setCopyToast((prev) => ({ ...prev, visible: false }))
    }, 2000)
    return () => clearTimeout(timer)
  }, [copyToast.visible])

  const formatCountdown = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const pad = (num: number) => String(num).padStart(2, '0')
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }

  const handleClose = () => {
    // Đánh dấu là back navigation để trang cũ không animate
    sessionStorage.setItem('product_modal_back', 'true')
    setIsClosing(true)
    setIsAnimating(true)
    // Wait for animation to complete before closing
    setTimeout(() => {
      closeProductDetail()
    }, 300)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      setTabNavVisible(container.scrollTop > 50)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const loadProductDetail = async (id: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${id}`)
      const data = await response.json()
      if (data.success) {
        setProduct(data.data)
        if (Array.isArray(data.data.coupons)) {
          setAvailableCoupons(data.data.coupons)
        } else {
          setAvailableCoupons([])
        }
        setCurrentImageIndex(0)
      }
    } catch (error) {
      console.error('Error loading product detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return Number(price).toLocaleString('vi-VN') + 'đ'
  }

  const nextImage = () => {
    if (product && currentImageIndex < product.gallery.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  if (!isOpen && !isClosing) return null

  return (
    <div
      id="tab-content-product-detail"
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 w-full max-w-[500px] pc mx-auto transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div
        id="content--product-detail"
        className={`absolute top-0 right-0 w-full h-full bg-white flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
          isAnimating || isClosing ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center flex-1 space-x-2">
              <button className="text-xl hover:text-gray-600" onClick={handleClose}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="relative w-[100%]">
                <input
                  id="searchInput"
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  className="w-full block px-3 py-1 border rounded-md text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-2">
              <button className="text-xl">&#10150;</button>
              <button
                id="showCartBtn"
                onClick={() => setShowCart(true)}
                className="text-xl relative"
              >
                🛒
                <span
                  id="cartBadgeq"
                  className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full cart-count"
                >
                  {cartCount}
                </span>
              </button>
              <button className="text-xl">&#8942;</button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            className={`tab-navigation sticky top-0 bg-white z-10 ${
              tabNavVisible ? 'visible' : ''
            }`}
          >
            <div className="flex items-center justify-between text-sm font-medium border-b bg-white">
              <a
                className={`tab-link px-4 py-2 border-b-2 border-transparent ${
                  activeTab === 'tongquan' ? 'active' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('tongquan')}
              >
                Tổng quan
              </a>
              <a
                className={`tab-link px-4 py-2 border-b-2 border-transparent ${
                  activeTab === 'danhgia' ? 'active' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('danhgia')}
              >
                Đánh giá
              </a>
              <a
                className={`tab-link px-4 py-2 border-b-2 border-transparent ${
                  activeTab === 'mota' ? 'active' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('mota')}
              >
                Mô tả
              </a>
              <a
                className={`tab-link px-4 py-2 border-b-2 border-transparent ${
                  activeTab === 'dexuat' ? 'active' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('dexuat')}
              >
                Đề xuất
              </a>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto" id="scrollable-container" ref={scrollContainerRef}>
          {loading ? (
            renderLoadingSkeleton()
          ) : product ? (
            <>
              {/* Tổng quan Section */}
              <section id="tongquan" className="section">
                {/* Gallery */}
                <div
                  id="gallery-container"
                  className="w-full aspect-square overflow-hidden relative"
                  style={{ aspectRatio: '1 / 1' }}
                >
                  <div
                    id="gallery-slide"
                    className="flex h-full transition-transform duration-300 ease-in-out"
                    style={{
                      transform: `translateX(-${currentImageIndex * 100}%)`,
                    }}
                  >
                    {product.gallery.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={product.name}
                        className="w-full h-full min-h-full object-cover flex-shrink-0 min-w-full block"
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                      />
                    ))}
                  </div>

                  {product.gallery.length > 1 && (
                    <>
                      <button
                        id="prevBtn"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 py-1 rounded-full"
                        onClick={prevImage}
                      >
                        ‹
                      </button>
                      <button
                        id="nextBtn"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 py-1 rounded-full"
                        onClick={nextImage}
                      >
                        ›
                      </button>
                      <div
                        id="counter"
                        className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
                      >
                        {currentImageIndex + 1}/{product.gallery.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Price */}
                <div
                  id="price"
                  className="w-full bg-gradient-to-r from-pink-600 to-orange-500 text-white px-4 py-2 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm">
                      Từ <span className="text-2xl font-bold text-white">{formatPrice(product.price)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="line-through opacity-80">{formatPrice(product.regular)}</span>
                      <span className="bg-white text-pink-600 font-bold px-1 rounded">
                        -{product.discount}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">Flash Sale của shop</div>
                    <div className="text-xs">
                      Kết thúc sau <span className="countdown font-mono">{formatCountdown(flashCountdown)}</span>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="w-full max-w-md mx-auto bg-white p-4 rounded shadow">
                  <div>
                    <span className="bg-black text-white text-xs px-1 py-0.5 rounded">Mall</span>
                    <span className="text-sm font-medium title">{product.name}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                    <span className="text-yellow-500 font-semibold">★ 4.9</span>
                    <span>(6,5K)</span>
                    <span>|</span>
                    <span>Đã bán 96.6K</span>
                  </div>

                  <div className="mt-3 text-xs">
                    <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded">
                      Miễn phí vận chuyển
                    </span>
                    <span className="ml-2">Đảm bảo giao hàng sau 2-3 ngày</span>
                    <div className="mt-1 text-gray-500">
                      Nhận voucher ít nhất 15Kđ nếu đơn giao trễ
                    </div>
                    <div className="mt-1 line-through text-gray-400">Phí vận chuyển: 34.000đ</div>
                  </div>

                  <div className="mt-3 text-xs text-gray-700">
                    Thanh toán khi giao. Trả hàng miễn phí trong 15 ngày
                  </div>

                  <div className="flex items-center justify-between mt-3 border p-2 rounded">
                    <div className="flex items-center gap-2" id="option-product">
                      {/* Variants will be rendered here */}
                    </div>
                  </div>

                  <div className="mt-3 bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-700 rounded">
                    🔥 Sản phẩm hot • Mỹ phẩm dưỡng da skin care chính hãng
                  </div>

                  <div className="mt-3">
                    <div className="font-medium text-sm mb-2">Voucher & Khuyến mãi</div>
                    <div className="flex flex-col gap-2 text-xs text-gray-700">
                      {availableCoupons.length > 0 ? (
                        availableCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="border border-dashed border-pink-300 rounded px-3 py-2 flex items-center justify-between gap-3 bg-pink-50"
                          >
                            <div>
                              <div className="font-semibold text-pink-600">
                                {coupon.code} •{' '}
                                {coupon.discount_type === 'percent'
                                  ? `${coupon.discount_value}%`
                                  : `${coupon.discount_value.toLocaleString('vi-VN')}₫`}
                              </div>
                              <div className="text-gray-500">
                                {coupon.description || 'Áp dụng cho đơn phù hợp'}
                              </div>
                              {coupon.end_date && (
                                <div className="text-[11px] text-gray-400">
                                  HSD: {new Date(coupon.end_date).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </div>
                            <button
                              className="bg-pink-500 text-white px-2 py-1 rounded text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(coupon.code).then(() =>
                                  setCopyToast({ visible: true, message: `Đã sao chép mã ${coupon.code}` })
                                )
                              }}
                            >
                              Sao chép
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded px-3 py-2 text-gray-400">
                          Chưa có mã giảm giá cho sản phẩm này
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Đánh giá Section */}
              <section id="danhgia" className="section">
                <div className="w-full max-w-md mx-auto bg-white p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold tetext-gray-800 text-sm">
                      Đánh giá của khách hàng
                    </h2>
                    <a href="#" className="text-blue-500 text-xs">
                      Xem thêm &gt;
                    </a>
                  </div>

                  {product?.reviews && product.reviews.length > 0 ? (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {(
                              product.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
                              product.reviews.length
                            ).toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">/5</div>
                          <div className="flex text-yellow-400 text-xs mt-1">
                            {'★'.repeat(
                              Math.round(
                                product.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
                                  product.reviews.length
                              )
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-600">
                            {product.reviews.length} đánh giá
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {product.reviews.map((review: any) => (
                          <div key={review.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden text-xs font-bold text-gray-500">
                                  {review.avatar ? (
                                    <img src={review.avatar} alt={review.user_name || 'avatar'} className="w-full h-full object-cover" />
                                  ) : (
                                    (review.user_name?.charAt(0).toUpperCase() || 'U')
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-sm text-gray-800">
                                    {review.user_name || 'Khách hàng'}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <div className="flex text-yellow-400">
                                      {'★'.repeat(review.rating || 0)}
                                      {'☆'.repeat(5 - (review.rating || 0))}
                                    </div>
                                    <span className="ml-1">{review.rating}/5</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div
                              className="text-sm text-gray-700 mt-2 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: review.content || 'Không có nội dung đánh giá' }}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      Chưa có đánh giá nào
                    </div>
                  )}
                </div>
              </section>

              {/* Mô tả Section */}
              <section id="mota" className="section">
                <div className="product-description relative">
                  <div
                    id="desc-content"
                    className={`${
                      isDescExpanded ? '' : 'desc-collapsed'
                    } overflow-hidden transition-all duration-500 p-4 text-sm`}
                  >
                    <div
                      id="desc-html"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    ></div>
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      id="toggle-desc"
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full shadow-md hover:scale-105 hover:shadow-lg transition"
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                    >
                      {isDescExpanded ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Đề xuất Section */}
              <section id="dexuat" className="section">
                <div id="product-list-recommended" className="grid grid-cols-2 gap-4 p-4">
                  {product.recommended?.map((p) => (
                    <div
                      key={p.id}
                      className="border rounded-md overflow-hidden shadow-sm view-detail-btn product-card cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="relative">
                        <img src={p.image} alt={p.name} className="w-full h-48 object-cover" loading="lazy" />
                        {p.discount > 0 && (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                            -{p.discount}%
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <h3 className="text-xs font-medium line-clamp-2">{p.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-red-600 font-bold text-sm">{formatPrice(p.price)}</span>
                          {p.discount > 0 && (
                            <span className="line-through text-gray-400 text-xs">
                              {formatPrice(p.regular)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="p-4 text-center text-red-500">Lỗi tải sản phẩm</div>
          )}
        </div>

        {/* Footer */}
        <div className="footer-shop bg-white border-t shadow-md">
          <div className="flex items-center justify-between space-x-2 p-2">
            <button className="flex flex-col items-center text-xs text-black hover:opacity-70">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <span className="text-xs">Cửa hàng</span>
            </button>

            <button className="flex flex-col items-center text-xs text-black hover:opacity-70">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.2-3.6A7.92 7.92 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-xs">Trò chuyện</span>
            </button>

            <button id="btnOpenPopup" className="px-5 py-1 text-sm font-semibold text-black bg-gray-100 rounded hover:bg-gray-200">
              Thêm vào <br /> giỏ hàng
            </button>

            <button
              id="btnBuyPopup"
              onClick={async () => {
                if (!product) return
                
                // Kiểm tra variant nếu có
                if (product.variants && product.variants.length > 0) {
                  alert('Vui lòng chọn phiên bản sản phẩm trước khi mua')
                  return
                }

                // Thêm vào cart và mở CheckoutOverlay
                const cartItem = {
                  productId: product.id,
                  productName: product.name,
                  variant: undefined,
                  quantity: 1,
                  price: product.price,
                  regularPrice: product.regular,
                  discount: product.discount,
                  image: product.image,
                }

                try {
                  // Lấy giỏ hàng hiện tại
                  const getResponse = await fetch('/api/cart')
                  const getData = await getResponse.json()
                  const currentCart = getData.success ? getData.data : []

                  // Helper để normalize variant
                  const normalizeVariant = (v: any) => {
                    if (!v) return ''
                    const sorted = Object.keys(v).sort().reduce((acc: any, key) => {
                      acc[key] = v[key]
                      return acc
                    }, {})
                    return JSON.stringify(sorted)
                  }

                  // Kiểm tra xem sản phẩm đã có trong giỏ chưa
                  const existingIndex = currentCart.findIndex(
                    (item: any) =>
                      item.productId === cartItem.productId &&
                      normalizeVariant(item.variant) === normalizeVariant(cartItem.variant)
                  )

                  let updatedCart: any[]
                  if (existingIndex >= 0) {
                    // Cập nhật số lượng nếu đã có
                    updatedCart = [...currentCart]
                    updatedCart[existingIndex] = {
                      ...updatedCart[existingIndex],
                      quantity: updatedCart[existingIndex].quantity + cartItem.quantity,
                    }
                  } else {
                    // Thêm mới
                    updatedCart = [...currentCart, cartItem]
                  }

                  // Lưu vào session
                  await fetch('/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: updatedCart }),
                  })

                  // Cập nhật cart count
                  const totalCount = updatedCart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
                  const cartCountElements = document.getElementsByClassName('cart-count')
                  for (let i = 0; i < cartCountElements.length; i++) {
                    cartCountElements[i].textContent = String(totalCount)
                  }
                  window.dispatchEvent(new Event('cartUpdated'))

                  // Mở CheckoutOverlay
                  setShowCheckout(true)
                } catch (error) {
                  console.error('Error adding to cart:', error)
                  alert('Có lỗi xảy ra khi thêm vào giỏ hàng')
                }
              }}
              className="px-5 py-1 text-sm font-semibold text-white bg-red-500 rounded hover:bg-red-600"
            >
              Mua ngay
              <span className="block text-xs font-normal">Freeship</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cart Overlay - đè lên modal */}
      <CartOverlay
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={() => {
          setShowCart(false)
          setShowCheckout(true)
        }}
      />
      <CheckoutOverlay isOpen={showCheckout} onClose={() => setShowCheckout(false)} />
      {copyToast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-full shadow-lg z-[120]">
          {copyToast.message}
        </div>
      )}
    </div>
  )
}

