/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { SourceNewWorkspace, type SourceNewEventView } from "./SourceNewWorkspace";

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
    expect(screen.getByText("Current stage: evaluation")).toBeTruthy();
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
    expect(screen.getByText("Waiting on vendor")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open event" }).getAttribute("href"))
      .toBe("/source/events/event-1");
  });

  it("keeps evidence separate from category classification", () => {
    render(<SourceNewWorkspace event={{ ...request, category: "application_managed_services" }} files={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Intelligence" }));
    expect(screen.getByText("application managed services")).toBeTruthy();
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

  it("shows define as current and request as earlier without a completion label for active strategy", () => {
    render(<SourceNewWorkspace event={{ ...request, currentStage: "strategy", lifecycle: "active" }} files={[]} />);
    const phases = screen.getByRole("navigation", { name: "Event phases" });
    const buttons = within(phases).getAllByRole("button");
    // Request is an earlier phase — must say Earlier, never Completed or Approved
    expect(buttons[0].textContent).toContain("Earlier");
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

  it("shows rfi as current and all earlier phases without a completion label for active market package", () => {
    render(<SourceNewWorkspace event={{ ...request, currentStage: "rfp", lifecycle: "active" }} files={[]} />);
    const phases = screen.getByRole("navigation", { name: "Event phases" });
    const buttons = within(phases).getAllByRole("button");
    // All three earlier phases say Earlier, never Completed or Approved
    [buttons[0], buttons[1], buttons[2]].forEach((btn) => {
      expect(btn.textContent).toContain("Earlier");
      expect(btn.textContent).not.toMatch(/Completed|Approved/);
    });
    // Market package is the current phase
    expect(buttons[3].textContent).toContain("Current");
    // Single unambiguous next action
    expect(screen.getByRole("link", { name: "Open market package" }).getAttribute("href"))
      .toBe("/source/events/event-1");
    expect(screen.getByText("Review the package and its release requirements in the governed event.")).toBeTruthy();
  });

  it("shows distinct unambiguous work content when navigating earlier and later phases", () => {
    render(<SourceNewWorkspace event={{ ...request, currentStage: "strategy", lifecycle: "active" }} files={[]} />);
    const getPhaseButtons = () =>
      within(screen.getByRole("navigation", { name: "Event phases" })).getAllByRole("button");

    // Navigate to an earlier phase (Request is before the current Define)
    fireEvent.click(getPhaseButtons()[0]);
    expect(screen.getByText("Earlier in this event")).toBeTruthy();
    expect(screen.queryByText("This phase is not yet open")).toBeNull();
    // Sidebar offers one return action — no second primary link
    expect(screen.getByRole("button", { name: "Current work" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Open scope and strategy" })).toBeNull();

    // Navigate to a later phase (Suppliers & NDA is after Define)
    fireEvent.click(getPhaseButtons()[2]);
    expect(screen.getByText("This phase is not yet open")).toBeTruthy();
    expect(screen.queryByText("Earlier in this event")).toBeNull();
    // Sidebar still offers one return action
    expect(screen.getByRole("button", { name: "Current work" })).toBeTruthy();
  });
});
