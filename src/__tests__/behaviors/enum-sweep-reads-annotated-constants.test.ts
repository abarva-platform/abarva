import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  extractColumnDomains,
  runEnumReachabilitySweep,
  scanAnnotatedConstants,
} from "../../../scripts/quality/enum-reachability.mjs";

/**
 * The enum sweep judges vocabularies written as SQL literals. It cannot see
 * one held in a TypeScript constant — and the item-126 defect, after its
 * repair, lives in exactly that shape: `PROMOTED_PATTERN_STATES` reaches the
 * database as `= ANY($4::text[])`, a parameterised comparison with no
 * literal to judge. So the sweep would not have caught the original defect
 * in its current form.
 *
 * Matching a constant to a column needs a convention, and the only safe one
 * is an explicit declaration. The rule that makes it safe is negative: the
 * mapping is **never** guessed from the constant's name. A wrong mapping
 * fails a correct list, which is worse than not checking — it teaches people
 * the check is noise, and the fix they reach for is deleting the annotation.
 *
 * The domains here come from the real migrations, not from a fixture. A
 * vocabulary test whose expected vocabulary was written by the test author
 * proves only that the author agrees with themselves.
 */

const REPO_ROOT = path.resolve(__dirname, "../../..");
const MIGRATIONS = path.join(REPO_ROOT, "supabase/migrations");

// The real constraint: ('draft','pilot','mature','deprecated').
const realDomains = extractColumnDomains(MIGRATIONS);

function scanSource(source: string) {
  return scanAnnotatedConstants(
    ["virtual.ts"],
    () => source,
    realDomains,
  );
}

describe("the enum sweep reads a vocabulary declared in TypeScript", () => {
  it("resolves the real constraint out of the migrations, not out of a fixture", () => {
    // The control for everything below: if this lookup were empty, every
    // case would pass by comparing against nothing.
    const domain =
      realDomains.get("engagement_topics.promotion_state") ??
      [...realDomains.values()].find(
        (d: { table: string; column: string }) =>
          d.column === "promotion_state" && d.table.endsWith("engagement_topics"),
      );

    expect(domain).toBeDefined();
    expect(domain!.values.sort()).toEqual([
      "deprecated",
      "draft",
      "mature",
      "pilot",
    ]);
  });

  it("catches the original item-126 defect, which the SQL sweep cannot see", () => {
    // The whole reason for this feature. Every one of these three states is
    // impossible, so the gate refused every row that could exist.
    const { findings } = scanSource(`
      /**
       * @column engagement_topics.promotion_state
       */
      export const PROMOTED_PATTERN_STATES = ["published", "validated", "active"] as const;
    `);

    expect(findings).toHaveLength(1);
    expect(findings[0].verdict).toBe("UNREACHABLE");
    expect(findings[0].impossible).toEqual(["active", "published", "validated"]);
  });

  it("reports a partly stale list as partial, not as a pass", () => {
    const { findings } = scanSource(`
      /**
       * @column engagement_topics.promotion_state
       */
      export const SOME_STATES = ["pilot", "published"] as const;
    `);

    expect(findings).toHaveLength(1);
    expect(findings[0].verdict).toBe("PARTIAL");
    expect(findings[0].impossible).toEqual(["published"]);
  });

  it("says nothing about a list the column can hold", () => {
    const { findings, counts } = scanSource(`
      /**
       * @column engagement_topics.promotion_state
       */
      export const PROMOTED_PATTERN_STATES = ["pilot", "mature"] as const;
    `);

    expect(findings).toEqual([]);
    expect(counts.resolved).toBe(1);
  });

  it("never guesses the column from the constant's name", () => {
    // The rule that keeps this from being worse than no check. This constant
    // holds impossible values and is named after the column, and it is still
    // not judged — because nothing declared the mapping.
    const { findings, counts } = scanSource(`
      export const PROMOTION_STATE = ["published", "validated"] as const;
      export const promotionStates = ["published"] as const;
    `);

    expect(findings).toEqual([]);
    expect(counts.annotated).toBe(0);
  });

  it("counts an annotation pointing at an unconstrained column without failing", () => {
    // An unconstrained column is a legitimate thing to point at. Failing
    // here would push people to delete the annotation, which is the outcome
    // the convention exists to avoid — so it is counted, not raised.
    const { findings, uncheckable, counts } = scanSource(`
      /**
       * @column engagement_topics.deployment_count
       */
      export const SOMETHING = ["a", "b"] as const;
    `);

    expect(findings).toEqual([]);
    expect(counts.uncheckable).toBe(1);
    expect(uncheckable[0].annotated).toBe("engagement_topics.deployment_count");
  });

  it("puts an annotated defect in the list the sweep actually fails on", () => {
    // The join, proven rather than assumed. The scan can be perfect and the
    // sweep still report nothing if its findings never reach the top-level
    // list CI acts on — a mutation removing that merge survived every other
    // case here, because they all inspected the scan's own output.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "enum-sweep-"));
    fs.writeFileSync(
      path.join(dir, "vocabulary.ts"),
      "/**\n * @column engagement_topics.promotion_state\n */\n" +
        'export const BAD_STATES = ["published", "validated"] as const;\n',
      "utf8",
    );

    try {
      const result = runEnumReachabilitySweep({
        migrationsDir: "supabase/migrations",
        srcDir: dir,
      });

      const unreachable = result.findings.filter(
        (f: { verdict: string }) => f.verdict === "UNREACHABLE",
      );
      expect(unreachable).toHaveLength(1);
      expect(unreachable[0].compared).toEqual(["published", "validated"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("finds the annotated constant in the real repository and clears it", () => {
    // End to end against the actual tree, because a scanner proven only on
    // synthetic strings has not been shown to find anything.
    const result = runEnumReachabilitySweep({
      migrationsDir: "supabase/migrations",
      srcDir: "src",
    });

    expect(result.annotatedConstants.counts.annotated).toBeGreaterThanOrEqual(1);
    expect(result.annotatedConstants.counts.resolved).toBeGreaterThanOrEqual(1);
    expect(result.annotatedConstants.findings).toEqual([]);
  });
});
