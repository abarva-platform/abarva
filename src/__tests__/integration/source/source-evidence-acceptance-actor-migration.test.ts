import fs from "node:fs";
import path from "node:path";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8").replace(/\s+/g, " ");

const migration = read(
  "supabase/migrations/20261005150000_source_evidence_acceptance_actor.sql",
);
const reviewRoute = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/api/v1/source/[eventId]/evidence/[requirementId]/review/route.ts",
  ),
  "utf8",
);
const types = fs.readFileSync(
  path.join(process.cwd(), "src/lib/source/canvas-substrate/types.ts"),
  "utf8",
);

describe("Source evidence acceptance actor", () => {
  it("adds the actor columns to the evidence state table", () => {
    expect(migration).toContain("ALTER TABLE source_event_evidence_states");
    for (const column of [
      "accepted_by_user_id TEXT NULL",
      "accepted_by_name TEXT NULL",
      "accepted_at TIMESTAMPTZ NULL",
    ]) {
      expect(migration).toContain(`ADD COLUMN IF NOT EXISTS ${column}`);
    }
  });

  // The columns are deliberately unconstrained. Several paths raise evidence
  // state and only one sets the actor; a CHECK would make the others fail at
  // the database. If this assertion is ever removed, the change that removes it
  // must also update every writer.
  it("adds no constraint that an unupdated writer would violate", () => {
    // Scoped to the ALTER statement. "NOT NULL" also appears in the partial
    // index predicate `WHERE accepted_by_user_id IS NOT NULL`, which is a
    // filter, not a constraint — a migration-wide assertion would fail on it.
    const alter = migration.slice(
      migration.indexOf("ALTER TABLE source_event_evidence_states"),
      migration.indexOf("COMMENT ON COLUMN"),
    );
    expect(alter).not.toContain("NOT NULL");
    expect(alter).not.toContain("CHECK (");
    // Control: the slice is the real ALTER, so the assertions cannot pass on
    // an empty string.
    expect(alter).toContain("accepted_by_user_id");
  });

  it("indexes the rows that carry an acceptor, since that is the gate's query", () => {
    expect(migration).toContain(
      "CREATE INDEX IF NOT EXISTS source_event_evidence_states_accepted_idx",
    );
    expect(migration).toContain("WHERE accepted_by_user_id IS NOT NULL");
  });

  it("records the reviewer on the row, not only in the activity log", () => {
    const update = reviewRoute.slice(
      reviewRoute.indexOf(".update({"),
      reviewRoute.indexOf(".eq(\"id\", existing.id)"),
    );
    expect(update).toContain("accepted_by_user_id");
    expect(update).toContain("accepted_by_name");
    expect(update).toContain("accepted_at");
    // Control: the slice really is the update payload, so the assertions above
    // cannot pass against an empty string.
    expect(update).toContain("current_state: target.targetState");
  });

  it("surfaces the actor through the row type and the view mapper", () => {
    expect(types).toContain("accepted_by_user_id?: string | null;");
    expect(types).toContain("acceptedByUserId?: string | null;");
    expect(types).toContain("acceptedByUserId: row.accepted_by_user_id ?? null,");
  });

  it("documents that a null acceptor is unknown rather than unaccepted", () => {
    expect(migration).toContain(
      "Null means nobody is recorded, which is different from nobody having decided",
    );
    expect(types).toContain('A caller must not infer "unaccepted" from null.');
  });
});
