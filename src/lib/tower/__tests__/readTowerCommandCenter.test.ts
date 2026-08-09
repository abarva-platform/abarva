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

describe("readTowerCommandCenter", () => {
  beforeEach(() => {
    query.mockReset();
    withSession.mockClear();
  });

  it("fails closed for tenants that are not present in governed Tower consumption views", async () => {
    query.mockResolvedValueOnce([]);

    const result = await readTowerCommandCenter({
      tenantKeyCandidates: ["apex-retail"],
    });

    expect(result).toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
    expect(withSession).toHaveBeenCalledTimes(1);
    expect(String(query.mock.calls[0]?.[0])).toContain(
      "consumption.tower_board_posture_v1",
    );
    expect(query.mock.calls[0]?.[1]).toEqual(["apex-retail"]);
  });

  it("maps SkyHarbor aliases through the governed Tower value OS without retired mart or canary fallback reads", async () => {
    query
      .mockResolvedValueOnce([
        {
          command_center_key: "tower:skyharbor_global:board-posture",
          tenant_key: "skyharbor_global",
          tenant_name: "Skyharbor Global",
          mart_version: "tower-value-os-semantic-remediation-v1",
          source_standard:
            "tower.value_case semantic_remediation_v1 -> consumption.tower_*_v1",
          formula_version: "tower_value_os_semantic_remediation_v1",
          source_contract_version:
            "consumption.tower_value_os_contract_v1.semantic_remediation_v1",
          dataset_version: "skyharbor_global_synthetic_current_state_v3",
          source_run_id: "tower-demo-story-data-20260803T172111Z",
          as_of_period: "2030-05-19",
          refresh_timestamp: "2026-08-03T03:07:48.652Z",
          total_it_budget_fy26: "2350000000",
          run_budget_fy26: "1363000000",
          change_budget_fy26: "987000000",
          approved_program_budget_fy26: "1070600000",
          ai_tagged_spend_fy26_non_additive: "170249334",
          promised_value_fy26: null,
          partial_finance_validated_value_ytd: "6471000",
          realized_value_ytd_allowed: "0",
          value_claim_count: 40,
          known_value_claim_count: 0,
          unknown_value_claim_count: 40,
          known_zero_value_claim_count: 0,
          known_value_amount_usd: null,
          finance_attested_claim_count: 18,
          business_attested_claim_count: 75,
          claimable_claim_count: 0,
          usage_supported_claim_count: 29,
          funded_no_baseline_claim_count: 89,
          stale_claim_count: 0,
          disputed_claim_count: 0,
          baseline_linked_claim_count: 75,
          target_linked_claim_count: 75,
          actual_linked_claim_count: 75,
          outcome_measured_claim_count: 75,
          claimable_program_count: 0,
          blocked_program_count: 40,
          conflicted_program_count: 0,
          unmeasured_program_count: 89,
          program_count: 40,
          ai_initiative_count: 12,
          candidate_ai_opportunities: 0,
          watch_pressure_signals: 102,
          finance_validated_blocked_value: "6471000",
          promised_value_exposure: null,
          run_ratio: "0.58",
          change_ratio: "0.42",
          finance_validation_ratio: "0.109756",
          decision_question:
            "Are we buying AI, changing work, and converting it into economic value?",
          executive_summary:
            "Tower separates investment from benefit: approved funding is visible, but no board-certified promised benefit is shown without an explicit benefit assertion.",
          promised_value_board_status: "ABSENT - no explicit benefit assertion",
          promised_value_trust_state: "ABSENT",
          source_files: [
            "tower.value_case semantic_remediation_v1",
            "tower.value_case_period",
            "consumption.tower_*_v1",
          ],
          total_program_subject_count: 151,
          active_program_subject_count: 151,
          material_program_count: 40,
          board_scope_program_count: 40,
          economic_review_queue_count: 40,
        },
      ])
      .mockResolvedValueOnce([
        {
          funnel_key: "tower:skyharbor_global:funnel:promised",
          sequence: 1,
          stage_key: "promised",
          stage_label: "Explicit benefit",
          value_numeric: null,
          claim_count: 40,
          known_value_claim_count: 0,
          unknown_value_claim_count: 40,
          known_value_amount: null,
          blocked_claim_count: 40,
          blocked_known_value_amount: null,
          primary_blocker: "ABSENT - no explicit benefit assertion",
          primary_owner_role: "Tower data steward",
          denominator_stage_key: null,
          conversion_ratio: null,
          claim_status: "ABSENT",
          caveat:
            "Approved funding is not promised benefit; load an explicit benefit assertion before drawing the benefit waterfall.",
          source_file: "consumption.tower_board_posture_v1",
          source_row: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          tenant_key: "skyharbor_global",
          value_case_id: "vc-1",
          program_id: "PRJ-001",
          initiative_id: "PRJ-001",
          value_case_name: "Cloud Landing Zone Modernization Wave 1",
          value_archetype: "capacity",
          period_start: new Date("2030-04-01T00:00:00.000Z"),
          period_end: new Date("2030-06-30T00:00:00.000Z"),
          fiscal_quarter: "2030-Q2",
          scenario: "forecast",
          planned_investment_usd: "5312500",
          actual_spend_usd: null,
          remaining_commitment_usd: "5312500",
          business_case_value_usd: null,
          business_case_benefit_usd: null,
          risk_adjusted_forecast_usd: null,
          finance_validated_run_rate_usd: null,
          realized_p_and_l_usd: null,
          realized_cash_usd: null,
          forecast_at_completion_usd: null,
          financial_conversion_usd: null,
          usage_evidence_state: "present",
          operational_outcome_evidence_state: "missing",
          finance_attestation_state: "missing",
          source_trust_state: "ABSENT",
          claim_state: "evidence_gap",
          dataset_version: "skyharbor_global_synthetic_current_state_v3",
          source_run_id: "tower-demo-story-data-20260803T172111Z",
          source_refs: [{ view: "consumption.tower_value_trajectory_v1" }],
          economic_classification: null,
          board_scope_state: "board_portfolio",
          material_scope_state: "material",
          source_count: 0,
        },
      ])
      .mockResolvedValueOnce([
        {
          decision_ref: "tower:skyharbor_global:decision:vc-1",
          value_case_id: "vc-1",
          program_id: "PRJ-001",
          initiative_id: "PRJ-001",
          program_name: "Cloud Landing Zone Modernization Wave 1",
          owner_role: "Helena Bishop",
          finance_owner_role: "Finance partner",
          decision_lane: "fix",
          decision_rationale:
            "Explicit benefit assertion is missing, so board-visible benefit is absent.",
          approved_funding_usd: "42500000",
          funded_amount: "42500000",
          ai_tagged_spend_usd: "0",
          promised_value_usd: null,
          finance_validated_value_usd: "0",
          known_supported_value: "0",
          proof_maturity_score: 40,
          risk_pressure_score: 95,
          usage_strength_score: 70,
          lineage_trust_state: "ABSENT",
          decision_reason_code: "FIX_SOURCE_TRUST",
          amount_blocked: null,
          next_gate: "explicit_benefit_assertion",
          usage_metric: "usage evidence linked",
          usage_actual: "1",
          adoption_rate_pct: null,
          value_claim_status: "usage_supported",
          tower_claim_allowed: "blocked",
          required_gates: [
            { ask: "Resolve source authority", status: "blocked" },
          ],
          caveat:
            "No promised benefit is shown because no explicit benefit assertion exists. Approved funding remains investment.",
          source_file: "tower.value_case",
          source_row: "claim-project-PRJ-001",
        },
      ])
      .mockResolvedValueOnce([
        {
          ai_portfolio_key: "tower:skyharbor_global:tool:TOOL-github-copilot",
          item_name: "GitHub Copilot",
          item_kind: "usage_benefit",
          vendor_name: "GitHub",
          system_name: "TOOL-github-copilot",
          ai_spend_type: "workforce productivity tool",
          ai_spend_category: "Developer and workforce AI",
          funding_status: "usage_supported",
          decision_lane: "fix",
          approved_funding_usd: "0",
          ai_tagged_spend_usd: "1581589",
          promised_value_usd: null,
          finance_validated_value_usd: "0",
          usage_metric: "active users",
          usage_actual: "4186",
          adoption_rate_pct: "34.89",
          value_score: 35,
          readiness_score: 35,
          risk_score: 50,
          duplicate_risk: null,
          value_claim_status: "adoption_only",
          tower_claim_allowed: "blocked",
          caveat:
            "Usage/adoption evidence is visible but does not become savings without outcome and conversion evidence.",
          source_file: "consumption.tower_metric_observation_deduped_v1",
          source_row: "abc",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          action_key: "pa-source-1",
          sequence: 1,
          action_lane: "fix",
          title: "Load explicit benefit assertion",
          action_body:
            "Board-visible benefit is absent until a source-backed benefit assertion is loaded and classified.",
          owner_hint: "Tower data steward",
          module_handoff: "Moves",
          program_id: "PRJ-001",
          claim_id: "vc-1",
          proof_stage: "lineage",
          blocked_decision: "board_value_claim_or_scale_decision",
          amount_exposed: null,
          evidence_requirement:
            "Explicit benefit assertion with source refs, source run, period, and authoritative owner.",
          expected_source_system:
            "source registry + tower.metric_provenance + source assertions",
          evidence_package_id: "ep-source-1",
          owner_role: "Tower data steward",
          secondary_owner_role: "Finance partner",
          due_window: "14 days",
          due_date: new Date("2030-06-02T00:00:00.000Z"),
          handoff_module: "Moves",
          handoff_entity_id: "PRJ-001",
          handoff_readiness: "not_ready",
          action_state: "open",
          priority: "critical",
        },
      ])
      .mockResolvedValueOnce([
        {
          lineage_key:
            "tower:skyharbor_global:source-trust:board-promised-value",
          surface_section: "board_value_posture",
          displayed_fact: "Board promised benefit",
          displayed_value_text: "ABSENT - no explicit benefit assertion",
          displayed_value_numeric: null,
          metric_or_fact_key: "board_promised_benefit",
          board_visible_label: "Explicit promised benefit",
          lineage_state: "ABSENT",
          source_count: 0,
          source_refs: [{ view: "consumption.tower_board_posture_v1" }],
          conflicting_values: [],
          authoritative_value: null,
          resolution_owner_role: "Tower data steward",
          resolution_state: "open",
          source_file: "consumption.tower_board_posture_v1",
          source_row: null,
          source_system: "tower",
          caveat:
            "Approved funding is visible, but no explicit benefit assertion is loaded.",
        },
      ]);

    const mart = await readTowerCommandCenter({
      tenantKeyCandidates: ["skyharbor-air"],
    });
    const sqlText = query.mock.calls.map((call) => String(call[0])).join("\n");

    expect(withSession).toHaveBeenCalledTimes(1);
    expect(sqlText).toMatch(/consumption\.tower_board_posture_v1/i);
    expect(sqlText).toMatch(/consumption\.tower_value_trajectory_v1/i);
    expect(sqlText).toMatch(/consumption\.tower_portfolio_decision_v1/i);
    expect(sqlText).toMatch(/consumption\.tower_tool_productivity_v1/i);
    expect(sqlText).not.toMatch(/cio_tower\.mart/i);
    expect(sqlText).not.toMatch(/foundation_v2_meridian_health_cube_canary/i);
    expect(mart?.generatedFrom).toBe("tower_schema");
    expect(mart?.headline).toMatch(/separates investment from benefit/i);
    expect(mart?.command.valueClaimCount).toBe(40);
    expect(mart?.command.unknownValueClaimCount).toBe(40);
    expect(mart?.command.promisedValueFy26).toBeNull();
    expect(mart?.command.approvedProgramBudgetFy26).toBe(1_070_600_000);
    expect(mart?.command.partialFinanceValidatedValueYtd).toBe(6_471_000);
    expect(mart?.command.realizedValueYtdAllowed).toBe(0);
    expect(mart?.command.claimableProgramCount).toBe(0);
    expect(mart?.command.blockedProgramCount).toBe(40);
    expect(mart?.command.conflictedProgramCount).toBe(0);
    expect(mart?.command.totalProgramSubjectCount).toBe(151);
    expect(mart?.command.boardScopeProgramCount).toBe(40);
    expect(mart?.command.aiInitiativeCount).toBe(12);
    expect(mart?.programLanes[0]?.lineageTrustState).toBe("ABSENT");
    expect(mart?.valueTrajectory?.[0]?.plannedInvestmentUsd).toBe(5_312_500);
    expect(mart?.valueTrajectory?.[0]?.periodStart).toBe("2030-04-01");
    expect(mart?.valueTrajectory?.[0]?.periodEnd).toBe("2030-06-30");
    expect(mart?.valueTrajectory?.[0]?.financialConversionUsd).toBeNull();
    expect(mart?.programLanes[0]?.amountBlocked).toBeNull();
    expect(mart?.aiPortfolio[0]?.vendorName).toBe("GitHub");
    expect(mart?.cxoActions[0]?.dueDate).toBe("2030-06-02");
    expect(mart?.requiredFieldGaps[0]?.sourceTemplate).toContain(
      "source registry",
    );
    expect(mart?.evidenceLineage[0]?.lineageState).toBe("ABSENT");
    expect(mart?.evidenceLineage[0]?.sourceCount).toBe(0);

    const view = buildTowerCommandCenterView(mart, {
      tenantName: "SkyHarbor Air",
    });
    expect(view?.summary.unknownValueClaimCount).toBe(40);
    expect(view?.summary.promisedUsd).toBe(0);
    expect(view?.summary.promisedBenefitUsd).toBeNull();
    expect(view?.summary.approvedInvestmentUsd).toBe(1_070_600_000);
    expect(view?.valueTrajectory[0]?.plannedInvestmentUsd).toBe(5_312_500);
    expect(view?.conversionBridge[4]?.valueUsd).toBeNull();
    expect(view?.summary.totalProgramSubjectCount).toBe(151);
    expect(view?.summary.boardScopeProgramCount).toBe(40);
    expect(view?.summary.aiInitiativeCount).toBe(12);
    expect(view?.summary.executiveSummary).toMatch(/investment from benefit/i);
  });
});
