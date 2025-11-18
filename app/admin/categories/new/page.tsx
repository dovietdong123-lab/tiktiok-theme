'use client'

import CategoryForm from '@/components/admin/CategoryForm'
import AdminLayout from '@/components/admin/AdminLayout'
import Toast from '@/components/admin/Toast'

export default function NewCategoryPage() {
  return (
    <AdminLayout title="Thêm danh mục mới">
      <Toast />
      <CategoryForm />
    </AdminLayout>
  )
}

