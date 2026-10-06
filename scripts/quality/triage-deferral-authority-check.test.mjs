import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  declaredAuthority,
  auditDeferralAuthority,
} from "./triage-deferral-authority-check.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");

/**
 * A throwaway repo root holding the named triage records and whichever test
 * files they claim as subjects. `records` maps a file name under
 * docs/architecture to its suites array.
 */
function fixture(records, { presentFiles = [] } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "triage-deferral-"));
  mkdirSync(path.join(root, "docs/architecture"), { recursive: true });
  for (const [fileName, suites] of Object.entries(records)) {
    writeFileSync(
      path.join(root, "docs/architecture", fileName),
      typeof suites === "string" ? suites : JSON.stringify({ item: "fixture", suites }),
    );
  }
  for (const file of presentFiles) {
    mkdirSync(path.join(root, path.dirname(file)), { recursive: true });
    writeFileSync(path.join(root, file), "// present\n");
  }
  return root;
}

function withFixture(records, options, assertions) {
  const root = fixture(records, options);
  try {
    assertions(auditDeferralAuthority(root), root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("(a) a deferral naming no authority at all holds its file on nothing", () => {
  withFixture(
    {
      "a-triage.json": [
        { path: "src/held.test.ts", verdict: "already_verdicted_elsewhere" },
      ],
    },
    { presentFiles: ["src/held.test.ts"] },
    (report) => {
      assert.equal(report.unauthorised.length, 1);
      assert.equal(report.unauthorised[0].testPath, "src/held.test.ts");
      assert.equal(report.resolved.length, 0);
      // The hold is the consequence, so the violation has to carry it.
      assert.equal(report.deferralRows.length, 1);
    },
  );
});

test("(b) an ownerItem alone is a complete authority — the item-shaped deferral", () => {
  withFixture(
    {
      "a-triage.json": [
        {
          path: "src/held.test.ts",
          verdict: "already_verdicted_elsewhere",
          ownerItem: "T-775",
        },
      ],
    },
    { presentFiles: ["src/held.test.ts"] },
    (report) => {
      assert.equal(report.unauthorised.length, 0);
      assert.equal(report.resolved.length, 1);
      assert.equal(report.resolved[0].authorityKind, "item");
      // Whether T-775 is still open is not decidable here: the backlog is
      // operator-owned and outside this repository. The gate says so rather
      // than pretending to have checked.
      assert.equal(report.resolved[0].authorityResolvedInRepo, false);
    },
  );
});

test("(c) a blank ownerItem is not an authority", () => {
  withFixture(
    {
      "a-triage.json": [
        {
          path: "src/held.test.ts",
          verdict: "already_verdicted_elsewhere",
          ownerItem: "   ",
        },
      ],
    },
    { presentFiles: ["src/held.test.ts"] },
    (report) => {
      assert.equal(report.unauthorised.length, 1);
      assert.equal(report.resolved.length, 0);
    },
  );
});

test("(d) alreadyVerdictedIn naming a record that does not exist is unresolved", () => {
  withFixture(
    {
      "a-triage.json": [
        {
          path: "src/held.test.ts",
          verdict: "already_verdicted_elsewhere",
          alreadyVerdictedIn: "docs/architecture/gone-triage.json",
          verdictThere: "wire_into_ci",
        },
      ],
    },
    { presentFiles: ["src/held.test.ts"] },
    (report) => {
      assert.equal(report.unresolvedRecord.length, 1);
      assert.equal(
        report.unresolvedRecord[0].authorityRecord,
        "docs/architecture/gone-triage.json",
      );
      assert.equal(report.resolved.length, 0);
    },
  );
});

test("(e) a target record that exists but holds no row for the path is unresolved", () => {
  withFixture(
    {
      "a-triage.json": [
        {
          path: "src/held.test.ts",
          verdict: "already_verdicted_elsewhere",
          alreadyVerdictedIn: "docs/architecture/b-triage.json",
          verdictThere: "wire_into_ci",
        },
      ],
      "b-triage.json": [{ path: "src/other.test.ts", verdict: "wire_into_ci" }],
    },
    { presentFiles: ["src/held.test.ts", "src/other.test.ts"] },
    (report) => {
      assert.equal(report.missingTargetRow.length, 1);
      assert.equal(report.missingTargetRow[0].testPath, "src/held.test.ts");
      assert.equal(report.resolved.length, 0);
    },
  );
});

test("(f) verdictThere disagreeing with what the target record says is a mismatch", () => {
  withFixture(
    {
      "a-triage.json": [
        {
          path: "src/held.test.ts",
          verdict: "already_verdicted_elsewhere",
          alreadyVerdictedIn: "docs/architecture/b-triage.json",
          verdictThere: "wire_into_ci",
        },
      ],
      "b-triage.json": [
        { path: "src/held.test.ts", verdict: "update_with_reason_recorded" },
      ],
    },
    { presentFiles: ["src/held.test.ts"] },
    (report) => {
      assert.equal(report.verdictMismatch.length, 1);
      assert.equal(report.verdictMismatch[0].claimedVerdict, "wire_into_ci");
      assert.equal(
        report.verdictMismatch[0].actualVerdict,
        "update_with_reason_recorded",
      );
      assert.equal(report.resolved.length, 0);
    },
  );
});

test("(g) a target row that ALSO defers is a chain, not a verdict", () => {
  withFixture(
    {
      "a-triage.json": [
        {
          path: "src/held.test.ts",
          verdict: "already_verdicted_elsewhere",
          alreadyVerdictedIn: "docs/architecture/b-triage.json",
          verdictThere: "already_verdicted_elsewhere",
        },
      ],
      "b-triage.json": [
        {
          path: "src/held.test.ts",
          verdict: "already_verdicted_elsewhere",
          ownerItem: "T-775",
        },
      ],
    },
    { presentFiles: ["src/held.test.ts"] },
    (report) => {
      // verdictThere agrees with the target, so a mismatch check alone passes
      // this and the file stays held with no verdict anywhere in the chain.
      assert.equal(report.verdictMismatch.length, 0);
      assert.equal(report.chained.length, 1);
      assert.equal(report.chained[0].record, "docs/architecture/a-triage.json");
      // The far end of the chain is a deferral in its own right and is audited
      // as one: it resolves on its own ownerItem. So the pair is one violation
      // and one pass over the SAME path, which is the shape to expect — not
      // two violations, and not silence.
      assert.equal(report.deferralRows.length, 2);
      assert.equal(report.resolved.length, 1);
      assert.equal(report.resolved[0].record, "docs/architecture/b-triage.json");
    },
  );
});

test("(h) a record referent that resolves and carries the named verdict is authorised", () => {
  withFixture(
    {
      "a-triage.json": [
        {
          path: "src/held.test.ts",
          verdict: "already_verdicted_elsewhere",
          alreadyVerdictedIn: "docs/architecture/b-triage.json",
          verdictThere: "wire_into_ci",
          owningItemThere: "T-557",
        },
      ],
      "b-triage.json": [{ path: "src/held.test.ts", verdict: "wire_into_ci" }],
    },
    { presentFiles: ["src/held.test.ts"] },
    (report) => {
      assert.equal(report.resolved.length, 1);
      assert.equal(report.resolved[0].authorityKind, "record");
      assert.equal(report.resolved[0].authorityResolvedInRepo, true);
      assert.equal(report.unauthorised.length, 0);
      assert.equal(report.unresolvedRecord.length, 0);
      assert.equal(report.missingTargetRow.length, 0);
      assert.equal(report.verdictMismatch.length, 0);
      assert.equal(report.chained.length, 0);
    },
  );
});

test("(i) alreadyVerdictedIn with no verdictThere still has to find a row there", () => {
  withFixture(
    {
      "a-triage.json": [
        {
          path: "src/held.test.ts",
          verdict: "already_verdicted_elsewhere",
          alreadyVerdictedIn: "docs/architecture/b-triage.json",
        },
      ],
      "b-triage.json": [{ path: "src/held.test.ts", verdict: "repair" }],
    },
    { presentFiles: ["src/held.test.ts"] },
    (report) => {
      // Nothing to disagree with, so this resolves — the referent exists and
      // genuinely verdicts the path.
      assert.equal(report.resolved.length, 1);
      assert.equal(report.verdictMismatch.length, 0);
    },
  );
});

test("(j) a row whose SUBJECT is gone belongs to the discharge gate, not this one", () => {
  withFixture(
    {
      "a-triage.json": [
        { path: "src/gone.test.ts", verdict: "already_verdicted_elsewhere" },
      ],
    },
    {},
    (report) => {
      // Disjoint by construction rather than by coincidence: without this the
      // two gates would both fail the same row and each would look like the
      // other's duplicate.
      assert.equal(report.deferralRows.length, 0);
      assert.equal(report.unauthorised.length, 0);
    },
  );
});

test("(k) a verdict that is not a deferral is not audited", () => {
  withFixture(
    {
      "a-triage.json": [
        { path: "src/held.test.ts", verdict: "wire_into_ci" },
        { path: "src/two.test.ts", verdict: "repair", ownerItem: "T-1" },
      ],
    },
    { presentFiles: ["src/held.test.ts", "src/two.test.ts"] },
    (report) => {
      assert.equal(report.deferralRows.length, 0);
      assert.equal(report.resolved.length, 0);
    },
  );
});

test("(l) unreadable JSON and a non-triage file name contribute nothing", () => {
  withFixture(
    {
      "a-triage.json": "{ not json",
      "plain.json": JSON.stringify({
        suites: [
          { path: "src/held.test.ts", verdict: "already_verdicted_elsewhere" },
        ],
      }),
    },
    { presentFiles: ["src/held.test.ts"] },
    (report) => {
      assert.equal(report.deferralRows.length, 0);
      assert.equal(report.unauthorised.length, 0);
    },
  );
});

test("(m) declaredAuthority prefers the record shape and reports which it found", () => {
  assert.equal(declaredAuthority({}), null);
  assert.equal(declaredAuthority({ ownerItem: "" }), null);
  assert.deepEqual(declaredAuthority({ ownerItem: "T-775" }), {
    kind: "item",
    item: "T-775",
    record: null,
    claimedVerdict: null,
  });
  assert.deepEqual(
    declaredAuthority({
      alreadyVerdictedIn: "docs/architecture/b-triage.json",
      verdictThere: "wire_into_ci",
      ownerItem: "T-775",
    }),
    {
      kind: "record",
      item: "T-775",
      record: "docs/architecture/b-triage.json",
      claimedVerdict: "wire_into_ci",
    },
  );
});

test("(n) the real repository holds no deferral on an authority that cannot be resolved", () => {
  const report = auditDeferralAuthority(repo);
  // The point of the gate: measured 2026-10-05, 39 rows defer and every one
  // resolves. Nothing kept them resolving until this ran.
  assert.ok(
    report.deferralRows.length > 0,
    "expected the repository to still hold deferral rows; if this is 0 the gate has lost its subject",
  );
  assert.deepEqual(report.unauthorised, []);
  assert.deepEqual(report.unresolvedRecord, []);
  assert.deepEqual(report.missingTargetRow, []);
  assert.deepEqual(report.verdictMismatch, []);
  assert.deepEqual(report.chained, []);
});
