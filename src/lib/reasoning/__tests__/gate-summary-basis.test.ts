import {
  describeGateSummary,
  gateSummaryBasis,
  isCriteriaMeasured,
} from '../gate-summary-basis';

describe('gateSummaryBasis', () => {
  it('reads the stamped basis', () => {
    expect(gateSummaryBasis({ total: 4, met: 2, basis: 'criteria' })).toBe('criteria');
    expect(gateSummaryBasis({ total: 1, met: 0, basis: 'gate-standing' })).toBe(
      'gate-standing',
    );
  });

  it('does NOT infer gate-standing from a total of one', () => {
    // A pattern may declare exactly one criterion for a stage. Guessing from
    // the total would relabel that real measurement as unmeasured.
    expect(gateSummaryBasis({ total: 1, met: 1 })).toBe('criteria');
    expect(isCriteriaMeasured({ total: 1, met: 0 })).toBe(true);
  });
});

describe('describeGateSummary', () => {
  it('keeps ratio wording for an evaluated criteria count', () => {
    expect(describeGateSummary({ total: 4, met: 3, basis: 'criteria' })).toBe(
      '3 of 4 gate criteria met',
    );
  });

  it('states that no criteria were evaluated when the basis is gate standing', () => {
    const notApproved = describeGateSummary({
      total: 1,
      met: 0,
      basis: 'gate-standing',
    });
    expect(notApproved).toBe('Gate not approved — no criteria evaluated');

    const approved = describeGateSummary({ total: 1, met: 1, basis: 'gate-standing' });
    expect(approved).toBe('Gate approved — no criteria evaluated');
  });

  it('never formats a gate-standing summary as a ratio of criteria', () => {
    // The defect this module exists to prevent: "0 of 1 gate criteria met" for
    // an instance where nothing was assessed. Derived from what the BUG emits,
    // so reverting the basis branch fails here.
    for (const met of [0, 1]) {
      const line = describeGateSummary({ total: 1, met, basis: 'gate-standing' });
      expect(line).not.toMatch(/\bof\b\s*1\b/);
      expect(line).not.toMatch(/criteria met/);
      expect(line).toMatch(/no criteria evaluated/);
    }
  });

  it('distinguishes the two bases on the same numbers', () => {
    // Same met/total, different basis -> different sentence. Pins that the
    // wording is driven by the basis and not by the counts.
    const numbers = { total: 1, met: 1 };
    expect(describeGateSummary({ ...numbers, basis: 'criteria' })).not.toBe(
      describeGateSummary({ ...numbers, basis: 'gate-standing' }),
    );
  });
});
