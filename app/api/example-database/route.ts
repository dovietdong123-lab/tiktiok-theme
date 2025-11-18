import { NextResponse } from 'next/server'

// Ví dụ: Kết nối với database (MySQL, PostgreSQL, MongoDB, etc.)

// Option 1: MySQL với mysql2
// import mysql from 'mysql2/promise'
// 
// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// })

// Option 2: PostgreSQL với pg
// import { Pool } from 'pg'
// 
// const pool = new Pool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// })

// Option 3: MongoDB với mongoose
// import mongoose from 'mongoose'
// 
// mongoose.connect(process.env.MONGODB_URI!)

// GET - Lấy dữ liệu
export async function GET() {
  try {
    // Ví dụ với MySQL:
    // const [rows] = await pool.execute('SELECT * FROM products')
    // return NextResponse.json({ success: true, data: rows })

    // Ví dụ với PostgreSQL:
    // const result = await pool.query('SELECT * FROM products')
    // return NextResponse.json({ success: true, data: result.rows })

    // Ví dụ với MongoDB:
    // const products = await Product.find({})
    // return NextResponse.json({ success: true, data: products })

    // Hiện tại dùng mock data
    return NextResponse.json({
      success: true,
      data: [{ id: 1, name: 'Product 1' }],
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Database error' },
      { status: 500 }
    )
  }
}

// POST - Tạo mới
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Ví dụ với MySQL:
    // const [result] = await pool.execute(
    //   'INSERT INTO products (name, price) VALUES (?, ?)',
    //   [body.name, body.price]
    // )
    // return NextResponse.json({ success: true, id: result.insertId })

    // Ví dụ với MongoDB:
    // const product = await Product.create(body)
    // return NextResponse.json({ success: true, data: product })

    return NextResponse.json({ success: true, data: body })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create' },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    // Ví dụ với MySQL:
    // await pool.execute(
    //   'UPDATE products SET name = ?, price = ? WHERE id = ?',
    //   [body.name, body.price, body.id]
    // )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Ví dụ với MySQL:
    // await pool.execute('DELETE FROM products WHERE id = ?', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete' },
      { status: 500 }
    )
  }
}

