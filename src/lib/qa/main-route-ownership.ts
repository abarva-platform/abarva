// SHELL2 · Main Route Ownership Map + Legacy Shell Retirement Plan
//
// Pure TypeScript data model — no runtime, no DB, no network calls.
// Encodes the shell compliance status, data richness, and remediation
// action for every primary route in the (maestro) layout group.
//
// Findings from codebase inspection (2026-04-26):
//   - src/app/(maestro)/layout.tsx wraps all product routes in AppChrome
//     → AppChrome → MaestroChrome → AbarvaNav (canonical AbarVa shell)
//     The shared layout is canonical; no direct TopBar/PrimaryNav import
//     appears in any (maestro) route file.
//   - TopBar.tsx and PrimaryNav.tsx exist in src/components/chrome/ but
//     are NOT imported by any current (maestro) route page file.
//   - src/app/page.tsx (marketing root) imports AbarvaNav directly and is
//     outside the (maestro) layout group — no TopBar/PrimaryNav usage.
//   - All admin routes use AdminCanonShell (AbarVa-canon wrapper).
//   - Source routes use SourceCanonShell (AbarVa-canon wrapper).
//   - Programs routes use ProgramCanonShell (AbarVa-canon wrapper).
//
// Legacy shell components (TopBar, PrimaryNav) are defined but unused
// by current route pages. They are retirement candidates.

export type RouteShellComplianceStatus =
  | 'canonical'   // uses approved AbarVa shell
  | 'legacy'      // uses old TopBar/PrimaryNav
  | 'mixed'       // uses both
  | 'unknown'     // could not determine
  | 'deferred';   // planned but not yet migrated

export type RouteDataRichness =
  | 'rich'
  | 'partial'
  | 'thin'
  | 'shell_only'
  | 'not_seeded';

export interface RouteOwnershipRecord {
  routePattern: string;
  routeFile: string | null;
  pageComponent: string | null;
  shellCompliance: RouteShellComplianceStatus;
  tenantDataRichness: RouteDataRichness;
  legacyShellFinding: string | null;
  remediation: string;
  riskLevel: 'low' | 'medium' | 'high';
  deterministicSeed: true;
}

export function buildMainRouteOwnershipMap(): RouteOwnershipRecord[] {
  return [
    {
      routePattern: '/',
      routeFile: 'src/app/page.tsx',
      pageComponent: 'MarketingRootPage',
      // Imports AbarvaNav directly (canonical nav); no TopBar/PrimaryNav usage.
      shellCompliance: 'canonical',
      tenantDataRichness: 'not_seeded',
      legacyShellFinding: null,
      remediation: 'No action needed',
      riskLevel: 'low',
      deterministicSeed: true,
    },
    {
      routePattern: '/home',
      routeFile: 'src/app/(maestro)/home/page.tsx',
      pageComponent: 'HomePage',
      // Inside (maestro) layout → AppChrome → MaestroChrome → AbarvaNav.
      // Page file has no direct TopBar/PrimaryNav import.
      shellCompliance: 'canonical',
      tenantDataRichness: 'partial',
      legacyShellFinding: null,
      remediation: 'No action needed',
      riskLevel: 'low',
      deterministicSeed: true,
    },
    {
      routePattern: '/tenant/[tenantSlug]/programs',
      routeFile: 'src/app/(maestro)/tenant/[tenantSlug]/programs/page.tsx',
      pageComponent: 'TenantProgramsCanonicalPage',
      // Uses ProgramCanonShell (AbarVa canonical wrapper). No TopBar/PrimaryNav.
      shellCompliance: 'canonical',
      tenantDataRichness: 'rich',
      legacyShellFinding: null,
      remediation: 'No action needed',
      riskLevel: 'low',
      deterministicSeed: true,
    },
    {
      routePattern: '/tenant/[tenantSlug]/programs/[programSlug]',
      routeFile: 'src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx',
      pageComponent: 'TenantProgramCanonicalPage',
      // Uses ProgramCanonShell (AbarVa canonical wrapper). No TopBar/PrimaryNav.
      shellCompliance: 'canonical',
      tenantDataRichness: 'rich',
      legacyShellFinding: null,
      remediation: 'No action needed',
      riskLevel: 'low',
      deterministicSeed: true,
    },
    {
      routePattern: '/source',
      routeFile: 'src/app/(maestro)/source/page.tsx',
      pageComponent: 'SourceDashboardPage',
      // Uses SourceCanonShell (AbarVa canonical wrapper). No TopBar/PrimaryNav.
      shellCompliance: 'canonical',
      tenantDataRichness: 'partial',
      legacyShellFinding: null,
      remediation: 'No action needed',
      riskLevel: 'low',
      deterministicSeed: true,
    },
    {
      routePattern: '/source/events',
      routeFile: null,
      pageComponent: null,
      // No dedicated events list page found; access via source index or admin.
      shellCompliance: 'unknown',
      tenantDataRichness: 'partial',
      legacyShellFinding: 'No dedicated /source/events list page found; route may be implicit via source index.',
      remediation: 'Verify whether a standalone /source/events list page is required; create SourceEventsListPage using SourceCanonShell if so.',
      riskLevel: 'medium',
      deterministicSeed: true,
    },
    {
      routePattern: '/source/events/[eventId]',
      routeFile: 'src/app/(maestro)/source/events/[eventId]/page.tsx',
      pageComponent: 'SourceEventDetailPage',
      // Uses SourceCanonShell (AbarVa canonical wrapper). No TopBar/PrimaryNav.
      shellCompliance: 'canonical',
      tenantDataRichness: 'partial',
      legacyShellFinding: null,
      remediation: 'No action needed',
      riskLevel: 'low',
      deterministicSeed: true,
    },
    {
      routePattern: '/tenant/[tenantSlug]/intelligence',
      routeFile: 'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx',
      pageComponent: 'TenantIntelligencePage',
      // No shell wrapper import; renders <main> directly inside (maestro) layout.
      // Layout provides canonical AbarvaNav. Page itself is bare — no canon shell.
      shellCompliance: 'deferred',
      tenantDataRichness: 'thin',
      legacyShellFinding: 'Page renders a bare <main> without a named canon shell component (no IntelligenceCanonShell). Shell is inherited from layout only.',
      remediation: 'Wrap page content in an IntelligenceCanonShell or equivalent AbarVa canon shell component for consistent page-level framing.',
      riskLevel: 'medium',
      deterministicSeed: true,
    },
    {
      routePattern: '/tenant/[tenantSlug]/tower',
      routeFile: 'src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx',
      pageComponent: 'TenantTowerSeedPage',
      // No named canon shell; renders <div> directly inside (maestro) layout.
      // Layout provides canonical AbarvaNav. Page itself is bare.
      shellCompliance: 'deferred',
      tenantDataRichness: 'thin',
      legacyShellFinding: 'Page renders a bare <div> without a named canon shell component (no TowerCanonShell). Shell is inherited from layout only.',
      remediation: 'Wrap page content in a TowerCanonShell or equivalent AbarVa canon shell component for consistent page-level framing.',
      riskLevel: 'medium',
      deterministicSeed: true,
    },
    {
      routePattern: '/platform/admin',
      routeFile: 'src/app/(maestro)/platform/admin/page.tsx',
      pageComponent: 'AdminPortal',
      // Uses AdminCanonShell (AbarVa canonical wrapper). No TopBar/PrimaryNav.
      shellCompliance: 'canonical',
      tenantDataRichness: 'shell_only',
      legacyShellFinding: null,
      remediation: 'No action needed',
      riskLevel: 'low',
      deterministicSeed: true,
    },
    {
      routePattern: '/platform/admin/architecture',
      routeFile: 'src/app/(maestro)/platform/admin/architecture/page.tsx',
      pageComponent: 'ArchitecturePage',
      // Uses AdminCanonShell (AbarVa canonical wrapper). No TopBar/PrimaryNav.
      shellCompliance: 'canonical',
      tenantDataRichness: 'shell_only',
      legacyShellFinding: null,
      remediation: 'No action needed',
      riskLevel: 'low',
      deterministicSeed: true,
    },
    {
      routePattern: '/platform/admin/production-readiness',
      routeFile: 'src/app/(maestro)/platform/admin/production-readiness/page.tsx',
      pageComponent: 'ProductionReadinessPage',
      // Uses AdminCanonShell (AbarVa canonical wrapper). No TopBar/PrimaryNav.
      shellCompliance: 'canonical',
      tenantDataRichness: 'shell_only',
      legacyShellFinding: null,
      remediation: 'No action needed',
      riskLevel: 'low',
      deterministicSeed: true,
    },
    {
      routePattern: '/platform/admin/build-progress',
      routeFile: 'src/app/(maestro)/platform/admin/build-progress/page.tsx',
      pageComponent: 'BuildProgressPage',
      // Uses AdminCanonShell (AbarVa canonical wrapper). No TopBar/PrimaryNav.
      shellCompliance: 'canonical',
      tenantDataRichness: 'shell_only',
      legacyShellFinding: null,
      remediation: 'No action needed',
      riskLevel: 'low',
      deterministicSeed: true,
    },
  ];
}

/** Returns records where shellCompliance is not 'canonical'. */
export function getRoutesNeedingRemediation(): RouteOwnershipRecord[] {
  return buildMainRouteOwnershipMap().filter(
    (r) => r.shellCompliance !== 'canonical',
  );
}

/** Summarizes distribution of compliance statuses across all routes. */
export function summarizeRouteOwnership(): {
  total: number;
  canonical: number;
  legacy: number;
  mixed: number;
  unknown: number;
  deferred: number;
  highRisk: number;
} {
  const records = buildMainRouteOwnershipMap();
  return {
    total: records.length,
    canonical: records.filter((r) => r.shellCompliance === 'canonical').length,
    legacy: records.filter((r) => r.shellCompliance === 'legacy').length,
    mixed: records.filter((r) => r.shellCompliance === 'mixed').length,
    unknown: records.filter((r) => r.shellCompliance === 'unknown').length,
    deferred: records.filter((r) => r.shellCompliance === 'deferred').length,
    highRisk: records.filter((r) => r.riskLevel === 'high').length,
  };
}
