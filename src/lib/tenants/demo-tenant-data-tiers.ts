// SHELL3 — Tenant-Aware Navigation + Demo Data Tier Badges
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DemoTenantRichness = 'rich' | 'thin' | 'shell_only';
export type DemoSurface = 'programs' | 'source' | 'intelligence' | 'control_tower' | 'admin';
export type DemoSurfaceAvailability =
  | 'full'
  | 'partial'
  | 'thin'
  | 'deterministic_only'
  | 'not_seeded'
  | 'unavailable';

export interface DemoSurfaceDataState {
  surface: DemoSurface;
  availability: DemoSurfaceAvailability;
  caveat: string;
  routeHint: string | null;
}

export interface DemoTenantDataTier {
  tenantSlug: string;
  tenantName: string;
  richness: DemoTenantRichness;
  surfaces: DemoSurfaceDataState[];
  sourceProgramLinkage: boolean;
  deterministicSeed: true;
  dataNote: string;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const DEMO_TENANT_DATA_TIERS: DemoTenantDataTier[] = [
  {
    tenantSlug: 'apex-retail',
    tenantName: 'Apex Retail',
    richness: 'rich',
    surfaces: [
      {
        surface: 'programs',
        availability: 'full',
        caveat:
          'Deterministic seed. 6 programs, 14 deliverables for CDP Activation. Wave 19 storyline.',
        routeHint: '/tenant/apex-retail/programs',
      },
      {
        surface: 'source',
        availability: 'partial',
        caveat:
          'Deterministic AMS outsourcing scenario. Vendor names are fictional. No live vendor response.',
        routeHint: '/source/events/apex-retail-ams-outsourcing-2026',
      },
      {
        surface: 'intelligence',
        availability: 'deterministic_only',
        caveat: 'Deterministic pattern detection. Not client-specific live intelligence.',
        routeHint: '/tenant/apex-retail/intelligence',
      },
      {
        surface: 'control_tower',
        availability: 'deterministic_only',
        caveat: 'Deterministic signals. No live procurement monitoring.',
        routeHint: '/tenant/apex-retail/tower',
      },
      {
        surface: 'admin',
        availability: 'full',
        caveat: 'Architecture and production readiness are manifest-backed.',
        routeHint: '/platform/admin',
      },
    ],
    sourceProgramLinkage: true,
    deterministicSeed: true,
    dataNote:
      'Apex Retail is the primary rich demo tenant. Full Programs + Source + Intelligence + Tower storyline. Wave 19 CDP Activation narrative.',
  },
  {
    tenantSlug: 'meridian',
    tenantName: 'Meridian',
    richness: 'thin',
    surfaces: [
      {
        surface: 'programs',
        availability: 'not_seeded',
        caveat: 'No program data seeded for Meridian.',
        routeHint: null,
      },
      {
        surface: 'source',
        availability: 'not_seeded',
        caveat: 'No source event data seeded for Meridian.',
        routeHint: null,
      },
      {
        surface: 'intelligence',
        availability: 'thin',
        caveat: 'Meridian is on Intelligence demo only. Thin deterministic data.',
        routeHint: null,
      },
      {
        surface: 'control_tower',
        availability: 'unavailable',
        caveat: 'Not seeded for Meridian.',
        routeHint: null,
      },
      {
        surface: 'admin',
        availability: 'unavailable',
        caveat: 'Not applicable for Meridian client view.',
        routeHint: null,
      },
    ],
    sourceProgramLinkage: false,
    deterministicSeed: true,
    dataNote: 'Meridian is a thin demo tenant. Intelligence demo only.',
  },
];

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export function listDemoTenantDataTiers(): DemoTenantDataTier[] {
  return DEMO_TENANT_DATA_TIERS;
}

export function getDemoTenantDataTier(tenantSlug: string): DemoTenantDataTier | null {
  return DEMO_TENANT_DATA_TIERS.find((t) => t.tenantSlug === tenantSlug) ?? null;
}

export function getSurfaceAvailability(
  tenantSlug: string,
  surface: DemoSurface
): DemoSurfaceDataState | null {
  const tenant = getDemoTenantDataTier(tenantSlug);
  if (!tenant) return null;
  return tenant.surfaces.find((s) => s.surface === surface) ?? null;
}

export function getTenantRouteFallback(tenantSlug: string, surface: DemoSurface): string {
  const state = getSurfaceAvailability(tenantSlug, surface);
  if (state?.routeHint) return state.routeHint;
  return '/tenant/apex-retail/programs';
}
