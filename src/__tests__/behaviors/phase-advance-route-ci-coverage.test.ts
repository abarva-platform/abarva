import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");
const unownedRoute =
  "src/app/api/programs/phase-gate/__tests__/route.test.ts";
const governedDirectories = [
  "src/app/api/programs/phase-gate/__tests__",
  "src/app/api/v1/programs/[programId]/advance/__tests__",
] as const;

type CensusRow = { directory: string; testFiles: number; coveredTestFiles: number };
type Census = {
  counts: { indeterminateInvocations: number };
  partiallyCoveredDirectories: CensusRow[];
  uncoveredDirectories: CensusRow[];
};

function jestCommands(): string[] {
  const workflow = readFileSync(
    path.join(repoRoot, ".github/workflows/unit-suites.yml"),
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

describe("phase-advance route CI ownership", () => {
  it("runs the remaining unowned lifecycle-write route by exact path", () => {
    const command = jestCommands().find(
      (candidate) =>
        candidate.includes("--runTestsByPath") &&
        candidate.includes(unownedRoute),
    );

    expect(command).toBeDefined();
  });

  it("moves both governed-write directories out of the unrun census", () => {
    const census = runCensus();

    expect(census.counts.indeterminateInvocations).toBe(0);
    for (const directory of governedDirectories) {
      expect(
        census.partiallyCoveredDirectories.some(
          (candidate) => candidate.directory === directory,
        ),
      ).toBe(false);
      expect(
        census.uncoveredDirectories.some(
          (candidate) => candidate.directory === directory,
        ),
      ).toBe(false);
    }
  });
});
