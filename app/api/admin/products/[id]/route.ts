import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Lấy chi tiết sản phẩm
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth() // Check authentication
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const id = parseInt(params.id)

    const products = await query('SELECT * FROM products WHERE id = ?', [id])

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      )
    }

    const product = products[0] as any

    // Parse gallery if it's JSON string
    if (product.gallery && typeof product.gallery === 'string') {
      try {
        product.gallery = JSON.parse(product.gallery)
      } catch {
        product.gallery = []
      }
    }

    // Parse attributes if it's a JSON string
    if (product.attributes && typeof product.attributes === 'string') {
      try {
        product.attributes = JSON.parse(product.attributes)
      } catch {
        product.attributes = []
      }
    } else if (!product.attributes) {
      product.attributes = []
    }

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch product',
      },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật sản phẩm
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth() // Check authentication
  } catch (error: any) {
    console.error('Auth error in PUT /api/admin/products/[id]:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }
  try {
    const id = parseInt(params.id)
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

    // Auto generate slug if not provided
    let finalSlug = slug
    if (!finalSlug && name) {
      finalSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Check if slug exists (excluding current product)
    if (finalSlug) {
      const existing = await query('SELECT id FROM products WHERE slug = ? AND id != ?', [
        finalSlug,
        id,
      ])
      if (Array.isArray(existing) && existing.length > 0) {
        finalSlug = `${finalSlug}-${Date.now()}`
      }
    }

    // Convert attributes array to JSON string
    const attributesJson = Array.isArray(attributes) && attributes.length > 0 ? JSON.stringify(attributes) : null

    await query(
      `UPDATE products SET
        name = ?,
        slug = ?,
        price = ?,
        regular_price = ?,
        discount = ?,
        image = ?,
        gallery = ?,
        description = ?,
        short_description = ?,
        category_id = ?,
        stock = ?,
        featured = ?,
        status = ?,
        attributes = ?,
        updated_at = NOW()
      WHERE id = ?`,
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
        id,
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update product',
      },
      { status: 500 }
    )
  }
}

// DELETE - Xóa sản phẩm (soft delete)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth() // Check authentication
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const id = parseInt(params.id)

    await query('UPDATE products SET status = "deleted", updated_at = NOW() WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete product',
      },
      { status: 500 }
    )
  }
}

