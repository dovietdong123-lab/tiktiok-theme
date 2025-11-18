import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET - Lấy danh sách đơn hàng (admin)
export async function GET(request: Request) {
  try {
    await requireAuth() // Check authentication
  } catch (error: any) {
    console.error('Auth error in GET /api/admin/orders:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let sql = `
      SELECT 
        o.id,
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `

    const params: any[] = []
    if (status) {
      sql += ' WHERE o.status = ?'
      params.push(status)
    }

    sql += ' GROUP BY o.id ORDER BY o.created_at DESC'

    const orders = await query(sql, params)

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      (orders as any[]).map(async (order) => {
        const items = await query(
          'SELECT * FROM order_items WHERE order_id = ?',
          [order.id]
        )
        return {
          ...order,
          items: items || [],
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: ordersWithItems,
    })
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch orders',
      },
      { status: 500 }
    )
  }
}

