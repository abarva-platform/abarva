jest.mock("server-only", () => ({}));

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    withSession: jest.fn(),
  },
}));

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { azureRead } from "@/lib/data-plane/azureRead";
import {
  loadSourceWorkspacePortfolio,
  sourceWorkspaceProvider,
} from "../live/portfolioAdapter";

const ORIGINAL_PROVIDER = process.env.SOURCE_WORKSPACE_PROVIDER;
const ORIGINAL_PROJECTION_DIR = process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR;
const ORIGINAL_ECL_PRODUCT_DEFAULT =
  process.env.ECL_PRODUCT_DEFAULT_PROVIDER;
const mockWithSession = azureRead.withSession as jest.MockedFunction<
  typeof azureRead.withSession
>;

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

describe("loadSourceWorkspacePortfolio ECL projection adapter", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "source-ecl-adapter-"));
    process.env.SOURCE_WORKSPACE_PROVIDER = "ecl_projection";
    process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR = dir;
  });

  afterEach(async () => {
    process.env.SOURCE_WORKSPACE_PROVIDER = ORIGINAL_PROVIDER;
    process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR = ORIGINAL_PROJECTION_DIR;
    process.env.ECL_PRODUCT_DEFAULT_PROVIDER = ORIGINAL_ECL_PRODUCT_DEFAULT;
    mockWithSession.mockReset();
    await rm(dir, { force: true, recursive: true });
  });

  it("uses Azure ECL serving views as the default Source workspace provider", () => {
    delete process.env.SOURCE_WORKSPACE_PROVIDER;
    delete process.env.ECL_PRODUCT_DEFAULT_PROVIDER;

    expect(sourceWorkspaceProvider()).toBe("ecl_projection_db");
  });

  it("preserves explicit Source provider rollback to legacy", () => {
    process.env.SOURCE_WORKSPACE_PROVIDER = "legacy";

    expect(sourceWorkspaceProvider()).toBe("legacy");
  });

  it("loads Source 360 portfolio data from flagged local ECL projection CSVs", async () => {
    await writeFile(
      path.join(dir, "source_contract_360_projection.csv"),
      csv([
        {
          tenant_key: "meridian-health",
          row_key: "MER-CTR-SSO-BPO-001",
          contract_id: "contract-object-1",
          vendor_object_id: "vendor-object-1",
          vendor_name: "LedgerWorks Shared Services LLC",
          contract_name: "Finance Shared Services BPO",
          renewal_notice_date: "2027-06-30",
          end_date: "2027-12-31",
          annualized_value_usd: "7200000",
          total_contract_value_usd: "21600000",
          value_state: "known",
          scope_json: JSON.stringify([
            { domain: "Finance", name: "Workday Finance" },
            { domain: "Finance", name: "BlackLine Account Reconciliations" },
          ]),
          spend_summary_json: JSON.stringify({
            ap_actual_total_usd: 5100000,
            market_benchmark: {
              basis: "synthetic_directional_market_benchmark",
            },
          }),
          gap_flags_json: JSON.stringify(["requires_owner_finance_legal_review"]),
        },
      ]),
      "utf-8",
    );
    await writeFile(
      path.join(dir, "source_vendor_360_projection.csv"),
      csv([
        {
          tenant_key: "meridian-health",
          row_key: "MER-VEN-LEDGERWORKS",
          vendor_object_id: "vendor-object-1",
          vendor_name: "LedgerWorks Shared Services LLC",
          contract_count: "1",
          annualized_spend_usd: "7200000",
          contract_ids_json: JSON.stringify(["MER-CTR-SSO-BPO-001"]),
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
      ]),
      "utf-8",
    );

    const portfolio = await loadSourceWorkspacePortfolio(
      "meridian",
      "2027-06-30T00:00:00Z",
    );

    expect(portfolio.workspaceDiagnostics.exploreProvider).toBe(
      "EclProjectionCsvProvider",
    );
    expect(portfolio.workspaceDiagnostics.eclCompareResponseCount).toBe(1);
    expect(portfolio.contracts).toHaveLength(1);
    expect(portfolio.vendors).toHaveLength(1);
    expect(portfolio.applicationScope.map((row) => row.application_name)).toEqual(
      ["Workday Finance", "BlackLine Account Reconciliations"],
    );
    expect(portfolio.contracts[0]).toMatchObject({
      contract_id: "MER-CTR-SSO-BPO-001",
      vendor_ref: "vendor-object-1",
      annual_value: 7200000,
      actual_annual_spend: 5100000,
      operational_evidence_gap: true,
      scoped_application_count: 2,
    });
    expect(portfolio.reads).toMatchObject({
      contracts: "available",
      vendors: "available",
      applicationScope: "available",
      initiativeDependencies: "missing",
    });
  });

  it("loads Source 360 portfolio data from flagged Azure ECL serving views", async () => {
    process.env.SOURCE_WORKSPACE_PROVIDER = "legacy";
    delete process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR;
    mockWithSession.mockImplementation(async (fn) => {
      const run = async <R,>(sql: string): Promise<R[]> => {
        if (sql.includes("set_config")) return [] as R[];
        if (sql.includes("serving.source_contract_360")) {
          return [
            {
              payload_json: {
                tenant_key: "meridian-health",
                row_key: "MER-CTR-SSO-BPO-001",
                contract_id: "contract-object-1",
                vendor_object_id: "vendor-object-1",
                vendor_name: "LedgerWorks Shared Services LLC",
                contract_name: "Finance Shared Services BPO",
                renewal_notice_date: "2027-06-30",
                end_date: "2027-12-31",
                annualized_value_usd: 7200000,
                total_contract_value_usd: 21600000,
                value_state: "known",
                scope_json: [
                  { domain: "Finance", name: "Workday Finance" },
                  {
                    domain: "Finance",
                    name: "BlackLine Account Reconciliations",
                  },
                ],
                spend_summary_json: {
                  ap_actual_total_usd: 5100000,
                  market_benchmark: {
                    basis: "model_inferred",
                  },
                },
                gap_flags_json: ["requires_owner_finance_legal_review"],
              },
            },
          ] as R[];
        }
        if (sql.includes("serving.source_vendor_360")) {
          return [
            {
              payload_json: {
                tenant_key: "meridian-health",
                row_key: "MER-VEN-LEDGERWORKS",
                vendor_object_id: "vendor-object-1",
                vendor_name: "LedgerWorks Shared Services LLC",
                contract_count: 1,
                annualized_spend_usd: 7200000,
                contract_ids_json: ["MER-CTR-SSO-BPO-001"],
              },
            },
          ] as R[];
        }
        if (sql.includes("serving.source_events")) {
          return [
            {
              payload_json: {
                tenant_key: "meridian-health",
                row_key: "MER-CTR-SSO-BPO-001:compare:bidder-a",
                workspace_tab: "compare",
                row_type: "vendor_response_compare",
              },
            },
          ] as R[];
        }
        if (sql.includes("ecl_projection.cube_slice")) {
          return [
            {
              cube_key: "source_contract_cube",
              slice_key: "source_contract_cube:contract_annualized_value_usd",
              primary_metric_key: "contract_annualized_value_usd",
              quality_state: "passed",
            },
            {
              cube_key: "source_vendor_cube",
              slice_key: "source_vendor_cube:contract_annualized_value_usd",
              primary_metric_key: "contract_annualized_value_usd",
              quality_state: "passed",
            },
          ] as R[];
        }
        return [] as R[];
      };
      return fn(run);
    });

    const portfolio = await loadSourceWorkspacePortfolio(
      "meridian",
      "2027-06-30T00:00:00Z",
      "ecl_projection_db",
    );

    expect(portfolio.workspaceDiagnostics.exploreProvider).toBe(
      "EclProjectionDbProvider",
    );
    expect(portfolio.workspaceDiagnostics.eclCompareResponseCount).toBe(1);
    expect(portfolio.workspaceDiagnostics.eclProjectionDir).toBeNull();
    expect(portfolio.contracts).toHaveLength(1);
    expect(portfolio.vendors).toHaveLength(1);
    expect(portfolio.contracts[0]).toMatchObject({
      contract_id: "MER-CTR-SSO-BPO-001",
      annual_value: 7200000,
      actual_annual_spend: 5100000,
      operational_evidence_gap: true,
      scoped_application_count: 2,
    });
    expect(portfolio.v4Snapshot.availability).toEqual(
      expect.arrayContaining([
        { lensId: "executive_portfolio", state: "available", rowCount: 1 },
        { lensId: "vendor_concentration", state: "available", rowCount: 1 },
        { lensId: "context_coverage", state: "available", rowCount: 2 },
      ]),
    );
    expect(
      portfolio.cockpit.proofLayers.sourceSystems.find(
        (row) => row.name === "executive_portfolio",
      ),
    ).toMatchObject({
      note: "Returned by governed ECL projection read.",
      rowCount: 1,
      state: "available",
    });
    expect(portfolio.applicationScope.map((row) => row.application_name)).toEqual(
      ["Workday Finance", "BlackLine Account Reconciliations"],
    );
  });
});
