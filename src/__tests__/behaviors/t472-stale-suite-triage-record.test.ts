import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * T-472 — the second draw of stale, unrun test suites.
 *
 * This guard exists because the record it reads is the only durable output of
 * a triage. T-509's lesson was that a verdict written from a filename is worth
 * nothing; this draw's lesson is narrower and sharper — eleven of the sixteen
 * drawn files are GREEN, so the failure mode here is not a stale expectation
 * but a verdict that promotes a file to `wire_into_ci` without the evidence
 * that makes green mean anything.
 *
 * Per T-469 a suite behind `postgresCompat` swallows its own read failure into
 * a null the caller reads back as "no rows", so green can mean "the read
 * failed". Every `wire_into_ci` verdict below therefore has to carry a
 * measured swallow-probe result, and the assertions make that structural:
 * `wire_into_ci` is unreachable for a red file and unreachable for a file
 * whose probe did not run.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const recordPath = path.join(
  repoRoot,
  "docs/architecture/t472-stale-suite-triage.json",
);

/** The fourteen the census named with file-level certainty. */
const certainSuites = [
  "src/app/api/knowledge/consumption/__tests__/_shared.test.ts",
  "src/app/api/programs/synthesis/__tests__/route.test.ts",
  "src/app/api/setup/files/[scope]/[artifactId]/download/__tests__/route.test.ts",
  "src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts",
  "src/app/api/source/synthesis/__tests__/route.test.ts",
  "src/app/api/source/workspace/contract/[contractId]/__tests__/route.test.ts",
  "src/app/api/source/workspace/contract/[contractId]/optimization/__tests__/route.test.ts",
  "src/app/api/source/workspace/portfolio/__tests__/route.test.ts",
  "src/app/api/webhooks/clerk/__tests__/route-w4-pr3-emit.test.ts",
  "src/app/programs/expert-kernel/expert-review/export/__tests__/route.test.ts",
  "src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts",
  "src/lib/programs/queries.azure-read.test.ts",
  "src/lib/source/nda/__tests__/nda-authority-repository.test.ts",
  "src/lib/source/stage-guidebooks/__tests__/repository.test.ts",
] as const;

/**
 * The two the filing could not name, resolved by `--explain` rather than by
 * re-deriving them from directory counts. The other four files in that band
 * already carry a T-509 verdict, so only these two were new work.
 */
const resolvedSuites = [
  "src/__tests__/integration/source-chat-shape.test.ts",
  "src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx",
] as const;

const expectedSuites = [...certainSuites, ...resolvedSuites];

const VERDICTS = [
  "wire_into_ci",
  "repair",
  "update_with_reason_recorded",
  "rewrite_as_behavior",
] as const;

type Verdict = (typeof VERDICTS)[number];

type SuiteRecord = {
  path: string;
  draw: "named_by_census_directory" | "resolved_by_census_explain";
  loaded: boolean;
  collected: boolean;
  run: boolean;
  green: boolean;
  totalTests: number;
  failedTests: number;
  passedTests: number;
  swallowProbe: "stayed_green_with_swallowing_client_made_loud" | "not_applicable_suite_is_red";
  verdict: Verdict;
  ownerItem: string;
  evidence: string[];
  rationale: string;
  currentAction: string;
};

type TriageRecord = {
  item: "T-472";
  base: { branch: string; originMainSha: string; currentMainChecked: boolean };
  jestEvidence: {
    batches: Array<{
      command: string;
      outputFile: string;
      totalSuites: number;
      failedSuites: number;
      totalTests: number;
      failedTests: number;
      passedTests: number;
    }>;
  };
  swallowProbe: {
    why: string;
    negativeControl: {
      withoutProbe: string;
      withProbe: string;
      provesProbeCanFail: boolean;
    };
    suitesProbed: number;
    suitesReachingSwallowingClientUnstubbed: number;
  };
  censusPerFileMode: {
    question: string;
    answer: "exists" | "absent";
    invocation: string;
    unrunDirectories: number;
    unrunFiles: number;
  };
  suites: SuiteRecord[];
  excluded: string[];
  claimedWriteFiles: string[];
};

function parseRecord(): TriageRecord {
  return JSON.parse(readFileSync(recordPath, "utf8")) as TriageRecord;
}

function validateRecord(record: TriageRecord): void {
  expect(record.item).toBe("T-472");
  expect(record.base.originMainSha).toMatch(/^[0-9a-f]{40}$/);
  expect(record.base.currentMainChecked).toBe(true);

  const paths = record.suites.map((suite) => suite.path).sort();
  expect(paths).toEqual([...expectedSuites].sort());
  expect(new Set(paths).size).toBe(expectedSuites.length);

  // A named file that no longer exists is the other way this record rots.
  for (const suite of record.suites) {
    expect(existsSync(path.join(repoRoot, suite.path))).toBe(true);
  }

  // Totals reconcile against the per-suite rows, so a row cannot be dropped
  // while the headline still claims the run covered it.
  const drawn = record.suites.length;
  const batchTotals = record.jestEvidence.batches.reduce(
    (sum, batch) => ({
      totalSuites: sum.totalSuites + batch.totalSuites,
      failedSuites: sum.failedSuites + batch.failedSuites,
      totalTests: sum.totalTests + batch.totalTests,
      failedTests: sum.failedTests + batch.failedTests,
      passedTests: sum.passedTests + batch.passedTests,
    }),
    { totalSuites: 0, failedSuites: 0, totalTests: 0, failedTests: 0, passedTests: 0 },
  );
  expect(batchTotals.totalSuites).toBe(drawn);
  expect(batchTotals.totalTests).toBe(
    record.suites.reduce((sum, suite) => sum + suite.totalTests, 0),
  );
  expect(batchTotals.failedTests).toBe(
    record.suites.reduce((sum, suite) => sum + suite.failedTests, 0),
  );
  expect(batchTotals.passedTests).toBe(
    record.suites.reduce((sum, suite) => sum + suite.passedTests, 0),
  );
  expect(batchTotals.failedSuites).toBe(
    record.suites.filter((suite) => !suite.green).length,
  );
  for (const batch of record.jestEvidence.batches) {
    expect(batch.command).toContain("--runTestsByPath");
  }

  for (const suite of record.suites) {
    expect(suite.loaded).toBe(true);
    expect(suite.collected).toBe(true);
    expect(suite.run).toBe(true);
    expect(suite.totalTests).toBeGreaterThan(0);
    expect(suite.passedTests + suite.failedTests).toBe(suite.totalTests);
    // `green` is derived, never asserted independently of the count.
    expect(suite.green).toBe(suite.failedTests === 0);
    expect(VERDICTS).toContain(suite.verdict);
    expect(suite.ownerItem).toMatch(/^[A-Z]-\d+$/);
    expect(suite.evidence.length).toBeGreaterThan(0);
    expect(suite.rationale.trim().length).toBeGreaterThan(0);
    expect(suite.currentAction.trim().length).toBeGreaterThan(0);
    expect(
      suite.draw === "named_by_census_directory"
        ? (certainSuites as readonly string[])
        : (resolvedSuites as readonly string[]),
    ).toContain(suite.path);
  }

  // The fail-closed property of this draw. A red suite cannot be promoted
  // into CI, and a green suite cannot be promoted on green alone — the
  // swallow probe has to have run on it.
  for (const suite of record.suites) {
    if (suite.verdict !== "wire_into_ci") continue;
    expect(suite.green).toBe(true);
    expect(suite.swallowProbe).toBe(
      "stayed_green_with_swallowing_client_made_loud",
    );
  }
  for (const suite of record.suites) {
    if (suite.green) continue;
    expect(suite.swallowProbe).toBe("not_applicable_suite_is_red");
    expect(suite.verdict).not.toBe("wire_into_ci");
  }

  // The probe itself is only worth recording if it was shown able to fail.
  expect(record.swallowProbe.negativeControl.provesProbeCanFail).toBe(true);
  expect(record.swallowProbe.suitesProbed).toBe(
    record.suites.filter((suite) => suite.green).length,
  );
  expect(record.swallowProbe.suitesReachingSwallowingClientUnstubbed).toBe(0);

  // The acceptance asked whether the census has a per-file mode. It does, and
  // that answer is the reason `resolvedSuites` are named rather than guessed.
  expect(record.censusPerFileMode.answer).toBe("exists");
  expect(record.censusPerFileMode.invocation).toContain("--explain");
  expect(record.censusPerFileMode.unrunFiles).toBeGreaterThan(0);
  expect(record.censusPerFileMode.unrunDirectories).toBeGreaterThan(0);

  // This item triages; it does not repair. Nothing under test may be claimed
  // as a write.
  for (const written of record.claimedWriteFiles) {
    expect(expectedSuites as readonly string[]).not.toContain(written);
  }
  expect(record.claimedWriteFiles).toEqual(
    expect.arrayContaining([
      "docs/architecture/t472-stale-suite-triage.json",
      "src/__tests__/behaviors/t472-stale-suite-triage-record.test.ts",
    ]),
  );
}

describe("T-472 stale-suite triage record", () => {
  it("names exactly the sixteen drawn suites with a run-backed verdict each", () => {
    validateRecord(parseRecord());
  });

  it("fails closed when a suite, its evidence or its probe result is dropped", () => {
    const record = parseRecord();

    expect(() =>
      validateRecord({ ...record, suites: record.suites.slice(1) }),
    ).toThrow();

    expect(() =>
      validateRecord({
        ...record,
        suites: record.suites.map((suite, index) =>
          index === 0 ? { ...suite, evidence: [] } : suite,
        ),
      }),
    ).toThrow();

    // The one that matters most: a red suite relabelled as safe to wire.
    const red = record.suites.find((suite) => !suite.green);
    expect(red).toBeDefined();
    expect(() =>
      validateRecord({
        ...record,
        suites: record.suites.map((suite) =>
          suite.path === red!.path
            ? { ...suite, verdict: "wire_into_ci" as Verdict }
            : suite,
        ),
      }),
    ).toThrow();

    // And a green suite wired on green alone, with no probe behind it.
    const green = record.suites.find(
      (suite) => suite.green && suite.verdict === "wire_into_ci",
    );
    expect(green).toBeDefined();
    expect(() =>
      validateRecord({
        ...record,
        suites: record.suites.map((suite) =>
          suite.path === green!.path
            ? { ...suite, swallowProbe: "not_applicable_suite_is_red" as const }
            : suite,
        ),
      }),
    ).toThrow();

    // A verdict count that no longer reconciles with the run it cites.
    expect(() =>
      validateRecord({
        ...record,
        suites: record.suites.map((suite, index) =>
          index === 0
            ? { ...suite, passedTests: suite.passedTests + 1 }
            : suite,
        ),
      }),
    ).toThrow();
  });
});
