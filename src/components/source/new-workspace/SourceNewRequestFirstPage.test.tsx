/** @jest-environment jsdom */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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
  AgentDock: ({
    workspace,
    defaultMode,
    collapsedRestoreMode,
  }: {
    workspace: React.ReactNode;
    defaultMode?: string;
    collapsedRestoreMode?: string;
  }) => (
    <div
      data-testid="source-request-dock"
      data-default-mode={defaultMode}
      data-restore-mode={collapsedRestoreMode}
    >
      {workspace}
    </div>
  ),
}));

const activeEventWorkspaces = [
  {
    id: "event-1",
    code: "SRC-001",
    name: "Application services event",
    lifecycle: "active",
    currentStageKey: "strategy",
    currentStageLabel: "Strategy",
    lifecycleLabel: "Active event",
    trigger: "Review the application support model before renewal.",
    scope:
      "Scope boundary: Application support\nValue target: Validate service value\nBaseline owner: Technology finance",
    decisionOwner: "Technology sponsor",
    href: "/source/new/event-1",
  },
];

const pendingEventWorkspace = {
  ...activeEventWorkspaces[0],
  id: "event-pending",
  code: "SRC-PENDING",
  name: "Infrastructure request awaiting approval",
  lifecycle: "waiting_on_client",
  lifecycleLabel: "Waiting on Client",
  href: "/source/new/event-pending",
};

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
  it("gives the workspace the full mobile width and restores aVa below it", async () => {
    const originalMatchMedia = window.matchMedia;
    let compact = true;
    let onChange: ((event: MediaQueryListEvent) => void) | undefined;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: compact,
        media: query,
        addEventListener: (
          _event: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          onChange = listener;
        },
        removeEventListener: jest.fn(),
      })),
    });
    try {
      render(
        <SourceNewRequestFirstPage
          clientName="Example client"
          clientKey="example-client"
          requestQueueStatus="empty"
          importedRequests={[]}
          eventWorkspaces={[pendingEventWorkspace]}
        />,
      );

      await waitFor(() =>
        expect(
          screen
            .getByTestId("source-request-dock")
            .getAttribute("data-default-mode"),
        ).toBe("collapsed"),
      );
      expect(
        screen
          .getByTestId("source-request-dock")
          .getAttribute("data-restore-mode"),
      ).toBe("pin-bottom");
      expect(
        screen
          .getByRole("region", { name: "Request queue" })
          .querySelector("li")
          ?.getAttribute("style"),
      ).toContain("repeat(auto-fit, minmax(min(100%, 260px), 1fr))");

      compact = false;
      act(() => onChange?.({ matches: compact } as MediaQueryListEvent));
      await waitFor(() =>
        expect(
          screen
            .getByTestId("source-request-dock")
            .getAttribute("data-default-mode"),
        ).toBe("side-rail"),
      );
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });

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
    expect(screen.queryByText("One next action")).toBeNull();
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
        eventWorkspaces={[pendingEventWorkspace, ...activeEventWorkspaces]}
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
    expect(
      screen.queryByText("Infrastructure request awaiting approval"),
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
    expect(within(workspaces).getByText("Other events")).toBeTruthy();
    expect(screen.queryByText("Open accepted work")).toBeNull();
    expect(
      within(workspaces)
        .getByRole("link", { name: "Open" })
        .getAttribute("href"),
    ).toBe("/source/new/event-1");
  });

  it("keeps an unapproved event in intake instead of calling it accepted work", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="empty"
        importedRequests={[]}
        eventWorkspaces={[pendingEventWorkspace, ...activeEventWorkspaces]}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    const workspaces = screen.getByRole("region", {
      name: "Event workspaces",
    });
    expect(
      within(queue).getByText("Infrastructure request awaiting approval"),
    ).toBeTruthy();
    expect(within(queue).getByText("Awaiting decision")).toBeTruthy();
    expect(
      within(queue)
        .getByRole("link", { name: "Review approval" })
        .getAttribute("href"),
    ).toBe("/source/events/event-pending/approval");
    expect(
      within(workspaces).queryByText(
        "Infrastructure request awaiting approval",
      ),
    ).toBeNull();
    expect(
      within(workspaces).getByText("Application services event"),
    ).toBeTruthy();
    expect(screen.queryByText("Review pending approvals")).toBeNull();
    expect(
      screen.queryByText("No imported requests are waiting for intake review."),
    ).toBeNull();
    expect(
      within(queue).getByText("Decision owner: Technology sponsor"),
    ).toBeTruthy();
  });

  it("shows two pending decisions once each with their distinct owners", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="empty"
        importedRequests={[]}
        eventWorkspaces={[
          { ...pendingEventWorkspace, decisionOwner: "Anand" },
          {
            ...pendingEventWorkspace,
            id: "event-qa",
            code: "SRC-QA",
            name: "Internal sourcing test",
            decisionOwner: "Production QA",
          },
          ...activeEventWorkspaces,
        ]}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    expect(
      within(queue).getAllByRole("link", { name: "Review approval" }),
    ).toHaveLength(2);
    expect(within(queue).getByText("Decision owner: Anand")).toBeTruthy();
    expect(
      within(queue).getByText("Decision owner: Production QA"),
    ).toBeTruthy();
    expect(within(queue).getByText("2 to review")).toBeTruthy();
    expect(screen.queryByText("One next action")).toBeNull();
    expect(
      screen.queryByText("No imported requests are waiting for intake review."),
    ).toBeNull();
  });

  it("still exposes pending approval when the imported-request registry is unavailable", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="unavailable"
        importedRequests={[importedRequest]}
        eventWorkspaces={[pendingEventWorkspace]}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    expect(
      within(queue).getByText("Infrastructure request awaiting approval"),
    ).toBeTruthy();
    expect(within(queue).getByText(/could not be read/)).toBeTruthy();
    expect(
      within(queue).queryByText("Infrastructure services request"),
    ).toBeNull();
    expect(
      screen.getByRole("region", { name: "Event workspaces" }).textContent,
    ).not.toContain("Infrastructure request awaiting approval");
  });

  it("does not move later-stage client decisions back into intake", () => {
    render(
      <SourceNewRequestFirstPage
        clientName="Example client"
        clientKey="example-client"
        requestQueueStatus="empty"
        importedRequests={[]}
        eventWorkspaces={[
          {
            ...pendingEventWorkspace,
            currentStageKey: "scope",
            currentStageLabel: "Scope",
          },
        ]}
      />,
    );

    const queue = screen.getByRole("region", { name: "Request queue" });
    const workspaces = screen.getByRole("region", { name: "Event workspaces" });
    expect(
      within(queue).queryByText("Infrastructure request awaiting approval"),
    ).toBeNull();
    expect(
      within(workspaces).getByText("Infrastructure request awaiting approval"),
    ).toBeTruthy();
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
    expect(screen.queryByText("Review pending requests")).toBeNull();
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
