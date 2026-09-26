import { traceFacts, checkCoverage, type InstrumentedFact, type TraceSources } from '../evidence-trace';

const fact = (over: Partial<InstrumentedFact>): InstrumentedFact => ({
  factId: 'kpi:aht',
  label: 'Average handle time',
  value: 7.4,
  variants: ['7.4', '7.4 minutes'],
  tab: '05_KPI_Baseline',
  expectation: 'represented',
  ...over,
});

const sources = (over: Partial<TraceSources> = {}): TraceSources => ({
  bundleText: 'AHT 7.4 minutes blended across channels.',
  assignedText: 'AHT 7.4 minutes blended across channels.',
  citedText: 'Average handle time stands at 7.4 minutes [12].',
  deckText: 'Average handle time 7.4 minutes',
  gapAnalysisText: 'Average handle time 7.4 minutes',
  ...over,
});

describe('tracing an uploaded fact to the rendered file', () => {
  it('reports a fact that survived every stage', () => {
    const v = traceFacts([fact({})], sources());
    expect(v.ok).toBe(true);
    expect(v.facts[0].lostAt).toBeNull();
    expect(v.facts[0].matchedAs).toBe('7.4');
  });

  it('names the stage that lost it, not merely that it is missing', () => {
    // The whole point: "62% of evidence used" cannot distinguish evidence the
    // planner never assigned from evidence the deck dropped.
    const v = traceFacts([fact({})], sources({ assignedText: '', citedText: '', deckText: '', gapAnalysisText: '' }));
    expect(v.facts[0].lostAt).toBe('assigned');
    expect(v.facts[0].reached.bundle).toBe(true);
  });

  it('separates "in the deck" from "in the gap analysis"', () => {
    // A figure on a cover slide is in the deck and is not in the analysis.
    const v = traceFacts([fact({})], sources({ gapAnalysisText: 'nothing relevant here' }));
    expect(v.ok).toBe(true);
    expect(v.missingFromGapAnalysis.map((f) => f.factId)).toEqual(['kpi:aht']);
  });

  it('does not fail the run for an optional fact', () => {
    const v = traceFacts(
      [fact({ factId: 'volume:pharmacy', expectation: 'optional', variants: ['720000', '720,000'] })],
      sources({ deckText: '', gapAnalysisText: '' }),
    );
    expect(v.ok).toBe(true);
    expect(v.missingFromDeck).toEqual([]);
  });

  it('matches a figure across thousands separators', () => {
    const v = traceFacts(
      [fact({ factId: 'workforce', variants: ['3483', '3,483'] })],
      sources({ deckText: '3,483 agents', gapAnalysisText: '3,483 agents', citedText: '3,483', assignedText: '3,483', bundleText: '3,483' }),
    );
    expect(v.facts[0].reached.deck).toBe(true);
  });

  it('refuses to match on a value too short to be a signal', () => {
    // "52" appears in dates, counts and page numbers. A two-character variant is
    // not evidence that the fact arrived.
    const v = traceFacts(
      [fact({ factId: 'kpi:asa', variants: ['52'] })],
      sources({ deckText: 'slide 52 of the appendix' }),
    );
    expect(v.facts[0].reached.deck).toBe(false);
  });

  it('excludes coverage expectations from the value funnel', () => {
    const v = traceFacts([fact({ expectation: 'still_open' }), fact({ factId: 'x', expectation: 'recharacterised' })], sources());
    expect(v.facts).toEqual([]);
  });
});

describe('judging how a gap is described', () => {
  const control = 'Transcript governance is not loaded. KPI baselines are absent from the governed set.';

  it('passes a partially-filled gap whose description changed', () => {
    const treatment = 'KPI baselines are now available as planning figures: AHT 7.4 minutes, FCR 68.2%.';
    const [c] = checkCoverage(
      [{ gap: 'KPI baselines incomplete', expectation: 'recharacterised', terms: ['kpi baseline'] }],
      control,
      treatment,
    );
    expect(c.pass).toBe(true);
  });

  it('fails a partially-filled gap the deck describes identically', () => {
    const [c] = checkCoverage(
      [{ gap: 'KPI baselines incomplete', expectation: 'recharacterised', terms: ['kpi baseline'] }],
      control,
      control,
    );
    expect(c.pass).toBe(false);
    expect(c.note).toContain('did not reach it');
  });

  it('passes a deliberately-unfilled gap still described as open', () => {
    const treatment = 'Transcript governance is not loaded and remains out of scope for this package.';
    const [c] = checkCoverage(
      [{ gap: 'Transcript governance', expectation: 'still_open', terms: ['transcript governance'] }],
      control,
      treatment,
    );
    expect(c.pass).toBe(true);
  });

  it('FAILS when more data quietly closes a gap the upload does not close', () => {
    // The most important case. A pipeline that closes every gap when handed more
    // data is worse than one that ignores the data, because it is confidently
    // wrong — and nothing else in the harness would notice.
    const treatment = 'Transcript governance is established and transcripts are approved for analytics.';
    const [c] = checkCoverage(
      [{ gap: 'Transcript governance', expectation: 'still_open', terms: ['transcript governance'] }],
      control,
      treatment,
    );
    expect(c.pass).toBe(false);
    expect(c.note).toContain('NO LONGER DESCRIBED AS OPEN');
  });

  it('fails when the deck stops mentioning the gap at all', () => {
    const [c] = checkCoverage(
      [{ gap: 'Transcript governance', expectation: 'still_open', terms: ['transcript governance'] }],
      control,
      'An unrelated deck about scheduling.',
    );
    expect(c.pass).toBe(false);
    expect(c.note).toContain('does not mention this gap');
  });
});
