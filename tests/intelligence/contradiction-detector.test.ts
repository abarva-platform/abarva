import { runContradictionDetectionJob } from '../../src/jobs/contradiction-detection-job';
import { detectContradictions } from '../../src/lib/intelligence/contradiction-detector';
import { loadCorpus } from '../../src/lib/intelligence';

describe('KF-5 deterministic contradiction detector', () => {
  const corpus = loadCorpus({ loadedAt: '2026-04-28T00:00:00.000Z' });

  it('detects the four required contradiction rule families over the merged Phase 1 corpus', () => {
    const result = detectContradictions({ corpus });
    const ruleIds = new Set(result.findings.map((finding) => finding.ruleId));

    expect([...ruleIds]).toEqual(
      expect.arrayContaining([
        'vendor_claim_vs_internal_evidence',
        'adoption_threshold_mismatch',
        'value_attribution_mismatch',
        'timeline_mismatch',
      ]),
    );
  });

  it('classifies flagship Phase 1 contradictions into deterministic review findings', () => {
    const result = detectContradictions({ corpus });
    const byContradictionId = new Map(result.findings.map((finding) => [finding.contradictionId, finding]));

    expect(byContradictionId.get('CON-001')?.ruleId).toBe('timeline_mismatch');
    expect(byContradictionId.get('CON-002')?.ruleId).toBe('adoption_threshold_mismatch');
    expect(byContradictionId.get('CON-003')?.ruleId).toBe('value_attribution_mismatch');
    expect(byContradictionId.get('CON-004')?.ruleId).toBe('vendor_claim_vs_internal_evidence');
  });

  it('enriches findings with corpus evidence references without live model calls', () => {
    const job = runContradictionDetectionJob({
      corpus,
      detectedAt: '2026-04-28T12:00:00.000Z',
    });

    expect(job.detector).toBe('deterministic-rule-based');
    expect(job.llmCalls).toBe(0);
    expect(job.detectedAt).toBe('2026-04-28T12:00:00.000Z');
    expect(job.summary.scannedContradictions).toBe(corpus.contradictions.length);
    expect(job.summary.scannedPatterns).toBe(corpus.patterns.length);
    expect(job.reviewQueue.length).toBeGreaterThanOrEqual(4);
    expect(job.reviewQueue[0].evidenceRefs.length).toBeGreaterThan(1);
  });

  it('can exclude resolved contradictions from the active review queue', () => {
    const job = runContradictionDetectionJob({
      corpus,
      includeResolved: false,
    });

    expect(job.reviewQueue.some((finding) => finding.contradictionId === 'CON-001')).toBe(false);
    expect(job.reviewQueue.every((finding) => finding.status !== 'resolved-reference')).toBe(true);
  });
});
