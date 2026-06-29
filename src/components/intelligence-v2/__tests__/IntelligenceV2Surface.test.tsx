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
            directAnswer: "Apex should gate lakehouse scale on measured value.",
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
    expect(
      screen.getByText("Leadership intelligence canvas."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ask anything about")).not.toBeInTheDocument();

    const askBox = screen.getByTestId("agent-dock-input");
    expect(askBox.tagName).toBe("TEXTAREA");
    expect(askBox).toHaveAttribute("placeholder", "Ask about Retail Demo");

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
        activeTab: "intelligence",
        activeClient: "Retail Demo",
        clientKey: "apex-retail",
      },
    });
    expect(body.surfaceContext.tenantFacts).toEqual(
      expect.arrayContaining([
        expect.stringContaining("8 business areas"),
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
        "Retail Demo should gate lakehouse scale on measured value.",
      ),
    ).not.toHaveLength(0);
    expect(screen.queryByText(/Consulted experts/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/17,548 evidence points/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/Retail Demo AI Spend evidence/i).length,
    ).toBeGreaterThan(0);
    const agentTurn = screen.getByTestId("agent-dock-turn-agent");
    expect(within(agentTurn).queryByRole("table")).not.toBeInTheDocument();
    expect(
      within(agentTurn).queryByText(/Retail Demo AI Spend evidence/i),
    ).not.toBeInTheDocument();
    const table = screen.getAllByRole("table")[0];
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

    fireEvent.click(
      screen.getByText("Which AI investments should Retail Demo scale?"),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(await screen.findAllByText("Suggested answer.")).not.toHaveLength(0);
    expect(screen.getAllByTestId("agent-dock-turn-user")).toHaveLength(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      q: "Which AI investments should Retail Demo scale?",
      client: "apex-retail",
      format: "rich",
    });
  });

  it("uses cleaned agent-answer prose in the latest-answer canvas", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({
          type: "delta",
          text: "Raw table leak | Initiative | Posture | |---|---| | Loyalty | Stop |",
        }),
        JSON.stringify({
          type: "agent-answer",
          answer: {
            surface: "intelligence",
            mode: "ANALYZE",
            tenantKey: "apex-retail",
            question: "Which AI initiatives should we kill?",
            intent: "table",
            status: "answered",
            directAnswer:
              "No initiative is a clean kill, but Loyalty should stop at current scope until identity foundations exist.",
            factsUsed: [],
            metricsUsed: [],
            relationshipsUsed: [],
            artifacts: [],
            citations: [
              {
                id: "c1",
                label: "Tenant evidence",
                sourceClass: "tenant-fact",
              },
            ],
            gaps: [],
            caveats: [],
            nextSteps: [],
            quality: {
              confidence: "high",
              evidenceStrength: "strong",
              tenantGrounding: "strong",
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

    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: { value: "Which AI initiatives should we kill?" },
    });
    fireEvent.click(screen.getByTestId("agent-dock-send"));

    expect(
      await screen.findAllByText(
        "No initiative is a clean kill, but Loyalty should stop at current scope until identity foundations exist.",
      ),
    ).not.toHaveLength(0);
    await waitFor(() => {
      expect(document.body.textContent).not.toContain("| Initiative |");
      expect(document.body.textContent).not.toContain("Tenant evidence");
    });
  });

  it("keeps source-support tables out of the visible advisor answer", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({
          type: "delta",
          text: "Raw stream should be superseded by the cleaned packet.",
        }),
        JSON.stringify({
          type: "agent-answer",
          answer: {
            surface: "intelligence",
            mode: "ANALYZE",
            tenantKey: "skyharbor",
            question:
              "What is the single best AI investment SkyHarbor should make next?",
            intent: "table",
            status: "answered",
            directAnswer:
              "Fund IROPS recovery automation next, but only behind the operational-data readiness gate.\n\nNext, have the accountable owner review the listed sources and decide whether this belongs in Source, Tower, or Moves.\n\nTables\nevidence\nSource\tType\tConfidence\tHow IT Supports The Answer\nSkyHarbor Air live Intelligence surface\ttenant material\thigh\tActive Intelligence surface for SkyHarbor Air.\nThis panel lists the material used for the answer. It does not invent missing values or relationships.\nSkyHarbor Air live Intelligence surface\n·\nTenant evidence",
            prose:
              "Fund IROPS recovery automation next, but only behind the operational-data readiness gate.",
            factsUsed: [],
            metricsUsed: [],
            relationshipsUsed: [],
            artifacts: [
              {
                artifact: "table",
                id: "skyharbor-evidence-register",
                title: "evidence",
                columns: [
                  { key: "source", label: "Source" },
                  { key: "type", label: "Type" },
                  { key: "confidence", label: "Confidence" },
                  {
                    key: "use",
                    label: "How IT Supports The Answer",
                  },
                ],
                rows: [
                  {
                    source: "SkyHarbor Air live Intelligence surface",
                    type: "tenant material",
                    confidence: "high",
                    use: "Active Intelligence surface for SkyHarbor Air.",
                  },
                ],
                citationIds: ["c1"],
              },
            ],
            citations: [
              {
                id: "c1",
                label: "SkyHarbor Air live Intelligence surface",
                sourceClass: "tenant-fact",
              },
            ],
            gaps: [],
            caveats: [],
            nextSteps: [],
            quality: {
              confidence: "high",
              evidenceStrength: "strong",
              tenantGrounding: "strong",
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
        tenantName="SkyHarbor Air"
      />,
    );

    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: {
        value:
          "What is the single best AI investment SkyHarbor should make next?",
      },
    });
    fireEvent.click(screen.getByTestId("agent-dock-send"));

    expect(
      await screen.findAllByText(
        "Fund IROPS recovery automation next, but only behind the operational-data readiness gate.",
      ),
    ).not.toHaveLength(0);
    await waitFor(() => {
      expect(document.body.textContent).not.toContain("aVa · intelligence");
      expect(document.body.textContent).not.toContain("high confidence");
      expect(document.body.textContent).not.toContain("Source, Tower, or Moves");
      expect(document.body.textContent).not.toContain("Tables");
      expect(document.body.textContent).not.toContain("evidence");
      expect(document.body.textContent).not.toContain(
        "How IT Supports The Answer",
      );
      expect(document.body.textContent).not.toContain("tenant material");
      expect(document.body.textContent).not.toContain("Tenant evidence");
      expect(document.body.textContent).not.toContain("Evidence basis");
    });
  });

  it("renders Claude-owned decision tabs on the right canvas without leaking markers into the left answer", async () => {
    const mainAnswer =
      "Airline Demo should fund IROPS recovery decisioning only through a governed readiness gate.";
    const tableContent = [
      "| Option | Value | Readiness | Decision |",
      "|---|---:|---|---|",
      "| IROPS recovery decisioning | $270M | Gate required | Fund gated tranche |",
      "| Customer AI concierge | $180M | Identity dependency | Hold scale |",
    ].join("\n");
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({
          type: "agent-answer",
          answer: {
            surface: "intelligence",
            mode: "ANALYZE",
            tenantKey: "skyharbor-air",
            question: "What AI investment should SkyHarbor make next?",
            intent: "decision_canvas",
            status: "answered",
            directAnswer: mainAnswer,
            prose: mainAnswer,
            factsUsed: [],
            metricsUsed: [],
            relationshipsUsed: [],
            expertsUsed: [],
            artifacts: [],
            citations: [],
            gaps: [],
            caveats: [],
            nextSteps: [],
            corpusUsed: [{ id: "industry-context", label: "Industry context" }],
            decisionFrame: {
              rendererMode: "display-only",
              intelligenceTabs: [
                {
                  id: "decision",
                  label: "Decision",
                  grounding: "tenant-evidence",
                  content:
                    "Approve a gated IROPS decisioning tranche before autonomous write-back.",
                },
                {
                  id: "industry_insights",
                  label: "Industry Insights",
                  grounding: "industry-context",
                  content:
                    "Industry context: airlines usually start with dispatch decision support. This is not tenant proof.",
                },
                {
                  id: "chart",
                  label: "Chart",
                  grounding: "function-context",
                  content: [
                    "| Value pool | Annual value |",
                    "|---|---:|",
                    "| IROPS recovery decisioning | $270M |",
                  ].join("\n"),
                },
                {
                  id: "table",
                  label: "Table",
                  grounding: "tenant-evidence",
                  content: tableContent,
                },
                {
                  id: "evidence",
                  label: "Evidence",
                  grounding: "mixed",
                  content:
                    "- Tenant facts: named value pools.\n- Missing evidence: signed freshness SLA.",
                },
              ],
            },
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
        payload={{
          ...apexPayload,
          tenant: {
            key: "skyharbor-air",
            displayName: "SkyHarbor Air",
            industry: "Airline",
          },
          ask: {
            placeholder: "Ask about SkyHarbor",
            contract: "Answers are grounded in the loaded context.",
          },
        }}
      />,
    );

    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: { value: "What AI investment should SkyHarbor make next?" },
    });
    fireEvent.click(screen.getByTestId("agent-dock-send"));

    expect(await screen.findAllByText(mainAnswer)).not.toHaveLength(0);
    const agentTurn = screen.getByTestId("agent-dock-turn-agent");
    expect(within(agentTurn).getByText(mainAnswer)).toBeInTheDocument();
    expect(within(agentTurn).queryByText(/<<<TAB:/)).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Decision/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Industry Insights/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Chart/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Table/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Evidence/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Decision 0/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Chart 0/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Industry Insights/ }));
    expect(screen.getByText("Industry context")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Industry context: airlines usually start with dispatch decision support. This is not tenant proof.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Chart/ }));
    expect(screen.getByText("Function context")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Table/ }));
    expect(screen.getByText("Tenant evidence")).toBeInTheDocument();
    expect(
      screen.getAllByText((_, node) => node?.textContent === tableContent).length,
    ).toBeGreaterThan(0);
  });

  it("has an Intelligence v2 binding payload for every configured client tenant", () => {
    for (const client of ALL_CLIENTS) {
      expect(getIntelligenceBindingPayload(client.id)).toBeTruthy();
    }
  });
});
