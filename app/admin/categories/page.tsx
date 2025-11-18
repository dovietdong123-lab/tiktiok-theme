'use client'

import { useState, useEffect } from 'react'
import CategoryTable from '@/components/admin/CategoryTable'
import AdminLayout from '@/components/admin/AdminLayout'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include', // Include cookies
      })
      const result = await response.json()
      console.log('Categories API response:', { status: response.status, result })
      if (response.ok && result.success) {
        setCategories(result.data || [])
        console.log('Categories loaded:', result.data?.length || 0)
      } else {
        console.error('Error fetching categories:', result.error || 'Unknown error')
        if (response.status === 401) {
          console.error('Unauthorized - Please login again')
          // Redirect to login if unauthorized
          window.location.href = '/admin/login'
        }
        setCategories([])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchCategories()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Danh mục">
        <div className="text-center py-8">Đang tải...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Danh mục">
      <div className="mb-4">
        <a
          href="/admin/categories/new"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Thêm danh mục mới
        </a>
      </div>
      <CategoryTable categories={categories} onDelete={handleDelete} />
    </AdminLayout>
  )
}

