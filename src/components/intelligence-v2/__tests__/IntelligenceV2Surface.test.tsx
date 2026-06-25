/**
 * @jest-environment jsdom
 */

import React from "react";
import { ReadableStream } from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { IntelligenceV2Surface } from "@/components/intelligence-v2/IntelligenceV2Surface";
import { ALL_CLIENTS } from "@/lib/client-config";
import { getIntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";

jest.mock("@/lib/agent/markdownRenderer", () => ({
  AgentMarkdown: ({ text }: { text: string }) => <div>{text}</div>,
}));

function streamFromLines(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(lines.join("\n")));
      controller.close();
    },
  });
}

const apexPayload: IntelligenceBindingPayload = {
  tenant: {
    key: "apex-retail",
    displayName: "Apex Retail",
    industry: "Retail",
  },
  ask: {
    placeholder: "Ask about Apex",
    contract: "Answers are grounded in the loaded context.",
  },
  trustLine: {
    dimensionsLoaded: 8,
    evidencePoints: 17548,
    sources: 8,
    searchVerifiedPct: 97,
  },
  suggestedQuestions: ["Which AI investments should Apex scale?"],
  signals: [
    {
      id: "SIG-spend-01",
      domains: ["FINANCE & RUN COST", "AI INITIATIVES"],
      crossDomain: true,
      headline:
        "Retail lakehouse and customer inventory graph has $95M committed and $12.0M realized.",
      body: "Blocker: identity and item-location data quality.",
      confidence: "MEDIUM CONFIDENCE",
      evidencePoints: 22,
      sources: 2,
      evidenceRefs: ["APX-INIT-001", "APX-EVID-001"],
      move: {
        title: "Gate scale on measured value",
        owner: "Chief Data Officer",
        impact: "$83.0M",
      },
    },
  ],
  context: [
    {
      dimension: "Finance & run cost",
      status: "LOADED",
      description: "IT budget, run cost, AI spend by initiative",
      evidence: 2933,
      sources: 3,
      trust: 82,
    },
  ],
  corpus: [
    {
      patternName: "Omnichannel inventory truth before AI scale",
      domain: "retail_operations",
      whenToApply:
        "Use when BOPIS and personalization depend on inventory accuracy.",
    },
  ],
};

describe("IntelligenceV2Surface aVa chat shell", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    Object.assign(globalThis, {
      TextDecoder,
      TextEncoder,
    });
  });

  it("posts Apex v2 binding facts and renders streamed Ava answer tables", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({
          type: "delta",
          text: "Apex should gate lakehouse scale on measured value.",
        }),
        JSON.stringify({
          type: "agent-answer",
          answer: {
            surface: "intelligence",
            mode: "ANALYZE",
            tenantKey: "apex-retail",
            question: "what should we do about apex ai spend?",
            intent: "table",
            status: "answered",
            directAnswer:
              "Apex should gate lakehouse scale on measured value.",
            prose: "Apex should gate lakehouse scale on measured value.",
            factsUsed: [],
            metricsUsed: [],
            relationshipsUsed: [],
            expertsUsed: [
              { id: "xp.retail.operations", name: "Retail Operations Expert" },
            ],
            artifacts: [
              {
                artifact: "table",
                id: "apex-ai-spend",
                title: "Apex AI Spend Evidence",
                columns: [
                  { key: "initiative", label: "Initiative" },
                  { key: "committed", label: "Committed", format: "currency" },
                  { key: "realized", label: "Realized", format: "currency" },
                ],
                rows: [
                  {
                    initiative: "Retail lakehouse and customer inventory graph",
                    committed: 95000000,
                    realized: 12000000,
                  },
                ],
                citationIds: ["c1"],
              },
            ],
            citations: [
              {
                id: "c1",
                label: "APX-INIT-001",
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
      ]),
    });
    global.fetch = fetchMock as typeof fetch;

    render(
      <IntelligenceV2Surface
        payload={apexPayload}
        tenantName="Apex Retail Group"
      />,
    );

    expect(screen.getByTestId("agent-dock-panel")).toBeInTheDocument();
    expect(screen.getByText("Leadership intelligence canvas.")).toBeInTheDocument();
    expect(screen.queryByText("Ask anything about")).not.toBeInTheDocument();

    const askBox = screen.getByTestId("agent-dock-input");
    expect(askBox.tagName).toBe("TEXTAREA");
    expect(askBox).toHaveAttribute("placeholder", "Ask about Apex");

    fireEvent.change(askBox, {
      target: { value: "what should we do about\napex ai spend?" },
    });
    fireEvent.click(screen.getByTestId("agent-dock-send"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(askBox).toHaveValue("");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      q: "what should we do about\napex ai spend?",
      client: "apex-retail",
      format: "rich",
      surfaceContext: {
        activeTab: "intelligence-v2",
        activeClient: "Apex Retail Group",
        clientKey: "apex-retail",
      },
    });
    expect(body.surfaceContext.tenantFacts).toEqual(
      expect.arrayContaining([
        expect.stringContaining("17,548 evidence points"),
        expect.stringContaining("Finance & run cost"),
      ]),
    );
    expect(body.surfaceContext.strategyFacts).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "Retail lakehouse and customer inventory graph has $95M committed",
        ),
      ]),
    );

    expect(await screen.findAllByText(/what should we do about/i)).toHaveLength(
      1,
    );
    expect(
      await screen.findAllByText(
        "Apex should gate lakehouse scale on measured value.",
      ),
    ).not.toHaveLength(0);
    expect(screen.getByText("Retail Operations Expert")).toBeInTheDocument();
    expect(screen.getByText("Apex AI Spend Evidence")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(
      within(table).getByText("Retail lakehouse and customer inventory graph"),
    ).toBeInTheDocument();
    expect(within(table).getByText("$95,000,000")).toBeInTheDocument();
    expect(within(table).getByText("$12,000,000")).toBeInTheDocument();
    expect(screen.queryByText("APX-INIT-001")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("agent-dock-turn-agent")).toHaveLength(1);
    expect(screen.getAllByTestId("agent-dock-turn-user")).toHaveLength(1);
    expect(screen.getByTestId("agent-dock-panel")).toHaveAttribute(
      "data-mode",
      "side-rail",
    );
  });

  it("runs suggested questions through the same chat shell instead of an old centered ask lane", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({ type: "delta", text: "Suggested answer." }),
        JSON.stringify({ type: "done" }),
        "",
      ]),
    });
    global.fetch = fetchMock as typeof fetch;

    render(
      <IntelligenceV2Surface
        payload={apexPayload}
        tenantName="Apex Retail Group"
      />,
    );

    fireEvent.click(screen.getByText("Which AI investments should Apex scale?"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(await screen.findAllByText("Suggested answer.")).not.toHaveLength(0);
    expect(screen.getAllByTestId("agent-dock-turn-user")).toHaveLength(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      q: "Which AI investments should Apex scale?",
      client: "apex-retail",
      format: "rich",
    });
  });

  it("has an Intelligence v2 binding payload for every configured client tenant", () => {
    for (const client of ALL_CLIENTS) {
      expect(getIntelligenceBindingPayload(client.id)).toBeTruthy();
    }
  });
});
