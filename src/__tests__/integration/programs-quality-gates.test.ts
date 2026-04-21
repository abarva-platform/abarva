import { runQualityGates } from '@/lib/programs/quality-gates';

describe('Nexus quality gates', () => {
  it('strips forbidden phrases and flags soft-issue', () => {
    const out = runQualityGates(
      'As an AI language model, I think pattern P031 covers ambient docs at $4.2M baseline cohort n=6.',
      { expectedShape: 'free' },
    );
    expect(out.cleanedContent).not.toMatch(/as an AI/i);
    expect(out.cleanedContent).not.toMatch(/I think/i);
    expect(out.metadata.forbiddenPhrasesStripped).toBeGreaterThanOrEqual(2);
    expect(out.issues.some((i) => i.gate === 'voice_filter')).toBe(true);
  });

  it('hard-fails when no provenance signals present', () => {
    const out = runQualityGates(
      'This is a long generic answer with no specific citations. '.repeat(20),
      { expectedShape: 'free' },
    );
    expect(out.pass).toBe(false);
    expect(out.issues.some((i) => i.gate === 'provenance' && i.severity === 'hard')).toBe(true);
  });

  it('hard-fails on too-short output', () => {
    const out = runQualityGates('Short.', { expectedShape: 'free' });
    expect(out.pass).toBe(false);
    expect(out.issues.some((i) => i.gate === 'length' && i.severity === 'hard')).toBe(true);
  });

  it('hard-fails charter draft missing required anchors', () => {
    const text =
      'Per the playbook, here is a long-enough draft with $4.2M projected savings and KLAS scoring data, but the anchors charter expects are not here.'.repeat(
        4,
      );
    const out = runQualityGates(text, { expectedShape: 'charter' });
    expect(out.pass).toBe(false);
    expect(out.issues.some((i) => i.gate === 'pattern_adherence')).toBe(true);
  });

  it('passes when provenance + voice + length all clean', () => {
    const text = `Per pattern P031 and the playbook for ambient docs, baseline volumes show $4.2M annualized opportunity. KLAS scoring v2.1 places top 3 vendors within 8% of each other. Cohort n=6 supports the projection.

Scope: voice + chat deflection. Outcome: 28% deflection target. Sponsor: VP Customer Care. Phase: 2 (Charter).`.repeat(
      2,
    );
    const out = runQualityGates(text, { expectedShape: 'charter' });
    expect(out.pass).toBe(true);
    expect(out.metadata.provenanceHints).toBeGreaterThan(0);
  });

  it('preserves wordCount + provenance counts in metadata', () => {
    const out = runQualityGates(
      'Per the spec, baseline shows $1M baseline. KLAS data points to 30% improvement.'.repeat(10),
      { expectedShape: 'free' },
    );
    expect(out.metadata.wordCount).toBeGreaterThan(50);
    expect(out.metadata.provenanceHints).toBeGreaterThan(0);
  });
});
