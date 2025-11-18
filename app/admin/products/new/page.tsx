'use client'

import ProductForm from '@/components/admin/ProductForm'
import AdminLayout from '@/components/admin/AdminLayout'

export default function NewProductPage() {
  return (
    <AdminLayout title="Thêm sản phẩm mới">
      <ProductForm />
    </AdminLayout>
  )
}

