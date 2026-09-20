import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

type CensusRow = { directory: string };
type Census = {
  counts: { indeterminateInvocations: number };
  partiallyCoveredDirectories: CensusRow[];
  uncoveredDirectories: CensusRow[];
};

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

describe("admin component CI ownership", () => {
  it("runs the parent component tree so new nested suites inherit coverage", () => {
    const workflow = readFileSync(
      path.join(repoRoot, ".github/workflows/unit-suites.yml"),
      "utf8",
    );
    const scripts = JSON.parse(
      readFileSync(path.join(repoRoot, "package.json"), "utf8"),
    ).scripts as Record<string, string>;
    const commands = expandWorkflowCommands(
      extractWorkflowRunCommands(workflow),
      scripts,
    ).filter((command) => /\b(?:npx\s+)?jest\b/.test(command));

    expect(
      commands.some((command) => command.includes("src/components/admin ")),
    ).toBe(true);
  });

  it("leaves no admin component directory dark or partially covered", () => {
    const census = runCensus();
    const isAdminComponent = (row: CensusRow) =>
      row.directory === "src/components/admin" ||
      row.directory.startsWith("src/components/admin/");

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(census.uncoveredDirectories.filter(isAdminComponent)).toEqual([]);
    expect(census.partiallyCoveredDirectories.filter(isAdminComponent)).toEqual([]);
  });
});
