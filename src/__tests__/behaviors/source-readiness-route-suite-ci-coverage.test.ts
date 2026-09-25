import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  expandWorkflowCommands,
  extractWorkflowRunCommands,
} from "../../../scripts/quality/check-integration-ci-visibility.mjs";

const repoRoot = path.resolve(__dirname, "../../..");

const ownedFiles = [
  "src/lib/source/rfp-readiness/__tests__/ams-section-map.test.ts",
  "src/lib/source/rfp-readiness/__tests__/intake.test.ts",
  "src/lib/source/rfp-readiness/__tests__/resolver.test.ts",
  "src/lib/source/rfp-readiness/__tests__/section-trace.test.ts",
  "src/app/(maestro)/source/__tests__/new-route-optimization-redirect.test.ts",
  // U-511 (2026-09-22): the not-found suite joins the owned set. It was
  // quarantined as "source-text-only", which stopped being true when it was
  // rewritten to mount the component; it is now the only assertion of Source's
  // access-guard disclosure behaviour, and it ran nowhere.
  "src/app/(maestro)/source/__tests__/not-found-source.test.tsx",
  // U-514 (2026-09-25): the requester-estimate disclosure suite. It renders
  // both Source approval surfaces and is the only assertion that a declared
  // figure carries its provenance label, so it joins the owned set in the same
  // change that created it rather than in a later one.
  "src/app/(maestro)/source/__tests__/requester-estimate-disclosure.test.tsx",
] as const;

const quarantinedFiles = [
  "src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.tsx",
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

describe("Source readiness and route suite CI ownership", () => {
  // Both lists are checked against the tree first. Until U-511 they were not,
  // and both quarantine entries had drifted: each named a `.test.ts` path that
  // no longer existed, because the suites were renamed to `.tsx` when they were
  // rewritten to render. The assertion still passed -- `.test.tsx` contains
  // `.test.ts` as a substring -- so the quarantine half of this control was
  // pinning two filenames that were not in the repository.
  it("pins paths that exist", () => {
    for (const file of [...ownedFiles, ...quarantinedFiles]) {
      expect({ file, exists: existsSync(path.join(repoRoot, file)) }).toEqual({
        file,
        exists: true,
      });
    }
  });

  it("runs the seven behavior-bearing suites and leaves the exact quarantine out", () => {
    const commands = jestCommands();
    const command = commands.find((candidate) =>
      candidate.includes(ownedFiles[0]),
    );

    expect(command).toBeDefined();
    expect(command).toContain("--runTestsByPath");
    for (const file of ownedFiles) expect(command).toContain(file);
    for (const file of quarantinedFiles) {
      expect(commands.every((candidate) => !candidate.includes(file))).toBe(true);
    }
  });

  it("owns the readiness tree and keeps the route-tree quarantine visible", () => {
    const census = runCensus();
    const partial = (directory: string) =>
      census.partiallyCoveredDirectories.find(
        (row) => row.directory === directory,
      );
    const uncovered = (directory: string) =>
      census.uncoveredDirectories.some((row) => row.directory === directory);

    expect(census.counts.indeterminateInvocations).toBe(0);
    expect(uncovered("src/lib/source/rfp-readiness/__tests__")).toBe(false);
    expect(partial("src/lib/source/rfp-readiness/__tests__")).toBeUndefined();
    // 1 -> 2 of 3: U-511 wired the not-found suite. 3 of 4: U-514 added the
    // requester-estimate disclosure suite and wired it in the same change. The
    // remaining uncovered file, the tenant-named source scanner, is still the
    // exact quarantine above — the covered count moves with each wiring and
    // the total moves with each new file, so neither can drift unnoticed.
    expect(partial("src/app/(maestro)/source/__tests__")).toMatchObject({
      testFiles: 4,
      coveredTestFiles: 3,
    });
  });
});
