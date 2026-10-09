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

  /**
   * One line per (rule, role) the way `runEffortEngine` emits a multi-role
   * pack: every role line repeats the rule's pack-level `moduleHours` and
   * carries its own allocated `roleHours` and cost. Each line gets its own
   * copy of `moduleHours` (as after a JSON round-trip), so nothing relies on
   * object identity.
   */
  function roleLines(
    activityPackCode: string,
    ruleCode: string,
    hours: { raw: number; expected: number },
    roles: Array<{ roleCode: string; allocationPct: number; roleHours: number; laborCostCents: number | null }>,
    overrides: Partial<EffortLineItem> = {},
  ): EffortLineItem[] {
    return roles.map((r) =>
      line({
        activityPackCode,
        ruleCode,
        roleCode: r.roleCode,
        allocationPct: r.allocationPct,
        moduleHours: { raw: hours.raw, complexityFactor: 1.2, noveltyFactor: 1, assuranceFactor: 1, scenarioFactor: 1, expected: hours.expected },
        roleHours: r.roleHours,
        laborCostCents: r.laborCostCents,
        ...overrides,
      }),
    );
  }

  it("counts a multi-role rule's hours once, not once per role line, while summing every role line's cost", () => {
    const lines = [
      // 80h raw × 1.2 = 96h expected, split 50/30/20: 48 + 28.8 + 19.2 = 96h.
      ...roleLines("AP-MULTI", "AP-MULTI-R1", { raw: 80, expected: 96 }, [
        { roleCode: "ROL-A", allocationPct: 50, roleHours: 48, laborCostCents: 432_000 }, // 48h × $90
        { roleCode: "ROL-B", allocationPct: 30, roleHours: 28.8, laborCostCents: 316_800 }, // 28.8h × $110
        { roleCode: "ROL-C", allocationPct: 20, roleHours: 19.2, laborCostCents: 288_000 }, // 19.2h × $150
      ]),
      // A second rule in the SAME pack: 10h raw × 1.2 = 12h, split 50/50.
      ...roleLines("AP-MULTI", "AP-MULTI-R2", { raw: 10, expected: 12 }, [
        { roleCode: "ROL-A", allocationPct: 50, roleHours: 6, laborCostCents: 54_000 },
        { roleCode: "ROL-B", allocationPct: 50, roleHours: 6, laborCostCents: 66_000 },
      ]),
    ];
    const totals = aggregateTotals(lines);
    // Summing per role line would give 80×3 + 10×2 = 260 raw and 96×3 + 12×2 = 312 expected.
    expect(totals.totalRawHours).toBe(90);
    expect(totals.totalExpectedHours).toBe(108);
    expect(totals.totalExpectedHours).toBe(lines.reduce((acc, l) => acc + (l.roleHours ?? 0), 0));
    expect(totals.totalLaborCostCents).toBe(432_000 + 316_800 + 288_000 + 54_000 + 66_000);
    expect(totals.totalLaborCostCents).toBe(1_156_800);
    expect(totals.totalCostCents).toBe(1_156_800);
    expect(totals.gapCount).toBe(0);
  });

  it("keeps the same rule code in two different packs apart, excludes an out_of_scope multi-role rule, and leaves single-role lines as they were", () => {
    const lines = [
      ...roleLines("AP-LEFT", "R1", { raw: 30, expected: 36 }, [
        { roleCode: "ROL-A", allocationPct: 60, roleHours: 21.6, laborCostCents: 194_400 },
        { roleCode: "ROL-B", allocationPct: 40, roleHours: 14.4, laborCostCents: 158_400 },
      ]),
      ...roleLines("AP-RIGHT", "R1", { raw: 20, expected: 24 }, [
        { roleCode: "ROL-A", allocationPct: 100, roleHours: 24, laborCostCents: 216_000 },
      ]),
      ...roleLines(
        "AP-DROPPED",
        "AP-DROPPED-R1",
        { raw: 70, expected: 84 },
        [
          { roleCode: "ROL-A", allocationPct: 50, roleHours: 42, laborCostCents: 378_000 },
          { roleCode: "ROL-B", allocationPct: 50, roleHours: 42, laborCostCents: 462_000 },
        ],
        { classification: "out_of_scope" },
      ),
      line({ activityPackCode: "AP-SOLO", ruleCode: "AP-SOLO-R1", moduleHours: { raw: 15, complexityFactor: 1, noveltyFactor: 1, assuranceFactor: 1, scenarioFactor: 1, expected: 15 }, roleHours: 15, laborCostCents: 120_000 }),
    ];
    const totals = aggregateTotals(lines);
    expect(totals.totalRawHours).toBe(30 + 20 + 15);
    expect(totals.totalExpectedHours).toBe(36 + 24 + 15);
    expect(totals.totalLaborCostCents).toBe(194_400 + 158_400 + 216_000 + 120_000);
  });

  it("counts a rule's hours once even when its first role line has an unresolved rate (a gap)", () => {
    const lines = roleLines("AP-GAPPY", "AP-GAPPY-R1", { raw: 25, expected: 30 }, [
      { roleCode: "ROL-A", allocationPct: 50, roleHours: 15, laborCostCents: null },
      { roleCode: "ROL-B", allocationPct: 50, roleHours: 15, laborCostCents: 165_000 },
    ]);
    const totals = aggregateTotals(lines);
    expect(totals.totalRawHours).toBe(25);
    expect(totals.totalExpectedHours).toBe(30);
    expect(totals.totalLaborCostCents).toBe(165_000);
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

  it("a single Move's two-role already_funded block counts both role lines: a one-Move portfolio equals that Move's own total", () => {
    // Two role lines of ONE shared pack (same pack and rule, different
    // roles) — how the engine emits a multi-role pack. Dedup exists to stop
    // a block being counted again by a LATER Move; within its owning Move
    // every line of the block is real cost. (This case previously expected
    // 400,000: only the first role line, below the Move's own 800,000 total.)
    const ref = "SHARED::finops-governance-office";
    const moveA = output("ARCH-01", [
      line({ classification: "already_funded", sharedCostRef: ref, laborCostCents: 400_000, roleCode: "ROL-322" }),
      line({ classification: "already_funded", sharedCostRef: ref, laborCostCents: 400_000, roleCode: "ROL-323" }),
    ]);
    const rollup = rollUpPortfolio([moveA]);
    expect(rollup.naiveSumCents).toBe(800_000);
    expect(rollup.totalCostCents).toBe(800_000);
    expect(rollup.totalCostCents).toBe(moveA.totals.totalCostCents);
    const entry = rollup.lines.find((l) => l.sharedCostRef === ref);
    expect(entry?.occurrenceCount).toBe(1);
    expect(entry?.costCents).toBe(800_000);
  });
});

describe("rollUpPortfolio — a multi-line shared block is counted whole, once, from its first owning Move", () => {
  const REF = "SHARED::platform-foundation";
  /** A shared pack with two rules × two roles: 360,000 + 240,000 + 90,000 + 60,000 = 750,000. */
  function foundationBlock(extra: EffortLineItem[] = []): EffortLineItem[] {
    const shared: Partial<EffortLineItem> = { classification: "shared_program", sharedCostRef: REF, activityPackCode: "AP-FND" };
    return [
      line({ ...shared, ruleCode: "AP-FND-R1", roleCode: "ROL-A", laborCostCents: 360_000 }),
      line({ ...shared, ruleCode: "AP-FND-R1", roleCode: "ROL-B", laborCostCents: 240_000 }),
      line({ ...shared, ruleCode: "AP-FND-R2", roleCode: "ROL-A", laborCostCents: 90_000 }),
      line({ ...shared, ruleCode: "AP-FND-R2", roleCode: "ROL-C", laborCostCents: 60_000 }),
      ...extra,
    ];
  }
  const moveA = output("ARCH-01", [line({ activityPackCode: "AP-A", laborCostCents: 410_000 }), ...foundationBlock()]);
  const moveB = output("ARCH-02", [line({ activityPackCode: "AP-B", laborCostCents: 50_000 })]);
  // Move C prices the same foundation with one extra line (45,000): 795,000.
  const moveC = output("ARCH-03", [
    line({ activityPackCode: "AP-C", laborCostCents: 70_000 }),
    ...foundationBlock([line({ classification: "shared_program", sharedCostRef: REF, activityPackCode: "AP-FND", ruleCode: "AP-FND-R3", roleCode: "ROL-B", laborCostCents: 45_000 })]),
  ]);

  it("two Moves sharing a four-line block: 410,000 + 230,000 + 750,000 = 1,390,000 (naive 2,140,000)", () => {
    const moveD = output("ARCH-04", [line({ activityPackCode: "AP-D", laborCostCents: 230_000 }), ...foundationBlock()]);
    const rollup = rollUpPortfolio([moveA, moveD]);
    expect(rollup.naiveSumCents).toBe(410_000 + 750_000 + 230_000 + 750_000);
    expect(rollup.totalCostCents).toBe(410_000 + 230_000 + 750_000);
    expect(rollup.totalCostCents).toBe(1_390_000);
    const entry = rollup.lines.find((l) => l.sharedCostRef === REF);
    expect(entry?.occurrenceCount).toBe(2);
    expect(entry?.costCents).toBe(750_000);
    expect(rollup.lines.filter((l) => l.sharedCostRef === REF)).toHaveLength(1);
  });

  it("a one-Move portfolio equals that Move's own total (1,160,000)", () => {
    const rollup = rollUpPortfolio([moveA]);
    expect(rollup.totalCostCents).toBe(1_160_000);
    expect(rollup.totalCostCents).toBe(moveA.totals.totalCostCents);
  });

  it("keeps the FIRST owning Move's block and drops every later copy, whatever its size; occurrenceCount counts Moves, not lines", () => {
    const rollup = rollUpPortfolio([moveA, moveB, moveC]);
    // A's block (750,000) stands; C's five-line copy (795,000) is dropped whole.
    expect(rollup.totalCostCents).toBe(410_000 + 50_000 + 70_000 + 750_000);
    expect(rollup.naiveSumCents).toBe(410_000 + 750_000 + 50_000 + 70_000 + 795_000);
    const entry = rollup.lines.find((l) => l.sharedCostRef === REF);
    expect(entry?.occurrenceCount).toBe(2);
    expect(entry?.costCents).toBe(750_000);

    // Reverse the order: C now owns the block, so its 795,000 copy counts and A's is dropped.
    const reversed = rollUpPortfolio([moveC, moveB, moveA]);
    expect(reversed.totalCostCents).toBe(70_000 + 50_000 + 410_000 + 795_000);
    expect(reversed.lines.find((l) => l.sharedCostRef === REF)?.costCents).toBe(795_000);
  });
});
