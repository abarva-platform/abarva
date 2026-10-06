import fs from "node:fs";
import path from "node:path";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260920012000_source_event_candidate_supplier_authority.sql",
);
const migration = fs.readFileSync(migrationPath, "utf8");
const normalized = migration.replace(/\s+/g, " ");

describe("Source event candidate supplier authority migration", () => {
  it("binds candidate acceptance to the event and governed supplier legal entity", () => {
    expect(normalized).toContain(
      "FOREIGN KEY (source_event_id, client_key) REFERENCES source_events(id, client_key) ON DELETE CASCADE",
    );
    expect(normalized).toContain(
      "FOREIGN KEY (client_key, vendor_id) REFERENCES source.vendor(tenant_key, vendor_id)",
    );
    expect(normalized).toContain(
      "CHECK (authority_state IN ('draft', 'accepted', 'retired'))",
    );
    expect(normalized).toContain("accepted_by_user_id");
    expect(normalized).toContain("acceptance_rationale");
    expect(normalized).toContain("evidence_reference");
  });

  it("does not infer candidate acceptance from invitation, response, or recommendation fields", () => {
    expect(normalized).not.toContain("supplier_status TEXT");
    expect(normalized).not.toContain("response_status TEXT");
    expect(normalized).not.toContain("recommendation TEXT");
    expect(normalized).not.toContain("source.sourcing_event_supplier");
  });

  it("makes accepted authority immutable except for explicit retirement", () => {
    expect(normalized).toContain("prevent_source_event_candidate_supplier_rewrite");
    expect(normalized).toContain("OLD.authority_state = 'accepted'");
    expect(normalized).toContain("NEW.authority_state = 'retired'");
    expect(normalized).toContain("retired_by_user_id");
    expect(normalized).toContain("retirement_reason");
  });

  it("enforces tenant-scoped reads and service-role-only writes", () => {
    expect(normalized).toContain(
      'CREATE POLICY "authenticated_read_source_event_candidate_supplier_authority"',
    );
    expect(normalized).toContain("FOR SELECT TO authenticated");
    expect(normalized).toContain("can_read_tenant_by_key(client_key)");
    expect(normalized).toContain(
      'CREATE POLICY "service_role_full_source_event_candidate_supplier_authority"',
    );
    expect(normalized).toContain("FOR ALL TO service_role");
    expect(normalized).not.toContain("FOR INSERT TO authenticated");
    expect(normalized).not.toContain("FOR UPDATE TO authenticated");
  });
});
