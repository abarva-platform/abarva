import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isExternalOnlyRole, resolveSessionClientKey, resolveSessionRole, shouldStripUnauthorizedClientParam } from '@/lib/auth/access-routing'

const MOBILE_UA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
const ACTIVE_CLIENT_COOKIE = 'abarva_active_client'

export const PUBLIC_ROUTE_PATTERNS = [
  '/sign-in(.*)',
  '/auth-redirect(.*)',
  '/',
  '/demo(.*)',
  '/investor(.*)',
  // Demo code sign-in starts unauthenticated from /sign-in, so the ticket
  // handoff route must stay publicly reachable and perform its own checks.
  '/api/auth/demo-code-sign-in(.*)',
] as const

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS])

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

function createSignInRedirect(request: NextRequest) {
  const url = new URL('/sign-in', request.url)
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
  if (requestedPath && requestedPath !== '/' && !request.nextUrl.pathname.startsWith('/sign-in')) {
    url.searchParams.set('redirect', requestedPath)
  }
  return NextResponse.redirect(url)
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId, sessionClaims } = await auth()
  const metadata = (sessionClaims?.publicMetadata as { role?: string; clientId?: string; defaultClientId?: string } | undefined) ?? {}
  const metadataRole = metadata.role ?? null
  const email = (sessionClaims as { emailAddress?: string } | undefined)?.emailAddress ?? null
  const role = resolveSessionRole(metadataRole, email)
  const requestedClientId = request.nextUrl.searchParams.get('client')

  if (
    authRequiredRoutes(request)
    && shouldStripUnauthorizedClientParam(
      role,
      {
        clientId: metadata.clientId,
        defaultClientId: metadata.defaultClientId,
        email,
      },
      requestedClientId,
    )
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.searchParams.delete('client')
    return NextResponse.redirect(redirectUrl)
  }

  if (userId && (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/sign-in'))) {
    return NextResponse.redirect(new URL('/auth-redirect', request.url))
  }

  // Maestro routes — require authenticated Maestro/Admin/Investor
  if (maestroRoutes(request)) {
    if (!userId) {
      return createSignInRedirect(request)
    }
    if (role === 'client') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  // Auth-required routes (any role)
  if (authRequiredRoutes(request) && !userId) {
    return createSignInRedirect(request)
  }

  if (authRequiredRoutes(request) && isExternalOnlyRole(role)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  let response: NextResponse | null = null
  function getResponse() {
    if (!response) response = NextResponse.next()
    return response
  }

  if (isPublicRoute(request) && !userId) {
    getResponse().cookies.delete(ACTIVE_CLIENT_COOKIE)
  }

  if (isPublicRoute(request) && userId && !isExternalOnlyRole(role)) {
    const pinnedClient = resolveSessionClientKey({
      clientId: metadata.clientId,
      defaultClientId: metadata.defaultClientId,
      email,
    })
    getResponse().cookies.set(ACTIVE_CLIENT_COOKIE, pinnedClient, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  // Tag mobile UA requests — consumed by server components via x-is-mobile header
  const ua = request.headers.get('user-agent') ?? ''
  if (MOBILE_UA.test(ua)) {
    getResponse().headers.set('x-is-mobile', '1')
  }

  if (response) return response
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
