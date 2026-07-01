import {
  buildSkyHarborCtoReadinessPromptAddendum,
  buildSkyHarborCtoReadinessSource,
  isSkyHarborCtoReadinessQuestion,
  isSkyHarborTenantKey,
} from '../skyharbor-cto-readiness-source';

describe('SkyHarbor CTO readiness ask source', () => {
  it('recognizes SkyHarbor tenant aliases', () => {
    expect(isSkyHarborTenantKey('skyharbor-air')).toBe(true);
    expect(isSkyHarborTenantKey('SkyHarbor Air Group')).toBe(true);
    expect(isSkyHarborTenantKey('lakeshore-industries')).toBe(false);
  });

  it('recognizes CTO/IROPS readiness questions without matching unrelated prompts', () => {
    expect(isSkyHarborCtoReadinessQuestion('What is blocking agentic IROPS from scaling?')).toBe(true);
    expect(isSkyHarborCtoReadinessQuestion('What data must be certified before autonomous recovery decisions?')).toBe(true);
    expect(isSkyHarborCtoReadinessQuestion('What should the CTO fund first for AI readiness?')).toBe(true);
    expect(isSkyHarborCtoReadinessQuestion('What evidence gaps matter before a board decision?')).toBe(true);
    expect(isSkyHarborCtoReadinessQuestion('Summarize the last conversation in one sentence.')).toBe(false);
  });

  it('builds a high-priority tenant source only for SkyHarbor readiness questions', () => {
    const source = buildSkyHarborCtoReadinessSource('What is blocking agentic IROPS from scaling?', [
      'skyharbor-air',
    ]);

    expect(source).toMatchObject({
      type: 'TENANT',
      id: 'skyharbor-cto-readiness',
      name: 'SkyHarbor CTO IROPS readiness context',
      confidence: 0.92,
    });
    expect(source?.detail).toContain('Recommended decision posture: fund readiness before autonomous scale.');
    expect(source?.detail).toContain('Operations Control Center Platform');
    expect(source?.detail).toContain('Finance-approved disruption cost baseline');
    expect(source?.detail).toContain('Board decision readiness spine');
    expect(source?.detail).toContain('Vendor/system linkage');
    expect(source?.detail).not.toContain('lakeshore');

    expect(buildSkyHarborCtoReadinessSource('What is blocking agentic IROPS from scaling?', [
      'lakeshore-industries',
    ])).toBeNull();
    expect(buildSkyHarborCtoReadinessSource('What should legal automate?', [
      'skyharbor-air',
    ])).toBeNull();
  });

  it('adds a prompt addendum that asks Claude to own tabs and assumptions', () => {
    const addendum = buildSkyHarborCtoReadinessPromptAddendum('Is the IROPS AI case board-grade today?', [
      'skyharbor-air',
    ]);

    expect(addendum).toContain('SKYHARBOR CTO DEMO MODE');
    expect(addendum).toContain('user-visible advisor identity is aVa');
    expect(addendum).toContain('known SkyHarbor context');
    expect(addendum).toContain('planning assumptions');
    expect(addendum).toContain('client-signoff-required');
    expect(addendum).toContain('Decision, Visual, Evidence, Assumptions');
  });
});
