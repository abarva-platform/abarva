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
import type { AdminSetupControlResponse } from "@/lib/admin/setup-control";
import { buildHomeDataQualityModel } from "@/lib/home/home-data-quality";
import { buildHomeEnglishSummary } from "@/lib/home/home-english-summary";

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
      dimension: "Enterprise Profile",
      status: "LOADED",
      description: "Holding-company profile and basic business metadata",
      evidence: 1,
      sources: 1,
      trust: 82,
      flag: null,
    },
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
    "Enterprise Profile": {
      dimension: "Enterprise Profile",
      title: "Enterprise Profile",
      fileNames: ["V7_01_enterprise_profile.csv"],
      rowCount: 1,
      dataThinCells: 1,
      sourceCount: 1,
      columns: [
        { key: "client_display_name", label: "Enterprise" },
        { key: "industry_model", label: "Industry/model" },
        { key: "annual_revenue_usd", label: "Revenue" },
        { key: "employee_count", label: "Employees" },
      ],
      rows: [
        ["Lakeshore Holdings", "Industrial holdco", "7120000000", "11800"],
      ],
      sourceRows: [
        sourceRow(
          "V7_01_enterprise_profile.csv",
          2,
          "ENT-001",
          "Lakeshore Holdings",
          {
            Enterprise: "Lakeshore Holdings",
            "Industry/model": "Industrial holdco",
            Revenue: "7120000000",
            Employees: "11800",
          },
          ["Parent entity"],
        ),
      ],
      knownGaps: [{ label: "Parent entity", count: 1 }],
    },
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

const setupControl = {
  tenant: {
    tenantKey: "apexretail",
    displayName: "Retail Demo",
    coverName: "Retail Demo",
    mode: "setup",
    realOrSyntheticStatus: "demo_safe_synthetic",
  },
  activeTenantAccess: {
    activeVersionId: null,
    lastPromotedAt: null,
    source: "active tenant access layer version pointer is not wired in PR22",
    status: "unknown",
  },
  candidateTenantDataVersion: {
    candidateVersionId: null,
    status: "not-created",
    createdAt: null,
    promotionEnabled: false,
    promotionGateStatus: "blocked",
    operatorApprovalRequired: true,
    activeTenantAccessLayerUpdated: false,
  },
  uploadState: {
    uploadedFiles: 8,
    stagedFiles: 0,
    parsedFiles: 0,
    mappedFiles: 0,
    validatedFiles: 0,
    quarantinedRecords: 0,
    unmappedFields: 63,
  },
  evidenceRegistry: {
    evidenceSources: 8,
    evidenceItems: 240,
    evidenceGaps: 63,
  },
  canonicalFacts: {
    canonicalObjects: 512,
    canonicalAttributes: 2783,
    factVersions: 0,
  },
  relationshipGraph: {
    graphObjects: 320,
    graphRelationships: 700,
    unresolvedRelationships: 18,
  },
  derivedIntelligence: {
    derivedInsights: 0,
    answerabilityScores: 0,
    readinessScores: 12,
  },
  moduleReadiness: {
    home: {
      status: "partially-ready",
      candidatePreviewAvailable: false,
      runtimeActiveAvailable: false,
      missingEvidence: [
        "Module cite-render proof is not attached to setup-control yet.",
      ],
      lastProof: null,
    },
    intelligence: {
      status: "blocked",
      candidatePreviewAvailable: false,
      runtimeActiveAvailable: false,
      missingEvidence: [
        "Module cite-render proof is not attached to setup-control yet.",
      ],
      lastProof: null,
    },
    moves: {
      status: "blocked",
      candidatePreviewAvailable: false,
      runtimeActiveAvailable: false,
      missingEvidence: [
        "Module cite-render proof is not attached to setup-control yet.",
      ],
      lastProof: null,
    },
    source: {
      status: "blocked",
      candidatePreviewAvailable: false,
      runtimeActiveAvailable: false,
      missingEvidence: [
        "Module cite-render proof is not attached to setup-control yet.",
      ],
      lastProof: null,
    },
    tower: {
      status: "blocked",
      candidatePreviewAvailable: false,
      runtimeActiveAvailable: false,
      missingEvidence: [
        "Module cite-render proof is not attached to setup-control yet.",
      ],
      lastProof: null,
    },
  },
  promotionControl: {
    promotionEnabled: false,
    operatorApprovalRequired: true,
    rollbackPlanRequired: true,
    blockers: ["Promotion gate has not run."],
    lastGateRun: null,
  },
  guardrails: {
    productionTenantDataWritten: false,
    activeTenantAccessLayerUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    candidateReadByDefault: false,
    directActivePromotionBlocked: true,
  },
  legacyImportPaths: [],
  sourceOfTruth: {
    activeSource: "not yet wired to active tenant access layer",
    candidateSource: "not yet wired to candidate tenant data versions",
    readinessSource: "setup inventory snapshot plus source-document inventory",
    missingSources: [
      "candidate tenant data versions",
      "active tenant access layer version pointer",
    ],
    caveats: [
      "Uploaded/source files are not treated as active facts by setup-control.",
    ],
  },
} satisfies AdminSetupControlResponse;

const dataQuality = buildHomeDataQualityModel({
  repoRoot: process.cwd(),
  tenantKey: "apexretail",
  tenantDisplayName: "Retail Demo",
  browser: v6Browser,
  setupControl,
});

const previewDataQuality = buildHomeDataQualityModel({
  repoRoot: process.cwd(),
  tenantKey: "apexretail",
  tenantDisplayName: "Retail Demo",
  browser: v6Browser,
  setupControl,
  candidatePreviewEnabled: true,
});
const englishSummary = buildHomeEnglishSummary(dataQuality);

describe("HomeSurface — Explorer context browser", () => {
  it("renders Home as an executive briefing with hidden aVa", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        englishSummary={englishSummary}
        v6Browser={v6Browser}
      />,
    );

    expect(screen.getByTestId("home-executive-briefing")).toBeInTheDocument();
    expect(screen.getByTestId("home-context-explorer")).toBeInTheDocument();
    expect(screen.getByTestId("home-context-detail")).toBeInTheDocument();
    expect(screen.queryByTestId("agent-dock-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("home-ava-drawer")).not.toBeInTheDocument();
    expect(screen.getByText("Executive snapshot")).toBeInTheDocument();
    expect(screen.getByText("What you can do")).toBeInTheDocument();
    expect(screen.getByText("Explore this context")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Technical details · data quality, source coverage, relationships, diagnostics",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ask aVa/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Functions/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Applications & Systems/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Vendors & Contracts/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    expect(screen.getByTestId("home-ava-drawer")).toBeInTheDocument();
    expect(screen.getByText("I can answer")).toBeInTheDocument();
    expect(screen.getByText("I won’t answer")).toBeInTheDocument();
  });

  it("binds Home status panels to setup-control when supplied", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        dataQuality={dataQuality}
        payload={payload}
        setupControl={setupControl}
        v6Browser={v6Browser}
      />,
    );

    expect(screen.getByText("Demo-safe")).toBeInTheDocument();
    expect(screen.getByText("512")).toBeInTheDocument();
    expect(screen.getAllByText("Active Home context").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Candidate preview")).toBeInTheDocument();
    expect(screen.queryByText("Canonical Fact Store")).not.toBeInTheDocument();
  });

  it("renders Home data quality, coverage, and answerability without candidate facts by default", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        dataQuality={dataQuality}
        payload={payload}
        setupControl={setupControl}
        v6Browser={v6Browser}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Data Quality/i }));

    expect(screen.getByTestId("home-data-quality-panel")).toBeInTheDocument();
    expect(
      screen.getByText("What Home can trust right now"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Source Coverage").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Candidate Coverage").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Evidence Strength").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Relationship Coverage").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Active / Candidate Status")).toBeInTheDocument();
    expect(screen.getAllByText("Partial").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Candidate preview not active/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Default Home does not read candidate-only facts/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Candidate Preview — inactive data/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Canonical Fact Store")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Enterprise Relationship Graph"),
    ).not.toBeInTheDocument();
  });

  it("shows candidate preview only when explicitly enabled", () => {
    const { rerender } = render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        v6Browser={v6Browser}
      />,
    );

    expect(screen.queryByText(/Candidate Preview/)).not.toBeInTheDocument();

    rerender(
      <HomeSurface
        candidatePreviewEnabled
        clientKey="apexretail"
        dataQuality={previewDataQuality}
        payload={payload}
        setupControl={setupControl}
        v6Browser={v6Browser}
      />,
    );

    expect(
      screen.getByText(/Candidate Preview — inactive data/),
    ).toBeInTheDocument();
    expect(screen.getByText(/not active tenant truth/i)).toBeInTheDocument();
    expect(
      screen.getByText(/no inactive candidate tenant version is available/i),
    ).toBeInTheDocument();
  });

  it("selects a context area from the Explorer tree and defaults the detail view to Summary", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        v6Browser={v6Browser}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Vendors & Contracts/i }),
    );

    expect(
      screen.getByRole("heading", { name: "Vendors & Contracts", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Summary" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("What is loaded")).toBeInTheDocument();
    expect(screen.getByText("90 records")).toBeInTheDocument();
    expect(screen.getAllByText("12 fields").length).toBeGreaterThan(0);
    expect(screen.getByText(/Kyriba/)).toBeInTheDocument();
  });

  it("renders loaded rows as clean CXO-readable data without lineage clutter", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        v6Browser={v6Browser}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Vendors & Contracts/i }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Data" }));

    expect(screen.getByText("90 rows loaded")).toBeInTheDocument();
    expect(screen.getByText("Kyriba")).toBeInTheDocument();
    expect(screen.getByText("Treasury")).toBeInTheDocument();
    expect(screen.getAllByText("Needs evidence").length).toBeGreaterThan(0);
    expect(screen.queryByText("VND-001 - Kyriba")).not.toBeInTheDocument();
    expect(
      screen.queryByText("apex/vendors-contracts.csv"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("synthetic demo")).not.toBeInTheDocument();
  });

  it("resets to Summary when another Explorer node is selected", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        v6Browser={v6Browser}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Vendors & Contracts/i }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Data" }));
    expect(screen.getByRole("tab", { name: "Data" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Applications & Systems/i }),
    );
    expect(
      screen.getByRole("heading", { name: "Applications & Systems", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Summary" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("formats raw numeric preview cells for CXO readability", () => {
    const payloadWithBenefits = {
      ...payload,
      context: [
        ...payload.context,
        {
          dimension: "Benefits Realization",
          status: "LOADED",
          description: "Value and benefit evidence",
          evidence: 50,
          sources: 1,
          trust: 74,
          flag: null,
        },
      ],
    } as unknown as IntelligenceBindingPayload;
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payloadWithBenefits}
        v6Browser={v6Browser}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Metrics & Outcomes/i }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Data" }));

    expect(screen.getByText("$1M")).toBeInTheDocument();
    expect(screen.queryByText("1000000")).not.toBeInTheDocument();
  });

  it("renders Sources and Relationships as first-class selected-context views", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        v6Browser={v6Browser}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Vendors & Contracts/i }),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Sources" }));
    expect(screen.getByText("vendors contracts")).toBeInTheDocument();
    expect(screen.queryByText("07 vendors contracts")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Relationships" }));
    expect(screen.getByText("Kyriba")).toBeInTheDocument();
    expect(screen.getByText("Treasury")).toBeInTheDocument();
  });

  it("explains profile quality, gaps, and relationships in plain English", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        v6Browser={v6Browser}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Functions/i }));

    expect(screen.getByText("What is loaded")).toBeInTheDocument();
    expect(screen.getByText("1 records")).toBeInTheDocument();
    expect(screen.getByText("What needs work")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Data" }));
    expect(
      screen.getByText(/this is the loaded business data for Functions/i),
    ).toBeInTheDocument();
    expect(screen.getByText("$7.12B")).toBeInTheDocument();
    expect(screen.getByText("11,800")).toBeInTheDocument();
    expect(screen.queryByText("7120000000")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Gaps" }));
    expect(
      screen.getByText(/gaps are client-to-complete fields/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 field missing/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Sources" }));
    expect(
      screen.getByText(/sources show where this context came from/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Relationships" }));
    expect(
      screen.getByText(
        /relationships are mapped links between business objects/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/only a profile anchor/i)).toBeInTheDocument();
    expect(screen.queryByText("7120000000")).not.toBeInTheDocument();
    expect(screen.queryByText("11800")).not.toBeInTheDocument();
  });

  it("searches the Explorer tree", () => {
    render(
      <HomeSurface
        clientKey="apexretail"
        payload={payload}
        v6Browser={v6Browser}
      />,
    );

    fireEvent.change(screen.getByLabelText("Search context areas"), {
      target: { value: "vendor" },
    });

    expect(
      screen.getByRole("button", { name: /Vendors & Contracts/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Applications & Systems/i }),
    ).not.toBeInTheDocument();
  });
});
