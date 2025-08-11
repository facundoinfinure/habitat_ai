import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname === '/login') {
    return NextResponse.next()
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)']
}
