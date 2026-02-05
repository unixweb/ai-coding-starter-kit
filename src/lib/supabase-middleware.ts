import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) =>
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/reset-password', '/auth/callback']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If authenticated but not verified, redirect to verify-email
  // (allow /verify-email, /auth/callback, and /login to be accessible)
  if (user && !user.email_confirmed_at) {
    const allowedUnverified = ['/verify-email', '/auth/callback', '/login', '/register']
    const isAllowed = allowedUnverified.some((route) => pathname.startsWith(route))
    if (!isAllowed && pathname !== '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/verify-email'
      return NextResponse.redirect(url)
    }
  }

  // If authenticated and visiting login/register, redirect to dashboard
  if (user && user.email_confirmed_at && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
