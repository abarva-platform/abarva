/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import { SAMPLE_STRATEGY_STAGE } from "../strategy-sample-view-model";
import type { SourcingEventSummary } from "@/lib/source/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source/events/event-1",
  useSearchParams: () => new URLSearchParams("stage=strategy&workspace=files"),
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
  nextAction: "Review artifacts",
  isAtRisk: false,
  valueAtStakeUsd: 0,
  projectedValueUsd: 0,
  realizedValueUsd: 0,
  nextDecision: "Strategy gate",
  approvalPolicyCode: "self_v1",
};

it("offers governed draft generation when a required artifact has evidence but no final", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 409,
    json: async () => ({
      ok: false,
      detail: "Upstream evidence is not ready.",
    }),
  }) as jest.Mock;
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[
        {
          id: "uploaded-evidence-1",
          artifactCode: "d01_strategy_memo",
          stageKey: "strategy",
          recordKind: "registry_artifact",
          sourceOrigin: "uploaded",
          originalName: "strategy-input.txt",
          sourceFormat: "text",
          parseStatus: "parsed",
          status: "uploaded",
        },
      ]}
    />,
  );

  expect(
    screen.getByTestId("source-artifact-review-queue-row-d01_strategy_memo"),
  ).toHaveTextContent(/evidence registered/i);
  fireEvent.click(screen.getByTestId("source-generate-artifact-d01_strategy_memo"));
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/source/event-1/artifacts/d01_strategy_memo/generate",
      { method: "POST", credentials: "include" },
    ),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Upstream evidence is not ready.",
  );
  expect(
    screen.getByTestId("source-artifact-review-queue-row-d01_strategy_memo"),
  ).toHaveTextContent(/evidence registered/i);
  expect(
    screen.queryByTestId("source-accept-client-final-d01_strategy_memo"),
  ).not.toBeInTheDocument();
});
