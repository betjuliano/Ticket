import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth')
  const isPublicRoute = request.nextUrl.pathname === '/' || isAuthPage || isApiAuthRoute

  // Se não está autenticado e não está em rota pública
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Se está autenticado e tenta acessar página de login
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const response = NextResponse.next()

  // Headers de segurança
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}