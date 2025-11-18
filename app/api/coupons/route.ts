import { NextResponse } from 'next/server'
import { fetchActiveCoupons, validateCouponCode } from '@/lib/coupons'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const coupons = await fetchActiveCoupons()
    return NextResponse.json({ success: true, data: coupons })
  } catch (error: any) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Không thể tải mã giảm giá' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, subtotal } = body

    if (subtotal === undefined || Number(subtotal) < 0) {
      return NextResponse.json(
        { success: false, error: 'Tổng đơn hàng không hợp lệ' },
        { status: 400 }
      )
    }

    const result = await validateCouponCode(code, Number(subtotal))

    return NextResponse.json({
      success: true,
      data: {
        coupon: result.coupon,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      },
    })
  } catch (error: any) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Không thể áp dụng mã giảm giá' },
      { status: 400 }
    )
  }
}

