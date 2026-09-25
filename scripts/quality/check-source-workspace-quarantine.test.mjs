import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateSourceWorkspaceQuarantine,
  evaluateRealRepository,
  heldUnwiredVerdicts,
  SCOPE,
} from "./check-source-workspace-quarantine.mjs";
import { buildCensus } from "./test-ci-coverage-census.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const listPath = path.join(here, "source-workspace-quarantine.json");

const payload = {
  ceiling: 1,
  scope: SCOPE,
  quarantined: [
    {
      suite: "scanner.test.ts",
      owner: "T-558",
      reason: "Reads source files and asserts substrings of them.",
      heldBecause: "source_text_scanner",
      triageRecord: "docs/architecture/t478-source-workspace-wiring-triage.json",
    },
  ],
};
const verdicts = [
  {
    record: "docs/architecture/t478-source-workspace-wiring-triage.json",
    path: `${SCOPE}/scanner.test.ts`,
    ownerItem: "T-558",
  },
];
const scannerCounts = new Map([
  [`${SCOPE}/scanner.test.ts`, { readFileSyncCount: 1, toContainCount: 4 }],
]);
const options = () => ({
  exists: (file) => file === `${SCOPE}/scanner.test.ts`,
  scannerCountsFor: (file) => scannerCounts.get(file) ?? null,
  heldUnwiredVerdicts: verdicts,
});

test("accepts a held suite that is still a source-text scanner", () => {
  assert.deepEqual(evaluateSourceWorkspaceQuarantine(payload, options()), []);
});

test("fails when a held suite stops being a source-text scanner", () => {
  const problems = evaluateSourceWorkspaceQuarantine(payload, {
    ...options(),
    scannerCountsFor: () => ({ readFileSyncCount: 0, toContainCount: 0 }),
  });
  assert.match(problems.join("\n"), /reason expired/);
});

test("fails a held_unwired verdict that brings no quarantine entry", () => {
  const problems = evaluateSourceWorkspaceQuarantine(
    { ...payload, ceiling: 0, quarantined: [] },
    options(),
  );
  assert.match(problems.join("\n"), /no quarantine entry/);
});

test("fails an entry whose triage verdict has been discharged", () => {
  const problems = evaluateSourceWorkspaceQuarantine(payload, {
    ...options(),
    heldUnwiredVerdicts: [],
  });
  assert.match(problems.join("\n"), /no longer carries a `held_unwired` verdict/);
});

test("fails when the list grows without moving its exact ratchet", () => {
  const problems = evaluateSourceWorkspaceQuarantine(
    { ...payload, quarantined: [...payload.quarantined, payload.quarantined[0]] },
    options(),
  );
  assert.match(problems.join("\n"), /does not match ratchet/);
});

test("the real repository's list is current", () => {
  assert.deepEqual(evaluateRealRepository(), []);
});

test("every held_unwired verdict in the tree is inside this scope", () => {
  const outside = heldUnwiredVerdicts(repo).filter(
    (verdict) => !verdict.path.startsWith(`${SCOPE}/`),
  );
  assert.deepEqual(
    outside,
    [],
    "a held_unwired verdict outside this directory needs its own scoped list; " +
      "this one only speaks for its own scope",
  );
});

// The mutation the item asks for, on the REAL held files rather than a fixture.
// A fixture cannot prove the census credits THESE files: it proves the census
// credits a file shaped like them.
test("removing one real entry moves untriagedUnrunTestFiles by exactly one", () => {
  const original = readFileSync(listPath, "utf8");
  const withList = buildCensus(repo).counts.untriagedUnrunTestFiles;
  const parsed = JSON.parse(original);
  const dropped = parsed.quarantined.slice(1);
  try {
    writeFileSync(
      listPath,
      `${JSON.stringify({ ...parsed, ceiling: dropped.length, quarantined: dropped }, null, 2)}\n`,
    );
    const withoutOne = buildCensus(repo).counts.untriagedUnrunTestFiles;
    assert.equal(withoutOne - withList, 1);
  } finally {
    writeFileSync(listPath, original);
  }
  // The restore is asserted, not assumed. This case is the one thing in the
  // suite that writes to a tracked file, and a `finally` that silently failed
  // would leave the repository mutated and the next run measuring something
  // else.
  assert.equal(readFileSync(listPath, "utf8"), original);
});
