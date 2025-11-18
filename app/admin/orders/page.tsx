'use client'

import AdminLayout from '@/components/admin/AdminLayout'

export default function OrdersPage() {
  return (
    <AdminLayout title="Đơn hàng">
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Danh sách đơn hàng sẽ được hiển thị ở đây.</p>
      </div>
    </AdminLayout>
  )
}

