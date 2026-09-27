import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

/**
 * `src/components/programs/discovery/__tests__` holds three suites and on
 * `6a68c913fd` ALL THREE ran in no workflow. The coverage census ranked the
 * directory #1 by untriaged unrun tests among governed-risk directories:
 * band `critical`, signal `declared_ai_surface_control`, 3 untriaged of 3
 * unrun of 3 — a FULLY dark directory, where `T-767`'s predecessor was partial.
 *
 * It inherited rank 1 the moment `T-767` wired the origination directory. It
 * did not get worse; it stopped being second.
 *
 * All three suites were measured GREEN before anything here was written — 2, 2
 * and 3 cases, 7 in total — so unlike `T-767` this is a wiring job and not a
 * repair. That is a measurement, not an assumption: `T-767`'s directory looked
 * like a wiring job too and held two suites that had been red for weeks where
 * nothing could report it.
 *
 * The triage that decided `wire` rather than `delete` turned on reachability,
 * measured through `scripts/audit/route-reachability-check.mjs` rather than by
 * reading its committed artifact:
 *
 *   * `brief-to-shape.ts` and `DiscoveryCapturePanel.tsx` are reached from
 *     `/programs/new` and `/demo/programs/new` through
 *     `ProgramOriginationWorkspace`, so their suites guard live code.
 *   * `DiscoveryReceiptCard.tsx` is an ORPHAN. Its only importer is
 *     `MoveArtifactUpload.tsx`, which is itself an orphan, so no route reaches
 *     the card. Its suite is still wired — a green, cheap, correct suite over a
 *     presentational card is not worth deleting — but the coverage it buys is
 *     over something no user can see, and that is a separate defect with its own
 *     id rather than a reason to leave this directory dark.
 *
 * The cases below hold the wiring. What they deliberately do NOT do is assert
 * that the card is unreachable: a case pinned to today's orphan set goes RED on
 * the pull request that finally mounts it, which is the one direction this
 * repair must never punish. Case 8 asserts the surviving half instead — that
 * the directory covers at least one route-reachable subject, so the wiring is
 * not coverage over a dead island — and that stays green when the card is
 * mounted.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const REACHABILITY_SCRIPT = "scripts/audit/route-reachability-check.mjs";
const DIRECTORY = "src/components/programs/discovery/__tests__";
const SUBJECT_DIRECTORY = "src/components/programs/discovery";
const WIRING_WORKFLOW = ".github/workflows/unit-suites.yml";
const DARK_BASELINE =
  "src/__tests__/behaviors/product-directory-ci-coverage.baseline.json";

/**
 * A floor, not the exact figure, for the reason `T-767` gives: the workflow
 * names the DIRECTORY, so a fourth suite written here is covered the day it
 * lands, and a case pinning the count exactly would fail that pull request and
 * teach the next author to raise a number instead of reading one.
 *
 * The floor is also what stops "absent from both census gap lists" reading as
 * success after a rename or a deletion. An empty directory is absent from them
 * in exactly the same way a fully wired one is.
 */
const MINIMUM_SUITES = 3;

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

function runJsonScript<T>(relativeScript: string): T {
  const stdout = execFileSync(
    process.execPath,
    [path.join(repoRoot, relativeScript), "--json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout.slice(stdout.indexOf("{"))) as T;
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

function subjectFilesDirectlyIn(relativeDirectory: string): string[] {
  const absolute = path.join(repoRoot, relativeDirectory);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute)
    .filter(
      (entry) =>
        /\.[cm]?[jt]sx?$/.test(entry) &&
        !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry) &&
        statSync(path.join(absolute, entry)).isFile(),
    )
    .map((entry) => `${relativeDirectory}/${entry}`);
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

const census = runJsonScript<Census>(CENSUS_SCRIPT);

describe("the Programs discovery component suite directory a workflow actually reaches", () => {
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

  it("reaches all three suites, where the measured state was 0 of 3", () => {
    const partial = census.partiallyCoveredDirectories.find(
      (row) => row.directory === DIRECTORY,
    );
    const uncovered = census.uncoveredDirectories.find(
      (row) => row.directory === DIRECTORY,
    );

    // Reported as the census phrases it rather than as two booleans, so a
    // failure prints WHICH state the directory fell back to and how far. The
    // measured row on `6a68c913fd` was `uncovered: 0 of 3`; `partial` is the
    // quieter regression and this case refuses both.
    expect({
      partiallyCovered: partial
        ? `${partial.coveredTestFiles} of ${partial.testFiles}`
        : null,
      uncovered: uncovered ? `0 of ${uncovered.testFiles}` : null,
    }).toEqual({ partiallyCovered: null, uncovered: null });
  });

  it("leaves the directory off the governed-risk ranking it sat at rank 1 of", () => {
    // The ranking is the input to which directory gets wired next. A row here
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
    // list — would run them and still leave every one reported as having no CI
    // owner.
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
    // `…/discovery/__tests__` would also select a sibling whose name merely
    // starts with it — `__tests__-legacy`, say. There is none today and this
    // case is what keeps that true: a new one has been measured by nobody.
    const parent = DIRECTORY.slice(0, DIRECTORY.lastIndexOf("/"));
    const base = DIRECTORY.slice(DIRECTORY.lastIndexOf("/") + 1);
    const siblings = readdirSync(path.join(repoRoot, parent)).filter(
      (entry) => entry.startsWith(base) && entry !== base,
    );
    expect(siblings).toEqual([]);
  });

  it("removes the directory from the fully-dark baseline, which wiring it requires in the same change", () => {
    // Unlike `T-767`'s directory, this one WAS in that baseline — it was fully
    // dark. The ratchet asserts set equality, so leaving the line behind fails
    // there instead, and re-adding it later to recover the old warning would
    // assert something false about three suites that now run.
    const declared = JSON.parse(
      readFileSync(path.join(repoRoot, DARK_BASELINE), "utf8"),
    ) as unknown;
    expect(JSON.stringify(declared)).not.toContain(DIRECTORY);
  });

  it("covers at least one route-reachable subject, so the wiring is not coverage over a dead island", () => {
    // Measured from the reachability checker's own run, not its committed
    // artifact. On `6a68c913fd`: `brief-to-shape.ts` and
    // `DiscoveryCapturePanel.tsx` are reachable, `DiscoveryReceiptCard.tsx` is
    // an orphan whose only importer is itself an orphan.
    //
    // The assertion is deliberately "at least one", not "all three". Pinning
    // today's orphan set would make this case fail on the change that mounts
    // the card — punishing the fix — while a directory whose every subject had
    // become unreachable would be wired coverage over code no user runs, which
    // is the state worth refusing.
    const orphans = new Set(
      runJsonScript<{ orphans: string[] }>(REACHABILITY_SCRIPT).orphans,
    );
    const subjects = subjectFilesDirectlyIn(SUBJECT_DIRECTORY);
    expect(subjects.length).toBeGreaterThanOrEqual(MINIMUM_SUITES);
    expect(subjects.filter((file) => !orphans.has(file))).not.toEqual([]);
  });
});
