import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Clear token from cookies if exists
    cookies().delete('admin_token')
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Logout failed',
      },
      { status: 500 }
    )
  }
}

