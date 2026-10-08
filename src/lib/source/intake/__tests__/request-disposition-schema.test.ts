import { readFileSync } from "node:fs";
import { join } from "node:path";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20261006214500_source_intake_request_disposition.sql",
);

function migration(): string {
  return readFileSync(migrationPath, "utf8");
}

describe("request-level intake disposition authority", () => {
  it("has a separate append-only decision from field mapping", () => {
    const sql = migration();
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS source\.intake_request_disposition/i);
    expect(sql).toMatch(
      /CHECK\s*\(\s*disposition_state\s+IN\s*\(\s*'accepted'\s*,\s*'returned'\s*,\s*'merged'\s*,\s*'declined'\s*\)\s*\)/i,
    );
    expect(sql).toMatch(/UNIQUE\s*\(\s*tenant_key\s*,\s*request_id\s*,\s*source_version\s*\)/i);
    expect(sql).toMatch(/BEFORE UPDATE OR DELETE ON source\.intake_request_disposition/i);
    expect(sql).not.toMatch(/ALTER TABLE source\.intake_request_mapping_decision/i);
  });

  it("binds the subject and merge survivor to source versions in the same tenant", () => {
    const sql = migration();
    expect(sql).toMatch(
      /FOREIGN KEY\s*\(\s*tenant_key\s*,\s*request_id\s*,\s*source_version\s*\)\s*REFERENCES source\.intake_request_version\s*\(\s*tenant_key\s*,\s*request_id\s*,\s*source_version\s*\)/i,
    );
    expect(sql).toMatch(
      /FOREIGN KEY\s*\(\s*tenant_key\s*,\s*surviving_request_id\s*,\s*surviving_source_version\s*\)\s*REFERENCES source\.intake_request_version\s*\(\s*tenant_key\s*,\s*request_id\s*,\s*source_version\s*\)/i,
    );
    expect(sql).toMatch(/surviving_request_id\s*<>\s*request_id/i);
  });

  it("requires an actual rationale for declined, returned and merged requests", () => {
    const sql = migration();
    expect(sql).toMatch(/disposition_state\s+NOT\s+IN\s*\(\s*'returned'\s*,\s*'merged'\s*,\s*'declined'\s*\)/i);
    expect(sql).toMatch(/NULLIF\s*\(\s*BTRIM\s*\(\s*rationale\s*\)\s*,\s*''\s*\)\s+IS NOT NULL/i);
  });

  it("permits survivor fields only for a merged request and keeps RLS", () => {
    const sql = migration();
    expect(sql).toMatch(/disposition_state\s*=\s*'merged'\s+AND\s+surviving_request_id\s+IS NOT NULL/i);
    expect(sql).toMatch(/surviving_source_version\s+IS NOT NULL/i);
    expect(sql).toMatch(/disposition_state\s*<>\s*'merged'\s+AND\s+surviving_request_id\s+IS NULL/i);
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i);
    expect(sql).toMatch(/source\.can_read_sourcing_tenant\(tenant_key\)/i);
    expect(sql).not.toMatch(/DISABLE ROW LEVEL SECURITY/i);
  });
});
