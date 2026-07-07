// CI guard: the corpus grounding battery must stay at 100%.
//
// Exercises the real production binding path (bindMoveFunctionPack +
// resolveFunctionPack) for 100+ questions and asserts the Domain Function Pack
// corpus grounds every one — so grounding cannot silently regress when a pack
// is edited.

import {
  GROUNDING_QUESTIONS,
  runGroundingBattery,
} from '../grounding/corpus-grounding-battery';

describe('corpus grounding battery', () => {
  const results = runGroundingBattery();

  it('runs at least 100 grounding questions', () => {
    expect(GROUNDING_QUESTIONS.length).toBeGreaterThanOrEqual(100);
    expect(results.length).toBe(GROUNDING_QUESTIONS.length);
  });

  it('grounds every question (no fallback to general reasoning)', () => {
    const gaps = results.filter((r) => !r.pass);
    // Surface the precise gaps in the failure message if any appear.
    expect(
      gaps.map((g) => `${g.id} [${g.functionKey}] needs ${g.requires}`),
    ).toEqual([]);
  });

  it('grounds the three healthcare hero packs end to end', () => {
    for (const fn of [
      'population_health_value_based_care',
      'clinical_operations_documentation',
      'payer_claims_operations',
    ]) {
      const heroResults = results.filter((r) => r.functionKey === fn);
      expect(heroResults.length).toBeGreaterThan(0);
      expect(heroResults.every((r) => r.pass)).toBe(true);
    }
  });
});
