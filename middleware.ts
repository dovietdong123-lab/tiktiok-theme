import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Note: We use localStorage for token storage (client-side)
  // Middleware can't access localStorage, so we let client-side handle auth checks
  // This middleware only handles cookie-based auth if needed in the future
  
  // For now, allow all admin routes - client-side will handle redirects
  // The admin pages themselves check localStorage and redirect if needed
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

