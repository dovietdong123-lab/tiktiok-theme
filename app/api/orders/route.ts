import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { validateCouponCode } from '@/lib/coupons'

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
  couponCode?: string | null
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

    const phoneDigits = body.customerPhone?.replace(/\D/g, '')
    if (!body.customerPhone || !phoneDigits || phoneDigits.length < 9 || phoneDigits.length > 11) {
      return NextResponse.json(
        { success: false, error: 'Số điện thoại không hợp lệ' },
        { status: 400 }
      )
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

    let discountAmount = 0
    let couponCode: string | null = null
    if (body.couponCode) {
      try {
        const couponResult = await validateCouponCode(body.couponCode, totalAmount)
        discountAmount = couponResult.discountAmount
        couponCode = couponResult.coupon.code
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: error.message || 'Mã giảm giá không hợp lệ' },
          { status: 400 }
        )
      }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount)

    // Normalize coupon code to uppercase for consistency
    const normalizedCouponCode = couponCode ? couponCode.toUpperCase().trim() : null

    // Use transaction to ensure atomicity
    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()

      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          customer_name, customer_phone, customer_address,
          total_amount, discount_amount, final_amount, coupon_code, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          body.customerName.trim(),
          phoneDigits,
          body.customerAddress.trim(),
          totalAmount,
          discountAmount,
          finalAmount,
          normalizedCouponCode,
        ]
      ) as any

      const orderId = orderResult.insertId

      if (!orderId) {
        await connection.rollback()
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

        return connection.execute(
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

      // Update coupon usage count atomically (with lock to prevent race condition)
      if (normalizedCouponCode) {
        const [updateResult] = await connection.execute(
          `UPDATE discount_coupons
           SET usage_count = usage_count + 1
           WHERE code = ? 
             AND status = 'active'
             AND (start_date IS NULL OR start_date <= NOW())
             AND (end_date IS NULL OR end_date >= NOW())
             AND (usage_limit IS NULL OR usage_count < usage_limit)`,
          [normalizedCouponCode]
        ) as any

        // Check if coupon was actually updated (prevents over-usage)
        if (updateResult.affectedRows === 0) {
          await connection.rollback()
          return NextResponse.json(
            { success: false, error: 'Mã giảm giá không còn hợp lệ hoặc đã hết lượt sử dụng' },
            { status: 400 }
          )
        }
      }

      await connection.commit()

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          totalAmount,
          discountAmount,
          finalAmount,
          couponCode: normalizedCouponCode,
        },
        message: 'Đơn hàng đã được tạo thành công',
      })
    } catch (error: any) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
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

