import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const ownedFiles = [
  "src/app/(maestro)/admin/connectors/_actions/__tests__/create-pending-connector.test.ts",
  "src/app/(maestro)/admin/users-access/_actions/__tests__/send-invite.test.ts",
  "src/app/(maestro)/source/new/[eventId]/page.test.tsx",
  "src/app/(maestro)/source/optimize/__tests__/page.financial-access.test.tsx",
] as const;

const ownedDirectories = [
  "src/app/(maestro)/admin/connectors/_actions/__tests__",
  "src/app/(maestro)/admin/users-access/_actions/__tests__",
  "src/app/(maestro)/source/new/[eventId]",
  "src/app/(maestro)/source/optimize/__tests__",
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

describe("admin and Source action/route suite CI ownership", () => {
  it("runs the four measured files in one exact-path pull-request command", () => {
    const commands = jestCommands();
    const command = commands.find((candidate) =>
      candidate.includes(ownedFiles[0]),
    );

    expect(command).toBeDefined();
    expect(command).toContain("--runTestsByPath");
    for (const file of ownedFiles) expect(command).toContain(file);
  });

  it("keeps every owned directory out of the uncovered and partial census", () => {
    const census = runCensus();
    const uncovered = new Set(
      census.uncoveredDirectories.map((row) => row.directory),
    );
    const partial = new Set(
      census.partiallyCoveredDirectories.map((row) => row.directory),
    );

    expect(census.counts.indeterminateInvocations).toBe(0);
    for (const directory of ownedDirectories) {
      expect(uncovered).not.toContain(directory);
      expect(partial).not.toContain(directory);
    }
  });
});
