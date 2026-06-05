import {
  runLogoUsageEnforcement,
  getBannedLogoPatterns,
  listLogoEnforcementTargetFiles,
  BANNED_LOGO_PATTERNS,
} from '@/lib/qa/logo-usage-enforcement';

describe('BRAND2 Logo Usage Enforcement', () => {
  it('runLogoUsageEnforcement() returns without throwing', () => {
    expect(() => runLogoUsageEnforcement()).not.toThrow();
  });

  it('checks array is non-empty', () => {
    const report = runLogoUsageEnforcement();
    expect(report.checks.length).toBeGreaterThan(0);
  });

  it('every check has required fields: checkId, targetFile, description, status, detail, deterministicSeed', () => {
    const report = runLogoUsageEnforcement();
    for (const check of report.checks) {
      expect(typeof check.checkId).toBe('string');
      expect(check.checkId.length).toBeGreaterThan(0);
      expect(typeof check.targetFile).toBe('string');
      expect(check.targetFile.length).toBeGreaterThan(0);
      expect(typeof check.description).toBe('string');
      expect(check.description.length).toBeGreaterThan(0);
      expect(['pass', 'fail', 'deferred', 'not_applicable']).toContain(check.status);
      expect(typeof check.detail).toBe('string');
      expect(check.deterministicSeed).toBe(true);
    }
  });

  it('passCount + failCount + deferredCount <= checks.length', () => {
    const report = runLogoUsageEnforcement();
    expect(report.passCount + report.failCount + report.deferredCount).toBeLessThanOrEqual(report.checks.length);
  });

  it('BANNED_LOGO_PATTERNS includes #14B8A6 and Sanskrit ॐ', () => {
    expect(BANNED_LOGO_PATTERNS).toContain('#14B8A6');
    expect(BANNED_LOGO_PATTERNS).toContain('ॐ');
  });

  it('overallStatus is pass, fail, or partial', () => {
    const report = runLogoUsageEnforcement();
    expect(['pass', 'fail', 'partial']).toContain(report.overallStatus);
  });

  it('failCount === 0 (no enforcement failures in canonical codebase)', () => {
    const report = runLogoUsageEnforcement();
    expect(report.failCount).toBe(0);
  });

  it('BRAND2-C1 check (logo asset) is present', () => {
    const report = runLogoUsageEnforcement();
    const c1 = report.checks.find(c => c.checkId === 'BRAND2-C1');
    expect(c1).toBeDefined();
    expect(c1!.targetFile).toBe('public/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-compact.svg');
  });

  it('BRAND2-C2 check (component) is present and pass or deferred', () => {
    const report = runLogoUsageEnforcement();
    const c2 = report.checks.find(c => c.checkId === 'BRAND2-C2');
    expect(c2).toBeDefined();
    expect(['pass', 'deferred']).toContain(c2!.status);
  });

  it('guards against ghost top-bar variants and retired root logo assets returning', () => {
    const report = runLogoUsageEnforcement();
    const retiredChecks = report.checks.filter((check) =>
      check.checkId.startsWith('BRAND2-C9-') || check.checkId.startsWith('BRAND2-C10-'),
    );
    expect(retiredChecks.length).toBeGreaterThanOrEqual(10);
    expect(retiredChecks.every((check) => check.status === 'pass')).toBe(true);
  });

  it('getBannedLogoPatterns() returns non-empty array', () => {
    const patterns = getBannedLogoPatterns();
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('listLogoEnforcementTargetFiles() returns array', () => {
    const files = listLogoEnforcementTargetFiles();
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  it('report has deterministicSeed flag', () => {
    const report = runLogoUsageEnforcement();
    expect(report.deterministicSeed).toBe(true);
  });

  it('report has caveat string', () => {
    const report = runLogoUsageEnforcement();
    expect(typeof report.caveat).toBe('string');
    expect(report.caveat.length).toBeGreaterThan(0);
  });
});
