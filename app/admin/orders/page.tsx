'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import Toast from '@/components/admin/Toast'

export default function OrdersPage() {
  return (
    <AdminLayout title="Đơn hàng">
      <Toast />
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Danh sách đơn hàng sẽ được hiển thị ở đây.</p>
      </div>
    </AdminLayout>
  )
}

