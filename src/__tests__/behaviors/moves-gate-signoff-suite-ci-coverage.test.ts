import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const MOVES_COMPONENT_SUITE_DIR = "src/components/strategic-moves/__tests__";
const GATE_SIGNOFF_SUITE = `${MOVES_COMPONENT_SUITE_DIR}/phase-approve-and-build-gate-signoff.test.tsx`;

/**
 * The on-disk suite count this directory is held at.
 *
 * This floor is the point of the suite. The directory has just left BOTH census
 * gap lists, and an absence assertion alone passes vacuously once the directory
 * is empty — deleting suites would read as "fully owned" rather than as the
 * regression it is. So the gap-list cases below are paired with a count: emptying
 * or thinning the directory fails here even while they stay green.
 *
 * Raise it when suites are added. Lowering it is the assertion that a Moves
 * component control was deliberately retired, so it belongs in a change that
 * says which one and why.
 */
const MIN_SUITE_FILES = 47;

type CensusRow = { directory: string };
type Census = {
  partiallyCoveredDirectories: CensusRow[];
  uncoveredDirectories: CensusRow[];
  governedRiskRanking: CensusRow[];
};

function jestCommands(): string[] {
  const workflow = readFileSync(
    path.join(repoRoot, ".github/workflows/ai-surface-control-catalog.yml"),
    "utf8",
  );
  const scripts = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts as Record<string, string>;
  return expandWorkflowCommands(
    extractWorkflowRunCommands(workflow),
    scripts,
  ).filter((command) => /\b(?:npx\s+)?jest\b/.test(command));
}

function runCensus(): Census {
  const output = execFileSync(
    process.execPath,
    [
      path.join(repoRoot, "scripts/quality/test-ci-coverage-census.mjs"),
      "--json",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(output.slice(output.indexOf("{"))) as Census;
}

function onDiskSuiteFiles(): string[] {
  return readdirSync(path.join(repoRoot, MOVES_COMPONENT_SUITE_DIR))
    .filter((file) => /\.test\.tsx?$/.test(file))
    .sort();
}

describe("Moves gate sign-off suite CI ownership", () => {
  it("names the gate sign-off suite by exact path in the liability-controls step", () => {
    const command = jestCommands().find((candidate) =>
      candidate.includes(GATE_SIGNOFF_SUITE),
    );

    // The step is a `--runTestsByPath` list, not a directory sweep, so a suite
    // that is not named here runs nowhere at all: it was enumerated by the
    // census and collected by no runner.
    expect(command).toBeDefined();
    expect(command).toContain("--runTestsByPath");
  });

  it("keeps the Moves component suite directory out of both census gap lists", () => {
    const census = runCensus();

    const partial = census.partiallyCoveredDirectories.map((r) => r.directory);
    const uncovered = census.uncoveredDirectories.map((r) => r.directory);

    expect(partial).not.toContain(MOVES_COMPONENT_SUITE_DIR);
    expect(uncovered).not.toContain(MOVES_COMPONENT_SUITE_DIR);
  });

  it("keeps the directory off the governed-risk ranking", () => {
    const census = runCensus();

    expect(census.governedRiskRanking.map((r) => r.directory)).not.toContain(
      MOVES_COMPONENT_SUITE_DIR,
    );
  });

  it("holds the directory at its suite count so the gap-list cases cannot pass vacuously", () => {
    // Without this, emptying the directory satisfies every absence assertion
    // above: nothing partially covered, nothing uncovered, nothing ranked.
    expect(onDiskSuiteFiles().length).toBeGreaterThanOrEqual(MIN_SUITE_FILES);
  });

  it("still holds the gate sign-off suite on disk", () => {
    expect(onDiskSuiteFiles()).toContain(
      "phase-approve-and-build-gate-signoff.test.tsx",
    );
  });
});
