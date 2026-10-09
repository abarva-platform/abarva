/**
 * ROM increment 1 — a named low/high band beside the score tiers.
 */
import {
  applyNamedRangePolicy,
  applyRangePolicy,
  InvalidNamedRangePolicyError,
} from "../range-policy";
import { assertLowExpectedHighInvariant } from "../validation";

describe("applyNamedRangePolicy", () => {
  it("applies the named band directly: 2,000,000 × 0.75 / 1.50", () => {
    const r = applyNamedRangePolicy(2_000_000, {
      code: "PRE-DESIGN",
      low: 0.75,
      high: 1.5,
    });
    expect(r).toEqual({
      basis: "named",
      policyCode: "PRE-DESIGN",
      lowMultiplier: 0.75,
      highMultiplier: 1.5,
      expectedCents: 2_000_000,
      lowCents: 1_500_000,
      highCents: 3_000_000,
    });
    expect(() =>
      assertLowExpectedHighInvariant({
        ...r,
        policyName: r.policyCode,
        score: 0,
      }),
    ).not.toThrow();
  });

  it("rounds each bound once to a whole cent (333,333 × 0.75 = 249,999.75; × 1.5 = 499,999.5)", () => {
    const r = applyNamedRangePolicy(333_333, {
      code: "PRE-DESIGN",
      low: 0.75,
      high: 1.5,
    });
    expect(r.lowCents).toBe(250_000);
    expect(r.highCents).toBe(500_000);
  });

  it("accepts a degenerate 1/1 band", () => {
    const r = applyNamedRangePolicy(10_000, { code: "FIXED", low: 1, high: 1 });
    expect([r.lowCents, r.highCents]).toEqual([10_000, 10_000]);
  });

  it.each([
    { code: "X", low: 1.1, high: 1.5 },
    { code: "X", low: 0.8, high: 0.9 },
    { code: "X", low: -0.1, high: 1.2 },
    { code: "X", low: Number.NaN, high: 1.2 },
    { code: "X", low: 0.8, high: Number.POSITIVE_INFINITY },
    { code: "  ", low: 0.8, high: 1.2 },
  ])("refuses %p", (policy) => {
    expect(() => applyNamedRangePolicy(1_000, policy)).toThrow(
      InvalidNamedRangePolicyError,
    );
  });

  it("leaves score-tier selection unchanged", () => {
    const tiers = [
      {
        policy_code: "T",
        policy_name: "T",
        min_score: 0,
        max_score: 10,
        low_multiplier: 0.8,
        high_multiplier: 1.3,
      },
    ];
    expect(applyRangePolicy(4, 1_000_000, tiers)).toMatchObject({
      policyCode: "T",
      score: 4,
      lowCents: 800_000,
      highCents: 1_300_000,
    });
  });
});
