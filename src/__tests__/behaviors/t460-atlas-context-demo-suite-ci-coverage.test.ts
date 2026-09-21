/**
 * T-460 — the four suites wired this round stay wired, and the two that were
 * rewritten stay behavioural.
 *
 * The first two cases are the ownership guard used by the earlier rounds. The
 * third is specific to what this round found: two of these suites asserted an
 * Atlas control by reading the route's own source as text, which passes on a
 * route that deletes the control and leaves its name in a comment. Reading a
 * migration or a module that cannot be invoked is still allowed; reading the
 * subject that the suite could call instead is not.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const atlasFiles = [
  "src/app/api/v1/atlas/__tests__/auth-boundary.test.ts",
  "src/app/api/v1/atlas/__tests__/auth-user-id-normalization.test.ts",
  "src/app/api/v1/atlas/__tests__/mode-visibility.test.ts",
] as const;

const ownedFiles = [
  ...atlasFiles,
  "src/app/api/context/demo/__tests__/route.test.ts",
] as const;

const ownedDirectories = [
  "src/app/api/v1/atlas/__tests__",
  "src/app/api/context/demo/__tests__",
] as const;

/** Sources the Atlas suites can invoke, so must not assert by reading. */
const invocableSubjects = [
  "src/app/api/v1/atlas/_auth.ts",
  "src/app/api/v1/atlas/chat/route.ts",
  "src/app/api/v1/atlas/ask/route.ts",
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
    [
      path.join(repoRoot, "scripts/quality/test-ci-coverage-census.mjs"),
      "--json",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  return JSON.parse(output.slice(output.indexOf("{"))) as Census;
}

describe("Atlas v1 auth and context demo suite ownership", () => {
  it("runs all four measured files in one pull-request workflow command", () => {
    const command = jestCommands().find((candidate) =>
      candidate.includes(ownedFiles[0]),
    );

    expect(command).toBeDefined();
    for (const file of ownedFiles) expect(command).toContain(file);
  });

  it("moves both measured directories out of the census gap lists", () => {
    const census = runCensus();
    const gapRows = [
      ...census.partiallyCoveredDirectories,
      ...census.uncoveredDirectories,
    ];

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(
      gapRows.filter((row) =>
        ownedDirectories.includes(
          row.directory as (typeof ownedDirectories)[number],
        ),
      ),
    ).toEqual([]);
  });

  it.each(atlasFiles)(
    "%s asserts the Atlas control by invoking it, not by reading its source",
    (file) => {
      const source = readFileSync(path.join(repoRoot, file), "utf8");

      for (const subject of invocableSubjects) {
        expect(source).not.toContain(subject);
      }
    },
  );

  it("the boundary suite drives the boundary it names", () => {
    const source = readFileSync(path.join(repoRoot, atlasFiles[0]), "utf8");

    expect(source).toContain("requireAtlasTenancy(");
    expect(source).toMatch(/rejects\./);
  });
});
