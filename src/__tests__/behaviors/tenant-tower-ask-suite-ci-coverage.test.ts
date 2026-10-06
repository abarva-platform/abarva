import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const tenantFiles = [
  "src/lib/tenant/__tests__/aliases.test.ts",
  "src/lib/tenant/__tests__/foundation-tenants.test.ts",
  "src/lib/tenant/__tests__/resolveTenant.test.ts",
] as const;

const ownedFiles = [
  ...tenantFiles,
  "src/scripts/tower/__tests__/project-tower-mart-client-resolver.test.ts",
  "src/scripts/tower/__tests__/project-tower-mart-source-contracts.test.ts",
  "src/scripts/tower/__tests__/project-tower-mart-write.test.ts",
  "src/app/(maestro)/admin/users-access/notifications/_actions/__tests__/save-preferences.test.ts",
  "src/app/(maestro)/admin/users-access/notifications/_actions/__tests__/send-test.test.ts",
  "src/app/api/intelligence/ask/__tests__/route.source-contract-authority.test.ts",
  "src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts",
] as const;

const ownedDirectories = [
  "src/lib/tenant/__tests__",
  "src/scripts/tower/__tests__",
  "src/app/(maestro)/admin/users-access/notifications/_actions/__tests__",
  "src/app/api/intelligence/ask/__tests__",
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

describe("tenant, Tower, notification, and Intelligence Ask suite ownership", () => {
  it.each(tenantFiles)(
    "%s derives its coverage from CANONICAL_TENANT_KEYS",
    (file) => {
      const source = readFileSync(path.join(repoRoot, file), "utf8");

      expect(source).toMatch(
        /import\s*{[\s\S]*?CANONICAL_TENANT_KEYS[\s\S]*?}\s*from\s*["'](?:@\/lib\/tenant\/aliases|\.\.\/aliases)["']/,
      );
      expect(source).not.toMatch(
        /(?:const|let|var)\s+CANONICAL_TENANT_KEYS\s*=/,
      );
    },
  );

  it("runs all ten measured files in one pull-request workflow command", () => {
    const command = jestCommands().find((candidate) =>
      candidate.includes(ownedFiles[0]),
    );

    expect(command).toBeDefined();
    for (const file of ownedFiles) expect(command).toContain(file);
  });

  it("moves all four measured directories out of the census gap lists", () => {
    const census = runCensus();
    const gapRows = [
      ...census.partiallyCoveredDirectories,
      ...census.uncoveredDirectories,
    ];

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(
      gapRows.filter((row) =>
        ownedDirectories.includes(row.directory as (typeof ownedDirectories)[number]),
      ),
    ).toEqual([]);
  });
});
