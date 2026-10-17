/**
 * The value engine's synthetic golden case (value-engine.test.ts), shared by
 * the financial model workbook tests. Every number is invented.
 */
import type { InputRange, Lever, LiteralInputRef, ValueCase } from "@/lib/programs/value-engine/types";

const lit = (value: number, range?: InputRange): LiteralInputRef => ({
  kind: "literal",
  value,
  source: "synthetic",
  ...(range ? { range } : {}),
});

// L1 — premium labour, cost_reduction.
//   annual = spend 8,000,000 × reduction 0.12 × attribution 0.6 × probability 0.8
//          = 460,800 dollars = 46,080,000 cents
//   spend low 7,000,000 → 40,320,000 cents; high 9,000,000 → 51,840,000 cents
function premiumLabour(): Lever {
  return {
    id: "L1",
    name: "Premium labour",
    conversion: "cost_reduction",
    driver: {
      name: "premium labour spend reduced",
      unit: "share of spend",
      direction: "increase",
      baseline: lit(0),
      target: lit(0.12),
    },
    terms: [
      {
        role: "base",
        label: "annual premium labour spend ($)",
        ref: lit(8_000_000, { low: 7_000_000, high: 9_000_000 }),
      },
      {
        role: "driver_delta",
        label: "share of premium spend no longer bought",
      },
    ],
    attribution: lit(0.6),
    probability: lit(0.8),
    timing: { startMonth: 4, rampMonths: 6, paymentLagMonths: 2 },
  };
}

// L2 — length of stay, volume_added, overlap group "bed capacity".
//   delta = 5.0 − 4.7 = 0.3 days
//   annual = 0.3 × 20,000 discharges × 0.2 admissions/bed-day × $4,000 margin
//            × 0.4 refill × 0.5 attribution × 0.7 probability
//          = 672,000 dollars = 67,200,000 cents
function lengthOfStay(): Lever {
  return {
    id: "L2",
    name: "Length of stay",
    conversion: "volume_added",
    driver: {
      name: "average length of stay",
      unit: "days",
      direction: "decrease",
      baseline: lit(5.0),
      target: lit(4.7),
    },
    terms: [
      { role: "driver_delta", label: "days saved per discharge" },
      { role: "base", label: "annual discharges", ref: lit(20_000) },
      {
        role: "share",
        label: "refill admissions per freed bed-day",
        ref: lit(0.2),
      },
      {
        role: "margin",
        label: "contribution margin per admission ($)",
        ref: lit(4_000),
      },
      {
        role: "refill_share",
        label: "share of freed beds refilled",
        ref: lit(0.4),
      },
    ],
    overlapGroup: "bed capacity",
    attribution: lit(0.5),
    probability: lit(0.7),
    timing: { startMonth: 6, rampMonths: 6, paymentLagMonths: 3 },
  };
}

// L3 — ED boarding, same overlap group as L2.
//   delta = 30,000 − 24,000 = 6,000 hours
//   own annual = 6,000 × 0.05 × 4,000 × 0.4 × 0.6 × 0.7 = 201,600 dollars
//   < L2's 672,000, so the group counts L2 once and L3 is excluded.
function edBoarding(): Lever {
  return {
    id: "L3",
    name: "ED boarding",
    conversion: "volume_added",
    driver: {
      name: "ED boarding hours",
      unit: "hours",
      direction: "decrease",
      baseline: lit(30_000),
      target: lit(24_000),
    },
    terms: [
      { role: "driver_delta" },
      {
        role: "share",
        label: "admissions recovered per boarding hour",
        ref: lit(0.05),
      },
      {
        role: "margin",
        label: "contribution margin per admission ($)",
        ref: lit(4_000),
      },
      {
        role: "refill_share",
        label: "share of recovered capacity refilled",
        ref: lit(0.4),
      },
    ],
    overlapGroup: "bed capacity",
    attribution: lit(0.6),
    probability: lit(0.7),
    timing: { startMonth: 6, rampMonths: 6, paymentLagMonths: 3 },
  };
}

// L4 — documentation hours, non_cash.
//   hours metric = (50,000 − 40,000) × 0.8 × 0.9 = 7,200 hours; $0 without release.
function documentationHours(): Lever {
  return {
    id: "L4",
    name: "Documentation hours",
    conversion: "non_cash",
    driver: {
      name: "documentation hours per year",
      unit: "hours",
      direction: "decrease",
      baseline: lit(50_000),
      target: lit(40_000),
    },
    terms: [{ role: "driver_delta" }],
    attribution: lit(0.8),
    probability: lit(0.9),
    timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
  };
}

export function goldenCase(): ValueCase {
  return {
    levers: [
      premiumLabour(),
      lengthOfStay(),
      edBoarding(),
      documentationHours(),
    ],
    horizonYears: 3,
    discountRate: lit(0.08, { low: 0.06, high: 0.1 }),
    cost: { kind: "estimate", baseCents: 240_000_000 },
  };
}

