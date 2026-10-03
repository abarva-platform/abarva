/**
 * The nine directories T-493 wires, proven through the census's own resolver
 * and then per FILE, which is the part this draw needed and T-492's did not.
 *
 * T-493 drew 50 untriaged unrun test files, five each across ten directories,
 * and executed every one of them on its own before any verdict was written:
 * 414 cases, 411 passing, 3 failing in one suite. Nine directories came back
 * clean — 45 suites, 373 cases, 0 failing — and are wired in
 * `.github/workflows/unit-suites.yml`. The tenth holds both deferred rows and
 * is deliberately left dark; a directory is wired by fixing it, never by adding
 * it to a green command.
 *
 * Why this is not a grep of the workflow (item C-537): the runner and the
 * CI-visibility gate do not share a matching rule. Jest takes a path argument
 * as a regular expression; the gate registers a suite by its exact path or by
 * an ancestor directory it can see NAMED in a command. A command that reached
 * these suites some other way — a glob, a wrapper script, a changed-files list
 * — would run them and still leave every one reported as having no CI owner.
 * So coverage is read from `scripts/quality/test-ci-coverage-census.mjs`, the
 * resolver the repository's own gates use, and only then is the workflow
 * checked for the literal directory name.
 *
 * THE ONE CASE THIS FILE ADDS TO T-492'S SET, and the reason it exists: one of
 * the nine is not a `__tests__` directory at all.
 * `src/lib/intelligence/ask/retrievers` holds its five test files beside their
 * sources, and the filing warned that a `__tests__`-shaped glob would match
 * nothing there and exit green — the gate-reachability defect T-486 recorded.
 * A directory-level census answer cannot distinguish "every file is reached"
 * from "the directory has no files left", so case 4 asserts the FIVE FILES
 * themselves are absent from the census's unrun list, read from the census's
 * own `--explain` output rather than from a directory summary. That is the
 * closest a test on this side of a merge can get to reading the job log, and
 * the job log for the real runner is quoted in the release record.
 *
 * Suite counts are floors, not exact figures, for the reason T-767 and T-768
 * both give: the workflow names each DIRECTORY, so a suite added to one
 * tomorrow runs the day it lands, and a case pinning the count exactly would
 * fail that pull request and teach the next author to raise a number instead of
 * reading one. The floor is also what stops "absent from both census gap lists"
 * reading as success after a rename or a deletion — an empty directory is
 * absent from them in exactly the same way a fully wired one is.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");
const WIRING_WORKFLOW = ".github/workflows/unit-suites.yml";
const RECORD_PATH = "docs/architecture/t493-stale-suite-triage.json";
const DARK_BASELINE =
  "src/__tests__/behaviors/product-directory-ci-coverage.baseline.json";

/**
 * Measured on base `31641238a1`, per directory: five drawn suites each, all
 * unrun by any workflow, all green when executed on their own. The floor is the
 * drawn count, not the directory's total — `src/scripts/__tests__` holds a
 * sixth file a pinned step already owned.
 */
const WIRED: ReadonlyArray<{ directory: string; minimumSuites: number }> = [
  { directory: "src/components/knowledge/__tests__", minimumSuites: 5 },
  { directory: "src/lib/ava-answer/__tests__", minimumSuites: 5 },
  { directory: "src/lib/intelligence/answer/__tests__", minimumSuites: 5 },
  { directory: "src/lib/intelligence/ask/retrievers", minimumSuites: 5 },
  {
    directory: "src/lib/programs/stage-readiness-workbooks/__tests__",
    minimumSuites: 5,
  },
  { directory: "src/lib/source/artifact-registry/__tests__", minimumSuites: 5 },
  { directory: "src/lib/source/door1/__tests__", minimumSuites: 5 },
  {
    directory: "src/lib/source/proposal-intelligence/__tests__",
    minimumSuites: 5,
  },
  { directory: "src/scripts/__tests__", minimumSuites: 5 },
];

/**
 * The tenth drawn directory. It is asserted to be STILL DARK, which is not a
 * wish: if a later change wires it without settling its red suite and its
 * source-text scanner, this case is what says so, and if it wires it properly
 * this case is what has to be deleted deliberately along with the record's
 * held-directory entry.
 */
const HELD_DIRECTORY = "src/lib/intelligence/synthesis/__tests__";

/**
 * Item 26, 2026-10-01. The one row the hold still rests on (owner T-495), and
 * the four green suites run by named file beside it. Each of the four has a
 * product importer: the ask synthesizer, the agent chat route, the Programs
 * aVa quality gate and the pilot dashboard aggregates.
 */
const HELD_SCANNER = `${HELD_DIRECTORY}/violationsMigration.test.ts`;
const NAMED_FILE_WIRED: ReadonlyArray<string> = [
  `${HELD_DIRECTORY}/healthcareAnswerContract.test.ts`,
  `${HELD_DIRECTORY}/outputValidator.test.ts`,
  `${HELD_DIRECTORY}/violationsRecorder.test.ts`,
  `${HELD_DIRECTORY}/violationsSupabaseBackend.test.ts`,
];

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

const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";

/*
 * The census runs as a CHILD PROCESS, twice, and that is a measured choice
 * rather than the shape this file started with. It first called `buildCensus`
 * in process, on the reasoning that one in-process call must beat two spawns.
 * That reasoning was never tested in the environment that decides it. The
 * required `Behavior coverage floor` job runs this directory under
 * `--coverage --runInBand`, so an in-process census is INSTRUMENTED and a
 * spawned one is not:
 *
 *   in process, with coverage   22.2s
 *   two spawns, with coverage   10.9s
 *   in process, no coverage      8.2s
 *   two spawns, no coverage      9.9s
 *
 * Without coverage the in-process form is the faster one, which is why the
 * wrong choice looked right. Under coverage it costs twice as much, and under
 * coverage is how the gate runs. Every sibling census-reading suite in this
 * directory spawns the CLI; this is now the fourth measurement agreeing with
 * them rather than a style someone copied.
 */
function runCensusJson(extraArgs: string[] = []): unknown {
  const stdout = execFileSync(
    process.execPath,
    [path.join(repoRoot, CENSUS_SCRIPT), ...extraArgs, "--json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(stdout.slice(stdout.search(/[[{]/)));
}

const census = runCensusJson() as Census;
const unrunByDirectory = runCensusJson(["--explain"]) as { directory: string; unrunTestPaths: string[] }[];
const unrunPaths = new Set(
  unrunByDirectory.flatMap((row) => row.unrunTestPaths),
);

const record = JSON.parse(
  readFileSync(path.join(repoRoot, RECORD_PATH), "utf8"),
) as {
  wiring: { directories: string[]; workflow: string; suitesWired: number };
  heldDirectories: Record<string, string>;
  namedFileWiring?: { workflow: string; paths: string[]; leftDark: string[] };
  suites: { path: string; directory: string; wiredInThisItem: boolean }[];
};

describe("the nine T-493 directories a workflow actually reaches", () => {
  it("resolves every jest invocation to literal paths, so the coverage answer is not a guess", () => {
    // While any invocation is unresolved the census's covered count is an upper
    // bound, and every case below would be reading that guess as a fact.
    expect(census.counts.indeterminateInvocations).toBe(0);
  });

  it("wires exactly the directories the triage record says it wires", () => {
    // The record and this control have to agree, or one of them is describing a
    // change that did not happen. Set equality in both directions, and the
    // per-row wiring flags have to give the same set as the wiring block.
    expect(WIRED.map((w) => w.directory).sort()).toEqual(
      [...record.wiring.directories].sort(),
    );
    expect(record.wiring.workflow).toBe(WIRING_WORKFLOW);
    expect(
      [
        ...new Set(
          record.suites.filter((s) => s.wiredInThisItem).map((s) => s.directory),
        ),
      ].sort(),
    ).toEqual(WIRED.map((w) => w.directory).sort());
    expect(record.wiring.suitesWired).toBe(
      record.suites.filter((s) => s.wiredInThisItem).length,
    );
  });

  it("holds each directory's suite count off disk, so the cases below cannot pass vacuously", () => {
    for (const { directory, minimumSuites } of WIRED) {
      expect({
        directory,
        atLeast: testFilesDirectlyIn(directory).length >= minimumSuites,
      }).toEqual({ directory, atLeast: true });
    }
  });

  it("reaches every drawn FILE, not merely every directory — the case the non-__tests__ path needs", () => {
    /*
     * A directory summary cannot tell "all files reached" from "no files left",
     * and a `__tests__`-shaped glob over `src/lib/intelligence/ask/retrievers`
     * would match nothing and exit green. So each of the 45 wired paths is
     * asserted absent from the census's own unrun list, and the paths come from
     * the record rather than from a fresh directory listing — a file deleted to
     * make this pass would leave the record naming a path that no longer exists,
     * which the sibling record guard refuses.
     */
    const wiredPaths = record.suites
      .filter((s) => s.wiredInThisItem)
      .map((s) => s.path);
    expect(wiredPaths.length).toBe(45);
    const stillUnrun = wiredPaths.filter((p) => unrunPaths.has(p));
    expect(stillUnrun).toEqual([]);
    // And the instrument is not empty: it still reports the held directory's
    // files, so "absent from the unrun list" means reached rather than unseen.
    expect(unrunPaths.size).toBeGreaterThan(0);
  });

  it("reaches every suite in all nine, refusing a fallback to partial coverage", () => {
    for (const { directory, minimumSuites } of WIRED) {
      const partial = census.partiallyCoveredDirectories.find(
        (row) => row.directory === directory,
      );
      const uncovered = census.uncoveredDirectories.find(
        (row) => row.directory === directory,
      );
      // Reported as the census phrases it rather than as two booleans, so a
      // failure prints WHICH state the directory fell back to and how far.
      // `partial` is the quieter regression and this refuses both.
      expect({
        directory,
        partiallyCovered: partial
          ? `${partial.coveredTestFiles} of ${partial.testFiles}`
          : null,
        uncovered: uncovered ? `0 of ${uncovered.testFiles}` : null,
      }).toEqual({ directory, partiallyCovered: null, uncovered: null });
      expect(minimumSuites).toBeGreaterThan(0);
    }
  });

  it("names each directory literally in a jest command, so the CI-visibility gate can see it too", () => {
    const commands = expandedWorkflowCommands().filter((command) =>
      /\b(?:npx\s+)?(?:jest|vitest|playwright)\b/.test(command),
    );
    const workflow = readFileSync(
      path.join(repoRoot, WIRING_WORKFLOW),
      "utf8",
    );
    for (const { directory } of WIRED) {
      const named = commands.filter((command) =>
        new RegExp(
          `(?:^|[\\s"'\`=])${directory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[\\s"'\`])`,
        ).test(command),
      );
      expect({ directory, namedInACommand: named.length > 0 }).toEqual({
        directory,
        namedInACommand: true,
      });

      // And it is THIS workflow that carries it, so a step cannot quietly move
      // into a job that does not run on a pull request. A trailing slash would
      // stop the visibility gate matching, so the pattern refuses one here too.
      expect({
        directory,
        inWiringWorkflow: new RegExp(
          `jest\\s+${directory.replace(/[/]/g, "\\/")}(?=\\s|$)`,
          "m",
        ).test(workflow),
      }).toEqual({ directory, inWiringWorkflow: true });
    }
  });

  it("records every extra path each directory pattern also selects", () => {
    // A jest path argument is a regular expression tested against the full
    // path, so naming `…/__tests__` also selects a sibling whose name merely
    // starts with it — `__tests__-legacy`, say. There is none today for any of
    // the nine, and this case is what keeps that true: a new one has been
    // measured by nobody.
    for (const { directory } of WIRED) {
      const parent = directory.slice(0, directory.lastIndexOf("/"));
      const base = directory.slice(directory.lastIndexOf("/") + 1);
      const siblings = readdirSync(path.join(repoRoot, parent)).filter(
        (entry) => entry.startsWith(base) && entry !== base,
      );
      expect({ directory, alsoSelected: siblings }).toEqual({
        directory,
        alsoSelected: [],
      });
    }
  });

  it("leaves all nine off the governed-risk ranking every one of them sat on", () => {
    // The ranking is the input to which directory gets wired next. A row here
    // again means suites in it stopped running, whatever the totals say.
    for (const { directory } of WIRED) {
      expect({
        directory,
        stillRanked: census.governedRiskRanking.some(
          (row) => row.directory === directory,
        ),
      }).toEqual({ directory, stillRanked: false });
    }
  });

  it("removes the eight fully-dark directories from the dark baseline, and never adds the ninth", () => {
    /*
     * Eight of the nine were fully dark and their lines have to leave the
     * baseline in this same change, because that ratchet asserts set EQUALITY —
     * leaving a line behind fails there instead. The ninth,
     * `src/scripts/__tests__`, was 5 of 6 covered and therefore PARTIAL, so it
     * was never in the baseline and must not be added: a line claiming it was
     * fully dark would be false in the direction that hides work.
     */
    const declared = JSON.parse(
      readFileSync(path.join(repoRoot, DARK_BASELINE), "utf8"),
    ) as string[];
    for (const { directory } of WIRED) {
      expect({ directory, inDarkBaseline: declared.includes(directory) }).toEqual({
        directory,
        inDarkBaseline: false,
      });
    }
  });

  it("keeps the tenth drawn directory's scanner dark, and keeps saying why in the record", () => {
    /*
     * The held directory is the half of T-493 that did NOT happen, and it is
     * asserted rather than left to prose. Until 2026-10-01 this case asserted
     * all five files dark. Item 26 then ran the four green suites whose
     * subjects product code imports by NAMED FILE (the T-780 precedent), so
     * what stays dark is exactly the one row the hold rests on: the T-495
     * source-text scanner over a committed migration, which T-550's rule
     * refuses to wire whether it passes or not. The directory itself is still
     * never named whole — that would wire the scanner — and the record still
     * carries the written reason.
     */
    expect(Object.keys(record.heldDirectories)).toEqual([HELD_DIRECTORY]);
    expect(record.heldDirectories[HELD_DIRECTORY].length).toBeGreaterThan(200);
    expect(record.wiring.directories).not.toContain(HELD_DIRECTORY);

    const heldPaths = record.suites
      .filter((s) => s.directory === HELD_DIRECTORY)
      .map((s) => s.path);
    expect(heldPaths).toHaveLength(5);
    expect(heldPaths).toContain(HELD_SCANNER);
    expect([...NAMED_FILE_WIRED, HELD_SCANNER].sort()).toEqual([...heldPaths].sort());

    // Measured, not asserted: the census's own unrun list for this directory
    // is the scanner and nothing else.
    const unrunHere = unrunByDirectory.find(
      (row) => row.directory === HELD_DIRECTORY,
    );
    expect(unrunHere?.unrunTestPaths ?? []).toEqual([HELD_SCANNER]);
    expect(
      census.partiallyCoveredDirectories.find(
        (row) => row.directory === HELD_DIRECTORY,
      ),
    ).toMatchObject({ testFiles: 5, coveredTestFiles: 4 });

    // PARTIAL now, so it leaves the fully-dark baseline; a line claiming it
    // was fully dark would be false in the direction that hides work.
    const declared = JSON.parse(
      readFileSync(path.join(repoRoot, DARK_BASELINE), "utf8"),
    ) as string[];
    expect(declared).not.toContain(HELD_DIRECTORY);
  });

  it("runs the four green synthesis suites by named file, and never names the held directory whole", () => {
    expect(record.namedFileWiring?.paths ?? []).toEqual(NAMED_FILE_WIRED);
    expect(record.namedFileWiring?.workflow).toBe(WIRING_WORKFLOW);
    expect(record.namedFileWiring?.leftDark).toEqual([HELD_SCANNER]);

    const commands = expandedWorkflowCommands().filter((command) =>
      /\b(?:npx\s+)?(?:jest|vitest|playwright)\b/.test(command),
    );
    const escaped = (text: string) =>
      text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const bare = (text: string) =>
      new RegExp(`(?:^|[\\s"'\`=])${escaped(text)}(?=$|[\\s"'\`])`);

    // No command anywhere names the directory as a bare argument: jest would
    // take it as a pattern and select the scanner with its siblings.
    expect(commands.filter((command) => bare(HELD_DIRECTORY).test(command))).toEqual([]);
    // And none names the scanner by path.
    expect(commands.filter((command) => command.includes(HELD_SCANNER))).toEqual([]);

    // Each wired file is named literally, in a --runTestsByPath command in the
    // wiring workflow, so a bracket or dot in a path is never read as a regex.
    const workflow = readFileSync(path.join(repoRoot, WIRING_WORKFLOW), "utf8");
    for (const testPath of NAMED_FILE_WIRED) {
      expect({ testPath, inWiringWorkflow: bare(testPath).test(workflow) }).toEqual({
        testPath,
        inWiringWorkflow: true,
      });
      const carrying = commands.filter(
        (command) => /--runTestsByPath\b/.test(command) && bare(testPath).test(command),
      );
      expect({ testPath, namedByPath: carrying.length > 0 }).toEqual({
        testPath,
        namedByPath: true,
      });
      expect({ testPath, unrun: unrunPaths.has(testPath) }).toEqual({
        testPath,
        unrun: false,
      });
    }
  });
});
