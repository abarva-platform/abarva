import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isExternalOnlyRole, resolvePinnedSessionClientKey, resolveSessionRole, shouldStripUnauthorizedClientParam } from '@/lib/auth/access-routing'
import { isLaunchApprovedEmail } from '@/lib/auth/launch-access-server'

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
  '/access(.*)',
  '/sign-in(.*)',
  '/signed-out(.*)',
  '/access-denied',
  '/forbidden',
  '/invite(.*)',
  '/auth-redirect(.*)',
  '/',
  '/demo(.*)',
  '/investor(.*)',
  // P13 demo assets live under How it works and must be reachable
  // before auth so prospects can view the comparison/teaser pages.
  '/how-it-works(.*)',
  // Demo code sign-in starts unauthenticated from /access, so the ticket
  // handoff route must stay publicly reachable and perform its own checks.
  '/api/auth/demo-code-sign-in(.*)',
  '/api/auth/access-eligibility(.*)',
  // Health is intentionally public so platform probes can validate runtime
  // readiness before a browser session exists. The route masks raw backing
  // service errors when NODE_ENV=production.
  '/api/health',
  // Connectivity health is also public at the middleware layer, but the
  // route self-guards with `x-abarva-health-token` and returns JSON 404
  // without it. Keeping it out of Clerk avoids HTML sign-in redirects in
  // machine probes.
  '/api/health/azure-connectivity',
  // L9 Postgres disruption smoke is an operator-only probe, not a user
  // surface. It self-guards with the shared health token; keeping it
  // public at the middleware layer avoids Clerk HTML redirects in the
  // cutover harness.
  '/api/health/postgres-disruption',
  // Parallel-run invariants are machine-only and self-guarded by a bearer
  // token inside the route. It must stay outside Clerk so prod-vs-Azure
  // harnesses receive JSON pass/fail, not an HTML sign-in redirect.
  '/api/admin/parallel-run-invariants',
  // Notification APIs must return JSON auth/token responses rather than
  // Clerk HTML rewrites. Feed routes self-gate with Clerk/tenancy, and
  // dispatch self-guards with NOTIFICATION_DISPATCH_TOKEN/CRON_SECRET.
  '/api/notifications(.*)',
  // W4-PR-7 (2026-05-30) · Resend webhook receives bounce / complaint
  // / delivery events. The route MUST be reachable without a Clerk
  // session — Resend is an external sender. The route self-guards
  // with a Standard-Webhooks (svix-style) HMAC signature verified
  // against RESEND_WEBHOOK_SECRET. Without the secret env var the
  // route returns 503 (misconfigured) rather than accepting unsigned
  // payloads.
  '/api/webhooks/resend(.*)',
  // Private-preview lead capture from the public marketing landing page.
  // POST /api/request-access must be reachable without a Clerk session —
  // it is the signed-out "Request access" form. The route validates a work
  // email, stores the lead via the service-role write client, and notifies
  // admin@abarva.ai via Resend. No tenant data is read or written.
  '/api/request-access(.*)',
  // SEC-P1-11 (audit 2026-05-13): `/api/debug/tower-substrate` previously
  // lived here as "count-only diagnostic" — but it returned per-tenant
  // initiative counts publicly to anyone who knew the URL. The route is
  // now an authenticated diagnostic (any signed-in user, count-only is
  // still acceptable across the workspace). Removed from the public list.
  // INT-V3 (2026-05-07) · /intelligence is the public Explore Layer
  // surface — corpus doctrine, no tenant data leakage. Auth-required
  // sub-paths (author / quality / synthesize / ask / validate) are
  // still gated by AUTH_REQUIRED_ROUTE_PATTERNS, which is checked
  // before the public-route fall-through.
  '/intelligence(.*)',
  // `/product` is the public Product overview — the marketing nav's
  // "Platform → Product" link. It explains the four surfaces
  // (Intelligence / Moves / Source / Tower) for logged-out visitors
  // who need to see what the product is before signing in.
  '/product(.*)',
] as const

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS])
const isTokenGuardedPublicOpsRoute = createRouteMatcher([
  '/api/admin/parallel-run-invariants',
])

// Maestro workspace — requires any authenticated Maestro/Admin/Investor session
const maestroRoutes = createRouteMatcher([
  '/maestro(.*)',
])

// Routes that require any authenticated session. /admin(.*) still listed
// because redirects run in edge routing but leaving the auth matcher is
// belt-and-suspenders in case the redirect misses.
//
// SEC-P0-9 (2026-05-13): `/api/admin(.*)` is added explicitly. Previously
// only the page route `/admin(.*)` was matched; API admin endpoints fell
// through to `auth.protect()` which requires *any* signed-in user, not the
// admin role. Per-handler `requireAdminAuth()` or `requireTenancy()` calls
// provide the role/tenant check; this entry just ensures the auth gate fires.
//
// Similarly, the high-value write APIs that accept `clientId`/`tenantKey`
// from the request body are listed explicitly so the auth gate is obvious
// in this file rather than implicit through the public-route fall-through.
export const AUTH_REQUIRED_ROUTE_PATTERNS = [
  '/admin(.*)',
  '/api/admin(.*)',
  '/api/data(.*)',
  '/api/setup/(.*)',
  '/api/tower/(.*)',
  '/api/turn/(.*)',
  '/api/intelligence/query',
  // SEC-P1-10 (audit 2026-05-13): 27 `/api/reasoning/*` routes are
  // currently in-memory demo stubs. Per-handler `requireTenancy()` calls
  // are TODO when those routes get backed by Supabase persistence. For
  // now, the explicit pattern entry ensures the middleware auth gate is
  // recorded in this file rather than implicit through public-fallthrough.
  '/api/reasoning(.*)',
  // SEC-P1 belt-and-suspenders: `/api/v1/*` routes are mixed
  // signed-in/typed accessors. Listed explicitly so anyone adding a new
  // v1 endpoint knows the auth contract.
  '/api/v1/(.*)',
  '/maestro(.*)',
  // /home(.*) covers the canonical Home tree (PR-H2 route migration);
  // /admin(.*) stays in the list because it 301-redirects to /home
  // (the redirect happens early in the middleware so the auth check
  // never fires on /admin/* in practice, but we keep the guard for
  // belt-and-suspenders).
  '/home(.*)',
  '/dashboard(.*)',
  // PR-2 (2026-05-30) · `/engineering/*` is the new home for raw
  // diagnostic inspectors that used to live under /admin (Atlas
  // traces, etc.). Per docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md
  // §5.5 — Setup is the Trust Plane, not the Engineering surface.
  '/engineering(.*)',
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
] as const

const authRequiredRoutes = createRouteMatcher([...AUTH_REQUIRED_ROUTE_PATTERNS])

function resolveSessionEmail(sessionClaims: unknown): string | null {
  const claims = sessionClaims as
    | {
        emailAddress?: string | null
        emailAddresses?: Array<{ emailAddress?: string | null }>
        email_addresses?: Array<{ emailAddress?: string | null }>
      }
    | null
    | undefined

  return (
    claims?.emailAddress ??
    claims?.emailAddresses?.[0]?.emailAddress ??
    claims?.email_addresses?.[0]?.emailAddress ??
    null
  )
}

function createSignInRedirect(request: NextRequest) {
  const url = new URL('/access', request.url)
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
  if (requestedPath && requestedPath !== '/' && !request.nextUrl.pathname.startsWith('/access')) {
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
  const email = resolveSessionEmail(sessionClaims)
  const role = resolveSessionRole(metadataRole, email)
  const requestedClientId = request.nextUrl.searchParams.get('client')
  const isLaunchApprovedSession = !userId || isLaunchApprovedEmail(email)

  // Wave 1 PR-1 (2026-05-30) · Setup/Admin Trust Plane consolidation.
  // /admin/* is the single canonical route tree for the Setup/Admin
  // surface. /home is now the client-facing Enterprise Landscape.
  // Legacy /home panel pages that still re-export /admin counterparts
  // redirect below, but bare /home must never redirect to /admin.
  //
  // /home, /home/queue, /home/learn, /home/ai-initiatives*,
  // /home/configuration, /home/training stay as real /home pages and
  // are NOT remapped here.
  //
  // Wave 1 PR-3 (2026-05-30) · `/home/tenant-profile` now lands on the
  // tabbed `/admin?tab=tenant` (the standalone `/admin/tenant` route
  // was demoted to a tab inside /admin Overview — see AdminTenantTab).
  const homeToAdminMap: Record<string, string> = {
    '/home/data-trust': '/admin/data-trust',
    '/home/agent-readiness': '/admin/agent-readiness',
    '/home/connectors': '/admin/connectors',
    '/home/tenant-profile': '/admin?tab=tenant',
  }
  const exactHomeMatch = homeToAdminMap[request.nextUrl.pathname]
  if (exactHomeMatch) {
    // Wave 1 PR-3 (2026-05-30) · Targets may carry their own canonical
    // query params (e.g. `/admin?tab=tenant`). Merge any incoming search
    // string instead of naively concatenating with `+ request.nextUrl.search`.
    const url = new URL(exactHomeMatch, request.url)
    if (!exactHomeMatch.includes('?')) {
      url.search = request.nextUrl.search
    } else if (request.nextUrl.search) {
      const incoming = new URLSearchParams(request.nextUrl.search)
      incoming.forEach((value, key) => {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value)
      })
    }
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(url, 301))
  }
  // /home/connectors/<id> → /admin/connectors/<id> (preserve detail-page links).
  if (request.nextUrl.pathname.startsWith('/home/connectors/')) {
    const sub = request.nextUrl.pathname.slice('/home/connectors/'.length)
    const url = new URL('/admin/connectors/' + sub + request.nextUrl.search, request.url)
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(url, 301))
  }

  // PR-2 (2026-05-30) · Setup/Admin route consolidation — see
  // docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md §5.5. Redundant
  // `/admin/users` route deleted in favor of the richer
  // `/admin/users-access`. Invite flow demoted from top-level
  // route to modal launched from Users & Access. Atlas-named
  // routes either deprecated or relocated.
  const adminRouteConsolidationMap: Record<string, string> = {
    '/admin/users': '/admin/users-access',
    '/admin/invite': '/admin/users-access?invite=open',
    '/admin/agents/atlas': '/admin/cross-program-signals',
    '/admin/atlas/traces': '/engineering/traces',
    // Wave 1 PR-3 (2026-05-30) · Tenant configuration is demoted from a
    // standalone route to a tab inside /admin Overview. See
    // SETUP_AUDIT_2026-05-30_VERDICT §5.5 and AdminOverviewTabs.
    '/admin/tenant': '/admin?tab=tenant',
  }
  const consolidationMatch = adminRouteConsolidationMap[request.nextUrl.pathname]
  if (consolidationMatch) {
    const url = new URL(consolidationMatch, request.url)
    if (!consolidationMatch.includes('?')) {
      url.search = request.nextUrl.search
    } else if (request.nextUrl.search) {
      // Preserve any incoming query params alongside the canned ones.
      const incoming = new URLSearchParams(request.nextUrl.search)
      incoming.forEach((value, key) => {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value)
      })
    }
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(url, 301))
  }
  // /admin/ai-initiatives/<id> → /home/ai-initiatives/<id>
  if (request.nextUrl.pathname.startsWith('/admin/ai-initiatives/')) {
    const sub = request.nextUrl.pathname.slice('/admin/ai-initiatives/'.length)
    const url = new URL('/home/ai-initiatives/' + sub + request.nextUrl.search, request.url)
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(url, 301))
  }

  // /setup compatibility bridge — /setup/* maps to /home/* (which then
  // hits the home→admin redirects above when applicable). CL-1
  // (2026-05-30) · /setup itself now hops straight to /admin to avoid
  // a double-redirect through /home → /admin.
  if (request.nextUrl.pathname === '/setup') {
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL('/admin', request.url), 301))
  }
  if (request.nextUrl.pathname.startsWith('/setup/')) {
    const sub = request.nextUrl.pathname.slice('/setup/'.length)
    const homeCandidate = '/home/' + sub
    const target = homeToAdminMap[homeCandidate] ?? homeCandidate
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL(target + request.nextUrl.search, request.url), 301))
  }

  const requiresAuth = authRequiredRoutes(request) && !isTokenGuardedPublicOpsRoute(request)

  if (request.nextUrl.pathname === '/signed-out') {
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL('/', request.url), 307))
  }

  if (request.nextUrl.pathname === '/forbidden') {
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL('/access-denied', request.url), 307))
  }

  if (
    requiresAuth
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

  if (userId && !isLaunchApprovedSession && !request.nextUrl.pathname.startsWith('/access-denied')) {
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL('/access-denied', request.url)))
  }

  if (!userId && request.nextUrl.pathname.startsWith('/sign-in')) {
    return withProductionReadinessNoStoreHeaders(request, NextResponse.redirect(new URL('/', request.url)))
  }

  if (userId && (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/sign-in') || request.nextUrl.pathname.startsWith('/access'))) {
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
  if (requiresAuth && !userId) {
    return createSignInRedirect(request)
  }

  if (requiresAuth && isExternalOnlyRole(role)) {
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
