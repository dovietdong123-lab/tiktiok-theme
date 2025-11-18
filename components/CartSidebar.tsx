'use client'

import { useState, useEffect } from 'react'

interface CartItem {
  id: number
  name: string
  price: number
  image: string
  quantity: number
  attributes?: Record<string, string>
}

export default function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [storeName, setStoreName] = useState('TikTiok Shop')

  useEffect(() => {
    loadCart()
    // Listen for cart updates
    window.addEventListener('cartUpdated', loadCart)
    return () => window.removeEventListener('cartUpdated', loadCart)
  }, [])

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

  const loadCart = async () => {
    try {
      const response = await fetch('/api/cart')
      const data = await response.json()
      if (data.success) {
        setCart(Array.isArray(data.data) ? data.data : [])
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const updateQuantity = async (index: number, newQuantity: number) => {
    const updatedCart = [...cart]
    if (newQuantity <= 0) {
      updatedCart.splice(index, 1)
    } else {
      updatedCart[index].quantity = newQuantity
    }
    setCart(updatedCart)
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedCart }),
      })
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error) {
      console.error('Error updating cart:', error)
    }
  }

  const removeFromCart = async (index: number) => {
    const updatedCart = [...cart]
    updatedCart.splice(index, 1)
    setCart(updatedCart)
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedCart }),
      })
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error) {
      console.error('Error removing from cart:', error)
    }
  }

  const closeCart = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    // Expose openCart function globally
    ;(window as any).openCart = () => setIsOpen(true)
  }, [])

  if (!isOpen) {
    return (
      <div
        id="cartOverlay"
        className="fixed inset-0 bg-black bg-opacity-50 hidden z-50 w-full max-w-[500px] pc mx-auto"
      ></div>
    )
  }

  return (
    <div
      id="cartOverlay"
      className="fixed inset-0 bg-black bg-opacity-50 z-50 w-full max-w-[500px] pc mx-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCart()
      }}
    >
      <div
        id="cartSidebar"
        className="absolute top-0 right-0 w-full max-w-md h-full bg-white transform translate-x-0 transition-transform duration-300 z-50 flex flex-col"
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <button className="text-xl hover:text-gray-600" onClick={closeCart}>
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
              Giỏ hàng (<span className="cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>)
            </h1>
          </div>

          <button
            id="toggleEditBtn"
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Hoàn tất' : 'Chỉnh sửa'}
          </button>
        </div>

        {/* Store Section */}
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center">
            <span className="font-semibold text-sm shop-name">{storeName}</span>
          </div>
        </div>

        {/* Cart Items Container */}
        <div id="cartItems" className="flex-1 overflow-y-auto px-4 py-2">
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
            cart.map((item, index) => (
              <div key={index} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
                {isEditMode && (
                  <input
                    type="checkbox"
                    className="itemCheckbox mt-2 w-4 h-4 text-blue-600"
                    data-index={index}
                  />
                )}
                <img
                  src={item.image}
                  className="w-16 h-16 object-cover border rounded-lg flex-shrink-0"
                  alt={item.name}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-tight mb-1">
                    <span className="bg-black text-white text-xs px-1 py-0.5 rounded">Mall</span>
                    {item.name}
                  </p>
                  {item.attributes && (
                    <div className="text-xs text-gray-500 mb-2">
                      {Object.entries(item.attributes)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' • ')}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 font-semibold">{formatPrice(item.price)}</span>
                    <div className="inline-flex items-stretch overflow-hidden rounded bg-gray-100 ring-1 ring-gray-200">
                      <button
                        className="px-2 text-gray-500 hover:bg-gray-200"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                      >
                        −
                      </button>
                      <div className="w-px my-1 bg-gray-300"></div>
                      <span className="text-sm font-medium min-w-[33px] text-center">{item.quantity}</span>
                      <div className="w-px my-1 bg-gray-300"></div>
                      <button
                        className="px-2 text-gray-500 hover:bg-gray-200"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t bg-white">
          <div id="bulkActionBar" className={`${isEditMode ? '' : 'hidden'} px-4 py-2 border-b bg-gray-50 flex justify-between items-center`}>
            <label className="flex items-center text-sm text-gray-600">
              <input type="checkbox" id="selectAllItems" className="mr-2 w-4 h-4 text-blue-600" />
              Chọn tất cả
            </label>
            <button
              id="deleteSelectedBtn"
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
              onClick={() => {
                setCart([])
                localStorage.setItem('cart', '[]')
                window.dispatchEvent(new Event('cartUpdated'))
              }}
            >
              Xóa đã chọn
            </button>
          </div>

          <div className="px-4 py-3 border-b">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Tổng cộng:</span>
              <span className="font-bold text-lg text-red-600" id="cartTotal">
                {formatPrice(calculateTotal())}
              </span>
            </div>
          </div>

          <div className="p-4">
            <button
              id="checkoutBtn"
              className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:bg-gray-300"
              disabled={cart.length === 0}
            >
              Thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

