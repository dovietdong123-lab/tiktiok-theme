import { NextResponse } from 'next/server'
import { query, getPool } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import type { PoolConnection } from 'mysql2/promise'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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

    const reviews = await query(
      `SELECT id, user_name, avatar, content, rating, status, gallery, created_at
       FROM product_reviews
       WHERE product_id = ?
       ORDER BY created_at DESC`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        reviews: Array.isArray(reviews)
          ? reviews.map((review: any) => ({
              ...review,
              images: parseReviewGallery(review.gallery),
            }))
          : [],
      },
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
      reviews,
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

    // Convert gallery to JSON string if it's an array
    let galleryJson = gallery
    if (Array.isArray(gallery)) {
      galleryJson = JSON.stringify(gallery)
    }

    // Convert attributes array to JSON string
    const attributesJson = Array.isArray(attributes) && attributes.length > 0 ? JSON.stringify(attributes) : null

    // Use transaction to ensure atomicity
    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()

      await connection.execute(
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
          galleryJson || null,
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

      // Delete old reviews
      await connection.execute('DELETE FROM product_reviews WHERE product_id = ?', [id])
      
      // Insert new reviews
      await insertReviewsWithConnection(connection, id, reviews)

      await connection.commit()
    } catch (error: any) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

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

async function insertReviews(productId: number, reviews: any) {
  if (!Array.isArray(reviews) || reviews.length === 0) return
  for (const review of reviews) {
    if (!review || (!review.user_name && !review.content)) continue
    const rating = Math.min(5, Math.max(1, Number(review.rating) || 5))
    const status =
      review.status === 'pending' || review.status === 'rejected' ? review.status : 'approved'
    const galleryJson = normalizeReviewGallery(review.images)
    await query(
      `INSERT INTO product_reviews (product_id, user_name, avatar, content, rating, status, gallery, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        productId,
        review.user_name || '',
        review.avatar || '',
        review.content || '',
        rating,
        status,
        galleryJson,
      ]
    )
  }
}

async function insertReviewsWithConnection(connection: PoolConnection, productId: number, reviews: any) {
  if (!Array.isArray(reviews) || reviews.length === 0) return
  for (const review of reviews) {
    if (!review || (!review.user_name && !review.content)) continue
    const rating = Math.min(5, Math.max(1, Number(review.rating) || 5))
    const status =
      review.status === 'pending' || review.status === 'rejected' ? review.status : 'approved'
    const galleryJson = normalizeReviewGallery(review.images)
    await connection.execute(
      `INSERT INTO product_reviews (product_id, user_name, avatar, content, rating, status, gallery, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        productId,
        review.user_name || '',
        review.avatar || '',
        review.content || '',
        rating,
        status,
        galleryJson,
      ]
    )
  }
}

function normalizeReviewGallery(images: any): string | null {
  if (Array.isArray(images)) {
    const filtered = images
      .filter((url) => typeof url === 'string' && url.trim() !== '')
      .map((url) => url.trim())
    return filtered.length ? JSON.stringify(filtered) : null
  }
  if (typeof images === 'string' && images.trim() !== '') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) {
        const filtered = parsed
          .filter((url: any) => typeof url === 'string' && url.trim() !== '')
          .map((url: string) => url.trim())
        return filtered.length ? JSON.stringify(filtered) : null
      }
    } catch {
      return JSON.stringify([images.trim()])
    }
  }
  return null
}

function parseReviewGallery(gallery: any): string[] {
  if (!gallery) return []
  if (Array.isArray(gallery)) {
    return gallery.filter((url) => typeof url === 'string' && url.trim() !== '').map((url) => url.trim())
  }
  if (typeof gallery === 'string') {
    try {
      const parsed = JSON.parse(gallery)
      if (Array.isArray(parsed)) {
        return parsed.filter((url: any) => typeof url === 'string' && url.trim() !== '').map((url: string) => url.trim())
      }
    } catch {
      return gallery.trim() ? [gallery.trim()] : []
    }
  }
  return []
}

