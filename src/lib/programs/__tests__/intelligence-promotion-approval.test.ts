import {
  INTELLIGENCE_PROMOTION_RATIONALE_MIN_CHARS,
  normalizePromotionRationale,
  requiresIntelligencePromotionGate,
  validateIntelligencePromotionApproval,
} from '@/lib/programs/intelligence-promotion-approval';

describe('Intelligence pattern promotion approval', () => {
  it('requires the gate only when an Intelligence session and selected pattern are present', () => {
    expect(
      requiresIntelligencePromotionGate({
        originatingIntelligenceSessionId: 'thread-1',
        matchedPatternId: 'PAT-1',
      }),
    ).toBe(true);
    expect(
      requiresIntelligencePromotionGate({
        originatingIntelligenceSessionId: 'thread-1',
        matchedPatternId: null,
      }),
    ).toBe(false);
  });

  it('normalizes human rationale whitespace', () => {
    expect(normalizePromotionRationale('  reviewed   evidence\nand accepted  ')).toBe(
      'reviewed evidence and accepted',
    );
  });

  it('rejects a required promotion without explicit human acceptance', () => {
    const result = validateIntelligencePromotionApproval({
      originatingIntelligenceSessionId: 'thread-1',
      matchedPatternId: 'PAT-1',
      humanPromotionRationale:
        'I reviewed the evidence and this is the right Move pattern.',
      promotionEvidenceRefs: ['sourceThreadId:thread-1'],
    });

    expect(result).toEqual(
      expect.objectContaining({
        required: true,
        error: expect.stringMatching(/explicit human acceptance/i),
      }),
    );
  });

  it('rejects a required promotion with a short rationale', () => {
    const result = validateIntelligencePromotionApproval({
      originatingIntelligenceSessionId: 'thread-1',
      matchedPatternId: 'PAT-1',
      humanPromotionAccepted: true,
      humanPromotionRationale: 'Reviewed.',
      promotionEvidenceRefs: ['sourceThreadId:thread-1'],
    });

    expect(result).toEqual(
      expect.objectContaining({
        required: true,
        error: expect.stringContaining(
          String(INTELLIGENCE_PROMOTION_RATIONALE_MIN_CHARS),
        ),
      }),
    );
  });

  it('rejects a required promotion without evidence refs', () => {
    const result = validateIntelligencePromotionApproval({
      originatingIntelligenceSessionId: 'thread-1',
      matchedPatternId: 'PAT-1',
      humanPromotionAccepted: true,
      humanPromotionRationale:
        'I reviewed the evidence and this is the right Move pattern.',
      promotionEvidenceRefs: [],
    });

    expect(result).toEqual(
      expect.objectContaining({
        required: true,
        error: expect.stringMatching(/evidence reference/i),
      }),
    );
  });

  it('accepts a required promotion with acceptance, rationale, and evidence', () => {
    expect(
      validateIntelligencePromotionApproval({
        originatingIntelligenceSessionId: 'thread-1',
        matchedPatternId: 'PAT-1',
        humanPromotionAccepted: true,
        humanPromotionRationale:
          'I reviewed the evidence and this is the right Move pattern.',
        promotionEvidenceRefs: ['sourceThreadId:thread-1', 'selectedPatternKey:PAT-1'],
      }),
    ).toEqual({
      required: true,
      rationale: 'I reviewed the evidence and this is the right Move pattern.',
      evidenceRefs: ['sourceThreadId:thread-1', 'selectedPatternKey:PAT-1'],
      error: null,
    });
  });
});
