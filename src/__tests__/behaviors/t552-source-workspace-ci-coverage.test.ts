import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

type TriageSuite = {
  path: string;
  verdict: "wire_into_ci" | "rewrite_as_behavior" | string;
};

function triageSuites(): TriageSuite[] {
  const record = JSON.parse(
    readFileSync(
      path.join(repoRoot, "docs/architecture/t550-stale-suite-triage.json"),
      "utf8",
    ),
  ) as { suites: TriageSuite[] };

  return record.suites;
}

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

describe("T-552 Source workspace suite ownership", () => {
  it("runs exactly the triage record's seventeen wire-ready suites by exact path", () => {
    const suites = triageSuites();
    const wireReady = suites
      .filter((suite) => suite.verdict === "wire_into_ci")
      .map((suite) => suite.path);
    const rewriteRequired = suites
      .filter((suite) => suite.verdict === "rewrite_as_behavior")
      .map((suite) => suite.path);

    expect(wireReady).toHaveLength(17);
    expect(rewriteRequired).toHaveLength(3);

    const command = jestCommands().find((candidate) =>
      candidate.includes(wireReady[0]),
    );

    expect(command).toBeDefined();
    expect(command).toContain("--runTestsByPath");
    for (const file of wireReady) expect(command).toContain(file);
    for (const file of rewriteRequired) expect(command).not.toContain(file);
  });
});
