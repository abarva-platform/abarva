import {
  buildSmokeResultFixture,
  validateSmokeResultCapture,
  SmokeResultStatus,
  ReadinessImpact,
  SmokeResultCapture,
} from '../../../lib/qa/e2e-smoke-result-capture';

const VALID_STATUSES: SmokeResultStatus[] = ['pass', 'fail', 'deferred', 'not_run', 'blocked'];
const VALID_READINESS_IMPACTS: ReadinessImpact[] = ['none', 'minor', 'significant', 'critical'];

describe('e2e-smoke-result-capture', () => {
  const capture = buildSmokeResultFixture();
  const run = capture.runs[0];

  it('buildSmokeResultFixture returns valid capture', () => {
    expect(capture).toBeDefined();
    const errors = validateSmokeResultCapture(capture);
    expect(errors).toHaveLength(0);
  });

  it('schemaVersion is 1', () => {
    expect(capture.schemaVersion).toBe(1);
  });

  it('generatedAt is 2026-04-26', () => {
    expect(capture.generatedAt).toBe('2026-04-26');
  });

  it('has exactly 1 run', () => {
    expect(capture.runs).toHaveLength(1);
  });

  it('run.isLiveRun is false', () => {
    expect(run.isLiveRun).toBe(false);
  });

  it('run.environment is local-seed', () => {
    expect(run.environment).toBe('local-seed');
  });

  it('run has 12 route results', () => {
    expect(run.routeResults).toHaveLength(12);
  });

  it('totalRoutes is 12', () => {
    expect(run.totalRoutes).toBe(12);
  });

  it('passedRoutes equals count of routes with status pass', () => {
    const passCount = run.routeResults.filter((r) => r.status === 'pass').length;
    expect(run.passedRoutes).toBe(passCount);
  });

  it('all route IDs are unique', () => {
    const ids = run.routeResults.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('every route has non-empty id, route, persona, notes, nextValidationAction', () => {
    for (const r of run.routeResults) {
      expect(r.id.length).toBeGreaterThan(0);
      expect(r.route.length).toBeGreaterThan(0);
      expect(r.persona.length).toBeGreaterThan(0);
      expect(r.notes.length).toBeGreaterThan(0);
      expect(r.nextValidationAction.length).toBeGreaterThan(0);
    }
  });

  it('every status is a valid SmokeResultStatus', () => {
    for (const r of run.routeResults) {
      expect(VALID_STATUSES).toContain(r.status);
    }
  });

  it('every readinessImpact is a valid ReadinessImpact value', () => {
    for (const r of run.routeResults) {
      expect(VALID_READINESS_IMPACTS).toContain(r.readinessImpact);
    }
  });

  it('all screenshotRef values are null (file-pure mode)', () => {
    for (const r of run.routeResults) {
      expect(r.screenshotRef).toBeNull();
    }
  });

  it('personaResults covers admin, client, guest', () => {
    const personas = run.personaResults.map((p) => p.persona);
    expect(personas).toContain('admin');
    expect(personas).toContain('client');
    expect(personas).toContain('guest');
  });

  it('validateSmokeResultCapture returns empty array for valid fixture', () => {
    const errors = validateSmokeResultCapture(capture);
    expect(errors).toEqual([]);
  });

  it('validateSmokeResultCapture returns errors for schemaVersion 0', () => {
    const invalid: SmokeResultCapture = { ...capture, schemaVersion: 0 };
    const errors = validateSmokeResultCapture(invalid);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('validateSmokeResultCapture returns errors for empty runs', () => {
    const invalid: SmokeResultCapture = { ...capture, runs: [] };
    const errors = validateSmokeResultCapture(invalid);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('validateSmokeResultCapture returns errors when totalRoutes mismatches routeResults.length', () => {
    const badRun = { ...run, totalRoutes: 99 };
    const invalid: SmokeResultCapture = { ...capture, runs: [badRun] };
    const errors = validateSmokeResultCapture(invalid);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('validateSmokeResultCapture returns errors for empty generatedAt', () => {
    const invalid: SmokeResultCapture = { ...capture, generatedAt: '' };
    const errors = validateSmokeResultCapture(invalid);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('run.overallStatus is pass', () => {
    expect(run.overallStatus).toBe('pass');
  });
});
