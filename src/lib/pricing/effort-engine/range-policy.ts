/**
 * Nexus Pricing Engine — PR4 range policy (brief §7.8).
 *
 * A deterministic low/expected/high spread — NO ML, no Monte Carlo, per the
 * brief's explicit V0 exclusion. Five inputs (scope maturity, evidence
 * quality, delivery novelty, quantity uncertainty, rate-card coverage) are
 * each scored 0-2 points; the total 0-10 score selects a named policy tier
 * from `pricing_range_policies` (loaded via `model-registry.ts`), whose
 * `low_multiplier`/`high_multiplier` band is applied to the expected cost.
 *
 * The rate-card-coverage input is the one dimension this module derives
 * from a REAL computed source rather than caller judgment: it is designed
 * to take PR3's `governed-load/coverage-report.ts`'s `coveragePct` output
 * directly (a live tenant's actual direct+inherited coverage percentage
 * against the 326-role taxonomy) — see `scoreRateCardCoverage`'s
 * doc-comment. The other four dimensions are supplied by the caller today
 * (a Move-level planning judgment call, not yet derived from any live
 * signal) — a documented, known gap, not an oversight (see the PR4 release
 * record).
 */
import type { PricingRangePolicyRow } from "./types";
import { applyMultiplierToCents } from "./money";
import type { Cents, RangePolicyInputs, RangeResult } from "./types";

function scoreTier(tier: "low" | "medium" | "high"): number {
  switch (tier) {
    case "low":
      return 0;
    case "medium":
      return 1;
    case "high":
      return 2;
  }
}

/**
 * >=90% coverage (nearly every role priced directly or via a real rate-card
 * inheritance chain) scores best (0 = tightest range); <60% (mostly
 * unpriced/defaulted) scores worst (2 = widest range).
 */
export function scoreRateCardCoverage(coveragePct: number): number {
  if (coveragePct >= 90) return 0;
  if (coveragePct >= 60) return 1;
  return 2;
}

/** Sum of the five dimension scores, 0-10. Pure, deterministic. */
export function computeRangeScore(inputs: RangePolicyInputs): number {
  return (
    scoreTier(inputs.scopeMaturity) +
    scoreTier(inputs.evidenceQuality) +
    scoreTier(inputs.deliveryNovelty) +
    scoreTier(inputs.quantityUncertainty) +
    scoreRateCardCoverage(inputs.rateCardCoveragePct)
  );
}

export class NoMatchingRangePolicyError extends Error {
  constructor(score: number) {
    super(`no_matching_range_policy: score ${score} does not fall within any policy's [min_score, max_score] band`);
    this.name = "NoMatchingRangePolicyError";
  }
}

/**
 * Select the policy row whose `[min_score, max_score]` band contains
 * `score`, and apply it to `expectedCents`. Guarantees
 * `low <= expected <= high` for every result — enforced structurally by the
 * migration's CHECK constraint (`low_multiplier <= 1 <= high_multiplier`)
 * and re-asserted defensively here.
 */
export function applyRangePolicy(
  score: number,
  expectedCents: Cents,
  policies: readonly Pick<PricingRangePolicyRow, "policy_code" | "policy_name" | "min_score" | "max_score" | "low_multiplier" | "high_multiplier">[],
): RangeResult {
  const policy = policies.find((p) => score >= p.min_score && score <= p.max_score);
  if (!policy) throw new NoMatchingRangePolicyError(score);
  if (policy.low_multiplier > 1 || policy.high_multiplier < 1) {
    throw new Error(
      `range_policy_invariant_violation: policy '${policy.policy_code}' has low_multiplier=${policy.low_multiplier}, high_multiplier=${policy.high_multiplier} — both must straddle 1.0`,
    );
  }
  const lowCents = applyMultiplierToCents(expectedCents, policy.low_multiplier);
  const highCents = applyMultiplierToCents(expectedCents, policy.high_multiplier);
  return {
    policyCode: policy.policy_code,
    policyName: policy.policy_name,
    score,
    lowMultiplier: policy.low_multiplier,
    highMultiplier: policy.high_multiplier,
    expectedCents,
    lowCents,
    highCents,
  };
}

/** Convenience: score the five inputs and apply the matching policy in one call. */
export function computeRange(
  inputs: RangePolicyInputs,
  expectedCents: Cents,
  policies: readonly Pick<PricingRangePolicyRow, "policy_code" | "policy_name" | "min_score" | "max_score" | "low_multiplier" | "high_multiplier">[],
): RangeResult {
  const score = computeRangeScore(inputs);
  return applyRangePolicy(score, expectedCents, policies);
}
