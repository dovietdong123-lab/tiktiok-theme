import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Lấy danh sách sản phẩm từ database
    const products = await query(`
      SELECT 
        id,
        slug,
        name,
        price,
        regular_price,
        discount,
        image,
        sold,
        created_at
      FROM products
      WHERE status = 'active'
      ORDER BY created_at DESC
    `)

    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    
    // Fallback to mock data if database fails
    const mockProducts = [
      {
        id: 1,
        slug: 'san-pham-1',
        name: 'Sản phẩm 1',
        price: 99000,
        regular_price: 150000,
        discount: 34,
        image: 'https://via.placeholder.com/300',
        sold: 500,
      },
    ]
    
    return NextResponse.json({
      success: true,
      data: mockProducts,
      warning: 'Using mock data - database connection failed',
    })
  }
}

// POST - Tạo sản phẩm mới
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, price, regular_price, discount, image } = body

    const result = await query(
      `INSERT INTO products (name, price, regular_price, discount, image, status, created_at) 
       VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
      [name, price, regular_price || price, discount || 0, image || '']
    )

    return NextResponse.json({
      success: true,
      data: { id: (result as any).insertId },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create product',
      },
      { status: 500 }
    )
  }
}

