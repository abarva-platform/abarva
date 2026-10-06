import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20261006193500_source_nda_template_event_canonical_fk.sql"),
  "utf8",
);

it("keeps event ownership enforced while matching legacy event keys to canonical template keys", () => {
  expect(migration).toMatch(
    /canonical_client_key\s+TEXT\s+GENERATED\s+ALWAYS\s+AS\s*\(\s*canonical_tenant_key\(client_key\)\s*\)\s+STORED/i,
  );
  expect(migration).toMatch(/UNIQUE\s*\(\s*id\s*,\s*canonical_client_key\s*\)/i);
  expect(migration).toMatch(
    /FOREIGN\s+KEY\s*\(\s*source_event_id\s*,\s*client_key\s*\)\s*REFERENCES\s+source_events\s*\(\s*id\s*,\s*canonical_client_key\s*\)/i,
  );
  expect(migration).not.toMatch(/DISABLE\s+TRIGGER|DROP\s+POLICY|DISABLE\s+ROW\s+LEVEL\s+SECURITY/i);
});
