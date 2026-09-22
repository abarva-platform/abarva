import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const quarantined = [
  "access-routing.test.ts",
  "legacy-tenant-sunset.test.ts",
  "private-browser-proof-session.test.ts",
  "program-access-policy.test.ts",
  "source-access-policy.test.ts",
  "tenant-isolation-probes.test.ts",
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

describe("auth and tenancy suite CI ownership", () => {
  it("runs the parent tree while naming every red suite in the quarantine", () => {
    const command = jestCommands().find((candidate) =>
      candidate.includes("src/lib/auth/__tests__ "),
    );

    expect(command).toBeDefined();
    expect(command).toContain("--testPathIgnorePatterns");
    for (const file of quarantined) {
      expect(command).toContain(`src/lib/auth/__tests__/${file}`);
    }
  });

  it("keeps the measured green/red split visible in the generated census", () => {
    const census = runCensus();
    const row = census.partiallyCoveredDirectories.find(
      (candidate) => candidate.directory === "src/lib/auth/__tests__",
    );

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(row).toMatchObject({ testFiles: 20, coveredTestFiles: 14 });
    expect(
      census.uncoveredDirectories.some(
        (candidate) => candidate.directory === "src/lib/auth/__tests__",
      ),
    ).toBe(false);
  });
});
