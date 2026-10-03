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

const generatedDocx = {
  id: "registered-docx-1",
  recordKind: "registry_artifact" as const,
  artifactCode: "d01_strategy_memo",
  stageKey: "strategy",
  sourceOrigin: "generated",
  originalName: "strategy-draft.docx",
  sourceFormat: "docx",
  status: "draft",
};

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

it("loads the registered draft body on demand from a metadata-only page", async () => {
  const body = "# Decision\nSynthetic basis only. <script>bad()</script>";
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ artifactCode: "d01_strategy_memo", body, format: "markdown" }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[
        {
          id: "draft-state-1",
          recordKind: "canvas_state",
          artifactCode: "d01_strategy_memo",
          stageKey: "strategy",
          status: "draft",
          body: null,
        },
        generatedDocx,
      ]}
    />,
  );

  const preview = screen.getByTestId("source-draft-preview-d01_strategy_memo");
  expect(preview).not.toHaveAttribute("open");
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Preview AI draft"));
  expect(preview).toHaveAttribute("open");
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/source/event-1/artifacts/d01_strategy_memo/body",
      { cache: "no-store" },
    ),
  );
  await waitFor(() => expect(preview.querySelector("pre")?.textContent).toBe(body));
  expect(preview.querySelector("script")).toBeNull();
  expect(preview).toHaveTextContent("Not a client-final artifact");
  expect(
    screen.getByTestId("source-artifact-review-queue-row-d01_strategy_memo"),
  ).toHaveTextContent("AI draft awaiting review");
});

it("does not show unrelated or registry-only text as the draft preview", async () => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ artifactCode: "d01_strategy_memo", body: "Resolved draft", format: "markdown" }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[
        {
          id: "different-state",
          recordKind: "canvas_state",
          artifactCode: "d02_value_target",
          stageKey: "strategy",
          status: "draft",
          body: "Private value target",
        },
        { ...generatedDocx, body: "Registry text is not the draft body" },
      ]}
    />,
  );

  const preview = screen.getByTestId("source-draft-preview-d01_strategy_memo");
  fireEvent.click(screen.getByText("Preview AI draft"));
  await screen.findByText("Resolved draft");
  expect(preview).not.toHaveTextContent("Private value target");
  expect(preview).not.toHaveTextContent("Registry text is not the draft body");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(
    screen.getByTestId("source-artifact-review-queue-row-d01_strategy_memo"),
  ).toHaveTextContent("AI draft awaiting review");
});

it("does not expose a canvas body before a generated artifact is registered", () => {
  const fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[
        {
          id: "orphaned-draft-state",
          recordKind: "canvas_state",
          artifactCode: "d01_strategy_memo",
          stageKey: "strategy",
          status: "draft",
          body: "Unregistered draft body",
        },
      ]}
    />,
  );

  expect(
    screen.queryByTestId("source-draft-preview-d01_strategy_memo"),
  ).not.toBeInTheDocument();
  expect(
    screen.getByTestId("source-artifact-review-queue-row-d01_strategy_memo"),
  ).toHaveTextContent("Not registered");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("keeps failed or mismatched reads out of the preview", async () => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ artifactCode: "d02_value_target", body: "Wrong artifact" }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[generatedDocx]}
    />,
  );

  const preview = screen.getByTestId("source-draft-preview-d01_strategy_memo");
  fireEvent.click(screen.getByText("Preview AI draft"));
  expect(await screen.findByRole("alert")).toHaveTextContent("No review is recorded");
  expect(preview).not.toHaveTextContent("Wrong artifact");
});

it("offers an explicit retry after a failed draft read", async () => {
  const fetchMock = jest
    .fn()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ artifactCode: "d01_strategy_memo", body: "Reviewed text" }),
    });
  global.fetch = fetchMock as unknown as typeof fetch;
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[generatedDocx]}
    />,
  );

  const preview = screen.getByTestId("source-draft-preview-d01_strategy_memo");
  fireEvent.click(screen.getByText("Preview AI draft"));
  expect(await screen.findByRole("alert")).toHaveTextContent("No review is recorded");
  expect(preview.querySelector("pre")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(preview.querySelector("pre")?.textContent).toBe("Reviewed text"));
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("does not carry a loaded draft into another event with the same artifact code", async () => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ artifactCode: "d01_strategy_memo", body: "First event private draft" }),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  const { rerender } = render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[generatedDocx]}
    />,
  );
  fireEvent.click(screen.getByText("Preview AI draft"));
  await screen.findByText("First event private draft");

  rerender(
    <SourceAnalyticsCanvas
      event={{ ...event, id: "event-2", code: "SRC-TEST-2" }}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[generatedDocx]}
    />,
  );

  expect(screen.queryByText("First event private draft")).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
