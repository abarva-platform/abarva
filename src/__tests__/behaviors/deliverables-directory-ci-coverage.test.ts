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
  testFiles?: number;
  coveredTestFiles?: number;
  declaredQuarantineTestFiles?: number;
  untriagedUnrunTestFiles?: number;
  via?: string[];
};
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

describe("deliverables CI ownership", () => {
  it("runs the repaired directories and only the previously dark component suite", () => {
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
      commands.some(
        (command) =>
          command.includes("src/lib/deliverables/__tests__") &&
          command.includes("src/lib/deliverables/orchestrator/__tests__"),
      ),
    ).toBe(true);
    expect(
      commands.some((command) => command.includes("src/lib/deliverables ")),
    ).toBe(false);
    expect(
      commands.some((command) =>
        command.includes(
          "src/components/deliverables/__tests__/ApproveActions.test.tsx",
        ),
      ),
    ).toBe(true);
    expect(
      commands.some((command) => command.includes("src/components/deliverables ")),
    ).toBe(false);
  });

  it("leaves only the explicitly orphaned synthesis suite dark", () => {
    const census = runCensus();
    const isDeliverables = (row: CensusRow) =>
      row.directory.startsWith("src/lib/deliverables") ||
      row.directory === "src/components/deliverables/__tests__" ||
      (row.directory.startsWith("src/app/api/") &&
        row.directory.includes("/deliverables/"));

    expect(census.counts.indeterminateInvocations).toBe(0);
    // Exact shape, deliberately: an extra field on a census row is how an
    // unintended addition reaches the committed artifact. The two counts below
    // joined the row under T-471, which split the uncovered set into files a
    // command names and then excludes (triaged) and files nothing names at
    // all. This suite is the second kind — dark, not quarantined — so its
    // single unrun file is untriaged.
    expect(census.uncoveredDirectories.filter(isDeliverables)).toEqual([
      {
        directory: "src/lib/deliverables/synthesis/__tests__",
        testFiles: 1,
        coveredTestFiles: 0,
        declaredQuarantineTestFiles: 0,
        untriagedUnrunTestFiles: 1,
        via: [],
      },
    ]);
    expect(census.partiallyCoveredDirectories.filter(isDeliverables)).toEqual([]);
  });
});
