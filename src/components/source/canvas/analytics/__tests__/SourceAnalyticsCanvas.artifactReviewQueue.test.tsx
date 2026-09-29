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

it("counts only gate-relevant artifacts in the approval queue", () => {
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[]}
    />,
  );

  const queue = screen.getByTestId("source-artifact-review-queue");
  expect(queue).toHaveTextContent("2 blockers");
  expect(screen.getByTestId("source-artifact-review-queue-row-d01_strategy_memo"))
    .toBeInTheDocument();
  expect(screen.getByTestId("source-artifact-review-queue-row-d02_value_target"))
    .toBeInTheDocument();
  expect(screen.queryByTestId("source-artifact-review-queue-row-d03_archetype_decision"))
    .not.toBeInTheDocument();
  expect(screen.getByTestId("source-artifact-lifecycle-row-d03_archetype_decision"))
    .toBeInTheDocument();
  expect(screen.getByTestId("source-generate-artifact-d03_archetype_decision"))
    .toBeInTheDocument();
});

it("does not offer draft generation from a past stage's missing catalog row", () => {
  render(
    <SourceAnalyticsCanvas
      event={{ ...event, currentStageKey: "scope", currentStageLabel: "Scope" }}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[]}
    />,
  );

  expect(screen.getByTestId("source-artifact-lifecycle-row-d03_archetype_decision"))
    .toBeInTheDocument();
  expect(screen.queryByTestId("source-generate-artifact-d03_archetype_decision"))
    .not.toBeInTheDocument();
});

it("offers a current-stage Client Final revision without allowing past-stage replacement", () => {
  const artifacts = [{
    id: "reviewed-d02",
    artifactCode: "d02_value_target",
    stageKey: "strategy" as const,
    status: "client_final",
    sourceOrigin: "reuploaded",
    isClientFinal: true,
    isCurrentAuthoritative: true,
    bodyGenerationMetadata: { qualityGate: {
      passed: true, overallScore: 9, finalSummary: "Passed synthetic review.",
      unsupportedClaims: [], missingEvidence: [],
    } },
  }];
  const { rerender } = render(
    <SourceAnalyticsCanvas event={event} viewStage="strategy" tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE} initialWorkspace="files" artifacts={artifacts} />,
  );
  expect(screen.getByTestId("source-artifact-lifecycle-row-d02_value_target"))
    .toHaveTextContent("Client-approved final");
  expect(screen.getByTestId("source-accept-client-final-toggle-d02_value_target"))
    .toHaveTextContent("Replace Client Final");

  rerender(<SourceAnalyticsCanvas event={{ ...event, currentStageKey: "scope", currentStageLabel: "Scope" }}
    viewStage="strategy" tenantName="Test Client" stageView={SAMPLE_STRATEGY_STAGE}
    initialWorkspace="files" artifacts={artifacts} />);
  expect(screen.queryByTestId("source-accept-client-final-toggle-d02_value_target"))
    .not.toBeInTheDocument();
});

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

it("shows a persisted generation review receipt for the matching draft in Files", () => {
  const body = "Synthetic review-only strategy draft.";
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[
        {
          id: "state-d01",
          recordKind: "canvas_state",
          artifactCode: "d01_strategy_memo",
          artifactKind: "d01_strategy_memo",
          stageKey: "strategy",
          status: "needs_review",
          linkedArtifactId: "registry-d01",
          body,
          bodyGenerationMetadata: {
            qualityGate: { passed: false, finalSummary: "Unsupported value claim." },
          },
        },
        {
          id: "registry-d01",
          recordKind: "registry_artifact",
          artifactCode: "d01_strategy_memo",
          artifactKind: "d01_strategy_memo",
          stageKey: "strategy",
          sourceOrigin: "generated",
          status: "draft",
          bodyMarkdown: body,
        },
      ]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Show audit metrics" }));
  expect(screen.getByTestId("source-artifact-consulting-gate-d01_strategy_memo"))
    .toHaveTextContent("Gate B failed");
  expect(screen.getAllByText("Unsupported value claim.")).toHaveLength(2);
});

it("shows a receipt from a metadata-only linked state without hydrating draft body", () => {
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[
        {
          id: "state-d01",
          recordKind: "canvas_state",
          artifactCode: "d01_strategy_memo",
          artifactKind: "d01_strategy_memo",
          stageKey: "strategy",
          linkedArtifactId: "registry-d01",
          body: null,
          bodyGenerationMetadata: {
            qualityGate: { passed: false, finalSummary: "The review rejected an unsupported claim." },
          },
        },
        {
          id: "registry-d01",
          recordKind: "registry_artifact",
          artifactCode: "d01_strategy_memo",
          artifactKind: "d01_strategy_memo",
          stageKey: "strategy",
          sourceOrigin: "generated",
          status: "draft",
        },
      ]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Show audit metrics" }));
  expect(screen.getByTestId("source-artifact-consulting-gate-d01_strategy_memo"))
    .toHaveTextContent("Gate B failed");
  expect(screen.getAllByText("The review rejected an unsupported claim.")).toHaveLength(2);
});

it("does not attribute a persisted review receipt to different registry body bytes", () => {
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[
        {
          id: "state-d01",
          recordKind: "canvas_state",
          artifactCode: "d01_strategy_memo",
          artifactKind: "d01_strategy_memo",
          stageKey: "strategy",
          linkedArtifactId: "registry-d01",
          body: "Reviewed draft body.",
          bodyGenerationMetadata: {
            qualityGate: { passed: true, finalSummary: "Review belongs to state body." },
          },
        },
        {
          id: "registry-d01",
          recordKind: "registry_artifact",
          artifactCode: "d01_strategy_memo",
          artifactKind: "d01_strategy_memo",
          stageKey: "strategy",
          sourceOrigin: "generated",
          status: "draft",
          bodyMarkdown: "Different registry body.",
        },
      ]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Show audit metrics" }));
  expect(screen.getByTestId("source-artifact-consulting-gate-d01_strategy_memo"))
    .toHaveTextContent("Gate B required");
  expect(screen.queryByText("Review belongs to state body.")).not.toBeInTheDocument();
});

it("does not attribute a metadata-only receipt when registry body bytes cannot be compared", () => {
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[
        {
          id: "state-d01",
          recordKind: "canvas_state",
          artifactCode: "d01_strategy_memo",
          artifactKind: "d01_strategy_memo",
          stageKey: "strategy",
          linkedArtifactId: "registry-d01",
          body: null,
          bodyGenerationMetadata: {
            qualityGate: { passed: true, finalSummary: "Unverifiable review." },
          },
        },
        {
          id: "registry-d01",
          recordKind: "registry_artifact",
          artifactCode: "d01_strategy_memo",
          artifactKind: "d01_strategy_memo",
          stageKey: "strategy",
          sourceOrigin: "generated",
          status: "draft",
          bodyMarkdown: "Current registry body.",
        },
      ]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Show audit metrics" }));
  expect(screen.getByTestId("source-artifact-consulting-gate-d01_strategy_memo"))
    .toHaveTextContent("Gate B required");
  expect(screen.queryByText("Unverifiable review.")).not.toBeInTheDocument();
});

it("does not attribute a receipt from an unlinked state to a same-code registry file", () => {
  render(
    <SourceAnalyticsCanvas
      event={event}
      viewStage="strategy"
      tenantName="Test Client"
      stageView={SAMPLE_STRATEGY_STAGE}
      initialWorkspace="files"
      artifacts={[
        {
          id: "state-d01",
          recordKind: "canvas_state",
          artifactCode: "d01_strategy_memo",
          artifactKind: "d01_strategy_memo",
          stageKey: "strategy",
          linkedArtifactId: "another-registry-file",
          body: "Synthetic review-only strategy draft.",
          bodyGenerationMetadata: {
            qualityGate: { passed: true, finalSummary: "Linked elsewhere." },
          },
        },
        {
          id: "registry-d01",
          recordKind: "registry_artifact",
          artifactCode: "d01_strategy_memo",
          artifactKind: "d01_strategy_memo",
          stageKey: "strategy",
          sourceOrigin: "generated",
          status: "draft",
        },
      ]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Show audit metrics" }));
  expect(screen.getByTestId("source-artifact-consulting-gate-d01_strategy_memo"))
    .toHaveTextContent("Gate B required");
  expect(screen.queryByText("Linked elsewhere.")).not.toBeInTheDocument();
});
