'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { animateProductToCart } from '@/utils/cartAnimation'
import MediaDisplay from '@/components/MediaDisplay'

interface Variant {
  id?: number
  label: string
  value: string
  price: number
  regular: number
  discount: number
  image?: string
}

const capitalize = (text?: string) => {
  if (!text) return ''
  return text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface Product {
  id: number
  name: string
  price: number
  regular: number
  discount: number
  image: string
  gallery?: string[]
  description?: string
  variants?: Variant[]
}

interface CartBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  mode?: 'cart' | 'buy'
  onBuyNow?: (selectedProduct: any) => void // Callback khi bấm "Mua ngay" và confirm thành công, truyền sản phẩm đã chọn
}

export default function CartBottomSheet({ isOpen, onClose, product, mode = 'cart', onBuyNow }: CartBottomSheetProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const startYRef = useRef<number>(0)
  const productImageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleClose = () => {
    setIsClosing(true)
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose()
    }, 300)
  }

  useEffect(() => {
    if (isOpen && product) {
      // Reset closing state when opening
      setIsClosing(false)
      setIsEntering(true)
      const frame = requestAnimationFrame(() => {
        setIsEntering(false)
      })
      // Reset quantity and variant when opening
      setQuantity(1)
      console.log('CartBottomSheet opened with product:', product)
      console.log('Product variants:', product.variants)
      if (product.variants && product.variants.length > 0) {
        // Auto-select first variant if available
        setSelectedVariant(product.variants[0])
        console.log('Auto-selected variant:', product.variants[0])
      } else {
        setSelectedVariant(null)
        console.log('No variants available')
      }
      return () => cancelAnimationFrame(frame)
    } else {
      setIsClosing(false)
      setIsEntering(true)
    }
  }, [isOpen, product])

  const formatPrice = (price: number) => {
    return Number(price).toLocaleString('vi-VN') + 'đ'
  }

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  const handleIncrease = () => {
    setQuantity((prev) => Math.min(999, prev + 1))
  }

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant)
  }

  const handleConfirm = async () => {
    if (!product) return

    // Check if variant is required (only if variants exist)
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      alert('Vui lòng chọn phiên bản sản phẩm!')
      return
    }

    const selectedImage = selectedVariant?.image || product.image
    const selectedPrice = selectedVariant?.price || product.price
    const selectedRegular = selectedVariant?.regular || product.regular
    const selectedDiscount = selectedVariant?.discount || product.discount

    const cartItem = {
      productId: product.id,
      productName: product.name,
      variant: selectedVariant,
      quantity,
      price: selectedPrice,
      regularPrice: selectedRegular,
      discount: selectedDiscount,
      image: selectedImage,
    }

    try {
      if (mode === 'buy') {
        // Nếu là "Mua ngay", không thêm vào giỏ hàng, chỉ mở CheckoutOverlay với directProduct
        onClose()
        if (onBuyNow) {
          // Delay một chút để đảm bảo bottom sheet đã đóng
          setTimeout(() => {
            onBuyNow(cartItem)
          }, 300)
        }
        return
      }

      // Nếu là "Thêm vào giỏ hàng", thực hiện logic thêm vào cart
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
      const saveResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedCart }),
      })

      // Reload cart từ server để đảm bảo số lượng chính xác
      if (saveResponse.ok) {
        const saveData = await saveResponse.json()
        if (saveData.success && Array.isArray(saveData.data)) {
          const finalCart = saveData.data
          const totalCount = finalCart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
          const cartCountElements = document.getElementsByClassName('cart-count')
          for (let i = 0; i < cartCountElements.length; i++) {
            cartCountElements[i].textContent = String(totalCount)
          }
          // Dispatch event để các component khác cập nhật
          window.dispatchEvent(new Event('cartUpdated'))
        }
      } else {
        // Fallback nếu không reload được
        const totalCount = updatedCart.reduce((sum, item) => sum + (item.quantity || 0), 0)
        const cartCountElements = document.getElementsByClassName('cart-count')
        for (let i = 0; i < cartCountElements.length; i++) {
          cartCountElements[i].textContent = String(totalCount)
        }
        window.dispatchEvent(new Event('cartUpdated'))
      }

      // Tạo hiệu ứng bay ảnh vào giỏ hàng
      const imageElement = productImageRef.current
      animateProductToCart(selectedImage, imageElement, 'showCartBtn', () => {
        // Đóng bottom sheet sau khi animation xong
        setTimeout(() => {
          onClose()
        }, 100)
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Có lỗi xảy ra khi thêm vào giỏ hàng')
    }
  }

  const handleSwipeStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
  }

  const handleSwipeEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0]?.clientY || 0
    if (startYRef.current && endY - startYRef.current > 80) {
      handleClose()
    }
    startYRef.current = 0
  }

  if (!mounted || !product) return null

  if (!isOpen && !isClosing) return null

  const displayImage = selectedVariant?.image || product.image
  const displayPrice = selectedVariant?.price || product.price
  const displayRegular = selectedVariant?.regular || product.regular
  const displayDiscount = selectedVariant?.discount || product.discount

  const content = (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 mx-auto bg-white rounded-t-2xl p-4 transform transition-transform duration-300 ease-out z-50 w-full max-w-[500px] ${
          isClosing || isEntering ? 'translate-y-full' : 'translate-y-0'
        }`}
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chọn sản phẩm</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-black text-2xl leading-none w-6 h-6 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {/* Product Image and Info - Top Right Section */}
        <div className="relative flex gap-3 mb-4">
          <div className="w-24 h-24 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
            <img 
              ref={productImageRef}
              src={displayImage} 
              alt={product.name} 
              className="object-cover w-full h-full" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</h4>
              </div>
              {displayDiscount > 0 && (
                <span className="bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0">
                  -{displayDiscount}%
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-rose-600 font-bold text-sm">{formatPrice(displayPrice)}</span>
              {displayDiscount > 0 && (
                <span className="text-xs text-gray-400 line-through">{formatPrice(displayRegular)}</span>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5">
                Freeship
              </span>
              {selectedVariant && (
                <span className="block mt-1 font-medium">
                  {(selectedVariant.label ? `${capitalize(selectedVariant.label)}: ` : '') + capitalize(selectedVariant.value)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Variants - Card Style with Images */}
        <div className="mt-4">
          <p className="font-medium text-sm mb-3">Thông số</p>
          {product.variants && Array.isArray(product.variants) && product.variants.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {product.variants.map((variant, index) => {
                const variantImage = variant.image || product.image
                const isSelected =
                  selectedVariant &&
                  (selectedVariant.id === variant.id ||
                    (selectedVariant.value === variant.value && selectedVariant.label === variant.label))
                const variantPrice = variant.price || product.price
                const variantRegular = variant.regular || product.regular
                const variantDiscount = variant.discount || 0
                const showRegular = variantRegular && variantRegular > variantPrice

                return (
                  <button
                    key={variant.id || index}
                    onClick={() => handleVariantSelect(variant)}
                    className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                      isSelected ? 'border-rose-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      <MediaDisplay
                        url={variantImage}
                        alt={variant.value}
                        className="object-cover w-full h-full"
                        autoPlay={false}
                      />
                    </div>
                    <div className="p-2 text-center space-y-1">
                      <span className={`text-xs font-semibold ${isSelected ? 'text-rose-600' : 'text-gray-800'}`}>
                        {variant.value}
                      </span>
                      
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 py-2">
              Sản phẩm này không có thuộc tính để chọn
            </div>
          )}

        </div>

        {/* Quantity */}
        <div className="max-w-md mt-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-800">Số lượng</label>
            <div className="inline-flex justify-end items-stretch overflow-hidden rounded bg-gray-100 ring-1 ring-gray-200">
              <button
                onClick={handleDecrease}
                className="px-2 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                −
              </button>
              <div className="w-px my-1 bg-gray-300"></div>
              <input
                type="text"
                value={quantity}
                readOnly
                className="w-12 text-sm text-center bg-transparent font-medium text-gray-900 outline-none"
              />
              <div className="w-px my-1 bg-gray-300"></div>
              <button
                onClick={handleIncrease}
                className="px-2 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="mt-4 w-full rounded bg-rose-500 py-2 text-center text-white font-semibold hover:bg-rose-600 transition-colors"
        >
          {mode === 'cart' ? 'Thêm vào giỏ hàng' : 'Mua ngay'}
        </button>
      </div>
    </>
  )

  return createPortal(content, document.body)
}

