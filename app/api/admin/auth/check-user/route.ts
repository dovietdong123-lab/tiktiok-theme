import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import crypto from 'crypto'

interface AdminUser {
  id: number
  username: string
  password_hash: string
  role: string
  status: string
  created_at?: string
}

// Endpoint để kiểm tra user trong database
export async function GET() {
  try {
    // Get all admin users
    const users = await query(
      'SELECT id, username, password_hash, role, status, created_at FROM admin_users ORDER BY id'
    ) as AdminUser[]

    // Test password hash
    const testPassword = 'admin123'
    const salt = process.env.PASSWORD_SALT || 'default-salt'
    const expectedHash = crypto
      .createHash('sha256')
      .update(testPassword + salt)
      .digest('hex')

    // Check admin user specifically
    const adminUser = Array.isArray(users) 
      ? users.find((u: AdminUser) => u.username === 'admin')
      : null

    return NextResponse.json({
      success: true,
      totalUsers: Array.isArray(users) ? users.length : 0,
      users: users,
      adminUser: adminUser ? {
        id: adminUser.id,
        username: adminUser.username,
        password_hash: adminUser.password_hash,
        role: adminUser.role,
        status: adminUser.status,
        hashLength: adminUser.password_hash?.length || 0,
      } : null,
      expectedHash: {
        password: testPassword,
        salt: salt,
        hash: expectedHash,
        hashLength: expectedHash.length,
      },
      hashMatch: adminUser 
        ? adminUser.password_hash === expectedHash 
        : false,
      message: adminUser
        ? (adminUser.password_hash === expectedHash
          ? '✅ Hash matches! Login should work.'
          : '❌ Hash does not match! Run: npm run create-admin')
        : '❌ Admin user not found! Run: npm run create-admin',
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Database connection failed. Check .env.local and MySQL service.',
    }, { status: 500 })
  }
}

