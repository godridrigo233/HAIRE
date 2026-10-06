import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('haire_token')?.value
  const isPublic = PUBLIC_ROUTES.includes(pathname)

  // Si ya tiene sesión y entra a login o register, redirigir a dashboard
  if (isPublic && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Si no tiene sesión y entra a ruta privada, redirigir a login
  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|placeholder).*)'],
}
