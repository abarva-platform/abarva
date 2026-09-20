import { readFileSync } from "node:fs";
import path from "node:path";

import { scanForDestructivePatterns } from "@/scripts/run-migrations";

const MIGRATION_FILE = "20260920003500_source_nda_authority.sql";
const MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations",
  MIGRATION_FILE,
);

const sql = readFileSync(MIGRATION_PATH, "utf8");
const collapsed = sql.replace(/\s+/g, " ").trim();

describe("Source NDA authority migration", () => {
  it("creates a versioned Legal template register", () => {
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS source_nda_template_versions",
    );
    expect(sql).toContain("source_nda_template_versions_publish_check");
    expect(collapsed).toContain("template_version TEXT NOT NULL");
    expect(collapsed).toContain("content_sha256 TEXT NOT NULL");
    expect(collapsed).toContain("published_by_legal_user_id TEXT");
    expect(collapsed).toContain("UNIQUE (client_key, template_version)");
    expect(sql).toContain("prevent_published_source_nda_template_rewrite");
    expect(sql).toContain("source_nda_template_versions_immutable_trigger");
  });

  it("creates explicit, expiring waivers bound to one event and tenant", () => {
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS source_event_nda_waivers",
    );
    expect(collapsed).toContain(
      "FOREIGN KEY (source_event_id, client_key) REFERENCES source_events(id, client_key) ON DELETE CASCADE",
    );
    expect(sql).toContain("source_event_nda_waivers_expiry_check");
    expect(collapsed).toContain("approved_by_legal_user_id TEXT NOT NULL");
    expect(collapsed).toContain("approved_by_legal_name TEXT NOT NULL");
    expect(collapsed).toContain("reason TEXT NOT NULL");
    expect(sql).toContain("prevent_source_event_nda_waiver_rewrite");
    expect(sql).toContain("source_event_nda_waivers_immutable_trigger");
  });

  it("keeps both relations tenant-fenced and authenticated read-only", () => {
    expect(sql).toContain(
      'CREATE POLICY "service_role_full_source_nda_template_versions"',
    );
    expect(sql).toContain(
      'CREATE POLICY "authenticated_read_source_nda_template_versions"',
    );
    expect(sql).toContain(
      'CREATE POLICY "service_role_full_source_event_nda_waivers"',
    );
    expect(sql).toContain(
      'CREATE POLICY "authenticated_read_source_event_nda_waivers"',
    );
    expect(sql).toContain("can_read_tenant_by_key(client_key)");
    expect(sql).not.toContain("authenticated_insert_source_event_nda_waivers");
    expect(sql).not.toContain("authenticated_update_source_event_nda_waivers");
  });

  it("contains no destructive table or data operation", () => {
    expect(scanForDestructivePatterns(MIGRATION_FILE, sql)).toEqual([]);
  });
});
