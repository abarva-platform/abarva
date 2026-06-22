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
  AgentAnswer,
  AnswerChart,
  AnswerCitation,
  AnswerTable,
} from "@/lib/intelligence/answer/agent-answer";

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

    const { container } = render(<AnswerChartRenderer chart={chart} citations={citations} />);
    expect(screen.getByText("Run/change cost mix")).toBeInTheDocument();
    expect(screen.getByText("costStack")).toBeInTheDocument();
    expect(container.querySelector("[data-chart-builder='costStack'] svg")).not.toBeNull();
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
    expect(screen.getByText("Includes run-cost categories only.")).toBeInTheDocument();
    expect(screen.getByText("F12 IT budget")).toBeInTheDocument();
  });

  it("renders attribution and sources without fallback when no typed exhibits are present", () => {
    const answer: AgentAnswer = {
      engineVersion: "agent-answer/v1",
      surface: "intelligence",
      expertId: "xp.retail.merchandising-pricing",
      contributingExperts: [
        {
          id: "xp.retail.merchandising-pricing",
          name: "Retail Merchandising & Pricing Expert",
        },
      ],
      prose: "",
      tables: [],
      charts: [],
      graphs: [],
      citations,
      gaps: [],
      recommendedActions: [],
      groundingMode: "mixed",
      confidence: "medium",
      limits: [],
      crossTenantBlocked: false,
    };

    render(<AgentAnswerRenderer answer={answer} />);

    expect(
      screen.getByText("Retail Merchandising & Pricing Expert"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.getByText("F12 IT budget")).toBeInTheDocument();
    expect(
      screen.queryByText("Ava did not return a renderable answer."),
    ).not.toBeInTheDocument();
  });
});
