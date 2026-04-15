import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareAuthClient } from '@/lib/supabase-server'

type AuthRole = 'rider' | 'driver' | 'admin'

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/auth/reset-password',
  '/api/webhooks',
]

const roleRoutePrefixes: Record<AuthRole, string[]> = {
  admin: ['/admin'],
  driver: ['/driver', '/queue', '/trip'],
  rider: ['/', '/book', '/passes', '/profile', '/safety', '/ride', '/receipt'],
}

export const roleHomePaths: Record<AuthRole, string> = {
  rider: '/',
  driver: '/driver',
  admin: '/admin',
}

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  if (prefix === '/') {
    return pathname === '/'
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => matchesRoutePrefix(pathname, route))
}

export function getRequiredRoleForPath(pathname: string): AuthRole | null {
  for (const role of ['admin', 'driver', 'rider'] as const) {
    const prefixes = roleRoutePrefixes[role]
    if (prefixes.some((prefix) => matchesRoutePrefix(pathname, prefix))) {
      return role
    }
  }

  return null
}

export function canAccessPath(role: AuthRole, pathname: string): boolean {
  const requiredRole = getRequiredRoleForPath(pathname)
  if (!requiredRole) {
    return true
  }

  return role === 'admin' || role === requiredRole
}

/**
 * Middleware to handle authentication and route protection
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public routes without auth
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // For all other routes, we need to check session via server-side cookies.
  const response = NextResponse.next()

  try {
    const supabase = createMiddlewareAuthClient(request, response)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    const role = data?.role as AuthRole | undefined
    if (error || !role) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!canAccessPath(role, pathname)) {
      return NextResponse.redirect(new URL(roleHomePaths[role], request.url))
    }

    return response
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
