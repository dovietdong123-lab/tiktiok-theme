import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const allowedStatus = new Set(['active', 'inactive'])
const allowedTypes = new Set(['percent', 'fixed'])

const parseNumber = (value: any) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

async function ensureAuth() {
  try {
    await requireAuth()
  } catch (error: any) {
    throw new Error('Unauthorized - ' + (error.message || 'Invalid session'))
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureAuth()
    const id = parseInt(params.id, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 })
    }

    const coupons = await query('SELECT * FROM discount_coupons WHERE id = ?', [id])
    if (!Array.isArray(coupons) || coupons.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy mã giảm giá' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: coupons[0] })
  } catch (error: any) {
    if (error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 })
    }

    console.error('Error fetching coupon:', error)
    return NextResponse.json({ success: false, error: 'Không thể tải mã giảm giá' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureAuth()
    const id = parseInt(params.id, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 })
    }

    const body = await request.json()
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      usage_limit,
      start_date,
      end_date,
      status,
    } = body

    if (code && (typeof code !== 'string' || code.trim().length < 3)) {
      return NextResponse.json({ success: false, error: 'Mã giảm giá phải có ít nhất 3 ký tự' }, { status: 400 })
    }

    if (discount_type && !allowedTypes.has(discount_type)) {
      return NextResponse.json({ success: false, error: 'Loại giảm giá không hợp lệ' }, { status: 400 })
    }

    const discountValueNum = discount_value !== undefined ? parseNumber(discount_value) : null
    if (discount_value !== undefined && (!discountValueNum || discountValueNum <= 0)) {
      return NextResponse.json({ success: false, error: 'Giá trị giảm giá không hợp lệ' }, { status: 400 })
    }

    if (discount_type === 'percent' && discountValueNum && discountValueNum > 100) {
      return NextResponse.json({ success: false, error: 'Giảm giá phần trăm tối đa 100%' }, { status: 400 })
    }

    if (status && !allowedStatus.has(status)) {
      return NextResponse.json({ success: false, error: 'Trạng thái không hợp lệ' }, { status: 400 })
    }

    if (code) {
      const dupCheck = await query('SELECT id FROM discount_coupons WHERE code = ? AND id != ?', [
        code.trim().toUpperCase(),
        id,
      ])
      if (Array.isArray(dupCheck) && dupCheck.length > 0) {
        return NextResponse.json({ success: false, error: 'Mã giảm giá đã tồn tại' }, { status: 400 })
      }
    }

    const fields: string[] = []
    const paramsToUpdate: any[] = []

    if (code) {
      fields.push('code = ?')
      paramsToUpdate.push(code.trim().toUpperCase())
    }
    if (description !== undefined) {
      fields.push('description = ?')
      paramsToUpdate.push(description || '')
    }
    if (discount_type) {
      fields.push('discount_type = ?')
      paramsToUpdate.push(discount_type)
    }
    if (discount_value !== undefined) {
      fields.push('discount_value = ?')
      paramsToUpdate.push(discountValueNum)
    }
    if (min_order_amount !== undefined) {
      fields.push('min_order_amount = ?')
      paramsToUpdate.push(parseNumber(min_order_amount))
    }
    if (usage_limit !== undefined) {
      fields.push('usage_limit = ?')
      paramsToUpdate.push(usage_limit ? parseInt(usage_limit, 10) : null)
    }
    if (start_date !== undefined) {
      fields.push('start_date = ?')
      paramsToUpdate.push(start_date ? new Date(start_date) : null)
    }
    if (end_date !== undefined) {
      fields.push('end_date = ?')
      paramsToUpdate.push(end_date ? new Date(end_date) : null)
    }
    if (status) {
      fields.push('status = ?')
      paramsToUpdate.push(status)
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: 'Không có dữ liệu cập nhật' }, { status: 400 })
    }

    fields.push('updated_at = NOW()')
    const sql = `UPDATE discount_coupons SET ${fields.join(', ')} WHERE id = ?`
    paramsToUpdate.push(id)

    await query(sql, paramsToUpdate)

    return NextResponse.json({ success: true, message: 'Đã cập nhật mã giảm giá' })
  } catch (error: any) {
    if (error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 })
    }
    console.error('Error updating coupon:', error)
    return NextResponse.json({ success: false, error: 'Không thể cập nhật mã giảm giá' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureAuth()
    const id = parseInt(params.id, 10)
    if (Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 })
    }

    // Soft delete instead of hard delete to preserve data
    await query('UPDATE discount_coupons SET status = ?, updated_at = NOW() WHERE id = ?', ['inactive', id])

    return NextResponse.json({ success: true, message: 'Đã xóa mã giảm giá' })
  } catch (error: any) {
    if (error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 })
    }
    console.error('Error deleting coupon:', error)
    return NextResponse.json({ success: false, error: 'Không thể xóa mã giảm giá' }, { status: 500 })
  }
}

