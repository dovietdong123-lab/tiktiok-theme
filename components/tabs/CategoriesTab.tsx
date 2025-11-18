'use client'

import { useState, useEffect } from 'react'

interface CategoriesTabProps {
  isActive: boolean
}

interface Category {
  term_id: number
  name: string
  image?: string
  count?: number
}

export default function CategoriesTab({ isActive }: CategoriesTabProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isActive) {
      loadCategories()
    }
  }, [isActive])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isActive) {
    return (
      <div
        id="tab-categories"
        className="absolute inset-0 transform translate-x-full transition-transform duration-300 ease-in-out opacity-0 pointer-events-none"
      ></div>
    )
  }

  return (
    <div
      id="tab-categories"
      className="absolute inset-0 transform translate-x-0 transition-transform duration-300 ease-in-out z-10"
    >
      <div className="overflow-y-auto h-full divide-y">
        <div id="categories-list" className="overflow-y-auto h-full divide-y">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Đang tải...</div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Không có danh mục</div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.term_id}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  console.log('Clicked category:', cat.term_id)
                  // TODO: Navigate to category products
                }}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={cat.image || '/assets/img/not-img.jpg'}
                    className="w-12 h-12 rounded object-cover"
                    alt={cat.name}
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 text-sm">{cat.count || 0}</span>
                  <span className="text-gray-400">›</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

