import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search') || searchParams.get('q')
    const categoryIdParam = searchParams.get('category') || searchParams.get('category_id')
    const categorySlug = searchParams.get('category_slug')

    const whereClauses: string[] = [`status = 'active'`]
    const params: any[] = []

    if (searchQuery && searchQuery.trim()) {
      const likeQuery = `%${searchQuery.trim()}%`
      whereClauses.push('(name LIKE ? OR slug LIKE ?)')
      params.push(likeQuery, likeQuery)
    }

    if (categoryIdParam) {
      const categoryId = Number(categoryIdParam)
      if (!Number.isNaN(categoryId)) {
        whereClauses.push('category_id = ?')
        params.push(categoryId)
      }
    } else if (categorySlug && categorySlug.trim()) {
      whereClauses.push('category_id = (SELECT id FROM categories WHERE slug = ? LIMIT 1)')
      params.push(categorySlug.trim())
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const products = await query(
      `
      SELECT 
        id,
        slug,
        name,
        price,
        regular_price,
        discount,
        image,
        sold,
        created_at,
        attributes
      FROM products
      ${whereSql}
      ORDER BY created_at DESC
    `,
      params
    )

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
        attributes: null,
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

