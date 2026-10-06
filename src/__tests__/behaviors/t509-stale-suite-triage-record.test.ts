import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../..");
const recordPath = path.join(
  repoRoot,
  "docs/architecture/t509-stale-suite-triage.json",
);

const expectedSuites = [
  "src/__tests__/integration/app-rail-home-nav.test.ts",
  "src/__tests__/integration/app-topbar-prefetch-guard.test.ts",
  "src/__tests__/integration/ask-anything-bar-agent-answer.test.ts",
  "src/__tests__/integration/atlas-ask-route.test.ts",
  "src/__tests__/integration/deliverable-render-contract.test.ts",
  "src/__tests__/integration/learn-welcome-cxo-toggle.test.ts",
  "src/__tests__/integration/marketing-nav-dropdowns.test.tsx",
  "src/__tests__/integration/shell-topbar-auth.test.ts",
  "src/__tests__/integration/sign-in-shell.test.tsx",
] as const;

const t513Suites = new Set([
  "src/__tests__/integration/app-rail-home-nav.test.ts",
  "src/__tests__/integration/app-topbar-prefetch-guard.test.ts",
  "src/__tests__/integration/ask-anything-bar-agent-answer.test.ts",
  "src/__tests__/integration/learn-welcome-cxo-toggle.test.ts",
  "src/__tests__/integration/shell-topbar-auth.test.ts",
]);

type Verdict = "repair" | "update_with_reason_recorded" | "rewrite_as_behavior";

type SuiteRecord = {
  path: string;
  loaded: boolean;
  collected: boolean;
  run: boolean;
  green: boolean;
  totalTests: number;
  failedTests: number;
  passedTests: number;
  verdict: Verdict;
  ownerItem: string;
  evidence: string[];
  rationale: string;
  currentAction: string;
};

type TriageRecord = {
  item: "T-509";
  base: {
    branch: string;
    originMainSha: string;
  };
  jestEvidence: {
    command: string;
    outputFile: string;
    totalSuites: number;
    failedSuites: number;
    totalTests: number;
    failedTests: number;
    passedTests: number;
  };
  suites: SuiteRecord[];
  forbiddenEdits: string[];
  claimedWriteFiles: string[];
};

function parseRecord(): TriageRecord {
  return JSON.parse(readFileSync(recordPath, "utf8")) as TriageRecord;
}

function validateRecord(record: TriageRecord): void {
  expect(record.item).toBe("T-509");
  expect(record.base.branch).toBe("codex/t509-stale-suite-triage");
  expect(record.base.originMainSha).toMatch(/^[0-9a-f]{40}$/);
  expect(record.jestEvidence.command).toContain("npx jest");
  expect(record.jestEvidence.outputFile).toBe("/tmp/t509-jest-current.json");

  const paths = record.suites.map((suite) => suite.path).sort();
  expect(paths).toEqual([...expectedSuites].sort());
  expect(new Set(paths).size).toBe(expectedSuites.length);

  const totalTests = record.suites.reduce(
    (sum, suite) => sum + suite.totalTests,
    0,
  );
  const failedTests = record.suites.reduce(
    (sum, suite) => sum + suite.failedTests,
    0,
  );
  const passedTests = record.suites.reduce(
    (sum, suite) => sum + suite.passedTests,
    0,
  );
  expect(record.jestEvidence.totalSuites).toBe(expectedSuites.length);
  expect(record.jestEvidence.failedSuites).toBe(expectedSuites.length);
  expect(record.jestEvidence.totalTests).toBe(totalTests);
  expect(record.jestEvidence.failedTests).toBe(failedTests);
  expect(record.jestEvidence.passedTests).toBe(passedTests);

  for (const suite of record.suites) {
    expect(suite.loaded).toBe(true);
    expect(suite.collected).toBe(true);
    expect(suite.run).toBe(true);
    expect(suite.green).toBe(false);
    expect(suite.totalTests).toBeGreaterThan(0);
    expect(suite.failedTests).toBeGreaterThan(0);
    expect(suite.passedTests + suite.failedTests).toBe(suite.totalTests);
    expect([
      "repair",
      "update_with_reason_recorded",
      "rewrite_as_behavior",
    ]).toContain(suite.verdict);
    expect(suite.ownerItem).toMatch(/^T-\d+$/);
    expect(suite.evidence.length).toBeGreaterThan(0);
    expect(suite.rationale.trim().length).toBeGreaterThan(0);
    expect(suite.currentAction.trim().length).toBeGreaterThan(0);
  }

  for (const suitePath of t513Suites) {
    const suite = record.suites.find((entry) => entry.path === suitePath);
    expect(suite).toBeDefined();
    expect(suite!.ownerItem).toBe("T-513");
    expect(suite!.verdict).toBe("rewrite_as_behavior");
  }

  expect(record.forbiddenEdits).toEqual(
    expect.arrayContaining([
      ...t513Suites,
      ".github/workflows/integration-suites.yml",
    ]),
  );
  expect(record.claimedWriteFiles).toEqual([
    "docs/architecture/t509-stale-suite-triage.json",
    "src/__tests__/behaviors/t509-stale-suite-triage-record.test.ts",
    "docs/releases/records/2026-09-21-t509-stale-suite-triage.md",
    "/Users/anand/Downloads/EXECUTION_CLAIMS.md",
    "/Users/anand/Downloads/EXECUTION_BACKLOG_20260918.md",
  ]);
}

describe("T-509 stale-suite triage record", () => {
  it("names exactly the nine T-509 suites with current evidence and a verdict", () => {
    validateRecord(parseRecord());
  });

  it("fails closed when a suite or required evidence is omitted", () => {
    const record = parseRecord();

    expect(() =>
      validateRecord({
        ...record,
        suites: record.suites.slice(1),
      }),
    ).toThrow();

    expect(() =>
      validateRecord({
        ...record,
        suites: record.suites.map((suite, index) =>
          index === 0 ? { ...suite, evidence: [] } : suite,
        ),
      }),
    ).toThrow();
  });
});
