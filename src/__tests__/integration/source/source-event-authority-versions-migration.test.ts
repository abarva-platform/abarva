import { readFileSync } from "node:fs";
import path from "node:path";

import { scanForDestructivePatterns } from "@/scripts/run-migrations";

const MIGRATION_FILE = "20260919152000_source_event_authority_versions.sql";
const MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations",
  MIGRATION_FILE,
);

const sql = readFileSync(MIGRATION_PATH, "utf8");
const collapsed = sql.replace(/\s+/g, " ").trim();

describe("source event request/strategy version authority migration", () => {
  it("creates immutable event authority versions with content hashes", () => {
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS source_event_authority_versions",
    );
    expect(collapsed).toContain(
      "FOREIGN KEY (event_id, client_key) REFERENCES source_events(id, client_key) ON DELETE CASCADE",
    );
    expect(collapsed).toContain("authority_kind TEXT NOT NULL");
    expect(collapsed).toContain("content_hash TEXT NOT NULL");
    expect(collapsed).toContain("content_json JSONB NOT NULL");
    expect(collapsed).toContain("created_by_user_id TEXT NOT NULL");
    expect(sql).toContain("source_event_authority_versions_hash_check");
    expect(sql).toContain("source_event_authority_versions_kind_check");
  });

  it("declares one current version per event and authority kind", () => {
    expect(sql).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS source_event_authority_versions_one_current_idx",
    );
    expect(collapsed).toContain(
      "ON source_event_authority_versions(event_id, authority_kind) WHERE superseded_at IS NULL",
    );
  });

  it("creates append-only approvals bound to exact authority versions", () => {
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS source_event_authority_version_approvals",
    );
    expect(collapsed).toContain("authority_kind TEXT NOT NULL");
    expect(collapsed).toContain(
      "FOREIGN KEY (version_id, event_id, client_key, authority_kind) REFERENCES source_event_authority_versions(id, event_id, client_key, authority_kind) ON DELETE CASCADE",
    );
    expect(sql).toContain(
      "source_event_authority_version_approvals_version_scope_fk",
    );
    expect(sql).toContain(
      "source_event_authority_version_approvals_role_check",
    );
    expect(sql).toContain(
      "source_event_authority_version_approvals_decision_check",
    );
    expect(sql).toContain("actor_user_id TEXT NOT NULL");
    expect(sql).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS source_event_authority_version_approvals_one_decision_idx",
    );
  });

  it("binds supersession links to the same event, tenant, and authority kind", () => {
    expect(sql).toContain(
      "enforce_source_event_authority_version_lineage_scope",
    );
    expect(sql).toContain(
      "source_event_authority_versions_lineage_scope_trigger",
    );
    expect(collapsed).toContain(
      "IS DISTINCT FROM (NEW.event_id, NEW.client_key, NEW.authority_kind)",
    );
    expect(sql).toContain(
      "supersedes_version_id must reference the same event, tenant, and authority kind",
    );
    expect(sql).toContain(
      "superseded_by_version_id must reference the same event, tenant, and authority kind",
    );
  });

  it("keeps tenant scope inherited from the parent source event", () => {
    expect(sql).toContain(
      'CREATE POLICY "authenticated_read_source_event_authority_versions"',
    );
    expect(sql).toContain(
      'CREATE POLICY "authenticated_insert_source_event_authority_version_approvals"',
    );
    expect(sql).toContain(
      "WHERE se.id = source_event_authority_versions.event_id",
    );
    expect(sql).toContain(
      "WHERE se.id = source_event_authority_version_approvals.event_id",
    );
    expect(sql).toContain("can_read_tenant_by_key(se.client_key)");
    expect(sql).toContain("is_tenant_admin()");
  });

  it("blocks authenticated mutation of append-only rows", () => {
    expect(sql).toContain(
      'CREATE POLICY "block_update_source_event_authority_versions"',
    );
    expect(sql).toContain(
      'CREATE POLICY "block_delete_source_event_authority_versions"',
    );
    expect(sql).toContain(
      'CREATE POLICY "block_update_source_event_authority_version_approvals"',
    );
    expect(sql).toContain(
      'CREATE POLICY "block_delete_source_event_authority_version_approvals"',
    );
  });

  it("contains no destructive table or data operations", () => {
    expect(scanForDestructivePatterns(MIGRATION_FILE, sql)).toEqual([]);
  });
});
