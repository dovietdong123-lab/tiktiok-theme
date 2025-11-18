'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CartBottomSheet from '@/components/CartBottomSheet'
import CartOverlay from '@/components/CartOverlay'
import CheckoutOverlay from '@/components/CheckoutOverlay'

interface Product {
  id: number
  slug: string
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
  id: number
  content: string
  rating: number
  user_name: string
  created_at: string
  avatar?: string
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

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { slug } = params
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('tongquan')
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [tabNavVisible, setTabNavVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const tongquanRef = useRef<HTMLElement>(null)
  const danhgiaRef = useRef<HTMLElement>(null)
  const motaRef = useRef<HTMLElement>(null)
  const dexuatRef = useRef<HTMLElement>(null)
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
  const [cartMode, setCartMode] = useState<'cart' | 'buy'>('cart')
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [directProduct, setDirectProduct] = useState<any>(null) // Sản phẩm mua trực tiếp
  const [flashCountdown, setFlashCountdown] = useState(27099)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLUListElement>(null)
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [copyToast, setCopyToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  })

  const renderLoadingSkeleton = () => (
    <div className="p-4 space-y-6">
      <div className="w-full aspect-square bg-gray-200 rounded-xl animate-pulse" />
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="bg-white rounded shadow p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-24" />
        <div className="h-6 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="bg-white rounded shadow p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
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
          <div key={idx} className="h-36 bg-gray-100 rounded-lg animate-pulse" />
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
    // Kiểm tra xem có phải là quay lại từ back button không
    const isBackNavigation = sessionStorage.getItem('product_detail_back') === 'true'
    
    if (isBackNavigation) {
      // Nếu là back navigation, không animate
      sessionStorage.removeItem('product_detail_back')
      setIsAnimating(false)
      setIsClosing(false)
    } else {
      // Nếu là lần đầu vào, có animation
      setIsAnimating(true)
      setIsClosing(false)
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [slug])

  const handleBack = () => {
    // Đánh dấu là back navigation để trang cũ không animate
    sessionStorage.setItem('product_detail_back', 'true')
    setIsClosing(true)
    setIsAnimating(true)
    // Wait for animation to complete before navigating
    setTimeout(() => {
      router.back()
    }, 300)
  }

  useEffect(() => {
    if (slug) {
      loadProductDetail(slug)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }
  }, [slug])

  useEffect(() => {
    setFlashCountdown(27099)
    const interval = setInterval(() => {
      setFlashCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [product?.id])

  useEffect(() => {
    if (!copyToast.visible) return
    const timer = setTimeout(() => setCopyToast({ visible: false, message: '' }), 2000)
    return () => clearTimeout(timer)
  }, [copyToast.visible])
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopyToast({ visible: true, message: `Đã sao chép mã ${code}` })
    })
  }

  const formatCountdown = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const pad = (num: number) => String(num).padStart(2, '0')
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !product) return

    const handleScroll = () => {
      setTabNavVisible(container.scrollTop > 50)
      
      // Update active tab based on scroll position
      const scrollTop = container.scrollTop
      const headerOffset = 100 // Offset for sticky header
      
      // Get positions relative to container
      const getSectionTop = (ref: React.RefObject<HTMLElement>) => {
        if (!ref.current) return Infinity
        const containerRect = container.getBoundingClientRect()
        const sectionRect = ref.current.getBoundingClientRect()
        return scrollTop + (sectionRect.top - containerRect.top)
      }

      const tongquanTop = getSectionTop(tongquanRef)
      const danhgiaTop = getSectionTop(danhgiaRef)
      const motaTop = getSectionTop(motaRef)
      const dexuatTop = getSectionTop(dexuatRef)

      // Determine which section is currently in view
      const currentScroll = scrollTop + headerOffset
      
      if (currentScroll >= dexuatTop - 100) {
        setActiveTab('dexuat')
      } else if (currentScroll >= motaTop - 100) {
        setActiveTab('mota')
      } else if (currentScroll >= danhgiaTop - 100) {
        setActiveTab('danhgia')
      } else {
        setActiveTab('tongquan')
      }
    }

    container.addEventListener('scroll', handleScroll)
    // Initial check after a small delay to ensure DOM is ready
    setTimeout(handleScroll, 100)
    
    return () => container.removeEventListener('scroll', handleScroll)
  }, [product])

  const loadProductDetail = async (productSlug: string) => {
    setLoading(true)
    try {
      const encodedSlug = encodeURIComponent(productSlug)
      const response = await fetch(`/api/products/${encodedSlug}`)
      const data = await response.json()
      if (data.success) {
        console.log('Product data loaded:', data.data)
        console.log('Variants:', data.data.variants)
        setProduct(data.data)
        setAvailableCoupons(Array.isArray(data.data.coupons) ? data.data.coupons : [])
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Nếu query rỗng hoặc < 2 ký tự, ẩn kết quả
    if (!query.trim() || query.trim().length < 2) {
      setShowSearchResults(false)
      setSearchResults([])
      return
    }

    // Debounce: đợi 300ms sau khi người dùng ngừng gõ
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      setShowSearchResults(true)
      
      try {
        const encodedQuery = encodeURIComponent(query.trim())
        const response = await fetch(`/api/products?search=${encodedQuery}`)
        const data = await response.json()
        
        if (data.success && Array.isArray(data.data)) {
          setSearchResults(data.data)
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.error('Error searching products:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  const handleProductClick = (productId: number, productSlug?: string) => {
    // Đánh dấu để không animate khi navigate
    sessionStorage.setItem('product_detail_back', 'true')
    setShowSearchResults(false)
    setSearchQuery('')
    
    if (productSlug) {
      router.push(`/products/${encodeURIComponent(productSlug)}`)
    } else {
      // Fallback nếu không có slug
      router.push(`/products/${productId}`)
    }
  }

  // Ẩn kết quả khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(target) &&
        searchResultsRef.current &&
        !searchResultsRef.current.contains(target)
      ) {
        setShowSearchResults(false)
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchResults])

  // Cập nhật vị trí dropdown khi hiển thị
  useEffect(() => {
    if (showSearchResults && searchInputRef.current && searchResultsRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect()
      searchResultsRef.current.style.top = `${rect.bottom}px`
      searchResultsRef.current.style.left = '0px'
      searchResultsRef.current.style.right = '0px'
    }
  }, [showSearchResults, searchQuery])

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

  const scrollToSection = (section: string) => {
    setActiveTab(section)
    const refs: { [key: string]: React.RefObject<HTMLElement> } = {
      tongquan: tongquanRef,
      danhgia: danhgiaRef,
      mota: motaRef,
      dexuat: dexuatRef,
    }
    
    const targetRef = refs[section]?.current
    const container = scrollContainerRef.current
    if (targetRef && container) {
      // Calculate scroll position within the container
      const containerTop = container.scrollTop
      const containerRect = container.getBoundingClientRect()
      const targetRect = targetRef.getBoundingClientRect()
      
      // Calculate the scroll position needed to show the target at the top (with offset)
      const scrollOffset = 60 // Offset for sticky header
      const targetScrollTop = containerTop + (targetRect.top - containerRect.top) - scrollOffset
      
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      })
    }
  }

  const panelTransformClass = isClosing
    ? 'translate-x-full'
    : isAnimating
    ? 'translate-x-full'
    : 'translate-x-0'
  const panelTransitionStyle = {
    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
    transitionDuration: '380ms',
  }

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 w-full max-w-[500px] mx-auto">
      <div
        className={`absolute top-0 right-0 w-full h-full bg-white flex flex-col overflow-hidden transform-gpu transition-transform ${panelTransformClass}`}
        style={panelTransitionStyle}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center flex-1 space-x-2">
              <button
                className="text-xl hover:text-gray-600"
                onClick={handleBack}
              >
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
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full block px-3 py-1 border rounded-md text-sm focus:outline-none"
                />
                <ul
                  ref={searchResultsRef}
                  className={`fixed left-0 right-0 bg-white border rounded-md shadow-md z-50 overflow-y-auto text-xs ${
                    showSearchResults ? '' : 'hidden'
                  }`}
                  style={{ maxHeight: '390px' }}
                >
                  {isSearching ? (
                    <li className="p-4 text-center text-gray-400 italic">Đang tìm kiếm...</li>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => handleProductClick(item.id, item.slug)}
                        className="flex items-center gap-3 p-4 border-b hover:bg-gray-100 cursor-pointer transition"
                        data-id={item.id}
                      >
                        <img
                          src={item.image || 'https://via.placeholder.com/64'}
                          alt={item.name}
                          className="w-16 h-16 rounded object-cover flex-shrink-0"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="font-medium text-gray-800 block truncate">{item.name}</span>
                          <span className="text-sm text-gray-500">
                            {formatPrice(item.price || item.regular_price || 0)}
                          </span>
                        </span>
                      </li>
                    ))
                  ) : searchQuery.trim().length >= 2 ? (
                    <li className="p-4 text-gray-400 italic">Không tìm thấy sản phẩm</li>
                  ) : null}
                </ul>
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
                className={`tab-link px-4 py-2 border-b-2 border-transparent cursor-pointer ${
                  activeTab === 'tongquan' ? 'active border-blue-500 text-blue-500' : 'text-gray-500'
                }`}
                onClick={() => scrollToSection('tongquan')}
              >
                Tổng quan
              </a>
              <a
                className={`tab-link px-4 py-2 border-b-2 border-transparent cursor-pointer ${
                  activeTab === 'danhgia' ? 'active border-blue-500 text-blue-500' : 'text-gray-500'
                }`}
                onClick={() => scrollToSection('danhgia')}
              >
                Đánh giá
              </a>
              <a
                className={`tab-link px-4 py-2 border-b-2 border-transparent cursor-pointer ${
                  activeTab === 'mota' ? 'active border-blue-500 text-blue-500' : 'text-gray-500'
                }`}
                onClick={() => scrollToSection('mota')}
              >
                Mô tả
              </a>
              <a
                className={`tab-link px-4 py-2 border-b-2 border-transparent cursor-pointer ${
                  activeTab === 'dexuat' ? 'active border-blue-500 text-blue-500' : 'text-gray-500'
                }`}
                onClick={() => scrollToSection('dexuat')}
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
              <section id="tongquan" ref={tongquanRef} className="section scroll-mt-20">
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
                  <div className="w-full max-w-md mx-auto bg-white rounded p-4">
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
                              className="border border-dashed rounded px-3 py-2 flex items-center justify-between gap-2 bg-pink-50"
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
                                onClick={() => handleCopyCoupon(coupon.code)}
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
              <section id="danhgia" ref={danhgiaRef} className="section pt-8 scroll-mt-20">
                  <div className="w-full max-w-md mx-auto bg-white rounded">
                    {/* Rating Summary */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="font-bold text-gray-800 text-base">Đánh giá của khách hàng</h2>
                        <a href="#" className="text-blue-500 text-xs">
                          Xem thêm &gt;
                        </a>
                      </div>
                      {product.reviews && product.reviews.length > 0 ? (
                        <>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-gray-800">
                                {(
                                  product.reviews.reduce((sum: number, r: Review) => sum + (r.rating || 0), 0) /
                                  product.reviews.length
                                ).toFixed(1)}
                              </div>
                              <div className="text-sm text-gray-500">/5</div>
                              <div className="flex text-yellow-400 text-sm mt-1">
                                {'★'.repeat(Math.round(product.reviews.reduce((sum: number, r: Review) => sum + (r.rating || 0), 0) / product.reviews.length))}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-gray-600">
                                {product.reviews.length} đánh giá
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Chưa có đánh giá nào
                        </div>
                      )}
                    </div>

                    {/* Reviews List */}
                    <div className="p-4 space-y-4">
                      {product.reviews && product.reviews.length > 0 ? (
                        product.reviews.map((review: Review) => (
                          <div key={review.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden text-white text-xs font-bold">
                                  {review.avatar ? (
                                    <img src={review.avatar} alt={review.user_name || 'review avatar'} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-500">
                                      {review.user_name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
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
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">Chưa có đánh giá nào cho sản phẩm này</p>
                          <p className="text-xs mt-2">Hãy là người đầu tiên đánh giá!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

              {/* Mô tả Section */}
              <section id="mota" ref={motaRef} className="section pt-8 scroll-mt-20">
                  <div className="product-description relative bg-white rounded">
                    {product.description ? (
                      <>
                        <div
                          id="desc-content"
                          className={`${
                            isDescExpanded ? '' : 'max-h-96'
                          } overflow-hidden transition-all duration-500 p-4 text-sm`}
                          style={{
                            maskImage: isDescExpanded ? 'none' : 'linear-gradient(to bottom, black 70%, transparent 100%)',
                            WebkitMaskImage: isDescExpanded ? 'none' : 'linear-gradient(to bottom, black 70%, transparent 100%)',
                          }}
                        >
                          <div
                            id="desc-html"
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                          ></div>
                        </div>
                        <div className="flex justify-center py-4">
                          <button
                            id="toggle-desc"
                            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full shadow-md hover:scale-105 hover:shadow-lg transition"
                            onClick={() => setIsDescExpanded(!isDescExpanded)}
                          >
                            {isDescExpanded ? 'Thu gọn' : 'Xem thêm'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Sản phẩm chưa có mô tả
                      </div>
                    )}
                  </div>
                </section>

              {/* Đề xuất Section */}
              <section id="dexuat" ref={dexuatRef} className="section pt-8 p-4 scroll-mt-20">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Sản phẩm đề xuất</h2>
                    <p className="text-sm text-gray-500 mt-1">Các sản phẩm bạn có thể quan tâm</p>
                  </div>
                  {product.recommended && product.recommended.length > 0 ? (
                    <div id="product-list-recommended" className="grid grid-cols-2 gap-4">
                      {product.recommended.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${encodeURIComponent(p.slug || String(p.id))}`}
                          className="border rounded-md overflow-hidden shadow-sm product-card cursor-pointer hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="relative">
                            <img src={p.image} alt={p.name} className="w-full h-48 object-cover" loading="lazy" />
                            {p.discount && p.discount > 0 && (
                              <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                                -{p.discount}%
                              </span>
                            )}
                          </div>
                          <div className="p-2">
                            <h3 className="text-xs font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-red-600 font-bold text-sm">{formatPrice(p.price)}</span>
                              {p.regular && p.discount && p.discount > 0 && (
                                <span className="line-through text-gray-400 text-xs">
                                  {formatPrice(p.regular)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <span className="text-yellow-500">★</span>
                              <span>4.7</span>
                              <span className="ml-2">Đã bán 500+</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Không có sản phẩm đề xuất</p>
                    </div>
                  )}
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

            <button
              onClick={() => {
                setCartMode('cart')
                setIsCartSheetOpen(true)
              }}
              className="px-5 py-1 text-sm font-semibold text-black bg-gray-100 rounded hover:bg-gray-200"
            >
              Thêm vào <br /> giỏ hàng
            </button>

            <button
              onClick={() => {
                if (!product) return
                
                // Luôn mở CartBottomSheet để chọn variant và số lượng
                setCartMode('buy')
                setIsCartSheetOpen(true)
              }}
              className="px-5 py-1 text-sm font-semibold text-white bg-red-500 rounded hover:bg-red-600"
            >
              Mua ngay
              <span className="block text-xs font-normal">Freeship</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cart Bottom Sheet */}
      <CartBottomSheet
        isOpen={isCartSheetOpen}
        onClose={() => setIsCartSheetOpen(false)}
        product={product}
        mode={cartMode}
        onBuyNow={(selectedProduct) => {
          // Set directProduct và mở CheckoutOverlay
          setDirectProduct(selectedProduct)
          setShowCheckout(true)
        }}
      />

      {/* Cart Overlay - đè lên trang chi tiết */}
      <CartOverlay
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={() => {
          setShowCart(false)
          setShowCheckout(true)
        }}
      />
      <CheckoutOverlay
        isOpen={showCheckout}
        onClose={() => {
          setShowCheckout(false)
          setDirectProduct(null) // Reset directProduct khi đóng
        }}
        directProduct={directProduct}
      />
    </div>
    {copyToast.visible && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-full shadow-lg z-[60]">
        {copyToast.message}
      </div>
    )}
    </>
  )
}

