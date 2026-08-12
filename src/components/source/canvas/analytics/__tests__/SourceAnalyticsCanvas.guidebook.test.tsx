/**
 * @jest-environment jsdom
 */

// Renders the real (unmocked) SourceAnalyticsCanvas guidebook path. Authored
// guidebooks render their persisted content; missing guidebooks still expose a
// default stage playbook so users are not left without workshop guidance.

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
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

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import { SAMPLE_SCOPE_STAGE } from "../sample-view-model";
import type { SourcingEventSummary } from "@/lib/source/types";
import type { SourceStageGuidebookRecord } from "@/lib/source/stage-guidebooks/types";

function makeEvent(
  overrides: Partial<SourcingEventSummary> = {},
): SourcingEventSummary {
  return {
    id: "evt-1",
    code: "LSH-AMS-2026",
    name: "Lakeshore AMS Renewal",
    accountName: "Lakeshore",
    leadAgent: "Sentinel",
    archetype: "AMS",
    rigor: "standard",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "strategy",
    currentStageLabel: "Strategy",
    openAlerts: 0,
    owner: "K. Oshima",
    agingDays: 4,
    blocker: null,
    nextAction: "Confirm mandate",
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve strategy gate",
    ...overrides,
  } as SourcingEventSummary;
}

const GUIDEBOOK: SourceStageGuidebookRecord = {
  id: "guidebook-1",
  stageKey: "strategy",
  clientKey: null,
  title: "Strategy Gate Review",
  purpose: "Get a clean sponsor decision on whether this event goes to market.",
  durationMinutes: 20,
  status: "published",
  sections: [
    {
      type: "purpose",
      title: "What this session is for",
      body: "The Strategy gate is a sponsor decision, not a status update.",
      timeBoxMinutes: null,
    },
    {
      type: "agenda",
      title: "Agenda (20 min)",
      body: "1. Why now\n2. Decision owner\n3. Scope boundary",
      timeBoxMinutes: 20,
    },
  ],
  version: 1,
  createdBy: null,
  updatedBy: null,
  publishedAt: "2026-07-20T13:15:00.000Z",
  createdAt: "2026-07-20T13:15:00.000Z",
  updatedAt: "2026-07-20T13:15:00.000Z",
};

describe("SourceAnalyticsCanvas — guidebook workspace", () => {
  it("summarizes the stage guidebook on the active step canvas", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Lakeshore"
        guidebook={GUIDEBOOK}
      />,
    );

    const guide = screen.getByTestId("source-shell-active-step-guide");
    expect(guide).toHaveTextContent("Run this step");
    expect(guide).toHaveTextContent("Strategy Gate Review · 20 min");
    expect(guide).toHaveTextContent(
      "Get a clean sponsor decision on whether this event goes to market.",
    );
    expect(guide).toHaveTextContent("Invite");
    expect(guide).toHaveTextContent("stage approver");
    expect(guide).toHaveTextContent("Collect");
    expect(guide).toHaveTextContent("Template");
    expect(guide).toHaveTextContent("Unlock");

    fireEvent.click(
      screen.getByRole("button", { name: /open full guidebook/i }),
    );
    expect(screen.getByTestId("source-shell-v2-guidebook")).toBeInTheDocument();
  });

  it("shows the Guidebook rail tab, and opens it to render the real content when a guidebook exists", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Lakeshore"
        guidebook={GUIDEBOOK}
      />,
    );

    const tab = screen.getByTestId("source-shell-workspace-guidebook");
    fireEvent.click(tab);

    expect(screen.getByTestId("source-shell-v2-guidebook")).toBeInTheDocument();
    expect(screen.getByText("Strategy Gate Review")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Get a clean sponsor decision on whether this event goes to market.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("What this session is for")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Strategy gate is a sponsor decision, not a status update.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Global default")).toBeInTheDocument();

    // Section bodies render through ReactMarkdown, not the old plain-text
    // <p style="white-space: pre-wrap"> paragraph — this repo's global Jest
    // mock for react-markdown (src/__tests__/__mocks__/react-markdown.tsx)
    // is a hard passthrough (no real parsing), so a DOM assertion here can
    // only catch "did this regress back to a plain <p>", not "does list/
    // emphasis markup render correctly." That claim is verified separately,
    // against the real (unmocked) library and the real authored agenda
    // content, via renderToStaticMarkup — confirmed real <ol>/<li> output,
    // zero literal "1. " text remaining.
    expect(
      document.querySelector(
        '[data-testid="source-shell-v2-guidebook"] [data-mock="react-markdown"]',
      ),
    ).toBeInTheDocument();
  });

  it("keeps the Guidebook tab available with a default playbook when no guidebook is authored", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent({
          currentStageKey: "scope",
          currentStageLabel: "Scope",
        })}
        viewStage="scope"
        tenantName="Lakeshore"
        guidebook={null}
      />,
    );

    const activeGuide = screen.getByTestId("source-shell-active-step-guide");
    expect(activeGuide).toHaveTextContent("Scope working session");
    fireEvent.click(
      screen.getByRole("button", { name: /open full guidebook/i }),
    );

    const guidebookTab = screen.getByTestId("source-shell-workspace-guidebook");
    expect(guidebookTab).toHaveTextContent("default");
    expect(screen.getByTestId("source-shell-v2-guidebook")).toHaveTextContent(
      "Default playbook",
    );
    expect(screen.getByTestId("source-shell-v2-guidebook")).toHaveTextContent(
      "Run the Scope working session",
    );
    expect(screen.getByTestId("source-shell-v2-guidebook")).toHaveTextContent(
      "Next input",
    );
    expect(screen.getByTestId("source-shell-v2-guidebook")).toHaveTextContent(
      "Gate condition",
    );
    expect(screen.getByTestId("source-shell-v2-guidebook")).toHaveTextContent(
      "Evidence prep checklist",
    );
    expect(screen.getByTestId("source-shell-v2-guidebook")).toHaveTextContent(
      "what to collect, who owns it, the upload format",
    );
    const volumetricsRow = screen.getByTestId(
      "source-shell-guidebook-prep-row-scope.volumetrics",
    );
    expect(volumetricsRow).toHaveTextContent("Provide the volumetrics");
    expect(volumetricsRow).toHaveTextContent("ITSM / finance baseline");
    expect(volumetricsRow).toHaveTextContent("Ravi Menon, IT-Ops");
    expect(volumetricsRow).toHaveTextContent("Volumetrics file");
    expect(volumetricsRow).toHaveTextContent("CSV or XLSX");
    expect(volumetricsRow).toHaveTextContent(
      "Tickets, SLA misses, change orders, run volumes",
    );
    expect(volumetricsRow).toHaveTextContent("VOLUMETRICS_V1");
  });

  it("does not call a completed stage gate-ready while required artifacts still need review", () => {
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
        event={makeEvent({
          currentStageKey: "scope",
          currentStageLabel: "Scope",
        })}
        viewStage="scope"
        tenantName="Lakeshore"
        guidebook={null}
        stageView={completedScopeStage}
        initialWorkspace="guidebook"
      />,
    );

    const guidebook = screen.getByTestId("source-shell-v2-guidebook");
    expect(guidebook).toHaveTextContent("artifact review open");
    expect(guidebook).toHaveTextContent("Clear artifact queue");
    expect(guidebook).toHaveTextContent(
      "required/gate artifacts still need client-final or quality review before approval",
    );

    const volumetricsRow = screen.getByTestId(
      "source-shell-guidebook-prep-row-scope.volumetrics",
    );
    expect(volumetricsRow).toHaveTextContent("Review");
    expect(volumetricsRow).toHaveTextContent("Artifact queue open");
    expect(volumetricsRow).not.toHaveTextContent("Ready for gate");
  });

  it("labels a client-specific guidebook distinctly from the global default", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Lakeshore"
        guidebook={{
          ...GUIDEBOOK,
          id: "guidebook-lakeshore",
          clientKey: "lakeshore-holdings",
          title: "Lakeshore Strategy Gate Review",
        }}
      />,
    );

    fireEvent.click(screen.getByTestId("source-shell-workspace-guidebook"));

    expect(
      screen.getByText("Lakeshore Strategy Gate Review"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tenant guidebook")).toBeInTheDocument();
    expect(screen.queryByText("Global default")).not.toBeInTheDocument();
  });
});
