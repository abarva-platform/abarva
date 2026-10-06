import fs from "node:fs";
import path from "node:path";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20261005140000_source_event_award_decision.sql",
);
const migration = fs.readFileSync(migrationPath, "utf8");
const normalized = migration.replace(/\s+/g, " ");

describe("Source event award decision migration", () => {
  it("binds the award to the event, the governed supplier, and an accepted candidate", () => {
    expect(normalized).toContain(
      "FOREIGN KEY (source_event_id, client_key) REFERENCES source_events(id, client_key) ON DELETE CASCADE",
    );
    expect(normalized).toContain(
      "FOREIGN KEY (client_key, vendor_id) REFERENCES source.vendor(tenant_key, vendor_id)",
    );
    // The constraint that stops a free-text name becoming an award: the winner
    // must already be an accepted candidate on this event.
    expect(normalized).toContain(
      "FOREIGN KEY (client_key, candidate_authority_id) REFERENCES source_event_candidate_supplier_authority(client_key, authority_id)",
    );
    expect(normalized).toContain(
      "CHECK (award_state IN ('draft', 'awarded', 'retired'))",
    );
  });

  it("requires an awarded decision to name its approver, its reason, and the contract it produced", () => {
    expect(normalized).toContain("award_state <> 'awarded'");
    for (const field of [
      "approved_by_user_id",
      "approved_by_name",
      "approved_at",
      "award_rationale",
      "evidence_reference",
      "contract_id",
      "contract_name",
      "currency",
    ]) {
      expect(normalized).toContain(field);
    }
    // Blank-but-present must not satisfy the check, so each field is tested for
    // content rather than for IS NOT NULL alone.
    expect(normalized).toContain("NULLIF(BTRIM(contract_id), '') IS NOT NULL");
    expect(normalized).toContain(
      "NULLIF(BTRIM(approved_by_name), '') IS NOT NULL",
    );
  });

  it("allows one live award per event and one contract id per tenant", () => {
    expect(normalized).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS source_event_award_active_idx ON source_event_award_decision(client_key, source_event_id) WHERE award_state <> 'retired'",
    );
    expect(normalized).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS source_event_award_contract_idx ON source_event_award_decision(client_key, contract_id) WHERE contract_id IS NOT NULL AND award_state <> 'retired'",
    );
  });

  it("makes an awarded decision immutable except for explicit retirement", () => {
    expect(normalized).toContain("prevent_source_event_award_rewrite");
    expect(normalized).toContain("OLD.award_state = 'awarded'");
    expect(normalized).toContain("NEW.award_state = 'retired'");
    expect(normalized).toContain("retired_by_user_id");
    expect(normalized).toContain("retirement_reason");
    // The contract the award produced is part of what is frozen: an awarded row
    // must not be able to point at a different contract later.
    expect(normalized).toContain(
      "NEW.contract_id IS DISTINCT FROM OLD.contract_id",
    );
  });

  it("does not infer an award from a score, shortlist, or recommendation", () => {
    // Asserted against column definitions, not bare words: the table COMMENT
    // names these precisely to say an award is none of them, and a word-level
    // assertion would fail on that sentence rather than on a real column.
    const columns = normalized
      .slice(normalized.indexOf("CREATE TABLE"), normalized.indexOf("UNIQUE (client_key, award_id)"));
    for (const forbidden of [
      "score",
      "shortlist",
      "recommendation",
      "signed_at",
      "signature",
    ]) {
      expect(columns).not.toContain(forbidden);
    }
    // Control: the columns slice really does contain the award's own fields,
    // so an empty slice cannot make the loop above pass vacuously.
    expect(columns).toContain("award_rationale");
    expect(columns).toContain("candidate_authority_id");
  });

  it("enforces tenant-scoped reads and service-role-only writes", () => {
    expect(normalized).toContain("ENABLE ROW LEVEL SECURITY");
    expect(normalized).toContain(
      'CREATE POLICY "tenant_read_source_event_award_decision"',
    );
    expect(normalized).toContain("can_read_tenant_by_key(client_key)");
    expect(normalized).toContain(
      "GRANT SELECT ON source_event_award_decision TO authenticated",
    );
    expect(normalized).toContain(
      "GRANT SELECT, INSERT, UPDATE ON source_event_award_decision TO service_role",
    );
    expect(normalized).not.toContain(
      "GRANT INSERT ON source_event_award_decision TO authenticated",
    );
  });
});
