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
    expect(componentSource).toContain(
      "Choose the dimension before choosing the file",
    );
    expect(componentSource).toContain("model.dimensionCatalog.map");
    expect(componentSource).toContain("Template and format library");
  });

  it("keeps implementation plumbing out of the Maestro-facing setup canvas", () => {
    expect(componentSource).toContain("Governed load workflow");
    expect(componentSource).toContain("model.workflowControls.map");
    expect(componentSource).not.toContain(
      "{control.control} · {control.apiPath}",
    );
  });

  it("keeps cross-client manifest coverage out of the runtime setup page", () => {
    expect(componentSource).not.toContain("model.manifestCoverage.map");
  });
});
