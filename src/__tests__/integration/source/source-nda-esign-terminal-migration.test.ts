import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(join(process.cwd(),
  "supabase/migrations/20261004002000_source_nda_esign_voided_state.sql"), "utf8");

describe("Source NDA terminal envelope migration", () => {
  it("adds a distinct voided terminal state with a timestamp and no completion evidence", () => {
    expect(migration).toContain("ADD COLUMN voided_at TIMESTAMPTZ NULL");
    expect(migration).toMatch(/status IN \('created', 'sent', 'viewed', 'completed', 'declined', 'voided'\)/);
    expect(migration).toContain("status <> 'voided'");
    expect(migration).toContain("voided_at IS NOT NULL");
    expect(migration).toContain("completed_at IS NULL");
    expect(migration).toContain("declined_at IS NULL");
  });

  it("preserves completed and voided rows against late callback rewrites", () => {
    expect(migration).toContain("OLD.status IN ('completed', 'declined', 'voided')");
    expect(migration).toContain("OLD.voided_at IS NOT NULL");
    expect(migration).toContain("NEW.voided_at IS DISTINCT FROM OLD.voided_at");
  });
});
