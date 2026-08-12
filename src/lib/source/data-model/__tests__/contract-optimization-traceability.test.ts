import type {
  ContractOptimizationOpportunity,
  OpportunityCalculationRead,
} from "../contract-optimization-opportunity";
import {
  classifyOpportunityTrace,
  summarizeOpportunityTraceability,
} from "../contract-optimization-traceability";

function calculation(
  overrides: Partial<OpportunityCalculationRead> = {},
): OpportunityCalculationRead {
  return {
    ruleId: "rule-rate-variance",
    ruleVersion: "v1",
    formula: "sum(billed - contracted)",
    eligibleQuantity: 10,
    billedRateUsd: 120,
    contractRateUsd: 100,
    approvedExceptionsUsd: 0,
    calculatedAmountUsd: 200,
    includedLineCount: 4,
    excludedLineCount: 8,
    pendingLineCount: 2,
    lines: [],
    ...overrides,
  };
}

function opportunity(
  overrides: Partial<ContractOptimizationOpportunity> = {},
): ContractOptimizationOpportunity {
  return {
    opportunityId: "opp-1",
    contractId: "CTR-090",
    label: "Rate variance",
    shortLabel: "Rate variance",
    valueType: "recoverable_leakage",
    amountUsd: 200,
    amountState: "exact",
    stage: "quantified",
    evidenceGrade: "system_evidenced",
    confidence: 0.9,
    deadline: null,
    owner: null,
    blockingGap: null,
    nextAction: "Review",
    sourceSystems: ["ERP / AP"],
    evidenceRefs: [],
    calculation: calculation(),
    overlapTreatment: "none",
    approvalState: "candidate",
    narrative: "",
    ...overrides,
  } as ContractOptimizationOpportunity;
}

describe("classifyOpportunityTrace", () => {
  it("treats an amount matching its calculation run as reproducible", () => {
    const row = classifyOpportunityTrace(opportunity());
    expect(row.state).toBe("traced");
    expect(row.label).toBe("Reproducible from 4 included lines");
  });

  it("flags a stated amount with no calculation run as untraced", () => {
    const row = classifyOpportunityTrace(opportunity({ calculation: null }));
    expect(row.state).toBe("untraced");
    expect(row.label).toContain("cannot be reproduced");
  });

  it("flags an amount that disagrees with its own calculation run", () => {
    const row = classifyOpportunityTrace(
      opportunity({
        amountUsd: 900,
        calculation: calculation({ calculatedAmountUsd: 200 }),
      }),
    );
    expect(row.state).toBe("restated");
  });

  it("tolerates sub-dollar rounding drift", () => {
    const row = classifyOpportunityTrace(
      opportunity({
        amountUsd: 200.4,
        calculation: calculation({ calculatedAmountUsd: 200 }),
      }),
    );
    expect(row.state).toBe("traced");
  });

  it("reports a missing amount as not sized rather than zero", () => {
    const row = classifyOpportunityTrace(
      opportunity({ amountUsd: null, calculation: null }),
    );
    expect(row.state).toBe("not_sized");
    expect(row.amountUsd).toBeNull();
    expect(row.label).toContain("Not sized");
  });
});

describe("summarizeOpportunityTraceability", () => {
  it("keeps reproducible value separate from value nothing can rebuild", () => {
    const summary = summarizeOpportunityTraceability([
      opportunity({ opportunityId: "a", amountUsd: 200 }),
      opportunity({
        opportunityId: "b",
        amountUsd: 2_400_000,
        calculation: null,
      }),
      opportunity({
        opportunityId: "c",
        amountUsd: 1_000,
        calculation: calculation({ calculatedAmountUsd: 4_000 }),
      }),
      opportunity({ opportunityId: "d", amountUsd: null, calculation: null }),
    ]);

    expect(summary.tracedAmountUsd).toBe(200);
    expect(summary.untracedAmountUsd).toBe(2_401_000);
    expect(summary.tracedCount).toBe(1);
    expect(summary.untracedCount).toBe(1);
    expect(summary.restatedCount).toBe(1);
    expect(summary.notSizedCount).toBe(1);
    expect(summary.hasUntracedAmounts).toBe(true);
    expect(summary.summary).toContain(
      "Only the reproducible total may be used outside this workspace.",
    );
  });

  it("never nets one value type against another", () => {
    const summary = summarizeOpportunityTraceability([
      opportunity({
        opportunityId: "leak",
        valueType: "recoverable_leakage",
        amountUsd: 200,
      }),
      opportunity({
        opportunityId: "avoid",
        valueType: "avoided_cost",
        amountUsd: 200,
      }),
      opportunity({
        opportunityId: "avoid-untraced",
        valueType: "avoided_cost",
        amountUsd: 500,
        calculation: null,
      }),
    ]);

    expect(summary.tracedByValueType.recoverable_leakage).toBe(200);
    expect(summary.tracedByValueType.avoided_cost).toBe(200);
    expect(summary.untracedByValueType.avoided_cost).toBe(500);
    expect(summary.untracedByValueType.recoverable_leakage).toBeUndefined();
  });

  it("claims nothing when no opportunity rows exist", () => {
    const summary = summarizeOpportunityTraceability([]);
    expect(summary.tracedAmountUsd).toBe(0);
    expect(summary.untracedAmountUsd).toBe(0);
    expect(summary.hasUntracedAmounts).toBe(false);
    expect(summary.summary).toContain("no value is claimed");
  });

  it("stays clean when every row is reproducible", () => {
    const summary = summarizeOpportunityTraceability([
      opportunity({ opportunityId: "a" }),
      opportunity({ opportunityId: "b" }),
    ]);
    expect(summary.hasUntracedAmounts).toBe(false);
    expect(summary.summary).not.toContain("Only the reproducible total");
  });
});
