import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

async function verifyToken(token: string): Promise<number | null> {
  try {
    const { sessions } = await import('@/lib/sessions')
    const session = sessions.get(token)

    if (session && session.expires >= Date.now()) {
      return session.userId
    }

    const dbSessions = await query(
      'SELECT user_id FROM admin_sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    )

    if (Array.isArray(dbSessions) && dbSessions.length > 0) {
      return (dbSessions[0] as any).user_id
    }
  } catch (error) {
    console.warn('[Settings] verifyToken error:', error)
  }

  return null
}

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

export async function GET(request: Request) {
  try {
    await ensureSettingsTable()
    const rows = (await query('SELECT setting_key, setting_value FROM store_settings')) as any[]
    const data = rowsToObject(rows)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const token = await getToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    await ensureSettingsTable()

    const entries = Object.entries(body) as [string, any][]
    if (entries.length === 0) {
      return NextResponse.json({ success: false, error: 'No settings provided' }, { status: 400 })
    }

    for (const [key, value] of entries) {
      const stringValue =
        typeof value === 'string' ? value : value === null || value === undefined ? '' : JSON.stringify(value)

      await query(
        `INSERT INTO store_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, stringValue]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Settings POST error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save settings' },
      { status: 500 }
    )
  }
}


