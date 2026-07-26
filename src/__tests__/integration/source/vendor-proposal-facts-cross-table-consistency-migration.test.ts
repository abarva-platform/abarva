// Vendor proposal facts cross-table consistency · migration dry-run /
// contract test (RLS/tenant-isolation workstream, PR B).
//
// Reads the migration SQL off disk and asserts the schema contract — no DB
// connection, matching this repo's established migration dry-run
// convention (see sourcing-work-items-migration.test.ts). The actual
// trigger BEHAVIOR (rejecting a mismatched insert against a real Postgres)
// is proven by the "Fresh Postgres migration replay" CI check (applies this
// SQL against a real ephemeral instance) and by the live multi-tenant
// production proof — this test only guards the SQL's structure.

import { readFileSync } from "node:fs";
import path from "node:path";

const MIGRATION_FILE =
  "20260726020000_vendor_proposal_facts_cross_table_consistency.sql";
const MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations",
  MIGRATION_FILE,
);

const sql = readFileSync(MIGRATION_PATH, "utf8");
const collapsed = sql.replace(/[ \t]+/g, " ");

describe("vendor_proposal_facts cross-table consistency migration · structure", () => {
  it("is wrapped in a BEGIN/COMMIT transaction", () => {
    expect(sql).toContain("BEGIN;");
    expect(sql.trimEnd().endsWith("COMMIT;")).toBe(true);
  });

  it("defines a BEFORE INSERT trigger on source_vendor_proposal_facts checking event/artifact/supersession consistency", () => {
    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION source_vendor_proposal_facts_check_ownership_consistency()",
    );
    expect(sql).toContain("BEFORE INSERT ON source_vendor_proposal_facts");
    expect(sql).toContain("FROM source_events WHERE id = NEW.source_event_id");
    expect(sql).toContain(
      "FROM source_artifacts WHERE id = NEW.proposal_artifact_id",
    );
    expect(sql).toContain(
      "FROM source_vendor_proposal_facts WHERE id = NEW.supersedes_fact_id",
    );
  });

  it("checks the fact's client_key against the referenced event's client_key", () => {
    expect(collapsed).toContain(
      "IF event_client_key IS DISTINCT FROM NEW.client_key THEN",
    );
  });

  it("checks the proposal artifact's tenant_key AND source_event_id, not just tenant", () => {
    expect(collapsed).toContain(
      "artifact_tenant_key IS DISTINCT FROM NEW.client_key",
    );
    expect(collapsed).toContain(
      "artifact_event_id IS DISTINCT FROM NEW.source_event_id",
    );
  });

  it("checks supersedes_fact_id against tenant, event, vendor, AND fact_key — not proposal_artifact_id", () => {
    expect(collapsed).toContain(
      "superseded_client_key IS DISTINCT FROM NEW.client_key",
    );
    expect(collapsed).toContain(
      "superseded_event_id IS DISTINCT FROM NEW.source_event_id",
    );
    expect(collapsed).toContain(
      "superseded_vendor_key IS DISTINCT FROM NEW.vendor_key",
    );
    expect(collapsed).toContain(
      "superseded_fact_key IS DISTINCT FROM NEW.fact_key",
    );
    // A revision is expected to come from a DIFFERENT proposal document —
    // proposal_artifact_id must never be part of the supersession match.
    expect(sql).not.toMatch(
      /superseded_proposal_artifact_id|proposal_artifact_id\s+IS\s+DISTINCT\s+FROM\s+NEW\.proposal_artifact_id/,
    );
  });

  it("defines a matching BEFORE INSERT trigger on source_vendor_proposal_fact_reviews", () => {
    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION source_vendor_proposal_fact_reviews_check_ownership_consistency()",
    );
    expect(sql).toContain(
      "BEFORE INSERT ON source_vendor_proposal_fact_reviews",
    );
    expect(collapsed).toContain(
      "fact_client_key IS DISTINCT FROM NEW.client_key",
    );
    expect(collapsed).toContain(
      "fact_event_id IS DISTINCT FROM NEW.source_event_id",
    );
  });

  it("raises an exception (does not silently pass) on every mismatch branch", () => {
    const raiseCount = (sql.match(/RAISE EXCEPTION/g) ?? []).length;
    // 2 not-found + 1 event-mismatch + 1 artifact-mismatch + 1 supersession-mismatch
    // for the facts trigger, + 1 not-found + 1 mismatch for the reviews trigger = 7.
    expect(raiseCount).toBeGreaterThanOrEqual(6);
  });
});
