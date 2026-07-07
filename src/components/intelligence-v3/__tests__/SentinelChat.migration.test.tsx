/**
 * @jest-environment jsdom
 */

// SentinelChat · localStorage migration coverage.
//
// The dock-mode preference moved from a single legacy key
// (`abarva.intelligence.chat-mode`) with values
// `side-rail | dock-expanded | dock-collapsed` onto AgentDock's per-
// surface keys (`abarva.agent-dock.intelligence.mode`) with values
// `side-rail | pin-bottom | pin-top | expand | collapsed`.
//
// The migration runs once on first mount per browser, gated by a
// flag key that prevents repeated overwrites if the user later
// toggles modes. These tests pin that contract so the next migration
// chip doesn't accidentally re-introduce the legacy key.

import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { TextDecoder } from "util";
import { SentinelChat } from "../SentinelChat";

const LEGACY = "abarva.intelligence.chat-mode";
const NEW = "abarva.agent-dock.intelligence.mode";
const FLAG = "abarva.intelligence.chat-mode.migrated";

function makeMockBody(text: string) {
  const bytes = new Uint8Array(Array.from(text).map((c) => c.charCodeAt(0)));
  let yielded = false;
  return {
    getReader() {
      return {
        async read() {
          if (yielded)
            return { done: true, value: undefined as Uint8Array | undefined };
          yielded = true;
          return { done: false, value: bytes };
        },
      };
    },
  };
}

function renderHarness() {
  return render(
    <SentinelChat
      scopeLabel="Test · this page"
      opener="opener"
      conversation={[]}
      workspace={<div data-testid="workspace">workspace</div>}
    />,
  );
}

describe("SentinelChat · legacy mode-key migration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    (global as { fetch: unknown }).fetch = undefined;
    globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
  });

  it("migrates side-rail → side-rail", () => {
    window.localStorage.setItem(LEGACY, "side-rail");
    renderHarness();
    expect(window.localStorage.getItem(NEW)).toBe("side-rail");
    expect(window.localStorage.getItem(FLAG)).toBe("1");
  });

  it("migrates dock-expanded → pin-bottom", () => {
    window.localStorage.setItem(LEGACY, "dock-expanded");
    renderHarness();
    expect(window.localStorage.getItem(NEW)).toBe("pin-bottom");
    expect(window.localStorage.getItem(FLAG)).toBe("1");
  });

  it("migrates dock-collapsed → collapsed", () => {
    window.localStorage.setItem(LEGACY, "dock-collapsed");
    renderHarness();
    expect(window.localStorage.getItem(NEW)).toBe("collapsed");
    expect(window.localStorage.getItem(FLAG)).toBe("1");
  });

  it("does NOT overwrite an existing new-key preference", () => {
    window.localStorage.setItem(LEGACY, "dock-expanded");
    window.localStorage.setItem(NEW, "expand"); // user already chose
    renderHarness();
    expect(window.localStorage.getItem(NEW)).toBe("expand");
    expect(window.localStorage.getItem(FLAG)).toBe("1");
  });

  it("skips migration when the flag is already set", () => {
    window.localStorage.setItem(FLAG, "1");
    window.localStorage.setItem(LEGACY, "dock-collapsed");
    renderHarness();
    // No new key was written because we already migrated.
    expect(window.localStorage.getItem(NEW)).toBeNull();
  });

  it("handles a missing legacy key without crashing", () => {
    renderHarness();
    expect(window.localStorage.getItem(NEW)).toBeNull();
    expect(window.localStorage.getItem(FLAG)).toBe("1");
  });

  it("renders the opener as the first agent turn", () => {
    const { getByText } = render(
      <SentinelChat
        scopeLabel="Meridian · The Brief"
        opener="I composed this brief for Meridian Health from the corpus."
        conversation={[]}
        workspace={<div>workspace</div>}
      />,
    );
    expect(
      getByText(/I composed this brief for Meridian Health/),
    ).toBeInTheDocument();
  });

  it("renders text-based NDJSON delta chunks from the Intelligence ask endpoint", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeMockBody(
        [
          JSON.stringify({
            type: "classified",
            classification: { intent: "general_synthesis", entities: [] },
          }),
          JSON.stringify({ type: "sources", sources: [] }),
          JSON.stringify({
            type: "delta",
            text: "Apex has current Intelligence evidence.",
          }),
          JSON.stringify({ type: "done" }),
          "",
        ].join("\n"),
      ),
    });
    (global as { fetch: unknown }).fetch = fetchMock;

    render(
      <SentinelChat
        scopeLabel="Apex Retail Group · this page"
        opener="Apex Retail Intelligence is live."
        conversation={[]}
        surfaceContext={{ clientKey: "apex-retail" }}
        workspace={<div>workspace</div>}
      />,
    );

    await act(async () => {
      fireEvent.change(screen.getByTestId("agent-dock-input"), {
        target: { value: "current state of data analytics landscape" },
      });
    });

    await act(async () => {
      fireEvent.submit(screen.getByTestId("agent-dock-form"));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      expect(
        screen.getByText("Apex has current Intelligence evidence."),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText(
        /I did not find enough indexed Intelligence evidence/i,
      ),
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/intelligence/ask",
      expect.objectContaining({
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
        },
        body: expect.any(String),
      }),
    );
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      q: "current state of data analytics landscape",
      client: "apex-retail",
      surfaceContext: { clientKey: "apex-retail" },
    });
  });

  it("renders structured Ava answer exhibits streamed by the Intelligence ask endpoint", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeMockBody(
        [
          JSON.stringify({ type: "delta", text: "Epic maintenance is $1.2M." }),
          JSON.stringify({
            type: "agent-answer",
            answer: {
              surface: "intelligence",
              mode: "ANALYZE",
              tenantKey: "meridian",
              question: "show maintenance",
              intent: "table",
              status: "answered",
              directAnswer: "",
              factsUsed: [],
              metricsUsed: [],
              relationshipsUsed: [],
              expertsUsed: [
                {
                  id: "xp.healthcare.revenue-cycle",
                  name: "Healthcare Revenue Cycle Expert",
                },
              ],
              artifacts: [
                {
                  artifact: "table",
                  id: "answer-figures",
                  title: "Figures Mentioned",
                  columns: [
                    { key: "metric", label: "Metric" },
                    { key: "value", label: "Value" },
                  ],
                  rows: [{ metric: "Epic maintenance", value: "$1.2M" }],
                  citationIds: ["c1"],
                },
              ],
              citations: [
                {
                  id: "c1",
                  label: "F12 IT budget",
                  sourceClass: "tenant-fact",
                },
              ],
              gaps: [],
              caveats: [],
              nextSteps: [],
              quality: {
                confidence: "medium",
                evidenceStrength: "partial",
                tenantGrounding: "partial",
                answerCompleteness: "complete",
              },
              safety: {
                tenantFencePassed: true,
                rawIdsSuppressed: true,
                forbiddenLanguagePassed: true,
                unsupportedClaimsBlocked: true,
              },
            },
          }),
          JSON.stringify({ type: "done" }),
          "",
        ].join("\n"),
      ),
    });
    (global as { fetch: unknown }).fetch = fetchMock;

    render(
      <SentinelChat
        scopeLabel="Meridian · this page"
        opener="Meridian Intelligence is live."
        conversation={[]}
        surfaceContext={{ clientKey: "meridian" }}
        workspace={<div>workspace</div>}
      />,
    );

    await act(async () => {
      fireEvent.change(screen.getByTestId("agent-dock-input"), {
        target: { value: "Show me a table of Epic spend" },
      });
    });
    await act(async () => {
      fireEvent.submit(screen.getByTestId("agent-dock-form"));
    });

    await waitFor(() =>
      expect(screen.getByText("Figures Mentioned")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("Healthcare Revenue Cycle Expert"),
    ).toBeInTheDocument();
    expect(screen.getByText("F12 IT budget")).toBeInTheDocument();
  });

  it("renders thumbs feedback after a completed Sentinel answer and posts the selected rating", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: makeMockBody(
          [
            JSON.stringify({
              type: "delta",
              text: "Sentinel answer with evidence.",
            }),
            JSON.stringify({
              type: "done",
              telemetryEventId: "tlm_sentinel_1",
            }),
            "",
          ].join("\n"),
        ),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    (global as { fetch: unknown }).fetch = fetchMock;

    render(
      <SentinelChat
        scopeLabel="Apex Retail Group · this page"
        opener="Apex Retail Intelligence is live."
        conversation={[]}
        surfaceContext={{ clientKey: "apex-retail" }}
        workspace={<div>workspace</div>}
      />,
    );

    await act(async () => {
      fireEvent.change(screen.getByTestId("agent-dock-input"), {
        target: { value: "What should we sequence?" },
      });
    });
    await act(async () => {
      fireEvent.submit(screen.getByTestId("agent-dock-form"));
    });

    const usefulButton = await screen.findByLabelText(
      "Mark sentinel synthesis as useful",
    );
    await act(async () => {
      fireEvent.click(usefulButton);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/reasoning/feedback",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ eventId: "tlm_sentinel_1", feedback: "up" }),
      }),
    );
  });
});
