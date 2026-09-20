import { readFileSync } from "node:fs";
import path from "node:path";

import { scanForDestructivePatterns } from "@/scripts/run-migrations";

const MIGRATION_FILE = "20260920010000_source_executed_nda_authority.sql";
const sql = readFileSync(
  path.join(process.cwd(), "supabase/migrations", MIGRATION_FILE),
  "utf8",
);
const collapsed = sql.replace(/\s+/g, " ").trim();

describe("Source executed NDA authority migration", () => {
  it("binds an executed NDA to its governed artifact, event, entity, and template", () => {
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS source_executed_nda_authority",
    );
    expect(collapsed).toContain(
      "FOREIGN KEY (source_event_id, client_key) REFERENCES source_events(id, client_key) ON DELETE CASCADE",
    );
    expect(collapsed).toContain(
      "FOREIGN KEY (artifact_id, client_key) REFERENCES source_artifacts(id, tenant_key)",
    );
    expect(collapsed).toContain(
      "FOREIGN KEY (client_key, supplier_legal_entity_id) REFERENCES source.vendor(tenant_key, vendor_id)",
    );
    expect(collapsed).toContain(
      "FOREIGN KEY (client_key, template_version) REFERENCES source_nda_template_versions(client_key, template_version)",
    );
    expect(sql).toContain("source_executed_nda_authority_scope_check");
    expect(sql).toContain("source_executed_nda_authority_validity_check");
    expect(sql).toContain("validate_source_executed_nda_artifact");
    expect(collapsed).toContain("artifact_type <> 'nda_executed'");
    expect(collapsed).toContain(
      "artifact_row.source_event_id IS DISTINCT FROM NEW.source_event_id::text",
    );
    expect(collapsed).toContain("artifact_row.lifecycle_state <> 'current'");
    expect(collapsed).toContain(
      "COALESCE(artifact_row.blob_sha256, artifact_row.sha256)",
    );
  });

  it("keeps recorded authority immutable and tenant-fenced", () => {
    expect(sql).toContain("prevent_source_executed_nda_authority_rewrite");
    expect(sql).toContain("source_executed_nda_authority_immutable_trigger");
    expect(sql).toContain(
      'CREATE POLICY "service_role_full_source_executed_nda_authority"',
    );
    expect(sql).toContain(
      'CREATE POLICY "authenticated_read_source_executed_nda_authority"',
    );
    expect(sql).toContain("can_read_tenant_by_key(client_key)");
    expect(sql).not.toContain(
      "authenticated_insert_source_executed_nda_authority",
    );
  });

  it("contains no destructive table or data operation", () => {
    expect(scanForDestructivePatterns(MIGRATION_FILE, sql)).toEqual([]);
  });
});
