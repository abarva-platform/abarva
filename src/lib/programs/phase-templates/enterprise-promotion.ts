// Moves — enterprise-promotion guardrail (increment 11).
// Move-scoped workspace content (uploads, approved Inputs Packs) is NEVER
// automatically promoted to enterprise/tenant context. Promotion is a deliberate,
// human-reviewed action that lives OUTSIDE this workflow. This module makes that
// invariant explicit, testable, and surfaced to the client. Pure + deterministic.

export type EnterprisePromotionState = 'not_added' | 'review_requested';

export interface EnterprisePromotionStatus {
  state: EnterprisePromotionState;
  /** ALWAYS true — promotion can never happen without a human review + approval. */
  humanReviewRequired: true;
  /** Client-facing one-liner. */
  clientLabel: string;
  detail: string;
}

/**
 * The promotion status for a Move-scoped object. There is no branch that returns
 * a "promoted" / "added" state — by design, this workflow cannot promote.
 */
export function enterprisePromotionStatus(
  input: { reviewRequested?: boolean } = {},
): EnterprisePromotionStatus {
  if (input.reviewRequested) {
    return {
      state: 'review_requested',
      humanReviewRequired: true,
      clientLabel: 'Enterprise context: Not added yet.',
      detail:
        'Review requested — an administrator must approve before any content is added to enterprise context.',
    };
  }
  return {
    state: 'not_added',
    humanReviewRequired: true,
    clientLabel: 'Enterprise context: Not added yet.',
    detail:
      'Move-scoped only. Adding to enterprise context is a separate, human-reviewed action — it never happens automatically.',
  };
}

/**
 * The single authority on "may this reach enterprise context automatically?".
 * The answer is always NO for Move-scoped workspace content. Any future promotion
 * MUST go through an explicit human-approved, audited path that sets its own flag —
 * never this function.
 */
export function isAutoPromotableToEnterprise(_obj: {
  moveScopedOnly?: boolean;
  enterprisePromotion?: string;
}): false {
  return false;
}

export interface PromotionReviewRequest {
  moveId: string;
  targetPhase: number;
  requestedBy: string;
  requestedAt: string;
  /** Never 'approved' from here — approval is an admin action elsewhere. */
  status: 'pending_review';
  note: string;
}

/** Build a Move-scoped promotion REVIEW REQUEST. Recording intent only — it never promotes. */
export function buildPromotionReviewRequest(input: {
  moveId: string;
  targetPhase: number;
  requestedBy: string;
  requestedAt: string;
}): PromotionReviewRequest {
  return {
    moveId: input.moveId,
    targetPhase: input.targetPhase,
    requestedBy: input.requestedBy,
    requestedAt: input.requestedAt,
    status: 'pending_review',
    note: 'Requested enterprise-context review. Move-scoped until an administrator approves.',
  };
}
