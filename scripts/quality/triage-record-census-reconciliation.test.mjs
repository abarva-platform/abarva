import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reconcile, verdictsByPath } from "./triage-record-census-reconciliation.mjs";
import { buildCensus } from "./test-ci-coverage-census.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");

test("per-file statuses are off by default and reconcile with the published counts", () => {
  assert.equal(buildCensus(repo).fileStatuses, undefined);
  const census = buildCensus(repo, { includeFileStatuses: true });
  // Two independent computations of the same fact: the flat per-file flags,
  // and the aggregate the census publishes. The whole measurement below rests
  // on them agreeing, so it is asserted rather than assumed.
  assert.equal(census.fileStatuses.length, census.counts.testFiles);
  assert.equal(
    census.fileStatuses.filter((file) => file.untriaged).length,
    census.counts.untriagedUnrunTestFiles,
  );
  assert.equal(
    census.fileStatuses.filter((file) => file.declaredQuarantine).length,
    census.counts.declaredQuarantineTestFiles,
  );
});

test("the real repository's reconciliation adds up", () => {
  const report = reconcile(repo);
  assert.equal(
    report.untriagedWithVerdict.length + report.untriagedWithoutVerdict,
    report.untriagedUnrunTestFiles,
  );
  // The held suites this change declared are credited, so they are NOT in the
  // untriaged half any more. That is the one number T-763 moved.
  assert.equal(report.creditedAndVerdicted.length, 3);
  for (const row of report.untriagedWithVerdict) {
    assert.ok(
      row.verdicts.every((verdict) => verdict.verdict !== "held_unwired"),
      `${row.testPath} is held but still reads as untriaged`,
    );
  }
});

test("a verdict naming a file the census does not walk is reported, not dropped", () => {
  const root = mkdtempSync(path.join(tmpdir(), "triage-reconcile-"));
  try {
    mkdirSync(path.join(root, "docs/architecture"), { recursive: true });
    writeFileSync(
      path.join(root, "docs/architecture/fixture-triage.json"),
      JSON.stringify({
        suites: [
          { path: "src/lib/gone/__tests__/gone.test.ts", verdict: "repair", ownerItem: "T-1" },
        ],
      }),
    );
    const byPath = verdictsByPath(root);
    assert.deepEqual(
      [...byPath.keys()],
      ["src/lib/gone/__tests__/gone.test.ts"],
    );
    assert.equal(byPath.get("src/lib/gone/__tests__/gone.test.ts")[0].verdict, "repair");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a record with no suites array contributes nothing rather than throwing", () => {
  const root = mkdtempSync(path.join(tmpdir(), "triage-reconcile-"));
  try {
    mkdirSync(path.join(root, "docs/architecture"), { recursive: true });
    writeFileSync(
      path.join(root, "docs/architecture/empty-triage.json"),
      JSON.stringify({ scope: "src/lib/nothing", excludedFailures: [] }),
    );
    writeFileSync(path.join(root, "docs/architecture/broken-triage.json"), "{ not json");
    assert.equal(verdictsByPath(root).size, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
