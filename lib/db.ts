import mysql from 'mysql2/promise'

type DbConfig = {
  host: string
  user: string
  password: string
  database: string
  port: number
}

// Parse connection string dạng mysql://user:pass@host:port/db
function parseConnectionString(): Partial<DbConfig> {
  const url = process.env.DB_URL || process.env.DATABASE_URL
  if (!url) return {}

  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, '') || undefined,
    }
  } catch (error) {
    console.warn('[DB] Failed to parse DB_URL/DATABASE_URL', error)
    return {}
  }
}

// Bật TLS mặc định cho TiDB Serverless (Let's Encrypt / ISRG Root X1)
function buildSslOptions(): Partial<mysql.PoolOptions> {
  const sslFlag = process.env.DB_SSL
  const shouldUseSsl = sslFlag ? sslFlag !== 'false' : true

  if (!shouldUseSsl) {
    return {}
  }

  return {
    ssl: {
      minVersion: 'TLSv1.2',
    },
  }
}

// Tạo connection pool để tái sử dụng connections
let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    const fromUrl = parseConnectionString()

    pool = mysql.createPool({
      host: fromUrl.host || process.env.DB_HOST || 'localhost',
      user: fromUrl.user || process.env.DB_USER || 'root',
      password: fromUrl.password || process.env.DB_PASSWORD || '',
      database: fromUrl.database || process.env.DB_NAME || 'k1',
      port: fromUrl.port || parseInt(process.env.DB_PORT || '3306'),
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

