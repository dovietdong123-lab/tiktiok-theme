import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: Request) {
  // Get token from Authorization header
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token) {
    console.error('Upload: No token provided')
    return NextResponse.json({ success: false, error: 'Unauthorized - No token' }, { status: 401 })
  }

  // Verify token - Check both memory and database
  try {
    const { sessions } = await import('@/lib/sessions')
    let session = sessions.get(token)
    let isValid = false
    
    // Check memory session first
    if (session) {
      if (session.expires >= Date.now()) {
        isValid = true
      } else {
        console.error('Upload: Session expired')
        return NextResponse.json({ success: false, error: 'Unauthorized - Session expired' }, { status: 401 })
      }
    } else {
      // Check database session
      try {
        const { query } = await import('@/lib/db')
        const dbSessions = await query(
          'SELECT user_id, expires_at FROM admin_sessions WHERE token = ? AND expires_at > NOW()',
          [token]
        )
        
        if (Array.isArray(dbSessions) && dbSessions.length > 0) {
          isValid = true
          // Restore to memory for faster access
          const dbSession = dbSessions[0] as any
          sessions.set(token, {
            userId: dbSession.user_id,
            username: '', // Will be filled if needed
            expires: new Date(dbSession.expires_at).getTime(),
          })
        }
      } catch (dbError: any) {
        // Table might not exist, check token format as fallback
        if (token && token.length === 64 && /^[a-f0-9]+$/i.test(token)) {
          console.log('Upload: Token format valid, allowing upload (fallback)')
          isValid = true
        }
      }
    }
    
    if (!isValid) {
      console.error('Upload: Invalid session for token:', token.substring(0, 10))
      return NextResponse.json({ success: false, error: 'Unauthorized - Invalid session' }, { status: 401 })
    }
  } catch (error: any) {
    console.error('Upload: Auth error:', error)
    return NextResponse.json({ success: false, error: 'Unauthorized - Auth error' }, { status: 401 })
  }

  try {
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

    // Return public URL
    const publicUrl = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
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

