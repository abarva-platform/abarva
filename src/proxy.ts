import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MOBILE_UA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/auth-redirect(.*)',
  '/',
  '/demo(.*)',
  '/intelligence(.*)',
  '/platform(.*)',
  '/investor(.*)',
])

// Maestro workspace — requires any authenticated Maestro/Admin/Investor session
const maestroRoutes = createRouteMatcher([
  '/maestro(.*)',
])

// Admin portal — requires admin role only
const adminRoutes = createRouteMatcher([
  '/admin(.*)',
])

// Routes that require any authenticated session
const authRequiredRoutes = createRouteMatcher([
  '/admin(.*)',
  '/maestro(.*)',
  '/dashboard(.*)',
  '/engagements(.*)',
  '/engage/(.*)',
  '/users/(.*)',
  '/data(.*)',
  '/tower(.*)',
  '/sponsor(.*)',
])

export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId, sessionClaims } = await auth()
  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role ?? null

  // Admin-only routes — require authenticated session; page handles role check
  if (adminRoutes(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    // Let admin/page.tsx render the restricted message for non-admin roles
    // rather than silently redirecting to /maestro
  }

  // Maestro routes — require authenticated Maestro/Admin/Investor
  if (maestroRoutes(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    if (role === 'client') {
      return NextResponse.redirect(new URL('/client-view', request.url))
    }
  }

  // Auth-required routes (any role)
  if (authRequiredRoutes(request) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // Tag mobile UA requests — consumed by server components via x-is-mobile header
  const ua = request.headers.get('user-agent') ?? ''
  if (MOBILE_UA.test(ua)) {
    const response = NextResponse.next()
    response.headers.set('x-is-mobile', '1')
    return response
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
