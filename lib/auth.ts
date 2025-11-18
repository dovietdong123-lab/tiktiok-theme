import { cookies, headers } from 'next/headers'
import { sessions } from '@/lib/sessions'
import { query } from '@/lib/db'

export interface AdminUser {
  id: number
  username: string
  role: string
}

export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    // Try to get token from cookies first
    const cookieStore = cookies()
    let token = cookieStore.get('admin_token')?.value

    // If not in cookies, try from Authorization header
    if (!token) {
      const headersList = headers()
      const authHeader = headersList.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      console.log('getAdminUser: No token found')
      return null
    }

    console.log('getAdminUser: Token found, length:', token.length)

    // First check in-memory sessions
    const session = sessions.get(token)
    if (session && session.expires > Date.now()) {
      console.log('getAdminUser: Found valid session in memory')
      return {
        id: session.userId,
        username: session.username,
        role: 'admin',
      }
    } else if (session) {
      console.log('getAdminUser: Session expired in memory, expires:', new Date(session.expires).toISOString())
    } else {
      console.log('getAdminUser: No session in memory, checking database...')
    }

    // Fallback: check database sessions
    try {
      const dbSessions = await query(
        'SELECT user_id, username, expires_at FROM admin_sessions WHERE token = ? AND expires_at > NOW()',
        [token]
      )
      if (Array.isArray(dbSessions) && dbSessions.length > 0) {
        const dbSession = dbSessions[0] as any
        console.log('getAdminUser: Found valid session in database')
        // Also restore to memory session for faster access
        const expires = new Date(dbSession.expires_at).getTime()
        sessions.set(token, {
          userId: dbSession.user_id,
          username: dbSession.username,
          expires,
        })
        return {
          id: dbSession.user_id,
          username: dbSession.username,
          role: 'admin',
        }
      } else {
        console.log('getAdminUser: No valid session in database')
        // Check if session exists but expired
        const expiredSessions = await query(
          'SELECT expires_at FROM admin_sessions WHERE token = ?',
          [token]
        )
        if (Array.isArray(expiredSessions) && expiredSessions.length > 0) {
          console.log('getAdminUser: Session exists but expired:', expiredSessions[0])
        }
      }
    } catch (dbError: any) {
      // Database table might not exist, ignore
      console.log('Database session check failed:', dbError.message || dbError)
    }

    console.log('getAdminUser: No valid session found')
    return null
  } catch (error) {
    console.error('Error in getAdminUser:', error)
    return null
  }
}

export async function requireAuth(): Promise<AdminUser> {
  const user = await getAdminUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

