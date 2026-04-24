// FM-03 sponsor commitment validation · Cycle 3 Wave 1

import {
  validateSponsorCommitment,
  VALIDATION_REASON_COPY,
  type SponsorCommitmentInput,
} from '@/lib/workflow/sponsorCommitment';

function validFixture(): SponsorCommitmentInput {
  return {
    programCode: 'APX-01',
    budgetCeiling: { amount: 240_000_000, currency: 'USD', scope: 'three-year program envelope' },
    decisionGates: [
      { phase: 1, moment: 'Charter sign-off', willOwn: true },
      { phase: 2, moment: 'Scope freeze before diagnosis close', willOwn: true },
      { phase: 3, moment: 'Vendor selection', willOwn: true },
    ],
    resistanceInterventions: 'I will take the first call when a regional leader escalates and personally resolve it within 48 hours.',
    timeAllocation: { hoursPerWeek: 6, commitmentTermWeeks: 36 },
  };
}

describe('validateSponsorCommitment', () => {
  test('valid fixture returns no errors', () => {
    expect(validateSponsorCommitment(validFixture())).toEqual([]);
  });

  test('missing programCode flagged', () => {
    const input = { ...validFixture(), programCode: '' };
    const errors = validateSponsorCommitment(input);
    expect(errors).toContainEqual({ field: 'programCode', reason: 'required' });
  });

  test('negative budget flagged', () => {
    const input = validFixture();
    input.budgetCeiling.amount = -1;
    const errors = validateSponsorCommitment(input);
    expect(errors).toContainEqual({ field: 'budgetCeiling', reason: 'must_be_positive' });
  });

  test('zero decision gates flagged', () => {
    const input = { ...validFixture(), decisionGates: [] };
    const errors = validateSponsorCommitment(input);
    expect(errors).toContainEqual({ field: 'decisionGates', reason: 'required_minimum_one' });
  });

  test('unowned gate flagged · "must_own_all"', () => {
    const input = validFixture();
    input.decisionGates[1].willOwn = false;
    const errors = validateSponsorCommitment(input);
    expect(errors).toContainEqual({ field: 'decisionGates', reason: 'must_own_all' });
  });

  test('short resistance intervention flagged', () => {
    const input = { ...validFixture(), resistanceInterventions: 'tbd' };
    const errors = validateSponsorCommitment(input);
    expect(errors).toContainEqual({ field: 'resistanceInterventions', reason: 'too_short' });
  });

  test('negative time allocation flagged', () => {
    const input = validFixture();
    input.timeAllocation.hoursPerWeek = -1;
    const errors = validateSponsorCommitment(input);
    expect(errors).toContainEqual({ field: 'timeAllocation', reason: 'must_be_positive' });
  });

  test('multiple errors returned in parallel · not short-circuited', () => {
    const errors = validateSponsorCommitment({
      programCode: '',
      resistanceInterventions: '',
    });
    const fields = new Set(errors.map((e) => e.field));
    expect(fields.has('programCode')).toBe(true);
    expect(fields.has('budgetCeiling')).toBe(true);
    expect(fields.has('decisionGates')).toBe(true);
    expect(fields.has('resistanceInterventions')).toBe(true);
    expect(fields.has('timeAllocation')).toBe(true);
  });

  test('every validation reason has UI copy', () => {
    const reasons: Array<string> = ['required', 'must_be_positive', 'required_minimum_one', 'must_own_all', 'too_short'];
    for (const reason of reasons) {
      expect(VALIDATION_REASON_COPY[reason as keyof typeof VALIDATION_REASON_COPY]).toMatch(/./);
    }
  });
});
