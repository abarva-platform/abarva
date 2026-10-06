import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

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

function findDirectory(census: Census, directory: string): CensusRow | undefined {
  return [...census.partiallyCoveredDirectories, ...census.uncoveredDirectories].find(
    (candidate) => candidate.directory === directory,
  );
}

describe("liability and product-truth suite CI ownership", () => {
  it("runs every liability suite once across the existing exact owner and parent owner", () => {
    const commands = jestCommands();
    const rationalePath =
      "src/lib/ai-liability/__tests__/human-decision-controls.human-rationale.test.ts";
    const exact = commands.find(
      (candidate) =>
        candidate.includes("--runTestsByPath") &&
        candidate.includes(rationalePath),
    );
    const parent = commands.find((candidate) =>
      candidate.includes("src/lib/ai-liability/__tests__ "),
    );

    expect(exact).toBeDefined();
    expect(parent).toContain("--testPathIgnorePatterns");
    expect(parent).toContain(rationalePath);
  });

  it("runs the product-truth parent tree", () => {
    expect(
      jestCommands().some((candidate) =>
        candidate.includes("src/lib/agent/product-truth/__tests__ "),
      ),
    ).toBe(true);
  });

  it("keeps both control directories fully owned in the generated census", () => {
    const census = runCensus();

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(findDirectory(census, "src/lib/ai-liability/__tests__")).toBeUndefined();
    expect(findDirectory(census, "src/lib/agent/product-truth/__tests__")).toBeUndefined();
  });
});
