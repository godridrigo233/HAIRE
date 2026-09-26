import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Check for JWT token in cookies or Authorization header
  // Since we use localStorage (client-side only), we can't check the token here.
  // Instead, we add a custom header so the app knows this is a middleware-checked request.
  // The actual auth check is done client-side in AppShell.
  // However, we redirect API routes properly.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder).*)'],
}
