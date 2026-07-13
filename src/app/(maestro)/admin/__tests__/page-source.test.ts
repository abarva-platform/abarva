import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("/admin home page source", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/(maestro)/admin/page.tsx"),
    "utf8",
  );

  it("renders the current setup-control Admin overview", () => {
    expect(source).toContain("AdminSetupExperience");
    expect(source).toContain("buildAdminSetupControlReadModel");
    expect(source).toContain("getTenantSourceFiles");
    expect(source).toContain("setupControl");
  });

  it("keeps upload execution out of the Admin overview page source", () => {
    expect(source).not.toContain("CsvUploadConnector");
    expect(source).not.toContain("/api/admin/context-layer/csv-upload");
    expect(source).not.toContain("Confirm & load");
  });
});
