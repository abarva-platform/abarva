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
      screen.getByText("Select a contract to optimize"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("optimize-contract-picker")).toHaveTextContent(
      "Optimize Contract cannot start from a blank brief.",
    );
    expect(screen.getByText("Select")).toBeInTheDocument();
    expect(screen.getByText("Lock baseline")).toBeInTheDocument();
    expect(screen.getByText("Prove value")).toBeInTheDocument();
    expect(screen.getByText("As of Jun 30, 2027")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "New 11-stage event" }),
    ).toHaveAttribute("href", "/source/new");
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
    expect(
      screen.getByText(/focused 7-step incumbent-contract path/i),
    ).toBeInTheDocument();
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

  it("turns opportunity evidence requirements into named pull instructions", () => {
    const opportunitySet = {
      ...makeOpportunitySet(),
      evidenceRequirements: [
        "This is a negotiation target/approved position, not booked savings. It requires vendor agreement or executed amendment.",
        "AP and Procurement must confirm coverage, exceptions, and dispute eligibility before recovery is asserted externally.",
        "Usage supports a reduction hypothesis; business owner must approve reclaim eligibility and service impact.",
        "Entitlement, vendor-responsibility exclusions, and claim status require legal/vendor-management review.",
        "Procurement must confirm no approved amendment, exception, or rate-card update covers these billed rates before asserting recovery.",
      ],
    };

    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({
          selected: makeCandidate(),
          missingEvidenceSources: [],
        })}
        opportunitySet={opportunitySet}
      />,
    );

    expect(
      screen.getByText("Signed concession or amendment evidence"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Invoice, PO, and active-contract coverage"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Usage, entitlement, and scope-reduction approval"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SLA credit entitlement and claim status"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rate-card amendment and exception search"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Optimization evidence requirement"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Relevant source owner extract named by the opportunity spine.",
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

    expect(screen.getByText("Evidence readiness")).toBeInTheDocument();
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

  it("keeps an amount with no calculation run out of the reproducible total", () => {
    const base = makeOpportunitySet();
    const withUntraced = {
      ...base,
      opportunities: [
        ...base.opportunities,
        {
          ...base.opportunities[0],
          opportunityId: "opp-090-scope",
          shortLabel: "Scope reduction",
          valueType: "avoided_cost" as const,
          amountUsd: 2_400_000,
          calculation: null,
        },
      ],
    };

    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({ selected: makeCandidate() })}
        opportunitySet={withUntraced}
      />,
    );

    const note = screen.getByTestId("opportunity-traceability-note");
    // $755K is calculation-backed; $2.4M is not, and must not be folded in.
    expect(note).toHaveTextContent("$755K reproducible from a calculation run");
    expect(note).toHaveTextContent("$2.4M not reproducible");
    expect(note).toHaveTextContent(
      "Only the reproducible total may be used outside this workspace.",
    );

    expect(screen.getByTestId("opportunity-trace-opp-090-scope")).toHaveTextContent(
      "No calculation run — amount cannot be reproduced",
    );
    expect(screen.getByTestId("opportunity-trace-opp-090-rate")).toHaveTextContent(
      "Reproducible from 18 included lines",
    );
  });

  it("shows every required evidence family as explicitly missing when no evidence pack is supplied", () => {
    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({ selected: makeCandidate() })}
        opportunitySet={makeOpportunitySet()}
      />,
    );

    const slaRow = screen.getByTestId("evidence-row-sla_performance");
    expect(slaRow).toHaveTextContent("required");
    expect(slaRow).toHaveTextContent("no governed evidence");
    expect(slaRow).toHaveTextContent("Not loaded");
    expect(slaRow).toHaveTextContent("parser not run");
    expect(slaRow).toHaveTextContent("no fact objects yet");
    expect(slaRow).toHaveTextContent("Service delivery manager");
    expect(slaRow).toHaveTextContent("sla-performance.csv");

    // Missing must never be presented as a zero amount.
    expect(slaRow).not.toHaveTextContent("$0");
    expect(
      screen.getByTestId("optimize-evidence-readiness-badge"),
    ).toHaveTextContent("0/8");
  });

  it("reports governed evidence state when an evidence pack is supplied", () => {
    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({ selected: makeCandidate() })}
        opportunitySet={makeOpportunitySet()}
        evidencePack={{
          tenant_key: "skyharbor-air",
          dataset_version: "source-v4-golden",
          contract_id: "CTR-090",
          ledger_items: [
            {
              ledger_item_id: "recoverable:sla-credit-gap",
              contract_id: "CTR-090",
              ledger_type: "recoverable_leakage",
              amount: 620_000,
              amount_state: "quantified",
              evidence_class: "system_evidenced",
              evidence_refs: [
                "source.golden_contract_sla_incident_service_credit_monthly",
              ],
              source_systems: ["ServiceNow"],
              source_record_ids: [
                "contract:CTR-090:monthly-sla-credit-history",
              ],
              document_refs: [],
              page_spans: [],
              calculation_rule: null,
              confidence: 0.91,
              review_state: "procurement_reviewed",
              decision_state: "candidate",
              workflow_event_id: null,
              tower_claim_id: null,
            },
          ],
        }}
      />,
    );

    const slaRow = screen.getByTestId("evidence-row-sla_performance");
    expect(slaRow).toHaveTextContent("system evidenced");
    expect(slaRow).toHaveTextContent("System loaded");
    expect(slaRow).toHaveTextContent("reviewed");
    expect(slaRow).toHaveTextContent("1 fact object");
    expect(slaRow).toHaveTextContent("ServiceNow");

    // A family the pack says nothing about stays explicitly missing.
    expect(screen.getByTestId("evidence-row-ticket_volume")).toHaveTextContent(
      "Not loaded",
    );
    expect(
      screen.getByTestId("optimize-evidence-readiness-badge"),
    ).toHaveTextContent("1/8");
  });
});
