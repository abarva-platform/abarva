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
import { createEmptySourceV4WorkspaceSnapshot } from "@/lib/source/data-model/source-v4-workspace-snapshot";
import {
  buildSourceVendor360Cockpit,
  loadSourceWorkspacePortfolio,
  resolveImpactVendorNames,
  sourceWorkspaceProvider,
} from "../live/portfolioAdapter";

const ORIGINAL_PROVIDER = process.env.SOURCE_WORKSPACE_PROVIDER;
const ORIGINAL_PROJECTION_DIR = process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR;
const ORIGINAL_ECL_PRODUCT_DEFAULT = process.env.ECL_PRODUCT_DEFAULT_PROVIDER;
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

  it("resolves UUID-like vendor display names before impact rows reach the workspace payload", () => {
    const vendorRef = "24fc65af-8223-4884-9241-ef5736960a1b";
    const contractVendorRef = "vendor-optum-rx";
    const impact = resolveImpactVendorNames(
      {
        evidenceCoverage: [
          {
            contract_id: "CTR-0002",
            vendor_ref: vendorRef,
            vendor_name: vendorRef,
            contract_name: "Optum Rx claims administration agreement",
          },
        ],
        actionCandidates: [
          {
            action_candidate_id: "CTR-0002:sla-credit-recovery",
            opportunity_id: "CTR-0002:sla-credit-recovery",
            contract_id: "CTR-0002",
            vendor_ref: vendorRef,
            vendor_name: vendorRef,
            candidate_amount_usd: 43000.02,
          },
        ],
        claimCards: [
          {
            claim_card_id: "CTR-0002:sla-credit-recovery:claim-card",
            action_candidate_id: "CTR-0002:sla-credit-recovery",
            opportunity_id: "CTR-0002:sla-credit-recovery",
            contract_id: "CTR-0002",
            vendor_ref: vendorRef,
            vendor_name: vendorRef,
            allowed_executive_statement: `${vendorRef} has an evidence-backed action opportunity; do not label it realized value.`,
          },
        ],
        vendorPositions: [
          {
            vendor_ref: vendorRef,
            vendor_name: vendorRef,
            contract_refs: ["CTR-0002"],
          },
        ],
        storyline: [
          {
            page_key: "overview",
            section_key: "performance_credits",
            sort_order: 1,
            headline: "Performance-credit recovery",
            allowed_executive_statement: `${vendorRef} has unclaimed service credits.`,
            primary_metric_label: "Unclaimed credits",
            primary_metric_value: "$43K",
            citation_basis_json: null,
          },
        ],
        avaGroundingBundles: [
          {
            grounding_bundle_id: "action:CTR-0002:sla-credit-recovery",
            page_key: "contract_action",
            section_key: "CTR-0002:sla-credit-recovery",
            question_family: "contract_action_grounding",
            allowed_claims_json: [
              {
                vendor_name: vendorRef,
                claim: `${vendorRef} has an evidence-backed candidate action.`,
                vendor_ref: vendorRef,
              },
            ],
            refusal_rules_json: [],
            citation_sources_json: null,
            load_run_id: null,
          },
        ],
      } as never,
      [
        {
          contract_id: "CTR-0002",
          vendor_ref: contractVendorRef,
          vendor_name: "Optum Rx",
        },
      ] as never,
      [],
    );

    expect(impact.evidenceCoverage[0].vendor_name).toBe("Optum Rx");
    expect(impact.actionCandidates[0].vendor_name).toBe("Optum Rx");
    expect(impact.claimCards[0].vendor_name).toBe("Optum Rx");
    expect(impact.claimCards[0].allowed_executive_statement).toContain(
      "Optum Rx has",
    );
    expect(impact.vendorPositions[0].vendor_name).toBe("Optum Rx");
    expect(impact.storyline[0].allowed_executive_statement).toContain(
      "Optum Rx has",
    );
    expect(impact.avaGroundingBundles[0].allowed_claims_json[0]).toMatchObject({
      vendor_name: "Optum Rx",
      claim: "Optum Rx has an evidence-backed candidate action.",
      vendor_ref: vendorRef,
    });
    expect(impact.claimCards[0].allowed_executive_statement).not.toContain(
      vendorRef,
    );
    expect(impact.vendorPositions[0].vendor_name).not.toContain(vendorRef);
    expect(
      String(impact.avaGroundingBundles[0].allowed_claims_json[0].claim),
    ).not.toContain(vendorRef);
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
          gap_flags_json: JSON.stringify([
            "requires_owner_finance_legal_review",
          ]),
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
    expect(
      portfolio.applicationScope.map((row) => row.application_name),
    ).toEqual(["Workday Finance", "BlackLine Account Reconciliations"]);
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

  it("preserves ECL renewal trigger fields for the Source 360 renewal headline", async () => {
    await writeFile(
      path.join(dir, "source_contract_360_projection.csv"),
      csv([
        {
          tenant_key: "meridian-health",
          row_key: "lapsed-auto-renew",
          contract_id: "lapsed-auto-renew",
          vendor_object_id: "vendor-lapsed",
          vendor_name: "Lapsed Vendor",
          contract_name: "Lapsed notice contract",
          notice_deadline: "2027-06-01",
          expiration_date: "2027-12-31",
          service_lines_json: JSON.stringify([{ auto_renew: "true" }]),
          annualized_value_usd: "140300000",
          total_contract_value_usd: "140300000",
          value_state: "known",
          scope_json: "[]",
          spend_summary_json: "{}",
          gap_flags_json: "[]",
        },
        {
          tenant_key: "meridian-health",
          row_key: "still-cancellable",
          contract_id: "still-cancellable",
          vendor_object_id: "vendor-open",
          vendor_name: "Open Vendor",
          contract_name: "Open notice contract",
          notice_deadline: "2028-03-31",
          expiration_date: "2028-06-30",
          service_lines_json: JSON.stringify([{ auto_renew: "true" }]),
          annualized_value_usd: "214600000",
          total_contract_value_usd: "214600000",
          value_state: "known",
          scope_json: "[]",
          spend_summary_json: "{}",
          gap_flags_json: "[]",
        },
        {
          tenant_key: "meridian-health",
          row_key: "expired-auto-renew",
          contract_id: "expired-auto-renew",
          vendor_object_id: "vendor-expired",
          vendor_name: "Expired Vendor",
          contract_name: "Expired contract",
          notice_deadline: "2026-10-03",
          expiration_date: "2027-01-01",
          service_lines_json: JSON.stringify([{ auto_renew: "true" }]),
          annualized_value_usd: "194100000",
          total_contract_value_usd: "194100000",
          value_state: "known",
          scope_json: "[]",
          spend_summary_json: "{}",
          gap_flags_json: "[]",
        },
      ]),
      "utf-8",
    );
    await writeFile(
      path.join(dir, "source_vendor_360_projection.csv"),
      csv([
        {
          tenant_key: "meridian-health",
          row_key: "vendor-lapsed",
          vendor_object_id: "vendor-lapsed",
          vendor_name: "Lapsed Vendor",
          contract_count: "1",
          annualized_spend_usd: "140300000",
          contract_ids_json: JSON.stringify(["lapsed-auto-renew"]),
        },
        {
          tenant_key: "meridian-health",
          row_key: "vendor-open",
          vendor_object_id: "vendor-open",
          vendor_name: "Open Vendor",
          contract_count: "1",
          annualized_spend_usd: "214600000",
          contract_ids_json: JSON.stringify(["still-cancellable"]),
        },
        {
          tenant_key: "meridian-health",
          row_key: "vendor-expired",
          vendor_object_id: "vendor-expired",
          vendor_name: "Expired Vendor",
          contract_count: "1",
          annualized_spend_usd: "194100000",
          contract_ids_json: JSON.stringify(["expired-auto-renew"]),
        },
      ]),
      "utf-8",
    );
    await writeFile(
      path.join(dir, "source_event_workspace_projection.csv"),
      csv([
        {
          tenant_key: "meridian-health",
          row_key: "no-events",
          workspace_tab: "events",
          row_type: "empty",
        },
      ]),
      "utf-8",
    );

    const portfolio = await loadSourceWorkspacePortfolio(
      "meridian",
      "2027-06-30T00:00:00Z",
    );

    expect(portfolio.cockpit.verdict.headline).toBe(
      "$140.3M auto-renews with the notice window already passed.",
    );
    expect(portfolio.cockpit.verdict.supports[0]).toMatchObject({
      label: "Auto-renew notice passed",
      value: "$140.3M",
      tone: "fail",
    });
    expect(portfolio.cockpit.verdict.supports[1]).toMatchObject({
      label: "Still cancellable",
      value: "$214.6M",
      tone: "pass",
    });
    expect(
      portfolio.cockpit.actionQueue.map((row) => row.contractId),
    ).not.toContain("expired-auto-renew");
  });

  it("loads Source 360 portfolio data from flagged Azure ECL serving views", async () => {
    process.env.SOURCE_WORKSPACE_PROVIDER = "legacy";
    delete process.env.SOURCE_WORKSPACE_ECL_PROJECTION_DIR;
    const runCalls: { sql: string; params: readonly unknown[] }[] = [];
    mockWithSession.mockImplementation(async (fn) => {
      const run = async <R>(
        sql: string,
        params: readonly unknown[] = [],
      ): Promise<R[]> => {
        runCalls.push({ sql, params });
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
                category_json: { contract_archetype: "finance_bpo" },
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
        if (sql.includes("serving.source_vendor_portfolio")) {
          return [
            {
              payload_json: {
                tenant_key: "meridian-health",
                row_key: "MER-VEN-LEDGERWORKS",
                vendor_object_id: "vendor-object-1",
                vendor_name: "LedgerWorks Shared Services LLC",
                category_json: { supplier_category: "finance_bpo" },
                contract_count: 1,
                annualized_spend_usd: 7200000,
                contract_ids_json: ["MER-CTR-SSO-BPO-001"],
              },
            },
          ] as R[];
        }
        if (sql.includes("serving.source_events")) {
          return [] as R[];
        }
        if (sql.includes("serving.source_compare")) {
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
        if (sql.includes("serving.source_approvals")) {
          return [
            {
              payload_json: {
                tenant_key: "meridian-health",
                row_key: "MER-CTR-SSO-BPO-001:approvals",
                workspace_tab: "approvals",
                row_type: "approval_gate",
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
        if (sql.includes("FROM source.contract_360")) {
          return [
            {
              tenant_key: "meridian-health",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              vendor_category: "Technology / SaaS",
              contract_name: "Microsoft 365 Enterprise Agreement",
              scope_summary: "Enterprise productivity suite.",
              annual_value: 1480000,
              total_committed_value: 4440000,
              committed_annual_spend: 1480000,
              actual_annual_spend: 1452000,
              end_date: "2027-06-30",
              notice_period_days: 90,
              auto_renew: true,
              renewal_decision_state: "notice_window_open",
              renewal_owner_ref: "Technology sourcing",
              benchmarking_clause: "present",
              exit_rights_summary: "Termination assistance applies.",
              alternatives_available: null,
              concentration_note: "Loaded contract-depth package row.",
              source_confidence: 0.92,
              resolved_annual_value: 1480000,
              resolved_total_committed_value: 4440000,
              annual_value_conflict_flag: false,
              total_committed_value_conflict_flag: false,
              scoped_application_count: 2,
              critical_application_count: 1,
              linked_budget_amount: 1452000,
              linked_actual_amount: 1452000,
              linked_budget_lines: 12,
              cloud_sev1_sev2_incidents: 0,
              operational_evidence_gap: false,
              initiative_dependency_count: 0,
            },
          ] as R[];
        }
        if (sql.includes("FROM source.vendor_contract_portfolio")) {
          return [
            {
              tenant_key: "meridian-health",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              vendor_category: "Technology / SaaS",
              contract_count: 1,
              annual_value: 1480000,
              total_committed_value: 4440000,
              auto_renew_contracts: 1,
              next_end_date: "2027-06-30",
              contract_refs: ["MER-TECH-M365-001"],
            },
          ] as R[];
        }
        if (sql.includes("FROM source.contract_evidence_coverage_v1")) {
          return [
            {
              tenant_key: "meridian-health",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
	              contract_name: "Microsoft 365 Enterprise Agreement",
	              spend_rows: 12,
	              actual_spend_usd: 8587900,
	              committed_spend_usd: 8600004,
	              performance_rows: 12,
	              breach_rows: 3,
	              credit_calculated_usd: 43000.02,
	              credit_claimed_usd: 0,
	              credit_recovered_usd: 0,
	              unclaimed_credit_usd: 43000.02,
              opportunity_rows: 1,
              candidate_amount_usd: 1960000,
              finance_confirmation_required_rows: 1,
              opportunities_with_evidence: 1,
              scope_rows: 2,
              critical_scope_rows: 1,
              document_page_text_rows: 6,
              change_order_rows: 1,
              coverage_state: "partial",
              blocker_if_missing:
                "Never present the candidate as realized savings before finance confirmation.",
              evidence_basis_json: { sources: ["synthetic evidence pack"] },
              load_run_id: "test-run",
            },
          ] as R[];
        }
        if (sql.includes("FROM source.contract_action_candidate_v1")) {
          return [
            {
              tenant_key: "meridian-health",
              action_candidate_id: "ACT-M365-SHELFWARE-001",
              opportunity_id: "OPT-M365-SHELFWARE-001",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              title: "Unused license reduction candidate",
              action_type: "optimize",
              opportunity_type: "shelfware",
              finding_summary:
                "Unused entitled seats create an avoidable-cost candidate.",
              deterministic_basis: "usage and spend evidence rows",
              candidate_amount_usd: 1960000,
              priority: "high",
              readiness_state: "ready_for_review",
              evidence_state: "evidence_available",
              authority_state: "owner_review_required",
              finance_confirmation_state: "not_confirmed",
              next_action:
                "Validate reclaim eligibility with application owner.",
              accountable_role: "Technology sourcing",
              decision_due_date: "2027-03-31",
              coverage_state: "partial",
              blocker_if_missing:
                "Needs finance confirmation before realized-value language.",
              citation_basis_json: { rows: ["USAGE-001"] },
              load_run_id: "test-run",
            },
          ] as R[];
        }
        if (sql.includes("FROM source.contract_claim_card_v1")) {
          return [
            {
              tenant_key: "meridian-health",
              claim_card_id: "CLAIM-M365-SHELFWARE-001",
              action_candidate_id: "ACT-M365-SHELFWARE-001",
              opportunity_id: "OPT-M365-SHELFWARE-001",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              claim_title: "Unused license reduction candidate",
              allowed_executive_statement:
                "This contract has an evidence-backed candidate action; finance confirmation is not complete.",
              blocker_if_missing:
                "Never present this candidate as realized savings until finance confirms it.",
              candidate_amount_usd: 1960000,
              finance_confirmation_state: "not_confirmed",
              readiness_state: "ready_for_review",
              evidence_state: "evidence_available",
              citation_basis_json: { rows: ["USAGE-001"] },
              load_run_id: "test-run",
            },
          ] as R[];
        }
        if (sql.includes("FROM source.vendor_position_v1")) {
          return [
            {
              tenant_key: "meridian-health",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              vendor_category: "Technology / SaaS",
              contract_count: 1,
              annual_value: 1480000,
              total_committed_value: 4440000,
              auto_renew_contracts: 1,
              next_end_date: "2027-06-30",
              contract_refs: ["MER-TECH-M365-001"],
              action_candidate_count: 1,
              candidate_amount_usd: 1960000,
              not_confirmed_count: 1,
              decision_ready_contracts: 0,
              unclaimed_credit_usd: 0,
              spend_rows: 12,
              performance_rows: 0,
              vendor_position_state: "candidate_action",
              load_run_id: "test-run",
            },
          ] as R[];
        }
        if (sql.includes("FROM source.source_page_storyline_v1")) {
          return [
            {
              tenant_key: "meridian-health",
              page_key: "workspace",
              section_key: "overview",
              sort_order: 10,
              headline: "Governed contract action rows",
              allowed_executive_statement:
                "The workspace can show action rows, evidence coverage, and blockers.",
              primary_metric_label: "Claim cards",
              primary_metric_value: "1",
              blocker_if_missing: null,
              citation_basis_json: { rows: ["CLAIM-M365-SHELFWARE-001"] },
            },
          ] as R[];
        }
        if (sql.includes("FROM source.ava_grounding_bundle_v1")) {
          return [
            {
              tenant_key: "meridian-health",
              grounding_bundle_id: "AVA-M365-SHELFWARE-001",
              page_key: "contract_action",
              section_key: "ACT-M365-SHELFWARE-001",
              question_family: "value_claim",
              allowed_claims_json: [{ claim: "candidate action exists" }],
              refusal_rules_json: [
                "Refuse realized savings without finance confirmation.",
              ],
              citation_sources_json: { rows: ["CLAIM-M365-SHELFWARE-001"] },
              load_run_id: "test-run",
            },
          ] as R[];
        }
        if (sql.includes("consumption.sourcing_spend_monthly_v1")) {
          return [
            {
              spend_row_count: "12",
              spend_actual: "8587900.00",
              spend_committed: "8600004.00",
              performance_row_count: "12",
              performance_breach_count: "3",
              credit_calculated: "43000.02",
              credit_claimed: "0",
              credit_recovered: "0",
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
    expect(portfolio.workspaceDiagnostics.eclCompareResponseCount).toBeUndefined();
    expect(portfolio.workspaceDiagnostics.eclProjectionDir).toBeNull();
    expect(portfolio.contracts).toHaveLength(1);
    expect(portfolio.vendors).toHaveLength(1);
    expect(portfolio.impact.evidenceCoverage).toHaveLength(1);
    expect(portfolio.impact.actionCandidates).toHaveLength(1);
    expect(portfolio.impact.claimCards).toHaveLength(1);
    expect(portfolio.impact.vendorPositions).toHaveLength(1);
    expect(portfolio.impact.storyline).toHaveLength(1);
    expect(portfolio.impact.avaGroundingBundles).toHaveLength(1);
    expect(
      portfolio.contracts.find(
        (row) => row.contract_id === "MER-TECH-M365-001",
      ),
    ).toBeUndefined();
    expect(
      portfolio.contracts.find(
        (row) => row.contract_id === "MER-CTR-SSO-BPO-001",
      ),
    ).toMatchObject({
      annual_value: 7200000,
      vendor_category: "finance_bpo",
      actual_annual_spend: 5100000,
      operational_evidence_gap: true,
    });
    expect(portfolio.v4Snapshot.availability).toEqual(
      expect.arrayContaining([
        { lensId: "executive_portfolio", state: "available", rowCount: 1 },
        { lensId: "vendor_concentration", state: "available", rowCount: 1 },
        { lensId: "spend_consumption", state: "available", rowCount: 12 },
        { lensId: "performance_credits", state: "available", rowCount: 12 },
        { lensId: "context_coverage", state: "available", rowCount: 2 },
      ]),
    );
    expect(portfolio.v4Snapshot.spendConsumption.actualSpend).toBe(8587900);
    expect(portfolio.v4Snapshot.performanceCredits.unclaimedCredit).toBe(
      43000.02,
    );
    expect(
      runCalls.filter((call) => call.sql.includes("set_config")),
    ).toContainEqual({
      sql: "SELECT set_config('app.tenant_key', $1, false)",
      params: ["meridian-health"],
    });
    expect(
      runCalls.some((call) => call.sql.includes("serving.source_events")),
    ).toBe(false);
    expect(
      runCalls
        .filter((call) => call.sql.includes("FROM serving."))
        .every((call) =>
          call.sql.includes("AND assessment_id = $2"),
        ),
    ).toBe(true);
    expect(
      runCalls
        .filter((call) => call.sql.includes("FROM serving."))
        .every((call) =>
          call.params.includes("assessment-dense-source-room-20260823"),
        ),
    ).toBe(true);
    expect(
      runCalls.find((call) =>
        call.sql.includes("ecl_projection.cube_slice"),
      ),
    ).toMatchObject({
      params: [
        expect.arrayContaining(["meridian-health"]),
        "assessment-dense-source-room-20260823",
        ["source_contract_cube", "source_vendor_cube"],
      ],
    });
    expect(
      runCalls.some((call) => call.sql.includes("serving.source_compare")),
    ).toBe(false);
    expect(
      runCalls.some((call) => call.sql.includes("serving.source_approvals")),
    ).toBe(false);
    expect(
      runCalls.some((call) =>
        call.sql.includes("source.contract_claim_card_v1"),
      ),
    ).toBe(true);
    expect(
      runCalls.some((call) =>
        call.sql.includes("FROM consumption.sourcing_spend_monthly_v1"),
      ),
    ).toBe(false);
    expect(
      portfolio.cockpit.proofLayers.sourceSystems.find(
        (row) => row.name === "executive_portfolio",
      ),
    ).toMatchObject({
      note: "Returned by governed ECL projection read.",
      rowCount: 1,
      state: "available",
    });
    expect(
      portfolio.applicationScope.map((row) => row.application_name),
    ).toEqual(["Workday Finance", "BlackLine Account Reconciliations"]);
  });

  it("completes partial prebuilt impact views with derived claim and aVa grounding", async () => {
    process.env.SOURCE_WORKSPACE_PROVIDER = "ecl_projection_db";
    const runCalls: Array<{ sql: string; params: readonly unknown[] }> = [];
    mockWithSession.mockImplementation(async (fn) => {
      const run = async <R>(sql: string, params: readonly unknown[]) => {
        runCalls.push({ sql, params });
        if (sql.includes("set_config")) return [] as R[];
        if (sql.includes("serving.source_contract_360")) {
          return [
            {
              payload_json: {
                tenant_key: "meridian-health",
                row_key: "MER-TECH-M365-001",
                contract_id: "MER-TECH-M365-001",
                vendor_object_id: "vendor-microsoft",
                vendor_name: "Microsoft Corporation",
                contract_name: "Microsoft 365 Enterprise Agreement",
                annualized_value_usd: "1480000",
                total_contract_value_usd: "4440000",
                renewal_notice_date: "2027-03-31",
                end_date: "2027-06-30",
                value_state: "known",
                scope_json: "[]",
                spend_summary_json: "{}",
                gap_flags_json: "[]",
              },
            },
          ] as R[];
        }
        if (sql.includes("serving.source_vendor_360")) {
          return [
            {
              payload_json: {
                tenant_key: "meridian-health",
                row_key: "vendor-microsoft",
                vendor_object_id: "vendor-microsoft",
                vendor_name: "Microsoft Corporation",
                contract_count: "1",
                annualized_spend_usd: "1480000",
                contract_ids_json: JSON.stringify(["MER-TECH-M365-001"]),
              },
            },
          ] as R[];
        }
        if (
          sql.includes("serving.source_events") ||
          sql.includes("serving.source_compare") ||
          sql.includes("serving.source_approvals") ||
          sql.includes("ecl_projection.cube_slice")
        ) {
          return [] as R[];
        }
        if (sql.includes("FROM source.contract_action_candidate_v1")) {
          return [
            {
              tenant_key: "meridian-health",
              action_candidate_id: "OPT-M365-SHELFWARE-001",
              opportunity_id: "OPT-M365-SHELFWARE-001",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              title: "Unused license reduction candidate",
              action_type: "optimize",
              opportunity_type: "shelfware",
              finding_summary:
                "Unused entitled seats create an avoidable-cost candidate.",
              deterministic_basis: "usage and spend evidence rows",
              candidate_amount_usd: "1960000",
              priority: "high",
              readiness_state: "finance_confirmation_required",
              evidence_state: "present",
              authority_state: "owner_review_required",
              finance_confirmation_state: "not_confirmed",
              next_action: "Validate reclaim eligibility.",
              accountable_role: "Technology sourcing",
              decision_due_date: "2027-03-31",
              coverage_state: null,
              blocker_if_missing:
                "Never present this candidate as realized savings until finance confirms it.",
              citation_basis_json: {
                opportunity_ref: "OPT-M365-SHELFWARE-001",
              },
              load_run_id: "test-run",
            },
          ] as R[];
        }
        if (
          sql.includes("FROM source.contract_evidence_coverage_v1") ||
          sql.includes("FROM source.contract_claim_card_v1") ||
          sql.includes("FROM source.vendor_position_v1") ||
          sql.includes("FROM source.source_page_storyline_v1") ||
          sql.includes("FROM source.ava_grounding_bundle_v1")
        ) {
          return [] as R[];
        }
        if (
          sql.includes("consumption.sourcing_spend_monthly_v1") &&
          sql.includes("performance AS") &&
          sql.includes("spend_row_count")
        ) {
          return [
            {
              spend_row_count: "12",
              spend_actual: "1452000.00",
              spend_committed: "1480000.00",
              performance_row_count: "0",
              performance_breach_count: "0",
              credit_calculated: "0",
              credit_claimed: "0",
              credit_recovered: "0",
            },
          ] as R[];
        }
        if (sql.includes("FROM source.contract_360 c")) {
          return [
            {
              tenant_key: "meridian-health",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              contract_name: "Microsoft 365 Enterprise Agreement",
              spend_rows: "12",
              actual_spend_usd: "1452000",
              committed_spend_usd: "1480000",
              performance_rows: "0",
              breach_rows: "0",
              credit_calculated_usd: "0",
              credit_claimed_usd: "0",
              credit_recovered_usd: "0",
              unclaimed_credit_usd: "0",
              opportunity_rows: "1",
              candidate_amount_usd: "1960000",
              finance_confirmation_required_rows: "1",
              opportunities_with_evidence: "1",
              scope_rows: "2",
              critical_scope_rows: "1",
              document_page_text_rows: "6",
              change_order_rows: "1",
              coverage_state: "partial",
              blocker_if_missing:
                "finance confirmation required before realized-value claim",
              evidence_basis_json: { rows: ["SPEND-001", "CLAUSE-001"] },
              load_run_id: "test-run",
            },
          ] as R[];
        }
        if (sql.includes("FROM consumption.sourcing_opportunity_v1 o")) {
          return [
            {
              tenant_key: "meridian-health",
              action_candidate_id: "OPT-M365-SHELFWARE-001",
              opportunity_id: "OPT-M365-SHELFWARE-001",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              title: "Unused license reduction candidate",
              action_type: "optimize",
              opportunity_type: "shelfware",
              finding_summary:
                "Unused entitled seats create an avoidable-cost candidate.",
              deterministic_basis: "usage and spend evidence rows",
              candidate_amount_usd: "1960000",
              priority: "high",
              readiness_state: "finance_confirmation_required",
              evidence_state: "present",
              authority_state: "owner_review_required",
              finance_confirmation_state: "not_confirmed",
              next_action: "Validate reclaim eligibility.",
              accountable_role: "Technology sourcing",
              decision_due_date: "2027-03-31",
              coverage_state: null,
              blocker_if_missing:
                "Never present this candidate as realized savings until finance confirms it.",
              citation_basis_json: {
                opportunity_ref: "OPT-M365-SHELFWARE-001",
              },
              load_run_id: "test-run",
            },
          ] as R[];
        }
        if (sql.includes("FROM source.vendor_contract_portfolio")) {
          return [
            {
              tenant_key: "meridian-health",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              vendor_category: "Technology / SaaS",
              contract_count: "1",
              annual_value: "1480000",
              total_committed_value: "4440000",
              auto_renew_contracts: "1",
              next_end_date: "2027-06-30",
              contract_refs: ["MER-TECH-M365-001"],
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

    expect(portfolio.impact.actionCandidates).toHaveLength(1);
    expect(portfolio.impact.claimCards).toHaveLength(1);
    expect(portfolio.impact.claimCards[0]).toMatchObject({
      action_candidate_id: "OPT-M365-SHELFWARE-001",
      contract_id: "MER-TECH-M365-001",
      finance_confirmation_state: "not_confirmed",
    });
    expect(
      portfolio.impact.avaGroundingBundles.some(
        (row) =>
          row.page_key === "contract_action" &&
          row.section_key === "OPT-M365-SHELFWARE-001",
      ),
    ).toBe(true);
    expect(
      runCalls.some((call) =>
        call.sql.includes("FROM consumption.sourcing_opportunity_v1 o"),
      ),
    ).toBe(true);
  });

  it("derives impact cards from base Source and consumption views when prebuilt impact views are empty", async () => {
    process.env.SOURCE_WORKSPACE_PROVIDER = "ecl_projection_db";
    const runCalls: Array<{ sql: string; params: readonly unknown[] }> = [];
    mockWithSession.mockImplementation(async (fn) => {
      const run = async <R>(sql: string, params: readonly unknown[]) => {
        runCalls.push({ sql, params });
        if (sql.includes("set_config")) return [] as R[];
        if (sql.includes("serving.source_contract_360")) {
          return [
            {
              payload_json: {
                tenant_key: "meridian-health",
                row_key: "MER-CTR-SSO-BPO-001",
                vendor_object_id: "vendor-ledgerworks",
                vendor_name: "LedgerWorks Shared Services LLC",
                contract_name: "Finance Shared Services BPO",
                annualized_value_usd: "7200000",
                total_contract_value_usd: "21600000",
                end_date: "2027-12-31",
                scope_json: "[]",
                spend_summary_json: "{}",
                gap_flags_json: "[]",
                value_state: "known",
              },
            },
          ] as R[];
        }
        if (sql.includes("serving.source_vendor_portfolio")) {
          return [
            {
              payload_json: {
                tenant_key: "meridian-health",
                row_key: "MER-VEN-LEDGERWORKS",
                vendor_object_id: "vendor-ledgerworks",
                vendor_name: "LedgerWorks Shared Services LLC",
                contract_count: "1",
                annualized_spend_usd: "7200000",
                contract_ids_json: JSON.stringify(["MER-CTR-SSO-BPO-001"]),
              },
            },
          ] as R[];
        }
        if (
          sql.includes("serving.source_events") ||
          sql.includes("serving.source_compare") ||
          sql.includes("serving.source_approvals") ||
          sql.includes("ecl_projection.cube_slice")
        ) {
          return [] as R[];
        }
        if (sql.includes("FROM source.contract_evidence_coverage_v1")) {
          return [
            {
              tenant_key: "meridian-health",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              contract_name: "Microsoft 365 Enterprise Agreement",
              spend_rows: "0",
              actual_spend_usd: "0",
              committed_spend_usd: "0",
              performance_rows: "0",
              breach_rows: "0",
              credit_calculated_usd: "0",
              credit_claimed_usd: "0",
              credit_recovered_usd: "0",
              unclaimed_credit_usd: "0",
              opportunity_rows: "0",
              candidate_amount_usd: "0",
              finance_confirmation_required_rows: "0",
              opportunities_with_evidence: "0",
              scope_rows: "0",
              critical_scope_rows: "0",
              document_page_text_rows: "0",
              change_order_rows: "0",
              coverage_state: "not_loaded",
              blocker_if_missing: "legacy coverage row only",
              evidence_basis_json: {},
              load_run_id: "legacy-impact-view",
            },
          ] as R[];
        }
        if (
          sql.includes("FROM source.contract_action_candidate_v1") ||
          sql.includes("FROM source.contract_claim_card_v1") ||
          sql.includes("FROM source.vendor_position_v1") ||
          sql.includes("FROM source.source_page_storyline_v1") ||
          sql.includes("FROM source.ava_grounding_bundle_v1")
        ) {
          return [] as R[];
        }
        if (
          sql.includes("consumption.sourcing_spend_monthly_v1") &&
          sql.includes("performance AS") &&
          sql.includes("spend_row_count")
        ) {
          return [
            {
              spend_row_count: "12",
              spend_actual: "1452000.00",
              spend_committed: "1480000.00",
              performance_row_count: "3",
              performance_breach_count: "1",
              credit_calculated: "25000.00",
              credit_claimed: "0",
              credit_recovered: "0",
            },
          ] as R[];
        }
        if (sql.includes("FROM source.contract_360 c")) {
          return [
            {
              tenant_key: "meridian-health",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              contract_name: "Microsoft 365 Enterprise Agreement",
              spend_rows: "12",
              actual_spend_usd: "1452000",
              committed_spend_usd: "1480000",
              performance_rows: "3",
              breach_rows: "1",
              credit_calculated_usd: "25000",
              credit_claimed_usd: "0",
              credit_recovered_usd: "0",
              unclaimed_credit_usd: "25000",
              opportunity_rows: "1",
              candidate_amount_usd: "1960000",
              finance_confirmation_required_rows: "1",
              opportunities_with_evidence: "1",
              scope_rows: "2",
              critical_scope_rows: "1",
              document_page_text_rows: "6",
              change_order_rows: "1",
              coverage_state: "decision_ready",
              blocker_if_missing:
                "finance confirmation required before realized-value claim",
              evidence_basis_json: { rows: ["SPEND-001", "SLA-001"] },
              load_run_id: "test-run",
            },
          ] as R[];
        }
        if (sql.includes("FROM consumption.sourcing_opportunity_v1 o")) {
          return [
            {
              tenant_key: "meridian-health",
              action_candidate_id: "OPT-M365-SHELFWARE-001",
              opportunity_id: "OPT-M365-SHELFWARE-001",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              title: "Unused license reduction candidate",
              action_type: "optimize",
              opportunity_type: "shelfware",
              finding_summary:
                "Unused entitled seats create an avoidable-cost candidate.",
              deterministic_basis: "usage and spend evidence rows",
              candidate_amount_usd: "1960000",
              priority: "high",
              readiness_state: "finance_confirmation_required",
              evidence_state: "present",
              authority_state: "owner_review_required",
              finance_confirmation_state: "not_confirmed",
              next_action: "Validate reclaim eligibility.",
              accountable_role: "Technology sourcing",
              decision_due_date: "2027-03-31",
              coverage_state: null,
              blocker_if_missing:
                "Never present this candidate as realized savings until finance confirms it.",
              citation_basis_json: {
                opportunity_ref: "OPT-M365-SHELFWARE-001",
              },
              load_run_id: "test-run",
            },
          ] as R[];
        }
        if (sql.includes("FROM source.vendor_contract_portfolio")) {
          return [
            {
              tenant_key: "meridian-health",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              vendor_category: "Technology / SaaS",
              contract_count: "1",
              annual_value: "1480000",
              total_committed_value: "4440000",
              auto_renew_contracts: "1",
              next_end_date: "2027-06-30",
              contract_refs: ["MER-TECH-M365-001"],
            },
          ] as R[];
        }
        if (sql.includes("FROM source.contract_360")) {
          return [
            {
              tenant_key: "meridian-health",
              contract_id: "MER-TECH-M365-001",
              vendor_ref: "vendor-microsoft",
              vendor_name: "Microsoft Corporation",
              vendor_category: "Technology / SaaS",
              contract_name: "Microsoft 365 Enterprise Agreement",
              scope_summary: "Enterprise productivity suite.",
              annual_value: 1480000,
              total_committed_value: 4440000,
              committed_annual_spend: 1480000,
              actual_annual_spend: 1452000,
              end_date: "2027-06-30",
              notice_period_days: 90,
              auto_renew: true,
              renewal_decision_state: "notice_window_open",
              renewal_owner_ref: "Technology sourcing",
              benchmarking_clause: "present",
              exit_rights_summary: "Termination assistance applies.",
              alternatives_available: null,
              concentration_note: "Loaded contract-depth package row.",
              source_confidence: 0.92,
              resolved_annual_value: 1480000,
              resolved_total_committed_value: 4440000,
              annual_value_conflict_flag: false,
              total_committed_value_conflict_flag: false,
              scoped_application_count: 2,
              critical_application_count: 1,
              linked_budget_amount: 1452000,
              linked_actual_amount: 1452000,
              linked_budget_lines: 12,
              cloud_sev1_sev2_incidents: 0,
              operational_evidence_gap: false,
              initiative_dependency_count: 0,
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

    expect(portfolio.impact.evidenceCoverage).toHaveLength(1);
    expect(portfolio.impact.evidenceCoverage[0]).toMatchObject({
      contract_id: "MER-TECH-M365-001",
      spend_rows: 12,
      coverage_state: "decision_ready",
      load_run_id: "test-run",
    });
    expect(portfolio.impact.actionCandidates).toHaveLength(1);
    expect(portfolio.impact.claimCards).toHaveLength(1);
    expect(portfolio.impact.vendorPositions).toHaveLength(1);
    expect(portfolio.impact.storyline).toHaveLength(5);
    expect(portfolio.impact.storyline[0]).toMatchObject({
      headline: "Governed contract depth layer",
      primary_metric_label: "Depth contracts",
      primary_metric_value: "1",
    });
    expect(
      portfolio.impact.storyline[0].allowed_executive_statement,
    ).toContain("separate from the portfolio-register contract count");
    expect(portfolio.impact.storyline[0].citation_basis_json).toMatchObject({
      "source.contract_action_candidate_v1": 1,
    });
    expect(portfolio.impact.avaGroundingBundles).toHaveLength(6);
    expect(portfolio.impact.claimCards[0]).toMatchObject({
      contract_id: "MER-TECH-M365-001",
      finance_confirmation_state: "not_confirmed",
      candidate_amount_usd: 1960000,
    });
    expect(
      runCalls.some((call) =>
        call.sql.includes("FROM source.contract_evidence_coverage_v1"),
      ),
    ).toBe(true);
    expect(
      runCalls.some((call) =>
        call.sql.includes("FROM consumption.sourcing_opportunity_v1 o"),
      ),
    ).toBe(true);
  });

  it("separates stale renewal dates from lapsed auto-renew exposure in cockpit proof", () => {
    const contracts = [
      {
        tenant_key: "meridian-health",
        contract_id: "expired-auto-renew",
        vendor_ref: "vendor-expired",
        vendor_name: "Expired Vendor",
        vendor_category: "Technology",
        contract_name: "Expired contract",
        scope_summary: null,
        annual_value: 194_100_000,
        total_committed_value: 194_100_000,
        committed_annual_spend: 194_100_000,
        actual_annual_spend: null,
        end_date: "2027-01-01",
        notice_period_days: 90,
        auto_renew: true,
        renewal_decision_state: null,
        renewal_owner_ref: null,
        benchmarking_clause: null,
        exit_rights_summary: null,
        alternatives_available: null,
        concentration_note: null,
        source_confidence: 0.9,
        resolved_annual_value: null,
        resolved_total_committed_value: null,
        annual_value_conflict_flag: false,
        total_committed_value_conflict_flag: false,
        scoped_application_count: null,
        critical_application_count: null,
        linked_budget_amount: null,
        linked_actual_amount: null,
        linked_budget_lines: null,
        cloud_sev1_sev2_incidents: null,
        operational_evidence_gap: null,
        initiative_dependency_count: null,
        concentration_risk: "low",
        utilization_evidence:
          "8% of provisioned entitlements show no recorded activity in the trailing 90 days",
      },
      {
        tenant_key: "meridian-health",
        contract_id: "lapsed-auto-renew",
        vendor_ref: "vendor-lapsed",
        vendor_name: "Lapsed Vendor",
        vendor_category: "Technology",
        contract_name: "Lapsed notice contract",
        scope_summary: null,
        annual_value: 140_300_000,
        total_committed_value: 140_300_000,
        committed_annual_spend: 140_300_000,
        actual_annual_spend: null,
        end_date: "2027-12-31",
        notice_period_days: 365,
        auto_renew: true,
        renewal_decision_state: null,
        renewal_owner_ref: null,
        benchmarking_clause: null,
        exit_rights_summary: null,
        alternatives_available: null,
        concentration_note: null,
        source_confidence: 0.9,
        resolved_annual_value: null,
        resolved_total_committed_value: null,
        annual_value_conflict_flag: false,
        total_committed_value_conflict_flag: false,
        scoped_application_count: null,
        critical_application_count: null,
        linked_budget_amount: null,
        linked_actual_amount: null,
        linked_budget_lines: null,
        cloud_sev1_sev2_incidents: null,
        operational_evidence_gap: null,
        initiative_dependency_count: null,
        concentration_risk: "low",
        utilization_evidence:
          "8% of provisioned entitlements show no recorded activity in the trailing 90 days",
      },
      {
        tenant_key: "meridian-health",
        contract_id: "still-cancellable",
        vendor_ref: "vendor-open",
        vendor_name: "Open Vendor",
        vendor_category: "Technology",
        contract_name: "Open notice contract",
        scope_summary: null,
        annual_value: 214_600_000,
        total_committed_value: 214_600_000,
        committed_annual_spend: 214_600_000,
        actual_annual_spend: null,
        end_date: "2028-06-30",
        notice_period_days: 90,
        auto_renew: true,
        renewal_decision_state: null,
        renewal_owner_ref: null,
        benchmarking_clause: null,
        exit_rights_summary: null,
        alternatives_available: null,
        concentration_note: null,
        source_confidence: 0.9,
        resolved_annual_value: null,
        resolved_total_committed_value: null,
        annual_value_conflict_flag: false,
        total_committed_value_conflict_flag: false,
        scoped_application_count: null,
        critical_application_count: null,
        linked_budget_amount: null,
        linked_actual_amount: null,
        linked_budget_lines: null,
        cloud_sev1_sev2_incidents: null,
        operational_evidence_gap: null,
        initiative_dependency_count: null,
        concentration_risk: "low",
        utilization_evidence:
          "8% of provisioned entitlements show no recorded activity in the trailing 90 days",
      },
    ];
    const cockpit = buildSourceVendor360Cockpit({
      contracts,
      vendors: [],
      applicationScope: [],
      initiativeDependencies: [],
      v4Snapshot: createEmptySourceV4WorkspaceSnapshot("2027-06-30T00:00:00Z"),
      workspaceDiagnostics: {
        datasetLabel: "test dataset",
        datasetId: "test",
        datasetVersion: "test",
        analyticsProvider: "test",
        activeLoadRunId: null,
        asOfDateIso: "2027-06-30T00:00:00Z",
        v4ContractCount: 3,
        v4VendorCount: 3,
        legacyContractCount: 3,
        legacyVendorCount: 3,
        exploreProvider: "EclProjectionDbProvider",
        exploreMatchesV4: true,
        mismatchWarning: null,
      },
      reads: {
        contracts: "available",
        vendors: "missing",
        applicationScope: "missing",
        initiativeDependencies: "missing",
      },
      asOfDateIso: "2027-06-30T00:00:00Z",
    });

    expect(cockpit.verdict.headline).toBe(
      "$140.3M auto-renews with the notice window already passed.",
    );
    expect(cockpit.verdict.decidingAxis).toContain(
      "$214.6M remains cancellable",
    );
    expect(cockpit.verdict.bindingChip).toContain(
      "noticeDeadlinePassedAutoRenew",
    );
    expect(cockpit.verdict.supports[0]).toMatchObject({
      label: "Auto-renew notice passed",
      value: "$140.3M",
      tone: "fail",
    });
    expect(cockpit.verdict.supports[1]).toMatchObject({
      label: "Still cancellable",
      value: "$214.6M",
      tone: "pass",
    });
    expect(cockpit.proofLayers.evidenceBehindVerdict[0].value).toContain(
      "1 auto-renew lapsed notice rows",
    );
    expect(cockpit.proofLayers.evidenceBehindVerdict[0].value).toContain(
      "$140.3M exposed",
    );
    expect(cockpit.proofLayers.evidenceBehindVerdict[0].value).toContain(
      "$214.6M still cancellable",
    );
    expect(cockpit.proofLayers.evidenceBehindVerdict[0].value).toContain(
      "1 expired contract exclusions",
    );
    expect(cockpit.proofLayers.evidenceBehindVerdict[0].value).toContain(
      "0 past renewal/notice rows",
    );
    expect(cockpit.actionQueue.map((row) => row.contractId)).not.toContain(
      "expired-auto-renew",
    );
    expect(cockpit.claimQualityControls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Stale renewal dates",
          value: "1 excluded",
          tone: "warn",
        }),
        expect.objectContaining({
          label: "Concentration risk",
          value: "Open Vendor 39.1%",
          tone: "pass",
        }),
        expect.objectContaining({
          label: "Utilization evidence",
          value: "3 template rows blocked",
          tone: "fail",
        }),
      ]),
    );
    expect(
      cockpit.claimQualityControls.find(
        (control) => control.label === "Concentration risk",
      )?.note,
    ).toMatch(/asserted concentration labels are treated as data assertions/i);
  });
});
