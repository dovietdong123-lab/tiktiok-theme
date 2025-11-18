# Next.js Backend Guide

## Next.js có thể làm Backend không?

**CÓ!** Next.js có thể làm backend thông qua **API Routes** (App Router) hoặc **API Routes** (Pages Router).

## Cách hoạt động

### 1. API Routes trong App Router (Next.js 13+)

Tạo file trong thư mục `app/api/`:

```
app/
  api/
    products/
      route.ts        → GET, POST
      [id]/
        route.ts      → GET, PUT, DELETE cho product cụ thể
```

### 2. Ví dụ cơ bản

```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ data: 'Hello from API' })
}

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ received: body })
}
```

## Kết nối Database

### MySQL với mysql2

```bash
npm install mysql2
```

```typescript
// app/api/products/route.ts
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

export async function GET() {
  const [rows] = await pool.execute('SELECT * FROM products')
  return NextResponse.json({ success: true, data: rows })
}
```

### PostgreSQL với pg

```bash
npm install pg
```

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

export async function GET() {
  const result = await pool.query('SELECT * FROM products')
  return NextResponse.json({ success: true, data: result.rows })
}
```

### MongoDB với Mongoose

```bash
npm install mongoose
```

```typescript
import mongoose from 'mongoose'

mongoose.connect(process.env.MONGODB_URI!)

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
})

const Product = mongoose.model('Product', ProductSchema)

export async function GET() {
  const products = await Product.find({})
  return NextResponse.json({ success: true, data: products })
}
```

### Prisma ORM (Khuyên dùng)

```bash
npm install @prisma/client
npx prisma init
```

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const products = await prisma.product.findMany()
  return NextResponse.json({ success: true, data: products })
}
```

## Các HTTP Methods hỗ trợ

- `GET` - Lấy dữ liệu
- `POST` - Tạo mới
- `PUT` - Cập nhật toàn bộ
- `PATCH` - Cập nhật một phần
- `DELETE` - Xóa

## Xử lý Request

```typescript
export async function POST(request: Request) {
  // Lấy body
  const body = await request.json()
  
  // Lấy query params
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  // Lấy headers
  const authHeader = request.headers.get('authorization')
  
  // Lấy cookies
  const token = request.cookies.get('token')
  
  return NextResponse.json({ success: true })
}
```

## Middleware & Authentication

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  
  if (!token && request.nextUrl.pathname.startsWith('/api/protected')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

## So sánh với các giải pháp khác

| Tính năng | Next.js API | Express.js | FastAPI | Laravel |
|-----------|-------------|------------|---------|---------|
| Full-stack | ✅ | ❌ | ❌ | ✅ |
| SSR/SSG | ✅ | ❌ | ❌ | ✅ |
| TypeScript | ✅ | ✅ | ✅ | ❌ |
| Database ORM | ✅ | ✅ | ✅ | ✅ |
| Authentication | ✅ | ✅ | ✅ | ✅ |
| File Upload | ✅ | ✅ | ✅ | ✅ |
| WebSocket | ⚠️ | ✅ | ✅ | ✅ |

## Ưu điểm Next.js Backend

1. **Full-stack trong 1 project** - Không cần tách frontend/backend
2. **Type-safe** - TypeScript end-to-end
3. **Deploy dễ dàng** - Vercel, Netlify hỗ trợ tốt
4. **Performance** - Serverless functions tự động scale
5. **SEO friendly** - SSR/SSG tích hợp sẵn

## Nhược điểm

1. **Không phù hợp cho real-time** - WebSocket cần setup thêm
2. **Serverless limitations** - Có giới hạn thời gian execution
3. **File system** - Không persistent trong serverless

## Khi nào dùng Next.js Backend?

✅ **Nên dùng khi:**
- E-commerce, blog, landing page
- CRUD operations đơn giản
- Cần SSR/SSG
- Muốn deploy dễ dàng

❌ **Không nên dùng khi:**
- Real-time chat, gaming
- Background jobs phức tạp
- Microservices architecture
- Cần WebSocket nhiều

## Ví dụ thực tế cho project này

Xem các file trong `app/api/`:
- `app/api/products/route.ts` - CRUD products
- `app/api/products/[id]/route.ts` - Chi tiết product
- `app/api/categories/route.ts` - Categories

Tất cả đều có thể kết nối với database thực tế!

