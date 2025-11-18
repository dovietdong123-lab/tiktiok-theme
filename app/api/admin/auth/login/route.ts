import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { sessions } from '@/lib/sessions'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username and password are required',
        },
        { status: 400 }
      )
    }

    // Get admin user from database
    const users = await query(
      'SELECT id, username, password_hash, role, status FROM admin_users WHERE username = ?',
      [username]
    )

    if (!Array.isArray(users) || users.length === 0) {
      console.error('Login failed: User not found', { username })
      return NextResponse.json(
        {
          success: false,
          error: 'Tên đăng nhập hoặc mật khẩu không đúng',
          debug: 'User not found in database',
        },
        { status: 401 }
      )
    }

    const user = users[0] as any

    // Check status
    if (user.status !== 'active') {
      console.error('Login failed: User not active', { username, status: user.status })
      return NextResponse.json(
        {
          success: false,
          error: 'Tài khoản đã bị khóa',
          debug: `User status: ${user.status}`,
        },
        { status: 401 }
      )
    }

    // Verify password (simple hash comparison - in production use bcrypt)
    const salt = process.env.PASSWORD_SALT || 'default-salt'
    const passwordHash = crypto
      .createHash('sha256')
      .update(password + salt)
      .digest('hex')

    console.log('Login attempt:', {
      username,
      providedHash: passwordHash,
      storedHash: user.password_hash,
      hashMatch: user.password_hash === passwordHash,
      salt,
    })

    if (user.password_hash !== passwordHash) {
      console.error('Login failed: Password hash mismatch', {
        username,
        providedHash: passwordHash,
        storedHash: user.password_hash,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Tên đăng nhập hoặc mật khẩu không đúng',
          debug: {
            hashMatch: false,
            providedHash: passwordHash,
            storedHash: user.password_hash,
            salt,
          },
        },
        { status: 401 }
      )
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    const expiresAt = new Date(expires)

    // Store session in memory
    sessions.set(token, {
      userId: user.id,
      username: user.username,
      expires,
    })

    // Also store in database (if table exists)
    try {
      // Try with username first (new schema)
      try {
        await query(
          'INSERT INTO admin_sessions (token, user_id, username, expires_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE expires_at = ?, username = ?',
          [token, user.id, user.username, expiresAt, expiresAt, user.username]
        )
        console.log('Session stored in database successfully (with username)')
      } catch (usernameError: any) {
        // If username column doesn't exist, try without it
        if (usernameError.message?.includes('Unknown column') || usernameError.message?.includes('username')) {
          console.log('Username column not found, trying without username...')
          await query(
            'INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE expires_at = ?',
            [token, user.id, expiresAt, expiresAt]
          )
          console.log('Session stored in database successfully (without username)')
        } else {
          throw usernameError
        }
      }
    } catch (dbError: any) {
      // Table might not exist yet, that's okay - continue with memory session
      console.log('Note: admin_sessions table not found or error:', dbError.message || dbError)
      console.log('Using memory sessions only. To fix, create admin_sessions table.')
    }

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })

    // Set cookie for authentication
    response.cookies.set('admin_token', token, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Login failed',
      },
      { status: 500 }
    )
  }
}

