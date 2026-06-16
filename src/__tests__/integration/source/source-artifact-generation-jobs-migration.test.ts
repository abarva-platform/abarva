import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const migrationPath = path.join(
  repoRoot,
  "supabase/migrations/20260616234000_source_artifact_generation_jobs.sql",
);
const sql = fs.readFileSync(migrationPath, "utf8");

describe("source_artifact_generation_jobs migration", () => {
  it("creates an additive durable queue table for Source artifact generation", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS source_artifact_generation_jobs");
    expect(sql).toContain("source_event_id     UUID NOT NULL REFERENCES source_events");
    expect(sql).toContain("artifact_row_id     UUID NOT NULL REFERENCES source_event_artifact_states");
    expect(sql).toContain("quality_tier        TEXT NOT NULL DEFAULT 'real_engagement'");
  });

  it("tracks queue lifecycle and prevents duplicate active jobs for the same artifact", () => {
    expect(sql).toContain("CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled'))");
    expect(sql).toContain("uq_source_artifact_generation_jobs_active_artifact");
    expect(sql).toContain("WHERE status IN ('queued', 'running')");
  });

  it("uses tenant-scoped read RLS and service-role writes", () => {
    expect(sql).toContain("ALTER TABLE source_artifact_generation_jobs ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("service_role_all_source_artifact_generation_jobs");
    expect(sql).toContain("authenticated_read_source_artifact_generation_jobs");
    expect(sql).toContain("can_read_tenant_by_key(client_key)");
    expect(sql).toContain("GRANT SELECT ON source_artifact_generation_jobs TO authenticated");
  });
});
