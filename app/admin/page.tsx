'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'

type StatsData = {
  products: { total: number; active: number; deleted: number }
  categories: { total: number; active: number; deleted: number }
  orders: { total: number; today: number; pending: number }
  revenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem('admin_token')
        if (!token) {
          setError('Bạn cần đăng nhập lại.')
          setLoading(false)
          return
        }

        const res = await fetch('/api/admin/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const json = await res.json()

        if (!res.ok || !json.success) {
          setError(json.error || 'Không thể tải dữ liệu thống kê.')
        } else {
          setStats(json.data as StatsData)
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải dữ liệu thống kê.')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">Đang tải dữ liệu thống kê...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Tổng sản phẩm</h2>
              <p className="text-3xl font-bold text-blue-600">{stats?.products.total ?? 0}</p>
              <p className="text-xs text-gray-500 mt-2">
                Hoạt động: {stats?.products.active ?? 0} · Đã xoá: {stats?.products.deleted ?? 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Tổng danh mục</h2>
              <p className="text-3xl font-bold text-purple-600">{stats?.categories.total ?? 0}</p>
              <p className="text-xs text-gray-500 mt-2">
                Hoạt động: {stats?.categories.active ?? 0} · Đã xoá: {stats?.categories.deleted ?? 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Tổng đơn hàng</h2>
              <p className="text-3xl font-bold text-green-600">{stats?.orders.total ?? 0}</p>
              <p className="text-xs text-gray-500 mt-2">
                Hôm nay: {stats?.orders.today ?? 0} · Chờ xử lý: {stats?.orders.pending ?? 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Doanh thu</h2>
              <p className="text-3xl font-bold text-rose-600">
                {(stats?.revenue ?? 0).toLocaleString('vi-VN')} <span className="text-base">đ</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
