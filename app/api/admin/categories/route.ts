import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Lấy danh sách danh mục (admin)
export async function GET() {
  try {
    await requireAuth() // Check authentication
  } catch (error: any) {
    console.error('Auth error in GET /api/admin/categories:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }
  try {
    const categories = await query(`
      SELECT 
        id,
        name,
        slug,
        image,
        description,
        parent_id,
        status,
        created_at
      FROM categories
      ORDER BY name ASC
    `)

    // Convert to plain array if needed
    const categoriesArray = Array.isArray(categories) ? categories : []
    console.log('Categories query result:', categoriesArray.length, 'items')

    return NextResponse.json({
      success: true,
      data: categoriesArray,
    })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch categories',
      },
      { status: 500 }
    )
  }
}

// POST - Tạo danh mục mới
export async function POST(request: Request) {
  try {
    await requireAuth() // Check authentication
  } catch (error: any) {
    console.error('Auth error in POST /api/admin/categories:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { name, slug, image, description, parent_id, status } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required',
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
    const existing = await query('SELECT id FROM categories WHERE slug = ?', [finalSlug])
    if (Array.isArray(existing) && existing.length > 0) {
      finalSlug = `${finalSlug}-${Date.now()}`
    }

    const result = await query(
      `INSERT INTO categories (name, slug, image, description, parent_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [name, finalSlug, image || '', description || '', parent_id || null, status || 'active']
    )

    return NextResponse.json({
      success: true,
      data: { id: (result as any).insertId },
    })
  } catch (error: any) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create category',
      },
      { status: 500 }
    )
  }
}

