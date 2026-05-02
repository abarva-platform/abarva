import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isExternalOnlyRole, resolvePinnedSessionClientKey, resolveSessionRole, shouldStripUnauthorizedClientParam } from '@/lib/auth/access-routing'

const MOBILE_UA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
const ACTIVE_CLIENT_COOKIE = 'abarva_active_client'
// ADMIN8 — canonical path is /admin/production-readiness; the /platform/admin/*
// variant is preserved for the legacy redirect's pre-redirect response.
const PRODUCTION_READINESS_NO_STORE_PATHS = new Set([
  '/admin/production-readiness',
  '/platform/admin/production-readiness',
  '/api/admin/production-readiness',
])
const PRODUCTION_READINESS_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const

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
export const AUTH_REQUIRED_ROUTE_PATTERNS = [
  '/admin(.*)',
  '/maestro(.*)',
  '/home(.*)',
  '/dashboard(.*)',
  '/engagements(.*)',
  '/programs(.*)',
  '/engage/(.*)',
  '/users/(.*)',
  '/data(.*)',
  '/tower(.*)',
  '/sponsor(.*)',
  '/platform(.*)',
  // INT-1.3 · /intelligence is the J0 cold landing — corpus doctrine,
  // not tenant data — and is public. Sub-paths that touch tenant data
  // (Sentinel chat, validate_synthesis) self-gate. Legacy authoring /
  // quality / synthesize / author paths stay auth-gated until they are
  // either reshaped (INT-2+) or explicitly public.
  '/intelligence/author(.*)',
  '/intelligence/quality(.*)',
  '/intelligence/synthesize(.*)',
  '/intelligence/ask(.*)',
  '/intelligence/validate(.*)',
  '/source(.*)',
  '/product(.*)',
] as const

const authRequiredRoutes = createRouteMatcher([...AUTH_REQUIRED_ROUTE_PATTERNS])

function createSignInRedirect(request: NextRequest) {
  const url = new URL('/sign-in', request.url)
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
  if (requestedPath && requestedPath !== '/' && !request.nextUrl.pathname.startsWith('/sign-in')) {
    url.searchParams.set('redirect', requestedPath)
  }
  return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(url))
}

function isProductionReadinessNoStoreRequest(request: NextRequest) {
  return PRODUCTION_READINESS_NO_STORE_PATHS.has(request.nextUrl.pathname)
}

function withProductionReadinessNoStoreHeaders<T extends NextResponse>(request: NextRequest, response: T): T {
  if (!isProductionReadinessNoStoreRequest(request)) return response

  for (const [key, value] of Object.entries(PRODUCTION_READINESS_NO_STORE_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId, sessionClaims } = await auth()
  const metadata = (sessionClaims?.publicMetadata as { role?: string; clientId?: string; defaultClientId?: string } | undefined) ?? {}
  const metadataRole = metadata.role ?? null
  const email = (sessionClaims as { emailAddress?: string } | undefined)?.emailAddress ?? null
  const role = resolveSessionRole(metadataRole, email)
  const requestedClientId = request.nextUrl.searchParams.get('client')

  // /setup is a compatibility bridge for people who still use the old Setup
  // URL. Redirect it before Clerk's catch-all protect path can rewrite it to a
  // signed-out 404; /admin then owns the normal auth redirect if needed.
  if (request.nextUrl.pathname === '/setup' || request.nextUrl.pathname.startsWith('/setup/')) {
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL('/admin', request.url)))
  }

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
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(redirectUrl))
  }

  if (userId && (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/sign-in'))) {
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL('/auth-redirect', request.url)))
  }

  // Maestro routes — require authenticated Maestro/Admin/Investor
  if (maestroRoutes(request)) {
    if (!userId) {
      return createSignInRedirect(request)
    }
    if (role === 'client') {
      return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL('/home', request.url)))
    }
  }

  // Auth-required routes (any role)
  if (authRequiredRoutes(request) && !userId) {
    return createSignInRedirect(request)
  }

  if (authRequiredRoutes(request) && isExternalOnlyRole(role)) {
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL('/', request.url)))
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
    // B-01 fix: only write the cookie when the client key is EXPLICITLY
    // pinned via Clerk metadata or email inference. Using resolveSessionClientKey
    // here was wrong — it returns DEFAULT_CLIENT_KEY='meridian' when no explicit
    // pin is found, which overwrote any valid cookie the client had already set
    // (e.g. via the UI tenant-switcher). Admin/investor users and demo accounts
    // without Clerk clientId metadata would get their cookie silently reset to
    // 'meridian' on every public-route visit, causing the tenant binding leak.
    const explicitlyPinnedClient = resolvePinnedSessionClientKey({
      clientId: metadata.clientId,
      defaultClientId: metadata.defaultClientId,
      email,
    })
    if (explicitlyPinnedClient) {
      getResponse().cookies.set(ACTIVE_CLIENT_COOKIE, explicitlyPinnedClient, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      })
    }
  }

  // Tag mobile UA requests — consumed by server components via x-is-mobile header
  const ua = request.headers.get('user-agent') ?? ''
  if (MOBILE_UA.test(ua)) {
    getResponse().headers.set('x-is-mobile', '1')
  }

  if (isProductionReadinessNoStoreRequest(request)) {
    withProductionReadinessNoStoreHeaders(request, getResponse())
  }

  if (response) return response
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
