import { query } from '@/lib/db'

export interface CouponRecord {
  id: number
  code: string
  description: string | null
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order_amount: number | null
  usage_limit: number | null
  usage_count: number
  start_date: Date | null
  end_date: Date | null
  status: 'active' | 'inactive'
  created_at: Date
  updated_at: Date
}

const baseCouponSelect = `
  SELECT id, code, description, discount_type, discount_value, min_order_amount,
         usage_limit, usage_count, start_date, end_date, status, created_at, updated_at
  FROM discount_coupons
`

const activeCouponWhere = `
  WHERE status = 'active'
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
    AND (usage_limit IS NULL OR usage_count < usage_limit)
`

const sanitizeCoupon = (coupon: any) => ({
  id: coupon.id,
  code: coupon.code,
  description: coupon.description,
  discount_type: coupon.discount_type,
  discount_value: Number(coupon.discount_value) || 0,
  min_order_amount: coupon.min_order_amount ? Number(coupon.min_order_amount) : null,
  usage_limit: coupon.usage_limit ? Number(coupon.usage_limit) : null,
  usage_count: Number(coupon.usage_count) || 0,
  start_date: coupon.start_date,
  end_date: coupon.end_date,
  status: coupon.status,
  created_at: coupon.created_at,
  updated_at: coupon.updated_at,
})

export async function fetchActiveCoupons() {
  const rows = await query(`${baseCouponSelect} ${activeCouponWhere} ORDER BY created_at DESC`)
  if (!Array.isArray(rows)) return []
  return rows.map(sanitizeCoupon)
}

export async function validateCouponCode(rawCode: string, subtotal: number) {
  if (!rawCode || !rawCode.trim()) {
    throw new Error('Vui lòng nhập mã giảm giá')
  }
  const code = rawCode.trim().toUpperCase()
  const rows = await query(`${baseCouponSelect} WHERE code = ?`, [code])
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Mã giảm giá không tồn tại')
  }
  const coupon = sanitizeCoupon(rows[0])

  if (coupon.status !== 'active') {
    throw new Error('Mã giảm giá đã bị tắt')
  }

  // Use database NOW() for consistent timezone comparison
  // Check dates using SQL to avoid timezone issues
  const nowCheck = await query(
    `SELECT 
      CASE 
        WHEN start_date IS NOT NULL AND start_date > NOW() THEN 'not_started'
        WHEN end_date IS NOT NULL AND end_date < NOW() THEN 'expired'
        ELSE 'valid'
      END as date_status
    FROM discount_coupons 
    WHERE code = ?`,
    [code]
  )
  
  if (Array.isArray(nowCheck) && nowCheck.length > 0) {
    const dateStatus = (nowCheck[0] as any).date_status
    if (dateStatus === 'not_started') {
      throw new Error('Mã giảm giá chưa bắt đầu')
    }
    if (dateStatus === 'expired') {
      throw new Error('Mã giảm giá đã hết hạn')
    }
  }

  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    throw new Error('Mã giảm giá đã được sử dụng hết')
  }

  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    throw new Error(
      `Đơn hàng phải từ ${coupon.min_order_amount.toLocaleString('vi-VN')}đ để dùng mã này`
    )
  }

  let discountAmount = 0
  if (coupon.discount_type === 'percent') {
    discountAmount = Math.min((subtotal * coupon.discount_value) / 100, subtotal)
  } else {
    discountAmount = Math.min(coupon.discount_value, subtotal)
  }

  const finalAmount = Math.max(0, subtotal - discountAmount)

  return {
    coupon,
    discountAmount,
    finalAmount,
  }
}

