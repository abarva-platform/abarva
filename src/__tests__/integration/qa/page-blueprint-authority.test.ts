/**
 * PX1 — Page Blueprint Authority Tests
 * Verifies that all required page blueprints exist and meet minimum structure requirements.
 * All checks are deterministic filesystem scans. No jsdom/React. No model calls.
 */

import {
  runPageBlueprintAuthorityCheck,
  listRequiredBlueprints,
  BlueprintAuthorityReport,
} from '../../../lib/qa/page-blueprint-authority';

describe('PX1 — Page Blueprint Authority', () => {
  let report: BlueprintAuthorityReport;

  beforeAll(() => {
    report = runPageBlueprintAuthorityCheck();
  });

  it('runPageBlueprintAuthorityCheck() returns without throwing', () => {
    expect(report).toBeDefined();
    expect(typeof report).toBe('object');
  });

  it('blueprintCount === 12', () => {
    expect(report.blueprintCount).toBe(12);
  });

  it('checks array is non-empty (at least 50 checks)', () => {
    expect(report.checks.length).toBeGreaterThanOrEqual(50);
  });

  it('every check has required fields', () => {
    for (const check of report.checks) {
      expect(check).toHaveProperty('checkId');
      expect(check).toHaveProperty('pageName');
      expect(check).toHaveProperty('description');
      expect(check).toHaveProperty('status');
      expect(check).toHaveProperty('detail');
      expect(check).toHaveProperty('deterministicSeed');
      expect(typeof check.checkId).toBe('string');
      expect(check.checkId.length).toBeGreaterThan(0);
      expect(typeof check.pageName).toBe('string');
      expect(check.pageName.length).toBeGreaterThan(0);
      expect(typeof check.description).toBe('string');
      expect(check.description.length).toBeGreaterThan(0);
      expect(['pass', 'fail', 'deferred']).toContain(check.status);
      expect(typeof check.detail).toBe('string');
      expect(check.deterministicSeed).toBe(true);
    }
  });

  it('passCount + failCount + deferredCount === checks.length', () => {
    expect(report.passCount + report.failCount + report.deferredCount).toBe(report.checks.length);
  });

  it('overallStatus is "pass" (all blueprints should exist after PX1)', () => {
    expect(report.overallStatus).toBe('pass');
  });

  it('failCount === 0', () => {
    if (report.failCount > 0) {
      const failures = report.checks.filter(c => c.status === 'fail');
      const failDetails = failures.map(f => `${f.checkId}: ${f.detail}`).join('\n');
      throw new Error(`Expected 0 failures but got ${report.failCount}:\n${failDetails}`);
    }
    expect(report.failCount).toBe(0);
  });

  it('AGENTX enforcement check is present', () => {
    const agentxCheck = report.checks.find(c => c.checkId === 'PX1-AGENTX');
    expect(agentxCheck).toBeDefined();
    expect(agentxCheck!.status).toBe('pass');
  });

  it('PAGE_EXPERIENCE_BLUEPRINT_STANDARD check passes', () => {
    const standardCheck = report.checks.find(
      c => c.checkId === 'PX1-BP01-exists' && c.pageName === 'Blueprint Standard'
    );
    expect(standardCheck).toBeDefined();
    expect(standardCheck!.status).toBe('pass');
  });

  it('workflow enforcement rules check passes', () => {
    const workflowCheck = report.checks.find(c => c.checkId === 'PX1-WORKFLOW');
    expect(workflowCheck).toBeDefined();
    expect(workflowCheck!.status).toBe('pass');
  });

  it('report has deterministicSeed: true', () => {
    expect(report.deterministicSeed).toBe(true);
  });

  it('report has a non-empty caveat', () => {
    expect(typeof report.caveat).toBe('string');
    expect(report.caveat.length).toBeGreaterThan(0);
  });

  it('listRequiredBlueprints() returns array of length 12', () => {
    const blueprints = listRequiredBlueprints();
    expect(Array.isArray(blueprints)).toBe(true);
    expect(blueprints).toHaveLength(12);
  });

  it('every required blueprint has file and name', () => {
    const blueprints = listRequiredBlueprints();
    for (const bp of blueprints) {
      expect(typeof bp.file).toBe('string');
      expect(bp.file.length).toBeGreaterThan(0);
      expect(bp.file.endsWith('.md')).toBe(true);
      expect(typeof bp.name).toBe('string');
      expect(bp.name.length).toBeGreaterThan(0);
    }
  });

  it('all blueprint existence checks pass', () => {
    const existenceChecks = report.checks.filter(c => c.checkId.endsWith('-exists'));
    const failedExistence = existenceChecks.filter(c => c.status === 'fail');
    if (failedExistence.length > 0) {
      const details = failedExistence.map(c => `${c.checkId}: ${c.detail}`).join('\n');
      throw new Error(`Missing blueprint files:\n${details}`);
    }
    expect(failedExistence).toHaveLength(0);
  });

  it('all blueprint substantial-length checks pass', () => {
    const substantialChecks = report.checks.filter(c => c.checkId.endsWith('-substantial'));
    const failedSubstantial = substantialChecks.filter(c => c.status === 'fail');
    if (failedSubstantial.length > 0) {
      const details = failedSubstantial.map(c => `${c.checkId}: ${c.detail}`).join('\n');
      throw new Error(`Thin/empty blueprints found:\n${details}`);
    }
    expect(failedSubstantial).toHaveLength(0);
  });

  it('all blueprint data-contract checks pass', () => {
    const dataContractChecks = report.checks.filter(c => c.checkId.endsWith('-data-contract'));
    const failed = dataContractChecks.filter(c => c.status === 'fail');
    if (failed.length > 0) {
      const details = failed.map(c => `${c.checkId}: ${c.detail}`).join('\n');
      throw new Error(`Blueprints missing data contract section:\n${details}`);
    }
    expect(failed).toHaveLength(0);
  });

  it('all blueprint agent checks pass', () => {
    const agentChecks = report.checks.filter(c => c.checkId.endsWith('-agent'));
    const failed = agentChecks.filter(c => c.status === 'fail');
    if (failed.length > 0) {
      const details = failed.map(c => `${c.checkId}: ${c.detail}`).join('\n');
      throw new Error(`Blueprints missing agent reference:\n${details}`);
    }
    expect(failed).toHaveLength(0);
  });

  it('all blueprint acceptance-criteria checks pass', () => {
    const acChecks = report.checks.filter(c => c.checkId.endsWith('-acceptance'));
    const failed = acChecks.filter(c => c.status === 'fail');
    if (failed.length > 0) {
      const details = failed.map(c => `${c.checkId}: ${c.detail}`).join('\n');
      throw new Error(`Blueprints missing acceptance criteria:\n${details}`);
    }
    expect(failed).toHaveLength(0);
  });
});
