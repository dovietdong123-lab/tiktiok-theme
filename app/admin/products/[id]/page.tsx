'use client'

import ProductForm from '@/components/admin/ProductForm'
import AdminLayout from '@/components/admin/AdminLayout'

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params
  return (
    <AdminLayout title="Chỉnh sửa sản phẩm">
      <ProductForm productId={parseInt(id)} />
    </AdminLayout>
  )
}

