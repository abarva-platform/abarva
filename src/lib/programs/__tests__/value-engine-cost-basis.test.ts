/**
 * Moves value engine — the case cost basis (increment 2).
 *
 * SYNTHETIC numbers throughout, worked by hand.
 *
 * What is pinned, and why each case can fail:
 *   - precedence: an approved ROM snapshot (through an injected loader) wins
 *     over the reviewed P4 estimate, which wins over nothing; a ROM loader
 *     that finds no snapshot falls through to the estimate;
 *   - an unreadable approved snapshot BLOCKS — it never silently falls back;
 *   - the estimate counts only when reviewed, in US dollars, for the delivery
 *     model the case names (no default is taken);
 *   - every blocked reason carries a figure-free sentence, and a blocked basis
 *     hands the engine a cost it cannot resolve, so the case shows no figure;
 *   - a kernel cost figure is only ever a labelled, uncounted cross-check, and
 *     the module never reaches for the kernel's default rate card.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { evaluateValueCase } from "@/lib/programs/value-engine";
import {
  COST_BASIS_CURRENCY,
  P2_PLANNING_BENCHMARK_LABEL,
  UNRESOLVED_COST_BASIS_SNAPSHOT_ID,
  costForBasis,
  describeCostBasisBlock,
  loadCostBasis,
  resolveCostBasis,
  withCostBasis,
  type ApprovedRomSnapshot,
  type CostBasis,
  type CostBasisBlockReason,
} from "@/lib/programs/value-engine/cost-basis";
import type {
  EstimateModel,
  EstimateModelLine,
} from "@/lib/programs/estimate-model";
import type { ValueCase } from "@/lib/programs/value-engine/types";

function line(overrides: Partial<EstimateModelLine>): EstimateModelLine {
  return {
    pairId: "P1",
    workPackage: "Scheduling build",
    role: "Engineer",
    deliveryModel: "internal",
    lowHours: 900,
    baseHours: 1_000,
    highHours: 1_200,
    ratePerHour: 150,
    rateSource: "Synthetic internal rate",
    inputBasis: "assumption",
    evidenceReference: "",
    assumption: "Synthetic sizing",
    confidence: "medium",
    aiEligiblePct: 0,
    aiToolAssumption: "",
    humanReviewHours: 0,
    ...overrides,
  };
}

// internal: 900/1,000/1,200 h × $150 = $135,000 / $150,000 / $180,000
// vendor:   800/  900/1,000 h × $200 = $160,000 / $180,000 / $200,000
function estimate(overrides: Partial<EstimateModel> = {}): string {
  const model: EstimateModel = {
    currency: "USD",
    reviewer: "Synthetic estimate reviewer",
    reviewConfirmed: true,
    sourceNotes: "",
    rows: [
      line({}),
      line({
        deliveryModel: "vendor",
        lowHours: 800,
        baseHours: 900,
        highHours: 1_000,
        ratePerHour: 200,
        rateSource: "Synthetic vendor rate",
      }),
    ],
    ...overrides,
  };
  return JSON.stringify(model);
}

const SNAPSHOT: ApprovedRomSnapshot = {
  snapshotId: "rom-7",
  currency: "USD",
  lowCents: 20_000_000,
  baseCents: 25_000_000,
  highCents: 31_000_000,
};

function blockedReason(basis: CostBasis): CostBasisBlockReason | null {
  return basis.status === "blocked" ? basis.reason : null;
}

describe("precedence", () => {
  it("an approved ROM snapshot wins over a reviewed estimate", () => {
    expect(
      resolveCostBasis({
        romSnapshot: SNAPSHOT,
        estimateCapture: estimate(),
        deliveryModel: "internal",
      }),
    ).toEqual({
      status: "resolved",
      basis: "rom_snapshot",
      source: "rom:rom-7",
      deliveryModel: null,
      cents: { low: 20_000_000, base: 25_000_000, high: 31_000_000 },
      planningBenchmark: null,
    });
  });

  it.each([
    ["internal", { low: 13_500_000, base: 15_000_000, high: 18_000_000 }],
    ["vendor", { low: 16_000_000, base: 18_000_000, high: 20_000_000 }],
  ] as const)(
    "without a snapshot, the reviewed estimate's %s total, in cents",
    (deliveryModel, cents) => {
      expect(
        resolveCostBasis({ estimateCapture: estimate(), deliveryModel }),
      ).toEqual({
        status: "resolved",
        basis: "estimate_model",
        source: `estimate_model:${deliveryModel}`,
        deliveryModel,
        cents,
        planningBenchmark: null,
      });
    },
  );

  it("without either, it is blocked", () => {
    const basis = resolveCostBasis({ estimateCapture: "  " });
    expect(basis).toEqual({
      status: "blocked",
      reason: "estimate_absent",
      detail: describeCostBasisBlock("estimate_absent"),
      planningBenchmark: null,
    });
  });

  it("the loader is asked first; no snapshot falls through to the estimate", async () => {
    const loadApprovedRomSnapshot = jest.fn(async () => SNAPSHOT);
    const fromRom = await loadCostBasis({
      loadApprovedRomSnapshot,
      estimateCapture: estimate(),
      deliveryModel: "vendor",
    });
    expect(loadApprovedRomSnapshot).toHaveBeenCalledTimes(1);
    expect(fromRom).toMatchObject({ basis: "rom_snapshot" });

    const fromEstimate = await loadCostBasis({
      loadApprovedRomSnapshot: async () => null,
      estimateCapture: estimate(),
      deliveryModel: "vendor",
    });
    expect(fromEstimate).toMatchObject({
      basis: "estimate_model",
      source: "estimate_model:vendor",
    });

    expect(
      await loadCostBasis({
        estimateCapture: estimate(),
        deliveryModel: "vendor",
      }),
    ).toEqual(fromEstimate);
  });

  it("a loader failure is thrown, never read as 'no snapshot'", async () => {
    await expect(
      loadCostBasis({
        loadApprovedRomSnapshot: async () => {
          throw new Error("snapshot read failed");
        },
        estimateCapture: estimate(),
        deliveryModel: "internal",
      }),
    ).rejects.toThrow("snapshot read failed");
  });
});

describe("an approved snapshot that cannot be used blocks, never falls back", () => {
  it.each([
    ["fractional cents", { baseCents: 25_000_000.5 }],
    ["a negative figure", { lowCents: -1 }],
    ["low above base", { lowCents: 26_000_000 }],
    ["base above high", { highCents: 24_000_000 }],
  ] as const)("%s", (_label, overrides) => {
    expect(
      blockedReason(
        resolveCostBasis({
          romSnapshot: { ...SNAPSHOT, ...overrides },
          estimateCapture: estimate(),
          deliveryModel: "internal",
        }),
      ),
    ).toBe("rom_snapshot_unreadable");
  });

  it("another currency", () => {
    expect(
      blockedReason(
        resolveCostBasis({
          romSnapshot: { ...SNAPSHOT, currency: "EUR" },
          estimateCapture: estimate(),
          deliveryModel: "internal",
        }),
      ),
    ).toBe("cost_currency_unsupported");
  });

  it("an equal low/base/high snapshot is fine", () => {
    expect(
      resolveCostBasis({
        romSnapshot: {
          ...SNAPSHOT,
          lowCents: 0,
          baseCents: 0,
          highCents: 0,
        },
        estimateCapture: "",
      }),
    ).toMatchObject({
      status: "resolved",
      cents: { low: 0, base: 0, high: 0 },
    });
  });
});

describe("the estimate counts only when reviewed, in dollars, for a named delivery model", () => {
  it("unreadable", () => {
    expect(
      blockedReason(resolveCostBasis({ estimateCapture: "not json" })),
    ).toBe("estimate_unreadable");
  });

  it.each<[string, Partial<EstimateModel>]>([
    ["no named reviewer", { reviewer: " " }],
    ["the reviewer has not confirmed", { reviewConfirmed: false }],
    ["no rows", { rows: [] }],
  ])("not reviewed: %s", (_label, overrides) => {
    expect(
      blockedReason(
        resolveCostBasis({
          estimateCapture: estimate(overrides),
          deliveryModel: "internal",
        }),
      ),
    ).toBe("estimate_not_reviewed");
  });

  it("not in US dollars", () => {
    expect(
      blockedReason(
        resolveCostBasis({
          estimateCapture: estimate({ currency: "CAD" }),
          deliveryModel: "internal",
        }),
      ),
    ).toBe("cost_currency_unsupported");
    expect(COST_BASIS_CURRENCY).toBe("USD");
  });

  it.each([undefined, null])(
    "no delivery model named (%s): blocked, no default taken",
    (deliveryModel) => {
      expect(
        blockedReason(
          resolveCostBasis({ estimateCapture: estimate(), deliveryModel }),
        ),
      ).toBe("estimate_delivery_model_unselected");
    },
  );
});

describe("blocked sentences", () => {
  const reasons: CostBasisBlockReason[] = [
    "rom_snapshot_unreadable",
    "cost_currency_unsupported",
    "estimate_absent",
    "estimate_unreadable",
    "estimate_not_reviewed",
    "estimate_delivery_model_unselected",
  ];

  it.each(reasons)("%s has its own figure-free sentence", (reason) => {
    const detail = describeCostBasisBlock(reason);
    expect(detail.length).toBeGreaterThan(40);
    expect(detail).not.toMatch(/\$|\d{2,}|\d[.,]\d/);
  });

  it("no two reasons share a sentence", () => {
    expect(new Set(reasons.map(describeCostBasisBlock)).size).toBe(
      reasons.length,
    );
  });

  it("a blocked basis carries its reason's sentence", () => {
    const basis = resolveCostBasis({ estimateCapture: estimate() });
    expect(basis).toMatchObject({
      detail: describeCostBasisBlock("estimate_delivery_model_unselected"),
    });
  });
});

describe("the engine cost for a basis", () => {
  const model: ValueCase = {
    levers: [
      {
        id: "L1",
        name: "Premium labour",
        conversion: "cost_reduction",
        driver: {
          name: "share reduced",
          unit: "share",
          direction: "increase",
          baseline: { kind: "literal", value: 0, source: "synthetic" },
          target: { kind: "literal", value: 0.1, source: "synthetic" },
        },
        terms: [
          {
            role: "base",
            label: "spend ($)",
            ref: { kind: "literal", value: 1_000_000, source: "synthetic" },
          },
          { role: "driver_delta" },
        ],
        attribution: { kind: "literal", value: 1, source: "synthetic" },
        probability: { kind: "literal", value: 1, source: "synthetic" },
        timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
      },
    ],
    horizonYears: 1,
    discountRate: { kind: "literal", value: 0.08, source: "synthetic" },
    // The author's own typed figure: superseded by the basis.
    cost: { kind: "estimate", baseCents: 1 },
  };

  it("a resolved basis replaces the author's typed cost with its cents", () => {
    const basis = resolveCostBasis({
      estimateCapture: estimate(),
      deliveryModel: "internal",
    });
    expect(costForBasis(basis)).toEqual({
      kind: "estimate",
      lowCents: 13_500_000,
      baseCents: 15_000_000,
      highCents: 18_000_000,
    });
    const result = evaluateValueCase(withCostBasis(model, basis));
    expect(result.economics!.costCents).toEqual({
      // The low scenario pairs with the HIGH cost.
      low: 18_000_000,
      base: 15_000_000,
      high: 13_500_000,
    });
  });

  it("a blocked basis gives the engine a cost nothing resolves: no figure", () => {
    const basis = resolveCostBasis({ estimateCapture: "" });
    expect(costForBasis(basis)).toEqual({
      kind: "rom",
      snapshotId: UNRESOLVED_COST_BASIS_SNAPSHOT_ID,
    });
    const result = evaluateValueCase(withCostBasis(model, basis));
    expect(result.status).toBe("blocked");
    expect(result.economics).toBeNull();
    expect(result.caseInputIssues).toEqual([
      { key: "case.cost", reason: "unresolved" },
    ]);
  });

  it("does not mutate the saved case", () => {
    const saved: ValueCase = {
      ...structuredClone(model),
      cost: { kind: "estimate", baseCents: 1 },
    };
    const before = JSON.stringify(saved);
    const applied = withCostBasis(
      saved,
      resolveCostBasis({ estimateCapture: "" }),
    );
    expect(JSON.stringify(saved)).toBe(before);
    expect(applied.cost).not.toEqual(saved.cost);
  });

  it("rounds an estimate's dollars to the nearest cent, not down", () => {
    // $19.99 × 1 h: 19.99 × 100 is 1,998.999… in floating point.
    const oneHour = {
      lowHours: 1,
      baseHours: 1,
      highHours: 1,
      ratePerHour: 19.99,
    };
    const basis = resolveCostBasis({
      estimateCapture: estimate({
        rows: [line(oneHour), line({ ...oneHour, deliveryModel: "vendor" })],
      }),
      deliveryModel: "internal",
    });
    expect(basis).toMatchObject({
      cents: { low: 1_999, base: 1_999, high: 1_999 },
    });
  });
});

describe("the kernel planning figure", () => {
  it("is carried only as a labelled, uncounted cross-check", () => {
    const basis = resolveCostBasis({
      estimateCapture: estimate(),
      deliveryModel: "internal",
      planningBenchmarkCents: 99_000_000,
    });
    expect(basis).toMatchObject({
      cents: { base: 15_000_000 },
      planningBenchmark: {
        label: "P2 planning benchmark, superseded",
        cents: 99_000_000,
        counted: false,
      },
    });
    expect(P2_PLANNING_BENCHMARK_LABEL).toBe(
      "P2 planning benchmark, superseded",
    );
  });

  it("rides along on a blocked basis too, still never the cost", () => {
    const basis = resolveCostBasis({
      estimateCapture: "",
      planningBenchmarkCents: 99_000_000,
    });
    expect(basis.status).toBe("blocked");
    expect(basis.planningBenchmark?.cents).toBe(99_000_000);
    expect(costForBasis(basis)).toEqual({
      kind: "rom",
      snapshotId: UNRESOLVED_COST_BASIS_SNAPSHOT_ID,
    });
  });

  it.each([null, undefined, Number.NaN])("is absent for %s", (cents) => {
    expect(
      resolveCostBasis({ estimateCapture: "", planningBenchmarkCents: cents })
        .planningBenchmark,
    ).toBeNull();
  });

  it("the module never reaches for the kernel's default rate card", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/lib/programs/value-engine/cost-basis.ts"),
      "utf8",
    );
    const imports = source
      .split("\n")
      .filter((l) => /^\s*(import|from)\b|\bfrom\s+"/.test(l))
      .join("\n");
    expect(imports).not.toMatch(/expert-kernel|effort-estimator|rate-card/);
  });
});
