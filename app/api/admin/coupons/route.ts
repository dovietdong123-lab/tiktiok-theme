import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const parseNumber = (value: any) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const allowedStatus = new Set(['active', 'inactive'])
const allowedTypes = new Set(['percent', 'fixed'])

export async function GET(request: Request) {
  try {
    await requireAuth()
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let sql = `
      SELECT id, code, description, discount_type, discount_value, min_order_amount,
             usage_limit, usage_count, start_date, end_date, status, created_at, updated_at
      FROM discount_coupons
    `

    const params: any[] = []
    if (status && allowedStatus.has(status)) {
      sql += ' WHERE status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC'
    const coupons = await query(sql, params)

    return NextResponse.json({ success: true, data: coupons || [] })
  } catch (error: any) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth()
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Unauthorized - ' + (error.message || 'Invalid session') }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      code,
      description,
      discount_type = 'percent',
      discount_value,
      min_order_amount,
      usage_limit,
      start_date,
      end_date,
      status = 'active',
    } = body

    if (!code || typeof code !== 'string' || code.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Mã giảm giá phải có ít nhất 3 ký tự' }, { status: 400 })
    }

    if (!allowedTypes.has(discount_type)) {
      return NextResponse.json({ success: false, error: 'Loại giảm giá không hợp lệ' }, { status: 400 })
    }

    const discountValueNum = parseNumber(discount_value)
    if (!discountValueNum || discountValueNum <= 0) {
      return NextResponse.json({ success: false, error: 'Giá trị giảm giá không hợp lệ' }, { status: 400 })
    }

    if (discount_type === 'percent' && discountValueNum > 100) {
      return NextResponse.json({ success: false, error: 'Giảm giá phần trăm tối đa 100%' }, { status: 400 })
    }

    if (!allowedStatus.has(status)) {
      return NextResponse.json({ success: false, error: 'Trạng thái không hợp lệ' }, { status: 400 })
    }

    const existing = await query('SELECT id FROM discount_coupons WHERE code = ?', [code.trim()])
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ success: false, error: 'Mã giảm giá đã tồn tại' }, { status: 400 })
    }

    await query(
      `INSERT INTO discount_coupons (
        code, description, discount_type, discount_value, min_order_amount,
        usage_limit, start_date, end_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.trim().toUpperCase(),
        description || '',
        discount_type,
        discountValueNum,
        parseNumber(min_order_amount),
        usage_limit ? parseInt(usage_limit, 10) : null,
        start_date ? new Date(start_date) : null,
        end_date ? new Date(end_date) : null,
        status,
      ]
    )

    return NextResponse.json({ success: true, message: 'Đã tạo mã giảm giá' })
  } catch (error: any) {
    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Không thể tạo mã giảm giá' },
      { status: 500 }
    )
  }
}

