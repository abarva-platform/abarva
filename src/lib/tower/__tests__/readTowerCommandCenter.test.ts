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
    projection_row_id: `projection-${payload.row_key}`,
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
    expect(mart?.command.sourceStandard).toContain(
      "Governed Tower read from finance, program, contract, and control evidence",
    );
    expect(mart?.command.sourceFiles).toContain("SP08_Vendor_Contract");
    expect(mart?.programLanes[0]?.programName).toBe("Revenue-cycle automation");
    expect(mart?.requiredFieldGaps[0]?.sourceRecordId).toBe("source-record-1");
    expect(mart?.headline).toContain("1 value claim");
    expect(mart?.headline).toContain("8 separate review rows");
    expect(mart?.headline).not.toContain("ECL");
    expect(mart?.command.executiveSummary).toContain("1 value claim");
    expect(mart?.command.executiveSummary).not.toContain("ECL");
    expect(view?.summary.valueClaimCount).toBeGreaterThan(0);
    expect(view?.summary.valueClaimCount).toBe(1);
    expect(view?.summary.knownValueClaimCount).toBe(1);
    expect(view?.summary.unknownValueClaimCount).toBe(0);
    expect(view?.summary.economicReviewQueueCount).toBeGreaterThan(
      view?.summary.valueClaimCount ?? 0,
    );
  });

  it("maps ECL serving rows with recorded periods into value trajectory points", async () => {
    mockServingRows({
      tower_command_center: [servingRow()],
      tower_value_proof: [
        servingRow({
          row_key: "contract-value",
          page_key: "value_proof",
          baseline_value: "2500000",
          current_value: "500000",
          target_value: "2500000",
        }),
        servingRow({
          row_key: "value-q1",
          page_key: "value_proof",
          claim_id: "claim-q1",
          period_start: "2026-01-01",
          period_end: "2026-03-31",
          planned_investment_usd: "1200000",
          actual_spend_usd: "800000",
          risk_adjusted_forecast_usd: "1750000",
          finance_validated_run_rate_usd: "600000",
          financial_conversion_usd: "250000",
          trajectory_only: true,
        }),
      ],
      tower_decision_lanes: [servingRow()],
      tower_evidence: [servingRow({ page_key: "evidence" })],
      tower_recommended_actions: [
        servingRow({ page_key: "recommended_actions" }),
      ],
      tower_ai_portfolio: [servingRow({ page_key: "ai_portfolio" })],
      tower_cost_lens: [servingRow({ page_key: "cost_lens" })],
      tower_risk_lens: [servingRow({ page_key: "risk_lens" })],
      tower_adoption_lens: [servingRow({ page_key: "adoption_lens" })],
    });

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });

    expect(mart?.valueTrajectory).toHaveLength(1);
    expect(mart?.command.promisedValueFy26).toBe(5000000);
    expect(mart?.valueFunnel[0]?.valueNumeric).toBe(5000000);
    expect(mart?.valueTrajectory?.[0]).toMatchObject({
      fiscalQuarter: "2026-Q1",
      periodStart: "2026-01-01",
      periodEnd: "2026-03-31",
      plannedInvestmentUsd: 1200000,
      actualSpendUsd: 800000,
      riskAdjustedForecastUsd: 1750000,
      financeValidatedRunRateUsd: 600000,
      financialConversionUsd: 250000,
      sourceCount: 1,
    });
  });

  it("does not synthesize trajectory points when ECL rows lack period evidence", async () => {
    mockServingRows({
      tower_command_center: [servingRow()],
      tower_value_proof: [
        servingRow({
          row_key: "value-without-period",
          page_key: "value_proof",
          baseline_value: "2500000",
          current_value: "500000",
          target_value: "2500000",
        }),
      ],
      tower_decision_lanes: [servingRow()],
      tower_evidence: [servingRow({ page_key: "evidence" })],
      tower_recommended_actions: [
        servingRow({ page_key: "recommended_actions" }),
      ],
      tower_ai_portfolio: [servingRow({ page_key: "ai_portfolio" })],
      tower_cost_lens: [servingRow({ page_key: "cost_lens" })],
      tower_risk_lens: [servingRow({ page_key: "risk_lens" })],
      tower_adoption_lens: [servingRow({ page_key: "adoption_lens" })],
    });

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });

    expect(mart?.valueTrajectory).toEqual([]);
  });
});
