'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import Toast from '@/components/admin/Toast'

type CouponStatus = 'active' | 'inactive'
type CouponType = 'percent' | 'fixed'

interface Coupon {
  id: number
  code: string
  description: string
  discount_type: CouponType
  discount_value: number
  min_order_amount: number | null
  usage_limit: number | null
  usage_count: number
  start_date: string | null
  end_date: string | null
  status: CouponStatus
  created_at: string
  updated_at: string
}

const initialFormState = {
  id: null as number | null,
  code: '',
  description: '',
  discount_type: 'percent' as CouponType,
  discount_value: '',
  min_order_amount: '',
  usage_limit: '',
  start_date: '',
  end_date: '',
  status: 'active' as CouponStatus,
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' as 'success' | 'error' })
  const [statusFilter, setStatusFilter] = useState<'all' | CouponStatus>('all')

  useEffect(() => {
    fetchCoupons(statusFilter)
  }, [statusFilter])

  const fetchCoupons = async (status: 'all' | CouponStatus) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      let url = '/api/admin/coupons'
      if (status !== 'all') {
        url += `?status=${status}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        if (response.status === 401) {
          window.location.href = '/admin/login'
          return
        }
        throw new Error(result.error || 'Không thể tải mã giảm giá')
      }

      setCoupons(result.data || [])
    } catch (error: any) {
      console.error('Error fetching coupons:', error)
      setCoupons([])
      setToast({ isOpen: true, message: error.message || 'Lỗi tải dữ liệu', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: coupon.min_order_amount ? String(coupon.min_order_amount) : '',
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
      start_date: coupon.start_date ? coupon.start_date.substring(0, 16) : '',
      end_date: coupon.end_date ? coupon.end_date.substring(0, 16) : '',
      status: coupon.status,
    })
  }

  const resetForm = () => {
    setFormData(initialFormState)
  }

  const handleDelete = async (couponId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể xóa mã giảm giá')
      }
      setToast({ isOpen: true, message: 'Đã xóa mã giảm giá', type: 'success' })
      fetchCoupons(statusFilter)
    } catch (error: any) {
      console.error('Error deleting coupon:', error)
      setToast({ isOpen: true, message: error.message || 'Lỗi xóa mã giảm giá', type: 'error' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || formData.code.trim().length < 3) {
      setToast({ isOpen: true, message: 'Mã giảm giá phải có ít nhất 3 ký tự', type: 'error' })
      return
    }
    if (!formData.discount_value || Number(formData.discount_value) <= 0) {
      setToast({ isOpen: true, message: 'Giá trị giảm giá không hợp lệ', type: 'error' })
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        code: formData.code,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
      }

      const url = formData.id ? `/api/admin/coupons/${formData.id}` : '/api/admin/coupons'
      const method = formData.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Không thể lưu mã giảm giá')
      }

      setToast({ isOpen: true, message: formData.id ? 'Đã cập nhật mã giảm giá' : 'Đã tạo mã giảm giá', type: 'success' })
      resetForm()
      fetchCoupons(statusFilter)
    } catch (error: any) {
      console.error('Error saving coupon:', error)
      setToast({ isOpen: true, message: error.message || 'Lỗi lưu mã giảm giá', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formattedCoupons = useMemo(
    () =>
      coupons.map((coupon) => ({
        ...coupon,
        createdLabel: new Date(coupon.created_at).toLocaleString('vi-VN'),
        usageText:
          coupon.usage_limit && coupon.usage_limit > 0
            ? `${coupon.usage_count}/${coupon.usage_limit}`
            : `${coupon.usage_count}`,
        discountLabel:
          coupon.discount_type === 'percent'
            ? `${coupon.discount_value}%`
            : `${Number(coupon.discount_value).toLocaleString('vi-VN')}đ`,
      })),
    [coupons]
  )

  return (
    <AdminLayout title="Mã giảm giá">
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {formData.id ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                  Mã giảm giá *
                  {!formData.id && (
                    <button
                      type="button"
                      className="text-xs text-blue-600"
                      onClick={() => {
                        const randomCode = `SALE${Math.random().toString(36).substring(2, 7).toUpperCase()}`
                        setFormData((prev) => ({ ...prev, code: randomCode }))
                      }}
                    >
                      Tạo ngẫu nhiên
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 uppercase"
                  placeholder="VD: SALE50"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="percent">% Theo phần trăm</option>
                    <option value="fixed">₫ Theo số tiền</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1">Giá trị *</label>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    min="1"
                    step="1"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu</label>
                  <input
                    type="number"
                    name="min_order_amount"
                    value={formData.min_order_amount}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Không bắt buộc"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1">Giới hạn sử dụng</label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={formData.usage_limit}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Không giới hạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã tắt</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                {formData.id && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    + Tạo mã mới
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSubmitting ? 'Đang lưu...' : formData.id ? 'Cập nhật' : 'Tạo mã giảm giá'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Danh sách mã giảm giá</h2>
              <p className="text-sm text-gray-500">Quản lý các mã giảm giá đang hoạt động</p>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | CouponStatus)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 md:w-60"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã tắt</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="rounded-xl border bg-white p-4 shadow animate-pulse">
                  <div className="h-5 w-32 bg-gray-200 rounded" />
                  <div className="mt-3 h-3 bg-gray-100 rounded" />
                  <div className="mt-3 h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : formattedCoupons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-gray-500">
              Chưa có mã giảm giá nào {statusFilter !== 'all' ? 'ở trạng thái này' : ''}.
            </div>
          ) : (
            <div className="space-y-4">
              {formattedCoupons.map((coupon) => (
                <div key={coupon.id} className="rounded-xl border bg-white shadow-sm p-4">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold tracking-wide text-gray-900">{coupon.code}</span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            coupon.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {coupon.status === 'active' ? 'Hoạt động' : 'Đã tắt'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{coupon.description || 'Không có mô tả'}</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">
                        Giảm: {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `${coupon.discount_value.toLocaleString('vi-VN')}đ`}
                      </p>
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <p>
                          Đơn tối thiểu:{' '}
                          {coupon.min_order_amount
                            ? `${coupon.min_order_amount.toLocaleString('vi-VN')}đ`
                            : 'Không yêu cầu'}
                        </p>
                        <p>Giới hạn: {coupon.usage_limit ? `${coupon.usage_count}/${coupon.usage_limit}` : `${coupon.usage_count} lần sử dụng`}</p>
                        <p>
                          Hiệu lực:{' '}
                          {coupon.start_date ? new Date(coupon.start_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}{' '}
                          - {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        onClick={() => handleEdit(coupon)}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

