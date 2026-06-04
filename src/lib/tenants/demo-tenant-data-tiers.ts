// SHELL3 — Tenant-Aware Navigation + Demo Data Tier Badges
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DemoTenantRichness = "rich" | "thin" | "shell_only";
export type DemoSurface =
  | "programs"
  | "source"
  | "intelligence"
  | "control_tower"
  | "admin";
export type DemoSurfaceAvailability =
  | "full"
  | "partial"
  | "thin"
  | "deterministic_only"
  | "not_seeded"
  | "unavailable";

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
    tenantSlug: "apex-retail",
    tenantName: "Apex Retail",
    richness: "rich",
    surfaces: [
      {
        surface: "programs",
        availability: "full",
        caveat:
          "Deterministic seed. 6 programs, 14 deliverables for CDP Activation. Wave 19 storyline.",
        routeHint: "/tenant/apex-retail/programs",
      },
      {
        surface: "source",
        availability: "partial",
        caveat:
          "Deterministic AMS outsourcing scenario. Vendor names are fictional. No live vendor response.",
        routeHint: "/source/events/apex-retail-ams-outsourcing-2026",
      },
      {
        surface: "intelligence",
        availability: "deterministic_only",
        caveat:
          "Deterministic pattern detection. Not client-specific live intelligence.",
        routeHint: "/tenant/apex-retail/intelligence",
      },
      {
        surface: "control_tower",
        availability: "deterministic_only",
        caveat: "Deterministic signals. No live procurement monitoring.",
        routeHint: "/tenant/apex-retail/tower",
      },
      {
        surface: "admin",
        availability: "full",
        caveat: "Architecture and production readiness are manifest-backed.",
        routeHint: "/platform/admin",
      },
    ],
    sourceProgramLinkage: true,
    deterministicSeed: true,
    dataNote:
      "Apex Retail is the primary rich demo tenant. Full Programs + Source + Intelligence + Tower storyline. Wave 19 CDP Activation narrative.",
  },
  {
    tenantSlug: "meridian",
    tenantName: "Meridian",
    richness: "thin",
    surfaces: [
      {
        surface: "programs",
        availability: "not_seeded",
        caveat: "No program data seeded for Meridian.",
        routeHint: null,
      },
      {
        surface: "source",
        availability: "not_seeded",
        caveat: "No source event data seeded for Meridian.",
        routeHint: null,
      },
      {
        surface: "intelligence",
        availability: "thin",
        caveat:
          "Meridian is on Intelligence demo only. Thin deterministic data.",
        routeHint: null,
      },
      {
        surface: "control_tower",
        availability: "unavailable",
        caveat: "Not seeded for Meridian.",
        routeHint: null,
      },
      {
        surface: "admin",
        availability: "unavailable",
        caveat: "Not applicable for Meridian client view.",
        routeHint: null,
      },
    ],
    sourceProgramLinkage: false,
    deterministicSeed: true,
    dataNote: "Meridian is a thin demo tenant. Intelligence demo only.",
  },
  {
    tenantSlug: "arcturus",
    tenantName: "Arcturus",
    richness: "shell_only",
    surfaces: [
      {
        surface: "programs",
        availability: "unavailable",
        caveat:
          "Arcturus is a shell-only tenant. No program, source, or intelligence data seeded.",
        routeHint: null,
      },
      {
        surface: "source",
        availability: "unavailable",
        caveat:
          "Arcturus is a shell-only tenant. No program, source, or intelligence data seeded.",
        routeHint: null,
      },
      {
        surface: "intelligence",
        availability: "unavailable",
        caveat:
          "Arcturus is a shell-only tenant. No program, source, or intelligence data seeded.",
        routeHint: null,
      },
      {
        surface: "control_tower",
        availability: "unavailable",
        caveat:
          "Arcturus is a shell-only tenant. No program, source, or intelligence data seeded.",
        routeHint: null,
      },
      {
        surface: "admin",
        availability: "unavailable",
        caveat:
          "Arcturus is a shell-only tenant. No program, source, or intelligence data seeded.",
        routeHint: null,
      },
    ],
    sourceProgramLinkage: false,
    deterministicSeed: true,
    dataNote:
      "Arcturus exists as a Clerk test account only. No rich data in any surface.",
  },
  {
    tenantSlug: "lakeshore",
    tenantName: "Lakeshore Holdings",
    richness: "shell_only",
    surfaces: [
      {
        surface: "programs",
        availability: "unavailable",
        caveat:
          "Lakeshore Holdings is a shell-only tenant. No program, source, or intelligence data seeded.",
        routeHint: null,
      },
      {
        surface: "source",
        availability: "unavailable",
        caveat:
          "Lakeshore Holdings is a shell-only tenant. No program, source, or intelligence data seeded.",
        routeHint: null,
      },
      {
        surface: "intelligence",
        availability: "unavailable",
        caveat:
          "Lakeshore Holdings is a shell-only tenant. No program, source, or intelligence data seeded.",
        routeHint: null,
      },
      {
        surface: "control_tower",
        availability: "unavailable",
        caveat:
          "Lakeshore Holdings is a shell-only tenant. No program, source, or intelligence data seeded.",
        routeHint: null,
      },
      {
        surface: "admin",
        availability: "unavailable",
        caveat:
          "Lakeshore Holdings is a shell-only tenant. No program, source, or intelligence data seeded.",
        routeHint: null,
      },
    ],
    sourceProgramLinkage: false,
    deterministicSeed: true,
    dataNote:
      "Lakeshore Holdings is a new pilot tenant. Shell-only until Programs / Source / Intelligence / Tower data is seeded.",
  },
];

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export function listDemoTenantDataTiers(): DemoTenantDataTier[] {
  return DEMO_TENANT_DATA_TIERS;
}

export function getDemoTenantDataTier(
  tenantSlug: string,
): DemoTenantDataTier | null {
  return (
    DEMO_TENANT_DATA_TIERS.find((t) => t.tenantSlug === tenantSlug) ?? null
  );
}

export function getSurfaceAvailability(
  tenantSlug: string,
  surface: DemoSurface,
): DemoSurfaceDataState | null {
  const tenant = getDemoTenantDataTier(tenantSlug);
  if (!tenant) return null;
  return tenant.surfaces.find((s) => s.surface === surface) ?? null;
}

// ---------------------------------------------------------------------------
// P0-2 fix (rehearsal 2026-05-22): cross-tenant routing fallback.
//
// Previously `getTenantRouteFallback` returned `/tenant/apex-retail/programs`
// for any unknown tenant or unseeded surface. That meant a user whose Clerk
// metadata pinned them to (say) Northwind would be silently routed into the
// Apex Retail surface — Apex's program list, Apex's source events, Apex's
// intelligence — because the router had no entry for Northwind.
//
// This is the same class of bug fix #2236 cleaned up at the Intelligence
// route level, leaking back in at the routing-fallback layer. The honest
// behavior is: unknown tenant → return null, callers render an empty /
// "tenant not configured" state. NEVER serve another tenant's URL as a
// default.
//
// `getTenantRouteFallback` now returns `string | null`. Existing callers
// (only the synthetic pilot script) treat null as "not configured".
// ---------------------------------------------------------------------------

export function getTenantRouteFallback(
  tenantSlug: string,
  surface: DemoSurface,
): string | null {
  const tenant = getDemoTenantDataTier(tenantSlug);
  if (!tenant) {
    // Unknown tenant. Do not return another tenant's route. Log structured
    // context server-side so cross-tenant probes show up in deploy logs.
    console.error(
      "[tenant-routing] getTenantRouteFallback called for unknown tenant",
      JSON.stringify({
        tenantSlug,
        surface,
        reason: "unknown_tenant",
        safeFallback: null,
      }),
    );
    return null;
  }

  const state = tenant.surfaces.find((s) => s.surface === surface) ?? null;
  if (state?.routeHint) return state.routeHint;

  // Known tenant but this surface has no seeded route. Return null so the
  // caller can render an empty / "not seeded" state for THIS tenant rather
  // than silently routing to a different tenant.
  return null;
}
