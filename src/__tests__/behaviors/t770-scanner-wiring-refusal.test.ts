/**
 * Item T-770. The inherited rule "a source-text scanner is never wired into CI"
 * had no control over any workflow. It was asserted only inside a triage
 * record, about that record's own boolean.
 *
 * `t492-stale-suite-triage-record.test.ts` checks, for every row it declares a
 * scanner, that `verdict !== "wire_into_ci"` and `wiredInThisItem === false`.
 * Both are statements about what a DOCUMENT may claim. Neither reads
 * `.github/workflows`, a package script, or a ratchet baseline, so nothing
 * connected the rule to the thing it is a rule about.
 *
 * MEASURED ON A REAL KNOWN POSITIVE, not argued. On `be3c7dc27e`, wiring
 * `src/lib/integrations/ai-egress/__tests__` as a directory — the step
 * `T-494`'s own re-verification note tells the next run to add — puts
 * `ai-egress-migration.test.ts` into CI. `T-492` declares that row
 * `sourceTextScanner: true`, `textIsTheSubject: true`, verdict
 * `rewrite_as_behavior`, owner `T-495`, and a `textIsTheSubject` row is the
 * GATED half of `T-495` that an agent must not attempt. With the step present:
 *
 *   src/__tests__/behaviors                150 suites / 1620 tests / 0 failing
 *   audit:test-ci-coverage:check           exit 0
 *   audit:triage-record-reconciliation     exit 0
 *   test:integration:ci-visibility         exit 0
 *   audit:named-suite-requiredness         exit 0
 *
 * The one objection was census staleness, and its own printed remedy
 * (`npm run audit:test-ci-coverage:write`) clears it — so the prescribed flow
 * ends green. A rule whose only instance cannot fail is the shape this backlog
 * exists against.
 *
 * WHY THE CENSUS RESOLVER AND NOT A GREP OF THE WORKFLOWS. A literal match
 * over `run:` lines reports ZERO breaches on `be3c7dc27e` and is wrong: two
 * declared scanners run today, selected by `scripts/ci/test-ratchet.mjs` from
 * `docs/ci/tower-test-baseline.json`, which no workflow command names. So
 * reach is answered by `collectReachableCommands` + `reachableEntrySelects`,
 * the repository's own resolver, which sees ratchet baselines, wrapper scripts
 * and package scripts as well as workflow commands. Those two are declared in
 * the companion baseline and owned by `T-481`; the list asserts set equality,
 * so it can only shrink.
 *
 * WHY CLASSIFICATION IS RESOLVED BY LATEST RECORD. A suite that gets rewritten
 * stops being a scanner and is then wired legitimately.
 * `contractDetailRetry.test.tsx` is `sourceTextScanner: true` in `T-550`
 * (2026-09-21) and `sourceTextScanner: false, verdict: "wired"` in `T-478`
 * (2026-09-25), and it IS reached today. A control that took "any record ever
 * said scanner" would refuse that, so supersession is a case here rather than a
 * convention, and it asserts BOTH halves — accepted, and actually reached — so
 * it cannot pass by that path having been deleted.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  collectReachableCommands,
  reachableEntrySelects,
} from "../../../scripts/quality/test-ci-coverage-census.mjs";

const repoRoot = path.resolve(__dirname, "../../..");
const RECORD_DIR = "docs/architecture";
const BASELINE = "src/__tests__/behaviors/t770-scanner-wiring-refusal.baseline.json";

/**
 * A floor, never an exact pin. 30 live declared scanners on `be3c7dc27e`. The
 * count moves whenever a draw is triaged or a rewrite lands, and a case pinning
 * it exactly would fail that pull request and teach the next author to raise a
 * number instead of reading one — the reason `T-767` and `T-768` both give.
 * What the floor is for is vacuity: every case below iterates the scanner set,
 * so an empty set passes all of them.
 */
const LIVE_SCANNER_FLOOR = 25;

/** The real supersession this control has to get right. */
const SUPERSEDED_PATH =
  "src/app/(maestro)/source/preview/workspace/__tests__/contractDetailRetry.test.tsx";

/** The known positive: the exact directory command that must be detected. */
const KNOWN_POSITIVE_DIRECTORY = "src/lib/integrations/ai-egress/__tests__";
const KNOWN_POSITIVE_SCANNER = `${KNOWN_POSITIVE_DIRECTORY}/ai-egress-migration.test.ts`;

type ScannerRow = {
  path: string;
  declaredBy: string;
  item: string;
  recordedAt: string;
  sourceTextScanner: boolean;
  verdict?: string;
  ownerItem?: string;
  textIsTheSubject: boolean;
};

type BaselineEntry = {
  path: string;
  declaredBy: string;
  verdict: string;
  owningItem: string;
  reachedVia: string;
  note: string;
};

/**
 * Every row in every triage record that carries an explicit
 * `sourceTextScanner` boolean, keyed by suite path and resolved to the LATEST
 * `recordedAt`. A record with no `recordedAt` sorts before every dated one
 * rather than being dropped, so an undated record cannot silently win.
 */
function classificationByPath(): Map<string, ScannerRow> {
  const rows: ScannerRow[] = [];
  for (const file of readdirSync(path.join(repoRoot, RECORD_DIR)).filter(
    (name) => /triage.*\.json$/.test(name),
  )) {
    const relative = `${RECORD_DIR}/${file}`;
    let record: {
      item?: string;
      recordedAt?: string;
      suites?: Record<string, unknown>[];
    };
    try {
      record = JSON.parse(
        readFileSync(path.join(repoRoot, relative), "utf8"),
      ) as typeof record;
    } catch {
      continue;
    }
    for (const suite of record.suites ?? []) {
      if (typeof suite.sourceTextScanner !== "boolean") continue;
      rows.push({
        path: String(suite.path),
        declaredBy: relative,
        item: String(record.item ?? "?"),
        recordedAt: String(record.recordedAt ?? ""),
        sourceTextScanner: suite.sourceTextScanner,
        verdict: suite.verdict as string | undefined,
        ownerItem: suite.ownerItem as string | undefined,
        textIsTheSubject: suite.textIsTheSubject === true,
      });
    }
  }
  const latest = new Map<string, ScannerRow>();
  for (const row of rows) {
    const held = latest.get(row.path);
    if (!held || row.recordedAt > held.recordedAt) latest.set(row.path, row);
  }
  return latest;
}

const classified = classificationByPath();
const declaredScanners = [...classified.values()].filter(
  (row) => row.sourceTextScanner,
);
const liveScanners = declaredScanners.filter((row) =>
  existsSync(path.join(repoRoot, row.path)),
);

const packageScripts = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8"),
).scripts as Record<string, string>;
const resolved = collectReachableCommands(repoRoot, packageScripts) as {
  reachable: Record<string, unknown>[];
  indeterminate: unknown[];
};

/** Every CI invocation that selects this suite path, as the census sees it. */
function selectedBy(
  suitePath: string,
  entries: Record<string, unknown>[] = resolved.reachable,
): { via: string; source: string; pattern: string }[] {
  return entries
    .filter((entry) => reachableEntrySelects(repoRoot, entry, suitePath))
    .map((entry) => ({
      via: String(entry.via ?? "?"),
      source: String(entry.source ?? "?"),
      pattern: String(entry.jestPathPattern ?? entry.command ?? "?"),
    }));
}

const baseline = JSON.parse(
  readFileSync(path.join(repoRoot, BASELINE), "utf8"),
) as { entries: BaselineEntry[]; closedAndShrinking: string; rule: string };

describe("T-770 — no declared source-text scanner is wired into CI", () => {
  it("resolves every CI invocation, so a negative answer is not a guess", () => {
    // While any invocation is unresolved, "nothing selects this scanner" is an
    // upper bound rather than a fact, and every case below reads that guess.
    expect(resolved.indeterminate).toEqual([]);
    expect(resolved.reachable.length).toBeGreaterThan(0);
  });

  it("holds a floor of live declared scanners, so the cases below cannot pass vacuously", () => {
    expect({
      liveScanners: liveScanners.length >= LIVE_SCANNER_FLOOR,
      atLeast: LIVE_SCANNER_FLOOR,
    }).toEqual({ liveScanners: true, atLeast: LIVE_SCANNER_FLOOR });
  });

  it("detects the known positive through the same resolver, and does not fire on its neighbour", () => {
    /*
     * The corpus is clean apart from the two baselined rows, so case "refuses"
     * below would pass on a blind detector. This one is the positive control:
     * a synthetic reachable entry naming the ai-egress DIRECTORY — the exact
     * command `T-494`'s note prescribes — must be seen to select the scanner
     * file inside it, which is the ancestor-reach half a per-file reading
     * misses. The negative control is a sibling directory command that must
     * select nothing, so "detects everything" cannot pass for "detects this".
     */
    const positive = {
      via: "command",
      source: ".github/workflows/unit-suites.yml",
      pullRequest: true,
      command: `npx jest ${KNOWN_POSITIVE_DIRECTORY} --no-coverage --ci`,
      jestPathPattern: KNOWN_POSITIVE_DIRECTORY,
      ignorePatterns: [],
    };
    const negative = {
      ...positive,
      command: "npx jest src/lib/context-ingestion --no-coverage --ci",
      jestPathPattern: "src/lib/context-ingestion",
    };

    expect({
      scanner: KNOWN_POSITIVE_SCANNER,
      declaredScanner: classified.get(KNOWN_POSITIVE_SCANNER)?.sourceTextScanner,
      caughtByDirectoryCommand: selectedBy(KNOWN_POSITIVE_SCANNER, [positive])
        .length,
      caughtByNeighbourCommand: selectedBy(KNOWN_POSITIVE_SCANNER, [negative])
        .length,
      wiredOnThisCommit: selectedBy(KNOWN_POSITIVE_SCANNER).length,
    }).toEqual({
      scanner: KNOWN_POSITIVE_SCANNER,
      declaredScanner: true,
      caughtByDirectoryCommand: 1,
      caughtByNeighbourCommand: 0,
      wiredOnThisCommit: 0,
    });
  });

  it("refuses any CI invocation that reaches a declared source-text scanner", () => {
    /*
     * THE RULE. Reported as a list of breaches rather than a boolean, so a
     * failure names the scanner, who owns its rewrite, and which invocation
     * reaches it — a reader should not have to re-derive that.
     */
    const declaredException = new Set(baseline.entries.map((e) => e.path));
    const breaches = liveScanners
      .flatMap((row) =>
        selectedBy(row.path).map((hit) => ({
          scanner: row.path,
          declaredBy: row.declaredBy,
          owningItem: row.ownerItem ?? "unowned",
          reachedVia: hit.via,
          reachedFrom: hit.source,
          selectingPattern: hit.pattern,
        })),
      )
      .filter((breach) => !declaredException.has(breach.scanner));
    expect(breaches).toEqual([]);
  });

  it("keeps the exception list closed, honest and shrinking", () => {
    /*
     * A baselined row has to still be all three things its line claims: a
     * declared scanner by the latest record, present on disk, and actually
     * reached. A rewrite that lands makes the first or third false, and then
     * the line must be DELETED in that same change — which is what stops this
     * file becoming an allowlist that outlives its defect.
     */
    for (const entry of baseline.entries) {
      const row = classified.get(entry.path);
      expect({
        path: entry.path,
        stillDeclaredAScanner: row?.sourceTextScanner === true,
        stillOnDisk: existsSync(path.join(repoRoot, entry.path)),
        stillReached: selectedBy(entry.path).length > 0,
        namesAnOwningItem: /^[A-Z]-\d{3}$|^\d+$/.test(entry.owningItem ?? ""),
      }).toEqual({
        path: entry.path,
        stillDeclaredAScanner: true,
        stillOnDisk: true,
        stillReached: true,
        namesAnOwningItem: true,
      });
      expect(row?.verdict).toBe(entry.verdict);
      expect(entry.note.length).toBeGreaterThan(80);
    }

    // Set equality in the other direction: every scanner reached today is
    // declared here. Without this the list is a filter and a third breach
    // passes silently.
    const reachedToday = liveScanners
      .filter((row) => selectedBy(row.path).length > 0)
      .map((row) => row.path)
      .sort();
    expect(reachedToday).toEqual(baseline.entries.map((e) => e.path).sort());
    expect(baseline.closedAndShrinking).toContain("only shrink");
  });

  it("respects supersession, on the real reclassified suite rather than a fixture", () => {
    /*
     * Both halves, because either alone is satisfiable by accident. The path
     * must be classified NOT a scanner today (T-478 supersedes T-550), AND it
     * must actually be reached — otherwise this case would pass on a suite
     * nothing runs, and the control it is guarding against (one that ignores
     * supersession and refuses a legitimately rewritten suite) would go
     * undetected.
     */
    expect({
      path: SUPERSEDED_PATH,
      scannerByLatestRecord: classified.get(SUPERSEDED_PATH)?.sourceTextScanner,
      latestRecord: classified.get(SUPERSEDED_PATH)?.declaredBy,
      reachedByCi: selectedBy(SUPERSEDED_PATH).length > 0,
    }).toEqual({
      path: SUPERSEDED_PATH,
      scannerByLatestRecord: false,
      latestRecord: `${RECORD_DIR}/t478-source-workspace-wiring-triage.json`,
      reachedByCi: true,
    });

    // And an earlier record really does call it a scanner, so the case is
    // exercising supersession rather than a path only ever classified once.
    const earlier = JSON.parse(
      readFileSync(
        path.join(repoRoot, RECORD_DIR, "t550-stale-suite-triage.json"),
        "utf8",
      ),
    ) as { suites: { path: string; sourceTextScanner?: boolean }[] };
    expect(
      earlier.suites.find((s) => s.path === SUPERSEDED_PATH)?.sourceTextScanner,
    ).toBe(true);
  });

  it("reports a declared scanner whose file is gone as a stale record row, never as compliance", () => {
    /*
     * A path absent from disk cannot be wired, so it leaves the rule satisfied
     * for the WRONG reason — and "declared 32, live 30" would otherwise read as
     * 32 scanners guarded. Both of today's two are `T-550` rows, and the set is
     * asserted rather than printed: a third one means a triage record has
     * drifted from the tree, which is a real event and is what this case is for.
     * A change that legitimately deletes a scanner suite updates its record and
     * this line together, deliberately.
     */
    const missing = declaredScanners
      .filter((row) => !existsSync(path.join(repoRoot, row.path)))
      .map((row) => `${row.item}:${row.path}`)
      .sort();
    expect(missing).toEqual([
      "T-550:src/app/(maestro)/source/__tests__/not-found-source.test.ts",
      "T-550:src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.ts",
    ]);
    // And the two accounts agree, so neither number is quietly standing in for
    // the other.
    expect(declaredScanners.length).toBe(liveScanners.length + missing.length);
  });
});
