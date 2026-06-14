import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Design-pin for the /admin/setup "Data Loads" surface.
 *
 * Rewritten for the 2026-06-02 redesign (audit + v2 wireframe). The
 * page is now the operator workflow only, bound to REAL per-tenant
 * inventory data, with the reload-command-plan / pilot-verifier /
 * 33-row template catalog moved off-page. This test pins the new
 * contract and guards the regressions the audit called out.
 */
describe("/admin/setup data loads page source", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/(maestro)/admin/setup/page.tsx"),
    "utf8",
  );
  const componentSource = readFileSync(
    join(process.cwd(), "src/components/admin/SetupDataLoadCenter.tsx"),
    "utf8",
  );
  const viewSource = readFileSync(
    join(process.cwd(), "src/lib/admin/setup-load-studio-view.ts"),
    "utf8",
  );

  it("renders the native setup page instead of redirecting to /admin", () => {
    expect(source).toContain("AdminSetupDataLoadCenterPage");
    expect(source).toContain("SetupDataLoadCenter");
    expect(source).not.toContain("redirect('/admin')");
  });

  it("uses canonical admin tenant resolution and shell tenant name", () => {
    expect(source).toContain("resolveAdminTenant");
    expect(source).toContain(
      "<AdminCanonShellV2 tenantName={tenant.tenantName}>",
    );
  });

  it("binds to the REAL per-tenant inventory snapshot — not a synthetic model", () => {
    expect(source).toContain("clientKeyToInventorySubstrateKey");
    expect(source).toContain("getSetupInventorySnapshot");
    expect(source).toContain("buildLoadStudioView");
    // honest fallback, never a thrown page
    expect(source).toContain(".catch(() => null)");
    // the old synthetic model is no longer the page's data source
    expect(source).not.toContain("buildSetupDataLoadCenterModel");
  });

  it("renders the v3 file-cabinet workflow: identity, status strip, cabinet table, controls, audit trail", () => {
    expect(componentSource).not.toContain("CsvUploadConnector");
    expect(componentSource).toContain("Load data for {tenant.name}");
    expect(componentSource).toContain("Data cabinet");
    expect(componentSource).toContain("Client data cabinet");
    expect(componentSource).toContain("Upload workflow preview");
    expect(componentSource).toContain(
      "view.templateGuide.starterTemplates.map",
    );
    expect(componentSource).not.toContain("Formats by governed path");
    expect(componentSource).not.toContain("view.templateGuide.formatSupport.map");
    expect(componentSource).not.toContain("view.workflow.map");
    expect(componentSource).toContain("view.readiness.map");
    expect(componentSource).toContain("view.metrics.map");
    expect(componentSource).toContain("view.controls.slice(0, 4).map");
    expect(componentSource).toContain("Audit trail");
    expect(componentSource).toContain("view.ledger");
    expect(componentSource).toContain("Upload file");
  });

  it("removes the implementation-doc sections the audit flagged (off-page now)", () => {
    for (const banned of [
      "Reload command plan",
      "Pilot verifier posture",
      "Loader readiness",
      "Exception intake",
      "Templates by dimension",
      "Dimension library",
      "model.reloadCommandPlan",
      "model.dimensionCatalog",
      "model.manifestCoverage",
    ]) {
      expect(componentSource).not.toContain(banned);
    }
  });

  it("keeps implementation jargon out of operator-facing copy", () => {
    for (const file of [componentSource, viewSource]) {
      // strip block + line comments so doctrine notes can name the jargon
      const visible = file
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      for (const jargon of [
        "Azure Blob",
        "Postgres",
        "idempotency",
        "npm run verify",
        "T357",
      ]) {
        expect(visible).not.toContain(jargon);
      }
    }
  });

  it("uses the locked calm palette and routes actions to real product surfaces", () => {
    expect(componentSource).not.toContain("background: COLORS.navy");
    // every off-page link target is a real route, never an in-page anchor
    expect(viewSource).toContain("/admin/context-layer/templates");
    expect(viewSource).toContain("/admin/context-layer/uploads");
    expect(viewSource).toContain("/admin/data-trust");
    expect(viewSource).not.toContain('"#template-library"');
  });

  it("keeps the focused upload route tenant-scoped from the server page", () => {
    expect(source).toContain("clientId={tenant.clientId}");
    expect(componentSource).toContain("view.templateGuide.uploadAction.href");
    expect(componentSource).not.toContain("clientId={clientId}");
  });

  it("states that data loading is scoped to the active client only", () => {
    expect(componentSource).toContain("for this client");
    expect(componentSource).not.toContain("cross-tenant loading");
  });
});
