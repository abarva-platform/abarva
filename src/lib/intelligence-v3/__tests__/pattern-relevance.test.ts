// Guards the Intelligence → Move pattern binding against the off-domain
// mis-bind that put PAT-LSH-D18-00479 ("City and State Procurement Calendars")
// on a Kyriba treasury decision. Binding must be relevance-driven and fail
// closed, not positional.

import {
  patternRelevanceScore,
  selectRelevantPatternRows,
  MIN_PATTERN_RELEVANCE,
} from '../pattern-relevance';

const TREASURY = {
  slug: 'pat-lsh-d08-00012',
  title: 'Bank connectivity matrix clears before Kyriba treasury rollout confidence',
  category: 'D08',
  vertical_overlays: ['treasury', 'payments'],
  depth_score: 70,
};

const GOVTECH = {
  slug: 'pat-lsh-d18-00479',
  title: 'Prioritize City and State Procurement Calendars For Timing Local Bids',
  category: 'D18',
  vertical_overlays: ['public_sector'],
  depth_score: 99, // higher depth — would win a positional/depth-ranked bind
};

const KYRIBA_USE_CASE =
  'Kyriba global treasury rollout — modernize treasury and bank connectivity';

describe('pattern relevance binding (Intelligence → Move guardrail)', () => {
  it('scores an on-domain pattern above an off-domain one for the same use case', () => {
    const onDomain = patternRelevanceScore(KYRIBA_USE_CASE, `${TREASURY.title} ${TREASURY.category}`);
    const offDomain = patternRelevanceScore(KYRIBA_USE_CASE, `${GOVTECH.title} ${GOVTECH.category}`);
    expect(onDomain).toBeGreaterThanOrEqual(MIN_PATTERN_RELEVANCE);
    expect(onDomain).toBeGreaterThan(offDomain);
  });

  it('binds the Kyriba bet to the treasury pattern, NOT the higher-depth govtech one', () => {
    // GOVTECH has the higher depth_score, so a positional/depth bind would pick
    // it. Relevance binding must pick TREASURY instead.
    const bound = selectRelevantPatternRows(KYRIBA_USE_CASE, [GOVTECH, TREASURY]);
    expect(bound).toHaveLength(1);
    expect(bound[0]!.slug).toBe('pat-lsh-d08-00012');
  });

  it('fails closed (binds nothing) when no candidate is relevant', () => {
    const bound = selectRelevantPatternRows(KYRIBA_USE_CASE, [GOVTECH]);
    expect(bound).toEqual([]);
  });

  it('returns nothing for an empty candidate set rather than throwing', () => {
    expect(selectRelevantPatternRows(KYRIBA_USE_CASE, [])).toEqual([]);
  });
});
