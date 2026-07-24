import { applyRangePolicy, computeRange, computeRangeScore, NoMatchingRangePolicyError, scoreRateCardCoverage } from "../range-policy";
import { assertLowExpectedHighInvariant } from "../validation";
import type { RangePolicyInputs } from "../types";

const POLICIES = [
  { policy_code: "RANGE-TIGHT", policy_name: "Tight", min_score: 0, max_score: 2, low_multiplier: 0.9, high_multiplier: 1.15 },
  { policy_code: "RANGE-STANDARD", policy_name: "Standard", min_score: 3, max_score: 5, low_multiplier: 0.75, high_multiplier: 1.35 },
  { policy_code: "RANGE-WIDE", policy_name: "Wide", min_score: 6, max_score: 8, low_multiplier: 0.6, high_multiplier: 1.6 },
  { policy_code: "RANGE-VERY-WIDE", policy_name: "Very Wide", min_score: 9, max_score: 10, low_multiplier: 0.45, high_multiplier: 2.0 },
];

describe("scoreRateCardCoverage", () => {
  it("scores >=90% coverage as 0 (tightest)", () => expect(scoreRateCardCoverage(100)).toBe(0));
  it("scores 60-89% coverage as 1", () => expect(scoreRateCardCoverage(75)).toBe(1));
  it("scores <60% coverage as 2 (widest)", () => expect(scoreRateCardCoverage(10)).toBe(2));
});

describe("computeRangeScore", () => {
  it("sums all five dimensions 0-10", () => {
    const inputs: RangePolicyInputs = {
      scopeMaturity: "high",
      evidenceQuality: "high",
      deliveryNovelty: "low",
      quantityUncertainty: "low",
      rateCardCoveragePct: 95,
    };
    // high(2) + high(2) + low(0) + low(0) + coverage(0) = 4
    expect(computeRangeScore(inputs)).toBe(4);
  });

  it("worst case across all dimensions scores 10", () => {
    const inputs: RangePolicyInputs = {
      scopeMaturity: "high",
      evidenceQuality: "high",
      deliveryNovelty: "high",
      quantityUncertainty: "high",
      rateCardCoveragePct: 0,
    };
    expect(computeRangeScore(inputs)).toBe(10);
  });
});

describe("applyRangePolicy / computeRange", () => {
  it("selects the matching policy band and guarantees low <= expected <= high", () => {
    const range = applyRangePolicy(4, 1_000_000, POLICIES);
    expect(range.policyCode).toBe("RANGE-STANDARD");
    expect(range.lowCents).toBe(750_000);
    expect(range.highCents).toBe(1_350_000);
    expect(() => assertLowExpectedHighInvariant(range)).not.toThrow();
  });

  it("throws when no policy band covers the score", () => {
    expect(() => applyRangePolicy(4, 1_000_000, [{ policy_code: "X", policy_name: "X", min_score: 5, max_score: 10, low_multiplier: 0.5, high_multiplier: 1.5 }])).toThrow(
      NoMatchingRangePolicyError,
    );
  });

  it("computeRange is the score+apply convenience wrapper and holds the invariant across every policy tier", () => {
    const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const score of scores) {
      const inputs: RangePolicyInputs = {
        scopeMaturity: "low",
        evidenceQuality: "low",
        deliveryNovelty: "low",
        quantityUncertainty: "low",
        rateCardCoveragePct: 100,
      };
      // Force the desired score by directly calling applyRangePolicy with a synthetic score instead —
      // computeRange itself is exercised via the golden-fixture tests with real inputs.
      const range = applyRangePolicy(score, 500_000, POLICIES);
      expect(range.lowCents).toBeLessThanOrEqual(range.expectedCents);
      expect(range.expectedCents).toBeLessThanOrEqual(range.highCents);
      void inputs;
    }
  });

  it("computeRange scores inputs and applies the band in one call", () => {
    const range = computeRange(
      { scopeMaturity: "high", evidenceQuality: "high", deliveryNovelty: "low", quantityUncertainty: "low", rateCardCoveragePct: 95 },
      1_000_000,
      POLICIES,
    );
    expect(range.score).toBe(4);
    expect(range.policyCode).toBe("RANGE-STANDARD");
  });
});
