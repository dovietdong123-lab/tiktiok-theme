import fs from 'fs'
import mysql from 'mysql2/promise'

// Tạo connection pool để tái sử dụng connections
let pool: mysql.Pool | null = null

function buildSslOptions(): Partial<mysql.PoolOptions> {
  const sslFlag = process.env.DB_SSL
  const shouldUseSsl = sslFlag ? sslFlag !== 'false' : true

  if (!shouldUseSsl) {
    return {}
  }

  let ca: string | undefined

  if (process.env.DB_CA_PEM) {
    const pem = process.env.DB_CA_PEM
    const isBase64 = pem && !pem.trim().startsWith('-----BEGIN CERTIFICATE-----')
    ca = isBase64 ? Buffer.from(pem, 'base64').toString('utf8') : pem
  } else if (process.env.DB_CA) {
    try {
      ca = fs.readFileSync(process.env.DB_CA, 'utf8')
    } catch (error) {
      console.warn('[DB] Unable to read CA file from DB_CA path:', error)
    }
  }

  const sslOptions =
    ca != null
      ? { ca, minVersion: 'TLSv1.2', rejectUnauthorized: true }
      : { minVersion: 'TLSv1.2', rejectUnauthorized: true }

  return { ssl: sslOptions }
}

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
      ...buildSslOptions(),
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

