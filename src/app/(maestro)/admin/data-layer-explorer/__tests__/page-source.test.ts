import { readFileSync } from "node:fs";
import path from "node:path";

const pageSource = readFileSync(
  path.join(
    process.cwd(),
    "src/app/(maestro)/admin/data-layer-explorer/page.tsx",
  ),
  "utf8",
);
const shellConfigSource = readFileSync(
  path.join(process.cwd(), "src/lib/admin/admin-shell-config.ts"),
  "utf8",
);
const packageSource = readFileSync(
  path.join(process.cwd(), "package.json"),
  "utf8",
);

describe("admin data layer explorer route", () => {
  it("is registered in the Admin sidebar", () => {
    expect(shellConfigSource).toContain('"data-layer-explorer"');
    expect(shellConfigSource).toContain("Data Journey");
    expect(shellConfigSource).toContain("/admin/data-layer-explorer");
  });

  it("renders as a standalone app-canvas read-only explorer", () => {
    expect(pageSource).toContain("AppShell");
    expect(pageSource).not.toContain("AdminCanonShellV2");
    expect(pageSource).not.toContain("EditorialCanvas");
    expect(pageSource).toContain("resolveAdminTenant");
    expect(pageSource).toContain("buildAdminDataLayerExplorerModel");
    expect(pageSource).toContain("data-admin-data-layer-explorer");
    expect(pageSource).toContain("data-data-journey-left-nav");
    expect(pageSource).toContain("data-data-journey-section");
    expect(pageSource).toContain("data-input-category");
    expect(pageSource).toContain("data-page-layer-map");
    expect(pageSource).toContain("data-quality-checks");
    expect(pageSource).toContain("data-guardrails");
    expect(pageSource).toContain("data-all-tenant-data-quality");
    expect(pageSource).toContain("data-reference-data-audit");
    expect(pageSource).toContain("data-manifest-projection-audit");
    expect(pageSource).toContain("data-skyharbor-applications-remediation");
    expect(pageSource).toContain("readLatestTenantQualityMatrix");
    expect(pageSource).toContain("readLatestSkyHarborApplicationsRegeneration");
    expect(pageSource).toContain("Source richness, candidate coverage");
    expect(pageSource).toContain("Rich source exists");
    expect(pageSource).toContain("Tenant manifest completeness");
    expect(pageSource).toContain("SkyHarbor applications/systems remediation");
    expect(pageSource).toContain("Rich application estate regenerated");
    expect(pageSource).toContain("Selected source");
    expect(pageSource).toContain("Relationship candidates");
    expect(pageSource).toContain("Candidate data leaks into default Home");
    expect(pageSource).toContain("Adapter gaps");
    expect(pageSource).toContain("Mapping gaps");
    expect(pageSource).toContain("Home/aVa representation warnings");
    expect(pageSource).toContain("Promotion blockers");
    expect(pageSource).toContain("Production writes");
    expect(pageSource).toContain("Runtime change");
  });

  it("exposes the audit command for proof artifact generation", () => {
    expect(packageSource).toContain("audit:admin-data-layer-explorer");
    expect(packageSource).toContain("audit:data-quality:all-tenants");
    expect(packageSource).toContain("audit:candidate-coverage:all-tenants");
    expect(packageSource).toContain("audit:tenant-isolation:data-quality");
    expect(packageSource).toContain("audit:tenant-manifest-completeness");
    expect(packageSource).toContain("audit:source-projection:all-tenants");
    expect(packageSource).toContain("audit:home-ava-representation");
    expect(packageSource).toContain("audit:skyharbor-applications-candidate");
    expect(packageSource).toContain(
      "tsx scripts/audit/build-admin-data-layer-explorer.ts",
    );
  });
});
