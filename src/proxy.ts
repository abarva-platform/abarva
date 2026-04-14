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
])

export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
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
