'use client'

import { useState, useEffect } from 'react'

interface CategoriesTabProps {
  isActive: boolean
  onCategorySelect?: (category: Category) => void
  activeCategoryId?: number | null
}

interface Category {
  term_id: number
  name: string
  image?: string
  count?: number
  slug?: string
}

export default function CategoriesTab({ isActive, onCategorySelect, activeCategoryId }: CategoriesTabProps) {
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
        className="transform translate-x-full transition-transform duration-300 ease-in-out opacity-0 pointer-events-none"
      ></div>
    )
  }

  return (
    <div
      id="tab-categories"
      className="transform translate-x-0 transition-transform duration-300 ease-in-out z-10"
    >
      <div className="overflow-y-auto h-full divide-y">
        <div id="categories-list" className="overflow-y-auto h-full divide-y">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded bg-white shadow-sm animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded bg-gray-200" />
                    <div>
                      <div className="w-32 h-3 bg-gray-200 rounded" />
                      <div className="w-20 h-3 bg-gray-100 rounded mt-2" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-3 bg-gray-200 rounded" />
                    <div className="w-2 h-4 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Không có danh mục</div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.term_id}
                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                  activeCategoryId === cat.term_id ? 'bg-gray-100' : ''
                }`}
                onClick={() => {
                  onCategorySelect?.(cat)
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

