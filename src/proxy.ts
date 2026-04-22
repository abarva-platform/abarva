import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MOBILE_UA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/auth-redirect(.*)',
  '/',
  '/demo(.*)',
  '/investor(.*)',
])

// Maestro workspace — requires any authenticated Maestro/Admin/Investor session
const maestroRoutes = createRouteMatcher([
  '/maestro(.*)',
])

// Routes that require any authenticated session. /admin(.*) still listed
// because redirects run in edge routing but leaving the auth matcher is
// belt-and-suspenders in case the redirect misses.
const authRequiredRoutes = createRouteMatcher([
  '/admin(.*)',
  '/maestro(.*)',
  '/home(.*)',
  '/dashboard(.*)',
  '/engagements(.*)',
  '/engage/(.*)',
  '/users/(.*)',
  '/data(.*)',
  '/tower(.*)',
  '/sponsor(.*)',
  '/platform(.*)',
  '/intelligence(.*)',
])

export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId, sessionClaims } = await auth()
  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role ?? null

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
