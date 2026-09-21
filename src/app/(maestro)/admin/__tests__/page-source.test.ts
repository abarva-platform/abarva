import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("/admin setup page source", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/(maestro)/admin/page.tsx"),
    "utf8",
  );

  it("resolves the active tenant before building the governed setup view", () => {
    expect(source).toContain("resolveAdminTenant()");
    expect(source).toContain("getActiveClientRow()");
    expect(source).toContain("buildLoadStudioView");
    expect(source).toContain("buildAdminSetupControlReadModel");
  });

  it("passes tenant-scoped data to the setup experience", () => {
    expect(source).toContain('surface="setup"');
    expect(source).toContain("tenantKey={clientKey}");
    expect(source).toContain('clientId={activeClient?.id ?? ""}');
    expect(source).toContain("view={view}");
    expect(source).toContain("setupControl={setupControl}");
    expect(source).toContain("sourceFiles={sourceFiles.map");
  });
});
