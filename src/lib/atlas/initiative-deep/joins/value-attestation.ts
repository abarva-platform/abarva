// Join: value attestation.
//
// There is no `value_attestations` table in this codebase today (the closest
// thing — `source_value_lines` — is keyed to engagements, not initiatives).
// Per the mission's honesty contract, we compute attestation directly from
// the columns already on `ai_initiatives`:
//
//   - `measured` ← `ai_initiatives.measured_value_usd`
//   - `committed` ← `ai_initiatives.committed_annual_usd` (preferred) OR
//                   `committed_total_usd` (fallback)
//   - `attainmentPct` ← measured / committed × 100, only when both are
//                       present and committed > 0. Otherwise null.
//
// The `projectedRange` field is filled by the business-case join (the kernel's
// value forecast) — NOT here. This module surfaces only the measured side.

import type {
  ConfidenceTier,
  InitiativeValueAttestation,
  PlanningRange,
} from '../types';
import type { InitiativeRow } from './ai-initiatives';
import { confidenceTierOf } from './ai-initiatives';

export interface ValueAttestationInputs {
  /** The initiative row already loaded by `loadInitiativeRow`. */
  initiative: InitiativeRow;
  /** The kernel value-forecast planning range, when the kernel ran. */
  projectedRange: PlanningRange | null;
}

function toNum(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Compute the value attestation block honestly.
 *
 * `attainmentPct` is computed only when both a measured value and a positive
 * committed-annual (or committed-total fallback) value are present. Otherwise
 * the field is `null` — the composer surfaces that as "not yet attestable",
 * not as a fake 0%.
 *
 * Confidence tier comes from the initiative's recorded `confidence_level`,
 * downgraded when measured or committed values are missing.
 */
export function buildValueAttestation(
  input: ValueAttestationInputs,
): InitiativeValueAttestation {
  const measured = toNum(input.initiative.measured_value_usd);
  const committedAnnual = toNum(input.initiative.committed_annual_usd);
  const committedTotal = toNum(input.initiative.committed_total_usd);
  const committed =
    committedAnnual !== null && committedAnnual > 0
      ? committedAnnual
      : committedTotal !== null && committedTotal > 0
        ? committedTotal
        : null;

  let attainmentPct: number | null = null;
  if (measured !== null && committed !== null && committed > 0) {
    attainmentPct = round2((measured / committed) * 100);
  }

  // Confidence is the recorded confidence, downgraded if we are missing data.
  let tier: ConfidenceTier = confidenceTierOf(input.initiative.confidence_level);
  if (measured === null || committed === null) {
    tier = downgrade(tier);
  }

  return {
    projectedRange: input.projectedRange,
    measured,
    attainmentPct,
    confidenceTier: tier,
  };
}

function downgrade(tier: ConfidenceTier): ConfidenceTier {
  if (tier === 'high') return 'medium';
  if (tier === 'medium') return 'low';
  return 'low';
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
