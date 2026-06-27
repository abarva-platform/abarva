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
    expect(screen.getByText("costStack")).toBeInTheDocument();
    expect(
      container.querySelector("[data-chart-builder='costStack'] svg"),
    ).not.toBeNull();
    expect(screen.getByText("F12 IT budget")).toBeInTheDocument();
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
    expect(within(tableNode).getByText("$1,200,000")).toBeInTheDocument();
    expect(within(tableNode).getByText("42%")).toBeInTheDocument();
    expect(
      screen.getByText("Includes run-cost categories only."),
    ).toBeInTheDocument();
    expect(screen.getByText("F12 IT budget")).toBeInTheDocument();
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
      },
      safety: {
        tenantFencePassed: true,
        rawIdsSuppressed: true,
        forbiddenLanguagePassed: true,
        unsupportedClaimsBlocked: true,
      },
    };

    render(<AgentAnswerRenderer answer={answer} />);

    expect(screen.getByText("Graphs")).toBeInTheDocument();
    expect(screen.getByText("Dependency graph")).toBeInTheDocument();
    expect(screen.getByText("2 nodes · 1 links")).toBeInTheDocument();
    expect(screen.getByLabelText("Dependency graph")).toBeInTheDocument();
    expect(screen.queryByText("F12 IT budget")).not.toBeInTheDocument();
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
    expect(screen.queryByText("Tables")).not.toBeInTheDocument();
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
      tenantKey: "lakeshore-holdings",
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
      /context dimensions|evidence points|That means The|The supporting evidence is that/i,
    );
    expect(visibleText).not.toMatch(/\bsupporting material\b/i);
    expect(visibleText).toContain("business areas");
    expect(visibleText).toContain("source signals");
  });
});
