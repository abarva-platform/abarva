/**
 * @jest-environment jsdom
 *
 * Home is a real React Context Explorer: HomeKnowAsk posts to the Home KNOW
 * endpoint and renders HomeKnowResponse only. No Intelligence ask path, no
 * experts, no static iframe, no fake `answerForAsk`, no single-tenant demo blob.
 */

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { HomeSurface } from "@/components/home/HomeSurface";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";

const payload = {
  tenant: {
    key: "apex-retail",
    displayName: "Apex Retail Group",
    industry: "retail",
  },
  ask: { placeholder: "", contract: "" },
  trustLine: {
    dimensionsLoaded: 8,
    evidencePoints: 17548,
    sources: 8,
    searchVerifiedPct: 97,
  },
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
      whenToApply:
        "Use when BOPIS and personalization depend on inventory accuracy.",
    },
  ],
} as unknown as IntelligenceBindingPayload;

describe("HomeSurface — real React Context Explorer", () => {
  it("renders the two-pane Home KNOW chat + Context Explorer canvas", () => {
    render(<HomeSurface clientKey="apexretail" payload={payload} />);
    expect(screen.getByLabelText("Ava Home KNOW chat")).toBeInTheDocument();
    expect(screen.getByLabelText("Ask Home KNOW")).toBeInTheDocument();
    expect(screen.queryByLabelText("Ask Ava")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Choose context dimension")).toBeInTheDocument();
    expect(screen.queryByLabelText("Lock chat left")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Lock chat right")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Lock chat top")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Lock chat bottom")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Context Explorer tabs")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Suggested Home KNOW questions"),
    ).not.toBeInTheDocument();
    // real per-tenant signal (not a fake row-dump)
    expect(
      screen.getByText(
        "Inventory truth is the gate before omnichannel AI scale.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/33 source points · 2 sources/),
    ).toBeInTheDocument();
    // rail lists the loaded context dimension; detail not shown yet
    expect(screen.getByText("1 context dimensions loaded")).toBeInTheDocument();
    expect(screen.queryByText("Loaded context · 8")).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /IT systems landscape/ })).toBeInTheDocument();
    expect(
      screen.queryByText("Applications, integrations, systems of record"),
    ).not.toBeInTheDocument();
  });

  it("opens a loaded dimension's detail from the rail", () => {
    render(<HomeSurface clientKey="apexretail" payload={payload} />);
    fireEvent.change(screen.getByLabelText("Choose context dimension"), {
      target: { value: "IT systems landscape" },
    });
    expect(
      screen.getByText("Applications, integrations, systems of record"),
    ).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
  });
});
