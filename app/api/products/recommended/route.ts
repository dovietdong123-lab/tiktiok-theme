import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Lấy sản phẩm đề xuất (random hoặc theo thuật toán)
    const products = await query(`
      SELECT 
        id,
        slug,
        name,
        price,
        regular_price as regular,
        discount,
        image
      FROM products
      WHERE status = 'active'
      ORDER BY RAND(), sold DESC
      LIMIT 6
    `)

    return NextResponse.json({
      success: true,
      data: Array.isArray(products) ? products : [],
    })
  } catch (error: any) {
    console.error('Error fetching recommended products:', error)
    
    // Fallback to mock data
    const mockRecommendedProducts = [
      {
        id: 4,
        slug: 'san-pham-de-xuat-1',
        name: 'Sản phẩm đề xuất 1',
        price: 89000,
        regular: 120000,
        discount: 26,
        image: 'https://via.placeholder.com/300',
      },
    ]
    
    return NextResponse.json({
      success: true,
      data: mockRecommendedProducts,
    })
  }
}

