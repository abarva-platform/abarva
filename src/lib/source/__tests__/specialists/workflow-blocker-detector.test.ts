import { getSpecialistContribution } from './specialist-test-utils';

describe('WorkflowBlockerDetector specialist', () => {
  const contribution = () => getSpecialistContribution('workflow-blocker-detector').contribution;

  it('uses one of the fixed primaryFinding forms', () => {
    expect([
      'Workflow validation has failed expectations; review should stop.',
      'Workflow gates contain blockers that must remain enforced.',
      'No workflow blocker was found in the provided deterministic context.',
    ]).toContain(contribution().primaryFinding);
  });

  it('uses high confidence when workflowValidationReport exists', () => {
    expect(contribution().confidence).toBe('high');
  });

  it('combines blockers into cannotProceedReasons', () => {
    expect(contribution().cannotProceedReasons.length).toBeGreaterThan(0);
  });

  it('names the Steward to Nexus handoff recommendation', () => {
    expect(contribution().handoffRecommendation).toContain('Steward to Nexus');
  });
});
