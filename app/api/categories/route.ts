import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Lấy danh sách categories với số lượng sản phẩm
    const categories = await query(`
      SELECT 
        c.id as term_id,
        c.name,
        c.image,
        c.slug,
        COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id, c.name, c.image, c.slug
      ORDER BY c.name ASC
    `)

    // Format data
    const formattedCategories = (categories as any[]).map((cat: any) => ({
      term_id: cat.term_id,
      name: cat.name,
      image: cat.image || '/assets/img/not-img.jpg',
      count: parseInt(cat.count) || 0,
      slug: cat.slug,
    }))

    return NextResponse.json({
      success: true,
      data: formattedCategories,
    })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    
    // Fallback to mock data
    const mockCategories = [
      {
        term_id: 1,
        name: 'ÁO HOODIE - SWEATER',
        image: 'https://via.placeholder.com/100',
        count: 8,
      },
    ]
    
    return NextResponse.json({
      success: true,
      data: mockCategories,
      warning: 'Using mock data - database connection failed',
    })
  }
}

