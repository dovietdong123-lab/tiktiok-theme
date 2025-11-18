'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuItem {
  name: string
  href: string
  icon: string
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: '📊',
  },
  {
    name: 'Sản phẩm',
    href: '/admin/products',
    icon: '📦',
  },
  {
    name: 'Danh mục',
    href: '/admin/categories',
    icon: '📁',
  },
  {
    name: 'Thư viện ảnh',
    href: '/admin/media',
    icon: '🖼️',
  },
  {
    name: 'Đơn hàng',
    href: '/admin/orders',
    icon: '🛒',
  },
  {
    name: 'Cài đặt',
    href: '/admin/settings',
    icon: '⚙️',
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
      {/* Logo/Header */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname?.startsWith(item.href))
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <div className="text-xs text-gray-400 text-center">
          © 2024 Admin Panel
        </div>
      </div>
    </aside>
  )
}

