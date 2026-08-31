/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import {
  AgentAnswerRenderer,
  AnswerChartRenderer,
  DataTable,
  renderAnswerChartSvg,
} from "@/components/agent-answer/AgentAnswerRenderer";
import type {
  AnswerChart,
  AnswerCitation,
  AnswerGraph,
  AnswerTable,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";

jest.mock("@/lib/agent/markdownRenderer", () => ({
  AgentMarkdown: ({ text }: { text: string }) => <div>{text}</div>,
}));

jest.mock("recharts", () => {
  const React = jest.requireActual("react");
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-responsive">{children}</div>
    ),
  };
});

const citations: AnswerCitation[] = [
  {
    id: "c1",
    label: "F12 IT budget",
    sourceClass: "tenant-chunk",
    recordId: "chunk-1",
    excerpt: "Epic maintenance spend is part of run cost.",
  },
];

describe("AgentAnswerRenderer", () => {
  it("renders an AnswerChart through the chart-kind builder map", () => {
    const chart: AnswerChart = {
      id: "chart-1",
      kind: "cost-stack",
      title: "Run/change cost mix",
      data: [
        { label: "Run", value: 2_400_000, color: "#0b4a91" },
        { label: "Change", value: 900_000, color: "#dbe6f3" },
      ],
      citationIds: ["c1"],
    };

    const rendered = renderAnswerChartSvg(chart);
    expect(rendered.builderName).toBe("costStack");
    expect(rendered.svg).toContain("<svg");
    expect(rendered.svg).toContain("Cost stack");

    const { container } = render(
      <AnswerChartRenderer chart={chart} citations={citations} />,
    );
    expect(screen.getByText("Run/change cost mix")).toBeInTheDocument();
    expect(screen.queryByText("costStack")).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-chart-renderer='recharts']"),
    ).not.toBeNull();
    expect(
      container.querySelector("[data-chart-builder='costStack']"),
    ).toBeNull();
    expect(screen.getByText("F12 IT budget")).toBeInTheDocument();
  });

  it("renders a typed quadrant matrix chart", () => {
    const chart: AnswerChart = {
      id: "chart-quadrant",
      kind: "quadrant-matrix",
      title: "Supply chain AI use-case matrix",
      data: {
        points: [
          { label: "Demand sensing", x: 52, y: 78 },
          { label: "Supplier risk sensing", x: 24, y: 52 },
          {
            label: "Autonomous planning exception triage",
            x: 78,
            y: 92,
          },
        ],
      },
      citationIds: ["c1"],
    };

    const rendered = renderAnswerChartSvg(chart);
    expect(rendered.builderName).toBe("quadrantMatrix");
    expect(rendered.svg).toContain("Quick wins");
    expect(rendered.svg).toContain("Demand sensing");

    const { container } = render(
      <AnswerChartRenderer chart={chart} citations={citations} />,
    );
    expect(
      screen.getByText("Supply chain AI use-case matrix"),
    ).toBeInTheDocument();
    expect(
      container.querySelector("[data-chart-renderer='recharts']"),
    ).not.toBeNull();
    expect(
      container.querySelector("[data-chart-builder='quadrantMatrix']"),
    ).toBeNull();
  });

  it("renders model-emitted horizontal bar charts through Recharts", () => {
    const chart: AnswerChart = {
      id: "chart-horizontal",
      kind: "horizontal-bar",
      title: "FS Demo use-case value ranking",
      subtitle: "Directional score from governed answer packet",
      xKey: "use_case",
      yKey: "valueScore",
      unit: "score",
      builder: "inlineChart",
      data: {
        type: "horizontal-bar",
        xKey: "use_case",
        yKey: "valueScore",
        unit: "score",
        data: [
          { use_case: "Wire fraud interdiction", valueScore: 95 },
          { use_case: "Servicing copilot", valueScore: 74 },
          { use_case: "Loan exception routing", valueScore: 68 },
        ],
      },
      citationIds: ["c1"],
    };

    const { container } = render(
      <AnswerChartRenderer chart={chart} citations={citations} />,
    );

    expect(
      screen.getByText("FS Demo use-case value ranking"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Directional score from governed answer packet"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(
        "[data-chart-renderer='recharts'][data-chart-kind='horizontal-bar']",
      ),
    ).not.toBeNull();
    expect(container.querySelector("[data-chart-renderer='svg']")).toBeNull();
  });

  it("renders value-proof waterfall charts as an executive proof ladder", () => {
    const chart: AnswerChart = {
      id: "chart-value-proof",
      kind: "horizontal-bar",
      title: "AI Investment Value Waterfall — FY26 Posture by Stage",
      subtitle:
        "Promise, partial validation, and claimable value are distinct states.",
      xKey: "stage",
      yKey: "amount",
      unit: "usd",
      data: {
        type: "horizontal-bar",
        xKey: "stage",
        yKey: "amount",
        unit: "usd",
        data: [
          {
            stage: "FY26 AI-tagged committed spend",
            amount: 53_700_000,
            claim_status: "Committed — not yet measured",
          },
          {
            stage: "Forecast value commitment",
            amount: 35_500_000,
            claim_status: "Forecast / planning only",
          },
          {
            stage: "Finance-validated partial value",
            amount: 3_800_000,
            claim_status: "Partial — attestation pending",
          },
          {
            stage: "Finance-attested realized value",
            amount: 0,
            claim_status: "Blocked — no realized value allowed",
          },
        ],
      },
      citationIds: ["c1"],
    };

    const { container } = render(
      <AnswerChartRenderer chart={chart} citations={citations} />,
    );

    expect(
      container.querySelector("[data-chart-exhibit='value-proof-ladder']"),
    ).not.toBeNull();
    expect(screen.getByLabelText("Value proof ladder")).toBeInTheDocument();
    expect(screen.getByText("$53.7M")).toBeInTheDocument();
    expect(screen.getByText("$35.5M")).toBeInTheDocument();
    expect(screen.getByText("$3.8M")).toBeInTheDocument();
    expect(
      screen.getByText("Blocked — no realized value allowed"),
    ).toBeInTheDocument();
  });

  it("adds executive quadrant guidance to portfolio matrix charts", () => {
    const chart: AnswerChart = {
      id: "chart-quadrant-guided",
      kind: "quadrant-matrix",
      title: "AI portfolio value versus readiness",
      data: {
        points: [
          { label: "Copilot productivity", x: 72, y: 78 },
          { label: "ServiceNow AI", x: 58, y: 62 },
          { label: "Member service AI Assist", x: 32, y: 84 },
        ],
      },
      citationIds: ["c1"],
    };

    const { container } = render(
      <AnswerChartRenderer chart={chart} citations={citations} />,
    );

    expect(
      container.querySelector("[data-chart-exhibit='portfolio-quadrant']"),
    ).not.toBeNull();
    expect(screen.getByLabelText("Quadrant guide")).toBeInTheDocument();
    expect(screen.getByText("Scale with proof")).toBeInTheDocument();
    expect(screen.getByText("Fix adoption first")).toBeInTheDocument();
    expect(screen.getByText("Freeze or stop")).toBeInTheDocument();
  });

  it("renders a typed AnswerTable with formatting and citations", () => {
    const table: AnswerTable = {
      id: "table-1",
      title: "Epic spend",
      columns: [
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount", format: "currency" },
        { key: "share", label: "Share", format: "percent" },
      ],
      rows: [
        { category: "Maintenance", amount: 1200000, share: 0.42 },
        { category: "Integration", amount: 350000, share: 0.12 },
      ],
      citationIds: ["c1"],
      note: "Includes run-cost categories only.",
    };

    render(<DataTable table={table} citations={citations} />);

    const tableNode = screen.getByRole("table");
    expect(within(tableNode).getByText("Category")).toBeInTheDocument();
    expect(within(tableNode).getByText("$1.2M")).toBeInTheDocument();
    expect(within(tableNode).getByText("42%")).toBeInTheDocument();
    expect(
      screen.getByText("Includes run-cost categories only."),
    ).toBeInTheDocument();
    expect(screen.getByText("F12 IT budget")).toBeInTheDocument();
    expect(screen.queryByText(/\b2 rows\b/i)).not.toBeInTheDocument();
  });

  it("suppresses non-renderable chart artifacts when other answer content is available", () => {
    const answer: AvaAnswerPacket = {
      surface: "intelligence",
      mode: "ANALYZE",
      tenantKey: "meridian",
      question: "Rank AI bets by value and complexity.",
      intent: "chart",
      status: "answered",
      directAnswer: "Payment integrity is the first evidence-gate bet.",
      factsUsed: [],
      metricsUsed: [],
      relationshipsUsed: [],
      artifacts: [
        {
          artifact: "chart",
          id: "bad-chart",
          kind: "bar",
          title: "Empty ranking chart",
          builder: "inlineChart",
          data: {
            type: "bar",
            title: "Empty ranking chart",
            xKey: "Use case",
            yKey: "Value",
            data: [{ "Use case": "Payment integrity", Value: "High" }],
          },
        },
        {
          artifact: "table",
          id: "decision-table",
          title: "Decision table",
          columns: [{ key: "use_case", label: "Use case" }],
          rows: [{ use_case: "Payment integrity" }],
        },
      ],
      citations: [],
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
    };

    render(<AgentAnswerRenderer answer={answer} />);

    expect(screen.queryByText("Empty ranking chart")).not.toBeInTheDocument();
    expect(screen.queryByText("Visuals")).not.toBeInTheDocument();
    expect(screen.getByText("Decision Table")).toBeInTheDocument();
    expect(screen.getByText("Payment integrity")).toBeInTheDocument();
  });

  it("formats numeric strings in inferred money columns", () => {
    const table: AnswerTable = {
      id: "table-strings",
      title: "IT budget",
      columns: [
        { key: "spend_record", label: "Spend record" },
        { key: "amount_usd", label: "Amount" },
      ],
      rows: [{ spend_record: "Corporate budget", amount_usd: "36500000" }],
      citationIds: [],
    };

    render(<DataTable table={table} citations={[]} />);

    const tableNode = screen.getByRole("table");
    expect(within(tableNode).getByText("$36.5M")).toBeInTheDocument();
    expect(within(tableNode).queryByText("36500000")).not.toBeInTheDocument();
  });

  it("respects explicit text columns for numeric count-like values", () => {
    const table: AnswerTable = {
      id: "table-metrics",
      title: "Tower metrics referenced",
      columns: [
        { key: "metric", label: "Metric", format: "text" },
        { key: "value", label: "Value", format: "text" },
      ],
      rows: [
        { metric: "Value claims", value: "42" },
        { metric: "Claimable value", value: "$13.1M" },
      ],
      citationIds: [],
    };

    render(<DataTable table={table} citations={[]} />);

    const tableNode = screen.getByRole("table");
    expect(within(tableNode).getByText("42")).toBeInTheDocument();
    expect(within(tableNode).queryByText("$42")).not.toBeInTheDocument();
    expect(within(tableNode).getByText("$13.1M")).toBeInTheDocument();
  });

  it("renders typed relationship graphs through the canonical answer renderer", () => {
    const graph: AnswerGraph = {
      id: "graph-1",
      title: "Dependency graph",
      nodes: [
        { id: "n1", label: "Retail Lakehouse" },
        { id: "n2", label: "Demand Forecasting" },
      ],
      edges: [{ from: "n1", to: "n2", label: "feeds" }],
      citationIds: ["c1"],
    };
    const answer: AvaAnswerPacket = {
      surface: "intelligence",
      mode: "ANALYZE",
      tenantKey: "apex-retail",
      question: "Show the dependency graph",
      intent: "graph",
      status: "answered",
      directAnswer: "The dependency path is explicit.",
      factsUsed: [],
      metricsUsed: [],
      relationshipsUsed: [],
      artifacts: [{ ...graph, artifact: "graph" }],
      citations,
      gaps: [],
      caveats: [],
      nextSteps: [],
      quality: {
        confidence: "medium",
        evidenceStrength: "partial",
        tenantGrounding: "partial",
        answerCompleteness: "complete",
        cxo: {
          mode: "risk_control",
          score: 92,
          passed: true,
          findings: [],
        },
      },
      safety: {
        tenantFencePassed: true,
        rawIdsSuppressed: true,
        forbiddenLanguagePassed: true,
        unsupportedClaimsBlocked: true,
      },
    };

    render(<AgentAnswerRenderer answer={answer} />);

    expect(screen.getByText("Relationship View")).toBeInTheDocument();
    expect(screen.getByText("risk control · 92")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export HTML" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export PDF" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dependency graph")).toBeInTheDocument();
    expect(screen.getByText("Relationship map")).toBeInTheDocument();
    expect(screen.queryByText(/nodes ·/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Dependency graph")).toBeInTheDocument();
    expect(screen.queryByText("F12 IT budget")).not.toBeInTheDocument();
  });

  it("renders Source contract ledger tables charts and relationship graphs", () => {
    const answer: AvaAnswerPacket = {
      surface: "source",
      mode: "ANALYZE",
      tenantKey: "skyharbor_global",
      question: "Show a contract table chart and relationship graph.",
      intent: "source_contract_visual",
      status: "answered",
      directAnswer:
        "The selected contract has governed values for the optimization ledgers; outside-in sourcing patterns remain advisory.",
      factsUsed: [],
      metricsUsed: [],
      relationshipsUsed: [],
      artifacts: [
        {
          artifact: "table",
          id: "source-contract-four-ledger-table",
          title: "Four-ledger Contract Evidence",
          columns: [
            { key: "ledger", label: "Ledger" },
            { key: "value", label: "Value", format: "currency" },
            { key: "state", label: "State" },
          ],
          rows: [
            {
              ledger: "Recoverable leakage",
              value: 1_301_000,
              state: "System evidenced",
            },
            {
              ledger: "Avoided cost",
              value: 2_420_000,
              state: "Workflow required",
            },
          ],
          citationIds: ["c1"],
        },
        {
          artifact: "chart",
          id: "source-contract-ledger-value-chart",
          kind: "horizontal-bar",
          title: "Optimization Ledgers With Quantified Evidence",
          xKey: "ledger",
          yKey: "valueUsd",
          unit: "USD",
          builder: "inlineChart",
          data: {
            type: "horizontal-bar",
            xKey: "ledger",
            yKey: "valueUsd",
            unit: "USD",
            data: [
              { ledger: "Recoverable leakage", valueUsd: 1_301_000 },
              { ledger: "Avoided cost", valueUsd: 2_420_000 },
            ],
          },
          citationIds: ["c1"],
        },
        {
          artifact: "graph",
          id: "source-contract-evidence-relationship-graph",
          title: "Contract Evidence Relationship",
          nodes: [
            { id: "contract", label: "Selected contract", kind: "contract" },
            { id: "source", label: "AP / ERP", kind: "source system" },
            { id: "ledger", label: "Four ledgers", kind: "ledger" },
          ],
          edges: [
            { from: "source", to: "ledger", label: "feeds evidence" },
            { from: "contract", to: "ledger", label: "anchors values" },
          ],
          citationIds: ["c1"],
        },
      ],
      citations,
      gaps: [],
      caveats: [],
      nextSteps: [],
      quality: {
        confidence: "high",
        evidenceStrength: "strong",
        tenantGrounding: "complete",
        answerCompleteness: "complete",
      },
      safety: {
        tenantFencePassed: true,
        rawIdsSuppressed: true,
        forbiddenLanguagePassed: true,
        unsupportedClaimsBlocked: true,
      },
    };

    const { container } = render(<AgentAnswerRenderer answer={answer} />);

    expect(screen.getByText("Decision Table")).toBeInTheDocument();
    expect(
      screen.getByText("Four-ledger Contract Evidence"),
    ).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByText("Optimization Ledgers With Quantified Evidence"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(
        "[data-chart-renderer='recharts'][data-chart-kind='horizontal-bar']",
      ),
    ).not.toBeNull();
    expect(screen.getByText("Relationship View")).toBeInTheDocument();
    expect(
      screen.getByText("Contract Evidence Relationship"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Contract Evidence Relationship"),
    ).toBeInTheDocument();
  });

  it("renders attribution and sources without persona-pack controls when no typed exhibits are present", () => {
    const answer: AvaAnswerPacket = {
      surface: "intelligence",
      mode: "ANALYZE",
      tenantKey: "apex-retail",
      question: "What does this mean?",
      intent: "prose",
      status: "answered",
      directAnswer: "",
      factsUsed: [],
      metricsUsed: [],
      relationshipsUsed: [],
      artifacts: [],
      expertsUsed: [
        {
          id: "xp.retail.merchandising-pricing",
          name: "Retail Merchandising & Pricing Expert",
        },
      ],
      citations,
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
    };

    render(<AgentAnswerRenderer answer={answer} />);

    expect(screen.queryByText(/Consulted experts/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
    expect(screen.queryByText("F12 IT budget")).not.toBeInTheDocument();
    expect(
      screen.getByText("aVa did not return a renderable answer."),
    ).toBeInTheDocument();
  });

  it("does not render source-support tables as executive answer content", () => {
    const answer: AvaAnswerPacket = {
      surface: "intelligence",
      mode: "ANALYZE",
      tenantKey: "skyharbor",
      question: "What is the single best AI investment?",
      intent: "table",
      status: "answered",
      directAnswer:
        "Fund IROPS recovery automation, but only behind the operational-data readiness gate.",
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
            { key: "use", label: "How IT Supports The Answer" },
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
      citations,
      gaps: [],
      caveats: [],
      nextSteps: [],
      quality: {
        confidence: "high",
        evidenceStrength: "strong",
        tenantGrounding: "complete",
        answerCompleteness: "complete",
      },
      safety: {
        tenantFencePassed: true,
        rawIdsSuppressed: true,
        forbiddenLanguagePassed: true,
        unsupportedClaimsBlocked: true,
      },
    };

    render(<AgentAnswerRenderer answer={answer} />);

    expect(
      screen.getByText(/Fund IROPS recovery automation/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Decision Table")).not.toBeInTheDocument();
    expect(screen.queryByText("evidence")).not.toBeInTheDocument();
    expect(
      screen.queryByText("How IT Supports The Answer"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("tenant material")).not.toBeInTheDocument();
  });

  it("scrubs public prose and suppresses persona-pack controls", () => {
    const answer: AvaAnswerPacket = {
      surface: "intelligence",
      mode: "ANALYZE",
      tenantKey: "tenant-alpha",
      question:
        "Where is finance AI spend committed but value not yet realized?",
      intent: "table",
      status: "partial",
      directAnswer:
        "The supporting evidence is that 19 context dimensions loaded with 14,620 evidence points. That means The scale stage is not proven.",
      factsUsed: [],
      metricsUsed: [],
      relationshipsUsed: [],
      expertsUsed: [
        { id: "xp.finance.ai", name: "Finance AI Expert" },
        { id: "xp.erp.value", name: "ERP Value Expert" },
      ],
      artifacts: [],
      citations: [],
      gaps: [],
      caveats: [],
      nextSteps: [],
      quality: {
        confidence: "medium",
        evidenceStrength: "partial",
        tenantGrounding: "partial",
        answerCompleteness: "partial",
      },
      safety: {
        tenantFencePassed: true,
        rawIdsSuppressed: true,
        forbiddenLanguagePassed: true,
        unsupportedClaimsBlocked: true,
      },
    };

    const { container } = render(<AgentAnswerRenderer answer={answer} />);

    expect(screen.queryByText(/Consulted experts/i)).not.toBeInTheDocument();
    const visibleText = container.textContent ?? "";
    expect(visibleText).not.toMatch(
      /context dimensions|evidence points|source signals|That means The|The supporting evidence is that/i,
    );
    expect(visibleText).not.toMatch(/\bsupporting material\b/i);
    expect(visibleText).toContain("business areas");
    expect(visibleText).toContain("business signals");
  });

  it("preserves model-authored prose when the caller opts into output preservation", () => {
    const answer: AvaAnswerPacket = {
      surface: "intelligence",
      mode: "ANALYZE",
      tenantKey: "lakeshore-holdings",
      question: "What should the advisor say?",
      intent: "recommendation",
      status: "answered",
      directAnswer:
        "The supporting evidence is that 19 context dimensions loaded with 14,620 evidence points. Keep the exact advisory framing.",
      factsUsed: [],
      metricsUsed: [],
      relationshipsUsed: [],
      expertsUsed: [],
      artifacts: [],
      citations: [],
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
    };

    const { container } = render(
      <AgentAnswerRenderer answer={answer} preserveOutput />,
    );

    expect(container.textContent ?? "").toContain(
      "19 context dimensions loaded with 14,620 evidence points",
    );
    expect(container.textContent ?? "").toContain(
      "Keep the exact advisory framing.",
    );
  });

  it("removes numeric substrate counts from CXO-visible prose", () => {
    const answer: AvaAnswerPacket = {
      surface: "tower",
      mode: "ANALYZE",
      tenantKey: "meridian-health",
      question: "What should the CIO do next?",
      intent: "recommendation",
      status: "answered",
      directAnswer:
        "Tower is using 300 rows, 500 facts, 800 edges, and 42 nodes. The business issue is that AI value is still gated until usage and finance validation improve.",
      factsUsed: [],
      metricsUsed: [],
      relationshipsUsed: [],
      expertsUsed: [],
      artifacts: [],
      citations: [],
      gaps: [],
      caveats: [],
      nextSteps: [],
      quality: {
        confidence: "medium",
        evidenceStrength: "partial",
        tenantGrounding: "partial",
        answerCompleteness: "partial",
      },
      safety: {
        tenantFencePassed: true,
        rawIdsSuppressed: true,
        forbiddenLanguagePassed: true,
        unsupportedClaimsBlocked: true,
      },
    };

    const { container } = render(<AgentAnswerRenderer answer={answer} />);
    const visibleText = container.textContent ?? "";

    expect(visibleText).toContain(
      "The business issue is that AI value is still gated",
    );
    expect(visibleText).not.toMatch(
      /\b\d[\d,]*\s+(?:rows?|facts?|edges?|nodes?)\b/i,
    );
  });
});
