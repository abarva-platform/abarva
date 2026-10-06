import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const t516Files = [
  "src/app/api/knowledge/consumption/__tests__/_shared.test.ts",
  "src/app/api/setup/files/[scope]/[artifactId]/download/__tests__/route.test.ts",
  "src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts",
  "src/app/api/source/workspace/contract/[contractId]/__tests__/route.test.ts",
  "src/app/api/source/workspace/contract/[contractId]/optimization/__tests__/route.test.ts",
  "src/app/api/source/workspace/portfolio/__tests__/route.test.ts",
  "src/app/api/webhooks/clerk/__tests__/route-w4-pr3-emit.test.ts",
  "src/app/programs/expert-kernel/expert-review/export/__tests__/route.test.ts",
  "src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts",
  "src/lib/programs/queries.azure-read.test.ts",
  "src/lib/source/stage-guidebooks/__tests__/repository.test.ts",
] as const;

const t516Directories = [
  "src/app/api/knowledge/consumption/__tests__",
  "src/app/api/setup/files/[scope]/[artifactId]/download/__tests__",
  "src/app/api/source/optimize/contract/[contractId]/workflow/__tests__",
  "src/app/api/source/workspace/contract/[contractId]/__tests__",
  "src/app/api/source/workspace/contract/[contractId]/optimization/__tests__",
  "src/app/api/source/workspace/portfolio/__tests__",
  "src/app/api/webhooks/clerk/__tests__",
  "src/app/programs/expert-kernel/expert-review/export/__tests__",
  "src/lib/enterprise-data/source-adapters/__tests__",
  "src/lib/programs",
  "src/lib/source/stage-guidebooks/__tests__",
] as const;

type CensusRow = { directory: string };
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

describe("T-516 green suite CI wiring", () => {
  it("runs all eleven measured files by exact path in the pull-request workflow", () => {
    const commands = jestCommands();
    const command = commands.find((candidate) =>
      candidate.includes(t516Files[0]),
    );

    expect(command).toBeDefined();
    expect(command).toContain("--runTestsByPath");
    for (const file of t516Files) expect(command).toContain(file);
  });

  it("keeps the eleven T-516 directories out of the unrun census", () => {
    const census = runCensus();
    const uncovered = new Set(
      census.uncoveredDirectories.map((row) => row.directory),
    );
    const partial = new Set(
      census.partiallyCoveredDirectories.map((row) => row.directory),
    );

    expect(census.counts.indeterminateInvocations).toBe(0);
    for (const directory of t516Directories) {
      expect(uncovered).not.toContain(directory);
      expect(partial).not.toContain(directory);
    }
  });
});
