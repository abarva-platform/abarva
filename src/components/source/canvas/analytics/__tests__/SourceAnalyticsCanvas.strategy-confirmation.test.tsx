/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import { SAMPLE_STRATEGY_STAGE } from "../strategy-sample-view-model";
import { evidenceForStage } from "@/lib/source/canonical-specs/evidence-requirements";
import type { SourceEventEvidence } from "@/lib/source/canvas-substrate";
import type { SourcingEventSummary } from "@/lib/source/types";

const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh }),
  usePathname: () => "/source/events/event-1",
  useSearchParams: () => new URLSearchParams("stage=strategy"),
  useParams: () => ({ eventId: "event-1" }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

const event: SourcingEventSummary = {
  id: "event-1",
  code: "SRC-TEST-1",
  name: "Synthetic sourcing event",
  accountName: "Test Client",
  leadAgent: "Sentinel",
  archetype: "AMS",
  rigor: "strategic",
  status: "active",
  statusLabel: "Active",
  priority: "high",
  currentStageKey: "strategy",
  currentStageLabel: "Strategy",
  openAlerts: 0,
  owner: "Event Owner",
  decisionOwner: "Event Owner",
  agingDays: 1,
  blocker: null,
  nextAction: "Confirm strategy",
  isAtRisk: false,
  valueAtStakeUsd: 0,
  projectedValueUsd: 0,
  realizedValueUsd: 0,
  nextDecision: "Strategy gate",
  approvalPolicyCode: "self_v1",
};

const stageView = {
  ...SAMPLE_STRATEGY_STAGE,
  provenance: "live" as const,
  tasks: SAMPLE_STRATEGY_STAGE.tasks.map((task) => ({
    ...task,
    title: "Confirm strategy",
    cta: "Confirm strategy",
    confirmationVersion: "version-1",
  })),
};

const evidenceStates: SourceEventEvidence[] = evidenceForStage("strategy")
  .filter((requirement) => requirement.level === "required")
  .map((requirement, index) => ({
    id: `evidence-${index}`,
    sourceEventId: event.id,
    tenantKey: "test-client",
    requirementId: requirement.requirementId,
    stage: "strategy",
    currentState: "Usable Evidence",
    sourceArtifactId: null,
    sourceEventFactIds: [`fact-${index}`],
    notes: null,
    lastSyncedAt: null,
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: "2026-09-28T00:00:00.000Z",
  }));

describe("mounted Strategy confirmation", () => {
  beforeEach(() => {
    refresh.mockClear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, receiptId: "receipt-1" }),
    }) as jest.Mock;
  });

  it("posts the governed version and waits for server readback before marking complete", async () => {
    const { rerender } = render(
      <SourceAnalyticsCanvas event={event} viewStage="strategy" tenantName="Test Client" stageView={stageView} evidenceStates={evidenceStates} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Confirm strategy$/ }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/source/event-1/strategy-confirmation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ version: "version-1", confirmed: true }),
      }),
    );
    expect(screen.getByTestId("source-journey-current-stage-status")).toHaveTextContent("0/1");

    rerender(
      <SourceAnalyticsCanvas
        event={event}
        viewStage="strategy"
        tenantName="Test Client"
        evidenceStates={evidenceStates}
        stageView={{
          ...stageView,
          tasks: stageView.tasks.map((task) => ({ ...task, evidenceComplete: true })),
        }}
      />,
    );
    expect(screen.getByTestId("source-journey-current-stage-status")).toHaveTextContent("review files");
  });

  it("does not offer a local-only completion when no governed version exists", () => {
    render(
      <SourceAnalyticsCanvas
        event={event}
        viewStage="strategy"
        tenantName="Test Client"
        evidenceStates={evidenceStates}
        stageView={{
          ...stageView,
          tasks: stageView.tasks.map((task) => ({ ...task, confirmationVersion: undefined })),
        }}
      />,
    );
    expect(screen.queryByRole("button", { name: /^Confirm strategy$/ })).not.toBeInTheDocument();
    expect(screen.getByText(/governed event owner confirmation/i)).toBeInTheDocument();
  });

  it("keeps the mounted step open when the server rejects a stale version", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "stale_strategy", detail: "Reload and review the changed strategy." }),
    }) as jest.Mock;

    render(
      <SourceAnalyticsCanvas event={event} viewStage="strategy" tenantName="Test Client" stageView={stageView} evidenceStates={evidenceStates} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Confirm strategy$/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Reload and review the changed strategy.");
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByTestId("source-journey-current-stage-status")).toHaveTextContent("0/1");
  });

  it("shows Event Owner evidence copy for self policy while retaining strict sponsor copy", () => {
    const mounted = render(
      <SourceAnalyticsCanvas event={event} viewStage="strategy" tenantName="Test Client" stageView={stageView} evidenceStates={evidenceStates} />,
    );
    expect(screen.getByTestId("source-shell-active-step-needs")).toHaveTextContent("Event Owner");
    expect(screen.getByTestId("source-shell-active-step-needs")).not.toHaveTextContent("sponsor");
    expect(screen.getByTestId("source-shell-active-step-guide")).toHaveTextContent("Event Owner");
    expect(screen.getByTestId("source-shell-active-step-guide")).not.toHaveTextContent("Accountable sponsor");

    mounted.rerender(
      <SourceAnalyticsCanvas
        event={{ ...event, approvalPolicyCode: "legacy_signed_scope_v1" }}
        viewStage="strategy"
        tenantName="Test Client"
        stageView={SAMPLE_STRATEGY_STAGE}
        evidenceStates={evidenceStates}
      />,
    );
    expect(screen.getByTestId("source-shell-active-step-needs")).toHaveTextContent("Accountable sponsor");
    expect(screen.getByTestId("source-shell-active-step-guide")).toHaveTextContent("Accountable sponsor");
  });
});
