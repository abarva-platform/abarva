/**
 * @jest-environment jsdom
 *
 * Home is a real React Context Explorer behind the shared aVa chat shell.
 * The surface must not fall back to the old top ask band, static iframe,
 * fake `answerForAsk`, or single-tenant demo blob.
 */

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { HomeSurface } from "@/components/home/HomeSurface";
import type { IntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";
import type { HomeV6ContextBrowser } from "@/lib/home/v6-context-browser";

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
    {
      dimension: "Vendors & Contracts",
      status: "LOADED",
      description:
        "The vendor base, renewal calendar, and commercial concentration.",
      evidence: 2487,
      sources: 4,
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

const v6Browser = {
  tenantKey: "apexretail",
  displayName: "Apex Retail Group",
  datasetDir: "apex-retail-synthetic-v6",
  generatedAt: "2026-06-28T00:00:00.000Z",
  dimensions: {
    "Vendors & Contracts": {
      dimension: "Vendors & Contracts",
      title: "Vendors and contracts",
      fileNames: ["V6_07_vendors_contracts.csv"],
      rowCount: 90,
      dataThinCells: 12,
      sourceCount: 1,
      columns: [
        { key: "vendor_name", label: "Vendor" },
        { key: "service", label: "Service" },
        { key: "renewal_date", label: "Renewal" },
        { key: "contract_risk", label: "Risk/gap" },
      ],
      rows: [["Kyriba", "Treasury", "2026-07-06", "Missing: contract risk"]],
      knownGaps: [{ label: "Contract Risk", count: 12 }],
    },
  },
} satisfies HomeV6ContextBrowser;

describe("HomeSurface — real React Context Explorer", () => {
  it("renders the shared aVa dock + Context Explorer canvas", () => {
    render(<HomeSurface clientKey="apexretail" payload={payload} />);
    expect(screen.getByTestId("agent-dock-panel")).toBeInTheDocument();
    expect(screen.getByTestId("agent-dock-input")).toBeInTheDocument();
    expect(screen.getByLabelText("Ask aVa")).toBeInTheDocument();
    expect(screen.getByLabelText("Dock mode")).toBeInTheDocument();
    expect(screen.queryByLabelText("Ask Home KNOW")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ava Home KNOW chat")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Choose context dimension")).toBeInTheDocument();
    expect(screen.getByLabelText("Lock chat to left")).toBeInTheDocument();
    expect(screen.getByLabelText("Lock chat to right")).toBeInTheDocument();
    expect(screen.getByLabelText("Lock chat to top")).toBeInTheDocument();
    expect(screen.getByLabelText("Lock chat to bottom")).toBeInTheDocument();
    expect(screen.getByLabelText("Expand to overlay")).toBeInTheDocument();
    expect(screen.getByLabelText("Context Explorer tabs")).toBeInTheDocument();
    expect(screen.getByLabelText("Suggested actions")).toBeInTheDocument();
    // real per-tenant signal (not a fake row-dump)
    expect(
      screen.getByText(
        "Inventory truth is the gate before omnichannel AI scale.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/33 evidence points · 2 sources/),
    ).toBeInTheDocument();
    // rail lists the loaded context dimension; detail not shown yet
    expect(screen.getByText("2 context areas loaded")).toBeInTheDocument();
    expect(screen.queryByText("Business areas · 8")).not.toBeInTheDocument();
    expect(screen.getByText("Context areas")).toBeInTheDocument();
    expect(screen.getByText("Evidence points")).toBeInTheDocument();
    expect(screen.getByText("Lens: AI Initiatives · Data Quality · Spans multiple areas")).toBeInTheDocument();
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

  it("explains what vendor and contract context means in browse mode", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        v6Browser={v6Browser}
      />,
    );
    fireEvent.change(screen.getByLabelText("Choose context dimension"), {
      target: { value: "Vendors & Contracts" },
    });

    expect(screen.getByText("What is loaded here")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Vendor roster, contract and renewal evidence, commercial concentration, sourcing relevance, and missing contract fields.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("How to browse it")).toBeInTheDocument();
    expect(
      screen.getByText("Which renewals or vendors need attention?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Detail types available")).toBeInTheDocument();
    expect(
      screen.getByText("Loaded vendor and contract coverage"),
    ).toBeInTheDocument();
    expect(screen.getByText(/evidence points are loaded/)).toBeInTheDocument();
    expect(screen.getByText("Vendors and contracts")).toBeInTheDocument();
    expect(screen.getByText("Kyriba")).toBeInTheDocument();
    expect(screen.getByText("Treasury")).toBeInTheDocument();
    expect(screen.getByText("V6_07_vendors_contracts.csv")).toBeInTheDocument();
  });
});
