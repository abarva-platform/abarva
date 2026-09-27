import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

/**
 * `src/components/programs/origination/__tests__` holds six suites. On
 * `abf5bb5e3` FIVE of them ran in no workflow, and the coverage census ranked
 * the directory #1 by untriaged unrun tests among governed-risk directories:
 * score 1000, band `critical`, signal `declared_ai_surface_control`, 5
 * untriaged of 5 unrun of 6.
 *
 * The backlog item that asked for this (T-767) said two of three suites were
 * unwired. The directory holds six and five ran nowhere, so the filing
 * undercounted by three — the count here is the census's, not the filing's.
 *
 * What the filing got right is the hazard, and it is the reason this file
 * exists rather than a line in an existing one. `C-544` wired ONE suite
 * (`ProgramBriefPanel.controls.test.tsx`) into
 * `ai-surface-control-catalog.yml`, and the ratchet required the directory's
 * line to leave `product-directory-ci-coverage.baseline.json` in the same
 * change, because that baseline is a set of FULLY DARK directories and this one
 * was no longer fully dark. So the honest transition was `uncovered` →
 * `partial`, and `partial` is the quieter of the two states: a directory absent
 * from the dark baseline no longer draws the ratchet's attention, while five of
 * its six suites still ran nowhere.
 *
 * These cases hold the repair against sliding back to that quieter state:
 *
 *   1. every suite in the directory is reached, proved through the census's own
 *      four-hop resolver (workflow → npm script → node script → jest) rather
 *      than by searching a workflow file for a string — the C-537 lesson is
 *      that a `grep` of a workflow is not evidence a runner executed anything;
 *   2. the directory is named LITERALLY in a jest command, so the CI-visibility
 *      gate registers an owner for it and not merely the runner reaches it; and
 *   3. the directory is NOT back in the dark baseline. The item said so
 *      explicitly and it is right: restoring the old warning by re-declaring a
 *      partial directory as fully dark would make the baseline lie about the
 *      five suites this change wired.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const DIRECTORY = "src/components/programs/origination/__tests__";
const WIRING_WORKFLOW = ".github/workflows/unit-suites.yml";
const DARK_BASELINE =
  "src/__tests__/behaviors/product-directory-ci-coverage.baseline.json";

/**
 * A floor, not the exact figure. Six suites are here today; a seventh written
 * tomorrow is covered the day it lands because the workflow names the
 * DIRECTORY, so a case that pinned the count exactly would fail the pull
 * request that adds one and teach the next author to raise a number instead of
 * reading it.
 *
 * The floor is what stops "absent from both of the census's gap lists" from
 * reading as success after a rename or a deletion: an empty directory is
 * absent from them in exactly the same way a fully wired one is.
 */
const MINIMUM_SUITES = 6;

type CensusDirectoryRow = {
  directory: string;
  testFiles: number;
  coveredTestFiles?: number;
  untriagedUnrunTestFiles?: number;
};

type Census = {
  counts: { indeterminateInvocations: number };
  partiallyCoveredDirectories: CensusDirectoryRow[];
  uncoveredDirectories: CensusDirectoryRow[];
  governedRiskRanking: { directory: string }[];
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

describe("the Programs origination component suite directory a workflow actually reaches", () => {
  it("resolves every jest invocation to literal paths, so the coverage answer is not a guess", () => {
    // While any invocation is unresolved the census's covered count is an upper
    // bound, and every case below would be reading that guess as a fact.
    expect(census.counts.indeterminateInvocations).toBe(0);
  });

  it("holds the directory's suite count off disk, so the cases below cannot pass vacuously", () => {
    expect(testFilesDirectlyIn(DIRECTORY).length).toBeGreaterThanOrEqual(
      MINIMUM_SUITES,
    );
  });

  it("reaches every suite in the directory, not the one C-544 named individually", () => {
    const partial = census.partiallyCoveredDirectories.find(
      (row) => row.directory === DIRECTORY,
    );
    const uncovered = census.uncoveredDirectories.find(
      (row) => row.directory === DIRECTORY,
    );

    // Reported as the census phrases it rather than as two booleans, so a
    // failure prints WHICH state the directory fell back to and how far. The
    // measured `partial` row on `abf5bb5e3` was `1 of 6`; that is the exact
    // shape this case refuses.
    expect({
      partiallyCovered: partial
        ? `${partial.coveredTestFiles} of ${partial.testFiles}`
        : null,
      uncovered: uncovered ? `0 of ${uncovered.testFiles}` : null,
    }).toEqual({ partiallyCovered: null, uncovered: null });
  });

  it("leaves the directory off the governed-risk ranking, which is the queue that mis-ranks when it lingers", () => {
    // The ranking is the input to which directory gets wired next. This
    // directory sat at rank 1 with score 1000 while it was partial; a row here
    // again means suites in it stopped running, whatever the totals say.
    expect(
      census.governedRiskRanking.filter((row) => row.directory === DIRECTORY),
    ).toEqual([]);
  });

  it("names the directory literally in a jest command, so the CI-visibility gate can see it too", () => {
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
        `(?:^|[\\s"'\`=])${DIRECTORY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[\\s"'\`])`,
      ).test(command),
    );
    expect(named.length).toBeGreaterThan(0);

    // And it is this workflow that carries it, so the step cannot quietly move
    // into a job that does not run on a pull request. A trailing slash would
    // stop the visibility gate matching, so the pattern refuses one here too.
    const workflow = readFileSync(path.join(repoRoot, WIRING_WORKFLOW), "utf8");
    expect(workflow).toMatch(
      new RegExp(`jest\\s+${DIRECTORY.replace(/[/]/g, "\\/")}(?=\\s|$)`, "m"),
    );
  });

  it("records every extra path the directory pattern also selects", () => {
    // A jest path argument is a regex tested against the full path, so naming
    // `…/origination/__tests__` would also select a sibling whose name merely
    // starts with it — `__tests__-legacy`, say. There is none today and this
    // case is what keeps that true: a new one has been measured by nobody.
    const parent = DIRECTORY.slice(0, DIRECTORY.lastIndexOf("/"));
    const base = DIRECTORY.slice(DIRECTORY.lastIndexOf("/") + 1);
    const siblings = readdirSync(path.join(repoRoot, parent)).filter(
      (entry) => entry.startsWith(base) && entry !== base,
    );
    expect(siblings).toEqual([]);
  });

  it("keeps the directory out of the fully-dark baseline, which is what the item asked for by name", () => {
    // The tempting repair for "a partial directory draws no warning" is to put
    // its line back and get the old one. That baseline declares directories
    // whose every suite runs nowhere; five of these six now run, so a line here
    // would assert something false about them. The refusal is the point.
    const baseline = readFileSync(
      path.join(repoRoot, DARK_BASELINE),
      "utf8",
    );
    const declared = JSON.parse(baseline) as unknown;
    expect(JSON.stringify(declared)).not.toContain(DIRECTORY);
  });
});
