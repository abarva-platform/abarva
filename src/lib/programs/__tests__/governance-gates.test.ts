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
});
