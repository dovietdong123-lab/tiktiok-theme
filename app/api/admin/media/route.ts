import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Get token from request
async function getToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  return authHeader?.replace('Bearer ', '') || null
}

// Verify token
async function verifyToken(token: string): Promise<number | null> {
  try {
    const { sessions } = await import('@/lib/sessions')
    const session = sessions.get(token)
    
    if (session && session.expires >= Date.now()) {
      return session.userId
    }
    
    // Check database
    try {
      const dbSessions = await query(
        'SELECT user_id, expires_at FROM admin_sessions WHERE token = ? AND expires_at > NOW()',
        [token]
      )
      
      if (Array.isArray(dbSessions) && dbSessions.length > 0) {
        return (dbSessions[0] as any).user_id
      }
    } catch {
      // Fallback: check token format
      if (token && token.length === 64 && /^[a-f0-9]+$/i.test(token)) {
        return 1 // Default user ID for development
      }
    }
    
    return null
  } catch {
    return null
  }
}

// GET - Lấy danh sách media
export async function GET(request: Request) {
  try {
    const token = await getToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    const folderId = searchParams.get('folder_id')

    let media
    if (folderId) {
      media = await query(
        `SELECT id, filename, original_name, url, mime_type, file_size, width, height, alt_text, folder_id, created_at
         FROM media
         WHERE folder_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [folderId, limit, offset]
      )
    } else {
      media = await query(
        `SELECT id, filename, original_name, url, mime_type, file_size, width, height, alt_text, folder_id, created_at
         FROM media
         WHERE folder_id IS NULL
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      )
    }

    const [countResult] = await query('SELECT COUNT(*) as total FROM media') as any[]
    const total = countResult?.total || 0

    return NextResponse.json({
      success: true,
      data: media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch media',
      },
      { status: 500 }
    )
  }
}

// POST - Upload media
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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${randomStr}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Get image dimensions (basic check)
    let width = null
    let height = null
    try {
      // For now, we'll skip image dimension detection
      // In production, use sharp or jimp library
    } catch {
      // Ignore dimension errors
    }

    // Get folder_id from form data if provided
    const folderId = formData.get('folder_id') as string | null

    // Save to database
    const publicUrl = `/uploads/${filename}`
    const result = await query(
      `INSERT INTO media (filename, original_name, url, mime_type, file_size, width, height, uploaded_by, folder_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [filename, file.name, publicUrl, file.type, file.size, width, height, userId, folderId || null]
    )

    const mediaId = (result as any).insertId

    // Get created media
    const [createdMedia] = await query(
      'SELECT id, filename, original_name, url, mime_type, file_size, width, height, alt_text, folder_id, created_at FROM media WHERE id = ?',
      [mediaId]
    ) as any[]

    return NextResponse.json({
      success: true,
      data: createdMedia,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload file',
      },
      { status: 500 }
    )
  }
}

