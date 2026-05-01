import { findGateRule } from '@/lib/programs/governance';

describe('program governance gate map', () => {
  it('defines the first approved-program transition from P0 to P1', () => {
    const rule = findGateRule(0, 1);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe('sponsor');
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        'program_seed_recorded',
        'value_hypothesis_seed',
        'sponsor_assigned',
        'discovery_funding_envelope',
        'initial_scope_boundary',
        'evidence_family_selected',
      ]),
    );
  });

  it('treats P3 to P4 as a signed-design to execution-roadmap gate', () => {
    const rule = findGateRule(3, 4);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe('sponsor');
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        'design_approved',
        'requirements_design_outcome_trace',
        'phase_3_findings_written',
        'cxo_interview_complete',
      ]),
    );
  });

  it('requires an execution roadmap package before P5 approval and mobilization', () => {
    const rule = findGateRule(4, 5);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe('sponsor');
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        'execution_roadmap_drafted',
        'execution_milestones_defined',
        'execution_success_criteria_defined',
        'delivery_raci_named',
        'tower_metric_plan_drafted',
      ]),
    );
  });

  it('requires funding, readiness, and Tower handoff before P6 monitoring setup', () => {
    const rule = findGateRule(5, 6);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe('sponsor');
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        'business_case_approved',
        'funding_approval_recorded',
        'sponsor_alignment_confirmed',
        'readiness_and_change_plan_signed_off',
        'tower_handoff_plan_accepted',
      ]),
    );
  });
});
