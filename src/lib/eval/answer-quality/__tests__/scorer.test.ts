import { scoreAnswer } from '../scorer';

const context = {
  questionId: 'wave0-fixture',
  tenantKey: 'apex-retail',
  surface: 'tower',
};

describe('scoreAnswer', () => {
  it('passes a sourced, executive-readable answer with a concrete next move', () => {
    const result = scoreAnswer(
      'Apex Retail should hold the labor optimization gate because adoption evidence is below the loaded threshold as of 2026-05-31. Next step: assign the program owner to validate the adoption evidence before approving the next gate.',
      context,
    );

    expect(result.gatePassed).toBe(true);
    expect(result.overall).toBeGreaterThanOrEqual(75);
    expect(result.violations).toEqual([]);
  });

  it('blocks raw ids and vague action language', () => {
    const result = scoreAnswer(
      'signal:39901c16-2e8b-4c8c-80aa-8a0182f26754 indicates risk. Keep an eye on it.',
      context,
    );

    expect(result.gatePassed).toBe(false);
    expect(result.violations.map((violation) => violation.dimension)).toEqual(
      expect.arrayContaining(['noRawIds', 'realNextMove']),
    );
  });

  it('penalizes precise numbers without evidence basis', () => {
    const result = scoreAnswer(
      'This move will save $48.7M. Next step: approve it.',
      context,
    );

    expect(result.gatePassed).toBe(false);
    expect(result.violations.some((violation) => violation.dimension === 'noFakePrecision')).toBe(true);
  });
});
