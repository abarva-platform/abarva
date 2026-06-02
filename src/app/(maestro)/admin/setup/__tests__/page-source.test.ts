import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("/admin/setup data load center page source", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/(maestro)/admin/setup/page.tsx"),
    "utf8",
  );
  const componentSource = readFileSync(
    join(process.cwd(), "src/components/admin/SetupDataLoadCenter.tsx"),
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

  it("binds to the setup data load read model", () => {
    expect(source).toContain("buildSetupDataLoadCenterModel");
    expect(source).toContain("clientId: tenant.clientId");
    expect(source).toContain("clientKey: tenant.clientKey");
  });

  it("renders a dimension-first Data Load Studio instead of a raw connector", () => {
    expect(componentSource).not.toContain("CsvUploadConnector");
    expect(componentSource).toContain("Data Load Studio");
    // Calm reskin 2026-06-01: dimension-first headline (was "Choose the
    // dimension before choosing the file").
    expect(componentSource).toContain("Pick the business dimension first.");
    expect(componentSource).toContain("Loader readiness");
    expect(componentSource).toContain("Pilot verifier posture");
    expect(componentSource).toContain("Next actions");
    expect(componentSource).toContain("Dimension library");
    expect(componentSource).toContain("model.dimensionCatalog.map");
    expect(componentSource).toContain("Templates by dimension");
  });

  it("keeps implementation plumbing out of the Maestro-facing setup canvas", () => {
    expect(componentSource).toContain("Governed load workflow");
    expect(componentSource).toContain("model.workflowControls.map");
    expect(componentSource).not.toContain(
      "{control.control} · {control.apiPath}",
    );
    // Calm reskin: the raw "Control: {control.control}" infra label was
    // removed from the stepper (design spec principle 4).
    expect(componentSource).not.toContain("Control: {control.control}");
  });

  it("uses the locked calm palette, not navy fills", () => {
    // Design-system fidelity: black + ghost buttons only; no COLORS.navy
    // primary fills or decorative sky/mint/coral chip backgrounds.
    expect(componentSource).not.toContain("background: COLORS.navy");
    expect(componentSource).toContain("Start a governed load");
  });

  it("keeps cross-client manifest coverage out of the runtime setup page", () => {
    expect(componentSource).not.toContain("model.manifestCoverage.map");
  });

  it("keeps the T342 shell disjoint from the open template-preflight slice", () => {
    expect(componentSource).not.toContain("schema-preflight");
    expect(source).not.toContain("schema-preflight");
  });
});
