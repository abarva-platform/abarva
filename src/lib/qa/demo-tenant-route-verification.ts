// LIVE2 - Demo Tenant Route Verification
//
// Deterministic, file-pure read model for demo tenant route inventory.
// This module never performs any real HTTP request, never starts a server,
// never opens a browser, never imports any browser-automation library,
// never calls into the network, never reads the system clock, and never
// invokes a model provider.
//
// LIVE2 ships:
//   - Types for tenant route validation status, individual route records,
//     and the full demo tenant route manifest.
//   - A pure builder function that returns the canonical manifest for the
//     two primary demo tenants: apex-retail and meridian.
//
// This module is the companion to QA5 (route smoke inventory) and serves
// as the deterministic contract for demo tenant route coverage.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TenantRouteValidationStatus =
  | 'verified'
  | 'needs_review'
  | 'deferred'
  | 'not_run';

export type TenantRouteClass = 'working' | 'stub' | '404' | 'inconsistent';

export interface TenantRouteRecord {
  tenantSlug: string;
  route: string;
  surface: 'programs' | 'tower' | 'intelligence' | 'source' | 'admin' | 'home' | 'other';
  expectedComponent: string;
  expectedReadModel: string;
  expectedPrimaryAgent: string;
  validationStatus: TenantRouteValidationStatus;
  routeClass: TenantRouteClass;
  knownCaveat: string;
  fallbackRoute: string;
}

export interface DemoTenantRouteManifest {
  schemaVersion: 1;
  generatedAt: string;
  tenants: string[];
  routes: TenantRouteRecord[];
  totalRoutes: number;
  verifiedRoutes: number;
  deferredRoutes: number;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildDemoTenantRouteManifest(): DemoTenantRouteManifest {
  const canonicalTenantRoutes: TenantRouteRecord[] = [
    {
      tenantSlug: 'apex-retail',
      route: '/tenant/apex-retail',
      surface: 'home',
      expectedComponent: 'SeedTenantDashboard',
      expectedReadModel: 'TenantSeedPlan',
      expectedPrimaryAgent: 'Nexus',
      validationStatus: 'verified',
      routeClass: 'working',
      knownCaveat: 'Program portfolio is seeded for the Apex Retail demo',
      fallbackRoute: '/home',
    },
    {
      tenantSlug: 'meridian-health',
      route: '/tenant/meridian-health',
      surface: 'home',
      expectedComponent: 'SeedTenantDashboard',
      expectedReadModel: 'TenantSeedPlan',
      expectedPrimaryAgent: 'Nexus',
      validationStatus: 'verified',
      routeClass: 'working',
      knownCaveat: 'Program portfolio is seeded for the Meridian Health demo',
      fallbackRoute: '/home',
    },
    {
      tenantSlug: 'first-capital-financial',
      route: '/tenant/first-capital-financial',
      surface: 'home',
      expectedComponent: 'SeedTenantDashboard',
      expectedReadModel: 'TenantSeedPlan',
      expectedPrimaryAgent: 'Nexus',
      validationStatus: 'verified',
      routeClass: 'working',
      knownCaveat: 'Program portfolio is seeded under the arcturus client key',
      fallbackRoute: '/home',
    },
    {
      tenantSlug: 'northstar-clinical',
      route: '/tenant/northstar-clinical',
      surface: 'home',
      expectedComponent: 'SeedTenantDashboard',
      expectedReadModel: 'TenantSeedPlan',
      expectedPrimaryAgent: 'Nexus',
      validationStatus: 'verified',
      routeClass: 'stub',
      knownCaveat: 'Route is intentionally honest zero-program stub until Northstar programs are seeded',
      fallbackRoute: '/home',
    },
    {
      tenantSlug: 'skyharbor-air',
      route: '/tenant/skyharbor-air',
      surface: 'home',
      expectedComponent: 'SeedTenantDashboard',
      expectedReadModel: 'TenantSeedPlan',
      expectedPrimaryAgent: 'Nexus',
      validationStatus: 'verified',
      routeClass: 'stub',
      knownCaveat: 'Route is intentionally honest zero-program stub until SkyHarbor programs are seeded',
      fallbackRoute: '/home',
    },
  ];

  const routes: TenantRouteRecord[] = [
    ...canonicalTenantRoutes,
    // -----------------------------------------------------------------------
    // apex-retail routes
    // -----------------------------------------------------------------------
    {
      tenantSlug: 'apex-retail',
      route: '/tenant/apex-retail/programs',
      surface: 'programs',
      expectedComponent: 'TenantProgramsPage',
      expectedReadModel: 'ProgramViewRecord',
      expectedPrimaryAgent: 'Nexus',
      validationStatus: 'verified',
      routeClass: 'working',
      knownCaveat: 'Apex seed data only; live DB required for real program state',
      fallbackRoute: '/programs',
    },
    {
      tenantSlug: 'apex-retail',
      route: '/tenant/apex-retail/programs/contact-center-ai',
      surface: 'programs',
      expectedComponent: 'TenantProgramDetailPage',
      expectedReadModel: 'ProgramDetailViewRecord',
      expectedPrimaryAgent: 'Nexus',
      validationStatus: 'verified',
      routeClass: 'working',
      knownCaveat: 'Slug may differ from seeded programId; verify slug mapping',
      fallbackRoute: '/programs/[programId]',
    },
    {
      tenantSlug: 'apex-retail',
      route: '/tenant/apex-retail/programs/cdp',
      surface: 'programs',
      expectedComponent: 'TenantProgramDetailPage',
      expectedReadModel: 'ProgramDetailViewRecord',
      expectedPrimaryAgent: 'Nexus',
      validationStatus: 'verified',
      routeClass: 'working',
      knownCaveat: 'CDP program seeded for Apex Retail demo',
      fallbackRoute: '/programs/[programId]',
    },
    {
      tenantSlug: 'apex-retail',
      route: '/tenant/apex-retail/tower',
      surface: 'tower',
      expectedComponent: 'TenantTowerPage',
      expectedReadModel: 'TowerSurfaceRecord',
      expectedPrimaryAgent: 'Atlas',
      validationStatus: 'verified',
      routeClass: 'working',
      knownCaveat: 'Tower seed data; real cost/adoption requires integrations',
      fallbackRoute: '/tower',
    },
    {
      tenantSlug: 'apex-retail',
      route: '/tenant/apex-retail/tower/signals',
      surface: 'tower',
      expectedComponent: 'TenantTowerSurfacePage',
      expectedReadModel: 'TowerSignalRecord',
      expectedPrimaryAgent: 'Atlas',
      validationStatus: 'needs_review',
      routeClass: 'working',
      knownCaveat: 'Surface param routing may depend on PROD3/tower surface implementation',
      fallbackRoute: '/tower',
    },
    {
      tenantSlug: 'apex-retail',
      route: '/tenant/apex-retail/intelligence',
      surface: 'intelligence',
      expectedComponent: 'TenantIntelligencePage',
      expectedReadModel: 'IntelligenceLibraryRecord',
      expectedPrimaryAgent: 'Sentinel',
      validationStatus: 'verified',
      routeClass: 'working',
      knownCaveat: 'Pattern library is deterministic seed',
      fallbackRoute: '/intelligence',
    },
    {
      tenantSlug: 'apex-retail',
      route: '/tenant/apex-retail/intelligence/patterns/contact-center-ai',
      surface: 'intelligence',
      expectedComponent: 'TenantIntelligencePatternPage',
      expectedReadModel: 'PatternDetailRecord',
      expectedPrimaryAgent: 'Sentinel',
      validationStatus: 'verified',
      routeClass: 'working',
      knownCaveat: 'Pattern key must match seeded slug',
      fallbackRoute: '/intelligence/patterns',
    },

    // -----------------------------------------------------------------------
    // meridian routes
    // -----------------------------------------------------------------------
    {
      tenantSlug: 'meridian',
      route: '/tenant/meridian/programs',
      surface: 'programs',
      expectedComponent: 'TenantProgramsPage',
      expectedReadModel: 'ProgramViewRecord',
      expectedPrimaryAgent: 'Nexus',
      validationStatus: 'needs_review',
      routeClass: 'working',
      knownCaveat: 'Meridian stays on Intelligence demo; program list may be minimal',
      fallbackRoute: '/programs',
    },
    {
      tenantSlug: 'meridian',
      route: '/tenant/meridian/intelligence',
      surface: 'intelligence',
      expectedComponent: 'TenantIntelligencePage',
      expectedReadModel: 'IntelligenceLibraryRecord',
      expectedPrimaryAgent: 'Sentinel',
      validationStatus: 'verified',
      routeClass: 'working',
      knownCaveat: 'Meridian intelligence seed active',
      fallbackRoute: '/intelligence',
    },
    {
      tenantSlug: 'meridian',
      route: '/tenant/meridian/tower',
      surface: 'tower',
      expectedComponent: 'TenantTowerPage',
      expectedReadModel: 'TowerSurfaceRecord',
      expectedPrimaryAgent: 'Atlas',
      validationStatus: 'needs_review',
      routeClass: 'working',
      knownCaveat: 'Tower may not be seeded for Meridian',
      fallbackRoute: '/tower',
    },
  ];

  const totalRoutes = routes.length;
  const verifiedRoutes = routes.filter((r) => r.validationStatus === 'verified').length;
  const deferredRoutes = routes.filter((r) => r.validationStatus === 'deferred').length;

  return {
    schemaVersion: 1,
    generatedAt: '2026-04-26',
    tenants: [
      'apex-retail',
      'meridian-health',
      'first-capital-financial',
      'northstar-clinical',
      'skyharbor-air',
    ],
    routes,
    totalRoutes,
    verifiedRoutes,
    deferredRoutes,
  };
}
