import { azureRead } from "@/lib/data-plane/azureRead";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { readTowerCommandCenter } from "../readTowerCommandCenter";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

const query = azureRead.query as jest.MockedFunction<typeof azureRead.query>;

describe("readTowerCommandCenter", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("fails closed for tenants that are not present in tower.value_claim", async () => {
    query.mockResolvedValueOnce([]);

    const result = await readTowerCommandCenter({
      tenantKeyCandidates: ["apex-retail"],
    });

    expect(result).toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[1]).toEqual(["apex-retail"]);
  });

  it("maps SkyHarbor aliases to the governed tower schema tenant without using cio_tower mart tables", async () => {
    query
      .mockResolvedValueOnce([
        {
          tenant_key: "skyharbor_global",
          claim_count: 162,
          known_value_claim_count: 0,
          unknown_value_claim_count: 162,
          known_zero_value_claim_count: 0,
          known_value_amount_usd: "0",
          finance_attested_claim_count: 0,
          business_attested_claim_count: 0,
          claimable_count: 0,
          usage_supported_count: 12,
          funded_no_baseline_count: 150,
          stale_count: 0,
          disputed_count: 0,
        },
      ])
      .mockResolvedValueOnce([
        {
          total_budget_usd: "2180000000",
          target_budget_usd: "2350000000",
          actual_spend_usd: "3770437521",
          run_budget_usd: "1363000000",
          change_budget_usd: "987000000",
          ai_tagged_spend_usd: "170249334",
        },
      ])
      .mockResolvedValueOnce([
        {
          claim_id: "claim-project-PRJ-001",
          subject_ref: "PRJ-001",
          title: "Operational Resilience Wave 1",
          owner_role: "Transformation owner",
          funding_status: "Approved",
          status: "Awaiting decision",
          priority: "High",
          source_file: "csv/enterprise_it/6_projects_investments.csv",
          source_row: "2",
          claim_state: "funded_no_baseline",
          blocked_reason: "Missing governed baseline/target/actual and business/finance attestation.",
          next_gate: "Capture value outcome ledger and metric provenance.",
          next_gate_owner_role: "Finance partner",
          quality_guardrail_state: "not_evaluated",
          risk_guardrail_state: "not_evaluated",
        },
      ])
      .mockResolvedValueOnce([
        {
          subject_ref: "TOOL-github-copilot",
          title: "GitHub Copilot",
          subject_kind: "developer_ai_tool",
          vendor_ref: "VEN-001",
          owner_role: "Developer platform owner",
          active_users: "4186",
          seats_purchased: "11998",
          estimated_use_cost: "1581589",
          active_user_rate: "0.349",
          claim_state: "usage_supported",
          blocked_reason: "Outcome evidence and attestation are missing.",
          source_file: "csv/enterprise_it/ai_adoption_usage.csv",
          source_row: "10",
        },
      ])
      .mockResolvedValueOnce([
        {
          provenance_id: "prov-1",
          source_system: "AI tool admin exports",
          source_report: null,
          source_schema: "raw_enterprise_it",
          source_table: "ai_adoption_usage",
          source_file_id: "rawfile-1",
          source_row_pointer: null,
          formula: "source_value",
          formula_version: "tower_formula_v1",
          attestation_status: "not_attested",
          observation_count: 480,
          result_hashes: ["abc"],
        },
      ]);

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["skyharbor-air"],
    });
    const sqlText = query.mock.calls.map((call) => String(call[0])).join("\n");

    expect(sqlText).not.toMatch(/cio_tower/i);
    expect(mart?.generatedFrom).toBe("tower_schema");
    expect(mart?.command.unknownValueClaimCount).toBe(162);
    expect(mart?.command.promisedValueFy26).toBe(0);

    const view = buildTowerCommandCenterView(mart, {
      tenantName: "SkyHarbor Air",
    });
    expect(view?.summary.unknownValueClaimCount).toBe(162);
    expect(view?.summary.knownValueClaimCount).toBe(0);
    expect(view?.summary.promisedUsd).toBe(0);
    expect(view?.summary.executiveSummary).toMatch(/unknown financial amount/i);
  });
});
