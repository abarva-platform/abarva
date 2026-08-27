import { azureRead } from "@/lib/data-plane/azureRead";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { readTowerCommandCenter } from "../readTowerCommandCenter";

jest.mock("@/lib/data-plane/azureRead", () => {
  const query = jest.fn();
  const withSession = jest.fn(async (fn) =>
    fn((sql: string, params: unknown[]) => {
      if (/set_config\('app\.tenant_key'/i.test(sql)) {
        return Promise.resolve([]);
      }
      return query(sql, params);
    }),
  );

  return {
    azureRead: {
      query,
      withSession,
    },
  };
});

const query = azureRead.query as jest.MockedFunction<typeof azureRead.query>;
const withSession = azureRead.withSession as jest.MockedFunction<
  typeof azureRead.withSession
>;

function sourceRefs() {
  return [
    {
      source_family: "SP08_Vendor_Contract",
      source_record_id: "source-record-1",
      source_field: "annualized_value_usd",
    },
  ];
}

function servingRow(overrides: Record<string, unknown> = {}) {
  const payload = {
    row_key: "row-1",
    page_key: "decision_lanes",
    claim_id: "claim-1",
    claim_gate_status: "blocked",
    claim_gate_reason_code: "finance_validation_required",
    claim_gate_reason_detail: "Finance validation is required.",
    next_gate: "finance_review",
    evidence_needed_json: ["baseline_measure", "finance_owner_attestation"],
    funded_amount_usd: "1000000",
    promised_value_usd: "2500000",
    usage_supported_value_usd: "500000",
    finance_validated_value_usd: "0",
    claimable_value_usd: "0",
    blocked_value_usd: "2500000",
    proof_maturity_score: 30,
    risk_pressure_score: 70,
    usage_strength_score: 45,
    owner_role: "program_sponsor",
    display_payload_json: {
      title: "Revenue-cycle automation",
      program_id: "PROG-001",
    },
    ...overrides,
  };
  return {
    tenant_key: "meridian-health",
    assessment_id: "assessment-dense-source-room-20260823",
    projection_version: 1,
    source_hash: "hash",
    basis: "source_recorded",
    value_state: "known",
    review_state: "not_reviewed",
    origin: "synthetic_generator",
    gap_flags_json: [],
    projection_row_id: "projection-row-1",
    page_key: String(payload.page_key),
    row_key: String(payload.row_key),
    row_type: "program_value_gate",
    title: "Revenue-cycle automation",
    summary: "Finance validation is required.",
    primary_object_id: "object-1",
    source_refs_json: sourceRefs(),
    payload_json: payload,
  };
}

function mockServingRows(rowsByView: Record<string, unknown[]>) {
  query.mockImplementation(async (sql) => {
    const text = String(sql);
    for (const [view, rows] of Object.entries(rowsByView)) {
      if (text.includes(`serving.${view}`)) return rows;
    }
    return [];
  });
}

describe("readTowerCommandCenter", () => {
  beforeEach(() => {
    query.mockReset();
    withSession.mockClear();
  });

  it("fails closed when ECL serving rows are not loaded for a tenant", async () => {
    query.mockResolvedValue([]);

    const result = await readTowerCommandCenter({
      tenantKeyCandidates: ["apex-retail"],
    });

    expect(result).toBeNull();
    expect(withSession).toHaveBeenCalledTimes(1);
    expect(
      query.mock.calls.map((call) => String(call[0])).join("\n"),
    ).toContain("serving.tower_command_center");
  });

  it("rejects ECL serving rows that do not carry source-record truth refs", async () => {
    mockServingRows({
      tower_command_center: [servingRow({ row_key: "bad-row" })].map((row) => ({
        ...row,
        source_refs_json: [],
      })),
    });

    await expect(
      readTowerCommandCenter({
        tenantKeyCandidates: ["meridian-health"],
      }),
    ).rejects.toThrow("tower_ecl_serving_source_refs_missing");
  });

  it("maps ECL serving views into the existing Tower Command Center contract", async () => {
    mockServingRows({
      tower_command_center: [servingRow()],
      tower_value_proof: [
        servingRow({
          row_key: "value-1",
          page_key: "value_proof",
          baseline_value: "2500000",
          current_value: "500000",
          target_value: "2500000",
        }),
      ],
      tower_decision_lanes: [servingRow()],
      tower_evidence: [
        servingRow({
          row_key: "evidence-1",
          page_key: "evidence",
        }),
      ],
      tower_recommended_actions: [
        servingRow({
          row_key: "action-1",
          page_key: "recommended_actions",
        }),
      ],
      tower_ai_portfolio: [
        servingRow({
          row_key: "ai-1",
          page_key: "ai_portfolio",
          use_case_name: "Claims denial triage",
          tool_name: "Azure OpenAI",
          licensed_users: "100",
          active_users: "45",
          usage_events: "12000",
          monthly_cost_usd: "7500",
          adoption_rate_percent: "45",
        }),
      ],
      tower_cost_lens: [
        servingRow({
          row_key: "cost-1",
          page_key: "cost_lens",
          baseline_value: "2500000",
        }),
      ],
      tower_risk_lens: [
        servingRow({
          row_key: "risk-1",
          page_key: "risk_lens",
          risk_pressure_score: 90,
        }),
      ],
      tower_adoption_lens: [
        servingRow({
          row_key: "adoption-1",
          page_key: "adoption_lens",
        }),
      ],
    });

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian_health_global"],
    });
    const view = buildTowerCommandCenterView(mart, {
      tenantName: "Meridian Health",
    });

    expect(mart?.generatedFrom).toBe("ecl_serving");
    expect(mart?.command.sourceStandard).toContain("serving.tower_*");
    expect(mart?.command.sourceFiles).toContain("SP08_Vendor_Contract");
    expect(mart?.programLanes[0]?.programName).toBe(
      "Revenue-cycle automation",
    );
    expect(mart?.requiredFieldGaps[0]?.sourceRecordId).toBe("source-record-1");
    expect(view?.summary.valueClaimCount).toBeGreaterThan(0);
  });
});
