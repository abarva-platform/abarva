import { getSpecialistContribution } from './specialist-test-utils';

describe('ValueAtStakeSummarizer specialist', () => {
  const contribution = () => getSpecialistContribution('value-at-stake-summarizer').contribution;

  it('uses the required value label in primaryFinding', () => {
    expect(contribution().primaryFinding).toMatch(/^\$[\d,]+ (projected|seeded|realized) value at stake\. /);
  });

  it('uses medium confidence when evidence citations exist', () => {
    expect(contribution().confidence).toBe('medium');
  });

  it('blocks realized-value language without measurement evidence', () => {
    expect(contribution().cannotProceedReasons).toContain(
      'Atlas cannot label value as realized without measurement evidence.',
    );
  });

  it('names the Atlas handoff recommendation', () => {
    expect(contribution().handoffRecommendation).toContain('Atlas to Nexus');
  });
});
