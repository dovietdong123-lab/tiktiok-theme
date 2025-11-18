'use client'

import { useEffect, useState } from 'react'

type PublicSettings = {
  storeName?: string
  storeLogo?: string
  heroBanner?: string
}

export default function ShopHeader() {
  const [settings, setSettings] = useState<PublicSettings>({})

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (response.ok && data.success) {
          setSettings(data.data || {})
        }
      } catch (error) {
        console.warn('Failed to load settings', error)
      }
    }

    loadSettings()
  }, [])

  const storeName = settings.storeName || 'TikTiok Shop'
  const storeLogo = settings.storeLogo || '/logo.png'

  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 w-full bg-white">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
          <img src={storeLogo} alt="Shop Logo" className="w-full h-full object-cover rounded-full" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-medium shop-name">{storeName}</span>
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">66.3K đã bán</p>
        </div>
      </div>
      <button className="px-4 py-1.5 text-sm font-medium border rounded-lg hover:bg-gray-50 transition text-gray-700">
        Tin nhắn
      </button>
    </div>
  )
}

