import { getSpecialistContribution } from './specialist-test-utils';

describe('EvidenceGapDetector specialist', () => {
  const contribution = () => getSpecialistContribution('evidence-gap-detector').contribution;

  it('names the critical evidence gap and downstream risk in primaryFinding', () => {
    expect(contribution().primaryFinding).toMatch(/could make the downstream recommendation non-decision-grade\.$/);
  });

  it('uses medium confidence when evidence gaps exist', () => {
    expect(contribution().confidence).toBe('medium');
  });

  it('uses reject reasons only for cannotProceedReasons', () => {
    expect(contribution().cannotProceedReasons).toEqual([]);
  });

  it('names the Nexus handoff recommendation and required action chips', () => {
    const result = contribution();

    expect(result.handoffRecommendation).toContain('Sentinel to Nexus');
    expect(result.suggestedActions.map((action) => action.label)).toEqual([
      'Show evidence gaps',
      'Explain weak claims',
    ]);
  });
});
