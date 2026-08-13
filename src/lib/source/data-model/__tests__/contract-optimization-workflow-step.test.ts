import type {
  ContractOptimizationOpportunity,
  ContractOptimizationOpportunitySet,
} from "../contract-optimization-opportunity";
import type { ContractOptimizationEvidenceReadiness } from "../contract-optimization-evidence-readiness";
import { summarizeOpportunityTraceability } from "../contract-optimization-traceability";
import { deriveOptimizeWorkflowPosition } from "../contract-optimization-workflow-step";

function readiness(
  overrides: Partial<ContractOptimizationEvidenceReadiness> = {},
): ContractOptimizationEvidenceReadiness {
  return {
    rows: [],
    requiredTotal: 8,
    requiredEvidenced: 8,
    status: "ready",
    blockingFamilies: [],
    sizingBlocked: false,
    summary: "All 8 required evidence families have governed evidence.",
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
    stage: "validated",
    evidenceGrade: "system_evidenced",
    confidence: 0.9,
    deadline: null,
    owner: null,
    blockingGap: null,
    nextAction: "Review",
    sourceSystems: [],
    evidenceRefs: [],
    calculation: {
      ruleId: "r",
      ruleVersion: "1",
      formula: "f",
      eligibleQuantity: 1,
      billedRateUsd: null,
      contractRateUsd: null,
      approvedExceptionsUsd: 0,
      calculatedAmountUsd: 200,
      includedLineCount: 2,
      excludedLineCount: 0,
      pendingLineCount: 0,
      lines: [],
    },
    overlapTreatment: "none",
    approvalState: "candidate",
    narrative: "",
    ...overrides,
  } as ContractOptimizationOpportunity;
}

function opportunitySet(
  overrides: Partial<ContractOptimizationOpportunitySet> = {},
): ContractOptimizationOpportunitySet {
  return {
    tenantKey: "tenant-a",
    datasetVersion: "v1",
    contractId: "CTR-090",
    vendorId: null,
    vendorName: null,
    contractName: null,
    recommendation: "",
    recommendationDetail: "",
    actionState: "review_calculation",
    baseline: { status: "ready" },
    selectedOpportunityId: "opp-1",
    opportunities: [opportunity()],
    financeRealizations: [],
    evidenceRequirements: [],
    potentialRecoverableUsd: 200,
    potentialAvoidableUsd: 0,
    potentialNegotiableUsd: 0,
    financeConfirmedUsd: 0,
    ...overrides,
  } as ContractOptimizationOpportunitySet;
}

function positionFor(input: {
  hasSelectedContract?: boolean;
  set?: ContractOptimizationOpportunitySet | null;
  readinessOverrides?: Partial<ContractOptimizationEvidenceReadiness>;
}) {
  const set = input.set === undefined ? opportunitySet() : input.set;
  return deriveOptimizeWorkflowPosition({
    hasSelectedContract: input.hasSelectedContract ?? true,
    opportunitySet: set,
    readiness: readiness(input.readinessOverrides),
    traceability: summarizeOpportunityTraceability(set?.opportunities ?? []),
  });
}

describe("deriveOptimizeWorkflowPosition", () => {
  it("starts at contract selection when nothing is selected", () => {
    const position = positionFor({ hasSelectedContract: false, set: null });
    expect(position.currentKey).toBe("select");
    expect(position.currentIndex).toBe(1);
    expect(position.primaryAction).toBe(
      "Pick a contract from the ranked list below",
    );
    expect(position.steps.every((step) => step.state !== "complete")).toBe(true);
  });

  it("holds at the baseline step while the baseline conflicts", () => {
    const position = positionFor({
      set: opportunitySet({ baseline: { status: "conflict" } } as never),
    });
    expect(position.currentKey).toBe("lock_baseline");
    expect(position.primaryAction).toBe("Resolve the baseline conflict");
    expect(position.blocker).toBe("Baseline inputs conflict.");
    expect(position.steps[1].state).toBe("blocked");
    // Selection is genuinely done, so it stays complete.
    expect(position.steps[0].state).toBe("complete");
    // Nothing downstream may look done.
    expect(position.steps[3].state).toBe("future");
  });

  it("holds at evidence while a required family is missing", () => {
    const position = positionFor({
      readinessOverrides: {
        requiredEvidenced: 6,
        sizingBlocked: true,
        status: "partial",
        blockingFamilies: ["ticket_volume", "staffing_model"],
        summary: "6 of 8 required evidence families have governed evidence.",
      },
    });
    expect(position.currentKey).toBe("evidence");
    expect(position.primaryAction).toBe("Collect 2 missing evidence families");
    expect(position.blocker).toContain("2 required evidence families have");
  });

  it("uses the singular form for a single missing family", () => {
    const position = positionFor({
      readinessOverrides: {
        requiredEvidenced: 7,
        sizingBlocked: true,
        blockingFamilies: ["ticket_volume"],
      },
    });
    expect(position.primaryAction).toBe("Collect 1 missing evidence family");
    expect(position.blocker).toContain("1 required evidence family has");
  });

  it("holds at diagnosis while any stated amount has no calculation run", () => {
    const position = positionFor({
      set: opportunitySet({
        opportunities: [
          opportunity(),
          opportunity({
            opportunityId: "opp-2",
            amountUsd: 2_400_000,
            calculation: null,
          }),
        ],
      }),
    });
    expect(position.currentKey).toBe("diagnose");
    expect(position.primaryAction).toBe(
      "Attach a calculation run to every stated amount",
    );
    expect(position.blocker).toContain("cannot be reproduced");
  });

  it("moves to strategy once opportunities are validated and reproducible", () => {
    const position = positionFor({});
    expect(position.currentKey).toBe("plan");
    expect(position.primaryAction).toBe("Build the negotiation strategy");
    expect(position.steps[3].state).toBe("complete");
  });

  it("offers the approval gate once a target position exists", () => {
    const position = positionFor({
      set: opportunitySet({
        opportunities: [opportunity({ stage: "target_position" })],
      }),
    });
    expect(position.currentKey).toBe("approve");
    expect(position.primaryAction).toBe("Open approval gate");
    expect(position.readyForApproval).toBe(true);
  });

  it("only reaches value proof after agreement, and only closes on finance confirmation", () => {
    const agreed = positionFor({
      set: opportunitySet({
        opportunities: [opportunity({ stage: "agreed" })],
      }),
    });
    expect(agreed.currentKey).toBe("prove_value");
    expect(agreed.primaryAction).toBe("Confirm realized value with Finance");
    expect(agreed.blocker).toBe("No finance-confirmed value yet.");

    const confirmed = positionFor({
      set: opportunitySet({
        opportunities: [opportunity({ stage: "finance_confirmed" })],
        financeConfirmedUsd: 500_000,
      }),
    });
    expect(confirmed.steps[6].state).toBe("complete");
    expect(confirmed.blocker).toBeNull();
  });

  it("never marks a later step complete because an earlier one is", () => {
    const position = positionFor({
      readinessOverrides: { sizingBlocked: true, blockingFamilies: ["ticket_volume"] },
    });
    const afterCurrent = position.steps.slice(position.currentIndex);
    expect(afterCurrent.every((step) => step.state === "future")).toBe(true);
  });

  it("always names a next action", () => {
    for (const set of [
      null,
      opportunitySet({ baseline: { status: "missing" } } as never),
      opportunitySet(),
      opportunitySet({
        opportunities: [opportunity({ stage: "finance_confirmed" })],
        financeConfirmedUsd: 1,
      }),
    ]) {
      const position = positionFor({ set });
      expect(position.primaryAction.length).toBeGreaterThan(0);
      expect(position.primaryActionDetail.length).toBeGreaterThan(0);
    }
  });
});
