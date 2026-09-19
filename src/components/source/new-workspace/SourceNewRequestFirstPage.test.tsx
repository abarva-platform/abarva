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

const activeEventWorkspaces = [
  {
    id: "event-1",
    code: "SRC-001",
    name: "Application services event",
    lifecycle: "active",
    currentStageLabel: "Strategy",
    lifecycleLabel: "Active event",
    trigger: "Review the application support model before renewal.",
    scope:
      "Scope boundary: Application support\nValue target: Validate service value\nBaseline owner: Technology finance",
    decisionOwner: "Technology sponsor",
    href: "/source/new/event-1",
  },
];

const pendingRequest = {
  id: "request-1",
  code: "SRC-002",
  name: "Infrastructure services request",
  lifecycle: "waiting_on_client",
  currentStageLabel: "Strategy",
  lifecycleLabel: "Waiting on Client",
  trigger: "Confirm the sourcing path before the service decision.",
  scope:
    "Scope boundary: Infrastructure operations\nValue target: Establish the decision baseline\nBaseline owner: Technology finance",
  decisionOwner: "Technology sponsor",
  href: "/source/new/request-1",
};

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
        "No requests are waiting for intake review.",
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Start a request" })
        .getAttribute("href"),
    ).toBe("/source/new?mode=intake");
    expect(screen.getByText("One next action").nextSibling?.textContent).toBe(
      "Start a request",
    );
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
        eventWorkspaces={activeEventWorkspaces}
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

  it("does not expose cached rows when the request read is unavailable", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="unavailable"
        eventWorkspaces={[pendingRequest, ...activeEventWorkspaces]}
      />,
    );

    expect(
      screen.getByText("The request queue could not be read. This is not an empty queue."),
    ).toBeTruthy();
    expect(screen.queryByText("Infrastructure services request")).toBeNull();
    expect(screen.queryByText("Application services event")).toBeNull();
  });

  it("keeps requests separate from active event workspaces", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="empty"
        eventWorkspaces={activeEventWorkspaces}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    expect(within(queue).queryByText("Application services event")).toBeNull();
    expect(
      within(queue).getByText(
        "New requests stay here until their intake review is complete.",
      ),
    ).toBeTruthy();

    const workspaces = screen.getByRole("region", {
      name: "Event workspaces",
    });
    expect(within(workspaces).getByText("Application services event")).toBeTruthy();
    expect(screen.getByText("Open accepted work")).toBeTruthy();
    expect(
      within(workspaces).getByRole("link", { name: "Open" }).getAttribute("href"),
    ).toBe("/source/new/event-1");
  });

  it("triages governed request fields and answers the four readiness questions", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="loaded"
        eventWorkspaces={[pendingRequest]}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    expect(
      within(queue).getByText(
        "Confirm the sourcing path before the service decision.",
      ),
    ).toBeTruthy();
    expect(within(queue).getByText("What was requested")).toBeTruthy();
    expect(within(queue).getByText("What is missing")).toBeTruthy();
    expect(within(queue).getByText("Who acts next")).toBeTruthy();
    expect(within(queue).getByText("Ready for Define review")).toBeTruthy();
    expect(screen.getByText("Review pending requests")).toBeTruthy();
    expect(within(queue).getByText("Nothing required is missing")).toBeTruthy();
    expect(within(queue).getByText("Technology sponsor")).toBeTruthy();
    expect(
      within(queue)
        .getByRole("link", { name: "Review for Define" })
        .getAttribute("href"),
    ).toBe("/source/new/request-1");
    expect(
      screen.queryByRole("link", { name: "Infrastructure services request" }),
    ).toBeNull();
  });

  it("fails closed when a request is missing governed triage facts", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="loaded"
        eventWorkspaces={[
          {
            ...pendingRequest,
            scope: "Scope boundary: Infrastructure operations",
            decisionOwner: null,
          },
        ]}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    expect(within(queue).getByText("Value target")).toBeTruthy();
    expect(within(queue).getByText("Baseline owner")).toBeTruthy();
    expect(within(queue).getByText("Decision owner")).toBeTruthy();
    expect(within(queue).getByText("Not ready for Define review")).toBeTruthy();
    expect(within(queue).getByText("Decision owner not recorded")).toBeTruthy();
    expect(
      within(queue).getByRole("link", { name: "Complete request" }),
    ).toBeTruthy();
  });
});
