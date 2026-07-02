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
      screen.getByText("Executive intelligence canvas."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ask anything about")).not.toBeInTheDocument();

    const askBox = screen.getByTestId("agent-dock-input");
    expect(askBox.tagName).toBe("TEXTAREA");
    expect(askBox).toHaveAttribute(
      "placeholder",
      "Ask about Retail Demo",
    );

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
        activeClient: "Apex Retail Group",
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
    const agentTurn = screen.getByTestId("agent-dock-turn-agent");
    expect(within(agentTurn).queryByRole("table")).not.toBeInTheDocument();
    expect(
      within(agentTurn).queryByText(/Apex AI Spend evidence/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Apex AI Spend evidence/i),
    ).not.toBeInTheDocument();
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
      q: "Which AI investments should Apex scale?",
      client: "apex-retail",
      format: "rich",
    });
  });

  it("keeps suggested chips visible as adaptive follow-ups after the prior question", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({ type: "delta", text: "Finance answer." }),
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

    const askBox = screen.getByTestId("agent-dock-input");
    fireEvent.change(askBox, {
      target: {
        value:
          "How should the CIO prioritize finance and shared services automation?",
      },
    });
    fireEvent.click(screen.getByTestId("agent-dock-send"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(
        "Which function should be the CIO's lighthouse use case, and why?",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "What proof is missing before HR or Legal AI can move beyond discovery?",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "What value-readiness tradeoff should the CIO approve?",
      ),
    ).toBeInTheDocument();
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

  it("routes raw streamed decision-canvas markers into a companion board without exposing them", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({
          type: "delta",
          text: [
            "Certify the finance business layer before scaling more finance AI.",
            "",
            "<<<TAB: Decision | grounding: tenant-evidence>>>",
            "Choice: certify the business layer first.",
            "",
            "<<<TAB: Table | grounding: tenant-evidence>>>",
            "Tenant evidence: compact portfolio view.",
            "",
            "| Initiative | Posture |",
            "|---|---|",
            "| M365 Copilot finance | Hold scale |",
            "| Kyriba rollout | Scale with guard |",
          ].join("\n"),
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
      target: { value: "What is the single best AI investment?" },
    });
    fireEvent.click(screen.getByTestId("agent-dock-send"));

    expect(
      await screen.findAllByText(
        "Certify the finance business layer before scaling more finance AI.",
      ),
    ).not.toHaveLength(0);
    await waitFor(() => {
      expect(document.body.textContent).not.toContain("<<<TAB:");
    });

    expect(
      screen.queryByRole("button", { name: /Companion/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Answer$/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Decision/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Visual/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Table/ }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Decision canvas")).toBeInTheDocument();
      expect(screen.getByText("2 views")).toBeInTheDocument();
      expect(screen.getByText("Decision")).toBeInTheDocument();
      expect(screen.getByText("Decision Table")).toBeInTheDocument();
      expect(document.body.textContent).toContain(
        "Tenant evidence: compact portfolio view.",
      );
      expect(document.body.textContent).toContain("M365 Copilot finance");
      expect(document.body.textContent).not.toContain("Company evidence");
    });
  });

  it("strips tab markers from the visible answer even when a Chart tab is dropped", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({
          type: "delta",
          text: [
            "Use the finance control gate before approving broader automation.",
            "",
            "<<<TAB: Chart | grounding: tenant-evidence>>>",
            "Useful chart idea, but no numeric Markdown table was produced.",
          ].join("\n"),
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
      target: { value: "Show the decision with a chart." },
    });
    fireEvent.click(screen.getByTestId("agent-dock-send"));

    expect(
      await screen.findAllByText(
        "Use the finance control gate before approving broader automation.",
      ),
    ).not.toHaveLength(0);
    await waitFor(() => {
      expect(document.body.textContent).not.toContain("<<<TAB:");
      expect(document.body.textContent).not.toContain("grounding:");
    });
    expect(
      screen.queryByRole("button", { name: /Visual/ }),
    ).not.toBeInTheDocument();
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
      expect(document.body.textContent).not.toContain(
        "Source, Tower, or Moves",
      );
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

  it("renders Claude-owned companion cards on the right canvas without leaking markers into the left answer", async () => {
    const mainAnswer =
      "SkyHarbor should fund IROPS recovery decisioning only through a governed readiness gate.";
    const visibleMainAnswer =
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
                    "Function context: directional opportunity map for the right canvas.",
                    "",
                    "| Value pool | Annual value | Readiness |",
                    "|---|---:|---:|",
                    "| IROPS recovery decisioning | $270M | 72 |",
                    "| Predictive maintenance | $140M | 64 |",
                    "| Loyalty personalization | $95M | 81 |",
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

    expect(await screen.findAllByText(visibleMainAnswer)).not.toHaveLength(0);
    const agentTurn = screen.getByTestId("agent-dock-turn-agent");
    expect(within(agentTurn).getByText(visibleMainAnswer)).toBeInTheDocument();
    expect(within(agentTurn).queryByText(/<<<TAB:/)).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /Companion/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Answer$/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Decision/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Context/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Visual/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Proof/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Industry Insights/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Chart/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Table/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Evidence/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Decision 0/ }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Decision canvas")).toBeInTheDocument();
      expect(screen.getByText("5 views")).toBeInTheDocument();
      expect(screen.getByText("Industry Signal")).toBeInTheDocument();
      expect(screen.getByText("Opportunity Map")).toBeInTheDocument();
      expect(screen.getByText("Decision Table")).toBeInTheDocument();
      expect(screen.getByText("Proof Boundary")).toBeInTheDocument();
      expect(screen.getByText("Industry lens")).toBeInTheDocument();
      expect(screen.getByTestId("intelligence-visual-map")).toBeInTheDocument();
      expect(screen.getByText("Visual snapshot")).toBeInTheDocument();
      expect(screen.getByText("Annual value")).toBeInTheDocument();
      expect(screen.getByText("Readiness")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Industry context: airlines usually start with dispatch decision support. This is not tenant proof.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText("Company evidence")).not.toBeInTheDocument();
      expect(
        screen.getAllByText((_, node) => node?.textContent === tableContent)
          .length,
      ).toBeGreaterThan(0);
    });
  });

  it("renders structured AbarVa executive canvas payloads without exposing JSON", async () => {
    const mainAnswer =
      "Scale Loyalty now, certify Crew Recovery next, and fund IROPS readiness before autonomous expansion.";
    const canvasPayload = {
      canvasType: "investmentSequencingMap",
      title: "AI funding sequence for SkyHarbor",
      columns: [
        {
          label: "Scale now",
          items: [
            {
              label: "Loyalty",
              value: 8,
              readiness: 8,
              risk: 4,
              action: "Scale now",
              owner: "Chief Digital Officer",
              gate: "Certified customer engagement data",
            },
            {
              label: "HR AI operating model and shared services transformation",
              value: 6,
              readiness: 5,
              risk: 5,
              action: "Shape discovery",
            },
          ],
        },
        {
          label: "Certify then scale",
          items: ["Crew Recovery", "Predictive Maintenance"],
        },
        {
          label: "Fund readiness",
          items: ["IROPS", "Customer Disruption Recovery"],
        },
      ],
      proofBoundary: {
        known: ["Loyalty has certified engagement data"],
        missing: ["IROPS operational data certification"],
        decisionRequired: "Give CDAO gate authority before the IROPS tranche.",
      },
    };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({
          type: "delta",
          text: [
            mainAnswer,
            "",
            "<<<TAB: Table | grounding: tenant-evidence>>>",
            "| Initiative | Posture |",
            "| --- | --- |",
            "| Legacy table | Hold |",
            "",
            "<<<TAB: Decision | grounding: tenant-evidence>>>",
            "Tenant evidence: use the sequence to separate scale decisions from readiness funding.",
            "",
            "```abarva-canvas",
            JSON.stringify(canvasPayload),
            "```",
          ].join("\n"),
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
        }}
      />,
    );

    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: { value: "Where should we fund AI next?" },
    });
    fireEvent.click(screen.getByTestId("agent-dock-send"));

    expect(await screen.findAllByText(mainAnswer)).not.toHaveLength(0);
    await waitFor(() => {
      expect(screen.getByText("Decision canvas")).toBeInTheDocument();
      expect(
        screen.getByTestId("executive-canvas-sequencing"),
      ).toBeInTheDocument();
      expect(
        document.querySelector(".companionCard:first-child"),
      ).toContainElement(screen.getByTestId("executive-canvas-sequencing"));
      expect(screen.getByTestId("executive-canvas-sequencing")).toHaveAttribute(
        "data-native-canvas-type",
        "executive-canvas-sequencing",
      );
      expect(
        screen.getByText("AI funding sequence for SkyHarbor"),
      ).toBeInTheDocument();
      expect(
        screen
          .getByText(
            "Tenant evidence: use the sequence to separate scale decisions from readiness funding.",
          )
          .closest(".companionCard"),
      ).toHaveClass("wide");
      expect(screen.getAllByText("Scale now").length).toBeGreaterThan(0);
      expect(screen.getByText("Certify then scale")).toBeInTheDocument();
      expect(screen.getByText("Fund readiness")).toBeInTheDocument();
      expect(screen.getAllByText("Loyalty").length).toBeGreaterThan(0);
      expect(screen.getByText(/Value vs\. readiness/i)).toBeInTheDocument();
      expect(screen.getByText("Funding sequence")).toBeInTheDocument();
      const plottedMarkers = Array.from(
        document.querySelectorAll(".researchDot"),
      ).map((node) => node.textContent?.trim());
      expect(plottedMarkers).toEqual(["1", "2"]);
      expect(document.querySelector(".chartKey")).toBeInTheDocument();
      expect(
        screen.getAllByText(
          "HR AI operating model and shared services transformation",
        ).length,
      ).toBeGreaterThan(0);
      expect(document.querySelector(".researchPoint")).not.toHaveAttribute(
        "data-label-placement",
      );
      expect(document.querySelector(".researchPoint")).toHaveAttribute(
        "aria-label",
        expect.stringContaining("1."),
      );
      expect(screen.getByText("Value 8")).toBeInTheDocument();
      expect(screen.getByText("Ready 8")).toBeInTheDocument();
      expect(screen.getByText("Risk 4")).toBeInTheDocument();
      expect(screen.getByText("Chief Digital Officer")).toBeInTheDocument();
      expect(
        screen.getByText("Certified customer engagement data"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Give CDAO gate authority before the IROPS tranche."),
      ).toBeInTheDocument();
      expect(document.body.textContent).not.toContain("abarva-canvas");
      expect(document.body.textContent).not.toContain("canvasType");
      expect(document.body.textContent).not.toContain("grounding:");
      expect(document.body.textContent).not.toContain("<<<TAB:");
    });
  });

  it("renders value/readiness matrix payloads as a native board exhibit", async () => {
    const mainAnswer =
      "The portfolio tradeoff is clear: scale Loyalty, protect Crew Recovery, and fund IROPS readiness before autonomous expansion.";
    const canvasPayload = {
      canvasType: "valueReadinessMatrix",
      title: "AI portfolio value/readiness map",
      items: [
        {
          label: "Loyalty AI",
          value: 8,
          readiness: 9,
          risk: 4,
          action: "Scale now",
          owner: "President Loyalty",
          gate: "Certified customer engagement data",
        },
        {
          label: "IROPS Decision Assistant",
          value: 10,
          readiness: 3,
          risk: 8,
          action: "Fund readiness",
          owner: "EVP Operations + CDAO",
          gate: "Certified operational data product",
        },
      ],
      proofBoundary: {
        known: ["Loyalty evidence is stronger than IROPS data readiness."],
        missing: ["IROPS operational certification"],
        decisionRequired: "Approve the readiness sprint before scale capital.",
      },
    };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({
          type: "delta",
          text: [
            mainAnswer,
            "",
            "<<<TAB: Chart | grounding: tenant-evidence>>>",
            "Tenant evidence: value/readiness map.",
            "",
            "```abarva-canvas",
            JSON.stringify(canvasPayload),
            "```",
          ].join("\n"),
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
        }}
      />,
    );

    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: { value: "Which AI bets are high value but not ready?" },
    });
    fireEvent.click(screen.getByTestId("agent-dock-send"));

    expect(await screen.findAllByText(mainAnswer)).not.toHaveLength(0);
    await waitFor(() => {
      expect(screen.getByTestId("executive-canvas-matrix")).toBeInTheDocument();
      expect(screen.getByText("Portfolio tradeoff")).toBeInTheDocument();
      expect(screen.getByText("AI portfolio value/readiness map")).toBeInTheDocument();
      expect(screen.getByText("High value + low readiness: fund the gate first")).toBeInTheDocument();
      expect(screen.getAllByText("Loyalty AI").length).toBeGreaterThan(1);
      expect(screen.getAllByText("IROPS Decision Assistant").length).toBeGreaterThan(1);
      expect(screen.getByText("Certified operational data product")).toBeInTheDocument();
      expect(screen.getByText("Approve the readiness sprint before scale capital.")).toBeInTheDocument();
      expect(document.body.textContent).not.toContain("canvasType");
      expect(document.body.textContent).not.toContain("abarva-canvas");
    });
  });

  it("renders gate-to-value roadmap payloads as a native board exhibit", async () => {
    const mainAnswer =
      "Do not fund scale first. Fund the gates that convert AI ideas into capital-ready initiatives.";
    const canvasPayload = {
      canvasType: "gateToValueRoadmap",
      title: "AI gate-to-value roadmap",
      gates: [
        {
          label: "Certify source data products",
          owner: "CDAO",
          dependency: "Crew, PNR, event store, and maintenance lineage",
          valueUnlocked: "$270M IROPS pool becomes investment-grade",
          status: "First",
        },
        {
          label: "Approve human-in-loop model boundary",
          owner: "AI Governance Council",
          dependency: "Model-risk tier and operational exception handling",
          valueUnlocked: "Safe pilot expansion",
          status: "Next",
        },
      ],
      proofBoundary: {
        known: ["The largest value pool is gated by operational data readiness."],
        missing: ["Certified freshness SLA"],
        decisionRequired: "Name the accountable gate owner before releasing scale capital.",
      },
    };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamFromLines([
        JSON.stringify({
          type: "delta",
          text: [
            mainAnswer,
            "",
            "<<<TAB: Decision | grounding: tenant-evidence>>>",
            "Tenant evidence: this is a gate-before-scale decision.",
            "",
            "```abarva-canvas",
            JSON.stringify(canvasPayload),
            "```",
          ].join("\n"),
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
        }}
      />,
    );

    fireEvent.change(screen.getByTestId("agent-dock-input"), {
      target: { value: "What has to happen first before we scale IROPS AI?" },
    });
    fireEvent.click(screen.getByTestId("agent-dock-send"));

    expect(await screen.findAllByText(mainAnswer)).not.toHaveLength(0);
    await waitFor(() => {
      expect(screen.getByTestId("executive-canvas-roadmap")).toBeInTheDocument();
      expect(screen.getByText("Gate to value")).toBeInTheDocument();
      expect(screen.getByText("AI gate-to-value roadmap")).toBeInTheDocument();
      expect(screen.getByText("Certify source data products")).toBeInTheDocument();
      expect(screen.getByText("AI Governance Council")).toBeInTheDocument();
      expect(screen.getByText("$270M IROPS pool becomes investment-grade")).toBeInTheDocument();
      expect(screen.getByText("Name the accountable gate owner before releasing scale capital.")).toBeInTheDocument();
      expect(document.body.textContent).not.toContain("canvasType");
      expect(document.body.textContent).not.toContain("abarva-canvas");
    });
  });

  it("has an Intelligence v2 binding payload for every configured client tenant", () => {
    for (const client of ALL_CLIENTS) {
      expect(getIntelligenceBindingPayload(client.id)).toBeTruthy();
    }
  });
});
