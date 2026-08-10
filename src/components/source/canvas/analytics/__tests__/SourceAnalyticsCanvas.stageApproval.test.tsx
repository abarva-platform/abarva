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
  SAMPLE_SCOPE_STAGE,
  SAMPLE_SELECTION_STAGE,
} from "../sample-view-model";
import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";
import { buildSourceVendorSelectionReadiness } from "@/lib/source/vendor-selection-readiness";
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

describe("SourceAnalyticsCanvas — stage approval blocker", () => {
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
});

describe("SourceAnalyticsCanvas — selection readiness bridge", () => {
  beforeEach(() => {
    routerPush.mockClear();
    routerRefresh.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the vendor-selection readiness panel on the live Selection stage shell", () => {
    const selectionEvent: SourcingEventSummary = {
      ...EVENT,
      id: "evt-selection",
      code: "SRC-SELECTION-2026",
      name: "AMS Competitive RFP",
      currentStageKey: "selection",
      currentStageLabel: "Selection",
      valueAtStakeUsd: 1_000_000,
    };

    render(
      <SourceAnalyticsCanvas
        event={selectionEvent}
        viewStage="selection"
        tenantName="Demo Client"
        stageView={SAMPLE_SELECTION_STAGE}
        initialWorkspace="steps"
        selectionReadiness={buildSourceVendorSelectionReadiness({
          event: {
            id: selectionEvent.id,
            name: selectionEvent.name,
            currentStageKey: "selection",
            currentStageLabel: "Selection",
            valueAtStakeUsd: selectionEvent.valueAtStakeUsd,
          },
        })}
      />,
    );

    expect(
      screen.getByTestId("source-shell-selection-readiness-bridge"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ready for selection review?")).toBeInTheDocument();
    expect(screen.getByText("Evidence used")).toBeInTheDocument();
    expect(screen.queryByText("Modules used")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/READY_FOR_SELECTION_REVIEW|PROCEED_TO_BAFO/),
    ).not.toBeInTheDocument();
  });
});
