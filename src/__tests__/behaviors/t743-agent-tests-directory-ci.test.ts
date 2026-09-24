import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import yaml from "js-yaml";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";
import {
  TRANSIENT_PROBE_FILES,
  writeTransientProbeFile,
} from "../../testing/transient-probe-files";

/**
 * `src/lib/agent/__tests__` holds 33 suites. Five ran in CI and 28 ran nowhere,
 * with zero declared quarantines — not because anyone judged them, but because
 * the directory was reached by NAMED FILES and every file added after those
 * commands were written fell outside CI by omission. The step that named three
 * of them said why in its own comment: sweeping the directory would have picked
 * up "unrelated untriaged debt this item did not measure".
 *
 * That reason is now discharged rather than ignored. T-742 executed 19 of the
 * 28 individually and recorded `wire_into_ci` for every one; this item executed
 * the remaining 9 individually before wiring anything (73 tests, 73 passed),
 * and then the directory as a unit: 33 suites, 592 tests, 592 passed, 0.7s.
 *
 * The cases below hold the shape of the wire, not the fact of it:
 *
 *   1. the directory is reached, proved through the census's own four-hop
 *      resolver (workflow → npm script → node script → jest) rather than by
 *      searching a workflow for a string;
 *   2. the workflow carrying it runs on EVERY pull request, because a
 *      path-filtered workflow reaches a new file only if someone also edits the
 *      filter — which is the same omission one level up; and
 *   3. a file that does not exist yet is reached. Case 3 creates one and
 *      re-measures, so "covered" is an answer about the next file rather than
 *      about today's 33.
 *
 * Case 3 used to delete that file in a `finally`, and that deletion was item
 * T-759: thirty-one suites in this directory enumerate the test files under
 * `src/` and then read each one, so a file that disappears between those two
 * steps kills whichever of them is mid-read. The probe now leaves its file for
 * the run and `src/testing/transient-probe-files.ts` removes it in the run's
 * globalTeardown, after every worker has exited.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const AGENT_UNIT_DIRECTORY = "src/lib/agent/__tests__";
const PROBE_FILE = `${AGENT_UNIT_DIRECTORY}/t743-coverage-probe.generated.test.ts`;
const WIRING_WORKFLOW = ".github/workflows/ai-surface-control-catalog.yml";

/**
 * A floor, not the exact count. Adding a suite to a wired directory must not
 * fail this case; emptying or renaming the directory must, because absence from
 * both of the census's gap lists reads as success for a directory that no
 * longer exists.
 */
const MINIMUM_SUITES = 30;

type CensusDirectoryRow = {
  directory: string;
  testFiles: number;
  coveredTestFiles: number;
};

type Census = {
  counts: { indeterminateInvocations: number };
  partiallyCoveredDirectories: CensusDirectoryRow[];
  uncoveredDirectories: CensusDirectoryRow[];
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

function gapRowsFor(census: Census, directory: string) {
  const partial = census.partiallyCoveredDirectories.find(
    (row) => row.directory === directory,
  );
  const uncovered = census.uncoveredDirectories.find(
    (row) => row.directory === directory,
  );
  return {
    partiallyCovered: partial
      ? `${partial.coveredTestFiles} of ${partial.testFiles}`
      : null,
    uncovered: uncovered ? `0 of ${uncovered.testFiles}` : null,
  };
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

describe("the agent-runtime unit directory CI reaches by directory", () => {
  it("resolves every jest invocation to literal paths, so the coverage answer is not a guess", () => {
    // While any invocation is unresolved the census's covered count is an upper
    // bound, and every case below would be reading that guess as a fact.
    expect(census.counts.indeterminateInvocations).toBe(0);
  });

  it("reaches every suite in the directory, not the ones named individually", () => {
    // Non-vacuous first: a renamed or emptied directory is absent from both gap
    // lists in exactly the way a covered one is.
    expect(testFilesDirectlyIn(AGENT_UNIT_DIRECTORY).length).toBeGreaterThanOrEqual(
      MINIMUM_SUITES,
    );

    expect(gapRowsFor(census, AGENT_UNIT_DIRECTORY)).toEqual({
      partiallyCovered: null,
      uncovered: null,
    });
  });

  it("names the directory literally in a jest command, so the CI-visibility gate sees it too", () => {
    // The runner and the gate do not share a matching rule. Jest takes a path
    // argument as a regex; the visibility gate registers a suite by its exact
    // path or by an ancestor DIRECTORY it can see named. A command that reached
    // these suites some other way — a glob, a wrapper, a changed-files list —
    // would run them and still leave every one reported as having no CI owner.
    const escaped = AGENT_UNIT_DIRECTORY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const named = expandedWorkflowCommands()
      .filter((command) => /\b(?:npx\s+)?(?:jest|vitest|playwright)\b/.test(command))
      .filter((command) =>
        new RegExp(`(?:^|[\\s"'\`=])${escaped}(?=$|[\\s"'\`])`).test(command),
      );
    expect(named.length).toBeGreaterThan(0);

    // And it is this workflow that carries it, so the step cannot quietly move
    // into a job that does not run on a pull request.
    expect(readFileSync(path.join(repoRoot, WIRING_WORKFLOW), "utf8")).toMatch(
      new RegExp(`jest\\s+${AGENT_UNIT_DIRECTORY.replace(/[/]/g, "\\/")}(?=\\s|$)`),
    );
  });

  it("carries the wire in a workflow that runs on every pull request, not a path-filtered one", () => {
    // This is the half a coverage number cannot express. `atlas-quality.yml`
    // names two files from this directory and is filtered to the paths those
    // two files are about; a 34th suite about something else changes none of
    // them, so a path-filtered home would reach it only when somebody also
    // edited the filter — the same omission this item exists to remove, one
    // level up from the one it names.
    const workflow = yaml.load(
      readFileSync(path.join(repoRoot, WIRING_WORKFLOW), "utf8"),
    ) as { on?: Record<string, unknown>; true?: Record<string, unknown> };

    // `on:` is YAML 1.1 `true` under js-yaml's default schema.
    const triggers = (workflow.on ?? workflow.true ?? {}) as Record<string, unknown>;
    const pullRequest = triggers.pull_request as
      | { paths?: string[]; "paths-ignore"?: string[] }
      | null
      | undefined;

    expect(Object.keys(triggers)).toContain("pull_request");
    expect({
      paths: pullRequest?.paths ?? null,
      pathsIgnore: pullRequest?.["paths-ignore"] ?? null,
    }).toEqual({ paths: null, pathsIgnore: null });
  });

  it("records every extra path the directory pattern also selects", () => {
    // A jest path argument is a regex tested against the full path, so naming
    // `…/agent/__tests__` would also select a sibling whose name merely starts
    // with it — `__tests__-legacy`, say. There is none today and this case is
    // what keeps that true.
    const parent = AGENT_UNIT_DIRECTORY.slice(0, AGENT_UNIT_DIRECTORY.lastIndexOf("/"));
    const base = AGENT_UNIT_DIRECTORY.slice(AGENT_UNIT_DIRECTORY.lastIndexOf("/") + 1);
    const siblings = readdirSync(path.join(repoRoot, parent)).filter(
      (entry) => entry.startsWith(base) && entry !== base,
    );
    expect(siblings).toEqual([]);
  });

  it("reaches a suite that does not exist yet, without a workflow edit", () => {
    // The acceptance's own words. Every case above is an answer about the 33
    // files on disk right now, and file-by-file wiring answers all of them
    // correctly on the day it is written — that is how 28 suites came to run
    // nowhere. So: add a file the workflow has never heard of and re-measure.
    const probe = path.join(repoRoot, PROBE_FILE);
    const before = testFilesDirectlyIn(AGENT_UNIT_DIRECTORY).length;
    writeTransientProbeFile(
      PROBE_FILE,
      [
        "// Written by t743-agent-tests-directory-ci.test.ts and removed by the",
        "// run's globalTeardown — never inside the run (item T-759).",
        "// It passes, so a leaked copy is harmless to the directory it probes.",
        'it("is reached by whatever command owns this directory", () => {',
        "  expect(true).toBe(true);",
        "});",
        "",
      ].join("\n"),
      repoRoot,
    );
    expect(testFilesDirectlyIn(AGENT_UNIT_DIRECTORY).length).toBe(before + 1);

    const remeasured = runCensus();
    expect(gapRowsFor(remeasured, AGENT_UNIT_DIRECTORY)).toEqual({
      partiallyCovered: null,
      uncovered: null,
    });

    // Item T-759, and this is the half that used to read `toBe(false)`. The
    // probe must still be on disk when this case ends: 31 suites in this
    // directory enumerate the test files under `src/` and then read each one,
    // and removing this file while any of them is between those two steps
    // kills it with ENOENT. Measured at `origin/main` 15e0e9994 with a cold
    // cache, three runs of three: 4, 3 and 4 suites failing of 114. Whoever
    // re-adds a removal here fails this expectation first.
    expect(existsSync(probe)).toBe(true);
    expect(TRANSIENT_PROBE_FILES).toContain(PROBE_FILE);
  });
});
