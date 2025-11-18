'use client'

import CategoryForm from '@/components/admin/CategoryForm'
import AdminLayout from '@/components/admin/AdminLayout'

export default function NewCategoryPage() {
  return (
    <AdminLayout title="Thêm danh mục mới">
      <CategoryForm />
    </AdminLayout>
  )
}

