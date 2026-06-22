/**
 * @jest-environment jsdom
 *
 * Home is now a real React surface: the canonical AvaAsk (shared engine +
 * AgentAnswerRenderer) plus context cards from the same binding the Intelligence
 * surface uses. No static iframe, no fake `answerForAsk`.
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { HomeSurface } from "@/components/home/HomeSurface";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";

jest.mock("@/lib/agent/markdownRenderer", () => ({
  AgentMarkdown: ({ text }: { text: string }) => <div>{text}</div>,
}));

const payload = {
  tenant: { key: "apex-retail", displayName: "Apex Retail Group", industry: "retail" },
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
} as unknown as IntelligenceBindingPayload;

describe("HomeSurface", () => {
  it("renders the canonical ask + real context cards", () => {
    render(<HomeSurface payload={payload} surfaceContext={{ activeTab: "home" }} />);
    expect(screen.getByText("Ask anything about your enterprise.")).toBeInTheDocument();
    // the canonical AvaAsk input is present (its aria-label)
    expect(screen.getByLabelText("Ask Ava")).toBeInTheDocument();
    // real context from the binding, not a fake row-dump
    expect(
      screen.getByText("Inventory truth is the gate before omnichannel AI scale."),
    ).toBeInTheDocument();
    expect(screen.getByText(/33 evidence points · 2 sources/)).toBeInTheDocument();
  });
});
