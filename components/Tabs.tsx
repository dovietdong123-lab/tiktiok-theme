'use client'

interface TabsProps {
  activeTab: 'home' | 'products' | 'categories'
  setActiveTab: (tab: 'home' | 'products' | 'categories') => void
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
  return (
    <div id="tabs" className="flex border-b">
      <button
        onClick={() => setActiveTab('home')}
        className={`text-sm tab-btn flex-1 text-center py-3 ${
          activeTab === 'home'
            ? 'text-black border-b-2 border-black font-medium'
            : 'text-gray-500'
        }`}
      >
        Trang chủ
      </button>
      <button
        onClick={() => setActiveTab('products')}
        className={`text-sm tab-btn flex-1 text-center py-3 ${
          activeTab === 'products'
            ? 'text-black border-b-2 border-black font-medium'
            : 'text-gray-500'
        }`}
      >
        Sản phẩm
      </button>
      <button
        onClick={() => setActiveTab('categories')}
        className={`text-sm tab-btn flex-1 text-center py-3 ${
          activeTab === 'categories'
            ? 'text-black border-b-2 border-black font-medium'
            : 'text-gray-500'
        }`}
      >
        Danh mục
      </button>
    </div>
  )
}

