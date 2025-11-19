import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

const CART_COOKIE = 'cart_data'

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

function readCart(request: NextRequest): CartItem[] {
  const raw = request.cookies.get(CART_COOKIE)?.value
  if (!raw) return []
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8')
    const parsed = JSON.parse(decoded)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCartCookie(response: NextResponse, cart: CartItem[]) {
  const encoded = Buffer.from(JSON.stringify(cart)).toString('base64')
  response.cookies.set(CART_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

// GET - Lấy giỏ hàng
export async function GET(request: NextRequest) {
  try {
    const cart = readCart(request)

    const response = NextResponse.json({
      success: true,
      data: cart,
    })

    writeCartCookie(response, cart)

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

    const response = NextResponse.json({
      success: true,
      data: validItems,
    })

    writeCartCookie(response, validItems)

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

    const cart = readCart(request)
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
    const response = NextResponse.json({
      success: true,
      data: cart,
    })

    writeCartCookie(response, cart)

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
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const variantParam = searchParams.get('variant')

    const cart = readCart(request)

    if (productId) {
      // Xóa item cụ thể bằng productId + variant
      let variant: any = undefined
      if (variantParam) {
        try {
          variant = JSON.parse(decodeURIComponent(variantParam))
        } catch {
          // Invalid variant JSON, ignore
        }
      }

      const variantKey = normalizeVariant(variant)
      const itemIndex = cart.findIndex(
        (item) =>
          item.productId === Number(productId) &&
          normalizeVariant(item.variant) === variantKey
      )
      if (itemIndex >= 0) {
        cart.splice(itemIndex, 1)
      }
      const response = NextResponse.json({
        success: true,
        data: cart,
      })
      writeCartCookie(response, cart)
      return response
    } else {
      const response = NextResponse.json({
        success: true,
        data: [],
      })
      writeCartCookie(response, [])
      return response
    }
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

