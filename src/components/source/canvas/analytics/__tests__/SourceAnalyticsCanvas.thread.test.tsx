/**
 * @jest-environment jsdom
 */

// The Source event analytics canvas invokes `AskAnythingBar` from a hidden
// launcher. The live shell uses the shared `AtlasPageState` bottom-panel path,
// so Source-specific responses must route through the governed Source ask
// endpoint and preserve the structured answer parts it already returns.
//
// This test exercises the REAL (unmocked) launcher and `AskAnythingBar` with a
// mocked `fetch` standing in for the governed Source ask endpoint. It types a
// question into the composer, submits it, and asserts the mocked structured
// assistant response renders in the invoked aVa panel — not just that the POST
// fired.

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
}));

// AppShell -> AppTopBar uses Clerk's useUser — mock so this renders under
// jsdom without a real ClerkProvider, matching
// SourceAnalyticsCanvas.chat.test.tsx's pattern for the same shell tree.
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import type { SourcingEventSummary } from "@/lib/source/types";

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

describe("SourceAnalyticsCanvas — live conversation thread", () => {
  afterEach(() => {
    delete (global as Partial<typeof globalThis>).fetch;
    jest.restoreAllMocks();
  });

  it("routes Source asks through the governed Source endpoint and renders structured parts", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        summary:
          "RAW_CHART_PAYLOAD {\"type\":\"bar\",\"data\":[{\"domain\":\"Scope\"}]}",
        agentResponseParts: [
          {
            type: "text",
            title: "Advisor answer",
            text: "Volumetrics and the sponsor letter are still outstanding for Scope.",
          },
          {
            type: "table",
            title: "Open scope evidence",
            columns: ["Evidence", "Status"],
            rows: [["Volumetrics", "Missing"]],
          },
          {
            type: "barChart",
            title: "Readiness by evidence area",
            bars: [
              { label: "Requirements", value: 70 },
              { label: "Volumetrics", value: 20 },
            ],
          },
        ],
      }),
    } as unknown as Response);
    global.fetch = fetchMock;

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    fireEvent.click(screen.getByTestId("source-ask-ava-launcher"));

    // Type + submit through the REAL AskAnythingBar composer.
    const composer = screen.getByLabelText("Ask Ava") as HTMLTextAreaElement;
    fireEvent.change(composer, {
      target: { value: "What is still outstanding on Scope?" },
    });
    fireEvent.keyDown(composer, { key: "Enter" });

    // The POST actually fired, scoped to this canvas's Source event + stage.
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [url, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/source/evt-1/nexus/ask");
    const body = JSON.parse(String(requestInit.body));
    expect(body.prompt).toBe("What is still outstanding on Scope?");
    expect(body.mode).toBe("event");
    expect(body.stageKey).toBe("scope");

    // The mocked assistant response renders in the invoked aVa panel.
    await waitFor(() => {
      expect(
        screen.getByText(
          "Volumetrics and the sponsor letter are still outstanding for Scope.",
        ),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/RAW_CHART_PAYLOAD/)).not.toBeInTheDocument();
    expect(screen.getByTestId("agent-response-table")).toBeInTheDocument();
    expect(screen.getByTestId("agent-response-bar-chart")).toBeInTheDocument();
    expect(screen.getByText("Open scope evidence")).toBeInTheDocument();
    expect(screen.getByText("Readiness by evidence area")).toBeInTheDocument();
  });
});
