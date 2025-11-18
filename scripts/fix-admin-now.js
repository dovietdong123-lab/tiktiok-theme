// Script để fix admin user ngay lập tức
// Chạy: node scripts/fix-admin-now.js

const crypto = require('crypto')
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

// Load .env.local
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
} catch (e) {}

async function fixAdmin() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'k1',
    port: parseInt(process.env.DB_PORT || '3306'),
  }

  console.log('\n🔧 Fixing admin user...\n')
  console.log('Database config:', {
    ...config,
    password: config.password ? '***' : '(empty)',
  })

  const username = 'admin'
  const password = 'admin123'
  const salt = process.env.PASSWORD_SALT || 'default-salt'
  const passwordHash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex')

  console.log('\n📝 Credentials:')
  console.log('   Username:', username)
  console.log('   Password:', password)
  console.log('   Salt:', salt)
  console.log('   Hash:', passwordHash)
  console.log('')

  try {
    const connection = await mysql.createConnection(config)
    console.log('✅ Connected to MySQL\n')

    // Ensure table exists
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
    console.log('✅ Table checked/created\n')

    // Delete existing admin user if exists
    await connection.execute('DELETE FROM admin_users WHERE username = ?', [username])
    console.log('🗑️  Removed existing admin user (if any)\n')

    // Insert new admin user
    await connection.execute(
      'INSERT INTO admin_users (username, password_hash, role, status) VALUES (?, ?, "admin", "active")',
      [username, passwordHash]
    )
    console.log('✅ Created new admin user\n')

    // Verify
    const [users] = await connection.execute(
      'SELECT id, username, password_hash, role, status FROM admin_users WHERE username = ?',
      [username]
    )

    if (users.length > 0) {
      const user = users[0]
      console.log('✅ Verification:')
      console.log('   ID:', user.id)
      console.log('   Username:', user.username)
      console.log('   Hash:', user.password_hash)
      console.log('   Hash matches:', user.password_hash === passwordHash ? '✅ YES' : '❌ NO')
      console.log('   Role:', user.role)
      console.log('   Status:', user.status)
      console.log('')
    }

    await connection.end()
    console.log('✅ Done! You can now login with:')
    console.log('   Username: admin')
    console.log('   Password: admin123\n')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('  1. Check MySQL is running')
    console.error('  2. Check database exists: CREATE DATABASE k1;')
    console.error('  3. Check .env.local has correct config')
    process.exit(1)
  }
}

fixAdmin()

