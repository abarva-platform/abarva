import { azureRead } from "@/lib/data-plane/azureRead";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { readTowerCommandCenter } from "../readTowerCommandCenter";

jest.mock("@/lib/data-plane/azureRead", () => {
  const query = jest.fn();
  const controls = jest.fn();
  const withSession = jest.fn(async (fn) =>
    fn((sql: string, params: unknown[]) => {
      if (
        /^(BEGIN READ ONLY|COMMIT|ROLLBACK)$/i.test(sql) ||
        /^SET LOCAL ROLE /i.test(sql) ||
        /set_config\('app\.tenant_key'/i.test(sql)
      ) {
        controls(sql, params);
        return Promise.resolve([]);
      }
      return query(sql, params);
    }),
  );

  return {
    azureRead: {
      query,
      controls,
      withSession,
    },
  };
});

const query = azureRead.query as jest.MockedFunction<typeof azureRead.query>;
const controls = (
  azureRead as unknown as { controls: jest.MockedFunction<(sql: string, params: unknown[]) => void> }
).controls;
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
    controls.mockClear();
    withSession.mockClear();
    delete process.env.TOWER_RUNTIME_READ_ROLE;
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

  it("sets a non-bypass runtime role and tenant GUC locally for Tower serving reads", async () => {
    query.mockResolvedValue([]);

    await readTowerCommandCenter({
      tenantKeyCandidates: ["apex-retail"],
    });

    expect(controls.mock.calls.map((call) => call[0])).toEqual([
      "BEGIN READ ONLY",
      'SET LOCAL ROLE "tower_projection_reader"',
      "SELECT set_config('app.tenant_key', $1, true)",
      "COMMIT",
    ]);
    expect(controls.mock.calls[2]?.[1]).toEqual(["apex-retail"]);
  });

  it("rejects unsafe runtime role names before any serving read", async () => {
    process.env.TOWER_RUNTIME_READ_ROLE = "tower_projection_reader; reset role";
    query.mockResolvedValue([]);

    await expect(
      readTowerCommandCenter({
        tenantKeyCandidates: ["apex-retail"],
      }),
    ).rejects.toThrow("tower_invalid_runtime_read_role");

    expect(
      query.mock.calls.some((call) =>
        String(call[0]).includes("serving.tower_command_center"),
      ),
    ).toBe(false);
    expect(controls.mock.calls.map((call) => call[0])).toContain("ROLLBACK");
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

  it("serves only the active Layer 4 assessment when older serving rows remain", async () => {
    const oldAssessmentRow = {
      ...servingRow({
        row_key: "old-row",
        page_key: "command_center",
        promised_value_usd: "999999999",
      }),
      assessment_id: "old-assessment",
      projection_version: 1,
      source_refs_json: [],
    };
    const activeSummaryRow = {
      ...servingRow({
        row_key: "executive_summary",
        page_key: "command_center",
        display_payload_json: {
          layer4_build_version: "tower-layer4-products-v2026-08",
          reviewed_project_count: "140",
          reviewed_project_budget_usd: "703100000",
          ai_related_investment_usd: "211801054",
          projected_annual_value_low_usd: "677763373",
          board_claimable_ytd_usd: "13136248",
        },
      }),
      assessment_id: "active-assessment",
      projection_version: 2,
    };
    const activeValueRow = {
      ...servingRow({
        row_key: "active-value",
        page_key: "value_proof",
        promised_value_usd: "4000000",
        baseline_value: undefined,
      }),
      assessment_id: "active-assessment",
      projection_version: 2,
    };

    mockServingRows({
      tower_command_center: [oldAssessmentRow, activeSummaryRow],
      tower_value_proof: [
        {
          ...oldAssessmentRow,
          page_key: "value_proof",
          row_key: "old-value",
        },
        activeValueRow,
      ],
      tower_decision_lanes: [],
      tower_evidence: [],
      tower_recommended_actions: [],
      tower_ai_portfolio: [],
      tower_cost_lens: [],
      tower_risk_lens: [],
      tower_adoption_lens: [],
    });

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });

    expect(mart?.command.martVersion).toBe("ecl-serving-v2");
    expect(mart?.command.approvedProgramBudgetFy26).toBeNull();
    expect(mart?.command.aiTaggedSpendFy26NonAdditive).toBe(211801054);
    expect(mart?.command.promisedValueFy26).toBeNull();
    expect(mart?.command.claimableValue).toBe(0);
    expect(mart?.command.knownValueAmountUsd).toBe(0);
  });

  it("maps ECL serving views into the existing Tower Command Center contract", async () => {
    mockServingRows({
      tower_command_center: [
        servingRow({
          row_key: "executive_summary",
          page_key: "command_center",
          claim_gate_status: "not_applicable",
          as_of_period: "2026-08-24",
          refresh_timestamp: "2026-08-29T19:20:00.000Z",
        }),
      ],
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
          primary_object_id: undefined,
          contract_id: "MER-TECH-IMS-001",
          handoff_module: "Source",
        }),
      ],
      tower_ai_portfolio: [
        servingRow({
          row_key: "ai-1",
          page_key: "ai_portfolio",
          use_case_object_id: "use-case-1",
          display_payload_json: { page_key: "ai_portfolio", title: "Case one" },
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
          use_case_object_id: "use-case-1",
          tool_object_id: "tool-1",
          display_payload_json: { page_key: "adoption_lens", title: "Usage observation" },
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
    expect(mart?.aiPortfolio.map((row) => row.populationKind)).toEqual(["ai_case", "usage_observation"]);
    expect(mart?.aiPortfolio[0]?.valueScoreLoaded).toBe(false);
    expect(view?.summary.aiInitiativeCount).toBe(1);
    expect(view?.allInitiatives[0]?.valueScoreLoaded).toBe(false);
    expect(view?.allInitiatives[0]?.posture).toBe("Needs evidence");
    expect(view?.usageObservations).toHaveLength(1);
    expect(view?.allInitiatives).toHaveLength(1);
    expect(view?.portfolioCounts.excludedItemCount).toBe(0);
    expect(mart?.command.sourceStandard).toContain(
      "Governed Tower read from finance, program, contract, and control evidence",
    );
    expect(mart?.command.sourceFiles).toContain("SP08_Vendor_Contract");
    expect(mart?.programLanes[0]?.programName).toBe("Revenue-cycle automation");
    expect(mart?.cxoActions[0]?.handoffEntityId).toBe("MER-TECH-IMS-001");
    expect(mart?.requiredFieldGaps[0]?.sourceRecordId).toBe("source-record-1");
    expect(mart?.headline).toContain("1 value claim");
    expect(mart?.headline).toContain("8 separate review rows");
    expect(mart?.headline).not.toContain("ECL");
    expect(mart?.command.executiveSummary).toContain("1 value claim");
    expect(mart?.command.executiveSummary).not.toContain("ECL");
    expect(mart?.command.asOfPeriod).toBe("2026-08-24");
    expect(mart?.command.refreshTimestamp).toBe("2026-08-29T19:20:00.000Z");
    expect(view?.summary.valueClaimCount).toBeGreaterThan(0);
    expect(view?.summary.valueClaimCount).toBe(1);
    expect(view?.summary.knownValueClaimCount).toBe(0);
    expect(view?.summary.unknownValueClaimCount).toBe(1);
    expect(view?.summary.economicReviewQueueCount).toBeGreaterThan(
      view?.summary.valueClaimCount ?? 0,
    );
  });

  it("leaves freshness absent when serving rows do not record it", async () => {
    mockServingRows({
      tower_command_center: [servingRow()],
      tower_value_proof: [servingRow({ page_key: "value_proof" })],
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

    expect(mart?.command.asOfPeriod).toBeNull();
    expect(mart?.command.refreshTimestamp).toBeNull();
  });

  it("does not call Finance-reviewed dollars usage-supported without separate usage evidence", async () => {
    const caseDisplay = {
      title: "Revenue-cycle automation",
      finance_reviewed_value_usd: "500000",
    };
    mockServingRows({
      tower_command_center: [servingRow({ row_key: "executive_summary" })],
      tower_value_proof: [
        servingRow({
          row_key: "case-1",
          page_key: "value_proof",
          usage_supported_value_usd: "500000",
          display_payload_json: caseDisplay,
        }),
      ],
      tower_decision_lanes: [
        servingRow({
          row_key: "case-1",
          usage_supported_value_usd: "500000",
          usage_strength_score: 70,
          display_payload_json: caseDisplay,
        }),
      ],
    });

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });
    const view = buildTowerCommandCenterView(mart, { tenantName: "Demo" });

    expect(mart?.command.usageSupportedClaimCount).toBe(0);
    expect(mart?.valueFunnel.find((stage) => stage.stageKey === "usage_supported")?.valueNumeric).toBeNull();
    expect(mart?.programLanes[0]?.knownSupportedValue).toBeNull();
    expect(mart?.programLanes[0]?.adoptionRatePct).toBeNull();
    expect(view?.summary.usageSupportedValueMeasured).toBe(false);
    expect(view?.summary.usageSupportedValueCoverage).toBe("none");
    expect(view?.programs[0]?.usageSupportedValueMeasured).toBe(false);
    expect(view?.conversionBridge.find((stage) => stage.key === "adoption")?.valueUsd).toBeNull();
  });

  it("keeps a separately evidenced usage-supported amount", async () => {
    const usageRefs = [{
      source_family: "Usage ledger",
      source_record_id: "usage-1",
      source_field: "usage_supported_value_usd",
    }];
    mockServingRows({
      tower_command_center: [servingRow({ row_key: "executive_summary" })],
      tower_value_proof: [{
        ...servingRow({ row_key: "case-1", page_key: "value_proof" }),
        source_refs_json: usageRefs,
      }, servingRow({
        row_key: "case-2",
        claim_id: "claim-2",
        page_key: "value_proof",
        usage_supported_value_usd: "750000",
      })],
      tower_decision_lanes: [{
        ...servingRow({ row_key: "case-1" }),
        source_refs_json: usageRefs,
      }, servingRow({
        row_key: "case-2",
        claim_id: "claim-2",
        usage_supported_value_usd: "750000",
      })],
    });

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });
    const view = buildTowerCommandCenterView(mart, { tenantName: "Demo" });

    expect(mart?.command.usageSupportedClaimCount).toBe(1);
    expect(mart?.programLanes[0]?.knownSupportedValue).toBe(500000);
    expect(view?.summary.usageSupportedValueMeasured).toBe(true);
    expect(view?.summary.usageSupportedValueCoverage).toBe("partial");
    expect(view?.summary.usageSupportedUsd).toBe(500000);
    expect(view?.programs.find((program) => program.id === "claim-2")?.usageSupportedValueMeasured).toBe(false);
  });

  it("honors display payload metrics and keeps adoption lens rows as tools", async () => {
    mockServingRows({
      tower_command_center: [
        servingRow({
          row_key: "executive_summary",
          page_key: "command_center",
          display_payload_json: {
            reviewed_project_count: "140",
            reviewed_project_budget_usd: "703100000",
            ai_related_investment_usd: "211801054",
            projected_annual_value_low_usd: "677763373",
            board_claimable_ytd_usd: "13136248",
          },
        }),
      ],
      tower_value_proof: [
        servingRow({
          row_key: "case-1",
          page_key: "value_proof",
          baseline_value: "2500000",
          promised_value_usd: undefined,
          usage_supported_value_usd: undefined,
          finance_validated_value_usd: undefined,
          display_payload_json: {
            finance_validated_value_usd: "900000",
            usage_supported_value_usd: "850000",
          },
        }),
      ],
      tower_decision_lanes: [servingRow({ row_key: "case-1" })],
      tower_evidence: [servingRow({ page_key: "evidence" })],
      tower_recommended_actions: [
        servingRow({ page_key: "recommended_actions" }),
      ],
      tower_ai_portfolio: [
        servingRow({
          row_key: "BC-MER-003",
          page_key: "ai_portfolio",
          use_case_name: "ServiceNow operations AI rollout",
          tool_name: "ServiceNow Now Assist",
          monthly_cost_usd: undefined,
          promised_value_usd: undefined,
          finance_validated_value_usd: undefined,
          display_payload_json: {
            item_kind: "funded_program",
            ai_spend_category: "Operations automation",
            approved_funding_usd: "10400000",
            projected_annual_value_low_usd: "51180318",
            finance_validated_value_usd: "1200000",
            readiness_score: "64",
            risk_score: "38",
          },
        }),
      ],
      tower_cost_lens: [servingRow({ page_key: "cost_lens" })],
      tower_risk_lens: [servingRow({ page_key: "risk_lens" })],
      tower_adoption_lens: [
        servingRow({
          row_key: "TOOL-MER-001",
          page_key: "adoption_lens",
          use_case_name: "ServiceNow Now Assist",
          tool_name: "ServiceNow",
          display_payload_json: {
            monthly_active_users: "2756",
            rollout_target_users: "5200",
            adoption_actual_pct: "53",
          },
        }),
      ],
    });

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });

    expect(mart?.command.approvedProgramBudgetFy26).toBeNull();
    expect(mart?.command.totalProgramSubjectCount).toBe(140);
    expect(mart?.command.aiTaggedSpendFy26NonAdditive).toBe(211801054);
    expect(mart?.command.promisedValueFy26).toBeNull();
    expect(mart?.command.claimableValue).toBe(0);
    expect(mart?.command.partialFinanceValidatedValueYtd).toBe(0);
    expect(mart?.command.financeValidationRatio).toBeNull();
    expect(mart?.command.blockedValueComparable).toBe(false);
    expect(mart?.command.comparableBlockedValue).toBeNull();
    expect(mart?.programLanes[0]?.amountBlocked).toBeNull();
    expect(mart?.programLanes[0]?.blockedAmountComparable).toBe(false);
    expect(mart?.aiPortfolio).toHaveLength(2);
    expect(mart?.aiPortfolio.map((row) => row.aiPortfolioKey)).toContain(
      "TOOL-MER-001",
    );
    expect(
      mart?.aiPortfolio.find((row) => row.aiPortfolioKey === "TOOL-MER-001")
        ?.usageActual,
    ).toBe(2756);
    expect(
      mart?.aiPortfolio.find((row) => row.aiPortfolioKey === "TOOL-MER-001")
        ?.adoptionRatePct,
    ).toBe(53);
    const aiCase = mart?.aiPortfolio.find(
      (row) => row.aiPortfolioKey === "BC-MER-003",
    );
    expect(aiCase?.itemKind).toBe("funded_program");
    expect(aiCase?.aiSpendCategory).toBe("Operations automation");
    expect(aiCase?.approvedFundingUsd).toBe(0);
    expect(aiCase?.aiTaggedSpendUsd).toBe(0);
    expect(aiCase?.aiAmountBasis).toBe("unknown");
    expect(aiCase?.promisedValueUsd).toBeNull();
    expect(aiCase?.financeValidatedValueUsd).toBe(0);
    expect(aiCase?.usageMetric).toBeNull();
    expect(aiCase?.usageActual).toBeNull();
    expect(aiCase?.adoptionRatePct).toBeNull();
    const tool = mart?.aiPortfolio.find(
      (row) => row.aiPortfolioKey === "TOOL-MER-001",
    );
    expect(tool?.aiAmountBasis).toBe("unknown");
    expect(tool?.aiSpendLoaded).toBe(false);
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
    expect(mart?.command.promisedValueFy26).toBeNull();
    expect(mart?.valueFunnel[0]?.valueNumeric).toBeNull();
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

  it.each([
    "source_cloud_value_gate",
    "source_contract_depth_value_gate",
  ])("keeps legacy %s spend out of benefit and outcome measures", async (rowType) => {
    const opportunity = {
      ...servingRow({
        row_key: "candidate-opportunity",
        page_key: "value_proof",
        promised_value_usd: undefined,
        baseline_value: "12000000",
        current_value: "9000000",
        target_value: "3000000",
        blocked_value_usd: "3000000",
        period_start: "2026-01-01",
        period_end: "2026-12-31",
        fiscal_quarter: "2026-Q4",
        display_payload_json: {
          bridge_source: "source_cloud_consumption_layer4",
          annual_value_exposed: "3000000",
          addressable_spend: "12000000",
          actual_annual_spend: "9000000",
        },
      }),
      row_type: rowType,
    };
    mockServingRows({
      tower_command_center: [
        servingRow({
          row_key: "executive_summary",
          page_key: "command_center",
          promised_value_usd: undefined,
          display_payload_json: {},
        }),
      ],
      tower_value_proof: [opportunity],
    });

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });

    expect(mart?.command.promisedValueFy26).toBeNull();
    expect(mart?.command.knownValueAmountUsd).toBe(0);
    expect(mart?.command.promisedValueExposure).toBeNull();
    expect(mart?.command.valueClaimCount).toBe(1);
    expect(mart?.command.knownValueClaimCount).toBe(0);
    expect(mart?.command.unknownValueClaimCount).toBe(1);
    expect(mart?.command.baselineLinkedClaimCount).toBe(0);
    expect(mart?.command.targetLinkedClaimCount).toBe(0);
    expect(mart?.command.actualLinkedClaimCount).toBe(0);
    expect(mart?.command.outcomeMeasuredClaimCount).toBe(0);
    expect(mart?.valueFunnel[0]?.valueNumeric).toBeNull();
    expect(mart?.valueFunnel[0]?.knownValueClaimCount).toBe(0);
    expect(mart?.valueFunnel[0]?.unknownValueClaimCount).toBe(1);
    expect(mart?.valueTrajectory).toEqual([]);
    expect(mart?.command.sourceFiles).toContain("SP08_Vendor_Contract");
  });

  it("uses an annual source amount for actions and leaves absent amounts unloaded", async () => {
    mockServingRows({
      tower_command_center: [
        servingRow({ row_key: "executive_summary", page_key: "command_center" }),
      ],
      tower_recommended_actions: [
        servingRow({
          row_key: "annual-action",
          page_key: "recommended_actions",
          blocked_value_usd: "9000000",
          projected_annual_value_low_usd: "2500000",
        }),
        servingRow({
          row_key: "unloaded-action",
          page_key: "recommended_actions",
          blocked_value_usd: "9000000",
          projected_annual_value_low_usd: undefined,
        }),
      ],
    });

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });

    expect(mart?.cxoActions.map((action) => action.amountExposed)).toEqual([
      2500000,
      null,
    ]);
  });

  it("accepts blocked dollars only with matching source periods", async () => {
    mockServingRows({
      tower_command_center: [
        servingRow({ row_key: "executive_summary", page_key: "command_center" }),
      ],
      tower_decision_lanes: [
        servingRow({
          row_key: "matched",
          blocked_value_usd: "300000",
          blocked_value_basis: "same_period_claim_gap",
          blocked_value_period_start: "2026-01-01",
          blocked_value_period_end: "2026-03-31",
          claimable_value_period_start: "2026-01-01",
          claimable_value_period_end: "2026-03-31",
        }),
        servingRow({
          row_key: "mismatched",
          blocked_value_usd: "700000",
          blocked_value_basis: "same_period_claim_gap",
          blocked_value_period_start: "2026-01-01",
          blocked_value_period_end: "2026-12-31",
          claimable_value_period_start: "2026-01-01",
          claimable_value_period_end: "2026-03-31",
        }),
      ],
    });

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });
    expect(mart?.programLanes[0]?.amountBlocked).toBe(300000);
    expect(mart?.programLanes[0]?.blockedAmountComparable).toBe(true);
    expect(mart?.programLanes[1]?.amountBlocked).toBeNull();
    expect(mart?.programLanes[1]?.blockedAmountComparable).toBe(false);
  });

  it("does not turn annualized tool cost into approved program funding", async () => {
    const toolRow = servingRow({
      row_key: "tool-rollout",
      page_key: "ai_portfolio",
      funded_amount_usd: undefined,
      monthly_cost_usd: "10000",
      display_payload_json: {
        item_kind: "tool_rollout",
        monthly_cost_usd: "10000",
      },
    });
    mockServingRows({
      tower_command_center: [
        servingRow({
          row_key: "executive_summary",
          page_key: "command_center",
          funded_amount_usd: undefined,
          display_payload_json: {},
        }),
      ],
      tower_ai_portfolio: [toolRow],
    });

    const withoutDecision = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });
    expect(withoutDecision?.command.approvedProgramBudgetFy26).toBeNull();
    expect(withoutDecision?.aiPortfolio[0]).toMatchObject({
      approvedFundingUsd: 0,
      aiTaggedSpendUsd: 120000,
      aiAmountBasis: "annualized_tool_cost",
      aiSpendLoaded: true,
    });
    const view = buildTowerCommandCenterView(withoutDecision, {
      tenantName: "Example",
    });
    expect(view?.allInitiatives[0]?.aiAmountBasis).toBe(
      "annualized_tool_cost",
    );

    mockServingRows({
      tower_command_center: [
        servingRow({
          row_key: "executive_summary",
          page_key: "command_center",
          funded_amount_usd: undefined,
          display_payload_json: {},
        }),
      ],
      tower_decision_lanes: [
        servingRow({ page_key: "decision_lanes", funded_amount_usd: "50000" }),
      ],
      tower_ai_portfolio: [toolRow],
    });

    const withDecision = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });
    expect(withDecision?.command.approvedProgramBudgetFy26).toBeNull();
    expect(withDecision?.aiPortfolioCounts?.funded).toBe(0);

    mockServingRows({
      tower_command_center: [
        servingRow({
          row_key: "executive_summary",
          page_key: "command_center",
          promised_value_usd: undefined,
          display_payload_json: {},
        }),
      ],
      tower_ai_portfolio: [
        servingRow({
          row_key: "unpriced-tool",
          page_key: "ai_portfolio",
          funded_amount_usd: undefined,
          monthly_cost_usd: "10000",
          display_payload_json: { item_kind: "tool_rollout" },
        }),
      ],
    });
    const withoutRecordedCost = await readTowerCommandCenter({
      tenantKeyCandidates: ["meridian-health"],
    });
    expect(withoutRecordedCost?.aiPortfolio[0]).toMatchObject({
      aiTaggedSpendUsd: 0,
      aiAmountBasis: "unknown",
      aiSpendLoaded: false,
    });
  });

  it("shows financial amounts only with an explicit fiscal basis and approved evidence", async () => {
    mockServingRows({
      tower_command_center: [
        servingRow({
          row_key: "executive_summary",
          page_key: "command_center",
          display_payload_json: {
            approved_fy_budget_usd: "100000000",
            approved_project_fy_budget_usd: "70000000",
            fiscal_year: "FY2026",
            budget_approval_status: "approved",
            projected_annual_value_low_usd: "5000000",
            benefit_reconciliation_status: "reconciled",
            benefit_period: "annual",
          },
        }),
      ],
      tower_value_proof: [
        servingRow({
          row_key: "approved-claim",
          page_key: "value_proof",
          claim_gate_status: "claimable",
          display_payload_json: {
            projected_annual_value_low_usd: "5000000",
            benefit_reconciliation_status: "reconciled",
            benefit_period: "annual",
            evidence_approval_status: "approved",
            finance_validation_status: "finance_validated",
            finance_validated_value_usd: "2000000",
            claimable_value_usd: "1500000",
            claimable_value_period_start: "2026-01-01",
            claimable_value_period_end: "2026-06-30",
          },
        }),
      ],
    });

    const mart = await readTowerCommandCenter({ tenantKeyCandidates: ["meridian-health"] });
    expect(mart?.command.totalItBudgetFy26).toBe(100000000);
    expect(mart?.command.approvedProgramBudgetFy26).toBe(70000000);
    expect(mart?.command.promisedValueFy26).toBe(5000000);
    expect(mart?.command.partialFinanceValidatedValueYtd).toBe(2000000);
    expect(mart?.command.claimableValue).toBe(1500000);
    expect(mart?.command.claimableClaimCount).toBe(1);
  });

  it("accepts an expressly approved FY26 budget and leaves absent decisions unclassified", async () => {
    mockServingRows({
      tower_command_center: [servingRow({
        row_key: "executive_summary",
        page_key: "command_center",
        display_payload_json: {
          approved_fy_budget_usd: "100000000",
          fiscal_year: "FY26",
          budget_approval_status: "approved",
        },
      })],
      tower_decision_lanes: [servingRow({
        row_key: "planning-program",
        claim_gate_status: "blocked",
        display_payload_json: { title: "Planning program", decision_lane: null },
      })],
      tower_recommended_actions: [servingRow({
        row_key: "evidence-task",
        page_key: "recommended_actions",
        display_payload_json: { title: "Reconcile evidence", decision_lane: null },
      })],
    });

    const mart = await readTowerCommandCenter({ tenantKeyCandidates: ["meridian-health"] });
    const view = buildTowerCommandCenterView(mart, { tenantName: "Example" });
    expect(mart?.command.totalItBudgetFy26).toBe(100000000);
    expect(mart?.programLanes[0]?.decisionLane).toBe("unclassified");
    expect(view?.programs[0]?.lane).toBe("unclassified");
    expect(view?.actions[0]?.lane).toBe("unclassified");
  });

  it("requires a valid date period and an explicit claim amount before reporting value", async () => {
    const claim = (amount: string | null, start: string, end: string) => servingRow({
      row_key: "claim-1",
      page_key: "value_proof",
      claim_gate_status: "claimable",
      display_payload_json: {
        evidence_approval_status: "approved",
        finance_validation_status: "finance_validated",
        finance_validated_value_usd: "2000000",
        claimable_value_usd: amount,
        claimable_value_period_start: start,
        claimable_value_period_end: end,
      },
    });
    for (const [amount, start, end, expected, loaded] of [
      [null, "2026-01-01", "2026-06-30", 0, false],
      ["1500000", "2026-02-30", "2026-06-30", 0, false],
      ["1500000", "2026-01-01", "2026-06-31", 0, false],
      ["1500000", "2026-07-01", "2026-06-30", 0, false],
      ["-1", "2026-01-01", "2026-06-30", 0, false],
      ["0", "2026-01-01", "2026-06-30", 0, true],
      ["1500000", "2026-01-01", "2026-06-30", 1500000, true],
    ] as const) {
      mockServingRows({
        tower_command_center: [servingRow({ row_key: "executive_summary", page_key: "command_center" })],
        tower_value_proof: [claim(amount, start, end)],
        tower_decision_lanes: [claim(amount, start, end)],
      });
      const mart = await readTowerCommandCenter({ tenantKeyCandidates: ["meridian-health"] });
      const view = buildTowerCommandCenterView(mart, { tenantName: "Example" });
      expect(mart?.command.claimableValue).toBe(expected);
      expect(mart?.programLanes[0]?.reportableClaimableValueUsd).toBe(loaded ? expected : null);
      expect(view?.programs[0]?.claimableUsd).toBe(expected);
      expect(view?.programs[0]?.claimableAmountLoaded).toBe(loaded);
    }
  });

  it("keeps unknown Finance and AI spend distinct from recorded zero", async () => {
    mockServingRows({
      tower_command_center: [servingRow({ row_key: "executive_summary", page_key: "command_center" })],
      tower_decision_lanes: [servingRow({
        row_key: "unknown-finance",
        display_payload_json: {
          title: "Unknown Finance amount",
          evidence_approval_status: "approved",
          finance_validation_status: "finance_validated",
          finance_validated_value_usd: null,
        },
      })],
      tower_ai_portfolio: [servingRow({
        row_key: "unknown-ai",
        page_key: "ai_portfolio",
        display_payload_json: { item_kind: "tool_rollout", monthly_cost_usd: null },
      })],
    });
    const mart = await readTowerCommandCenter({ tenantKeyCandidates: ["meridian-health"] });
    const view = buildTowerCommandCenterView(mart, { tenantName: "Example" });
    expect(mart?.programLanes[0]?.financeValidatedAmountLoaded).toBe(false);
    expect(view?.programs[0]?.financeValidatedAmountLoaded).toBe(false);
    expect(mart?.aiPortfolio[0]?.aiSpendLoaded).toBe(false);
    expect(view?.allInitiatives[0]?.aiAmountBasis).toBe("unknown");
    expect(view?.allInitiatives[0]?.financeValidatedAmountLoaded).toBe(false);

    mockServingRows({
      tower_command_center: [servingRow({ row_key: "executive_summary", page_key: "command_center" })],
      tower_decision_lanes: [servingRow({
        row_key: "known-zero-finance",
        display_payload_json: {
          title: "Known zero Finance amount",
          evidence_approval_status: "approved",
          finance_validation_status: "finance_validated",
          finance_validated_value_usd: "0",
        },
      })],
      tower_ai_portfolio: [servingRow({
        row_key: "known-zero-ai",
        page_key: "ai_portfolio",
        display_payload_json: {
          item_kind: "tool_rollout",
          monthly_cost_usd: "0",
          evidence_approval_status: "approved",
          finance_validation_status: "finance_validated",
          finance_validated_value_usd: "0",
        },
      })],
    });
    const zeroMart = await readTowerCommandCenter({ tenantKeyCandidates: ["meridian-health"] });
    const zeroView = buildTowerCommandCenterView(zeroMart, { tenantName: "Example" });
    expect(zeroMart?.programLanes[0]?.financeValidatedAmountLoaded).toBe(true);
    expect(zeroMart?.aiPortfolio[0]?.aiSpendLoaded).toBe(true);
    expect(zeroMart?.aiPortfolio[0]?.aiTaggedSpendUsd).toBe(0);
    expect(zeroView?.allInitiatives[0]?.financeValidatedAmountLoaded).toBe(true);
  });

  it("shows only a reconciled active cost breakdown and keeps contracts separate", async () => {
    const ref = (file: string, row: number) => ({ source_file: file, source_row: row, source_sha256: "source-hash" });
    const cost = (key: string, value: number, title: string, refs: ReturnType<typeof ref>[], extras: Record<string, unknown>) => ({
      ...servingRow({
        row_key: key,
        page_key: "cost_lens",
        display_payload_json: { title, value, canonical_measure_id: `measure:${key}`, ...extras },
        measure_id: `measure:${key}`,
        measure_value_number: value,
      }),
      row_type: "cost_exposure",
      value_state: "estimated",
      projection_version: 4,
      source_refs_json: refs,
    });
    const categoryRefs = [ref("08_spend_value.csv", 2), ref("08_spend_value.csv", 3)];
    const rows = [
      cost("modeled_annual_spend", 10_000_000, "Modeled annual IT spend", categoryRefs, {
        money_population: "modeled_it_spend", amount_role: "aggregate",
        period_basis: "annual_unspecified_year", additive_to_category_rows: false,
        additive_to_contract_spend: false, source_narrative_difference_usd: 100_000,
      }),
      cost("spend:2", 6_000_000, "Infrastructure", [categoryRefs[0]], {
        source_row_identity_only: true, category_business_id: null,
        additive_to_aggregate_spend: false, additive_to_contract_spend: false,
        period_basis: "annual_unspecified_year",
      }),
      cost("spend:3", 4_000_000, "Applications", [categoryRefs[1]], {
        source_row_identity_only: true, category_business_id: null,
        additive_to_aggregate_spend: false, additive_to_contract_spend: false,
        period_basis: "annual_unspecified_year",
      }),
      cost("contract:one", 9_000_000, "Vendor one", [ref("07_vendors_contracts.csv", 2)], {
        additive_to_it_spend: false,
      }),
    ];
    mockServingRows({
      tower_command_center: [{ ...servingRow({ row_key: "executive_summary", page_key: "command_center" }), projection_version: 4 }],
      tower_cost_lens: [...rows, { ...rows[0], projection_version: 3, source_refs_json: [] }],
    });
    const mart = await readTowerCommandCenter({ tenantKeyCandidates: ["meridian-health"] });
    const view = buildTowerCommandCenterView(mart, { tenantName: "Example" });
    expect(view?.costLens?.modeledAnnualSpendUsd).toBe(10_000_000);
    expect(view?.costLens?.categories).toHaveLength(2);
    expect(view?.costLens?.contractExposure[0]?.amountUsd).toBe(9_000_000);
    expect(view?.costLens?.categories[0]?.sourceRow).toBe(2);

    mockServingRows({
      tower_command_center: [{ ...servingRow({ row_key: "executive_summary", page_key: "command_center" }), projection_version: 4 }],
      tower_cost_lens: [rows[0], { ...rows[1], payload_json: { ...rows[1].payload_json, display_payload_json: { ...rows[1].payload_json.display_payload_json, value: 6_000_001 } } }, rows[2], rows[3]],
    });
    const mismatched = await readTowerCommandCenter({ tenantKeyCandidates: ["meridian-health"] });
    expect(mismatched?.costLens).toBeNull();

    mockServingRows({
      tower_command_center: [{ ...servingRow({ row_key: "executive_summary", page_key: "command_center" }), projection_version: 4 }],
      tower_cost_lens: [rows[0], { ...rows[1], payload_json: { ...rows[1].payload_json, measure_value_number: 5_000_000 } }, rows[2], rows[3]],
    });
    const canonicalMismatch = await readTowerCommandCenter({ tenantKeyCandidates: ["meridian-health"] });
    expect(canonicalMismatch?.costLens).toBeNull();
  });
});
