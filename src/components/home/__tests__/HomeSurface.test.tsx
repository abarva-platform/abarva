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
      headline: "SHOULD NOT RENDER LEGACY SIGNAL",
      body: "This legacy V4-derived card should not be visible on Home.",
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

function sourceRow(
  v6File: string,
  rowNumber: number,
  rowId: string,
  label: string,
  values: Record<string, string>,
  knownGaps: string[] = ["Owner"],
) {
  return {
    v6File,
    rowNumber,
    rowId,
    label,
    values,
    knownGaps,
  };
}

const v6Browser = {
  tenantKey: "apexretail",
  displayName: "Retail Demo",
  datasetDir: "apex-retail-synthetic-v6",
  generatedAt: "2026-06-28T00:00:00.000Z",
  dimensions: {
    "Applications & Core Systems": {
      dimension: "Applications & Core Systems",
      title: "Application and system inventory",
      fileNames: ["V6_05_applications_systems.csv"],
      rowCount: 90,
      dataThinCells: 8,
      sourceCount: 1,
      columns: [
        { key: "system_name", label: "System" },
        { key: "business_capability", label: "Capability" },
        { key: "system_owner", label: "Owner" },
        { key: "criticality", label: "Criticality" },
      ],
      rows: [["ERP Core", "Finance", "VP ERP", "Tier 1"]],
      sourceRows: [
        sourceRow("V6_05_applications_systems.csv", 2, "APP-001", "ERP Core", {
          System: "ERP Core",
          Capability: "Finance",
          Owner: "VP ERP",
          Criticality: "Tier 1",
        }),
      ],
      knownGaps: [{ label: "Lifecycle", count: 8 }],
    },
    "Data & Analytics Estate": {
      dimension: "Data & Analytics Estate",
      title: "Data assets and analytics coverage",
      fileNames: ["V6_06_data_assets_integrations.csv"],
      rowCount: 120,
      dataThinCells: 10,
      sourceCount: 1,
      columns: [
        { key: "data_asset_name", label: "Data asset" },
        { key: "data_owner", label: "Owner" },
        { key: "system_of_record", label: "System of record" },
        { key: "governance_status", label: "Governance" },
      ],
      rows: [["Finance mart", "CDO", "ERP Core", "Defined"]],
      sourceRows: [
        sourceRow(
          "V6_06_data_assets_integrations.csv",
          2,
          "DATA-001",
          "Finance mart",
          {
            "Data asset": "Finance mart",
            Owner: "CDO",
            "System of record": "ERP Core",
            Governance: "Defined",
          },
        ),
      ],
      knownGaps: [{ label: "Lineage", count: 10 }],
    },
    "Risk & RAID Log": {
      dimension: "Risk & RAID Log",
      title: "Risks and constraints",
      fileNames: ["V6_11_operations_risk_controls.csv"],
      rowCount: 60,
      dataThinCells: 6,
      sourceCount: 1,
      columns: [
        { key: "process", label: "Risk/control area" },
        { key: "severity", label: "Severity" },
        { key: "status", label: "Status" },
        { key: "business_impact", label: "Business impact" },
      ],
      rows: [["ERP data quality", "High", "Open", "Value proof blocked"]],
      sourceRows: [
        sourceRow(
          "V6_11_operations_risk_controls.csv",
          2,
          "RISK-001",
          "ERP data quality",
          {
            "Risk/control area": "ERP data quality",
            Severity: "High",
            Status: "Open",
            "Business impact": "Value proof blocked",
          },
        ),
      ],
      knownGaps: [{ label: "Mitigation", count: 6 }],
    },
    "Vendors & Contracts": {
      dimension: "Vendors & Contracts",
      title: "Vendors and contracts",
      fileNames: ["V6_07_vendors_contracts.csv"],
      rowCount: 90,
      dataThinCells: 12,
      sourceCount: 1,
      columns: [
        { key: "__loaded_record", label: "Loaded record" },
        { key: "__source_family", label: "Source family" },
        { key: "__source_basis", label: "Basis" },
        { key: "vendor_name", label: "Vendor" },
        { key: "service", label: "Service" },
        { key: "renewal_date", label: "Renewal" },
        { key: "contract_risk", label: "Risk/gap" },
      ],
      rows: [
        [
          "VND-001 - Kyriba",
          "apex/vendors-contracts.csv",
          "synthetic demo",
          "Kyriba",
          "Treasury",
          "2026-07-06",
          "Needs evidence",
        ],
      ],
      sourceRows: [
        sourceRow("V6_07_vendors_contracts.csv", 2, "VND-001", "Kyriba", {
          "Loaded record": "VND-001 - Kyriba",
          "Source family": "apex/vendors-contracts.csv",
          Basis: "synthetic demo",
          Vendor: "Kyriba",
          Service: "Treasury",
          Renewal: "2026-07-06",
          "Risk/gap": "Needs evidence",
        }),
      ],
      knownGaps: [{ label: "Contract Risk", count: 12 }],
    },
    "AI & Automation Footprint": {
      dimension: "AI & Automation Footprint",
      title: "AI initiatives and automation footprint",
      fileNames: ["V6_10_ai_initiatives.csv"],
      rowCount: 40,
      dataThinCells: 4,
      sourceCount: 1,
      columns: [
        { key: "use_case", label: "Use case" },
        { key: "tool_or_model", label: "Tool/model" },
        { key: "active_users", label: "Active users" },
        { key: "data_readiness", label: "Data readiness" },
      ],
      rows: [["Close automation", "Copilot", "300", "Partial"]],
      sourceRows: [
        sourceRow("V6_10_ai_initiatives.csv", 2, "AI-001", "Close automation", {
          "Use case": "Close automation",
          "Tool/model": "Copilot",
          "Active users": "300",
          "Data readiness": "Partial",
        }),
      ],
      knownGaps: [{ label: "Adoption", count: 4 }],
    },
    "Benefits Realization": {
      dimension: "Benefits Realization",
      title: "Value and benefit evidence",
      fileNames: ["V6_08_spend_value.csv"],
      rowCount: 50,
      dataThinCells: 7,
      sourceCount: 1,
      columns: [
        { key: "record_name", label: "Value record" },
        { key: "amount_usd", label: "Amount" },
        { key: "amount_type", label: "Amount type" },
        { key: "unit_economics", label: "Unit economics" },
      ],
      rows: [["Run-rate savings", "1000000", "Target", "Per month"]],
      sourceRows: [
        sourceRow("V6_08_spend_value.csv", 2, "VAL-001", "Run-rate savings", {
          "Value record": "Run-rate savings",
          Amount: "1,000,000",
          "Amount type": "Target",
          "Unit economics": "Per month",
        }),
      ],
      knownGaps: [{ label: "Finance validation", count: 7 }],
    },
    "Initiatives & Roadmap": {
      dimension: "Initiatives & Roadmap",
      title: "Programs and initiatives",
      fileNames: ["V6_09_programs_initiatives.csv"],
      rowCount: 55,
      dataThinCells: 5,
      sourceCount: 1,
      columns: [
        { key: "record_name", label: "Program" },
        { key: "phase", label: "Phase" },
        { key: "status", label: "Status" },
        { key: "decision_needed", label: "Decision needed" },
      ],
      rows: [["ERP cleanup", "Plan", "Open", "Sequence"]],
      sourceRows: [
        sourceRow(
          "V6_09_programs_initiatives.csv",
          2,
          "PRG-001",
          "ERP cleanup",
          {
            Program: "ERP cleanup",
            Phase: "Plan",
            Status: "Open",
            "Decision needed": "Sequence",
          },
        ),
      ],
      knownGaps: [{ label: "Dependency", count: 5 }],
    },
  },
} satisfies HomeV6ContextBrowser;

describe("HomeSurface — real React Context Explorer", () => {
  it("renders the shared aVa dock + Context Explorer canvas", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        v6Browser={v6Browser}
      />,
    );
    expect(screen.getByTestId("agent-dock-panel")).toBeInTheDocument();
    expect(screen.getByTestId("agent-dock-input")).toBeInTheDocument();
    expect(screen.getByLabelText("Ask aVa")).toBeInTheDocument();
    expect(screen.getByLabelText("Dock mode")).toBeInTheDocument();
    expect(screen.queryByLabelText("Ask Home KNOW")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Ava Home KNOW chat"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Choose context dimension"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Lock chat to left")).toBeInTheDocument();
    expect(screen.getByLabelText("Lock chat to right")).toBeInTheDocument();
    expect(screen.getByLabelText("Lock chat to top")).toBeInTheDocument();
    expect(screen.getByLabelText("Lock chat to bottom")).toBeInTheDocument();
    expect(screen.getByLabelText("Expand to overlay")).toBeInTheDocument();
    expect(screen.getByLabelText("Context Explorer tabs")).toBeInTheDocument();
    expect(screen.getByLabelText("Suggested actions")).toBeInTheDocument();
    expect(
      screen.getByText("What context is loaded, and what can we trust?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Which areas are strongest, and which are thin?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Show the systems, data, vendors, and risks as tables."),
    ).toBeInTheDocument();
    // V6-backed context findings replace the legacy Intelligence signal cards.
    expect(screen.getByText("Context findings")).toBeInTheDocument();
    expect(screen.getByText("4 V6 findings")).toBeInTheDocument();
    expect(
      screen.getByText("System and data readiness are the main context gate."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Why this appears")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/V6 rows ·/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Needs evidence:/).length).toBeGreaterThan(0);
    expect(
      screen.queryByText("SHOULD NOT RENDER LEGACY SIGNAL"),
    ).not.toBeInTheDocument();
    // rail lists the loaded context dimension; detail not shown yet
    expect(screen.getByText("2 context areas loaded")).toBeInTheDocument();
    expect(screen.queryByText("Business areas · 8")).not.toBeInTheDocument();
    expect(screen.getByText("Context areas")).toBeInTheDocument();
    expect(screen.getByText("V6 records")).toBeInTheDocument();
    expect(screen.queryByText("Evidence points")).not.toBeInTheDocument();
    expect(screen.queryByText(/Lens:/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /IT systems landscape/ }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("option", { name: /\d+ rows? · \d+ evidence gaps?/ })
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Applications, integrations, systems of record"),
    ).not.toBeInTheDocument();
  });

  it("opens a loaded dimension's detail from the rail", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        v6Browser={v6Browser}
      />,
    );
    fireEvent.change(screen.getByLabelText("Choose context dimension"), {
      target: { value: "IT systems landscape" },
    });
    expect(
      screen.getByText("Applications, integrations, systems of record"),
    ).toBeInTheDocument();
    expect(screen.getByText("Answerability")).toBeInTheDocument();
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
    expect(screen.getByText("V6 source preview")).toBeInTheDocument();
    expect(screen.getByText("Evidence gaps")).toBeInTheDocument();
    expect(
      screen.getByText(/Evidence gaps are fields explicitly marked/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Loaded source rows with their V6 lineage and available fields.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("rows")).toBeInTheDocument();
    expect(screen.getByText("VND-001 - Kyriba")).toBeInTheDocument();
    expect(screen.getByText("apex/vendors-contracts.csv")).toBeInTheDocument();
    expect(screen.getByText("synthetic demo")).toBeInTheDocument();
    expect(screen.getByText("Kyriba")).toBeInTheDocument();
    expect(screen.getByText("Treasury")).toBeInTheDocument();
    expect(screen.getByText("Needs evidence")).toBeInTheDocument();
    expect(screen.getByText("V6_07_vendors_contracts.csv")).toBeInTheDocument();
  });
});
