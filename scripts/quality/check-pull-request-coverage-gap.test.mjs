import assert from "node:assert/strict";
import test from "node:test";

import {
  formatVerdict,
  pullRequestCoverageGap,
} from "./check-pull-request-coverage-gap.mjs";

/**
 * Cases are written against the three states a census row can be in, and each
 * asserts the state it is named for ALONE. A fixture that is ambiguous on two
 * fields at once is satisfied by a guard that reads only one of them — the
 * defect recorded against blanket fixtures in this repo — so every row below
 * pins `covered` and `pullRequestCovered` independently.
 */
function row(testPath, covered, pullRequestCovered, via = ["workflow"]) {
  return {
    testPath,
    directory: testPath.split("/").slice(0, -1).join("/"),
    covered,
    pullRequestCovered,
    via,
  };
}

test("the gap is the covered files no pull-request workflow reaches", () => {
  const gap = pullRequestCoverageGap([
    row("src/a/__tests__/a.test.ts", true, false, ["script-file"]),
    row("src/b/__tests__/b.test.ts", true, true),
  ]);

  assert.deepEqual(
    gap.map((entry) => entry.testPath),
    ["src/a/__tests__/a.test.ts"],
  );
  assert.deepEqual(gap[0].via, ["script-file"]);
});

test("a file a pull-request workflow reaches is not in the gap", () => {
  assert.deepEqual(pullRequestCoverageGap([row("src/b.test.ts", true, true)]), []);
});

/**
 * The half that makes the name honest. An UNCOVERED file also has
 * `pullRequestCovered: false`, and a guard written as `!pullRequestCovered`
 * alone would sweep all 164 of them into a gap whose message says they run
 * green after a deploy — which they do not, because they do not run at all.
 * That population is reported by `uncoveredTestFiles` and
 * `untriagedUnrunTestFiles` and is a different defect with a different remedy.
 */
test("an uncovered file is NOT reported here, because it runs nowhere at all", () => {
  assert.deepEqual(
    pullRequestCoverageGap([row("src/c.test.ts", false, false, [])]),
    [],
  );
});

test("a declared quarantine that runs nowhere is not reported here either", () => {
  const quarantined = {
    ...row("src/d.test.ts", false, false, []),
    declaredQuarantine: true,
  };
  assert.deepEqual(pullRequestCoverageGap([quarantined]), []);
});

/**
 * `covered === true` rather than a truthy read: the census publishes `run` and
 * `green` as the STRING "unknown" on every row, so a field compared loosely in
 * this module would be one copy-paste away from treating "unknown" as a yes.
 */
test("a non-boolean covered value is not read as covered", () => {
  assert.deepEqual(
    pullRequestCoverageGap([row("src/e.test.ts", "unknown", false, [])]),
    [],
  );
});

test("a non-boolean pullRequestCovered value is not read as covered", () => {
  const gap = pullRequestCoverageGap([
    row("src/f.test.ts", true, "unknown", ["script-file"]),
  ]);
  assert.deepEqual(
    gap.map((entry) => entry.testPath),
    ["src/f.test.ts"],
  );
});

test("the empty verdict says what was checked, not merely that it passed", () => {
  const text = formatVerdict([]);
  assert.match(text, /pull-request coverage gap: none\./);
  assert.match(text, /pull-request or merge_group workflow/);
});

/**
 * The failing verdict has to name the file. A gate whose message is a count
 * sends the reader back to recomputing the census from unexported internals,
 * which is the state this item was opened against.
 */
test("the failing verdict names every file and how it is reached", () => {
  const text = formatVerdict([
    {
      testPath: "src/lib/ecl/__tests__/product-provider.test.ts",
      directory: "src/lib/ecl/__tests__",
      via: ["script-file"],
    },
  ]);
  assert.match(text, /1 test file\(s\)/);
  assert.match(text, /src\/lib\/ecl\/__tests__\/product-provider\.test\.ts/);
  assert.match(text, /reached via: script-file/);
  assert.match(text, /ADD a pull-request-triggered invocation/);
});

/**
 * The remedy sentence has to forbid the two cheapest ways to get green, because
 * both of them lower the number and the protection together.
 */
test("the failing verdict forbids silencing by deletion", () => {
  const text = formatVerdict([
    { testPath: "src/x.test.ts", directory: "src", via: [] },
  ]);
  assert.match(text, /Do not silence this by deleting the suite/);
  assert.match(text, /removing its pre-deploy invocation/);
  assert.match(text, /\(nothing the census could name\)/);
});
