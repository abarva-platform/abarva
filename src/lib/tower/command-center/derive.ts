// Tower Command Center v2 — the five derived presentation fields.
//
// The design at docs/design/tower/command-center-2026-07-23/ renders five
// numbers per program that the governed Tower read model does not persist:
// usage-supported value, claimable value, blocked value, evidence maturity
// (0–100) and proof level (0–3).
//
// They are derived here — in ONE place, deterministically, with the arithmetic
// written out — so the components never compute money and the derivation can be
// unit-tested against the mart's own inputs. Per AGENTS.md, Tower read models
// own every value: nothing in this file consults a model, and every output is a
// pure function of mart columns.
//
// Per the handoff prompt §2.8: do NOT add mart columns for these in this
// change. If a derivation later needs to be persisted, that is its own
// release-recorded slice with its own lineage rows.

import type { TowerMartProgramLane } from "@/lib/tower/current-layer-view-model";
import type {
  TowerFinanceStatus,
  TowerLaneKey,
  TowerProofSequenceStatus,
  TowerUsageStatus,
} from "./types";

/** Clamp `value` into [min, max]. */
function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function safeNum(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Adoption expressed as a 0–1 fraction.
 *
 * The mart's `adoption_rate_pct` is a percentage 0–100. A program with no
 * recorded adoption rate has an adoption fraction of **0**, not "unknown
 * therefore assume some" — absence of usage evidence is exactly the condition
 * the design is built to make visible.
 */
export function adoptionFraction(row: {
  adoptionRatePct: number | null;
  usageMetric: string | null;
  usageActual: number | null;
}): number {
  const pct = row.adoptionRatePct;
  if (typeof pct === "number" && Number.isFinite(pct)) {
    return clamp(pct / 100, 0, 1);
  }
  // No adoption rate, but a usage metric with a recorded actual still counts as
  // *some* usage evidence. We do not invent a rate for it — it contributes to
  // usage status and proof level, not to the usage-supported dollar figure.
  return 0;
}

/**
 * Does this program have any usage evidence at all?
 *
 * True when the mart records an adoption rate, or a usage metric with an actual.
 */
export function hasUsageEvidence(row: {
  adoptionRatePct: number | null;
  usageMetric: string | null;
  usageActual: number | null;
}): boolean {
  if (
    typeof row.adoptionRatePct === "number" &&
    Number.isFinite(row.adoptionRatePct)
  ) {
    return true;
  }
  return (
    typeof row.usageMetric === "string" &&
    row.usageMetric.trim().length > 0 &&
    typeof row.usageActual === "number" &&
    Number.isFinite(row.usageActual)
  );
}

/**
 * **Usage-supported value.**
 *
 *   usageSupported = promised × adoptionFraction
 *
 * clamped to [0, promised].
 *
 * Only value that observed adoption actually supports is credited. A program
 * with no recorded adoption gets **zero**, whatever Finance has validated.
 *
 * Verified against the live Healthcare Composite Demo tenant on 2026-07-23:
 * the shipped Tower reports `Usage-supported $0` alongside
 * `Finance-validated $3.8M`. An earlier version of this function floored
 * usage-supported at the finance-validated figure — on the reasoning that a
 * signed measurement method implies support — which would have made this page
 * report ~$3.8M where the shipped Tower reports $0. Two Tower surfaces
 * disagreeing on the same tenant's usage-supported value is worse than an
 * inelegant chain, so the floor is gone.
 *
 * **The chain can therefore invert**: `financeValidated > usageSupported` is a
 * real, reachable state, and it is exactly the anomaly worth showing — Finance
 * has validated value that nothing in the usage evidence supports. The
 * waterfall clamps its drop segments at zero so no bar renders negative, and
 * `financeExceedsUsage()` below lets the Value Proof read call the anomaly out
 * rather than hiding it.
 */
export function usageSupportedUsd(row: {
  promisedValueUsd: number | null;
  financeValidatedValueUsd: number;
  adoptionRatePct: number | null;
  usageMetric: string | null;
  usageActual: number | null;
}): number {
  const promised = Math.max(0, safeNum(row.promisedValueUsd));
  return clamp(promised * adoptionFraction(row), 0, promised);
}

/**
 * True when Finance has validated more value than usage evidence supports.
 *
 * Not an error — a governed state the tenant is actually in. Surfaced so the
 * Value Proof read can name it instead of the waterfall quietly drawing a
 * taller bar further down the chain.
 */
export function financeExceedsUsage(row: {
  promisedValueUsd: number | null;
  financeValidatedValueUsd: number;
  adoptionRatePct: number | null;
  usageMetric: string | null;
  usageActual: number | null;
}): boolean {
  return safeNum(row.financeValidatedValueUsd) > usageSupportedUsd(row);
}

export function proofSequenceStatus(row: {
  promisedValueUsd: number | null;
  financeValidatedValueUsd: number;
  adoptionRatePct: number | null;
  usageMetric: string | null;
  usageActual: number | null;
}): TowerProofSequenceStatus {
  return financeExceedsUsage(row)
    ? "finance_validation_ahead_of_usage_evidence"
    : "ordered";
}

export function proofSequenceExplanation(row: {
  promisedValueUsd: number | null;
  financeValidatedValueUsd: number;
  adoptionRatePct: number | null;
  usageMetric: string | null;
  usageActual: number | null;
}): string | null {
  if (!financeExceedsUsage(row)) return null;
  return "Finance has validated a partial benefit, but available usage telemetry does not yet support attribution to sustained tool adoption.";
}

/**
 * **Claimable value.**
 *
 *   claimable = towerClaimAllowed === 'allowed' ? financeValidated : 0
 *
 * The mart's `tower_claim_allowed` is the governed claim gate — `allowed`,
 * `partial` or `blocked`. Only `allowed` may be booked. `partial` means Finance
 * validated a figure but the claim gate has not cleared, which is precisely the
 * "$3.8M validated · $0 claimable" state the design's Value posture tile exists
 * to show. Never widen this to include `partial`.
 */
export function claimableUsd(row: {
  towerClaimAllowed: string;
  financeValidatedValueUsd: number;
}): number {
  const allowed = String(row.towerClaimAllowed ?? "")
    .trim()
    .toLowerCase();
  if (allowed !== "allowed") return 0;
  return Math.max(0, safeNum(row.financeValidatedValueUsd));
}

/**
 * **Blocked value.**
 *
 *   blocked = promised − claimable
 *
 * Every promised dollar that cannot be booked today is blocked, whatever the
 * reason. This is the figure the "Top 5 blockers by dollar impact" table sorts
 * on, so it must stay a simple, explainable subtraction.
 */
export function blockedUsd(row: {
  promisedValueUsd: number | null;
  towerClaimAllowed: string;
  financeValidatedValueUsd: number;
}): number {
  const promised = Math.max(0, safeNum(row.promisedValueUsd));
  return Math.max(0, promised - claimableUsd(row));
}

/**
 * How many of a program's required gates have cleared, as a 0–1 fraction.
 *
 * A gate object counts as cleared when it carries a truthy `met` / `cleared` /
 * `status: 'met' | 'cleared' | 'passed'`. A program with no recorded gates
 * returns `null` — "no gates recorded" is not the same as "all gates cleared",
 * and the caller must not treat it as evidence.
 */
export function gatesClearedFraction(
  gates: ReadonlyArray<Record<string, unknown>>,
): number | null {
  const objects = gates.filter(
    (gate): gate is Record<string, unknown> =>
      Boolean(gate) && typeof gate === "object",
  );
  if (objects.length === 0) return null;

  const cleared = objects.filter((gate) => {
    if (gate.met === true || gate.cleared === true) return true;
    const status = String(gate.status ?? "")
      .trim()
      .toLowerCase();
    return status === "met" || status === "cleared" || status === "passed";
  }).length;

  return clamp(cleared / objects.length, 0, 1);
}

/**
 * **Evidence maturity, 0–100.** The heatmap's X axis.
 *
 *   maturity = 100 × ( 0.40 × financeFraction
 *                    + 0.35 × adoptionFraction
 *                    + 0.25 × gateFraction )
 *
 * where
 *   financeFraction  = financeValidated / promised   (0 when promised = 0)
 *   adoptionFraction = adoptionRatePct / 100
 *   gateFraction     = cleared gates / required gates, or 0 when none recorded
 *
 * The weights say: a signed measurement method is worth more than observed
 * adoption, which is worth more than a ticked gate. They are a presentation
 * ranking only — no dollar figure is computed from them.
 *
 * A program with promised value but zero evidence scores 0; one that is fully
 * validated, fully adopted and fully gated scores 100.
 */
export function evidenceMaturity(row: {
  promisedValueUsd: number | null;
  financeValidatedValueUsd: number;
  adoptionRatePct: number | null;
  usageMetric: string | null;
  usageActual: number | null;
  requiredGates: ReadonlyArray<Record<string, unknown>>;
}): number {
  const promised = Math.max(0, safeNum(row.promisedValueUsd));
  const validated = Math.max(0, safeNum(row.financeValidatedValueUsd));
  const financeFrac = promised > 0 ? clamp(validated / promised, 0, 1) : 0;
  const adoptionFrac = adoptionFraction(row);
  const gateFrac = gatesClearedFraction(row.requiredGates) ?? 0;

  const score = 0.4 * financeFrac + 0.35 * adoptionFrac + 0.25 * gateFrac;
  return Math.round(clamp(score, 0, 1) * 100);
}

/**
 * **Proof level, 0–3.** The `.pips` control in every table and lane card.
 *
 *   3 — claimable value exists (the claim gate cleared)
 *   2 — Finance validated a figure, but the claim gate has not cleared
 *   1 — usage evidence exists, but Finance has validated nothing
 *   0 — neither usage evidence nor finance validation
 *
 * Deliberately ordinal, not a rounding of `evidenceMaturity`: the pips answer
 * "how far along the proof chain is this?", which is a different question from
 * "how complete is the evidence?".
 */
export function proofLevel(row: {
  promisedValueUsd: number | null;
  financeValidatedValueUsd: number;
  towerClaimAllowed: string;
  adoptionRatePct: number | null;
  usageMetric: string | null;
  usageActual: number | null;
}): number {
  if (claimableUsd(row) > 0) return 3;
  if (safeNum(row.financeValidatedValueUsd) > 0) return 2;
  if (hasUsageEvidence(row)) return 1;
  return 0;
}

/**
 * Usage-evidence strength, as the design's three-state chip.
 *
 *   strong — adoption ≥ 60%
 *   weak   — some usage evidence, but adoption below 60% or unquantified
 *   none   — no usage evidence at all
 *
 * 60% is the design's own break (the M365 Copilot card reads "weak" at 44%
 * adoption and the Fraud Graph card reads "strong" at 96%).
 */
export const STRONG_ADOPTION_THRESHOLD = 0.6;

export function usageStatus(row: {
  adoptionRatePct: number | null;
  usageMetric: string | null;
  usageActual: number | null;
}): TowerUsageStatus {
  if (!hasUsageEvidence(row)) return "none";
  return adoptionFraction(row) >= STRONG_ADOPTION_THRESHOLD ? "strong" : "weak";
}

/**
 * Finance-validation strength.
 *
 *   validated — the claim gate cleared (`tower_claim_allowed === 'allowed'`)
 *   partial   — a validated figure exists but the gate has not cleared
 *   none      — nothing validated
 */
export function financeStatus(row: {
  towerClaimAllowed: string;
  financeValidatedValueUsd: number;
}): TowerFinanceStatus {
  if (claimableUsd(row) > 0) return "validated";
  if (safeNum(row.financeValidatedValueUsd) > 0) return "partial";
  return "none";
}

/**
 * The lane a program renders in.
 *
 * The mart's four lanes pass straight through. The design adds a fifth
 * "watch" column for run-and-sustain lines — programs with funding but no
 * promised AI value, which would otherwise sit misleadingly in `fund`. That
 * reclassification is presentation-only and never changes a dollar figure.
 */
export function laneFor(row: {
  decisionLane: TowerMartProgramLane["decisionLane"];
  promisedValueUsd: number | null;
  approvedFundingUsd: number;
}): TowerLaneKey {
  const promised = safeNum(row.promisedValueUsd);
  if (promised <= 0 && safeNum(row.approvedFundingUsd) > 0) return "watch";
  return row.decisionLane;
}

/**
 * Everything derived for one program lane row, in one call.
 *
 * Components consume this; they never re-derive. Keeping the whole set behind a
 * single entry point is what makes "the arithmetic lives in one tested place"
 * true rather than aspirational.
 */
export interface DerivedProgramValues {
  usageSupportedUsd: number;
  claimableUsd: number;
  blockedUsd: number;
  evidenceMaturity: number;
  proofLevel: number;
  proofSequenceStatus: TowerProofSequenceStatus;
  proofSequenceExplanation: string | null;
  usageStatus: TowerUsageStatus;
  financeStatus: TowerFinanceStatus;
  lane: TowerLaneKey;
  valueAtStakeUsd: number;
}

export function deriveProgramValues(
  row: TowerMartProgramLane,
): DerivedProgramValues {
  const promised = Math.max(0, safeNum(row.promisedValueUsd));
  return {
    usageSupportedUsd: usageSupportedUsd(row),
    claimableUsd: claimableUsd(row),
    blockedUsd: blockedUsd(row),
    evidenceMaturity: evidenceMaturity(row),
    proofLevel: proofLevel(row),
    proofSequenceStatus: proofSequenceStatus(row),
    proofSequenceExplanation: proofSequenceExplanation(row),
    usageStatus: usageStatus(row),
    financeStatus: financeStatus(row),
    lane: laneFor(row),
    // Matrix exposure. Source-backed benefit is the stake when it exists; otherwise
    // approved funding is shown as capital exposure only. This keeps no-benefit
    // programs visible in the decision matrix without crediting investment as
    // economic value.
    valueAtStakeUsd:
      promised > 0 ? promised : Math.max(0, safeNum(row.approvedFundingUsd)),
  };
}
