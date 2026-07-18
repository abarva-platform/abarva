// DEMODATA1 — Demo Dataset Registry and Tenant Richness Model
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DemoDataTier =
  | "rich"
  | "partial"
  | "thin"
  | "deterministic_only"
  | "not_seeded"
  | "shell_only";

export type DemoSurfaceKey =
  | "programs"
  | "source"
  | "intelligence"
  | "control_tower"
  | "admin";

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
  aliases: string[];
  tenantName: string;
  overallTier: DemoDataTier;
  datasetRoot: string | null;
  loaderTenantKey: string | null;
  rehearsalEligible: boolean;
  nightlyResetCommand: string | null;
  verificationCommand: string | null;
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
  tenantSlug: "apex-retail",
  aliases: ["apex"],
  tenantName: "Apex Retail",
  overallTier: "rich",
  datasetRoot: "datasets/apex-retail-synthetic-v1",
  loaderTenantKey: "apex",
  rehearsalEligible: true,
  nightlyResetCommand:
    "TENANT_KEY=apex npx tsx scripts/seed/load-tenant-substrate.ts --dry-run",
  verificationCommand: "npm run demo:environment:verify",
  surfaces: [
    {
      surface: "programs",
      tier: "rich",
      description:
        "6 programmes, 14 deliverables for CDP Activation. Phase/gate/workshop seeded. Wave 18-19 storyline.",
      seedFile: "src/lib/programs/program-flagship-view.ts",
      caveat: "Deterministic seed. No live programme state.",
      routeHint: "/tenant/apex-retail/programs",
      deterministicSeed: true,
    },
    {
      surface: "source",
      tier: "partial",
      description:
        "AMS outsourcing scenario. 4 fictional vendors. Commercial risks, signals, missions. Linked to APX-CDP-2026.",
      seedFile: "src/lib/source/source-commercial-demo-scenario.ts",
      caveat:
        "Deterministic seed. No live vendor data. Fictional vendor names.",
      routeHint: "/source/events/apex-retail-ams-outsourcing-2026",
      deterministicSeed: true,
    },
    {
      surface: "intelligence",
      tier: "deterministic_only",
      description:
        "Pattern detection. 10 categories. Same output regardless of client.",
      seedFile: "src/lib/source/intelligence-patterns.ts",
      caveat: "Deterministic. Not client-specific.",
      routeHint: "/tenant/apex-retail/intelligence",
      deterministicSeed: true,
    },
    {
      surface: "control_tower",
      tier: "deterministic_only",
      description:
        "Signal intelligence. 10 signal types. Same output regardless of client.",
      seedFile: "src/lib/source/control-tower-signals.ts",
      caveat: "Deterministic. No live procurement monitoring.",
      routeHint: "/tenant/apex-retail/tower",
      deterministicSeed: true,
    },
    {
      surface: "admin",
      tier: "rich",
      description:
        "Architecture canvas (9 planes), production readiness decision flow, build progress.",
      seedFile: "docs/build/production-readiness.json",
      caveat: "Manifest-backed. Not live.",
      routeHint: "/platform/admin",
      deterministicSeed: true,
    },
  ],
  sourceProgramLinkage: true,
  knownLinkageFile: "src/lib/source/source-program-link.ts",
  dataNote:
    "Apex Retail is the primary demo tenant. Full storyline: Source AMS → Program CDP Activation.",
  deterministicSeed: true,
};

const MERIDIAN_DATASET: DemoTenantDataset = {
  tenantSlug: "meridian-health",
  aliases: ["meridian"],
  tenantName: "Meridian Health System",
  overallTier: "rich",
  datasetRoot: "datasets/meridian-health-synthetic-v1",
  loaderTenantKey: "meridian",
  rehearsalEligible: true,
  nightlyResetCommand:
    "TENANT_KEY=meridian npx tsx scripts/seed/load-tenant-substrate.ts --dry-run",
  verificationCommand: "npm run demo:environment:verify",
  surfaces: [
    {
      surface: "programs",
      tier: "partial",
      description:
        "Synthetic healthcare application portfolio, initiatives, run costs, vendor contracts, and operating evidence available for rehearsal.",
      seedFile: "datasets/meridian-health-synthetic-v1",
      caveat:
        "Synthetic substrate only. Route coverage must be smoke-tested before a live demo.",
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: "source",
      tier: "partial",
      description:
        "Synthetic vendor, contract, renewal, and source-file evidence is available for Source rehearsal.",
      seedFile: "datasets/meridian-health-synthetic-v1/04-vendors",
      caveat:
        "Synthetic contracts and sources only. Do not claim live Meridian vendor telemetry.",
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: "intelligence",
      tier: "rich",
      description:
        "Tenant-grounded synthetic context chunks and expected Sentinel answers are available for healthcare rehearsal.",
      seedFile:
        "datasets/meridian-health-synthetic-v1/13-context/client-data-corpus.jsonl",
      caveat: "Synthetic healthcare evidence only.",
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: "control_tower",
      tier: "partial",
      description:
        "DORA, AI-tool, run-cost, incident, and org evidence is available for Tower-style rehearsal.",
      seedFile: "datasets/meridian-health-synthetic-v1",
      caveat:
        "Synthetic operating telemetry only. Not a live client dashboard.",
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: "admin",
      tier: "partial",
      description:
        "Dataset manifest and upload-template catalog can support admin/setup walkthroughs.",
      seedFile: "datasets/meridian-health-synthetic-v1/manifest.yaml",
      caveat:
        "Admin route proof still requires a browser smoke against the selected environment.",
      routeHint: null,
      deterministicSeed: true,
    },
  ],
  sourceProgramLinkage: false,
  knownLinkageFile: null,
  dataNote:
    "Meridian Health System is a synthetic healthcare rehearsal tenant with static substrate and loader compatibility.",
  deterministicSeed: true,
};

const FIRST_CAPITAL_DATASET: DemoTenantDataset = {
  tenantSlug: "first-capital",
  aliases: ["firstcapital", "arcturus"],
  tenantName: "FS Demo",
  overallTier: "rich",
  datasetRoot: "datasets/first-capital-financial-synthetic-v1",
  loaderTenantKey: "firstcapital",
  rehearsalEligible: true,
  nightlyResetCommand:
    "TENANT_KEY=firstcapital npx tsx scripts/seed/load-tenant-substrate.ts --dry-run",
  verificationCommand: "npm run demo:environment:verify",
  surfaces: [
    {
      surface: "programs",
      tier: "partial",
      description:
        "Synthetic financial-services application portfolio, initiatives, teams, and run-cost data are available for rehearsal.",
      seedFile: "datasets/first-capital-financial-synthetic-v1",
      caveat:
        "Synthetic substrate only. Route coverage must be smoke-tested before a live demo.",
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: "source",
      tier: "partial",
      description:
        "Synthetic vendor contracts, financial-services obligations, and source files are available for Source rehearsal.",
      seedFile: "datasets/first-capital-financial-synthetic-v1/04-vendors",
      caveat:
        "Synthetic vendor data only. Do not claim live financial-services procurement telemetry.",
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: "intelligence",
      tier: "rich",
      description:
        "Tenant-grounded context chunks and expected Sentinel answers are available for financial-services rehearsal.",
      seedFile:
        "datasets/first-capital-financial-synthetic-v1/13-context/client-data-corpus.jsonl",
      caveat: "Synthetic financial-services evidence only.",
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: "control_tower",
      tier: "partial",
      description:
        "DORA, AI-tool, vendor, initiative, and org evidence is available for Tower-style rehearsal.",
      seedFile: "datasets/first-capital-financial-synthetic-v1",
      caveat:
        "Synthetic operating telemetry only. Not a live client dashboard.",
      routeHint: null,
      deterministicSeed: true,
    },
    {
      surface: "admin",
      tier: "partial",
      description:
        "Dataset manifest and loader aliases can support admin/setup walkthroughs.",
      seedFile: "datasets/first-capital-financial-synthetic-v1/manifest.yaml",
      caveat:
        "Admin route proof still requires a browser smoke against the selected environment.",
      routeHint: null,
      deterministicSeed: true,
    },
  ],
  sourceProgramLinkage: false,
  knownLinkageFile: null,
  dataNote:
    "FS Demo is a synthetic financial-services rehearsal tenant. The legacy arcturus key remains an alias only.",
  deterministicSeed: true,
};

const ALL_DATASETS: DemoTenantDataset[] = [
  APEX_RETAIL_DATASET,
  MERIDIAN_DATASET,
  FIRST_CAPITAL_DATASET,
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
  return (
    ALL_DATASETS.find(
      (d) => d.tenantSlug === tenantSlug || d.aliases.includes(tenantSlug),
    ) ?? null
  );
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
 * Returns the recommended demo route for a given tenant + surface, or
 * null when no route is available.
 *
 * P0-2 fix (rehearsal 2026-05-22): previously this returned a string that
 * began with `/tenant/apex-retail/programs` (with a note appended) as the
 * "safe fallback" for any unseeded tenant/surface. A caller that consumed
 * the prefix via `route.startsWith('/tenant/')` would route to Apex —
 * cross-tenant leak class. Honest empty (null) is the right answer.
 */
export function getDemoRouteRecommendation(
  tenantSlug: string,
  surface: DemoSurfaceKey,
): string | null {
  const surfaceData = getSurfaceDataAvailability(tenantSlug, surface);
  if (surfaceData?.routeHint) {
    return surfaceData.routeHint;
  }
  if (!getDemoDatasetForTenant(tenantSlug)) {
    console.error(
      "[demo-routing] getDemoRouteRecommendation called for unknown tenant",
      JSON.stringify({
        tenantSlug,
        surface,
        reason: "unknown_tenant",
        safeFallback: null,
      }),
    );
  }
  return null;
}

/** Returns an aggregate coverage summary across all demo tenants. */
export function summarizeDemoDataCoverage(): DemoCoverageSummary {
  const tenants = listDemoDatasets();
  const richTenants = tenants.filter((t) => t.overallTier === "rich").length;
  const thinTenants = tenants.filter((t) => t.overallTier === "thin").length;
  const shellOnlyTenants = tenants.filter(
    (t) => t.overallTier === "shell_only",
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
    caveat: "All data is deterministic seed.",
  };
}
