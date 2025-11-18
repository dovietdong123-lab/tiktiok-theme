import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get total products
    const [productsResult] = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted
      FROM products
    `) as any[]

    // Get total categories
    const [categoriesResult] = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted
      FROM categories
    `) as any[]

    // Get total orders (if orders table exists)
    let ordersResult = { total: 0, today: 0, pending: 0 }
    try {
      const [orders] = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
        FROM orders
      `) as any[]
      if (orders) {
        ordersResult = {
          total: parseInt(orders.total) || 0,
          today: parseInt(orders.today) || 0,
          pending: parseInt(orders.pending) || 0,
        }
      }
    } catch {
      // Orders table might not exist yet
    }

    // Get recent products
    const recentProducts = await query(`
      SELECT id, name, price, image, created_at
      FROM products
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 5
    `) as any[]

    // Get total revenue (if orders table exists)
    let revenue = 0
    try {
      const [revenueResult] = await query(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM orders
        WHERE status = 'completed'
      `) as any[]
      revenue = parseFloat(revenueResult?.total || 0)
    } catch {
      // Orders table might not exist yet
    }

    return NextResponse.json({
      success: true,
      data: {
        products: {
          total: parseInt(productsResult?.total || 0),
          active: parseInt(productsResult?.active || 0),
          deleted: parseInt(productsResult?.deleted || 0),
        },
        categories: {
          total: parseInt(categoriesResult?.total || 0),
          active: parseInt(categoriesResult?.active || 0),
          deleted: parseInt(categoriesResult?.deleted || 0),
        },
        orders: ordersResult,
        revenue: revenue,
        recentProducts: Array.isArray(recentProducts) ? recentProducts : [],
      },
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch statistics',
      },
      { status: 500 }
    )
  }
}

