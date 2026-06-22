/**
 * @jest-environment jsdom
 *
 * Home is a real React Context Explorer: the canonical AvaAsk (shared engine +
 * AgentAnswerRenderer) plus a per-tenant explorer rendered from the binding —
 * loaded dimensions (rail), signals, corpus. No static iframe, no fake
 * `answerForAsk`, no single-tenant demo blob.
 */

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { HomeSurface } from "@/components/home/HomeSurface";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";

jest.mock("@/lib/agent/markdownRenderer", () => ({
  AgentMarkdown: ({ text }: { text: string }) => <div>{text}</div>,
}));

const payload = {
  tenant: { key: "apex-retail", displayName: "Apex Retail Group", industry: "retail" },
  ask: { placeholder: "", contract: "" },
  trustLine: { dimensionsLoaded: 8, evidencePoints: 17548, sources: 8, searchVerifiedPct: 97 },
  suggestedQuestions: [],
  signals: [
    {
      id: "s1",
      domains: ["AI INITIATIVES", "DATA QUALITY"],
      crossDomain: true,
      headline: "Inventory truth is the gate before omnichannel AI scale.",
      body: "BOPIS, ship-from-store, and substitution depend on item-location accuracy.",
      confidence: "HIGH CONFIDENCE",
      evidencePoints: 33,
      sources: 2,
      evidenceRefs: [],
      move: null,
    },
  ],
  context: [
    {
      dimension: "IT systems landscape",
      status: "LOADED",
      description: "Applications, integrations, systems of record",
      evidence: 1662,
      sources: 3,
      trust: 82,
      flag: null,
    },
  ],
  corpus: [
    {
      patternName: "Omnichannel inventory truth before AI scale",
      domain: "retail_operations",
      whenToApply: "Use when BOPIS and personalization depend on inventory accuracy.",
    },
  ],
} as unknown as IntelligenceBindingPayload;

describe("HomeSurface — real React Context Explorer", () => {
  it("renders the overview: canonical ask + real signals + the loaded-dimension rail", () => {
    render(<HomeSurface payload={payload} surfaceContext={{ activeTab: "home" }} />);
    expect(screen.getByText("Ask anything about your enterprise.")).toBeInTheDocument();
    expect(screen.getByLabelText("Ask Ava")).toBeInTheDocument();
    // real per-tenant signal (not a fake row-dump)
    expect(
      screen.getByText("Inventory truth is the gate before omnichannel AI scale."),
    ).toBeInTheDocument();
    expect(screen.getByText(/33 evidence points · 2 sources/)).toBeInTheDocument();
    // rail lists the loaded context dimension; detail not shown yet
    expect(screen.getByText("IT systems landscape")).toBeInTheDocument();
    expect(
      screen.queryByText("Applications, integrations, systems of record"),
    ).not.toBeInTheDocument();
  });

  it("opens a loaded dimension's detail from the rail", () => {
    render(<HomeSurface payload={payload} surfaceContext={{ activeTab: "home" }} />);
    fireEvent.click(screen.getByText("IT systems landscape"));
    expect(
      screen.getByText("Applications, integrations, systems of record"),
    ).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
  });
});
