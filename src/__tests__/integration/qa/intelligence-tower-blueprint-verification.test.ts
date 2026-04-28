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
  type IntelTowerBlueprintVerificationReport,
  type VerificationStatus,
} from '../../../lib/qa/intelligence-tower-blueprint-verification';

const VALID_STATUSES: VerificationStatus[] = ['pass', 'fail', 'deferred', 'not_applicable'];
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

  it('passCount + failCount + deferredCount === checks.length', () => {
    const sum = report.passCount + report.failCount + report.deferredCount;
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
    const check = report.checks.find((c) => c.checkId === 'INTEL1-SHELL-01');
    expect(check).toBeDefined();
    expect(check?.status === 'pass' || check?.status === 'deferred').toBe(true);
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
