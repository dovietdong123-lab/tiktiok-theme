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

    return NextResponse.json({
      success: true,
      data: { id: (result as any).insertId },
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

