import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

/**
 * The live phase-gate-approval route's suite directory. POST on this route is
 * fetched from exactly one product surface and it is the single path every
 * phase gate crosses: it evaluates the gate rule, records the phase snapshot,
 * advances the Move and runs the terminal handoff. Until slice 17 of the
 * catalog, all 43 cases guarding those 974 lines could have been deleted
 * without one merge-blocking check going red.
 */
const GATE_APPROVAL_SUITE_DIR =
  "src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__";

/**
 * The same directory as jest must be given it. A bare positional argument is a
 * REGEX, so the dynamic route segment's brackets have to be escaped; passed
 * unescaped, `[programId]` is a character class, the pattern matches nothing
 * and jest exits 1 with "No tests found" — a step that looks like it owns the
 * directory while owning none of it.
 */
const GATE_APPROVAL_JEST_PATTERN =
  "src/app/api/v1/programs/\\[programId\\]/phase-gate-approval/__tests__";

const REQUIRED_WORKFLOW = ".github/workflows/ai-surface-control-catalog.yml";

/**
 * The workflow that named the suite before, whose job is in none of the
 * required contexts. It is asserted to have let the name go, because a suite a
 * required job runs must be NAMED inside a required job — otherwise the
 * quotable line in a log belongs to the run that cannot block a merge.
 */
const NON_REQUIRED_WORKFLOW = ".github/workflows/unit-suites.yml";

/**
 * The suite that puts this directory on the gate-crossing path, named because
 * a step can name a path that holds nothing: the ownership case above passes
 * vacuously once the directory is empty.
 */
const GATE_APPROVAL_SUITE = "route.test.ts";

type CensusRow = { directory: string };
type Census = {
  partiallyCoveredDirectories: CensusRow[];
  uncoveredDirectories: CensusRow[];
};

/**
 * `preserveEscapes` matters here and nowhere else in this file's siblings. The
 * extractor's default shape rewrites `\\` to `/` so a Windows-style path in a
 * command matches a repo-relative one — right for a path, wrong for a regex,
 * and a jest positional argument is a regex. Without it the step's pattern
 * reads back as `programs//[programId/]/...` and every case below would be
 * asserting against a spelling the workflow does not contain.
 */
function jestCommands(workflow: string): string[] {
  const contents = readFileSync(path.join(repoRoot, workflow), "utf8");
  const scripts = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts as Record<string, string>;
  return expandWorkflowCommands(
    extractWorkflowRunCommands(contents, { preserveEscapes: true }),
    scripts,
    { preserveEscapes: true },
  ).filter((command) => /\b(?:npx\s+)?jest\b/.test(command));
}

function onDiskSuiteFiles(): string[] {
  return readdirSync(path.join(repoRoot, GATE_APPROVAL_SUITE_DIR))
    .filter((file) => /\.test\.tsx?$/.test(file))
    .sort();
}

function runCensus(): Census {
  const output = execFileSync(
    process.execPath,
    [path.join(repoRoot, "scripts/quality/test-ci-coverage-census.mjs"), "--json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(output.slice(output.indexOf("{"))) as Census;
}

describe("phase-gate-approval route suite required-CI ownership", () => {
  it("sweeps the directory from the required catalog workflow", () => {
    const command = jestCommands(REQUIRED_WORKFLOW).find((candidate) =>
      candidate.includes(GATE_APPROVAL_JEST_PATTERN),
    );

    // A directory sweep, not a --runTestsByPath list, so a suite added to the
    // directory is owned without editing the workflow.
    expect(command).toBeDefined();
    expect(command).not.toContain("--runTestsByPath");
  });

  it("escapes the dynamic route segment, so the pattern selects the directory jest is pointed at", () => {
    const command = jestCommands(REQUIRED_WORKFLOW).find((candidate) =>
      candidate.includes("phase-gate-approval/__tests__"),
    );

    expect(command).toBeDefined();
    // The unescaped spelling is the failure this case exists to refuse: it is
    // a valid-looking step that runs no tests at all.
    expect(command).not.toContain(`${GATE_APPROVAL_SUITE_DIR}'`);
    expect(command).toContain(GATE_APPROVAL_JEST_PATTERN);
    // And the escapes resolve to a directory that is really there, so a moved
    // or renamed route fails here instead of going quiet.
    expect(existsSync(path.join(repoRoot, GATE_APPROVAL_SUITE_DIR))).toBe(true);
  });

  it("holds the suite on disk so the ownership case cannot pass vacuously", () => {
    expect(onDiskSuiteFiles()).toContain(GATE_APPROVAL_SUITE);
  });

  it("leaves the name out of the workflow that cannot block a merge", () => {
    const named = jestCommands(NON_REQUIRED_WORKFLOW).filter((command) =>
      command.includes(`${GATE_APPROVAL_SUITE_DIR}/`),
    );

    // Not a rule against duplication — a second run inside another REQUIRED
    // job would be legal. The defect is a named, quotable line living in a job
    // that cannot block a merge while the blocking run stays anonymous.
    expect(named).toEqual([]);
  });

  it("records that the coverage census cannot see merge-darkness here", () => {
    const census = runCensus();

    // The directory was absent from both gap lists BEFORE the required sweep
    // was added and it is absent after. That is the finding, not a regression
    // guard: the census answers "is this reached by some workflow", so it reads
    // identically whether or not a merge can fail on the suite.
    expect(census.partiallyCoveredDirectories.map((row) => row.directory)).not.toContain(
      GATE_APPROVAL_SUITE_DIR,
    );
    expect(census.uncoveredDirectories.map((row) => row.directory)).not.toContain(
      GATE_APPROVAL_SUITE_DIR,
    );
  });
});
