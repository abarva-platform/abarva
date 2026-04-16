import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MOBILE_UA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/auth-redirect(.*)',
  '/',
  '/diagnose(.*)',
  '/ai-strategy(.*)',
  '/justify(.*)',
  '/select(.*)',
  '/blueprint(.*)',
  '/architecture(.*)',
  '/data-intelligence(.*)',
  '/domain-strategy(.*)',
  '/value-template(.*)',
  '/how-to-build(.*)',
  '/contradictions(.*)',
  '/timeline(.*)',
  '/scenarios(.*)',
  '/board-deck(.*)',
  '/outcomes(.*)',
  '/search(.*)',
  '/admin(.*)',
  '/admin/client(.*)',
  '/demo(.*)',
  '/solutions(.*)',
  '/control-tower(.*)',
  '/ai-pdlc(.*)',
  '/future-of-work(.*)',
  '/analytics-modernization(.*)',
  '/marketplace(.*)',
  '/trust(.*)',
  '/status(.*)',
  '/intelligence(.*)',
  '/ai-unlock(.*)',
  '/investor(.*)',
  '/engage/(.*)',
  '/api/engage/(.*)/seed-demo(.*)',
  '/api/admin/seed-all-demos(.*)',
])

// Routes that require admin/maestro role — viewer/client → /client-view
const adminOnlyRoutes = createRouteMatcher([
  '/admin(.*)',
  '/engage/(.*)',
  '/ai-strategy(.*)',
  '/ai-pdlc(.*)',
  '/ai-unlock(.*)',
  '/outcome-intelligence(.*)',
  '/vendor-intelligence(.*)',
])

// Routes that require any authenticated session
const authRequiredRoutes = createRouteMatcher([
  '/admin(.*)',
  '/engage/(.*)',
  '/ai-strategy(.*)',
  '/ai-pdlc(.*)',
  '/client-view(.*)',
])

export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId, sessionClaims } = await auth()
  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role ?? null

  // Admin/maestro-only routes
  if (adminOnlyRoutes(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    if (role === 'viewer' || role === 'client' || role === 'investor') {
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
