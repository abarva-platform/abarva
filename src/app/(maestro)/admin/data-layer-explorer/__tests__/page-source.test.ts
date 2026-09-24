import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Re-baselined 2026-09-24 under the P3 stale-suite triage, against the six
 * directories the coverage census cannot rank.
 *
 * One assertion of the forty-four was stale, and it had been stale for 69 days
 * in a directory no workflow reaches. The panel heading was renamed when demo
 * tenant display labels were standardised to a neutral product label
 * (`28e425db3`, 2026-07-17); this file was last touched four days earlier
 * (`6a7d58964`, 2026-07-13) and has pinned the superseded wording since. The
 * rename is deliberate and the assertion follows it — the fixture tenant's name
 * is no longer a display value on this surface, and pinning it here would keep
 * asking the product to put it back.
 *
 * Nothing else was wrong: the other 43 assertions were re-evaluated
 * independently and every one of them held. They were also *unverified* before
 * this change — the stale one sat at position 20 of 30 inside a single case, so
 * the 24 after it never ran. Each token is now its own case, named by the token
 * it looks for, so a string lost from the surface fails by name rather than
 * hiding behind the first failure in a block.
 */

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");

const pageSource = read("src/app/(maestro)/admin/data-layer-explorer/page.tsx");
const shellConfigSource = read("src/lib/admin/admin-shell-config.ts");
const packageSource = read("package.json");

/** Wiring the page depends on, and the test ids the audit reads back. */
const PAGE_TOKENS = [
  "AppShell",
  "resolveAdminTenant",
  "buildAdminDataLayerExplorerModel",
  "data-admin-data-layer-explorer",
  "data-data-journey-left-nav",
  "data-data-journey-section",
  "data-input-category",
  "data-page-layer-map",
  "data-quality-checks",
  "data-guardrails",
  "data-all-tenant-data-quality",
  "data-reference-data-audit",
  "data-manifest-projection-audit",
  "data-skyharbor-applications-remediation",
  "readLatestTenantQualityMatrix",
  "readLatestSkyHarborApplicationsRegeneration",
  "Source richness, candidate coverage",
  "Rich source exists",
  "Tenant manifest completeness",
  // Renamed by `28e425db3`; see the header. The superseded wording named the
  // fixture tenant and is deliberately not asserted.
  "Airline Demo applications/systems remediation",
  "Rich application estate regenerated",
  "Selected source",
  "Relationship candidates",
  "Candidate data leaks into default Home",
  "Adapter gaps",
  "Mapping gaps",
  "Home/aVa representation warnings",
  "Promotion blockers",
  "Production writes",
  "Runtime change",
] as const;

/** Shells this page must not be wrapped in — it is a standalone app canvas. */
const FORBIDDEN_PAGE_TOKENS = ["AdminCanonShellV2", "EditorialCanvas"] as const;

const SIDEBAR_TOKENS = [
  '"data-layer-explorer"',
  "Data Journey",
  "/admin/data-layer-explorer",
] as const;

const AUDIT_COMMAND_TOKENS = [
  "audit:admin-data-layer-explorer",
  "audit:data-quality:all-tenants",
  "audit:candidate-coverage:all-tenants",
  "audit:tenant-isolation:data-quality",
  "audit:tenant-manifest-completeness",
  "audit:source-projection:all-tenants",
  "audit:home-ava-representation",
  "audit:skyharbor-applications-candidate",
  "tsx scripts/audit/build-admin-data-layer-explorer.ts",
] as const;

describe("admin data layer explorer route", () => {
  it.each(SIDEBAR_TOKENS)("is registered in the Admin sidebar: %s", (token) => {
    expect(shellConfigSource).toContain(token);
  });

  it.each(PAGE_TOKENS)("renders the explorer surface: %s", (token) => {
    expect(pageSource).toContain(token);
  });

  it.each(FORBIDDEN_PAGE_TOKENS)(
    "stays a standalone app canvas, free of: %s",
    (token) => {
      expect(pageSource).not.toContain(token);
    },
  );

  it.each(AUDIT_COMMAND_TOKENS)(
    "exposes the audit command for proof artifact generation: %s",
    (token) => {
      expect(packageSource).toContain(token);
    },
  );
});
