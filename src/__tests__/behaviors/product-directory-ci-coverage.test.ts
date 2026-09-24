import { execFileSync } from "node:child_process";
import path from "node:path";

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
 * lower the number below, which is the point.
 *
 * THE ASSERTION IS EQUALITY, deliberately. Being under the ceiling must fail
 * as loudly as being over: a silent decrease means someone wired a directory
 * and left the recorded figure lying, and the next person to add a dark
 * directory would be measured against a ceiling with room in it.
 */
const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const GOVERNED_ELSEWHERE = "src/__tests__";

/**
 * Measured from the census's own resolver.
 *
 * Lower it when you wire a directory. Do not raise it: a new dark directory is
 * what this exists to refuse.
 *
 * 2026-09-21: 175 when this ratchet was introduced.
 * 2026-09-21: 172 after wiring `source/archetypes`, `programs/archetype-primers`
 *   and `source/canvas-substrate`. Three, not four: the fourth directory wired
 *   in that change (`source/ava`) was already partially covered, so clearing
 *   its last unrun file moved it out of the partial set without changing this
 *   count.
 * 2026-09-24: 171 after T-754 wired five of the eight suites T-475 verdicted
 *   `wire_into_ci`. One, not two: `source/candidate-suppliers/__tests__` was
 *   0 of 3 covered and is now 3 of 3, which is the decrease. The other
 *   directory the same step clears, `data-plane/__tests__`, was already 1 of 3
 *   and moved out of the PARTIAL set — the `source/ava` case above, again.
 */
const DARK_PRODUCT_DIRECTORY_COUNT = 171;

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
    // uncovered list is an upper bound and the count below is a guess. The
    // sibling guard makes the same check for the same reason.
    expect(census.counts.indeterminateInvocations).toBe(0);
  });

  it("is measuring a real and substantial set", () => {
    // Vacuity floor. If the filter ever matched nothing — a renamed root, a
    // changed census shape — the equality below would pass at zero and this
    // file would be decoration.
    expect(darkProductDirectories.length).toBeGreaterThan(50);
    expect(
      darkProductDirectories.every((d) => d.startsWith("src/")),
    ).toBe(true);
  });

  it("does not let a new dark directory appear under src/app or src/lib", () => {
    // Equality, not an upper bound. See the header: a decrease left unrecorded
    // hands the next dark directory a ceiling with room in it.
    expect(darkProductDirectories.length).toBe(DARK_PRODUCT_DIRECTORY_COUNT);
  });
});
