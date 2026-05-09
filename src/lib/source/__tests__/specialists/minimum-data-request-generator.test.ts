import { getSpecialistContribution } from './specialist-test-utils';

describe('MinimumDataRequestGenerator specialist', () => {
  const contribution = () => getSpecialistContribution('minimum-data-request-generator').contribution;

  it('uses the required minimum data request primaryFinding format', () => {
    expect(contribution().primaryFinding).toMatch(/^The minimum data request to advance is: \[\d+ items?\]/);
  });

  it('keeps confidence medium until artifacts arrive', () => {
    expect(contribution().confidence).toBe('medium');
  });

  it('treats missing request items as cannotProceedReasons', () => {
    expect(contribution().cannotProceedReasons.length).toBeGreaterThan(0);
  });

  it('names the Steward handoff recommendation', () => {
    expect(contribution().handoffRecommendation).toContain('Nexus to Steward');
  });
});
