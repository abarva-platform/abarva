/**
 * The integration ROOT carve-out, and why it needs a different control from
 * its siblings.
 *
 * Every other quarantine list in this directory guards a DIRECTORY that a
 * workflow names. There, the default is INCLUDED: a new suite runs the day it
 * lands, and the list only has to explain the exceptions.
 *
 * `src/__tests__/integration` is not named as a directory — that path would
 * also run every red subdirectory under it — so its root-level files are
 * enumerated one by one, by exact path. That inverts the default to EXCLUDED,
 * and an inverted default needs a control the sibling lists never needed: a
 * file that nobody enumerated is silently unrun, and nothing says so.
 *
 * That is not hypothetical. Five root files sat unrun and untriaged while the
 * only record of the carve-out was a workflow comment counting them, and one
 * of the five was red for a content-loss defect on a governed answer surface.
 * A comment that counts exclusions cannot fail. These cases are about the
 * checks that can.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { evaluateRootQuarantine } from "./check-integration-root-quarantine.mjs";

const OK = {
  suite: "example.test.ts",
  failingCase: "Example > does the thing",
  reason: "A reason long enough to carry an argument for its own existence.",
  owner: "26",
  verdict: "update",
};

/** Everything named here exists on disk unless a case says otherwise. */
function evaluate({ unrunPaths = [], entries = [], missing = [], ceiling }) {
  return evaluateRootQuarantine({
    unrunPaths,
    entries,
    exists: (relative) => !missing.includes(relative),
    ceiling: ceiling ?? entries.length,
  });
}

const at = (suite) => `src/__tests__/integration/${suite}`;

test("a clean list, every unrun file declared, reports nothing", () => {
  const { problems } = evaluate({
    unrunPaths: [at("example.test.ts")],
    entries: [OK],
  });
  assert.deepEqual(problems, []);
});

// THE CONTROL THE ENUMERATION LACKS. With the default inverted to excluded,
// this is the only check that can notice a file nobody wired. If it does not
// fail here, the gate is decoration.
test("an unrun root file with no entry FAILS — the inverted default made it silent", () => {
  const { problems } = evaluate({
    unrunPaths: [at("example.test.ts"), at("nobody-wired-me.test.ts")],
    entries: [OK],
    ceiling: 1,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /nobody-wired-me\.test\.ts/);
  assert.match(problems[0], /no workflow runs it/i);
});

test("names the drifted file rather than only counting drift", () => {
  const { problems } = evaluate({
    unrunPaths: [at("a.test.ts"), at("b.test.ts")],
    entries: [],
    ceiling: 0,
  });
  assert.equal(problems.length, 2);
  assert.ok(problems.some((p) => p.includes("a.test.ts")));
  assert.ok(problems.some((p) => p.includes("b.test.ts")));
});

// The opposite direction. An entry that has been wired back in must not stay
// on the list: a carve-out that no longer carves anything out still reads as a
// live exclusion to the next person who counts the list.
test("an entry whose file is now RUN by a workflow FAILS as stale", () => {
  const { problems } = evaluate({
    unrunPaths: [],
    entries: [OK],
    ceiling: 1,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /example\.test\.ts/);
  assert.match(problems[0], /is run by a workflow now/i);
});

test("an entry naming a file that no longer exists FAILS", () => {
  const { problems } = evaluate({
    unrunPaths: [],
    entries: [OK],
    missing: [at("example.test.ts")],
    ceiling: 1,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no longer exists/);
});

test("a duplicated suite FAILS even when both copies are well formed", () => {
  const { problems } = evaluate({
    unrunPaths: [at("example.test.ts")],
    entries: [OK, { ...OK }],
    ceiling: 2,
  });
  assert.ok(problems.some((p) => /more than once/.test(p)));
});

for (const field of ["suite", "failingCase", "reason", "owner", "verdict"]) {
  test(`an entry missing "${field}" FAILS — a bare filename loses the argument for its own existence`, () => {
    const entry = { ...OK };
    delete entry[field];
    const { problems } = evaluate({
      unrunPaths: [at("example.test.ts")],
      entries: [entry],
      ceiling: 1,
    });
    assert.ok(problems.some((p) => /Malformed entry/.test(p)), `no malformed-entry problem for ${field}`);
  });

  test(`an entry whose "${field}" is blank FAILS — whitespace is not a reason`, () => {
    const { problems } = evaluate({
      unrunPaths: [at("example.test.ts")],
      entries: [{ ...OK, [field]: "   " }],
      ceiling: 1,
    });
    assert.ok(problems.some((p) => /Malformed entry/.test(p)), `blank ${field} accepted`);
  });
}

// The triage verdict is the whole point of this list: item 26 asks for each
// stale suite to be recorded as update, delete or real. A free-text verdict
// would let "pending" or "later" sit here and read as a triage that happened.
test("a verdict outside update/delete/real FAILS", () => {
  const { problems } = evaluate({
    unrunPaths: [at("example.test.ts")],
    entries: [{ ...OK, verdict: "pending" }],
    ceiling: 1,
  });
  assert.ok(problems.some((p) => /verdict/.test(p) && /update, delete, real/.test(p)));
});

for (const verdict of ["update", "delete", "real"]) {
  test(`"${verdict}" is accepted`, () => {
    const { problems } = evaluate({
      unrunPaths: [at("example.test.ts")],
      entries: [{ ...OK, verdict }],
      ceiling: 1,
    });
    assert.deepEqual(problems, []);
  });
}

// The ratchet, in both directions. Being UNDER the ceiling fails too, so
// clearing an entry cannot leave silent headroom for the next one.
test("a list longer than the ceiling FAILS", () => {
  const { problems } = evaluate({
    unrunPaths: [at("a.test.ts"), at("b.test.ts")],
    entries: [
      { ...OK, suite: "a.test.ts" },
      { ...OK, suite: "b.test.ts" },
    ],
    ceiling: 1,
  });
  assert.ok(problems.some((p) => /ceiling is 1/.test(p)));
});

test("a list shorter than the ceiling FAILS — headroom is not a ratchet", () => {
  const { problems } = evaluate({
    unrunPaths: [at("a.test.ts")],
    entries: [{ ...OK, suite: "a.test.ts" }],
    ceiling: 3,
  });
  assert.ok(problems.some((p) => /headroom/.test(p)));
});

// A file cannot be both. If it were, the drift check and the stale check would
// disagree about the same path and one of them would be quietly wrong.
test("a suite both enumerated and quarantined cannot pass silently", () => {
  const wired = evaluate({ unrunPaths: [], entries: [OK], ceiling: 1 });
  const declared = evaluate({ unrunPaths: [at("example.test.ts")], entries: [OK], ceiling: 1 });
  assert.equal(wired.problems.length, 1);
  assert.deepEqual(declared.problems, []);
});
