import { getSpecialistContribution } from './specialist-test-utils';

describe('ExecutiveDecisionBriefWriter specialist', () => {
  const contribution = () => getSpecialistContribution('executive-decision-brief-writer').contribution;

  it('uses the required decision primaryFinding format', () => {
    expect(contribution().primaryFinding).toMatch(
      /^Decision: .+ vs .+ - turning on .+\. Value at stake: \$[\d,]+ (projected|seeded|realized)\.$/,
    );
  });

  it('inherits bounded value confidence', () => {
    expect(contribution().confidence).toBe('medium');
  });

  it('records blocking inputs as cannotProceedReasons', () => {
    expect(contribution().cannotProceedReasons.length).toBeGreaterThan(0);
  });

  it('names the Nexus handoff recommendation and keeps the brief to three sentences', () => {
    const result = contribution();
    const sentenceCount = result.summary.split('.').filter((part) => part.trim()).length;

    expect(result.handoffRecommendation).toContain('Atlas to Nexus');
    expect(sentenceCount).toBe(3);
  });
});
