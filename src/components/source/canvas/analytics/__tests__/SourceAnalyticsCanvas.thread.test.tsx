/**
 * @jest-environment jsdom
 */

// The Source event analytics canvas mounted `AskAnythingBar` (#4588) so a
// question could reach `/api/chat/agent`, but nothing rendered the reply —
// `AskAnythingBar` is a composer only, and the canvas had no conversation
// THREAD component mounted anywhere. `AgentColumn` (mounted here via
// `SentinelAgentColumn`, matching the established Source pattern already
// used by `SourceIndexPage`/scorecard/value/artifacts pages) reads the SAME
// shared `AtlasPageState` that `AskAnythingBar`'s composer writes into via
// `pageState.ask(...)`, so it renders the live thread for both composers.
//
// This test exercises the REAL (unmocked) `AskAnythingBar` and
// `SentinelAgentColumn` — not stubs — with a mocked `fetch` standing in for
// `/api/chat/agent`, matching the streaming-body mock pattern already used by
// `StewardChat.attachments.test.tsx` (`res.body.getReader()` returning
// buffered chunks). It types a question into the composer, submits it, and
// asserts BOTH the user's own sent question and the mocked assistant
// response appear in the rendered thread — not just that the POST fired.

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TextDecoder } from "node:util";

global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

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

  it("renders both the sent question and the mocked assistant response in the thread (not just a fired POST)", async () => {
    const streamedChunk = Buffer.from(
      "Volumetrics and the sponsor letter are still outstanding for Scope.",
    );
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({ done: false, value: streamedChunk })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    } as unknown as Response);
    global.fetch = fetchMock;

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="scope"
        tenantName="Lakeshore"
      />,
    );

    // Type + submit through the REAL AskAnythingBar composer.
    const composer = screen.getByLabelText("Ask Ava") as HTMLTextAreaElement;
    fireEvent.change(composer, {
      target: { value: "What is still outstanding on Scope?" },
    });
    fireEvent.keyDown(composer, { key: "Enter" });

    // The POST actually fired, scoped to this canvas's surface + event.
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body));
    expect(body.surface).toBe("source-detail");
    expect(body.surfaceContext.sourceEventId).toBe("evt-1");
    expect(body.message).toBe("What is still outstanding on Scope?");

    // The user's own question is echoed in the live thread (SentinelAgentColumn).
    await waitFor(() => {
      expect(
        screen.getByText("What is still outstanding on Scope?"),
      ).toBeInTheDocument();
    });

    // The mocked assistant response also renders in the thread.
    await waitFor(() => {
      expect(
        screen.getByText(
          "Volumetrics and the sponsor letter are still outstanding for Scope.",
        ),
      ).toBeInTheDocument();
    });
  });
});
