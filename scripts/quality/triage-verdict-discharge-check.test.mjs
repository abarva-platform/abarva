import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditDischarges, declaredSuccessor } from "./triage-verdict-discharge-check.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");

/** A throwaway repo root holding one triage record and whichever suites it names. */
function fixture(suites, { presentFiles = [], fileName = "x-triage.json" } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "triage-discharge-"));
  mkdirSync(path.join(root, "docs/architecture"), { recursive: true });
  writeFileSync(
    path.join(root, "docs/architecture", fileName),
    JSON.stringify({ item: "fixture", suites }),
  );
  for (const file of presentFiles) {
    mkdirSync(path.join(root, path.dirname(file)), { recursive: true });
    writeFileSync(path.join(root, file), "// present\n");
  }
  return root;
}

function withFixture(suites, options, assertions) {
  const root = fixture(suites, options);
  try {
    assertions(auditDischarges(root), root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("(a) an absent subject declaring no successor is a violation", () => {
  withFixture(
    [{ path: "src/gone.test.ts", verdict: "rewrite_as_behavior", ownerItem: "T-513" }],
    {},
    (report) => {
      assert.equal(report.undeclared.length, 1);
      assert.equal(report.unresolved.length, 0);
      assert.equal(report.undeclared[0].testPath, "src/gone.test.ts");
      // The owner and verdict travel with the violation, because the repair is
      // to record a discharge and whoever reads it needs to know whose it was.
      assert.equal(report.undeclared[0].ownerItem, "T-513");
      assert.equal(report.undeclared[0].verdict, "rewrite_as_behavior");
    },
  );
});

test("(b) a row whose subject still EXISTS is not audited, discharge or not", () => {
  withFixture(
    [{ path: "src/live.test.ts", verdict: "wire_into_ci" }],
    { presentFiles: ["src/live.test.ts"] },
    (report) => {
      // This is the half that keeps the gate off owed work: a live row carries
      // no discharge and must not be asked for one.
      assert.equal(report.absentSubjectRows.length, 0);
      assert.equal(report.undeclared.length, 0);
      assert.equal(report.unresolved.length, 0);
    },
  );
});

test("(c) movedTo.path naming a file that exists discharges the row", () => {
  withFixture(
    [{ path: "src/gone.test.ts", movedTo: { path: "src/new.test.tsx", byItem: "T-513" } }],
    { presentFiles: ["src/new.test.tsx"] },
    (report) => {
      assert.equal(report.undeclared.length, 0);
      assert.equal(report.unresolved.length, 0);
      assert.equal(report.discharged.length, 1);
      assert.equal(report.discharged[0].successorField, "movedTo.path");
    },
  );
});

test("(d) replacedBy as a bare string discharges the row — both spellings count", () => {
  withFixture(
    [{ path: "src/gone.test.ts", verdict: "deleted_and_replaced", replacedBy: "src/new.test.tsx" }],
    { presentFiles: ["src/new.test.tsx"] },
    (report) => {
      assert.equal(report.undeclared.length, 0);
      assert.equal(report.discharged.length, 1);
      assert.equal(report.discharged[0].successorField, "replacedBy");
    },
  );
});

test("(e) a discharge naming a file that is ALSO gone is unresolved, not discharged", () => {
  withFixture(
    [{ path: "src/gone.test.ts", movedTo: { path: "src/also-gone.test.tsx" } }],
    {},
    (report) => {
      // Without this branch a dead row is dischargeable by pointing it at
      // another dead row: the same defect with one extra hop.
      assert.equal(report.undeclared.length, 0);
      assert.equal(report.unresolved.length, 1);
      assert.equal(report.unresolved[0].successor, "src/also-gone.test.tsx");
      assert.equal(report.unresolved[0].successorResolves, false);
      assert.equal(report.discharged.length, 0);
    },
  );
});

test("(f) an empty or blank successor string is not a discharge", () => {
  assert.equal(declaredSuccessor({ movedTo: "" }), null);
  assert.equal(declaredSuccessor({ movedTo: "   " }), null);
  assert.equal(declaredSuccessor({ replacedBy: "" }), null);
  assert.equal(declaredSuccessor({ movedTo: {} }), null);
  assert.equal(declaredSuccessor({}), null);
  withFixture([{ path: "src/gone.test.ts", replacedBy: "  " }], {}, (report) => {
    assert.equal(report.undeclared.length, 1);
  });
});

test("(g) a record with no suites array, or unreadable JSON, contributes nothing", () => {
  const root = mkdtempSync(path.join(tmpdir(), "triage-discharge-"));
  try {
    mkdirSync(path.join(root, "docs/architecture"), { recursive: true });
    writeFileSync(path.join(root, "docs/architecture/a-triage.json"), JSON.stringify({ item: "x" }));
    writeFileSync(path.join(root, "docs/architecture/b-triage.json"), "{ not json");
    const report = auditDischarges(root);
    assert.equal(report.absentSubjectRows.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("(h) a json file whose name does not match the triage pattern is not read", () => {
  withFixture(
    [{ path: "src/gone.test.ts" }],
    { fileName: "unrelated-record.json" },
    (report) => {
      assert.equal(report.absentSubjectRows.length, 0);
    },
  );
});

test("(i) the real repository has no undischarged triage row", () => {
  const report = auditDischarges(repo);
  assert.deepEqual(
    report.undeclared.map((row) => `${row.record} ${row.testPath}`),
    [],
  );
  assert.deepEqual(
    report.unresolved.map((row) => `${row.record} ${row.testPath}`),
    [],
  );
  // The gate would be vacuous if nothing in the tree reached it: assert it is
  // measuring a non-empty population, so deleting the audit cannot read as a pass.
  assert.ok(
    report.discharged.length >= 9,
    `expected at least 9 discharged rows, found ${report.discharged.length}`,
  );
});
