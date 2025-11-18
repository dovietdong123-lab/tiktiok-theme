'use client'

import { useState, useEffect } from 'react'
import MediaLibrary from './MediaLibrary'
import Toast from './Toast'

interface CategoryFormProps {
  onSubmit?: (data: any) => void
  initialData?: any
  loading?: boolean
  categoryId?: number
}

export default function CategoryForm({ onSubmit, initialData, loading: externalLoading = false, categoryId }: CategoryFormProps) {
  const [loading, setLoading] = useState(externalLoading)
  const [fetchingData, setFetchingData] = useState(false)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    message: '',
    type: 'success',
  })
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    description: '',
    parent_id: '',
    status: 'active',
  })

  // Fetch category data when categoryId is provided
  useEffect(() => {
    if (categoryId && !initialData) {
      const fetchCategory = async () => {
        try {
          setFetchingData(true)
          const token = localStorage.getItem('admin_token') || document.cookie
            .split('; ')
            .find((row) => row.startsWith('admin_token='))
            ?.split('=')[1]

          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          }
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }

          const response = await fetch(`/api/admin/categories/${categoryId}`, {
            headers,
            credentials: 'include',
          })
          const result = await response.json()
          console.log('Category API response:', { status: response.status, result })
          if (response.ok && result.success) {
            const category = result.data
            setFormData({
              name: category.name || '',
              slug: category.slug || '',
              image: category.image || '',
              description: category.description || '',
              parent_id: category.parent_id || '',
              status: category.status || 'active',
            })
            console.log('Category loaded:', category.name)
          } else {
            console.error('Error fetching category:', result.error || 'Unknown error')
            if (response.status === 401) {
              window.location.href = '/admin/login'
            } else {
              setToast({ isOpen: true, message: 'Không thể tải dữ liệu danh mục: ' + (result.error || 'Unknown error'), type: 'error' })
            }
          }
        } catch (error) {
          console.error('Error fetching category:', error)
          setToast({ isOpen: true, message: 'Lỗi khi tải dữ liệu danh mục', type: 'error' })
        } finally {
          setFetchingData(false)
        }
      }
      fetchCategory()
    }
  }, [categoryId, initialData])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        // Get token from localStorage or cookie
        const token = localStorage.getItem('admin_token') || document.cookie
          .split('; ')
          .find((row) => row.startsWith('admin_token='))
          ?.split('=')[1]

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch('/api/admin/categories', {
          headers,
        })
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        image: initialData.image || '',
        description: initialData.description || '',
        parent_id: initialData.parent_id || '',
        status: initialData.status || 'active',
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Auto generate slug from name if empty
    let slug = formData.slug
    if (!slug && formData.name) {
      slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    const submitData = {
      ...formData,
      slug,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
    }

    // If onSubmit prop is provided, use it (for backward compatibility)
    if (onSubmit) {
      onSubmit(submitData)
      return
    }

    // Otherwise, handle submit automatically
    const handleAutoSubmit = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('admin_token') || document.cookie
          .split('; ')
          .find((row) => row.startsWith('admin_token='))
          ?.split('=')[1]

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const url = categoryId ? `/api/admin/categories/${categoryId}` : '/api/admin/categories'
        const method = categoryId ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers,
          credentials: 'include',
          body: JSON.stringify(submitData),
        })

        const result = await response.json()
        console.log('Submit response:', { status: response.status, result })

        if (response.ok && result.success) {
          const message = categoryId ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục thành công!'
          setToast({ isOpen: true, message, type: 'success' })
          // Delay redirect để toast kịp hiển thị
          setTimeout(() => {
            window.location.href = '/admin/categories'
          }, 1500)
        } else {
          setToast({ isOpen: true, message: 'Lỗi: ' + (result.error || 'Unknown error'), type: 'error' })
        }
      } catch (error) {
        console.error('Error submitting category:', error)
        setToast({ isOpen: true, message: 'Lỗi khi lưu danh mục', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    handleAutoSubmit()
  }

  if (fetchingData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">Đang tải dữ liệu danh mục...</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên danh mục *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="Tự động tạo từ tên"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ảnh danh mục
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowMediaLibrary(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  📚 Chọn từ thư viện
                </button>
                {formData.image && (
                  <span className="text-sm text-gray-600">✓ Đã chọn</span>
                )}
              </div>
              {formData.image && (
                <div className="mt-3">
                  <img src={formData.image} alt="Preview" className="w-32 h-32 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Xóa ảnh
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục cha
              </label>
              <select
                name="parent_id"
                value={formData.parent_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingCategories}
              >
                <option value="">-- Không có (Danh mục gốc) --</option>
                {categories
                  .filter((cat) => !initialData || cat.id !== initialData.id) // Loại trừ category hiện tại khi edit
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
              {loadingCategories && (
                <p className="text-xs text-gray-500 mt-1">Đang tải danh mục...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="deleted">Đã xóa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Mô tả</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <a
            href="/admin/categories"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </a>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(url) => setFormData((prev) => ({ ...prev, image: url }))}
      />

      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </form>
  )
}

