'use client'

import CategoryForm from '@/components/admin/CategoryForm'
import AdminLayout from '@/components/admin/AdminLayout'
import Toast from '@/components/admin/Toast'

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const { id } = params
  return (
    <AdminLayout title="Chỉnh sửa danh mục">
      <Toast />
      <CategoryForm categoryId={parseInt(id)} />
    </AdminLayout>
  )
}

