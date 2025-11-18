import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'

interface CartItem {
  productId: number
  productName: string
  variant?: {
    label?: string
    value?: string
  }
  quantity: number
  price: number
  regularPrice?: number
  discount?: number
  image: string
  attributes?: Record<string, string>
}

// Store carts in memory (in production, use Redis or database)
const carts = new Map<string, CartItem[]>()

// Helper to normalize variant for comparison
function normalizeVariant(variant?: any): string {
  if (!variant) return ''
  const sorted = Object.keys(variant)
    .sort()
    .reduce((acc, key) => {
      acc[key] = variant[key]
      return acc
    }, {} as any)
  return JSON.stringify(sorted)
}

// Helper to get or create session ID
function getSessionId(request: NextRequest): string {
  let sessionId = request.cookies.get('cart_session')?.value

  if (!sessionId) {
    sessionId = crypto.randomBytes(16).toString('hex')
  }

  return sessionId
}

// GET - Lấy giỏ hàng
export async function GET(request: NextRequest) {
  try {
    const sessionId = getSessionId(request)
    const cart = carts.get(sessionId) || []

    const response = NextResponse.json({
      success: true,
      data: cart,
    })

    // Set cookie if not exists
    if (!request.cookies.get('cart_session')) {
      response.cookies.set('cart_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error: any) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch cart',
      },
      { status: 500 }
    )
  }
}

// POST - Thêm/cập nhật giỏ hàng
export async function POST(request: NextRequest) {
  try {
    const sessionId = getSessionId(request)
    const body = await request.json()
    const { items } = body // items: CartItem[]

    if (!Array.isArray(items)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Items must be an array',
        },
        { status: 400 }
      )
    }

    // Validate items
    const validItems: CartItem[] = items
      .filter((item: any) => item.productId && item.productName && item.price)
      .map((item: any) => ({
        productId: Number(item.productId),
        productName: String(item.productName),
        variant: item.variant || undefined,
        quantity: Math.max(1, Number(item.quantity) || 1),
        price: Number(item.price) || 0,
        regularPrice: item.regularPrice ? Number(item.regularPrice) : undefined,
        discount: item.discount ? Number(item.discount) : undefined,
        image: String(item.image || ''),
        attributes: item.attributes || undefined,
      }))

    carts.set(sessionId, validItems)

    const response = NextResponse.json({
      success: true,
      data: validItems,
    })

    // Set cookie if not exists
    if (!request.cookies.get('cart_session')) {
      response.cookies.set('cart_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error: any) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update cart',
      },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật số lượng item (dùng productId + variant thay vì index)
export async function PUT(request: NextRequest) {
  try {
    const sessionId = getSessionId(request)
    const body = await request.json()
    const { productId, variant, quantity } = body

    if (!productId || typeof quantity !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'ProductId and quantity are required',
        },
        { status: 400 }
      )
    }

    const cart = carts.get(sessionId) || []
    const variantKey = normalizeVariant(variant)
    
    const itemIndex = cart.findIndex(
      (item) =>
        item.productId === Number(productId) &&
        normalizeVariant(item.variant) === variantKey
    )

    if (itemIndex < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found in cart',
        },
        { status: 404 }
      )
    }

    const newQuantity = Math.max(1, quantity)
    cart[itemIndex] = { ...cart[itemIndex], quantity: newQuantity }
    carts.set(sessionId, cart)

    const response = NextResponse.json({
      success: true,
      data: cart,
    })

    if (!request.cookies.get('cart_session')) {
      response.cookies.set('cart_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    }

    return response
  } catch (error: any) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update cart item',
      },
      { status: 500 }
    )
  }
}

// DELETE - Xóa item hoặc xóa toàn bộ giỏ hàng
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = getSessionId(request)
    const { searchParams } = new URL(request.url)
    const index = searchParams.get('index')

    const cart = carts.get(sessionId) || []

    if (index !== null) {
      // Xóa item cụ thể
      const itemIndex = parseInt(index)
      if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= cart.length) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid index',
          },
          { status: 400 }
        )
      }

      cart.splice(itemIndex, 1)
      carts.set(sessionId, cart)
    } else {
      // Xóa toàn bộ giỏ hàng
      carts.set(sessionId, [])
    }

    return NextResponse.json({
      success: true,
      data: carts.get(sessionId) || [],
    })
  } catch (error: any) {
    console.error('Error deleting cart item:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete cart item',
      },
      { status: 500 }
    )
  }
}

