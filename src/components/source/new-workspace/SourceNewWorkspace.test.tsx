/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { SourceNewWorkspace, sourceNewFileDownloadHref, type SourceNewEventView } from "./SourceNewWorkspace";
import type { SourceNewFileRow } from "./SourceNewFiles";

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/shell/AtlasPageStateProvider", () => ({
  useAtlasPageState: () => null,
}));

jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: ({ workspace }: { workspace: React.ReactNode }) => <div>{workspace}</div>,
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

describe("SourceNewWorkspace", () => {
  it("shows one next action for a request without marking missing facts complete", () => {
    render(<SourceNewWorkspace event={request} files={[]} />);
    const action = screen.getByRole("complementary", { name: "Next action" });
    expect(within(action).getByRole("link", { name: "Review intake" }).getAttribute("href"))
      .toBe("/source/events/event-1/approval");
    expect(screen.getAllByRole("link", { name: "Review intake" })).toHaveLength(1);
    expect(screen.getAllByText("Not recorded")).toHaveLength(2);
    expect(screen.getByText("Awaiting intake review")).toBeTruthy();
  });

  it("does not pretend the market package remains current after the event advances", () => {
    render(<SourceNewWorkspace event={{ ...request, currentStage: "evaluation", lifecycle: "active" }} files={[]} />);
    expect(screen.getByText("Current stage: Evaluation")).toBeTruthy();
    expect(screen.queryByText("This step is not open yet")).toBeNull();
    expect(screen.getByRole("link", { name: "Open current stage" }).getAttribute("href"))
      .toBe("/source/events/event-1");
  });

  it("does not label a competitive RFP event or its file folder as RFI", () => {
    render(<SourceNewWorkspace event={{ ...request, eventType: "competitive_sourcing", currentStage: "rfp", lifecycle: "active" }} files={[]} />);
    const phases = screen.getByRole("navigation", { name: "Event phases" });
    expect(within(phases).getByRole("button", { name: /Market package/ })).toBeTruthy();
    expect(within(phases).queryByText("RFI")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Files" }));
    const folders = screen.getByRole("navigation", { name: "File folders" });
    expect(within(folders).getByRole("button", { name: "Market package" })).toBeTruthy();
    expect(within(folders).queryByText("RFI")).toBeNull();
  });

  it("does not send a vendor-waiting event back to intake approval", () => {
    render(<SourceNewWorkspace event={{ ...request, currentStage: "responses", lifecycle: "waiting_on_vendor" }} files={[]} />);
    expect(screen.getByText("Waiting on Vendor")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open event" }).getAttribute("href"))
      .toBe("/source/events/event-1");
  });

  it("keeps evidence separate from category classification", () => {
    render(<SourceNewWorkspace event={{ ...request, category: "ams" }} files={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Intelligence" }));
    // The governed taxonomy label, never the stored id
    expect(screen.getByText("Application Managed Services (AMS)")).toBeTruthy();
    expect(screen.queryByText("ams")).toBeNull();
    expect(screen.getByText("A category alone is not a benchmark, savings claim or supplier recommendation.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Files" }));
    expect(screen.getByText("No files here yet")).toBeTruthy();
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
    render(<SourceNewWorkspace event={{ ...request, currentStage: "strategy", lifecycle: "active" }} files={[]} />);
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
    expect(screen.getByRole("link", { name: "Open scope and strategy" }).getAttribute("href"))
      .toBe("/source/events/event-1");
    expect(screen.getByText("Review scope, baseline and decision requirements in the governed event.")).toBeTruthy();
  });

  it("does not claim supplier or define work happened just because the event reached the market package", () => {
    render(<SourceNewWorkspace event={{ ...request, currentStage: "rfp", lifecycle: "active" }} files={[]} />);
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
    expect(screen.getByRole("link", { name: "Open market package" }).getAttribute("href"))
      .toBe("/source/events/event-1");
    expect(screen.getByText("Review the package and its release requirements in the governed event.")).toBeTruthy();
  });

  it("marks a recorded category the governed taxonomy does not know", () => {
    render(<SourceNewWorkspace event={{ ...request, category: "application_managed_services" }} files={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Intelligence" }));
    // The recorded value stays visible — it is what the event holds — but it is
    // not passed off as a governed category
    expect(screen.getByText("Application Managed Services")).toBeTruthy();
    expect(screen.getByText(/not one of the governed sourcing categories/)).toBeTruthy();
  });

  it("reports supplier work as recorded when an NDA artifact is actually filed against it", () => {
    const nda: SourceNewFileRow = {
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
    render(<SourceNewWorkspace event={{ ...request, currentStage: "rfp", lifecycle: "active" }} files={[nda]} />);
    const buttons = within(screen.getByRole("navigation", { name: "Event phases" })).getAllByRole("button");
    expect(buttons[2].textContent).toContain("Recorded");
    expect(buttons[2].textContent).not.toMatch(/No record|Completed|Approved/);
  });

  it("does not lock phases behind an event that has advanced past them", () => {
    render(<SourceNewWorkspace event={{ ...request, currentStage: "evaluation", lifecycle: "active" }} files={[]} />);
    const buttons = within(screen.getByRole("navigation", { name: "Event phases" })).getAllByRole("button");
    // Request and Define cannot be "not yet open" for an event already in evaluation
    buttons.forEach((btn) => {
      expect(btn.textContent).not.toContain("Later");
    });
    expect(buttons[0].textContent).toContain("Recorded");
    expect(buttons[3].textContent).toContain("No record");
    // The rail shows no live step, so the surface says where the event actually is
    expect(screen.getByText("This event has moved past the phases shown here. Its current stage is Evaluation."))
      .toBeTruthy();
  });

  it("never prints a raw stage key to an operator", () => {
    render(<SourceNewWorkspace event={{ ...request, currentStage: "rfp_rfi_package", lifecycle: "paused" }} files={[]} />);
    expect(screen.getByText("Current stage: Market package")).toBeTruthy();
    expect(screen.queryByText(/rfp_rfi_package|rfp rfi package/i)).toBeNull();
  });

  describe("file download version pinning", () => {
    const baseFile: SourceNewFileRow = {
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
      expect(sourceNewFileDownloadHref(olderFile)).toBe(`/api/v1/source/artifacts/${encodeURIComponent(olderFile.id)}/download?includeHistory=1`);
    });

    it("lets current rows use normal authority resolution without includeHistory", () => {
      expect(sourceNewFileDownloadHref(baseFile)).toBe(`/api/v1/source/artifacts/${encodeURIComponent(baseFile.id)}/download`);
    });
  });

  it("shows distinct unambiguous work content when navigating earlier and later phases", () => {
    render(<SourceNewWorkspace event={{ ...request, currentStage: "strategy", lifecycle: "active" }} files={[]} />);
    const getPhaseButtons = () =>
      within(screen.getByRole("navigation", { name: "Event phases" })).getAllByRole("button");

    // Navigate to a phase the event has moved past (Request is before the current Define)
    fireEvent.click(getPhaseButtons()[0]);
    expect(screen.getByText("Recorded earlier in this event")).toBeTruthy();
    expect(screen.queryByText("This phase is not yet open")).toBeNull();
    // Sidebar offers one return action — no second primary link
    expect(screen.getByRole("button", { name: "Current work" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Open scope and strategy" })).toBeNull();

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
    expect(within(trail).getByText(/Scope and baseline confirmed/)).toBeTruthy();
  });

  it("says no decisions are recorded when the trail is genuinely empty", () => {
    render(<SourceNewWorkspace event={request} files={[]} activity={{ ok: true, entries: [] }} />);
    openApprovals();

    expect(screen.getByText(/No decisions have been recorded/i)).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Decision trail" })).toBeNull();
  });

  it("does not report an unreadable trail as an absence of decisions", () => {
    render(
      <SourceNewWorkspace event={request} files={[]} activity={{ ok: false, reason: "connection refused" }} />,
    );
    openApprovals();

    // The distinction this whole change exists for.
    expect(screen.getByText(/could not be read/i)).toBeTruthy();
    expect(screen.queryByText(/No decisions have been recorded/i)).toBeNull();
    // And it must not leak the underlying error to a client surface.
    expect(document.body.textContent ?? "").not.toContain("connection refused");
  });

  it("says the trail was not loaded when a caller passes none", () => {
    render(<SourceNewWorkspace event={request} files={[]} />);
    openApprovals();

    expect(screen.getByText(/was not loaded/i)).toBeTruthy();
    expect(screen.queryByText(/No decisions have been recorded/i)).toBeNull();
  });
});
