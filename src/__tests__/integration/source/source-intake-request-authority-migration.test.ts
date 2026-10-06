import { readFileSync } from "node:fs";
import path from "node:path";
import { scanForDestructivePatterns } from "@/scripts/run-migrations";

const migrationName = "20260922140000_source_intake_request_authority.sql";
const sql = readFileSync(
  path.join(process.cwd(), "supabase/migrations", migrationName),
  "utf8",
);
const collapsed = sql.replace(/\s+/g, " ").trim();

describe("Source intake request authority migration", () => {
  it("keeps imported versions, human decisions, and event links as separate authorities", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS source.intake_request_version");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS source.intake_request_mapping_decision");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS source.intake_request_event_link");
    expect(sql).toContain("source_sha256 TEXT NOT NULL");
    expect(sql).toContain("source_intake_request_version_hash_check");
  });

  it("makes every authority append-only", () => {
    expect(collapsed).toContain(
      "BEFORE UPDATE OR DELETE ON source.intake_request_version",
    );
    expect(collapsed).toContain(
      "BEFORE UPDATE OR DELETE ON source.intake_request_mapping_decision",
    );
    expect(collapsed).toContain(
      "BEFORE UPDATE OR DELETE ON source.intake_request_event_link",
    );
  });

  it("scopes authenticated reads through canonical tenant authority", () => {
    expect(sql.match(/source\.can_read_sourcing_tenant\(tenant_key\)/g)).toHaveLength(1);
    expect(sql).toContain("FOREACH table_name IN ARRAY");
    expect(sql).toContain("FOR SELECT TO authenticated");
    expect(sql).toContain("FOR ALL TO service_role");
  });

  it("allows only one event link for a request", () => {
    expect(collapsed).toContain("UNIQUE (tenant_key, request_id)");
    expect(collapsed).toContain(
      "FOREIGN KEY (source_event_id, tenant_key) REFERENCES source_events(id, client_key)",
    );
  });

  it("contains no destructive data or table operations", () => {
    expect(scanForDestructivePatterns(migrationName, sql)).toEqual([]);
  });
});
