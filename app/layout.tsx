import type { Metadata } from 'next'
import './globals.css'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

type StoreSettings = Record<string, string>

async function ensureSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS store_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(191) NOT NULL UNIQUE,
      setting_value TEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

async function loadStoreSettings(): Promise<StoreSettings> {
  try {
    await ensureSettingsTable()
    const rows = (await query('SELECT setting_key, setting_value FROM store_settings')) as Array<{
      setting_key: string
      setting_value: string | null
    }>

    return rows.reduce<StoreSettings>((acc, row) => {
      acc[row.setting_key] = row.setting_value ?? ''
      return acc
    }, {})
  } catch (error) {
    console.error('[RootLayout] Failed to load store settings:', error)
    return {}
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadStoreSettings()
  const storeDescription = (settings.storeDescription || '').trim()
  const storeName = (settings.storeName || '').trim()

  const title = storeDescription || storeName || 'TikTiok Shop'
  return {
    title,
    description: storeDescription || 'E-commerce shop',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await loadStoreSettings()

  const storeName = (settings.storeName || 'TikTiok Shop').trim()
  const supportEmail = (settings.supportEmail || '').trim()
  const hotline = (settings.hotline || '').trim()
  const businessAddress = (settings.businessAddress || '').trim()
  const adsPixelCode = (settings.adsPixelCode || '').trim()

  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdn.tailwindcss.com"></script>
        {adsPixelCode && (
          <script
            dangerouslySetInnerHTML={{ __html: adsPixelCode }}
            suppressHydrationWarning
          />
        )}
      </head>
      <body className="bg-white w-full relative">
        <div className="w-full max-w-[500px] mx-auto relative">
          {children}

          <footer className="mt-4 px-4 py-3 text-xs text-gray-600 bg-gray-50 border-t border-gray-200">
            <div className="space-y-1">
              {storeName && <p className="text-sm font-semibold text-gray-900">{storeName}</p>}
              <div className="flex flex-col gap-0.5">
                {supportEmail && (
                  <p>
                    <span className="font-medium">Email hỗ trợ:</span>{' '}
                    <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                      {supportEmail}
                    </a>
                  </p>
                )}
                {hotline && (
                  <p>
                    <span className="font-medium">Hotline:</span> {hotline}
                  </p>
                )}
                {businessAddress && (
                  <p>
                    <span className="font-medium">Địa chỉ:</span> {businessAddress}
                  </p>
                )}
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

