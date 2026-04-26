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

export interface TenantRouteRecord {
  tenantSlug: string;
  route: string;
  surface: 'programs' | 'tower' | 'intelligence' | 'source' | 'admin' | 'home' | 'other';
  expectedComponent: string;
  expectedReadModel: string;
  expectedPrimaryAgent: string;
  validationStatus: TenantRouteValidationStatus;
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
  const routes: TenantRouteRecord[] = [
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
    tenants: ['apex-retail', 'meridian'],
    routes,
    totalRoutes,
    verifiedRoutes,
    deferredRoutes,
  };
}
