/**
 * QA29 — Intelligence / Tower Blueprint Verification Tests
 *
 * Validates the deterministic QA29 blueprint verification report:
 * - All structural invariants hold (shape, counts, vocabularies)
 * - No fail checks exist (blueprint + route files exist in this branch)
 * - INTEL1-3 / TOWER1-3 pre-integration items correctly appear as deferred
 * - caveat is non-empty
 *
 * fs-only; no jsdom, no React rendering, no network calls, no model calls.
 */

import {
  runIntelTowerBlueprintVerification,
  resolvePathStatus,
  BLUEPRINT_PATH_REGISTER,
  type IntelTowerBlueprintVerificationReport,
  type PathDispositionRegister,
  type VerificationStatus,
} from '../../../lib/qa/intelligence-tower-blueprint-verification';

const VALID_STATUSES: VerificationStatus[] = [
  'pass',
  'fail',
  'deferred',
  'removed',
  'not_applicable',
];
const VALID_SURFACES = ['intelligence', 'tower', 'shared'] as const;

describe('QA29: Intelligence Tower Blueprint Verification', () => {
  let report: IntelTowerBlueprintVerificationReport;

  beforeAll(() => {
    report = runIntelTowerBlueprintVerification();
  });

  // ── Basic invocation ──────────────────────────────────────────────────────

  it('runIntelTowerBlueprintVerification() returns without throwing', () => {
    expect(() => runIntelTowerBlueprintVerification()).not.toThrow();
  });

  it('report is defined', () => {
    expect(report).toBeDefined();
    expect(typeof report).toBe('object');
  });

  // ── Shape invariants ──────────────────────────────────────────────────────

  it('checks array is non-empty (at least 10 checks)', () => {
    expect(Array.isArray(report.checks)).toBe(true);
    expect(report.checks.length).toBeGreaterThanOrEqual(10);
  });

  it('every check has required fields with correct types', () => {
    for (const check of report.checks) {
      expect(typeof check.checkId).toBe('string');
      expect(check.checkId.length).toBeGreaterThan(0);

      expect(VALID_SURFACES).toContain(check.surface);

      expect(typeof check.description).toBe('string');
      expect(check.description.length).toBeGreaterThan(0);

      expect(VALID_STATUSES).toContain(check.status);

      expect(typeof check.detail).toBe('string');
      expect(check.detail.length).toBeGreaterThan(0);

      expect(check.deterministicSeed).toBe(true);
    }
  });

  it('every checkId is unique', () => {
    const ids = report.checks.map((c) => c.checkId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  // ── Count reconciliation ──────────────────────────────────────────────────

  it('passCount + failCount + deferredCount + removedCount === checks.length', () => {
    const sum =
      report.passCount + report.failCount + report.deferredCount + report.removedCount;
    expect(sum).toBe(report.checks.length);
  });

  it('passCount matches actual pass statuses', () => {
    const actual = report.checks.filter((c) => c.status === 'pass').length;
    expect(report.passCount).toBe(actual);
  });

  it('failCount matches actual fail statuses', () => {
    const actual = report.checks.filter((c) => c.status === 'fail').length;
    expect(report.failCount).toBe(actual);
  });

  it('deferredCount matches actual deferred statuses', () => {
    const actual = report.checks.filter((c) => c.status === 'deferred').length;
    expect(report.deferredCount).toBe(actual);
  });

  // ── overallStatus vocabulary ──────────────────────────────────────────────

  it("overallStatus is 'pass' | 'fail' | 'partial'", () => {
    expect(['pass', 'fail', 'partial']).toContain(report.overallStatus);
  });

  it("overallStatus is 'fail' iff failCount > 0", () => {
    if (report.failCount > 0) {
      expect(report.overallStatus).toBe('fail');
    } else {
      expect(report.overallStatus).not.toBe('fail');
    }
  });

  it("overallStatus is 'partial' when no fails but deferrals present", () => {
    if (report.failCount === 0 && report.deferredCount > 0) {
      expect(report.overallStatus).toBe('partial');
    }
  });

  // ── Zero failures ─────────────────────────────────────────────────────────

  it('failCount === 0 (all non-deferred checks pass)', () => {
    const failures = report.checks.filter((c) => c.status === 'fail');
    if (failures.length > 0) {
      const details = failures.map((c) => `${c.checkId}: ${c.detail}`).join('\n');
      throw new Error(`Unexpected failures:\n${details}`);
    }
    expect(report.failCount).toBe(0);
  });

  // ── Required check presence ───────────────────────────────────────────────

  it('Intelligence blueprint check is present', () => {
    const check = report.checks.find((c) => c.checkId === 'INTEL-BP-01');
    expect(check).toBeDefined();
    expect(check?.surface).toBe('intelligence');
  });

  it('Tower blueprint check is present', () => {
    const check = report.checks.find((c) => c.checkId === 'TOWER-BP-01');
    expect(check).toBeDefined();
    expect(check?.surface).toBe('tower');
  });

  it('Intelligence route check is present', () => {
    const check = report.checks.find((c) => c.checkId === 'INTEL-ROUTE-01');
    expect(check).toBeDefined();
    expect(check?.surface).toBe('intelligence');
  });

  it('Tower route check is present', () => {
    const check = report.checks.find((c) => c.checkId === 'TOWER-ROUTE-01');
    expect(check).toBeDefined();
    expect(check?.surface).toBe('tower');
  });

  it('IntelligenceRouteShell check is present', () => {
    // Updated under T-521: `removed` is a legitimate outcome for this path.
    // INT-I1 (7c6d894e9) deleted IntelligenceRouteShell.tsx deliberately, and
    // the check reported that deletion as `deferred` — "not yet present …
    // Deferred pending INTEL1 merge" — for the five months since.
    const check = report.checks.find((c) => c.checkId === 'INTEL1-SHELL-01');
    expect(check).toBeDefined();
    expect(['pass', 'deferred', 'removed']).toContain(check?.status);
  });

  it('TowerRouteShell check is present', () => {
    const check = report.checks.find((c) => c.checkId === 'TOWER1-SHELL-01');
    expect(check).toBeDefined();
    expect(check?.status === 'pass' || check?.status === 'deferred').toBe(true);
  });

  it('build-slices.json validity check is present', () => {
    const check = report.checks.find((c) => c.checkId === 'SHARED-SLICES-01');
    expect(check).toBeDefined();
    // Must pass — the file exists and is valid JSON
    expect(check?.status).toBe('pass');
  });

  // ── Determinism metadata ──────────────────────────────────────────────────

  it('reportId is QA29-intel-tower-blueprint-verification', () => {
    expect(report.reportId).toBe('QA29-intel-tower-blueprint-verification');
  });

  it('report deterministicSeed is true', () => {
    expect(report.deterministicSeed).toBe(true);
  });

  // ── Caveat ────────────────────────────────────────────────────────────────

  it('caveat is non-empty', () => {
    expect(typeof report.caveat).toBe('string');
    expect(report.caveat.length).toBeGreaterThan(0);
  });

  it('caveat references Deterministic', () => {
    expect(report.caveat).toContain('Deterministic');
  });

  // ── Pre-integration deferrals ─────────────────────────────────────────────

  it('deferred checks all reference pre-integration or INTEL/TOWER slice context', () => {
    const deferred = report.checks.filter((c) => c.status === 'deferred');
    for (const check of deferred) {
      const mentionsContext =
        check.detail.toLowerCase().includes('pre-integration') ||
        check.detail.toLowerCase().includes('intel') ||
        check.detail.toLowerCase().includes('tower') ||
        check.detail.toLowerCase().includes('deferred');
      expect(mentionsContext).toBe(true);
    }
  });

  // ── Surface coverage ──────────────────────────────────────────────────────

  it('checks include all three surfaces: intelligence, tower, shared', () => {
    const surfaces = new Set(report.checks.map((c) => c.surface));
    expect(surfaces.has('intelligence')).toBe(true);
    expect(surfaces.has('tower')).toBe(true);
    expect(surfaces.has('shared')).toBe(true);
  });
});

// ── T-521: an absent path is declared, never inferred ──────────────────────
//
// Before this, every absent path resolved to `deferred` with the words "not
// yet present … Deferred pending <SLICE> merge". Three of the paths this
// report reads were not unbuilt — they were deliberately removed:
//
//   src/components/intelligence/IntelligenceRouteShell.tsx
//     added by b26927adc (#378), deleted by 7c6d894e9 (INT-I1), whose own
//     commit body reads "Delete IntelligenceRouteShell.tsx (G4 …)".
//   src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx
//     deleted by 0c6a86c51, the legacy v1–v4 surface sunset.
//
// A check that cannot tell "not built yet" from "deliberately deleted"
// reports the wrong state in whichever direction the tree moves, so the
// disposition is declared in BLUEPRINT_PATH_REGISTER and the resolver refuses
// to guess: an undeclared absence is a `fail` that asks for the declaration,
// and a declared retirement whose file came back is a `fail` too.

describe('QA29: absent paths are declared, not inferred', () => {
  let report: IntelTowerBlueprintVerificationReport;

  beforeAll(() => {
    report = runIntelTowerBlueprintVerification();
  });

  const RETIRED_FIXTURE: PathDispositionRegister = {
    'src/fixture/Gone.tsx': {
      retired: {
        scope: 'path',
        commit: 'abc1234',
        slice: 'FIX-1',
        replacement: 'src/fixture/Replacement.tsx',
        note: 'Retired when the fixture slice landed.',
      },
    },
  };

  const DIRECTORY_FIXTURE: PathDispositionRegister = {
    'src/fixture/dir/NeverLanded.tsx': {
      retired: {
        scope: 'containing-directory',
        commit: 'def5678',
        slice: 'FIX-3',
        replacement: null,
        note: 'The directory went with the fixture sunset.',
      },
    },
  };

  const PENDING_FIXTURE: PathDispositionRegister = {
    'src/fixture/NotYet.tsx': {
      pending: { slice: 'FIX-2', note: 'Lands with the fixture slice.' },
    },
  };

  it('an absent path declared retired resolves to removed, naming the commit and the slice', () => {
    const resolved = resolvePathStatus('src/fixture/Gone.tsx', false, RETIRED_FIXTURE);
    expect(resolved.status).toBe('removed');
    expect(resolved.detail).toContain('abc1234');
    expect(resolved.detail).toContain('FIX-1');
    expect(resolved.detail).toContain('src/fixture/Replacement.tsx');
    // The old vocabulary must not come back for a deletion.
    expect(resolved.detail.toLowerCase()).not.toContain('not yet present');
    expect(resolved.detail.toLowerCase()).not.toContain('pre-integration');
  });

  it('a path declared retired but PRESENT is a failure, so the register cannot go stale the other way', () => {
    const resolved = resolvePathStatus('src/fixture/Gone.tsx', true, RETIRED_FIXTURE);
    expect(resolved.status).toBe('fail');
    expect(resolved.detail).toContain('abc1234');
  });

  it('a containing-directory removal does not claim the commit deleted the file itself', () => {
    const resolved = resolvePathStatus(
      'src/fixture/dir/NeverLanded.tsx',
      false,
      DIRECTORY_FIXTURE,
    );
    expect(resolved.status).toBe('removed');
    expect(resolved.detail).toContain('never appeared on this history');
    expect(resolved.detail).toContain('def5678');
    // The 'path' wording would be a false attribution here.
    expect(resolved.detail).not.toContain('Removed by def5678');
  });

  it('an absent path declared pending resolves to deferred', () => {
    const resolved = resolvePathStatus('src/fixture/NotYet.tsx', false, PENDING_FIXTURE);
    expect(resolved.status).toBe('deferred');
    expect(resolved.detail).toContain('FIX-2');
  });

  it('an absent path that nothing declares is a failure, not a deferral', () => {
    const resolved = resolvePathStatus('src/fixture/Undeclared.tsx', false, {});
    expect(resolved.status).toBe('fail');
    expect(resolved.status).not.toBe('deferred');
    expect(resolved.detail).toContain('BLUEPRINT_PATH_REGISTER');
  });

  it('a present path that nothing declares passes', () => {
    const resolved = resolvePathStatus('src/fixture/Here.tsx', true, {});
    expect(resolved.status).toBe('pass');
  });

  it('no register entry declares a path both retired and pending', () => {
    for (const [rel, disposition] of Object.entries(BLUEPRINT_PATH_REGISTER)) {
      const declared = [disposition.retired, disposition.pending].filter(Boolean).length;
      expect(`${rel}: ${declared}`).toBe(`${rel}: 1`);
    }
  });

  // ── the real tree ───────────────────────────────────────────────────────

  it('IntelligenceRouteShell is reported as gone with its directory, not as pending INTEL1', () => {
    const check = report.checks.find((c) => c.checkId === 'INTEL1-SHELL-01');
    expect(check?.status).toBe('removed');
    expect(check?.detail).toContain('0c6a86c51');
    expect(check?.detail).toContain('never appeared on this history');
    expect(check?.detail.toLowerCase()).not.toContain('pending intel1');
  });

  it('the IntelligenceRouteShell caveat check reports the same state, not a deferral', () => {
    const check = report.checks.find((c) => c.checkId === 'INTEL1-CAVEAT-01');
    expect(check?.status).toBe('removed');
    expect(check?.detail).toContain('0c6a86c51');
  });

  it('the sunset tenant Intelligence route is reported as removed, and names what replaced it', () => {
    const check = report.checks.find((c) => c.checkId === 'INTEL-ROUTE-01');
    expect(check?.status).toBe('removed');
    expect(check?.detail).toContain('0c6a86c51');
    expect(check?.detail).toContain('src/app/(maestro)/intelligence/page.tsx');
  });

  it('every path the register declares retired is genuinely absent from the tree', () => {
    const stillPresent = report.checks
      .filter((c) => c.status === 'fail' && c.detail.includes('declared retired'))
      .map((c) => c.checkId);
    expect(stillPresent).toEqual([]);
  });

  // ── counts and the top-line verdict ─────────────────────────────────────

  it('removedCount matches actual removed statuses and joins the reconciliation', () => {
    const actual = report.checks.filter((c) => c.status === 'removed').length;
    expect(report.removedCount).toBe(actual);
    expect(report.passCount + report.failCount + report.deferredCount + report.removedCount).toBe(
      report.checks.length,
    );
  });

  it('a report carrying removals is partial, never a clean pass', () => {
    if (report.removedCount > 0 && report.failCount === 0) {
      expect(report.overallStatus).toBe('partial');
    }
  });

  it('the caveat states that removals are recorded rather than deferred', () => {
    expect(report.caveat.toLowerCase()).toContain('removed');
  });
});
