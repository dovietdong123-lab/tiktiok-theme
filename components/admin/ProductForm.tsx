'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import MediaLibrary from './MediaLibrary'
import MediaDisplay from './MediaDisplay'
import Toast from './Toast'

// Dynamic import ReactQuillEditor để tránh SSR issues
const ReactQuillEditor = dynamic(() => import('./ReactQuillEditor'), { 
  ssr: false,
  loading: () => <div className="rounded-lg bg-white p-4 border border-gray-300" style={{ minHeight: '200px' }}><p className="text-gray-500">Đang tải editor...</p></div>
})

interface ProductFormProps {
  onSubmit?: (data: any) => void
  initialData?: any
  loading?: boolean
  productId?: number
}

type ReviewForm = {
  id?: number
  user_name: string
  avatar: string
  rating: number
  content: string
  status: 'pending' | 'approved' | 'rejected'
  images: string[]
}

type AttributeValueForm = {
  value: string
  image?: string
  color?: string
  size?: string
  price?: string
  regular?: string
  discount?: string
}

type AttributeForm = {
  name: string
  values: AttributeValueForm[]
}

const toInputString = (value: any) => {
  if (value === undefined || value === null) return ''
  return String(value)
}

const normalizeAttributeValues = (values: any): AttributeValueForm[] => {
  if (!Array.isArray(values)) return []
  return values.map((rawValue: any) => {
    if (typeof rawValue === 'string') {
      return {
        value: rawValue,
        image: '',
        color: '',
        size: '',
        price: '',
        regular: '',
        discount: '',
      }
    }

    const valueObj = rawValue || {}

    const priceNumber = parseNumberField(valueObj.price)
    const regularNumber = parseNumberField(valueObj.regular)
    let discountNumber = parseNumberField(valueObj.discount)

    if (
      (discountNumber === undefined || !Number.isFinite(discountNumber)) &&
      priceNumber !== undefined &&
      regularNumber !== undefined &&
      regularNumber > 0 &&
      priceNumber < regularNumber
    ) {
      discountNumber = Math.round(((regularNumber - priceNumber) / regularNumber) * 100)
    }

    return {
      value: valueObj.value || '',
      image: valueObj.image || '',
      color: valueObj.color || '',
      size: valueObj.size || '',
      price: priceNumber !== undefined ? toInputString(valueObj.price ?? '') : '',
      regular: regularNumber !== undefined ? toInputString(valueObj.regular ?? '') : '',
      discount: discountNumber !== undefined ? toInputString(discountNumber) : '',
    }
  })
}

const normalizeAttributesField = (attributesData: any): AttributeForm[] => {
  if (!attributesData) return []

  const mapAttributes = (arr: any[]) =>
    arr.map((attr: any) => ({
      name: attr?.name || '',
      values: normalizeAttributeValues(attr?.values || []),
    }))

  if (Array.isArray(attributesData)) {
    return mapAttributes(attributesData)
  }

  if (typeof attributesData === 'string') {
    try {
      const parsed = JSON.parse(attributesData)
      return Array.isArray(parsed) ? mapAttributes(parsed) : []
    } catch {
      return []
    }
  }

  return []
}

const parseNumberField = (value: string | number | undefined | null) => {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : undefined
}

const computeDiscountFromStrings = (priceStr?: string, regularStr?: string) => {
  const price = parseNumberField(priceStr ?? '')
  const regular = parseNumberField(regularStr ?? '')
  if (
    price === undefined ||
    regular === undefined ||
    !Number.isFinite(price) ||
    !Number.isFinite(regular) ||
    regular <= 0 ||
    price >= regular
  ) {
    return ''
  }
  return String(Math.round(((regular - price) / regular) * 100))
}

export default function ProductForm({ onSubmit, initialData, loading: externalLoading = false, productId }: ProductFormProps) {
  const [loading, setLoading] = useState(externalLoading)
  const [fetchingData, setFetchingData] = useState(false)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [showGalleryLibrary, setShowGalleryLibrary] = useState(false)
  const [showReviewMediaLibrary, setShowReviewMediaLibrary] = useState(false)
const [reviewMediaIndex, setReviewMediaIndex] = useState<number | null>(null)
const [reviewMediaType, setReviewMediaType] = useState<'avatar' | 'gallery'>('avatar')
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
    price: '',
    regular_price: '',
    discount: 0,
    image: '',
    gallery: '',
    description: '',
    short_description: '',
    category_id: '',
    stock: 0,
    featured: false,
    status: 'active',
    attributes: [] as Array<AttributeForm>,
    reviews: [] as Array<{
      id?: number
      user_name: string
      avatar: string
      rating: number
      content: string
      status: 'pending' | 'approved' | 'rejected'
      images: string[]
    }>,
  })

  const parseReviewImages = (value: any): string[] => {
    if (!value) return []
    if (Array.isArray(value)) {
      return value.filter((url) => typeof url === 'string' && url.trim() !== '').map((url) => url.trim())
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return parsed.filter((url) => typeof url === 'string' && url.trim() !== '').map((url) => url.trim())
        }
      } catch {
        return value.trim() ? [value.trim()] : []
      }
    }
    return []
  }

  const normalizeReviews = (reviews: any): ReviewForm[] => {
    if (!Array.isArray(reviews)) return []
    return reviews.map((review: any) => ({
      id: review.id,
      user_name: review.user_name || '',
      avatar: review.avatar || '',
      rating: review.rating || 5,
      content: review.content || '',
      status: review.status || 'approved',
      images: parseReviewImages(review.images || review.gallery),
    }))
  }

  // Fetch product data when productId is provided
  useEffect(() => {
    if (productId && !initialData) {
      const fetchProduct = async () => {
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

          const response = await fetch(`/api/admin/products/${productId}`, {
            headers,
            credentials: 'include',
          })
          const result = await response.json()
          console.log('Product API response:', { status: response.status, result })
          if (response.ok && result.success) {
            const product = result.data
            // Tính discount tự động từ price và regular_price
            const price = parseFloat(product.price) || 0
            const regularPrice = parseFloat(product.regular_price) || price
            let discount = 0
            if (regularPrice > 0 && price < regularPrice) {
              discount = Math.round(((regularPrice - price) / regularPrice) * 100)
            }

            setFormData({
              name: product.name || '',
              slug: product.slug || '',
              price: product.price || '',
              regular_price: product.regular_price || '',
              discount: discount,
              image: product.image || '',
              gallery: Array.isArray(product.gallery)
                ? JSON.stringify(product.gallery)
                : typeof product.gallery === 'string' && product.gallery.startsWith('[')
                ? product.gallery
                : product.gallery || '',
              description: product.description || '',
              short_description: product.short_description || '',
              category_id: product.category_id || '',
              stock: product.stock || 0,
              featured: product.featured || false,
              status: product.status || 'active',
              attributes: normalizeAttributesField(product.attributes),
              reviews: normalizeReviews(product.reviews),
            })
            console.log('Product loaded:', product.name)
          } else {
            console.error('Error fetching product:', result.error || 'Unknown error')
            if (response.status === 401) {
              window.location.href = '/admin/login'
            } else {
              setToast({ isOpen: true, message: 'Không thể tải dữ liệu sản phẩm: ' + (result.error || 'Unknown error'), type: 'error' })
            }
          }
        } catch (error) {
          console.error('Error fetching product:', error)
          setToast({ isOpen: true, message: 'Lỗi khi tải dữ liệu sản phẩm', type: 'error' })
        } finally {
          setFetchingData(false)
        }
      }
      fetchProduct()
    }
  }, [productId, initialData])

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
      // Tính discount tự động từ price và regular_price
      const price = parseFloat(initialData.price) || 0
      const regularPrice = parseFloat(initialData.regular_price) || price
      let discount = 0
      if (regularPrice > 0 && price < regularPrice) {
        discount = Math.round(((regularPrice - price) / regularPrice) * 100)
      }

      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        price: initialData.price || '',
        regular_price: initialData.regular_price || '',
        discount: discount,
        image: initialData.image || '',
        gallery: Array.isArray(initialData.gallery)
          ? JSON.stringify(initialData.gallery)
          : typeof initialData.gallery === 'string' && initialData.gallery.startsWith('[')
          ? initialData.gallery
          : initialData.gallery || '',
        description: initialData.description || '',
        short_description: initialData.short_description || '',
        category_id: initialData.category_id || '',
        stock: initialData.stock || 0,
        featured: initialData.featured || false,
        status: initialData.status || 'active',
        attributes: normalizeAttributesField(initialData.attributes),
        reviews: normalizeReviews(initialData.reviews),
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
      }

      // Tự động tính discount (%) khi price hoặc regular_price thay đổi
      if (name === 'price' || name === 'regular_price') {
        const price = name === 'price' ? parseFloat(value) || 0 : parseFloat(prev.price) || 0
        const regularPrice = name === 'regular_price' ? parseFloat(value) || 0 : parseFloat(prev.regular_price) || 0

        if (regularPrice > 0 && price < regularPrice) {
          const discountPercent = Math.round(((regularPrice - price) / regularPrice) * 100)
          newData.discount = discountPercent
        } else if (regularPrice > 0 && price >= regularPrice) {
          newData.discount = 0
        } else {
          newData.discount = 0
        }
      }

      return newData
    })
  }

  const handleReviewFieldChange = (index: number, field: keyof ReviewForm, value: any) => {
    setFormData((prev) => {
      const reviews = [...prev.reviews]
      if (!reviews[index]) return prev
      reviews[index] = {
        ...reviews[index],
        [field]: field === 'rating' ? Math.max(1, Math.min(5, Number(value) || 1)) : value,
      }
      return { ...prev, reviews }
    })
  }

  const addReviewImages = (index: number, urls: string[]) => {
    if (!Array.isArray(urls) || urls.length === 0) return
    setFormData((prev) => {
      const reviews = [...prev.reviews]
      if (!reviews[index]) return prev
      const currentImages = Array.isArray(reviews[index].images) ? reviews[index].images : []
      const merged = [...currentImages]
      urls.forEach((url) => {
        if (typeof url === 'string') {
          const trimmed = url.trim()
          if (trimmed && !merged.includes(trimmed)) {
            merged.push(trimmed)
          }
        }
      })
      reviews[index] = {
        ...reviews[index],
        images: merged,
      }
      return { ...prev, reviews }
    })
  }

  const removeReviewImage = (index: number, imageIndex: number) => {
    setFormData((prev) => {
      const reviews = [...prev.reviews]
      if (!reviews[index]) return prev
      const images = Array.isArray(reviews[index].images) ? [...reviews[index].images] : []
      images.splice(imageIndex, 1)
      reviews[index] = {
        ...reviews[index],
        images,
      }
      return { ...prev, reviews }
    })
  }

  const addReview = () => {
    setFormData((prev) => ({
      ...prev,
      reviews: [
        ...prev.reviews,
        {
          user_name: '',
          avatar: '',
          rating: 5,
          content: '',
          status: 'approved',
          images: [],
        },
      ],
    }))
  }

  const removeReview = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((_, i) => i !== index),
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

    // Parse gallery
    let gallery = []
    if (formData.gallery) {
      try {
        gallery = JSON.parse(formData.gallery)
      } catch {
        gallery = formData.gallery.split(',').map((url) => url.trim()).filter(Boolean)
      }
    }

    // Tính discount tự động dựa trên price và regular_price
    const price = parseFloat(formData.price) || 0
    const regularPrice = parseFloat(formData.regular_price) || price
    let discount = 0
    if (regularPrice > 0 && price < regularPrice) {
      discount = Math.round(((regularPrice - price) / regularPrice) * 100)
    }

    const normalizedAttributesForSubmit = formData.attributes.map((attr) => ({
      name: attr.name,
      values: attr.values.map((value) => {
        const { price, regular, discount, ...rest } = value
        const normalizedValue: any = { ...rest }
        const priceNumber = parseNumberField(price)
        if (priceNumber !== undefined) normalizedValue.price = priceNumber
        const regularNumber = parseNumberField(regular)
        if (regularNumber !== undefined) normalizedValue.regular = regularNumber
        let discountNumber = parseNumberField(discount)

        if (
          (discountNumber === undefined || !Number.isFinite(discountNumber)) &&
          priceNumber !== undefined &&
          regularNumber !== undefined &&
          regularNumber > 0 &&
          priceNumber < regularNumber
        ) {
          discountNumber = Math.round(((regularNumber - priceNumber) / regularNumber) * 100)
        }

        if (discountNumber !== undefined) normalizedValue.discount = discountNumber

        return normalizedValue
      }),
    }))

    const submitData = {
      ...formData,
      description: formData.description,
      slug,
      price,
      regular_price: regularPrice,
      discount,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      stock: parseInt(String(formData.stock)) || 0,
      gallery: gallery.length > 0 ? JSON.stringify(gallery) : null,
      attributes: normalizedAttributesForSubmit,
      reviews: formData.reviews.map((review) => ({
        id: review.id,
        user_name: review.user_name,
        avatar: review.avatar,
        rating: review.rating || 5,
        content: review.content,
        status: review.status || 'approved',
        images: Array.isArray(review.images)
          ? review.images.filter((url) => typeof url === 'string' && url.trim() !== '').map((url) => url.trim())
          : [],
      })),
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

        const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products'
        const method = productId ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers,
          credentials: 'include',
          body: JSON.stringify(submitData),
        })

        const result = await response.json()
        console.log('Submit response:', { status: response.status, result })

        if (response.ok && result.success) {
          const message = productId ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!'
          setToast({ isOpen: true, message, type: 'success' })
          // Delay redirect để toast kịp hiển thị
          setTimeout(() => {
            window.location.href = '/admin/products'
          }, 1500)
        } else {
          setToast({ isOpen: true, message: 'Lỗi: ' + (result.error || 'Unknown error'), type: 'error' })
        }
      } catch (error) {
        console.error('Error submitting product:', error)
        setToast({ isOpen: true, message: 'Lỗi khi lưu sản phẩm', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    handleAutoSubmit()
  }

  if (fetchingData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">Đang tải dữ liệu sản phẩm...</div>
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
                Tên sản phẩm *
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
                Giá bán (₫) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá gốc (₫)
              </label>
              <input
                type="number"
                name="regular_price"
                value={formData.regular_price}
                onChange={handleChange}
                min="0"
                step="1000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giảm giá (%) <span className="text-xs text-gray-500">(Tự động tính)</span>
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-not-allowed"
                title="Giảm giá được tính tự động dựa trên giá bán và giá gốc"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Hình ảnh</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ảnh chính
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
                  <div className="w-32 h-32 rounded border overflow-hidden">
                    <MediaDisplay url={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
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
                Gallery
              </label>
              <div className="flex items-center gap-4 mb-3">
                <button
                  type="button"
                  onClick={() => setShowGalleryLibrary(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  📚 Chọn từ thư viện
                </button>
                {(() => {
                  try {
                    const galleryUrls = formData.gallery ? JSON.parse(formData.gallery) : []
                    if (Array.isArray(galleryUrls) && galleryUrls.length > 0) {
                      return <span className="text-sm text-gray-600">✓ Đã chọn {galleryUrls.length} ảnh</span>
                    }
                  } catch {
                    // Not JSON, ignore
                  }
                  return null
                })()}
              </div>
              {(() => {
                try {
                  const galleryUrls = formData.gallery ? JSON.parse(formData.gallery) : []
                  if (Array.isArray(galleryUrls) && galleryUrls.length > 0) {
                    return (
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mt-3">
                        {galleryUrls.map((url: string, index: number) => (
                          <div key={index} className="relative group">
                            <div className="w-full aspect-square rounded border overflow-hidden">
                              <MediaDisplay
                                url={url}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newUrls = galleryUrls.filter((_: string, i: number) => i !== index)
                                setFormData((prev) => ({
                                  ...prev,
                                  gallery: newUrls.length > 0 ? JSON.stringify(newUrls) : '',
                                }))
                              }}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  }
                } catch {
                  // Not JSON, ignore
                }
                return null
              })()}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Mô tả</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả ngắn
              </label>
              <textarea
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả chi tiết (HTML)
              </label>
                  <ReactQuillEditor
                    value={formData.description}
                    onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                    placeholder="Nhập mô tả chi tiết sản phẩm..."
                  />
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Thuộc tính sản phẩm</h2>
          <div className="space-y-4">
            {/* Add new attribute */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                id="new-attribute-name"
                placeholder="Tên thuộc tính (VD: Size, Color, Material)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const input = e.target as HTMLInputElement
                    const name = input.value.trim()
                    if (name && !formData.attributes.some((attr) => attr.name.toLowerCase() === name.toLowerCase())) {
                      setFormData((prev) => ({
                        ...prev,
                        attributes: [...prev.attributes, { name, values: [] }],
                      }))
                      input.value = ''
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new-attribute-name') as HTMLInputElement
                  const name = input?.value.trim()
                  if (name && !formData.attributes.some((attr) => attr.name.toLowerCase() === name.toLowerCase())) {
                    setFormData((prev) => ({
                      ...prev,
                      attributes: [...prev.attributes, { name, values: [] }],
                    }))
                    if (input) input.value = ''
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                + Thêm thuộc tính
              </button>
            </div>

            {/* List of attributes */}
            {formData.attributes.map((attribute, attrIndex) => (
              <div key={attrIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{attribute.name}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        attributes: prev.attributes.filter((_, i) => i !== attrIndex),
                      }))
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Xóa thuộc tính
                  </button>
                </div>

                {/* Add value to attribute */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={`Thêm giá trị cho ${attribute.name} (VD: S, M, L hoặc Đỏ, Xanh)`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        const value = input.value.trim()
                        if (value && !attribute.values.some((v) => v.value === value)) {
                          setFormData((prev) => {
                            const newAttributes = [...prev.attributes]
                            newAttributes[attrIndex] = {
                              ...newAttributes[attrIndex],
                              values: [
                                ...newAttributes[attrIndex].values,
                                { value, image: '', color: '', size: '', price: '', regular: '', discount: '' },
                              ],
                            }
                            return { ...prev, attributes: newAttributes }
                          })
                          input.value = ''
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      const value = input?.value.trim()
                      if (value && !attribute.values.some((v) => v.value === value)) {
                        setFormData((prev) => {
                          const newAttributes = [...prev.attributes]
                          newAttributes[attrIndex] = {
                            ...newAttributes[attrIndex],
                            values: [
                              ...newAttributes[attrIndex].values,
                              { value, image: '', color: '', size: '', price: '', regular: '', discount: '' },
                            ],
                          }
                          return { ...prev, attributes: newAttributes }
                        })
                        if (input) input.value = ''
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Thêm
                  </button>
                </div>

                {/* List of values */}
                {attribute.values.length > 0 && (
                  <div className="space-y-3">
                    {attribute.values.map((valueItem, valueIndex) => (
                      <div key={valueIndex} className="p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-start gap-4">
                          {/* Value Image */}
                          <div className="flex-shrink-0">
                            {valueItem.image ? (
                              <div className="relative">
                                <div className="w-20 h-20 rounded border border-gray-300 overflow-hidden">
                                  <MediaDisplay
                                    url={valueItem.image}
                                    alt={valueItem.value}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => {
                                      const newAttributes = [...prev.attributes]
                                      newAttributes[attrIndex].values[valueIndex].image = ''
                                      return { ...prev, attributes: newAttributes }
                                    })
                                  }}
                                  className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowMediaLibrary(true)
                                  ;(window as any).__currentAttributeUpdate = { attrIndex, valueIndex, field: 'image' }
                                }}
                                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition"
                              >
                                📷
                              </button>
                            )}
                          </div>

                          {/* Value Details */}
                          <div className="flex-1 space-y-3">
                            {/* Value Name */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Tên giá trị</label>
                              <span className="font-medium text-gray-800">{valueItem.value}</span>
                            </div>

                            {/* Color Picker */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Màu sắc</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={valueItem.color || '#000000'}
                                  onChange={(e) => {
                                    setFormData((prev) => {
                                      const newAttributes = [...prev.attributes]
                                      newAttributes[attrIndex].values[valueIndex].color = e.target.value
                                      return { ...prev, attributes: newAttributes }
                                    })
                                  }}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  placeholder="#000000 hoặc tên màu"
                                  value={valueItem.color || ''}
                                  onChange={(e) => {
                                    setFormData((prev) => {
                                      const newAttributes = [...prev.attributes]
                                      newAttributes[attrIndex].values[valueIndex].color = e.target.value
                                      return { ...prev, attributes: newAttributes }
                                    })
                                  }}
                                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {valueItem.color && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => {
                                        const newAttributes = [...prev.attributes]
                                        newAttributes[attrIndex].values[valueIndex].color = ''
                                        return { ...prev, attributes: newAttributes }
                                      })
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Size */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Kích thước</label>
                              <input
                                type="text"
                                placeholder="VD: 100x100, Small, Medium..."
                                value={valueItem.size || ''}
                                onChange={(e) => {
                                  setFormData((prev) => {
                                    const newAttributes = [...prev.attributes]
                                    newAttributes[attrIndex].values[valueIndex].size = e.target.value
                                    return { ...prev, attributes: newAttributes }
                                  })
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Giá bán (đ)</label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="VD: 199000"
                                  value={valueItem.price || ''}
                                  onChange={(e) => {
                                    const inputValue = e.target.value
                                    setFormData((prev) => {
                                      const newAttributes = [...prev.attributes]
                                      newAttributes[attrIndex].values[valueIndex].price = inputValue
                                      const regularValue = newAttributes[attrIndex].values[valueIndex].regular || ''
                                      const autoDiscount = computeDiscountFromStrings(inputValue, regularValue)
                                      newAttributes[attrIndex].values[valueIndex].discount = autoDiscount
                                      return { ...prev, attributes: newAttributes }
                                    })
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Giá gốc (đ)</label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="VD: 249000"
                                  value={valueItem.regular || ''}
                                  onChange={(e) => {
                                    const inputValue = e.target.value
                                    setFormData((prev) => {
                                      const newAttributes = [...prev.attributes]
                                      newAttributes[attrIndex].values[valueIndex].regular = inputValue
                                      const priceValue = newAttributes[attrIndex].values[valueIndex].price || ''
                                      const autoDiscount = computeDiscountFromStrings(priceValue, inputValue)
                                      newAttributes[attrIndex].values[valueIndex].discount = autoDiscount
                                      return { ...prev, attributes: newAttributes }
                                    })
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Giảm giá (%)</label>
                                <input
                                  type="text"
                                  placeholder="Tự tính"
                                  value={valueItem.discount || ''}
                                  readOnly
                                  className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Remove Value Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => {
                                const newAttributes = [...prev.attributes]
                                newAttributes[attrIndex] = {
                                  ...newAttributes[attrIndex],
                                  values: newAttributes[attrIndex].values.filter((_, i) => i !== valueIndex),
                                }
                                return { ...prev, attributes: newAttributes }
                              })
                            }}
                            className="text-red-600 hover:text-red-800 px-2 self-start"
                          >
                            × Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {formData.attributes.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                Chưa có thuộc tính nào. Thêm thuộc tính để bắt đầu.
              </p>
            )}
          </div>
        </div>

      {/* Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Đánh giá sản phẩm</h2>
          <button
            type="button"
            onClick={addReview}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + Thêm đánh giá
          </button>
        </div>

        {formData.reviews.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4 border rounded-lg bg-white">
            Chưa có đánh giá nào. Nhấn &quot;Thêm đánh giá&quot; để bắt đầu.
          </p>
        ) : (
          <div className="space-y-4">
            {formData.reviews.map((review, index) => (
              <div key={index} className="bg-white border rounded-lg shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Đánh giá #{index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeReview(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    × Xóa
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                    <input
                      type="text"
                      value={review.user_name}
                      onChange={(e) => handleReviewFieldChange(index, 'user_name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đánh giá</label>
                    <select
                      value={review.rating}
                      onChange={(e) => handleReviewFieldChange(index, 'rating', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} sao
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select
                      value={review.status}
                      onChange={(e) => handleReviewFieldChange(index, 'status', e.target.value as ReviewForm['status'])}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="approved">Hiển thị</option>
                      <option value="pending">Chờ duyệt</option>
                      <option value="rejected">Ẩn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avatar khách hàng</label>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden">
                        {review.avatar ? (
                          <img src={review.avatar} alt={review.user_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-400">No image</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setReviewMediaIndex(index)
                        setReviewMediaType('avatar')
                          setShowReviewMediaLibrary(true)
                        }}
                      >
                        Chọn ảnh
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung đánh giá</label>
                  <ReactQuillEditor
                    value={review.content}
                    onChange={(value) => handleReviewFieldChange(index, 'content', value)}
                  />
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đính kèm (Gallery)</label>
                <div className="flex flex-wrap gap-3">
                  {Array.isArray(review.images) && review.images.length > 0 && review.images.map((imgUrl, imgIndex) => (
                    <div key={`${index}-img-${imgIndex}`} className="relative w-20 h-20 rounded-lg overflow-hidden border bg-gray-50">
                      <MediaDisplay url={imgUrl} alt={`Review image ${imgIndex + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeReviewImage(index, imgIndex)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 transition"
                    onClick={() => {
                      setReviewMediaIndex(index)
                      setReviewMediaType('gallery')
                      setShowReviewMediaLibrary(true)
                    }}
                  >
                    + Thêm ảnh
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Có thể chọn nhiều ảnh cùng lúc.</p>
              </div>
              </div>
            ))}
          </div>
        )}
      </div>

        {/* Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Cài đặt</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingCategories}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((category) => (
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

            <div className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Sản phẩm nổi bật
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <a
            href="/admin/products"
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

      {/* Media Library Modal for Main Image */}
      {showMediaLibrary && !(window as any).__currentAttributeUpdate && (
        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={(url) => setFormData((prev) => ({ ...prev, image: url }))}
        />
      )}

      {/* Media Library Modal for Gallery */}
      <MediaLibrary
        isOpen={showGalleryLibrary}
        onClose={() => setShowGalleryLibrary(false)}
        multiple={true}
        onSelect={() => {}} // Required prop but not used in multiple mode
        onSelectMultiple={(urls) => {
          setFormData((prev) => ({
            ...prev,
            gallery: JSON.stringify(urls),
          }))
        }}
      />

      {/* Media Library Modal for Attribute Values */}
      {showMediaLibrary && (window as any).__currentAttributeUpdate && (
        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => {
            setShowMediaLibrary(false)
            ;(window as any).__currentAttributeUpdate = null
          }}
          onSelect={(url) => {
            const update = (window as any).__currentAttributeUpdate
            if (update && update.field === 'image') {
              setFormData((prev) => {
                const newAttributes = [...prev.attributes]
                newAttributes[update.attrIndex].values[update.valueIndex].image = url
                return { ...prev, attributes: newAttributes }
              })
              setShowMediaLibrary(false)
              ;(window as any).__currentAttributeUpdate = null
            }
          }}
          multiple={false}
        />
      )}

      {/* Media Library for Reviews */}
      {showReviewMediaLibrary && reviewMediaIndex !== null && (
        <MediaLibrary
          isOpen={showReviewMediaLibrary}
          multiple={reviewMediaType === 'gallery'}
          onClose={() => {
            setShowReviewMediaLibrary(false)
            setReviewMediaIndex(null)
          }}
          onSelect={(url) => {
            if (reviewMediaType === 'avatar') {
              handleReviewFieldChange(reviewMediaIndex, 'avatar', url)
            } else {
              addReviewImages(reviewMediaIndex, [url])
            }
            setShowReviewMediaLibrary(false)
            setReviewMediaIndex(null)
          }}
          onSelectMultiple={(urls) => {
            if (urls && urls.length > 0) {
              addReviewImages(reviewMediaIndex, urls)
            }
            setShowReviewMediaLibrary(false)
            setReviewMediaIndex(null)
          }}
        />
      )}

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

