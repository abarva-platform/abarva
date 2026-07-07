// Behavior tests for derived answerability (WS-D).

import {
  deriveAnswerability,
  isGrounded,
  remediationLaneFor,
} from '@/lib/agent-data-coverage';

describe('deriveAnswerability', () => {
  it('NOT_TESTED when not exercised (never a fabricated constant)', () => {
    expect(deriveAnswerability({ tested: false }).status).toBe('NOT_TESTED');
  });

  it('NOT_LOADED when no committed facts', () => {
    expect(deriveAnswerability({ tested: true, loadedCount: 0 }).status).toBe('NOT_LOADED');
  });

  it('CONTENT_GAP when loaded but required content absent', () => {
    expect(
      deriveAnswerability({ tested: true, loadedCount: 5, requiredContentPresent: false }).status,
    ).toBe('CONTENT_GAP');
  });

  it('INDEXING_GAP when loaded but not indexed', () => {
    expect(
      deriveAnswerability({ tested: true, loadedCount: 5, requiredContentPresent: true, indexedCount: 0 }).status,
    ).toBe('INDEXING_GAP');
  });

  it('RETRIEVAL_GAP when indexed but nothing retrieved', () => {
    expect(
      deriveAnswerability({ tested: true, loadedCount: 5, requiredContentPresent: true, indexedCount: 5, retrievedCount: 0 }).status,
    ).toBe('RETRIEVAL_GAP');
  });

  it('CONTEXT_BUNDLE_GAP when retrieved but excluded from the bundle', () => {
    expect(
      deriveAnswerability({ tested: true, loadedCount: 5, requiredContentPresent: true, indexedCount: 5, retrievedCount: 3, inContextBundle: false }).status,
    ).toBe('CONTEXT_BUNDLE_GAP');
  });

  it('CITATION_RENDERING_GAP when bundle had facts but no citations emitted', () => {
    expect(
      deriveAnswerability({ tested: true, loadedCount: 5, requiredContentPresent: true, indexedCount: 5, retrievedCount: 3, inContextBundle: true, citationsEmitted: false }).status,
    ).toBe('CITATION_RENDERING_GAP');
  });

  it('CLAIM_SUPPORT_GAP when claims unsupported', () => {
    expect(
      deriveAnswerability({
        tested: true, loadedCount: 5, requiredContentPresent: true, indexedCount: 5,
        retrievedCount: 3, inContextBundle: true, citationsEmitted: true, citationsRendered: true, claimsSupported: false,
      }).status,
    ).toBe('CLAIM_SUPPORT_GAP');
  });

  it('ANSWERED_AND_GROUNDED only when the full pipeline passes', () => {
    const result = deriveAnswerability({
      tested: true, loadedCount: 5, requiredContentPresent: true, indexedCount: 5,
      retrievedCount: 3, inContextBundle: true, citationsEmitted: true, citationsRendered: true, claimsSupported: true,
    });
    expect(result.status).toBe('ANSWERED_AND_GROUNDED');
    expect(isGrounded(result.status)).toBe(true);
    expect(result.reason).toMatch(/grounded|cited/i);
  });

  it('every status carries a reason', () => {
    expect(deriveAnswerability({ tested: true, loadedCount: 0 }).reason.length).toBeGreaterThan(0);
  });

  it('maps gap statuses to remediation lanes', () => {
    expect(remediationLaneFor('NOT_LOADED')).toBe('ingestion_data_load');
    expect(remediationLaneFor('RETRIEVAL_GAP')).toBe('retrieval_indexing');
    expect(remediationLaneFor('CLAIM_SUPPORT_GAP')).toBe('answer_prompt_synthesis');
    expect(remediationLaneFor('ANSWERED_AND_GROUNDED')).toBeNull();
  });
});
