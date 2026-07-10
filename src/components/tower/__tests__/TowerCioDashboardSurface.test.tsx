/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { TOWER_CIO_STARTER_QUESTIONS, TowerIndexPage } from "../TowerIndexPage";
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from "@/lib/admin/ai-initiatives/queries";
import {
  toCioTowerMetricPacket,
  type CioTowerMetricPacket,
} from "@/lib/cio-tower/metric-packet";
import type { CioTowerCxoViewModel } from "@/lib/cio-tower/cxo-view-model";
import type { TowerBudgetRollup } from "@/lib/tower/tower-budget-rollups";

let query = new URLSearchParams();
const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => query,
  usePathname: () => "/tower",
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      fullName: "Anand Sundaram",
      publicMetadata: { role: "admin" },
      primaryEmailAddress: { emailAddress: "anand@abarva.ai" },
      emailAddresses: [{ emailAddress: "anand@abarva.ai" }],
    },
  }),
}));

jest.mock("@/lib/auth/use-sign-out", () => ({
  useSignOut: () => jest.fn(),
}));

const INITIATIVES: AIInitiative[] = [
  {
    initiativeId: "init-cloud",
    displayId: "LH-IT-001",
    name: "AI Platform Foundation",
    description: "Enterprise AI platform and model operations foundation.",
    primaryCategoryId: "platform",
    primaryCategoryName: "AI platform",
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: "goal-run",
    primaryGoalName: "Run resilience",
    stage: "scaled",
    stageDetail: null,
    ownerName: "VP Infrastructure",
    ownerTitle: "Portfolio owner",
    ownerFunction: "Infrastructure",
    committedAnnualUsd: 174_800_000,
    committedTotalUsd: 174_800_000,
    measuredValueUsd: null,
    statusFlag: "healthy",
    statusSummary: "On track",
    confidenceLevel: "HIGH",
    alignedCallout: false,
    alignedRationale: null,
    loadedViaTemplate: "v4",
  },
  {
    initiativeId: "init-servicenow",
    displayId: "LH-IT-002",
    name: "ServiceNow AI Service Desk",
    description: "Vendor AI agent for ITSM deflection.",
    primaryCategoryId: "agent",
    primaryCategoryName: "AI & Automation",
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: "goal-change",
    primaryGoalName: "AI value realization",
    stage: "pilot",
    stageDetail: null,
    ownerName: "CIO delegate",
    ownerTitle: "Program owner",
    ownerFunction: "Enterprise Apps",
    committedAnnualUsd: 57_100_000,
    committedTotalUsd: 57_100_000,
    measuredValueUsd: 12_400_000,
    statusFlag: "value_lag",
    statusSummary: "Measured value trails plan",
    confidenceLevel: "MED",
    alignedCallout: true,
    alignedRationale: null,
    loadedViaTemplate: "v4",
  },
  {
    initiativeId: "init-workday",
    displayId: "LH-IT-003",
    name: "Workday Finance Modernization",
    description: "Back office platform transformation.",
    primaryCategoryId: "business",
    primaryCategoryName: "Finance & Run Cost",
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: "goal-change",
    primaryGoalName: "Change portfolio",
    stage: "multi_year_strategic_bet",
    stageDetail: null,
    ownerName: "Finance systems lead",
    ownerTitle: "Platform owner",
    ownerFunction: "Finance",
    committedAnnualUsd: 92_000_000,
    committedTotalUsd: 92_000_000,
    measuredValueUsd: null,
    statusFlag: "adoption_gap",
    statusSummary: "Adoption evidence missing",
    confidenceLevel: "LOW",
    alignedCallout: false,
    alignedRationale: null,
    loadedViaTemplate: "v4",
  },
];

const VENDORS: AIInitiativeVendorRow[] = [
  {
    vendorId: "vendor-cisco",
    initiativeId: "init-cloud",
    initiativeDisplayId: "LH-IT-001",
    initiativeName: "Cloud and Infrastructure",
    vendorName: "Cisco",
    contractValueUsd: 41_000_000,
    renewalDate: "2026-08-30",
    financialHealth: "strong",
  },
  {
    vendorId: "vendor-servicenow",
    initiativeId: "init-servicenow",
    initiativeDisplayId: "LH-IT-002",
    initiativeName: "ServiceNow AI Service Desk",
    vendorName: "ServiceNow",
    contractValueUsd: 26_000_000,
    renewalDate: "2026-07-15",
    financialHealth: "watch",
  },
];

const BUDGET_ROLLUPS: TowerBudgetRollup[] = [
  {
    portfolioCompany: "Lakeshore Shared Services",
    fiscalYear: "FY2026",
    totalItBudgetUsd: 180_000_000,
    actualSpendYtdUsd: 72_000_000,
    forecastSpendUsd: 182_000_000,
    opexAmountUsd: 110_000_000,
    capexAmountUsd: 70_000_000,
    runAmountUsd: 104_000_000,
    changeAmountUsd: 76_000_000,
    vendorAmountUsd: 58_000_000,
    laborAmountUsd: 52_000_000,
    revenueUsd: 4_800_000_000,
    employees: 14_000,
    itSpendAsPctRevenue: 0.0375,
  },
  {
    portfolioCompany: "Northline Logistics Group",
    fiscalYear: "FY2026",
    totalItBudgetUsd: 144_800_000,
    actualSpendYtdUsd: 57_000_000,
    forecastSpendUsd: 146_000_000,
    opexAmountUsd: 82_000_000,
    capexAmountUsd: 62_800_000,
    runAmountUsd: 91_000_000,
    changeAmountUsd: 53_800_000,
    vendorAmountUsd: 43_000_000,
    laborAmountUsd: 39_000_000,
    revenueUsd: 3_900_000_000,
    employees: 9_100,
    itSpendAsPctRevenue: 0.0371,
  },
];

const GOVERNED_METRIC_PACKETS: CioTowerMetricPacket[] = [
  toCioTowerMetricPacket({
    measure_key: "total_it_budget_fy26",
    label: "FY26 IT budget",
    description: "Committed FY26 IT budget envelope.",
    period: "fy26",
    basis: "committed",
    scope: "enterprise_envelope",
    value_numeric: 877_900_000,
    value_json: { row_count: 5 },
    source_fact_keys: ["fact-budget-1"],
    formula_version: "cio_tower_v1",
  }),
  toCioTowerMetricPacket({
    measure_key: "run_budget_fy26",
    label: "FY26 run budget",
    description: "Run budget.",
    period: "fy26",
    basis: "committed",
    scope: "enterprise_envelope",
    value_numeric: 604_000_000,
    value_json: { row_count: 5 },
    source_fact_keys: ["fact-run-1"],
    formula_version: "cio_tower_v1",
  }),
  toCioTowerMetricPacket({
    measure_key: "change_budget_fy26",
    label: "FY26 change budget",
    description: "Change budget.",
    period: "fy26",
    basis: "committed",
    scope: "enterprise_envelope",
    value_numeric: 273_900_000,
    value_json: { row_count: 5 },
    source_fact_keys: ["fact-change-1"],
    formula_version: "cio_tower_v1",
  }),
  toCioTowerMetricPacket({
    measure_key: "initiative_budget_fy26",
    label: "Initiative budget",
    description: "Committed FY26 initiative budget.",
    period: "fy26",
    basis: "committed",
    scope: "initiative_portfolio",
    value_numeric: 76_400_000,
    value_json: { row_count: 3 },
    source_fact_keys: ["fact-initiative-1"],
    formula_version: "cio_tower_v1",
  }),
  toCioTowerMetricPacket({
    measure_key: "measured_value_ytd",
    label: "Measured value",
    description: "Finance-attested measured value.",
    period: "fy26",
    basis: "measured",
    scope: "initiative_portfolio",
    value_numeric: 91_700_000,
    value_json: { row_count: 2 },
    source_fact_keys: ["fact-value-1"],
    formula_version: "cio_tower_v1",
  }),
];

const ZERO_AMOUNT_INITIATIVES: AIInitiative[] = INITIATIVES.map(
  (initiative) => ({
    ...initiative,
    committedAnnualUsd: 0,
    committedTotalUsd: 0,
    measuredValueUsd: null,
  }),
);

const ZERO_AMOUNT_VENDORS: AIInitiativeVendorRow[] = VENDORS.map((vendor) => ({
  ...vendor,
  contractValueUsd: 0,
}));

const GOVERNED_CXO_VIEW: CioTowerCxoViewModel = {
  tenantKey: "skyharbor-air",
  tenantName: "Airline Demo",
  generatedFrom: "cio_tower",
  headline:
    "Airline Demo has $2.6B of FY26 technology budget in view. The executive question is how much of that spend is turning into measurable value.",
  sections: [],
  cards: [
    {
      measureKey: "total_it_budget_fy26",
      label: "FY26 IT budget",
      section: "value_command_center",
      valueNumeric: 2_578_000_000,
      displayValue: "$2.6B",
      period: "fy26",
      basis: "committed",
      scope: "enterprise_envelope",
      formulaVersion: "cio_tower_v1",
      sourceFactKeys: ["fact-budget"],
      evidence: [],
      gap: null,
    },
    {
      measureKey: "initiative_budget_fy26",
      label: "Initiative budget",
      section: "portfolio_control",
      valueNumeric: 28_300_000,
      displayValue: "$28.3M",
      period: "fy26",
      basis: "committed",
      scope: "initiative_portfolio",
      formulaVersion: "cio_tower_v1",
      sourceFactKeys: ["fact-initiative"],
      evidence: [],
      gap: null,
    },
    {
      measureKey: "promised_value_fy26",
      label: "Promised value",
      section: "value_command_center",
      valueNumeric: 270_000_000,
      displayValue: "$270.0M",
      period: "fy26",
      basis: "forecast",
      scope: "initiative_portfolio",
      formulaVersion: "cio_tower_v1",
      sourceFactKeys: ["fact-promised"],
      evidence: [],
      gap: null,
    },
    {
      measureKey: "measured_value_ytd",
      label: "Measured value",
      section: "value_command_center",
      valueNumeric: 91_800_000,
      displayValue: "$91.8M",
      period: "ytd",
      basis: "actual",
      scope: "initiative_portfolio",
      formulaVersion: "cio_tower_v1",
      sourceFactKeys: ["fact-measured"],
      evidence: [],
      gap: null,
    },
  ],
  portfolioRows: [],
  portfolioValueRows: [
    {
      program: "Crew Recovery & Legality Modernization",
      owner: "VP Integration",
      blocker: "Crew legality and data readiness",
      budgetNumeric: 28_300_000,
      budget: "$28.3M",
      actualSpendNumeric: 9_000_000,
      actualSpend: "$9.0M",
      promisedValueNumeric: 270_000_000,
      promisedValue: "$270.0M",
      measuredValueNumeric: 91_800_000,
      measuredValue: "$91.8M",
      valueGapNumeric: 178_200_000,
      valueGap: "$178.2M",
      spendBurnRate: "32%",
      valueRealizationRate: "34%",
      measuredValuePerDollarSpent: "10.20x",
      evidenceStatus: "source cited",
      inspectionReason: "Promised value is ahead of measured value.",
      confidence: "high",
      source: "T01_initiative-registry.csv row 2",
      sourceFactKeys: ["fact-initiative", "fact-promised", "fact-measured"],
    },
  ],
  vendorRows: [],
  trustRows: [],
  benchmarkRows: [],
  gaps: [],
  parityMeasureKey: "total_it_budget_fy26",
};

const OVER_PROVEN_INITIATIVES: AIInitiative[] = INITIATIVES.map(
  (initiative, index) => ({
    ...initiative,
    committedAnnualUsd: index === 0 ? 40_000_000 : 0,
    committedTotalUsd: index === 0 ? 40_000_000 : 0,
    measuredValueUsd: index === 0 ? 55_000_000 : null,
  }),
);

const RAW_LABEL_INITIATIVES: AIInitiative[] = INITIATIVES.map(
  (initiative, index) => ({
    ...initiative,
    primaryCategoryName:
      index === 0 ? "model_governance" : initiative.primaryCategoryName,
    primaryGoalName:
      index === 0 ? "run_resilience" : initiative.primaryGoalName,
    ownerFunction: index === 0 ? "model_governance" : initiative.ownerFunction,
  }),
);

const RAW_LABEL_BUDGET_ROLLUPS: TowerBudgetRollup[] = [
  {
    ...BUDGET_ROLLUPS[0],
    portfolioCompany: "model_governance",
  },
  BUDGET_ROLLUPS[1],
];

describe("TowerIndexPage · CIO dashboard surface", () => {
  beforeEach(() => {
    query = new URLSearchParams();
    push.mockClear();
    window.localStorage.clear();
    HTMLElement.prototype.scrollTo = jest.fn();
  });

  it("renders a CIO command center with switchable dashboard views and aVa branding", () => {
    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-lakeshore"
        initiatives={INITIATIVES}
        vendors={VENDORS}
        activeTab="portfolio"
        substrateCounts={{
          initiatives: 3,
          vendors: 2,
          kpis: 0,
          decisions: 0,
          stakeholderNotes: 0,
          scenarios: 0,
        }}
        budgetRollups={BUDGET_ROLLUPS}
      />,
    );

    expect(
      screen.getByText("CIO portfolio command center"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Tower · CIO command center")).not.toBeInTheDocument();
    expect(screen.queryByText(/12:00 AM/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tuesday/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aVa · Lakeshore Holdings/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Visuals").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Portfolio").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Budget").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vendors").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AI ROI").length).toBeGreaterThan(0);
    expect(screen.queryByText("Outcomes")).not.toBeInTheDocument();
    expect(screen.queryByText("Risks")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Board" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("CIO and CFO story")).toBeInTheDocument();
    expect(screen.getByText("IT spend")).toBeInTheDocument();
    expect(screen.getByText("Committed value")).toBeInTheDocument();
    expect(screen.getByText("Proven value")).toBeInTheDocument();
    expect(screen.getByText("Value gap")).toBeInTheDocument();
    expect(screen.getByText("Renewals · 90d")).toBeInTheDocument();
    expect(screen.getByText("CIO daily read")).toBeInTheDocument();
    expect(screen.getByText(/We've committed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/unproven/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Inspect pressure spend")).toBeInTheDocument();
    expect(screen.getByText("Demand value proof")).toBeInTheDocument();
    expect(
      screen.queryByText("Scenario questions a CIO can ask next"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("AI Platform Foundation")).toBeInTheDocument();
    expect(screen.getByText("ServiceNow AI Service Desk")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Visuals" }));
    expect(push).toHaveBeenCalledWith("/tower?dashboard=visuals");
    expect(
      screen.getByText("Run versus change."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Budget" }));
    expect(push).toHaveBeenCalledWith("/tower?dashboard=budget");
    expect(screen.getByText("Spending structure.")).toBeInTheDocument();
    expect(screen.getAllByText("aVa").length).toBeGreaterThan(0);
    expect(screen.queryByText("Atlas")).not.toBeInTheDocument();
    expect(screen.queryByText("LH-IT-001")).not.toBeInTheDocument();
    expect(screen.queryByText("LH-IT-002")).not.toBeInTheDocument();
  });

  it("does not present zero loaded amounts as real spend when Tower values are missing", () => {
    render(
      <TowerIndexPage
        tenantName="Airline Demo"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-skyharbor"
        initiatives={ZERO_AMOUNT_INITIATIVES}
        vendors={ZERO_AMOUNT_VENDORS}
        activeTab="portfolio"
      />,
    );

    expect(
      screen.getAllByText(/budget amounts are not loaded/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("gap").length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/\$0 of loaded portfolio spend/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("LH-IT-001")).not.toBeInTheDocument();
  });

  it("marks large unmeasured program budgets as review-required instead of board-grade ROI", () => {
    const unmeasured = INITIATIVES.map((initiative) => ({
      ...initiative,
      measuredValueUsd: null,
    }));

    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-lakeshore"
        initiatives={unmeasured}
        vendors={VENDORS}
        activeTab="portfolio"
      />,
    );

    expect(
      screen.getAllByText(/no measured value rows are loaded/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/review-required/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("gap").length).toBeGreaterThan(0);
    expect(screen.queryByText("0.00x")).not.toBeInTheDocument();
  });

  it("shows the AI ROI view from loaded evidence and names missing ROI data as a gap", () => {
    query = new URLSearchParams("dashboard=ai_roi");

    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-lakeshore"
        initiatives={INITIATIVES}
        vendors={VENDORS}
        activeTab="portfolio"
      />,
    );

    expect(screen.getByText("AI spend families")).toBeInTheDocument();
    expect(screen.getAllByText("Vendor AI agent").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AI platform").length).toBeGreaterThan(0);
    expect(screen.getAllByText("value gap").length).toBeGreaterThan(0);
    expect(screen.queryByText("Atlas")).not.toBeInTheDocument();
  });

  it("falls unknown dashboard routes back to the overview wireframe", () => {
    query = new URLSearchParams("dashboard=board");

    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-lakeshore"
        initiatives={INITIATIVES}
        vendors={VENDORS}
        activeTab="portfolio"
      />,
    );

    expect(screen.getByText("CIO daily read")).toBeInTheDocument();
    expect(screen.getByText("IT spend")).toBeInTheDocument();
    expect(screen.queryByText("Board brief")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Board" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Atlas")).not.toBeInTheDocument();
  });

  it("uses budget rollups for the budget view and does not fake missing split data", () => {
    query = new URLSearchParams("dashboard=budget");

    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-lakeshore"
        initiatives={INITIATIVES}
        vendors={VENDORS}
        activeTab="portfolio"
        budgetRollups={BUDGET_ROLLUPS}
      />,
    );

    expect(screen.getByText("Spending structure.")).toBeInTheDocument();
    expect(screen.getByText("Run vs change")).toBeInTheDocument();
    expect(screen.getByText("OpEx vs CapEx")).toBeInTheDocument();
    expect(screen.getByText("Spend by function.")).toBeInTheDocument();
    expect(
      screen.queryByText(/Run\/Change split is not loaded/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/OpEx\/CapEx split is not loaded/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Atlas")).not.toBeInTheDocument();
  });

  it("uses governed cio_tower metric packets as the dashboard headline source when rollups disagree", () => {
    const conflictingRollups: TowerBudgetRollup[] = BUDGET_ROLLUPS.map(
      (rollup) => ({
        ...rollup,
        totalItBudgetUsd: rollup.totalItBudgetUsd + 300_000_000,
      }),
    );

    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-lakeshore"
        initiatives={INITIATIVES}
        vendors={VENDORS}
        activeTab="portfolio"
        budgetRollups={conflictingRollups}
        metricPackets={GOVERNED_METRIC_PACKETS}
      />,
    );

    expect(screen.getAllByText("$877.9M").length).toBeGreaterThan(0);
    expect(screen.queryByText("$924.8M")).not.toBeInTheDocument();
    expect(
      screen.getByText(/across 5 portfolio-company rollups/i),
    ).toBeInTheDocument();
  });

  it("does not claim program or measured-value rows are absent when governed metric packets exist", () => {
    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-industrial"
        initiatives={[]}
        vendors={[]}
        activeTab="portfolio"
        budgetRollups={BUDGET_ROLLUPS}
        metricPackets={GOVERNED_METRIC_PACKETS}
      />,
    );

    expect(screen.getAllByText("$877.9M").length).toBeGreaterThan(0);
    expect(screen.getByText("$76.4M")).toBeInTheDocument();
    expect(screen.getByText("$91.7M")).toBeInTheDocument();
    expect(screen.getByText("2 attested programs")).toBeInTheDocument();
    expect(
      screen.getByText(/3 governed initiative budget entries/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/No measured value rows are loaded/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/No Tower program rows are loaded/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/waiting for tenant-bound Tower substrate/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/from 0 initiative rows/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Program budget entries are summarized/i),
    ).toBeInTheDocument();
  });

  it("does not call proven value above the committed business case unproven", () => {
    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-lakeshore"
        initiatives={OVER_PROVEN_INITIATIVES}
        vendors={VENDORS}
        activeTab="portfolio"
        budgetRollups={BUDGET_ROLLUPS}
      />,
    );

    expect(screen.getByText("Value gap")).toBeInTheDocument();
    expect(screen.getByText("none")).toBeInTheDocument();
    expect(
      screen.getByText(/\$15\.0M above committed value/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\$15\.0M unproven/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$178\.9M unproven/i)).not.toBeInTheDocument();
  });

  it("normalizes raw dimension slugs before showing Tower labels", () => {
    query = new URLSearchParams();

    render(
      <TowerIndexPage
        tenantName="Airline Demo"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-skyharbor"
        initiatives={RAW_LABEL_INITIATIVES}
        vendors={VENDORS}
        activeTab="portfolio"
        budgetRollups={RAW_LABEL_BUDGET_ROLLUPS}
      />,
    );

    expect(screen.queryByText("model_governance")).not.toBeInTheDocument();
    expect(screen.queryByText("run_resilience")).not.toBeInTheDocument();
    expect(screen.getAllByText("Model Governance").length).toBeGreaterThan(0);
  });

  it("renders the governed Portfolio Value Pack from the CXO view model", () => {
    render(
      <TowerIndexPage
        tenantName="Airline Demo"
        context="Tower"
        towerToday="2026-06-25"
        clientId="client-skyharbor"
        initiatives={[]}
        vendors={[]}
        activeTab="portfolio"
        cxoView={GOVERNED_CXO_VIEW}
      />,
    );

    expect(screen.getByText("Executive operating view")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Value" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Budget" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Portfolio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Benchmark" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evidence" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask aVa" })).toBeInTheDocument();
    expect(screen.queryByText("Tower · CIO command center")).not.toBeInTheDocument();
    expect(screen.queryByText(/12:00 AM/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tuesday/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Run\/change, funded work/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Start here: how much are we spending/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Portfolio" }));
    expect(screen.getByText("Portfolio Value Pack")).toBeInTheDocument();
    expect(screen.getByText("Crew Recovery & Legality Modernization")).toBeInTheDocument();
    expect(screen.getByText("VP Integration")).toBeInTheDocument();
    expect(screen.getByText("$28.3M")).toBeInTheDocument();
    expect(screen.getByText("$270.0M")).toBeInTheDocument();
    expect(screen.getByText("$91.8M")).toBeInTheDocument();
    expect(screen.getByText("$178.2M")).toBeInTheDocument();
    expect(screen.getByText("Crew legality and data readiness")).toBeInTheDocument();
    expect(screen.queryByText("cio_tower")).not.toBeInTheDocument();
  });

  it("uses executive-grade aVa starter questions for the CIO dock", () => {
    expect(TOWER_CIO_STARTER_QUESTIONS).toEqual([
      "Show the holding-company IT budget by portfolio company and shared services.",
      "Which funded programs have the largest gap between promised and proven value?",
      "Which portfolio-company CIOs should I inspect first based on spend, risk, and value proof?",
      "Where is run budget crowding out change budget across the portfolio?",
      "Which vendors create the biggest renewal or concentration exposure this quarter?",
      "Which AI investments are true initiatives versus Copilot, platform, or vendor-embedded spend?",
      "What evidence is missing before this dashboard is board-ready?",
    ]);

    render(
      <TowerIndexPage
        tenantName="Lakeshore Holdings"
        context="Tower"
        towerToday="2026-07-01"
        clientId="client-lakeshore"
        initiatives={[]}
        vendors={[]}
        activeTab="portfolio"
        cxoView={GOVERNED_CXO_VIEW}
      />,
    );

    expect(
      screen.getByText(
        "Show the holding-company IT budget by portfolio company and shared services.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Which portfolio-company CIOs should I inspect first based on spend, risk, and value proof?",
      ),
    ).toBeInTheDocument();
  });
});
