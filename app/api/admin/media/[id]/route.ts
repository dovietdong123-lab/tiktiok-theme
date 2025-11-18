import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { del } from '@vercel/blob'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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

// DELETE - Xóa media
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

    // Get media info
    const media = await query('SELECT filename, url FROM media WHERE id = ?', [id]) as any[]

    if (!Array.isArray(media) || media.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      )
    }

    const mediaItem = media[0]

    const fileUrl: string = mediaItem.url || ''

    if (fileUrl.startsWith('http')) {
      // Support both BLOB_READ_WRITE_TOKEN and tiktiok_theme_READ_WRITE_TOKEN
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.tiktiok_theme_READ_WRITE_TOKEN
      if (blobToken) {
        try {
          await del(fileUrl, { token: blobToken })
        } catch (error) {
          console.error('Error deleting blob:', error)
        }
      }
    } else {
      try {
        const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl
        const filepath = join(process.cwd(), relativePath)
        await unlink(filepath)
      } catch (error) {
        console.error('Error deleting file:', error)
      }
    }

    // Delete from database
    await query('DELETE FROM media WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete media',
      },
      { status: 500 }
    )
  }
}

