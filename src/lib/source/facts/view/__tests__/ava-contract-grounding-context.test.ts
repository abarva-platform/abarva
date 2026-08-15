import { buildAvaSourceContractGrounding } from "../ava-contract-grounding-context";

const getContract360 = jest.fn();
const getContractOptimizationOpportunitySet = jest.fn();
const getContractOptimizationEvidencePack = jest.fn();

jest.mock("@/lib/source/data-model/read-adapter", () => ({
  getContract360: (...args: unknown[]) => getContract360(...args),
  getContractOptimizationOpportunitySet: (...args: unknown[]) =>
    getContractOptimizationOpportunitySet(...args),
  getContractOptimizationEvidencePack: (...args: unknown[]) =>
    getContractOptimizationEvidencePack(...args),
}));

function contractRow(overrides: Record<string, unknown> = {}) {
  return {
    contract_id: "CTR-090",
    contract_name: "Salesforce Data Platform Agreement 3",
    vendor_name: "Salesforce",
    annual_value: 43_500_000,
    resolved_annual_value: null,
    annual_value_conflict_flag: false,
    ...overrides,
  };
}

function opportunity(overrides: Record<string, unknown> = {}) {
  return {
    opportunityId: "CTR-090:rate-variance",
    contractId: "CTR-090",
    label: "Rate variance",
    shortLabel: "Rate variance",
    valueType: "recoverable_leakage",
    amountUsd: 365_000,
    amountState: "exact",
    stage: "quantified",
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
      calculatedAmountUsd: 365_000,
      includedLineCount: 4,
      excludedLineCount: 8,
      pendingLineCount: 2,
      lines: [],
    },
    overlapTreatment: "none",
    approvalState: "candidate",
    narrative: "",
    ...overrides,
  };
}

function opportunitySet(overrides: Record<string, unknown> = {}) {
  return {
    tenantKey: "skyharbor-air",
    datasetVersion: "v1",
    contractId: "CTR-090",
    baseline: { status: "missing" },
    selectedOpportunityId: "CTR-090:rate-variance",
    opportunities: [opportunity()],
    financeRealizations: [],
    approvalRequests: [],
    negotiatedOutcomes: [],
    evidenceRequirements: [],
    potentialRecoverableUsd: 365_000,
    potentialAvoidableUsd: 0,
    potentialNegotiableUsd: 0,
    financeConfirmedUsd: 0,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  getContract360.mockResolvedValue(contractRow());
  getContractOptimizationOpportunitySet.mockResolvedValue(opportunitySet());
  getContractOptimizationEvidencePack.mockResolvedValue(null);
});

describe("buildAvaSourceContractGrounding", () => {
  it("returns nothing without a tenant or contract id", async () => {
    expect(await buildAvaSourceContractGrounding("", "CTR-090")).toEqual({
      block: "",
      hasLiveNumbers: false,
    });
    expect(await buildAvaSourceContractGrounding("skyharbor-air", "  ")).toEqual(
      { block: "", hasLiveNumbers: false },
    );
  });

  it("returns nothing for an unknown contract rather than guessing", async () => {
    getContract360.mockResolvedValue(null);
    const result = await buildAvaSourceContractGrounding(
      "skyharbor-air",
      "CTR-DOES-NOT-EXIST",
    );
    expect(result).toEqual({ block: "", hasLiveNumbers: false });
  });

  it("never breaks the turn when a read fails", async () => {
    getContract360.mockRejectedValue(new Error("db down"));
    const result = await buildAvaSourceContractGrounding(
      "skyharbor-air",
      "CTR-090",
    );
    expect(result.block).toBe("");
  });

  it("grounds the contract with baseline, readiness, and traceability", async () => {
    const { block, hasLiveNumbers } = await buildAvaSourceContractGrounding(
      "skyharbor-air",
      "CTR-090",
    );

    expect(hasLiveNumbers).toBe(true);
    expect(block).toContain("CTR-090");
    expect(block).toContain("Salesforce");
    expect(block).toContain("Commercial baseline status: missing");
    expect(block).toContain("Workflow position: step");
    // No evidence pack, so every required family is missing — and said so.
    expect(block).toContain("0 of 8 required evidence families");
    expect(block).toContain("Missing:");
    expect(block).toContain("Rate variance");
  });

  it("separates reproducible value from value nothing can rebuild", async () => {
    getContractOptimizationOpportunitySet.mockResolvedValue(
      opportunitySet({
        opportunities: [
          opportunity(),
          opportunity({
            opportunityId: "CTR-090:scope",
            shortLabel: "Scope reduction",
            valueType: "avoided_cost",
            amountUsd: 2_400_000,
            calculation: null,
          }),
        ],
      }),
    );

    const { block } = await buildAvaSourceContractGrounding(
      "skyharbor-air",
      "CTR-090",
    );

    expect(block).toContain(
      "Opportunity value that a calculation run can reproduce: $365K",
    );
    expect(block).toContain(
      "Stated value with no reproducible calculation run: $2.4M",
    );
    expect(block).toContain("amount cannot be reproduced");
  });

  it("cancels the portfolio block's deflection for this contract", async () => {
    const { block } = await buildAvaSourceContractGrounding(
      "skyharbor-air",
      "CTR-090",
    );
    expect(block).toContain("Contract-grain grounding IS available for CTR-090");
    expect(block).toContain("do NOT deflect them to Contract 360");
  });

  it("quotes the resolved value when the stated annual value is in conflict", async () => {
    getContract360.mockResolvedValue(
      contractRow({
        annual_value: 43_500_000,
        resolved_annual_value: 41_000_000,
        annual_value_conflict_flag: true,
      }),
    );

    const { block } = await buildAvaSourceContractGrounding(
      "skyharbor-air",
      "CTR-090",
    );
    expect(block).toContain("$41M");
    expect(block).not.toContain("Annual value: $43.5M");
    expect(block).toContain("disagreed");
  });

  it("states realized value only from finance confirmation", async () => {
    const { block } = await buildAvaSourceContractGrounding(
      "skyharbor-air",
      "CTR-090",
    );
    expect(block).toContain("Finance-confirmed realized value: $0");
    expect(block).toContain("Realized value exists only where Finance has");
  });

  it("keeps aVa aligned to the pending Finance/Tower value-proof gate", async () => {
    getContractOptimizationOpportunitySet.mockResolvedValue(
      opportunitySet({
        financeConfirmedUsd: 940_000,
        approvalRequests: [
          {
            approvalRequestId: "apr-strategy",
            caseId: "case-1",
            opportunityId: "CTR-090:rate-variance",
            approvalType: "vendor_outreach_strategy",
            approvalState: "approved",
            requestedByRole: "Procurement",
            requestedAt: null,
            decisions: [],
          },
          {
            approvalRequestId: "apr-finance",
            caseId: "case-1",
            opportunityId: "CTR-090:rate-variance",
            approvalType: "finance_value_confirmation",
            approvalState: "pending",
            requestedByRole: "Finance",
            requestedAt: null,
            decisions: [],
          },
        ],
        negotiatedOutcomes: [
          {
            outcomeId: "outcome-1",
            caseId: "case-1",
            opportunityId: "CTR-090:rate-variance",
            outcomeState: "agreed",
            agreedAmountUsd: 940_000,
            effectiveDate: "2027-07-01",
            sourceDocumentId: "doc-1",
          },
        ],
      }),
    );

    const { block } = await buildAvaSourceContractGrounding(
      "skyharbor-air",
      "CTR-090",
    );

    expect(block).toContain(
      "Workflow lifecycle state: strategy approval approved; vendor outcome agreed; Finance/Tower confirmation request pending; value-proof gate open.",
    );
    expect(block).toContain("Finance-confirmed realized value: $940K");
    expect(block).toContain(
      "The value-proof gate is not closed until the Finance/Tower confirmation request is approved",
    );
  });
});
