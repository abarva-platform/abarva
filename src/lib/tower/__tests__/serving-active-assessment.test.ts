/**
 * The reader must pick the same assessment the serving layer would.
 *
 * `serving.tower_active_assessment_keys()` orders candidates by build priority, projection version,
 * then `created_at desc` — newest load wins — with `assessment_id` only as a last-resort tiebreak.
 * Every `serving.tower_*` view joins it, so in a healthy database the rows arrive pre-filtered.
 *
 * The reader keeps its own selection as a defence for databases where that join is not in place.
 * That defence previously omitted the recency term and fell through to `assessment_id.localeCompare`,
 * which meant a superseded assessment could beat a newer one on alphabetical order alone. Two
 * places deciding one fact, and the weaker copy deciding what a CXO sees.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const READER = fs.readFileSync(
  path.resolve(__dirname, "../readTowerCommandCenter.ts"),
  "utf-8",
);

const MIGRATION = fs.readFileSync(
  path.resolve(
    __dirname,
    "../../../../supabase/migrations/20260829113000_tower_active_layer4_serving_views.sql",
  ),
  "utf-8",
);

function sqlRankingBlock(): string {
  return MIGRATION.slice(
    MIGRATION.indexOf("function serving.tower_active_assessment_keys"),
    MIGRATION.indexOf("function serving.tower_command_rows"),
  );
}

function readerRankingBlock(): string {
  return READER.slice(
    READER.indexOf("function activeServingIdentity("),
    READER.indexOf("function rowsForActiveServingIdentity("),
  );
}

describe("the SQL owns the ranking", () => {
  it("ranks newest load first, with assessment_id only as a tiebreak", () => {
    const fn = sqlRankingBlock();
    expect(fn).toMatch(/candidates\.priority desc/);
    expect(fn).toMatch(/candidates\.projection_version desc/);
    expect(fn).toMatch(/candidates\.created_at desc/);
    expect(fn.indexOf("created_at desc")).toBeLessThan(
      fn.indexOf("assessment_id desc"),
    );
  });

  it("every tower serving view joins the active-assessment filter", () => {
    const joins = MIGRATION.match(
      /join serving\.tower_active_assessment_keys\(\) active/g,
    );
    expect(joins?.length ?? 0).toBeGreaterThan(1);
  });
});

describe("the reader's defence matches it", () => {
  it("includes recency, and orders it ahead of the assessment-id tiebreak", () => {
    const fn = readerRankingBlock();
    expect(fn).toMatch(/b\.createdAt - a\.createdAt/);
    expect(fn.indexOf("b.createdAt - a.createdAt")).toBeLessThan(
      fn.indexOf("localeCompare"),
    );
  });

  it("keeps the same first two terms as the SQL", () => {
    const fn = readerRankingBlock();
    expect(fn.indexOf("b.priority - a.priority")).toBeLessThan(
      fn.indexOf("b.projectionVersion - a.projectionVersion"),
    );
    expect(fn.indexOf("b.projectionVersion - a.projectionVersion")).toBeLessThan(
      fn.indexOf("b.createdAt - a.createdAt"),
    );
  });

  it("reads created_at from the payload, since the view has no such column", () => {
    expect(READER).toMatch(/function servingRowCreatedAt\(row: TowerServingRow\): number/);
    expect(READER).toMatch(/payload\(row\)\.created_at/);
  });

  it("treats an unparsable or absent timestamp as oldest rather than newest", () => {
    const fn = READER.slice(
      READER.indexOf("function servingRowCreatedAt"),
      READER.indexOf("function activeServingIdentity("),
    );
    expect(fn).toMatch(/return 0;/);
    expect(fn).toMatch(/Number\.isFinite\(ms\) \? ms : 0/);
  });
});
