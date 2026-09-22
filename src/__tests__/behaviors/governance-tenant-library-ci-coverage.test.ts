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
  // T-559 (2026-09-22) moved this file out of `quarantinedFiles` below. It was
  // quarantined for "active-client display-name drift" -- three expectations
  // pinning display names a later change had deliberately replaced. Those were
  // repaired and the file is green, so the step now owns it. The move is the
  // whole point of the control: a file leaves quarantine by being fixed and
  // measured, never by being dropped from the list.
  "src/lib/__tests__/active-client.test.ts",
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
  it("runs all ten owned green files and no quarantined file", () => {
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
    // 5 of 8 -> ALL 8. T-523 wired the three remaining files by exact path, so
    // the directory is no longer a split at all and drops out of the partial
    // bucket. The census publishes only the partial and uncovered buckets, so
    // "fully covered" is asserted the way this file already asserts it for
    // `azure-search` below: absent from BOTH. Checking only the partial bucket
    // would pass equally well for a directory that had vanished from the
    // census entirely, which is why the uncovered half is asserted too.
    expect(partial("src/lib/governance/__tests__")).toBeUndefined();
    expect(
      census.uncoveredDirectories.some(
        (row) => row.directory === "src/lib/governance/__tests__",
      ),
    ).toBe(false);
    // 1 -> 2: T-559 repaired and wired `active-client.test.ts`. The two still
    // uncovered here are a control-plane tenant-literal floor with live findings
    // and a tenant-database fail-closed suite; both are real, neither is this
    // change's to fix, and the split stays visible rather than being rounded off.
    expect(partial("src/lib/__tests__")).toMatchObject({
      testFiles: 4,
      coveredTestFiles: 2,
    });
    expect(partial("src/lib/azure-search/__tests__")).toBeUndefined();
    expect(
      census.uncoveredDirectories.some(
        (row) => row.directory === "src/lib/azure-search/__tests__",
      ),
    ).toBe(false);
  });
});
