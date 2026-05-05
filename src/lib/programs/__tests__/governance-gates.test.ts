import { findGateRule } from '@/lib/programs/governance';

describe('program governance gate map (6-phase doctrine)', () => {
  it('defines five gate transitions: P0→P1, P1→P2, P2→P3, P3→P4, P4→P5', () => {
    expect(findGateRule(0, 1)).toBeTruthy();
    expect(findGateRule(1, 2)).toBeTruthy();
    expect(findGateRule(2, 3)).toBeTruthy();
    expect(findGateRule(3, 4)).toBeTruthy();
    expect(findGateRule(4, 5)).toBeTruthy();
  });

  it('does not define a P5→P6 transition (Tower owns post-P5 tracking)', () => {
    expect(findGateRule(5, 6)).toBeNull();
  });

  it('treats P0 → P1 (Originate → Charter) as the chartering gate', () => {
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

  it('treats P1 → P2 (Charter → Discover & Diagnose) as a sponsor-signed charter gate', () => {
    const rule = findGateRule(1, 2);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe('sponsor');
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        'charter_signed_off',
        'sponsor_assigned',
      ]),
    );
  });

  it('treats P2 → P3 (Diagnose → Design) as a discovery synthesis gate', () => {
    const rule = findGateRule(2, 3);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe('sponsor');
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        'discovery_report_signed_off',
        'discovery_notes_ingested',
        'discovery_baseline_attested',
        'discovery_stakeholders_named',
        'p2_readiness_cleared',
      ]),
    );
  });

  it('treats P3 → P4 (Design → Roadmap) as a signed-design to business-case gate', () => {
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

  it('treats P4 → P5 (Roadmap → Mobilize) as the funding + mobilization gate', () => {
    const rule = findGateRule(4, 5);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(true);
    expect(rule?.approverRole).toBe('sponsor');
    expect(rule?.checks.map((check) => check.key)).toEqual(
      expect.arrayContaining([
        'execution_roadmap_drafted',
        'business_case_approved',
        'execution_milestones_defined',
        'execution_success_criteria_defined',
        'readiness_and_change_plan_signed_off',
        'funding_approval_recorded',
        'sponsor_alignment_confirmed',
      ]),
    );
  });
});
