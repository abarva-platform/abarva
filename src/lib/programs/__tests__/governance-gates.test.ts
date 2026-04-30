import { findGateRule } from '@/lib/programs/governance';

describe('program governance gate map', () => {
  it('defines the first approved-program transition from P0 to P1', () => {
    const rule = findGateRule(0, 1);

    expect(rule).toBeTruthy();
    expect(rule?.hard).toBe(false);
    expect(rule?.checks.some((check) => check.key === 'sponsor_assigned')).toBe(true);
  });
});
