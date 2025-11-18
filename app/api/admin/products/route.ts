import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET - Lấy danh sách sản phẩm (admin)
export async function GET() {
  try {
    await requireAuth() // Check authentication
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const products = await query(`
      SELECT 
        id,
        name,
        slug,
        price,
        regular_price,
        discount,
        image,
        sold,
        status,
        featured,
        created_at
      FROM products
      ORDER BY created_at DESC
    `)

    // Convert to plain array if needed
    const productsArray = Array.isArray(products) ? products : []
    console.log('Products query result:', productsArray.length, 'items')

    return NextResponse.json({
      success: true,
      data: productsArray,
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch products',
      },
      { status: 500 }
    )
  }
}

// POST - Tạo sản phẩm mới
export async function POST(request: Request) {
  try {
    await requireAuth() // Check authentication
  } catch (error: any) {
    console.error('Auth error in POST /api/admin/products:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }
  try {
    const body = await request.json()
    const {
      name,
      slug,
      price,
      regular_price,
      discount,
      image,
      gallery,
      description,
      short_description,
      category_id,
      stock,
      featured,
      status,
      attributes,
      reviews,
    } = body

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and price are required',
        },
        { status: 400 }
      )
    }

    // Validate price
    const priceNum = Number(price)
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Price must be a positive number',
        },
        { status: 400 }
      )
    }

    // Validate discount
    if (discount !== undefined) {
      const discountNum = Number(discount)
      if (Number.isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
        return NextResponse.json(
          {
            success: false,
            error: 'Discount must be between 0 and 100',
          },
          { status: 400 }
        )
      }
    }

    // Validate stock
    if (stock !== undefined) {
      const stockNum = Number(stock)
      if (Number.isNaN(stockNum) || stockNum < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Stock must be a non-negative number',
          },
          { status: 400 }
        )
      }
    }

    // Auto generate slug if not provided
    let finalSlug = slug
    if (!finalSlug) {
      finalSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Check if slug exists
    const existing = await query('SELECT id FROM products WHERE slug = ?', [finalSlug])
    if (Array.isArray(existing) && existing.length > 0) {
      finalSlug = `${finalSlug}-${Date.now()}`
    }

    // Convert attributes array to JSON string
    const attributesJson = Array.isArray(attributes) && attributes.length > 0 ? JSON.stringify(attributes) : null

    const result = await query(
      `INSERT INTO products (
        name, slug, price, regular_price, discount, image, gallery, 
        description, short_description, category_id, stock, 
        featured, status, attributes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        finalSlug,
        price,
        regular_price || price,
        discount || 0,
        image || '',
        gallery || null,
        description || '',
        short_description || '',
        category_id || null,
        stock || 0,
        featured ? 1 : 0,
        status || 'active',
        attributesJson,
      ]
    )

    const productId = (result as any).insertId
    await insertReviews(productId, reviews)

    return NextResponse.json({
      success: true,
      data: { id: productId },
    })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create product',
      },
      { status: 500 }
    )
  }
}

async function insertReviews(productId: number, reviews: any) {
  if (!Array.isArray(reviews) || reviews.length === 0) return
  for (const review of reviews) {
    if (!review || (!review.user_name && !review.content)) continue
    const rating = Math.min(5, Math.max(1, Number(review.rating) || 5))
    const status =
      review.status === 'pending' || review.status === 'rejected' ? review.status : 'approved'
    await query(
      `INSERT INTO product_reviews (product_id, user_name, avatar, content, rating, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        productId,
        review.user_name || '',
        review.avatar || '',
        review.content || '',
        rating,
        status,
      ]
    )
  }
}

