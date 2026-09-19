/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  SourceNewWorkspace,
  sourceNewFileDownloadHref,
  type SourceNewEventView,
} from "./SourceNewWorkspace";
import type { SourceNewFileRow } from "./SourceNewFiles";
import type { SourceEventActivityResult } from "@/lib/source/activity-log";
import type { SourceNewEventIntelligenceView } from "@/lib/source/new-workspace/event-intelligence";

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/shell/AtlasPageStateProvider", () => ({
  useAtlasPageState: () => null,
}));

jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: ({ workspace }: { workspace: React.ReactNode }) => (
    <div>{workspace}</div>
  ),
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

describe("SourceNewWorkspace", () => {
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

  it("shows completed events as terminal without a pending next action", () => {
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
    expect(within(status).getByText("Event completed")).toBeTruthy();
    expect(
      within(status).getByText(
        "The governed event is complete. No next action is pending in Source New.",
      ),
    ).toBeTruthy();
    expect(
      within(status).queryByRole("link", {
        name: /Open event|Open current stage/i,
      }),
    ).toBeNull();
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

    render(
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

  it("shows Stage 05 NDA readiness from a governed supplier legal entity", () => {
    const nda: SourceNewFileRow = {
      ...responseFile,
      id: "nda-ready-1",
      phase: "suppliers",
      artifactType: "nda_executed",
      title: "Executed mutual NDA",
      fileName: "executed-nda.pdf",
      status: "approved",
      lifecycleState: "current",
      approvalState: "approved",
      approvedAt: "2026-03-02T00:00:00Z",
      blobSha256: "sha-nda-ready",
      coveredSupplierLegalEntity: "Example Supplier Legal Entity LLC",
      coveredScopeId: "event-scope-v1",
      effectiveFrom: "2026-03-01",
      expiresOn: "2027-03-01",
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
    expect(
      within(readiness).getByText(
        "Supplier legal entity recorded: Example Supplier Legal Entity LLC",
      ),
    ).toBeTruthy();
    expect(within(readiness).getByText("event-scope-v1")).toBeTruthy();
    expect(
      within(readiness).getByText("NDA scope recorded: event-scope-v1"),
    ).toBeTruthy();
    expect(
      within(readiness).getAllByText("2026-03-01 to 2027-03-01").length,
    ).toBeGreaterThan(0);
    expect(
      within(readiness).getByText(
        "No Stage 05 NDA blocker is visible in this read model.",
      ),
    ).toBeTruthy();
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

  it("blocks Stage 05 NDA readiness when a file exists without a supplier legal entity", () => {
    const nda: SourceNewFileRow = {
      ...responseFile,
      id: "nda-blocked-1",
      phase: "suppliers",
      artifactType: "nda_executed",
      title: "Mutual NDA",
      fileName: "supplier-nda.pdf",
      status: "approved",
      lifecycleState: "current",
      approvalState: "approved",
      approvedAt: "2026-03-02T00:00:00Z",
      blobSha256: "sha-nda-blocked",
      coveredSupplierLegalEntity: null,
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
    fireEvent.click(buttons[2]);

    const readiness = screen.getByRole("region", {
      name: "Stage 05 NDA readiness",
    });
    expect(
      within(readiness).getAllByText("Not recorded").length,
    ).toBeGreaterThan(0);
    expect(
      within(readiness).getByText("Blocked before supplier work"),
    ).toBeTruthy();
    expect(
      within(readiness).getByText(
        "No governed supplier legal entity is tied to the NDA artifact.",
      ),
    ).toBeTruthy();
    expect(within(readiness).getByText("Record legal entity")).toBeTruthy();
    expect(document.body.textContent ?? "").not.toContain(
      "Example Supplier Legal Entity LLC",
    );
  });

  it("blocks Stage 05 NDA readiness when scope and validity evidence is missing", () => {
    const nda: SourceNewFileRow = {
      ...responseFile,
      id: "nda-missing-scope-validity-1",
      phase: "suppliers",
      artifactType: "nda_executed",
      title: "Executed mutual NDA",
      fileName: "executed-nda.pdf",
      status: "approved",
      lifecycleState: "current",
      approvalState: "approved",
      approvedAt: "2026-03-02T00:00:00Z",
      blobSha256: "sha-nda-missing-scope-validity",
      coveredSupplierLegalEntity: "Example Supplier Legal Entity LLC",
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
    fireEvent.click(buttons[2]);

    const readiness = screen.getByRole("region", {
      name: "Stage 05 NDA readiness",
    });
    expect(
      within(readiness).getByText("Blocked before supplier work"),
    ).toBeTruthy();
    expect(
      within(readiness).getByText(
        "No governed NDA scope is tied to the artifact.",
      ),
    ).toBeTruthy();
    expect(
      within(readiness).getByText(
        "No NDA effective and expiration dates are recorded.",
      ),
    ).toBeTruthy();
    expect(within(readiness).getByText("Record NDA scope")).toBeTruthy();
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
      <SourceNewWorkspace event={request} files={[]} activity={{ ok: true } as never} />,
    );

    expect(() => openApprovals()).not.toThrow();
  });
});
