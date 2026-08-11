/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SourceOptimizeContractPage } from "../SourceOptimizeContractPage";
import type { ContractOptimizationSpine } from "@/lib/source/data-model/contract-optimization-spine";
import type { ContractOptimizationOpportunitySet } from "@/lib/source/data-model/contract-optimization-opportunity";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => <nav data-testid="subnav-mock" />,
}));

function makeCandidate(overrides = {}) {
  return {
    contractId: "CTR-090",
    vendorRef: "vendor-salesforce",
    vendorName: "Salesforce",
    contractName: "Salesforce Data Platform Agreement 3",
    annualValue: 43_500_000,
    score: 86,
    rank: 1,
    band: "Prime optimization candidate",
    action: "Start contract optimization now.",
    reasons: [
      {
        kind: "material_exposure",
        label: "Material exposure",
        detail: "Annual exposure is above the governed optimization threshold.",
        sourceRef: "source.contract_360",
        tone: "strong",
        points: 25,
      },
    ],
    ...overrides,
  } as const;
}

function makeSpine(
  overrides: Partial<ContractOptimizationSpine> = {},
): ContractOptimizationSpine {
  const candidate = makeCandidate();
  const sourceConnection = {
    id: "itsm",
    sourceSystem: "ITSM / service management",
    examples: ["ServiceNow"],
    extract: "SLA performance and service-credit eligibility.",
    evidenceClasses: ["sla", "service_credit"],
    ledgers: ["recoverable_leakage"],
    fields: ["period", "credit_earned", "credit_claimed"],
    outcome: "Quantifies service-credit recovery.",
  } as const;
  return {
    selected: null,
    candidates: [candidate],
    topCandidates: [candidate],
    sourceConnections: [sourceConnection],
    missingEvidenceSources: [],
    contractStory: [],
    missingEvidenceStory: [],
    ...overrides,
  };
}

function makeOpportunitySet(): ContractOptimizationOpportunitySet {
  return {
    tenantKey: "skyharbor_global",
    datasetVersion: "source-v4-golden-contract-evidence",
    contractId: "CTR-090",
    vendorId: "vendor-salesforce",
    vendorName: "Salesforce",
    contractName: "Salesforce Data Platform Agreement 3",
    recommendation: "Open optimization case.",
    recommendationDetail: "Evidence is sufficient to start the case.",
    actionState: "start_optimize_contract",
    baseline: {
      status: "ready",
      headline: "Baseline reconciled.",
      detail: "Pricing schedule and contract register reconcile.",
      annualValueUsd: 43_500_000,
      pricingScheduleAnnualValueUsd: 43_500_000,
      actualAnnualSpendUsd: 37_400_000,
      totalCommittedValueUsd: 173_900_000,
      conflictAmountUsd: null,
      sourceRefs: ["source.golden_contract_overview"],
    },
    selectedOpportunityId: "opp-090-rate",
    opportunities: [
      {
        opportunityId: "opp-090-rate",
        contractId: "CTR-090",
        label: "Rate-card variance",
        shortLabel: "Rate-card variance",
        valueType: "recoverable_leakage",
        amountUsd: 755_000,
        amountState: "exact",
        stage: "quantified",
        evidenceGrade: "system_evidenced",
        confidence: 0.88,
        deadline: null,
        owner: "Procurement",
        blockingGap: null,
        nextAction: "Review calculation lines.",
        sourceSystems: ["AP / ERP"],
        evidenceRefs: [],
        calculation: {
          ruleId: "rate-variance-v1",
          ruleVersion: "1.0.0",
          formula: "Eligible quantity × rate variance",
          eligibleQuantity: 100,
          billedRateUsd: 12,
          contractRateUsd: 10,
          approvedExceptionsUsd: 0,
          calculatedAmountUsd: 755_000,
          includedLineCount: 18,
          excludedLineCount: 3,
          pendingLineCount: 2,
          lines: [],
        },
        overlapTreatment: "included",
        approvalState: "draft",
        narrative: "Line-level invoice and rate evidence is loaded.",
      },
    ],
    financeRealizations: [],
    evidenceRequirements: [],
    potentialRecoverableUsd: 755_000,
    potentialAvoidableUsd: 0,
    potentialNegotiableUsd: 0,
    financeConfirmedUsd: 0,
  };
}

function makeConflictOpportunitySet(): ContractOptimizationOpportunitySet {
  const base = makeOpportunitySet();
  return {
    ...base,
    recommendation: "Resolve baseline before approval.",
    recommendationDetail:
      "The pricing schedule does not reconcile to the stated annual value.",
    actionState: "request_evidence",
    baseline: {
      ...base.baseline,
      status: "conflict",
      headline: "Commercial baseline conflict.",
      detail:
        "Pricing schedule totals $44.8M while the stated annual value is $43.5M. Resolve the baseline before approving an optimization case.",
      pricingScheduleAnnualValueUsd: 44_800_000,
      conflictAmountUsd: 1_300_000,
    },
    selectedOpportunityId: null,
    opportunities: [],
    evidenceRequirements: [
      "Resolve annual-value versus pricing-schedule baseline before sizing or approving an optimization case.",
    ],
    potentialRecoverableUsd: 0,
    potentialAvoidableUsd: 0,
    potentialNegotiableUsd: 0,
    financeConfirmedUsd: 0,
  };
}

describe("SourceOptimizeContractPage", () => {
  beforeEach(() => {
    push.mockReset();
    global.fetch = jest.fn();
  });

  it("starts on a ranked contract picker when no contract is selected", () => {
    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine()}
        opportunitySet={null}
      />,
    );

    expect(
      screen.getByText("Optimize an existing contract"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Choose the contract worth action"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute(
      "href",
      "/source/optimize?contractId=CTR-090",
    );
  });

  it("opens a selected-contract optimization case through the contract API", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        approvalUrl: "/source/events/event-090/approval",
      }),
    });

    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({ selected: makeCandidate() })}
        opportunitySet={makeOpportunitySet()}
      />,
    );

    fireEvent.click(screen.getByTestId("start-optimize-contract"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/source/workspace/contract/CTR-090/optimization",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ opportunityId: "opp-090-rate" }),
        }),
      );
      expect(push).toHaveBeenCalledWith("/source/events/event-090/approval");
    });
  });

  it("shows the selected contract as a decision brief with evidence readiness", () => {
    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({ selected: makeCandidate() })}
        opportunitySet={makeOpportunitySet()}
      />,
    );

    expect(screen.getByText("Optimization decision brief")).toBeInTheDocument();
    expect(screen.getByText("Contract exposure")).toBeInTheDocument();
    expect(screen.getByText("Opportunity rows")).toBeInTheDocument();
    expect(screen.getByText("Open evidence gaps")).toBeInTheDocument();
    expect(screen.getByText("baseline ready")).toBeInTheDocument();
    expect(screen.getByText("Pricing schedule tie-out")).toBeInTheDocument();
    expect(screen.getByText("Actual spend baseline")).toBeInTheDocument();
    expect(screen.getByText("Calculation trace")).toBeInTheDocument();
    expect(screen.getByText("Finance realization proof")).toBeInTheDocument();
    expect(screen.getByText("18 included")).toBeInTheDocument();
    expect(screen.getByText("2 pending · 3 excluded")).toBeInTheDocument();
  });

  it("surfaces opportunity-set evidence requirements when spine rows are empty", () => {
    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({
          selected: makeCandidate(),
          missingEvidenceSources: [],
        })}
        opportunitySet={makeConflictOpportunitySet()}
      />,
    );

    expect(screen.getByText("baseline conflict")).toBeInTheDocument();
    expect(
      screen.getByText("Commercial baseline reconciliation"),
    ).toBeInTheDocument();
    expect(screen.getByText("Required before approval")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Pricing-schedule line item grain for the active term, including amendments or order forms.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Baseline lock, opportunity sizing, and approval-quality case",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "No required evidence rows are open in the current spine.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders source-system, grain, blocker, and next-action guidance for missing evidence", () => {
    const sourceConnection = makeSpine().sourceConnections[0];
    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({
          selected: makeCandidate(),
          missingEvidenceSources: [
            {
              lineId: "recoverable:sla-credits",
              lineLabel: "SLA credits earned but not claimed",
              ask: "Pull the monthly service-credit register for the selected contract.",
              nextAction:
                "Request the SLA credit register from service management.",
              connections: [sourceConnection],
            },
          ],
        })}
        opportunitySet={makeOpportunitySet()}
      />,
    );

    expect(screen.getByText("Evidence request board")).toBeInTheDocument();
    expect(
      screen.getByText("SLA credits earned but not claimed"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("ITSM / service management").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("Monthly SLA and credit rows, 24 months preferred."),
    ).toBeInTheDocument();
    expect(screen.getByText("Service-credit recovery")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Request the SLA credit register from service management.",
      ),
    ).toBeInTheDocument();
  });
});
