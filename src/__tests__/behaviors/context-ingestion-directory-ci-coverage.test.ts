import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");
const tree = "src/lib/context-ingestion";

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

describe("context-ingestion CI ownership", () => {
  it("names the parent tree literally in a Jest workflow command", () => {
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
    expect(commands.some((command) => command.includes(`${tree} `))).toBe(true);
  });

  it("fully covers both divergent tenant-context suites and every nested loader suite", () => {
    const census = runCensus();
    const underTree = (row: CensusRow) => row.directory.startsWith(tree);

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(census.uncoveredDirectories.filter(underTree)).toEqual([]);
    expect(census.partiallyCoveredDirectories.filter(underTree)).toEqual([]);
  });

  it("has no sibling whose name the Jest path would prefix-match", () => {
    const parent = path.dirname(tree);
    const wiredName = path.basename(tree);
    const collisions = readdirSync(path.join(repoRoot, parent)).filter(
      (entry) => entry !== wiredName && entry.startsWith(wiredName),
    );
    expect(collisions).toEqual([]);
  });
});
