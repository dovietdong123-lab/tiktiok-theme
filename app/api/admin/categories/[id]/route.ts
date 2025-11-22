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

// DELETE - Xóa danh mục (hard delete)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth() // Check authentication
  } catch (error: any) {
    console.error('Auth error in DELETE /api/admin/categories/[id]:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }
  try {
    // Validate and parse ID
    const id = parseInt(params.id)
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      )
    }

    // Check if category exists
    const categories = await query('SELECT id FROM categories WHERE id = ?', [id])
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has products
    const products = await query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [
      id,
    ])
    const count = Array.isArray(products) && products.length > 0 ? ((products[0] as any)?.count || 0) : 0

    if (count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Không thể xóa danh mục này vì có ${count} sản phẩm. Vui lòng xóa hoặc chuyển các sản phẩm trước.`,
        },
        { status: 400 }
      )
    }

    // Delete category
    const deleteResult = await query('DELETE FROM categories WHERE id = ?', [id])
    
    // Verify deletion was successful
    const verifyCategories = await query('SELECT id FROM categories WHERE id = ?', [id])
    if (Array.isArray(verifyCategories) && verifyCategories.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete category. Please try again.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    
    // Check if error is due to foreign key constraint
    if (error.message && (
      error.message.includes('foreign key constraint') ||
      error.message.includes('FOREIGN KEY') ||
      error.code === 'ER_ROW_IS_REFERENCED_2'
    )) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không thể xóa danh mục này vì đang được sử dụng.',
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete category',
      },
      { status: 500 }
    )
  }
}

