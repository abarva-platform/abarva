/**
 * Moves value engine — register inputs (increment 2).
 *
 * The golden case is SYNTHETIC: every number is invented. Every expected
 * figure is worked by hand in the comments; the engine never produces its own
 * expectation.
 *
 * What is pinned, and why each case can fail:
 *   - every register status resolves by the register's own rule: confirmed and
 *     corrected count on their answer, open counts but must be validated,
 *     proposed/rejected/superseded block the lever with the status NAMED;
 *   - a missing row and a counted row with no number block, never as zero;
 *   - the default band comes from the row's confidence (1 → ±50%, 3 → ±25%,
 *     5 → ±10%), and an input's own range still wins;
 *   - the register is read once, through the injected store read, and not at
 *     all when the case reads no register row; a failed read is thrown;
 *   - a blocked case names each blocking input and its row, with no figure.
 */
import { evaluateValueCase } from "@/lib/programs/value-engine";
import { evaluateValueFormulaTerms } from "@/lib/programs/value-engine/formula-terms";
import {
  buildRegisterInputs,
  loadRegisterInputs,
  registerInputRefs,
} from "@/lib/programs/value-engine/register-inputs";
import {
  CONFIDENCE_1_BAND,
  CONFIDENCE_3_BAND,
  CONFIDENCE_5_BAND,
} from "@/lib/programs/value-engine/resolve-inputs";
import { blockedInputs } from "@/lib/programs/value-engine/value-case-view";
import type { CostBasis } from "@/lib/programs/value-engine/cost-basis";
import type {
  AssumptionRecord,
  AssumptionStatus,
  RegisterConfidence,
} from "@/lib/programs/assumption-register/model";
import type {
  InputRange,
  Lever,
  LiteralInputRef,
  RegisterInputRef,
  ValueCase,
  ValueCaseResult,
} from "@/lib/programs/value-engine/types";

const lit = (value: number): LiteralInputRef => ({
  kind: "literal",
  value,
  source: "synthetic",
});
const reg = (registerId: string, range?: InputRange): RegisterInputRef => ({
  kind: "register",
  registerId,
  ...(range ? { range } : {}),
});

let rowSeq = 0;
function row(
  registerId: string,
  status: AssumptionStatus,
  values: {
    workingValue?: number | null;
    answerValue?: number | null;
    confidence?: RegisterConfidence;
    supersededBy?: string | null;
    id?: string;
  } = {},
): AssumptionRecord {
  rowSeq += 1;
  return {
    id: values.id ?? `row-${rowSeq}`,
    tenantKey: "synthetic",
    programId: "move-1",
    area: "value",
    seq: Number(registerId.replace(/\D/g, "")),
    registerId,
    statement: `Synthetic assumption ${registerId}`,
    whyItMatters: null,
    workingFigure: null,
    workingValue: values.workingValue ?? null,
    unit: null,
    source: "Synthetic workshop",
    confidence: values.confidence ?? 3,
    ownerRole: "Finance office",
    ownerName: null,
    ownerPersonId: null,
    status,
    origin: "team",
    answer: null,
    answerFigure: null,
    answerValue: values.answerValue ?? null,
    answerSource: null,
    answeredByUserId: null,
    answeredAt: null,
    acceptedByUserId: null,
    acceptedAt: null,
    supersededBy: values.supersededBy ?? null,
    raisedPhase: 4,
    raisedStepId: null,
    evidenceIds: [],
    charterSectionKey: null,
    charterValueRevision: null,
    revision: 1,
    createdByUserId: "user-1",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
}

// L1 — premium labour, cost_reduction, register-backed.
//   spend base  V1 confirmed, answer 8,000,000, confidence 5 → ±10%:
//               low 7,200,000, high 8,800,000
//   reduction   V2 open, working 0.12, confidence 3 → ±25%: low 0.09, high 0.15
//   annual base = 8,000,000 × 0.12 × 0.6 × 0.8 = 460,800 dollars = 46,080,000 cents
//   annual low  = 7,200,000 × 0.09 × 0.48     = 311,040 dollars = 31,104,000 cents
//   annual high = 8,800,000 × 0.15 × 0.48     = 633,600 dollars = 63,360,000 cents
function premiumLabour(overrides: Partial<Lever> = {}): Lever {
  return {
    id: "L1",
    name: "Premium labour",
    conversion: "cost_reduction",
    driver: {
      name: "premium labour spend reduced",
      unit: "share of spend",
      direction: "increase",
      baseline: lit(0),
      target: reg("V2"),
    },
    terms: [
      {
        role: "base",
        label: "annual premium labour spend ($)",
        ref: reg("V1"),
      },
      { role: "driver_delta", label: "share of spend no longer bought" },
    ],
    attribution: lit(0.6),
    probability: lit(0.8),
    timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
    ...overrides,
  };
}

function goldenCase(levers: Lever[] = [premiumLabour()]): ValueCase {
  return {
    levers,
    horizonYears: 1,
    // V3 corrected: the answer 0.08 counts, never the wrong working 0.10.
    discountRate: reg("V3"),
    cost: {
      kind: "estimate",
      lowCents: 13_500_000,
      baseCents: 15_000_000,
      highCents: 18_000_000,
    },
  };
}

function goldenRows(): AssumptionRecord[] {
  return [
    row("V1", "confirmed", {
      workingValue: 7_500_000,
      answerValue: 8_000_000,
      confidence: 5,
    }),
    row("V2", "open", { workingValue: 0.12, confidence: 3 }),
    row("V3", "corrected", {
      workingValue: 0.1,
      answerValue: 0.08,
      confidence: 1,
    }),
  ];
}

function evaluate(model: ValueCase, rows: AssumptionRecord[]) {
  const inputs = buildRegisterInputs(model, rows);
  return {
    inputs,
    result: evaluateValueCase(model, { resolver: inputs.resolver }),
  };
}

function only<T>(items: readonly T[]): T {
  expect(items).toHaveLength(1);
  return items[0];
}

const RESOLVED_BASIS: CostBasis = {
  status: "resolved",
  basis: "estimate_model",
  source: "estimate_model:internal",
  deliveryModel: "internal",
  cents: { low: 13_500_000, base: 15_000_000, high: 18_000_000 },
  planningBenchmark: null,
};

describe("golden case — spend base from a confirmed row, reduction from an open row", () => {
  const { inputs, result } = evaluate(goldenCase(), goldenRows());
  const l1 = result.levers[0];

  it("evaluates, and is ready, with the open row flagged to validate", () => {
    expect(result.status).toBe("evaluated");
    expect(result.readyForApproval).toBe(true);
    expect(l1.status).toBe("counted");
    // Both driver keys come from the open row: the target directly, the delta through it.
    expect(l1.mustValidate).toEqual(["L1.driver.target", "L1.driver"]);
    expect(result.mustValidate).toEqual(["L1.driver.target", "L1.driver"]);
  });

  it("annual low/base/high come from the rows' values and confidence bands", () => {
    expect(l1.annualCents).toEqual({
      low: 31_104_000,
      base: 46_080_000,
      high: 63_360_000,
    });
  });

  it("the formula terms name each register row and reconcile exactly", () => {
    const sources = l1.terms.base.map((term) => term.source);
    expect(sources).toContain("register:V1");
    expect(sources.some((s) => s.includes("register:V2"))).toBe(true);
    for (const scenario of ["low", "base", "high"] as const) {
      const terms = l1.terms[scenario];
      expect(evaluateValueFormulaTerms(terms)).toBe(l1.annualCents![scenario]);
    }
  });

  it("a corrected discount rate counts on its answer, not the working value", () => {
    expect(result.economics!.discountRate).toBe(0.08);
  });

  it("payback and NPV follow from the register-backed cash", () => {
    // Monthly cash = annual / 12 (start 1, no ramp, no lag):
    //   base 3,840,000 → cumulative ≥ 15,000,000 in month 4;
    //   low  2,592,000 vs the HIGH cost 18,000,000 → month 7;
    //   high 5,280,000 vs the LOW cost 13,500,000 → month 3.
    expect(result.economics!.paybackMonth).toEqual({
      low: 7,
      base: 4,
      high: 3,
    });
    let discounted = 0;
    for (let m = 1; m <= 12; m += 1) discounted += 3_840_000 / 1.08 ** (m / 12);
    expect(result.economics!.npvCents.base).toBe(
      Math.round(discounted - 15_000_000),
    );
  });

  it("breakeven solves the reduction share the cost needs", () => {
    // 8,000,000 × d × 0.48 × 100 cents × 1 year = 15,000,000 → d = 0.0390625.
    const l1Breakeven = only(result.breakeven);
    expect(l1Breakeven.status).toBe("solved");
    expect(l1Breakeven.breakevenDelta).toBeCloseTo(0.0390625, 9);
  });

  it("sensitivity reaches every register-backed input at its banded ends", () => {
    const rate = result.sensitivity.filter(
      (r) => r.key === "case.discount_rate",
    );
    // Confidence 1 → ±50% around the corrected 0.08.
    expect(rate.map((r) => r.inputValue)).toEqual([
      0.08 * (1 - CONFIDENCE_1_BAND),
      0.08 * (1 + CONFIDENCE_1_BAND),
    ]);
  });

  it("reports how each register input resolved", () => {
    expect(
      inputs.resolutions.map(({ key, registerId, outcome, status }) => ({
        key,
        registerId,
        outcome,
        status,
      })),
    ).toEqual([
      {
        key: "L1.driver.target",
        registerId: "V2",
        outcome: "must_validate",
        status: "open",
      },
      {
        key: "L1.term[0]",
        registerId: "V1",
        outcome: "counted",
        status: "confirmed",
      },
      {
        key: "case.discount_rate",
        registerId: "V3",
        outcome: "counted",
        status: "corrected",
      },
    ]);
    expect(inputs.resolutions[0].detail).toBe(
      "L1.driver.target reads register row V2, which is open: it counts, but its figure must be validated before the case is approved.",
    );
    expect(inputs.resolutions[1].detail).toBe(
      "L1.term[0] reads register row V1, which is confirmed: it counts.",
    );
    expect(inputs.resolutions[2].detail).toBe(
      "case.discount_rate reads register row V3, which is corrected: it counts.",
    );
  });

  it("blocks on nothing", () => {
    expect(blockedInputs(result, inputs.resolutions, RESOLVED_BASIS)).toEqual(
      [],
    );
  });
});

describe("default ranges from confidence", () => {
  // A lever whose only register input is the spend base, so the band shows
  // directly in the annual figure: 1,000,000 × 0.1 × 1 × 1 = 100,000 dollars.
  function bandCase(range?: InputRange): ValueCase {
    return {
      levers: [
        premiumLabour({
          driver: {
            name: "spend reduced",
            unit: "share",
            direction: "increase",
            baseline: lit(0),
            target: lit(0.1),
          },
          terms: [
            { role: "base", label: "spend ($)", ref: reg("V1", range) },
            { role: "driver_delta", label: "share" },
          ],
          attribution: lit(1),
          probability: lit(1),
        }),
      ],
      horizonYears: 1,
      discountRate: lit(0.08),
      cost: { kind: "estimate", baseCents: 1 },
    };
  }

  it.each([
    [1 as const, CONFIDENCE_1_BAND, 0.5],
    [3 as const, CONFIDENCE_3_BAND, 0.25],
    [5 as const, CONFIDENCE_5_BAND, 0.1],
  ])("confidence %s gives a ±%s band (±%s)", (confidence, band, expected) => {
    expect(band).toBe(expected);
    const { result } = evaluate(bandCase(), [
      row("V1", "confirmed", { answerValue: 1_000_000, confidence }),
    ]);
    expect(result.levers[0].annualCents).toEqual({
      low: Math.round(1_000_000 * (1 - expected) * 0.1 * 100),
      base: 10_000_000,
      high: Math.round(1_000_000 * (1 + expected) * 0.1 * 100),
    });
  });

  it("an input's own range wins over the confidence band", () => {
    const { result } = evaluate(bandCase({ low: 900_000, high: 1_200_000 }), [
      row("V1", "confirmed", { answerValue: 1_000_000, confidence: 1 }),
    ]);
    expect(result.levers[0].annualCents).toEqual({
      low: 9_000_000,
      base: 10_000_000,
      high: 12_000_000,
    });
  });
});

describe("every register status", () => {
  it.each([
    [
      "proposed",
      "it is only proposed, so it does not count until a person accepts it.",
    ],
    [
      "rejected",
      "it was rejected, so it does not count; point this input at another row.",
    ],
    [
      "superseded",
      "it was superseded, so it does not count; point this input at the row that replaced it.",
    ],
  ] as const)(
    "a %s row blocks its lever as an unresolved input, naming the status",
    (status, remedy) => {
      const rows = goldenRows().map((r) =>
        r.registerId === "V1" ? { ...r, status } : r,
      );
      const { inputs, result } = evaluate(goldenCase(), rows);
      expect(result.status).toBe("blocked");
      expect(result.economics).toBeNull();
      const l1 = result.levers[0];
      expect(l1.status).toBe("blocked_unresolved_input");
      expect(l1.annualCents).toBeNull();
      expect(l1.inputIssues).toEqual([
        { key: "L1.term[0]", reason: "not_counted" },
      ]);
      const resolution = inputs.resolutions.find((r) => r.registerId === "V1")!;
      expect(resolution).toMatchObject({ outcome: "not_counted", status });
      expect(resolution.detail).toBe(
        `L1.term[0] reads register row V1: ${remedy}`,
      );
      const blocked = only(
        blockedInputs(result, inputs.resolutions, RESOLVED_BASIS),
      );
      expect(blocked).toEqual({
        key: "L1.term[0]",
        reason: "not_counted",
        registerId: "V1",
        detail: resolution.detail,
      });
      // Never a number in its place.
      expect(blocked.detail).not.toMatch(/\d{3}/);
    },
  );

  it("a superseded row names the row that replaced it", () => {
    const rows = [
      ...goldenRows().map((r) =>
        r.registerId === "V1"
          ? { ...r, status: "superseded" as const, supersededBy: "row-v9" }
          : r,
      ),
      row("V9", "open", { workingValue: 8_100_000, id: "row-v9" }),
    ];
    const { inputs } = evaluate(goldenCase(), rows);
    expect(inputs.resolutions.find((r) => r.registerId === "V1")!.detail).toBe(
      "L1.term[0] reads register row V1: it was superseded, so it does not count; point this input at the row that replaced it (V9).",
    );
  });

  it("a missing row blocks as unresolved and says it does not exist", () => {
    const rows = goldenRows().filter((r) => r.registerId !== "V1");
    const { inputs, result } = evaluate(goldenCase(), rows);
    expect(result.levers[0].status).toBe("blocked_unresolved_input");
    expect(result.levers[0].inputIssues).toEqual([
      { key: "L1.term[0]", reason: "unresolved" },
    ]);
    const resolution = inputs.resolutions.find((r) => r.registerId === "V1")!;
    expect(resolution).toMatchObject({ outcome: "missing", status: null });
    expect(
      only(blockedInputs(result, inputs.resolutions, RESOLVED_BASIS)),
    ).toEqual({
      key: "L1.term[0]",
      reason: "unresolved",
      registerId: "V1",
      detail:
        "L1.term[0] reads register row V1, which does not exist on this Move's register.",
    });
  });

  it.each(["open", "confirmed", "corrected"] as const)(
    "a %s row with no numeric value blocks as unresolved, never as zero",
    (status) => {
      const rows = goldenRows().map((r) =>
        r.registerId === "V1"
          ? { ...r, status, workingValue: null, answerValue: null }
          : r,
      );
      const { inputs, result } = evaluate(goldenCase(), rows);
      expect(result.levers[0].status).toBe("blocked_unresolved_input");
      expect(result.levers[0].inputIssues).toEqual([
        { key: "L1.term[0]", reason: "unresolved" },
      ]);
      const resolution = inputs.resolutions.find((r) => r.registerId === "V1")!;
      expect(resolution).toMatchObject({ outcome: "no_value", status });
      expect(resolution.detail).toBe(
        `L1.term[0] reads register row V1, which is ${status} but has no numeric value to count; record its figure as a number.`,
      );
    },
  );

  it("a not-counted discount rate blocks the CASE and names the row", () => {
    const rows = goldenRows().map((r) =>
      r.registerId === "V3" ? { ...r, status: "proposed" as const } : r,
    );
    const { inputs, result } = evaluate(goldenCase(), rows);
    expect(result.status).toBe("blocked");
    expect(result.caseInputIssues).toEqual([
      { key: "case.discount_rate", reason: "not_counted" },
    ]);
    expect(
      only(blockedInputs(result, inputs.resolutions, RESOLVED_BASIS)),
    ).toMatchObject({ key: "case.discount_rate", registerId: "V3" });
  });

  it("a release path on a not-counted row leaves hours at $0, unconfirmed", () => {
    const hours: Lever = {
      id: "L2",
      name: "Documentation hours",
      conversion: "non_cash",
      driver: {
        name: "documentation hours",
        unit: "hours",
        direction: "decrease",
        baseline: lit(100),
        target: lit(80),
      },
      terms: [{ role: "driver_delta" }],
      attribution: lit(1),
      probability: lit(1),
      timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
      releasePath: { kind: "role_released", releasedCost: reg("V4") },
    };
    const { inputs, result } = evaluate(goldenCase([premiumLabour(), hours]), [
      ...goldenRows(),
      row("V4", "proposed", { workingValue: 90_000 }),
    ]);
    expect(result.levers[1].status).toBe("zero_release_unconfirmed");
    expect(
      inputs.resolutions.find((r) => r.key === "L2.release_cost"),
    ).toMatchObject({ outcome: "not_counted", status: "proposed" });
  });

  it("an open row out of its domain names the row and the rule, no figure", () => {
    // A share stored as 12 (percent) where the engine needs 0.12.
    const rows = goldenRows().map((r) =>
      r.registerId === "V2" ? { ...r, workingValue: 12 } : r,
    );
    const lever = premiumLabour({ attribution: reg("V2") });
    const { inputs, result } = evaluate(goldenCase([lever]), rows);
    const blocked = blockedInputs(result, inputs.resolutions, RESOLVED_BASIS);
    expect(blocked).toContainEqual({
      key: "L1.attribution",
      reason: "fraction_out_of_bounds",
      registerId: "V2",
      detail:
        "L1.attribution (register row V2): the value must be a fraction from 0 to 1.",
    });
  });

  it("a literal input that blocks names no register row", () => {
    const lever = premiumLabour({ probability: lit(-1) });
    const { inputs, result } = evaluate(goldenCase([lever]), goldenRows());
    expect(
      only(blockedInputs(result, inputs.resolutions, RESOLVED_BASIS)),
    ).toEqual({
      key: "L1.probability",
      reason: "negative",
      registerId: null,
      detail:
        "L1.probability: the value is negative where only zero or more is allowed.",
    });
  });

  it("a blocked cost basis names its own reason for the case cost", () => {
    const model: ValueCase = {
      ...goldenCase(),
      cost: { kind: "rom", snapshotId: "cost-basis:unresolved" },
    };
    const { inputs, result } = evaluate(model, goldenRows());
    const basis: CostBasis = {
      status: "blocked",
      reason: "estimate_absent",
      detail: "No estimate.",
      planningBenchmark: null,
    };
    expect(only(blockedInputs(result, inputs.resolutions, basis))).toEqual({
      key: "case.cost",
      reason: "unresolved",
      registerId: null,
      detail: "No estimate.",
    });
    // A RESOLVED basis never lends its sentence to an unresolved cost.
    expect(
      only(blockedInputs(result, inputs.resolutions, RESOLVED_BASIS)).detail,
    ).toBe(
      "case.cost: the input could not be resolved, so it gives no figure.",
    );
  });
});

describe("a blocked cost basis lends its sentence ONLY to the case cost", () => {
  it("a blocked row beside it keeps its own sentence", () => {
    const model: ValueCase = {
      ...goldenCase(),
      cost: { kind: "rom", snapshotId: "cost-basis:unresolved" },
    };
    const rows = goldenRows().map((r) =>
      r.registerId === "V1" ? { ...r, status: "rejected" as const } : r,
    );
    const { inputs, result } = evaluate(model, rows);
    const basis: CostBasis = {
      status: "blocked",
      reason: "estimate_absent",
      detail: "No estimate.",
      planningBenchmark: null,
    };
    expect(
      blockedInputs(result, inputs.resolutions, basis).map((b) => [
        b.key,
        b.detail,
      ]),
    ).toEqual([
      [
        "L1.term[0]",
        "L1.term[0] reads register row V1: it was rejected, so it does not count; point this input at another row.",
      ],
      ["case.cost", "No estimate."],
    ]);
  });
});

describe("the resolver", () => {
  it("answers no ROM ref, and a not-counted row never with a usable number", () => {
    const { resolver } = buildRegisterInputs(goldenCase(), [
      row("V5", "rejected", { workingValue: 10 }),
    ]);
    expect(resolver({ kind: "rom", snapshotId: "V5" })).toBeNull();
    const rejected = resolver({ kind: "register", registerId: "V5" });
    expect(rejected).toMatchObject({
      source: "register:V5",
      status: "rejected",
    });
    expect(Number.isNaN(rejected!.value)).toBe(true);
  });

  it("hands the engine the row's confidence and counted status", () => {
    const { resolver } = buildRegisterInputs(goldenCase(), goldenRows());
    expect(resolver({ kind: "register", registerId: "V1" })).toEqual({
      value: 8_000_000,
      source: "register:V1",
      confidence: 5,
      status: "confirmed",
    });
  });
});

describe("register input refs", () => {
  it("keys every register-backed input as the engine does, and nothing else", () => {
    const lever = premiumLabour({
      driver: {
        name: "d",
        unit: "u",
        direction: "increase",
        baseline: reg("V6"),
        target: reg("V2"),
      },
      terms: [
        { role: "driver_delta" },
        { role: "base", label: "spend", ref: reg("V1") },
        { role: "share", label: "share", ref: lit(0.5) },
      ],
      attribution: reg("V7"),
      probability: reg("V8"),
      releasePath: { kind: "role_released", releasedCost: reg("V9") },
    });
    expect(registerInputRefs(goldenCase([lever]))).toEqual([
      { key: "L1.driver.baseline", registerId: "V6" },
      { key: "L1.driver.target", registerId: "V2" },
      { key: "L1.term[1]", registerId: "V1" },
      { key: "L1.attribution", registerId: "V7" },
      { key: "L1.probability", registerId: "V8" },
      { key: "L1.release_cost", registerId: "V9" },
      { key: "case.discount_rate", registerId: "V3" },
    ]);
  });
});

describe("loading the register", () => {
  it("reads the register once, through the injected store read", async () => {
    const listAssumptions = jest.fn(async () => goldenRows());
    const ctx = { clientId: "c" };
    const inputs = await loadRegisterInputs(goldenCase(), {
      ctx,
      programId: "move-1",
      listAssumptions,
    });
    expect(listAssumptions).toHaveBeenCalledTimes(1);
    expect(listAssumptions).toHaveBeenCalledWith(ctx, "move-1");
    const result: ValueCaseResult = evaluateValueCase(goldenCase(), {
      resolver: inputs.resolver,
    });
    expect(result.levers[0].annualCents?.base).toBe(46_080_000);
  });

  it("does not read the register when the case reads no row", async () => {
    const listAssumptions = jest.fn(async () => goldenRows());
    const model: ValueCase = { ...goldenCase(), discountRate: lit(0.08) };
    model.levers = [
      premiumLabour({
        driver: { ...premiumLabour().driver, target: lit(0.12) },
        terms: [
          { role: "base", label: "spend", ref: lit(8_000_000) },
          { role: "driver_delta" },
        ],
      }),
    ];
    const inputs = await loadRegisterInputs(model, {
      ctx: {},
      programId: "move-1",
      listAssumptions,
    });
    expect(listAssumptions).not.toHaveBeenCalled();
    expect(inputs.resolutions).toEqual([]);
  });

  it("a failed read is thrown, never folded into an empty register", async () => {
    await expect(
      loadRegisterInputs(goldenCase(), {
        ctx: {},
        programId: "move-1",
        listAssumptions: async () => {
          throw new Error("read failed");
        },
      }),
    ).rejects.toThrow("read failed");
  });
});
