import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const authCookie = request.cookies.get('mush_auth')
    const isLoginPage = request.nextUrl.pathname === '/login'

    // If not authenticated and not on login page, redirect to login
    if (!authCookie && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If authenticated and on login page, redirect to home
    if (authCookie && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.json (PWA manifest)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
    ],
}
