import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("/admin home page source", () => {
  const source = readFileSync(
    join(process.cwd(), "src/app/(maestro)/admin/page.tsx"),
    "utf8",
  );

  it("keeps Home as a read-only system review page", () => {
    expect(source).toContain("system review");
    expect(source).toContain("Read-only view of what AbarVa currently knows");
    expect(source).toContain("What is in the system");
    expect(source).toContain("Review queue");
  });

  it("routes operators to Data Loads instead of embedding upload controls on Home", () => {
    expect(source).toContain('href="/admin/setup"');
    expect(source).toContain("Open Data Loads");
    expect(source).not.toContain("CsvUploadConnector");
    expect(source).not.toContain("/api/admin/context-layer/csv-upload");
  });
});
