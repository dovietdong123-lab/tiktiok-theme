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
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-white w-full relative">
        <div className="w-full max-w-[500px] mx-auto relative">
          {children}
        </div>
      </body>
    </html>
  )
}

