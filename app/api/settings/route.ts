import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

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

function rowsToObject(rows: any[]) {
  const result: Record<string, string> = {}
  rows.forEach((row) => {
    result[row.setting_key] = row.setting_value ?? ''
  })
  return result
}

export async function GET() {
  try {
    await ensureSettingsTable()
    const rows = (await query('SELECT setting_key, setting_value FROM store_settings')) as any[]
    const data = rowsToObject(rows)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Public settings GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load settings' },
      { status: 500 }
    )
  }
}


