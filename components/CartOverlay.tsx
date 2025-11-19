'use client'

import { useState, useEffect } from 'react'

interface CartItem {
  productId: number
  productName: string
  variant: any
  quantity: number
  price: number
  regularPrice: number
  discount: number
  image: string
  attributes?: any
}

interface CartOverlayProps {
  isOpen: boolean
  onClose: () => void
  onCheckout?: () => void
}

export default function CartOverlay({ isOpen, onClose, onCheckout }: CartOverlayProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAnimating, setIsAnimating] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (isOpen) {
      // Kiểm tra xem có phải là quay lại từ back button không
      const isBackNavigation = sessionStorage.getItem('cart_overlay_back') === 'true'
      
      // Reset closing state
      setIsClosing(false)
      // Load cart from API
      const loadCart = async () => {
        try {
          const response = await fetch('/api/cart')
          const data = await response.json()
          if (data.success) {
            setCart(Array.isArray(data.data) ? data.data : [])
          } else {
            setCart([])
          }
        } catch (error) {
          console.error('Error loading cart:', error)
          setCart([])
        }
      }
      loadCart()

      if (isBackNavigation) {
        // Nếu là back navigation, không animate
        sessionStorage.removeItem('cart_overlay_back')
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
      // Reset when closed
      setIsAnimating(true)
      setIsClosing(false)
    }
  }, [isOpen])

  const handleClose = () => {
    // Đánh dấu là back navigation để trang cũ không animate
    sessionStorage.setItem('cart_overlay_back', 'true')
    setIsClosing(true)
    setIsAnimating(true)
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose()
    }, 300)
  }

  useEffect(() => {
    // Update cart count display
    const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0)
    const cartCountElements = document.getElementsByClassName('cart-count')
    for (let i = 0; i < cartCountElements.length; i++) {
      cartCountElements[i].textContent = String(totalCount)
    }
  }, [cart])

  const saveCart = async (newCart: CartItem[]) => {
    setCart(newCart)
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newCart }),
      })
      // Dispatch event để cập nhật cart count
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }

  const formatPrice = (price: number) => {
    return Number(price).toLocaleString('vi-VN') + 'đ'
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + (Number(item.price) || 0) * (parseInt(String(item.quantity), 10) || 0)
    }, 0)
  }

  const updateQuantity = async (index: number, delta: number) => {
    const item = cart[index]
    if (!item) return

    const currentQty = item.quantity && item.quantity > 0 ? item.quantity : 1
    const newQty = Math.max(1, currentQty + delta)

    // Lưu giá trị cũ để rollback nếu cần
    const oldCart = [...cart]

    // Cập nhật local state trước
    const newCart = [...cart]
    newCart[index] = { ...item, quantity: newQty }
    setCart(newCart)

    // Lưu vào API
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          variant: item.variant,
          quantity: newQty,
        }),
      })
      
      // Reload cart từ server để đảm bảo sync
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setCart(data.data)
          // Dispatch event để cập nhật cart count
          window.dispatchEvent(new Event('cartUpdated'))
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      // Rollback nếu lỗi
      setCart(oldCart)
    }
  }

  const toggleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedItems(newSelected)
  }

  const selectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(cart.map((_, i) => i)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const deleteSelected = async () => {
    if (selectedItems.size === 0) {
      // Xóa tất cả nếu không chọn gì
      await saveCart([])
      setSelectedItems(new Set())
    } else {
      const newCart = cart.filter((_, i) => !selectedItems.has(i))
      await saveCart(newCart)
      setSelectedItems(new Set())
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) return
    onCheckout?.()
  }

  if (!isOpen && !isClosing) return null

  const total = calculateTotal()
  const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0)

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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[60] w-full max-w-[500px] mx-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div
        className={`absolute top-0 right-0 w-full h-full bg-white flex flex-col overflow-hidden transform-gpu transition-transform ${panelTransformClass}`}
        style={panelTransitionStyle}
      >
        <>
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
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

              <div className="flex flex-col items-center">
                <h1 className="font-bold text-lg">
                  Giỏ hàng (<span className="cart-count">{totalCount}</span>)
                </h1>
              </div>

              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isEditMode ? 'Hoàn tất' : 'Chỉnh sửa'}
              </button>
            </div>

            <div className="px-4 py-3 border-b bg-gray-50">
              <div className="flex items-center">
                <span className="font-semibold text-sm">Cửa hàng</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-16 h-16 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v8a2 2 0 002 2h6a2 2 0 002-2v-8m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v4.01"
                    />
                  </svg>
                  <p className="text-center">Giỏ hàng của bạn đang trống</p>
                  <p className="text-sm text-center mt-1">Hãy thêm sản phẩm vào giỏ hàng</p>
                </div>
              ) : (
                cart.map((item, index) => {
                  const attrHtml = item.variant
                    ? `${item.variant.label}: ${item.variant.value}`
                    : Object.keys(item.attributes || {})
                        .map((key) => `${key}: ${item.attributes[key]}`)
                        .join(' • ')

                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      {isEditMode && (
                        <input
                          type="checkbox"
                          className="itemCheckbox mt-2 w-4 h-4 text-blue-600"
                          checked={selectedItems.has(index)}
                          onChange={() => toggleSelectItem(index)}
                        />
                      )}
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 object-cover border rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight mb-1">
                          <span className="bg-black text-white text-xs px-1 py-0.5 rounded mr-1">Mall</span>{' '}
                          {item.productName}
                        </p>
                        {attrHtml && <div className="text-xs text-gray-500 mb-2">{attrHtml}</div>}
                        <div className="flex items-center justify-between">
                          <span className="text-red-600 font-semibold">{formatPrice(item.price)}</span>
                          <div className="inline-flex items-stretch overflow-hidden rounded bg-gray-100 ring-1 ring-gray-200">
                            <button
                              className="px-2 text-gray-500 hover:bg-gray-200"
                              onClick={() => updateQuantity(index, -1)}
                            >
                              −
                            </button>
                            <div className="w-px my-1 bg-gray-300"></div>
                            <span className="text-sm font-medium min-w-[33px] text-center">{item.quantity}</span>
                            <div className="w-px my-1 bg-gray-300"></div>
                            <button
                              className="px-2 text-gray-500 hover:bg-gray-200"
                              onClick={() => updateQuantity(index, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="border-t bg-white">
              {isEditMode && (
                <div className="px-4 py-2 border-b bg-gray-50 flex justify-between items-center">
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className="mr-2 w-4 h-4 text-blue-600"
                      checked={selectedItems.size === cart.length && cart.length > 0}
                      onChange={(e) => selectAll(e.target.checked)}
                    />
                    Chọn tất cả
                  </label>
                  <button
                    onClick={deleteSelected}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    Xóa đã chọn
                  </button>
                </div>
              )}

              <div className="px-4 py-3 border-b">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Tổng cộng:</span>
                  <span className="font-bold text-lg text-red-600">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="p-4">
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Thanh toán
                </button>
              </div>
            </div>
          </>
    
      </div>
    </div>
  )
}

