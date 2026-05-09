import { getSpecialistContribution } from './specialist-test-utils';

describe('NextActionRecommender specialist', () => {
  const contribution = () => getSpecialistContribution('next-action-recommender').contribution;

  it('uses the required ACTION primaryFinding format', () => {
    expect(contribution().primaryFinding).toMatch(/^\[ACTION\] .+ - required to .+\.$/);
  });

  it('downgrades confidence when missing inputs or blockers exist', () => {
    expect(['low', 'medium']).toContain(contribution().confidence);
  });

  it('lists blocker cannotProceedReasons when gate blockers exist', () => {
    expect(contribution().cannotProceedReasons.length).toBeGreaterThan(0);
  });

  it('names the Steward handoff recommendation when blocked', () => {
    expect(contribution().handoffRecommendation).toContain('Nexus to Steward');
  });
});
