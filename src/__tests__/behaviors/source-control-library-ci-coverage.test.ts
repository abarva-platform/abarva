import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const greenFiles = [
  "src/lib/corpus/azure-search.test.ts",
  "src/lib/corpus/industry-scope.test.ts",
  "src/lib/corpus/retrieval.test.ts",
  "src/lib/source/contract-optimization/__tests__/contract-optimization-mve.test.ts",
  "src/lib/source/contract-optimization/__tests__/eligibility.test.ts",
  "src/lib/source/contract-optimization/__tests__/read.test.ts",
] as const;

const quarantinedFiles = [
  "src/app/api/v1/atlas/__tests__/auth-boundary.test.ts",
  "src/app/api/v1/atlas/__tests__/auth-user-id-normalization.test.ts",
  "src/app/api/v1/atlas/__tests__/mode-visibility.test.ts",
] as const;

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

describe("Source control library CI ownership", () => {
  it("runs all six green files and no red Atlas file", () => {
    const command = jestCommands().find((candidate) =>
      candidate.includes("src/lib/corpus/azure-search.test.ts"),
    );

    expect(command).toBeDefined();
    for (const file of greenFiles) expect(command).toContain(file);
    for (const file of quarantinedFiles) expect(command).not.toContain(file);
  });

  it("moves the two green directories out of the uncovered census", () => {
    const census = runCensus();
    const uncovered = (directory: string) =>
      census.uncoveredDirectories.some((row) => row.directory === directory);
    const partial = (directory: string) =>
      census.partiallyCoveredDirectories.find((row) => row.directory === directory);

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(uncovered("src/lib/corpus")).toBe(false);
    expect(uncovered("src/lib/source/contract-optimization/__tests__")).toBe(false);
    expect(partial("src/app/api/v1/atlas/__tests__")).toBeUndefined();
    expect(uncovered("src/app/api/v1/atlas/__tests__")).toBe(true);
  });
});
