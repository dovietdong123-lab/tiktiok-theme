'use client'

import { useState, useEffect } from 'react'
import ProductTable from '@/components/admin/ProductTable'
import AdminLayout from '@/components/admin/AdminLayout'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include', // Include cookies
      })
      const result = await response.json()
      console.log('Products API response:', { status: response.status, result })
      if (response.ok && result.success) {
        setProducts(result.data || [])
        console.log('Products loaded:', result.data?.length || 0)
      } else {
        console.error('Error fetching products:', result.error || 'Unknown error')
        if (response.status === 401) {
          console.error('Unauthorized - Please login again')
          // Redirect to login if unauthorized
          window.location.href = '/admin/login'
        }
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchProducts()
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Sản phẩm">
        <div className="text-center py-8">Đang tải...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Sản phẩm">
      <div className="mb-4">
        <a
          href="/admin/products/new"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Thêm sản phẩm mới
        </a>
      </div>
      <ProductTable products={products} onDelete={handleDelete} />
    </AdminLayout>
  )
}

