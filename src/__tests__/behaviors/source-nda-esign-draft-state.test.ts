import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20261003160000_source_nda_esign_draft_state.sql"),
  "utf8",
);

describe("Source NDA envelope draft-state migration", () => {
  it("keeps a new draft unsent and blocks direct-sent inserts", () => {
    expect(migration).toMatch(/status IN \('created', 'sent', 'viewed', 'completed', 'declined'\)/);
    expect(migration).toMatch(/status = 'created' AND sent_at IS NULL/);
    expect(migration).toMatch(/IF NEW\.status <> 'created' OR NEW\.sent_at IS NOT NULL THEN/);
  });

  it("binds the exact published document and accepted event candidate at draft and send", () => {
    expect(migration.match(/template\.content_sha256 = NEW\.document_sha256/g)).toHaveLength(2);
    expect(migration.match(/template\.publication_state = 'published'/g)).toHaveLength(2);
    expect(migration.match(/candidate\.authority_state = 'accepted'/g)).toHaveLength(2);
    expect(migration).toMatch(/NEW\.status = 'sent' AND NEW\.sent_at IS NOT NULL/);
    expect(migration).toMatch(/NEW\.document_sha256 IS DISTINCT FROM OLD\.document_sha256/);
  });
});
