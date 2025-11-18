import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Lấy sản phẩm nổi bật (featured = true)
    const products = await query(`
      SELECT 
        id,
        slug,
        name,
        price,
        regular_price as regular,
        discount,
        image,
        created_at
      FROM products
      WHERE featured = TRUE AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 3
    `)

    return NextResponse.json({
      success: true,
      data: Array.isArray(products) ? products : [],
    })
  } catch (error: any) {
    console.error('Error fetching featured products:', error)
    
    // Fallback to mock data
    const mockFeaturedProducts = [
      {
        id: 1,
        slug: 'san-pham-noi-bat-1',
        name: 'Sản phẩm nổi bật 1',
        price: 99000,
        regular: 150000,
        discount: 34,
        image: 'https://via.placeholder.com/300',
        created_at: new Date().toISOString(),
      },
    ]
    
    return NextResponse.json({
      success: false,
      data: mockFeaturedProducts,
      error: error.message,
    })
  }
}

