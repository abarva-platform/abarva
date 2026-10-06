/**
 * The five directories T-492 wires, proven through the census's own resolver.
 *
 * T-492 drew 84 untriaged unrun test files across ten directories and executed
 * every one of them on its own before any verdict was written. Five of the ten
 * came back entirely clean — 35 suites, 460 cases, 0 failing, and not one of
 * them reads a repository file as text, so nothing in them pins the shape of a
 * source file. Those five are wired here. The other five each hold at least one
 * row the record hands to another item, and a directory is wired by fixing it,
 * never by adding it to a green command.
 *
 * What this file is for, and why it is not a grep of the workflow:
 *
 *   * The runner and the CI-visibility gate do not share a matching rule. Jest
 *     takes a path argument as a regular expression; the gate registers a suite
 *     by its exact path or by an ancestor directory it can see NAMED in a
 *     command. A command that reached these suites some other way — a glob, a
 *     wrapper script, a changed-files list — would run them and still leave
 *     every one reported as having no CI owner.
 *   * So coverage is read from `scripts/quality/test-ci-coverage-census.mjs`,
 *     the same resolver the repository's own gates use (item C-537), and only
 *     then is the workflow checked for the literal directory name.
 *
 * Two failure modes this draw made concrete rather than hypothetical, both
 * asserted below:
 *
 *   * A `__tests__`-shaped assumption misses a directory that holds its tests
 *     beside its sources. `src/lib/intelligence/canonical` in this same draw is
 *     exactly that, and it is NOT one of the five wired here — so case 6 pins
 *     the five by their literal paths rather than by a pattern that would
 *     quietly stop matching one of them.
 *   * A step that names a directory with a trailing slash runs the suites and
 *     registers nothing, because the visibility gate requires the path to be
 *     followed by whitespace or end-of-command. Case 5 refuses one.
 *
 * The floor on suite counts is a floor and not an exact figure, for the reason
 * T-767 and T-768 both give: the workflow names each DIRECTORY, so a suite added
 * to one tomorrow runs the day it lands, and a case pinning the count exactly
 * would fail that pull request and teach the next author to raise a number
 * instead of reading one. The floor is also what stops "absent from both census
 * gap lists" reading as success after a rename or a deletion — an empty
 * directory is absent from them in exactly the same way a fully wired one is.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const WIRING_WORKFLOW = ".github/workflows/unit-suites.yml";
const RECORD_PATH = "docs/architecture/t492-stale-suite-triage.json";
const DARK_BASELINE =
  "src/__tests__/behaviors/product-directory-ci-coverage.baseline.json";

/**
 * Measured on base `fc5cb87d28`, per directory: suites in the directory, all of
 * them dark, all of them green when run. The floor is the measured count.
 */
const WIRED: ReadonlyArray<{ directory: string; minimumSuites: number }> = [
  { directory: "src/components/setup/__tests__", minimumSuites: 6 },
  { directory: "src/lib/atlas/iac/__tests__", minimumSuites: 6 },
  { directory: "src/lib/programs/ava-chat/__tests__", minimumSuites: 7 },
  { directory: "src/lib/source/contracts/__tests__", minimumSuites: 6 },
  { directory: "src/lib/visual-system/__tests__", minimumSuites: 10 },
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
const record = JSON.parse(
  readFileSync(path.join(repoRoot, RECORD_PATH), "utf8"),
) as {
  wiring: { directories: string[]; workflow: string };
  suites: { path: string; directory: string; wiredInThisItem: boolean }[];
};

describe("the five T-492 directories a workflow actually reaches", () => {
  it("resolves every jest invocation to literal paths, so the coverage answer is not a guess", () => {
    // While any invocation is unresolved the census's covered count is an upper
    // bound, and every case below would be reading that guess as a fact.
    expect(census.counts.indeterminateInvocations).toBe(0);
  });

  it("wires exactly the directories the triage record says it wires", () => {
    // The record and this control have to agree, or one of them is describing a
    // change that did not happen. Set equality in both directions.
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
  });

  it("holds each directory's suite count off disk, so the cases below cannot pass vacuously", () => {
    for (const { directory, minimumSuites } of WIRED) {
      expect({
        directory,
        atLeast: testFilesDirectlyIn(directory).length >= minimumSuites,
      }).toEqual({ directory, atLeast: true });
    }
  });

  it("reaches every suite in all five, where the measured state was 0 covered in each", () => {
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
    // the five, and this case is what keeps that true: a new one has been
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

  it("leaves all five off the governed-risk ranking every one of them sat on", () => {
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

  it("removes all five from the fully-dark baseline, which wiring them requires in the same change", () => {
    // All five WERE in that baseline — all five were fully dark. The ratchet
    // asserts set equality, so leaving a line behind fails there instead, and
    // re-adding one later to recover the old warning would assert something
    // false about suites that now run.
    const declared = JSON.parse(
      readFileSync(path.join(repoRoot, DARK_BASELINE), "utf8"),
    ) as string[];
    for (const { directory } of WIRED) {
      expect({ directory, stillInDarkBaseline: declared.includes(directory) }).toEqual(
        { directory, stillInDarkBaseline: false },
      );
    }
  });
});
