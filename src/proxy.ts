import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  isExternalOnlyRole,
  resolvePinnedSessionClientKey,
  resolveSessionRole,
  shouldDenySourceEventSlugForActiveClient,
  shouldDenySourceEventSlugForPinnedClient,
  shouldStripUnauthorizedClientParam,
} from "@/lib/auth/access-routing";
import {
  FOUNDATION_HOME_KNOWLEDGE_ROUTE,
  foundationKnowledgePath,
  isFoundationRouteAllowedForMetadata,
  resolveFoundationTenantKeyFromMetadata,
  resolveFoundationTenantKeyFromSessionInput,
} from "@/lib/auth/foundation-route-access";
import {
  loadSourceLifecycleRouteAction,
  parseSourceEventRoute,
} from "@/lib/source/lifecycle-routing-guard";
import {
  PRIVATE_BROWSER_PROOF_SESSION_COOKIE,
  readPrivateBrowserProofSessionValue,
} from "@/lib/auth/private-browser-proof-session";

const MOBILE_UA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const ACTIVE_CLIENT_COOKIE = "abarva_active_client";
// ADMIN8 — canonical path is /admin/production-readiness; the /platform/admin/*
// variant is preserved for the legacy redirect's pre-redirect response.
const PRODUCTION_READINESS_NO_STORE_PATHS = new Set([
  "/admin/production-readiness",
  "/platform/admin/production-readiness",
  "/api/admin/production-readiness",
]);
const PRODUCTION_READINESS_NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;
export const ACTIVE_ADMIN_SUBROUTES = new Set<string>([
  "/admin/candidate-preview",
  "/admin/context-layer/approval-queue",
  "/admin/data-layer-explorer",
  "/admin/knowledge-preview",
] as const);

export function shouldBlanketStripClientParamFromProtectedTree(args: {
  pathname: string;
  role: string | null | undefined;
}): boolean {
  if (args.role === "admin") return false;
  return (
    args.pathname === "/tower" ||
    args.pathname.startsWith("/tower/") ||
    args.pathname === "/home" ||
    args.pathname.startsWith("/home/") ||
    args.pathname === "/admin" ||
    args.pathname.startsWith("/admin/")
  );
}

export function shouldPreserveClientParamForSourceWorkspaceGuard(
  pathname: string,
): boolean {
  return (
    pathname === "/source/workspace" ||
    pathname.startsWith("/source/workspace/") ||
    pathname === "/source/360" ||
    pathname.startsWith("/source/360/") ||
    pathname === "/source/preview/workspace" ||
    pathname.startsWith("/source/preview/workspace/")
  );
}

export const PUBLIC_ROUTE_PATTERNS = [
  "/sign-in(.*)",
  "/signed-out(.*)",
  "/invite(.*)",
  "/access",
  "/access-denied",
  "/auth-redirect(.*)",
  "/",
  // Public marketing video/demo page. This is not a product workspace; deeper
  // /demo/* product/demo workspaces remain auth-gated below.
  "/demo",
  // Keep the signed-out surface intentionally lean. Product, architecture,
  // training, model-card, contact, status, and other detail pages are private
  // workspace material unless the user is signed in.
  //
  // These two Responsible AI checkpoints stay public at proxy level because
  // signed-in users are redirected here before the app shell renders. The
  // pages self-gate server-side and redirect anonymous visitors to sign-in.
  "/responsible-ai/acknowledgment(.*)",
  "/responsible-ai/training(.*)",
  // Demo code sign-in starts unauthenticated from /sign-in, so the ticket
  // handoff route must stay publicly reachable and perform its own checks.
  "/api/auth/demo-code-sign-in(.*)",
  "/api/auth/access-eligibility(.*)",
  // Private browser proof helper is self-guarded by an opt-in env flag and
  // bearer token, and returns 404 unless explicitly enabled on an isolated
  // proof revision.
  "/api/auth/private-browser-proof(.*)",
  // Health is intentionally public so platform probes can validate runtime
  // readiness before a browser session exists. The route masks raw backing
  // service errors when NODE_ENV=production.
  "/api/health",
  // Connectivity health is also public at the middleware layer, but the
  // route self-guards with `x-abarva-health-token` and returns JSON 404
  // without it. Keeping it out of Clerk avoids HTML sign-in redirects in
  // machine probes.
  "/api/health/azure-connectivity",
  // L9 Postgres disruption smoke is an operator-only probe, not a user
  // surface. It self-guards with the shared health token; keeping it
  // public at the middleware layer avoids Clerk HTML redirects in the
  // cutover harness.
  "/api/health/postgres-disruption",
  // Parallel-run invariants are machine-only and self-guarded by a bearer
  // token inside the route. It must stay outside Clerk so prod-vs-Azure
  // harnesses receive JSON pass/fail, not an HTML sign-in redirect.
  "/api/admin/parallel-run-invariants",
  // Notification APIs must return JSON auth/token responses rather than
  // Clerk HTML rewrites. Feed routes self-gate with Clerk/tenancy, and
  // dispatch self-guards with NOTIFICATION_DISPATCH_TOKEN/CRON_SECRET.
  "/api/notifications(.*)",
  // W4-PR-7 (2026-05-30) · Resend webhook receives bounce / complaint
  // / delivery events. The route MUST be reachable without a Clerk
  // session — Resend is an external sender. The route self-guards
  // with a Standard-Webhooks (svix-style) HMAC signature verified
  // against RESEND_WEBHOOK_SECRET. Without the secret env var the
  // route returns 503 (misconfigured) rather than accepting unsigned
  // payloads.
  "/api/webhooks/resend(.*)",
  // Private-preview lead capture from the public marketing landing page.
  // POST /api/request-access must be reachable without a Clerk session.
  "/api/request-access(.*)",
  // SEC-P1-11 (audit 2026-05-13): `/api/debug/tower-substrate` previously
  // lived here as "count-only diagnostic" — but it returned per-tenant
  // initiative counts publicly to anyone who knew the URL. The route is
  // now an authenticated diagnostic (any signed-in user, count-only is
  // still acceptable across the workspace). Removed from the public list.
] as const;

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS]);

/**
 * Should a non-public request be answered with a JSON 401 instead of Clerk's
 * HTML sign-in redirect?
 *
 * Only for `/api/*`, and only when there is no session. A redirect is correct
 * for a page — a human should land on sign-in. It is wrong for an API call:
 * the redirect reaches `fetch()` as an opaque cross-document navigation, so the
 * caller sees `TypeError: Failed to fetch` and an expired session is
 * indistinguishable from a network fault.
 */
export function shouldAnswerUnauthenticatedApiWithJson(
  pathname: string,
  userId: string | null | undefined,
): boolean {
  return !userId && pathname.startsWith("/api/");
}

const isTokenGuardedPublicOpsRoute = createRouteMatcher([
  "/api/admin/parallel-run-invariants",
]);

// Maestro workspace — requires any authenticated Maestro/Admin/Investor session
const maestroRoutes = createRouteMatcher(["/maestro(.*)"]);

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
  "/admin(.*)",
  "/api/admin(.*)",
  "/api/data(.*)",
  "/api/setup/(.*)",
  "/api/tower/(.*)",
  "/api/turn/(.*)",
  "/api/intelligence/query",
  // SEC-P1-10 (audit 2026-05-13): 27 `/api/reasoning/*` routes are
  // currently in-memory demo stubs. Per-handler `requireTenancy()` calls
  // are TODO when those routes get backed by Supabase persistence. For
  // now, the explicit pattern entry ensures the middleware auth gate is
  // recorded in this file rather than implicit through public-fallthrough.
  "/api/reasoning(.*)",
  // SEC-P1 belt-and-suspenders: `/api/v1/*` routes are mixed
  // signed-in/typed accessors. Listed explicitly so anyone adding a new
  // v1 endpoint knows the auth contract.
  "/api/v1/(.*)",
  "/maestro(.*)",
  // /home(.*) covers the canonical Home tree (PR-H2 route migration);
  // /admin(.*) stays in the list because it 301-redirects to /home
  // (the redirect happens early in the middleware so the auth check
  // never fires on /admin/* in practice, but we keep the guard for
  // belt-and-suspenders).
  "/home(.*)",
  "/dashboard(.*)",
  // PR-2 (2026-05-30) · `/engineering/*` is the new home for raw
  // diagnostic inspectors that used to live under /admin (Atlas
  // traces, etc.). Per docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md
  // §5.5 — Setup is the Trust Plane, not the Engineering surface.
  "/engineering(.*)",
  "/engagements(.*)",
  "/programs(.*)",
  "/engage/(.*)",
  "/users/(.*)",
  "/data(.*)",
  "/tower(.*)",
  "/sponsor(.*)",
  "/platform(.*)",
  // INT-1.3 · /intelligence is the J0 cold landing — corpus doctrine,
  // not tenant data — and is public. Sub-paths that touch tenant data
  // (Sentinel chat, validate_synthesis) self-gate. Legacy authoring /
  // quality / synthesize / author paths stay auth-gated until they are
  // either reshaped (INT-2+) or explicitly public.
  "/intelligence/author(.*)",
  "/intelligence/quality(.*)",
  "/intelligence/synthesize(.*)",
  "/intelligence/ask(.*)",
  "/intelligence/validate(.*)",
  "/source(.*)",
  "/architecture(.*)",
  "/atlas(.*)",
  "/contradictions(.*)",
  "/demo/programs(.*)",
  "/demo/explore(.*)",
  "/demo/agent-markdown-fixture(.*)",
  "/digest(.*)",
  "/editorial(.*)",
  "/intelligence(.*)",
  "/investor(.*)",
  "/investors(.*)",
  "/patterns(.*)",
  "/solutions(.*)",
  "/training(.*)",
] as const;

const authRequiredRoutes = createRouteMatcher([
  ...AUTH_REQUIRED_ROUTE_PATTERNS,
]);

export function isActiveAdminSubroute(pathname: string): boolean {
  return ACTIVE_ADMIN_SUBROUTES.has(pathname);
}

function shouldBypassClerkForAxe(request: NextRequest) {
  return (
    process.env.ACCESSIBILITY_AXE_DISABLE_CLERK === "1" &&
    isPublicRoute(request)
  );
}

function createSignInRedirect(request: NextRequest) {
  const url = new URL("/sign-in", request.url);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (
    requestedPath &&
    requestedPath !== "/" &&
    !request.nextUrl.pathname.startsWith("/sign-in")
  ) {
    url.searchParams.set("redirect", requestedPath);
  }
  return withProductionReadinessNoStoreHeaders(
    request,
    NextResponse.redirect(url),
  );
}

function isProductionReadinessNoStoreRequest(request: NextRequest) {
  return PRODUCTION_READINESS_NO_STORE_PATHS.has(request.nextUrl.pathname);
}

function sourceEventSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/source\/events\/([^/]+)(?:\/.*)?$/);
  return match?.[1] ?? null;
}

function createGenericNotFoundResponse(): NextResponse {
  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function withProductionReadinessNoStoreHeaders<T extends NextResponse>(
  request: NextRequest,
  response: T,
): T {
  if (!isProductionReadinessNoStoreRequest(request)) return response;

  for (const [key, value] of Object.entries(
    PRODUCTION_READINESS_NO_STORE_HEADERS,
  )) {
    response.headers.set(key, value);
  }
  return response;
}

interface ProxySessionMetadata extends Record<string, unknown> {
  role?: string;
  clientId?: string;
  defaultClientId?: string;
  foundationTenant?: boolean;
  proofLogin?: boolean;
  foundationTenantKey?: string;
  tenantKey?: string;
  allowedRoutes?: string[];
  moduleAccess?: string[];
}

interface ProxySessionIdentity {
  metadata: ProxySessionMetadata;
  email: string | null;
  source: "session_claims" | "clerk_user_fallback" | "private_browser_proof";
}

interface ClerkUserIdentityLike {
  publicMetadata?: unknown;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }> | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(
  value: Record<string, unknown>,
  key: keyof ProxySessionMetadata,
): string | undefined {
  const field = value[key];
  return typeof field === "string" && field.trim() ? field : undefined;
}

function booleanField(
  value: Record<string, unknown>,
  key: keyof ProxySessionMetadata,
): boolean | undefined {
  const field = value[key];
  return typeof field === "boolean" ? field : undefined;
}

function stringArrayField(
  value: Record<string, unknown>,
  key: keyof ProxySessionMetadata,
): string[] | undefined {
  const field = value[key];
  if (!Array.isArray(field)) return undefined;
  const strings = field.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
  return strings.length ? strings : undefined;
}

function normalizeProxyMetadata(value: unknown): ProxySessionMetadata {
  if (!isRecord(value)) return {};
  return {
    role: stringField(value, "role"),
    clientId: stringField(value, "clientId"),
    defaultClientId: stringField(value, "defaultClientId"),
    foundationTenant: booleanField(value, "foundationTenant"),
    proofLogin: booleanField(value, "proofLogin"),
    foundationTenantKey: stringField(value, "foundationTenantKey"),
    tenantKey: stringField(value, "tenantKey"),
    allowedRoutes: stringArrayField(value, "allowedRoutes"),
    moduleAccess: stringArrayField(value, "moduleAccess"),
  };
}

function emailFromClaims(sessionClaims: unknown): string | null {
  if (!isRecord(sessionClaims)) return null;
  const email = sessionClaims.emailAddress;
  return typeof email === "string" && email.trim() ? email : null;
}

function emailFromClerkUser(user: ClerkUserIdentityLike | null): string | null {
  const primary = user?.primaryEmailAddress?.emailAddress;
  if (typeof primary === "string" && primary.trim()) return primary;
  const first = user?.emailAddresses?.find(
    (entry) =>
      typeof entry.emailAddress === "string" && entry.emailAddress.trim(),
  )?.emailAddress;
  return first ?? null;
}

export function shouldFetchClerkUserForProxyIdentity(
  identity: ProxySessionIdentity,
  pathname: string | null = null,
): boolean {
  if (
    pathname &&
    (pathname === FOUNDATION_HOME_KNOWLEDGE_ROUTE ||
      pathname.startsWith(`${FOUNDATION_HOME_KNOWLEDGE_ROUTE}/`)) &&
    !isFoundationRouteAllowedForMetadata(pathname, identity.metadata)
  ) {
    return true;
  }

  const sessionLooksFoundationBound = Boolean(
    resolveFoundationTenantKeyFromSessionInput({
      foundationTenantKey: identity.metadata.foundationTenantKey,
      tenantKey: identity.metadata.tenantKey,
      clientId: identity.metadata.clientId,
      defaultClientId: identity.metadata.defaultClientId,
    }),
  );
  return (
    !identity.metadata.role ||
    !identity.metadata.clientId ||
    !identity.metadata.defaultClientId ||
    !identity.email ||
    (sessionLooksFoundationBound &&
      (!identity.metadata.foundationTenant ||
        !identity.metadata.proofLogin ||
        !identity.metadata.allowedRoutes ||
        !identity.metadata.moduleAccess))
  );
}

export function readProxySessionIdentity(
  sessionClaims: unknown,
  clerkUser: ClerkUserIdentityLike | null = null,
): ProxySessionIdentity {
  const claimsMetadata = normalizeProxyMetadata(
    isRecord(sessionClaims) ? sessionClaims.publicMetadata : undefined,
  );
  const clerkMetadata = normalizeProxyMetadata(clerkUser?.publicMetadata);
  const hasClerkMetadata =
    Boolean(clerkMetadata.role) ||
    Boolean(clerkMetadata.clientId) ||
    Boolean(clerkMetadata.defaultClientId) ||
    Boolean(clerkMetadata.foundationTenant) ||
    Boolean(clerkMetadata.proofLogin) ||
    Boolean(clerkMetadata.foundationTenantKey) ||
    Boolean(clerkMetadata.tenantKey) ||
    Boolean(clerkMetadata.allowedRoutes?.length) ||
    Boolean(clerkMetadata.moduleAccess?.length);

  return {
    metadata: {
      role: claimsMetadata.role ?? clerkMetadata.role,
      clientId: claimsMetadata.clientId ?? clerkMetadata.clientId,
      defaultClientId:
        claimsMetadata.defaultClientId ?? clerkMetadata.defaultClientId,
      foundationTenant:
        claimsMetadata.foundationTenant ?? clerkMetadata.foundationTenant,
      proofLogin: claimsMetadata.proofLogin ?? clerkMetadata.proofLogin,
      foundationTenantKey:
        claimsMetadata.foundationTenantKey ?? clerkMetadata.foundationTenantKey,
      tenantKey: claimsMetadata.tenantKey ?? clerkMetadata.tenantKey,
      allowedRoutes:
        claimsMetadata.allowedRoutes ?? clerkMetadata.allowedRoutes,
      moduleAccess: claimsMetadata.moduleAccess ?? clerkMetadata.moduleAccess,
    },
    email: emailFromClaims(sessionClaims) ?? emailFromClerkUser(clerkUser),
    source: hasClerkMetadata ? "clerk_user_fallback" : "session_claims",
  };
}

async function resolveProxySessionIdentity(
  sessionClaims: unknown,
  userId: string | null,
  pathname: string | null = null,
): Promise<ProxySessionIdentity> {
  const identity = readProxySessionIdentity(sessionClaims);
  if (!userId || !shouldFetchClerkUserForProxyIdentity(identity, pathname)) {
    return identity;
  }

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    return readProxySessionIdentity(sessionClaims, user);
  } catch (error) {
    console.warn(
      "[proxy] Clerk user metadata fallback failed; continuing with session claims only",
      error,
    );
    return identity;
  }
}

const clerkProtectedProxy = clerkMiddleware(
  async (auth, request: NextRequest) => {
    const { userId, sessionClaims } = await auth();
    const privateProofSession = await readPrivateBrowserProofSessionValue(
      request.cookies.get(PRIVATE_BROWSER_PROOF_SESSION_COOKIE)?.value,
    );
    const identity =
      privateProofSession && !userId
        ? {
            metadata: {
              role: privateProofSession.role,
              clientId: privateProofSession.clientId,
              defaultClientId: privateProofSession.defaultClientId,
              tenantKey: privateProofSession.tenantKey,
              moduleAccess: privateProofSession.moduleAccess,
            },
            email: privateProofSession.email,
            source: "private_browser_proof" as const,
          }
        : await resolveProxySessionIdentity(
            sessionClaims,
            userId,
            request.nextUrl.pathname,
          );
    const metadata = identity.metadata;
    const metadataRole = metadata.role ?? null;
    const email = identity.email;
    const role = resolveSessionRole(metadataRole, email);
    const isAuthenticated = Boolean(userId || privateProofSession);
    const requestedClientId = request.nextUrl.searchParams.get("client");
    const activeClientId =
      request.cookies.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;

    // Wave 1 PR-1 (2026-05-30) · Setup/Admin Trust Plane consolidation.
    // /admin/* is the single canonical route tree for the Setup/Admin
    // surface. The parallel /home/* re-export tree is retired. The
    // panel pages that previously re-exported /admin/* counterparts now
    // 301-redirect /home/<panel> → /admin/<panel> so any persisted links
    // continue to resolve.
    //
    // /home, /home/queue, and /home/learn stay as real /home pages and
    // are NOT remapped here. Setup/admin surfaces such as configuration, connectors,
    // data trust, agent readiness, and tenant profile stay canonical
    // under /admin.
    //
    // Wave 1 PR-3 (2026-05-30) · `/home/tenant-profile` now lands on the
    // tabbed `/admin?tab=tenant` (the standalone `/admin/tenant` route
    // was demoted to a tab inside /admin Overview — see AdminTenantTab).
    const homeToAdminMap: Record<string, string> = {
      "/home/admin": "/admin",
      "/home/data-loads": "/admin",
      "/home/data-trust": "/admin",
      "/home/agent-readiness": "/admin",
      "/home/connectors": "/admin",
      "/home/configuration": "/admin",
      "/home/tenant-profile": "/admin",
      "/home/decision": "/intelligence",
      "/home/source": "/source",
      "/home/training": "/home/learn",
      "/home/ai-initiatives": "/home",
    };
    const exactHomeMatch = homeToAdminMap[request.nextUrl.pathname];
    if (exactHomeMatch) {
      // Wave 1 PR-3 (2026-05-30) · Targets may carry their own canonical
      // query params (e.g. `/admin?tab=tenant`). Merge any incoming search
      // string instead of naively concatenating with `+ request.nextUrl.search`.
      const url = new URL(exactHomeMatch, request.url);
      if (!exactHomeMatch.includes("?")) {
        url.search = request.nextUrl.search;
      } else if (request.nextUrl.search) {
        const incoming = new URLSearchParams(request.nextUrl.search);
        incoming.forEach((value, key) => {
          if (!url.searchParams.has(key)) url.searchParams.set(key, value);
        });
      }
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(url, 301),
      );
    }
    // /home/admin/<path> → /admin/<path> (preserve stale admin bookmarks).
    if (request.nextUrl.pathname.startsWith("/home/admin/")) {
      const url = new URL("/admin" + request.nextUrl.search, request.url);
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(url, 301),
      );
    }
    // /home/connectors/<id> → /admin/connectors/<id> (preserve detail-page links).
    if (request.nextUrl.pathname.startsWith("/home/connectors/")) {
      const url = new URL("/admin" + request.nextUrl.search, request.url);
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(url, 301),
      );
    }
    if (request.nextUrl.pathname.startsWith("/home/ai-initiatives/")) {
      const url = new URL("/home" + request.nextUrl.search, request.url);
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(url, 301),
      );
    }

    // 2026-06-14 · Admin/Setup sunset.
    // The canonical Setup experience is now one Stripe-like surface at
    // /admin. Legacy /admin/* UI pages remain in the repo only as retired
    // implementation detail while the route tree is drained. Keep APIs
    // under /api/admin/* untouched; this branch handles browser pages only.
    const adminRouteConsolidationMap: Record<string, string> = {
      "/admin/data-load": "/admin",
      "/admin/data-loads": "/admin",
      "/admin/users": "/admin",
      "/admin/invite": "/admin",
      "/admin/agents/atlas": "/admin",
      "/admin/atlas/traces": "/admin",
      "/admin/tenant": "/admin",
    };
    const consolidationMatch =
      adminRouteConsolidationMap[request.nextUrl.pathname];
    if (consolidationMatch) {
      const url = new URL(consolidationMatch, request.url);
      if (!consolidationMatch.includes("?")) {
        url.search = request.nextUrl.search;
      } else if (request.nextUrl.search) {
        // Preserve any incoming query params alongside the canned ones.
        const incoming = new URLSearchParams(request.nextUrl.search);
        incoming.forEach((value, key) => {
          if (!url.searchParams.has(key)) url.searchParams.set(key, value);
        });
      }
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(url, 301),
      );
    }
    if (
      request.nextUrl.pathname.startsWith("/admin/") &&
      !isActiveAdminSubroute(request.nextUrl.pathname)
    ) {
      const url = new URL("/admin", request.url);
      if (request.nextUrl.pathname !== "/admin/setup") {
        url.searchParams.set("from", request.nextUrl.pathname);
      }
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(url, 301),
      );
    }
    // /admin/ai-initiatives/<id> → /home/ai-initiatives/<id>
    if (request.nextUrl.pathname.startsWith("/admin/ai-initiatives/")) {
      const sub = request.nextUrl.pathname.slice(
        "/admin/ai-initiatives/".length,
      );
      const url = new URL(
        "/home/ai-initiatives/" + sub + request.nextUrl.search,
        request.url,
      );
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(url, 301),
      );
    }

    // /setup compatibility bridge. /setup itself goes directly to /admin.
    // Setup-ish descendants resolve through the canonical admin map above;
    // only retained non-setup Home descendants are allowed to remain /home/*.
    if (request.nextUrl.pathname === "/setup") {
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(new URL("/admin", request.url), 301),
      );
    }
    if (request.nextUrl.pathname.startsWith("/setup/")) {
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(new URL("/admin", request.url), 301),
      );
    }

    if (
      request.nextUrl.pathname === FOUNDATION_HOME_KNOWLEDGE_ROUTE ||
      request.nextUrl.pathname.startsWith(`${FOUNDATION_HOME_KNOWLEDGE_ROUTE}/`)
    ) {
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(new URL("/home", request.url), 302),
      );
    }

    const requiresAuth =
      authRequiredRoutes(request) && !isTokenGuardedPublicOpsRoute(request);

    const foundationTenantKey =
      resolveFoundationTenantKeyFromMetadata(metadata);
    const isHomeKnowledgeRoute =
      request.nextUrl.pathname === FOUNDATION_HOME_KNOWLEDGE_ROUTE ||
      request.nextUrl.pathname.startsWith(
        `${FOUNDATION_HOME_KNOWLEDGE_ROUTE}/`,
      );
    if (
      requiresAuth &&
      isAuthenticated &&
      isHomeKnowledgeRoute &&
      !isFoundationRouteAllowedForMetadata(request.nextUrl.pathname, metadata)
    ) {
      return createGenericNotFoundResponse();
    }

    if (
      requiresAuth &&
      isAuthenticated &&
      foundationTenantKey &&
      !isFoundationRouteAllowedForMetadata(request.nextUrl.pathname, metadata)
    ) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return createGenericNotFoundResponse();
      }
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(
          new URL(foundationKnowledgePath(foundationTenantKey), request.url),
          302,
        ),
      );
    }

    const preserveSourceWorkspaceClientParam =
      shouldPreserveClientParamForSourceWorkspaceGuard(
        request.nextUrl.pathname,
      );
    if (
      requiresAuth &&
      !preserveSourceWorkspaceClientParam &&
      shouldStripUnauthorizedClientParam(
        role,
        {
          clientId: metadata.clientId,
          defaultClientId: metadata.defaultClientId,
          email,
        },
        requestedClientId,
      )
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.searchParams.delete("client");
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(redirectUrl),
      );
    }

    // SHIP-NOW #3 (2026-06-02) · Strip foreign ?client= injection on /tower,
    // /home, and /admin route trees. The admin tenant-switch path remains
    // legitimate — `resolvePostSignInPath()` mints `/home?client=<resolved>`
    // / `/tower?client=<resolved>` for admins, and admin users are allowed
    // to retain the param so the tenant-switcher continues to work.
    //
    // For every non-admin role on these route trees, an inbound ?client=
    // param is treated as injection (the canonical tenant binding lives in
    // Clerk metadata + the ACTIVE_CLIENT_COOKIE, not the query string).
    // Source is intentionally not included here. Workspace-style Source routes
    // preserve their explicit tenant request so the page can render an
    // access-gated blocked state without loading fallback tenant data; other
    // Source routes keep the access-routing predicate above.
    if (requestedClientId && role !== "admin") {
      const pathname = request.nextUrl.pathname;
      if (shouldBlanketStripClientParamFromProtectedTree({ pathname, role })) {
        console.warn(
          `[proxy] stripping foreign ?client= injection on ${pathname} (role=${role ?? "anon"}, requested=${requestedClientId})`,
        );
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.searchParams.delete("client");
        return withProductionReadinessNoStoreHeaders(
          request,
          NextResponse.redirect(redirectUrl, 302),
        );
      }
    }

    // Keep the bare domain as the public marketing/request-access landing page
    // even when a visitor still has a Clerk session. App entry continues through
    // /sign-in and /auth-redirect.
    if (isAuthenticated && request.nextUrl.pathname.startsWith("/sign-in")) {
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(new URL("/auth-redirect", request.url)),
      );
    }

    // Maestro routes — require authenticated Maestro/Admin/Investor
    if (maestroRoutes(request)) {
      if (!isAuthenticated) {
        return createSignInRedirect(request);
      }
      if (role === "client") {
        return withProductionReadinessNoStoreHeaders(
          request,
          NextResponse.redirect(new URL("/home", request.url)),
        );
      }
    }

    // Auth-required routes (any role)
    if (requiresAuth && !isAuthenticated) {
      return createSignInRedirect(request);
    }

    if (requiresAuth && isExternalOnlyRole(role)) {
      return withProductionReadinessNoStoreHeaders(
        request,
        NextResponse.redirect(new URL("/", request.url)),
      );
    }

    const sourceEventSlug = sourceEventSlugFromPath(request.nextUrl.pathname);
    if (
      requiresAuth &&
      sourceEventSlug &&
      (shouldDenySourceEventSlugForActiveClient(
        activeClientId,
        sourceEventSlug,
      ) ||
        shouldDenySourceEventSlugForPinnedClient(
          role,
          {
            clientId: metadata.clientId,
            defaultClientId: metadata.defaultClientId,
            email,
          },
          sourceEventSlug,
        ))
    ) {
      return createGenericNotFoundResponse();
    }

    const sourceLifecycleRoute = parseSourceEventRoute(
      request.nextUrl.pathname,
    );
    if (requiresAuth && isAuthenticated && sourceLifecycleRoute) {
      const lifecycleClientKey =
        activeClientId ??
        resolvePinnedSessionClientKey({
          clientId: metadata.clientId,
          defaultClientId: metadata.defaultClientId,
          email,
        }) ??
        (role === "admin" ? requestedClientId : null);
      const routeAction = await loadSourceLifecycleRouteAction({
        eventId: sourceLifecycleRoute.eventId,
        clientKey: lifecycleClientKey,
        pathname: request.nextUrl.pathname,
        search: request.nextUrl.search,
      });
      if (routeAction.type === "redirect") {
        return withProductionReadinessNoStoreHeaders(
          request,
          NextResponse.redirect(
            new URL(routeAction.destination, request.url),
            routeAction.status ?? 302,
          ),
        );
      }
    }

    if (!isPublicRoute(request) && !privateProofSession) {
      // An unauthenticated API call must fail as JSON 401, not as an HTML
      // sign-in redirect. `auth.protect()` redirects, and a redirect to a
      // different document reaches `fetch()` as an opaque navigation — the
      // caller sees `TypeError: Failed to fetch`, so an expired session is
      // indistinguishable from the network being down. Live-found: every
      // authenticated probe against a signed-out session failed that way, with
      // nothing in the response saying "you are signed out".
      //
      // This is also why several endpoints were previously moved into the
      // public list purely to "avoid Clerk HTML redirects" (see
      // /api/health/azure-connectivity, /api/health/postgres-disruption,
      // /api/admin/parallel-run-invariants). Making a route public to fix an
      // error *format* trades away its auth gate; returning a correct 401
      // removes that pressure. Page routes still redirect, which is right —
      // a human hitting a page should land on sign-in.
      if (
        shouldAnswerUnauthenticatedApiWithJson(request.nextUrl.pathname, userId)
      ) {
        return NextResponse.json(
          {
            error: "unauthenticated",
            detail:
              "This endpoint requires a signed-in session. The session is missing or expired.",
          },
          { status: 401, headers: { "cache-control": "no-store" } },
        );
      }
      await auth.protect();
    }

    let response: NextResponse | null = null;
    function getResponse() {
      if (!response) response = NextResponse.next();
      return response;
    }

    if (isPublicRoute(request) && !userId) {
      getResponse().cookies.delete(ACTIVE_CLIENT_COOKIE);
    }

    if (
      isPublicRoute(request) &&
      isAuthenticated &&
      !isExternalOnlyRole(role)
    ) {
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
      });
      if (explicitlyPinnedClient) {
        getResponse().cookies.set(
          ACTIVE_CLIENT_COOKIE,
          explicitlyPinnedClient,
          {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
          },
        );
      }
    }

    // Tag mobile UA requests — consumed by server components via x-is-mobile header
    const ua = request.headers.get("user-agent") ?? "";
    if (MOBILE_UA.test(ua)) {
      getResponse().headers.set("x-is-mobile", "1");
    }

    if (isProductionReadinessNoStoreRequest(request)) {
      withProductionReadinessNoStoreHeaders(request, getResponse());
    }

    if (response) return response;
  },
);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (shouldBypassClerkForAxe(request)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-abarva-accessibility-axe", "1");

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.delete(ACTIVE_CLIENT_COOKIE);
    return response;
  }

  return clerkProtectedProxy(request, event);
}

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    "/training/:path*",
  ],
};
