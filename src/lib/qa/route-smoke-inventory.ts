// QA5 - Route Smoke Inventory
//
// Deterministic, file-pure catalog of canonical routes that a future
// route-smoke harness must cover. This module never performs any
// real HTTP request, never starts a server, never opens a browser,
// never imports any browser-automation library, never calls into the
// network, never reads the system clock, and never invokes a model
// provider.
//
// QA5 is the read-only inventory companion to PROD2 (production
// readiness validator). The validator owns manifest discipline; this
// module owns the canonical list of route smoke targets, their owner
// surface, primary agent, expected guard, expected read-model
// contract, smoke priority, current implementation status, the test
// strategy that would apply once execution is wired, and the known
// gaps that block automation today.
//
// Concretely, QA5 ships:
//
//   - A canonical, ordered tuple of smoke priority levels.
//   - A canonical, ordered tuple of route smoke targets covering the
//     critical founder / operator / tenant journeys (home, platform
//     admin, programs, tower, intelligence, source).
//   - Pure helpers to list, summarize, filter by priority, and
//     filter by owner surface.
//
// QA5 does NOT execute any smoke run. Browser automation, real HTTP
// fixture fetches, and a persona crawler remain explicitly deferred.
// The slice doc at docs/build/slices/QA5_ROUTE_SMOKE_HARNESS.md and
// the production-readiness manifest's validation_qa.testingGates
// route_smoke entry both reflect that execution status is unchanged.

// ---------------------------------------------------------------------
// Canonical priority tuple (order is contract).
// ---------------------------------------------------------------------

export const ROUTE_SMOKE_PRIORITY = ['critical', 'high', 'medium', 'low'] as const;
export type RouteSmokePriority = typeof ROUTE_SMOKE_PRIORITY[number];

// ---------------------------------------------------------------------
// Owner surface, primary agent, guard, status, and strategy enums.
// ---------------------------------------------------------------------

export type RouteSmokeOwnerSurface =
  | 'home'
  | 'admin'
  | 'programs'
  | 'tower'
  | 'intelligence'
  | 'source';

export type RouteSmokePrimaryAgent =
  | 'nexus'
  | 'sentinel'
  | 'atlas'
  | 'steward'
  | 'platform';

export type RouteSmokeImplementationStatus =
  | 'exists'
  | 'partial'
  | 'missing'
  | 'legacy';

export type RouteSmokeTestStrategy =
  | 'static_snapshot'
  | 'read_model_unit'
  | 'persona_walk'
  | 'fixture_fetch_when_implemented'
  | 'manual_only';

export type RouteSmokeExpectedGuard =
  | 'public'
  | 'authenticated'
  | 'tenant_scoped'
  | 'platform_admin';

// ---------------------------------------------------------------------
// Public types.
// ---------------------------------------------------------------------

export interface RouteSmokeTarget {
  routePattern: string;
  ownerSurface: RouteSmokeOwnerSurface;
  primaryAgent: RouteSmokePrimaryAgent;
  expectedGuard: RouteSmokeExpectedGuard;
  expectedReadModel: string;
  smokePriority: RouteSmokePriority;
  currentlyImplemented: RouteSmokeImplementationStatus;
  testStrategy: RouteSmokeTestStrategy;
  knownGaps: readonly string[];
  createdFrom: 'deterministic_route_smoke_inventory';
}

export interface RouteSmokeSummary {
  totalTargets: number;
  byPriority: Record<RouteSmokePriority, number>;
  byOwnerSurface: Record<RouteSmokeOwnerSurface, number>;
  byPrimaryAgent: Record<RouteSmokePrimaryAgent, number>;
  byImplementationStatus: Record<RouteSmokeImplementationStatus, number>;
  highPriorityCount: number;
}

// ---------------------------------------------------------------------
// Canonical seed tuple (order is contract).
// ---------------------------------------------------------------------

const ROUTE_SMOKE_TARGETS: readonly RouteSmokeTarget[] = Object.freeze([
  {
    routePattern: '/home',
    ownerSurface: 'home',
    primaryAgent: 'platform',
    expectedGuard: 'public',
    expectedReadModel: 'src/components/home/AgenticHomeEntry.tsx',
    smokePriority: 'critical',
    currentlyImplemented: 'exists',
    testStrategy: 'static_snapshot',
    knownGaps: Object.freeze([]),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
  {
    routePattern: '/platform/admin',
    ownerSurface: 'admin',
    primaryAgent: 'steward',
    expectedGuard: 'platform_admin',
    expectedReadModel: 'src/components/admin/StewardSetupControlCenter.tsx',
    smokePriority: 'critical',
    currentlyImplemented: 'exists',
    testStrategy: 'static_snapshot',
    knownGaps: Object.freeze([]),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
  {
    routePattern: '/platform/admin/build-progress',
    ownerSurface: 'admin',
    primaryAgent: 'steward',
    expectedGuard: 'platform_admin',
    expectedReadModel: 'src/lib/admin/build-progress',
    smokePriority: 'high',
    currentlyImplemented: 'exists',
    testStrategy: 'read_model_unit',
    knownGaps: Object.freeze([]),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
  {
    routePattern: '/platform/admin/production-readiness',
    ownerSurface: 'admin',
    primaryAgent: 'steward',
    expectedGuard: 'platform_admin',
    expectedReadModel: 'src/lib/admin/production-readiness.ts',
    smokePriority: 'critical',
    currentlyImplemented: 'exists',
    testStrategy: 'read_model_unit',
    knownGaps: Object.freeze([]),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
  {
    routePattern: '/tenant/[tenantSlug]/programs',
    ownerSurface: 'programs',
    primaryAgent: 'nexus',
    expectedGuard: 'tenant_scoped',
    expectedReadModel: 'src/lib/programs/programs-canonical-view.ts',
    smokePriority: 'critical',
    currentlyImplemented: 'exists',
    testStrategy: 'read_model_unit',
    knownGaps: Object.freeze([]),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
  {
    routePattern: '/tenant/[tenantSlug]/programs/[programSlug]',
    ownerSurface: 'programs',
    primaryAgent: 'nexus',
    expectedGuard: 'tenant_scoped',
    expectedReadModel: 'src/components/programs/ProgramCanonicalDetail.tsx',
    smokePriority: 'critical',
    currentlyImplemented: 'exists',
    testStrategy: 'read_model_unit',
    knownGaps: Object.freeze([]),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
  {
    routePattern: '/tenant/[tenantSlug]/tower',
    ownerSurface: 'tower',
    primaryAgent: 'atlas',
    expectedGuard: 'tenant_scoped',
    expectedReadModel: 'src/components/tower/ProgramPressureCards.tsx',
    smokePriority: 'critical',
    currentlyImplemented: 'exists',
    testStrategy: 'read_model_unit',
    knownGaps: Object.freeze([]),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
  {
    routePattern: '/tenant/[tenantSlug]/intelligence',
    ownerSurface: 'intelligence',
    primaryAgent: 'sentinel',
    expectedGuard: 'tenant_scoped',
    expectedReadModel: 'src/components/intelligence/SentinelActivePatterns.tsx',
    smokePriority: 'critical',
    currentlyImplemented: 'exists',
    testStrategy: 'read_model_unit',
    knownGaps: Object.freeze([]),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
  {
    routePattern: '/tenant/[tenantSlug]/intelligence/patterns/[patternKey]',
    ownerSurface: 'intelligence',
    primaryAgent: 'sentinel',
    expectedGuard: 'tenant_scoped',
    expectedReadModel: 'src/lib/intelligence/sentinel-pattern-detections.ts',
    smokePriority: 'high',
    currentlyImplemented: 'exists',
    testStrategy: 'read_model_unit',
    knownGaps: Object.freeze([]),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
  {
    routePattern: '/source',
    ownerSurface: 'source',
    primaryAgent: 'platform',
    expectedGuard: 'authenticated',
    expectedReadModel: 'src/lib/source/',
    smokePriority: 'medium',
    currentlyImplemented: 'partial',
    testStrategy: 'manual_only',
    knownGaps: Object.freeze(['smoke harness not yet automated']),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
  {
    routePattern: '/source/events',
    ownerSurface: 'source',
    primaryAgent: 'platform',
    expectedGuard: 'authenticated',
    expectedReadModel: 'src/lib/source/events',
    smokePriority: 'medium',
    currentlyImplemented: 'partial',
    testStrategy: 'manual_only',
    knownGaps: Object.freeze([]),
    createdFrom: 'deterministic_route_smoke_inventory',
  },
] as const);

// ---------------------------------------------------------------------
// Public helpers.
// ---------------------------------------------------------------------

export function listRouteSmokeTargets(): readonly RouteSmokeTarget[] {
  return ROUTE_SMOKE_TARGETS;
}

const HIGH_OR_CRITICAL: ReadonlySet<RouteSmokePriority> = new Set<RouteSmokePriority>([
  'critical',
  'high',
]);

export function getHighPrioritySmokeTargets(
  targets: readonly RouteSmokeTarget[] = ROUTE_SMOKE_TARGETS,
): readonly RouteSmokeTarget[] {
  return targets.filter((target) => HIGH_OR_CRITICAL.has(target.smokePriority));
}

export function getRouteSmokeByOwnerSurface(
  targets: readonly RouteSmokeTarget[],
  surface: RouteSmokeOwnerSurface,
): readonly RouteSmokeTarget[] {
  return targets.filter((target) => target.ownerSurface === surface);
}

function emptyPriorityCounts(): Record<RouteSmokePriority, number> {
  return {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
}

function emptyOwnerSurfaceCounts(): Record<RouteSmokeOwnerSurface, number> {
  return {
    home: 0,
    admin: 0,
    programs: 0,
    tower: 0,
    intelligence: 0,
    source: 0,
  };
}

function emptyPrimaryAgentCounts(): Record<RouteSmokePrimaryAgent, number> {
  return {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
    platform: 0,
  };
}

function emptyImplementationStatusCounts(): Record<RouteSmokeImplementationStatus, number> {
  return {
    exists: 0,
    partial: 0,
    missing: 0,
    legacy: 0,
  };
}

export function summarizeRouteSmokeTargets(
  targets: readonly RouteSmokeTarget[] = ROUTE_SMOKE_TARGETS,
): RouteSmokeSummary {
  const byPriority = emptyPriorityCounts();
  const byOwnerSurface = emptyOwnerSurfaceCounts();
  const byPrimaryAgent = emptyPrimaryAgentCounts();
  const byImplementationStatus = emptyImplementationStatusCounts();
  let highPriorityCount = 0;
  for (const target of targets) {
    byPriority[target.smokePriority] += 1;
    byOwnerSurface[target.ownerSurface] += 1;
    byPrimaryAgent[target.primaryAgent] += 1;
    byImplementationStatus[target.currentlyImplemented] += 1;
    if (HIGH_OR_CRITICAL.has(target.smokePriority)) {
      highPriorityCount += 1;
    }
  }
  return {
    totalTargets: targets.length,
    byPriority,
    byOwnerSurface,
    byPrimaryAgent,
    byImplementationStatus,
    highPriorityCount,
  };
}
