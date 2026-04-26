// DEMODATA1 — Demo Dataset Registry and Tenant Richness Model
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DemoDataTier =
  | 'rich'
  | 'partial'
  | 'thin'
  | 'deterministic_only'
  | 'not_seeded'
  | 'shell_only';

export type DemoSurfaceKey =
  | 'programs'
  | 'source'
  | 'intelligence'
  | 'control_tower'
  | 'admin';

export interface DemoSurfaceDataset {
  surface: DemoSurfaceKey;
  tier: DemoDataTier;
  description: string;
  seedFile: string | null;
  caveat: string;
  routeHint: string | null;
  deterministicSeed: true;
}

export interface DemoTenantDataset {
  tenantSlug: string;
  tenantName: string;
  overallTier: DemoDataTier;
  surfaces: DemoSurfaceDataset[];
  sourceProgramLinkage: boolean;
  knownLinkageFile: string | null;
  dataNote: string;
  deterministicSeed: true;
}

export interface DemoCoverageSummary {
  totalTenants: number;
  richTenants: number;
  thinTenants: number;
  shellOnlyTenants: number;
  surfacesWithLinkage: number;
  caveat: string;
}

// ---------------------------------------------------------------------------
// Dataset definitions
// ---------------------------------------------------------------------------

const APEX_RETAIL_DATASET: DemoTenantDataset = {
  tenantSlug: 'apex-retail',
  tenantName: 'Apex Retail',
  overallTier: 'rich',
  surfaces: [
    {
      surface: 'programs',
      tier: 'rich',
      description:
        '6 programmes, 14 deliverables for CDP Activation. Phase/gate/workshop seeded. Wave 18-19 storyline.',
      seedFile: 'src/lib/programs/program-flagship-view.ts',
      caveat: 'Deterministic seed. No live programme state.',
      routeHint: '/tenant/apex-retail/programs',
      deterministicSeed: true,
    },
    {
      surface: 'source',
      tier: 'partial',
      description:
        'AMS outsourcing scenario. 4 fictional vendors. Commercial risks, signals, missions. Linked to APX-CDP-2026.',
      seedFile: 'src/lib/source/source-commercial-demo-scenario.ts',
      caveat: 'Deterministic seed. No live vendor data. Fictional vendor names.',
      routeHint: '/source/events/apex-retail-ams-outsourcing-2026',
      deterministicSeed: true,
    },
    {
      surface: 'intelligence',
      tier: 'deterministic_only',
      description:
        'Pattern detection. 10 categories. Same output regardless of client.',
      seedFile: 'src/lib/source/intelligence-patterns.ts',
      caveat: 'Deterministic. Not client-specific.',
      routeHint: '/tenant/apex-retail/intelligence',
      deterministicSeed: true,
    },
    {
      surface: 'control_tower',
      tier: 'deterministic_only',
      description:
        'Signal intelligence. 10 signal types. Same output regardless of client.',
      seedFile: 'src/lib/source/control-tower-signals.ts',
      caveat: 'Deterministic. No live procurement monitoring.',
      routeHint: '/tenant/apex-retail/tower',
      deterministicSeed: true,
    },
    {
      surface: 'admin',
      tier: 'rich',
      description:
        'Architecture canvas (9 planes), production readiness decision flow, build progress.',
      seedFile: 'docs/build/production-readiness.json',
      caveat: 'Manifest-backed. Not live.',
      routeHint: '/platform/admin',
      deterministicSeed: true,
    },
  ],
  sourceProgramLinkage: true,
  knownLinkageFile: 'src/lib/source/source-program-link.ts',
  dataNote:
    'Apex Retail is the primary demo tenant. Full storyline: Source AMS → Program CDP Activation.',
  deterministicSeed: true,
};

const MERIDIAN_DATASET: DemoTenantDataset = {
  tenantSlug: 'meridian',
  tenantName: 'Meridian',
  overallTier: 'thin',
  surfaces: [
    {
      surface: 'programs',
      tier: 'not_seeded',
      description: 'No programme data seeded.',
      seedFile: null,
      caveat: 'Not seeded.',
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: 'source',
      tier: 'not_seeded',
      description: 'No source event data seeded.',
      seedFile: null,
      caveat: 'Not seeded.',
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: 'intelligence',
      tier: 'thin',
      description: 'Intelligence demo only. Limited deterministic data.',
      seedFile: null,
      caveat: 'Thin demo.',
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: 'control_tower',
      tier: 'not_seeded',
      description: 'Not seeded for Meridian.',
      seedFile: null,
      caveat: 'Not seeded.',
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: 'admin',
      tier: 'not_seeded',
      description: 'Not applicable for Meridian client.',
      seedFile: null,
      caveat: 'Not applicable.',
      routeHint: null,
      deterministicSeed: true,
    },
  ],
  sourceProgramLinkage: false,
  knownLinkageFile: null,
  dataNote: 'Meridian is a thin demo tenant. Intelligence demo only.',
  deterministicSeed: true,
};

const ARCTURUS_DATASET: DemoTenantDataset = {
  tenantSlug: 'arcturus',
  tenantName: 'Arcturus',
  overallTier: 'shell_only',
  surfaces: [
    {
      surface: 'programs',
      tier: 'shell_only',
      description: 'No data seeded. Shell/Clerk account only.',
      seedFile: null,
      caveat: 'Shell only.',
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: 'source',
      tier: 'shell_only',
      description: 'No data seeded. Shell/Clerk account only.',
      seedFile: null,
      caveat: 'Shell only.',
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: 'intelligence',
      tier: 'shell_only',
      description: 'No data seeded. Shell/Clerk account only.',
      seedFile: null,
      caveat: 'Shell only.',
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: 'control_tower',
      tier: 'shell_only',
      description: 'No data seeded. Shell/Clerk account only.',
      seedFile: null,
      caveat: 'Shell only.',
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: 'admin',
      tier: 'shell_only',
      description: 'No data seeded. Shell/Clerk account only.',
      seedFile: null,
      caveat: 'Shell only.',
      routeHint: null,
      deterministicSeed: true,
    },
  ],
  sourceProgramLinkage: false,
  knownLinkageFile: null,
  dataNote: 'Arcturus is a shell-only tenant. Clerk test account only.',
  deterministicSeed: true,
};

const ALL_DATASETS: DemoTenantDataset[] = [
  APEX_RETAIL_DATASET,
  MERIDIAN_DATASET,
  ARCTURUS_DATASET,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns all demo tenant datasets. */
export function listDemoDatasets(): DemoTenantDataset[] {
  return ALL_DATASETS;
}

/** Returns the dataset for a given tenant slug, or null if not found. */
export function getDemoDatasetForTenant(
  tenantSlug: string,
): DemoTenantDataset | null {
  return ALL_DATASETS.find((d) => d.tenantSlug === tenantSlug) ?? null;
}

/** Returns the surface dataset for a given tenant + surface, or null if not found. */
export function getSurfaceDataAvailability(
  tenantSlug: string,
  surface: DemoSurfaceKey,
): DemoSurfaceDataset | null {
  const tenant = getDemoDatasetForTenant(tenantSlug);
  if (!tenant) return null;
  return tenant.surfaces.find((s) => s.surface === surface) ?? null;
}

/**
 * Returns the recommended demo route for a given tenant + surface.
 * Falls back to '/tenant/apex-retail/programs' with a note appended when
 * no routeHint is available.
 */
export function getDemoRouteRecommendation(
  tenantSlug: string,
  surface: DemoSurfaceKey,
): string {
  const surfaceData = getSurfaceDataAvailability(tenantSlug, surface);
  if (surfaceData?.routeHint) {
    return surfaceData.routeHint;
  }
  return '/tenant/apex-retail/programs (safe fallback — no route available for this tenant/surface)';
}

/** Returns an aggregate coverage summary across all demo tenants. */
export function summarizeDemoDataCoverage(): DemoCoverageSummary {
  const tenants = listDemoDatasets();
  const richTenants = tenants.filter((t) => t.overallTier === 'rich').length;
  const thinTenants = tenants.filter((t) => t.overallTier === 'thin').length;
  const shellOnlyTenants = tenants.filter(
    (t) => t.overallTier === 'shell_only',
  ).length;
  const surfacesWithLinkage = tenants.filter(
    (t) => t.sourceProgramLinkage,
  ).length;

  return {
    totalTenants: tenants.length,
    richTenants,
    thinTenants,
    shellOnlyTenants,
    surfacesWithLinkage,
    caveat: 'All data is deterministic seed.',
  };
}
