import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const GENERATION_SUITE_DIR = "src/lib/deliverables/__tests__";

/**
 * The required workflow that now owns the directory. `unit-suites.yml` named it
 * too, and that is the point of this suite rather than a duplicate of it: that
 * workflow's job is in none of the required contexts, so naming a directory
 * there runs the suites where no merge can fail on the answer.
 */
const REQUIRED_WORKFLOW = ".github/workflows/ai-surface-control-catalog.yml";

/**
 * The on-disk suite count the directory is held at.
 *
 * The naming case above passes vacuously once the directory is empty — a step
 * can name a path that holds nothing. So the ownership claim is paired with a
 * count: thinning the directory fails here while every other case stays green.
 *
 * Raise it when suites are added. Lowering it asserts that a generation
 * precondition was deliberately retired, so it belongs in a change that says
 * which one and why.
 */
const MIN_SUITE_FILES = 36;

/**
 * The suites that put this directory on the phase-to-document path, named
 * individually because the floor alone cannot tell which 36 files are present.
 * `moves-generate-deps` resolves gateApproved / captureComplete /
 * loadDecisions / loadPhaseCapture for the Moves generate route, the queue
 * worker, the sign-off route and the agent's draftArtifact tool.
 */
const GENERATION_PRECONDITION_SUITES = [
  "moves-generate-deps.test.ts",
  "generate-artifact.test.ts",
  "evidence-package-readiness.test.ts",
  "legacy-generate-policy.test.ts",
  "persist-move-generated-artifact.test.ts",
];

type CensusRow = { directory: string };
type Census = {
  partiallyCoveredDirectories: CensusRow[];
  uncoveredDirectories: CensusRow[];
};

function jestCommands(): string[] {
  const workflow = readFileSync(path.join(repoRoot, REQUIRED_WORKFLOW), "utf8");
  const scripts = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts as Record<string, string>;
  return expandWorkflowCommands(
    extractWorkflowRunCommands(workflow),
    scripts,
  ).filter((command) => /\b(?:npx\s+)?jest\b/.test(command));
}

function onDiskSuiteFiles(): string[] {
  return readdirSync(path.join(repoRoot, GENERATION_SUITE_DIR))
    .filter((file) => /\.test\.tsx?$/.test(file))
    .sort();
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

describe("deliverable-generation suite required-CI ownership", () => {
  it("sweeps the directory from the required catalog workflow", () => {
    const command = jestCommands().find((candidate) =>
      new RegExp(`\\bjest\\b[^&|;]*\\s${GENERATION_SUITE_DIR}(?:\\s|$)`).test(
        candidate,
      ),
    );

    // A directory sweep, not a --runTestsByPath list, so a suite added to the
    // directory is owned without editing the workflow.
    expect(command).toBeDefined();
    expect(command).not.toContain("--runTestsByPath");
  });

  it("holds the directory at its suite count so the ownership case cannot pass vacuously", () => {
    expect(onDiskSuiteFiles().length).toBeGreaterThanOrEqual(MIN_SUITE_FILES);
  });

  it("still holds each generation-precondition suite on disk", () => {
    const onDisk = onDiskSuiteFiles();
    for (const suite of GENERATION_PRECONDITION_SUITES) {
      expect(onDisk).toContain(suite);
    }
  });

  it("records that the coverage census cannot see merge-darkness here", () => {
    const census = runCensus();

    // The directory was already absent from both gap lists BEFORE the required
    // sweep was added, and it is absent after. That is the finding, not a
    // regression guard: the census answers "is this reached by some workflow",
    // so it reads identically whether or not a merge can fail on the suites.
    // The required-sweep case above is the only one that moves.
    expect(census.partiallyCoveredDirectories.map((r) => r.directory)).not.toContain(
      GENERATION_SUITE_DIR,
    );
    expect(census.uncoveredDirectories.map((r) => r.directory)).not.toContain(
      GENERATION_SUITE_DIR,
    );
  });
});
