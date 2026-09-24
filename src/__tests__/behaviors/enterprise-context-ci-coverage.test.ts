import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const greenFiles = [
  "chunking.test.ts",
  "client-enterprise-context-datasets.test.ts",
  // Wired 2026-09-24 under item T-756. It was quarantined as one of the two red
  // files; the redness was six stale expectations behind the record-type alias
  // separation and one lost spend binding, and both are repaired.
  "intelligence-read-model.test.ts",
  "meridian-ingestion-plan.test.ts",
  "meridian-refresh-simulator.test.ts",
  "meridian-synthetic-dataset.test.ts",
  "schema.test.ts",
  "template-schema.test.ts",
] as const;

// derived-enterprise-read stays quarantined, and deliberately: it is red
// because the local dataset roots its loader reads were deleted when the
// canonical tenant input standard replaced them, which is a retire-or-rewire
// decision rather than a re-baseline, and it is held by its own open item.
const quarantinedFiles = ["derived-enterprise-read.test.ts"] as const;

type CensusRow = {
  directory: string;
  testFiles: number;
  coveredTestFiles: number;
};
type Census = {
  counts: { indeterminateInvocations: number };
  partiallyCoveredDirectories: CensusRow[];
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

describe("enterprise-context suite CI ownership", () => {
  it("runs every measured green file and no quarantined file", () => {
    const command = jestCommands().find((candidate) =>
      candidate.includes("enterprise-context/__tests__/chunking.test.ts"),
    );

    expect(command).toBeDefined();
    for (const file of greenFiles) {
      expect(command).toContain(`src/lib/enterprise-context/__tests__/${file}`);
    }
    for (const file of quarantinedFiles) {
      expect(command).not.toContain(file);
    }
  });

  it("keeps the eight-green, one-red split visible in the census", () => {
    const census = runCensus();
    const row = census.partiallyCoveredDirectories.find(
      (candidate) => candidate.directory === "src/lib/enterprise-context/__tests__",
    );

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(row).toMatchObject({ testFiles: 9, coveredTestFiles: 8 });
  });
});
