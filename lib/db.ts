import mysql from 'mysql2/promise'

// Tạo connection pool để tái sử dụng connections
let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'k1',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}

// Helper function để query
export async function query(sql: string, params?: any[]) {
  const connection = getPool()
  try {
    const [results] = await connection.execute(sql, params || [])
    return results
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Test connection
export async function testConnection() {
  try {
    const connection = getPool()
    await connection.execute('SELECT 1')
    return true
  } catch (error) {
    console.error('Database connection error:', error)
    return false
  }
}

