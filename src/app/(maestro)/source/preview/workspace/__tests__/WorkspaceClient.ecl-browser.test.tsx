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
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { ReactNode } from "react";

import { WorkspaceClient } from "../WorkspaceClient";
import { loadSourceWorkspacePortfolio } from "../live/portfolioAdapter";

const ORIGINAL_PROVIDER = process.env.SOURCE_WORKSPACE_PROVIDER;
const ORIGINAL_PROJECTION_DIR = process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR;

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
        renewal_notice_date: "2027-06-30",
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
        renewal_notice_date: "2027-06-30",
        end_date: "2027-12-31",
        annualized_value_usd: "500000",
        total_contract_value_usd: "1500000",
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
        annualized_spend_usd: "500000",
        contract_ids_json: JSON.stringify(["MER-CTR-EPIC-001"]),
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

    render(
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
    expect(screen.getByText("Nexus Source")).toBeTruthy();
    expect(screen.getByLabelText("Portfolio facts")).toBeTruthy();
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

    fireEvent.click(screen.getByRole("tab", { name: "Evidence depth" }));
    expect(screen.getByText("Which vendors have usable depth")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: /Epic Systems Corporation/ }),
    );

    expect(screen.getByText("Selected vendor")).toBeTruthy();
    expect(screen.getByText("MER-CTR-EPIC-001")).toBeTruthy();
    expect(screen.queryByText("Portfolio position")).toBeNull();
    expect(screen.queryByText("Material contracts")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Optimize" })[0]);
    expect(screen.getByRole("tab", { name: "Action queue" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "By type" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "By contract" })).toBeTruthy();
    expect(screen.getByText("Evidence basis")).toBeTruthy();
    expect(screen.getByText("Why this is shown")).toBeTruthy();
    expect(screen.queryByText(/Proof Layers/i)).toBeNull();

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
    expect(screen.getByRole("tab", { name: "Spine" })).toBeTruthy();
    expect(screen.getByText("Source systems and files")).toBeTruthy();
    expect(screen.getByText("Source page substrate")).toBeTruthy();
    expect(screen.getByText("Show lineage")).toBeTruthy();
    expect(screen.queryByText("contract_register_adapter")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show lineage" }));
    expect(screen.getByText("contract_register_adapter")).toBeTruthy();
  });
});
