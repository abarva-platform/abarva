// Source event approval decision · pure logic
//
// Every Source stage gate is a real approval that advances the event to the next
// stage in the canonical `SOURCE_STAGE_ORDER`. The event-creation approval IS the
// strategy gate — approving confirms the reviewer read the auto-generated strategy
// memo, the value target, and the archetype + rigor call — and advances the event
// to Scope (the first worked stage). Approving on any LATER stage advances the
// event to that stage's successor (Scope→RFP, Pricing→BAFO, …); approving on the
// final stage (`value`) closes without advancing.
//
// This module holds the pure decision function so the route stays thin and the
// confirmation + state-transition rules are unit-testable without a DB. The next
// stage is resolved through the canonical order (`nextSourceStage`), so a gate can
// never advance to a stage the rail does not know about.

import { nextSourceStage } from './constants';
import type { SourceStageKey } from './types';

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

/**
 * The attested confirmations, as sent by any stage's gate. The Strategy gate
 * sends the three `SourceApprovalConfirmations` keys; a worked stage's gate sends
 * that stage's own confirmation keys (see `stage-gate-confirmations.ts`). Keyed
 * loosely by string so a stage can attest its own set without widening the typed
 * strategy interface.
 */
export type SourceStageConfirmations = Record<string, boolean | undefined>;

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
   * stage untouched. An approve advances the event to the NEXT stage after its
   * current stage in `SOURCE_STAGE_ORDER` (strategy→scope, scope→rfp, …); null
   * when the event is on the final stage (`value`) or its stage is unknown.
   */
  advanceStageTo?: SourceStageKey | null;
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
 * - approve    → requires EVERY confirmation the current stage's gate declares
 *                (defaults to the strategy P0 set when the caller does not pass
 *                `requiredConfirmationKeys`); on success moves to active and
 *                advances the event to the NEXT stage in `SOURCE_STAGE_ORDER`
 *                (or leaves the stage untouched when it is the final stage or is
 *                unknown/absent).
 *
 * `requiredConfirmationKeys` lets the route validate against the stage the event
 * actually sits on (e.g. the three Scope-gate boxes on Scope) rather than a
 * hardcoded strategy set. Absent → the canonical strategy set, preserving the
 * exact P0 behavior.
 */
export function evaluateSourceApprovalDecision(
  action: unknown,
  confirmations: SourceStageConfirmations | null | undefined,
  opts?: {
    currentStageKey?: string | null;
    requiredConfirmationKeys?: readonly string[];
  },
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

  // approve — every confirmation the stage's gate declares must be explicitly
  // true. Default to the strategy P0 set so an approve with no stage context
  // still attests the P0 confirmations exactly as before.
  const requiredKeys =
    opts?.requiredConfirmationKeys && opts.requiredConfirmationKeys.length > 0
      ? opts.requiredConfirmationKeys
      : REQUIRED_APPROVAL_CONFIRMATIONS;
  const missing = requiredKeys.filter((key) => confirmations?.[key] !== true);
  if (missing.length > 0) {
    return {
      ok: false,
      error: 'confirmations_required',
      detail:
        'Approving is a review gate: confirm every box this stage requires before approving.',
      missingConfirmations: [...missing],
      approvalAction: 'admin_review',
    };
  }

  // Advance to the next stage in the canonical order. nextSourceStage returns
  // null on the final stage (`value`) or an unknown/absent key, leaving the
  // stage untouched.
  const advanceStageTo = nextSourceStage(opts?.currentStageKey);
  return { ok: true, toState: 'active', advanceStageTo, approvalAction: 'admin_review' };
}
