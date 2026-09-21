import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const greenFiles = [
  "src/lib/governance/__tests__/inventory.test.ts",
  "src/lib/governance/__tests__/promotion-evaluator.test.ts",
  "src/lib/governance/__tests__/readiness-backfill.test.ts",
  "src/lib/governance/__tests__/tenant-coverage.test.ts",
  "src/lib/__tests__/client-config-canonical.test.ts",
  "src/lib/azure-search/__tests__/index-contracts.test.ts",
  "src/lib/azure-search/__tests__/index-results.test.ts",
  "src/lib/azure-search/__tests__/retriever-parity.test.ts",
  "src/lib/azure-search/__tests__/tenant-context-backfill.test.ts",
] as const;

const quarantinedFiles = [
  "agent-context-bundle.test.ts",
  "context-corpus-policy.test.ts",
  "dataset-manifest.test.ts",
  "active-client.test.ts",
  "control-plane-tenant-purity.test.ts",
  "supabase-server.test.ts",
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

describe("governance and tenant library CI ownership", () => {
  it("runs all nine newly-owned green files and no quarantined file", () => {
    const command = jestCommands().find((candidate) =>
      candidate.includes("governance/__tests__/inventory.test.ts"),
    );

    expect(command).toBeDefined();
    for (const file of greenFiles) expect(command).toContain(file);
    for (const file of quarantinedFiles) expect(command).not.toContain(file);
  });

  it("keeps each measured green/red split visible in the census", () => {
    const census = runCensus();
    const partial = (directory: string) =>
      census.partiallyCoveredDirectories.find((row) => row.directory === directory);

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(partial("src/lib/governance/__tests__")).toMatchObject({
      testFiles: 8,
      coveredTestFiles: 5,
    });
    expect(partial("src/lib/__tests__")).toMatchObject({
      testFiles: 4,
      coveredTestFiles: 1,
    });
    expect(partial("src/lib/azure-search/__tests__")).toBeUndefined();
    expect(
      census.uncoveredDirectories.some(
        (row) => row.directory === "src/lib/azure-search/__tests__",
      ),
    ).toBe(false);
  });
});
