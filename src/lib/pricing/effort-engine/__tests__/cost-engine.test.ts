import { aggregateTotals, rollUpPortfolio } from "../cost-engine";
import type { EffortEngineOutput, EffortLineItem } from "../types";

function line(overrides: Partial<EffortLineItem>): EffortLineItem {
  return {
    archetypeCode: "ARCH-01",
    activityPackCode: "AP-TECH-AI-01",
    activityPackName: "Test Pack",
    category: "technical",
    ruleCode: "R1",
    operation: "fixed_hours",
    driverCode: null,
    driverQuantity: null,
    modelVersion: 1,
    scenarioKey: "traditional",
    classification: "initiative_specific",
    sharedCostRef: null,
    roleCode: "ROL-001",
    allocationPct: 100,
    moduleHours: { raw: 100, complexityFactor: 1, noveltyFactor: 1, assuranceFactor: 1, scenarioFactor: 1, expected: 100 },
    roleHours: 100,
    rate: { resolvedFromScope: "rate_band_default", roleCode: "ROL-001", levelCode: "LVL-09", hourlyRateCents: 10000, currency: "USD", rateCardVersionId: null, gapReason: null },
    laborCostCents: 1_000_000,
    manualCostCents: null,
    gapReason: null,
    overrideRationale: null,
    formulaTrace: "test",
    ...overrides,
  };
}

describe("aggregateTotals", () => {
  it("sums labor + manual cost, counts gaps, excludes out_of_scope lines", () => {
    const lines = [
      line({}),
      line({ roleCode: "ROL-002", laborCostCents: 500_000 }),
      line({ roleCode: null, laborCostCents: null, manualCostCents: 150_000, moduleHours: null, roleHours: null, rate: null }),
      line({ roleCode: "ROL-003", laborCostCents: null, rate: { resolvedFromScope: "missing", roleCode: "ROL-003", levelCode: null, hourlyRateCents: null, currency: "USD", rateCardVersionId: null, gapReason: "gap" }, gapReason: "gap" }),
      line({ classification: "out_of_scope", laborCostCents: 9_999_999 }),
    ];
    const totals = aggregateTotals(lines);
    expect(totals.totalLaborCostCents).toBe(1_500_000);
    expect(totals.totalManualCostCents).toBe(150_000);
    expect(totals.totalCostCents).toBe(1_650_000);
    expect(totals.gapCount).toBe(1);
  });
});

function output(archetypeCode: string, lines: EffortLineItem[]): EffortEngineOutput {
  return {
    archetypeCode,
    modelVersion: 1,
    scenarioKey: "traditional",
    tenantKey: "test-tenant",
    lineItems: lines,
    totals: aggregateTotals(lines),
  };
}

describe("rollUpPortfolio — shared-cost dedup (brief §7.7)", () => {
  it("counts a shared_program cost referenced by two Moves exactly once, not twice", () => {
    const sharedLine = line({
      classification: "shared_program",
      sharedCostRef: "SHARED::enterprise-architecture-review-board",
      laborCostCents: 2_000_000,
    });
    const moveA = output("ARCH-01", [line({ laborCostCents: 500_000 }), sharedLine]);
    const moveB = output("ARCH-02", [line({ laborCostCents: 300_000 }), { ...sharedLine, activityPackCode: "AP-SHARED-08" }]);

    const rollup = rollUpPortfolio([moveA, moveB]);

    // Naive sum would double count the shared line: 500k + 2M + 300k + 2M = 4.8M
    expect(rollup.naiveSumCents).toBe(500_000 + 2_000_000 + 300_000 + 2_000_000);
    // Deduped total counts the shared cost ONCE: 500k + 300k + 2M = 2.8M
    expect(rollup.totalCostCents).toBe(500_000 + 300_000 + 2_000_000);
    expect(rollup.totalCostCents).toBeLessThan(rollup.naiveSumCents);

    const sharedEntry = rollup.lines.find((l) => l.sharedCostRef === "SHARED::enterprise-architecture-review-board");
    expect(sharedEntry?.occurrenceCount).toBe(2);
  });

  it("never dedups initiative_specific lines, even with matching identifiers", () => {
    const moveA = output("ARCH-01", [line({ laborCostCents: 1_000_000 })]);
    const moveB = output("ARCH-01", [line({ laborCostCents: 1_000_000 })]);
    const rollup = rollUpPortfolio([moveA, moveB]);
    expect(rollup.totalCostCents).toBe(2_000_000);
    expect(rollup.naiveSumCents).toBe(2_000_000);
  });

  it("excludes out_of_scope lines from both the naive sum and the deduped total", () => {
    const moveA = output("ARCH-01", [line({ classification: "out_of_scope", laborCostCents: 999_000_000 }), line({ laborCostCents: 100_000 })]);
    const rollup = rollUpPortfolio([moveA]);
    expect(rollup.totalCostCents).toBe(100_000);
    expect(rollup.naiveSumCents).toBe(100_000);
  });

  it("a single Move's own already_funded line is deduped against itself if it appears twice with the same ref", () => {
    const ref = "SHARED::finops-governance-office";
    const moveA = output("ARCH-01", [
      line({ classification: "already_funded", sharedCostRef: ref, laborCostCents: 400_000, roleCode: "ROL-322" }),
      line({ classification: "already_funded", sharedCostRef: ref, laborCostCents: 400_000, roleCode: "ROL-323" }),
    ]);
    const rollup = rollUpPortfolio([moveA]);
    expect(rollup.naiveSumCents).toBe(800_000);
    expect(rollup.totalCostCents).toBe(400_000);
  });
});
