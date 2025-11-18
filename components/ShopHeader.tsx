'use client'

export default function ShopHeader() {
  return (
    <div className="flex items-center justify-between border rounded-lg p-4 max-w-md bg-white">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          {/* Logo sẽ được load từ config hoặc API */}
          <img src="/logo.png" alt="Shop Logo" className="w-full h-full object-cover rounded-full" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-medium shop-name">TikTiok Shop</span>
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

