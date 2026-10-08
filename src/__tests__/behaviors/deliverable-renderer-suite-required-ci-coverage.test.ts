import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const RENDERER_SUITE_DIR = "src/lib/deliverables/orchestrator/__tests__";

/**
 * The on-disk suite count this directory is held at.
 *
 * The floor is the load-bearing half of this guard. The ownership case below
 * asserts that a REQUIRED workflow sweeps the directory, and the census cases
 * assert the directory is in neither gap list — but every one of those passes
 * VACUOUSLY on an emptied directory. A sweep of nothing is still a sweep, and a
 * directory with no suites is in no gap list. So the absence assertions are
 * paired with a count: thinning the directory fails here while they stay green.
 *
 * Raise it when suites are added. Lowering it asserts that a renderer or
 * orchestration control was deliberately retired, so it belongs in a change
 * that says which one and why.
 */
const MIN_SUITE_FILES = 59;

/**
 * Suites named individually because a floor cannot say WHICH files are there.
 *
 * These four are the ones whose subjects product code imports: `renderers.tsx`
 * produces the DOCX/PPTX/XLSX/HTML/PDF a reader opens and is imported by the
 * artifact download route, the client-approval route and the Source
 * file-cabinet deliverable bridge; `orchestrator.ts` is imported by both
 * orchestrated Move runners; `section-generation.ts` and the prompt builder are
 * reached through those.
 */
const NAMED_SUITES = [
  "renderers.test.ts",
  "orchestrator.test.ts",
  "section-generation.test.ts",
  "prompt-deck-contract.test.ts",
];

type CensusRow = { directory: string };
type Census = {
  partiallyCoveredDirectories: CensusRow[];
  uncoveredDirectories: CensusRow[];
};

function requiredCatalogJestCommands(): string[] {
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
  return readdirSync(path.join(repoRoot, RENDERER_SUITE_DIR))
    .filter((file) => /\.test\.tsx?$/.test(file))
    .sort();
}

describe("deliverable renderer suite required CI ownership", () => {
  it("sweeps the directory as a DIRECTORY in the required catalog workflow", () => {
    // A directory-BOUNDARY match, never `includes`. A substring check is
    // satisfied by a `--runTestsByPath` argument pointing at one file INSIDE
    // the directory, which owns that file and leaves every suite added later
    // unrun — the exact failure this case exists to refuse.
    const boundary = new RegExp(
      `\\bjest\\b[^&|;]*\\s${RENDERER_SUITE_DIR}(?:\\s|$)`,
    );
    const sweeping = requiredCatalogJestCommands().filter((command) =>
      boundary.test(command),
    );

    expect(sweeping).toHaveLength(1);
  });

  it("keeps the directory out of both census gap lists", () => {
    // The control for the case above: this directory was ALREADY counted
    // covered before it was wired here, because the census asks whether some
    // workflow reaches a directory and not whether a required one does. So a
    // green census is not evidence of the ownership claim, and writing that
    // down is what keeps the two from being confused.
    const census = runCensus();

    expect(census.partiallyCoveredDirectories.map((r) => r.directory)).not.toContain(
      RENDERER_SUITE_DIR,
    );
    expect(census.uncoveredDirectories.map((r) => r.directory)).not.toContain(
      RENDERER_SUITE_DIR,
    );
  });

  it("holds the directory at its suite count so the cases above cannot pass vacuously", () => {
    expect(onDiskSuiteFiles().length).toBeGreaterThanOrEqual(MIN_SUITE_FILES);
  });

  it("still holds each renderer and orchestration suite whose subject product code imports", () => {
    const onDisk = onDiskSuiteFiles();
    for (const suite of NAMED_SUITES) expect(onDisk).toContain(suite);
  });

  it("has no sibling directory that the bare-path jest regex would also select", () => {
    // Jest reads a bare path argument as a regex, so the swept path selects any
    // sibling whose name STARTS with `__tests__`. There is none today; if one
    // appears, the step silently widens and this says so.
    const parent = path.dirname(path.join(repoRoot, RENDERER_SUITE_DIR));
    const widening = readdirSync(parent, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => name.startsWith("__tests__") && name !== "__tests__");

    expect(widening).toEqual([]);
  });
});
