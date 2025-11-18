'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import Toast from '@/components/admin/Toast'

type SettingsForm = {
  storeName: string
  storeDescription: string
  supportEmail: string
  hotline: string
  businessAddress: string
  facebookUrl: string
  tiktokUrl: string
  primaryColor: string
  accentColor: string
  heroBanner: string
}

const DEFAULT_SETTINGS: SettingsForm = {
  storeName: 'TikTiok Shop',
  storeDescription: 'TikTok style shopping experience.',
  supportEmail: 'support@example.com',
  hotline: '0123 456 789',
  businessAddress: '123 Nguyễn Trãi, Hà Nội',
  facebookUrl: 'https://facebook.com',
  tiktokUrl: 'https://www.tiktok.com',
  primaryColor: '#111827',
  accentColor: '#f97316',
  heroBanner: 'https://via.placeholder.com/1200x400',
}

export default function SettingsPage() {
  const [formData, setFormData] = useState<SettingsForm>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    isOpen: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({ isOpen: false, message: '', type: 'success' })

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const token = localStorage.getItem('admin_token')
        if (!token) {
          setError('Bạn cần đăng nhập lại.')
          setLoading(false)
          return
        }

        const response = await fetch('/api/admin/settings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()

        if (response.ok && data.success) {
          setFormData((prev) => ({
            ...prev,
            ...Object.keys(DEFAULT_SETTINGS).reduce((acc, key) => {
              const value = data.data?.[key]
              if (value !== undefined) {
                acc[key as keyof SettingsForm] = value
              }
              return acc
            }, {} as Partial<SettingsForm>),
          }))
        } else {
          const message = data.error || 'Không thể tải cài đặt'
          setError(message)
          showToast(message, 'error')
        }
      } catch (err: any) {
        const message = err.message || 'Không thể tải cài đặt'
        setError(message)
        showToast(message, 'error')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleChange = (field: keyof SettingsForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        setError('Bạn cần đăng nhập lại.')
        return
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        showToast('Đã lưu cài đặt thành công.', 'success')
      } else {
        const message = data.error || 'Không thể lưu cài đặt.'
        setError(message)
        showToast(message, 'error')
      }
    } catch (err: any) {
      const message = err.message || 'Không thể lưu cài đặt.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="Cài đặt cửa hàng">
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">Đang tải cài đặt...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">{error}</div>
            )}

            <section className="bg-white rounded-lg shadow p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Thông tin cửa hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => handleChange('storeName', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email hỗ trợ</label>
                  <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hotline</label>
                  <input
                    type="text"
                    value={formData.hotline}
                    onChange={(e) => handleChange('hotline', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={formData.businessAddress}
                    onChange={(e) => handleChange('businessAddress', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.storeDescription}
                  onChange={(e) => handleChange('storeDescription', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </section>

            <section className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Màu sắc & Banner</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Màu chủ đạo</label>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="h-10 w-full border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Màu nhấn</label>
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="h-10 w-full border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero banner URL</label>
                <input
                  type="text"
                  value={formData.heroBanner}
                  onChange={(e) => handleChange('heroBanner', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </section>

            <section className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Liên kết mạng xã hội</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input
                    type="text"
                    value={formData.facebookUrl}
                    onChange={(e) => handleChange('facebookUrl', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
                  <input
                    type="text"
                    value={formData.tiktokUrl}
                    onChange={(e) => handleChange('tiktokUrl', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  )
}


