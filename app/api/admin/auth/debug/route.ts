import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import crypto from 'crypto'

// Debug endpoint để kiểm tra password hash
export async function GET() {
  try {
    // Test password hash generation
    const testPassword = 'admin123'
    const salt = process.env.PASSWORD_SALT || 'default-salt'
    const expectedHash = crypto
      .createHash('sha256')
      .update(testPassword + salt)
      .digest('hex')

    // Get user from database
    const users = await query(
      'SELECT id, username, password_hash, role, status FROM admin_users WHERE username = ?',
      ['admin']
    )

    const user = Array.isArray(users) && users.length > 0 ? users[0] : null

    return NextResponse.json({
      debug: true,
      password: testPassword,
      salt: salt,
      expectedHash: expectedHash,
      userInDatabase: user ? {
        id: user.id,
        username: user.username,
        password_hash: user.password_hash,
        role: user.role,
        status: user.status,
        hashMatch: user.password_hash === expectedHash,
      } : null,
      message: user 
        ? (user.password_hash === expectedHash 
          ? '✅ Hash matches! Login should work.' 
          : '❌ Hash does not match! Run: npm run create-admin')
        : '❌ User not found! Run: npm run create-admin',
    })
  } catch (error: any) {
    return NextResponse.json({
      debug: true,
      error: error.message,
      message: 'Database connection failed. Check .env.local and MySQL service.',
    }, { status: 500 })
  }
}

