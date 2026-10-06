/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

jest.mock("@/components/agent/AskAnythingBar", () => ({
  AskAnythingBar: () => null,
}));

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import { SAMPLE_STRATEGY_STAGE } from "../strategy-sample-view-model";
import type { SourcingEventSummary } from "@/lib/source/types";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

const event = {
  id: "evt-1",
  code: "SRC-001",
  name: "Synthetic sourcing event",
  accountName: "Demo Client",
  leadAgent: "Sentinel",
  archetype: "AMS",
  rigor: "standard",
  status: "active",
  statusLabel: "Active",
  priority: "high",
  currentStageKey: "strategy",
  currentStageLabel: "Strategy",
  openAlerts: 0,
  owner: "Event Owner",
  agingDays: 1,
  blocker: null,
  nextAction: "Review draft",
  isAtRisk: false,
  valueAtStakeUsd: 0,
  projectedValueUsd: 0,
  realizedValueUsd: 0,
  nextDecision: "Review strategy",
} as SourcingEventSummary;

it("keeps generated AI drafts separate from evidence parser readiness", () => {
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Demo Client"
      initialWorkspace="files"
      artifacts={[
        {
          id: "draft-docx",
          stageKey: "strategy",
          artifactKind: "d01_strategy_memo",
          artifactFamily: "sourcing_strategy",
          sourceOrigin: "generated",
          title: "AI Strategy Draft",
          fileFormat: "docx",
          status: "draft",
          parseStatus: "pending",
          embeddingStatus: "pending",
          graphStatus: "pending",
        },
        {
          id: "draft-source",
          stageKey: "strategy",
          artifactKind: "d01_strategy_memo_source",
          artifactFamily: "sourcing_strategy",
          sourceOrigin: "generated",
          title: "AI Draft Source",
          fileFormat: "md",
          status: "draft",
          parseStatus: "pending",
          embeddingStatus: "pending",
          graphStatus: "pending",
        },
        {
          id: "uploaded-notes",
          stageKey: "strategy",
          artifactKind: "source_session_notes",
          artifactFamily: "meeting_notes",
          sourceOrigin: "uploaded",
          title: "Reviewed intake notes",
          fileFormat: "md",
          status: "preliminary",
          parseStatus: "parsed",
          embeddingStatus: "pending",
          graphStatus: "pending",
        },
        {
          id: "uploaded-recording",
          stageKey: "strategy",
          artifactKind: "source_session_notes",
          artifactFamily: "meeting_notes",
          sourceOrigin: "uploaded",
          title: "Recorded workshop",
          fileFormat: "mp3",
          status: "registered",
          parseStatus: "pending",
          embeddingStatus: "pending",
          graphStatus: "pending",
        },
      ]}
    />,
  );

  const summary = screen.getByTestId("source-evidence-readiness-summary");
  expect(summary).toHaveTextContent(/Stored evidence\s*2/i);
  expect(summary).toHaveTextContent(/Needs parser\s*1/i);
  expect(summary).toHaveTextContent(/Generated drafts\s*2/i);
  expect(screen.getByTestId("source-evidence-readiness-registered-only"))
    .toHaveTextContent("Recorded workshop");
  expect(screen.getByTestId("source-evidence-readiness-registered-only"))
    .not.toHaveTextContent("AI Strategy Draft");

  const map = screen.getByTestId("source-file-use-readiness-map");
  expect(map).toHaveTextContent("1/2 workflow-usable");
  const draftRow = within(map).getByText("AI Strategy Draft").closest("tr");
  expect(draftRow).toHaveTextContent("AI draft");
  expect(draftRow).toHaveTextContent("Review the AI draft");
  expect(draftRow).not.toHaveTextContent("Run or retry parser");
  const uploadedRow = within(map).getByText("Recorded workshop").closest("tr");
  expect(uploadedRow).toHaveTextContent("Run or retry parser");
});

it("does not present an all-draft file set as a zero-of-zero evidence score", () => {
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Demo Client"
      initialWorkspace="files"
      artifacts={[{
        id: "draft-docx",
        stageKey: "strategy",
        artifactKind: "d01_strategy_memo",
        artifactFamily: "sourcing_strategy",
        sourceOrigin: "generated",
        title: "AI Strategy Draft",
        fileFormat: "docx",
        status: "draft",
        parseStatus: "pending",
        embeddingStatus: "pending",
        graphStatus: "pending",
      }]}
    />,
  );

  expect(screen.getByTestId("source-evidence-readiness-summary"))
    .toHaveTextContent(/Generated drafts\s*1/i);
  const map = screen.getByTestId("source-file-use-readiness-map");
  expect(map).toHaveTextContent("No evidence files eligible");
  expect(map).not.toHaveTextContent("0/0 workflow-usable");
});

it("can regenerate an existing AI draft without accepting it as client-final", async () => {
  let bodyReads = 0;
  const fetchMock = jest.fn(async (url: string) => {
    if (url.endsWith("/body")) {
      bodyReads += 1;
      return {
        ok: true,
        json: async () => ({
          artifactCode: "d01_strategy_memo",
          body: bodyReads === 1 ? "Old AI draft" : "Regenerated AI draft",
          format: "markdown",
        }),
      };
    }
    return { ok: true, json: async () => ({ ok: true }) };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Demo Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[
        {
          id: "canvas-draft",
          recordKind: "canvas_state",
          artifactCode: "d01_strategy_memo",
          stageKey: "strategy",
          status: "draft",
          body: null,
        },
        {
          id: "registered-draft",
          recordKind: "registry_artifact",
          artifactCode: "d01_strategy_memo",
          stageKey: "strategy",
          sourceOrigin: "generated",
          originalName: "strategy-draft.docx",
          sourceFormat: "docx",
          status: "draft",
        },
      ]}
    />,
  );

  const row = screen.getByTestId("source-artifact-review-queue-row-d01_strategy_memo");
  expect(row).toHaveTextContent("AI draft awaiting review");
  expect(within(row).getByRole("button", { name: "Accept Client Final" }))
    .toBeInTheDocument();
  fireEvent.click(within(row).getByText("Preview AI draft"));
  await waitFor(() => expect(row).toHaveTextContent("Old AI draft"));
  fireEvent.click(within(row).getByRole("button", { name: "Regenerate draft" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/source/evt-1/artifacts/d01_strategy_memo/generate",
    { method: "POST", credentials: "include" },
  ));
  await waitFor(() => expect(within(row).getByText("Preview AI draft").closest("details"))
    .not.toHaveAttribute("open"));
  fireEvent.click(within(row).getByText("Preview AI draft"));
  await waitFor(() => expect(row).toHaveTextContent("Regenerated AI draft"));
  expect(bodyReads).toBe(2);
  expect(fetchMock).not.toHaveBeenCalledWith(
    expect.stringContaining("/client-final"),
    expect.anything(),
  );
});
