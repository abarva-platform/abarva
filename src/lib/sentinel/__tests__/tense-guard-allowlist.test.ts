import { buildG7AllowlistCandidates } from '../tense-guard-allowlist';

describe('G7 tense-guard allowlist telemetry', () => {
  it('does not recommend allowlisting until enough false-positive telemetry exists', () => {
    const candidates = buildG7AllowlistCandidates([
      { guardId: 'G7', phrase: 'we shipped q2 and will revisit q3', classification: 'false_positive' },
      { guardId: 'G7', phrase: 'we shipped q2 and will revisit q3', classification: 'false_positive' },
    ]);

    expect(candidates[0].recommended).toBe(false);
    expect(candidates[0].reason).toMatch(/Needs 5 samples/);
  });

  it('recommends only high false-positive recurring phrases for human review', () => {
    const phrase = 'we shipped q2 and will revisit scope next quarter';
    const candidates = buildG7AllowlistCandidates([
      { guardId: 'G7', phrase, classification: 'false_positive' },
      { guardId: 'G7', phrase, classification: 'false_positive' },
      { guardId: 'G7', phrase, classification: 'false_positive' },
      { guardId: 'G7', phrase, classification: 'false_positive' },
      { guardId: 'G7', phrase, classification: 'true_positive' },
      { guardId: 'G7', phrase: 'the date changed magically', classification: 'true_positive' },
      { guardId: 'G7', phrase: 'the date changed magically', classification: 'true_positive' },
      { guardId: 'G7', phrase: 'the date changed magically', classification: 'false_positive' },
      { guardId: 'G7', phrase: 'the date changed magically', classification: 'true_positive' },
      { guardId: 'G7', phrase: 'the date changed magically', classification: 'true_positive' },
    ]);

    expect(candidates[0]).toMatchObject({
      phrase,
      total: 5,
      falsePositiveRate: 0.8,
      recommended: true,
    });
    expect(candidates.find((candidate) => candidate.phrase === 'the date changed magically')?.recommended).toBe(false);
  });
});
