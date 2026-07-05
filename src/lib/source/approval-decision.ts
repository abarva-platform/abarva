// Source event approval decision · pure logic
//
// The event-creation approval IS the strategy gate. Approving an event
// means the reviewer confirms they have read the auto-generated strategy
// memo, the value target, and the archetype + rigor call. There is no
// separate "Strategy" canvas stage to work through — approval advances the
// event straight to Scope (the first stage with real client work).
//
// This module holds the pure decision function so the route stays thin and
// the confirmation + state-transition rules are unit-testable without a DB.

/** Actions an approver can take on a pending sourcing event. */
export type SourceApprovalAction = 'approve' | 'reject' | 'send_back';

/**
 * The three things an approver attests to when approving. All three must be
 * true to approve — the checkbox form on the approval queue enforces this in
 * the UI, and the route re-checks it server-side.
 */
export interface SourceApprovalConfirmations {
  /** Read the auto-generated d01 strategy memo. */
  strategyMemoReviewed?: boolean;
  /** Confirmed the value target / estimated value at stake. */
  valueTargetConfirmed?: boolean;
  /** Confirmed the archetype + rigor selection. */
  archetypeRigorConfirmed?: boolean;
}

export const REQUIRED_APPROVAL_CONFIRMATIONS = [
  'strategyMemoReviewed',
  'valueTargetConfirmed',
  'archetypeRigorConfirmed',
] as const satisfies readonly (keyof SourceApprovalConfirmations)[];

/** Lifecycle state the event moves to as a result of the decision. */
export type SourceApprovalToState = 'active' | 'archived' | 'waiting_on_client';

export interface SourceApprovalDecision {
  ok: boolean;
  /** Machine error code when ok === false. */
  error?: string;
  /** Human-readable detail for the client. */
  detail?: string;
  /** lifecycle_state to write when ok === true. */
  toState?: SourceApprovalToState;
  /**
   * current_stage_key to advance to when ok === true, or null to leave the
   * stage untouched. Only an approve of a still-in-strategy event advances.
   */
  advanceStageTo?: 'scope' | null;
  /** Value recorded in the append-only source_event_approvals row. */
  approvalAction: 'admin_review' | 'rejected' | 'sent_back';
  /** Confirmation keys still missing when error === 'confirmations_required'. */
  missingConfirmations?: string[];
}

/**
 * Resolve an approval decision from the requested action + attested
 * confirmations. Pure — no I/O. The route applies the returned state
 * transitions.
 *
 * - reject     → archived, no stage change.
 * - send_back  → stays waiting_on_client (the reviewer's comment travels back
 *                to the creator via the approval record), no stage change.
 * - approve    → requires all three confirmations; on success moves to active
 *                and, if the event is still sitting in the strategy stage,
 *                advances it to scope (the strategy stage is not "worked").
 */
export function evaluateSourceApprovalDecision(
  action: unknown,
  confirmations: SourceApprovalConfirmations | null | undefined,
  opts?: { currentStageKey?: string | null },
): SourceApprovalDecision {
  if (action !== 'approve' && action !== 'reject' && action !== 'send_back') {
    return {
      ok: false,
      error: 'invalid_action',
      detail: 'action must be "approve", "reject", or "send_back"',
      // Never consumed on the error path; kept in-union for type soundness.
      approvalAction: 'admin_review',
    };
  }

  if (action === 'reject') {
    return { ok: true, toState: 'archived', advanceStageTo: null, approvalAction: 'rejected' };
  }

  if (action === 'send_back') {
    return {
      ok: true,
      toState: 'waiting_on_client',
      advanceStageTo: null,
      approvalAction: 'sent_back',
    };
  }

  // approve — every confirmation must be explicitly true.
  const missing = REQUIRED_APPROVAL_CONFIRMATIONS.filter(
    (key) => confirmations?.[key] !== true,
  );
  if (missing.length > 0) {
    return {
      ok: false,
      error: 'confirmations_required',
      detail:
        'Approving is a review gate: confirm the strategy memo, value target, and archetype + rigor before approving.',
      missingConfirmations: [...missing],
      approvalAction: 'admin_review',
    };
  }

  const advanceStageTo = opts?.currentStageKey === 'strategy' ? 'scope' : null;
  return { ok: true, toState: 'active', advanceStageTo, approvalAction: 'admin_review' };
}
