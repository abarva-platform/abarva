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
  return {
    selected: null,
    candidates: [candidate],
    topCandidates: [candidate],
    sourceConnections: [
      {
        id: "clm",
        sourceSystem: "CLM / contract repository",
        examples: ["Icertis"],
        extract: "Executed agreement and pricing schedules.",
        evidenceClasses: ["contract_term", "rate_card"],
        ledgers: ["negotiated_improvement"],
        fields: ["contract_id", "document_id"],
        outcome: "Proves pricing mechanics and rights.",
      },
    ],
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
        calculation: null,
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
});
