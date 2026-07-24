/**
 * Nexus Pricing Engine — PR5 "Run estimate" validation gate (brief §9.2 step
 * 5). Pure, no I/O — callers (the `/validate` and `/run` API routes) load
 * the estimate's inputs and required-input schema first, then pass plain
 * data in here.
 *
 * An input is SETTLED (does not block a run) when either:
 *   1. it is CONFIRMED (`confirmedAt` set) — the user explicitly accepted
 *      the value (whether it started as a suggestion or was typed fresh); or
 *   2. it is explicitly marked UNKNOWN with an accepted range-policy
 *      widening — an `overrideReason` recorded AND a `confidence` rating
 *      attached. This is the literal mechanism the brief asks for ("marked
 *      unknown with an approved range policy") — the confidence tier
 *      recorded here is the SAME `'low' | 'medium' | 'high'` vocabulary
 *      `effort-engine/range-policy.ts`'s `RangePolicyInputs` scores, so a
 *      "confirmed unknown" input feeds the low/expected/high spread as a
 *      genuine widened-uncertainty input rather than being silently dropped.
 * Anything else — never seen, or seen but neither confirmed nor explicitly
 * marked unknown — blocks the run.
 */
import type { PricingEstimateInputConfidence } from "../types";

export interface EstimateInputForGate {
  inputKey: string;
  value: unknown;
  confirmedAt: string | null;
  overrideReason: string | null;
  confidence: PricingEstimateInputConfidence | null;
}

export interface ValidationBlockingReason {
  inputKey: string;
  reason: string;
}

export interface EstimateValidationResult {
  ready: boolean;
  blockingReasons: ValidationBlockingReason[];
  requiredInputKeys: string[];
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

/** True when `input` is settled (confirmed, or explicitly marked unknown with an accepted range-policy widening) — never blocks a run. */
export function isInputSettled(input: EstimateInputForGate): boolean {
  if (input.confirmedAt) return true;
  if (input.overrideReason && input.confidence) return true;
  return false;
}

/**
 * The pure gate function itself: every key in `requiredInputKeys` must
 * resolve to a settled input with a real value, or the run is blocked with
 * a specific, per-key reason (never a single generic "incomplete" message).
 */
export function validateEstimateReadiness(
  requiredInputKeys: readonly string[],
  inputs: readonly EstimateInputForGate[],
): EstimateValidationResult {
  const byKey = new Map(inputs.map((i) => [i.inputKey, i]));
  const blockingReasons: ValidationBlockingReason[] = [];

  for (const key of requiredInputKeys) {
    const input = byKey.get(key);
    if (!input) {
      blockingReasons.push({ inputKey: key, reason: `'${key}' has not been provided yet.` });
      continue;
    }
    if (!hasValue(input.value)) {
      blockingReasons.push({ inputKey: key, reason: `'${key}' has no value recorded.` });
      continue;
    }
    if (!isInputSettled(input)) {
      blockingReasons.push({
        inputKey: key,
        reason: `'${key}' has a value but is not confirmed, and has not been explicitly marked unknown with an accepted range-policy widening.`,
      });
    }
  }

  return {
    ready: blockingReasons.length === 0,
    blockingReasons,
    requiredInputKeys: [...requiredInputKeys],
  };
}

// ---------------------------------------------------------------------------
// Header completeness — step 1's fields live as columns on `pricing_estimates`
// itself (`currency`, `target_start_date`, `target_duration_weeks`,
// `selected_rate_card_id`), set via `updateEstimateHeader`, NOT via
// `pricing_estimate_inputs` rows — they have no source-chip/confirmation
// workflow of their own (only the archetype-specific scope/quantity inputs
// do, per brief §9.3). The gate for these is simply "is the column non-null".
// ---------------------------------------------------------------------------

export interface EstimateHeaderForGate {
  currency: string | null;
  targetStartDate: string | null;
  targetDurationWeeks: number | null;
  selectedRateCardId: string | null;
}

const HEADER_GATE_FIELDS: { key: keyof EstimateHeaderForGate; label: string }[] = [
  { key: "currency", label: "Currency" },
  { key: "targetStartDate", label: "Target start date" },
  { key: "targetDurationWeeks", label: "Target duration" },
  { key: "selectedRateCardId", label: "Rate card selection" },
];

export function validateEstimateHeaderComplete(header: EstimateHeaderForGate): ValidationBlockingReason[] {
  const blocking: ValidationBlockingReason[] = [];
  for (const { key, label } of HEADER_GATE_FIELDS) {
    if (!hasValue(header[key])) {
      blocking.push({ inputKey: key, reason: `${label} has not been set yet.` });
    }
  }
  return blocking;
}

/**
 * The FULL "Run estimate" gate (brief §9.2 step 5): step-1 header
 * completeness AND every archetype-specific scope/quantity input settled.
 * Both the `/validate` route and `execution-service.ts`'s `/run` path call
 * this SAME function so they can never disagree about what "ready" means.
 */
export function validateEstimateForRun(
  header: EstimateHeaderForGate,
  requiredInputKeys: readonly string[],
  inputs: readonly EstimateInputForGate[],
): EstimateValidationResult {
  const headerBlocking = validateEstimateHeaderComplete(header);
  const inputResult = validateEstimateReadiness(requiredInputKeys, inputs);
  return {
    ready: headerBlocking.length === 0 && inputResult.ready,
    blockingReasons: [...headerBlocking, ...inputResult.blockingReasons],
    requiredInputKeys: inputResult.requiredInputKeys,
  };
}
