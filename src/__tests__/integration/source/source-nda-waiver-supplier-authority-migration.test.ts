import fs from "node:fs";
import path from "node:path";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260920014000_source_nda_waiver_supplier_authority.sql",
);
const migration = fs.readFileSync(migrationPath, "utf8");
const normalized = migration.replace(/\s+/g, " ");

describe("Source NDA waiver supplier authority migration", () => {
  it("refuses an unresolved supplier identity before adding the constraint", () => {
    expect(normalized).toContain("FROM source_event_nda_waivers waiver");
    expect(normalized).toContain("LEFT JOIN source.vendor vendor");
    expect(normalized).toContain("vendor.tenant_key = waiver.client_key");
    expect(normalized).toContain(
      "vendor.vendor_id = waiver.supplier_legal_entity_id",
    );
    expect(normalized).toContain("WHERE vendor.vendor_id IS NULL");
    expect(normalized).toContain(
      "source_event_nda_waivers contains supplier identities absent from source.vendor",
    );
  });

  it("binds the waiver to the governed tenant-scoped supplier legal entity", () => {
    expect(normalized).toContain(
      "CONSTRAINT source_event_nda_waivers_supplier_fk FOREIGN KEY (client_key, supplier_legal_entity_id) REFERENCES source.vendor(tenant_key, vendor_id)",
    );
  });

  it("does not repair, infer, or seed supplier identity", () => {
    expect(normalized).not.toMatch(/\bUPDATE\s+source_event_nda_waivers\b/i);
    expect(normalized).not.toMatch(/\bINSERT\s+INTO\s+source\.vendor\b/i);
    expect(normalized).not.toContain("supplier_name");
  });
});
