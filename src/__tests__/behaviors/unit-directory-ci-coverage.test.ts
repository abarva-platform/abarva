import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

/**
 * The integration tree has been measured, wired and ratcheted. Nothing had ever
 * asked the same question of the other `src/__tests__` trees, and the reason is
 * structural rather than accidental: the "changed integration suites have a CI
 * owner" gate is hard-scoped to `src/__tests__/integration/`, so a suite in a
 * sibling tree is not only unwired — nothing asks whether it has an owner even
 * when a pull request edits it.
 *
 * Measured on `6166725d0` through the census's own resolver:
 * `unit` 11 suites / 0 covered, `hygiene` 6 / 0, `features` 1 / 0,
 * `guardrails` 1 / 0. `unit` is wired by `.github/workflows/unit-suites.yml`;
 * the other three are red and are filed rather than wired.
 *
 * These cases hold two things:
 *
 *   1. every suite in the wired tree really is reached, proved through the same
 *      resolver the gate uses rather than by searching the workflow for a
 *      string; and
 *   2. no NEW dark tree joins the set under `src/__tests__`. A ratchet, not a
 *      floor: wiring one of the three named below is always allowed and needs
 *      no edit here, while a fourth dark tree fails.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CENSUS_SCRIPT = "scripts/quality/test-ci-coverage-census.mjs";
const TESTS_ROOT = "src/__tests__";
const WIRED_TREE = `${TESTS_ROOT}/unit`;

type CensusRow = {
  directory: string;
  testFiles: number;
  coveredTestFiles: number;
};

type Census = {
  counts: { indeterminateInvocations: number };
  partiallyCoveredDirectories: CensusRow[];
  uncoveredDirectories: CensusRow[];
};

/**
 * Trees under `src/__tests__` that a workflow still does not reach, each with
 * the measured reason it was not wired in the same change. Run together on
 * `6166725d0`: 4 failed / 4 passed of 8 suites, 4 failing cases — one per red
 * suite. A red tree is wired by fixing it or by quarantining named suites with
 * named reasons, never by adding it to a green command.
 */
const KNOWN_DARK_TREES = new Set([
  // `neo4j-gate.test.ts` — the flag-on path does not execute the work fn.
  `${TESTS_ROOT}/features`,
  // `anthropic-only-reasoning.test.ts` is green; the tree is unwired, not red.
  `${TESTS_ROOT}/guardrails`,
  // 3 of 6 red: a retired `@/lib/agents` import that still exists on main, and
  // two shell/nav ownership contracts.
  `${TESTS_ROOT}/hygiene`,
]);

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

function workflowCommands(): string[] {
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

function suitesIn(relative: string): string[] {
  return readdirSync(path.join(repoRoot, relative))
    .filter((entry) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry))
    .map((entry) => `${relative}/${entry}`);
}

const census = runCensus();

describe("test trees under src/__tests__ that a workflow actually reaches", () => {
  it("names the wired tree literally in a workflow command, the way the gate requires", () => {
    // The gate counts a suite as registered only when a command mentions a test
    // runner AND names the suite or a containing directory, with the path
    // followed by whitespace or end-of-command — a trailing slash stops it
    // matching, and a wrapper script that shells out to jest registers nothing.
    //
    // The gate's own resolver cannot be used as the proof here, and that is a
    // finding rather than an inconvenience: `candidateRegistrationPaths` walks
    // ancestor directories only while they start with
    // `src/__tests__/integration`, so for a suite in any other tree the only
    // candidate it will ever consider is the exact file path. Naming this
    // directory registers nothing in the gate's eyes today. The resolver-backed
    // proof is the census case below; this case holds the mechanic.
    const commands = workflowCommands().filter((command) =>
      /\b(?:npx\s+)?jest\b/.test(command),
    );
    const naming = commands.filter((command) =>
      new RegExp(`(?:^|[\\s"'=])${WIRED_TREE}(?=$|[\\s"'])`).test(command),
    );
    expect(naming.length).toBeGreaterThan(0);
  });

  it("agrees with the census that the wired tree is covered", () => {
    // If the census cannot resolve some jest invocation to literal paths its
    // answer is an upper bound and these assertions would be reading a guess.
    expect(census.counts.indeterminateInvocations).toBe(0);

    // Non-vacuous: the tree must exist and hold suites, so "absent from both
    // lists" cannot be satisfied by a directory that is simply gone. Remove the
    // run step from the workflow and this row comes back as uncovered.
    expect(suitesIn(WIRED_TREE).length).toBeGreaterThan(0);

    const uncovered = census.uncoveredDirectories.find(
      (row) => row.directory === WIRED_TREE,
    );
    const partial = census.partiallyCoveredDirectories.find(
      (row) => row.directory === WIRED_TREE,
    );
    expect({ uncovered, partial }).toEqual({
      uncovered: undefined,
      partial: undefined,
    });
  });

  it("refuses a wired tree name that prefixes a sibling", () => {
    // A jest path argument is a regex against the full path, not a directory
    // handle: naming `…/agent` also runs `…/agents`. Anchoring is not available
    // — a trailing slash is exactly what makes the visibility gate stop seeing
    // the path — so the absence of a colliding sibling has to be asserted.
    //
    // A colliding FILE is loud: it runs once and somebody sees it. A colliding
    // DIRECTORY is silent, because it adopts every suite written there
    // afterwards.
    const wiredName = path.basename(WIRED_TREE);
    const collisions = readdirSync(path.join(repoRoot, TESTS_ROOT)).filter(
      (entry) => entry !== wiredName && entry.startsWith(wiredName),
    );
    expect(collisions).toEqual([]);
  });

  it("does not let a new dark tree appear under src/__tests__", () => {
    const trees = readdirSync(path.join(repoRoot, TESTS_ROOT)).filter((entry) =>
      statSync(path.join(repoRoot, TESTS_ROOT, entry)).isDirectory(),
    );
    const dark = census.uncoveredDirectories
      .filter((row) =>
        trees.some((tree) => row.directory === `${TESTS_ROOT}/${tree}`),
      )
      .map((row) => row.directory)
      .filter((directory) => !KNOWN_DARK_TREES.has(directory))
      .sort();
    expect(dark).toEqual([]);
  });
});
