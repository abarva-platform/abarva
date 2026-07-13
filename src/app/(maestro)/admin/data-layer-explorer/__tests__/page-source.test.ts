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

  it("renders through the canonical Admin shell as a read-only explorer", () => {
    expect(pageSource).toContain("AdminCanonShellV2");
    expect(pageSource).toContain("resolveAdminTenant");
    expect(pageSource).toContain("buildAdminDataLayerExplorerModel");
    expect(pageSource).toContain("data-admin-data-layer-explorer");
    expect(pageSource).toContain("data-data-journey-left-nav");
    expect(pageSource).toContain("data-data-journey-section");
    expect(pageSource).toContain("data-input-category");
    expect(pageSource).toContain("data-page-layer-map");
    expect(pageSource).toContain("data-quality-checks");
    expect(pageSource).toContain("data-guardrails");
    expect(pageSource).toContain("No writes");
  });

  it("exposes the audit command for proof artifact generation", () => {
    expect(packageSource).toContain("audit:admin-data-layer-explorer");
    expect(packageSource).toContain(
      "tsx scripts/audit/build-admin-data-layer-explorer.ts",
    );
  });
});
