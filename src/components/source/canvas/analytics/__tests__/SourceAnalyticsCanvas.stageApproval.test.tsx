/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const routerPush = jest.fn();
const routerRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    replace: jest.fn(),
    refresh: routerRefresh,
  }),
  usePathname: () => "/source/events/evt-scope",
  useSearchParams: () => new URLSearchParams("stage=scope&workspace=approvals"),
  useParams: () => ({ eventId: "evt-scope" }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import {
  SAMPLE_BAFO_STAGE,
  SAMPLE_PRICING_STAGE,
  SAMPLE_SCOPE_STAGE,
} from "../sample-view-model";
import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";
import type { SourcingEventSummary } from "@/lib/source/types";

const EVENT: SourcingEventSummary = {
  id: "evt-scope",
  code: "SRC-AMS-STAGE-GATE-2026",
  name: "AMS Competitive RFP",
  accountName: "Demo Client",
  leadAgent: "Sentinel",
  archetype: "AMS",
  rigor: "strategic",
  status: "active",
  statusLabel: "Active",
  priority: "high",
  currentStageKey: "scope",
  currentStageLabel: "Scope",
  openAlerts: 0,
  owner: "Procurement",
  decisionOwner: "Business sponsor",
  agingDays: 1,
  blocker: null,
  nextAction: "Approve Scope gate",
  isAtRisk: false,
  valueAtStakeUsd: 9_000_000,
  projectedValueUsd: 0,
  realizedValueUsd: 0,
  nextDecision: "Advance to RFP",
};

const APPROVAL: ApprovalsInboxItem = {
  kind: "stage_gate",
  eventId: EVENT.id,
  eventCode: EVENT.code,
  eventName: EVENT.name,
  ask: "Approve advancing out of Scope.",
  readiness:
    "0 of 5 gate items met - you can approve with gaps (rationale required) or wait.",
  status: "ready_with_gaps",
  stageKey: "scope",
  stageLabel: "Scope",
  estimatedValueUsd: EVENT.valueAtStakeUsd,
  href: `/source/events/${EVENT.id}?stage=scope`,
  actionLabel: "Review & decide",
};

describe("SourceAnalyticsCanvas stage workflow", () => {
  beforeEach(() => {
    routerPush.mockClear();
    routerRefresh.mockClear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, stageAdvancedTo: "rfp" }),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders a real approve action in the featured Approvals card instead of looping back to steps", async () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={{
          ...SAMPLE_SCOPE_STAGE,
          gate: {
            ...SAMPLE_SCOPE_STAGE.gate,
            action: {
              eventId: EVENT.id,
              rationale:
                "Scope gate confirmed on the unified canvas - evidence complete, inputs reviewed, Scope final. Advancing to RFP.",
              confirmationKeys: [
                "scopeEvidenceComplete",
                "scopeInputsReviewed",
                "scopeStageFinal",
              ],
              redirectStageKey: "rfp",
            },
          },
        }}
        approvalItems={[APPROVAL]}
        initialWorkspace="approvals"
      />,
    );

    expect(screen.queryByTestId("source-approval-card-go-to-steps")).toBeNull();
    expect(
      screen.getByTestId("source-stage-gate-approval-control"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("source-stage-gate-approve")).toHaveTextContent(
      "Approve exception and advance",
    );
    expect(screen.queryByText(/Approve with gaps/)).toBeNull();
    expect(
      screen.getByText(/Exception approval is audited/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("source-stage-gate-approve"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/source/events/${EVENT.id}/approve`,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
    });
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({
      action: "approve",
      selfApproveIfAuthorized: true,
      confirmations: {
        scopeEvidenceComplete: true,
        scopeInputsReviewed: true,
        scopeStageFinal: true,
      },
    });
    expect(routerPush).toHaveBeenCalledWith(
      `/source/events/${EVENT.id}?stage=rfp`,
    );
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("renders one active stage canvas with a gated Continue button", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={SAMPLE_SCOPE_STAGE}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByTestId("source-shell-v2-steps")).toBeInTheDocument();
    expect(screen.queryByText("Your inputs & feedback")).toBeNull();
    expect(screen.queryByText("steps ready")).toBeNull();

    const continueButton = screen.getByRole("button", { name: /Continue/ });
    expect(continueButton).toBeDisabled();
    expect(screen.getByText(/Required before Continue/)).toBeInTheDocument();

    expect(
      screen.getByTestId("source-shell-evidence-ask-table"),
    ).toHaveTextContent("Evidence request");
    expect(
      screen.getByTestId("source-shell-evidence-ask-table"),
    ).toHaveTextContent("Where to get it");
    expect(
      screen.getByTestId("source-shell-evidence-ask-table"),
    ).toHaveTextContent("Grain / history");
    expect(
      screen.getByTestId("source-shell-evidence-ask-table"),
    ).toHaveTextContent("Writeback impact");
    const activeEvidenceRow = screen.getByTestId(
      "source-shell-evidence-ask-row-scope.volumetrics",
    );
    expect(activeEvidenceRow).toHaveTextContent("Provide the volumetrics");
    expect(activeEvidenceRow).toHaveTextContent("Volumetrics file");
    expect(activeEvidenceRow).toHaveTextContent("Required");
    expect(activeEvidenceRow).toHaveTextContent("CSV or XLSX");
    expect(activeEvidenceRow).toHaveTextContent("ITSM / finance baseline");
    expect(activeEvidenceRow).toHaveTextContent("Ravi Menon, IT-Ops");
    expect(activeEvidenceRow).toHaveTextContent(
      "Monthly by service tower for 12-24 months",
    );
    expect(activeEvidenceRow).toHaveTextContent(
      "Tickets, SLA misses, change orders, run volumes",
    );
    expect(activeEvidenceRow).toHaveTextContent("Scope volumetrics template");
    expect(activeEvidenceRow).toHaveTextContent("VOLUMETRICS_V1");
    expect(activeEvidenceRow).toHaveTextContent(
      "Scope memo, value lever sizing, pricing baseline",
    );
    expect(activeEvidenceRow).toHaveTextContent(
      "Readback: no typed facts yet.",
    );
    expect(activeEvidenceRow).toHaveTextContent("Upload below");

    fireEvent.click(
      screen.getByRole("button", {
        name: /Confirm the applications in scope/,
      }),
    );

    expect(
      screen.getByTestId("source-shell-active-step-needs"),
    ).toHaveTextContent("Complete");
    expect(
      screen.getByTestId("source-shell-active-step-needs"),
    ).toHaveTextContent("Readback: workflow confirmation captured.");
    expect(
      screen.getByTestId("source-shell-active-step-needs"),
    ).toHaveTextContent("Input captured; Continue.");
    expect(screen.getByRole("button", { name: /Continue/ })).toBeEnabled();
  });

  it("opens the approval workspace once all required stage inputs are complete", () => {
    const completedScopeStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={completedScopeStage}
        approvalItems={[APPROVAL]}
        initialWorkspace="steps"
      />,
    );

    expect(
      screen.getByTestId("source-shell-stage-ready-panel"),
    ).toHaveTextContent("Required inputs are complete");
    expect(screen.getByTestId("source-shell-v2-steps")).toHaveTextContent(
      "Review Files first; the approval gate stays blocked until artifact review is cleared or an exception is recorded",
    );
    expect(screen.getByTestId("source-shell-v2-steps")).not.toHaveTextContent(
      "Open the approval gate when the owner is ready",
    );
    expect(
      screen.getByTestId("source-shell-stage-ready-panel"),
    ).toHaveTextContent("artifact review items remain");
    expect(
      screen.getByTestId("source-stage-header-readiness"),
    ).toHaveTextContent("7 / 7");
    expect(
      screen.getByTestId("source-stage-header-readiness-label"),
    ).toHaveTextContent(/^inputs ready$/);
    expect(
      screen.getByTestId("source-journey-current-stage-status"),
    ).toHaveTextContent(/^review files$/);
    expect(screen.getByTestId("source-stage-ready-status")).toHaveTextContent(
      "7/7 complete",
    );
    expect(screen.getByTestId("source-stage-ready-status")).toHaveTextContent(
      "file review gaps",
    );
    expect(screen.getByTestId("source-stage-ready-status")).toHaveTextContent(
      "Accept artifacts in Files",
    );
    expect(
      screen.getByTestId("source-stage-ready-primary-files"),
    ).toHaveTextContent("Review Files and accept artifacts");
    expect(
      screen.getByTestId("source-stage-ready-open-approval"),
    ).toHaveTextContent("Open exception approval");
    expect(
      screen.queryByTestId("source-stage-ready-review-approval"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("source-shell-evidence-ask-row-scope.volumetrics"),
    ).toHaveTextContent("Readback: typed facts available.");
    expect(
      screen.getByTestId("source-shell-evidence-ask-row-scope.volumetrics"),
    ).toHaveAttribute("data-ready", "true");
    expect(
      screen.getByTestId("source-shell-evidence-ask-row-scope.volumetrics"),
    ).toHaveTextContent("Done");
    expect(
      screen.getByTestId("source-shell-evidence-ask-row-scope.volumetrics"),
    ).toHaveTextContent("Captured; review Files");

    fireEvent.click(screen.getByTestId("source-stage-ready-open-approval"));

    expect(routerPush).toHaveBeenCalledWith(
      `/source/events/${EVENT.id}?stage=scope&workspace=approvals`,
    );
    expect(screen.getByTestId("source-shell-v2-approvals")).toBeInTheDocument();
    expect(
      screen.getByTestId("source-shell-approval-readiness"),
    ).toHaveTextContent("Artifact queue blocks the gate");
    expect(
      screen.getByTestId("source-shell-approval-readiness"),
    ).toHaveTextContent("Not gate-ready");
    expect(
      screen.getByTestId("source-shell-approval-readiness"),
    ).toHaveTextContent("Clear artifact queue.");
    expect(
      screen.getByTestId("source-shell-approval-review-gaps"),
    ).toHaveTextContent("Clear these artifact actions before approval");
    expect(
      screen.getByTestId("source-shell-approval-review-gaps"),
    ).toHaveTextContent(
      "not decision-ready until the current-stage artifact queue is cleared",
    );
    expect(
      screen.getByTestId("source-shell-approval-open-files"),
    ).toHaveTextContent("Clear artifact queue");
    expect(
      screen.getByTestId("source-shell-approval-open-files"),
    ).toHaveAttribute(
      "href",
      `/source/events/${EVENT.id}?stage=scope&workspace=files`,
    );
  });

  it("discloses when a stage was approved with required inputs still open", () => {
    // Live-found: a stage reading 0/1 whose approval record was already in the
    // ledger still said "1 step left before Strategy can move to approval" —
    // describing an approved stage as pre-approval, and hiding the gap.
    // Approve-with-gaps is a supported decision; it just has to stay visible.
    const openScopeStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task, index) => ({
        ...task,
        state: index === 0 ? ("todo" as const) : task.state,
        evidenceComplete: index === 0 ? false : task.evidenceComplete,
      })),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={openScopeStage}
        approvalItems={[APPROVAL]}
        approvalLedger={[
          {
            stageKey: "scope",
            stageLabel: "Scope",
            index: 2,
            state: "approved",
            approverName: "A. Approver",
            approvedAtIso: "2026-08-01T00:00:00.000Z",
            authorizationNote: "",
            approverRationale: null,
          },
        ]}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByText(/was approved with/i)).toHaveTextContent(
      "required input",
    );
    expect(screen.getByText(/was approved with/i)).toHaveTextContent(
      "not mistaken for completed work",
    );
    expect(
      screen.queryByText(/left before Scope can move to approval/i),
    ).not.toBeInTheDocument();
  });

  it("does not claim stage inputs are complete while workflow steps are still open", () => {
    // Regression: the artifact-queue banner asserted "Stage inputs are
    // complete" regardless of workflow state, so a stage reading
    // "0/1 steps complete" contradicted itself inside the same panel.
    const openScopeStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task, index) => ({
        ...task,
        state: index === 0 ? ("todo" as const) : task.state,
        evidenceComplete: index === 0 ? false : task.evidenceComplete,
      })),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={openScopeStage}
        approvalItems={[APPROVAL]}
        initialWorkspace="approvals"
      />,
    );

    const gaps = screen.getByTestId("source-shell-approval-review-gaps");
    expect(gaps).not.toHaveTextContent("Stage inputs are complete");
    expect(gaps).toHaveTextContent("Stage inputs are still open");
    expect(gaps).toHaveTextContent("before the approval gate is decision-ready");
  });

  it("opens Files as the primary next action when completed workflow inputs still have artifact blockers", () => {
    const completedScopeStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={completedScopeStage}
        approvalItems={[APPROVAL]}
        initialWorkspace="steps"
      />,
    );

    fireEvent.click(screen.getByTestId("source-stage-ready-primary-files"));

    expect(screen.getByTestId("source-shell-v2-files")).toBeInTheDocument();
  });

  it("presents a direct approval gate action once workflow inputs and gate artifacts are ready", () => {
    const completedScopeStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={completedScopeStage}
        artifacts={[
          {
            id: "scope-app-inventory",
            artifactCode: "d04_app_inv",
            stageKey: "scope",
            status: "client_final",
            title: "Application Inventory & Tiering",
          },
          {
            id: "scope-memo",
            artifactCode: "d05_scope_memo",
            stageKey: "scope",
            status: "client_final",
            isClientFinal: true,
            title: "Scope Memo with Boundaries",
            body: `Decision requested: approve the Scope boundary for the managed-services sourcing event.
            Executive summary: the application estate, service tower, exclusion log, ticket baseline,
            retained responsibility model, and sponsor commitment are complete enough for a sourcing
            owner to advance to the next gate. Scope in: Tier 1 and Tier 2 business applications,
            L2/L3 support services, knowledge transfer, service desk escalation, incident triage,
            and operational reporting. Scope out: end-user device support, SOC operations, business
            process ownership, and applications already in decommission. Evidence basis: application
            inventory, scope memo, exclusion log, ticket history, retained responsibility matrix, and
            sponsor sign-off. Required exhibits: in scope towers, support tiers, exclusions,
            run change boundary, open scope questions. The in scope towers are application
            management, incident management, release support, and reporting. Support tiers are
            Tier 1 business-critical and Tier 2 important applications. Exclusions are end-user
            device support, SOC operations, and decommissioning apps. The run/change boundary puts
            steady-state support in scope and project delivery out of scope. Open scope questions:
            final vendor-facing volume bands and SLA history must be confirmed in the next gate.
            sponsor sign-off. Remaining risk: pricing should continue to validate volumes and SLA
            history before vendor release. Recommended action: open the Scope approval gate and
            advance to RFP preparation.`,
            bodyGenerationMetadata: {
              qualityGate: {
                passed: true,
                overallScore: 9,
                finalSummary: "Passed: evidence-bound scope memo.",
                unsupportedClaims: [],
                missingEvidence: [],
              },
            },
          },
          {
            id: "scope-exclusions",
            artifactCode: "d06_excl_log",
            stageKey: "scope",
            status: "client_final",
            title: "Exclusion Log",
          },
          {
            id: "scope-ticket-history",
            artifactCode: "d07_ticket_synth",
            stageKey: "scope",
            status: "client_final",
            title: "Ticket History Synthesis",
          },
        ]}
        approvalItems={[APPROVAL]}
        initialWorkspace="steps"
      />,
    );

    expect(
      screen.getByTestId("source-shell-stage-ready-panel"),
    ).toHaveTextContent("All required evidence is ready for Scope");
    expect(
      screen.getByTestId("source-stage-header-readiness-label"),
    ).toHaveTextContent(/^ready$/);
    expect(
      screen.getByTestId("source-journey-current-stage-status"),
    ).toHaveTextContent(/^7\/7$/);
    expect(screen.getByTestId("source-stage-ready-status")).toHaveTextContent(
      "Ready for approval",
    );
    expect(screen.getByTestId("source-stage-ready-status")).toHaveTextContent(
      "Open approval gate",
    );
    expect(
      screen.queryByTestId("source-stage-ready-primary-files"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("source-stage-ready-open-approval"));

    expect(routerPush).toHaveBeenCalledWith(
      `/source/events/${EVENT.id}?stage=scope&workspace=approvals`,
    );
    expect(screen.getByTestId("source-shell-v2-approvals")).toBeInTheDocument();
    expect(
      screen.getByTestId("source-shell-approval-readiness"),
    ).toHaveTextContent("Ready to decide");
  });

  it("shows BAFO scenario compare on the actual stage-ready workflow surface", () => {
    const completedBafoStage = {
      ...SAMPLE_BAFO_STAGE,
      tasks: SAMPLE_BAFO_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };
    const bafoEvent: SourcingEventSummary = {
      ...EVENT,
      currentStageKey: "bafo",
      currentStageLabel: "BAFO",
      nextAction: "Open BAFO approval gate",
    };

    render(
      <SourceAnalyticsCanvas
        event={bafoEvent}
        viewStage="bafo"
        tenantName="Demo Client"
        stageView={completedBafoStage}
        approvalItems={[]}
        initialWorkspace="steps"
      />,
    );

    expect(
      screen.getByTestId("source-shell-stage-ready-panel"),
    ).toHaveTextContent("Required inputs are complete");
    expect(
      screen.getByTestId("source-bafo-scenario-compare"),
    ).toHaveTextContent("What can we realistically improve in BAFO?");
    expect(
      screen.getByTestId("source-bafo-scenario-compare"),
    ).toHaveTextContent("Base-case upside to test");
    expect(
      screen.getByTestId("source-bafo-scenario-compare"),
    ).toHaveTextContent("Prepare negotiation brief");
  });

  it("consolidates commercial lenses above the active workflow canvas", () => {
    render(
      <SourceAnalyticsCanvas
        event={{
          ...EVENT,
          currentStageKey: "bafo",
          currentStageLabel: "BAFO",
          nextAction: "Prepare BAFO asks",
        }}
        viewStage="bafo"
        tenantName="Demo Client"
        stageView={SAMPLE_BAFO_STAGE}
        initialWorkspace="steps"
      />,
    );

    expect(
      screen.getByTestId("source-commercial-active-canvas"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("source-shell-v2-steps")).toBeInTheDocument();
    expect(screen.getByTestId("source-shell-v2-rail")).toBeInTheDocument();

    [
      "summary",
      "pricing",
      "bafo",
      "risks",
      "readiness",
      "missions",
      "signals",
      "linked_program",
    ].forEach((lens) => {
      expect(
        screen.getByTestId(`source-commercial-nav-${lens}`),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("source-commercial-nav-pricing")).toHaveAttribute(
      "href",
      `/source/events/${EVENT.id}?stage=pricing`,
    );
    expect(
      screen.getByTestId("source-commercial-active-lens"),
    ).toHaveTextContent("Where are we commercially in BAFO?");

    fireEvent.click(screen.getByTestId("source-commercial-nav-linked_program"));

    expect(
      screen.getByTestId("source-commercial-active-lens"),
    ).toHaveTextContent("What downstream program must be prepared?");
    expect(
      screen.getByTestId("source-commercial-active-lens"),
    ).toHaveTextContent("Carry open actions into the next stage");
    expect(screen.getByTestId("source-shell-v2-steps")).toBeInTheDocument();
  });

  it("shows pricing comparability drilldown on the actual live workflow canvas", () => {
    render(
      <SourceAnalyticsCanvas
        event={{
          ...EVENT,
          currentStageKey: "pricing",
          currentStageLabel: "Pricing",
          nextAction: "Clarify vendor pricing gaps",
        }}
        viewStage="pricing"
        tenantName="Demo Client"
        stageView={SAMPLE_PRICING_STAGE}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByTestId("source-stage-decision-lens")).toHaveTextContent(
      "Why is this vendor not comparable?",
    );
    expect(
      screen.getByTestId("source-pricing-completeness-summary"),
    ).toHaveTextContent("Comparable vendors");
    expect(
      screen.getByTestId("source-pricing-cross-vendor-gaps"),
    ).toHaveTextContent("Application count varies by vendor");
    expect(
      screen.getByTestId("source-pricing-vendor-vendor-b"),
    ).toHaveTextContent(
      "SOC-2 compliance cost gap and security tower exclusion",
    );
    expect(
      screen.getByTestId("source-pricing-vendor-vendor-c"),
    ).toHaveTextContent("155 applications in scope");
    expect(
      screen.getByRole("button", { name: /Send clarification request/ }),
    ).toBeDisabled();
    expect(screen.getByTestId("source-shell-v2-steps")).toBeInTheDocument();
  });
});
