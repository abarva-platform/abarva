// Moves — Dynamic Solution Pattern Assembly (the governed AbarVa<->Claude loop).
// AbarVa builds the packet + validates; Claude assembles the pattern in between.
// Deterministic FACTS (baselines, metrics) come from evidence/fixtures — Claude
// must not invent numbers. See docs/build/moves-design/MOVES_DYNAMIC_PATTERN_ASSEMBLY.md.

import type {
  PatternAssemblyPacket,
  ValidatedPatternItem,
  ValidationLabel,
} from './types';

/** Inputs AbarVa resolves before calling Claude. */
export function buildPatternAssemblyPacket(input: PatternAssemblyPacket): PatternAssemblyPacket {
  // Identity/normalizing pass — this is the governed packet Claude receives.
  // (Kept as a pure builder so callers/tests get a stable, typed object.)
  return {
    ...input,
    selectedBuildingBlocks: Array.from(new Set(input.selectedBuildingBlocks)),
  };
}

/** A single piece of Claude's assembled response, before validation. */
export interface AssembledPatternItem {
  statement: string;
  /** Does this item cite move evidence? */
  evidenceBacked?: boolean;
  /** Does this item assert a number/baseline? (Numbers must come from evidence.) */
  assertsNumber?: boolean;
}

const OVERREACH_RE =
  /\b(autonomous|auto-approv|fully automat|auto-deny|without human|no human)\b/i;

/**
 * Validate Claude's assembled pattern against the packet's constraints.
 * Labels each item: evidence_backed / assumption / needs_confirmation /
 * not_allowed / draft_artifact / promote_candidate.
 */
export function validateAssembledResponse(
  packet: PatternAssemblyPacket,
  items: AssembledPatternItem[],
): ValidatedPatternItem[] {
  const lowControl =
    packet.readiness.control === 'low' || packet.readiness.control === 'medium-low';
  const constraintText = packet.controlConstraints.join(' ').toLowerCase();

  return items.map((it): ValidatedPatternItem => {
    let label: ValidationLabel;
    let reason: string | undefined;

    if (OVERREACH_RE.test(it.statement) && (lowControl || /no autonomous|attorney approval|human/.test(constraintText))) {
      label = 'not_allowed';
      reason = 'Ambition exceeds readiness / violates a hard control constraint.';
    } else if (it.assertsNumber && !it.evidenceBacked) {
      label = 'needs_confirmation';
      reason = 'Numeric claim not backed by move evidence — must be confirmed.';
    } else if (it.evidenceBacked) {
      label = 'evidence_backed';
    } else {
      label = 'assumption';
      reason = 'Assembled from context; not directly evidence-backed.';
    }

    return { statement: it.statement, label, reason };
  });
}
