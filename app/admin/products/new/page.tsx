'use client'

import ProductForm from '@/components/admin/ProductForm'
import AdminLayout from '@/components/admin/AdminLayout'
import Toast from '@/components/admin/Toast'

export default function NewProductPage() {
  return (
    <AdminLayout title="Thêm sản phẩm mới">
      <Toast />
      <ProductForm />
    </AdminLayout>
  )
}

