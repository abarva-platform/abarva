/**
 * QA28 — Active Route Shell Verification Tests
 *
 * Validates the runActiveRouteShellVerification() function from
 * src/lib/qa/active-route-shell-verification.ts.
 *
 * Wave-20 SHELL1-7 components are pre-integration deferred items. Tests
 * accept 'deferred' as a valid status — the suite should pass now with
 * some deferrals and fully pass (all checks pass) after Wave-20 integration.
 */

import {
  runActiveRouteShellVerification,
  ShellCheckStatus,
  ShellVerificationCheck,
  ShellVerificationReport,
} from '../../../lib/qa/active-route-shell-verification';

// ---------------------------------------------------------------------------
// Fixture: run once for all tests
// ---------------------------------------------------------------------------

let report: ShellVerificationReport;

beforeAll(() => {
  report = runActiveRouteShellVerification();
});

// ---------------------------------------------------------------------------
// Suite 1: Report shape
// ---------------------------------------------------------------------------

describe('QA28 — Active Route Shell Verification: report shape', () => {
  it('runActiveRouteShellVerification() returns without throwing', () => {
    expect(report).toBeDefined();
  });

  it('report has reportId QA28_ACTIVE_ROUTE_SHELL_VERIFICATION', () => {
    expect(report.reportId).toBe('QA28_ACTIVE_ROUTE_SHELL_VERIFICATION');
  });

  it('checks array is non-empty (at least 15 checks)', () => {
    expect(report.checks.length).toBeGreaterThanOrEqual(15);
  });

  it('every check has checkId, description, status, detail, deterministicSeed', () => {
    const VALID_STATUSES: ShellCheckStatus[] = ['pass', 'fail', 'deferred', 'not_applicable'];
    for (const check of report.checks) {
      expect(typeof check.checkId).toBe('string');
      expect(check.checkId.length).toBeGreaterThan(0);
      expect(typeof check.description).toBe('string');
      expect(check.description.length).toBeGreaterThan(0);
      expect(VALID_STATUSES).toContain(check.status);
      expect(typeof check.detail).toBe('string');
      expect(check.detail.length).toBeGreaterThan(0);
      expect(check.deterministicSeed).toBe(true);
    }
  });

  it('no check has empty description', () => {
    const emptyDescriptions = report.checks.filter((c) => !c.description || c.description.trim() === '');
    expect(emptyDescriptions).toHaveLength(0);
  });

  it('passCount + failCount + deferredCount + notApplicableCount === checks.length', () => {
    const total = report.passCount + report.failCount + report.deferredCount + report.notApplicableCount;
    expect(total).toBe(report.checks.length);
  });

  it('counts are non-negative integers', () => {
    expect(report.passCount).toBeGreaterThanOrEqual(0);
    expect(report.failCount).toBeGreaterThanOrEqual(0);
    expect(report.deferredCount).toBeGreaterThanOrEqual(0);
    expect(report.notApplicableCount).toBeGreaterThanOrEqual(0);
  });

  it('overallStatus is one of pass | fail | partial', () => {
    expect(['pass', 'fail', 'partial']).toContain(report.overallStatus);
  });

  it('caveat is non-empty', () => {
    expect(typeof report.caveat).toBe('string');
    expect(report.caveat.length).toBeGreaterThan(0);
  });

  it('report.deterministicSeed is true', () => {
    expect(report.deterministicSeed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Required checks are present
// ---------------------------------------------------------------------------

describe('QA28 — Active Route Shell Verification: required checks present', () => {
  function findCheck(predicate: (c: ShellVerificationCheck) => boolean): ShellVerificationCheck | undefined {
    return report.checks.find(predicate);
  }

  it('programs route check is present', () => {
    const check = findCheck(
      (c) => c.route.includes('tenant') && c.route.includes('programs') && !c.route.includes('[programSlug]'),
    );
    expect(check).toBeDefined();
  });

  it('program detail (flagship) route check is present', () => {
    const check = findCheck(
      (c) => c.route.includes('[programSlug]') && c.route.includes('tenant'),
    );
    expect(check).toBeDefined();
  });

  it('source events route check is present', () => {
    const check = findCheck(
      (c) => c.route.includes('source/events') && c.route.includes('[eventId]'),
    );
    expect(check).toBeDefined();
  });

  it('ProgramFlagshipPage check is present', () => {
    const check = findCheck((c) => c.route.includes('ProgramFlagshipPage'));
    expect(check).toBeDefined();
  });

  it('SourceCommercialEventSection check is present', () => {
    const check = findCheck((c) => c.route.includes('SourceCommercialEventSection'));
    expect(check).toBeDefined();
  });

  it('legacy TopBar check is present', () => {
    const check = findCheck((c) => c.route.includes('TopBar') || c.description.toLowerCase().includes('topbar'));
    expect(check).toBeDefined();
  });

  it('platform admin root route check is present', () => {
    const check = findCheck(
      (c) =>
        c.route.includes('platform/admin') &&
        !c.route.includes('architecture') &&
        !c.route.includes('production-readiness') &&
        c.route.endsWith('page.tsx'),
    );
    expect(check).toBeDefined();
  });

  it('Wave-19 source-program-link.ts check is present', () => {
    const check = findCheck((c) => c.route.includes('source-program-link'));
    expect(check).toBeDefined();
  });

  it('Wave-19 apex-retail demo scenario check is present', () => {
    const check = findCheck((c) => c.route.includes('source-commercial-demo-scenario'));
    expect(check).toBeDefined();
  });

  it('build-slices.json validity check is present', () => {
    const check = findCheck((c) => c.route.includes('build-slices.json'));
    expect(check).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Wave-20 deferred checks
// ---------------------------------------------------------------------------

describe('QA28 — Active Route Shell Verification: Wave-20 deferred items', () => {
  const wave20ComponentPaths = [
    'AbarVaAppShell',
    'ProgramRouteShell',
    'SentinelAgentColumn', // Wave S1: SourceRouteShell retired, replaced by SentinelAgentColumn
    'AdminRouteShell',
    'IntelligenceRouteShell',
    'TowerRouteShell',
  ];

  for (const componentName of wave20ComponentPaths) {
    it(`${componentName} check status is 'deferred' or 'pass' (not 'fail')`, () => {
      const check = report.checks.find((c) => c.route.includes(componentName));
      expect(check).toBeDefined();
      // Pre-integration: deferred. Post-integration: pass. Never fail.
      expect(['deferred', 'pass']).toContain(check!.status);
    });
  }
});

// ---------------------------------------------------------------------------
// Suite 4: Known-present items should pass
// ---------------------------------------------------------------------------

describe('QA28 — Active Route Shell Verification: known-present items pass', () => {
  it('programs list route check passes (route file exists in this branch)', () => {
    const check = report.checks.find(
      (c) => c.checkId === 'QA28-C01',
    );
    expect(check).toBeDefined();
    expect(check!.status).toBe('pass');
  });

  it('source event route check passes', () => {
    const check = report.checks.find((c) => c.checkId === 'QA28-C03');
    expect(check).toBeDefined();
    expect(check!.status).toBe('pass');
  });

  it('ProgramFlagshipPage check passes', () => {
    const check = report.checks.find((c) => c.checkId === 'QA28-C07');
    expect(check).toBeDefined();
    expect(check!.status).toBe('pass');
  });

  it('SourceCommercialEventSection check passes', () => {
    const check = report.checks.find((c) => c.checkId === 'QA28-C08');
    expect(check).toBeDefined();
    expect(check!.status).toBe('pass');
  });

  it('legacy TopBar check passes', () => {
    const check = report.checks.find((c) => c.checkId === 'QA28-C15');
    expect(check).toBeDefined();
    expect(check!.status).toBe('pass');
  });

  it('programs route has no chrome/ import — passes', () => {
    const check = report.checks.find((c) => c.checkId === 'QA28-C16');
    expect(check).toBeDefined();
    expect(check!.status).toBe('pass');
  });

  it('source event route has no chrome/ import — passes', () => {
    const check = report.checks.find((c) => c.checkId === 'QA28-C17');
    expect(check).toBeDefined();
    expect(check!.status).toBe('pass');
  });

  it('source-program-link.ts check passes (Wave-19 LINK1 is integrated)', () => {
    const check = report.checks.find((c) => c.checkId === 'QA28-C18');
    expect(check).toBeDefined();
    expect(check!.status).toBe('pass');
  });

  it("source-commercial-demo-scenario.ts 'apex-retail' check passes (Wave-19 SRC32 is integrated)", () => {
    const check = report.checks.find((c) => c.checkId === 'QA28-C19');
    expect(check).toBeDefined();
    expect(check!.status).toBe('pass');
  });

  it('build-slices.json is valid JSON — check passes', () => {
    const check = report.checks.find((c) => c.checkId === 'QA28-C20');
    expect(check).toBeDefined();
    expect(check!.status).toBe('pass');
  });
});

// ---------------------------------------------------------------------------
// Suite 5: Determinism
// ---------------------------------------------------------------------------

describe('QA28 — Active Route Shell Verification: determinism', () => {
  it('running the function twice produces identical results', () => {
    const report1 = runActiveRouteShellVerification();
    const report2 = runActiveRouteShellVerification();
    expect(report1.passCount).toBe(report2.passCount);
    expect(report1.failCount).toBe(report2.failCount);
    expect(report1.deferredCount).toBe(report2.deferredCount);
    expect(report1.overallStatus).toBe(report2.overallStatus);
    expect(report1.checks.length).toBe(report2.checks.length);
    for (let i = 0; i < report1.checks.length; i++) {
      expect(report1.checks[i].checkId).toBe(report2.checks[i].checkId);
      expect(report1.checks[i].status).toBe(report2.checks[i].status);
    }
  });
});
