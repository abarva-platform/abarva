import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The committed coverage census is a derived file refreshed by hand, by a
 * recorded decision: it is a measurement with no failure path, and `--write`
 * belongs to whoever is re-measuring rather than to a PR check.
 *
 * The cost of that choice was invisible. The committed file is the input to
 * which directory gets wired next, so a stale one mis-ranks that queue, and
 * nobody sees the staleness until someone regenerates and finds the rank-1
 * entry inside an 800-line diff. So the census now prints how far the
 * committed file has drifted. It reports; it does not gate — and the
 * measurement below is why it does not gate.
 *
 * **The first version of the drift report was vacuous and printed the opposite
 * of the truth.** It compared `committed.coveredTestFiles` against the same
 * name on the measured object. The counts live under `counts`, so both sides
 * were `undefined`, no difference was found, and it printed "committed census
 * matches this run" against a file that was 43 covered files stale. A report
 * that cannot fail is worse than none, because it is read as assurance.
 *
 * These cases pin the two things that made it wrong: it must read the real
 * fields, and it must say so loudly rather than silently pass when it cannot.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const CENSUS_FILE = "docs/architecture/test-ci-coverage-census.json";

function script(): string {
  return readFileSync(path.join(repoRoot, CENSUS_SCRIPT), "utf8");
}

describe("the coverage census reports its own drift", () => {
  it("compares the fields the committed census actually has", () => {
    const committed = JSON.parse(
      readFileSync(path.join(repoRoot, CENSUS_FILE), "utf8"),
    ) as { counts?: Record<string, unknown> };

    // The shape the comparison depends on. If the census moves its counts,
    // this fails here rather than by silently comparing undefined.
    expect(committed.counts).toBeDefined();
    for (const field of ["testFiles", "coveredTestFiles", "uncoveredTestFiles"]) {
      expect(typeof committed.counts![field]).toBe("number");
    }
  });

  it("reads those counts from the nested object, not the top level", () => {
    const body = script();

    expect(body).toContain("committed?.counts");
    expect(body).toContain("measured?.counts");
  });

  it("refuses to report 'matches' when it cannot read the fields", () => {
    // The specific failure that shipped: missing fields were skipped by a
    // `continue`, which made an unreadable census indistinguishable from a
    // current one.
    const body = script();

    expect(body).toContain("unreadable");
    expect(body).toMatch(/cannot compare/);
    // And the old shape must not come back.
    expect(body).not.toMatch(/if \(typeof before !== "number"[\s\S]*?\) continue;/);
  });

  it("reports drift without failing the run", () => {
    // It is a report by design, and the churn measurement says it must stay
    // one: 403 of 596 commits over fourteen days touched a test file or a
    // workflow, so a check that failed on disagreement would fire on roughly
    // two thirds of pull requests.
    const body = script();

    expect(body).toContain("This is a report, not a gate");
    // No exit path in the drift branch.
    const driftBlock = body.slice(body.indexOf("function describeDrift"));
    expect(driftBlock).not.toMatch(/process\.exit\(\s*1\s*\)/);
  });
});
