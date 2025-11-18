import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface OrderItem {
  productId: number
  productName: string
  productImage?: string
  price: number
  quantity: number
  variant?: any
  attributes?: Record<string, string>
}

interface OrderRequest {
  customerName: string
  customerPhone: string
  customerAddress: string
  items: OrderItem[]
}

// POST - Tạo đơn hàng mới
export async function POST(request: Request) {
  try {
    const body: OrderRequest = await request.json()

    // Validate input
    if (!body.customerName || body.customerName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Tên khách hàng phải có ít nhất 2 ký tự' },
        { status: 400 }
      )
    }

    if (!body.customerPhone) {
      const phoneDigits = body.customerPhone.replace(/\D/g, '')
      if (phoneDigits.length < 9 || phoneDigits.length > 11) {
        return NextResponse.json(
          { success: false, error: 'Số điện thoại không hợp lệ' },
          { status: 400 }
        )
      }
    }

    if (!body.customerAddress || body.customerAddress.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Địa chỉ phải có ít nhất 5 ký tự' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Giỏ hàng trống' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const totalAmount = body.items.reduce((sum, item) => {
      const price = Number(item.price) || 0
      const quantity = Number(item.quantity) || 0
      return sum + price * quantity
    }, 0)

    // Start transaction: Create order
    const orderResult = await query(
      `INSERT INTO orders (customer_name, customer_phone, customer_address, total_amount, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [
        body.customerName.trim(),
        body.customerPhone.replace(/\D/g, ''),
        body.customerAddress.trim(),
        totalAmount,
      ]
    )

    const orderId = (orderResult as any).insertId

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Không thể tạo đơn hàng' },
        { status: 500 }
      )
    }

    // Insert order items
    const itemPromises = body.items.map((item) => {
      const price = Number(item.price) || 0
      const quantity = Number(item.quantity) || 0
      const subtotal = price * quantity

      return query(
        `INSERT INTO order_items 
         (order_id, product_id, product_name, product_image, price, quantity, subtotal) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.productName,
          item.productImage || '',
          price,
          quantity,
          subtotal,
        ]
      )
    })

    await Promise.all(itemPromises)

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        totalAmount,
      },
      message: 'Đơn hàng đã được tạo thành công',
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Không thể tạo đơn hàng',
      },
      { status: 500 }
    )
  }
}

