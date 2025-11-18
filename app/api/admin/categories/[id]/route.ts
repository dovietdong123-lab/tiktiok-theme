import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET - Lấy chi tiết danh mục
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth() // Check authentication
  } catch (error: any) {
    console.error('Auth error in GET /api/admin/categories/[id]:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }
  try {
    const id = parseInt(params.id)

    const categories = await query('SELECT * FROM categories WHERE id = ?', [id])

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: categories[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch category',
      },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật danh mục
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth() // Check authentication
  } catch (error: any) {
    console.error('Auth error in PUT /api/admin/categories/[id]:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { name, slug, image, description, parent_id, status } = body

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

    // Check if slug exists (excluding current category)
    if (finalSlug) {
      const existing = await query('SELECT id FROM categories WHERE slug = ? AND id != ?', [
        finalSlug,
        id,
      ])
      if (Array.isArray(existing) && existing.length > 0) {
        finalSlug = `${finalSlug}-${Date.now()}`
      }
    }

    await query(
      `UPDATE categories SET
        name = ?,
        slug = ?,
        image = ?,
        description = ?,
        parent_id = ?,
        status = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [name, finalSlug, image || '', description || '', parent_id || null, status || 'active', id]
    )

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update category',
      },
      { status: 500 }
    )
  }
}

// DELETE - Xóa danh mục (soft delete)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth() // Check authentication
  } catch (error: any) {
    console.error('Auth error in DELETE /api/admin/categories/[id]:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }
  try {
    const id = parseInt(params.id)

    // Check if category has products
    const products = await query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [
      id,
    ])
    const count = (products as any[])[0]?.count || 0

    if (count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${count} products. Please remove products first.`,
        },
        { status: 400 }
      )
    }

    await query('UPDATE categories SET status = "deleted", updated_at = NOW() WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete category',
      },
      { status: 500 }
    )
  }
}

