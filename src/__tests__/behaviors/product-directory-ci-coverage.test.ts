import { execFileSync } from "node:child_process";
import path from "node:path";

import DARK_PRODUCT_DIRECTORY_BASELINE from "./product-directory-ci-coverage.baseline.json";
import {
  DARK_DIRECTORY_BASELINE_PATH,
  NO_DRIFT_MESSAGE,
  diffDarkDirectories,
  formatDarkDirectoryDrift,
} from "@/lib/qa/dark-directory-ratchet";

/**
 * No NEW dark test directory outside `src/__tests__`.
 *
 * `unit-directory-ci-coverage.test.ts` already ratchets the dark set, but it
 * is hard-scoped to `src/__tests__`, which is **5 of the 180** directories the
 * census currently reports as uncovered. The other **175** — every
 * `__tests__` directory under `src/app` and `src/lib` — are governed by
 * nothing, so a suite added beside the code it tests is dark on arrival and
 * silent about it.
 *
 * That is not theoretical. Three separate changes on one day added a test
 * directory under `src/app` or `src/lib` that no workflow ran; each was caught
 * only because someone happened to run the census by hand, and one of them
 * reached CI and failed the coverage gate there instead.
 *
 * This is the same ratchet applied to the rest of the tree. It is not a floor:
 * wiring a directory is always allowed and needs no edit here — except to
 * remove its line from the baseline, which is the point.
 *
 * THE ASSERTION IS EQUALITY, deliberately. Being under the ceiling must fail
 * as loudly as being over: a silent decrease means someone wired a directory
 * and left the recorded baseline lying, and the next person to add a dark
 * directory would be measured against a ceiling with room in it.
 *
 * T-491: the baseline is a sorted list of directories rather than a count,
 * and the failure is a set difference rather than two integers. A count
 * cannot tell a wiring from a regression when a change does both — it moves
 * by zero — and that is the case a reviewer would wave through. The diff
 * logic and its failure text live in `@/lib/qa/dark-directory-ratchet` so
 * they can be asserted directly, including in the cancelling direction, by
 * `t491-dark-directory-ratchet-diff.test.ts`.
 */
const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const GOVERNED_ELSEWHERE = "src/__tests__";

/**
 * The baseline lives in `product-directory-ci-coverage.baseline.json`,
 * measured from the census's own resolver.
 *
 * Remove a line when you wire that directory. Do not add one: a new dark
 * directory is what this exists to refuse.
 *
 * 2026-09-21: 175 directories when this ratchet was introduced.
 * 2026-09-21: 172 after wiring `source/archetypes`, `programs/archetype-primers`
 *   and `source/canvas-substrate`. Three, not four: the fourth directory wired
 *   in that change (`source/ava`) was already partially covered, so clearing
 *   its last unrun file moved it out of the partial set without changing this
 *   set.
 * 2026-09-24: 171 after T-754 wired five of the eight suites T-475 verdicted
 *   `wire_into_ci`. One, not two: `source/candidate-suppliers/__tests__` was
 *   0 of 3 covered and is now 3 of 3, which is the decrease. The other
 *   directory the same step clears, `data-plane/__tests__`, was already 1 of 3
 *   and moved out of the PARTIAL set — the `source/ava` case above, again.
 * 2026-09-26: 172 after T-487, and this is the one entry here that is a RISE.
 *   No directory went dark. A bare Jest path argument is a regex and the
 *   census was resolving a ratchet baseline's paths as literal prefixes, so a
 *   baseline naming an app-router group segment credited a directory Jest
 *   cannot select. Correcting the reading made one such directory visible as
 *   what it already was: it has been reached by no gate since that gate
 *   landed. Adding it records a measurement that was wrong, not a regression
 *   that was allowed — the directory is unchanged and unwired, and wiring it
 *   or escaping the baseline path is T-486, which is blocked on a decision
 *   about the failures the escape reveals. The second directory the same
 *   correction moved, `src/app/(maestro)/home/__tests__`, is 2 of 4 and
 *   therefore PARTIAL rather than uncovered, so it does not reach this set —
 *   the `source/ava` and `data-plane` case above, in the other direction.
 * 2026-09-26: 170 after C-532 wired `src/app/api/source/synthesis/__tests__`
 *   and `src/app/api/programs/synthesis/__tests__`. Two, and measured
 *   per-directory rather than inferred from the count: the dark set was
 *   captured from this census on a clean worktree at `origin/main` `92f5836b3`
 *   and on the change, and the set difference is exactly those two leaving
 *   with nothing entering. Both were fully uncovered rather than partial — each
 *   held one unrun file and the wiring names the directory, so both now run
 *   every file they hold — which is why this moves by two and not by one; the
 *   `source/ava` and `data-plane` caveat above does not apply to either.
 *
 *   That measurement cost a clean second worktree and a hand-diff, because
 *   the gate reported `Expected: 172 / Received: 170` and nothing else. It is
 *   the reason the baseline below is now a list: from this entry on, the set
 *   difference is what the gate prints, so the three caveats above are
 *   self-evident from the diff rather than reconstructed in prose.
 */
const DARK_PRODUCT_DIRECTORY_COUNT = DARK_PRODUCT_DIRECTORY_BASELINE.length;

type Census = {
  counts: { indeterminateInvocations: number };
  uncoveredDirectories: { directory: string; testFiles: number }[];
};

function runCensus(): Census {
  const stdout = execFileSync(
    process.execPath,
    [path.join(repoRoot, CENSUS_SCRIPT), "--json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout.slice(stdout.indexOf("{"))) as Census;
}

const census = runCensus();
const darkProductDirectories = census.uncoveredDirectories
  .map((row) => row.directory)
  .filter((directory) => !directory.startsWith(GOVERNED_ELSEWHERE))
  .sort();

describe("dark test directories outside src/__tests__", () => {
  it("resolves coverage through the census rather than reading a workflow file", () => {
    // If the census cannot resolve some jest invocation to literal paths, its
    // uncovered list is an upper bound and the baseline below is a guess. The
    // sibling guard makes the same check for the same reason.
    expect(census.counts.indeterminateInvocations).toBe(0);
  });

  it("is measuring a real and substantial set", () => {
    // Vacuity floor. If the filter ever matched nothing — a renamed root, a
    // changed census shape — the comparison below would pass at zero against
    // an equally empty baseline and this file would be decoration.
    expect(darkProductDirectories.length).toBeGreaterThan(50);
    expect(
      darkProductDirectories.every((d) => d.startsWith("src/")),
    ).toBe(true);
  });

  it("keeps the committed baseline sorted, unique and non-empty", () => {
    // The diff treats both sides as sets, so an unsorted or duplicated
    // baseline would still compare correctly — but it would review badly, and
    // a duplicate is refused rather than collapsed.
    expect(DARK_PRODUCT_DIRECTORY_COUNT).toBeGreaterThan(50);
    expect(new Set(DARK_PRODUCT_DIRECTORY_BASELINE).size).toBe(
      DARK_PRODUCT_DIRECTORY_COUNT,
    );
    expect(DARK_PRODUCT_DIRECTORY_BASELINE).toEqual(
      [...DARK_PRODUCT_DIRECTORY_BASELINE].sort(),
    );
  });

  it("does not let a new dark directory appear under src/app or src/lib", () => {
    // Equality, not an upper bound, and per directory rather than by count.
    // See the header: a decrease left unrecorded hands the next dark
    // directory a ceiling with room in it, and a change that wires two while
    // darkening two moves no count at all.
    //
    // Asserted through the rendered message so that the names of what entered
    // and what left are in the failure text itself, separately, rather than
    // only in a maintainer's head.
    const drift = diffDarkDirectories(
      DARK_PRODUCT_DIRECTORY_BASELINE,
      darkProductDirectories,
    );

    expect(formatDarkDirectoryDrift(drift)).toBe(NO_DRIFT_MESSAGE);
    expect(DARK_DIRECTORY_BASELINE_PATH).toBe(
      "src/__tests__/behaviors/product-directory-ci-coverage.baseline.json",
    );
  });
});
