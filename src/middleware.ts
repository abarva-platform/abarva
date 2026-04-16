import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that require admin or maestro role
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

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role ?? null

  // Admin/maestro-only routes
  if (adminOnlyRoutes(req)) {
    // Must be authenticated
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    // Viewer/client roles cannot access admin routes
    if (role === 'viewer' || role === 'client') {
      return NextResponse.redirect(new URL('/client-view', req.url))
    }
  }

  // Auth-required routes (any role)
  if (authRequiredRoutes(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
