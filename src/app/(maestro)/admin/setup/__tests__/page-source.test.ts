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

  it("renders actual load and process controls in the setup canvas", () => {
    expect(componentSource).toContain("CsvUploadConnector");
    expect(componentSource).toContain("Load data here");
    expect(componentSource).toContain("Workflow and controls");
    expect(componentSource).toContain("model.workflowControls.map");
  });

  it("keeps cross-client manifest coverage out of the runtime setup page", () => {
    expect(componentSource).not.toContain("model.manifestCoverage.map");
  });
});
