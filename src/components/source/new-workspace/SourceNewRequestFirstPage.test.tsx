/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";
import { SourceNewRequestFirstPage } from "./SourceNewRequestFirstPage";

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({
    children,
    subNav,
  }: {
    children: React.ReactNode;
    subNav?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="subnav">{subNav}</div>
      {children}
    </div>
  ),
}));

jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => <nav aria-label="Source navigation" />,
}));

jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: ({ workspace }: { workspace: React.ReactNode }) => (
    <div>{workspace}</div>
  ),
}));

const eventWorkspaces = [
  {
    id: "event-1",
    code: "SRC-001",
    name: "Application services event",
    currentStageLabel: "Strategy",
    lifecycleLabel: "Waiting on Client",
    href: "/source/new/event-1",
  },
];

describe("SourceNewRequestFirstPage", () => {
  it("opens on a request queue instead of the legacy create form", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="empty"
        eventWorkspaces={[]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Source requests" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "No pending requests are loaded from an authoritative request ledger.",
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Open governed intake" })
        .getAttribute("href"),
    ).toBe("/source/new?mode=intake");
    expect(screen.queryByTestId("source-originate-canvas")).toBeNull();
  });

  it("has a distinct loading state for the request queue", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="loading"
        eventWorkspaces={[]}
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "Loading request queue",
    );
    expect(screen.getByText("Event workspaces")).toBeTruthy();
  });

  it("has an authorization state without exposing event links", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="unauthorized"
        eventWorkspaces={eventWorkspaces}
      />,
    );

    expect(
      screen.getByText(
        "Source request intake requires a signed-in tenant session.",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Application services event" }),
    ).toBeNull();
  });

  it("keeps requests separate from active event workspaces", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="empty"
        eventWorkspaces={eventWorkspaces}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    expect(within(queue).queryByText("Application services event")).toBeNull();
    expect(
      within(queue).getByText(
        "A request does not appear in event workspaces until it is accepted into the governed Source event flow.",
      ),
    ).toBeTruthy();

    const workspaces = screen.getByRole("region", {
      name: "Event workspaces",
    });
    expect(
      within(workspaces)
        .getByRole("link", { name: "Application services event" })
        .getAttribute("href"),
    ).toBe("/source/new/event-1");
  });
});
