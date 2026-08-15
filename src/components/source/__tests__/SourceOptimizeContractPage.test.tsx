/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TextEncoder } from "util";

import { SourceOptimizeContractPage } from "../SourceOptimizeContractPage";
import type { ContractOptimizationSpine } from "@/lib/source/data-model/contract-optimization-spine";
import type { ContractOptimizationEvidencePack } from "@/lib/source/data-model/contract-optimization-evidence";
import type { ContractOptimizationOpportunitySet } from "@/lib/source/data-model/contract-optimization-opportunity";

const push = jest.fn();
const refresh = jest.fn();
const mockAgentDockProps: Array<{
  surface: string;
  defaultMode: string;
  surfaceContext: Record<string, unknown>;
  placeholder: string;
  onMessage: (text: string, attachments: unknown[]) => Promise<void>;
  workspace: React.ReactNode;
}> = [];

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => <nav data-testid="subnav-mock" />,
}));

jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: (props: {
    surface: string;
    defaultMode: string;
    surfaceContext: Record<string, unknown>;
    placeholder: string;
    onMessage: (text: string, attachments: unknown[]) => Promise<void>;
    workspace: React.ReactNode;
  }) => {
    mockAgentDockProps.push(props);
    return (
      <div data-testid="agent-dock-mock">
        {props.workspace}
        <button
          data-testid="agent-dock-collapsed-chip"
          type="button"
          onClick={() => props.onMessage("Explain current state", [])}
        >
          aVa
        </button>
      </div>
    );
  },
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

function makeReadySaaSEvidencePack(): ContractOptimizationEvidencePack {
  const refs = [
    "source.golden_contract_pricing_schedule",
    "source.golden_contract_invoice_lines",
    "source.golden_contract_rate_card_variance",
    "source.golden_contract_sla_incident_service_credit_monthly",
    "source.golden_contract_usage_entitlement_monthly",
    "source.golden_contract_change_order_register",
    "source.golden_contract_renewal_terms",
  ];

  return {
    tenant_key: "skyharbor_global",
    dataset_version: "source-v4-golden-contract-evidence",
    contract_id: "CTR-090",
    ledger_items: refs.map((ref, index) => ({
      ledger_item_id: `evidence-${index + 1}`,
      contract_id: "CTR-090",
      ledger_type: "recoverable_leakage",
      amount: 1000,
      amount_state: "quantified",
      evidence_class: "system_evidenced",
      evidence_refs: [ref],
      source_systems: ["Governed source extract"],
      source_record_ids: [`row-${index + 1}`],
      document_refs: [],
      page_spans: [],
      calculation_rule: null,
      confidence: 0.9,
      review_state: "procurement_reviewed",
      decision_state: "candidate",
      workflow_event_id: null,
      tower_claim_id: null,
    })),
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
    refresh.mockReset();
    mockAgentDockProps.length = 0;
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
    expect(screen.getByText("Select contract")).toBeInTheDocument();
    expect(screen.getByText("Lock baseline")).toBeInTheDocument();
    expect(screen.getByText("Diagnose opportunity")).toBeInTheDocument();
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
    expect(
      screen.getByTestId("baseline-readiness-calculation-lines"),
    ).toHaveTextContent(
      "1 of 1 stated amount is reproducible from calculation runs ($755K).",
    );
    expect(screen.getByText("Finance realization proof")).toBeInTheDocument();
    expect(screen.getByText("18 included")).toBeInTheDocument();
    expect(screen.getByText("2 pending · 3 excluded")).toBeInTheDocument();
  });

  it("mounts aVa on Optimize Contract with selected-contract surface context", () => {
    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({ selected: makeCandidate() })}
        opportunitySet={makeOpportunitySet()}
      />,
    );

    expect(screen.getByTestId("agent-dock-collapsed-chip")).toHaveTextContent(
      "aVa",
    );
    const props = mockAgentDockProps.at(-1);
    expect(props).toMatchObject({
      surface: "/source/optimize",
      defaultMode: "collapsed",
      placeholder: "Ask aVa about CTR-090 evidence, ledgers, or next action...",
    });
    expect(props?.surfaceContext).toMatchObject({
      sourceOptimizeContractMode: true,
      contractId: "CTR-090",
      selection: "Salesforce · Salesforce Data Platform Agreement 3",
      lens: "Optimize Contract",
      selectedOpportunityId: "opp-090-rate",
      selectedOpportunityLabel: "Rate-card variance",
    });
  });

  it("sends Optimize Contract aVa questions through the shared chat route with contract context", async () => {
    const encoder = new TextEncoder();
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: encoder.encode("Use the governed baseline."),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    });

    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({ selected: makeCandidate() })}
        opportunitySet={makeOpportunitySet()}
      />,
    );

    fireEvent.click(screen.getByTestId("agent-dock-collapsed-chip"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/chat/agent",
        expect.objectContaining({ method: "POST" }),
      );
    });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toMatchObject({
      message: "Explain current state",
      tenantName: "SkyHarbor Global",
      agentName: "aVa",
      surface: "/source/optimize",
      surfaceContext: {
        sourceOptimizeContractMode: true,
        contractId: "CTR-090",
        selection: "Salesforce · Salesforce Data Platform Agreement 3",
        selectedOpportunityId: "opp-090-rate",
        selectedOpportunityLabel: "Rate-card variance",
      },
      conversationHistory: [],
    });
  });

  it("separates strategy approval lifecycle gaps from readiness blockers", () => {
    const approvalStageSet = {
      ...makeOpportunitySet(),
      recommendation: "Approve the target position.",
      recommendationDetail:
        "The sourcing team can approve the position; value proof still needs finance acceptance.",
      actionState: "approve_vendor_outreach" as const,
      opportunities: makeOpportunitySet().opportunities.map((opportunity) => ({
        ...opportunity,
        stage: "target_position" as const,
      })),
      approvalRequests: [],
      negotiatedOutcomes: [],
      evidenceRequirements: [
        "Finance must accept the realized-value measurement before any external value claim.",
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
        opportunitySet={approvalStageSet}
        evidencePack={makeReadySaaSEvidencePack()}
      />,
    );

    expect(screen.getByTestId("optimize-step-plan")).toHaveAttribute(
      "data-state",
      "blocked",
    );
    expect(screen.getByTestId("optimize-next-blocker")).toHaveTextContent(
      "No governed strategy or vendor-outreach approval request is recorded.",
    );
    expect(screen.getByTestId("optimize-step-approve")).toHaveAttribute(
      "data-state",
      "future",
    );
    expect(screen.getByText("Workflow gaps")).toBeInTheDocument();
    expect(screen.queryByText("Open evidence gaps")).not.toBeInTheDocument();
    expect(
      screen.getAllByText(
        /A target position is visible, but Source needs a governed approval request/i,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "Evidence may be ready, but approval/outcome workflow state is not complete.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Collect the missing evidence rows before using a value number externally.",
      ),
    ).not.toBeInTheDocument();
  });

  it("creates a governed strategy approval request from the plan step", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        message: "Strategy approval request is ready for review.",
      }),
    });
    const targetPositionSet = {
      ...makeOpportunitySet(),
      opportunities: makeOpportunitySet().opportunities.map((opportunity) => ({
        ...opportunity,
        stage: "target_position" as const,
      })),
      approvalRequests: [],
      negotiatedOutcomes: [],
    };

    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({
          selected: makeCandidate(),
          missingEvidenceSources: [],
        })}
        opportunitySet={targetPositionSet}
        evidencePack={makeReadySaaSEvidencePack()}
      />,
    );

    expect(screen.getByTestId("workflow-action-panel")).toHaveTextContent(
      "Create the strategy approval request",
    );
    expect(screen.getByTestId("strategy-approval-packet")).toHaveTextContent(
      "Strategy packet for approval",
    );
    expect(screen.getByTestId("strategy-approval-packet")).toHaveTextContent(
      "Target ask",
    );
    expect(screen.getByTestId("strategy-approval-packet")).toHaveTextContent(
      "Review calculation lines.",
    );
    expect(screen.getByTestId("strategy-approval-packet")).toHaveTextContent(
      "Controlled outreach only; Finance/Tower still controls realized value.",
    );

    expect(
      screen.getByTestId("create-optimize-approval-request"),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Approval rationale"), {
      target: {
        value: "Target position is ready for controlled strategy approval.",
      },
    });
    fireEvent.click(screen.getByTestId("create-optimize-approval-request"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/source/optimize/contract/CTR-090/workflow",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            action: "create_approval_request",
            opportunityId: "opp-090-rate",
            rationale:
              "Target position is ready for controlled strategy approval.",
          }),
        }),
      );
      expect(refresh).toHaveBeenCalled();
    });
    expect(screen.getByTestId("workflow-action-message")).toHaveTextContent(
      "Strategy approval request is ready for review.",
    );
  });

  it("records an approval decision against a pending strategy request", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        message:
          "Strategy approval is recorded; negotiated outcome remains pending.",
      }),
    });
    const pendingApprovalSet = {
      ...makeOpportunitySet(),
      opportunities: makeOpportunitySet().opportunities.map((opportunity) => ({
        ...opportunity,
        stage: "target_position" as const,
      })),
      approvalRequests: [
        {
          approvalRequestId: "APR-090",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          approvalType: "vendor_outreach_strategy",
          approvalState: "pending" as const,
          requestedByRole: "sourcing_owner",
          requestedAt: "2027-06-30T00:00:00.000Z",
          decisions: [],
        },
      ],
      negotiatedOutcomes: [],
    };

    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({
          selected: makeCandidate(),
          missingEvidenceSources: [],
        })}
        opportunitySet={pendingApprovalSet}
        evidencePack={makeReadySaaSEvidencePack()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Approval rationale"), {
      target: { value: "Approved for controlled vendor outreach." },
    });
    fireEvent.click(screen.getByTestId("approve-optimize-approval-request"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/source/optimize/contract/CTR-090/workflow",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            action: "approve_request",
            opportunityId: "opp-090-rate",
            rationale: "Approved for controlled vendor outreach.",
          }),
        }),
      );
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("requests Finance/Tower confirmation after an agreed vendor outcome without claiming realized value", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        message:
          "Finance/Tower confirmation request is ready. No realized value has been recorded.",
      }),
    });
    const agreedOutcomeSet = {
      ...makeOpportunitySet(),
      opportunities: makeOpportunitySet().opportunities.map((opportunity) => ({
        ...opportunity,
        stage: "target_position" as const,
      })),
      approvalRequests: [
        {
          approvalRequestId: "APR-090-STRATEGY",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          approvalType: "vendor_outreach_strategy",
          approvalState: "approved" as const,
          requestedByRole: "sourcing_owner",
          requestedAt: "2027-06-30T00:00:00.000Z",
          decisions: [
            {
              decision: "approved" as const,
              rationale: "Approved for controlled vendor outreach.",
              decidedByRole: "sourcing_approver",
              decidedAt: "2027-06-30T00:00:00.000Z",
            },
          ],
        },
      ],
      negotiatedOutcomes: [
        {
          outcomeId: "OUT-090",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          outcomeState: "agreed" as const,
          agreedAmountUsd: null,
          effectiveDate: null,
          sourceDocumentId: null,
        },
      ],
      financeRealizations: [],
      evidenceRequirements: [],
      financeConfirmedUsd: 0,
    };

    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({
          selected: makeCandidate(),
          missingEvidenceSources: [],
        })}
        opportunitySet={agreedOutcomeSet}
        evidencePack={makeReadySaaSEvidencePack()}
      />,
    );

    expect(screen.getByTestId("optimize-step-prove_value")).toHaveAttribute(
      "data-state",
      "blocked",
    );
    expect(screen.getByTestId("workflow-action-panel")).toHaveTextContent(
      "Request Finance/Tower confirmation",
    );
    expect(screen.getByTestId("workflow-action-panel")).toHaveTextContent(
      "It does not write finance_realization rows or claim realized value.",
    );
    const valueProofStatus = screen.getByTestId("optimize-value-proof-status");
    expect(valueProofStatus).toHaveTextContent("realized value pending");
    expect(valueProofStatus).toHaveTextContent("Strategy approval");
    expect(valueProofStatus).toHaveTextContent("approved");
    expect(valueProofStatus).toHaveTextContent("Vendor outcome");
    expect(valueProofStatus).toHaveTextContent("agreed");
    expect(valueProofStatus).toHaveTextContent("Finance/Tower handoff");
    expect(valueProofStatus).toHaveTextContent("not requested");
    expect(valueProofStatus).toHaveTextContent(
      "No source.finance_realization row is present.",
    );

    expect(
      screen.getByTestId("request-optimize-finance-confirmation"),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Approval rationale"), {
      target: {
        value: "Vendor outcome is agreed; ask Finance to confirm value.",
      },
    });
    fireEvent.click(
      screen.getByTestId("request-optimize-finance-confirmation"),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/source/optimize/contract/CTR-090/workflow",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            action: "request_finance_confirmation",
            opportunityId: "opp-090-rate",
            rationale:
              "Vendor outcome is agreed; ask Finance to confirm value.",
          }),
        }),
      );
      expect(refresh).toHaveBeenCalled();
    });
    expect(screen.getByTestId("workflow-action-message")).toHaveTextContent(
      "No realized value has been recorded.",
    );
  });

  it("renders finance-confirmed value only when a realization row exists", () => {
    const confirmedSet = {
      ...makeOpportunitySet(),
      opportunities: makeOpportunitySet().opportunities.map((opportunity) => ({
        ...opportunity,
        stage: "finance_confirmed" as const,
      })),
      approvalRequests: [
        {
          approvalRequestId: "APR-090-STRATEGY",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          approvalType: "vendor_outreach_strategy",
          approvalState: "approved" as const,
          requestedByRole: "sourcing_owner",
          requestedAt: "2027-07-01T00:00:00.000Z",
          decisions: [
            {
              decision: "approved" as const,
              rationale: "Approved for controlled vendor outreach.",
              decidedByRole: "sourcing_approver",
              decidedAt: "2027-07-01T00:00:00.000Z",
            },
          ],
        },
        {
          approvalRequestId: "APR-090-FINANCE",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          approvalType: "finance_value_confirmation",
          approvalState: "approved" as const,
          requestedByRole: "finance_handoff_owner",
          requestedAt: "2027-07-02T00:00:00.000Z",
          decisions: [
            {
              decision: "approved" as const,
              rationale: "Finance confirmed periodized credit recovery.",
              decidedByRole: "finance_controller",
              decidedAt: "2027-07-03T00:00:00.000Z",
            },
          ],
        },
      ],
      negotiatedOutcomes: [
        {
          outcomeId: "OUT-090",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          outcomeState: "agreed" as const,
          agreedAmountUsd: 755_000,
          effectiveDate: "2027-07-01",
          sourceDocumentId: "doc-090-amendment",
        },
      ],
      financeRealizations: [
        {
          realizationId: "REAL-090",
          amountUsd: 740_000,
          basis: "Confirmed credits received against corrected invoices.",
          confirmationDate: "2027-07-31",
          owner: "Finance controller",
          towerClaimRefs: ["TOWER-CLAIM-090"],
          linkedOpportunityIds: ["opp-090-rate"],
          sourceRefs: [
            {
              sourceSystem: "ERP / AP",
              sourceRecordId: "credit-memo-090",
              sourceFileReport: "finance-realization.csv",
              tableName: "source.finance_realization_evidence",
              pageSpan: null,
              reviewState: "finance_confirmed",
            },
          ],
        },
      ],
      financeConfirmedUsd: 740_000,
    };

    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({
          selected: makeCandidate(),
          missingEvidenceSources: [],
        })}
        opportunitySet={confirmedSet}
        evidencePack={makeReadySaaSEvidencePack()}
      />,
    );

    const valueProofStatus = screen.getByTestId("optimize-value-proof-status");
    expect(screen.getByTestId("optimize-step-prove_value")).toHaveAttribute(
      "data-state",
      "complete",
    );
    expect(screen.getByTestId("optimize-value-proof-badge")).toHaveTextContent(
      "finance confirmed",
    );
    expect(valueProofStatus).toHaveTextContent("$740K");
    expect(valueProofStatus).toHaveTextContent(
      "Confirmed credits received against corrected invoices.",
    );
    expect(valueProofStatus).toHaveTextContent("TOWER-CLAIM-090");
    expect(valueProofStatus).toHaveTextContent(
      "source.finance_realization_evidence / credit-memo-090 / finance-realization.csv",
    );
  });

  it("keeps value proof blocked while the Finance/Tower request is still pending", () => {
    const pendingFinanceHandoffSet = {
      ...makeOpportunitySet(),
      opportunities: makeOpportunitySet().opportunities.map((opportunity) => ({
        ...opportunity,
        stage: "finance_confirmed" as const,
      })),
      approvalRequests: [
        {
          approvalRequestId: "APR-090-STRATEGY",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          approvalType: "vendor_outreach_strategy",
          approvalState: "approved" as const,
          requestedByRole: "sourcing_owner",
          requestedAt: "2027-07-01T00:00:00.000Z",
          decisions: [
            {
              decision: "approved" as const,
              rationale: "Approved for controlled vendor outreach.",
              decidedByRole: "sourcing_approver",
              decidedAt: "2027-07-01T00:00:00.000Z",
            },
          ],
        },
        {
          approvalRequestId: "APR-090-FINANCE",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          approvalType: "finance_value_confirmation",
          approvalState: "pending" as const,
          requestedByRole: "finance_handoff_owner",
          requestedAt: "2027-07-02T00:00:00.000Z",
          decisions: [],
        },
      ],
      negotiatedOutcomes: [
        {
          outcomeId: "OUT-090",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          outcomeState: "agreed" as const,
          agreedAmountUsd: 755_000,
          effectiveDate: "2027-07-01",
          sourceDocumentId: "doc-090-amendment",
        },
      ],
      financeRealizations: [
        {
          realizationId: "REAL-090",
          amountUsd: 740_000,
          basis: "Confirmed credits received against corrected invoices.",
          confirmationDate: "2027-07-31",
          owner: "Finance controller",
          towerClaimRefs: ["TOWER-CLAIM-090"],
          linkedOpportunityIds: ["opp-090-rate"],
          sourceRefs: [],
        },
      ],
      financeConfirmedUsd: 740_000,
    };

    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({
          selected: makeCandidate(),
          missingEvidenceSources: [],
        })}
        opportunitySet={pendingFinanceHandoffSet}
        evidencePack={makeReadySaaSEvidencePack()}
      />,
    );

    expect(screen.getByTestId("optimize-step-prove_value")).toHaveAttribute(
      "data-state",
      "blocked",
    );
    expect(screen.getByTestId("optimize-next-decision")).toHaveTextContent(
      "Wait for Finance/Tower confirmation",
    );
    expect(screen.getByTestId("optimize-next-blocker")).toHaveTextContent(
      "Finance/Tower confirmation request is pending.",
    );
    const valueProofStatus = screen.getByTestId("optimize-value-proof-status");
    expect(valueProofStatus).toHaveTextContent("Finance/Tower handoff");
    expect(valueProofStatus).toHaveTextContent("pending");
    expect(valueProofStatus).toHaveTextContent("$740K");
  });

  it("still exposes the Finance/Tower handoff action when value proof exists without a handoff request", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        message:
          "Finance/Tower confirmation request is ready. No realized value has been recorded.",
      }),
    });
    const confirmedWithoutHandoff = {
      ...makeOpportunitySet(),
      selectedOpportunityId: "opp-090-scope",
      opportunities: [
        ...makeOpportunitySet().opportunities.map((opportunity) => ({
          ...opportunity,
          stage: "finance_confirmed" as const,
        })),
        {
          ...makeOpportunitySet().opportunities[0],
          opportunityId: "opp-090-scope",
          label: "Scope rationalization",
          shortLabel: "Scope rationalization",
          stage: "finance_confirmed" as const,
        },
      ],
      approvalRequests: [
        {
          approvalRequestId: "APR-090-STRATEGY",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          approvalType: "vendor_outreach_strategy",
          approvalState: "approved" as const,
          requestedByRole: "sourcing_owner",
          requestedAt: "2027-07-01T00:00:00.000Z",
          decisions: [
            {
              decision: "approved" as const,
              rationale: "Approved for controlled vendor outreach.",
              decidedByRole: "sourcing_approver",
              decidedAt: "2027-07-01T00:00:00.000Z",
            },
          ],
        },
      ],
      negotiatedOutcomes: [
        {
          outcomeId: "OUT-090",
          caseId: "CASE-090",
          opportunityId: "opp-090-rate",
          outcomeState: "agreed" as const,
          agreedAmountUsd: 755_000,
          effectiveDate: "2027-07-01",
          sourceDocumentId: "doc-090-amendment",
        },
      ],
      financeRealizations: [
        {
          realizationId: "REAL-090",
          amountUsd: 740_000,
          basis: "Confirmed credits received against corrected invoices.",
          confirmationDate: "2027-07-31",
          owner: "Finance controller",
          towerClaimRefs: ["TOWER-CLAIM-090"],
          linkedOpportunityIds: ["opp-090-rate"],
          sourceRefs: [],
        },
      ],
      financeConfirmedUsd: 740_000,
    };

    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({
          selected: makeCandidate(),
          missingEvidenceSources: [],
        })}
        opportunitySet={confirmedWithoutHandoff}
        evidencePack={makeReadySaaSEvidencePack()}
      />,
    );

    expect(screen.getByTestId("optimize-step-prove_value")).toHaveAttribute(
      "data-state",
      "blocked",
    );
    expect(screen.getByTestId("optimize-next-blocker")).toHaveTextContent(
      "Finance-confirmed value exists, but no Finance/Tower handoff request is recorded.",
    );
    expect(screen.getByTestId("optimize-next-decision")).toHaveTextContent(
      "Record the Finance/Tower handoff",
    );
    expect(screen.getByTestId("workflow-action-panel")).toHaveTextContent(
      "Request Finance/Tower confirmation",
    );
    expect(screen.getByTestId("optimize-value-proof-status")).toHaveTextContent(
      "finance confirmed",
    );
    fireEvent.change(screen.getByLabelText("Approval rationale"), {
      target: {
        value:
          "Finance value exists; record the handoff request for the audit trail.",
      },
    });
    fireEvent.click(
      screen.getByTestId("request-optimize-finance-confirmation"),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/source/optimize/contract/CTR-090/workflow",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            action: "request_finance_confirmation",
            opportunityId: "opp-090-rate",
            rationale:
              "Finance value exists; record the handoff request for the audit trail.",
          }),
        }),
      );
    });
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

  it("drives the stage rail from real state instead of a fixed position", () => {
    render(
      <SourceOptimizeContractPage
        tenantName="SkyHarbor Global"
        asOfDateIso="2027-06-30T00:00:00.000Z"
        spine={makeSpine({ selected: makeCandidate() })}
        opportunitySet={makeOpportunitySet()}
      />,
    );

    // No evidence pack supplied, so required evidence is missing and the case
    // must hold at the evidence step — not sit on a hardcoded step 2.
    expect(screen.getByTestId("optimize-step-select")).toHaveAttribute(
      "data-state",
      "complete",
    );
    expect(screen.getByTestId("optimize-step-evidence")).toHaveAttribute(
      "data-state",
      "blocked",
    );
    // Nothing downstream of the current step may look done.
    for (const key of ["diagnose", "plan", "approve", "prove_value"]) {
      expect(screen.getByTestId(`optimize-step-${key}`)).toHaveAttribute(
        "data-state",
        "future",
      );
    }

    const next = screen.getByTestId("optimize-next-decision");
    expect(next).toHaveTextContent("Step 3 of 7");
    expect(next).toHaveTextContent("Collect 8 missing evidence families");
    expect(screen.getByTestId("optimize-next-blocker")).toHaveTextContent(
      "8 required evidence families have no governed evidence.",
    );
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
    expect(
      screen.getByTestId("baseline-readiness-calculation-lines"),
    ).toHaveTextContent(
      "1 of 2 stated amounts are reproducible; $2.4M is not reproducible yet.",
    );

    expect(
      screen.getByTestId("opportunity-trace-opp-090-scope"),
    ).toHaveTextContent("No calculation run — amount cannot be reproduced");
    expect(
      screen.getByTestId("opportunity-trace-opp-090-rate"),
    ).toHaveTextContent("Reproducible from 18 included lines");
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
