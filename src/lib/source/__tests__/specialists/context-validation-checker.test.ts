import { getSpecialistContribution } from './specialist-test-utils';

describe('ContextValidationChecker specialist', () => {
  const contribution = () => getSpecialistContribution('context-validation-checker').contribution;

  it('uses the required primaryFinding verdict format', () => {
    expect(contribution().primaryFinding).toMatch(/^Context validation verdict is \w+; .+\.$/);
  });

  it('downgrades confidence when validation defers exist', () => {
    expect(contribution().confidence).toBe('medium');
  });

  it('keeps cannotProceedReasons limited to reject reasons', () => {
    expect(contribution().cannotProceedReasons).toEqual([]);
  });

  it('names the Nexus handoff recommendation', () => {
    expect(contribution().handoffRecommendation).toContain('Sentinel to Nexus');
  });
});
