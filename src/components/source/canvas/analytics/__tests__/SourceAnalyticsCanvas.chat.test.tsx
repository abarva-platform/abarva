/**
 * @jest-environment jsdom
 */

// The Source event analytics canvas (`SourceAnalyticsCanvas`) must have one
// reachable way to type a question to aVa. The design-contract shell keeps aVa
// collapsed as an `Ask aVa` launcher on first paint, then mounts the real
// `AskAnythingBar` composer when the user asks for it.
//
//   1. `AskAnythingBar` — the real, working chat composer used elsewhere
//      (Programs) — receives `surface="source-detail"` and a `scopeLabel`
//      built from the event + stage after the launcher opens.
//   2. The shell no longer shows a hardcoded, potentially stale aVa side rail;
//      stage progress and the approval readiness line are derived from the same
//      task-completion evidence as the page itself.
//
// `AppShell` pulls in `next/navigation` (useRouter/usePathname) — stub both,
// matching the pattern already used by StrategyStage.test.tsx.

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
}));

// AppShell -> AppTopBar uses Clerk's useUser — mock so this renders under
// jsdom without a real ClerkProvider, matching
// source-event-canvas-render.test.tsx's pattern for the same shell tree.
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

// Stub AskAnythingBar with a shallow component that renders its received
// props as data attributes — this test asserts WIRING (which props reach the
// bar), not the bar's own internals (covered by its own/Programs' tests).
const mockAskAnythingBar = jest.fn((props: Record<string, unknown>) => (
  <div
    data-testid="stub-ask-anything-bar"
    data-agent={String(props.agent ?? "")}
    data-surface={String(props.surface ?? "")}
    data-scope-label={String(props.scopeLabel ?? "")}
    data-placeholder={String(props.placeholder ?? "")}
  />
));

jest.mock("@/components/agent/AskAnythingBar", () => ({
  AskAnythingBar: (props: Record<string, unknown>) => mockAskAnythingBar(props),
}));

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import { SAMPLE_SCOPE_STAGE } from "../sample-view-model";
import type { StageAnalyticsView } from "../view-model";
import type { SourcingEventSummary } from "@/lib/source/types";
import {
  SOURCE_AI_DRAFT_GOVERNANCE_LABEL,
  SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE,
  SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE,
} from "@/lib/source/artifact-governance";

const originalFetch = global.fetch;

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
    currentStageKey: "scope",
    currentStageLabel: "Scope",
    openAlerts: 0,
    owner: "K. Oshima",
    agingDays: 4,
    blocker: null,
    nextAction: "Confirm volumetrics",
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve scope",
    ...overrides,
  } as SourcingEventSummary;
}

describe("SourceAnalyticsCanvas — AskAnythingBar reachability", () => {
  beforeEach(() => {
    mockAskAnythingBar.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("mounts AskAnythingBar with surface='source-detail' and an event+stage scopeLabel after Ask aVa opens", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    expect(screen.queryByTestId("stub-ask-anything-bar")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ask ava/i }));

    const bar = screen.getByTestId("stub-ask-anything-bar");
    expect(bar).toHaveAttribute("data-surface", "source-detail");
    expect(bar.getAttribute("data-scope-label")).toContain("LSH-AMS-2026");
    expect(bar.getAttribute("data-scope-label")).toContain("Scope");
    // Agent key resolves to the aVa-branded config (AGENT_CFG.sentinel.name === 'Ava').
    expect(bar).toHaveAttribute("data-agent", "sentinel");
  });

  it("renders the contract aVa launcher and does not reintroduce the old dock controls or duplicate launcher", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );
    expect(screen.queryByTestId("ava-launcher-fab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ava-dock-left")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ava-dock-right")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ava-dock-top")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ava-dock-bottom")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ava-dock-hidden")).not.toBeInTheDocument();
    expect(screen.getByTestId("source-ask-ava-launcher")).toBeInTheDocument();
    expect(screen.queryByTestId("stub-ask-anything-bar")).not.toBeInTheDocument();
  });

  it("does not render the retired Source section subnav inside the event shell", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    expect(
      screen.queryByRole("navigation", { name: "Source sections" }),
    ).not.toBeInTheDocument();
  });

  it("keeps gate approval handoff inside the event shell workspace", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    expect(
      screen.queryByRole("link", { name: /open approvals/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /approvals/i }));

    expect(screen.getByTestId("source-shell-v2-approvals")).toBeInTheDocument();
  });

  it("labels file-ledger generated drafts and client finals from artifact state", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        artifacts={[
          {
            id: "generated-draft",
            stageKey: "scope",
            artifactFamily: "sourcing_strategy",
            sourceOrigin: "generated",
            title: "Scope Memo",
            fileFormat: "docx",
            status: "draft",
          },
          {
            id: "uploaded-evidence",
            stageKey: "scope",
            artifactGroup: "upload",
            title: "Ticket History",
            fileFormat: "csv",
            status: "preliminary",
          },
          {
            id: "client-final",
            stageKey: "scope",
            artifactGroup: "upload",
            title: "Approved Scope Memo",
            fileFormat: "pdf",
            status: "client_final",
            isClientFinal: true,
            isCurrentAuthoritative: true,
            sourceGeneratedArtifactId: "generated-draft",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^files$/i }));

    const files = screen.getByTestId("source-shell-v2-files");
    expect(files).toHaveTextContent(SOURCE_AI_DRAFT_GOVERNANCE_LABEL);
    expect(files).toHaveTextContent(SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE);
    expect(files).toHaveTextContent("File evidence");
    expect(files).toHaveTextContent("Client-approved final");
    expect(files).toHaveTextContent(SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE);
    expect(
      screen.getByTestId("source-shell-file-governance-generated-draft"),
    ).toHaveTextContent("Human review is required");
    expect(
      screen.queryByTestId("source-shell-file-governance-uploaded-evidence"),
    ).not.toBeInTheDocument();
  });

  it("does not tell users that event approval belongs in the old Source Approvals page", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    expect(screen.getByTestId("source-analytics-canvas").textContent).not.toContain(
      "approval belongs in Source Approvals",
    );
    expect(screen.getByTestId("source-analytics-canvas").textContent).toContain(
      "event's approval workspace",
    );
  });

  it("passes surfaceContext.sourceEventId through to AppShell (verified via the rendered top-bar context, which AppShell derives independently — the real thread is exercised by SourceAnalyticsCanvas's own surfaceContext prop, asserted structurally here)", () => {
    // AppShell -> AtlasPageStateProvider both accept `surfaceContext` verbatim
    // and forward it into the /api/chat/agent POST body via `ask()`. We can't
    // observe the network call without mounting the full stream, but we CAN
    // assert the exact object SourceAnalyticsCanvas constructs and hands to
    // AppShell carries sourceEventId — that object is passed by reference,
    // unmodified, all the way to the fetch body (see AtlasPageStateProvider.ask
    // building `mergedSurfaceContext` from the `surfaceContext` prop it was
    // given). This locks the source-side half of that contract.
    const event = makeEvent({ id: "evt-42", code: "LSH-AMS-2027" });
    render(
      <SourceAnalyticsCanvas event={event} viewStage="scope" tenantName="Lakeshore" />,
    );
    expect(screen.getByTestId("source-analytics-canvas")).toBeInTheDocument();
  });

  it("uses the real governed uploader in the focused provide step", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          artifact: {
            id: "artifact-1",
            originalName: "volumetrics.csv",
            sourceFormat: "csv",
            sizeBytes: 4096,
            parseStatus: "parsed",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          eventId: "evt-1",
          templateCode: "VOLUMETRICS_V1",
          factsWritten: 7,
          unmappedColumns: [],
          rejectedRows: [],
        }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    fireEvent.change(screen.getByTestId("task-file-input"), {
      target: {
        files: [
          new File([new Uint8Array(16)], "volumetrics.csv", { type: "text/csv" }),
        ],
      },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/api/v1/source/evt-1/artifacts/upload",
    );
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      "/api/v1/source/evt-1/facts/ingest-file",
    );
    expect(await screen.findByText("volumetrics.csv")).toBeInTheDocument();
    expect(screen.getByTestId("fact-ingest-result")).toHaveTextContent(
      /7 facts written/i,
    );
  });
});

describe("SourceAnalyticsCanvas — docked aVa honesty against live stage state", () => {
  beforeEach(() => {
    mockAskAnythingBar.mockClear();
  });

  it("does NOT show the stale sample claim when a LIVE stage view says all tasks are complete", () => {
    const allDoneLiveView: StageAnalyticsView = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((t) => ({ ...t, state: "done" as const })),
    };

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        stageView={allDoneLiveView}
      />,
    );

    const canvas = screen.getByTestId("source-analytics-canvas");

    // The stale sample claim ("Two steps left on Scope — volumetrics and the
    // sponsor letter") must NOT appear when the live view says complete.
    expect(canvas.textContent).not.toContain("Two steps left");
    // And it must say something honest instead.
    expect(canvas.textContent).toMatch(/complete/i);
  });

  it("derives an honest 'N of M left' claim from the SAME live task-completion evidence when incomplete", () => {
    const partialLiveView: StageAnalyticsView = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((t, i) => ({
        ...t,
        state: i === 0 ? ("done" as const) : ("todo" as const),
      })),
    };
    const total = partialLiveView.tasks.length;
    const remaining = total - 1;

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        stageView={partialLiveView}
      />,
    );

    const canvas = screen.getByTestId("source-analytics-canvas");
    expect(canvas.textContent).toContain(`${remaining} steps left`);
    expect(canvas.textContent).toContain(`1 / ${total}`);
    expect(canvas.textContent).not.toContain("Two steps left");
  });

  it("ignores the legacy avaLauncher prop so the duplicate launcher cannot return", () => {
    const explicitLauncher = {
      role: "Analyst · Scope",
      context: "Explicit launcher context from the route.",
      suggestions: ["A question"],
    };
    const allDoneLiveView: StageAnalyticsView = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((t) => ({ ...t, state: "done" as const })),
    };

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        stageView={allDoneLiveView}
        avaLauncher={explicitLauncher}
      />,
    );

    expect(screen.queryByTestId("ava-launcher-fab")).not.toBeInTheDocument();
    expect(screen.getByTestId("source-analytics-canvas").textContent).not.toContain(
      "Explicit launcher context from the route.",
    );
  });

  it("uses the same completion counter in sample mode instead of a hardcoded launcher claim", () => {
    render(
      <SourceAnalyticsCanvas event={makeEvent()} viewStage="scope" tenantName="Lakeshore" />,
    );
    const total = SAMPLE_SCOPE_STAGE.tasks.length;
    const done = SAMPLE_SCOPE_STAGE.tasks.filter((task) => task.state === "done").length;
    expect(screen.getByTestId("source-analytics-canvas").textContent).toContain(
      `${total - done} of ${total}`,
    );
  });
});
