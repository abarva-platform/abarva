import {
  sourceArchetypeProgramSummary,
  sourceArchetypeReadiness,
} from '../readiness';

describe('Source archetype readiness', () => {
  it('reports all ten workflows and industry requirement packs', () => {
    const summary = sourceArchetypeProgramSummary();
    expect(summary.totalArchetypes).toBe(10);
    expect(summary.workflowDefined).toBe(10);
    expect(summary.industryRequirementsDefined).toBe(10);
  });

  it('marks only fully implemented deterministic packs analytics-ready', () => {
    const readiness = sourceArchetypeReadiness();
    const ready = readiness
      .filter((entry) => entry.state === 'analytics_ready')
      .map((entry) => entry.archetypeId)
      .sort();

    expect(ready).toEqual(
      ['AMS_MANAGED_SERVICES', 'CLOUD_FINOPS', 'CONTRACT_RENEWAL'].sort(),
    );
    expect(
      readiness
        .filter((entry) => entry.state === 'workflow_only')
        .every((entry) => entry.blockers.length > 0),
    ).toBe(true);
  });

  it('never declares analytics-ready when a formula is unregistered', () => {
    for (const entry of sourceArchetypeReadiness()) {
      if (entry.state !== 'analytics_ready') continue;
      expect(entry.deterministicLeverCount).toBeGreaterThan(0);
      expect(entry.registeredFormulaCount).toBe(entry.deterministicLeverCount);
      expect(entry.industryMetricCount).toBeGreaterThan(0);
    }
  });
});
