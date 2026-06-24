/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { TextDecoder, TextEncoder } from "util";

import { modeStorageKey } from "@/components/agent/AgentDock";
import { SentinelReasoningCards } from "../SentinelReasoningCards";

function makeNdjsonBody(events: unknown[]) {
  const payload = `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
  const bytes = new TextEncoder().encode(payload);
  let yielded = false;
  return {
    getReader() {
      return {
        async read() {
          if (yielded) {
            return { done: true, value: undefined as Uint8Array | undefined };
          }
          yielded = true;
          return { done: false, value: bytes };
        },
      };
    },
  };
}

function mockAskResponse(answer: string): jest.Mock {
  const mock = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    body: makeNdjsonBody([
      { type: "delta", text: answer },
      { type: "done", telemetryEventId: `tlm-${answer.slice(0, 4)}` },
    ]),
  });
  (global as { fetch: unknown }).fetch = mock;
  return mock;
}

function renderSurface() {
  return render(
    <SentinelReasoningCards
      initialClient="skyharbor"
      initialClientDisplayName="SkyHarbor Air"
    />,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  (global as { fetch: unknown }).fetch = undefined;
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
});

describe("SentinelReasoningCards · Ava Intelligence chat shell", () => {
  it("renders Intelligence through the shared AgentDock shell", () => {
    renderSurface();

    expect(screen.getByTestId("agent-dock-panel")).toHaveAttribute(
      "data-mode",
      "side-rail",
    );
    expect(screen.getByTestId("agent-dock-side-rail-shell")).toHaveAttribute(
      "data-side",
      "left",
    );
    expect(screen.getByText("Ava")).toBeInTheDocument();
    expect(screen.getAllByTestId("ava-ask-v-mark").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Explore the answer, evidence, experts, and corpus."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("intelligence-workspace-tab-answer")).toBeInTheDocument();
    expect(screen.getByTestId("intelligence-workspace-tab-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("intelligence-workspace-tab-experts")).toBeInTheDocument();
  });

  it("submits multiline prompts and preserves the question and answer in history", async () => {
    const fetchMock = mockAskResponse(
      "SkyHarbor should sequence IROPS data quality before agentic operations.",
    );
    renderSurface();

    const question = "Why is agentic IROPS not ready?\nShow the evidence.";
    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: { value: question },
    });

    await act(async () => {
      fireEvent.submit(screen.getByTestId("agent-dock-form"));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await screen.findByText(
      "SkyHarbor should sequence IROPS data quality before agentic operations.",
    );

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      client: "skyharbor",
      richText: true,
      surfaceContext: {
        clientKey: "skyharbor",
        activeClient: "SkyHarbor Air",
        activeTab: "intelligence-advisor-chat",
      },
    });
    expect(body.q).toContain("Why is agentic IROPS not ready?\nShow the evidence.");
    expect(screen.getByTestId("agent-dock-thread")).toHaveTextContent(
      "Why is agentic IROPS not ready? Show the evidence.",
    );
  });

  it("keeps prior questions visible while rendering answer detail on the canvas", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: makeNdjsonBody([
          { type: "delta", text: "First advisor answer." },
          { type: "done", telemetryEventId: "tlm-one" },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: makeNdjsonBody([
          { type: "delta", text: "Second advisor answer." },
          { type: "done", telemetryEventId: "tlm-two" },
        ]),
      });
    (global as { fetch: unknown }).fetch = fetchMock;
    renderSurface();

    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: { value: "Question one" },
    });
    await act(async () => {
      fireEvent.submit(screen.getByTestId("agent-dock-form"));
    });
    await screen.findByText("First advisor answer.");

    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: { value: "Question two" },
    });
    await act(async () => {
      fireEvent.submit(screen.getByTestId("agent-dock-form"));
    });
    await screen.findByText("Second advisor answer.");

    const thread = screen.getByTestId("agent-dock-thread");
    expect(thread).toHaveTextContent("Question one");
    expect(thread).toHaveTextContent("Question two");
    expect(thread).toHaveTextContent("Answer is ready on the canvas.");
    expect(thread).not.toHaveTextContent("First advisor answer.");
    expect(screen.getByTestId("intelligence-workspace-panel-answer")).toHaveTextContent(
      "Second advisor answer.",
    );
  });

  it("keeps AgentAnswer prose out of the chat rail and on the canvas", async () => {
    const fullProse =
      "Board-grade answer belongs on the Intelligence canvas, not inside the chat rail.";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeNdjsonBody([
        {
          type: "agent-answer",
          answer: {
            engineVersion: "agent-answer/v1",
            surface: "intelligence",
            expertId: "xp.airline.operations",
            contributingExperts: [
              {
                id: "xp.airline.operations",
                name: "Airline Ground & Airport Operations Expert",
              },
            ],
            prose: fullProse,
            tables: [],
            charts: [],
            graphs: [],
            citations: [],
            gaps: [],
            recommendedActions: [],
            groundingMode: "industry-pattern",
            confidence: "low",
            limits: [],
            crossTenantBlocked: false,
          },
        },
        { type: "done", telemetryEventId: "tlm-agent-answer" },
      ]),
    });
    (global as { fetch: unknown }).fetch = fetchMock;
    renderSurface();

    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: { value: "Question with structured answer" },
    });
    await act(async () => {
      fireEvent.submit(screen.getByTestId("agent-dock-form"));
    });

    await screen.findByText(fullProse);
    const thread = screen.getByTestId("agent-dock-thread");
    expect(thread).toHaveTextContent("Question with structured answer");
    expect(thread).toHaveTextContent("Answer is ready on the canvas.");
    expect(thread).not.toHaveTextContent(fullProse);
    expect(screen.getByTestId("intelligence-workspace-panel-answer")).toHaveTextContent(
      fullProse,
    );
  });

  it("supports right, top, expanded, and hidden dock modes from the shared controls", () => {
    renderSurface();

    fireEvent.click(screen.getByTestId("agent-dock-mode-side-rail-right"));
    expect(screen.getByTestId("agent-dock-side-rail-shell")).toHaveAttribute(
      "data-side",
      "right",
    );
    expect(window.localStorage.getItem(modeStorageKey("intelligence"))).toBe(
      "side-rail-right",
    );

    fireEvent.click(screen.getByTestId("agent-dock-mode-pin-top"));
    expect(screen.getByTestId("agent-dock-pin-top")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("agent-dock-mode-expand"));
    expect(screen.getByTestId("agent-dock-expand-overlay")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("agent-dock-mode-collapsed"));
    expect(screen.getByTestId("agent-dock-collapsed-chip")).toBeInTheDocument();
  });
});
