import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("/admin home page source", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/(maestro)/admin/page.tsx"),
    "utf8",
  );

  it("keeps Home as the read-only Admin Control Center", () => {
    expect(source).toContain("system review");
    expect(source).toContain("Admin Control Center");
    expect(source).toContain("Home stays insight-first and read-only");
    expect(source).toContain("Loaded data by dimension");
    expect(source).toContain("Review queue");
    expect(source).toContain("Read-only gaps that change client readiness");
  });

  it("routes operators to Data Loads instead of embedding upload controls on Home", () => {
    expect(source).toContain('href="/admin/setup"');
    expect(source).toContain("Open Data Loads");
    expect(source).not.toContain("CsvUploadConnector");
    expect(source).not.toContain("/api/admin/context-layer/csv-upload");
  });
});
