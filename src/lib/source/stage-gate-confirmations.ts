// ─────────────────────────────────────────────────────────────────────────────
// Per-stage gate confirmation keys — the single source of truth for WHICH
// attestations a stage's approval gate requires.
//
// Every Source stage gate is a real approval: to advance an event past the stage
// it sits on, the approver must confirm that stage's boxes. Historically only the
// Strategy gate was wired (the three P0 confirmations); every other stage gate
// was presentational. This module generalizes the attestation set so any stage's
// gate can arm the LIVE approve action and the approve route can validate exactly
// the keys that stage declares — no hardcoded strategy set.
//
// The keys are STABLE, deterministic identifiers (never free text). The Strategy
// stage keeps its canonical `SourceApprovalConfirmations` keys so the P0 approval
// is byte-for-byte unchanged. Every worked stage shares the canvas Scope-gate
// attestation set (evidence complete · exclusions/inputs reviewed · stage final),
// mirroring the three confirm boxes `buildLiveStageView` renders from the Scope
// exemplar until a stage authors its own gate. This is pure — no I/O — so both
// the server (attach the action) and the route (validate the confirmations) read
// the same contract.
// ─────────────────────────────────────────────────────────────────────────────

import { REQUIRED_APPROVAL_CONFIRMATIONS } from './approval-decision';
import { normalizeSourceStageKey } from './constants';
import type { SourceStageKey } from './types';

/**
 * The three attestations a worked (non-strategy) stage gate requires, matching
 * the canvas Scope-gate confirm boxes (Evidence complete · Exclusions reviewed ·
 * Scope final). These are the keys `buildLiveStageView`'s gate implicitly asks
 * for — named here so the approve route can require them.
 */
export const WORKED_STAGE_CONFIRMATIONS = [
  'evidenceComplete',
  'exclusionsReviewed',
  'stageFinal',
] as const satisfies readonly string[];

/**
 * The confirmation keys a given stage's approval gate requires. Strategy uses the
 * canonical P0 set (unchanged); every other canonical stage uses the worked-stage
 * set. Legacy stage keys normalize first. An unknown key falls back to the worked
 * set — a gate is never left with zero required confirmations (fail-closed).
 */
export function confirmationKeysForStage(
  stageKey: unknown,
): readonly string[] {
  const canonical: SourceStageKey | null = normalizeSourceStageKey(stageKey);
  if (canonical === 'strategy') {
    return [...REQUIRED_APPROVAL_CONFIRMATIONS];
  }
  return [...WORKED_STAGE_CONFIRMATIONS];
}
