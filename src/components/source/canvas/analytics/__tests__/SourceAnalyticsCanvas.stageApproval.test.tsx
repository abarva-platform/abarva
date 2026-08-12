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
import { SAMPLE_SCOPE_STAGE } from "../sample-view-model";
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
    ).toHaveTextContent("Evidence item");
    expect(
      screen.getByTestId("source-shell-evidence-ask-table"),
    ).toHaveTextContent("Source / owner");
    expect(
      screen.getByTestId("source-shell-evidence-ask-table"),
    ).toHaveTextContent("Parser writeback");
    const activeEvidenceRow = screen.getByTestId(
      "source-shell-evidence-ask-row-scope.volumetrics",
    );
    expect(activeEvidenceRow).toHaveTextContent("Provide the volumetrics");
    expect(activeEvidenceRow).toHaveTextContent("Volumetrics file");
    expect(activeEvidenceRow).toHaveTextContent("CSV or XLSX");
    expect(activeEvidenceRow).toHaveTextContent("ITSM / finance baseline");
    expect(activeEvidenceRow).toHaveTextContent("Ravi Menon, IT-Ops");
    expect(activeEvidenceRow).toHaveTextContent(
      "Tickets, SLA misses, change orders, run volumes",
    );
    expect(activeEvidenceRow).toHaveTextContent("VOLUMETRICS_V1");
    expect(activeEvidenceRow).toHaveTextContent("Upload below");

    fireEvent.click(
      screen.getByRole("button", {
        name: /Confirm the applications in scope/,
      }),
    );

    expect(
      screen.getByTestId("source-shell-active-step-needs"),
    ).toHaveTextContent("Complete");
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
    expect(
      screen.getByTestId("source-shell-stage-ready-panel"),
    ).toHaveTextContent("artifact review items remain");

    fireEvent.click(screen.getByTestId("source-stage-ready-open-approval"));

    expect(routerPush).toHaveBeenCalledWith(
      `/source/events/${EVENT.id}?stage=scope&workspace=approvals`,
    );
    expect(screen.getByTestId("source-shell-v2-approvals")).toBeInTheDocument();
    expect(
      screen.getByTestId("source-shell-approval-readiness"),
    ).toHaveTextContent("Not ready to decide");
    expect(
      screen.getByTestId("source-shell-approval-readiness"),
    ).toHaveTextContent("Review Files gaps.");
    expect(
      screen.getByTestId("source-shell-approval-review-gaps"),
    ).toHaveTextContent("Review gaps before approval");
    expect(
      screen.getByTestId("source-shell-approval-open-files"),
    ).toHaveAttribute(
      "href",
      `/source/events/${EVENT.id}?stage=scope&workspace=files`,
    );
  });
});
