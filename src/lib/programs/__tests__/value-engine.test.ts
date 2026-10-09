/**
 * Moves value engine — golden case and rules.
 *
 * The golden case is SYNTHETIC: every number below is invented, shaped like
 * a health-system value case (premium labour, length of stay, emergency
 * department boarding, documentation hours). Every expected figure is
 * worked by hand in the comments — the engine is never used to produce its
 * own expectation.
 */
import { evaluateValueCase } from "@/lib/programs/value-engine";
import { evaluateValueFormulaTerms } from "@/lib/programs/value-engine/formula-terms";
import { valueForecastFromEngine } from "@/lib/programs/value-engine/kernel-adapter";
import {
  bandForConfidence,
  CONFIDENCE_1_BAND,
  CONFIDENCE_3_BAND,
  CONFIDENCE_5_BAND,
} from "@/lib/programs/value-engine/resolve-inputs";
import { earnedFraction } from "@/lib/programs/value-engine/timing";
import type {
  InputRange,
  Lever,
  LiteralInputRef,
  ResolvableInputRef,
  ResolvedInput,
  ValueCase,
  ValueCaseResult,
} from "@/lib/programs/value-engine/types";

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

function goldenCase(): ValueCase {
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

function lever(result: ValueCaseResult, id: string) {
  const found = result.levers.find((l) => l.leverId === id);
  if (!found) throw new Error(`no lever ${id}`);
  return found;
}

function breakeven(result: ValueCaseResult, id: string) {
  const found = result.breakeven.find((b) => b.leverId === id);
  if (!found) throw new Error(`no breakeven ${id}`);
  return found;
}

const zeros = (n: number) => new Array<number>(n).fill(0);

// Base monthly cash by hand (36 months, index 0 = month 1).
// L1: earns from month 4, ramp 6 → month k earns 3,840,000 × k/6; lag 2.
//   cash m6..m10 = 640,000 / 1,280,000 / 1,920,000 / 2,560,000 / 3,200,000,
//   m11.. = 3,840,000.
const L1_CASH = [
  ...zeros(5),
  640_000,
  1_280_000,
  1_920_000,
  2_560_000,
  3_200_000,
  ...new Array<number>(26).fill(3_840_000),
];
// L2: 67,200,000 / 12 = 5,600,000 a month at full run; starts month 6, ramp 6;
// lag 3. Earned k/6: 933,333.33→933,333; 1,866,666.67→1,866,667; 2,800,000;
// 3,733,333.33→3,733,333; 4,666,666.67→4,666,667; then 5,600,000.
const L2_CASH = [
  ...zeros(8),
  933_333,
  1_866_667,
  2_800_000,
  3_733_333,
  4_666_667,
  ...new Array<number>(23).fill(5_600_000),
];
const BASE_CASH = L1_CASH.map((v, i) => v + L2_CASH[i]);

function npvByHand(
  cash: readonly number[],
  rate: number,
  cost: number,
): number {
  let sum = -cost;
  cash.forEach((c, i) => {
    sum += c / (1 + rate) ** ((i + 1) / 12);
  });
  return Math.round(sum);
}

describe("value engine · golden synthetic case", () => {
  const result = evaluateValueCase(goldenCase());

  it("evaluates and is ready for approval", () => {
    expect(result.status).toBe("evaluated");
    expect(result.readyForApproval).toBe(true);
    expect(result.mustValidate).toEqual([]);
  });

  it("prices premium labour as spend × reduction × attribution × probability", () => {
    const l1 = lever(result, "L1");
    expect(l1.status).toBe("counted");
    expect(l1.inCash).toBe(true);
    expect(l1.annualCents).toEqual({
      low: 40_320_000,
      base: 46_080_000,
      high: 51_840_000,
    });
    expect(l1.driverDelta).toEqual({ low: 0.12, base: 0.12, high: 0.12 });
  });

  it("prices length of stay as bed-days → admissions × margin × refill share", () => {
    const l2 = lever(result, "L2");
    expect(l2.status).toBe("counted");
    expect(l2.driverDelta?.base).toBe(0.3);
    expect(l2.annualCents).toEqual({
      low: 67_200_000,
      base: 67_200_000,
      high: 67_200_000,
    });
    expect(l2.terms.base.map((t) => [t.cellRole, t.value, t.source])).toEqual([
      ["driver_delta", 0.3, "literal:synthetic → literal:synthetic"],
      ["base", 20_000, "literal:synthetic"],
      ["share", 0.2, "literal:synthetic"],
      ["margin", 4_000, "literal:synthetic"],
      ["refill_share", 0.4, "literal:synthetic"],
      ["attribution", 0.5, "literal:synthetic"],
      ["probability", 0.7, "literal:synthetic"],
      ["unit_conversion", 100, "engine"],
      ["result", 67_200_000, "engine"],
    ]);
  });

  it("counts the ED-boarding overlap once, via the larger length-of-stay lever", () => {
    const l3 = lever(result, "L3");
    expect(l3.status).toBe("overlap_excluded");
    expect(l3.countedInsteadBy).toBe("L2");
    expect(l3.inCash).toBe(false);
    expect(l3.annualCents).toEqual({ low: 0, base: 0, high: 0 });
    const gate = l3.terms.base.find((t) => t.cellRole === "overlap_exclusion");
    expect(gate).toMatchObject({ value: 0, source: "engine" });
    expect(gate?.label).toContain("L2");
    expect(l3.monthlyCashCents.base).toEqual([]);
  });

  it("counts documentation hours as $0 with no release path, still reporting the hours", () => {
    const l4 = lever(result, "L4");
    expect(l4.status).toBe("zero_no_release_path");
    expect(l4.inCash).toBe(false);
    expect(l4.annualCents).toEqual({ low: 0, base: 0, high: 0 });
    expect(l4.nonMoneyMetric).toEqual({
      unit: "hours",
      value: { low: 7_200, base: 7_200, high: 7_200 },
    });
    expect(
      l4.terms.base.find((t) => t.cellRole === "release_gate")?.value,
    ).toBe(0);
  });

  it("totals annual cash from the counted levers only", () => {
    // base 46,080,000 + 67,200,000; low 40,320,000 + 67,200,000; high 51,840,000 + 67,200,000
    expect(result.economics?.annualCashCents).toEqual({
      low: 107_520_000,
      base: 113_280_000,
      high: 119_040_000,
    });
    expect(
      result.economics?.annualCashTerms.base.map((t) => [t.label, t.value]),
    ).toEqual([
      ["L1", 46_080_000],
      ["L2", 67_200_000],
      ["annual cash value (cents)", 113_280_000],
    ]);
    expect(result.economics?.riskAvoidedAnnualCents.base).toBe(0);
  });

  it("builds the monthly cash curve after start, ramp and payment lag", () => {
    expect(lever(result, "L1").monthlyCashCents.base).toEqual(L1_CASH);
    expect(lever(result, "L2").monthlyCashCents.base).toEqual(L2_CASH);
    expect(result.economics?.monthlyCashCents.base).toEqual(BASE_CASH);
  });

  it("finds the payback month on cumulative cash against the cost", () => {
    // Base: through m13 = 21,120,000 (L1) + 14,000,000 (L2) = 35,120,000;
    // then 9,440,000 a month: m34 = 233,360,000 < 240,000,000 ≤ m35 = 242,800,000.
    // High (L1 4,320,000/month): m13 = 37,760,000; then 9,920,000 a month:
    // m33 = 236,160,000 < 240,000,000 ≤ m34 = 246,080,000.
    // Low (L1 3,360,000/month): m13 = 32,480,000; 8,960,000 a month reaches
    // the cost only in month 37 — after the 36-month horizon.
    expect(result.economics?.paybackMonth).toEqual({
      low: null,
      base: 35,
      high: 34,
    });
  });

  it("discounts monthly cash at (1 + r)^(m/12) for NPV", () => {
    expect(result.economics?.discountRate).toBe(0.08);
    expect(result.economics?.npvCents.base).toBe(
      npvByHand(BASE_CASH, 0.08, 240_000_000),
    );
    expect(result.economics?.costCents).toEqual({
      low: 240_000_000,
      base: 240_000_000,
      high: 240_000_000,
    });
  });

  it("reconciles every figure exactly from its formula terms", () => {
    for (const l of result.levers) {
      for (const s of ["low", "base", "high"] as const) {
        const terms = l.terms[s];
        expect(evaluateValueFormulaTerms(terms)).toBe(l.annualCents?.[s]);
        expect(terms[terms.length - 1]).toMatchObject({
          cellRole: "result",
          value: l.annualCents?.[s],
        });
      }
    }
    for (const s of ["low", "base", "high"] as const) {
      expect(
        evaluateValueFormulaTerms(result.economics!.annualCashTerms[s]),
      ).toBe(result.economics!.annualCashCents[s]);
      expect(evaluateValueFormulaTerms(result.economics!.npvTerms[s])).toBe(
        result.economics!.npvCents[s],
      );
    }
    expect(result.economics!.npvTerms.base[0]).toMatchObject({
      cellRole: "addend",
      value: -240_000_000,
    });
    expect(result.economics!.npvTerms.base).toHaveLength(5);
  });

  it("solves premium-labour breakeven in closed form", () => {
    // Needed per year: 240,000,000 / 3 = 80,000,000 cents; others (L2) 67,200,000;
    // k = 8,000,000 × 0.6 × 0.8 × 100 = 384,000,000 → d* = 12,800,000 / 384,000,000.
    const b = breakeven(result, "L1");
    expect(b.status).toBe("solved");
    expect(b.method).toBe("closed_form");
    expect(b.breakevenDelta).toBeCloseTo(1 / 30, 12);
    expect(b.breakevenTarget).toBeCloseTo(1 / 30, 12);
    expect(b.bounds).toEqual({ min: 0, max: 0.24 });
    expect(b.basis).toBe("steady_state_annual_x_horizon");
  });

  it("solves length-of-stay breakeven by bisection, since its overlap group decides what counts", () => {
    // Needed from the group: 80,000,000 − 46,080,000 = 33,920,000 cents;
    // L2 = d × 224,000,000 → d* = 0.151428571…; target = 5.0 − d*.
    const b = breakeven(result, "L2");
    expect(b.status).toBe("solved");
    expect(b.method).toBe("bisection");
    expect(b.breakevenDelta).toBeCloseTo(33_920_000 / 224_000_000, 7);
    expect(b.breakevenTarget).toBeCloseTo(5 - 33_920_000 / 224_000_000, 7);
    expect(b.bounds).toEqual({ min: 0, max: 5 });
  });

  it("reports ED boarding as met without the lever and hours as not applicable", () => {
    expect(breakeven(result, "L3")).toMatchObject({
      status: "met_without_lever",
      method: "bisection",
      breakevenDelta: 0,
      breakevenTarget: 30_000,
    });
    expect(breakeven(result, "L4")).toMatchObject({
      status: "not_applicable",
      method: null,
      breakevenDelta: null,
      breakevenTarget: null,
    });
  });

  it("lowers the breakeven reduction when the spend base is higher", () => {
    const low = result.sensitivity.find(
      (r) => r.key === "L1.term[0]" && r.side === "low",
    );
    const high = result.sensitivity.find(
      (r) => r.key === "L1.term[0]" && r.side === "high",
    );
    expect(low?.inputValue).toBe(7_000_000);
    expect(high?.inputValue).toBe(9_000_000);
    // 12,800,000 / (7,000,000 × 48) and 12,800,000 / (9,000,000 × 48)
    expect(low?.breakeven.L1.breakevenDelta).toBeCloseTo(
      12_800_000 / 336_000_000,
      12,
    );
    expect(high?.breakeven.L1.breakevenDelta).toBeCloseTo(
      12_800_000 / 432_000_000,
      12,
    );
    expect(high!.breakeven.L1.breakevenDelta!).toBeLessThan(
      breakeven(result, "L1").breakevenDelta!,
    );
    expect(low?.annualCashCents).toBe(107_520_000);
    expect(high?.annualCashCents).toBe(119_040_000);
    // and L2 needs less length-of-stay reduction when L1 brings more:
    // (80,000,000 − 51,840,000) / 224,000,000
    expect(high?.breakeven.L2.breakevenDelta).toBeCloseTo(
      28_160_000 / 224_000_000,
      7,
    );
  });

  it("moves NPV, not annual cash, with the discount rate", () => {
    const at6 = result.sensitivity.find(
      (r) => r.key === "case.discount_rate" && r.side === "low",
    );
    const at10 = result.sensitivity.find(
      (r) => r.key === "case.discount_rate" && r.side === "high",
    );
    expect(at6?.annualCashCents).toBe(113_280_000);
    expect(at10?.annualCashCents).toBe(113_280_000);
    expect(at6?.npvCents).toBe(npvByHand(BASE_CASH, 0.06, 240_000_000));
    expect(at10?.npvCents).toBe(npvByHand(BASE_CASH, 0.1, 240_000_000));
    expect(at6!.npvCents).toBeGreaterThan(at10!.npvCents);
  });

  it("varies only inputs that carry a range", () => {
    expect([...new Set(result.sensitivity.map((r) => r.key))]).toEqual([
      "L1.term[0]",
      "case.discount_rate",
    ]);
  });
});

describe("value engine · hours saved convert only through a counted release path", () => {
  const released = (releasedCost: Lever["attribution"]): ValueCase => ({
    ...goldenCase(),
    levers: [
      premiumLabour(),
      lengthOfStay(),
      edBoarding(),
      {
        ...documentationHours(),
        releasePath: { kind: "role_released", releasedCost },
      },
    ],
  });

  it("converts to a cost reduction on the released cost only", () => {
    // 150,000 × 0.8 × 0.9 = 108,000 dollars = 10,800,000 cents
    const result = evaluateValueCase(released(lit(150_000)));
    const l4 = lever(result, "L4");
    expect(l4.status).toBe("counted");
    expect(l4.inCash).toBe(true);
    expect(l4.annualCents?.base).toBe(10_800_000);
    expect(l4.terms.base.map((t) => [t.cellRole, t.value])).toEqual([
      ["base", 150_000],
      ["attribution", 0.8],
      ["probability", 0.9],
      ["unit_conversion", 100],
      ["result", 10_800_000],
    ]);
    // the hours are still reported
    expect(l4.nonMoneyMetric?.value.base).toBe(7_200);
    // starts month 1, no ramp, no lag: 900,000 every month
    expect(l4.monthlyCashCents.base).toEqual(
      new Array<number>(36).fill(900_000),
    );
    expect(result.economics?.annualCashCents.base).toBe(124_080_000);
    expect(breakeven(result, "L4").status).toBe("not_applicable");
  });

  it("stays at $0 when the release row is not counted", () => {
    const resolver = (ref: ResolvableInputRef): ResolvedInput | null =>
      ref.kind === "register"
        ? {
            value: 150_000,
            source: `register:${ref.registerId}`,
            status: "proposed",
          }
        : null;
    const result = evaluateValueCase(
      released({ kind: "register", registerId: "V9" }),
      { resolver },
    );
    expect(result.status).toBe("evaluated");
    const l4 = lever(result, "L4");
    expect(l4.status).toBe("zero_release_unconfirmed");
    expect(l4.annualCents?.base).toBe(0);
    expect(l4.inCash).toBe(false);
  });

  it("counts an OPEN release row but flags it for validation", () => {
    const resolver = (ref: ResolvableInputRef): ResolvedInput | null =>
      ref.kind === "register"
        ? {
            value: 150_000,
            source: `register:${ref.registerId}`,
            status: "open",
          }
        : null;
    const result = evaluateValueCase(
      released({ kind: "register", registerId: "V9" }),
      { resolver },
    );
    expect(lever(result, "L4").status).toBe("counted");
    expect(lever(result, "L4").mustValidate).toEqual(["L4.release_cost"]);
    expect(result.mustValidate).toEqual(["L4.release_cost"]);
    expect(lever(result, "L4").terms.base[0].source).toBe("register:V9");
  });

  it("blocks when the release cost cannot be resolved at all", () => {
    const result = evaluateValueCase(
      released({ kind: "register", registerId: "V9" }),
    );
    expect(lever(result, "L4").status).toBe("blocked_unresolved_input");
    expect(result.status).toBe("blocked");
  });
});

describe("value engine · unresolved inputs block, never guess", () => {
  const withRegisterSpend = (): ValueCase => {
    const l1 = premiumLabour();
    l1.terms[0] = {
      role: "base",
      label: "annual premium labour spend ($)",
      ref: { kind: "register", registerId: "V3" },
    };
    return { ...goldenCase(), levers: [l1, lengthOfStay()] };
  };

  it("blocks the lever and the case, with no figure anywhere", () => {
    const result = evaluateValueCase(withRegisterSpend());
    expect(result.status).toBe("blocked");
    expect(result.readyForApproval).toBe(false);
    expect(result.economics).toBeNull();
    expect(result.breakeven).toEqual([]);
    expect(result.sensitivity).toEqual([]);
    const l1 = lever(result, "L1");
    expect(l1.status).toBe("blocked_unresolved_input");
    expect(l1.inputIssues).toEqual([
      { key: "L1.term[0]", reason: "unresolved" },
    ]);
    expect(l1.annualCents).toBeNull();
    // the healthy lever shows no partial total either
    expect(lever(result, "L2").annualCents).toBeNull();
  });

  it("resolves through an injected resolver, banding by register confidence", () => {
    const resolver = (ref: ResolvableInputRef): ResolvedInput | null =>
      ref.kind === "register" && ref.registerId === "V3"
        ? {
            value: 8_000_000,
            source: "register:V3",
            confidence: 3,
            status: "confirmed",
          }
        : null;
    const result = evaluateValueCase(withRegisterSpend(), { resolver });
    expect(result.status).toBe("evaluated");
    // ±25%: 6,000,000 .. 10,000,000 → × 0.12 × 0.48 × 100
    expect(lever(result, "L1").annualCents).toEqual({
      low: 34_560_000,
      base: 46_080_000,
      high: 57_600_000,
    });
    expect(lever(result, "L1").terms.base[0].source).toBe("register:V3");
  });

  it("refuses a register row that is not counted", () => {
    const resolver = (): ResolvedInput => ({
      value: 8_000_000,
      source: "register:V3",
      status: "rejected",
    });
    const result = evaluateValueCase(withRegisterSpend(), { resolver });
    expect(lever(result, "L1").inputIssues).toEqual([
      { key: "L1.term[0]", reason: "not_counted" },
    ]);
    expect(result.status).toBe("blocked");
  });

  it("refuses a literal with no source and out-of-domain values", () => {
    const l2 = lengthOfStay();
    l2.attribution = { kind: "literal", value: 0.5, source: "  " };
    l2.probability = lit(1.2);
    l2.terms[1] = { role: "base", label: "annual discharges", ref: lit(-5) };
    const result = evaluateValueCase({ ...goldenCase(), levers: [l2] });
    expect(lever(result, "L2").inputIssues).toEqual([
      { key: "L2.term[1]", reason: "negative" },
      { key: "L2.attribution", reason: "unresolved" },
      { key: "L2.probability", reason: "fraction_out_of_bounds" },
    ]);
  });

  it("refuses an out-of-order range and an unusable discount rate or cost", () => {
    const l1 = premiumLabour();
    l1.terms[0] = {
      role: "base",
      label: "spend",
      ref: lit(8, { low: 9, high: 10 }),
    };
    const result = evaluateValueCase({
      ...goldenCase(),
      levers: [l1],
      discountRate: lit(1),
      cost: { kind: "estimate", baseCents: 100, lowCents: 200 },
    });
    expect(lever(result, "L1").inputIssues).toEqual([
      { key: "L1.term[0]", reason: "range_out_of_order" },
    ]);
    expect(result.caseInputIssues).toEqual([
      { key: "case.discount_rate", reason: "rate_out_of_bounds" },
      { key: "case.cost", reason: "range_out_of_order" },
    ]);
  });

  it("blocks a case whose ROM cost cannot be resolved, and reads one that can", () => {
    const rom: ValueCase = {
      ...goldenCase(),
      cost: { kind: "rom", snapshotId: "rom-1" },
    };
    expect(evaluateValueCase(rom).caseInputIssues).toEqual([
      { key: "case.cost", reason: "unresolved" },
    ]);
    const resolved = evaluateValueCase(rom, {
      resolver: (ref) =>
        ref.kind === "rom"
          ? { value: 240_000_000.4, source: "rom:rom-1" }
          : null,
    });
    expect(resolved.economics?.costCents.base).toBe(240_000_000);
    expect(resolved.economics?.paybackMonth.base).toBe(35);
  });
});

describe("value engine · conversion rules", () => {
  function codes(model: ValueCase): string[] {
    const result = evaluateValueCase(model);
    expect(result.status).toBe("blocked");
    return result.levers.flatMap((l) => l.ruleViolations.map((v) => v.code));
  }
  const only = (l: Lever): ValueCase => ({ ...goldenCase(), levers: [l] });

  it("volume added needs a refill share and a margin", () => {
    const l2 = lengthOfStay();
    l2.terms = l2.terms.filter(
      (t) => t.role !== "refill_share" && t.role !== "margin",
    );
    expect(codes(only(l2))).toEqual([
      "volume_added_requires_refill_share",
      "volume_added_requires_margin",
    ]);
    expect(evaluateValueCase(only(l2)).levers[0].status).toBe(
      "blocked_conversion_rule",
    );
  });

  it("a cost reduction needs a spend base and a bought-less assumption", () => {
    const l1 = premiumLabour();
    l1.terms = [{ role: "margin", label: "m", ref: lit(1) }];
    expect(codes(only(l1))).toEqual([
      "cost_reduction_requires_base",
      "cost_reduction_requires_bought_less",
    ]);
    const withShare = premiumLabour();
    withShare.terms = [
      { role: "base", label: "spend", ref: lit(1_000) },
      { role: "share", label: "share no longer bought", ref: lit(0.1) },
    ];
    expect(evaluateValueCase(only(withShare)).status).toBe("evaluated");
  });

  it("revenue needs a margin", () => {
    const rev: Lever = {
      ...premiumLabour(),
      conversion: "revenue",
      terms: [{ role: "base", label: "revenue", ref: lit(1_000) }],
    };
    expect(codes(only(rev))).toEqual(["revenue_requires_margin"]);
    rev.terms.push({ role: "margin", label: "margin", ref: lit(0.3) });
    expect(evaluateValueCase(only(rev)).status).toBe("evaluated");
  });

  it("a release path belongs to non-cash levers only; one driver delta per lever", () => {
    const l1 = premiumLabour();
    l1.releasePath = { kind: "contract_released", releasedCost: lit(1) };
    l1.terms.push({ role: "driver_delta" });
    expect(codes(only(l1))).toEqual([
      "multiple_driver_delta_terms",
      "release_path_only_for_non_cash",
    ]);
  });

  it("refuses a target on the wrong side of the baseline, bad timing and bad bounds", () => {
    const l2 = lengthOfStay();
    l2.driver.target = lit(5.5);
    expect(codes(only(l2))).toEqual(["driver_direction_mismatch"]);
    const l1 = premiumLabour();
    l1.timing = { startMonth: 37, rampMonths: 0, paymentLagMonths: 0 };
    expect(codes(only(l1))).toEqual(["invalid_timing"]);
    const pd = premiumLabour();
    pd.timing = {
      ...pd.timing,
      phaseDown: [
        { fromMonth: 12, factor: 0.5 },
        { fromMonth: 12, factor: 0.2 },
      ],
    };
    expect(codes(only(pd))).toEqual(["invalid_timing"]);
    const bounds = premiumLabour();
    bounds.driver.deltaBounds = { min: 0.5, max: 0.1 };
    expect(codes(only(bounds))).toEqual(["invalid_delta_bounds"]);
  });

  it("refuses an empty case, duplicate lever ids and a horizon outside 1..10", () => {
    expect(
      evaluateValueCase({ ...goldenCase(), levers: [] }).caseRuleViolations.map(
        (v) => v.code,
      ),
    ).toEqual(["no_levers"]);
    expect(
      evaluateValueCase({
        ...goldenCase(),
        levers: [premiumLabour(), premiumLabour()],
      }).caseRuleViolations.map((v) => v.code),
    ).toEqual(["duplicate_lever_id"]);
    const longCase = evaluateValueCase({ ...goldenCase(), horizonYears: 11 });
    expect(longCase.caseRuleViolations.map((v) => v.code)).toEqual([
      "invalid_horizon",
    ]);
    expect(longCase.status).toBe("blocked");
  });

  it("keeps avoided risk out of cash by default and counts it when the case opts in", () => {
    const risk: Lever = {
      ...premiumLabour(),
      id: "R1",
      name: "Avoided penalty",
      conversion: "risk_avoided",
      overlapGroup: undefined,
    };
    const base = evaluateValueCase({
      ...goldenCase(),
      levers: [lengthOfStay(), risk],
    });
    expect(lever(base, "R1")).toMatchObject({
      status: "counted",
      inCash: false,
    });
    expect(base.economics?.riskAvoidedAnnualCents.base).toBe(46_080_000);
    expect(base.economics?.annualCashCents.base).toBe(67_200_000);
    expect(breakeven(base, "R1").status).toBe("not_applicable");
    const opted = evaluateValueCase({
      ...goldenCase(),
      levers: [lengthOfStay(), risk],
      includeRiskAvoidedInCash: true,
    });
    expect(lever(opted, "R1").inCash).toBe(true);
    expect(opted.economics?.annualCashCents.base).toBe(113_280_000);
    expect(opted.economics?.riskAvoidedAnnualCents.base).toBe(46_080_000);
  });
});

describe("value engine · overlap, timing, breakeven edges", () => {
  it("counts a declared primary instead of the largest member", () => {
    const l3 = { ...edBoarding(), overlapPrimary: true };
    const result = evaluateValueCase({
      ...goldenCase(),
      levers: [lengthOfStay(), l3],
    });
    expect(lever(result, "L2")).toMatchObject({
      status: "overlap_excluded",
      countedInsteadBy: "L3",
    });
    expect(lever(result, "L3").annualCents?.base).toBe(20_160_000);
  });

  it("counts the first member on a tie and leaves ungrouped levers alone", () => {
    const twin = { ...lengthOfStay(), id: "L2b" };
    const result = evaluateValueCase({
      ...goldenCase(),
      levers: [lengthOfStay(), twin, premiumLabour()],
    });
    expect(lever(result, "L2").status).toBe("counted");
    expect(lever(result, "L2b")).toMatchObject({
      status: "overlap_excluded",
      countedInsteadBy: "L2",
    });
    expect(lever(result, "L1").status).toBe("counted");
  });

  it("ramps linearly and applies the latest phase-down", () => {
    const timing = {
      startMonth: 3,
      rampMonths: 4,
      paymentLagMonths: 0,
      phaseDown: [
        { fromMonth: 10, factor: 0.5 },
        { fromMonth: 20, factor: 0.25 },
      ],
    };
    expect(
      [1, 2, 3, 4, 5, 6, 7, 9, 10, 19, 20, 36].map((m) =>
        earnedFraction(timing, m),
      ),
    ).toEqual([0, 0, 0.25, 0.5, 0.75, 1, 1, 1, 0.5, 0.5, 0.25, 0.25]);
    expect(
      earnedFraction({ startMonth: 2, rampMonths: 0, paymentLagMonths: 0 }, 2),
    ).toBe(1);
  });

  it("drops cash whose lag lands it after the horizon", () => {
    const l1 = premiumLabour();
    l1.timing = { startMonth: 36, rampMonths: 0, paymentLagMonths: 1 };
    const result = evaluateValueCase({ ...goldenCase(), levers: [l1] });
    expect(result.economics?.monthlyCashCents.base).toEqual(zeros(36));
    expect(result.economics?.paybackMonth.base).toBeNull();
  });

  it("reports never-within-bounds in closed form and by bisection", () => {
    const l1 = premiumLabour();
    l1.driver.deltaBounds = { min: 0, max: 0.02 };
    const closed = evaluateValueCase({
      ...goldenCase(),
      levers: [l1, lengthOfStay()],
    });
    expect(breakeven(closed, "L1")).toMatchObject({
      status: "never_within_bounds",
      method: "closed_form",
      breakevenDelta: null,
      breakevenTarget: null,
    });
    const l2 = lengthOfStay();
    l2.driver.deltaBounds = { min: 0, max: 0.1 };
    const bisect = evaluateValueCase({
      ...goldenCase(),
      levers: [premiumLabour(), l2, edBoarding()],
    });
    expect(breakeven(bisect, "L2")).toMatchObject({
      status: "never_within_bounds",
      method: "bisection",
      breakevenDelta: null,
    });
  });

  it("reports met-without-lever in closed form, and defaults an increase bound to twice the plan", () => {
    const result = evaluateValueCase({
      ...goldenCase(),
      cost: { kind: "estimate", baseCents: 100_000_000 },
    });
    // others 67,200,000 × 3 ≥ 100,000,000
    expect(breakeven(result, "L1")).toMatchObject({
      status: "met_without_lever",
      method: "closed_form",
      breakevenDelta: 0,
      bounds: { min: 0, max: 0.24 },
    });
  });

  it("pairs low value with high cost in the pessimistic scenario", () => {
    const result = evaluateValueCase({
      ...goldenCase(),
      cost: {
        kind: "estimate",
        baseCents: 240_000_000,
        lowCents: 200_000_000,
        highCents: 300_000_000,
      },
    });
    expect(result.economics?.costCents).toEqual({
      low: 300_000_000,
      base: 240_000_000,
      high: 200_000_000,
    });
    expect(
      result.sensitivity
        .filter((r) => r.key === "case.cost")
        .map((r) => r.inputValue),
    ).toEqual([200_000_000, 300_000_000]);
  });
});

describe("value engine · confidence bands", () => {
  it("maps confidence to the declared bands, never narrower than declared", () => {
    expect([1, 2, 3, 4, 5].map(bandForConfidence)).toEqual([
      CONFIDENCE_1_BAND,
      CONFIDENCE_1_BAND,
      CONFIDENCE_3_BAND,
      CONFIDENCE_3_BAND,
      CONFIDENCE_5_BAND,
    ]);
    expect([CONFIDENCE_1_BAND, CONFIDENCE_3_BAND, CONFIDENCE_5_BAND]).toEqual([
      0.5, 0.25, 0.1,
    ]);
    expect([undefined, 0, 6, 2.5].map(bandForConfidence)).toEqual([
      null,
      null,
      null,
      null,
    ]);
  });

  it("caps a banded fraction at 1", () => {
    const l2 = lengthOfStay();
    l2.probability = { kind: "register", registerId: "V7" };
    const result = evaluateValueCase(
      { ...goldenCase(), levers: [l2] },
      {
        resolver: () => ({ value: 0.9, source: "register:V7", confidence: 1 }),
      },
    );
    const probability = lever(result, "L2").terms.high.find(
      (t) => t.cellRole === "probability",
    );
    expect(probability?.value).toBe(1);
    expect(
      lever(result, "L2").terms.low.find((t) => t.cellRole === "probability")
        ?.value,
    ).toBeCloseTo(0.45, 12);
  });
});

describe("value engine → expert-kernel ValueForecast", () => {
  const result = evaluateValueCase(goldenCase());
  const scores = {
    adoptionRisk: 0.5,
    dataReadiness: 0.5,
    processDependency: 0.5,
    integrationComplexity: 0.5,
    controlBurden: 0.5,
    sponsorStrength: 0.5,
  };

  it("carries engine cash per year with no haircut applied on top", () => {
    const forecast = valueForecastFromEngine(result, {
      moveName: "Synthetic move",
      haircutScores: scores,
    });
    const yearCents = (y: number) =>
      BASE_CASH.slice((y - 1) * 12, y * 12).reduce((a, b) => a + b, 0);
    expect(forecast.source).toBe("value_engine");
    expect(forecast.totalHaircut).toBe(0);
    expect(forecast.retainedFraction).toBe(1);
    expect(forecast.factors).toEqual([]);
    expect(forecast.monetisationBlocked).toBe(false);
    expect(forecast.curve.map((y) => y.netValue.point)).toEqual(
      [1, 2, 3].map((y) => yearCents(y) / 100),
    );
    expect(forecast.curve.map((y) => y.grossValue)).toEqual(
      forecast.curve.map((y) => y.netValue),
    );
    expect(forecast.totalNetValue.point).toBe(
      BASE_CASH.reduce((a, b) => a + b, 0) / 100,
    );
    expect(forecast.curve[2].adoptionFraction).toBe(1);
  });

  it("reports the kernel haircut as a cross-check only", () => {
    const forecast = valueForecastFromEngine(result, {
      moveName: "Synthetic move",
      haircutScores: scores,
    });
    expect(forecast.kernelCrossCheck?.applied).toBe(false);
    expect(forecast.kernelCrossCheck?.totalHaircut).toBe(0.5);
    expect(forecast.kernelCrossCheck?.netIfApplied.point).toBeLessThan(
      forecast.totalNetValue.point,
    );
    expect(
      valueForecastFromEngine(result, { moveName: "m" }).kernelCrossCheck,
    ).toBeNull();
  });

  it("maps a blocked case to a blocked monetisation with a zero curve", () => {
    const blocked = evaluateValueCase({ ...goldenCase(), levers: [] });
    const forecast = valueForecastFromEngine(blocked, {
      moveName: "m",
      haircutScores: scores,
    });
    expect(forecast.monetisationBlocked).toBe(true);
    expect(forecast.curve.map((y) => y.netValue.point)).toEqual([0, 0, 0]);
    expect(forecast.kernelCrossCheck).toBeNull();
  });
});

describe("value engine · boundaries", () => {
  const only = (...levers: Lever[]): ValueCase => ({ ...goldenCase(), levers });
  const ruleCodes = (model: ValueCase) =>
    evaluateValueCase(model).levers.flatMap((l) =>
      l.ruleViolations.map((v) => v.code),
    );

  it("accepts a ten-year horizon", () => {
    const result = evaluateValueCase({ ...goldenCase(), horizonYears: 10 });
    expect(result.status).toBe("evaluated");
    expect(result.economics?.monthlyCashCents.base).toHaveLength(120);
  });

  it("refuses a phase-down factor above 1 and a negative ramp or lag", () => {
    for (const timing of [
      {
        startMonth: 1,
        rampMonths: 0,
        paymentLagMonths: 0,
        phaseDown: [{ fromMonth: 2, factor: 1.5 }],
      },
      { startMonth: 1, rampMonths: -1, paymentLagMonths: 0 },
      { startMonth: 1, rampMonths: 0, paymentLagMonths: -1 },
    ]) {
      expect(ruleCodes(only({ ...premiumLabour(), timing }))).toEqual([
        "invalid_timing",
      ]);
    }
  });

  it("applies a phase-down to the cash curve", () => {
    const l1 = premiumLabour();
    l1.timing = {
      startMonth: 1,
      rampMonths: 0,
      paymentLagMonths: 0,
      phaseDown: [{ fromMonth: 13, factor: 0.5 }],
    };
    const cash = evaluateValueCase(only(l1)).economics!.monthlyCashCents.base;
    expect(cash[11]).toBe(3_840_000);
    expect(cash[12]).toBe(1_920_000);
  });

  it("never lets a $0 hours lever take its overlap group, even as declared primary", () => {
    const hours = {
      ...documentationHours(),
      overlapGroup: "bed capacity",
      overlapPrimary: true,
    };
    const result = evaluateValueCase(only(lengthOfStay(), hours));
    expect(lever(result, "L2").status).toBe("counted");
    expect(lever(result, "L4").status).toBe("zero_no_release_path");
  });

  it("keeps an overlap-excluded risk lever out of the avoided-risk total", () => {
    const riskA: Lever = {
      ...premiumLabour(),
      id: "R1",
      conversion: "risk_avoided",
      overlapGroup: "penalty",
    };
    const riskB: Lever = { ...riskA, id: "R2", attribution: lit(0.3) };
    const result = evaluateValueCase(only(lengthOfStay(), riskA, riskB));
    expect(lever(result, "R2").status).toBe("overlap_excluded");
    expect(result.economics?.riskAvoidedAnnualCents.base).toBe(46_080_000);
  });

  it("derives the driver-delta range from baseline and target ranges, never below 0", () => {
    const l2 = lengthOfStay();
    l2.driver.baseline = lit(5.0, { low: 4.8, high: 5.2 });
    l2.driver.target = lit(4.7, { low: 4.5, high: 4.9 });
    // decrease: combos 4.8−4.5=0.3, 4.8−4.9=−0.1, 5.2−4.5=0.7, 5.2−4.9=0.3 → low max(0, −0.1)=0, high 0.7
    expect(lever(evaluateValueCase(only(l2)), "L2").driverDelta).toEqual({
      low: 0,
      base: 0.3,
      high: 0.7,
    });
  });

  it("prefers the ref's own range over the resolver's", () => {
    const l1 = premiumLabour();
    l1.terms[0] = {
      role: "base",
      label: "spend",
      ref: {
        kind: "register",
        registerId: "V3",
        range: { low: 7_000_000, high: 9_000_000 },
      },
    };
    const result = evaluateValueCase(only(l1), {
      resolver: () => ({
        value: 8_000_000,
        source: "register:V3",
        range: { low: 1, high: 10_000_000 },
        confidence: 1,
      }),
    });
    expect(lever(result, "L1").annualCents).toEqual({
      low: 40_320_000,
      base: 46_080_000,
      high: 51_840_000,
    });
  });

  it("uses the resolver's range before a confidence band", () => {
    const l1 = premiumLabour();
    l1.terms[0] = {
      role: "base",
      label: "spend",
      ref: { kind: "register", registerId: "V3" },
    };
    const result = evaluateValueCase(only(l1), {
      resolver: () => ({
        value: 8_000_000,
        source: "register:V3",
        range: { low: 7_000_000, high: 9_000_000 },
        confidence: 1,
      }),
    });
    expect(lever(result, "L1").annualCents?.low).toBe(40_320_000);
  });

  it("discounts the low scenario at the base rate on its own cash", () => {
    // L1 low: 40,320,000 / 12 = 3,360,000 a month; ramp k/6 = 560,000 × k; lag 2.
    const l1Low = [
      ...zeros(5),
      560_000,
      1_120_000,
      1_680_000,
      2_240_000,
      2_800_000,
      ...new Array<number>(26).fill(3_360_000),
    ];
    const lowCash = l1Low.map((v, i) => v + L2_CASH[i]);
    const result = evaluateValueCase(goldenCase());
    expect(result.economics?.monthlyCashCents.low).toEqual(lowCash);
    expect(result.economics?.npvCents.low).toBe(
      npvByHand(lowCash, 0.08, 240_000_000),
    );
  });

  it("refuses a non-finite input", () => {
    for (const value of [Number.POSITIVE_INFINITY, Number.NaN]) {
      const l1 = premiumLabour();
      l1.terms[0] = { role: "base", label: "spend", ref: lit(value) };
      expect(lever(evaluateValueCase(only(l1)), "L1").inputIssues).toEqual([
        { key: "L1.term[0]", reason: "non_finite" },
      ]);
    }
  });

  it("refuses negative delta bounds", () => {
    const l1 = premiumLabour();
    l1.driver.deltaBounds = { min: -0.1, max: 0.5 };
    expect(ruleCodes(only(l1))).toEqual(["invalid_delta_bounds"]);
  });

  it("blocks on an unresolved discount rate alone", () => {
    const result = evaluateValueCase({
      ...goldenCase(),
      discountRate: { kind: "register", registerId: "V1" },
    });
    expect(result.status).toBe("blocked");
    expect(result.caseInputIssues).toEqual([
      { key: "case.discount_rate", reason: "unresolved" },
    ]);
  });

  it("refuses a negative or fractional estimate cost", () => {
    expect(
      evaluateValueCase({
        ...goldenCase(),
        cost: { kind: "estimate", baseCents: -1 },
      }).caseInputIssues,
    ).toEqual([{ key: "case.cost", reason: "negative" }]);
    expect(
      evaluateValueCase({
        ...goldenCase(),
        cost: { kind: "estimate", baseCents: 1.5 },
      }).caseInputIssues,
    ).toEqual([{ key: "case.cost", reason: "non_finite" }]);
  });

  it("is met without the lever when the others exactly cover the cost", () => {
    // others 67,200,000 × 3 = 201,600,000
    const result = evaluateValueCase({
      ...goldenCase(),
      cost: { kind: "estimate", baseCents: 201_600_000 },
    });
    expect(breakeven(result, "L1")).toMatchObject({
      status: "met_without_lever",
      breakevenDelta: 0,
    });
  });

  it("solves at exactly the upper bound", () => {
    // (478,080,000 / 3 − 67,200,000) / 384,000,000 = 0.24 = 2 × the planned 0.12
    const result = evaluateValueCase({
      ...goldenCase(),
      cost: { kind: "estimate", baseCents: 478_080_000 },
    });
    expect(breakeven(result, "L1")).toMatchObject({
      status: "solved",
      breakevenDelta: 0.24,
    });
  });

  it("has no breakeven for a lever with no driver term", () => {
    const withShare = premiumLabour();
    withShare.terms = [
      { role: "base", label: "spend", ref: lit(1_000) },
      { role: "share", label: "share no longer bought", ref: lit(0.1) },
    ];
    expect(breakeven(evaluateValueCase(only(withShare)), "L1").status).toBe(
      "not_applicable",
    );
  });

  it("pays back in the month cumulative cash first equals the cost, and at once with no cost", () => {
    const l4 = {
      ...documentationHours(),
      releasePath: {
        kind: "role_released" as const,
        releasedCost: lit(150_000),
      },
    };
    // 900,000 a month: month 10 reaches 9,000,000 exactly
    expect(
      evaluateValueCase({
        ...only(l4),
        cost: { kind: "estimate", baseCents: 9_000_000 },
      }).economics?.paybackMonth.base,
    ).toBe(10);
    expect(
      evaluateValueCase({
        ...only(l4),
        cost: { kind: "estimate", baseCents: 0 },
      }).economics?.paybackMonth.base,
    ).toBe(0);
  });

  it("varies a ranged release cost in sensitivity", () => {
    const l4 = {
      ...documentationHours(),
      releasePath: {
        kind: "role_released" as const,
        releasedCost: lit(150_000, { low: 100_000, high: 200_000 }),
      },
    };
    const rows = evaluateValueCase(only(l4)).sensitivity.filter(
      (r) => r.key === "L4.release_cost",
    );
    // 100,000 × 0.72 × 100 and 200,000 × 0.72 × 100
    expect(rows.map((r) => r.annualCashCents)).toEqual([7_200_000, 14_400_000]);
  });

  it("reports a non-money metric only for non-cash levers", () => {
    expect(
      lever(evaluateValueCase(goldenCase()), "L1").nonMoneyMetric,
    ).toBeNull();
  });

  it("flags an open discount-rate row for validation", () => {
    const result = evaluateValueCase(
      { ...goldenCase(), discountRate: { kind: "register", registerId: "V1" } },
      {
        resolver: () => ({
          value: 0.08,
          source: "register:V1",
          status: "open",
        }),
      },
    );
    expect(result.mustValidate).toEqual(["case.discount_rate"]);
  });

  it("evaluates mixed or empty term lists honestly", () => {
    expect(evaluateValueFormulaTerms([])).toBeNull();
    expect(() =>
      evaluateValueFormulaTerms([
        { label: "a", value: 1, source: "engine", cellRole: "addend" },
        { label: "b", value: 2, source: "engine", cellRole: "base" },
      ]),
    ).toThrow(/mixes/);
    expect(
      Object.is(
        evaluateValueFormulaTerms([
          { label: "a", value: -0.4, source: "engine", cellRole: "addend" },
        ]),
        0,
      ),
    ).toBe(true);
  });
});

describe("value engine → ValueForecast · edges", () => {
  it("carries low and high per year", () => {
    const forecast = valueForecastFromEngine(evaluateValueCase(goldenCase()), {
      moveName: "m",
    });
    const y1 = (cash: number[]) =>
      cash.slice(0, 12).reduce((a, b) => a + b, 0) / 100;
    const result = evaluateValueCase(goldenCase());
    expect(forecast.curve[0].netValue).toEqual({
      low: y1(result.economics!.monthlyCashCents.low),
      point: y1(BASE_CASH),
      high: y1(result.economics!.monthlyCashCents.high),
    });
    expect(forecast.totalNetValue.low).toBeLessThan(
      forecast.totalNetValue.point,
    );
    expect(forecast.totalNetValue.high).toBeGreaterThan(
      forecast.totalNetValue.point,
    );
  });

  it("caps adoption at 1 when monthly rounding lifts a year above the annual figure", () => {
    // annual 106 cents → round(106 / 12) = 9 a month → 108 in a year
    const tiny: Lever = {
      ...premiumLabour(),
      terms: [
        { role: "base", label: "spend", ref: lit(1.06) },
        { role: "share", label: "share no longer bought", ref: lit(1) },
      ],
      attribution: lit(1),
      probability: lit(1),
      timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
    };
    const result = evaluateValueCase({
      ...goldenCase(),
      levers: [tiny],
      cost: { kind: "estimate", baseCents: 1 },
    });
    expect(result.economics?.annualCashCents.base).toBe(106);
    const forecast = valueForecastFromEngine(result, {
      moveName: "m",
      haircutScores: {
        adoptionRisk: 1,
        dataReadiness: 1,
        processDependency: 1,
        integrationComplexity: 1,
        controlBurden: 1,
        sponsorStrength: 1,
      },
    });
    expect(forecast.curve[0].adoptionFraction).toBe(1);
    expect(forecast.curve[0].netValue.point).toBe(1.08);
  });
});
