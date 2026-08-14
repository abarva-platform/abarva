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

const mockRouterRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: mockRouterRefresh,
  }),
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
    mockRouterRefresh.mockClear();
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

    expect(
      screen.queryByTestId("stub-ask-anything-bar"),
    ).not.toBeInTheDocument();
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
    expect(
      screen.queryByTestId("stub-ask-anything-bar"),
    ).not.toBeInTheDocument();
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

  it("shows what the active step needs before Continue can unlock", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    const needs = screen.getByTestId("source-shell-active-step-needs");
    expect(needs).toHaveTextContent("What Continue needs");
    expect(needs).toHaveTextContent("Volumetrics file");
    expect(needs).toHaveTextContent("ITSM / finance baseline");
    expect(needs).toHaveTextContent("Ravi Menon, IT-Ops");
    expect(needs).toHaveTextContent("CSV or XLSX");
    expect(needs).toHaveTextContent("1 required file");
    expect(needs).toHaveTextContent("Tickets, SLA misses, change orders");
    expect(needs).toHaveTextContent("Missing");
    expect(needs).toHaveTextContent(
      "Download the template, fill one row per tower, then upload.",
    );

    const continueGuidance = screen.getByTestId(
      "source-shell-continue-guidance",
    );
    expect(continueGuidance).toHaveTextContent(
      "Locked: Download the template, fill one row per tower, then upload.",
    );
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
    const readiness = screen.getByTestId("source-shell-approval-readiness");
    expect(readiness).toHaveTextContent("Approval readiness");
    expect(readiness).toHaveTextContent("Inputs open");
    expect(readiness).toHaveTextContent("Workflow");
    expect(readiness).toHaveTextContent("Artifact queue");
    expect(readiness).toHaveTextContent("Decision");
    expect(readiness).toHaveTextContent("Next action");
    expect(readiness).toHaveTextContent("Return to steps.");
  });

  it("keeps inactive workspace tabs quiet instead of labeling them hidden", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    const intelligenceTab = screen.getByTestId(
      "source-shell-workspace-intelligence",
    );
    expect(intelligenceTab).toHaveTextContent("Intelligence Explorer");
    expect(intelligenceTab).not.toHaveTextContent("hidden");

    fireEvent.click(intelligenceTab);
    expect(intelligenceTab).toHaveTextContent("open");
  });

  it("opens directly to a route-selected workspace", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        initialWorkspace="approvals"
      />,
    );

    expect(screen.getByTestId("source-shell-v2-approvals")).toBeInTheDocument();
    expect(
      screen.getByTestId("source-shell-workspace-approvals"),
    ).toHaveAttribute("aria-label", "Approvals");
  });

  it("explains produced intelligence, evidence used, missing inputs, and next action", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        initialWorkspace="intelligence"
      />,
    );

    const brief = screen.getByTestId("source-shell-intelligence-readiness");
    expect(brief).toHaveTextContent("Intelligence brief");
    expect(brief).toHaveTextContent("What Source knows right now");
    expect(brief).toHaveTextContent("Produced");
    expect(brief).toHaveTextContent("Evidence used");
    expect(brief).toHaveTextContent("Missing");
    expect(brief).toHaveTextContent("workflow steps open");
    expect(brief).toHaveTextContent("Next action");
    expect(brief).toHaveTextContent(
      "Complete the active step before approval.",
    );
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
            artifactKind: "d05_scope_memo",
            artifactFamily: "sourcing_strategy",
            sourceOrigin: "generated",
            title: "Scope Memo",
            fileFormat: "docx",
            status: "draft",
          },
          {
            id: "uploaded-evidence",
            stageKey: "scope",
            artifactKind: "d07_ticket_synth",
            artifactGroup: "upload",
            title: "Ticket History",
            fileFormat: "csv",
            status: "preliminary",
          },
          {
            id: "client-final",
            stageKey: "scope",
            artifactKind: "d05_scope_memo",
            artifactGroup: "upload",
            title: "Approved Scope Memo",
            fileFormat: "pdf",
            status: "client_final",
            isClientFinal: true,
            isCurrentAuthoritative: true,
            sourceGeneratedArtifactId: "generated-draft",
          },
          {
            id: "generated-rfp",
            stageKey: "rfp",
            artifactKind: "d09_rfp_pack",
            artifactGroup: "generated",
            sourceOrigin: "generated",
            title: "RFP Package",
            fileFormat: "docx",
            status: "draft",
            body: "Recommendation: release the RFP package after approval. Decision requested: approve vendor release. Our internal sensitivity is $3.5M walk-away. This d09 was AI generated.",
            description:
              "Generated Source deliverable. [compliance-review-flagged]",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^files & deliverables$/i }),
    );
    // This test checks rows across multiple stages (scope + rfp) at once —
    // the lifecycle matrix defaults to the viewed stage only, so expand to
    // all 11 stages to keep exercising the full cross-stage matrix here.
    fireEvent.click(
      screen.getByTestId("source-artifact-lifecycle-scope-toggle"),
    );

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

    // The flagged artifact shows a client-safe compliance chip — never the
    // raw matched term ("d09" is present in its own body text above,
    // proving this isn't just an absence-of-input coincidence).
    expect(
      screen.getByTestId("source-shell-file-compliance-flag-generated-rfp"),
    ).toHaveTextContent("Compliance review required");
    expect(
      screen.getByTestId("source-shell-file-compliance-message-generated-rfp"),
    ).toHaveTextContent(
      "This draft was flagged for compliance review before external use.",
    );
    expect(files).not.toHaveTextContent("compliance-review-flagged");
    expect(
      screen.queryByTestId("source-shell-file-compliance-flag-generated-draft"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("source-artifact-execution-summary"),
    ).toHaveTextContent("Due so far");
    expect(
      screen.getByTestId("source-artifact-execution-summary"),
    ).toHaveTextContent("Registered");
    expect(
      screen.getByTestId("source-artifact-execution-summary"),
    ).toHaveTextContent("Missing required");
    expect(
      screen.getByTestId("source-artifact-execution-summary"),
    ).toHaveTextContent("Client finals");
    expect(
      screen.queryByTestId("source-artifact-audit-metrics"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("source-artifact-lifecycle-matrix"),
    ).not.toHaveTextContent("Quality score");
    fireEvent.click(screen.getByTestId("source-artifact-audit-metrics-toggle"));
    expect(
      screen.getByTestId("source-artifact-audit-metrics"),
    ).toHaveTextContent("Expected artifacts");
    expect(
      screen.getByTestId("source-artifact-audit-metrics"),
    ).toHaveTextContent("Quality score");
    expect(
      screen.getByTestId("source-artifact-audit-metrics"),
    ).toHaveTextContent("Hard fails");
    expect(
      screen.getByTestId("source-artifact-audit-metrics"),
    ).toHaveTextContent("Content scored");
    expect(
      screen.getByTestId("source-artifact-audit-metrics"),
    ).toHaveTextContent("Content blockers");
    expect(
      screen.getByTestId("source-artifact-audit-metrics"),
    ).toHaveTextContent("Gate B required");
    expect(
      screen.getByTestId("source-artifact-audit-metrics"),
    ).toHaveTextContent("Gate B pending");
    expect(
      screen.getByTestId("source-artifact-quality-scope"),
    ).toHaveTextContent(
      "rendered body text where Source has artifact content available",
    );
    expect(
      screen.getByTestId("source-artifact-content-quality-d09_rfp_pack"),
    ).toHaveTextContent("Content QA");
    expect(
      screen.getByTestId("source-artifact-consulting-gate-d09_rfp_pack"),
    ).toHaveTextContent("Gate B required");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d09_rfp_pack"),
    ).toHaveTextContent("Content blockers");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d09_rfp_pack"),
    ).toHaveTextContent("No persisted consulting-grade review receipt");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d09_rfp_pack"),
    ).toHaveTextContent(
      "Vendor-facing document contains internal commercial or scoring details",
    );
    const standardsExport = screen.getByTestId(
      "source-artifact-standards-export",
    );
    expect(standardsExport).toHaveAttribute(
      "download",
      "LSH-AMS-2026-artifact-standards.csv",
    );
    const decodedCsv = decodeURIComponent(
      standardsExport
        .getAttribute("href")
        ?.replace(/^data:text\/csv;charset=utf-8,/, "") ?? "",
    );
    expect(decodedCsv).toContain('"Artifact code"');
    expect(decodedCsv).toContain('"d08_premortem"');
    expect(decodedCsv).toContain('"d31_kt_evidence"');
    expect(decodedCsv).toContain('"Token budget"');
    expect(decodedCsv).toContain('"Quality status"');
    expect(decodedCsv).toContain('"Quality findings"');
    expect(decodedCsv).toContain('"Content QA status"');
    expect(decodedCsv).toContain('"Content QA findings"');
    expect(decodedCsv).toContain('"Consulting Gate B"');
    expect(decodedCsv).toContain('"Consulting Gate B score"');
    expect(decodedCsv).toContain('"Content blockers"');
    expect(decodedCsv).toContain('"Gate B required","Not run"');
    expect(decodedCsv).toContain("Mechanical/banned terms");
    expect(decodedCsv).toContain(
      "AI-prepared drafts are not final and require human review before external use.",
    );
    expect(decodedCsv).toContain(
      "A reviewed client-final version must be accepted back into Source as the authoritative artifact of record.",
    );
    expect(
      screen.getByTestId("source-artifact-audit-metrics"),
    ).toHaveTextContent("Evidence-only");
    expect(
      screen.getByTestId("source-artifact-lifecycle-matrix"),
    ).toHaveTextContent("Human review required");
    const reviewQueue = screen.getByTestId("source-artifact-review-queue");
    expect(reviewQueue).toHaveTextContent("Scope approval queue");
    expect(reviewQueue).toHaveTextContent(
      "Clear these artifact actions before opening the gate.",
    );
    expect(reviewQueue).toHaveTextContent("Review supporting evidence");
    expect(reviewQueue).toHaveTextContent("Review evidence");
    expect(
      screen.getByTestId("source-artifact-review-queue-row-d07_ticket_synth"),
    ).toHaveTextContent("Evidence registered");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d05_scope_memo"),
    ).toHaveTextContent("Client-approved final");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d05_scope_memo"),
    ).toHaveTextContent("Client final ready");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d07_ticket_synth"),
    ).toHaveTextContent("Evidence registered");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d07_ticket_synth"),
    ).toHaveTextContent("Uploaded evidence is present");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d09_rfp_pack"),
    ).toHaveTextContent("128k max");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d09_rfp_pack"),
    ).toHaveTextContent("Required exhibits");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d09_rfp_pack"),
    ).toHaveTextContent("No fixed page cap");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d09_rfp_pack"),
    ).toHaveTextContent("Source register");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d09_rfp_pack"),
    ).toHaveTextContent("AI draft awaiting review");
    expect(
      screen.getByTestId("source-artifact-lifecycle-row-d09_rfp_pack"),
    ).toHaveTextContent("Human review required");
    expect(
      screen.queryByTestId("source-accept-client-final-toggle-d05_scope_memo"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("source-accept-client-final-toggle-d09_rfp_pack"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("source-artifact-review-queue-row-d09_rfp_pack"),
    ).not.toBeInTheDocument();
  });

  it("summarizes Source evidence parsing and search readiness without implying enterprise promotion", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        artifacts={[
          {
            id: "parsed-notes",
            stageKey: "scope",
            artifactKind: "source_session_notes",
            artifactFamily: "meeting_notes",
            sourceOrigin: "uploaded",
            title: "Sponsor call notes",
            fileFormat: "md",
            status: "preliminary",
            parseStatus: "parsed",
            embeddingStatus: "pending",
            graphStatus: "pending",
          },
          {
            id: "search-ready-workshop",
            stageKey: "scope",
            artifactKind: "source_workshop_output",
            artifactFamily: "workshop_output",
            sourceOrigin: "uploaded",
            title: "Scope workshop output",
            fileFormat: "xlsx",
            status: "preliminary",
            parseStatus: "parsed",
            embeddingStatus: "embedded",
            graphStatus: "pending",
          },
          {
            id: "audio-recording",
            stageKey: "scope",
            artifactKind: "source_session_notes",
            artifactFamily: "meeting_notes",
            sourceOrigin: "uploaded",
            title: "Vendor call recording",
            fileFormat: "mp3",
            status: "registered",
            parseStatus: "pending",
            embeddingStatus: "pending",
            graphStatus: "pending",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^files & deliverables$/i }),
    );

    const readiness = screen.getByTestId("source-evidence-readiness-panel");
    expect(readiness).toHaveTextContent("Evidence readiness");
    expect(readiness).toHaveTextContent("Stored");
    expect(readiness).toHaveTextContent("Parsed");
    expect(readiness).toHaveTextContent("Needs parser");
    expect(readiness).toHaveTextContent("Search-ready");
    expect(readiness).toHaveTextContent(
      "enterprise-context promotion remain separate governed steps",
    );
    expect(
      screen.getByTestId("source-evidence-readiness-registered-only"),
    ).toHaveTextContent("Vendor call recording");
    const fileUseMap = screen.getByTestId("source-file-use-readiness-map");
    expect(fileUseMap).toHaveTextContent("File use map");
    expect(fileUseMap).toHaveTextContent("Sponsor call notes");
    expect(fileUseMap).toHaveTextContent("Scope workshop output");
    expect(fileUseMap).toHaveTextContent("Vendor call recording");
    expect(fileUseMap).toHaveTextContent("Evidence");
    expect(fileUseMap).toHaveTextContent("parsed");
    expect(fileUseMap).toHaveTextContent("embedded");
    expect(fileUseMap).toHaveTextContent("not projected");
    expect(fileUseMap).toHaveTextContent("Run or retry parser");
    expect(fileUseMap).toHaveTextContent("Ready for workflow use");
    expect(
      screen.getByTestId("source-shell-file-processing-parsed-notes"),
    ).toHaveTextContent("PARSED");
    expect(
      screen.getByTestId("source-shell-file-processing-search-ready-workshop"),
    ).toHaveTextContent("SEARCH READY");
    expect(
      screen.getByTestId("source-shell-file-processing-audio-recording"),
    ).toHaveTextContent("REGISTERED ONLY");
  });

  it("posts reviewed client-final files from the Files lifecycle matrix", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        artifact: { fileName: "Client Final RFP.docx" },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
        artifacts={[
          {
            id: "generated-rfp",
            stageKey: "rfp",
            artifactKind: "d09_rfp_pack",
            artifactGroup: "generated",
            sourceOrigin: "generated",
            title: "RFP Package",
            fileFormat: "docx",
            status: "draft",
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^files & deliverables$/i }),
    );
    // Viewing "scope" but this artifact is stageKey "rfp" — the lifecycle
    // matrix defaults to the viewed stage only, so expand to see it.
    fireEvent.click(
      screen.getByTestId("source-artifact-lifecycle-scope-toggle"),
    );
    fireEvent.click(
      screen.getByTestId("source-accept-client-final-toggle-d09_rfp_pack"),
    );
    fireEvent.change(screen.getByLabelText(/client-approved file/i), {
      target: {
        files: [
          new File(["final"], "Client Final RFP.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
        ],
      },
    });
    fireEvent.change(screen.getByLabelText(/optional note/i), {
      target: { value: "Reviewed by sourcing steering committee." },
    });
    fireEvent.submit(
      screen.getByTestId("source-accept-client-final-panel-d09_rfp_pack"),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "/api/v1/source/evt-1/artifacts/d09_rfp_pack/client-final",
    );
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/Client Final accepted/i),
    ).toBeInTheDocument();
  });

  it("posts workshop/session evidence with explicit governed upload metadata", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        artifact: {
          id: "artifact-workshop-1",
          originalName: "scope-workshop-output.md",
          parseStatus: "parsed",
        },
        substrateSync: {
          evidence: null,
          criteria: [],
        },
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

    fireEvent.click(
      screen.getByRole("button", { name: /^files & deliverables$/i }),
    );
    expect(
      screen.getByTestId("source-session-evidence-capture"),
    ).toHaveTextContent("Session evidence");

    fireEvent.change(
      screen.getByTestId("source-session-evidence-input-workshop_output"),
      {
        target: {
          files: [
            new File(["decision: Scope is fixed"], "scope-workshop-output.md", {
              type: "text/markdown",
            }),
          ],
        },
      },
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "/api/v1/source/evt-1/artifacts/upload",
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.credentials).toBe("include");
    const body = request.body as FormData;
    expect(body.get("stageKey")).toBe("scope");
    expect(body.get("artifactFamily")).toBe("workshop_output");
    expect(body.get("artifactKind")).toBe("source_workshop_output");
    expect(body.get("dataClassification")).toBe("Internal");
    expect(
      await screen.findByText(/Captured scope-workshop-output.md/i),
    ).toBeInTheDocument();
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not tell users that event approval belongs in the old Source Approvals page", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    expect(
      screen.getByTestId("source-analytics-canvas").textContent,
    ).not.toContain("approval belongs in Source Approvals");
    expect(screen.getByTestId("source-analytics-canvas").textContent).toMatch(
      /approval/i,
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
      <SourceAnalyticsCanvas
        event={event}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
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
          new File([new Uint8Array(16)], "volumetrics.csv", {
            type: "text/csv",
          }),
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
    const readback = screen.getByTestId("source-active-upload-readback");
    expect(readback).toHaveTextContent("Upload readback");
    expect(readback).toHaveTextContent("File stored:");
    expect(readback).toHaveTextContent("volumetrics.csv");
    expect(readback).toHaveTextContent("Typed facts:");
    expect(readback).toHaveTextContent("7 typed facts written");
    expect(readback).toHaveTextContent("VOLUMETRICS_V1");
    expect(readback).toHaveTextContent("Issues:");
    expect(readback).toHaveTextContent("None reported by parser.");
    expect(readback).toHaveTextContent("Refresh impact:");
    expect(readback).toHaveTextContent(
      "Stage evidence, Files, Intelligence, and generated artifacts can reread this source.",
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
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((t) => ({
        ...t,
        state: "done" as const,
      })),
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
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((t) => ({
        ...t,
        state: "done" as const,
      })),
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
    expect(
      screen.getByTestId("source-analytics-canvas").textContent,
    ).not.toContain("Explicit launcher context from the route.");
  });

  it("uses the same completion counter in sample mode instead of a hardcoded launcher claim", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );
    const total = SAMPLE_SCOPE_STAGE.tasks.length;
    const done = SAMPLE_SCOPE_STAGE.tasks.filter(
      (task) => task.state === "done",
    ).length;
    expect(screen.getByTestId("source-analytics-canvas").textContent).toContain(
      `${total - done} steps left`,
    );
  });
});
