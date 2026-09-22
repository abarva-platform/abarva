/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from "@testing-library/react";
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

const importedRequest = {
  requestId: "servicenow:sn_sourcing_request:request-1",
  requestNumber: "SRC0010042",
  sourceSystem: "ServiceNow" as const,
  sourceStatus: "New",
  sourceVersion: "v1",
  extractedAt: "2026-09-22T12:00:00Z",
  updatedAt: "2026-09-22T11:55:00Z",
  title: "Infrastructure services request",
  description: "Confirm the sourcing path before the service decision.",
  requestedFor: "Enterprise Technology",
  businessDomain: "it",
  businessFunction: "Infrastructure",
  value: { amount: 7850000, currency: "USD", validated: false as const },
  requiredFactGaps: [] as string[],
  mappingProposal: {
    categoryId: "managed_services_ams",
    archetypeId: "MANAGED_SERVICES_AMS",
    confidence: "high",
    reasons: ["Matched managed-services scope"],
  },
  mappingDecision: null,
  eventLink: null,
};

describe("SourceNewRequestFirstPage", () => {
  it("opens on a request queue instead of the legacy create form", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="empty"
        importedRequests={[]}
        eventWorkspaces={[]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Source requests" }),
    ).toBeTruthy();
    expect(
      screen.getByText("No requests are waiting for intake review."),
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
        importedRequests={[]}
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
        importedRequests={[importedRequest]}
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

  it("does not expose request rows when intake authority is unavailable but preserves governed event access", () => {
    const onRetryRequestQueue = jest.fn();
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="unavailable"
        importedRequests={[importedRequest]}
        eventWorkspaces={activeEventWorkspaces}
        onRetryRequestQueue={onRetryRequestQueue}
      />,
    );

    expect(
      screen.getByText(
        "The request queue could not be read. This is not an empty queue.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Infrastructure services request")).toBeNull();
    expect(screen.getByText("Application services event")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry request queue" }),
    );
    expect(onRetryRequestQueue).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(
        "The request queue could not be read. This is not an empty queue.",
      ),
    ).toBeTruthy();
  });

  it("keeps requests separate from active event workspaces", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="empty"
        importedRequests={[]}
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
    expect(
      within(workspaces).getByText("Application services event"),
    ).toBeTruthy();
    expect(screen.getByText("Open accepted work")).toBeTruthy();
    expect(
      within(workspaces)
        .getByRole("link", { name: "Open" })
        .getAttribute("href"),
    ).toBe("/source/new/event-1");
  });

  it("triages governed request fields and answers the four readiness questions", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="loaded"
        importedRequests={[importedRequest]}
        eventWorkspaces={[]}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    expect(
      within(queue).getByText(
        "Enterprise Technology · Infrastructure · Confirm the sourcing path before the service decision.",
      ),
    ).toBeTruthy();
    expect(within(queue).getByText("What was requested")).toBeTruthy();
    expect(within(queue).getByText("What is missing")).toBeTruthy();
    expect(within(queue).getByText("Proposed routing")).toBeTruthy();
    expect(within(queue).getByText("Supplier pool")).toBeTruthy();
    expect(within(queue).getByText("Review required")).toBeTruthy();
    expect(screen.getByText("Review pending requests")).toBeTruthy();
    expect(within(queue).getByText("Nothing required is missing")).toBeTruthy();
    expect(
      within(queue).getByText("AI proposal only · named review required"),
    ).toBeTruthy();
    expect(
      within(queue).getByText(
        "Held until a named reviewer accepts or overrides the mapping.",
      ),
    ).toBeTruthy();
    expect(
      within(queue)
        .getByRole("link", { name: "Review request" })
        .getAttribute("href"),
    ).toBe(
      "/source/new?mode=intake&requestId=servicenow%3Asn_sourcing_request%3Arequest-1",
    );
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
        importedRequests={[
          {
            ...importedRequest,
            requiredFactGaps: [
              "value_target",
              "baseline_owner",
              "decision_owner",
            ],
          },
        ]}
        eventWorkspaces={[]}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    expect(within(queue).getByText("Value Target")).toBeTruthy();
    expect(within(queue).getByText("Baseline Owner")).toBeTruthy();
    expect(within(queue).getByText("Decision Owner")).toBeTruthy();
    expect(within(queue).getByText("Review required")).toBeTruthy();
  });

  it("shows a reviewed request as ready without implying supplier contact authority", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="loaded"
        importedRequests={[
          {
            ...importedRequest,
            mappingDecision: {
              decisionId: "mapping-1",
              state: "accepted",
              categoryId: "managed_services_ams",
              archetypeId: "MANAGED_SERVICES_AMS",
              decidedByUserId: "person-1",
              decidedByName: "Procurement lead",
              decidedAt: "2026-09-22T12:10:00Z",
              rationale: "Scope confirmed.",
              sourceVersion: "v1",
            },
          },
        ]}
        eventWorkspaces={[]}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    expect(within(queue).getByText("Ready to create event")).toBeTruthy();
    expect(
      within(queue).getByText("Reviewed by Procurement lead"),
    ).toBeTruthy();
    expect(
      within(queue).getByText(/Contact authority remains separate/),
    ).toBeTruthy();
  });

  it("removes a linked request from the intake queue because its governed event is the active workspace", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="loaded"
        importedRequests={[
          {
            ...importedRequest,
            eventLink: {
              eventId: "event-1",
              linkedAt: "2026-09-22T12:20:00Z",
              sourceVersion: "v1",
            },
          },
        ]}
        eventWorkspaces={activeEventWorkspaces}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    expect(
      within(queue).queryByText("Infrastructure services request"),
    ).toBeNull();
    expect(
      within(queue).getByText("No requests are waiting for intake review."),
    ).toBeTruthy();
    expect(screen.getByText("Application services event")).toBeTruthy();
  });
});
