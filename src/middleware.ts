import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/investor(.*)',
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
  '/search(.*)',
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
