// SHELL9 · Route Registry.
//
// Pure deterministic read model that defines all canonical routes in the
// AbarVa application. This module replaces the manually-maintained
// route lists scattered across QA files with a single source of truth.
//
// Every route is described with:
//   - path pattern (Next.js App Router convention)
//   - shell kind (tenant / admin / marketing)
//   - active status
//   - owning surface
//   - primary agent
//
// This module is the authoritative registry for route smoke tests,
// blueprint compliance checks, and navigation verification. All
// route-testing modules should import from here rather than hardcode
// their own lists.
//
// No DB writes, no migrations, no live retrieval, no model invocation,
// no fs reads, no Date.now, no random IDs.

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

/**
 * Shell kind that wraps the route.
 *
 * - tenant  → TenantShell / ProgramCanonShell (per-tenant product surfaces)
 * - admin   → AdminShell / AdminCanonShell (platform admin surfaces)
 * - source  → AppShell + SentinelAgentColumn (commercial sourcing surfaces)
 * - public  → No shell (marketing / unauthenticated)
 */
export type RouteShellKind = 'tenant' | 'admin' | 'source' | 'public';

/** Owning surface for navigation and agent assignment. */
export type RouteSurface =
  | 'programs'
  | 'intelligence'
  | 'tower'
  | 'admin'
  | 'source'
  | 'marketing'
  | 'auth';

/** Primary agent responsible for this route's data and guidance. */
export type RouteAgent = 'Nexus' | 'Sentinel' | 'Atlas' | 'Steward' | 'none';

/**
 * Canonical route registry entry.
 */
export interface RouteRegistryEntry {
  /**
   * Stable route id, e.g. "tenant-programs-index".
   * Unique across the registry.
   */
  routeId: string;
  /**
   * Next.js App Router path pattern, e.g.
   * "/tenant/[tenantSlug]/programs".
   */
  pattern: string;
  /**
   * Human-readable label for the route, used in smoke test reports.
   */
  label: string;
  /**
   * Shell kind wrapping this route.
   */
  shellKind: RouteShellKind;
  /**
   * The surface this route belongs to for navigation purposes.
   */
  surface: RouteSurface;
  /**
   * Primary agent whose data and guidance are surfaced on this route.
   */
  primaryAgent: RouteAgent;
  /**
   * When true, the route requires Clerk authentication to access.
   */
  requiresAuth: boolean;
  /**
   * When true, the route is live and expected to return 200 in smoke tests.
   */
  active: boolean;
  /**
   * Optional notes for the route, e.g. known limitations or
   * blueprint compliance status.
   */
  notes?: string;
}

// ---------------------------------------------------------------------
// Canonical registry
// ---------------------------------------------------------------------

const ROUTE_REGISTRY: ReadonlyArray<RouteRegistryEntry> = [
  // --- Tenant / Programs ---
  {
    routeId: 'tenant-programs-index',
    pattern: '/tenant/[tenantSlug]/programs',
    label: 'Tenant Programs Index',
    shellKind: 'tenant',
    surface: 'programs',
    primaryAgent: 'Nexus',
    requiresAuth: true,
    active: true,
  },
  {
    routeId: 'tenant-programs-detail',
    pattern: '/tenant/[tenantSlug]/programs/[programSlug]',
    label: 'Tenant Program Detail',
    shellKind: 'tenant',
    surface: 'programs',
    primaryAgent: 'Nexus',
    requiresAuth: true,
    active: true,
  },
  {
    routeId: 'tenant-programs-evidence',
    pattern: '/tenant/[tenantSlug]/programs/[programSlug]/evidence/[evidenceId]',
    label: 'Program Evidence Detail',
    shellKind: 'tenant',
    surface: 'programs',
    primaryAgent: 'Sentinel',
    requiresAuth: true,
    active: true,
  },

  // --- Tenant / Intelligence ---
  {
    routeId: 'tenant-intelligence',
    pattern: '/tenant/[tenantSlug]/intelligence',
    label: 'Tenant Intelligence',
    shellKind: 'tenant',
    surface: 'intelligence',
    primaryAgent: 'Sentinel',
    requiresAuth: true,
    active: true,
  },

  // --- Tenant / Tower ---
  {
    routeId: 'tenant-tower',
    pattern: '/tenant/[tenantSlug]/tower',
    label: 'Tenant Control Tower',
    shellKind: 'tenant',
    surface: 'tower',
    primaryAgent: 'Atlas',
    requiresAuth: true,
    active: true,
  },

  // --- Admin ---
  {
    routeId: 'admin-index',
    pattern: '/platform/admin',
    label: 'Admin Portal',
    shellKind: 'admin',
    surface: 'admin',
    primaryAgent: 'Steward',
    requiresAuth: true,
    active: true,
  },
  {
    routeId: 'admin-architecture',
    pattern: '/platform/admin/architecture',
    label: 'Admin Architecture',
    shellKind: 'admin',
    surface: 'admin',
    primaryAgent: 'Steward',
    requiresAuth: true,
    active: true,
  },
  {
    routeId: 'admin-production-readiness',
    pattern: '/platform/admin/production-readiness',
    label: 'Admin Production Readiness',
    shellKind: 'admin',
    surface: 'admin',
    primaryAgent: 'Steward',
    requiresAuth: true,
    active: true,
  },
  {
    routeId: 'admin-build-progress',
    pattern: '/platform/admin/build-progress',
    label: 'Admin Build Progress',
    shellKind: 'admin',
    surface: 'admin',
    primaryAgent: 'Steward',
    requiresAuth: true,
    active: true,
  },

  // --- Source ---
  {
    routeId: 'source-index',
    pattern: '/source',
    label: 'Source Events Index',
    shellKind: 'source',
    surface: 'source',
    primaryAgent: 'Sentinel',
    requiresAuth: true,
    active: true,
  },
  {
    routeId: 'source-events',
    pattern: '/source/events',
    label: 'Source Events List',
    shellKind: 'source',
    surface: 'source',
    primaryAgent: 'Sentinel',
    requiresAuth: true,
    active: true,
  },
  {
    routeId: 'source-event-detail',
    pattern: '/source/events/[eventId]',
    label: 'Source Event Detail',
    shellKind: 'source',
    surface: 'source',
    primaryAgent: 'Sentinel',
    requiresAuth: true,
    active: true,
  },

  // --- Marketing / Public ---
  {
    routeId: 'marketing-home',
    pattern: '/',
    label: 'Marketing Home',
    shellKind: 'public',
    surface: 'marketing',
    primaryAgent: 'none',
    requiresAuth: false,
    active: true,
  },
  {
    routeId: 'auth-sign-in',
    pattern: '/sign-in',
    label: 'Sign In',
    shellKind: 'public',
    surface: 'auth',
    primaryAgent: 'none',
    requiresAuth: false,
    active: true,
  },
  {
    routeId: 'auth-sign-up',
    pattern: '/sign-up',
    label: 'Sign Up',
    shellKind: 'public',
    surface: 'auth',
    primaryAgent: 'none',
    requiresAuth: false,
    active: true,
  },
  {
    routeId: 'demo-route',
    pattern: '/demo',
    label: 'Demo Preview',
    shellKind: 'public',
    surface: 'marketing',
    primaryAgent: 'none',
    requiresAuth: false,
    active: true,
    notes: 'Demo preview route — not gated by Clerk auth in demo mode.',
  },
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Return the full route registry. Pure.
 */
export function getRouteRegistry(): ReadonlyArray<RouteRegistryEntry> {
  return ROUTE_REGISTRY;
}

/**
 * Return only the active routes (routes expected to return 200 in smoke tests).
 * Pure.
 */
export function getActiveRoutes(): ReadonlyArray<RouteRegistryEntry> {
  return ROUTE_REGISTRY.filter((r) => r.active);
}

/**
 * Return routes filtered by shell kind. Pure.
 */
export function getRoutesByShellKind(
  shellKind: RouteShellKind,
): ReadonlyArray<RouteRegistryEntry> {
  return ROUTE_REGISTRY.filter((r) => r.shellKind === shellKind);
}

/**
 * Return routes filtered by surface. Pure.
 */
export function getRoutesBySurface(
  surface: RouteSurface,
): ReadonlyArray<RouteRegistryEntry> {
  return ROUTE_REGISTRY.filter((r) => r.surface === surface);
}

/**
 * Look up a route by its stable routeId. Returns undefined if not found. Pure.
 */
export function getRouteById(
  routeId: string,
): RouteRegistryEntry | undefined {
  return ROUTE_REGISTRY.find((r) => r.routeId === routeId);
}

/**
 * Return all routes that require authentication. Pure.
 */
export function getAuthenticatedRoutes(): ReadonlyArray<RouteRegistryEntry> {
  return ROUTE_REGISTRY.filter((r) => r.requiresAuth);
}

/**
 * Return all routes assigned to a specific agent. Pure.
 */
export function getRoutesByAgent(
  agent: RouteAgent,
): ReadonlyArray<RouteRegistryEntry> {
  return ROUTE_REGISTRY.filter((r) => r.primaryAgent === agent);
}

/**
 * Summarize the registry. Pure.
 */
export interface RouteRegistrySummary {
  total: number;
  activeTotal: number;
  byShellKind: Record<RouteShellKind, number>;
  bySurface: Record<RouteSurface, number>;
  byAgent: Record<RouteAgent, number>;
  authenticatedTotal: number;
  publicTotal: number;
}

export function summarizeRouteRegistry(): RouteRegistrySummary {
  const byShellKind: Record<RouteShellKind, number> = {
    tenant: 0,
    admin: 0,
    source: 0,
    public: 0,
  };
  const bySurface: Record<RouteSurface, number> = {
    programs: 0,
    intelligence: 0,
    tower: 0,
    admin: 0,
    source: 0,
    marketing: 0,
    auth: 0,
  };
  const byAgent: Record<RouteAgent, number> = {
    Nexus: 0,
    Sentinel: 0,
    Atlas: 0,
    Steward: 0,
    none: 0,
  };
  let activeTotal = 0;
  let authenticatedTotal = 0;
  let publicTotal = 0;

  for (const route of ROUTE_REGISTRY) {
    byShellKind[route.shellKind] += 1;
    bySurface[route.surface] += 1;
    byAgent[route.primaryAgent] += 1;
    if (route.active) activeTotal += 1;
    if (route.requiresAuth) {
      authenticatedTotal += 1;
    } else {
      publicTotal += 1;
    }
  }

  return {
    total: ROUTE_REGISTRY.length,
    activeTotal,
    byShellKind,
    bySurface,
    byAgent,
    authenticatedTotal,
    publicTotal,
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const ROUTE_SHELL_KINDS_IN_ORDER: ReadonlyArray<RouteShellKind> = [
  'tenant',
  'admin',
  'source',
  'public',
];

export const ROUTE_SURFACES_IN_ORDER: ReadonlyArray<RouteSurface> = [
  'programs',
  'intelligence',
  'tower',
  'admin',
  'source',
  'marketing',
  'auth',
];

export const ROUTE_AGENTS_IN_ORDER: ReadonlyArray<RouteAgent> = [
  'Nexus',
  'Sentinel',
  'Atlas',
  'Steward',
  'none',
];
