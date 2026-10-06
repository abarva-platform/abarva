import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateSourceWorkspaceQuarantine,
  evaluateRealRepository,
  heldUnwiredVerdicts,
  SCOPE,
} from "./check-source-workspace-quarantine.mjs";
import { buildCensus } from "./test-ci-coverage-census.mjs";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const listPath = path.join(here, "source-workspace-quarantine.json");
const LIST_RELATIVE = "scripts/quality/source-workspace-quarantine.json";

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

/**
 * A scratch root that is the real repository everywhere except one file.
 *
 * WHY A ROOT AND NOT A SECOND `--list` OVERRIDE (item T-490). `T-488` closed the
 * same hazard on the sibling list by teaching its checker `--list <path>`. That
 * was the right shape there because the thing under test READ the list. Here the
 * thing under test is the census, and `buildCensus(root)` already takes its root
 * — so the acceptance's instruction to check before adding a flag holds: there is
 * nothing to add. An override that can redirect a control has to be kept honest
 * for as long as it exists, and this needs none.
 *
 * WHY SYMLINKS AND NOT A COPY. The point of driving the real tree was never the
 * bytes of the list; it was that the census resolves the REAL held files, so the
 * measurement says the census credits THESE suites rather than suites shaped like
 * them. Linking every top-level entry keeps exactly that and costs nothing: the
 * census reads `package.json`, `src`, `.github/workflows`, `docs/architecture`
 * and the script paths its commands name, and `readdirSync` follows a symlinked
 * directory, so each of those reads lands on the real tree. Only the spine down
 * to the shadowed file is rebuilt as real directories with linked children.
 *
 * The faithfulness of that is asserted rather than argued: the case below drives
 * the census over an overlay holding the list UNCHANGED and requires the same
 * number the real root gives. An overlay that diverged would make every delta
 * measured on it a fiction, so it is checked in the same run that uses it.
 */
const SCRATCH_BASE = tmpdir();

function overlayRootShadowing(repository, relativeFile, contents) {
  // Deliberately outside the repository, for `T-488`'s reason: a scratch copy
  // inside `scripts/quality/` would be swept up by the very reading this exists
  // to keep clean. Asserted, so a future edit cannot quietly move it back — and
  // asserted BEFORE the directory is made, not after. Checking afterwards
  // orphaned the directory it had just created on the one path where the check
  // fires, which is a write into the tree left behind by the assertion meant to
  // prevent writes into the tree.
  assert.equal(
    path.relative(repository, SCRATCH_BASE).startsWith(".."),
    true,
    "the scratch root must live outside the repository, or the census reads it too",
  );
  const root = mkdtempSync(path.join(SCRATCH_BASE, "source-workspace-census-"));
  const segments = relativeFile.split("/");
  for (const entry of readdirSync(repository)) {
    if (entry === ".git" || entry === segments[0]) continue;
    symlinkSync(path.join(repository, entry), path.join(root, entry));
  }
  let walked = "";
  for (let index = 0; index < segments.length - 1; index += 1) {
    walked = walked ? `${walked}/${segments[index]}` : segments[index];
    mkdirSync(path.join(root, walked));
    for (const entry of readdirSync(path.join(repository, walked))) {
      if (entry === segments[index + 1]) continue;
      symlinkSync(
        path.join(repository, walked, entry),
        path.join(root, walked, entry),
      );
    }
  }
  writeFileSync(path.join(root, relativeFile), contents);
  return root;
}

/**
 * The one census-driving measurement in this suite, with the committed list's
 * mtime observed around it.
 *
 * The observation lives HERE rather than in the case that asserts on it. A case
 * that took its own `before` reading would be vacuous whenever another case had
 * already triggered the measurement: the write it is looking for would be in the
 * past by the time it looked. Taken around the single real invocation, the
 * reading is the same whichever case runs first.
 *
 * mtime and not bytes. A write-then-restore leaves the file byte-identical —
 * measured on `87785644b`, sha256 `76dc8989…` on both sides while the mtime
 * moved — so every content comparison, `git status` included, is blind to it.
 * That blindness is why the same defect survived in two suites at once.
 */
let measurement = null;
function censusMeasurement() {
  if (measurement) return measurement;
  const original = readFileSync(listPath, "utf8");
  const parsed = JSON.parse(original);
  const dropped = parsed.quarantined.slice(1);
  const reducedList = `${JSON.stringify({ ...parsed, ceiling: dropped.length, quarantined: dropped }, null, 2)}\n`;

  const before = statSync(listPath).mtimeMs;
  const unchanged = overlayRootShadowing(repo, LIST_RELATIVE, original);
  const reduced = overlayRootShadowing(repo, LIST_RELATIVE, reducedList);
  try {
    measurement = {
      onTheRealRoot: buildCensus(repo).counts.untriagedUnrunTestFiles,
      withList: buildCensus(unchanged).counts.untriagedUnrunTestFiles,
      withoutOne: buildCensus(reduced).counts.untriagedUnrunTestFiles,
      mtimeBefore: before,
      mtimeAfter: statSync(listPath).mtimeMs,
    };
  } finally {
    rmSync(unchanged, { recursive: true, force: true });
    rmSync(reduced, { recursive: true, force: true });
  }
  return measurement;
}

// The regression case for T-490. Roughly thirty-one readers parse
// `scripts/quality/*-quarantine.json`, `test-ci-coverage-census.mjs` among them,
// and this suite used to hold a mutated one on disk for the whole of a census
// run — 9.81 s of the 10.0 s run, measured on `87785644b`. The fix is not a
// shorter hold or a lock: it is that no reader can observe a modified tracked
// file, so the assertion is on the absence of the write.
test("measuring the census writes nothing to the tracked list its readers parse", () => {
  const { mtimeBefore, mtimeAfter } = censusMeasurement();
  assert.equal(
    mtimeAfter,
    mtimeBefore,
    "the committed quarantine list was written during the census measurement. " +
      "A faithful restore is invisible to every content comparison, so this " +
      "asserts mtime: the file must not be touched at all, because ~31 other " +
      "readers of this directory can parse it while it is mutated and a valid " +
      "but wrong list raises no error and fails no gate.",
  );
});

// The measurement is on the REAL held files rather than a fixture. A fixture
// cannot prove the census credits THESE files: it proves the census credits a
// file shaped like them. The overlay keeps that property, and the next case
// proves the overlay keeps it.
test("removing one real entry moves untriagedUnrunTestFiles by exactly one", () => {
  const { withList, withoutOne } = censusMeasurement();
  assert.equal(withoutOne - withList, 1);
});

test("the scratch root is the real repository, so the delta above is not a fixture's", () => {
  const { onTheRealRoot, withList } = censusMeasurement();
  assert.equal(
    withList,
    onTheRealRoot,
    "the overlay root holding an UNCHANGED list gave a different census than " +
      "the repository itself, so it is not a faithful stand-in and every delta " +
      "measured on it describes something other than this tree",
  );
});
