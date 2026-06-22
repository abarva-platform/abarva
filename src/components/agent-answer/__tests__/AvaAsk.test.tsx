/**
 * @jest-environment jsdom
 *
 * AvaAsk is the ONE canonical ask, reused across surfaces (starting with Home).
 * This proves it makes the same canonical call (POST /api/intelligence/ask with
 * format=rich + surfaceContext) and renders the streamed AgentAnswer through the
 * single AgentAnswerRenderer — table present, and exactly ONE "Ava ·" header
 * (i.e. it does NOT double-render the header like the v2 ansbox does today).
 */

import React from "react";
import { ReadableStream } from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AvaAsk } from "@/components/agent-answer/AvaAsk";

jest.mock("@/lib/agent/markdownRenderer", () => ({
  AgentMarkdown: ({ text }: { text: string }) => <div className="md">{text}</div>,
}));

function streamFromLines(lines: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) controller.enqueue(enc.encode(line + "\n"));
      controller.close();
    },
  });
}

describe("AvaAsk — canonical ask reused across surfaces", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    Object.assign(globalThis, { TextDecoder, TextEncoder });
  });

  it("POSTs to the shared engine and renders the AgentAnswer table once (no double header)", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({ type: "delta", text: "Inventory truth gates the holiday investments." }),
        JSON.stringify({
          type: "agent-answer",
          answer: {
            engineVersion: "agent-answer/v1",
            surface: "intelligence",
            expertId: "xp.retail.operations",
            contributingExperts: [
              { id: "xp.retail.operations", name: "Retail Operations Expert" },
            ],
            prose: "",
            tables: [
              {
                id: "t1",
                title: "AI bets",
                columns: [
                  { key: "bet", label: "AI bet" },
                  { key: "ret", label: "Expected return", format: "currency" },
                ],
                rows: [{ bet: "Contact-Center AI", ret: 14_000_000 }],
                citationIds: ["c1"],
              },
            ],
            charts: [],
            graphs: [],
            citations: [{ id: "c1", label: "Enterprise context", sourceClass: "tenant-fact" }],
            gaps: [],
            recommendedActions: [],
            groundingMode: "mixed",
            confidence: "medium",
            limits: [],
            crossTenantBlocked: false,
          },
        }),
        JSON.stringify({ type: "done" }),
        "",
      ]),
    });
    global.fetch = fetchMock as typeof fetch;

    render(
      <AvaAsk client="apex-retail" surfaceContext={{ activeTab: "home", clientKey: "apex-retail" }} />,
    );

    const askBox = screen.getByLabelText("Ask Ava");
    expect(askBox.tagName).toBe("TEXTAREA");

    fireEvent.change(askBox, {
      target: { value: "which AI investments\nbefore holiday readiness?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(askBox).toHaveValue("");

    // Canonical call: POST to the shared engine, rich format, with surfaceContext.
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/intelligence/ask");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      q: "which AI investments\nbefore holiday readiness?",
      client: "apex-retail",
      format: "rich",
      surfaceContext: { activeTab: "home" },
    });

    // Canonical render: the table renders through the ONE renderer.
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
    expect(within(screen.getByRole("table")).getByText("AI bet")).toBeInTheDocument();
    expect(screen.getByText("$14,000,000")).toBeInTheDocument();

    // Exactly one "Ava ·" header — no double-render.
    expect(screen.getAllByText(/Ava ·/i)).toHaveLength(1);
  });
});
