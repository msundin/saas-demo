import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Auth Middleware
 *
 * Protects routes and manages authentication flow:
 * - Redirects unauthenticated users from /dashboard to /login
 * - Redirects authenticated users from /login or /signup to /dashboard
 * - Refreshes Supabase session on each request
 *
 * Testing: This middleware is tested via E2E manual testing rather than
 * unit tests due to Next.js infrastructure complexity. Test cases verified:
 * 1. Unauthenticated access to /dashboard → redirects to /login
 * 2. Authenticated access to /login → redirects to /dashboard
 * 3. Authenticated access to /dashboard → allows access
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - require authentication
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Auth pages - redirect to dashboard if already authenticated
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')
  ) {
    if (user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // SEO Protection: Add X-Robots-Tag header to block search engines
  const allowIndexing = process.env.NEXT_PUBLIC_ROBOTS !== 'noindex'
  if (!allowIndexing) {
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
