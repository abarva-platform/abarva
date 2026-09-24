import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const ownedFiles = [
  "src/lib/source/contract-evidence/__tests__/evidence-review.test.ts",
  // Wired 2026-09-24 under item T-756. Its quarantine reason was "the current
  // suite is red after application inventory became required"; the suite is
  // re-baselined against the commit that added that family, so the reason is
  // discharged rather than worked around.
  "src/lib/source/contract-evidence/__tests__/templates.test.ts",
  "src/lib/source/contract-intelligence/__tests__/cloud-adapter.test.ts",
  "src/lib/source/contract-intelligence/__tests__/education.test.ts",
] as const;

const quarantinedFiles = [
  {
    path: "src/lib/source/contract-evidence/__tests__/persistence.test.ts",
    reason: "the fixture has no register contract identity, so it cannot reproduce the live identity split",
  },
  {
    path: "src/lib/source/contract-evidence/__tests__/read-model.test.ts",
    reason: "the fixture has no register contract identity, so it cannot reproduce the live identity split",
  },
  {
    path: "src/lib/source/contract-intelligence/__tests__/prompt.test.ts",
    reason: "the suite only checks prompt strings and the subject has no non-test importer",
  },
  {
    path: "src/lib/source/contract-intelligence/__tests__/provenance.test.ts",
    reason: "the refusal behavior is real, but no runtime non-test importer executes the validators",
  },
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

describe("Source contract suite CI ownership", () => {
  it("runs only the four green, imported, behavior-bearing suites", () => {
    const commands = jestCommands();
    const command = commands.find((candidate) => candidate.includes(ownedFiles[0]));

    expect(command).toBeDefined();
    for (const file of ownedFiles) expect(command).toContain(file);
    for (const entry of quarantinedFiles) {
      expect(commands.some((candidate) => candidate.includes(entry.path))).toBe(false);
      expect(entry.reason).not.toHaveLength(0);
    }
  });

  it("moves both directories from uncovered to the exact partial census", () => {
    const census = runCensus();
    const uncovered = (directory: string) =>
      census.uncoveredDirectories.some((row) => row.directory === directory);
    const partial = (directory: string) =>
      census.partiallyCoveredDirectories.find((row) => row.directory === directory);

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(uncovered("src/lib/source/contract-evidence/__tests__")).toBe(false);
    expect(partial("src/lib/source/contract-evidence/__tests__")).toMatchObject({
      testFiles: 4,
      coveredTestFiles: 2,
    });
    expect(uncovered("src/lib/source/contract-intelligence/__tests__")).toBe(false);
    expect(partial("src/lib/source/contract-intelligence/__tests__")).toMatchObject({
      testFiles: 4,
      coveredTestFiles: 2,
    });
  });
});
