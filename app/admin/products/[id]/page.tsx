'use client'

import ProductForm from '@/components/admin/ProductForm'
import AdminLayout from '@/components/admin/AdminLayout'
import Toast from '@/components/admin/Toast'

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params
  return (
    <AdminLayout title="Chỉnh sửa sản phẩm">
      <Toast />
      <ProductForm productId={parseInt(id)} />
    </AdminLayout>
  )
}

