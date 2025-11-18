'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import Toast from '@/components/admin/Toast'

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  return (
    <AdminLayout title={`Đơn hàng #${id}`}>
      <Toast />
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Chi tiết đơn hàng sẽ được hiển thị ở đây.</p>
      </div>
    </AdminLayout>
  )
}

