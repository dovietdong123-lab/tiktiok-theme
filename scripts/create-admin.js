// Script để tạo hoặc reset admin user
// Chạy: node scripts/create-admin.js

const crypto = require('crypto')
const mysql = require('mysql2/promise')

// Load .env.local manually
const fs = require('fs')
const path = require('path')

try {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=')
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join('=').trim()
        }
      }
    })
  }
} catch (e) {
  console.log('⚠️  .env.local not found, using defaults')
}

async function createAdmin() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'k1',
    port: parseInt(process.env.DB_PORT || '3306'),
  }

  console.log('🔍 Creating admin user...')
  console.log('Config:', {
    ...config,
    password: config.password ? '***' : '(empty)',
  })

  // Default credentials
  const username = 'admin'
  const password = 'admin123'
  const salt = process.env.PASSWORD_SALT || 'default-salt'

  // Generate password hash
  const passwordHash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex')

  console.log('\n📝 Admin credentials:')
  console.log('   Username:', username)
  console.log('   Password:', password)
  console.log('   Hash:', passwordHash)
  console.log('   Salt:', salt)

  try {
    const connection = await mysql.createConnection(config)
    console.log('\n✅ Connected to MySQL')

    // Check if admin_users table exists
    try {
      const [tables] = await connection.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_users'
      `, [config.database])

      if (tables.length === 0) {
        console.log('\n📄 Creating admin_users table...')
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS admin_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'admin',
            status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_username (username),
            INDEX idx_status (status)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `)
        console.log('✅ Table created')
      }
    } catch (err) {
      console.log('⚠️  Error checking/creating table:', err.message)
    }

    // Check if user exists
    const [existing] = await connection.execute(
      'SELECT id, username FROM admin_users WHERE username = ?',
      [username]
    )

    if (existing.length > 0) {
      console.log('\n🔄 User exists, updating password...')
      await connection.execute(
        'UPDATE admin_users SET password_hash = ?, status = "active", updated_at = NOW() WHERE username = ?',
        [passwordHash, username]
      )
      console.log('✅ Password updated successfully!')
    } else {
      console.log('\n➕ Creating new admin user...')
      await connection.execute(
        'INSERT INTO admin_users (username, password_hash, role, status) VALUES (?, ?, "admin", "active")',
        [username, passwordHash]
      )
      console.log('✅ Admin user created successfully!')
    }

    // Verify
    const [users] = await connection.execute(
      'SELECT id, username, role, status FROM admin_users WHERE username = ?',
      [username]
    )

    if (users.length > 0) {
      console.log('\n✅ Admin user verified:')
      console.log('   ID:', users[0].id)
      console.log('   Username:', users[0].username)
      console.log('   Role:', users[0].role)
      console.log('   Status:', users[0].status)
    }

    await connection.end()
    console.log('\n✅ Done!')
    console.log('\n📝 You can now login with:')
    console.log('   Username: admin')
    console.log('   Password: admin123')
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('  1. Check MySQL is running')
    console.error('  2. Check database exists: CREATE DATABASE k1;')
    console.error('  3. Check .env.local has correct config')
    process.exit(1)
  }
}

createAdmin()

