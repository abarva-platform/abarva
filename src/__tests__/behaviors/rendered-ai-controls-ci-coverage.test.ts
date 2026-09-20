import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const governedDirectories = [
  "src/components/abarva/__tests__",
  "src/components/strategic-moves/phase-workspace/__tests__",
  "src/app/(maestro)/admin/programs/approvals/_actions/__tests__",
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

describe("rendered AI control suite CI ownership", () => {
  it("runs both rendered-component parent trees", () => {
    const commands = jestCommands();

    expect(
      commands.some((candidate) =>
        candidate.includes("src/components/abarva/__tests__ "),
      ),
    ).toBe(true);
    expect(
      commands.some((candidate) =>
        candidate.includes(
          "src/components/strategic-moves/phase-workspace/__tests__ ",
        ),
      ),
    ).toBe(true);
  });

  it("runs both approval-action files by exact path", () => {
    const command = jestCommands().find((candidate) =>
      candidate.includes("programs/approvals/_actions/__tests__"),
    );

    expect(command).toContain("--runTestsByPath");
    expect(command).toContain("escalate-approval.test.ts");
    expect(command).toContain("notify-sponsor.test.ts");
  });

  it("keeps all three directories fully owned in the generated census", () => {
    const census = runCensus();
    const incomplete = [
      ...census.partiallyCoveredDirectories,
      ...census.uncoveredDirectories,
    ];

    expect(census.counts.indeterminateInvocations).toBe(0);
    for (const directory of governedDirectories) {
      expect(
        incomplete.find((candidate) => candidate.directory === directory),
      ).toBeUndefined();
    }
  });
});
