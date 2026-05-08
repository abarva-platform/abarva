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
  // INT-V3 (2026-05-07) · /intelligence is the public Explore Layer
  // surface — corpus doctrine, no tenant data leakage. Auth-required
  // sub-paths (author / quality / synthesize / ask / validate) are
  // still gated by AUTH_REQUIRED_ROUTE_PATTERNS, which is checked
  // before the public-route fall-through.
  '/intelligence(.*)',
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
  // /home(.*) covers the canonical Home tree (PR-H2 route migration);
  // /admin(.*) stays in the list because it 301-redirects to /home
  // (the redirect happens early in the middleware so the auth check
  // never fires on /admin/* in practice, but we keep the guard for
  // belt-and-suspenders).
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

  // H2 (2026-05-07) · Route consolidation per Home Refinement Package
  // ROUTE_MIGRATION.md. Old /setup and /admin URLs 301-redirect to
  // /home equivalents. Specific panel mappings handled before the
  // catch-alls.
  const adminToHomeMap: Record<string, string> = {
    '/admin': '/home',
    '/admin/data-trust': '/home/data-trust',
    '/admin/ai-initiatives': '/home/ai-initiatives',
    '/admin/agent-readiness': '/home/agent-readiness',
    '/admin/connectors': '/home/connectors',
    '/admin/tenant': '/home/tenant-profile',
  }
  const exactAdminMatch = adminToHomeMap[request.nextUrl.pathname]
  if (exactAdminMatch) {
    const url = new URL(exactAdminMatch + request.nextUrl.search, request.url)
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(url, 301))
  }
  // /admin/ai-initiatives/<id> → /home/ai-initiatives/<id>
  if (request.nextUrl.pathname.startsWith('/admin/ai-initiatives/')) {
    const sub = request.nextUrl.pathname.slice('/admin/ai-initiatives/'.length)
    const url = new URL('/home/ai-initiatives/' + sub + request.nextUrl.search, request.url)
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(url, 301))
  }
  // /setup catch-all → /home (preserves the previous /setup compatibility
  // bridge but skipping the /admin hop). Sub-paths follow the panel map
  // implicitly because they're handled by the /admin → /home redirects
  // when /setup → /admin redirects below.
  if (request.nextUrl.pathname === '/setup') {
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL('/home', request.url), 301))
  }
  if (request.nextUrl.pathname.startsWith('/setup/')) {
    const sub = request.nextUrl.pathname.slice('/setup/'.length)
    // Map setup panels through the same admin-to-home name table when
    // possible; fall back to /home/<sub> directly.
    const candidate = '/admin/' + sub
    const target = adminToHomeMap[candidate] ?? '/home/' + sub
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL(target + request.nextUrl.search, request.url), 301))
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
