import fs from "node:fs";
import path from "node:path";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

const repository = read("src/lib/source/file-cabinet/repository.ts");
const types = read("src/lib/source/file-cabinet/types.ts");
const migration = read(
  "supabase/migrations/20260920130000_source_artifact_malware_scan_status.sql",
).replace(/\s+/g, " ");

describe("Source artifacts record that nothing scanned them", () => {
  it("writes a scan status on creation instead of leaving it null", () => {
    const insert = repository.slice(
      repository.indexOf("export async function insertSourceArtifact"),
      repository.indexOf("is_client_final: row.isClientFinal"),
    );
    expect(insert).toContain('malware_scan_status: row.malwareScanStatus ?? "not_scanned"');
    expect(insert).toContain("malware_scan_reason:");
    // Control: the slice really is the insert payload, so the assertions above
    // cannot pass against an empty string.
    expect(insert).toContain("blob_sha256: row.blobSha256");
  });

  // `not_scanned` is Defender's own term and is one of the values the column's
  // CHECK constraint permits. Writing anything outside that set would be
  // refused by the database.
  it("uses a value the column constraint already permits", () => {
    expect(migration).toContain("'not_scanned'");
    expect(migration).toContain("source_artifacts_malware_scan_status_check");
  });

  // The whole point: an unscanned artifact must not read as a clean one.
  it("never records an unscanned artifact as having no threats", () => {
    const insert = repository.slice(
      repository.indexOf("export async function insertSourceArtifact"),
      repository.indexOf("is_client_final: row.isClientFinal"),
    );
    expect(insert).not.toContain("no_threats_found");
  });

  it("lets a path that does scan supply the real verdict", () => {
    expect(repository).toContain("row.malwareScanStatus ??");
    expect(types).toContain("malwareScanStatus?: string | null;");
  });

  it("reads the stored verdict back onto the record", () => {
    expect(repository).toContain(
      "malwareScanStatus: strOrNull(row.malware_scan_status)",
    );
    expect(repository).toContain(
      "malwareScanReason: strOrNull(row.malware_scan_reason)",
    );
  });

  it("states that absence is not cleanliness", () => {
    expect(types).toContain("Neither means");
    expect(types).toContain("clean.");
  });
});
