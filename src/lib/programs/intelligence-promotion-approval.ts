export const INTELLIGENCE_PROMOTION_RATIONALE_MIN_CHARS = 24;

export function optionalStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizePromotionRationale(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

export function requiresIntelligencePromotionGate(input: {
  originatingIntelligenceSessionId?: string | null;
  matchedPatternId?: string | null;
}): boolean {
  return Boolean(input.originatingIntelligenceSessionId && input.matchedPatternId);
}

export function validateIntelligencePromotionApproval(input: {
  originatingIntelligenceSessionId?: string | null;
  matchedPatternId?: string | null;
  humanPromotionAccepted?: unknown;
  humanPromotionRationale?: unknown;
  promotionEvidenceRefs?: unknown;
}): {
  required: boolean;
  rationale: string | null;
  evidenceRefs: string[];
  error: string | null;
} {
  const required = requiresIntelligencePromotionGate(input);
  const rationale = normalizePromotionRationale(input.humanPromotionRationale);
  const evidenceRefs = optionalStringArray(input.promotionEvidenceRefs);

  if (!required) {
    return { required: false, rationale, evidenceRefs, error: null };
  }

  if (input.humanPromotionAccepted !== true) {
    return {
      required: true,
      rationale,
      evidenceRefs,
      error:
        'Intelligence pattern promotion requires explicit human acceptance of decision responsibility.',
    };
  }

  if (
    !rationale ||
    rationale.length < INTELLIGENCE_PROMOTION_RATIONALE_MIN_CHARS
  ) {
    return {
      required: true,
      rationale,
      evidenceRefs,
      error: `Intelligence pattern promotion requires a human rationale of at least ${INTELLIGENCE_PROMOTION_RATIONALE_MIN_CHARS} characters.`,
    };
  }

  if (evidenceRefs.length === 0) {
    return {
      required: true,
      rationale,
      evidenceRefs,
      error:
        'Intelligence pattern promotion requires at least one evidence reference reviewed by the human approver.',
    };
  }

  return { required: true, rationale, evidenceRefs, error: null };
}
