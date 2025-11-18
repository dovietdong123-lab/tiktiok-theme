import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Get token from request
async function getToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

// Verify token
async function verifyToken(token: string): Promise<boolean> {
  try {
    const { sessions } = await import('@/lib/sessions')
    const session = sessions.get(token)
    
    if (session && session.expires >= Date.now()) {
      return true
    }
    
    // Check database
    try {
      const dbSessions = await query(
        'SELECT user_id FROM admin_sessions WHERE token = ? AND expires_at > NOW()',
        [token]
      )
      
      if (Array.isArray(dbSessions) && dbSessions.length > 0) {
        return true
      }
    } catch {
      // Fallback: check token format
      if (token && token.length === 64 && /^[a-f0-9]+$/i.test(token)) {
        return true
      }
    }
    
    return false
  } catch {
    return false
  }
}

// GET - Lấy danh sách folders
export async function GET(request: Request) {
  try {
    const token = await getToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isValid = await verifyToken(token)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parent_id')

    let folders
    if (parentId) {
      folders = await query(
        'SELECT id, name, parent_id, created_at FROM media_folders WHERE parent_id = ? ORDER BY name ASC',
        [parentId]
      )
    } else {
      folders = await query(
        'SELECT id, name, parent_id, created_at FROM media_folders WHERE parent_id IS NULL ORDER BY name ASC'
      )
    }

    // Get media count for each folder
    const foldersWithCount = await Promise.all(
      (folders as any[]).map(async (folder) => {
        const [countResult] = await query(
          'SELECT COUNT(*) as count FROM media WHERE folder_id = ?',
          [folder.id]
        ) as any[]
        return {
          ...folder,
          media_count: countResult?.count || 0,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: foldersWithCount,
    })
  } catch (error: any) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch folders',
      },
      { status: 500 }
    )
  }
}

// POST - Tạo folder mới
export async function POST(request: Request) {
  try {
    const token = await getToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isValid = await verifyToken(token)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, parent_id } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 }
      )
    }

    // Check if folder with same name exists in same parent
    const existing = await query(
      'SELECT id FROM media_folders WHERE name = ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))',
      [name.trim(), parent_id || null, parent_id || null]
    )

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Folder with this name already exists' },
        { status: 400 }
      )
    }

    // Create folder
    const result = await query(
      'INSERT INTO media_folders (name, parent_id) VALUES (?, ?)',
      [name.trim(), parent_id || null]
    )

    const folderId = (result as any).insertId

    // Get created folder
    const [createdFolder] = await query(
      'SELECT id, name, parent_id, created_at FROM media_folders WHERE id = ?',
      [folderId]
    ) as any[]

    return NextResponse.json({
      success: true,
      data: createdFolder,
    })
  } catch (error: any) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create folder',
      },
      { status: 500 }
    )
  }
}

