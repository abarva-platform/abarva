/**
 * @jest-environment jsdom
 */

jest.mock("server-only", () => ({}));

jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: ({ workspace }: { workspace: ReactNode }) => (
    <div data-testid="source-agent-dock">{workspace}</div>
  ),
}));

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    withSession: jest.fn(),
  },
}));

jest.mock("@/lib/source/data-model/source-v4-workspace-snapshot", () => ({
  createEmptySourceV4WorkspaceSnapshot: (
    asOfDateIso: string,
    options?: { datasetId?: string; datasetLabel?: string },
  ) => ({
    datasetId: options?.datasetId ?? "ecl-source-browser-proof",
    datasetLabel: options?.datasetLabel ?? "ECL Source browser proof",
    datasetVersion: "local-proof",
    analyticsProvider: "EclProjectionCsvProvider",
    activeLoadRunId: null,
    asOfDateIso,
    availability: [],
    contextCoverage: {
      vendors: 0,
      contracts: 0,
      annualValue: 0,
      scopeRows: 0,
      invoiceLines: 0,
      saasUsageRows: 0,
      cloudRows: 0,
      performanceRows: 0,
    },
    scopeConfidence: {
      rowCount: 0,
      explicitScopeCount: 0,
      inferredScopeCount: 0,
    },
    executivePortfolio: {
      contractCount: 0,
      annualValue: 0,
      totalCommittedValue: 0,
      autoRenewCount: 0,
      notice90DayCount: 0,
    },
    spendConsumption: {
      rowCount: 0,
      invoiceLines: 0,
      actualSpend: 0,
      committedAmount: 0,
      offContractSpend: 0,
    },
    performanceCredits: {
      rowCount: 0,
      breachCount: 0,
      creditCalculated: 0,
      creditClaimed: 0,
      creditRecovered: 0,
      unclaimedCredit: 0,
    },
    aiUsageValueProof: {
      rowCount: 0,
      assignedSeats: 0,
      activeUsers: 0,
      actualCost: 0,
      claimableRows: 0,
      topProducts: [],
    },
    cloudOptimization: {
      rowCount: 0,
      actualCost: 0,
      amortizedCost: 0,
      overageAmount: 0,
      topServices: [],
    },
    workforceRateCards: {
      rowCount: 0,
      hours: 0,
      averageBillRate: null,
      unapprovedVarianceCount: 0,
    },
    sourcingEvents: {
      rowCount: 0,
      normalizedCost: 0,
      lineItemCost: 0,
      averageWeightedScore: null,
    },
    topVendors: [],
  }),
  loadSourceV4WorkspaceSnapshot: jest.fn(),
}));

jest.mock("@/lib/source/data-model/read-adapter", () => ({
  listContract360: jest.fn(),
  listContractApplicationScope: jest.fn(),
  listContractInitiativeDependency: jest.fn(),
  listSourceAvaGroundingBundles: jest.fn(() => Promise.resolve([])),
  listSourceContractActionCandidates: jest.fn(() => Promise.resolve([])),
  listSourceContractClaimCards: jest.fn(() => Promise.resolve([])),
  listSourceContractEvidenceCoverage: jest.fn(() => Promise.resolve([])),
  listSourcePageStoryline: jest.fn(() => Promise.resolve([])),
  listSourceVendorPositions: jest.fn(() => Promise.resolve([])),
  listVendorContractPortfolio: jest.fn(),
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { ReactNode } from "react";

import { WorkspaceClient } from "../WorkspaceClient";
import {
  loadSourceWorkspacePortfolio,
  type SourceWorkspacePortfolioData,
} from "../live/portfolioAdapter";

const ORIGINAL_PROVIDER = process.env.SOURCE_WORKSPACE_PROVIDER;
const ORIGINAL_PROJECTION_DIR = process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR;
const WORKSPACE_ROUTE_DIR = path.join(
  process.cwd(),
  "src/app/(maestro)/source/preview/workspace",
);
const LEGACY_COOL_TOKENS = [
  "#0066cc",
  "#0066CC",
  "#0052a3",
  "#005bd3",
  "rgba(0,102,204",
  "#06172f",
  "#7a8799",
  "#0f7cf6",
  "#12b5cb",
  "#66758c",
  "#0a3d70",
  "#3d6ea8",
  "#a9bdd6",
  "#23395d",
  "#53657f",
  "#176d52",
  "#f4f7fb",
  "#f7f9fc",
  "rgba(10,31,68",
] as const;

async function readWorkspaceSourceFiles(dir = WORKSPACE_ROUTE_DIR): Promise<
  Array<{ file: string; text: string }>
> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.name === "__tests__") return [];
      if (entry.isDirectory()) return readWorkspaceSourceFiles(fullPath);
      if (!/\.(css|ts|tsx)$/.test(entry.name)) return [];
      return readFile(fullPath, "utf-8").then((text) => [
        { file: path.relative(WORKSPACE_ROUTE_DIR, fullPath), text },
      ]);
    }),
  );
  return files.flat();
}

function csv(rows: readonly Record<string, string>[]): string {
  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

async function writeEclProjectionFixture(dir: string) {
  await writeFile(
    path.join(dir, "source_contract_360_projection.csv"),
    csv([
      {
        tenant_key: "meridian-health",
        row_key: "MER-CTR-SSO-BPO-001",
        contract_id: "contract-object-1",
        vendor_object_id: "MER-VEN-HELIX-SSO",
        vendor_name: "Helix Shared Services Group",
        contract_name: "Enterprise Shared Services BPO",
        auto_renew_flag: "true",
        renewal_notice_date: "2027-01-01",
        end_date: "2027-12-31",
        annualized_value_usd: "10710000",
        total_contract_value_usd: "32130000",
        value_state: "known",
        scope_json: JSON.stringify([
          { domain: "Finance", name: "Workday Finance" },
          { domain: "HR", name: "UKG Workforce Central" },
          { domain: "Supply Chain", name: "Infor Lawson Supply Chain" },
        ]),
        spend_summary_json: JSON.stringify({
          ap_actual_total_usd: 11120000,
          market_benchmark: {
            basis: "model_inferred",
            variance_percent: 21.5,
          },
        }),
        gap_flags_json: JSON.stringify([
          "source_sla_kpi_events_missing",
          "requires_owner_finance_legal_review",
        ]),
      },
      {
        tenant_key: "meridian-health",
        row_key: "MER-CTR-EPIC-001",
        contract_id: "contract-object-2",
        vendor_object_id: "MER-VEN-EPIC",
        vendor_name: "Epic Systems Corporation",
        contract_name: "Clinical Applications Agreement",
        auto_renew_flag: "true",
        renewal_notice_date: "2027-06-30",
        end_date: "2027-01-01",
        annualized_value_usd: "12000000",
        total_contract_value_usd: "36000000",
        value_state: "known",
        scope_json: JSON.stringify([
          { domain: "Clinical", name: "Clinical applications" },
        ]),
        spend_summary_json: JSON.stringify({
          ap_actual_total_usd: 500000,
          market_benchmark: {
            basis: "model_inferred",
            variance_percent: 0,
          },
        }),
        gap_flags_json: JSON.stringify([]),
      },
    ]),
    "utf-8",
  );
  await writeFile(
    path.join(dir, "source_vendor_360_projection.csv"),
    csv([
      {
        tenant_key: "meridian-health",
        row_key: "MER-VEN-HELIX-SSO",
        vendor_object_id: "MER-VEN-HELIX-SSO",
        vendor_name: "Helix Shared Services Group",
        contract_count: "1",
        annualized_spend_usd: "10710000",
        contract_ids_json: JSON.stringify(["MER-CTR-SSO-BPO-001"]),
      },
      {
        tenant_key: "meridian-health",
        row_key: "MER-VEN-EPIC",
        vendor_object_id: "MER-VEN-EPIC",
        vendor_name: "Epic Systems Corporation",
        contract_count: "1",
        annualized_spend_usd: "12000000",
        contract_ids_json: JSON.stringify([]),
      },
    ]),
    "utf-8",
  );
  await writeFile(
    path.join(dir, "source_event_workspace_projection.csv"),
    csv([
      {
        tenant_key: "meridian-health",
        row_key: "MER-CTR-SSO-BPO-001:compare:bidder-a",
        workspace_tab: "compare",
        row_type: "vendor_response_compare",
      },
      {
        tenant_key: "meridian-health",
        row_key: "MER-CTR-SSO-BPO-001:approval:finance",
        workspace_tab: "approvals",
        row_type: "approval_gate",
      },
    ]),
    "utf-8",
  );
}

describe("Source workspace ECL browser-surface proof", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "source-ecl-browser-"));
    process.env.SOURCE_WORKSPACE_PROVIDER = "ecl_projection";
    process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR = dir;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: jest.fn(() => ({
        measureText: (value: string) => ({ width: value.length * 7 }),
      })),
    });
    global.fetch = jest.fn(
      () => new Promise<Response>(() => undefined),
    );
    await writeEclProjectionFixture(dir);
  });

  afterEach(async () => {
    process.env.SOURCE_WORKSPACE_PROVIDER = ORIGINAL_PROVIDER;
    process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR = ORIGINAL_PROJECTION_DIR;
    await rm(dir, { force: true, recursive: true });
  });

  it("renders the real workspace component from flagged ECL projection rows", async () => {
    const portfolio = await loadSourceWorkspacePortfolio(
      "meridian",
      "2027-06-30T00:00:00Z",
    );

    expect(portfolio.workspaceDiagnostics.exploreProvider).toBe(
      "EclProjectionCsvProvider",
    );
    expect(portfolio.workspaceDiagnostics.eclCompareResponseCount).toBe(1);
    expect(portfolio.isEmpty).toBe(false);

    const dbPortfolio = {
      ...portfolio,
      workspaceDiagnostics: {
        ...portfolio.workspaceDiagnostics,
        exploreProvider: "EclProjectionDbProvider" as const,
      },
    };

    const { container } = render(
      <WorkspaceClient
        portfolio={dbPortfolio}
        tenantName="Meridian Health"
        sourceClientKey="meridian-health"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("navigation", {
          name: "Source workspace navigation",
        }),
      ).toBeTruthy();
    });
    expect(screen.getByLabelText("Source workspace header")).toBeTruthy();
    expect(screen.queryByLabelText("Source workspace sidebar")).toBeNull();
    expect(screen.queryByText("Nexus Source")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Source 360", level: 1 }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Workspace controls")).toBeTruthy();
    expect(screen.getByLabelText("Workspace action toolbar")).toBeTruthy();
    expect(container.querySelector(".sw-v2-action-toolbar-buttons")).toBeTruthy();
    expect(container.querySelectorAll(".sw-v2-action-button")).toHaveLength(2);
    expect(screen.getByLabelText("Scope filter").textContent).toContain(
      "All loaded contracts",
    );
    expect(screen.getByLabelText("Data as of").textContent).toContain(
      "30 Jun 2027",
    );
    expect(screen.getAllByRole("button", { name: "Vendors" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Contracts" })).toHaveLength(
      1,
    );
    expect(screen.getAllByRole("button", { name: "Optimize" })).toHaveLength(
      1,
    );
    expect(screen.getByLabelText("Portfolio facts")).toBeTruthy();
    expect(screen.getByText("Auto-renew notice passed")).toBeTruthy();
    expect(screen.getAllByText("$10.7M").length).toBeGreaterThan(0);
    expect(screen.getByText("Still cancellable")).toBeTruthy();
    expect(screen.getAllByText("Stale renewal dates").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("1 excluded").length).toBeGreaterThan(0);
    expect(screen.queryByText("Decision window")).toBeNull();
    expect(screen.getByText("Helix Shared Services Group")).toBeTruthy();
    expect(screen.getByText("Executive position")).toBeTruthy();
    expect(screen.getByText("Finance confirmation remains separate")).toBeTruthy();
    expect(
      screen.getByText(
        "No quantified opportunity is loaded in the current deterministic slice.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Vendor concentration")).toBeTruthy();
    expect(screen.getByText("Evidence posture")).toBeTruthy();
    expect(screen.getByLabelText("Source 360 canvas")).toBeTruthy();
    expect(screen.getByLabelText("Claim contract")).toBeTruthy();
    expect(screen.getByText("What this tab lets you say")).toBeTruthy();
    expect(screen.getByText("Blocked without more evidence")).toBeTruthy();
    expect(container.querySelector(".sw-v2-verdict-grid")).toBeTruthy();
    expect(container.querySelector(".sw-v2-content-canvas")).toBeTruthy();
    expect(container.querySelectorAll(".sw-v2-claim-card")).toHaveLength(2);
    expect(container.querySelector(".sw-v2-verdict-position")).toBeTruthy();
    expect(container.querySelector(".sw-v2-verdict-action")).toBeTruthy();
    expect(container.querySelector(".sw-v2-verdict-evidence")).toBeTruthy();
    expect(container.querySelector(".sw-v2-compact-decisions")).toBeTruthy();
    expect(container.querySelectorAll(".sw-v2-compact-facts").length).toBeGreaterThan(
      1,
    );
    expect(screen.getByText("Unsupported dashboard claims")).toBeTruthy();
    expect(screen.getByText("Hidden")).toBeTruthy();
    expect(screen.queryByText("Contract register")).toBeNull();
    expect(screen.queryByText("Application scope")).toBeNull();
    expect(screen.queryByText("No Source rows returned")).toBeNull();
    expect(screen.queryByText(/Demo Findings/i)).toBeNull();
    expect(screen.queryByText(/Serving Surfaces/i)).toBeNull();
    expect(screen.queryByText(/Proof Layers/i)).toBeNull();
    expect(screen.queryByText(/ECL Source/i)).toBeNull();
    expect(screen.queryByText(/EclProjectionDbProvider/i)).toBeNull();
    expect(screen.queryByText(/source\.contract_360/i)).toBeNull();
    expect(screen.queryByText(/source\.vendor_contract_portfolio/i)).toBeNull();
    expect(screen.queryByText(/load run/i)).toBeNull();
    expect(screen.queryByText(/computeRenewalExposure/i)).toBeNull();
    expect(screen.queryByText(/Savings realized/i)).toBeNull();
    expect(screen.queryByText(/Risk score/i)).toBeNull();
    expect(screen.queryByText(/Spend by category/i)).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Contracts" })[0]);

    expect(screen.getByRole("tab", { name: "Contract table" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Evidence depth" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Financial posture" })).toBeTruthy();
    expect(screen.getByText("Contract list guardrail")).toBeTruthy();
    expect(screen.getByText("Rows before story")).toBeTruthy();
    expect(screen.getByText("Focused contract set")).toBeTruthy();
    expect(screen.queryByText(/Showing 14 of/i)).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Enterprise Shared Services BPO/,
      }),
    );

    expect(screen.getByRole("button", { name: "Scope" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Economics" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Optimize" })).toHaveLength(
      2,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Optimize" })[1]);

    expect(screen.getByText("Contract 360 / Optimize")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Story" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Scope" }));

    expect(screen.getByText("Contract 360 / Scope")).toBeTruthy();
    expect(screen.getByText("Scope basis")).toBeTruthy();
    expect(screen.getAllByText("Workday Finance").length).toBeGreaterThan(0);
    expect(screen.getByText("Business function")).toBeTruthy();
    expect(
      screen.getByText(
        "Do not infer unsupported tower, module, or CMDB relationships beyond these rows.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Vendors" })[0]);

    expect(screen.getByRole("tab", { name: "Concentration" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Evidence depth" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Archetype mix" })).toBeTruthy();
    expect(screen.getByText("Vendor 360")).toBeTruthy();
    expect(screen.getByText("One row per supplier relationship")).toBeTruthy();
    expect(screen.getByLabelText("Vendor concentration chart")).toBeTruthy();
    expect(
      container.querySelector(".recharts-responsive-container"),
    ).toBeTruthy();
    expect(container.querySelector(".recharts-wrapper")).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { name: "Epic Systems Corporation" })
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("heading", { name: "Helix Shared Services Group" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Evidence depth" }));
    expect(screen.getByText("Which vendors have usable depth")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /Epic Systems Corporation/ }),
    );

    expect(screen.getByText("Selected vendor")).toBeTruthy();
    expect(screen.getByText("MER-CTR-EPIC-001")).toBeTruthy();
    expect(screen.getByText("Grouped contracts")).toBeTruthy();
    expect(screen.getAllByText("Performance rows").length).toBeGreaterThan(0);
    expect(screen.queryByText("Portfolio position")).toBeNull();
    expect(screen.queryByText("Material contracts")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Optimize" })[0]);
    expect(screen.getByRole("tab", { name: "Action queue" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Type mix" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Contract readiness" })).toBeTruthy();
    expect(screen.getByText("Evidence-backed action queue")).toBeTruthy();
    expect(screen.getByText("No optimize-ready action rows loaded.")).toBeTruthy();
    expect(screen.getByText("Evidence basis")).toBeTruthy();
    expect(screen.getByText("Why this is shown")).toBeTruthy();
    expect(screen.getByText("Action rows")).toBeTruthy();
    expect(screen.queryByText(/Proof Layers/i)).toBeNull();
    expect(screen.queryByText(/Action candidates/i)).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Contract readiness" }));
    expect(screen.getByText("Contract-level action rows")).toBeTruthy();
    expect(screen.getByText("No contract-level action rows loaded.")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Evidence" })[0]);
    expect(screen.getByText("Loaded rows, missing lanes, and claim eligibility")).toBeTruthy();
    expect(screen.getByText("Show lineage")).toBeTruthy();
    expect(screen.queryByText("source.contract_360")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show lineage" }));
    expect(screen.getByText("source.contract_360")).toBeTruthy();
    expect(screen.getByText("Hide lineage")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hide lineage" }));
    expect(screen.queryByText("source.contract_360")).toBeNull();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Contract graph" })[0],
    );
    expect(screen.getByRole("tab", { name: "Flow" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Volume" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Mapping spine" })).toBeTruthy();
    expect(container.querySelector(".sw-v2-graph-hero-panel")).toBeTruthy();
    expect(container.querySelector(".sw-v2-graph")).toBeTruthy();
    expect(screen.getByText("Source systems and files")).toBeTruthy();
    expect(screen.getByText("Source page substrate")).toBeTruthy();
    expect(screen.getByText("Show lineage")).toBeTruthy();
    expect(screen.queryByText("contract_register_adapter")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show lineage" }));
    expect(screen.getByText("contract_register_adapter")).toBeTruthy();
  });

  it("keeps the Source workspace free of legacy cool-blue design tokens", async () => {
    const files = await readWorkspaceSourceFiles();
    const violations = files.flatMap(({ file, text }) =>
      LEGACY_COOL_TOKENS.flatMap((token) =>
        text.includes(token) ? [`${file}: ${token}`] : [],
      ),
    );

    expect(violations).toEqual([]);
  });

  it("renders a Recharts action mix on the default Optimize page when action rows exist", async () => {
    const portfolio = await loadSourceWorkspacePortfolio(
      "meridian",
      "2027-06-30T00:00:00Z",
    );
    const actionCandidate: SourceWorkspacePortfolioData["impact"]["actionCandidates"][number] = {
      tenant_key: "meridian-health",
      action_candidate_id: "OPT-TEST-001",
      opportunity_id: "OPT-TEST-001",
      contract_id: "MER-TECH-M365-001",
      vendor_ref: "MER-VEN-HELIX-SSO",
      vendor_name: "Helix Shared Services Group",
      title: "Right-size loaded application support tier",
      action_type: "avoid_future_spend",
      opportunity_type: "avoid_future_spend",
      finding_summary: "Loaded action row with a candidate amount.",
      deterministic_basis: "Action row cites loaded contract and spend rows.",
      candidate_amount_usd: 1250000,
      priority: "high",
      readiness_state: "finance_confirmation_required",
      evidence_state: "loaded",
      authority_state: "not_confirmed",
      finance_confirmation_state: "not_confirmed",
      next_action: "Review evidence trail",
      accountable_role: "procurement_owner",
      decision_due_date: "2027-03-31",
      coverage_state: "partial",
      blocker_if_missing:
        "Never present this candidate as realized savings until finance confirms it.",
      citation_basis_json: { source: "unit-fixture" },
      load_run_id: "unit-proof",
    };
    const performanceCoverage: SourceWorkspacePortfolioData["impact"]["evidenceCoverage"][number] = {
      tenant_key: "meridian-health",
      contract_id: "MER-CTR-EPIC-001",
      vendor_ref: "MER-VEN-EPIC",
      vendor_name: "Epic Systems Corporation",
      contract_name: "Clinical Applications Agreement",
      spend_rows: 12,
      actual_spend_usd: 12000000,
      committed_spend_usd: 12000000,
      performance_rows: 12,
      breach_rows: 3,
      credit_calculated_usd: 50000,
      credit_claimed_usd: 0,
      credit_recovered_usd: 0,
      unclaimed_credit_usd: 50000,
      opportunity_rows: 0,
      candidate_amount_usd: 0,
      finance_confirmation_required_rows: 0,
      opportunities_with_evidence: 0,
      scope_rows: 1,
      critical_scope_rows: 0,
      document_page_text_rows: 0,
      change_order_rows: 0,
      coverage_state: "partial",
      blocker_if_missing:
        "Document page text missing; finance confirmation required before realized-value claim.",
      evidence_basis_json: { source: "unit-fixture" },
      load_run_id: "unit-proof",
    };
    const dbPortfolio: SourceWorkspacePortfolioData = {
      ...portfolio,
      workspaceDiagnostics: {
        ...portfolio.workspaceDiagnostics,
        exploreProvider: "EclProjectionDbProvider" as const,
      },
      impact: {
        ...portfolio.impact,
        evidenceCoverage: [performanceCoverage],
        actionCandidates: [actionCandidate],
      },
    };

    const { container } = render(
      <WorkspaceClient
        portfolio={dbPortfolio}
        tenantName="Meridian Health"
        sourceClientKey="meridian-health"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("navigation", {
          name: "Source workspace navigation",
        }),
      ).toBeTruthy();
    });

    expect(screen.getByText("Governed contract book + action layer")).toBeTruthy();
    expect(screen.getByRole("button", { name: "View contracts" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run optimize" })).toBeTruthy();
    expect(
      screen.getByText(/contracts are in the portfolio register/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/action candidates are in the action layer/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/do not change the register count/i),
    ).toBeTruthy();
    expect(screen.queryByText(/vendors are loaded/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Optimize" }));

    expect(screen.getByText("Evidence-backed action queue")).toBeTruthy();
    expect(screen.getByLabelText("Optimize action mix chart")).toBeTruthy();
    expect(
      container.querySelector(".recharts-responsive-container"),
    ).toBeTruthy();
    expect(container.querySelector(".recharts-wrapper")).toBeTruthy();
    expect(screen.getByText("Right-size loaded application support tier")).toBeTruthy();
    expect(screen.getAllByText("$1.3M").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Savings realized/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Review performance evidence" }));

    expect(screen.getByText("Clinical Applications Agreement")).toBeTruthy();
    expect(screen.getByText(/MER-CTR-EPIC-001/)).toBeTruthy();
    expect(screen.getByText("Contract 360 / Performance")).toBeTruthy();
  });
});
