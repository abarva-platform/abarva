import { buildCloudContractIntelligenceRecords } from "../cloud-adapter";
import type { CsvRecord } from "../../contract-depth-package/projection";

const contract: CsvRecord = {
  tenant_key: "synthetic-tenant",
  dataset_version: "cloud-package-1",
  source_row_id: "contract:cloud-1",
  contract_id: "cloud-1",
  vendor_ref: "vendor-cloud",
  vendor_name: "Synthetic Cloud Vendor",
  contract_name: "Cloud commitment agreement",
  category: "Cloud data platform subscription",
  archetype: "cloud_consumption_commit",
  annual_value_usd: "1891000",
  committed_annual_spend_usd: "1550000",
  actual_annual_spend_usd: "66100",
  start_date: "2026-01-01",
  end_date: "2030-12-31",
  notice_period_days: "90",
  context_review_state: "reviewed",
  context_reviewer_role: "Contract intelligence reviewer",
  context_reviewed_at: "2026-09-01T00:00:00Z",
  contract_english_overview: "A governed cloud commitment buys platform capacity ahead of usage.",
  scope_english_summary: "Two named analytics workloads are in scope.",
  commercial_thesis: "Re-time the commitment to delivery pace.",
  evidence_boundary_summary: "Usage, coverage, AP, scope, and opportunities are loaded.",
};

function row(sourceRowId: string, extra: CsvRecord = {}): CsvRecord {
  return { contract_id: "cloud-1", source_row_id: sourceRowId, ...extra };
}

describe("buildCloudContractIntelligenceRecords", () => {
  it("keeps native cloud evidence separate and exposes all structured levers", () => {
    const records = buildCloudContractIntelligenceRecords({
      contracts: [contract],
      applicationScope: [row("scope-1", { application_name: "Analytics workload" })],
      contractClauses: [row("clause-1")],
      evidenceManifest: [row("DOC-1", { source_file_id: "DOC-1" })],
      monthlySpend: [row("spend-1", { actual_spend_usd: "100" })],
      serviceUsage: [row("usage-1", { total_spend_usd: "100" })],
      commitmentCoverage: [row("coverage-1")],
      apReconciliation: [row("ap-1")],
      resourceInventory: [row("resource-1")],
      optimizationOpportunities: [
        row("opp-exact", {
          opportunity_id: "opp-exact",
          opportunity_type: "negotiated_improvement",
          title: "Re-time commitment",
          buyer_ask: "Use a ramp.",
          negotiation_language: "Tie the ramp to production gates.",
          vendor_concession: "Accept milestone billing.",
          evidence_family: "cloud_consumption",
          amount_low_usd: "100",
          amount_high_usd: "200",
          amount_state: "range",
          evidence_grade: "document_evidenced",
          evidence_rows: "coverage-1",
          owner_role: "Cloud FinOps",
          priority: "P0",
          timing_dependency: "Before renewal",
          risk_if_ignored: "Shelfware persists",
        }),
        row("opp-signal", {
          opportunity_id: "opp-signal",
          opportunity_type: "negotiated_improvement",
          buyer_ask: "Load benchmark evidence.",
          negotiation_language: "Re-open the discount question after evidence loads.",
          vendor_concession: "Review discount band.",
          evidence_grade: "system_evidenced",
          amount_state: "not_sized",
          evidence_rows: "usage-1",
          owner_role: "Sourcing",
          priority: "P1",
          timing_dependency: "Before amendment",
          risk_if_ignored: "Missed review",
        }),
      ],
    });

    expect(records).toHaveLength(1);
    expect(records[0].story.purpose).toContain("governed cloud commitment");
    expect(records[0].story.scope).toContain("Two named analytics workloads");
    expect(records[0].levers).toHaveLength(2);
    expect(records[0].levers[0].amountState).toBe("range");
    expect(records[0].levers[1].amountState).toBe("not_sized");
    expect(records[0].baseline.metrics.find((metric) => metric.key === "observed_spend")?.value).toBe("$100");
    expect(records[0].evidenceLanes.find((lane) => lane.key === "cloud_usage")?.rowCount).toBe(1);
    expect(records[0].evidenceLanes.find((lane) => lane.key === "commitment_coverage")?.state).toBe("loaded");
    expect(records[0].anatomy.nodes.some((node) => node.label === "Cloud resources")).toBe(true);
    expect(records[0].review.status).toBe("reviewed");
  });
});
