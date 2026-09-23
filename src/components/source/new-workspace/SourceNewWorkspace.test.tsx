/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  SourceNewWorkspace as SourceNewWorkspaceImplementation,
  sourceNewFileDownloadHref,
  type SourceNewEventView,
  type SourceNewWorkspaceProps,
} from "./SourceNewWorkspace";
import type { SourceNewFileRow } from "./SourceNewFiles";
import type { SourceEventActivityResult } from "@/lib/source/activity-log";
import type { SourceNewEventIntelligenceView } from "@/lib/source/new-workspace/event-intelligence";
import type { SourceNewStage04VendorPanel } from "@/lib/source/new-workspace/stage04-vendor-panel";
import type { SourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";
import type { HistoricalRequestSummary } from "@/lib/source/new-workspace/historical-request-summary";
import {
  buildScorecardAuthorityView,
  type ScorecardAuthorityView,
} from "@/lib/source/proposal-intelligence";
import type { AtlasPageContextValue } from "@/lib/shell/atlas-page-state";
import type { AgentDockProps } from "@/components/agent/AgentDock";

const mockUseAtlasPageState = jest.fn();
const mockAgentDockProps: AgentDockProps[] = [];

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/shell/AtlasPageStateProvider", () => ({
  useAtlasPageState: () => mockUseAtlasPageState(),
}));

jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: (props: AgentDockProps) => {
    mockAgentDockProps.push(props);
    return <div>{props.workspace}</div>;
  },
}));

const request: SourceNewEventView = {
  id: "event-1",
  code: "SRC-1",
  name: "Application services sourcing",
  clientName: "Example client",
  clientKey: "example-client",
  eventType: "managed_services",
  category: null,
  currentStage: "intake",
  lifecycle: "waiting_on_client",
  trigger: "A contract is nearing renewal.",
  scope: null,
  decisionOwner: null,
  asOfDate: "2026-03-10",
};

const responseFile: SourceNewFileRow = {
  id: "response-1",
  phase: "other",
  artifactGroup: "upload",
  artifactType: "vendor_response_pack",
  artifactFamily: "vendor_response",
  description: "Candidate response package",
  title: "Candidate response pack",
  fileName: "candidate-response.pdf",
  fileFormat: "pdf",
  fileSize: 4096,
  version: 1,
  status: "approved",
  lifecycleState: "current",
  generatedAt: "2026-03-10T00:00:00Z",
  generatedBy: "Uploader",
  sourceBasis: null,
  confidence: null,
  citationReady: false,
  evidenceFamiliesUsed: [],
  sourceRegisterId: null,
  contextBundleTraceId: null,
  missingInputs: [],
  clientCompleteItems: [],
  assumptions: [],
  supersedesArtifactId: null,
  supersededByArtifactId: null,
  blobSha256: "sha-response",
  approvalState: "approved",
  approvedBy: "Reviewer",
  approvedAt: "2026-03-11T00:00:00Z",
  isClientFinal: false,
  isCurrentAuthoritative: false,
  sourceGeneratedArtifactId: null,
  clientFinalUploadedBy: null,
  clientFinalUploadedAt: null,
  clientFinalAcceptedBy: null,
  clientFinalAcceptedAt: null,
  clientFinalNote: null,
  clientFinalReviewMeetingDate: null,
  clientFinalStakeholderGroup: null,
  createdAt: "2026-03-10T00:00:00Z",
  updatedAt: "2026-03-10T00:00:00Z",
};

// A market package filed against the event. `rfp_package` is the artifact type
// the file cabinet actually records, and `sourceNewFilePhase` files it in the
// market-package folder — so this is the artifact an operator opens when they
// click through Files, not a shape invented for the test.
const marketPackageFile: SourceNewFileRow = {
  ...responseFile,
  id: "market-package-1",
  phase: "rfi",
  artifactGroup: "generated",
  artifactType: "rfp_package",
  artifactFamily: "solicitation",
  description: "Market package issued to the candidate panel",
  title: "Sourcing package draft",
  fileName: "sourcing-package-draft.pdf",
  blobSha256: "sha-market-package",
};

const unavailableStage05: SourceNewStage05NdaCoverage = {
  status: "unavailable",
  asOf: "2026-03-10",
  suppliers: [],
  nextAction: {
    label: "Restore candidate authority",
    detail: "The governed candidate-panel registry could not be read.",
  },
};
const unavailableScorecardAuthority = buildScorecardAuthorityView({
  tenantKey: request.clientKey,
  sourceEventId: request.id,
  criteria: [],
  scores: [],
});

beforeEach(() => {
  mockUseAtlasPageState.mockReturnValue(null);
  mockAgentDockProps.length = 0;
});

// Blocked rather than empty: these cases are about other parts of the
// workspace, and a panel defaulted to "available with nothing in it" would
// quietly assert that the candidate authority was read and came back empty.
const blockedStage04: SourceNewStage04VendorPanel = {
  status: "blocked",
  blockers: ["The candidate authority could not be read."],
  rows: [],
  counts: {
    eligible_candidate: 0,
    selected_respondent: 0,
    existing_contract_vendor: 0,
  },
  notRecorded: [],
  suggestions: {
    status: "blocked",
    blockers: ["The governed candidate-supplier registry is unavailable."],
    rows: [],
    excludedCount: 0,
  },
  asOf: "2026-03-10",
};

function SourceNewWorkspace({
  stage04VendorPanel = blockedStage04,
  stage05NdaCoverage = unavailableStage05,
  scorecardAuthority = unavailableScorecardAuthority,
  ...props
}: Omit<
  SourceNewWorkspaceProps,
  "stage04VendorPanel" | "stage05NdaCoverage" | "scorecardAuthority"
> & {
  stage04VendorPanel?: SourceNewStage04VendorPanel;
  stage05NdaCoverage?: SourceNewStage05NdaCoverage;
  scorecardAuthority?: ScorecardAuthorityView;
}) {
  return (
    <SourceNewWorkspaceImplementation
      {...props}
      stage04VendorPanel={stage04VendorPanel}
      stage05NdaCoverage={stage05NdaCoverage}
      scorecardAuthority={scorecardAuthority}
    />
  );
}

describe("SourceNewWorkspace", () => {
  it("keeps demo self-acknowledgements separate from governed stage and decisions", () => {
    const originalFetch = global.fetch;
    const fetchSpy = jest.fn(() => {
      throw new Error("Demo acknowledgement must not write an event");
    });
    global.fetch = fetchSpy as typeof fetch;
    try {
      render(
        <SourceNewWorkspace
          event={{ ...request, currentStage: "scope", lifecycle: "active" }}
          files={[]}
          activity={{ ok: true, entries: [] }}
          demoMode
        />,
      );

      expect(screen.getByText(/governed stage remains Scope/i)).toBeTruthy();
      expect(screen.getByText(/demo records no sponsor signature/i)).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Self-approve for demo" }),
      );

      expect(
        screen.getByRole("heading", { name: "Suppliers & NDA demo preview" }),
      ).toBeTruthy();
      expect(screen.getByText(/governed stage remains Scope/i)).toBeTruthy();
      expect(screen.getByText(/candidate authority could not be read/i)).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Self-approve for demo" }),
      );
      expect(
        screen.getByRole("heading", { name: "Market package demo preview" }),
      ).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", { name: "Self-approve for demo" }),
      );
      expect(
        screen.getByRole("heading", { name: "Demo walkthrough complete" }),
      ).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Approvals" }));
      const acknowledgements = screen.getByRole("region", {
        name: "Demo acknowledgements",
      });
      expect(within(acknowledgements).getAllByRole("listitem")).toHaveLength(3);
      expect(screen.getByText(/No decisions have been recorded/i)).toBeTruthy();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("does not offer demo self-approval on the governed workspace by default", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "scope", lifecycle: "active" }}
        files={[]}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Self-approve for demo" }),
    ).toBeNull();
  });

  it("passes governed aVa citations from settled page-state turns into AgentDock", () => {
    mockUseAtlasPageState.mockReturnValue({
      conversation: [
        {
          id: "answer-1",
          role: "agent",
          text: "Define completion is not proven by the evidence registry alone.",
          agentName: "aVa",
          timestamp: Date.parse("2026-09-22T01:20:00Z"),
          agentAnswer: {
            surface: "source",
            mode: "SOURCE",
            tenantKey: "example-client",
            question: "Can we complete Define?",
            intent: "source_stage_completion",
            status: "answered",
            directAnswer:
              "Define completion is not proven by the evidence registry alone.",
            factsUsed: [],
            metricsUsed: [],
            relationshipsUsed: [],
            artifacts: [],
            citations: [
              {
                id: "c1",
                label: "Scope notes.pdf",
                sourceClass: "tenant-fact",
                recordId: "artifact-1",
                excerpt: "Stored in the Source artifact registry.",
                confidence: "medium",
              },
            ],
            gaps: [],
            caveats: [],
            nextSteps: [],
            quality: {
              confidence: "medium",
              evidenceStrength: "partial",
              tenantGrounding: "partial",
              answerCompleteness: "complete",
            },
            safety: {
              tenantFencePassed: true,
              rawIdsSuppressed: true,
              forbiddenLanguagePassed: true,
              unsupportedClaimsBlocked: true,
            },
          },
        },
      ],
      ask: jest.fn(),
    } satisfies Partial<AtlasPageContextValue>);

    render(<SourceNewWorkspace event={request} files={[]} />);

    const turn = mockAgentDockProps.at(-1)?.thread?.[0];
    expect(turn?.agentAnswer?.citations).toHaveLength(1);
    expect(turn?.citations).toEqual([
      {
        id: "c1",
        type: "TENANT",
        name: "Scope notes.pdf",
        detail: "Stored in the Source artifact registry.",
        confidence: 0.65,
      },
    ]);
  });

  it("shows one next action for a request without marking missing facts complete", () => {
    render(<SourceNewWorkspace event={request} files={[]} />);
    const action = screen.getByRole("complementary", { name: "Next action" });
    expect(
      within(action)
        .getByRole("link", { name: "Review intake" })
        .getAttribute("href"),
    ).toBe("/source/events/event-1/approval");
    expect(screen.getAllByRole("link", { name: "Review intake" })).toHaveLength(
      1,
    );
    expect(screen.getAllByText("Not recorded")).toHaveLength(2);
    expect(screen.getByText("Awaiting intake review")).toBeTruthy();
  });

  it("does not pretend the market package remains current after the event advances", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "evaluation", lifecycle: "active" }}
        files={[]}
      />,
    );
    expect(screen.getByText("Current stage: Evaluation")).toBeTruthy();
    expect(screen.queryByText("This step is not open yet")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Open current stage" })
        .getAttribute("href"),
    ).toBe("/source/events/event-1");
  });

  it("mounts Stage 07 scorecard authority as blocked when no frozen named evaluator authority is loaded", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "evaluation", lifecycle: "active" }}
        files={[]}
      />,
    );

    const authority = screen.getByRole("region", {
      name: "Stage 07 scorecard authority",
    });
    expect(
      within(authority).getByText("Blocked before scorecard inspection"),
    ).toBeTruthy();
    expect(
      within(authority).getByText(
        "No tenant-scoped scorecard authority is loaded for this event.",
      ),
    ).toBeTruthy();
    expect(
      within(authority).getByText(
        "No named evaluator score authority is loaded.",
      ),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(
      /BAFO ready|selected vendor|award approved/i,
    );
  });

  it("keeps opposite-tenant scorecard authority from clearing Stage 07 readiness", () => {
    const authority = buildScorecardAuthorityView({
      tenantKey: "example-client",
      sourceEventId: "event-1",
      criteria: [
        {
          tenantKey: "other-client",
          sourceEventId: "event-1",
          criterionId: "transition",
          criterionVersion: "crit-v1",
          label: "Transition certainty",
          weight: 40,
          weightsFrozen: true,
          approvedCriterionVersion: "crit-v1",
          approvedBy: "procurement-lead",
          approvedAt: "2026-09-19T12:00:00Z",
        },
      ],
      scores: [
        {
          tenantKey: "other-client",
          sourceEventId: "event-1",
          vendorId: "vendor-a",
          vendorName: "Vendor A",
          criterionId: "transition",
          criterionVersion: "crit-v1",
          evaluatorId: "eval-1",
          evaluatorName: "A. Evaluator",
          evaluatorScore: 8,
          evidenceReference: "EVID-TRANSITION-01",
          overrideReason: null,
          overrideReasonRequired: false,
          lockState: "locked",
          lockedBy: "eval-1",
          lockedAt: "2026-09-19T12:30:00Z",
        },
      ],
    });

    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "bafo",
          lifecycle: "active",
        }}
        files={[]}
        scorecardAuthority={authority}
      />,
    );

    const panel = screen.getByRole("region", {
      name: "Stage 07 scorecard authority",
    });
    expect(
      within(panel).getByText("Blocked before scorecard inspection"),
    ).toBeTruthy();
    expect(
      within(panel).getByText(
        "No tenant-scoped scorecard authority is loaded for this event.",
      ),
    ).toBeTruthy();
    expect(within(panel).queryByText("Vendor A")).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(/BAFO ready/i);
  });

  it("requires completion review when a completed event has historical gaps", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "value", lifecycle: "completed" }}
        files={[]}
      />,
    );

    const phases = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    expect(phases).toHaveLength(4);
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(
      screen.getByText("This event is completed. Final stage: Value."),
    ).toBeTruthy();

    expect(
      screen.queryByRole("complementary", { name: "Next action" }),
    ).toBeNull();
    const status = screen.getByRole("complementary", { name: "Event status" });
    expect(within(status).getByText("Completion review needed")).toBeTruthy();
    expect(
      within(status).getByText(
        "3 phases have no governed history. Record the missing evidence or a named waiver before treating the event record as complete.",
      ),
    ).toBeTruthy();
    expect(
      within(status)
        .getByRole("link", { name: "Resolve historical gaps" })
        .getAttribute("href"),
    ).toBe("/source/events/event-1");
  });

  it("keeps a completed event terminal when every visible phase has governed history", () => {
    const supplierFile: SourceNewFileRow = {
      ...responseFile,
      id: "supplier-evidence-1",
      phase: "suppliers",
      artifactType: "nda_executed",
      title: "Supplier readiness evidence",
      fileName: "supplier-readiness.pdf",
      blobSha256: "sha-supplier-evidence",
    };

    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "value",
          lifecycle: "completed",
          scope: "Managed application services scope",
        }}
        files={[supplierFile, marketPackageFile]}
      />,
    );

    const status = screen.getByRole("complementary", { name: "Event status" });
    expect(within(status).getByText("Event completed")).toBeTruthy();
    expect(
      within(status).getByText(
        "The governed event is complete. No next action is pending in Source New.",
      ),
    ).toBeTruthy();
    expect(within(status).queryByRole("link")).toBeNull();
  });

  it("labels a missing completed-event phase as a historical gap", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "value", lifecycle: "completed" }}
        files={[]}
      />,
    );

    const phases = screen.getByRole("navigation", { name: "Event phases" });
    const supplierPhase = within(phases).getByRole("button", {
      name: /03 Suppliers & NDA/i,
    });
    expect(supplierPhase.textContent).toContain("Historical gap");

    fireEvent.click(supplierPhase);
    expect(
      screen.getByRole("heading", {
        name: "Governed history is missing for this phase",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "The completed event has no governed evidence recorded for this phase. Record the missing evidence or a named waiver before treating this history as complete.",
      ),
    ).toBeTruthy();
  });

  it("keeps active events on their governed current-stage action", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "rfp", lifecycle: "active" }}
        files={[]}
      />,
    );

    const action = screen.getByRole("complementary", { name: "Next action" });
    expect(
      within(action).getByRole("heading", { name: "Open market package" }),
    ).toBeTruthy();
    expect(
      within(action)
        .getByRole("link", { name: "Open market package" })
        .getAttribute("href"),
    ).toBe("/source/events/event-1");
    expect(
      screen.queryByRole("complementary", { name: "Event status" }),
    ).toBeNull();
  });

  it("does not label a competitive RFP event or its file folder as RFI", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          eventType: "competitive_sourcing",
          currentStage: "rfp",
          lifecycle: "active",
        }}
        files={[]}
      />,
    );
    const phases = screen.getByRole("navigation", { name: "Event phases" });
    expect(
      within(phases).getByRole("button", { name: /Market package/ }),
    ).toBeTruthy();
    expect(within(phases).queryByText("RFI")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Files" }));
    const folders = screen.getByRole("navigation", { name: "File folders" });
    expect(
      within(folders).getByRole("button", { name: "Market package" }),
    ).toBeTruthy();
    expect(within(folders).queryByText("RFI")).toBeNull();
  });

  it("renders an accepted RFP motion from authority without falling back to RFI wording", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "rfp",
          lifecycle: "active",
          solicitationMotion: "rfp",
        }}
        files={[]}
      />,
    );

    const phases = screen.getByRole("navigation", { name: "Event phases" });
    expect(within(phases).getByRole("button", { name: /RFP/ })).toBeTruthy();
    expect(within(phases).queryByText("RFI")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Open RFP" }).getAttribute("href"),
    ).toBe("/source/events/event-1");
    expect(
      screen.getByText(
        "Review the RFP and its release requirements in the governed event.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Files" }));
    const folders = screen.getByRole("navigation", { name: "File folders" });
    expect(within(folders).getByRole("button", { name: "RFP" })).toBeTruthy();
    expect(within(folders).queryByText("RFI")).toBeNull();
  });

  it("renders an accepted RFI motion only when authority explicitly supplies RFI", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "rfp",
          lifecycle: "active",
          solicitationMotion: "rfi",
        }}
        files={[]}
      />,
    );

    const phases = screen.getByRole("navigation", { name: "Event phases" });
    expect(within(phases).getByRole("button", { name: /RFI/ })).toBeTruthy();
    expect(within(phases).queryByText("RFP")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Open RFI" }).getAttribute("href"),
    ).toBe("/source/events/event-1");

    fireEvent.click(screen.getByRole("button", { name: "Files" }));
    const folders = screen.getByRole("navigation", { name: "File folders" });
    expect(within(folders).getByRole("button", { name: "RFI" })).toBeTruthy();
    expect(within(folders).queryByText("RFP")).toBeNull();
  });

  it("keeps unknown or unapplied solicitation authority neutral instead of fabricating RFI or RFP", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "rfp",
          lifecycle: "active",
          solicitationMotion: null,
        }}
        files={[]}
      />,
    );

    const phases = screen.getByRole("navigation", { name: "Event phases" });
    expect(
      within(phases).getByRole("button", { name: /Market package/ }),
    ).toBeTruthy();
    expect(within(phases).queryByText("RFI")).toBeNull();
    expect(within(phases).queryByText("RFP")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Open market package" })
        .getAttribute("href"),
    ).toBe("/source/events/event-1");
    expect(
      screen.getByText(
        "Review the package and its release requirements in the governed event.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Files" }));
    const folders = screen.getByRole("navigation", { name: "File folders" });
    expect(
      within(folders).getByRole("button", { name: "Market package" }),
    ).toBeTruthy();
    expect(within(folders).queryByText("RFI")).toBeNull();
    expect(within(folders).queryByText("RFP")).toBeNull();
  });

  // F4's residual: the phase rail and the folder rail were corrected, but every
  // label case was rendered with an empty cabinet, so nothing exercised what an
  // operator reads after clicking through Files into the package itself.
  function openMarketPackageArtifact(folderLabel: string) {
    fireEvent.click(screen.getByRole("button", { name: "Files" }));
    const folders = screen.getByRole("navigation", { name: "File folders" });
    fireEvent.click(within(folders).getByRole("button", { name: folderLabel }));
    const list = screen.getByRole("listbox", { name: "Files in folder" });
    fireEvent.click(
      within(list).getByRole("option", { name: /Sourcing package draft/ }),
    );
    return screen.getByRole("complementary", { name: "Selected file details" });
  }

  it("never says RFI anywhere an RFP event's package is opened", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          eventType: "competitive_sourcing",
          currentStage: "rfp",
          lifecycle: "active",
          solicitationMotion: "rfp",
          solicitationMotionAcceptedAt: "2026-03-12T00:00:00Z",
          solicitationMotionAcceptedByUserId: "user-1",
        }}
        files={[marketPackageFile]}
      />,
    );

    const detail = openMarketPackageArtifact("RFP");
    expect(within(detail).getByText("RFP package")).toBeTruthy();
    expect(within(detail).queryByText(/rfi/i)).toBeNull();
    expect(screen.queryByText(/\bRFI\b/)).toBeNull();
  });

  // The stage key says `rfp` while the accepted motion says `rfi`. Inferring
  // the displayed motion from the reused key is the exact defect F4 forbids,
  // so the fixture makes the two disagree on purpose.
  it("never says RFP anywhere an RFI event's package is opened, though its stage key still reads rfp", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "rfp",
          lifecycle: "active",
          solicitationMotion: "rfi",
          solicitationMotionAcceptedAt: "2026-03-12T00:00:00Z",
          solicitationMotionAcceptedByUserId: "user-1",
        }}
        files={[marketPackageFile]}
      />,
    );

    const detail = openMarketPackageArtifact("RFI");
    expect(within(detail).getByText("RFI package")).toBeTruthy();
    expect(within(detail).queryByText(/rfp/i)).toBeNull();
    expect(screen.queryByText(/\bRFP\b/)).toBeNull();
  });

  it("keeps an opened package neutral while no motion has been accepted", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "rfp",
          lifecycle: "active",
          solicitationMotion: null,
        }}
        files={[marketPackageFile]}
      />,
    );

    const detail = openMarketPackageArtifact("Market package");
    expect(within(detail).getByText("Market package")).toBeTruthy();
    expect(within(detail).queryByText(/rfi/i)).toBeNull();
    expect(within(detail).queryByText(/rfp/i)).toBeNull();
    expect(screen.queryByText(/\bRFI\b/)).toBeNull();
    expect(screen.queryByText(/\bRFP\b/)).toBeNull();
  });

  it("does not send a vendor-waiting event back to intake approval", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "responses",
          lifecycle: "waiting_on_vendor",
        }}
        files={[]}
      />,
    );
    expect(screen.getByText("Waiting on Vendor")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Open event" }).getAttribute("href"),
    ).toBe("/source/events/event-1");
  });

  it("mounts response intake for one accepted supplier without making approval or award claims", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "responses",
          lifecycle: "waiting_on_vendor",
        }}
        files={[]}
        {...({
          responseIntake: {
            status: "available",
            blockers: [],
            asOf: "2026-03-10",
            uploadActionHref: "/api/v1/source/event-1/artifacts/upload",
            rows: [
              {
                supplierId: "supplier-alpha",
                authorityId: "authority-alpha",
                legalName: "Northstar Field Services",
                supplierGroup: "eligible_candidate",
                acceptedByName: "Named Procurement Reviewer",
                acceptedAt: "2026-03-09T14:00:00Z",
                evidenceReference: "candidate-panel-v1",
                uploadState: "uploaded",
                parseState: "parsed",
                availabilityReviewState: "available",
                workbookName: "northstar-response.xlsx",
                artifactId: "artifact-response-1",
                artifactVersion: 1,
                parsedRequirementCount: 18,
                uploadedAt: "2026-03-10T10:00:00Z",
                reviewedBy: "Named Evidence Reviewer",
                reviewedAt: "2026-03-10T12:00:00Z",
              },
            ],
            nextAction: {
              label: "Review normalized response availability",
              detail:
                "Availability review is recorded; evaluation remains blocked until governed scoring evidence exists.",
            },
          },
        } as Record<string, unknown>)}
      />,
    );

    const panel = screen.getByRole("region", {
      name: "Vendor response intake",
    });
    expect(
      within(panel).getByRole("heading", {
        name: "Vendor response intake",
      }),
    ).toBeTruthy();
    expect(
      within(panel).getAllByText("Northstar Field Services").length,
    ).toBeGreaterThanOrEqual(2);
    expect(within(panel).getByText("Uploaded")).toBeTruthy();
    expect(within(panel).getByText("Parsed")).toBeTruthy();
    expect(within(panel).getByText("Available")).toBeTruthy();
    expect(
      within(panel).getByText("18 normalized requirement rows"),
    ).toBeTruthy();
    expect(within(panel).getByLabelText("Accepted supplier")).toBeTruthy();
    expect(within(panel).getByLabelText("Synthetic response workbook")).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(
      /selected supplier|award approved|score complete|client-final/i,
    );
  });

  it("keeps evidence separate from category classification", () => {
    render(
      <SourceNewWorkspace event={{ ...request, category: "ams" }} files={[]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Intelligence" }));
    // The governed taxonomy label, never the stored id
    expect(screen.getByText("Application Managed Services (AMS)")).toBeTruthy();
    expect(screen.queryByText("ams")).toBeNull();
    expect(
      screen.getByText(
        "A category alone is not a benchmark, savings claim or supplier recommendation.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Files" }));
    expect(screen.getByText("No files here yet")).toBeTruthy();
  });

  it("renders the event intelligence workspace with governed context, gaps, refusals and one action", () => {
    const intelligence: SourceNewEventIntelligenceView = {
      posture: "limited",
      archetype: {
        id: "AMS_MANAGED_SERVICES",
        name: "IT Outsourcing / AMS / Managed Services",
        source: "classifier_category",
        reason:
          "Resolved archetype AMS_MANAGED_SERVICES from classifier category 'ams'.",
      },
      currentStage: "rfp",
      stageEvidenceContract: "available",
      requiredEvidence: [
        {
          key: "service_tower_scope",
          label: "Service tower scope",
          severity: "hard",
          whyNeeded: "Towers define the unit of service, SLA, and pricing.",
          sourceDocHint: "Tower scope matrix (XLSX)",
          state: "available",
        },
        {
          key: "sla_baseline",
          label: "SLA baseline",
          severity: "hard",
          whyNeeded: "Sets the service bar the partner must beat.",
          sourceDocHint: "Current SLA schedule (PDF/XLSX)",
          state: "gap",
        },
      ],
      governedContext: {
        policyVersion: "1.0.0",
        decision: "warn",
        usableCount: 1,
        blockedCount: 1,
        agentReadyCount: 1,
        citationsCount: 2,
        available: [
          {
            id: "artifact-ready",
            title: "Tower scope matrix",
            evidenceFamilies: ["service_tower_scope"],
            contextBundleTraceId: "ctx-trace-1",
          },
        ],
        blocked: [
          {
            id: "artifact-blocked",
            title: "Unpromoted SLA schedule",
            reasons: ["agent_readiness_status is committed_not_indexed"],
          },
        ],
      },
      industryMetrics: [
        {
          key: "ams_productivity_glidepath",
          label: "Committed annual productivity glide path",
          unit: "pct_per_year",
          requiredComparability: ["serviceScope", "scaleBand"],
          sourceAuthorities: ["licensed_research"],
        },
      ],
      allowedStatement:
        "Source can use Tower scope matrix for this IT Outsourcing / AMS / Managed Services event. It will not make claims that depend on the missing SLA baseline.",
      gaps: [
        "SLA baseline is required for this stage and is not ready to use.",
      ],
      refusals: [
        "Unpromoted SLA schedule: review its source, confidence, citations, and retrieval status before Source can use it.",
      ],
      nextQuestion: "Can you provide Current SLA schedule (PDF/XLSX)?",
      nextAction: {
        label: "Resolve evidence gap",
        detail:
          "Add or review SLA baseline before relying on this intelligence.",
      },
    };

    const view = render(
      <SourceNewWorkspace
        event={{
          ...request,
          category: "ams",
          lifecycle: "active",
          currentStage: "rfp",
        }}
        files={[]}
        intelligence={intelligence}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Intelligence" }));

    expect(
      screen.getByText("Matched from the event's recorded category."),
    ).toBeTruthy();

    expect(
      screen.getByRole("region", { name: "Event intelligence workspace" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Service tower scope").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("SLA baseline").length).toBeGreaterThan(0);
    expect(screen.getByText("Tower scope matrix")).toBeTruthy();
    expect(screen.getByText(/Source can use Tower scope matrix/)).toBeTruthy();
    expect(screen.getByText(/Unpromoted SLA schedule/)).toBeTruthy();
    expect(
      screen.getByText(/These are requirements for a fair comparison/),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Can you provide Current SLA schedule (PDF/XLSX)?",
      }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: "Resolve evidence gap" }),
    ).toHaveLength(1);
    expect(
      screen
        .getByRole("link", { name: "Resolve evidence gap" })
        .getAttribute("href"),
    ).toBe("/source/events/event-1?workspace=files");

    view.rerender(
      <SourceNewWorkspace
        event={{
          ...request,
          category: null,
          lifecycle: "active",
          currentStage: "rfp",
        }}
        files={[]}
        intelligence={{
          ...intelligence,
          archetype: {
            ...intelligence.archetype,
            source: "event_type_fallback",
          },
        }}
      />,
    );
    expect(
      screen.getByText(
        "Using the recorded event type as a fallback. A category mapping is not recorded.",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText("Matched from the event's recorded category."),
    ).toBeNull();
  });

  it("keeps high-volume intelligence review items behind an accessible expansion control", () => {
    const intelligence: SourceNewEventIntelligenceView = {
      posture: "limited",
      archetype: {
        id: "AMS_MANAGED_SERVICES",
        name: "IT Outsourcing / AMS / Managed Services",
        source: "classifier_category",
        reason:
          "Resolved archetype AMS_MANAGED_SERVICES from classifier category 'ams'.",
      },
      currentStage: "rfp",
      stageEvidenceContract: "available",
      requiredEvidence: [],
      governedContext: {
        policyVersion: "1.0.0",
        decision: "warn",
        usableCount: 0,
        blockedCount: 12,
        agentReadyCount: 0,
        citationsCount: 0,
        available: [],
        blocked: [],
      },
      industryMetrics: [],
      allowedStatement:
        "Source can identify missing evidence without treating it as usable context.",
      gaps: Array.from(
        { length: 12 },
        (_, index) => `Review item ${index + 1} needs governed evidence.`,
      ),
      refusals: [],
      nextQuestion: "Which governed evidence resolves the next review item?",
      nextAction: {
        label: "Resolve evidence gap",
        detail: "Review unresolved evidence before relying on this event.",
      },
    };

    render(
      <SourceNewWorkspace
        event={{
          ...request,
          category: "ams",
          lifecycle: "completed",
          currentStage: "value",
        }}
        files={[]}
        intelligence={intelligence}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Intelligence" }));

    expect(
      screen.getByText("Review item 1 needs governed evidence."),
    ).toBeTruthy();
    expect(
      screen.getByText("Review item 5 needs governed evidence."),
    ).toBeTruthy();
    expect(
      screen.queryByText("Review item 6 needs governed evidence."),
    ).toBeNull();
    expect(
      screen.queryByText("Review item 12 needs governed evidence."),
    ).toBeNull();

    const expand = screen.getByRole("button", {
      name: "Show all 12 review items",
    });
    expect(expand.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(expand);

    expect(
      screen.getByText("Review item 12 needs governed evidence."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Show fewer review items" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("explains a resolved final stage without calling the archetype unresolved", () => {
    const intelligence: SourceNewEventIntelligenceView = {
      posture: "blocked",
      archetype: {
        id: "AMS_MANAGED_SERVICES",
        name: "IT Outsourcing / AMS / Managed Services",
        source: "classifier_category",
        reason:
          "Resolved archetype AMS_MANAGED_SERVICES from classifier category 'ams'.",
      },
      currentStage: "value",
      stageEvidenceContract: "not_defined",
      requiredEvidence: [],
      governedContext: {
        policyVersion: "1.0.0",
        decision: "block",
        usableCount: 0,
        blockedCount: 1,
        agentReadyCount: 0,
        citationsCount: 0,
        available: [],
        blocked: [
          {
            id: "artifact-blocked",
            title: "Unreviewed value record",
            reasons: ["agent_readiness_status is not_reviewed"],
          },
        ],
      },
      industryMetrics: [],
      allowedStatement:
        "Source resolves this event to the IT Outsourcing / AMS / Managed Services playbook. That playbook does not define a separate evidence contract for the final Value stage, so final value claims must be supported by governed evidence from the completed lifecycle.",
      gaps: ["No current evidence is ready to cite yet."],
      refusals: [
        "Unreviewed value record: review its source, confidence, citations, and retrieval status before Source can use it.",
      ],
      nextQuestion:
        "Which governed evidence supports the recorded final value outcome?",
      nextAction: {
        label: "Review lifecycle evidence",
        detail:
          "Review the governed evidence and unresolved gaps from the completed lifecycle before relying on a final value claim.",
      },
    };

    render(
      <SourceNewWorkspace
        event={{
          ...request,
          category: "ams",
          lifecycle: "completed",
          currentStage: "value",
        }}
        files={[]}
        intelligence={intelligence}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Intelligence" }));

    expect(
      screen.getByText("No separate evidence contract for this stage."),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "The archetype is resolved. Review governed evidence from the completed lifecycle before relying on a final-stage claim.",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText(
        "The event needs a resolved archetype before evidence can be scored.",
      ),
    ).toBeNull();
  });

  it("labels intake phase as review-needed not completed for waiting_on_client", () => {
    render(<SourceNewWorkspace event={request} files={[]} />);
    const phases = screen.getByRole("navigation", { name: "Event phases" });
    const buttons = within(phases).getAllByRole("button");
    // Current phase badge must say review needed, never completed or approved
    expect(buttons[0].textContent).toContain("Review needed");
    buttons.forEach((btn) => {
      expect(btn.textContent).not.toMatch(/Completed|Approved/);
    });
    // Phases not yet reached are explicitly Later, not unlabeled
    expect(buttons[1].textContent).toContain("Later");
    expect(buttons[2].textContent).toContain("Later");
    expect(buttons[3].textContent).toContain("Later");
  });

  it("shows define as current and request as recorded without a completion label for active strategy", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "strategy", lifecycle: "active" }}
        files={[]}
      />,
    );
    const phases = screen.getByRole("navigation", { name: "Event phases" });
    const buttons = within(phases).getAllByRole("button");
    // Request is behind the event AND holds a recorded need, so it reads Recorded
    expect(buttons[0].textContent).toContain("Recorded");
    expect(buttons[0].textContent).not.toMatch(/Completed|Approved/);
    // Define is the current phase
    expect(buttons[1].textContent).toContain("Current");
    // Suppliers and Market package are later
    expect(buttons[2].textContent).toContain("Later");
    expect(buttons[3].textContent).toContain("Later");
    // Single unambiguous next action for the active stage
    expect(
      screen
        .getByRole("link", { name: "Open scope and strategy" })
        .getAttribute("href"),
    ).toBe("/source/events/event-1");
    expect(
      screen.getByText(
        "Review scope, baseline and decision requirements in the governed event.",
      ),
    ).toBeTruthy();
  });

  it("does not claim supplier or define work happened just because the event reached the market package", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "rfp", lifecycle: "active" }}
        files={[]}
      />,
    );
    const phases = screen.getByRole("navigation", { name: "Event phases" });
    const buttons = within(phases).getAllByRole("button");
    // Request holds a recorded need
    expect(buttons[0].textContent).toContain("Recorded");
    // Define and Suppliers & NDA hold nothing: no scope, no owner, no NDA, no files.
    // Being behind the current phase is not evidence that the work happened.
    expect(buttons[1].textContent).toContain("No record");
    expect(buttons[2].textContent).toContain("No record");
    buttons.forEach((btn) => {
      expect(btn.textContent).not.toMatch(/Completed|Approved/);
    });
    // Market package is the current phase
    expect(buttons[3].textContent).toContain("Current");
    // Single unambiguous next action
    expect(
      screen
        .getByRole("link", { name: "Open market package" })
        .getAttribute("href"),
    ).toBe("/source/events/event-1");
    expect(
      screen.getByText(
        "Review the package and its release requirements in the governed event.",
      ),
    ).toBeTruthy();
  });

  it("marks a recorded category the governed taxonomy does not know", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, category: "application_managed_services" }}
        files={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Intelligence" }));
    // The recorded value stays visible — it is what the event holds — but it is
    // not passed off as a governed category
    expect(screen.getByText("Application Managed Services")).toBeTruthy();
    expect(
      screen.getByText(/not one of the governed sourcing categories/),
    ).toBeTruthy();
  });

  it("reports supplier work as recorded when an NDA artifact is actually filed against it", () => {
    const nda: SourceNewFileRow = {
      ...responseFile,
      id: "nda-1",
      phase: "suppliers",
      artifactGroup: "upload",
      artifactType: "nda_executed",
      title: "Mutual NDA",
      fileName: "nda.pdf",
      fileFormat: "pdf",
      fileSize: 1024,
      version: 1,
      status: "approved",
      lifecycleState: "current",
      generatedAt: "2026-03-01T00:00:00Z",
      generatedBy: "Editor",
      sourceBasis: null,
      blobSha256: "sha-nda",
      approvalState: "approved",
      approvedBy: "Reviewer",
      approvedAt: "2026-03-02T00:00:00Z",
    };
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "rfp", lifecycle: "active" }}
        files={[nda]}
      />,
    );
    const buttons = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    expect(buttons[2].textContent).toContain("Recorded");
    expect(buttons[2].textContent).not.toMatch(/No record|Completed|Approved/);
  });

  it("shows one governed Stage 05 result for every accepted supplier", () => {
    const coverage: SourceNewStage05NdaCoverage = {
      status: "ready",
      asOf: "2026-03-10",
      suppliers: [
        {
          legalEntityId: "vendor-1",
          legalName: "Example Supplier Legal Entity LLC",
          state: "covered_by_nda",
          reason: "Executed NDA nda-1 covers this event and entity.",
          authorityReference: "nda-1",
          evidenceReference: "EVID-CANDIDATE-1",
          evidenceCaveats: [],
        },
      ],
      nextAction: {
        label: "Open market package gate",
        detail: "Every accepted supplier has governed coverage.",
      },
    };
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "rfp", lifecycle: "active" }}
        files={[]}
        stage05NdaCoverage={coverage}
      />,
    );

    const buttons = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    expect(buttons[2].textContent).toContain("Recorded");
    fireEvent.click(buttons[2]);

    const readiness = screen.getByRole("region", {
      name: "Stage 05 NDA readiness",
    });
    expect(
      within(readiness).getByText("Example Supplier Legal Entity LLC"),
    ).toBeTruthy();
    expect(
      within(readiness).getByText("Ready for governed supplier work"),
    ).toBeTruthy();
    expect(within(readiness).getByText("Executed NDA")).toBeTruthy();
    expect(within(readiness).getByText("nda-1")).toBeTruthy();
    expect(within(readiness).getByText("EVID-CANDIDATE-1")).toBeTruthy();
    expect(
      within(readiness).getByText("Open market package gate"),
    ).toBeTruthy();
    expect(
      within(readiness).queryByRole("button", { name: /send|contact/i }),
    ).toBeNull();
    expect(
      within(readiness).queryByRole("link", { name: /send|contact/i }),
    ).toBeNull();
  });

  it("renders the stage 04 panel, separating incumbents from new candidates", () => {
    // The mount, proven. The composer is covered on its own; this is the
    // seam — a panel nothing renders is the orphan this item exists to fix.
    const panel: SourceNewStage04VendorPanel = {
      status: "available",
      blockers: [],
      rows: [
        {
          authorityId: "auth-1",
          legalEntityId: "v-inc",
          legalName: "Incumbent Supplier LLC",
          group: "existing_contract_vendor",
          acceptedByName: "A. Buyer",
          acceptedAt: "2026-09-01T00:00:00Z",
          evidenceReference: "EVID-PANEL-1",
        },
        {
          authorityId: "auth-2",
          legalEntityId: "v-new",
          legalName: "New Supplier LLC",
          group: "eligible_candidate",
          acceptedByName: "A. Buyer",
          acceptedAt: "2026-09-02T00:00:00Z",
          evidenceReference: "EVID-PANEL-2",
          eligibility: {
            categoryKeys: ["managed-services"],
            functionKeys: ["technology"],
            archetypeKeys: ["application-managed-services"],
          },
          contactPolicy: "contact_allowed",
          contactBlocker: null,
          activeContactCount: 1,
          sourceReferences: ["EVID-PANEL-2", "EVID-SUPPLIER-2"],
        },
        {
          authorityId: "auth-3",
          legalEntityId: "v-selected",
          legalName: "Selected Supplier LLC",
          group: "selected_respondent",
          acceptedByName: "A. Buyer",
          acceptedAt: "2026-09-02T00:00:00Z",
          evidenceReference: "EVID-PANEL-3",
          eligibility: {
            categoryKeys: ["managed-services"],
            functionKeys: ["technology"],
            archetypeKeys: ["application-managed-services"],
          },
          contactPolicy: "contact_allowed",
          contactBlocker: null,
          activeContactCount: 1,
          selectedByName: "Named Sourcing Lead",
          selectedAt: "2026-09-20T03:00:00.000Z",
          selectionEvidenceReference: "EVID-SELECTION-3",
          sourceReferences: [
            "EVID-PANEL-3",
            "EVID-SUPPLIER-3",
            "EVID-SELECTION-3",
          ],
        },
      ],
      counts: {
        eligible_candidate: 1,
        selected_respondent: 1,
        existing_contract_vendor: 1,
      },
      notRecorded: [
        "Contact policy is not recorded for accepted candidates, so this panel makes no claim about who may be contacted.",
      ],
      suggestions: {
        status: "available",
        blockers: [],
        rows: [
          {
            supplierId: "suggested-1",
            legalEntityId: "suggested-1",
            legalName: "Synthetic Registry Supplier LLC",
            acceptedCategoryId: "managed-services",
            acceptedArchetypeId: "application-managed-services",
            label: "Suggested for review",
            existingContractVendor: false,
            eligibility: {
              categoryKeys: ["managed-services"],
              functionKeys: ["technology"],
              archetypeKeys: ["application-managed-services"],
            },
            contactPolicy: "review_required",
            contactReadiness: "review_required",
            contactActionAvailable: false,
            sourceReference: "EVID-SUGGESTED-1",
          },
        ],
        excludedCount: 2,
      },
      asOf: "2026-09-19",
    };

    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "rfp",
          lifecycle: "active",
          requestAuthorityVersionId: "22222222-2222-4222-8222-222222222222",
          requestVersionApproval: "accepted",
        }}
        files={[]}
        stage04VendorPanel={panel}
      />,
    );

    const buttons = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    fireEvent.click(buttons[2]);

    const region = screen.getByRole("region", {
      name: "Stage 04 vendor panel",
    });
    expect(within(region).getByText("Incumbent Supplier LLC")).toBeTruthy();
    expect(within(region).getByText("New Supplier LLC")).toBeTruthy();
    expect(
      within(region).getByText("Synthetic Registry Supplier LLC"),
    ).toBeTruthy();
    expect(
      within(region).getAllByText(/Suggested for review/).length,
    ).toBeGreaterThan(0);
    const acceptForm = within(region)
      .getByRole("button", { name: "Accept candidate" })
      .closest("form");
    expect(acceptForm?.getAttribute("action")).toBe(
      "/api/v1/source/event-1/candidate-suppliers/accept",
    );
    expect(
      acceptForm?.querySelector<HTMLInputElement>('input[name="supplierId"]')
        ?.value,
    ).toBe("suggested-1");
    expect(
      acceptForm?.querySelector<HTMLInputElement>('input[name="categoryId"]')
        ?.value,
    ).toBe("managed-services");
    expect(
      acceptForm?.querySelector<HTMLInputElement>('input[name="archetypeId"]')
        ?.value,
    ).toBe("application-managed-services");
    expect(
      acceptForm?.querySelector<HTMLInputElement>(
        'input[name="sourceReference"]',
      )?.value,
    ).toBe("EVID-SUGGESTED-1");
    expect(
      acceptForm?.querySelector<HTMLInputElement>(
        'input[name="eventVersionId"]',
      )?.value,
    ).toBe("22222222-2222-4222-8222-222222222222");

    // The distinction itself, not just the names. Read off the rows so the
    // assertion is about which supplier got which label, not about a phrase
    // appearing somewhere on the page.
    const rowText = within(region)
      .getAllByRole("listitem")
      .map((li) => li.textContent ?? "");
    expect(rowText.find((t) => t.includes("Incumbent Supplier LLC"))).toContain(
      "already under contract",
    );
    expect(rowText.find((t) => t.includes("New Supplier LLC"))).toContain(
      "not under contract",
    );
    expect(rowText.find((t) => t.includes("New Supplier LLC"))).toContain(
      "Eligibility: managed-services / technology / application-managed-services",
    );
    expect(rowText.find((t) => t.includes("New Supplier LLC"))).toContain(
      "Contact policy: contact allowed",
    );
    expect(rowText.find((t) => t.includes("New Supplier LLC"))).toContain(
      "Sources: EVID-PANEL-2; EVID-SUPPLIER-2",
    );
    expect(rowText.find((t) => t.includes("Selected Supplier LLC"))).toContain(
      "selected respondent",
    );
    expect(rowText.find((t) => t.includes("Selected Supplier LLC"))).toContain(
      "Selected by Named Sourcing Lead on 2026-09-20",
    );
    expect(rowText.find((t) => t.includes("Selected Supplier LLC"))).toContain(
      "Selection evidence: EVID-SELECTION-3",
    );

    // Who accepted it, on the screen and not only in the data. A panel row
    // without its provenance is an assertion the reader cannot check.
    expect(rowText.find((t) => t.includes("Incumbent Supplier LLC"))).toContain(
      "Accepted by A. Buyer",
    );

    // What the panel does not know, on the surface rather than buried.
    expect(
      within(region).getAllByText(/makes no claim about who may be contacted/)
        .length,
    ).toBeGreaterThan(0);

    // No send, contact or select affordance reaches the reader.
    expect(
      within(region).queryByRole("button", { name: /send|contact|select/i }),
    ).toBeNull();
    expect(
      within(region).queryByRole("link", { name: /send|contact|select/i }),
    ).toBeNull();
  });

  it("withholds supplier acceptance when the current Request version is unreadable", () => {
    const panel: SourceNewStage04VendorPanel = {
      status: "empty",
      blockers: [],
      rows: [],
      counts: {
        eligible_candidate: 0,
        selected_respondent: 0,
        existing_contract_vendor: 0,
      },
      notRecorded: [],
      suggestions: {
        status: "available",
        blockers: [],
        rows: [
          {
            supplierId: "suggested-1",
            legalEntityId: "suggested-1",
            legalName: "Synthetic Registry Supplier LLC",
            acceptedCategoryId: "managed-services",
            acceptedArchetypeId: "application-managed-services",
            label: "Suggested for review",
            existingContractVendor: false,
            eligibility: {
              categoryKeys: ["managed-services"],
              functionKeys: [],
              archetypeKeys: ["application-managed-services"],
            },
            contactPolicy: "review_required",
            contactReadiness: "review_required",
            contactActionAvailable: false,
            sourceReference: "EVID-SUGGESTED-1",
          },
        ],
        excludedCount: 0,
      },
      asOf: "2026-09-19",
    };

    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "rfp", lifecycle: "active" }}
        files={[]}
        stage04VendorPanel={panel}
      />,
    );

    const buttons = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    fireEvent.click(buttons[2]);

    const region = screen.getByRole("region", {
      name: "Stage 04 vendor panel",
    });
    expect(
      within(region).queryByRole("button", { name: "Accept candidate" }),
    ).toBeNull();
    expect(
      within(region).getByText(
        /current Request version must be readable and accepted/i,
      ),
    ).toBeTruthy();
  });

  it("shows the stage 04 blocker instead of a panel when a read failed", () => {
    // A blocked panel must not render rows at all. Showing a partial panel
    // is how every incumbent ends up looking like a new candidate.
    const panel: SourceNewStage04VendorPanel = {
      status: "blocked",
      blockers: [
        "The contract register could not be read, so an existing-contract vendor cannot be told from a new candidate.",
      ],
      rows: [],
      counts: {
        eligible_candidate: 0,
        selected_respondent: 0,
        existing_contract_vendor: 0,
      },
      notRecorded: [],
      suggestions: {
        status: "blocked",
        blockers: ["The contract register could not be read."],
        rows: [],
        excludedCount: 0,
      },
      asOf: "2026-09-19",
    };

    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "rfp", lifecycle: "active" }}
        files={[]}
        stage04VendorPanel={panel}
      />,
    );

    const buttons = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    fireEvent.click(buttons[2]);

    const region = screen.getByRole("region", {
      name: "Stage 04 vendor panel",
    });
    expect(within(region).getByText("Panel withheld")).toBeTruthy();
    expect(
      within(region).getByText(/cannot be told from a new candidate/),
    ).toBeTruthy();
    expect(within(region).queryByText(/under contract\./)).toBeNull();
  });

  it("keeps covered and uncovered accepted suppliers visible together", () => {
    const coverage: SourceNewStage05NdaCoverage = {
      status: "blocked",
      asOf: "2026-03-10",
      suppliers: [
        {
          legalEntityId: "vendor-1",
          legalName: "Covered Supplier LLC",
          state: "covered_by_nda",
          reason: "Executed NDA nda-1 covers this event and entity.",
          authorityReference: "nda-1",
          evidenceReference: "EVID-CANDIDATE-1",
          evidenceCaveats: [],
        },
        {
          legalEntityId: "vendor-2",
          legalName: "Uncovered Supplier Inc.",
          state: "not_covered",
          reason:
            "No executed NDA covers this event and no waiver has been granted.",
          authorityReference: null,
          evidenceReference: "EVID-CANDIDATE-2",
          evidenceCaveats: [],
        },
      ],
      nextAction: {
        label: "Resolve NDA coverage",
        detail: "Resolve every uncovered supplier.",
      },
    };
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "rfp", lifecycle: "active" }}
        files={[]}
        stage05NdaCoverage={coverage}
      />,
    );

    const buttons = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    fireEvent.click(buttons[2]);

    const readiness = screen.getByRole("region", {
      name: "Stage 05 NDA readiness",
    });
    expect(within(readiness).getByText("Covered Supplier LLC")).toBeTruthy();
    expect(within(readiness).getByText("Uncovered Supplier Inc.")).toBeTruthy();
    expect(within(readiness).getByText("Not covered")).toBeTruthy();
    expect(within(readiness).getByText("Resolve NDA coverage")).toBeTruthy();
  });

  it("distinguishes an unavailable authority registry from no accepted suppliers", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "rfp", lifecycle: "active" }}
        files={[]}
      />,
    );

    const buttons = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    fireEvent.click(buttons[2]);

    const readiness = screen.getByRole("region", {
      name: "Stage 05 NDA readiness",
    });
    expect(
      within(readiness).getByText(
        "Candidate-panel authority is unavailable; an empty result is not assumed.",
      ),
    ).toBeTruthy();
    expect(
      within(readiness).getByText("Restore candidate authority"),
    ).toBeTruthy();
  });

  it("does not lock phases behind an event that has advanced past them", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "evaluation", lifecycle: "active" }}
        files={[]}
      />,
    );
    const buttons = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    // Request and Define cannot be "not yet open" for an event already in evaluation
    buttons.forEach((btn) => {
      expect(btn.textContent).not.toContain("Later");
    });
    expect(buttons[0].textContent).toContain("Recorded");
    expect(buttons[3].textContent).toContain("No record");
    // The rail shows no live step, so the surface says where the event actually is
    expect(
      screen.getByText(
        "This event has moved past the phases shown here. Its current stage is Evaluation.",
      ),
    ).toBeTruthy();
  });

  it("mounts Stage 04 vendor readiness on the reachable Source New responses stage", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "responses",
          lifecycle: "waiting_on_vendor",
          solicitationMotion: "rfp",
          solicitationMotionAcceptedAt: "2026-03-08T00:00:00Z",
          solicitationMotionAcceptedByUserId: "person-1",
        }}
        files={[responseFile]}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Stage 04 vendor readiness" }),
    ).toBeTruthy();
    expect(screen.getByText("Candidate response readiness")).toBeTruthy();
    expect(
      screen.getByText("1 tenant-scoped response file available"),
    ).toBeTruthy();
    expect(screen.getByText("Ready for evaluation intake review")).toBeTruthy();
  });

  it("reports request authority as unread rather than unaccepted when the store cannot answer", () => {
    // The authority tables are behind the separate migration apply gate, so
    // the store returns nothing today. A surface that renders that as "not
    // accepted" tells the client a decision nobody made.
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "responses",
          lifecycle: "waiting_on_vendor",
          solicitationMotion: "rfp",
          solicitationMotionAcceptedAt: "2026-03-08T00:00:00Z",
          solicitationMotionAcceptedByUserId: "person-1",
          requestVersionApproval: null,
        }}
        files={[responseFile]}
      />,
    );

    const readiness = screen.getByRole("region", {
      name: "Stage 04 vendor readiness",
    });
    expect(within(readiness).getByText("Not recorded")).toBeTruthy();
    // The negative half, and the point of the case: absence is not a blocker.
    expect(document.body.textContent ?? "").not.toMatch(
      /Changes are requested on the current Request version/,
    );
  });

  it("blocks on an explicit changes-requested decision on the Request version", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "responses",
          lifecycle: "waiting_on_vendor",
          solicitationMotion: "rfp",
          solicitationMotionAcceptedAt: "2026-03-08T00:00:00Z",
          solicitationMotionAcceptedByUserId: "person-1",
          requestVersionApproval: "changes_requested",
        }}
        files={[responseFile]}
      />,
    );

    expect(
      screen.getByText(/Changes are requested on the current Request version/),
    ).toBeTruthy();
  });

  it("does not block when the Request version is accepted", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "responses",
          lifecycle: "waiting_on_vendor",
          solicitationMotion: "rfp",
          solicitationMotionAcceptedAt: "2026-03-08T00:00:00Z",
          solicitationMotionAcceptedByUserId: "person-1",
          requestVersionApproval: "accepted",
        }}
        files={[responseFile]}
      />,
    );

    const readiness = screen.getByRole("region", {
      name: "Stage 04 vendor readiness",
    });
    expect(
      within(readiness).getByText("Request version accepted"),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(
      /Changes are requested on the current Request version/,
    );
  });

  it("shows a tenant-scoped empty state instead of inventing candidate vendors", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "responses",
          lifecycle: "waiting_on_vendor",
          solicitationMotion: "rfp",
          solicitationMotionAcceptedAt: "2026-03-08T00:00:00Z",
          solicitationMotionAcceptedByUserId: "person-1",
        }}
        files={[]}
      />,
    );

    expect(
      screen.getByText("No tenant-scoped candidate response files loaded"),
    ).toBeTruthy();
    expect(screen.getByText("Blocked before evaluation")).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(
      /Vendor A|Northbridge|Ardent/,
    );
  });

  it("keeps candidate readiness separate from award readiness and exposes no contact or send action", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "responses",
          lifecycle: "waiting_on_vendor",
          solicitationMotion: "rfp",
        }}
        files={[responseFile]}
      />,
    );

    const readiness = screen.getByRole("region", {
      name: "Stage 04 vendor readiness",
    });
    expect(
      within(readiness).getAllByText(/candidate response evidence/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/It is not award readiness/i)).toBeTruthy();
    expect(
      screen.getByText(/No accepted solicitation motion is recorded/i),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Vendor contact, send, and notification actions stay unavailable/i,
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /send|contact/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /send|contact/i })).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(
      /award approved|selected vendor/i,
    );
  });

  it("never prints a raw stage key to an operator", () => {
    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "rfp_rfi_package",
          lifecycle: "paused",
        }}
        files={[]}
      />,
    );
    expect(screen.getByText("Current stage: Market package")).toBeTruthy();
    expect(screen.queryByText(/rfp_rfi_package|rfp rfi package/i)).toBeNull();
  });

  describe("file download version pinning", () => {
    const baseFile: SourceNewFileRow = {
      ...responseFile,
      id: "current-id",
      phase: "define",
      artifactGroup: "generated",
      artifactType: "strategy_brief",
      title: "Strategy brief",
      fileName: "strategy-brief.pdf",
      fileFormat: "pdf",
      fileSize: 2048,
      version: 3,
      status: "approved",
      lifecycleState: "current",
      generatedAt: "2026-02-01T00:00:00Z",
      generatedBy: "Editor",
      sourceBasis: null,
      blobSha256: "sha-current",
      approvalState: "approved",
      approvedBy: "Reviewer",
      approvedAt: "2026-02-02T00:00:00Z",
    };
    const olderFile: SourceNewFileRow = {
      ...baseFile,
      id: "older-id",
      version: 2,
      lifecycleState: "superseded",
      status: "superseded",
      generatedAt: "2026-01-01T00:00:00Z",
      blobSha256: "sha-older",
    };
    it("pins historical rows to the exact selected version via includeHistory=1", () => {
      expect(sourceNewFileDownloadHref(olderFile)).toBe(
        `/api/v1/source/artifacts/${encodeURIComponent(olderFile.id)}/download?includeHistory=1`,
      );
    });

    it("lets current rows use normal authority resolution without includeHistory", () => {
      expect(sourceNewFileDownloadHref(baseFile)).toBe(
        `/api/v1/source/artifacts/${encodeURIComponent(baseFile.id)}/download`,
      );
    });
  });

  it("shows distinct unambiguous work content when navigating earlier and later phases", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "strategy", lifecycle: "active" }}
        files={[]}
      />,
    );
    const getPhaseButtons = () =>
      within(
        screen.getByRole("navigation", { name: "Event phases" }),
      ).getAllByRole("button");

    // Navigate to a phase the event has moved past (Request is before the current Define)
    fireEvent.click(getPhaseButtons()[0]);
    expect(screen.getByText("Recorded earlier in this event")).toBeTruthy();
    expect(screen.queryByText("This phase is not yet open")).toBeNull();
    // Sidebar offers one return action — no second primary link
    expect(screen.getByRole("button", { name: "Current work" })).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Open scope and strategy" }),
    ).toBeNull();

    // Navigate to a later phase (Suppliers & NDA is after Define)
    fireEvent.click(getPhaseButtons()[2]);
    expect(screen.getByText("This phase is not yet open")).toBeTruthy();
    expect(screen.queryByText("Recorded earlier in this event")).toBeNull();
    // Sidebar still offers one return action
    expect(screen.getByRole("button", { name: "Current work" })).toBeTruthy();
  });

  it("mounts the governed historical Request summary and keeps one return action", () => {
    const historicalRequestSummary: HistoricalRequestSummary = {
      requestFacts: [
        { key: "need", label: "Need", value: request.trigger! },
        {
          key: "scope",
          label: "Scope",
          value: "Run and enhance the application estate.",
        },
        {
          key: "category",
          label: "Category",
          value: "Application Managed Services (AMS)",
        },
        {
          key: "decision-owner",
          label: "Decision owner",
          value: "VP Technology Operations",
        },
      ],
      originFacts: [
        {
          key: "source-request",
          label: "Source request",
          value: "ServiceNow · SRC0010042",
        },
        {
          key: "requester",
          label: "Requester",
          value: "IT Service Portfolio Lead",
        },
      ],
      mappingFacts: [
        {
          key: "mapping-archetype",
          label: "Mapping archetype",
          value: "AMS_MANAGED_SERVICES",
        },
        {
          key: "mapping-decision",
          label: "Mapping decision",
          value: "Accepted by Procurement Lead",
        },
      ],
      mappingGap: null,
    };

    render(
      <SourceNewWorkspace
        event={{
          ...request,
          currentStage: "strategy",
          lifecycle: "active",
          category: "ams",
          scope: "Run and enhance the application estate.",
          decisionOwner: "VP Technology Operations",
        }}
        files={[]}
        historicalRequestSummary={historicalRequestSummary}
      />,
    );

    const phases = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    fireEvent.click(phases[0]);

    const summary = screen.getByRole("region", {
      name: "Historical Request summary",
    });
    expect(within(summary).getByText("A contract is nearing renewal.")).toBeTruthy();
    expect(
      within(summary).getByText("Run and enhance the application estate."),
    ).toBeTruthy();
    expect(
      within(summary).getByText("Application Managed Services (AMS)"),
    ).toBeTruthy();
    expect(within(summary).getByText("VP Technology Operations")).toBeTruthy();
    expect(within(summary).getByText("ServiceNow · SRC0010042")).toBeTruthy();
    expect(
      within(summary).getByText("IT Service Portfolio Lead"),
    ).toBeTruthy();
    expect(within(summary).getByText("AMS_MANAGED_SERVICES")).toBeTruthy();
    expect(
      within(summary).getByText("Accepted by Procurement Lead"),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Current work" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /approve|continue|advance/i })).toBeNull();
  });

  it("does not infer ServiceNow origin for historical Request work", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, currentStage: "strategy", lifecycle: "active" }}
        files={[]}
        historicalRequestSummary={{
          requestFacts: [
            { key: "need", label: "Need", value: request.trigger! },
          ],
          originFacts: [],
          mappingFacts: [],
          mappingGap: null,
        }}
      />,
    );

    const phases = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");
    fireEvent.click(phases[0]);

    expect(
      screen.getByRole("region", { name: "Historical Request summary" }),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").not.toContain("ServiceNow");
  });

  it("names the unmet conditions for previewed phases without exposing an advance action", () => {
    render(<SourceNewWorkspace event={request} files={[]} />);
    const phases = within(
      screen.getByRole("navigation", { name: "Event phases" }),
    ).getAllByRole("button");

    fireEvent.click(phases[1]);
    expect(
      screen.getByText(
        "Before this phase can open: intake approval must be recorded.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Current work" })).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: /approve|continue|advance/i }),
    ).toBeNull();

    fireEvent.click(phases[3]);
    expect(
      screen.getByText(
        "Before this phase can open: scope, supplier eligibility, and required NDA coverage must be ready.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Current work" })).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: /approve|continue|advance/i }),
    ).toBeNull();
  });

  /**
   * The approvals view told the reader that "the approval record, actor and
   * evidence live in the governed event flow" and then showed none of it —
   * the writer had been recording a trail nothing read back.
   *
   * The three states below must stay distinguishable. On an approval surface,
   * rendering a failed read as an empty list states the reassuring fact.
   */
  function openApprovals() {
    fireEvent.click(screen.getByRole("button", { name: "Approvals" }));
  }

  it("shows the recorded decisions, with actor and reason", () => {
    render(
      <SourceNewWorkspace
        event={request}
        files={[]}
        activity={{
          ok: true,
          entries: [
            {
              id: "a1",
              at: "2026-09-18T12:00:00.000Z",
              actor: "A. Reviewer · procurement",
              body: "Approved intake (Stage: intake) Reason: Scope and baseline confirmed.",
            },
          ],
        }}
      />,
    );
    openApprovals();

    const trail = screen.getByRole("list", { name: "Decision trail" });
    expect(within(trail).getByText(/A\. Reviewer/)).toBeTruthy();
    expect(
      within(trail).getByText(/Scope and baseline confirmed/),
    ).toBeTruthy();
  });

  it("keeps historical approval activity concise until the trail is expanded", () => {
    render(
      <SourceNewWorkspace
        event={{ ...request, lifecycle: "completed", currentStage: "value" }}
        files={[]}
        activity={{
          ok: true,
          entries: Array.from({ length: 9 }, (_, index) => ({
            id: `a${index + 1}`,
            at: `2026-09-${String(index + 10).padStart(2, "0")}T12:00:00.000Z`,
            actor: `Reviewer ${index + 1}`,
            body: `Approval activity ${index + 1}`,
          })),
        }}
      />,
    );
    openApprovals();

    const trail = screen.getByRole("list", { name: "Decision trail" });
    expect(within(trail).getByText("Approval activity 1")).toBeTruthy();
    expect(within(trail).getByText("Approval activity 6")).toBeTruthy();
    expect(within(trail).queryByText("Approval activity 7")).toBeNull();
    expect(within(trail).queryByText("Approval activity 9")).toBeNull();

    const expand = screen.getByRole("button", {
      name: "Show all 9 decision trail entries",
    });
    expect(expand.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(expand);

    expect(within(trail).getByText("Approval activity 9")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Show fewer decision trail entries" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("says no decisions are recorded when the trail is genuinely empty", () => {
    render(
      <SourceNewWorkspace
        event={request}
        files={[]}
        activity={{ ok: true, entries: [] }}
      />,
    );
    openApprovals();

    expect(screen.getByText(/No decisions have been recorded/i)).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Decision trail" })).toBeNull();
  });

  it("does not report an unreadable trail as an absence of decisions", () => {
    render(
      <SourceNewWorkspace
        event={request}
        files={[]}
        activity={{ ok: false, reason: "connection refused" }}
      />,
    );
    openApprovals();

    // The distinction this whole change exists for.
    expect(screen.getByText(/could not be read/i)).toBeTruthy();
    expect(screen.queryByText(/No decisions have been recorded/i)).toBeNull();
    // And it must not leak the underlying error to a client surface.
    expect(document.body.textContent ?? "").not.toContain("connection refused");
  });

  it("renders an active event when the activity read-model shape is missing entries", () => {
    const originalFetch = global.fetch;
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as typeof fetch;
    try {
      render(
        <SourceNewWorkspace
          event={{
            ...request,
            currentStage: "responses",
            lifecycle: "active",
          }}
          files={[responseFile]}
          activity={{ ok: true } as unknown as SourceEventActivityResult}
        />,
      );
      openApprovals();

      expect(screen.getByText(/could not be read/i)).toBeTruthy();
      expect(screen.queryByText(/No decisions have been recorded/i)).toBeNull();
      expect(screen.queryByRole("list", { name: "Decision trail" })).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("says the trail was not loaded when a caller passes none", () => {
    render(<SourceNewWorkspace event={request} files={[]} />);
    openApprovals();

    expect(screen.getByText(/was not loaded/i)).toBeTruthy();
    expect(screen.queryByText(/No decisions have been recorded/i)).toBeNull();
  });

  /**
   * U-002: on a real signed-in event, selecting Approvals replaced the whole
   * workspace with the global unhandled-error surface. No write was
   * attempted; the view switch alone failed.
   *
   * The trail's timestamp is typed `string` and assigned straight from
   * `occurred_at` with no coercion. A timestamptz column does not have to
   * arrive as a string, and a non-string rendered as a React child throws —
   * taking the whole page to the error boundary, not just the panel.
   *
   * The original tests for this view used ISO string fixtures, so they proved
   * the component against a world the database does not have to produce.
   */
  it("does not crash the workspace when a trail timestamp is not a string", () => {
    const stamp = new Date("2026-09-18T12:00:00.000Z");
    render(
      <SourceNewWorkspace
        event={request}
        files={[]}
        activity={{
          ok: true,
          entries: [
            {
              id: "a1",
              at: stamp as unknown as string,
              actor: "A. Reviewer",
              body: "Approved intake",
            },
          ],
        }}
      />,
    );

    // The panel only mounts on the view switch. A first draft of this test
    // asserted on render alone and passed without ever mounting it.
    expect(() => openApprovals()).not.toThrow();
  });

  it("does not crash when the trail result is missing its entries array", () => {
    render(
      <SourceNewWorkspace
        event={request}
        files={[]}
        activity={{ ok: true } as never}
      />,
    );

    expect(() => openApprovals()).not.toThrow();
  });
});
