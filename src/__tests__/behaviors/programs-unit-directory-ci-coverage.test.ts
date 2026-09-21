import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

/**
 * `src/lib/programs/__tests__` holds 85 suites. Six of them ran in CI, because
 * six were named one file at a time as each became somebody's item; the other
 * 79 ran nowhere. One of those 79 had been failing since 2026-08-06 and nothing
 * in the repository could say so.
 *
 * File-by-file wiring is the shape of the defect, not the fix for it. A
 * directory named once covers every suite in it including the ones not written
 * yet, and the sibling `src/lib/agent/tools/__tests__` was already wired that
 * way — so the question this item asked was which shape this directory takes,
 * and the answer is the sibling's.
 *
 * These cases hold two things:
 *
 *   1. the directory really is reached, proved through the census's own
 *      four-hop resolver (workflow → npm script → node script → jest) rather
 *      than by searching a workflow file for a string. A wrapper that shells
 *      out to jest satisfies a string search and proves nothing; and
 *   2. no NEW dark directory joins the 38 that still run nowhere under
 *      `src/lib/programs`. A ratchet, not a floor: wiring one of the 38 is
 *      always allowed, and lowering the number is part of doing it.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const PROGRAMS_ROOT = "src/lib/programs";
const WIRING_WORKFLOW = ".github/workflows/ai-surface-control-catalog.yml";

/**
 * Every directory under `src/lib/programs` a workflow names literally, with a
 * floor under each one's suite count. The floor is what stops "absent from
 * both of the census's gap lists" from reading as success after a rename or a
 * deletion — an empty directory is covered in exactly the same way a wired one
 * is.
 *
 * `phase-templates/__tests__` joined on 19 Sep as the first of the 38 that ran
 * nowhere. It was the highest governed risk of them — score 100, band
 * `critical`, signal `approval_or_lifecycle_write` — and, unlike the directory
 * above it, it was GREEN when it was measured: 10 suites, 63 tests, 0.5s.
 * Wiring it buys the future rather than repairing the past, which is the only
 * honest claim available for a green directory.
 *
 * It is also not coverage of nothing: eleven of the thirteen modules beside
 * those suites are imported from outside the directory, and the barrel is
 * imported by two live API routes. A directory whose only importer is its own
 * test file would be a reason to delete it, not to wire it.
 *
 * `board-artifacts/__tests__` joined on 19 Sep as the second, and it is the
 * first taken because it was RED rather than because it ranked. Two of its
 * suites were failing where no workflow could report them, and both asserted
 * tenancy behaviour. Neither turned out to be a product defect: each pinned a
 * literal that a deliberate change had moved, so both are repaired by deriving
 * the expectation from the authority the code consults. All five modules beside
 * those suites are imported from outside the directory — the route guard by
 * eight callers — so the same "not coverage of nothing" test is met. A suite
 * that had been sitting loose in the parent directory moved in rather than the
 * command widening to the parent, which is what keeps the case below honest.
 */
const WIRED_DIRECTORIES = [
  { directory: `${PROGRAMS_ROOT}/__tests__`, minimumSuites: 80 },
  {
    directory: `${PROGRAMS_ROOT}/phase-templates/__tests__`,
    minimumSuites: 10,
  },
  {
    directory: `${PROGRAMS_ROOT}/board-artifacts/__tests__`,
    minimumSuites: 4,
  },
] as const;

/**
 * Directories under `src/lib/programs` that a workflow reaches for none of
 * their suites, measured on `fbe56c123` through the census resolver: 38
 * directories holding 168 test files, on top of the 79 this change wires. They
 * are held as a COUNT rather than a list on purpose — two hand-maintained
 * copies of one contract is a second place to forget (backlog T-053) — and the
 * count is exact in both directions, so wiring one of them fails this case
 * until the number comes down with it.
 *
 * 37 → 35 on 19 Sep for wiring ONE directory, and the discrepancy is the point.
 * Wiring `board-artifacts/__tests__` accounts for one. The second is
 * `board-artifacts` itself: its only test file was the loose one, so moving
 * that file into `__tests__` left the parent holding no test file at all and it
 * dropped off the census. One directory was covered and one stopped existing as
 * a test directory — different things, and this case reported the difference
 * rather than accepting the number that was expected.
 *
 * 35 → 26 on 20 Sep for wiring `src/lib/programs/expert-kernel`. Here the
 * arithmetic does reconcile exactly, and it was checked rather than assumed:
 * all nine directories that left the uncovered set under this root are
 * `expert-kernel` rows — the tree's own `__tests__` plus eight nested ones —
 * and none of them stopped existing. One command reaches all nine because it
 * names the parent; the count moved by nine because nine rows were covered.
 *
 * 26 → 22 on 20 Sep for wiring `phase-packs`, `discovery` and `exports`.
 * Three tree names, four directories: `exports` carries a nested
 * `renderers/__tests__`, which is the same "the tree is bigger than the row"
 * shape as the entry above. Checked, not inferred — the four were read off the
 * set of directories that left the uncovered set, and each is a descendant of
 * one of the three names.
 *
 * 22 → 21 on 21 Sep for `archetypes/__tests__`, and this one is a PARTIAL wire,
 * which no entry above is. Three of its four suites are owned; the fourth,
 * `resolver.test.ts`, is red on a real registry-vs-method-library mismatch and
 * remains an exact file-level quarantine, so the directory left the uncovered
 * set by becoming partially covered rather than by being reached in full. The
 * count moved by one and exactly one directory left the set — checked by
 * diffing the two dark lists, not inferred — but a reader comparing this
 * number against "directories now fully wired" would be off by this row.
 * Finishing it means repairing the red, not renaming it; that repair is
 * backlog item T-453.
 */
const DARK_DIRECTORY_COUNT = 21;

type Census = {
  counts: { indeterminateInvocations: number };
  partiallyCoveredDirectories: {
    directory: string;
    testFiles: number;
    coveredTestFiles: number;
  }[];
  uncoveredDirectories: {
    directory: string;
    testFiles: number;
    coveredTestFiles: number;
  }[];
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

function testFilesDirectlyIn(relativeDirectory: string): string[] {
  const absolute = path.join(repoRoot, relativeDirectory);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute).filter(
    (entry) =>
      /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry) &&
      statSync(path.join(absolute, entry)).isFile(),
  );
}

function expandedWorkflowCommands(): string[] {
  const workflowDir = path.join(repoRoot, ".github/workflows");
  return expandWorkflowCommands(
    readdirSync(workflowDir)
      .filter((name) => /\.ya?ml$/.test(name))
      .flatMap((name) =>
        extractWorkflowRunCommands(
          readFileSync(path.join(workflowDir, name), "utf8"),
        ),
      ),
    JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"))
      .scripts as Record<string, string>,
  );
}

const census = runCensus();

describe("the Programs unit suite directory a workflow actually reaches", () => {
  it("resolves every jest invocation to literal paths, so the coverage answer is not a guess", () => {
    // While any invocation is unresolved the census's covered count is an upper
    // bound, and every case below would be reading that guess as a fact.
    expect(census.counts.indeterminateInvocations).toBe(0);
  });

  it.each(WIRED_DIRECTORIES)(
    "reaches every suite in $directory, not the ones named individually",
    ({ directory, minimumSuites }) => {
      // Non-vacuous first: if the directory were renamed or emptied, being
      // absent from both of the census's gap lists would otherwise read as
      // success.
      const onDisk = testFilesDirectlyIn(directory);
      expect(onDisk.length).toBeGreaterThanOrEqual(minimumSuites);

      const partial = census.partiallyCoveredDirectories.find(
        (row) => row.directory === directory,
      );
      const uncovered = census.uncoveredDirectories.find(
        (row) => row.directory === directory,
      );

      expect({
        partiallyCovered: partial
          ? `${partial.coveredTestFiles} of ${partial.testFiles}`
          : null,
        uncovered: uncovered ? `0 of ${uncovered.testFiles}` : null,
      }).toEqual({ partiallyCovered: null, uncovered: null });
    },
  );

  it.each(WIRED_DIRECTORIES)(
    "names $directory literally in a jest command, so the CI-visibility gate can see it too",
    ({ directory }) => {
    // The runner and the gate do not share a matching rule. Jest takes a path
    // argument as a regex; the visibility gate registers a suite by its exact
    // path or by an ancestor DIRECTORY it can see named. A command that reached
    // these suites some other way — a glob, a wrapper script, a changed-files
    // list — would run them and still leave every one of them reported as
    // having no CI owner.
      const commands = expandedWorkflowCommands().filter((command) =>
        /\b(?:npx\s+)?(?:jest|vitest|playwright)\b/.test(command),
      );
      const named = commands.filter((command) =>
        new RegExp(
          `(?:^|[\\s"'\`=])${directory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[\\s"'\`])`,
        ).test(command),
      );
      expect(named.length).toBeGreaterThan(0);

      // And it is this workflow that carries it, so the step cannot quietly
      // move into a job that does not run on a pull request.
      const workflow = readFileSync(
        path.join(repoRoot, WIRING_WORKFLOW),
        "utf8",
      );
      expect(workflow).toMatch(
        new RegExp(`jest\\s+${directory.replace(/[/]/g, "\\/")}(?=\\s|$)`),
      );
    },
  );

  it.each(WIRED_DIRECTORIES)(
    "records every extra path the $directory pattern also selects",
    ({ directory }) => {
      // A jest path argument is a regex tested against the full path, so
      // naming `…/programs/__tests__` would also select a sibling whose name
      // merely starts with it — `__tests__-legacy`, say. There is none today
      // and this case is what keeps that true: a new one has been measured by
      // nobody.
      const parent = directory.slice(0, directory.lastIndexOf("/"));
      const base = directory.slice(directory.lastIndexOf("/") + 1);
      const siblings = readdirSync(path.join(repoRoot, parent)).filter(
        (entry) => entry.startsWith(base) && entry !== base,
      );
      expect(siblings).toEqual([]);
    },
  );

  it("holds the count of directories under src/lib/programs that still run nowhere", () => {
    const dark = census.uncoveredDirectories.filter(
      (row) =>
        row.directory === PROGRAMS_ROOT ||
        row.directory.startsWith(`${PROGRAMS_ROOT}/`),
    );
    const darkTestFiles = dark.reduce((total, row) => total + row.testFiles, 0);

    // The file count is reported rather than pinned — adding a suite to an
    // already-dark directory is not a new blind spot, and failing every such
    // pull request would teach people to raise the number rather than read it.
    // It rides in the assertion so a failure prints both figures at once.
    expect({
      directories: dark.length,
      testFilesInThem: darkTestFiles,
    }).toEqual({
      directories: DARK_DIRECTORY_COUNT,
      testFilesInThem: expect.any(Number),
    });
  });
});
