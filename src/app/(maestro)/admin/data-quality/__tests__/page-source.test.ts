import { readFileSync } from "node:fs";
import path from "node:path";

const pageSource = readFileSync(
  path.join(process.cwd(), "src/app/(maestro)/admin/data-quality/page.tsx"),
  "utf8",
);
const shellConfigSource = readFileSync(
  path.join(process.cwd(), "src/lib/admin/admin-shell-config.ts"),
  "utf8",
);
const proxySource = readFileSync(path.join(process.cwd(), "src/proxy.ts"), "utf8");
const packageSource = readFileSync(path.join(process.cwd(), "package.json"), "utf8");

describe("admin data quality page source", () => {
  it("is registered as an active Admin route and sidebar item", () => {
    expect(shellConfigSource).toContain('"data-quality"');
    expect(shellConfigSource).toContain("Data Quality");
    expect(shellConfigSource).toContain("/admin/data-quality");
    expect(proxySource).toContain("/admin/data-quality");
  });

  it("renders the required read-only data-quality control sections", () => {
    expect(pageSource).toContain("AppShell");
    expect(pageSource).toContain("resolveAdminTenant");
    expect(pageSource).toContain("buildAdminDataQualityControlModel");
    expect(pageSource).toContain("data-admin-data-quality");
    expect(pageSource).toContain("data-quality-matrix");
    expect(pageSource).toContain("data-tenant-detail");
    expect(pageSource).toContain("data-source-vs-candidate");
    expect(pageSource).toContain("data-evidence-quality");
    expect(pageSource).toContain("data-relationship-quality");
    expect(pageSource).toContain("data-generated-risk");
    expect(pageSource).toContain("data-module-readiness-impact");
    expect(pageSource).toContain("data-promotion-blockers");
    expect(pageSource).toContain("data-admin-home-caveats");
    expect(pageSource).toContain("data-quality-guardrails");
  });

  it("keeps the control center read-only and business-facing", () => {
    expect(pageSource).toContain("Production writes");
    expect(pageSource).toContain("Candidate promoted");
    expect(pageSource).toContain("Runtime change");
    expect(pageSource).toContain("Source-rich / candidate-thin");
    expect(pageSource).not.toContain("V4");
    expect(pageSource).not.toContain("V6");
    expect(pageSource).not.toContain("V7");
    expect(pageSource).not.toMatch(/\bmock\b/i);
  });

  it("exposes the focused audit and test commands", () => {
    expect(packageSource).toContain("audit:admin-data-quality");
    expect(packageSource).toContain("test:admin-data-quality");
    expect(packageSource).toContain("tsx scripts/audit/admin-data-quality-control.ts");
  });
});
