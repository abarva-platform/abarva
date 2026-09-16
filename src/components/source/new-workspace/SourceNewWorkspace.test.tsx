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
    expect(screen.getByRole("link", { name: "Continue current stage" }).getAttribute("href"))
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
});
