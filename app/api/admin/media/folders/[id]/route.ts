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

// PUT - Cập nhật folder
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = await getToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isValid = await verifyToken(token)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)
    const body = await request.json()
    const { name, parent_id } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 }
      )
    }

    // Check if folder exists
    const folder = await query('SELECT id FROM media_folders WHERE id = ?', [id]) as any[]
    if (!Array.isArray(folder) || folder.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      )
    }

    // Check if folder with same name exists in same parent
    const existing = await query(
      'SELECT id FROM media_folders WHERE name = ? AND id != ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))',
      [name.trim(), id, parent_id || null, parent_id || null]
    )

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Folder with this name already exists' },
        { status: 400 }
      )
    }

    // Update folder
    await query(
      'UPDATE media_folders SET name = ?, parent_id = ? WHERE id = ?',
      [name.trim(), parent_id || null, id]
    )

    // Get updated folder
    const [updatedFolder] = await query(
      'SELECT id, name, parent_id, created_at FROM media_folders WHERE id = ?',
      [id]
    ) as any[]

    return NextResponse.json({
      success: true,
      data: updatedFolder,
    })
  } catch (error: any) {
    console.error('Error updating folder:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update folder',
      },
      { status: 500 }
    )
  }
}

// DELETE - Xóa folder
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = await getToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const isValid = await verifyToken(token)
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)

    // Check if folder exists
    const folder = await query('SELECT id FROM media_folders WHERE id = ?', [id]) as any[]
    if (!Array.isArray(folder) || folder.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      )
    }

    // Check if folder has subfolders
    const subfolders = await query('SELECT id FROM media_folders WHERE parent_id = ?', [id]) as any[]
    if (Array.isArray(subfolders) && subfolders.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete folder with subfolders. Please delete subfolders first.' },
        { status: 400 }
      )
    }

    // Delete folder (media will be moved to root due to ON DELETE SET NULL)
    await query('DELETE FROM media_folders WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete folder',
      },
      { status: 500 }
    )
  }
}

